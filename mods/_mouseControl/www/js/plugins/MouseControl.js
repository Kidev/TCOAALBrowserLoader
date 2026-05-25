/*
 * Enables full mouse/touch control for TCOAAL browser port.
 * Neutralizes the DisableMouse plugin and adds click-to-move, right-click
 * menu/cancel, single-click menus, hover-to-select choices, contextual cursors,
 * and mobile touch support (two-finger tap = escape).
 *
 * DisableMouse.js replaces TouchInput._onMouseDown with a no-op. lang-shim.js
 * patches TouchInput._setupEventHandlers to use indirect-lookup wrappers
 * (e.g. function (e) { TouchInput._onTouchStart(e); } instead of
 * this._onTouchStart.bind(this)), so reassigning these methods here at
 * plugin-load time takes effect on the live DOM listeners: no need to
 * re-register fresh listeners on top.
 */

(function () {
  "use strict";

  if (typeof TouchInput === "undefined" || typeof Graphics === "undefined")
    return;

  // Touch-primary detection (matches lang-shim.js's _isMobile). On mobile,
  // browsers (including Brave's mobile simulator) emit synthetic mousedown
  // events alongside touchstart for compatibility. The mouse path below
  // fires _onTrigger immediately, which beats the touch path's deferred
  // swipe detection: touch-and-hold-then-swipe registers as a tap on the
  // item under the finger before the move can be classified as a swipe.
  var _isMobile =
    /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

  // 1. Restore stock mouse handlers on TouchInput. lang-shim's indirect-lookup
  //    DOM listeners pick up these reassignments automatically.

  TouchInput._onMouseDown = function (event) {
    if (event.button === 0) {
      this._onLeftButtonDown(event);
    } else if (event.button === 1) {
      this._onMiddleButtonDown(event);
    } else if (event.button === 2) {
      this._onRightButtonDown(event);
    }
  };

  TouchInput._onLeftButtonDown = function (event) {
    // On touch-primary devices, suppress the immediate trigger from
    // synthetic mousedown events. The touch handlers below own click
    // gesture recognition and will defer/fire _onTrigger appropriately.
    // Right-click cancel and middle-click are left intact for any genuine
    // pointer device a mobile user might pair.
    if (_isMobile) return;
    var x = Graphics.pageToCanvasX(event.pageX);
    var y = Graphics.pageToCanvasY(event.pageY);
    if (Graphics.isInsideCanvas(x, y)) {
      this._mousePressed = true;
      this._pressedTime = 0;
      _pressStartedOnPlayer = isOnMap() && isOnPlayerTile(x, y);
      this._onTrigger(x, y);
    }
  };

  TouchInput._onMouseMove = function (event) {
    var x = Graphics.pageToCanvasX(event.pageX);
    var y = Graphics.pageToCanvasY(event.pageY);
    if (this._mousePressed) {
      this._onMove(x, y);
    }
  };

  TouchInput._onMouseUp = function (event) {
    if (event.button === 0) {
      var x = Graphics.pageToCanvasX(event.pageX);
      var y = Graphics.pageToCanvasY(event.pageY);
      // Click on the player tile = interact with facing event.
      // Requires press AND release to land on the player tile so a
      // click-then-drag elsewhere stays a normal walk.
      if (_pressStartedOnPlayer && isOnMap() && isOnPlayerTile(x, y)) {
        _interactRequested = true;
        if (typeof $gameTemp !== "undefined") {
          $gameTemp.clearDestination();
        }
      }
      this._mousePressed = false;
      this._onRelease(x, y);
    }
  };

  TouchInput._onRightButtonDown = function (event) {
    var x = Graphics.pageToCanvasX(event.pageX);
    var y = Graphics.pageToCanvasY(event.pageY);
    if (Graphics.isInsideCanvas(x, y)) {
      this._onCancel(x, y);
    }
  };

  // The DOM listeners for mousedown / mousemove / mouseup / touchstart /
  // touchmove / touchend are registered once by lang-shim.js's patched
  // TouchInput._setupEventHandlers, using indirect-lookup wrappers. The
  // method reassignments above (and on _onTouch* below) are picked up
  // automatically: registering fresh listeners here would just double-fire.
  //
  // Single-touch behavior is gesture-aware:
  //   tap                       -> click (advance message / select item)
  //   tap on player tile        -> interact with facing event
  //   vertical swipe in menus   -> scroll the active selectable window
  //   big horizontal swipe      -> open MessageBacklog (when MessageLog is on)
  //   two-finger touch          -> cancel / escape
  //
  // To distinguish a tap from a swipe we DEFER firing the click trigger to
  // touchend whenever we're NOT in map free-walk mode. On the map (without an
  // active message) the trigger fires immediately so click-to-walk stays snappy.

  var SWIPE_START_PX = 16; // distance before a touch is classified as a swipe
  var SWIPE_BACKLOG_PX = 120; // horizontal distance to trigger backlog
  var SWIPE_BACKLOG_RATIO = 1.4; // |dx| must exceed |dy| * this for "horizontal"
  var _swipe = null;

  function isMapFreeWalk() {
    return (
      typeof Scene_Map !== "undefined" &&
      SceneManager._scene instanceof Scene_Map &&
      (typeof $gameMessage === "undefined" || !$gameMessage.isBusy())
    );
  }

  function getActiveScrollable() {
    var scene = SceneManager._scene;
    if (!scene || !scene.children) return null;
    for (var i = 0; i < scene.children.length; i++) {
      var layer = scene.children[i];
      if (!layer || !layer.children) continue;
      for (var j = 0; j < layer.children.length; j++) {
        var w = layer.children[j];
        if (!(w instanceof Window_Selectable)) continue;
        if (!w.isOpenAndActive()) continue;
        if (w.maxRows() <= w.maxPageRows()) continue;
        return w;
      }
    }
    return null;
  }

  function isMessageBacklogReady() {
    // The YEP plugin's classes (Window_MessageBacklog) are block-scoped, but
    // Scene_MessageBacklog is exposed on `window` and Imported.YEP_X_MessageBacklog
    // is set globally. Either signal is enough to know the plugin is loaded.
    return (
      typeof Imported !== "undefined" &&
      Imported.YEP_X_MessageBacklog &&
      typeof $gameSystem !== "undefined" &&
      $gameSystem
    );
  }

  function openMessageBacklog() {
    if (!isMessageBacklogReady()) return false;
    var scene = SceneManager._scene;
    if (!scene) return false;
    // Inside an active message: route through the existing per-window opener
    // so the message resumes correctly on close.
    if (scene._messageWindow) {
      var mw = scene._messageWindow;
      if (
        mw.pause &&
        mw.isOpen() &&
        typeof mw.openBacklogWindow === "function"
      ) {
        mw.openBacklogWindow();
        return true;
      }
      var ch = scene._choiceListWindow;
      if (
        ch &&
        ch.isOpenAndActive &&
        ch.isOpenAndActive() &&
        typeof ch.openBacklogWindow === "function"
      ) {
        ch.openBacklogWindow();
        return true;
      }
    }
    // Standalone scene (added by YEP_X_MessageBacklog)
    if (
      typeof Scene_MessageBacklog !== "undefined" &&
      !(scene instanceof Scene_MessageBacklog)
    ) {
      SceneManager.push(Scene_MessageBacklog);
      return true;
    }
    return false;
  }

  TouchInput._onTouchStart = function (event) {
    for (var i = 0; i < event.changedTouches.length; i++) {
      var touch = event.changedTouches[i];
      var x = Graphics.pageToCanvasX(touch.pageX);
      var y = Graphics.pageToCanvasY(touch.pageY);
      if (Graphics.isInsideCanvas(x, y)) {
        this._screenPressed = true;
        this._pressedTime = 0;
        if (event.touches.length >= 2) {
          this._onCancel(x, y);
          // Also simulate escape key for DRM compatibility (same as right-click)
          if (isOnMap()) {
            simulateEscape();
          }
          _swipe = null;
        } else {
          var deferred = !isMapFreeWalk();
          _pressStartedOnPlayer = isOnMap() && isOnPlayerTile(x, y);
          _swipe = {
            x0: x,
            y0: y,
            lastX: x,
            lastY: y,
            scrollAccum: 0,
            isSwipe: false,
            dir: null,
            deferred: deferred,
          };
          if (!deferred) {
            // Map free-walk: fire trigger immediately for responsive walking.
            this._onTrigger(x, y);
          }
        }
        event.preventDefault();
      }
    }
    if (window.cordova || window.navigator.standalone) {
      event.preventDefault();
    }
  };

  // Wrap the stock touchmove to add swipe classification + scroll application.
  var _baseOnTouchMove = TouchInput._onTouchMove;
  TouchInput._onTouchMove = function (event) {
    _baseOnTouchMove.call(this, event);
    if (!_swipe || !event.touches || event.touches.length !== 1) return;
    var touch = event.touches[0];
    var x = Graphics.pageToCanvasX(touch.pageX);
    var y = Graphics.pageToCanvasY(touch.pageY);
    var dxAll = x - _swipe.x0;
    var dyAll = y - _swipe.y0;

    if (!_swipe.isSwipe) {
      if (Math.sqrt(dxAll * dxAll + dyAll * dyAll) > SWIPE_START_PX) {
        _swipe.isSwipe = true;
        _swipe.dir = Math.abs(dxAll) > Math.abs(dyAll) ? "h" : "v";
      }
    }

    if (_swipe.isSwipe && _swipe.dir === "v") {
      var win = getActiveScrollable();
      if (win) {
        var dy = y - _swipe.lastY;
        _swipe.scrollAccum -= dy; // dragging finger down -> scroll content up
        var lh = win.itemHeight();
        while (_swipe.scrollAccum >= lh) {
          win.scrollDown();
          _swipe.scrollAccum -= lh;
        }
        while (_swipe.scrollAccum <= -lh) {
          win.scrollUp();
          _swipe.scrollAccum += lh;
        }
      }
    }

    _swipe.lastX = x;
    _swipe.lastY = y;
  };

  // For deferred-tap touchend: the stock _baseOnTouchEnd clears _screenPressed,
  // but Window_Message.isTriggered uses TouchInput.isRepeated() which requires
  // isPressed() (i.e. _screenPressed) AND _triggered to be true on the SAME
  // update tick. If we cleared _screenPressed before _onTrigger's effect was
  // observed, the engine sees _triggered=true alone and isRepeated returns
  // false: dialogue won't advance on tap. So we defer the base cleanup by
  // one update tick: { event, age:0 } on the frame _onTrigger fires, then
  // age:1 on the next frame where the base handler finally runs.
  var _baseOnTouchEnd = TouchInput._onTouchEnd;
  var _pendingTouchEnd = null;

  TouchInput._onTouchEnd = function (event) {
    if (!_swipe) {
      // Multi-touch (escape) or stray release: clear normally.
      _baseOnTouchEnd.call(this, event);
      return;
    }
    var sw = _swipe;
    _swipe = null;

    var dx = sw.lastX - sw.x0;
    var dy = sw.lastY - sw.y0;

    if (!sw.isSwipe) {
      // Tap on the player tile = interact with facing event.
      if (
        _pressStartedOnPlayer &&
        isOnMap() &&
        isOnPlayerTile(sw.lastX, sw.lastY)
      ) {
        _interactRequested = true;
        if (typeof $gameTemp !== "undefined") {
          $gameTemp.clearDestination();
        }
      }
      if (sw.deferred) {
        // Fire trigger NOW but keep _screenPressed=true so isRepeated() works
        // on the next update tick. _baseOnTouchEnd is flushed one frame later.
        this._onTrigger(sw.x0, sw.y0);
        _pendingTouchEnd = { event: event, age: 0 };
        return;
      }
      // Map free-walk: trigger already fired on touchstart; clear normally.
      _baseOnTouchEnd.call(this, event);
      return;
    }

    // Big horizontal swipe -> open the MessageBacklog (when available).
    if (
      Math.abs(dx) > SWIPE_BACKLOG_PX &&
      Math.abs(dx) > Math.abs(dy) * SWIPE_BACKLOG_RATIO
    ) {
      var opened = openMessageBacklog();
      if (opened && typeof $gameTemp !== "undefined") {
        // Cancel any walk destination that might have been set by an immediate
        // trigger on the map (free-walk path).
        $gameTemp.clearDestination();
      }
    }

    // Vertical / non-backlog swipe: already handled in touchmove (scroll).
    // Either way, no deferred trigger, clear normally.
    _baseOnTouchEnd.call(this, event);
  };

  // Clear our gesture state on cancel (lang-shim's touchcancel listener calls
  // the stock _onTouchCancel; we just need to drop our pending swipe so a
  // partial tap doesn't fire a deferred trigger after the browser aborts the
  // gesture).
  var _baseOnTouchCancel = TouchInput._onTouchCancel;
  TouchInput._onTouchCancel = function (event) {
    _baseOnTouchCancel.call(this, event);
    _swipe = null;
    _pendingTouchEnd = null;
  };

  // Suppress browser context menu so right-click acts as escape
  document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  // 2. Track mouse position (for hover-to-select in choice windows)
  //
  // Hover-to-select is paused whenever the user presses any key, so keyboard
  // navigation isn't instantly overridden by the cursor sitting on an item.
  // Any mouse movement (even 1px) resumes it: intent follows the input device
  // actually being used.

  var _mouseX = 0,
    _mouseY = 0;
  var _hoverPaused = false;
  document.addEventListener("mousemove", function (e) {
    _mouseX = Graphics.pageToCanvasX(e.pageX);
    _mouseY = Graphics.pageToCanvasY(e.pageY);
    _hoverPaused = false;
  });
  document.addEventListener("keydown", function () {
    _hoverPaused = true;
  });

  // 3. Cursor management + hover-to-select (unified per-frame pass)
  //
  // PIXI's InteractionManager resets interactionDOMElement.style.cursor
  // every frame to 'inherit' (no PIXI display objects set cursor styles).
  // The UpperCanvas (z-index 3) sits on top of the GameCanvas (z-index 1)
  // so we must style BOTH, and suppress PIXI's per-frame reset.
  //
  // Cursor rules:
  //   Map (free movement)  -> crosshair
  //   Map (message/choice) -> pointer on clickable item, default otherwise
  //   Menu window          -> pointer on a selectable item, default otherwise
  //   Hint buttons         -> pointer
  //   Back button          -> pointer
  //   Outside popup menu   -> pointer (click to go back)
  //   Non-interactive      -> default (arrow)

  var _pixiOverridden = false;

  function applyCursorOverride() {
    if (_pixiOverridden) return;
    var renderer = Graphics._renderer;
    if (!renderer || !renderer.plugins || !renderer.plugins.interaction) return;
    var im = renderer.plugins.interaction;
    im._mcOrigSetCursorMode = im.setCursorMode;
    im.setCursorMode = function () {};
    _pixiOverridden = true;
  }

  function setCursor(cur) {
    var canvases = document.querySelectorAll("canvas");
    for (var i = 0; i < canvases.length; i++) {
      canvases[i].style.cursor = cur;
    }
    document.body.style.cursor = cur;
  }

  // Check if the mouse is over any hint rect stored on the scene
  // (e.g. _fileHintRects, _eraseHintRect, _mcBackRect)
  function isOverHintRect(scene) {
    // Scene_File hint rects (Export, Import, Delete)
    if (scene._fileHintRects) {
      for (var rk in scene._fileHintRects) {
        var r = scene._fileHintRects[rk];
        if (
          _mouseX >= r.x &&
          _mouseX <= r.x + r.w &&
          _mouseY >= r.y &&
          _mouseY <= r.y + r.h
        )
          return true;
      }
    }
    // Scene_Mods hint rects (Uninstall, Install/Enable/Disable)
    if (scene._modHintRects) {
      for (var mk in scene._modHintRects) {
        var mr = scene._modHintRects[mk];
        if (
          _mouseX >= mr.x &&
          _mouseX <= mr.x + mr.w &&
          _mouseY >= mr.y &&
          _mouseY <= mr.y + mr.h
        )
          return true;
      }
    }
    // Back button rect
    if (scene._mcBackRect) {
      var br = scene._mcBackRect;
      if (
        _mouseX >= br.x &&
        _mouseX <= br.x + br.w &&
        _mouseY >= br.y &&
        _mouseY <= br.y + br.h
      )
        return true;
    }
    return false;
  }

  // Scenes that get click-outside-to-cancel. Denylist instead of allowlist
  // so the DRM payload's custom in-game menu scene (which we can't refer to
  // by class statically) is also covered. Anything that isn't the map,
  // title, boot, battle, or a fullscreen-with-Back scene is treated as a
  // dismissible popup/menu.
  function isPopupScene(scene) {
    if (typeof Scene_Map !== "undefined" && scene instanceof Scene_Map)
      return false;
    if (typeof Scene_Title !== "undefined" && scene instanceof Scene_Title)
      return false;
    if (typeof Scene_Boot !== "undefined" && scene instanceof Scene_Boot)
      return false;
    if (typeof Scene_Battle !== "undefined" && scene instanceof Scene_Battle)
      return false;
    if (isFullscreenScene(scene)) return false;
    return true;
  }

  // Check if the mouse is outside ALL visible windows in the scene
  function isOutsideAllWindows(scene) {
    var children = scene.children;
    if (!children) return true;
    for (var i = 0; i < children.length; i++) {
      var layer = children[i];
      if (!layer || !layer.children) continue;
      var windows = layer.children;
      for (var j = 0; j < windows.length; j++) {
        var win = windows[j];
        if (!(win instanceof Window_Base)) continue;
        if (!win.visible || win.openness < 255) continue;
        var lx = win.canvasToLocalX(_mouseX);
        var ly = win.canvasToLocalY(_mouseY);
        if (lx >= 0 && ly >= 0 && lx < win.width && ly < win.height) {
          return false;
        }
      }
    }
    return true;
  }

  // Returns true if the mouse is over a clickable item in any open window.
  // Also performs hover-to-select as a side effect.
  function updateHoverAndHitTest() {
    if (typeof Window_Selectable === "undefined") return false;
    var scene = SceneManager._scene;
    if (!scene) return false;
    var children = scene.children;
    if (!children) return false;
    var hovering = false;
    for (var i = 0; i < children.length; i++) {
      var layer = children[i];
      if (!layer || !layer.children) continue;
      var windows = layer.children;
      for (var j = 0; j < windows.length; j++) {
        var win = windows[j];
        if (!(win instanceof Window_Selectable)) continue;
        if (!win.isOpenAndActive()) continue;
        var lx = win.canvasToLocalX(_mouseX);
        var ly = win.canvasToLocalY(_mouseY);
        var hitIndex = win.hitTest(lx, ly);
        if (hitIndex >= 0) {
          hovering = true;
          if (
            !_hoverPaused &&
            hitIndex !== win.index() &&
            win.isCursorMovable()
          ) {
            // Some windows (e.g. Window_MessageBacklog) override select() to
            // a no-op. Only play the cursor sound if the index actually moved,
            // otherwise we'd fire it every frame the mouse hovers an item.
            var prevIndex = win.index();
            win.select(hitIndex);
            if (win.index() !== prevIndex) {
              SoundManager.playCursor();
            }
          }
        }
      }
    }
    return hovering;
  }

  // Handle click-outside-to-cancel for popup scenes. Tries the active
  // Window_Selectable with a cancel handler first; if none is found (e.g.
  // the DRM-defined in-game menu uses a non-standard window structure)
  // falls back to simulating an escape keypress, which any well-behaved
  // RPG Maker scene listens to.
  function handleClickOutside() {
    if (!TouchInput.isTriggered()) return;
    var scene = SceneManager._scene;
    if (!scene || !isPopupScene(scene)) return;
    if (!isOutsideAllWindows(scene)) return;
    var children = scene.children;
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var layer = children[i];
        if (!layer || !layer.children) continue;
        var windows = layer.children;
        for (var j = 0; j < windows.length; j++) {
          var win = windows[j];
          if (
            win instanceof Window_Selectable &&
            win.isOpenAndActive() &&
            win.isCancelEnabled()
          ) {
            win.processCancel();
            return;
          }
        }
      }
    }
    // Fallback: synthesize an escape keypress.
    simulateEscape();
  }

  // Handle click on the Back button drawn on fullscreen scenes
  function handleBackClick() {
    if (!TouchInput.isTriggered()) return;
    var scene = SceneManager._scene;
    if (!scene || !scene._mcBackRect) return;
    var br = scene._mcBackRect;
    var tx = TouchInput.x;
    var ty = TouchInput.y;
    if (tx >= br.x && tx <= br.x + br.w && ty >= br.y && ty <= br.y + br.h) {
      SoundManager.playCancel();
      SceneManager.pop();
    }
  }

  // Draw a "Back" button on the top-right of the help window for
  // fullscreen scenes. Called once after the scene's help window is ready.
  function drawBackButton(scene) {
    if (!scene._helpWindow) return;
    if (scene._mcBackRect) return; // already drawn
    var hw = scene._helpWindow;
    var label = "\u2190 Back"; // <- Back
    var fontSize = hw.standardFontSize(); // 28: same as the title on the left
    hw.contents.fontSize = fontSize;
    hw.contents.textColor = hw.normalColor();
    var tw = hw.contents.measureTextWidth(label);
    var pad = hw.standardPadding();
    var textPad = hw.textPadding();
    var x = hw.contentsWidth() - tw - textPad;
    var lineHeight = hw.contents.fontSize + 4;
    var y = Math.floor((hw.contentsHeight() - lineHeight) / 2);
    hw.contents.drawText(label, x, y, tw + 4, lineHeight);
    hw.contents.fontSize = hw.standardFontSize();
    hw.resetTextColor();
    scene._mcBackRect = {
      x: hw.x + pad + x,
      y: hw.y + pad + y,
      w: tw + 4,
      h: lineHeight,
    };
  }

  // Detect fullscreen scenes that should get a Back button
  function isFullscreenScene(scene) {
    return (
      (typeof Scene_File !== "undefined" && scene instanceof Scene_File) ||
      (typeof Scene_Mods !== "undefined" && scene instanceof Scene_Mods) ||
      (typeof Scene_Achievements !== "undefined" &&
        scene instanceof Scene_Achievements)
    );
  }

  function updateFrame() {
    if (typeof SceneManager === "undefined" || !SceneManager._scene) return;
    applyCursorOverride();

    var scene = SceneManager._scene;
    var onMap = typeof Scene_Map !== "undefined" && scene instanceof Scene_Map;
    var messageBusy =
      onMap && typeof $gameMessage !== "undefined" && $gameMessage.isBusy();

    // Draw Back button on fullscreen scenes (once)
    if (isFullscreenScene(scene)) {
      drawBackButton(scene);
    }

    var hoveringItem = updateHoverAndHitTest();
    var hoveringHint = !onMap && isOverHintRect(scene);
    var popup = isPopupScene(scene);
    var outsidePopup = popup && isOutsideAllWindows(scene);

    // Handle clicks
    handleBackClick();
    handleClickOutside();

    var cur;
    if (onMap && !messageBusy) {
      cur = "crosshair";
    } else if (hoveringItem || hoveringHint) {
      cur = "pointer";
    } else if (outsidePopup) {
      cur = "pointer";
    } else if (messageBusy) {
      cur = "pointer";
    } else {
      cur = "default";
    }
    setCursor(cur);
  }

  if (typeof SceneManager !== "undefined") {
    var _orig_updateScene = SceneManager.updateScene;
    SceneManager.updateScene = function () {
      _orig_updateScene.call(this);
      updateFrame();
    };
  }

  // 4. Cancel / escape, and click-on-player = interact
  //
  // On the map:
  //   - Right-click anywhere          -> escape (open menu)
  //   - Two-finger tap (mobile)       -> escape (open menu)
  //   - Click ON the player           -> interact with facing event
  //   - Tap ON the player             -> interact with facing event
  // In menus:
  //   - Right-click / two-finger tap  -> cancel (back out)
  //
  // Click/tap on the player only triggers interact when both press AND
  // release land on the player tile (drag-from-player still walks). Right-
  // click and two-finger tap never trigger interact (would conflict with
  // cancel).

  function isOnPlayerTile(canvasX, canvasY) {
    if (typeof $gamePlayer === "undefined" || typeof $gameMap === "undefined")
      return false;
    var mapX = $gameMap.canvasToMapX(canvasX);
    var mapY = $gameMap.canvasToMapY(canvasY);
    return mapX === $gamePlayer.x && mapY === $gamePlayer.y;
  }

  function isOnMap() {
    return (
      typeof SceneManager !== "undefined" &&
      typeof Scene_Map !== "undefined" &&
      SceneManager._scene instanceof Scene_Map &&
      typeof $gameMessage !== "undefined" &&
      !$gameMessage.isBusy()
    );
  }

  var _interactRequested = false;
  var _pressStartedOnPlayer = false;
  var _pendingEscapeRelease = false;

  // Simulate an escape key press for one frame. Input.update() runs before
  // TouchInput.update() in SceneManager.updateInputData(), so we set the
  // key state here (from the DOM event handler) and release it in our
  // TouchInput.update override below (after Input.update has already read it).
  function simulateEscape() {
    if (typeof Input !== "undefined") {
      Input._currentState["escape"] = true;
      _pendingEscapeRelease = true;
    }
  }

  if (typeof TouchInput !== "undefined") {
    var _base_onRightButtonDown = TouchInput._onRightButtonDown;
    TouchInput._onRightButtonDown = function (event) {
      _base_onRightButtonDown.call(this, event);
      // Also simulate escape key so DRM payload's menu system responds
      // (it may only check Input.isTriggered, not TouchInput.isCancelled)
      if (isOnMap()) {
        simulateEscape();
      }
    };
  }

  if (typeof Game_Player !== "undefined") {
    var _orig_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function () {
      if (_interactRequested) {
        _interactRequested = false;
        if (this.canMove()) {
          if (this.getOnOffVehicle()) return true;
          this.checkEventTriggerHere([0]);
          if ($gameMap.setupStartingEvent()) return true;
          this.checkEventTriggerThere([0, 1, 2]);
          if ($gameMap.setupStartingEvent()) return true;
        }
        return false;
      }
      return _orig_triggerButtonAction.call(this);
    };
  }

  if (typeof TouchInput !== "undefined") {
    var _orig_tiUpdate = TouchInput.update;
    TouchInput.update = function () {
      _orig_tiUpdate.call(this);

      // Release simulated escape key (Input.update already read it this frame)
      if (_pendingEscapeRelease) {
        Input._currentState["escape"] = false;
        _pendingEscapeRelease = false;
      }

      // Flush deferred touchend cleanup. On the frame _onTrigger landed
      // (age=0) we leave _screenPressed alone so isRepeated() returns true
      // for Window_Message.isTriggered. On the NEXT frame (age>=1) we run
      // the base handler to clear _screenPressed and fire _onRelease.
      if (_pendingTouchEnd) {
        if (_pendingTouchEnd.age >= 1) {
          var ev = _pendingTouchEnd.event;
          _pendingTouchEnd = null;
          _baseOnTouchEnd.call(this, ev);
        } else {
          _pendingTouchEnd.age++;
        }
      }
    };
  }

  // 5. Destination sprite: smaller, single-pulse animation
  //
  // The stock Sprite_Destination is a full-tile white square that loops a
  // 20-frame expand+fade cycle. We replace it with a half-tile circle that
  // plays one shrink+fade animation and then stays hidden until the next click.

  var DESTINATION_REPEAT = false; // set true to loop the animation

  if (typeof Sprite_Destination !== "undefined") {
    Sprite_Destination.prototype.createBitmap = function () {
      var tw = $gameMap.tileWidth();
      var th = $gameMap.tileHeight();
      var size = Math.floor(Math.min(tw, th) / 2);
      this.bitmap = new Bitmap(size, size);
      var ctx = this.bitmap._context;
      var r = size / 2;
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fill();
      this.anchor.x = 0.5;
      this.anchor.y = 0.5;
      this.blendMode = Graphics.BLEND_ADD;
      this._animDone = false;
    };

    Sprite_Destination.prototype.updateAnimation = function () {
      if (this._animDone && !DESTINATION_REPEAT) return;
      this._frameCount++;
      if (this._frameCount >= 20) {
        if (DESTINATION_REPEAT) {
          this._frameCount = 0;
        } else {
          this._animDone = true;
          this.opacity = 0;
          return;
        }
      }
      var t = this._frameCount / 20;
      this.opacity = Math.floor((1 - t) * 180);
      this.scale.x = 1 - t * 0.4;
      this.scale.y = this.scale.x;
    };

    var _orig_destUpdate = Sprite_Destination.prototype.update;
    Sprite_Destination.prototype.update = function () {
      var wasValid = this.visible;
      _orig_destUpdate.call(this);
      // Reset animation when a new destination appears
      if (!wasValid && this.visible) {
        this._frameCount = 0;
        this._animDone = false;
        this.opacity = 180;
        this.scale.x = 1;
        this.scale.y = 1;
      }
    };
  }

  // 6. Force-enable map touch

  if (typeof Scene_Map !== "undefined") {
    Scene_Map.prototype.isMapTouchOk = function () {
      return this.isActive() && $gamePlayer.canMove();
    };

    Scene_Map.prototype.processMapTouch = function () {
      if (TouchInput.isTriggered() || this._touchCount > 0) {
        if (TouchInput.isPressed()) {
          if (this._touchCount === 0 || this._touchCount >= 15) {
            var x = $gameMap.canvasToMapX(TouchInput.x);
            var y = $gameMap.canvasToMapY(TouchInput.y);
            $gameTemp.setDestination(x, y);
          }
          this._touchCount++;
        } else {
          this._touchCount = 0;
        }
      }
    };
  }

  // 7. Left-click on menus = immediate confirm (no double-click)

  if (typeof Window_Selectable !== "undefined") {
    Window_Selectable.prototype.onTouch = function (triggered) {
      var x = this.canvasToLocalX(TouchInput.x);
      var y = this.canvasToLocalY(TouchInput.y);
      var hitIndex = this.hitTest(x, y);
      if (hitIndex >= 0) {
        if (hitIndex !== this.index() && this.isCursorMovable()) {
          this.select(hitIndex);
        }
        if (triggered && this.isTouchOkEnabled()) {
          this.processOk();
        }
      }
    };
  }

  // 8. Choice windows: hover-to-select + click-to-confirm

  if (typeof Window_ChoiceList !== "undefined") {
    Window_ChoiceList.prototype.processTouch = function () {
      if (this.isOpenAndActive()) {
        var lx = this.canvasToLocalX(_mouseX);
        var ly = this.canvasToLocalY(_mouseY);
        var hitIndex = this.hitTest(lx, ly);
        if (!_hoverPaused && hitIndex >= 0 && hitIndex !== this.index()) {
          this.select(hitIndex);
          SoundManager.playCursor();
        }
        if (TouchInput.isTriggered()) {
          var cx = this.canvasToLocalX(TouchInput.x);
          var cy = this.canvasToLocalY(TouchInput.y);
          var clickHit = this.hitTest(cx, cy);
          if (clickHit >= 0) {
            this.select(clickHit);
            this.processOk();
          }
        }
        if (TouchInput.isCancelled() && this.isCancelEnabled()) {
          this.processCancel();
        }
      }
    };
  }

  // 9. Number input: per-digit clickable arrows + OK button
  //
  // Stock Window_NumberInput has three Sprite_Button instances (down/up/ok)
  // sourced from img/system/ButtonSet.png. TCOAAL builds either ship it as
  // an encrypted asset that the engine never decrypts for ButtonSet
  // (System.json's hasEncryptedImages stays falsey) or omit it outright,
  // so those buttons render as a blank square: number input becomes
  // unusable without an arrow keyboard.
  //
  // We replace createButtons with our own setup:
  //   - one up arrow above EACH digit and one down arrow below EACH digit
  //     (no need to first select a digit before changing it)
  //   - one OK button to the right of the window
  //   - bitmaps drawn into per-button Bitmap canvases so they never depend
  //     on an external image
  // Stock keyboard navigation (arrow keys + Enter) still works in parallel.
  //
  // Also adds vertical swipe support on touch: drag up on a digit to
  // increment, down to decrement, with the same per-line throttling the
  // menu scrollable uses.

  if (typeof Window_NumberInput !== "undefined") {
    // Match the parent number input window's look: dark translucent fill
    // with a thin white rounded border, white glyph drawn in the game's
    // standard font so OK reads the same as the digits. The 'hot' state
    // brightens the fill the same way Sprite_Destination / cursor sprites
    // do, so the buttons feel like they belong to the same UI family.
    var NI_ARROW_W = 28;
    var NI_ARROW_H = 24;
    var NI_OK_W = 60;
    var NI_OK_H = 32;
    var NI_GAP = 4;
    var NI_RADIUS = 4;

    function roundedRectPath(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }

    function drawButtonBg(ctx, x, y, w, h, hot) {
      ctx.save();
      // Inset by 0.5 so the 1px border sits on integer pixels (otherwise
      // GPUs round it to 2px and the frame looks chunky next to the
      // parent window's crisp 1px frame).
      roundedRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, NI_RADIUS);
      ctx.fillStyle = hot
        ? "rgba(178, 224, 135, 0.32)" // matches the cursor highlight tint
        : "rgba(10, 14, 22, 0.55)";
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 245, 250, 0.85)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function drawArrowGlyph(ctx, x, y, w, h, dir) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      var cx = x + w / 2;
      var cy = y + h / 2;
      var s = Math.min(w, h) * 0.32;
      ctx.beginPath();
      if (dir === "up") {
        ctx.moveTo(cx, cy - s * 0.7);
        ctx.lineTo(cx + s, cy + s * 0.55);
        ctx.lineTo(cx - s, cy + s * 0.55);
      } else {
        ctx.moveTo(cx, cy + s * 0.7);
        ctx.lineTo(cx + s, cy - s * 0.55);
        ctx.lineTo(cx - s, cy - s * 0.55);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Pull the game's font + size so the OK text matches the digit glyphs.
    function gameFontStack() {
      try {
        if ($gameSystem.isChinese()) return "SimHei, Heiti TC, sans-serif";
        if ($gameSystem.isKorean()) return "Dotum, AppleGothic, sans-serif";
      } catch (e) {}
      return "GameFont, sans-serif";
    }

    function drawOkText(ctx, x, y, w, h) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.font = Math.floor(h * 0.55) + "px " + gameFontStack();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("OK", x + w / 2, y + h / 2 + 1);
      ctx.restore();
    }

    function makeArrowBitmap(dir) {
      var bm = new Bitmap(NI_ARROW_W, NI_ARROW_H * 2);
      drawButtonBg(bm._context, 0, 0, NI_ARROW_W, NI_ARROW_H, false);
      drawArrowGlyph(bm._context, 0, 0, NI_ARROW_W, NI_ARROW_H, dir);
      drawButtonBg(bm._context, 0, NI_ARROW_H, NI_ARROW_W, NI_ARROW_H, true);
      drawArrowGlyph(bm._context, 0, NI_ARROW_H, NI_ARROW_W, NI_ARROW_H, dir);
      if (bm._setDirty) bm._setDirty();
      return bm;
    }

    function makeOkBitmap() {
      var bm = new Bitmap(NI_OK_W, NI_OK_H * 2);
      drawButtonBg(bm._context, 0, 0, NI_OK_W, NI_OK_H, false);
      drawOkText(bm._context, 0, 0, NI_OK_W, NI_OK_H);
      drawButtonBg(bm._context, 0, NI_OK_H, NI_OK_W, NI_OK_H, true);
      drawOkText(bm._context, 0, NI_OK_H, NI_OK_W, NI_OK_H);
      if (bm._setDirty) bm._setDirty();
      return bm;
    }

    // Build a Sprite_Button with the given bitmap. The bitmap is laid out
    // vertically: top half is the cold (idle) frame, bottom half is the hot
    // (pressed) frame -- matches the convention Sprite_Button.processTouch
    // expects when it toggles between setColdFrame / setHotFrame.
    function makeButton(bitmap, w, h, onClick) {
      var btn = new Sprite_Button();
      btn.bitmap = bitmap;
      btn.setColdFrame(0, 0, w, h);
      btn.setHotFrame(0, h, w, h);
      btn.visible = false;
      btn.setClickHandler(onClick);
      return btn;
    }

    Window_NumberInput.prototype.createButtons = function () {
      // Stock allocates 3 buttons here. We defer arrow creation to
      // placeButtons (called from start()) because the digit count is only
      // known once $gameMessage has been queried. The OK button is reused
      // across openings so we instantiate it once.
      this._buttons = [];
      this._digitButtons = [];
      var self = this;
      this._okButton = makeButton(makeOkBitmap(), NI_OK_W, NI_OK_H, function () {
        self.processOk();
      });
      this.addChild(this._okButton);
    };

    Window_NumberInput.prototype.placeButtons = function () {
      // Tear down any per-digit arrows left over from a previous opening
      // (max digit count can vary between calls).
      for (var d = 0; d < this._digitButtons.length; d++) {
        this.removeChild(this._digitButtons[d]);
      }
      this._digitButtons = [];

      var pad = this.standardPadding();
      var iw = this.itemWidth();
      var arrowX0 = pad + (iw - NI_ARROW_W) / 2;
      var upY = -NI_ARROW_H - NI_GAP;
      var downY = this.height + NI_GAP;
      var self = this;

      for (var i = 0; i < this._maxDigits; i++) {
        (function (digitIndex) {
          var upBtn = makeButton(
            makeArrowBitmap("up"),
            NI_ARROW_W,
            NI_ARROW_H,
            function () {
              self.select(digitIndex);
              self.changeDigit(true);
            },
          );
          var downBtn = makeButton(
            makeArrowBitmap("down"),
            NI_ARROW_W,
            NI_ARROW_H,
            function () {
              self.select(digitIndex);
              self.changeDigit(false);
            },
          );
          upBtn.x = arrowX0 + digitIndex * iw;
          upBtn.y = upY;
          downBtn.x = arrowX0 + digitIndex * iw;
          downBtn.y = downY;
          self._digitButtons.push(upBtn, downBtn);
          self.addChild(upBtn);
          self.addChild(downBtn);
        })(i);
      }

      // OK button to the right of the down-arrow row, vertically centered
      // on the digit baseline so it stays on-screen near the input area.
      this._okButton.x = this.width + NI_GAP;
      this._okButton.y = Math.floor((this.height - NI_OK_H) / 2);
    };

    Window_NumberInput.prototype.updateButtonsVisiblity = function () {
      // Stock only shows buttons when TouchInput.date > Input.date so the
      // keyboard layout stays clean. We're touch-first here, so the
      // buttons are always visible while the window is open.
      this.showButtons();
    };

    Window_NumberInput.prototype.showButtons = function () {
      if (this._okButton) this._okButton.visible = true;
      for (var i = 0; i < this._digitButtons.length; i++) {
        this._digitButtons[i].visible = true;
      }
    };

    Window_NumberInput.prototype.hideButtons = function () {
      if (this._okButton) this._okButton.visible = false;
      for (var i = 0; i < this._digitButtons.length; i++) {
        this._digitButtons[i].visible = false;
      }
    };

    // Vertical swipe on a digit changes it (up = increment, down = decrement),
    // one step per itemHeight worth of finger travel. Independent of the
    // free-form gesture state in section 1 so the message-backlog swipe
    // detector doesn't get confused by drags that happen inside the
    // number input window.
    var _niSwipe = null;
    var _orig_niStart = Window_NumberInput.prototype.start;
    Window_NumberInput.prototype.start = function () {
      _niSwipe = null;
      _orig_niStart.apply(this, arguments);
    };

    var _orig_niProcessTouch = Window_NumberInput.prototype.processTouch;
    Window_NumberInput.prototype.processTouch = function () {
      if (_orig_niProcessTouch) _orig_niProcessTouch.call(this);
      if (!this.isOpenAndActive()) {
        _niSwipe = null;
        return;
      }
      if (TouchInput.isTriggered()) {
        var lx = this.canvasToLocalX(TouchInput.x);
        var ly = this.canvasToLocalY(TouchInput.y);
        var hitIndex = this.hitTest(lx, ly);
        if (hitIndex >= 0) {
          if (hitIndex !== this.index() && this.isCursorMovable()) {
            this.select(hitIndex);
            SoundManager.playCursor();
          }
          _niSwipe = { y0: TouchInput.y, lastY: TouchInput.y, accum: 0 };
        } else {
          _niSwipe = null;
        }
      }
      if (_niSwipe && TouchInput.isPressed()) {
        var dy = TouchInput.y - _niSwipe.lastY;
        _niSwipe.accum -= dy; // drag up -> increment
        var step = this.itemHeight();
        while (_niSwipe.accum >= step) {
          this.changeDigit(true);
          _niSwipe.accum -= step;
        }
        while (_niSwipe.accum <= -step) {
          this.changeDigit(false);
          _niSwipe.accum += step;
        }
        _niSwipe.lastY = TouchInput.y;
      }
      if (!TouchInput.isPressed()) {
        _niSwipe = null;
      }
    };
  }
})();

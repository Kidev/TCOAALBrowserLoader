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
 * plugin-load time takes effect on the live DOM listeners:  no need to
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
  // automatically:  registering fresh listeners here would just double-fire.
  //
  // Single-touch behavior is gesture-aware:
  //   tap                       -> click (advance message / select item)
  //   vertical swipe in menus   -> scroll the active selectable window
  //   big horizontal swipe      -> open MessageBacklog (when MessageLog is on)
  //   two-finger touch          -> cancel / escape
  //   long-press on player tile -> interact (handled later in TouchInput.update)
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

  // 4. Cancel / escape, and held-press-on-player = interact
  //
  // On the map:
  //   - Right-click anywhere     -> escape (open menu)
  //   - Two-finger tap (mobile)  -> escape (open menu)
  //   - Hold left-click ON the player -> interact with facing event
  //   - Long-touch ON the player -> interact with facing event
  // In menus:
  //   - Right-click / two-finger tap -> cancel (back out)
  //
  // Only held-on-player triggers interact: a quick click/tap on the player
  // tile is just the normal walk-here (no-op), and right-click / two-finger
  // tap never trigger interact (too easy to confuse with cancel).

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

  // Held press on player = interact (works for both mouse and touch).
  // After LONG_PRESS_FRAMES frames (~500ms at 60fps) of holding on the
  // player tile, trigger interact and cancel any touch-move destination.
  // Gated on _pressStartedOnPlayer so dragging/sliding onto the player
  // mid-hold doesn't trigger; the press has to BEGIN on the player tile.

  var LONG_PRESS_FRAMES = 30;
  var _longPressTriggered = false;

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

      // Long-press detection (mouse OR touch). Requires the press to have
      // started on the player tile AND the cursor/finger to still be on the
      // player tile when the threshold fires.
      if (
        (this._screenPressed || this._mousePressed) &&
        !_longPressTriggered &&
        _pressStartedOnPlayer &&
        this._pressedTime === LONG_PRESS_FRAMES &&
        isOnMap()
      ) {
        var cx = this.x;
        var cy = this.y;
        if (isOnPlayerTile(cx, cy)) {
          _interactRequested = true;
          _longPressTriggered = true;
          // Clear destination so the player doesn't walk
          if (typeof $gameTemp !== "undefined") {
            $gameTemp.clearDestination();
          }
        }
      }
      if (!this._screenPressed && !this._mousePressed) {
        _longPressTriggered = false;
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
})();

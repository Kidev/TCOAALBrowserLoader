/*
 * Enables full mouse/touch control for TCOAAL browser port.
 * Neutralizes the DisableMouse plugin and adds click-to-move, right-click
 * menu/cancel, single-click menus, hover-to-select choices, contextual cursors,
 * and mobile touch support (two-finger tap = escape).
 *
 * DisableMouse.js replaces TouchInput._onMouseDown with a no-op BEFORE
 * _setupEventHandlers runs. When _setupEventHandlers does:
 *   document.addEventListener('mousedown', this._onMouseDown.bind(this))
 * the .bind() captures a reference to the no-op. Reassigning the method
 * later has NO effect on the bound listener. We must add fresh listeners.
 */

(function () {
  "use strict";

  if (typeof TouchInput === "undefined" || typeof Graphics === "undefined")
    return;

  // 1. Restore stock mouse handlers on TouchInput AND register new DOM
  //    event listeners that call them. The old bound no-ops stay attached
  //    but are harmless (they do nothing).

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
    var x = Graphics.pageToCanvasX(event.pageX);
    var y = Graphics.pageToCanvasY(event.pageY);
    if (Graphics.isInsideCanvas(x, y)) {
      this._mousePressed = true;
      this._pressedTime = 0;
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

  // Register fresh DOM listeners (the old bound no-ops remain but are harmless)
  document.addEventListener("mousedown", function (event) {
    TouchInput._onMouseDown.call(TouchInput, event);
  });
  document.addEventListener("mousemove", function (event) {
    TouchInput._onMouseMove.call(TouchInput, event);
  });
  document.addEventListener("mouseup", function (event) {
    TouchInput._onMouseUp.call(TouchInput, event);
  });

  // Re-register touch listeners to ensure they call our current methods
  // (guards against DisableMouse or other plugins that may have bound stale refs).
  // Single touch = trigger (click), two-finger touch = cancel (escape).
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
        } else {
          this._onTrigger(x, y);
        }
        event.preventDefault();
      }
    }
    if (window.cordova || window.navigator.standalone) {
      event.preventDefault();
    }
  };

  document.addEventListener(
    "touchstart",
    function (event) {
      TouchInput._onTouchStart.call(TouchInput, event);
    },
    { passive: false },
  );
  document.addEventListener(
    "touchmove",
    function (event) {
      TouchInput._onTouchMove.call(TouchInput, event);
    },
    { passive: false },
  );
  document.addEventListener("touchend", function (event) {
    TouchInput._onTouchEnd.call(TouchInput, event);
  });

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

  // Check if scene is a non-fullscreen popup menu (centered window, not
  // covering the full screen). These get click-outside-to-cancel.
  function isPopupScene(scene) {
    return (
      (typeof Scene_Options !== "undefined" &&
        scene instanceof Scene_Options) ||
      (typeof Scene_GameEnd !== "undefined" && scene instanceof Scene_GameEnd)
    );
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
            win.select(hitIndex);
            SoundManager.playCursor();
          }
        }
      }
    }
    return hovering;
  }

  // Handle click-outside-to-cancel for popup scenes
  function handleClickOutside() {
    if (!TouchInput.isTriggered()) return;
    var scene = SceneManager._scene;
    if (!scene || !isPopupScene(scene)) return;
    if (!isOutsideAllWindows(scene)) return;
    // Find the active window with a cancel handler and trigger cancel
    var children = scene.children;
    if (!children) return;
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
    var label = "\u2190 Back"; // ← Back
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
      (typeof Scene_Mods !== "undefined" && scene instanceof Scene_Mods)
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

  // 4. Right-click / two-finger tap = context-sensitive action
  //
  // On the map:
  //   - Right-click ON the player -> interact with facing event
  //   - Right-click elsewhere    -> escape (open menu)
  //   - Mobile long-touch ON the player -> interact with facing event
  //   - Mobile two-finger tap -> escape (open menu)
  // In menus:
  //   - Right-click / two-finger tap -> cancel (back out)

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

  var _rightClickInteract = false;
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
      var x = Graphics.pageToCanvasX(event.pageX);
      var y = Graphics.pageToCanvasY(event.pageY);
      if (isOnMap() && isOnPlayerTile(x, y)) {
        _rightClickInteract = true;
      } else {
        _base_onRightButtonDown.call(this, event);
        // Also simulate escape key so DRM payload's menu system responds
        // (it may only check Input.isTriggered, not TouchInput.isCancelled)
        if (isOnMap()) {
          simulateEscape();
        }
      }
    };
  }

  if (typeof Game_Player !== "undefined") {
    var _orig_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function () {
      if (_rightClickInteract) {
        _rightClickInteract = false;
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

  // Long-touch on player = interact (mobile equivalent of right-click on player)
  // After LONG_PRESS_FRAMES frames (~500ms at 60fps) of holding on the player
  // tile, trigger interact and cancel the touch-move destination.

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

      // Long-press detection
      if (
        this._screenPressed &&
        !_longPressTriggered &&
        this._pressedTime === LONG_PRESS_FRAMES &&
        isOnMap()
      ) {
        var cx = this.x;
        var cy = this.y;
        if (isOnPlayerTile(cx, cy)) {
          _rightClickInteract = true;
          _longPressTriggered = true;
          // Clear destination so the player doesn't walk
          if (typeof $gameTemp !== "undefined") {
            $gameTemp.clearDestination();
          }
        }
      }
      if (!this._screenPressed) {
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

/*
 * Enables full mouse/touch control for TCOAAL browser port.
 * Neutralizes the DisableMouse plugin and adds click-to-move, right-click
 * interact, single-click menus, hover-to-select choices, and contextual cursors.
 */

(function () {
  "use strict";

  // 1. Neutralize DisableMouse plugin
  //
  // DisableMouse (status:true in plugins.js) blanks all TouchInput handlers.
  // We restore the stock RMMV implementations from rpg_core.js.

  if (typeof TouchInput !== "undefined") {
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
      if (this._mousePressed) {
        var x = Graphics.pageToCanvasX(event.pageX);
        var y = Graphics.pageToCanvasY(event.pageY);
        this._onMove(x, y);
      }
    };

    TouchInput._onRightButtonDown = function (event) {
      var x = Graphics.pageToCanvasX(event.pageX);
      var y = Graphics.pageToCanvasY(event.pageY);
      if (Graphics.isInsideCanvas(x, y)) {
        this._onCancel(x, y);
      }
    };
  }

  // 2. Track mouse position (for hover-to-select in choice windows)

  var _mouseX = 0,
    _mouseY = 0;
  document.addEventListener("mousemove", function (e) {
    if (typeof Graphics !== "undefined") {
      _mouseX = Graphics.pageToCanvasX(e.pageX);
      _mouseY = Graphics.pageToCanvasY(e.pageY);
    }
  });

  // 3. Cursor management: crosshair on map, pointer on menus

  function updateMouseCursor() {
    var canvas =
      document.querySelector("canvas") || document.getElementById("GameCanvas");
    if (!canvas) return;
    if (typeof SceneManager === "undefined") return;
    var scene = SceneManager._scene;
    if (scene instanceof Scene_Map) {
      canvas.style.cursor = $gameMessage.isBusy() ? "default" : "crosshair";
    } else {
      canvas.style.cursor = "pointer";
    }
  }

  // Hook into SceneManager.updateScene
  if (typeof SceneManager !== "undefined") {
    var _orig_updateScene = SceneManager.updateScene;
    SceneManager.updateScene = function () {
      _orig_updateScene.call(this);
      updateMouseCursor();
    };
  }

  // 4. Right-click on map = interact with facing event

  var _rightClickOk = false;

  if (typeof TouchInput !== "undefined") {
    var _restored_onRightButtonDown = TouchInput._onRightButtonDown;
    TouchInput._onRightButtonDown = function (event) {
      if (
        typeof SceneManager !== "undefined" &&
        SceneManager._scene instanceof Scene_Map &&
        !$gameMessage.isBusy()
      ) {
        _rightClickOk = true;
      } else {
        _restored_onRightButtonDown.call(this, event);
      }
    };
  }

  if (typeof Game_Player !== "undefined") {
    var _orig_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function () {
      if (_rightClickOk) {
        _rightClickOk = false;
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

  // 5. Force-enable map touch (bypass any plugin override)

  if (typeof Scene_Map !== "undefined") {
    var _orig_isMapTouchOk = Scene_Map.prototype.isMapTouchOk;
    Scene_Map.prototype.isMapTouchOk = function () {
      return this.isActive() && $gamePlayer.canMove();
    };

    var _orig_processMapTouch = Scene_Map.prototype.processMapTouch;
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

  // 6. Left-click on menus = immediate confirm (no double-click)

  if (typeof Window_Selectable !== "undefined") {
    var _orig_selectableOnTouch = Window_Selectable.prototype.onTouch;
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

  // 7. Choice windows: hover-to-select + click-to-confirm

  if (typeof Window_ChoiceList !== "undefined") {
    var _orig_choiceProcessTouch = Window_ChoiceList.prototype.processTouch;
    Window_ChoiceList.prototype.processTouch = function () {
      if (this.isOpenAndActive()) {
        var lx = this.canvasToLocalX(_mouseX);
        var ly = this.canvasToLocalY(_mouseY);
        var hitIndex = this.hitTest(lx, ly);
        if (hitIndex >= 0 && hitIndex !== this.index()) {
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

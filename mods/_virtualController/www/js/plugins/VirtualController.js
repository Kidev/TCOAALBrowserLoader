/*
 * VirtualController: on-screen game controller overlay for touch play.
 *
 *   Left   : 4-direction D-pad (up / down / left / right).
 *   Right  : 4 action buttons arranged like a gamepad (A / B / X / Y).
 *   Centre : a dedicated menu/escape button (Start-style).
 *
 * Each control feeds RPG Maker MV's Input system by toggling
 * Input._currentState[<button>] on press / release. The engine's own
 * Input.update() (rpg_core.js) then derives triggered / repeated / pressed
 * exactly as it does for the keyboard, so virtual presses get key-repeat in
 * menus, continuous movement on the map, and hold semantics for free.
 *
 * Button -> logical name mapping (see Input.keyMapper / gamepadMapper):
 *   A    -> 'ok'      confirm / interact
 *   B    -> 'cancel'  back (cancels the current menu)
 *   X    -> 'shift'   dash / run
 *   Y    -> 'control' secondary action
 *   Menu -> 'escape'  opens the menu on the map and backs out of menus
 *                     ('escape' is escape-compatible, so it satisfies both
 *                      Input.isTriggered('menu') and isTriggered('cancel'))
 *
 * The overlay is plain DOM layered above the game canvas: the container is
 * click-through (pointer-events:none) and only the buttons capture pointers,
 * so it never blocks taps on the rest of the screen. It is independent of the
 * active scene and survives scene transitions.
 */

(function () {
  "use strict";

  // Guard against double-injection. The mod system can re-run plugin scripts
  // (live enable, or a reload that re-walks _activePlugins); build the overlay
  // once per page.
  if (window.__virtualControllerLoaded) return;
  window.__virtualControllerLoaded = true;

  if (typeof Input === "undefined") return;

  var DPAD = [
    { name: "up", glyph: "▲", cls: "vc-up" },
    { name: "left", glyph: "◀", cls: "vc-left" },
    { name: "right", glyph: "▶", cls: "vc-right" },
    { name: "down", glyph: "▼", cls: "vc-down" },
  ];

  var ACTIONS = [
    { name: "control", glyph: "Y", cls: "vc-y" },
    { name: "shift", glyph: "X", cls: "vc-x" },
    { name: "ok", glyph: "A", cls: "vc-a" },
    { name: "cancel", glyph: "B", cls: "vc-b" },
  ];

  // Dedicated menu/escape button, centred between the two clusters.
  var MENU = { name: "escape", glyph: "☰", cls: "vc-menu" };

  // Input bridge

  // Track which logical buttons this overlay is holding so we can release
  // them cleanly (and recover from the engine's Input.clear() wiping state on
  // window blur, which would otherwise leave our DOM buttons looking stuck).
  var held = {};

  function press(name) {
    if (held[name]) return;
    held[name] = true;
    Input._currentState[name] = true;
  }

  function release(name) {
    if (!held[name]) return;
    held[name] = false;
    Input._currentState[name] = false;
  }

  function releaseAll() {
    for (var name in held) {
      if (held[name]) release(name);
    }
  }

  // DOM

  var STYLE = [
    "#vc-overlay{position:fixed;inset:0;z-index:100000;pointer-events:none;",
    "  font-family:Arial,Helvetica,sans-serif;user-select:none;",
    "  -webkit-user-select:none;touch-action:none;}",
    "#vc-overlay .vc-pad{position:absolute;bottom:max(18px,env(safe-area-inset-bottom));}",
    "#vc-overlay .vc-dpad{left:max(18px,env(safe-area-inset-left));",
    "  width:min(38vw,168px);height:min(38vw,168px);}",
    "#vc-overlay .vc-actions{right:max(18px,env(safe-area-inset-right));",
    "  width:min(38vw,168px);height:min(38vw,168px);}",
    "#vc-overlay .vc-btn{position:absolute;display:flex;align-items:center;",
    "  justify-content:center;box-sizing:border-box;pointer-events:auto;",
    "  cursor:pointer;color:#f4f4f4;background:rgba(20,20,26,0.42);",
    "  border:2px solid rgba(255,255,255,0.32);border-radius:14px;",
    "  font-size:clamp(18px,5vw,26px);line-height:1;font-weight:bold;",
    "  text-shadow:0 1px 2px rgba(0,0,0,0.8);",
    "  transition:background 0.05s,transform 0.05s;",
    "  -webkit-tap-highlight-color:transparent;}",
    "#vc-overlay .vc-btn.vc-active{background:rgba(120,160,255,0.62);",
    "  transform:scale(0.92);border-color:rgba(255,255,255,0.7);}",
    // D-pad: a 3x3 grid expressed with absolute spans.
    "#vc-overlay .vc-up{left:33.34%;top:0;width:33.33%;height:33.33%;",
    "  border-bottom-left-radius:4px;border-bottom-right-radius:4px;}",
    "#vc-overlay .vc-down{left:33.34%;bottom:0;width:33.33%;height:33.33%;",
    "  border-top-left-radius:4px;border-top-right-radius:4px;}",
    "#vc-overlay .vc-left{left:0;top:33.34%;width:33.33%;height:33.33%;",
    "  border-top-right-radius:4px;border-bottom-right-radius:4px;}",
    "#vc-overlay .vc-right{right:0;top:33.34%;width:33.33%;height:33.33%;",
    "  border-top-left-radius:4px;border-bottom-left-radius:4px;}",
    // Action cluster: diamond layout (A bottom, B right, X left, Y top).
    "#vc-overlay .vc-actions .vc-btn{width:38%;height:38%;border-radius:50%;}",
    "#vc-overlay .vc-y{left:31%;top:0;}",
    "#vc-overlay .vc-x{left:0;top:31%;}",
    "#vc-overlay .vc-b{right:0;top:31%;}",
    "#vc-overlay .vc-a{left:31%;bottom:0;}",
    "#vc-overlay .vc-a{color:#bfe9bf;}",
    "#vc-overlay .vc-b{color:#f0b9b9;}",
    "#vc-overlay .vc-x{color:#bcd2f5;}",
    "#vc-overlay .vc-y{color:#f0e3a8;}",
    // Menu / escape button: a pill centred along the bottom edge.
    "#vc-overlay .vc-menu{position:absolute;left:50%;",
    "  bottom:max(18px,env(safe-area-inset-bottom));",
    "  transform:translateX(-50%);width:min(18vw,92px);",
    "  height:clamp(30px,7vw,42px);border-radius:22px;",
    "  font-size:clamp(15px,4vw,22px);pointer-events:auto;}",
    "#vc-overlay .vc-menu.vc-active{transform:translateX(-50%) scale(0.9);}",
  ].join("");

  function bindButton(el, name) {
    function down(e) {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add("vc-active");
      press(name);
      if (el.setPointerCapture && e.pointerId != null) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch (ex) {}
      }
    }
    function up(e) {
      if (e) e.preventDefault();
      el.classList.remove("vc-active");
      release(name);
    }
    if (window.PointerEvent) {
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("lostpointercapture", up);
    } else {
      el.addEventListener("touchstart", down, { passive: false });
      el.addEventListener("touchend", up);
      el.addEventListener("touchcancel", up);
      el.addEventListener("mousedown", down);
      el.addEventListener("mouseup", up);
      el.addEventListener("mouseleave", up);
    }
  }

  function makeCluster(className, defs) {
    var pad = document.createElement("div");
    pad.className = "vc-pad " + className;
    for (var i = 0; i < defs.length; i++) {
      var def = defs[i];
      var btn = document.createElement("div");
      btn.className = "vc-btn " + def.cls;
      btn.textContent = def.glyph;
      bindButton(btn, def.name);
      pad.appendChild(btn);
    }
    return pad;
  }

  function build() {
    if (document.getElementById("vc-overlay")) return;

    var style = document.createElement("style");
    style.id = "vc-style";
    style.textContent = STYLE;
    document.head.appendChild(style);

    var overlay = document.createElement("div");
    overlay.id = "vc-overlay";
    overlay.appendChild(makeCluster("vc-dpad", DPAD));
    overlay.appendChild(makeCluster("vc-actions", ACTIONS));

    var menuBtn = document.createElement("div");
    menuBtn.className = "vc-btn " + MENU.cls;
    menuBtn.textContent = MENU.glyph;
    bindButton(menuBtn, MENU.name);
    overlay.appendChild(menuBtn);

    document.body.appendChild(overlay);

    // Safety: drop any held buttons when focus is lost or the page is hidden,
    // mirroring the engine's own Input.clear() on blur so a button can never
    // stay logically pressed after the pointer is gone.
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) releaseAll();
    });
  }

  if (document.body) {
    build();
  } else {
    document.addEventListener("DOMContentLoaded", build);
  }
})();

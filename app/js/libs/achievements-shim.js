/**
 * Steam achievement replacement for The Coffin of Andy and Leyley.
 *
 * The browser has no Steamworks. browser-shim.js routes Steam.awardAchievement,
 * Steam.activateAchievement and Steam.setAchievement to __achvUnlock(id), which
 * this file defines. Unlocks persist to localStorage, show a corner toast with
 * a fanfare sound, and are browsable from a new "Achievements" title menu item.
 *
 * Exposes:
 *   window.__achvUnlock(id)         -> register an unlock (idempotent)
 *   window.__achvIsUnlocked(id)     -> bool
 *   window.__achvList()             -> [{id,name,description,unlocked,unlockedAt}]
 *   window.__achvShimHookBoot()     -> called from index.html after DRM boots
 */
(function () {
  "use strict";

  // Registry

  // Canonical IDs extracted from the game's plugin-command data
  // (`achv <ID>` in Map*.json events). Order mirrors achievements.md.
  var ACHIEVEMENTS = [
    {
      id: "EP1_CLEAR",
      name: "Episode 1 Clear",
      description: "Cleared episode 1.",
    },
    {
      id: "EP2_CLEAR",
      name: "Episode 2 Clear",
      description: "Cleared episode 2.",
    },
    {
      id: "HITMAN_WINS",
      name: "Hitman Wins!",
      description: "Found the hitman.",
    },
    { id: "WARDEN_WINS", name: "Warden Wins", description: "Got caught." },
    {
      id: "NO_WITNESSES",
      name: "No Witnesses",
      description: "Left no witnesses.",
    },
    { id: "PRESENT", name: "Present", description: "Found a present." },
    {
      id: "VISION_WATCHER",
      name: "Vision Watcher",
      description: "Found an unexpected spectator.",
    },
    {
      id: "EP3D_CLEAR",
      name: "Decaying Along",
      description: "Survived Episode 3: Decay.",
    },
    {
      id: "MATH",
      name: "Little Mathematician",
      description: "Did Leyley's homework right.",
    },
    {
      id: "LEYLEYWINS_END",
      name: "_____ in a Box",
      description: "Don't grow a spine.",
    },
    {
      id: "SUMMON_LU",
      name: "Unknown Summon",
      description: "Summoned an unknown entity.",
    },
    {
      id: "TIME_CAPSULE",
      name: "Time Capsule",
      description: "Found a time capsule.",
    },
    {
      id: "HAPPY_END",
      name: "Happy end!",
      description: "The ending you deserve.",
    },
    {
      id: "SPLAT",
      name: "Splat!",
      description: "Reached the Deadest of Dead-ends End.",
    },
    {
      id: "PROPHECY_FULFILLER",
      name: "Prophecy Fulfiller",
      description: "Win at tag, just as the prophecy foretold!",
    },
    {
      id: "SHOTSEND",
      name: "Shots and Such",
      description: "Reached the Shots and Such ending.",
    },
    {
      id: "FULL_MARKS",
      name: "Full marks!",
      description: "Got full marks on a... test?",
    },
    {
      id: "UNDETECTED",
      name: "Undetected",
      description: "Left the gas stop relatively unnoticed.",
    },
    {
      id: "SISTER_SLAUGHTERER",
      name: "Sister Slaughterer",
      description: "Ran out of Ashleys.",
    },
    {
      id: "TRUEEND",
      name: "Cleared Burial",
      description: "Reached the Truest of True-ends ending.",
    },
  ];

  var STORAGE_KEY = "_achievements";
  // Same-origin paths: images are fetched from Steam CDN during the GitHub
  // Actions deploy (see .github/workflows/deploy.yml). Local dev falls back
  // to the placeholder rectangles below.
  var IMG_UNLOCKED_URL = "img/achievement-unlocked.jpg";
  var IMG_LOCKED_URL = "img/achievement-locked.jpg";
  var SOUND_PATH = "audio/me/313d5ade731cde57.ogg";

  // Persistence

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function findRegistryEntry(id) {
    var up = String(id || "").toUpperCase();
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      if (ACHIEVEMENTS[i].id === up) return ACHIEVEMENTS[i];
    }
    console.warn("[achv] unknown achievement ID:", up);
    return null;
  }

  function isUnlocked(id) {
    if (id == null) return false;
    return !!loadState()[String(id).toUpperCase()];
  }

  function unlock(id) {
    if (id == null) return false;
    var key = String(id).toUpperCase();
    var entry = findRegistryEntry(key);
    if (!entry) return false;
    var state = loadState();
    if (state[key]) return false;
    state[key] = { t: Date.now() };
    saveState(state);
    showToast(entry);
    playSound();
    return true;
  }

  window.__achvUnlock = unlock;
  window.__achvIsUnlocked = isUnlocked;
  window.__achvList = function () {
    var state = loadState();
    return ACHIEVEMENTS.map(function (a) {
      var rec = state[a.id];
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        unlocked: !!rec,
        unlockedAt: rec ? rec.t : null,
      };
    });
  };

  // Toast (DOM overlay: works regardless of scene / WebGL state)

  var _toastQueue = [];
  var _toastBusy = false;
  var _toastEl = null;

  function ensureToastEl() {
    if (_toastEl) return _toastEl;
    var d = document.createElement("div");
    d.id = "__achv-toast";
    d.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:24px",
      "z-index:100000",
      "display:flex",
      "align-items:center",
      "background:rgba(10,10,14,0.92)",
      "border:1px solid #6a5a44",
      "border-radius:6px",
      "padding:10px 14px",
      "font-family:Georgia,serif",
      "color:#e8d7b9",
      "width:360px",
      "max-width:calc(100vw - 40px)",
      "box-shadow:0 6px 24px rgba(0,0,0,0.7)",
      "transform:translateX(calc(100% + 40px))",
      "opacity:0",
      "transition:transform 0.35s ease-out, opacity 0.35s ease-out",
      "pointer-events:none",
    ].join(";");
    d.innerHTML =
      '<img id="__achv-toast-img" alt="" ' +
      'style="width:56px;height:56px;border-radius:4px;margin-right:12px;object-fit:cover;flex-shrink:0;background:#1a1a1a">' +
      '<div style="min-width:0;flex:1">' +
      '<div style="font-size:11px;letter-spacing:0.15em;color:#b5a178;text-transform:uppercase;margin-bottom:3px">Achievement Unlocked</div>' +
      '<div id="__achv-toast-name" style="font-size:16px;font-weight:bold;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>' +
      '<div id="__achv-toast-desc" style="font-size:12px;color:#c0b095;opacity:0.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>' +
      "</div>";
    document.body.appendChild(d);
    _toastEl = d;
    return d;
  }

  function showToast(entry) {
    _toastQueue.push(entry);
    if (!_toastBusy) runToastQueue();
  }

  function runToastQueue() {
    if (_toastQueue.length === 0) {
      _toastBusy = false;
      return;
    }
    _toastBusy = true;
    var entry = _toastQueue.shift();
    var d = ensureToastEl();
    var img = document.getElementById("__achv-toast-img");
    img.src = IMG_UNLOCKED_URL;
    document.getElementById("__achv-toast-name").textContent = entry.name;
    document.getElementById("__achv-toast-desc").textContent =
      entry.description || "";
    // Force reflow to reset the transition before each show
    void d.offsetWidth;
    requestAnimationFrame(function () {
      d.style.transform = "translateX(0)";
      d.style.opacity = "1";
    });
    setTimeout(function () {
      d.style.transform = "translateX(calc(100% + 40px))";
      d.style.opacity = "0";
      setTimeout(runToastQueue, 420);
    }, 4200);
  }

  function playSound() {
    try {
      var a = new Audio(SOUND_PATH);
      a.volume = 0.8;
      var p = a.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {}
  }

  // Icon preloading for the Achievements scene.
  // Served same-origin, so Bitmap.load is sufficient (no WebGL taint).

  var _iconUnlockedBmp = null;
  var _iconLockedBmp = null;
  var _iconsStarted = false;

  function _preloadIcon(url, setter) {
    if (typeof Bitmap === "undefined") return;
    var bmp = Bitmap.load(url);
    setter(bmp);
    bmp.addLoadListener(function () {
      var sc = typeof SceneManager !== "undefined" && SceneManager._scene;
      if (sc && sc._listWindow && sc._listWindow.refresh) {
        sc._listWindow.refresh();
      }
    });
  }

  function ensureIcons() {
    if (_iconsStarted) return;
    _iconsStarted = true;
    _preloadIcon(IMG_UNLOCKED_URL, function (b) {
      _iconUnlockedBmp = b;
    });
    _preloadIcon(IMG_LOCKED_URL, function (b) {
      _iconLockedBmp = b;
    });
  }

  // Scene / Window patches (deferred: DRM defines these in plugins)

  var _patchesApplied = false;

  function applyPatches() {
    if (_patchesApplied) return;
    _patchesApplied = true;

    // Title menu command injection. The DRM payload's makeCommandList
    // filters strictly to MenuOptions.labels(): we wrap AFTER it and
    // insert "Achievements" before Mods/Quit.
    if (typeof Window_TitleCommand !== "undefined") {
      var _orig_makeCmdList = Window_TitleCommand.prototype.makeCommandList;
      Window_TitleCommand.prototype.makeCommandList = function () {
        _orig_makeCmdList.call(this);
        var insertIdx = this._list.length;
        for (var i = 0; i < this._list.length; i++) {
          var sym = this._list[i].symbol;
          var nm = this._list[i].name;
          if (
            sym === "mods" ||
            sym === "quit" ||
            sym === "exitGame" ||
            nm === "Quit Game"
          ) {
            insertIdx = i;
            break;
          }
        }
        this._list.splice(insertIdx, 0, {
          name: "Achievements",
          symbol: "achievements",
          enabled: true,
          ext: null,
        });
      };

      // Widen the title command window so "Achievements" fits with its icon.
      Window_TitleCommand.prototype.windowWidth = function () {
        return 280;
      };
    }

    // Register the Achievements icon with the DRM's MenuOptions so the
    // title menu draws it next to the label (same pattern as Mods).
    if (
      typeof MenuOptions !== "undefined" &&
      MenuOptions.iconImages &&
      typeof ImageManager !== "undefined" &&
      typeof Bitmap !== "undefined"
    ) {
      var achvSheet = ImageManager.loadNormalBitmap("img/achievements.png", 0);
      var achvIcon = new Bitmap(26, 26);
      achvSheet.addLoadListener(function () {
        achvIcon.blt(
          achvSheet,
          0,
          0,
          achvSheet.width,
          achvSheet.height,
          0,
          0,
          26,
          26,
        );
        achvIcon._loadingState = "loaded";
        achvIcon._callLoadListeners();
        if (
          typeof SceneManager !== "undefined" &&
          SceneManager._scene &&
          SceneManager._scene._commandWindow
        ) {
          SceneManager._scene._commandWindow.refresh();
        }
      });
      MenuOptions.iconImages["Achievements"] = achvIcon;
    }

    if (typeof Scene_Title !== "undefined") {
      var _orig_ccw = Scene_Title.prototype.createCommandWindow;
      Scene_Title.prototype.createCommandWindow = function () {
        _orig_ccw.call(this);
        this._commandWindow.setHandler(
          "achievements",
          this.commandAchievements.bind(this),
        );
      };

      Scene_Title.prototype.commandAchievements = function () {
        this._commandWindow.close();
        SceneManager.push(Scene_Achievements);
      };
    }

    defineScenes();
    ensureIcons();
  }

  function defineScenes() {
    if (typeof Scene_MenuBase === "undefined") return;

    // Scene_Achievements

    window.Scene_Achievements = function () {
      this.initialize.apply(this, arguments);
    };

    Scene_Achievements.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Achievements.prototype.constructor = Scene_Achievements;

    Scene_Achievements.prototype.create = function () {
      Scene_MenuBase.prototype.create.call(this);
      this.createHelpWindow();
      this.createListWindow();
    };

    Scene_Achievements.prototype.createHelpWindow = function () {
      this._helpWindow = new Window_Help(1);
      var list = window.__achvList();
      var nUnlocked = 0;
      for (var i = 0; i < list.length; i++) if (list[i].unlocked) nUnlocked++;
      this._helpWindow.setText(
        "Achievements  " + nUnlocked + " / " + list.length,
      );
      this.addWindow(this._helpWindow);
    };

    Scene_Achievements.prototype.createListWindow = function () {
      var y = this._helpWindow.height;
      var w = Graphics.boxWidth;
      var h = Graphics.boxHeight - y;
      this._listWindow = new Window_AchievementList(0, y, w, h);
      this._listWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._listWindow);
    };

    // Window_AchievementList

    window.Window_AchievementList = function () {
      this.initialize.apply(this, arguments);
    };

    Window_AchievementList.prototype = Object.create(
      Window_Selectable.prototype,
    );
    Window_AchievementList.prototype.constructor = Window_AchievementList;

    Window_AchievementList.prototype.initialize = function (x, y, w, h) {
      this._items = window.__achvList();
      Window_Selectable.prototype.initialize.call(this, x, y, w, h);
      this.refresh();
      this.select(0);
      this.activate();
    };

    Window_AchievementList.prototype.maxItems = function () {
      return this._items.length;
    };

    Window_AchievementList.prototype.maxVisibleItems = function () {
      return 6;
    };

    Window_AchievementList.prototype.itemHeight = function () {
      var inner = this.height - this.padding * 2;
      return Math.floor(inner / this.maxVisibleItems());
    };

    Window_AchievementList.prototype.isCurrentItemEnabled = function () {
      return false;
    };

    Window_AchievementList.prototype.playOkSound = function () {};

    Window_AchievementList.prototype._formatDate = function (t) {
      if (!t) return "";
      var d = new Date(t);
      var pad = function (n) {
        return n < 10 ? "0" + n : "" + n;
      };
      return (
        d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
      );
    };

    Window_AchievementList.prototype.drawItem = function (index) {
      var a = this._items[index];
      if (!a) return;
      var rect = this.itemRectForText(index);
      var lh = this.lineHeight();

      var iconH = rect.height - 6;
      var iconW = iconH;
      var iconX = rect.x;
      var iconY = rect.y + 3;

      var src = a.unlocked ? _iconUnlockedBmp : _iconLockedBmp;
      if (src && src.isReady && src.isReady() && src.width > 1) {
        var scale = Math.min(iconW / src.width, iconH / src.height);
        var dw = Math.floor(src.width * scale);
        var dh = Math.floor(src.height * scale);
        var ix = iconX + Math.floor((iconW - dw) / 2);
        var iy = iconY + Math.floor((iconH - dh) / 2);
        this.contents.blt(src, 0, 0, src.width, src.height, ix, iy, dw, dh);
      } else {
        // Fallback placeholder
        var color = a.unlocked ? "#5a7a4a" : "#4a4a4a";
        this.contents.fillRect(iconX, iconY, iconW, iconH, color);
      }

      var tx = iconX + iconW + 12;
      var tw = rect.width - (tx - rect.x);

      this.resetTextColor();
      this.contents.textColor = a.unlocked ? "#f0dfbb" : "#888275";
      this.drawText(a.name, tx, rect.y, tw);

      this.contents.fontSize = 18;
      this.contents.textColor = a.unlocked ? "#c8b895" : "#6a6458";
      var desc = a.unlocked
        ? a.description
        : a.description
          ? a.description
          : "Locked";
      this.drawText(desc, tx, rect.y + lh - 4, tw);

      if (a.unlocked && a.unlockedAt) {
        this.contents.fontSize = 14;
        this.contents.textColor = "#aaaa88";
        this.drawText(
          this._formatDate(a.unlockedAt),
          rect.x,
          rect.y + 4,
          rect.width,
          "right",
        );
      }
      this.contents.fontSize = this.standardFontSize();
      this.resetTextColor();
    };
  }

  function hookSceneBoot() {
    if (typeof Scene_Boot === "undefined") return;
    var _orig_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
      applyPatches();
      return _orig_start.apply(this, arguments);
    };
  }

  window.__achvShimHookBoot = hookSceneBoot;
})();

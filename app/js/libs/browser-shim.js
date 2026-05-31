/**
 * Browser compatibility shim for The Coffin of Andy and Leyley.
 *
 * Load this script immediately after rpg_core.js (and after pako_inflate.min.js).
 *
 * Provides minimal stubs for NW.js / Node.js globals referenced by plugin code,
 * and a real zlib.inflateSync implementation (via pako) so the
 * DRM payload in the game plugins can decompress and execute in-browser.
 *
 * The fs stubs are "language-aware": they serve CLD data to the DRM payload's
 * Lang.init / Lang.loadCLD so the game finds its language files without a real
 * filesystem. Language data is fetched once from /lang-data.json (served by the
 * Service Worker or server.js).
 *
 * After decompression, BROWSER_OVERRIDES are appended to the payload source.
 * These override filesystem-dependent functions (Crypto.hashMatchDRM, Lang.search,
 * App.crash/close/report) so the payload's game logic works without Node.js.
 */
(function () {
  "use strict";

  // Language data: fetched lazily via sync XHR to /lang-data.json.
  //
  // The SW (or server.js) serves /lang-data.json with the parsed CLD
  // contents: { labelLUT, linesLUT, sysMenus, sysLabel, ... }.
  // We cache the raw JSON string and build a Buffer for loadCLD later.
  //
  // The fetch is LAZY (called from readFileSync on first CLD access)
  // rather than eager, because at browser-shim load time the SW may
  // not yet be fully ready to serve from IDB. By the time the DRM
  // payload actually calls readFileSync for the CLD, all plugin
  // scripts have already been served by the SW, guaranteeing it's up.
  var _langJSON = null;
  var _langFetched = false;

  function ensureLangData() {
    if (_langFetched) return _langJSON;
    _langFetched = true;

    // 1. Check the global set by index.html's preloadLangData() (IDB read)
    if (window.__langData && typeof window.__langData === "string") {
      _langJSON = window.__langData;
      return _langJSON;
    }

    // 2. Fallback: sync XHR (works in server.js mode)
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/lang-data.json", false); // synchronous
      xhr.send();
      if (xhr.status >= 200 && xhr.status < 400 && xhr.responseText) {
        _langJSON = xhr.responseText;
      }
    } catch (e) {
      console.warn("[browser-shim] lang-data.json XHR failed:", e);
    }
    return _langJSON;
  }

  // Helper: does `p` refer to a CLD / language data asset?
  // Matches the base game's hashed CLD path (data/9c7050ae76645487)
  // and any mod-specific langFile (e.g. data/dialogues).
  function isCLDPath(p) {
    if (typeof p !== "string") return false;
    if (p.indexOf("9c7050ae76645487") !== -1) return true;
    // Also match the active mod's langFile path (set by lang-shim.js)
    if (window.__modLangFile) {
      var np = normPath(p);
      if (
        np === window.__modLangFile ||
        np.indexOf(window.__modLangFile) !== -1
      )
        return true;
    }
    return false;
  }

  // Helper: normalise path: strip leading .\ or ./, normalise separators,
  // collapse repeated slashes (NW.js sometimes produces paths like
  // `.\languages\\english\dialogue.txt` whose `\\` becomes `//` after swap).
  function normPath(p) {
    return String(p)
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/\/+/g, "/");
  }

  // Helper: is `p` a dialogue.txt or dialogue.csv custom-translation overlay?
  // We never serve these in the browser (the merged CLD already carries the
  // active translation). Any probe for them should fail cleanly so the DRM
  // doesn't try to parse an empty XHR response.
  function isLangOverlayProbe(p) {
    return (
      typeof p === "string" &&
      /languages\/[^/]*\/?dialogue\.(txt|csv)$/i.test(normPath(p))
    );
  }

  // Helper: does `p` refer to a language dialogue.loc file?
  function isLangLocPath(p) {
    return (
      typeof p === "string" &&
      /languages\/[^/]+\/dialogue\.loc$/i.test(normPath(p))
    );
  }

  // Helper: map an .rpgsave filesystem path to its localStorage key.
  // Returns null if the path isn't a recognised save file pattern.
  //
  // `auto<ts>.rpgsave` is the DRM's autosave format (one file per
  // autosave, timestamped). Mirror them into localStorage under
  // "RPG Auto<ts>" so the DRM's Utils.{writeFile,readFile,exists,delete}
  // round-trip them through the fs shim like normal save slots.
  function rpgsaveToStorageKey(p) {
    var ps = String(p);
    if (/global\.rpgsave$/i.test(ps)) return "RPG Global";
    if (/config\.rpgsave$/i.test(ps)) return "RPG Config";
    var m = ps.match(/file(\d+)\.rpgsave$/i);
    if (m) return "RPG File" + m[1];
    var a = ps.match(/auto(\d+)\.rpgsave$/i);
    if (a) return "RPG Auto" + a[1];
    return null;
  }

  // Enumerate auto-save files persisted in localStorage for the active
  // save scope (mod-aware). Returns base filenames like "auto1234.rpgsave"
  // the DRM's Utils._dirItems then statSyncs each entry to confirm it's
  // a file. Without this, DataManager._autoSave's cleanup loop sees an
  // empty directory and wipes the autoSaves dict on every map transfer.
  function listAutoSaveFiles() {
    var scope = "";
    try {
      var s = localStorage.getItem("_activeSaveScope");
      if (s !== null) {
        scope = s;
      } else {
        var mod = localStorage.getItem("_activeMod");
        if (mod && mod.indexOf("translation_") !== 0) scope = mod;
      }
    } catch (e) {}
    var prefix = (scope ? scope + ":" : "") + "RPG Auto";
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(prefix) !== 0) continue;
        var rest = key.substring(prefix.length);
        // rest must be just digits: guards against other-scope keys
        // accidentally matching when scope is "".
        if (!/^\d+$/.test(rest)) continue;
        out.push("auto" + rest + ".rpgsave");
      }
    } catch (e) {}
    return out;
  }

  // Helper: prefix a storage key with the active save scope (if any).
  //
  // The DRM reads / writes saves through fake fs.{readFile,writeFile,
  // unlink}Sync, which routes through this helper to find the localStorage
  // entry. The save scope is broader than the active mod id: overhauls own
  // their save scope, but translation mods are transparent and share the
  // base game's scope (so French -> English doesn't orphan saves).
  //
  // lang-shim mirrors getActiveSaveScope() into localStorage under
  // "_activeSaveScope": "" means "no scope, use bare key": so this
  // module can do the translation-aware lookup without needing access
  // to the mods registry. Falls back to "_activeMod" when the scope key
  // is missing (legacy localStorage, or first paint before lang-shim
  // has had a chance to write it).
  function modAwareKey(baseKey) {
    try {
      var scope = localStorage.getItem("_activeSaveScope");
      if (scope !== null) {
        return scope ? scope + ":" + baseKey : baseKey;
      }
      var mod = localStorage.getItem("_activeMod");
      // Translation mods are transparent for saves (they share the base
      // scope so French <-> English doesn't orphan saves). When the
      // _activeSaveScope mirror hasn't been written yet (e.g. DRM payload
      // runs before lang-shim's persistSaveScope), match getActiveSaveScope's
      // logic by treating any translation_* id as no-scope. Otherwise the
      // DRM resurrects translation_<lang>:RPG Global keys we just cleaned
      // up in migrate.html, and the migration popup fires on every boot.
      if (mod && mod.indexOf("translation_") === 0) return baseKey;
      return mod ? mod + ":" + baseKey : baseKey;
    } catch (e) {
      return baseKey;
    }
  }

  // Browser overrides for DRM payload globals.
  //
  // These override game code globals (Crypto, Steam, App, Lang, etc.)
  // that assume NW.js / Node.js and break in a browser.
  //
  // Applied in two ways:
  //  1. Appended as text to zlib-decompressed payloads (original DRM path)
  //  2. Called directly via __applyBrowserOverrides() for mods that load
  //     game code differently (deobfuscated.js, GameCode.js, etc.)

  window.__browserOverridesApplied = false;

  // Captured App.dataPath() result. Each overhaul mod hardcodes its own
  // APPDATA_DIR ("CoffinAndyLeyley/" for base game and TCOAALili,
  // "CoffinAndrewRenee/" for TCOAAR, "LostCoffin/" for TLCOAAA, etc.),
  // so the fs shim cannot recognise the saves directory by a literal
  // name. We wrap App.dataPath in __applyBrowserOverrides to memoize the
  // result; readdirSync / existsSync then route any path equal to (or
  // nested under) it to the autosave list logic regardless of the
  // mod-specific folder name.
  window.__appDataPath = null;
  function isAppDataPath(p) {
    if (!window.__appDataPath) return false;
    var np = normPath(String(p)).replace(/\/+$/, "");
    var dp = window.__appDataPath.replace(/\/+$/, "");
    return np === dp || np.indexOf(dp + "/") === 0;
  }

  // Save list display: episode label + per-save annotation
  // The save rows used to show the game title, which the DRM suffixes with the
  // build version ("... v3.0.13"). We move the version under "File N" and use
  // the title line for "[Episode X] <note>" instead, where the episode is
  // derived from the map the save sits on and the note is a free-form
  // annotation the player edits (key handling lives in lang-shim). Display
  // only: no save data is written here; notes live in their own localStorage
  // keys, scoped per save slot (and thus per active mod).

  // Map id -> episode label. Ranges mirror the game's chapter/map layout.
  function detectEpisode(mapId) {
    mapId = parseInt(mapId, 10) || 0;
    if (mapId >= 3 && mapId <= 18) return "Episode 1";
    if (mapId === 221) return "Episode 4";
    if (mapId === 261) return "Episode 2";
    if (mapId >= 19 && mapId <= 107) return "Episode 2";
    if (mapId >= 1 && mapId <= 2) return "Episode 3A";
    if (mapId >= 108) return "Episode 3A";
    return "Unknown";
  }

  // Resolve the map id a save sits on by parsing the save payload once and
  // caching by on-disk path. Synchronous in browser mode: Utils.readFile hits
  // localStorage and LZString/JSON parse are sync. Works for both regular file
  // slots and autosaves (negative ids), since localFilePath maps either.
  var _mapIdCache = {};
  function saveMapId(savefileId) {
    try {
      if (
        typeof StorageManager === "undefined" ||
        typeof StorageManager.localFilePath !== "function"
      )
        return 0;
      var path = StorageManager.localFilePath(savefileId);
      if (!path) return 0;
      if (Object.prototype.hasOwnProperty.call(_mapIdCache, path))
        return _mapIdCache[path];
      var mapId = 0;
      try {
        var raw = Utils.readFile(path);
        if (raw) {
          // Save is LZString-compressed base64; the map node is plain JSON
          // ("@" class markers aside), so JSON.parse suffices for _mapId.
          var json = LZString.decompressFromBase64(String(raw).trim());
          if (json) {
            var data = JSON.parse(json);
            if (data && data.map && typeof data.map._mapId === "number")
              mapId = data.map._mapId;
          }
        }
      } catch (e) {}
      _mapIdCache[path] = mapId;
      return mapId;
    } catch (e) {
      return 0;
    }
  }

  // Full save contents for the Continue-menu scene preview. Unlike saveMapId
  // (which JSON.parses only to read _mapId), this returns the complete
  // JsonEx.parse result so the consumer gets real engine instances
  // ($gameMap, $gamePlayer, Game_Event[], $gameScreen, ...) it can swap into
  // the globals and feed to a Spriteset_Map. Cached by on-disk path and
  // dropped by the same invalidate() path as the map-id cache. Returns null
  // when JsonEx is unavailable or the save can't be read/parsed.
  var _saveContentsCache = {};
  function saveContents(savefileId) {
    try {
      if (typeof JsonEx === "undefined" || !JsonEx.parse) return null;
      if (
        typeof StorageManager === "undefined" ||
        typeof StorageManager.localFilePath !== "function"
      )
        return null;
      var path = StorageManager.localFilePath(savefileId);
      if (!path) return null;
      if (Object.prototype.hasOwnProperty.call(_saveContentsCache, path))
        return _saveContentsCache[path];
      var res = null;
      try {
        var raw = Utils.readFile(path);
        if (raw) {
          var json = LZString.decompressFromBase64(String(raw).trim());
          if (json) res = JsonEx.parse(json);
        }
      } catch (e) {
        res = null;
      }
      _saveContentsCache[path] = res;
      return res;
    } catch (e) {
      return null;
    }
  }

  // Per-save annotation storage. Keyed off the scoped web-storage key for
  // regular slots (so notes follow the active mod's save scope) and the
  // on-disk path for autosaves.
  function noteKey(savefileId) {
    try {
      if (
        savefileId > 0 &&
        typeof StorageManager !== "undefined" &&
        typeof StorageManager.webStorageKey === "function"
      )
        return "saveNote:" + StorageManager.webStorageKey(savefileId);
    } catch (e) {}
    try {
      var p = StorageManager.localFilePath(savefileId);
      if (p) return "saveNote:auto:" + p;
    } catch (e) {}
    return "saveNote:id:" + savefileId;
  }
  function getSaveNote(savefileId) {
    try {
      return localStorage.getItem(noteKey(savefileId)) || "";
    } catch (e) {
      return "";
    }
  }
  function setSaveNote(savefileId, text) {
    try {
      var k = noteKey(savefileId);
      if (text) localStorage.setItem(k, String(text));
      else localStorage.removeItem(k);
    } catch (e) {}
  }

  // Default per-save annotation: the wall-clock time the save was created,
  // formatted to the user's locale (browser/OS date+time preferences) via
  // toLocaleString. It is written into the regular note store (so the player
  // can freely edit or clear it via Annotate), never into the save payload.
  function formatSaveTimestamp(ms) {
    var d = new Date(typeof ms === "number" ? ms : Date.now());
    try {
      // Locale default short-ish date + time with seconds, honouring the
      // user's region (12h/24h, D/M/Y order, separators).
      return d.toLocaleString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      // Very old engines / locked-down Intl: fall back to the raw locale form.
      try {
        return d.toLocaleString();
      } catch (e2) {
        return "" + d;
      }
    }
  }
  // We can't recognise "still an untouched auto-timestamp" by pattern once the
  // format is locale-dependent, so record the exact string we last auto-wrote
  // in a companion key. Saving over a slot refreshes the time only while the
  // note still equals that recorded value; the moment the player edits it the
  // marker is dropped and the custom note is left alone forever after.
  function autoNoteMarkerKey(savefileId) {
    return noteKey(savefileId) + ":auto";
  }
  function getAutoNoteMarker(savefileId) {
    try {
      return localStorage.getItem(autoNoteMarkerKey(savefileId)) || "";
    } catch (e) {
      return "";
    }
  }
  function setAutoNoteMarker(savefileId, text) {
    try {
      var k = autoNoteMarkerKey(savefileId);
      if (text) localStorage.setItem(k, String(text));
      else localStorage.removeItem(k);
    } catch (e) {}
  }
  // Stamp the default creation-time note onto a freshly written file slot.
  // Skips autosaves (negative ids, keyed by path and labelled "Auto N") and
  // any slot whose note the player has already customised.
  function applyDefaultSaveNote(savefileId) {
    if (typeof savefileId !== "number" || savefileId <= 0) return;
    var cur = getSaveNote(savefileId);
    var marker = getAutoNoteMarker(savefileId);
    if (!cur || cur === marker) {
      var stamp = formatSaveTimestamp(Date.now());
      setSaveNote(savefileId, stamp);
      setAutoNoteMarker(savefileId, stamp);
    } else if (marker) {
      // Player customised the note: stop treating it as auto.
      setAutoNoteMarker(savefileId, "");
    }
  }

  // Pull the "v3.0.13" suffix the DRM appends to the game title; fall back to
  // the GAME_VERSION global (defined in www/js/main.js).
  function saveVersion(info) {
    var m = info && info.title && String(info.title).match(/\sv(\d[\w.]*)$/i);
    if (m) return "v" + m[1];
    if (typeof window.GAME_VERSION === "string" && window.GAME_VERSION)
      return "v" + window.GAME_VERSION;
    return "";
  }

  // Shared API consumed by lang-shim's annotation editor.
  window.__saveDisplay = {
    detectEpisode: detectEpisode,
    mapId: saveMapId,
    contents: saveContents,
    episodeFor: function (savefileId) {
      return detectEpisode(saveMapId(savefileId));
    },
    getNote: getSaveNote,
    setNote: setSaveNote,
    // Format a timestamp the same way new saves are auto-annotated, and a
    // predicate for "this slot's note is still the untouched creation
    // timestamp" (current note still equals the recorded auto value).
    formatTimestamp: formatSaveTimestamp,
    isAutoNote: function (savefileId) {
      var m = getAutoNoteMarker(savefileId);
      return !!m && getSaveNote(savefileId) === m;
    },
    // Invalidate the cached map id and parsed contents after a save changes.
    invalidate: function (savefileId) {
      try {
        var p = StorageManager.localFilePath(savefileId);
        delete _mapIdCache[p];
        delete _saveContentsCache[p];
      } catch (e) {}
    },
    // Character capacity of the title line, refreshed whenever a row draws.
    // Used to bound annotation length: note fits the remainder of the line
    // after "[Episode X] ".
    lineChars: 30,
    noteMax: function (episodeLabel) {
      // total - "[label]".length - 1 (the separating space)
      return Math.max(
        0,
        (this.lineChars || 30) - (episodeLabel.length + 2) - 1,
      );
    },
  };

  window.__applyBrowserOverrides = function () {
    if (window.__browserOverridesApplied) return;
    window.__browserOverridesApplied = true;

    // Wrap App.dataPath to capture its current return value. The DRM
    // builds it from process.env.APPDATA + APPDATA_DIR; process.env is
    // empty in the browser so the result collapses to "/<APPDATA_DIR>".
    // We need this for the fs shim to recognise the saves directory
    // regardless of which overhaul is active.
    if (typeof App !== "undefined" && typeof App.dataPath === "function") {
      var _origAppDataPath = App.dataPath;
      App.dataPath = function () {
        var result = _origAppDataPath.apply(this, arguments);
        try {
          window.__appDataPath = normPath(String(result)).replace(/\/+$/, "");
        } catch (e) {}
        return result;
      };
      // Prime the cache immediately so any subsequent fs call has a
      // value to compare against, even before the DRM's first explicit
      // call (DataManager.init does call it first, but be defensive).
      try {
        App.dataPath();
      } catch (e) {}
    }

    // Skip DRM hash check (reads a file from disk)
    if (typeof Crypto !== "undefined") {
      Crypto.hashMatchDRM = function () {
        return true;
      };

      // Crypto.dekit: pass through (SW/server already decrypts assets)
      Crypto.dekit = function (data) {
        return data;
      };

      // Crypto.resolveURL / resolvePath: fix for browser mode.
      if (typeof Crypto.generateHashFromUnencryptedFilePath === "function") {
        var _copylistLoaded = false;
        var _copylistLoadAttempted = false;
        var _cryptoLoadCopylist = function () {
          if (_copylistLoadAttempted) return;
          _copylistLoadAttempted = true;
          try {
            var modId = null;
            try {
              modId = localStorage.getItem("_activeMod");
            } catch (e) {}
            if (!modId) return;
            var copylistUrl = "/mods/" + modId + "/www/data/Copylist.txt";
            var xhr = new XMLHttpRequest();
            xhr.open("GET", copylistUrl, false);
            xhr.send();
            if (xhr.status < 200 || xhr.status >= 400) return;
            var text = xhr.responseText;
            if (!text) return;
            if (
              !Crypto._hashToPathMap ||
              typeof Crypto._hashToPathMap.set === "function"
            ) {
              Crypto._hashToPathMap = {};
            }
            var lines = text.split("\n");
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (!line) continue;
              var comma = line.lastIndexOf(",");
              if (comma < 0) continue;
              var encPath = line.substring(0, comma).replace(/\\/g, "/");
              var hash = line.substring(comma + 1);
              Crypto._hashToPathMap[hash] = encPath;
            }
            _copylistLoaded = true;
          } catch (e) {
            console.warn("[browser-shim] Copylist load failed:", e);
          }
        };
        var _cryptoTryResolve = function (url) {
          if (!_copylistLoaded) _cryptoLoadCopylist();
          var h = Crypto.generateHashFromUnencryptedFilePath(url);
          if (
            _copylistLoaded &&
            Crypto._hashToPathMap &&
            h in Crypto._hashToPathMap
          ) {
            return Crypto._hashToPathMap[h];
          }
          return url;
        };
        if (typeof Crypto.resolveURL === "function") {
          Crypto.resolveURL = function (url) {
            url = decodeURIComponent(url);
            if (Crypto._pathMap && url in Crypto._pathMap)
              return Crypto._pathMap[url];
            var resolved = _cryptoTryResolve(url);
            if (Crypto._pathMap) {
              Crypto._pathMap[url] = resolved;
              Crypto._pathMap[resolved] = resolved;
            }
            return resolved;
          };
        }
        if (typeof Crypto.resolvePath === "function") {
          Crypto.resolvePath = function (filePath) {
            if (Crypto._pathMap && filePath in Crypto._pathMap)
              return Crypto._pathMap[filePath];
            var resolved = _cryptoTryResolve(filePath);
            if (Crypto._pathMap) {
              Crypto._pathMap[filePath] = resolved;
              Crypto._pathMap[resolved] = resolved;
            }
            return resolved;
          };
        }
      }
    }

    // Steam: override all methods that access Steam.API (null in browser).
    // Achievement calls dispatch to achievements-shim.js (if loaded).
    if (typeof Steam !== "undefined") {
      Steam.init = function () {
        return true;
      };
      Steam.currentLanguage = function () {
        return "english";
      };
      Steam.awardAchievement = function (id) {
        if (typeof window.__achvUnlock === "function") window.__achvUnlock(id);
      };
      Steam.activateAchievement = function (id) {
        if (typeof window.__achvUnlock === "function") window.__achvUnlock(id);
      };
      Steam.setAchievement = function (id) {
        if (typeof window.__achvUnlock === "function") window.__achvUnlock(id);
      };
      Steam.clearAllAchievements = function () {};
      if (typeof Steam.isInitialized === "function")
        Steam.isInitialized = function () {
          return true;
        };
      if (typeof Steam.retryInit === "function")
        Steam.retryInit = function () {
          return true;
        };
    }

    // Non-blocking crash (prevent alert() freeze + nw.gui close)
    if (typeof App !== "undefined") {
      App.crash = function (msg) {
        console.error("[DRM] CRITICAL:", msg);
      };
      // Quit Game (title menu) -> back to the loader so the user lands
      // on the manage UI instead of an inert tab. window.close() (which
      // stock SceneManager.terminate calls) is a no-op for tabs the user
      // opened themselves, so the original code path was a dead end.
      App.close = function () {
        window.location.href = "/loader.html";
      };
      App.report = function () {};
    }
    if (typeof SceneManager !== "undefined") {
      SceneManager.terminate = function () {
        window.location.href = "/loader.html";
      };
    }

    // "Now Loading" image: force our bundled themed loading.png.
    //
    // The stock engine sets Graphics._loadingImage from a plain
    // `new Image()` whose src is the canonical "img/system/Loading.png",
    // which the SW/server swap for /img/loading.png. But the DRM payload
    // overrides Graphics.setLoadingImage to route through
    // ImageManager.loadNormalBitmap -> Bitmap._requestImage ->
    // Crypto.resolveURL, which (when an overhaul is active and its Copylist
    // is loaded) resolves the canonical path to the MOD's own encrypted
    // asset. The canonical-path swap never fires and the player sees the
    // mod/game loading image instead of ours. Bypass the whole pipeline:
    // load /img/loading.png straight into Graphics._loadingImage as a raw
    // Image (exactly what Graphics.draw consumes), so the themed image
    // shows in every context, online or offline.
    if (typeof Graphics !== "undefined") {
      Graphics.setLoadingImage = function () {
        var img = new Image();
        img.src = "/img/loading.png";
        Graphics._loadingImage = img;
      };
      // Re-apply now in case the engine already called the original during
      // boot before these overrides were installed.
      Graphics.setLoadingImage();
    }

    // Lang.search: single-language browser variant. The SW synthesises
    // /lang-data.json by merging the base CLD with any active translation
    // mod, so we don't enumerate languages client-side; one entry is enough.
    //
    // Key choice: native Lang.search keys this.list by the LANGUAGE FOLDER
    // NAME ("english"), not data.langName: Lang.select then iterates
    // [arg, steamLang, LANG_LOC="english", LANG_TXT, LANG_CSV] and only
    // matches list entries under those exact keys. Using langName (e.g.
    // "English" capitalised, or a mod's localised label) as the list key
    // would make Lang.select fall through to the "Default languages
    // missing." crash path and clear ConfigManager.language.
    if (typeof Lang !== "undefined") {
      Lang.search = function () {
        try {
          var data = null;
          var json = ensureLangData();
          if (json) {
            try {
              var js = json.indexOf("{");
              if (js >= 0) data = JSON.parse(json.substring(js));
            } catch (e) {}
          }

          // Fixed key matching LANG_LOC / the english/ folder: what every
          // DRM variant's Lang.select looks up as its baseline fallback.
          var LIST_KEY = "english";
          this.list = {};
          this.list[LIST_KEY] = "languages/" + LIST_KEY + "/dialogue.loc";
          this.offc = [LIST_KEY];
          this.data = this.data || {};
          // Reject non-object payloads (e.g. JSON.parse('""') -> '').
          // Writing imageLUT onto a primitive throws a confusing
          // "Cannot create property imageLUT on string ''" on mobile.
          if (data && typeof data === "object" && !Array.isArray(data)) {
            // TCOAALili-style DRM requires imageLUT; base DRM requires
            // imgFiles. Guarantee both so Lang.isValid passes.
            if (!data.imageLUT || typeof data.imageLUT !== "object")
              data.imageLUT = {};
            if (!data.imgFiles || typeof data.imgFiles !== "object")
              data.imgFiles = {};
            this.data[LIST_KEY] = data;
          } else if (json) {
            console.warn(
              "[browser-shim] Lang.search: language data was not a JSON object",
            );
          }
        } catch (e) {
          console.warn("[browser-shim] Lang.search failed:", e);
        }
      };

      // Lang.imgMapping: no translated images in browser mode
      Lang.imgMapping = function () {};
    }

    // Force fullscreen off and hide it from the options menu.
    if (typeof ConfigManager !== "undefined") {
      ConfigManager.fullscreen = false;
      var _drm_applyData = ConfigManager.applyData;
      ConfigManager.applyData = function (config) {
        _drm_applyData.call(this, config);
        this.fullscreen = false;
      };
    }

    // Remove the Fullscreen row from the options window.
    if (
      typeof Window_Options !== "undefined" &&
      Window_Options.prototype.makeCommandList
    ) {
      var _drm_makeCmdList = Window_Options.prototype.makeCommandList;
      Window_Options.prototype.makeCommandList = function () {
        _drm_makeCmdList.call(this);
        for (var i = this._list.length - 1; i >= 0; i--) {
          if (this._list[i].symbol === "fullscreen") {
            this._list.splice(i, 1);
          }
        }
      };
    }

    // Uncap save slots; show max(50, saveCount + 5) in the save/load list.
    // Stock DRM hardcodes maxSavefiles to 30 or 50 and Window_SavefileList
    // derives its row count from it, so overriding maxSavefiles feeds both
    // the slot allocator (selectSavefileForNewGame uses numSaves <
    // maxSavefiles to pick the next id) and the visible UI.
    if (
      typeof DataManager !== "undefined" &&
      typeof StorageManager !== "undefined"
    ) {
      var _saveCountCache = { value: -1, expires: 0 };
      // Use the highest occupied slot (not the count) so sparse layouts
      // e.g. a save at slot 50 with only a handful of others: keep the
      // top slot visible plus 5 empty rows above it for the multi-import
      // path to land on.
      var _highestSaveSlot = function () {
        var now = Date.now();
        if (_saveCountCache.value >= 0 && now < _saveCountCache.expires) {
          return _saveCountCache.value;
        }
        var top = 0;
        try {
          var json = StorageManager.load(0);
          if (json) {
            var info = JSON.parse(json);
            if (info && info.length) {
              for (var i = 1; i < info.length; i++) {
                if (info[i] && StorageManager.exists(i) && i > top) top = i;
              }
            }
          }
        } catch (e) {}
        _saveCountCache.value = top;
        _saveCountCache.expires = now + 250;
        return top;
      };
      // Read globalInfo directly via StorageManager.load(0): stock
      // loadGlobalInfo itself iterates 1..maxSavefiles() to clean stale
      // entries, so reading it here would be a recursion trap.
      DataManager.maxSavefiles = function () {
        return Math.max(50, _highestSaveSlot() + 5);
      };
      // Invalidate the cache the moment a slot is written or deleted so
      // the next refresh of the save list reflects the new top slot.
      // StorageManager.save is hooked too because the import path writes
      // through it directly instead of going via DataManager.saveGame.
      if (typeof StorageManager.save === "function") {
        var _drm_smSave = StorageManager.save;
        StorageManager.save = function (id) {
          var r = _drm_smSave.apply(this, arguments);
          _saveCountCache.value = -1;
          return r;
        };
      }
      if (typeof StorageManager.remove === "function") {
        var _drm_remove = StorageManager.remove;
        StorageManager.remove = function (id) {
          var r = _drm_remove.apply(this, arguments);
          _saveCountCache.value = -1;
          return r;
        };
      }
    }

    // Cap auto-saves at ConfigManager.autoSaves (the user's option), not
    // the DRM's hardcoded autoSaveMax() of 5. Without this, lowering the
    // option past 5 leaves orphan auto<ts>.rpgsave entries on disk: visible
    // count = min(config, files.length) but the file list keeps growing
    // up to 5. The replacement mirrors the DRM's _autoSave verbatim and
    // only swaps the cap; the rest of the engine (autoSaveMax, the options
    // menu's clamp upper bound) is untouched so the slider still scrolls
    // 0..5.
    if (
      typeof DataManager !== "undefined" &&
      typeof DataManager._autoSave === "function" &&
      typeof Utils !== "undefined" &&
      typeof App !== "undefined"
    ) {
      DataManager._autoSave = function () {
        var cap = (ConfigManager && ConfigManager.autoSaves) || 0;
        if (cap < 1) return;
        $gameSystem.onBeforeSave();
        var dataPath = App.dataPath();
        var fname = "auto" + Date.now() + ".rpgsave";
        var fpath = Utils.join(dataPath, fname);
        var contents = JsonEx.stringify(this.makeSaveContents());
        var payload = LZString.compressToBase64(contents);
        if (!Utils.writeFile(fpath, payload)) return;
        var autos = [];
        var entries = Utils.files(dataPath) || [];
        for (var i = 0; i < entries.length; i++) {
          var name = entries[i];
          var lower = name.toLowerCase();
          if (
            lower.indexOf("auto") === 0 &&
            lower.lastIndexOf(".rpgsave") === lower.length - 8
          ) {
            autos.push(name);
          }
        }
        this.sortDesc(autos);
        while (autos.length > cap) {
          Utils.delete(Utils.join(dataPath, autos.pop()));
        }
        var nextDict = {};
        var prevDict = this.globalGet("autoSaves", {});
        prevDict[fname] = this.makeSavefileInfo();
        for (var j = 0; j < autos.length; j++) {
          var key = autos[j];
          nextDict[key] = prevDict.hasOwnProperty(key)
            ? prevDict[key]
            : this.recoveryMeta();
        }
        this.globalSet("autoSaves", nextDict);
      };
    }

    // Upgrade placeholder save entries by parsing the actual save data.
    //
    // DataManager.init enumerates auto*.rpgsave / file*.rpgsave on disk
    // and inserts placeholder entries (recoveryMeta: title="Recovered
    // Game", characters=[], faces=[], playtime="") for files not
    // already tracked in globalInfo. The save list UI then shows
    // "Recovered Game" with no portrait or playtime until the user
    // opens the file once. In browser mode the save data is sitting
    // right there in localStorage; parsing it lets us populate the
    // real title/portraits/playtime.
    //
    // The upgrade has to run AFTER $dataSystem is loaded, because
    // makeSavefileInfo reads $dataSystem.gameTitle. DataManager.init
    // runs in SceneManager.run BEFORE Scene_Boot.create kicks off the
    // database load, so we wrap Scene_Boot.prototype.start instead:
    // it's the first synchronous point where the database is ready
    // AND globalInfo has been populated by DataManager.init.
    //
    // Mirrors the same swap-globals trick that lang-shim's import path
    // uses (makeInfoFromContents): rehydrated contents have the right
    // prototypes, so briefly assigning them to $gameSystem/$gameParty/
    // $gameActors lets DataManager.makeSavefileInfo build a real info
    // object without actually loading the save.
    if (
      typeof Scene_Boot !== "undefined" &&
      typeof Scene_Boot.prototype.start === "function" &&
      typeof JsonEx !== "undefined" &&
      typeof LZString !== "undefined"
    ) {
      var _origSceneBootStart = Scene_Boot.prototype.start;
      Scene_Boot.prototype.start = function () {
        try {
          upgradeRecoveredSaveInfo();
        } catch (e) {
          console.warn("[browser-shim] save info recovery failed:", e);
        }
        return _origSceneBootStart.apply(this, arguments);
      };
    }

    // Also expose for callers that want to refresh on demand (e.g.
    // before opening Scene_Save / Scene_Load if new files dropped in).
    window.__upgradeRecoveredSaveInfo = function () {
      try {
        upgradeRecoveredSaveInfo();
      } catch (e) {
        console.warn("[browser-shim] save info recovery failed:", e);
      }
    };

    // Window_SavefileList.prototype.drawItem styling parity.
    //
    // The base game (and TCOAALili / TLCOAAA) draw the auto-save row
    // with green "Auto N" text on a dark blue-gray background, dimming
    // opacity when no savefile info is available. TCOAAR's DRM ships a
    // dimmer variant: dark-gray text outside save mode and no opacity
    // dimming, so recovered/missing slots are visually indistinguishable
    // from active ones. Apply the base-game styling uniformly so the UI
    // looks the same regardless of which overhaul is active.
    if (
      typeof Window_SavefileList !== "undefined" &&
      typeof Window_SavefileList.prototype.drawItem === "function"
    ) {
      Window_SavefileList.prototype.drawItem = function (index) {
        var itemRect = this.itemRectForText(index);
        var autoSaveCount = DataManager.autoSaveCount();
        var adjustedIndex = index + 1;
        if (adjustedIndex > autoSaveCount) {
          adjustedIndex -= autoSaveCount;
        } else {
          adjustedIndex = -adjustedIndex + 1;
        }
        var saveInfo = DataManager.getSaveInfo(adjustedIndex);
        this.resetTextColor();
        this.changePaintOpacity(true);
        if (adjustedIndex > 0) {
          var fileText = TextManager.file + " " + adjustedIndex;
          this.drawText(fileText, itemRect.x, itemRect.y, 180);
        } else {
          var padding = 20;
          var textColor = "#B2E087";
          var bgColor = "rgba(65, 73, 87, 0.2)";
          var autoText = "Auto " + (Math.abs(adjustedIndex) + 1);
          if (this._mode === "save") {
            textColor = "#363636";
          }
          this.contents.fillRect(
            itemRect.x - padding,
            itemRect.y,
            itemRect.width + padding * 2,
            itemRect.height,
            bgColor,
          );
          this.changePaintOpacity(saveInfo != null);
          this.changeTextColor(textColor);
          this.drawText(autoText, itemRect.x, itemRect.y, 180);
          this.resetTextColor();
        }
        if (saveInfo) {
          if (this._mode === "save" && adjustedIndex < 1) {
            this.changePaintOpacity(false);
          } else {
            this.changePaintOpacity(true);
          }
          // Build version under the file/auto label (it no longer rides in the
          // title). Dim, half-size, tucked on the next line.
          var ver = saveVersion(saveInfo);
          if (ver) {
            var prevSize = this.contents.fontSize;
            this.contents.fontSize = Math.floor(this.standardFontSize() * 0.7);
            this.changeTextColor("#9aa0a8");
            this.drawText(
              ver,
              itemRect.x,
              itemRect.y + this.lineHeight() - 4,
              180,
            );
            this.resetTextColor();
            this.contents.fontSize = prevSize;
          }
          // Hand the current row's id to drawGameTitle (which has no id of its
          // own) so it can resolve the episode and note.
          this._curSaveId = adjustedIndex;
          this.drawContents(saveInfo, itemRect, true);
        }
      };

      // Replace the game-title line with "[Episode X] <note>".
      Window_SavefileList.prototype.drawGameTitle = function (
        info,
        x,
        y,
        width,
      ) {
        var saveId = this._curSaveId;
        var label = detectEpisode(saveMapId(saveId));
        // Refresh the shared line-char capacity for the annotation editor,
        // estimated from an average glyph width at the current font.
        try {
          var sample = "abcdefghijklmnopqrstuvwxyz0123456789";
          var avg = this.contents.measureTextWidth(sample) / sample.length || 8;
          window.__saveDisplay.lineChars = Math.max(1, Math.floor(width / avg));
        } catch (e) {}
        var prefix = "[" + label + "]";
        this.resetTextColor();
        this.drawText(prefix, x, y, width);
        var used = this.textWidth(prefix + " ");
        var remain = width - used;
        // Inline note editor: when this row is the one being annotated, render
        // the live edit buffer + a blinking caret in place of the stored note.
        // The edit state (_noteEdit) is driven by Scene_File in lang-shim.
        var edit = this._noteEdit;
        if (edit && edit.id === saveId) {
          if (remain > 8) this._drawNoteEditor(edit, x + used, y, remain);
          return;
        }
        var note = getSaveNote(saveId);
        if (note && remain > 0) {
          this.changeTextColor("#aab0b8");
          this.drawText(note, x + used, y, remain);
          this.resetTextColor();
        }
      };

      // Draw the in-progress note text + caret for the inline editor onto an
      // offscreen bitmap (clipped to the available width, scrolled to keep the
      // caret visible), then blit it onto the row.
      Window_SavefileList.prototype._drawNoteEditor = function (edit, x, y, w) {
        var lh = this.lineHeight();
        if (
          !this._noteEditBmp ||
          this._noteEditBmp.width !== w ||
          this._noteEditBmp.height !== lh
        ) {
          this._noteEditBmp = new Bitmap(w, lh);
        }
        var fb = this._noteEditBmp;
        fb.clear();
        fb.fontFace = this.contents.fontFace;
        fb.fontSize = this.contents.fontSize;
        fb.textColor = "#ffffff";
        var text = edit.text || "";
        var innerPad = 2;
        var avail = w - innerPad * 2;
        var caretPx = fb.measureTextWidth(text.slice(0, edit.caret));
        var sc = edit.scroll || 0;
        if (caretPx - sc > avail) sc = caretPx - avail;
        if (caretPx - sc < 0) sc = caretPx;
        if (sc < 0) sc = 0;
        if (fb.measureTextWidth(text) <= avail) sc = 0;
        edit.scroll = sc;
        if (text) {
          fb.drawText(
            text,
            innerPad - sc,
            0,
            fb.measureTextWidth(text) + 8,
            lh,
            "left",
          );
        }
        // Blink the caret ~twice a second.
        if (Math.floor((edit.blink || 0) / 30) % 2 === 0) {
          fb.fillRect(innerPad + caretPx - sc, 4, 2, lh - 8, "#ffffff");
        }
        this.contents.blt(fb, 0, 0, w, lh, x, y);
      };
    }

    // Writing a slot reuses its path, so the cached map id (and thus episode)
    // would go stale after a save-over. Clear the cache on every write.
    if (typeof StorageManager !== "undefined" && StorageManager.save) {
      var _origStorageSave = StorageManager.save;
      StorageManager.save = function (savefileId, json) {
        _mapIdCache = {};
        _saveContentsCache = {};
        var result = _origStorageSave.apply(this, arguments);
        // Give the slot its creation time as a default, editable note.
        try {
          applyDefaultSaveNote(savefileId);
        } catch (e) {}
        return result;
      };
    }
  };

  // Parse a single .rpgsave from localStorage (via the fs shim) into a
  // savefile info object, without actually loading the game. Returns
  // null when the file is missing, corrupt, or lacks the fields needed
  // by makeSavefileInfo.
  function parseSavefileInfo(dataPath, fname) {
    try {
      var fpath = Utils.join(dataPath, fname);
      var data = Utils.readFile(fpath);
      if (!data) return null;
      var contents = JsonEx.parse(LZString.decompressFromBase64(data));
      if (
        !contents ||
        !contents.system ||
        !contents.party ||
        !contents.actors
      ) {
        return null;
      }
      // Mirror DRM loadGame's _framesOnSave -> _secondsPlayed conversion
      // so playtimeText renders on legacy saves.
      if (typeof contents.system._secondsPlayed !== "number") {
        contents.system._secondsPlayed =
          (contents.system._framesOnSave || 0) / 60;
      }
      var prevSystem = window.$gameSystem;
      var prevParty = window.$gameParty;
      var prevActors = window.$gameActors;
      try {
        window.$gameSystem = contents.system;
        window.$gameParty = contents.party;
        window.$gameActors = contents.actors;
        return DataManager.makeSavefileInfo();
      } finally {
        window.$gameSystem = prevSystem;
        window.$gameParty = prevParty;
        window.$gameActors = prevActors;
      }
    } catch (e) {
      return null;
    }
  }

  // An entry "needs upgrade" when it's the recoveryMeta placeholder OR
  // is missing the fields the savefile list draws. Catching the wider
  // case means saves that were ever flushed with incomplete metadata
  // (e.g. info parsed before $dataSystem loaded) still get a real
  // pass next boot.
  function needsInfoUpgrade(entry) {
    if (!entry) return false;
    if (entry.title === "Recovered Game") return true;
    if (!entry.title) return true;
    if (!entry.characters || !entry.characters.length) return true;
    if (!entry.playtime) return true;
    return false;
  }

  // Walk globalInfo's autoSaves dict and numeric save slots, replacing
  // any placeholder entry with a real info object parsed from the
  // underlying .rpgsave. Preserves the timestamp the DRM set from the
  // filename (more deterministic than Date.now()).
  function upgradeRecoveredSaveInfo() {
    if (
      typeof DataManager === "undefined" ||
      typeof App === "undefined" ||
      typeof App.dataPath !== "function" ||
      typeof DataManager.loadGlobalInfo !== "function"
    ) {
      return;
    }
    var dataPath = App.dataPath();
    var globalInfo = DataManager.loadGlobalInfo();
    if (!Array.isArray(globalInfo)) return;
    var changed = false;

    if (globalInfo[0] && globalInfo[0].autoSaves) {
      var dict = globalInfo[0].autoSaves;
      for (var fname in dict) {
        if (!Object.prototype.hasOwnProperty.call(dict, fname)) continue;
        var entry = dict[fname];
        if (needsInfoUpgrade(entry)) {
          var info = parseSavefileInfo(dataPath, fname);
          if (info) {
            // Preserve the filename-derived timestamp so the sort order
            // the DRM established in DataManager.init survives.
            info.timestamp = (entry && entry.timestamp) || info.timestamp;
            dict[fname] = info;
            changed = true;
          }
        }
      }
    }

    for (var i = 1; i < globalInfo.length; i++) {
      var fe = globalInfo[i];
      if (needsInfoUpgrade(fe)) {
        var slotInfo = parseSavefileInfo(dataPath, "file" + i + ".rpgsave");
        if (slotInfo) {
          slotInfo.timestamp = (fe && fe.timestamp) || slotInfo.timestamp;
          globalInfo[i] = slotInfo;
          changed = true;
        }
      }
    }

    if (changed && typeof DataManager.saveGlobalInfo === "function") {
      DataManager.saveGlobalInfo(globalInfo);
    }
  }

  // String version of the overrides for appending to zlib-decompressed
  // payloads (the original DRM path). This calls the same function above.
  var BROWSER_OVERRIDES =
    "\n;if(window.__applyBrowserOverrides)window.__applyBrowserOverrides();\n";

  // Safe fallback for _() calls in mods that don't define it.
  //
  // Some mods (e.g. "none" DRM type) reference _() in plugin files
  // (ARP_TitleCommandExit.js, AudioStreaming.js) without defining the
  // DRM assembler function. Define a no-op to prevent ReferenceError.
  // The real _() is defined later by the mod's plugin if it has one,
  // overwriting this fallback.
  if (typeof window._ === "undefined") {
    window._ = function () {};
  }

  // Uint8Array prototype extensions for Node.js Buffer compatibility.
  //
  // The DRM payload's loadCLD does:
  //   buffer.slice(0, n).equals(LANG_SIG)
  //   buffer.slice(n).toString('utf8')
  // Native Uint8Array.slice returns a plain Uint8Array without these
  // methods, so we add them to the prototype.

  if (!Uint8Array.prototype.equals) {
    Uint8Array.prototype.equals = function (other) {
      if (!other || this.length !== other.length) return false;
      for (var i = 0; i < this.length; i++) {
        if (this[i] !== other[i]) return false;
      }
      return true;
    };
  }

  // Save the original toString (returns "1,2,3,..." by default).
  var _u8aOrigToString = Uint8Array.prototype.toString;
  Uint8Array.prototype.toString = function (encoding) {
    if (encoding === "utf-8" || encoding === "utf8") {
      return new TextDecoder("utf-8").decode(this);
    }
    if (encoding === "base64") {
      var s = "";
      for (var i = 0; i < this.length; i++) s += String.fromCharCode(this[i]);
      return btoa(s);
    }
    // No encoding argument -> original behaviour
    return _u8aOrigToString.call(this);
  };

  // Node.js / NW.js global stubs

  // require(): provides real zlib via pako, language-aware fs, stubs
  // for path/crypto/os.
  if (typeof require === "undefined") {
    window.require = function (mod) {
      if (mod === "fs") {
        return {
          existsSync: function (p) {
            if (isCLDPath(p)) {
              // For the mod's langFile, always report as existing:
              // the file is in IDB and the SW can serve it via XHR.
              if (
                window.__modLangFile &&
                normPath(p).indexOf(window.__modLangFile) !== -1
              )
                return true;
              return !!ensureLangData();
            }
            var ps = String(p);
            // .rpgsave -> check localStorage (DRM validates via fs)
            if (/\.rpgsave$/i.test(ps)) {
              var sk = rpgsaveToStorageKey(ps);
              return sk ? !!localStorage.getItem(modAwareKey(sk)) : false;
            }
            // config.settings -> the DRM's ConfigManager persists options
            // here via Utils.writeFile, not via StorageManager. Treat it
            // like a save key so options round-trip through localStorage.
            if (/config\.settings$/i.test(ps)) {
              return !!localStorage.getItem(modAwareKey("RPG Settings"));
            }
            // Other .settings files -> not in browser
            if (/\.settings$/i.test(ps)) return false;
            // Block dialogue.txt / dialogue.csv custom-overlay probes: the
            // merged CLD (served via dialogue.loc) already contains the
            // active translation. If these probes returned true, the DRM
            // would readFileSync them via XHR, get an empty buffer, and
            // fail to parse: corrupting language data.
            if (isLangOverlayProbe(ps)) return false;
            // Save directory: report as existing for any mod's
            // App.dataPath() (CoffinAndyLeyley, CoffinAndrewRenee,
            // LostCoffin, ...), plus the legacy literal for safety.
            if (isAppDataPath(ps) || ps.indexOf("CoffinAndyLeyley") !== -1)
              return true;
            // Return true for all game-related paths.
            // The DRM uses existsSync for validation (folder, data dir).
            // Actual file access goes through readFileSync or XHR.
            return true;
          },
          readFileSync: function (p, encoding) {
            if (isCLDPath(p)) {
              var json = ensureLangData();
              if (json) {
                // Build CLD buffer: "LANGDATA" (8 bytes) + JSON
                var cldStr = "LANGDATA" + json;
                if (encoding === null || encoding === undefined) {
                  return window.Buffer.from(cldStr, "utf8");
                }
                return cldStr;
              }
            }
            // Language .loc file: serve from preloaded __langData.
            // The DRM's Lang.loadLOC reads .loc files via fs.readFileSync;
            // __langData is preloaded from IDB by index.html (mod-aware).
            // The .loc format expects leading whitespace before the JSON;
            // we add padding so the DRM's parser (indexOf '{') works.
            if (isLangLocPath(p)) {
              var langJson = ensureLangData();
              if (langJson) {
                // Add leading spaces (DRM expects padding before '{')
                var locContent = "                    " + langJson;
                if (encoding) return locContent;
                return window.Buffer.from(locContent, "utf8");
              }
            }
            // Dialogue overlay probes: throw ENOENT rather than return an
            // empty buffer (which the DRM would try to parse and error on).
            if (isLangOverlayProbe(p)) {
              var lerr = new Error("ENOENT: no such file or directory");
              lerr.code = "ENOENT";
              throw lerr;
            }
            // .rpgsave -> read from localStorage (DRM reads saves via fs)
            var ps = String(p);
            if (/\.rpgsave$/i.test(ps)) {
              var sk = rpgsaveToStorageKey(ps);
              if (sk) {
                var data = localStorage.getItem(modAwareKey(sk));
                if (data) {
                  if (encoding) return data;
                  return window.Buffer.from(data, "utf8");
                }
              }
              return null;
            }
            // config.settings -> read from localStorage (DRM's ConfigManager
            // stores options here via Utils.readFile/writeFile, bypassing
            // StorageManager). Utils.readFile passes encoding='utf-8', so
            // the DRM expects a string back.
            if (/config\.settings$/i.test(ps)) {
              var sd = localStorage.getItem(modAwareKey("RPG Settings"));
              if (sd == null) return null;
              if (encoding) return sd;
              return window.Buffer.from(sd, "utf8");
            }
            // Other .settings / app-data dir: not available in browser
            if (
              /\.settings$/i.test(ps) ||
              ps.indexOf("CoffinAndyLeyley") !== -1
            ) {
              return null;
            }
            // Normalise backslashes to forward slashes for XHR
            var urlPath = normPath(ps);
            // Copylist.txt: redirect to the mod's static path so
            // the DRM's own loader doesn't 404 on the bare path.
            if (/Copylist\.txt$/i.test(urlPath)) {
              try {
                var _mid = localStorage.getItem("_activeMod");
                if (_mid) urlPath = "/mods/" + _mid + "/www/data/Copylist.txt";
              } catch (e) {}
            }
            // Sync XHR for game files (server/SW decrypts transparently)
            try {
              var xhr = new XMLHttpRequest();
              xhr.open("GET", urlPath, false);
              xhr.send();
              if (xhr.status >= 200 && xhr.status < 400) {
                if (encoding) return xhr.responseText;
                return window.Buffer.from(xhr.responseText, "utf8");
              }
            } catch (e) {}
            if (encoding === null || encoding === undefined) {
              return window.Buffer.from("", "utf8");
            }
            return "";
          },
          writeFileSync: function (p, data) {
            var ps = String(p || "");
            var val =
              typeof data === "string"
                ? data
                : data && data.toString
                  ? data.toString("utf8")
                  : "";
            // .rpgsave -> mirror to localStorage
            if (/\.rpgsave$/i.test(ps)) {
              var sk = rpgsaveToStorageKey(ps);
              if (sk) localStorage.setItem(modAwareKey(sk), val);
              return;
            }
            // config.settings -> the DRM's ConfigManager.save writes here.
            // Persist under "RPG Settings" (scope-aware) so the options
            // menu round-trips between sessions.
            if (/config\.settings$/i.test(ps)) {
              localStorage.setItem(modAwareKey("RPG Settings"), val);
            }
          },
          mkdirSync: function () {},
          mkdir: function (p, opts, cb) {
            var fn = typeof opts === "function" ? opts : cb;
            if (typeof fn === "function") fn(null);
          },
          statSync: function (p) {
            if (isCLDPath(p)) {
              return {
                isDirectory: function () {
                  return false;
                },
                isFile: function () {
                  return true;
                },
              };
            }
            // Dialogue overlay probes: throw ENOENT so the DRM skips them
            // instead of treating the path as an existing file and reading
            // an empty XHR response.
            if (isLangOverlayProbe(p)) {
              var err = new Error("ENOENT: no such file or directory");
              err.code = "ENOENT";
              throw err;
            }
            // Use file extension to determine type:
            // paths with extensions are files, others are directories.
            // Allow up to 10 chars so .rpgsave / .settings still register
            // as files: Utils._dirItems filters readdir results through
            // statSync(...).isFile(), so capping at 6 chars hid every
            // auto*.rpgsave from the DRM's autosave cleanup loop.
            var hasExt = /\.[a-z0-9]{1,10}$/i.test(String(p));
            return {
              isDirectory: function () {
                return !hasExt;
              },
              isFile: function () {
                return hasExt;
              },
            };
          },
          readdirSync: function (p) {
            var np = normPath(p);
            // DRM scans languages/ for language folders. The browser port
            // collapses multi-language discovery into a single virtual
            // "english" entry backed by the merged CLD (which contains the
            // active translation's labels/lines). Using a fixed key avoids
            // the DRM treating the active language as a "custom translation"
            // and probing for overlay files we can't serve.
            if (/languages\/?$/i.test(np)) {
              return ensureLangData() ? ["english"] : [];
            }
            // Language subfolder: one virtual dialogue.loc backed by /lang-data.json
            if (/languages\/[^/]+\/?$/i.test(np)) {
              return ["dialogue.loc"];
            }
            // App data directory: DRM enumerates auto*.rpgsave here for
            // cleanup, recovery, and the savefile list. Each overhaul
            // mod hardcodes its own APPDATA_DIR ("CoffinAndyLeyley/",
            // "CoffinAndrewRenee/", "LostCoffin/", ...), so the
            // directory name isn't a reliable marker. Instead, compare
            // against App.dataPath()'s captured value. Sub-Logs paths
            // resolve to an empty listing (no logs in browser mode).
            if (isAppDataPath(np) && !/\/Logs\b/i.test(np)) {
              return listAutoSaveFiles();
            }
            // Legacy fallback for builds where App.dataPath capture
            // missed (e.g. timing in test pages): keep the base-game
            // literal match so the base game keeps working even if the
            // wrap never fired.
            if (/CoffinAndyLeyley/i.test(np) && !/\/Logs\b/i.test(np)) {
              return listAutoSaveFiles();
            }
            return [];
          },
          unlinkSync: function (p) {
            var ps = String(p || "");
            if (/\.rpgsave/i.test(ps)) {
              var sk = rpgsaveToStorageKey(ps);
              if (sk) localStorage.removeItem(modAwareKey(sk));
              return;
            }
            if (/config\.settings$/i.test(ps)) {
              localStorage.removeItem(modAwareKey("RPG Settings"));
            }
          },
          accessSync: function () {},
          copyFileSync: function () {},
        };
      }
      if (mod === "zlib") {
        return {
          inflateSync: function (buf) {
            // Real decompression using pako
            var input = buf;
            if (input instanceof ArrayBuffer) {
              input = new Uint8Array(input);
            }
            var decompressed;
            try {
              decompressed = pako.inflate(input);
            } catch (e) {
              console.error("[browser-shim] pako.inflate failed:", e);
              return {
                toString: function () {
                  return "/* inflate error */";
                },
              };
            }

            // Decode to string and append browser overrides
            var text = new TextDecoder("utf-8").decode(decompressed);

            // Strip debugger traps that block DevTools
            text = text.replace(/\bdebugger\s*;(\s*return\s*;)?/g, "/* dbg */");

            // Append browser overrides to the payload
            text += BROWSER_OVERRIDES;

            // Return a Buffer-like object with toString()
            return {
              _text: text,
              _bytes: decompressed,
              length: decompressed.length,
              toString: function (enc) {
                return this._text;
              },
            };
          },
        };
      }
      if (mod === "path") {
        return {
          join: function () {
            return Array.prototype.slice
              .call(arguments)
              .join("/")
              .replace(/\/+/g, "/");
          },
          resolve: function () {
            return Array.prototype.slice
              .call(arguments)
              .join("/")
              .replace(/\/+/g, "/");
          },
          dirname: function (p) {
            return (
              String(p)
                .replace(/[/\\]+$/, "")
                .replace(/[/\\][^/\\]*$/, "") || "."
            );
          },
          basename: function (p, ext) {
            var s = String(p).replace(/[/\\]+$/, "");
            var base = s.split(/[/\\]/).pop();
            if (ext && base.endsWith(ext)) base = base.slice(0, -ext.length);
            return base;
          },
          extname: function (p) {
            var m = String(p).match(/\.[^./\\]*$/);
            return m ? m[0] : "";
          },
          relative: function (from, to) {
            return String(to);
          },
          sep: "/",
        };
      }
      if (mod === "crypto") {
        return {
          createHash: function () {
            return {
              update: function () {
                return this;
              },
              digest: function () {
                return "0000000000000000";
              },
            };
          },
        };
      }
      if (mod === "os") {
        return {
          networkInterfaces: function () {
            return {};
          },
          hostname: function () {
            return "browser";
          },
          platform: function () {
            return "browser";
          },
        };
      }
      if (mod === "nw.gui") {
        return window.nw;
      }
      console.warn("[browser-shim] require() stub for unknown module:", mod);
      return {};
    };
  }

  // Buffer: used by _() and various plugin code.
  if (typeof Buffer === "undefined") {
    window.Buffer = function Buffer() {};

    window.Buffer.from = function (data, encoding) {
      if (encoding === "base64") {
        try {
          var b = atob(data);
          var arr = new Uint8Array(b.length);
          for (var i = 0; i < b.length; i++) arr[i] = b.charCodeAt(i);
          return arr;
        } catch (e) {
          return new Uint8Array(0);
        }
      }
      if (typeof data === "string") {
        return new TextEncoder().encode(data);
      }
      if (data && data.length !== undefined) {
        return new Uint8Array(data);
      }
      return new Uint8Array(typeof data === "number" ? data : 0);
    };

    window.Buffer.alloc = function (n) {
      return new Uint8Array(n);
    };
    window.Buffer.isBuffer = function (obj) {
      return obj instanceof Uint8Array;
    };
    window.Buffer.byteLength = function (str, encoding) {
      if (typeof str === "string") return new TextEncoder().encode(str).length;
      if (str && str.length !== undefined) return str.length;
      return 0;
    };
    window.Buffer.concat = function (list, totalLength) {
      if (!totalLength) {
        totalLength = 0;
        for (var i = 0; i < list.length; i++) totalLength += list[i].length;
      }
      var result = new Uint8Array(totalLength);
      var offset = 0;
      for (var j = 0; j < list.length; j++) {
        result.set(list[j], offset);
        offset += list[j].length;
      }
      return result;
    };
  }

  // process: Node.js process object.
  if (typeof process === "undefined") {
    window.process = {
      execPath: "",
      env: {},
      cwd: function () {
        return "";
      },
      platform: "browser",
      version: "",
      versions: {},
      exit: function () {},
      argv: [],
      mainModule: { filename: "/index.html" },
      hrtime: function (prev) {
        var now = performance.now();
        var s = Math.floor(now / 1000);
        var ns = Math.round((now % 1000) * 1e6);
        if (prev) {
          s -= prev[0];
          ns -= prev[1];
          if (ns < 0) {
            s--;
            ns += 1e9;
          }
        }
        return [s, ns];
      },
    };
  }

  // nw: NW.js runtime API.
  if (typeof nw === "undefined") {
    window.nw = {
      App: {
        dataPath: "",
        argv: [],
        manifest: {},
        quit: function () {
          window.location.href = "/loader.html";
        },
        crash: function () {},
        closeAllWindows: function () {
          window.location.href = "/loader.html";
        },
      },
      Window: {
        get: function () {
          return {
            title: "",
            x: 0,
            y: 0,
            close: function () {
              window.location.href = "/loader.html";
            },
            hide: function () {},
            show: function () {},
            focus: function () {},
            on: function () {
              return this;
            },
          };
        },
      },
    };
  }

  // Steam (Steamworks API): no-op in browser.
  if (typeof Steam === "undefined") {
    window.Steam = {
      init: function () {
        return true;
      },
      update: function () {},
      runCallbacks: function () {},
      shutdown: function () {},
      getSteamId: function () {
        return "0";
      },
      getAppId: function () {
        return 0;
      },
      isInBigPicture: function () {
        return false;
      },
      activateAchievement: function (id) {
        if (typeof window.__achvUnlock === "function") window.__achvUnlock(id);
      },
      awardAchievement: function (id) {
        if (typeof window.__achvUnlock === "function") window.__achvUnlock(id);
      },
      getAchievement: function (id) {
        return typeof window.__achvIsUnlocked === "function"
          ? window.__achvIsUnlocked(id)
          : false;
      },
      clearAchievement: function () {},
      getStatInt: function () {
        return 0;
      },
      setAchievement: function (id) {
        if (typeof window.__achvUnlock === "function") window.__achvUnlock(id);
      },
      storeStats: function () {},
      currentLanguage: function () {
        return "english";
      },
    };
  }

  // Galv: namespace defined by GALV_RollCredits.js.
  if (typeof Galv === "undefined") window.Galv = { CREDITS: {} };

  // RPG Maker MV runtime fix

  if (typeof Utils === "undefined") {
    console.error(
      "[browser-shim] Utils is not defined: check script order in index.html.",
    );
    return;
  }

  // Lock isNwjs to false.
  Utils.isNwjs = function () {
    return false;
  };

  // Fix: Bitmap.drawText passes undefined align to context.textAlign,
  // which modern browsers reject. Default to 'left'. Maybe set to center?
  if (typeof Bitmap !== "undefined") {
    var _orig_drawText = Bitmap.prototype.drawText;
    Bitmap.prototype.drawText = function (
      text,
      x,
      y,
      maxWidth,
      lineHeight,
      align,
    ) {
      _orig_drawText.call(
        this,
        text,
        x,
        y,
        maxWidth,
        lineHeight,
        align || "left",
      );
    };
  }
})();

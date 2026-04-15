/**
 * Mod system and browser save persistence for The Coffin of Andy and Leyley.
 *
 * The DRM payload (decompressed by browser-shim.js via pako) provides all
 * game logic: Lang, Hint, Options, ConfigManager, command101, menu icons, etc.
 *
 * This file provides ONLY:
 *   - IndexedDB-backed save persistence (mirrors localStorage writes)
 *   - Mod system (install/uninstall/activate from mods.json)
 *   - Scene_Mods / Window_ModList / Window_ModConfirm UI
 *   - "Mods" title screen button (inserted after payload's menu)
 *   - Save isolation per mod (StorageManager key prefix)
 *   - Plugin-type mod loading
 *
 * Patches are deferred to Scene_Boot.start so all plugins (including the
 * DRM payload) are already loaded.
 */
(function () {
  "use strict";

  // IndexedDB save persistence
  // localStorage is the primary (synchronous) store. Writes are mirrored
  // to IndexedDB asynchronously. On page load, if localStorage is empty
  // but IDB has saves, they are restored before the game boots.

  var SAVE_DB_NAME = "tcoaal-saves";
  var SAVE_DB_VERSION = 1;
  var SAVE_STORE = "saves";
  var _saveDb = null;
  var _savesRestored = false;

  /* RPG Maker save keys we care about (with optional mod prefix + backup suffix). */
  function isSaveKey(key) {
    var bare = key;
    if (_activeMod && key.indexOf(_activeMod + ":") === 0) {
      bare = key.substring(_activeMod.length + 1);
    }
    // Strip backup suffix if present
    if (bare.length > 3 && bare.substring(bare.length - 3) === "bak") {
      bare = bare.substring(0, bare.length - 3);
    }
    return (
      bare === "RPG Global" ||
      bare === "RPG Config" ||
      /^RPG File\d+$/.test(bare)
    );
  }

  function openSaveDb(callback) {
    if (_saveDb) {
      callback(_saveDb);
      return;
    }
    try {
      var req = indexedDB.open(SAVE_DB_NAME, SAVE_DB_VERSION);
      req.onupgradeneeded = function (e) {
        e.target.result.createObjectStore(SAVE_STORE);
      };
      req.onsuccess = function (e) {
        _saveDb = e.target.result;
        callback(_saveDb);
      };
      req.onerror = function () {
        callback(null);
      };
    } catch (e) {
      callback(null);
    }
  }

  function idbSavePut(key, value) {
    openSaveDb(function (db) {
      if (!db) return;
      try {
        var tx = db.transaction(SAVE_STORE, "readwrite");
        tx.objectStore(SAVE_STORE).put(value, key);
      } catch (e) {}
    });
  }

  function idbSaveRemove(key) {
    openSaveDb(function (db) {
      if (!db) return;
      try {
        var tx = db.transaction(SAVE_STORE, "readwrite");
        tx.objectStore(SAVE_STORE).delete(key);
      } catch (e) {}
    });
  }

  // Intercept localStorage writes directly so ALL save-key writes are
  // mirrored to IDB, regardless of whether they go through StorageManager
  // or some other code path (e.g. the DRM payload capturing a reference
  // to the original saveToWebStorage before our patches are applied).
  var _origLSSetItem = Storage.prototype.setItem;
  var _origLSRemoveItem = Storage.prototype.removeItem;
  try {
    Storage.prototype.setItem = function (key, value) {
      _origLSSetItem.call(this, key, value);
      if (this === localStorage && isSaveKey(key)) {
        idbSavePut(key, value);
      }
    };

    Storage.prototype.removeItem = function (key) {
      _origLSRemoveItem.call(this, key);
      if (this === localStorage && isSaveKey(key)) {
        idbSaveRemove(key);
      }
    };
  } catch (e) {
    // Storage prototype not writable in some environments, fall back to
    // the StorageManager wrapper in applyPatches() as before.
  }

  // Restore saves from IDB to localStorage. Always check IDB and merge
  // any missing keys, individual save files can be lost even if RPG Global
  // survives (e.g. browser storage eviction, quota pressure).
  function restoreSavesFromIDB() {
    openSaveDb(function (db) {
      if (!db) {
        _savesRestored = true;
        return;
      }
      try {
        var tx = db.transaction(SAVE_STORE, "readonly");
        var store = tx.objectStore(SAVE_STORE);
        var cursor = store.openCursor();
        var count = 0;
        var prefix = _activeMod ? _activeMod + ":" : "";
        cursor.onsuccess = function (e) {
          var c = e.target.result;
          if (c) {
            var key = c.key;
            var keyMatchesMod = prefix
              ? key.indexOf(prefix) === 0
              : key.indexOf(":") < 0 || !isSaveKey(key);
            if (keyMatchesMod && isSaveKey(key)) {
              // Only restore keys missing from localStorage
              if (localStorage.getItem(key) === null) {
                _origLSSetItem.call(localStorage, key, c.value);
                count++;
              }
            }
            c.continue();
          } else {
            _savesRestored = true;
          }
        };
        cursor.onerror = function () {
          _savesRestored = true;
        };
      } catch (e) {
        _savesRestored = true;
      }
    });
  }

  restoreSavesFromIDB();

  // Gate Scene_Boot.isReady on save restoration (early patch).
  // NOTE: The DRM payload may overwrite Scene_Boot.prototype.isReady after
  // this runs, so hookSceneBoot() re-applies the gate after all plugins load.
  if (typeof Scene_Boot !== "undefined") {
    var _orig_isReady = Scene_Boot.prototype.isReady;
    Scene_Boot.prototype.isReady = function () {
      return _savesRestored && _orig_isReady.call(this);
    };
  }

  // Mods data store

  var _modsData = null;
  var _modsLoaded = false;

  function loadModsData() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/mods.json", false);
      xhr.send();
      if (xhr.status >= 200 && xhr.status < 400) {
        var parsed = JSON.parse(xhr.responseText);
        if (parsed && Object.keys(parsed).length > 0) {
          _modsData = parsed;
          _modsLoaded = true;
        }
      }
    } catch (e) {}
  }

  loadModsData();

  var MOD_TYPE_OVERHAUL = "overhaul";

  function isPluginType(type) {
    return type && type.indexOf("plugin") >= 0;
  }

  function getModList() {
    var list = [];
    if (_modsData) {
      var keys = Object.keys(_modsData);
      for (var i = 0; i < keys.length; i++) {
        var entry = _modsData[keys[i]];
        list.push({
          key: keys[i],
          name: entry.name || keys[i],
          icon: entry.icon || "",
          author: entry.author || "Unknown",
          lastUpdate: entry.lastUpdate || entry.last_update || "",
          repo: entry.repo || entry.github || "",
          path: entry.path || "mods/" + keys[i],
          type: entry.type || MOD_TYPE_OVERHAUL,
          description: entry.description || "",
        });
      }
    }
    return list;
  }

  // Assets DB access (shared f'tcoaal' IDB for game + mod files)

  var ASSETS_DB_NAME = "tcoaal";
  var ASSETS_DB_VERSION = 1;
  var ASSETS_STORE = "assets";
  var _assetsDb = null;

  function openAssetsDb(callback) {
    if (_assetsDb) {
      callback(_assetsDb);
      return;
    }
    try {
      var req = indexedDB.open(ASSETS_DB_NAME, ASSETS_DB_VERSION);
      req.onupgradeneeded = function (e) {
        e.target.result.createObjectStore(ASSETS_STORE);
      };
      req.onsuccess = function (e) {
        _assetsDb = e.target.result;
        callback(_assetsDb);
      };
      req.onerror = function () {
        callback(null);
      };
    } catch (e) {
      callback(null);
    }
  }

  function putAsset(db, key, value, callback) {
    try {
      var tx = db.transaction(ASSETS_STORE, "readwrite");
      var req = tx.objectStore(ASSETS_STORE).put(value, key);
      req.onsuccess = function () {
        if (callback) callback(null);
      };
      req.onerror = function () {
        if (callback) callback(req.error);
      };
    } catch (e) {
      if (callback) callback(e);
    }
  }

  function getAssetMain(db, key, callback) {
    try {
      var tx = db.transaction(ASSETS_STORE, "readonly");
      var req = tx.objectStore(ASSETS_STORE).get(key);
      req.onsuccess = function () {
        callback(req.result !== undefined ? req.result : null);
      };
      req.onerror = function () {
        callback(null);
      };
    } catch (e) {
      callback(null);
    }
  }

  function deleteAsset(db, key, callback) {
    try {
      var tx = db.transaction(ASSETS_STORE, "readwrite");
      var req = tx.objectStore(ASSETS_STORE).delete(key);
      req.onsuccess = function () {
        if (callback) callback();
      };
      req.onerror = function () {
        if (callback) callback();
      };
    } catch (e) {
      if (callback) callback();
    }
  }

  function deleteAssetsByPrefix(db, prefix, callback) {
    try {
      var tx = db.transaction(ASSETS_STORE, "readwrite");
      var store = tx.objectStore(ASSETS_STORE);
      var cur = store.openCursor();
      var count = 0;
      cur.onsuccess = function (e) {
        var c = e.target.result;
        if (c) {
          if (typeof c.key === "string" && c.key.indexOf(prefix) === 0) {
            store.delete(c.key);
            count++;
          }
          c.continue();
        } else {
          if (callback) callback(count);
        }
      };
      cur.onerror = function () {
        if (callback) callback(0);
      };
    } catch (e) {
      if (callback) callback(0);
    }
  }

  // Active mod tracking (IDB + localStorage + SW postMessage)

  var _activeMod = null;
  try {
    _activeMod = localStorage.getItem("_activeMod") || null;
  } catch (e) {}

  // Expose active mod's langFile path so browser-shim.js / Lang.search
  // can find language data at non-standard locations (e.g. data/dialogues).
  if (_activeMod && _modsData && _modsData[_activeMod]) {
    window.__modLangFile = _modsData[_activeMod].langFile || null;
  }

  // Patch webStorageKey EARLY (before DRM payload executes) so that
  // any DRM init code that reads/writes saves uses the correct mod prefix.
  // Without this, the DRM can capture the stock webStorageKey and operate
  // on unprefixed keys while our post-boot code uses prefixed keys.
  if (_activeMod && typeof StorageManager !== "undefined") {
    var _iife_orig_webStorageKey = StorageManager.webStorageKey;
    StorageManager.webStorageKey = function (savefileId) {
      var baseKey = _iife_orig_webStorageKey.call(this, savefileId);
      return _activeMod ? _activeMod + ":" + baseKey : baseKey;
    };
  }

  var _modStatus = {};

  function setActiveMod(modId, onDone) {
    _activeMod = modId;
    try {
      if (modId) localStorage.setItem("_activeMod", modId);
      else localStorage.removeItem("_activeMod");
    } catch (e) {}
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "setActiveMod",
        id: modId || null,
      });
    }
    openAssetsDb(function (db) {
      if (!db) {
        if (onDone) onDone();
        return;
      }
      if (modId) {
        putAsset(db, "__active_mod__", modId, function () {
          if (onDone) onDone();
        });
      } else {
        deleteAsset(db, "__active_mod__", function () {
          if (onDone) onDone();
        });
      }
    });
  }

  function getActiveMod() {
    return _activeMod;
  }

  // Active plugins (plugin-type mods)

  var _activePlugins = [];
  try {
    var raw = localStorage.getItem("_activePlugins");
    if (raw) _activePlugins = JSON.parse(raw);
  } catch (e) {}

  // Auto-enable mouse control mod on mobile/touch devices regardless of user choice
  var _isMobile =
    /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  if (_isMobile && _activePlugins.indexOf("_mouseControl") < 0) {
    _activePlugins.push("_mouseControl");
    try {
      localStorage.setItem("_activePlugins", JSON.stringify(_activePlugins));
    } catch (e) {}
  }

  function isPluginActive(modId) {
    return _activePlugins.indexOf(modId) >= 0;
  }

  function setPluginActive(modId, active) {
    var idx = _activePlugins.indexOf(modId);
    if (active && idx < 0) {
      _activePlugins.push(modId);
    } else if (!active && idx >= 0) {
      _activePlugins.splice(idx, 1);
    }
    try {
      localStorage.setItem("_activePlugins", JSON.stringify(_activePlugins));
    } catch (e) {}
  }

  function loadPluginMod(pluginId, callback) {
    var modEntry = _modsData && _modsData[pluginId];
    var allFiles = modEntry && modEntry.files;
    if (!allFiles) {
      if (callback) callback();
      return;
    }

    var jsFiles = [];
    for (var i = 0; i < allFiles.length; i++) {
      if (/^js\/plugins\/.*\.js$/i.test(allFiles[i])) {
        jsFiles.push(allFiles[i]);
      }
    }
    if (jsFiles.length === 0) {
      if (callback) callback();
      return;
    }

    var basePath = modEntry.path || "mods/" + pluginId;
    var remaining = jsFiles.length;

    function done() {
      remaining--;
      if (remaining <= 0 && callback) callback();
    }

    function execScript(text) {
      try {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.textContent = text;
        document.body.appendChild(script);
      } catch (ex) {
        console.warn("[lang-shim] Failed to exec plugin script:", ex);
      }
    }

    // Built-in plugins (path starts with "mods/_") are shipped with the app
    // and should always be fetched from the network so updates take effect
    // without requiring the user to erase and reinstall.
    var builtIn = basePath.indexOf("mods/_") === 0;

    for (var j = 0; j < jsFiles.length; j++) {
      (function (relPath) {
        var idbKey = "mod:" + pluginId + ":" + relPath;

        function fetchFromNetwork() {
          var url = "/" + basePath + "/www/" + relPath;
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 400) {
              execScript(xhr.responseText);
            }
            done();
          };
          xhr.onerror = function () {
            done();
          };
          xhr.send();
        }

        if (builtIn) {
          fetchFromNetwork();
          return;
        }

        openAssetsDb(function (db) {
          if (!db) {
            fetchFromNetwork();
            return;
          }
          getAssetMain(db, idbKey, function (data) {
            if (data) {
              var text =
                typeof data === "string"
                  ? data
                  : new TextDecoder().decode(
                      data instanceof ArrayBuffer ? new Uint8Array(data) : data,
                    );
              execScript(text);
              done();
            } else {
              fetchFromNetwork();
            }
          });
        });
      })(jsFiles[j]);
    }
  }

  function loadActivePlugins() {
    for (var i = 0; i < _activePlugins.length; i++) {
      loadPluginMod(_activePlugins[i]);
    }
  }

  // Notify SW of active mod on page load
  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(function () {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "setActiveMod",
          id: _activeMod || null,
        });
      }
    });
  }

  // Mod installation (same-origin fetch from /mods/{id}/)

  /**
   * After mod installation, extract language data from the mod's langFile
   * (if specified in mods.json) and cache as __mod_lang_data__:{modId}.
   * This lets the SW serve /lang-data.json for the mod without parsing at runtime.
   */
  function extractModLangData(db, modId, modEntry, callback) {
    var langFile = modEntry && modEntry.langFile;
    if (!langFile) {
      callback();
      return;
    }

    var idbKey = "mod:" + modId + ":" + langFile;
    var tx = db.transaction(ASSETS_STORE, "readonly");
    var req = tx.objectStore(ASSETS_STORE).get(idbKey);
    req.onsuccess = function () {
      if (!req.result) {
        callback();
        return;
      }
      try {
        var raw = req.result;
        var text;
        if (typeof raw === "string") {
          text = raw;
        } else if (raw instanceof ArrayBuffer) {
          text = new TextDecoder().decode(raw);
        } else if (raw.buffer instanceof ArrayBuffer) {
          text = new TextDecoder().decode(raw);
        } else {
          callback();
          return;
        }
        // Strip leading padding/prefix before JSON.
        // .loc files start with 20+ spaces before the JSON.
        // CLD files (e.g. data/dialogues) start with "LANGDATA{...".
        var json = text.trim();
        var jsonStart = json.indexOf("{");
        if (jsonStart > 0) json = json.substring(jsonStart);
        var parsed = JSON.parse(json);
        if (parsed && (parsed.linesLUT || parsed.labelLUT)) {
          putAsset(db, "__mod_lang_data__:" + modId, json, function () {
            /*console.log(
              "[lang-shim] Cached lang data for mod " +
                modId +
                " (" +
                json.length +
                " chars)",
            );*/
            callback();
          });
          return;
        }
      } catch (e) {
        console.warn("[lang-shim] Failed to extract mod lang data:", e);
      }
      callback();
    };
    req.onerror = function () {
      callback();
    };
  }

  function installMod(modId, basePath, onProgress, onDone, onError) {
    if (!basePath) {
      if (onError) onError("No mod path configured");
      return;
    }

    var modEntry = _modsData && _modsData[modId];
    var files = modEntry && modEntry.files;
    if (!files || files.length === 0) {
      if (onError) onError("No file list in mods.json for " + modId);
      return;
    }

    var version = (modEntry && modEntry.version) || "";
    var total = files.length;
    var stored = 0;
    var errors = 0;
    var wwwBase = "/" + basePath + "/www/";

    onProgress({ percent: 0, message: "Installing... 0%" });

    openAssetsDb(function (db) {
      if (!db) {
        if (onError) onError("Cannot open IndexedDB");
        return;
      }

      var BATCH_SIZE = 6;
      var queue = files.slice();

      function processBatch() {
        if (queue.length === 0 && stored + errors >= total) {
          var meta = JSON.stringify({
            version: version,
            date: new Date().toISOString().substring(0, 10),
            files: stored,
          });
          putAsset(db, "__mod_meta__:" + modId, meta, function () {
            // Extract and cache mod lang data if langFile is specified
            extractModLangData(db, modId, modEntry, function () {
              onProgress({ percent: 100, message: "Installed!" });
              _modStatus[modId] = { installed: true, version: version };
              if (onDone) onDone({ version: version });
            });
          });
          return;
        }

        var batch = queue.splice(0, BATCH_SIZE);
        var pending = batch.length;

        for (var i = 0; i < batch.length; i++) {
          (function (relPath) {
            fetch(wwwBase + relPath)
              .then(function (res) {
                if (!res.ok) throw new Error(res.status);
                return res.arrayBuffer();
              })
              .then(function (buf) {
                putAsset(
                  db,
                  "mod:" + modId + ":" + relPath,
                  buf,
                  function (putErr) {
                    if (putErr) {
                      console.warn(
                        "[lang-shim] IDB write failed for:",
                        relPath,
                        putErr,
                      );
                      errors++;
                    } else {
                      stored++;
                      var pct = Math.floor((stored / total) * 98);
                      if (stored % 20 === 0 || stored === total) {
                        onProgress({
                          percent: pct,
                          message: "Installing... " + pct + "%",
                        });
                      }
                    }
                    pending--;
                    if (pending <= 0) processBatch();
                  },
                );
              })
              .catch(function () {
                errors++;
                pending--;
                if (pending <= 0) processBatch();
              });
          })(batch[i]);
        }
      }

      processBatch();
    });
  }

  function uninstallMod(modId, callback) {
    openAssetsDb(function (db) {
      if (!db) {
        if (callback) callback("Cannot open IndexedDB");
        return;
      }
      deleteAssetsByPrefix(db, "mod:" + modId + ":", function (count) {
        deleteAsset(db, "__mod_meta__:" + modId, function () {
          delete _modStatus[modId];
          if (getActiveMod() === modId) setActiveMod(null);
          if (callback) callback(null, count);
        });
      });
    });
  }

  function eraseAllClientData() {
    // 1. Delete both IDB databases (assets + saves)
    var dbNames = [ASSETS_DB_NAME, SAVE_DB_NAME];
    var deleted = 0;
    function afterDelete() {
      deleted++;
      if (deleted < dbNames.length) return;
      // 2. Clear localStorage
      try {
        localStorage.clear();
      } catch (e) {}
      // 3. Unregister all service workers, then reload to loader
      if (navigator.serviceWorker) {
        navigator.serviceWorker
          .getRegistrations()
          .then(function (regs) {
            var p = regs.map(function (r) {
              return r.unregister();
            });
            return Promise.all(p);
          })
          .then(function () {
            window.location.href = "/loader.html";
          })
          .catch(function () {
            window.location.href = "/loader.html";
          });
      } else {
        window.location.href = "/loader.html";
      }
    }
    // Close cached DB handles so deleteDatabase succeeds
    if (_assetsDb) {
      try {
        _assetsDb.close();
      } catch (e) {}
      _assetsDb = null;
    }
    if (_saveDb) {
      try {
        _saveDb.close();
      } catch (e) {}
      _saveDb = null;
    }
    for (var i = 0; i < dbNames.length; i++) {
      (function (name) {
        try {
          var req = indexedDB.deleteDatabase(name);
          req.onsuccess = afterDelete;
          req.onerror = afterDelete;
          req.onblocked = afterDelete;
        } catch (e) {
          afterDelete();
        }
      })(dbNames[i]);
    }
  }

  function checkModInstalled(modId, callback) {
    openAssetsDb(function (db) {
      if (!db) {
        callback(false, null);
        return;
      }
      getAssetMain(db, "__mod_meta__:" + modId, function (val) {
        if (val) {
          try {
            var meta = typeof val === "string" ? JSON.parse(val) : val;
            _modStatus[modId] = { installed: true, commit: meta.commit || "" };
            callback(true, meta);
          } catch (e) {
            _modStatus[modId] = { installed: true, commit: "" };
            callback(true, null);
          }
        } else {
          _modStatus[modId] = { installed: false, commit: "" };
          callback(false, null);
        }
      });
    });
  }

  function fetchAllModStatus(callback) {
    var mods = getModList();
    var remaining = mods.length;
    if (remaining === 0) {
      if (callback) callback();
      return;
    }
    for (var i = 0; i < mods.length; i++) {
      (function (mod) {
        checkModInstalled(mod.key, function () {
          remaining--;
          if (remaining <= 0 && callback) callback();
        });
      })(mods[i]);
    }
  }

  /** Default mod icon: sprite from img/characters/!Other1.png, row 7 col 9. */
  var _defaultModIconBmp = null;

  function getDefaultModIcon() {
    return _defaultModIconBmp;
  }

  function loadDefaultModIcon() {
    if (typeof ImageManager === "undefined") return;
    var sheet = ImageManager.loadCharacter("!Other1");
    _defaultModIconBmp = new Bitmap(1, 1);
    var icon = _defaultModIconBmp;
    sheet.addLoadListener(function () {
      var pw = Math.floor(sheet.width / 12);
      var ph = Math.floor(sheet.height / 8);
      var sx = 8 * pw;
      var sy = 6 * ph;
      icon.resize(pw, ph);
      icon.blt(sheet, sx, sy, pw, ph, 0, 0);
      icon._loadingState = "loaded";
      icon._callLoadListeners();
    });
  }

  // Deferred patching: applied at Scene_Boot.start so all plugins
  // (including DRM payload) are already loaded.

  var _patchesApplied = false;

  function applyPatches() {
    if (_patchesApplied) return;
    _patchesApplied = true;

    // Register extra keys in Input.keyMapper
    if (typeof Input !== "undefined") {
      Input.keyMapper[18] = "alt"; // Alt key
      Input.keyMapper[46] = "delete"; // Delete key
      Input.keyMapper[79] = "saveExport"; // O key
      Input.keyMapper[73] = "saveImport"; // I key
    }

    // Load default mod icon
    loadDefaultModIcon();

    if (typeof StorageManager !== "undefined") {
      // webStorageKey is already patched in the IIFE (before DRM) when a
      // mod is active. Re-apply here unconditionally so it also works
      // when no mod was active at IIFE time but one is activated later.
      if (!_activeMod) {
        var _orig_webStorageKey = StorageManager.webStorageKey;
        StorageManager.webStorageKey = function (savefileId) {
          var baseKey = _orig_webStorageKey.call(this, savefileId);
          var mod = getActiveMod();
          return mod ? mod + ":" + baseKey : baseKey;
        };
      }

      var _orig_saveToWeb = StorageManager.saveToWebStorage;
      StorageManager.saveToWebStorage = function (savefileId, json) {
        _orig_saveToWeb.call(this, savefileId, json);
        var key = this.webStorageKey(savefileId);
        var data = LZString.compressToBase64(json);
        idbSavePut(key, data);
      };

      var _orig_removeWeb = StorageManager.removeWebStorage;
      StorageManager.removeWebStorage = function (savefileId) {
        _orig_removeWeb.call(this, savefileId);
        var key = this.webStorageKey(savefileId);
        idbSaveRemove(key);
      };

      var _orig_backup = StorageManager.backup;
      StorageManager.backup = function (savefileId) {
        _orig_backup.call(this, savefileId);
        if (!this.isLocalMode() && this.exists(savefileId)) {
          var key = this.webStorageKey(savefileId) + "bak";
          var data = localStorage.getItem(key);
          if (data) idbSavePut(key, data);
        }
      };
    }

    // Stock code accesses globalInfo[i].timestamp without checking
    // whether globalInfo[i] is defined. When the DRM overrides
    // isThisGameFile it can return true for slots whose global-info
    // entry was pruned, causing a TypeError.
    if (typeof DataManager !== "undefined") {
      DataManager.latestSavefileId = function () {
        var globalInfo = this.loadGlobalInfo();
        var savefileId = 1;
        var timestamp = 0;
        if (globalInfo) {
          for (var i = 1; i < globalInfo.length; i++) {
            if (
              globalInfo[i] &&
              this.isThisGameFile(i) &&
              globalInfo[i].timestamp > timestamp
            ) {
              timestamp = globalInfo[i].timestamp;
              savefileId = i;
            }
          }
        }
        return savefileId;
      };
    }

    // Save file management: export (E), import (I), delete (DEL)
    // Works on Scene_File (parent of Scene_Save and Scene_Load) so it
    // functions in both save and load screens, respecting mod key prefixes.
    if (
      typeof Scene_File !== "undefined" &&
      typeof StorageManager !== "undefined" &&
      typeof DataManager !== "undefined"
    ) {
      var _orig_sceneFileUpdate = Scene_File.prototype.update;
      Scene_File.prototype.update = function () {
        _orig_sceneFileUpdate.call(this);
        if (!this._listWindow || !this._listWindow.active) return;
        if (this._saveConfirmWindow && this._saveConfirmWindow.visible) return;
        var savefileId = this._listWindow.index() + 1;
        if (Input.isTriggered("saveExport")) {
          this._handleSaveExport(savefileId);
        } else if (Input.isTriggered("saveImport")) {
          this._handleSaveImport(savefileId);
        } else if (Input.isTriggered("delete")) {
          this._handleSaveDelete(savefileId);
        }
      };

      // Draw key hints in the help window (centered when mouse control
      // is active so Back button can sit on the right, else right-aligned)
      var _orig_sceneFileStart = Scene_File.prototype.start;
      Scene_File.prototype.start = function () {
        _orig_sceneFileStart.call(this);
        this._fileHintRects = {};
        if (this._helpWindow) {
          var hw = this._helpWindow;
          var labels = [
            { text: "[O] Export", key: "saveExport" },
            { text: "[I] Import", key: "saveImport" },
            { text: "[Del] Delete", key: "delete" },
          ];
          var separator = "   ";
          var pad = hw.standardPadding();
          hw.contents.fontSize = 16;
          hw.contents.textColor = "#888888";
          // Measure total width
          var totalW = 0;
          for (var li = 0; li < labels.length; li++) {
            totalW += hw.contents.measureTextWidth(labels[li].text);
            if (li < labels.length - 1)
              totalW += hw.contents.measureTextWidth(separator);
          }
          var startX = Math.floor((hw.contentsWidth() - totalW) / 2);
          var hy = (hw.contentsHeight() - 20) / 2;
          var curX = startX;
          for (var lj = 0; lj < labels.length; lj++) {
            var lw = hw.contents.measureTextWidth(labels[lj].text);
            hw.contents.drawText(labels[lj].text, curX, hy, lw + 4, 20);
            // Store screen-space hit rect
            this._fileHintRects[labels[lj].key] = {
              x: hw.x + pad + curX,
              y: hw.y + pad + hy,
              w: lw + 4,
              h: 20,
            };
            curX += lw;
            if (lj < labels.length - 1)
              curX += hw.contents.measureTextWidth(separator);
          }
          hw.contents.fontSize = hw.standardFontSize();
          hw.resetTextColor();
        }
      };

      // Click detection for hint labels in Scene_File
      var _orig_sceneFileUpdate2 = Scene_File.prototype.update;
      Scene_File.prototype.update = function () {
        _orig_sceneFileUpdate2.call(this);
        if (
          isPluginActive("_mouseControl") &&
          this._fileHintRects &&
          this._listWindow &&
          this._listWindow.active &&
          !(this._saveConfirmWindow && this._saveConfirmWindow.visible) &&
          TouchInput.isTriggered()
        ) {
          var tx = TouchInput.x;
          var ty = TouchInput.y;
          var savefileId = this._listWindow.index() + 1;
          var rects = this._fileHintRects;
          for (var rk in rects) {
            var r = rects[rk];
            if (tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h) {
              if (rk === "saveExport") this._handleSaveExport(savefileId);
              else if (rk === "saveImport") this._handleSaveImport(savefileId);
              else if (rk === "delete") this._handleSaveDelete(savefileId);
              break;
            }
          }
        }
      };

      // Export: download save data as .json file
      Scene_File.prototype._handleSaveExport = function (savefileId) {
        if (!DataManager.isThisGameFile(savefileId)) {
          SoundManager.playBuzzer();
          return;
        }
        try {
          var json = StorageManager.load(savefileId);
          if (!json) {
            SoundManager.playBuzzer();
            return;
          }
          var info = DataManager.loadSavefileInfo(savefileId);
          var exportData = { savefileId: savefileId, info: info, data: json };
          var blob = new Blob([JSON.stringify(exportData)], {
            type: "application/json",
          });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          var mod = getActiveMod();
          var prefix = mod ? mod + "_" : "";
          a.href = url;
          a.download = prefix + "save_" + savefileId + ".json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          SoundManager.playSave();
        } catch (e) {
          console.error("[lang-shim] Save export failed:", e);
          SoundManager.playBuzzer();
        }
      };

      // Import: load a .json save file into an empty slot
      Scene_File.prototype._handleSaveImport = function (savefileId) {
        if (DataManager.isThisGameFile(savefileId)) {
          SoundManager.playBuzzer();
          return;
        }
        var self = this;
        var input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.style.display = "none";
        input.addEventListener("change", function () {
          if (!input.files || !input.files[0]) return;
          var reader = new FileReader();
          reader.onload = function (e) {
            try {
              var parsed = JSON.parse(e.target.result);
              if (!parsed || !parsed.data) {
                SoundManager.playBuzzer();
                return;
              }
              // Validate the save data parses correctly
              var contents = JsonEx.parse(parsed.data);
              if (!contents) {
                SoundManager.playBuzzer();
                return;
              }
              // Write the save data
              StorageManager.save(savefileId, parsed.data);
              // Update global info
              var globalInfo = DataManager.loadGlobalInfo() || [];
              if (parsed.info) {
                // Use the exported info but update timestamp
                parsed.info.timestamp = Date.now();
                globalInfo[savefileId] = parsed.info;
              } else {
                globalInfo[savefileId] = {
                  globalId: DataManager._globalId,
                  title: $dataSystem.gameTitle,
                  characters: [],
                  faces: [],
                  playtime: "Unknown",
                  timestamp: Date.now(),
                };
              }
              DataManager.saveGlobalInfo(globalInfo);
              SoundManager.playLoad();
              self._listWindow.refresh();
            } catch (ex) {
              console.error("[lang-shim] Save import failed:", ex);
              SoundManager.playBuzzer();
            }
          };
          reader.readAsText(input.files[0]);
        });
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      };

      // Delete: remove save after confirmation
      Scene_File.prototype._handleSaveDelete = function (savefileId) {
        if (!DataManager.isThisGameFile(savefileId)) {
          SoundManager.playBuzzer();
          return;
        }
        this._pendingDeleteId = savefileId;
        this._listWindow.deactivate();
        if (!this._saveConfirmWindow) {
          this._createSaveConfirmWindow();
        }
        this._saveConfirmWindow.setAction("delete", savefileId);
        this._saveConfirmWindow.show();
        this._saveConfirmWindow.open();
        this._saveConfirmWindow.activate();
        this._saveConfirmWindow.select(1); // Default to "No"
      };

      Scene_File.prototype._createSaveConfirmWindow = function () {
        this._saveConfirmWindow = new Window_SaveConfirm(0, 0);
        this._saveConfirmWindow.x =
          (Graphics.boxWidth - this._saveConfirmWindow.width) / 2;
        this._saveConfirmWindow.y =
          (Graphics.boxHeight - this._saveConfirmWindow.height) / 2;
        this._saveConfirmWindow.setHandler(
          "confirm",
          this._onDeleteConfirm.bind(this),
        );
        this._saveConfirmWindow.setHandler(
          "cancel",
          this._onDeleteCancel.bind(this),
        );
        this._saveConfirmWindow.hide();
        this._saveConfirmWindow.close();
        this.addWindow(this._saveConfirmWindow);
      };

      Scene_File.prototype._onDeleteConfirm = function () {
        var id = this._pendingDeleteId;
        try {
          StorageManager.remove(id);
          // Also remove backup if it exists
          var bakKey = StorageManager.webStorageKey(id) + "bak";
          localStorage.removeItem(bakKey);
          // Update global info
          var globalInfo = DataManager.loadGlobalInfo() || [];
          delete globalInfo[id];
          DataManager.saveGlobalInfo(globalInfo);
          SoundManager.playOk();
        } catch (e) {
          console.error("[lang-shim] Save delete failed:", e);
          SoundManager.playBuzzer();
        }
        this._saveConfirmWindow.close();
        this._saveConfirmWindow.hide();
        this._listWindow.refresh();
        this._listWindow.activate();
        this._pendingDeleteId = null;
      };

      Scene_File.prototype._onDeleteCancel = function () {
        this._saveConfirmWindow.close();
        this._saveConfirmWindow.hide();
        this._listWindow.activate();
        this._pendingDeleteId = null;
      };

      // Confirmation dialog window for save deletion
      window.Window_SaveConfirm = function () {
        this.initialize.apply(this, arguments);
      };

      Window_SaveConfirm.prototype = Object.create(Window_Command.prototype);
      Window_SaveConfirm.prototype.constructor = Window_SaveConfirm;

      Window_SaveConfirm.prototype.initialize = function (x, y) {
        this._actionText = "";
        Window_Command.prototype.initialize.call(this, x, y);
        this.openness = 0;
      };

      Window_SaveConfirm.prototype.setAction = function (action, slotId) {
        this._actionText = "Delete Save " + slotId + "?";
        this.refresh();
      };

      Window_SaveConfirm.prototype.windowWidth = function () {
        return 360;
      };

      Window_SaveConfirm.prototype.windowHeight = function () {
        // Question text line + gap + 2 command rows + padding
        return this.fittingHeight(3) + 8;
      };

      Window_SaveConfirm.prototype.makeCommandList = function () {
        this.addCommand("Yes", "confirm");
        this.addCommand("No", "cancel");
      };

      Window_SaveConfirm.prototype.itemTextAlign = function () {
        return "center";
      };

      Window_SaveConfirm.prototype.drawAllItems = function () {
        // Draw the question text above the commands
        var pad = this.textPadding();
        this.drawText(
          this._actionText || "",
          pad,
          0,
          this.contentsWidth() - pad * 2,
          "center",
        );
        // Draw commands below
        for (var i = 0; i < this.maxItems(); i++) {
          this.drawItem(i);
        }
      };

      Window_SaveConfirm.prototype.itemRect = function (index) {
        var rect = Window_Command.prototype.itemRect.call(this, index);
        // Offset commands below the question text
        rect.y += this.lineHeight() + 8;
        return rect;
      };

      Window_SaveConfirm.prototype.numVisibleRows = function () {
        return 2;
      };
    }

    // Adds a "Stretch" boolean toggle to the options window. When ON,
    // Graphics._stretchEnabled = true and the canvas scales to fill the
    // browser window while maintaining aspect ratio.
    if (
      typeof ConfigManager !== "undefined" &&
      typeof Graphics !== "undefined"
    ) {
      ConfigManager.stretch = true;

      var _orig_makeData = ConfigManager.makeData;
      ConfigManager.makeData = function () {
        var config = _orig_makeData.call(this);
        config.stretch = this.stretch;
        return config;
      };

      var _orig_applyData = ConfigManager.applyData;
      ConfigManager.applyData = function (config) {
        _orig_applyData.call(this, config);
        this.stretch = config.stretch === undefined ? true : !!config.stretch;
        Graphics._stretchEnabled = this.stretch;
        Graphics._updateAllElements();
      };

      // ConfigManager.load() already ran in Scene_Boot.create (before
      // applyPatches), so the patched applyData above missed the initial
      // load. Sync Graphics to the current ConfigManager.stretch value now.
      Graphics._stretchEnabled = ConfigManager.stretch;
      Graphics._updateAllElements();
    }

    if (typeof Window_Options !== "undefined") {
      var _orig_optMakeCmdList = Window_Options.prototype.makeCommandList;
      Window_Options.prototype.makeCommandList = function () {
        _orig_optMakeCmdList.call(this);
        this.addCommand("Stretch", "stretch");
      };

      // Override statusText so 'stretch' shows 'On'/'Off' instead of raw bool.
      var _orig_optStatusText = Window_Options.prototype.statusText;
      Window_Options.prototype.statusText = function (index) {
        var sym = this.commandSymbol(index);
        if (sym === "stretch") {
          return this.getConfigValue(sym) ? "On" : "Off";
        }
        return _orig_optStatusText.apply(this, arguments);
      };

      // The DRM overrides processOk/cursorLeft/cursorRight with _input,
      // which treats unknown symbols as numeric (calls .boundaryWrap/.clamp).
      // Wrap _input to handle 'stretch' as a boolean toggle before the DRM path.
      var _orig_optInput = Window_Options.prototype._input;
      if (_orig_optInput) {
        Window_Options.prototype._input = function (dir, wrap) {
          var sym = this.commandSymbol(this.index());
          if (sym === "stretch") {
            var cur = this.getConfigValue(sym);
            this.changeValue(sym, !cur);
            return;
          }
          return _orig_optInput.apply(this, arguments);
        };
      }

      // Mouse wheel changes option values when mouse control plugin is active
      var _orig_optProcessWheel = Window_Options.prototype.processWheel;
      Window_Options.prototype.processWheel = function () {
        if (isPluginActive("_mouseControl") && this.isOpenAndActive()) {
          var threshold = 20;
          if (TouchInput.wheelY >= threshold) {
            // Scroll down = decrease value (like cursorLeft)
            var sym = this.commandSymbol(this.index());
            if (sym) {
              if (this._input) {
                this._input(-1, false);
              } else {
                this.cursorLeft(false);
              }
            }
            return;
          }
          if (TouchInput.wheelY <= -threshold) {
            // Scroll up = increase value (like cursorRight)
            var sym2 = this.commandSymbol(this.index());
            if (sym2) {
              if (this._input) {
                this._input(1, false);
              } else {
                this.cursorRight(false);
              }
            }
            return;
          }
        }
        if (_orig_optProcessWheel) {
          _orig_optProcessWheel.call(this);
        }
      };

      var _orig_optSetConfigValue = Window_Options.prototype.setConfigValue;
      Window_Options.prototype.setConfigValue = function (symbol, value) {
        _orig_optSetConfigValue.call(this, symbol, value);
        if (symbol === "stretch") {
          Graphics._stretchEnabled = !!value;
          Graphics._updateAllElements();
        }
      };
    }

    // Always enable Continue on the title screen so players can import saves
    if (typeof Window_TitleCommand !== "undefined") {
      Window_TitleCommand.prototype.isContinueEnabled = function () {
        return true;
      };
    }

    // The DRM payload defines its own makeCommandList that filters
    // commands to a strict ordered set (MenuOptions.labels()). We wrap
    // it to append "Mods" after that filtering.
    if (typeof Window_TitleCommand !== "undefined" && getModList().length > 0) {
      var _payload_makeCmdList = Window_TitleCommand.prototype.makeCommandList;
      Window_TitleCommand.prototype.makeCommandList = function () {
        _payload_makeCmdList.call(this);
        // Insert Mods before Quit Game
        var quitIdx = -1;
        for (var i = 0; i < this._list.length; i++) {
          if (
            this._list[i].symbol === "quit" ||
            this._list[i].symbol === "exitGame" ||
            this._list[i].name === "Quit Game"
          ) {
            quitIdx = i;
            break;
          }
        }
        var modsCmd = {
          name: "Mods",
          symbol: "mods",
          enabled: true,
          ext: null,
        };
        if (quitIdx >= 0) {
          this._list.splice(quitIdx, 0, modsCmd);
        } else {
          this._list.push(modsCmd);
        }
      };

      // Add Mods icon to MenuOptions if the payload defined it.
      // The character sheet loads async: when it arrives, refresh
      // the title command window so the icon appears even on first render.
      if (typeof MenuOptions !== "undefined") {
        var modsSheet = ImageManager.loadNormalBitmap("img/mods.png", 0);
        var modsIcon = new Bitmap(26, 26);
        modsSheet.addLoadListener(function () {
          modsIcon.blt(
            modsSheet,
            0,
            0,
            modsSheet.width,
            modsSheet.height,
            0,
            0,
            26,
            26,
          );
          modsIcon._loadingState = "loaded";
          modsIcon._callLoadListeners();
          // Redraw the title command window if it's currently visible
          if (
            typeof SceneManager !== "undefined" &&
            SceneManager._scene &&
            SceneManager._scene._commandWindow
          ) {
            SceneManager._scene._commandWindow.refresh();
          }
        });
        MenuOptions.iconImages["Mods"] = modsIcon;
      }
    }

    if (typeof Scene_Title !== "undefined") {
      var _orig_createCmdWin = Scene_Title.prototype.createCommandWindow;
      Scene_Title.prototype.createCommandWindow = function () {
        _orig_createCmdWin.call(this);
        this._commandWindow.setHandler("mods", this.commandMods.bind(this));
      };

      Scene_Title.prototype.commandMods = function () {
        this._commandWindow.close();
        SceneManager.push(Scene_Mods);
      };
    }

    // Scene_Mods: mod selection screen
    window.Scene_Mods = function () {
      this.initialize.apply(this, arguments);
    };

    Scene_Mods.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Mods.prototype.constructor = Scene_Mods;

    Scene_Mods.prototype.initialize = function () {
      Scene_MenuBase.prototype.initialize.call(this);
      this._installing = null;
    };

    Scene_Mods.prototype.create = function () {
      Scene_MenuBase.prototype.create.call(this);
      this.createHelpWindow();
      this.createListWindow();
      this.createConfirmWindow();
    };

    Scene_Mods.prototype.createHelpWindow = function () {
      this._helpWindow = new Window_Help(1);
      var am = getActiveMod();
      this._helpWindow.setText(am ? "Mods | Active: " + am : "Mods");
      this.addWindow(this._helpWindow);
      this._drawModsHints();
    };

    Scene_Mods.prototype._drawModsHints = function () {
      var hw = this._helpWindow;
      var labels = [
        { text: "[Del] Uninstall mod", key: "hintUninstall" },
        { text: "[Enter] Install/Enable/Disable mod", key: "hintInstall" },
      ];
      var separator = "   ";
      var pad = hw.standardPadding();
      hw.contents.fontSize = 16;
      hw.contents.textColor = "#888888";
      var totalW = 0;
      for (var li = 0; li < labels.length; li++) {
        totalW += hw.contents.measureTextWidth(labels[li].text);
        if (li < labels.length - 1)
          totalW += hw.contents.measureTextWidth(separator);
      }
      var startX = Math.floor((hw.contentsWidth() - totalW) / 2);
      var y = (hw.contentsHeight() - 20) / 2;
      var curX = startX;
      this._modHintRects = {};
      for (var li = 0; li < labels.length; li++) {
        var tw = hw.contents.measureTextWidth(labels[li].text);
        hw.contents.drawText(labels[li].text, curX, y, tw + 4, 20);
        this._modHintRects[labels[li].key] = {
          x: hw.x + pad + curX,
          y: hw.y + pad + y,
          w: tw + 4,
          h: 20,
        };
        curX += tw;
        if (li < labels.length - 1)
          curX += hw.contents.measureTextWidth(separator);
      }
      hw.contents.fontSize = hw.standardFontSize();
      hw.resetTextColor();
    };

    Scene_Mods.prototype.createListWindow = function () {
      var y = this._helpWindow.height;
      var width = Graphics.boxWidth;
      var height = Graphics.boxHeight - y;
      this._listWindow = new Window_ModList(0, y, width, height);
      this._listWindow.setHandler("ok", this.onModOk.bind(this));
      this._listWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._listWindow);
    };

    Scene_Mods.prototype.createConfirmWindow = function () {
      this._confirmWindow = new Window_ModConfirm();
      this._confirmWindow.setHandler("yes", this.onConfirmYes.bind(this));
      this._confirmWindow.setHandler("no", this.onConfirmNo.bind(this));
      this._confirmWindow.hide();
      this._confirmWindow.deactivate();
      this.addWindow(this._confirmWindow);
    };

    Scene_Mods.prototype.start = function () {
      Scene_MenuBase.prototype.start.call(this);
      var self = this;
      fetchAllModStatus(function () {
        if (self._listWindow) self._listWindow.refresh();
      });
    };

    Scene_Mods.prototype.update = function () {
      Scene_MenuBase.prototype.update.call(this);
      if (
        this._listWindow &&
        this._listWindow.active &&
        Input.isTriggered("delete")
      ) {
        if (Input._currentState["alt"]) {
          // Alt+Del: delete all local files (hidden shortcut)
          this._showConfirm(
            "Delete ALL saves & local files?",
            "eraseAll",
            null,
          );
        } else {
          var mod = this._listWindow.selectedMod();
          if (mod && isBuiltIn(mod) && isPluginType(mod.type)) {
            // Built-in plugin: disable instead of uninstall
            if (isPluginActive(mod.key)) {
              this._showConfirm(
                "Disable " + mod.name + "?",
                "disablePlugin",
                mod,
              );
            }
          } else if (
            mod &&
            _modStatus[mod.key] &&
            _modStatus[mod.key].installed
          ) {
            this._showConfirm("Uninstall " + mod.name + "?", "uninstall", mod);
          }
        }
      }
      // Hint button click detection (only with mouse control enabled)
      if (
        isPluginActive("_mouseControl") &&
        this._modHintRects &&
        this._listWindow &&
        this._listWindow.active &&
        !this._pendingAction &&
        TouchInput.isTriggered()
      ) {
        var tx = TouchInput.x;
        var ty = TouchInput.y;
        var rUninstall = this._modHintRects.hintUninstall;
        var rInstall = this._modHintRects.hintInstall;
        if (
          rUninstall &&
          tx >= rUninstall.x &&
          tx <= rUninstall.x + rUninstall.w &&
          ty >= rUninstall.y &&
          ty <= rUninstall.y + rUninstall.h
        ) {
          // Click on [Del] Uninstall mod
          var mod = this._listWindow.selectedMod();
          if (mod && isBuiltIn(mod) && isPluginType(mod.type)) {
            if (isPluginActive(mod.key)) {
              this._showConfirm(
                "Disable " + mod.name + "?",
                "disablePlugin",
                mod,
              );
            }
          } else if (
            mod &&
            _modStatus[mod.key] &&
            _modStatus[mod.key].installed
          ) {
            this._showConfirm("Uninstall " + mod.name + "?", "uninstall", mod);
          }
        } else if (
          rInstall &&
          tx >= rInstall.x &&
          tx <= rInstall.x + rInstall.w &&
          ty >= rInstall.y &&
          ty <= rInstall.y + rInstall.h
        ) {
          // Click on [Enter] Install/Enable mod
          this.onModOk();
        }
      }
    };

    Scene_Mods.prototype._showConfirm = function (message, action, mod) {
      this._pendingAction = { type: action, mod: mod };
      this._listWindow.deactivate();
      this._confirmWindow.setMessage(message);
      this._confirmWindow.show();
      this._confirmWindow.activate();
      this._confirmWindow.select(1);
      SoundManager.playOk();
    };

    Scene_Mods.prototype.onModOk = function () {
      var mod = this._listWindow.selectedMod();
      if (!mod) {
        this._listWindow.activate();
        return;
      }

      var status = _modStatus[mod.key];
      var installed = status && status.installed;

      if (!installed && isBuiltIn(mod) && isPluginType(mod.type)) {
        // Built-in plugin: always say "Enable" (already available, no install)
        if (!isPluginActive(mod.key)) {
          setPluginActive(mod.key, true);
          SoundManager.playOk();
          var self = this;
          loadPluginMod(mod.key, function () {
            self._listWindow.refresh();
            self._listWindow.activate();
          });
          this._listWindow.refresh();
          this._listWindow.activate();
        } else {
          this._listWindow.activate();
        }
        return;
      }

      if (!installed) {
        if (this._installing) {
          this._listWindow.activate();
          return;
        }
        this._showConfirm("Install " + mod.name + "?", "install", mod);
        return;
      }

      if (isPluginType(mod.type)) {
        if (isPluginActive(mod.key)) {
          this._showConfirm("Disable " + mod.name + "?", "disablePlugin", mod);
        } else {
          setPluginActive(mod.key, true);
          SoundManager.playOk();
          var self = this;
          loadPluginMod(mod.key, function () {
            self._listWindow.refresh();
            self._listWindow.activate();
          });
          this._listWindow.refresh();
          this._listWindow.activate();
        }
        return;
      }

      if (getActiveMod() === mod.key) {
        this._showConfirm("Disable " + mod.name + "?", "disableOverhaul", mod);
      } else if (getActiveMod()) {
        var currentMod = getActiveMod();
        var currentName = currentMod;
        var mods = getModList();
        for (var i = 0; i < mods.length; i++) {
          if (mods[i].key === currentMod) {
            currentName = mods[i].name;
            break;
          }
        }
        this._showConfirm(
          "Enable " + mod.name + "? This will disable " + currentName,
          "switchOverhaul",
          mod,
        );
      } else {
        this._showConfirm("Enable " + mod.name + "?", "enableOverhaul", mod);
      }
    };

    Scene_Mods.prototype.onConfirmYes = function () {
      this._confirmWindow.hide();
      this._confirmWindow.deactivate();

      var action = this._pendingAction;
      this._pendingAction = null;
      if (!action) {
        this._listWindow.activate();
        return;
      }

      var mod = action.mod;
      var self = this;

      switch (action.type) {
        case "install":
          this._installing = mod.key;
          if (!_modStatus[mod.key]) _modStatus[mod.key] = {};
          _modStatus[mod.key]._downloading = true;
          _modStatus[mod.key]._progress = "Connecting...";
          this._listWindow.refresh();

          installMod(
            mod.key,
            mod.path,
            function onProgress(d) {
              _modStatus[mod.key]._progress =
                d.message || "Installing... " + d.percent + "%";
              self._listWindow.refresh();
            },
            function onDone(d) {
              _modStatus[mod.key].installed = true;
              _modStatus[mod.key].version = d.version || "";
              _modStatus[mod.key]._downloading = false;
              self._installing = null;
              if (isPluginType(mod.type)) {
                setPluginActive(mod.key, true);
                loadPluginMod(mod.key, function () {
                  self._listWindow.refresh();
                  self._listWindow.activate();
                });
              } else {
                self._listWindow.refresh();
                self._listWindow.activate();
              }
            },
            function onError(msg) {
              _modStatus[mod.key]._downloading = false;
              _modStatus[mod.key]._error = msg;
              self._installing = null;
              self._listWindow.refresh();
              self._listWindow.activate();
            },
          );
          break;

        case "enableOverhaul":
          setActiveMod(mod.key, function () {
            AudioManager.stopAll();
            location.reload();
          });
          break;

        case "switchOverhaul":
          setActiveMod(mod.key, function () {
            AudioManager.stopAll();
            location.reload();
          });
          break;

        case "disableOverhaul":
          setActiveMod(null, function () {
            AudioManager.stopAll();
            location.reload();
          });
          break;

        case "disablePlugin":
          setPluginActive(mod.key, false);
          AudioManager.stopAll();
          location.reload();
          break;

        case "uninstall":
          var wasActive = getActiveMod() === mod.key;
          var wasPlugin = isPluginActive(mod.key);
          if (wasPlugin) setPluginActive(mod.key, false);
          uninstallMod(mod.key, function () {
            if (wasActive) {
              AudioManager.stopAll();
              location.reload();
              return;
            }
            self._listWindow.refresh();
            self._listWindow.activate();
          });
          break;

        case "eraseAll":
          eraseAllClientData();
          break;

        default:
          this._listWindow.activate();
      }
    };

    Scene_Mods.prototype.onConfirmNo = function () {
      this._confirmWindow.hide();
      this._confirmWindow.deactivate();
      this._pendingAction = null;
      this._listWindow.activate();
    };

    // Window_ModConfirm: Yes/No confirmation dialog
    window.Window_ModConfirm = function () {
      this.initialize.apply(this, arguments);
    };

    Window_ModConfirm.prototype = Object.create(Window_Command.prototype);
    Window_ModConfirm.prototype.constructor = Window_ModConfirm;

    Window_ModConfirm.prototype.initialize = function () {
      this._message = "";
      Window_Command.prototype.initialize.call(this, 0, 0);
      this.updatePlacement();
      this.openness = 255;
    };

    Window_ModConfirm.prototype.windowWidth = function () {
      if (this._message) {
        var textW =
          this.textWidth(this._message) + this.standardPadding() * 2 + 24;
        return Math.max(360, Math.min(textW, Graphics.boxWidth - 40));
      }
      return 360;
    };
    Window_ModConfirm.prototype.windowHeight = function () {
      return this.fittingHeight(3);
    };

    Window_ModConfirm.prototype.updatePlacement = function () {
      this.x = (Graphics.boxWidth - this.width) / 2;
      this.y = (Graphics.boxHeight - this.height) / 2;
    };

    Window_ModConfirm.prototype.setMessage = function (msg) {
      this._message = msg;
      this.width = this.windowWidth();
      this.updatePlacement();
      this.createContents();
      this.refresh();
    };

    Window_ModConfirm.prototype.makeCommandList = function () {
      this.addCommand("Yes", "yes");
      this.addCommand("No", "no");
    };

    Window_ModConfirm.prototype.refresh = function () {
      Window_Command.prototype.refresh.call(this);
      if (this._message) {
        this.drawText(this._message, 0, 0, this.contentsWidth(), "center");
      }
    };

    Window_ModConfirm.prototype.itemRect = function (index) {
      var rect = Window_Command.prototype.itemRect.call(this, index);
      rect.y += this.lineHeight();
      return rect;
    };

    // Window_ModList: mod list
    window.Window_ModList = function () {
      this.initialize.apply(this, arguments);
    };

    Window_ModList.prototype = Object.create(Window_Selectable.prototype);
    Window_ModList.prototype.constructor = Window_ModList;

    Window_ModList.prototype.initialize = function (x, y, width, height) {
      this._mods = getModList();
      this._iconBitmaps = {};
      Window_Selectable.prototype.initialize.call(this, x, y, width, height);
      this._loadIcons();
      this.refresh();
      this.select(0);
      this.activate();
    };

    Window_ModList.prototype._loadIcons = function () {
      var self = this;
      for (var i = 0; i < this._mods.length; i++) {
        var mod = this._mods[i];
        if (mod.icon) {
          var bmp = ImageManager.loadNormalBitmap(mod.icon, 0);
          this._iconBitmaps[mod.key] = bmp;
          bmp.addLoadListener(function () {
            self.refresh();
          });
        }
      }
      var defIcon = getDefaultModIcon();
      if (defIcon) {
        defIcon.addLoadListener(function () {
          self.refresh();
        });
      }
    };

    Window_ModList.prototype.maxItems = function () {
      return this._mods.length;
    };

    Window_ModList.prototype.maxVisibleItems = function () {
      return 5;
    };

    Window_ModList.prototype.itemHeight = function () {
      var innerHeight = this.height - this.padding * 2;
      return Math.floor(innerHeight / this.maxVisibleItems());
    };

    Window_ModList.prototype.selectedMod = function () {
      var idx = this.index();
      return idx >= 0 && idx < this._mods.length ? this._mods[idx] : null;
    };

    function isBuiltIn(mod) {
      return mod.path && mod.path.indexOf("mods/_") === 0;
    }

    Window_ModList.prototype.drawItem = function (index) {
      var mod = this._mods[index];
      if (!mod) return;
      var rect = this.itemRectForText(index);
      var lineHeight = this.lineHeight();
      var pad = rect.x;

      var iconH = rect.height - pad * 2;
      var iconW = Math.floor((iconH * 16) / 9);
      var textX = rect.x + iconW + 8;
      var iconY = rect.y + pad;

      var iconBmp = this._iconBitmaps[mod.key];
      var src =
        iconBmp && iconBmp.isReady() && iconBmp.width > 1
          ? iconBmp
          : getDefaultModIcon();
      if (src && src.isReady() && src.width > 1) {
        var scale = Math.min(iconW / src.width, iconH / src.height);
        var dw = Math.floor(src.width * scale);
        var dh = Math.floor(src.height * scale);
        var ix = rect.x + Math.floor((iconW - dw) / 2);
        var iy = iconY + Math.floor((iconH - dh) / 2);
        this.contents.blt(src, 0, 0, src.width, src.height, ix, iy, dw, dh);
      }

      var availW = rect.width - (textX - rect.x);

      // Line 1: mod name + "by author" (left), date (right)
      this.resetTextColor();
      var nameW = this.textWidth(mod.name);
      this.drawText(mod.name, textX, rect.y, availW);
      var byX = textX + Math.min(nameW, availW) + 8;
      var byText = "by " + mod.author;
      this.contents.fontSize = 18;
      this.contents.textColor = "#aaaacc";
      this.drawText(byText, byX, rect.y + 4, rect.width - (byX - rect.x));
      this.contents.fontSize = this.standardFontSize();

      if (mod.lastUpdate) {
        this.contents.fontSize = 16;
        this.resetTextColor();
        this.drawText(mod.lastUpdate, rect.x, rect.y + 4, rect.width, "right");
        this.contents.fontSize = this.standardFontSize();
      }

      var status = _modStatus[mod.key];
      var installed = status && status.installed;
      var lineY = rect.y + lineHeight;
      var smallLine = Math.floor(lineHeight * 0.7);

      // Line 2: type label (left), installed status (right)
      var rawType = (mod.type || "overhaul")
        .replace(/^built-in\s+/i, "")
        .replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        });
      var typeLabel = "[" + rawType + "]";
      this.contents.fontSize = 16;
      this.contents.textColor = isPluginType(mod.type) ? "#88bbff" : "#ff8888";
      this.drawText(typeLabel, textX, lineY + 2, availW);

      if (status && status._downloading) {
        this.contents.textColor = "#ffff88";
        this.drawText(
          status._progress || "Installing...",
          rect.x,
          lineY + 2,
          rect.width,
          "right",
        );
      } else if (status && status._error) {
        this.contents.textColor = "#ff8888";
        this.drawText(
          "Error: " + status._error,
          rect.x,
          lineY + 2,
          rect.width,
          "right",
        );
      } else if (isBuiltIn(mod)) {
        this.contents.textColor = "#88ff88";
        this.drawText("Built-in", rect.x, lineY + 2, rect.width, "right");
      } else {
        this.contents.textColor = installed ? "#88ff88" : "#aaaaaa";
        this.drawText(
          installed ? "Installed" : "Not installed",
          rect.x,
          lineY + 2,
          rect.width,
          "right",
        );
      }

      // Line 3: description (left), enabled status (right)
      if (mod.description) {
        this.contents.textColor = "#cccccc";
        this.drawText(mod.description, textX, lineY + smallLine + 2, availW);
      }

      if (isBuiltIn(mod) || installed) {
        var isActive;
        if (isPluginType(mod.type)) {
          isActive = isPluginActive(mod.key);
        } else {
          isActive = getActiveMod() === mod.key;
        }
        this.contents.textColor = isActive ? "#88ff88" : "#aaaaaa";
        this.drawText(
          isActive ? "Enabled" : "Disabled",
          rect.x,
          lineY + smallLine + 2,
          rect.width,
          "right",
        );
      }

      this.contents.fontSize = this.standardFontSize();
      this.resetTextColor();
    };

    Window_ModList.prototype.playOkSound = function () {
      SoundManager.playOk();
    };

    /*console.log(
      "[lang-shim] Mod system patches applied" +
        (_modsLoaded ? " (mods: " + getModList().length + ")" : "") +
        (getActiveMod() ? ", active: " + getActiveMod() : ""),
    );*/
  }

  // Hook into Scene_Boot.prototype.start
  //
  // The DRM payload (loaded via plugins AFTER lang-shim.js) overwrites
  // Scene_Boot.prototype.start, so we cannot wrap it here at load time.
  // Instead, expose hookSceneBoot() for the bootstrap sentinel to call
  // after all plugin scripts have executed.

  function hookSceneBoot() {
    if (typeof Scene_Boot === "undefined") return;

    // Re-apply the isReady gate AFTER the DRM payload has executed.
    // The DRM can (and does) overwrite Scene_Boot.prototype.isReady,
    // which drops the _savesRestored gate set during the IIFE. Without
    // this gate the game can boot before IDB saves are restored to
    // localStorage, causing mod saves to appear lost after a reload.
    var _post_drm_isReady = Scene_Boot.prototype.isReady;
    Scene_Boot.prototype.isReady = function () {
      return _savesRestored && _post_drm_isReady.call(this);
    };

    var _orig_bootStart = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
      applyPatches();
      loadActivePlugins();
      return _orig_bootStart.apply(this, arguments);
    };
  }

  window.__langShimHookBoot = hookSceneBoot;
})();

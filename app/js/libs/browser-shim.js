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
  function rpgsaveToStorageKey(p) {
    var ps = String(p);
    if (/global\.rpgsave$/i.test(ps)) return "RPG Global";
    if (/config\.rpgsave$/i.test(ps)) return "RPG Config";
    var m = ps.match(/file(\d+)\.rpgsave$/i);
    if (m) return "RPG File" + m[1];
    return null;
  }

  // Helper: prefix a storage key with the active mod id (if any).
  function modAwareKey(baseKey) {
    try {
      var mod = localStorage.getItem("_activeMod");
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

  window.__applyBrowserOverrides = function () {
    if (window.__browserOverridesApplied) return;
    window.__browserOverridesApplied = true;

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
      App.close = function () {};
      App.report = function () {};
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
          if (data) {
            // TCOAALili-style DRM requires imageLUT; base DRM requires
            // imgFiles. Guarantee both so Lang.isValid passes.
            if (!data.imageLUT || typeof data.imageLUT !== "object")
              data.imageLUT = {};
            if (!data.imgFiles || typeof data.imgFiles !== "object")
              data.imgFiles = {};
            this.data[LIST_KEY] = data;
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
  };

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
            // .settings -> not in browser
            if (/\.settings$/i.test(ps)) return false;
            // Block dialogue.txt / dialogue.csv custom-overlay probes: the
            // merged CLD (served via dialogue.loc) already contains the
            // active translation. If these probes returned true, the DRM
            // would readFileSync them via XHR, get an empty buffer, and
            // fail to parse: corrupting language data.
            if (isLangOverlayProbe(ps)) return false;
            // Save directory (CoffinAndyLeyley) -> report as existing
            if (ps.indexOf("CoffinAndyLeyley") !== -1) return true;
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
            // .settings / app-data dir: not available in browser
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
            // .rpgsave -> mirror to localStorage
            var ps = String(p || "");
            if (/\.rpgsave$/i.test(ps)) {
              var sk = rpgsaveToStorageKey(ps);
              if (sk) {
                var val =
                  typeof data === "string"
                    ? data
                    : data && data.toString
                      ? data.toString("utf8")
                      : "";
                localStorage.setItem(modAwareKey(sk), val);
              }
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
            // paths with extensions are files, others are directories
            var hasExt = /\.[a-z0-9]{1,6}$/i.test(String(p));
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
            return [];
          },
          unlinkSync: function (p) {
            var ps = String(p || "");
            if (/\.rpgsave/i.test(ps)) {
              var sk = rpgsaveToStorageKey(ps);
              if (sk) localStorage.removeItem(modAwareKey(sk));
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
        quit: function () {},
        crash: function () {},
        closeAllWindows: function () {},
      },
      Window: {
        get: function () {
          return {
            title: "",
            x: 0,
            y: 0,
            close: function () {},
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

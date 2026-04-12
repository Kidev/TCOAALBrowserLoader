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

  // Helper: does `p` refer to the CLD asset (data/9c7050ae76645487)?
  function isCLDPath(p) {
    return typeof p === "string" && p.indexOf("9c7050ae76645487") !== -1;
  }

  // Helper: normalise path: strip leading .\ or ./, normalise separators
  function normPath(p) {
    return String(p).replace(/\\/g, "/").replace(/^\.\//, "");
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

  // Browser overrides appended to every decompressed DRM payload.
  //
  // These run in the same script context as the payload, AFTER all
  // payload definitions, so they can freely reassign payload globals.
  var BROWSER_OVERRIDES = [
    "",
    ";(function() {",
    "  /* Browser overrides for DRM payload */",
    "",
    "  // Skip DRM hash check (reads a file from disk)",
    "  Crypto.hashMatchDRM = function() { return true; };",
    "",
    "  // Steam: payload redefines with NW.js/greenworks checks; override back.",
    "  // Must override all methods that access Steam.API (null in browser).",
    "  Steam.init = function() { return true; };",
    '  Steam.currentLanguage = function() { return "english"; };',
    "  Steam.awardAchievement = function() {};",
    "  Steam.clearAllAchievements = function() {};",
    '  if (typeof Steam.isInitialized === "function") Steam.isInitialized = function() { return false; };',
    '  if (typeof Steam.retryInit === "function") Steam.retryInit = function() { return false; };',
    "",
    "  // Non-blocking crash (prevent alert() freeze + nw.gui close)",
    '  App.crash  = function(msg) { console.error("[DRM] CRITICAL:", msg); };',
    "  App.close  = function() {};",
    "  App.report = function() {};",
    "",
    "  // Lang.search: browser version. Discovers all available languages",
    "  // via /languages-list.json (served by SW/server.js) and loads each",
    "  // language's .loc data. Falls back to CLD for the base language.",
    "  Lang.search = function() {",
    "    try {",
    "      var langList;",
    "      try {",
    "        var lx = new XMLHttpRequest();",
    '        lx.open("GET", "/languages-list.json", false);',
    "        lx.send();",
    "        if (lx.status >= 200 && lx.status < 400) langList = JSON.parse(lx.responseText);",
    "      } catch(e) {}",
    '      if (!langList || !langList.length) langList = ["english"];',
    "",
    "      this.list = {};",
    "      this.offc = langList;",
    "      this.data = this.data || {};",
    "",
    "      for (var i = 0; i < langList.length; i++) {",
    "        var lang = langList[i];",
    '        this.list[lang] = "languages/" + lang + "/dialogue.loc";',
    "        try {",
    "          var data = null;",
    "          // Try XHR first (SW serves mod files from IDB)",
    "          try {",
    "            var locXhr = new XMLHttpRequest();",
    '            locXhr.open("GET", "languages/" + lang + "/dialogue.loc", false);',
    "            locXhr.send();",
    "            if (locXhr.status >= 200 && locXhr.status < 400 && locXhr.responseText) {",
    "              var text = locXhr.responseText;",
    '              var jsonStart = text.indexOf("{");',
    "              if (jsonStart >= 0) data = JSON.parse(text.substring(jsonStart));",
    "            }",
    "          } catch(xe) {}",
    "          // Fallback: use preloaded __langData (from IDB, mod-aware)",
    "          if (!data && window.__langData) {",
    "            try {",
    "              var ld = window.__langData;",
    '              if (typeof ld === "string") {',
    '                var js = ld.indexOf("{");',
    "                if (js >= 0) data = JSON.parse(ld.substring(js));",
    "              }",
    "            } catch(pe) {}",
    "          }",
    "          if (data) {",
    "            data.imageLUT = data.imageLUT || {};",
    "            this.data[lang] = data;",
    "          }",
    "        } catch(e) {",
    '          console.warn("[Lang.search] Failed to load " + lang + ":", e);',
    "        }",
    "      }",
    "    } catch(e) {",
    '      console.warn("[browser-shim] Lang.search failed:", e);',
    "    }",
    "  };",
    "",
    "  // Lang.imgMapping: no translated images in browser mode",
    "  Lang.imgMapping = function() {};",
    "",
    "  // Crypto.dekit: pass through (SW/server already decrypts assets)",
    "  Crypto.dekit = function(data) { return data; };",
    "",
    "  // Crypto.resolveURL / resolvePath: fix for browser mode.",
    "  // The DRM's originals check Utils.exists() before consulting the",
    "  // Copylist hash map. Our fs.existsSync stub returns true for",
    "  // everything, so the lookup is skipped and the logical URL is used.",
    "  // The SW cannot resolve it because the base-game file may have a",
    "  // different original name. Override to always consult the map.",
    '  if (typeof Crypto.generateHashFromUnencryptedFilePath === "function") {',
    "    var _cryptoTryResolve = function(url) {",
    "      if (Object.keys(Crypto._hashToPathMap || {}).length === 0) {",
    "        try { Crypto.loadUnencryptedToEncryptedFileHashMap(); } catch(e) {}",
    "      }",
    "      var h = Crypto.generateHashFromUnencryptedFilePath(url);",
    "      if (Crypto._hashToPathMap && h in Crypto._hashToPathMap) {",
    "        return Crypto._hashToPathMap[h];",
    "      }",
    "      return url;",
    "    };",
    '    if (typeof Crypto.resolveURL === "function") {',
    "      Crypto.resolveURL = function(url) {",
    "        url = decodeURIComponent(url);",
    "        if (Crypto._pathMap && url in Crypto._pathMap) return Crypto._pathMap[url];",
    "        var resolved = _cryptoTryResolve(url);",
    "        if (Crypto._pathMap) {",
    "          Crypto._pathMap[url] = resolved;",
    "          Crypto._pathMap[resolved] = resolved;",
    "        }",
    "        return resolved;",
    "      };",
    "    }",
    '    if (typeof Crypto.resolvePath === "function") {',
    "      Crypto.resolvePath = function(filePath) {",
    "        if (Crypto._pathMap && filePath in Crypto._pathMap) return Crypto._pathMap[filePath];",
    "        var resolved = _cryptoTryResolve(filePath);",
    "        if (Crypto._pathMap) {",
    "          Crypto._pathMap[filePath] = resolved;",
    "          Crypto._pathMap[resolved] = resolved;",
    "        }",
    "        return resolved;",
    "      };",
    "    }",
    "  }",
    "",
    "  // Force fullscreen off and hide it from the options menu.",
    "  // NW.js fullscreen is unavailable in browser; the Stretch option",
    "  // (added by lang-shim.js) handles aspect-ratio-preserving scaling.",
    "  ConfigManager.fullscreen = false;",
    "  var _drm_applyData = ConfigManager.applyData;",
    "  ConfigManager.applyData = function(config) {",
    "    _drm_applyData.call(this, config);",
    "    this.fullscreen = false;",
    "  };",
    "",
    "  // Remove the Fullscreen row from the options window.",
    "  var _drm_makeCmdList = Window_Options.prototype.makeCommandList;",
    "  Window_Options.prototype.makeCommandList = function() {",
    "    _drm_makeCmdList.call(this);",
    "    for (var i = this._list.length - 1; i >= 0; i--) {",
    "      if (this._list[i].symbol === 'fullscreen') {",
    "        this._list.splice(i, 1);",
    "      }",
    "    }",
    "  };",
    "",
    "})();",
  ].join("\n");

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
            if (isCLDPath(p)) return !!ensureLangData();
            var ps = String(p);
            // .rpgsave -> check localStorage (DRM validates via fs)
            if (/\.rpgsave$/i.test(ps)) {
              var sk = rpgsaveToStorageKey(ps);
              return sk ? !!localStorage.getItem(modAwareKey(sk)) : false;
            }
            // .settings -> not in browser
            if (/\.settings$/i.test(ps)) return false;
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
            // DRM scans languages/ for language folders.
            // Fetch the list from the server/SW.
            if (/languages\/?$/i.test(np)) {
              try {
                var lx = new XMLHttpRequest();
                lx.open("GET", "/languages-list.json", false);
                lx.send();
                if (lx.status >= 200 && lx.status < 400) {
                  var list = JSON.parse(lx.responseText);
                  if (list && list.length) return list;
                }
              } catch (e) {}
              return ensureLangData() ? ["english"] : [];
            }
            // Return dialogue.loc for language subfolder
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
      activateAchievement: function () {},
      getAchievement: function () {
        return false;
      },
      clearAchievement: function () {},
      getStatInt: function () {
        return 0;
      },
      setAchievement: function () {},
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

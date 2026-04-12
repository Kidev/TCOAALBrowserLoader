/**
 * TCOAAL Service Worker
 *
 * Intercepts game asset requests and serves them from IndexedDB, applying
 * the same TCOAAL decryption that server.js performs server-side.
 *
 * Flow for a request to "data/System.json":
 *   1. Try IDB key "data/System.json"                  -> not found (hashed filename)
 *   2. hashPath("data/System.json")                   -> "data/be1a37535e921f91"
 *   3. Try IDB key "data/be1a37535e921f91"     -> found
 *   4. dekit(buffer, "data/be1a37535e921f91")  -> plain JSON
 *   5. Respond with Content-Type: application/json
 *
 * Flow for "js/rpg_core.js":
 *   1. Try IDB key "js/rpg_core.js" -> found (plain file)
 *   2. Respond with Content-Type: application/javascript
 *
 * When IDB has no entry (SW installed but no files loaded, or server.js
 * handles the request), falls through to the network.
 */

"use strict";

// Constants

const DB_NAME = "tcoaal";
const DB_VERSION = 1;
const STORE_NAME = "assets";

/* Magic bytes: "TCOAAL" as char codes */
const ASSET_SIG = [84, 67, 79, 65, 65, 76];

const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".loc": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function mimeFor(filePath) {
  const m = filePath.match(/\.[^./\\]+$/);
  return (
    MIME_MAP[(m && m[0].toLowerCase()) || ""] || "application/octet-stream"
  );
}

// IndexedDB  single shared connection, lazy-opened

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAsset(db, key) {
  return new Promise((resolve) => {
    const req = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

const DRM_CACHE_KEY = "__drm_cache__";

/** Persist a built DRM Uint8Array to IDB so new SW instances can reuse it. */
function saveDrmToIdb(db, bytes) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(bytes.buffer, DRM_CACHE_KEY);
    req.onsuccess = resolve;
    req.onerror = resolve; // fail silently: cache is best-effort
  });
}

/** Retrieve a previously persisted DRM payload from IDB. */
function loadDrmFromIdb(db) {
  return new Promise((resolve) => {
    const req = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(DRM_CACHE_KEY);
    req.onsuccess = () => {
      const val = req.result;
      if (!val) {
        resolve(null);
        return;
      }
      resolve(val instanceof ArrayBuffer ? new Uint8Array(val) : val);
    };
    req.onerror = () => resolve(null);
  });
}

// Crypto: browser-compatible port of server.js helpers

/**
 * Compute the hashed storage path for a logical game-asset path.
 * Mirrors server.js hashPath() exactly, using WebCrypto instead of Node.js crypto.
 *
 * @param {string} logicalPath  e.g. "data/System.json"
 * @returns {Promise<string>}   e.g. "data/be1a37535e921f91"
 */
async function hashPath(logicalPath) {
  const parts = logicalPath.split(/[/\\]/);
  const fname = parts[parts.length - 1];

  const encoded = new TextEncoder().encode(parts.join("/"));
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  let h = hex.substring(0, 16);
  if (fname.toUpperCase().includes("[BUST]")) h += "[BUST]";
  if (fname.startsWith("!")) h = "!" + h;
  parts[parts.length - 1] = h;
  return parts.join("/");
}

/**
 * Per-file XOR mask derived from the hashed filename (uppercase).
 * Mirrors server.js fileMask().
 *
 * @param {string} hashedRelPath
 * @returns {number}
 */
function fileMask(hashedRelPath) {
  const fname = decodeURIComponent(hashedRelPath)
    .split("/")
    .pop()
    .toUpperCase();
  let m = 0;
  for (const ch of fname) m = (m << 1) ^ ch.charCodeAt(0);
  return m;
}

/**
 * Decrypt a TCOAAL-encrypted file.
 * Mirrors server.js dekit(), operating on ArrayBuffer instead of Buffer.
 *
 * @param {ArrayBuffer} arrayBuffer   raw file contents
 * @param {string}      hashedRelPath used to derive the per-file key
 * @returns {ArrayBuffer}             decrypted content
 */
function dekit(arrayBuffer, hashedRelPath) {
  const bytes = new Uint8Array(arrayBuffer);

  // Verify magic signature
  if (bytes.length < ASSET_SIG.length + 1) return arrayBuffer;
  for (let i = 0; i < ASSET_SIG.length; i++) {
    if (bytes[i] !== ASSET_SIG[i]) return arrayBuffer;
  }

  let keyByte = bytes[ASSET_SIG.length];
  const payload = bytes.subarray(ASSET_SIG.length + 1);
  let mask = (fileMask(hashedRelPath) + 1) & 0xff;
  if (keyByte === 0) keyByte = payload.length;

  const out = new Uint8Array(payload.length);
  for (let i = 0; i < payload.length; i++) {
    if (i < keyByte) {
      const b = payload[i];
      out[i] = b ^ mask;
      mask = ((mask << 1) ^ b) & 0xff;
    } else {
      out[i] = payload[i];
    }
  }
  return out.buffer;
}

/**
 * Enumerate available language directories from IDB keys.
 * Scans for keys matching "languages/{name}/{hash}" and extracts unique
 * directory names. Returns an array of language names (e.g. ["english","french"]).
 */
function enumerateLanguages(db) {
  return new Promise((resolve) => {
    const langs = new Set();
    // Scan base game language keys (languages/english/...)
    const scanBase = new Promise((res) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const range = IDBKeyRange.bound(
          "languages/",
          "languages/\uffff",
          false,
          false,
        );
        const req = store.openKeyCursor(range);
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            const parts = cursor.key.split("/");
            if (parts.length >= 3 && parts[1]) langs.add(parts[1]);
            cursor.continue();
          } else {
            res();
          }
        };
        req.onerror = () => res();
      } catch {
        res();
      }
    });

    // Also scan mod-prefixed language keys (mod:ID:languages/lang/...)
    const scanMod = _activeMod
      ? new Promise((res) => {
          try {
            const prefix = "mod:" + _activeMod + ":languages/";
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const range = IDBKeyRange.bound(
              prefix,
              prefix + "\uffff",
              false,
              false,
            );
            const req = store.openKeyCursor(range);
            req.onsuccess = () => {
              const cursor = req.result;
              if (cursor) {
                // Key: "mod:ID:languages/english/dialogue.loc"
                const afterPrefix = cursor.key.substring(prefix.length);
                const lang = afterPrefix.split("/")[0];
                if (lang) langs.add(lang);
                cursor.continue();
              } else {
                res();
              }
            };
            req.onerror = () => res();
          } catch {
            res();
          }
        })
      : Promise.resolve();

    Promise.all([scanBase, scanMod]).then(() => resolve(Array.from(langs)));
  });
}

// Language data merging for mod support

/**
 * Merge base and mod language data objects.
 * Both have { labelLUT, linesLUT, sysMenus, sysLabel }.
 * Mod values take priority over base values on conflict.
 */
function mergeLangData(base, mod) {
  const result = { labelLUT: {}, linesLUT: {}, sysMenus: {}, sysLabel: {} };
  const fields = ["labelLUT", "linesLUT", "sysMenus", "sysLabel"];
  for (const f of fields) {
    if (base && base[f]) Object.assign(result[f], base[f]);
    if (mod && mod[f]) Object.assign(result[f], mod[f]);
  }
  return result;
}

/**
 * Attempt to load and parse the base game CLD from IDB.
 * Tries pre-extracted cache first, then encrypted CLD.
 */
async function loadBaseCLD(db) {
  const LANG_CACHE_KEY = "__lang_data__";
  const CLD_KEY = "data/9c7050ae76645487";

  // 1. Pre-extracted plain JSON
  const cached = await getAsset(db, LANG_CACHE_KEY);
  if (cached !== null && typeof cached === "string") {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  // 2. Encrypted CLD file
  const cldRaw = await getAsset(db, CLD_KEY);
  if (cldRaw !== null) {
    const decrypted = dekit(cldRaw, CLD_KEY);
    const bytes = new Uint8Array(decrypted);
    const sig = new TextDecoder().decode(bytes.slice(0, 8));
    if (sig === "LANGDATA") {
      try {
        return JSON.parse(new TextDecoder().decode(bytes.slice(8)));
      } catch {}
    }
  }

  return null;
}

/**
 * Attempt to load mod-specific language data from IDB.
 * Checks dialogue.loc (TCOAAR-style plain JSON), then encrypted CLD.
 */
async function loadModLangData(db, modId) {
  const CLD_KEY = "data/9c7050ae76645487";

  // 0. Pre-extracted cache (set during mod installation by lang-shim.js)
  const cachedKey = "__mod_lang_data__:" + modId;
  const cachedJson = await getAsset(db, cachedKey);
  if (cachedJson !== null && typeof cachedJson === "string") {
    try {
      const parsed = JSON.parse(cachedJson);
      if (parsed && (parsed.linesLUT || parsed.labelLUT)) return parsed;
    } catch {}
  }

  // 1. Plain JSON dialogue file (e.g. TCOAAR's languages/english/dialogue.loc)
  const locKey = "mod:" + modId + ":languages/english/dialogue.loc";
  const locRaw = await getAsset(db, locKey);
  if (locRaw !== null) {
    try {
      const text =
        typeof locRaw === "string" ? locRaw : new TextDecoder().decode(locRaw);
      const parsed = JSON.parse(text.trim());
      if (parsed && (parsed.linesLUT || parsed.labelLUT)) return parsed;
    } catch (e) {
      console.warn("[sw] Failed to parse mod dialogue.loc:", e.message);
    }
  }

  // 2. Encrypted CLD (same format as base game)
  const modCldKey = "mod:" + modId + ":" + CLD_KEY;
  const modCldRaw = await getAsset(db, modCldKey);
  if (modCldRaw !== null) {
    const decrypted = dekit(modCldRaw, CLD_KEY);
    const bytes = new Uint8Array(decrypted);
    const sig = new TextDecoder().decode(bytes.slice(0, 8));
    if (sig === "LANGDATA") {
      try {
        const parsed = JSON.parse(new TextDecoder().decode(bytes.slice(8)));
        if (parsed && (parsed.linesLUT || parsed.labelLUT)) return parsed;
      } catch (e) {
        console.warn("[sw] Failed to parse mod CLD:", e.message);
      }
    }
  }

  console.warn("[sw] No language data found for mod:", modId);
  return null;
}

// DRM payload assembly (browser-only mode)

/**
 * Fragment function names in the order they are concatenated by the DRM injector.
 * Each lives in one of four plugin files; we read those files from IDB.
 */
const DRM_PLUGIN_FILES = [
  [
    "js/plugins/YEP_SaveEventLocations.js",
    ["_0xabd953_", "_0xb1c2fa_", "_0x32d8dd_"],
  ],
  ["js/plugins/YEP_RegionRestrictions.js", ["_0x82f7bc_", "_0x27f7fc_"]],
  ["js/plugins/GALV_RollCredits.js", ["_0x2f7cd8_", "_0x87159a_"]],
  ["js/plugins/NonCombatMenu.js", ["_0xf3e01e_"]],
];
const DRM_ORDER = [
  "_0xabd953_",
  "_0xb1c2fa_",
  "_0x82f7bc_",
  "_0x32d8dd_",
  "_0x2f7cd8_",
  "_0xf3e01e_",
  "_0x87159a_",
  "_0x27f7fc_",
];

/** Cache: Uint8Array of the decompressed DRM JS, or null. */
let _drmCache = null;
let _drmAttempted = false;

/**
 * Decompress a zlib-compressed ArrayBuffer using the Streams API.
 * Node.js zlib.inflateSync produces zlib-wrapped deflate (RFC 1950);
 * DecompressionStream('deflate') handles the same format.
 */
async function zlibInflate(compressedBuffer) {
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  writer.write(compressedBuffer);
  writer.close();

  const chunks = [];
  let total = 0;
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Build the DRM inject script from plugin files stored in IndexedDB.
 * Returns a Uint8Array of UTF-8 JS source, or null on failure.
 */
async function buildDrmScript(db) {
  const fragments = {};
  const decoder = new TextDecoder();

  for (const [logicalPath, fnNames] of DRM_PLUGIN_FILES) {
    // Try encrypted (hashed) path first, then plain path
    const hashed = await hashPath(logicalPath);
    let text = null;
    for (const key of [hashed, logicalPath]) {
      const raw = await getAsset(db, key);
      if (raw !== null) {
        const decrypted = key === hashed ? dekit(raw, hashed) : raw;
        text = decoder.decode(
          decrypted instanceof ArrayBuffer ? decrypted : decrypted,
        );
        break;
      }
    }
    if (text === null) return null;

    for (const fnName of fnNames) {
      const m = text.match(
        new RegExp(
          `function ${fnName}\\(\\)\\s*\\{\\s*return\\s*"([^"]+)"\\s*;\\s*\\}`,
        ),
      );
      if (!m) return null;
      fragments[fnName] = m[1];
    }
  }

  const assembled = DRM_ORDER.map((fn) => fragments[fn]).join("");

  // Base64-decode
  const b64 = atob(assembled);
  const compressed = new Uint8Array(b64.length);
  for (let i = 0; i < b64.length; i++) compressed[i] = b64.charCodeAt(i);

  try {
    const raw = await zlibInflate(compressed.buffer);
    // Strip anti-debug traps: `debugger; return;` blocks that pause Chrome
    // when DevTools is open and return early from the initialisation function,
    // preventing the game from starting.
    const src = new TextDecoder().decode(raw);
    const cleaned = src.replace(/\bdebugger\s*;(\s*return\s*;)?/g, "/* dbg */");
    return new TextEncoder().encode(cleaned);
  } catch {
    return null;
  }
}

// Lifecycle

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Invalidate the DRM cache so it gets rebuilt with the new SW code.
      // This prevents stale DRM payloads from persisting across SW updates.
      openDB()
        .then((db) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).delete(DRM_CACHE_KEY);
        })
        .catch(() => {}),
    ]),
  ),
);

// Active mod tracking
//
// The main page communicates the active mod via postMessage. The value is
// also persisted in IDB (key '__active_mod__') so it survives SW restarts.

let _activeMod = null;
let _activeModLoaded = false;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "setActiveMod") {
    _activeMod = event.data.id || null;
    _activeModLoaded = true;
    // Persist to IDB
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        if (_activeMod) {
          tx.objectStore(STORE_NAME).put(_activeMod, "__active_mod__");
        } else {
          tx.objectStore(STORE_NAME).delete("__active_mod__");
        }
      })
      .catch(() => {});
  }
});

/** Load the active mod from IDB (once, on first request). */
async function ensureActiveModLoaded(db) {
  if (_activeModLoaded) return;
  _activeModLoaded = true;
  try {
    const val = await getAsset(db, "__active_mod__");
    if (val && typeof val === "string") {
      _activeMod = val;
    }
  } catch {}
}

// Fetch interception

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only intercept same-origin GET requests
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  // Decode percent-encoding so IDB key lookups match the stored paths.
  // url.pathname preserves encoding (e.g. %5B/%5D for [ ]) but files were
  // stored under their decoded on-disk names (e.g. img/faces/abc[BUST]).
  let logicalPath;
  try {
    logicalPath =
      decodeURIComponent(url.pathname.replace(/^\/+/, "")) || "index.html";
  } catch {
    logicalPath = url.pathname.replace(/^\/+/, "") || "index.html";
  }

  // Infrastructure files: always serve fresh from the network, bypassing the
  // browser HTTP cache. A bare `return` would let the browser use its own
  // cache (GitHub Pages: max-age=600), so after a push clients could get stale
  // copies of browser-shim.js / lang-shim.js / etc. for up to 10 minutes.
  // Using respondWith + fetch(cache:"no-store") guarantees the latest version.
  if (
    logicalPath === "loader.html" ||
    logicalPath === "sw.js" ||
    logicalPath === "index.html" ||
    logicalPath === "js/libs/pako_inflate.min.js" ||
    logicalPath === "js/libs/browser-shim.js" ||
    logicalPath === "js/libs/lang-shim.js" ||
    logicalPath === "mods.json" ||
    logicalPath === "favicon.ico" ||
    logicalPath === "img/mods.png"
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() =>
        fetch(event.request),
      ),
    );
    return;
  }

  event.respondWith(serveFromIDB(logicalPath, event.request));
});

async function serveFromIDB(logicalPath, request) {
  let db;
  try {
    db = await openDB();
  } catch {
    return fetch(request);
  }

  // Ensure we know the active mod (loads once from IDB on first request).
  await ensureActiveModLoaded(db);

  // 0a. Language data: serve the CLD as plain JSON.
  //     When a mod is active: load base CLD + mod language data -> merge.
  //     When no mod: serve from cache or encrypted CLD directly.
  if (logicalPath === "lang-data.json") {
    const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

    if (_activeMod) {
      // Mod active: try mod-specific lang data first.
      // Overhaul mods (TCOAAR etc.) have their own complete language data;
      // plugin mods may only override specific entries and need merging.
      const modData = await loadModLangData(db, _activeMod);
      if (modData) {
        const baseData = await loadBaseCLD(db);
        const result = baseData ? mergeLangData(baseData, modData) : modData;
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: jsonHeaders,
        });
      }
      // No mod lang data: fall through to base CLD below
    }

    // Serve base CLD (no mod, or mod without its own lang data)
    {
      const LANG_CACHE_KEY = "__lang_data__";
      const CLD_KEY = "data/9c7050ae76645487";

      const cached = await getAsset(db, LANG_CACHE_KEY);
      if (cached !== null && typeof cached === "string") {
        return new Response(cached, { status: 200, headers: jsonHeaders });
      }

      const cldRaw = await getAsset(db, CLD_KEY);
      if (cldRaw !== null) {
        const decrypted = dekit(cldRaw, CLD_KEY);
        const bytes = new Uint8Array(decrypted);
        const sig = new TextDecoder().decode(bytes.slice(0, 8));
        if (sig === "LANGDATA") {
          return new Response(bytes.slice(8), {
            status: 200,
            headers: jsonHeaders,
          });
        }
      }
    }

    console.warn(
      "[sw] lang-data.json: no data found, falling through to network",
    );
    return fetch(request);
  }

  // 0b. Available languages list: enumerate language directories from IDB keys.
  if (logicalPath === "languages-list.json") {
    const langs = await enumerateLanguages(db);
    if (langs.length > 0) {
      return new Response(JSON.stringify(langs), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    // No languages in IDB: fall through to network (server.js mode)
    return fetch(request);
  }

  // 0c. Synthetic DRM inject: assembled from plugin fragments in IDB.
  if (logicalPath === "js/drm-inject.js") {
    if (!_drmAttempted) {
      _drmAttempted = true;
      // Try a fresh build from the plugin fragment functions in IDB.
      const fresh = await buildDrmScript(db).catch(() => null);
      if (fresh) {
        _drmCache = fresh;
        // Persist to IDB so new SW instances (after reg.update()) can
        // fall back to this cache instead of returning 404.
        saveDrmToIdb(db, fresh).catch(() => {});
      } else {
        // Fresh build failed (e.g. new SW instance with empty in-memory
        // cache). Try the IDB-persisted payload from a previous build.
        _drmCache = await loadDrmFromIdb(db).catch(() => null);
      }
    }
    if (_drmCache) {
      return new Response(_drmCache, {
        status: 200,
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      });
    }
    // Fall through to network (server.js may serve it)
    return fetch(request);
  }

  // M. Active mod file priority.
  //    When a mod is loaded, check mod:ID:path keys in IDB before base game.
  //    Mirrors the base game lookup chain: direct -> extension-stripped -> hashed.
  if (_activeMod) {
    const modPrefix = "mod:" + _activeMod + ":";

    // M1. Direct path in mod
    const modDirect = await getAsset(db, modPrefix + logicalPath);
    if (modDirect !== null) {
      const decrypted = dekit(modDirect, logicalPath);
      return new Response(decrypted, {
        status: 200,
        headers: { "Content-Type": mimeFor(logicalPath) },
      });
    }

    // M2. Extension-stripped in mod
    const modNoExt = logicalPath.replace(/\.[^./]+$/, "");
    if (modNoExt !== logicalPath) {
      const modStripped = await getAsset(db, modPrefix + modNoExt);
      if (modStripped !== null) {
        const decrypted = dekit(modStripped, modNoExt);
        return new Response(decrypted, {
          status: 200,
          headers: { "Content-Type": mimeFor(logicalPath) },
        });
      }
    }

    // M3. Hashed path in mod
    const modHashed = await hashPath(logicalPath);
    const modEncrypted = await getAsset(db, modPrefix + modHashed);
    if (modEncrypted !== null) {
      const decrypted = dekit(modEncrypted, modHashed);
      return new Response(decrypted, {
        status: 200,
        headers: { "Content-Type": mimeFor(logicalPath) },
      });
    }
  }

  // 1. Direct path: engine JS, fonts, CSS, HTML, and any plain file the
  //    user stored under its original name. Also handles extension-less
  //    encrypted files (e.g. data/9c7050… the Lang data file) that are
  //    stored under their hashed disk name: dekit() is a no-op when the
  //    TCOAAL header is absent, so plain files are unaffected.
  const direct = await getAsset(db, logicalPath);
  if (direct !== null) {
    const decrypted = dekit(direct, logicalPath);
    return new Response(decrypted, {
      status: 200,
      headers: { "Content-Type": mimeFor(logicalPath) },
    });
  }

  // 2. Extension-stripped lookup.
  //    Plugins compute SHA-256 client-side and append the extension before
  //    fetching ("91b682859f543183.png"). Files in IDB are stored without
  //    extension ("91b682859f543183"). Strip and decrypt.
  const noExt = logicalPath.replace(/\.[^./]+$/, "");
  if (noExt !== logicalPath) {
    const stripped = await getAsset(db, noExt);
    if (stripped !== null) {
      const decrypted = dekit(stripped, noExt);
      return new Response(decrypted, {
        status: 200,
        headers: { "Content-Type": mimeFor(logicalPath) },
      });
    }
  }

  // 3. Canonical-path fallback: hash the full logical path.
  //    Catches any engine request not yet rewritten by plugins.
  const hashedPath = await hashPath(logicalPath);
  const encrypted = await getAsset(db, hashedPath);
  if (encrypted !== null) {
    const decrypted = dekit(encrypted, hashedPath);
    return new Response(decrypted, {
      status: 200,
      headers: { "Content-Type": mimeFor(logicalPath) },
    });
  }

  // 4. Extension-guessed fallback: the DRM payload requests extension-less
  //    logical paths (e.g. "data/Actors" instead of "data/Actors.json").
  //    Try appending common extensions, hash, and look up in IDB.
  if (!logicalPath.match(/\.[a-z0-9]+$/i)) {
    const GUESS = {
      data: [".json"],
      img: [".png"],
      audio: [".ogg", ".m4a"],
      movies: [".webm"],
    };
    const topDir = logicalPath.split("/")[0];
    const exts = GUESS[topDir];
    if (exts) {
      for (const ext of exts) {
        const withExt = logicalPath + ext;
        const gHash = await hashPath(withExt);
        const gAsset = await getAsset(db, gHash);
        if (gAsset !== null) {
          const decrypted = dekit(gAsset, gHash);
          return new Response(decrypted, {
            status: 200,
            headers: { "Content-Type": mimeFor(withExt) },
          });
        }
      }
    }
  }

  // 5. Not in IDB: fall through to network (server.js or static host).
  return fetch(request);
}

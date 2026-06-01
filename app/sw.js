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

// Protocol version. The page reads its own EXPECTED_SW_VERSION constant
// (defined in app/index.html) and auto-recovers if the controlling SW
// replies with a lower number, or doesn't reply at all (older SWs predate
// the "getVersion" handler). Bump BOTH this constant and EXPECTED_SW_VERSION
// together whenever shipping a SW change that needs existing users to drop
// their old installation: e.g. a fix to the fetch handler or a new IDB
// schema. Pure additive features (new message types the page can feature-
// detect) do not need a bump.
const SW_VERSION = 12;

// App-shell cache. Bump the version to invalidate previously cached shells
// on the next SW activation (e.g. when shipping a breaking change to one of
// the infra files). Game assets live in IndexedDB, NOT here.
const SHELL_CACHE = "tcoaal-shell-v1";

// Mod-asset cache: holds files fetched from /mods/{id}/www/{rel} for mods
// that the user has only BROWSED in the menu (not yet installed). Mainly
// icons. Once a mod is installed, its files live in IDB under "mod:{id}:..."
// and we serve from there directly. This cache exists to make the Mods
// menu fully functional offline after a single online viewing pass.
const MOD_ASSET_CACHE = "tcoaal-mod-assets-v1";

// The shell is everything required to boot the player when the network is
// unreachable. Game files are not listed: those are imported into IDB by the
// user via loader.html and served by serveFromIDB() below.
//
// sw.js itself is intentionally NOT in this list: the browser owns SW
// updates and must always see a fresh sw.js to install new code.
const APP_SHELL = [
  "/",
  "/index.html",
  "/loader.html",
  "/lock.html",
  "/lock.json",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon16.ico",
  "/img/bg.webp",
  "/img/mods.png",
  "/img/achievements.png",
  "/img/achievement-locked.jpg",
  "/img/achievement-unlocked.jpg",
  "/img/help.png",
  "/img/en.png",
  "/img/loading.png",
  "/img/tcoaal-steam-header.jpg",
  "/js/libs/pako_inflate.min.js",
  "/js/libs/browser-shim.js",
  "/js/libs/lang-shim.js",
  "/js/libs/achievements-shim.js",
  "/mods.json",
  "/expected-files.json",
];

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  // cache.add() per file (vs addAll) so one 404 or transient failure doesn't
  // abort the whole install: partial shells still buy the user offline boot.
  // cache: "reload" forces a fresh network fetch, bypassing the HTTP cache,
  // so we never persist a stale GitHub Pages copy into the SW cache.
  await Promise.all(
    APP_SHELL.map((url) =>
      cache
        .add(new Request(url, { cache: "reload" }))
        .catch((e) =>
          console.warn("[sw] precache failed for", url, e && e.message),
        ),
    ),
  );
}

// Built-in plugin mods. These ship with the app under /mods/_*/www/ and are
// never "installed" through the menu (Scene_Mods toggles them directly), so
// their files are not written to IDB by installMod(). Without precaching,
// an offline user who has never enabled them sees them in the menu but
// can't activate them: serveModAsset would hit the network and fail.
//
// We mirror the files listed in mods.json for each built-in entry. Keep
// this list in sync with mods.json when adding/removing built-in mods.
// Paths are routed through serveModAsset on fetch, which falls back to
// MOD_ASSET_CACHE when the network is unreachable.
const BUILTIN_MOD_ASSETS = [
  "/mods/_mouseControl/www/img/icon.png",
  "/mods/_mouseControl/www/js/plugins/MouseControl.js",
  "/mods/_virtualController/www/img/icon.png",
  "/mods/_virtualController/www/js/plugins/VirtualController.js",
  "/mods/_unlockAll/www/img/icon.png",
  "/mods/_unlockAll/www/js/plugins/UnlockAll.js",
  "/mods/_AnalogMove/www/img/icon.png",
  "/mods/_AnalogMove/www/js/plugins/SAN_AnalogMove.js",
  "/mods/_MessageBacklog/www/img/icon.png",
  "/mods/_MessageBacklog/www/js/plugins/YEP_X_MessageBacklog.js",
];

async function precacheBuiltinMods() {
  const cache = await caches.open(MOD_ASSET_CACHE);
  await Promise.all(
    BUILTIN_MOD_ASSETS.map((url) =>
      cache
        .add(new Request(url, { cache: "reload" }))
        .catch((e) =>
          console.warn("[sw] builtin precache failed for", url, e && e.message),
        ),
    ),
  );
}

// Local overhaul-mod thumbnails. Unlike the built-in plugins above, the
// same-origin overhaul mods (TCOAAR, TCOAAJ, TCOAALili, TLCOAAA, TDOAAL, ...)
// are git submodules whose icons are NOT precached. An offline user who only
// reaches the title screen online and opens the Mods menu later (offline) has
// never fetched those icons, so serveModAsset's network step fails and the
// menu shows the default sprite. Precache every same-origin mod icon listed
// in mods.json into MOD_ASSET_CACHE so the thumbnails survive an offline
// session, mirroring the built-in precache. Cross-origin icons (extras.
// tcoaal.app / translations.tcoaal.app) are skipped: the SW only intercepts
// same-origin requests, so those load via the browser's own HTTP cache.
async function precacheModIcons() {
  let data = null;
  try {
    const resp = await fetch(new Request("/mods.json", { cache: "reload" }));
    if (!resp || !resp.ok) return;
    data = await resp.json();
  } catch {
    return;
  }
  if (!data || typeof data !== "object") return;
  let cache = null;
  try {
    cache = await caches.open(MOD_ASSET_CACHE);
  } catch {
    return;
  }
  const seen = new Set();
  const tasks = [];
  for (const key of Object.keys(data)) {
    const entry = data[key];
    const icon = entry && entry.icon;
    // Same-origin local mod icons only: "mods/{id}/www/{rel}". The regex also
    // rejects absolute (http(s)://) and leading-slash paths.
    if (typeof icon !== "string" || !/^mods\/[^/]+\/www\//.test(icon)) continue;
    const reqUrl = "/" + icon;
    if (seen.has(reqUrl)) continue;
    seen.add(reqUrl);
    tasks.push(
      cache
        .add(new Request(reqUrl, { cache: "reload" }))
        .catch((e) =>
          console.warn(
            "[sw] mod icon precache failed for",
            reqUrl,
            e && e.message,
          ),
        ),
    );
  }
  await Promise.all(tasks);
}

async function cleanupOldShellCaches() {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter(
        (n) =>
          (n.startsWith("tcoaal-shell-") && n !== SHELL_CACHE) ||
          (n.startsWith("tcoaal-mod-assets-") && n !== MOD_ASSET_CACHE),
      )
      .map((n) => caches.delete(n)),
  );
}

/**
 * Serve a request for a /mods/{id}/www/{rel} asset.
 *
 *   1. If the mod is already installed, the file lives in IDB under
 *      "mod:{id}:{rel}": serve from there (no network, instant).
 *   2. Otherwise, network-first into MOD_ASSET_CACHE so the second visit
 *      and any offline visit thereafter find the file cached.
 *   3. On total failure, fall through to a plain fetch() so the browser
 *      surfaces its own error.
 *
 * `preferNetwork` (set for Mods-menu thumbnails, which carry a "?fresh="
 * marker) inverts step 1: the network copy wins so an updated mod's icon
 * shows without an uninstall/reinstall. The installed IDB copy and the
 * mod-asset cache still serve as offline fallbacks.
 */
async function serveModAsset(logicalPath, request, preferNetwork) {
  const m = logicalPath.match(/^mods\/([^/]+)\/www\/(.+)$/);
  if (!m) return fetch(request);
  const modId = m[1];
  const relPath = m[2];

  let db = null;
  try {
    db = await openDB();
  } catch {}

  // Resolve the installed IDB copy on demand. dekit is a no-op when the
  // TCOAAL header isn't present, so this is safe for plain PNGs/JSON shipped
  // by mod authors and still correct for overhaul mods that ship encrypted
  // assets.
  async function fromIdb() {
    if (!db) return null;
    const value = await getAsset(db, "mod:" + modId + ":" + relPath);
    if (value === null) return null;
    const buf =
      value instanceof ArrayBuffer
        ? value
        : value && value.buffer instanceof ArrayBuffer
          ? value.buffer
          : value;
    const decrypted = dekit(buf, relPath);
    return new Response(decrypted, {
      status: 200,
      headers: { "Content-Type": mimeFor(relPath) },
    });
  }

  if (!preferNetwork) {
    const idbResp = await fromIdb();
    if (idbResp) return idbResp;
  }

  let cache = null;
  try {
    cache = await caches.open(MOD_ASSET_CACHE);
  } catch {}

  try {
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh && fresh.ok && cache) {
      const clone = fresh.clone();
      cache.put(request, clone).catch(() => {});
    }
    return fresh;
  } catch (_) {
    if (cache) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
    }
    // Offline: a thumbnail skipped the IDB-first read above, so fall back to
    // the installed copy now rather than failing the request.
    if (preferNetwork) {
      const idbResp = await fromIdb();
      if (idbResp) return idbResp;
    }
    return fetch(request);
  }
}

// Menu icons we add on top of the base game (the Achievements, Mods and Help
// title-menu entries). A themed overhaul that re-skins the main menu can ship
// its own versions under www/img/system/<name>.png so our additions stay on
// theme. When such a mod is active and the engine requests one of our bundled
// icons, serveModIconOverride() resolves the mod's replacement instead.
const APP_ICON_MOD_OVERRIDES = {
  "img/achievements.png": "img/system/achievements.png",
  "img/mods.png": "img/system/mods.png",
  "img/help.png": "img/system/help.png",
};

// IDB-backed durable copies of critical shell JSON. SHELL_CACHE is keyed by
// SW_VERSION/SHELL_CACHE name and is wiped whenever cleanupOldShellCaches()
// runs, so a SW version bump while the user is offline (or a fresh install
// with precache failing) leaves the shell empty. These files are required
// for the mod system to function (sync XHR in lang-shim) and for the
// healthcheck in index.html, so we persist them to IDB on every successful
// network fetch and serve from IDB when both network and SHELL_CACHE miss.
// IDB lives in the shared "assets" store and survives SW updates.
const SHELL_IDB_FALLBACK_KEYS = {
  "mods.json": "__shell:mods.json__",
  "expected-files.json": "__shell:expected-files.json__",
};

async function persistShellJSONToIDB(idbKey, response) {
  try {
    const text = await response.clone().text();
    if (!text) return;
    const db = await openDB();
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
        tx.objectStore(STORE_NAME).put(text, idbKey);
      } catch (_) {
        resolve();
      }
    });
  } catch (_) {}
}

async function readShellJSONFromIDB(idbKey) {
  try {
    const db = await openDB();
    const value = await getAsset(db, idbKey);
    if (typeof value === "string" && value.length > 0) {
      return new Response(value, {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  } catch (_) {}
  return null;
}

/**
 * Network-first, cache-fallback strategy for app-shell files.
 *
 * When online: hit the network with cache:"no-store" so users always get the
 * latest infra after a deploy, then write the response into SHELL_CACHE so a
 * future offline boot can find it.
 *
 * When offline: serve the cached copy. If nothing is cached we fall through
 * to a final fetch() that will reject: the same failure mode users had
 * before this strategy was added.
 *
 * `cacheKey` lets us normalise "/" and "/index.html" to a single cache entry
 * so a boot from the bare origin still finds the cached index.
 *
 * `idbFallbackKey` enables a durable IDB-backed fallback for files that must
 * survive SHELL_CACHE invalidation (mods.json, expected-files.json). When set,
 * a successful network fetch also persists the body to IDB, and a cache miss
 * after a network failure falls back to the IDB copy before giving up.
 */
async function networkFirstWithShellFallback(
  request,
  cacheKey,
  idbFallbackKey,
) {
  try {
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh && fresh.ok) {
      const clone = fresh.clone();
      caches
        .open(SHELL_CACHE)
        .then((cache) => cache.put(cacheKey || request, clone))
        .catch(() => {});
      if (idbFallbackKey) {
        persistShellJSONToIDB(idbFallbackKey, fresh);
      }
    }
    return fresh;
  } catch (_) {
    const cache = await caches.open(SHELL_CACHE);
    // ignoreSearch: "/?offline=off" should still match cached "/".
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (cacheKey ? await cache.match(cacheKey, { ignoreSearch: true }) : null);
    if (cached) return cached;
    if (idbFallbackKey) {
      const idbResponse = await readShellJSONFromIDB(idbFallbackKey);
      if (idbResponse) return idbResponse;
    }
    // Last resort: let the browser surface its own network error. This
    // preserves the previous behaviour for files we never had a chance to
    // cache (e.g. user went offline before the first successful visit).
    return fetch(request);
  }
}

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

/**
 * Case-insensitive IDB lookup cache.
 * Maps lowercase IDB key -> actual IDB key for directories already scanned.
 * Populated lazily per directory prefix on first case-insensitive miss.
 */
const _ciCache = new Map();
const _ciScannedDirs = new Set();

/**
 * Scan all IDB keys under a directory prefix and populate the CI cache.
 * E.g. prefix "audio/se/" scans all keys starting with "audio/se/".
 * Also handles mod-prefixed keys like "mod:id:audio/se/".
 */
function _ciScanDir(db, dirPrefix) {
  if (_ciScannedDirs.has(dirPrefix)) return Promise.resolve();
  _ciScannedDirs.add(dirPrefix);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const range = IDBKeyRange.bound(
        dirPrefix,
        dirPrefix + "\uffff",
        false,
        false,
      );
      const req = tx.objectStore(STORE_NAME).openKeyCursor(range);
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          _ciCache.set(cursor.key.toLowerCase(), cursor.key);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Case-insensitive asset lookup. Falls back to scanning the key's directory
 * in IDB when the exact-case lookup returns null.
 */
async function getAssetCI(db, key) {
  // Try exact match first (fast path)
  const exact = await getAsset(db, key);
  if (exact !== null) return { value: exact, actualKey: key };

  // Determine the directory prefix to scan
  const lastSlash = key.lastIndexOf("/");
  const dirPrefix = lastSlash >= 0 ? key.substring(0, lastSlash + 1) : "";

  // Scan the directory if not yet cached
  await _ciScanDir(db, dirPrefix);

  // Look up by lowercase key
  const actualKey = _ciCache.get(key.toLowerCase());
  if (actualKey && actualKey !== key) {
    const val = await getAsset(db, actualKey);
    if (val !== null) return { value: val, actualKey };
  }

  return null;
}

/**
 * Serve one of our bundled menu icons from the active mod's img/system/
 * override when it ships one. Returns a Response when a themed replacement is
 * found, or null so the caller falls back to the app-shell icon. Mirrors the
 * active-mod lookup in serveFromIDB (case-insensitive direct key, dekit no-op
 * for plain PNGs, correct decrypt for TCOAAL-encrypted assets).
 */
async function serveModIconOverride(logicalPath) {
  const modRel = APP_ICON_MOD_OVERRIDES[logicalPath];
  if (!modRel) return null;
  let db;
  try {
    db = await openDB();
  } catch {
    return null;
  }
  await ensureActiveModLoaded(db);
  await ensureActiveLangLoaded(db);
  // Active language overlay wins over the overhaul, mirroring asset priority.
  for (const overlayId of [_activeLang, _activeMod]) {
    if (!overlayId) continue;
    const modPrefix = "mod:" + overlayId + ":";
    const hit = await getAssetCI(db, modPrefix + modRel);
    if (hit === null) continue;
    const keyForDecrypt = hit.actualKey.substring(modPrefix.length);
    const decrypted = dekit(hit.value, keyForDecrypt);
    return new Response(decrypted, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  }
  return null;
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

// Language data merging for mod support

/**
 * Merge base and mod language data objects into a CLD that satisfies every
 * known Lang.isValid variant.
 *
 * Different DRM payloads across mods require different newData() shapes:
 *   - Base zlib DRM: { langName, langInfo, fontFace, fontSize, fontFile,
 *                       imgFiles, sysLabel, sysMenus, labelLUT, linesLUT }
 *   - TCOAALili DRM: { langName, langInfo, fontFace, fontSize,
 *                       sysLabel, sysMenus, labelLUT, linesLUT, imageLUT }
 *
 * isValid checks `key in data` for every newData key plus type parity, so the
 * merged output must include the UNION of both shapes. Extra fields are
 * harmless (isValid iterates its own template, not the input). Missing fields
 * cause loadCLD to throw, which makes Lang.select hit the "Default language
 * missing" crash path with ConfigManager.language = ''.
 */
function mergeLangData(base, mod) {
  const result = Object.assign({}, base || {});

  // Dict fields present in any DRM variant. Base entries stay as fallbacks,
  // mod entries win on the same key.
  const dictFields = [
    "labelLUT",
    "linesLUT",
    "sysMenus",
    "sysLabel",
    "imgFiles", // base zlib DRM
    "imageLUT", // TCOAALili-style DRM
  ];
  for (const f of dictFields) {
    result[f] = Object.assign(
      {},
      (base && base[f]) || {},
      (mod && mod[f]) || {},
    );
  }

  if (mod) {
    // NOTE: langVers is intentionally excluded. The DRM uses langVers as a
    // version/signature of the base CLD; a mod CLD claiming a different
    // version breaks loadCLD's validation. Keep the base's langVers.
    const scalars = [
      "langName",
      "langInfo",
      "fontFace",
      "fontSize",
      "fontFile",
    ];
    for (const s of scalars) {
      if (mod[s] !== undefined && mod[s] !== null && mod[s] !== "") {
        result[s] = mod[s];
      }
    }
  }

  // Guarantee every required scalar is present so isValid's `key in data` and
  // typeof checks pass even when base is null or partially populated. These
  // defaults match newData()'s zero values across both DRM variants.
  if (typeof result.langName !== "string" || !result.langName.trim()) {
    result.langName = "English";
  }
  if (!Array.isArray(result.langInfo) || result.langInfo.length < 3) {
    result.langInfo = ["", "", ""];
  }
  if (typeof result.fontFace !== "string" || !result.fontFace.trim()) {
    result.fontFace = "GameFont";
  }
  if (typeof result.fontSize !== "number" || result.fontSize < 1) {
    result.fontSize = 28;
  }
  if (!("fontFile" in result)) result.fontFile = null;

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

// Offline-cache kill switch.
//
// The shell cache is generally an improvement (offline boot, faster repeat
// visits) but it adds a new failure mode: a poisoned cache entry could keep
// serving a broken file even after a fix is deployed. The page can flip this
// off via postMessage({type:"setOfflineEnabled", enabled:false}): typically
// driven by the user visiting "/?offline=off" or running a console helper
// (see app/index.html). When disabled, the SW reverts to its pre-offline
// behaviour: no precache, no fallback, no cache writes; and we wipe whatever
// was already in SHELL_CACHE so nothing stale can leak through.
const OFFLINE_FLAG_KEY = "__offline_disabled__";
let _offlineDisabled = false;
let _offlineDisabledLoadPromise = null;

// Belt-and-suspenders revalidation throttle. The per-request network-first
// strategy refreshes files the current page loads; this complements it by
// re-fetching the entire APP_SHELL after a successful online boot so files
// the page didn't touch (loader.html, lock.html, bg.webp, ...) still pick
// up new deploys quickly. Five minutes is short enough to land hotfixes in
// one play session, long enough that mashed reloads don't refetch ~2 MB.
const SHELL_REVALIDATE_THROTTLE_MS = 5 * 60 * 1000;
let _lastShellRevalidateAt = 0;

function ensureOfflineFlagLoaded(db) {
  if (_offlineDisabledLoadPromise) return _offlineDisabledLoadPromise;
  _offlineDisabledLoadPromise = (async () => {
    try {
      const val = await getAsset(db, OFFLINE_FLAG_KEY);
      _offlineDisabled = val === true || val === 1 || val === "1";
    } catch {}
  })();
  return _offlineDisabledLoadPromise;
}

async function setOfflineDisabledPersist(disabled) {
  _offlineDisabled = !!disabled;
  _offlineDisabledLoadPromise = Promise.resolve();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    if (_offlineDisabled) {
      tx.objectStore(STORE_NAME).put(true, OFFLINE_FLAG_KEY);
    } else {
      tx.objectStore(STORE_NAME).delete(OFFLINE_FLAG_KEY);
    }
  } catch {}
  if (_offlineDisabled) {
    // Wipe everything so a flipped-off kill switch immediately stops
    // serving cached infra files.
    try {
      await caches.delete(SHELL_CACHE);
    } catch {}
  }
}

// Lifecycle

self.addEventListener("install", (e) =>
  e.waitUntil(
    (async () => {
      // Best-effort, time-boxed: a failing or slow precache must never
      // block the SW update. If we let install reject, the browser
      // surfaces "unknown error fetching the script" and the previous SW
      // stays in place forever: a self-trapping bug. And if install takes
      // longer than the page's controllerchange wait (~3 s) the page boots
      // without a controller and game-asset requests 404 against the
      // static host. So we cap how long we'll wait for precache here and
      // let any remaining fetches finish in the background: pending
      // fetches extend SW lifetime past install on their own.
      try {
        const db = await openDB();
        await ensureOfflineFlagLoaded(db);
      } catch {}
      if (!_offlineDisabled) {
        // Run shell + built-in mod precache concurrently; the timeout caps
        // total install time so a slow network can't block the new SW.
        // Files that haven't landed by the timeout keep fetching in the
        // background (pending fetches extend SW lifetime past install).
        await Promise.race([
          Promise.all([
            precacheShell().catch((err) =>
              console.warn("[sw] precacheShell failed:", err && err.message),
            ),
            precacheBuiltinMods().catch((err) =>
              console.warn(
                "[sw] precacheBuiltinMods failed:",
                err && err.message,
              ),
            ),
            precacheModIcons().catch((err) =>
              console.warn("[sw] precacheModIcons failed:", err && err.message),
            ),
          ]),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      }
      try {
        await self.skipWaiting();
      } catch {}
    })(),
  ),
);

self.addEventListener("activate", (e) =>
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanupOldShellCaches(),
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
let _activeModLoadPromise = null;

// Active language (translation) overlay. Independent of _activeMod: a
// translation layers ON TOP of the active context (base game OR an overhaul
// mod). Value is a translation mod key ("translation_<MOD>_<lang>") or null
// (English / the context's original text). Persisted in IDB ('__active_lang__')
// so it survives SW restarts.
let _activeLang = null;
let _activeLangLoadPromise = null;

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  // Version handshake. The page sends this on boot and compares the reply
  // against its own EXPECTED_SW_VERSION constant. Old SW versions either
  // don't have this handler (no reply -> page treats as stale and recovers)
  // or reply with a lower SW_VERSION (page recovers explicitly). Replies
  // include shellCache for diagnostics.
  if (data.type === "getVersion") {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        ok: true,
        version: SW_VERSION,
        shellCache: SHELL_CACHE,
      });
    }
    return;
  }

  // Manual skipWaiting hook for the common PWA "new SW is waiting, take
  // over now" prompt. Install already calls skipWaiting on its own, so
  // this is just a backup channel.
  if (data.type === "skipWaiting") {
    try {
      self.skipWaiting();
    } catch {}
    return;
  }

  if (data.type === "setActiveMod") {
    _activeMod = data.id || null;
    // Mark as resolved so parallel fetches skip the IDB read.
    _activeModLoadPromise = Promise.resolve();
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
    return;
  }

  if (data.type === "setActiveLang") {
    _activeLang = data.id || null;
    _activeLangLoadPromise = Promise.resolve();
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        if (_activeLang) {
          tx.objectStore(STORE_NAME).put(_activeLang, "__active_lang__");
        } else {
          tx.objectStore(STORE_NAME).delete("__active_lang__");
        }
      })
      .catch(() => {});
    return;
  }

  if (data.type === "setOfflineEnabled") {
    const disabled = data.enabled === false;
    const ack = setOfflineDisabledPersist(disabled).then(async () => {
      if (!disabled) {
        // Re-enabling: warm both shell + built-in mod caches so the next
        // offline boot works.
        try {
          await Promise.all([
            precacheShell(),
            precacheBuiltinMods(),
            precacheModIcons(),
          ]);
        } catch {}
      }
    });
    if (event.ports && event.ports[0]) {
      ack.then(() => event.ports[0].postMessage({ ok: true, disabled }));
    }
    return;
  }

  if (data.type === "clearShellCache") {
    const ack = caches.delete(SHELL_CACHE).catch(() => false);
    if (event.ports && event.ports[0]) {
      ack.then((ok) => event.ports[0].postMessage({ ok: !!ok }));
    }
    return;
  }

  if (data.type === "revalidateShell") {
    // Belt-and-suspenders refresh: the per-request network-first strategy
    // only refreshes files the current page actually loads. Files the page
    // never touches (e.g. loader.html if the user is on index.html) can
    // stay stale in the cache between SW updates. This message re-fetches
    // the full APP_SHELL with cache:"reload" so a bad deploy can't linger
    // for more than one online visit.
    //
    // Throttled to avoid wasting bandwidth on every navigation. The page
    // only sends this after a successful boot; the throttle keeps rapid
    // reloads from re-pulling ~2 MB of shell on each one.
    if (_offlineDisabled) return;
    const force = data.force === true;
    const now = Date.now();
    if (!force && now - _lastShellRevalidateAt < SHELL_REVALIDATE_THROTTLE_MS) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ ok: true, skipped: "throttled" });
      }
      return;
    }
    _lastShellRevalidateAt = now;
    const ack = Promise.all([
      precacheShell().catch(() => {}),
      precacheBuiltinMods().catch(() => {}),
      precacheModIcons().catch(() => {}),
    ]);
    if (event.ports && event.ports[0]) {
      ack.then(() => event.ports[0].postMessage({ ok: true }));
    }
    return;
  }
});

/**
 * Load the active mod from IDB (once, on first request).
 * Returns a shared promise so concurrent fetches all await the same read
 * and see the resolved _activeMod: without this, fetch B can see an
 * in-flight "loaded" flag but still read null, skipping mod lookups.
 */
function ensureActiveModLoaded(db) {
  if (_activeModLoadPromise) return _activeModLoadPromise;
  _activeModLoadPromise = (async () => {
    try {
      const val = await getAsset(db, "__active_mod__");
      if (val && typeof val === "string") _activeMod = val;
    } catch {}
  })();
  return _activeModLoadPromise;
}

/** Load the active language overlay from IDB (once, on first request). */
function ensureActiveLangLoaded(db) {
  if (_activeLangLoadPromise) return _activeLangLoadPromise;
  _activeLangLoadPromise = (async () => {
    try {
      const val = await getAsset(db, "__active_lang__");
      if (val && typeof val === "string") _activeLang = val;
    } catch {}
  })();
  return _activeLangLoadPromise;
}

/**
 * Resolve a logical asset path from one overlay store (keys
 * "mod:<modId>:<rel>") used for both overhaul mods and translation overlays.
 * Returns a Response on hit, or null to fall through to the next overlay /
 * the base game. Mirrors the base game lookup chain:
 *   direct (CI) -> extension-stripped (CI) -> hashed -> hashed+ext -> media-guess.
 */
async function tryModOverlay(db, modId, logicalPath) {
  const modPrefix = "mod:" + modId + ":";

  // M1. Direct path (case-insensitive: mod files may have different casing
  //     than what the engine requests, e.g. Windows-authored mods).
  const modDirectCI = await getAssetCI(db, modPrefix + logicalPath);
  if (modDirectCI !== null) {
    const keyForDecrypt = modDirectCI.actualKey.substring(modPrefix.length);
    const decrypted = dekit(modDirectCI.value, keyForDecrypt);
    return new Response(decrypted, {
      status: 200,
      headers: { "Content-Type": mimeFor(logicalPath) },
    });
  }

  // M2. Extension-stripped (case-insensitive).
  const modNoExt = logicalPath.replace(/\.[^./]+$/, "");
  if (modNoExt !== logicalPath) {
    const modStrippedCI = await getAssetCI(db, modPrefix + modNoExt);
    if (modStrippedCI !== null) {
      const keyForDecrypt = modStrippedCI.actualKey.substring(modPrefix.length);
      const decrypted = dekit(modStrippedCI.value, keyForDecrypt);
      return new Response(decrypted, {
        status: 200,
        headers: { "Content-Type": mimeFor(logicalPath) },
      });
    }
  }

  // M3. Hashed path.
  const modHashed = await hashPath(logicalPath);
  const modEncrypted = await getAsset(db, modPrefix + modHashed);
  if (modEncrypted !== null) {
    const decrypted = dekit(modEncrypted, modHashed);
    return new Response(decrypted, {
      status: 200,
      headers: { "Content-Type": mimeFor(logicalPath) },
    });
  }

  // M3b. Hashed path preserving the logical extension. Translation mods ship
  //      files at "img/pictures/<hash>.png" rather than the base game's
  //      extension-less layout, so keys look like "mod:ID:img/pictures/<hash>.png".
  const extMatch = logicalPath.match(/\.[^./]+$/);
  if (extMatch) {
    const modHashedExt = await getAsset(
      db,
      modPrefix + modHashed + extMatch[0],
    );
    if (modHashedExt !== null) {
      const decrypted = dekit(modHashedExt, modHashed);
      return new Response(decrypted, {
        status: 200,
        headers: { "Content-Type": mimeFor(logicalPath) },
      });
    }
  }

  // M4. Pre-hashed extension-less media path override. When the base game's
  //     DRM has already resolved a logical path to its disk-hashed form (e.g.
  //     "img/pictures/057974b069d30654"), the engine requests it without an
  //     extension. Translation mods ship the replacement as the same hashed
  //     name with a real image extension (mod PNGs are not TCOAAL-encrypted).
  //     Scoped to media top-dirs only (img/audio/movies) to avoid interfering
  //     with data/ CLD lookups.
  if (!extMatch) {
    const MOD_EXT_GUESS = {
      img: [".png", ".jpg"],
      audio: [".ogg", ".m4a"],
      movies: [".webm", ".mp4"],
    };
    const modTopDir = logicalPath.split("/")[0];
    const modExts = MOD_EXT_GUESS[modTopDir];
    if (modExts) {
      for (const ext of modExts) {
        const modGuess = await getAsset(db, modPrefix + logicalPath + ext);
        if (modGuess !== null) {
          const decrypted = dekit(modGuess, logicalPath);
          return new Response(decrypted, {
            status: 200,
            headers: { "Content-Type": mimeFor(logicalPath + ext) },
          });
        }
      }
    }
  }

  return null;
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

  // sw.js: do NOT intercept. The browser performs SW update fetches with
  // service-workers mode "none", but in practice some browsers still route
  // them through the active SW, and a response served via respondWith() can
  // be flagged as "fetched through SW": which the SW update algorithm then
  // rejects with "An unknown error occurred when fetching the script",
  // bricking all future updates. Letting the request bypass the SW
  // entirely means update fetches go straight to the network, which is what
  // the spec wants anyway. The browser has its own freshness check (max 24h
  // by spec, often shorter) so the file stays current independently of HTTP
  // cache headers.
  if (logicalPath === "sw.js") return;

  // "Now Loading" image: the engine always requests the canonical
  // img/system/Loading.png (Graphics.setLoadingImage in rpg_managers.js),
  // which would normally resolve to the hashed+encrypted base-game asset.
  // Always swap in our bundled themed loading.png instead, served from the
  // precached app shell so it works offline and never flashes the original.
  if (logicalPath === "img/system/Loading.png") {
    event.respondWith(
      (async () => {
        const bundled = new Request("/img/loading.png");
        const cached = await caches.match(bundled);
        if (cached) return cached;
        try {
          return await fetch(bundled, { cache: "force-cache" });
        } catch {
          return fetch(event.request);
        }
      })(),
    );
    return;
  }

  if (
    logicalPath === "loader.html" ||
    logicalPath === "index.html" ||
    logicalPath === "migrate.html" ||
    logicalPath === "lock.html" ||
    logicalPath === "lock.json" ||
    logicalPath === "test.html" ||
    logicalPath === "manifest.webmanifest" ||
    logicalPath === "js/libs/pako_inflate.min.js" ||
    logicalPath === "js/libs/browser-shim.js" ||
    logicalPath === "js/libs/lang-shim.js" ||
    logicalPath === "js/libs/achievements-shim.js" ||
    logicalPath === "mods.json" ||
    logicalPath === "expected-files.json" ||
    logicalPath === "favicon.ico" ||
    logicalPath === "favicon16.ico" ||
    logicalPath === "img/mods.png" ||
    logicalPath === "img/bg.webp" ||
    logicalPath === "img/achievements.png" ||
    logicalPath === "img/achievement-locked.jpg" ||
    logicalPath === "img/achievement-unlocked.jpg" ||
    logicalPath === "img/help.png" ||
    logicalPath === "img/en.png" ||
    logicalPath === "img/loading.png" ||
    logicalPath === "img/tcoaal-steam-header.jpg"
  ) {
    // Normalise "/" -> "/index.html" for cache lookups so a boot from the
    // bare origin finds the same cached entry the SW pre-populated.
    const cacheKey =
      logicalPath === "index.html" ? new Request("/") : event.request;
    const idbFallbackKey = SHELL_IDB_FALLBACK_KEYS[logicalPath] || null;
    event.respondWith(
      (async () => {
        // Active-mod themed override for our menu icons (achievements/mods/
        // help): a mod shipping img/system/<name>.png keeps the added title
        // entries on-theme. No-op (returns null) for every other shell path.
        const iconOverride = await serveModIconOverride(logicalPath);
        if (iconOverride) return iconOverride;

        // Lazy-load the kill switch so the first request after a SW restart
        // gets the right behaviour. Falls back to "enabled" if IDB is down.
        try {
          const db = await openDB();
          await ensureOfflineFlagLoaded(db);
        } catch {}
        if (_offlineDisabled) {
          return fetch(event.request, { cache: "no-store" }).catch(() =>
            fetch(event.request),
          );
        }
        return networkFirstWithShellFallback(
          event.request,
          cacheKey,
          idbFallbackKey,
        );
      })(),
    );
    return;
  }

  // Mod-asset paths: /mods/{id}/www/{rel}. Handled by a dedicated strategy
  // (IDB for installed mods, MOD_ASSET_CACHE for already-browsed ones, then
  // network) so the Mods menu's icons survive an offline session.
  if (/^mods\/[^/]+\/www\//.test(logicalPath)) {
    // Thumbnails tagged "?fresh=" prefer the network so an updated mod's icon
    // appears without the user having to uninstall/reinstall it.
    const preferNetwork = url.searchParams.has("fresh");
    event.respondWith(serveModAsset(logicalPath, event.request, preferNetwork));
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

  // Ensure we know the active mod + language (loads once from IDB).
  await ensureActiveModLoaded(db);
  await ensureActiveLangLoaded(db);

  // 0a. Language data: serve the CLD as plain JSON.
  //     Layered merge, lowest first: base CLD -> overhaul mod lang data ->
  //     active-language (translation) lang data. The translation thus wins
  //     over the overhaul's own text, which wins over the base game.
  //     When neither overlay supplies lang data: serve the base CLD directly.
  if (logicalPath === "lang-data.json") {
    const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

    const overhaulData = _activeMod
      ? await loadModLangData(db, _activeMod)
      : null;
    const langData = _activeLang
      ? await loadModLangData(db, _activeLang)
      : null;

    if (overhaulData || langData) {
      let result = await loadBaseCLD(db);
      // Overhaul mods (TCOAAR etc.) ship complete language data; plugin mods
      // may override only specific entries. Either way merge over the base so
      // required CLD fields are always present.
      if (overhaulData) {
        result = result ? mergeLangData(result, overhaulData) : overhaulData;
      }
      if (langData) {
        result = result ? mergeLangData(result, langData) : langData;
      }
      if (result) {
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: jsonHeaders,
        });
      }
      // No base + no overlay data: fall through to base CLD path below.
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

  // M. Overlay priority. Two overlays sit above the base game, highest first:
  //      1. the active language (translation): "mod:<translation>:..."
  //      2. the active overhaul mod             : "mod:<modId>:..."
  //    A translation thus wins over the overhaul it sits on, which wins over
  //    the base game. tryModOverlay mirrors the base game lookup chain.
  for (const overlayId of [_activeLang, _activeMod]) {
    if (!overlayId) continue;
    const overlayResp = await tryModOverlay(db, overlayId, logicalPath);
    if (overlayResp) return overlayResp;
  }

  // 1. Direct path (case-insensitive): engine JS, fonts, CSS, HTML, and any
  //    plain file the user stored under its original name. Also handles
  //    extension-less encrypted files (e.g. data/9c7050... the Lang data file)
  //    that are stored under their hashed disk name: dekit() is a no-op when
  //    the TCOAAL header is absent, so plain files are unaffected.
  const directCI = await getAssetCI(db, logicalPath);
  if (directCI !== null) {
    const decrypted = dekit(directCI.value, directCI.actualKey);
    return new Response(decrypted, {
      status: 200,
      headers: { "Content-Type": mimeFor(logicalPath) },
    });
  }

  // 2. Extension-stripped lookup (case-insensitive).
  //    Plugins compute SHA-256 client-side and append the extension before
  //    fetching ("91b682859f543183.png"). Files in IDB are stored without
  //    extension ("91b682859f543183"). Strip and decrypt.
  const noExt = logicalPath.replace(/\.[^./]+$/, "");
  if (noExt !== logicalPath) {
    const strippedCI = await getAssetCI(db, noExt);
    if (strippedCI !== null) {
      const decrypted = dekit(strippedCI.value, strippedCI.actualKey);
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
  //    Try appending common extensions and look the file up two ways: under
  //    its plain logical name (a decrypted game dump stores "data/Actors.json"
  //    directly; dekit() no-ops on plain content) and under its hashed name
  //    (an encrypted install).
  if (!logicalPath.match(/\.[a-z0-9]+$/i)) {
    const GUESS = {
      data: [".json"],
      img: [".png", ".jpg"],
      audio: [".ogg", ".m4a"],
      movies: [".webm"],
    };
    const topDir = logicalPath.split("/")[0];
    const exts = GUESS[topDir];
    if (exts) {
      for (const ext of exts) {
        const withExt = logicalPath + ext;

        // 4a. Plain logical file (decrypted dump).
        const directExt = await getAssetCI(db, withExt);
        if (directExt !== null) {
          return new Response(dekit(directExt.value, directExt.actualKey), {
            status: 200,
            headers: { "Content-Type": mimeFor(withExt) },
          });
        }

        // 4b. Hashed + encrypted form.
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

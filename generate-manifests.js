#!/usr/bin/env node
/**
 * generate-manifests.js
 *
 * Walks each mod directory under mods/ and writes the file lists directly
 * into mods.json (as "version" and "files" fields on each mod entry).
 *
 * - Mods in folders starting with '_' get type prefixed with "built-in"
 *   and author defaults to "kidev".
 * - Non-_ mods with a "repo" field get author and lastUpdate fetched from
 *   the GitHub API.
 *
 * Usage: node generate-manifests.js
 */

"use strict";

var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var https = require("https");

var MODS_JSON = path.join(__dirname, "mods.json");
var MODS_DIR = path.join(__dirname, "mods");

var TRANSLATIONS_BASE = "https://translations.tcoaal.app/translations";
var TRANSLATIONS_LANGS_URL = TRANSLATIONS_BASE + "/langs.txt";
var TRANSLATION_AUTHOR = "TCOAAL Translation Project";

// Remote-hosted overhaul mods. Mirrors the translations source: a flat
// listing file (mods.txt, one folder per line) discovers the published mod
// folders, each of which exposes its content under "<folder>/www/...". Unlike
// translations there is no per-folder manifest.json on the server, so the file
// list is enumerated from a local working copy under mods/<folder>/www (the
// extras content is not committed/deployed with this repo: see README).
var EXTRAS_BASE = "https://extras.tcoaal.app/mods";
var EXTRAS_MODS_URL = EXTRAS_BASE + "/mods.txt";

/** True when path is an absolute http(s) URL (remote-hosted mods). */
function isRemotePath(p) {
  return typeof p === "string" && /^https?:\/\//i.test(p);
}

function walkDir(dir, base) {
  var results = [];
  var entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }
  for (var i = 0; i < entries.length; i++) {
    var full = path.join(dir, entries[i]);
    var rel = path.join(base, entries[i]).replace(/\\/g, "/");
    var stat;
    try {
      stat = fs.statSync(full);
    } catch (e) {
      continue;
    }
    if (stat.isDirectory()) {
      results = results.concat(walkDir(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

/**
 * Detect the DRM / game-code delivery type for a mod.
 *
 * Returns one of:
 *   "zlib"    Original DRM: _() assembles base64 fragments, zlib-decompresses,
 *               injects as <script>. browser-shim.js intercepts inflateSync.
 *   "script"  Deobfuscated: _() loads a separate JS file (e.g. deobfuscated.js)
 *               via document.createElement('script').
 *   "direct"  Game code shipped as a regular plugin file (e.g. GameCode.js).
 *               Loaded by PluginManager like any other plugin.
 *   "none"    No DRM payload. Standard RPG Maker MV without custom game code
 *               layer. _() may be called but is undefined (no-op fallback).
 */
function detectDrmType(wwwDir) {
  var pluginsDir = path.join(wwwDir, "js", "plugins");
  var pluginsJs = path.join(wwwDir, "js", "plugins.js");

  // Check if GameCode.js exists as a registered plugin
  if (fs.existsSync(path.join(pluginsDir, "GameCode.js"))) {
    try {
      var pjs = fs.readFileSync(pluginsJs, "utf8");
      if (/["']GameCode["']/.test(pjs)) return "direct";
    } catch (e) {}
  }

  // Check if deobfuscated.js exists (loaded by _() via script tag)
  if (fs.existsSync(path.join(pluginsDir, "deobfuscated.js"))) {
    return "script";
  }

  // Check for zlib DRM pattern: a plugin file containing the _() assembler
  // with base64/inflate patterns, or OrangeEventHitboxes.js with embedded
  // compressed payload (>30KB).
  var pluginFiles;
  try {
    pluginFiles = fs.readdirSync(pluginsDir);
  } catch (e) {
    return "none";
  }

  for (var i = 0; i < pluginFiles.length; i++) {
    var pf = pluginFiles[i];
    if (!pf.endsWith(".js")) continue;
    var pfPath = path.join(pluginsDir, pf);
    var stat;
    try {
      stat = fs.statSync(pfPath);
    } catch (e) {
      continue;
    }

    // Large OrangeEventHitboxes.js (>20KB) = embedded zlib DRM payload
    if (pf === "OrangeEventHitboxes.js" && stat.size > 20000) {
      return "zlib";
    }

    // Check YEP_RegionRestrictions.js for the base game DRM assembler
    if (pf === "YEP_RegionRestrictions.js" && stat.size > 20000) {
      try {
        var content = fs.readFileSync(pfPath, "utf8");
        if (
          content.indexOf("decompressFromBase64") >= 0 ||
          content.indexOf("inflateSync") >= 0
        ) {
          return "zlib";
        }
      } catch (e) {}
    }
  }

  return "none";
}

function getModVersion(modDir) {
  var pkgPath = path.join(modDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      var pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.version) return pkg.version;
    } catch (e) {}
  }
  try {
    var ver = cp
      .execSync("git describe --tags --always 2>/dev/null", {
        cwd: modDir,
        encoding: "utf8",
      })
      .trim();
    if (ver) return ver;
  } catch (e) {}
  return "";
}

/** Parse "https://github.com/owner/repo" -> { owner, repo } or null. */
function parseGithubUrl(url) {
  var m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

/** Fetch JSON from a GitHub API endpoint. */
function ghApiFetch(apiPath) {
  return new Promise(function (resolve) {
    var options = {
      hostname: "api.github.com",
      path: apiPath,
      headers: { "User-Agent": "TCOAAL-Mods" },
    };
    https
      .get(options, function (res) {
        var body = "";
        res.on("data", function (c) {
          body += c;
        });
        res.on("end", function () {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(null);
          }
        });
      })
      .on("error", function () {
        resolve(null);
      });
  });
}

/** Fetch a URL as text. Resolves to null on non-2xx or network error. */
function httpGetText(url) {
  return new Promise(function (resolve) {
    https
      .get(url, { headers: { "User-Agent": "TCOAAL-Mods" } }, function (res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          resolve(null);
          return;
        }
        var body = "";
        res.setEncoding("utf8");
        res.on("data", function (c) {
          body += c;
        });
        res.on("end", function () {
          resolve(body);
        });
      })
      .on("error", function () {
        resolve(null);
      });
  });
}

/** HEAD request; resolves to the Last-Modified header as YYYY-MM-DD or null. */
function httpHeadLastModified(url) {
  return new Promise(function (resolve) {
    var u;
    try {
      u = new URL(url);
    } catch (_) {
      resolve(null);
      return;
    }
    var options = {
      method: "HEAD",
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { "User-Agent": "TCOAAL-Mods" },
    };
    var req = https.request(options, function (res) {
      res.resume();
      var lm = res.headers["last-modified"];
      if (!lm) {
        resolve(null);
        return;
      }
      var d = new Date(lm);
      if (isNaN(d.getTime())) {
        resolve(null);
        return;
      }
      resolve(d.toISOString().substring(0, 10));
    });
    req.on("error", function () {
      resolve(null);
    });
    req.end();
  });
}

/** Title-case a language slug: "french" -> "French", "brazilian_pt" -> "Brazilian Pt". */
function titleCaseLang(slug) {
  return slug
    .split(/[_\s-]+/)
    .map(function (w) {
      return w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    })
    .join(" ");
}

/**
 * Fetch the translations index and each language's manifest.json.
 * Writes translation mod entries into modsData keyed as "translation_<lang>".
 * Existing entries for other mod types are left untouched.
 */
async function syncTranslations(modsData) {
  console.log("[translations] Fetching " + TRANSLATIONS_LANGS_URL);
  var langsTxt = await httpGetText(TRANSLATIONS_LANGS_URL);
  if (!langsTxt) {
    console.warn("[translations] Failed to fetch langs.txt");
    return 0;
  }
  var langs = langsTxt
    .split(/\r?\n/)
    .map(function (s) {
      return s.trim();
    })
    .filter(function (s) {
      return s.length > 0 && !/^#/.test(s);
    });

  if (langs.length === 0) {
    console.warn("[translations] langs.txt is empty");
    return 0;
  }

  // Prune stale translation entries that no longer appear in langs.txt.
  var wantKeys = {};
  for (var i = 0; i < langs.length; i++) {
    wantKeys["translation_" + langs[i]] = true;
  }
  var existingKeys = Object.keys(modsData);
  for (var k = 0; k < existingKeys.length; k++) {
    var key = existingKeys[k];
    var entry = modsData[key];
    if (
      key.indexOf("translation_") === 0 &&
      entry &&
      entry.type === "translation" &&
      !wantKeys[key]
    ) {
      console.log("[translations] Removing stale entry: " + key);
      delete modsData[key];
    }
  }

  var count = 0;
  for (var j = 0; j < langs.length; j++) {
    var lang = langs[j];
    var modId = "translation_" + lang;
    var baseUrl = TRANSLATIONS_BASE + "/" + lang;
    var manifestUrl = baseUrl + "/manifest.json";

    console.log("[translations] " + lang + ": fetching manifest");
    var manifestText = await httpGetText(manifestUrl);
    if (!manifestText) {
      console.warn("[translations] " + lang + ": manifest.json unreachable");
      continue;
    }
    var manifest;
    try {
      manifest = JSON.parse(manifestText);
    } catch (e) {
      console.warn("[translations] " + lang + ": invalid manifest.json");
      continue;
    }
    var files = Array.isArray(manifest.files) ? manifest.files.slice() : [];
    if (files.length === 0) {
      console.warn("[translations] " + lang + ": manifest has no files");
      continue;
    }

    var lastUpdate = await httpHeadLastModified(manifestUrl);

    var existing = modsData[modId] || {};
    var displayName = manifest.name || titleCaseLang(lang);
    // Preserve a curated description already in mods.json (e.g. the endonym
    // "한국어" / "日本語") over whatever the remote manifest supplies: the
    // remote default is a generic "<Lang> translation" string that would
    // clobber hand-picked values on every regeneration.
    var description =
      existing.description ||
      manifest.description ||
      titleCaseLang(lang) + " translation";
    var author = manifest.author || existing.author || TRANSLATION_AUTHOR;

    // Pick the dialogue source file actually shipped in the manifest.
    // .csv and .txt are both supported by lang-shim's parser.
    var langFile = null;
    if (files.indexOf("dialogue.csv") >= 0) langFile = "dialogue.csv";
    else if (files.indexOf("dialogue.txt") >= 0) langFile = "dialogue.txt";
    if (!langFile) {
      console.warn(
        "[translations] " +
          lang +
          ": no dialogue.csv/.txt in manifest; text will not translate",
      );
    }

    modsData[modId] = {
      name: displayName,
      icon: baseUrl + "/icon.png",
      author: author,
      lastUpdate: existing.lastUpdate || lastUpdate || "",
      path: baseUrl,
      type: "translation",
      description: description,
      langFile: langFile,
      version: manifest.version || existing.lastUpdate || lastUpdate || "",
      files: files,
    };
    if (existing.addedDate) modsData[modId].addedDate = existing.addedDate;

    console.log(
      "[translations] " +
        lang +
        ": " +
        files.length +
        " files" +
        (lastUpdate ? " (" + lastUpdate + ")" : ""),
    );
    count++;
  }

  return count;
}

/**
 * Pick a representative icon path (relative to <folder>/www) for an overhaul
 * mod from its file list. Overhaul mods advertise themselves with a title
 * image; fall back to a conventional icon, then the first image present.
 */
function pickExtrasIconRel(files) {
  var titles = files.filter(function (f) {
    return /^img\/titles1\//i.test(f) && /\.(png|jpg|jpeg)$/i.test(f);
  });
  if (titles.length) return titles[0];
  if (files.indexOf("img/icon.png") >= 0) return "img/icon.png";
  var anyImg = files.filter(function (f) {
    return /^img\/.*\.(png|jpg|jpeg)$/i.test(f);
  });
  return anyImg.length ? anyImg[0] : "";
}

/** Detect an overhaul mod's dialogue source file from its file list, if any. */
function detectExtrasLangFile(files) {
  for (var i = 0; i < files.length; i++) {
    if (/^languages\/[^/]+\/dialogue\.(loc|pld|csv|txt)$/i.test(files[i])) {
      return files[i];
    }
  }
  return null;
}

/**
 * Fetch the extras index (mods.txt) and emit an overhaul mod entry for each
 * listed folder. Files are walked from the local working copy under
 * mods/<folder>/www; the entry's path/icon point at the remote host so the
 * client fetches assets from extras.tcoaal.app at install time.
 *
 * Entries are keyed by folder name and typed "overhaul": identical client
 * semantics to local overhauls, differing only in remote asset delivery.
 */
async function syncExtraMods(modsData) {
  console.log("[extras] Fetching " + EXTRAS_MODS_URL);
  var modsTxt = await httpGetText(EXTRAS_MODS_URL);
  if (!modsTxt) {
    console.warn("[extras] Failed to fetch mods.txt");
    return 0;
  }
  var folders = modsTxt
    .split(/\r?\n/)
    .map(function (s) {
      return s.trim();
    })
    .filter(function (s) {
      return s.length > 0 && !/^#/.test(s);
    });

  if (folders.length === 0) {
    console.warn("[extras] mods.txt is empty");
    return 0;
  }

  // Prune stale extras entries (remote path under EXTRAS_BASE) no longer
  // listed in mods.txt.
  var want = {};
  for (var i = 0; i < folders.length; i++) want[folders[i]] = true;
  var existingKeys = Object.keys(modsData);
  for (var k = 0; k < existingKeys.length; k++) {
    var ek = existingKeys[k];
    var ee = modsData[ek];
    if (
      ee &&
      typeof ee.path === "string" &&
      ee.path.indexOf(EXTRAS_BASE + "/") === 0 &&
      !want[ek]
    ) {
      console.log("[extras] Removing stale entry: " + ek);
      delete modsData[ek];
    }
  }

  var count = 0;
  for (var j = 0; j < folders.length; j++) {
    var folder = folders[j];
    var modId = folder;
    var baseUrl = EXTRAS_BASE + "/" + folder + "/www";
    var localWww = path.join(MODS_DIR, folder, "www");

    var files = walkDir(localWww, "");
    var existing = modsData[modId] || {};
    if (files.length === 0) {
      if (existing.files && existing.files.length) {
        // No local working copy this run: keep the last-known file list so a
        // CI machine without the extras checkout doesn't wipe the manifest.
        console.warn(
          "[extras] " +
            folder +
            ": no local mods/" +
            folder +
            "/www; keeping existing " +
            existing.files.length +
            " file(s)",
        );
        files = existing.files.slice();
      } else {
        console.warn(
          "[extras] " +
            folder +
            ": no local mods/" +
            folder +
            "/www and no existing file list; skipping",
        );
        continue;
      }
    }

    var iconRel = pickExtrasIconRel(files);
    var icon = existing.icon || (iconRel ? baseUrl + "/" + iconRel : "");
    var langFile =
      existing.langFile || detectExtrasLangFile(files) || undefined;
    var drmType = fs.existsSync(localWww) ? detectDrmType(localWww) : undefined;

    var lastUpdate = existing.lastUpdate;
    if (!lastUpdate && iconRel) {
      lastUpdate = await httpHeadLastModified(baseUrl + "/" + iconRel);
    }

    modsData[modId] = {
      name: existing.name || folder,
      icon: icon,
      author: existing.author || "",
      lastUpdate: lastUpdate || "",
      path: baseUrl,
      type: "overhaul",
      description: existing.description || "",
      version: existing.version || lastUpdate || "",
      files: files,
    };
    if (existing.addedDate) modsData[modId].addedDate = existing.addedDate;
    if (langFile) modsData[modId].langFile = langFile;
    if (drmType) modsData[modId].drmType = drmType;

    console.log(
      "[extras] " +
        folder +
        ": " +
        files.length +
        " files" +
        (drmType ? " [drm:" + drmType + "]" : ""),
    );
    count++;
  }

  return count;
}

/**
 * Reorder modsData so remote extras overhaul mods sit immediately after the
 * local (built-in + bundled) mods and before the translation mods. JSON object
 * key order is insertion order, and both getModList() (client) and the Mods UI
 * render in that order, so this controls where extras mods appear in the list.
 */
function reorderModsData(modsData) {
  var base = [];
  var extras = [];
  var translations = [];
  var keys = Object.keys(modsData);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var entry = modsData[key];
    var type = entry && entry.type;
    var p = entry && entry.path;
    if (type === "translation" || key.indexOf("translation_") === 0) {
      translations.push(key);
    } else if (typeof p === "string" && p.indexOf(EXTRAS_BASE + "/") === 0) {
      extras.push(key);
    } else {
      base.push(key);
    }
  }
  var ordered = {};
  base.concat(extras, translations).forEach(function (key) {
    ordered[key] = modsData[key];
  });
  return ordered;
}

/** Fetch author and last update date from a GitHub repo. */
async function fetchGithubMeta(repoUrl) {
  var gh = parseGithubUrl(repoUrl);
  if (!gh) return null;
  var base = "/repos/" + gh.owner + "/" + gh.repo;

  // Get repo info for the owner
  var repo = await ghApiFetch(base);
  var author = repo && repo.owner ? repo.owner.login : null;

  // Get latest commit date
  var commits = await ghApiFetch(base + "/commits?per_page=1");
  var lastUpdate = null;
  if (commits && commits.length > 0) {
    var d =
      commits[0].commit &&
      commits[0].commit.committer &&
      commits[0].commit.committer.date;
    if (d) lastUpdate = d.substring(0, 10);
  }

  return { author: author, lastUpdate: lastUpdate };
}

async function main() {
  // Read existing mods.json
  var modsData;
  try {
    modsData = JSON.parse(fs.readFileSync(MODS_JSON, "utf8"));
  } catch (e) {
    console.error("Cannot read mods.json:", e.message);
    process.exit(1);
  }

  // Sync remotely-hosted mods (translations + extras overhauls) before walking
  // local mod dirs.
  var translationCount = await syncTranslations(modsData);
  if (translationCount > 0) {
    console.log(
      "[translations] Updated " + translationCount + " translation entry(ies)",
    );
  }

  var extrasCount = await syncExtraMods(modsData);
  if (extrasCount > 0) {
    console.log("[extras] Updated " + extrasCount + " extras mod entry(ies)");
  }

  var count = 0;
  var keys = Object.keys(modsData);
  for (var i = 0; i < keys.length; i++) {
    var modId = keys[i];
    var entry = modsData[modId];
    // Remote-hosted mods (translations + extras overhauls) are synced above;
    // skip the local walk/author/DRM logic for anything with an absolute URL
    // path so it isn't treated as a missing local mod and blanked out.
    if (entry && (entry.type === "translation" || isRemotePath(entry.path))) {
      count++;
      continue;
    }
    var modPath = entry.path || "mods/" + modId;
    var modDir = path.join(__dirname, modPath);
    var wwwDir = path.join(modDir, "www");
    var isBuiltin = modId.charAt(0) === "_";

    // Ensure name, author, description always exist (default to empty)
    if (!entry.name) entry.name = entry.name || "";
    if (!entry.author) entry.author = entry.author || "";
    if (!entry.description) entry.description = entry.description || "";

    // Built-in mods: prefix type, default author
    if (isBuiltin) {
      var baseType = (entry.type || "plugin").replace(/^built-in\s+/i, "");
      entry.type = "built-in " + baseType;
      if (!entry.author) entry.author = "kidev";
    }

    // External mods with a repo: fetch metadata from GitHub.
    // Author and description are never overwritten once set (casing may
    // differ from GitHub). lastUpdate is always refreshed.
    if (!isBuiltin && entry.repo) {
      console.log("[github] Fetching metadata for " + modId + "...");
      var meta = await fetchGithubMeta(entry.repo);
      if (meta) {
        if (!entry.author && meta.author) entry.author = meta.author;
        if (meta.lastUpdate) entry.lastUpdate = meta.lastUpdate;
        console.log(
          "  author: " +
            (entry.author || "(none)") +
            ", lastUpdate: " +
            (meta.lastUpdate || "(unchanged)"),
        );
      }
    }

    if (!fs.existsSync(wwwDir) || !fs.statSync(wwwDir).isDirectory()) {
      console.log("[skip] " + modId + ": no www/ directory");
      continue;
    }

    var files = walkDir(wwwDir, "");
    var version = getModVersion(modDir);
    var drmType = isBuiltin ? undefined : detectDrmType(wwwDir);

    entry.version = version;
    entry.files = files;
    if (drmType) entry.drmType = drmType;

    console.log(
      "[manifest] " +
        modId +
        ": " +
        files.length +
        " files" +
        (version ? " (v" + version + ")" : "") +
        (drmType ? " [drm:" + drmType + "]" : ""),
    );
    count++;
  }

  // Place extras overhaul mods right after the local overhauls and before the
  // translations, regardless of when their keys were inserted above.
  modsData = reorderModsData(modsData);

  fs.writeFileSync(MODS_JSON, JSON.stringify(modsData, null, 2) + "\n");

  if (count === 0) {
    console.log("No mods with www/ directories found.");
  } else {
    console.log("Updated mods.json with " + count + " manifest(s).");
  }
}

main().catch(function (e) {
  console.error("Fatal:", e);
  process.exit(1);
});

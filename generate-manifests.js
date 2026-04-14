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
 * Usage:  node generate-manifests.js
 */

"use strict";

var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var https = require("https");

var MODS_JSON = path.join(__dirname, "mods.json");
var MODS_DIR = path.join(__dirname, "mods");

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

  var count = 0;
  var keys = Object.keys(modsData);
  for (var i = 0; i < keys.length; i++) {
    var modId = keys[i];
    var entry = modsData[modId];
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

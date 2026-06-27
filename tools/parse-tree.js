#!/usr/bin/env node
/*
 * TCOAAL Browser Player
 * Copyright (C) 2026 kidev
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. This program is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 * General Public License for more details: <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/*
 * parse-tree.js
 *
 * Parses tree.txt (the canonical game-folder listing) and writes
 * app/expected-files.json: a flat array of every leaf path the user is
 * expected to import. The loader uses this to:
 *   1. Validate imports: warn (not block) when files are missing.
 *   2. Healthcheck a previously-imported game from the loader UI.
 *
 * Tree format:
 *   .
 *   ├── audio
 *   │   ├── bgm
 *   │   │   ├── 0f248cf67bab1f6c
 *
 * Each `│   ` (vertical-bar + 3 spaces) or `    ` (4 spaces) is one level
 * of indent. The leaf name is whatever follows `├── ` or `└── ` on each
 * line. Directories are detected by looking ahead: if any subsequent line
 * has greater depth before returning to <= current depth, the entry is a
 * directory and is skipped.
 *
 * Some root entries are irrelevant for browser play (Steam binaries, the
 * standalone translator tool, EULAs). They're filtered out via the
 * EXCLUDE_ROOTS list to avoid noise in the missing-files warning.
 */

"use strict";

var fs = require("fs");
var path = require("path");

// Tools live in tools/; project root is one level up.
var ROOT = path.join(__dirname, "..");
var TREE_FILE = path.join(ROOT, "tree.txt");
var OUT_FILE = path.join(ROOT, "app", "expected-files.json");
// The version catalog. tree.txt is dumped from the latest release, so the
// hashed names in expected-files.json belong to that version; record it as
// targetVersion so the loader/boot can skip the file check for any other
// (known, older) imported version instead of flagging a wall of "missing"
// files that are really just hashed differently.
var VERSIONS_FILE = path.join(ROOT, "tools", "tcoaal-versions.json");

// Top-level paths the browser player doesn't need. Listed once here so
// the warning UI doesn't nag the user about Steam SDKs or PDFs.
var EXCLUDE_ROOTS = [
  "EULA MV.txt",
  "EULA - RPG Maker - Make A Game!.url",
  "greenworks", // Steam SDK (NW.js-only)
  "languages", // standalone translator tool
  "tree.txt",
  "package.json", // game root package.json (we don't need it in browser)
];

function parseTree(text) {
  var lines = text.split(/\r?\n/);
  var entries = [];

  for (var i = 0; i < lines.length; i++) {
    var raw = lines[i];
    if (!raw || raw === ".") continue;

    // Locate the connector ("├" or "└") and grab the name after "── ".
    // Indent uses "│" + NBSP + NBSP + space (4 chars per level), with
    // bare " " + NBSP*2 + space at the last column. Counting the index
    // of the connector and dividing by 4 yields the depth, dodging the
    // need to enumerate the exact indent characters.
    var connIdx = -1;
    for (var k = 0; k < raw.length; k++) {
      if (raw[k] === "├" || raw[k] === "└") {
        connIdx = k;
        break;
      }
    }
    if (connIdx < 0) continue;

    // Skip "├── " (4 chars: connector + 2 box-draw + space)
    var name = raw.substring(connIdx + 4).trim();
    if (!name) continue;

    var depth = connIdx / 4;
    entries.push({ depth: depth, name: name, lineIdx: i });
  }

  // Walk entries. An entry is a directory iff the next entry has greater
  // depth. Otherwise it's a file (leaf).
  var stack = []; // path components by depth
  var files = [];

  for (var j = 0; j < entries.length; j++) {
    var e = entries[j];
    var next = entries[j + 1];
    var isDir = next && next.depth > e.depth;

    // Drop stale stack entries (we backed out of subtrees).
    stack.length = e.depth;
    stack[e.depth] = e.name;

    if (!isDir) {
      var fullPath = stack.slice(0, e.depth + 1).join("/");
      files.push(fullPath);
    }
  }

  return files;
}

// Numeric semver-ish compare: "3.0.13" > "3.0.9" > "2.0.14". Missing
// components count as 0, so "3.0.0" < "3.0.0.1".
function cmpVersion(a, b) {
  var pa = String(a).split(".");
  var pb = String(b).split(".");
  var n = Math.max(pa.length, pb.length);
  for (var i = 0; i < n; i++) {
    var da = parseInt(pa[i] || "0", 10) || 0;
    var db = parseInt(pb[i] || "0", 10) || 0;
    if (da !== db) return da - db;
  }
  return 0;
}

// Highest version across every major in the catalog. Returns "" if the
// catalog can't be read (the loader/boot then keep their current behaviour:
// check every install, version-agnostic).
function latestCatalogVersion() {
  try {
    var cat = JSON.parse(fs.readFileSync(VERSIONS_FILE, "utf8"));
    var best = "";
    (cat.majors || []).forEach(function (m) {
      (m.versions || []).forEach(function (v) {
        if (v && v.version && (!best || cmpVersion(v.version, best) > 0)) {
          best = v.version;
        }
      });
    });
    return best;
  } catch (e) {
    console.warn("[parse-tree] couldn't read " + VERSIONS_FILE + ":", e.message);
    return "";
  }
}

function shouldKeep(filePath) {
  for (var i = 0; i < EXCLUDE_ROOTS.length; i++) {
    var root = EXCLUDE_ROOTS[i];
    if (filePath === root || filePath.indexOf(root + "/") === 0) {
      return false;
    }
  }
  return true;
}

function main() {
  var text = fs.readFileSync(TREE_FILE, "utf8");
  var all = parseTree(text);
  var kept = all.filter(shouldKeep);
  kept.sort();

  var targetVersion = latestCatalogVersion();

  var json = JSON.stringify(
    {
      generated: new Date().toISOString(),
      source: "tree.txt",
      targetVersion: targetVersion,
      count: kept.length,
      excludedCount: all.length - kept.length,
      files: kept,
    },
    null,
    2,
  );
  fs.writeFileSync(OUT_FILE, json + "\n");

  console.log(
    "Wrote " +
      OUT_FILE +
      ": " +
      kept.length +
      " files (" +
      (all.length - kept.length) +
      " excluded), targetVersion=" +
      (targetVersion || "(unknown)"),
  );
}

main();

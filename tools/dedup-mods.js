#!/usr/bin/env node
/**
 * dedup-mods.js
 *
 * Scans a single mod folder (passed as a required argument: either the
 * mod's top-level folder containing www/, or the www/ folder itself) and
 * removes files that are byte-identical to the base game.
 *
 * Handles the filename mismatch between old mods and the current base game:
 * mods use unhashed filenames (e.g. img/parallaxes/ground4.png) while the
 * base game uses TCOAAL-hashed filenames (e.g. img/parallaxes/26472d7da1885ca9)
 * with per-file XOR encryption.
 *
 * For each mod file, the script:
 *   1. Tries a direct path match in base-game (same relative path)
 *   2. If not found, computes hashPath() of the mod file's relative path and
 *      looks for the hashed filename in base-game
 *   3. If the base-game file is TCOAAL-encrypted, decrypts it before comparing
 *   4. If the decrypted contents are byte-identical, deletes the mod file
 *   5. Updates mods.json to remove deleted files from the file list
 *   6. Removes empty directories left behind
 *
 * The Service Worker already handles the fallback: when the mod file is absent,
 * the SW falls through from mod-prefixed IDB lookups to the base game's
 * hashed+encrypted file and decrypts it on the fly.
 *
 * Usage:
 *   node tools/dedup-mods.js <modFolder>             # scan + delete
 *   node tools/dedup-mods.js <modFolder>/www         # www/ folder also works
 *   node tools/dedup-mods.js <modFolder> --dry-run   # report only, don't delete
 *
 * <modFolder> is required. If the folder has a matching entry in mods.json
 * (by path), its files array is updated to drop the removed files.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Tools live in tools/; project root is one level up.
const ROOT = path.join(__dirname, "..");
const MODS_DIR = path.join(ROOT, "mods");
const BASE_GAME_DIR = path.join(MODS_DIR, "base-game");
const MODS_JSON = path.join(ROOT, "mods.json");

const DRY_RUN = process.argv.includes("--dry-run");
const POSITIONAL = process.argv.slice(2).filter((a) => !a.startsWith("--"));

// TCOAAL magic header
const ASSET_SIG = Buffer.from("TCOAAL", "ascii");

// Hash + decrypt (mirrors server.js / sw.js)

function hashPath(logicalPath) {
  const parts = logicalPath.split(/[/\\]/);
  const fname = parts[parts.length - 1];
  const joined = parts.join("/");
  const hash = crypto
    .createHash("sha256")
    .update(joined)
    .digest("hex")
    .substring(0, 16);

  let h = hash;
  if (fname.toUpperCase().includes("[BUST]")) h += "[BUST]";
  if (fname.startsWith("!")) h = "!" + h;
  parts[parts.length - 1] = h;
  return parts.join("/");
}

function fileMask(hashedRelPath) {
  const fname = hashedRelPath.split("/").pop().toUpperCase();
  let m = 0;
  for (const ch of fname) m = (m << 1) ^ ch.charCodeAt(0);
  return m;
}

function dekit(buf, hashedRelPath) {
  if (buf.length < ASSET_SIG.length + 1) return buf;
  for (let i = 0; i < ASSET_SIG.length; i++) {
    if (buf[i] !== ASSET_SIG[i]) return buf; // not encrypted
  }

  let keyByte = buf[ASSET_SIG.length];
  const payload = buf.subarray(ASSET_SIG.length + 1);
  let mask = (fileMask(hashedRelPath) + 1) & 0xff;
  if (keyByte === 0) keyByte = payload.length;

  const out = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) {
    if (i < keyByte) {
      const b = payload[i];
      out[i] = b ^ mask;
      mask = ((mask << 1) ^ b) & 0xff;
    } else {
      out[i] = payload[i];
    }
  }
  return out;
}

// Filesystem helpers

function walkDir(dir, base) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const rel = path.join(base, entry).replace(/\\/g, "/");
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...walkDir(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

/**
 * Recursively remove empty directories inside root. The root itself is
 * never removed.
 */
function removeEmptyDirs(dir, root) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    try {
      if (fs.statSync(full).isDirectory()) {
        removeEmptyDirs(full, root);
      }
    } catch {
      continue;
    }
  }
  // Re-read after recursive cleanup
  if (dir === root) return; // never remove the root itself
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  if (entries.length === 0) {
    fs.rmdirSync(dir);
  }
}

// Base-game content cache

/**
 * Cache of decrypted base-game file contents, keyed by the relative path
 * used to look them up (either direct or hashed). Avoids re-reading and
 * re-decrypting the same base-game file for multiple mods.
 */
const _baseCache = new Map();

/**
 * Read and (if needed) decrypt a base-game file. Returns a Buffer or null.
 * The base-game directory has NO www/ subdirectory: files sit directly
 * under mods/base-game/ (e.g. mods/base-game/js/rpg_core.js).
 */
function readBaseFile(relPath) {
  if (_baseCache.has(relPath)) return _baseCache.get(relPath);

  const absPath = path.join(BASE_GAME_DIR, relPath);
  let buf;
  try {
    buf = fs.readFileSync(absPath);
  } catch {
    _baseCache.set(relPath, null);
    return null;
  }

  // Decrypt if TCOAAL-encrypted
  const decrypted = dekit(buf, relPath);
  _baseCache.set(relPath, decrypted);
  return decrypted;
}

// Main

/**
 * Resolve the argument folder to the mod's www/ directory. The argument may
 * be the mod's top-level folder (containing a www/ subdirectory) or the www/
 * folder itself. Returns an absolute path, or null if no usable folder.
 */
function resolveWwwDir(arg) {
  const abs = path.resolve(arg);
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return null;
  }
  if (!stat.isDirectory()) return null;

  // If it contains a www/ subdirectory, treat the argument as the top folder.
  const nested = path.join(abs, "www");
  try {
    if (fs.statSync(nested).isDirectory()) return nested;
  } catch {
    /* no nested www/: fall through */
  }
  // Otherwise the argument is itself the www/ folder.
  return abs;
}

/**
 * Find the mods.json entry (id + entry) whose `path` resolves to the same
 * top-level folder as `wwwDir` (i.e. <path>/www === wwwDir). Returns null
 * when no entry matches, so an arbitrary folder still dedups without touching
 * mods.json.
 */
function findModEntry(modsData, wwwDir) {
  for (const id of Object.keys(modsData)) {
    const entry = modsData[id];
    const modPath = entry.path || "mods/" + id;
    const entryWww = path.resolve(ROOT, modPath, "www");
    if (entryWww === wwwDir) return { id, entry };
  }
  return null;
}

function main() {
  if (POSITIONAL.length === 0) {
    console.error(
      "Error: a mod folder is required (the top folder or its www/).\n" +
        "Usage: node tools/dedup-mods.js <modFolder> [--dry-run]",
    );
    process.exit(1);
  }
  if (POSITIONAL.length > 1) {
    console.error("Error: expected a single mod folder, got: " + POSITIONAL.join(", "));
    process.exit(1);
  }

  const wwwDir = resolveWwwDir(POSITIONAL[0]);
  if (wwwDir === null) {
    console.error("Error: not a directory: " + POSITIONAL[0]);
    process.exit(1);
  }

  // Optional mods.json entry to keep in sync (only if the folder is a known mod).
  let modsData = null;
  let modEntry = null;
  try {
    modsData = JSON.parse(fs.readFileSync(MODS_JSON, "utf8"));
    modEntry = findModEntry(modsData, wwwDir);
  } catch {
    /* mods.json absent/unreadable: dedup the folder anyway */
  }

  const label = modEntry ? modEntry.id : path.relative(ROOT, wwwDir) || wwwDir;
  console.log(
    (DRY_RUN ? "[DRY RUN] " : "") + "Scanning " + label + " (" + wwwDir + ")",
  );
  console.log();

  const files = walkDir(wwwDir, "");
  let removed = 0;
  let kept = 0;
  let skipped = 0;
  const removedFiles = [];

  for (const relPath of files) {
    const modFilePath = path.join(wwwDir, relPath);
    let modBuf;
    try {
      modBuf = fs.readFileSync(modFilePath);
    } catch {
      skipped++;
      continue;
    }

    // Strategy 1: Direct path match in base-game
    let baseBuf = readBaseFile(relPath);

    // Strategy 2: Hash the mod file's logical path and look up in base-game
    if (baseBuf === null) {
      // The mod file may have an extension (e.g. ground4.png) while the
      // base-game stores files without extension under the hashed name.
      // Try hashing with the extension first, then without.
      const hashedWithExt = hashPath(relPath);
      baseBuf = readBaseFile(hashedWithExt);

      if (baseBuf === null) {
        // Try hashing the path without extension
        const noExtPath = relPath.replace(/\.[^./]+$/, "");
        if (noExtPath !== relPath) {
          const hashedNoExt = hashPath(noExtPath);
          // The base-game hashed file has no extension on disk
          baseBuf = readBaseFile(hashedNoExt);

          if (baseBuf === null) {
            // Also try: hash the full path (with ext) but look up without ext on disk
            const hashedWithExtNoExt = hashedWithExt.replace(/\.[^./]+$/, "");
            if (hashedWithExtNoExt !== hashedWithExt) {
              baseBuf = readBaseFile(hashedWithExtNoExt);
            }
          }
        }
      }
    }

    if (baseBuf === null) {
      // No base-game equivalent found: this is a mod-original file
      kept++;
      continue;
    }

    // Compare decrypted base-game content with the mod file
    if (modBuf.length === baseBuf.length && modBuf.equals(baseBuf)) {
      // Duplicate: remove from mod
      if (!DRY_RUN) {
        fs.unlinkSync(modFilePath);
      }
      removedFiles.push(relPath);
      removed++;
    } else {
      kept++;
    }
  }

  // Update mods.json: remove deleted files from the files array
  if (modEntry && removedFiles.length > 0 && modEntry.entry.files) {
    const removedSet = new Set(removedFiles);
    modEntry.entry.files = modEntry.entry.files.filter((f) => !removedSet.has(f));
  }

  // Clean up empty directories
  if (!DRY_RUN && removed > 0) {
    removeEmptyDirs(wwwDir, wwwDir);
  }

  if (removed > 0) {
    for (const f of removedFiles) {
      console.log("  - " + f);
    }
    console.log();
  }

  // Write updated mods.json
  if (!DRY_RUN && modEntry && removedFiles.length > 0) {
    fs.writeFileSync(MODS_JSON, JSON.stringify(modsData, null, 2) + "\n");
    console.log("Updated mods.json");
  }

  console.log(
    (DRY_RUN ? "[DRY RUN] " : "") +
      "Total: " +
      removed +
      " duplicate(s) removed, " +
      kept +
      " unique file(s) kept" +
      (skipped > 0 ? ", " + skipped + " skipped" : ""),
  );
}

main();

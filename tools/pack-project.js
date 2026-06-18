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
 * pack-project.js: re-encode an edited RPG Maker MV project back into the
 * shipped TCOAAL `www/` format (the inverse of extract-project.js), so the
 * BrowserPlayer / server.js serves it exactly as it serves the original game:
 * no shim or Service-Worker changes needed.
 *
 * It reverses extract-project's transforms:
 *   - canonical data names (System.json, MapNNN.json, ...)  -> data/<hash>
 *   - canonical img/system names (Window.png, ...)          -> img/system/<hash>
 *   - hashed assets that gained an extension (<hash>.png) -> <hash>
 *   - data/img/audio/movies content                        -> TCOAAL-encrypted
 *   - everything else (js, fonts, the CLD, Credits.txt ...)  -> copied verbatim
 *
 * Usage:
 *   node tools/pack-project.js --project <projectDir> --out <wwwDir> [--force]
 *
 * Then play it with the BrowserPlayer:
 *   node server.js <wwwDir>
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { hashPath, fileMask, walk } = require("./build-tomb-mod.js");
const { loadCLD, createUnbaker, serializeCLD } = require("./lang-roundtrip.js");
const { unbakeAssetNames } = require("./map-names.js");

const ASSET_SIG = Buffer.from("TCOAAL");

// Mirror of extract-project.js's recovery sets (kept in sync intentionally).
const STD_DATA = [
  "System",
  "Actors",
  "Classes",
  "Skills",
  "Items",
  "Weapons",
  "Armors",
  "Enemies",
  "Troops",
  "States",
  "Animations",
  "Tilesets",
  "CommonEvents",
  "MapInfos",
];
const SYSTEM_IMAGES = [
  "Window",
  "IconSet",
  "Balloon",
  "Damage",
  "GameOver",
  "Loading",
  "ButtonSet",
  "States",
  "Shadow1",
  "Shadow2",
  "Weapons1",
  "Weapons2",
  "Weapons3",
  "continue",
  "credits",
  "language",
  "msgimg_0",
  "new_game",
  "options",
  "quit",
  "stamp",
  "vision",
  "VNButtons",
];

/** Set of canonical logical paths whose name extract-project recovered (and
 *  which therefore must be re-hashed on the way back). */
function canonicalSet(maxMapId = 2000) {
  const s = new Set();
  for (const n of STD_DATA) s.add(`data/${n}.json`);
  for (let i = 1; i <= maxMapId; i++) {
    s.add(`data/Map${String(i).padStart(3, "0")}.json`);
  }
  for (const n of SYSTEM_IMAGES) s.add(`img/system/${n}.png`);
  return s;
}

/** TCOAAL-encrypt a plaintext buffer for storage at `hashedRel` (inverse of
 *  dekit). keyByte 0 = whole-file. */
function encrypt(plain, hashedRel) {
  let mask = (fileMask(hashedRel) + 1) & 0xff;
  const out = Buffer.allocUnsafe(plain.length);
  for (let i = 0; i < plain.length; i++) {
    const c = plain[i] ^ mask;
    out[i] = c;
    mask = ((mask << 1) ^ c) & 0xff;
  }
  return Buffer.concat([ASSET_SIG, Buffer.from([0]), out]);
}

const HASH_BASENAME = /^!?[0-9a-f]{16}(\[BUST\])?$/i;

/**
 * Map a project-relative path back to its on-disk (hashed) storage path, and
 * whether its content should be TCOAAL-encrypted.
 */
function targetFor(rel, canon) {
  // Canonical engine file whose name was recovered -> re-hash.
  if (canon.has(rel)) {
    return { hashed: hashPath(rel), encrypt: true };
  }

  const m = rel.match(/^(img|audio|movies)\/(.+)$/);
  if (m) {
    const dir = path.posix.dirname(rel);
    const base = path.posix.basename(rel);
    const ext = path.posix.extname(base);
    const stem = ext ? base.slice(0, -ext.length) : base;
    // An asset that is already hash-named (extract only added the extension):
    // strip the extension back to the original storage name.
    if (HASH_BASENAME.test(stem)) {
      return { hashed: dir + "/" + stem, encrypt: true };
    }
    // A genuinely-named asset a modder added: keep the name, still encrypt so
    // the on-disk layout matches (the loader resolves it by hashPath).
    return { hashed: hashPath(rel), encrypt: true };
  }

  // data/ leftovers (the CLD at a hash, Credits.txt) and everything else
  // (js, fonts, index.html, package.json, ...) are stored verbatim, unencrypted:
  // exactly as the game ships them.
  return { hashed: rel, encrypt: false };
}

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  if (fs.statSync(target).isDirectory()) {
    for (const e of fs.readdirSync(target)) rmrf(path.join(target, e));
    fs.rmdirSync(target);
  } else {
    fs.unlinkSync(target);
  }
}

function writeOut(outRoot, rel, buf) {
  const dest = path.join(outRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function parseArgs(argv) {
  const opts = { project: "project", out: "www-packed", force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project" || a === "-p") opts.project = argv[++i];
    else if (a === "--out" || a === "-o") opts.out = argv[++i];
    else if (a === "--force" || a === "-f") opts.force = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: node tools/pack-project.js --project <projectDir> --out <wwwDir> [--force]",
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  return opts;
}

function run(opts) {
  const project = fs.existsSync(path.join(opts.project, "www"))
    ? path.join(opts.project, "www")
    : opts.project;

  if (!fs.existsSync(path.join(project, "data"))) {
    throw new Error(`No data/ folder under: ${opts.project}`);
  }
  if (fs.existsSync(opts.out)) {
    if (!opts.force) {
      throw new Error(`Output exists: ${opts.out} (pass --force).`);
    }
    rmrf(opts.out);
  }

  const canon = canonicalSet();
  const files = walk(project);
  let hashed = 0;
  let encd = 0;

  // Un-bake the editor-readable transforms back to the shipped on-disk form so
  // server.js / the SW serve the project exactly like the original game:
  //   - asset references + map-note overlay tags: human names -> the original
  //     hashes (map-names.js). Always applies: extract bakes these regardless
  //     of --bake.
  //   - dialogue: baked text -> (label)/(lines) placeholders + CLD keys the live
  //     command101 needs (only when a baked CLD is present, i.e. --playable).
  //     Unchanged text restores to its original key (byte-faithful); edited /
  //     new text mints a fresh key.
  // Done in memory: the editable project is never touched. A project with no
  // baked names/dialogue passes through unchanged.
  const cldInfo = loadCLD(path.join(project, "data"));
  const cldRel = cldInfo ? "data/" + cldInfo.rel : null;
  const ub = cldInfo ? createUnbaker(cldInfo.cld) : null;
  const unbakeStats = ub ? ub.stats : null;
  const unbaked = new Map(); // rel -> plaintext Buffer (placeholders restored)
  for (const rel of files) {
    if (rel === cldRel || !/^data\/.+\.json$/i.test(rel)) continue;
    let obj;
    try {
      obj = JSON.parse(fs.readFileSync(path.join(project, rel), "utf8"));
    } catch (e) {
      continue; // not JSON (e.g. Credits.txt-like): leave to verbatim read
    }
    unbakeAssetNames(obj);
    if (ub) ub.unbakeDoc(obj);
    unbaked.set(rel, Buffer.from(JSON.stringify(obj)));
  }

  for (const rel of files) {
    // Skip the project-only scaffolding the shipped game never had.
    if (rel === "Game.rpgproject") continue;

    let buf;
    if (cldInfo && rel === cldRel) {
      // Re-emit the (augmented) CLD with any minted keys, verbatim/unencrypted.
      buf = serializeCLD(cldInfo.header, cldInfo.cld);
    } else if (unbaked.has(rel)) {
      buf = unbaked.get(rel);
    } else {
      buf = fs.readFileSync(path.join(project, rel));
    }
    const t = targetFor(rel, canon);
    if (t.hashed !== rel) hashed++;
    const outBuf = t.encrypt ? (encd++, encrypt(buf, t.hashed)) : buf;
    writeOut(opts.out, t.hashed, outBuf);
  }

  if (unbakeStats && (unbakeStats.mintedLines || unbakeStats.mintedLabels)) {
    console.log(
      `Un-baked dialogue: ${unbakeStats.restored} restored to original keys, ` +
        `${unbakeStats.mintedLines} new line + ${unbakeStats.mintedLabels} new label keys minted.`,
    );
  }
  console.log(
    `Packed ${files.length} files: ${hashed} re-hashed, ${encd} encrypted -> ${opts.out}`,
  );
  console.log(`Play it with: node server.js ${opts.out}`);
}

// Importable as a library (browser bundle / share-project call run() in-process).
module.exports = { run, parseArgs };

if (require.main === module) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
}

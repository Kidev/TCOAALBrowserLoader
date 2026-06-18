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
 * share-project.js: package an edited RPG Maker MV project as a *diff* against
 * the shipped game, so a modder can distribute their mod WITHOUT redistributing
 * any of the game's copyrighted content. The player supplies their own legally
 * owned copy of the base game; this tool's output carries only what the modder
 * actually changed or authored.
 *
 *   build: node tools/share-project.js --project <editedProject> \
 *                  --base <baseGameA> [--base <baseGameB> ...] --out mymod.tcoaalmod
 *
 *   apply: node tools/share-project.js --apply mymod.tcoaalmod --base <gameFolder>
 *           # ...or, applying in place onto a Steam/desktop copy and launching it
 *           # through Steam afterwards:
 *           node tools/share-project.js --apply mymod.tcoaalmod \
 *                  --base <SteamGameFolder> --out <SteamGameFolder>
 *
 *   undo: node tools/share-project.js --rollback <gameFolder>
 *
 * Why this is copyright-safe and small
 * ------------------------------------
 * extract-project.js turns a shipped game into an editable project, and that
 * extraction is *byte-for-byte deterministic* (verified: re-extracting the same
 * base yields 0 differing files over the whole tree, including the generated
 * parallax composites and the bundled launcher scaffolding). So the diff is
 * taken in "project space": the base game is re-extracted to a pristine baseline
 * and the modder's edited project is diffed against it. Everything the modder
 * did not touch is identical on both sides and cancels out. What remains is
 * exactly the modder's edits:
 *
 *   - changed data JSON (maps, System, ...)  -> a compact RFC-6902 JSON patch
 *                                               (only changed values travel,
 *                                               never the whole copyrighted file)
 *   - new / changed assets and other files   -> stored verbatim (the modder's own
 *                                               art / text; unchanged base assets
 *                                               are never included)
 *   - deleted files                          -> recorded as a deletion
 *
 * Multiple base versions ("variants")
 * -----------------------------------
 * Pass --base more than once to bake a diff against several base versions (e.g.
 * a Steam build and an itch build) into one file. On apply, the player's game is
 * fingerprinted and the matching variant is selected automatically. Verbatim
 * payloads are de-duplicated across variants, so extra bases add almost nothing
 * to the file size.
 *
 * Applying in place + rollback
 * ----------------------------
 * Most players run the real game through NW.js (e.g. launched by Steam), not
 * the BrowserPlayer. To mod that copy, apply *in place* over its game folder:
 * apply rewrites the game's own www/, and NW.js/Steam then launches the modded
 * game as usual  -  no separate runner involved. (`node server.js` is only the
 * repo's local browser-mode test server; it takes no game argument and is
 * unrelated to this.) When --out resolves to the same folder as --base, apply
 * overlays ONLY the files the mod actually changes onto the live game (every
 * untouched original byte is left intact, so saves under save/ and unrelated
 * files are preserved) and writes a `.tcoaalmod-rollback.zip` next to the
 * game's www. `--rollback <gameFolder>` restores the game to its exact
 * pre-apply state and deletes that file.
 *
 * The output is a single ZIP (".tcoaalmod") openable on any platform; building
 * and applying use only Node's standard library (no dependencies).
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { walk, applyJsonPatch } = require("./build-tomb-mod.js");
const extractProject = require("./extract-project.js");
const packProjectTool = require("./pack-project.js");

const FORMAT = "tcoaal-share/2";
const ROLLBACK_NAME = ".tcoaalmod-rollback.zip";

// JSON structural diff -> RFC-6902 ops (consumed by build-tomb-mod's
// applyJsonPatch on the way back). Arrays are diffed element-wise by index;
// a length change replaces the whole array (correct, and avoids index-shift
// ordering hazards). The produced op list reconstructs `b` from `a` exactly.

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  const aArr = Array.isArray(a);
  if (aArr !== Array.isArray(b)) return false;
  if (aArr) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

function ptrEscape(key) {
  return String(key).replace(/~/g, "~0").replace(/\//g, "~1");
}

function diffJson(a, b, ptr, ops) {
  if (deepEqual(a, b)) return;
  const aObj = a && typeof a === "object";
  const bObj = b && typeof b === "object";
  if (!aObj || !bObj || Array.isArray(a) !== Array.isArray(b)) {
    ops.push({ op: "replace", path: ptr, value: b });
    return;
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      ops.push({ op: "replace", path: ptr, value: b });
      return;
    }
    for (let i = 0; i < a.length; i++) diffJson(a[i], b[i], ptr + "/" + i, ops);
    return;
  }
  for (const k of Object.keys(a)) {
    if (!(k in b)) ops.push({ op: "remove", path: ptr + "/" + ptrEscape(k) });
  }
  for (const k of Object.keys(b)) {
    if (!(k in a)) {
      ops.push({ op: "add", path: ptr + "/" + ptrEscape(k), value: b[k] });
    } else {
      diffJson(a[k], b[k], ptr + "/" + ptrEscape(k), ops);
    }
  }
}

// Minimal ZIP reader / writer (pure stdlib: zlib deflate-raw + crc32). Keeps
// the ".tcoaalmod" / rollback files plain ZIPs openable by any archiver.

// CRC-32 (IEEE). zlib.crc32 is Node 22+ only and missing from browserify-zlib,
// so fall back to a small table-based implementation in the browser bundle.
let _crcTable = null;
function crc32(buf) {
  if (zlib.crc32) return zlib.crc32(buf) >>> 0;
  if (!_crcTable) {
    _crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      _crcTable[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = _crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function zipWrite(entries, outPath) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");
    const crc = crc32(e.data) >>> 0;
    const comp = zlib.deflateRawSync(e.data);
    const store = comp.length >= e.data.length;
    const method = store ? 0 : 8;
    const body = store ? e.data : comp;

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(body.length, 18);
    lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    parts.push(lh, nameBuf, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(e.data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += lh.length + nameBuf.length + body.length;
  }
  const cdStart = offset;
  const cdSize = central.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, Buffer.concat([...parts, ...central, eocd]));
}

function zipRead(buf) {
  const map = new Map();
  let p = buf.length - 22;
  while (p >= 0 && buf.readUInt32LE(p) !== 0x06054b50) p--;
  if (p < 0) throw new Error("not a ZIP (no end-of-directory record)");
  const count = buf.readUInt16LE(p + 10);
  let cd = buf.readUInt32LE(p + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(cd) !== 0x02014b50) throw new Error("corrupt ZIP central directory");
    const method = buf.readUInt16LE(cd + 10);
    const compSize = buf.readUInt32LE(cd + 20);
    const nameLen = buf.readUInt16LE(cd + 28);
    const extraLen = buf.readUInt16LE(cd + 30);
    const commentLen = buf.readUInt16LE(cd + 32);
    const lho = buf.readUInt32LE(cd + 42);
    const name = buf.toString("utf8", cd + 46, cd + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtraLen = buf.readUInt16LE(lho + 28);
    const dataStart = lho + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    map.set(name, method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw));
    cd += 46 + nameLen + extraLen + commentLen;
  }
  return map;
}

// fs / subprocess helpers

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  if (fs.statSync(target).isDirectory()) {
    for (const e of fs.readdirSync(target)) rmrf(path.join(target, e));
    fs.rmdirSync(target);
  } else {
    fs.unlinkSync(target);
  }
}

function copyDir(src, dst) {
  for (const rel of walk(src)) {
    const out = path.join(dst, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(path.join(src, rel), out);
  }
}

/** Extract a baseline project from a base game www with the recorded options.
 *  Runs in-process (so the same code path works in the browser bundle under the
 *  fs/path/zlib/crypto polyfills); extractArgs are merged onto extract defaults. */
async function extractBaseline(baseWww, outDir, extractArgs) {
  const opts = extractProject.parseArgs(extractArgs || []);
  opts.www = baseWww;
  opts.out = outDir;
  opts.force = true;
  await extractProject.run(opts);
}

function packProject(projectDir, outWww) {
  packProjectTool.run({ project: projectDir, out: outWww, force: true });
}

/** Accepts either a `www` folder or a game folder containing one. */
function resolveWww(input) {
  if (fs.existsSync(path.join(input, "www", "data"))) return path.join(input, "www");
  return input;
}

function sha256hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/**
 * Fingerprint of an extracted baseline project: a hash over every data/*.json
 * file (sorted by path, name + content). The game's data defines its version
 * and reflects the extract options (baking changes the JSON), while deliberately
 * ignoring user-specific files such as save/ and large media  -  so a player who
 * has playtime/saves still matches the creator's pristine base.
 */
function fingerprintProject(projDir) {
  const data = walk(projDir)
    .filter((rel) => DATA_JSON.test(rel))
    .sort();
  const h = crypto.createHash("sha256");
  for (const rel of data) {
    h.update(rel);
    h.update(fs.readFileSync(path.join(projDir, rel)));
  }
  return { hash: h.digest("hex"), fileCount: data.length };
}

const DATA_JSON = /^data\/.+\.json$/i;

// build

async function build(opts) {
  const editedProject = fs.existsSync(path.join(opts.project, "www"))
    ? path.join(opts.project, "www")
    : opts.project;
  if (!fs.existsSync(path.join(editedProject, "data"))) {
    fail(`Edited project not found (no data/ under ${opts.project}).`);
  }
  if (fs.existsSync(opts.out) && !opts.force) {
    fail(`Output exists: ${opts.out} (pass --force).`);
  }

  const editFiles = new Set(walk(editedProject));
  const payloads = new Map(); // contentHash -> { name, data }
  const variants = [];

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoaal-share-"));
  try {
    for (const baseInput of opts.bases) {
      const baseWww = resolveWww(baseInput);
      if (!fs.existsSync(path.join(baseWww, "data"))) {
        fail(`Base game www not found (no data/ under ${baseInput}).`);
      }
      const label = path.basename(path.resolve(baseInput));
      process.stdout.write(`Extracting pristine baseline for "${label}"...\n`);
      const baseline = path.join(tmp, "base-" + variants.length);
      await extractBaseline(baseWww, baseline, opts.extractArgs);
      const fp = fingerprintProject(baseline);

      const { files, stats } = diffProjects(baseline, editedProject, editFiles, payloads);
      if (!files.length) {
        fail(`Base "${label}" is identical to the edited project (no changes).`);
      }
      variants.push({
        base: { ...fp, label, extractArgs: opts.extractArgs },
        files,
        stats,
      });
      process.stdout.write(
        `  ${stats.patched} data patch${stats.patched === 1 ? "" : "es"}, ` +
          `${stats.added} added, ${stats.replaced} replaced, ${stats.deleted} deleted ` +
          `(${stats.unchanged} unchanged base files excluded).\n`,
      );
      rmrf(baseline);
    }

    const manifest = {
      format: FORMAT,
      name: opts.name || "Untitled mod",
      author: opts.author || "",
      version: opts.version || "1.0.0",
      description: opts.description || "",
      created: new Date().toISOString(),
      tool: "share-project.js",
      variants,
    };

    const entries = [
      { name: "mod.json", data: Buffer.from(JSON.stringify(manifest, null, 2)) },
      ...[...payloads.values()],
      { name: "README.txt", data: Buffer.from(readme(manifest)) },
    ];
    zipWrite(entries, opts.out);

    const bytes = fs.statSync(opts.out).size;
    process.stdout.write(
      `\nWrote ${opts.out} (${human(bytes)})  -  ${variants.length} base variant${variants.length === 1 ? "" : "s"}, ` +
        `${payloads.size} payload${payloads.size === 1 ? "" : "s"}.\n\n` +
        `Share this single file. Players with the base game apply it with:\n` +
        `  node tools/share-project.js --apply ${path.basename(opts.out)} --base <gameFolder>\n` +
        `(or import it directly in the BrowserPlayer's loader).\n`,
    );
  } finally {
    rmrf(tmp);
  }
}

/** Diff a baseline project against the edited project; returns file entries +
 *  stats, registering any verbatim payload (deduped by content) in `payloads`. */
function diffProjects(baseline, editedProject, editFiles, payloads) {
  const baseFiles = new Set(walk(baseline));
  const all = new Set([...baseFiles, ...editFiles]);
  const files = [];
  const stats = { patched: 0, added: 0, replaced: 0, deleted: 0, unchanged: 0 };

  const addPayload = (rel, buf) => {
    const h = sha256hex(buf).slice(0, 16);
    const name = "f/" + h;
    if (!payloads.has(h)) payloads.set(h, { name, data: buf });
    files.push({ rel, type: "verbatim", payload: name });
  };

  for (const rel of [...all].sort()) {
    const inBase = baseFiles.has(rel);
    const inEdit = editFiles.has(rel);
    if (inBase && !inEdit) {
      files.push({ rel, type: "delete" });
      stats.deleted++;
      continue;
    }
    const editBuf = fs.readFileSync(path.join(editedProject, rel));
    if (!inBase) {
      addPayload(rel, editBuf);
      stats.added++;
      continue;
    }
    const baseBuf = fs.readFileSync(path.join(baseline, rel));
    if (baseBuf.equals(editBuf)) {
      stats.unchanged++;
      continue;
    }
    if (DATA_JSON.test(rel)) {
      const ops = tryJsonPatch(baseBuf, editBuf);
      if (ops) {
        files.push({ rel, type: "jsonpatch", ops });
        stats.patched++;
        continue;
      }
    }
    addPayload(rel, editBuf);
    stats.replaced++;
  }
  return { files, stats };
}

function tryJsonPatch(baseBuf, editBuf) {
  let a;
  let b;
  try {
    a = JSON.parse(baseBuf.toString("utf8"));
    b = JSON.parse(editBuf.toString("utf8"));
  } catch (e) {
    return null; // not JSON (e.g. a Credits.txt-like data file): ship verbatim
  }
  const ops = [];
  diffJson(a, b, "", ops);
  return ops;
}

// apply

async function apply(opts) {
  const baseInput = opts.base;
  const baseWww = resolveWww(baseInput);
  if (!fs.existsSync(path.join(baseWww, "data"))) {
    fail(`Base game www not found (no data/ under ${baseInput}).`);
  }
  if (!fs.existsSync(opts.modFile)) fail(`Mod file not found: ${opts.modFile}`);

  // In place when --out resolves to the same folder the user passed as --base
  // (the game root), or directly to the base www. Then we overlay onto the live
  // game and write a rollback file. Otherwise we build a standalone modded www.
  const inPlace =
    !opts.out ||
    path.resolve(opts.out) === path.resolve(baseInput) ||
    path.resolve(opts.out) === path.resolve(baseWww);
  const outWww = inPlace ? baseWww : opts.out;

  if (!inPlace && fs.existsSync(outWww)) {
    if (!opts.force) fail(`Output exists: ${outWww} (pass --force).`);
    rmrf(outWww);
  }
  if (inPlace && fs.existsSync(path.join(gameRootOf(baseWww), ROLLBACK_NAME))) {
    fail(
      `A mod is already applied here (found ${ROLLBACK_NAME}). Roll it back first:\n` +
        `  node tools/share-project.js --rollback ${baseInput}`,
    );
  }

  const zip = zipRead(fs.readFileSync(opts.modFile));
  const manifest = readManifest(zip);
  process.stdout.write(
    `Applying "${manifest.name}"${manifest.author ? " by " + manifest.author : ""}` +
      ` v${manifest.version}\n`,
  );

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoaal-apply-"));
  try {
    // Select the variant matching the player's base. Extraction is grouped by
    // extract-args so we only re-extract once per distinct option set.
    const baseline = path.join(tmp, "baseline");
    const { variant, fp } = await selectVariant(manifest, baseWww, baseline, opts);

    // Reconstruct the edited project: baseline + the variant's patch.
    const recon = path.join(tmp, "recon");
    copyDir(baseline, recon);
    applyVariant(variant, recon, zip);

    const modPacked = path.join(tmp, "mod-www");
    process.stdout.write("Re-packing the modded game...\n");
    packProject(recon, modPacked);

    if (!inPlace) {
      copyDir(modPacked, outWww);
      process.stdout.write(
        `\nDone. Wrote a complete modded game to: ${outWww}\n` +
          `Import that folder in the BrowserPlayer loader, or run it with your game runtime.\n`,
      );
      return;
    }

    // In place: overlay only the files the mod actually changes onto the live
    // game, so untouched original bytes (incl. saves under save/) stay intact.
    const basePacked = path.join(tmp, "base-www");
    packProject(baseline, basePacked);
    overlayInPlace(basePacked, modPacked, baseWww, manifest);

    process.stdout.write(
      `\nDone  -  mod applied in place to: ${baseWww}\n` +
        `Launch the game the usual way (e.g. through Steam).\n` +
        `To undo:\n  node tools/share-project.js --rollback ${baseInput}\n`,
    );
  } finally {
    rmrf(tmp);
  }
}

function readManifest(zip) {
  const manifestBuf = zip.get("mod.json");
  if (!manifestBuf) fail("Invalid mod file: missing mod.json.");
  const manifest = JSON.parse(manifestBuf.toString("utf8"));
  if (!manifest.format || !manifest.format.startsWith("tcoaal-share/")) {
    fail(`Unrecognized mod format: ${manifest.format}`);
  }
  if (!Array.isArray(manifest.variants) || !manifest.variants.length) {
    fail("Invalid mod file: no base variants.");
  }
  return manifest;
}

/** Extract the player's base (once per distinct extract-args) and find the
 *  variant whose fingerprint matches. Leaves the matching baseline at `outDir`. */
async function selectVariant(manifest, baseWww, outDir, opts) {
  const groups = new Map(); // extractArgs key -> variants[]
  for (const v of manifest.variants) {
    const key = JSON.stringify(v.base.extractArgs || []);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  }

  // forceExtractArgs is appended to each variant's recorded args (the browser
  // path passes "--not-playable": it skips the disk-copying installPlayer step,
  // which doesn't affect data/*.json and so leaves the fingerprint unchanged).
  const extra = opts.forceExtractArgs || [];
  let lastFp = null;
  for (const [key, vs] of groups) {
    const args = JSON.parse(key).concat(extra);
    process.stdout.write("Extracting your base game...\n");
    rmrf(outDir);
    await extractBaseline(baseWww, outDir, args);
    const fp = fingerprintProject(outDir);
    lastFp = fp;
    const match = vs.find((v) => v.base.hash === fp.hash);
    if (match) return { variant: match, fp };
  }

  if (opts.ignoreMismatch) {
    const v = manifest.variants[0];
    process.stderr.write(
      `WARNING: no base variant matched your game; forcing variant "${v.base.label}".\n`,
    );
    rmrf(outDir);
    await extractBaseline(baseWww, outDir, (v.base.extractArgs || []).concat(extra));
    return { variant: v, fp: fingerprintProject(outDir) };
  }

  const labels = manifest.variants
    .map((v) => `  - ${v.base.label} (${v.base.hash.slice(0, 16)}, ${v.base.fileCount} files)`)
    .join("\n");
  fail(
    `Your base game does not match any version this mod was built for.\n` +
      `Your game fingerprint: ${lastFp ? lastFp.hash.slice(0, 16) : "?"}\n` +
      `Mod supports:\n${labels}\n` +
      `Use the matching game version, or re-run with --ignore-base-mismatch to force.`,
  );
}

function applyVariant(variant, projectDir, zip) {
  for (const f of variant.files) {
    const abs = path.join(projectDir, f.rel);
    if (f.type === "delete") {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } else if (f.type === "jsonpatch") {
      if (!fs.existsSync(abs)) {
        fail(`Patch targets ${f.rel}, which is missing from your base game.`);
      }
      let doc = JSON.parse(fs.readFileSync(abs, "utf8"));
      doc = applyJsonPatch(doc, f.ops);
      fs.writeFileSync(abs, JSON.stringify(doc));
    } else if (f.type === "verbatim") {
      const data = zip.get(f.payload);
      if (!data) fail(`Mod file is missing payload ${f.payload} for ${f.rel}.`);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, data);
    } else {
      fail(`Unknown file entry type: ${f.type}`);
    }
  }
}

/**
 * Overlay the mod's net on-disk changes (modPacked vs basePacked) onto the live
 * game www, recording a rollback archive. basePacked and modPacked come from the
 * same pack pipeline, so their difference is exactly the mod's effect (plus a
 * few files churned by pack-project's nondeterministic CLD-key minting, which is
 * harmless and fully captured in the rollback). Files identical between the two
 * packs are left untouched on disk, preserving the original game bytes.
 */
function overlayInPlace(basePacked, modPacked, liveWww, manifest) {
  const baseSet = new Set(walk(basePacked));
  const modSet = new Set(walk(modPacked));
  const all = new Set([...baseSet, ...modSet]);

  const backup = []; // { name(zip entry), data }
  const overwritten = [];
  const created = [];
  const deleted = [];
  let bi = 0;

  const backupLive = (rel, list) => {
    const live = path.join(liveWww, rel);
    if (fs.existsSync(live)) {
      const name = "b/" + bi++;
      backup.push({ name, data: fs.readFileSync(live) });
      list.push({ rel, payload: name });
      return true;
    }
    return false;
  };

  for (const rel of all) {
    const inBase = baseSet.has(rel);
    const inMod = modSet.has(rel);
    const live = path.join(liveWww, rel);

    if (inMod && !inBase) {
      // Mod adds this file.
      if (!backupLive(rel, overwritten)) created.push(rel);
      writeFileEnsured(live, fs.readFileSync(path.join(modPacked, rel)));
    } else if (!inMod && inBase) {
      // Mod removes this file.
      if (backupLive(rel, deleted) && fs.existsSync(live)) fs.unlinkSync(live);
    } else {
      // Present in both packs: only write when the mod changed it.
      const modBytes = fs.readFileSync(path.join(modPacked, rel));
      const baseBytes = fs.readFileSync(path.join(basePacked, rel));
      if (modBytes.equals(baseBytes)) continue; // unaffected: keep original
      if (!backupLive(rel, overwritten)) created.push(rel);
      writeFileEnsured(live, modBytes);
    }
  }

  const rollback = {
    format: "tcoaal-rollback/1",
    mod: { name: manifest.name, version: manifest.version },
    appliedAt: new Date().toISOString(),
    created,
    overwritten,
    deleted,
  };
  const entries = [
    { name: "rollback.json", data: Buffer.from(JSON.stringify(rollback, null, 2)) },
    ...backup,
  ];
  zipWrite(entries, path.join(gameRootOf(liveWww), ROLLBACK_NAME));

  process.stdout.write(
    `  overlaid ${overwritten.length} changed, ${created.length} new, ${deleted.length} removed file(s).\n`,
  );
}

function writeFileEnsured(abs, data) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, data);
}

/** Where the rollback file lives: the game root (parent of www/ when present). */
function gameRootOf(www) {
  const parent = path.dirname(path.resolve(www));
  if (path.basename(path.resolve(www)) === "www") return parent;
  return path.resolve(www);
}

// rollback

function rollback(opts) {
  const baseWww = resolveWww(opts.target);
  const root = gameRootOf(baseWww);
  const rbPath = path.join(root, ROLLBACK_NAME);
  if (!fs.existsSync(rbPath)) {
    fail(`No mod to roll back (no ${ROLLBACK_NAME} in ${root}).`);
  }
  const zip = zipRead(fs.readFileSync(rbPath));
  const meta = JSON.parse(zip.get("rollback.json").toString("utf8"));
  process.stdout.write(
    `Rolling back "${meta.mod.name}" v${meta.mod.version} from ${baseWww}\n`,
  );

  // Delete files the mod created (that did not exist before).
  for (const rel of meta.created || []) {
    const abs = path.join(baseWww, rel);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
  // Restore originals the mod overwrote or deleted.
  for (const e of [...(meta.overwritten || []), ...(meta.deleted || [])]) {
    const data = zip.get(e.payload);
    if (!data) fail(`Rollback archive is missing payload ${e.payload} for ${e.rel}.`);
    writeFileEnsured(path.join(baseWww, e.rel), data);
  }
  fs.unlinkSync(rbPath);
  process.stdout.write(
    `Restored ${(meta.overwritten || []).length} overwritten, ` +
      `${(meta.deleted || []).length} removed, deleted ${(meta.created || []).length} added file(s).\n` +
      `The game is back to its pre-mod state.\n`,
  );
}

// misc

function human(bytes) {
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i ? 1 : 0)} ${u[i]}`;
}

function readme(manifest) {
  return (
    `${manifest.name} v${manifest.version}` +
    (manifest.author ? ` by ${manifest.author}` : "") +
    `\n${manifest.description ? manifest.description + "\n" : ""}` +
    `\nThis is a TCOAAL mod distributed as a DIFF. It contains only the changes\n` +
    `the author made; it includes none of the game's copyrighted content. You\n` +
    `need your own legally owned copy of the base game to play it.\n\n` +
    `Supported base versions: ` +
    manifest.variants.map((v) => v.base.label).join(", ") +
    `\n\nTo apply (any platform; needs Node.js + the BrowserPlayer tools):\n\n` +
    `  # In place over your game (then launch it normally / via Steam):\n` +
    `  node tools/share-project.js --apply <this-file> --base <GameFolder> --out <GameFolder>\n\n` +
    `  # ...or build a standalone modded copy:\n` +
    `  node tools/share-project.js --apply <this-file> --base <GameFolder> --out modded-www\n\n` +
    `  # Undo an in-place apply:\n` +
    `  node tools/share-project.js --rollback <GameFolder>\n\n` +
    `Easiest of all: import this .tcoaalmod directly in the BrowserPlayer loader.\n`
  );
}

// Throw (don't exit): library-safe for the in-process / browser callers. The
// CLI entry below catches and turns it into a non-zero exit.
function fail(msg) {
  throw new Error(msg);
}

function parseArgs(argv) {
  const opts = {
    mode: "build",
    project: null,
    bases: [],
    out: null,
    name: null,
    author: null,
    version: null,
    description: null,
    extractArgs: [],
    force: false,
    ignoreMismatch: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") {
      opts.mode = "apply";
      opts.modFile = argv[++i];
    } else if (a === "--rollback") {
      opts.mode = "rollback";
      opts.target = argv[++i];
    } else if (a === "--project" || a === "-p") opts.project = argv[++i];
    else if (a === "--base" || a === "-b") {
      const v = argv[++i];
      opts.bases.push(v);
      opts.base = v; // last one wins for apply (single base)
    } else if (a === "--out" || a === "-o") opts.out = argv[++i];
    else if (a === "--name") opts.name = argv[++i];
    else if (a === "--author") opts.author = argv[++i];
    else if (a === "--version") opts.version = argv[++i];
    else if (a === "--description") opts.description = argv[++i];
    else if (a === "--extract-args") opts.extractArgs = splitArgs(argv[++i]);
    else if (a === "--force" || a === "-f") opts.force = true;
    else if (a === "--ignore-base-mismatch") opts.ignoreMismatch = true;
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else fail(`Unknown argument: ${a}`);
  }
  return opts;
}

function splitArgs(s) {
  if (!s) return [];
  return s.trim().split(/\s+/).filter(Boolean);
}

function printHelp() {
  process.stdout.write(
    `Package an edited RPG Maker MV project as a copyright-safe diff (the mod),\n` +
      `apply it onto a base game (optionally in place), and roll it back.\n\n` +
      `Build a shareable mod (one or more base versions):\n` +
      `  node tools/share-project.js --project <editedProject> \\\n` +
      `       --base <gameA> [--base <gameB> ...] --out mymod.tcoaalmod \\\n` +
      `       [--name N] [--author A] [--version V] [--description D]\n\n` +
      `Apply a mod:\n` +
      `  # in place over a game folder (launch it normally / via Steam afterwards):\n` +
      `  node tools/share-project.js --apply mymod.tcoaalmod --base <GameFolder> --out <GameFolder>\n` +
      `  # or build a standalone modded copy:\n` +
      `  node tools/share-project.js --apply mymod.tcoaalmod --base <GameFolder> --out modded-www\n\n` +
      `Roll back an in-place apply:\n` +
      `  node tools/share-project.js --rollback <GameFolder>\n\n` +
      `Options:\n` +
      `  -p, --project <dir>    The edited project (from extract-project.js).\n` +
      `  -b, --base <dir>       A base game folder (or its www). Repeat for variants.\n` +
      `  -o, --out <path>       .tcoaalmod (build); www/game dir (apply). Apply is\n` +
      `                         in place when --out equals --base (or omitted).\n` +
      `      --name/--author/--version/--description   Mod metadata (build).\n` +
      `      --extract-args "<flags>"   Extract flags used originally, e.g. "--no-bake".\n` +
      `      --ignore-base-mismatch     Apply even if no base variant matches.\n` +
      `  -f, --force            Overwrite the output if it exists.\n`,
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.mode === "apply") {
    if (!opts.base) fail("--apply requires --base <gameFolder>.");
    await apply(opts);
  } else if (opts.mode === "rollback") {
    if (!opts.target) fail("--rollback requires a <gameFolder>.");
    rollback(opts);
  } else {
    if (!opts.project) fail("--project <editedProject> is required.");
    if (!opts.bases.length) fail("at least one --base <gameFolder> is required.");
    if (!opts.out) opts.out = "mod.tcoaalmod";
    await build(opts);
  }
}

// Reusable pieces for the in-browser apply path (app/js/libs, bundled with the
// node-stdlib-browser + memfs polyfills). The CLI logic above and the browser
// bundle share one implementation.
module.exports = {
  build,
  apply,
  rollback,
  extractBaseline,
  packProject,
  diffProjects,
  applyVariant,
  selectVariant,
  fingerprintProject,
  readManifest,
  zipRead,
  zipWrite,
  diffJson,
  copyDir,
  rmrf,
  resolveWww,
};

if (require.main === module) {
  main().catch((e) => {
    process.stderr.write("error: " + (e && e.message ? e.message : e) + "\n");
    process.exit(1);
  });
}

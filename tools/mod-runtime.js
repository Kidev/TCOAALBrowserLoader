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
 * mod-runtime.js  -  the in-browser entry point for applying a .tcoaalmod against
 * the player's own (already imported) base game. It is bundled by esbuild with
 * the node-stdlib-browser polyfills (Buffer/process/path/zlib/crypto/os) and an
 * in-memory `fs` backed by memfs (see tools/_fs-browser.js + build:mod-runtime).
 *
 * The same Node code paths (extract-project -> patch -> pack-project) run here,
 * unchanged, over the memfs volume. We mount the base game into memfs, run the
 * share-project apply logic, and return the SHIPPED-format files that differ  - 
 * exactly the overlay the Service Worker serves from IDB as mod:{tag}:{path}.
 *
 * Exposed on window.ModRuntime (see build config's globalName).
 */

"use strict";

const { vol } = require("memfs");
const crypto = require("crypto");
const share = require("./share-project.js");
const { walk, hashPath, dekit } = require("./build-tomb-mod.js");

// Make logging safe under the browser process polyfill (some builds leave
// process.stdout undefined). Routes the tools' progress writes to console.
function ensureStdio() {
  if (!process.stdout || typeof process.stdout.write !== "function") {
    process.stdout = { write: (s) => (console.log(String(s).replace(/\n$/, "")), true) };
  }
  if (!process.stderr || typeof process.stderr.write !== "function") {
    process.stderr = { write: (s) => (console.warn(String(s).replace(/\n$/, "")), true) };
  }
}

function writeMem(absPath, bytes) {
  const path = require("path");
  vol.mkdirSync(path.dirname(absPath), { recursive: true });
  vol.writeFileSync(absPath, Buffer.from(bytes));
}

// share-project's build() makes a working dir under os.tmpdir(); in the memfs
// volume that path (e.g. "/tmp") does not exist until we create it.
function ensureTmpDir() {
  const os = require("os");
  try {
    vol.mkdirSync(os.tmpdir(), { recursive: true });
  } catch (e) {}
}

/** base36 content tag used as the imported mod's id (e.g. "wafda24joj"). Same
 *  content -> same tag, so saves (keyed by the mod id) survive uninstall + a
 *  later re-import. */
function contentTag(files) {
  const h = crypto.createHash("sha256");
  for (const rel of Object.keys(files).sort()) {
    h.update(rel);
    h.update(Buffer.from(files[rel]));
  }
  // 10 base36 chars of the digest  -  short, collision-safe enough for a local tag.
  return BigInt("0x" + h.digest("hex").slice(0, 16)).toString(36).slice(0, 10);
}

/**
 * Apply a .tcoaalmod against the imported base game.
 *
 * @param {Object<string,Uint8Array>} baseFiles  base www in shipped form, keyed
 *        by relative path (the loader reads these straight out of IndexedDB).
 * @param {Uint8Array} modBytes  the .tcoaalmod (ZIP) bytes.
 * @returns {Promise<{tag,name,author,version,description,files,deletions,baseLabel}>}
 *          `files` is the shipped overlay { relPath: Uint8Array } to store as
 *          mod:{tag}:{relPath}; `deletions` are base paths the mod removes.
 */
async function applyTcoaalmod(baseFiles, modBytes) {
  ensureStdio();
  vol.reset();

  for (const rel of Object.keys(baseFiles)) {
    writeMem("/base/www/" + rel, baseFiles[rel]);
  }

  const zip = share.zipRead(Buffer.from(modBytes));
  const manifest = share.readManifest(zip);

  // Pick the variant matching this base, leaving its baseline project at
  // /baseline (throws with the supported list on no match).
  const sel = await share.selectVariant(manifest, "/base/www", "/baseline", {
    forceExtractArgs: ["--not-playable"],
  });

  // Reconstruct the edited project, then pack both it and the pristine baseline
  // so we can keep only the files the mod actually changes (shipped form).
  share.copyDir("/baseline", "/recon");
  share.applyVariant(sel.variant, "/recon", zip);
  share.packProject("/recon", "/modPacked");
  share.packProject("/baseline", "/basePacked");

  const baseSet = new Set(walk("/basePacked"));
  const modSet = new Set(walk("/modPacked"));
  const files = {};
  const deletions = [];
  const path = require("path");
  for (const rel of new Set([...baseSet, ...modSet])) {
    const inBase = baseSet.has(rel);
    const inMod = modSet.has(rel);
    if (inMod && !inBase) {
      files[rel] = new Uint8Array(vol.readFileSync(path.join("/modPacked", rel)));
    } else if (!inMod && inBase) {
      deletions.push(rel);
    } else {
      const m = vol.readFileSync(path.join("/modPacked", rel));
      const b = vol.readFileSync(path.join("/basePacked", rel));
      if (!Buffer.from(m).equals(Buffer.from(b))) files[rel] = new Uint8Array(m);
    }
  }

  vol.reset();

  return {
    tag: contentTag(files),
    name: manifest.name,
    author: manifest.author || "",
    version: manifest.version || "",
    description: manifest.description || "",
    baseLabel: sel.variant.base.label,
    files,
    deletions,
  };
}

/**
 * Build a Tomb-format mod into a self-contained overhaul against an older base
 * game (the in-browser equivalent of `build-tomb-mod --diff <mod> --base <2.0.14>`).
 *
 * Tomb mods describe their changes as a `mod.json` manifest (dataDeltas, assets,
 * imageDeltas, languages, plugins) that cannot be applied live; we flatten them
 * offline into a plain `www/` and ship that whole tree as an overhaul overlay.
 *
 * @param {Object<string,Uint8Array>} baseFiles  the base game www (shipped form,
 *        keyed by relative path) the mod targets - must be the version the mod
 *        was made for (TCOAAL 2.0.14), or build() throws on the patch mismatch.
 * @param {Uint8Array} modBytes  the Tomb mod's .zip bytes (carries mod.json).
 * @returns {Promise<{tag,name,files}>}  `files` is the flattened www to store as
 *          mod:{tag}:{relPath}.
 */
async function buildTomb(baseFiles, modBytes) {
  ensureStdio();
  vol.reset();
  try {
    const path = require("path");
    for (const rel of Object.keys(baseFiles)) {
      writeMem("/base/www/" + rel, baseFiles[rel]);
    }

    // Unpack the mod .zip, anchoring /diff at the directory that holds mod.json
    // (the archive may wrap the mod in a top-level folder, with or without a
    // www/ subdir - assembleMod resolves www/ from there).
    const zip = share.zipRead(Buffer.from(modBytes));
    let modJsonRel = null;
    for (const [name] of zip) {
      if (/(^|\/)mod\.json$/.test(name)) {
        if (modJsonRel === null || name.length < modJsonRel.length) {
          modJsonRel = name;
        }
      }
    }
    if (modJsonRel === null) {
      throw new Error("Not a Tomb mod: no mod.json found in the archive.");
    }
    const diffPrefix = modJsonRel.replace(/mod\.json$/, ""); // "" or "wrapper/"
    for (const [name, data] of zip) {
      if (name.endsWith("/")) continue;
      writeMem("/diff/" + name, data);
    }

    const { build } = require("./build-tomb-mod.js");
    await build({
      diff: ("/diff/" + diffPrefix).replace(/\/+$/, ""),
      base: "/base",
      out: "/out",
      overlays: [],
      thin: false,
      force: false,
      pretty: false,
    });

    const outWww = "/out/www";
    const files = {};
    for (const rel of walk(outWww)) {
      files[rel.split(path.sep).join("/")] = new Uint8Array(
        vol.readFileSync(path.join(outWww, rel)),
      );
    }
    if (!Object.keys(files).length) {
      throw new Error("Tomb build produced no files.");
    }
    return { tag: contentTag(files), files };
  } finally {
    vol.reset();
  }
}

/**
 * Cheap analysis of a .tcoaalmod (no base game needed): reads the manifest and
 * summarizes it for the importer UI. Throws if the file isn't a recognized
 * tcoaal-share archive.
 */
function inspect(modBytes) {
  ensureStdio();
  const zip = share.zipRead(Buffer.from(modBytes));
  const m = share.readManifest(zip);
  return {
    format: m.format,
    name: m.name,
    author: m.author || "",
    version: m.version || "",
    description: m.description || "",
    created: m.created || "",
    variants: (m.variants || []).map((v) => ({
      label: v.base.label,
      hash: v.base.hash,
      fileCount: v.base.fileCount,
      stats: v.stats || null,
    })),
  };
}

/** Read a ZIP's entries into a plain { name: Uint8Array } map (used by the
 *  importer to unpack a shipped-format mod .zip directly into IDB). */
function readZip(bytes) {
  const m = share.zipRead(Buffer.from(bytes));
  const out = {};
  for (const [k, v] of m) out[k] = new Uint8Array(v);
  return out;
}

/**
 * Light ZIP inspection for the importer's classify step: parse only the central
 * directory for the entry names, and inflate just the (tiny) mod.json entries
 * for manifest sniffing. Crucially it does NOT inflate the payloads, so a
 * multi-hundred-MB overhaul archive classifies instantly on the main thread
 * instead of blocking it while every asset decompresses.
 *
 * @returns {{ names: string[], modJsons: Object<string,Uint8Array> }}
 */
function inspectZip(bytes) {
  const zlib = require("zlib");
  const buf = Buffer.from(bytes);
  let p = buf.length - 22;
  while (p >= 0 && buf.readUInt32LE(p) !== 0x06054b50) p--;
  if (p < 0) throw new Error("not a ZIP (no end-of-directory record)");
  const count = buf.readUInt16LE(p + 10);
  let cd = buf.readUInt32LE(p + 16);
  const names = [];
  const modJsons = {};
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(cd) !== 0x02014b50) {
      throw new Error("corrupt ZIP central directory");
    }
    const method = buf.readUInt16LE(cd + 10);
    const compSize = buf.readUInt32LE(cd + 20);
    const nameLen = buf.readUInt16LE(cd + 28);
    const extraLen = buf.readUInt16LE(cd + 30);
    const commentLen = buf.readUInt16LE(cd + 32);
    const lho = buf.readUInt32LE(cd + 42);
    const name = buf.toString("utf8", cd + 46, cd + 46 + nameLen);
    names.push(name);
    if (/(^|\/)mod\.json$/.test(name)) {
      const lNameLen = buf.readUInt16LE(lho + 26);
      const lExtraLen = buf.readUInt16LE(lho + 28);
      const dataStart = lho + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(dataStart, dataStart + compSize);
      const data = method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);
      modJsons[name] = new Uint8Array(data);
    }
    cd += 46 + nameLen + extraLen + commentLen;
  }
  return { names, modJsons };
}

/** Pull the player-facing game title out of a decrypted System.json buffer. The
 *  remaster stores it under `sysLabel.Game` (what an overhaul re-titles), with
 *  the classic MV `gameTitle` as a fallback. Returns null on anything unparsable. */
function titleFromSystemBytes(buf) {
  try {
    const sys = JSON.parse(Buffer.from(buf).toString("utf8"));
    if (sys && sys.sysLabel && sys.sysLabel.Game) return String(sys.sysLabel.Game);
    if (sys && sys.gameTitle) return String(sys.gameTitle);
  } catch (e) {}
  return null;
}

/**
 * Read ONLY data/System.json out of a packaged overhaul .zip and return the
 * mod's player-facing title (its `sysLabel.Game`), or null. Like inspectZip this
 * walks the central directory and inflates a single small entry - it never
 * touches the hundreds of MB of assets, so it is safe on the main thread during
 * the importer's analysis step.
 *
 * `prefix` is the www root inside the archive (as returned by the importer's
 * classifyOverlayZip, e.g. "wrapper/www/" or ""). System.json may be shipped
 * plain (`data/System.json`, a decrypted dump) or hashed + TCOAAL-encrypted
 * (`data/<hash>`, a real game www); both are resolved, and dekit() no-ops on the
 * plain case.
 */
function readSystemTitle(bytes, prefix) {
  const zlib = require("zlib");
  const buf = Buffer.from(bytes);
  prefix = prefix || "";
  const candidates = [prefix + "data/System.json", prefix + hashPath("data/System.json")];
  let p = buf.length - 22;
  while (p >= 0 && buf.readUInt32LE(p) !== 0x06054b50) p--;
  if (p < 0) return null;
  const count = buf.readUInt16LE(p + 10);
  let cd = buf.readUInt32LE(p + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(cd) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(cd + 10);
    const compSize = buf.readUInt32LE(cd + 20);
    const nameLen = buf.readUInt16LE(cd + 28);
    const extraLen = buf.readUInt16LE(cd + 30);
    const commentLen = buf.readUInt16LE(cd + 32);
    const lho = buf.readUInt32LE(cd + 42);
    const name = buf.toString("utf8", cd + 46, cd + 46 + nameLen);
    if (candidates.indexOf(name) >= 0) {
      const lNameLen = buf.readUInt16LE(lho + 26);
      const lExtraLen = buf.readUInt16LE(lho + 28);
      const dataStart = lho + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(dataStart, dataStart + compSize);
      let data = method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);
      // Hashed entries are TCOAAL-encrypted; dekit returns the bytes unchanged
      // when the magic header is absent (the plain data/System.json case).
      data = dekit(data, name);
      return titleFromSystemBytes(data);
    }
    cd += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

/**
 * Full unpack of a packaged overhaul .zip into a canonical, www-relative file
 * map. Heavy (inflates every entry), so it runs in the worker. `prefix` is the
 * www root to strip (e.g. "wrapper/www/"); an empty prefix means the game
 * folders sit at the archive root, and only those folders are kept.
 *
 * @returns {Object<string,Uint8Array>}
 */
function unpackOverlay(bytes, prefix) {
  const all = share.zipRead(Buffer.from(bytes));
  const GAME_DIR = /^(data|img|audio|js|fonts|movies|languages)\//;
  const out = {};
  for (const [name, data] of all) {
    if (name.endsWith("/")) continue;
    if (prefix) {
      if (name.indexOf(prefix) !== 0) continue;
      out[name.slice(prefix.length)] = new Uint8Array(data);
    } else if (GAME_DIR.test(name)) {
      out[name] = new Uint8Array(data);
    }
  }
  return out;
}

// Creator-side tools in the browser (mirror the desktop creator app).
//
// extract-project / pack-project / share-project are the same importable
// libraries the CLI and the desktop app run; here they run over memfs. We
// always pass "--not-playable": the playable launcher bundles app/js/libs +
// playerbundle files that don't exist in the in-memory volume, and it does not
// change the baked data (so the share fingerprint still matches a desktop
// build, which is why applyTcoaalmod can force the same flag). Image features
// that need @napi-rs/canvas (parallax composites, image deltas) are skipped.

const EXTRACT_ARGS = ["--not-playable"];

/** Mount a { relPath: bytes } map under an absolute memfs base dir. */
function mountFiles(baseAbs, files) {
  for (const rel of Object.keys(files)) writeMem(baseAbs + "/" + rel, files[rel]);
}

/** Walk a memfs directory tree into a ZIP Uint8Array (reuses share.zipWrite). */
function zipDir(dir) {
  const path = require("path");
  const entries = walk(dir).map((rel) => ({
    name: rel.split(path.sep).join("/"),
    data: Buffer.from(vol.readFileSync(path.join(dir, rel))),
  }));
  const outPath = "/__zipout.zip";
  share.zipWrite(entries, outPath);
  const bytes = new Uint8Array(vol.readFileSync(outPath));
  vol.unlinkSync(outPath);
  return bytes;
}

/** A safe directory-name from an arbitrary label (used to name base folders so
 *  share-project's basename-derived variant label stays meaningful). */
function safeName(s) {
  return (String(s || "base").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "")) || "base";
}

/**
 * Create an editable RPG Maker MV project from a base game's www (the desktop
 * "Create project"). `srcFiles` is the www in shipped form, keyed by relative
 * path (e.g. the imported base read straight out of IndexedDB).
 *
 * @returns {Promise<Uint8Array>} a ZIP of the project tree, ready to download.
 */
async function createProject(srcFiles, opts) {
  ensureStdio();
  vol.reset();
  try {
    mountFiles("/src/www", srcFiles);
    const extractProject = require("./extract-project.js");
    const args = EXTRACT_ARGS.slice();
    if (opts && opts.noBake) args.push("--no-bake");
    const eo = extractProject.parseArgs(args);
    eo.www = "/src/www";
    eo.out = "/project";
    eo.force = true;
    await extractProject.run(eo);
    return zipDir("/project");
  } finally {
    vol.reset();
  }
}

/**
 * Re-pack an edited project back into a playable, TCOAAL-shaped www (the desktop
 * "Pack project"). `projectFiles` is keyed by project-relative path (may or may
 * not include the leading "www/").
 *
 * @returns {Promise<Uint8Array>} a ZIP of the packed www, ready to download.
 */
async function packProject(projectFiles) {
  ensureStdio();
  vol.reset();
  try {
    mountFiles("/project", projectFiles);
    share.packProject("/project", "/packed");
    return zipDir("/packed");
  } finally {
    vol.reset();
  }
}

/**
 * Build a shareable, copyright-safe .tcoaalmod diff from an edited project and
 * one or more base games (the desktop "Build mod").
 *
 * @param {Object<string,Uint8Array>} projectFiles  the edited project tree.
 * @param {Array<{label:string, files:Object<string,Uint8Array>}>} bases  one or
 *        more base game www's (shipped form), each becoming a supported variant.
 * @param {{name,author,version,description}} meta
 * @returns {Promise<Uint8Array>} the .tcoaalmod (ZIP) bytes, ready to download.
 */
async function buildShare(projectFiles, bases, meta) {
  ensureStdio();
  vol.reset();
  ensureTmpDir();
  try {
    mountFiles("/project", projectFiles);
    const baseDirs = [];
    const used = new Set();
    (bases || []).forEach((b, i) => {
      let name = safeName(b.label || "base" + i);
      while (used.has(name)) name = name + "_" + i;
      used.add(name);
      mountFiles("/bases/" + name + "/www", b.files);
      baseDirs.push("/bases/" + name);
    });
    if (!baseDirs.length) throw new Error("At least one base game is required.");
    meta = meta || {};
    await share.build({
      project: "/project",
      out: "/mod.tcoaalmod",
      bases: baseDirs,
      extractArgs: EXTRACT_ARGS.slice(),
      force: true,
      name: meta.name || "",
      author: meta.author || "",
      version: meta.version || "",
      description: meta.description || "",
    });
    return new Uint8Array(vol.readFileSync("/mod.tcoaalmod"));
  } finally {
    vol.reset();
  }
}

module.exports = {
  applyTcoaalmod,
  buildTomb,
  inspect,
  readZip,
  inspectZip,
  readSystemTitle,
  unpackOverlay,
  contentTag,
  createProject,
  packProject,
  buildShare,
};

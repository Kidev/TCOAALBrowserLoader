#!/usr/bin/env node
/**
 * build-jsond-mod.js: Flatten a diff-based (.jsond) overhaul into a full mod.
 *
 * Some overhaul mods ship data files as "data/X.jsond": RFC-6902 JSON Patch
 * documents that must be applied on top of a *specific version* of the base
 * game's "data/X.json". Our app can only serve full files, and applying these
 * patches at runtime is fragile: a patch authored against a different base
 * version references paths that don't exist and silently breaks the game.
 *
 * This tool resolves the patches offline against the correct base game. Two
 * output shapes:
 *
 *   default       a thin overhaul mod folder: every "data/X.jsond" replaced
 *                   by a merged "data/X.json", other mod files copied verbatim.
 *                   Relies on the app's installed base game for everything the
 *                   mod doesn't ship: only safe if that base is the same
 *                   version the mod targets.
 *
 *   --full        a complete, self-contained "www/": the *entire* base game
 *                   decrypted to a plain dump (logical names like
 *                   data/Map001.json, img/pictures/foo.png, js/rpg_core.js),
 *                   with the mod's patches applied and its files overlaid on
 *                   top. Import the result via loader.html as the game itself:
 *                   no base dependency, no version mix. Use this when the mod
 *                   targets a different game version than the one installed.
 *
 * Usage:
 *   node build-jsond-mod.js --diff <dir> --base <dir> --out <dir> [options]
 *
 *   --diff <dir>   The .jsond mod folder (with or without a www/ subdir).
 *   --base <dir>   The base game the mod targets. May be a decrypted dump
 *                  (plain data/X.json), a current TCOAAL install (hashed +
 *                  encrypted), or an old pre-remaster install (data/X.k9a).
 *   --out  <dir>   Output folder. Receives a www/ tree.
 *   --full         Emit a complete self-contained game (base + mod), not a thin
 *                  overlay. Files are stored under their hashed names.
 *   --force        Write what succeeds even if some patches fail (failed
 *                  files are skipped). Default: abort if any patch fails.
 *   --pretty       Pretty-print merged JSON (2-space). Default: compact.
 *   -h, --help     Show this help.
 *
 * No dependencies: pure Node.js stdlib.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// TCOAAL crypto: Node port of the helpers in app/sw.js (hashPath/fileMask/
// dekit). Lets --base point at a raw encrypted install, not just a dump.

const ASSET_SIG = Buffer.from([84, 67, 79, 65, 65, 76]); // "TCOAAL"

/** Hashed storage path for a logical asset path, e.g. "data/System.json"
 *  -> "data/be1a37535e921f91". Mirrors sw.js hashPath(). */
function hashPath(logicalPath) {
  const parts = logicalPath.split(/[/\\]/);
  const fname = parts[parts.length - 1];
  const hex = crypto
    .createHash("sha256")
    .update(parts.join("/"), "utf8")
    .digest("hex");
  let h = hex.substring(0, 16);
  if (fname.toUpperCase().includes("[BUST]")) h += "[BUST]";
  if (fname.startsWith("!")) h = "!" + h;
  parts[parts.length - 1] = h;
  return parts.join("/");
}

/** Per-file XOR mask seed derived from the hashed filename. */
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
 * Decrypt an old-format ".k9a" asset (pre-remaster TCOAAL). Unlike the hashed
 * format, files keep their logical names and use a different container:
 *   [extLen:1][ext:extLen]["json"][keyByte:1][encrypted payload]
 * The rolling XOR is identical to dekit(), but the mask seed is
 * fileMask(basename-without-extension) & 0xff: note: NO +1, which is the one
 * difference from the hashed-format seed. `logicalRel` supplies that basename
 * (e.g. "data/Map001.json" -> "Map001").
 */
function decodeK9a(buf, logicalRel) {
  const extLen = buf[0];
  let keyByte = buf[1 + extLen];
  const payload = buf.subarray(1 + extLen + 1);
  const base = logicalRel
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "");
  let mask = fileMask(base) & 0xff;
  if (keyByte === 0) keyByte = payload.length;

  const out = Buffer.allocUnsafe(payload.length);
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

/** Decrypt a TCOAAL-encrypted buffer. No-op (returns input) when the magic
 *  header is absent, so plain files pass through unchanged. */
function dekit(buf, hashedRelPath) {
  if (buf.length < ASSET_SIG.length + 1) return buf;
  if (!buf.subarray(0, ASSET_SIG.length).equals(ASSET_SIG)) return buf;

  let keyByte = buf[ASSET_SIG.length];
  const payload = buf.subarray(ASSET_SIG.length + 1);
  let mask = (fileMask(hashedRelPath) + 1) & 0xff;
  if (keyByte === 0) keyByte = payload.length;

  const out = Buffer.allocUnsafe(payload.length);
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

// RFC-6902 JSON Patch: strict on array bounds: an out-of-range add/replace/
// remove throws rather than silently appending or creating sparse holes, so a
// patch that doesn't match the base fails loudly (which is the whole point of
// building offline against the *correct* base).

function jsonPointerUnescape(token) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function applyJsonPatch(doc, ops) {
  function locate(pointer) {
    if (pointer === "") return { root: true };
    if (pointer[0] !== "/") throw new Error("bad pointer: " + pointer);
    const tokens = pointer.split("/").slice(1).map(jsonPointerUnescape);
    let parent = doc;
    for (let i = 0; i < tokens.length - 1; i++) {
      const t = tokens[i];
      if (Array.isArray(parent)) {
        parent = parent[t === "-" ? parent.length : Number(t)];
      } else if (parent && typeof parent === "object") {
        parent = parent[t];
      } else {
        throw new Error("path not found: " + pointer);
      }
      if (parent === undefined) throw new Error("path not found: " + pointer);
    }
    return { parent, key: tokens[tokens.length - 1] };
  }

  function getValue(pointer) {
    if (pointer === "") return doc;
    const loc = locate(pointer);
    if (Array.isArray(loc.parent)) {
      return loc.parent[loc.key === "-" ? loc.parent.length : Number(loc.key)];
    }
    return loc.parent[loc.key];
  }

  function arrayIndex(arr, key, allowEnd) {
    const idx = key === "-" ? arr.length : Number(key);
    if (!Number.isInteger(idx) || idx < 0) {
      throw new Error("bad array index: " + key);
    }
    if (allowEnd ? idx > arr.length : idx >= arr.length) {
      throw new Error("array index out of range: " + key);
    }
    return idx;
  }

  function setValue(pointer, value, isAdd) {
    const loc = locate(pointer);
    if (loc.root) {
      doc = value;
      return;
    }
    const { parent, key } = loc;
    if (Array.isArray(parent)) {
      const idx = arrayIndex(parent, key, isAdd);
      if (isAdd) parent.splice(idx, 0, value);
      else parent[idx] = value;
    } else if (parent && typeof parent === "object") {
      parent[key] = value;
    } else {
      throw new Error("cannot set on non-container: " + pointer);
    }
  }

  function removeValue(pointer) {
    const loc = locate(pointer);
    if (loc.root) {
      doc = null;
      return;
    }
    const { parent, key } = loc;
    if (Array.isArray(parent)) {
      parent.splice(arrayIndex(parent, key, false), 1);
    } else if (parent && typeof parent === "object") {
      if (!(key in parent)) throw new Error("remove: missing key " + pointer);
      delete parent[key];
    } else {
      throw new Error("cannot remove from non-container: " + pointer);
    }
  }

  for (const op of ops) {
    if (!op || typeof op.op !== "string") throw new Error("bad op");
    switch (op.op) {
      case "add":
        setValue(op.path, op.value, true);
        break;
      case "replace":
        setValue(op.path, op.value, false);
        break;
      case "remove":
        removeValue(op.path);
        break;
      case "move": {
        const v = getValue(op.from);
        removeValue(op.from);
        setValue(op.path, v, true);
        break;
      }
      case "copy": {
        const v = getValue(op.from);
        setValue(op.path, JSON.parse(JSON.stringify(v)), true);
        break;
      }
      case "test": {
        const v = getValue(op.path);
        if (JSON.stringify(v) !== JSON.stringify(op.value)) {
          throw new Error("test failed at " + op.path);
        }
        break;
      }
      default:
        throw new Error("unsupported op: " + op.op);
    }
  }
  return doc;
}

// Filesystem helpers

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Pick the content root of a mod/base dir: <dir>/www if present, else <dir>. */
function contentRoot(dir) {
  return isDir(path.join(dir, "www")) ? path.join(dir, "www") : dir;
}

/** Recursively list files under root, returning paths relative to root (POSIX
 *  separators so they match logical asset paths). */
function walk(root) {
  const out = [];
  (function rec(abs, rel) {
    for (const name of fs.readdirSync(abs)) {
      const childAbs = path.join(abs, name);
      const childRel = rel ? rel + "/" + name : name;
      if (isDir(childAbs)) rec(childAbs, childRel);
      else out.push(childRel);
    }
  })(root, "");
  return out;
}

/**
 * Resolve a logical data path (e.g. "data/Map001.json") against the base game
 * content root, returning the decoded UTF-8 text or null if not present.
 * Handles three base layouts:
 *   1. decrypted dump: plain "data/X.json"
 *   2. current TCOAAL install: hashed + encrypted "data/<hash>"
 *   3. old (pre-remaster)    : logical-named + encrypted "data/X.k9a"
 */
function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function resolveBaseText(baseRoot, logicalRel) {
  // 1. Plain (decrypted dump).
  const plain = path.join(baseRoot, logicalRel);
  if (isFile(plain)) return fs.readFileSync(plain).toString("utf8");

  // 2. Hashed + TCOAAL-encrypted (current game).
  const hashed = hashPath(logicalRel); // e.g. "data/be1a37535e921f91"
  const enc = path.join(baseRoot, hashed);
  if (isFile(enc)) return dekit(fs.readFileSync(enc), hashed).toString("utf8");

  // 3. Old ".k9a" (logical name, different container/seed; pre-remaster).
  const k9a = path.join(baseRoot, logicalRel.replace(/\.[^./]+$/, ".k9a"));
  if (isFile(k9a))
    return decodeK9a(fs.readFileSync(k9a), logicalRel).toString("utf8");

  return null;
}

// Whole-game repack (--full)

/**
 * Cheaply determine the logical path of a base-game file without decrypting
 * its body. For ".k9a" the real extension lives in the header (e.g. "png"),
 * so we read just the leading [extLen][ext] bytes. Everything else keeps its
 * on-disk name (plain engine files, or already-hashed TCOAAL assets whose
 * logical name we can't recover: those are passed through verbatim).
 */
function baseLogical(absPath, relPath) {
  if (!/\.k9a$/i.test(relPath)) return relPath;
  const fd = fs.openSync(absPath, "r");
  try {
    const head = Buffer.alloc(1);
    fs.readSync(fd, head, 0, 1, 0);
    const extLen = head[0];
    const extBuf = Buffer.alloc(extLen);
    fs.readSync(fd, extBuf, 0, extLen, 1);
    return relPath.replace(/\.k9a$/i, "." + extBuf.toString("latin1"));
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Fully decode a base-game file to its logical path + plaintext content,
 * choosing the right scheme by container:
 *   - "*.k9a"        -> decodeK9a (logical ext from the header)
 *   - TCOAAL magic   -> dekit, but the on-disk name is a hash so the logical
 *                       name is unrecoverable; flagged verbatim (copy as-is)
 *   - anything else  -> plain (engine JS, fonts, etc.)
 * Returns { logical, content, verbatim }.
 */
function decodeBaseFile(absPath, relPath) {
  const buf = fs.readFileSync(absPath);
  if (/\.k9a$/i.test(relPath)) {
    const extLen = buf[0];
    const ext = buf.subarray(1, 1 + extLen).toString("latin1");
    const logical = relPath.replace(/\.k9a$/i, "." + ext);
    return { logical, content: decodeK9a(buf, logical), verbatim: false };
  }
  if (
    buf.length >= ASSET_SIG.length + 1 &&
    buf.subarray(0, ASSET_SIG.length).equals(ASSET_SIG)
  ) {
    return { logical: relPath, content: buf, verbatim: true };
  }
  return { logical: relPath, content: buf, verbatim: false };
}

/** Write a buffer under its plain logical path (a normal decrypted dump:
 *  data/Map001.json, js/rpg_core.js, img/pictures/foo.png, ...). */
function writeLogical(outWww, logical, buf) {
  const dest = path.join(outWww, logical);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function runFull(opts, diffRoot, baseRoot, outWww) {
  // Index the mod: full-file overrides vs. .jsond patch targets.
  const modFull = new Map(); // logical -> srcAbs
  const modPatch = new Map(); // targetLogical (data/X.json) -> patch srcAbs
  for (const rel of walk(diffRoot)) {
    if (/\.jsond$/i.test(rel)) {
      modPatch.set(rel.replace(/\.jsond$/i, ".json"), path.join(diffRoot, rel));
    } else {
      modFull.set(rel, path.join(diffRoot, rel));
    }
  }
  // Phase A: resolve every patch against the base (decodes only the patched
  // files). Validate before writing anything so a wrong base aborts cleanly.
  const patched = new Map(); // logical -> Buffer
  const failedTargets = new Set();
  const failures = [];
  for (const [target, patchAbs] of modPatch) {
    const baseText = resolveBaseText(baseRoot, target);
    if (baseText === null) {
      failures.push({ rel: target, reason: "base file not found in --base" });
      failedTargets.add(target);
      continue;
    }
    try {
      const baseObj = JSON.parse(baseText);
      const ops = JSON.parse(fs.readFileSync(patchAbs, "utf8"));
      if (!Array.isArray(ops)) throw new Error("patch is not an array of ops");
      const merged = applyJsonPatch(baseObj, ops);
      patched.set(
        target,
        Buffer.from(
          opts.pretty
            ? JSON.stringify(merged, null, 2)
            : JSON.stringify(merged),
          "utf8",
        ),
      );
    } catch (e) {
      failures.push({ rel: target, reason: "patch failed: " + e.message });
      failedTargets.add(target);
    }
  }

  if (failures.length) {
    console.error("Patch failures:");
    for (const f of failures) console.error(`  - ${f.rel}: ${f.reason}`);
    if (!opts.force) {
      console.error(
        "\nAborting without writing. The base game likely does not match the\n" +
          "version this mod targets. Use --base pointing at the correct version,\n" +
          "or pass --force to write the base (unmodded) copy of failed files.",
      );
      process.exit(1);
    }
    console.error(
      "\n--force: writing the base (unmodded) copy of the above files.\n",
    );
  }

  // Phase B: walk the whole base; write each file decrypted under its plain
  // logical name, substituting patched data and skipping anything the mod
  // fully overrides.
  let fromBase = 0;
  let fromPatch = 0;
  let verbatim = 0;
  let overridden = 0;
  for (const rel of walk(baseRoot)) {
    const absPath = path.join(baseRoot, rel);
    const logical = baseLogical(absPath, rel);

    if (modFull.has(logical)) {
      overridden++; // mod ships a full replacement: written in Phase C
      continue;
    }
    if (patched.has(logical)) {
      writeLogical(outWww, logical, patched.get(logical));
      fromPatch++;
      continue;
    }
    // Failed patch under --force, or an ordinary base file: write the base.
    const dec = decodeBaseFile(absPath, rel);
    if (dec.verbatim) {
      // An already-hashed TCOAAL asset (current-format base): its logical name
      // isn't recoverable, so copy it through under its on-disk hashed name.
      const dest = path.join(outWww, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(absPath, dest);
      verbatim++;
    } else {
      writeLogical(outWww, dec.logical, dec.content);
      fromBase++;
    }
  }

  // Phase C: the mod's own full files (data replacements, img, audio, ...),
  // copied verbatim under their logical names.
  let fromMod = 0;
  for (const [logical, srcAbs] of modFull) {
    writeLogical(outWww, logical, fs.readFileSync(srcAbs));
    fromMod++;
  }

  console.log(
    `Self-contained game written to ${opts.out}\n` +
      `  base files (decrypted): ${fromBase}\n` +
      `  patched data files: ${fromPatch}\n` +
      `  mod files added/replaced: ${fromMod}\n` +
      `  base files overridden by mod: ${overridden}\n` +
      (verbatim ? `  copied verbatim (hashed): ${verbatim}\n` : "") +
      `  failed patches: ${failures.length}`,
  );
  if (failures.length && opts.force) process.exit(1);
}

// CLI

function parseArgs(argv) {
  const opts = { force: false, pretty: false, full: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--diff":
        opts.diff = argv[++i];
        break;
      case "--base":
        opts.base = argv[++i];
        break;
      case "--out":
        opts.out = argv[++i];
        break;
      case "--full":
        opts.full = true;
        break;
      case "--force":
        opts.force = true;
        break;
      case "--pretty":
        opts.pretty = true;
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      default:
        throw new Error("unknown argument: " + a);
    }
  }
  return opts;
}

const HELP = `build-jsond-mod.js: flatten a .jsond diff mod against its base game

Usage:
  node build-jsond-mod.js --diff <dir> --base <dir> --out <dir> [options]

  --diff <dir>   The .jsond mod folder (with or without a www/ subdir)
  --base <dir>   Base game the mod targets (decrypted dump, current TCOAAL
                 install, or old .k9a install: all handled)
  --out  <dir>   Output folder (receives a www/ tree)
  --full         Emit a complete self-contained game (whole base + mod) as a
                 plain decrypted dump (logical names). Import via loader.html as
                 the game itself. Use when the mod targets a different version
                 than the one installed. Default (no --full) emits a thin mod.
  --force        Write successes even if some patches fail (skip failed files)
  --pretty       Pretty-print merged JSON (default: compact)
  -h, --help     Show this help
`;

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error("Error: " + e.message + "\n");
    process.stderr.write(HELP);
    process.exit(2);
  }

  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }
  if (!opts.diff || !opts.base || !opts.out) {
    console.error("Error: --diff, --base and --out are all required.\n");
    process.stderr.write(HELP);
    process.exit(2);
  }
  if (!isDir(opts.diff)) {
    console.error("Error: --diff is not a directory: " + opts.diff);
    process.exit(2);
  }
  if (!isDir(opts.base)) {
    console.error("Error: --base is not a directory: " + opts.base);
    process.exit(2);
  }

  const diffRoot = contentRoot(opts.diff);
  const baseRoot = contentRoot(opts.base);
  const outWww = path.join(opts.out, "www");

  if (opts.full) {
    runFull(opts, diffRoot, baseRoot, outWww);
    return;
  }

  const files = walk(diffRoot);
  const writes = []; // { outRel, kind: "json"|"copy", text?, srcAbs? }
  const failures = []; // { rel, reason }
  let patched = 0;
  let copied = 0;

  for (const rel of files) {
    const srcAbs = path.join(diffRoot, rel);

    if (/\.jsond$/i.test(rel)) {
      const targetRel = rel.replace(/\.jsond$/i, ".json");
      const baseText = resolveBaseText(baseRoot, targetRel);
      if (baseText === null) {
        failures.push({ rel, reason: "base file not found: " + targetRel });
        continue;
      }
      let baseObj, ops;
      try {
        baseObj = JSON.parse(baseText);
      } catch (e) {
        failures.push({ rel, reason: "base JSON parse error: " + e.message });
        continue;
      }
      try {
        ops = JSON.parse(fs.readFileSync(srcAbs, "utf8"));
      } catch (e) {
        failures.push({ rel, reason: "patch JSON parse error: " + e.message });
        continue;
      }
      if (!Array.isArray(ops)) {
        failures.push({ rel, reason: "patch is not an array of ops" });
        continue;
      }
      let merged;
      try {
        merged = applyJsonPatch(baseObj, ops);
      } catch (e) {
        failures.push({ rel, reason: "patch failed: " + e.message });
        continue;
      }
      const text = opts.pretty
        ? JSON.stringify(merged, null, 2)
        : JSON.stringify(merged);
      writes.push({ outRel: targetRel, kind: "json", text });
      patched++;
    } else {
      writes.push({ outRel: rel, kind: "copy", srcAbs });
      copied++;
    }
  }

  // Report.
  console.log(
    `Scanned ${files.length} file(s) in ${diffRoot}\n` +
      `  patched (.jsond -> .json): ${patched}\n` +
      `  copied verbatim: ${copied}\n` +
      `  failed: ${failures.length}`,
  );
  if (failures.length) {
    console.error("\nPatch failures:");
    for (const f of failures) console.error(`  - ${f.rel}: ${f.reason}`);
    if (!opts.force) {
      console.error(
        "\nAborting without writing. The base game likely does not match the\n" +
          "version this mod targets. Use --base pointing at the correct version,\n" +
          "or pass --force to write only the files that succeeded.",
      );
      process.exit(1);
    }
    console.error(
      "\n--force: writing successful files only, skipping the above.",
    );
  }

  // Write.
  for (const w of writes) {
    const dest = path.join(outWww, w.outRel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (w.kind === "json") fs.writeFileSync(dest, w.text);
    else fs.copyFileSync(w.srcAbs, dest);
  }

  console.log(`\nWrote mod to ${opts.out} (${writes.length} file(s)).`);
  if (failures.length && opts.force) process.exit(1);
}

main();

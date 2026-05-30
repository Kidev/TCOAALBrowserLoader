#!/usr/bin/env node
/**
 * build-tomb-mod.js: Flatten a Tomb-format mod into a self-contained game.
 *
 * Tomb (codeberg.org/basil/tomb) mods describe their changes in a `mod.json`
 * `files` manifest with several categories, none of which our static browser
 * player can apply at runtime:
 *
 *   dataDeltas   "data/X.jsond"  RFC-6902 JSON Patch over the base "data/X.json".
 *   assets       full files copied verbatim (new maps, images, ...).
 *   imageDeltas  "img/.../X.png.olid"  OLID binary image deltas over a base PNG.
 *   languages    "languages/<lang>.json"  deep-merge deltas over a base language.
 *   plugins      RPG Maker plugins (build-time generators are pre-baked, not shipped).
 *
 * Some mods (e.g. Side Dishes) additionally ship a build-time PIXI image
 * compositor, CanopyImageBuilder, that assembles brand-new images from base
 * game assets (`canopyimagebuilder/input/*.json` instructions + `*.bin.gz`
 * additive patches). That plugin uses Node + a GPU canvas and cannot run in our
 * browser player, so this tool pre-renders its outputs offline.
 *
 * Everything is resolved against a base game and written as a plain, decrypted,
 * self-contained "www/" (logical names: data/Map001.json, img/pictures/foo.png,
 * js/rpg_core.js). Import the result via loader.html as the game itself. This is
 * the only sensible shape for these mods because they target a *different* game
 * version than the one a player has installed.
 *
 * Usage:
 *   node build-tomb-mod.js --diff <dir> --base <dir> --out <dir> [options]
 *
 *   --diff   <dir>   The mod folder (contains mod.json, or a www/ subdir).
 *   --base   <dir>   The base game the mod targets. May be a decrypted dump
 *                    (plain data/X.json), a current TCOAAL install (hashed +
 *                    encrypted), or an old pre-remaster install (data/X.k9a).
 *                    For CanopyImageBuilder mods this MUST be the version the
 *                    instructions reference (old_game for Side Dishes).
 *   --out    <dir>   Output folder. Receives a www/ tree.
 *   --overlay <dir>  Layer another mod folder on top of --diff before building
 *                    (repeatable). Used for translations, which ship extra
 *                    languages and a few replaced assets/patches over the base
 *                    mod. Later overlays win on path collisions.
 *   --thin           Emit a thin overlay (only the mod's resolved files), not a
 *                    whole self-contained game. Relies on the player's installed
 *                    base being the exact version the mod targets.
 *   --force          Write what succeeds even if some patches fail.
 *   --pretty         Pretty-print merged JSON (2-space). Default: compact.
 *   -h, --help       Show this help.
 *
 * Image work (imageDeltas, CanopyImageBuilder) requires the optional
 * "@napi-rs/canvas" package: `npm install @napi-rs/canvas`. Without it those
 * categories are skipped with a warning; data/assets/languages still build.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");

// Optional canvas backend. Loaded lazily so data-only builds work without it.
let _canvas;
function canvas() {
  if (_canvas === undefined) {
    try {
      _canvas = require("@napi-rs/canvas");
    } catch {
      _canvas = null;
    }
  }
  return _canvas;
}

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
 * Decrypt an old-format ".k9a" asset (pre-remaster TCOAAL). Files keep their
 * logical names and use the container [extLen:1][ext:extLen][keyByte:1][payload].
 * The rolling XOR is identical to dekit(), but the mask seed is
 * fileMask(basename-without-extension) & 0xff (NO +1). `logicalRel` supplies
 * that basename (e.g. "data/Map001.json" -> "Map001").
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

// RFC-6902 JSON Patch: strict on array bounds so a patch that doesn't match the
// base fails loudly (the whole point of building offline against the *correct*
// base). Matches the runtime semantics of fast-json-patch closely enough for
// the add/replace/remove/move/copy/test ops these mods use.

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

/** Recursively deep-merge `src` into `dst` (objects merged, everything else
 *  overwritten). Mirrors Tomb's deepMerge for language deltas. */
function deepMerge(dst, src) {
  if (
    typeof dst !== "object" ||
    dst === null ||
    Array.isArray(dst) ||
    typeof src !== "object" ||
    src === null ||
    Array.isArray(src)
  ) {
    return src;
  }
  for (const key of Object.keys(src)) {
    dst[key] = deepMerge(dst[key], src[key]);
  }
  return dst;
}

// Compiled Language Data (CLD) ".loc" files.
//
// The game's own dialogue.loc is a 16-byte signature "00000NEMLEI00000" + a
// uint32-LE JSON length + plain UTF-8 JSON (langName / sysLabel / sysMenus /
// labelLUT / linesLUT / dialogue-hash map). Our browser player, however,
// consumes a mod's language as *plain JSON*: sw.js loadModLangData and
// lang-shim extractModLangData both do JSON.parse(text) on
// "languages/<lang>/dialogue.loc" and require linesLUT/labelLUT. So when we bake
// a mod's "languages/<lang>.json" delta we strip the header, deep-merge, and
// re-emit plain JSON (no header) under that .loc path.

const LOC_SIG = "00000NEMLEI00000"; // 16 bytes

/** Parse a CLD .loc buffer (NEMLEI-wrapped or already plain JSON) -> object. */
function parseLoc(buf) {
  if (
    buf.length >= LOC_SIG.length + 4 &&
    buf.subarray(0, LOC_SIG.length).toString("latin1") === LOC_SIG
  ) {
    const off = LOC_SIG.length;
    const len = buf.readUInt32LE(off);
    return JSON.parse(buf.subarray(off + 4, off + 4 + len).toString("utf8"));
  }
  return JSON.parse(buf.toString("utf8"));
}

// Filesystem helpers

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Pick the content root of a mod/base dir: <dir>/www if present, else <dir>. */
function contentRoot(dir) {
  return isDir(path.join(dir, "www")) ? path.join(dir, "www") : dir;
}

/** Recursively list files under root, returning POSIX-relative paths. */
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

function writeOut(outWww, logical, buf) {
  const dest = path.join(outWww, logical);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

// Base game resolution (decrypted dump / current hashed install / old .k9a)

/**
 * Resolve a logical data path (e.g. "data/Map001.json") against the base game
 * content root, returning decoded UTF-8 text or null if absent.
 */
function resolveBaseText(baseRoot, logicalRel) {
  const buf = resolveBaseBytes(baseRoot, logicalRel);
  return buf === null ? null : buf.toString("utf8");
}

/**
 * Resolve a logical asset path against the base, returning decoded bytes (e.g.
 * the raw PNG/JSON behind a .k9a or hashed+encrypted file) or null if absent.
 */
function resolveBaseBytes(baseRoot, logicalRel) {
  // 1. Plain (decrypted dump).
  const plain = path.join(baseRoot, logicalRel);
  if (isFile(plain)) return fs.readFileSync(plain);

  // 2. Hashed + TCOAAL-encrypted (current game).
  const hashed = hashPath(logicalRel);
  const enc = path.join(baseRoot, hashed);
  if (isFile(enc)) return dekit(fs.readFileSync(enc), hashed);

  // 3. Old ".k9a" (logical name, different container/seed; pre-remaster).
  const k9a = path.join(baseRoot, logicalRel.replace(/\.[^./]+$/, ".k9a"));
  if (isFile(k9a)) return decodeK9a(fs.readFileSync(k9a), logicalRel);

  return null;
}

/**
 * Cheaply determine the logical path of a base-game file without decrypting its
 * body. For ".k9a" the real extension lives in the header; everything else
 * keeps its on-disk name.
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
 * Fully decode a base-game file to its logical path + plaintext content.
 * Returns { logical, content, verbatim } where verbatim means an already-hashed
 * TCOAAL asset whose logical name is unrecoverable (copy as-is).
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

// OLID image deltas: exact port of codeberg.org/basil/OLID.ts applyDiffs.

const TILE = 16;

/** Apply one or more .olid deltas (Buffers) onto a base PNG (Buffer),
 *  returning a PNG Buffer. Deltas store absolute pixels, so this is lossless
 *  against any base. */
async function applyOlid(basePng, olidBufs) {
  const { createCanvas, loadImage, ImageData } = canvas();
  const baseImg = await loadImage(basePng);

  let cvs, ctx;
  let firstW, firstH;

  for (const delta of olidBufs) {
    const dv = new DataView(delta.buffer, delta.byteOffset, delta.byteLength);
    if (dv.getUint32(0) !== 0xfeffd808 || dv.getUint16(4) !== 0xdd21) {
      throw new Error("invalid .olid header");
    }
    const W = dv.getUint32(6);
    const H = dv.getUint32(10);
    if (firstW === undefined) {
      firstW = W;
      firstH = H;
    }

    if (!ctx) {
      cvs = createCanvas(
        Math.ceil(W / TILE) * TILE,
        Math.ceil(H / TILE) * TILE,
      );
      ctx = cvs.getContext("2d");
      ctx.drawImage(baseImg, 0, 0);
    }

    const compLen = dv.getUint32(22);
    const stream = zlib.inflateSync(delta.subarray(26, 26 + compLen));
    const sdv = new DataView(
      stream.buffer,
      stream.byteOffset,
      stream.byteLength,
    );

    let p = 0;
    while (p < stream.byteLength) {
      const tx = sdv.getUint16(p);
      const ty = sdv.getUint16(p + 2);
      const len = sdv.getUint32(p + 4);
      p += 8;
      const tile = stream.subarray(p, p + len);
      p += len;

      const src = ctx.getImageData(tx * TILE, ty * TILE, TILE, TILE);
      // Reinterpret RGBA bytes as little-endian Uint32, matching the canvas
      // semantics the deltas were authored against.
      const u32 = new Uint32Array(src.data.buffer.slice(0));
      let dp = 32; // changed-pixel data follows the 32-byte mask
      for (let i = 0; i < TILE * TILE; i++) {
        if (((tile[i >> 3] >> (i % 8)) & 1) === 1) {
          u32[i] =
            (tile[dp] << 24) +
            (tile[dp + 1] << 16) +
            (tile[dp + 2] << 8) +
            tile[dp + 3];
          dp += 4;
        }
      }
      const out = new ImageData(new Uint8ClampedArray(u32.buffer), TILE, TILE);
      ctx.putImageData(out, tx * TILE, ty * TILE);
    }
  }

  if (!ctx) throw new Error("no .olid deltas supplied");

  // Trim the tile-padded canvas back to the real image size if needed.
  if (cvs.width !== firstW || cvs.height !== firstH) {
    const fc = createCanvas(firstW, firstH);
    fc.getContext("2d").drawImage(cvs, 0, 0);
    cvs = fc;
  }
  return cvs.toBuffer("image/png");
}

// CanopyImageBuilder: offline port of the build-time PIXI compositor.
//
// Faithful reproduction of js/plugins/CanopyImageBuilder.js: each instruction
// JSON assembles a new image from base-game source images via PIXI ops, then
// (optionally) adds a gzipped raw-RGBA patch. Because the patch is
// `target - author's_render`, the assembled base must match pixel-for-pixel;
// the projection/bounding-box quirks below are reproduced deliberately.

// PIXI Matrix (a, b, c, d, tx, ty): maps (x,y) -> (a*x + c*y + tx, b*x + d*y + ty)
function mIdentity() {
  return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
}
function mApply(m, px, py) {
  return { x: m.a * px + m.c * py + m.tx, y: m.b * px + m.d * py + m.ty };
}
// PIXI Matrix.append: this = this * other (other applied first in local space).
function mAppend(m, n) {
  const a1 = m.a,
    b1 = m.b,
    c1 = m.c,
    d1 = m.d;
  return {
    a: n.a * a1 + n.b * c1,
    b: n.a * b1 + n.b * d1,
    c: n.c * a1 + n.d * c1,
    d: n.c * b1 + n.d * d1,
    tx: n.tx * a1 + n.ty * c1 + m.tx,
    ty: n.tx * b1 + n.ty * d1 + m.ty,
  };
}
// createPixiMatrix(arr): matrix.set(arr0, arr3, arr1, arr4, arr2, arr5)
// i.e. PIXI.Matrix.set(a,b,c,d,tx,ty) with b=arr[3], c=arr[1].
function mFromArray(arr) {
  return { a: arr[0], b: arr[3], c: arr[1], d: arr[4], tx: arr[2], ty: arr[5] };
}

// PIXI v4 ColorMatrixFilter helpers (5x4 row-major; offset column unused here).
function cmHue(rotationDeg) {
  const r = (rotationDeg / 180) * Math.PI;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const a = 1 / 3;
  const sq = Math.sqrt(1 / 3);
  return [
    c + (1 - c) * a,
    a * (1 - c) - sq * s,
    a * (1 - c) + sq * s,
    0,
    0,
    a * (1 - c) + sq * s,
    c + a * (1 - c),
    a * (1 - c) - sq * s,
    0,
    0,
    a * (1 - c) - sq * s,
    a * (1 - c) + sq * s,
    c + a * (1 - c),
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
}
function cmSaturate(amount) {
  const x = (amount * 2) / 3 + 1;
  const y = (x - 1) * -0.5;
  return [x, y, y, 0, 0, y, x, y, 0, 0, y, y, x, 0, 0, 0, 0, 0, 1, 0];
}
function cmBrightness(b) {
  return [b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
}

/** Apply a 5x4 color matrix to straight RGBA ImageData in place (0-1 space,
 *  clamped), matching PIXI's per-filter behaviour. */
function applyColorMatrix(data, m) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const a = data[i + 3] / 255;
    const nr = m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4];
    const ng = m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9];
    const nb = m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14];
    const na = m[15] * r + m[16] * g + m[17] * b + m[18] * a + m[19];
    data[i] = Math.max(0, Math.min(255, Math.round(nr * 255)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(ng * 255)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(nb * 255)));
    data[i + 3] = Math.max(0, Math.min(255, Math.round(na * 255)));
  }
}

// GIMP-HSL -> PIXI ColorMatrix approximation, copied from the plugin.
function hslAdjustments(instr) {
  const gimpH = instr.hue || 0;
  const gimpS = instr.saturation || 0;
  const gimpL = instr.lightness || 1;
  return {
    hue: gimpH,
    saturation: 0 + 0.9 * (gimpS / 100) - 0.72 * (gimpL / 100),
    brightness: 1 + 0.581 * (gimpL / 100),
  };
}

// Bounding rect of a mask's non-zero RED pixels. Reproduces the plugin's
// (deliberate) +1 pixel index shift so projectedMaskOffset matches the patch.
function calcBoundingRect(img) {
  let minX = img.width;
  let minY = img.height;
  let maxX = 0;
  let maxY = 0;
  const d = img.data;
  const w = img.width;
  for (let i = 0; i < d.length; i += 4) {
    const xPos = ((i + 4) / 4) % w;
    const yPos = Math.floor((i + 4) / 4 / w);
    if (d[i] > 0) {
      if (xPos < minX) minX = xPos;
      if (xPos > maxX) maxX = xPos;
      if (yPos < minY) minY = yPos;
      if (yPos > maxY) maxY = yPos;
    }
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

// Min projected corner + flip flags. Ported verbatim from the plugin, including
// its quirks, so the assembled base lines up with the precomputed patches.
function calcProjectionOffset(m, w, h) {
  const corners = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ].map((p) => mApply(m, p.x, p.y));
  let isFlippedHorizontally = false;
  let isFlippedVertically = false;
  let minX = null;
  let minY = null;
  for (let index = 0; index < corners.length; index++) {
    const p = corners[index];
    if (minX == null) {
      minX = p.x;
      minY = p.y;
    } else {
      if (p.x < minX) {
        minX = p.x;
        isFlippedHorizontally = index === 1 || index === 3;
      }
      if (p.y < minY) {
        minY = p.Y; // faithful to the original typo (becomes undefined/NaN)
        if (index === 2 || index === 3) isFlippedVertically = true;
        else isFlippedHorizontally = false;
      }
    }
  }
  return {
    x: Math.round(minX),
    y: Math.round(minY),
    isFlippedHorizontally,
    isFlippedVertically,
  };
}

const BLEND_MAP = {
  NORMAL: "source-over",
  ADD: "lighter",
  MULTIPLY: "multiply",
  SCREEN: "screen",
  OVERLAY: "overlay",
  DARKEN: "darken",
  LIGHTEN: "lighten",
  COLOR_DODGE: "color-dodge",
  COLOR_BURN: "color-burn",
  HARD_LIGHT: "hard-light",
  SOFT_LIGHT: "soft-light",
  DIFFERENCE: "difference",
  EXCLUSION: "exclusion",
};

/**
 * Process one CanopyImageBuilder instruction file into a PNG Buffer.
 *   instr       parsed instruction JSON
 *   sources     Map<imgName, {canvas,ctx,data,width,height}> base source images
 *   masks       Map<maskName, ImageData> loaded mask images
 *   patchBytes  optional Uint8Array (raw RGBA additive patch), or null
 */
function buildCanopyImage(instr, sources, masks, patchBytes) {
  const { createCanvas, ImageData } = canvas();
  const out = createCanvas(instr.imgSize.width, instr.imgSize.height);
  const octx = out.getContext("2d");

  // A "selection" captures the intrinsic sprite pixels (crop, with optional
  // mask baked into alpha) plus the geometry/mask metadata needed at paste.
  let sel = null;

  function selectRect(imgName, x, y, w, h) {
    const src = sources.get(imgName);
    x = x || 0;
    y = y || 0;
    w = w || src.width;
    h = h || src.height;
    const c = createCanvas(w, h);
    c.getContext("2d").putImageData(
      new ImageData(
        new Uint8ClampedArray(src.ctx.getImageData(x, y, w, h).data),
        w,
        h,
      ),
      0,
      0,
    );
    sel = { canvas: c, width: w, height: h, maskRect: null };
  }

  function selectMask(imgName, maskName) {
    const src = sources.get(imgName);
    const mask = masks.get(maskName);
    const w = src.width;
    const h = src.height;
    // Full source image, alpha multiplied by mask red (PIXI SpriteMaskFilter:
    // original *= mask.r * mask.a; masks here are fully opaque).
    const id = src.ctx.getImageData(0, 0, w, h);
    const d = id.data;
    const md = mask.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i + 3] = Math.round((d[i + 3] * md[i]) / 255);
    }
    const c = createCanvas(w, h);
    c.getContext("2d").putImageData(id, 0, 0);
    sel = { canvas: c, width: w, height: h, maskRect: calcBoundingRect(mask) };
  }

  let transform = mIdentity();
  let colorAdj = null;
  let alpha = null;
  let blend = null;

  function paste(ix, iy) {
    ix = ix || 0;
    iy = iy || 0;
    const proj = calcProjectionOffset(transform, sel.width, sel.height);
    let maskOffX = 0;
    let maskOffY = 0;
    if (sel.maskRect) {
      let mx = sel.maskRect.x;
      let my = sel.maskRect.y;
      if (proj.isFlippedHorizontally) {
        mx = sel.maskRect.x + sel.maskRect.width - sel.width;
      }
      if (proj.isFlippedVertically) {
        my = sel.maskRect.y + sel.maskRect.height - sel.height;
      }
      const pm = mApply(transform, mx, my);
      maskOffX = pm.x;
      maskOffY = pm.y;
    }
    const m = {
      ...transform,
      tx: transform.tx + ix - proj.x - maskOffX,
      ty: transform.ty + iy - proj.y - maskOffY,
    };

    // Build the per-paste sprite (color filters are non-destructive in PIXI,
    // so apply them to a copy of the intrinsic selection).
    let spriteCanvas = sel.canvas;
    if (colorAdj) {
      const sc = createCanvas(sel.width, sel.height);
      const sctx = sc.getContext("2d");
      sctx.drawImage(sel.canvas, 0, 0);
      const id = sctx.getImageData(0, 0, sel.width, sel.height);
      applyColorMatrix(id.data, cmHue(colorAdj.hue));
      applyColorMatrix(id.data, cmSaturate(colorAdj.saturation));
      applyColorMatrix(id.data, cmBrightness(colorAdj.brightness));
      sctx.putImageData(id, 0, 0);
      spriteCanvas = sc;
    }

    octx.save();
    octx.globalAlpha = alpha == null ? 1 : alpha;
    octx.globalCompositeOperation = blend || "source-over";
    octx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
    // Exact texel copy for axis-aligned integer placement; smooth otherwise.
    const integer =
      Math.abs(m.a) === 1 &&
      Math.abs(m.d) === 1 &&
      m.b === 0 &&
      m.c === 0 &&
      Number.isInteger(m.tx) &&
      Number.isInteger(m.ty);
    octx.imageSmoothingEnabled = !integer;
    if ("imageSmoothingQuality" in octx) octx.imageSmoothingQuality = "high";
    octx.drawImage(spriteCanvas, 0, 0);
    octx.restore();
  }

  for (const sectionKey of Object.keys(instr.sections)) {
    for (const ins of instr.sections[sectionKey]) {
      const action = ins.action.toUpperCase();
      switch (action) {
        case "SELECT_RECT":
          selectRect(ins.imgName, ins.x, ins.y, ins.width, ins.height);
          transform = mIdentity();
          colorAdj = null;
          alpha = null;
          blend = null;
          break;
        case "SELECT_MASK":
          selectMask(ins.imgName, ins.maskName);
          transform = mIdentity();
          colorAdj = null;
          alpha = null;
          blend = null;
          break;
        case "PASTE":
          paste(ins.x, ins.y);
          break;
        case "RESET_PROJECTIONS":
          transform = mIdentity();
          colorAdj = null;
          break;
        case "TRANSFORM":
          transform = mAppend(transform, mFromArray(ins.matrix));
          break;
        case "FLIP":
          if (ins.direction.toLowerCase() === "horizontal") {
            transform = mAppend(transform, mFromArray([-1, 0, 0, 0, 1, 0]));
          } else if (ins.direction.toLowerCase() === "vertical") {
            transform = mAppend(transform, mFromArray([1, 0, 0, 0, -1, 0]));
          } else {
            throw new Error("FLIP direction invalid: " + ins.direction);
          }
          break;
        case "SCALE":
          transform = mAppend(
            transform,
            mFromArray([ins.scalefactor, 0, 0, 0, ins.scalefactor, 0]),
          );
          break;
        case "ADJUST_HSL":
          colorAdj = hslAdjustments(ins);
          break;
        case "ALPHA":
          alpha = ins.multiplier;
          break;
        case "BLEND_MODE":
          blend = BLEND_MAP[ins.blendMode.toUpperCase()] || "source-over";
          break;
        default:
          throw new Error("unknown CanopyImageBuilder action: " + ins.action);
      }
    }
  }

  // Additive RGBA patch (out[i] = (patch[i] + base[i]) & 0xff), exactly as the
  // plugin combines a base render with a *.bin.gz patch.
  if (patchBytes) {
    const id = octx.getImageData(0, 0, out.width, out.height);
    const d = id.data;
    const n = Math.min(d.length, patchBytes.length);
    for (let i = 0; i < n; i++) d[i] = (patchBytes[i] + d[i]) & 0xff;
    octx.putImageData(id, 0, 0);
  }

  return out.toBuffer("image/png");
}

/** Load a base-game source image (referenced by a CanopyImageBuilder
 *  instruction, e.g. "/img/characters/Actor2.k9a") into a canvas. */
async function loadCanopySource(baseRoot, srcPath) {
  const { createCanvas, loadImage } = canvas();
  const rel = srcPath.replace(/^\//, "");
  let bytes = null;
  // Source paths are written with the on-disk ".k9a" extension; decode those
  // directly so we don't hand the raw encrypted container to loadImage.
  const abs = path.join(baseRoot, rel);
  if (/\.k9a$/i.test(rel) && isFile(abs)) {
    bytes = decodeK9a(fs.readFileSync(abs), rel);
  } else {
    bytes = resolveBaseBytes(baseRoot, rel);
  }
  if (bytes === null) throw new Error("source not found in base: " + srcPath);
  const img = await loadImage(bytes);
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { canvas: c, ctx, width: img.width, height: img.height };
}

/** Load a mask/local PNG from the mod's canopyimagebuilder/input folder. */
async function loadLocalImageData(absPath) {
  const { createCanvas, loadImage } = canvas();
  const img = await loadImage(fs.readFileSync(absPath));
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

// Mod manifest assembly (with overlays)

const FILE_CATEGORIES = [
  "assets",
  "dataDeltas",
  "imageDeltas",
  "languages",
  "plugins",
];

/**
 * Build a layered view of the mod: the --diff mod plus any --overlay mods on
 * top. Returns { manifest, resolve(relPath) -> absPath|null, canopyInputDir }.
 * Later layers win on path collisions; manifest file lists are unioned.
 */
function assembleMod(diffDir, overlayDirs) {
  const layers = [diffDir, ...overlayDirs].map((dir) => {
    const root = contentRoot(dir);
    const manifestPath = isFile(path.join(dir, "mod.json"))
      ? path.join(dir, "mod.json")
      : isFile(path.join(root, "mod.json"))
        ? path.join(root, "mod.json")
        : null;
    let manifest = null;
    if (manifestPath) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    }
    return { dir, root, manifest };
  });

  // Legacy fallback: a mod with no mod.json (e.g. an older .jsond-only overhaul
  // like MOE). Synthesize a manifest by walking the content root: .jsond files
  // become dataDeltas, everything else is a verbatim asset: so the rest of the
  // pipeline treats it identically to a manifest mod.
  const anyManifest = layers.some((l) => l.manifest);
  if (!anyManifest) {
    for (const layer of layers) {
      layer.manifest = { files: { dataDeltas: [], assets: [] } };
      for (const rel of walk(layer.root)) {
        if (/\.jsond$/i.test(rel)) layer.manifest.files.dataDeltas.push(rel);
        else layer.manifest.files.assets.push(rel);
      }
    }
  }

  const merged = { files: {} };
  for (const cat of FILE_CATEGORIES) merged.files[cat] = [];
  for (const layer of layers) {
    if (!layer.manifest || !layer.manifest.files) continue;
    for (const cat of FILE_CATEGORIES) {
      for (const f of layer.manifest.files[cat] || []) {
        if (!merged.files[cat].includes(f)) merged.files[cat].push(f);
      }
    }
    // Carry identity from the base (first) manifest.
    for (const k of ["id", "name", "version", "authors", "description"]) {
      if (merged[k] === undefined && layer.manifest[k] !== undefined) {
        merged[k] = layer.manifest[k];
      }
    }
  }

  /** Resolve a mod-relative file to an absolute path, last layer first. */
  function resolve(relPath) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const abs = path.join(layers[i].root, relPath);
      if (isFile(abs)) return abs;
    }
    return null;
  }

  /** Every layer's copy of a mod-relative file, base-first (for deep-merging
   *  e.g. language deltas across a mod and its translation overlays). */
  function resolveAll(relPath) {
    const out = [];
    for (const layer of layers) {
      const abs = path.join(layer.root, relPath);
      if (isFile(abs)) out.push(abs);
    }
    return out;
  }

  /** All canopyimagebuilder/input dirs that exist, base-first. */
  function canopyInputDirs() {
    const dirs = [];
    for (const layer of layers) {
      const cand = path.join(layer.root, "canopyimagebuilder", "input");
      if (isDir(cand)) dirs.push(cand);
    }
    return dirs;
  }

  return { manifest: merged, layers, resolve, resolveAll, canopyInputDirs };
}

// Orchestration

async function build(opts) {
  const baseRoot = contentRoot(opts.base);
  const outWww = path.join(opts.out, "www");
  const mod = assembleMod(opts.diff, opts.overlays);
  const files = mod.manifest.files;
  const haveCanvas = !!canvas();

  const stats = {
    base: 0,
    verbatim: 0,
    assets: 0,
    dataDeltas: 0,
    imageDeltas: 0,
    canopy: 0,
    languages: 0,
  };
  const failures = [];

  // Logical paths the mod fully provides (skip the base copy for these).
  const assetSet = new Set(files.assets.map((p) => p.replace(/^\//, "")));
  // data/X.jsond -> data/X.json target.
  const dataTargets = new Map(); // logical json -> mod-relative .jsond path
  for (const d of files.dataDeltas) {
    dataTargets.set(d.replace(/^\//, "").replace(/\.jsond$/i, ".json"), d);
  }

  // Resolve dataDeltas against the base (validate before writing).
  const patchedData = new Map(); // logical -> Buffer
  for (const [target, rel] of dataTargets) {
    const baseText = resolveBaseText(baseRoot, target);
    if (baseText === null) {
      failures.push({ rel, reason: "base file not found: " + target });
      continue;
    }
    const patchAbs = mod.resolve(rel);
    if (!patchAbs) {
      failures.push({ rel, reason: "delta file missing from mod" });
      continue;
    }
    try {
      const baseObj = JSON.parse(baseText);
      const ops = JSON.parse(fs.readFileSync(patchAbs, "utf8"));
      if (!Array.isArray(ops)) throw new Error("patch is not an array of ops");
      const merged = applyJsonPatch(baseObj, ops);
      patchedData.set(
        target,
        Buffer.from(
          opts.pretty
            ? JSON.stringify(merged, null, 2)
            : JSON.stringify(merged),
          "utf8",
        ),
      );
    } catch (e) {
      failures.push({ rel, reason: "patch failed: " + e.message });
    }
  }

  if (failures.length && !opts.force) {
    reportFailures(failures);
    console.error(
      "\nAborting without writing. The --base game likely does not match the\n" +
        "version this mod targets. Point --base at the correct version (old_game\n" +
        "for Side Dishes), or pass --force to write what succeeds.",
    );
    process.exit(1);
  }

  // Phase 1: base game (only in full mode).
  if (!opts.thin) {
    for (const rel of walk(baseRoot)) {
      const absPath = path.join(baseRoot, rel);
      const logical = baseLogical(absPath, rel);
      if (assetSet.has(logical)) continue; // mod replaces it wholesale
      if (patchedData.has(logical)) {
        writeOut(outWww, logical, patchedData.get(logical));
        stats.dataDeltas++;
        continue;
      }
      const dec = decodeBaseFile(absPath, rel);
      if (dec.verbatim) {
        const dest = path.join(outWww, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(absPath, dest);
        stats.verbatim++;
      } else {
        writeOut(outWww, dec.logical, dec.content);
        stats.base++;
      }
    }
  } else {
    // Thin mode: write patched data only (base is the player's install).
    for (const [logical, buf] of patchedData) {
      writeOut(outWww, logical, buf);
      stats.dataDeltas++;
    }
  }

  // Phase 2: verbatim assets.
  for (const rel of files.assets) {
    const logical = rel.replace(/^\//, "");
    const abs = mod.resolve(logical);
    if (!abs) {
      failures.push({ rel, reason: "asset missing from mod" });
      continue;
    }
    writeOut(outWww, logical, fs.readFileSync(abs));
    stats.assets++;
  }

  // Phase 3: image deltas (.olid).
  if (files.imageDeltas.length) {
    if (!haveCanvas) {
      warnNoCanvas("imageDeltas");
    } else {
      for (const rel of files.imageDeltas) {
        const logical = rel.replace(/^\//, ""); // img/.../X.png.olid
        const targetLogical = logical.replace(/\.olid$/i, ""); // img/.../X.png
        const olidAbs = mod.resolve(logical);
        if (!olidAbs) {
          failures.push({ rel, reason: "olid missing from mod" });
          continue;
        }
        // Base PNG: prefer what we already wrote, else decode from base.
        let basePng = null;
        const written = path.join(outWww, targetLogical);
        if (isFile(written)) basePng = fs.readFileSync(written);
        else basePng = resolveBaseBytes(baseRoot, targetLogical);
        if (basePng === null) {
          failures.push({
            rel,
            reason: "base image not found: " + targetLogical,
          });
          continue;
        }
        try {
          const png = await applyOlid(basePng, [fs.readFileSync(olidAbs)]);
          writeOut(outWww, targetLogical, png);
          stats.imageDeltas++;
        } catch (e) {
          failures.push({ rel, reason: "olid apply failed: " + e.message });
        }
      }
    }
  }

  // Phase 4: CanopyImageBuilder generated images.
  const canopyDirs = mod.canopyInputDirs();
  if (canopyDirs.length) {
    if (!haveCanvas) {
      warnNoCanvas("CanopyImageBuilder images");
    } else {
      await runCanopy(canopyDirs, baseRoot, outWww, stats, failures);
    }
  }

  // Phase 5: language deltas baked into plain-JSON dialogue.loc.
  // For each "languages/<lang>.json" delta, deep-merge it over the base game's
  // "languages/<lang>/dialogue.loc" CLD (and over every overlay layer's delta),
  // then write the result as a *plain JSON* dialogue.loc that the player's
  // loadModLangData / extractModLangData parse directly. This is what makes the
  // mod's new/changed text actually resolve at runtime (labels like
  // canopyLabel1HubStoveMS1, new dialogue lines, the retitled game).
  for (const rel of files.languages) {
    const logical = rel.replace(/^\//, ""); // languages/<lang>.json
    const lang = path.basename(logical).replace(/\.json$/i, "");
    const sources = mod.resolveAll(logical);
    if (!sources.length) {
      failures.push({ rel, reason: "language delta missing from mod" });
      continue;
    }
    try {
      // Start from the base CLD when present (so unchanged lines survive),
      // otherwise from an empty object (a brand-new language).
      const baseLoc = resolveBaseBytes(
        baseRoot,
        "languages/" + lang + "/dialogue.loc",
      );
      let cld = baseLoc !== null ? parseLoc(baseLoc) : {};
      for (const abs of sources) {
        cld = deepMerge(cld, JSON.parse(fs.readFileSync(abs, "utf8")));
      }
      const locPath = "languages/" + lang + "/dialogue.loc";
      writeOut(
        outWww,
        locPath,
        Buffer.from(
          opts.pretty ? JSON.stringify(cld, null, 2) : JSON.stringify(cld),
          "utf8",
        ),
      );
      stats.languages++;
    } catch (e) {
      failures.push({ rel, reason: "language bake failed: " + e.message });
    }
  }

  // Optional: mod-list icon.
  if (opts.icon) {
    if (!isFile(opts.icon)) {
      failures.push({ rel: opts.icon, reason: "--icon file not found" });
    } else {
      writeOut(outWww, "img/icon.png", fs.readFileSync(opts.icon));
      stats.icon = true;
    }
  }

  // Report.
  console.log(
    `\n${opts.thin ? "Thin mod" : "Self-contained game"} written to ${opts.out}\n` +
      (opts.thin ? "" : `  base files (decrypted): ${stats.base}\n`) +
      (stats.verbatim
        ? `  copied verbatim (hashed): ${stats.verbatim}\n`
        : "") +
      `  data deltas (.jsond): ${stats.dataDeltas}\n` +
      `  assets (verbatim): ${stats.assets}\n` +
      `  image deltas (.olid): ${stats.imageDeltas}\n` +
      `  CanopyImageBuilder images: ${stats.canopy}\n` +
      `  languages baked (dialogue.loc): ${stats.languages}\n` +
      (stats.icon ? `  mod icon: img/icon.png\n` : "") +
      (files.plugins.length
        ? `  plugins skipped (build-time/inert in browser): ${files.plugins.length}\n`
        : "") +
      `  failures: ${failures.length}`,
  );
  if (failures.length) {
    reportFailures(failures);
    if (opts.force) process.exit(1);
  }
}

async function runCanopy(canopyDirs, baseRoot, outWww, stats, failures) {
  // Collect instruction files across layers (later dirs win by filename).
  const instrByName = new Map(); // fileName -> {dir}
  for (const dir of canopyDirs) {
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json") || name === "!_managedImages.json") continue;
      instrByName.set(name, dir);
    }
  }
  // Resolve a local input file (mask/patch) preferring later layers.
  function resolveInput(fileName) {
    for (let i = canopyDirs.length - 1; i >= 0; i--) {
      const abs = path.join(canopyDirs[i], fileName);
      if (isFile(abs)) return abs;
    }
    return null;
  }

  // Cache decoded base sources across instruction files.
  const sourceCache = new Map();
  async function getSource(srcPath) {
    if (!sourceCache.has(srcPath)) {
      sourceCache.set(srcPath, await loadCanopySource(baseRoot, srcPath));
    }
    return sourceCache.get(srcPath);
  }

  for (const [fileName, dir] of instrByName) {
    const name = path.parse(fileName).name;
    let instr;
    try {
      instr = JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf8"));
    } catch (e) {
      failures.push({
        rel: fileName,
        reason: "instruction parse: " + e.message,
      });
      continue;
    }
    try {
      const sources = new Map();
      for (const key of Object.keys(instr.sourceImages || {})) {
        sources.set(key, await getSource(instr.sourceImages[key]));
      }
      const masks = new Map();
      for (const key of Object.keys(instr.masks || {})) {
        const abs = resolveInput(instr.masks[key]);
        if (!abs) throw new Error("mask not found: " + instr.masks[key]);
        masks.set(key, await loadLocalImageData(abs));
      }
      let patchBytes = null;
      if (instr.patch && instr.patch.patchFileName) {
        const abs = resolveInput(instr.patch.patchFileName);
        if (abs)
          patchBytes = new Uint8Array(zlib.gunzipSync(fs.readFileSync(abs)));
      }
      const png = buildCanopyImage(instr, sources, masks, patchBytes);
      const dest =
        (instr.outputDestination || "/img/pictures/").replace(/^\//, "") +
        name +
        ".png";
      writeOut(outWww, dest, png);
      stats.canopy++;
    } catch (e) {
      failures.push({ rel: fileName, reason: "canopy build: " + e.message });
    }
  }
}

function warnNoCanvas(what) {
  console.warn(
    `! Skipping ${what}: the "@napi-rs/canvas" package is not installed.\n` +
      `  Run \`npm install @napi-rs/canvas\` and re-run to include these.`,
  );
}

function reportFailures(failures) {
  if (!failures.length) return;
  console.error("\nFailures:");
  for (const f of failures) console.error(`  - ${f.rel}: ${f.reason}`);
}

// CLI

function parseArgs(argv) {
  const opts = { overlays: [], thin: false, force: false, pretty: false };
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
      case "--overlay":
        opts.overlays.push(argv[++i]);
        break;
      case "--icon":
        opts.icon = argv[++i];
        break;
      case "--thin":
        opts.thin = true;
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

const HELP = `build-tomb-mod.js: flatten a Tomb-format mod into a self-contained game

Usage:
  node build-tomb-mod.js --diff <dir> --base <dir> --out <dir> [options]

  --diff    <dir>  The mod folder (contains mod.json, or a www/ subdir)
  --base    <dir>  Base game the mod targets (decrypted dump, current TCOAAL
                   install, or old .k9a install: all handled). For
                   CanopyImageBuilder mods this must be the referenced version.
  --out     <dir>  Output folder (receives a www/ tree)
  --overlay <dir>  Layer another mod folder on top of --diff (repeatable, e.g.
                   a translation). Later overlays win on path collisions.
  --icon    <img>  Copy this image to www/img/icon.png as the mod-list icon
  --thin           Emit a thin overlay (mod files only), not a whole game
  --force          Write what succeeds even if some patches fail
  --pretty         Pretty-print merged JSON (default: compact)
  -h, --help       Show this help

Handles every mod.json files category: dataDeltas (.jsond JSON Patch), assets
(verbatim), imageDeltas (.olid), languages (baked into plain-JSON dialogue.loc),
plus offline-rendered CanopyImageBuilder images. Image categories need:
npm install @napi-rs/canvas
`;

async function main() {
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
  for (const d of [opts.diff, opts.base, ...opts.overlays]) {
    if (!isDir(d)) {
      console.error("Error: not a directory: " + d);
      process.exit(2);
    }
  }
  await build(opts);
}

// Run as a CLI, or expose the engine when required as a module (build-tomb-
// translation.js reuses the crypto, CanopyImageBuilder and CLD helpers).
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = {
  canvas,
  hashPath,
  fileMask,
  decodeK9a,
  dekit,
  deepMerge,
  parseLoc,
  LOC_SIG,
  applyJsonPatch,
  isDir,
  isFile,
  contentRoot,
  walk,
  writeOut,
  resolveBaseBytes,
  resolveBaseText,
  applyOlid,
  buildCanopyImage,
  loadCanopySource,
  loadLocalImageData,
};

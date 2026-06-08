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
 * decode.js: decrypt/decode a single logical file (or dump map names) from any
 * version of the game, for inspection.
 *
 * Resolves a logical path (e.g. "data/MapInfos.json") against the game folder
 * regardless of how that version stores it: old ".k9a", remaster
 * hashed+TCOAAL (data/<hash>), or a plain dump: using build-tomb-mod.js's
 * crypto helpers, and prints/writes the plaintext.
 *
 * Handy for finding the last version that still ships a named MapInfos.json.
 *
 * Usage:
 *   node tools/decode.js <gameDir> <logicalPath> [--out <file>]
 *   node tools/decode.js <gameDir> --names        # dump MapInfos id -> name
 *
 * Examples:
 *   node tools/decode.js depot_2378901 data/MapInfos.json
 *   node tools/decode.js .hide/current_game --names
 *   node tools/decode.js old_game img/titles1/title.png --out /tmp/title.png
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { hashPath, fileMask, dekit, decodeK9a } = require("./build-tomb-mod.js");

/** Accepts a `www` folder or a game folder containing one. */
function resolveWww(input) {
  if (fs.existsSync(path.join(input, "data"))) return input;
  if (fs.existsSync(path.join(input, "www", "data"))) {
    return path.join(input, "www");
  }
  return input;
}

// Old pre-remaster "XORENCODE"-era depots (e.g. the Ep1 builds) keep files under
// their LOGICAL names (data/MapInfos.json) but encrypt the bytes with the same
// rolling XOR as .k9a: seeded by fileMask(basename) & 0xff (no +1): over a
// binary header followed by the JSON. The header replaces the value's opening
// bracket (and, for objects, the first key), so the decrypted stream is the JSON
// body sans its leading `[`/`{`. The cipher self-synchronizes on ciphertext, so
// the body decrypts correctly regardless of the exact seed.

/** Rolling-XOR decrypt a whole logical-name file (old XORENCODE format). */
function decodeOldXor(buf, logical) {
  const base = logical
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "");
  let mask = fileMask(base) & 0xff;
  const out = Buffer.allocUnsafe(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    out[i] = b ^ mask;
    mask = ((mask << 1) ^ b) & 0xff;
  }
  return out;
}

/** Does `buf` already start (after whitespace) with a JSON value? */
function looksLikeJson(buf) {
  for (let i = 0; i < Math.min(buf.length, 64); i++) {
    const c = buf[i];
    if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) continue;
    return c === 0x7b || c === 0x5b; // { or [
  }
  return false;
}

/** Index after a balanced {...}/[...] value beginning at `i`, or -1. String-aware. */
function balancedEnd(s, i) {
  const open = s[i];
  if (open !== "{" && open !== "[") return -1;
  let depth = 0,
    inStr = false,
    esc = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return j + 1;
    }
  }
  return -1;
}

/**
 * Recover a JSON value from a (possibly old-XOR-decoded) buffer whose leading
 * bracket may be replaced by a binary header. Returns the parsed value or null.
 * Handles: clean JSON; a complete {...}/[...] whose close is the final bracket; and
 * a bracket-less array ("{...},{...},...]") which is re-wrapped with a leading "[".
 */
function recoverJson(buf) {
  const s = buf.toString("utf8");
  try {
    return JSON.parse(s);
  } catch (_) {
    /* not clean */
  }
  const lastClose = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastClose < 0) return null;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{" || s[i] === "[") {
      if (balancedEnd(s, i) === lastClose + 1) {
        try {
          return JSON.parse(s.slice(i, lastClose + 1));
        } catch (_) {
          /* keep scanning */
        }
      }
    }
  }
  if (s[lastClose] === "]") {
    for (
      let i = s.indexOf("{");
      i >= 0 && i < lastClose;
      i = s.indexOf("{", i + 1)
    ) {
      try {
        return JSON.parse("[" + s.slice(i, lastClose + 1));
      } catch (_) {
        /* keep scanning */
      }
    }
  }
  return null;
}

/**
 * Decode a logical file from any game layout, returning plaintext bytes or null.
 *
 * Order matters: some versions ship BOTH an old ".k9a" (cleanly decodable) and
 * an encrypted ".json" of the same name, so the ".k9a" is tried first; then the
 * remaster hashed+TCOAAL store; then a plain on-disk file (already-decrypted
 * dumps, or assets that aren't transformed).
 */
function decode(www, logical) {
  const k9a = path.join(www, logical.replace(/\.[^./]+$/, ".k9a"));
  if (fs.existsSync(k9a)) return decodeK9a(fs.readFileSync(k9a), logical);

  const hp = hashPath(logical);
  const hashed = path.join(www, hp);
  if (fs.existsSync(hashed)) return dekit(fs.readFileSync(hashed), hp);

  const plain = path.join(www, logical);
  if (fs.existsSync(plain)) {
    const buf = fs.readFileSync(plain);
    // A plain decrypted dump passes through; an old XORENCODE-era depot keeps
    // logical names but encrypts the bytes, so roll-decrypt those.
    if (/\.(json|loc)$/i.test(logical) && !looksLikeJson(buf)) {
      return decodeOldXor(buf, logical);
    }
    return buf;
  }

  return null;
}

function usage() {
  console.log(
    "Usage:\n" +
      "  node tools/decode.js <gameDir> <logicalPath> [--out <file>]\n" +
      "  node tools/decode.js <gameDir> --names\n",
  );
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 2 || argv.includes("-h") || argv.includes("--help")) {
    usage();
    process.exit(argv.length < 2 ? 1 : 0);
  }

  const www = resolveWww(argv[0]);
  if (!fs.existsSync(path.join(www, "data"))) {
    console.error(`No data/ folder under: ${argv[0]}`);
    process.exit(1);
  }

  // --names: decode MapInfos and print the id -> name table.
  if (argv.includes("--names")) {
    const buf = decode(www, "data/MapInfos.json");
    if (!buf) {
      console.error("Could not resolve data/MapInfos.json in this version.");
      process.exit(1);
    }
    let infos;
    try {
      infos = JSON.parse(buf.toString("utf8"));
    } catch (e) {
      // Old XORENCODE-era depots drop the array's leading "[" into a binary
      // header; recover the value before giving up.
      infos = recoverJson(buf);
      if (!Array.isArray(infos)) {
        console.error("MapInfos.json is not valid JSON:", e.message);
        process.exit(1);
      }
    }
    let named = 0;
    for (const e of infos) {
      if (!e) continue;
      const name = e.name || "";
      if (name) named++;
      console.log(String(e.id).padStart(4) + "  " + name);
    }
    console.error(
      `\n${infos.filter(Boolean).length} maps, ${named} with a non-empty name.`,
    );
    return;
  }

  // <logicalPath>: decode one file.
  const logical = argv[1].replace(/\\/g, "/");
  const outIdx = argv.indexOf("--out");
  const outFile = outIdx >= 0 ? argv[outIdx + 1] : null;

  const buf = decode(www, logical);
  if (!buf) {
    console.error(`Could not resolve ${logical} in this version.`);
    process.exit(1);
  }

  if (outFile) {
    fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
    fs.writeFileSync(outFile, buf);
    console.error(`Wrote ${buf.length} bytes to ${outFile}`);
  } else {
    // Print as text (data/JSON/txt). Pretty-print JSON when possible; for old
    // XORENCODE-era files recover the value past the binary header.
    const text = buf.toString("utf8");
    try {
      process.stdout.write(JSON.stringify(JSON.parse(text), null, 2) + "\n");
    } catch (e) {
      const recovered = recoverJson(buf);
      if (recovered !== null) {
        process.stdout.write(JSON.stringify(recovered, null, 2) + "\n");
      } else {
        process.stdout.write(text);
      }
    }
  }
}

main();

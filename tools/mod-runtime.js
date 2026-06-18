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
const { walk } = require("./build-tomb-mod.js");

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

module.exports = { applyTcoaalmod, inspect, readZip, contentTag };

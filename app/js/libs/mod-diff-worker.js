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
"use strict";

// Real Web Worker only: pulls in TcoaalCodec (dekit/enkit/isEncrypted) and
// JsonDiff (diff), both consumed below. Guarded so this file still loads
// under vm.runInContext in tools/test-create.js, which has neither
// importScripts nor a worker global scope; the test harness loads those two
// files into the same context itself instead (see loadLib() there).
if (typeof importScripts === "function") {
  importScripts("/js/libs/tcoaal-codec.js", "/js/libs/json-diff.js");
}

/*
 * The mod diff engine. Compares two SHIPPED game trees (hashed + encrypted as
 * the game stores them) and emits the modder's changes only: unchanged base
 * files cancel out and never reach the output, and a changed data file travels
 * as a JSON patch rather than as a copy of the original. That is what makes
 * the output copyright-safe by construction.
 *
 * This file holds only the pure comparison core (ModDiff), consumed by
 * app/create.html through a Web Worker. It does not import ModPackage and
 * must never build or know about the .tcoaalmod container: the worker
 * message handler that drives this from postMessage calls (added below this
 * IIFE by a later task) hands its output back to the main thread, which packs
 * it.
 */
(function (root) {
  var C = root.TcoaalCodec;
  var J = root.JsonDiff;

  var STD_SYSTEM = "data/be1a37535e921f91"; // hashPath("data/System.json")

  async function sha16(bytes) {
    var buf = await crypto.subtle.digest("SHA-256", bytes);
    return Array.prototype.map
      .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); })
      .join("")
      .slice(0, 16);
  }

  function sameBytes(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function tryJson(bytes) {
    if (bytes.length === 0) return undefined;
    var c = bytes[0];
    if (c !== 0x7b && c !== 0x5b) return undefined; // not '{' or '['
    try {
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) {
      return undefined;
    }
  }

  async function addPayload(payloads, bytes) {
    var h = await sha16(bytes);
    var key = "f/" + h;
    if (!payloads.has(key)) payloads.set(key, bytes);
    return key;
  }

  function encFields(raw) {
    var enc = C.isEncrypted(raw);
    return enc ? { enc: true, key: C.readKeyByte(raw) } : { enc: false };
  }

  // Rule order (see task brief):
  //  1. mod side missing              -> delete
  //  2. (both present sides get decrypted below, using rel as the hashed path)
  //  3. base side missing             -> verbatim, enc/key from the MOD header
  //  4. decrypted bytes identical     -> null (drop; nothing enters payloads)
  //  5. both decrypt to parseable JSON -> patch, enc/key from the BASE header
  //     (the loader re-encrypts a patched file using the base file's own
  //     convention, so the patch entry must carry the base's enc/key)
  //  6. otherwise                     -> verbatim, enc/key from the MOD header
  async function classify(rel, baseRaw, modRaw, payloads) {
    if (modRaw == null) return { rel: rel, type: "delete" };

    if (baseRaw == null) {
      var f = encFields(modRaw);
      var plainNew = C.dekit(modRaw, rel);
      return Object.assign({ rel: rel }, f, {
        type: "verbatim",
        payload: await addPayload(payloads, plainNew),
      });
    }

    // Comparison MUST happen on decrypted bytes: two files can be
    // byte-identical after decryption while differing on disk (a different
    // keyByte produces a different ciphertext for the same plaintext).
    // Diffing raw bytes here would wrongly emit an entry for an unchanged
    // file, i.e. leak base-game content into the package.
    var basePlain = C.dekit(baseRaw, rel);
    var modPlain = C.dekit(modRaw, rel);
    if (sameBytes(basePlain, modPlain)) return null;

    var a = tryJson(basePlain);
    var b = tryJson(modPlain);
    if (a !== undefined && b !== undefined) {
      var ops = J.diff(a, b);
      // Zero ops means the two sides parse to the same document and only the
      // serialization differs (key order, whitespace, a re-save by the
      // modder's editor). Rule 4 could not see that, because it compares
      // bytes. Drop it here for the same reason: the file did not change.
      if (ops.length === 0) return null;
      var baseF = encFields(baseRaw);
      return Object.assign({ rel: rel }, baseF, { type: "patch", ops: ops });
    }

    var modF = encFields(modRaw);
    return Object.assign({ rel: rel }, modF, {
      type: "verbatim",
      payload: await addPayload(payloads, modPlain),
    });
  }

  /*
   * The shipped notices: the copyright, credits and EULA documents sitting
   * directly in www.
   *
   * These never belong in a mod. The game hashes one of them on boot and
   * refuses to start if it changed ("Game files corrupted"), and it takes
   * nothing more than a checkout with core.autocrlf to rewrite the line
   * endings of a file no modder ever opened. Diffing them turns that accident
   * into a package that carries the publisher's copyright text and cannot
   * boot. The loader restores them from the player's own copy either way; this
   * keeps them out of the package in the first place.
   */
  var NOTICE_RE = /^[^/]+\.(txt|url)$/i;

  /*
   * Two shapes of "modded copy", and a base path missing from the modder's
   * tree means the opposite thing in each.
   *
   * "full": the tree is a whole modded GAME, so a base file absent from it
   * was removed on purpose and travels as a delete entry.
   *
   * "overlay": the tree holds only the files the mod itself ships, which is
   * how mods are normally distributed. A base file absent from it was never
   * touched, and emitting a delete for it builds a package that wipes the
   * game. Base-only paths are not walked at all in this mode: the loader
   * lays the player's own game down first and applies these entries on top,
   * so leaving a path out of the package IS leaving that file alone.
   *
   * The caller decides which; detectMode() below is what it decides with.
   */
  async function compare(baseSource, modSource, payloads, onProgress, opts) {
    var overlay = !!(opts && opts.mode === "overlay");
    var notice = function (rel) { return NOTICE_RE.test(rel); };
    var baseList = (await baseSource.list()).filter(function (r) { return !notice(r); });
    var modList = (await modSource.list()).filter(function (r) { return !notice(r); });
    var baseSet = new Set(baseList);
    var modSet = new Set(modList);
    var all = overlay
      ? modList.slice().sort()
      : Array.from(new Set(baseList.concat(modList))).sort();

    var files = [];
    var stats = {
      mode: overlay ? "overlay" : "full",
      patched: 0,
      added: 0,
      replaced: 0,
      deleted: 0,
      unchanged: 0,
      untouched: 0,
    };
    // Reported, not just skipped: "1542 game files left alone" is the line
    // that tells a modder the build read their folder the way they meant it.
    if (overlay) {
      for (var bi = 0; bi < baseList.length; bi++) {
        if (!modSet.has(baseList[bi])) stats.untouched++;
      }
    }

    for (var i = 0; i < all.length; i++) {
      var rel = all[i];
      var inBase = baseSet.has(rel);
      var inMod = modSet.has(rel);
      var baseRaw = inBase ? await baseSource.read(rel) : null;
      var modRaw = inMod ? await modSource.read(rel) : null;
      var entry = await classify(rel, baseRaw, modRaw, payloads);
      if (entry === null) {
        stats.unchanged++;
      } else {
        files.push(entry);
        if (entry.type === "delete") stats.deleted++;
        else if (entry.type === "patch") stats.patched++;
        else if (!inBase) stats.added++;
        else stats.replaced++;
      }
      if (i % 64 === 0 || i === all.length - 1) onProgress(i + 1, all.length);
    }
    return { files: files, stats: stats };
  }

  async function fingerprint(source) {
    var list = await source.list();
    list.sort();
    var chunks = [];
    for (var i = 0; i < list.length; i++) {
      var raw = await source.read(list[i]);
      chunks.push(list[i] + "\n" + (await sha16(raw)) + "\n");
    }
    var digestBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(chunks.join("")));
    var digest = "sha256:" + Array.prototype.map
      .call(new Uint8Array(digestBuf), function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");

    var version = null;
    if (list.indexOf(STD_SYSTEM) !== -1) {
      var sys = tryJson(C.dekit(await source.read(STD_SYSTEM), STD_SYSTEM));
      if (sys && sys.versionId != null) version = String(sys.versionId);
    }
    return { files: list.length, digest: digest, version: version };
  }

  function idbReq(r) {
    return new Promise(function (resolve, reject) {
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
    });
  }

  function toBytes(v) {
    if (v instanceof Uint8Array) return v;
    if (v instanceof ArrayBuffer) return new Uint8Array(v);
    if (typeof v === "string") return new TextEncoder().encode(v);
    if (v && v.buffer) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
    throw new Error("Unsupported IDB value type for a game file.");
  }

  // A Source over the game-files object store loader.html owns. gameVerId
  // null reads the ACTIVE game's plain-key namespace (skipping "mod:",
  // "gamever:", and "__" keys, the same three prefixes loader.html's own
  // isBaseFileKey() filters, so this never pulls a mod overlay, a parked
  // version, or a registry blob into the diff); a non-null id reads one
  // parked version under its "gamever:<id>:" prefix instead.
  //
  // Every read() goes through a fresh db.get(): IndexedDB's structured
  // clone gives back a brand-new value each call, so this source neither
  // caches nor hands back the same buffer twice (required: classify() may
  // store a dekit() result, itself the same reference when the file isn't
  // encrypted, directly into the shared payloads map).
  function idbSource(db, storeName, gameVerId) {
    var prefix = gameVerId ? "gamever:" + gameVerId + ":" : null;
    function store() {
      return db.transaction(storeName, "readonly").objectStore(storeName);
    }
    return {
      list: async function () {
        var keys = await idbReq(store().getAllKeys());
        var out = [];
        for (var i = 0; i < keys.length; i++) {
          var k = String(keys[i]);
          if (prefix) {
            if (k.indexOf(prefix) === 0) out.push(k.slice(prefix.length));
          } else if (
            k.indexOf("mod:") !== 0 &&
            k.indexOf("gamever:") !== 0 &&
            k.indexOf("__") !== 0
          ) {
            out.push(k);
          }
        }
        return out.sort();
      },
      read: async function (rel) {
        return toBytes(await idbReq(store().get(prefix ? prefix + rel : rel)));
      },
    };
  }

  // A Source over a picked FileSystemDirectoryHandle. Roots at the handle
  // itself when it directly contains a "data" entry (the modder picked the
  // game's www/ folder), otherwise at its "www" child (they picked the game
  // root); if neither shape is found this is not a game folder at all, and
  // silently walking it anyway would produce an empty (or bogus) diff: the
  // most dangerous failure mode this tool has, since an empty diff reads as
  // "no changes" and a bogus one would misalign every path against the base
  // game's keys, making every base file look added *and* deleted at once
  // (see the module comment on why that's a copyright leak). So this is a
  // thrown, user-facing error instead.
  //
  // Paths are joined with "/" and carry no leading slash, matching the
  // logical paths idbSource yields (e.g. "data/be1a37535e921f91"), so the
  // two sources line up file-for-file in compare().
  async function dirSource(handle) {
    var rootHandle = handle;
    var names = [];
    for await (var e of handle.values()) names.push(e.name);
    if (names.indexOf("data") === -1) {
      if (names.indexOf("www") === -1) {
        throw new Error(
          'This does not look like a game folder (no "data" or "www" found inside it).'
        );
      }
      rootHandle = await handle.getDirectoryHandle("www");
    }
    var files = new Map();
    async function walk(dir, base) {
      for await (var entry of dir.values()) {
        var rel = base ? base + "/" + entry.name : entry.name;
        if (entry.kind === "directory") await walk(entry, rel);
        else files.set(rel, entry);
      }
    }
    await walk(rootHandle, "");
    return {
      list: async function () { return Array.from(files.keys()).sort(); },
      // Every read() re-reads the handle: File.arrayBuffer() returns a fresh
      // ArrayBuffer per call, and only file *handles* are cached here, never
      // bytes, so like idbSource this never hands back the same buffer
      // twice across calls.
      read: async function (rel) {
        var file = await files.get(rel).getFile();
        return new Uint8Array(await file.arrayBuffer());
      },
    };
  }

  // A Source over an in-memory [rel, bytes] list, for browsers with no
  // showDirectoryPicker (Firefox, Safari): create.html unpacks the modder's
  // .zip and hands the entries over instead of a directory handle.
  function memSource(entries) {
    var map = entries instanceof Map ? entries : new Map(entries);
    return {
      list: async function () {
        return Array.from(map.keys()).sort();
      },
      read: async function (rel) {
        var v = map.get(rel);
        // Fresh copy per read: classify() stores an unencrypted file's bytes
        // into payloads by reference, so handing back the same array twice
        // would alias two payload entries onto one buffer.
        return v == null ? v : v.slice();
      },
    };
  }

  /*
   * A Source that presents another Source's tree the way the GAME stores it.
   *
   * A mod is normally authored as an RPG Maker project: data/Actors.json, not
   * data/be1a37535e921f91, and plain bytes rather than TCOAAL containers. The
   * two trees then share almost no path, and diffing them directly reads the
   * whole game as deleted and every file of the modder's as new. That used to
   * be refused outright. It does not have to be: the shipped layout is
   * derived from the logical one, so it can simply be computed
   * (TcoaalCodec.storagePath), and the diff runs in game space as before.
   *
   * Per path, never per tree, so a mod that replaces hashed files AND adds new
   * assets under their real names - which pathSpace() deliberately gives no
   * verdict on - comes out right on both halves. A tree already fully in game
   * space passes through untouched, which is why the worker can wrap every
   * modded tree it diffs against a remaster base rather than deciding first.
   *
   * keyByte 0 (whole-file) matches what the game itself uses for data/ and
   * what tools/pack-project.js writes. The keyByte lives in the file's own
   * header and dekit reads it back from there, so any value round-trips; 0 is
   * the one that needs no per-file convention to be carried around.
   *
   * Bytes that are ALREADY a TCOAAL container are passed through rather than
   * wrapped a second time: half a modded copy can come from the player's own
   * game files.
   */
  async function gameSpaceSource(inner) {
    var from = new Map(); // storage rel -> source rel
    var wrap = new Map(); // storage rel -> encrypt on read?
    var moved = 0;
    var list = await inner.list();
    for (var i = 0; i < list.length; i++) {
      var t = await C.storagePath(list[i]);
      var clash = from.get(t.rel);
      // Two logical names for one storage name (say "Actors.json" beside an
      // already-hashed copy of it). Silently keeping one would drop the
      // other's edits from the package with nothing to show for it.
      if (clash !== undefined) {
        throw new Error(
          'Two files in that folder are the same game file: "' +
            clash +
            '" and "' +
            list[i] +
            '" both belong at ' +
            t.rel +
            ". Remove whichever one is stale and build again."
        );
      }
      from.set(t.rel, list[i]);
      wrap.set(t.rel, t.enc);
      if (t.rel !== list[i]) moved++;
    }
    return {
      // How many paths this actually rewrote. 0 means the tree was already in
      // game space and nothing here changed the diff; the build summary says
      // so either way.
      moved: moved,
      list: async function () {
        return Array.from(from.keys()).sort();
      },
      read: async function (rel) {
        var bytes = await inner.read(from.get(rel));
        if (!wrap.get(rel) || bytes == null || C.isEncrypted(bytes)) {
          return bytes;
        }
        return C.enkit(bytes, rel, 0);
      },
    };
  }

  /*
   * Which naming convention a tree's CONTENT files use.
   *
   * The remaster ships every asset under 16 hex characters (hashPath in
   * tcoaal-codec.js), optionally "!"-prefixed or "[BUST]"-suffixed. An RPG
   * Maker project, a mod's source repository, and the pre-remaster builds all
   * keep the canonical names instead. js/, fonts/, icon/ and the engine's own
   * files are named the same either way, so they carry no signal and are left
   * out of the count.
   *
   * Returns "hashed", "canonical", or null when the tree holds too little
   * content, or too even a mix, to say. null is the safe answer: it means no
   * caller refuses anything on this evidence.
   */
  var HASHED_NAME = /^!?[0-9a-f]{16}(\[BUST\])?$/;
  var CONTENT_DIR = /^(data|img|audio|movies|languages)\//;

  function pathSpace(list) {
    var hashed = 0;
    var canonical = 0;
    for (var i = 0; i < list.length; i++) {
      if (!CONTENT_DIR.test(list[i])) continue;
      if (HASHED_NAME.test(list[i].split("/").pop())) hashed++;
      else canonical++;
    }
    var total = hashed + canonical;
    if (total < 8) return null;
    if (hashed >= total * 0.9) return "hashed";
    if (canonical >= total * 0.9) return "canonical";
    // A remaster mod may replace hashed files AND add new assets under their
    // real names, which lands here. Nothing is wrong with that tree.
    return null;
  }

  /*
   * The one pairing that cannot be built.
   *
   * A project-space mod against a remaster base is NOT this case any more:
   * the remaster's layout is computed from the logical one, so gameSpaceSource
   * above translates the modder's tree and the diff runs in game space as
   * usual. It is only refused the other way round, where a mod whose files are
   * already hashed is pointed at a pre-remaster build that never hashed
   * anything. Nothing can be derived in that direction - the hash is one-way,
   * and the base holds no table to look the names up in - so every path would
   * miss and the package would read as "delete the game, here are 2000 files
   * of mine", which is exactly the shape this tool exists to prevent.
   *
   * Checked on the naming convention rather than on how much the two trees
   * overlap, because a legitimate overlay overlaps just as little (see
   * detectMode). This is the one signal that separates the two.
   */
  function spaceProblem(baseList, modList) {
    if (pathSpace(baseList) !== "canonical") return null;
    if (pathSpace(modList) !== "hashed") return null;
    return (
      "Your copy names its files the way the remaster ships them " +
      "(data/be1a37535e921f91), but the game version you picked uses the " +
      "canonical names (data/Actors.json). Pick the version your mod was " +
      "actually built against."
    );
  }

  /*
   * Full modded game, or just the files the mod ships?
   *
   * A full copy contains essentially all of the base: even a total
   * conversion replaces files rather than removing them, and the handful a
   * mod does delete is nothing against the whole tree. An overlay contains a
   * small part of it - a real one measured here came to 14%. The gap is wide
   * enough that a single threshold is not a close call.
   *
   * Where it is a close call, "overlay" is the safer read: reading an overlay
   * as full builds a package that deletes the player's game, while reading a
   * full copy as an overlay only drops the deletions the mod meant to make.
   * The modder can say which in the build UI either way, and the build
   * summary reports which reading was used.
   */
  var FULL_COPY_COVERAGE = 0.75;

  function detectMode(baseList, modList) {
    var mod = new Set(modList);
    var covered = 0;
    for (var i = 0; i < baseList.length; i++) {
      if (mod.has(baseList[i])) covered++;
    }
    var full =
      baseList.length > 0 && covered >= baseList.length * FULL_COPY_COVERAGE;
    return {
      mode: full ? "full" : "overlay",
      covered: covered,
      baseCount: baseList.length,
    };
  }

  /*
   * A last check on a pair built as a FULL copy.
   *
   * An overlay is expected to hold a small part of the base and is exempt.
   * But a tree read (or forced) as a whole modded game while most of the base
   * is missing from it is one of two mistakes - the wrong folder, or an
   * overlay marked as full - and the package it produces deletes almost the
   * entire game and carries the rest in as the modder's own work.
   *
   * Returns the reason, or null when the two go together.
   */
  function pairProblem(stats) {
    if (stats.mode === "overlay") return null;
    var kept = stats.unchanged + stats.patched + stats.replaced;
    var baseTotal = kept + stats.deleted;
    if (!baseTotal || kept * 2 >= baseTotal) return null;
    return (
      "That folder holds only " + kept + " of the game's " + baseTotal +
      " files, so building it as a full modded copy would delete the other " +
      stats.deleted + " and carry " + stats.added + " files in as your own " +
      "work. If it holds just the files your mod ships, set what the copy " +
      "contains to \"Only the files my mod changes\". If it is meant to be a " +
      "whole modded game, pick the copy that sits beside Game.exe."
    );
  }

  root.ModDiff = {
    sha16: sha16,
    classify: classify,
    compare: compare,
    fingerprint: fingerprint,
    gameSpaceSource: gameSpaceSource,
    pathSpace: pathSpace,
    spaceProblem: spaceProblem,
    detectMode: detectMode,
    pairProblem: pairProblem,
    idbSource: idbSource,
    dirSource: dirSource,
    memSource: memSource,
  };
})(typeof self !== "undefined" ? self : this);

/*
 * Worker entry point: app/create.html posts {cmd:"diff", dbName, storeName,
 * pairs:[{baseVerId, label, modHandle, steam?, mode?}, ...]} to this file
 * running as a real Web Worker. Each pair diffs one base game version (read
 * from IDB) against one modded folder (read from a FileSystemDirectoryHandle
 * the main thread got from showDirectoryPicker(): handles are
 * structured-cloneable, so they travel over postMessage intact). mode is
 * "auto" (or absent), "full" or "overlay"; see compare(). Replies are
 * {type:"progress", pair, done, total} while a pair is diffing, then either
 * {type:"done", variants, payloads} once, or {type:"error", message} on the
 * first failure.
 *
 * payloads is a single Map created ONCE for the whole message (outside the
 * pairs loop below), not per pair, so identical bytes across two variants of
 * the same mod (e.g. a Steam and a GOG base) collapse into one payload
 * instead of being packaged twice.
 *
 * Guarded so loading this file in a non-worker context (the Node/vm test
 * harness, which has neither importScripts nor indexedDB) never throws.
 */
if (typeof self !== "undefined" && typeof importScripts === "function") {
  self.onmessage = async function (ev) {
    var msg = ev.data;
    if (!msg || msg.cmd !== "diff") return;
    var db = null;
    try {
      db = await new Promise(function (resolve, reject) {
        var r = indexedDB.open(msg.dbName);
        r.onsuccess = function () { resolve(r.result); };
        r.onerror = function () { reject(r.error); };
      });

      var payloads = new Map();
      var variants = [];
      for (var i = 0; i < msg.pairs.length; i++) {
        var pair = msg.pairs[i];
        // Wrapped per pair so ANY failure for this pair (a bad base id, a
        // folder that doesn't look like a game, an identical tree, a
        // compare()/fingerprint() error) surfaces with the pair's label
        // attached, instead of an unlabeled message that leaves the caller
        // unable to tell which of possibly several pairs failed.
        try {
          var base = self.ModDiff.idbSource(db, msg.storeName, pair.baseVerId);
          // A pair supplies its modded tree either as a directory handle or,
          // where showDirectoryPicker does not exist, as an unpacked zip.
          var mod;
          if (pair.modHandle) {
            mod = await self.ModDiff.dirSource(pair.modHandle);
          } else if (pair.files) {
            mod = self.ModDiff.memSource(pair.files);
          } else {
            throw new Error("No modded folder was provided for this variant.");
          }
          // The base side gets the same "does this look like a game?" test
          // dirSource applies to the modded side, and for a much sharper
          // reason. If the base source yields nothing (a stale or mistyped
          // baseVerId, a gamever: prefix matching no keys, a parked version
          // whose files were never written) then compare() sees an empty
          // base against a full modded tree and classifies EVERY file as
          // new, so the entire base game is copied into payloads as the
          // modder's own work. That is precisely the leak this whole tool is
          // built to prevent, and it would look like a successful build.
          // Failing loudly here is the only place that catches it: the
          // fingerprint runs after compare, and a huge files list is
          // indistinguishable from a legitimately large mod.
          var baseNames = await base.list();
          if (!baseNames.length) {
            throw new Error(
              "The selected base game has no files in this browser's storage. " +
                "Re-import it in loader.html before building against it."
            );
          }
          if (!baseNames.some(function (n) { return n.indexOf("data/") === 0; })) {
            throw new Error(
              "The selected base game has no data/ files, so it does not look " +
                "like a game. Refusing to diff against it: every file would " +
                "be treated as something you added."
            );
          }
          // A mod is normally authored as an RPG Maker project, so the tree
          // handed over here usually names its files data/Actors.json where
          // the remaster ships data/be1a37535e921f91. That layout is derived
          // from the logical one, so it is computed rather than demanded of
          // the modder: against a hashed base the tree is presented in game
          // space (per path, so a tree already in game space is untouched)
          // and everything below runs exactly as it did before.
          var translated = 0;
          if (self.ModDiff.pathSpace(baseNames) === "hashed") {
            mod = await self.ModDiff.gameSpaceSource(mod);
            translated = mod.moved;
          }
          // A modded copy is either a whole modded game or just the files
          // the mod ships, and the same missing base path means "deleted" in
          // the first and "untouched" in the second. Auto is the default and
          // is what a modder who never opens that control gets; "full" and
          // "overlay" are their explicit answer and are taken as given.
          var modNames = await mod.list();
          var space = self.ModDiff.spaceProblem(baseNames, modNames);
          if (space) throw new Error(space);
          var mode =
            pair.mode === "full" || pair.mode === "overlay"
              ? pair.mode
              : self.ModDiff.detectMode(baseNames, modNames).mode;

          var idx = i;
          var res = await self.ModDiff.compare(
            base,
            mod,
            payloads,
            function (done, total) {
              self.postMessage({ type: "progress", pair: idx, done: done, total: total });
            },
            { mode: mode }
          );
          if (!res.files.length) {
            throw new Error(
              mode === "overlay"
                ? "Every file in that folder is already identical to the base game (no changes)."
                : "The modded folder is identical to the base game (no changes)."
            );
          }
          res.stats.translated = translated;
          var mismatch = self.ModDiff.pairProblem(res.stats);
          if (mismatch) throw new Error(mismatch);
          var fp = await self.ModDiff.fingerprint(base);
          var baseMeta = { label: pair.label, fingerprint: fp };
          if (pair.steam) baseMeta.steam = pair.steam;
          variants.push({ base: baseMeta, files: res.files, stats: res.stats });
        } catch (pairErr) {
          throw new Error(
            'Variant "' + pair.label + '": ' + ((pairErr && pairErr.message) || pairErr)
          );
        }
      }
      self.postMessage({ type: "done", variants: variants, payloads: payloads });
    } catch (e) {
      self.postMessage({ type: "error", message: String((e && e.message) || e) });
    } finally {
      if (db) db.close();
    }
  };
}

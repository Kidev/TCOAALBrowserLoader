#!/usr/bin/env node
/*
 * lang-roundtrip.js: the bake <-> un-bake bridge for the extract/edit/play loop.
 *
 * TCOAAL stores dialogue as a placeholder the runtime Lang/VN engine resolves:
 * a "Show Text" command (code 101 header + 401 line) holds, e.g.,
 *   "\n<(label)[kR5Fy4cp]>\c[1]\bust[1](lines)[XxjfXykT]"
 * where (label)[K] -> labelLUT[K] (speaker / item name) and (lines)[K] ->
 * linesLUT[K] (an array of VN-box line segments), both keyed in the base CLD
 * (a "LANGDATA"-headed JSON under a hashed data/ name).
 *
 *   BAKE   (extract-project): placeholders -> readable text inlined into the
 *          data, so the RPG Maker MV editor shows real words. A Show-Text line's
 *          (lines) segments become one 401 command each (the editor's native
 *          multi-line shape: a single 401 with an embedded "\n" shows only its
 *          first line); elsewhere segments join with "\n".
 *   UNBAKE (play / pack / PlayInBrowser): the inverse. Readable text -> back to
 *          (label)/(lines) placeholders + CLD entries, so the live command101
 *          lays the dialogue out (speaker header, per-segment paging, VN wrap)
 *          exactly as the shipped game does.
 *
 * This lets a single extraction be BOTH editor-readable (baked) AND play/ship
 * faithful (un-baked at run/pack time, never mutating the editable project).
 *
 * Un-bake is value-based, not position-based, so it is robust to the modder
 * inserting/deleting/splitting commands in the editor:
 *   - dialogue left UNCHANGED matches a CLD value exactly and is restored to its
 *     original key (displayed text is identical -> byte-faithful for shipping);
 *   - dialogue EDITED or newly authored gets a freshly minted CLD key so it,
 *     too, renders with the full VN layout.
 *
 * Dependency-free CommonJS: extract-project / play / pack require it directly,
 * and extract-project --playable also copies it into the project's _play/ folder
 * so the in-editor PlayInBrowser plugin can require it inside NW.js.
 */

"use strict";

const fs = require("fs");
const path = require("path");

// CLD location / (de)serialization

const LANGDATA_SIG = "LANGDATA"; // 8-byte header on the on-disk CLD, then plain JSON.

/** Find and parse the base CLD in a data/ directory.
 *  Returns { file, rel, header, cld } or null. `header` is the raw byte prefix
 *  before the JSON (normally "LANGDATA") so it can be re-emitted faithfully. */
function loadCLD(dataDir) {
  let names;
  try {
    names = fs.readdirSync(dataDir);
  } catch (e) {
    return null;
  }
  for (const name of names) {
    const abs = path.join(dataDir, name);
    let buf;
    try {
      if (!fs.statSync(abs).isFile()) continue;
      buf = fs.readFileSync(abs);
    } catch (e) {
      continue;
    }
    if (
      buf.length >= LANGDATA_SIG.length &&
      buf.subarray(0, LANGDATA_SIG.length).toString("latin1") === LANGDATA_SIG
    ) {
      const brace = buf.indexOf(0x7b);
      if (brace < 0) continue;
      try {
        const cld = JSON.parse(buf.toString("utf8", brace));
        if (cld && (cld.labelLUT || cld.linesLUT)) {
          return { file: abs, rel: name, header: buf.subarray(0, brace), cld };
        }
      } catch (e) {
        /* not the CLD */
      }
    }
  }
  return null;
}

/** Re-emit a (possibly augmented) CLD as the on-disk "LANGDATA" + JSON buffer. */
function serializeCLD(header, cld) {
  return Buffer.concat([Buffer.from(header), Buffer.from(JSON.stringify(cld))]);
}

/** The lookup tables in the shape bake/un-bake need. */
function lutsFromCLD(cld) {
  return { labelLUT: cld.labelLUT || {}, linesLUT: cld.linesLUT || {} };
}

// BAKE: placeholders -> readable text

/** Join a linesLUT value (array of VN-box segments) to one editable string.
 *  Segments are joined with "\n" so the editor shows one segment per line and
 *  the un-baker can split them back exactly (segments never contain a real \n). */
function linesValue(v) {
  return Array.isArray(v) ? v.join("\n") : String(v);
}

/** Resolve (label)[K] / (lines)[K] placeholders in one string; acc.n counts hits. */
function bakeText(str, lut, acc) {
  return str
    .replace(/\(label\)\[([^\]]+)\]/g, (m, k) => {
      const v = lut.labelLUT[k];
      if (v === undefined) return m;
      acc.n++;
      return String(v);
    })
    .replace(/\(lines\)\[([^\]]+)\]/g, (m, k) => {
      const v = lut.linesLUT[k];
      if (v === undefined) return m;
      acc.n++;
      return linesValue(v);
    });
}

/** Deep-replace placeholders in every string leaf of a parsed data document. */
function deepBake(node, lut, acc) {
  if (typeof node === "string") return bakeText(node, lut, acc);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = deepBake(node[i], lut, acc);
    return node;
  }
  if (node && typeof node === "object") {
    for (const k in node) node[k] = deepBake(node[k], lut, acc);
    return node;
  }
  return node;
}

// An array is a command list if it holds command objects {code, parameters}.
function isCommandList(arr) {
  return arr.some(
    (e) =>
      e &&
      typeof e === "object" &&
      typeof e.code === "number" &&
      Array.isArray(e.parameters),
  );
}

// Show-Text / Scrolling-Text line commands (the text body of a 101 / 105).
const LINE_CODES = new Set([401, 405]);

/** Bake one Show-Text line string into the editor's native shape: an ARRAY of
 *  line strings (one per `linesLUT` segment). The remaster ships a multi-segment
 *  line as a SINGLE 401 carrying `(lines)[K]` (the runtime re-expands it), but
 *  RPG Maker MV represents each visual line as its OWN 401: so a single 401 with
 *  an embedded "\n" shows only its first line in the editor. Splitting the
 *  segments into separate 401s is the faithful MV shape (and `createUnbaker`
 *  regroups consecutive 401s, so it round-trips). The trailing `(lines)[K]` is
 *  the only multi-segment source; speaker/`(label)` codes in the prefix bake
 *  normally and ride on the first line. */
function bakeShowTextLine(s, lut, acc) {
  const tokens = s.match(/\(lines\)\[[^\]]+\]/g) || [];
  if (tokens.length !== 1) return [bakeText(s, lut, acc)]; // 0 or unusual: one line
  const m = s.match(/\(lines\)\[([^\]]+)\]/);
  const v = lut.linesLUT[m[1]];
  if (v === undefined) return [bakeText(s, lut, acc)]; // unknown key: leave as-is
  const bakedPrefix = bakeText(s.slice(0, m.index), lut, acc);
  const bakedSuffix = bakeText(s.slice(m.index + m[0].length), lut, acc);
  acc.n++;
  const segs = (Array.isArray(v) ? v : [v]).map(String);
  if (segs.length === 0) segs.push("");
  segs[0] = bakedPrefix + segs[0];
  segs[segs.length - 1] = segs[segs.length - 1] + bakedSuffix;
  return segs;
}

/** Bake a command list in place: each Show-Text line (401/405) expands to one
 *  command per segment; every other command is baked generically. */
function bakeList(list, lut, acc) {
  const out = [];
  for (const cmd of list) {
    if (cmd && LINE_CODES.has(cmd.code) && cmd.parameters) {
      const lines = bakeShowTextLine(String(cmd.parameters[0] || ""), lut, acc);
      for (const lineStr of lines) {
        out.push({ code: cmd.code, indent: cmd.indent, parameters: [lineStr] });
      }
    } else {
      bakeDoc(cmd, lut, acc); // e.g. 102 choice arrays, nested move-route lists
      out.push(cmd);
    }
  }
  list.length = 0;
  for (const c of out) list.push(c);
}

/** Command-aware bake: like deepBake, but Show-Text lines split per segment so
 *  the editor shows every line. Used by extract-project (--bake). */
function bakeDoc(node, lut, acc) {
  if (typeof node === "string") return bakeText(node, lut, acc);
  if (Array.isArray(node)) {
    if (isCommandList(node)) {
      bakeList(node, lut, acc);
      return node;
    }
    for (let i = 0; i < node.length; i++) node[i] = bakeDoc(node[i], lut, acc);
    return node;
  }
  if (node && typeof node === "object") {
    for (const k in node) node[k] = bakeDoc(node[k], lut, acc);
    return node;
  }
  return node;
}

// UNBAKE: readable text -> placeholders + CLD entries

// In every shipped Show-Text line the "(lines)[K]" placeholder is the TRAILING
// token (verified across the game): everything before it is a fixed "header"
// vocabulary: the Irina VN speaker code "\n<...>", a "<center>", a color
// "\c[n]", and bust codes "\bust[n]" / "\bustMirror[n]" / "\bustUnmirror[n]".
// So the dialogue body is exactly the suffix after that header run. Matching
// only this precise vocabulary (rather than any "\code") is what keeps a line
// whose own text begins with a control code from being mis-split.
const HEADER_TOKEN =
  /^(?:\\n<[^>]*>|<center>|\\c\[\d+\]|\\bust[A-Za-z]*\[\d+\])/;

// Baking removes every placeholder token, so a body that still CONTAINS one is
// already in placeholder form (a no-bake / partial input, or an edge-case prefix
// the header vocabulary didn't fully strip) and must be left untouched.
const HAS_PLACEHOLDER = /\((?:lines|label)\)\[[^\]]+\]/;

// Show Text in MV: header code + per-line text code.
const TEXT_GROUPS = {
  101: 401, // Show Text
  105: 405, // Show Scrolling Text
};

/** Mint short CLD keys in the existing 8-char base62 style, unique within the
 *  CLD (and across this un-bake run). */
function makeMinter(cld) {
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const used = new Set([
    ...Object.keys(cld.linesLUT || {}),
    ...Object.keys(cld.labelLUT || {}),
  ]);
  return function mint() {
    let k;
    do {
      k = "";
      for (let i = 0; i < 8; i++) {
        k += ALPHA[(Math.random() * ALPHA.length) | 0];
      }
    } while (used.has(k));
    used.add(k);
    return k;
  };
}

/**
 * Build an un-baker bound to one CLD. Calling unbakeDoc(doc) walks a parsed data
 * document in place, restoring Show-Text dialogue to (label)/(lines) placeholder
 * form and minting new CLD entries (into cld.linesLUT / cld.labelLUT) for edited
 * or newly authored text. Returns { unbakeDoc, stats }.
 */
function createUnbaker(cld) {
  cld.linesLUT = cld.linesLUT || {};
  cld.labelLUT = cld.labelLUT || {};

  // Reverse value -> key indexes from the original CLD. First key wins on a
  // value collision; the displayed text is identical either way, so a restore
  // is always faithful even when it picks a sibling key.
  const linesRev = new Map();
  for (const k in cld.linesLUT) {
    const v = linesValue(cld.linesLUT[k]);
    if (!linesRev.has(v)) linesRev.set(v, k);
  }
  const labelRev = new Map();
  for (const k in cld.labelLUT) {
    const v = String(cld.labelLUT[k]);
    if (!labelRev.has(v)) labelRev.set(v, k);
  }

  const mint = makeMinter(cld);
  const stats = { restored: 0, mintedLines: 0, mintedLabels: 0 };

  // Resolve a LEADING speaker name "\n<NAME>" back to "\n<(label)[K]>": existing
  // names map to their key; an edited/new name mints a label entry. Anchored at
  // the start so a "\n<...>" occurring inside a line's own text is left alone.
  function resolveSpeaker(str) {
    return str.replace(/^\\n<([^>]*)>/, (m, inner) => {
      if (/^\(label\)\[/.test(inner)) return m; // already a placeholder (no-bake)
      let key = labelRev.get(inner);
      if (key === undefined) {
        key = mint();
        cld.labelLUT[key] = inner;
        labelRev.set(inner, key);
        stats.mintedLabels++;
      }
      return "\\n<(label)[" + key + "]>";
    });
  }

  // Turn one joined Show-Text string back into placeholder form. Returns the
  // rebuilt string (always a single line; the runtime re-expands it).
  function reconstruct(joined) {
    let s = resolveSpeaker(joined);

    // Isolate the dialogue body: the suffix after the fixed header-token run.
    let prefixEnd = 0;
    for (;;) {
      const m = s.slice(prefixEnd).match(HEADER_TOKEN);
      if (!m) break;
      prefixEnd += m[0].length;
    }
    const prefix = s.slice(0, prefixEnd);
    const body = s.slice(prefixEnd);

    if (HAS_PLACEHOLDER.test(body) || body.trim() === "") {
      // Already a placeholder (no-bake input) or nothing to localize.
      return s;
    }

    let key = linesRev.get(body);
    if (key !== undefined) {
      stats.restored++;
    } else {
      // Edited or brand-new dialogue: mint a key. Split on "\n" so multi-line
      // authored text becomes one segment per line, matching shipped shape.
      key = mint();
      cld.linesLUT[key] = body.split("\n");
      linesRev.set(body, key);
      stats.mintedLines++;
    }
    return prefix + "(lines)[" + key + "]";
  }

  // Restore one Show-Choices entry (a whole-string label, not a Show-Text line)
  // back to its placeholder. Choices are the one other player-visible text that
  // baking flattens (the 102 parameters[0] array); keeping them keyed is what
  // makes choice text translatable. Unchanged -> original key; edited / new ->
  // minted. A value that is already a placeholder or empty is left as-is.
  function restoreChoice(str) {
    if (HAS_PLACEHOLDER.test(str) || str.trim() === "") return str;
    let key = labelRev.get(str);
    if (key !== undefined) {
      stats.restored++;
      return "(label)[" + key + "]";
    }
    key = linesRev.get(str);
    if (key !== undefined) {
      stats.restored++;
      return "(lines)[" + key + "]";
    }
    key = mint();
    cld.labelLUT[key] = str;
    labelRev.set(str, key);
    stats.mintedLabels++;
    return "(label)[" + key + "]";
  }

  // Rebuild a command list: collapse each Show-Text header + its run of line
  // commands into a single reconstructed line command (robust to the editor
  // having split a multi-segment line across several 401s: they are rejoined),
  // and re-key Show-Choices (102) entries.
  function processList(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const cmd = list[i];
      // Show Choices: re-key the choice-text array (parameters[0]); the 402
      // branch labels are a literal mirror the engine regenerates, left as-is.
      if (cmd && cmd.code === 102 && cmd.parameters && Array.isArray(cmd.parameters[0])) {
        cmd.parameters[0] = cmd.parameters[0].map((c) =>
          typeof c === "string" ? restoreChoice(c) : c,
        );
        out.push(cmd);
        continue;
      }
      const lineCode = cmd && typeof cmd.code === "number" ? TEXT_GROUPS[cmd.code] : undefined;
      if (lineCode === undefined) {
        out.push(cmd);
        continue;
      }
      out.push(cmd); // keep the header (101 / 105)
      const group = [];
      let j = i + 1;
      while (j < list.length && list[j] && list[j].code === lineCode) {
        group.push(list[j]);
        j++;
      }
      if (group.length) {
        const joined = group
          .map((c) => String((c.parameters && c.parameters[0]) || ""))
          .join("\n");
        out.push({
          code: lineCode,
          indent: group[0].indent,
          parameters: [reconstruct(joined)],
        });
      }
      i = j - 1;
    }
    list.length = 0;
    for (const c of out) list.push(c);
  }

  function unbakeDoc(node) {
    if (Array.isArray(node)) {
      if (isCommandList(node)) processList(node);
      for (const e of node) unbakeDoc(e);
    } else if (node && typeof node === "object") {
      for (const k in node) unbakeDoc(node[k]);
    }
    return node;
  }

  return { unbakeDoc, stats };
}

module.exports = {
  // CLD
  loadCLD,
  serializeCLD,
  lutsFromCLD,
  LANGDATA_SIG,
  // bake
  linesValue,
  bakeText,
  deepBake,
  bakeDoc,
  // unbake
  createUnbaker,
};

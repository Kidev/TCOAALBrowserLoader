/*
 * map-names.js: recover human map names for a remaster extract by content match.
 *
 * The remaster blanks MapInfos[].name and hashes filenames irreversibly, so a
 * map's real name can't be read or hashed back. But an older build still ships
 * named maps, and a map's *content* survives the remaster: its events reference
 * a stable, scene-specific set of localization placeholder codes
 * ((lines)[CODE] / (label)[CODE]). Those code sets are an effective fingerprint
 * overlap them (Jaccard) and the blank current map inherits the name of the
 * old map it shares the most codes with.
 *
 * Why codes and not the tile `data` array: TCOAAL parallax-maps everything, so
 * the `data` layer is mostly empty and dozens of unrelated maps look ~99%
 * identical. The placeholder codes, by contrast, separate scenes cleanly (a
 * confident match clears its runner-up by a wide margin: see THRESHOLDS).
 *
 * The reference is bundled as map-name-keys.json (built by
 * build-map-name-keys.js from a named-maps game) so extraction names maps with
 * no extra input; --names-from rebuilds it live from any named-maps build.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { hashPath, dekit, decodeK9a } = require("./build-tomb-mod.js");

// Acceptance thresholds, calibrated against test/c (65 named maps) vs the
// current remaster: confident matches score >= 0.5 and clear their runner-up by
// >= 0.15 (observed min margin 0.52); maps with too few codes carry no reliable
// signature and are left as MapNNN.
const MIN_KEYS = 3; // a current map needs at least this many codes to match
const THRESHOLD = 0.5; // minimum Jaccard overlap to accept
const MARGIN = 0.15; // best must beat the runner-up by at least this much

const BUNDLED_REF = path.join(__dirname, "map-name-keys.json");

/** Decode a logical data file from any game layout (old .k9a, remaster
 *  hashed+TCOAAL, or a plain dump), returning plaintext bytes or null. .k9a is
 *  tried first because some builds ship both a clean .k9a and a hashed copy. */
function decodeLogical(www, logical) {
  const k9a = path.join(www, logical.replace(/\.[^./]+$/, ".k9a"));
  if (fs.existsSync(k9a)) return decodeK9a(fs.readFileSync(k9a), logical);

  const hp = hashPath(logical);
  const hashed = path.join(www, hp);
  if (fs.existsSync(hashed)) return dekit(fs.readFileSync(hashed), hp);

  const plain = path.join(www, logical);
  if (fs.existsSync(plain)) return fs.readFileSync(plain);

  return null;
}

/** Extract the set of bare localization placeholder codes referenced by a map's
 *  JSON text. `(lines)[Wb5LCdMV]` / `(label)[x86GCl9v]` -> "Wb5LCdMV" etc. The
 *  bare code is enough to be unique across scenes; (lines) vs (label) needn't be
 *  distinguished as long as both sides are extracted the same way. */
function mapKeyCodes(str) {
  const set = new Set();
  const re = /\((?:lines|label)\)\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(str))) set.add(m[1]);
  return set;
}

/** Jaccard overlap of two code sets (0 when either is empty). */
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Load the named-map reference: an array of { name, keys:Set<code> }.
 *  With `namesFrom` (a path to a named-maps game), build it live from that
 *  build's MapInfos; otherwise load the bundled map-name-keys.json. Returns
 *  null if no reference is available. */
function loadMapNameRefs(namesFrom) {
  if (namesFrom) {
    let www = namesFrom;
    if (!fs.existsSync(path.join(www, "data"))) {
      const inner = path.join(www, "www");
      if (fs.existsSync(path.join(inner, "data"))) www = inner;
    }
    const infosBuf = decodeLogical(www, "data/MapInfos.json");
    if (!infosBuf) return null;
    const infos = JSON.parse(infosBuf.toString("utf8"));
    const refs = [];
    for (const e of infos) {
      if (!e || !e.name) continue;
      const buf = decodeLogical(
        www,
        `data/Map${String(e.id).padStart(3, "0")}.json`,
      );
      if (!buf) continue;
      const keys = mapKeyCodes(buf.toString("utf8"));
      if (keys.size) refs.push({ name: e.name, keys });
    }
    return refs.length ? refs : null;
  }

  if (!fs.existsSync(BUNDLED_REF)) return null;
  const raw = JSON.parse(fs.readFileSync(BUNDLED_REF, "utf8"));
  return raw.map((m) => ({ name: m.n, keys: new Set(m.k) }));
}

/** Resolve canonical map names for the game at `www` by matching each map's
 *  placeholder-code set against the reference. Returns Map<id, name> holding
 *  only confident matches; ambiguous / signature-less maps are omitted (and
 *  fall back to MapNNN at the call site). */
function resolveMapNames(www, refs) {
  const out = new Map();
  if (!refs || !refs.length) return out;

  const infosBuf = decodeLogical(www, "data/MapInfos.json");
  if (!infosBuf) return out;
  let infos;
  try {
    infos = JSON.parse(infosBuf.toString("utf8"));
  } catch (_) {
    return out;
  }

  for (const e of infos) {
    if (!e || !e.id) continue;
    const buf = decodeLogical(
      www,
      `data/Map${String(e.id).padStart(3, "0")}.json`,
    );
    if (!buf) continue;
    const codes = mapKeyCodes(buf.toString("utf8"));
    if (codes.size < MIN_KEYS) continue;

    let best = null;
    let bestScore = -1;
    let secondScore = -1;
    for (const ref of refs) {
      const sc = jaccard(codes, ref.keys);
      if (sc > bestScore) {
        secondScore = bestScore;
        bestScore = sc;
        best = ref;
      } else if (sc > secondScore) {
        secondScore = sc;
      }
    }

    if (best && bestScore >= THRESHOLD && bestScore - secondScore >= MARGIN) {
      out.set(e.id, best.name);
    }
  }

  return out;
}

module.exports = {
  MIN_KEYS,
  THRESHOLD,
  MARGIN,
  decodeLogical,
  mapKeyCodes,
  jaccard,
  loadMapNameRefs,
  resolveMapNames,
};

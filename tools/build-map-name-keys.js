#!/usr/bin/env node
/*
 * build-map-name-keys.js: build the bundled map-name reference used by
 * extract-project.js to recover human map names.
 *
 * The remaster blanks every MapInfos[].name, but an *older* build still ships
 * named maps (e.g. the last version whose MapInfos carries names). Real names
 * can't be hashed back, but a map's *content* survives a remaster: each map's
 * events reference a stable set of localization placeholder codes
 * ((lines)[CODE] / (label)[CODE]) that are scene-specific and essentially
 * version-invariant. So the reference for each named map is just that set of
 * codes; extract-project.js matches a blank current map to the named map with
 * the most overlapping codes (Jaccard, see resolveMapNames there).
 *
 * This emits tools/map-name-keys.json: [{ "n": <name>, "k": [<8-char code>, ...] }].
 * Re-run it whenever a newer named-maps build appears.
 *
 * Usage:
 *   node tools/build-map-name-keys.js <namedGameDir> [outFile]
 *   node tools/build-map-name-keys.js test/c
 *   node tools/build-map-name-keys.js test/c tools/map-name-keys.json
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { decodeLogical, mapKeyCodes } = require("./map-names.js");

function resolveWww(input) {
  if (fs.existsSync(path.join(input, "data"))) return input;
  if (fs.existsSync(path.join(input, "www", "data"))) {
    return path.join(input, "www");
  }
  return input;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1 || argv.includes("-h") || argv.includes("--help")) {
    console.log(
      "Usage: node tools/build-map-name-keys.js <namedGameDir> [outFile]",
    );
    process.exit(argv.length < 1 ? 1 : 0);
  }

  const www = resolveWww(argv[0]);
  const out = argv[1] || path.join(__dirname, "map-name-keys.json");

  const infosBuf = decodeLogical(www, "data/MapInfos.json");
  if (!infosBuf) {
    console.error(`Could not decode data/MapInfos.json under ${argv[0]}`);
    process.exit(1);
  }
  const infos = JSON.parse(infosBuf.toString("utf8"));

  const maps = [];
  let totalKeys = 0;
  for (const e of infos) {
    if (!e || !e.name) continue;
    const buf = decodeLogical(
      www,
      `data/Map${String(e.id).padStart(3, "0")}.json`,
    );
    if (!buf) continue;
    const codes = [...mapKeyCodes(buf.toString("utf8"))];
    if (!codes.length) continue; // no content signature -> can't be matched
    maps.push({ n: e.name, k: codes });
    totalKeys += codes.length;
  }

  fs.writeFileSync(out, JSON.stringify(maps));
  console.log(
    `Wrote ${maps.length} named maps (${totalKeys} keys) -> ${out}`,
  );
}

main();

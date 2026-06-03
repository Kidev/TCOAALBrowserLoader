#!/usr/bin/env node
/*
 * extract-project.js: recover an editable RPG Maker MV project from a shipped
 * TCOAAL game folder.
 *
 * A released game ships every asset encrypted and stored under an irreversible
 * SHA-256 hashed filename (remaster / 2.x) or in a ".k9a" container (old /
 * pre-remaster). RPG Maker MV can't open either. This tool decrypts everything
 * and writes a plain `www`-style project that the editor (and a plain engine)
 * can load:
 *
 *   - data files          -> canonical names restored (System.json, MapNNN.json,
 *                            ...) by forward-hashing the fixed engine name set.
 *   - img/system images   -> canonical names restored from the known MV +
 *                            TCOAAL system-image set.
 *   - other img / audio   -> decrypted, correct extension recovered from magic
 *                            bytes. The remaster hashed the original names away
 *                            (one-way), but data references those same hashes,
 *                            so `<hash>.png` is fully functional.
 *   - languages (.loc)    -> NEMLEI CLD header stripped to plain JSON.
 *   - everything else      -> copied verbatim.
 *
 * A `Game.rpgproject` is emitted and `index.html` is patched to neutralize the
 * runtime DRM / asset-resolution layer (paths now resolve to themselves on
 * disk), so the recovered project also *runs* from the folder as-is.
 *
 * The crypto (hashPath / dekit / decodeK9a / parseLoc) is reused from
 * build-tomb-mod.js so there is a single source of truth.
 *
 * Usage:
 *   node tools/extract-project.js --www <gameWww> --out <projectDir> [--force]
 *   node tools/extract-project.js --www .hide/current_game/www --out ./project
 *
 * Options:
 *   -w, --www <dir>    Game www folder (or a game folder containing www/).
 *   -o, --out <dir>    Output project folder (default: project).
 *   -f, --force        Overwrite the output folder if it already exists.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const {
  hashPath,
  dekit,
  decodeK9a,
  parseLoc,
  walk,
  writeOut,
} = require("./build-tomb-mod.js");

// canonical-name recovery

// Standard RPG Maker MV data files. The engine loads these by hard-coded logical
// name (DataManager._databaseFiles), so they must be restored to their canonical
// filename or both the editor and the runtime fail to find them.
const STD_DATA = [
  "System",
  "Actors",
  "Classes",
  "Skills",
  "Items",
  "Weapons",
  "Armors",
  "Enemies",
  "Troops",
  "States",
  "Animations",
  "Tilesets",
  "CommonEvents",
  "MapInfos",
];

// Standard engine + TCOAAL img/system images. The editor renders its window
// skin, icons and balloons from these by name, and the engine references several
// directly, so they're worth recovering. Any system image not in this list keeps
// its hashed name.
const SYSTEM_IMAGES = [
  "Window",
  "IconSet",
  "Balloon",
  "Damage",
  "GameOver",
  "Loading",
  "ButtonSet",
  "States",
  "Shadow1",
  "Shadow2",
  "Weapons1",
  "Weapons2",
  "Weapons3",
  "continue",
  "credits",
  "language",
  "msgimg_0",
  "new_game",
  "options",
  "quit",
  "stamp",
  "vision",
  "VNButtons",
];

// Highest MapNNN id to probe for. The game ships ~220 maps; the headroom is
// cheap (a few thousand SHA-256s) and dead entries simply never match.
const MAX_MAP_ID = 2000;

/** Reverse map: on-disk hashed path (e.g. "data/be1a37535e921f91") ->
 *  canonical logical path (e.g. "data/System.json"), built by hashing every
 *  candidate forward. On a pre-remaster (.k9a) game nothing matches and the
 *  map is harmlessly unused. */
function buildNameMap() {
  const map = {};
  const add = (logical) => {
    map[hashPath(logical)] = logical;
  };

  for (const name of STD_DATA) add(`data/${name}.json`);
  for (let id = 1; id <= MAX_MAP_ID; id++) {
    add(`data/Map${String(id).padStart(3, "0")}.json`);
  }
  for (const name of SYSTEM_IMAGES) add(`img/system/${name}.png`);

  return map;
}

/** Sniffs a file extension from a decrypted asset's magic bytes. The remaster
 *  stores assets without an extension; the engine requests them with one, so
 *  once DRM resolution is neutralized the file has to carry it. Content sniffing
 *  avoids mislabeling and only fires on real media payloads. */
function detectExtension(data) {
  // PNG: 89 50 4E 47
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return ".png";
  }
  // Ogg: 4F 67 67 53 ("OggS")
  if (
    data.length >= 4 &&
    data[0] === 0x4f &&
    data[1] === 0x67 &&
    data[2] === 0x67 &&
    data[3] === 0x53
  ) {
    return ".ogg";
  }
  // WebM / Matroska: 1A 45 DF A3
  if (
    data.length >= 4 &&
    data[0] === 0x1a &&
    data[1] === 0x45 &&
    data[2] === 0xdf &&
    data[3] === 0xa3
  ) {
    return ".webm";
  }
  // MP4: "ftyp" at offset 4
  if (
    data.length >= 12 &&
    data[4] === 0x66 &&
    data[5] === 0x74 &&
    data[6] === 0x79 &&
    data[7] === 0x70
  ) {
    return ".mp4";
  }
  return null;
}

/** Converts a `.k9a` path to its real logical extension by folder convention
 *  (pre-remaster assets keep their logical names on disk). */
function fromK9A(rel) {
  if (/^data(\/|\\)/.test(rel)) return rel.replace(/\.k9a$/i, ".json");
  if (/^img(\/|\\)/.test(rel)) return rel.replace(/\.k9a$/i, ".png");
  if (/^audio(\/|\\)/.test(rel)) return rel.replace(/\.k9a$/i, ".ogg");
  return rel;
}

// extraction

function extract(www, out, nameMap) {
  const files = walk(www);

  let renamed = 0;
  let extended = 0;
  let langs = 0;

  for (const rel of files) {
    const ext = path.extname(rel).toLowerCase();
    const raw = fs.readFileSync(path.join(www, rel));

    if (ext === ".k9a") {
      // Pre-remaster container: logical name and extension are known.
      const logical = fromK9A(rel);
      writeOut(out, logical, decodeK9a(raw, logical));
    } else if (ext === ".loc") {
      // Pre-remaster CLD: strip the NEMLEI header to plain JSON. The injected
      // index.html patch pads it back at runtime.
      writeOut(out, rel, JSON.stringify(parseLoc(raw), null, "\t"));
      langs++;
    } else {
      const dec = dekit(raw, rel);

      // Restore a canonical name for the well-known engine files, otherwise
      // recover the stripped extension from the content. Plain files (js, fonts,
      // already-named assets) fall through both branches unchanged.
      const canonical = nameMap[rel];
      let outRel = rel;

      if (canonical) {
        outRel = canonical;
        renamed++;
      } else if (!path.extname(rel)) {
        const detected = detectExtension(dec);
        if (detected) {
          outRel = rel + detected;
          extended++;
        }
      }

      writeOut(out, outRel, dec);
    }
  }

  return { total: files.length, renamed, extended, langs };
}

function generateRpgProject(out) {
  fs.writeFileSync(path.join(out, "Game.rpgproject"), "RPGMV 1.6.2");
}

function updatePackageJson(out) {
  const pkgPath = path.join(out, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = "tcoaal";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, "    "));
}

function patchIndexHtml(out) {
  const indexPath = path.join(out, "index.html");
  if (!fs.existsSync(indexPath)) return;

  const script = `
		<script>
			// Patches provided by extract-project.js

			// The recovered project ships fully decrypted assets under their
			// resolved names, so neutralize the runtime DRM / asset-resolution
			// layer instead of letting it re-hash and re-decrypt them.
			const orig = window.onload;
			window.onload = () => {
				const readFile = Utils.readFile;
				Utils.readFile = (arg) => {
					if (Utils.ext(arg) === '.loc') {
						// Pad the response with empty data, which the game cuts off.
						return ' '.repeat(Buffer.byteLength(SIGNATURE, 'utf8') + 4)
							+ readFile(arg);
					}
					return readFile(arg);
				};

				if (typeof Crypto !== 'undefined') {
					if (Crypto.resolveURL) Crypto.resolveURL = (url) => url;
					if (Crypto.resolvePath) Crypto.resolvePath = (filePath) => filePath;
					if (Crypto.dekit) Crypto.dekit = (data) => data;
					if (Crypto.hashMatchDRM) Crypto.hashMatchDRM = () => true;
				}

				orig();
			}
		</script>
	`.trim();

  const index = fs.readFileSync(indexPath, "utf8");
  fs.writeFileSync(indexPath, index.replace("</body>", `${script}\n</body>`));
}

// fs helper

/** Recursively removes a file or directory (Node < 14 has no rmSync). */
function rmrf(target) {
  if (!fs.existsSync(target)) return;
  if (fs.statSync(target).isDirectory()) {
    for (const entry of fs.readdirSync(target)) rmrf(path.join(target, entry));
    fs.rmdirSync(target);
  } else {
    fs.unlinkSync(target);
  }
}

// CLI

function parseArgs(argv) {
  const opts = { www: "www", out: "project", force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--www" || a === "-w") opts.www = argv[++i];
    else if (a === "--out" || a === "-o") opts.out = argv[++i];
    else if (a === "--force" || a === "-f") opts.force = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: node tools/extract-project.js --www <gameWww> --out <projectDir> [--force]",
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  return opts;
}

/** Accepts either a `www` folder or a game folder containing one. */
function resolveWww(input) {
  if (fs.existsSync(path.join(input, "data"))) return input;
  if (fs.existsSync(path.join(input, "www", "data"))) {
    return path.join(input, "www");
  }
  return input;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const www = resolveWww(opts.www);
  const out = opts.out;

  if (!fs.existsSync(www) || !fs.statSync(www).isDirectory()) {
    console.error(`Game www folder not found: ${opts.www}`);
    process.exit(1);
  }
  if (fs.existsSync(out)) {
    if (!opts.force) {
      console.error(
        `Output folder already exists: ${out} (pass --force to overwrite).`,
      );
      process.exit(1);
    }
    rmrf(out);
  }
  fs.mkdirSync(out, { recursive: true });

  console.time("extract");
  const stats = extract(www, out, buildNameMap());
  generateRpgProject(out);
  updatePackageJson(out);
  patchIndexHtml(out);
  console.timeEnd("extract");

  console.log(
    `Processed ${stats.total} files: ` +
      `${stats.renamed} canonical name${stats.renamed === 1 ? "" : "s"} recovered, ` +
      `${stats.extended} asset extension${stats.extended === 1 ? "" : "s"} restored` +
      (stats.langs
        ? `, ${stats.langs} language file${stats.langs === 1 ? "" : "s"} unpacked`
        : "") +
      ".",
  );
  console.log(`\nProject ready: ${path.resolve(out, "Game.rpgproject")}`);
}

main();

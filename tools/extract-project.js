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
 *   - map names           -> the remaster blanks MapInfos[].name; real names are
 *                            recovered by matching each map's localization-code
 *                            fingerprint against an older named build (see
 *                            map-names.js), the rest fall back to MapNNN.
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
 *   -w, --www <dir>     Game www folder (or a game folder containing www/).
 *   -o, --out <dir>     Output project folder (default: project).
 *   -f, --force         Overwrite the output folder if it already exists.
 *   --names-from <dir>  Recover map names against this named-maps build instead
 *                       of the bundled reference (tools/map-name-keys.json).
 *   --no-map-names      Skip map-name recovery; blank maps become MapNNN.
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
const { loadMapNameRefs, resolveMapNames } = require("./map-names.js");
const { loadCLD, lutsFromCLD, deepBake } = require("./lang-roundtrip.js");

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

// localization baking
//
// The remaster stores dialogue as placeholders the runtime Lang layer resolves:
//   (label)[KEY]  -> labelLUT[KEY]   (speaker / item names)
//   (lines)[KEY]  -> linesLUT[KEY]   (the actual text lines)
// Baking those into the data makes the project readable in the editor. With
// --playable the bundled player un-bakes it back to placeholders at run time
// (see lang-roundtrip.js), so a single extraction is both editor-readable and
// faithful to the live VN engine. The maps live in the base CLD: a
// "LANGDATA"-headed JSON shipped under a hashed data/ filename. The bake/CLD
// helpers live in lang-roundtrip.js (shared with play / pack / PlayInBrowser).

/** TCOAAL parallax-maps every map: the floor/background art is referenced from
 *  the map note as `<ground:HASH>` (+ a `<par:HASH>` parallax layer), both images
 *  under img/parallaxes/, drawn at runtime by the OrangeOverlay plugin. The
 *  editor draws nothing for these (no tileset), so surface the ground image as
 *  the native `parallaxName`: then the editor's map view shows the actual
 *  background. The note is kept intact so the runtime overlay still works. */
function setMapBackground(map) {
  if (!map || typeof map.note !== "string" || !map.note) return false;
  if (map.parallaxName) return false; // respect an existing parallax
  const ground = (map.note.match(/<ground:([^>]+)>/) || [])[1];
  const par = (map.note.match(/<par:([^>]+)>/) || [])[1];
  const img = ground || par;
  if (!img) return false;
  map.parallaxName = img;
  map.parallaxShow = true;
  map.parallaxLoopX = false;
  map.parallaxLoopY = false;
  map.parallaxSx = 0;
  map.parallaxSy = 0;
  return true;
}

/** RPG Maker MV shows the map tree from MapInfos[].name; the remaster blanks
 *  them. Recover the real name where a confident content match exists (see
 *  map-names.js: placeholder-code overlap against an older named build), and
 *  fall back to the canonical "MapNNN" for the rest so the editor isn't a list
 *  of blank rows. `nameIndex` is Map<id, name> of the confident matches. */
function fillMapNames(mapInfos, nameIndex) {
  let recovered = 0;
  let filled = 0;
  for (const e of mapInfos) {
    if (!e || (e.name && e.name !== "")) continue;
    const real = nameIndex && nameIndex.get(e.id);
    if (real) {
      e.name = real;
      recovered++;
    } else {
      e.name = "Map" + String(e.id).padStart(3, "0");
      filled++;
    }
  }
  return { recovered, filled };
}

// extraction

function extract(www, out, nameMap, lut, mapNameIndex) {
  const files = walk(www);

  let renamed = 0;
  let extended = 0;
  let langs = 0;
  let mapsNamed = 0;
  let mapsRecovered = 0;
  let mapsBg = 0;
  const bakeAcc = { n: 0 };

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
      let dec = dekit(raw, rel);

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

      // Bake localization text into the data and give maps editor-visible
      // names. Only canonical data JSON is touched; everything else is verbatim.
      if (/^data\/.+\.json$/.test(outRel)) {
        try {
          const obj = JSON.parse(dec.toString("utf8"));
          let changed = false;
          if (lut) {
            deepBake(obj, lut, bakeAcc);
            changed = true;
          }
          if (outRel === "data/MapInfos.json") {
            const r = fillMapNames(obj, mapNameIndex);
            mapsRecovered = r.recovered;
            mapsNamed = r.filled;
            changed = true;
          }
          if (/^data\/Map\d+\.json$/.test(outRel) && setMapBackground(obj)) {
            mapsBg++;
            changed = true;
          }
          if (changed) dec = Buffer.from(JSON.stringify(obj));
        } catch (e) {
          /* not valid JSON (e.g. Credits.txt-like): leave verbatim */
        }
      }

      writeOut(out, outRel, dec);
    }
  }

  return {
    total: files.length,
    renamed,
    extended,
    langs,
    baked: bakeAcc.n,
    mapsNamed,
    mapsRecovered,
    mapsBg,
  };
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
				Utils.readFile = function (filePath, encoding) {
					if (Utils.ext(filePath) === '.loc') {
						// Pad the response with empty data, which the game cuts off.
						return ' '.repeat(Buffer.byteLength(SIGNATURE, 'utf8') + 4)
							+ readFile(filePath, encoding);
					}
					// Forward ALL arguments: the DRM's Lang.loadCLD calls
					// Utils.readFile(path, null) and relies on the null encoding to
					// get a Buffer (it checks Buffer.isBuffer). Dropping the second
					// argument makes readFileSync fall back to its 'utf8' default and
					// return a string, so the CLD load throws "not a valid format".
					return readFile.apply(this, arguments);
				};

				if (typeof Crypto !== 'undefined') {
					if (Crypto.resolveURL) Crypto.resolveURL = (url) => url;
					if (Crypto.resolvePath) Crypto.resolvePath = (filePath) => filePath;
					if (Crypto.dekit) Crypto.dekit = (data) => data;
					if (Crypto.hashMatchDRM) Crypto.hashMatchDRM = () => true;
				}

				// The data/asset loaders resolve paths through App.redirect(),
				// which only returns the canonical path when the build reports it
				// is NOT obfuscated; otherwise it consults an on-disk hash map that
				// is empty here (files are decrypted under canonical/extension
				// names), yielding an empty URL that fetches index.html and breaks
				// JSON.parse. Declaring the build de-obfuscated makes redirect()
				// pass paths through untouched.
				if (typeof App !== 'undefined' && App.usesObfuscation) {
					App.usesObfuscation = () => false;
				}

				// Lang.init (and other filesystem reads) resolve files against
				// App.rootPath() = dirname(process.mainModule.filename), which does
				// not point at the project when launched from the RPG Maker MV
				// editor / a playtest host: so the base-language CLD isn't found
				// and all dialogue labels go missing. nw.__dirname is the project
				// folder (where index.html lives), so anchor rootPath there.
				if (
					typeof App !== 'undefined' &&
					App.rootPath &&
					typeof nw !== 'undefined' &&
					nw.__dirname
				) {
					App.rootPath = () => nw.__dirname;
				}

				orig();
			}
		</script>
	`.trim();

  const index = fs.readFileSync(indexPath, "utf8");
  fs.writeFileSync(indexPath, index.replace("</body>", `${script}\n</body>`));
}

function normalizePluginsJs(out) {
  const pluginsPath = path.join(out, "js", "plugins.js");
  if (!fs.existsSync(pluginsPath)) return;

  // The remaster leaves a trailing comma before the closing bracket of the
  // $plugins array. The game runtime parses it with eval() (which tolerates
  // it), but the RPG Maker MV editor uses a strict JSON-style parser that
  // rejects it and refuses to open the project ("Unable to read file
  // plugins.js"). Strip just that trailing comma; the stock format has none.
  const src = fs.readFileSync(pluginsPath, "utf8");
  const fixed = src.replace(/,(\s*)\];(\s*)$/, "$1];$2");
  if (fixed !== src) fs.writeFileSync(pluginsPath, fixed);
}

/**
 * Bundle the BrowserPlayer launcher into the project (--playable): the browser
 * shim (pako + browser-shim.js) under _play/, the PlayInBrowser plugin, and a
 * registration in plugins.js. Lets the editor playtest hand off to true
 * browser-mode rendering. See tools/playerbundle/PlayInBrowser.js.
 */
function installPlayer(out) {
  const srcLib = path.join(__dirname, "..", "app", "js", "libs");
  const dstPlay = path.join(out, "_play");
  fs.mkdirSync(dstPlay, { recursive: true });
  for (const f of ["browser-shim.js", "pako_inflate.min.js"]) {
    fs.copyFileSync(path.join(srcLib, f), path.join(dstPlay, f));
  }
  // The un-baker, so the in-editor PlayInBrowser plugin can require it (NW.js)
  // to restore dialogue placeholders + CLD entries before serving the game.
  fs.copyFileSync(
    path.join(__dirname, "lang-roundtrip.js"),
    path.join(dstPlay, "lang-roundtrip.js"),
  );

  const pluginsDir = path.join(out, "js", "plugins");
  fs.mkdirSync(pluginsDir, { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, "playerbundle", "PlayInBrowser.js"),
    path.join(pluginsDir, "PlayInBrowser.js"),
  );

  // Register it in plugins.js (enabled), unless already present.
  const pj = path.join(out, "js", "plugins.js");
  if (fs.existsSync(pj)) {
    let src = fs.readFileSync(pj, "utf8");
    if (!/["']PlayInBrowser["']/.test(src)) {
      const entry =
        '{"name":"PlayInBrowser","status":true,"description":"","parameters":{}}';
      src = src.replace(/\n\];(\s*)$/, ",\n" + entry + "\n];$1");
      fs.writeFileSync(pj, src);
    }
  }
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
  const opts = {
    www: "www",
    out: "project",
    force: false,
    bake: true,
    playable: false,
    mapNames: true,
    namesFrom: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--www" || a === "-w") opts.www = argv[++i];
    else if (a === "--out" || a === "-o") opts.out = argv[++i];
    else if (a === "--force" || a === "-f") opts.force = true;
    else if (a === "--no-bake") opts.bake = false;
    else if (a === "--playable") opts.playable = true;
    else if (a === "--no-map-names") opts.mapNames = false;
    else if (a === "--names-from") opts.namesFrom = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: node tools/extract-project.js --www <gameWww> --out <projectDir> [--force] [--no-bake] [--playable]\n" +
          "  --no-bake          keep dialogue placeholders ((label)[..]/(lines)[..]) instead\n" +
          "                     of baking the base-language text into the data.\n" +
          "  --playable         bundle the BrowserPlayer launcher (F9 / title 'Play in\n" +
          "                     Browser') so the editor playtest can hand off to correct\n" +
          "                     browser-mode rendering. Bakes readable text for the editor\n" +
          "                     and un-bakes it back to (label)/(lines) placeholders at\n" +
          "                     run/pack time so the live VN engine renders correctly.\n" +
          "  --names-from <dir> recover map names by matching against this named-maps game\n" +
          "                     build instead of the bundled reference (tools/map-name-keys.json).\n" +
          "  --no-map-names     skip map-name recovery; blank maps become MapNNN.",
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

  // --playable bakes readable text into the editor AND runs the game's own
  // localization layer (Lang) + VN text engine (command101) live in the browser.
  // command101 resolves (label)/(lines) placeholders ITSELF and lays the dialogue
  // out (speaker header + per-line word-wrap + paging) by feeding Lang.lines()'s
  // segments as separate $gameMessage lines. A baked literal has no placeholder,
  // so the live engine would collapse it onto one speaker-less line. The bundled
  // player therefore *un-bakes* the data back to placeholders at run/pack time
  // (lang-roundtrip.js): unchanged dialogue is restored to its original CLD key,
  // edited / new dialogue gets a freshly minted key. So bake + --playable now
  // coexist: editor shows real text, the game renders the true VN layout.
  const cldInfo = opts.bake ? loadCLD(path.join(www, "data")) : null;
  const lut = cldInfo ? lutsFromCLD(cldInfo.cld) : null;
  if (opts.bake && !lut) {
    console.warn("No base CLD found: dialogue placeholders left unbaked.");
  }

  // Map-name recovery: the remaster blanks MapInfos names, so match each map's
  // localization-code fingerprint against an older named build (bundled
  // reference, or a live one via --names-from) before the walk names MapInfos.
  let mapNameIndex = null;
  if (opts.mapNames) {
    const refs = loadMapNameRefs(opts.namesFrom);
    if (!refs) {
      console.warn(
        opts.namesFrom
          ? `No named maps found in --names-from ${opts.namesFrom}: maps become MapNNN.`
          : "No bundled map-name reference (tools/map-name-keys.json): maps become MapNNN.",
      );
    } else {
      mapNameIndex = resolveMapNames(www, refs);
    }
  }

  console.time("extract");
  const stats = extract(www, out, buildNameMap(), lut, mapNameIndex);
  generateRpgProject(out);
  updatePackageJson(out);
  patchIndexHtml(out);
  normalizePluginsJs(out);
  if (opts.playable) installPlayer(out);
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
  if (stats.baked) {
    console.log(`Baked ${stats.baked} localized text placeholders into the data.`);
  }
  if (stats.mapsRecovered) {
    console.log(
      `Recovered ${stats.mapsRecovered} real map name${stats.mapsRecovered === 1 ? "" : "s"} by content match.`,
    );
  }
  if (stats.mapsNamed) {
    console.log(`Filled ${stats.mapsNamed} remaining blank map name${stats.mapsNamed === 1 ? "" : "s"} (MapNNN).`);
  }
  if (stats.mapsBg) {
    console.log(`Set ${stats.mapsBg} map parallax background${stats.mapsBg === 1 ? "" : "s"} from <ground>/<par> notes.`);
  }
  if (opts.playable) {
    console.log(
      "Bundled the BrowserPlayer launcher (press F9 in playtest, or title 'Play in Browser').",
    );
  }
  console.log(`\nProject ready: ${path.resolve(out, "Game.rpgproject")}`);
}

main();

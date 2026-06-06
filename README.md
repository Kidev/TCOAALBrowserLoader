# kidev's TCOAAL Browser Loader

**Requires to own the game to work.**  

A browser tool to play [_The Coffin of Andy and Leyley_](https://store.steampowered.com/app/2378900/The_Coffin_of_Andy_and_Leyley/) (by _Nemlei_) from the browser. Allows you to play the base game and mods without installing anything. Save files are kept between sessions, and are saved in a per-mod basis.  

## Additional tools

Maintenance and modding scripts live in `tools/` and are run from the project root.

### Modding round-trip

Recover an editable RPG Maker MV project from a shipped game, edit it, then pack it back:

```bash
# Extract an editable project (baked dialogue + recovered names + map backgrounds)
node tools/extract-project.js --www .hide/current_game/www --out ./project

# Run the extracted project in true browser mode straight from the shell
node tools/play.js ./project

# Pack the edited project back into a shipped TCOAAL www/
node tools/pack-project.js --project ./project --out ./www

# Then play it offline
node server.js ./www
```

Add `--playable` to `extract-project.js` for an in-editor "Play in Browser" (F9) build,
or `--no-bake` to keep raw localization placeholders for an editor-only project.

### Building mods

```bash
# Flatten a Tomb-format overhaul into a self-contained, importable www/
node tools/build-tomb-mod.js --diff <modDir> --base old_game --out <outDir>

# Package a Tomb translation for translations.tcoaal.app
node tools/build-tomb-translation.js --translation <transDir> --out <outDir>

# Refresh mods.json (versions, file lists, remote translations/extras)
node tools/generate-manifests.js

# Prune mod files that are byte-identical to the base game (--dry-run to preview)
node tools/dedup-mods.js
```

### Inspection

```bash
# Decrypt a single logical file from any game version
node tools/decode.js <gameDir> data/System.json

# Dump the MapInfos id->name table
node tools/decode.js <gameDir> --names

# Extract a CLD into the translator layout (img/, font/, dialogue.csv)
node tools/extract-cld.js <input.cld> [outDir]
```

## Credits

Created by Kidev as a fan tool for the community. 

Some assets, theme and inspiration by **Nemlei**

Faustina font by Google.

[pako](https://github.com/nodeca/pako) by nodeca.


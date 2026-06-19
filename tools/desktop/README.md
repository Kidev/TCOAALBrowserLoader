# TCOAAL desktop apps

Two small cross-platform desktop apps (Tauri v2) that wrap the repo's `tools/`.
They do not reimplement anything: each bundles a Node runtime plus the `tools/`
scripts and `app/js/libs/`, and shells out to Node to run the same scripts the
CLI uses.

- **creator** (`TCOAAL Mod Creator`) - create a project from a game folder
  (`extract-project.js`), run it in the browser during development
  (`play.js`), re-pack it (`pack-project.js`), and build a shareable
  `.tcoaalmod` diff for one or more base game versions (`share-project.js`).
- **user** (`TCOAAL Mod Installer`) - install a `.tcoaalmod` onto a game folder
  in place and uninstall it (restore), one mod at a time
  (`share-project.js --apply` / `--rollback`).

Both apps share a tabbed UI (one tab per feature, matching the browser
`app/modding.html` Modding page) and a **Steam versions** tab (see below).

## Steam version downloader

The Steam logic lives in `core/src/lib.rs` (std-only) and both apps expose it as
`steam_*` Tauri commands. It detects the Steam install per-OS, opens the Steam
client console and puts `download_depot 2378900 2378901 <manifest>` on the
clipboard for the user to paste (TCOAAL is paid, so the download must use the
owning account's logged-in client - anonymous SteamCMD can't), then waits for
`<steam>/steamapps/content/app_2378900/depot_2378901/` to stop changing and
**moves it into shared app storage** (`tcoaal-mods/versions/<key>/`) so a later
Steam update can't overwrite it.

Historical depot manifest IDs are not in any public Steam Web API (that is
SteamDB's archived data), so the version list lives in
**`tools/tcoaal-versions.json`**, maintained by **`tools/update-game-manifest-ids.js`**
(harvests versions you downloaded via the apps + your local Steam, and takes
manual `--add --manifest <id> ...` entries read off steamdb).

The apps work **fully offline** at launch from the bundled catalog (the
`tools/*.json` resource glob) **plus two local Steam facts**: the **installed**
version (manifest + build id from `appmanifest_2378900.acf`) and the **latest
available** version (parsed from the Steam client's binary appinfo cache,
`appcache/appinfo.vdf` - the same data `app_info_print 2378900` prints:
`depots.2378901.manifests.public.gid` + `branches.public.buildid`). So the newest
version is known for free even when not installed, an install older than the
latest is flagged **outdated** (with a one-click download of the latest), and a
build id higher than the catalog is surfaced as a brand-new release usable
immediately (and contributable via the generator). The appinfo parser
(`read_public_manifest` in Rust, `readPublicManifest` in the generator) is fully
bounds-checked and best-effort - any malformed shape yields nothing and the app
falls back to the installed manifest + catalog (covered by a gated unit test
built from the real `app_info_print` output). A **"Check for missing versions"**
button is the only network
path: on demand it pulls the repo's latest list
(`raw.githubusercontent.com/.../tools/tcoaal-versions.json`, which sends
`Access-Control-Allow-Origin: *`, so a plain webview `fetch` works - no Rust HTTP
dependency) and reconciles it with the installed version - useful after not
playing for a while. So one commit of an updated catalog reaches every app for
free, but nothing is fetched unless asked. The creator embeds each archived
version's `steam.json`
(appid/depot/manifest) into the `.tcoaalmod` variant it builds, so the installer
(`mod_info` -> `share-project.js --info`) can offer the player a one-click
download of a supported version even without the catalog. Archived versions are
selectable as build bases (creator) or as the install target (user), and are
shared between the two apps.

## Layout

```
tools/
  build.sh              one-shot builder -> tools/bin/ (gitignored)
  desktop/
    Cargo.toml          workspace (core + both src-tauri crates)
    core/               shared Rust: locate the bundled Node + run a tool
    creator/
      package.json      @tauri-apps/cli
      ui/index.html     frontend (loader.html-styled, static)
      src-tauri/        Tauri app (Cargo.toml, tauri.conf.json, src/main.rs)
    user/               same shape
```

## Easiest: build everything

From the repo root:

```bash
tools/build.sh            # both apps -> tools/bin/
# or: tools/build.sh creator   |   tools/build.sh user
```

`build.sh` installs the Tauri CLI, generates icons, stages this machine's Node
into each app's `src-tauri/runtime/`, runs `tauri build`, and copies the
executable + installers (AppImage/deb/rpm/dmg/msi/exe) into `tools/bin/`. It
exports `APPIMAGE_EXTRACT_AND_RUN=1` / `NO_STRIP=true` so the AppImage step
works without FUSE.

## Build prerequisites

- Rust (stable) and the platform's Tauri deps (on Arch:
  `webkit2gtk-4.1 base-devel librsvg libappindicator-gtk3`; on Debian/Ubuntu:
  `libwebkit2gtk-4.1-dev librsvg2-dev libgtk-3-dev patchelf`).
- Node.js (for `@tauri-apps/cli`).

## By hand (one app)

```bash
cd tools/desktop/creator        # or tools/desktop/user
npm install                     # @tauri-apps/cli (once)
npx @tauri-apps/cli icon ../../../app/img/icon-512.png   # once
mkdir -p src-tauri/runtime && cp "$(command -v node)" src-tauri/runtime/node
export APPIMAGE_EXTRACT_AND_RUN=1 NO_STRIP=true
npx @tauri-apps/cli build       # outputs under tools/desktop/target/release/
```

## Fast iteration with `tauri dev`

In dev mode the bundled resources are not next to the dev binary, so point the
app at the repo and your own Node with two env vars (the apps honor
`TCOAAL_RES_DIR` and `TCOAAL_NODE`):

```bash
cd tools/desktop/creator
TCOAAL_RES_DIR="$(git -C ../../.. rev-parse --show-toplevel)" \
TCOAAL_NODE="$(command -v node)" \
  npm run dev
```

`TCOAAL_RES_DIR` is the repo root (it has the `tools/` scripts + `app/js/libs/`);
`TCOAAL_NODE` is the Node that runs them. No `runtime/` copy needed in dev.

## CI

`.github/workflows/desktop.yml` builds both apps for Windows/macOS/Linux on tag
`v*` (or manual dispatch): it copies the runner's Node into `runtime/`, generates
icons, runs `tauri build`, and uploads the installers as artifacts.

## How the bundling works

`tauri.conf.json` ships these resources into the app bundle: the `tools/`
scripts (`../../../*.js`, `../../../*.json`, `../../../playerbundle/*` -> `tools`)
plus `../../../../app/js/libs/* -> app/js/libs` and `runtime -> runtime`. At
runtime `core::run_tool` resolves the app's resource dir, runs
`runtime/node tools/<script> ...` with the resource dir as the working directory
(so the tools find their sibling data files and `app/js/libs` exactly as in the
repo), and returns stdout/stderr to the webview. `tools/bin/` (the build output)
is deliberately not bundled.

# TCOAAL Player - Android WebView wrapper

Author: kidev

A thin native Android app that runs https://tcoaal.app inside a `WebView`. The
point is **save durability**: a WebView's storage lives in the app's private
sandbox (`app_webview/`), so it is never subject to the browser storage eviction
that hits an installed PWA (Chrome storage pressure, Safari ITP). On top of that,
saves are mirrored to a tiny native file that rides **Android Auto Backup**, so
they survive a factory reset or a move to a new device.

## How durability is achieved

| Threat | Plain PWA / TWA | This app |
| --- | --- | --- |
| Storage pressure / ITP eviction | Can wipe IndexedDB | Sandbox storage, not evictable |
| Clear browser data | Wipes it | Untouched (separate from Chrome) |
| Uninstall / "Clear data" on this app | n/a | Gone (by definition) |
| Factory reset / new phone | Lost | **Restored** via Auto Backup of the save mirror |

The game files (hundreds of MB) stay in the WebView's per-origin IndexedDB and
are **excluded** from backup - they blow past Auto Backup's 25 MB cap and are
re-importable from the user's own game folder. Only the small saves file is
backed up. Because all three IndexedDB databases (`tcoaal`, `tcoaal-saves`,
`tcoaal-translations`) share one origin directory on disk, saves can't be
file-granularly backed up - hence the native bridge instead of a backup-rules
path glob.

### Components

- `MainActivity.kt` - the WebView host: enables service workers, routes external
  links to the system browser (`UrlPolicy`), wires the file chooser for the
  loader's `.zip` import, and drives the save mirror.
- `SaveStore.kt` - atomic read/write of `filesDir/save-backup.json` (the only
  backed-up file). Pure `java.io`, unit-tested.
- `SaveBridge.kt` - the `@JavascriptInterface` (`window.AndroidSaveBridge`).
- `assets/save-sync.js` - injected after each page load; exports the live saves
  (localStorage keys matching the RPG save pattern) to native and restores the
  backed-up snapshot non-destructively into `localStorage` + the `tcoaal-saves`
  IndexedDB store on startup.
- `res/xml/backup_rules.xml` + `data_extraction_rules.xml` - allowlist Auto
  Backup to just `save-backup.json`.

## Build & run

Requires Android Studio (or command-line Android SDK) with **JDK 17**.

```bash
# from android/
./gradlew assembleDebug          # build the APK
./gradlew installDebug           # install on a connected device/emulator
```

On first launch the WebView loads tcoaal.app; import your game's `www/` as a
**.zip** via the loader (see constraint below), and it runs from the sandbox.

## Tests

The split matters - one half needs no device, the other is the de-risk gate.

```bash
# Pure-JVM unit tests (no emulator): URL policy + save-mirror file store.
./gradlew test

# Instrumented de-risk gate (needs an emulator/device): proves a service worker
# registers, INTERCEPTS a fetch, and IndexedDB persists - all in a real WebView,
# hermetically (loopback server on 127.0.0.1, no network).
./gradlew connectedDebugAndroidTest
```

`ServiceWorkerSmokeTest` is the thing to run **before** trusting the app: the
entire asset-decryption pipeline relies on the WebView honoring a page-registered
service worker's `fetch` handler. If it passes, the architecture is sound on that
device's WebView.

## Known constraints

- **Folder import is desktop-only.** The loader's "select folder" uses
  `webkitdirectory`, which Android WebView's file chooser cannot satisfy. On
  mobile, import the game as a **.zip** (the loader supports this) - the file
  chooser is wired for it.
- **Auto Backup needs the user's Google backup enabled**, runs on Google's
  schedule (roughly daily, on wifi + charging + idle), and is capped at 25 MB
  (the save mirror is far under that).
- **iOS is not covered** - WKWebView storage is more durable than a Safari tab
  but still WebKit-managed, and "just a website" wrappers face App Store review
  friction. This durability story is Android-specific.
- The Gradle wrapper jar is gitignored; Android Studio regenerates it on import,
  or run `gradle wrapper --gradle-version 8.7` once with a system Gradle.

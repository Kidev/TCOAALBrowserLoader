/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser stub for "@napi-rs/canvas". build-tomb-mod's canvas() does a
 * try/require and falls back to null on failure, so throwing here makes
 * canvas() return null in the browser  -  image deltas / parallax composites are
 * then skipped (they don't affect data/*.json, so the share-project fingerprint
 * is unchanged). A real canvas backend would be wired here for in-browser Tomb.
 */
"use strict";
throw new Error("@napi-rs/canvas is unavailable in the browser bundle");

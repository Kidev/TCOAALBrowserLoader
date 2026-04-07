#!/usr/bin/env node
/**
 * generate-manifests.js
 *
 * Walks each mod directory under mods/ and writes the file lists directly
 * into mods.json (as "version" and "files" fields on each mod entry).
 *
 * - Mods in folders starting with '_' get type prefixed with "built-in"
 *   and author defaults to "kidev".
 * - Non-_ mods with a "repo" field get author and lastUpdate fetched from
 *   the GitHub API.
 *
 * Usage:  node generate-manifests.js
 */

'use strict';

var fs   = require('fs');
var path = require('path');
var cp   = require('child_process');
var https = require('https');

var MODS_JSON = path.join(__dirname, 'mods.json');
var MODS_DIR  = path.join(__dirname, 'mods');

function walkDir(dir, base) {
    var results = [];
    var entries;
    try { entries = fs.readdirSync(dir); } catch (e) { return results; }
    for (var i = 0; i < entries.length; i++) {
        var full = path.join(dir, entries[i]);
        var rel  = path.join(base, entries[i]).replace(/\\/g, '/');
        var stat;
        try { stat = fs.statSync(full); } catch (e) { continue; }
        if (stat.isDirectory()) {
            results = results.concat(walkDir(full, rel));
        } else {
            results.push(rel);
        }
    }
    return results;
}

function getModVersion(modDir) {
    var pkgPath = path.join(modDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            var pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.version) return pkg.version;
        } catch (e) {}
    }
    try {
        var ver = cp.execSync('git describe --tags --always 2>/dev/null', {
            cwd: modDir, encoding: 'utf8'
        }).trim();
        if (ver) return ver;
    } catch (e) {}
    return '';
}

/** Parse "https://github.com/owner/repo" -> { owner, repo } or null. */
function parseGithubUrl(url) {
    var m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!m) return null;
    return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

/** Fetch JSON from a GitHub API endpoint. */
function ghApiFetch(apiPath) {
    return new Promise(function (resolve) {
        var options = {
            hostname: 'api.github.com',
            path: apiPath,
            headers: { 'User-Agent': 'TCOAAL-Mods' }
        };
        https.get(options, function (res) {
            var body = '';
            res.on('data', function (c) { body += c; });
            res.on('end', function () {
                try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
            });
        }).on('error', function () { resolve(null); });
    });
}

/** Fetch author and last update date from a GitHub repo. */
async function fetchGithubMeta(repoUrl) {
    var gh = parseGithubUrl(repoUrl);
    if (!gh) return null;
    var base = '/repos/' + gh.owner + '/' + gh.repo;

    // Get repo info for the owner
    var repo = await ghApiFetch(base);
    var author = repo && repo.owner ? repo.owner.login : null;

    // Get latest commit date
    var commits = await ghApiFetch(base + '/commits?per_page=1');
    var lastUpdate = null;
    if (commits && commits.length > 0) {
        var d = commits[0].commit && commits[0].commit.committer &&
                commits[0].commit.committer.date;
        if (d) lastUpdate = d.substring(0, 10);
    }

    return { author: author, lastUpdate: lastUpdate };
}

async function main() {
    // Read existing mods.json
    var modsData;
    try {
        modsData = JSON.parse(fs.readFileSync(MODS_JSON, 'utf8'));
    } catch (e) {
        console.error('Cannot read mods.json:', e.message);
        process.exit(1);
    }

    var count = 0;
    var keys = Object.keys(modsData);
    for (var i = 0; i < keys.length; i++) {
        var modId  = keys[i];
        var entry  = modsData[modId];
        var modPath = entry.path || ('mods/' + modId);
        var modDir = path.join(__dirname, modPath);
        var wwwDir = path.join(modDir, 'www');
        var isBuiltin = modId.charAt(0) === '_';

        // Built-in mods: prefix type, default author
        if (isBuiltin) {
            var baseType = (entry.type || 'plugin').replace(/^built-in\s+/i, '');
            entry.type = 'built-in ' + baseType;
            if (!entry.author) entry.author = 'kidev';
        }

        // External mods with a repo: fetch metadata from GitHub
        if (!isBuiltin && entry.repo) {
            console.log('[github] Fetching metadata for ' + modId + '...');
            var meta = await fetchGithubMeta(entry.repo);
            if (meta) {
                if (meta.author) entry.author = meta.author;
                if (meta.lastUpdate) entry.lastUpdate = meta.lastUpdate;
                console.log('  author: ' + (meta.author || '(unchanged)') +
                            ', lastUpdate: ' + (meta.lastUpdate || '(unchanged)'));
            }
        }

        if (!fs.existsSync(wwwDir) || !fs.statSync(wwwDir).isDirectory()) {
            console.log('[skip] ' + modId + ': no www/ directory');
            continue;
        }

        var files   = walkDir(wwwDir, '');
        var version = getModVersion(modDir);

        entry.version = version;
        entry.files   = files;

        console.log('[manifest] ' + modId + ': ' + files.length + ' files' +
                    (version ? ' (v' + version + ')' : ''));
        count++;
    }

    fs.writeFileSync(MODS_JSON, JSON.stringify(modsData, null, 2) + '\n');

    if (count === 0) {
        console.log('No mods with www/ directories found.');
    } else {
        console.log('Updated mods.json with ' + count + ' manifest(s).');
    }
}

main().catch(function (e) {
    console.error('Fatal:', e);
    process.exit(1);
});

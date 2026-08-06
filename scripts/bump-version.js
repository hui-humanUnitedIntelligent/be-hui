#!/usr/bin/env node
// scripts/bump-version.js — Node.js Version Bump
// Usage: node scripts/bump-version.js [patch|minor|major|<version>]
// SSOT: package.json → build.gradle + strings.xml

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
const stringsPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

const mode = process.argv[2] || 'patch';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
let [major, minor, patch] = pkg.version.split('.').map(Number);

switch (mode) {
  case 'patch':  patch++; break;
  case 'minor':  minor++; patch = 0; break;
  case 'major':  major++; minor = 0; patch = 0; break;
  default:
    if (/^\d+\.\d+\.\d+$/.test(mode)) {
      [major, minor, patch] = mode.split('.').map(Number);
    } else {
      console.error(`Unknown: ${mode}. Use patch|minor|major|<version>`);
      process.exit(1);
    }
}

const newVersion = `${major}.${minor}.${patch}`;
let gradle = fs.readFileSync(gradlePath, 'utf8');
const codeMatch = gradle.match(/versionCode\s+(\d+)/);
const newCode = (codeMatch ? parseInt(codeMatch[1], 10) : 1) + 1;

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
fs.writeFileSync(gradlePath, gradle);

if (fs.existsSync(stringsPath)) {
  let s = fs.readFileSync(stringsPath, 'utf8');
  s = s.replace(/<string name="app_name">.*<\/string>/, `<string name="app_name">HUI v${newVersion}</string>`);
  fs.writeFileSync(stringsPath, s);
}

console.log(`Version: ${newVersion} (Code ${newCode})`);

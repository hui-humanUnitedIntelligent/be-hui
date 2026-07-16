const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

// Read package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Increase version (major.minor.patch)
let [major, minor, patch] = pkg.version.split('.').map(Number);
patch++;
pkg.version = `${major}.${minor}.${patch}`;

// Write updated package.json
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// Read build.gradle
let gradle = fs.readFileSync(gradlePath, 'utf8');

// Update versionCode
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${patch}`);

// Update versionName
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${pkg.version}"`);

// Write updated build.gradle
fs.writeFileSync(gradlePath, gradle);

console.log(`Version bumped to ${pkg.version}`);

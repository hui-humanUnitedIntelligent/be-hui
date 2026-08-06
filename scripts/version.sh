#!/bin/bash

set -e

# Windows-kompatiblen Pfad holen
WIN_PATH=$(pwd -W)

# Version aus package.json lesen
VERSION=$(node -e "console.log(require('$WIN_PATH/package.json').version)")

# Version Code aus version.ts lesen
VERSION_CODE=$(node -e "console.log(require('$WIN_PATH/src/version.ts').APP_VERSION_CODE)")

echo "Aktuelle Version: $VERSION ($VERSION_CODE)"

# Minor-Version erhöhen
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
NEW_MINOR=$((MINOR + 1))
NEW_VERSION="$MAJOR.$NEW_MINOR.$PATCH"

echo "Neue Version: $NEW_VERSION"

# package.json aktualisieren
node -e "
const fs = require('fs');
const pkgPath = '$WIN_PATH/package.json';
const pkg = require(pkgPath);
pkg.version = '$NEW_VERSION';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
"

echo "Version erfolgreich erhöht."

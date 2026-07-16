#!/usr/bin/env bash
set -e

# 1. Nächste Version bestimmen (Patch erhöhen)
CURRENT_VERSION=$(node -p "require('./package.json').version")
NEXT_VERSION=$(node -e "
const v = require('./package.json').version.split('.');
v[2] = parseInt(v[2]) + 1;
console.log(v.join('.'));
")

echo "Aktuelle Version: $CURRENT_VERSION"
echo "Neue Version:     $NEXT_VERSION"

# 2. package.json Version setzen
npm version "$NEXT_VERSION" --no-git-tag-version

# 3. Android build.gradle Version setzen
# Annahme: versionName ist z.B. "2.0.2 Beta" → wir ersetzen nur die Zahl
sed -i "s/versionName \".*\"/versionName \"${NEXT_VERSION} Beta\"/g" android/app/build.gradle

# versionCode auslesen und erhöhen
CURRENT_CODE=$(grep "versionCode" android/app/build.gradle | awk '{print $2}')
NEXT_CODE=$((CURRENT_CODE + 1))
sed -i "s/versionCode ${CURRENT_CODE}/versionCode ${NEXT_CODE}/g" android/app/build.gradle

echo "versionCode: ${CURRENT_CODE} → ${NEXT_CODE}"

# 4. src/version.ts aktualisieren
# Annahme: APP_VERSION & APP_VERSION_CODE existieren
sed -i "s/export const APP_VERSION = \".*\"/export const APP_VERSION = \"${NEXT_VERSION} Beta\"/g" src/version.ts
sed -i "s/export const APP_VERSION_CODE = .*/export const APP_VERSION_CODE = ${NEXT_CODE};/g" src/version.ts

# 5. Git: pull --rebase
echo "Git: pull --rebase..."
git pull --rebase

# 6. Änderungen committen
git add package.json android/app/build.gradle src/version.ts
git commit -m "Release ${NEXT_VERSION}"

# 7. Pushen
echo "Git: push..."
git push

# 8. Capacitor sync
echo "Capacitor: sync..."
npx cap sync

# 9. Release-Script starten
echo "Starte Release-Script..."
bash scripts/release.sh

# 10. Android Studio öffnen
echo "Öffne Android Studio..."
npx cap open android

echo "✅ Auto-Release für Version ${NEXT_VERSION} abgeschlossen."

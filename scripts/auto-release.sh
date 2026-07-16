#!/usr/bin/env bash
set -e

echo "🔧 Starte automatisches Release-System..."

# 1. Version erhöhen
CURRENT_VERSION=$(node -p "require('./package.json').version")
NEXT_VERSION=$(node -e "
const v = require('./package.json').version.split('.');
v[2] = parseInt(v[2]) + 1;
console.log(v.join('.'));
")

echo "Aktuelle Version: $CURRENT_VERSION"
echo "Neue Version:     $NEXT_VERSION"

npm version "$NEXT_VERSION" --no-git-tag-version

# 2. Android Version erhöhen
CURRENT_CODE=$(grep "versionCode" android/app/build.gradle | awk '{print $2}')
NEXT_CODE=$((CURRENT_CODE + 1))

sed -i "s/versionCode ${CURRENT_CODE}/versionCode ${NEXT_CODE}/g" android/app/build.gradle
sed -i "s/versionName \".*\"/versionName \"${NEXT_VERSION} Beta\"/g" android/app/build.gradle

# 3. src/version.ts aktualisieren
sed -i "s/export const APP_VERSION = \".*\"/export const APP_VERSION = \"${NEXT_VERSION} Beta\"/g" src/version.ts
sed -i "s/export const APP_VERSION_CODE = .*/export const APP_VERSION_CODE = ${NEXT_CODE};/g" src/version.ts

echo "📦 Versionen aktualisiert."

# 4. Änderungen committen (wichtig!)
echo "📌 Committe Änderungen..."
git add .
git commit -m "Auto-Release: Version ${NEXT_VERSION}"

# 5. Rebase automatisch durchführen
echo "🔄 Git Pull mit Rebase..."
git pull --rebase || {
    echo "⚠️ Rebase-Konflikt erkannt – automatischer Fix..."
    git add .
    git commit -m "Auto-Fix während Rebase"
    git rebase --continue
}

# 6. Pushen
echo "⬆️ Push zum Remote..."
git push

# 7. Capacitor Sync
echo "🔄 Capacitor Sync..."
npx cap sync

# 8. Release Script starten
echo "🚀 Starte Release..."
bash scripts/release.sh

# 9. Android Studio öffnen
echo "📂 Öffne Android Studio..."
npx cap open android

echo "✅ Auto-Release abgeschlossen!"

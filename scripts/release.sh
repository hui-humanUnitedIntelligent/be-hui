#!/bin/bash

set -e

echo ""
echo "══════════════════════════════════════════════"
echo "   HUI RELEASE SYSTEM — Windows Stable Build"
echo "══════════════════════════════════════════════"
echo ""

# Windows-kompatiblen Pfad holen
WIN_PATH=$(pwd -W)

echo "🧹 Lösche alten www Ordner..."
rm -rf www

echo "🔧 Version erhöhen..."
bash scripts/version.sh

echo "🌐 Web Build..."
npm run build

echo "🔄 Capacitor Sync..."
npx cap sync android

echo "📦 Git Commit..."
git add .
git commit -m "Release Build"

echo "⬆️ Git Push..."
git push

echo "🏗️ Android Release Build..."
cd android
./gradlew assembleRelease
cd ..

echo "📱 APK Rename..."

APK_SOURCE="$WIN_PATH/android/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_SOURCE" ]; then
  echo "❌ APK nicht gefunden: $APK_SOURCE"
  exit 1
fi

VERSION_NAME=$(node -e "console.log(require('$WIN_PATH/package.json').version)")
VERSION_CODE=$(node -e "console.log(require('$WIN_PATH/src/version.ts').APP_VERSION_CODE)")

APK_TARGET="$WIN_PATH/app-release-v$VERSION_NAME-$VERSION_CODE.apk"

mv "$APK_SOURCE" "$APK_TARGET"

echo "✅ APK erfolgreich umbenannt:"
echo "➡️ $APK_TARGET"

echo ""
echo "🚀 Release abgeschlossen!"
echo "GitHub Actions baut jetzt automatisch deine APK."

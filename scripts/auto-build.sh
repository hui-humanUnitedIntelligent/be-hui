#!/usr/bin/env bash
set -e

echo "🚀 Starte automatischen HUI Build-Prozess..."

# 1. Neueste Änderungen holen
echo "⬇️ Hole neueste Änderungen..."
git pull

# 2. Web-App bauen
echo "🏗️ Baue Web-App..."
npm run build

# 3. Capacitor Sync
echo "🔄 Synchronisiere Capacitor..."
npx cap sync android

# 4. Android Build
echo "🏗️ Baue Release APK..."
cd android
./gradlew assembleRelease

echo "🎉 APK erfolgreich gebaut!"
echo "📦 Pfad: android/app/build/outputs/apk/release/app-release.apk"

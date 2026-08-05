#!/bin/bash

echo "----------------------------------------"
echo "   HUI AUTO-RELEASE SYSTEM STARTET"
echo "----------------------------------------"

echo "Hole neuesten Base-Deploy..."
git fetch origin
git reset --hard origin/main

echo "Installiere Dependencies..."
npm install

echo "Erzeuge Web-Build..."
npm run build

echo "Sync Capacitor..."
npx cap sync android

echo "Erhöhe Version..."
bash scripts/auto-version.sh

echo "Setze App-Namen..."
bash scripts/auto-appname.sh

echo "Öffne Android Studio..."
npx cap open android

echo "----------------------------------------"
echo "   FERTIG!"
echo "   Öffne Android Studio → Build → Generate Signed APK"
echo "----------------------------------------"

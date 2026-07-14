#!/bin/bash

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

echo "🚀 Release gestartet! GitHub Actions baut jetzt automatisch deine APK."

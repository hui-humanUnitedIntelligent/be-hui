#!/bin/bash
# scripts/auto-appname.sh — Setzt den App-Namen in strings.xml
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")
sed -i "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">HUI v${VERSION}</string>|" \
  "${ROOT_DIR}/android/app/src/main/res/values/strings.xml"
echo "App-Name: HUI v${VERSION}"

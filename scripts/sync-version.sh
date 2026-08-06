#!/usr/bin/env bash
# =============================================================================
# scripts/sync-version.sh — postversion Hook (wird von npm version aufgerufen)
# =============================================================================
# npm hat package.json bereits aktualisiert.
# Dieses Script synct build.gradle + strings.xml.
# version.ts braucht NICHT aktualisiert zu werden (liest dynamisch).
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_GRADLE="${ROOT_DIR}/android/app/build.gradle"
PACKAGE_JSON="${ROOT_DIR}/package.json"
STRINGS_XML="${ROOT_DIR}/android/app/src/main/res/values/strings.xml"

NEW_VERSION=$(node -p "require('$PACKAGE_JSON').version")

# Validierung: NIE "minor"/"patch"/"major" als Versionstext
[[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
  echo "❌ Ungültige Version: '$NEW_VERSION'"
  exit 1
}

CURRENT_CODE=$(grep -oP 'versionCode\s+\K[0-9]+' "$BUILD_GRADLE" || echo "1")
NEW_CODE=$((CURRENT_CODE + 1))

sed -i.bak "s/versionName \".*\"/versionName \"${NEW_VERSION}\"/" "$BUILD_GRADLE"
sed -i.bak "s/versionCode [0-9]\+/versionCode ${NEW_CODE}/" "$BUILD_GRADLE"
rm -f "${BUILD_GRADLE}.bak"

[[ -f "$STRINGS_XML" ]] && {
  sed -i.bak "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">HUI v${NEW_VERSION}</string>|" "$STRINGS_XML"
  rm -f "${STRINGS_XML}.bak"
}

echo "✅ postversion sync: $NEW_VERSION (Code $NEW_CODE)"

git add "$BUILD_GRADLE" "$PACKAGE_JSON" "$STRINGS_XML" 2>/dev/null || true

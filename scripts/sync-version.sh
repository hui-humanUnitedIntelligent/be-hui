#!/usr/bin/env bash
# =============================================================================
# scripts/sync-version.sh — postversion Hook (wird von npm version aufgerufen)
# =============================================================================
# npm hat package.json bereits aktualisiert.
# Dieses Script synct build.gradle + strings.xml.
# Windows-kompatibel: NUR relative Pfade, KEINE absoluten Pfade an Node.
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUILD_GRADLE="android/app/build.gradle"
STRINGS_XML="android/app/src/main/res/values/strings.xml"

# Version lesen — relativer Pfad, KEIN pwd -W
NEW_VERSION=$(node -p "require('./package.json').version")

# Validierung
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

git add "$BUILD_GRADLE" "package.json" "$STRINGS_XML" 2>/dev/null || true

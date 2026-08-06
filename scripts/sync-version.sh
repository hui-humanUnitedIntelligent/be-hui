#!/usr/bin/env bash
# =============================================================================
# scripts/sync-version.sh — Post-version Hook für npm version
# =============================================================================
# Wird automatisch nach `npm version patch|minor|major` aufgerufen.
# npm hat bereits package.json aktualisiert — dieses Script synct:
#   - build.gradle (versionName aus package.json, versionCode inkrementiert)
#   - strings.xml (App-Name mit neuer Version)
#   - version.ts braucht NICHT aktualisiert zu werden (liest dynamisch)
#
# NIEMALS "minor", "patch" oder "major" als Versionstext schreiben.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BUILD_GRADLE="${ROOT_DIR}/android/app/build.gradle"
PACKAGE_JSON="${ROOT_DIR}/package.json"
STRINGS_XML="${ROOT_DIR}/android/app/src/main/res/values/strings.xml"

# ── Version aus package.json lesen (SSOT — npm hat sie gerade gesetzt) ────────
NEW_VERSION=$(node -p "require('$PACKAGE_JSON').version")

# Validate: muss X.Y.Z Format haben, kein "minor"/"patch"/"major" Text
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Ungültige Version in package.json: '$NEW_VERSION'"
  echo "   Erwartet: X.Y.Z (z.B. 1.0.2)"
  exit 1
fi

# ── versionCode aus build.gradle lesen und inkrementieren ────────────────────
CURRENT_CODE=$(grep -oP 'versionCode\s+\K[0-9]+' "$BUILD_GRADLE" || echo "1")
NEW_CODE=$((CURRENT_CODE + 1))

# ── build.gradle aktualisieren ───────────────────────────────────────────────
sed -i.bak "s/versionName \".*\"/versionName \"${NEW_VERSION}\"/" "$BUILD_GRADLE"
sed -i.bak "s/versionCode [0-9]\+/versionCode ${NEW_CODE}/" "$BUILD_GRADLE"
rm -f "${BUILD_GRADLE}.bak"

# ── strings.xml aktualisieren ────────────────────────────────────────────────
if [[ -f "$STRINGS_XML" ]]; then
  sed -i.bak "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">HUI v${NEW_VERSION}</string>|" "$STRINGS_XML"
  rm -f "${STRINGS_XML}.bak"
fi

echo "✅ Version sync abgeschlossen:"
echo "  package.json  → $NEW_VERSION"
echo "  build.gradle  → $NEW_VERSION (Code $NEW_CODE)"
echo "  strings.xml   → HUI v$NEW_VERSION"
echo "  version.ts    → dynamisch (kein Schreiben nötig)"

# ── Git: Änderungen stagen für den Commit ────────────────────────────────────
git add "$BUILD_GRADLE" "$PACKAGE_JSON" "$STRINGS_XML" 2>/dev/null || true

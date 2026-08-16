#!/usr/bin/env bash
# =============================================================================
# scripts/version.sh — HUI Version Management (SSOT: package.json)
# =============================================================================
# Usage:
#   bash scripts/version.sh                → Sync build.gradle + strings.xml
#   bash scripts/version.sh patch           → 1.0.1 → 1.0.2
#   bash scripts/version.sh minor           → 1.0.1 → 1.1.0
#   bash scripts/version.sh major           → 1.0.1 → 2.0.0
#   bash scripts/version.sh 1.0.5           → Manuelle Version
#   bash scripts/version.sh 1.0.5 7         → Manuelle Version + versionCode
#
# Windows-kompatibel: NUR relative Pfade, KEINE require() für JSON.
# Node v24-kompatibel: fs.readFileSync + JSON.parse statt require().
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$ROOT_DIR"

BUILD_GRADLE="android/app/build.gradle"
STRINGS_XML="android/app/src/main/res/values/strings.xml"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[VERSION]${NC} $*"; }
success() { echo -e "${GREEN}[VERSION]${NC} ✅ $*"; }
error()   { echo -e "${RED}[VERSION]${NC} ❌ $*"; exit 1; }

[[ -f "$BUILD_GRADLE" ]] || error "build.gradle nicht gefunden"
[[ -f "package.json" ]] || error "package.json nicht gefunden"

# ── Hilfsfunktionen ──────────────────────────────────────────────────────────
# Node v24-kompatibel: KEIN require() für JSON — fs.readFileSync + JSON.parse
get_version() {
  node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version"
}
get_code() {
  grep -oP 'versionCode\s+\K[0-9]+' "$BUILD_GRADLE" || echo "1"
}

validate_version() {
  local v="$1"
  [[ "$v" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || error "Ungültige Version: '$v' (erwartet X.Y.Z)"
}

bump_version() {
  local mode="$1" v="$2"
  local major minor patch
  IFS='.' read -r major minor patch <<< "$v"
  validate_version "$v"

  case "$mode" in
    patch)  patch=$((patch + 1)) ;;
    minor)  minor=$((minor + 1)); patch=0 ;;
    major)  major=$((major + 1)); minor=0; patch=0 ;;
    *)      error "Unbekannter Modus: $mode" ;;
  esac
  NEW_VERSION="${major}.${minor}.${patch}"
}

write_package_json() {
  npm version "$1" --no-git-tag-version --silent 2>/dev/null || {
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"$1\"/" package.json; rm -f package.json.bak
  }
}

write_build_gradle() {
  sed -i.bak "s/versionName \".*\"/versionName \"$1\"/" "$BUILD_GRADLE"
  sed -i.bak "s/versionCode [0-9]\+/versionCode $2/" "$BUILD_GRADLE"
  rm -f "${BUILD_GRADLE}.bak"
}

write_strings_xml() {
  [[ -f "$STRINGS_XML" ]] || return 0
  sed -i.bak "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">HUI v$1</string>|" "$STRINGS_XML"
  rm -f "${STRINGS_XML}.bak"
}

# ── Hauptlogik ───────────────────────────────────────────────────────────────
CURRENT_VERSION=$(get_version)
CURRENT_CODE=$(get_code)
validate_version "$CURRENT_VERSION"

info "Aktuell: $CURRENT_VERSION (Code $CURRENT_CODE)"

MODE="${1:-sync}"

case "$MODE" in
  sync)
    NEW_VERSION="$CURRENT_VERSION"; NEW_CODE="$CURRENT_CODE" ;;
  patch|minor|major)
    info "Bump: $MODE"
    bump_version "$MODE" "$CURRENT_VERSION"
    NEW_CODE=$((CURRENT_CODE + 1))
    info "Neu: $NEW_VERSION (Code $NEW_CODE)" ;;
  *)
    validate_version "$MODE"
    NEW_VERSION="$MODE"
    NEW_CODE="${2:-$((CURRENT_CODE + 1))}"
    info "Manuell: $NEW_VERSION (Code $NEW_CODE)" ;;
esac

write_package_json "$NEW_VERSION"
write_build_gradle "$NEW_VERSION" "$NEW_CODE"
write_strings_xml "$NEW_VERSION"

success "Sync: pkg=$NEW_VERSION gradle=$NEW_VERSION/$NEW_CODE strings=HUI v$NEW_VERSION"

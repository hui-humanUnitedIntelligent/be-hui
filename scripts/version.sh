#!/usr/bin/env bash
# =============================================================================
# scripts/version.sh — HUI Version Management
# =============================================================================
# SSOT: package.json ist die einzige Quelle für die Version.
# Dieses Script liest aus package.json und synct build.gradle + strings.xml.
#
# Usage:
#   ./scripts/version.sh                  → Sync build.gradle + strings.xml aus package.json
#   ./scripts/version.sh patch            → patch bump (1.0.1 → 1.0.2)
#   ./scripts/version.sh minor            → minor bump (1.0.1 → 1.1.0)
#   ./scripts/version.sh major            → major bump (1.0.1 → 2.0.0)
#   ./scripts/version.sh 1.0.5            → Manuelle Version setzen
#   ./scripts/version.sh 1.0.5 7          → Manuelle Version + versionCode
#
# version.ts liest die Version dynamisch aus package.json zur Build-Zeit.
# Dieses Script schreibt NICHT in version.ts.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BUILD_GRADLE="${ROOT_DIR}/android/app/build.gradle"
PACKAGE_JSON="${ROOT_DIR}/package.json"
STRINGS_XML="${ROOT_DIR}/android/app/src/main/res/values/strings.xml"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[VERSION]${NC} $*"; }
success() { echo -e "${GREEN}[VERSION]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[VERSION]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[VERSION]${NC} ❌ $*"; exit 1; }

[[ -f "$BUILD_GRADLE" ]] || error "build.gradle nicht gefunden"
[[ -f "$PACKAGE_JSON" ]] || error "package.json nicht gefunden"

# ── Aktuelle Version aus package.json lesen (SSOT) ───────────────────────────
read_current_version() {
  node -p "require('$PACKAGE_JSON').version"
}

# ── Aktuellen versionCode aus build.gradle lesen ─────────────────────────────
read_current_code() {
  grep -oP 'versionCode\s+\K[0-9]+' "$BUILD_GRADLE" || echo "1"
}

# ── Version bump Logic ───────────────────────────────────────────────────────
bump_version() {
  local mode="$1"
  local v="$2"
  local major minor patch

  IFS='.' read -r major minor patch <<< "$v"

  # Validate: alle drei Teile müssen Zahlen sein
  [[ "$major" =~ ^[0-9]+$ ]] || error "Ungültige Version: $v"
  [[ "$minor" =~ ^[0-9]+$ ]] || error "Ungültige Version: $v"
  [[ "$patch" =~ ^[0-9]+$ ]] || error "Ungültige Version: $v"

  case "$mode" in
    patch)
      patch=$((patch + 1))
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    *)
      error "Unbekannter bump-Modus: $mode (erwartet: patch|minor|major)"
      ;;
  esac

  NEW_VERSION="${major}.${minor}.${patch}"
}

# ── package.json aktualisieren ───────────────────────────────────────────────
write_package_json() {
  local ver="$1"
  npm version "$ver" --no-git-tag-version --silent 2>/dev/null || {
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"$ver\"/" "$PACKAGE_JSON"
    rm -f "${PACKAGE_JSON}.bak"
  }
}

# ── build.gradle aktualisieren ───────────────────────────────────────────────
write_build_gradle() {
  local ver="$1"
  local code="$2"
  sed -i.bak "s/versionName \".*\"/versionName \"${ver}\"/" "$BUILD_GRADLE"
  sed -i.bak "s/versionCode [0-9]\+/versionCode ${code}/" "$BUILD_GRADLE"
  rm -f "${BUILD_GRADLE}.bak"
}

# ── strings.xml aktualisieren (App-Name) ─────────────────────────────────────
write_strings_xml() {
  local ver="$1"
  [[ -f "$STRINGS_XML" ]] || return 0
  local appname="HUI v${ver}"
  sed -i.bak "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">${appname}</string>|" "$STRINGS_XML"
  rm -f "${STRINGS_XML}.bak"
}

# ── Parameter auswerten ──────────────────────────────────────────────────────
CURRENT_VERSION=$(read_current_version)
CURRENT_CODE=$(read_current_code)

info "Aktuelle Version: $CURRENT_VERSION (Code $CURRENT_CODE)"

MODE="${1:-sync}"

case "$MODE" in
  sync)
    NEW_VERSION="$CURRENT_VERSION"
    NEW_CODE="$CURRENT_CODE"
    ;;
  patch|minor|major)
    info "Bump: $MODE"
    bump_version "$MODE" "$CURRENT_VERSION"
    NEW_CODE=$((CURRENT_CODE + 1))
    info "Neue Version: $NEW_VERSION (Code $NEW_CODE)"
    ;;
  *)
    if [[ "$MODE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      NEW_VERSION="$MODE"
      if [[ -n "${2:-}" && "$2" =~ ^[0-9]+$ ]]; then
        NEW_CODE="$2"
      else
        NEW_CODE=$((CURRENT_CODE + 1))
      fi
      info "Manuelle Version: $NEW_VERSION (Code $NEW_CODE)"
    else
      error "Unbekannter Parameter: $MODE
Usage: $0 [sync|patch|minor|major|<version>] [versionCode]"
    fi
    ;;
esac

# ── Schreiben ────────────────────────────────────────────────────────────────
write_package_json "$NEW_VERSION"
write_build_gradle "$NEW_VERSION" "$NEW_CODE"
write_strings_xml "$NEW_VERSION"

success "Sync abgeschlossen:"
echo "  package.json  → $NEW_VERSION"
echo "  build.gradle  → $NEW_VERSION (Code $NEW_CODE)"
echo "  strings.xml   → HUI v$NEW_VERSION"
echo "  version.ts    → dynamisch aus package.json (kein Schreiben nötig)"

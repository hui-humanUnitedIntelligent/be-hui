#!/usr/bin/env bash
# =============================================================================
# scripts/version.sh — HUI Version Management (SSOT: package.json)
# =============================================================================
# Usage:
#   bash scripts/version.sh                → Sync build.gradle + strings.xml + src/version.ts
#   bash scripts/version.sh patch           → 1.0.1 → 1.0.2
#   bash scripts/version.sh minor           → 1.0.1 → 1.1.0
#   bash scripts/version.sh major           → 1.0.1 → 2.0.0
#   bash scripts/version.sh 1.0.5           → Manuelle Version
#   bash scripts/version.sh 1.0.5 7         → Manuelle Version + versionCode
#
# Windows-kompatibel: NUR relative Pfade, KEINE require() für JSON.
# Node v24-kompatibel: fs.readFileSync + JSON.parse statt require().
#
# FIX (2026-08-16, OTA-INFINITE-UPDATE-LOOP): src/version.ts wurde von diesem
# Skript NIE mitgeschrieben -> die dort hardcodierte APP_VERSION-Konstante
# (die tatsächlich ins JS-Bundle kompiliert wird und die OTA-Vergleichslogik
# in otaUpdate.js speist) blieb für immer bei einem alten, sogar fehlerhaften
# Wert ("v2.1.230" mit "v"-Präfix) stehen. Ergebnis: Die App verglich bei
# jedem Start die Server-Version gegen diesen eingefrorenen Wert und dachte
# IMMER, ein neues Update sei verfügbar -> Endlos-Update-Schleife, obwohl
# package.json/build.gradle längst weiter waren. Ab jetzt schreibt
# write_version_ts() bei JEDEM Lauf (auch "sync") den aktuellen SSOT-Wert
# OHNE "v"-Präfix in src/version.ts.
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$ROOT_DIR"

BUILD_GRADLE="android/app/build.gradle"
STRINGS_XML="android/app/src/main/res/values/strings.xml"
VERSION_TS="src/version.ts"

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

# FIX (2026-08-16): NEU — synchronisiert src/version.ts, die tatsächlich ins
# JS-Bundle kompilierte APP_VERSION-Konstante. OHNE "v"-Präfix (kritisch für
# compareVersions() in otaUpdate.js, siehe Kommentar oben).
write_version_ts() {
  [[ -f "$VERSION_TS" ]] || return 0
  cat > "$VERSION_TS" <<EOF
// Auto-generiert von scripts/version.sh — NICHT manuell editieren.
// SSOT ist package.json. Bei jedem version.sh-Lauf (sync/patch/minor/major)
// wird dieser Wert automatisch mit package.json synchron gehalten.
// KEIN "v"-Präfix — compareVersions() in otaUpdate.js braucht rein numerische
// Segmente (siehe OTA-INFINITE-UPDATE-LOOP Fix, 2026-08-16).
export const APP_VERSION = "$1";
EOF
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
write_version_ts "$NEW_VERSION"

success "Sync: pkg=$NEW_VERSION gradle=$NEW_VERSION/$NEW_CODE strings=HUI v$NEW_VERSION version.ts=$NEW_VERSION"

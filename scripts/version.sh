#!/usr/bin/env bash
# =============================================================================
# scripts/version.sh — HUI Version Management + Auto-Increment
# =============================================================================
# Usage:
#   ./scripts/version.sh                 → Sync build.gradle → package.json
#   ./scripts/version.sh bump            → Auto-increment patch (1.0.1 → 1.0.2)
#   ./scripts/version.sh bump-minor      → Auto-increment minor (1.0.1 → 1.1.0)
#   ./scripts/version.sh bump-major      → Auto-increment major (1.0.1 → 2.0.0)
#   ./scripts/version.sh 1.0.5 6         → Manual set (version + code)
#
# WICHTIG: version.ts wird NICHT mehr von diesem Script geschrieben.
# version.ts liest die Version dynamisch aus package.json zur Build-Zeit.
# Dieses Script aktualisiert nur noch build.gradle + package.json.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BUILD_GRADLE="${ROOT_DIR}/android/app/build.gradle"
PACKAGE_JSON="${ROOT_DIR}/package.json"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[VERSION]${NC} $*"; }
success() { echo -e "${GREEN}[VERSION]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[VERSION]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[VERSION]${NC} ❌ $*"; exit 1; }

[[ -f "$BUILD_GRADLE" ]] || error "build.gradle nicht gefunden"
[[ -f "$PACKAGE_JSON" ]] || error "package.json nicht gefunden"

# ── Aktuelle Werte lesen ─────────────────────────────────────────────────────
VERSION_NAME=$(grep -oP 'versionName\s*"\K[^"]+' "$BUILD_GRADLE")
VERSION_CODE=$(grep -oP 'versionCode\s*\K[0-9]+' "$BUILD_GRADLE")
[[ -n "$VERSION_CODE" ]] || VERSION_CODE=1

# ── Auto-Increment Logik ─────────────────────────────────────────────────────
increment_version() {
  local mode="$1" v="$VERSION_NAME"
  local major=$(echo "$v" | cut -d'.' -f1)
  local minor=$(echo "$v" | cut -d'.' -f2)
  local patch=$(echo "$v" | cut -d'.' -f3)
  case "$mode" in
    bump)      patch=$((patch + 1)) ;;
    bump-minor) major=$((major + 1)); minor=0; patch=0 ;;
    bump-major) major=$((major + 1)); minor=0; patch=0 ;;
    *) error "Unbekannter bump-Modus: $mode" ;;
  esac
  VERSION_NAME="${major}.${minor}.${patch}"
  VERSION_CODE=$((VERSION_CODE + 1))
}

# ── Parameter auswerten ───────────────────────────────────────────────────────
MODE="${1:-}"
if [[ "$MODE" =~ ^bump|bump-minor|bump-major$ ]]; then
  info "Auto-Increment ($MODE)…"
  increment_version "$MODE"
  success "Neue Version: $VERSION_NAME (Code $VERSION_CODE)"
elif [[ -n "$MODE" ]]; then
  VERSION_NAME="$MODE"
  [[ -n "${2:-}" ]] && VERSION_CODE="$2"
fi

# ── build.gradle aktualisieren ───────────────────────────────────────────────
sed -i.bak "s/versionName \".*\"/versionName \"${VERSION_NAME}\"/" "$BUILD_GRADLE"
sed -i.bak "s/versionCode [0-9]\+/versionCode ${VERSION_CODE}/" "$BUILD_GRADLE"
rm -f "${BUILD_GRADLE}.bak"
success "build.gradle: versionName=${VERSION_NAME}, versionCode=${VERSION_CODE}"

# ── package.json synchronisieren ─────────────────────────────────────────────
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION_NAME\"/" "$PACKAGE_JSON"
rm -f "${PACKAGE_JSON}.bak"
success "package.json: version=\"${VERSION_NAME}\""

# ── version.ts wird NICHT mehr geschrieben — liest dynamisch aus package.json

# ── Build + Sync ─────────────────────────────────────────────────────────────
info "Starte Web-Build…"
npm run build --silent || warn "Web-Build fehlgeschlagen"
info "Starte Capacitor Sync…"
npx cap sync android || warn "Capacitor Sync fehlgeschlagen"

echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN} Version Sync abgeschlossen${NC}"
echo -e "  package.json       → ${YELLOW}${VERSION_NAME}${NC}"
echo -e "  build.gradle       → ${YELLOW}${VERSION_NAME} (Code ${VERSION_CODE})${NC}"
echo -e "  version.ts         → ${YELLOW}dynamisch aus package.json${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"

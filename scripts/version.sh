#!/usr/bin/env bash
# =============================================================================
# scripts/version.sh — HUI Version Management + Auto-Increment
# =============================================================================
# Usage:
#   ./scripts/version.sh                 → Sync only
#   ./scripts/version.sh bump            → Auto-increment patch (hui.1.02 → hui.1.03)
#   ./scripts/version.sh bump-minor      → Auto-increment minor (hui.1.02 → hui.1.10)
#   ./scripts/version.sh bump-major      → Auto-increment major (hui.1.02 → hui.2.0)
#   ./scripts/version.sh hui.1.03 4      → Manual set
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BUILD_GRADLE="${ROOT_DIR}/android/app/build.gradle"
VERSION_TS="${ROOT_DIR}/src/version.ts"
PACKAGE_JSON="${ROOT_DIR}/package.json"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[VERSION]${NC} $*"; }
success() { echo -e "${GREEN}[VERSION]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[VERSION]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[VERSION]${NC} ❌ $*"; exit 1; }

[[ -f "$BUILD_GRADLE" ]] || error "build.gradle nicht gefunden"
[[ -d "${ROOT_DIR}/src" ]] || error "src/ nicht gefunden"

# ── Aktuelle Werte lesen ─────────────────────────────────────────────────────
VERSION_NAME=$(grep 'versionName' "$BUILD_GRADLE" | sed 's/.*"\(.*\)".*/\1/')
VERSION_CODE=$(grep 'versionCode' "$BUILD_GRADLE" | sed 's/.*versionCode[[:space:]]*\([0-9]*\).*/\1/')

[[ -n "$VERSION_CODE" ]] || VERSION_CODE=1

# ── Auto-Increment Logik ─────────────────────────────────────────────────────
increment_version() {
  local mode="$1"
  local v="$VERSION_NAME"

  # Format: hui.X.YY
  local prefix="${v%%.*}"       # hui
  local major=$(echo "$v" | cut -d'.' -f2)
  local minor=$(echo "$v" | cut -d'.' -f3)

  case "$mode" in
    bump)
      minor=$((minor + 1))
      ;;
    bump-minor)
      major=$((major + 1))
      minor=0
      ;;
    bump-major)
      major=$((major + 1))
      minor=0
      ;;
    *)
      error "Unbekannter bump-Modus: $mode"
      ;;
  esac

  VERSION_NAME="${prefix}.${major}.${minor}"
  VERSION_CODE=$((VERSION_CODE + 1))
}

# ── Parameter auswerten ───────────────────────────────────────────────────────
MODE="${1:-}"

if [[ "$MODE" =~ ^bump|bump-minor|bump-major$ ]]; then
  info "Auto-Increment ($MODE)…"
  increment_version "$MODE"
  success "Neue Version: $VERSION_NAME (Code $VERSION_CODE)"

elif [[ -n "$MODE" ]]; then
  NEW_VERSION="$MODE"
  NEW_CODE="${2:-}"

  info "Setze versionName = \"$NEW_VERSION\""
  sed -i.bak "s/versionName \".*\"/versionName \"$NEW_VERSION\"/" "$BUILD_GRADLE"
  rm -f "${BUILD_GRADLE}.bak"

  if [[ -n "$NEW_CODE" ]]; then
    info "Setze versionCode = $NEW_CODE"
    sed -i.bak "s/versionCode .*/versionCode $NEW_CODE/" "$BUILD_GRADLE"
    rm -f "${BUILD_GRADLE}.bak"
  fi

  VERSION_NAME="$NEW_VERSION"
  VERSION_CODE="$NEW_CODE"
fi

# ── build.gradle aktualisieren ───────────────────────────────────────────────
sed -i.bak "s/versionName \".*\"/versionName \"${VERSION_NAME}\"/" "$BUILD_GRADLE"
sed -i.bak "s/versionCode [0-9]\+/versionCode ${VERSION_CODE}/" "$BUILD_GRADLE"
rm -f "${BUILD_GRADLE}.bak"

# ── version.ts schreiben ─────────────────────────────────────────────────────
cat > "$VERSION_TS" << TSEOF
export const APP_VERSION = "${VERSION_NAME}";
export const APP_VERSION_CODE = ${VERSION_CODE};

export default APP_VERSION;
TSEOF

success "src/version.ts aktualisiert"

# ── package.json synchronisieren ─────────────────────────────────────────────
SEMVER=$(echo "$VERSION_NAME" | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?')
if [[ -n "$SEMVER" ]]; then
  sed -i.bak "s/\"version\": \".*\"/\"version\": \"$SEMVER\"/" "$PACKAGE_JSON"
  rm -f "${PACKAGE_JSON}.bak"
  success "package.json version = \"$SEMVER\""
fi

# ── Build + Sync ─────────────────────────────────────────────────────────────
info "Starte Web-Build…"
npm run build --silent || warn "Web-Build fehlgeschlagen"

info "Starte Capacitor Sync…"
npx cap sync android || warn "Capacitor Sync fehlgeschlagen"

echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN} Version Sync abgeschlossen${NC}"
echo -e "  APP_VERSION       → ${YELLOW}${VERSION_NAME}${NC}"
echo -e "  APP_VERSION_CODE  → ${YELLOW}${VERSION_CODE}${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"

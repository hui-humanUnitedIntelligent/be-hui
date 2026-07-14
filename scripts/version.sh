#!/usr/bin/env bash
# =============================================================================
# scripts/version.sh — HUI Version Management
# =============================================================================
# Usage:
#   ./scripts/version.sh                    → Sync: build.gradle → version.ts
#   ./scripts/version.sh hui.1.02           → Setzt neue versionName
#   ./scripts/version.sh hui.1.02 2         → Setzt versionName + versionCode
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BUILD_GRADLE="${ROOT_DIR}/android/app/build.gradle"
VERSION_TS="${ROOT_DIR}/src/version.ts"
PACKAGE_JSON="${ROOT_DIR}/package.json"

# ── Farben ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[VERSION]${NC} $*"; }
success() { echo -e "${GREEN}[VERSION]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[VERSION]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[VERSION]${NC} ❌ $*"; exit 1; }

# ── Guards ────────────────────────────────────────────────────────────────────
[[ -f "$BUILD_GRADLE" ]] || error "build.gradle nicht gefunden: $BUILD_GRADLE"
[[ -d "${ROOT_DIR}/src" ]] || error "src/ nicht gefunden: ${ROOT_DIR}/src"

# ── Neue Version setzen (wenn Parameter übergeben) ────────────────────────────
NEW_VERSION="${1:-}"
NEW_CODE="${2:-}"

if [[ -n "$NEW_VERSION" ]]; then
  [[ "$NEW_VERSION" =~ ^[a-zA-Z0-9._-]+$ ]] || \
    error "Ungültiger versionName '$NEW_VERSION' — nur Buchstaben, Ziffern, Punkte, Bindestriche"

  info "Setze versionName = \"${NEW_VERSION}\" in build.gradle …"
  sed -i.bak "s/versionName \"[^\"]*\"/versionName \"${NEW_VERSION}\"/" "$BUILD_GRADLE"
  rm -f "${BUILD_GRADLE}.bak"
  success "versionName aktualisiert"

  if [[ -n "$NEW_CODE" ]]; then
    [[ "$NEW_CODE" =~ ^[0-9]+$ ]] || error "versionCode muss Ganzzahl sein: '$NEW_CODE'"
    info "Setze versionCode = ${NEW_CODE} in build.gradle …"
    sed -i.bak "s/versionCode [0-9]*/versionCode ${NEW_CODE}/" "$BUILD_GRADLE"
    rm -f "${BUILD_GRADLE}.bak"
    success "versionCode aktualisiert"
  fi
fi

# ── Aktuelle Werte aus build.gradle lesen ─────────────────────────────────────
VERSION_NAME=$(grep 'versionName' "$BUILD_GRADLE" \
  | sed 's/.*versionName[[:space:]]*"\(.*\)".*/\1/' \
  | tr -d '[:space:]')

VERSION_CODE=$(grep 'versionCode' "$BUILD_GRADLE" \
  | grep -v 'buildToolsVersion' \
  | sed 's/.*versionCode[[:space:]]*\([0-9]*\).*/\1/' \
  | tr -d '[:space:]' \
  | head -1)

[[ -n "$VERSION_NAME" ]] || error "versionName konnte nicht gelesen werden"
[[ -n "$VERSION_CODE" ]] || VERSION_CODE="1"

info "Version: versionName=\"${VERSION_NAME}\" | versionCode=${VERSION_CODE}"

# ── src/version.ts neu schreiben (IMMER) ─────────────────────────────────────
info "Schreibe ${VERSION_TS} …"

cat > "$VERSION_TS" << TSEOF
export const APP_VERSION = "${VERSION_NAME}";
export const APP_VERSION_CODE = ${VERSION_CODE};

export default APP_VERSION;
TSEOF

success "src/version.ts geschrieben (APP_VERSION = \"${VERSION_NAME}\")"

# ── package.json "version" synchronisieren ────────────────────────────────────
if [[ -f "$PACKAGE_JSON" ]]; then
  SEMVER=$(echo "$VERSION_NAME" | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || true)
  if [[ -n "$SEMVER" ]]; then
    info "Synchronisiere package.json version → \"${SEMVER}\" …"
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"${SEMVER}\"/" "$PACKAGE_JSON"
    rm -f "${PACKAGE_JSON}.bak"
    success "package.json version = \"${SEMVER}\""
  else
    warn "package.json nicht aktualisiert — keine semver-Zahl in '${VERSION_NAME}'"
  fi
fi

# ── Capacitor Sync ────────────────────────────────────────────────────────────
CAP_BIN=""
if [[ -x "${ROOT_DIR}/node_modules/.bin/cap" ]]; then
  CAP_BIN="${ROOT_DIR}/node_modules/.bin/cap"
elif command -v cap &>/dev/null; then
  CAP_BIN="cap"
fi

if [[ -n "$CAP_BIN" ]]; then
  info "Starte Capacitor Sync …"
  cd "$ROOT_DIR" && npm run build --silent 2>/dev/null || true
  $CAP_BIN sync android 2>&1 | tail -5
  success "Capacitor Sync abgeschlossen"
else
  info "Capacitor CLI nicht lokal gefunden — versuche npx …"
  cd "$ROOT_DIR"
  npm run build --silent 2>/dev/null || true
  npx cap sync android 2>&1 | tail -5 || warn "Capacitor Sync fehlgeschlagen — manuell ausführen: npx cap sync"
fi

# ── Zusammenfassung ───────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN} HUI Version Sync abgeschlossen ✅${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "  APP_VERSION       → ${YELLOW}${VERSION_NAME}${NC}"
echo -e "  APP_VERSION_CODE  → ${YELLOW}${VERSION_CODE}${NC}"
echo -e "  src/version.ts    → ✅ aktualisiert"
echo -e "${GREEN}══════════════════════════════════════════${NC}"

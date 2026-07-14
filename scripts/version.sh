#!/usr/bin/env bash
# =============================================================================
# scripts/version.sh — HUI Version Management
# =============================================================================
# Usage:
#   ./scripts/version.sh                    → nur sync (build.gradle → version.ts)
#   ./scripts/version.sh hui.1.02           → setzt neue versionName
#   ./scripts/version.sh hui.1.02 2         → setzt versionName + versionCode
#
# Was das Script tut:
#   1. Liest/setzt versionName (+ optional versionCode) in build.gradle
#   2. Schreibt src/version.ts mit APP_VERSION + APP_VERSION_CODE
#   3. Aktualisiert package.json "version" (optional, für npm-Tooling)
#   4. Führt npx cap sync aus (Capacitor Sync)
# =============================================================================

set -euo pipefail

# ── Pfade ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BUILD_GRADLE="${ROOT_DIR}/android/app/build.gradle"
VERSION_TS="${ROOT_DIR}/src/version.ts"
PACKAGE_JSON="${ROOT_DIR}/package.json"

# ── Farben ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[VERSION]${NC} $*"; }
success() { echo -e "${GREEN}[VERSION]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[VERSION]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[VERSION]${NC} ❌ $*"; exit 1; }

# ── Guards ───────────────────────────────────────────────────────────────────
[[ -f "$BUILD_GRADLE" ]] || error "build.gradle nicht gefunden: $BUILD_GRADLE"
[[ -d "${ROOT_DIR}/src" ]] || error "src/ Verzeichnis nicht gefunden: ${ROOT_DIR}/src"

# ── Neue Version gesetzt? ────────────────────────────────────────────────────
NEW_VERSION="${1:-}"
NEW_CODE="${2:-}"

if [[ -n "$NEW_VERSION" ]]; then
  # Validierung: Version darf nicht leer sein
  [[ "$NEW_VERSION" =~ ^[a-zA-Z0-9._-]+$ ]] || \
    error "Ungültiger versionName: '$NEW_VERSION' — nur Buchstaben, Ziffern, Punkte, Bindestriche erlaubt"

  info "Setze versionName = \"${NEW_VERSION}\" in build.gradle..."
  # sed in-place: versionName "x.y" → versionName "new"
  sed -i.bak "s/versionName \"[^\"]*\"/versionName \"${NEW_VERSION}\"/" "$BUILD_GRADLE"
  rm -f "${BUILD_GRADLE}.bak"
  success "versionName aktualisiert"

  # Optional: versionCode setzen
  if [[ -n "$NEW_CODE" ]]; then
    [[ "$NEW_CODE" =~ ^[0-9]+$ ]] || error "versionCode muss eine Ganzzahl sein: '$NEW_CODE'"
    info "Setze versionCode = ${NEW_CODE} in build.gradle..."
    sed -i.bak "s/versionCode [0-9]*/versionCode ${NEW_CODE}/" "$BUILD_GRADLE"
    rm -f "${BUILD_GRADLE}.bak"
    success "versionCode aktualisiert"
  fi
fi

# ── Aktuelle Werte aus build.gradle lesen ────────────────────────────────────
VERSION_NAME=$(grep 'versionName' "$BUILD_GRADLE" \
  | sed 's/.*versionName[[:space:]]*"\(.*\)".*/\1/' \
  | tr -d '[:space:]')

VERSION_CODE=$(grep 'versionCode' "$BUILD_GRADLE" \
  | grep -v 'buildToolsVersion' \
  | sed 's/.*versionCode[[:space:]]*\([0-9]*\).*/\1/' \
  | tr -d '[:space:]' \
  | head -1)

[[ -n "$VERSION_NAME" ]] || error "versionName konnte aus build.gradle nicht gelesen werden"
[[ -n "$VERSION_CODE" ]] || VERSION_CODE="1"

info "Gelesene Version: versionName=\"${VERSION_NAME}\" | versionCode=${VERSION_CODE}"

# ── src/version.ts schreiben ─────────────────────────────────────────────────
info "Schreibe ${VERSION_TS}..."

cat > "$VERSION_TS" << TSEOF
/**
 * APP_VERSION — automatisch generiert von scripts/version.sh
 * Quelle: android/app/build.gradle → versionName / versionCode
 *
 * NICHT manuell bearbeiten — Änderungen werden beim nächsten
 * Aufruf von scripts/version.sh überschrieben.
 *
 * Generiert am: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
 */
export const APP_VERSION = "${VERSION_NAME}";
export const APP_VERSION_CODE = ${VERSION_CODE};

export default APP_VERSION;
TSEOF

success "src/version.ts geschrieben (APP_VERSION = \"${VERSION_NAME}\")"

# ── package.json "version" synchronisieren (optional) ────────────────────────
if [[ -f "$PACKAGE_JSON" ]]; then
  info "Synchronisiere package.json version..."
  # Nur den reinen semver-Teil verwenden (z.B. "hui.1.02" → "1.02.0" für npm)
  # Wenn version bereits semver-kompatibel ist, direkt übernehmen
  # Sicherheits-Fallback: rein numerisch extrahieren
  SEMVER_VERSION=$(echo "$VERSION_NAME" | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || true)
  if [[ -n "$SEMVER_VERSION" ]]; then
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"${SEMVER_VERSION}\"/" "$PACKAGE_JSON"
    rm -f "${PACKAGE_JSON}.bak"
    success "package.json version = \"${SEMVER_VERSION}\""
  else
    warn "package.json nicht aktualisiert — keine semver-kompatible Version in '${VERSION_NAME}' gefunden"
  fi
fi

# ── Capacitor Sync ───────────────────────────────────────────────────────────
# Capacitor CLI suchen: lokal in node_modules oder global via npx
CAP_BIN=""
if [[ -x "${ROOT_DIR}/node_modules/.bin/cap" ]]; then
  CAP_BIN="${ROOT_DIR}/node_modules/.bin/cap"
elif command -v cap &>/dev/null; then
  CAP_BIN="cap"
elif command -v npx &>/dev/null && npx --yes @capacitor/cli --version &>/dev/null 2>&1; then
  CAP_BIN="npx @capacitor/cli"
fi

if [[ -n "$CAP_BIN" ]]; then
  info "Starte Capacitor Sync ($CAP_BIN sync android)..."
  cd "$ROOT_DIR"
  $CAP_BIN sync android 2>&1 | tail -5
  success "Capacitor Sync abgeschlossen"
else
  warn "Capacitor CLI nicht gefunden — Sync übersprungen."
  warn "Installieren mit: npm install @capacitor/cli --save-dev"
  warn "Dann manuell ausführen: npx cap sync"
fi

# ── Zusammenfassung ───────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN} HUI Version Sync abgeschlossen ✅${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "  versionName  → ${YELLOW}${VERSION_NAME}${NC}"
echo -e "  versionCode  → ${YELLOW}${VERSION_CODE}${NC}"
echo -e "  src/version.ts aktualisiert ✅"
echo -e "${GREEN}════════════════════════════════════════════${NC}"

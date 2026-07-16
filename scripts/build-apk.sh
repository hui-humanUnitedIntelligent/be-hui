#!/usr/bin/env bash
# =============================================================================
# build-apk.sh — Automatischer APK-Build für HUI
# =============================================================================
# Usage:
#   ./scripts/build-apk.sh debug
#   ./scripts/build-apk.sh release
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ANDROID_DIR="${ROOT_DIR}/android"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[APK]${NC} $*"; }
success() { echo -e "${GREEN}[APK]${NC} ✅ $*"; }
error()   { echo -e "${RED}[APK]${NC} ❌ $*"; exit 1; }

BUILD_TYPE="${1:-debug}"

if [[ "$BUILD_TYPE" != "debug" && "$BUILD_TYPE" != "release" ]]; then
  error "Ungültiger Build-Typ. Verwende: debug oder release"
fi

info "Starte Web-Build …"
cd "$ROOT_DIR"
npm run build

info "Starte Capacitor Sync …"
npx cap sync android

info "Starte Gradle Build ($BUILD_TYPE) …"
cd "$ANDROID_DIR"

if [[ "$BUILD_TYPE" == "debug" ]]; then
  ./gradlew assembleDebug
  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
else
  ./gradlew assembleRelease
  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
fi

[[ -f "$APK_PATH" ]] || error "APK wurde nicht gefunden: $APK_PATH"

success "APK erfolgreich gebaut!"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN} Fertige APK: ${YELLOW}$APK_PATH${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"

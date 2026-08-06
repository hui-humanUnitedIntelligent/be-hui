#!/usr/bin/env bash
# =============================================================================
# scripts/auto-rename-apk.sh — APK umbenennen und ablegen
# =============================================================================
# Sucht die fertige APK (signed oder unsigned, debug oder release)
# und kopiert sie als HUI-v<version>.apk nach android/app/release/
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="${ROOT_DIR}/android"
VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[APK-RENAME]${NC} $*"; }
success() { echo -e "${GREEN}[APK-RENAME]${NC} ✅ $*"; }
error()   { echo -e "${RED}[APK-RENAME]${NC} ❌ $*"; exit 1; }

RELEASE_DIR="${ANDROID_DIR}/app/release"
mkdir -p "$RELEASE_DIR"

# Mögliche APK-Pfade (Reihenfolge: signed release, unsigned release, debug)
APK_CANDIDATES=(
  "${ANDROID_DIR}/app/build/outputs/apk/release/app-release.apk"
  "${ANDROID_DIR}/app/build/outputs/apk/release/app-release-unsigned.apk"
  "${ANDROID_DIR}/app/build/outputs/apk/debug/app-debug.apk"
)

SOURCE_APK=""
for candidate in "${APK_CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]]; then
    SOURCE_APK="$candidate"
    break
  fi
done

[[ -n "$SOURCE_APK" ]] || error "Keine APK gefunden. Gradle Build vorher ausführen."

DEST_APK="${RELEASE_DIR}/HUI-v${VERSION}.apk"
cp "$SOURCE_APK" "$DEST_APK"

success "APK kopiert:"
echo "  Quelle:  $SOURCE_APK"
echo "  Ziel:   $DEST_APK"
echo "  Größe:  $(du -h "$DEST_APK" | cut -f1)"

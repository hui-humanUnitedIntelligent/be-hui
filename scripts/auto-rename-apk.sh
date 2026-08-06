#!/usr/bin/env bash
# =============================================================================
# scripts/auto-rename-apk.sh — APK umbenennen (Windows-kompatibel)
# =============================================================================
# Sucht die fertige APK und kopiert sie als HUI-v<version>.apk
# Verwendet NUR relative Pfade — KEIN pwd -W, KEINE absoluten Pfade an Node.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[APK-RENAME]${NC} $*"; }
success() { echo -e "${GREEN}[APK-RENAME]${NC} ✅ $*"; }
error()   { echo -e "${RED}[APK-RENAME]${NC} ❌ $*"; exit 1; }

RELEASE_DIR="android/app/release"
mkdir -p "$RELEASE_DIR"

# APK finden (relative Pfade)
APK_CANDIDATES=(
  "android/app/build/outputs/apk/release/app-release.apk"
  "android/app/build/outputs/apk/release/app-release-unsigned.apk"
  "android/app/build/outputs/apk/debug/app-debug.apk"
)

SOURCE_APK=""
for candidate in "${APK_CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]]; then
    SOURCE_APK="$candidate"
    break
  fi
done
[[ -n "$SOURCE_APK" ]] || error "Keine APK gefunden. Gradle Build vorher ausführen."

# Version lesen — relativer Pfad, kein pwd -W
VERSION=$(node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version")
VERSION_CODE=$(grep -oP 'versionCode\s+\K[0-9]+' android/app/build.gradle)

DEST_APK="${RELEASE_DIR}/HUI-v${VERSION}-code${VERSION_CODE}.apk"
cp "$SOURCE_APK" "$DEST_APK"

success "APK kopiert:"
echo "  Quelle:  $SOURCE_APK"
echo "  Ziel:    $DEST_APK"
echo "  Größe:   $(du -h "$DEST_APK" | cut -f1)"

#!/usr/bin/env bash
# =============================================================================
# release.sh — HUI Ein-Klick-Release-System
# =============================================================================
#
# Usage:
#   bash release.sh              → Patch-Release (1.0.1 → 1.0.2)
#   bash release.sh patch         → Patch-Release
#   bash release.sh minor         → Minor-Release (1.0.1 → 1.1.0)
#   bash release.sh major         → Major-Release (1.0.1 → 2.0.0)
#
# Macht automatisch:
#   1. Version erhöhen (npm version patch/minor/major)
#   2. versionCode inkrementieren
#   3. build.gradle aktualisieren
#   4. strings.xml aktualisieren
#   5. version.ts (dynamisch — liest aus package.json)
#   6. Web-Build (npm run build)
#   7. Capacitor Sync (npx cap sync android)
#   8. Git commit + push
#   9. Gradle assembleRelease
#  10. APK umbenennen → android/app/release/HUI-v<version>.apk
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

# ── Farben ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'
info()    { echo -e "${BLUE}[RELEASE]${NC} $*"; }
success() { echo -e "${GREEN}[RELEASE]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[RELEASE]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[RELEASE]${NC} ❌ $*"; exit 1; }
step()    { echo -e "\n${CYAN}${BOLD}── Schritt $1: $2 ──${NC}"; }

# ── Pre-Flight Checks ─────────────────────────────────────────────────────────
MODE="${1:-patch}"

case "$MODE" in
  patch|minor|major) ;;
  *)
    echo "Usage: bash release.sh [patch|minor|major]"
    echo "  patch  → 1.0.1 → 1.0.2 (Standard)"
    echo "  minor  → 1.0.1 → 1.1.0"
    echo "  major  → 1.0.1 → 2.0.0"
    exit 1
    ;;
esac

cd "$ROOT_DIR"
[[ -f "package.json" ]] || error "Nicht im Projekt-Root (package.json fehlt)"
[[ -f "android/app/build.gradle" ]] || error "Android-Projekt nicht gefunden"
[[ -d ".git" ]] || error "Kein Git-Repository"

# Git muss clean sein
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  warn "Working Tree nicht clean. Uncommitted Änderungen werden inkludiert."
  read -r -p "Trotzdem fortfahren? (j/N) " resp
  [[ "$resp" =~ ^[jJ]$ ]] || exit 0
fi

echo -e "\n${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   HUI RELEASE SYSTEM  —  Mode: ${MODE}              ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"

# ── Aktuelle Version anzeigen ─────────────────────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version")
info "Aktuelle Version: $CURRENT_VERSION"

# ── 1. Version erhöhen ────────────────────────────────────────────────────────
step 1 "Version erhöhen ($MODE)"

# npm version macht: package.json updaten + postversion hook (sync-version.sh)
# --no-git-tag-version: keinen git tag erstellen (wir committen selbst)
npm version "$MODE" --no-git-tag-version --silent

# postversion Hook hat build.gradle + strings.xml bereits aktualisiert
NEW_VERSION=$(node -p "require('./package.json').version")

# Validierung: NIE "minor"/"patch"/"major" als Versionstext
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  error "Version ist ungültig: '$NEW_VERSION' — Abbruch"
fi

# versionCode prüfen
NEW_CODE=$(grep -oP 'versionCode\s+\K[0-9]+' android/app/build.gradle)
success "Version: $CURRENT_VERSION → $NEW_VERSION (Code $NEW_CODE)"

# ── 2. version.ts sicherstellen (dynamisch — nur APP_VERSION_CODE syncen) ─────
step 2 "version.ts prüfen"

# version.ts liest version dynamisch aus package.json.
# APP_VERSION_CODE wird synchronisiert, falls es hardcoded ist.
if grep -q "APP_VERSION_CODE" src/version.ts 2>/dev/null; then
  sed -i.bak "s/APP_VERSION_CODE: number = [0-9]*/APP_VERSION_CODE: number = ${NEW_CODE}/" src/version.ts
  rm -f src/version.ts.bak
  success "version.ts: APP_VERSION_CODE = $NEW_CODE"
else
  success "version.ts: dynamisch (kein Update nötig)"
fi

# ── 3. Web-Build ──────────────────────────────────────────────────────────────
step 3 "Web-Build"
npm run build || error "Web-Build fehlgeschlagen"
success "Web-Build fertig"

# ── 4. Capacitor Sync ─────────────────────────────────────────────────────────
step 4 "Capacitor Sync"
npx cap sync android || error "Capacitor Sync fehlgeschlagen"
success "Capacitor Sync fertig"

# ── 5. Git Commit + Push ──────────────────────────────────────────────────────
step 5 "Git Commit + Push"

git add package.json android/app/build.gradle android/app/src/main/res/values/strings.xml \
       src/version.ts www/ android/app/src/main/assets/ android/capacitor.settings.gradle \
       android/app/capacitor.build.gradle 2>/dev/null || true

# Alle www/ Änderungen stagen
git add www/ 2>/dev/null || true

COMMIT_MSG="release: v${NEW_VERSION} (${MODE} bump)"
git commit -m "$COMMIT_MSG" 2>/dev/null || {
  warn "Nichts zu committen (vielleicht bereits aktuell)"
}

git push origin main 2>/dev/null || error "Git Push fehlgeschlagen"
success "Git: committed + pushed ($COMMIT_MSG)"

# ── 6. Gradle Release Build ──────────────────────────────────────────────────
step 6 "Gradle assembleRelease"
cd "$ROOT_DIR/android"
./gradlew assembleRelease --no-daemon 2>&1 | tail -5 || {
  warn "Gradle Release Build fehlgeschlagen — versuche Debug"
  ./gradlew assembleDebug --no-daemon 2>&1 | tail -5 || error "Gradle Build komplett fehlgeschlagen"
}
cd "$ROOT_DIR"
success "Gradle Build fertig"

# ── 7. APK umbenennen ────────────────────────────────────────────────────────
step 7 "APK umbenennen"
bash "${SCRIPT_DIR}/scripts/auto-rename-apk.sh" || error "APK Rename fehlgeschlagen"

# ── Done ──────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   RELEASE v${NEW_VERSION} ERFOLGREICH ABGESCHLOSSEN   ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║  Version:    ${NEW_VERSION}                       ║${NC}"
echo -e "${GREEN}${BOLD}║  Code:       ${NEW_CODE}                            ║${NC}"
echo -e "${GREEN}${BOLD}║  APK:        android/app/release/HUI-v${NEW_VERSION}.apk   ║${NC}"
echo -e "${GREEN}${BOLD}║  Git:        pushed to origin/main              ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"

#!/usr/bin/env bash
# =============================================================================
# release.sh — HUI Ein-Klick-Release-System (Windows-kompatibel)
# =============================================================================
#
# Usage:
#   bash release.sh              → Patch-Release (1.0.1 → 1.0.2)
#   bash release.sh patch         → Patch-Release
#   bash release.sh minor         → Minor-Release (1.0.1 → 1.1.0)
#   bash release.sh major         → Major-Release (1.0.1 → 2.0.0)
#
# Windows/Git Bash: KEINE pwd -W, KEINE absoluten Pfade an Node.
# Alles läuft mit relativen Pfaden aus dem Projekt-Root.
# =============================================================================

set -euo pipefail

# ── Projekt-Root finden ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
cd "$ROOT_DIR"

# ── Farben ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'
info()    { echo -e "${BLUE}[RELEASE]${NC} $*"; }
success() { echo -e "${GREEN}[RELEASE]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[RELEASE]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[RELEASE]${NC} ❌ $*"; exit 1; }
step()    { echo -e "\n${CYAN}${BOLD}── Schritt $1: $2 ──${NC}"; }

# ── Argument parsen ──────────────────────────────────────────────────────────
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

# ── Pre-Flight Checks ────────────────────────────────────────────────────────
[[ -f "package.json" ]] || error "Nicht im Projekt-Root (package.json fehlt)"
[[ -f "android/app/build.gradle" ]] || error "Android-Projekt nicht gefunden"

# Native Plugin Check
for plugin in "@capacitor/app" "@capacitor/push-notifications" "@capgo/capacitor-updater"; do
  if [[ ! -f "node_modules/${plugin}/android/build.gradle" ]]; then
    error "Native Plugin ${plugin} fehlt — führe 'npm install' aus"
  fi
done

# ── KRITISCHER ENV-PREFLIGHT (2026-08-08) ────────────────────────────────────
# ROOT CAUSE eines echten Produktionsbugs: .env.local ist in .gitignore (nicht
# versioniert). Wenn eine APK auf einer Maschine/zu einem Zeitpunkt gebaut
# wurde, an dem .env.local fehlte oder den Platzhalter-Key enthielt, wird der
# fehlende Stripe-Key FEST in die APK eingebacken (Capacitor bündelt lokale
# Assets, es gibt KEINE Remote-URL — kein server.url in capacitor.config).
# Das Resultat: zwei baugleiche Handys mit unterschiedlichen APK-Builds zeigen
# unterschiedliches Verhalten, weil eine APK aeltere/fehlerhafte Bundle-Werte
# hat. Dieser Check bricht den Release-Prozess HART ab, bevor eine kaputte
# APK gebaut werden kann.
ENV_FILE=".env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  # Auto-Restore aus .env.example (Safety-Net, 2026-08-08)
  if [[ -f ".env.example" ]]; then
    cp .env.example .env.local
    warn ".env.local fehlte — automatisch aus .env.example wiederhergestellt"
  else
    error "$ENV_FILE fehlt und kein .env.example Template gefunden! Ohne diese Datei fehlen kritische Keys (Stripe/Supabase) in der APK."
  fi
fi

REQUIRED_KEYS=("VITE_STRIPE_PUBLIC_KEY" "VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
for key in "${REQUIRED_KEYS[@]}"; do
  VALUE=$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)
  if [[ -z "$VALUE" ]]; then
    error "$key ist in $ENV_FILE nicht gesetzt (leer). APK-Build abgebrochen."
  fi
  if [[ "$VALUE" == *"REPLACE_WITH"* ]] || [[ "$VALUE" == *"YOUR_KEY"* ]] || [[ "$VALUE" == *"xxx"* ]]; then
    error "$key in $ENV_FILE ist noch ein Platzhalter-Wert ('$VALUE'). Echten Key eintragen, bevor gebaut wird."
  fi
done
success "ENV-Preflight bestanden — Stripe/Supabase-Keys sind gesetzt und keine Platzhalter."


echo -e "\n${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   HUI RELEASE SYSTEM  —  Mode: ${MODE}              ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"

CURRENT_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version")
info "Aktuelle Version: $CURRENT_VERSION"

# ── 1. Version erhöhen ────────────────────────────────────────────────────────
step 1 "Version erhöhen ($MODE)"

# npm version macht: package.json updaten + postversion hook (sync-version.sh)
npm version "$MODE" --no-git-tag-version --silent

# postversion Hook hat build.gradle + strings.xml bereits aktualisiert
NEW_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version")

# Validierung
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  error "Version ist ungültig: '$NEW_VERSION' — Abbruch"
fi

# versionCode aus build.gradle (mit grep — KEIN Node)
NEW_CODE=$(grep -oP 'versionCode\s+\K[0-9]+' android/app/build.gradle)
success "Version: $CURRENT_VERSION → $NEW_VERSION (Code $NEW_CODE)"

# ── 2. version.ts APP_VERSION_CODE syncen ────────────────────────────────────
step 2 "version.ts prüfen"
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

# Plugin-Verifikation nach Sync
PLUGINS_JSON="android/app/src/main/assets/capacitor.plugins.json"
for plugin in "@capacitor/app" "@capacitor/push-notifications" "@capgo/capacitor-updater"; do
  if grep -q "$plugin" "$PLUGINS_JSON" 2>/dev/null; then
    success "$plugin registriert ✓"
  else
    warn "$plugin fehlt — re-run cap update"
    npx cap update android 2>/dev/null || true
    grep -q "$plugin" "$PLUGINS_JSON" 2>/dev/null || error "$plugin konnte nicht registriert werden"
  fi
done
success "Capacitor Sync fertig"

# ── 5. Git Commit + Push ──────────────────────────────────────────────────────
step 5 "Git Commit + Push"
git add -A
COMMIT_MSG="release: v${NEW_VERSION} (${MODE} bump)"
git commit -m "$COMMIT_MSG" 2>/dev/null || warn "Nichts zu committen"
git push origin main 2>/dev/null || error "Git Push fehlgeschlagen"
success "Git: committed + pushed"

# ── 6. Gradle Release Build ──────────────────────────────────────────────────
step 6 "Gradle assembleRelease"
cd "$ROOT_DIR/android"
./gradlew clean --no-daemon 2>/dev/null || warn "clean failed (nicht kritisch)"
./gradlew assembleRelease --no-daemon 2>&1 | tail -10 || {
  warn "Gradle Release Build fehlgeschlagen — versuche Debug"
  ./gradlew assembleDebug --no-daemon 2>&1 | tail -5 || error "Gradle Build komplett fehlgeschlagen"
}
cd "$ROOT_DIR"
success "Gradle Build fertig"

# ── 7. APK umbenennen — Windows-sicher mit relativen Pfaden ───────────────────
step 7 "APK umbenennen"

RELEASE_DIR="android/app/release"
mkdir -p "$RELEASE_DIR"

# APK finden (relative Pfade)
APK_SOURCE=""
for candidate in \
  "android/app/build/outputs/apk/release/app-release.apk" \
  "android/app/build/outputs/apk/release/app-release-unsigned.apk" \
  "android/app/build/outputs/apk/debug/app-debug.apk"; do
  if [[ -f "$candidate" ]]; then
    APK_SOURCE="$candidate"
    break
  fi
done
[[ -n "$APK_SOURCE" ]] || error "Keine APK gefunden. Gradle Build vorher ausführen."

# Version und Code lesen — NUR relative Pfade, KEIN pwd -W
APK_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version")
APK_CODE=$(grep -oP 'versionCode\s+\K[0-9]+' android/app/build.gradle)

APK_TARGET="${RELEASE_DIR}/HUI-v${APK_VERSION}-code${APK_CODE}.apk"
cp "$APK_SOURCE" "$APK_TARGET"

success "APK kopiert:"
echo "  Quelle:  $APK_SOURCE"
echo "  Ziel:    $APK_TARGET"
echo "  Größe:   $(du -h "$APK_TARGET" | cut -f1)"

# ── Done ──────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   RELEASE v${NEW_VERSION} ERFOLGREICH ABGESCHLOSSEN   ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║  Version:    ${NEW_VERSION}                       ║${NC}"
echo -e "${GREEN}${BOLD}║  Code:       ${NEW_CODE}                            ║${NC}"
echo -e "${GREEN}${BOLD}║  APK:        ${APK_TARGET}   ║${NC}"
echo -e "${GREEN}${BOLD}║  Git:        pushed to origin/main              ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"

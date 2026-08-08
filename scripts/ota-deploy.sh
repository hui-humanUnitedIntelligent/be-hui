#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# scripts/ota-deploy.sh — HUI OTA-Only Deploy (2026-08-08)
# ═══════════════════════════════════════════════════════════════
#
# Für reine WEB-ÄNDERUNGEN (JS/CSS/HTML/Images):
#   - Bumpt die Version (patch)
#   - Pusht zu main
#   - Vercel baut automatisch + generiert bundle.zip + app-version.json
#   - App erkennt beim nächsten Start die neuere Version → lädt
#     bundle.zip im Hintergrund herunter → aktiv beim übernächsten Start
#
# KEINE APK-Neuinstallation nötig. KEIN Play Store.
#
# Wann release.sh statt ota-deploy.sh?
#   - Neue native Plugins
#   - AndroidManifest-Änderungen
#   - Neue Capacitor-Konfiguration
#   - build.gradle Änderungen
#   → Alles andere: ota-deploy.sh
#
# Usage:
#   bash scripts/ota-deploy.sh           → Patch-Bump + Push
#   bash scripts/ota-deploy.sh patch      → Patch-Bump + Push
#   bash scripts/ota-deploy.sh minor      → Minor-Bump + Push
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'
info()    { echo -e "${BLUE}[OTA]${NC} $*"; }
success() { echo -e "${GREEN}[OTA]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[OTA]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[OTA]${NC} ❌ $*"; exit 1; }

MODE="${1:-patch}"
case "$MODE" in
  patch|minor|major) ;;
  *) echo "Usage: bash scripts/ota-deploy.sh [patch|minor|major]"; exit 1 ;;
esac

[[ -f "package.json" ]] || error "Nicht im Projekt-Root (package.json fehlt)"

CURRENT_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version")
info "Aktuelle Version: $CURRENT_VERSION"

echo -e "\n${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   HUI OTA DEPLOY  —  Mode: ${MODE}                  ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"

# ── 1. Version erhöhen ──────────────────────────────────────────
info "Version erhöhen ($MODE)..."
bash scripts/version.sh "$MODE"
NEW_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version")
success "Version: $CURRENT_VERSION → $NEW_VERSION"

# ── 2. Web-Build (lokal, um sicherzustellen dass alles kompiliert) ──
info "Web-Build (Lokaler Compile-Check)..."
npm run build 2>&1 | tail -5 || error "Web-Build fehlgeschlagen — Abbruch"
success "Build OK"

# ── 3. Git Commit + Push ─────────────────────────────────────────
info "Git Commit + Push..."
git add -A
git commit -m "ota: v${NEW_VERSION} (web-only OTA update)" 2>/dev/null || warn "Nichts zu committen (nur Version-Bump?)"

# Pull rebase falls remote weiter ist
git pull --rebase origin main 2>/dev/null || warn "Pull rebase übersprungen"
git push origin main 2>&1 || error "Git Push fehlgeschlagen"
success "Git: committed + pushed"

# ── Done ────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   OTA DEPLOY v${NEW_VERSION} ABGESCHLOSSEN         ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║  Version:      ${NEW_VERSION}                        ║${NC}"
echo -e "${GREEN}${BOLD}║  Vercel:       baut automatisch + bundle.zip   ║${NC}"
echo -e "${GREEN}${BOLD}║  App:          erkennt Update beim Start       ║${NC}"
echo -e "${GREEN}${BOLD}║  APK:          NICHT nötig (reine Web-Änderung) ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Was passiert jetzt automatisch:${NC}"
echo "  1. Vercel baut die neue Version (~30-60s)"
echo "  2. postbuild generiert bundle.zip + app-version.json"
echo "  3. App-Start: autoCheckOTA() sieht v${NEW_VERSION} > APK-Version"
echo "  4. Lädt bundle.zip im Hintergrund herunter"
echo "  5. Beim NÄCHSTEN Start: neue Version aktiv"
echo ""
echo -e "${YELLOW}Hinweis: Wenn native Plugins/Android-Config geändert wurden:${NC}"
echo -e "${YELLOW}  → bash scripts/release.sh patch (statt ota-deploy.sh)${NC}"

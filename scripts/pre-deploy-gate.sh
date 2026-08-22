#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Pre-Deploy Gate (Punkt 12)
# Prüft Build gegen bekannte White-Screen-Ursachen aus WHITESCREEN_CAUSES.md
# Blockiert Deploy wenn eine bekannte Ursache erkannt wird.
# ═══════════════════════════════════════════════════════════════
set -e

echo "═══════════════════════════════════════════════════"
echo "  HUI Pre-Deploy Gate — Checking known causes..."
echo "═══════════════════════════════════════════════════"

BLOCKED=0
WARNINGS=0

# ── Check 1: Backup-Dateien in src/ (Ursache #8) ─────────────────
echo ""
echo "[1/8] Checking: Backup files in src/ tree..."
BACKUP_FILES=$(find src/ -name "backup_*" -o -name "*.bak" -o -name "*.old" 2>/dev/null | head -20)
if [ -n "$BACKUP_FILES" ]; then
  echo "  ❌ BLOCKED: Backup files found in src/:"
  echo "$BACKUP_FILES" | sed 's/^/    /'
  BLOCKED=1
else
  echo "  ✅ No backup files in src/"
fi

# ── Check 2: Backup-Dateien in android/java/ (Ursache #8) ────────
echo ""
echo "[2/8] Checking: Backup files in android/app/src/main/java/..."
JAVA_BACKUPS=$(find android/app/src/main/java/ -name "backup_*" 2>/dev/null | head -10)
if [ -n "$JAVA_BACKUPS" ]; then
  echo "  ❌ BLOCKED: Backup files in java/ tree:"
  echo "$JAVA_BACKUPS" | sed 's/^/    /'
  BLOCKED=1
else
  echo "  ✅ No backup files in java/"
fi

# ── Check 3: Backup-Dateien in android/res/ (Ursache #8) ────────
echo ""
echo "[3/8] Checking: Backup files in android/app/src/main/res/..."
RES_BACKUPS=$(find android/app/src/main/res/ -name "backup_*" 2>/dev/null | head -10)
if [ -n "$RES_BACKUPS" ]; then
  echo "  ❌ BLOCKED: Backup files in res/ tree:"
  echo "$RES_BACKUPS" | sed 's/^/    /'
  BLOCKED=1
else
  echo "  ✅ No backup files in res/"
fi

# ── Check 4: Init-Funktionen ohne try-catch (Ursache #2) ────────
echo ""
echo "[4/8] Checking: Init functions in try-catch (web-main.jsx + main.jsx)..."
for file in src/web-main.jsx src/main.jsx; do
  if [ -f "$file" ]; then
    # Check if initSentry, initErrorReporting are in try blocks
    INIT_COUNT=$(grep -c "initSentry\|initErrorReporting\|initGlobalKeyboardHandling\|initAppPerformance" "$file" || echo 0)
    TRY_COUNT=$(grep -c "try {" "$file" || echo 0)
    if [ "$INIT_COUNT" -gt 0 ] && [ "$TRY_COUNT" -eq 0 ]; then
      echo "  ⚠️ WARNING: $file has init functions but no try-catch blocks"
      WARNINGS=$((WARNINGS + 1))
    else
      echo "  ✅ $file: $INIT_COUNT init calls in $TRY_COUNT try blocks"
    fi
  fi
done

# ── Check 5: React.lazy auf öffentliche Routen (Ursache #1) ─────
echo ""
echo "[5/8] Checking: React.lazy on public routes..."
if [ -f "src/WebApp.jsx" ]; then
  LAZY_PUBLIC=$(grep -E "lazy\(.*LoginPage|lazy\(.*LandingPage|lazy\(.*AuthCallback|lazy\(.*PublicProfile" src/WebApp.jsx 2>/dev/null || echo "")
  if [ -n "$LAZY_PUBLIC" ]; then
    echo "  ❌ BLOCKED: Public routes use React.lazy (causes Suspense hang):"
    echo "$LAZY_PUBLIC" | sed 's/^/    /'
    BLOCKED=1
  else
    echo "  ✅ Public routes use eager imports"
  fi
else
  echo "  ⚠️ WebApp.jsx not found — skipping"
  WARNINGS=$((WARNINGS + 1))
fi

# ── Check 6: createPortal in Modals (Ursache #7) ─────────────────
echo ""
echo "[6/8] Checking: Modals with createPortal (spot check)..."
PORTAL_COUNT=$(grep -rl "createPortal" src/ 2>/dev/null | wc -l)
MODAL_COUNT=$(find src/ -name "*Modal*" -o -name "*Wizard*" -o -name "*Sheet*" -o -name "*Flow*" 2>/dev/null | wc -l)
echo "  ℹ️ Found $PORTAL_COUNT files with createPortal, $MODAL_COUNT Modal/Wizard/Sheet files"
echo "  (Manual review recommended for new modals — see .agents/rules/footer-navbar-zindex.md)"

# ── Check 7: modulePreload: false in vite.config (Ursache #1) ────
echo ""
echo "[7/8] Checking: modulePreload disabled in vite.config..."
if grep -q "modulePreload: false" vite.config.js 2>/dev/null; then
  echo "  ✅ modulePreload: false is set"
else
  echo "  ⚠️ WARNING: modulePreload: false NOT found in vite.config.js"
  WARNINGS=$((WARNINGS + 1))
fi

# ── Check 8: Build funktioniert ─────────────────────────────────
echo ""
echo "[8/8] Checking: Build completes successfully..."
# Note: Build is expected to be already done. If not, run it.
if [ ! -d "www/assets" ]; then
  echo "  Running build..."
  npm run build > /tmp/pre-deploy-build.log 2>&1
  if [ $? -ne 0 ]; then
    echo "  ❌ BLOCKED: Build failed"
    tail -20 /tmp/pre-deploy-build.log | sed 's/^/    /'
    BLOCKED=1
  else
    echo "  ✅ Build successful"
  fi
else
  echo "  ✅ Build output exists (www/assets/)"
fi

# ── Ergebnis ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
if [ "$BLOCKED" -eq 1 ]; then
  echo "  ❌ DEPLOY BLOCKED — Known causes detected"
  echo "  Fix the issues above before deploying."
  echo "  Warnings: $WARNINGS"
  echo "═══════════════════════════════════════════════════"
  exit 1
else
  echo "  ✅ DEPLOY GATE PASSED — No known causes detected"
  echo "  Warnings: $WARNINGS (review recommended)"
  echo "═══════════════════════════════════════════════════"
  exit 0
fi

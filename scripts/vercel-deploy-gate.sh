#!/usr/bin/env bash
# ============================================================================
# HUI VERCEL DEPLOY-GATE (2026-09-15, Michaels Freigabe "ja mach das")
# ============================================================================
# Zweck: Verhindert, dass JEDER git push auf main einen Vercel-Production-Build
# lostreten (Kostenfall 09/2026: $102,06 Build-CPU-Minuten nach ~5 Deploys/Tag;
# und am 15.09. deployte Vercel automatisch 2.1.601 BROKEN auf Production,
# weil der Auto-Deploy die "warte auf Michaels deploy"-Queue nicht kennt).
#
# Vercel "Ignored Build Step"-Semantik:
#   exit 0  → Build wird ausgefuehrt
#   exit 1  → Deployment wird ignoriert (Status: Canceled — keine Build-Kosten)
#
# Regel (in Uebereinstimmung mit Michaels DEPLOY-FREIGABE-REGEL):
#   Production-Builds NUR wenn der Head-Commit das Marker-Tag [DEPLOY]
#   in der Commit-Message enthaelt. Der Marker wird vom Agent gesetzt,
#   SOBALD Michael explizit "deploy" oder "Hotfix raus" gesagt hat —
#   nie von selbst.
#
# Marker-Beispiel (Commit-Message):
#   "OTA 2.1.603: Sammel-Release [DEPLOY]"
#   oder stiller Hotfix: "HOTFIX-XYZ: ... [DEPLOY]"
#
# Sicherheit: Wenn dieser Test aus irgendeinem Grund UNSICHER ist
# (Marker-Regex nicht auswertbar), wird der Build BLOCKIERT (exit 1) —
# ein ausgelassener Build ist kostenlos, ein versehentlicher Build nicht.
# ============================================================================

MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"

# Fallback: Vercel setzt die Env-Variable nicht (aeltere Build-Images) → git
if [ -z "$MSG" ] && command -v git >/dev/null 2>&1; then
  MSG="$(git log -1 --pretty=%B 2>/dev/null || true)"
fi

# Unsicherer Zustand (weder Env-Var noch git) → blockieren (safe direction)
if [ -z "$MSG" ]; then
  echo "[DEPLOY-GATE] Weder VERCEL_GIT_COMMIT_MESSAGE noch git-Log verfuegbar — Build blockiert."
  exit 1
fi

if printf '%s' "$MSG" | grep -q '\[DEPLOY\]'; then
  echo "[DEPLOY-GATE] [DEPLOY]-Marker im Head-Commit gefunden — Production-Build wird ausgefuehrt."
  exit 0
fi

echo "[DEPLOY-GATE] Kein [DEPLOY]-Marker im Head-Commit — Production-Build uebersprungen (Kostenschutz, Michaels Freigabe-Regel)."
exit 1

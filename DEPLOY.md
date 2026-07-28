# HUI — Deployment-Dokumentation

**Letzte Aktualisierung:** 2026-07-28

---

## Deployment-Architektur

HUI nutzt ein **Pre-Built Deploy**-Modell:

```
Local: npm run build → www/    (Capacitor + Vercel)
Git:   www/ committed           (Build-Artefakte im Repo)
Vercel: liest www/ direkt       (kein Cloud-Build)
```

### Warum `buildCommand: ":"`?

Der Doppelpunkt ist ein Shell-No-Op — Vercel führt **keinen Build** in der Cloud aus.  
Das ist **bewusst**: Der `www/`-Ordner wird lokal gebaut und committed.

**Vorteil:** Deterministischer Build — Vercel deployed exakt das, was lokal getestet wurde.  
**Pflicht:** Nach jeder Code-Änderung muss `npm run build` lokal laufen + `www/` committed werden.

---

## Deploy-Checkliste (vor jedem Merge in main)

```bash
# 1. Build ausführen
npm run build           # → www/ wird aktualisiert

# 2. www/ committen
git add www/
git commit -m "build: www/ aktualisiert ($(date +%Y-%m-%d))"

# 3. Pushen → Vercel deployed automatisch
git push origin main
```

---

## Vercel-Konfiguration

| Setting | Wert | Erklärung |
|---------|------|-----------|
| `outputDirectory` | `www` | Kapazitor + Vercel Output |
| `buildCommand` | `:` | No-Op — Pre-Built Deploy |
| `rewrites` | SPA-Fallback → `/index.html` | React Router |
| OG-Tags | `/api/og.js` (max 10s) | Social-Media-Preview |

---

## Umgebungsvariablen (Vercel Dashboard)

```
VITE_SUPABASE_URL=https://gxztrhvhcxhmunhhkfjd.supabase.co
VITE_SUPABASE_ANON_KEY=<aus Supabase Dashboard — NICHT aus DEPLOY.md>
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

> ⚠️ **NIEMALS** Secrets in dieser Datei ablegen.  
> Supabase Anon Key bei Verdacht sofort rotieren:  
> Supabase Dashboard → Project Settings → API → Reset

---

## Android-Build

```bash
npm run build    # 1. Vite-Build (→ www/)
npm run sync     # 2. www/ → android/app/src/main/assets/public/ (Capacitor)
npm run android  # 3. Android Studio öffnen → APK bauen
```

Keystore: `android/app/release.keystore` (NIEMALS committen)

---

## Branching

- `main` → produktiv (direkt deployed via Vercel)
- `cursor/*` → Feature-Branches (Cursor AI)
- PRs werden direkt in main gemergt (kein develop-Branch)

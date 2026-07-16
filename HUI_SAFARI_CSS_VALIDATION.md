# HUI Safari CSS Validation

**Datum:** 2026-07-14  
**Branch:** `cursor/hui-safari-css-validation-0006`  
**PR:** https://github.com/hui-humanUnitedIntelligent/be-hui/pull/128  
**Änderung:** Eine Zeile entfernt in `src/index.css` — `will-change: transform` bei `.hui-scroll`

---

## Vorher

| Beobachtung | Quelle |
|---|---|
| `.hui-scroll` enthielt `will-change: transform` | `src/index.css` Zeile 183 |
| Production-CSS enthält `will-change:transform` auf `.hui-scroll` | `https://be-hui.vercel.app/assets/index-D6bf86Ih.css` (curl, 2026-07-14) |
| Playwright WebKit: `stylesheetWillChange: "transform"` | Production-URL, ohne Login |

```css
/* src/index.css — vorher */
.hui-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  will-change: transform;             /* GPU-Layer → smoothes Scrollen */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
```

---

## Nachher

| Beobachtung | Quelle |
|---|---|
| `will-change: transform` entfernt, keine Ersatz-Eigenschaft gesetzt | `src/index.css` (Commit `11665c45`) |
| Lokaler Build erfolgreich | `npm run build` → `dist/assets/index-CsB1652O.css` |
| Gebaute CSS ohne `will-change` auf `.hui-scroll` | `grep` auf Build-Artefakt |

```css
/* src/index.css — nachher */
.hui-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
```

Gebaute Regel (minifiziert):

```
.hui-scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none}
```

---

## Browservergleich

Testprotokoll: Feed öffnen → mindestens 100 Beiträge scrollen → weißer Bereich? Infinite Scroll? Bilder?

| Test | Safari (WebKit, iPad-UA) | Firefox |
|---|---|---|
| Feed geöffnet | Nein — Redirect auf `/login`, kein `.hui-scroll` im DOM | Nein — Redirect auf `/login`, kein `.hui-scroll` im DOM |
| 100+ Beiträge gescrollt | Nicht ausführbar (kein Feed ohne Login) | Nicht ausführbar (kein Feed ohne Login) |
| Weißer Bereich | Nicht beobachtbar (Test nicht ausführbar) | Nicht beobachtbar (Test nicht ausführbar) |
| Infinite Scroll | Nicht beobachtbar (Test nicht ausführbar) | Nicht beobachtbar (Test nicht ausführbar) |
| Bilder | Nicht beobachtbar (Test nicht ausführbar) | Nicht beobachtbar (Test nicht ausführbar) |
| CSS `will-change` auf `.hui-scroll` | Nachher-Build: `(empty)` auf lokalem Preview (`127.0.0.1:4173`) | Nachher-Build: `(empty)` auf lokalem Preview (`127.0.0.1:4173`) |

**Hinweis:** Vollständiger iPad-Safari-Regressionstest erfordert authentifizierte Session auf deployed Build. In dieser Umgebung waren keine Test-Credentials verfügbar.

---

## Deploy

| Schritt | Status | Beobachtung |
|---|---|---|
| Lokaler Build | Erfolg | `vite build`, 804 Module, `dist/` erzeugt |
| Vercel Preview (PR #128) | Fehlgeschlagen | Check `Vercel` → `Deployment has failed` (`dpl_HGgEE2rQ4fkNXRC2WGqBabkSCyVx`) |
| Production (`be-hui.vercel.app`) | Unverändert | Enthält weiterhin `will-change:transform` (Vorher-Stand) |

Vercel-Build auf Branch schlägt fehl, weil `package.json` im Repository leer ist (`0 bytes`) — `npm run build` ist auf CI nicht ausführbar. Dieser Zustand bestand bereits auf `main` vor dieser Änderung.

---

## Ergebnis

| Frage | Antwort |
|---|---|
| Wurde genau eine CSS-Zeile geändert? | Ja — nur `will-change: transform` entfernt |
| Ist `will-change` im Build-Artefakt weg? | Ja — lokal verifiziert |
| Ist die WebKit-Compositor-Vermutung bestätigt? | **Nein — nicht testbar** |
| Ist die Vermutung widerlegt? | **Nein — nicht testbar** |

**Schlussfolgerung:** Die Hypothese kann mit den vorliegenden Beobachtungen weder bestätigt noch widerlegt werden. Der Feed-Regressionstest auf Safari (iPad) und Firefox wurde nicht durchgeführt, weil (1) der Vercel-Deploy fehlschlug und (2) der Feed ohne Login nicht erreichbar ist.

**Nächster Schritt (manuell):** Nach erfolgreichem Deploy auf iPad Safari und Firefox jeweils 100+ Beiträge scrollen. Dann:

- Fehler weg → Vermutung bestätigt (`will-change` war die Ursache)
- Fehler unverändert → Vermutung widerlegt; im Bericht festhalten: **„will-change war nicht die Ursache.“**

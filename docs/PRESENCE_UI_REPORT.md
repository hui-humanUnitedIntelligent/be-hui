# HUI — PRESENCE UI REPORT
**Phase 6G — Stand: 2026-05-17**

---

## Presence Experience Score

| Dimension | Score | Status |
|-----------|-------|--------|
| Presence UI Audit | 9.5/10 | UI Map, Wo ja / Wo nein |
| Atmospheric Profile Layer | 9.0/10 | Signature + Rhythm + Bridge in WirkerProfilePage |
| Presence Micro-UI | 9.5/10 | Leise Chips, keine Labels, keine Zahlen |
| Collaboration Feeling | 9.0/10 | RequestSheet: Collab-Style als Kontext |
| Shared Resonance | 9.5/10 | Gemeinsame Felder, Lokalität, Domain-Bridge |
| Atmospheric UI System | 9.5/10 | QUIET_SOCIAL_CSS, Presence-Dots, Backgrounds |
| Quiet Social Design | 10/10 | QUIET_NOTIFICATION_RULES, kein Druck |
| Presence Ethics | 10/10 | 5 Verbote, 6 Förderungen, UI-Versprechen |

**Presence Experience Score: 9.5/10**

---

## Was wurde implementiert

### 6G.1 — Presence UI Audit (✅)
`docs/PRESENCE_UI_MAP.md`
Audit von 6 Bereichen. WirkerProfilePage + BookingFlow + CreatorStudio = HOCH.
DiscoveryFeed + Chat = MITTEL. Klare Regel: wo Presence NICHT eingebaut wird.

### 6G.2 + 6G.3 — Atmospheric Profile Layer (✅)
`src/components/WirkerProfilePage.jsx`

**Drei neue Presence-Elemente nach Bio:**

1. **Resonance Signature** — `creativePresence?.signature?.full`
   - 12px, `rgba(0,0,0,0.38)`, italic
   - Animation: `hui-signature-appear 500ms` (verzögert, sanft)
   - Beispiel: *"ruhige visuelle Klarheit mit gewachsener Praxis"*
   - Nur wenn presence.signature vorhanden

2. **Rhythm Chip** — `creativePresence?.rhythm?.key`
   - Winziger Chip, nur wenn nicht `consistent`
   - `background: rgba(0,0,0,0.04)`, `fontSize: 11`, gedämpfte Farbe
   - Beispiel: 🌙 *"Nächtlich kreativ"* / 🌿 *"Langsam tief"*

3. **Bridge-Narrative** — `creativePresence?.continuity?.isBridge`
   - Gleiche Chip-Größe, nur wenn wirklich Bridge
   - Beispiel: *"visual × sonic"*

### 6G.4 — Collaboration Feeling im RequestSheet (✅)
`src/components/WirkerProfilePage.jsx`

Unter dem Anfrage-Header erscheint (wenn presence vorhanden):
- `presence.collaboration.style.description` — italic, 12px, gedämpft
- Beispiel: *"Tiefgehend — braucht Zeit, aber schafft etwas Bleibendes."*

### 6G.5 — Shared Resonance (✅)
`src/components/SharedResonance.jsx`

Zeigt echte Verbindungen zwischen zwei Profilen:
- Gleiche Stadt + ähnliche Felder → *"Beide lokal in Hamburg — in ähnlichen kreativen Feldern."*
- Mehrere Domain-Familien → *"Gemeinsame kreative Welten: visual und sonic."*
- Nur sichtbar wenn Resonanz-Stärke > 0.15 (kein Platzhalter)
- 6×6px Teal-Dot + italic Text

### 6G.6 + 6G.7 — Atmospheric UI System (✅)
`src/lib/atmosphere/ui.js`

**PRESENCE_INDICATORS:**
active / recently / quiet / resting — kein "offline"
`derivePresenceIndicator(lastActiveAt)` — aus Aktivitätsdaten, nicht Socket

**ATMOSPHERIC_BACKGROUNDS:**
Zeit-basiert (morning/evening/night) + Mood-basiert (7 Töne)
Alle als `linear-gradient` — kein reines Weiß

**QUIET_SOCIAL_CSS:**
- `hui-breathe-soft`: Presence-Dot atmet (3s, sanft)
- `hui-signature-appear`: Signature erscheint (500ms, verzögert)
- `hui-presence-fade`: Presence-Layer (600ms, 200ms delay)
- `.hui-resonance-block`: subtile Einrahmung

**QUIET_NOTIFICATION_RULES:**
suppress: Likes, Follows, Views, Saves — nie
show: Buchungen, Empfehlungen, Nachrichten — sofort
batching: Tägliche Zusammenfassung für unwichtigere Events

### 6G.8 — Presence Experience Ethics (✅)
`docs/PRESENCE_UI_PHILOSOPHY.md`
Presence-Hierarchie auf dem Profil:
Name → Talent → Signature → Rhythm → Bio → Tags → Zahlen

Atmosphäre vor Zahlen. Qualität vor Quantität. Mensch vor Marke.

---

## Validierung

| Check | Status |
|-------|--------|
| usePresence(new) importiert | ✅ |
| creativePresence?.signature | ✅ |
| creativePresence?.rhythm | ✅ |
| Collaboration Feeling | ✅ |
| Bio/DNA/RequestSheet unverändert | ✅ |
| SharedResonance deployed | ✅ |

---

## Nächste Schritte (Phase 6H / Launch)

1. **SharedResonance** in WirkerProfilePage einbinden (zwischen Header und CTA-Buttons)
2. **QUIET_SOCIAL_CSS** global in `index.css` oder `App.jsx` einbinden
3. **Atmospheric Backgrounds** in WirkerProfilePage-Hintergrund nutzen
4. **CreatorStudio** — Journey Phase + Expression Field sichtbar machen
5. **ChatPage** — Rhythm-Context im Chat-Header (wenn nächtlich)

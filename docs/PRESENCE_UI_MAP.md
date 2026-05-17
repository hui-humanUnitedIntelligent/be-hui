# HUI — PRESENCE UI MAP
**Phase 6G.1 — Wo Presence sichtbar wird**

---

## Audit-Ergebnis

### WirkerProfilePage — Presence-Potenzial ✅ HOCH
**Aktuell:** Username · seit-Badge · Verfügbar-Dot · Bio (kursiv) · Mood-Tags · DNA-Tags
**Fehlt:** Resonance Signature · Creative Rhythm · Collaboration Style · Bridge-Narrative · Atmospheric Identity

**Wo einbauen:**
```
NACH Bio, VOR DNA-Tags:
  → resonanceSignature.full   (1 Zeile, italic, gedämpft)
  → rhythm.label              (winzige Chip, wenn nicht "konstant")
  → collaboration.style.label (im Booking-Flow)
  → continuity.narrative      (wenn isBridge: sanfter Hinweis)
```

### DiscoveryFeed / FeedCards — Presence-Potenzial 🟡 MITTEL
**Aktuell:** creator-Name · talent · city · price · category · bio
**Fehlt:** Signature-Qualität

**Wo einbauen:**
```
In WirkerCard / WerkCard:
  → atmosphericIdentity.energy als Farb-Ton (nicht als Label)
  → rhythm.icon (winziges Icon wenn nächtlich/ruhend/intensiv)
```

### BookingFlow / RequestSheet — Presence-Potenzial ✅ HOCH
**Aktuell:** Datum · Budget · Ort · Nachricht · Mood-Wahl
**Fehlt:** Collaboration Feeling

**Wo einbauen:**
```
OBEN im RequestSheet (vor den Feldern):
  → collaborationStyle.description (1-2 Sätze)
  → pacing                        ("arbeitet rhythmisch")
  → Warmth-Indikator              (Trust Signals als atmosphärischer Text)
```

### ChatPage — Presence-Potenzial 🟡 MITTEL
**Aktuell:** Presence-Status (online/offline) via usePresence() aus sessionHooks
**Fehlt:** Rhythm-Context ("schafft oft nachts"), Collab-Warmth

**Wo einbauen:**
```
Im Chat-Header (subtil, unter dem Namen):
  → rhythm.label wenn nicht "konstant" (z.B. "schafft oft nachts")
```

### CreatorStudio — Presence-Potenzial ✅ HOCH (Owner-only)
**Aktuell:** Greeting via getAmbientGreeting() · Pending Bookings
**Fehlt:** Eigene Journey-Phase · Expression Fields · Presence-Reflexion

**Wo einbauen:**
```
Zwischen Greeting und Tool-Groups:
  → journey.phase.label            (1 Zeile, sehr leise)
  → expression.primary             (thematischer Fokus)
  → continuity.narrative           (wenn Bridge)
```

---

## Wo Presence NICHT eingebaut wird

| Bereich | Grund |
|---------|-------|
| Login / Onboarding | Kein Presence ohne echte Daten |
| Admin-Seite | Technisch, nicht atmosphärisch |
| ImpactPage | Gemeinschafts-fokus, kein Individual-Spotlight |
| Suche / Filter | Zahlen-basiert, Presence würde stören |
| Notification-Center | Zu transaktional |

---

## Design-Prinzipien für Presence-UI

| Prinzip | Umsetzung |
|---------|-----------|
| Atmosphäre > Text | Farbe/Ton vor Label |
| Leise > Laut | Signature in gedämpftem Italic |
| Kontextuell | Nur zeigen wenn aussagekräftig |
| Additiv | Nichts entfernen — nur ergänzen |
| Nie performativ | Kein "⭐ Top Creator" etc. |

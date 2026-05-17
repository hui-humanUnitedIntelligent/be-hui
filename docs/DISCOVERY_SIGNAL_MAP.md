# HUI — DISCOVERY SIGNAL MAP
**Phase 5C.1 — Stand: 2026-05-17**

> Dieses Dokument inventarisiert ALLE vorhandenen Signale in HUI.
> Basis für die Discovery Engine V1.
> Kein Signal hier ist für Manipulation gedacht — nur für Resonanz.

---

## Philosophie

HUI misst keine Aufmerksamkeitsdauer.
HUI misst keine Sucht-Mechaniken.
HUI fragt: **„Passt diese Person kreativ zu dieser Person?"**

---

## 1. Social Signals

| Signal | Quelle | Tabelle | Gewicht | Bedeutung |
|--------|--------|---------|---------|-----------|
| Follow | Nutzeraktion | `follows` | Hoch | aktive kreative Affinität |
| Save | Nutzeraktion | `saved_works` | Hoch | echtes Interesse, keine Impuls-Like |
| Like | Nutzeraktion | `work_likes` | Mittel | positive Resonanz |
| Recommendation | nach Buchung | `recommendations` | Sehr hoch | verifizierte Qualität |
| Repeat Booking | nach Abschluss | `bookings` | Sehr hoch | tiefes Vertrauen |
| Collaboration | Chat-basiert | `chats` (type=collaboration) | Hoch | kreative Kompatibilität |
| Follow-Back | gegenseitig | `follows` | Hoch | echte kreative Verbindung |
| Chat-Initiierung | Nutzeraktion | `chats` | Mittel | konkretes Interesse |

### Was wir NICHT messen
- ❌ View-Dauer (zu leicht zu manipulieren)
- ❌ Share-Zahlen (viraler Druck)
- ❌ Comment-Zahl (Trolls, Spam)
- ❌ Follower-Anzahl allein (Vanity metric)

---

## 2. Creative Signals

| Signal | Quelle | Feld | Gewicht | Bedeutung |
|--------|--------|------|---------|-----------|
| Talent-Kategorie | Profil | `talent` | Hoch | kreativer Kernbereich |
| Focus-Type | Profil | `focus_type` | Hoch | works / experiences / hybrid |
| DNA-Tags | Profil | `dna_tags` | Hoch | kreative Identität |
| Mood | Work/Story | `mood` | Mittel | emotionaler Ton |
| Work-Kategorien | Works | `category` | Hoch | kreative Richtung |
| Erlebnis-Typ | Experiences | `type` | Mittel | Interaktionsformat |
| Story-Themen | Stories | `tags`, `caption` | Mittel | narrative Identität |
| Kreative Tiefe | Works | Anzahl + Konsistenz | Hoch | Nischen-Tiefe |

### Mood-Cluster (vorhandene HUI-Moods)
```
kreativ     → Handwerk, Schöpfung, Materialien
ruhig       → Kontemplation, Minimalismus, Stille  
warm        → Menschlichkeit, Verbindung, Wärme
professionell → Präzision, Handwerk, Qualität
authentisch → Ehrlichkeit, Unverfälschtheit, Tiefe
inspirierend → Vision, Energie, Möglichkeiten
```

---

## 3. Trust Signals

| Signal | Quelle | Feld | Gewicht | Bedeutung |
|--------|--------|------|---------|-----------|
| Verifiziert | Profil | `is_verified` | Sehr hoch | manuelle HUI-Prüfung |
| Response Rate | Bookings | `response_rate` | Hoch | Verlässlichkeit |
| Abgeschlossene Buchungen | Bookings | `total_bookings_completed` | Hoch | Erfahrung |
| Empfehlungsqualität | Recommendations | `text` + sentiment | Hoch | echte Qualität |
| Repeat-Rate | Bookings | Wiederbuchungen selber Nutzer | Sehr hoch | tiefes Vertrauen |
| Chat-Response-Zeit | Chats | Zeitdelta | Mittel | Kommunikationsqualität |
| Trust-Score | trustContext | composite | Sehr hoch | aggregiert |

---

## 4. Intent Signals  

| Signal | Quelle | Erfassung | Gewicht | Bedeutung |
|--------|--------|-----------|---------|-----------|
| Profil-Besuch | Client | sessionStorage | Mittel | echtes Interesse |
| Wiederholter Besuch | Client | localStorage | Hoch | anhaltende Neugier |
| Such-Pattern | SearchOverlay | query-Text | Mittel | aktive Suche |
| Save-nach-View | Client | State-Sequenz | Hoch | qualitatives Interesse |
| Booking-nach-Visit | Client | State-Sequenz | Sehr hoch | Konversionsintention |
| Tab-Verweilzeit | Client | Tab-Aktivität | Niedrig | vorsichtig nutzen |

---

## 5. Temporal Signals

| Signal | Quelle | Feld | Gewicht | Bedeutung |
|--------|--------|------|---------|-----------|
| Recency | Works/Stories | `created_at` | Mittel | Aktualität |
| Aktive Periode | Profile | `updated_at` | Mittel | Plattform-Engagement |
| Verfügbarkeit | Profile | `is_available` | Hoch | buchbar jetzt |
| Trend-Velocity | Works | Interaktionen/Zeit | Hoch | frischer Aufstieg |
| Konsistenz | Works | Regelmäßigkeit | Hoch | verlässliche Kreativität |
| Saisonalität | Experiences | Datum + Typ | Niedrig | kontextuell |

---

## 6. Human Signals (Qualitativ)

Diese Signale sind schwerer zu messen — aber die wichtigsten.

| Signal | Proxy | Gewicht | Bedeutung |
|--------|-------|---------|-----------|
| Kreative Tiefe | Nischen-Konsistenz in DNA-Tags | Sehr hoch | echter Fokus |
| Ruhige Energie | niedrige Post-Frequenz + hohe Qualität | Hoch | kein Spam |
| Kollaborationsgeist | Collaboration-Chats + Empfehlungen | Hoch | Teamplayer |
| Authentizität | Bio-Länge + persönliche Tags | Mittel | echte Stimme |
| Konsistenz | gleichmäßige Aktivität | Hoch | Verlässlichkeit |
| Nischen-Tiefe | spezifische DNA-Tags | Hoch | klare Identität |

---

## Signal-Gewichtungsmatrix (Discovery Engine V1)

```
VERTRAUEN    ████████████  40%   (Empfehlungen + Verifizierung + Abschlüsse)
KREATIVE FIT ████████░░░░  30%   (DNA-Tags + Focus-Type + Mood-Match)  
SOZIALE NÄHE █████░░░░░░░  18%   (gemeinsame Follows + Kollaborationen)
FRISCHE      ███░░░░░░░░░  12%   (Recency + Velocity + Verfügbarkeit)

DIVERSITY GUARD: mind. 20% neue/unbekannte Creators pro Feed
ANTI-REPETITION: max. 3× gleicher Creator in 24h
FAIRNESS FLOOR: min. Exposure für neue Creators (Cold-Start)
```

---

## Vorhandene Datenpunkte (Inventory)

### In Supabase (aktiv)
- `profiles`: display_name, talent, focus_type, dna_tags, bio, is_available, is_verified, response_rate, total_bookings_completed, hourly_rate
- `follows`: follower_id, following_id, created_at
- `works`: user_id, category, title, description, status, cover_url, price, created_at
- `experiences`: user_id, type, title, description, price, created_at
- `bookings`: client_id, wirker_user_id, status, created_at, completed_at
- `recommendations`: reviewer_id, recipient_id, text, work_title, created_at
- `chats`: participant_ids, type (direct/booking/collaboration)
- `stories`: user_id, tags, caption, media_url, created_at

### Client-Side (sessionStorage/localStorage)
- `hui_talent`: Talent-Status (localStorage)
- Tab-Aktivität: indirekt über useTabKeepAlive
- Mood-Auswahl: activeMood State

### Noch nicht erfasst (Potenzial Phase 5D)
- Profil-Besuche (anonyme View-Counts)
- Such-Queries (Trending Topics)
- Save-Sequenzen (nach welchem Content)
- Creator-Co-Follows (Network-Graphen)

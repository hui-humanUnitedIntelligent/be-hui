# HUI Experience Engineering — Phase 2.0
## Vollständiger User Journey Audit (V1)

**Datum:** 2026-07-01  
**Methode:** Simulierte First-Time-User-Journey durch Codebase, Copy, Flows und Übergänge  
**Fokus:** Menschliche Erfahrung — nicht Codequalität  
**Scope:** Keine Architekturänderungen. Tabbar, Tab-Namen, IA, HUI Studio, Meine Resonance, Mein HUI, Impact, Profil sind verbindlich und unverändert.

**Leitfrage:** *Wie fühlt sich HUI für einen Menschen an?*

---

## Executive Summary

HUI besitzt eine **seltene emotionale Grundlage**: ruhige Sprache, warme Onboarding-Momente, eine klare Constitution und ein Design, das bewusst nicht nach Social Media schreit. Der erste Kontakt — Splash, Login, Welcome — fühlt sich **vertrauenswürdig und menschlich** an.

Die größte Spannung entsteht **nach** dem Ankommen: Die Plattform spricht in mehreren Stimmen gleichzeitig. „Entdecken“ und „Home“ konkurrieren semantisch. Drei verschiedene „Resonanz“-Oberflächen erfüllen unterschiedliche Rollen, werden aber nicht voneinander abgegrenzt. Der zentrale Orb öffnet für viele Nutzer einen wunderschön animierten Wirkungsraum — mit **Platzhalterdaten**, die Vertrauen zerstören können, bevor echte Wirkung entsteht.

HUI verliert seine Identität dort, wo es **wie ein Marktplatz, ein Dashboard oder ein Feed-Netzwerk** wirkt — nicht weil die Features falsch sind, sondern weil Orientierung, echte Daten und semantische Klarheit nachlassen.

**Gesamturteil:** Die Seele ist da. Die Geschichte bricht an Übergängen und an Stellen, an denen Schönheit noch nicht mit Echtheit verbunden ist.

---

## Aufgabe 1 — Vollständige First-Time-User-Journey

### Phase 0: Splash (LoginPage, Modus `splash`)

| Moment | Was der Nutzer sieht | Emotion |
|--------|----------------------|---------|
| Erster Bildschirm | Atmosphärisches Vollbildbild, gedämpfte Farben, Headline *„Verbinde dich mit Menschen, die wirken."* | Ruhe, Neugier, Wärme |
| Subline | *„Ein ruhiges kreatives Netzwerk für echte Zusammenarbeit."* | Orientierung: Das ist kein TikTok |
| CTAs | „Werde Teil von HUI" / „Ich bin bereits dabei" / „Per Magic Link anmelden" | Klare Wahl, kein Druck |

**Sofort verstanden:** HUI ist etwas anderes — ruhiger, menschlicher.  
**Unklar:** Was „wirken" konkret bedeutet (erst später durch Grundpfeiler).

---

### Phase 1: Login / Registrierung

| Weg | Copy-Highlights | Gefühl |
|-----|-----------------|--------|
| Login | *„Schön, dass du wieder da bist."* — *„Dein kreativer Raum wartet auf dich."* | Wiedererkennung, Zugehörigkeit |
| Register | *„Werde Teil eines ruhigen kreativen Netzwerks."* | Einladung, nicht Verkauf |
| Magic Link | *„Ruhiger Zugang per E-Mail."* | Niedrige Hürde, Vertrauen |
| Forgot | *„Manchmal hilft ein neuer Anfang."* | Menschlich, nicht technisch |

**Stärke:** Fehlermeldungen sind übersetzt und warm formuliert.  
**Reibung:** Registrierung mit Ambassador-Feld (*„Benutzername (optional)"*) — für Erstnutzer ohne Kontext unklar, warum das da ist.

---

### Phase 2: Auth-Callback → App-Einstieg

1. OAuth/Magic Link: *„Einen Moment…"* → *„Willkommen zurück."* → Redirect `/Home`
2. `AppEntryController` prüft `hui_welcome_seen`
3. **Erstnutzer:** `WelcomeOverlay` erscheint Vollbild
4. **Wiederkehrender Nutzer:** Direkt in App-Shell

**Warten:** Auth-Loader bis 25s mit *„Verbindung dauert länger als erwartet"* — seltener, aber existenziell beängstigend für Erstnutzer.

---

### Phase 3: Welcome-Onboarding (einmalig)

**Copy-Kern:**
- *„Willkommen bei HUI"*
- *„Schön, dass du da bist."*
- *„HUI ist ein Ort für Menschen, die gemeinsam Werte schaffen, Talente entdecken und echte Verbindungen aufbauen möchten."*
- Feature-Liste: Menschen · Talente · Werke · Erlebnisse · Impact-Projekte
- Abschluss: *„Jede Begegnung kann etwas verändern. Vielleicht beginnt deine genau heute."*
- CTA: **„✨ HUI entdecken"**

**Gefühl:** Außergewöhnlich gut. Glassmorphism, sanfte Animation, keine Gamification. Der Nutzer fühlt sich **eingeladen, nicht registriert**.

**Reibung:** Die Feature-Liste listet fünf Möglichkeiten auf — der Nutzer weiß danach noch nicht, *wo* er anfangen soll.

---

### Phase 4: Profil-Vervollständigung (bedingt)

Erscheint **nach** Welcome, wenn Username und Display Name fehlen.

| Schritt | Titel | Ton |
|---------|-------|-----|
| 1 | Dein Name | *„Dein @Username ist deine einzigartige Adresse in HUI."* |
| 2 | Über dich | *„Was bewegst du? Was machst du aus?"* |
| 3 | Dein Gesicht | Avatar-Upload |
| 4 | Deine Welt | Interessen-Chips (Musik, Kunst, Natur, Wirkung …) |
| Done | *„Willkommen bei HUI — Dein Profil ist bereit."* | |

**Gefühl:** Persönlich, nicht wie ein Formular. Soft Modal, kein Hard-Redirect.  
**Reibung:** Zweites „Willkommen bei HUI" kurz nach Welcome-Overlay — **doppeltes Ankommen**.

---

### Phase 5: Erste Nutzung — Landung auf „Entdecken" (Tab `feed`)

Default-Tab nach Session: **Entdecken** (`UnifiedFeed`).

**Header:**
- *„Guten Morgen/Tag/Abend, {Name}."*
- *„Entdecke heute Menschen, Ideen und Erlebnisse, die dich inspiieren."*
- Stats-Karte: *„Heute auf HUI"* (neue Werke, Erlebnisse, Mitglieder)

**Gefühl:** Persönlich, ruhig, orientierend. Kein Infinite-Scroll-Zwang sichtbar im Design-Intent.

**Unklar für Erstnutzer:**
- Was ist der Unterschied zwischen Tab **Entdecken** und Tab **Home**?
- Was macht der **Orb** in der Mitte?
- Wo sind **Nachrichten**? (nur Header-Icon, kein Tab)

---

### Phase 6: Erste Entdeckung

**Pfad A — Entdecken-Feed:** Scroll durch Community-Karten (Werke, Erlebnisse, Menschen, Stories). Avatar-Tap → Profil. Reaktionen ohne Lautstärke.

**Pfad B — Home-Tab (`DiscoverPage`):** Strukturierter Katalog:
- *„Heute auf HUI entdecken"*
- Inspiring Menschen · Momente · Werke · Erlebnisse · Projekte · Orte
- Live-Aktivitätsleiste (*„Sarah hat einen Gemeinschaftsgarten gestartet"*) — teils Demo-Daten

**Pfad C — Suche (Header):** Globale Suche nach Menschen, Werken, Projekten.

**Pfad D — Karte / Match / Mood (Header):** Erweiterte Entdeckung, teils versteckt.

**Gefühl:** Reichhaltig, aber **zwei Entdeckungswelten** nebeneinander. Home wirkt eher wie ein kuratiertes Magazin — schön, aber näher an Marktplatz-Logik als der Feed.

---

### Phase 7: Erste Interaktion

Typischer Flow:
1. Profil eines Menschen öffnen (aus Feed oder Home)
2. Lesen, Merken, Verbinden oder Chat starten
3. Optional: Mood setzen, Story ansehen

**Copy auf öffentlichen Profilen:** Menschlich, pillar-basiert.  
**Reibung:** „Follower" vs. „Verbindungen" — Registry sagt Verbindungen, Notifications zeigen teils „Neuer Follower".

---

### Phase 8: Erste Resonanz

HUI hat **drei Resonanz-Oberflächen**:

| Oberfläche | Zugang | Funktion |
|------------|--------|----------|
| **Resonanzzentrum** | Header-Glocke | Benachrichtigungen (Buchungen, Nachrichten, Freigaben) |
| **Meine Resonanz** | Profil → Schnellzugriff | Persönliche Timeline (Unterstützung, Werke, Erlebnisse, Impact, Buchungen) |
| **Chat-Leerzustand** | Header-Nachrichten | *„Dieser Raum sammelt noch Resonanz."* |

**Erstnutzer-Erfahrung:** Nach erster Interaktion landet Resonanz oft im Resonanzzentrum (passiv) — nicht in „Meine Resonanz" (aktiv-reflektierend). Die emotionale Bedeutung von „Resonanz" wird **nicht erklärt**, nur impliziert.

---

### Phase 9: Erste Buchung

**Zwei parallele Wege (erlebbar inkonsistent):**

| Weg | Flow | Nutzererlebnis |
|-----|------|----------------|
| **Kanonisch** | Werk/Erlebnis → Werkekorb → UnterstützenFlow → Stripe → Danke-Screen | Klar, 2 Schritte, Impact-Karte sichtbar |
| **Legacy** | DiscoverPage Erlebnis → ExperienceBookingFlow | Anfrage ohne Zahlung, Status „Ausstehend" |

**Stärke im kanonischen Flow:**
- Impact-Karte: *„Von deiner Unterstützung investiert HUI zusätzlich X € in den gemeinsamen Impact Pool."*
- Danke-Screen mit Teal-Partikeln — Wirkung, nicht Transaktion

**Reibung:**
- Werkekorb-Button schwebt über Tabbar — kann übersehen werden
- Erlebnis aus Home nutzt anderen Flow als Werk aus Feed
- Nach Buchung: wohin? Resonanzzentrum vs. Meine Resonanz — keine sanfte Führung

---

### Phase 10: Erste Empfehlung

**Als Empfohlener (über Ambassador-Link):**
- Login/Register mit vorausgefülltem Ref-Link
- `processReferralForUser` im Hintergrund — **unsichtbar** für den Nutzer
- Kein Moment der Dankbarkeit oder Verbindung zum Empfehlenden

**Als Empfehlender (Ambassador):**
- Zugang über Profil / HUI Studio
- Eigene Referral-Links, Statistiken (aktiv/schlafend)
- Fühlt sich eher wie ein **Programm** als wie „Wirkung entfalten"

**Registry-Sprache:** `recommend` → *„Wirkung entfalten"* — im UI teils „Kundenstimmen" (RecommendationsSection).

---

### Phase 11: Rückkehr zur App

**Positiv:**
- Tab-Persistenz via `sessionStorage`
- Begrüßung mit Tageszeit und Name
- Chat bleibt über Tab-Wechsel erhalten

**Negativ:**
- MeinHUI zeigt bei Rückkehr ggf. weiterhin **statische Demo-Werte** (134 Tage, 47 Verbindungen, „Du hast Jana unterstützt")
- Entdecken und Home liefern unterschiedliche „Heute auf HUI"-Stats — Verwirrung bei wiederholter Nutzung

---

## Aufgabe 2 — Übergangsanalyse

Für jeden Wechsel: natürlich? orientiert? Bruch? Sackgasse? unnötige Schritte? doppelte Entscheidungen?

### Einstieg

| Übergang | Natürlich | Orientierung | Bruch | Sackgasse | Unnötig | Doppelt |
|----------|-----------|--------------|-------|-----------|---------|---------|
| Splash → Register/Login | ✅ | ✅ | — | — | — | — |
| Login → /Home | ✅ | ⚠️ | — | — | — | — |
| /Home → WelcomeOverlay | ✅ | ✅ | — | — | — | — |
| Welcome → Feed | ✅ | ⚠️ | Leicht | — | — | — |
| Welcome → ProfileCompletion | ⚠️ | ✅ | **Ja** | — | **Ja** | **Ja** (2× Willkommen) |

**Anmerkung:** Zwei Onboarding-Wellen (Welcome + Profil) sind einzeln schön, zusammen ein **Rhythmusbruch**.

---

### Tab-Navigation

| Übergang | Natürlich | Orientierung | Bruch | Sackgasse | Unnötig | Doppelt |
|----------|-----------|--------------|-------|-----------|---------|---------|
| Entdecken ↔ Home | ⚠️ | ❌ | **Ja** | — | **Ja** | **Ja** (2× Entdecken) |
| Beliebiger Tab → Profil (Overlay) | ✅ | ✅ | Leicht | — | — | — |
| Tab → Impact | ✅ | ✅ | — | — | — | — |
| Orb-Tap → MeinHUI | ✅ (Animation) | ⚠️ | **Ja** (Erwartung vs. Realität) | — | — | — |
| Orb-Tap (Basis-User) → MeinHUI statt Membership | ❌ | ❌ | **Kritisch** | — | — | — |

**Kernproblem NAV-001:** Tab `feed` = Label „Entdecken", Tab `discover` = Label „Home" — aber DiscoverPage-Titel heißt ebenfalls **„Entdecken"**. Der Nutzer hat zwei „Entdecken"-Erfahrungen und ein „Home", das nicht das Zuhause-Gefühl liefert.

---

### Overlays & Header

| Übergang | Natürlich | Orientierung | Bruch | Sackgasse | Unnötig | Doppelt |
|----------|-----------|--------------|-------|-----------|---------|---------|
| Header → Resonanzzentrum | ✅ | ⚠️ | — | — | — | vs. Meine Resonanz |
| Header → Chat | ✅ | ✅ | Chat nicht in Tabbar | — | — | — |
| Feed → Profil → zurück | ✅ | ✅ | — | — | — | — |
| Feed → Werkekorb → Checkout | ⚠️ | ⚠️ | Commerce-Feeling | — | — | — |
| Discover → ExperienceBooking vs. Werkekorb | ❌ | ❌ | **Ja** | — | **Ja** | **Ja** |
| Profil → HUI Studio (embedded) vs. /studio (Route) | ⚠️ | ⚠️ | **Ja** | — | **Ja** | **Ja** |
| Impact-Tab offen + Chat offen | ⚠️ | ⚠️ | Leicht | — | — | — |

---

### Commerce & Wirkung

| Übergang | Natürlich | Orientierung | Bruch | Sackgasse | Unnötig | Doppelt |
|----------|-----------|--------------|-------|-----------|---------|---------|
| Kauf → Danke → ??? | ✅ → ❌ | ❌ | Nach Zahlung Orientierungsloch | **Ja** | — | — |
| Buchung → Resonanzzentrum-Benachrichtigung | ✅ | ⚠️ | — | — | — | — |
| Membership-Flow (Orb, Basis-User) | — | — | **Nicht erreichbar** über Standard-Orb-Tap | **Ja** | — | — |

---

## Aufgabe 3 — Emotionale Analyse je Hauptbereich

### Entdecken (Tab `feed` — UnifiedFeed)

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | Willkommen, nicht überflutet. Morgengruß schafft Intimität. |
| **Was versteht er sofort?** | Hier passiert etwas in der Community — heute, live. |
| **Was bleibt unklar?** | Warum gibt es noch einen „Home"-Tab? Was unterscheidet Feed-Karten von Home-Sektionen? |
| **Motivation** | Neugier auf Menschen und Erlebnisse; persönliche Ansprache |
| **Unsicherheit** | Leerer Feed bei wenig Content; Stats zeigen „0" ohne erklärenden Kontext |
| **Vertrauen** | Hoch durch Ton und Design; sinkt bei offensichtlich generischen Karten |
| **Identitätsverlust** | Wenn Engagement-Zahlen (Likes) visuell dominieren — selten, aber möglich |

---

### Home (Tab `discover` — DiscoverPage)

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | Staunen über Vielfalt — Menschen, Werke, Orte, Projekte |
| **Was versteht er sofort?** | HUI ist lebendig; es gibt viel zu erkunden |
| **Was bleibt unklar?** | Seitentitel „Entdecken" bei Tab-Label „Home"; Live-Aktivitätsleiste (Demo vs. echt) |
| **Motivation** | Horizontale Sektionen laden zum Stöbern ein |
| **Unsicherheit** | Katalog-Dichte; View-Toggle (Karten/Liste) ohne Erklärung |
| **Vertrauen** | Demo-Aktivitäten (Sarah, Jonas, Anna) untergraben Vertrauen wenn erkannt |
| **Identitätsverlust** | **Hoch** — Sektions-Logik („Alle Werke", Preise, Erlebnis-Grid) nähert sich Marktplatz/Dashboard |

---

### Mein HUI (Orb-Overlay)

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | Ehrfurcht — cinematischer Wirkungsraum, Orb atmet, Inhalte bauen sich organisch auf |
| **Was versteht er sofort?** | Das ist *mein* Raum; die fünf Grundpfeiler sind greifbar |
| **Was bleibt unklar?** | Sind „134 Tage", „47 Menschen", „Du hast Jana unterstützt" echt? (Nein — Platzhalter) |
| **Motivation** | Grundpfeiler-Karten inspirieren zu Verbinden, Unterstützen, Erschaffen |
| **Unsicherheit** | **Sehr hoch** bei Demo-Daten — Nutzer fühlt sich belogen oder verwirrt |
| **Vertrauen** | Design erzeugt Vertrauen; Inhalt zerstört es |
| **Identitätsverlust** | Gamification-Ästhetik bei Info-Karten (🔥 Impact gesät, 23 Impulse) — widerspricht Constitution Regel 8 |

---

### Meine Resonanz (Profil → Timeline)

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | Stolz, Rückblick, Ruhe — „Apple Journal, nicht Amazon Orders" |
| **Was versteht er sofort?** | Das ist meine Geschichte auf HUI |
| **Was bleibt unklar?** | Unterschied zu Resonanzzentrum; wann Einträge erscheinen |
| **Motivation** | Eigene Wirkung sichtbar machen |
| **Unsicherheit** | Leerer Zustand ohne emotionale Führung |
| **Vertrauen** | **Sehr hoch** — echte Daten, ehrliche Status-Labels |
| **Identitätsverlust** | Gering — stärkster Identitätsträger nach Constitution |

---

### Impact (Tab)

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | Sinn, Gemeinschaft, Hoffnung — *„Gemeinsam Wirkung schaffen"* |
| **Was versteht er sofort?** | Buchungen finanzieren Herzensprojekte |
| **Was bleibt unklar?** | 6-Schritte-Zyklus, Pool-Aufteilung (40/30/20/10), Abstimmungslogik |
| **Motivation** | Beitrag zu etwas Größerem |
| **Unsicherheit** | Komplexität; leerer Pool; keine aktiven Projekte |
| **Vertrauen** | Hoch bei Transparenz-Intent; sinkt bei leerem Zustand |
| **Identitätsverlust** | Wenn Budget-Charts dominieren → NGO-Dashboard |

---

### Profil (Tab `creator` — MyBasisProfile)

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | *„Ich gestalte meine Präsenz"* — Ownership, nicht Performance |
| **Was versteht er sofort?** | Das bin ich; hier kann ich mich zeigen |
| **Was bleibt unklar?** | Talent vs. Basis; wann HUI Studio erscheint; Tiefe der Sektionen |
| **Motivation** | Profil pflegen, Meine Resonanz öffnen, Werke/Erlebnisse teilen |
| **Unsicherheit** | Viele Sektionen für Erstnutzer; Sichtbarkeitsoptionen |
| **Vertrauen** | Hoch — persönlich, editierbar, warm |
| **Identitätsverlust** | „Kundenstimmen" mit Sternen — klassisches Marktplatz-Muster |

---

### HUI Studio

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | Professionalität, Werkzeugkasten |
| **Was versteht er sofort?** | Hier verwalte ich mein Schaffen und meine Wirkung |
| **Was bleibt unklar?** | Zwei Einstiege (Profil-Embed vs. `/studio`-Route); Reichweite/Statistiken |
| **Motivation** | Für Talente: Erschaffen und Wertschöpfen |
| **Unsicherheit** | Dashboard-Dichte; Begriffe wie „Reichweite", „Einnahmen" |
| **Vertrauen** | Mittel — funktional, weniger emotional |
| **Identitätsverlust** | **Hoch** — klassisches Creator-Dashboard; Constitution-Regel 2 (keine Reichweite als Qualität) gefährdet |

---

### Chat (Header-Overlay)

| Frage | Antwort |
|-------|---------|
| **Was fühlt der Nutzer?** | Ruhe, Qualität — *„Echte Gespräche. Echte Verbindung."* |
| **Was versteht er sofort?** | Hier spreche ich mit Menschen |
| **Was bleibt unklar?** | Wo Chat lebt (kein Tab); Unterschied Buchungsgespräch / normal |
| **Motivation** | Verbindung vertiefen |
| **Unsicherheit** | Leerer Zustand; wie Gespräch starten (Compose-Button) |
| **Vertrauen** | Hoch durch Copy; mittel durch Entdeckbarkeit |
| **Identitätsverlust** | Gering — Atmosphäre passt zu HUI |

---

## Aufgabe 4 — HUI-Identitätsprüfung (6 Prinzipien)

| Prinzip | Stärkste Bereiche | Schwächste Bereiche |
|---------|-------------------|---------------------|
| **Wirkung statt Aufmerksamkeit** | Impact, Meine Resonanz, Welcome | Home Live-Bar, Feed-Stats „Heute auf HUI", Studio Reichweite |
| **Mensch statt Algorithmus** | Feed-Begrüßung, Profile, Chat | DiscoverPage-Sektions-Ranking (implizit), Demo-Aktivitäten |
| **Resonanz statt Reichweite** | Meine Resonanz, Resonanzzentrum-Copy | MeinHUI „47 Menschen", Ambassador-Statistiken, „Kundenstimmen" |
| **Qualität statt Quantität** | Pillar-Cards, Constitution-Sprache | MeinHUI Zahlen-Badges, Impact-Stats, Follower-Notifications |
| **Ruhe statt Überforderung** | Login, Welcome, Chat, Checkout-Danke | Home (8+ Sektionen), Profil (viele Sektionen), Studio |
| **Orientierung statt Ablenkung** | Feed-Missionszeile, Impact-Hero | Entdecken/Home-Doppelung, 3× Resonanz, Orb-Erwartung |

### Bereichs-Matrix (1–5, 5 = volle HUI-Identität)

| Bereich | Wirkung | Mensch | Resonanz | Qualität | Ruhe | Orientierung | **Ø** |
|---------|---------|--------|----------|----------|------|--------------|-------|
| Entdecken (Feed) | 4 | 4 | 3 | 4 | 4 | 3 | **3.7** |
| Home | 3 | 3 | 2 | 3 | 2 | 2 | **2.5** |
| Mein HUI | 4 | 3 | 2 | 2 | 5 | 3 | **3.2** |
| Meine Resonanz | 5 | 5 | 5 | 5 | 5 | 4 | **4.8** |
| Impact | 5 | 4 | 4 | 4 | 3 | 3 | **3.8** |
| Profil | 4 | 5 | 4 | 4 | 3 | 4 | **4.0** |
| HUI Studio | 3 | 3 | 2 | 3 | 2 | 3 | **2.7** |
| Chat | 4 | 5 | 4 | 4 | 5 | 3 | **4.2** |

---

## Aufgabe 5 — Produktfluss: Eine Geschichte oder mehrere Apps?

### Was zusammenhängend wirkt

```
Ankommen (Login/Welcome) → Entdecken (Feed) → Mensch finden → Verbinden (Chat/Profil)
                                                              ↓
                                              Unterstützen (Checkout) → Impact Pool
                                                              ↓
                                              Meine Resonanz (Rückblick)
```

Die **emotionale Storyline** existiert in der Copy und Constitution. Die Grundpfeiler durchziehen MeinHUI, Registry und Impact.

### Wo es wie mehrere Apps wirkt

1. **„Entdecken-App" + „Home-Katalog-App"** — zwei Discovery-Paradigmen
2. **„Social-Feed-App"** (Entdecken) vs. **„Creator-Dashboard-App"** (Studio) — Bruch bei Talent-Freischaltung
3. **„Shop-App"** (Werkekorb/Stripe) vs. **„Anfrage-App"** (ExperienceBookingFlow legacy)
4. **„Benachrichtigungs-App"** (Resonanzzentrum) vs. **„Tagebuch-App"** (Meine Resonanz) — gleiches Wort, andere Welten
5. **„Orb-Kompass"** (dokumentiert, OrbCompass.jsx existiert) vs. **„Wirkungsraum"** (MeinHUI, tatsächlich gerendert) — interne Divergenz

**Fazit:** Für den Nutzer fühlt sich HUI zu **60–70 % wie eine Plattform** an. Die restlichen 30–40 % sind **parallele Apps**, die durch Naming und Flow-Inkonsistenzen getrennt wirken.

---

## Aufgabe 6 — Reibungspunkte (vollständig)

### Zögern

| Stelle | Warum |
|--------|-------|
| Tab Entdecken vs. Home | Nutzer weiß nicht, welchen er braucht |
| Orb-Tap (Erstnutzer) | Erwartet Kompass/Membership, sieht Wirkungsraum mit fremden Zahlen |
| Ambassador-Feld bei Registrierung | Unbekannter Begriff |
| Sichtbarkeit im Profil (öffentlich/Verbindungen/privat) | Konsequenzen unklar |
| Impact-Abstimmung | Regeln nicht auf einen Blick |

### Verwirrung

| Stelle | Warum |
|--------|-------|
| DiscoverPage-Titel „Entdecken" bei Tab „Home" | Direkter Widerspruch |
| Resonanz / Resonanzzentrum / Meine Resonanz | Drei Konzepte, ein Wort |
| Demo-Daten in MeinHUI und Home Live-Bar | Echt vs. nicht echt |
| Zwei Checkout-Wege für Erlebnisse | Inkonsistentes Ergebnis |
| HUI Studio: zwei Einstiege | Welcher ist „richtig"? |
| Follower vs. Verbindungen | Terminologie-Drift |

### Nachdenken müssen

| Stelle | Warum |
|--------|-------|
| Nach erstem Kauf | Wohin? Was passiert jetzt? |
| Nach Welcome-Feature-Liste | Was ist der erste sinnvolle Schritt? |
| Talent vs. Basis-User | Unsichtbare Rollenlogik |
| Impact-Pool-Aufteilung | Finanzlogik ohne Story |

### Warten müssen

| Stelle | Warum |
|--------|-------|
| Auth-Loader (bis 25s) | Angst bei langsamer Verbindung |
| Stripe Payment Intent | Technische Wartezeit |
| Profil-/Feed-Laden | Skeleton-Phasen |
| Buchungsanfrage (Legacy) | Kein Zahlungs-Feedback, nur „Ausstehend" |

### Nicht wissen, was als Nächstes passiert

| Stelle | Warum |
|--------|-------|
| Nach Registrierung | Welcome? Profil? Feed? — Kette nicht kommuniziert |
| Nach Membership-Flow | Was hat sich geändert? |
| Nach Impact-Stimme | Ergebnis wann? |
| Buchungsgespräch vs. normaler Chat | Keine erklärende Trennung im UI |

---

## Aufgabe 7 — Positive Momente (Stärken)

### Außergewöhnlich gut

1. **Login-Splash** — Atmosphäre, Copy, ruhige CTAs. Sofortige HUI-DNA.
2. **WelcomeOverlay** — Emotionales Highlight der gesamten Journey. Einladend, nicht verkaufend.
3. **Login/Register-Copy** — Jeder Modus hat eigene, warme Stimme (*„Manchmal hilft ein neuer Anfang."*).
4. **FeedWelcomeHeader** — Personalisierte Begrüßung mit Missionszeile; fühlt sich nach Zuhause an.
5. **MeinHUI-Animation** — Choreografie (Orb → Begrüßung → Karten → Pfeiler) ist **Weltklasse** in Ruhe und Qualität.
6. **Grundpfeiler-Darstellung** — In MeinHUI und Constitution: klare Seele der Plattform.
7. **Meine Resonanz** — Journal-Ansatz, Filter, Status-Labels. Vorbildlich für „Wirkung statt Aufmerksamkeit".
8. **UnterstützenFlow** — Impact-Karte + Danke-Screen verbinden Kauf mit Sinn.
9. **Chat-Atmosphäre** — *„Echte Gespräche. Echte Verbindung."* + Leerzustand *„Dieser Raum sammelt noch Resonanz."*
10. **Impact-Hero** — *„Gemeinsam Wirkung schaffen"* — emotionale Spitze der ökonomischen Mechanik.
11. **Profil als Gestaltungsraum** — *„Ich gestalte meine Präsenz"* statt Profil-Score.
12. **HUI Constitution + Registry** — Semantische Konsistenz als Fundament (auch wenn UI noch nicht überall folgt).
13. **Keine Gamification** — In den meisten Flows konsequent; Feed ohne aggressive Reaktions-UX.
14. **ProfileCompletionFlow** — Sanft, Schritt-für-Schritt, menschliche Fragen.
15. **Resonanzzentrum-Tabs** (Wichtig / Relevant / Informativ) — Entlastet statt Alarm zu schlagen.

---

## Aufgabe 8 — Empfehlungen

> Ausschließlich Verbesserungen, die Vision stärken, Orientierung verbessern, Vertrauen erhöhen und emotionale Qualität steigern. **Keine Feature-Wünsche. Keine technischen Refactorings.**

### R1 — Echtheit im Wirkungsraum (KRITISCH)

**Problem:** MeinHUI zeigt statische Werte („134 Tage", „47 Menschen", „Du hast Jana unterstützt").  
**Empfehlung:** Leere oder echte Zustände zeigen. Lieber: *„Dein Wirkungsraum wächst mit jeder echten Begegnung"* als fremde Zahlen.  
**Wirkung:** Vertrauen, Identität (Qualität statt Quantität, Orb zeigt keine Leistung).

---

### R2 — Semantische Klarheit Entdecken / Home (HOCH)

**Problem:** Zwei Tabs, beide fühlen sich wie Entdeckung an; DiscoverPage heißt „Entdecken".  
**Empfehlung:** DiscoverPage-Titel und Subline an Tab-Label „Home" anpassen — z. B. *„Dein HUI"* / *„Alles an einem Ort"* / *„Die Welt von HUI"* — ohne Tab-Namen zu ändern. Jede Oberfläche braucht **einen Satz**, der den Unterschied erklärt.  
**Wirkung:** Orientierung, Ruhe.

---

### R3 — Resonanz-Sprache entwirren (HOCH)

**Problem:** Resonanzzentrum, Meine Resonanz, Chat-Resonanz — ein Wort, drei Räume.  
**Empfehlung:** Je **ein erklärender Halbsatz** beim ersten Besuch jedes Raums:
- Resonanzzentrum: *„Hier erreicht dich, was deine Aufmerksamkeit braucht."*
- Meine Resonanz: *„Hier siehst du, was du bewegt hast."*  
**Wirkung:** Orientierung, Vertrauen.

---

### R4 — Onboarding-Rhythmus vereinen (MITTEL)

**Problem:** Welcome + Profil-Completion = doppeltes Ankommen.  
**Empfehlung:** ProfileCompletion nach Welcome **inhaltlich anschließen** — kein zweites „Willkommen bei HUI", sondern *„Lass uns dich ein wenig kennenlernen"* als nahtloser dritter Akt desselben Kapitels.  
**Wirkung:** Emotionale Qualität, Ruhe.

---

### R5 — Orb-Erwartung für Basis-Nutzer erfüllen (HOCH)

**Problem:** Basis-User tappen Orb → sehen MeinHUI mit Demo-Daten; Membership-Flow ist über Action-System vorgesehen, aber Bottom-Nav umgeht es.  
**Empfehlung:** Für Nutzer ohne Talent entweder Membership-Flow **oder** ehrlichen leeren Wirkungsraum mit Einladung — niemals fremde Geschichten (Jana).  
**Wirkung:** Vertrauen, Mensch statt Algorithmus.

---

### R6 — Ein Checkout-Gefühl (MITTEL)

**Problem:** Erlebnis aus Home → Legacy-Anfrage; Werk aus Feed → Stripe.  
**Empfehlung:** Nutzer soll **ein** emotionales Checkout-Erlebnis haben — gleiche Sprache (*„Unterstützen"*, Impact-Karte, Danke-Moment) unabhängig vom Einstieg.  
**Wirkung:** Zusammenhängende Geschichte, Vertrauen.

---

### R7 — Nach dem Kauf orientieren (MITTEL)

**Problem:** Nach Zahlung endet die Geschichte.  
**Empfehlung:** Danke-Screen mit **einem** sanften nächsten Schritt: *„Deine Resonanz findest du in Meine Resonanz"* (mit emotionaler, nicht technischer Beschreibung).  
**Wirkung:** Orientierung, Wirkung statt Transaktion.

---

### R8 — Demo-Inhalte kenntlich machen oder entfernen (HOCH)

**Problem:** LIVE_ACTIVITIES in DiscoverPage, MeinHUI-Platzhalter.  
**Empfehlung:** Wenn kein Live-Content: ehrliche Leerzustände (*„HUI erwacht gerade — du kannst einer der Ersten sein, der hier wirkt"*).  
**Wirkung:** Vertrauen, Qualität.

---

### R9 — Studio-Sprache entschärfen (MITTEL)

**Problem:** „Reichweite", Dashboard-Gruppierung wirken wie Creator-Plattform.  
**Empfehlung:** Registry-Sprache konsequent: Reichweite → *„Wirkung sichtbar machen"*; Zahlen nur dem Nutzer selbst, nie als Vergleich.  
**Wirkung:** Identität, Wirkung statt Aufmerksamkeit.

---

### R10 — Erster Schritt nach Welcome (MITTEL)

**Problem:** Feature-Liste ohne Handlungsaufforderung.  
**Empfehlung:** Welcome-CTA optional präzisieren: *„HUI entdecken"* → Subtext *„Beginne im Feed — Menschen warten nicht, aber sie sind da."* Oder sanfte Highlight-Führung zum ersten Profil/Moment — **ohne** Tutorial-Gamification.  
**Wirkung:** Orientierung.

---

### R11 — Ambassador-Moment sichtbar machen (NIEDRIG)

**Problem:** Referral passiert unsichtbar.  
**Empfehlung:** Wenn Nutzer über Empfehlung kam: ein warmer, einmaliger Moment *„Du wurdest von {Name} eingeladen"* — keine Statistik, nur Mensch.  
**Wirkung:** Mensch statt Algorithmus, Verbinden.

---

### R12 — „Kundenstimmen" → HUI-Sprache (NIEDRIG)

**Problem:** RecommendationsSection nutzt Marktplatz-Begriff.  
**Empfehlung:** Umbenennung zu *„Stimmen"* oder *„Was andere über die Begegnung sagen"* — Registry-konform.  
**Wirkung:** Identität.

---

## Priorisierung

| Prio | ID | Empfehlung | Bereich | Impact auf Erstnutzer | Aufwand (inhaltlich) |
|------|----|------------|---------|----------------------|----------------------|
| 🔴 P0 | R1 | Echtheit im Wirkungsraum | Mein HUI | Sehr hoch | Gering (Copy/Zustände) |
| 🔴 P0 | R8 | Demo-Inhalte entfernen/kenntlich | Home, Mein HUI | Sehr hoch | Gering |
| 🔴 P0 | R5 | Orb-Erwartung Basis-Nutzer | Mein HUI / Membership | Hoch | Mittel (Flow-Entscheidung) |
| 🟠 P1 | R2 | Entdecken/Home semantisch trennen | Home, Entdecken | Hoch | Gering (Copy) |
| 🟠 P1 | R3 | Resonanz-Sprache entwirren | Resonanz, Chat, Notifs | Hoch | Gering |
| 🟠 P1 | R6 | Ein Checkout-Gefühl | Commerce | Mittel | Mittel (Flow-Vereinheitlichung) |
| 🟡 P2 | R4 | Onboarding-Rhythmus | Welcome, Profil | Mittel | Gering |
| 🟡 P2 | R7 | Nach Kauf orientieren | Commerce | Mittel | Gering |
| 🟡 P2 | R10 | Erster Schritt nach Welcome | Welcome | Mittel | Gering |
| 🟢 P3 | R9 | Studio-Sprache | HUI Studio | Niedrig (Talente) | Gering |
| 🟢 P3 | R11 | Ambassador-Moment | Login | Niedrig | Gering |
| 🟢 P3 | R12 | Kundenstimmen-Sprache | Profil | Niedrig | Gering |

---

## Orientierung — Sollbild (für Menschen, nicht für Entwickler)

```
                    ┌─────────────────────────────────────┐
                    │           ANKOMMEN                   │
                    │  Splash → Login → Welcome → Profil   │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
   ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
   │  ENTDECKEN  │            │    HOME     │            │    ORB      │
   │  (Feed)     │            │  (Browse)   │            │ (Mein HUI)  │
   │  Was passiert│            │ Was gibt es │            │ Wer bin ich │
   │  heute?     │            │  auf HUI?   │            │  & wirke?   │
   └──────┬──────┘            └──────┬──────┘            └──────┬──────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │         BEGEGNUNG & WIRKUNG          │
                    │  Profil · Chat · Unterstützen · Impact│
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │           RÜCKBlick                  │
                    │  Meine Resonanz · Resonanzzentrum    │
                    └─────────────────────────────────────┘
```

Jeder Bereich braucht **einen mentalen Satz** — nicht mehr.

---

## Vertrauen — Kurzbilanz

| Vertrauens-Aufbau | Vertrauens-Abbau |
|-------------------|------------------|
| Warme, ehrliche Copy | Demo-Daten als echte Daten |
| Impact-Transparenz-Intent | Zwei Checkout-Welten |
| Meine Resonanz (echte Timeline) | Zahlen-Badges in MeinHUI |
| Stripe + Impact-Karte | Leere Impact-Seite ohne Erklärung |
| Soft Onboarding | Doppel-Onboarding |
| Constitution-Kohärenz | Marktplatz-Sprache (Kundenstimmen, Reichweite) |

---

## Identität — Kurzbilanz

**HUI fühlt sich am meisten wie HUI an:**
Welcome · Feed-Begrüßung · Meine Resonanz · Impact-Hero · Chat · Profil-Gestaltung · Checkout-Danke

**HUI fühlt sich am wenigsten wie HUI an:**
Home-Katalog-Dichte · Studio-Dashboard · Demo-MeinHUI · Ambassador-Statistiken · Legacy-Buchungsanfrage · Kundenstimmen-Sterne

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Vollständige User Journey analysiert | ✅ |
| Keine Codeänderungen | ✅ |
| Keine UI-Änderungen | ✅ |
| Keine neuen Features | ✅ |
| Fokus ausschließlich menschliche Erfahrung | ✅ |
| Dokumentation vollständig | ✅ |

---

*Dieser Audit basiert auf der Codebase zum Stand 2026-07-01 (Commit `58460534`). Er bewertet beabsichtigtes Nutzererleben anhand von UI-Copy, Flow-Logik und Produktphilosophie (HUI_CONSTITUTION.md, HuiRegistry.js) — nicht Runtime-Tests auf Live-Daten.*

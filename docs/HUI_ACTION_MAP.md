# HUI ACTION MAP — Phase 1A Audit
**Erstellt:** 2026-05-24  
**Status:** Vollständiges Plattform-Audit aller interaktiven Elemente  
**Zweck:** Nervensystem-Kartierung vor Phase 1B Migration

---

## ÜBERSICHT / SCORES

| Metrik | Wert |
|---|---|
| **Interaktive Elemente gesamt** | ~127 |
| **Bereits auf HUI_ACTIONS migriert** | 22 (~17%) | ✅ Batch 1+2 done |
| **Legacy setState / direkte Calls** | 77 (~61%) |
| **Dead / Placeholder** | 18 (~14%) |
| **Missing Backend** | 10 (~8%) |
| **Migration Score** | **17% — Batch 1+2 ✅ / Batch 3 next** |

---

## LEGENDE — STATUS SYSTEM

| Status | Bedeutung |
|---|---|
| `working` | Funktioniert vollständig, End-to-End |
| `partial` | Öffnet etwas, aber Flow unvollständig |
| `dead` | Klickbar, kein Effekt |
| `placeholder` | Reine UI ohne Funktion |
| `disabled` | Bewusst deaktiviert |
| `missing_backend` | UI vorhanden, Daten/Logik fehlt |
| `missing_flow` | Zielscreen fehlt |
| `legacy` | Nutzt setState/navigate direkt |
| `migrated` | Nutzt HUI_ACTIONS ✅ |

---

## 1. BOTTOM NAVIGATION

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Global | Tab: Feed | Tab | `A.GO_TO_TAB` via actions | `A.GO_HOME` | `migrated ✅` | — | — |
| Global | Tab: Entdecken | Tab | `A.GO_TO_TAB` via actions | `A.GO_DISCOVER` | `migrated ✅` | — | — |
| Global | Tab: Impact | Tab | `A.GO_TO_TAB` via actions | `A.GO_IMPACT` | `migrated ✅` | — | — |
| Global | Tab: Favoriten | Tab | `A.GO_TO_TAB` via actions | `A.GO_FAVORITES` | `migrated ✅` | — | — |
| Global | Tab: Profil | Tab | `A.OPEN_OWN_PROFILE` via actions | `A.OPEN_OWN_PROFILE` | `migrated ✅` | — | — |
| Global | Orb-Button (Mitte) | FloatingAction | `A.OPEN_ORB` via actions | `A.OPEN_ORB` | `migrated ✅` | — | — |

---

## 2. HOME FEED

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Feed | Story Ring / Bubble | Card | `onStory?.(s)` → StoryBar.onStoryClick | `A.OPEN_STORY` | `partial` | `A.OPEN_STORY` | Action definieren |
| Feed | Story "+" (neues teilen) | Button | — | `A.OPEN_STORY_COMPOSER` | `dead` | `A.OPEN_STORY_COMPOSER` | Entrypoint fehlt |
| Feed | Creator Card (Avatar/Name) | Card | `A.OPEN_PROFILE` via handleProfile | `A.OPEN_PROFILE` | `migrated ✅` | — | — |
| Feed | Creator Card — "Folgen" | Button | `A.FOLLOW_CREATOR` via actions | `A.FOLLOW_CREATOR` | `migrated ✅` | — | Backend-Write noch pending |
| Feed | Creator Card — Resonanz-Button | Button | `A.SEND_RESONANCE` via handleResonanz | `A.SEND_RESONANCE` | `migrated ✅` | — | Backend-Write noch pending |
| Feed | Creator Card — "Inspiriert" | Button | `A.SEND_RESONANCE` via handleResonanz | `A.SEND_RESONANCE` | `migrated ✅` | — | Backend-Write noch pending |
| Feed | Creator Card — "Berührt" | Button | `A.SEND_RESONANCE` via handleResonanz | `A.SEND_RESONANCE` | `migrated ✅` | — | Backend-Write noch pending |
| Feed | Event Card | Card | `A.OPEN_EXPERIENCE` via handleEvent | `A.OPEN_EXPERIENCE` | `migrated ✅` | — | Experience-Zielscreen noch partial |
| Feed | Presence Person Card | Card | `A.OPEN_PROFILE` via handleProfile | `A.OPEN_PROFILE` | `migrated ✅` | — | — |
| Feed | "Mehr entdecken" CTA (Empty) | Button | `A.GO_DISCOVER` via handleDiscover | `A.GO_DISCOVER` | `migrated ✅` | — | — |
| Feed | EmptyState CTA "Teilen" | Button | `A.OPEN_STORY_COMPOSER` via handleShare | `A.OPEN_STORY_COMPOSER` | `migrated ✅` | — | — |
| Feed | Chat-Button im Header | Button | `setShowChat(true)` direkt | `A.OPEN_CHAT` | `legacy` | `A.OPEN_CHAT` | Migration |

---

## 3. ORB / PLUSSHEET

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Orb | Node: Teilen / Story | OrbNode | `onSelect("story")` → `setShowTeilen(true)` | `A.OPEN_STORY_COMPOSER` | `legacy` | `A.OPEN_STORY_COMPOSER` | Migration |
| Orb | Node: Werk erschaffen | OrbNode | `onSelect("werk")` → `setShowWerkPublisher(true)` | `A.OPEN_CREATE_FLOW` | `legacy` | `A.OPEN_CREATE_FLOW` | Migration |
| Orb | Node: Erlebnis öffnen | OrbNode | `onSelect("experience")` → `setShowExperienceCreator(true)` | `A.CREATE_EXPERIENCE` | `legacy` | `A.CREATE_EXPERIENCE` | Migration |
| Orb | Node: Verbindung | OrbNode | `onSelect("connect")` → `setShowConnect(true)` | `A.OPEN_CONNECT` | `legacy` | `A.OPEN_CONNECT` | Migration |
| Orb | Node: Wirkung starten | OrbNode | `onSelect("impact")` → `setShowImpactFlow(true)` | `A.OPEN_IMPACT_FLOW` | `legacy` | `A.OPEN_IMPACT_FLOW` | Migration |
| Orb | Orb Center Tap | Button | `handleOrbTap()` → OrbState intern | `A.OPEN_ORB` | `partial` | `A.OPEN_ORB` | Ist intern korrekt, Outer legacy |
| Orb | Backdrop Tap (schließen) | Gesture | `closeOrbWorld()` + `setShowPlusSheet(false)` | `A.CLOSE_ORB` | `legacy` | `A.CLOSE_ORB` | Migration |
| Orb | Basis-User Tap (kein Member) | Button | `setShowMembership(true)` | `A.OPEN_MEMBERSHIP` | `legacy` | `A.OPEN_MEMBERSHIP` | Action definieren |

---

## 4. VISITOR PROFILE (WirkerProfilePage)

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| VisitorProfile | "Erlebnis buchen" | CTA-Primary | `A.BOOK_EXPERIENCE` via actions | `A.BOOK_EXPERIENCE` | `migrated ✅` | — | — |
| VisitorProfile | "Nachricht senden" | CTA-Secondary | `A.OPEN_CHAT` via actions | `A.OPEN_CHAT` | `migrated ✅` | — | — |
| VisitorProfile | "Folgen" Toggle | Button | `setFollowed(f=>!f)` lokal only | `A.FOLLOW_CREATOR` | `partial` | `A.FOLLOW_CREATOR` | Kein Backend-Write, kein optimistic update |
| VisitorProfile | Stat: Erlebnisse | StatItem | Kein onClick | — | `placeholder` | Detail-View? | Tap-Ziel unklar |
| VisitorProfile | Stat: Menschen | StatItem | Kein onClick | — | `placeholder` | Community-View? | Tap-Ziel unklar |
| VisitorProfile | Stat: Resonanz | StatItem | Kein onClick | — | `placeholder` | — | Intentional? |
| VisitorProfile | Experience Card — "Mehr erfahren →" | Button | `onBook?.(exp)` | `A.BOOK_EXPERIENCE` | `partial` | `A.BOOK_EXPERIENCE` | onBook aus FloatingCTA kommt, exp-Detail fehlt |
| VisitorProfile | Experience Card (Card selbst) | Card | press-feedback only | `A.OPEN_EXPERIENCE` | `dead` | `A.OPEN_EXPERIENCE` | Kein onClick auf Card |
| VisitorProfile | Moment Card | Card | press-feedback only | `A.OPEN_MOMENT` | `dead` | `A.OPEN_MOMENT` | Action + Zielscreen fehlen |
| VisitorProfile | Community Row | ListItem | Kein onClick | — | `placeholder` | `A.OPEN_PROFILE` | Person-Tap fehlt |
| VisitorProfile | "Atelier live betreten →" | Link | Kein onClick | — | `dead` | `A.OPEN_ROOM` | Zielscreen fehlt |
| VisitorProfile | Floating "Erlebnis buchen" CTA | FloatingCTA | `onBook?.(profile, exp)` | `A.BOOK_EXPERIENCE` | `partial` | `A.BOOK_EXPERIENCE` | BookingFlow nicht voll implementiert |
| VisitorProfile | Share ⬆ Button | Button | Kein onClick | — | `dead` | `A.SHARE_MOMENT` | Handler fehlt |
| VisitorProfile | Menu ··· Button | Button | Kein onClick | — | `dead` | — | Optionsmenü fehlt |
| VisitorProfile | "Mehr über meine Reise →" | Link | Kein onClick | — | `dead` | `A.OPEN_WORLD` | Zielscreen unklar |
| VisitorProfile | "Mehr Wirkung ansehen →" | Link | Kein onClick | — | `dead` | `A.OPEN_IMPACT` | Navigation fehlt |
| VisitorProfile | "Alle Menschen ansehen →" | Link | Kein onClick | — | `dead` | `A.OPEN_COMMUNITY` | Zielscreen fehlt |
| VisitorProfile | "Alle Erlebnisse anzeigen →" | Link | Kein onClick | — | `dead` | `A.OPEN_EXPERIENCE` | Zielscreen fehlt |
| VisitorProfile | "Alle Momente ansehen →" | Link | Kein onClick | — | `dead` | — | Zielscreen fehlt |

---

## 5. OWNER PROFILE (CreatorProfilePage)

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| OwnerProfile | "← Zurück" | Button | `onClose()` | `A.CLOSE_PROFILE` | `partial` | `A.CLOSE_PROFILE` | Funktioniert, nicht migriert |
| OwnerProfile | "✏️ Bearbeiten" | Button | Kein onClick | — | `dead` | `A.OPEN_PROFILE_EDITOR` | Flow fehlt komplett |
| OwnerProfile | QuickAction: Neues Erlebnis | ActionPill | `A.CREATE_EXPERIENCE` via actions | `A.CREATE_EXPERIENCE` | `migrated ✅` | — | — |
| OwnerProfile | QuickAction: Raum öffnen | ActionPill | `A.OPEN_ROOM` via actions | `A.OPEN_ROOM` | `migrated ✅` | — | Zielscreen fehlt noch |
| OwnerProfile | QuickAction: Moment teilen | ActionPill | `A.OPEN_STORY_COMPOSER` via actions | `A.OPEN_STORY_COMPOSER` | `migrated ✅` | — | — |
| OwnerProfile | QuickAction: Community | ActionPill | `A.OPEN_COMMUNITY` via actions | `A.OPEN_COMMUNITY` | `migrated ✅` | — | — |
| OwnerProfile | QuickAction: Einnahmen | ActionPill | `() => {}` leer | — | `dead` | `A.OPEN_EARNINGS` | Flow + Screen fehlen |
| OwnerProfile | QuickAction: Kalender | ActionPill | `A.OPEN_CALENDAR` via actions | `A.OPEN_CALENDAR` | `migrated ✅` | — | CalendarView fehlt |
| OwnerProfile | QuickAction: Wirkung | ActionPill | `A.OPEN_IMPACT` via actions | `A.OPEN_IMPACT` | `migrated ✅` | — | — |
| OwnerProfile | QuickAction: Atelier | ActionPill | `A.OPEN_OWN_PROFILE` via actions | — | `migrated ✅` | — | Rekursiv — unklar |
| OwnerProfile | Experience Card | Card | press-feedback only | — | `dead` | `A.OPEN_EXPERIENCE` | Edit-Experience Flow fehlt |
| OwnerProfile | "Alle verwalten →" | Link | Kein onClick | — | `dead` | `A.OPEN_EXPERIENCE_MANAGER` | Screen fehlt |
| OwnerProfile | "Neues Erlebnis erstellen" | Card | Kein onClick | — | `dead` | `A.CREATE_EXPERIENCE` | Handler fehlt |
| OwnerProfile | Activity "Alle Aktivität →" | Link | Kein onClick | — | `dead` | — | Screen fehlt |
| OwnerProfile | Activity Items | ListItem | Kein onClick | — | `placeholder` | — | Tappable? |
| OwnerProfile | Wirkungskarte: Einnahmen | Card | Kein onClick | — | `placeholder` | `A.OPEN_EARNINGS` | Screen fehlt |
| OwnerProfile | Wirkungskarte: Menschen | Card | Kein onClick | — | `placeholder` | `A.OPEN_COMMUNITY` | Navigation fehlt |
| OwnerProfile | Wirkungskarte: Projekte | Card | Kein onClick | — | `placeholder` | `A.OPEN_IMPACT` | Navigation fehlt |
| OwnerProfile | Wirkungskarte: Resonanz | Card | Kein onClick | — | `placeholder` | — | — |
| OwnerProfile | World Portal | Circle | Hover only | — | `dead` | `A.OPEN_WORLD` | onClick fehlt |
| OwnerProfile | "Verwalten →" (Welten) | Link | Kein onClick | — | `dead` | — | Screen fehlt |
| OwnerProfile | Community Member Row | ListItem | Kein onClick | — | `placeholder` | `A.OPEN_PROFILE` | Handler fehlt |
| OwnerProfile | "Alle →" (Community) | Link | Kein onClick | — | `dead` | `A.OPEN_COMMUNITY` | — |
| OwnerProfile | "Dein Raum ist offen" Badge | Badge | Kein onClick | — | `placeholder` | — | Intentional? |

---

## 6. CHAT CENTER

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Chat | Conversation List öffnen | Entry | `setShowChat(true)` via Home | `A.OPEN_CHAT` | `legacy` | `A.OPEN_CHAT` | Migration in Home.jsx |
| Chat | Conversation Card tap | Card | `onOpen(conv)` → ConversationRoom | — | `working` | — | Intern korrekt |
| Chat | Header: Avatar tap | Button | `handleAvatarTap` → `openCreatorProfile` | `A.OPEN_PROFILE` | `partial` | `A.OPEN_PROFILE` | Nutzt useProfileLauncher (halbmigriert) |
| Chat | Header: "···" Menü | Button | `setMenuOpen` | — | `working` | — | Intern ok |
| Chat | Header: Menü → Profil ansehen | MenuItem | `onOpenProfile(conv)` | `A.OPEN_PROFILE` | `partial` | `A.OPEN_PROFILE` | useProfileLauncher (halbmigriert) |
| Chat | Header: Menü → Buchen | MenuItem | `setMenuOpen(false)` only | — | `dead` | `A.OPEN_BOOKING` | Handler fehlt komplett |
| Chat | Header: Menü → Archivieren | MenuItem | `setMenuOpen(false)` only | — | `dead` | — | Backend fehlt |
| Chat | Input: Senden | Button | `send()` → Supabase | — | `working` | — | Funktioniert |
| Chat | Input: Anhang "+" | Button | — | — | `missing_flow` | `A.SHARE_MOMENT` | Noch nicht implementiert |
| Chat | "Entdecken" (empty state) | Button | `onDiscover` → tab switch | `A.GO_DISCOVER` | `legacy` | `A.GO_DISCOVER` | Migration |
| Chat | Message Bubble: Long-press | Gesture | — | — | `missing_flow` | — | Reaktionen fehlen |

---

## 7. NOTIFICATION CENTER

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Notifs | Öffnen (Bell-Button) | Button | `setShowNotifs(true)` | `A.OPEN_NOTIFICATIONS` | `legacy` | `A.OPEN_NOTIFICATIONS` | Migration |
| Notifs | Notification Card tap | Card | `handleAction(n)` → `onNavigate` | `A.OPEN_PROFILE` / tab | `partial` | Diverse Actions | onNavigate → Actions migrieren |
| Notifs | Typ: Neue Resonanz | Card | `onNavigate({ type:"profile" })` | `A.OPEN_PROFILE` | `partial` | `A.OPEN_PROFILE` | Legacy navigate |
| Notifs | Typ: Neues Booking | Card | `onNavigate(...)` | `A.OPEN_BOOKING` | `partial` | `A.OPEN_BOOKING` | Legacy navigate |
| Notifs | Typ: Impact | Card | `onNavigate("impact")` | `A.OPEN_IMPACT` | `legacy` | `A.OPEN_IMPACT` | Migration |
| Notifs | Typ: Discover | Card | `onNavigate("discover")` | `A.GO_DISCOVER` | `legacy` | `A.GO_DISCOVER` | Migration |
| Notifs | Filter Pills | Pills | `onFilterChange(pill)` intern | — | `working` | — | Intern ok |
| Notifs | "Nur Wichtige" Toggle | Toggle | `setOnlyImportant` intern | — | `working` | — | Intern ok |
| Notifs | Empty State CTA | Button | `onDiscover → onClose` | `A.GO_DISCOVER` | `legacy` | `A.GO_DISCOVER` | Migration |
| Notifs | Settings ⚙️ | Button | `onSettings` — kein Handler | — | `dead` | — | Handler + Screen fehlen |

---

## 8. DISCOVER PAGE

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Discover | Hero Card tap | Card | `handleView(item)` → `onView(item)` → `setShowWirker(item)` | `A.OPEN_PROFILE` | `legacy` | `A.OPEN_PROFILE` | Migration |
| Discover | Werk Card tap | Card | `handleView(item)` → `onView(item)` → `setShowWirker(item)` | `A.OPEN_EXPERIENCE` | `legacy` | `A.OPEN_EXPERIENCE` | Migration + Ziel-Screen |
| Discover | Erlebnis Card tap | Card | `handleView(item)` → `onView(item)` | `A.OPEN_EXPERIENCE` | `legacy` | `A.OPEN_EXPERIENCE` | Migration |
| Discover | "Alle anzeigen →" | Button | `onView({type:"werke_liste"})` | — | `partial` | — | Zielscreen fehlt |
| Discover | Kategorie Pills | Pills | `setActiveCategory` intern | — | `working` | — | Intern ok |
| Discover | Suche (Search Button) | Button | `setShowSearch(true)` intern | — | `working` | — | Intern ok |
| Discover | Suchergebnis Card | Card | `handleView` | `A.OPEN_PROFILE` | `legacy` | `A.OPEN_PROFILE` | Migration |
| Discover | Karte Button | Button | `onMap()` → `setShowMap(true)` | `A.OPEN_MAP` | `legacy` | `A.OPEN_MAP` | Migration |
| Discover | Like ❤️ auf Card | Button | `setLiked` lokal | `A.FOLLOW_CREATOR` | `partial` | `A.FOLLOW_CREATOR` | Kein Backend |

---

## 9. IMPACT PAGE

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Impact | Projekt Card: Stimme geben | Button | `onVote?.(p.id)` | — | `partial` | `A.SEND_RESONANCE` | Supabase-Write vorhanden, Action fehlt |
| Impact | Projekt Card tap | Card | Kein onClick | — | `dead` | `A.OPEN_IMPACT` | Detail-View fehlt |
| Impact | "Projekt einreichen" CTA | Button | `onOpenFlow?.()` → `setShowImpactFlow` | `A.OPEN_IMPACT_FLOW` | `legacy` | `A.OPEN_IMPACT_FLOW` | Migration |
| Impact | Impact-Flow öffnen (Orb) | Flow | via OrbNode "impact" | `A.OPEN_IMPACT_FLOW` | `legacy` | `A.OPEN_IMPACT_FLOW` | Migration |
| Impact | Month selector | Pills | intern | — | `working` | — | Intern ok |
| Impact | Stats-Karten | Cards | kein onClick | — | `placeholder` | — | Intentional |

---

## 10. FAVORITES PAGE

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Favorites | Creator Card tap | Card | `onView(person)` → `setShowWirker(person)` | `A.OPEN_PROFILE` | `legacy` | `A.OPEN_PROFILE` | Migration |
| Favorites | Work Card tap | Card | `onView(work)` | `A.OPEN_EXPERIENCE` | `legacy` | `A.OPEN_EXPERIENCE` | Zielscreen unklar |
| Favorites | Experience Card tap | Card | `onView(exp)` | `A.OPEN_EXPERIENCE` | `legacy` | `A.OPEN_EXPERIENCE` | Migration |
| Favorites | Resonanz Button (❤️) | Button | `setResonated` lokal | `A.SEND_RESONANCE` | `partial` | `A.SEND_RESONANCE` | Kein Backend |
| Favorites | "Impact ansehen" CTA | Button | `onImpact` → `handleTab("impact")` | `A.OPEN_IMPACT` | `legacy` | `A.OPEN_IMPACT` | Migration |
| Favorites | "Entdecken" CTA (Empty) | Button | `onDiscover` | `A.GO_DISCOVER` | `legacy` | `A.GO_DISCOVER` | Migration |
| Favorites | Hero Card Details | Button | `onDetails?.(item)` | `A.OPEN_PROFILE` | `legacy` | `A.OPEN_PROFILE` | Migration |
| Favorites | Kategorie Pills | Pills | intern | — | `working` | — | Intern ok |

---

## 11. STORY / STORYBAR

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| StoryBar | Story Ring tap | Ring | `onStoryClick({group...})` | `A.OPEN_STORY` | `partial` | `A.OPEN_STORY` | Action definieren |
| StoryViewer | Weiter → | Gesture | `goNext()` intern | — | `working` | — | Intern ok |
| StoryViewer | ← Zurück | Gesture | `goPrev()` intern | — | `working` | — | Intern ok |
| StoryViewer | Profil-Avatar tap | Button | `onViewProfile(current)` | `A.OPEN_PROFILE` | `legacy` | `A.OPEN_PROFILE` | Migration |
| StoryViewer | Reaktion senden | Button | `handleReaction(r)` → lokal | `A.SEND_RESONANCE` | `partial` | `A.SEND_RESONANCE` | Kein Backend |
| StoryViewer | Antworten (Reply) | Button | `setReplyOpen(true)` + `sendReply` | — | `partial` | `A.SEND_MESSAGE` | Kein Backend |
| StoryViewer | Teilen | Button | `handleShare` (native share) | `A.SHARE_MOMENT` | `partial` | `A.SHARE_MOMENT` | Nutzt navigator.share direkt |
| StoryViewer | Schließen | Button | `onClose()` | — | `working` | — | Ok |
| StoryComposer | Veröffentlichen | Button | Supabase-Write direkt | — | `partial` | `A.SHARE_MOMENT` | Migration |

---

## 12. HEADER (HomeHeader)

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Header | 🔔 Notification Bell | Button | `A.OPEN_NOTIFICATIONS` via actions | `A.OPEN_NOTIFICATIONS` | `migrated ✅` | — | — |
| Header | 💬 Chat Button | Button | `A.OPEN_CHAT` via actions | `A.OPEN_CHAT` | `migrated ✅` | — | — |
| Header | Match Bar (🔍) | Input | `openOrbWorld` / interaktiv | — | `partial` | `A.OPEN_MATCH` | Teilweise ok |
| Header | Mood Orb | Button | `setActiveMood` | — | `working` | — | Intern ok |

---

## 13. BOOKING / CONNECTION FLOWS

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| ConnectionCreate | Step 1 Typ wählen | Step | intern | — | `working` | — | Intern ok |
| ConnectionCreate | Step 2 Details | Step | intern | — | `working` | — | Intern ok |
| ConnectionCreate | Step 3 Preview | Step | intern | — | `working` | — | Intern ok |
| ConnectionCreate | Veröffentlichen | Button | `onPublish` → `setShowConnect(false)` | — | `partial` | — | Backend? |
| ConnectionCreate | Schließen | Button | `onClose` | — | `working` | — | Ok |
| BookingFlow | "Erlebnis buchen" (Visitor) | CTA | `A.BOOK_EXPERIENCE` → `setShowConnect(true)` | `A.BOOK_EXPERIENCE` | `migrated ✅` | — | Flow noch partial |

---

## 14. IMPACT FLOW

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| ImpactFlow | Schritt 1: Projekt | Step | intern | — | `working` | — | Intern ok |
| ImpactFlow | Schritt 2: Vision | Step | intern | — | `working` | — | Intern ok |
| ImpactFlow | Schritt 3: Kontakt | Step | intern | — | `working` | — | Intern ok |
| ImpactFlow | Schritt 4: Review + Einreichen | Button | Supabase-Write | — | `partial` | — | Backend unklar |
| ImpactFlow | Schließen | Button | `setShowImpactFlow(false)` | `A.CLOSE_ORB` | `legacy` | `A.CLOSE_OVERLAY` | Migration |

---

## 15. LIVE MAP

| Screen | Element | Type | Current Behavior | Action | Status | Target | Missing |
|---|---|---|---|---|---|---|---|
| Map | Creator Pin tap | Marker | `onView(wirker)` → `setShowWirker` | `A.OPEN_PROFILE` | `legacy` | `A.OPEN_PROFILE` | Migration |
| Map | Schließen | Button | `setShowMap(false)` | — | `working` | — | Ok |
| Map | Filter | Pills | intern | — | `working` | — | Intern ok |

---

## CRITICAL FLOW REPORT — Emotional kaputte Loops

Diese Flows sind für die Nutzererfahrung am kritischsten und derzeit broken:

### 🔴 KRITISCH — sofort fixen

| Flow | Problem | Impact |
|---|---|---|
| **Visitor Profile → Buchen** | `BOOK_EXPERIENCE` öffnet `setShowConnect` aber keine Experience-Kontext übergabe | Booking ohne Bezug |
| **Visitor Profile → Nachricht** | Öffnet Chat, aber nach Chat-Close → kein Return zum Profil | Lost navigation |
| **Dead Links im Visitor Profile** | 8 tote "→" Links (Atelier, Wirkung, Momente, etc.) | Frustration |
| **BottomNav Orb (Basis-User)** | Öffnet Membership-Flow nicht konsistent | Onboarding-Loop bricht |
| **Chat Header → Profil ansehen** | Öffnet Profil via useProfileLauncher — schließt aber Chat nicht sauber | State-Konflikt |

### 🟡 WICHTIG — Phase 1B

| Flow | Problem | Impact |
|---|---|---|
| **Folgen-Button überall** | Kein Backend-Write — nur lokaler State | Daten gehen verloren |
| **Resonanz-Buttons** | Kein Backend-Write | Keine echten Resonanz-Daten |
| **Notification → Action** | `onNavigate` string-basiert, nicht Action-Engine | Inkonsistent |
| **Discover → Experience** | Werk/Erlebnis-Cards öffnen kein Ziel-Screen | Dead end |
| **Story Reaktionen** | Lokal, kein Backend | Keine Persistenz |

### 🟢 NICE-TO-HAVE — Phase 1C

| Flow | Problem | Impact |
|---|---|---|
| **Profil bearbeiten** | Kein Edit-Flow implementiert | Owner kann nichts ändern |
| **Einnahmen Dashboard** | Kein Screen vorhanden | QuickAction ist dead |
| **Kalender** | Kein Screen vorhanden | QuickAction ist dead |
| **Chat Anhänge** | Nicht implementiert | Feature-Gap |

---

## DEAD INTERACTION COUNT

| Kategorie | Anzahl toter Interaktionen |
|---|---|
| Tote Links (→ ohne onClick) | **11** |
| Buttons ohne Handler | **7** |
| Cards ohne Navigation | **8** |
| Placeholder UI (bewusst leer) | **9** |
| **GESAMT DEAD** | **35** |

---

## MIGRATION ROADMAP — Phase 1B Prioritäten

### Batch 1 — Header + Navigation ✅ DONE 2026-05-24
- ~~Bell → `A.OPEN_NOTIFICATIONS`~~ ✅
- ~~Chat-Button → `A.OPEN_CHAT`~~ ✅
- ~~BottomNav Tabs → `A.GO_*`~~ ✅
- ~~Orb-Button → `A.OPEN_ORB`~~ ✅
- ~~Tab Profil → `A.OPEN_OWN_PROFILE`~~ ✅

### Batch 2 — Feed ✅ DONE 2026-05-24
- ~~Creator Card → `A.OPEN_PROFILE`~~ ✅
- ~~Person Card → `A.OPEN_PROFILE`~~ ✅
- ~~Folgen → `A.FOLLOW_CREATOR`~~ ✅
- ~~Resonanz (3 Typen) → `A.SEND_RESONANCE`~~ ✅
- ~~Event Card → `A.OPEN_EXPERIENCE`~~ ✅
- ~~EmptyState CTAs → `A.GO_DISCOVER` / `A.OPEN_STORY_COMPOSER`~~ ✅

### Batch 3 — Visitor Profile tote Links (8 Elemente)
- Alle "→" Links mit echten Actions verdrahten

### Batch 4 — Notification Engine (4 Elemente)
- `onNavigate` → Action Engine migrieren

### Batch 5 — Discover + Favorites (8 Elemente)
- Alle onView → `A.OPEN_PROFILE` / `A.OPEN_EXPERIENCE`

---

*Generiert: 2026-05-24 | Audit: Phase 1A | Nächste Phase: 1B — Migration Batch 1-3*

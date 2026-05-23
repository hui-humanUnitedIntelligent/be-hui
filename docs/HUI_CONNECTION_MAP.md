# HUI Connection Map — Phase 23 Audit
**Datum:** 2026-05-23  
**Zweck:** Vollständige Erfassung aller lebendigen und toten Verbindungen.

---

## LEGENDE
- ✅ LIVE — funktioniert, Konsequenz vorhanden
- ⚡ PARTIAL — UI-Feedback aber kein Persistence
- 💀 DEAD — Button existiert, tut nichts
- 🔌 MISSING — Flow existiert aber kein onXxx-Handler
- 🔥 CRITICAL — blockiert echte User Journeys

---

## 1. FEED (HomeFeed.jsx)

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| FeedCard → Creator Avatar | Tap | WirkerProfilePage | ✅ via onProfile |
| FeedCard → Resonanz (❤️) | Tap | itemReactions State + Supabase | ⚡ lokaler State, Supabase-Write unklar |
| FeedCard → Kommentar | Tap | onComment Handler | 🔌 onComment existiert aber öffnet keinen Raum |
| FeedCard → Titel | Tap | WorkDetailPage | ⚡ nur wenn onTitle gesetzt |
| HeroCard → CTA Button | Tap | WorkDetailPage | ⚡ PARTIAL |
| StoryBar → Avatar | Tap | StoryViewer | ✅ activeStory wird gesetzt |
| StoryViewer → Profil-Icon | Tap | WirkerProfile | ✅ onViewProfile |
| StoryViewer → Antworten | Tap | Chat (message insert) | ✅ Supabase messages insert |
| Feed → Empty State | — | DiscoverPage CTA | 🔌 CTA vorhanden, aber kein onNavigate |
| RhythmCard → Dwell tracking | Scroll | Living Memory | ✅ IntersectionObserver + recordDwell |

---

## 2. DISCOVER (DiscoverPage.jsx)

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| Creator Card → Tap | Tap | WirkerProfilePage | ✅ onView(item) |
| Karte Button | Tap | LiveMapPage | ✅ onMap() |
| Werk-Card | Tap | WorkDetailPage | ⚡ onAll() existiert nur für Liste |
| Erlebnis-Card | Tap | ExperiencePage | ⚡ onAll() existiert nur für Liste |
| Kategorie-Filter | Tap | Gefilterte Liste | ✅ lokaler State |
| Search/MatchBar | Tap | HuiMatchOverlay | ✅ öffnet sich |
| HuiMatchOverlay → Creator | Tap | WirkerProfile | ✅ onView() |

---

## 3. CREATOR PROFILE / WIRKER PROFILE

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| "Nachricht senden" Button | Tap | ChatCenterOverlay | 💀 onChat={() => {}} in ProfileLauncher — DEAD |
| "Buchen" Button | Tap | BookingFlow | 💀 onBook={() => {}} in ProfileLauncher — DEAD |
| "Folgen" Button | Tap | follows Tabelle | ✅ toggleFollow → Supabase insert |
| Werk-Card im Profil | Tap | WorkDetailPage | ⚡ PARTIAL |
| Impact-Card im Profil | Tap | ImpactPage | 🔌 MISSING |
| Creative Worlds / Spaces | Tap | — | 💀 DEAD — keine Action |
| Stats (Wirkung etc.) | Tap | — | 💀 DEAD — dekorativ |
| Zurück-Button | Tap | Vorherige Ansicht | ✅ onClose |

---

## 4. ORB SYSTEM (OrbSystem + Home.jsx)

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| BottomNav Orb (Basis-User) | Tap | HuiMembershipFlow | ✅ |
| BottomNav Orb (Member) | Tap | OrbSystem / HuiPlusSheet | ✅ |
| Orb Node "Teilen" | Tap | TeilenFlow | ✅ setShowTeilen(true) |
| Orb Node "Werk erschaffen" | Tap | WorkFlow | ✅ setShowWerkPublisher(true) |
| Orb Node "Erlebnis öffnen" | Tap | ExperienceFlow | ✅ setShowExperienceCreator(true) |
| Orb Node "Wirkung starten" | Tap | ImpactFlow | ✅ setShowImpactFlow(true) |
| Orb Node "Verbindung" | Tap | ConnectionCreatePage | ✅ setShowConnect(true) |
| OrbNode Sub-Items | Tap | Spezifischer Flow mit Preset | ⚡ action-Key wird übergeben, aber Flow ignoriert ihn |
| ImpactFlow → Submit | Submit | Supabase impact_applications | ✅ insert |
| WorkFlow → Publish | Submit | Supabase works | ✅ insert |
| TeilenFlow → Share | Submit | Supabase stories + feed_posts | ✅ insert |
| Orb → RelationshipMemory | Interaction | Memory Update | 💀 DEAD — kein Trigger |

---

## 5. IMPACT PAGE (ImpactPage.jsx)

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| Projekt-Card → "Unterstützen" | Tap | Vote State | ⚡ nur localStorage-ähnlich, kein Supabase |
| Projekt-Card → Avatar-Gruppe | Tap | Creator Profile | 💀 DEAD — keine Action |
| Projekt-Card → Tags | Tap | Gefilterte Ansicht | 💀 DEAD — keine Action |
| "Projekt vorschlagen" Button | Tap | ImpactFlow | 💀 DEAD — kein onPress Handler |
| CommunityEnergy Hint | — | — | ⚡ kosmetisch, kein Link |
| Pool Distribution Info-Icon | Tap | — | 💀 DEAD — kein Handler |
| PoolStats Stat-Card | Tap | — | 💀 DEAD — dekorativ |

---

## 6. NOTIFICATIONS (NotificationCenter.jsx)

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| Notification → onAction | Tap | setShowNotifs(false) | 🔥 CRITICAL — schließt nur das Panel, navigiert nicht |
| Notif "Neue Resonanz" | Tap | Feed + Creator | 💀 DEAD — kein Navigate |
| Notif "Neue Nachricht" | Tap | Chat mit Sender | 💀 DEAD — kein Navigate |
| Notif "Neuer Follower" | Tap | Follower-Profil | 💀 DEAD — kein Navigate |
| "Alles" als gelesen | Tap | Supabase update | ✅ notifications.update |
| onDiscover Button | Tap | DiscoverPage | 🔌 onDiscover Prop nicht übergeben |

---

## 7. CHAT CENTER (ChatCenterOverlay.jsx)

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| Conversation List → Room | Tap | ConversationRoom | ✅ |
| New Chat Button | Tap | Creator-Auswahl | 💀 DEAD — kein Flow |
| Message Send | Send | Supabase messages | ✅ |
| Creator Avatar im Chat | Tap | WirkerProfile | 💀 DEAD |
| Booking-Intent Button | Tap | BookingFlow | 💀 DEAD |

---

## 8. BOTTOM NAV (BottomNav.jsx)

| FROM | ACTION | TARGET | STATUS |
|------|--------|--------|--------|
| Home Tab | Tap | HomeFeed | ✅ |
| Discover Tab | Tap | DiscoverPage | ✅ |
| Orb Button | Tap | OrbSystem | ✅ |
| Impact Tab | Tap | ImpactPage | ✅ |
| Profile Tab | Tap | CreatorProfilePage | ✅ |

---

## 9. EMPTY STATES

| WHERE | EMPTY STATE | NEXT STEP | STATUS |
|-------|-------------|-----------|--------|
| HomeFeed leer | "Noch nichts hier" | Button → Discover | 🔌 Button vorhanden, kein onNavigate |
| FavoritesPage leer | Platzhalter | Button → Discover | ⚡ UI vorhanden |
| Chat leer | "Keine Gespräche" | — | 💀 kein CTA |
| Impact leer | ImpactSkeleton | — | 💀 keine Empty State Verbindung |
| Discover leer | — | — | 💀 kein Fallback |

---

## 10. CROSS-SYSTEM CONNECTIONS

| FROM | TO | MECHANISM | STATUS |
|------|----|-----------|--------|
| Follow → Feed | Feed zeigt followed Creator bevorzugt | feedIntelligence | ⚡ Intelligence existiert, Supabase-Query unklar |
| Impact Vote → Feed | Activity erscheint im Feed | feed_posts insert | 💀 MISSING |
| Work Publish → Feed | Werk erscheint im Feed | feed_posts insert | ✅ WorkFlow insert |
| Story Share → Feed | Story erscheint in StoryBar | stories insert | ✅ TeilenFlow |
| Resonanz → RelMemory | Beziehungs-Tiefe steigt | useLivingMemory | ✅ recordDwell |
| Profile View → Memory | Viewed Creator erscheint bevorzugt | useLivingMemory | ✅ |
| Orb Interaction → Memory | — | — | 💀 MISSING |

---

## PRIORITÄTEN — Was zuerst fixen

### 🔥 CRITICAL (blockiert echte Flows)
1. **ProfileLauncher: onChat + onBook** → verbinden mit ChatCenter + BookingFlow
2. **NotificationCenter: onAction** → echte Navigation zu Kontext
3. **ImpactPage: Vote** → Supabase persist
4. **ImpactPage: "Projekt vorschlagen"** → ImpactFlow öffnen

### ⚡ HIGH (schlechte UX, aber nicht blockierend)
5. **Empty States** → alle mit sinnvollem nächsten Schritt verbinden
6. **Notifications → Chat** → direktes Öffnen des Gesprächs
7. **Orb Sub-Items** → Flow-Preset übergeben
8. **Creator Avatar in Chat** → Profil öffnen

### 💀 LOW (dekorativ → entweder verbinden oder entfernen)
9. Impact-Card Tags → Filter
10. Creative Worlds / Spaces → irgendeine Aktion
11. Pool Stats → Info-Modal


// src/lib/releaseNotes.js
// ═══════════════════════════════════════════════════════════════════
// SSOT: "Was ist neu"-Highlights pro App-Version (Michael 08.09.2026)
// ═══════════════════════════════════════════════════════════════════
// Der Agent pflegt bei JEDEM OTA-Release hier die Nutzer-sichtbaren
// Highlights der neuen Version (kurz, nutzerverständlich, ohne technische Details).
// Die WhatsNewModal-Komponente zeigt die Einträge beim ersten Start der
// neuen Version genau einmal (localStorage-Merker).
//
// Format: RELEASE_NOTES["<version>"] = { de: [...], en: [...] }
// - Nur Versionen mit Eintrag zeigen ein Sheet — kein Eintrag, kein Sheet.
// - de = Deutsch (Primärsprache der Closed-Beta), en = Fallback für alle
//   anderen UI-Sprachen (bewusst: Changelog-Übersetzung in 8 Sprachen wäre
//   Wartungsaufwand ohne Mehrwert für die Beta — Architektur-Charta:
//   Einfachheit vor Komplexität).
// - Nach ~8 Wochen können alte Einträge entfernt werden (Bundle-Hygiene).
// ═══════════════════════════════════════════════════════════════════

export const RELEASE_NOTES = {
  // 2.1.611 — Sammel-OTA-Queue vom 19.-22.09.2026. Der Eintrag ist fuer
  // das naechste freigegebene OTA vorbereitet; die Version selbst wird erst
  // bei Michaels explizitem "deploy" hochgezaehlt und ausgerollt.
  "2.1.611": {
    de: [
      `Erlebnisse direkt aus dem Feed buchen: "Teilnehmen" öffnet jetzt zuverlässig den vollständigen Buchungs- und Bezahlvorgang.`,
      `Klarer Zahlungsabschluss: Nach erfolgreicher Zahlung erscheinen sofort eine Bestätigung und der vollständige Beleg. Zusätzlich erhältst du eine E-Mail, sobald der Beleg verfügbar ist.`,
      `Einfachere Erlebnisbuchungen: Bezahlte Erlebnisse werden direkt abgeschlossen. Zusätzliche Versand- oder Erhalt-bestätigt-Schritte entfallen.`,
      `Erlebnisse bleiben für weitere Teilnehmer sichtbar: Ein Erlebnis verschwindet nicht mehr nach der ersten Buchung, sondern bleibt bis zur Teilnehmergrenze buchbar.`,
      `Warenkorb automatisch bereinigt: Erfolgreich bezahlte Werke, Talente und Erlebnisse werden sofort aus dem Warenkorb entfernt.`,
      `Eigene Angebote besser geschützt: Eigene Werke, Talente und Erlebnisse können nicht mehr versehentlich gekauft oder gebucht werden.`,
      `Verbesserter Chat: Ältere Bilder und Videos werden wieder zuverlässig angezeigt. Mikrofonfreigabe, Reaktionen und das Bearbeiten eigener Nachrichten wurden verbessert.`,
      `Klare Benachrichtigungen: Neue Chatnachrichten werden nur noch am Chat-Symbol gezählt. Die Glocke zeigt ausschließlich Resonanzen, Interaktionen und Systemmeldungen.`,
      `Stabilere Profilnavigation: Profile aus "Menschen entdecken" lassen sich jetzt zuverlässig öffnen, ohne dass die App zur Anmeldung zurückspringt.`,
      `Aufgeräumter Home-Feed: Impact-Pool-Verteilungen erscheinen nicht mehr im Home-Feed. Die vollständige Übersicht bleibt im Impact-Bereich verfügbar.`,
      `Neue Erlebnisse sofort im eigenen Bereich: Eingereichte Erlebnisse erscheinen bereits während der Prüfung zuverlässig unter "Mein Bereich".`,
      `Mehr Schutz in Kommentaren: Sexualisierte und unangemessene Anfragen werden jetzt konsequenter erkannt und blockiert.`,
      `Schnellerer Start auf mobilen Verbindungen: Sprachdateien werden bedarfsgerecht geladen. Dadurch startet HUI besonders über 4G schneller.`,
    ],
    en: [
      `Book experiences directly from the feed: "Join" now reliably opens the full booking and payment flow.`,
      `Clear payment completion: After a successful payment, confirmation and the full receipt appear immediately. You also receive an email when the receipt is ready.`,
      `Simpler experience bookings: Paid experiences are completed immediately. Extra shipping or receipt-confirmation steps are no longer required.`,
      `Experiences stay visible for more participants: An experience no longer disappears after the first booking and remains available until its participant limit is reached.`,
      `Automatic cart cleanup: Successfully paid works, talents and experiences are removed from the cart immediately.`,
      `Better protection for your own offers: Your own works, talents and experiences can no longer be purchased or booked by mistake.`,
      `Improved chat: Older images and videos display reliably again. Microphone permission, reactions and editing your own messages have also been improved.`,
      `Clearer notifications: New chat messages are counted only on the chat icon. The bell now shows resonance, interactions and system messages only.`,
      `More stable profile navigation: Profiles from "Discover people" now open reliably without sending you back to sign-in.`,
      `Cleaner Home feed: Impact Pool distributions no longer appear in the Home feed. The full overview remains available in the Impact section.`,
      `New experiences appear immediately in your area: Submitted experiences are shown reliably in "My Area" while they are still under review.`,
      `More protection in comments: Sexualized and inappropriate requests are now detected and blocked more consistently.`,
      `Faster startup on mobile connections: Language files load only when needed, helping HUI start faster, especially on 4G.`,
    ],
  },

  // 2.1.608 — von Michael am 18.09.2026 freigegeben ("sammel OTA mit text
  // Deployen"). Sammel-OTA (6 Commits seit 2.1.607/5d09edb3):
  // INTRO-VIDEO-UPSCALE-001 (1b32b649: Lanczos-Upscale auf 1080x1920 +
  // Nachschaerfung, 646 KB — laeuft ueber CDN, NICHT im OTA-Bundle, siehe
  // generate-ota-bundle.sh Exklusion), MOBILE-SOUND-BTN-HITBOX-FIX
  // (fb9525a5: Ton-Button 30->44px Touch-Flaeche + translateZ(0) GPU-Layer
  // gegen Android-WebView-Layering-Bug), BUG-RESOLVED-FULLTEXT-FIX
  // (fb3df756: Gruenes Kopf-Zitat aus MeineTickets entfernt, Volltext im
  // "Deine Meldung"-Block), ADMIN-TICKET-REPLYTO-001..003 (14493121,
  // 9cb13368, 5d41847d: Admin-Mail bei neuem Ticket an huiwirken@gmail.com
  // mit Absender support@be-hui.com + Reply-To=Ticket-Ersteller — Gmail
  // mit Resend-SMTP-Alias, 18.09. eingerichtet).
  "2.1.608": {
    de: [
      "Neuer App-Auftakt: Das Intro-Video begrüßt dich jetzt in gestochen scharfer Full-HD-Qualität.",
      "Ton-Button zuverlässiger: Der Sound-Schalter auf Feed-Videos reagiert jetzt auf jeden Tipp — auch auf Android.",
      "Support aufgeräumt: Deine komplette Meldung ist jetzt sauber an einem Ort lesbar — ohne doppelten Text im Ticketkopf.",
      "Schnellere Hilfe: Deine Anfragen erreichen unser Team jetzt direkt im Postfach — Antworten kommen zeitnaher zurück.",
    ],
    en: [
      "New app intro: The intro video now greets you in crisp full HD quality.",
      "More reliable sound button: The sound switch on feed videos now responds to every tap — on Android too.",
      "Tidied-up support: Your full message is now readable in one clean place — no duplicated text in the ticket header.",
      "Faster help: Your requests now reach our team's inbox directly — replies come back sooner.",
    ],
  },

  // 2.1.607 — von Michael am 16.09.2026 freigegeben ("deploy mit text").
  // Sammel-OTA (6 Commits): IMPACT-EDIT-SNAPSHOT-001 (32a515bb: Projekt-Edit
  // schreibt edit_snapshot + optionalen Änderungsgrund; SADB-Diff-Ansicht
  // a751ccc bereits DB-/Admin-seitig live seit 16.09. ~14:05),
  // PUSH-SETTINGS-BUNDLE-001 (58a2d8cf: Push-Block kompakt, Dropdown),
  // PERF-I18N-SPLIT-001 (b7735c93: 8 Sprachen hybrid lazy/eager, Start-JS
  // App-Chunk 658→116 KB gzip), PERF-IMPACT-LAZY-001 (a1e5986a),
  // PERF-DISCOVER-LAZY-001 (b24625c6), PERF-DISCOVER-PARALLEL-001
  // (5bf0a2c0: 7 Discover-Queries parallel, gegen Prod-DB gemessen
  // 1.267ms → 313ms = −75%). Startup-Graph gesamt: ~1.411 → 847 KB gzip
  // (−40%). Pro-Block-Fehlerbehandlung: eine fehlgeschlagene Query killt
  // nicht mehr die restlichen Discover-Sektionen.
  "2.1.607": {
    de: [
      "Projekte überarbeiten: Genehmigte Impact-Projekte lassen sich jetzt bearbeiten — dein Änderungsgrund geht mit zur Prüfung, mit klarer Vorher-Nachher-Ansicht.",
      "Benachrichtigungen aufgeräumt: Die Push-Einstellungen sind jetzt kompakt hinter einer Zeile zusammengefasst — ein Tipp öffnet alle Schalter.",
      "Schnellerer App-Start: Die App lädt rund 40 % weniger Daten beim Start — deine Sprache ist sofort da, weitere Sprachpakete kommen nur bei Bedarf.",
      "Entdecken deutlich schneller: Alle Bereiche laden jetzt gleichzeitig statt nacheinander — der Tab ist spürbar schneller da.",
      "Robuster gegen Fehler: Schlägt eine einzelne Abfrage fehl, zeigen die übrigen Bereiche trotzdem ihre Inhalte.",
    ],
    en: [
      "Editing projects: Approved impact projects can now be revised — your reason for the change goes to review, with a clear before-and-after view.",
      "Notifications tidied up: Push settings are now compact behind a single line — one tap opens all switches.",
      "Faster app start: The app loads about 40% less data at startup — your language is there instantly, other language packs only load when needed.",
      "Discover much faster: All sections now load at the same time instead of one after another — the tab appears noticeably faster.",
      "More robust against errors: If a single request fails, the other sections still show their content.",
    ],
  },

  // 2.1.604 — von Michael am 15.09.2026 freigegeben ("deploy mit Version
  // Pump? und 8 Text hinzu"). Versions-Korrektur: Das stille Sammel-Release
  // 2.1.603 (Commit 9e6fa37e, 13:43 UTC deployed) gab den OTA-Geraeten schon
  // die Nummer 2.1.603 — OHNE die Chat-Fixes (17968f0e) und OHNE diese
  // Release-Notes. Das 14:47-Nachfolge-Release trug dieselbe Nummer und
  // wurde deshalb von keinem Geraet gezogen (Version-Gleichstand). Die
  // 8 Punkte stehen deshalb jetzt unter 2.1.604. Sammel-OTA-Queue:
  // DISCOVER-CLEAN-001 (db018ebb: Menschen-Karten ohne Buttons/Badges),
  // ORB-SOFTTINT-001 (c4d05c3a: Mini-Orbs Variante B, zarte Toenung statt
  // Glow — ersetzt ORB-GLARE-FIX + ORB-VISIBILITY-FIX),
  // VIDEO-SOUND-TOGGLE-001 (db018ebb: Ton an/aus auf Feed-Videos),
  // CHAT-OPEN-ALL-FIX (17968f0e: Verbinden/Verkaeufer kontaktieren erstellt
  // Chats zuverlaessig — bookingId-Gate entfernt), AWARENESS-FOX-FIX
  // (17968f0e: Gruenstreifen weg, HUI-Fuchs als Hinweisgeber),
  // ORB-MODAL-KONSISTENZ-001 (4f5550e4: Orb-Menues = Mein-Bereich-Wizards),
  // SINGLE-COLUMN-LAYOUT-001 (821de1ae: Projekt-Unterstuetzen als Liste),
  // DEBUG-BUTTON-HOTFIX (9c8da905: interner Debug-Button entfernt).
  "2.1.604": {
    de: [
      "Menschen in Entdecken: Aufgeräumte Karten — Follower und Herzen auf einen Blick, ganz ohne Button-Wirrwarr.",
      "Neue Mini-Orbs: Sanfte Farbtönung statt Glow — die vier Schnell-Buttons sind jetzt klar sichtbar und angenehm lesbar.",
      "Ton an/aus: Feed-Videos haben jetzt einen eigenen Ton-Button oben rechts — stummschalten und einschalten, wann du willst.",
      "Chat öffnet immer: \"Verbinden\" und \"Verkäufer kontaktieren\" führen jetzt zuverlässig direkt zum Gespräch.",
      "Der HUI-Fuchs ist da: Er meldet sich im Chat mit Tipps, damit Vereinbarungen sicher in der App bleiben.",
      "Upload vom Orb: Momente, Werke, Erlebnisse und Talente öffnen jetzt dieselben Sheets wie im Mein-Bereich.",
      "Projekte unterstützen: Neue, ruhige Listenansicht statt unruhigem Raster.",
      "Feinschliff: Viele Detailverbesserungen für mehr Stabilität und ein saubereres Gesamtbild.",
    ],
    en: [
      "People in Discover: Cleaner cards — followers and hearts at a glance, without button clutter.",
      "New mini orbs: Soft color tint instead of glow — the four quick buttons are now clearly visible and easy to read.",
      "Sound on/off: Feed videos now have their own sound button in the top right — mute and unmute whenever you like.",
      "Chat always opens: \"Connect\" and \"Contact seller\" now reliably take you straight to the conversation.",
      "The HUI fox is here: In chats he shares tips to keep arrangements safely inside the app.",
      "Upload from the orb: Moments, works, experiences and talents now open the same sheets as in My Area.",
      "Supporting projects: A new, calm list view instead of a busy grid.",
      "Polish: Many detail improvements for more stability and an overall cleaner look.",
    ],
  },

  // 2.1.599 — von Michael am 13.09.2026 freigegeben ("okay zeig mir Text und
  // dann deploy mit text"). Queue: IMPACT-CARD-DEEPLINK-001 (5d9e528a:
  // Impact-Karte im Feed öffnet direkt das Projekt) + NOTIF-TYPE-PREFS-001
  // (6 abschaltbare Benachrichtigungstypen, Resonanzzentrum + Settings, M139)
  // + BOOKING-CHAT-001 + BOOKING-WAS-001 + OG-CATCHY-001 (38d4c22f: Social-
  // Share-Previews mit Bild/Titel/Beschreibung, Talent-Route, Projekt-Fix,
  // 2 Broken-Fallback-Images, Share-Texte ×8 Sprachen).
  // 2.1.600 — von Michael am 14.09.2026 freigegeben ("okay deployen" nach
  // Vorlage der 6 Punkte DE+EN). Sammel-OTA-Queue: Momente-Textfeld,
  // Projekt-Bearbeitung, Buchungs-Labels/CTA, Werkekorb, Telegram-Teilen,
  // Tablet-Layout + Impact-Liste.
  // 2.1.601 — von Michael am 15.09.2026 freigegeben ("ach sooo.. ich hab eine
  // 6er regel, ja die kann weg" — die fruehere max 5-6-Punkte-Deckelung wurde
  // am 15.09. ausdruecklich aufgehoben, 8 Punkte freigegeben). Sammel-OTA-Queue:
  // Open-Chat/Verbinden, Orb-Upload-Hub, Projekt-Direktunterstuetzung,
  // HUI-Talent-Interviews, Alle-loeschen, Vollbild-Drawer, Media-Retry,
  // iOS-Zahlungsfix. Bewusst NICHT drin (intern/technisch): Content-Awareness-
  // Guard, Fit-Score-V2, Verkaeufer-Karten-Klick.
  "2.1.601": {
    de: [
      "Chat für alle: Über \"Verbinden\" kannst du jetzt direkt mit Menschen aus Entdecken und Profilen chaten.",
      "Neuer Upload-Hub am Orb: Mit einem Tipp auf den Orb startest du schnell Momente, Erlebnisse, Werke oder Talente.",
      "Herzensprojekte direkt unterstützen: Du kannst jetzt bequem per Stripe das Projekt deiner Wahl unterstützen.",
      "\"HUI-Talent Interviews\" im myHUI-Profil: Video-Trailer direkt ansehbar — schau vorbei!",
      "\"Alle löschen\": Das Resonanzzentrum lässt sich jetzt mit einem Tipp leeren.",
      "\"Erlebnisse & Projekte\" im Mein-Bereich öffnen jetzt komfortabel im Vollbild.",
      "Zuverlässigeres Laden: Bilder und Videos, die mal hängen, werden automatisch neu geladen.",
      "Zahlungen auf iPhone & iPad: Die Eingabe für die Kartennummer bleibt bei geöffneter Tastatur sichtbar.",
    ],
    en: [
      "Chat for everyone: Use \"Connect\" to chat directly with people from Discover and profiles.",
      "New upload hub on the orb: Tap the orb to quickly create moments, experiences, works or talents.",
      "Support heart projects directly: You can now easily support the project of your choice via Stripe.",
      "\"HUI Talent Interviews\" in the myHUI profile: Watch video trailers right in the app — take a look!",
      "\"Delete all\": Clear your resonance center with just one tap.",
      "\"Experiences & projects\" in My Area now open comfortably in full screen.",
      "More reliable loading: Images and videos that get stuck now reload automatically.",
      "Payments on iPhone & iPad: The card number field stays visible while the keyboard is open.",
    ],
  },

  "2.1.600": {
    de: [
      "Momente mit Text: Zu Foto-, Video- und Galerie-Momenten gibt es jetzt ein richtiges Textfeld — bis 400 Zeichen.",
      "Projekte bearbeiten: Genehmigte Herzensprojekte kannst du unter \"Mein Bereich\" bearbeiten (Texte, Förderbetrag, Bilder). Änderungen werden kurz geprüft — alle bisherigen Stimmen bleiben erhalten.",
      "Buchungen klarer: Bestätigung heißt jetzt \"Leistung erhalten/erbracht\" (statt \"Ware erhalten\"), der Kontakt-Button nach der Buchung ist deutlich sichtbar und der Chat öffnet zuverlässig.",
      "Werkekorb: Video-Werke zeigen ein echtes Vorschaubild, und du bekommst bei jedem Hinzufügen eine Bestätigung.",
      "Teilen: Der Link in Telegram-Nachrichten erscheint nur noch einmal (nicht mehr doppelt).",
      "Tablet & Listen: Profile auf iPad/Tablet sind einheitlich zentriert, und die Impact-Liste zeigt neu freigegebene Projekte sofort.",
    ],
    en: [
      "Moments with text: Photo, video and gallery moments now have a real text field — up to 400 characters.",
      "Edit your projects: Approved heart projects can be edited under \"My Area\" (texts, funding goal, images). Changes are briefly reviewed — all your votes are kept.",
      "Clearer bookings: Confirmation now says \"Service received/provided\" (instead of \"Goods received\"), the contact button after booking is clearly visible, and chat opens reliably.",
      "Works basket: Video works show a real preview image, and you get a confirmation every time you add an item.",
      "Sharing: The link in Telegram messages now appears only once (no longer twice).",
      "Tablet & lists: Profiles on iPad/tablet are evenly centered, and the impact list shows newly approved projects immediately.",
    ],
  },
  "2.1.599": {
    de: [
      "Teilen: Links zu Werken, Talenten, Erlebnissen und Projekten zeigen jetzt Bild und Beschreibung — z. B. in WhatsApp und Telegram.",
      "Benachrichtigungen: Wähle selbst, welche Arten du sehen möchtest — im Resonanzzentrum und in den Einstellungen.",
      "Buchungen: Der Chat-Button öffnet jetzt direkt das Gespräch zur Buchung.",
      "Buchungsdaten: Talent und Kategorie sind jetzt klarer erkennbar.",
      "Feed: Geteilte Herzensprojekte öffnen direkt das richtige Projekt.",
      "Allgemeine Fehlerbehebungen und Stabilitätsverbesserungen.",
    ],
    en: [
      "Sharing: Links to works, talents, experiences and projects now show image and description — e.g. in WhatsApp and Telegram.",
      "Notifications: Choose which types you want to see — in the resonance center and in settings.",
      "Bookings: The chat button now opens the conversation for your booking directly.",
      "Booking details: Talent and category are now easier to recognize.",
      "Feed: Shared heart projects open the right project directly.",
      "General bug fixes and stability improvements.",
    ],
  },

  // 2.1.596 — von Michael am 13.09.2026 freigegeben ("perfekt deployen mit den
  // texten 11 texten", DEPLOY-INFO-REGEL). 11 Punkte = 5 neue Fixes aus der
  // Sammel-Queue des 13.09. (Moment-Multi-Upload, Talent-Buchung im Profil,
  // Impact-Detail Problem/Vision, Impact-Karten-i18n, Broadcast-Titel fett)
  // PLUS die 6 Punkte von 2.1.595 von gestern (Michaels Wunsch: auch Tester
  // sehen, die seit 2.1.594 nicht neu gestartet haben — Note-FORMAT-Regel
  // "max 5-6 Punkte" hier bewusst durch Michaels explizite Freigabe ersetzt).
  "2.1.596": {
    de: [
      "Momente: Jetzt mehrere Bilder und Videos in einem Moment möglich.",
      "Talent-Angebote: Direkt vom Profil aus buchbar.",
      "Herzensprojekte: Problem- und Visionstexte jetzt im Detail sichtbar.",
      "Impact-Karten: Vollständig in deiner Sprache.",
      "Systemnachrichten: Titel jetzt klar hervorgehoben.",
      "Projekt-Antrag: Wähle jetzt bis zu 3 Förderbereiche — mit neuen Bereichen wie Innovation und Sport.",
      "Profilbilder laden deutlich schneller.",
      "Impact: Noch klarere Erklärung, wie die Förderung verteilt wird.",
      "Neue Entdecken-Seite im Web mit HUI-Talente-Videos.",
      "Profil-Sichtbarkeit vereinfacht: Öffentlich oder Privat.",
      "Konto-Wechsel übersichtlicher — das Tutorial erklärt jetzt mehrere Konten.",
    ],
    en: [
      "Moments: Share multiple photos and videos in one post.",
      "Talent offers: Bookable directly from profiles.",
      "Heart projects: Problem and vision texts now visible in detail view.",
      "Impact cards: Fully translated into your language.",
      "System messages: Titles now clearly highlighted.",
      "Project applications: choose up to 3 funding areas — with new areas like innovation and sport.",
      "Profile pictures load much faster.",
      "Impact: clearer explanation of how funding is distributed.",
      "New Discover page on the web with HUI talent videos.",
      "Profile visibility simplified: Public or Private.",
      "Account switching redesigned — the tutorial now explains multiple accounts.",
    ],
  },
  // 2.1.595 — von Michael am 12.09.2026 freigegeben ("deploy mit text")
  // (DEPLOY-INFO-REGEL; fasst die Sammel-Queue zusammen: Bereiche-Multi-Select
  // + 4 neue Bereiche, Profilbild-Vorwaermung, Impact-Texte 50/30/20,
  // Entdecken-Webseite (fremdes System, mit im OTA), Sichtbarkeits-Simplify,
  // Tutorial-Konten-Schritt; SettingsModal-Cleanup unsichtbar)
  "2.1.595": {
    de: [
      "Projekt-Antrag: Wähle jetzt bis zu 3 Förderbereiche — mit neuen Bereichen wie Innovation und Sport.",
      "Profilbilder laden deutlich schneller.",
      "Impact: Noch klarere Erklärung, wie die Förderung verteilt wird.",
      "Neue Entdecken-Seite im Web mit HUI-Talente-Videos.",
      "Profil-Sichtbarkeit vereinfacht: Öffentlich oder Privat.",
      "Konto-Wechsel übersichtlicher — das Tutorial erklärt jetzt mehrere Konten.",
    ],
    en: [
      "Project applications: choose up to 3 funding areas — with new areas like innovation and sport.",
      "Profile pictures load much faster.",
      "Impact: clearer explanation of how funding is distributed.",
      "New Discover page on the web with HUI talent videos.",
      "Profile visibility simplified: Public or Private.",
      "Account switching redesigned — the tutorial now explains multiple accounts.",
    ],
  },
  // 2.1.593 — von Michael am 11.09.2026 freigegeben ("offener deploy mit text")
  // (DEPLOY-INFO-REGEL; fasst die 7-Punkte-Sammel-Queue zusammen:
  // Kachel-Einheitlichkeit, Profilbild-Lightbox, Projekt-Deep-Link,
  // Kommentar-Platzhalter, Suche-Kontrast, Kundenstimmen-Abstand,
  // Share-Linkzeile)
  "2.1.593": {
    de: [
      "Öffentliche Profile: Werke, Talente, Momente & Erlebnisse jetzt in einheitlichen Kacheln.",
      "Profilbild & Coverbild antippen → Großansicht.",
      "Projekte in Entdecken öffnen direkt das Projekt.",
      "Kommentarfeld: Platzhalter komplett sichtbar.",
      "Suchleiste & Texte: Bessere Lesbarkeit, Emojis entfernt.",
      "Kleinere Layout-Verbesserungen (Abstände, Teilen-Fenster).",
      "Allgemeine Bugfixes und verbesserte Stabilität.",
    ],
    en: [
      "Public profiles: Works, talents, moments & experiences in uniform tiles.",
      "Tap profile & cover picture → full-size view.",
      "Discover: Projects open directly.",
      "Comment field: Placeholder fully visible.",
      "Search bar & texts: Better readability, emojis removed.",
      "Minor layout improvements (spacing, share window).",
      "General bugfixes and improved stability.",
    ],
  },
  // 2.1.589 — von Michael am 11.09.2026 freigegeben ("1-5 im text passt")
  // (DEPLOY-INFO-REGEL; Video-Broadcast bewusst KEIN Eintrag: SADB-intern)
  "2.1.589": {
    de: [
      "Wischen zum Schließen: Fenster und Menüs lassen sich jetzt ganz einfach nach unten ziehen, um sie zu schließen — wie es die Griffleiste verspricht.",
      "Momente teilen: Der Hinweis im Gedanke-Feld zeigt jetzt sauber über zwei Zeilen statt kryptischer Zeichen.",
      "Bessere Lesbarkeit: Schwache Textfarben wurden im Ganzen verstärkt — Untertitel und Beschreibungen sind jetzt deutlich besser zu lesen.",
      "Tablet-Layout: Auf iPad & Co. ist der Inhalt jetzt zentriert und übersichtlich statt über den ganzen Bildschirm gezogen.",
      "Videos vollständig: Momente-Videos werden in der Vergrößerung nicht mehr an den Seiten abgeschnitten — Untertitel bleiben lesbar.",
    ],
    en: [
      "Swipe to close: Sheets and menus can now simply be dragged down to close them — just as the grab bar suggests.",
      "Share a moment: The writing hint now displays cleanly across two lines instead of odd characters.",
      "Better readability: Low-contrast text colors were strengthened throughout the app — subtitles and descriptions are now much easier to read.",
      "Tablet layout: On iPad and larger devices, content is now centered and tidy instead of stretched across the whole screen.",
      "Complete videos: Moment videos are no longer cropped at the sides in full view — subtitles stay readable.",
    ],
  },
  // 2.1.584 — von Michael am 11.09.2026 freigegeben ("passt. deploy")
  // (DEPLOY-INFO-REGEL: keine Nutzer-Infos ohne seine Text-Freigabe).
  "2.1.584": {
    de: [
      "Geburtsdatum: Vereinfachte Auswahl — erst Jahr, dann Monat, dann Tag",
      "Bessere Lesbarkeit: Texte sind jetzt dunkler und kontrastreicher",
      "Resonanzzentrum: Echte Namen statt „Jemand hat…“",
      "Videos: Der Ton stoppt automatisch, wenn du in der App weiterklickst",
      "Video-Vergrößerung: Kompakte, zentrierte Darstellung statt Vollbild",
    ],
    en: [
      "Birthdate: Simplified selection — first year, then month, then day",
      "Better readability: Text is now darker with higher contrast",
      "Resonance center: Real names instead of \"Someone…\"",
      "Videos: Sound stops automatically when you navigate on in the app",
      "Video zoom: Compact, centered view instead of full screen",
    ],
  },

  // 2.1.580 — von Michael am 09.09.2026 freigegeben ("deploy mit text")
  // (DEPLOY-INFO-REGEL: keine Nutzer-Infos ohne seine Text-Freigabe).
  "2.1.580": {
    de: [
      "Entdecken: Neues Filter-Menü — Region & Sprache",
      "Profile: Follower- und Folgt-Listen per Antippen der Zahlen",
      "Projekt-Benachrichtigungen: Navigation repariert",
      "Übersetzungen verbessert",
      "Stabilität: Kommentare & Standortsuche für Web-Nutzer repariert",
    ],
    en: [
      "Discover: New filter menu — region & language",
      "Profiles: Tap the follower numbers to see follower & following lists",
      "Project notifications: navigation fixed",
      "Translations improved",
      "Stability: comments & location search fixed for web users",
    ],
  },

  // 2.1.579 — von Michael am 09.09.2026 vor Deploy geprueft und freigegeben
  // (DEPLOY-INFO-REGEL: keine Nutzer-Infos ohne seine Text-Freigabe).
  "2.1.579": {
    de: [
      "Sprachauswahl für Inhalte: Du kannst Werken, Talent-Angeboten und Erlebnissen jetzt eine Sprache zuordnen",
      "Entdecken zeigt Inhalte passend zu deiner App-Sprache — über „Alle Sprachen“ siehst du alles",
      "In Profilen: Wenn jemand in mehreren Sprachen postet, kannst du oben per Filter wechseln",
      "Videos in Momenten werden jetzt zuverlässig mit Vorschaubild angezeigt",
      "Gefüllte Herzen bleiben jetzt zuverlässig gefüllt",
    ],
    en: [
      "Language selection: You can now assign a language to works, talent offers and experiences",
      "Discover shows content matching your app language — switch to „All languages“ to see everything",
      "In profiles: If someone posts in several languages, you can switch with a filter",
      "Videos in moments now display reliably with preview images",
      "Filled hearts now stay filled",
    ],
  },
  // 2.1.578 — von Michael am 08.09.2026 vor Deploy geprueft und freigegeben
  // (DEPLOY-INFO-REGEL: keine Nutzer-Infos ohne seine Text-Freigabe).
  "2.1.578": {
    de: [
      "Folgen ist jetzt zuverlässig: Entfolgen wird überall sofort angezeigt",
      "Das „Folge ich“-Zeichen sitzt jetzt über den Herzen auf Profil-Karten",
      "Herzensprojekte: Profilbilder der Unterstützer sind sichtbar",
      "Profil-Bezeichnungen korrigiert: Talent, Projekt, Verein, Unternehmen",
    ],
    en: [
      "Following is now reliable: unfollows show everywhere instantly",
      "The „Following“ label now sits above the hearts on profile cards",
      "Heart projects: profile pictures of supporters are now visible",
      "Profile labels corrected: Talent, Project, Association, Company",
    ],
  },
  "2.1.582": {
    de: [
      "Neu: Teilen — Werke, Talente, Erlebnisse & Projekte jetzt in den eigenen Feed reposten",
      "Neu: „Unterstützen“-Button auf Projekt-Profilen — mehr dazu bald",
      "Entdecken: Orte-Suche erkennt ganze Länder (z. B. „Spanien“, „Zypern“)",
      "Entdecken: Umkreis-Filter zeigt zuverlässig Inhalte aus deiner Region",
      "Entdecken: Einheitliche Likes-, Kommentar- und Aufruf-Zahlen auf allen Karten",
      "Mehr Sprachen: Noch mehr Texte jetzt in deiner Sprache (u. a. Projekt-Bereich)",
      "Performance: Optimierte Ladezeiten und sofort reagierende Interaktionen — spürbar schneller auf dem Handy",
      "Stabilität: Fehlermeldungen jetzt sichtbar, geschlechtsneutrale Formulierungen",
    ],
    en: [
      "New: Repost works, talents, experiences & projects to your own feed",
      "New: \"Support\" button on project profiles — more coming soon",
      "Discover: Place search recognizes whole countries (e.g. \"Spain\", \"Cyprus\")",
      "Discover: Radius filter reliably shows content from your region",
      "Discover: Consistent like, comment and view counts on all cards",
      "More languages: even more texts in your language (incl. project area)",
      "Performance: Optimized loading times and instant interactions — noticeably snappier on mobile",
      "Stability: error messages now visible, gender-neutral wording",
    ],
  },

  // 2.1.577 — erstes Release mit WhatsNewModal. Fasst die Highlights der
  // Bug-Queue-Batches 2.1.572-577 zusammen (User haben diese OTAs teils
  // einzeln, teils kumulativ gezogen — das Sheet deckt alles Sichtbare ab).
  "2.1.577": {
    de: [
      "Gesichtserkennung & Face ID: App lässt sich jetzt per Gesicht entsperren",
      "Herz wird beim Liken jetzt gefüllt angezeigt",
      "Inspirierende Menschen: Like-Zähler und Account-Typ unter jedem Profil sichtbar",
      "Meine Tickets: Liste und Chat lassen sich durch Ziehen aktualisieren",
      "Impact: Projektbilder auf Tablets größer und proportional",
      "Zuverlässigere Antworten vom Support (E-Mail-Fehler behoben)",
    ],
    en: [
      "Face recognition & Face ID: unlock the app with your face",
      "Like hearts are now shown filled in",
      "Inspiring people: like counts and account type under every profile",
      "My tickets: pull to refresh in list and chat",
      "Impact: larger, proportional project images on tablets",
      "More reliable support replies (email bug fixed)",
    ],
  },
};

// Notizen fuer die aktuell laufende Version (oder null)
export function getReleaseNotes(version, lang) {
  const entry = RELEASE_NOTES[version];
  if (!entry) return null;
  if (lang && entry[lang] && entry[lang].length) return entry[lang];
  return entry.en || null;
}

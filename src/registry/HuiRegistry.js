// src/registry/HuiRegistry.js
// ═══════════════════════════════════════════════════════════════════════════
// HUI REGISTRY — v1.0
//
// CONSTITUTION
//   Diese Registry ist die operationale Umsetzung der HUI Constitution.
//   Sie definiert die Sprache, Bedeutung und Semantik der Plattform.
//
//   Verfassung:   HUI_CONSTITUTION.md v1.1   (Goldene Regeln, Grundpfeiler, Orb-Philosophie)
//   Index:        docs/ARCHITECTURE_INDEX.md  (alle Module)
// Die zentrale semantische Grundlage der gesamten HUI-Plattform.
//
// PHILOSOPHIE
//   Die Registry ist keine Engine.
//   Sie ist keine Datenbank.
//   Sie ist keine UI.
//
//   Sie ist die gemeinsame Sprache, Bedeutung und Identität
//   auf die alle Engines, Komponenten und KI-Module zugreifen.
//
//   Änderungen hier propagieren automatisch durch die gesamte Plattform.
//   Nichts in dieser Datei darf anderswo dupliziert werden.
//
// WAS DIE REGISTRY DEFINIERT
//   ✦ Die fünf unveränderlichen Grundpfeiler
//   ✦ Vollständige semantische Beschreibung jedes Grundpfeilers
//   ✦ Orb-Eigenschaften (welches Blatt, welche Animation, welche Farbe)
//   ✦ Feed-Texte (dezent, nie dominant)
//   ✦ Profiltexte (öffentlich sichtbar — keine Zahlen, keine Levels)
//   ✦ Projekttexte (Matching, Beschreibung)
//   ✦ Empfehlungstexte (Ergänzung, nicht Popularität)
//   ✦ Benachrichtigungstexte (warm, menschlich)
//   ✦ HUI-Sprache (zentrale Terminologie)
//   ✦ Zukünftige KI-Kontexte (für AI-Module)
//
// ARCHITEKTUR
//   HuiRegistry
//     ├── PILLARS          — Interne Bezeichner (DB-Enum-kompatibel)
//     ├── PILLAR_LIST      — Geordnete Liste aller 5 Grundpfeiler
//     ├── REGISTRY         — Vollständige semantische Definition
//     ├── ORB_TRAITS       — Orb-Eigenschaften pro Grundpfeiler
//     ├── LANGUAGE         — HUI-Terminologie (ersetzt nicht-konforme Begriffe)
//     ├── CONTENT_PILLARS  — Content-Typ → Grundpfeiler Zuordnung
//     └── Helfer-Funktionen
//
// NUTZUNG
//   import { HuiRegistry, PILLARS, R } from '../registry/HuiRegistry.js';
//
//   // Grundpfeiler-Info
//   const info = R.get('erschaffen');         // vollständige Definition
//   const hint = R.feedHint('erschaffen');    // '🍃 Unterstützt Erschaffen'
//   const text = R.profileText('erschaffen'); // 'Lässt Neues entstehen'
//
//   // Sprache
//   import { LANG } from '../registry/HuiRegistry.js';
//   LANG.talent      // 'Talent' (statt 'Seller')
//   LANG.connections // 'Verbindungen' (statt 'Follower')
//
// RÜCKWÄRTSKOMPATIBILITÄT
//   Alle Exports aus hui.pillars.js bleiben erhalten.
//   hui.pillars.js wird zum Re-Export dieser Registry.
//   Bestehende Imports brechen nicht.
//
// ═══════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────
// § 1  GRUNDPFEILER-BEZEICHNER
//      Intern, unveränderlich, DB-Enum-kompatibel.
//      Entsprechen exakt dem PostgreSQL-Enum hui_pillar.
// ─────────────────────────────────────────────────────────────────────────

export const PILLARS = Object.freeze({
  VERBINDEN:     'verbinden',
  UNTERSTUETZEN: 'unterstuetzen',
  ERSCHAFFEN:    'erschaffen',
  WERTSCHOEPFEN: 'wertschoepfen',
  IMPACT:        'impact',
});

/** Geordnete Liste — für Rendering, Sortierung, Iteration */
export const PILLAR_LIST = Object.freeze([
  PILLARS.VERBINDEN,
  PILLARS.UNTERSTUETZEN,
  PILLARS.ERSCHAFFEN,
  PILLARS.WERTSCHOEPFEN,
  PILLARS.IMPACT,
]);


// ─────────────────────────────────────────────────────────────────────────
// § 2  VOLLSTÄNDIGE SEMANTISCHE REGISTRY
//      Jeder Grundpfeiler ist vollständig und vollständig beschrieben.
//      Keine Information existiert außerhalb dieser Definitionen.
//
//      Felder:
//        id              — interner Bezeichner (entspricht DB-Enum)
//        title           — öffentlicher Name
//        description     — kurze Beschreibung der Bedeutung
//        icon            — Unicode-Emoji-Icon
//        accentColor     — primäre Farbe (Hex)
//        colorSoft       — gedämpfte Hintergrundfarbe (rgba)
//        colorBorder     — dezenter Rand (rgba)
//
//        orb.*           — Orb Engine: Blatttyp, Animation, Atmosphäre
//        feed.*          — Feed Engine: Texte, Hinweise
//        profile.*       — öffentliches Profil: Texte
//        project.*       — Project Engine: Matching, Beschreibung
//        recommendation.*— Recommendation Engine: Texte
//        notification.*  — Notification System: Texte
//        community.*     — Gemeinschaftsbedeutung
//        ai.*            — Kontext für zukünftige KI-Module
// ─────────────────────────────────────────────────────────────────────────

const REGISTRY_DATA = Object.freeze({

  // ══════════════════════════════════════════════════════════════════════
  // 🤝 VERBINDEN
  // ══════════════════════════════════════════════════════════════════════
  [PILLARS.VERBINDEN]: Object.freeze({
    id:          'verbinden',
    title:       'Verbinden',
    description: 'Menschen zusammenbringen und Beziehungen ermöglichen.',
    icon:        '🤝',

    // Design-Token — konsistent mit HUI Design System
    accentColor:  '#0DC4B5',           // HUI Teal — Verbindung, Vertrauen
    colorSoft:    'rgba(13,196,181,0.09)',
    colorBorder:  'rgba(13,196,181,0.18)',
    colorGlow:    'rgba(13,196,181,0.25)',

    // Orb Engine — welches Blatt, welche Atmosphäre
    orb: Object.freeze({
      trait:        'verzweigtes Blatt',   // Verzweigung = Verbindung nach außen
      leafShape:    'branched',
      animPattern:  'gentle-unfold',         // öffnet sich langsam nach außen
      glowPulse:    'gentle',              // ruhig, einladend
      atmosphere:   'warm-open',           // lädt ein
      description:  'Ein Blatt das sich öffnet und andere einlädt.',
    }),

    // Feed Engine — dezent, nie dominant
    feed: Object.freeze({
      hint:         '🍃 Unterstützt Verbindung',
      contextLabel: 'Verbindung',
      emptyState:   'Noch keine verbindenden Inhalte in deiner Gemeinschaft.',
    }),

    // Öffentliches Profil — keine Zahlen, keine Levels
    profile: Object.freeze({
      wirktDurch:   'Bringt Menschen zusammen',
      shortLabel:   'Verbinden',
      banner:       'Wirkt besonders durch Verbinden.',
      tooltip:      'Dieser Mensch hat eine besondere Gabe, Menschen zueinander zu bringen.',
    }),

    // Project Engine — Matching
    project: Object.freeze({
      needsLabel:   'Dieses Projekt sucht Menschen, die gerne verbinden.',
      contributes:  'Bringt neue Verbindungen und Perspektiven ein.',
      matchScore:   'Deine Verbindungsstärke ergänzt dieses Projekt besonders gut.',
    }),

    // Recommendation Engine
    recommendation: Object.freeze({
      complementsYou: 'Ergänzt deine Wirkung durch Verbindung.',
      matchesPillar:  'Diese Person verbindet — was du erschaffst.',
      discoverLabel:  'Verbindende Menschen in deiner Nähe.',
    }),

    // Notification System
    notification: Object.freeze({
      generic:     'Eine neue Verbindung ist entstanden.',
      resonance:   'Deine Verbindung hat Wirkung entfaltet.',
      milestone:   'Deine Verbindungsgabe hat eine neue Tiefe erreicht.',
    }),

    // Gemeinschaftsbedeutung
    community: Object.freeze({
      meaning:     'Gemeinschaft entsteht durch Verbindung.',
      principle:   'Jede echte Verbindung trägt die Gemeinschaft.',
    }),

    // KI-Kontext (für zukünftige AI-Module)
    ai: Object.freeze({
      context:     'Menschen mit hoher Verbindungsqualität ergänzen Projekte besonders gut. Sie bauen Brücken zwischen Kompetenzen und Perspektiven.',
      signals:     ['connection_accepted', 'introduction_made', 'community_joined', 'collaboration_initiated'],
      weight:      'hoch in Projekten die Koordination und Netzwerk erfordern',
    }),
  }),

  // ══════════════════════════════════════════════════════════════════════
  // 💚 UNTERSTÜTZEN
  // ══════════════════════════════════════════════════════════════════════
  [PILLARS.UNTERSTUETZEN]: Object.freeze({
    id:          'unterstuetzen',
    title:       'Unterstützen',
    description: 'Anderen helfen zu wachsen und ihre Wirkung zu entfalten.',
    icon:        '💚',

    accentColor:  '#22C55E',           // Warm Grün — Wachstum, Fürsorge
    colorSoft:    'rgba(34,197,94,0.09)',
    colorBorder:  'rgba(34,197,94,0.18)',
    colorGlow:    'rgba(34,197,94,0.22)',

    orb: Object.freeze({
      trait:        'schützendes Blatt',   // breit, überdachend
      leafShape:    'sheltering',
      animPattern:  'slow-breathe',        // ruhig, stabil, zuverlässig
      glowPulse:    'steady',              // konstant, verlässlich
      atmosphere:   'calm-nurturing',
      description:  'Ein Blatt das Schutz gibt ohne zu dominieren.',
    }),

    feed: Object.freeze({
      hint:         '🍃 Unterstützt Gemeinschaft',
      contextLabel: 'Unterstützung',
      emptyState:   'Noch keine unterstützenden Inhalte.',
    }),

    profile: Object.freeze({
      wirktDurch:   'Hilft anderen zu wachsen',
      shortLabel:   'Unterstützen',
      banner:       'Wirkt besonders durch Unterstützen.',
      tooltip:      'Dieser Mensch hat eine besondere Stärke darin, andere in ihrem Wachstum zu begleiten.',
    }),

    project: Object.freeze({
      needsLabel:   'Dieses Projekt sucht Menschen, die gerne unterstützen.',
      contributes:  'Bringt Fürsorge, Begleitung und Stabilität ein.',
      matchScore:   'Deine unterstützende Kraft trägt dieses Projekt nachhaltig.',
    }),

    recommendation: Object.freeze({
      complementsYou: 'Ergänzt deine Wirkung durch Unterstützung.',
      matchesPillar:  'Diese Person unterstützt — was du erschaffst.',
      discoverLabel:  'Menschen die gerne unterstützen.',
    }),

    notification: Object.freeze({
      generic:     'Jemand hat dich unterstützt.',
      resonance:   'Deine Unterstützung hat Wirkung entfaltet.',
      milestone:   'Deine Unterstützungsgabe hat eine neue Tiefe erreicht.',
    }),

    community: Object.freeze({
      meaning:     'Eine Gemeinschaft trägt einander.',
      principle:   'Echte Unterstützung fragt nicht nach Gegenleistung.',
    }),

    ai: Object.freeze({
      context:     'Menschen mit hoher Unterstützungsqualität stabilisieren Projekte und ermöglichen anderen ihre beste Arbeit.',
      signals:     ['help_confirmed', 'mentoring_completed', 'feedback_given', 'encouragement_sent'],
      weight:      'hoch in Projekten die Begleitung und emotionale Stabilität brauchen',
    }),
  }),

  // ══════════════════════════════════════════════════════════════════════
  // 🎨 ERSCHAFFEN
  // ══════════════════════════════════════════════════════════════════════
  [PILLARS.ERSCHAFFEN]: Object.freeze({
    id:          'erschaffen',
    title:       'Erschaffen',
    description: 'Neues entstehen lassen — Werke, Ideen, Erlebnisse.',
    icon:        '🎨',

    accentColor:  '#F47355',           // HUI Coral — Energie, Kreativität
    colorSoft:    'rgba(244,115,85,0.09)',
    colorBorder:  'rgba(244,115,85,0.18)',
    colorGlow:    'rgba(244,115,85,0.22)',

    orb: Object.freeze({
      trait:        'entfaltendes Blatt',  // öffnet sich, zeigt seine Form
      leafShape:    'unfolding',
      animPattern:  'gentle-unfold',       // langsam, organisch
      glowPulse:    'warm-breath',         // warm, einladend
      atmosphere:   'creative-quiet',      // kreativ aber nicht laut
      description:  'Ein Blatt das seine eigene Form entfaltet.',
    }),

    feed: Object.freeze({
      hint:         '🍃 Unterstützt Erschaffen',
      contextLabel: 'Erschaffen',
      emptyState:   'Noch keine kreativen Inhalte in deiner Gemeinschaft.',
    }),

    profile: Object.freeze({
      wirktDurch:   'Lässt Neues entstehen',
      shortLabel:   'Erschaffen',
      banner:       'Wirkt besonders durch Erschaffen.',
      tooltip:      'Dieser Mensch hat eine besondere Gabe darin, Neues in die Welt zu bringen.',
    }),

    project: Object.freeze({
      needsLabel:   'Dieses Projekt sucht Menschen, die gerne erschaffen.',
      contributes:  'Bringt kreative Energie und schöpferische Kraft ein.',
      matchScore:   'Deine Schöpferkraft ist genau das was dieses Projekt braucht.',
    }),

    recommendation: Object.freeze({
      complementsYou: 'Ergänzt deine Wirkung durch Schöpferkraft.',
      matchesPillar:  'Diese Person erschafft — was du verbindest.',
      discoverLabel:  'Menschen die gerne erschaffen.',
    }),

    notification: Object.freeze({
      generic:     'Dein Werk hat jemanden berührt.',
      resonance:   'Deine Schöpfung hat Resonanz erzeugt.',
      milestone:   'Deine schöpferische Kraft hat eine neue Tiefe erreicht.',
    }),

    community: Object.freeze({
      meaning:     'Jede Gemeinschaft braucht Menschen die etwas entstehen lassen.',
      principle:   'Was erschaffen wird, bleibt — auch wenn der Moment vergeht.',
    }),

    ai: Object.freeze({
      context:     'Menschen mit hoher Schöpfungsqualität bringen konkrete Outputs in Projekte. Sie verwandeln Ideen in Realität.',
      signals:     ['work_published', 'experience_created', 'work_sold', 'experience_booked'],
      weight:      'hoch in Projekten die konkrete Ergebnisse und kreative Outputs brauchen',
    }),
  }),

  // ══════════════════════════════════════════════════════════════════════
  // 🌱 WERTSCHÖPFEN
  // ══════════════════════════════════════════════════════════════════════
  [PILLARS.WERTSCHOEPFEN]: Object.freeze({
    id:          'wertschoepfen',
    title:       'Wertschöpfen',
    description: 'Mehrwert für andere schaffen — durch Expertise, Austausch und nachhaltige Wirkung.',
    icon:        '🌱',

    accentColor:  '#D4952A',           // HUI Gold — Reife, Wert, Substanz
    colorSoft:    'rgba(212,149,42,0.09)',
    colorBorder:  'rgba(212,149,42,0.18)',
    colorGlow:    'rgba(212,149,42,0.22)',

    orb: Object.freeze({
      trait:        'verwurzeltes Blatt',  // tief, stabil, geerdet
      leafShape:    'rooted',
      animPattern:  'grounded-breathe',    // langsam, stabil, tief
      glowPulse:    'golden-warm',         // warm, substanziell
      atmosphere:   'grounded-generous',
      description:  'Ein Blatt das tief verwurzelt ist und von dort gibt.',
    }),

    feed: Object.freeze({
      hint:         '🍃 Unterstützt Wirkung',
      contextLabel: 'Wertschöpfung',
      emptyState:   'Noch keine wertschöpfenden Inhalte.',
    }),

    profile: Object.freeze({
      wirktDurch:   'Schafft Mehrwert für andere',
      shortLabel:   'Wertschöpfen',
      banner:       'Wirkt besonders durch Wertschöpfen.',
      tooltip:      'Dieser Mensch hat eine besondere Stärke darin, echten Mehrwert für andere zu schaffen.',
    }),

    project: Object.freeze({
      needsLabel:   'Dieses Projekt sucht Menschen, die gerne Wirkung entfalten.',
      contributes:  'Bringt Substanz, Expertise und nachhaltigen Mehrwert ein.',
      matchScore:   'Deine Wertschöpfungsstärke gibt diesem Projekt Tiefe und Bestand.',
    }),

    recommendation: Object.freeze({
      complementsYou: 'Ergänzt deine Wirkung durch Mehrwert.',
      matchesPillar:  'Diese Person schöpft Wert — woraus du Impact machst.',
      discoverLabel:  'Menschen die gerne Mehrwert schaffen.',
    }),

    notification: Object.freeze({
      generic:     'Dein Beitrag hat echten Mehrwert geschaffen.',
      resonance:   'Deine Wertschöpfung hat jemanden bereichert.',
      milestone:   'Deine Wertschöpfungsgabe hat eine neue Tiefe erreicht.',
    }),

    community: Object.freeze({
      meaning:     'Echte Gemeinschaften bauen auf gegenseitigem Mehrwert.',
      principle:   'Was Wert schöpft, trägt — über den Moment hinaus.',
    }),

    ai: Object.freeze({
      context:     'Menschen mit hoher Wertschöpfungsqualität bringen Tiefe und Substanz. Sie verwandeln Ressourcen in nachhaltige Wirkung.',
      signals:     ['service_completed', 'recommendation_followed', 'booking_confirmed', 'mentoring_completed'],
      weight:      'hoch in Projekten die Expertise, Qualität und nachhaltigen Output erfordern',
    }),
  }),

  // ══════════════════════════════════════════════════════════════════════
  // 🌍 IMPACT
  // ══════════════════════════════════════════════════════════════════════
  [PILLARS.IMPACT]: Object.freeze({
    id:          'impact',
    title:       'Impact',
    description: 'Positive Wirkung für Gemeinschaft und Welt — über den eigenen Kreis hinaus.',
    icon:        '🌍',

    accentColor:  '#0EA5E9',           // Tiefes Blau — Weite, Tiefe, Welt
    colorSoft:    'rgba(14,165,233,0.09)',
    colorBorder:  'rgba(14,165,233,0.18)',
    colorGlow:    'rgba(14,165,233,0.22)',

    orb: Object.freeze({
      trait:        'weitreichendes Blatt', // strahlt nach außen
      leafShape:    'radiating',
      animPattern:  'slow-radiate',         // breitet sich langsam aus
      glowPulse:    'deep-blue',            // tief, still, weit
      atmosphere:   'expansive-calm',
      description:  'Ein Blatt das seine Wirkung weit in die Welt trägt.',
    }),

    feed: Object.freeze({
      hint:         '🍃 Unterstützt Impact',
      contextLabel: 'Impact',
      emptyState:   'Noch keine Impact-Inhalte in deiner Gemeinschaft.',
    }),

    profile: Object.freeze({
      wirktDurch:   'Wirkt für Gemeinschaft und Welt',
      shortLabel:   'Impact',
      banner:       'Wirkt besonders durch Impact.',
      tooltip:      'Dieser Mensch trägt seine Wirkung weit über den eigenen Kreis hinaus.',
    }),

    project: Object.freeze({
      needsLabel:   'Dieses Projekt sucht Menschen, die Impact schaffen möchten.',
      contributes:  'Bringt Weitsicht, systemisches Denken und Weltbewusstsein ein.',
      matchScore:   'Dein Impact-Denken gibt diesem Projekt die Richtung die zählt.',
    }),

    recommendation: Object.freeze({
      complementsYou: 'Ergänzt deine Wirkung durch Impact-Denken.',
      matchesPillar:  'Diese Person denkt in Impact — was deine Wirkung verstärkt.',
      discoverLabel:  'Menschen die Impact schaffen möchten.',
    }),

    notification: Object.freeze({
      generic:     'Dein Impact hat Kreise gezogen.',
      resonance:   'Deine Wirkung reicht weiter als du dachtest.',
      milestone:   'Dein Impact hat eine neue Dimension erreicht.',
    }),

    community: Object.freeze({
      meaning:     'HUI ist Impact — jede Handlung trägt zur Gemeinschaft bei.',
      principle:   'Wirkung die über den eigenen Vorteil hinausgeht ist das Herzstück von HUI.',
    }),

    ai: Object.freeze({
      context:     'Menschen mit hoher Impact-Qualität denken systemisch und handeln für das Gemeinwohl. Sie verbinden persönliches Handeln mit gesellschaftlicher Wirkung.',
      signals:     ['impact_project_supported', 'project_joined', 'impact_ripple', 'project_milestone'],
      weight:      'hoch in Projekten die systemische Wirkung und gesellschaftlichen Mehrwert anstreben',
    }),
  }),
});


// ─────────────────────────────────────────────────────────────────────────
// § 3  ORB-TRAITS TABELLE
//
//      GRUNDSATZ (HUI_CONSTITUTION.md v1.1):
//        "Die Sonne symbolisiert die gemeinsame Menschlichkeit.
//         Das Blatt erzählt den individuellen Weg eines Menschen.
//         Der Orb ist von Anfang an vollständig.
//         Mit der Zeit erzählt das Blatt die Geschichte dieses Weges."
//
//      Für die Orb Engine: Leaf-Archetypen aus Registry lesen,
//      nicht in OrbConfig hardcoden.
//      Wird von selectLeafArchetype() in orbEngine.js genutzt.
// ─────────────────────────────────────────────────────────────────────────

export const ORB_TRAITS = Object.freeze(
  Object.fromEntries(
    PILLAR_LIST.map(p => [p, REGISTRY_DATA[p].orb])
  )
);


// ─────────────────────────────────────────────────────────────────────────
// § 4  HUI SPRACHE (LANG)
//      Zentrale Terminologie der gesamten Plattform.
//      Kein Modul definiert eigene Labels — alles kommt von hier.
//
//      VERBOTEN in der gesamten App:
//        'Follower', 'Likes', 'XP', 'Level', 'Leaderboard',
//        'Ranking', 'Score' (UI), 'Engagement', 'Marketplace',
//        'Seller', 'Top User', 'Network'
// ─────────────────────────────────────────────────────────────────────────

export const LANG = Object.freeze({

  // ── Navigation ──────────────────────────────────────────────────────
  nav: Object.freeze({
    feed:      'HUI Welt',      // der lebendige Strom der Gemeinschaft
    discover:  'Entdecken',     // Menschen und Projekte finden
    impact:    'Impact',
    studio:    'Studio',
    myHui:     'Mein HUI',
  }),

  // ── Menschen ────────────────────────────────────────────────────────
  people: Object.freeze({
    member:       'Mitglied',         // ersetzt 'User', 'Account'
    talent:       'Talent',           // ersetzt 'Seller', 'Creator', 'Expert'
    guardian:     'Guardian',         // bleibt
    connection:   'Verbindung',       // ersetzt 'Follower', 'Friend', 'Contact'
    connections:  'Verbindungen',     // ersetzt 'Followers', 'Friends'
    community:    'Gemeinschaft',     // ersetzt 'Network', 'Community', 'Audience'
    team:         'HUI Team',
  }),

  // ── Aktionen ────────────────────────────────────────────────────────
  actions: Object.freeze({
    connect:      'Verbinden',        // ersetzt 'Follow', 'Add Friend', 'Connect'
    support:      'Unterstützen',     // ersetzt 'Donate', 'Fund', 'Back', 'Help'
    create:       'Erschaffen',       // ersetzt 'Post', 'Publish', 'Upload', 'Create'
    giveImpact:   'Impact geben',     // ersetzt 'Donate to Project'
    book:         'Erleben',          // ersetzt 'Book', 'Purchase (Experience)'
    buy:          'Aufnehmen',        // ersetzt 'Buy', 'Purchase (Work)'
    recommend:    'Wirkung entfalten',// ersetzt 'Recommend', 'Share'
    share:        'Teilen',           // bleibt (aber kontextuell)
    save:         'Merken',           // ersetzt 'Save', 'Bookmark', 'Favorite'
    message:      'Schreiben',        // bleibt
    collaborate:  'Gemeinsam erschaffen', // ersetzt 'Collaborate'
  }),

  // ── Inhalte ─────────────────────────────────────────────────────────
  content: Object.freeze({
    work:          'Werk',            // bleibt — das Herzstück
    experience:    'Erlebnis',        // bleibt
    project:       'Projekt',         // ersetzt 'Campaign', 'Initiative'
    impactProject: 'Impact-Projekt',  // spezifisch
    story:         'Moment',          // ersetzt 'Story', 'Reel', 'Short'
    post:          'Gedanke',         // ersetzt 'Post', 'Note', 'Update'
    moment:        'Moment',          // bleibt
  }),

  // ── Räume ───────────────────────────────────────────────────────────
  spaces: Object.freeze({
    huiWorld:     'HUI Welt',         // ersetzt 'Marketplace', 'Shop', 'Store'
    studio:       'Studio',           // bleibt — Creator Space
    resonanz:     'Resonanz',         // ersetzt 'Reactions', 'Engagement'
    impactPool:   'Impact Pool',      // bleibt
  }),

  // ── Wirkung ─────────────────────────────────────────────────────────
  impact: Object.freeze({
    wirkung:          'Wirkung',
    resonanz:         'Resonanz',
    tiefe:            'Wirkungstiefe',
    breite:           'Wirkungsbreite',
    wärme:            'Wirkungswärme',
    complementsYou:   'Ergänzt deine Wirkung',
    matchesPillar:    'Passt zu deinen Stärken',
    profileIntro:     'Wirkt besonders durch',     // Profil-Header
    noNumbers:        true,                         // keine Zahlen je anzeigen
  }),

  // ── Empfehlungen ────────────────────────────────────────────────────
  recommendation: Object.freeze({
    people:   'Diese Menschen ergänzen deine Wirkung.',
    project:  'Dieses Projekt passt zu deinen Stärken.',
    work:     'Dieses Werk ergänzt deinen Weg.',
    noAlgo:   'Nicht: Das könnte dir gefallen. Immer: Das ergänzt deine Wirkung.',
  }),

  // ── Team Dashboard (intern) ─────────────────────────────────────────
  teamDashboard: Object.freeze({
    title:      'Menschen die HUI besonders leben',
    subtitle:   'Interne Ansicht — kein öffentliches Ranking',
    noTopList:  'Kein Top-User-System. Kein Ranking. Nur Wirkung.',
  }),

  // ── Verbotene Begriffe (nie verwenden) ──────────────────────────────
  forbidden: Object.freeze([
    'Follower', 'Likes', 'Like', 'XP', 'Level', 'Leaderboard',
    'Ranking', 'Score', 'Engagement', 'Marketplace', 'Seller',
    'Top User', 'Top Creator', 'Best Performer', 'Network',
    'Gamification', 'Achievement', 'Badge', 'Reward',
  ]),
});


// ─────────────────────────────────────────────────────────────────────────
// § 5  CONTENT-TYP → GRUNDPFEILER ZUORDNUNG
//      Für Feed-Normalizer und Recommendation Engine.
// ─────────────────────────────────────────────────────────────────────────

export const CONTENT_PILLARS = Object.freeze({
  work:           { primary: PILLARS.ERSCHAFFEN,    secondary: PILLARS.WERTSCHOEPFEN },
  experience:     { primary: PILLARS.ERSCHAFFEN,    secondary: PILLARS.VERBINDEN },
  invitation:     { primary: PILLARS.VERBINDEN,     secondary: null },
  moment:         { primary: PILLARS.ERSCHAFFEN,    secondary: null },
  note:           { primary: PILLARS.ERSCHAFFEN,    secondary: null },
  story:          { primary: PILLARS.ERSCHAFFEN,    secondary: null },
  impact_project: { primary: PILLARS.IMPACT,        secondary: PILLARS.VERBINDEN },
  project:        { primary: PILLARS.ERSCHAFFEN,    secondary: PILLARS.VERBINDEN },
  post:           { primary: PILLARS.ERSCHAFFEN,    secondary: null },
  booking:        { primary: PILLARS.WERTSCHOEPFEN, secondary: PILLARS.ERSCHAFFEN },
});


// ─────────────────────────────────────────────────────────────────────────
// § 6  HAUPT-API — HuiRegistry Objekt
//      Zentraler Einstiegspunkt für alle Module.
//      Kurz: R.get('erschaffen') / R.feedHint('impact') etc.
// ─────────────────────────────────────────────────────────────────────────

export const HuiRegistry = Object.freeze({

  // ── Grundlegende Abfragen ────────────────────────────────────────────

  /**
   * Vollständige semantische Definition eines Grundpfeilers.
   * @param {string} pillar — 'verbinden' | 'unterstuetzen' | ...
   * @returns {object | null}
   */
  get(pillar) {
    return REGISTRY_DATA[pillar] ?? null;
  },

  /**
   * Alle fünf Grundpfeiler als Array — für Rendering und Iteration.
   * Reihenfolge: Verbinden → Unterstützen → Erschaffen → Wertschöpfen → Impact
   */
  all() {
    return PILLAR_LIST.map(p => REGISTRY_DATA[p]);
  },

  /**
   * Prüft ob ein Pillar-ID gültig ist.
   */
  isValid(pillar) {
    return PILLAR_LIST.includes(pillar);
  },

  // ── Kontextuelle Text-Abfragen ───────────────────────────────────────

  /**
   * Dezenter Feed-Hint. Immer 🍃 vorangestellt.
   * Gibt null zurück wenn kein Pillar → Karte zeigt keinen Hint.
   * @returns {string | null}
   */
  feedHint(pillar) {
    return REGISTRY_DATA[pillar]?.feed?.hint ?? null;
  },

  /**
   * Öffentlicher Profiltext — "Wirkt besonders durch …"
   * Nie: Punkte, Level, Score.
   * @returns {string | null}
   */
  profileText(pillar) {
    return REGISTRY_DATA[pillar]?.profile?.wirktDurch ?? null;
  },

  /**
   * Profil-Banner: "Wirkt besonders durch Erschaffen."
   */
  profileBanner(pillar) {
    return REGISTRY_DATA[pillar]?.profile?.banner ?? null;
  },

  /**
   * Projekt-Matching Text für die Project Engine.
   * "Dieses Projekt sucht Menschen, die gerne erschaffen."
   */
  projectNeedsLabel(pillar) {
    return REGISTRY_DATA[pillar]?.project?.needsLabel
      ?? 'Dieses Projekt sucht engagierte Menschen.';
  },

  /**
   * Empfehlungstext für die Recommendation Engine.
   * "Ergänzt deine Wirkung durch …"
   */
  recommendationText(pillar) {
    return REGISTRY_DATA[pillar]?.recommendation?.complementsYou ?? null;
  },

  /**
   * Benachrichtigungstext (generisch).
   */
  notificationText(pillar) {
    return REGISTRY_DATA[pillar]?.notification?.generic ?? null;
  },

  /**
   * Gemeinschaftsbedeutung — für Team Dashboard und interne Texte.
   */
  communityMeaning(pillar) {
    return REGISTRY_DATA[pillar]?.community?.meaning ?? null;
  },

  /**
   * KI-Kontext für zukünftige AI-Module.
   */
  aiContext(pillar) {
    return REGISTRY_DATA[pillar]?.ai?.context ?? null;
  },

  // ── Orb Engine Interface ─────────────────────────────────────────────

  /**
   * Orb-Trait für einen Grundpfeiler.
   * Wird von selectLeafArchetype() in orbEngine.js gelesen.
   */
  orbTrait(pillar) {
    return REGISTRY_DATA[pillar]?.orb ?? null;
  },

  // ── UI Hilfsfunktionen ───────────────────────────────────────────────

  /**
   * Gibt bis zu 3 dominante Grundpfeiler für das öffentliche Profil zurück.
   * Format: Array<{ pillar, title, icon, wirktDurch, accentColor, colorSoft, colorBorder }>
   * @param {string[]} pillars
   */
  dominantPillarLabels(pillars = []) {
    return (Array.isArray(pillars) ? pillars : [])
      .slice(0, 3)
      .map(p => {
        const d = REGISTRY_DATA[p];
        if (!d) return null;
        return Object.freeze({
          pillar:       p,
          title:        d.title,
          icon:         d.icon,
          wirktDurch:   d.profile.wirktDurch,
          accentColor:  d.accentColor,
          colorSoft:    d.colorSoft,
          colorBorder:  d.colorBorder,
        });
      })
      .filter(Boolean);
  },

  /**
   * Primärer Grundpfeiler für einen Content-Typ.
   * Für Feed-Normalizer wenn kein Core-Engine-Wert vorhanden.
   */
  inferPillarFromType(contentType) {
    return CONTENT_PILLARS[contentType]?.primary ?? PILLARS.ERSCHAFFEN;
  },

  /**
   * Sucht Grundpfeiler nach Keyword (für KI-Module).
   * @param {string} keyword
   * @returns {string[]} — passende Pillar-IDs
   */
  searchByKeyword(keyword) {
    if (!keyword) return [];
    const kw = keyword.toLowerCase();
    return PILLAR_LIST.filter(p => {
      const d = REGISTRY_DATA[p];
      return (
        d.title.toLowerCase().includes(kw) ||
        d.description.toLowerCase().includes(kw) ||
        d.ai.signals.some(s => s.includes(kw))
      );
    });
  },

  // ── Sprach-Shortcuts ─────────────────────────────────────────────────

  /** HUI-konforme Bezeichnung prüfen */
  isForbiddenTerm(term) {
    return LANG.forbidden.includes(term);
  },
});


// ─────────────────────────────────────────────────────────────────────────
// § 7  KURZ-ALIAS
//      R ist der bevorzugte kurze Alias für HuiRegistry.
//      Für alle Module die häufig auf die Registry zugreifen.
// ─────────────────────────────────────────────────────────────────────────

export const R = HuiRegistry;


// ─────────────────────────────────────────────────────────────────────────
// § 8  RÜCKWÄRTSKOMPATIBLE EXPORTS
//      Alle bestehenden Imports aus hui.pillars.js bleiben gültig.
//      Keine bestehende Datei muss ihren Import ändern.
// ─────────────────────────────────────────────────────────────────────────

/** @deprecated Verwende R.feedHint(pillar) stattdessen */
export function pillarHint(pillar) {
  return HuiRegistry.feedHint(pillar);
}

/** @deprecated Verwende R.dominantPillarLabels(pillars) stattdessen */
export function dominantPillarLabels(pillars = []) {
  return HuiRegistry.dominantPillarLabels(pillars);
}

/** @deprecated Verwende R.inferPillarFromType(type) stattdessen */
export function inferPillarFromType(contentType) {
  return HuiRegistry.inferPillarFromType(contentType);
}

/** @deprecated Verwende R.projectNeedsLabel(pillar) stattdessen */
export function projectNeedsLabel(pillar) {
  return HuiRegistry.projectNeedsLabel(pillar);
}

// Legacy-Exports (ui.pillars.js Kompatibilität)
export const PILLAR_UI       = Object.fromEntries(PILLAR_LIST.map(p => [p, REGISTRY_DATA[p]]));
export const HUI_LANGUAGE    = LANG;
export const CONTENT_PILLAR_MAP = CONTENT_PILLARS;

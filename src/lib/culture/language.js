// src/lib/culture/language.js
// HUI — Platform Language System — Phase 6H.4
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Sprache formt Kultur. Jedes Wort in der UI ist eine Entscheidung.
// HUI verwendet Sprache die Resonanz fördert — nicht Wettbewerb.
//
// DREI EBENEN:
//   1. VERBOTENE WÖRTER — werden nie in UI-Texten verwendet
//   2. ERSETZUNGS-MAPPING — wie wir es stattdessen sagen
//   3. KULTURELLE VOKABULAR — HUI-spezifische Sprache
//
// ANWENDUNG:
//   kulturText(key) → gibt den kulturell korrekten Text zurück
//   sanitizeText(text) → ersetzt verbotene Wörter automatisch
// ═══════════════════════════════════════════════════════════════

// ── Verbotene Wörter ───────────────────────────────────────────
export const FORBIDDEN_WORDS = [
  // Growth-Sprache
  'follower', 'followers', 'following',
  'engagement', 'engagement-rate',
  'reichweite', 'impressionen', 'views',
  'trending', 'viral', 'hype',
  'wachstum', 'growth', 'skalieren',
  // Hustle-Kultur
  'hustle', 'grind', 'productivity',
  'optimize', 'optimieren',
  'content creator', 'content strategy',
  'personal brand', 'branding',
  // KPI-Sprache
  'kpi', 'metrics', 'performance', 'conversion',
  'funnel', 'roi',
  // Creator-Industrie
  'monetize', 'monetarisieren',
  'audience', 'fanbase', 'subscribers',
  'algorithm hacking',
];

// ── Ersetzungs-Mapping ──────────────────────────────────────────
export const LANGUAGE_MAP = {
  // Was wir nicht sagen → Was wir sagen
  'follower':          'Menschen die folgen',
  'followers':         'Verbindungen',
  'engagement':        'Resonanz',
  'impressionen':      'Begegnungen',
  'views':             'Einblicke',
  'reichweite':        'Verbindungen',
  'content':           'Werk',
  'content creator':   'Wirker',
  'creator':           'Wirker',
  'audience':          'Gemeinschaft',
  'performance':       'Qualität',
  'wachstum':          'Entwicklung',
  'trending':          'momentan resonant',
  'persönliche marke': 'kreative Handschrift',
  'personal brand':    'kreative Handschrift',
  'subscribers':       'Menschen in deiner Gemeinschaft',
  'funnel':            'Weg der Begegnung',
  'monetize':          'kreative Wertschöpfung',
};

// ── HUI Kulturelles Vokabular ───────────────────────────────────
// Die Wörter die HUI als Plattform definieren

export const HUI_VOCABULARY = {
  // Kernbegriffe
  wirker:          'Ein Mensch der kreativ wirkt und schafft.',
  werk:            'Was jemand geschaffen hat — jede Form kreativer Arbeit.',
  resonanz:        'Wenn Schaffen bei anderen wirklich ankommt.',
  atmosphäre:      'Das Gefühl das ein Raum, ein Werk, ein Mensch ausstrahlt.',
  tiefe:           'Qualität über Quantität in kreativer Arbeit und Beziehung.',
  verbindung:      'Echte kreative Begegnung zwischen Menschen.',
  handschrift:     'Die unverwechselbare Art wie jemand schafft.',
  verwurzelung:    'Lokale kreative Eingebettetheit.',
  rhythmus:        'Das eigene Tempo kreativen Schaffens.',
  großzügigkeit:   'Kreative Energie die man teilt ohne Gegenleistung.',
  vertrauen:       'Das was durch echte Zusammenarbeit wächst.',
  stille:          'Kreative Ruhe die genauso wertvoll ist wie Aktivität.',

  // Räume
  resonanzraum:    'Ein temporärer atmosphärischer Begegnungsraum.',
  werkraum:        'Ein gemeinsamer Raum für ein kreatives Projekt.',
  kreativer_kreis: 'Eine lokale kreative Gemeinschaft.',

  // Aktionen
  zusammenwirken:  'Kreativ gemeinsam schaffen.',
  resonieren:      'Auf etwas wirklich antworten — tiefer als ein Like.',
  weitergeben:     'Kreatives Wissen und Erfahrung teilen.',
  verweilen:       'Bewusst langsam und tief bei etwas bleiben.',
};

// ── UI-Text Bibliothek ──────────────────────────────────────────
// Alle sichtbaren UI-Texte — kulturell vereinheitlicht

export const UI_TEXTS = {
  // Profil-Bereich
  profile: {
    available:       'Offen für Zusammenwirken',
    unavailable:     'Momentan in sich',
    followCTA:       'Verbinden',
    unfollowCTA:     'Verbindung lösen',
    messageCTA:      'Nachricht senden',
    bookCTA:         'Zusammenwirken anfragen',
    editCTA:         'Profil anpassen',
    studioCTA:       'Mein Studio',
    followersLabel:  'Verbindungen',
    bookingsLabel:   'Projekte',
    recsLabel:       'Empfehlungen',
    impactLabel:     'Wirkung',
  },

  // Discovery / Feed
  feed: {
    emptyState:      'Noch nichts hier — aber die Stille ist auch schön.',
    loadingState:    'Kreative Welten werden sichtbar…',
    errorState:      'Etwas ist nicht angekommen — bitte kurz warten.',
    noMoreItems:     'Das war erstmal alles. Morgen mehr.',
    searchPlaceholder:'Was suchst du gerade?',
    filterLabel:     'Atmosphäre',
  },

  // Booking / Anfrage
  booking: {
    requestTitle:    'Zusammenarbeit anfragen',
    budgetLabel:     'Gemeinsamer Rahmen',
    dateLabel:       'Mögliche Zeit',
    locationLabel:   'Ort des Wirkens',
    messageLabel:    'Dein Anliegen',
    submitCTA:       'Anfrage senden',
    successMessage:  'Deine Anfrage ist angekommen.',
    moodLabel:       'Atmosphäre der Zusammenarbeit',
  },

  // Chat
  chat: {
    typingPlaceholder:'Schreib etwas…',
    emptyState:      'Ein stiller Raum wartet auf eure Worte.',
    sendCTA:         'Senden',
    activeBooking:   'Aktives Projekt',
  },

  // CreatorStudio
  studio: {
    greeting_morning:'Guten Morgen,',
    greeting_day:    'Guten Tag,',
    greeting_evening:'Guten Abend,',
    greeting_night:  'Gute Nacht,',
    sectionWorks:    'Deine Werke',
    sectionProjects: 'Deine Projekte',
    sectionImpact:   'Deine Wirkung',
    sectionPersonal: 'Persönliches',
    noBookings:      'Keine offenen Anfragen.',
    pendingLabel:    'Warten auf deine Antwort',
  },

  // Community
  community: {
    ritualInvite:    'Eine Einladung, keine Pflicht:',
    seasonLabel:     'Diese Jahreszeit',
    localLabel:      'In deiner Stadt',
    bridgeLabel:     'Kreative Brücken',
    sharedResonance: 'Gemeinsame kreative Felder',
  },

  // Allgemein
  general: {
    loading:   'Einen Moment…',
    error:     'Nicht angekommen. Bitte noch einmal.',
    empty:     'Noch nichts hier.',
    save:      'Sichern',
    cancel:    'Abbrechen',
    close:     'Schließen',
    back:      'Zurück',
    confirm:   'Bestätigen',
  },
};

// ── Helfer-Funktionen ───────────────────────────────────────────

/**
 * Gibt einen UI-Text zurück.
 * @param {string} section   — z.B. 'profile'
 * @param {string} key       — z.B. 'available'
 * @param {Object} vars      — optionale Template-Variablen
 */
export function t(section, key, vars = {}) {
  const text = UI_TEXTS[section]?.[key] || `${section}.${key}`;
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(`{${k}}`, v),
    text
  );
}

/**
 * Bereinigt Text von verbotenen Wörtern.
 * Für User-Generated Content (Bio, Beschreibungen).
 * NICHT für Zensur — für kulturelle Konsistenz.
 * Zeigt nur Hinweis — verbietet nicht.
 */
export function detectCulturalMisalignment(text = '') {
  const lower    = text.toLowerCase();
  const detected = FORBIDDEN_WORDS.filter(w => lower.includes(w));
  return {
    hasIssues:  detected.length > 0,
    words:      detected,
    suggestion: detected.length > 0
      ? `Diese Wörter passen vielleicht nicht zu HUI: ${detected.join(', ')}`
      : null,
  };
}

/**
 * Gibt eine kulturell passende Zeitbegrüßung zurück.
 */
export function culturalGreeting(name = '', hour = new Date().getHours()) {
  const first = name?.split(' ')[0] || '';
  if (hour >= 5  && hour < 11) return `${t('studio','greeting_morning')} ${first}`;
  if (hour >= 11 && hour < 18) return `${t('studio','greeting_day')} ${first}`;
  if (hour >= 18 && hour < 22) return `${t('studio','greeting_evening')} ${first}`;
  return `${t('studio','greeting_night')} ${first}`;
}

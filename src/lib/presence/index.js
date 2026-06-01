// src/lib/presence/index.js
// HUI — Creative Presence Engine — Phase 6F
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Ein Profil listet was jemand kann.
// Eine Präsenz zeigt wie jemand schafft.
//
// KEINE Scores sichtbar. KEIN Ranking.
// Alle Berechnungen dienen Verbindung — nicht Vergleich.
//
// WAS DIESES SYSTEM BERECHNET:
//   presenceProfile()      → vollständiges Presence-Bild
//   resonanceSignature()   → kreative Handschrift in Worten
//   collaborationStyle()   → wie jemand zusammenarbeitet
//   atmosphericIdentity()  → atmosphärische Qualität
//   creativeRhythm()       → Aktivitätsmuster über Zeit
//   expressionField()      → kreative Ausdrucksfelder
//   creativeContinuity()   → Entwicklung über Zeit
//
// ALLE SYSTEME:
//   ✅ qualitativ — keine nackten Zahlen nach außen
//   ✅ kontextuell — entstehen aus echtem Verhalten
//   ✅ entwicklungsfähig — verändern sich mit dem Menschen
//   ✅ nicht-performativ — kein Anreiz zur Manipulation
//   ✅ privat-first — was der Creator will
// ═══════════════════════════════════════════════════════════════

// ── 6F.3 — Resonance Signatures ────────────────────────────────
//
// Keine Top-Skills-Liste.
// Stattdessen: atmosphärische Qualitäten in menschlicher Sprache.
//
// Entstehen aus dem Kreuzprodukt von:
//   mood_family × creative_domain × collaboration_depth

const SIGNATURE_MATRIX = {
  // [mood_cluster][domain_family] → Signature-Text
  kreativ: {
    visual:   'ruhige visuelle Klarheit',
    sonic:    'melodische kreative Räume',
    crafted:  'handwerkliche Schöpfungskraft',
    body:     'bewegte kreative Energie',
    written:  'bildreiche sprachliche Präzision',
    space:    'räumliches gestalterisches Gespür',
    digital:  'spielerische digitale Formgebung',
    default:  'eigenwillige kreative Handschrift',
  },
  ruhig: {
    visual:   'stille visuelle Tiefe',
    sonic:    'atmosphärische Klanglandschaften',
    crafted:  'meditatives Handwerk',
    body:     'bewusste körperliche Präsenz',
    written:  'kontemplative Sprache',
    space:    'zurückgenommene räumliche Qualität',
    digital:  'ruhige digitale Klarheit',
    default:  'stille kreative Präsenz',
  },
  warm: {
    visual:   'einladende visuelle Wärme',
    sonic:    'herzliche Klangwelten',
    crafted:  'menschliches Handwerk',
    body:     'verbindende Körpersprache',
    written:  'nahe menschliche Geschichten',
    space:    'geborgene Räume',
    digital:  'menschliche digitale Räume',
    default:  'warme kreative Verbindung',
  },
  professionell: {
    visual:   'präzise visuelle Qualität',
    sonic:    'sorgfältig gearbeiteter Klang',
    crafted:  'meisterliches Handwerk',
    body:     'verlässliche körperliche Praxis',
    written:  'klare strukturierte Sprache',
    space:    'durchdachte funktionale Räume',
    digital:  'durchdachte technische Umsetzung',
    default:  'verlässliche kreative Qualität',
  },
  authentisch: {
    visual:   'ehrliche visuelle Direktheit',
    sonic:    'ungefilterte Klangehrlichkeit',
    crafted:  'aufrichtige Materialarbeit',
    body:     'echte körperliche Expression',
    written:  'direkte persönliche Stimme',
    space:    'ehrliche Raumgestaltung',
    digital:  'authentische digitale Arbeit',
    default:  'ehrliche kreative Haltung',
  },
  inspirierend: {
    visual:   'visionäre visuelle Energie',
    sonic:    'aufbrechende Klangexperimente',
    crafted:  'mutige Materialerkundung',
    body:     'mitreißende Performance',
    written:  'inspirierende Erzählkraft',
    space:    'transformative Raumgestaltung',
    digital:  'experimentelle digitale Formen',
    default:  'ansteckende kreative Vision',
  },
  nachhaltig: {
    visual:   'bewusste visuelle Verantwortung',
    sonic:    'erdverbundene Klangarbeit',
    crafted:  'nachhaltige Materialpraxis',
    body:     'achtsame körperliche Praxis',
    written:  'verantwortungsbewusste Sprache',
    space:    'ökologisch durchdachte Räume',
    digital:  'ressourcenbewusste digitale Arbeit',
    default:  'nachhaltige kreative Praxis',
  },
};

const DOMAIN_FAMILIES = {
  visual:   ['fotografie','illustration','malerei','design','video','film'],
  sonic:    ['musik','sound','podcast','hörspiel','gesang','komposition'],
  crafted:  ['keramik','schmuck','textil','holz','metall','glas','töpferei'],
  body:     ['tanz','yoga','bewegung','theater','performance','zirkus'],
  written:  ['text','lyrik','storytelling','journalismus','blog','drehbuch'],
  space:    ['architektur','innenarchitektur','garten','urban design','installation'],
  digital:  ['code','web','app','interactive','generative art','ux'],
};

function _detectDomainFamily(tags = [], talent = '') {
  const allText = [...tags, talent].join(' ').toLowerCase();
  for (const [family, keywords] of Object.entries(DOMAIN_FAMILIES)) {
    if (keywords.some(k => allText.includes(k))) return family;
  }
  return 'default';
}

function _detectMoodCluster(moodTags = [], mood = '') {
  const allMoods = [...moodTags, mood].join(' ').toLowerCase();
  const clusters = ['kreativ','ruhig','warm','professionell','authentisch','inspirierend','nachhaltig'];
  for (const c of clusters) {
    if (allMoods.includes(c)) return c;
  }
  return 'kreativ';  // Default
}

/**
 * 6F.3 — Resonance Signature
 * Atmosphärische kreative Handschrift in Worten.
 * Entsteht aus Verhalten — nicht aus Selbstaussagen.
 */
export function resonanceSignature(profile = {}) {
  const moodCluster   = _detectMoodCluster(profile.mood_tags, profile.mood);
  const domainFamily  = _detectDomainFamily(profile.dna_tags, profile.talent);
  const matrix        = SIGNATURE_MATRIX[moodCluster] || SIGNATURE_MATRIX.kreativ;
  const baseSignature = matrix[domainFamily] || matrix.default;

  // Tiefenqualifier: je mehr echte Collabs, desto mehr Tiefe
  const depth = profile.total_bookings_completed || 0;
  const depthQualifier =
    depth > 20 ? 'mit reicher Erfahrung' :
    depth > 8  ? 'mit gewachsener Praxis' :
    depth > 2  ? 'im Entstehen' :
    depth > 0  ? 'mit ersten Spuren' :
                 '';

  return {
    core:       baseSignature,
    qualifier:  depthQualifier,
    full:       depthQualifier ? `${baseSignature} ${depthQualifier}` : baseSignature,
    moodCluster,
    domainFamily,
  };
}

// ── 6F.4 — Creative Rhythms ─────────────────────────────────────

const RHYTHM_PATTERNS = {
  intensive:   { label: 'Intensiv präsent',  description: 'Schafft in Schüben — dann wieder Stille.', icon: '⚡' },
  consistent:  { label: 'Konstant da',       description: 'Regelmäßig, zuverlässig präsent.', icon: '🌊' },
  seasonal:    { label: 'Saisonal aktiv',    description: 'Bestimmte Jahreszeiten besonders produktiv.', icon: '🍂' },
  nocturnal:   { label: 'Nächtlich kreativ', description: 'Die stillen Stunden sind die fruchtbarsten.', icon: '🌙' },
  slow:        { label: 'Langsam tief',      description: 'Wenig — aber bedeutsam. Tiefe über Tempo.', icon: '🌿' },
  collaborative:{ label:'Kollaborativ',      description: 'Entfaltet sich besonders in Zusammenarbeit.', icon: '🤝' },
  resting:     { label: 'In Rückzug',        description: 'Bewusste Pause. Kreative Stille.', icon: '🌙' },
};

/**
 * 6F.4 — Creative Rhythm
 * Aktivitätsmuster über Zeit — nicht bewertet.
 * Rückzug ist genauso wertvoll wie intensive Phasen.
 */
export function creativeRhythm(profile = {}, recentActivity = []) {
  const now = Date.now();
  const isAvailable = profile.is_available !== false;

  if (!isAvailable) return { ...RHYTHM_PATTERNS.resting, key: 'resting' };

  // Aktivitäts-Zeitstempel analysieren
  const timestamps = recentActivity
    .map(a => new Date(a.created_at).getTime())
    .filter(t => t > now - 90 * 86400000)  // Letzte 90 Tage
    .sort((a, b) => b - a);

  if (timestamps.length === 0) return { ...RHYTHM_PATTERNS.slow, key: 'slow' };

  // Aktivitätsmuster erkennen
  const gaps = timestamps.slice(1).map((t, i) => timestamps[i] - t);
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : Infinity;
  const avgGapDays = avgGap / 86400000;

  // Nachtaktivität prüfen (22-4 Uhr)
  const nightActivity = recentActivity.filter(a => {
    const h = new Date(a.created_at).getHours();
    return h >= 22 || h < 4;
  }).length;
  const nightRatio = nightActivity / Math.max(recentActivity.length, 1);

  if (nightRatio > 0.4) return { ...RHYTHM_PATTERNS.nocturnal, key: 'nocturnal' };
  if (avgGapDays < 3)   return { ...RHYTHM_PATTERNS.consistent, key: 'consistent' };
  if (avgGapDays < 10)  return { ...RHYTHM_PATTERNS.collaborative, key: 'collaborative' };
  if (avgGapDays < 20)  return { ...RHYTHM_PATTERNS.intensive, key: 'intensive' };
  return { ...RHYTHM_PATTERNS.slow, key: 'slow' };
}

// ── 6F.5 — Atmospheric Identity ────────────────────────────────

/**
 * 6F.5 — Atmospheric Identity
 * Die atmosphärische Qualität einer Presence.
 * Was fühlt es sich an diesen Creator zu besuchen?
 */
export function atmosphericIdentity(profile = {}) {
  const moodCluster = _detectMoodCluster(profile.mood_tags, profile.mood);
  const domainFamily = _detectDomainFamily(profile.dna_tags, profile.talent);

  // Farb-Qualität aus Mood
  const MOOD_COLORS = {
    kreativ:       { bg: '#FFF5F0', accent: '#FF8A6B', glow: 'rgba(255,138,107,0.12)' },
    ruhig:         { bg: '#F0F8FA', accent: '#6BBCC4', glow: 'rgba(107,188,196,0.12)' },
    warm:          { bg: '#FFF8F0', accent: '#E8A87C', glow: 'rgba(232,168,124,0.12)' },
    professionell: { bg: '#F5F5F7', accent: '#6B7FC4', glow: 'rgba(107,127,196,0.12)' },
    authentisch:   { bg: '#F5F2EE', accent: '#8B7355', glow: 'rgba(139,115,85,0.12)'  },
    inspirierend:  { bg: '#F0FAF5', accent: '#5AAA7E', glow: 'rgba(90,170,126,0.12)'  },
    nachhaltig:    { bg: '#F2F5F0', accent: '#6A8B5A', glow: 'rgba(106,139,90,0.12)'  },
  };

  const colors = MOOD_COLORS[moodCluster] || MOOD_COLORS.kreativ;

  // Energie-Qualität
  const isAvail     = profile.is_available !== false;
  const collabDepth = profile.total_bookings_completed || 0;
  const energy =
    !isAvail          ? 'ruhend'    :
    collabDepth > 15  ? 'resonant'  :
    collabDepth > 5   ? 'präsent'   :
    collabDepth > 0   ? 'entstehend':
                        'offen'     ;

  const ENERGY_DESCRIPTIONS = {
    resonant:   'Eine Präsenz die trägt — durch viele gemeinsame Erfahrungen gewachsen.',
    präsent:    'Klar da. Bereit für echte Begegnungen.',
    entstehend: 'Im Aufbau. Die ersten Spuren hinterlassen.',
    offen:      'Offen. Bereit für das erste gemeinsame Werk.',
    ruhend:     'In bewusster Pause. Kreative Stille.',
  };

  return {
    moodCluster,
    domainFamily,
    colors,
    energy,
    energyDescription: ENERGY_DESCRIPTIONS[energy],
    localPresence: !!profile.location_label,
    locationLabel: profile.location_label || null,
  };
}

// ── 6F.6 — Collaboration Style ──────────────────────────────────

const COLLAB_STYLES = {
  guiding: {
    label:       'Führend',
    description: 'Bringt Struktur und Richtung in gemeinsame Prozesse.',
    worksWith:   'Menschen die Orientierung suchen.',
  },
  flowing: {
    label:       'Fließend',
    description: 'Passt sich an — bringt Flexibilität und Offenheit.',
    worksWith:   'Menschen die gestalten wollen.',
  },
  deep: {
    label:       'Tiefgehend',
    description: 'Braucht Zeit — aber schafft etwas Bleibendes.',
    worksWith:   'Menschen mit Geduld und Interesse an Tiefe.',
  },
  sparking: {
    label:       'Impulsgebend',
    description: 'Zündet Ideen — bringt Energie und Überraschung.',
    worksWith:   'Menschen die neue Impulse suchen.',
  },
  steady: {
    label:       'Verlässlich',
    description: 'Hält was er verspricht — ruhige Kraft.',
    worksWith:   'Menschen die Verlässlichkeit brauchen.',
  },
};

/**
 * 6F.6 — Collaboration Style
 * Wie fühlt sich Zusammenarbeit mit diesem Creator an?
 * Aus echten Signalen — nicht aus Selbstaussagen.
 */
export function collaborationStyle(profile = {}, trustSignals = []) {
  const responseRate     = profile.response_rate || 50;
  const completionRate   = profile.total_bookings_completed || 0;
  const repeatClients    = trustSignals.includes('repeat_clients');
  const longTermCollab   = trustSignals.includes('long_term_collab');
  const creativeCollab   = trustSignals.includes('creative_collab');
  const quickResponse    = trustSignals.includes('quick_response');

  // Style ableiten aus Signalen
  let style = 'flowing';  // Default

  if (longTermCollab && completionRate > 8) style = 'deep';
  else if (repeatClients && responseRate > 70) style = 'steady';
  else if (quickResponse && creativeCollab)    style = 'sparking';
  else if (completionRate > 5)                 style = 'guiding';

  // Process-Beschreibung aus COLLAB_MOODS (trustContext)
  const collabMoodLabel = profile.collab_mood
    ? `Bevorzugt: ${profile.collab_mood}`
    : null;

  return {
    style:       COLLAB_STYLES[style],
    key:         style,
    collabMood:  collabMoodLabel,
    // Pacing-Kompatibilität
    pacing: responseRate > 70 ? 'schnell reaktiv'
          : responseRate > 40 ? 'bewusst rhythmisch'
          : 'langsam tief',
    // Communication Texture
    communicationTexture: quickResponse
      ? 'direkt und klar'
      : longTermCollab
      ? 'tiefgehend und kontinuierlich'
      : 'offen und explorierend',
  };
}

// ── 6F.7 — Creative Continuity ─────────────────────────────────

/**
 * 6F.7 — Creative Continuity
 * Wie entwickelt sich jemand über Zeit?
 * Respektiert Veränderung — keine starren Kategorien.
 */
export function creativeContinuity(profile = {}, journeySignals = {}) {
  const { phase, depth, domains = [] } = journeySignals;

  // Interdisziplinäre Bewegung
  const domainFamilies = new Set(
    domains.map(d => {
      for (const [fam, kws] of Object.entries(DOMAIN_FAMILIES)) {
        if (kws.some(k => d.toLowerCase().includes(k))) return fam;
      }
      return null;
    }).filter(Boolean)
  );

  const isBridge   = domainFamilies.size > 1;
  const isEvolving = (profile.updated_at &&
    Date.now() - new Date(profile.updated_at).getTime() < 30 * 86400000);

  // Entwicklungs-Narrative
  const narrative =
    isBridge && domainFamilies.size > 2
      ? `Bewegt sich zwischen ${domainFamilies.size} kreativen Welten — baut Brücken.`
      : isBridge
      ? `Verbindet ${[...domainFamilies].join(' und ')} — interdisziplinär.`
      : isEvolving
      ? 'Im aktiven Wandel — die kreative Praxis vertieft sich gerade.'
      : phase?.description || 'Eine eigene kreative Praxis im Aufbau.';

  return {
    phase:       phase || null,
    depth:       depth || 0,
    isBridge,
    domainFamilies: [...domainFamilies],
    narrative,
    isEvolving,
    // Keine Vorhersage — nur Beschreibung des Jetzt
    currentMoment: isEvolving
      ? 'aktiv'
      : phase?.label === 'Vertiefend' ? 'vertiefend'
      : phase?.label === 'Verbindend' ? 'verbindend'
      : 'präsent',
  };
}

// ── Expression Field ────────────────────────────────────────────

/**
 * expressionField() — Kreative Ausdrucksfelder
 * Welche Themen, Materialien und Energien kehren immer wieder?
 */
export function expressionField(profile = {}) {
  const tags    = profile.dna_tags || [];
  const talent  = profile.talent || '';
  const bio     = profile.bio || '';

  // Thematische Cluster aus Tags extrahieren
  const THEME_CLUSTERS = {
    natur:       ['natur','wald','wasser','pflanze','erde','tier','garten','seasonal'],
    mensch:      ['portrait','mensch','emotion','beziehung','gemeinschaft','körper'],
    material:    ['ton','holz','stein','glas','metall','textil','papier','naturfasern'],
    licht:       ['licht','schatten','farbe','pigment','leuchten','dunkel'],
    raum:        ['raum','architektur','urban','straße','interieur','garten'],
    klang:       ['klang','stille','rhythmus','melodie','ambient','elektronisch'],
    sprache:     ['wort','text','narration','lyrik','geschichte','essay'],
    bewegung:    ['bewegung','fluss','statisch','dynamik','tanz','ritual'],
    handwerk:    ['handgemacht','präzision','werkzeug','technik','prozess','material'],
  };

  const fields = [];
  const allText = [...tags, talent, bio].join(' ').toLowerCase();

  for (const [cluster, keywords] of Object.entries(THEME_CLUSTERS)) {
    const matches = keywords.filter(k => allText.includes(k)).length;
    if (matches > 0) {
      fields.push({ cluster, strength: matches / keywords.length, matches });
    }
  }

  return {
    primary:   fields.sort((a, b) => b.strength - a.strength)[0]?.cluster || 'kreativ',
    fields:    fields.sort((a, b) => b.strength - a.strength).slice(0, 3),
    rawTags:   tags.slice(0, 6),
  };
}

// ── Master: presenceProfile() ───────────────────────────────────

/**
 * presenceProfile() — vollständiges kreatives Präsenz-Bild.
 *
 * Aggregiert alle Dimensions zu einem kohärenten Bild.
 * Kein Score nach außen — nur qualitative Beschreibungen.
 *
 * @param {Object} profile        — Supabase Profil
 * @param {Object} options
 * @param {Array}  options.recentActivity — Works/Bookings für Rhythmus
 * @param {Array}  options.trustSignals   — aus computeReputationSignals()
 * @param {Object} options.journeySignals — aus useCreativeJourney()
 */
export function presenceProfile(profile = {}, options = {}) {
  const { recentActivity = [], trustSignals = [], journeySignals = {} } = options;

  const signature    = resonanceSignature(profile);
  const atmosphere   = atmosphericIdentity(profile);
  const rhythm       = creativeRhythm(profile, recentActivity);
  const collab       = collaborationStyle(profile, trustSignals);
  const continuity   = creativeContinuity(profile, journeySignals);
  const expression   = expressionField(profile);

  // Presence-Greeting (kontextuell — nicht universell)
  const greeting = _presenceGreeting(profile, rhythm, atmosphere);

  return {
    // Identität
    name:        profile.display_name || 'Creator',
    talent:      profile.talent || profile.focus_type || '',
    location:    profile.location_label || null,

    // Dimensions
    signature,        // 6F.3 — Kreative Handschrift
    atmosphere,       // 6F.5 — Atmosphärische Qualität
    rhythm,           // 6F.4 — Kreative Rhythmus
    collaboration: collab,  // 6F.6 — Kollaborationsstil
    continuity,       // 6F.7 — Kreative Entwicklung
    expression,       // Ausdrucksfelder

    // Für Display
    greeting,
    isAvailable: profile.is_available !== false,

    // Kein öffentlicher Score — nur interne Tiefe
    _depth: journeySignals.depth || 0,
  };
}

function _presenceGreeting(profile, rhythm, atmosphere) {
  const name = profile.display_name?.split(' ')[0] || '';

  if (rhythm.key === 'resting') return `${name} ist gerade in einer Pause.`;
  if (rhythm.key === 'nocturnal') return `${name} schafft oft in den stillen Stunden.`;
  if (atmosphere.energy === 'resonant') return `${name} bringt gewachsene Erfahrung.`;
  if (atmosphere.energy === 'entstehend') return `${name} ist gerade im Aufbau.`;
  return null;  // Kein Greeting wenn nichts Besonderes
}

// ── React Hook ──────────────────────────────────────────────────
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { computeReputationSignals } from '@/lib/trustContext';
import { detectJourneyPhase, computeJourneyDepth } from '@/lib/creativeJourney/index';

export function usePresence(userId) {
  const [rawProfile, setRawProfile] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [trustRaw, setTrustRaw] = useState(null);
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profRes, worksRes, bookRes] = await Promise.all([
        supabase.from('profiles').select(`
          id,
          bio,
          created_at,
          display_name,
          dna_tags,
          focus_type,
          is_available,
          location_label,
          talent,
          updated_at
        `).eq('id', userId).single(),
        supabase.from('works').select('id, created_at, updated_at, mood, tags')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('bookings').select('id, created_at, status, client_user_id')
          .eq('wirker_user_id', userId).eq('status', 'completed').limit(30),
      ]);

      const profile = profRes.data;
      const works   = worksRes.data || [];
      const books   = bookRes.data  || [];

      setRawProfile(profile);
      setRecentActivity([...works, ...books]);

      // Trust Signals berechnen
      if (profile) {
        const trustInput = {
          responseRate:          profile.response_rate || 0,
          completedBookings:     books.length,
          uniqueClients:         new Set(books.map(b => b.client_user_id)).size,
          recommendationsCount:  profile.recommendations_count || 0,
          hasRepeatClients:      false,
          communityActivity:     profile.community_post_count || 0,
          verifiedProjects:      profile.verified_projects_count || 0,
          avgProjectDuration:    0,
        };
        setTrustRaw(computeReputationSignals(trustInput));
      }
    } catch (err) {
      console.error('[usePresence]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Presence berechnen
  const presence = useMemo(() => {
    if (!rawProfile) return null;

    const books   = recentActivity.filter(a => a.client_user_id);
    const months  = rawProfile.created_at
      ? Math.round((Date.now() - new Date(rawProfile.created_at).getTime()) / 2592000000)
      : 0;

    const journeySignals = {
      completedCollabs:    books.length,
      recommendations:     rawProfile.recommendations_count || 0,
      uniqueCollaborators: new Set(books.map(b => b.client_user_id)).size,
      creativeDomainsCount:(rawProfile.dna_tags || []).length,
      monthsActive:        months,
    };
    const phase = detectJourneyPhase(journeySignals);
    const depth = computeJourneyDepth(journeySignals);

    return presenceProfile(rawProfile, {
      recentActivity,
      trustSignals: (trustRaw || []).map(s => s.id || s.key || ''),
      journeySignals: { phase, depth, domains: rawProfile.dna_tags || [] },
    });
  }, [rawProfile, recentActivity, trustRaw]);

  return { presence, loading, reload: load };
}


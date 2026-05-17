// src/lib/projectSpaces/index.js
// HUI — Project Spaces & Resonance Rooms — Phase 6E.2 + 6E.3
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Ein Project Space ist kein Projektmanagement-Tool.
// Er ist ein geteiltes Atelier — ruhig, klar, kreativ fokussiert.
//
// Ein Resonance Room ist kein Grupppen-Chat.
// Er ist ein temporärer atmosphärischer Begegnungsraum.
// Er verschwindet wieder — das ist gut so.
//
// BEIDE RAUMTYPEN:
//   ✅ ruhig — kein Notification-Druck
//   ✅ temporär wenn nötig — Räume dürfen enden
//   ✅ nicht-gamifiziert — kein Score, kein Ranking
//   ✅ atmosphärisch — jeder Raum hat eine Stimmung
//   ✅ vertrauensbasiert — nur eingeladene Creators
// ═══════════════════════════════════════════════════════════════

// ── Space Typen ─────────────────────────────────────────────────
export const SPACE_TYPES = {
  PROJECT:    'project',       // Konkrete gemeinsame Schöpfung
  RESONANCE:  'resonance',     // Atmosphärischer Begegnungsraum
  MENTORSHIP: 'mentorship',    // Stille Weitergabe
  SLOW:       'slow_session',  // Bewusst langsame Kreativ-Session
  BRIDGE:     'bridge',        // Interdisziplinäre Begegnung
};

// ── Atmosphären — jeder Raum hat eine Stimmung ─────────────────
export const SPACE_ATMOSPHERES = {
  // Visuelle Qualitäten
  still:       { label: 'Still',       color: '#E8EDF2', accent: '#7B8FA6', emoji: '🌫️' },
  warm:        { label: 'Warm',        color: '#FFF3E8', accent: '#D4856A', emoji: '🌅' },
  tief:        { label: 'Tief',        color: '#EEF0F8', accent: '#6B7FC4', emoji: '🌊' },
  lebendig:    { label: 'Lebendig',    color: '#F0F8EE', accent: '#5A9A4E', emoji: '🌱' },
  naechtlich:  { label: 'Nächtlich',   color: '#1A1A2E', accent: '#9B8EC4', emoji: '🌙' },
  erdverbunden:{ label: 'Erdverbunden',color: '#F5F0E8', accent: '#8B7355', emoji: '🌿' },
  ruhig:       { label: 'Ruhig',       color: '#F4F7F9', accent: '#6B9EB2', emoji: '🌤️' },
};

// ── Space-Größen-Limits ─────────────────────────────────────────
export const SPACE_LIMITS = {
  project:      { min: 2, max: 6 },
  resonance:    { min: 1, max: 20 },
  mentorship:   { min: 2, max: 4 },
  slow_session: { min: 2, max: 8 },
  bridge:       { min: 2, max: 12 },
};

// ── Zeitrahmen ──────────────────────────────────────────────────
export const SPACE_DURATIONS = {
  // Resonance Rooms: temporär
  ephemeral:    { label: '24 Stunden',   hours: 24   },
  brief:        { label: '3 Tage',       hours: 72   },
  week:         { label: '1 Woche',      hours: 168  },
  extended:     { label: '2 Wochen',     hours: 336  },
  // Project Spaces: bis Projekt fertig
  open:         { label: 'Bis fertig',   hours: null },
  // Slow Sessions: Echtzeit-begrenzt
  session_2h:   { label: '2 Stunden',    hours: 2    },
  session_4h:   { label: '4 Stunden',    hours: 4    },
  session_6h:   { label: '6 Stunden',    hours: 6    },
};

// ── Project Space Schema (Client-seitig) ───────────────────────
/**
 * Erstellt ein neues Project Space Objekt.
 * Wird in Supabase `project_spaces` persistiert.
 */
export function createProjectSpace({
  name,
  type = SPACE_TYPES.PROJECT,
  atmosphere = 'ruhig',
  mood = null,
  description = '',
  createdBy,
  invitedCreators = [],
  duration = 'open',
  isPrivate = true,
}) {
  return {
    // Meta
    id:           null,  // Supabase-generiert
    name:         name?.trim() || 'Unbenanntes Projekt',
    type,
    atmosphere,
    mood,
    description:  description?.trim() || '',

    // Teilnehmer
    created_by:   createdBy,
    members:      [createdBy, ...invitedCreators].filter(Boolean),
    max_members:  SPACE_LIMITS[type]?.max || 6,

    // Zeit
    duration,
    started_at:   new Date().toISOString(),
    ends_at:      _computeEndsAt(duration),

    // Inhalt
    shared_notes:       '',   // Collaborative Notes
    reference_board:    [],   // Referenzen, Inspirationen
    resonance_log:      [],   // Wichtige Momente
    progress_moments:   [],   // Fortschritts-Snapshots
    contribution_log:   [],   // Wer hat was beigetragen

    // Status
    status:       'active',   // active | paused | completed | dissolved
    is_private:   isPrivate,
    created_at:   new Date().toISOString(),
  };
}

function _computeEndsAt(duration) {
  const dur = SPACE_DURATIONS[duration];
  if (!dur?.hours) return null;
  return new Date(Date.now() + dur.hours * 3600_000).toISOString();
}

// ── Resonance Room Schema ───────────────────────────────────────
/**
 * Erstellt einen Resonance Room — atmosphärisch, temporär.
 */
export function createResonanceRoom({
  theme,
  atmosphere = 'still',
  duration = 'week',
  createdBy,
  tags = [],
  locationHint = null,  // Optional: lokal verankert
}) {
  return {
    id:         null,
    type:       SPACE_TYPES.RESONANCE,
    theme:      theme?.trim() || 'Kreative Resonanz',
    atmosphere,
    tags:       tags.slice(0, 5),  // Max 5 Tags
    location_hint: locationHint,
    created_by: createdBy,
    members:    [createdBy],
    max_members:SPACE_LIMITS.resonance.max,
    duration,
    started_at: new Date().toISOString(),
    ends_at:    _computeEndsAt(duration),
    // Resonance Rooms haben keinen Chat — nur "Momente"
    moments:    [],   // Stille Beiträge: Bilder, kurze Texte, Sounds
    mood_shifts:[],   // Wie sich die Stimmung entwickelt
    status:     'active',
    created_at: new Date().toISOString(),
  };
}

// ── Contribution Typen (für Project Spaces) ─────────────────────
export const CONTRIBUTION_TYPES = {
  note:      { label: 'Notiz',       icon: '📝', description: 'Gedanke, Idee, Frage' },
  reference: { label: 'Referenz',    icon: '🖼️', description: 'Bild, Link, Inspiration' },
  moment:    { label: 'Moment',      icon: '✨', description: 'Fortschritt, Entdeckung' },
  question:  { label: 'Frage',       icon: '💭', description: 'Offene Frage an die Gruppe' },
  decision:  { label: 'Entscheidung',icon: '🎯', description: 'Gemeinsam entschieden' },
  pause:     { label: 'Pause',       icon: '🌙', description: 'Kurze Unterbrechung' },
};

// ── Moment Schema (für Resonance Rooms) ────────────────────────
export function createMoment({
  type = 'note',
  content,
  authorId,
  atmosphere = null,
}) {
  return {
    id:          `m_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    type,
    content:     content?.trim() || '',
    author_id:   authorId,
    atmosphere,
    created_at:  new Date().toISOString(),
    resonated_by:[],  // Wer hat darauf resoniert (ohne Like-Zähler)
  };
}

// ── Space Health Check ──────────────────────────────────────────
/**
 * Prüft ob ein Space noch gesund ist.
 * Ein Space kann still enden — das ist normal.
 */
export function assessSpaceHealth(space) {
  const now       = Date.now();
  const age       = space.started_at
    ? (now - new Date(space.started_at).getTime()) / 86400000 : 0;
  const isExpired = space.ends_at && now > new Date(space.ends_at).getTime();
  const lastActivity = space.resonance_log?.slice(-1)[0]?.created_at
    || space.moments?.slice(-1)[0]?.created_at
    || space.started_at;
  const inactiveDays = lastActivity
    ? (now - new Date(lastActivity).getTime()) / 86400000 : age;

  const signals = {
    isExpired,
    isQuiet:    inactiveDays > 5 && space.type !== 'project',
    isStale:    inactiveDays > 14,
    ageInDays:  Math.round(age),
    memberCount:space.members?.length || 0,
  };

  // Kein Hard-Kill — nur sanfte Signale
  const suggestion =
    isExpired   ? 'Der Raum hat seine Zeit erfüllt — er kann ruhig enden.'
    : signals.isStale   ? 'Stille kann bedeuten: fertig. Oder: bereit für eine neue Phase.'
    : signals.isQuiet   ? 'Eine ruhige Periode — das ist in Ordnung.'
    : 'Lebendig.';

  return { ...signals, suggestion };
}

// ── useProjectSpaces Hook ───────────────────────────────────────
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cacheOrFetch } from '@/lib/cache/index';

export function useProjectSpaces(userId) {
  const [spaces,  setSpaces]  = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSpaces = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await cacheOrFetch(
        'project_spaces',
        `user_${userId}`,
        async () => {
          const { data, error } = await supabase
            .from('project_spaces')
            .select('*')
            .contains('members', [userId])
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(10);
          if (error) throw error;
          return data || [];
        },
        { ttl: 60_000 }
      );
      setSpaces(data || []);
    } catch (_) {
      setSpaces([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadSpaces(); }, [loadSpaces]);

  return { spaces, loading, reload: loadSpaces };
}

// ── SQL Migration Hint (032) ─────────────────────────────────────
export const SQL_HINT = `
-- Benötigt in Supabase (hui_033_project_spaces.sql):
-- CREATE TABLE project_spaces (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   name text, type text, atmosphere text, mood text,
--   description text, created_by uuid REFERENCES auth.users(id),
--   members uuid[], max_members int DEFAULT 6,
--   duration text, started_at timestamptz, ends_at timestamptz,
--   shared_notes text DEFAULT '', reference_board jsonb DEFAULT '[]',
--   resonance_log jsonb DEFAULT '[]', progress_moments jsonb DEFAULT '[]',
--   status text DEFAULT 'active', is_private boolean DEFAULT true,
--   created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
-- );
-- ALTER TABLE project_spaces ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "members_only" ON project_spaces
--   USING (auth.uid() = ANY(members));
`;

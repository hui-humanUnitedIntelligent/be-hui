// src/components/SharedResonance.jsx
// HUI — Shared Resonance — Phase 6G.5
// ═══════════════════════════════════════════════════════════════
//
// Zeigt was zwei kreative Menschen verbindet.
// Nicht: "Mutual Friends".
// Sondern: gemeinsame kreative Felder, Rhythmen, Räume.
//
// DESIGN:
//   Sehr subtil — kein Dominant-Element.
//   Taucht auf wenn eine echte Verbindung existiert.
//   Nie leer oder gefüllter Platzhalter.
// ═══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';

const C = {
  ink:    '#1A1A1A',
  muted:  '#888888',
  border: 'rgba(0,0,0,0.07)',
  teal:   '#16D7C5',
};

/**
 * Berechnet die geteilte Resonanz zwischen zwei Profilen.
 * Rein qualitativ — keine Zahl nach außen.
 */
function computeSharedResonance(profileA = {}, profileB = {}) {
  const tagsA = new Set([...(profileA.dna_tags || []), profileA.talent, profileA.focus_type].filter(Boolean).map(s => s.toLowerCase()));
  const tagsB = new Set([...(profileB.dna_tags || []), profileB.talent, profileB.focus_type].filter(Boolean).map(s => s.toLowerCase()));

  const shared = [...tagsA].filter(t => tagsB.has(t));

  // Gemeinsame Stimmung
  const moodA = new Set([...(profileA.mood_tags || []), profileA.mood].filter(Boolean));
  const moodB = new Set([...(profileB.mood_tags || []), profileB.mood].filter(Boolean));
  const sharedMoods = [...moodA].filter(m => moodB.has(m));

  // Lokale Verbindung
  const sameCity = profileA.location_label &&
    profileB.location_label &&
    profileA.location_label.toLowerCase().trim() === profileB.location_label.toLowerCase().trim();

  // Gemeinsame kreative Übergänge (Bridge)
  const DOMAIN_FAMILIES = {
    visual:   ['foto','illustration','malerei','design','video'],
    sonic:    ['musik','sound','podcast','gesang'],
    crafted:  ['keramik','schmuck','textil','holz','glas'],
    body:     ['tanz','yoga','bewegung','theater'],
    written:  ['text','lyrik','storytelling','journalismus'],
    digital:  ['code','web','app','interactive'],
  };

  const getFamilies = (profile) => {
    const text = [...(profile.dna_tags || []), profile.talent || ''].join(' ').toLowerCase();
    return new Set(
      Object.entries(DOMAIN_FAMILIES)
        .filter(([, kws]) => kws.some(k => text.includes(k)))
        .map(([fam]) => fam)
    );
  };

  const familiesA = getFamilies(profileA);
  const familiesB = getFamilies(profileB);
  const sharedFamilies = [...familiesA].filter(f => familiesB.has(f));

  // Resonanz-Stärke
  const strength = Math.min(
    shared.length * 0.25 + sharedMoods.length * 0.20 + sharedFamilies.length * 0.30 + (sameCity ? 0.25 : 0),
    1.0
  );

  if (strength < 0.15) return null; // Zu wenig Verbindung — nichts zeigen

  // Beschreibung wählen
  let description = null;

  if (sameCity && sharedFamilies.length > 0) {
    description = `Beide lokal in ${profileA.location_label} — in ähnlichen kreativen Feldern.`;
  } else if (sharedFamilies.length > 1) {
    description = `Gemeinsame kreative Welten: ${sharedFamilies.join(' und ')}.`;
  } else if (sharedMoods.length > 0 && shared.length > 1) {
    description = `Ähnliche Energie. Ähnliche Themen.`;
  } else if (sameCity) {
    description = `Beide in ${profileA.location_label}.`;
  } else if (shared.length > 0) {
    description = `Ähnliche kreative Ausrichtung.`;
  }

  if (!description) return null;

  return { description, strength, sharedTags: shared.slice(0, 3), sharedFamilies, sameCity };
}

/**
 * SharedResonance Component
 *
 * @param {Object} profileA   — aktuell besuchtes Profil
 * @param {Object} profileB   — eigenes Profil (wenn eingeloggt)
 * @param {string} [className]
 */
export default function SharedResonance({ profileA, profileB, style = {} }) {
  const resonance = useMemo(() =>
    computeSharedResonance(profileA, profileB),
    [profileA?.id, profileB?.id, profileA?.dna_tags, profileB?.dna_tags]
  );

  if (!resonance) return null;

  return (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(22,215,197,0.04)',
      borderRadius: 12,
      border: '1px solid rgba(22,215,197,0.12)',
      marginBottom: 14,
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {/* Subtiles Resonanz-Signal */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: C.teal, opacity: 0.6,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 12, color: 'rgba(0,0,0,0.45)',
          fontStyle: 'italic', lineHeight: 1.5,
        }}>
          {resonance.description}
        </span>
      </div>
    </div>
  );
}

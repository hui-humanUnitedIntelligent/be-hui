// src/components/studio/CreatorWellbeingHint.jsx
// HUI — Creator Wellbeing Hint — Phase 5H.3
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Zeigt einen ruhigen, unterstützenden Hinweis wenn ein Creator
// überlastet ist (saturation.level === 'critical').
//
// DESIGN-PRINZIPIEN:
// — Kein Alarm, keine Warnung, kein Druck
// — Unterstützende Sprache, nicht mahnend
// — Creator kann schließen ohne Konsequenzen
// — Erscheint max. 1× pro Woche (sessionStorage)
// — Visuell ruhig: kein roter Rahmen, kein Warning-Icon
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';

const C = {
  cream:  '#F9F7F4',
  teal:   '#16D7C5',
  coral:  '#FF8A6B',
  ink:    '#1A1A1A',
  muted:  '#888888',
  border: '#EEEBE6',
  card:   '#FFFFFF',
};

// Verschiedene ruhige Hinweis-Varianten (zufällig gewählt)
const WELLBEING_MESSAGES = [
  {
    headline: 'Du bist gerade sehr gefragt.',
    sub:      'Das ist schön — und vielleicht auch viel. Ein ruhigeres Tempo macht manchmal kreativer.',
    action:   'Verfügbarkeit anpassen',
  },
  {
    headline: 'Viele Menschen wollen mit dir arbeiten.',
    sub:      'Wenn du es möchtest, kannst du deine Verfügbarkeit kurz reduzieren — das ist völlig ok.',
    action:   'Mein Tempo finden',
  },
  {
    headline: 'Kreative Energie braucht auch Raum.',
    sub:      'Du hast in letzter Zeit viel gegeben. Eine ruhige Phase schützt das, was dich einzigartig macht.',
    action:   'Pause einrichten',
  },
  {
    headline: 'Qualität kommt aus Tiefe — nicht aus Menge.',
    sub:      'Du musst nicht immer für alle verfügbar sein. Weniger kann mehr kreative Energie bedeuten.',
    action:   'Verfügbarkeit anschauen',
  },
];

const DISMISS_KEY = 'hui_wellbeing_dismissed';
const DISMISS_DAYS = 7;

function wasRecentlyDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return (Date.now() - parseInt(ts)) < DISMISS_DAYS * 86400000;
  } catch (_) { return false; }
}

function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (_) {}
}

export function CreatorWellbeingHint({ saturationLevel = 'healthy', onAdjustAvailability }) {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState(WELLBEING_MESSAGES[0]);

  useEffect(() => {
    // Nur zeigen bei 'critical' oder 'high' und wenn nicht kürzlich geschlossen
    if ((saturationLevel === 'critical' || saturationLevel === 'high') &&
        !wasRecentlyDismissed()) {
      // Zufällige Message-Variante
      setMsg(WELLBEING_MESSAGES[Math.floor(Math.random() * WELLBEING_MESSAGES.length)]);
      // Verzögerung: nach 3s einblenden (nicht sofort)
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }
  }, [saturationLevel]);

  const handleDismiss = () => {
    setVisible(false);
    markDismissed();
  };

  const handleAction = () => {
    handleDismiss();
    onAdjustAvailability?.();
  };

  if (!visible) return null;

  return (
    <div style={{
      // Ruhige, nicht-alarmierende Darstellung
      background: C.card,
      border:     `1px solid ${C.border}`,
      borderRadius: 18,
      padding:    '20px 22px',
      margin:     '0 0 16px',
      animation:  'huiSlideUp .4s ease both',
      // Kein Rot, kein Orange-Alert — sanftes Teal-Akzent
      borderLeft: `3px solid ${C.teal}`,
      position:   'relative',
    }}>
      {/* Schließen-Button — dezent */}
      <button
        onClick={handleDismiss}
        style={{
          position:   'absolute',
          top:        12,
          right:      14,
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          color:      C.muted,
          fontSize:   18,
          lineHeight: 1,
          padding:    4,
        }}
        aria-label="Schließen"
      >
        ×
      </button>

      {/* Kein Warning-Icon — nur ein ruhiges Symbol */}
      <div style={{ fontSize: 20, marginBottom: 10 }}>🌿</div>

      <div style={{
        fontWeight: 700,
        fontSize:   15,
        color:      C.ink,
        marginBottom: 6,
        paddingRight: 24,
      }}>
        {msg.headline}
      </div>

      <div style={{
        fontSize:   13.5,
        color:      C.muted,
        lineHeight: 1.6,
        marginBottom: 16,
      }}>
        {msg.sub}
      </div>

      {/* Aktion-Button — optional, nie erzwingend */}
      {onAdjustAvailability && (
        <button
          onClick={handleAction}
          style={{
            background:   'none',
            border:       `1px solid ${C.teal}`,
            borderRadius: 999,
            padding:      '7px 16px',
            color:        C.teal,
            fontSize:     13,
            fontWeight:   700,
            cursor:       'pointer',
            transition:   'all .2s',
          }}
          onMouseEnter={e => { e.target.style.background = C.teal; e.target.style.color = '#fff'; }}
          onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = C.teal; }}
        >
          {msg.action} →
        </button>
      )}
    </div>
  );
}

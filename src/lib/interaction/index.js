// src/lib/interaction/index.js
// HUI — Micro-Interaction Standards — Phase 4E.7
// ═══════════════════════════════════════════════════════════════
//
// PRINZIP: Alle Interaktionen sollen sich zusammengehörig anfühlen.
// Kein Mix aus verschiedenen Timings, Easings, Tap-Gefühlen.
//
// Hier: einheitliche Standards für:
// - Button/Card Tap-Feedback
// - Hover-States  
// - Loading-Indikatoren
// - Empty States
// - Icon-Reaktionen
// ═══════════════════════════════════════════════════════════════

// ── Touch-Target-Mindestgröße ─────────────────────────────────
export const MIN_TOUCH = 44; // px — Apple HIG Standard

// ── Standard Tap-Styles ───────────────────────────────────────
// Für alle tappable Elemente — konsistentes Feedback
export const TAP_CLASS = 'hui-tap';   // CSS-Klasse (in AMBIENT_CSS definiert)
export const CARD_CLASS = 'hui-card-hover';

// Inline-Style Variante (wenn CSS-Klasse nicht möglich)
export function tapStyle(pressed = false) {
  return {
    transform:  pressed ? 'scale(0.97)' : 'scale(1)',
    opacity:    pressed ? 0.88 : 1,
    transition: 'transform 80ms ease, opacity 80ms ease',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  };
}

// ── Standard Button Styles ────────────────────────────────────
// Minimalste Basis für alle Buttons — kein Styling, nur Interaktion
export const BASE_BUTTON = {
  border:    'none',
  outline:   'none',
  cursor:    'pointer',
  background: 'none',
  padding:   0,
  margin:    0,
  display:   'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth:  MIN_TOUCH,
  minHeight: MIN_TOUCH,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',  // verhindert 300ms delay
};

// ── Icon-Reaction Styles ──────────────────────────────────────
// Für Like, Follow, Save — subtile Reaktion
export function iconReactionStyle(active, { activeColor = '#16D7C5', inactiveColor = '#888' } = {}) {
  return {
    color:      active ? activeColor : inactiveColor,
    transform:  active ? 'scale(1.15)' : 'scale(1)',
    transition: 'color 150ms ease, transform 150ms cubic-bezier(0.34,1.4,0.64,1)',
    display:    'flex',
    alignItems: 'center',
  };
}

// ── useTapState Hook ──────────────────────────────────────────
// Vereinfacht Tap-Feedback für beliebige Elemente.
//
// Usage:
//   const tap = useTapState()
//   <button {...tap.handlers} style={tap.style}>…</button>
import { useState, useCallback } from 'react';

export function useTapState() {
  const [pressed, setPressed] = useState(false);

  const handlers = {
    onPointerDown: useCallback(() => setPressed(true), []),
    onPointerUp:   useCallback(() => setPressed(false), []),
    onPointerLeave:useCallback(() => setPressed(false), []),
  };

  return {
    handlers,
    pressed,
    style: tapStyle(pressed),
  };
}

// ── Empty State Patterns ──────────────────────────────────────
// Einheitliche ruhige Empty States
export const EMPTY_STATES = {
  feed: {
    icon: '✦',
    title: 'Noch nichts hier',
    text: 'Entdecke Talente und Werke im Feed.',
  },
  chat: {
    icon: '○',
    title: 'Noch keine Gespräche',
    text: 'Schreib einem Talent — oder werde selbst gefunden.',
  },
  bookings: {
    icon: '◇',
    title: 'Keine Buchungen',
    text: 'Deine Anfragen und Projekte erscheinen hier.',
  },
  notifications: {
    icon: '·',
    title: 'Alles gelesen',
    text: 'Du bist auf dem neuesten Stand.',
  },
  works: {
    icon: '✦',
    title: 'Noch keine Werke',
    text: 'Veröffentliche dein erstes Werk.',
  },
  search: {
    icon: '○',
    title: 'Keine Ergebnisse',
    text: 'Versuche einen anderen Begriff.',
  },
  followers: {
    icon: '○',
    title: 'Noch keine Follower',
    text: 'Teile dein Profil — deine Community wächst.',
  },
  saved: {
    icon: '◇',
    title: 'Noch nichts gespeichert',
    text: 'Werke und Talente die dich inspirieren.',
  },
};

// ── Loading State Patterns ────────────────────────────────────
// Einheitliche Loading-Sprache
export const LOADING_MESSAGES = {
  feed:         'Lädt…',
  profile:      'Lädt…',
  chat:         'Lädt…',
  booking:      'Lädt…',
  publishing:   'Wird veröffentlicht…',
  saving:       'Speichert…',
  sending:      'Sendet…',
  uploading:    'Lädt hoch…',
  connecting:   'Verbindet…',
};

// ── Skeleton Helpers ──────────────────────────────────────────
// Konsistente Skeleton-Animation (aus journeyContext)
export const SKELETON_STYLE = {
  background: 'linear-gradient(90deg, #F0EDEA 25%, #E8E5E2 50%, #F0EDEA 75%)',
  backgroundSize: '200% 100%',
  animation: 'huiSkeleton 1.4s ease infinite',
  borderRadius: 10,
};

// ── Navigation Patterns ───────────────────────────────────────
// Einheitliche Back-Button-Größe und Position
export const BACK_BUTTON_STYLE = {
  ...BASE_BUTTON,
  width:  38,
  height: 38,
  minWidth: 38,
  minHeight: 38,
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.06)',
  fontSize: 17,
  flexShrink: 0,
};

// ── Scroll Behavior ───────────────────────────────────────────
// Konsistente Scroll-Container
export const SCROLL_CONTAINER = {
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',          // Firefox
  msOverflowStyle: 'none',         // IE
};

// Für CSS: .scroll-container::-webkit-scrollbar { display: none }

// ── useKeyboardAware Hook ─────────────────────────────────────
// Passt Layout an wenn iOS Keyboard öffnet.
// Verhindert dass Input-Fields vom Keyboard verdeckt werden.
import { useEffect } from 'react';

export function useKeyboardAware(containerRef) {
  useEffect(() => {
    if (!window.visualViewport) return;

    const handler = () => {
      const vv = window.visualViewport;
      if (!containerRef?.current) return;
      // Scroll das Element in den sichtbaren Bereich
      const offsetBottom = window.innerHeight - vv.height - vv.offsetTop;
      containerRef.current.style.paddingBottom = offsetBottom > 0
        ? `${offsetBottom}px`
        : '';
    };

    window.visualViewport.addEventListener('resize', handler);
    window.visualViewport.addEventListener('scroll', handler);
    return () => {
      window.visualViewport?.removeEventListener('resize', handler);
      window.visualViewport?.removeEventListener('scroll', handler);
    };
  }, [containerRef]);
}

// ── Creator vs Public Clarity ─────────────────────────────────
// 4E.4: Klare Trennung Owner/Public im Code
// Wird von Components genutzt um Owner-Buttons bedingt zu rendern
export function useViewMode(currentUser, profileUserId) {
  const isOwner = !!(currentUser?.id && profileUserId &&
                    String(currentUser.id) === String(profileUserId));
  return {
    isOwner,
    isPublic: !isOwner,
    mode:     isOwner ? 'owner' : 'public',
  };
}

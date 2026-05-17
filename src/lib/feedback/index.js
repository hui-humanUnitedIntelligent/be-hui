// src/lib/feedback/index.js
// HUI — Feedback System — Phase 4E.5
// ═══════════════════════════════════════════════════════════════
//
// PRINZIP: Ein System für alle Feedback-Typen.
// Subtil, ruhig, hochwertig. Kein Alert(). Kein Chaos.
//
// Nutzt sonner (toast) als Renderer — bereits installiert.
// Alle feedback()-Calls gehen durch diese zentrale API.
//
// ── Feedback-Typen ────────────────────────────────────────────
//   success  — grüner Ton, kurz (2s)
//   error    — ruhiges Rot, mittel (4s)
//   info     — neutral, kurz (2.5s)
//   loading  — persistent bis dismiss
//   retry    — mit Action-Button
//   offline  — persistent, auto-dismiss bei reconnect
// ═══════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { toast } from 'sonner';

// ── Design Tokens ─────────────────────────────────────────────
const HUI_TOAST_STYLE = {
  fontFamily: 'inherit',
  fontSize:   14,
  fontWeight: 500,
  borderRadius: 14,
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  padding: '12px 16px',
  background: '#FFFFFF',
  color: '#1A1A1A',
};

const TEAL  = '#16D7C5';
const CORAL = '#FF8A6B';

// ── feedback() — Hauptfunktion ────────────────────────────────
export const feedback = {

  // Erfolg — grüner Punkt, kurze Bestätigung
  success(message, { description, duration = 2000 } = {}) {
    return toast(message, {
      description,
      duration,
      style: {
        ...HUI_TOAST_STYLE,
        borderLeft: `3px solid ${TEAL}`,
      },
      icon: '✓',
    });
  },

  // Fehler — ruhig, kein Alarm
  error(message, { description, duration = 4000, action } = {}) {
    return toast(message, {
      description: description || 'Bitte versuche es erneut.',
      duration,
      style: {
        ...HUI_TOAST_STYLE,
        borderLeft: `3px solid ${CORAL}`,
      },
      icon: '○',
      action: action ? {
        label: action.label || 'Erneut',
        onClick: action.onClick,
      } : undefined,
    });
  },

  // Info — neutral
  info(message, { description, duration = 2500 } = {}) {
    return toast(message, {
      description,
      duration,
      style: HUI_TOAST_STYLE,
      icon: '·',
    });
  },

  // Loading — persistent, muss dismisst werden
  loading(message, { description } = {}) {
    return toast.loading(message, {
      description,
      style: HUI_TOAST_STYLE,
    });
  },

  // Loading dismiss (nach Erfolg/Fehler)
  dismiss(toastId) {
    if (toastId) toast.dismiss(toastId);
    else toast.dismiss();
  },

  // Optimistic — sofortige Bestätigung, kann rückgängig gemacht werden
  optimistic(message, { onUndo, undoLabel = 'Rückgängig', duration = 3000 } = {}) {
    return toast(message, {
      duration,
      style: {
        ...HUI_TOAST_STYLE,
        borderLeft: `3px solid ${TEAL}`,
      },
      icon: '✓',
      action: onUndo ? {
        label: undoLabel,
        onClick: onUndo,
      } : undefined,
    });
  },

  // Offline — persistent
  offline() {
    return toast('Keine Verbindung', {
      description: 'Wird automatisch verbunden…',
      duration: Infinity,
      style: {
        ...HUI_TOAST_STYLE,
        borderLeft: '3px solid #CCC',
      },
      icon: '○',
    });
  },

  // Retry — mit Retry-Button
  retry(message, { onRetry, duration = 5000 } = {}) {
    return toast(message, {
      duration,
      style: {
        ...HUI_TOAST_STYLE,
        borderLeft: `3px solid ${CORAL}`,
      },
      icon: '○',
      action: {
        label: 'Erneut versuchen',
        onClick: onRetry,
      },
    });
  },
};

// ── Convenience-Shortcuts ─────────────────────────────────────
export const notifySuccess = (msg, opts) => feedback.success(msg, opts);
export const notifyError   = (msg, opts) => feedback.error(msg, opts);
export const notifyInfo    = (msg, opts) => feedback.info(msg, opts);

// ── Standard-Nachrichten ──────────────────────────────────────
// Einheitliche Sprache für häufige Aktionen
export const FEEDBACK_MESSAGES = {
  // Booking
  bookingSent:      () => feedback.success('Anfrage gesendet', { description: 'Du erhältst eine Antwort in Kürze.' }),
  bookingAccepted:  () => feedback.success('Buchung bestätigt ✓'),
  bookingDeclined:  () => feedback.info('Anfrage abgelehnt'),
  bookingCancelled: () => feedback.info('Buchung abgesagt'),

  // Chat
  messageSent:   () => {},  // kein Toast — Chat ist selbst Feedback
  messageError:  () => feedback.retry('Nachricht nicht gesendet', { onRetry: () => {} }),

  // Profile
  profileSaved:  () => feedback.success('Gespeichert'),
  profileError:  () => feedback.error('Fehler beim Speichern'),

  // Content
  workPublished:    () => feedback.success('Veröffentlicht ✓'),
  storyPublished:   () => feedback.success('Story ist online ✓'),
  experiencePublished: () => feedback.success('Erlebnis veröffentlicht ✓'),

  // Social
  followed:    (name) => feedback.success(`Du folgst jetzt ${name || 'diesem Talent'}`),
  unfollowed:  ()     => feedback.info('Nicht mehr gefolgt'),
  saved:       ()     => feedback.optimistic('Gespeichert', { onUndo: null }),
  liked:       ()     => {},  // kein Toast — Like-Button ist Feedback

  // Generic
  copied:      () => feedback.success('Kopiert'),
  offline:     () => feedback.offline(),
  networkError:() => feedback.retry('Verbindungsproblem', { onRetry: null }),
  unknownError:() => feedback.error('Etwas ist schiefgelaufen'),
};

// ── useFeedback Hook ──────────────────────────────────────────
// Convenience hook für Komponenten.

export function useFeedback() {
  const success = useCallback((msg, opts) => feedback.success(msg, opts), []);
  const error   = useCallback((msg, opts) => feedback.error(msg, opts), []);
  const info    = useCallback((msg, opts) => feedback.info(msg, opts), []);
  const loading = useCallback((msg, opts) => feedback.loading(msg, opts), []);
  const dismiss = useCallback((id) => feedback.dismiss(id), []);

  return { success, error, info, loading, dismiss, MESSAGES: FEEDBACK_MESSAGES };
}
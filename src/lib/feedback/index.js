// src/lib/feedback/index.js
// Stub — Feedback-System wurde in Phase A entfernt
// bookingContext + chatContext importieren feedback und FEEDBACK_MESSAGES

export const FEEDBACK_MESSAGES = {
  booking_requested:  'Buchungsanfrage gesendet.',
  booking_accepted:   'Buchung bestätigt.',
  booking_declined:   'Buchungsanfrage abgelehnt.',
  booking_cancelled:  'Buchung storniert.',
  message_sent:       'Nachricht gesendet.',
  error_generic:      'Ein Fehler ist aufgetreten.',
};

/**
 * Zeigt Nutzer-Feedback an.
 * Stub: gibt Nachricht an console.warn weiter (kein UI-Toast ohne Toast-System).
 * @param {string} key  — Key aus FEEDBACK_MESSAGES
 * @param {'success'|'error'|'info'} [type]
 */
export function feedback(key, type = 'info') {
  const msg = FEEDBACK_MESSAGES[key] || key;
  // Kein UI-Toast in Stub — silent no-op
  void msg;
  void type;
}

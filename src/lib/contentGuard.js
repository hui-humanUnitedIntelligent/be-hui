// src/lib/contentGuard.js
// CONTENT-GUARD-001 (2026-09-15, Michael-Spec Teil 2 "Content Awareness Guard"):
// Intelligenter Keyword-Guard fuer Chats. Wenn Nachrichten Keywords enthalten,
// die auf Off-App-Transaktionen hindeuten (Zahlungswege, Bankdaten,
// Kontaktmigration, Direkt-Deals), wird ein freundliches Awareness-Element
// als System-Nachricht (message_type 'system_awareness') IN den Chatlauf
// eingefuegt — permanent sichtbar fuer BEIDE Parteien, nicht blockierend,
// nicht schliessbar. Der Chat laeuft normal weiter.
//
// Speicherung: die Awareness laeuft als ganz normale Row durch die
// bestehende messages-Tabelle (message_type='system_awareness', text leer —
// der sichtbare Text kommt aus i18n chat.awareness.* je Anzeigesprache).
// Logging fuer den SADB-Tab "Chat Content Guard": content_guard_logs-Tabelle
// (Migration 142, RLS: Clients loggen nur eigene Events; Admin liest via
// Service-Role).
import { supabase } from "./supabaseClient.js";

// ── Keywords (Michael-Spec, wortgrenzen-scharf gegen False Positives) ──
// Kurze Wort-Keywords wie "wise"/"teuer" werden mit Wortgrenzen geprueft —
// "otherwise" oder "preise" triggern dadurch NICHT ("wise"-SubString-Bug).
// Nur Token mit Sonderzeichen (URLs, @, #) laufen als SubString-Match.
const CONTENT_GUARD_KEYWORDS = {
  payment_methods: ["revolut", "paypal", "transferwise", "wise", "n26", "payoneer", "stripe"],
  bank_data:      ["bankdaten", "iban", "bic", "account number", "sort code"],
  contact_exchange: ["telefon", "phone", "handynummer", "whatsapp", "telegram", "email", "instagram", "facebook", "tiktok"],
  direct_deal:    ["ich kaufe von dir", "du verkaufst mir", "privat kaufen", "außerhalb", "umgehen die app"],
  fee_complaints: ["gebühren zu hoch", "fees too high", "teuer", "abzocke"],
  links_and_handles: ["http://", "https://", "www.", "@handle", "#tag"],
};

// Kritische Kategorien (1 Treffer genuegt) vs. mittlere (>=2 noetig)
const CRITICAL_CATEGORIES = ["payment_methods", "bank_data", "direct_deal"];
const MEDIUM_CATEGORIES    = ["contact_exchange"];

// Match-Cache fuer die Word-Boundary-Regexes (einmal kompiliert pro Keyword)
const _matchers = {};
function keywordMatcher(keyword) {
  if (_matchers[keyword]) return _matchers[keyword];
  // Sonderzeichen (URL/@/#) → SubString; reine Worte → Wortgrenzen
  const needsBoundary = /^[\p{L}\p{N}\s'-]+$/u.test(keyword);
  _matchers[keyword] = needsBoundary
    ? { test: (hay) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(keyword)}($|[^\\p{L}\\p{N}])`, "iu").test(hay) }
    : { test: (hay) => hay.includes(keyword) };
  return _matchers[keyword];
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

// Alle Trigger einer Nachricht (Spec-Signatur: detectContentGuardTriggers)
export function detectContentGuardTriggers(message) {
  const lower = (message || "").toLowerCase();
  const triggers = [];
  if (!lower.trim()) return triggers;
  for (const [category, keywords] of Object.entries(CONTENT_GUARD_KEYWORDS)) {
    for (const keyword of keywords) {
      if (keywordMatcher(keyword).test(lower)) {
        triggers.push({ category, keyword });
      }
    }
  }
  return triggers;
}

// Schwelle (Spec-Signatur: shouldShowAwareness) — False-Positiv-Minimierung:
// 1 kritischer Treffer ODER 2 Kontakt-Treffer ODER 3 Treffer gesamt.
export function shouldShowAwareness(triggers = []) {
  const critical = triggers.filter(t => CRITICAL_CATEGORIES.includes(t.category));
  const medium   = triggers.filter(t => MEDIUM_CATEGORIES.includes(t.category));
  return critical.length >= 1 || medium.length >= 2 || triggers.length >= 3;
}

// ── SSOT: Awareness erstellen (Sender- UND Empfaenger-Seite geteilt) ──
// Dedup: max. EINE Awareness pro Chat und 24h — sonst wuerde jede Folge-
// nachricht ("ja, paypal") ein neues Element spamen. Permanenz bedeutet hier:
// das Element hat keinen Close-Button (MessageBubble rendert es ohne
// Schliessmoeglichkeit), nicht: pro Nachricht einfuegen.
const DEDUP_WINDOW_HOURS = 24;

export async function maybeCreateAwarenessMessage({
  chatId, text, senderId, messageId = null, delayMs = 0,
}) {
  if (!chatId || !senderId || !text) return { created: false };
  const triggers = detectContentGuardTriggers(text);
  if (!triggers.length || !shouldShowAwareness(triggers)) return { created: false };

  // Empfaenger-Seite: kurze Verzoegerung, damit der Sender-Client (der beim
  // Senden parallel erkennt) zuerst einsetzen kann — schliesst Race-Doppel.
  if (delayMs > 0) {
    await new Promise(r => setTimeout(r, delayMs));
  }

  // Dedup: Awareness in den letzten 24h in diesem Chat?
  try {
    const since = new Date(Date.now() - DEDUP_WINDOW_HOURS * 3600 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("messages")
      .select("id")
      .eq("chat_id", chatId)
      .eq("message_type", "system_awareness")
      .gte("created_at", since)
      .limit(1);
    if (recent?.length) {
      await logGuardEvents({ chatId, messageId, senderId, triggers, awarenessInserted: false });
      return { created: false, deduped: true };
    }
  } catch { /* Dedup-Fehler blockiert nicht — weiter zur Erstellung */ }

  // Awareness als System-Nachricht in den Chatlauf einfuegen (normal weiter-
  // laufender Chat: einfuegen NACH der getriggerten Nachricht, kein Modal,
  // nicht blockierend). sender_id = Ausloeser (RLS: eigene Rows einfuegen);
  // die Anzeige ist unabaengig vom Sender zentriert (MessageBubble-Fruehzweig).
  const { error } = await supabase
    .from("messages")
    .insert({
      chat_id:       chatId,
      sender_id:     senderId,
      text:          "",
      message_type:  "system_awareness",
      read:          false,
      created_at:    new Date().toISOString(),
    });
  if (error) {
    console.warn("[ContentGuard] awareness insert failed:", error?.message);
    return { created: false, error: error.message };
  }

  await logGuardEvents({ chatId, messageId, senderId, triggers, awarenessInserted: true });
  return { created: true };
}

// Logging fuer SADB "Chat Content Guard" (1 Row pro Keyword-Treffer).
// Best-Effort: Log-Fehler blockieren den Chat NIEMALS.
async function logGuardEvents({ chatId, messageId, senderId, triggers, awarenessInserted }) {
  if (!awarenessInserted) return; // nur echte Awareness-Events zaehlen (keine Dedup-Spam-Rows)
  try {
    await supabase.from("content_guard_logs").insert(
      triggers.map(t => ({
        chat_id:    chatId,
        message_id: messageId,
        user_id:    senderId,
        category:   t.category,
        keyword:    t.keyword,
      }))
    );
  } catch { /* non-critical */ }
}

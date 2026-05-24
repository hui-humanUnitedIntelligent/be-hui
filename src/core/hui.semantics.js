// src/core/hui.semantics.js — HUI ACTION SEMANTICS v1
// ══════════════════════════════════════════════════════════════════
// PHASE 2C: Action Semantics
//
// MISSION:
//   HUI soll nicht nur reagieren — sondern die BEDEUTUNG einer Aktion verstehen.
//
// WAS DIESES MODUL MACHT:
//   1. normalizeRecipient()  — Rohe Profile → sicheres Chat-Recipient-Objekt
//   2. normalizeCreator()    — Rohe Profil-Daten → semantisch vollständiges Creator-Objekt
//   3. normalizeExperience() — Rohe Experience → vollständiges Buchungs-Objekt
//   4. INTENT-Konstanten     — Was will der User wirklich?
//   5. Semantic Guards       — Payload-Validierung auf Bedeutungs-Ebene
//
// DESIGN-PRINZIP:
//   Der Payload einer Action ist keine technische Datenstruktur —
//   er trägt den INTENT des Nutzers.
//
//   NICHT: openChat({ user_id: "abc", full_name: "Mia Kern" })
//   SONDERN: openChat({ recipient: normalizeRecipient(mia), source: S.VISITOR_PROFILE })
//
// ══════════════════════════════════════════════════════════════════

import { S } from "./hui.sources.js";

// ─── User Intent Konstanten ────────────────────────────────────────
// Was will der Nutzer wirklich — nicht was der Button macht.
export var INTENT = Object.freeze({
  // Verbindung
  CONNECT:       "connect",       // Mit jemandem in Kontakt kommen
  MESSAGE:       "message",       // Eine Nachricht senden
  BOOK:          "book",          // Einen Raum/Zeit reservieren
  FOLLOW:        "follow",        // Verbindung aufrechterhalten

  // Entdecken
  DISCOVER:      "discover",      // Jemanden kennenlernen
  EXPLORE:       "explore",       // Ein Erlebnis erkunden
  INSPIRE:       "inspire",       // Inspiration suchen

  // Beitragen
  RESONATE:      "resonate",      // Etwas unterstützen, bestätigen
  SHARE:         "share",         // Weitergeben, empfehlen
  IMPACT:        "impact",        // Wirkung erzeugen

  // Erstellen
  CREATE:        "create",        // Etwas erschaffen
  PUBLISH:       "publish",       // Etwas veröffentlichen

  // Navigation
  RETURN:        "return",        // Zurückkehren
  ORIENT:        "orient",        // Orientierung finden
});

// ─── normalizeRecipient ────────────────────────────────────────────
// Rohe Profile-Objekte kommen in vielen Formen (supabase, mock, partial).
// Diese Funktion macht daraus ein konsistentes Chat-Recipient-Objekt.
//
// Garantierter Output:
//   { id, display_name, avatar_url, talent?, verified? }
//   Alle Felder haben sinnvolle Fallbacks — niemals undefined.
//
// Rohe Felder die gemappt werden:
//   id: user_id | id | profile_id
//   display_name: display_name | name | full_name | username | "Creator"
//   avatar_url: avatar_url | img | photo_url | avatar | null
//   talent: talent | role | speciality | null

export function normalizeRecipient(raw) {
  if (!raw || typeof raw !== "object") {
    return { id: null, display_name: "Creator", avatar_url: null };
  }

  var id = raw.id || raw.user_id || raw.profile_id || null;
  var display_name = (
    raw.display_name ||
    raw.name         ||
    raw.full_name    ||
    raw.username     ||
    "Creator"
  );
  var avatar_url = (
    raw.avatar_url ||
    raw.img        ||
    raw.photo_url  ||
    raw.avatar     ||
    null
  );
  var talent  = raw.talent || raw.role || raw.speciality || null;
  var verified = raw.verified || raw.is_verified || false;

  return {
    id:           id,
    display_name: display_name,
    avatar_url:   avatar_url,
    talent:       talent,
    verified:     verified,
    // Roh-Objekt als Referenz behalten (für Profil-Reopen)
    _raw:         raw,
  };
}

// ─── normalizeCreator ──────────────────────────────────────────────
// Für OPEN_PROFILE und BOOK_EXPERIENCE: vollständiges Creator-Objekt.
//
// Garantierter Output:
//   { id, display_name, avatar_url, talent, location?, bio? }

export function normalizeCreator(raw) {
  if (!raw || typeof raw !== "object") {
    return { id: null, display_name: "Creator", avatar_url: null };
  }

  var recipient = normalizeRecipient(raw);
  return Object.assign({}, recipient, {
    location: raw.location || raw.city || null,
    bio:      raw.bio || raw.description || null,
    hourly_rate: raw.hourly_rate || raw.rate || null,
    header_img:  raw.header_img || raw.cover_url || null,
    impact_eur:  raw.impact_eur || null,
    bookings:    raw.bookings   || 0,
    followers:   raw.followers  || 0,
  });
}

// ─── normalizeExperience ───────────────────────────────────────────
// Für BOOK_EXPERIENCE und OPEN_EXPERIENCE.
//
// Garantierter Output:
//   { id, name, price, duration, creator_id?, category? }

export function normalizeExperience(raw) {
  if (!raw || typeof raw !== "object") {
    return { id: null, name: "Erlebnis", price: null, duration: null };
  }

  var id = raw.id || raw.experience_id || null;
  var name = (
    raw.name  ||
    raw.title ||
    raw.label ||
    "Erlebnis"
  );
  var price = raw.price || raw.hourly_rate || raw.rate || null;
  var duration = raw.duration || raw.hours || null;
  var creator_id = raw.creator_id || raw.wirker_id || raw.user_id || null;
  var category = raw.category || raw.type || null;

  return {
    id:          id,
    name:        name,
    price:       price,
    duration:    duration,
    creator_id:  creator_id,
    category:    category,
    description: raw.description || raw.bio || null,
    _raw:        raw,
  };
}

// ─── buildChatPayload ──────────────────────────────────────────────
// Baut einen semantisch korrekten OPEN_CHAT Payload.
// Stellt sicher dass source, intent und recipient korrekt gesetzt sind.
//
// USAGE in Komponenten:
//   actions[A.OPEN_CHAT](buildChatPayload(profile, S.VISITOR_PROFILE));

export function buildChatPayload(rawProfile, source, intent) {
  return {
    recipient: normalizeRecipient(rawProfile),
    source:    source    || S.SYSTEM,
    intent:    intent    || INTENT.CONNECT,
  };
}

// ─── buildBookPayload ──────────────────────────────────────────────
// Baut einen semantisch korrekten BOOK_EXPERIENCE Payload.
//
// USAGE:
//   actions[A.BOOK_EXPERIENCE](buildBookPayload(experience, creator, S.VISITOR_PROFILE));

export function buildBookPayload(rawExperience, rawCreator, source) {
  return {
    experience: normalizeExperience(rawExperience),
    creator:    rawCreator ? normalizeCreator(rawCreator) : null,
    source:     source || S.SYSTEM,
    intent:     INTENT.BOOK,
  };
}

// ─── buildProfilePayload ───────────────────────────────────────────
// Baut einen semantisch korrekten OPEN_PROFILE Payload.
//
// USAGE:
//   actions[A.OPEN_PROFILE](buildProfilePayload(creator, S.DISCOVER));

export function buildProfilePayload(rawCreator, source, extra) {
  var creator = normalizeCreator(rawCreator);
  return Object.assign(
    {
      creator:   creator,
      creatorId: creator.id,
      source:    source || S.SYSTEM,
      intent:    INTENT.DISCOVER,
    },
    extra || {}
  );
}

// ─── Semantic Guard ────────────────────────────────────────────────
// Prüft ob ein Payload semantisch vollständig ist — nicht nur technisch valide.
// Gibt eine Liste fehlender semantischer Felder zurück.
//
// USAGE in DEV:
//   const gaps = checkSemantics("BOOK_EXPERIENCE", payload);
//   if (gaps.length) console.warn("[HUI_SEMANTIC]", gaps);

var SEMANTIC_RULES = {
  OPEN_PROFILE: function(p) {
    var gaps = [];
    var id = p.creatorId || p.creator?.id;
    if (!id) gaps.push("creatorId oder creator.id fehlt — Profil kann nicht korrekt geöffnet werden");
    if (!p.source) gaps.push("source fehlt — Return-Context kann nicht gesetzt werden");
    return gaps;
  },
  OPEN_CHAT: function(p) {
    var gaps = [];
    var rec = p.recipient;
    if (!rec) gaps.push("recipient fehlt — Chat öffnet ohne Kontext");
    else {
      if (!rec.id) gaps.push("recipient.id fehlt — Chat kann Empfänger nicht identifizieren");
      if (!rec.display_name || rec.display_name === "Creator") gaps.push("recipient.display_name ist Fallback — echter Name fehlt");
    }
    if (!p.source) gaps.push("source fehlt — LOOP 1 Return nicht möglich");
    return gaps;
  },
  BOOK_EXPERIENCE: function(p) {
    var gaps = [];
    if (!p.experience) gaps.push("experience fehlt — Buchung hat kein Ziel");
    else {
      if (!p.experience.id) gaps.push("experience.id fehlt — Buchung kann nicht referenziert werden");
      if (!p.experience.name) gaps.push("experience.name fehlt — Buchung zeigt keinen Titel");
    }
    if (!p.creator) gaps.push("creator fehlt — kein Empfänger für Buchungs-Chat");
    else {
      if (!p.creator.id) gaps.push("creator.id fehlt — Chat-Empfänger unbekannt");
    }
    if (!p.source) gaps.push("source fehlt — kein Return nach Buchung");
    return gaps;
  },
  FOLLOW_CREATOR: function(p) {
    var gaps = [];
    if (!p.creatorId) gaps.push("creatorId fehlt — Follow-Target unbekannt");
    return gaps;
  },
  SEND_RESONANCE: function(p) {
    var gaps = [];
    if (!p.targetId) gaps.push("targetId fehlt — Resonanz hat kein Ziel");
    if (!p.type)     gaps.push("type fehlt — Resonanz-Art unbekannt");
    return gaps;
  },
};

var isDev = typeof import.meta !== "undefined"
  ? (import.meta.env?.DEV ?? false)
  : false;

export function checkSemantics(actionName, payload) {
  var rule = SEMANTIC_RULES[actionName];
  if (!rule) return [];
  var gaps = rule(payload || {});
  if (isDev && gaps.length > 0) {
    console.warn(
      "[HUI_SEMANTIC] " + actionName + ": " + gaps.length + " semantische Lücke(n):",
      gaps.join(" | "),
      payload
    );
  }
  return gaps;
}

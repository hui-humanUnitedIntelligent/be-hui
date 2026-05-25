// src/lib/validation/index.js
// HUI — Input Validation Layer — Phase 4C.4
// ═══════════════════════════════════════════════════════════════
// validate() → normalisiertes ValidationResult
// Alle kritischen Mutations gehen durch diese Validierung.
//
// PRINZIP:
// - validate() gibt { valid, errors } zurück — kein throw
// - assertValid() wirft ValidationError
// - Alle Schemas sind einfache Objekt-Definitionen
// ═══════════════════════════════════════════════════════════════

import { ValidationError, ERROR_CODES } from '../errors/index.js';
import { sanitizeInput } from '../security/index.js';

// ── ValidationResult ─────────────────────────────────────────────
function ok(data) {
  return { valid: true, errors: [], data };
}
function fail(errors) {
  return { valid: false, errors: Array.isArray(errors) ? errors : [errors], data: null };
}

// ── assertValid ──────────────────────────────────────────────────
// Wirft ValidationError wenn result.valid === false.
export function assertValid(result) {
  if (!result.valid) {
    throw new ValidationError({
      code:    ERROR_CODES.VALIDATION_FAILED,
      message: result.errors[0] || 'Ungültige Eingabe.',
      context: { errors: result.errors },
    });
  }
  return result.data;
}

// ── Basis-Validators ─────────────────────────────────────────────
const v = {
  required: (val, name) => {
    const s = typeof val === 'string' ? val.trim() : val;
    if (s === null || s === undefined || s === '') return `${name} ist erforderlich.`;
    return null;
  },
  maxLen: (val, max, name) => {
    if (val && String(val).length > max) return `${name} ist zu lang (max. ${max} Zeichen).`;
    return null;
  },
  minLen: (val, min, name) => {
    if (!val || String(val).trim().length < min) return `${name} muss mindestens ${min} Zeichen lang sein.`;
    return null;
  },
  uuid: (val, name) => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!val || !UUID_RE.test(String(val))) return `${name} ist keine gültige ID.`;
    return null;
  },
  enum: (val, allowed, name) => {
    if (!allowed.includes(val)) return `${name} muss einer von [${allowed.join(', ')}] sein.`;
    return null;
  },
  positive: (val, name) => {
    if (typeof val !== 'number' || val <= 0) return `${name} muss eine positive Zahl sein.`;
    return null;
  },
  noScript: (val) => {
    // Einfacher XSS-Guard für textarea/text inputs
    const dangerous = /<script|javascript:|data:text\/html|on\w+=/i;
    if (val && dangerous.test(String(val))) return 'Ungültige Zeichen in der Eingabe.';
    return null;
  },
};

function collect(...errs) {
  const e = errs.filter(Boolean);
  return e.length === 0 ? null : e;
}

// ── SCHEMAS ──────────────────────────────────────────────────────

// validateMessage — Chat-Nachricht
export function validateMessage({ text, chatId, senderId }) {
  const errors = collect(
    v.required(text, 'Nachrichtentext'),
    v.minLen(text, 1, 'Nachrichtentext'),
    v.maxLen(text, 5000, 'Nachrichtentext'),
    v.noScript(text),
    v.uuid(chatId, 'chatId'),
    v.uuid(senderId, 'senderId'),
  );
  if (errors) return fail(errors);

  return ok({
    text: sanitizeInput(text, { maxLength: 5000, allowEmpty: false, fieldName: 'Nachricht' }),
    chatId,
    senderId,
  });
}

// validateBookingRequest — Buchungsanfrage
export function validateBookingRequest({
  creatorId, requesterId, title, description, date, budget, reqType
}) {
  const BOOKING_TYPES = ['project', 'event', 'consultation', 'workshop', 'collab', 'other'];

  const errors = collect(
    v.uuid(creatorId, 'creatorId'),
    v.uuid(requesterId, 'requesterId'),
    v.required(title, 'Titel'),
    v.minLen(title, 3, 'Titel'),
    v.maxLen(title, 200, 'Titel'),
    v.noScript(title),
    description ? v.maxLen(description, 3000, 'Beschreibung') : null,
    description ? v.noScript(description) : null,
    budget !== undefined ? v.positive(Number(budget), 'Budget') : null,
    reqType ? v.enum(reqType, BOOKING_TYPES, 'Buchungstyp') : null,
  );
  if (errors) return fail(errors);

  return ok({
    creatorId,
    requesterId,
    title:       sanitizeInput(title, { maxLength: 200, fieldName: 'Titel' }),
    description: description ? sanitizeInput(description, { maxLength: 3000, allowEmpty: true, fieldName: 'Beschreibung' }) : null,
    date:        date || null,
    budget:      budget ? Number(budget) : null,
    reqType:     reqType || 'other',
  });
}

// validateProfileUpdate — Profil-Update
export function validateProfileUpdate({ displayName, bio, location, hourlyRate }) {
  const errors = collect(
    displayName ? v.minLen(displayName, 2, 'Name') : null,
    displayName ? v.maxLen(displayName, 80, 'Name') : null,
    displayName ? v.noScript(displayName) : null,
    bio ? v.maxLen(bio, 2000, 'Bio') : null,
    bio ? v.noScript(bio) : null,
    location ? v.maxLen(location, 100, 'Standort') : null,
    hourlyRate !== undefined && hourlyRate !== null
      ? v.positive(Number(hourlyRate), 'Stundensatz')
      : null,
  );
  if (errors) return fail(errors);

  return ok({
    display_name: displayName ? sanitizeInput(displayName, { maxLength: 80, fieldName: 'Name' }) : undefined,
    bio:          bio ? sanitizeInput(bio, { maxLength: 2000, allowEmpty: true, fieldName: 'Bio' }) : undefined,
    location:     location ? sanitizeInput(location, { maxLength: 100, allowEmpty: true, fieldName: 'Standort' }) : undefined,
    hourly_rate:  hourlyRate !== undefined && hourlyRate !== null ? Number(hourlyRate) : undefined,
  });
}

// validateRecommendation — Empfehlung
export function validateRecommendation({ toUserId, fromUserId, text, qualities }) {
  const errors = collect(
    v.uuid(toUserId, 'toUserId'),
    v.uuid(fromUserId, 'fromUserId'),
    v.required(text, 'Text'),
    v.minLen(text, 20, 'Empfehlungstext'),
    v.maxLen(text, 2000, 'Empfehlungstext'),
    v.noScript(text),
    // Self-recommendation check
    String(toUserId) === String(fromUserId) ? 'Du kannst keine Selbstempfehlung schreiben.' : null,
  );
  if (errors) return fail(errors);

  return ok({
    to_user_id:   toUserId,
    from_user_id: fromUserId,
    text:         sanitizeInput(text, { maxLength: 2000, fieldName: 'Empfehlung' }),
    qualities:    Array.isArray(qualities) ? qualities.slice(0, 5) : [],
  });
}

// validateComment — Kommentar
export function validateComment({ workId, userId, text }) {
  const errors = collect(
    v.uuid(workId, 'workId'),
    v.uuid(userId, 'userId'),
    v.required(text, 'Kommentar'),
    v.minLen(text, 1, 'Kommentar'),
    v.maxLen(text, 1000, 'Kommentar'),
    v.noScript(text),
  );
  if (errors) return fail(errors);

  return ok({
    work_id:  workId,
    user_id:  userId,
    text:     sanitizeInput(text, { maxLength: 1000, fieldName: 'Kommentar' }),
  });
}

// validateWork — Werk-Erstellung
export function validateWork({ title, description, userId, mediaUrl }) {
  const errors = collect(
    v.required(title, 'Titel'),
    v.minLen(title, 2, 'Titel'),
    v.maxLen(title, 200, 'Titel'),
    v.noScript(title),
    description ? v.maxLen(description, 5000, 'Beschreibung') : null,
    description ? v.noScript(description) : null,
    v.uuid(userId, 'userId'),
  );
  if (errors) return fail(errors);

  return ok({
    title:       sanitizeInput(title, { maxLength: 200, fieldName: 'Titel' }),
    description: description ? sanitizeInput(description, { maxLength: 5000, allowEmpty: true, fieldName: 'Beschreibung' }) : null,
    user_id:     userId,
    media_url:   mediaUrl || null,
  });
}

// validateStoryUpload — Story
export function validateStoryUpload({ userId, mediaUrl, caption, type }) {
  const STORY_TYPES = ['image', 'video', 'text', 'moment'];
  const errors = collect(
    v.uuid(userId, 'userId'),
    type ? v.enum(type, STORY_TYPES, 'Story-Typ') : null,
    caption ? v.maxLen(caption, 300, 'Caption') : null,
    caption ? v.noScript(caption) : null,
    !mediaUrl && type !== 'text' ? 'Media-URL ist erforderlich.' : null,
  );
  if (errors) return fail(errors);

  return ok({
    user_id:   userId,
    media_url: mediaUrl || null,
    caption:   caption ? sanitizeInput(caption, { maxLength: 300, allowEmpty: true, fieldName: 'Caption' }) : null,
    type:      type || 'image',
  });
}

// Canonical entity validation — Story infrastructure
export function validateEntity({ entityType }) {
  const errors = collect(
    v.required(entityType, 'entityType'),
    entityType !== 'story' ? 'entityType muss "story" sein.' : null,
  );
  if (errors) return fail(errors);
  return ok({ entityType: 'story' });
}

export function validateAuthor({ userId }) {
  const errors = collect(v.uuid(userId, 'userId'));
  if (errors) return fail(errors);
  return ok({ user_id: userId });
}

export function validateMedia({ mediaUrl, mediaType, caption, allowText = true }) {
  const STORY_MEDIA_TYPES = ['image', 'video', 'text'];
  const type = mediaType || (mediaUrl ? 'image' : 'text');
  const errors = collect(
    v.enum(type, STORY_MEDIA_TYPES, 'mediaType'),
    caption ? v.maxLen(caption, 300, 'Caption') : null,
    caption ? v.noScript(caption) : null,
    !allowText && !mediaUrl ? 'Media-URL ist erforderlich.' : null,
    !mediaUrl && type !== 'text' ? 'Media-URL ist erforderlich.' : null,
    !mediaUrl && type === 'text' && !caption ? 'Text ist für eine Text-Story erforderlich.' : null,
  );
  if (errors) return fail(errors);

  return ok({
    media_url: mediaUrl || null,
    media_type: type,
    caption: caption
      ? sanitizeInput(caption, { maxLength: 300, allowEmpty: true, fieldName: 'Caption' })
      : null,
  });
}

export function validateVisibility({ visibility = 'public' }) {
  const VISIBILITY = ['public', 'followers', 'friends', 'private'];
  const errors = collect(v.enum(visibility, VISIBILITY, 'visibility'));
  if (errors) return fail(errors);
  return ok({ visibility });
}

// validateExperience — Experience/Erlebnis
export function validateExperience({ title, description, userId, price }) {
  const errors = collect(
    v.required(title, 'Titel'),
    v.minLen(title, 3, 'Titel'),
    v.maxLen(title, 200, 'Titel'),
    v.noScript(title),
    description ? v.maxLen(description, 3000, 'Beschreibung') : null,
    description ? v.noScript(description) : null,
    v.uuid(userId, 'userId'),
    price !== undefined ? v.positive(Number(price), 'Preis') : null,
  );
  if (errors) return fail(errors);

  return ok({
    title:       sanitizeInput(title, { maxLength: 200, fieldName: 'Titel' }),
    description: description ? sanitizeInput(description, { maxLength: 3000, allowEmpty: true, fieldName: 'Beschreibung' }) : null,
    user_id:     userId,
    price:       price ? Number(price) : null,
  });
}

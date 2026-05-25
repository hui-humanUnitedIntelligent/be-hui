// ═══════════════════════════════════════════════════════════════════════

import { normalizeMediaItem, normalizeMediaInput } from "../../contracts/mediaContract.js";
import { VISIBILITY_VALUES, normalizeVisibility } from "../../contracts/visibilityContract.js";
import { validatePublishEntity } from "../../contracts/entityContract.js";
// src/lib/factories/experienceContract.js
// HUI — Experience Schema Contract Layer v1.0
// Phase 4E: Schema-driven publishing
//
// SINGLE SOURCE OF TRUTH für den experiences-Payload.
// Kein Flow darf mehr direkt insertten — immer durch diesen Layer.
//
// DB-Schema (bestätigt 038):
//   id, user_id, title, description, category,
//   mood, mood_tags[], social_energy,
//   price, pricing_type, sale_mode,
//   format, location_text, language, duration,
//   date, available_days[], avail_times[],
//   experience_type, participant_limit, booking_mode,
//   cover_url, media_url, images (jsonb),
//   visibility, status,
//   created_at, updated_at
// ═══════════════════════════════════════════════════════════════════════

// ── Erlaubte Enum-Werte ───────────────────────────────────────────────

export const EXPERIENCE_ENUMS = {
  booking_mode:    ["direct", "request"],
  visibility:      VISIBILITY_VALUES,
  status:          ["published", "draft", "paused", "archived"],
  pricing_type:    ["free", "fixed", "hourly", "inquiry", "donation"],
  experience_type: ["workshop", "coaching", "performance", "tour",
                    "retreat", "online", "event", "other"],
  social_energy:   ["intimate", "small_group", "open", "large"],
  format:          ["online", "onsite", "hybrid"],
};

// ── Images JSONB Format ───────────────────────────────────────────────
// Einziges erlaubtes Format für images-Feld:
// [{ url: string, type: "cover"|"gallery"|"preview", alt: string }]

/**
 * Normalisiert ein einzelnes Bild in das kanonische Format.
 * Akzeptiert: string-URL, { url }, { publicUrl }, { src }
 */
export function normalizeImage(raw, index = 0) {
  return normalizeMediaItem(raw, index, "image");
}

/**
 * Normalisiert ein Array von Bildern → kanonisches JSONB-Array.
 * Output: [{ url, type, alt }]  (nur valide Einträge)
 */
export function normalizeImages(rawImages) {
  return normalizeMediaInput(rawImages, "image");
}

// ── Normalizer ────────────────────────────────────────────────────────

/**
 * normalizeExperiencePayload(raw, userId, uploadedUrls?)
 *
 * Nimmt rohe Form-Daten aus EINEM beliebigen Flow entgegen
 * und gibt einen sauberen, schema-konformen DB-Payload zurück.
 *
 * Feldmapping (Frontend → DB):
 *   form.desc / form.description      → description
 *   form.location / form.locationText → location_text
 *   form.maxParticipants / form.participantLimit → participant_limit
 *   form.bookingMode                  → booking_mode
 *   form.locationType / form.format   → format
 *   form.durationCustom               → duration (wenn duration==="Individuell")
 *   form.availDays / form.availableDays → available_days
 *   form.priceMode / form.pricing_type  → pricing_type
 *   form.experienceType               → experience_type
 *   form.socialEnergy                 → social_energy
 *   form.moodTags                     → mood_tags
 *   uploadedUrls[] / form.images      → images (JSONB)
 */
export function normalizeExperiencePayload(raw, userId, uploadedUrls = []) {
  if (!userId) throw new Error("[HUI_CONTRACT] userId ist required");

  const f = raw || {};

  // ── Images: uploadedUrls haben Priorität über form.images ─────────
  const rawImages = uploadedUrls.length > 0
    ? uploadedUrls
    : (f.images || f.mediaFiles || []);
  const images = normalizeImages(rawImages);

  // ── duration ──────────────────────────────────────────────────────
  const duration = f.duration === "Individuell" || f.duration === "custom"
    ? (f.durationCustom || f.duration_custom || null)
    : (f.duration || null);

  // ── available_days ────────────────────────────────────────────────
  const rawAvailDays = f.available_days || f.availDays || f.avail_days
    || f.availableDays || [];
  const available_days = Array.isArray(rawAvailDays)
    ? rawAvailDays.filter(d => typeof d === "string" && d.length > 0)
    : [];

  // ── mood_tags ─────────────────────────────────────────────────────
  const rawMoodTags = f.mood_tags || f.moodTags || [];
  const mood_tags = Array.isArray(rawMoodTags)
    ? rawMoodTags.filter(t => typeof t === "string" && t.length > 0)
    : [];

  // ── pricing_type ──────────────────────────────────────────────────
  const rawPricingType = f.pricing_type || f.priceMode || f.price_type
    || f.sale_mode || f.priceType || "fixed";
  const pricing_type = EXPERIENCE_ENUMS.pricing_type.includes(rawPricingType)
    ? rawPricingType : "fixed";

  // ── booking_mode ──────────────────────────────────────────────────
  const rawBookingMode = f.booking_mode || f.bookingMode || "direct";
  const booking_mode = EXPERIENCE_ENUMS.booking_mode.includes(rawBookingMode)
    ? rawBookingMode : "direct";

  // ── format ────────────────────────────────────────────────────────
  const rawFormat = f.format || f.locationType || f.location_type || null;
  const format = rawFormat && EXPERIENCE_ENUMS.format.includes(rawFormat)
    ? rawFormat : (rawFormat || null);

  // ── experience_type ───────────────────────────────────────────────
  const rawExpType = f.experience_type || f.experienceType || null;
  const experience_type = rawExpType && EXPERIENCE_ENUMS.experience_type.includes(rawExpType)
    ? rawExpType : (rawExpType || null);

  // ── social_energy ─────────────────────────────────────────────────
  const rawSocialEnergy = f.social_energy || f.socialEnergy || null;
  const social_energy = rawSocialEnergy && EXPERIENCE_ENUMS.social_energy.includes(rawSocialEnergy)
    ? rawSocialEnergy : (rawSocialEnergy || null);

  // ── participant_limit ─────────────────────────────────────────────
  const rawLimit = f.participant_limit || f.participantLimit
    || f.max_participants || f.maxParticipants || null;
  const participant_limit = rawLimit ? parseInt(rawLimit, 10) || null : null;

  // ── price ─────────────────────────────────────────────────────────
  const price = f.price ? parseFloat(f.price) || null : null;

  // ── date — nur YYYY-MM-DD ─────────────────────────────────────────
  const date = f.date
    ? (typeof f.date === "string" ? f.date.substring(0, 10) : null)
    : null;

  // ── cover_url / media_url ─────────────────────────────────────────
  const firstImageUrl = images[0]?.url || null;
  const cover_url = f.cover_url || firstImageUrl || null;
  const media_url = f.media_url || firstImageUrl || null;

  // ── safeStr: trim + null statt leer ──────────────────────────────
  const safeStr = (val) => {
    const s = typeof val === "string" ? val.trim() : (val ? String(val) : "");
    return s.length > 0 ? s : null;
  };

  // ── visibility ────────────────────────────────────────────────────
  const rawVis = f.visibility || "public";
  const visibility = normalizeVisibility(rawVis, "public");

  // ── FINALER PAYLOAD ───────────────────────────────────────────────
  // Nur Felder die wirklich im DB-Schema existieren (038).
  // Kein unbekanntes Feld passiert diesen Layer.
  return {
    user_id:          userId,
    title:            safeStr(f.title) || "Erlebnis",
    description:      safeStr(f.description || f.desc),
    category:         safeStr(f.category),
    mood:             safeStr(f.mood),
    mood_tags:        mood_tags.length > 0 ? mood_tags : null,
    social_energy,
    price,
    pricing_type,
    format,
    location_text:    safeStr(f.location_text || f.locationText || f.location),
    language:         safeStr(f.language) || "Deutsch",
    duration,
    date,
    available_days:   available_days.length > 0 ? available_days : null,
    experience_type,
    participant_limit,
    booking_mode,
    cover_url,
    media_url,
    images,           // JSONB: [{ url, type, alt }]
    visibility,
    status:           "published",
    // created_at + updated_at: auto-filled by DB
  };
}

// ── Validator ─────────────────────────────────────────────────────────

/**
 * validateExperiencePayload(payload)
 *
 * Gibt { valid: true } zurück wenn alles ok,
 * oder { valid: false, errors: string[] } bei Problemen.
 * Wirft NIE einen Fehler — der Caller entscheidet.
 */
export function validateExperiencePayload(payload) {
  const errors = [];

  // Required
  if (!payload.user_id)
    errors.push("user_id fehlt — kein Insert ohne authentifizierten User");
  if (!payload.title || payload.title.trim().length < 2)
    errors.push("title zu kurz (min. 2 Zeichen)");

  // Enums
  if (payload.booking_mode &&
      !EXPERIENCE_ENUMS.booking_mode.includes(payload.booking_mode))
    errors.push(`booking_mode ungültig: "${payload.booking_mode}" — erlaubt: ${EXPERIENCE_ENUMS.booking_mode.join(", ")}`);

  if (payload.visibility &&
      !EXPERIENCE_ENUMS.visibility.includes(payload.visibility))
    errors.push(`visibility ungültig: "${payload.visibility}"`);

  if (payload.status &&
      !EXPERIENCE_ENUMS.status.includes(payload.status))
    errors.push(`status ungültig: "${payload.status}"`);

  if (payload.pricing_type &&
      !EXPERIENCE_ENUMS.pricing_type.includes(payload.pricing_type))
    errors.push(`pricing_type ungültig: "${payload.pricing_type}" — erlaubt: ${EXPERIENCE_ENUMS.pricing_type.join(", ")}`);

  if (payload.experience_type && payload.experience_type !== null &&
      !EXPERIENCE_ENUMS.experience_type.includes(payload.experience_type))
    errors.push(`experience_type ungültig: "${payload.experience_type}"`);

  if (payload.social_energy && payload.social_energy !== null &&
      !EXPERIENCE_ENUMS.social_energy.includes(payload.social_energy))
    errors.push(`social_energy ungültig: "${payload.social_energy}"`);

  // Types
  if (payload.price !== null && payload.price !== undefined &&
      typeof payload.price !== "number")
    errors.push(`price muss number sein, nicht ${typeof payload.price}`);

  if (payload.participant_limit !== null && payload.participant_limit !== undefined &&
      (!Number.isInteger(payload.participant_limit) || payload.participant_limit < 1))
    errors.push("participant_limit muss positive Integer sein");

  // Images JSONB
  if (payload.images !== null && payload.images !== undefined) {
    if (!Array.isArray(payload.images)) {
      errors.push("images muss Array sein (JSONB format: [{url,type,alt}])");
    } else {
      payload.images.forEach((img, i) => {
        if (!img || typeof img !== "object")
          errors.push(`images[${i}] ist kein Objekt`);
        else if (!img.url || typeof img.url !== "string")
          errors.push(`images[${i}].url fehlt oder ist kein String`);
        else if (!img.url.startsWith("http"))
          errors.push(`images[${i}].url ist keine valide HTTP-URL`);
      });
    }
  }

  // Arrays
  if (payload.available_days !== null && payload.available_days !== undefined &&
      !Array.isArray(payload.available_days))
    errors.push("available_days muss Array sein");

  if (payload.mood_tags !== null && payload.mood_tags !== undefined &&
      !Array.isArray(payload.mood_tags))
    errors.push("mood_tags muss Array sein");

  // Date format
  if (payload.date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.date))
    errors.push(`date muss YYYY-MM-DD Format haben, nicht: "${payload.date}"`);

  // Keine leeren Strings
  const stringFields = ["title","description","category","mood","format",
    "location_text","language","duration","experience_type","social_energy",
    "booking_mode","cover_url","media_url","visibility","status","pricing_type"];
  stringFields.forEach(field => {
    if (payload[field] === "")
      errors.push(`${field} ist leerer String — muss null sein`);
  });

  const entityValidation = validatePublishEntity(payload, {
    entityType: "experience",
    sourceTable: "experiences",
    mediaInput: payload.images,
  });
  if (!entityValidation.valid) errors.push(...entityValidation.errors);

  if (errors.length > 0) {
    console.error("[HUI_CONTRACT] ❌ validateExperiencePayload:", errors);
    return { valid: false, errors };
  }

  console.log("[HUI_CONTRACT] ✅ payload valid:", {
    title:        payload.title,
    booking_mode: payload.booking_mode,
    pricing_type: payload.pricing_type,
    images_count: payload.images?.length ?? 0,
    status:       payload.status,
  });
  return { valid: true, errors: [] };
}

// ── publishExperience — EINZIGER erlaubter Insert-Weg ────────────────

/**
 * publishExperience(supabase, rawForm, userId, uploadedUrls?)
 *
 * Der einzige Weg um eine Experience in die DB zu schreiben.
 * Kein direktes supabase.from("experiences").insert() in Flows erlaubt.
 *
 * Flow:
 *   normalizeExperiencePayload()
 *   → validateExperiencePayload()
 *   → console.log("[HUI_EXPERIENCE_PAYLOAD]")
 *   → supabase.insert()
 *
 * Returns:
 *   { data: { id, status, user_id, title }, error: null }  — Erfolg
 *   { data: null, error: { message, errors? } }            — Fehler
 */
export async function publishExperience(supabase, rawForm, userId, uploadedUrls = []) {
  // 1. Normalisieren
  let payload;
  try {
    payload = normalizeExperiencePayload(rawForm, userId, uploadedUrls);
  } catch(e) {
    console.error("[HUI_CONTRACT] normalize failed:", e.message);
    return { data: null, error: { message: e.message } };
  }

  // 2. Validieren
  const { valid, errors } = validateExperiencePayload(payload);
  if (!valid) {
    return {
      data: null,
      error: {
        message: `Schema-Validierung fehlgeschlagen: ${errors[0]}`,
        errors,
      },
    };
  }

  // 3. Log vor Insert — immer sichtbar in Console
  console.log("[HUI_EXPERIENCE_PAYLOAD]", payload);

  // 4. Insert
  const { data, error: dbErr } = await supabase
    .from("experiences")
    .insert(payload)
    .select("id, status, user_id, title")
    .single();

  if (dbErr) {
    console.error("[HUI_PUBLISH_ERROR]", {
      code:    dbErr.code,
      message: dbErr.message,
      hint:    dbErr.hint,
      details: dbErr.details,
    });
    return {
      data: null,
      error: { message: `DB-Fehler: ${dbErr.message} (${dbErr.code})` },
    };
  }

  console.log("[HUI_REALITY] ✓ experience published:", data?.id, "-", data?.title);
  return { data, error: null };
}

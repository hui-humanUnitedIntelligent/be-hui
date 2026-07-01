// src/lib/experienceDetailUtils.js
// Shared helpers for ExperienceDetailPage and commerce cart integration.

import { normalizeImage } from "./factories/experienceContract.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isExperienceUuid(id) {
  return !!id && UUID_RE.test(String(id));
}

export function getExperienceImages(experience) {
  if (!experience) return [];
  const imgs = [];
  const seen = new Set();

  const push = (url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    imgs.push(url);
  };

  push(experience.cover_url);
  push(experience.media_url);

  const rawImages = experience.images;
  if (Array.isArray(rawImages)) {
    rawImages.forEach((img, i) => {
      const normalized = normalizeImage(img, i);
      if (normalized?.url) push(normalized.url);
    });
  } else if (typeof rawImages === "string") {
    try {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed)) {
        parsed.forEach((img, i) => {
          const normalized = normalizeImage(img, i);
          if (normalized?.url) push(normalized.url);
        });
      }
    } catch { /* ignore */ }
  }

  return imgs;
}

export function formatExperiencePrice(experience) {
  if (!experience) return null;
  const { pricing_type, price, price_per, currency } = experience;
  if (pricing_type === "free" || pricing_type === "donation") return "Kostenlos";
  if (pricing_type === "inquiry") return "Auf Anfrage";
  if (price == null || price === "") return null;
  const n = Number(price);
  if (isNaN(n) || n <= 0) return null;
  const cur = currency === "CHF" ? "CHF" : "€";
  const base = n.toFixed(2).replace(".", ",");
  const suffix = price_per ? ` / ${price_per}` : "";
  return cur === "€" ? `${base} €${suffix}` : `${base} ${cur}${suffix}`;
}

export function formatExperienceDate(experience) {
  if (!experience?.date) return null;
  try {
    const d = new Date(experience.date);
    if (isNaN(d.getTime())) return null;
    let out = d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (experience.time_start) out += `, ${experience.time_start} Uhr`;
    if (experience.time_end) out += ` – ${experience.time_end} Uhr`;
    else if (experience.duration) out += ` · ${experience.duration}`;
    return out;
  } catch {
    return experience.date;
  }
}

export function getParticipantInfo(experience) {
  const limit = experience?.participant_limit ?? experience?.max_participants;
  if (limit == null || limit === "") return null;
  const n = parseInt(limit, 10);
  if (!n || n < 1) return null;
  return { limit: n, label: n === 1 ? "1 Platz" : `${n} Plätze` };
}

export function getExperienceTypeLabel(experience) {
  const raw = experience?.experience_type || experience?.category || "";
  const map = {
    workshop: "Workshop",
    event: "Event",
    coaching: "Coaching",
    performance: "Performance",
    tour: "Tour",
    retreat: "Retreat",
    online: "Online",
    kurs: "Kurs",
    ausstellung: "Ausstellung",
    projekt: "Projekt",
  };
  const key = String(raw).toLowerCase();
  return map[key] || (raw ? String(raw) : null);
}

export function canBookExperience(experience, isOwner) {
  if (!experience || isOwner) return false;
  if (!["published", "active", "approved"].includes(experience.status)) return false;
  if (experience.approval_status && experience.approval_status !== "approved") return false;
  if (experience.pricing_type === "inquiry") return false;
  return true;
}

/** Build a WerkeKorb-compatible cart item from a DB experience row. */
export function buildExperienceCartItem(experience, creator) {
  const raw = experience?._raw || experience;
  if (!raw?.id) return null;

  const participantLimit = raw.participant_limit ?? raw.max_participants ?? null;

  return {
    id: raw.id,
    type: "experience",
    title: raw.title || "Erlebnis",
    text: raw.title || "Erlebnis",
    price: raw.price,
    location: raw.location_text || null,
    user_id: raw.user_id,
    author: {
      id: creator?.id || raw.user_id,
      name: creator?.display_name || creator?.name || "Creator",
      avatar: creator?.avatar_url || creator?.avatar || null,
    },
    _raw: {
      ...raw,
      type: "experience",
      max_participants: participantLimit,
      participant_limit: participantLimit,
    },
  };
}

export const EXPERIENCE_DETAIL_SELECT = [
  "id", "user_id", "title", "description", "caption", "category", "experience_type",
  "price", "pricing_type", "price_per", "currency",
  "format", "location_text", "language", "duration",
  "date", "time_start", "time_end",
  "participant_limit", "booking_mode",
  "cover_url", "media_url", "images",
  "visibility", "status", "approval_status",
  "mood", "mood_tags", "social_energy",
  "registration_required", "created_at",
].join(", ");

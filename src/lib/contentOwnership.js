// src/lib/contentOwnership.js
// SELF-COMMERCE-GUARD-001 (2026-09-22)
// Eine einzige, schema-tolerante Eigentümer-Auflösung für alle Commerce-
// Einstiegspunkte. Feed-Items, Preview-Items, Detailseiten und rohe Supabase-
// Zeilen tragen die Besitzer-ID historisch an unterschiedlichen Stellen.

/**
 * Liefert die Besitzer-/Ersteller-ID eines Inhalts oder null.
 * Unterstützt normalisierte Feed-Items und rohe works/talents/experiences-Zeilen.
 */
export function getContentOwnerId(item) {
  if (!item) return null;
  const raw = item._raw || {};
  const nested = item.experience || item.talent || item.work || {};
  const nestedRaw = nested._raw || {};

  return item.author?.id
    || item.creator?.id
    || item.profile?.id
    || item.user_id
    || item.creator_id
    || item.author_id
    || item.userId
    || raw.author?.id
    || raw.creator?.id
    || raw.profile?.id
    || raw.user_id
    || raw.creator_id
    || raw.author_id
    || nested.author?.id
    || nested.creator?.id
    || nested.user_id
    || nested.creator_id
    || nested.author_id
    || nestedRaw.user_id
    || nestedRaw.creator_id
    || nestedRaw.author_id
    || null;
}

/** Strikter Stringvergleich verhindert UUID-/Typ-Mismatches ohne zu raten. */
export function isOwnContent(item, currentUserId) {
  const ownerId = getContentOwnerId(item);
  return Boolean(ownerId && currentUserId && String(ownerId) === String(currentUserId));
}

// Canonical author contract.
// Status: canonical source of truth for creator/user/profile semantics.

const FALLBACK_AUTHOR_NAME = "Creative Human";

function safeStr(value, fallback = "") {
  return value != null && value !== "" ? String(value).trim() : fallback;
}

function safeUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

export function normalizeAuthorProfile(rawProfile = {}, fallbackId = "") {
  const profile = rawProfile || {};
  const name = safeStr(
    profile.display_name || profile.full_name || profile.name || profile.username,
    FALLBACK_AUTHOR_NAME
  );

  return {
    id: safeStr(profile.id || profile.user_id || fallbackId),
    displayName: name,
    name,
    username: safeStr(profile.username || profile.handle),
    avatarUrl: safeUrl(profile.avatar_url || profile.avatar || profile.img),
    avatar: safeUrl(profile.avatar_url || profile.avatar || profile.img),
    talent: safeStr(profile.talent || profile.category),
    location: safeStr(profile.location_label || profile.location),
    verified: Boolean(profile.verified || profile.is_wirker),
  };
}

export function normalizeAuthor(row = {}) {
  const nestedProfile =
    row.authorProfile ||
    row.profile ||
    row.creator ||
    row.author ||
    row.user ||
    row.wirker ||
    {};

  const authorId = safeStr(
    row.authorId ||
    row.author_id ||
    row.user_id ||
    row.creator_id ||
    nestedProfile.id ||
    nestedProfile.user_id
  );

  return {
    authorId,
    authorProfile: normalizeAuthorProfile(nestedProfile, authorId),
  };
}

export function validateAuthor(entityOrAuthor = {}) {
  const authorId = entityOrAuthor.authorId || entityOrAuthor.id || "";
  const errors = [];

  if (!authorId) {
    errors.push("authorId fehlt");
  }

  return {
    valid: errors.length === 0,
    errors,
    value: authorId,
  };
}

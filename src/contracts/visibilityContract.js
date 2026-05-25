// Canonical visibility contract.
// Status: canonical source of truth for platform visibility values.

export const VISIBILITY_VALUES = Object.freeze([
  "public",
  "followers",
  "members",
  "community",
  "local",
  "friends",
  "private",
]);

export const DEFAULT_VISIBILITY = "public";

const VISIBILITY_ALIASES = Object.freeze({
  follower: "followers",
  follow: "followers",
  member: "members",
  friends_only: "friends",
  community_only: "community",
  local_only: "local",
  hidden: "private",
});

export function normalizeVisibility(value, fallback = DEFAULT_VISIBILITY) {
  const raw = value == null || value === "" ? fallback : value;
  if (raw == null || raw === "") return null;
  const key = String(raw).trim().toLowerCase();
  const normalized = VISIBILITY_ALIASES[key] || key;

  if (!VISIBILITY_VALUES.includes(normalized)) {
    return null;
  }

  return normalized;
}

export function validateVisibility(value, { required = true } = {}) {
  const normalized = normalizeVisibility(value, required ? null : DEFAULT_VISIBILITY);
  const errors = [];

  if (!normalized) {
    errors.push(
      `visibility ungueltig: "${value}". Erlaubt: ${VISIBILITY_VALUES.join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    value: normalized,
  };
}

export function isFeedVisible(value) {
  return normalizeVisibility(value, null) === "public";
}

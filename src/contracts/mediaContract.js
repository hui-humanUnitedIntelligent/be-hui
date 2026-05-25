// Canonical media contract.
// Status: canonical source of truth for media attached to any entity.

export const MEDIA_TYPES = Object.freeze(["image", "video", "audio", "file", "text"]);

const URL_FIELDS = ["url", "src", "publicUrl", "media_url", "cover_url", "image_url", "img"];

function safeUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

function inferMediaType(raw, fallback = "image") {
  const explicit = typeof raw === "object" && raw
    ? raw.type || raw.media_type || raw.kind
    : null;

  const candidate = explicit || fallback || "image";
  const normalized = String(candidate).toLowerCase();

  if (normalized.startsWith("video")) return "video";
  if (normalized.startsWith("audio")) return "audio";
  if (MEDIA_TYPES.includes(normalized)) return normalized;
  return "image";
}

function firstUrlFromObject(raw) {
  if (!raw || typeof raw !== "object") return null;
  for (const field of URL_FIELDS) {
    const url = safeUrl(raw[field]);
    if (url) return url;
  }
  return null;
}

export function normalizeMediaItem(raw, index = 0, fallbackType = "image") {
  if (!raw) return null;

  const url = typeof raw === "string" ? safeUrl(raw) : firstUrlFromObject(raw);
  if (!url) return null;

  const type = inferMediaType(raw, fallbackType);

  return {
    type,
    url,
    alt: typeof raw === "object" && raw?.alt ? String(raw.alt) : "",
    width: Number.isFinite(Number(raw?.width)) ? Number(raw.width) : null,
    height: Number.isFinite(Number(raw?.height)) ? Number(raw.height) : null,
    blurhash: typeof raw?.blurhash === "string" ? raw.blurhash : null,
  };
}

export function normalizeMediaInput(rawMedia, fallbackType = "image") {
  if (!rawMedia) return [];

  const list = Array.isArray(rawMedia) ? rawMedia : [rawMedia];
  return list
    .map((item, index) => normalizeMediaItem(item, index, fallbackType))
    .filter(Boolean);
}

export function mediaFromRow(row = {}) {
  const candidates = [];

  if (Array.isArray(row.media)) candidates.push(...row.media);
  else if (row.media) candidates.push(row.media);

  if (Array.isArray(row.images)) candidates.push(...row.images);
  else if (row.images) candidates.push(row.images);

  if (Array.isArray(row.attachments)) candidates.push(...row.attachments);
  else if (row.attachments) candidates.push(row.attachments);

  if (Array.isArray(row.media_urls)) candidates.push(...row.media_urls);

  [
    row.cover_url,
    row.media_url,
    row.image,
    row.img,
    row.src,
    row.expImg,
  ].forEach((value) => {
    if (value) candidates.push(value);
  });

  const seen = new Set();
  return normalizeMediaInput(candidates, row.media_type || row.type || "image")
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
}

export function validateMedia(media, { required = false } = {}) {
  const list = Array.isArray(media) ? media : [];
  const errors = [];

  if (required && list.length === 0) {
    errors.push("media fehlt");
  }

  list.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`media[${index}] ist kein Objekt`);
      return;
    }
    if (!MEDIA_TYPES.includes(item.type)) {
      errors.push(`media[${index}].type ungueltig: "${item.type}"`);
    }
    if (!safeUrl(item.url)) {
      errors.push(`media[${index}].url fehlt oder ist keine HTTP-URL`);
    }
    if (item.width != null && (!Number.isFinite(Number(item.width)) || Number(item.width) < 1)) {
      errors.push(`media[${index}].width muss positiv sein`);
    }
    if (item.height != null && (!Number.isFinite(Number(item.height)) || Number(item.height) < 1)) {
      errors.push(`media[${index}].height muss positiv sein`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    value: list,
  };
}

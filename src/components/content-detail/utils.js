export function fmtPrice(p) {
  if (p == null || p === "") return null;
  const n = Number(p);
  return isNaN(n) ? String(p) : `€ ${n.toFixed(2).replace(".", ",")}`;
}

export function getContentImages(item) {
  const imgs = [];
  if (!item) return [null];

  if (item.cover_url) imgs.push(item.cover_url);

  if (Array.isArray(item.images)) {
    item.images.forEach((raw) => {
      const url = typeof raw === "string" ? raw : raw?.url;
      if (url && url !== item.cover_url && !imgs.includes(url)) imgs.push(url);
    });
  }

  if (item.media_url && !imgs.includes(item.media_url)) {
    imgs.unshift(item.media_url);
  }

  return imgs.length > 0 ? imgs : [null];
}

export function isUuid(id) {
  return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
}

export function formatGermanDate(value, options = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("de-DE", options);
  } catch {
    return String(value);
  }
}

export function formatTime(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) {
    return value.slice(0, 5) + " Uhr";
  }
  try {
    return new Date(value).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
  } catch {
    return String(value);
  }
}

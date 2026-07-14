// src/lib/huiImageUtils.js — HUI Image URL & Responsive Helpers (P5)
// Zentrale Logik für srcset, Optimierung und LQIP-Erkennung.

const UNSPLASH_WIDTHS = [320, 480, 640, 960, 1280];

/** Optimiert eine Bild-URL für die gewünschte Breite. */
export function optimizeImageUrl(url, width = 800) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?w=${width}&q=80&auto=format&fit=crop`;
  }
  return url;
}

/** Baut srcset für responsive Bilder (nur wenn die Quelle es unterstützt). */
export function buildSrcSet(url, widths = UNSPLASH_WIDTHS) {
  if (!url || typeof url !== "string") return undefined;
  if (!url.includes("unsplash.com")) return undefined;
  return widths.map((w) => `${optimizeImageUrl(url, w)} ${w}w`).join(", ");
}

/** Standard-sizes für gängige Layouts. */
export const IMAGE_SIZES = {
  feed:       "(max-width: 640px) 100vw, 640px",
  profileCover: "100vw",
  profileAvatar: "120px",
  thumb:      "(max-width: 640px) 25vw, 120px",
  card:       "(max-width: 640px) 50vw, 320px",
  hero:       "100vw",
  avatar:     "52px",
  avatarSm:   "38px",
};

/** Prüft ob eine LQIP-Quelle vorhanden ist (Blur-Up möglich). */
export function hasLqip({ thumbnail, blurhash }) {
  return !!(thumbnail || blurhash);
}

let _blurhashDecode = null;

/** Dekodiert Blurhash zu einer Data-URL (Canvas). Lazy-loaded. */
export async function blurhashToDataUrl(hash, width = 32, height = 32) {
  if (!hash || typeof hash !== "string" || typeof document === "undefined") return null;
  try {
    if (!_blurhashDecode) {
      const mod = await import("blurhash");
      _blurhashDecode = mod.decode;
    }
    const pixels = _blurhashDecode(hash, width, height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  } catch {
    return null;
  }
}

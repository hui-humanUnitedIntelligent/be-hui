// api/og-render.cjs — Server-side HUI Social Card rendering (OpenGraph 2.0)
// 1200×630 PNG via sharp + SVG overlays — no browser dependency

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const W = 1200;
const H = 630;

const COLOR = {
  teal: "#0DC4B5",
  coral: "#F47355",
  cream: "#FAF7F2",
  ink: "#141422",
  muted: "#8A8A9E",
  white: "#FFFFFF",
};

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const LOGO_PATH = path.join(PUBLIC_DIR, "assets", "brand", "hui-logo.png");

let logoBufferCache = null;
let defaultBgCache = null;

async function getDefaultBackground() {
  if (defaultBgCache) return defaultBgCache;
  defaultBgCache = await createDefaultBackground();
  return defaultBgCache;
}

// Warm caches on cold start (logo + default background)
try { getLogoBuffer(); } catch { /* ignore */ }
getDefaultBackground().catch(() => {});

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLines(text, maxChars, maxLines = 2) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    if (last.length > maxChars - 1) lines[maxLines - 1] = last.slice(0, maxChars - 2) + "…";
    else lines[maxLines - 1] = last + "…";
  }
  return lines;
}

async function fetchImageBuffer(url, timeoutMs = 2500) {
  if (!url || !url.startsWith("https://")) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;
    return buf;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function getLogoBuffer() {
  if (logoBufferCache) return logoBufferCache;
  try {
    logoBufferCache = fs.readFileSync(LOGO_PATH);
    return logoBufferCache;
  } catch {
    return null;
  }
}

async function createDefaultBackground() {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCF0DF"/>
        <stop offset="45%" stop-color="#F7EBDA"/>
        <stop offset="100%" stop-color="#F2E5D0"/>
      </linearGradient>
      <radialGradient id="glow1" cx="85%" cy="25%" r="60%">
        <stop offset="0%" stop-color="rgba(240,196,106,0.35)"/>
        <stop offset="100%" stop-color="rgba(240,196,106,0)"/>
      </radialGradient>
      <radialGradient id="glow2" cx="10%" cy="15%" r="50%">
        <stop offset="0%" stop-color="rgba(244,115,85,0.22)"/>
        <stop offset="100%" stop-color="rgba(244,115,85,0)"/>
      </radialGradient>
      <radialGradient id="glow3" cx="50%" cy="95%" r="45%">
        <stop offset="0%" stop-color="rgba(13,196,181,0.18)"/>
        <stop offset="100%" stop-color="rgba(13,196,181,0)"/>
      </radialGradient>
      <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${COLOR.teal}"/>
        <stop offset="100%" stop-color="${COLOR.coral}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glow3)"/>
    <circle cx="1050" cy="120" r="180" fill="rgba(13,196,181,0.08)"/>
    <circle cx="150" cy="500" r="220" fill="rgba(244,115,85,0.06)"/>
    <rect x="80" y="80" width="120" height="8" rx="4" fill="url(#brand)" opacity="0.9"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function createCoverBackground(coverBuffer) {
  try {
    return await sharp(coverBuffer)
      .resize(W, H, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
  } catch {
    return getDefaultBackground();
  }
}

function buildOverlaySvg(card) {
  const titleLines = wrapLines(card.title, 34, 2);
  const descLines = wrapLines(card.description, 52, 2);

  const titleY = card.cardType === "wirker" ? 380 : 400;
  let titleSvg = "";
  titleLines.forEach((line, i) => {
    titleSvg += `<text x="72" y="${titleY + i * 58}" font-family="Inter, -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif" font-size="46" font-weight="800" fill="${COLOR.white}" letter-spacing="-0.02em">${escapeXml(line)}</text>\n`;
  });

  let descSvg = "";
  const descStartY = titleY + titleLines.length * 58 + 18;
  descLines.forEach((line, i) => {
    descSvg += `<text x="72" y="${descStartY + i * 30}" font-family="Inter, -apple-system, sans-serif" font-size="22" font-weight="400" fill="rgba(255,255,255,0.88)">${escapeXml(line)}</text>\n`;
  });

  let metaSvg = "";
  if (card.category) {
    metaSvg += `<rect x="72" y="72" width="${Math.min(card.category.length * 11 + 36, 280)}" height="34" rx="17" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
    <text x="90" y="94" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="${COLOR.white}" letter-spacing="0.12em">${escapeXml(card.category.toUpperCase())}</text>`;
  }

  if (card.price && (card.cardType === "werk" || card.cardType === "erlebnis")) {
    metaSvg += `<text x="72" y="${descStartY + descLines.length * 30 + 36}" font-family="Inter, sans-serif" font-size="28" font-weight="800" fill="${COLOR.teal}">${escapeXml(card.price)}</text>`;
  }

  if (card.cardType === "veranstaltung") {
    const eventMeta = [card.date, card.time, card.location].filter(Boolean);
    eventMeta.forEach((line, i) => {
      metaSvg += `<text x="72" y="${descStartY + i * 32}" font-family="Inter, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.92)">${escapeXml(line)}</text>\n`;
    });
  }

  if (card.cardType === "wirker" && card.location) {
    metaSvg += `<text x="72" y="${descStartY}" font-family="Inter, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.88)">${escapeXml(card.location)}</text>\n`;
  }

  if (card.subtitle && card.cardType === "werk") {
    metaSvg += `<text x="72" y="${descStartY + descLines.length * 30 + 8}" font-family="Inter, sans-serif" font-size="20" font-weight="500" fill="rgba(255,255,255,0.75)">${escapeXml(card.subtitle)}</text>\n`;
  }

  if (card.subtitle && card.cardType === "wirker") {
    metaSvg += `<text x="72" y="560" font-family="Inter, sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.7)">${escapeXml(card.subtitle)}</text>\n`;
  }

  if (card.authorName && card.cardType === "beitrag") {
    metaSvg += `<text x="148" y="572" font-family="Inter, sans-serif" font-size="20" font-weight="700" fill="${COLOR.white}">${escapeXml(card.authorName)}</text>\n`;
  }

  const resonanceSvg = card.cardType === "wirker"
    ? `<circle cx="1080" cy="180" r="72" fill="none" stroke="url(#brand)" stroke-width="5" opacity="0.55"/>
       <circle cx="1080" cy="180" r="52" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>`
    : "";

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(20,20,34,0.05)"/>
        <stop offset="35%" stop-color="rgba(20,20,34,0.15)"/>
        <stop offset="100%" stop-color="rgba(20,20,34,0.82)"/>
      </linearGradient>
      <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${COLOR.teal}"/>
        <stop offset="100%" stop-color="${COLOR.coral}"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#fade)"/>
    <rect x="48" y="${H - 280}" width="${W - 96}" height="232" rx="32" fill="rgba(255,252,248,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" filter="url(#shadow)"/>
    ${resonanceSvg}
    ${metaSvg}
    ${titleSvg}
    ${card.cardType !== "veranstaltung" ? descSvg : ""}
    <rect x="72" y="${H - 28}" width="80" height="4" rx="2" fill="url(#brand)" opacity="0.85"/>
    <text x="1040" y="${H - 42}" text-anchor="end" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,0.55)" letter-spacing="0.08em">HUI</text>
  </svg>`;
}

async function compositeAvatar(base, avatarBuffer, cardType) {
  if (!avatarBuffer) return base;
  try {
    const size = cardType === "wirker" ? 200 : 64;
    const left = cardType === "wirker" ? 72 : 72;
    const top = cardType === "wirker" ? 140 : H - 88;

    const avatar = await sharp(avatarBuffer)
      .resize(size, size, { fit: "cover" })
      .png()
      .toBuffer();

    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
    );

    const rounded = await sharp(avatar)
      .composite([{ input: await sharp(mask).png().toBuffer(), blend: "dest-in" }])
      .png()
      .toBuffer();

    const ringSize = size + 6;
    const ringSvg = Buffer.from(
      `<svg width="${ringSize}" height="${ringSize}">
        <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${size / 2 + 2}" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="3"/>
      </svg>`
    );

    return sharp(base).composite([
      { input: rounded, left: left, top: top },
      { input: await sharp(ringSvg).png().toBuffer(), left: left - 3, top: top - 3 },
    ]).png().toBuffer();
  } catch {
    return base;
  }
}

async function compositeLogo(base) {
  const logo = getLogoBuffer();
  if (!logo) return base;
  try {
    const resized = await sharp(logo)
      .resize(96, 36, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    return sharp(base).composite([{ input: resized, left: W - 120, top: H - 72 }]).png().toBuffer();
  } catch {
    return base;
  }
}

async function renderCard(card) {
  const coverBuf = card.coverImage ? await fetchImageBuffer(card.coverImage) : null;
  const avatarBuf = card.authorAvatar ? await fetchImageBuffer(card.authorAvatar) : null;

  let base = coverBuf
    ? await createCoverBackground(coverBuf)
    : await getDefaultBackground();

  const overlaySvg = Buffer.from(buildOverlaySvg(card));
  const overlayPng = await sharp(overlaySvg).png().toBuffer();

  base = await sharp(base).composite([{ input: overlayPng, top: 0, left: 0 }]).png().toBuffer();

  const avatarSource = card.cardType === "wirker" ? (avatarBuf || coverBuf) : avatarBuf;
  base = await compositeAvatar(base, avatarSource, card.cardType);
  base = await compositeLogo(base);

  return sharp(base)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

module.exports = {
  renderCard,
  W,
  H,
};

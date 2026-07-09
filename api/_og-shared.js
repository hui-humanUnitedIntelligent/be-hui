// api/_og-shared.js — HUI OpenGraph Shared Logic (2026-07-09)
// Gemeinsame Datenauflösung für api/og.js (HTML-Meta) und api/og-image.js (Bildauslieferung).
// Bots laden nur die benötigten Felder — kein select("*").

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const APP_ORIGIN       = process.env.VITE_APP_ORIGIN
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "https://be-hui.app";

const BOT_PATTERNS = [
  "facebookexternalhit", "twitterbot", "slackbot", "telegrambot",
  "discordbot", "linkedinbot", "whatsapp", "imessage", "applebot",
  "googlebot", "bingbot", "ia_archiver", "pinterest", "vkshare",
  "xing-contenttabreceiver",
];

const VERCEL_BOT_REGEX =
  "(?i).*(facebookexternalhit|twitterbot|slackbot|telegrambot|discordbot|linkedinbot|whatsapp|imessage|applebot|googlebot|bingbot|pinterest|vkshare|ia_archiver|xing-contenttabreceiver).*";

function isBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some(p => lower.includes(p));
}

async function supabaseGet(table, column, value, fields) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) return null;
  const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=${fields}&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE,
      Authorization: `Bearer ${SUPABASE_SERVICE}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] || null;
}

function escape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function clamp(str, max = 180) {
  if (!str) return "";
  const s = String(str).replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function firstHttpUrl(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "string" && c.startsWith("http")) return c;
    if (Array.isArray(c) && c.length > 0) {
      const first = c[0];
      const u = typeof first === "string" ? first : first?.url;
      if (u && u.startsWith("http")) return u;
    }
  }
  return null;
}

function formatPrice(price) {
  if (price == null || price === "") return null;
  const n = Number(price);
  if (Number.isNaN(n)) return null;
  return n === 0 ? "Kostenlos" : `${n.toFixed(0)} €`;
}

function formatEventDate(startsAt, timeLabel) {
  if (timeLabel) return timeLabel;
  if (!startsAt) return null;
  try {
    return new Date(startsAt).toLocaleDateString("de-DE", {
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return null;
  }
}

async function loadAuthor(userId) {
  if (!userId) return null;
  return supabaseGet("profiles", "id", userId, "display_name,username,avatar_url,header_img,talent,location_label");
}

function buildOgImagePath(type, id) {
  return `/api/og-image/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
}

function buildDefaultOgImagePath() {
  return "/api/og-image/default";
}

function absoluteOgImageUrl(origin, type, id) {
  return `${origin}${buildOgImagePath(type, id)}`;
}

function absoluteDefaultOgImageUrl(origin) {
  return `${origin}${buildDefaultOgImagePath()}`;
}

// ─── Titel-Vorlagen (max. ~60 Zeichen) ───────────────────────────

function titleBeitrag(authorName) {
  const name = authorName || "Jemand";
  return clamp(`${name} hat einen neuen Beitrag veröffentlicht`, 60);
}

function titleWerk(workTitle, authorName) {
  const title = workTitle || "Werk";
  const author = authorName || "einem Wirker";
  return clamp(`${title} – Werk von ${author}`, 60);
}

function titleWirker(displayName) {
  const name = displayName || "Wirker";
  return clamp(`${name} – Wirker auf HUI`, 60);
}

function titlePlain(value, fallback) {
  return clamp(value || fallback, 60);
}

// ─── Beschreibungs-Vorlagen ──────────────────────────────────────

function descBeitrag(caption) {
  return clamp(caption, 140);
}

function descWerk(category, price) {
  const parts = [category, formatPrice(price)].filter(Boolean);
  return parts.join(" · ") || "";
}

function descWirker(talent, location) {
  return [talent, location].filter(Boolean).join(" · ");
}

function descProjekt(description) {
  return clamp(description, 140);
}

function descErlebnis(description) {
  return clamp(description, 140);
}

function descVeranstaltung(startsAt, timeLabel, city, location) {
  const date = formatEventDate(startsAt, timeLabel);
  const place = city || location;
  return [date, place].filter(Boolean).join(" · ");
}

// ─── Content-Auflösung (nur benötigte Felder) ────────────────────

async function resolveContent(type, id) {
  switch (type) {

    case "beitrag":
    case "moment": {
      const row = await supabaseGet("beitraege", "id", id, "id,caption,src,user_id");
      if (!row) return null;
      const author = await loadAuthor(row.user_id);
      const coverUrl = firstHttpUrl(row.src);
      const authorName = author?.display_name || author?.username;
      return {
        title: titleBeitrag(authorName),
        description: descBeitrag(row.caption) || titleBeitrag(authorName),
        sourceImage: coverUrl || author?.avatar_url || null,
        canonicalPath: `/beitrag/${id}`,
        ogType: "beitrag",
        ogId: id,
      };
    }

    case "werke":
    case "werk":
    case "work": {
      const bySlug = type === "werke";
      const fields = "id,title,cover_url,images,price,category,user_id,slug";
      const row = bySlug
        ? await supabaseGet("works", "slug", id, fields)
        : await supabaseGet("works", "id", id, fields);
      if (!row) return null;
      const author = await loadAuthor(row.user_id);
      const authorName = author?.display_name || author?.username;
      const imageUrl = firstHttpUrl(row.cover_url, row.images);
      const ogType = bySlug ? "werke" : "work";
      const ogId = bySlug ? id : row.id;
      return {
        title: titleWerk(row.title, authorName),
        description: descWerk(row.category, row.price) || titleWerk(row.title, authorName),
        sourceImage: imageUrl || null,
        canonicalPath: bySlug ? `/werke/${id}` : `/work/${row.id}`,
        ogType,
        ogId,
      };
    }

    case "wirker":
    case "profil":
    case "profile": {
      const row = await supabaseGet("profiles", "username", id,
        "display_name,username,avatar_url,header_img,talent,location_label");
      if (!row) return null;
      const displayName = row.display_name || row.username;
      return {
        title: titleWirker(displayName),
        description: descWirker(row.talent, row.location_label) || titleWirker(displayName),
        sourceImage: row.avatar_url || row.header_img || null,
        canonicalPath: `/profile/${row.username}`,
        ogType: "wirker",
        ogId: row.username,
      };
    }

    case "projekt":
    case "project": {
      const row = await supabaseGet("impact_projects", "id", id,
        "id,name,description,img_url,icon,category");
      if (!row) return null;
      return {
        title: titlePlain(row.name, "Impact-Projekt"),
        description: descProjekt(row.description) || titlePlain(row.name, "Impact-Projekt"),
        sourceImage: firstHttpUrl(row.img_url) || null,
        canonicalPath: `/projekt/${id}`,
        ogType: "projekt",
        ogId: id,
      };
    }

    case "erlebnis":
    case "experience": {
      const row = await supabaseGet("experiences", "id", id,
        "id,title,cover_url,media_url,description,price,duration,location_text,user_id");
      if (!row) return null;
      const desc = row.description || [row.location_text, row.duration].filter(Boolean).join(" · ");
      return {
        title: titlePlain(row.title, "Erlebnis"),
        description: descErlebnis(desc) || titlePlain(row.title, "Erlebnis"),
        sourceImage: firstHttpUrl(row.cover_url, row.media_url) || null,
        canonicalPath: `/erlebnis/${id}`,
        ogType: "erlebnis",
        ogId: id,
      };
    }

    case "veranstaltung":
    case "event": {
      const row = await supabaseGet("invitations", "id", id,
        "id,title,text,vibe,location,city,starts_at,time_label,user_id,cover_url,image_url");
      if (!row) return null;
      const author = await loadAuthor(row.user_id);
      const eventTitle = row.title || row.vibe || clamp(row.text, 60) || "Veranstaltung";
      return {
        title: titlePlain(eventTitle, "Veranstaltung"),
        description: descVeranstaltung(row.starts_at, row.time_label, row.city, row.location)
          || titlePlain(eventTitle, "Veranstaltung"),
        sourceImage: firstHttpUrl(row.cover_url, row.image_url, author?.header_img, author?.avatar_url) || null,
        canonicalPath: `/veranstaltung/${id}`,
        ogType: "veranstaltung",
        ogId: id,
      };
    }

    default:
      return null;
  }
}

/** Nur Bild-URL für og-image-Endpoint — minimale DB-Abfrage via resolveContent */
async function resolveSourceImage(type, id) {
  const content = await resolveContent(type, id);
  return content?.sourceImage || null;
}

function buildHtml({ title, description, imageUrl, canonicalPath }, origin = APP_ORIGIN) {
  const fullUrl = `${origin}${canonicalPath}`;
  const safeTitle = escape(title);
  const safeDesc  = escape(description);
  const safeUrl   = escape(fullUrl);
  const safeImg   = escape(imageUrl);
  const safeOrigin = escape(origin);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>

  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />

  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="HUI" />
  <meta property="og:title"       content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url"         content="${safeUrl}" />
  <meta property="og:image"       content="${safeImg}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale"      content="de_DE" />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image"       content="${safeImg}" />

  <meta name="robots" content="index, follow" />

  <script>window.location.replace("${safeUrl}");</script>
</head>
<body>
  <p>
    <strong>${safeTitle}</strong><br />
    ${safeDesc}<br />
    <a href="${safeUrl}">Auf HUI ansehen →</a>
  </p>
  <p><em>Weiterleitung zu <a href="${safeOrigin}">${safeOrigin}</a> …</em></p>
</body>
</html>`;
}

function contentToOgPayload(content, origin = APP_ORIGIN) {
  const imageUrl = absoluteOgImageUrl(origin, content.ogType, content.ogId);
  return {
    title: content.title,
    description: content.description,
    imageUrl,
    canonicalPath: content.canonicalPath,
  };
}

function fallbackPayload(origin = APP_ORIGIN) {
  return {
    title: "HUI — Human United Intelligent",
    description: "Ein ruhiges kreatives Netzwerk für Menschen die wirken.",
    imageUrl: absoluteDefaultOgImageUrl(origin),
    canonicalPath: "/",
  };
}

export {
  APP_ORIGIN,
  BOT_PATTERNS,
  VERCEL_BOT_REGEX,
  isBot,
  escape,
  clamp,
  resolveContent,
  resolveSourceImage,
  buildHtml,
  buildOgImagePath,
  buildDefaultOgImagePath,
  absoluteOgImageUrl,
  absoluteDefaultOgImageUrl,
  contentToOgPayload,
  fallbackPayload,
  SUPABASE_URL,
  SUPABASE_SERVICE,
};

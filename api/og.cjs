// api/og.js — HUI Social Preview (DEEPLINK.1 / SHARE.2 2026-07-09)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function: abgefangen NUR für bekannte Social-
// Crawler-Bot-User-Agents (Rewrite in vercel.json, Browser landen
// weiterhin direkt beim SPA).
//
// Funktionsweise:
//   1. URL-Pfad parsen → Content-Type + ID/Slug
//   2. Supabase (Service Role) → Datensatz laden
//   3. OpenGraph-HTML mit Titel/Beschreibung/Bild ausgeben
//   4. Normaler Browser (non-bot) → 302 auf /Home (Rewrite greift
//      nicht — Vercel 'has'-Condition filtert Bots vorher heraus)
//
// Tabellen: beitraege, works, experiences, impact_projects, profiles,
//           wirker_profiles (für Coverbilder)
//
// Sicherheit: ausschließlich SERVICE_ROLE_KEY, kein Client-Key.
//             Nur öffentliche Felder werden gelesen — keine privaten
//             Profildaten, keine internen Felder.
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const APP_ORIGIN       = process.env.VITE_APP_ORIGIN    || "https://be-hui.app";

// Bekannte Social-Crawler-Bot-User-Agents (für Logging/Sicherheit)
const BOT_PATTERNS = [
  "facebookexternalhit", "twitterbot", "slackbot", "telegrambot",
  "discordbot", "linkedinbot", "whatsapp", "imessage", "applebot",
  "googlebot", "bingbot", "ia_archiver", "pinterest", "vkshare",
  "xing-contenttabreceiver", "curl", "python-requests", "wget",
];

function isBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some(p => lower.includes(p));
}

async function supabaseGet(table, column, value, fields) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=${fields}&limit=1`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_SERVICE,
      "Authorization": `Bearer ${SUPABASE_SERVICE}`,
      "Accept": "application/json",
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
  const s = String(str).replace(/\n/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// Lädt Autoren-Avatar + Name für Content-Seiten (optional, best-effort)
async function loadAuthor(userId) {
  if (!userId) return null;
  return supabaseGet("profiles", "id", userId,
    "display_name,username,avatar_url");
}

async function resolveContent(type, id) {
  switch (type) {

    case "beitrag":
    case "moment": {
      const row = await supabaseGet("beitraege", "id", id,
        "id,caption,src,type,user_id,created_at");
      if (!row) return null;
      const author = await loadAuthor(row.user_id);
      const coverUrl = Array.isArray(row.src)
        ? row.src[0]
        : (typeof row.src === "string" ? row.src : null);
      return {
        title: clamp(row.caption, 80) || "HUI Beitrag",
        description: [
          author?.display_name && `Von ${author.display_name}`,
          clamp(row.caption, 120),
        ].filter(Boolean).join(" · ") || "Ein Moment aus der HUI-Community.",
        image: coverUrl || author?.avatar_url || null,
        canonicalPath: `/beitrag/${id}`,
      };
    }

    case "werke":
    case "werk":
    case "work": {
      // Lookup by slug or by id (slug-Lookup kommt via /werke/:slug Pfad)
      const bySlug = type === "werke";
      const row = bySlug
        ? await supabaseGet("works", "slug", id, "id,title,cover_url,price,category,user_id")
        : await supabaseGet("works", "id", id, "id,title,cover_url,price,category,user_id");
      if (!row) return null;
      const author = await loadAuthor(row.user_id);
      const priceStr = row.price != null ? ` · ${Number(row.price).toFixed(0)} €` : "";
      return {
        title: row.title || "HUI Werk",
        description: [
          author?.display_name && `Von ${author.display_name}`,
          row.category,
          priceStr,
        ].filter(Boolean).join(" · ") || "Ein kreatives Werk auf HUI.",
        image: row.cover_url || null,
        canonicalPath: bySlug ? `/werke/${id}` : `/work/${row.id}`,
      };
    }

    case "wirker":
    case "profil":
    case "profile": {
      const row = await supabaseGet("profiles", "username", id,
        "display_name,username,avatar_url,bio,talent,location_label");
      if (!row) return null;
      return {
        title: row.display_name || row.username || "HUI Wirker",
        description: [
          row.talent,
          row.location_label,
          clamp(row.bio, 120),
        ].filter(Boolean).join(" · ") || "Wirker bei HUI — Human United Intelligent.",
        image: row.avatar_url || null,
        canonicalPath: `/wirker/${row.username}`,
      };
    }

    case "projekt":
    case "project": {
      const row = await supabaseGet("impact_projects", "id", id,
        "id,name,description,icon,category,tags");
      if (!row) return null;
      return {
        title: row.name || "HUI Impact-Projekt",
        description: clamp(row.description, 160) || "Ein Impact-Projekt auf HUI.",
        image: null, // Impact-Projekte haben kein Cover (Icon ist Emoji, nicht URL)
        canonicalPath: `/projekt/${id}`,
      };
    }

    case "erlebnis":
    case "experience": {
      const row = await supabaseGet("experiences", "id", id,
        "id,title,cover_url,price,duration,location_text,user_id");
      if (!row) return null;
      const author = await loadAuthor(row.user_id);
      const priceStr = row.price != null ? `${Number(row.price).toFixed(0)} €` : "";
      return {
        title: row.title || "HUI Erlebnis",
        description: [
          author?.display_name && `Von ${author.display_name}`,
          row.location_text,
          priceStr,
          row.duration,
        ].filter(Boolean).join(" · ") || "Ein Erlebnis auf HUI.",
        image: row.cover_url || null,
        canonicalPath: `/erlebnis/${id}`,
      };
    }

    case "veranstaltung":
    case "event": {
      const row = await supabaseGet("invitations", "id", id,
        "id,title,text,vibe,location,city,starts_at,user_id");
      if (!row) return null;
      const author = await loadAuthor(row.user_id);
      return {
        title: row.title || row.vibe || "HUI Veranstaltung",
        description: [
          author?.display_name && `Von ${author.display_name}`,
          row.city || row.location,
          clamp(row.text, 100),
        ].filter(Boolean).join(" · ") || "Eine Veranstaltung auf HUI.",
        image: null,
        canonicalPath: `/veranstaltung/${id}`,
      };
    }

    default:
      return null;
  }
}

function buildHtml({ title, description, image, canonicalPath }) {
  const origin = APP_ORIGIN;
  const fullUrl = `${origin}${canonicalPath}`;
  const safeTitle = escape(title);
  const safeDesc  = escape(description);
  const safeUrl   = escape(fullUrl);
  const safeImg   = image ? escape(image) : `${escape(origin)}/og-default.png`;
  const safeOrigin = escape(origin);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle} — HUI</title>

  <!-- Standard Meta -->
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />

  <!-- OpenGraph -->
  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="HUI — Human United Intelligent" />
  <meta property="og:title"       content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url"         content="${safeUrl}" />
  <meta property="og:image"       content="${safeImg}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale"      content="de_DE" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@hui_app" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image"       content="${safeImg}" />

  <!-- Robots: nur Crawl der Meta-Tags, nicht des JS-Inhalts -->
  <meta name="robots" content="index, follow" />

  <!-- Browser-Nutzer direkt zur App weiterleiten (Bots führen JS nicht aus) -->
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

module.exports = async function handler(req, res) {
  const ua = req.headers["user-agent"] || "";

  // Extra-Sicherheit: diese Function ist über vercel.json 'has'-Bedingung
  // nur für Bot-UAs erreichbar — trotzdem defensiv prüfen.
  if (!isBot(ua)) {
    // Echter Browser: direkt zur SPA (index.html handled den Rest)
    res.setHeader("Location", req.url || "/Home");
    res.status(302).end();
    return;
  }

  try {
    // URL-Pfad parsen: /api/og?path=/beitrag/123 (vercel.json rewrite)
    const url = new URL(req.url, `https://placeholder`);
    const pathParam = url.searchParams.get("path") || req.url;

    // Segmente: ["", "beitrag", "123"] oder ["", "werke", "haus-am-see"]
    const segments = pathParam.replace(/^\/api\/og/, "").split("/").filter(Boolean);
    const [type, id] = segments;

    if (!type || !id) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(buildHtml({
        title: "HUI — Human United Intelligent",
        description: "Ein ruhiges kreatives Netzwerk für Menschen die wirken.",
        image: null,
        canonicalPath: "/",
      }));
      return;
    }

    const content = await resolveContent(type, id);

    if (!content) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(404).send(buildHtml({
        title: "Inhalt nicht mehr verfügbar – HUI",
        description: "Dieser Inhalt wurde entfernt oder existiert nicht mehr.",
        image: null,
        canonicalPath: "/",
      }));
      return;
    }

    res.setHeader("Content-Type",  "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).send(buildHtml(content));

  } catch (err) {
    console.error("[HUI OG]", err?.message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(buildHtml({
      title: "HUI — Human United Intelligent",
      description: "Ein kreatives Netzwerk für Menschen die wirken.",
      image: null,
      canonicalPath: "/",
    }));
  }
};

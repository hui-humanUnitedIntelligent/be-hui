// api/og.cjs — HUI Social Preview (DEEPLINK.1 / SHARE.2 / OpenGraph 2.0)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function: abgefangen NUR für bekannte Social-
// Crawler-Bot-User-Agents (Rewrite in vercel.json, Browser landen
// weiterhin direkt beim SPA).
//
// OpenGraph 2.0: og:image zeigt auf dynamisch generierte HUI-Karten
// via /api/og-image.cjs (serverseitig, 1200×630, HUI Living Design).
// ══════════════════════════════════════════════════════════════════

const {
  APP_ORIGIN,
  resolveCardData,
  defaultCardData,
  buildMetaFromCard,
} = require("./og-resolve.cjs");

const BOT_PATTERNS = [
  "facebookexternalhit", "twitterbot", "slackbot", "telegrambot",
  "discordbot", "linkedinbot", "whatsapp", "imessage", "applebot",
  "googlebot", "bingbot", "ia_archiver", "pinterest", "vkshare",
  "xing-contenttabreceiver", "signal", "curl", "python-requests", "wget",
];

function isBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some(p => lower.includes(p));
}

function escape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function buildHtml({ title, description, image, canonicalPath }) {
  const origin = APP_ORIGIN;
  const fullUrl = `${origin}${canonicalPath}`;
  const safeTitle = escape(title);
  const safeDesc  = escape(description);
  const safeUrl   = escape(fullUrl);
  const safeImg   = escape(image);
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

function parsePath(req) {
  const url = new URL(req.url, "https://placeholder");
  const pathParam = url.searchParams.get("path") || req.url;
  const segments = pathParam.replace(/^\/api\/og/, "").split("/").filter(Boolean);
  return { type: segments[0] || null, id: segments[1] || null };
}

module.exports = async function handler(req, res) {
  const ua = req.headers["user-agent"] || "";

  if (!isBot(ua)) {
    res.setHeader("Location", req.url || "/Home");
    res.status(302).end();
    return;
  }

  try {
    const { type, id } = parsePath(req);

    if (!type || !id) {
      const meta = buildMetaFromCard(defaultCardData());
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      res.status(200).send(buildHtml(meta));
      return;
    }

    const card = await resolveCardData(type, id);

    if (!card) {
      const fallback = buildMetaFromCard({
        ...defaultCardData(),
        title: "Inhalt nicht mehr verfügbar – HUI",
        description: "Dieser Inhalt wurde entfernt oder ist nicht öffentlich.",
        canonicalPath: "/",
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      res.status(200).send(buildHtml(fallback));
      return;
    }

    const meta = buildMetaFromCard(card);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    if (meta.etag) res.setHeader("ETag", meta.etag);
    if (meta.lastModified) res.setHeader("Last-Modified", meta.lastModified.toUTCString());
    res.status(200).send(buildHtml(meta));

  } catch (err) {
    console.error("[HUI OG]", err?.message);
    const meta = buildMetaFromCard(defaultCardData());
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(buildHtml(meta));
  }
};

// api/og-image.cjs — HUI Dynamic Social Preview Card endpoint (OpenGraph 2.0)
// Serves 1200×630 JPEG cards with ETag / Last-Modified / Cache-Control

const {
  resolveCardData,
  defaultCardData,
} = require("./og-resolve.cjs");
const { renderCard } = require("./og-render.cjs");

// Pre-warm renderer on module load (reduces first-request latency)
renderCard(defaultCardData()).catch(() => {});

const CACHE_MAX_AGE = 3600; // 1h CDN cache; ETag invalidates on content change

function parsePath(req) {
  const url = new URL(req.url, "https://placeholder");
  const pathParam = url.searchParams.get("path") || req.url || "/";
  const segments = pathParam.replace(/^\/api\/og-image(\.cjs)?/, "").split("/").filter(Boolean);
  return { type: segments[0] || null, id: segments[1] || null };
}

function setCacheHeaders(res, card, startMs) {
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-HUI-OG-Render-Ms", String(Date.now() - startMs));

  if (card.etag) {
    res.setHeader("ETag", card.etag);
  }
  if (card.lastModified) {
    res.setHeader("Last-Modified", card.lastModified.toUTCString());
  }
}

function isNotModified(req, card) {
  const ifNoneMatch = req.headers["if-none-match"];
  if (ifNoneMatch && card.etag && ifNoneMatch === card.etag) return true;

  const ifModifiedSince = req.headers["if-modified-since"];
  if (ifModifiedSince && card.lastModified) {
    const since = new Date(ifModifiedSince);
    if (!Number.isNaN(since.getTime()) && card.lastModified <= since) return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  const startMs = Date.now();

  try {
    const { type, id } = parsePath(req);
    let card;

    if (!type || !id) {
      card = defaultCardData();
    } else {
      card = await resolveCardData(type, id);
      if (!card) {
        // Private / missing content → branded default (never 404)
        card = {
          ...defaultCardData(),
          title: "HUI — Human United Intelligent",
          description: "Dieser Inhalt ist nicht öffentlich verfügbar.",
        };
      }
    }

    if (isNotModified(req, card)) {
      setCacheHeaders(res, card, startMs);
      res.status(304).end();
      return;
    }

    const imageBuffer = await renderCard(card);
    setCacheHeaders(res, card, startMs);
    res.setHeader("Content-Length", String(imageBuffer.length));
    res.status(200).send(imageBuffer);
  } catch (err) {
    console.error("[HUI OG Image]", err?.message);
    try {
      const card = defaultCardData();
      const imageBuffer = await renderCard(card);
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.setHeader("Content-Length", String(imageBuffer.length));
      res.status(200).send(imageBuffer);
    } catch {
      res.status(500).end();
    }
  }
};

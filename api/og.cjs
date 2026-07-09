// api/og.cjs — HUI Social Preview (OpenGraph Fix 2026-07-09)
// Bot-Crawler erhalten HTML mit dynamischen OG/Twitter-Meta-Tags.
// Browser werden per vercel.json nicht umgeschrieben → SPA Deep-Links.

const {
  APP_ORIGIN,
  isBot,
  resolveContent,
  buildHtml,
  contentToOgPayload,
  fallbackPayload,
} = require("./og-shared.cjs");

module.exports = async function handler(req, res) {
  const ua = req.headers["user-agent"] || "";

  if (!isBot(ua)) {
    res.setHeader("Location", req.url || "/Home");
    res.status(302).end();
    return;
  }

  const origin = APP_ORIGIN;

  try {
    const url = new URL(req.url, "https://placeholder");
    const pathParam = url.searchParams.get("path") || req.url;
    const segments = pathParam.replace(/^\/api\/og/, "").split("/").filter(Boolean);
    const [type, ...idParts] = segments;
    const id = idParts.join("/");

    if (!type || !id) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(buildHtml(fallbackPayload(origin), origin));
      return;
    }

    const content = await resolveContent(type, id);

    if (!content) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(404).send(buildHtml({
        title: "Inhalt nicht mehr verfügbar",
        description: "Dieser Inhalt wurde entfernt oder existiert nicht mehr.",
        imageUrl: fallbackPayload(origin).imageUrl,
        canonicalPath: "/",
      }, origin));
      return;
    }

    const payload = contentToOgPayload(content, origin);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).send(buildHtml(payload, origin));

  } catch (err) {
    console.error("[HUI OG]", err?.message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(buildHtml(fallbackPayload(origin), origin));
  }
};

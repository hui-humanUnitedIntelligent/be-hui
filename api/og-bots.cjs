// api/og-bots.cjs — Zentrale Social-Crawler-Bot-Liste (og.cjs + vercel.json)
// Bei Änderungen: VERCEL_BOT_UA_REGEX in vercel.json synchron halten.

const BOT_PATTERNS = [
  "facebookexternalhit",
  "twitterbot",
  "slackbot",
  "telegrambot",
  "discordbot",
  "linkedinbot",
  "whatsapp",
  "signal",
  "imessage",
  "applebot",
  "googlebot",
  "bingbot",
  "ia_archiver",
  "pinterest",
  "vkshare",
  "xing-contenttabreceiver",
  "curl",
  "python-requests",
  "wget",
];

const VERCEL_BOT_UA_REGEX = `(?i).*(${BOT_PATTERNS.join("|")}).*`;

function isBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((p) => lower.includes(p));
}

module.exports = {
  BOT_PATTERNS,
  VERCEL_BOT_UA_REGEX,
  isBot,
};

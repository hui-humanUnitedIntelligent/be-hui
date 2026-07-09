// api/og-resolve.cjs — Shared content resolution for OG HTML + image cards
// OpenGraph 2.0 — HUI Dynamic Social Preview Cards (2026-07-09)

const crypto = require("crypto");

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const APP_ORIGIN       = process.env.VITE_APP_ORIGIN    || "https://be-hui.app";

const TITLE_MAX = 60;
const DESC_MAX  = 140;

const BEITRAG_CATEGORY = {
  moment: "Moment",
  post: "Beitrag",
  event: "Veranstaltung",
  work: "Werk",
  experience: "Erlebnis",
};

async function supabaseGet(table, column, value, fields, extra = "") {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) return null;
  const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=${fields}&limit=1${extra}`;
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

function clamp(str, max) {
  if (!str) return "";
  const s = String(str).replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function formatPrice(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`;
}

function formatDateDE(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

function formatTimeDE(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

async function loadAuthor(userId) {
  if (!userId) return null;
  return supabaseGet("profiles", "id", userId,
    "display_name,username,avatar_url,talent,location_label,updated_at");
}

function pickImage(...urls) {
  for (const u of urls) {
    if (u && typeof u === "string" && u.startsWith("http")) return u;
  }
  return null;
}

function buildEtag(parts) {
  return `"${crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32)}"`;
}

function metaFromRow(row, fields) {
  const updated = row?.updated_at || row?.created_at || null;
  const etag = buildEtag(fields.map(String));
  return { lastModified: updated ? new Date(updated) : null, etag };
}

async function resolveBeitrag(id) {
  const row = await supabaseGet("beitraege", "id", id,
    "id,caption,src,type,user_id,created_at,updated_at,visibility_scope");
  if (!row || row.visibility_scope === "connections_only") return null;

  const author = await loadAuthor(row.user_id);
  const coverUrl = Array.isArray(row.src)
    ? row.src[0]
    : (typeof row.src === "string" ? row.src : null);
  const category = BEITRAG_CATEGORY[row.type] || "Beitrag";
  const title = clamp(row.caption, TITLE_MAX) || "HUI Beitrag";
  const description = clamp(row.caption, 120) || "Ein Moment aus der HUI-Community.";

  const meta = metaFromRow(row, [
    "beitrag", id, title, description, coverUrl, author?.avatar_url,
    author?.display_name, category, row.updated_at, row.created_at,
  ]);

  return {
    cardType: "beitrag",
    title,
    description,
    coverImage: pickImage(coverUrl, author?.avatar_url),
    authorName: author?.display_name || author?.username || null,
    authorAvatar: author?.avatar_url || null,
    category,
    price: null,
    location: null,
    date: null,
    time: null,
    subtitle: null,
    canonicalPath: `/beitrag/${id}`,
    ...meta,
  };
}

async function resolveWork(type, id) {
  const bySlug = type === "werke";
  const row = bySlug
    ? await supabaseGet("works", "slug", id,
      "id,title,cover_url,media_url,price,category,user_id,status,approval_status,updated_at,created_at,slug")
    : await supabaseGet("works", "id", id,
      "id,title,cover_url,media_url,price,category,user_id,status,approval_status,updated_at,created_at,slug");

  if (!row) return null;
  if (row.status !== "published" || row.approval_status !== "approved") return null;

  const author = await loadAuthor(row.user_id);
  const title = clamp(row.title, TITLE_MAX) || "HUI Werk";
  const price = formatPrice(row.price);
  const description = [
    row.category,
    price,
    author?.display_name && `von ${author.display_name}`,
  ].filter(Boolean).join(" · ") || "Ein kreatives Werk auf HUI.";
  const coverImage = pickImage(row.cover_url, row.media_url);

  const meta = metaFromRow(row, [
    "werk", row.id, title, description, coverImage, price, row.category,
    author?.display_name, row.updated_at, row.created_at,
  ]);

  return {
    cardType: "werk",
    title,
    description: clamp(description, DESC_MAX),
    coverImage,
    authorName: author?.display_name || author?.username || null,
    authorAvatar: author?.avatar_url || null,
    category: row.category || "Werk",
    price,
    location: null,
    date: null,
    time: null,
    subtitle: author?.display_name ? `von ${author.display_name}` : null,
    canonicalPath: bySlug ? `/werke/${id}` : `/work/${row.id}`,
    ...meta,
  };
}

async function resolveWirker(id) {
  const row = await supabaseGet("profiles", "username", id,
    "display_name,username,avatar_url,bio,talent,location_label,updated_at,created_at");
  if (!row) return null;

  const title = clamp(row.display_name || row.username, TITLE_MAX) || "HUI Wirker";
  const description = clamp(row.bio, DESC_MAX)
    || (row.talent ? `${row.talent} bei HUI.` : "Wirker bei HUI — Human United Intelligent.");

  const meta = metaFromRow(row, [
    "wirker", row.username, title, description, row.avatar_url,
    row.talent, row.location_label, row.updated_at, row.created_at,
  ]);

  return {
    cardType: "wirker",
    title,
    description: clamp(description, DESC_MAX),
    coverImage: row.avatar_url || null,
    authorName: null,
    authorAvatar: row.avatar_url || null,
    category: row.talent || "Wirker",
    price: null,
    location: row.location_label || null,
    date: null,
    time: null,
    subtitle: "Jetzt auf HUI entdecken",
    canonicalPath: `/wirker/${row.username}`,
    ...meta,
  };
}

async function resolveProjekt(id) {
  const row = await supabaseGet("impact_projects", "id", id,
    "id,name,description,icon,category,tags,status,updated_at,created_at");
  if (!row || row.status !== "active") return null;

  const title = clamp(row.name, TITLE_MAX) || "HUI Impact-Projekt";
  const description = clamp(row.description, DESC_MAX) || "Ein Impact-Projekt auf HUI.";

  const meta = metaFromRow(row, [
    "projekt", id, title, description, row.category, row.icon,
    row.updated_at, row.created_at,
  ]);

  return {
    cardType: "projekt",
    title,
    description,
    coverImage: null,
    authorName: null,
    authorAvatar: null,
    category: row.category || "Impact",
    price: null,
    location: null,
    date: null,
    time: null,
    subtitle: null,
    canonicalPath: `/projekt/${id}`,
    ...meta,
  };
}

async function resolveErlebnis(id) {
  const row = await supabaseGet("experiences", "id", id,
    "id,title,cover_url,media_url,price,duration,location_text,user_id,status,approval_status,updated_at,created_at");
  if (!row) return null;
  if (row.status !== "published" || row.approval_status !== "approved") return null;

  const author = await loadAuthor(row.user_id);
  const title = clamp(row.title, TITLE_MAX) || "HUI Erlebnis";
  const description = clamp([
    row.location_text,
    row.duration,
    author?.display_name && `von ${author.display_name}`,
  ].filter(Boolean).join(" · ") || "Ein Erlebnis auf HUI.", DESC_MAX);
  const coverImage = pickImage(row.cover_url, row.media_url);

  const meta = metaFromRow(row, [
    "erlebnis", id, title, description, coverImage,
    row.location_text, row.updated_at, row.created_at,
  ]);

  return {
    cardType: "erlebnis",
    title,
    description,
    coverImage,
    authorName: author?.display_name || null,
    authorAvatar: author?.avatar_url || null,
    category: "Erlebnis",
    price: formatPrice(row.price),
    location: row.location_text || null,
    date: null,
    time: null,
    subtitle: null,
    canonicalPath: `/erlebnis/${id}`,
    ...meta,
  };
}

async function resolveVeranstaltung(id) {
  const row = await supabaseGet("invitations", "id", id,
    "id,title,text,vibe,location,city,starts_at,time_label,user_id,status,visibility,expires_at,updated_at,created_at");
  if (!row) return null;
  if (row.status !== "active" || row.visibility !== "public") return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;

  const author = await loadAuthor(row.user_id);
  const title = clamp(row.title || row.vibe, TITLE_MAX) || "HUI Veranstaltung";
  const date = formatDateDE(row.starts_at);
  const time = row.time_label || formatTimeDE(row.starts_at);
  const location = row.city || row.location || null;
  const description = clamp([
    date,
    time,
    location,
    author?.display_name && `von ${author.display_name}`,
  ].filter(Boolean).join(" · ") || clamp(row.text, DESC_MAX) || "Eine Veranstaltung auf HUI.", DESC_MAX);

  const meta = metaFromRow(row, [
    "veranstaltung", id, title, description, row.text,
    date, time, location, row.updated_at, row.created_at,
  ]);

  return {
    cardType: "veranstaltung",
    title,
    description,
    coverImage: null,
    authorName: author?.display_name || null,
    authorAvatar: author?.avatar_url || null,
    category: "Veranstaltung",
    price: null,
    location,
    date,
    time,
    subtitle: clamp(row.text, 100) || null,
    canonicalPath: `/veranstaltung/${id}`,
    ...meta,
  };
}

async function resolveCardData(type, id) {
  switch (type) {
    case "beitrag":
    case "moment":
      return resolveBeitrag(id);
    case "werke":
    case "werk":
    case "work":
      return resolveWork(type, id);
    case "wirker":
    case "profil":
    case "profile":
      return resolveWirker(id);
    case "projekt":
    case "project":
      return resolveProjekt(id);
    case "erlebnis":
    case "experience":
      return resolveErlebnis(id);
    case "veranstaltung":
    case "event":
      return resolveVeranstaltung(id);
    default:
      return null;
  }
}

function defaultCardData() {
  const etag = buildEtag(["default", "hui"]);
  return {
    cardType: "default",
    title: "HUI — Human United Intelligent",
    description: "Ein ruhiges kreatives Netzwerk für Menschen die wirken.",
    coverImage: null,
    authorName: null,
    authorAvatar: null,
    category: null,
    price: null,
    location: null,
    date: null,
    time: null,
    subtitle: null,
    canonicalPath: "/",
    lastModified: null,
    etag,
  };
}

function buildOgImageUrl(canonicalPath) {
  const path = canonicalPath || "/";
  return `${APP_ORIGIN}/api/og-image.cjs?path=${encodeURIComponent(path)}`;
}

function buildMetaFromCard(card) {
  const title = card.title || "HUI";
  const description = card.description || "Human United Intelligent";
  return {
    title,
    description,
    image: buildOgImageUrl(card.canonicalPath),
    canonicalPath: card.canonicalPath,
    etag: card.etag,
    lastModified: card.lastModified,
  };
}

module.exports = {
  APP_ORIGIN,
  TITLE_MAX,
  DESC_MAX,
  resolveCardData,
  defaultCardData,
  buildOgImageUrl,
  buildMetaFromCard,
  clamp,
};

// src/lib/factories/createFeedItem.js
// Feed Data Normalization Layer
//
// REGEL: Supabase-Rohdaten NIEMALS direkt rendern.
//        Immer zuerst durch createFeedItem() normalisieren.
//
// Verhindert:
//   - undefined property crashes (item.creator?.name → boom)
//   - null images breaking layout
//   - NaN stats in counters
//   - Type-confusion (number vs string ids)

// ── Hilfsfunktionen ───────────────────────────────────────────────────────

const safeStr   = (v, fallback = '')  => (v != null && v !== '') ? String(v) : fallback;
const safeNum   = (v, fallback = 0)  => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};
const safeBool  = (v)                => Boolean(v);
const safeArr   = (v)                => Array.isArray(v) ? v.filter(Boolean) : [];
const safeUrl   = (v)                => (typeof v === 'string' && v.startsWith('http')) ? v : null;

// ── Normalisierte Sub-Objekte ─────────────────────────────────────────────

const normalizeCreator = (raw) => Object.freeze({
  id:       safeStr(raw?.id     || raw?.user_id || raw?.creator_id),
  name:     safeStr(raw?.name   || raw?.display_name || raw?.full_name, 'Unbekannt'),
  avatar:   safeUrl(raw?.avatar || raw?.avatar_url   || raw?.img),
  username: safeStr(raw?.username || raw?.handle),
  verified: safeBool(raw?.verified),
});

const normalizeStats = (raw) => Object.freeze({
  likes:    safeNum(raw?.likes    || raw?.resonanz || raw?.reactions),
  comments: safeNum(raw?.comments || raw?.replies),
  shares:   safeNum(raw?.shares   || raw?.reposts),
  views:    safeNum(raw?.views    || raw?.impressions),
  bookings: safeNum(raw?.bookings || raw?.participants),
});

const normalizeMedia = (raw) => {
  // Unterstützt: string-URL, {url}, {src}, {cover_url}, Array davon
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter(Boolean)
    .map(m => {
      if (typeof m === 'string') return safeUrl(m);
      return safeUrl(m?.url || m?.src || m?.cover_url || m?.image_url || m?.img);
    })
    .filter(Boolean);
};

// ── Haupt-Factory ─────────────────────────────────────────────────────────

/**
 * Normalisiert ein rohes Supabase/API-Objekt zu einem sicheren FeedItem.
 * Alle Felder sind garantiert definiert — kein undefined kann durch.
 *
 * Akzeptiert Daten von: works, experiences, feed_posts, impact_projects,
 * stories, activities, HomeFeed-items, DiscoverPage-items.
 *
 * @param {object} raw — Rohes Supabase-Objekt (beliebige Struktur)
 * @returns {FeedItem|null}
 */
export const createFeedItem = (raw = {}) => {

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    console.warn('[HUI INVALID FEED ITEM]', raw);
    return null;
  }

  // id — muss immer vorhanden sein
  const id = raw.id
    ? String(raw.id)
    : (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2));

  // Canonical entities already passed through src/normalizers/entityNormalizer.js.
  // Preserve them so FeedRouter can route by entityType instead of legacy type aliases.
  if (raw.entityType && raw.authorId) {
    return Object.freeze({
      ...raw,
      id,
      stats: normalizeStats(raw.stats || raw),
      media: safeArr(raw.media),
      coverUrl: raw.coverUrl || raw.images?.[0] || raw.mediaUrls?.[0] || raw.media?.[0]?.url || raw.media?.[0] || null,
      createdAt: raw.createdAt || raw.created_at || null,
      updatedAt: raw.updatedAt || raw.updated_at || null,
      status: safeStr(raw.status),
      _raw: raw._raw || raw,
    });
  }

  // type — normalisieren auf bekannte Werte
  const rawType  = raw.type || raw.item_type || raw.post_type || 'post';
  const typeMap  = {
    werk:        'werk',
    work:        'werk',
    work_upload: 'werk',
    erlebnis:    'experience',
    experience:  'experience',
    event:       'experience',
    impact:      'impact',
    impact_project: 'impact',
    story:       'story',
    post:        'post',
    activity:    'activity',
  };
  const type = typeMap[String(rawType).toLowerCase()] || 'post';

  // creator — aus mehreren möglichen Strukturen
  const creatorRaw = raw.creator    || raw.profile   || raw.author
                  || raw.wirker     || raw.user       || {};

  // media — alle möglichen Bildfelder zusammenführen
  const mediaRaw  = raw.media       || raw.images     || raw.photos
                 || raw.cover_url   || raw.img        || raw.image_url
                 || raw.expImg      || null;

  // stats — aus verschiedenen Quellen zusammenführen
  const statsRaw  = raw.stats       || {
    likes:    raw.resonanz || raw.likes    || raw.reactions  || 0,
    comments: raw.comments || raw.replies  || 0,
    shares:   raw.shares   || raw.reposts  || 0,
    views:    raw.views    || raw.impressions || 0,
    bookings: raw.bookings || raw.participants || 0,
  };

  return Object.freeze({
    // Core Identity
    id,
    type,

    // Content
    title:       safeStr(raw.title       || raw.name        || raw.expTitle),
    description: safeStr(raw.description || raw.caption     || raw.bio       || raw.story || raw.short),
    subtitle:    safeStr(raw.subtitle    || raw.expMeta     || raw.category),

    // Creator
    creator: normalizeCreator(creatorRaw),

    // Media
    media:       normalizeMedia(mediaRaw),
    coverUrl:    safeUrl(raw.cover_url   || raw.img         || raw.image_url || raw.expImg),

    // Stats
    stats: normalizeStats(statsRaw),

    // Timestamps
    createdAt:   raw.createdAt  || raw.created_at  || null,
    updatedAt:   raw.updatedAt  || raw.updated_at  || null,
    time:        safeStr(raw.time        || raw.when        || raw.time_label),

    // Commerce (Werke/Erlebnisse)
    price:       raw.price != null ? safeNum(raw.price) : null,
    currency:    safeStr(raw.currency, 'EUR'),

    // Flags
    featured:    safeBool(raw.featured   || raw.status === 'featured'),
    verified:    safeBool(raw.verified),
    isLive:      safeBool(raw.isLive     || raw.is_live),

    // Classification
    category:    safeStr(raw.category   || raw.category_label),
    tags:        safeArr(raw.tags),
    location:    safeStr(raw.location   || raw.location_label || raw.city),

    // Impact-spezifisch
    votes:       safeNum(raw.votes),
    goal:        raw.goal != null ? safeNum(raw.goal) : null,
    raised:      raw.raised != null ? safeNum(raw.raised) : (raw.awarded_eur != null ? safeNum(raw.awarded_eur) : null),
    status:      safeStr(raw.status),

    // UI-Hints (vom Frontend gemappt — passthrough)
    badge:       safeStr(raw.badge),
    badgeColor:  safeStr(raw.badgeColor),
    action:      safeStr(raw.action),
    viewers:     safeArr(raw.viewers),
    viewerExtra: safeNum(raw.viewerExtra),

    // Escape hatch: originales Objekt für edge cases
    _raw:        raw,
  });
};

/**
 * Normalisiert ein Array von Rohdaten zu validen FeedItems.
 * Filtert null/invalid automatisch heraus.
 *
 * @param {Array}  items — Array von Supabase-Rohdaten
 * @returns {FeedItem[]}
 */
export const filterValidFeedItems = (items = []) =>
  (items || [])
    .map(createFeedItem)
    .filter(Boolean);

// ── Spezialisierte Normalizer ─────────────────────────────────────────────

/**
 * Normalisiert ein Supabase `works`-Objekt.
 */
export const createWorkItem = (raw = {}) => createFeedItem({
  ...raw,
  type:    'werk',
  creator: raw.profile || raw.creator || {},
  media:   raw.images || raw.cover_url || null,
});

/**
 * Normalisiert ein Supabase `experiences`-Objekt.
 */
export const createExperienceItem = (raw = {}) => createFeedItem({
  ...raw,
  type:  'experience',
  title: raw.name    || raw.title,
  media: raw.cover_url || raw.img || null,
});

/**
 * Normalisiert ein Supabase `impact_projects`-Objekt.
 */
export const createImpactItem = (raw = {}) => createFeedItem({
  ...raw,
  type:  'impact',
  title: raw.name    || raw.title,
  media: raw.icon?.startsWith('http') ? raw.icon : null,
});

// ═══════════════════════════════════════════════════════════════════════
// src/system/feed/feedNormalizer.js
// HUI Feed Normalizer — Phase 4F
//
// GARANTIEN:
// - gibt immer ein Object zurück (niemals null, außer !raw.id)
// - wirft niemals einen Error
// - alle genutzten Felder sind null-safe
// ═══════════════════════════════════════════════════════════════════════

const FALLBACK_NAME  = "Creative Human";
const FALLBACK_TITLE = "Unbenanntes Erlebnis";

// ── Hilfsfunktionen ───────────────────────────────────────────────────
const safeStr = (v, fb = "") =>
  v != null && v !== "" ? String(v).trim() : fb;
const safeNum = (v, fb = 0) => { const n = Number(v); return isNaN(n) ? fb : n; };
const safeUrl = (v) =>
  typeof v === "string" && v.startsWith("http") ? v : null;
const safeArr = (v) => Array.isArray(v) ? v.filter(Boolean) : [];

function relTime(ts) {
  if (!ts) return "";
  try {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60)    return "Gerade eben";
    if (diff < 3600)  return `vor ${Math.floor(diff / 60)} Min`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
    return `vor ${Math.floor(diff / 86400)} Tagen`;
  } catch { return ""; }
}

function extractFirstImage(raw) {
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    const first = raw.images[0];
    if (typeof first === "string") return safeUrl(first);
    if (first?.url) return safeUrl(first.url);
  }
  return safeUrl(raw.cover_url) ||
         safeUrl(raw.media_url) ||
         safeUrl(raw.expImg)    ||
         safeUrl(raw.img)       ||
         safeUrl(raw.src)       ||
         (Array.isArray(raw.media) && raw.media.length > 0
           ? (typeof raw.media[0] === "string" ? safeUrl(raw.media[0]) : safeUrl(raw.media[0]?.url))
           : null);
}

function extractImageArray(raw) {
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    return raw.images
      .map(img => typeof img === "string" ? safeUrl(img) : safeUrl(img?.url))
      .filter(Boolean);
  }
  const single = extractFirstImage(raw);
  return single ? [single] : [];
}

function extractCreator(raw) {
  const p = raw.profile || raw.creator || raw.author || raw.user || {};
  const name = safeStr(
    p.display_name || p.full_name || p.name || p.username,
    FALLBACK_NAME
  );
  return {
    id:          safeStr(p.id || p.user_id || raw.user_id || raw.creator_id),
    name,
    displayName: name,
    avatar:      safeUrl(p.avatar_url || p.avatar || p.img),
    username:    safeStr(p.username || p.handle),
    talent:      safeStr(p.talent || p.category || raw.category),
    location:    safeStr(p.location_label || p.location || raw.location_text || raw.location),
    verified:    Boolean(p.verified || p.is_wirker),
  };
}

const TYPE_MAP = {
  werk: "work", work: "work", work_upload: "work",
  erlebnis: "experience", experience: "experience", event: "experience",
  impact: "impact", impact_project: "impact",
  story: "moment", moment: "moment",
  note: "note", thought: "note",
  invitation: "invitation", einladung: "invitation",
  post: "post", beitrag: "post",
};

function normalizeType(raw) {
  const t = raw.type || raw.item_type || raw.post_type || "post";
  return TYPE_MAP[String(t).toLowerCase()] || "post";
}

function defaultRhythmState(type, existing) {
  if (existing) return existing;
  if (type === "experience") return "experience";
  if (type === "work") return "hero";  // WorkCard nutzt eigene DNA
  if (type === "note")       return "note";
  if (type === "impact")     return "resonance";
  if (type === "invitation") return "resonance"; // InvitationCard nutzt eigene Struktur
  return "hero";
}

function defaultPresenceState(type, existing) {
  if (existing) return existing;
  if (type === "experience") return "gathering";
  if (type === "note")       return "reflecting";
  return "creating";
}

function buildExpMeta(raw) {
  if (raw.expMeta) return raw.expMeta;
  return [
    raw.date
      ? new Date(raw.date).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" })
      : null,
    raw.location_text || null,
    raw.price != null ? `${raw.price} €` : raw.pricing_type === "free" ? "Kostenlos" : null,
    (raw.participant_limit || raw.max_participants)
      ? `Max. ${raw.participant_limit || raw.max_participants} Personen`
      : null,
  ].filter(Boolean).join(" · ");
}

// ═══════════════════════════════════════════════════════════════════════
export function normalizeFeedItem(raw) {
  // Einziger harter Filter: kein id
  if (!raw?.id) {
    console.warn("[HUI_FEED_SKIPPED]", "no id", typeof raw);
    return null;
  }

  try {
    const type       = normalizeType(raw);
    const creator    = extractCreator(raw);
    const firstImage = extractFirstImage(raw);
    const imageArr   = extractImageArray(raw);

    const title =
      safeStr(raw.title)           ||
      safeStr(raw.expTitle)        ||
      safeStr(raw.name)            ||
      safeStr(raw.caption)?.slice(0, 60) ||
      FALLBACK_TITLE;

    const result = {
      id:            String(raw.id),
      type,
      content_type:  type,   // Phase 4C: FeedRouter nutzt content_type als Entscheider
      title,
      caption:       safeStr(raw.caption || raw.description || raw.story),
      description:   safeStr(raw.description || raw.caption || raw.story),
      name:          creator.name,
      creator,
      creator_id:    creator.id || safeStr(raw.user_id || raw.creator_id),
      avatar:        creator.avatar,
      talent:        creator.talent,
      location:      creator.location,
      images:        imageArr,
      expImg:        firstImage,
      coverUrl:      firstImage,
      expTitle:      safeStr(raw.expTitle || raw.title || raw.name),
      expMeta:       buildExpMeta(raw),
      bookingMode:   safeStr(raw.booking_mode || raw.bookingMode, "direct"),
      pricingType:   safeStr(raw.pricing_type || raw.pricingType, "fixed"),
      expType:       safeStr(raw.experience_type || raw.expType),
      price:         raw.price != null ? safeNum(raw.price) : null,
      duration:      safeStr(raw.duration),
      format:        safeStr(raw.format),
      rhythmState:   defaultRhythmState(type, raw.rhythmState),
      presenceState: defaultPresenceState(type, raw.presenceState),
      resonanz:      safeNum(raw.resonanz || raw.likes),
      berührt:       safeNum(raw.berührt),
      begleitet:     safeNum(raw.begleitet),
      viewers:       safeArr(raw.viewers),
      viewerExtra:   safeNum(raw.viewerExtra),
      time:          safeStr(raw.time) || relTime(raw.created_at),
      category:      safeStr(raw.category),
      tags:          safeArr(raw.tags),
      status:        safeStr(raw.status),
      isLive:        Boolean(raw.isLive || raw.is_live),
      _raw:          raw,
    };

    console.log("[HUI_FEED_NORMALIZED]", {
      id: result.id, type, title, hasImage: !!firstImage, creator: creator.name,
    });
    return result;

  } catch (err) {
    console.warn("[HUI_FEED_SKIPPED]", "error in normalize", raw?.id, err?.message);
    // Minimal-Fallback — lieber sichtbar als silent drop
    return {
      id:           String(raw.id),
      type:         "post",
      title:        FALLBACK_TITLE,
      caption:      "",
      description:  "",
      name:         FALLBACK_NAME,
      creator:      { id: "", name: FALLBACK_NAME, displayName: FALLBACK_NAME, avatar: null,
                      username: "", talent: "", location: "", verified: false },
      creator_id:   safeStr(raw.user_id),
      avatar:       null,
      images:       [],
      expImg:       null,
      coverUrl:     null,
      expTitle:     "",
      expMeta:      "",
      bookingMode:  "direct",
      pricingType:  "fixed",
      expType:      "",
      price:        null,
      duration:     "",
      format:       "",
      rhythmState:  "resonance",
      presenceState:"reflecting",
      resonanz: 0, berührt: 0, begleitet: 0,
      viewers: [], viewerExtra: 0,
      time: "",
      category: "",
      tags: [],
      status: "",
      isLive: false,
      _raw: raw,
    };
  }
}

export function normalizeFeedItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeFeedItem).filter(Boolean);
}

export const normalizeExperienceRow = (raw) => normalizeFeedItem({ ...raw, type: "experience" });
export const normalizeWorkRow       = (raw) => normalizeFeedItem({ ...raw, type: "work_upload" });
export const normalizeInvitationRow = (raw) => normalizeFeedItem({ ...raw, type: "invitation", content_type: "invitation" });
export const normalizeBeitragRow = (raw) => {
  // DEFENSIVE: kein Join nötig — profile wird von injectProfile() injiziert
  // Einziger Hard-Filter: keine id → skip
  if (!raw?.id) return null;

  const dbType    = raw.type || "moment";
  const mappedType = dbType === "note" ? "note" : "moment";
  const srcUrl    = raw.src || raw.image_url || null;

  // Profile — immer sicher, niemals null-crash
  const profile = raw.profile || raw.creator || raw.author || {};
  const creator = {
    id:       String(profile.id || raw.user_id || ""),
    name:     profile.display_name || profile.full_name || profile.username || "Human",
    displayName: profile.display_name || profile.full_name || "Human",
    avatar:   profile.avatar_url || profile.avatar || null,
    username: profile.username || null,
    talent:   profile.talent || null,
    verified: Boolean(profile.verified),
  };

  const result = normalizeFeedItem({
    ...raw,
    type:    mappedType,
    images:  srcUrl ? [srcUrl] : [],
    src:     srcUrl,
    caption: raw.caption || null,
    creator,
  });

  // Fallback: normalizeFeedItem hat durch den catch immer was — aber sicher ist sicher
  if (!result) {
    return {
      id:          String(raw.id),
      type:        "moment",
      content_type:"moment",
      title:       raw.caption?.slice(0,60) || "Moment",
      caption:     raw.caption || "",
      description: raw.caption || "",
      name:        creator.name,
      creator,
      creator_id:  String(raw.user_id || ""),
      avatar:      creator.avatar,
      talent:      "",
      location:    "",
      images:      srcUrl ? [srcUrl] : [],
      expImg:      srcUrl,
      coverUrl:    srcUrl,
      expTitle:    "",
      expMeta:     "",
      bookingMode: "direct",
      pricingType: "fixed",
      expType:     "",
      price:       null,
      duration:    "",
      format:      "",
      rhythmState: "resonance",
      presenceState:"reflecting",
      resonanz: 0, berührt: 0, begleitet: 0,
      viewers: [], viewerExtra: 0,
      time:     "",
      category: "",
      tags:     [],
      status:   "",
      isLive:   false,
      _raw:     raw,
    };
  }

  console.log("[HUI_BEITRAG_NORMALIZED]", {
    id: result.id, type: result.type,
    caption: result.caption?.slice(0,40),
    hasImage: !!result.expImg,
    creator: creator.name,
  });
  return result;
};

// src/lib/contentPreviewLoaders.js — OPEN.1 (2026-07-08)
// ══════════════════════════════════════════════════════════════════
// Nur fuer Aufrufer, die beim Antippen KEINE vollstaendige Zeile im
// Speicher haben (aktuell: HuiLiveTicker -- der Ticker haelt bewusst
// nur schlanke Felder fuer die Textzeile, siehe useLiveTicker.js).
// Feed- und Discover-Karten haben ihre Datenzeile bereits vollstaendig
// im Speicher und normalisieren direkt ueber previewNormalizers.js,
// OHNE hierueber zu gehen (Lazy Loading nur wo tatsaechlich noetig).
// ══════════════════════════════════════════════════════════════════
import { supabase } from "./supabaseClient.js";
import { ProfileService } from "../services/db.js";
import {
  normalizePostForPreview, normalizeProjectForPreview,
  normalizeRecommendationForPreview, normalizeWirkerForPreview,
  normalizeConnectionForPreview, normalizeTalentForPreview,
} from "./previewNormalizers.js";

async function one(query) {
  try {
    const { data, error } = await query.maybeSingle();
    if (error) return null;
    return data || null;
  } catch { return null; }
}

// AUTOR-NAME-FIX (2026-08-08, Nutzer-Feedback: "Beitrag öffnen" aus dem
// Resonanzzentrum zeigte "Mitglied" statt dem echten Namen): toFeedItem()
// (unifiedNormalizer.js) liest den Autor über raw.profile/raw.creator/
// raw.author/raw.user -- im normalen Feed wird das per useFeedStream.js
// injectProfile() vorher eingespeist. Die schlanken openRef-Loader hier
// machten das bisher NICHT, sondern gaben die Roh-Zeile 1:1 durch --
// raw.profile war immer undefined -> leerer Name -> Fallback "Mitglied".
// Fix: analog zum bestehenden talent-Loader (siehe unten) das Autor-Profil
// per ProfileService.getMin() (gecacht, minimal: id/display_name/username/
// avatar_url) nachladen und als row.profile injizieren, BEVOR normalisiert
// wird -- exakt dasselbe Datenformat wie im Haupt-Feed.
async function injectAuthorProfile(row) {
  if (!row) return row;
  const uid = row.user_id || row.creator_id || null;
  if (!uid) return row;
  try {
    const { data: prof } = await ProfileService.getMin(uid);
    return { ...row, profile: prof || { id: uid } };
  } catch {
    return { ...row, profile: { id: uid } };
  }
}

const LOADERS = {
  work: async (id) => {
    const row = await one(supabase.from("works").select("*").eq("id", id));
    if (!row) return null;
    return normalizePostForPreview(await injectAuthorProfile(row), "work");
  },
  experience: async (id) => {
    const row = await one(supabase.from("experiences").select("*").eq("id", id));
    if (!row) return null;
    return normalizePostForPreview(await injectAuthorProfile(row), "experience");
  },
  project: async (id) => {
    const row = await one(supabase.from("impact_projects").select("*").eq("id", id));
    return row ? normalizeProjectForPreview(row) : null;
  },
  recommendation: async (id) => {
    const row = await one(
      supabase.from("recommendations")
        // FK referenziert auth.users (nicht profiles) → kein PostgREST-Join möglich
        .select("id,from_user_id,to_user_id,text,result_images,created_at")
        .eq("id", id)
    );
    return row ? normalizeRecommendationForPreview(row) : null;
  },
  wirker: async (id) => {
    const row = await one(supabase.from("wirker").select("*").eq("id", id));
    return row ? normalizeWirkerForPreview(row) : null;
  },
  connection: async (id) => {
    const row = await one(supabase.from("connections").select("*").eq("id", id));
    return row ? normalizeConnectionForPreview(row) : null;
  },
  // MERKLISTE.3 (2026-08-07): Talent-Angebote hatten keinen Loader -- Klick
  // auf "Öffnen" in der Merkliste tat bisher nichts (openRef fand keine fn).
  // Anbietername separat nachladen (talents hat kein FK-Embed auf profiles,
  // gleiches Muster wie ueberall sonst im System, siehe DiscoverPage.jsx).
  talent: async (id) => {
    const row = await one(supabase.from("talents").select("*").eq("id", id));
    if (!row) return null;
    let authorName = null;
    if (row.user_id) {
      const { data: prof } = await supabase.from("profiles")
        .select("display_name,username").eq("id", row.user_id).maybeSingle();
      authorName = prof?.display_name || prof?.username || null;
    }
    return normalizeTalentForPreview(row, authorName);
  },
  // OPEN.2 2026-07-08 -- Event/Moment/Post/Beitrag kommen alle aus derselben
  // "beitraege"-Tabelle (siehe useFeedStream.js), unterschieden nur durch
  // row.type -- toFeedItem() in normalizePostForPreview loest das bereits auf.
  event: async (id) => {
    const row = await one(supabase.from("beitraege").select("*").eq("id", id));
    if (!row) return null;
    return normalizePostForPreview(await injectAuthorProfile(row), "event");
  },
  moment: async (id) => {
    const row = await one(supabase.from("beitraege").select("*").eq("id", id));
    if (!row) return null;
    return normalizePostForPreview(await injectAuthorProfile(row), "moment");
  },
  post: async (id) => {
    const row = await one(supabase.from("beitraege").select("*").eq("id", id));
    if (!row) return null;
    return normalizePostForPreview(await injectAuthorProfile(row), "moment");
  },
  beitrag: async (id) => {
    const row = await one(supabase.from("beitraege").select("*").eq("id", id));
    if (!row) return null;
    return normalizePostForPreview(await injectAuthorProfile(row), "moment");
  },
};

export async function loadPreviewByRef(type, id) {
  const fn = LOADERS[type];
  if (!fn || !id) return null;
  return fn(id).catch(() => null);
}

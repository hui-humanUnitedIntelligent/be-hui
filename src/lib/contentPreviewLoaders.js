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

const LOADERS = {
  work: async (id) => {
    const row = await one(supabase.from("works").select("*").eq("id", id));
    return row ? normalizePostForPreview(row, "work") : null;
  },
  experience: async (id) => {
    const row = await one(supabase.from("experiences").select("*").eq("id", id));
    return row ? normalizePostForPreview(row, "experience") : null;
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
    return row ? normalizePostForPreview(row, "event") : null;
  },
  moment: async (id) => {
    const row = await one(supabase.from("beitraege").select("*").eq("id", id));
    return row ? normalizePostForPreview(row, "moment") : null;
  },
  post: async (id) => {
    const row = await one(supabase.from("beitraege").select("*").eq("id", id));
    return row ? normalizePostForPreview(row, "moment") : null;
  },
  beitrag: async (id) => {
    const row = await one(supabase.from("beitraege").select("*").eq("id", id));
    return row ? normalizePostForPreview(row, "moment") : null;
  },
};

export async function loadPreviewByRef(type, id) {
  const fn = LOADERS[type];
  if (!fn || !id) return null;
  return fn(id).catch(() => null);
}

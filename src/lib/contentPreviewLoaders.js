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
  normalizeConnectionForPreview,
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
        .select("id,from_user_id,to_user_id,text,result_images,created_at,from_profile:profiles!recommendations_from_user_id_fkey(display_name,avatar_url),to_profile:profiles!recommendations_to_user_id_fkey(display_name)")
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
};

export async function loadPreviewByRef(type, id) {
  const fn = LOADERS[type];
  if (!fn || !id) return null;
  return fn(id).catch(() => null);
}

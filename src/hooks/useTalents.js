// src/hooks/useTalents.js
// ══════════════════════════════════════════════════════════════════════
// TALENTE-ANGEBOTE — Hook fuer eigene Talent-Angebote (neues Modul)
// Analog zu useWorks-Mustern in diesem Repo: Laden + Realtime + CRUD-Helper.
// NICHT zu verwechseln mit useTalentActivation.js (Werde-Talent-Onboarding)
// oder TalentSection.jsx (Skill-Tags) — komplett getrennte, additive Funktion.
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Laedt alle eigenen Talent-Angebote (jeder Status) fuer den gegebenen userId,
 * mit Realtime-Sync bei Aenderungen (z.B. Admin setzt approved/rejected).
 */
export function useTalents(userId) {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) { setTalents([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("talents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) {
      console.error("[useTalents] load:", err.message);
      setError(err.message);
    } else {
      setError(null);
      setTalents(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("talents:" + userId)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "talents",
        filter: "user_id=eq." + userId,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  return { talents, loading, error, reload: load };
}

/** Erstellt ein neues Talent-Angebot (status startet immer als 'pending'). */
export async function createTalent({ userId, title, description, category, images }) {
  if (!userId || !title || !category) {
    return { data: null, error: new Error("userId, title und category sind erforderlich") };
  }
  return supabase.from("talents").insert({
    user_id: userId,
    title,
    description: description || null,
    category,
    images: images || [],
    status: "pending",
  }).select().single();
}

/**
 * Aktualisiert ein bestehendes Talent-Angebot (RLS erlaubt das nur solange
 * status != 'approved'). Bei Bearbeitung eines zuvor abgelehnten Angebots
 * wird der Status automatisch wieder auf 'pending' gesetzt (Resubmission),
 * die rejection_reason wird geleert.
 */
export async function updateTalent(id, { title, description, category, images, previousStatus }) {
  if (!id) return { data: null, error: new Error("id fehlt") };
  const payload = {};
  if (title       !== undefined) payload.title       = title;
  if (description  !== undefined) payload.description = description;
  if (category    !== undefined) payload.category    = category;
  if (images      !== undefined) payload.images      = images;
  if (previousStatus === "rejected") {
    payload.status = "pending";
    payload.rejection_reason = null;
  }
  return supabase.from("talents").update(payload).eq("id", id).select().single();
}

/** Loescht ein eigenes Talent-Angebot endgueltig (RLS: nur eigene Eintraege). */
export async function deleteTalent(id) {
  if (!id) return { error: new Error("id fehlt") };
  return supabase.from("talents").delete().eq("id", id);
}

/** Laedt Bilder in den bestehenden "media"-Bucket hoch (gleiches Muster wie Werke). */
export async function uploadTalentImage(userId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `talents/${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
  if (error) return { url: null, path: null, error };
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl, path, error: null };
}

export const TALENT_KATEGORIEN = [
  "Malerei", "Illustration", "Fotografie", "Musik", "Gesang", "Handwerk",
  "Programmierung", "Design", "Bildung", "Theater", "Coaching", "Naturführung",
  "Kochen", "Film", "Schreiben", "Töpfern", "Workshops", "Kunstberatung",
  "Auftragskunst", "Weitere Angebote",
];

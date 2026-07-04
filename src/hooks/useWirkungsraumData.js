// useWirkungsraumData — Datenlayer für Mein HUI (Orb / Wirkungsraum)
// Migriert aus MyCreatorDashboard.jsx (Produktmigration Mein HUI → Profil + Orb)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";

const safeStr = (v, fb = "") => (v && typeof v === "string" ? v.trim() : fb);
const safeNum = (v, fb = 0) => { const n = Number(v); return isFinite(n) ? n : fb; };

export function calcTrustStatus(recs = 0, experiences = 0) {
  if (recs >= 10 || experiences >= 20) return { icon: "💎", label: "Vertrauenspartner", color: "#D4952A" };
  if (recs >= 5  || experiences >= 10) return { icon: "🌳", label: "Bewährtes Mitglied", color: "#0DC4B5" };
  if (recs >= 2  || experiences >= 3)  return { icon: "🌿", label: "Empfohlenes Mitglied", color: "#22C55E" };
  return { icon: "🌱", label: "Neues Mitglied", color: "#7A8299" };
}

function daysSince(ts) {
  if (!ts) return null;
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return d >= 0 ? d : null;
}

function buildChronik(prof, works, exps, recs) {
  const events = [];
  if (prof?.membership_since || prof?.created_at) {
    events.push({
      date: prof.membership_since || prof.created_at,
      icon: "🌱",
      label: "HUI-Mitglied geworden",
    });
  }
  works.forEach(w => events.push({
    date: w.created_at, icon: "🎨", label: `Werk veröffentlicht: ${w.title || ""}`,
  }));
  exps.forEach(e => events.push({
    date: e.created_at, icon: "🔭", label: `Erlebnis erstellt: ${e.title || ""}`,
  }));
  recs.forEach((r, i) => {
    if (i < 3) events.push({ date: r.created_at, icon: "💚", label: "Weiterempfehlung erhalten" });
  });
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events.slice(0, 8);
}

export function useWirkungsraumData() {
  const { profile: rawAuth, user } = useAuth();
  const authId = rawAuth?.id || user?.id || null;

  const [loading, setLoading]       = useState(true);
  const [wirkenData, setWirkenData] = useState(null);
  const [recs, setRecs]             = useState([]);
  const [chronik, setChronik]       = useState([]);
  const [motivation, setMotivation] = useState("");
  const [motivSaving, setMotivSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!authId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [profRes, worksRes, expsRes, recsRes, fcRes, paymentsRes] = await Promise.all([
        supabase.from("profiles")
          .select("id,display_name,username,avatar_url,bio,motivation,member_since,created_at,impact_eur,experiences_count,connections_count")
          .eq("id", authId).single(),
        supabase.from("works")
          .select("id,created_at,title")
          .eq("user_id", authId)
          .order("created_at", { ascending: false }).limit(50),
        supabase.from("experiences")
          .select("id,created_at,title")
          .eq("user_id", authId)
          .order("created_at", { ascending: false }).limit(50),
        supabase.from("recommendations")
          .select(`id,text,is_public,created_at,
            from_profile:profiles!recommendations_from_user_id_fkey(display_name,avatar_url)`)
          .eq("to_user_id", authId)
          .eq("is_public", true)
          .order("created_at", { ascending: false }).limit(20),
        supabase.rpc("get_follow_counts", { target_id: authId }),
        supabase.from("payments")
          .select("impact_eur,created_at")
          .eq("user_id", authId).limit(200),
      ]);

      const prof  = profRes.data;
      const works = worksRes.data || [];
      const exps  = expsRes.data  || [];
      const recs_ = recsRes.data  || [];
      const pays  = paymentsRes.data || [];

      const motiv = safeStr(prof?.motivation || prof?.bio, "");
      setMotivation(motiv);

      const impactEur = pays.reduce((s, p) => s + safeNum(p.impact_eur), 0);
      const since = prof?.membership_since || prof?.created_at;
      const days = daysSince(since);

      setWirkenData({
        recs:        recs_.length,
        works:       works.length,
        exps:        exps.length,
        impact:      safeNum(prof?.experiences_count, 0) > 0 ? 1 : 0,
        since,
        days,
        impact_eur:  impactEur || safeNum(prof?.impact_eur, 0),
        connections: fcRes.data?.[0]?.followers ?? safeNum(prof?.connections_count, 0),
      });

      setRecs(recs_);
      setChronik(buildChronik(prof, works, exps, recs_));
    } catch (e) {
      console.error("[Wirkungsraum] load error:", e);
    } finally {
      setLoading(false);
    }
  }, [authId]);

  useEffect(() => { reload(); }, [reload]);

  const saveMotivation = useCallback(async (text) => {
    if (!authId) return false;
    setMotivSaving(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({ motivation: text })
        .eq("id", authId);
      if (!error) setMotivation(text);
      return !error;
    } finally {
      setMotivSaving(false);
    }
  }, [authId]);

  const trustStatus = calcTrustStatus(recs.length, wirkenData?.exps ?? 0);

  return {
    loading,
    wirkenData,
    recs,
    chronik,
    motivation,
    motivSaving,
    trustStatus,
    saveMotivation,
    reload,
    profileId: authId,
  };
}

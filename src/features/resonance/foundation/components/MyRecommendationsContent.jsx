// src/features/resonance/foundation/components/MyRecommendationsContent.jsx
// Extrahiert aus HuiStudio.jsx — gemeinsame Empfehlungs-Ansicht
// Keine neue Geschäftslogik, nur Wiederverwendung der produktiven Komponente.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../lib/supabaseClient.js";
import { ProfileService } from "../../../../services/db.js";
import EmptyState from "../../../../components/ui/EmptyState.jsx";

const REC_LABELS = {
  profile:    { emoji: "👤", label: "Profile",    desc: "Verbundene Nutzer" },
  project:    { emoji: "❤️", label: "Projekte",   desc: "Unterstützte Projekte" },
  work:       { emoji: "🎨", label: "Werke",      desc: "Gekaufte Werke" },
  experience: { emoji: "✨", label: "Erlebnisse", desc: "Erlebte Erlebnisse" },
  event:      { emoji: "🗓️", label: "Events",     desc: "Teilgenommene Events" },
  order:      { emoji: "🛒", label: "Bestellungen", desc: "Bestellte Artikel" },
};

const CAT_ORDER = ["profile", "project", "work", "experience", "event"];

export default function MyRecommendationsContent({ userId, embedded = false, onClose }) {
  const navigate = useNavigate();

  const [recs,      setRecs]      = useState([]);
  const [details,   setDetails]   = useState({});
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let dead = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_recommendations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (dead) return;

        const rows = data || [];
        setRecs(rows);

        const enriched = {};

        const profileIds = rows.filter(r => r.item_type === "profile").map(r => r.item_id);
        if (profileIds.length) {
          const { data: profs } = await ProfileService.getMany(profileIds);
          (profs || []).forEach(p => {
            enriched[p.id] = {
              title: p.display_name || p.username || "Nutzer",
              subtitle: "@" + (p.username || ""),
              image: p.avatar_url,
              profileId: p.id,
              username: p.username,
            };
          });
        }

        const projectIds = rows.filter(r => r.item_type === "project").map(r => r.item_id);
        if (projectIds.length) {
          const { data: projs } = await supabase
            .from("impact_projects")
            .select("id, name, icon, category")
            .in("id", projectIds);
          (projs || []).forEach(p => {
            enriched[p.id] = { title: p.name || "Projekt", subtitle: p.category || "", image: null, icon: p.icon || "🌱" };
          });
        }

        const workIds = rows.filter(r => r.item_type === "work").map(r => r.item_id);
        if (workIds.length) {
          const { data: wrks } = await supabase
            .from("works")
            .select("id, title, cover_url, user_id, category")
            .in("id", workIds);
          (wrks || []).forEach(w => {
            enriched[w.id] = { title: w.title || "Werk", subtitle: w.category || "", image: w.cover_url };
          });
        }

        const expIds = rows.filter(r => r.item_type === "experience").map(r => r.item_id);
        if (expIds.length) {
          const { data: exps } = await supabase
            .from("experiences")
            .select("id, title, cover_url, category")
            .in("id", expIds);
          (exps || []).forEach(e => {
            enriched[e.id] = { title: e.title || "Erlebnis", subtitle: e.category || "", image: e.cover_url };
          });
        }

        if (!dead) setDetails(enriched);
      } catch (e) {
        console.warn("[MyRecommendationsContent]", e?.message);
      }
      if (!dead) setLoading(false);
    };

    load();
    return () => { dead = true; };
  }, [userId]);

  const filtered = activeTab === "all" ? recs : recs.filter(r => r.item_type === activeTab);
  const counts   = CAT_ORDER.reduce((acc, t) => { acc[t] = recs.filter(r => r.item_type === t).length; return acc; }, {});
  const hasTabs  = CAT_ORDER.filter(t => counts[t] > 0);

  function handleItemClick(rec) {
    const d = details[rec.item_id] || {};
    const t = rec.item_type;

    if (t === "work") {
      onClose?.();
      navigate(`/work/${rec.item_id}`);
    } else if (t === "profile") {
      onClose?.();
      if (d.username) navigate(`/profile/${d.username}`);
      else if (d.profileId) navigate(`/profile/${d.profileId}`);
    } else if (t === "project") {
      onClose?.();
      navigate("/impact");
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(26,26,24,0.4)", fontSize: 13 }}>
        Lade Empfehlungen…
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <EmptyState
        preset="saves"
        icon="⭐"
        title="Noch keine Empfehlungen"
        body="Kaufe, unterstütze oder verbinde dich — deine ausgesprochenen Empfehlungen erscheinen hier."
        compact={embedded}
      />
    );
  }

  return (
    <div style={{ padding: embedded ? "0 20px 24px" : "12px 16px" }}>
      {hasTabs.length > 1 && (
        <div style={{
          display: "flex", gap: 8, paddingBottom: 14, overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          <button onClick={() => setActiveTab("all")} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 500, flexShrink: 0,
            background: activeTab === "all" ? "#0EC4B8" : "rgba(26,26,24,0.07)",
            color: activeTab === "all" ? "#fff" : "#1A1A18",
          }}>
            Alle ({recs.length})
          </button>
          {hasTabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 500, flexShrink: 0,
              background: activeTab === t ? "#0EC4B8" : "rgba(26,26,24,0.07)",
              color: activeTab === t ? "#fff" : "#1A1A18",
            }}>
              {REC_LABELS[t]?.emoji} {REC_LABELS[t]?.label} ({counts[t]})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="⭐"
          title={`Keine ${REC_LABELS[activeTab]?.label || ""} noch`}
          body={REC_LABELS[activeTab]?.desc || "Sobald du etwas empfiehlst, erscheint es hier."}
          compact
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(rec => {
            const d = details[rec.item_id] || {};
            const L = REC_LABELS[rec.item_type] || { emoji: "📌", label: rec.item_type };
            const isClickable = ["work", "profile", "project"].includes(rec.item_type);

            return (
              <div
                key={rec.id}
                onClick={isClickable ? () => handleItemClick(rec) : undefined}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? e => e.key === "Enter" && handleItemClick(rec) : undefined}
                style={{
                  background: "#fff", borderRadius: 14,
                  border: "1px solid rgba(26,26,24,0.08)",
                  padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "0 1px 4px rgba(26,26,24,0.05)",
                  cursor: isClickable ? "pointer" : "default",
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: rec.item_type === "profile" ? "50%" : 10,
                  background: "rgba(14,196,184,0.10)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", fontSize: 20,
                }}>
                  {d.image
                    ? <img src={d.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span>{d.icon || L.emoji}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: "#1A1A18", marginBottom: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {d.title || rec.item_id?.slice(0, 8) + "…"}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(26,26,24,0.45)" }}>
                    {d.subtitle || L.label} · {new Date(rec.created_at).toLocaleDateString("de-DE")}
                  </div>
                </div>
                <div style={{
                  padding: "4px 10px", borderRadius: 20,
                  background: "rgba(14,196,184,0.10)",
                  fontSize: 11, fontWeight: 600, color: "#0EC4B8", flexShrink: 0,
                }}>
                  {L.emoji} {L.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { REC_LABELS, CAT_ORDER };

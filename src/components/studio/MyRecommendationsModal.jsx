// src/components/studio/MyRecommendationsModal.jsx
// ══════════════════════════════════════════════════════════
// Extrahiert aus HuiStudio.jsx (PROFIL-DRAWER-REDESIGN-003, 2026-07-06).
// Grund: "Meine Empfehlungen" zieht vom Studio (jetzt nur noch "Einstellungen")
// in das neue Drawer-Menü auf der Profilseite um (MeinBereichMenu.jsx).
// Code 1:1 unveraendert uebernommen, nur eigenstaendig importierbar gemacht.
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useHome } from "../home/HomeShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { ProfileService } from "../../services/db";

// MyRecommendationsModal — Meine Empfehlungen
// Zeigt alle user_recommendations des eingeloggten Nutzers
// Kategorien: profile, project, work (vorbereitet), experience (vorbereitet)
// ═══════════════════════════════════════════════════════════════
const REC_LABELS = {
  profile:    { emoji: "👤", label: "Profile",           desc: "Verbundene Nutzer" },
  project:    { emoji: "❤️", label: "Projekte",          desc: "Unterstützte Projekte" },
  work:       { emoji: "🎨", label: "Werke",             desc: "Gekaufte Werke" },
  experience: { emoji: "✨", label: "Erlebnisse",        desc: "Erlebte Erlebnisse" },
  event:      { emoji: "🗓️", label: "Events",            desc: "Teilgenommene Events" },
  order:      { emoji: "🛒", label: "Bestellungen",      desc: "Bestellte Artikel" },
};

const CAT_ORDER = ["profile", "project", "work", "experience", "event"];

function MyRecommendationsModal({ userId, onClose }) {
  const { openProfileById } = useHome();
  const [recs,     setRecs]     = useState([]);
  const [details,  setDetails]  = useState({}); // item_id → enriched data
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_recommendations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = data || [];
        setRecs(rows);

        // Enrich: Daten pro item_type nachladen
        const enriched = {};

        // Profile → profiles
        const profileIds = rows.filter(r => r.item_type === "profile").map(r => r.item_id);
        if (profileIds.length) {
          // ProfileService v1.0
          const { data: profs } = await ProfileService.getMany(profileIds);
          (profs || []).forEach(p => { enriched[p.id] = { title: p.display_name || p.username || "Nutzer", subtitle: "@" + (p.username || ""), image: p.avatar_url, profileId: p.id, username: p.username }; });
        }

        // Projects → impact_projects
        const projectIds = rows.filter(r => r.item_type === "project").map(r => r.item_id);
        if (projectIds.length) {
          const { data: projs } = await supabase
            .from("impact_projects")
            .select("id, name, icon, category")
            .in("id", projectIds);
          (projs || []).forEach(p => { enriched[p.id] = { title: p.name || "Projekt", subtitle: p.category || "", image: null, icon: p.icon || "🌱" }; });
        }

        // Works → works
        const workIds = rows.filter(r => r.item_type === "work").map(r => r.item_id);
        if (workIds.length) {
          const { data: wrks } = await supabase
            .from("works")
            .select("id, title, cover_url, user_id, category")
            .in("id", workIds);
          (wrks || []).forEach(w => { enriched[w.id] = { title: w.title || "Werk", subtitle: w.category || "", image: w.cover_url }; });
        }

        // Experiences → experiences
        const expIds = rows.filter(r => r.item_type === "experience").map(r => r.item_id);
        if (expIds.length) {
          const { data: exps } = await supabase
            .from("experiences")
            .select("id, title, cover_url, category")
            .in("id", expIds);
          (exps || []).forEach(e => { enriched[e.id] = { title: e.title || "Erlebnis", subtitle: e.category || "", image: e.cover_url }; });
        }

        setDetails(enriched);
      } catch (e) {
        console.warn("[MyRec] Fehler:", e);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const filtered = activeTab === "all" ? recs : recs.filter(r => r.item_type === activeTab);
  const counts   = CAT_ORDER.reduce((acc, t) => { acc[t] = recs.filter(r => r.item_type === t).length; return acc; }, {});
  const hasTabs  = CAT_ORDER.filter(t => counts[t] > 0);

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(26,26,24,0.55)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)",
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:"#F7F5F0", borderRadius:"20px 20px 0 0",
        maxHeight:"88vh", display:"flex", flexDirection:"column",
        paddingBottom:88,
      }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 20px 14px", borderBottom:"1px solid rgba(26,26,24,0.08)",
          flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:"#1A1A18", letterSpacing:"-0.02em" }}>
              ⭐ Meine Empfehlungen
            </div>
            <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)", marginTop:2 }}>
              {recs.length === 0 ? "Noch keine Empfehlungen" : `${recs.length} Empfehlung${recs.length !== 1 ? "en" : ""}`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", borderRadius:10,
            width:34, height:34, cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        </div>

        {/* Tabs */}
        {hasTabs.length > 1 && (
          <div style={{
            display:"flex", gap:8, padding:"12px 16px", overflowX:"auto",
            flexShrink:0, borderBottom:"1px solid rgba(26,26,24,0.06)",
          }}>
            <button onClick={() => setActiveTab("all")} style={{
              padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, flexShrink:0,
              background: activeTab === "all" ? "#0EC4B8" : "rgba(26,26,24,0.07)",
              color:       activeTab === "all" ? "#fff"    : "#1A1A18",
            }}>Alle ({recs.length})</button>
            {hasTabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, flexShrink:0,
                background: activeTab === t ? "#0EC4B8" : "rgba(26,26,24,0.07)",
                color:       activeTab === t ? "#fff"    : "#1A1A18",
              }}>{REC_LABELS[t]?.emoji} {REC_LABELS[t]?.label} ({counts[t]})</button>
            ))}
          </div>
        )}

        {/* Liste */}
        <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, padding:"12px 16px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(26,26,24,0.4)", fontSize:13 }}>
              Lade Empfehlungen…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"50px 20px" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⭐</div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1A1A18", marginBottom:6 }}>
                {activeTab === "all" ? "Noch keine Empfehlungen" : `Keine ${REC_LABELS[activeTab]?.label || ""} noch`}
              </div>
              <div style={{ fontSize:13, color:"rgba(26,26,24,0.45)", lineHeight:1.5 }}>
                {activeTab === "profile"   && "Verbinde dich mit anderen Nutzern, um sie zu empfehlen."}
                {activeTab === "project"   && "Unterstütze ein Impact-Projekt, um es hier zu sehen."}
                {activeTab === "work"      && "Kaufe ein Werk, um es hier zu empfehlen."}
                {activeTab === "experience"&& "Nimm an einem Erlebnis teil, um es hier zu sehen."}
                {activeTab === "all"       && "Kaufe, unterstütze oder verbinde dich, um Empfehlungen zu sammeln."}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(rec => {
                const d = details[rec.item_id] || {};
                const L = REC_LABELS[rec.item_type] || { emoji:"📌", label: rec.item_type };
                // ── Routing: nur existierende Routen ──────────────────
                // work   → /work/:id          (Route existiert ✅)
                // profile→ /profile/:username  (Route existiert ✅, braucht username)
                // project→ /impact             (keine /projects/:id Route → Impact-Page)
                // experience / event → noch keine Route → Hinweis
                const handleClick = () => {
                  const t = rec.item_type;
                  try {
                    if (t === "work") {
                      if (d.exists === false) { alert("Dieses Werk existiert nicht mehr."); return; }
                      onClose();
                      window.history.pushState({}, "", `/work/${rec.item_id}`);
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    } else if (t === "profile") {
                      const pid = d.profileId;
                      const uname = d.username;
                      if (!pid && !uname) { alert("Dieses Profil existiert nicht mehr."); return; }
                      onClose();
                      if (pid) {
                        openProfileById(pid);
                      } else {
                        window.history.pushState({}, "", `/profile/${uname}`);
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }
                    } else if (t === "project") {
                      onClose();
                      window.history.pushState({}, "", `/impact`);
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    } else if (t === "experience") {
                      alert("Erlebnis-Detailseite ist noch nicht verfügbar.");
                    } else if (t === "event") {
                      alert("Event-Detailseite ist noch nicht verfügbar.");
                    }
                  } catch(e) {
                    console.warn("[MyRec] Navigation Fehler:", e);
                  }
                };
                const isClickable = ["work","profile","project","experience","event"].includes(rec.item_type);

                return (
                  <div
                    key={rec.id}
                    onClick={handleClick}
                    style={{
                      background:"#fff", borderRadius:14,
                      border:"1px solid rgba(26,26,24,0.08)",
                      padding:"14px 16px",
                      display:"flex", alignItems:"center", gap:14,
                      boxShadow:"0 1px 4px rgba(26,26,24,0.05)",
                      cursor:"pointer",
                      transition:"transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "scale(1.015)";
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,196,184,0.20)";
                      e.currentTarget.style.borderColor = "rgba(14,196,184,0.40)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 1px 4px rgba(26,26,24,0.05)";
                      e.currentTarget.style.borderColor = "rgba(26,26,24,0.08)";
                    }}
                  >
                    {/* Bild / Avatar */}
                    <div style={{
                      width:46, height:46, borderRadius: rec.item_type === "profile" ? "50%" : 10,
                      background:"rgba(14,196,184,0.10)", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      overflow:"hidden", fontSize:20,
                    }}>
                      {d.image
                        ? <img src={d.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <span>{d.icon || L.emoji}</span>
                      }
                    </div>
                    {/* Text */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#1A1A18", marginBottom:2,
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {d.title || rec.item_id.slice(0,8) + "…"}
                      </div>
                      <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)" }}>
                        {d.subtitle || L.label} · {new Date(rec.created_at).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    {/* Badge + Pfeil */}
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                      <div style={{
                        padding:"4px 10px", borderRadius:20,
                        background:"rgba(14,196,184,0.10)",
                        fontSize:11, fontWeight:600, color:"#0EC4B8",
                      }}>{L.emoji} {L.label}</div>
                      <span style={{ fontSize:16, color:"rgba(14,196,184,0.55)", fontWeight:600 }}>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


export default MyRecommendationsModal;

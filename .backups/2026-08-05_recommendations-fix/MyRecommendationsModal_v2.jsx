import { HUIEmpfehlungIcon, HUIProfilIcon, HUIWerkeIcon, HUIErlebnisIcon, HUIImpactIcon } from '../../design/icons/HuiSystemIcons.jsx';
import { HUIChatIcon } from '../../design/icons/HuiInteractionIcons.jsx';
// src/components/studio/MyRecommendationsModal.jsx
// ══════════════════════════════════════════════════════════
// "Meine Empfehlungen" — Empfehlungen/Verbindungen die der Nutzer hat.
// Liest aus `user_recommendations WHERE user_id = currentUser`.
//
// Fix 2026-08-05 (v2): Zurück auf user_recommendations (hat echte Daten:
// follows + project_support). Bei Klick auf einen Profil-Eintrag wird
// der CHAT mit der Person geöffnet (nicht das öffentliche Profil).
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useHome } from "../home/HomeShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { ProfileService } from "../../services/db";

function timeAgo(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  return `vor ${d} Tag${d !== 1 ? "en" : ""}`;
}

const TYPE_META = {
  profile:    { label: "Profil",     icon: "👤" },
  project:    { label: "Projekt",    icon: "❤️" },
  work:       { label: "Werk",       icon: "🎨" },
  experience: { label: "Erlebnis",   icon: "✨" },
  event:      { label: "Event",      icon: "🗓️" },
};

const FILTER_KEYS = ["all", "profile", "project", "work", "experience"];

function MyRecommendationsModal({ userId, onClose = () => {} }) {
  const { setChatRecipient, setShowChat, openProfileById } = useHome() || {};
  const [items, setItems]           = useState([]);
  const [enrichment, setEnrichment] = useState({}); // item_id → meta
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

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
        setItems(rows);

        // Anreicherung: Profile + Projekte + Werke + Erlebnisse batchen
        const meta = {};

        // Profile
        const profileIds = [...new Set(rows.filter(r => r.item_type === "profile").map(r => r.item_id))];
        if (profileIds.length) {
          const { data: profs } = await ProfileService.getMany(profileIds.slice(0, 50));
          (profs || []).forEach(p => {
            meta[p.id] = {
              title: p.display_name || p.username || "Mitglied",
              subtitle: p.username ? "@" + p.username : "",
              image: p.avatar_url || null,
              profileId: p.id,
              username: p.username,
            };
          });
        }

        // Projekte
        const projectIds = [...new Set(rows.filter(r => r.item_type === "project").map(r => r.item_id))];
        if (projectIds.length) {
          const { data: projects } = await supabase
            .from("impact_projects")
            .select("id, name, icon, category")
            .in("id", projectIds);
          (projects || []).forEach(p => {
            meta[p.id] = { title: p.name || "Projekt", subtitle: p.category || "", image: null, icon: p.icon || "🌱" };
          });
        }

        // Werke
        const workIds = [...new Set(rows.filter(r => r.item_type === "work").map(r => r.item_id))];
        if (workIds.length) {
          const { data: works } = await supabase
            .from("works")
            .select("id, title, cover_url, category")
            .in("id", workIds);
          (works || []).forEach(w => {
            meta[w.id] = { title: w.title || "Werk", subtitle: w.category || "", image: w.cover_url || null };
          });
        }

        // Erlebnisse
        const expIds = [...new Set(rows.filter(r => r.item_type === "experience").map(r => r.item_id))];
        if (expIds.length) {
          const { data: exps } = await supabase
            .from("experiences")
            .select("id, title, cover_url, category")
            .in("id", expIds);
          (exps || []).forEach(e => {
            meta[e.id] = { title: e.title || "Erlebnis", subtitle: e.category || "", image: e.cover_url || null };
          });
        }

        setEnrichment(meta);
      } catch (e) {
        console.warn("[MyRec] Fehler:", e);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const filtered = activeFilter === "all"
    ? items
    : items.filter(i => i.item_type === activeFilter);

  const handleClick = (item) => {
    const meta = enrichment[item.item_id] || {};
    const type = item.item_type;

    if (type === "profile") {
      // Chat öffnen statt öffentliches Profil
      const profileId = meta.profileId || item.item_id;
      const username = meta.username || null;
      if (profileId) {
        setChatRecipient?.({
          id: profileId,
          display_name: meta.title || "Mitglied",
          avatar_url: meta.image || null,
        });
        setShowChat?.(true);
        onClose();
      } else if (username) {
        // Fallback: Profil über Username
        onClose();
        window.history.pushState({}, "", `/profile/${username}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } else if (type === "work") {
      onClose();
      window.history.pushState({}, "", `/work/${item.item_id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (type === "experience") {
      onClose();
      window.history.pushState({}, "", `/erlebnis/${item.item_id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (type === "project") {
      onClose();
      window.history.pushState({}, "", "/impact");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const counts = {};
  items.forEach(i => { counts[i.item_type] = (counts[i.item_type] || 0) + 1; });
  const activeFilters = FILTER_KEYS.filter(k => k === "all" || counts[k] > 0);

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
              Meine Empfehlungen
            </div>
            <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)", marginTop:2 }}>
              {items.length === 0 ? "Noch keine Empfehlungen" : `${items.length} Empfehlung${items.length !== 1 ? "en" : ""}`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", borderRadius:10,
            width:34, height:34, cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        </div>

        {/* Filter-Tabs */}
        {activeFilters.length > 1 && (
          <div style={{
            display:"flex", gap:8, padding:"12px 16px",
            overflowX:"auto", flexShrink:0,
            borderBottom:"1px solid rgba(26,26,24,0.06)",
          }}>
            {activeFilters.map(k => (
              <button
                key={k}
                onClick={() => setActiveFilter(k)}
                style={{
                  padding:"6px 14px", borderRadius:20, border:"none",
                  cursor:"pointer", fontSize:12, fontWeight:500, flexShrink:0,
                  background: activeFilter === k ? "#0EC4B8" : "rgba(26,26,24,0.07)",
                  color: activeFilter === k ? "#fff" : "#1A1A18",
                }}
              >
                {k === "all" ? `Alle (${items.length})` : `${TYPE_META[k]?.label || k} (${counts[k] || 0})`}
              </button>
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
              <div style={{marginBottom:12, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)"}}>
                <HUIEmpfehlungIcon size={36}/>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1A1A18", marginBottom:6 }}>
                Noch keine Empfehlungen
              </div>
              <div style={{ fontSize:13, color:"rgba(26,26,24,0.45)", lineHeight:1.5 }}>
                Verbinde dich mit anderen Nutzern oder unterstütze Projekte, um Empfehlungen zu sammeln.
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(item => {
                const meta = enrichment[item.item_id] || {};
                const typeInfo = TYPE_META[item.item_type] || { label: item.item_type, icon: "📌" };
                const title = meta.title || typeInfo.label;
                const subtitle = meta.subtitle || "";
                const image = meta.image || null;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleClick(item)}
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
                      e.currentTarget.style.transform = "scale(1.01)";
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,196,184,0.15)";
                      e.currentTarget.style.borderColor = "rgba(14,196,184,0.30)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 1px 4px rgba(26,26,24,0.05)";
                      e.currentTarget.style.borderColor = "rgba(26,26,24,0.08)";
                    }}
                  >
                    {/* Avatar / Icon */}
                    <div style={{
                      width:42, height:42, borderRadius:"50%",
                      background:"rgba(14,196,184,0.10)", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      overflow:"hidden",
                    }}>
                      {image
                        ? <img loading="lazy" decoding="async" src={image} alt={title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <span style={{ fontSize:18 }}>{typeInfo.icon}</span>
                      }
                    </div>
                    {/* Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#1A1A18", marginBottom:2 }}>
                        {title}
                      </div>
                      {subtitle && (
                        <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)", marginBottom:2 }}>
                          {subtitle}
                        </div>
                      )}
                      <div style={{ fontSize:11, color:"rgba(26,26,24,0.35)" }}>
                        {typeInfo.label} · {timeAgo(item.created_at)}
                      </div>
                    </div>
                    {/* Chat-Icon bei Profilen */}
                    {item.item_type === "profile" && (
                      <div style={{
                        flexShrink:0, width:32, height:32, borderRadius:"50%",
                        background:"rgba(14,196,184,0.10)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <HUIChatIcon size={16} />
                      </div>
                    )}
                    {/* Pfeil bei anderen Typen */}
                    {item.item_type !== "profile" && (
                      <div style={{ flexShrink:0, paddingTop:8 }}>
                        <span style={{ fontSize:16, color:"rgba(14,196,184,0.55)", fontWeight:600 }}>›</span>
                      </div>
                    )}
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

import { HUIEmpfehlungIcon, HUIProfilIcon } from '../../design/icons/HuiSystemIcons.jsx';
// src/components/studio/MyRecommendationsModal.jsx
// ══════════════════════════════════════════════════════════
// "Meine Empfehlungen" — Empfehlungen die der Nutzer gegeben hat.
// Liest aus `recommendations WHERE from_user_id = currentUser`.
// Empfänger-Profile werden via profiles-Tabelle angereichert.
// Fix 2026-08-05: vorher user_recommendations (leere Tabelle) → jetzt recommendations (SSOT).
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

function MyRecommendationsModal({ userId, onClose = () => {} }) {
  const { openProfileById } = useHome();
  const [recs, setRecs]       = useState([]);
  const [profiles, setProfiles] = useState({}); // to_user_id → profile data
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        // Lese Empfehlungen die der Nutzer VERGEBEN hat (from_user_id = sich selbst)
        const { data, error } = await supabase
          .from("recommendations")
          .select("id,to_user_id,text,order_id,booking_id,created_at,is_public")
          .eq("from_user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = data || [];
        setRecs(rows);

        // Empfänger-Profile anreichern
        const toIds = [...new Set(rows.map(r => r.to_user_id).filter(Boolean))];
        if (toIds.length) {
          const { data: profs } = await ProfileService.getMany(toIds.slice(0, 50));
          const map = {};
          (profs || []).forEach(p => { map[p.id] = p; });
          setProfiles(map);
        }
      } catch (e) {
        console.warn("[MyRec] Fehler:", e);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

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
              {recs.length === 0 ? "Noch keine Empfehlungen vergeben" : `${recs.length} Empfehlung${recs.length !== 1 ? "en" : ""} vergeben`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", borderRadius:10,
            width:34, height:34, cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        </div>

        {/* Liste */}
        <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, padding:"12px 16px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(26,26,24,0.4)", fontSize:13 }}>
              Lade Empfehlungen…
            </div>
          ) : recs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"50px 20px" }}>
              <div style={{marginBottom:12, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)"}}>
                <HUIEmpfehlungIcon size={36}/>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1A1A18", marginBottom:6 }}>
                Noch keine Empfehlungen vergeben
              </div>
              <div style={{ fontSize:13, color:"rgba(26,26,24,0.45)", lineHeight:1.5 }}>
                Besuche ein Profil von jemandem, bei dem du etwas gekauft oder gebucht hast, um eine Empfehlung zu schreiben.
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {recs.map(rec => {
                const prof = profiles[rec.to_user_id] || {};
                const name = prof.display_name || prof.username || "Mitglied";
                const avatar = prof.avatar_url || null;
                const uname = prof.username || null;
                const text = rec.text || "";

                const handleClick = () => {
                  if (rec.to_user_id) {
                    onClose();
                    openProfileById?.(rec.to_user_id);
                  }
                };

                return (
                  <div
                    key={rec.id}
                    onClick={handleClick}
                    style={{
                      background:"#fff", borderRadius:14,
                      border:"1px solid rgba(26,26,24,0.08)",
                      padding:"14px 16px",
                      display:"flex", alignItems:"flex-start", gap:12,
                      boxShadow:"0 1px 4px rgba(26,26,24,0.05)",
                      cursor: rec.to_user_id ? "pointer" : "default",
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
                    {/* Avatar */}
                    <div style={{
                      width:42, height:42, borderRadius:"50%",
                      background:"rgba(14,196,184,0.10)", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      overflow:"hidden",
                    }}>
                      {avatar
                        ? <img loading="lazy" decoding="async" src={avatar} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <HUIProfilIcon size={20} />
                      }
                    </div>
                    {/* Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#1A1A18", marginBottom:4 }}>
                        {name}
                      </div>
                      <div style={{
                        fontSize:13, color:"rgba(26,26,24,0.60)", lineHeight:1.5,
                        fontStyle:"italic", marginBottom:6,
                        display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical",
                        overflow:"hidden",
                      }}>
                        ❝ {text}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(26,26,24,0.35)" }}>
                        {timeAgo(rec.created_at)} {rec.order_id ? "· nach Kauf" : rec.booking_id ? "· nach Buchung" : ""}
                      </div>
                    </div>
                    {/* Pfeil */}
                    {rec.to_user_id && (
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

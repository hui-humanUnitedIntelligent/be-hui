import { HUIEmpfehlungIcon } from '../../design/icons/HuiSystemIcons.jsx';
// src/components/studio/MyRecommendationsModal.jsx
// ══════════════════════════════════════════════════════════
// "Meine Empfehlungen" — Empfehlungen (Textbewertungen), die der
// Nutzer FÜR ANDERE geschrieben hat. Liest aus `recommendations`
// WHERE from_user_id = currentUser (Gegenstück zu RecommendationsSection,
// die to_user_id = currentUser liest, d.h. erhaltene "Kundenstimmen").
//
// Fix 2026-08-05 (v3, final): Vorherige Versionen lasen fälschlich aus
// `user_recommendations` (Follows/Projekt-Support) und öffneten bei Klick
// den Chat. Michael hat klargestellt: Es soll der geschriebene
// Empfehlungs-TEXT angezeigt werden; Klick öffnet das öffentliche Profil
// des Empfängers — kein Chat.
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useHome } from "../home/HomeShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { ProfileService } from "../../services/db";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useTranslation } from "../../hooks/useTranslation.js";

function timeAgo(iso, t) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return t ? t("common.justNow") : "Gerade eben";
  if (m < 60) return t ? t("common.minutesAgoShort", {n: m}) : `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return t ? t("common.hoursAgoShort", {n: h}) : `vor ${h} Std`;
  const d = Math.floor(h / 24);
  return t ? t("common.daysAgoShort", {n: d}) : `vor ${d} Tag${d !== 1 ? "en" : ""}`;
}

function MyRecommendationsModal({ userId, onClose = () => {} }) {
  const { t } = useTranslation();
  useModalRegistration(true, onClose, "MyRecommendationsModal");
  const { openProfileById } = useHome() || {};
  const [items, setItems]     = useState([]);
  const [profiles, setProfiles] = useState({}); // to_user_id → profile meta
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("recommendations")
          .select("id,from_user_id,to_user_id,text,is_public,created_at")
          .eq("from_user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = data || [];
        setItems(rows);

        const toIds = [...new Set(rows.map(r => r.to_user_id).filter(Boolean))];
        if (toIds.length) {
          const { data: profs } = await ProfileService.getMany(toIds.slice(0, 100));
          const meta = {};
          (profs || []).forEach(p => {
            meta[p.id] = {
              name: p.display_name || p.username || p.nickname || "Mitglied",
              avatar: p.avatar_url || null,
              username: p.username || null,
            };
          });
          setProfiles(meta);
        }
      } catch (e) {
        console.warn("[MyRec] Fehler:", e);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleClick = (item) => {
    if (!item.to_user_id) return;
    onClose();
    if (typeof openProfileById === "function") {
      openProfileById(item.to_user_id);
    } else {
      // Fallback falls useHome() nicht verfügbar ist
      window.dispatchEvent(new CustomEvent("hui:open-profile", { detail: { id: item.to_user_id } }));
    }
  };

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
            <div style={{ fontSize:18, fontWeight: 600, color:"#1A1A18", letterSpacing:"-0.02em" }}>
              {t("meinBereich.myRecommendations")}
            </div>
            <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)", marginTop:2 }}>
              {items.length === 0 ? t("rec.noneWritten") : items.length === 1 ? t("rec.countWritten", {count: items.length}) : t("rec.countWrittenPlural", {count: items.length})}
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
              {t("rec.loading")}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign:"center", padding:"50px 20px" }}>
              <div style={{marginBottom:12, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)"}}>
                <HUIEmpfehlungIcon size={36}/>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1A1A18", marginBottom:6 }}>
                {t("rec.noneWritten")}
              </div>
              <div style={{ fontSize:13, color:"rgba(26,26,24,0.45)", lineHeight:1.5 }}>
                {t("profile.recommendationExplain")}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {items.map(item => {
                const p = profiles[item.to_user_id] || {};
                return (
                  <div
                    key={item.id}
                    onClick={() => handleClick(item)}
                    style={{
                      display:"flex", gap:12, padding:"12px 14px",
                      background:"#fff", borderRadius:14,
                      border:"1px solid rgba(26,26,24,0.06)",
                      cursor:"pointer",
                    }}
                  >
                    {p.avatar ? (
                      <img src={p.avatar} alt="" style={{
                        width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0,
                      }}/>
                    ) : (
                      <div style={{
                        width:40, height:40, borderRadius:"50%", flexShrink:0,
                        background:"rgba(14,196,184,0.12)", color:"#0EC4B8",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:15, fontWeight: 600,
                      }}>
                        {(p.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:8 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:"#1A1A18" }}>
                          {p.name || "Mitglied"}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(26,26,24,0.4)", flexShrink:0 }}>
                          {timeAgo(item.created_at, t)}
                        </div>
                      </div>
                      <div style={{
                        fontSize:13, color:"rgba(26,26,24,0.7)", marginTop:4,
                        lineHeight:1.4, display:"-webkit-box",
                        WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden",
                      }}>
                        {item.text || "—"}
                      </div>
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

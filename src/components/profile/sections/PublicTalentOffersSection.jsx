// src/components/profile/sections/PublicTalentOffersSection.jsx
// Talent-Angebote im öffentlichen Profil — nur approved, read-only
// 100x100px horizontaler Slider, analog zu WorksSection/MomentsSection

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient.js";
import { HUILogo } from "../../brand/HUILogo.jsx";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealSoft:"rgba(14,196,184,0.08)",
  border:"rgba(26,26,24,0.08)", r12:12, r16:16, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

const CSS = `
  .pts-scroll { scrollbar-width:none; -ms-overflow-style:none; -webkit-overflow-scrolling:touch; }
  .pts-scroll::-webkit-scrollbar { display:none; }
  @keyframes pts-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

function Skel() {
  return (
    <div style={{
      width:100, height:100, borderRadius:T.r12, flexShrink:0,
      background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
      backgroundSize:"200% 100%", animation:"pts-shimmer 1.4s ease-in-out infinite",
    }}/>
  );
}

// Preis-Hilfsfunktion
function formatPrice(talent) {
  if (talent.price_per_session) return `${talent.price_per_session} ${talent.currency || "€"}`;
  if (talent.price_per_hour)    return `${talent.price_per_hour} ${talent.currency || "€"}/Std.`;
  return null;
}

// Standort-Label
function locationLabel(talent) {
  if (talent.location_type === "online")  return "Online";
  if (talent.location_type === "hybrid")  return "Hybrid";
  if (talent.location_type === "vor_ort") return "Vor Ort";
  return null;
}

// Einzelne Kachel
function TalentCard({ talent, onClick }) {
  const cover = Array.isArray(talent.images) && talent.images[0]?.url;
  const price = formatPrice(talent);
  const loc   = locationLabel(talent);

  return (
    <div
      onClick={onClick}
      style={{
        width:100, flexShrink:0,
        display:"flex", flexDirection:"column", gap:5,
        cursor:"pointer",
        WebkitTapHighlightColor:"transparent",
      }}
    >
      {/* Bild */}
      <div style={{
        width:100, height:100, borderRadius:T.r12,
        overflow:"hidden", background:"#e8e4de", position:"relative",
        boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
        border:"1px solid rgba(0,0,0,0.05)",
      }}>
        {cover
          ? <img loading="lazy" decoding="async" src={cover} alt={talent.title||""}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{
              width:"100%", height:"100%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28,
            }}>💼</div>
        }
        {/* Preis-Badge oben rechts */}
        {price && (
          <div style={{
            position:"absolute", top:5, right:5,
            background:"rgba(14,196,184,0.92)", backdropFilter:"blur(4px)",
            borderRadius:6, padding:"2px 5px",
            fontSize:9, fontWeight:700, color:"#fff",
            letterSpacing:"0.2px",
          }}>{price}</div>
        )}
        {/* Standort-Badge unten links */}
        {loc && (
          <div style={{
            position:"absolute", bottom:5, left:5,
            background:"rgba(26,26,24,0.65)", backdropFilter:"blur(4px)",
            borderRadius:5, padding:"2px 5px",
            fontSize:8, fontWeight:600, color:"rgba(255,255,255,0.9)",
          }}>{loc}</div>
        )}
      </div>

      {/* Titel */}
      <div style={{
        fontSize:11, fontWeight:600, color:T.ink,
        lineHeight:1.3, wordBreak:"break-word",
        display:"-webkit-box", WebkitLineClamp:2,
        WebkitBoxOrient:"vertical", overflow:"hidden",
        width:100,
      }}>{talent.title}</div>

      {/* Kategorie */}
      {talent.category && (
        <div style={{
          fontSize:10, color:T.teal, fontWeight:600,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          width:100,
        }}>{talent.category}</div>
      )}
    </div>
  );
}

// Detail-Modal für ein einzelnes Talent-Angebot
function TalentDetailModal({ talent, onClose }) {
  const cover = Array.isArray(talent.images) && talent.images[0]?.url;
  const price = formatPrice(talent);
  const loc   = locationLabel(talent);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:10490,
          background:"rgba(26,26,24,0.55)", backdropFilter:"blur(4px)",
        }}
      />
      {/* Modal */}
      <div style={{
        position:"fixed", inset:0, zIndex:10500,
        display:"flex", alignItems:"flex-end",
        pointerEvents:"none",
      }}>
        <div style={{
          width:"100%",
          background:T.bgCard,
          borderRadius:"22px 22px 0 0",
          padding:"0 0 max(32px, env(safe-area-inset-bottom, 32px))",
          boxShadow:"0 -8px 40px rgba(26,26,24,0.16)",
          maxHeight:"85vh", overflowY:"auto",
          pointerEvents:"all",
        }}>
          {/* Griff */}
          <div style={{ padding:"14px 0 0", display:"flex", justifyContent:"center" }}>
            <div style={{ width:36, height:4, borderRadius:2, background:"rgba(26,26,24,0.12)" }}/>
          </div>

          {/* Cover-Bild */}
          {cover && (
            <div style={{
              width:"100%", height:180, overflow:"hidden",
              background:"#e8e4de", margin:"10px 0 0",
            }}>
              <img src={cover} alt={talent.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          )}

          <div style={{ padding:"16px 20px" }}>
            {/* Kategorie */}
            {talent.category && (
              <div style={{
                display:"inline-block", background:T.tealSoft,
                borderRadius:99, padding:"3px 10px",
                fontSize:11, fontWeight:700, color:T.teal,
                marginBottom:8,
              }}>{talent.category}</div>
            )}

            {/* Titel */}
            <div style={{ fontSize:19, fontWeight:800, color:T.ink, lineHeight:1.3, marginBottom:8 }}>
              {talent.title}
            </div>

            {/* Preis + Standort Badges */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              {price && (
                <div style={{
                  background:"rgba(14,196,184,0.10)", borderRadius:8,
                  padding:"5px 12px", fontSize:13, fontWeight:700, color:T.teal,
                  border:"1px solid rgba(14,196,184,0.22)",
                }}>{price}</div>
              )}
              {loc && (
                <div style={{
                  background:"rgba(26,26,24,0.05)", borderRadius:8,
                  padding:"5px 12px", fontSize:13, fontWeight:600, color:T.inkSoft,
                  border:"1px solid rgba(26,26,24,0.08)",
                }}>{loc}</div>
              )}
              {talent.duration_minutes && (
                <div style={{
                  background:"rgba(26,26,24,0.05)", borderRadius:8,
                  padding:"5px 12px", fontSize:13, fontWeight:600, color:T.inkSoft,
                  border:"1px solid rgba(26,26,24,0.08)",
                }}>{talent.duration_minutes} Min.</div>
              )}
            </div>

            {/* Beschreibung */}
            {talent.description && (
              <div style={{
                fontSize:14, color:T.inkSoft, lineHeight:1.7,
                marginBottom:16,
              }}>{talent.description}</div>
            )}

            {/* Buchungsinfos */}
            {(talent.max_participants || talent.booking_type) && (
              <div style={{
                background:"rgba(14,196,184,0.05)", borderRadius:12,
                padding:"12px 14px", marginBottom:16,
                border:"1px solid rgba(14,196,184,0.12)",
              }}>
                {talent.max_participants && (
                  <div style={{ fontSize:12.5, color:T.inkSoft, marginBottom:4 }}>
                    👥 Max. {talent.max_participants} {talent.max_participants === 1 ? "Person" : "Personen"}
                  </div>
                )}
                {talent.booking_type && (
                  <div style={{ fontSize:12.5, color:T.inkSoft }}>
                    📋 {talent.booking_type === "gruppe" ? "Gruppenangebot" : "Einzelbuchung"}
                  </div>
                )}
              </div>
            )}

            {/* Standort-Adresse */}
            {talent.location_address && (
              <div style={{ fontSize:13, color:T.inkFaint, marginBottom:16 }}>
                📍 {talent.location_address}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Haupt-Export ──────────────────────────────────────────────────
export function PublicTalentOffersSection({ profileId }) {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    let cancelled = false;
    supabase
      .from("talents")
      .select("id,title,description,category,images,status,price_per_hour,price_per_session,currency,location_type,location_address,location_notes,map_link,duration_minutes,max_participants,min_participants,booking_type,available_dates,available_time_slots,recurring,booking_window_start,booking_window_end,user_id")
      .eq("user_id", profileId)
      .eq("status", "approved")   // nur freigegebene Angebote
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) {
          if (!error) setTalents(data || []);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [profileId]);

  // Nicht rendern wenn keine Daten und nicht laden
  if (!loading && talents.length === 0) return null;

  return (
    <>
      <style>{CSS}</style>

      {loading ? (
        <div className="pts-scroll" style={{
          display:"flex", gap:10, overflowX:"auto",
          padding:"0 2px", scrollSnapType:"x mandatory",
        }}>
          {[1,2,3].map(i => <Skel key={i}/>)}
        </div>
      ) : (
        <div className="pts-scroll" style={{
          display:"flex", gap:10, overflowX:"auto",
          padding:"0 2px 4px", scrollSnapType:"x mandatory",
        }}>
          {talents.map(t => (
            <div key={t.id} style={{ scrollSnapAlign:"start" }}>
              <TalentCard talent={t} onClick={() => setSelected(t)}/>
            </div>
          ))}
        </div>
      )}

      {/* Detail-Modal */}
      {selected && (
        <TalentDetailModal
          talent={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

export default PublicTalentOffersSection;

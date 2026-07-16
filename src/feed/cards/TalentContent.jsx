/**
 * TalentContent.jsx — Feed-Karte für Talent-Angebote
 * FEED-GLOBAL-001 (2026-07-16)
 *
 * Zeigt: Avatar, Name, Kategorie, Preis/Stunde, Ort-Typ, Beschreibung
 * Layout: identisch zu WorkContent (Header + Body + Footer)
 */
import React from "react";

const T = {
  purple:     "rgba(139,92,246,1)",
  purpleSoft: "rgba(139,92,246,0.10)",
  ink:        "rgba(26,26,46,0.85)",
  sub:        "rgba(26,26,46,0.45)",
  border:     "rgba(26,26,46,0.07)",
};

function fmtPrice(ph, ps, currency = "EUR") {
  const sym = currency === "EUR" ? "€" : currency;
  if (ps != null && ps > 0) return `${sym}${Number(ps).toFixed(0)}/Session`;
  if (ph != null && ph > 0) return `${sym}${Number(ph).toFixed(0)}/Std`;
  return null;
}

export default function TalentContent({ item, onProfile }) {
  if (!item) return null;
  const raw      = item._raw || {};
  const title    = item.title  || raw.title   || "";
  const desc     = item.text   || raw.description || "";
  const category = raw.category || "";
  const locType  = raw.location_type || null;
  const price    = fmtPrice(raw.price_per_hour, raw.price_per_session, raw.currency);
  const avatar   = item.author?.avatar || null;
  const author   = item.author?.name   || "HUI Mitglied";
  const img      = raw.images?.[0]     || null;

  return (
    <div style={{
      margin:"0 12px 14px",
      borderRadius:24,
      background:"#fff",
      border:`1px solid ${T.border}`,
      boxShadow:"0 2px 16px rgba(26,26,46,0.07)",
      overflow:"hidden",
    }}>
      {/* Bild */}
      {img && (
        <div style={{ width:"100%", paddingTop:"52%", position:"relative", background:"rgba(26,26,46,0.04)" }}>
          <img src={img} alt={title} loading="lazy" decoding="async"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.currentTarget.parentElement.style.display = "none"; }}
          />
          <div style={{
            position:"absolute", top:10, left:10,
            background:T.purple, color:"#fff",
            fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20,
          }}>Talent</div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding:"14px 16px 0", display:"flex", gap:10, alignItems:"center" }}>
        <div
          onClick={() => onProfile?.()}
          style={{
            width:40, height:40, borderRadius:14, flexShrink:0, overflow:"hidden",
            background: T.purpleSoft, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          {avatar
            ? <img src={avatar} alt={author} loading="lazy"
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                onError={e=>{ e.currentTarget.style.display="none"; }}
              />
            : <span style={{ fontSize:16 }}>✨</span>
          }
        </div>
        <div>
          <div
            onClick={() => onProfile?.()}
            style={{ fontSize:13, fontWeight:700, color:T.ink, cursor:"pointer" }}
          >{author}</div>
          {category && (
            <div style={{ fontSize:11, color:T.sub }}>{category}</div>
          )}
        </div>
        {!img && (
          <div style={{
            marginLeft:"auto",
            background:T.purple, color:"#fff",
            fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20,
          }}>Talent</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:"10px 16px 14px" }}>
        {title && (
          <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:4, lineHeight:1.35 }}>
            {title}
          </div>
        )}
        {desc && (
          <div style={{
            fontSize:13, color:T.sub, lineHeight:1.6,
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:3, WebkitBoxOrient:"vertical",
          }}>
            {desc}
          </div>
        )}

        {/* Footer: Ort + Preis */}
        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {locType && (
            <span style={{
              fontSize:11, color:T.sub,
              background:"rgba(26,26,46,0.05)", padding:"3px 8px", borderRadius:12,
            }}>
              📍 {locType === "online" ? "Online" : locType === "local" ? "Vor Ort" : "Flexibel"}
            </span>
          )}
          {price && (
            <span style={{
              fontSize:12, fontWeight:700, color:T.purple,
              marginLeft:"auto",
            }}>
              {price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

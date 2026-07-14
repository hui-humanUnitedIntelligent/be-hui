import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const TEAL = "#0DC4B5";
const INK  = "#1A1A2E";
const INK3 = "rgba(26,26,46,0.42)";

export default function ExperienceContent({ item, onProfile, onReaction, onShare, onBook, imagePriority }) {
  if (!item) return null;
  const { open } = useContentPreview(); // OPEN.1 2026-07-08 -- Karte oeffnet jetzt Vorschau statt nichts zu tun

  const title       = item.title || item.text || "";
  const desc        = item._raw?.description || item._raw?.caption || null;
  const category    = item._raw?.category || null;
  const timeDisplay = item.timeStart ? item.timeStart.slice(0,5) + " Uhr" : (item.duration || null);
  // Datumsformatierung: "24. Juni"
  let dateStr = null;
  if (item._raw?.date) {
    try {
      const d = new Date(item._raw.date);
      dateStr = d.toLocaleDateString("de-DE", { day:"numeric", month:"long" });
    } catch { dateStr = item._raw.date; }
  }
  const metaParts = [
    category,
    dateStr && timeDisplay ? `${dateStr}, ${timeDisplay}` : (dateStr || timeDisplay),
    item.location,
  ].filter(Boolean);

  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare}
      onCardClick={() => open(item)} imagePriority={imagePriority}>

      {/* Beschreibung */}
      {desc && (
        <p style={{ margin:"0 0 10px", fontSize:13.5, fontWeight:400, color:"rgba(26,26,46,0.65)", lineHeight:1.55 }}>
          {desc}
        </p>
      )}

      {/* ── Badge · Titel · CTA — nach Mockup ─────────────── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:10, flexWrap:"nowrap", marginBottom: metaParts.length > 0 ? 6 : 0,
      }}>
        {/* Links: Badge + Titel */}
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, flex:1 }}>
          <span style={{
            flexShrink:0,
            fontSize:10.5, fontWeight:700, color:TEAL,
            background:"rgba(13,196,181,0.10)",
            border:"1px solid rgba(13,196,181,0.22)",
            borderRadius:99, padding:"3px 9px",
            letterSpacing:0.2, whiteSpace:"nowrap",
          }}>ERLEBNIS</span>
          {title ? (
            <span style={{
              fontSize:15, fontWeight:700, color:INK,
              lineHeight:1.3, letterSpacing:"-0.02em",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>{title}</span>
          ) : null}
        </div>
        {/* Rechts: Teilnehmen-Button */}
        {onBook && (
          <button
            onClick={(e) => { e.stopPropagation(); onBook(item); }}
            style={{
              flexShrink:0,
              display:"flex", alignItems:"center", gap:7,
              background:"linear-gradient(135deg,#0DC4B5,#09A89A)",
              color:"#fff", border:"none", borderRadius:99,
              padding:"9px 18px", fontSize:13, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation",
              boxShadow:"0 3px 10px rgba(13,196,181,0.30)",
              whiteSpace:"nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1C4 1 1.5 3.5 1.5 7C1.5 10.5 4 13 7 13C10 13 12.5 10.5 12.5 7C12.5 3.5 10 1 7 1ZM6 10L3.5 7.5L4.5 6.5L6 8L9.5 4.5L10.5 5.5L6 10Z" fill="white"/>
            </svg>
            Teilnehmen
          </button>
        )}
      </div>

      {/* Meta: Kategorie · Datum · Ort */}
      {metaParts.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
          {metaParts.map((m, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ fontSize:12, color:"rgba(26,26,46,0.28)" }}>·</span>}
              <span style={{
                fontSize:12.5,
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? "#F47355" : INK3,
              }}>{m}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </BaseFeedCard>
  );
}

import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const PURPLE = "#7264D6";
const INK    = "#1A1A2E";
const INK3   = "rgba(26,26,46,0.42)";

export default function EventContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;
  const { open } = useContentPreview(); // OPEN.1 2026-07-08

  const title    = item.title || item.text || "";
  const desc     = item._raw?.description || item._raw?.caption || null;
  const isLive   = item.isLive;
  const timeDisplay = item.timeStart ? item.timeStart.slice(0,5) + " Uhr" : null;
  let dateStr = null;
  if (item._raw?.date) {
    try {
      const d = new Date(item._raw.date);
      dateStr = d.toLocaleDateString("de-DE", { day:"numeric", month:"long" });
    } catch { dateStr = item._raw.date; }
  }
  const metaParts = [
    dateStr && timeDisplay ? `${dateStr}, ${timeDisplay}` : (dateStr || timeDisplay),
    item.location,
  ].filter(Boolean);

  const badgeColor  = isLive ? "#EF4444" : PURPLE;
  const badgeBg     = isLive ? "rgba(239,68,68,0.10)" : "rgba(114,100,214,0.10)";
  const badgeBorder = isLive ? "rgba(239,68,68,0.22)" : "rgba(114,100,214,0.22)";
  const badgeLabel  = isLive ? "🔴 LIVE" : "EVENT";

  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare}
      onCardClick={() => open(item)}>

      {desc && (
        <p style={{ margin:"0 0 10px", fontSize:13.5, fontWeight:400, color:"rgba(26,26,46,0.65)", lineHeight:1.55 }}>
          {desc}
        </p>
      )}

      {/* Badge · Titel */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: metaParts.length ? 6 : 0, flexWrap:"nowrap" }}>
        <span style={{
          flexShrink:0, fontSize:10.5, fontWeight:700, color:badgeColor,
          background:badgeBg, border:"1px solid "+badgeBorder,
          borderRadius:99, padding:"3px 9px", letterSpacing:0.2, whiteSpace:"nowrap",
        }}>{badgeLabel}</span>
        {title ? (
          <span style={{
            fontSize:15, fontWeight:700, color:INK,
            lineHeight:1.3, letterSpacing:"-0.02em",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>{title}</span>
        ) : null}
      </div>

      {/* Meta */}
      {metaParts.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
          {metaParts.map((m, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ fontSize:12, color:"rgba(26,26,46,0.28)" }}>·</span>}
              <span style={{ fontSize:12.5, fontWeight:400, color:INK3 }}>{m}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </BaseFeedCard>
  );
}

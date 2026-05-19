// connection-create/StepThreePreview.jsx
// STEP 3 — "So wird deine Verbindung wirken"
// Live-Vorschau der fertigen Verbindung + Publish CTA

import React from "react";
import ConnectionPreviewCard from "./ConnectionPreviewCard.jsx";

const C = {
  violet:"#8B5CF6", violet2:"#7C3AED",
  ink:"#1A1A1A", muted:"rgba(80,80,80,0.50)",
};

const CSS = `
  @keyframes s3-in {
    from{ opacity:0; transform:scale(0.97) translateY(14px); }
    to  { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes s3-pulse {
    0%,100%{ box-shadow:0 8px 28px rgba(139,92,246,0.30); }
    50%    { box-shadow:0 12px 40px rgba(139,92,246,0.45); }
  }
  @keyframes s3-float {
    0%,100%{ transform:translateY(0); }
    50%    { transform:translateY(-3px); }
  }
`;

export default function StepThreePreview({ data, onPublish, publishing }) {
  return (
    <div style={{
      flex:1, overflowY:"auto", overflowX:"hidden",
      padding:"0 20px 32px",
    }}>
      <style>{CSS}</style>

      {/* ── Headline ── */}
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{
          fontSize:26, fontWeight:900, color:C.ink,
          letterSpacing:-0.7, marginBottom:8,
          animation:"s3-in 0.28s ease both",
        }}>
          So wird deine Verbindung wirken
        </div>
        <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
          Genau so erscheint sie im Feed \u2014 f\u00fcr alle, die warten.
        </div>
      </div>

      {/* ── Preview Card ── */}
      <div style={{
        maxWidth:420, margin:"0 auto",
        animation:"s3-in 0.35s 0.06s ease both",
      }}>
        <ConnectionPreviewCard data={data}/>
      </div>

      {/* ── Publish CTA ── */}
      <div style={{
        maxWidth:420, margin:"24px auto 0",
        animation:"s3-in 0.35s 0.12s ease both",
      }}>
        <button
          onClick={onPublish}
          disabled={publishing}
          style={{
            width:"100%", height:56,
            background: publishing
              ? "rgba(139,92,246,0.50)"
              : `linear-gradient(135deg,${C.violet} 0%,${C.violet2} 100%)`,
            border:"none", borderRadius:99,
            color:"white", fontSize:17, fontWeight:800,
            cursor: publishing ? "default" : "pointer",
            letterSpacing:-0.3,
            animation: publishing ? "none" : "s3-pulse 3s ease-in-out infinite",
            display:"flex", alignItems:"center", justifyContent:"center", gap:9,
            transition:"opacity 0.2s",
            WebkitTapHighlightColor:"transparent",
            touchAction:"manipulation",
          }}
        >
          {publishing ? (
            <>
              <span style={{ fontSize:18, animation:"s3-float 1s ease-in-out infinite" }}>✦</span>
              Wird ver\u00f6ffentlicht\u2026
            </>
          ) : (
            <>
              Verbindung ver\u00f6ffentlichen
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="white" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

        {/* Hinweis */}
        <div style={{
          textAlign:"center", fontSize:12.5, color:C.muted,
          marginTop:12, lineHeight:1.55,
        }}>
          Du kannst deine Angaben sp\u00e4ter jederzeit bearbeiten.
        </div>
      </div>
    </div>
  );
}

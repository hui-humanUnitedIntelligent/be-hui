import React from "react";
import { T } from "../tokens.js";

export function ApprovedAppCard({ app, onOpen }) {
  const [hov, setHov] = React.useState(false);
  const img = app.cover_url
    || (app.media_urls && app.media_urls[0])
    || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90";

  return (
    <div
      onClick={() => onOpen(app)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:20, overflow:"hidden", cursor:"pointer",
        background:"#fff",
        boxShadow: hov
          ? "0 8px 40px rgba(0,0,0,0.13)"
          : "0 2px 16px rgba(0,0,0,0.07)",
        transition:"box-shadow 0.2s, transform 0.2s",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        border:"1px solid rgba(13,196,181,0.12)",
      }}
    >
      {/* Bild */}
      <div style={{ height:160, overflow:"hidden", position:"relative" }}>
        <img loading="lazy" decoding="async" src={img} alt={app.project_name}
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.3s",
            transform: hov ? "scale(1.04)" : "scale(1)" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90"; }}
        />
        <div style={{
          position:"absolute", top:10, right:10,
          background:"rgba(13,196,181,0.90)", borderRadius:99,
          padding:"3px 10px", fontSize:10, fontWeight:700, color:"#fff",
        }}>✅ Bewilligt</div>
      </div>
      {/* Text */}
      <div style={{ padding:"14px 16px 16px" }}>
        <h3 style={{ margin:"0 0 6px", fontSize:15, fontWeight:800, color:"#141422", lineHeight:1.3 }}>
          💚 {app.project_name}
        </h3>
        <p style={{
          margin:"0 0 12px", fontSize:12.5, color:"#666", lineHeight:1.5,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {app.short_desc}
        </p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:13, fontWeight:800, color:"#0DC4B5" }}>
            🔥 € {(app.funding_goal || 0).toLocaleString("de-DE")}
          </span>
          <span style={{
            fontSize:11, fontWeight:700, color:"#0DC4B5",
            background:"rgba(13,196,181,0.10)", borderRadius:99, padding:"4px 10px",
            border:"1px solid rgba(13,196,181,0.25)",
          }}>
            Mehr erfahren →
          </span>
        </div>
      </div>
    </div>
  );
}

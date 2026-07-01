import React from "react";
import { C } from "./tokens.js";
import { fmtPrice } from "./utils.js";

export default function RelatedCard({ item, label, onClick }) {
  const img = item.cover_url || (Array.isArray(item.images) && (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url)) || null;
  return (
    <div className="cd-tap" onClick={() => onClick(item.id)} style={{ flexShrink: 0, width: 140, cursor: "pointer" }}>
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          height: 140,
          position: "relative",
          background: "#eee",
          boxShadow: "0 3px 12px rgba(0,0,0,0.10)",
        }}
      >
        {img ? (
          <img src={img} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg,#E6FAF8,#FFF2EE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 28, opacity: 0.3 }}>{label === "Erlebnis" ? "📅" : "🎨"}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 50%,rgba(0,0,0,0.6))" }} />
        {item.price != null && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 900,
              color: C.ink,
            }}
          >
            {fmtPrice(item.price)}
          </div>
        )}
      </div>
      <div style={{ padding: "6px 2px 0" }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title || label}
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.category || item.experience_type || ""}</div>
      </div>
    </div>
  );
}

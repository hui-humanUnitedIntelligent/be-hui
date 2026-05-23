// WirkerIdentity.jsx — Phase 24: Creator Identity Strip
// Direkt unter dem Hero — Avatar, Name, Actions
import React from "react";
import { useTap } from "../../design/hui.hooks.js";

const safeStr = (v, fb = "") => (typeof v === "string" && v.length > 0 ? v : fb);

export default function WirkerIdentity({ profile = {}, followed, followLoading, onFollow, onChat, onShare }) {
  const shareTap  = useTap();
  const followTap = useTap();

  const name      = safeStr(profile?.display_name || profile?.name, "Creator");
  const location  = safeStr(profile?.location, "");
  const type      = safeStr(profile?.type || profile?.talent, "Creator");
  const verified  = profile?.verified ?? false;
  const presence  = safeStr(profile?.presence_status, "Gerade im Atelier");
  const avatarUrl = safeStr(profile?.img, `https://i.pravatar.cc/80?u=${profile?.id || "hui"}`);

  return (
    <div style={{
      width: "100%",
      background: "white",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      padding: "0 20px 16px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 14,
        paddingTop: 0,
        marginTop: -36,
      }}>
        {/* Avatar — schwebt über Hero */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={avatarUrl}
            alt={name}
            style={{
              width: 72, height: 72,
              borderRadius: "50%",
              border: "4px solid white",
              objectFit: "cover",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              background: "#f0f0f0",
            }}
            onError={e => { e.target.src = `https://i.pravatar.cc/80?u=${name}`; }}
          />
          {/* Online dot */}
          <div style={{
            position: "absolute", bottom: 4, right: 4,
            width: 14, height: 14, borderRadius: "50%",
            background: "#22C55E",
            border: "2px solid white",
          }} />
        </div>

        {/* Name + Meta */}
        <div style={{ flex: 1, paddingBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 17, fontWeight: 800,
              color: "#1A1A1A", letterSpacing: "-0.025em",
            }}>{name}</span>
            {verified && (
              <span style={{
                background: "#0DC4B5", color: "white",
                fontSize: 10, fontWeight: 800,
                borderRadius: 99, padding: "2px 7px",
              }}>✓</span>
            )}
          </div>
          <div style={{
            fontSize: 12, color: "#888",
            fontWeight: 500, marginTop: 2,
          }}>
            {type}{location ? ` · ${location}` : ""}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, marginTop: 4,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22C55E",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: 11, color: "#0DC4B5", fontWeight: 600 }}>
              {presence}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: "flex", gap: 8, marginTop: 14,
        alignItems: "center",
      }}>
        {/* Teilen */}
        <button
          {...shareTap}
          onClick={onShare}
          style={{
            background: "#0DC4B5",
            border: "none", borderRadius: 99,
            padding: "10px 22px",
            color: "white", fontSize: 13, fontWeight: 700,
            cursor: "pointer",
            flex: 1,
            boxShadow: "0 4px 16px rgba(13,196,181,0.30)",
          }}
        >Teilen</button>

        {/* Nachricht */}
        <button
          onClick={onChat}
          style={{
            background: "rgba(13,196,181,0.08)",
            border: "1.5px solid rgba(13,196,181,0.25)",
            borderRadius: 99, width: 40, height: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 16,
          }}
        >✉️</button>

        {/* Speichern */}
        <button style={{
          background: "rgba(0,0,0,0.05)",
          border: "1.5px solid rgba(0,0,0,0.10)",
          borderRadius: 99, width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 16,
        }}>🔖</button>

        {/* Follow */}
        <button
          {...followTap}
          onClick={onFollow}
          disabled={followLoading}
          style={{
            background: followed ? "rgba(0,0,0,0.06)" : "rgba(13,196,181,0.08)",
            border: `1.5px solid ${followed ? "rgba(0,0,0,0.12)" : "rgba(13,196,181,0.30)"}`,
            borderRadius: 99, padding: "9px 14px",
            color: followed ? "#888" : "#0DC4B5",
            fontSize: 12, fontWeight: 700,
            cursor: followLoading ? "default" : "pointer",
            opacity: followLoading ? 0.6 : 1,
          }}
        >{followed ? "Gefolgt" : "Folgen"}</button>
      </div>
    </div>
  );
}

// WirkerHero.jsx \u2014 Phase 24: "The Creator World" Immersive Hero
// Screenshot-exact nach HUI Phase 24 Brief
// KEINE design changes — nur null-safe + HUI DNA
import React, { useState, useEffect } from "react";
import { useTap } from "../../design/hui.hooks.js";
import { HUI } from "../../design/hui.design.js";

const safeStr = (v, fb = "") => (typeof v === "string" && v.length > 0 ? v : fb);
const safeArr = (v) => (Array.isArray(v) ? v : []);

const HERO_IMGS = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=85",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=85",
];

const DEFAULT_TAGS = ["Atelier", "Natur", "Kreativität", "Reisen", "Gemeinschaft"];

export default function WirkerHero({ profile = {}, presenceStatus, onChat, onBook, onClose }) {
  const [tick, setTick] = useState(0);
  const closeTap = useTap();

  useEffect(() => {
    const t = setInterval(() => setTick(i => i + 1), 3200);
    return () => clearInterval(t);
  }, []);

  const name       = safeStr(profile?.display_name || profile?.name, "Creator");
  const headline   = safeStr(profile?.headline, `Hey, ich bin ${name}.`);
  const philosophy = safeStr(profile?.philosophy || profile?.bio, "\u201eIch forme Räume und Momente, die uns zurück zu uns selbst bringen.\u201c");
  const heroImg    = safeStr(profile?.header_img || profile?.img, HERO_IMGS[0]);
  const tags       = safeArr(profile?.interests || profile?.tags || DEFAULT_TAGS).slice(0, 6);
  const presence   = safeStr(presenceStatus, "Gerade im Atelier");

  const liveParticipants = Math.floor(Math.random() * 30) + 8;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: 460,
      overflow: "hidden",
      background: "linear-gradient(175deg, #1A2A2A 0%, #0F1E1E 100%)",
    }}>
      {/* ── Cinematic Background Image ── */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${heroImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        opacity: 0.55,
        transition: "opacity 1.2s ease",
      }} />

      {/* ── Dark gradient overlay ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          linear-gradient(105deg, rgba(10,25,25,0.88) 0%, rgba(10,25,25,0.55) 52%, rgba(10,25,25,0.20) 100%),
          linear-gradient(to top, rgba(10,25,25,0.70) 0%, transparent 55%)
        `,
      }} />

      {/* ── Floating particles ── */}
      <style>{`
        @keyframes floatP { 0%,100% { transform:translateY(0px) translateX(0px); opacity:0.4; }
          33% { transform:translateY(-14px) translateX(6px); opacity:0.7; }
          66% { transform:translateY(-6px) translateX(-4px); opacity:0.5; } }
        @keyframes heroBreath { 0%,100%{opacity:0.55} 50%{opacity:0.65} }
      `}</style>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 4 + i * 1.5, height: 4 + i * 1.5,
          borderRadius: "50%",
          background: `rgba(13,196,181,${0.25 + i * 0.05})`,
          top: `${15 + i * 13}%`,
          left: `${8 + i * 7}%`,
          animation: `floatP ${5 + i}s ease-in-out ${i * 0.7}s infinite`,
          pointerEvents: "none",
        }} />
      ))}

      {/* ── Top Nav ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px",
        zIndex: 10,
      }}>
        {/* Back */}
        <button
          {...closeTap}
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            borderRadius: 99, width: 38, height: 38,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "white", fontSize: 18,
          }}
        >←</button>

        {/* Creator Badge */}
        <div style={{
          background: "rgba(13,196,181,0.18)",
          border: "1px solid rgba(13,196,181,0.40)",
          backdropFilter: "blur(12px)",
          borderRadius: 99, padding: "6px 14px",
          display: "flex", alignItems: "center", gap: 6,
          color: "#22DDD0", fontSize: 12, fontWeight: 700,
          letterSpacing: "0.04em",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#22DDD0",
            animation: "floatP 2s ease-in-out infinite",
          }} />
          CREATOR · aktiv
        </div>

        {/* More */}
        <button style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(12px)",
          borderRadius: 99, width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "white", fontSize: 18,
        }}>···</button>
      </div>

      {/* ── Content ── */}
      <div style={{
        position: "relative", zIndex: 5,
        display: "flex", flexDirection: "column",
        padding: "80px 24px 32px",
        minHeight: 460,
        justifyContent: "flex-end",
      }}>
        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(26px, 6.5vw, 40px)",
          fontWeight: 800,
          color: "white",
          lineHeight: 1.15,
          letterSpacing: "-0.025em",
          margin: "0 0 10px",
          maxWidth: 340,
          textShadow: "0 2px 20px rgba(0,0,0,0.4)",
        }}>{headline}</h1>

        {/* Philosophy */}
        <p style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.70)",
          lineHeight: 1.55,
          margin: "0 0 16px",
          maxWidth: 320,
          fontStyle: "italic",
          fontWeight: 420,
        }}>{philosophy}</p>

        {/* Tags */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8,
          marginBottom: 24,
        }}>
          {tags.map((tag, i) => (
            <span key={i} style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.20)",
              backdropFilter: "blur(8px)",
              borderRadius: 99, padding: "5px 12px",
              color: "rgba(255,255,255,0.85)",
              fontSize: 12, fontWeight: 600,
            }}>● {tag}</span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onBook?.()}
            style={{
              background: "linear-gradient(135deg, #0DC4B5 0%, #22DDD0 100%)",
              border: "none", borderRadius: 99,
              padding: "12px 24px",
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(13,196,181,0.40)",
            }}
          >Erlebnis buchen</button>
          <button
            onClick={() => onChat?.()}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px)",
              borderRadius: 99, padding: "12px 20px",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >Nachricht</button>
        </div>
      </div>

      {/* ── Live Activity Card (top-right) ── */}
      <div style={{
        position: "absolute",
        top: 72, right: 16,
        background: "rgba(255,252,248,0.92)",
        backdropFilter: "blur(20px)",
        borderRadius: 18,
        padding: "14px 16px",
        width: 190,
        boxShadow: "0 8px 32px rgba(0,0,0,0.20)",
        border: "1px solid rgba(255,255,255,0.60)",
        zIndex: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>
            {presence}
          </span>
          <span style={{
            background: "#FF4040", color: "white",
            fontSize: 9, fontWeight: 800, borderRadius: 4,
            padding: "2px 5px", letterSpacing: "0.05em",
          }}>LIVE</span>
        </div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4, marginBottom: 10 }}>
          Neues Werk entsteht<br />
          <em style={{ color: "#0DC4B5", fontStyle: "italic" }}>\u201e{safeStr(profile?.current_work, "Fragments of Light")}"</em>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex" }}>
            {[1,2,3,4].map(i => (
              <img key={i} src={`https://i.pravatar.cc/28?img=${i * 7}`}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: "2px solid white",
                  marginLeft: i === 1 ? 0 : -6,
                }} alt="" />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>
            {liveParticipants} dabei
          </span>
        </div>
        <div style={{
          marginTop: 8, fontSize: 11, color: "#0DC4B5",
          fontWeight: 700, cursor: "pointer",
        }}>Atelier betreten →</div>
      </div>
    </div>
  );
}

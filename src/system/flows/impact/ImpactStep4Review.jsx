// src/system/flows/impact/ImpactStep4Review.jsx
// Step 4 — Bewerbung prüfen & absenden

import React from "react";
import { IT } from "./ImpactTokens.js";

/* ── Review Row ───────────────────────────────────────────────── */
function ReviewRow({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div style={{
      display:"flex", alignItems:"flex-start",
      gap:10, padding:"9px 0",
      borderBottom:"1px solid rgba(26,26,46,0.06)",
    }}>
      <div style={{
        fontSize:12, fontWeight:700, color:IT.ink3,
        minWidth:110, lineHeight:1.4, paddingTop:1,
      }}>{label}</div>
      <div style={{
        fontSize:13, color: highlight ? IT.teal : IT.ink2,
        fontWeight: highlight ? 800 : 500,
        flex:1, lineHeight:1.45,
        wordBreak:"break-word",
      }}>{value}</div>
    </div>
  );
}

/* ── Media Thumbnail Strip ─────────────────────────────────────── */
function MediaStrip({ files }) {
  if (!files || files.length === 0) return null;
  const imgs = files.filter(f => f.type?.startsWith("image"));
  const others = files.filter(f => !f.type?.startsWith("image"));
  const MAX_SHOW = 4;
  const extra = imgs.length - MAX_SHOW;
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
      {imgs.slice(0, MAX_SHOW).map((f,i) => (
        <div key={i} style={{
          width:62, height:62, borderRadius:12, overflow:"hidden",
          boxShadow:"0 4px 12px rgba(26,26,46,0.10)", flexShrink:0,
          position:"relative",
        }}>
          <img src={f.preview} alt="" style={{
            width:"100%", height:"100%", objectFit:"cover",
          }}/>
          {i === MAX_SHOW-1 && extra > 0 && (
            <div style={{
              position:"absolute", inset:0,
              background:"rgba(26,26,46,0.55)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:800, color:"#fff",
            }}>+{extra}</div>
          )}
        </div>
      ))}
      {others.map((f,i) => (
        <div key={`o${i}`} style={{
          width:62, height:62, borderRadius:12,
          background:"rgba(10,191,184,0.08)",
          border:"1px solid rgba(10,191,184,0.18)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, flexShrink:0,
        }}>
          {f.type?.includes("pdf") ? "📄" : "📁"}
        </div>
      ))}
    </div>
  );
}

/* ── Step 4 ──────────────────────────────────────────────────── */
export function ImpactStep4Review({
  form, mediaFiles, profile, onSubmit, saving, error,
}) {
  const cover = mediaFiles.find(f => f.type?.startsWith("image"))?.preview;
  const fundingDisplay = form.funding
    ? `${parseInt(form.funding).toLocaleString("de-DE")} €`
    : null;

  return (
    <div style={{ padding:"24px 20px 28px",
      animation:"ifFadeStep 0.28s ease both" }}>

      {/* ── Headline ── */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:21, fontWeight:900, color:IT.ink,
          letterSpacing:-0.5, margin:0 }}>
          Bewerbung prüfen & absenden
          <span style={{ color:IT.teal, marginLeft:3 }}>·</span>
        </h1>
        <p style={{ fontSize:13, color:IT.ink3, margin:"5px 0 0" }}>
          Bitte überprüfe deine Angaben.
        </p>
      </div>

      {/* ── Immersive Preview Card ── */}
      <div style={{
        borderRadius:22, overflow:"hidden",
        boxShadow:"0 12px 40px rgba(26,26,46,0.12)",
        marginBottom:20,
      }}>
        {/* Cover */}
        <div style={{
          width:"100%", aspectRatio:"16/8",
          background:"linear-gradient(135deg,rgba(10,191,184,0.12),rgba(16,185,129,0.08))",
          position:"relative", overflow:"hidden",
        }}>
          {cover && (
            <img src={cover} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          )}
          {/* Overlay Badge */}
          <div style={{
            position:"absolute", top:12, left:12,
            background:"rgba(255,255,255,0.88)",
            backdropFilter:"blur(10px)",
            borderRadius:10, padding:"5px 10px",
            fontSize:11, fontWeight:700, color:IT.teal,
            display:"flex", alignItems:"center", gap:5,
          }}>
            <span>🌱</span> ImpactPool Bewerbung
          </div>
          {/* Projektname + Standort unten links */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            background:"linear-gradient(to top, rgba(26,26,46,0.65), transparent)",
            padding:"24px 16px 14px",
          }}>
            <div style={{ fontSize:16, fontWeight:900, color:"#fff",
              letterSpacing:-0.3, lineHeight:1.2 }}>
              {form.projectName || "Projektname"}
            </div>
            {form.location && (
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)",
                marginTop:3 }}>
                📍 {form.location}
              </div>
            )}
          </div>
        </div>

        {/* Info-Tabelle */}
        <div style={{ background:IT.card, padding:"12px 16px 6px" }}>
          <ReviewRow label="Problem"   value={form.problem} />
          <ReviewRow label="Vision"    value={form.vision} />
          <ReviewRow label="Warum unterstützen?" value={form.why} />
          <ReviewRow
            label="Gewünschte Finanzierung"
            value={fundingDisplay}
            highlight
          />
          <ReviewRow label="Verwendung"   value={form.fundingUse} />
        </div>

        {/* Kontakt-Zeile */}
        <div style={{
          background:"rgba(248,247,255,0.80)",
          padding:"10px 16px",
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:8,
        }}>
          {form.contactName && (
            <div>
              <div style={{ fontSize:10.5, color:IT.ink4, fontWeight:600,
                marginBottom:2 }}>Ansprechpartner</div>
              <div style={{ fontSize:13, color:IT.ink, fontWeight:600 }}>
                {form.contactName}
              </div>
            </div>
          )}
          {form.email && (
            <div>
              <div style={{ fontSize:10.5, color:IT.ink4, fontWeight:600,
                marginBottom:2 }}>E-Mail</div>
              <div style={{ fontSize:12, color:IT.ink2,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {form.email}
              </div>
            </div>
          )}
          {form.location && (
            <div>
              <div style={{ fontSize:10.5, color:IT.ink4, fontWeight:600,
                marginBottom:2 }}>Standort</div>
              <div style={{ fontSize:13, color:IT.ink2 }}>{form.location}</div>
            </div>
          )}
          {form.website && (
            <div>
              <div style={{ fontSize:10.5, color:IT.ink4, fontWeight:600,
                marginBottom:2 }}>Website</div>
              <div style={{ fontSize:12, color:IT.teal,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {form.website.replace("https://","").replace("http://","")}
              </div>
            </div>
          )}
        </div>

        {/* Medien Strip */}
        {mediaFiles.length > 0 && (
          <div style={{ padding:"12px 16px 14px",
            background:"rgba(248,247,255,0.60)" }}>
            <MediaStrip files={mediaFiles} />
          </div>
        )}
      </div>

      {/* ── Fehler ── */}
      {error && (
        <div style={{
          background:"rgba(251,146,60,0.07)",
          border:"1px solid rgba(251,146,60,0.22)",
          borderRadius:12, padding:"10px 14px",
          fontSize:13, color:IT.coral, marginBottom:14,
        }}>⚠ {error}</div>
      )}

      {/* ── Haupt CTA ── */}
      <button
        onClick={!saving ? onSubmit : undefined}
        disabled={saving}
        style={{
          width:"100%", height:58, borderRadius:18, border:"none",
          background: saving
            ? "rgba(26,26,46,0.10)"
            : `linear-gradient(135deg, ${IT.coral} 0%, #F97316 100%)`,
          color: saving ? IT.ink3 : "#fff",
          fontSize:16, fontWeight:900,
          cursor: saving ? "default" : "pointer",
          boxShadow: saving ? "none" : "0 10px 28px rgba(251,146,60,0.30)",
          transition:"all 0.22s ease",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          marginBottom:12,
        }}
      >
        {saving ? (
          "Wird gesendet…"
        ) : (
          <>
            <span style={{ fontSize:18 }}>🌱</span>
            Für den ImpactPool bewerben
          </>
        )}
      </button>

      {/* ── Vertrauen ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        fontSize:12, color:IT.ink4,
      }}>
        <span>🔒</span>
        Deine Daten werden sicher und vertraulich behandelt.
      </div>
    </div>
  );
}

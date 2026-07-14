// src/system/flows/work/WorkPublishStep.jsx
// Step 3 — Veröffentlichung: Sichtbarkeit + Live-Vorschau

import {
  HUIVersandIcon, HUIZeitIcon, HUIDateiIcon, HUIKategorieIcon,
  HUIGlobeIcon, HUIGemeinschaftIcon, HUIPrivatIcon,
  HUIFotoIcon,
} from '../../../design/icons/HuiSystemIcons.jsx';
import React from "react";
import { WT } from "./WorkTokens.js";

/* ── Sichtbarkeits-Card ──────────────────────────────────────── */
function VisibilityCard({ icon, label, sub, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:"14px 8px",
      borderRadius:16,
      border: active
        ? `2px solid ${WT.teal}`
        : "1.5px solid rgba(26,26,46,0.08)",
      background: active
        ? "rgba(10,191,184,0.06)"
        : "rgba(248,247,255,0.60)",
      cursor:"pointer",
      display:"flex", flexDirection:"column",
      alignItems:"center", gap:6,
      transition:"all 0.20s ease",
      boxShadow: active ? `0 4px 16px rgba(10,191,184,0.16)` : "none",
    }}>
      <div style={{
        width:36, height:36, borderRadius:11,
        background: active ? "rgba(10,191,184,0.12)" : "rgba(26,26,46,0.05)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18,
      }}>{icon}</div>
      <div style={{ fontSize:12.5, fontWeight:800, color:WT.ink,
        textAlign:"center" }}>{label}</div>
      <div style={{ fontSize:10.5, color:WT.ink3, textAlign:"center",
        lineHeight:1.3 }}>{sub}</div>
    </button>
  );
}

/* ── Werk-Vorschau (exakt wie Screenshot) ───────────────────── */
function WorkPreviewCard({ form, mediaFiles, profile }) {
  const cover = mediaFiles[0]?.preview || null;
  const price = form.priceMode === "fixed" && form.price
    ? `${parseFloat(form.price).toFixed(2)} €`
    : form.priceMode === "free"
    ? "Kostenlos"
    : "Auf Anfrage";

  const priceColor = form.priceMode === "fixed" ? WT.teal
    : form.priceMode === "free" ? WT.teal : WT.ink3;

  return (
    <div style={{
      borderRadius:20,
      overflow:"hidden",
      background:WT.card,
      boxShadow:"0 8px 32px rgba(26,26,46,0.10), 0 2px 8px rgba(26,26,46,0.06)",
    }}>
      {/* Bild-Bereich */}
      <div style={{
        width:"100%",
        aspectRatio:"16/9",
        background:"linear-gradient(135deg,#F0FDF9,#FFF7F0)",
        position:"relative", overflow:"hidden",
      }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <div style={{
            width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:8,
          }}>
            <div style={{ display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.4)" }}><HUIFotoIcon size={36}/></div>
            <div style={{ fontSize:12, color:"rgba(26,26,46,0.30)" }}>
              Kein Bild hochgeladen
            </div>
          </div>
        )}

        {/* Bild-Indikatoren */}
        {mediaFiles.length > 1 && (
          <div style={{
            position:"absolute", top:10, right:10,
            display:"flex", gap:4,
          }}>
            {mediaFiles.slice(0,3).map((_, i) => (
              <div key={i} style={{
                width:6, height:6, borderRadius:"50%",
                background: i===0 ? "#fff" : "rgba(255,255,255,0.50)",
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* Info-Bereich */}
      <div style={{ padding:"16px 16px 14px" }}>
        {/* Titel + Preis */}
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", gap:8, marginBottom:6 }}>
          <div style={{ fontSize:15, fontWeight:800, color:WT.ink,
            lineHeight:1.25, flex:1 }}>
            {form.title || "Titel des Werkes"}
          </div>
          <div style={{ fontSize:15, fontWeight:800, color:priceColor,
            flexShrink:0 }}>{price}</div>
        </div>

        {/* Beschreibung */}
        <div style={{ fontSize:12.5, color:WT.ink2, lineHeight:1.5,
          marginBottom:12, display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {form.description || "Keine Beschreibung"}
        </div>

        {/* Meta-Chips */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          {form.shipping && (
            <>
              <MetaChip icon={<HUIVersandIcon size={13}/>} label="Versand" value={`${form.shippingCost||"–"} €`} />
              <MetaChip icon={<HUIZeitIcon size={13}/>} label="Lieferzeit" value={form.shippingTime} />
            </>
          )}
          {form.fileFormat && (
            <MetaChip icon={<HUIDateiIcon size={13}/>} label="Format" value={form.fileFormat} />
          )}
          {form.category && (
            <MetaChip icon={<HUIKategorieIcon size={13}/>} label="Kategorie" value={form.category} />
          )}
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label, value }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:4,
      fontSize:11, color:WT.ink3,
    }}>
      <span style={{ fontSize:12 }}>{icon}</span>
      <span style={{ fontWeight:600 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ── Step 3 ──────────────────────────────────────────────────── */
export function WorkPublishStep({ form, mediaFiles, profile, onFormChange,
  onPublish, saving, error }) {

  return (
    <div style={{ padding:"24px 20px 24px",
      animation:"wfFadeStep 0.30s ease both" }}>

      {/* ── Überschrift ── */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:WT.ink,
          letterSpacing:-0.5, margin:0 }}>
          Veröffentlichung<span style={{ color:WT.teal, marginLeft:3 }}>·</span>
        </h1>
        <p style={{ fontSize:13, color:WT.ink3, margin:"5px 0 0" }}>
          Wähle, wie dein Werk sichtbar sein soll.
        </p>
      </div>

      {/* ── Sichtbarkeit ── */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        <VisibilityCard
          icon={<HUIGlobeIcon size={18}/>} label="Öffentlich" sub="Für alle sichtbar"
          active={form.visibility === "public"}
          onClick={() => onFormChange({ visibility:"public" })}
        />
        <VisibilityCard
          icon={<HUIGemeinschaftIcon size={18}/>} label="Nur Community" sub="Nur für HUI Mitglieder"
          active={form.visibility === "community"}
          onClick={() => onFormChange({ visibility:"community" })}
        />
        <VisibilityCard
          icon={<HUIPrivatIcon size={18}/>} label="Privat" sub="Nur für dich"
          active={form.visibility === "private"}
          onClick={() => onFormChange({ visibility:"private" })}
        />
      </div>

      {/* ── Live-Vorschau ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:800, color:WT.ink,
          marginBottom:12 }}>Vorschau</div>
        <WorkPreviewCard form={form} mediaFiles={mediaFiles} profile={profile} />
      </div>

      {/* ── Fehler ── */}
      {error && (
        <div style={{
          background:"rgba(251,146,60,0.08)",
          border:"1px solid rgba(251,146,60,0.22)",
          borderRadius:12, padding:"10px 14px",
          fontSize:13, color:WT.coral,
          marginBottom:14,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Haupt-CTA ── */}
      <button
        onClick={!saving ? onPublish : undefined}
        disabled={saving}
        style={{
          width:"100%", height:56,
          borderRadius:18, border:"none",
          background: saving
            ? "rgba(26,26,46,0.10)"
            : `linear-gradient(135deg, ${WT.coral} 0%, #F97316 100%)`,
          color: saving ? WT.ink3 : "#fff",
          fontSize:16, fontWeight:900,
          cursor: saving ? "default" : "pointer",
          boxShadow: saving ? "none" : "0 10px 28px rgba(251,146,60,0.32)",
          transition:"all 0.22s ease",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          marginBottom:10,
        }}
      >
        {saving ? (
          <>
            <span style={{
              width:18, height:18, borderRadius:"50%",
              border:"2.5px solid rgba(26,26,46,0.15)",
              borderTopColor:WT.ink3,
              animation:"huiOrbNodeIn 0.8s linear infinite",
              display:"inline-block",
            }}/>
            Wird veröffentlicht…
          </>
        ) : (
          "Werk veröffentlichen ✨"
        )}
      </button>

      {/* ── Hinweis ── */}
      <div style={{ textAlign:"center", fontSize:12, color:WT.ink4,
        lineHeight:1.5 }}>
        Du kannst dein Werk später jederzeit bearbeiten.
      </div>
    </div>
  );
}

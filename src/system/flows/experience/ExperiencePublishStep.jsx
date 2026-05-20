// src/system/flows/experience/ExperiencePublishStep.jsx
// Step 3 — Veröffentlichung: Sichtbarkeit + immersive Live-Vorschau

import React from "react";
import { ET } from "./ExperienceFlow.jsx";

/* ── Sichtbarkeits-Cards ────────────────────────────────────── */
function VisibilityCard({ icon, label, sub, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:"14px 8px", borderRadius:16,
      border: active
        ? `2px solid ${ET.teal}`
        : "1.5px solid rgba(26,26,46,0.08)",
      background: active
        ? "rgba(10,191,184,0.06)"
        : "rgba(248,247,255,0.55)",
      cursor:"pointer",
      display:"flex", flexDirection:"column",
      alignItems:"center", gap:6,
      transition:"all 0.20s ease",
      boxShadow: active ? `0 4px 16px rgba(10,191,184,0.14)` : "none",
    }}>
      <div style={{
        width:36, height:36, borderRadius:11,
        background: active ? "rgba(10,191,184,0.12)" : "rgba(26,26,46,0.05)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18,
      }}>{icon}</div>
      <div style={{ fontSize:12.5, fontWeight:800, color:ET.ink,
        textAlign:"center" }}>{label}</div>
      <div style={{ fontSize:10.5, color:ET.ink3, textAlign:"center",
        lineHeight:1.3 }}>{sub}</div>
    </button>
  );
}

/* ── Experience Preview Card (immersiv) ─────────────────────── */
function ExperiencePreviewCard({ form, mediaFiles, profile }) {
  const cover = mediaFiles[0]?.preview || null;

  // Preis formatieren
  const priceLabel = {
    free:    "Kostenlos",
    hourly:  form.price ? `${parseFloat(form.price).toFixed(0)} €/Std.` : "Stundenpreis",
    fixed:   form.price ? `${parseFloat(form.price).toFixed(2)} €` : "Festpreis",
    inquiry: "Auf Anfrage",
  }[form.priceMode] || "–";

  const priceColor = form.priceMode === "free" ? ET.teal
    : form.priceMode === "inquiry" ? ET.ink3 : ET.teal;

  // Ort-Label
  const locLabel = {
    online: "Online",
    onsite: form.locationText || "Vor Ort",
    hybrid: "Online + Vor Ort",
  }[form.locationType] || "–";

  // Verfügbarkeits-Zusammenfassung
  const DAYS_DE = { mon:"Mo",tue:"Di",wed:"Mi",thu:"Do",fri:"Fr",sat:"Sa",sun:"So" };
  const dayStr = form.availDays.length > 0
    ? form.availDays.map(d => DAYS_DE[d] || d).join(", ")
    : "Flexibel";

  return (
    <div style={{
      borderRadius:22, overflow:"hidden",
      background:ET.card,
      boxShadow:"0 12px 40px rgba(26,26,46,0.12), 0 2px 8px rgba(26,26,46,0.06)",
    }}>
      {/* ── Cover Bild ── */}
      <div style={{
        width:"100%", aspectRatio:"16/9",
        background:"linear-gradient(135deg, rgba(10,191,184,0.08), rgba(139,92,246,0.08))",
        position:"relative", overflow:"hidden",
      }}>
        {cover ? (
          <img src={cover} alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        ) : (
          <div style={{
            width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:8,
          }}>
            <div style={{ fontSize:40 }}>✨</div>
            <div style={{ fontSize:12, color:"rgba(26,26,46,0.30)" }}>
              Kein Bild — wird automatisch generiert
            </div>
          </div>
        )}

        {/* Preis Badge */}
        <div style={{
          position:"absolute", top:12, right:12,
          background:"rgba(255,255,255,0.92)",
          backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          borderRadius:20, padding:"5px 12px",
          fontSize:13, fontWeight:800, color:priceColor,
          boxShadow:"0 4px 12px rgba(26,26,46,0.10)",
        }}>{priceLabel}</div>

        {/* Creator Badge (links unten) */}
        {profile && (
          <div style={{
            position:"absolute", bottom:12, left:12,
            display:"flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,0.90)",
            backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            borderRadius:20, padding:"5px 12px 5px 5px",
            boxShadow:"0 4px 12px rgba(26,26,46,0.10)",
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt=""
                style={{ width:24,height:24,borderRadius:"50%",objectFit:"cover" }}/>
            ) : (
              <div style={{
                width:24, height:24, borderRadius:"50%",
                background:`linear-gradient(135deg,${ET.teal},${ET.violet})`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,color:"#fff",fontWeight:700,
              }}>
                {(profile.full_name||profile.username||"?").charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ fontSize:12, fontWeight:700, color:ET.ink }}>
              {profile.full_name || profile.username || "Du"}
            </div>
          </div>
        )}
      </div>

      {/* ── Info-Bereich ── */}
      <div style={{ padding:"16px 16px 14px" }}>
        {/* Titel */}
        <div style={{ fontSize:16, fontWeight:900, color:ET.ink,
          letterSpacing:-0.4, marginBottom:6, lineHeight:1.2 }}>
          {form.title || "Titel deines Erlebnisses"}
        </div>

        {/* Beschreibung */}
        <div style={{
          fontSize:12.5, color:ET.ink2, lineHeight:1.55, marginBottom:14,
          display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {form.description || "Deine Beschreibung erscheint hier."}
        </div>

        {/* Meta Grid */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:"8px 16px",
        }}>
          <MetaRow icon="⏱" label="Dauer" value={
            form.duration === "Individuell" && form.durationCustom
              ? form.durationCustom : form.duration
          }/>
          <MetaRow icon="📍" label="Ort" value={locLabel}/>
          <MetaRow icon="📅" label="Tage" value={dayStr}/>
          {form.maxParticipants && (
            <MetaRow icon="👥" label="Max." value={`${form.maxParticipants} Personen`}/>
          )}
          {form.category && (
            <MetaRow icon="🏷" label="Kategorie" value={form.category}/>
          )}
          <MetaRow icon="⚡" label="Buchung"
            value={form.bookingMode==="direct" ? "Sofortbuchung" : "Auf Anfrage"}/>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ fontSize:13 }}>{icon}</span>
      <span style={{ fontSize:11, color:ET.ink3, fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:11.5, color:ET.ink2, fontWeight:500,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {value}
      </span>
    </div>
  );
}

/* ── Step 3 ──────────────────────────────────────────────────── */
export function ExperiencePublishStep({
  form, mediaFiles, profile, onFormChange,
  onPublish, saving, error,
}) {
  return (
    <div style={{ padding:"24px 20px 24px",
      animation:"efFadeStep 0.28s ease both" }}>

      {/* ── Headline ── */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:ET.ink,
          letterSpacing:-0.5, margin:0 }}>
          Veröffentlichung<span style={{ color:ET.teal, marginLeft:3 }}>·</span>
        </h1>
        <p style={{ fontSize:13, color:ET.ink3, margin:"5px 0 0" }}>
          Wähle, wie dein Erlebnis sichtbar sein soll.
        </p>
      </div>

      {/* ── Sichtbarkeit ── */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        <VisibilityCard icon="🌐" label="Öffentlich" sub="Für alle sichtbar"
          active={form.visibility==="public"}
          onClick={() => onFormChange({ visibility:"public" })}/>
        <VisibilityCard icon="👥" label="Nur Community" sub="Nur HUI Mitglieder"
          active={form.visibility==="community"}
          onClick={() => onFormChange({ visibility:"community" })}/>
        <VisibilityCard icon="🔒" label="Privat" sub="Nur für dich"
          active={form.visibility==="private"}
          onClick={() => onFormChange({ visibility:"private" })}/>
      </div>

      {/* ── Live Preview ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:800, color:ET.ink,
          marginBottom:12 }}>Vorschau</div>
        <ExperiencePreviewCard
          form={form} mediaFiles={mediaFiles} profile={profile}
        />
      </div>

      {/* ── Fehler ── */}
      {error && (
        <div style={{
          background:"rgba(251,146,60,0.08)",
          border:"1px solid rgba(251,146,60,0.22)",
          borderRadius:12, padding:"10px 14px",
          fontSize:13, color:ET.coral, marginBottom:14,
        }}>⚠ {error}</div>
      )}

      {/* ── Haupt CTA ── */}
      <button
        onClick={!saving ? onPublish : undefined}
        disabled={saving}
        style={{
          width:"100%", height:56, borderRadius:18, border:"none",
          background: saving
            ? "rgba(26,26,46,0.10)"
            : `linear-gradient(135deg, ${ET.teal} 0%, ${ET.violet} 100%)`,
          color: saving ? ET.ink3 : "#fff",
          fontSize:16, fontWeight:900, cursor: saving ? "default" : "pointer",
          boxShadow: saving ? "none"
            : "0 10px 28px rgba(10,191,184,0.28)",
          transition:"all 0.22s ease",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          marginBottom:10,
        }}
      >
        {saving ? (
          <span style={{ fontSize:14, color:ET.ink3 }}>
            Wird veröffentlicht…
          </span>
        ) : (
          "✨ Erlebnis anbieten"
        )}
      </button>

      {/* ── Hinweis ── */}
      <div style={{ textAlign:"center", fontSize:12, color:ET.ink4,
        lineHeight:1.5 }}>
        Du kannst dein Erlebnis später jederzeit bearbeiten.
      </div>
    </div>
  );
}

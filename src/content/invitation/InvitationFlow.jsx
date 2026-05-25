// src/content/invitation/InvitationFlow.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Einladung erstellen
// Spontan. Lokal. Menschlich. Kurzlebig.
//
// Kein langer Flow. 3 Schritte:
// Step 1: Was? (Kurztext + Typ-Stimmung)
// Step 2: Wo & Wann? (Ort, Zeit optional)
// Step 3: Veröffentlichen (Preview + Confirm)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from "react";
import { supabase }  from "../../lib/supabaseClient.js";
import { useAuth }   from "../../lib/AuthContext.jsx";
import { HUI }       from "../../design/hui.design.js";
import { createPublishResult, completePublishSuccess } from "../../lib/publishContract.js";

/* ── Tokens ─────────────────────────────────────────────────── */
const V = {
  violet:   HUI.COLOR.violet,
  violetL:  "rgba(139,92,246,0.12)",
  violetB:  "rgba(139,92,246,0.22)",
  teal:     HUI.COLOR.teal,
  coral:    HUI.COLOR.coral,
  ink:      HUI.COLOR.ink,
  ink2:     "rgba(26,26,46,0.60)",
  ink3:     "rgba(26,26,46,0.38)",
  muted:    "rgba(26,26,46,0.30)",
  bg:       "#F8F7FC",
  card:     "#FFFFFF",
  border:   "rgba(139,92,246,0.10)",
};

const CSS = `
  @keyframes if-up   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
  @keyframes if-fade { from{opacity:0} to{opacity:1} }
  @keyframes if-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes if-pop  { 0%{transform:scale(.85)} 60%{transform:scale(1.06)} 100%{transform:scale(1)} }
  .if-tap { cursor:pointer; -webkit-tap-highlight-color:transparent; transition:transform .14s, opacity .14s; }
  .if-tap:active { transform:scale(.93); opacity:.72; }
  .if-mood:checked + label, .if-mood-active { border-color:${HUI.COLOR.violet} !important; background:rgba(139,92,246,0.12) !important; }
`;

/* ── Einladungs-Typen / Stimmungen ──────────────────────────── */
const VIBES = [
  { k:"spaziergang", e:"🌿", l:"Spaziergang"  },
  { k:"kaffee",      e:"☕", l:"Kaffee"        },
  { k:"sport",       e:"🏃", l:"Sport"         },
  { k:"jam",         e:"🎸", l:"Jam Session"   },
  { k:"kunst",       e:"🎨", l:"Kreativ"       },
  { k:"essen",       e:"🍜", l:"Essen"         },
  { k:"natur",       e:"🌲", l:"Natur"         },
  { k:"sonstiges",   e:"✨", l:"Sonstiges"     },
];

/* ── Helpers ────────────────────────────────────────────────── */
const inputStyle = {
  width:      "100%",
  padding:    "13px 14px",
  borderRadius: 14,
  border:     `1.5px solid rgba(139,92,246,0.12)`,
  background: "rgba(248,247,255,0.70)",
  fontSize:   15,
  color:      V.ink,
  outline:    "none",
  fontFamily: "inherit",
  boxSizing:  "border-box",
  resize:     "none",
};

/* ── ProgressBar ────────────────────────────────────────────── */
function ProgressDots({ step }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", margin:"8px 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:  i === step ? 20 : 7,
          height: 7,
          borderRadius: 4,
          background: i === step ? V.violet : "rgba(139,92,246,0.20)",
          transition: "width .22s ease, background .22s ease",
        }}/>
      ))}
    </div>
  );
}

/* ── Step 1: Was? ───────────────────────────────────────────── */
function WasStep({ data, onChange, onNext }) {
  return (
    <div style={{ animation:"if-up .28s ease both" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:V.ink, letterSpacing:-0.5, marginBottom:6 }}>
          Was hast du vor? 👥
        </div>
        <div style={{ fontSize:13, color:V.ink3 }}>
          Spontan ist gut. Ein Satz reicht.
        </div>
      </div>

      {/* Kurztext */}
      <textarea
        value={data.text || ""}
        onChange={e => onChange({ text: e.target.value })}
        placeholder='z.B. „Wer hat Lust auf einen Spaziergang im Englischen Garten?"'
        rows={3}
        style={{ ...inputStyle, lineHeight:1.5 }}
        maxLength={180}
      />
      <div style={{ textAlign:"right", fontSize:11, color:V.muted, marginTop:4 }}>
        {(data.text || "").length}/180
      </div>

      {/* Vibe-Auswahl */}
      <div style={{ marginTop:18 }}>
        <div style={{ fontSize:12.5, fontWeight:600, color:V.ink3, marginBottom:10, letterSpacing:"0.04em" }}>
          STIMMUNG
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {VIBES.map(v => (
            <button
              key={v.k}
              className="if-tap"
              onClick={() => onChange({ vibe: data.vibe === v.k ? null : v.k })}
              style={{
                padding:    "7px 14px",
                borderRadius: 50,
                border:     `1.5px solid ${data.vibe === v.k ? V.violet : "rgba(139,92,246,0.15)"}`,
                background: data.vibe === v.k ? V.violetL : "rgba(248,247,255,0.80)",
                cursor:     "pointer",
                fontSize:   13,
                fontWeight: data.vibe === v.k ? 700 : 400,
                color:      data.vibe === v.k ? V.violet : V.ink2,
                transition: "all .14s ease",
              }}
            >
              {v.e} {v.l}
            </button>
          ))}
        </div>
      </div>

      <button
        className="if-tap"
        onClick={onNext}
        disabled={!data.text?.trim()}
        style={{
          marginTop:    24,
          width:        "100%",
          padding:      "15px",
          borderRadius: 16,
          border:       "none",
          background:   data.text?.trim()
            ? `linear-gradient(135deg, ${V.violet} 0%, #6D28D9 100%)`
            : "rgba(139,92,246,0.22)",
          color:        data.text?.trim() ? "white" : V.violet,
          fontSize:     16,
          fontWeight:   700,
          cursor:       data.text?.trim() ? "pointer" : "not-allowed",
          letterSpacing: -0.3,
        }}
      >
        Weiter →
      </button>
    </div>
  );
}

/* ── Step 2: Wo & Wann? ─────────────────────────────────────── */
function WoWannStep({ data, onChange, onNext, onBack }) {
  return (
    <div style={{ animation:"if-up .28s ease both" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:V.ink, letterSpacing:-0.5, marginBottom:6 }}>
          Wo & wann? 📍
        </div>
        <div style={{ fontSize:13, color:V.ink3 }}>
          Optional — aber hilft anderen zu entscheiden.
        </div>
      </div>

      {/* Ort */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12.5, fontWeight:600, color:V.ink3, letterSpacing:"0.04em",
          display:"block", marginBottom:8 }}>ORT (optional)</label>
        <input
          type="text"
          value={data.location || ""}
          onChange={e => onChange({ location: e.target.value })}
          placeholder='z.B. "Englischer Garten, München"'
          style={inputStyle}
        />
      </div>

      {/* Zeit */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12.5, fontWeight:600, color:V.ink3, letterSpacing:"0.04em",
          display:"block", marginBottom:8 }}>WANN (optional)</label>
        <input
          type="text"
          value={data.time_label || ""}
          onChange={e => onChange({ time_label: e.target.value })}
          placeholder='z.B. "Heute 16 Uhr" oder "Morgen früh"'
          style={inputStyle}
        />
      </div>

      {/* Max Personen */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12.5, fontWeight:600, color:V.ink3, letterSpacing:"0.04em",
          display:"block", marginBottom:8 }}>MAX. PERSONEN (optional)</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[null,2,3,5,8,10].map(n => (
            <button
              key={String(n)}
              className="if-tap"
              onClick={() => onChange({ max_participants: n })}
              style={{
                padding:    "7px 16px",
                borderRadius: 50,
                border:     `1.5px solid ${data.max_participants === n ? V.violet : "rgba(139,92,246,0.15)"}`,
                background: data.max_participants === n ? V.violetL : "rgba(248,247,255,0.80)",
                cursor:     "pointer",
                fontSize:   13,
                fontWeight: data.max_participants === n ? 700 : 400,
                color:      data.max_participants === n ? V.violet : V.ink2,
              }}
            >{n === null ? "Offen" : `Max. ${n}`}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginTop:24 }}>
        <button className="if-tap" onClick={onBack} style={{
          flex:1, padding:"14px", borderRadius:16, border:`1.5px solid rgba(139,92,246,0.15)`,
          background:"transparent", color:V.violet, fontSize:15, fontWeight:600, cursor:"pointer",
        }}>← Zurück</button>
        <button className="if-tap" onClick={onNext} style={{
          flex:2, padding:"14px", borderRadius:16, border:"none",
          background:`linear-gradient(135deg, ${V.violet} 0%, #6D28D9 100%)`,
          color:"white", fontSize:16, fontWeight:700, cursor:"pointer", letterSpacing:-0.3,
        }}>Vorschau →</button>
      </div>
    </div>
  );
}

/* ── Step 3: Preview + Publish ──────────────────────────────── */
function PreviewStep({ data, onPublish, onBack, publishing }) {
  const vibe = VIBES.find(v => v.k === data.vibe);
  return (
    <div style={{ animation:"if-up .28s ease both" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:800, color:V.ink, letterSpacing:-0.5 }}>
          So klingt es ✦
        </div>
      </div>

      {/* Preview Card */}
      <div style={{
        background:   V.card,
        borderRadius: 20,
        border:       `1.5px solid ${V.violetB}`,
        padding:      "18px 18px",
        marginBottom: 20,
        boxShadow:    "0 4px 24px rgba(139,92,246,0.10)",
      }}>
        {/* Vibe pill */}
        {vibe && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:5,
            padding:"5px 12px", borderRadius:50,
            background: V.violetL,
            fontSize:12.5, fontWeight:600, color:V.violet,
            marginBottom:12,
          }}>
            {vibe.e} {vibe.l}
          </div>
        )}

        {/* Text */}
        <div style={{
          fontSize:16, fontWeight:500, color:V.ink, lineHeight:1.55,
          letterSpacing:-0.15, marginBottom:12,
        }}>
          „{data.text}"
        </div>

        {/* Meta */}
        {(data.location || data.time_label || data.max_participants) && (
          <div style={{
            display:"flex", flexWrap:"wrap", gap:8,
            fontSize:12.5, color:V.ink3,
          }}>
            {data.location     && <span>📍 {data.location}</span>}
            {data.time_label   && <span>🕐 {data.time_label}</span>}
            {data.max_participants && <span>👥 Max. {data.max_participants}</span>}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        padding:"12px 14px", borderRadius:14,
        background:"rgba(139,92,246,0.06)",
        fontSize:12, color:V.ink3, marginBottom:20, lineHeight:1.5,
      }}>
        ✦ Einladungen sind 48h sichtbar und dann automatisch abgelaufen.
        Community-Mitglieder in deiner Nähe können direkt antworten.
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button className="if-tap" onClick={onBack} style={{
          flex:1, padding:"14px", borderRadius:16, border:`1.5px solid rgba(139,92,246,0.15)`,
          background:"transparent", color:V.violet, fontSize:15, fontWeight:600, cursor:"pointer",
        }}>← Zurück</button>
        <button
          className="if-tap"
          onClick={onPublish}
          disabled={publishing}
          style={{
            flex:2, padding:"14px", borderRadius:16, border:"none",
            background: publishing
              ? "rgba(139,92,246,0.35)"
              : `linear-gradient(135deg, ${V.violet} 0%, #6D28D9 100%)`,
            color:"white", fontSize:16, fontWeight:700,
            cursor: publishing ? "not-allowed" : "pointer",
            letterSpacing:-0.3, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}
        >
          {publishing
            ? <><span style={{ display:"inline-block", animation:"if-spin 0.8s linear infinite" }}>◐</span> Sende…</>
            : "✦ Einladung senden"
          }
        </button>
      </div>
    </div>
  );
}

/* ── SuccessScreen ──────────────────────────────────────────── */
function SuccessScreen({ onClose }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 24px", animation:"if-up .32s ease both" }}>
      <div style={{ fontSize:56, marginBottom:16, animation:"if-pop .5s ease both" }}>🌟</div>
      <div style={{ fontSize:22, fontWeight:800, color:V.ink, letterSpacing:-0.5, marginBottom:8 }}>
        Einladung raus!
      </div>
      <div style={{ fontSize:14, color:V.ink3, lineHeight:1.6, marginBottom:28 }}>
        Deine Einladung ist 48 Stunden sichtbar.<br/>
        Mal schauen, wer antwortet ✦
      </div>
      <button className="if-tap" onClick={onClose} style={{
        padding:"14px 36px", borderRadius:16, border:"none",
        background:`linear-gradient(135deg, ${V.violet} 0%, #6D28D9 100%)`,
        color:"white", fontSize:16, fontWeight:700, cursor:"pointer",
      }}>Perfekt</button>
    </div>
  );
}

/* ── Main Flow ──────────────────────────────────────────────── */
export default function InvitationFlow({ onClose, onPublished, visible = true }) {
  const { user, profile } = useAuth();
  const [step,       setStep]       = useState(0);
  const [data,       setData]       = useState({});
  const [publishing, setPublishing] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState(null);

  const updateData = useCallback((patch) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  const handlePublish = useCallback(async () => {
    if (!user?.id) { setError("Nicht eingeloggt"); return; }
    setPublishing(true);
    setError(null);
    try {
      const row = {
        user_id:          user.id,
        text:             data.text?.trim() || "",
        title:            (data.text?.trim() || "").slice(0, 80),
        vibe:             data.vibe || null,
        mood:             data.vibe || null,
        location:         data.location?.trim() || null,
        city:             data.location?.trim()?.split(",").pop()?.trim() || null,
        time_label:       data.time_label?.trim() || null,
        max_participants: data.max_participants || null,
        status:           "active",
        expires_at:       new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        visibility:       "public",
        // content_type ist GENERATED ALWAYS — nicht einfügen
      };

      // Phase 4E: In 'invitations' Tabelle schreiben (kein Fallback mehr)
      const { data: insertedInv, error: insertError } = await supabase
        .from("invitations")
        .insert(row)
        .select("id, visibility, created_at")
        .single();

      if (insertError) throw insertError;

      console.log("[InvitationFlow] ✓ Invitation erstellt:", insertedInv?.id);
      completePublishSuccess(onPublished, createPublishResult({
        entityType: "invitation",
        entityId: insertedInv?.id,
        visibility: insertedInv?.visibility || row.visibility,
        createdAt: insertedInv?.created_at,
      }));

      setSuccess(true);
    } catch (err) {
      console.error("[InvitationFlow] publish error:", err);
      setError(err.message || "Fehler beim Veröffentlichen");
    } finally {
      setPublishing(false);
    }
  }, [user, data, onPublished]);

  if (!visible) return null;

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:9200,
          background:"rgba(15,15,25,0.55)",
          backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          animation:"if-fade .22s ease both",
        }}
      />

      {/* Sheet */}
      <div style={{
        position:     "fixed",
        bottom:       0,
        left:         0,
        right:        0,
        zIndex:       9201,
        background:   V.bg,
        borderRadius: "28px 28px 0 0",
        padding:      "0 0 env(safe-area-inset-bottom,24px)",
        maxHeight:    "92vh",
        overflowY:    "auto",
        boxShadow:    "0 -8px 48px rgba(139,92,246,0.18)",
        animation:    "if-up .32s cubic-bezier(.22,1,.36,1) both",
        touchAction:  "manipulation",
      }}>
        {/* Handle */}
        <div style={{ width:40, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)", margin:"12px auto 0" }}/>

        {/* Header */}
        {!success && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:34, height:34, borderRadius:10,
                background:"rgba(139,92,246,0.12)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18,
              }}>👥</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:V.ink, letterSpacing:-0.3 }}>Einladung</div>
                <ProgressDots step={step} />
              </div>
            </div>
            <button className="if-tap" onClick={onClose} style={{
              background:"rgba(0,0,0,0.06)", border:"none", borderRadius:50,
              width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", fontSize:18, color:V.ink2,
            }}>×</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ margin:"10px 20px 0", padding:"10px 14px", borderRadius:12,
            background:"rgba(239,68,68,0.10)", border:"1px solid rgba(239,68,68,0.20)",
            fontSize:12.5, color:"#DC2626" }}>⚠️ {error}</div>
        )}

        {/* Content */}
        <div style={{ padding:"16px 20px" }}>
          {success ? (
            <SuccessScreen onClose={onClose} />
          ) : step === 0 ? (
            <WasStep   data={data} onChange={updateData} onNext={() => setStep(1)} />
          ) : step === 1 ? (
            <WoWannStep data={data} onChange={updateData} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          ) : (
            <PreviewStep data={data} onPublish={handlePublish} onBack={() => setStep(1)} publishing={publishing} />
          )}
        </div>
      </div>
    </>
  );
}

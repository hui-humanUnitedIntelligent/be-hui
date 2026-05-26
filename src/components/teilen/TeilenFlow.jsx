// src/components/teilen/TeilenFlow.jsx
// HUI "Teilen" Flow v1 — Feed + Story sharing
// 3 Steps: Wo teilen → Inhalt erstellen → Preview + Publish
// Design: soft white, glass, teal+violet, premium Apple-feel
// iOS-safe: touch-action:manipulation, zIndex:10100, no overflow:hidden

import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { HUI } from "../../design/hui.design.js";

/* ── Tokens ── */
const C = {
  teal:   HUI.COLOR.teal,
  teal2:  "#0891B2",
  violet: HUI.COLOR.violet,
  violet2:"#7C3AED",
  peach:  HUI.COLOR.coral,
  ink:    HUI.COLOR.ink,
  muted:  "rgba(26,26,46,0.48)",
  bg:     "#F8F7FC",
  card:   "rgba(255,255,255,0.90)",
  border: "rgba(139,92,246,0.10)",
};

const MOODS = [
  { k:"ruhig",       e:"🌿", l:"Ruhig"        },
  { k:"kreativ",     e:"🎨", l:"Kreativ"       },
  { k:"gluecklich",  e:"☀️", l:"Glücklich"     },
  { k:"abenteuer",   e:"🚀", l:"Abenteuerlich" },
  { k:"tief",        e:"🌊", l:"Tief"          },
];

const CSS = `
  @keyframes tf-in  { from{opacity:0;transform:translateY(20px) scale(.98)} to{opacity:1;transform:none} }
  @keyframes tf-fade { from{opacity:0} to{opacity:1} }
  @keyframes tf-pop  { 0%{transform:scale(.95)} 60%{transform:scale(1.02)} 100%{transform:scale(1)} }
  @keyframes tf-pulse {
    0%,100%{box-shadow:0 8px 32px rgba(139,92,246,.22)}
    50%    {box-shadow:0 12px 44px rgba(139,92,246,.40)}
  }
  @keyframes tf-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes tf-glow-teal {
    0%,100%{box-shadow:0 6px 28px rgba(10,191,184,.18), 0 0 0 2px rgba(10,191,184,.22)}
    50%    {box-shadow:0 10px 38px rgba(10,191,184,.30), 0 0 0 2.5px rgba(10,191,184,.34)}
  }
  @keyframes tf-glow-violet {
    0%,100%{box-shadow:0 6px 28px rgba(139,92,246,.18), 0 0 0 2px rgba(139,92,246,.22)}
    50%    {box-shadow:0 10px 38px rgba(139,92,246,.30), 0 0 0 2.5px rgba(139,92,246,.34)}
  }

  .tf-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
  }
  .tf-tap:active { transform: scale(0.965) translateY(1px) !important; transition: transform 120ms cubic-bezier(0.22,1,0.36,1) !important; }

  .tf-scroll::-webkit-scrollbar { display: none; }
  .tf-scroll { -ms-overflow-style:none; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
`;

/* ══ Progress Bar ══ */
function ProgressBar({ step }) {
  const labels = ["Wo", "Erstellen", "Vorschau"];
  return (
    <div style={{ display:"flex", gap:6, padding:"0 4px" }}>
      {labels.map((l, i) => {
        const active = i + 1 === step;
        const done   = i + 1 < step;
        return (
          <div key={l} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{
              height: 3,
              borderRadius: 99,
              background: done
                ? `linear-gradient(90deg,${C.teal},${C.violet})`
                : active
                ? `linear-gradient(90deg,${C.violet},${C.violet2})`
                : "rgba(139,92,246,0.12)",
              transition: "background .3s",
            }}/>
            <span style={{
              fontSize: 10.5, fontWeight: active || done ? 700 : 500,
              color: active ? C.violet : done ? C.teal : C.muted,
              transition: "color .3s",
            }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══ STEP 1 — Wo teilen? ══ */
function StepWhere({ value, onSelect, onNext }) {
  const cards = [
    {
      key:    "feed",
      icon:   "🏠",
      label:  "HomeFeed",
      sub:    "Teile einen Moment im Feed.",
      grad:   `linear-gradient(135deg,rgba(10,191,184,.10),rgba(8,145,178,.06))`,
      border: `rgba(10,191,184,.30)`,
      glow:   "tf-glow-teal",
      check:  C.teal,
    },
    {
      key:    "story",
      icon:   "⚡️",
      label:  "Story",
      sub:    "Teile etwas Kurzlebiges mit deinen Followern.",
      grad:   `linear-gradient(135deg,rgba(139,92,246,.10),rgba(124,58,237,.06))`,
      border: `rgba(139,92,246,.28)`,
      glow:   "tf-glow-violet",
      check:  C.violet,
    },
  ];

  return (
    <div className="tf-scroll" style={{
      flex:1, overflowY:"auto", padding:"0 20px 40px",
      display:"flex", flexDirection:"column", alignItems:"center",
    }}>
      {/* Headline */}
      <div style={{ textAlign:"center", marginBottom:32, animation:"tf-in .22s ease both" }}>
        <div style={{ fontSize:26, fontWeight:900, color:C.ink, letterSpacing:-.7, marginBottom:8 }}>
          Was m\u00f6chtest du teilen?
        </div>
        <div style={{ fontSize:14.5, color:C.muted, lineHeight:1.6 }}>
          Teile einen Moment mit deiner Community.
        </div>
      </div>

      {/* Cards */}
      <div style={{ width:"100%", maxWidth:480, display:"flex", flexDirection:"column", gap:14 }}>
        {(cards || []).filter(c => c && c.key).map((c, i) => {
          const on = value === c.key;
          return (
            <button
              key={c.key}
              type="button"
              className="tf-tap"
              onClick={() => { onSelect(c.key); }}
              style={{
                textAlign:"left", width:"100%",
                padding:"22px 22px",
                borderRadius:24,
                background: on ? c.grad : "rgba(255,255,255,.92)",
                border: on ? `2px solid ${c.border}` : "1.5px solid rgba(220,215,235,.90)",
                boxShadow: on ? "none" : "0 3px 16px rgba(0,0,0,.05)",
                animation: on
                  ? `${c.glow} 3s ease-in-out infinite`
                  : `tf-in ${.07 + i*.07}s ease both`,
                display:"flex", alignItems:"center", gap:18,
                transition:"background .15s, border .15s",
              }}
            >
              {/* Icon */}
              <div style={{
                width:58, height:58, borderRadius:18, flexShrink:0,
                background: on
                  ? (c.key === "feed"
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : `linear-gradient(135deg,${C.violet},${C.violet2})`)
                  : "rgba(139,92,246,.07)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:26,
                boxShadow: on
                  ? (c.key === "feed"
                    ? "0 6px 18px rgba(10,191,184,.30)"
                    : "0 6px 18px rgba(139,92,246,.28)")
                  : "none",
                transition:"all .18s",
              }}>{c.icon}</div>

              {/* Text */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:17, fontWeight:800,
                  color: on ? (c.key==="feed" ? C.teal : C.violet) : C.ink,
                  marginBottom:4, letterSpacing:-.25, transition:"color .15s",
                }}>{c.label}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.55 }}>{c.sub}</div>
              </div>

              {/* Check */}
              <div style={{
                width:28, height:28, borderRadius:9, flexShrink:0,
                background: on ? c.check : "transparent",
                border: on ? "none" : "1.5px solid rgba(0,0,0,.10)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize: on ? 13 : 17,
                color: on ? "white" : "rgba(0,0,0,.14)",
                transition:"all .16s",
              }}>{on ? "\u2713" : "\u203a"}</div>
            </button>
          );
        })}
      </div>

      {/* Weiter Button */}
      <div style={{ width:"100%", maxWidth:480, marginTop:22 }}>
        <button
          type="button"
          className="tf-tap"
          disabled={!value}
          onClick={() => value && onNext()}
          style={{
            width:"100%", height:54, borderRadius:99,
            background: value
              ? `linear-gradient(135deg,${C.violet} 0%,${C.violet2} 100%)`
              : "rgba(139,92,246,.13)",
            border:"none",
            color: value ? "white" : "rgba(139,92,246,.38)",
            fontSize:17, fontWeight:800, letterSpacing:-.2,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition:"background .18s, color .18s",
            animation: value ? "tf-pulse 3.6s ease-in-out infinite" : "none",
            cursor: value ? "pointer" : "default",
          }}
        >
          {value ? <>Weiter\u00a0\u00a0<span style={{fontSize:19}}>→</span></> : "Kategorie w\u00e4hlen"}
        </button>
      </div>
    </div>
  );
}

/* ══ STEP 2 — Erstellen ══ */
function StepCreate({ mode, data, onChange }) {
  const fileRef  = useRef(null);
  const cameraRef = useRef(null);
  const videoRef  = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url  = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    onChange({ ...data, mediaFile: file, mediaPreview: url, mediaType: type });
  }

  const isStory = mode === "story";

  return (
    <div className="tf-scroll" style={{
      flex:1, overflowY:"auto", padding:"0 20px 40px",
      display:"flex", flexDirection:"column", alignItems:"center",
    }}>
      {/* Headline */}
      <div style={{ textAlign:"center", marginBottom:24, animation:"tf-in .20s ease both" }}>
        <div style={{ fontSize:24, fontWeight:900, color:C.ink, letterSpacing:-.6, marginBottom:6 }}>
          Dein Moment
        </div>
        <div style={{ fontSize:14, color:C.muted }}>
          Zeige etwas aus deinem Leben.
        </div>
      </div>

      {/* Media Area */}
      <div style={{
        width:"100%", maxWidth:480,
        borderRadius:24,
        background: data.mediaPreview ? "transparent" : "rgba(255,255,255,.88)",
        border: data.mediaPreview ? "none" : "1.5px dashed rgba(139,92,246,.22)",
        overflow:"hidden",
        marginBottom:16,
        animation:"tf-in .22s ease both",
        minHeight: data.mediaPreview ? "auto" : 220,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        {data.mediaPreview ? (
          /* Preview */
          <div style={{ position:"relative", width:"100%", animation:"tf-fade .25s ease" }}>
            {data.mediaType === "video" ? (
              <video
                src={data.mediaPreview}
                controls
                style={{ width:"100%", borderRadius:24, display:"block" }}
              />
            ) : (
              <img
                src={data.mediaPreview}
                alt="preview"
                style={{ width:"100%", borderRadius:24, display:"block", objectFit:"cover", maxHeight:360 }}
              />
            )}
            {/* Remove */}
            <button
              type="button"
              className="tf-tap"
              onClick={() => onChange({ ...data, mediaFile:null, mediaPreview:null, mediaType:null })}
              style={{
                position:"absolute", top:10, right:10,
                width:32, height:32, borderRadius:"50%",
                background:"rgba(0,0,0,.44)", border:"none",
                color:"white", fontSize:16,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >×</button>
          </div>
        ) : (
          /* Upload Buttons */
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            gap:14, padding:"32px 20px",
          }}>
            <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>
              F\u00fcge ein Foto oder Video hinzu
            </div>

            {/* 3 action buttons */}
            {[
              { label:"Foto aufnehmen",   icon:"📷", accept:"image/*",  capture:"environment", ref:cameraRef },
              { label:"Video aufnehmen",  icon:"🎥", accept:"video/*",  capture:"environment", ref:videoRef  },
              { label:"Datei hochladen",  icon:"⬆️", accept:"image/*,video/*", capture:null,  ref:fileRef   },
            ].map((btn, i) => (
              <div key={btn.label} style={{ width:"100%", maxWidth:280 }}>
                <input
                  ref={btn.ref}
                  type="file"
                  accept={btn.accept}
                  capture={btn.capture || undefined}
                  style={{ display:"none" }}
                  onChange={handleFile}
                />
                <button
                  type="button"
                  className="tf-tap"
                  onClick={() => btn.ref.current?.click()}
                  style={{
                    width:"100%", height:48, borderRadius:16,
                    background:"rgba(255,255,255,.95)",
                    border:`1.5px solid ${i===0?"rgba(10,191,184,.25)":i===1?"rgba(139,92,246,.22)":"rgba(251,146,60,.22)"}`,
                    boxShadow:"0 2px 12px rgba(0,0,0,.05)",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                    fontSize:14.5, fontWeight:700,
                    color: i===0 ? C.teal : i===1 ? C.violet : C.peach,
                    animation:`tf-in ${.10 + i*.07}s ease both`,
                  }}
                >
                  <span style={{ fontSize:20 }}>{btn.icon}</span>
                  {btn.label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Textfeld */}
      <div style={{ width:"100%", maxWidth:480, marginBottom:16, animation:"tf-in .26s ease both" }}>
        <textarea
          value={data.text || ""}
          onChange={e => onChange({ ...data, text: e.target.value.slice(0,120) })}
          placeholder={isStory ? "Kurzer Text (optional)…" : "Schreib etwas zu deinem Moment\u2026"}
          rows={3}
          style={{
            width:"100%", borderRadius:16,
            padding:"14px 16px",
            background:"rgba(255,255,255,.88)",
            border:"1.5px solid rgba(139,92,246,.13)",
            fontSize:15, color:C.ink,
            resize:"none", fontFamily:"inherit",
            outline:"none",
            boxSizing:"border-box",
            lineHeight:1.55,
          }}
        />
        <div style={{ textAlign:"right", fontSize:12, color:C.muted, marginTop:4 }}>
          {(data.text||"").length}/120
        </div>
      </div>

      {/* Feed-only: Ort + Stimmung */}
      {!isStory && (
        <div style={{ width:"100%", maxWidth:480, animation:"tf-in .28s ease both" }}>
          {/* Ort */}
          <input
            value={data.location || ""}
            onChange={e => onChange({ ...data, location: e.target.value })}
            placeholder="📍 Ort hinzuf\u00fcgen (optional)"
            style={{
              width:"100%", borderRadius:14,
              padding:"12px 16px", marginBottom:12,
              background:"rgba(255,255,255,.88)",
              border:"1.5px solid rgba(139,92,246,.12)",
              fontSize:14.5, color:C.ink, fontFamily:"inherit",
              outline:"none", boxSizing:"border-box",
            }}
          />

          {/* Stimmung Pills */}
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:12.5, color:C.muted, marginBottom:8, fontWeight:600 }}>
              Stimmung (optional)
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {(MOODS||[]).filter(m=>m&&m.key).map(m => {
                const on = data.mood === m.k;
                return (
                  <button
                    key={m.k}
                    type="button"
                    className="tf-tap"
                    onClick={() => onChange({ ...data, mood: on ? null : m.k })}
                    style={{
                      height:34, paddingInline:14, borderRadius:99,
                      background: on
                        ? `linear-gradient(135deg,${C.violet},${C.violet2})`
                        : "rgba(255,255,255,.88)",
                      border: on ? "none" : "1.5px solid rgba(139,92,246,.16)",
                      color: on ? "white" : C.muted,
                      fontSize:13, fontWeight:700,
                      display:"flex", alignItems:"center", gap:5,
                      transition:"all .15s",
                    }}
                  >
                    <span>{m.e}</span> {m.l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}



   {/* ── DEBUG PANEL: Post-Insert beitraege Rows ──────────────── */}
    </div>
  );
}

/* ══ STEP 3 — Preview ══ */
function StepPreview({ mode, data, profile, onPublish, publishing }) {
  const isStory = mode === "story";
  const name    = profile?.display_name || profile?.email?.split("@")[0] || "Du";
  const avatar  = profile?.avatar_url || null;
  const now     = "Gerade eben";

  return (
    <div className="tf-scroll" style={{
      flex:1, overflowY:"auto", padding:"0 20px 40px",
      display:"flex", flexDirection:"column", alignItems:"center",
    }}>
      {/* Headline */}
      <div style={{ textAlign:"center", marginBottom:24, animation:"tf-in .20s ease both" }}>
        <div style={{ fontSize:22, fontWeight:900, color:C.ink, letterSpacing:-.5, marginBottom:5 }}>
          Vorschau
        </div>
        <div style={{ fontSize:13.5, color:C.muted }}>So erscheint dein Beitrag.</div>
      </div>

      {isStory ? (
        /* ── Story Preview ── */
        <div style={{
          width:"100%", maxWidth:340,
          borderRadius:28,
          overflow:"hidden",
          background:"linear-gradient(160deg,#1A1A2E 0%,#2D1B69 100%)",
          boxShadow:"0 16px 48px rgba(0,0,0,.22)",
          aspectRatio:"9/16",
          position:"relative",
          animation:"tf-pop .25s ease",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
        }}>
          {/* BG Image */}
          {data.mediaPreview && (
            <img
              src={data.mediaPreview}
              alt=""
              style={{
                position:"absolute", inset:0,
                width:"100%", height:"100%",
                objectFit:"cover", opacity:.7,
              }}
            />
          )}
          {/* Overlay */}
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 55%)",
          }}/>
          {/* Text */}
          {data.text && (
            <div style={{
              position:"absolute", bottom:60, left:20, right:20,
              color:"white", fontSize:18, fontWeight:700, lineHeight:1.4,
            }}>{data.text}</div>
          )}
          {/* Author */}
          <div style={{
            position:"absolute", top:16, left:16,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <div style={{
              width:34, height:34, borderRadius:"50%",
              background:`linear-gradient(135deg,${C.teal},${C.violet})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"white", fontSize:13, fontWeight:800,
              border:"2px solid white",
              overflow:"hidden",
            }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : name[0]?.toUpperCase()
              }
            </div>
            <span style={{ color:"white", fontSize:13, fontWeight:700 }}>{name}</span>
          </div>
        </div>
      ) : (
        /* ── Feed Preview ── */
        <div style={{
          width:"100%", maxWidth:480,
          borderRadius:24,
          background:"rgba(255,255,255,.96)",
          border:"1.5px solid rgba(139,92,246,.09)",
          boxShadow:"0 8px 32px rgba(0,0,0,.07)",
          overflow:"hidden",
          animation:"tf-pop .25s ease",
        }}>
          {/* Header */}
          <div style={{ padding:"14px 16px 0", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:40, height:40, borderRadius:"50%",
              background:`linear-gradient(135deg,${C.teal},${C.violet})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"white", fontSize:15, fontWeight:800,
              overflow:"hidden", flexShrink:0,
            }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : name[0]?.toUpperCase()
              }
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:C.ink }}>{name}</div>
              <div style={{ fontSize:12, color:C.muted }}>
                {now}
                {data.location && <> · 📍 {data.location}</>}
              </div>
            </div>
            {data.mood && (
              <div style={{
                marginLeft:"auto", fontSize:12, fontWeight:700,
                color:C.violet,
                background:"rgba(139,92,246,.08)",
                padding:"4px 10px", borderRadius:99,
              }}>
                {MOODS.find(m=>m.k===data.mood)?.e} {MOODS.find(m=>m.k===data.mood)?.l}
              </div>
            )}
          </div>

          {/* Text */}
          {data.text && (
            <div style={{ padding:"10px 16px", fontSize:15, color:C.ink, lineHeight:1.55 }}>
              {data.text}
            </div>
          )}

          {/* Media */}
          {data.mediaPreview && (
            <div style={{ padding:"0 0 0 0" }}>
              {data.mediaType === "video"
                ? <video src={data.mediaPreview} controls style={{ width:"100%", display:"block", maxHeight:320, objectFit:"cover" }}/>
                : <img src={data.mediaPreview} alt="" style={{ width:"100%", display:"block", maxHeight:320, objectFit:"cover" }}/>
              }
            </div>
          )}

          {/* Reactions */}
          <div style={{
            padding:"12px 16px",
            display:"flex", alignItems:"center", gap:18,
            borderTop:"1px solid rgba(0,0,0,.05)",
          }}>
            {["❤️ Gefällt mir", "💬 Kommentieren", "↗️ Teilen"].map(a => (
              <button
                key={a}
                type="button"
                style={{
                  background:"none", border:"none",
                  fontSize:12.5, color:C.muted, fontWeight:600,
                  cursor:"default", padding:0,
                  fontFamily:"inherit",
                }}
              >{a}</button>
            ))}
          </div>
        </div>
      )}

      {/* Publish Button */}
      <div style={{ width:"100%", maxWidth:480, marginTop:24 }}>
        <button
          type="button"
          className="tf-tap"
          onClick={() => {
            console.log("FINAL_SHARE_CLICK");
            alert("FINAL_SHARE_CLICK");
            onPublish?.();
          }}
          disabled={publishing}
          style={{
            width:"100%", height:56, borderRadius:99,
            background: `linear-gradient(135deg,${C.teal} 0%,${C.violet} 100%)`,
            border:"none", color:"white",
            fontSize:18, fontWeight:800, letterSpacing:-.2,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow:"0 8px 28px rgba(139,92,246,.30)",
            animation: publishing ? "none" : "tf-pulse 3.6s ease-in-out infinite",
            cursor: publishing ? "default" : "pointer",
          }}
        >
          {publishing ? (
            <>
              <div style={{
                width:20, height:20, borderRadius:"50%",
                border:"2.5px solid rgba(255,255,255,.3)",
                borderTop:"2.5px solid white",
                animation:"tf-spin .7s linear infinite",
              }}/>
              Wird geteilt\u2026
            </>
          ) : (
            <>Teilen \u2728</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN ORCHESTRATOR
══════════════════════════════════════════════════════════════ */
export default function TeilenFlow({ onClose, onPublished, visible = true }) {
  const { user, profile } = useAuth();

  const [step,       setStep]       = useState(1);
  const [publishing,     setPublishing]     = useState(false);


  // ── Visible: Form reset beim Öffnen ─────────────────────────────────
  React.useEffect(() => {
    if (visible) {
      setStep(1);
      setForm({
        mode: null, mediaFile: null, mediaPreview: null,
        mediaType: null, text: "", location: "", mood: null,
      });
    }
  }, [visible]);


  const scrollRef = useRef(null);

  const [form, setForm] = useState({
    mode:         null,       // "feed" | "story"
    mediaFile:    null,
    mediaPreview: null,
    mediaType:    null,
    text:         "",
    location:     "",
    mood:         null,
  });

  function goTo(n) {
    setStep(n);
    scrollRef.current?.scrollTo({ top:0, behavior:"smooth" });
  }

  // ─── TEST INSERT (minimal, kein Upload, direkt in beitraege) ──────────────
  const handleTestInsert = useCallback(async () => {
    console.log("[HUI MOMENT] TEST INSERT start — user:", user?.id);
    if (!user?.id) {
      console.error("[HUI MOMENT] TEST INSERT ABORT — kein user.id");
      alert("Kein User eingeloggt. Bitte einloggen.");
      return;
    }
    const { data, error } = await supabase
      .from("beitraege")
      .insert({ user_id: user.id, type: "moment", caption: "debug" })
      .select("id")
      .single();
    if (error) {
      console.error("[HUI MOMENT] TEST INSERT error", { code: error.code, message: error.message });
      alert("DB ERROR: " + error.code + " — " + error.message);
    } else {
      console.log("[HUI MOMENT] TEST INSERT success", data?.id);
      alert("✅ Test Insert erfolgreich! id=" + data?.id);
    }
  }, [user?.id]);

  // ─── ECHTER PUBLISH FLOW ────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (window.__PUBLISHING__) return;
    window.__PUBLISHING__ = true;
    setPublishing(true);
    console.log("PUBLISH_START", { mode: form.mode, text: form.text?.slice(0,40) });

    try {
      // ── Session ────────────────────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error("PUBLISH_NO_SESSION");
        return;
      }

      // ── Upload (optional) ──────────────────────────────────────
      let src = null;
      if (form.mediaFile) {
        const ext  = form.mediaFile.name.split(".").pop();
        const path = `moments/${session.user.id}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("moments")
          .upload(path, form.mediaFile, { upsert: true });
        if (!uploadError) {
          const { data: pub } = supabase.storage.from("moments").getPublicUrl(path);
          src = pub?.publicUrl || null;
        } else {
          console.error("PUBLISH_UPLOAD_ERROR", uploadError);
        }
      }

      // ── Insert ─────────────────────────────────────────────────
      const payload = {
        user_id: session.user.id,
        type:    form.mode === "story" ? "note" : "moment",
        caption: form.text?.trim() || null,
        src,
      };
      console.log("PUBLISH_INSERT_PAYLOAD", payload);

      const { data, error: dbErr } = await supabase
        .from("beitraege")
        .insert(payload)
        .select();

      if (dbErr) {
        console.error("PUBLISH_INSERT_ERROR", dbErr.code, dbErr.message, dbErr.hint);
      } else {
        console.log("PUBLISH_SUCCESS", data?.[0]?.id);
      }

    } catch (err) {
      console.error("PUBLISH_EXCEPTION", err?.message);
    } finally {
      setPublishing(false);
      window.__PUBLISHING__ = false;
      console.log("PUBLISH_FINALLY_DONE");
    }

    // onPublished / onClose NACH finally — Flow bleibt bis hier offen
    onPublished?.({ mode: form.mode, refresh: true });
    onClose?.();
  }, [form, publishing, onClose, onPublished]);

  const STEP_META = {
    1: { emoji:"🌿", hint:"W\u00e4hle aus" },
    2: { emoji:"✨", hint:"Erstelle deinen Moment" },
    3: { emoji:"👁",  hint:"Alles bereit?" },
  };
  const meta = STEP_META[step];

  // ALWAYS MOUNTED — visible prop steuert Sichtbarkeit, kein Unmount
  if (!visible) return null;

  return (
    <div style={{
      position:"fixed", inset:0,
      zIndex:10100,   /* über BottomNav (9999) */
      background:C.bg,
      display:"flex", flexDirection:"column",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      animation:"tf-in .24s cubic-bezier(.22,1,.36,1) both",
      overflow:"clip",
    }}>
      <style>{CSS}</style>

      {/* ── TopBar ── */}
      <div style={{
        flexShrink:0,
        padding:"max(48px,env(safe-area-inset-top,48px)) 20px 14px",
        background:"rgba(248,247,252,.90)",
        backdropFilter:"blur(28px) saturate(1.5)",
        WebkitBackdropFilter:"blur(28px) saturate(1.5)",
        borderBottom:"1px solid rgba(139,92,246,.07)",
        position:"relative", zIndex:5,
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          {/* × */}
          <button
            type="button"
            className="tf-tap"
            onClick={() => {
              console.log("FLOW_CLOSE_TRIGGER", "X_BUTTON");
              alert("FLOW_CLOSE_TRIGGER: X_BUTTON");
              onClose?.();
            }}
            style={{
              width:36, height:36, borderRadius:"50%",
              background:"rgba(255,255,255,.80)",
              border:"1px solid rgba(0,0,0,.08)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color:C.muted,
            }}
          >×</button>

          {/* Title */}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:15.5, fontWeight:800, color:C.ink, letterSpacing:-.3 }}>
              <span style={{ marginRight:5 }}>{meta.emoji}</span>Teilen
            </div>
            <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>{meta.hint}</div>
          </div>

          {/* Zurück (Step 2+3) */}
          {step > 1 ? (
            <button
              type="button"
              className="tf-tap"
              onClick={() => goTo(step - 1)}
              style={{
                height:34, paddingInline:14, borderRadius:99,
                background:"rgba(255,255,255,.80)",
                border:"1px solid rgba(139,92,246,.16)",
                color:C.muted, fontSize:13.5, fontWeight:700,
              }}
            >\u2190</button>
          ) : (
            <div style={{ width:36 }}/>
          )}
        </div>

        <ProgressBar step={step}/>
      </div>

      {/* ── Content ── */}
      <div
        ref={scrollRef}
        key={step}
        style={{
          flex:1, display:"flex", flexDirection:"column",
          overflowY:"auto", overflowX:"hidden",
          paddingTop:20, paddingBottom:20,
          animation:"tf-in .26s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        {step === 1 && (
          <StepWhere
            value={form.mode}
            onSelect={m => setForm(f => ({ ...f, mode: m }))}
            onNext={() => goTo(2)}
          />
        )}
        {step === 2 && (
          <StepCreate
            mode={form.mode}
            data={form}
            onChange={setForm}
          />
        )}
        {step === 3 && (
          <>
            {/* ── DEBUG: TEST INSERT Button ── */}
            <div style={{
              padding:"12px 20px 0",
              display:"flex", justifyContent:"center",
            }}>
              <button
                onClick={handleTestInsert}
                style={{
                  height:36, paddingInline:18, borderRadius:99,
                  background:"rgba(239,68,68,0.12)",
                  border:"1.5px solid rgba(239,68,68,0.35)",
                  color:"rgba(239,68,68,0.9)",
                  fontSize:12, fontWeight:700, letterSpacing:0.3,
                  cursor:"pointer", fontFamily:"monospace",
                }}
              >
                🧪 TEST INSERT (Debug)
              </button>
            </div>
            <StepPreview
              mode={form.mode}
              data={form}
              profile={profile}
              onPublish={handlePublish}
              publishing={publishing}
            />
          </>
        )}
      </div>

      {/* ── Floating Next (Step 2 only) ── */}
      {step === 2 && (
        <div style={{
          flexShrink:0,
          padding:"12px 20px max(20px,env(safe-area-inset-bottom,20px))",
          background:"rgba(248,247,252,.88)",
          backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
          borderTop:"1px solid rgba(139,92,246,.07)",
        }}>
          <button
            type="button"
            className="tf-tap"
            onClick={() => goTo(3)}
            style={{
              width:"100%", height:50, borderRadius:99,
              background:`linear-gradient(135deg,${C.violet} 0%,${C.violet2} 100%)`,
              border:"none", color:"white",
              fontSize:16, fontWeight:800, letterSpacing:-.2,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow:"0 6px 20px rgba(139,92,246,.28)",
              animation:"tf-pulse 3.6s ease-in-out infinite",
            }}
          >
            Vorschau ansehen\u00a0\u00a0<span style={{fontSize:18}}>→</span>
          </button>
        </div>
      )}

         {/* ── BLOCKING DEBUG OVERLAY — fixiert, zIndex über allem ────────── */}

   {/* ── DEBUG PANEL: Post-Insert beitraege Rows ──────────────── */}
    </div>
  );
}

// HuiCreateFlow.jsx — Progressive Creation v2
// Philosophie: „Teile deinen Moment." Nicht: „Konfiguriere dein Angebot."
//
// FLOW:
//   Screen 1 „Moment"     — Ultra-light: Media + Caption + Teilen
//   Screen 2 „Suggestion" — HUI denkt mit: Smart Type Suggestion
//   Screen 3 „Vertiefen"  — Optional: Werk oder Erlebnis konfigurieren
//   Screen 4 „Done"       — Warm, ruhig, bestätigend
//
// Alle Datenmodelle (works, experiences, stories, mood_tags etc.) bleiben
// vollständig erhalten — sie sind nur in Phase 3 / Collapse-Sektionen.

import React, { useState, useRef, useCallback, useEffect } from "react";
import { supabase }  from "../lib/supabaseClient";
import { useAuth }   from "../lib/AuthContext";
import {
  MOOD_TAG_OPTIONS, ENERGY_LEVELS, SOCIAL_ENERGY_OPTIONS
} from "../lib/moodUtils";

/* ── Tokens ─────────────────────────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7",
  coral:"#FF8A6B", gold:"#F5A623", purple:"#A78BFA",
  cream:"#F9F7F4", ink:"#1A1A1A", ink2:"#3A3A3A", ink3:"#5A5A5A",
  muted:"rgba(60,60,60,0.50)", border:"rgba(0,0,0,0.07)",
};

/* ── Config (unverändert) ────────────────────────────────────────── */
const WERK_CATS  = ["Kunst","Musik","Fotografie","Design","Handwerk","Mode","Digital","Sonstiges"];
const ERLE_CATS  = ["Workshop","Coaching","Kunstkurs","Musikunterricht","Tour","Yoga","Healing","Kreativsession"];
const PRICE_ARTS = [
  {value:"stunde",  label:"pro Stunde"},
  {value:"session", label:"pro Session"},
  {value:"tag",     label:"pro Tag"},
  {value:"fest",    label:"Festpreis"},
];
const LANGS = ["Deutsch","Englisch","Französisch","Spanisch","Andere"];

/* ── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes hcf2-up {
    from { opacity:0; transform:translateY(24px) scale(0.98); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes hcf2-fade  { from{opacity:0} to{opacity:1} }
  @keyframes hcf2-slide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
  @keyframes hcf2-spin  { to{transform:rotate(360deg)} }
  @keyframes hcf2-pop   {
    0%  { transform:scale(0.75) rotate(-8deg); opacity:0; }
    65% { transform:scale(1.08) rotate(2deg);  opacity:1; }
    100%{ transform:scale(1)    rotate(0);     opacity:1; }
  }
  @keyframes hcf2-pulse {
    0%,100% { opacity:1; }
    50%      { opacity:0.55; }
  }

  .hcf2-sheet {
    height:100%; display:flex; flex-direction:column; overflow:hidden;
  }
  .hcf2-scroll {
    -ms-overflow-style:none; scrollbar-width:none;
    overflow-y:auto; -webkit-overflow-scrolling:touch;
  }
  .hcf2-scroll::-webkit-scrollbar { display:none; }
  .hcf2-tap  { -webkit-tap-highlight-color:transparent; cursor:pointer; }
  .hcf2-tap:active { opacity:0.72; transition:opacity .1s; }

  .hcf2-input {
    width:100%; padding:0; margin:0;
    background:none; border:none; outline:none;
    font-family:inherit; font-size:15px; font-weight:400;
    color:#1A1A1A; line-height:1.55; resize:none;
    -webkit-appearance:none; box-sizing:border-box;
    caret-color:#16D7C5;
  }
  .hcf2-input::placeholder { color:rgba(120,120,120,0.65); }

  .hcf2-field {
    background:rgba(0,0,0,0.032);
    border:1.5px solid rgba(0,0,0,0.075);
    border-radius:16px; padding:14px 16px;
    transition:border-color .2s ease;
  }
  .hcf2-field:focus-within { border-color:#16D7C5; }

  .hcf2-field-label {
    font-size:10.5px; font-weight:700; color:rgba(60,60,60,0.45);
    letter-spacing:0.6px; text-transform:uppercase;
    margin-bottom:5px; line-height:1;
  }

  .hcf2-pill-row { display:flex; flex-wrap:wrap; gap:7px; }
  .hcf2-pill {
    padding:7px 14px; border-radius:999px; border:1.5px solid;
    font-size:13px; font-weight:600; font-family:inherit;
    cursor:pointer; -webkit-tap-highlight-color:transparent;
    transition:all .18s ease; background:none;
    white-space:nowrap;
  }

  .hcf2-toggle {
    display:flex; align-items:center; gap:12px;
    padding:13px 16px; border-radius:14px;
    border:1.5px solid; width:100%;
    font-family:inherit; cursor:pointer;
    -webkit-tap-highlight-color:transparent;
    background:none; text-align:left;
    transition:all .2s ease;
  }

  .hcf2-section {
    border-radius:18px; overflow:hidden;
    border:1.5px solid rgba(0,0,0,0.07);
    background:rgba(255,255,255,0.7);
    margin-bottom:14px;
  }
  .hcf2-section-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 16px; cursor:pointer;
    -webkit-tap-highlight-color:transparent;
    background:none; border:none; width:100%;
    font-family:inherit; transition:background .18s;
  }
  .hcf2-section-header:active { background:rgba(0,0,0,0.04); }
  .hcf2-section-body { padding:0 16px 16px; }

  .hcf2-publish-btn {
    width:100%; padding:16px; border-radius:18px; border:none;
    font-family:inherit; font-size:16px; font-weight:800;
    cursor:pointer; -webkit-tap-highlight-color:transparent;
    letter-spacing:-0.2px; transition:all .25s ease;
  }
  .hcf2-publish-btn:active { transform:scale(0.97); }

  .hcf2-type-card {
    flex:1; padding:18px 14px; border-radius:20px;
    border:2px solid transparent; cursor:pointer;
    -webkit-tap-highlight-color:transparent;
    display:flex; flex-direction:column; align-items:center; gap:10px;
    transition:all .22s cubic-bezier(0.34,1.3,0.64,1);
    background:rgba(0,0,0,0.03);
    font-family:inherit;
  }
  .hcf2-type-card:active { transform:scale(0.94); }

  @media (prefers-reduced-motion:no-preference) {
    .hcf2-animate { animation:hcf2-up .32s cubic-bezier(0.34,1.2,0.64,1) both; }
    .hcf2-animate-fade { animation:hcf2-fade .25s ease both; }
    .hcf2-animate-slide { animation:hcf2-slide .28s cubic-bezier(0.34,1.2,0.64,1) both; }
  }
`;

/* ── Kleine Hilfs-Komponenten ────────────────────────────────────── */

function Pill({ label, selected, color, onClick }) {
  return (
    <button className="hcf2-pill" onClick={onClick}
      style={{
        borderColor: selected ? color : "rgba(0,0,0,0.10)",
        color:       selected ? color : "rgba(60,60,60,0.65)",
        background:  selected ? `${color}12` : "none",
      }}>
      {label}
    </button>
  );
}

function Toggle({ checked, onChange, label, sublabel, color = C.teal }) {
  return (
    <button className="hcf2-toggle" onClick={() => onChange(!checked)}
      style={{
        borderColor: checked ? `${color}44` : "rgba(0,0,0,0.08)",
        background:  checked ? `${color}0E` : "rgba(0,0,0,0.025)",
      }}>
      <div style={{
        width:22, height:22, borderRadius:7, flexShrink:0,
        background: checked ? `linear-gradient(135deg,${color},${color}cc)` : "rgba(0,0,0,0.07)",
        border: checked ? "none" : "1.5px solid rgba(0,0,0,0.13)",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: checked ? `0 2px 10px ${color}44` : "none",
        transition:"all .2s",
      }}>
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1" stroke="white"
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ textAlign:"left", flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{sublabel}</div>
        )}
      </div>
    </button>
  );
}

// Aufklappbare Sektion (für optionale Felder)
function CollapseSection({ title, icon, defaultOpen = false, children, accent = C.teal }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="hcf2-section">
      <button className="hcf2-section-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:17 }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.ink2 }}>{title}</span>
        </div>
        <div style={{
          width:24, height:24, borderRadius:"50%",
          background:open ? `${accent}18` : "rgba(0,0,0,0.05)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .22s ease",
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d={open ? "M2 8L6 4L10 8" : "M2 4L6 8L10 4"}
              stroke={open ? accent : "rgba(0,0,0,0.4)"}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      {open && (
        <div className="hcf2-section-body hcf2-animate-fade">
          {children}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 1 — MOMENT
   Ultra-light: Media + Caption + Teilen
   Keine Kategorien, keine Preise, keine Konfiguration
══════════════════════════════════════════════════════════════════ */
function ScreenMoment({ onClose, onNext }) {
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [isVid,     setIsVid]     = useState(false);
  const [caption,   setCaption]   = useState("");
  const [location,  setLocation]  = useState("");
  const [showLoc,   setShowLoc]   = useState(false);
  const [visibility,setVisibility]= useState("public");
  const [showVis,   setShowVis]   = useState(false);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setIsVid(f.type.startsWith("video"));
    setPreview(URL.createObjectURL(f));
    // Focus caption after short delay
    setTimeout(() => textRef.current?.focus(), 280);
  }

  function handleNext() {
    onNext({ file, preview, isVid, caption, location, visibility });
  }

  const canPost = !!file;

  return (
    <div className="hcf2-sheet">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onClose} className="hcf2-tap" style={{
          background:"none", border:"none", padding:6,
          borderRadius:"50%", display:"flex",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M1 1L19 19M19 1L1 19"
              stroke={C.ink} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <span style={{
          fontWeight:800, fontSize:16.5, color:C.ink,
          letterSpacing:-.3,
        }}>Teilen</span>

        <div style={{ width:32 }}/>  {/* balance spacer */}
      </div>

      {/* ── Scrollbarer Inhalt ── */}
      <div className="hcf2-scroll" style={{ flex:1, padding:"0 18px" }}>

        {/* Media Fläche */}
        <div
          className="hcf2-tap hcf2-animate"
          onClick={() => fileRef.current?.click()}
          style={{
            width:"100%",
            aspectRatio: preview ? "1/1" : "4/3",
            borderRadius:22,
            overflow:"hidden",
            background: preview
              ? "transparent"
              : `linear-gradient(145deg, rgba(22,215,197,0.08) 0%, rgba(255,138,107,0.06) 100%)`,
            border: preview
              ? "none"
              : "2px dashed rgba(22,215,197,0.30)",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:12,
            marginBottom:18,
            position:"relative",
            cursor:"pointer",
            transition:"all .25s ease",
          }}>
          {preview ? (
            isVid
              ? <video src={preview} style={{
                  width:"100%", height:"100%", objectFit:"cover",
                }} muted playsInline/>
              : <img src={preview} alt="preview" style={{
                  width:"100%", height:"100%", objectFit:"cover",
                }}/>
          ) : (
            <>
              <div style={{
                width:56, height:56, borderRadius:"50%",
                background:"rgba(22,215,197,0.10)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="4"
                    stroke={C.teal} strokeWidth="1.8"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill={C.teal}/>
                  <path d="M3 15L8 10L12 14L16 10L21 15"
                    stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.ink2 }}>
                  Foto oder Video
                </div>
                <div style={{ fontSize:12.5, color:C.muted, marginTop:3 }}>
                  Tippe um auszuwählen
                </div>
              </div>
            </>
          )}

          {/* Change overlay wenn preview */}
          {preview && (
            <div style={{
              position:"absolute", bottom:10, right:10,
              background:"rgba(0,0,0,0.48)",
              backdropFilter:"blur(12px)",
              borderRadius:20, padding:"5px 12px",
              color:"white", fontSize:11.5, fontWeight:700,
            }}>
              Ändern
            </div>
          )}
        </div>

        <input ref={fileRef} type="file"
          accept="image/*,video/*" style={{ display:"none" }}
          onChange={e => pickFile(e.target.files?.[0])}/>

        {/* Caption */}
        <div className="hcf2-field hcf2-animate" style={{
          animationDelay:"0.05s", marginBottom:12,
        }}>
          <textarea
            ref={textRef}
            className="hcf2-input"
            rows={3}
            placeholder="Was bewegt dich heute? ✨"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
        </div>

        {/* Optionale Felder — sehr subtil */}
        <div className="hcf2-animate" style={{ animationDelay:"0.10s" }}>
          <div style={{
            display:"flex", gap:8, marginBottom:14, flexWrap:"wrap",
          }}>
            {/* Ort-Toggle */}
            <button
              className="hcf2-tap"
              onClick={() => setShowLoc(l => !l)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:999,
                background: showLoc ? "rgba(22,215,197,0.10)" : "rgba(0,0,0,0.04)",
                border:`1.5px solid ${showLoc ? C.teal+"44" : "rgba(0,0,0,0.09)"}`,
                color: showLoc ? C.teal : C.muted,
                fontSize:13, fontWeight:600, fontFamily:"inherit",
                transition:"all .18s",
              }}>
              <span style={{ fontSize:14 }}>📍</span>
              <span>Ort</span>
            </button>

            {/* Sichtbarkeit */}
            <button
              className="hcf2-tap"
              onClick={() => setShowVis(v => !v)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:999,
                background: showVis ? "rgba(167,139,250,0.10)" : "rgba(0,0,0,0.04)",
                border:`1.5px solid ${showVis ? C.purple+"44" : "rgba(0,0,0,0.09)"}`,
                color: showVis ? C.purple : C.muted,
                fontSize:13, fontWeight:600, fontFamily:"inherit",
                transition:"all .18s",
              }}>
              <span style={{ fontSize:14 }}>
                {visibility === "public" ? "🌍" : visibility === "followers" ? "👥" : "🔒"}
              </span>
              <span>
                {visibility === "public" ? "Öffentlich"
                  : visibility === "followers" ? "Follower"
                  : "Privat"}
              </span>
            </button>
          </div>

          {/* Ort-Eingabe */}
          {showLoc && (
            <div className="hcf2-field hcf2-animate-fade" style={{ marginBottom:10 }}>
              <div className="hcf2-field-label">Ort</div>
              <input
                className="hcf2-input"
                placeholder="Stadt, Ort oder Adresse"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
          )}

          {/* Sichtbarkeit-Chips */}
          {showVis && (
            <div className="hcf2-pill-row hcf2-animate-fade" style={{ marginBottom:12 }}>
              {[
                { v:"public",    label:"🌍 Alle" },
                { v:"followers", label:"👥 Follower" },
                { v:"private",   label:"🔒 Nur ich" },
              ].map(o => (
                <Pill key={o.v}
                  label={o.label}
                  selected={visibility === o.v}
                  color={C.purple}
                  onClick={() => setVisibility(o.v)}/>
              ))}
            </div>
          )}
        </div>

        {/* Bottom spacer */}
        <div style={{ height:24 }}/>
      </div>

      {/* ── Publish Button ── */}
      <div style={{ padding:"12px 18px 18px", flexShrink:0 }}>
        <button
          className="hcf2-publish-btn"
          disabled={!canPost}
          onClick={handleNext}
          style={{
            background: canPost
              ? `linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 45%, ${C.coral} 100%)`
              : "rgba(0,0,0,0.07)",
            color:      canPost ? "white" : "rgba(120,120,120,0.7)",
            boxShadow:  canPost ? "0 4px 22px rgba(22,215,197,0.32)" : "none",
          }}>
          {canPost ? "Teilen ✦" : "Foto oder Video wählen"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 2 — SUGGESTION
   HUI denkt mit. Sanfte Suggestions, keine harte Entscheidung.
══════════════════════════════════════════════════════════════════ */
function ScreenSuggestion({ media, onBack, onPublishDirect, onDeepen }) {
  // Einfache Heuristik: kein echter AI-Call — rule-based aus Dateiname/Typ
  const suggestion = media.isVid ? "story" : "moment";  // erweiterbar

  const TYPES = [
    {
      key:     "moment",
      emoji:   "✨",
      title:   "Moment",
      sub:     "Einfach teilen — kein Aufwand",
      color:   C.teal,
      action:  "Jetzt teilen",
      direct:  true,
    },
    {
      key:     "werk",
      emoji:   "🎨",
      title:   "Werk",
      sub:     "Etwas das du verkaufst oder zeigst",
      color:   C.coral,
      action:  "Als Werk",
      direct:  false,
    },
    {
      key:     "erlebnis",
      emoji:   "🌟",
      title:   "Erlebnis",
      sub:     "Workshop, Session oder Event",
      color:   C.purple,
      action:  "Als Erlebnis",
      direct:  false,
    },
  ];

  return (
    <div className="hcf2-sheet hcf2-animate">
      <style>{CSS}</style>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"16px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onBack} className="hcf2-tap" style={{
          background:"none", border:"none", padding:6,
          display:"flex", alignItems:"center",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 3L6 10L13 17"
              stroke={C.ink} strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:C.ink, letterSpacing:-.3 }}>
            Was soll daraus werden?
          </div>
          <div style={{ fontSize:12.5, color:C.muted, marginTop:1 }}>
            Du kannst das später noch ändern
          </div>
        </div>
      </div>

      {/* Preview Thumbnail */}
      <div style={{
        margin:"0 18px 18px",
        height:140, borderRadius:18, overflow:"hidden", flexShrink:0,
        position:"relative",
      }}>
        {media.isVid
          ? <video src={media.preview}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              muted playsInline/>
          : <img src={media.preview} alt="preview"
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        }
        {media.caption && (
          <div style={{
            position:"absolute", bottom:10, left:12, right:12,
            background:"rgba(0,0,0,0.52)", backdropFilter:"blur(12px)",
            borderRadius:12, padding:"7px 12px",
            color:"white", fontSize:13, fontWeight:500, lineHeight:1.4,
          }}>{media.caption}</div>
        )}
      </div>

      {/* Type Cards */}
      <div className="hcf2-scroll" style={{ flex:1, padding:"0 18px" }}>
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {TYPES.map((t, idx) => (
            <button
              key={t.key}
              className="hcf2-type-card hcf2-animate"
              style={{
                animationDelay:`${idx * 0.06}s`,
                border:`2px solid ${t.color}28`,
                background:`linear-gradient(145deg, ${t.color}08 0%, ${t.color}04 100%)`,
              }}
              onClick={() => t.direct
                ? onPublishDirect({ type: t.key })
                : onDeepen(t.key)
              }>
              <div style={{
                fontSize:28,
                animation: suggestion === t.key ? "hcf2-pop .5s cubic-bezier(0.34,1.4,0.64,1) .2s both" : "none",
              }}>{t.emoji}</div>
              <div style={{ fontSize:13, fontWeight:800, color:C.ink, letterSpacing:-.1 }}>
                {t.title}
              </div>
              <div style={{ fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.4 }}>
                {t.sub}
              </div>
              <div style={{
                marginTop:2,
                padding:"6px 10px", borderRadius:999,
                background:`${t.color}14`,
                border:`1.5px solid ${t.color}30`,
                fontSize:11.5, fontWeight:700, color:t.color,
              }}>
                {t.action}
              </div>
            </button>
          ))}
        </div>

        {/* Hinweis */}
        <div style={{
          textAlign:"center", fontSize:12, color:"rgba(120,120,120,0.65)",
          padding:"0 8px 24px",
        }}>
          Werk und Erlebnis haben noch ein paar Felder mehr
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 3 — WERK DETAILS
   Progressive — erst das Minimum, alles weitere aufklappbar
══════════════════════════════════════════════════════════════════ */
function ScreenWerk({ media, onBack, onPublish, loading, error }) {
  const [title,    setTitle]    = useState("");
  const [price,    setPrice]    = useState("");
  const [forSale,  setForSale]  = useState(true);
  // Optionale Felder
  const [desc,     setDesc]     = useState(media.caption || "");
  const [cat,      setCat]      = useState("");
  const [qty,      setQty]      = useState("1");
  const [shipping, setShipping] = useState(false);
  const [pickup,   setPickup]   = useState(false);
  const [delivery, setDelivery] = useState("");
  // Mood (optional — in CollapseSection)
  const [moodTags, setMoodTags]     = useState([]);
  const [energy,   setEnergy]       = useState(null);
  const [social,   setSocial]       = useState(null);

  function toggleMood(k) {
    setMoodTags(p => p.includes(k) ? p.filter(x=>x!==k) : [...p, k]);
  }

  function handlePublish() {
    onPublish({
      type:    "werk",
      details: { caption:desc, location:"", visibility:media.visibility,
                 moodTags, energyLevel:energy, socialEnergy:social },
      werkData:{
        title,
        desc,
        price: forSale ? (parseFloat(price)||null) : null,
        quantity: parseInt(qty,10)||1,
        shipping, pickup,
        deliveryTime: delivery||null,
        category: cat||null,
        onlyShow: !forSale,
      },
    });
  }

  const canPublish = title.trim().length > 0;

  return (
    <div className="hcf2-sheet hcf2-animate">
      <style>{CSS}</style>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"16px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onBack} className="hcf2-tap" style={{
          background:"none", border:"none", padding:6, display:"flex",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 3L6 10L13 17"
              stroke={C.ink} strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:C.ink, letterSpacing:-.3 }}>
            🎨 Dein Werk
          </div>
          <div style={{ fontSize:12.5, color:C.muted, marginTop:1 }}>
            Nur der Titel ist Pflicht
          </div>
        </div>
      </div>

      <div className="hcf2-scroll" style={{ flex:1, padding:"0 18px" }}>

        {/* Thumbnail */}
        <div style={{
          height:110, borderRadius:16, overflow:"hidden", marginBottom:18,
        }}>
          <img src={media.preview} alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        </div>

        {/* Pflichtfelder */}
        <div className="hcf2-field" style={{ marginBottom:12 }}>
          <div className="hcf2-field-label">Titel *</div>
          <input className="hcf2-input"
            placeholder="Wie heißt dein Werk?"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <Toggle
          checked={forSale}
          onChange={setForSale}
          label="Zu verkaufen"
          sublabel="Preis festlegen und Bestellungen erlauben"
          color={C.teal}
        />

        {forSale && (
          <div className="hcf2-field hcf2-animate-fade" style={{ marginTop:10, marginBottom:0 }}>
            <div className="hcf2-field-label">Preis (€)</div>
            <input className="hcf2-input"
              type="number" inputMode="decimal" placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>
        )}

        {/* Optionale Sektionen */}
        <div style={{ marginTop:18 }}>

          <CollapseSection title="Beschreibung & Kategorie" icon="✍️" accent={C.teal}>
            <div className="hcf2-field" style={{ marginBottom:12 }}>
              <textarea className="hcf2-input" rows={3}
                placeholder="Beschreibe dein Werk..."
                value={desc}
                onChange={e => setDesc(e.target.value)}/>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8,
              textTransform:"uppercase", letterSpacing:0.5 }}>Kategorie</div>
            <div className="hcf2-pill-row">
              {WERK_CATS.map(c => (
                <Pill key={c} label={c} selected={cat===c} color={C.teal}
                  onClick={() => setCat(c===cat ? "" : c)}/>
              ))}
            </div>
          </CollapseSection>

          {forSale && (
            <CollapseSection title="Versand & Abholung" icon="📦" accent={C.coral}>
              <div className="hcf2-field" style={{ marginBottom:12 }}>
                <div className="hcf2-field-label">Menge</div>
                <input className="hcf2-input" type="number" inputMode="numeric"
                  placeholder="1" value={qty}
                  onChange={e => setQty(e.target.value)}/>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Toggle checked={shipping} onChange={setShipping}
                  label="Versand möglich" color={C.coral}/>
                <Toggle checked={pickup} onChange={setPickup}
                  label="Abholung möglich" color={C.coral}/>
              </div>
              {(shipping || pickup) && (
                <div className="hcf2-field hcf2-animate-fade" style={{ marginTop:10 }}>
                  <div className="hcf2-field-label">Lieferzeit</div>
                  <input className="hcf2-input" placeholder="z.B. 3–5 Werktage"
                    value={delivery}
                    onChange={e => setDelivery(e.target.value)}/>
                </div>
              )}
            </CollapseSection>
          )}

          <CollapseSection title="Atmosphäre & Stimmung" icon="🌊" accent={C.purple}>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8,
                textTransform:"uppercase", letterSpacing:0.5 }}>Mood Tags</div>
              <div className="hcf2-pill-row">
                {(MOOD_TAG_OPTIONS||[]).slice(0,10).map(m => (
                  <Pill key={m.value||m} label={m.label||m}
                    selected={moodTags.includes(m.value||m)}
                    color={C.purple}
                    onClick={() => toggleMood(m.value||m)}/>
                ))}
              </div>
            </div>
            {ENERGY_LEVELS?.length > 0 && (
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8,
                  textTransform:"uppercase", letterSpacing:0.5 }}>Energie</div>
                <div className="hcf2-pill-row">
                  {ENERGY_LEVELS.map(e => (
                    <Pill key={e.value||e} label={e.label||e}
                      selected={energy===(e.value||e)}
                      color={C.gold}
                      onClick={() => setEnergy(p => p===(e.value||e) ? null : (e.value||e))}/>
                  ))}
                </div>
              </div>
            )}
          </CollapseSection>

        </div>

        {error && (
          <div style={{
            background:"rgba(255,80,80,0.08)", border:"1px solid rgba(255,80,80,0.18)",
            borderRadius:12, padding:"11px 14px", marginBottom:12,
            fontSize:13, color:"#C53030",
          }}>{error}</div>
        )}

        <div style={{ height:24 }}/>
      </div>

      {/* Publish */}
      <div style={{ padding:"12px 18px 18px", flexShrink:0 }}>
        <button
          className="hcf2-publish-btn"
          disabled={!canPublish || loading}
          onClick={handlePublish}
          style={{
            background: canPublish && !loading
              ? `linear-gradient(135deg, ${C.coral} 0%, ${C.gold} 100%)`
              : "rgba(0,0,0,0.07)",
            color: canPublish && !loading ? "white" : "rgba(120,120,120,0.7)",
            boxShadow: canPublish && !loading ? "0 4px 22px rgba(255,138,107,0.32)" : "none",
          }}>
          {loading
            ? <span style={{ animation:"hcf2-pulse 1s ease infinite" }}>Wird veröffentlicht…</span>
            : "Werk veröffentlichen 🎨"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 4 — ERLEBNIS DETAILS
══════════════════════════════════════════════════════════════════ */
function ScreenErlebnis({ media, onBack, onPublish, loading, error }) {
  const [title,   setTitle]   = useState("");
  const [price,   setPrice]   = useState("");
  const [priceArt,setPriceArt]= useState("session");
  const [format,  setFormat]  = useState("online");
  // Optionale Felder
  const [desc,    setDesc]    = useState(media.caption || "");
  const [loc,     setLoc]     = useState(media.location || "");
  const [duration,setDuration]= useState("");
  const [days,    setDays]    = useState("");
  const [maxPax,  setMaxPax]  = useState("");
  const [cat,     setCat]     = useState("");
  const [lang,    setLang]    = useState("Deutsch");
  const [moodTags,setMoodTags]= useState([]);
  const [energy,  setEnergy]  = useState(null);
  const [social,  setSocial]  = useState(null);

  function toggleMood(k) {
    setMoodTags(p => p.includes(k) ? p.filter(x=>x!==k) : [...p, k]);
  }

  function handlePublish() {
    onPublish({
      type: "erlebnis",
      details:{ caption:desc, location:loc, visibility:media.visibility,
                moodTags, energyLevel:energy, socialEnergy:social },
      erlData:{
        title,
        desc,
        price: parseFloat(price)||null,
        priceType: priceArt,
        format,
        location: loc||null,
        duration: duration||null,
        days:     days||null,
        maxPax:   maxPax||null,
        category: cat||null,
        language: lang,
      },
    });
  }

  const canPublish = title.trim().length > 0;

  return (
    <div className="hcf2-sheet hcf2-animate">
      <style>{CSS}</style>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"16px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onBack} className="hcf2-tap" style={{
          background:"none", border:"none", padding:6, display:"flex",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 3L6 10L13 17"
              stroke={C.ink} strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:C.ink, letterSpacing:-.3 }}>
            🌟 Dein Erlebnis
          </div>
          <div style={{ fontSize:12.5, color:C.muted, marginTop:1 }}>
            Nur Titel & Format sind Pflicht
          </div>
        </div>
      </div>

      <div className="hcf2-scroll" style={{ flex:1, padding:"0 18px" }}>

        {/* Thumbnail */}
        <div style={{ height:110, borderRadius:16, overflow:"hidden", marginBottom:18 }}>
          <img src={media.preview} alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        </div>

        {/* Pflichtfelder */}
        <div className="hcf2-field" style={{ marginBottom:12 }}>
          <div className="hcf2-field-label">Titel *</div>
          <input className="hcf2-input"
            placeholder="Wie heißt dein Erlebnis?"
            value={title}
            onChange={e => setTitle(e.target.value)}/>
        </div>

        {/* Format */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8,
            textTransform:"uppercase", letterSpacing:0.5 }}>Format</div>
          <div className="hcf2-pill-row">
            {[
              { v:"online",   l:"💻 Online" },
              { v:"vor-ort",  l:"📍 Vor Ort" },
              { v:"hybrid",   l:"🔀 Hybrid" },
            ].map(o => (
              <Pill key={o.v} label={o.l} selected={format===o.v}
                color={C.purple}
                onClick={() => setFormat(o.v)}/>
            ))}
          </div>
        </div>

        {/* Preis */}
        <div style={{ display:"flex", gap:10, marginBottom:18 }}>
          <div className="hcf2-field" style={{ flex:1 }}>
            <div className="hcf2-field-label">Preis (€)</div>
            <input className="hcf2-input" type="number"
              inputMode="decimal" placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}/>
          </div>
          <div className="hcf2-field" style={{ flex:1 }}>
            <div className="hcf2-field-label">Art</div>
            <select className="hcf2-input"
              value={priceArt}
              onChange={e => setPriceArt(e.target.value)}
              style={{ appearance:"none", WebkitAppearance:"none" }}>
              {PRICE_ARTS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Optionale Sektionen */}
        <CollapseSection title="Beschreibung & Kategorie" icon="✍️" accent={C.purple}>
          <div className="hcf2-field" style={{ marginBottom:12 }}>
            <textarea className="hcf2-input" rows={3}
              placeholder="Was erwartet die Teilnehmer?"
              value={desc}
              onChange={e => setDesc(e.target.value)}/>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8,
            textTransform:"uppercase", letterSpacing:0.5 }}>Kategorie</div>
          <div className="hcf2-pill-row">
            {ERLE_CATS.map(c => (
              <Pill key={c} label={c} selected={cat===c} color={C.purple}
                onClick={() => setCat(c===cat?"":c)}/>
            ))}
          </div>
        </CollapseSection>

        <CollapseSection title="Ort, Dauer & Teilnehmer" icon="📅" accent={C.coral}>
          {(format==="vor-ort"||format==="hybrid") && (
            <div className="hcf2-field" style={{ marginBottom:12 }}>
              <div className="hcf2-field-label">Ort</div>
              <input className="hcf2-input" placeholder="Adresse oder Beschreibung"
                value={loc} onChange={e => setLoc(e.target.value)}/>
            </div>
          )}
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <div className="hcf2-field" style={{ flex:1 }}>
              <div className="hcf2-field-label">Dauer</div>
              <input className="hcf2-input" placeholder="z.B. 2h"
                value={duration} onChange={e => setDuration(e.target.value)}/>
            </div>
            <div className="hcf2-field" style={{ flex:1 }}>
              <div className="hcf2-field-label">Max. Teilnehmer</div>
              <input className="hcf2-input" type="number" inputMode="numeric"
                placeholder="∞"
                value={maxPax} onChange={e => setMaxPax(e.target.value)}/>
            </div>
          </div>
          <div className="hcf2-field">
            <div className="hcf2-field-label">Verfügbare Tage</div>
            <input className="hcf2-input" placeholder="z.B. Mo–Fr, Wochenende"
              value={days} onChange={e => setDays(e.target.value)}/>
          </div>
        </CollapseSection>

        <CollapseSection title="Sprache" icon="🗣️" accent={C.teal}>
          <div className="hcf2-pill-row">
            {LANGS.map(l => (
              <Pill key={l} label={l} selected={lang===l} color={C.teal}
                onClick={() => setLang(l)}/>
            ))}
          </div>
        </CollapseSection>

        <CollapseSection title="Atmosphäre & Stimmung" icon="🌊" accent={C.purple}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8,
              textTransform:"uppercase", letterSpacing:0.5 }}>Mood Tags</div>
            <div className="hcf2-pill-row">
              {(MOOD_TAG_OPTIONS||[]).slice(0,10).map(m => (
                <Pill key={m.value||m} label={m.label||m}
                  selected={moodTags.includes(m.value||m)}
                  color={C.purple}
                  onClick={() => toggleMood(m.value||m)}/>
              ))}
            </div>
          </div>
          {SOCIAL_ENERGY_OPTIONS?.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8,
                textTransform:"uppercase", letterSpacing:0.5 }}>Soziale Energie</div>
              <div className="hcf2-pill-row">
                {SOCIAL_ENERGY_OPTIONS.map(s => (
                  <Pill key={s.value||s} label={s.label||s}
                    selected={social===(s.value||s)}
                    color={C.coral}
                    onClick={() => setSocial(p => p===(s.value||s) ? null : (s.value||s))}/>
                ))}
              </div>
            </div>
          )}
        </CollapseSection>

        {error && (
          <div style={{
            background:"rgba(255,80,80,0.08)", border:"1px solid rgba(255,80,80,0.18)",
            borderRadius:12, padding:"11px 14px", marginBottom:12,
            fontSize:13, color:"#C53030",
          }}>{error}</div>
        )}
        <div style={{ height:24 }}/>
      </div>

      {/* Publish */}
      <div style={{ padding:"12px 18px 18px", flexShrink:0 }}>
        <button
          className="hcf2-publish-btn"
          disabled={!canPublish || loading}
          onClick={handlePublish}
          style={{
            background: canPublish && !loading
              ? `linear-gradient(135deg, ${C.purple} 0%, #F472B6 100%)`
              : "rgba(0,0,0,0.07)",
            color: canPublish && !loading ? "white" : "rgba(120,120,120,0.7)",
            boxShadow: canPublish && !loading ? "0 4px 22px rgba(167,139,250,0.32)" : "none",
          }}>
          {loading
            ? <span style={{ animation:"hcf2-pulse 1s ease infinite" }}>Wird veröffentlicht…</span>
            : "Erlebnis veröffentlichen 🌟"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 5 — DONE
══════════════════════════════════════════════════════════════════ */
function ScreenDone({ type }) {
  const MAP = {
    moment:   { emoji:"✨", title:"Geteilt!", sub:"Dein Moment ist jetzt live." },
    werk:     { emoji:"🎨", title:"Werk live!", sub:"Andere können es jetzt entdecken." },
    erlebnis: { emoji:"🌟", title:"Erlebnis live!", sub:"Buchungen können jetzt eingehen." },
  };
  const d = MAP[type] || MAP.moment;

  return (
    <div style={{
      height:"100%", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:32,
      background:"linear-gradient(160deg,#F0FAF9 0%,#FFF9F4 100%)",
    }}>
      <style>{CSS}</style>
      <div style={{ animation:"hcf2-pop .55s cubic-bezier(0.34,1.4,0.64,1) both", fontSize:64, marginBottom:20 }}>
        {d.emoji}
      </div>
      <div style={{ fontSize:22, fontWeight:900, color:C.ink, letterSpacing:-.5, marginBottom:8 }}>
        {d.title}
      </div>
      <div style={{ fontSize:14.5, color:C.muted, textAlign:"center", lineHeight:1.6 }}>
        {d.sub}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT — CONTROLLER
   handlePublish: EXAKT gleich wie vorher — kein Datenmodell-Break
══════════════════════════════════════════════════════════════════ */
export default function HuiCreateFlow({ onClose, onSuccess }) {
  const { user } = useAuth();

  // Screen: "moment" | "suggestion" | "werk" | "erlebnis" | "done"
  const [screen,   setScreen]   = useState("moment");
  const [mediaData,setMediaData]= useState(null);   // { file, preview, isVid, caption, location, visibility }
  const [postType, setPostType] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // ── handlePublish — identisch zu v1, kein Datenmodell-Break ───────
  async function handlePublish(payload) {
    setLoading(true); setError("");
    try {
      const { file, isVid } = mediaData;
      const ext    = file.name.split(".").pop();
      const bucket = payload.type === "story" ? "stories" : "media";
      const path   = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error:upErr } = await supabase.storage
        .from(bucket).upload(path, file, { contentType:file.type, upsert:false });
      if (upErr) throw upErr;

      const { data:{ publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

      const base = {
        user_id:    user.id,
        media_url:  publicUrl,
        media_type: isVid ? "video" : "image",
        caption:    payload.details?.caption   || mediaData.caption || null,
        location:   payload.details?.location  || mediaData.location || null,
        created_at: new Date().toISOString(),
        status:     "published",
        mood_tags:      payload.details?.moodTags?.length ? payload.details.moodTags : null,
        energy_level:   payload.details?.energyLevel       || null,
        social_energy:  payload.details?.socialEnergy      || null,
      };

      if (payload.type === "moment") {
        const { error:e } = await supabase.from("stories").insert({ ...base, expires_at:null });
        if (e) throw e;
      } else if (payload.type === "werk") {
        const w = payload.werkData;
        const { error:e } = await supabase.from("works").insert({
          ...base,
          cover_url:          publicUrl,
          title:              w.title || "Mein Werk",
          description:        w.desc,
          price:              w.price,
          quantity:           w.quantity,
          shipping_available: w.shipping,
          pickup_available:   w.pickup,
          delivery_time:      w.deliveryTime || null,
          category:           w.category     || null,
          for_sale:           !w.onlyShow,
        });
        if (e) throw e;
      } else if (payload.type === "erlebnis") {
        const er = payload.erlData;
        const { error:e } = await supabase.from("experiences").insert({
          ...base,
          title:            er.title       || "Mein Erlebnis",
          description:      er.desc,
          price:            er.price,
          price_type:       er.priceType,
          format:           er.format,
          location:         er.location    || null,
          duration:         er.duration    || null,
          available_days:   er.days        || null,
          max_participants: er.maxPax,
          category:         er.category    || null,
          language:         er.language,
        });
        if (e) throw e;
      }

      setPostType(payload.type);
      setScreen("done");
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 2200);
    } catch(err) {
      console.error("[HuiCreateFlow]", err);
      setError(err.message || "Fehler beim Veröffentlichen.");
      setLoading(false);
    }
  }

  // ── Moment direkt veröffentlichen (ohne Suggestion-Umweg) ─────────
  async function publishMomentDirect() {
    setLoading(true); setError("");
    try {
      const { file, isVid, caption, location, visibility } = mediaData;
      const ext  = file.name.split(".").pop();
      const path = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error:upErr } = await supabase.storage
        .from("media").upload(path, file, { contentType:file.type, upsert:false });
      if (upErr) throw upErr;

      const { data:{ publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

      const { error:e } = await supabase.from("stories").insert({
        user_id:    user.id,
        media_url:  publicUrl,
        media_type: isVid ? "video" : "image",
        caption:    caption || null,
        location:   location || null,
        created_at: new Date().toISOString(),
        status:     "published",
        expires_at: null,
      });
      if (e) throw e;

      setPostType("moment");
      setScreen("done");
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 2200);
    } catch(err) {
      console.error("[HuiCreateFlow moment]", err);
      setError(err.message || "Fehler beim Veröffentlichen.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:C.cream,
      display:"flex", flexDirection:"column",
      paddingTop:"max(0px, env(safe-area-inset-top, 0px))",
      paddingBottom:"max(0px, env(safe-area-inset-bottom, 0px))",
    }}
      // Kein Click-außen-close — bewusstes Öffnen
    >
      {/* ── Screen Routing ── */}

      {screen === "moment" && (
        <ScreenMoment
          onClose={onClose}
          onNext={(m) => {
            setMediaData(m);
            setScreen("suggestion");
          }}
        />
      )}

      {screen === "suggestion" && mediaData && (
        <ScreenSuggestion
          media={mediaData}
          onBack={() => setScreen("moment")}
          onPublishDirect={async () => {
            await publishMomentDirect();
          }}
          onDeepen={(type) => setScreen(type)}
        />
      )}

      {screen === "werk" && mediaData && (
        <ScreenWerk
          media={mediaData}
          onBack={() => setScreen("suggestion")}
          onPublish={handlePublish}
          loading={loading}
          error={error}
        />
      )}

      {screen === "erlebnis" && mediaData && (
        <ScreenErlebnis
          media={mediaData}
          onBack={() => setScreen("suggestion")}
          onPublish={handlePublish}
          loading={loading}
          error={error}
        />
      )}

      {screen === "done" && (
        <ScreenDone type={postType || "moment"} />
      )}
    </div>
  );
}

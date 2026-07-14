// connection-create/StepTwoConnectionDetails.jsx v3
// Screenshot-exact — Ein floating Card, vertikale Felder-Reihenfolge
// Titel → Beschreibung → Datum+Uhrzeit → Ort → Teilnehmer →
// Kosten → Stimmung → Sichtbarkeit → Offenheit → Extras → Medien

import {
  HUIPersonenIcon, HUIFotoIcon, HUILinkIcon, HUIKalenderIcon,
} from '../../design/icons/HuiSystemIcons.jsx';
import React from "react";
import { HUI } from "../../design/hui.design.js";

// ── Farben ──────────────────────────────────────────────────────────
const C = {
  violet: HUI.COLOR.violet, violet2: "#7C3AED",
  ink:    HUI.COLOR.ink, ink2: HUI.COLOR.inkMid,
  muted:  "rgba(80,80,80,0.52)",
  border: "rgba(0,0,0,0.08)",
  fieldBg:"rgba(255,255,255,0.85)",
  cardBg: "rgba(255,255,255,0.92)",
};

// ── Global CSS ──────────────────────────────────────────────────────
const CSS = `
  @keyframes s2v3-in {
    from { opacity:0; transform:translateY(20px) scale(0.99); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes s2v3-glow {
    0%,100% { box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
    50%     { box-shadow: 0 0 0 4px rgba(139,92,246,0.22); }
  }

  .s2v3-card {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(28px) saturate(1.6);
    -webkit-backdrop-filter: blur(28px) saturate(1.6);
    border: 1px solid rgba(255,255,255,0.75);
    border-radius: 28px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.09), 0 2px 10px rgba(0,0,0,0.05);
    padding: 28px 24px;
    animation: s2v3-in 0.28s cubic-bezier(0.22,1,0.36,1) both;
    width: 100%;
    box-sizing: border-box;
  }

  .s2v3-label {
    font-size: 13px;
    font-weight: 700;
    color: rgba(60,60,60,0.70);
    margin-bottom: 8px;
    display: block;
    letter-spacing: 0.05em;
  }

  .s2v3-field {
    width: 100%;
    border: 1.5px solid rgba(0,0,0,0.08);
    border-radius: 14px;
    padding: 12px 15px;
    font-size: 15px;
    font-family: inherit;
    color: #1A1A1A;
    background: rgba(255,255,255,0.85);
    outline: none;
    transition: border 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
  }
  .s2v3-field:focus {
    border-color: rgba(139,92,246,0.38);
    box-shadow: 0 0 0 3.5px rgba(139,92,246,0.10);
    background: #fff;
  }
  .s2v3-field::placeholder { color: rgba(80,80,80,0.36); }

  .s2v3-divider {
    height: 1px;
    background: rgba(0,0,0,0.055);
    margin: 22px 0;
    border: none;
  }

  .s2v3-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
  }
  .s2v3-scroll::-webkit-scrollbar { display: none; }
`;

// ── Field Row Wrapper ───────────────────────────────────────────────
function FieldBlock({ label, children, noDivider }) {
  return (
    <div>
      {label && <span className="s2v3-label">{label}</span>}
      {children}
      {!noDivider && <hr className="s2v3-divider"/>}
    </div>
  );
}

// ── Char Count ──────────────────────────────────────────────────────
function CharCount({ cur, max }) {
  return (
    <div style={{
      textAlign: "right", fontSize: 11.5,
      color: cur > max * 0.85 ? "#DC2626" : "rgba(80,80,80,0.35)",
      marginTop: 5,
    }}>{cur}/{max}</div>
  );
}

// ── Datum + Uhrzeit nebeneinander ──────────────────────────────────
function DateTimeRow({ date, time, onDate, onTime }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayFmt = new Date().toLocaleDateString("de-DE",
    { day:"numeric", month:"long", year:"numeric" });

  const selectStyle = {
    paddingLeft: 38, paddingRight: 32, appearance:"none",
    WebkitAppearance:"none", cursor:"pointer",
  };

  return (
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
      {/* Datum */}
      <div style={{ flex:2, minWidth:170, position:"relative" }}>
        <label className="s2v3-label">Datum</label>
        <div style={{ position:"relative" }}>
          <span style={{
            position:"absolute", left:12, top:"50%",
            transform:"translateY(-50%)", fontSize:15,
            pointerEvents:"none", zIndex:1,
          }} style={{display:"flex",alignItems:"center"}}><HUIKalenderIcon size={15}/></span>
          <select
            className="s2v3-field"
            style={selectStyle}
            value={date || today}
            onChange={e => onDate(e.target.value)}
          >
            <option value={today}>Heute, {todayFmt}</option>
            {[1,2,3,4,5,6,7].map(d => {
              const nd  = new Date(Date.now() + d * 86400000);
              const val = nd.toISOString().slice(0,10);
              const lbl = nd.toLocaleDateString("de-DE",
                { weekday:"short", day:"numeric", month:"long" });
              return <option key={d} value={val}>{lbl}</option>;
            })}
          </select>
          <span style={{
            position:"absolute", right:11, top:"50%",
            transform:"translateY(-50%)", fontSize:11,
            color:"rgba(80,80,80,0.45)", pointerEvents:"none",
          }}>▾</span>
        </div>
      </div>

      {/* Uhrzeit */}
      <div style={{ flex:1, minWidth:120, position:"relative" }}>
        <label className="s2v3-label">Uhrzeit</label>
        <div style={{ position:"relative" }}>
          <span style={{
            position:"absolute", left:12, top:"50%",
            transform:"translateY(-50%)", fontSize:15,
            pointerEvents:"none", zIndex:1,
          }}>🕐</span>
          <select
            className="s2v3-field"
            style={selectStyle}
            value={time || "20:00"}
            onChange={e => onTime(e.target.value)}
          >
            {["08:00","09:00","10:00","11:00","12:00","13:00","14:00",
              "15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"]
              .map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{
            position:"absolute", right:11, top:"50%",
            transform:"translateY(-50%)", fontSize:11,
            color:"rgba(80,80,80,0.45)", pointerEvents:"none",
          }}>▾</span>
        </div>
      </div>
    </div>
  );
}

// ── Ort + Mini-Map ──────────────────────────────────────────────────
function LocationRow({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>
      <div style={{
        flex:1, display:"flex", alignItems:"center", gap:10,
        padding:"11px 15px",
        background: C.fieldBg,
        border: `1.5px solid ${C.border}`,
        borderRadius:14, boxSizing:"border-box",
      }}>
        <HUILocationIcon size={16} style={{flexShrink:0, opacity:0.65}} />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Ort eingeben\u2026"
          style={{
            flex:1, border:"none", background:"none",
            outline:"none", fontSize:15, color:C.ink,
            fontFamily:"inherit",
          }}
        />
      </div>
      {/* Mini Map Preview */}
      <div style={{
        width:72, height:46, borderRadius:12, flexShrink:0,
        background:"linear-gradient(135deg,#E8F4FD 0%,#D4EAF7 50%,#C8E2F2 100%)",
        border:`1.5px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        overflow:"hidden", cursor:"pointer", position:"relative",
      }}>
        {/* Stylized map grid */}
        <div style={{
          position:"absolute", inset:0,
          background:`
            repeating-linear-gradient(0deg, rgba(100,150,200,0.12) 0px, rgba(100,150,200,0.12) 1px, transparent 1px, transparent 14px),
            repeating-linear-gradient(90deg, rgba(100,150,200,0.12) 0px, rgba(100,150,200,0.12) 1px, transparent 1px, transparent 14px)
          `,
        }}/>
        <div style={{
          fontSize:18, filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.18))",
          position:"relative", zIndex:1,
        }} style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUILocationIcon size={18}/></div>
      </div>
    </div>
  );
}

// ── Participant Stepper ─────────────────────────────────────────────
function ParticipantRow({ value, onChange }) {
  return (
    <div style={{
      display:"flex", alignItems:"center",
      padding:"11px 15px",
      background: C.fieldBg,
      border:`1.5px solid ${C.border}`,
      borderRadius:14,
    }}>
      <HUIPersonenIcon size={15} style={{marginRight:8, opacity:0.6, flexShrink:0}} />
      <span style={{ fontSize:14, color:C.muted, flex:1 }}>
        Maximale Anzahl (optional)
      </span>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <button
          onClick={() => onChange(Math.max(2, value - 1))}
          style={{
            width:32, height:32, borderRadius:8,
            background:"rgba(139,92,246,0.09)",
            border:"1.5px solid rgba(139,92,246,0.18)",
            color:C.violet, fontSize:18, fontWeight:700,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", WebkitTapHighlightColor:"transparent",
          }}>−</button>
        <span style={{
          fontSize:17, fontWeight:800, color:C.ink,
          minWidth:28, textAlign:"center",
        }}>{value}</span>
        <button
          onClick={() => onChange(Math.min(500, value + 1))}
          style={{
            width:32, height:32, borderRadius:8,
            background:"rgba(139,92,246,0.09)",
            border:"1.5px solid rgba(139,92,246,0.18)",
            color:C.violet, fontSize:18, fontWeight:700,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", WebkitTapHighlightColor:"transparent",
          }}>+</button>
      </div>
    </div>
  );
}

// ── Kosten Pills ────────────────────────────────────────────────────
const COST_OPTS = [
  { key:"free",     label:"Kostenlos"  },
  { key:"donation", label:"Spende"     },
  { key:"fixed",    label:"Festpreis"  },
  { key:"request",  label:"Auf Anfrage"},
];

function CostRow({ value, onChange }) {
  return (
    <div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {COST_OPTS.filter(o => o && o.key).map(o => {
          const on = value === o.key;
          return (
            <button key={o.key} onClick={() => onChange(o.key)} style={{
              padding:"8px 16px", borderRadius:99,
              background: on
                ? "rgba(139,92,246,0.06)"
                : "rgba(255,255,255,0.85)",
              border: on
                ? "1.5px solid rgba(139,92,246,0.40)"
                : `1.5px solid ${C.border}`,
              color:      on ? C.violet : C.muted,
              fontSize:   14, fontWeight: on ? 700 : 500,
              cursor:     "pointer",
              boxShadow:  on ? "0 0 0 3px rgba(139,92,246,0.10)" : "none",
              transition: "all 0.16s ease",
              animation:  on ? "s2v3-glow 2.5s ease-in-out infinite" : "none",
              WebkitTapHighlightColor:"transparent",
            }}>{o.label}</button>
          );
        })}
      </div>
      {value === "free" && (
        <div style={{ fontSize:12.5, color:C.muted, marginTop:9 }}>
          Diese Verbindung ist kostenlos.
        </div>
      )}
      {(value === "fixed" || value === "donation") && (
        <input
          className="s2v3-field"
          style={{ marginTop:10 }}
          placeholder="Betrag eingeben (z.B. 12\u00a0\u20ac)"
        />
      )}
    </div>
  );
}

// ── Stimmung / Energie ──────────────────────────────────────────────
const MOOD_OPTS = [
  { key:"ruhig",         label:"Ruhig",         icon:"🌿" },
  { key:"kreativ",       label:"Kreativ",        icon:"🎨" },
  { key:"tief",          label:"Tief",           icon:"💧" },
  { key:"gesellig",      label:"Gesellig",       icon:"🧡" },
  { key:"abenteuerlich", label:"Abenteuerlich",  icon:"🔥" },
];

function MoodRow({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      {(MOOD_OPTS||[]).filter(m=>m&&m.key).map(m => {
        const on = value === m.key;
        return (
          <button key={m.key} onClick={() => onChange(m.key)} style={{
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:5,
            padding:"11px 14px", borderRadius:16,
            background: on
              ? "rgba(139,92,246,0.07)"
              : "rgba(255,255,255,0.85)",
            border: on
              ? "1.5px solid rgba(139,92,246,0.38)"
              : `1.5px solid ${C.border}`,
            cursor:"pointer",
            animation: on ? "s2v3-glow 2.8s ease-in-out infinite" : "none",
            transition:"all 0.16s",
            WebkitTapHighlightColor:"transparent",
            minWidth:60,
          }}>
            <span style={{ fontSize:22 }}>{m.icon}</span>
            <span style={{
              fontSize:12, fontWeight: on ? 700 : 500,
              color: on ? C.violet : C.muted,
            }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Sichtbarkeit ────────────────────────────────────────────────────
const VIS_OPTS = [
  { key:"public",  label:"\u00d6ffentlich", sub:"Im Feed & Entdecken",  icon:"🌐" },
  { key:"local",   label:"Lokal",           sub:"Nur in deiner N\u00e4he", icon:"📍" },
  { key:"friends", label:"Freunde",         sub:"Nur f\u00fcr Freunde", icon:"👥" },
  { key:"private", label:"Privat",          sub:"Nur mit Einladung",    icon:<HUIPrivatIcon size={16}/> },
];

function VisibilityRow({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
      {VIS_OPTS.filter(v => v && v.key).map(v => {
        const on = value === v.key;
        return (
          <button key={v.key} onClick={() => onChange(v.key)} style={{
            flex:1, minWidth:72,
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:4, padding:"11px 10px",
            borderRadius:16,
            background: on ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.85)",
            border: on
              ? "1.5px solid rgba(139,92,246,0.38)"
              : `1.5px solid ${C.border}`,
            cursor:"pointer",
            animation: on ? "s2v3-glow 2.8s ease-in-out infinite" : "none",
            transition:"all 0.16s",
            WebkitTapHighlightColor:"transparent",
          }}>
            <span style={{ fontSize:20 }}>{v.icon}</span>
            <span style={{
              fontSize:12.5, fontWeight: on ? 700 : 600,
              color: on ? C.violet : C.ink,
            }}>{v.label}</span>
            <span style={{
              fontSize:10.5, color:C.muted, textAlign:"center",
              lineHeight:1.3,
            }}>{v.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Offenheit ───────────────────────────────────────────────────────
const OPEN_OPTS = [
  {
    key:"open",
    label:"Offen f\u00fcr neue Menschen",
    sub:"\"Jeder\" kann teilnehmen\nund ist willkommen.",
    icon:"👥",
  },
  {
    key:"trusted",
    label:"Eher vertraute Runde",
    sub:"Nur f\u00fcr Menschen, die sich\nkennen oder empfohlen sind.",
    icon:"🔒",
  },
];

function OpennessRow({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
      {OPEN_OPTS.filter(o => o && o.key).map(o => {
        const on = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            flex:1, minWidth:150, textAlign:"left",
            padding:"14px 15px", borderRadius:16,
            background: on ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.85)",
            border: on
              ? "1.5px solid rgba(139,92,246,0.38)"
              : `1.5px solid ${C.border}`,
            cursor:"pointer",
            animation: on ? "s2v3-glow 2.8s ease-in-out infinite" : "none",
            transition:"all 0.16s",
            WebkitTapHighlightColor:"transparent",
            display:"flex", alignItems:"flex-start", gap:10,
          }}>
            <div style={{ flex:1 }}>
              <div style={{
                fontSize:13.5, fontWeight: on ? 800 : 700,
                color: on ? C.violet : C.ink, marginBottom:5, lineHeight:1.2,
              }}>{o.label}</div>
              <div style={{
                fontSize:12, color:C.muted, lineHeight:1.55,
                whiteSpace:"pre-line",
              }}>{o.sub}</div>
            </div>
            <span style={{
              fontSize:18, flexShrink:0, marginTop:1, opacity:0.65,
            }}>{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Attachment Bar ──────────────────────────────────────────────────
function AttachmentBar() {
  const BtnS = {
    flex:1, display:"flex", alignItems:"center",
    justifyContent:"center", gap:6,
    padding:"11px 8px",
    background:"rgba(255,255,255,0.85)",
    border:`1.5px solid ${C.border}`,
    borderRadius:13, fontSize:13,
    color:C.muted, fontWeight:600,
    cursor:"pointer", WebkitTapHighlightColor:"transparent",
    transition:"border-color 0.15s, color 0.15s",
  };
  const hover = e => {
    e.currentTarget.style.borderColor = "rgba(139,92,246,0.28)";
    e.currentTarget.style.color = C.violet;
  };
  const leave = e => {
    e.currentTarget.style.borderColor = C.border;
    e.currentTarget.style.color = C.muted;
  };
  return (
    <div style={{ display:"flex", gap:9 }}>
      <button style={BtnS} onMouseEnter={hover} onMouseLeave={leave}>
        <HUIFotoIcon size={16} style={{flexShrink:0}}/> Bild hinzufügen
      </button>
      <button style={BtnS} onMouseEnter={hover} onMouseLeave={leave}>
        Musik hinzufügen
      </button>
      <button style={BtnS} onMouseEnter={hover} onMouseLeave={leave}>
        <HUILinkIcon size={16} style={{flexShrink:0}}/> Link hinzufügen
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HAUPT-EXPORT
// ══════════════════════════════════════════════════════════════════
export default function StepTwoConnectionDetails({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div
      className="s2v3-scroll"
      style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        padding:"0 16px 32px",
        WebkitOverflowScrolling:"touch",
      }}
    >
      <style>{CSS}</style>

      {/* ── Floating Card ── */}
      <div className="s2v3-card" style={{ maxWidth:560, margin:"0 auto" }}>

        {/* ── Header ── */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{
            fontSize:22, fontWeight:900, color:C.ink,
            letterSpacing:-0.6, lineHeight:1.2, marginBottom:6,
          }}>Neue Verbindung erstellen</div>
          <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.55 }}>
            Teile, was du vorhast und lade andere ein.
          </div>
        </div>

        {/* 1 ── Titel ── */}
        <FieldBlock label="Titel deiner Verbindung">
          <input
            className="s2v3-field"
            maxLength={60}
            value={data.title || ""}
            onChange={e => set("title", e.target.value)}
            placeholder="Lagerfeuer am Strand \uD83D\uDD25"
          />
          <CharCount cur={data.title?.length || 0} max={60}/>
        </FieldBlock>

        {/* 2 ── Beschreibung ── */}
        <FieldBlock label="Beschreibung">
          <textarea
            className="s2v3-field"
            maxLength={300}
            rows={4}
            value={data.description || ""}
            onChange={e => set("description", e.target.value)}
            placeholder="Gemeinsames Lagerfeuer, gute Gespr\u00e4che, Musik und einfach den Moment genie\u00dfen."
            style={{ resize:"none", minHeight:96 }}
          />
          <CharCount cur={data.description?.length || 0} max={300}/>
        </FieldBlock>

        {/* 3+4 ── Datum & Uhrzeit ── */}
        <FieldBlock>
          <DateTimeRow
            date={data.date}   onDate={v => set("date",  v)}
            time={data.time}   onTime={v => set("time",  v)}
          />
        </FieldBlock>

        {/* 5 ── Ort ── */}
        <FieldBlock label="Ort">
          <LocationRow
            value={data.location || ""}
            onChange={v => set("location", v)}
          />
        </FieldBlock>

        {/* 6 ── Teilnehmer ── */}
        <FieldBlock label="Teilnehmer">
          <ParticipantRow
            value={data.participants || 30}
            onChange={v => set("participants", v)}
          />
        </FieldBlock>

        {/* 7 ── Kosten ── */}
        <FieldBlock label="Kosten">
          <CostRow
            value={data.cost || "free"}
            onChange={v => set("cost", v)}
          />
        </FieldBlock>

        {/* 8 ── Stimmung / Energie ── */}
        <FieldBlock label="Stimmung / Energie">
          <MoodRow
            value={data.mood || "gesellig"}
            onChange={v => set("mood", v)}
          />
        </FieldBlock>

        {/* 9 ── Sichtbarkeit ── */}
        <FieldBlock label="Sichtbarkeit">
          <VisibilityRow
            value={data.visibility || "public"}
            onChange={v => set("visibility", v)}
          />
        </FieldBlock>

        {/* 10 ── Offenheit ── */}
        <FieldBlock label="Offenheit">
          <OpennessRow
            value={data.openness || "open"}
            onChange={v => set("openness", v)}
          />
        </FieldBlock>

        {/* 11 ── Zusätzliche Infos ── */}
        <FieldBlock label="Zus\u00e4tzliche Infos (optional)">
          <textarea
            className="s2v3-field"
            maxLength={200}
            rows={2}
            value={data.extras || ""}
            onChange={e => set("extras", e.target.value)}
            placeholder="z.B. Mitbringen, Hinweise, Besonderheiten\u2026"
            style={{ resize:"none" }}
          />
          <CharCount cur={data.extras?.length || 0} max={200}/>
        </FieldBlock>

        {/* 12 ── Attachment Bar ── */}
        <FieldBlock noDivider>
          <AttachmentBar/>
        </FieldBlock>

      </div>
    </div>
  );
}

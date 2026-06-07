// src/system/flows/impact/ImpactFlow.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Herzensprojekt Bewerbungsassistent v2
// 6 Steps + KI-Vorprüfung, ein-Frage-pro-Schritt, Mobile First
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from "react";
import { supabase }  from "../../../lib/supabaseClient.js";
import { useAuth }   from "../../../lib/AuthContext.jsx";

// ── Design Tokens (konsistent mit ImpactPage) ────────────────
const T = {
  teal:    "#0DC4B5", tealL:  "#22DDD0",
  coral:   "#F4714F", gold:   "#D4952A",
  violet:  "#7264D6", green:  "#22C55E",
  ink:     "#141422", ink2:   "#38384F",
  ink3:    "rgba(20,20,34,0.45)", ink4: "rgba(20,20,34,0.18)",
  page:    "#F8F4EE", surface: "#FDFAF5", surfaceHi: "#FFFFFF",
  line:    "rgba(20,20,34,0.09)",
};

const S = {
  card:   "0 2px 16px rgba(0,0,0,0.06)",
  btn:    (c) => `0 6px 20px ${c}38`,
};

// ── Kategorien ────────────────────────────────────────────────
const KATEGORIEN = [
  { id:"bildung",     emoji:"📚", label:"Bildung"      },
  { id:"umwelt",      emoji:"🌿", label:"Umwelt"       },
  { id:"gesundheit",  emoji:"💊", label:"Gesundheit"   },
  { id:"gemeinschaft",emoji:"🤝", label:"Gemeinschaft" },
  { id:"tiere",       emoji:"🐾", label:"Tiere"        },
  { id:"kultur",      emoji:"🎨", label:"Kultur"       },
  { id:"soziales",    emoji:"❤️", label:"Soziales"     },
  { id:"sonstiges",   emoji:"✨", label:"Sonstiges"    },
];

// ── KI-Bewertungslogik (client-side heuristics) ───────────────
function bewerteProjekt(form) {
  const name      = (form.name      || "").toLowerCase();
  const satz      = (form.satz      || "").toLowerCase();
  const problem   = (form.problem   || "").toLowerCase();
  const wer       = (form.wer       || "").toLowerCase();
  const umsetzung = (form.umsetzung || "").toLowerCase();

  // Red Flags — eindeutig nicht geeignet
  const ABLEHNUNGS_KEYWORDS = [
    "auto","urlaub","reise","fernseher","handy","smartphone","laptop","kleidung",
    "schulden","kredit","miete","wohnung kaufen","haus kaufen","hochzeit",
    "gehalt","lohn","eigene firma","startup kapital","investition","rendite",
    "luxus","persönlich","privat","mein traum","mein wunsch",
    "für mich","ich möchte","ich brauche","mein auto","meine schulden",
  ];
  const allText = `${name} ${satz} ${problem} ${wer} ${umsetzung}`;
  const hasRedFlag = ABLEHNUNGS_KEYWORDS.some(kw => allText.includes(kw));
  if (hasRedFlag) return { geeignet: false, grund: "red_flag" };

  // Zu kurz / leer
  if (satz.length < 20 || problem.length < 20 || umsetzung.length < 20) {
    return { geeignet: false, grund: "zu_kurz" };
  }

  // Wirkungsindikatoren
  const WIRKUNGS_KEYWORDS = [
    "kinder","jugendliche","schüler","gemeinde","umwelt","natur","tiere",
    "kranke","bedürftige","obdachlose","geflüchtete","senioren","familien",
    "bildung","schule","workshop","training","pflanzen","müll","klima",
    "wasser","energie","solar","recycling","kultur","musik","kunst","sport",
    "inklusion","barrierefreiheit","nachbarschaft","quartier","dorf",
    "region","gemeinschaft","ehrenamt","nonprofit","fördern","unterstützen",
    "helfen","verbessern","schützen","ermöglichen","befähigen",
  ];
  const wirkungScore = WIRKUNGS_KEYWORDS.filter(kw => allText.includes(kw)).length;

  // Gemeinwohl-Indikator
  const GEMEINWOHL = ["alle","viele","öffentlich","kostenlos","frei","gemeinsam","zusammen","jeder"];
  const gemeinwohlScore = GEMEINWOHL.filter(kw => allText.includes(kw)).length;

  if (wirkungScore >= 2 || gemeinwohlScore >= 2 || (wirkungScore >= 1 && gemeinwohlScore >= 1)) {
    return { geeignet: true, wirkung: Math.min(5, wirkungScore + gemeinwohlScore) };
  }

  // Grenzfall — Kategorie hilft
  if (["bildung","umwelt","gesundheit","gemeinschaft","tiere","soziales"].includes(form.kategorie)) {
    return { geeignet: true, wirkung: 2 };
  }

  return { geeignet: false, grund: "zu_vage" };
}

// ── Animations-CSS ────────────────────────────────────────────
const CSS = `
  @keyframes ifFadeIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes ifModalIn  { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
  @keyframes ifPulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes ifSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ifShake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes ifGlow     { 0%,100%{box-shadow:0 0 0 0 rgba(13,196,181,0)} 50%{box-shadow:0 0 28px 6px rgba(13,196,181,0.18)} }
  .hui-input { width:100%; padding:16px 18px; border-radius:16px;
    border:2px solid rgba(20,20,34,0.10); background:#FFFFFF;
    font-size:16px; color:#141422; outline:none; font-family:inherit;
    box-sizing:border-box; transition:border-color 0.18s,box-shadow 0.18s;
    -webkit-appearance:none; }
  .hui-input:focus { border-color:#0DC4B5; box-shadow:0 0 0 3px rgba(13,196,181,0.14); }
  .hui-textarea { resize:none; line-height:1.65; min-height:110px; }
  .hui-chip { cursor:pointer; transition:all 0.15s ease; -webkit-tap-highlight-color:transparent; }
  .hui-chip:active { transform:scale(0.95); }
  .hui-next { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
`;

// ── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display:"flex", gap:4, flex:1 }}>
      {Array.from({ length:total }).map((_,i) => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:99,
          background: i < step
            ? `linear-gradient(90deg,${T.teal},${T.tealL})`
            : i === step
            ? `linear-gradient(90deg,${T.teal}88,${T.teal}33)`
            : T.line,
          transition:"background 0.35s ease",
        }}/>
      ))}
    </div>
  );
}

// ── Step-Wrapper ──────────────────────────────────────────────
function StepWrap({ step, total, onBack, onClose, label, children }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100%", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"16px 20px 14px", flexShrink:0,
        borderBottom:`1px solid ${T.line}`,
      }}>
        <button onClick={onBack} style={{
          width:34, height:34, borderRadius:"50%",
          background:"rgba(20,20,34,0.06)", border:"none",
          cursor:"pointer", fontSize:18, color:T.ink2,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
        }}>‹</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.teal,
            letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:5 }}>
            {label}
          </div>
          <ProgressBar step={step} total={total} />
        </div>
        <button onClick={onClose} style={{
          width:34, height:34, borderRadius:"50%",
          background:"rgba(20,20,34,0.06)", border:"none",
          cursor:"pointer", fontSize:15, color:T.ink3,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
        }}>✕</button>
      </div>

      {/* Content */}
      <div style={{
        flex:1, overflowY:"auto", padding:"28px 24px 24px",
        WebkitOverflowScrolling:"touch",
        display:"flex", flexDirection:"column",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── CTA Button ────────────────────────────────────────────────
function NextBtn({ label="Weiter →", onClick, disabled, loading }) {
  return (
    <button
      className="hui-next"
      onClick={() => !disabled && !loading && onClick?.()}
      style={{
        width:"100%", height:56, borderRadius:18, border:"none",
        background: disabled || loading
          ? "rgba(20,20,34,0.08)"
          : `linear-gradient(135deg,${T.teal},${T.tealL})`,
        color: disabled || loading ? T.ink4 : "#fff",
        fontSize:16, fontWeight:800,
        cursor: disabled || loading ? "default" : "pointer",
        boxShadow: disabled || loading ? "none" : S.btn(T.teal),
        transition:"all 0.2s ease",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        opacity: disabled ? 0.55 : 1,
        marginTop:"auto", flexShrink:0,
      }}
    >
      {loading
        ? <span style={{ width:22, height:22, border:`3px solid rgba(255,255,255,0.3)`,
            borderTopColor:"#fff", borderRadius:"50%",
            animation:"ifSpin 0.7s linear infinite", display:"inline-block" }}/>
        : label}
    </button>
  );
}

// ═══ STEP 1: Projektname ═════════════════════════════════════
function Step1({ form, update, onNext, onBack, onClose }) {
  const ok = (form.name || "").trim().length >= 3;
  return (
    <StepWrap step={0} total={6} onBack={onBack} onClose={onClose}
      label="Schritt 1 von 6">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1,
        display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🌱</div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight:900,
          color:T.ink, letterSpacing:"-0.025em", lineHeight:1.2 }}>
          Wie heißt dein Projekt?
        </h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Gib deinem Herzensprojekt einen Namen.
          Der Name ist das Erste, was die Community sieht.
        </p>
        <input
          className="hui-input"
          type="text"
          placeholder="z. B. Gemüsegarten für die Nachbarschaft"
          value={form.name || ""}
          onChange={e => update({ name: e.target.value })}
          maxLength={80}
          autoFocus
        />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right",
          marginTop:6, marginBottom:28 }}>
          {(form.name || "").length} / 80
        </div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

// ═══ STEP 2: Ein-Satz-Beschreibung ══════════════════════════
function Step2({ form, update, onNext, onBack, onClose }) {
  const ok = (form.satz || "").trim().length >= 15;
  return (
    <StepWrap step={1} total={6} onBack={onBack} onClose={onClose}
      label="Schritt 2 von 6">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1,
        display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>💬</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900,
          color:T.ink, letterSpacing:"-0.022em", lineHeight:1.2 }}>
          Beschreibe dein Projekt in einem Satz.
        </h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Was ist die Kernidee? Versuche es so klar wie möglich zu formulieren —
          als würdest du es einem Freund erklären.
        </p>
        <textarea
          className="hui-input hui-textarea"
          placeholder="z. B. Wir legen einen kostenlosen Gemüsegarten für alle Bewohner unseres Viertels an."
          value={form.satz || ""}
          onChange={e => update({ satz: e.target.value })}
          maxLength={200}
          rows={4}
        />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right",
          marginTop:6, marginBottom:28 }}>
          {(form.satz || "").length} / 200
        </div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

// ═══ STEP 3: Problem ═════════════════════════════════════════
function Step3({ form, update, onNext, onBack, onClose }) {
  const ok = (form.problem || "").trim().length >= 20;
  return (
    <StepWrap step={2} total={6} onBack={onBack} onClose={onClose}
      label="Schritt 3 von 6">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1,
        display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🎯</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900,
          color:T.ink, letterSpacing:"-0.022em", lineHeight:1.2 }}>
          Welches Problem löst dein Projekt?
        </h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Was ist die eigentliche Herausforderung oder der Missstand,
          den dein Projekt angeht?
        </p>
        <textarea
          className="hui-input hui-textarea"
          placeholder="z. B. In unserem Viertel gibt es kaum Grünflächen. Kinder haben keinen Zugang zu Natur, und viele ältere Menschen fühlen sich isoliert."
          value={form.problem || ""}
          onChange={e => update({ problem: e.target.value })}
          maxLength={400}
          rows={5}
        />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right",
          marginTop:6, marginBottom:28 }}>
          {(form.problem || "").length} / 400
        </div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

// ═══ STEP 4: Wer profitiert — Kategorie ═════════════════════
function Step4({ form, update, onNext, onBack, onClose }) {
  const ok = !!form.kategorie;
  return (
    <StepWrap step={3} total={6} onBack={onBack} onClose={onClose}
      label="Schritt 4 von 6">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1,
        display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🤝</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900,
          color:T.ink, letterSpacing:"-0.022em", lineHeight:1.2 }}>
          Wer profitiert davon?
        </h2>
        <p style={{ margin:"0 0 24px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Wähle den Bereich, der am besten zu deinem Projekt passt.
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10,
          marginBottom:24 }}>
          {KATEGORIEN.map(k => {
            const sel = form.kategorie === k.id;
            return (
              <button
                key={k.id}
                className="hui-chip"
                onClick={() => update({ kategorie: k.id })}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"13px 14px",
                  background: sel ? `${T.teal}15` : T.surfaceHi,
                  border: sel ? `2px solid ${T.teal}` : `2px solid ${T.line}`,
                  borderRadius:16, cursor:"pointer",
                  boxShadow: sel ? `0 0 0 3px ${T.teal}18` : S.card,
                  transition:"all 0.15s ease",
                }}
              >
                <span style={{ fontSize:22 }}>{k.emoji}</span>
                <span style={{ fontSize:14, fontWeight: sel ? 800 : 600,
                  color: sel ? T.teal : T.ink, lineHeight:1.2 }}>{k.label}</span>
              </button>
            );
          })}
        </div>

        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

// ═══ STEP 5: Umsetzung ══════════════════════════════════════
function Step5({ form, update, onNext, onBack, onClose }) {
  const ok = (form.umsetzung || "").trim().length >= 20;
  return (
    <StepWrap step={4} total={6} onBack={onBack} onClose={onClose}
      label="Schritt 5 von 6">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1,
        display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🚀</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900,
          color:T.ink, letterSpacing:"-0.022em", lineHeight:1.2 }}>
          Was wird konkret umgesetzt?
        </h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Was würde konkret mit der Förderung passieren?
          Je konkreter, desto besser.
        </p>
        <textarea
          className="hui-input hui-textarea"
          placeholder="z. B. Wir kaufen Hochbeete, Erde und Saatgut. Wir organisieren monatliche Gartentage mit Nachbarn und schaffen einen Ort der Begegnung."
          value={form.umsetzung || ""}
          onChange={e => update({ umsetzung: e.target.value })}
          maxLength={500}
          rows={5}
        />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right",
          marginTop:6, marginBottom:28 }}>
          {(form.umsetzung || "").length} / 500
        </div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

// ═══ STEP 6: Fördersumme ═════════════════════════════════════
function Step6({ form, update, onNext, onBack, onClose }) {
  const raw = (form.foerder || "").replace(/\D/g,"");
  const val = raw ? parseInt(raw, 10) : 0;
  const ok  = val >= 100 && val <= 50000;

  const fmtDisplay = (str) => {
    const n = str.replace(/\D/g,"");
    if (!n) return "";
    return parseInt(n,10).toLocaleString("de-DE");
  };

  return (
    <StepWrap step={5} total={6} onBack={onBack} onClose={onClose}
      label="Schritt 6 von 6">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1,
        display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>💶</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900,
          color:T.ink, letterSpacing:"-0.022em", lineHeight:1.2 }}>
          Welche Fördersumme wünschst du dir?
        </h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Wie viel Euro würde dein Projekt benötigen,
          um vollständig umgesetzt zu werden?
        </p>

        {/* Betrag-Eingabe */}
        <div style={{ position:"relative", marginBottom:10 }}>
          <span style={{
            position:"absolute", left:18, top:"50%", transform:"translateY(-50%)",
            fontSize:20, fontWeight:700, color:T.teal, pointerEvents:"none",
          }}>€</span>
          <input
            className="hui-input"
            type="text"
            inputMode="numeric"
            placeholder="2.000"
            value={fmtDisplay(form.foerder || "")}
            onChange={e => {
              const clean = e.target.value.replace(/\D/g,"");
              update({ foerder: clean });
            }}
            style={{ paddingLeft:38, fontSize:22, fontWeight:800,
              color:T.ink, letterSpacing:"-0.02em" }}
          />
        </div>

        {/* Validation Hint */}
        {(form.foerder && !ok) && (
          <div style={{ fontSize:12, color:T.coral, marginBottom:12 }}>
            {val < 100
              ? "Bitte mindestens €100 angeben."
              : "Maximal €50.000 pro Bewerbung möglich."}
          </div>
        )}

        {/* Schnellauswahl */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
          {[500, 1000, 2000, 5000, 10000].map(v => (
            <button
              key={v}
              className="hui-chip"
              onClick={() => update({ foerder: String(v) })}
              style={{
                padding:"7px 14px", borderRadius:99, border:"none",
                background: val === v ? T.teal : `${T.teal}12`,
                color: val === v ? "#fff" : T.teal,
                fontSize:13, fontWeight:700, cursor:"pointer",
              }}
            >€{v.toLocaleString("de-DE")}</button>
          ))}
        </div>

        <NextBtn
          label="KI-Prüfung starten →"
          onClick={onNext}
          disabled={!ok}
        />
        <p style={{ margin:"10px 0 0", textAlign:"center",
          fontSize:11, color:T.ink3 }}>
          ✓ Bewerbung kostenlos · ✓ Dauer ~2 Min. · ✓ Kein Projekt geht leer aus
        </p>
      </div>
    </StepWrap>
  );
}

// ═══ KI-PRÜFUNG — Ladescreen ═════════════════════════════════
function AIPruefung({ form, onResult }) {
  const [phase, setPhase] = useState(0);

  const PHASEN = [
    { icon:"🔍", text:"Wirkung analysieren …"       },
    { icon:"🤝", text:"Gemeinwohl prüfen …"          },
    { icon:"⚙️", text:"Umsetzbarkeit bewerten …"    },
    { icon:"🛡️", text:"Vertrauenswürdigkeit prüfen …"},
    { icon:"✨", text:"Ergebnis berechnen …"         },
  ];

  useEffect(() => {
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      setPhase(p => Math.min(p+1, PHASEN.length-1));
      if (idx >= PHASEN.length) {
        clearInterval(iv);
        setTimeout(() => {
          const result = bewerteProjekt(form);
          onResult(result);
        }, 600);
      }
    }, 620);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line

  const pct = Math.round((phase / (PHASEN.length - 1)) * 100);

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 28px",
      animation:"ifFadeIn 0.3s ease both",
    }}>
      {/* Pulsierender Ring */}
      <div style={{
        width:84, height:84, borderRadius:"50%",
        border:`3px solid ${T.teal}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:32, marginBottom:28,
        boxShadow:`0 0 0 12px ${T.teal}12`,
        animation:"ifGlow 2s ease-in-out infinite",
      }}>🧠</div>

      <h3 style={{ margin:"0 0 6px", fontSize:20, fontWeight:900,
        color:T.ink, letterSpacing:"-0.02em" }}>
        HUI-KI prüft dein Projekt
      </h3>
      <p style={{ margin:"0 0 28px", fontSize:13, color:T.ink2 }}>
        Einen Moment bitte …
      </p>

      {/* Fortschrittsbalken */}
      <div style={{ width:"100%", maxWidth:280, height:5,
        borderRadius:99, background:T.line, marginBottom:16, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:99,
          width:`${pct}%`,
          background:`linear-gradient(90deg,${T.teal},${T.tealL})`,
          transition:"width 0.55s ease",
        }}/>
      </div>

      {/* Aktuelle Phase */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        fontSize:14, color:T.teal, fontWeight:700,
        minHeight:28, transition:"opacity 0.3s",
      }}>
        <span>{PHASEN[phase].icon}</span>
        <span>{PHASEN[phase].text}</span>
      </div>

      {/* Kriterien */}
      <div style={{ marginTop:32, display:"flex", flexDirection:"column",
        gap:10, width:"100%", maxWidth:280 }}>
        {["Wirkung","Gemeinwohl","Umsetzbarkeit","Vertrauenswürdigkeit"].map((k,i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:10,
            opacity: phase > i ? 1 : 0.28, transition:"opacity 0.4s ease",
          }}>
            <div style={{
              width:20, height:20, borderRadius:"50%",
              background: phase > i ? T.teal : T.line,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, color:"#fff", fontWeight:800,
              transition:"background 0.3s ease",
              flexShrink:0,
            }}>{phase > i ? "✓" : i+1}</div>
            <span style={{ fontSize:13, fontWeight: phase > i ? 700 : 400,
              color: phase > i ? T.ink : T.ink3 }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ ERGEBNIS: GEEIGNET ══════════════════════════════════════
function ErgebnisGeeignet({ form, onSubmit, onClose, saving, error }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      padding:"32px 24px 24px",
      animation:"ifFadeIn 0.35s ease both",
    }}>
      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:52, marginBottom:14,
          filter:`drop-shadow(0 4px 16px ${T.teal}44)` }}>🌟</div>
        <div style={{
          display:"inline-block", background:`${T.teal}15`,
          border:`1px solid ${T.teal}30`, borderRadius:99,
          padding:"5px 16px", fontSize:11, fontWeight:800,
          color:T.teal, letterSpacing:"0.07em", marginBottom:14,
        }}>GEEIGNET FÜR HUI-PRÜFUNG</div>
        <h2 style={{ margin:"0 0 10px", fontSize:22, fontWeight:900,
          color:T.ink, letterSpacing:"-0.022em", lineHeight:1.25 }}>
          Dein Projekt sieht vielversprechend aus! 🎉
        </h2>
        <p style={{ margin:0, fontSize:14, color:T.ink2, lineHeight:1.7 }}>
          <b style={{ color:T.ink }}>{form.name}</b> wird jetzt an das
          HUI-Team zur Prüfung weitergeleitet.
          Wir melden uns innerhalb weniger Tage bei dir.
        </p>
      </div>

      {/* Zusammenfassung */}
      <div style={{
        background:`${T.teal}08`, border:`1px solid ${T.teal}18`,
        borderRadius:18, padding:"16px 18px", marginBottom:24,
      }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.teal,
          letterSpacing:"0.06em", textTransform:"uppercase",
          marginBottom:12 }}>Deine Bewerbung</div>
        {[
          { label:"Projekt",     val:form.name },
          { label:"Beschreibung",val:form.satz },
          { label:"Kategorie",   val:KATEGORIEN.find(k=>k.id===form.kategorie)?.label },
          { label:"Förderwunsch",val:`€${parseInt(form.foerder||0).toLocaleString("de-DE")}` },
        ].map((r,i) => (
          <div key={i} style={{
            display:"flex", gap:10, padding:"7px 0",
            borderBottom: i < 3 ? `1px solid ${T.teal}12` : "none",
          }}>
            <span style={{ fontSize:12, color:T.ink3, width:90, flexShrink:0 }}>{r.label}</span>
            <span style={{ fontSize:12, fontWeight:700, color:T.ink,
              lineHeight:1.4, flex:1 }}>{r.val}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background:`${T.coral}12`, border:`1px solid ${T.coral}28`,
          borderRadius:12, padding:"10px 14px", marginBottom:16,
          fontSize:12, color:T.coral }}>⚠️ {error}</div>
      )}

      <NextBtn
        label={saving ? undefined : "Jetzt einreichen ✓"}
        onClick={onSubmit}
        loading={saving}
      />
      <button onClick={onClose} style={{
        marginTop:10, background:"none", border:"none",
        fontSize:13, color:T.ink3, cursor:"pointer", padding:"8px",
      }}>Abbrechen</button>
    </div>
  );
}

// ═══ ERGEBNIS: NICHT GEEIGNET ════════════════════════════════
function ErgebnisNichtGeeignet({ form, onClose, onRetry, grund }) {
  const TEXTE = {
    red_flag: {
      titel: "Dieses Projekt passt leider nicht zu HUI.",
      erkl:  "Der HUI Impact Pool ist ausschließlich für Projekte gedacht, die eine messbare positive Wirkung für Gemeinschaft, Umwelt, Bildung, Gesundheit oder ähnliche Bereiche haben.",
      hinweis: "Eigennützige Projekte, Konsumwünsche oder private Anschaffungen können nicht berücksichtigt werden.",
    },
    zu_kurz: {
      titel: "Bitte beschreibe dein Projekt etwas ausführlicher.",
      erkl:  "Das HUI-Team braucht genügend Informationen, um dein Projekt fair beurteilen zu können.",
      hinweis: "Versuche insbesondere bei Problem, Umsetzung und Beschreibung mehr Details hinzuzufügen.",
    },
    zu_vage: {
      titel: "Dein Projekt braucht noch mehr Profil.",
      erkl:  "Die Beschreibung ist noch etwas zu allgemein, um eine Wirkungsbeurteilung vornehmen zu können.",
      hinweis: "Beschreibe konkret: Wer profitiert? Was genau wird umgesetzt? Welche Wirkung entsteht?",
    },
  };
  const t = TEXTE[grund] || TEXTE.zu_vage;

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      padding:"32px 24px 24px",
      animation:"ifShake 0.4s ease both, ifFadeIn 0.3s ease both",
    }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:52, marginBottom:14 }}>🔍</div>
        <div style={{
          display:"inline-block", background:`${T.coral}12`,
          border:`1px solid ${T.coral}28`, borderRadius:99,
          padding:"5px 16px", fontSize:11, fontWeight:800,
          color:T.coral, letterSpacing:"0.07em", marginBottom:14,
        }}>NICHT GEEIGNET FÜR HUI</div>
        <h2 style={{ margin:"0 0 12px", fontSize:20, fontWeight:900,
          color:T.ink, letterSpacing:"-0.02em", lineHeight:1.3 }}>
          {t.titel}
        </h2>
        <p style={{ margin:"0 0 10px", fontSize:13, color:T.ink2, lineHeight:1.7 }}>
          {t.erkl}
        </p>
        <p style={{ margin:0, fontSize:13, color:T.ink2, lineHeight:1.7 }}>
          {t.hinweis}
        </p>
      </div>

      {/* Was ist möglich */}
      <div style={{
        background:`${T.teal}08`, border:`1px solid ${T.teal}18`,
        borderRadius:16, padding:"16px 18px", marginBottom:24,
      }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.teal,
          marginBottom:10 }}>Was zu HUI passt:</div>
        {[
          "📚 Bildungsinitiativen & Wissensprojekte",
          "🌿 Umwelt-, Klima- & Naturschutzprojekte",
          "🤝 Gemeinschafts- & Soziale Projekte",
          "💊 Gesundheits- & Pflegeprojekte",
          "🎨 Kulturelle & gesellschaftliche Initiativen",
        ].map((item,i) => (
          <div key={i} style={{ fontSize:13, color:T.ink2, padding:"4px 0",
            lineHeight:1.5 }}>{item}</div>
        ))}
      </div>

      <button
        onClick={onRetry}
        style={{
          width:"100%", height:52, borderRadius:16, border:"none",
          background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
          color:"#fff", fontSize:15, fontWeight:800,
          cursor:"pointer", boxShadow:S.btn(T.teal), marginBottom:10,
        }}
      >Nochmal versuchen</button>
      <button onClick={onClose} style={{
        background:"none", border:"none", fontSize:13,
        color:T.ink3, cursor:"pointer", padding:"8px",
      }}>Schließen</button>
    </div>
  );
}

// ═══ SUCCESS ═════════════════════════════════════════════════
function SuccessScreen({ onClose }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 28px", textAlign:"center",
      animation:"ifFadeIn 0.35s ease both",
      background:`linear-gradient(160deg,${T.teal}12,${T.teal}04,#fff)`,
    }}>
      <div style={{ fontSize:60, marginBottom:20,
        filter:`drop-shadow(0 4px 20px ${T.teal}50)` }}>💚</div>
      <h2 style={{ margin:"0 0 10px", fontSize:24, fontWeight:900,
        color:T.ink, letterSpacing:"-0.025em" }}>
        Bewerbung eingereicht!
      </h2>
      <p style={{ margin:"0 0 28px", fontSize:15, color:T.ink2,
        lineHeight:1.7, maxWidth:300 }}>
        Das HUI-Team prüft dein Herzensprojekt und meldet sich bald.
        Danke, dass du Wirkung schaffen möchtest. 🌍
      </p>
      <div style={{
        background:`${T.teal}10`, border:`1px solid ${T.teal}22`,
        borderRadius:16, padding:"14px 20px", maxWidth:260, marginBottom:28,
      }}>
        {["✓ Bewerbung erhalten","✓ KI-Prüfung bestanden","✓ HUI-Team wurde informiert"]
          .map((line,i) => (
            <div key={i} style={{ fontSize:13, fontWeight:700,
              color:T.teal, padding:"3px 0" }}>{line}</div>
        ))}
      </div>
      <button onClick={onClose} style={{
        padding:"14px 36px", borderRadius:18, border:"none",
        background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
        color:"#fff", fontSize:15, fontWeight:800,
        cursor:"pointer", boxShadow:S.btn(T.teal),
      }}>Super ✓</button>
    </div>
  );
}

// ═══ HAUPT-ORCHESTRATOR ═══════════════════════════════════════
export default function ImpactFlow({ onClose }) {
  const { user } = useAuth();
  const [step,    setStep]    = useState(0); // 0-5 = Steps, 6 = KI, 7 = Ergebnis
  const [aiRes,   setAiRes]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);

  const [form, setForm] = useState({
    name:"", satz:"", problem:"", kategorie:"", umsetzung:"", foerder:"",
  });
  const update = useCallback(patch => setForm(f => ({...f,...patch})), []);

  const goNext = useCallback(() => setStep(s => s+1), []);
  const goBack = useCallback(() => {
    if (step === 0) onClose?.();
    else if (step === 6 || step === 7) setStep(5); // zurück von KI/Ergebnis
    else setStep(s => s-1);
  }, [step, onClose]);

  // Supabase Submit
  const handleSubmit = useCallback(async () => {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const { error: dbErr } = await supabase.from("impact_applications").insert({
        user_id:       user.id,
        project_name:  form.name.trim(),
        short_desc:    form.satz.trim(),
        problem:       form.problem.trim(),
        vision:        form.umsetzung.trim(),
        funding_goal:  form.foerder ? parseInt(form.foerder, 10) : null,
        funding_use:   form.umsetzung.trim(),
        contact_email: user.email || "",
        status:        "pending",
        submitted_at:  new Date().toISOString(),
        // extra
        category:      form.kategorie,
        ai_score:      aiRes?.wirkung || 0,
        ai_geeignet:   aiRes?.geeignet ?? false,
      });
      if (dbErr) throw dbErr;
      setDone(true);
    } catch(e) {
      setError(e.message || "Fehler beim Absenden");
    } finally { setSaving(false); }
  }, [user, form, aiRes]);

  // Overlay
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9500,
      background:"rgba(14,14,24,0.52)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"16px",
      animation:"ifFadeIn 0.2s ease both",
    }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <style>{CSS}</style>
      <div style={{
        width:"100%", maxWidth:500,
        background:T.surfaceHi,
        borderRadius:24,
        boxShadow:"0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        maxHeight:"92vh",
        display:"flex", flexDirection:"column",
        overflow:"hidden",
        animation:"ifModalIn 0.26s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* ── Done ── */}
        {done && <SuccessScreen onClose={onClose} />}

        {/* ── Steps 0-5 ── */}
        {!done && step === 0 && <Step1 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 1 && <Step2 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 2 && <Step3 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 3 && <Step4 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 4 && <Step5 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 5 && <Step6 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}

        {/* ── KI-Prüfung ── */}
        {!done && step === 6 && (
          <AIPruefung form={form} onResult={res => { setAiRes(res); setStep(7); }} />
        )}

        {/* ── Ergebnis ── */}
        {!done && step === 7 && aiRes?.geeignet && (
          <ErgebnisGeeignet form={form} onSubmit={handleSubmit}
            onClose={onClose} saving={saving} error={error} />
        )}
        {!done && step === 7 && aiRes && !aiRes.geeignet && (
          <ErgebnisNichtGeeignet form={form} onClose={onClose}
            onRetry={() => { setStep(0); setAiRes(null); }}
            grund={aiRes.grund} />
        )}
      </div>
    </div>
  );
}

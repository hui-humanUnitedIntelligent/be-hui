// src/system/flows/impact/ImpactFlow.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Herzensprojekt Bewerbungsassistent v3
// 6 Steps + HUI-Fit-Score + Wirkungsnetzwerk-Zustimmung + Hall-of-Impact-Datenstruktur
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from "react";
import { supabase }  from "../../../lib/supabaseClient.js";
import { useAuth }   from "../../../lib/AuthContext.jsx";

// ── Design Tokens ─────────────────────────────────────────────
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
  card: "0 2px 16px rgba(0,0,0,0.06)",
  btn:  (c) => `0 6px 20px ${c}38`,
};

// ── Kategorien ────────────────────────────────────────────────
const KATEGORIEN = [
  { id:"bildung",      emoji:"📚", label:"Bildung"       },
  { id:"umwelt",       emoji:"🌿", label:"Umwelt"        },
  { id:"gesundheit",   emoji:"💊", label:"Gesundheit"    },
  { id:"gemeinschaft", emoji:"🤝", label:"Gemeinschaft"  },
  { id:"tiere",        emoji:"🐾", label:"Tiere"         },
  { id:"kultur",       emoji:"🎨", label:"Kultur"        },
  { id:"soziales",     emoji:"❤️", label:"Soziales"      },
  { id:"sonstiges",    emoji:"✨", label:"Sonstiges"     },
];

// ── HUI-Fit-Score Berechnung (0–100) ──────────────────────────
function calcHuiFitScore(form) {
  const allText = [
    form.name, form.satz, form.problem, form.umsetzung,
    form.foerder_verwendung || '', form.warum || '',
  ].join(" ").toLowerCase();

  // ════════════════════════════════════════════════════════════════
  // STUFE 1 — SOFORT-ABBRUCH: Klare Ausschlusskriterien
  // ════════════════════════════════════════════════════════════════

  // Rein privat / persönlich
  const RED_PERSONAL = [
    // Fahrzeuge
    "mein auto","mein fahrrad","mein motorrad",
    // Immobilien
    "meine wohnung","mein haus","mein zimmer","mein apartment",
    "wohnung kaufen","haus kaufen",
    // Außenbereiche & Wohnobjekte privat
    "mein garten","meinen garten","meiner garten","meinem garten",
    "mein balkon","meinen balkon","meinem balkon",
    "meine terrasse","meiner terrasse",
    "mein fenster","meinem fenster","meines fensters","mein grundstück",
    "meine küche","mein bad","mein schlafzimmer","mein wohnzimmer",
    "mein büro","mein keller","mein dachboden",
    // Schulden & Finanzen
    "meine schulden","hochzeit finanzieren","urlaub finanzieren",
    // Reiner Ich-Fokus — ERWEITERT
    "für mich allein","für mich selbst","für mich persönlich",
    "meinen alltag","meinem alltag","meinen eigenen alltag",
    "mein alltag","meines alltags",
    "meinem leben","mein leben schöner","mein leben besser",
    "mein eigenes","nur für mich","gehört mir",
    "mehr freude in meinen","mehr farbe in meinen","mehr farbe in meinem",
    "meinen alltag zu","in meinen alltag","bunte akzente","farbtupfer",
    "meinen alltag fröhlicher","meinem alltag farbe","meinen alltag bunter",
  ];
  // Kommerziell / nicht gemeinnützig
  const RED_COMMERCIAL = [
    "rendite","investor","startup kapital","kryptowährung","mlm",
    "network marketing","politische partei","eigene firma gründen",
  ];

  const hitPersonal   = RED_PERSONAL.filter(kw => allText.includes(kw)).length;
  const hitCommercial = RED_COMMERCIAL.filter(kw => allText.includes(kw)).length;

  if (hitPersonal >= 1)   return 8;   // 1 Treffer reicht bei privaten Phrasen
  if (hitCommercial >= 1) return 12;

  // ════════════════════════════════════════════════════════════════
  // STUFE 2 — VAGHEITS-STRAFE: Unklare / planlose Sprache
  // ════════════════════════════════════════════════════════════════
  const VAGUE_PHRASES = [
    "irgendwie","irgendwas","irgendwann","irgendwo",
    "ein bisschen","ein paar sachen","ein paar dinge",
    "nicht genau weiß","weiß nicht genau","nicht sicher",
    "einfach ausprobieren","mal schauen","schauen ob",
    "hoffe dass","hoffe es","vielleicht","könnte sein",
    "wäre schön","würde gern","so etwas","im großen und ganzen",
    "irgendwie schöner","irgendwie besser","irgendwie helfen",
  ];
  const vagueHits = VAGUE_PHRASES.filter(kw => allText.includes(kw)).length;

  // Bei massiver Vagheit → direkt ablehnen
  if (vagueHits >= 5) return 10;  // erst bei sehr vielen vagen Phrasen ablehnen

  // ════════════════════════════════════════════════════════════════
  // STUFE 3 — PFLICHT: Zielgruppe & Gemeinwohl nachweisen
  // ════════════════════════════════════════════════════════════════
  // Ohne klare Zielgruppe oder Gemeinwohl-Bezug max. Score 35
  const ZIELGRUPPE = [
    "kinder","jugendliche","senioren","obdachlose","geflüchtete",
    "alleinerziehende","menschen mit behinderung","schüler","studierende",
    "nachbarn","gemeinschaft","bevölkerung","öffentlichkeit","alle",
    "bedürftige","patienten","betroffene","familien","bewohner",
    "menschen","personen","nutzer","teilnehmer","nutzerinnen","benutzer",
  ];
  const GEMEINWOHL = [
    "gemeinnützig","ehrenamtlich","kostenfrei","kostenlos","öffentlich",
    "gemeinsam","zusammen","füreinander","solidarisch","nachhaltig",
    "gesellschaft","sozial","wirkung","mehrwert","gemeinwohl",
    "verein","initiative","projekt für andere","anderen helfen",
    "unterstützen","hilft","helfen","befähigen","stärken","ermöglichen","erleichtern",
  ];

  const hasZielgruppe = ZIELGRUPPE.some(kw => allText.includes(kw));
  const hasGemeinwohl = GEMEINWOHL.some(kw => allText.includes(kw));

  // Kein Gemeinwohl UND keine Zielgruppe → rein privat → ablehnen
  if (!hasZielgruppe && !hasGemeinwohl) return 22;

  // ════════════════════════════════════════════════════════════════
  // STUFE 4 — POSITIV-SCORING: HUI-Mission Keywords
  // (nur wenn Grundbedingungen erfüllt)
  // ════════════════════════════════════════════════════════════════
  const HUI_MISSION = [
    // Punkte reduziert — aber gute Projekte mit vielen echten Keywords kommen durch
    { kws:["gemeinschaft","nachbarschaft","verein","quartier","dorf","ehrenamt","freiwillig","gemeinnützig","bürgerschaft"], pts:12 },
    { kws:["bildung","schule","lernen","workshop","training","wissen","kinder","jugend","schüler","ausbildung","förder"],     pts:12 },
    { kws:["umwelt","klima","solar","recycling","nachhaltig","ökologisch","co2","artenvielfalt","meer","wald","energie"],     pts:11 },
    { kws:["gesundheit","pflege","therapie","sport","bewegung","ernährung","mental","wohlbefinden","prävention"],             pts:10 },
    { kws:["kunst","musik","kultur","kreativität","theater","tanz","design","handwerk","literatur","festival"],               pts:9 },
    { kws:["inklusion","barrierefreiheit","vielfalt","integration","teilhabe","gleichberechtigung"],                          pts:10 },
    { kws:["gesellschaft","sozial","öffentlich","kostenlos","gemeinwohl","mehrwert","wirkung"],                               pts:9 },
    { kws:["tier","tierschutz","tierwohl","tierheim","wildtier","fauna"],                                                     pts:9 },
    { kws:["senioren","obdachlos","geflüchtet","alleinerziehend","armut","bedürftig","benachteiligt"],                        pts:10 },
    { kws:["methode","tool","werkzeug","app","plattform","digital","programm","kurs","training","coaching","begleitung"], pts:9 },
    { kws:["veränderung","entwicklung","wachstum","orientierung","klarheit","entscheidung","stärke","selbstwirksamkeit"], pts:9 },
  ];

  let baseScore = 28; // Weicher Basis — gute Projekte kommen leichter durch

  for (const group of HUI_MISSION) {
    const hits = group.kws.filter(kw => allText.includes(kw)).length;
    // Faire Staffelung: 1 Keyword = 30%, 2 = 55%, 3 = 80%, 4+ = 100%
    if (hits >= 4)       baseScore += group.pts;
    else if (hits === 3) baseScore += Math.round(group.pts * 0.85);
    else if (hits === 2) baseScore += Math.round(group.pts * 0.65);
    else if (hits === 1) baseScore += Math.round(group.pts * 0.40);
  }

  // ── Vagheits-Abzug ────────────────────────────────────────────
  baseScore -= vagueHits * 5; // -5 pro vager Phrase (weicher)

  // ── Kategorie-Bonus ───────────────────────────────────────────
  const KAT_BONUS = { bildung:5, umwelt:5, gesundheit:4, gemeinschaft:4, tiere:4, kultur:3, soziales:5 };
  baseScore += KAT_BONUS[form.kategorie] || 0;

  // ── Vollständigkeits-Bonus — nur bei echter inhaltlicher Tiefe ──
  const fields = [form.name, form.satz, form.problem, form.umsetzung];
  const filled  = fields.filter(v => (v||"").trim().length > 60).length;
  baseScore += filled * 2; // max +8 bei vollständigen Feldern

  return Math.min(100, Math.max(0, baseScore));
}

// ── bewerteProjekt ────────────────────────────────────────────
function bewerteProjekt(form) {
  const score     = calcHuiFitScore(form);
  const satz      = (form.satz      || "").trim();
  const problem   = (form.problem   || "").trim();
  const umsetzung = (form.umsetzung || "").trim();
  const allText   = [form.name, satz, problem, umsetzung].join(" ").toLowerCase();

  // Mindestlänge
  if (satz.length < 10 || problem.length < 10 || umsetzung.length < 10) {
    return { geeignet: false, grund: "zu_kurz", score };
  }

  // Schwelle: 35 — private/vage Projekte sind bereits auf 8–22 gecappt (nie erreichbar)
  // echte Projekte mit mehreren relevanten Keywords kommen ab 35 durch
  if (score >= 28) {
    return {
      geeignet: true,
      score,
      routing: score >= 70 ? "direkt" : "manuell",
      wirkung: Math.round(score / 20),
    };
  }

  // Ablehnungsgrund bestimmen
  const RED_PERSONAL = [
    "mein auto","mein fahrrad","meine wohnung","mein haus","mein zimmer",
    "wohnung kaufen","haus kaufen",
    "mein garten","meinen garten","meinem garten",
    "mein balkon","meinen balkon","meinem balkon",
    "meine terrasse","meiner terrasse",
    "mein fenster","meinem fenster",
    "meine küche","mein bad","mein schlafzimmer","mein wohnzimmer",
    "meinen alltag","meinem alltag","in meinem alltag","mein alltag",
    "mehr freude in meinen","mehr farbe in meinen","mehr farbe in meinem",
    "bunte akzente","farbtupfer","meinen alltag fröhlicher","meinen alltag bunter",
    "meine schulden","hochzeit finanzieren","urlaub finanzieren",
    "für mich allein","für mich selbst","für mich persönlich","nur für mich",
  ];
  const RED_COMMERCIAL = ["rendite","investor gesucht","startup kapital","kryptowährung","mlm"];
  const VAGUE_CHECK    = ["irgendwie","irgendwas","nicht genau weiß","einfach ausprobieren","hoffe dass","mal schauen"];

  if (RED_PERSONAL.some(kw => allText.includes(kw)))              return { geeignet: false, grund: "persoenlich",   score };
  if (RED_COMMERCIAL.some(kw => allText.includes(kw)))            return { geeignet: false, grund: "kommerziell",   score };
  if (VAGUE_CHECK.filter(kw => allText.includes(kw)).length >= 2) return { geeignet: false, grund: "zu_vage",       score };

  // Kein Gemeinwohl erkennbar
  const GEMEINWOHL = ["gemeinnützig","ehrenamtlich","kostenlos","öffentlich","gesellschaft","sozial","gemeinwohl","wirkung","andere","anderen"];
  if (!GEMEINWOHL.some(kw => allText.includes(kw))) return { geeignet: false, grund: "kein_hui_bezug", score };

  return { geeignet: false, grund: "zu_vage", score };
}

// ── Animations-CSS ────────────────────────────────────────────
const CSS = `
  @keyframes ifFadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes ifModalIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
  @keyframes ifPulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes ifSpin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ifShake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes ifGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(13,196,181,0)} 50%{box-shadow:0 0 28px 6px rgba(13,196,181,0.18)} }
  @keyframes ifScoreUp { from{width:0%} to{width:var(--w)} }
  .hui-input  { width:100%; padding:16px 18px; border-radius:16px;
    border:2px solid rgba(20,20,34,0.10); background:#FFFFFF;
    font-size:16px; color:#141422; outline:none; font-family:inherit;
    box-sizing:border-box; transition:border-color 0.18s,box-shadow 0.18s;
    -webkit-appearance:none; }
  .hui-input:focus { border-color:#0DC4B5; box-shadow:0 0 0 3px rgba(13,196,181,0.14); }
  .hui-textarea { resize:none; line-height:1.65; min-height:110px; }
  .hui-chip { cursor:pointer; transition:all 0.15s ease; -webkit-tap-highlight-color:transparent; }
  .hui-chip:active { transform:scale(0.95); }
  .hui-next { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .hui-cb input[type=checkbox] { width:20px; height:20px; accent-color:#0DC4B5;
    cursor:pointer; flex-shrink:0; margin:0; }
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
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"16px 20px 14px", flexShrink:0,
        borderBottom:`1px solid ${T.line}`,
      }}>
        <button onClick={onBack} style={{
          width:34, height:34, borderRadius:"50%",
          background:"rgba(20,20,34,0.06)", border:"none",
          cursor:"pointer", fontSize:18, color:T.ink2,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
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
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>✕</button>
      </div>
      <div style={{
        flex:1, overflowY:"auto", padding:"28px 24px 24px",
        WebkitOverflowScrolling:"touch", display:"flex", flexDirection:"column",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── CTA Button ────────────────────────────────────────────────
function NextBtn({ label="Weiter →", onClick, disabled, loading }) {
  return (
    <button className="hui-next" onClick={() => !disabled && !loading && onClick?.()}
      style={{
        width:"100%", height:56, borderRadius:18, border:"none",
        background: disabled || loading ? "rgba(20,20,34,0.08)"
          : `linear-gradient(135deg,${T.teal},${T.tealL})`,
        color: disabled || loading ? T.ink4 : "#fff",
        fontSize:16, fontWeight:800,
        cursor: disabled || loading ? "default" : "pointer",
        boxShadow: disabled || loading ? "none" : S.btn(T.teal),
        transition:"all 0.2s ease",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        opacity: disabled ? 0.55 : 1, marginTop:"auto", flexShrink:0,
      }}>
      {loading
        ? <span style={{ width:22, height:22, border:`3px solid rgba(255,255,255,0.3)`,
            borderTopColor:"#fff", borderRadius:"50%",
            animation:"ifSpin 0.7s linear infinite", display:"inline-block" }}/>
        : label}
    </button>
  );
}

// ═══ STEP 1–6 (unverändert) ═══════════════════════════════════
function Step1({ form, update, onNext, onBack, onClose }) {
  const ok = (form.name || "").trim().length >= 3;
  return (
    <StepWrap step={0} total={7} onBack={onBack} onClose={onClose} label="Schritt 1 von 7">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🌱</div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight:900, color:T.ink,
          letterSpacing:"-0.025em", lineHeight:1.2 }}>Wie heißt dein Projekt?</h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Gib deinem Herzensprojekt einen Namen. Der Name ist das Erste, was die Community sieht.
        </p>
        <input className="hui-input" type="text"
          placeholder="z. B. Gemüsegarten für die Nachbarschaft"
          value={form.name || ""} onChange={e => update({ name: e.target.value })}
          maxLength={80} autoFocus />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right", marginTop:6, marginBottom:28 }}>
          {(form.name||"").length} / 80</div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

function Step2({ form, update, onNext, onBack, onClose }) {
  const ok = (form.satz || "").trim().length >= 15;
  return (
    <StepWrap step={1} total={7} onBack={onBack} onClose={onClose} label="Schritt 2 von 7">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>💬</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em", lineHeight:1.2 }}>Beschreibe dein Projekt in einem Satz.</h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Was ist die Kernidee? Klar und verständlich — als würdest du es einem Freund erklären.
        </p>
        <textarea className="hui-input hui-textarea"
          placeholder="z. B. Wir legen einen kostenlosen Gemüsegarten für alle Bewohner unseres Viertels an."
          value={form.satz || ""} onChange={e => update({ satz: e.target.value })}
          maxLength={200} rows={4} />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right", marginTop:6, marginBottom:28 }}>
          {(form.satz||"").length} / 200</div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

function Step3({ form, update, onNext, onBack, onClose }) {
  const ok = (form.problem || "").trim().length >= 20;
  return (
    <StepWrap step={2} total={7} onBack={onBack} onClose={onClose} label="Schritt 3 von 7">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🎯</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em", lineHeight:1.2 }}>Welches Problem löst dein Projekt?</h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Was ist die eigentliche Herausforderung, die dein Projekt angeht?
        </p>
        <textarea className="hui-input hui-textarea"
          placeholder="z. B. In unserem Viertel gibt es kaum Grünflächen. Kinder haben keinen Zugang zu Natur."
          value={form.problem || ""} onChange={e => update({ problem: e.target.value })}
          maxLength={400} rows={5} />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right", marginTop:6, marginBottom:28 }}>
          {(form.problem||"").length} / 400</div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

function Step4({ form, update, onNext, onBack, onClose }) {
  const ok = !!form.kategorie;
  return (
    <StepWrap step={3} total={7} onBack={onBack} onClose={onClose} label="Schritt 4 von 7">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🤝</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em", lineHeight:1.2 }}>Wer profitiert davon?</h2>
        <p style={{ margin:"0 0 24px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Wähle den Bereich, der am besten zu deinem Projekt passt.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
          {KATEGORIEN.map(k => {
            const sel = form.kategorie === k.id;
            return (
              <button key={k.id} className="hui-chip" onClick={() => update({ kategorie: k.id })}
                style={{
                  display:"flex", alignItems:"center", gap:10, padding:"13px 14px",
                  background: sel ? `${T.teal}15` : T.surfaceHi,
                  border: sel ? `2px solid ${T.teal}` : `2px solid ${T.line}`,
                  borderRadius:16, cursor:"pointer",
                  boxShadow: sel ? `0 0 0 3px ${T.teal}18` : S.card,
                  transition:"all 0.15s ease",
                }}>
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

function Step5({ form, update, onNext, onBack, onClose }) {
  const ok = (form.umsetzung || "").trim().length >= 20;
  return (
    <StepWrap step={4} total={7} onBack={onBack} onClose={onClose} label="Schritt 5 von 7">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🚀</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em", lineHeight:1.2 }}>Was wird konkret umgesetzt?</h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Was würde konkret mit der Förderung passieren? Je konkreter, desto besser.
        </p>
        <textarea className="hui-input hui-textarea"
          placeholder="z. B. Wir kaufen Hochbeete, Erde und Saatgut. Wir organisieren monatliche Gartentage."
          value={form.umsetzung || ""} onChange={e => update({ umsetzung: e.target.value })}
          maxLength={500} rows={5} />
        <div style={{ fontSize:11, color:T.ink3, textAlign:"right", marginTop:6, marginBottom:28 }}>
          {(form.umsetzung||"").length} / 500</div>
        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

// ═══ STEP 5b — MEILENSTEINE (zwischen "Was wird umgesetzt" und "Fördersumme") ═══
function Step5b({ milestones, setMilestones, onNext, onBack, onClose, userId }) {
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileRefs = React.useRef({});

  const addMilestone = () => {
    if (milestones.length >= 5) return;
    setMilestones(prev => [...prev, { title: "", description: "", planned_date: "", media_urls: [] }]);
  };
  const removeMilestone = (i) => {
    if (milestones.length <= 1) return;
    setMilestones(prev => prev.filter((_, idx) => idx !== i));
  };
  const updateMilestone = (i, patch) => {
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m));
  };

  // ── Medien-Upload pro Meilenstein (max 2 Dateien) ───────────
  const uploadMedia = async (i, files) => {
    if (!files?.length) return;
    const m = milestones[i];
    const currentUrls = m.media_urls || [];
    if (currentUrls.length >= 2) return;
    setUploadingIdx(i);
    const urls = [...currentUrls];
    for (const file of Array.from(files)) {
      if (urls.length >= 2) break;
      try {
        const ext  = file.name.split(".").pop();
        const path = `milestones/${userId || "anon"}/${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
        const { error } = await supabase.storage
          .from("media")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (!error) {
          const { data: urlData } = supabase.storage
            .from("media")
            .getPublicUrl(path);
          urls.push({ url: urlData.publicUrl, name: file.name, type: file.type });
        }
      } catch { /* einzelne Datei skippen */ }
    }
    updateMilestone(i, { media_urls: urls });
    setUploadingIdx(null);
  };

  const removeMedia = (i, mi) => {
    updateMilestone(i, { media_urls: (milestones[i].media_urls || []).filter((_, idx) => idx !== mi) });
  };

  const getFileIcon = (type = "") => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎬";
    return "📎";
  };

  // Mindestens 1 Meilenstein mit ausgefülltem Titel required
  const validCount = milestones.filter(m => (m.title || "").trim().length > 0).length;
  const ok = validCount >= 1;

  return (
    <StepWrap step={5} total={7} onBack={onBack} onClose={onClose} label="Schritt 6 von 7">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🏁</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em", lineHeight:1.2 }}>Meilensteine definieren</h2>
        <p style={{ margin:"0 0 20px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Welche konkreten Etappen planst du? Lege mindestens einen Meilenstein an (maximal 5).
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20, overflowY:"auto", maxHeight:380 }}>
          {milestones.map((m, i) => (
            <div key={i} style={{
              background:"rgba(13,196,181,0.06)", borderRadius:14, padding:14,
              border:"1px solid rgba(13,196,181,0.18)"
            }}>
              {/* Zeile 1: Nummer + Titel + Löschen */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ width:22, height:22, borderRadius:"50%",
                  background:T.teal, color:"white", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:800, flexShrink:0 }}>{i + 1}</div>
                <input
                  className="hui-input"
                  placeholder={`Meilenstein ${i + 1} — Titel (Pflichtfeld)`}
                  value={m.title}
                  onChange={e => updateMilestone(i, { title: e.target.value })}
                  maxLength={80}
                  style={{ flex:1, fontSize:13, padding:"8px 12px", margin:0 }}
                />
                {milestones.length > 1 && (
                  <button onClick={() => removeMilestone(i)}
                    style={{ width:24, height:24, borderRadius:"50%", border:"none",
                      background:"rgba(231,76,60,0.12)", color:"#e74c3c",
                      fontSize:14, cursor:"pointer", flexShrink:0, display:"flex",
                      alignItems:"center", justifyContent:"center" }}>✕</button>
                )}
              </div>

              {/* Zeile 2: Beschreibung (optional) */}
              <textarea
                className="hui-input hui-textarea"
                placeholder="Beschreibung (optional)"
                value={m.description}
                onChange={e => updateMilestone(i, { description: e.target.value })}
                rows={2}
                maxLength={500}
                style={{ fontSize:12, padding:"8px 12px", margin:"0 0 8px", resize:"none" }}
              />
              <div style={{ fontSize:10, color:T.ink3, textAlign:"right", marginBottom:8 }}>
                {(m.description||"").length} / 500</div>

              {/* Zeile 3: Geplante Umsetzung (Monatsauswahl) */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.teal,
                  letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>
                  Geplante Umsetzung
                </div>
                <input
                  className="hui-input"
                  type="month"
                  value={m.planned_date || ""}
                  onChange={e => updateMilestone(i, { planned_date: e.target.value })}
                  style={{ fontSize:13, padding:"8px 12px", margin:0 }}
                />
              </div>

              {/* Zeile 4: Bild/Video Upload (optional, max 2) */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.ink3,
                  letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>
                  Bild / Video <span style={{ color:T.ink4, fontWeight:400 }}>(optional, max. 2)</span>
                </div>

                {/* Schon hochgeladene Medien */}
                {(m.media_urls || []).length > 0 && (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                    {m.media_urls.map((att, mi) => (
                      <div key={mi} style={{
                        position:"relative", width:56, height:56, borderRadius:10,
                        overflow:"hidden", border:"1px solid rgba(13,196,181,0.20)",
                      }}>
                        {att.type?.startsWith("image/") ? (
                          <img loading="lazy" decoding="async" src={att.url} alt={att.name}
                            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        ) : (
                          <div style={{
                            width:"100%", height:"100%", background:"rgba(114,100,214,0.10)",
                            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                          }}>{getFileIcon(att.type)}</div>
                        )}
                        <button onClick={() => removeMedia(i, mi)} style={{
                          position:"absolute", top:2, right:2,
                          width:18, height:18, borderRadius:"50%",
                          background:"rgba(0,0,0,0.55)", border:"none", color:"#fff",
                          fontSize:10, cursor:"pointer", display:"flex",
                          alignItems:"center", justifyContent:"center", padding:0,
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload-Button (nur anzeigen wenn < 2 Dateien) */}
                {(m.media_urls || []).length < 2 && (
                  <>
                    <button
                      onClick={() => !uploadingIdx && uploadingIdx !== 0 && fileRefs.current[i]?.click()}
                      disabled={uploadingIdx === i}
                      style={{
                        width:"100%", padding:"8px", borderRadius:10,
                        border:"1.5px dashed rgba(114,100,214,0.40)",
                        background:"rgba(114,100,214,0.04)",
                        cursor: uploadingIdx === i ? "default" : "pointer",
                        color:T.violet, fontSize:12, fontWeight:700, fontFamily:"inherit",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}
                    >
                      {uploadingIdx === i ? "⏳ Lädt hoch…" : "📎 Bild/Video hinzufügen"}
                    </button>
                    <input
                      ref={el => { fileRefs.current[i] = el; }}
                      type="file"
                      accept="image/*,video/*"
                      style={{ display:"none" }}
                      onChange={e => { uploadMedia(i, e.target.files); e.target.value = ""; }}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {milestones.length < 5 && (
          <button onClick={addMilestone}
            style={{ width:"100%", padding:"10px", borderRadius:12,
              border:"1.5px dashed rgba(13,196,181,0.5)",
              background:"transparent", color:T.teal,
              fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:16,
              fontFamily:"inherit" }}>
            + Meilenstein hinzufügen
          </button>
        )}

        {!ok && (
          <div style={{ fontSize:12, color:T.coral, textAlign:"center",
            marginBottom:10, padding:"8px 12px",
            background:"rgba(244,113,79,0.06)", borderRadius:10 }}>
            Bitte mindestens einen Meilenstein mit Titel anlegen.
          </div>
        )}

        <NextBtn label="Weiter →" onClick={onNext} disabled={!ok} />
      </div>
    </StepWrap>
  );
}

function Step6({ form, update, onNext, onBack, onClose }) {
  const raw = (form.foerder || "").replace(/\D/g,"");
  const val = raw ? parseInt(raw, 10) : 0;
  const ok  = val >= 100 && val <= 50000;
  const fmtDisplay = (str) => {
    const n = str.replace(/\D/g,"");
    return n ? parseInt(n,10).toLocaleString("de-DE") : "";
  };
  return (
    <StepWrap step={6} total={7} onBack={onBack} onClose={onClose} label="Schritt 7 von 7">
      <div style={{ animation:"ifFadeIn 0.28s ease both", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>💶</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em", lineHeight:1.2 }}>Welche Fördersumme wünschst du dir?</h2>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.65 }}>
          Wie viel Euro würde dein Projekt benötigen, um vollständig umgesetzt zu werden?
        </p>
        <div style={{ position:"relative", marginBottom:10 }}>
          <span style={{ position:"absolute", left:18, top:"50%", transform:"translateY(-50%)",
            fontSize:20, fontWeight:700, color:T.teal, pointerEvents:"none" }}>€</span>
          <input className="hui-input" type="text" inputMode="numeric" placeholder="2.000"
            value={fmtDisplay(form.foerder || "")}
            onChange={e => update({ foerder: e.target.value.replace(/\D/g,"") })}
            style={{ paddingLeft:38, fontSize:22, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }} />
        </div>
        {(form.foerder && !ok) && (
          <div style={{ fontSize:12, color:T.coral, marginBottom:12 }}>
            {val < 100 ? "Bitte mindestens €100 angeben." : "Maximal €50.000 pro Bewerbung möglich."}
          </div>
        )}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
          {[500,1000,2000,5000,10000].map(v => (
            <button key={v} className="hui-chip" onClick={() => update({ foerder: String(v) })}
              style={{ padding:"7px 14px", borderRadius:99, border:"none",
                background: val===v ? T.teal : `${T.teal}12`,
                color: val===v ? "#fff" : T.teal, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              €{v.toLocaleString("de-DE")}</button>
          ))}
        </div>
        <NextBtn label="KI-Prüfung starten →" onClick={onNext} disabled={!ok} />
        <p style={{ margin:"10px 0 0", textAlign:"center", fontSize:11, color:T.ink3 }}>
          ✓ Bewerbung kostenlos · ✓ Dauer ~2 Min. · ✓ Kein Projekt geht leer aus
        </p>
      </div>
    </StepWrap>
  );
}

// ═══ KI-PRÜFUNG — Ladescreen (erweitert: HUI-Fit-Score) ══════
function AIPruefung({ form, onResult }) {
  const [phase, setPhase] = useState(0);
  const PHASEN = [
    { icon:"🔍", text:"Wirkung analysieren …"        },
    { icon:"🤝", text:"Gemeinwohl prüfen …"           },
    { icon:"⚙️", text:"Umsetzbarkeit bewerten …"     },
    { icon:"🛡️", text:"Vertrauenswürdigkeit prüfen …"},
    { icon:"💚", text:"HUI-Fit-Score berechnen …"    },
    { icon:"✨", text:"Ergebnis berechnen …"          },
  ];
  useEffect(() => {
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      setPhase(p => Math.min(p+1, PHASEN.length-1));
      if (idx >= PHASEN.length) {
        clearInterval(iv);
        setTimeout(() => onResult(bewerteProjekt(form)), 500);
      }
    }, 560);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line
  const pct = Math.round((phase / (PHASEN.length - 1)) * 100);
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"40px 28px",
      animation:"ifFadeIn 0.3s ease both" }}>
      <div style={{ width:84, height:84, borderRadius:"50%",
        border:`3px solid ${T.teal}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:32, marginBottom:28,
        boxShadow:`0 0 0 12px ${T.teal}12`,
        animation:"ifGlow 2s ease-in-out infinite" }}>🧠</div>
      <h3 style={{ margin:"0 0 6px", fontSize:20, fontWeight:900, color:T.ink,
        letterSpacing:"-0.02em" }}>HUI-KI prüft dein Projekt</h3>
      <p style={{ margin:"0 0 28px", fontSize:13, color:T.ink2 }}>Einen Moment bitte …</p>
      <div style={{ width:"100%", maxWidth:280, height:5, borderRadius:99,
        background:T.line, marginBottom:16, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:99, width:`${pct}%`,
          background:`linear-gradient(90deg,${T.teal},${T.tealL})`,
          transition:"width 0.5s ease" }}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8,
        fontSize:14, color:T.teal, fontWeight:700, minHeight:28 }}>
        <span>{PHASEN[phase].icon}</span>
        <span>{PHASEN[phase].text}</span>
      </div>
      <div style={{ marginTop:32, display:"flex", flexDirection:"column",
        gap:10, width:"100%", maxWidth:280 }}>
        {["Wirkung","Gemeinwohl","Umsetzbarkeit","Vertrauenswürdigkeit","HUI-Fit-Score"].map((k,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
            opacity: phase > i ? 1 : 0.28, transition:"opacity 0.4s ease" }}>
            <div style={{ width:20, height:20, borderRadius:"50%",
              background: phase > i ? T.teal : T.line,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, color:"#fff", fontWeight:800,
              transition:"background 0.3s ease", flexShrink:0 }}>
              {phase > i ? "✓" : i+1}</div>
            <span style={{ fontSize:13, fontWeight: phase > i ? 700 : 400,
              color: phase > i ? T.ink : T.ink3 }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ HUI-FIT-SCORE ANZEIGE ════════════════════════════════════
function FitScoreBar({ score }) {
  const color = score >= 80 ? T.teal : score >= 60 ? T.gold : T.coral;
  const label = score >= 80 ? "Hervorragend" : score >= 60 ? "Gut geeignet" : "Zu gering";
  return (
    <div style={{ background:`${color}08`, border:`1px solid ${color}22`,
      borderRadius:16, padding:"14px 16px", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:12, fontWeight:700, color:T.ink }}>HUI-Fit-Score</span>
        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ fontSize:22, fontWeight:900, color }}>{score}</span>
          <span style={{ fontSize:12, color:T.ink3 }}>/100</span>
        </div>
      </div>
      <div style={{ height:6, borderRadius:99, background:T.line, overflow:"hidden", marginBottom:6 }}>
        <div style={{
          height:"100%", borderRadius:99,
          background:`linear-gradient(90deg,${color}88,${color})`,
          width:`${score}%`, transition:"width 1.2s cubic-bezier(0.22,1,0.36,1)",
        }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between",
        fontSize:11, color }}>
        <span style={{ fontWeight:700 }}>{label}</span>
        {score >= 80 && <span>→ Direkte Weiterleitung</span>}
        {score >= 60 && score < 80 && <span>→ Manuelle Prüfung</span>}
      </div>
    </div>
  );
}

// ═══ WIRKUNGSNETZWERK-ZUSTIMMUNG (Step 8) ════════════════════
const WIRKUNGSNETZ_CHECKS = [
  "Ich bin damit einverstanden, dass mein Projekt bei einer Förderung als offizielles HUI-Impact-Projekt veröffentlicht wird.",
  "Ich bin damit einverstanden, dass HUI über die Entwicklung und Wirkung meines Projekts berichten darf.",
  "Ich verpflichte mich, die Förderung durch HUI auf angemessene Weise sichtbar zu machen (z. B. Website, Social Media, Flyer, Veranstaltungen oder Projektkommunikation).",
  "Ich bin bereit, nach einer Förderung kurze Wirkungsnachweise bereitzustellen (Fotos, Updates oder Berichte).",
];

function WirkungsnetzScreen({ checks, onToggle, onConfirm, onClose }) {
  const allChecked = WIRKUNGSNETZ_CHECKS.every((_, i) => checks[i]);
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 20px 14px", flexShrink:0, borderBottom:`1px solid ${T.line}` }}>
        <div style={{ fontSize:14, fontWeight:800, color:T.ink }}>
          Teil des HUI-Wirkungsnetzwerks
        </div>
        <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%",
          background:"rgba(20,20,34,0.06)", border:"none", cursor:"pointer",
          fontSize:15, color:T.ink3, display:"flex", alignItems:"center",
          justifyContent:"center" }}>✕</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"24px 22px 20px",
        WebkitOverflowScrolling:"touch" }}>
        {/* Erklärung */}
        <div style={{
          background:`linear-gradient(135deg,${T.teal}12,${T.teal}04)`,
          border:`1.5px solid ${T.teal}25`,
          borderRadius:18, padding:"18px 18px", marginBottom:22,
        }}>
          <div style={{ fontSize:18, marginBottom:10 }}>🌍</div>
          <div style={{ fontSize:15, fontWeight:900, color:T.ink,
            marginBottom:8, letterSpacing:"-0.018em" }}>
            Gemeinsam Wirkung sichtbar machen
          </div>
          <p style={{ margin:"0 0 8px", fontSize:13, color:T.ink2, lineHeight:1.7 }}>
            HUI fördert nicht nur Projekte. HUI verbindet Menschen, Ideen und echte Veränderung.
          </p>
          <p style={{ margin:"0 0 8px", fontSize:13, color:T.ink2, lineHeight:1.7 }}>
            Jedes geförderte Projekt wird Teil des <b style={{ color:T.teal }}>HUI-Wirkungsnetzwerks</b> und
            hilft dabei zu zeigen, was gemeinsam möglich ist.
          </p>
          <p style={{ margin:0, fontSize:13, color:T.ink2, lineHeight:1.7 }}>
            Deshalb bitten wir alle geförderten Projekte, ihre Wirkung sichtbar zu machen
            und die Unterstützung durch HUI transparent zu kommunizieren.
          </p>
        </div>

        {/* Checkboxen */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
          {WIRKUNGSNETZ_CHECKS.map((text, i) => (
            <label key={i} className="hui-cb" style={{
              display:"flex", alignItems:"flex-start", gap:12,
              background: checks[i] ? `${T.teal}08` : T.surfaceHi,
              border: `1.5px solid ${checks[i] ? T.teal+"40" : T.line}`,
              borderRadius:14, padding:"13px 14px", cursor:"pointer",
              transition:"all 0.15s ease",
            }}>
              <input type="checkbox" checked={!!checks[i]}
                onChange={() => onToggle(i)} />
              <span style={{ fontSize:13, color:T.ink2, lineHeight:1.6, paddingTop:1 }}>
                {text}
              </span>
            </label>
          ))}
        </div>

        {!allChecked && (
          <div style={{ fontSize:12, color:T.ink3, textAlign:"center",
            marginBottom:12, padding:"8px 12px",
            background:"rgba(20,20,34,0.04)", borderRadius:10 }}>
            Bitte alle Punkte bestätigen, um fortzufahren.
          </div>
        )}

        <button onClick={onConfirm} disabled={!allChecked}
          className="hui-next"
          style={{
            width:"100%", height:54, borderRadius:18, border:"none",
            background: allChecked
              ? `linear-gradient(135deg,${T.teal},${T.tealL})`
              : "rgba(20,20,34,0.08)",
            color: allChecked ? "#fff" : T.ink4,
            fontSize:15, fontWeight:800, cursor: allChecked ? "pointer" : "default",
            boxShadow: allChecked ? S.btn(T.teal) : "none",
            opacity: allChecked ? 1 : 0.6,
            transition:"all 0.2s ease",
            marginBottom:8,
          }}>
          {allChecked ? "Jetzt einreichen ✓" : "Alle Punkte bestätigen"}
        </button>
        <p style={{ margin:0, textAlign:"center", fontSize:11, color:T.ink3 }}>
          ✓ Kostenlos · ✓ Kein Risiko · ✓ Kein Projekt geht leer aus
        </p>
      </div>
    </div>
  );
}

// ═══ ERGEBNIS: GEEIGNET (mit FitScore + Netzwerk-Button) ═════
function ErgebnisGeeignet({ form, aiRes, onNetworkConfirm, onClose }) {
  const score = aiRes?.score || 0;
  const isManual = aiRes?.routing === "manuell";
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column",
      padding:"28px 22px 22px", animation:"ifFadeIn 0.35s ease both", overflowY:"auto" }}>
      <div style={{ textAlign:"center", marginBottom:22 }}>
        <div style={{ fontSize:48, marginBottom:12,
          filter:`drop-shadow(0 4px 16px ${T.teal}44)` }}>🌟</div>
        <div style={{
          display:"inline-block",
          background: isManual ? `${T.gold}15` : `${T.teal}15`,
          border:`1px solid ${isManual ? T.gold+"40" : T.teal+"40"}`,
          borderRadius:99, padding:"5px 16px", fontSize:11, fontWeight:800,
          color: isManual ? T.gold : T.teal, letterSpacing:"0.07em", marginBottom:12,
        }}>
          {isManual ? "MANUELLE PRÜFUNG" : "DIREKTE WEITERLEITUNG"}
        </div>
        <h2 style={{ margin:"0 0 8px", fontSize:21, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em", lineHeight:1.25 }}>
          Dein Projekt sieht vielversprechend aus! 🎉
        </h2>
        <p style={{ margin:0, fontSize:13, color:T.ink2, lineHeight:1.65 }}>
          <b style={{ color:T.ink }}>{form.name}</b> wird{" "}
          {isManual
            ? "zur manuellen Prüfung an das HUI-Team weitergeleitet."
            : "direkt an das HUI-Team weitergeleitet."}
        </p>
      </div>

      {/* HUI-Fit-Score */}
      <FitScoreBar score={score} />

      {/* Zusammenfassung */}
      <div style={{ background:`${T.teal}07`, border:`1px solid ${T.teal}16`,
        borderRadius:16, padding:"14px 16px", marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.teal,
          letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>
          Deine Bewerbung
        </div>
        {[
          { label:"Projekt",      val:form.name },
          { label:"Beschreibung", val:form.satz },
          { label:"Kategorie",    val:KATEGORIEN.find(k=>k.id===form.kategorie)?.label },
          { label:"Förderwunsch", val:`€${parseInt(form.foerder||0).toLocaleString("de-DE")}` },
        ].map((r,i) => (
          <div key={i} style={{ display:"flex", gap:10, padding:"6px 0",
            borderBottom: i < 3 ? `1px solid ${T.teal}10` : "none" }}>
            <span style={{ fontSize:12, color:T.ink3, width:88, flexShrink:0 }}>{r.label}</span>
            <span style={{ fontSize:12, fontWeight:700, color:T.ink, lineHeight:1.4, flex:1 }}>{r.val}</span>
          </div>
        ))}
      </div>

      <button onClick={onNetworkConfirm} className="hui-next" style={{
        width:"100%", height:54, borderRadius:18, border:"none",
        background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
        color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
        boxShadow:S.btn(T.teal), marginBottom:8,
      }}>Weiter → Wirkungsnetzwerk</button>
      <button onClick={onClose} style={{ background:"none", border:"none",
        fontSize:13, color:T.ink3, cursor:"pointer", padding:"6px" }}>Abbrechen</button>
    </div>
  );
}

// ═══ ERGEBNIS: NICHT GEEIGNET ════════════════════════════════
function ErgebnisNichtGeeignet({ form, onClose, onRetry, aiRes, user }) {
  const score = aiRes?.score || 0;
  const grund = aiRes?.grund || "zu_vage";

  // ── KI-Ablehnung in Supabase speichern (fire & forget) ──────────────────
  useEffect(() => {
    const saveFailure = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        await supabase.from('impact_score_failures').insert({
          user_id:      user?.id || null,
          project_name: (form.name || "").trim() || "Unbekannt",
          short_desc:   (form.satz || "").trim() || null,
          problem:      (form.problem || "").trim() || null,
          umsetzung:    (form.umsetzung || "").trim() || null,
          kategorie:    form.kategorie || null,
          funding_goal: form.foerder ? parseFloat(form.foerder) : null,
          ai_score:     score,
          grund:        grund,
        });
      } catch (e) {
        // Silent fail — KI-Tracking ist nicht kritisch
        console.warn('[HUI_IMPACT] score failure tracking:', e);
      }
    };
    saveFailure();
  }, []); // eslint-disable-line
  const TEXTE = {
    // Persönlicher Nutzen / private Anschaffung
    persoenlich: {
      emoji:   "🚫",
      badge:   "PERSÖNLICHER NUTZEN",
      titel:   "Dieses Projekt ist nicht für den HUI Impact Pool geeignet.",
      erkl:    "HUI fördert ausschließlich Projekte mit gemeinwohlorientierter Wirkung — für Gemeinschaft, Umwelt, Bildung, Gesundheit oder Kultur.",
      hinweis: "Projekte, die überwiegend dem persönlichen Nutzen dienen (Anschaffungen, Schulden, Reisen etc.), können leider nicht berücksichtigt werden.",
      tipp:    "Hast du ein Projektidee, die anderen Menschen hilft? Dann probiere es erneut!",
    },
    // Kommerziell / nicht HUI-konform
    kommerziell: {
      emoji:   "💼",
      badge:   "KOMMERZIELLES PROJEKT",
      titel:   "Kommerzielle Projekte passen nicht zu HUI.",
      erkl:    "Der HUI Impact Pool ist kein Investitions- oder Startup-Förderprogramm. Er ist für Herzensprojekte mit echtem gesellschaftlichem Mehrwert.",
      hinweis: "Projekte mit Gewinnabsicht, Marketing-Zwecken oder politischem Charakter können nicht aufgenommen werden.",
      tipp:    "Wenn dein Projekt einen echten sozialen Zweck hat, beschreibe diesen klar — dann ist ein neuer Versuch möglich.",
    },
    // Beschreibung zu kurz
    zu_kurz: {
      emoji:   "✏️",
      badge:   "ZU WENIG INFORMATIONEN",
      titel:   "Bitte beschreibe dein Projekt ausführlicher.",
      erkl:    "Das HUI-Team braucht genügend Details, um dein Projekt fair beurteilen zu können.",
      hinweis: "Fülle besonders diese Felder ausführlicher aus: Kurzbeschreibung, Problem & Lösung, Umsetzung.",
      tipp:    "Je konkreter du beschreibst, wer profitiert und wie — desto besser deine Chancen!",
    },
    // Zu vage / allgemeine Formulierungen
    zu_vage: {
      emoji:   "🔍",
      badge:   "NICHT GEEIGNET FÜR HUI",
      titel:   "Dein Projekt braucht noch mehr Profil.",
      erkl:    "Die Beschreibung ist noch zu allgemein für eine Wirkungsbeurteilung.",
      hinweis: "Beschreibe konkret: Wer profitiert? Was genau wird umgesetzt? Welche Wirkung entsteht?",
      tipp:    "Vermeide vage Formulierungen. Echte Zahlen, Orte und Zielgruppen stärken deinen Score.",
    },
    // Kein HUI-Bezug erkennbar
    kein_hui_bezug: {
      emoji:   "🎯",
      badge:   "KEIN HUI-BEZUG",
      titel:   "Dein Projekt passt noch nicht zu HUI.",
      erkl:    "Die Beschreibung lässt keinen klaren Bezug zu den HUI-Förderbereichen erkennen.",
      hinweis: "HUI fördert: Bildung, Umwelt, Gemeinschaft, Gesundheit, Kultur, Tierschutz & soziale Projekte.",
      tipp:    "Wenn dein Projekt in einen dieser Bereiche fällt — beschreibe das explizit und versuche es nochmal.",
    },
    // Legacy-Kompatibilität
    red_flag: {
      emoji:   "🚫",
      badge:   "NICHT GEEIGNET FÜR HUI",
      titel:   "Dieses Projekt passt leider nicht zu HUI.",
      erkl:    "Der HUI Impact Pool ist ausschließlich für Projekte mit messbarer positiver Wirkung für Gemeinschaft, Umwelt, Bildung, Gesundheit oder Kultur.",
      hinweis: "Eigennützige Projekte, Konsumwünsche oder private Anschaffungen können nicht berücksichtigt werden.",
      tipp:    "Hast du eine Idee, die anderen Menschen hilft? Probiere es erneut!",
    },
  };
  const t = TEXTE[grund] || TEXTE.zu_vage;
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column",
      padding:"28px 22px 22px", animation:"ifShake 0.4s ease both, ifFadeIn 0.3s ease both",
      overflowY:"auto" }}>
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>{t.emoji || "🔍"}</div>
        <div style={{ display:"inline-block", background:`${T.coral}12`,
          border:`1px solid ${T.coral}28`, borderRadius:99,
          padding:"5px 16px", fontSize:11, fontWeight:800,
          color:T.coral, letterSpacing:"0.07em", marginBottom:12 }}>
          {t.badge || "NICHT GEEIGNET FÜR HUI"}
        </div>
        <h2 style={{ margin:"0 0 10px", fontSize:19, fontWeight:900, color:T.ink,
          letterSpacing:"-0.02em", lineHeight:1.3 }}>{t.titel}</h2>
        <p style={{ margin:"0 0 8px", fontSize:13, color:T.ink2, lineHeight:1.7 }}>{t.erkl}</p>
        <p style={{ margin:"0 0 8px", fontSize:13, color:T.ink2, lineHeight:1.7 }}>{t.hinweis}</p>
        {t.tipp && (
          <div style={{ marginTop:10, padding:"10px 14px", background:`${T.teal}0A`,
            border:`1px solid ${T.teal}20`, borderRadius:12,
            fontSize:12, color:T.teal, lineHeight:1.6, textAlign:"left" }}>
            💡 <strong>Tipp:</strong> {t.tipp}
          </div>
        )}
      </div>

      {/* Score auch bei Ablehnung zeigen */}
      <FitScoreBar score={score} />

      <div style={{ background:`${T.teal}07`, border:`1px solid ${T.teal}16`,
        borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.teal, marginBottom:8 }}>
          Was zu HUI passt:
        </div>
        {["📚 Bildungsinitiativen & Wissensprojekte",
          "🌿 Umwelt-, Klima- & Naturschutzprojekte",
          "🤝 Gemeinschafts- & Soziale Projekte",
          "💊 Gesundheits- & Pflegeprojekte",
          "🎨 Kulturelle & gesellschaftliche Initiativen",
          "🐾 Tierschutz- & Tierwohlprojekte",
          "🌍 Inklusion & gesellschaftliche Teilhabe",
        ].map((item,i) => (
          <div key={i} style={{ fontSize:13, color:T.ink2, padding:"3px 0", lineHeight:1.5 }}>{item}</div>
        ))}
      </div>

      <button onClick={onRetry} className="hui-next" style={{
        width:"100%", height:52, borderRadius:16, border:"none",
        background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
        color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
        boxShadow:S.btn(T.teal), marginBottom:8,
      }}>Nochmal versuchen</button>
      <button onClick={onClose} style={{ background:"none", border:"none",
        fontSize:13, color:T.ink3, cursor:"pointer", padding:"6px" }}>Schließen</button>
    </div>
  );
}

// ═══ SUCCESS ═════════════════════════════════════════════════
function SuccessScreen({ onClose }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"40px 28px",
      textAlign:"center", animation:"ifFadeIn 0.35s ease both",
      background:`linear-gradient(160deg,${T.teal}12,${T.teal}04,#fff)` }}>
      <div style={{ fontSize:60, marginBottom:20,
        filter:`drop-shadow(0 4px 20px ${T.teal}50)` }}>💚</div>
      <h2 style={{ margin:"0 0 10px", fontSize:24, fontWeight:900,
        color:T.ink, letterSpacing:"-0.025em" }}>Bewerbung eingereicht!</h2>
      <p style={{ margin:"0 0 28px", fontSize:15, color:T.ink2,
        lineHeight:1.7, maxWidth:300 }}>
        Das HUI-Team prüft dein Herzensprojekt und meldet sich bald.
        Danke, dass du Wirkung schaffen möchtest. 🌍
      </p>
      <div style={{ background:`${T.teal}10`, border:`1px solid ${T.teal}22`,
        borderRadius:16, padding:"14px 20px", maxWidth:280, marginBottom:28 }}>
        {["✓ Bewerbung erhalten","✓ KI-Prüfung bestanden",
          "✓ HUI-Team wurde informiert","✓ Teil des HUI-Wirkungsnetzwerks 🌍",
        ].map((line,i) => (
          <div key={i} style={{ fontSize:13, fontWeight:700, color:T.teal, padding:"3px 0" }}>{line}</div>
        ))}
      </div>
      <button onClick={onClose} style={{ padding:"14px 36px", borderRadius:18,
        border:"none", background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
        color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
        boxShadow:S.btn(T.teal) }}>Super ✓</button>
    </div>
  );
}


// ═══ PERSÖNLICHE ANGABEN (Step 7.5) ══════════════════════════
function PersoenlicheAngaben({ onWeiter, onClose, kontakt, setKontakt }) {
  // T ist global definiert (Design Tokens oben in der Datei)
  const [errors, setErrors] = useState({});

  const fields = [
    { key:"standort",  label:"Standort",        placeholder:"z. B. Berlin, Bayern, Österreich", type:"text" },
    { key:"email",     label:"Kontakt E-Mail",   placeholder:"deine@email.de",                   type:"email" },
    { key:"name",      label:"Kontakt Name",     placeholder:"Vor- und Nachname",                type:"text" },
    { key:"telefon",   label:"Kontakt Telefon",  placeholder:"z. B. +49 170 1234567",            type:"tel" },
  ];

  const validate = () => {
    const e = {};
    if (!(kontakt.standort||"").trim()) e.standort = true;
    if (!(kontakt.email||"").trim())    e.email    = true;
    if (!(kontakt.name||"").trim())     e.name     = true;
    if (!(kontakt.telefon||"").trim())  e.telefon  = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleWeiter = () => {
    if (validate()) onWeiter();
  };

  return (
    <div style={{ overflowY:"auto", flex:1, padding:"28px 24px 32px" }}>
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
        <div style={{ fontSize:20, fontWeight:800, color:T.ink, marginBottom:6 }}>
          Persönliche Angaben
        </div>
        <div style={{ fontSize:13, color:T.ink3, lineHeight:1.5 }}>
          Damit das HUI-Team dich kontaktieren kann, benötigen wir noch ein paar Angaben.
          Alle Felder sind Pflichtfelder.
        </div>
      </div>

      {/* Felder */}
      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:28 }}>
        {fields.map(f => (
          <div key={f.key}>
            <div style={{
              fontSize:11, fontWeight:700, color:T.teal,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6,
            }}>{f.label}</div>
            <input
              className="hui-input"
              type={f.type}
              placeholder={f.placeholder}
              value={kontakt[f.key] || ""}
              onChange={e => setKontakt(prev => ({...prev, [f.key]: e.target.value}))}
              style={{
                border: errors[f.key]
                  ? "2px solid #FF6B6B"
                  : "2px solid rgba(20,20,34,0.10)",
              }}
            />
            {errors[f.key] && (
              <div style={{ fontSize:11, color:"#FF6B6B", marginTop:4 }}>
                Dieses Feld ist erforderlich.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Weiter-Button */}
      <button onClick={handleWeiter} className="hui-next" style={{
        width:"100%", height:54, borderRadius:18, border:"none",
        background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
        color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
        boxShadow:`0 6px 24px ${T.teal}40`, marginBottom:8,
      }}>Weiter → Wirkungsnetzwerk</button>
      <button onClick={onClose} style={{ background:"none", border:"none",
        fontSize:13, color:T.ink3, cursor:"pointer", padding:"6px",
        display:"block", width:"100%", textAlign:"center" }}>Abbrechen</button>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 10 — Medien & Dateien (Titelbild Pflicht + Zusatzmaterial)
// ═══════════════════════════════════════════════════════════════
function MedienUploadStep({ coverUrl, setCoverUrl, attachments, setAttachments, onWeiter, onClose, userId }) {
  const [coverUploading,  setCoverUploading]  = React.useState(false);
  const [extrasUploading, setExtrasUploading] = React.useState(false);
  const [coverErr,        setCoverErr]        = React.useState(null);

  const coverRef  = React.useRef();
  const extrasRef = React.useRef();

  // ── Titelbild hochladen ──────────────────────────────────────
  const uploadCover = async (file) => {
    if (!file) return;
    setCoverUploading(true); setCoverErr(null);
    try {
      const ext  = file.name.split(".").pop();
      const path = `covers/${userId || "anon"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(path);
      setCoverUrl(urlData.publicUrl);
    } catch (e) {
      setCoverErr("Upload fehlgeschlagen: " + (e.message || "Unbekannter Fehler"));
    }
    setCoverUploading(false);
  };

  // ── Zusatzmaterial hochladen ─────────────────────────────────
  const uploadExtras = async (files) => {
    if (!files?.length) return;
    setExtrasUploading(true);
    const urls = [...attachments];
    for (const file of Array.from(files)) {
      try {
        const ext  = file.name.split(".").pop();
        const path = `extras/${userId || "anon"}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
        const { error } = await supabase.storage
          .from("media")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (!error) {
          const { data: urlData } = supabase.storage
            .from("media")
            .getPublicUrl(path);
          urls.push({ url: urlData.publicUrl, name: file.name, type: file.type });
        }
      } catch { /* einzelne Datei skippen */ }
    }
    setAttachments(urls);
    setExtrasUploading(false);
  };

  const removeExtra = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx));
  const canContinue = !!coverUrl && !coverUploading && !extrasUploading;

  const getFileIcon = (type = "") => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎬";
    if (type.includes("pdf"))      return "📄";
    return "📎";
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", maxHeight:"92vh" }}>

      {/* Header */}
      <div style={{
        padding:"22px 22px 0",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexShrink:0,
      }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:T.ink, lineHeight:1.1 }}>
            📸 Medien & Dateien
          </div>
          <div style={{ fontSize:12.5, color:T.ink3, marginTop:3 }}>
            Zeig dein Projekt — Bilder sagen mehr als Worte.
          </div>
        </div>
        <button onClick={onClose} style={{
          width:32, height:32, borderRadius:"50%", border:"none",
          background:"rgba(20,20,34,0.07)", cursor:"pointer",
          fontSize:15, color:T.ink3, display:"flex", alignItems:"center", justifyContent:"center",
        }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"18px 22px 8px" }}>

        {/* ── Titelbild ─────────────────────────────────── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink3, marginBottom:4, letterSpacing:0.3 }}>
            TITELBILD <span style={{ color:T.coral }}>*</span>
          </div>
          <div style={{ fontSize:11.5, color:T.ink3, marginBottom:10, lineHeight:1.5 }}>
            So wird dein Projekt später im Impact Pool angezeigt. (Pflichtfeld)
          </div>

          {coverUrl ? (
            <div style={{ position:"relative", borderRadius:16, overflow:"hidden", marginBottom:8 }}>
              <img loading="lazy" decoding="async" src={coverUrl} alt="Titelbild"
                style={{ width:"100%", height:180, objectFit:"cover", display:"block" }} />
              <button onClick={() => setCoverUrl("")} style={{
                position:"absolute", top:8, right:8,
                background:"rgba(0,0,0,0.55)", border:"none", borderRadius:"50%",
                width:30, height:30, color:"#fff", fontSize:14,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}>✕</button>
              <div style={{
                position:"absolute", bottom:8, left:8,
                background:"rgba(13,196,181,0.90)", borderRadius:99,
                padding:"3px 10px", fontSize:11, fontWeight:700, color:"#fff",
              }}>✅ Titelbild gespeichert</div>
            </div>
          ) : (
            <div
              onClick={() => !coverUploading && coverRef.current?.click()}
              style={{
                border:`2px dashed ${coverErr ? T.coral : "rgba(13,196,181,0.40)"}`,
                borderRadius:16, padding:"28px 20px",
                textAlign:"center", cursor: coverUploading ? "default" : "pointer",
                background: coverUploading ? "rgba(13,196,181,0.04)" : "rgba(13,196,181,0.03)",
                transition:"all 0.18s",
              }}
            >
              <div style={{ fontSize:32, marginBottom:8 }}>
                {coverUploading ? "⏳" : "🖼️"}
              </div>
              <div style={{ fontSize:13, fontWeight:700, color: coverUploading ? T.ink3 : T.teal }}>
                {coverUploading ? "Wird hochgeladen…" : "Titelbild auswählen"}
              </div>
              <div style={{ fontSize:11, color:T.ink3, marginTop:4 }}>
                JPG, PNG, WebP — empfohlen 1200×800px
              </div>
            </div>
          )}
          <input ref={coverRef} type="file" accept="image/*" style={{ display:"none" }}
            onChange={e => uploadCover(e.target.files?.[0])} />
          {coverErr && (
            <div style={{ fontSize:11, color:T.coral, marginTop:6 }}>⚠️ {coverErr}</div>
          )}
        </div>

        {/* ── Zusatzmaterial ────────────────────────────── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink3, marginBottom:4, letterSpacing:0.3 }}>
            ZUSATZMATERIAL <span style={{ color:T.ink4, fontWeight:400 }}>(optional)</span>
          </div>
          <div style={{ fontSize:11.5, color:T.ink3, marginBottom:10, lineHeight:1.5 }}>
            Bilder, Videos, Dokumente, PDFs — alles was dein Projekt unterstützt.
          </div>

          <button
            onClick={() => !extrasUploading && extrasRef.current?.click()}
            disabled={extrasUploading}
            style={{
              width:"100%", padding:"14px",
              border:`1.5px dashed rgba(114,100,214,0.40)`,
              borderRadius:14, background:"rgba(114,100,214,0.04)",
              cursor: extrasUploading ? "default" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              color:T.violet, fontSize:13, fontWeight:700, fontFamily:"inherit",
            }}
          >
            {extrasUploading ? "⏳ Lädt hoch…" : "📎 Dateien hinzufügen (Mehrfach möglich)"}
          </button>
          <input ref={extrasRef} type="file" multiple style={{ display:"none" }}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={e => uploadExtras(e.target.files)} />

          {/* Vorschau */}
          {attachments.length > 0 && (
            <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
              {attachments.map((att, idx) => (
                <div key={idx} style={{
                  display:"flex", alignItems:"center", gap:10,
                  background:"rgba(114,100,214,0.06)",
                  border:"1px solid rgba(114,100,214,0.18)",
                  borderRadius:12, padding:"10px 12px",
                }}>
                  {att.type?.startsWith("image/") ? (
                    <img loading="lazy" decoding="async" src={att.url} alt={att.name}
                      style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }} />
                  ) : (
                    <div style={{
                      width:40, height:40, borderRadius:8,
                      background:"rgba(114,100,214,0.12)",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                    }}>{getFileIcon(att.type)}</div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.ink,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {att.name}
                    </div>
                  </div>
                  <button onClick={() => removeExtra(idx)} style={{
                    background:"none", border:"none", cursor:"pointer",
                    color:T.ink3, fontSize:16, padding:"0 4px",
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding:"14px 22px 22px", flexShrink:0,
        borderTop:"1px solid rgba(20,20,34,0.06)",
      }}>
        {!coverUrl && (
          <div style={{
            fontSize:11.5, color:T.coral, textAlign:"center",
            marginBottom:10, fontWeight:600,
          }}>
            ⚠️ Bitte lade ein Titelbild hoch, um fortzufahren.
          </div>
        )}
        <button
          onClick={onWeiter}
          disabled={!canContinue}
          style={{
            width:"100%", padding:"15px 0",
            background: canContinue
              ? `linear-gradient(135deg,${T.teal},${T.tealL})`
              : "rgba(20,20,34,0.12)",
            border:"none", borderRadius:99,
            color: canContinue ? "#fff" : T.ink3,
            fontSize:15, fontWeight:800, cursor: canContinue ? "pointer" : "not-allowed",
            fontFamily:"inherit",
            boxShadow: canContinue ? S.btn(T.teal) : "none",
            transition:"all 0.2s",
          }}
        >
          {canContinue ? "Weiter → Wirkungsnetzwerk" : "Titelbild fehlt"}
        </button>
        <div style={{ textAlign:"center", marginTop:10 }}>
          <button onClick={onClose} style={{
            background:"none", border:"none", color:T.ink3,
            fontSize:12, cursor:"pointer", fontFamily:"inherit",
          }}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

// ═══ HAUPT-ORCHESTRATOR ═══════════════════════════════════════
// Steps: 0–5 = Wizard, 6 = KI, 7 = Ergebnis, 7.5(=9) = Persönliche Angaben, 8 = Wirkungsnetzwerk
export default function ImpactFlow({ onClose }) {
  const { user } = useAuth();
  const [step,    setStep]    = useState(0);
  const [aiRes,   setAiRes]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);
  const [netChecks, setNetChecks] = useState(
    WIRKUNGSNETZ_CHECKS.map(() => false)
  );

  const [form, setForm] = useState({
    name:"", satz:"", problem:"", kategorie:"", umsetzung:"", foerder:"",
  });
  const [milestones, setMilestones] = useState([{ title: '', description: '', planned_date: '', media_urls: [] }]);
  const [kontakt, setKontakt] = useState({
    standort:"", email:"", name:"", telefon:"",
  });
  // Medien-Upload State (Step 10)
  const [coverUrl,     setCoverUrl]     = useState("");
  const [attachments,  setAttachments]  = useState([]);
  const update = useCallback(patch => setForm(f => ({...f,...patch})), []);

  const goNext = useCallback(() => setStep(s => s+1), []);
  const goBack = useCallback(() => {
    if (step === 0) onClose?.();
    else if (step === 7 || step === 8) setStep(6);  // KI/Ergebnis → Fördersumme
    else if (step === 9) setStep(8);   // PersönlicheAngaben → zurück zu Ergebnis
    else if (step === 10) setStep(9);  // Netzwerk → zurück zu PersönlicheAngaben
    else if (step === 11) setStep(10); // Medien → zurück zu Netzwerk
    else setStep(s => s-1);
  }, [step, onClose]);

  const toggleCheck = useCallback((i) => {
    setNetChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  }, []);

  // ── Supabase Submit (Hall-of-Impact-Datenstruktur) ───────────
  const handleSubmit = useCallback(async () => {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const { error: dbErr } = await supabase.from("impact_applications").insert({
        // Kern-Felder
        user_id:        user.id,
        project_name:   form.name.trim(),
        short_desc:     form.satz.trim(),
        problem:        form.problem.trim(),
        vision:         form.umsetzung.trim(),
        funding_goal:   form.foerder ? parseInt(form.foerder, 10) : null,
        funding_use:    form.umsetzung.trim(),
        contact_email:  kontakt.email.trim() || user.email || "",
        status:         "pending",
        submitted_at:   new Date().toISOString(),
        // Persönliche Angaben
        contact_name:   kontakt.name.trim(),
        contact_phone:  kontakt.telefon.trim(),
        location:       kontakt.standort.trim(),
        // Medien-Upload
        cover_url:      coverUrl || null,
        media_urls:     attachments.length ? attachments.map(a => a.url) : null,
      });
      if (dbErr) throw dbErr;

      // ── Resonanzzentrum: Einreichungs-Bestätigung ────────────────
      // Schreibt direkt in notifications-Tabelle (bestehende Architektur)
      try {
        await supabase.from("notifications").insert({
          user_id:     user.id,
          type:        "impact_project_submitted",
          title:       "💚 Dein Herzensprojekt wurde eingereicht!",
          body:        `Dein Projekt „${form.name.trim()}" wurde erfolgreich eingereicht. Ein Admin prüft es und meldet sich bei dir.`,
          entity_type: "impact_project",
          action_url:  "/impact",
          is_read:     false,
          read:        false,
          created_at:  new Date().toISOString(),
          metadata:    { project_name: form.name.trim() },
        });
      } catch (notifErr) {
        console.warn("[HUI_IMPACT] Resonanzzentrum notification failed:", notifErr);
        // Kein throw — Einreichung war erfolgreich, Notification-Fehler ist nicht kritisch
      }

      // ── Meilensteine speichern ──────────────────────────────────
      // Hole die neu angelegte impact_application ID
      const { data: newApps } = await supabase
        .from("impact_applications")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (newApps && newApps.length > 0) {
        const newProjectId = newApps[0].id;
        const validMilestones = milestones.filter(m => m.title.trim());
        if (validMilestones.length > 0) {
          await supabase.from("impact_milestones").insert(
            validMilestones.map((m, i) => ({
              project_id: newProjectId,
              title: m.title.trim(),
              description: m.description?.trim() || null,
              planned_date: m.planned_date || null,
              media_urls: m.media_urls || [],
              sort_order: i,
              status: "planned",
            }))
          );
        }
      }

      setDone(true);
    } catch(e) {
      setError(e.message || "Fehler beim Absenden");
      setSaving(false);
    }
  }, [user, form, aiRes, kontakt, coverUrl, attachments, milestones]);

  // ── Escape ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(14,14,24,0.52)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"16px", animation:"ifFadeIn 0.2s ease both",
    }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <style>{CSS}</style>
      <div style={{
        width:"100%", maxWidth:500,
        background:T.surfaceHi, borderRadius:24,
        boxShadow:"0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        maxHeight:"92vh", display:"flex", flexDirection:"column",
        overflow:"hidden",
        animation:"ifModalIn 0.26s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {done && <SuccessScreen onClose={onClose} />}

        {!done && step === 0 && <Step1 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 1 && <Step2 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 2 && <Step3 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 3 && <Step4 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 4 && <Step5 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}
        {!done && step === 5 && <Step5b milestones={milestones} setMilestones={setMilestones} onNext={goNext} onBack={goBack} onClose={onClose} userId={user?.id} />}
        {!done && step === 6 && <Step6 form={form} update={update} onNext={goNext} onBack={goBack} onClose={onClose} />}

        {!done && step === 7 && (
          <AIPruefung form={form} onResult={res => { setAiRes(res); setStep(8); }} />
        )}

        {!done && step === 8 && aiRes?.geeignet && (
          <ErgebnisGeeignet form={form} aiRes={aiRes}
            onNetworkConfirm={() => setStep(10)} onClose={onClose} />
        )}
        {!done && step === 8 && aiRes && !aiRes.geeignet && (
          <ErgebnisNichtGeeignet form={form} aiRes={aiRes} user={user} onClose={onClose}
            onRetry={() => { setStep(0); setAiRes(null); }} />
        )}

        {!done && step === 9 && (
          <PersoenlicheAngaben
            kontakt={kontakt}
            setKontakt={setKontakt}
            onWeiter={() => setStep(11)}
            onClose={onClose}
          />
        )}

        {/* Step 10 — Medien & Dateien */}
        {!done && step === 11 && (
          <MedienUploadStep
            coverUrl={coverUrl}
            setCoverUrl={setCoverUrl}
            attachments={attachments}
            setAttachments={setAttachments}
            onWeiter={() => setStep(9)}
            onClose={onClose}
            userId={user?.id}
          />
        )}

        {!done && step === 10 && (
          <WirkungsnetzScreen
            checks={netChecks}
            onToggle={toggleCheck}
            onConfirm={handleSubmit}
            onClose={onClose}
          />
        )}

        {/* Error-Banner (bei Supabase-Fehler im Netzwerk-Screen) */}
        {error && (step === 9 || step === 9 || step === 10) && (
          <div style={{
            position:"absolute", bottom:80, left:16, right:16,
            background:`${T.coral}15`, border:`1px solid ${T.coral}30`,
            borderRadius:12, padding:"10px 14px",
            fontSize:12, color:T.coral, textAlign:"center",
          }}>⚠️ {error}</div>
        )}
      </div>
    </div>
  );
}

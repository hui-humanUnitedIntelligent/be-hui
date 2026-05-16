// WirkerWerdenFlow.jsx
// "Teile dein Talent mit der Welt" — emotional, ruhig, menschlich.
// KEIN Seller-Onboarding. KEIN technisches Formular.
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623", green:"#3DB87A",
  warm:"#FFF9F4", cream:"#F9F6F2",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#C0C0C0", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes ww-up   {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ww-pop  {0%{transform:scale(0.88);opacity:0}65%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
  @keyframes ww-spin {to{transform:rotate(360deg)}}
  @keyframes ww-glow {0%,100%{box-shadow:0 0 0 0 rgba(22,215,197,0)}50%{box-shadow:0 0 0 14px rgba(22,215,197,0)}}
  @keyframes ww-check{0%{stroke-dashoffset:40}100%{stroke-dashoffset:0}}
  @keyframes ww-bg   {from{opacity:0}to{opacity:1}}
  .ww-scroll::-webkit-scrollbar{display:none}
  .ww-scroll{-ms-overflow-style:none;scrollbar-width:none;overflow-y:auto;-webkit-overflow-scrolling:touch}
  .ww-tap{transition:transform .17s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .ww-tap:active{transform:scale(.958)}
  .ww-input:focus{outline:none;border-color:#16D7C5!important;box-shadow:0 0 0 3px rgba(22,215,197,0.12)!important}
`;

const TYPES = [
  { key:"privat",  icon:"🌿", label:"Privat / Hobby",      sub:"Du teilst aus Leidenschaft" },
  { key:"selbst",  icon:"✨", label:"Selbstständig",        sub:"Du arbeitest auf eigene Rechnung" },
  { key:"kuenstler",icon:"🎨",label:"Künstler / Kreative",  sub:"Du erschaffst, gestaltest, inspirierst" },
  { key:"firma",   icon:"🏢", label:"Firma / Unternehmen",  sub:"Ihr seid ein Team" },
  { key:"verein",  icon:"🤝", label:"Verein / Organisation",sub:"Ihr wirkt gemeinsam" },
];

const CATEGORIES = [
  "Fotografie","Yoga & Wellness","Kochen & Backen","Musik","Coaching",
  "Design & Grafik","Keramik","Holz & Handwerk","Textil & Mode",
  "Schreiben","Malen & Zeichnen","Garten & Natur","Bildung",
  "Programmieren","Schmuck","Meditation","Catering","Sonstiges",
];

function Step({ children }) {
  return (
    <div style={{ animation:"ww-up 0.38s cubic-bezier(0.22,1,0.36,1) both" }}>
      {children}
    </div>
  );
}

function Dots({ total, current }) {
  return (
    <div style={{ display:"flex", gap:5, justifyContent:"center" }}>
      {Array.from({ length: total }).map((_,i) => (
        <div key={i} style={{
          width: i===current ? 22 : 6, height:6,
          borderRadius:999,
          background: i===current ? C.teal : i<current ? `${C.teal}55` : C.muted2,
          transition:"all 0.32s cubic-bezier(0.34,1.4,0.64,1)",
        }}/>
      ))}
    </div>
  );
}

function TInput({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:C.muted,
        letterSpacing:1.2, textTransform:"uppercase", marginBottom:7 }}>
        {label}</div>}
      <input className="ww-input" type={type} value={value}
        placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", background:C.card, border:`1.5px solid ${C.border}`,
          borderRadius:14, padding:"13px 16px", fontSize:14, color:C.ink,
          fontFamily:"inherit", boxSizing:"border-box",
          boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
          transition:"border-color 0.2s, box-shadow 0.2s" }}/>
    </div>
  );
}

export default function WirkerWerdenFlow({ onClose, onActivate }) {
  const { becomeWirker } = useAuth();
  const [step, setStep]     = useState(0); // 0=intro, 1=type, 2=details, 3=categories, 4=payout, 5=done
  const [data, setData]     = useState({
    type:"", name:"", city:"", bio:"", categories:[],
    payout_ready: false,
  });
  const [loading, setLoading] = useState(false);
  const up = (k,v) => setData(d=>({...d,[k]:v}));

  const TOTAL = 5; // steps 1-5 (intro is 0)

  const handleActivate = async () => {
    setLoading(true);
    try {
      const result = await becomeWirker({
        name: data.name,
        talent: data.categories[0] || "Kreativ",
        type: data.type,
        city: data.city,
        bio: data.bio,
        categories: data.categories,
      });
      if (result.error) {
        console.warn("becomeWirker error:", result.error);
      }
    } catch(e) { console.warn("handleActivate error:", e); }
    setLoading(false);
    setStep(5);
  };

  /* ── STEP 0: INTRO — cinematic ── */
  if (step === 0) return (
    <div style={{ position:"fixed", inset:0, zIndex:400, overflow:"hidden" }}>
      <style>{CSS}</style>
      {/* BG */}
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(160deg,#0D2B2B 0%,#1A1A2E 50%,#1F0E0E 100%)",
        animation:"ww-bg 0.6s both" }}/>
      {/* Floating orbs */}
      <div style={{ position:"absolute", top:"15%", left:"20%",
        width:200, height:200, borderRadius:"50%",
        background:`radial-gradient(circle,${C.teal}22 0%,transparent 70%)`,
        animation:"ww-glow 4s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", bottom:"20%", right:"10%",
        width:160, height:160, borderRadius:"50%",
        background:`radial-gradient(circle,${C.coral}18 0%,transparent 70%)` }}/>

      {/* Close */}
      <button onClick={onClose} style={{ position:"absolute",
        top:"max(52px,env(safe-area-inset-top,52px))", right:22,
        background:"rgba(255,255,255,0.12)", border:"none",
        borderRadius:12, padding:"8px 14px",
        fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)",
        cursor:"pointer", fontFamily:"inherit" }}>
        Schließen
      </button>

      {/* Content */}
      <div style={{ position:"absolute", inset:0,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"0 32px", textAlign:"center" }}>

        {/* HUI logo */}
        <img src="/hui-logo.jpg" alt="HUI"
          style={{ width:72, height:72, borderRadius:22,
            objectFit:"cover", marginBottom:28,
            boxShadow:`0 8px 32px ${C.tealGlow}`,
            animation:"ww-pop 0.6s 0.1s both" }}/>

        <div style={{ fontWeight:900, fontSize:30, color:"white",
          letterSpacing:-0.8, lineHeight:1.2, marginBottom:14,
          animation:"ww-up 0.5s 0.2s both" }}>
          Teile dein Talent<br/>mit der Welt.
        </div>

        <div style={{ fontSize:15, color:"rgba(255,255,255,0.65)",
          lineHeight:1.75, maxWidth:280, marginBottom:44,
          animation:"ww-up 0.5s 0.3s both" }}>
          Werde Wirker und bringe deine Werke,
          Erlebnisse und Fähigkeiten zu echten Menschen.
        </div>

        {/* Value props */}
        <div style={{ display:"flex", flexDirection:"column", gap:12,
          marginBottom:44, width:"100%", maxWidth:320,
          animation:"ww-up 0.5s 0.4s both" }}>
          {[
            { icon:"🎨", text:"Werke & Experiences anbieten" },
            { icon:"💰", text:"Direkt bezahlt werden — ohne Aufwand" },
            { icon:"🌱", text:"Automatisch Impact bewirken" },
          ].map((v,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
              background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.10)",
              borderRadius:16, padding:"12px 16px" }}>
              <span style={{ fontSize:20 }}>{v.icon}</span>
              <span style={{ fontSize:13.5, color:"rgba(255,255,255,0.82)",
                fontWeight:500 }}>{v.text}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setStep(1)} className="ww-tap"
          style={{ width:"100%", maxWidth:320, padding:"18px",
            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            border:"none", borderRadius:20, color:"white",
            fontSize:16, fontWeight:900, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:`0 6px 28px ${C.tealGlow}`,
            animation:"ww-pop 0.5s 0.5s both" }}>
          Wirker werden →
        </button>
      </div>
    </div>
  );

  /* ── STEP 5: DONE ── */
  if (step === 5) return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:C.warm, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 28px", textAlign:"center" }}>
      <style>{CSS}</style>

      {/* Animated checkmark */}
      <div style={{ width:88, height:88, borderRadius:"50%",
        background:`linear-gradient(135deg,${C.teal},${C.coral})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:28, boxShadow:`0 8px 32px ${C.tealGlow}`,
        animation:"ww-pop 0.6s both" }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M10 20 L17 27 L30 13" stroke="white"
            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="40" strokeDashoffset="0"
            style={{ animation:"ww-check 0.5s 0.3s ease both" }}/>
        </svg>
      </div>

      <div style={{ fontWeight:900, fontSize:26, color:C.ink,
        letterSpacing:-0.6, marginBottom:10,
        animation:"ww-up 0.5s 0.2s both" }}>
        Du bist jetzt Wirker 🎉
      </div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.75,
        maxWidth:280, marginBottom:36,
        animation:"ww-up 0.5s 0.3s both" }}>
        Deine öffentliche Identität ist aktiv. Der HUI-Button
        hat sich gerade in ein <strong style={{color:C.teal}}>+</strong> verwandelt.
        Zeit, etwas zu erschaffen.
      </div>

      {/* What happened */}
      <div style={{ background:C.card, borderRadius:22,
        padding:"20px", width:"100%", maxWidth:320, marginBottom:28,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 14px rgba(0,0,0,0.05)",
        animation:"ww-up 0.5s 0.4s both" }}>
        {[
          "✅ Wirkerprofil erstellt",
          "✅ Öffentliche Identität aktiv",
          "✅ Feed-Upload freigeschaltet",
          "✅ Buchungen & Käufe aktiv",
        ].map((t,i) => (
          <div key={i} style={{ fontSize:13, color:C.ink2, fontWeight:600,
            padding:"7px 0",
            borderBottom: i<3 ? `1px solid ${C.border}` : "none" }}>
            {t}
          </div>
        ))}
      </div>

      <button onClick={onActivate} className="ww-tap"
        style={{ width:"100%", maxWidth:320, padding:"17px",
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", borderRadius:18, color:"white",
          fontSize:15, fontWeight:800, cursor:"pointer",
          fontFamily:"inherit",
          boxShadow:`0 5px 22px ${C.tealGlow}`,
          animation:"ww-pop 0.5s 0.5s both" }}>
        Erstes Werk erstellen ✦
      </button>
    </div>
  );

  /* ── STEPS 1-4: Form steps ── */
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, background:C.warm }}>
      <style>{CSS}</style>

      {loading && (
        <div style={{ position:"absolute", inset:0, zIndex:10,
          background:"rgba(255,249,244,0.9)", backdropFilter:"blur(8px)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:14 }}>
          <div style={{ width:34, height:34, borderRadius:"50%",
            border:`3px solid ${C.teal}30`,
            borderTop:`3px solid ${C.teal}`,
            animation:"ww-spin 0.8s linear infinite" }}/>
          <div style={{ fontSize:13, color:C.muted }}>Wird aktiviert…</div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 22px 0",
        display:"flex", alignItems:"center",
        justifyContent:"space-between" }}>
        <button onClick={() => step>1 ? setStep(s=>s-1) : setStep(0)}
          className="ww-tap"
          style={{ width:40, height:40, borderRadius:13,
            background:C.card, border:`1px solid ${C.border}`,
            cursor:"pointer", fontSize:16 }}>←</button>
        <Dots total={TOTAL} current={step-1}/>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:12, fontWeight:600, color:C.muted, padding:"8px" }}>
          Abbrechen
        </button>
      </div>

      {/* Body */}
      <div className="ww-scroll"
        style={{ padding:"24px 22px 140px", height:"100%", boxSizing:"border-box" }}>

        {/* ── STEP 1: Typ ── */}
        {step===1 && (
          <Step>
            <div style={{ fontWeight:900, fontSize:22, color:C.ink,
              letterSpacing:-0.5, marginBottom:6 }}>Wer bist du?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:24,
              lineHeight:1.6 }}>
              Das hilft uns, das Richtige für dich vorzubereiten.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {TYPES.map(t => (
                <button key={t.key} onClick={() => { up("type",t.key); setStep(2); }}
                  className="ww-tap"
                  style={{ textAlign:"left", padding:"18px 18px",
                    background: data.type===t.key ? `${C.teal}12` : C.card,
                    border:`1.5px solid ${data.type===t.key ? C.teal : C.border}`,
                    borderRadius:20, cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", gap:16,
                    boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
                    transition:"all 0.2s" }}>
                  <div style={{ width:46, height:46, borderRadius:15,
                    background:`${C.teal}12`,
                    display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:22, flexShrink:0 }}>
                    {t.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15, color:C.ink,
                      marginBottom:3 }}>{t.label}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{t.sub}</div>
                  </div>
                  <span style={{ marginLeft:"auto", color:C.muted2, fontSize:16 }}>›</span>
                </button>
              ))}
            </div>
          </Step>
        )}

        {/* ── STEP 2: Details ── */}
        {step===2 && (
          <Step>
            <div style={{ fontWeight:900, fontSize:22, color:C.ink,
              letterSpacing:-0.5, marginBottom:6 }}>Dein Auftritt</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:24,
              lineHeight:1.6 }}>
              Wie sollen dich andere sehen?
            </div>
            <TInput label="Anzeigename" value={data.name}
              onChange={v=>up("name",v)} placeholder="z.B. Lars G."/>
            <TInput label="Standort" value={data.city}
              onChange={v=>up("city",v)} placeholder="z.B. München"/>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted,
                letterSpacing:1.2, textTransform:"uppercase", marginBottom:7 }}>
                Kurzbeschreibung
              </div>
              <textarea className="ww-input" value={data.bio} rows={4}
                placeholder="Was machst du? Was begeistert dich? Was teilst du auf HUI?"
                onChange={e=>up("bio",e.target.value)}
                style={{ width:"100%", background:C.card,
                  border:`1.5px solid ${C.border}`, borderRadius:14,
                  padding:"13px 16px", fontSize:14, color:C.ink,
                  fontFamily:"inherit", resize:"none",
                  boxSizing:"border-box", lineHeight:1.65,
                  boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
                  transition:"border-color 0.2s, box-shadow 0.2s" }}/>
            </div>
          </Step>
        )}

        {/* ── STEP 3: Categories ── */}
        {step===3 && (
          <Step>
            <div style={{ fontWeight:900, fontSize:22, color:C.ink,
              letterSpacing:-0.5, marginBottom:6 }}>Dein Talent</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:24,
              lineHeight:1.6 }}>
              Wähle was zu dir passt. Mehreres ist erlaubt.
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {CATEGORIES.map(c => {
                const sel = data.categories.includes(c);
                return (
                  <button key={c}
                    onClick={() => up("categories", sel
                      ? data.categories.filter(x=>x!==c)
                      : [...data.categories,c])}
                    className="ww-tap"
                    style={{ padding:"9px 16px", borderRadius:999,
                      background: sel ? `${C.teal}18` : C.card,
                      border:`1.5px solid ${sel ? C.teal : C.border}`,
                      fontSize:13, fontWeight: sel ? 700 : 500,
                      color: sel ? C.teal : C.muted,
                      cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.18s",
                      boxShadow: sel ? `0 2px 8px ${C.tealGlow}` : "none" }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {/* ── STEP 4: Auszahlungen ── */}
        {step===4 && (
          <Step>
            <div style={{ fontWeight:900, fontSize:22, color:C.ink,
              letterSpacing:-0.5, marginBottom:6 }}>Auszahlungen</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:24,
              lineHeight:1.6 }}>
              Keine Sorge — das kannst du auch später einrichten.
              Du erhältst eine Erinnerung sobald du deine erste Buchung hast.
            </div>

            {/* Payout visual */}
            <div style={{ background:C.card, borderRadius:22,
              padding:"22px", marginBottom:18,
              border:`1px solid ${C.border}`,
              boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink,
                marginBottom:4 }}>💳 Wie funktioniert das?</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>
                HUI wickelt alle Zahlungen ab. Du gibst einfach
                deine Bankverbindung an — und bekommst automatisch
                <strong style={{color:C.teal}}> 85 % </strong>
                jeder Transaktion ausgezahlt.
              </div>
              <div style={{ marginTop:14, padding:"12px 14px",
                borderRadius:14,
                background:"rgba(61,184,122,0.07)",
                border:"1px solid rgba(61,184,122,0.14)",
                fontSize:12.5, color:"#3DB87A", lineHeight:1.55 }}>
                🌱 2,5 % fließen automatisch in echte Impact-Projekte —
                ohne Abzug von deiner Seite.
              </div>
            </div>

            <button onClick={() => up("payout_ready", true)}
              className="ww-tap"
              style={{ width:"100%", padding:"15px",
                background: data.payout_ready ? `${C.teal}14` : C.card,
                border:`1.5px solid ${data.payout_ready ? C.teal : C.border}`,
                borderRadius:18, cursor:"pointer",
                fontFamily:"inherit", marginBottom:10,
                display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:11,
                background:`${C.teal}18`,
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:18 }}>🏦</div>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontWeight:700, fontSize:14,
                  color: data.payout_ready ? C.teal : C.ink }}>
                  {data.payout_ready ? "✓ Auszahlungen eingerichtet" : "Jetzt einrichten"}
                </div>
                <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>
                  Bankverbindung verbinden
                </div>
              </div>
            </button>

            <div style={{ textAlign:"center", fontSize:12.5,
              color:C.muted, padding:"4px 0" }}>
              oder
            </div>

            <button onClick={handleActivate}
              className="ww-tap"
              style={{ width:"100%", padding:"15px",
                background:"none",
                border:`1.5px solid ${C.border}`,
                borderRadius:18, cursor:"pointer",
                fontFamily:"inherit",
                fontSize:13, color:C.muted, fontWeight:600 }}>
              Später einrichten
            </button>
          </Step>
        )}
      </div>

      {/* Sticky CTA (steps 2+3) */}
      {(step===2 || step===3) && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0,
          padding:"14px 22px max(30px,env(safe-area-inset-bottom,30px))",
          background:"rgba(255,249,244,0.95)",
          backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
          borderTop:`1px solid ${C.border}` }}>
          <button onClick={() => setStep(s=>s+1)} className="ww-tap"
            disabled={step===2 && !data.name}
            style={{ width:"100%", padding:"16px",
              background: (step===2 && !data.name) ? C.muted2
                : `linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:18, color:"white",
              fontSize:15, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow: (step===2 && !data.name) ? "none"
                : `0 5px 22px ${C.tealGlow}`,
              transition:"all 0.3s" }}>
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}

// TalentOnboarding v2 — "Dein Talent anbieten"
// 3 Steps: Identität → Module → Profil
// Props-only, kein useNavigate/useParams, router-safe
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth }  from "../lib/AuthContext";

/* ── Design Tokens ──────────────────────────────────────────────────── */
const T = {
  teal:"#16D7C5", teal2:"#0EC4B3", tealGlow:"rgba(22,215,197,0.28)",
  tealBg:"rgba(22,215,197,0.09)", tealBorder:"rgba(22,215,197,0.26)",
  coral:"#FF8A6B", coralBg:"rgba(255,138,107,0.09)",
  gold:"#F5A623",  goldBg:"rgba(245,166,35,0.09)",
  purple:"#A78BFA",purpleBg:"rgba(167,139,250,0.10)",
  green:"#22C55E", greenBg:"rgba(34,197,94,0.10)",
  warm:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", ink3:"#6A6A6A",
  muted:"#9A9A9A", border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes toUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toIn{from{opacity:0}to{opacity:1}}
  @keyframes toSlide{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
  @keyframes toSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes toFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes toPop{0%{transform:scale(0.7)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
  .t-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .14s,opacity .14s}
  .t-tap:active{transform:scale(0.94)!important;opacity:.72}
  .t-scroll::-webkit-scrollbar{display:none}
  .t-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

/* ── Progress Bar ──────────────────────────────────────────────────── */
function ProgressBar({ step }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          height:3, borderRadius:2,
          width: i===step ? 28 : 10,
          background: i <= step
            ? `linear-gradient(90deg,${T.teal},${T.coral})`
            : "rgba(0,0,0,0.10)",
          transition:"all .4s cubic-bezier(.34,1.4,.64,1)"
        }}/>
      ))}
    </div>
  );
}

/* ── STEP 1: Was ist dein Talent? ──────────────────────────────────── */
const EXAMPLES = ["Fotografin","Keramikkünstler","Vocal Coach","Digital Artist",
  "Yoga-Lehrerin","Filmemacher","Floristin","Illustrator","DJ","Köchin","Architekt","Schriftstellerin"];

function Step1({ title, setTitle, desc, setDesc, onNext }) {
  const [placeholder, setPlaceholder] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholder(p => (p+1) % EXAMPLES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const valid = title.trim().length >= 2;

  return (
    <div style={{ animation:"toUp .4s both" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:46, marginBottom:14, animation:"toFloat 3s ease-in-out infinite" }}>✦</div>
        <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight:900,
          color:T.ink, letterSpacing:"-0.6px", lineHeight:1.2 }}>
          Was ist<br/>dein Talent?
        </h2>
        <p style={{ margin:0, fontSize:14, color:T.ink3, lineHeight:1.7 }}>
          Erzähl uns von dir —<br/>ganz persönlich, nicht wie ein CV.
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {/* Titel */}
        <div style={{ position:"relative" }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={EXAMPLES[placeholder]}
            maxLength={60}
            style={{
              width:"100%", padding:"16px", borderRadius:16,
              border:`2px solid ${title ? T.teal : T.border}`,
              background:T.card, fontSize:17, color:T.ink,
              outline:"none", fontFamily:"inherit", fontWeight:600,
              boxShadow: title ? `0 0 0 4px ${T.tealBg}` : "none",
              transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */, boxSizing:"border-box"
            }}
          />
        </div>

        {/* Beschreibung */}
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Was macht dich aus? Was begeistert dich? Was kannst du teilen?"
          rows={3}
          style={{
            width:"100%", padding:"16px", borderRadius:16,
            border:`2px solid ${desc ? T.teal : T.border}`,
            background:T.card, fontSize:14, color:T.ink,
            outline:"none", fontFamily:"inherit", resize:"none", lineHeight:1.6,
            boxShadow: desc ? `0 0 0 4px ${T.tealBg}` : "none",
            transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */, boxSizing:"border-box"
          }}
        />

        {/* Beispiel-Chips */}
        <div className="t-scroll"
          style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
          {EXAMPLES.slice(0,8).map(ex => (
            <button key={ex} className="t-tap"
              onClick={() => setTitle(ex)}
              style={{
                flexShrink:0, padding:"7px 14px", borderRadius:999,
                background: title===ex ? T.tealBg : "rgba(0,0,0,0.04)",
                border:`1.5px solid ${title===ex ? T.teal : "transparent"}`,
                color: title===ex ? T.teal : T.ink3,
                fontWeight: title===ex ? 700 : 500,
                fontSize:12, cursor:"pointer",
                transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */
              }}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      <button className="t-tap" onClick={onNext} disabled={!valid}
        style={{
          width:"100%", marginTop:24, padding:"17px",
          borderRadius:18, border:"none",
          background: valid ? `linear-gradient(135deg,${T.teal},${T.coral})` : "rgba(0,0,0,0.07)",
          color: valid ? "white" : T.muted,
          fontWeight:900, fontSize:15, cursor: valid ? "pointer" : "not-allowed",
          boxShadow: valid ? `0 8px 28px ${T.tealGlow}` : "none",
          transition:"all .25s"
        }}>
        Weiter →
      </button>
    </div>
  );
}

/* ── STEP 2: Wie möchtest du sichtbar sein? ────────────────────────── */
const MODULES = [
  { key:"works",       emoji:"🎨", label:"Werke zeigen",
    sub:"Fotos, Kunst, Designs, Musik",        color:T.coral,  bg:T.coralBg },
  { key:"experiences", emoji:"✨", label:"Experiences anbieten",
    sub:"Erlebnisse, Sessions, Touren",         color:T.gold,   bg:T.goldBg },
  { key:"stories",     emoji:"⚡️", label:"Storys teilen",
    sub:"Schnelle Momente, täglich, lebendig", color:T.teal,   bg:T.tealBg },
  { key:"workshops",   emoji:"🛠️", label:"Workshops halten",
    sub:"Gruppen, Kurse, Wissen weitergeben",  color:T.purple, bg:T.purpleBg },
  { key:"bookings",    emoji:"📅", label:"Buchungen annehmen",
    sub:"Direkte Terminbuchungen",             color:T.green,  bg:T.greenBg },
];

function Step2({ modules, onToggle, onNext, onBack }) {
  const activeCount = Object.values(modules).filter(Boolean).length;
  return (
    <div style={{ animation:"toSlide .35s both" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🌟</div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight:900,
          color:T.ink, letterSpacing:"-0.5px" }}>
          Wie möchtest du<br/>sichtbar sein?
        </h2>
        <p style={{ margin:0, fontSize:13, color:T.ink3, lineHeight:1.65 }}>
          Keine Rollen — nur Bereiche,<br/>die du jederzeit ein- oder ausschalten kannst.
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {MODULES.map((m, i) => {
          const on = !!modules[m.key];
          return (
            <div key={m.key} className="t-tap"
              onClick={() => onToggle(m.key)}
              style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"16px", borderRadius:18,
                background: on ? m.bg : T.card,
                border:`2px solid ${on ? m.color+"55" : T.border}`,
                cursor:"pointer",
                boxShadow: on ? `0 3px 14px ${m.color}22` : "none",
                transition:"all .22s cubic-bezier(.34,1.3,.64,1)",
                animation:`toUp ${.3+i*.05}s both`
              }}>
              <span style={{ fontSize:24, width:34, textAlign:"center" }}>{m.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color: on ? m.color : T.ink }}>
                  {m.label}
                </div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{m.sub}</div>
              </div>
              <div style={{
                width:24, height:24, borderRadius:12,
                border:`2px solid ${on ? m.color : T.border}`,
                background: on ? m.color : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, transition:"all .2s"
              }}>
                {on && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 3.5L4 6.5L10 1" stroke="white"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:10, marginTop:22 }}>
        <button onClick={onBack} className="t-tap"
          style={{ padding:"15px 18px", borderRadius:16,
            background:T.card, border:`1.5px solid ${T.border}`,
            color:T.muted, fontWeight:700, fontSize:14, cursor:"pointer" }}>‹</button>
        <button onClick={onNext} disabled={activeCount===0} className="t-tap"
          style={{
            flex:1, padding:"15px", borderRadius:16, border:"none",
            background: activeCount>0
              ? `linear-gradient(135deg,${T.teal},${T.coral})` : "rgba(0,0,0,0.07)",
            color: activeCount>0 ? "white" : T.muted,
            fontWeight:900, fontSize:15, cursor: activeCount>0 ? "pointer" : "not-allowed",
            boxShadow: activeCount>0 ? `0 6px 24px ${T.tealGlow}` : "none",
            transition:"all .2s"
          }}>
          {activeCount>0 ? `Weiter (${activeCount} aktiv) →` : "Mindestens einen wählen"}
        </button>
      </div>
    </div>
  );
}

/* ── STEP 3: Gestalte dein Profil ──────────────────────────────────── */
function Step3({ intro, setIntro, onFinish, onBack, saving, error }) {
  return (
    <div style={{ animation:"toSlide .35s both" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎭</div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight:900,
          color:T.ink, letterSpacing:"-0.5px" }}>
          Gestalte dein Profil
        </h2>
        <p style={{ margin:0, fontSize:13, color:T.ink3, lineHeight:1.65 }}>
          Wie sollen dich andere erleben?
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:T.muted,
            letterSpacing:.5, display:"block", marginBottom:8 }}>
            INTRO-SATZ (optional)
          </label>
          <textarea
            value={intro}
            onChange={e => setIntro(e.target.value)}
            placeholder="Ein Satz, der beschreibt wer du bist und was dich antreibt…"
            rows={3}
            style={{
              width:"100%", padding:"16px", borderRadius:16,
              border:`2px solid ${intro ? T.teal : T.border}`,
              background:T.card, fontSize:14, color:T.ink,
              outline:"none", fontFamily:"inherit", resize:"none", lineHeight:1.6,
              transition:"all .2s", boxSizing:"border-box"
            }}
          />
        </div>

        <div style={{ padding:"14px 16px", borderRadius:16,
          background:`linear-gradient(135deg,${T.tealBg},${T.coralBg})`,
          border:`1px solid ${T.tealBorder}` }}>
          <div style={{ fontSize:13, color:T.ink2, lineHeight:1.6 }}>
            <strong>Avatar & Coverfoto</strong> kannst du jederzeit<br/>
            direkt in deinem Talentprofil hochladen. ✨
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop:14, padding:"12px 14px", borderRadius:12,
          background:"rgba(255,80,80,0.07)", border:"1px solid rgba(255,80,80,0.18)",
          fontSize:13, color:"#E53E3E" }}>⚠️ {error}</div>
      )}

      <div style={{ display:"flex", gap:10, marginTop:22 }}>
        <button onClick={onBack} className="t-tap"
          style={{ padding:"15px 18px", borderRadius:16,
            background:T.card, border:`1.5px solid ${T.border}`,
            color:T.muted, fontWeight:700, fontSize:14, cursor:"pointer" }}>‹</button>
        <button onClick={onFinish} disabled={saving} className="t-tap"
          style={{
            flex:1, padding:"15px", borderRadius:16, border:"none",
            background:`linear-gradient(135deg,${T.teal},${T.coral})`,
            color:"white", fontWeight:900, fontSize:15, cursor:"pointer",
            boxShadow:`0 6px 24px ${T.tealGlow}`,
            opacity: saving ? .7 : 1, transition:"all .2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8
          }}>
          {saving ? (
            <>
              <div style={{ width:17,height:17,borderRadius:"50%",
                border:"2.5px solid rgba(255,255,255,.3)",
                borderTop:"2.5px solid white",
                animation:"toSpin .8s linear infinite" }}/>
              Speichere…
            </>
          ) : "✦ Talentprofil aktivieren"}
        </button>
      </div>
    </div>
  );
}

/* ── Success ────────────────────────────────────────────────────────── */
function SuccessView({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{ textAlign:"center", padding:"32px 8px", animation:"toUp .4s both" }}>
      <div style={{
        width:80, height:80, borderRadius:24, margin:"0 auto 20px",
        background:`linear-gradient(135deg,${T.teal},${T.coral})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:34, boxShadow:`0 12px 40px ${T.tealGlow}`,
        animation:"toPop .5s cubic-bezier(.34,1.4,.64,1) both"
      }}>✦</div>
      <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight:900,
        color:T.ink, letterSpacing:"-0.5px" }}>Dein Talent ist live!</h2>
      <p style={{ margin:0, fontSize:14, color:T.ink3, lineHeight:1.7 }}>
        Willkommen in deiner kreativen Welt.<br/>
        Du kannst jetzt teilen was dich ausmacht. ✨
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════ */
export default function TalentOnboarding({ onClose, onActivate }) {
  const { user, profile, setProfile } = useAuth();
  const [step,    setStep]    = useState(0);
  const [title,   setTitle]   = useState("");
  const [desc,    setDesc]    = useState("");
  const [intro,   setIntro]   = useState("");
  const [modules, setModules] = useState({
    works:true, experiences:false, stories:false, workshops:false, bookings:false
  });
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);

  function toggleModule(key) {
    setModules(p => ({ ...p, [key]: !p[key] }));
  }

  async function save() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const updates = {
        has_talent_profile:  true,
        talent_title:        title.trim(),
        talent_description:  desc.trim(),
        talent_bio:          intro.trim(),
        profile_modules:     modules,
        talent_offer_types:  Object.keys(modules).filter(k => modules[k]),
        is_wirker:           true,
        role:                "talent",
        updated_at:          new Date().toISOString(),
      };
      const { data, error: err } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select().single();
      if (err) throw err;
      if (setProfile) setProfile(p => ({ ...p, ...updates }));
      setDone(true);
    } catch(e) {
      setError(e.message || "Fehler beim Speichern — bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  function handleDone() {
    if (onActivate) onActivate({ modules, title });
    onClose();
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      background:"rgba(8,8,8,.52)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end",
      animation:"toIn .2s both"
    }}>
      <style>{CSS}</style>
      <div style={{
        width:"100%", maxWidth:520, margin:"0 auto",
        background:T.warm, borderRadius:"28px 28px 0 0",
        padding:"20px 20px 0",
        paddingBottom:"max(28px,calc(env(safe-area-inset-bottom,0px) + 20px))",
        maxHeight:"93vh", overflowY:"auto",
        animation:"toUp .38s cubic-bezier(.34,1.3,.64,1) both"
      }} className="t-scroll">

        {/* Drag handle */}
        <div style={{ width:36,height:4,borderRadius:2,background:"rgba(0,0,0,.12)",
          margin:"0 auto 18px" }}/>

        {/* Close */}
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:done?0:6 }}>
          {!done && <ProgressBar step={step}/>}
          <button onClick={onClose} className="t-tap"
            style={{ marginLeft:"auto", width:32,height:32,borderRadius:"50%",
              background:"rgba(0,0,0,.06)",border:"none",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:15,color:T.muted,flexShrink:0 }}>✕</button>
        </div>

        {done ? (
          <SuccessView onDone={handleDone}/>
        ) : step===0 ? (
          <Step1 title={title} setTitle={setTitle}
            desc={desc} setDesc={setDesc}
            onNext={() => setStep(1)}/>
        ) : step===1 ? (
          <Step2 modules={modules} onToggle={toggleModule}
            onNext={() => setStep(2)} onBack={() => setStep(0)}/>
        ) : (
          <Step3 intro={intro} setIntro={setIntro}
            onFinish={save} onBack={() => setStep(1)}
            saving={saving} error={error}/>
        )}

        <div style={{ height:8 }}/>
      </div>
    </div>
  );
}

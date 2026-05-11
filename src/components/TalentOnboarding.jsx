// TalentOnboarding.jsx — "Dein Talent anbieten" Flow
// Emotional, menschlich, modern. Kein useNavigate/useParams direkt.
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"rgba(22,215,197,0.10)",
  tealGlow:"rgba(22,215,197,0.30)", tealBorder:"rgba(22,215,197,0.30)",
  coral:"#FF8A6B", coral2:"#E8705A", coralPale:"rgba(255,138,107,0.10)",
  coralGlow:"rgba(255,138,107,0.28)",
  gold:"#F5A623", goldPale:"rgba(245,166,35,0.10)",
  purple:"#A78BFA", purplePale:"rgba(167,139,250,0.12)",
  green:"#22C55E",
  warm:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", ink3:"#5A5A5A",
  muted:"#9A9A9A", border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes toFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes toPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes toSlide  { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes toSpin   { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes toFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .to-tap { cursor:pointer; -webkit-tap-highlight-color:transparent; transition:transform 0.15s,opacity 0.15s; }
  .to-tap:active { transform:scale(0.94); opacity:0.7; }
  .to-scroll::-webkit-scrollbar { display:none; }
  .to-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

const OFFER_TYPES = [
  { key:"works",      emoji:"🎨", label:"Kreative Werke",    sub:"Kunst, Design, Foto, Musik", color:C.coral,  bg:C.coralPale },
  { key:"services",   emoji:"🤝", label:"Dienstleistungen",  sub:"Skills, Beratung, Support",  color:C.teal,   bg:C.tealPale },
  { key:"knowledge",  emoji:"📚", label:"Wissen teilen",     sub:"Tutorials, Kurse, Guides",   color:"#818CF8",bg:"rgba(129,140,248,0.10)" },
  { key:"experiences",emoji:"✨", label:"Experiences",       sub:"Abenteuer, Führungen, Momente",color:C.gold, bg:C.goldPale },
  { key:"workshops",  emoji:"🛠️", label:"Workshops",         sub:"Gruppen, Lernen, Praxis",    color:"#34D399",bg:"rgba(52,211,153,0.10)" },
  { key:"music",      emoji:"🎵", label:"Musik",             sub:"Songs, Beats, Live, Events", color:"#F472B6",bg:"rgba(244,114,182,0.10)" },
  { key:"healing",    emoji:"🌿", label:"Heilung",           sub:"Therapie, Wellness, Balance", color:"#6EE7B7",bg:"rgba(110,231,183,0.10)" },
  { key:"movement",   emoji:"⚡", label:"Bewegung",          sub:"Sport, Yoga, Tanz, Fitness", color:"#FB923C",bg:"rgba(251,146,60,0.10)" },
  { key:"coaching",   emoji:"🧭", label:"Coaching",          sub:"Mentoring, Life, Business",  color:C.purple, bg:C.purplePale },
  { key:"events",     emoji:"🎉", label:"Events",            sub:"Feiern, Meetups, Shows",     color:"#F59E0B",bg:"rgba(245,158,11,0.10)" },
  { key:"digital",    emoji:"💡", label:"Digitale Inhalte",  sub:"Ebooks, Templates, Assets",  color:"#38BDF8",bg:"rgba(56,189,248,0.10)" },
  { key:"other",      emoji:"🌈", label:"Sonstiges",         sub:"Alles was dich ausmacht",    color:C.muted,  bg:"rgba(0,0,0,0.04)" },
];

const MODULES_MAP = {
  works:"works", services:"services", knowledge:"knowledge",
  experiences:"experiences", workshops:"workshops", music:"works",
  healing:"services", movement:"experiences", coaching:"coaching",
  events:"events", digital:"works", other:"works"
};

/* ── Progress Dots ─────────────────────────────────────────────────── */
function ProgressDots({ step, total=3 }) {
  return (
    <div style={{ display:"flex", gap:7, justifyContent:"center" }}>
      {Array.from({length:total}).map((_,i) => (
        <div key={i} style={{
          height:4, borderRadius:2,
          width: i===step ? 24 : 8,
          background: i <= step
            ? `linear-gradient(90deg,${C.teal},${C.coral})`
            : "rgba(0,0,0,0.12)",
          transition:"all 0.35s cubic-bezier(0.34,1.4,0.64,1)"
        }}/>
      ))}
    </div>
  );
}

/* ── Step 1: Was willst du teilen? ─────────────────────────────────── */
function Step1({ selected, onToggle, onNext }) {
  return (
    <div style={{ animation:"toFadeUp 0.4s both" }}>
      <div style={{ textAlign:"center", padding:"0 4px 28px" }}>
        <div style={{ fontSize:44, marginBottom:16, animation:"toFloat 3s ease-in-out infinite" }}>
          ✨
        </div>
        <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight:900,
          color:C.ink, letterSpacing:-0.6, lineHeight:1.2 }}>
          Was möchtest du mit<br/>anderen teilen?
        </h2>
        <p style={{ margin:0, fontSize:14, color:C.ink3, lineHeight:1.65 }}>
          Wähle alles, was dich beschreibt.<br/>
          Du kannst es jederzeit anpassen.
        </p>
      </div>

      <div className="to-scroll"
        style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:10, maxHeight:"46vh", overflowY:"auto",
          paddingRight:2, paddingBottom:4 }}>
        {OFFER_TYPES.map((t,i) => {
          const active = selected.includes(t.key);
          return (
            <div key={t.key} className="to-tap"
              onClick={() => onToggle(t.key)}
              style={{
                padding:"14px 12px", borderRadius:18, cursor:"pointer",
                background: active ? t.bg : C.card,
                border: `2px solid ${active ? t.color : C.border}`,
                boxShadow: active
                  ? `0 4px 18px ${t.color}28, 0 1px 4px rgba(0,0,0,0.04)`
                  : "0 1px 6px rgba(0,0,0,0.05)",
                transition:"all 0.22s cubic-bezier(0.34,1.3,0.64,1)",
                animation:`toFadeUp ${0.3+i*0.04}s both`,
                position:"relative", overflow:"hidden"
              }}>
              {active && (
                <div style={{ position:"absolute", top:8, right:8,
                  width:18, height:18, borderRadius:"50%",
                  background:t.color, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:10, color:"white",
                  fontWeight:900, animation:"toFadeIn 0.2s both" }}>
                  ✓
                </div>
              )}
              <div style={{ fontSize:22, marginBottom:6 }}>{t.emoji}</div>
              <div style={{ fontWeight:800, fontSize:13, color:active ? t.color : C.ink,
                marginBottom:2, letterSpacing:-0.2 }}>{t.label}</div>
              <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{t.sub}</div>
            </div>
          );
        })}
      </div>

      <button className="to-tap"
        onClick={onNext}
        disabled={selected.length === 0}
        style={{ width:"100%", marginTop:20, padding:"16px",
          borderRadius:18, border:"none", cursor: selected.length>0 ? "pointer" : "not-allowed",
          background: selected.length>0
            ? `linear-gradient(135deg,${C.teal},${C.coral})`
            : "rgba(0,0,0,0.08)",
          color: selected.length>0 ? "white" : C.muted,
          fontWeight:900, fontSize:15,
          boxShadow: selected.length>0 ? `0 6px 24px ${C.tealGlow}` : "none",
          transition:"all 0.25s" }}>
        {selected.length > 0
          ? `Weiter mit ${selected.length} Bereiche${selected.length===1?"":"n"} →`
          : "Wähle mindestens einen Bereich"}
      </button>
    </div>
  );
}

/* ── Step 2: Talentprofil erstellen ────────────────────────────────── */
function Step2({ form, onChange, onNext, onBack }) {
  return (
    <div style={{ animation:"toSlide 0.35s both" }}>
      <div style={{ textAlign:"center", padding:"0 4px 24px" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🌟</div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight:900,
          color:C.ink, letterSpacing:-0.5 }}>Dein Talentprofil</h2>
        <p style={{ margin:0, fontSize:13, color:C.ink3, lineHeight:1.6 }}>
          Wie sollen andere dich finden?
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:C.ink3,
            marginBottom:6, display:"block", letterSpacing:0.3 }}>
            DEIN TALENT IN EINEM SATZ *
          </label>
          <input
            placeholder="z.B. „Ich male lebendige Portraits""
            value={form.title}
            onChange={e => onChange("title", e.target.value)}
            style={{ width:"100%", padding:"14px 16px", borderRadius:14,
              border:`1.5px solid ${form.title ? C.teal : C.border}`,
              background:C.card, fontSize:15, color:C.ink,
              outline:"none", fontFamily:"inherit",
              boxShadow: form.title ? `0 0 0 3px ${C.tealPale}` : "none",
              transition:"all 0.2s" }}/>
        </div>

        <div>
          <label style={{ fontSize:12, fontWeight:700, color:C.ink3,
            marginBottom:6, display:"block", letterSpacing:0.3 }}>
            BESCHREIBE DICH
          </label>
          <textarea
            placeholder="Erzähl uns von dir — was macht dein Angebot besonders?"
            value={form.description}
            onChange={e => onChange("description", e.target.value)}
            rows={3}
            style={{ width:"100%", padding:"14px 16px", borderRadius:14,
              border:`1.5px solid ${form.description ? C.teal : C.border}`,
              background:C.card, fontSize:14, color:C.ink,
              outline:"none", fontFamily:"inherit", resize:"none",
              boxShadow: form.description ? `0 0 0 3px ${C.tealPale}` : "none",
              transition:"all 0.2s" }}/>
        </div>

        <div>
          <label style={{ fontSize:12, fontWeight:700, color:C.ink3,
            marginBottom:6, display:"block", letterSpacing:0.3 }}>
            STANDORT (OPTIONAL)
          </label>
          <input
            placeholder="Stadt, Land oder „Online""
            value={form.location}
            onChange={e => onChange("location", e.target.value)}
            style={{ width:"100%", padding:"14px 16px", borderRadius:14,
              border:`1.5px solid ${C.border}`,
              background:C.card, fontSize:14, color:C.ink,
              outline:"none", fontFamily:"inherit" }}/>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginTop:22 }}>
        <button onClick={onBack} className="to-tap"
          style={{ padding:"15px 20px", borderRadius:16, background:C.card,
            border:`1.5px solid ${C.border}`, color:C.muted,
            fontWeight:700, fontSize:14, cursor:"pointer" }}>
          ‹
        </button>
        <button onClick={onNext} disabled={!form.title.trim()}
          className="to-tap"
          style={{ flex:1, padding:"15px", borderRadius:16, border:"none",
            background: form.title.trim()
              ? `linear-gradient(135deg,${C.teal},${C.coral})`
              : "rgba(0,0,0,0.08)",
            color: form.title.trim() ? "white" : C.muted,
            fontWeight:900, fontSize:15, cursor: form.title.trim() ? "pointer" : "not-allowed",
            boxShadow: form.title.trim() ? `0 6px 24px ${C.tealGlow}` : "none",
            transition:"all 0.2s" }}>
          Weiter →
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Module aktivieren ─────────────────────────────────────── */
const ALL_MODULES = [
  { key:"works",       emoji:"🎨", label:"Werke verkaufen",     sub:"Produkte, Kunst, Fotos, Designs",  color:C.coral },
  { key:"services",    emoji:"🤝", label:"Dienstleistungen",    sub:"Skills per Buchung anbieten",       color:C.teal },
  { key:"experiences", emoji:"✨", label:"Experiences",         sub:"Erlebnisse & Touren anbieten",      color:C.gold },
  { key:"workshops",   emoji:"🛠️", label:"Workshops",           sub:"Gruppen, Kurse, Workshops",        color:"#34D399" },
  { key:"coaching",    emoji:"🧭", label:"Coaching",            sub:"1:1 Mentoring & Beratung",          color:C.purple },
  { key:"events",      emoji:"🎉", label:"Events",              sub:"Veranstaltungen & Shows",           color:"#F59E0B" },
  { key:"shop",        emoji:"🛍️", label:"Online Shop",         sub:"Digitale & physische Produkte",    color:"#38BDF8" },
  { key:"impact",      emoji:"🌱", label:"Impact aktiv",        sub:"Impact-Pool Beiträge anzeigen",     color:C.green },
];

function Step3({ modules, onToggle, onFinish, onBack, saving }) {
  return (
    <div style={{ animation:"toSlide 0.35s both" }}>
      <div style={{ textAlign:"center", padding:"0 4px 24px" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚡️</div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight:900,
          color:C.ink, letterSpacing:-0.5 }}>Aktiviere deine Bereiche</h2>
        <p style={{ margin:0, fontSize:13, color:C.ink3, lineHeight:1.6 }}>
          Nicht als Rollen — sondern als<br/>
          <strong>aktivierbare Profilbereiche.</strong>
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {ALL_MODULES.map((m,i) => {
          const active = !!modules[m.key];
          return (
            <div key={m.key} className="to-tap"
              onClick={() => onToggle(m.key)}
              style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"14px 16px", borderRadius:16,
                background: active
                  ? `linear-gradient(135deg,${m.color}14,${m.color}08)`
                  : C.card,
                border:`1.5px solid ${active ? m.color+"44" : C.border}`,
                cursor:"pointer",
                boxShadow: active ? `0 2px 12px ${m.color}20` : "none",
                transition:"all 0.22s cubic-bezier(0.34,1.3,0.64,1)",
                animation:`toFadeUp ${0.25+i*0.04}s both`
              }}>
              <div style={{ fontSize:22, flexShrink:0, width:32,
                textAlign:"center" }}>{m.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14,
                  color: active ? m.color : C.ink, letterSpacing:-0.2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                  {m.sub}
                </div>
              </div>
              <div style={{
                width:24, height:24, borderRadius:12,
                border:`2px solid ${active ? m.color : C.border}`,
                background: active ? m.color : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, transition:"all 0.2s"
              }}>
                {active && (
                  <svg width="12" height="9" viewBox="0 0 12 9">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:10, marginTop:22 }}>
        <button onClick={onBack} className="to-tap"
          style={{ padding:"15px 20px", borderRadius:16, background:C.card,
            border:`1.5px solid ${C.border}`, color:C.muted,
            fontWeight:700, fontSize:14, cursor:"pointer" }}>
          ‹
        </button>
        <button onClick={onFinish}
          disabled={saving || Object.values(modules).filter(Boolean).length===0}
          className="to-tap"
          style={{ flex:1, padding:"15px", borderRadius:16, border:"none",
            background: `linear-gradient(135deg,${C.teal},${C.coral})`,
            color:"white", fontWeight:900, fontSize:15, cursor:"pointer",
            boxShadow:`0 6px 24px ${C.tealGlow}`,
            opacity: saving ? 0.7 : 1, transition:"all 0.2s",
            display:"flex", alignItems:"center",
            justifyContent:"center", gap:8 }}>
          {saving ? (
            <>
              <div style={{ width:18, height:18, borderRadius:"50%",
                border:"2.5px solid rgba(255,255,255,0.3)",
                borderTop:"2.5px solid white",
                animation:"toSpin 0.8s linear infinite" }}/>
              Speichere…
            </>
          ) : "✦ Talentprofil aktivieren"}
        </button>
      </div>
    </div>
  );
}

/* ── Success Screen ─────────────────────────────────────────────────── */
function SuccessScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{ textAlign:"center", padding:"40px 20px",
      animation:"toFadeUp 0.4s both" }}>
      <div style={{ width:80, height:80, borderRadius:24, margin:"0 auto 24px",
        background:`linear-gradient(135deg,${C.teal},${C.coral})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:36, animation:"toPulse 0.6s ease-out",
        boxShadow:`0 12px 40px ${C.tealGlow}` }}>
        ✓
      </div>
      <h2 style={{ margin:"0 0 12px", fontSize:26, fontWeight:900,
        color:C.ink, letterSpacing:-0.5 }}>
        Dein Talentprofil ist live!
      </h2>
      <p style={{ margin:0, fontSize:14, color:C.ink3, lineHeight:1.65 }}>
        Du kannst jetzt Werke, Dienstleistungen<br/>
        und Erlebnisse mit der Welt teilen. ✨
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function TalentOnboarding({ onClose, onActivate }) {
  const { user, profile, setProfile } = useAuth();
  const [step,     setStep]     = useState(0);
  const [selected, setSelected] = useState([]);
  const [form,     setForm]     = useState({ title:"", description:"", location:"" });
  const [modules,  setModules]  = useState({
    works:true, services:false, experiences:false,
    workshops:false, coaching:false, events:false, shop:false, impact:true
  });
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState(null);

  // Pre-select modules basierend auf Step1 Auswahl
  useEffect(() => {
    if (selected.length > 0) {
      const newMods = { ...modules };
      selected.forEach(s => {
        const mod = MODULES_MAP[s];
        if (mod && newMods[mod] !== undefined) newMods[mod] = true;
      });
      setModules(newMods);
    }
  }, [selected]);

  function toggleSelected(key) {
    setSelected(p => p.includes(key) ? p.filter(k=>k!==key) : [...p,key]);
  }

  function toggleModule(key) {
    setModules(p => ({ ...p, [key]: !p[key] }));
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const updates = {
        has_talent_profile:  true,
        talent_title:        form.title.trim(),
        talent_description:  form.description.trim(),
        talent_location:     form.location.trim(),
        talent_offer_types:  selected,
        profile_modules:     modules,
        // Rückwärtskompatibilität
        is_wirker:           true,
        role:                "wirker",
        updated_at:          new Date().toISOString(),
      };

      const { data, error: err } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (err) throw err;

      // AuthContext sync
      if (setProfile) setProfile(p => ({ ...p, ...updates }));

      setDone(true);
    } catch(e) {
      setError(e.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  function handleDone() {
    if (onActivate) onActivate({ modules, title: form.title });
    onClose();
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      background:"rgba(10,10,10,0.55)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems:"flex-end",
      animation:"toFadeIn 0.2s both"
    }}>
      <style>{CSS}</style>
      <div style={{
        width:"100%", maxWidth:520, margin:"0 auto",
        background:C.warm,
        borderRadius:"28px 28px 0 0",
        padding:"20px 20px 32px",
        paddingBottom:"max(32px,calc(env(safe-area-inset-bottom,0px)+24px))",
        maxHeight:"92vh", overflowY:"auto",
        animation:"toFadeUp 0.38s cubic-bezier(0.34,1.3,0.64,1) both"
      }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:22 }}>
          {!done ? (
            <ProgressDots step={step} total={3}/>
          ) : <div/>}
          <button onClick={onClose} className="to-tap"
            style={{ width:34, height:34, borderRadius:"50%",
              background:"rgba(0,0,0,0.07)", border:"none",
              cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:16, color:C.muted }}>
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding:"12px 16px", borderRadius:12, marginBottom:16,
            background:"rgba(255,80,80,0.08)", border:"1px solid rgba(255,80,80,0.2)",
            fontSize:13, color:"#E53E3E" }}>
            ⚠️ {error}
          </div>
        )}

        {done ? (
          <SuccessScreen onDone={handleDone}/>
        ) : step === 0 ? (
          <Step1
            selected={selected}
            onToggle={toggleSelected}
            onNext={() => setStep(1)}
          />
        ) : step === 1 ? (
          <Step2
            form={form}
            onChange={(k,v) => setForm(p=>({...p,[k]:v}))}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        ) : (
          <Step3
            modules={modules}
            onToggle={toggleModule}
            onFinish={handleFinish}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}

      </div>
    </div>
  );
}

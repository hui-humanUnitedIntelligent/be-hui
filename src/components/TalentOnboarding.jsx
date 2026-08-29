// TalentOnboarding v2 — "Deinen Raum öffnen"
// 3 Steps: Identität → Module → Profil
// Props-only, kein useNavigate/useParams, router-safe
import { HUITalentIcon,
  HUIWarnIcon,
} from '../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { ProfileService } from "../services/db";
import { invalidateOrbStageCache } from "../hooks/useOrbGrowthStage.js";
import { useAuth }  from "../lib/AuthContext";
import { HUI } from "../design/hui.design.js";
import { useModalRegistration } from "../hooks/useModalRegistration.js";
import { useTranslation } from "../hooks/useTranslation.js";

/* ── Design Tokens ──────────────────────────────────────────────────── */
const T = {
  teal:HUI.COLOR.teal, teal2:HUI.COLOR.teal, tealGlow:"rgba(22,215,197,0.28)",
  tealBg:"rgba(22,215,197,0.09)", tealBorder:"rgba(22,215,197,0.26)",
  coral:HUI.COLOR.coral, coralBg:"rgba(255,138,107,0.09)",
  gold:HUI.COLOR.gold,  goldBg:"rgba(245,166,35,0.09)",
  purple:HUI.COLOR.violetLight,purpleBg:"rgba(167,139,250,0.10)",
  green:"#22C55E", greenBg:"rgba(34,197,94,0.10)",
  warm:HUI.COLOR.cream, card:"#FFFFFF",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2, ink3:HUI.COLOR.muted,
  muted:HUI.COLOR.muted, border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes toUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toIn{from{opacity:0}to{opacity:1}}
  @keyframes toSlide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes toSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes toFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes toPop{0%{transform:scale(0.7)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
  .t-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .24s ease,opacity .22s ease}
  .t-tap:active{transform:scale(0.965) translateY(1px)!important;opacity:.80}
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

// i18n Keys für die Beispiel-Placeholder (rotieren im Input)
const EXAMPLE_KEYS = [
  "talent.example.fotografin", "talent.example.keramik", "talent.example.vocalCoach",
  "talent.example.digitalArtist", "talent.example.yoga", "talent.example.filmemacher",
  "talent.example.floristin", "talent.example.illustrator", "talent.example.dj",
  "talent.example.koechin", "talent.example.architekt", "talent.example.schriftstellerin",
];

function Step1({ title, setTitle, desc, setDesc, onNext, t }) {
  const [placeholder, setPlaceholder] = useState(0);
  const EXAMPLES = EXAMPLE_KEYS.map(k => t(k));

  useEffect(() => {
    const timer = setInterval(() => setPlaceholder(p => (p+1) % EXAMPLES.length), 2200);
    return () => clearInterval(timer);
  }, [EXAMPLES.length]);

  const valid = title.trim().length >= 2;

  return (
    <div style={{ animation:"toUp .4s both" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:46, marginBottom:14, animation:"toFloat 3s ease-in-out infinite" }}>✦</div>
        <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight: 600,
          color:T.ink, letterSpacing:"-0.6px", lineHeight:1.2 }}>
          {t("talent.step1.title1")}<br/>{t("talent.step1.title2")}
        </h2>
        <p style={{ margin:0, fontSize:14, color:T.ink3, lineHeight:1.7 }}>
          {t("talent.step1.subtitle1")}<br/>{t("talent.step1.subtitle2")}
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
          placeholder={t("talent.step1.descPlaceholder")}
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
                fontWeight: title===ex ? 600 : 500,
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
          fontWeight: 600, fontSize:15, cursor: valid ? "pointer" : "not-allowed",
          boxShadow: valid ? `0 8px 28px ${T.tealGlow}` : "none",
          transition:"all .25s"
        }}>
        Weiter →
      </button>
    </div>
  );
}

/* ── STEP 2: Wie möchtest du sichtbar sein? ────────────────────────── */
function getModules(t) { return [
  { key:"works",       emoji:"🎨", label:t("talent.module.works"),
    sub:t("talent.module.worksSub"),        color:T.coral,  bg:T.coralBg },
  { key:"experiences", emoji:"✨", label:t("talent.module.experiences"),
    sub:t("talent.module.experiencesSub"),   color:T.gold,   bg:T.goldBg },
  { key:"stories",     emoji:"⚡️", label:t("talent.module.stories"),
    sub:t("talent.module.storiesSub"),      color:T.teal,   bg:T.tealBg },
  { key:"workshops",   emoji:"🛠️", label:t("talent.module.workshops"),
    sub:t("talent.module.workshopsSub"),    color:T.purple, bg:T.purpleBg },
  { key:"bookings",    emoji:"📅", label:t("talent.module.bookings"),
    sub:t("talent.module.bookingsSub"),     color:T.green,  bg:T.greenBg },
]; }

function Step2({ modules, onToggle, onNext, onBack, t }) {
  const activeCount = Object.values(modules).filter(Boolean).length;
  return (
    <div style={{ animation:"toSlide .35s both" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ marginBottom:12, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.7)" }}><HUITalentIcon size={40}/></div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight: 600,
          color:T.ink, letterSpacing:"-0.5px" }}>
          {t("talent.step2.title1")}<br/>{t("talent.step2.title2")}
        </h2>
        <p style={{ margin:0, fontSize:13, color:T.ink3, lineHeight:1.65 }}>
          {t("talent.step2.subtitle1")}<br/>{t("talent.step2.subtitle2")}
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {getModules(t).map((m, i) => {
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
                <div style={{ fontWeight: 600, fontSize:14, color: on ? m.color : T.ink }}>
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
            color:T.muted, fontWeight: 600, fontSize:14, cursor:"pointer" }}>‹</button>
        <button onClick={onNext} disabled={activeCount===0} className="t-tap"
          style={{
            flex:1, padding:"15px", borderRadius:16, border:"none",
            background: activeCount>0
              ? `linear-gradient(135deg,${T.teal},${T.coral})` : "rgba(0,0,0,0.07)",
            color: activeCount>0 ? "white" : T.muted,
            fontWeight: 600, fontSize:15, cursor: activeCount>0 ? "pointer" : "not-allowed",
            boxShadow: activeCount>0 ? `0 6px 24px ${T.tealGlow}` : "none",
            transition:"all .2s"
          }}>
          {activeCount>0 ? `${t("talent.common.next")} (${activeCount} ${t("talent.common.active")}) →` : t("talent.step2.selectAtLeastOne")}
        </button>
      </div>
    </div>
  );
}

/* ── STEP 3: Gestalte dein Profil ──────────────────────────────────── */
function Step3({ intro, setIntro, onFinish, onBack, saving, error, t }) {
  return (
    <div style={{ animation:"toSlide .35s both" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎭</div>
        <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight: 600,
          color:T.ink, letterSpacing:"-0.5px" }}>
          {t("talent.step3.title")}
        </h2>
        <p style={{ margin:0, fontSize:13, color:T.ink3, lineHeight:1.65 }}>
          {t("talent.step3.subtitle")}
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ fontSize:11, fontWeight: 600, color:T.muted,
            letterSpacing:.5, display:"block", marginBottom:8 }}>
            {t("talent.step3.introLabel").toUpperCase()}
          </label>
          <textarea
            value={intro}
            onChange={e => setIntro(e.target.value)}
            placeholder={t("talent.step3.introPlaceholder")}
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
            <strong>{t("talent.step3.avatarCover")}</strong> {t("talent.step3.avatarInfo")}<br/>
            {t("talent.step3.uploadHint")} ✨
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop:14, padding:"12px 14px", borderRadius:12,
          background:"rgba(255,80,80,0.07)", border:"1px solid rgba(255,80,80,0.18)",
          fontSize:13, color:"#E53E3E", display:"flex", alignItems:"center", gap:3 }}><HUIWarnIcon size={13}/>{error}</div>
      )}

      <div style={{ display:"flex", gap:10, marginTop:22 }}>
        <button onClick={onBack} className="t-tap"
          style={{ padding:"15px 18px", borderRadius:16,
            background:T.card, border:`1.5px solid ${T.border}`,
            color:T.muted, fontWeight: 600, fontSize:14, cursor:"pointer" }}>‹</button>
        <button onClick={onFinish} disabled={saving} className="t-tap"
          style={{
            flex:1, padding:"15px", borderRadius:16, border:"none",
            background:`linear-gradient(135deg,${T.teal},${T.coral})`,
            color:"white", fontWeight: 600, fontSize:15, cursor:"pointer",
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
              {t("talent.common.saving")}
            </>
          ) : `✦ ${t("talent.step3.activate")}`}
        </button>
      </div>
    </div>
  );
}

/* ── Success ────────────────────────────────────────────────────────── */
function SuccessView({ onDone, t }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
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
      <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight: 600,
        color:T.ink, letterSpacing:"-0.5px" }}>{t("talent.success.title")}</h2>
      <p style={{ margin:0, fontSize:14, color:T.ink3, lineHeight:1.7 }}>
        {t("talent.success.body1")}<br/>
        {t("talent.success.body2")} ✨
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════ */
export default function TalentOnboarding({ onClose = () => {}, onActivate = () => {} }) {
  useModalRegistration(true, () => onClose?.(), "TalentOnboarding");
  const { user, profile, setProfile } = useAuth();
  const { t } = useTranslation();
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
        is_talent:           true,
        role:                "talent",
        updated_at:          new Date().toISOString(),
      };
      // FIX 2026-08-13: ProfileService.update() statt rohem Supabase-Call.
      // Root Cause: bare .select() (=SELECT *) traf nach Security-Hardening
      // (Migration 104) gesperrte Spalten (stripe_account_id, bank_*, blocked,
      // is_system_account) fuer 'authenticated' -> "permission denied for table
      // profiles". ProfileService.update() nutzt das sichere F.profile-Feldset
      // (IDENTITY_CONTRACT), das diese Spalten nicht enthaelt (SSOT).
      const { data, error: err } = await ProfileService.update(user.id, updates);
      if (err) throw err;
      if (setProfile) setProfile(p => ({ ...p, ...updates }));
      // FIX (2026-08-13): Orb-Stufe muss nach Talentprofil-Aktivierung
      // sofort auf Stufe 2 springen (is_talent=true), statt bis zu 5 Min.
      // (CACHE_TTL) auf der alten gecachten Stufe 1 zu haengen.
      invalidateOrbStageCache(user.id);
      setDone(true);
    } catch(e) {
      setError(e.message || t("talent.common.saveError"));
    } finally {
      setSaving(false);
    }
  }

  function handleDone() {
    if (onActivate) onActivate({ modules, title });
    onClose();
  }

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
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
        paddingBottom:"max(28px,calc(max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px) + 20px))",
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
          <SuccessView onDone={handleDone} t={t}/>
        ) : step===0 ? (
          <Step1 title={title} setTitle={setTitle}
            desc={desc} setDesc={setDesc}
            onNext={() => setStep(1)} t={t}/>
        ) : step===1 ? (
          <Step2 modules={modules} onToggle={toggleModule}
            onNext={() => setStep(2)} onBack={() => setStep(0)} t={t}/>
        ) : (
          <Step3 intro={intro} setIntro={setIntro}
            onFinish={save} onBack={() => setStep(1)}
            saving={saving} error={error} t={t}/>
        )}

        <div style={{ height:8 }}/>
      </div>
    </div>,
    document.body
  );
}

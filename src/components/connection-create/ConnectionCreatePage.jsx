// connection-create/ConnectionCreatePage.jsx v2
// HUI "Neue Verbindung erstellen" — 3-Step Emotional Flow
// Step 1: Inspiration (Typ wählen)
// Step 2: Ausdruck (Details)
// Step 3: Realität (Preview + Publish)
//
// zIndex: 10100 (über BottomNav 9999)

import React, { useState, useCallback, useRef } from "react";
import StepProgressBar        from "./StepProgressBar.jsx";
import StepOneTypeSelection   from "./StepOneTypeSelection.jsx";
import StepTwoConnectionDetails from "./StepTwoConnectionDetails.jsx";
import StepThreePreview       from "./StepThreePreview.jsx";
import { useAuth }            from "../../lib/AuthContext.jsx";
import { HUI } from "../../design/hui.design.js";
import { supabase } from "../../lib/supabaseClient.js";
import { reportActionFailure, reportInsertFailure } from "../../lib/runtimeDebug.js";

const C = {
  violet:HUI.COLOR.violet, violet2:"#7C3AED",
  ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.48)",
  cream:"#F0EEF5",
};

const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  .hui-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .hui-scroll::-webkit-scrollbar { display:none; }

  @keyframes page-in {
    from{ opacity:0; transform:translateY(22px) scale(0.98); }
    to  { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes step-fade-in {
    from{ opacity:0; transform:translateX(18px); }
    to  { opacity:1; transform:translateX(0); }
  }
  @keyframes step-fade-out {
    from{ opacity:1; transform:translateX(0); }
    to  { opacity:0; transform:translateX(-18px); }
  }
  @keyframes atm-a {
    0%,100%{transform:translate(0,0) scale(1);}
    50%    {transform:translate(14px,-10px) scale(1.05);}
  }
  @keyframes atm-b {
    0%,100%{transform:translate(0,0) scale(1);}
    50%    {transform:translate(-10px,12px) scale(1.04);}
  }
  @keyframes atm-c {
    0%,100%{transform:translate(0,0) scale(1);}
    50%    {transform:translate(8px,8px) scale(1.03);}
  }
  @keyframes nav-up {
    from{opacity:0;transform:translateY(14px);}
    to  {opacity:1;transform:translateY(0);}
  }
`;

/* ── Step Atmosphere: subtile Farbe ändert sich je Step ── */
const STEP_ATMOSPHERES = {
  1: { c1:"rgba(139,92,246,0.07)", c2:"rgba(22,215,197,0.05)", c3:"rgba(255,138,107,0.04)" },
  2: { c1:"rgba(22,215,197,0.08)", c2:"rgba(139,92,246,0.05)", c3:"rgba(255,138,107,0.04)" },
  3: { c1:"rgba(139,92,246,0.10)", c2:"rgba(139,92,246,0.06)", c3:"rgba(22,215,197,0.05)" },
};

function Atmosphere({ step }) {
  const a = STEP_ATMOSPHERES[step] || STEP_ATMOSPHERES[1];
  return (
    <>
      <div style={{
        position:"fixed", top:"-15%", right:"-8%",
        width:"55vw", height:"55vw", maxWidth:520, borderRadius:"50%",
        background:`radial-gradient(ellipse,${a.c1} 0%,transparent 68%)`,
        filter:"blur(50px)", pointerEvents:"none", zIndex:0,
        animation:"atm-a 16s ease-in-out infinite",
        transition:"background 1.2s ease",
      }}/>
      <div style={{
        position:"fixed", bottom:"-12%", left:"-6%",
        width:"45vw", height:"45vw", maxWidth:420, borderRadius:"50%",
        background:`radial-gradient(ellipse,${a.c2} 0%,transparent 68%)`,
        filter:"blur(40px)", pointerEvents:"none", zIndex:0,
        animation:"atm-b 20s ease-in-out infinite",
        transition:"background 1.2s ease",
      }}/>
      <div style={{
        position:"fixed", top:"45%", left:"30%",
        width:"30vw", height:"30vw", maxWidth:280, borderRadius:"50%",
        background:`radial-gradient(ellipse,${a.c3} 0%,transparent 70%)`,
        filter:"blur(35px)", pointerEvents:"none", zIndex:0,
        animation:"atm-c 24s ease-in-out infinite",
        transition:"background 1.2s ease",
      }}/>
    </>
  );
}

/* ── Step Titel ── */
const STEP_META = {
  1: { emoji:"✨", hint:"W\u00e4hle einen Moment" },
  2: { emoji:"\uD83D\uDCDD", hint:"Gib deiner Verbindung Form" },
  3: { emoji:"\uD83C\uDF1F", hint:"Bereit zum Teilen" },
};

/* ── Floating Navigation (sticky unten) ── */
function FloatingNav({ step, canNext, onBack, onNext, isLast, publishing = false }) {
  return (
    <div style={{
      position:"sticky", bottom:0, zIndex:10, flexShrink:0,
      padding:"14px 20px max(20px,env(safe-area-inset-bottom,20px))",
      background:"rgba(240,238,245,0.88)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      borderTop:"1px solid rgba(139,92,246,0.08)",
      display:"flex", gap:12, alignItems:"center",
      animation:"nav-up 0.25s ease both",
    }}>
      {/* Zurück */}
      {step > 1 ? (
        <button onClick={onBack} style={{
          height:48, paddingInline:22, borderRadius:99,
          background:"rgba(255,255,255,0.82)",
          border:"1.5px solid rgba(139,92,246,0.18)",
          color:C.muted, fontSize:14.5, fontWeight:600,
          cursor:"pointer", flexShrink:0,
          WebkitTapHighlightColor:"transparent",
          transition:"transform 0.14s",
          display:"flex", alignItems:"center", gap:6,
        }}
        onTouchStart={e=>e.currentTarget.style.transform="scale(0.96)"}
        onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
        >← Zurück</button>
      ) : (
        <div style={{ flex:"none", width:10 }}/>
      )}

      {/* Weiter / Veröffentlichen */}
      <button
        onClick={onNext}
        disabled={!canNext || publishing}
        style={{
          flex:1, height:50, borderRadius:99,
          background: (!canNext || publishing)
            ? "rgba(139,92,246,0.28)"
            : `linear-gradient(135deg,${C.violet} 0%,${C.violet2} 100%)`,
          border:"none",
          color: canNext ? "white" : "rgba(139,92,246,0.50)",
          fontSize:16, fontWeight:800,
          cursor: (!canNext || publishing) ? "default" : "pointer",
          transition:"all 0.2s",
          boxShadow: (!canNext || publishing) ? "none" : "0 6px 20px rgba(139,92,246,0.30)",
          animation: (!canNext || publishing) ? "none" : "nav-btn-pulse 2.5s ease-in-out infinite",
          letterSpacing:-0.2,
          WebkitTapHighlightColor:"transparent",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}
        onTouchStart={e=>{if(canNext){e.currentTarget.style.transform="scale(0.965) translateY(1px)";e.currentTarget.style.transition="transform 120ms cubic-bezier(0.22,1,0.36,1)";}}}
        onPointerUp={e=>{e.currentTarget.style.transform="";e.currentTarget.style.transition="transform 200ms cubic-bezier(0.16,1,0.30,1)"}}
        onPointerLeave={e=>{e.currentTarget.style.transform=""}}
        onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
      >
        {isLast ? (
          publishing ? (
            <><span style={{
              display:"inline-block",
              width:16, height:16, borderRadius:"50%",
              border:"2.5px solid rgba(255,255,255,0.35)",
              borderTopColor:"white",
              animation:"floatnav-spin 0.7s linear infinite",
            }}/> Wird veröffentlicht…</>
          ) : (
            <>Verbindung veröffentlichen
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </>
          )
        ) : (
          <>Weiter <span style={{fontSize:17}}>→</span></>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HAUPT-ORCHESTRATOR
══════════════════════════════════════════════════════════════════ */
export default function ConnectionCreatePage({ onClose, onPublish }) {
  const { user } = useAuth();

  const [step,       setStep]       = useState(1);
  const [animDir,    setAnimDir]    = useState("in");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [publishDone, setPublishDone] = useState(false);
  const scrollRef = useRef(null);

  const [formData, setFormData] = useState({
    type:        "",           /* leer → Weiter disabled bis Card getappt */
    title:       "",
    description: "",
    date:        new Date().toISOString().slice(0,10),
    time:        "20:00",
    location:    "",
    participants: 30,
    cost:        "free",
    costAmount:  "",
    mood:        "gesellig",
    visibility:  "public",
    openness:    "open",
    extras:      "",
  });

  /* Navigation */
  function goTo(newStep) {
    setAnimDir(newStep > step ? "in" : "out");
    setStep(newStep);
    scrollRef.current?.scrollTo({ top:0, behavior:"smooth" });
  }

  const handleNext = useCallback(async () => {
    if (step < 3) { goTo(step + 1); return; }

    // ── STEP 1: Button wurde geklickt ─────────────────────────────
    console.log("[HUI CONNECTION] step 1 click", {
      step,
      publishing,
      user_id: user?.id ?? "MISSING",
      formData_type:  formData.type  || "(leer)",
      formData_title: formData.title || "(leer)",
    });

    if (publishing) {
      console.warn("[HUI CONNECTION] step 1 BLOCKED — publishing bereits true (Doppel-Klick)");
      return;
    }
    setPublishing(true);
    setPublishError(null);
    setPublishDone(false);
    let published = false;

    try {
      // Guard: user muss eingeloggt sein
      if (!user?.id) {
        throw new Error("Nicht eingeloggt. Verbindung kann nicht gespeichert werden.");
      }

      const payload = {
        user_id:          user.id,
        type:             formData.type             || "kollab",
        title:            (formData.title     || "").trim() || "Neue Verbindung",
        description:      (formData.description|| "").trim() || null,
        date:             formData.date             || null,
        time:             formData.time             || null,
        location:         (formData.location  || "").trim() || null,
        max_participants: Number(formData.participants) || 30,
        cost:             formData.cost             || "free",
        cost_amount:      formData.costAmount ? Number(formData.costAmount) : null,
        mood:             formData.mood             || null,
        visibility:       formData.visibility       || "public",
        openness:         formData.openness         || "open",
        status:           "active",
      };

      // ── STEP 2: Payload gebaut ───────────────────────────────────
      console.log("[HUI CONNECTION] step 2 payload", payload);

      // ── STEP 3: Insert startet ───────────────────────────────────
      console.log("[HUI CONNECTION] step 3 insert start →", "supabase.from('connections').insert(...)");

      const { data: connData, error: dbErr } = await supabase
        .from("connections")
        .insert(payload)
        .select("id")
        .single();

      if (dbErr) {
        // ── STEP 5: Insert Error ─────────────────────────────────
        console.error("[HUI CONNECTION] step 5 insert error", {
          code:    dbErr.code,
          message: dbErr.message,
          details: dbErr.details,
          hint:    dbErr.hint,
        });
        throw new Error(`Verbindung konnte nicht gespeichert werden: ${dbErr.message}`);
      } else {
        // ── STEP 4: Insert Success ───────────────────────────────
        console.log("[HUI CONNECTION] step 4 insert success", {
          id:         connData?.id,
          returned:   connData,
        });
      }

      published = true;
      setPublishDone(true);
      onPublish?.({ ...formData, id: connData?.id ?? null, creator_id: user.id });

    } catch (err) {
      console.error("[HUI CONNECTION] step 5 insert EXCEPTION", {
        message: err?.message,
        stack:   err?.stack?.split("\n").slice(0,3).join(" | "),
      });
      const message = err?.message || "Verbindung konnte nicht veröffentlicht werden.";
      setPublishError(message);
      if (!user?.id) {
        reportActionFailure({
          flow: "connection-create",
          step: "auth",
          entity: "connections",
          message,
          error: err,
        });
      } else {
        reportInsertFailure({
          category: "publish",
          flow: "connection-create",
          step: "insert",
          entity: "connections",
          error: err,
          message,
        });
      }
    } finally {
      // ── STEP 6: Flow schließen ─────────────────────────────────
      console.log("[HUI CONNECTION] step 6 closing flow", {
        published,
        will_close: published,
      });
      setPublishing(false);
      if (published) {
        setTimeout(() => {
          // ── STEP 7: navigate / onClose ────────────────────────
          console.log("[HUI CONNECTION] step 7 navigate home — onClose() wird aufgerufen");
          onClose?.();
        }, 1200);
      }
    }
  }, [step, publishing, formData, user?.id, onPublish, onClose]);

  /* Can proceed? */
  const canNext =
    step === 1 ? !!formData.type :
    step === 2 ? formData.title?.trim().length > 1 :
    true;

  const meta = STEP_META[step];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10100,  /* über BottomNav (9999) */
      background:C.cream,
      display:"flex", flexDirection:"column",
      overflow:"clip",   /* iOS-Fix: kein neuer stacking context */
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      animation:"page-in 0.26s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      <style>{CSS}</style>

      {/* Atmosphere — ändert sich sanft pro Step */}
      <Atmosphere step={step}/>

      {/* ── TopBar ── */}
      <div style={{
        position:"relative", zIndex:5, flexShrink:0,
        padding:"max(50px,env(safe-area-inset-top,50px)) 20px 14px",
        background:"rgba(240,238,245,0.88)",
        backdropFilter:"blur(28px) saturate(1.6)",
        WebkitBackdropFilter:"blur(28px) saturate(1.6)",
        borderBottom:"1px solid rgba(139,92,246,0.07)",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:18,
        }}>
          {/* × Schließen */}
          <button onClick={onClose} style={{
            width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,0.72)", border:"1px solid rgba(0,0,0,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:17, color:C.muted,
            WebkitTapHighlightColor:"transparent",
          }}>×</button>

          {/* Title */}
          <div style={{ textAlign:"center" }}>
            <div style={{
              fontSize:15.5, fontWeight:800, color:C.ink, letterSpacing:-0.3,
            }}>
              <span style={{ marginRight:5 }}>{meta.emoji}</span>
              Neue Verbindung
            </div>
            <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>
              {meta.hint}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ width:36 }}/>
        </div>

        {/* Progress Bar */}
        <StepProgressBar step={step}/>
      </div>

      {/* ── Step Content ── */}
      <div
        ref={scrollRef}
        className="hui-scroll"
        key={step}
        style={{
          flex:1, overflowY:"auto", overflowX:"hidden",
          position:"relative", zIndex:3,
          paddingTop:24,
          paddingBottom:24,  /* Weiter-Button scrollt vollständig sichtbar */
          animation:`step-fade-in 0.28s cubic-bezier(0.22,1,0.36,1) both`,
          display:"flex", flexDirection:"column",
        }}
      >
        {step === 1 && (
          <StepOneTypeSelection
            value={formData.type}
            onSelect={key => {
              setFormData(d => ({ ...d, type: key }));
            }}
            onAdvance={() => {
              goTo(2);
            }}
          />
        )}
        {step === 2 && (
          <StepTwoConnectionDetails
            data={formData}
            onChange={setFormData}
          />
        )}
        {step === 3 && (
          <StepThreePreview
            data={{ ...formData }}
            onPublish={handleNext}
            publishing={publishing}
            publishError={publishError}
            publishDone={publishDone}
          />
        )}
      </div>

      {/* ── Floating Navigation (Step 2+3) ── */}
      {/* Step 1 hat eigenen Weiter-Button inline nach den Cards */}
      {step > 1 && (
        <FloatingNav
          step={step}
          canNext={canNext}
          onBack={() => goTo(step - 1)}
          onNext={handleNext}
          isLast={step === 3}
          publishing={step === 3 ? publishing : false}
        />
      )}
    </div>
  );
}

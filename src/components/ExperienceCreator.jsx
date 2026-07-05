// ExperienceCreator.jsx — Warm emotional Experience Flow
// Fühlt sich an wie eine Einladung, nicht wie ein Formular.
import React, { useState, useRef } from "react";
import { publishExperience } from "../lib/factories/experienceContract.js";
import { supabase } from "../lib/supabaseClient";
import { useAuth }  from "../lib/AuthContext";
import { HUI } from "../design/hui.design.js";

const T = {
  gold:HUI.COLOR.gold,   goldGlow:"rgba(245,166,35,.32)",  goldBg:"rgba(245,166,35,.09)",
  teal:HUI.COLOR.teal,   tealGlow:"rgba(22,215,197,.28)",  tealBg:"rgba(22,215,197,.09)",
  coral:HUI.COLOR.coral,  coralBg:"rgba(255,138,107,.09)",
  purple:HUI.COLOR.violetLight, purpleBg:"rgba(167,139,250,.10)",
  green:"#22C55E",  greenBg:"rgba(34,197,94,.10)",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2, ink3:HUI.COLOR.muted,
  muted:HUI.COLOR.muted, border:"rgba(0,0,0,.08)",
  warm:HUI.COLOR.cream, card:"#FFFFFF",
};

const MOODS = [
  {k:"relaxing",    e:"🌿", l:"Entspannend"},
  {k:"creative",    e:"🎨", l:"Kreativ"},
  {k:"energetic",   e:"⚡️", l:"Energetisch"},
  {k:"deep",        e:"🌊", l:"Tiefgründig"},
  {k:"inspiring",   e:"✨", l:"Inspirierend"},
  {k:"adventurous", e:"🏔️", l:"Abenteuerlich"},
];

const CATEGORIES = [
  "Coaching","Fotoshooting","Meditation","Yoga","Musiksession",
  "Kreativkurs","Stadtführung","Atelierbesuch","Workshop","Sonstiges"
];

const CSS = `
  @keyframes ecUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ecIn{from{opacity:0}to{opacity:1}}
  @keyframes ecSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes ecPop{0%{transform:scale(.75)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
  .ec-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .14s,opacity .14s}
  .ec-tap:active{transform:scale(.93)!important;opacity:.7}
  .ec-scroll::-webkit-scrollbar{display:none}
  .ec-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

function ProgDots({ step }) {
  return (
    <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:24}}>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{height:3,borderRadius:2,
          width:i===step?28:8,
          background:i<=step?`linear-gradient(90deg,${T.gold},${T.coral})`:"rgba(0,0,0,.1)",
          transition:"all .4s cubic-bezier(.34,1.4,.64,1)"}}/>
      ))}
    </div>
  );
}

/* ── Step 1: Was erleben Menschen? ── */
function S1({ f, set, onNext }) {
  const ok = f.title.trim().length >= 2;
  return (
    <div style={{animation:"ecUp .4s both"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:40,marginBottom:10}}>✨</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px",lineHeight:1.2}}>
          Was werden<br/>Menschen erleben?
        </h2>
        <p style={{margin:0,fontSize:13,color:T.ink3,lineHeight:1.65}}>
          Beschreibe das Gefühl, nicht das Produkt.
        </p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <input value={f.title} onChange={e=>set({...f,title:e.target.value})}
          placeholder="z.B. Stiller Morgen-Yoga am See"
          style={{width:"100%",padding:"15px 16px",borderRadius:16,
            border:`2px solid ${f.title?T.gold:T.border}`,
            background:T.card,fontSize:16,color:T.ink,outline:"none",
            fontFamily:"inherit",fontWeight:600,
            boxShadow:f.title?`0 0 0 4px ${T.goldBg}`:"none",
            transition:"all .2s",boxSizing:"border-box"}}/>

        <textarea value={f.desc} onChange={e=>set({...f,desc:e.target.value})}
          placeholder="Was passiert? Was spüren sie? Was nehmen sie mit?"
          rows={3}
          style={{width:"100%",padding:"15px 16px",borderRadius:16,
            border:`2px solid ${f.desc?T.gold:T.border}`,
            background:T.card,fontSize:14,color:T.ink,outline:"none",
            fontFamily:"inherit",resize:"none",lineHeight:1.6,
            transition:"all .2s",boxSizing:"border-box"}}/>

        {/* Mood */}
        <div>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,
            color:T.muted,letterSpacing:.5}}>STIMMUNG</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {(MOODS || []).filter(Boolean).map((m,i)=>{
              const on=f.mood===m.k;
              return (
                <div key={m.k} className="ec-tap"
                  onClick={()=>set({...f,mood:m.k})}
                  style={{padding:"12px 8px",borderRadius:14,textAlign:"center",
                    cursor:"pointer",
                    background:on?T.goldBg:T.card,
                    border:`2px solid ${on?T.gold+"55":T.border}`,
                    transition:"all .2s",animation:`ecUp ${.3+i*.04}s both`}}>
                  <div style={{fontSize:20,marginBottom:4}}>{m.e}</div>
                  <div style={{fontSize:11,fontWeight:700,
                    color:on?T.gold:T.ink3}}>{m.l}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kategorie */}
        <div className="ec-scroll"
          style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2}}>
          {(CATEGORIES || []).filter(Boolean).map(c=>(
            <button key={c} className="ec-tap"
              onClick={()=>set({...f,category:c})}
              style={{flexShrink:0,padding:"8px 14px",borderRadius:999,
                border:`1.5px solid ${f.category===c?T.gold:"transparent"}`,
                background:f.category===c?T.goldBg:"rgba(0,0,0,.04)",
                color:f.category===c?T.gold:T.ink3,
                fontWeight:f.category===c?700:500,fontSize:12,
                cursor:"pointer",transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <button className="ec-tap" onClick={onNext} disabled={!ok}
        style={{width:"100%",marginTop:22,padding:"17px",borderRadius:18,border:"none",
          background:ok?`linear-gradient(135deg,${T.gold},${T.coral})`:"rgba(0,0,0,.07)",
          color:ok?"white":T.muted,fontWeight:900,fontSize:15,
          cursor:ok?"pointer":"not-allowed",
          boxShadow:ok?`0 6px 24px ${T.goldGlow}`:"none",
          transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
        Weiter →
      </button>
    </div>
  );
}

/* ── Step 2: Details ── */
function S2({ f, set, onNext, onBack }) {
  return (
    <div style={{animation:"ecUp .35s both"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:10}}>📍</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px"}}>Die Details</h2>
        <p style={{margin:0,fontSize:13,color:T.ink3}}>
          Praktische Infos für Interessierte.
        </p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Dauer */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:T.muted,
              letterSpacing:.5,display:"block",marginBottom:8}}>DAUER</label>
            <input value={f.duration} onChange={e=>set({...f,duration:e.target.value})}
              placeholder="z.B. 90 Min"
              style={{width:"100%",padding:"13px",borderRadius:14,
                border:`1.5px solid ${f.duration?T.gold:T.border}`,
                background:T.card,fontSize:14,color:T.ink,outline:"none",
                fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:T.muted,
              letterSpacing:.5,display:"block",marginBottom:8}}>PREIS (€, opt.)</label>
            <input type="number" value={f.price} onChange={e=>set({...f,price:e.target.value})}
              placeholder="0"
              style={{width:"100%",padding:"13px",borderRadius:14,
                border:`1.5px solid ${f.price?T.gold:T.border}`,
                background:T.card,fontSize:14,color:T.ink,outline:"none",
                fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>

        {/* Ort */}
        <div>
          <label style={{fontSize:11,fontWeight:700,color:T.muted,
            letterSpacing:.5,display:"block",marginBottom:8}}>ORT</label>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            {[{k:"offline",l:"Vor Ort"},{k:"online",l:"Online"},{k:"both",l:"Beides"}].map(opt=>(
              <button key={opt.k} className="ec-tap"
                onClick={()=>set({...f,format:opt.k})}
                style={{flex:1,padding:"10px",borderRadius:12,border:"none",
                  background:f.format===opt.k
                    ?`linear-gradient(135deg,${T.gold},${T.coral})`
                    :"rgba(0,0,0,.05)",
                  color:f.format===opt.k?"white":T.ink3,
                  fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
                {opt.l}
              </button>
            ))}
          </div>
          {f.format!=="online" && (
            <input value={f.location} onChange={e=>set({...f,location:e.target.value})}
              placeholder="Adresse oder Stadtname"
              style={{width:"100%",padding:"13px 16px",borderRadius:14,
                border:`1.5px solid ${T.border}`,background:T.card,
                fontSize:14,color:T.ink,outline:"none",
                fontFamily:"inherit",boxSizing:"border-box"}}/>
          )}
        </div>

        {/* Teilnehmer */}
        <div>
          <label style={{fontSize:11,fontWeight:700,color:T.muted,
            letterSpacing:.5,display:"block",marginBottom:8}}>MAX. TEILNEHMENDE (opt.)</label>
          <input type="number" value={f.maxParticipants}
            onChange={e=>set({...f,maxParticipants:e.target.value})}
            placeholder="Unbegrenzt"
            style={{width:"100%",padding:"13px 16px",borderRadius:14,
              border:`1.5px solid ${T.border}`,background:T.card,
              fontSize:14,color:T.ink,outline:"none",
              fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>
      </div>

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onBack} className="ec-tap"
          style={{padding:"15px 18px",borderRadius:16,background:T.card,
            border:`1.5px solid ${T.border}`,color:T.muted,
            fontWeight:700,fontSize:14,cursor:"pointer"}}>‹</button>
        <button onClick={onNext} className="ec-tap"
          style={{flex:1,padding:"15px",borderRadius:16,border:"none",
            background:`linear-gradient(135deg,${T.gold},${T.coral})`,
            color:"white",fontWeight:900,fontSize:15,cursor:"pointer",
            boxShadow:`0 6px 24px ${T.goldGlow}`}}>Weiter →</button>
      </div>
    </div>
  );
}

/* ── Step 3: Medien ── */
function S3({ images, setImages, onNext, onBack }) {
  const ref = useRef(null);
  function addFiles(e) {
    const files = Array.from(e.target.files||[]);
    const newImgs = files.map(f=>({file:f,preview:URL.createObjectURL(f),id:Math.random()}));
    setImages(p=>[...p,...newImgs].slice(0,6));
  }
  return (
    <div style={{animation:"ecUp .35s both"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:10}}>🖼️</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px"}}>Atmosphäre zeigen</h2>
        <p style={{margin:0,fontSize:13,color:T.ink3}}>
          Bilder sagen mehr als Worte.
        </p>
      </div>

      <input ref={ref} type="file" accept="image/*,video/*"
        multiple style={{display:"none"}} onChange={addFiles}/>

      {images.length===0 ? (
        <div className="ec-tap" onClick={()=>ref.current?.click()}
          style={{border:`2px dashed ${T.border}`,borderRadius:20,
            padding:"36px 20px",textAlign:"center",cursor:"pointer",
            background:"rgba(245,166,35,.03)"}}>
          <div style={{fontSize:32,marginBottom:10}}>📸</div>
          <p style={{margin:"0 0 4px",fontWeight:700,color:T.ink}}>Bilder hinzufügen</p>
          <p style={{margin:0,fontSize:12,color:T.muted}}>Stimmungsbilder, Making-of, Ort</p>
        </div>
      ) : (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {images.map((img,i)=>(
              <div key={img.id} style={{aspectRatio:"1",borderRadius:14,
                overflow:"hidden",position:"relative"}}>
                <img src={img.preview} alt=""
                  style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <button className="ec-tap"
                  onClick={()=>setImages(p=>p.filter((_,idx)=>idx!==i))}
                  style={{position:"absolute",top:5,right:5,width:22,height:22,
                    borderRadius:"50%",background:"rgba(0,0,0,.55)",
                    color:"white",border:"none",cursor:"pointer",
                    fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            ))}
            {images.length<6 && (
              <div className="ec-tap" onClick={()=>ref.current?.click()}
                style={{aspectRatio:"1",borderRadius:14,
                  border:`2px dashed ${T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",background:"rgba(0,0,0,.02)",
                  fontSize:24,color:T.muted}}>+</div>
            )}
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onBack} className="ec-tap"
          style={{padding:"15px 18px",borderRadius:16,background:T.card,
            border:`1.5px solid ${T.border}`,color:T.muted,
            fontWeight:700,fontSize:14,cursor:"pointer"}}>‹</button>
        <button onClick={onNext} className="ec-tap"
          style={{flex:1,padding:"15px",borderRadius:16,border:"none",
            background:`linear-gradient(135deg,${T.gold},${T.coral})`,
            color:"white",fontWeight:900,fontSize:15,cursor:"pointer",
            boxShadow:`0 6px 24px ${T.goldGlow}`}}>Weiter →</button>
      </div>
    </div>
  );
}

/* ── Step 4: Veröffentlichen ── */
const BOOKING_MODES = [
  {k:"bookable", e:"📅", l:"Direkt buchbar",  s:"Sofort buchbar über HUI"},
  {k:"request",  e:"💬", l:"Anfrage senden",  s:"Menschen schreiben dir zuerst"},
  {k:"limited",  e:"🌟", l:"Limitierte Plätze",s:"Exklusiv & begrenzt"},
];

function S4({ f, set, onPublish, onBack, saving, error }) {
  return (
    <div style={{animation:"ecUp .35s both"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:10}}>🚀</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px"}}>Teilen</h2>
        <p style={{margin:0,fontSize:13,color:T.ink3}}>Wie können Menschen teilnehmen?</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {(BOOKING_MODES || []).filter(Boolean).map((m,i)=>{
          const on=f.bookingMode===m.k;
          return (
            <div key={m.k} className="ec-tap"
              onClick={()=>set({...f,bookingMode:m.k})}
              style={{display:"flex",alignItems:"center",gap:14,
                padding:"15px 16px",borderRadius:16,cursor:"pointer",
                background:on?T.goldBg:T.card,
                border:`2px solid ${on?T.gold+"55":T.border}`,
                transition:"all .2s",animation:`ecUp ${.3+i*.05}s both`}}>
              <span style={{fontSize:22}}>{m.e}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:on?T.gold:T.ink}}>{m.l}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:1}}>{m.s}</div>
              </div>
              <div style={{width:22,height:22,borderRadius:11,
                border:`2px solid ${on?T.gold:T.border}`,
                background:on?T.gold:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0,transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
                {on && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{marginTop:12,padding:"11px 14px",borderRadius:12,
          background:"rgba(255,80,80,.07)",border:"1px solid rgba(255,80,80,.18)",
          fontSize:13,color:"#E53E3E"}}>⚠️ {error}</div>
      )}

      <div style={{display:"flex",gap:10,marginTop:18}}>
        <button onClick={onBack} className="ec-tap"
          style={{padding:"15px 18px",borderRadius:16,background:T.card,
            border:`1.5px solid ${T.border}`,color:T.muted,
            fontWeight:700,fontSize:14,cursor:"pointer"}}>‹</button>
        <button onClick={onPublish} disabled={saving||!f.bookingMode}
          className="ec-tap"
          style={{flex:1,padding:"15px",borderRadius:16,border:"none",
            background:f.bookingMode
              ?`linear-gradient(135deg,${T.gold},${T.coral})`:"rgba(0,0,0,.07)",
            color:f.bookingMode?"white":T.muted,fontWeight:900,fontSize:15,
            cursor:f.bookingMode?"pointer":"not-allowed",opacity:saving?.7:1,
            boxShadow:f.bookingMode?`0 6px 24px ${T.goldGlow}`:"none",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {saving?(
            <><div style={{width:17,height:17,borderRadius:"50%",
              border:"2.5px solid rgba(255,255,255,.3)",
              borderTop:"2.5px solid white",
              animation:"ecSpin .8s linear infinite"}}/>Speichere…</>
          ):"✨ Experience veröffentlichen"}
        </button>
      </div>
    </div>
  );
}

/* ══ MAIN ══════════════════════════════════════════════════════════ */
export default function ExperienceCreator({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title:"",desc:"",mood:"",category:"",
    duration:"",price:"",format:"offline",location:"",maxParticipants:"",
    bookingMode:"",
  });
  const [images,  setImages]  = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [done,    setDone]    = useState(false);

  async function publish() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const imgUrls = [];
      for (let i=0; i<images.length; i++) {
        const img = images[i];
        const ext = img.file.name.split(".").pop();
        const path = `experiences/${user.id}/${Date.now()}_${i}.${ext}`;
        const { error:upErr } = await supabase.storage
          .from("media").upload(path, img.file, {contentType:img.file.type});
        if (upErr) { console.error("[ExperienceCreator] ❌ storage:", upErr.message, upErr.statusCode); throw upErr; }
        const {data:{publicUrl}} = supabase.storage.from("media").getPublicUrl(path);
        imgUrls.push(publicUrl);
      }

      // Contract Layer: normalize → validate → insert (Phase 4E)
      const { data: expData, error: contractErr } = await publishExperience(
        supabase, form, user.id, imgUrls
      );
      const dbErr = contractErr ? new Error(contractErr.message) : null;
      if (dbErr) { console.error("[ExperienceCreator] db:", dbErr); throw dbErr; }
      setDone(true);
      setTimeout(()=>{ if(onSuccess) onSuccess(); onClose(); }, 2000);
    } catch(e) {
      setError(e.message||"Fehler beim Speichern");
    } finally { setSaving(false); }
  }

  if (done) return (
    <div style={{position:"fixed",inset:0,zIndex:10500,
      background:`linear-gradient(135deg,${T.gold},${T.coral})`,
      display:"flex",alignItems:"center",justifyContent:"center",
      animation:"ecIn .3s both"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",color:"white",padding:"20px"}}>
        <div style={{fontSize:64,marginBottom:16,animation:"ecPop .5s both"}}>✨</div>
        <h2 style={{margin:"0 0 8px",fontSize:28,fontWeight:900}}>Experience ist live!</h2>
        <p style={{margin:0,opacity:.85,fontSize:15}}>
          Menschen können sie jetzt entdecken und buchen.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:10500,
      background:"rgba(8,8,8,.55)",backdropFilter:"blur(10px)",
      WebkitBackdropFilter:"blur(10px)",
      display:"flex",alignItems:"flex-end",animation:"ecIn .2s both"}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:520,margin:"0 auto",
        background:T.warm,borderRadius:"28px 28px 0 0",
        padding:"20px 20px 0",
        paddingBottom:"max(28px,calc(env(safe-area-inset-bottom,0px)+20px))",
        maxHeight:"94vh",overflowY:"auto"}}
        className="ec-scroll">

        <div style={{width:36,height:4,borderRadius:2,background:"rgba(0,0,0,.1)",
          margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",
          alignItems:"center",marginBottom:4}}>
          <ProgDots step={step}/>
          <button onClick={onClose} className="ec-tap"
            style={{marginLeft:"auto",width:30,height:30,borderRadius:"50%",
              background:"rgba(0,0,0,.06)",border:"none",cursor:"pointer",
              fontSize:14,color:T.muted,display:"flex",alignItems:"center",
              justifyContent:"center",flexShrink:0}}>✕</button>
        </div>

        {step===0 && <S1 f={form} set={setForm} onNext={()=>setStep(1)}/>}
        {step===1 && <S2 f={form} set={setForm} onNext={()=>setStep(2)} onBack={()=>setStep(0)}/>}
        {step===2 && <S3 images={images} setImages={setImages} onNext={()=>setStep(3)} onBack={()=>setStep(1)}/>}
        {step===3 && <S4 f={form} set={setForm} onPublish={publish} onBack={()=>setStep(2)} saving={saving} error={error}/>}
        <div style={{height:8}}/>
      </div>
    </div>
  );
}
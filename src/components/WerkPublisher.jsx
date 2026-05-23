// WerkPublisher.jsx — 4-Step Premium Werk Creator
// Galerie-artig, hochwertig, clean
import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth }  from "../lib/AuthContext";
import { HUI } from "../design/hui.design.js";

const T = {
  coral:HUI.COLOR.coral, coralGlow:"rgba(255,138,107,.3)", coralBg:"rgba(255,138,107,.09)",
  teal:HUI.COLOR.teal,  tealGlow:"rgba(22,215,197,.28)",  tealBg:"rgba(22,215,197,.09)",
  gold:HUI.COLOR.gold,  goldBg:"rgba(245,166,35,.09)",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2, ink3:HUI.COLOR.muted,
  muted:HUI.COLOR.muted, border:"rgba(0,0,0,.08)",
  warm:HUI.COLOR.cream, card:"#FFFFFF",
};

const CATEGORIES = [
  "Fotografie","Kunst","Design","Keramik","Schmuck","Illustration",
  "Digital Art","Handwerk","Mode","Musik","Video","Architektur","Sonstiges"
];

const CSS = `
  @keyframes wpUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes wpIn{from{opacity:0}to{opacity:1}}
  @keyframes wpSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes wpPop{0%{transform:scale(.75)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
  .wp-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .14s,opacity .14s}
  .wp-tap:active{transform:scale(.93)!important;opacity:.72}
  .wp-scroll::-webkit-scrollbar{display:none}
  .wp-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

function ProgDots({ step, total=4 }) {
  return (
    <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:24}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{
          height:3,borderRadius:2,
          width:i===step?28:8,
          background:i<=step?`linear-gradient(90deg,${T.coral},${T.gold})`:"rgba(0,0,0,.1)",
          transition:"all .4s cubic-bezier(.34,1.4,.64,1)"
        }}/>
      ))}
    </div>
  );
}

/* ── Step 1: Details ─────────────────────────────────────────────── */
function S1({ f, set, onNext }) {
  const ok = f.title.trim().length >= 2;
  return (
    <div style={{animation:"wpUp .4s both"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:40,marginBottom:10}}>🎨</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px"}}>Dein Werk</h2>
        <p style={{margin:0,fontSize:13,color:T.ink3,lineHeight:1.65}}>
          Was hast du erschaffen?
        </p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <input value={f.title} onChange={e=>set({...f,title:e.target.value})}
          placeholder="Titel deines Werks"
          style={{width:"100%",padding:"15px 16px",borderRadius:16,
            border:`2px solid ${f.title?T.coral:T.border}`,
            background:T.card,fontSize:16,color:T.ink,outline:"none",
            fontFamily:"inherit",fontWeight:600,
            boxShadow:f.title?`0 0 0 4px ${T.coralBg}`:"none",
            transition:"all .2s",boxSizing:"border-box"}}/>

        <textarea value={f.desc} onChange={e=>set({...f,desc:e.target.value})}
          placeholder="Erzähl die Geschichte dahinter — das Material, die Idee, der Moment…"
          rows={3}
          style={{width:"100%",padding:"15px 16px",borderRadius:16,
            border:`2px solid ${f.desc?T.coral:T.border}`,
            background:T.card,fontSize:14,color:T.ink,outline:"none",
            fontFamily:"inherit",resize:"none",lineHeight:1.6,
            transition:"all .2s",boxSizing:"border-box"}}/>

        {/* Kategorien */}
        <div>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,
            color:T.muted,letterSpacing:.5}}>KATEGORIE</p>
          <div className="wp-scroll"
            style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2}}>
            {(CATEGORIES||[]).filter(c=>c&&c.key).map(c=>(
              <button key={c} className="wp-tap"
                onClick={()=>set({...f,category:c})}
                style={{flexShrink:0,padding:"8px 14px",borderRadius:999,
                  border:`1.5px solid ${f.category===c?T.coral:"transparent"}`,
                  background:f.category===c?T.coralBg:"rgba(0,0,0,.04)",
                  color:f.category===c?T.coral:T.ink3,
                  fontWeight:f.category===c?700:500,fontSize:12,cursor:"pointer",
                  transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <input value={f.tags} onChange={e=>set({...f,tags:e.target.value})}
          placeholder="Tags: digital, abstract, 2024…"
          style={{width:"100%",padding:"13px 16px",borderRadius:14,
            border:`1.5px solid ${T.border}`,background:T.card,
            fontSize:13,color:T.ink,outline:"none",
            fontFamily:"inherit",boxSizing:"border-box"}}/>
      </div>

      <button className="wp-tap" onClick={onNext} disabled={!ok}
        style={{width:"100%",marginTop:22,padding:"17px",borderRadius:18,border:"none",
          background:ok?`linear-gradient(135deg,${T.coral},${T.gold})`:"rgba(0,0,0,.07)",
          color:ok?"white":T.muted,fontWeight:900,fontSize:15,
          cursor:ok?"pointer":"not-allowed",
          boxShadow:ok?`0 6px 24px ${T.coralGlow}`:"none",
          transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
        Weiter →
      </button>
    </div>
  );
}

/* ── Step 2: Medien ─────────────────────────────────────────────── */
function S2({ images, setImages, coverIdx, setCoverIdx, onNext, onBack }) {
  const ref = useRef(null);
  function addFiles(e) {
    const files = Array.from(e.target.files||[]);
    const newImgs = files.map(file=>({
      file, preview:URL.createObjectURL(file), id:Math.random()
    }));
    setImages(p=>[...p,...newImgs].slice(0,8));
  }
  return (
    <div style={{animation:"wpUp .35s both"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:10}}>📸</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px"}}>Bilder & Video</h2>
        <p style={{margin:0,fontSize:13,color:T.ink3}}>
          Zeig dein Werk von seiner besten Seite.
        </p>
      </div>

      <input ref={ref} type="file" accept="image/*,video/*"
        multiple style={{display:"none"}} onChange={addFiles}/>

      {/* Upload area */}
      {images.length===0 ? (
        <div className="wp-tap" onClick={()=>ref.current?.click()}
          style={{
            border:`2px dashed ${T.border}`,borderRadius:20,
            padding:"40px 20px",textAlign:"center",cursor:"pointer",
            background:"rgba(255,138,107,.03)",
            transition:"all .2s"
          }}>
          <div style={{fontSize:32,marginBottom:10}}>📁</div>
          <p style={{margin:"0 0 4px",fontWeight:700,color:T.ink}}>
            Bilder hochladen
          </p>
          <p style={{margin:0,fontSize:12,color:T.muted}}>
            bis zu 8 Bilder oder Videos
          </p>
        </div>
      ) : (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {images.map((img,i)=>(
              <div key={img.id} style={{position:"relative",aspectRatio:"1",
                borderRadius:14,overflow:"hidden",
                border:`2.5px solid ${i===coverIdx?T.coral:"transparent"}`,
                cursor:"pointer"}}
                onClick={()=>setCoverIdx(i)}>
                <img src={img.preview} alt=""
                  style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                {i===coverIdx && (
                  <div style={{position:"absolute",top:5,left:5,
                    background:T.coral,borderRadius:8,
                    padding:"2px 7px",fontSize:10,fontWeight:800,color:"white"}}>
                    Cover
                  </div>
                )}
                <button className="wp-tap"
                  onClick={e=>{e.stopPropagation();
                    setImages(p=>p.filter((_,idx)=>idx!==i));
                    if(coverIdx>=i&&coverIdx>0) setCoverIdx(p=>p-1);}}
                  style={{position:"absolute",top:5,right:5,width:22,height:22,
                    borderRadius:"50%",background:"rgba(0,0,0,.55)",
                    color:"white",border:"none",cursor:"pointer",
                    fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            ))}
            {images.length<8 && (
              <div className="wp-tap" onClick={()=>ref.current?.click()}
                style={{aspectRatio:"1",borderRadius:14,
                  border:`2px dashed ${T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",background:"rgba(0,0,0,.02)",fontSize:24,color:T.muted}}>+</div>
            )}
          </div>
          <p style={{margin:"10px 0 0",fontSize:11,color:T.muted,textAlign:"center"}}>
            Tippe auf ein Bild um es als Cover festzulegen
          </p>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onBack} className="wp-tap"
          style={{padding:"15px 18px",borderRadius:16,background:T.card,
            border:`1.5px solid ${T.border}`,color:T.muted,
            fontWeight:700,fontSize:14,cursor:"pointer"}}>‹</button>
        <button onClick={onNext} className="wp-tap"
          style={{flex:1,padding:"15px",borderRadius:16,border:"none",
            background:`linear-gradient(135deg,${T.coral},${T.gold})`,
            color:"white",fontWeight:900,fontSize:15,cursor:"pointer",
            boxShadow:`0 6px 24px ${T.coralGlow}`}}>
          Weiter →
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Verkauf ─────────────────────────────────────────────── */
const MODES = [
  {k:"show",    emoji:"👁",  label:"Nur präsentieren", sub:"Kein Verkauf, nur zeigen"},
  {k:"sell",    emoji:"💎",  label:"Verkäuflich",       sub:"Mit Preis & Kaufbutton"},
  {k:"limited", emoji:"🌟",  label:"Limitiert",         sub:"Exklusive Edition"},
  {k:"request", emoji:"💬",  label:"Auf Anfrage",       sub:"Direkt anfragen"},
];

function S3({ f, set, onNext, onBack }) {
  return (
    <div style={{animation:"wpUp .35s both"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:10}}>💎</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px"}}>Sichtbarkeit & Verkauf</h2>
        <p style={{margin:0,fontSize:13,color:T.ink3}}>Wie soll dein Werk erlebbar sein?</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {MODES.map((m,i)=>{
          const on=f.mode===m.k;
          return (
            <div key={m.k} className="wp-tap"
              onClick={()=>set({...f,mode:m.k})}
              style={{display:"flex",alignItems:"center",gap:14,
                padding:"15px 16px",borderRadius:16,cursor:"pointer",
                background:on?T.coralBg:T.card,
                border:`2px solid ${on?T.coral+"55":T.border}`,
                transition:"all .2s",animation:`wpUp ${.3+i*.05}s both`}}>
              <span style={{fontSize:22,width:30,textAlign:"center"}}>{m.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:on?T.coral:T.ink}}>{m.label}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:1}}>{m.sub}</div>
              </div>
              <div style={{width:22,height:22,borderRadius:11,
                border:`2px solid ${on?T.coral:T.border}`,
                background:on?T.coral:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */,flexShrink:0}}>
                {on && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preis */}
      {(f.mode==="sell"||f.mode==="limited") && (
        <div style={{marginTop:14,animation:"wpUp .25s both"}}>
          <label style={{fontSize:11,fontWeight:700,color:T.muted,
            letterSpacing:.5,display:"block",marginBottom:8}}>PREIS (€)</label>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",
              fontSize:16,fontWeight:700,color:T.ink3}}>€</span>
            <input type="number" value={f.price} onChange={e=>set({...f,price:e.target.value})}
              placeholder="0"
              style={{width:"100%",padding:"15px 16px 15px 34px",borderRadius:16,
                border:`2px solid ${f.price?T.coral:T.border}`,
                background:T.card,fontSize:18,fontWeight:700,color:T.ink,
                outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onBack} className="wp-tap"
          style={{padding:"15px 18px",borderRadius:16,background:T.card,
            border:`1.5px solid ${T.border}`,color:T.muted,
            fontWeight:700,fontSize:14,cursor:"pointer"}}>‹</button>
        <button onClick={onNext} className="wp-tap"
          style={{flex:1,padding:"15px",borderRadius:16,border:"none",
            background:`linear-gradient(135deg,${T.coral},${T.gold})`,
            color:"white",fontWeight:900,fontSize:15,cursor:"pointer",
            boxShadow:`0 6px 24px ${T.coralGlow}`}}>Weiter →</button>
      </div>
    </div>
  );
}

/* ── Step 4: Veröffentlichen ─────────────────────────────────────── */
function S4({ f, set, onPublish, onBack, saving, error }) {
  return (
    <div style={{animation:"wpUp .35s both"}}>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:40,marginBottom:10}}>🚀</div>
        <h2 style={{margin:"0 0 8px",fontSize:24,fontWeight:900,
          color:T.ink,letterSpacing:"-0.5px"}}>Bereit zum Teilen?</h2>
        <p style={{margin:0,fontSize:13,color:T.ink3}}>Fast geschafft.</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[
          {k:"publish",l:"Sofort veröffentlichen",
           sub:"Erscheint direkt im Feed & Profil",emoji:"✦"},
          {k:"draft",  l:"Als Entwurf speichern",
           sub:"Nur für dich sichtbar",          emoji:"📝"},
        ].map(opt=>{
          const on=f.publish===opt.k;
          return (
            <div key={opt.k} className="wp-tap"
              onClick={()=>set({...f,publish:opt.k})}
              style={{display:"flex",alignItems:"center",gap:14,
                padding:"18px 16px",borderRadius:18,cursor:"pointer",
                background:on?T.coralBg:T.card,
                border:`2px solid ${on?T.coral+"55":T.border}`,
                transition:"all .2s"}}>
              <span style={{fontSize:22}}>{opt.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:on?T.coral:T.ink}}>{opt.l}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>{opt.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission toggles */}
      <div style={{marginTop:16,padding:"14px 16px",borderRadius:16,
        background:T.warm,border:`1px solid ${T.border}`}}>
        {[
          {label:"Kommentare",k:"allowComments"},
          {label:"Likes",     k:"allowLikes"},
          {label:"Teilen",    k:"allowShare"},
        ].map(row=>(
          <div key={row.k} className="wp-tap"
            onClick={()=>set({...f,[row.k]:!f[row.k]})}
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:14,color:T.ink2}}>{row.label}</span>
            <div style={{width:42,height:24,borderRadius:12,cursor:"pointer",
              background:f[row.k]?T.coral:"rgba(0,0,0,.12)",
              position:"relative",transition:"background .2s"}}>
              <div style={{position:"absolute",top:2,
                left:f[row.k]?18:2,width:20,height:20,
                borderRadius:"50%",background:"white",
                transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{marginTop:12,padding:"11px 14px",borderRadius:12,
          background:"rgba(255,80,80,.07)",border:"1px solid rgba(255,80,80,.18)",
          fontSize:13,color:"#E53E3E"}}>⚠️ {error}</div>
      )}

      <div style={{display:"flex",gap:10,marginTop:18}}>
        <button onClick={onBack} className="wp-tap"
          style={{padding:"15px 18px",borderRadius:16,background:T.card,
            border:`1.5px solid ${T.border}`,color:T.muted,
            fontWeight:700,fontSize:14,cursor:"pointer"}}>‹</button>
        <button onClick={onPublish} disabled={saving} className="wp-tap"
          style={{flex:1,padding:"15px",borderRadius:16,border:"none",
            background:`linear-gradient(135deg,${T.coral},${T.gold})`,
            color:"white",fontWeight:900,fontSize:15,cursor:"pointer",
            opacity:saving?.7:1,
            boxShadow:`0 6px 24px ${T.coralGlow}`,
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {saving?(
            <><div style={{width:17,height:17,borderRadius:"50%",
              border:"2.5px solid rgba(255,255,255,.3)",
              borderTop:"2.5px solid white",
              animation:"wpSpin .8s linear infinite"}}/>Speichere…</>
          ): f.publish==="publish"?"🎨 Werk veröffentlichen":"📝 Entwurf speichern"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════ */
export default function WerkPublisher({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title:"", desc:"", category:"", tags:"",
    mode:"show", price:"", publish:"publish",
    allowComments:true, allowLikes:true, allowShare:true
  });
  const [images,   setImages]   = useState([]);
  const [coverIdx, setCoverIdx] = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [done,     setDone]     = useState(false);

  async function publish() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      let coverUrl = null;
      const imageUrls = [];
      for (let i=0; i<images.length; i++) {
        const img = images[i];
        const ext  = img.file.name.split(".").pop();
        const path = `works/${user.id}/${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media").upload(path, img.file, { contentType: img.file.type });
        if (upErr) { console.error("[WerkPublisher] ❌ storage error:", upErr.message, upErr.statusCode); throw upErr; }
        const { data:{ publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
        imageUrls.push(publicUrl);
        if (i===coverIdx) coverUrl = publicUrl;
      }

      const { error: dbErr } = await supabase.from("works").insert({
        user_id:        user.id,
        title:          form.title.trim(),
        description:    form.desc.trim(),
        category:       form.category,
        tags:           form.tags.split(",").map(t=>t.trim()).filter(Boolean),
        cover_url:      coverUrl,
        images:         imageUrls,
        for_sale:       form.mode !== "show_only",
        sale_mode:      form.mode,   // behalten für ältere DB-Schemas
        price:          form.price ? parseFloat(form.price) : null,
        // allow_comments/likes/share gehören zur stories-Tabelle, nicht zu works
        status:         form.publish==="publish"?"published":"draft",
        created_at:     new Date().toISOString(),
      });
      if (dbErr) { console.error("[WerkPublisher] db error:", dbErr); throw dbErr; }
      setDone(true);
      setTimeout(()=>{ if(onSuccess) onSuccess(); onClose(); }, 2000);
    } catch(e) {
      setError(e.message||"Fehler beim Speichern");
    } finally { setSaving(false); }
  }

  if (done) return (
    <div style={{position:"fixed",inset:0,zIndex:600,
      background:`linear-gradient(135deg,${T.coral},${T.gold})`,
      display:"flex",alignItems:"center",justifyContent:"center",
      animation:"wpIn .3s both"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",color:"white",padding:"20px"}}>
        <div style={{fontSize:64,marginBottom:16,animation:"wpPop .5s both"}}>🎨</div>
        <h2 style={{margin:"0 0 8px",fontSize:28,fontWeight:900}}>
          {form.publish==="publish"?"Werk ist live!":"Entwurf gespeichert"}
        </h2>
        <p style={{margin:0,opacity:.85,fontSize:15}}>
          {form.publish==="publish"
            ? "Dein Werk erscheint jetzt in deinem Profil und im Feed."
            : "Du kannst es jederzeit veröffentlichen."}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,
      background:"rgba(8,8,8,.55)",backdropFilter:"blur(10px)",
      WebkitBackdropFilter:"blur(10px)",
      display:"flex",alignItems:"flex-end",animation:"wpIn .2s both"}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:520,margin:"0 auto",
        background:T.warm,borderRadius:"28px 28px 0 0",
        padding:"20px 20px 0",
        paddingBottom:"max(28px,calc(env(safe-area-inset-bottom,0px)+20px))",
        maxHeight:"94vh",overflowY:"auto"}}
        className="wp-scroll">

        <div style={{width:36,height:4,borderRadius:2,background:"rgba(0,0,0,.1)",
          margin:"0 auto 16px"}}/>

        <div style={{display:"flex",justifyContent:"space-between",
          alignItems:"center",marginBottom:4}}>
          <ProgDots step={step}/>
          <button onClick={onClose} className="wp-tap"
            style={{marginLeft:"auto",width:30,height:30,borderRadius:"50%",
              background:"rgba(0,0,0,.06)",border:"none",cursor:"pointer",
              fontSize:14,color:T.muted,display:"flex",alignItems:"center",
              justifyContent:"center",flexShrink:0}}>✕</button>
        </div>

        {step===0 && <S1 f={form} set={setForm} onNext={()=>setStep(1)}/>}
        {step===1 && <S2 images={images} setImages={setImages}
          coverIdx={coverIdx} setCoverIdx={setCoverIdx}
          onNext={()=>setStep(2)} onBack={()=>setStep(0)}/>}
        {step===2 && <S3 f={form} set={setForm}
          onNext={()=>setStep(3)} onBack={()=>setStep(1)}/>}
        {step===3 && <S4 f={form} set={setForm}
          onPublish={publish} onBack={()=>setStep(2)}
          saving={saving} error={error}/>}
        <div style={{height:8}}/>
      </div>
    </div>
  );
}
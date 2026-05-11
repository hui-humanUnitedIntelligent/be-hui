// StoryComposer.jsx — Fullscreen Story Creator
// Spontan, emotional, schnell. Kein Formular-Feeling.
import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth }  from "../lib/AuthContext";

const T = {
  teal:"#16D7C5", tealGlow:"rgba(22,215,197,.32)", tealBg:"rgba(22,215,197,.1)",
  coral:"#FF8A6B", coralBg:"rgba(255,138,107,.1)",
  gold:"#F5A623",  purple:"#A78BFA",  green:"#22C55E",
  pink:"#F472B6",  blue:"#38BDF8",
  ink:"#1A1A1A", ink3:"#6A6A6A", muted:"#9A9A9A",
  border:"rgba(0,0,0,.08)", warm:"#F9F7F4", card:"#FFFFFF",
};

const GRADIENTS = [
  { id:"g1", css:"linear-gradient(135deg,#16D7C5,#0891b2)", label:"Ozean" },
  { id:"g2", css:"linear-gradient(135deg,#FF8A6B,#F5A623)", label:"Feuer" },
  { id:"g3", css:"linear-gradient(135deg,#A78BFA,#F472B6)", label:"Magie" },
  { id:"g4", css:"linear-gradient(135deg,#22C55E,#16D7C5)", label:"Natur" },
  { id:"g5", css:"linear-gradient(135deg,#1A1A2E,#16213E)",  label:"Nacht" },
  { id:"g6", css:"linear-gradient(135deg,#F9F7F4,#E8E4DF)",  label:"Licht" },
];

const MOODS = [
  { key:"inspired",  emoji:"✨", label:"Inspiriert" },
  { key:"creative",  emoji:"🎨", label:"Kreativ" },
  { key:"onthego",   emoji:"🚀", label:"Unterwegs" },
  { key:"makingof",  emoji:"🛠️", label:"Making of" },
  { key:"today",     emoji:"🌅", label:"Heute" },
  { key:"live",      emoji:"⚡️", label:"Live" },
];

const CSS = `
  @keyframes scFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scIn{from{opacity:0}to{opacity:1}}
  @keyframes scSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes scPop{0%{transform:scale(.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
  .sc-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .14s,opacity .14s}
  .sc-tap:active{transform:scale(.92)!important;opacity:.7}
  .sc-scroll::-webkit-scrollbar{display:none}
  .sc-scroll{-ms-overflow-style:none;scrollbar-width:none}
  @keyframes scPulse{0%,100%{opacity:1}50%{opacity:.5}}
`;

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 22V10M16 10L11 15M16 10L21 15" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 26h20" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

export default function StoryComposer({ onClose, onSuccess }) {
  const { user } = useAuth();
  const fileRef  = useRef(null);

  const [mediaFile,    setMediaFile]    = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType,    setMediaType]    = useState(null); // "image"|"video"
  const [text,         setText]         = useState("");
  const [mood,         setMood]         = useState(null);
  const [gradient,     setGradient]     = useState(GRADIENTS[0]);
  const [visibility,   setVisibility]   = useState("public");
  const [allowComments,setAllowComments]= useState(true);
  const [saveHighlight,setSaveHighlight]= useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState(null);
  const [done,         setDone]         = useState(false);
  const [panel,        setPanel]        = useState("main"); // main|settings

  function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  }

  async function publish() {
    if (!user) return;
    setUploading(true); setError(null);
    try {
      let mediaUrl = null;

      if (mediaFile) {
        const ext  = mediaFile.name.split(".").pop();
        const path = `stories/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("stories")
          .upload(path, mediaFile, { contentType: mediaFile.type, upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(path);
        mediaUrl = publicUrl;
      }

      const { error: dbErr } = await supabase.from("stories").insert({
        user_id:        user.id,
        media_url:      mediaUrl,
        media_type:     mediaType || "text",
        text_overlay:   text.trim() || null,
        mood:           mood,
        background:     mediaFile ? null : gradient.css,
        visibility:     visibility,
        allow_comments: allowComments,
        is_highlight:   saveHighlight,
        expires_at:     saveHighlight ? null : new Date(Date.now() + 86400000).toISOString(),
        status:         "published",
        created_at:     new Date().toISOString(),
      });
      if (dbErr) throw dbErr;

      setDone(true);
      setTimeout(() => { if(onSuccess) onSuccess(); onClose(); }, 1800);
    } catch(e) {
      setError(e.message || "Upload fehlgeschlagen");
      console.error("[StoryComposer] upload error:", e);
    } finally {
      setUploading(false);
    }
  }

  const canPublish = !!(mediaFile || text.trim());

  if (done) return (
    <div style={{
      position:"fixed",inset:0,zIndex:600,
      background:"linear-gradient(135deg,#16D7C5,#FF8A6B)",
      display:"flex",alignItems:"center",justifyContent:"center",
      animation:"scIn .3s both"
    }}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",color:"white"}}>
        <div style={{fontSize:64,marginBottom:16,animation:"scPop .5s both"}}>⚡️</div>
        <h2 style={{margin:"0 0 8px",fontSize:28,fontWeight:900,letterSpacing:"-0.5px"}}>
          Story ist live!
        </h2>
        <p style={{margin:0,opacity:.8,fontSize:15}}>
          {saveHighlight ? "Als Highlight gespeichert ✦" : "Verschwindet in 24h"}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:600,
      background:T.ink,
      display:"flex",flexDirection:"column",
      animation:"scIn .2s both",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif"
    }}>
      <style>{CSS}</style>
      <input ref={fileRef} type="file" accept="image/*,video/*"
        style={{display:"none"}} onChange={pickFile}/>

      {/* ── Canvas ── */}
      <div style={{
        flex:1, position:"relative", overflow:"hidden",
        background: mediaPreview ? "#000" : gradient.css,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer"
      }} onClick={() => !mediaPreview && fileRef.current?.click()}>

        {/* Media preview */}
        {mediaPreview && mediaType==="image" && (
          <img src={mediaPreview} alt=""
            style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>
        )}
        {mediaPreview && mediaType==="video" && (
          <video src={mediaPreview} autoPlay muted loop playsInline
            style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>
        )}

        {/* No media prompt */}
        {!mediaPreview && (
          <div style={{textAlign:"center",color:"rgba(255,255,255,.7)",
            animation:"scFadeUp .4s both"}}>
            <UploadIcon/>
            <p style={{margin:"12px 0 0",fontSize:15,fontWeight:600}}>
              Foto oder Video
            </p>
            <p style={{margin:"4px 0 0",fontSize:12,opacity:.6}}>
              oder schreib einfach etwas…
            </p>
          </div>
        )}

        {/* Text overlay input */}
        {(mediaPreview || text) && (
          <div style={{
            position:"absolute",inset:0,
            display:"flex",alignItems:"center",justifyContent:"center",
            pointerEvents:"none"
          }}>
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              placeholder="Schreib etwas…"
              maxLength={150}
              style={{
                background:"transparent",border:"none",outline:"none",
                color:"white",fontSize:24,fontWeight:800,textAlign:"center",
                textShadow:"0 2px 12px rgba(0,0,0,.5)",
                resize:"none",width:"80%",pointerEvents:"all",
                fontFamily:"inherit",lineHeight:1.3,
              }}
            />
          </div>
        )}

        {/* Text-only composer */}
        {!mediaPreview && (
          <textarea
            value={text}
            onChange={e=>setText(e.target.value)}
            placeholder="Was bewegst du gerade?"
            maxLength={150}
            style={{
              position:"absolute",inset:0,padding:"80px 32px 32px",
              background:"transparent",border:"none",outline:"none",
              color:"white",fontSize:22,fontWeight:700,textAlign:"center",
              resize:"none",fontFamily:"inherit",lineHeight:1.4,
            }}
          />
        )}

        {/* Top bar */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,
          padding:"max(16px,env(safe-area-inset-top,16px)) 16px 12px",
          display:"flex",alignItems:"center",gap:10,
          background:"linear-gradient(rgba(0,0,0,.35),transparent)"
        }}>
          <button className="sc-tap" onClick={onClose}
            style={{width:36,height:36,borderRadius:"50%",border:"none",
              background:"rgba(0,0,0,.4)",color:"white",
              fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",
              justifyContent:"center",backdropFilter:"blur(8px)",flexShrink:0}}>✕</button>
          <div style={{flex:1}}/>
          {mediaPreview && (
            <button className="sc-tap" onClick={()=>{ setMediaFile(null);setMediaPreview(null);setMediaType(null); }}
              style={{padding:"6px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,.4)",
                background:"rgba(0,0,0,.4)",color:"white",fontSize:12,fontWeight:600,
                cursor:"pointer",backdropFilter:"blur(8px)"}}>
              Entfernen
            </button>
          )}
          <button className="sc-tap" onClick={()=>setPanel(p=>p==="settings"?"main":"settings")}
            style={{width:36,height:36,borderRadius:"50%",border:"none",
              background:"rgba(0,0,0,.4)",color:"white",fontSize:16,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              backdropFilter:"blur(8px)"}}>⚙️</button>
        </div>

        {/* Mood chips */}
        <div className="sc-scroll" style={{
          position:"absolute",bottom:0,left:0,right:0,
          padding:"12px 16px 16px",
          display:"flex",gap:8,overflowX:"auto",
          background:"linear-gradient(transparent,rgba(0,0,0,.4))"
        }}>
          {MOODS.map(m => (
            <button key={m.key} className="sc-tap"
              onClick={e=>{e.stopPropagation();setMood(p=>p===m.key?null:m.key);}}
              style={{
                flexShrink:0,padding:"6px 12px",borderRadius:999,
                border:`1.5px solid ${mood===m.key?"white":"rgba(255,255,255,.35)"}`,
                background:mood===m.key?"rgba(255,255,255,.25)":"rgba(0,0,0,.3)",
                color:"white",fontSize:12,fontWeight:700,cursor:"pointer",
                backdropFilter:"blur(8px)",display:"flex",alignItems:"center",gap:5,
                transition:"all .18s"
              }}>
              <span>{m.emoji}</span><span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom Panel ── */}
      <div style={{
        background:T.ink,
        padding:"16px 16px",
        paddingBottom:"max(20px,env(safe-area-inset-bottom,20px))"
      }}>

        {panel==="settings" ? (
          <div style={{animation:"scFadeUp .25s both"}}>
            <p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,
              color:T.muted,letterSpacing:.6}}>EINSTELLUNGEN</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {/* Visibility */}
              <div style={{display:"flex",gap:8}}>
                {[
                  {v:"public",l:"Öffentlich"},
                  {v:"followers",l:"Follower"},
                  {v:"friends",l:"Freunde"}
                ].map(opt=>(
                  <button key={opt.v} className="sc-tap"
                    onClick={()=>setVisibility(opt.v)}
                    style={{flex:1,padding:"10px 6px",borderRadius:12,border:"none",
                      background:visibility===opt.v
                        ? `linear-gradient(135deg,${T.teal},${T.coral})`
                        :"rgba(255,255,255,.08)",
                      color:"white",fontSize:12,fontWeight:700,cursor:"pointer",
                      transition:"all .18s"}}>
                    {opt.l}
                  </button>
                ))}
              </div>
              {/* Toggles */}
              {[
                {label:"Kommentare", val:allowComments, set:setAllowComments},
                {label:"Als Highlight speichern", val:saveHighlight, set:setSaveHighlight},
              ].map(row=>(
                <div key={row.label}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
                  <span style={{color:"rgba(255,255,255,.8)",fontSize:14}}>{row.label}</span>
                  <div className="sc-tap" onClick={()=>row.set(p=>!p)}
                    style={{width:44,height:26,borderRadius:13,cursor:"pointer",
                      background:row.val?T.teal:"rgba(255,255,255,.15)",
                      position:"relative",transition:"background .2s"}}>
                    <div style={{position:"absolute",top:3,
                      left:row.val?20:3,width:20,height:20,
                      borderRadius:"50%",background:"white",
                      transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Gradient picker (nur ohne Bild) */}
            {!mediaPreview && (
              <div className="sc-scroll"
                style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
                {GRADIENTS.map(g => (
                  <div key={g.id} className="sc-tap"
                    onClick={()=>setGradient(g)}
                    style={{
                      flexShrink:0,width:40,height:40,borderRadius:12,
                      background:g.css,cursor:"pointer",
                      border:`2.5px solid ${gradient.id===g.id?"white":"transparent"}`,
                      boxShadow:gradient.id===g.id?"0 0 0 1px rgba(255,255,255,.3)":"none",
                      transition:"all .18s"
                    }}/>
                ))}
                <button className="sc-tap" onClick={()=>fileRef.current?.click()}
                  style={{flexShrink:0,width:40,height:40,borderRadius:12,
                    border:"1.5px dashed rgba(255,255,255,.3)",
                    background:"transparent",color:"rgba(255,255,255,.6)",
                    fontSize:20,cursor:"pointer",display:"flex",
                    alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{padding:"10px 14px",borderRadius:12,
                background:"rgba(255,80,80,.15)",border:"1px solid rgba(255,80,80,.3)",
                fontSize:13,color:"#FF6B6B"}}>⚠️ {error}</div>
            )}

            {/* Publish */}
            <button className="sc-tap" onClick={publish}
              disabled={uploading || !canPublish}
              style={{
                width:"100%",padding:"17px",borderRadius:18,border:"none",
                background:canPublish
                  ?`linear-gradient(135deg,${T.teal},${T.coral})`
                  :"rgba(255,255,255,.1)",
                color: canPublish?"white":"rgba(255,255,255,.35)",
                fontWeight:900,fontSize:15,cursor:canPublish?"pointer":"not-allowed",
                boxShadow:canPublish?`0 6px 24px ${T.tealGlow}`:"none",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                transition:"all .2s"
              }}>
              {uploading ? (
                <>
                  <div style={{width:18,height:18,borderRadius:"50%",
                    border:"2.5px solid rgba(255,255,255,.3)",
                    borderTop:"2.5px solid white",
                    animation:"scSpin .8s linear infinite"}}/>
                  Wird gepostet…
                </>
              ) : "⚡️ Story posten"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

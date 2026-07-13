// StoryComposer v2 — Production-ready with proper Supabase upload
// Fixes: RLS, storage persistence, error handling, mobile Safari
import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth }  from "../lib/AuthContext";
import { HUI } from "../design/hui.design.js";

const T = {
  teal:HUI.COLOR.teal, tealGlow:"rgba(22,215,197,.32)", tealBg:"rgba(22,215,197,.1)",
  coral:HUI.COLOR.coral,
  gold:HUI.COLOR.gold,  purple:HUI.COLOR.violetLight, green:"#22C55E",
  ink:HUI.COLOR.ink, ink3:HUI.COLOR.muted, muted:HUI.COLOR.muted,
  border:"rgba(0,0,0,.08)", warm:HUI.COLOR.cream,
};

const GRADIENTS = [
  {id:"g1",css:"linear-gradient(135deg,#16D7C5,#0891b2)"},
  {id:"g2",css:"linear-gradient(135deg,#FF8A6B,#F5A623)"},
  {id:"g3",css:"linear-gradient(135deg,#A78BFA,#F472B6)"},
  {id:"g4",css:"linear-gradient(135deg,#22C55E,#16D7C5)"},
  {id:"g5",css:"linear-gradient(135deg,#1A1A2E,#16213E)"},
  {id:"g6",css:"linear-gradient(135deg,#F9F7F4,#E8E4DF)"},
];

const MOODS = [
  {k:"inspired", e:"✨",l:"Inspiriert"},
  {k:"creative", e:"🎨",l:"Kreativ"},
  {k:"onthego",  e:"🚀",l:"Unterwegs"},
  {k:"makingof", e:"🛠️",l:"Making of"},
  {k:"today",    e:"🌅",l:"Heute"},
  {k:"live",     e:"⚡️",l:"Live"},
];

// Friendly error messages
function friendlyError(err) {
  const raw = err?.message || err?.error_description || JSON.stringify(err) || String(err) || "Unbekannter Fehler";
  const code = err?.code || err?.statusCode || "";
  return `${raw}${code ? " ["+code+"]" : ""}`;
}

const CSS = `
  @keyframes scIn{from{opacity:0}to{opacity:1}}
  @keyframes scUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes scPop{0%{transform:scale(.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
  @keyframes scFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  .sc-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .14s,opacity .14s}
  .sc-tap:active{transform:scale(.92)!important;opacity:.7}
  .sc-scroll::-webkit-scrollbar{display:none}
  .sc-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

export default function StoryComposer({ onClose, onSuccess }) {
  const { user, profile, canCreate, isBaseUser } = useAuth();

  // Phase 4C: Permission Guard — BasisUser kann keine Stories erstellen
  React.useEffect(() => {
    if (!canCreate && !isBaseUser === false) return; // profile noch laden
    if (isBaseUser && typeof window.__HUI_OPEN_TALENT_FLOW === "function") {
      console.log("[STORY_COMPOSER] BasisUser blocked → opening TalentFlow");
      window.__HUI_OPEN_TALENT_FLOW();
      onClose?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreate, isBaseUser]);
  const fileRef  = useRef(null);

  const [mediaFile,     setMediaFile]     = useState(null);
  const [mediaPreview,  setMediaPreview]  = useState(null);
  const [mediaType,     setMediaType]     = useState(null);
  const [text,          setText]          = useState("");
  const [mood,          setMood]          = useState(null);
  const [gradient,      setGradient]      = useState(GRADIENTS[0]);
  const [visibility,    setVisibility]    = useState("public");
  const [allowComments, setAllowComments] = useState(true);
  const [saveHighlight, setSaveHighlight] = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [error,         setError]         = useState(null);
  const [done,          setDone]          = useState(false);
  const [panel,         setPanel]         = useState("main");

  function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Mobile Safari: ensure we have a proper blob
    const type = file.type || (file.name?.match(/\.(mp4|mov|m4v)$/i) ? "video/mp4" : "image/jpeg");
    const blob = file.slice(0, file.size, type);
    const namedFile = new File([blob], file.name || `story_${Date.now()}`, { type });
    setMediaFile(namedFile);
    setMediaType(type.startsWith("video") ? "video" : "image");
    const url = URL.createObjectURL(namedFile);
    setMediaPreview(url);
  }

  async function uploadMedia(file) {
    // Pfad MUSS mit user.id beginnen — so verlangt es die Storage RLS Policy
    const ext    = file.name.split(".").pop() || (file.type.includes("video") ? "mp4" : "jpg");
    const path   = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const bucket = "stories";

    const { data: uploadData, error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType:  file.type,
        cacheControl: "3600",
        upsert:       false,
      });

    if (upErr) {
      console.error("[StoryComposer] storage error:", upErr.message, upErr);
      throw new Error(`Storage: ${upErr.message}`);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;
    return publicUrl;
  }

  async function publish() {
    if (!user) { setError("Nicht angemeldet. Bitte neu anmelden."); return; }
    if (!supabase) { setError("Supabase nicht verbunden. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY prüfen."); return; }
    setUploading(true); setError(null); setUploadPct(0);

    try {
      let mediaUrl  = null;

      // Step 1: Upload media
      if (mediaFile) {
        setUploadPct(20);
        mediaUrl = await uploadMedia(mediaFile);
        setUploadPct(70);
      }

      // Step 2: Insert story
      const expiresAt = saveHighlight ? null : new Date(Date.now() + 86400000).toISOString();

      // Map Composer fields → DB column names
      // Nur Spalten die im originalen CREATE TABLE existieren (009_story_system_fix.sql)
      // FIX: stories-Tabelle Schema:
      //   user_id, media_url, media_type, caption, text_overlay,
      //   mood, location, is_highlight, expires_at, created_at
      // Felder status/visibility/username/avatar_url/allow_comments
      // existieren NICHT → silent 400-Fehler verhindert Insert.
      const storyRow = {
        user_id:      user.id,
        media_url:    mediaUrl            || null,
        media_type:   mediaUrl ? mediaType : "text",
        caption:      text.trim()         || null,
        text_overlay: text.trim()         || null,
        is_highlight: saveHighlight       || false,
        expires_at:   expiresAt,
        // status/visibility/username: NICHT in stories — entfernt
      };
      console.info('[StoryComposer] Publishing story:', {
        user_id: storyRow.user_id,
        media_type: storyRow.media_type,
        has_media: !!storyRow.media_url,
        is_highlight: storyRow.is_highlight,
        expires_at: storyRow.expires_at,
      });

      const { data, error: dbErr } = await supabase
        .from("stories")
        .insert(storyRow)
        .select()
        .single();

      if (dbErr) {
        console.error('[StoryComposer] DB INSERT FEHLER:', {
          code: dbErr.code,
          message: dbErr.message,
          details: dbErr.details,
          hint: dbErr.hint,
          storyRow,
        });
        throw dbErr;
      }
      console.info('[StoryComposer] Story gespeichert:', { id: data?.id });

      setUploadPct(100);
      setDone(true);
      setTimeout(() => { if (onSuccess) onSuccess(); onClose(); }, 1800);

    } catch(e) {
      console.error("[StoryComposer] publish error:", e);
      setError(friendlyError(e));
    } finally {
      setUploading(false);
    }
  }

  const canPublish = !!(mediaFile || text.trim());

  // Success screen
  if (done) return (
    <div style={{position:"fixed",inset:0,zIndex:10500,
      background:"linear-gradient(135deg,#16D7C5,#FF8A6B)",
      display:"flex",alignItems:"center",justifyContent:"center",
      animation:"scIn .3s both"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",color:"white",padding:"24px"}}>
        <div style={{fontSize:64,marginBottom:16,animation:"scPop .5s both"}}>⚡️</div>
        <h2 style={{margin:"0 0 8px",fontSize:28,fontWeight:900,letterSpacing:"-.5px"}}>
          Story ist live!
        </h2>
        <p style={{margin:0,opacity:.85,fontSize:15}}>
          {saveHighlight ? "Als Highlight gespeichert ✦" : "Verschwindet in 24 Stunden"}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:10500,background:T.ink,
      display:"flex",flexDirection:"column",animation:"scIn .2s both",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif"}}>
      <style>{CSS}</style>
      <input ref={fileRef} type="file" accept="image/*,video/*"
        style={{display:"none"}} onChange={pickFile}
        capture={undefined}/>

      {/* ── Canvas ── */}
      <div style={{flex:1,position:"relative",overflow:"hidden",
        background:mediaPreview?"#000":gradient.css,
        display:"flex",alignItems:"center",justifyContent:"center",
        cursor:mediaPreview?"default":"pointer"}}
        onClick={()=>!mediaPreview && fileRef.current?.click()}>

        {mediaPreview && mediaType==="image" && (
          <img loading="lazy" decoding="async" src={mediaPreview} alt=""
            style={{width:"100%",height:"100%",objectFit:"cover",
              position:"absolute",inset:0}}/>
        )}
        {mediaPreview && mediaType==="video" && (
          <video src={mediaPreview} autoPlay muted loop playsInline
            style={{width:"100%",height:"100%",objectFit:"cover",
              position:"absolute",inset:0}}/>
        )}

        {/* No media prompt */}
        {!mediaPreview && !text && (
          <div style={{textAlign:"center",color:"rgba(255,255,255,.75)",
            animation:"scUp .4s both",pointerEvents:"none"}}>
            <div style={{fontSize:40,marginBottom:10,animation:"scFloat 3s ease-in-out infinite"}}>
              📸
            </div>
            <p style={{margin:"0 0 4px",fontSize:15,fontWeight:600}}>
              Foto oder Video hinzufügen
            </p>
            <p style={{margin:0,fontSize:12,opacity:.65}}>
              oder einfach tippen…
            </p>
          </div>
        )}

        {/* Text overlay textarea */}
        <textarea value={text} onChange={e=>setText(e.target.value)}
          placeholder={mediaPreview ? "Text hinzufügen…" : "Was bewegst du gerade?"}
          maxLength={150}
          onClick={e=>e.stopPropagation()}
          style={{
            position:"absolute",
            top:mediaPreview?"auto":"80px",
            bottom:mediaPreview?"80px":"auto",
            left:0,right:0,
            padding:mediaPreview?"16px 32px":"16px 32px 0",
            background:"transparent",border:"none",outline:"none",
            color:"white",fontSize:mediaPreview?22:20,fontWeight:800,
            textAlign:"center",
            textShadow:mediaPreview?"0 2px 12px rgba(0,0,0,.5)":"none",
            resize:"none",fontFamily:"inherit",lineHeight:1.35,
            caretColor:"white",zIndex:2,
          }}/>

        {/* Top bar */}
        <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,
          padding:"max(16px,env(safe-area-inset-top,16px)) 16px 14px",
          display:"flex",alignItems:"center",gap:10,
          background:"linear-gradient(rgba(0,0,0,.4),transparent)"}}>
          <button className="sc-tap" onClick={onClose}
            style={{width:36,height:36,borderRadius:"50%",border:"none",
              background:"rgba(0,0,0,.4)",color:"white",fontSize:18,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              backdropFilter:"blur(8px)",flexShrink:0}}>✕</button>
          <div style={{flex:1}}/>
          {mediaPreview && (
            <button className="sc-tap"
              onClick={()=>{setMediaFile(null);setMediaPreview(null);setMediaType(null);}}
              style={{padding:"6px 14px",borderRadius:20,cursor:"pointer",
                border:"1px solid rgba(255,255,255,.4)",
                background:"rgba(0,0,0,.4)",color:"white",
                fontSize:12,fontWeight:600,backdropFilter:"blur(8px)"}}>
              Entfernen
            </button>
          )}
          <button className="sc-tap"
            onClick={()=>setPanel(p=>p==="settings"?"main":"settings")}
            style={{width:36,height:36,borderRadius:"50%",border:"none",
              background:panel==="settings"?"rgba(22,215,197,.5)":"rgba(0,0,0,.4)",
              color:"white",fontSize:16,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              backdropFilter:"blur(8px)"}}>⚙️</button>
        </div>

        {/* Mood chips */}
        <div className="sc-scroll" style={{
          position:"absolute",bottom:0,left:0,right:0,zIndex:3,
          padding:"12px 16px 14px",
          display:"flex",gap:8,overflowX:"auto",
          background:"linear-gradient(transparent,rgba(0,0,0,.5))"}}>
          {(MOODS||[]).filter(m=>m&&m.key).map(m=>(
            <button key={m.k} className="sc-tap"
              onClick={e=>{e.stopPropagation();setMood(p=>p===m.k?null:m.k);}}
              style={{flexShrink:0,padding:"6px 12px",borderRadius:999,
                border:`1.5px solid ${mood===m.k?"white":"rgba(255,255,255,.3)"}`,
                background:mood===m.k?"rgba(255,255,255,.25)":"rgba(0,0,0,.3)",
                color:"white",fontSize:12,fontWeight:700,cursor:"pointer",
                backdropFilter:"blur(8px)",display:"flex",alignItems:"center",
                gap:5,transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
              <span>{m.e}</span><span>{m.l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom Panel ── */}
      <div style={{background:"#111",
        padding:"16px 16px",
        paddingBottom:"max(20px,env(safe-area-inset-bottom,20px))"}}>

        {panel==="settings" ? (
          <div style={{animation:"scUp .2s both"}}>
            <p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,
              color:T.muted,letterSpacing:.6}}>EINSTELLUNGEN</p>

            {/* Visibility */}
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[{v:"public",l:"Öffentlich"},{v:"followers",l:"Follower"},{v:"friends",l:"Freunde"}].map(opt=>(
                <button key={opt.v} className="sc-tap"
                  onClick={()=>setVisibility(opt.v)}
                  style={{flex:1,padding:"10px 4px",borderRadius:12,border:"none",
                    background:visibility===opt.v
                      ?`linear-gradient(135deg,${T.teal},${T.coral})`
                      :"rgba(255,255,255,.08)",
                    color:"white",fontSize:12,fontWeight:700,
                    cursor:"pointer",transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
                  {opt.l}
                </button>
              ))}
            </div>

            {/* Toggles */}
            {[
              {label:"Kommentare erlauben",val:allowComments,set:setAllowComments},
              {label:"Als Highlight speichern",val:saveHighlight,set:setSaveHighlight},
            ].map(row=>(
              <div key={row.label} className="sc-tap"
                onClick={()=>row.set(p=>!p)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,.07)",
                  cursor:"pointer"}}>
                <span style={{color:"rgba(255,255,255,.8)",fontSize:14}}>{row.label}</span>
                <div style={{width:44,height:26,borderRadius:13,cursor:"pointer",
                  background:row.val?T.teal:"rgba(255,255,255,.15)",
                  position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,
                    left:row.val?20:3,width:20,height:20,
                    borderRadius:"50%",background:"white",
                    transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Gradient picker */}
            {!mediaPreview && (
              <div className="sc-scroll"
                style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
                {GRADIENTS.map(g=>(
                  <div key={g.id} className="sc-tap" onClick={()=>setGradient(g)}
                    style={{flexShrink:0,width:40,height:40,borderRadius:12,
                      background:g.css,cursor:"pointer",
                      border:`2.5px solid ${gradient.id===g.id?"white":"transparent"}`,
                      boxShadow:gradient.id===g.id?"0 0 0 1px rgba(255,255,255,.3)":"none",
                      transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}/>
                ))}
                <button className="sc-tap" onClick={()=>fileRef.current?.click()}
                  style={{flexShrink:0,width:40,height:40,borderRadius:12,
                    border:"1.5px dashed rgba(255,255,255,.3)",
                    background:"transparent",color:"rgba(255,255,255,.6)",
                    fontSize:20,cursor:"pointer",display:"flex",
                    alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            )}

            {/* Upload progress */}
            {uploading && uploadPct>0 && uploadPct<100 && (
              <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,.15)",
                overflow:"hidden"}}>
                <div style={{height:"100%",background:T.teal,borderRadius:2,
                  width:`${uploadPct}%`,transition:"width .3s"}}/>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{padding:"12px 14px",borderRadius:14,
                background:"rgba(255,80,80,.12)",border:"1px solid rgba(255,80,80,.3)",
                fontSize:13,color:"#FF8A8A",lineHeight:1.5}}>
                <div style={{fontWeight:700,marginBottom:4}}>⚠️ Ups.</div>
                <div>{error}</div>
                <button className="sc-tap" onClick={publish}
                  style={{marginTop:8,padding:"6px 14px",borderRadius:10,border:"none",
                    background:"rgba(255,255,255,.15)",color:"white",
                    fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Nochmal versuchen
                </button>
              </div>
            )}

            {/* Publish */}
            <button className="sc-tap" onClick={publish}
              disabled={uploading || !canPublish}
              style={{width:"100%",padding:"17px",borderRadius:18,border:"none",
                background:canPublish
                  ?`linear-gradient(135deg,${T.teal},${T.coral})`
                  :"rgba(255,255,255,.1)",
                color:canPublish?"white":"rgba(255,255,255,.3)",
                fontWeight:900,fontSize:15,
                cursor:canPublish?"pointer":"not-allowed",
                boxShadow:canPublish?`0 6px 24px ${T.tealGlow}`:"none",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */}}>
              {uploading ? (
                <>
                  <div style={{width:18,height:18,borderRadius:"50%",
                    border:"2.5px solid rgba(255,255,255,.3)",
                    borderTop:"2.5px solid white",
                    animation:"scSpin .8s linear infinite"}}/>
                  {uploadPct<70?"Lädt hoch…":"Story erstellen…"}
                </>
              ) : "⚡️ Story posten"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
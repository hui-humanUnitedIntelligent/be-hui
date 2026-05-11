// StorySystem.jsx — StoryBar + StoryViewer (unified, production-ready)
// Uses flat stories schema: no joins, direct columns
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth }  from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", tealGlow:"rgba(22,215,197,.32)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,.25)",
  gold:"#F5A623",
  ink:"#1A1A1A", ink3:"#6A6A6A", muted:"#9A9A9A",
  warm:"#F9F7F4", card:"#FFFFFF", border:"rgba(0,0,0,.08)",
};

const CSS_SHARED = `
  .ss-tap{cursor:pointer;-webkit-tap-highlight-color:transparent}
  .ss-tap:active{opacity:.7;transform:scale(.94)}
  .ss-scroll::-webkit-scrollbar{display:none}
  .ss-scroll{-ms-overflow-style:none;scrollbar-width:none}
  @keyframes ssIn{from{opacity:0}to{opacity:1}}
  @keyframes ssUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ssProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
`;

/* ──────────────────────────────────────────────────────────────────
   STORYBAR
────────────────────────────────────────────────────────────────── */
export function StoryBar({ onRefreshKey }) {
  const { user } = useAuth();
  const [stories,  setStories]  = useState([]);
  const [viewer,   setViewer]   = useState(null); // { stories:[], startIdx:0 }
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("stories")
        .select("id,user_id,username,avatar_url,media_url,media_type,text_overlay,mood,background,is_highlight,created_at,expires_at")
        .eq("status","published")
        .or(`expires_at.gt.${now},is_highlight.eq.true`)
        .order("created_at",{ascending:false})
        .limit(40);
      if (error) { console.error("[StoryBar] load:", error); return; }
      setStories(data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, onRefreshKey]);

  // Group by user_id, keep newest story as representative
  const grouped = React.useMemo(() => {
    const map = new Map();
    for (const s of stories) {
      if (!map.has(s.user_id)) {
        map.set(s.user_id, { rep: s, all: [s] });
      } else {
        map.get(s.user_id).all.push(s);
      }
    }
    return Array.from(map.values());
  }, [stories]);

  if (loading) return (
    <div style={{padding:"16px 20px 8px",display:"flex",gap:14}}>
      {[1,2,3,4].map(i=>(
        <div key={i} style={{flexShrink:0,display:"flex",flexDirection:"column",
          alignItems:"center",gap:6}}>
          <div style={{width:68,height:68,borderRadius:"50%",
            background:"rgba(0,0,0,.06)",animation:`ssIn ${.3+i*.1}s both`}}/>
          <div style={{width:50,height:9,borderRadius:5,background:"rgba(0,0,0,.06)"}}/>
        </div>
      ))}
    </div>
  );

  if (grouped.length === 0) return null;

  return (
    <>
      <style>{CSS_SHARED}</style>
      <div style={{padding:"16px 0 8px"}}>
        <div className="ss-scroll"
          style={{display:"flex",gap:14,overflowX:"auto",
            padding:"0 20px",WebkitOverflowScrolling:"touch"}}>
          {grouped.map(({rep, all}, i) => (
            <StoryAvatar key={rep.user_id} story={rep} count={all.length}
              onTap={()=>setViewer({stories:all, startIdx:0})}
              animDelay={i*.06}/>
          ))}
        </div>
      </div>

      {viewer && (
        <StoryViewer
          stories={viewer.stories}
          startIdx={viewer.startIdx}
          onClose={()=>setViewer(null)}
        />
      )}
    </>
  );
}

function StoryAvatar({ story, count, onTap, animDelay }) {
  const initials = (story.username||"HUI").slice(0,2).toUpperCase();
  return (
    <div className="ss-tap" onClick={onTap}
      style={{flexShrink:0,display:"flex",flexDirection:"column",
        alignItems:"center",gap:6,
        animation:`ssUp .35s ${animDelay}s both`}}>
      {/* Gradient ring */}
      <div style={{
        width:68,height:68,borderRadius:"50%",padding:2.5,
        background:story.is_highlight
          ?`linear-gradient(135deg,#F5A623,${C.coral})`
          :`linear-gradient(135deg,${C.teal},${C.coral})`,
        boxShadow:story.is_highlight
          ?`0 3px 14px rgba(245,166,35,.4)`
          :`0 3px 14px ${C.tealGlow}`
      }}>
        <div style={{width:"100%",height:"100%",borderRadius:"50%",
          overflow:"hidden",border:"2.5px solid white",
          background:C.warm,display:"flex",alignItems:"center",
          justifyContent:"center"}}>
          {story.avatar_url ? (
            <img src={story.avatar_url} alt=""
              style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          ) : story.media_url && story.media_type==="image" ? (
            <img src={story.media_url} alt=""
              style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          ) : (
            <div style={{fontSize:22,fontWeight:800,color:C.ink3}}>{initials}</div>
          )}
        </div>
      </div>
      {/* Name */}
      <span style={{fontSize:11,fontWeight:600,color:C.ink,maxWidth:72,
        textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",
        whiteSpace:"nowrap",lineHeight:1.2}}>
        {story.username||"HUI"}
      </span>
      {count>1 && (
        <span style={{fontSize:9,fontWeight:700,color:C.muted,marginTop:-4}}>
          {count} Stories
        </span>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   STORY VIEWER
────────────────────────────────────────────────────────────────── */
const PROGRESS_DURATION = 5000; // ms per story

export function StoryViewer({ stories, startIdx=0, onClose }) {
  const { user } = useAuth();
  const [idx,     setIdx]     = useState(startIdx);
  const [paused,  setPaused]  = useState(false);
  const [progress,setProgress]= useState(0);
  const timerRef  = useRef(null);
  const startRef  = useRef(null);
  const elapsed   = useRef(0);

  const current = stories[idx];

  // Mark viewed
  useEffect(() => {
    if (user && current?.id) {
      supabase.from("story_views")
        .upsert({story_id:current.id, viewer_id:user.id},{onConflict:"story_id,viewer_id"})
        .then(()=>{});
    }
  }, [current?.id, user?.id]);

  // Progress timer
  const startTimer = useCallback(() => {
    startRef.current = Date.now() - elapsed.current;
    timerRef.current = setInterval(() => {
      const el = Date.now() - startRef.current;
      const pct = Math.min(el / PROGRESS_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(timerRef.current);
        elapsed.current = 0;
        if (idx < stories.length-1) setIdx(p=>p+1);
        else onClose?.();
      }
    }, 50);
  }, [idx, stories.length, onClose]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    elapsed.current = (Date.now() - (startRef.current||Date.now()));
  }, []);

  useEffect(() => {
    setProgress(0);
    elapsed.current = 0;
    if (!paused) startTimer();
    return () => clearInterval(timerRef.current);
  }, [idx, paused]);

  useEffect(() => {
    if (paused) stopTimer();
    else startTimer();
  }, [paused]);

  function goNext() { elapsed.current=0; if(idx<stories.length-1)setIdx(p=>p+1);else onClose?.(); }
  function goPrev() { elapsed.current=0; if(idx>0)setIdx(p=>p-1); }

  if (!current) return null;

  const bgStyle = current.background
    ? {background:current.background}
    : current.media_url
      ? {}
      : {background:`linear-gradient(135deg,${C.teal},${C.coral})`};

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"#000",
      animation:"ssIn .2s both"}}
      onPointerDown={()=>setPaused(true)}
      onPointerUp={()=>setPaused(false)}
      onPointerLeave={()=>setPaused(false)}>
      <style>{CSS_SHARED}</style>

      {/* Media */}
      <div style={{position:"absolute",inset:0,...bgStyle}}>
        {current.media_url && current.media_type==="image" && (
          <img src={current.media_url} alt=""
            style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        )}
        {current.media_url && current.media_type==="video" && (
          <video src={current.media_url} autoPlay playsInline muted
            style={{width:"100%",height:"100%",objectFit:"cover"}}
            onEnded={goNext}/>
        )}
      </div>

      {/* Darkening gradient */}
      <div style={{position:"absolute",inset:0,
        background:"linear-gradient(rgba(0,0,0,.15) 0%,transparent 30%,transparent 60%,rgba(0,0,0,.45) 100%)"
      }}/>

      {/* Progress bars */}
      <div style={{position:"absolute",
        top:"max(10px,env(safe-area-inset-top,10px))",
        left:12,right:12,display:"flex",gap:3,zIndex:10}}>
        {stories.map((_,i)=>(
          <div key={i} style={{flex:1,height:2.5,borderRadius:2,
            background:"rgba(255,255,255,.28)",overflow:"hidden"}}>
            <div style={{
              height:"100%",background:"white",borderRadius:2,
              transformOrigin:"left",
              transform:`scaleX(${i<idx?1:i===idx?progress:0})`,
              transition:i===idx?"none":"none"
            }}/>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{position:"absolute",
        top:"max(24px,calc(env(safe-area-inset-top,10px)+14px))",
        left:16,right:16,display:"flex",alignItems:"center",gap:10,zIndex:10}}>
        <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",
          border:"2px solid rgba(255,255,255,.7)",background:C.warm,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {current.avatar_url
            ? <img src={current.avatar_url} alt=""
                style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{fontSize:13,fontWeight:800,color:C.ink}}>
                {(current.username||"H").slice(0,2).toUpperCase()}
              </span>
          }
        </div>
        <div style={{flex:1}}>
          <div style={{color:"white",fontWeight:700,fontSize:13,
            textShadow:"0 1px 4px rgba(0,0,0,.4)"}}>
            {current.username||"HUI User"}
          </div>
          {current.mood && (
            <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>
              {current.mood}
            </div>
          )}
        </div>
        <button className="ss-tap" onClick={onClose}
          style={{width:32,height:32,borderRadius:"50%",border:"none",
            background:"rgba(0,0,0,.4)",color:"white",fontSize:16,
            cursor:"pointer",display:"flex",alignItems:"center",
            justifyContent:"center",backdropFilter:"blur(6px)"}}>✕</button>
      </div>

      {/* Text overlay */}
      {current.text_overlay && (
        <div style={{position:"absolute",
          bottom:"max(80px,calc(env(safe-area-inset-bottom,20px)+60px))",
          left:20,right:20,textAlign:"center",
          color:"white",fontSize:20,fontWeight:800,lineHeight:1.35,
          textShadow:"0 2px 12px rgba(0,0,0,.6)",
          animation:"ssUp .3s both"}}>
          {current.text_overlay}
        </div>
      )}

      {/* Tap zones */}
      <div onClick={goPrev}
        style={{position:"absolute",top:60,bottom:80,left:0,width:"33%",zIndex:5}}/>
      <div onClick={goNext}
        style={{position:"absolute",top:60,bottom:80,right:0,width:"33%",zIndex:5}}/>
    </div>
  );
}

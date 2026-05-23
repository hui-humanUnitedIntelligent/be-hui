// WirkerSpaces.jsx — Phase 24 FINAL
// Circular world portals — emotional universe entries
import React, { useState, useRef, useEffect } from "react";

const safeArr = v => Array.isArray(v)?v:[];

const WORLDS = [
  {id:"atelier",  icon:"🎨",label:"Atelier",   sub:"Kreative Raume",   color:"#FF8A6B",
   img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"},
  {id:"projekte", icon:"✨",label:"Projekte",  sub:"Wirkung schaffen", color:"#6366F1",
   img:"https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&q=75"},
  {id:"natur",    icon:"🌿",label:"Natur",     sub:"Meine Quelle",     color:"#22C55E",
   img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=75"},
  {id:"reisen",   icon:"✈️",label:"Reisen",    sub:"Unterwegs",        color:"#0DC4B5",
   img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=75"},
  {id:"momente",  icon:"📸",label:"Momente",   sub:"Geteilte Augenblicke",color:"#F59E0B",
   img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=75"},
  {id:"musik",    icon:"🎵",label:"Musik",     sub:"Klang & Ausdruck", color:"#EC4899",
   img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&q=75"},
  {id:"gedanken", icon:"💭",label:"Gedanken",  sub:"Impulse & Texte",  color:"#8B5CF6",
   img:"https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&q=75"},
  {id:"community",icon:"👥",label:"Community", sub:"Gemeinschaft",     color:"#0EA5E9",
   img:"https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=200&q=75"},
];

function Portal({ world, onEnter }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onPointerEnter={()=>setHovered(true)}
      onPointerLeave={()=>setHovered(false)}
      onClick={()=>onEnter?.(world)}
      style={{
        flexShrink:0,display:"flex",flexDirection:"column",
        alignItems:"center",gap:7,cursor:"pointer",width:74,
        touchAction:"manipulation",
      }}
    >
      <div style={{
        width:66,height:66,borderRadius:"50%",overflow:"hidden",position:"relative",
        border:`2.5px solid ${hovered?world.color:"rgba(0,0,0,.09)"}`,
        boxShadow: hovered
          ? `0 0 0 4px ${world.color}22,0 6px 20px ${world.color}30`
          : "0 3px 10px rgba(0,0,0,.10)",
        transition:"all .3s ease",
        transform:hovered?"scale(1.07)":"scale(1)",
      }}>
        <img src={world.img} alt={world.label}
          style={{width:"100%",height:"100%",objectFit:"cover"}}
          onError={e=>{e.target.style.display="none";e.target.parentNode.style.background=world.color+"30";}}/>
        <div style={{
          position:"absolute",inset:0,
          background:`radial-gradient(circle,${world.color}55 0%,${world.color}22 100%)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
          opacity:hovered?1:0,transition:"opacity .25s ease",
        }}>{world.icon}</div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{
          fontSize:10,fontWeight:700,
          color:hovered?world.color:"#1A1A1A",
          transition:"color .25s ease",letterSpacing:"-.01em",
        }}>{world.label}</div>
        <div style={{fontSize:8,color:"#999",lineHeight:1.3,marginTop:1}}>{world.sub}</div>
      </div>
    </div>
  );
}

export default function WirkerSpaces({ spaces, onEnterSpace }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    const obs=new IntersectionObserver(
      ([e])=>{if(e.isIntersecting){setVisible(true);obs.disconnect();}},{threshold:.05}
    );
    obs.observe(el);
    return ()=>obs.disconnect();
  },[]);

  const worlds = safeArr(spaces).length ? safeArr(spaces) : WORLDS;

  return (
    <div ref={ref} style={{
      width:"100%",background:"#F9F7F4",padding:"20px 0 18px",
      opacity:visible?1:0,transform:visible?"none":"translateY(14px)",
      transition:"opacity .65s ease,transform .65s ease",
    }}>
      <div style={{padding:"0 18px 14px",display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.025em"}}>Raume & Welten</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>Tauche ein in meine verschiedenen Welten.</div>
        </div>
        <span style={{fontSize:11,color:"#0DC4B5",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
          Alle Raume →
        </span>
      </div>
      <div style={{
        display:"flex",gap:13,overflowX:"auto",scrollbarWidth:"none",
        padding:"3px 18px 6px",WebkitOverflowScrolling:"touch",
      }}>
        {worlds.map(w=><Portal key={w.id} world={w} onEnter={onEnterSpace}/>)}
        <div style={{flexShrink:0,width:4}}/>
      </div>
    </div>
  );
}

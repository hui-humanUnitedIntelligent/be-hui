// LiveMapPage.jsx — HUI Discovery v6
// Karte atmet. UI schwebt. Nicht umgekehrt.
import React, { useState, useEffect, useRef } from "react";
import { HUI } from "../design/hui.design.js";

const C = {
  teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep,
  tealGlow:"rgba(22,215,197,0.25)",
  coral:HUI.COLOR.coral, coralGlow:"rgba(255,138,107,0.22)",
  gold:HUI.COLOR.gold,
  green:"#3DB87A", greenGlow:"rgba(61,184,122,0.22)",
  violet:"#9B72CF", violetGlow:"rgba(155,114,207,0.22)",
  cream:HUI.COLOR.cream, warm:"#FFF9F4",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2,
  muted:"#888", muted2:"#BBBBBB",
  border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes floatOrb {
    0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}
  }
  @keyframes ringOut {
    0%{transform:scale(1);opacity:0.55}65%{transform:scale(1.7);opacity:0}100%{transform:scale(1.7);opacity:0}
  }
  @keyframes orbBreath {
    0%,100%{box-shadow:var(--s0)}50%{box-shadow:var(--s1)}
  }
  @keyframes sheetUp {
    from{opacity:0;transform:translateY(22px)scale(0.98)}
    to{opacity:1;transform:translateY(0)scale(1)}
  }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes breathe{0%,100%{opacity:0.65;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
  @keyframes matchFloat {
    0%,100%{transform:translateY(0)scale(1);box-shadow:0 6px 28px rgba(22,215,197,0.32)}
    50%{transform:translateY(-4px)scale(1.025);box-shadow:0 12px 40px rgba(22,215,197,0.48)}
  }
  @keyframes shimmer {
    0%{transform:translateX(-130%)}55%{transform:translateX(130%)}100%{transform:translateX(130%)}
  }
  @keyframes heatPulse{0%,100%{opacity:0.14}50%{opacity:0.26}}
  .lm-scroll::-webkit-scrollbar{display:none}
  .lm-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .lm-tap{-webkit-tap-highlight-color:transparent;cursor:pointer;
    transition:transform .2s cubic-bezier(.34,1.4,.64,1)}
  .lm-tap:active{transform:scale(0.95)!important}
`;

/* ── PINS ────────────────────────────────────────── */
const PINS = [
  {id:1,type:"wirker",name:"Lea Sommer",talent:"Fotografin",city:"München",
   lat:48.135,lng:11.582,available:true,recs:34,hourly:85,
   img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=700&q=85",
   bio:"Ich fange das Licht ein, bevor es verschwindet."},
  {id:2,type:"wirker",name:"Anna K.",talent:"Gartengestalterin",city:"München",
   lat:48.152,lng:11.536,available:true,recs:43,hourly:75,
   img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=85",
   bio:"Gärten sind lebendige Kunstwerke."},
  {id:3,type:"experience",name:"Walk & Think Session",creator:"Lars G.",city:"München",
   lat:48.142,lng:11.561,price:150,duration:"2 Std",
   img:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=700&q=85",
   bio:"Strategie-Spaziergang. Ideen brauchen Luft."},
  {id:4,type:"werk",name:"Aquarell Original",creator:"Lena M.",city:"München",
   lat:48.128,lng:11.570,price:120,category:"Kunst",
   img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=85",
   bio:"Aquarell auf Archivpapier. Jedes Stück ein Original."},
  {id:5,type:"impact",name:"Stadtgärten als Begegnungsorte",city:"München",
   lat:48.160,lng:11.547,raised:12800,goal:40000,
   img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=85",
   bio:"Wo Erde wächst, wächst Gemeinschaft."},
  {id:6,type:"wirker",name:"David Weber",talent:"Keramikkünstler",city:"Hamburg",
   lat:53.558,lng:9.985,available:true,recs:19,hourly:65,
   img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
   bio:"Ton ist mein Medium — Stille ist meine Sprache."},
  {id:7,type:"experience",name:"Töpferkurs am See",creator:"David W.",city:"Starnberg",
   lat:47.992,lng:11.353,price:85,duration:"3 Std",
   img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
   bio:"Töpfern am Ufer. Natur und Handwerk."},
  {id:8,type:"wirker",name:"Marcus B.",talent:"Videograf",city:"Berlin",
   lat:52.518,lng:13.404,available:false,recs:27,hourly:120,
   img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=700&q=85",
   bio:"Bewegte Bilder, die bewegen."},
  {id:9,type:"werk",name:"Leder-Rucksack",creator:"Stefan K.",city:"Berlin",
   lat:52.505,lng:13.418,price:195,category:"Mode",
   img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=85",
   bio:"Vegetable-Tanned Leder. Auf Maß gefertigt."},
  {id:10,type:"wirker",name:"Nina B.",talent:"Yogalehrerin",city:"Stuttgart",
   lat:48.775,lng:9.182,available:true,recs:61,hourly:55,
   img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=85",
   bio:"Yoga ist keine Übung — es ist eine Art zu leben."},
  {id:11,type:"experience",name:"Yoga bei Sonnenaufgang",creator:"Nina B.",city:"Stuttgart",
   lat:48.784,lng:9.196,price:35,duration:"75 Min",
   img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=85",
   bio:"Sonnenaufgang, Stille, Gemeinschaft."},
  {id:12,type:"impact",name:"Schutz der Meere",city:"Hamburg",
   lat:53.545,lng:9.960,raised:36200,goal:80000,
   img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=700&q=85",
   bio:"Wir schützen, was uns schützt."},
  {id:13,type:"wirker",name:"Felix M.",talent:"Gitarrenlehrer",city:"Frankfurt",
   lat:50.112,lng:8.683,available:true,recs:15,hourly:45,
   img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85",
   bio:"Musik verbindet."},
];

const TILE = (x,y,z) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/${z}/${x}/${y}@2x.png`;

function latLngToXY(lat,lng,mapLat,mapLng,zoom,w,h){
  const S=256,sc=S*Math.pow(2,zoom);
  const m=la=>(0.5-Math.log((1+Math.sin(la*Math.PI/180))/(1-Math.sin(la*Math.PI/180)))/(4*Math.PI));
  const cx=(mapLng/360+0.5)*sc, cy=m(mapLat)*sc;
  return {x:w/2+((lng/360+0.5)*sc-cx), y:h/2+(m(lat)*sc-cy)};
}

/* ── TILE CANVAS ─────────────────────────────────── */
function TileCanvas({mapLat,mapLng,zoom,width,height}){
  const ref=useRef(null);
  useEffect(()=>{
    const cv=ref.current; if(!cv)return;
    const ctx=cv.getContext("2d");
    ctx.clearRect(0,0,width,height);
    const S=256,sc=Math.pow(2,zoom),tot=S*sc;
    const m=la=>(0.5-Math.log((1+Math.sin(la*Math.PI/180))/(1-Math.sin(la*Math.PI/180)))/(4*Math.PI));
    const wx=(mapLng/360+0.5)*tot, wy=m(mapLat)*tot;
    const ox=wx-width/2, oy=wy-height/2;
    const tx0=Math.floor(ox/S),ty0=Math.floor(oy/S);
    const tx1=Math.ceil((ox+width)/S),ty1=Math.ceil((oy+height)/S);
    for(let tx=tx0;tx<=tx1;tx++)for(let ty=ty0;ty<=ty1;ty++){
      const px=tx*S-ox,py=ty*S-oy;
      const cx2=((tx%sc)+sc)%sc,cy2=((ty%sc)+sc)%sc;
      if(cy2>sc-1)continue;
      const img=new Image();img.crossOrigin="anonymous";
      img.onload=()=>{
        ctx.drawImage(img,px,py,S,S);
        ctx.fillStyle="rgba(249,246,242,0.16)";
        ctx.fillRect(px,py,S,S);
      };
      img.src=TILE(cx2,cy2,zoom);
    }
  },[mapLat,mapLng,zoom,width,height]);
  return <canvas ref={ref} width={width} height={height}
    style={{position:"absolute",inset:0,
      filter:"saturate(0.60) brightness(1.07) contrast(0.85) sepia(0.07)"}}/>;
}

/* ── ENERGY ORB ──────────────────────────────────── */
function EnergyOrb({pin,x,y,onClick,isSelected}){
  const isW=pin.type==="wirker",isWk=pin.type==="werk",
        isE=pin.type==="experience",isI=pin.type==="impact";
  const ac=isW?C.teal:isWk?C.coral:isE?C.violet:C.green;
  const sz=isW?56:isI?50:46;
  const fd=`${(pin.id*0.9)%3}s`, ad=`${(pin.id*1.1)%3.5}s`;
  return(
    <div data-bubble="1" onClick={()=>onClick(pin)} className="lm-tap"
      style={{position:"absolute",left:x-sz/2-10,top:y-sz/2-10,
        width:sz+20,height:sz+20,
        display:"flex",alignItems:"center",justifyContent:"center",
        zIndex:isSelected?60:isW?30:20,
        animation:`floatOrb ${3+(pin.id%3)}s ${fd} ease-in-out infinite`}}>
      {/* Ring */}
      <div style={{position:"absolute",inset:0,borderRadius:"50%",
        border:`1.5px solid ${ac}`,
        animation:`ringOut ${2.8+(pin.id%2)*0.7}s ${ad} ease-out infinite`,
        pointerEvents:"none"}}/>
      {/* Selected glow */}
      {isSelected&&<div style={{position:"absolute",inset:-6,borderRadius:"50%",
        background:`radial-gradient(circle,${ac}50 0%,transparent 65%)`,
        pointerEvents:"none"}}/>}
      {/* Body */}
      <div style={{width:sz,height:sz,borderRadius:"50%",overflow:"hidden",
        position:"relative",flexShrink:0,
        border:`2.5px solid ${isSelected?ac:"rgba(255,255,255,0.95)"}`,
        "--s0":`0 4px 16px rgba(0,0,0,0.13),0 0 0 0 ${ac}38`,
        "--s1":`0 6px 26px rgba(0,0,0,0.18),0 0 0 8px ${ac}00`,
        animation:`orbBreath ${3+(pin.id%2)*0.5}s ${ad} ease-in-out infinite`,
        transform:isSelected?"scale(1.1)":"scale(1)",
        transition:"border-color .28s,transform .22s",
        background:isI?`linear-gradient(135deg,${C.green},${C.teal})`:"white"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",
          background:`linear-gradient(135deg,${ac}30 0%,transparent 55%)`,
          zIndex:2,pointerEvents:"none"}}/>
        {isI
          ?<div style={{width:"100%",height:"100%",display:"flex",
              alignItems:"center",justifyContent:"center",
              fontSize:sz*0.38,position:"relative",zIndex:3}}>🌱</div>
          :<img src={pin.img} alt={pin.name}
              style={{position:"absolute",inset:0,width:"100%",height:"100%",
                objectFit:"cover",objectPosition:isW?"top":"center",
                filter:"brightness(0.88)saturate(1.1)"}}/>}
      </div>
      {/* Available dot */}
      {isW&&pin.available&&<div style={{position:"absolute",bottom:10,right:10,
        width:10,height:10,borderRadius:"50%",
        background:C.green,border:"2.5px solid white",
        boxShadow:`0 0 7px ${C.green}99`,zIndex:5}}/>}
    </div>
  );
}

/* ── DETAIL SHEET ────────────────────────────────── */
function DetailSheet({pin,onClose,onBooking}){
  const isW=pin.type==="wirker",isWk=pin.type==="werk",
        isE=pin.type==="experience",isI=pin.type==="impact";
  const ac=isW?C.teal:isWk?C.coral:isE?C.violet:C.green;
  const pct=isI?Math.round((pin.raised/pin.goal)*100):0;
  return(
    <div style={{position:"fixed",inset:0,zIndex:700,
      background:"rgba(6,6,6,0.50)",
      backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",
      animation:"fadeIn .2s ease"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,
        background:C.warm,borderRadius:"30px 30px 0 0",
        maxHeight:"84vh",display:"flex",flexDirection:"column",
        animation:"sheetUp .36s cubic-bezier(.22,1,.36,1) both",
        paddingBottom:"max(24px,env(safe-area-inset-bottom,24px))"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 0"}}>
          <div style={{width:44,height:4,borderRadius:999,background:"rgba(0,0,0,0.09)"}}/>
        </div>
        <div style={{position:"relative",height:220,margin:"10px 16px 0",
          borderRadius:24,overflow:"hidden",flexShrink:0}}>
          <img src={pin.bg} alt={pin.name}
            style={{width:"100%",height:"100%",objectFit:"cover",
              objectPosition:isW?"top center":"center",
              filter:"brightness(0.70)saturate(1.1)"}}/>
          <div style={{position:"absolute",inset:0,
            background:`linear-gradient(to bottom,${ac}18 0%,transparent 38%,rgba(0,0,0,0.70) 100%)`}}/>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,
            background:`linear-gradient(90deg,${ac},transparent)`}}/>
          <button onClick={onClose}
            style={{position:"absolute",top:12,right:12,width:32,height:32,
              borderRadius:"50%",background:"rgba(0,0,0,0.38)",
              backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.22)",
              cursor:"pointer",color:"white",fontSize:12,
              display:"flex",alignItems:"center",justifyContent:"center",
              WebkitTapHighlightColor:"transparent"}}>✕</button>
          {isW&&pin.available&&(
            <div style={{position:"absolute",top:12,left:12,
              display:"flex",alignItems:"center",gap:5,
              background:"rgba(61,184,122,0.22)",backdropFilter:"blur(10px)",
              border:"1px solid rgba(61,184,122,0.38)",
              borderRadius:999,padding:"3px 10px"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:C.green,
                display:"inline-block",animation:"breathe 2s ease-in-out infinite"}}/>
              <span style={{fontSize:9,fontWeight:800,color:C.green}}>Verfügbar</span>
            </div>)}
          {isE&&<div style={{position:"absolute",top:12,left:12,
            background:"rgba(0,0,0,0.32)",backdropFilter:"blur(8px)",
            borderRadius:999,padding:"3px 10px",fontSize:9,fontWeight:700,color:"white"}}>
            ⏱ {pin.duration}</div>}
          {isW&&(
            <div style={{position:"absolute",bottom:-24,left:24}}>
              <img src={pin.img} alt={pin.name}
                style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",
                  border:"3px solid white",boxShadow:"0 4px 16px rgba(0,0,0,0.22)"}}/>
            </div>)}
          {(isWk||isE)&&pin.price&&(
            <div style={{position:"absolute",bottom:12,right:12,
              background:"rgba(255,255,255,0.92)",backdropFilter:"blur(8px)",
              borderRadius:999,padding:"4px 13px",fontSize:12,fontWeight:900,color:C.ink}}>
              {isWk?`€ ${pin.price}`:`ab € ${pin.price}`}
            </div>)}
        </div>
        <div className="lm-scroll"
          style={{flex:1,overflowY:"auto",
            padding:isW?"36px 24px 16px":"20px 24px 16px"}}>
          <div style={{fontWeight:900,fontSize:22,color:C.ink,
            letterSpacing:-.5,lineHeight:1.2,marginBottom:4}}>{pin.name}</div>
          {isW&&<div style={{fontSize:13,color:ac,fontWeight:700,marginBottom:4}}>{pin.talent}</div>}
          {(isWk||isE)&&<div style={{fontSize:12,color:C.teal,fontWeight:600,marginBottom:4}}>
            {pin.creator} · {pin.city}</div>}
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>📍 {pin.city}</div>
          <div style={{fontSize:14,color:C.ink2,lineHeight:1.8,fontStyle:"italic",marginBottom:18}}>
            „{pin.bio}"</div>
          {isW&&(
            <div style={{display:"flex",gap:10,marginBottom:18}}>
              {[{v:`${pin.recs}`,l:"Empfehlungen",c:C.teal},{v:`€${pin.hourly}`,l:"Pro Stunde",c:C.coral}]
                .map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:"center",padding:"11px 8px",
                  background:C.cream,borderRadius:16,border:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:900,fontSize:16,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.l}</div>
                </div>))}
            </div>)}
          {isI&&(
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <span style={{fontWeight:800,fontSize:15,color:C.green}}>
                  € {new Intl.NumberFormat("de-DE").format(pin.raised)}</span>
                <span style={{fontSize:12,color:C.muted}}>{pct}% erreicht</span>
              </div>
              <div style={{height:5,borderRadius:999,background:"rgba(0,0,0,0.07)",overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:999,width:`${pct}%`,
                  background:`linear-gradient(90deg,${C.green},${C.teal})`}}/>
              </div>
            </div>)}
        </div>
        <div style={{padding:"0 24px",flexShrink:0}}>
          <button className="lm-tap"
            onClick={()=>{onClose();onBooking&&onBooking(pin);}}
            style={{width:"100%",padding:"15px",
              background:`linear-gradient(135deg,${ac},${isW?C.coral:isI?C.teal:ac+"AA"})`,
              border:"none",borderRadius:20,fontSize:14,fontWeight:900,color:"white",
              cursor:"pointer",fontFamily:"inherit",
              boxShadow:`0 6px 22px ${isW?C.tealGlow:isWk?C.coralGlow:isI?C.greenGlow:C.violetGlow}`}}>
            {isW?"✨ Anfragen":isWk?"🎨 Mehr entdecken":isE?"🌟 Erlebnis buchen":"🌱 Projekt ansehen"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── FILTER SHEET — öffnet sich on demand ────────── */
const STAGE_DEFS = [
  {stage:0,icon:"🌱",label:"Ganz nah",   km:"bis 10 km", sub:"Direkt bei dir",      accent:C.green, glow:C.greenGlow},
  {stage:1,icon:"✨",label:"Lokal",       km:"10–50 km",  sub:"Deine Region",        accent:C.teal,  glow:C.tealGlow},
  {stage:2,icon:"🌍",label:"Offen",       km:"bis 200 km",sub:"Neue kreative Energie",accent:C.coral, glow:C.coralGlow},
  {stage:3,icon:"🚀",label:"Grenzenlos",  km:"Weltweit",  sub:"Verbinde dich global", accent:C.violet,glow:C.violetGlow},
];
const AVAIL=[
  {key:"alle",label:"Alle"},{key:"aktiv",label:"🟢 Aktiv"},
  {key:"heute",label:"📅 Heute"},{key:"woche",label:"📆 Woche"},
];
const FTYPES=[
  {key:"alle",label:"✦ Alle",ac:C.teal},
  {key:"wirker",label:"🤝 Menschen",ac:C.teal},
  {key:"werk",label:"🎨 Werke",ac:C.coral},
  {key:"experience",label:"🌿 Erlebnisse",ac:C.violet},
  {key:"impact",label:"🌍 Impact",ac:C.green},
];

function FilterSheet({filter,setFilter,radiusStage,setRadiusStage,
    radius,setRadius,availability,setAvailability,onClose}){
  const cur=STAGE_DEFS[radiusStage];
  return(
    <div style={{position:"fixed",inset:0,zIndex:600,
      background:"rgba(6,6,6,0.42)",
      backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",
      animation:"fadeIn .18s ease"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,
        background:"rgba(252,250,247,0.96)",
        backdropFilter:"blur(30px) saturate(2)",
        WebkitBackdropFilter:"blur(30px) saturate(2)",
        borderRadius:"28px 28px 0 0",
        border:"1px solid rgba(255,255,255,0.75)",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.9)",
        animation:"sheetUp .32s cubic-bezier(.22,1,.36,1) both",
        paddingBottom:"max(20px,env(safe-area-inset-bottom,20px))"}}>
        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}>
          <div style={{width:44,height:4,borderRadius:999,background:"rgba(0,0,0,0.09)"}}/>
        </div>
        <div className="lm-scroll" style={{overflowY:"auto",maxHeight:"68vh",padding:"4px 18px 18px"}}>
          {/* Title */}
          <div style={{fontWeight:900,fontSize:16,color:C.ink,
            marginBottom:16,letterSpacing:-.3}}>
            Entdecken
          </div>
          {/* Type filter chips */}
          <div className="lm-scroll"
            style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:2}}>
            {(FTYPES||[]).filter(f=>f&&f.key).map(f=>{
              if (!f || !f.key) return null; const act=filter===f.key;
              return(
                <button key={f.key} data-bubble="1" className="lm-tap"
                  onClick={()=>setFilter(f.key)}
                  style={{padding:"7px 14px",borderRadius:999,flexShrink:0,
                    background:act?`linear-gradient(135deg,${f.ac}22,${f.ac}10)`:"rgba(0,0,0,0.05)",
                    border:`1.5px solid ${act?f.ac+"55":"transparent"}`,
                    fontSize:12,fontWeight:act?800:500,
                    color:act?f.ac:C.ink2,cursor:"pointer",fontFamily:"inherit",
                    whiteSpace:"nowrap",
                    boxShadow:act?`0 2px 10px ${f.ac}30`:"none",
                    transition:"all .2s"}}>
                  {f.label}
                </button>);
            })}
          </div>
          {/* Divider */}
          <div style={{height:1,background:"rgba(0,0,0,0.07)",marginBottom:14}}/>
          {/* Radius question */}
          <div style={{fontSize:11,fontWeight:700,color:C.muted,
            letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>
            Wie weit möchtest du entdecken?
          </div>
          {/* 4 stage cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {(STAGE_DEFS||[]).filter(s=>s&&s.key).map(s=>{
              const act=radiusStage===s.stage;
              return(
                <button key={s.stage} data-bubble="1" className="lm-tap"
                  onClick={()=>{setRadiusStage(s.stage);setRadius([10,50,200,500][s.stage]);}}
                  style={{padding:"11px 10px",
                    background:act?`linear-gradient(135deg,${s.accent}22,${s.accent}0C)`:"rgba(0,0,0,0.04)",
                    border:`1.5px solid ${act?s.accent+"55":"transparent"}`,
                    borderRadius:16,cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                    boxShadow:act?`0 3px 14px ${s.glow},inset 0 1px 0 rgba(255,255,255,0.6)`:"none",
                    transform:act?"scale(1.02)":"scale(1)",
                    transition:"all .22s cubic-bezier(.34,1.4,.64,1)",
                    WebkitTapHighlightColor:"transparent"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                    <span style={{fontSize:14}}>{s.icon}</span>
                    <span style={{fontWeight:800,fontSize:12,color:act?C.ink:C.ink2}}>{s.label}</span>
                  </div>
                  <div style={{fontSize:10,color:act?s.accent:C.muted,fontWeight:act?700:500}}>{s.km}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:1,fontStyle:"italic"}}>{s.sub}</div>
                </button>);
            })}
          </div>
          {/* Fine slider */}
          {radiusStage<3&&(
            <div data-bubble="1" style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:11,color:C.muted,fontWeight:600}}>Genauer</span>
                <span style={{fontSize:11,fontWeight:800,color:cur.accent,
                  background:`${cur.accent}14`,borderRadius:999,padding:"1px 8px"}}>
                  {radius} km</span>
              </div>
              <input type="range"
                min={[2,10,50,100][radiusStage]} max={[10,50,200,500][radiusStage]}
                step={radiusStage===0?1:5} value={radius}
                onChange={e=>setRadius(+e.target.value)} data-bubble="1"
                style={{width:"100%",accentColor:cur.accent,cursor:"pointer",display:"block"}}/>
            </div>)}
          {/* Divider */}
          <div style={{height:1,background:"rgba(0,0,0,0.07)",marginBottom:12}}/>
          {/* Availability */}
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {AVAIL.map(a=>(
              <button key={a.key} data-bubble="1" className="lm-tap"
                onClick={()=>setAvailability(a.key)}
                style={{padding:"6px 13px",
                  background:availability===a.key
                    ?`linear-gradient(135deg,${C.teal},${C.teal2})`:"rgba(0,0,0,0.05)",
                  border:"none",borderRadius:999,fontSize:11,
                  fontWeight:availability===a.key?800:500,
                  color:availability===a.key?"white":C.muted,
                  cursor:"pointer",fontFamily:"inherit",
                  boxShadow:availability===a.key?`0 2px 10px ${C.tealGlow}`:"none",
                  transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */,WebkitTapHighlightColor:"transparent"}}>
                {a.label}
              </button>))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════ */
export default function LiveMapPage({onView,onMatch,onClose,fullscreen}){
  const [mapLat,setMapLat]=useState(48.142);
  const [mapLng,setMapLng]=useState(11.560);
  const [zoom,setZoom]=useState(12);
  const [size,setSize]=useState({w:390,h:680});
  const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState("alle");
  const [radiusStage,setRadiusStage]=useState(1);
  const [radius,setRadius]=useState(50);
  const [availability,setAvailability]=useState("alle");
  const [visible,setVisible]=useState(true);
  const [userLat]=useState(48.138);
  const [userLng]=useState(11.575);
  const [sheetOpen,setSheetOpen]=useState(false);  // filter sheet
  const [matchIdx,setMatchIdx]=useState(0);
  const containerRef=useRef(null);
  const drag=useRef({active:false});

  const MATCH_TEXTS=["Kreative Energie finden","Menschen entdecken",
    "Talente in deiner Nähe","Passende Menschen"];

  useEffect(()=>{
    const t=setInterval(()=>setMatchIdx(i=>(i+1)%4),3400);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const el=containerRef.current; if(!el)return;
    const obs=new ResizeObserver(e=>{
      const r=e[0].contentRect; setSize({w:r.width,h:r.height});
    });
    obs.observe(el); setSize({w:el.clientWidth,h:el.clientHeight});
    return()=>obs.disconnect();
  },[]);

  useEffect(()=>{
    if(!navigator.geolocation)return;
    navigator.geolocation.getCurrentPosition(
      p=>{setMapLat(p.coords.latitude);setMapLng(p.coords.longitude);},
      ()=>{},{timeout:5000});
  },[]);

  function onPD(e){
    if(e.target.closest("[data-bubble]"))return;
    drag.current={active:true,sx:e.clientX,sy:e.clientY,slat:mapLat,slng:mapLng};
  }
  function onPM(e){
    if(!drag.current.active)return;
    const sc=Math.pow(2,zoom);
    const mpp=(40075016.686*Math.cos(mapLat*Math.PI/180))/(256*sc);
    setMapLat(drag.current.slat+(e.clientY-drag.current.sy)*mpp/111320);
    setMapLng(drag.current.slng-(e.clientX-drag.current.sx)*mpp/111320);
  }
  function onPU(){drag.current.active=false;}

  const pins=PINS.filter(p=>{
    if(filter!=="alle"&&p.type!==filter)return false;
    if(availability==="aktiv"&&p.type==="wirker"&&!p.available)return false;
    if(availability==="heute"&&p.type==="experience"&&!p.available)return false;
    return true;
  });

  // Active filter label for the search bar
  const activeFilter=FTYPES.find(f=>f.key===filter);
  const activeStage=STAGE_DEFS[radiusStage];

  return(
    <>
      <style>{CSS}</style>
      <div style={{
        position:fullscreen?"fixed":"relative",
        inset:fullscreen?0:"auto",
        zIndex:fullscreen?400:"auto",
        width:"100%",height:fullscreen?"100dvh":"100%",
        background:C.cream,overflow:"hidden"}}
        ref={containerRef}
        onPointerDown={onPD} onPointerMove={onPM}
        onPointerUp={onPU} onPointerLeave={onPU}>

        {/* MAP */}
        <TileCanvas mapLat={mapLat} mapLng={mapLng}
          zoom={zoom} width={size.w} height={size.h}/>

        {/* Atmospheric vignette */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",
          background:`radial-gradient(ellipse at 50% 42%,
            transparent 32%,rgba(8,4,0,0.20) 100%)`}}/>

        {/* Heatmap zones */}
        {[{lat:48.142,lng:11.565,color:C.teal,r:110,op:0.10},
          {lat:48.150,lng:11.538,color:C.coral,r:80,op:0.07},
          {lat:48.130,lng:11.575,color:C.gold,r:70,op:0.06}]
          .map((z,i)=>{
            const {x:zx,y:zy}=latLngToXY(z.lat,z.lng,mapLat,mapLng,zoom,size.w,size.h);
            return(<div key={i} style={{position:"absolute",
              left:zx-z.r,top:zy-z.r,width:z.r*2,height:z.r*2,
              borderRadius:"50%",
              background:`radial-gradient(circle,${z.color} 0%,transparent 70%)`,
              opacity:z.op,
              animation:`heatPulse ${4+i}s ${i*1.3}s ease-in-out infinite`,
              pointerEvents:"none",mixBlendMode:"multiply"}}/>);
          })}

        {/* ORBS */}
        {pins.map(pin=>{
          const {x,y}=latLngToXY(pin.lat,pin.lng,mapLat,mapLng,zoom,size.w,size.h);
          if(x<-90||x>size.w+90||y<-90||y>size.h+90)return null;
          return(<div key={pin.id} data-bubble="1"
            style={{position:"absolute",left:0,top:0,pointerEvents:"auto"}}>
            <EnergyOrb pin={pin} x={x} y={y}
              onClick={p=>setSelected(p)}
              isSelected={selected?.id===pin.id}/>
          </div>);
        })}

        {/* USER DOT */}
        {(()=>{
          const {x,y}=latLngToXY(userLat,userLng,mapLat,mapLng,zoom,size.w,size.h);
          return(<div style={{position:"absolute",left:x-10,top:y-10,
            width:20,height:20,pointerEvents:"none"}}>
            <div style={{position:"absolute",inset:-8,borderRadius:"50%",
              background:`rgba(22,215,197,0.16)`,
              "--s0":"0 0 0 0 rgba(22,215,197,0.25)",
              "--s1":"0 0 0 14px rgba(22,215,197,0)",
              animation:"huiOrbBreath 2.4s ease-in-out infinite"}}/>
            <div style={{width:"100%",height:"100%",borderRadius:"50%",
              background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"3px solid white",
              boxShadow:`0 0 0 2px ${C.teal},0 4px 12px rgba(0,0,0,0.22)`}}/>
          </div>);
        })()}

        {/* ── TOP UI ── tiny floating controls */}
        <div style={{position:"absolute",
          top:"max(50px,env(safe-area-inset-top,50px))",
          left:14,right:14,pointerEvents:"auto"}}>

          {/* Search pill — single row, floats */}
          <div style={{display:"flex",alignItems:"center",gap:8,
            background:"rgba(252,250,247,0.82)",
            backdropFilter:"blur(24px) saturate(1.8)",
            WebkitBackdropFilter:"blur(24px) saturate(1.8)",
            border:"1px solid rgba(255,255,255,0.70)",
            borderRadius:20,padding:"10px 14px",
            boxShadow:"0 4px 22px rgba(0,0,0,0.11),inset 0 1px 0 rgba(255,255,255,0.9)"}}>
            {/* Location dot */}
            <span style={{width:7,height:7,borderRadius:"50%",
              background:C.teal,flexShrink:0,
              boxShadow:`0 0 6px ${C.teal}`,
              animation:"breathe 3s ease-in-out infinite"}}/>
            {/* Search text */}
            <span style={{flex:1,fontSize:13,color:C.muted,
              fontWeight:500,letterSpacing:-.1}}>
              Wen oder was suchst du?
            </span>
            {/* Active filter badge */}
            {filter!=="alle"&&(
              <span style={{fontSize:10,fontWeight:700,
                color:activeFilter?.ac||C.teal,
                background:`${activeFilter?.ac||C.teal}14`,
                borderRadius:999,padding:"2px 8px",
                border:`1px solid ${activeFilter?.ac||C.teal}30`,
                flexShrink:0}}>
                {activeFilter?.label}
              </span>)}
            {/* Filter toggle */}
            <button data-bubble="1" className="lm-tap"
              onClick={()=>setSheetOpen(true)}
              style={{width:30,height:30,borderRadius:10,flexShrink:0,
                background:sheetOpen
                  ?`linear-gradient(135deg,${C.teal},${C.coral})`
                  :"rgba(0,0,0,0.06)",
                border:"none",fontSize:13,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:sheetOpen?`0 3px 12px ${C.tealGlow}`:"none",
                transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */,
                WebkitTapHighlightColor:"transparent",cursor:"pointer"}}>
              ⚙
            </button>
            {/* Slim divider */}
            <div style={{width:1,height:18,background:"rgba(0,0,0,0.09)",flexShrink:0}}/>
            {/* Tiny match */}
            <button data-bubble="1" className="lm-tap" onClick={onMatch}
              style={{flexShrink:0,padding:"5px 11px",
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                border:"none",borderRadius:12,fontSize:11,fontWeight:800,
                color:"white",cursor:"pointer",fontFamily:"inherit",
                boxShadow:`0 3px 12px ${C.tealGlow}`,
                overflow:"hidden",position:"relative",
                WebkitTapHighlightColor:"transparent"}}>
              <div style={{position:"absolute",inset:0,
                background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.2) 48%,transparent 66%)",
                animation:"shimmer 3.5s ease-in-out infinite",pointerEvents:"none"}}/>
              <span style={{position:"relative"}}>✨ Match</span>
            </button>
          </div>

          {/* Tiny filter chips row — only 3 visible + scroll */}
          <div className="lm-scroll"
            style={{display:"flex",gap:6,overflowX:"auto",
              paddingTop:8,paddingBottom:2}}>
            {(FTYPES||[]).filter(f=>f&&f.key).map(f=>{
              if (!f || !f.key) return null; const act=filter===f.key;
              return(<button key={f.key} data-bubble="1" className="lm-tap"
                onClick={()=>setFilter(f.key)}
                style={{padding:"5px 12px",borderRadius:999,flexShrink:0,
                  background:act
                    ?"rgba(252,250,247,0.95)"
                    :"rgba(252,250,247,0.65)",
                  backdropFilter:"blur(14px)",
                  WebkitBackdropFilter:"blur(14px)",
                  border:`1px solid ${act?f.ac+"55":"rgba(255,255,255,0.50)"}`,
                  fontSize:11,fontWeight:act?800:500,
                  color:act?f.ac:C.ink2,cursor:"pointer",fontFamily:"inherit",
                  whiteSpace:"nowrap",
                  boxShadow:act?`0 2px 10px ${f.ac}30`:"0 1px 4px rgba(0,0,0,0.06)",
                  transition:"all .2s"}}>
                {f.label}
              </button>);
            })}
          </div>
        </div>

        {/* ── TOP RIGHT — privacy + close ── */}
        <div style={{position:"absolute",
          top:"max(50px,env(safe-area-inset-top,50px))",
          right:14,display:"flex",flexDirection:"column",
          gap:8,pointerEvents:"auto",marginTop:0}}>
          {onClose&&(
            <button onClick={onClose} data-bubble="1"
              style={{width:38,height:38,borderRadius:12,
                background:"rgba(252,250,247,0.80)",
                backdropFilter:"blur(18px)",
                border:"1px solid rgba(255,255,255,0.65)",
                boxShadow:"0 3px 12px rgba(0,0,0,0.09)",
                cursor:"pointer",fontSize:14,color:C.muted,
                display:"flex",alignItems:"center",justifyContent:"center",
                WebkitTapHighlightColor:"transparent"}}>✕</button>)}
          <button onClick={()=>setVisible(v=>!v)} data-bubble="1"
            style={{width:38,height:38,borderRadius:12,
              background:visible
                ?`linear-gradient(135deg,${C.teal},${C.teal2})`
                :"rgba(252,250,247,0.80)",
              backdropFilter:"blur(18px)",
              border:"1px solid rgba(255,255,255,0.65)",
              boxShadow:`0 3px 12px ${visible?C.tealGlow:"rgba(0,0,0,0.09)"}`,
              cursor:"pointer",fontSize:14,
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .28s",
              WebkitTapHighlightColor:"transparent"}}>
            {visible?"👁":"🙈"}
          </button>
        </div>

        {/* ── ZOOM — right center ── */}
        <div style={{position:"absolute",right:14,top:"50%",
          transform:"translateY(-50%)",
          display:"flex",flexDirection:"column",gap:7,pointerEvents:"auto"}}>
          {[{l:"+",d:1},{l:"−",d:-1}].map(b=>(
            <button key={b.l} data-bubble="1"
              onClick={()=>setZoom(z=>Math.min(16,Math.max(8,z+b.d)))}
              style={{width:36,height:36,
                background:"rgba(252,250,247,0.82)",
                backdropFilter:"blur(16px)",
                border:"1px solid rgba(255,255,255,0.65)",
                borderRadius:11,fontSize:17,fontWeight:700,
                color:C.ink2,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 3px 10px rgba(0,0,0,0.08)",
                WebkitTapHighlightColor:"transparent"}}>
              {b.l}
            </button>))}
        </div>

        {/* ── BOTTOM — floating match orb only ── */}
        <div style={{position:"absolute",
          bottom:"max(20px,env(safe-area-inset-bottom,20px))",
          left:0,right:0,
          display:"flex",justifyContent:"center",
          alignItems:"center",gap:10,
          pointerEvents:"none"}}>

          {/* Radius hint pill */}
          <div style={{pointerEvents:"auto",
            display:"flex",alignItems:"center",gap:5,
            background:"rgba(252,250,247,0.78)",
            backdropFilter:"blur(16px)",
            border:"1px solid rgba(255,255,255,0.60)",
            borderRadius:999,padding:"7px 12px",
            boxShadow:"0 3px 14px rgba(0,0,0,0.08)"}}>
            <span style={{fontSize:12}}>{activeStage.icon}</span>
            <span style={{fontSize:11,fontWeight:700,color:C.ink2}}>
              {radiusStage<3?`${radius} km`:activeStage.label}
            </span>
            <span style={{fontSize:10,color:C.muted}}>· {pins.length} {pins.length===1?"Ort":"Orte"}</span>
          </div>

          {/* Match orb */}
          <button data-bubble="1" className="lm-tap" onClick={onMatch}
            style={{pointerEvents:"auto",
              padding:"13px 22px",
              background:`linear-gradient(135deg,${C.teal}F0,${C.coral}E5)`,
              border:"none",borderRadius:999,
              fontSize:13,fontWeight:800,color:"white",
              cursor:"pointer",fontFamily:"inherit",
              animation:"matchFloat 3.8s ease-in-out infinite",
              display:"flex",alignItems:"center",gap:7,
              overflow:"hidden",position:"relative",
              WebkitTapHighlightColor:"transparent",
              boxShadow:`0 6px 28px ${C.tealGlow},inset 0 1px 0 rgba(255,255,255,0.2)`}}>
            <div style={{position:"absolute",inset:0,
              background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%)",
              animation:"shimmer 4s ease-in-out infinite",pointerEvents:"none"}}/>
            <span style={{position:"relative",fontSize:15}}>✨</span>
            <span style={{position:"relative"}}>{MATCH_TEXTS[matchIdx]}</span>
          </button>
        </div>

        {/* ── INVISIBLE hint ── */}
        {!visible&&(
          <div style={{position:"absolute",top:"50%",left:"50%",
            transform:"translate(-50%,-50%)",
            background:"rgba(252,250,247,0.92)",
            backdropFilter:"blur(20px)",
            border:"1px solid rgba(255,255,255,0.70)",
            borderRadius:24,padding:"22px 28px",
            textAlign:"center",maxWidth:260,
            boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
            pointerEvents:"none",animation:"sheetUp .3s ease both"}}>
            <div style={{fontSize:30,marginBottom:8}}>🙈</div>
            <div style={{fontWeight:800,fontSize:15,color:C.ink,marginBottom:4}}>Du bist unsichtbar</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.65}}>
              Andere sehen dich nicht.<br/>Du kannst weiterhin entdecken.
            </div>
          </div>)}

        {/* ── FILTER SHEET — on demand ── */}
        {sheetOpen&&(
          <FilterSheet
            filter={filter} setFilter={setFilter}
            radiusStage={radiusStage} setRadiusStage={setRadiusStage}
            radius={radius} setRadius={setRadius}
            availability={availability} setAvailability={setAvailability}
            onClose={()=>setSheetOpen(false)}/>)}

        {/* ── DETAIL SHEET ── */}
        {selected&&(
          <DetailSheet pin={selected}
            onClose={()=>setSelected(null)}
            onBooking={p=>{onView&&onView(p);}}/>)}
      </div>
    </>
  );
}

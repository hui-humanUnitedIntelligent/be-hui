// LiveMapPage.jsx — HUI Discovery World v5
// Atmosphärisch · Emotional · Premium · Mobile First
// Keine UI-Boxen über der Karte — alles verschmilzt

import React, { useState, useEffect, useRef, useCallback } from "react";

/* ── Brand ──────────────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7",
  tealGlow:"rgba(22,215,197,0.25)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.22)",
  gold:"#F5A623",  goldGlow:"rgba(245,166,35,0.22)",
  green:"#3DB87A", greenGlow:"rgba(61,184,122,0.22)",
  violet:"#9B72CF",violetGlow:"rgba(155,114,207,0.22)",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBBBBB",
  border:"rgba(0,0,0,0.06)",
};

/* ── CSS ─────────────────────────────────────────────── */
const CSS = `
  @keyframes floatBubble {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-4px); }
  }
  @keyframes ringPulse {
    0%   { transform:scale(1);    opacity:0.6; }
    60%  { transform:scale(1.65); opacity:0; }
    100% { transform:scale(1.65); opacity:0; }
  }
  @keyframes orbGlow {
    0%,100% { box-shadow:var(--orb-s0); }
    50%      { box-shadow:var(--orb-s1); }
  }
  @keyframes sheetUp {
    from { opacity:0; transform:translateY(28px) scale(0.98); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes breathe {
    0%,100% { opacity:0.7; transform:scale(1); }
    50%      { opacity:1;  transform:scale(1.15); }
  }
  @keyframes matchPulse {
    0%,100% { transform:translateY(0) scale(1);    box-shadow:0 6px 30px rgba(22,215,197,0.35); }
    50%      { transform:translateY(-3px) scale(1.03); box-shadow:0 10px 40px rgba(22,215,197,0.50); }
  }
  @keyframes shimmerSweep {
    0%   { transform:translateX(-130%); }
    55%  { transform:translateX(130%);  }
    100% { transform:translateX(130%);  }
  }
  @keyframes heatPulse {
    0%,100% { opacity:0.18; }
    50%     { opacity:0.32; }
  }
  @keyframes panelSlide {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .lm-scroll::-webkit-scrollbar { display:none; }
  .lm-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .lm-tap {
    -webkit-tap-highlight-color:transparent;
    transition:transform .2s cubic-bezier(.34,1.4,.64,1);
    cursor:pointer;
  }
  .lm-tap:active { transform:scale(0.95) !important; }
`;

/* ── Mock world data ─────────────────────────────────── */
const PINS = [
  {id:1,type:"wirker",name:"Lea Sommer",talent:"Fotografin",city:"München",
   lat:48.135,lng:11.582,
   img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=700&q=85",
   recs:34,available:true,hourly:85,
   bio:"Ich fange das Licht ein, bevor es verschwindet."},
  {id:2,type:"wirker",name:"Anna K.",talent:"Gartengestalterin",city:"München",
   lat:48.152,lng:11.536,
   img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=85",
   recs:43,available:true,hourly:75,
   bio:"Gärten sind lebendige Kunstwerke."},
  {id:3,type:"experience",name:"Walk & Think Session",creator:"Lars G.",city:"München",
   lat:48.142,lng:11.561,
   img:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=700&q=85",
   price:150,duration:"2 Std",
   bio:"Strategie-Spaziergang durch die Stadt. Ideen brauchen Luft."},
  {id:4,type:"werk",name:"Aquarell Original",creator:"Lena M.",city:"München",
   lat:48.128,lng:11.570,
   img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=85",
   price:120,category:"Kunst",
   bio:"Aquarell auf Archivpapier. Jedes Stück ein Original."},
  {id:5,type:"impact",name:"Stadtgärten als Begegnungsorte",city:"München",
   lat:48.160,lng:11.547,
   img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=85",
   raised:12800,goal:40000,
   bio:"Wo Erde wächst, wächst Gemeinschaft."},
  {id:6,type:"wirker",name:"David Weber",talent:"Keramikkünstler",city:"Hamburg",
   lat:53.558,lng:9.985,
   img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
   recs:19,available:true,hourly:65,
   bio:"Ton ist mein Medium — Stille ist meine Sprache."},
  {id:7,type:"experience",name:"Töpferkurs am See",creator:"David Weber",city:"Starnberg",
   lat:47.992,lng:11.353,
   img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
   price:85,duration:"3 Std",
   bio:"Töpfern am Ufer des Starnberger Sees."},
  {id:8,type:"wirker",name:"Marcus B.",talent:"Videograf",city:"Berlin",
   lat:52.518,lng:13.404,
   img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=700&q=85",
   recs:27,available:false,hourly:120,
   bio:"Bewegte Bilder, die bewegen."},
  {id:9,type:"werk",name:"Leder-Rucksack",creator:"Stefan K.",city:"Berlin",
   lat:52.505,lng:13.418,
   img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=85",
   price:195,category:"Mode",
   bio:"Vollnarbiges Vegetable-Tanned Leder. Auf Maß gefertigt."},
  {id:10,type:"wirker",name:"Nina B.",talent:"Yogalehrerin",city:"Stuttgart",
   lat:48.775,lng:9.182,
   img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=85",
   recs:61,available:true,hourly:55,
   bio:"Yoga ist keine Übung — es ist eine Art zu leben."},
  {id:11,type:"experience",name:"Yoga bei Sonnenaufgang",creator:"Nina B.",city:"Stuttgart",
   lat:48.784,lng:9.196,
   img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=85",
   price:35,duration:"75 Min",
   bio:"Morgen-Yoga im Park. Sonnenaufgang, Stille, Gemeinschaft."},
  {id:12,type:"impact",name:"Schutz der Meere",city:"Hamburg",
   lat:53.545,lng:9.960,
   img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=700&q=85",
   raised:36200,goal:80000,
   bio:"Wir schützen, was uns schützt."},
  {id:13,type:"wirker",name:"Felix M.",talent:"Gitarrenlehrer",city:"Frankfurt",
   lat:50.112,lng:8.683,
   img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85",
   recs:15,available:true,hourly:45,
   bio:"Musik verbindet — ich zeige dir den Einstieg."},
];

/* ── Tile — CartoDB Light (warmest, softest) ─────── */
const TILE = (x,y,z) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/${z}/${x}/${y}@2x.png`;

/* ── Lat/lng → pixel ─────────────────────────────── */
function latLngToXY(lat, lng, mapLat, mapLng, zoom, width, height) {
  const TILE_SIZE = 256;
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const toMerc = (la) => {
    const sin = Math.sin(la * Math.PI / 180);
    return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI));
  };
  const cx = (mapLng / 360 + 0.5) * scale;
  const cy = toMerc(mapLat) * scale;
  return {
    x: width/2  + ((lng / 360 + 0.5) * scale - cx),
    y: height/2 + (toMerc(lat) * scale - cy),
  };
}

/* ════════════════════════════════════════════════
   TILE CANVAS
════════════════════════════════════════════════ */
function TileCanvas({ mapLat, mapLng, zoom, width, height }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    const TILE_SIZE = 256;
    const scale = Math.pow(2, zoom);
    const totalPx = TILE_SIZE * scale;
    const toMerc = (la) => {
      const sin = Math.sin(la * Math.PI / 180);
      return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI));
    };
    const worldX = (mapLng / 360 + 0.5) * totalPx;
    const worldY = toMerc(mapLat) * totalPx;
    const originX = worldX - width / 2;
    const originY = worldY - height / 2;
    const tileX0 = Math.floor(originX / TILE_SIZE);
    const tileY0 = Math.floor(originY / TILE_SIZE);
    const tileX1 = Math.ceil((originX + width)  / TILE_SIZE);
    const tileY1 = Math.ceil((originY + height) / TILE_SIZE);
    const maxTile = scale - 1;
    for (let tx = tileX0; tx <= tileX1; tx++) {
      for (let ty = tileY0; ty <= tileY1; ty++) {
        const px = tx * TILE_SIZE - originX;
        const py = ty * TILE_SIZE - originY;
        const cx2 = ((tx % scale) + scale) % scale;
        const cy2 = ((ty % scale) + scale) % scale;
        if (cy2 > maxTile) continue;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = "rgba(249,246,242,0.18)";
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        };
        img.src = TILE(cx2, cy2, zoom);
      }
    }
  }, [mapLat, mapLng, zoom, width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position:"absolute", inset:0,
        filter:"saturate(0.65) brightness(1.06) contrast(0.86) sepia(0.08)" }}/>
  );
}

/* ════════════════════════════════════════════════
   ENERGY ORB — living marker
════════════════════════════════════════════════ */
function EnergyOrb({ pin, x, y, onClick, isSelected }) {
  const isWirker     = pin.type === "wirker";
  const isWerk       = pin.type === "werk";
  const isExperience = pin.type === "experience";
  const isImpact     = pin.type === "impact";

  const accent = isWirker ? C.teal
    : isWerk       ? C.coral
    : isExperience ? C.violet
    : C.green;

  const sz = isWirker ? 60 : isImpact ? 52 : 48;
  const aDelay = `${(pin.id * 1.1) % 3.5}s`;
  const fDelay  = `${(pin.id * 0.9) % 3}s`;

  return (
    <div data-bubble="1"
      onClick={() => onClick(pin)}
      className="lm-tap"
      style={{
        position:"absolute",
        left: x - sz/2 - 10,
        top:  y - sz/2 - 10,
        width: sz + 20, height: sz + 20,
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex: isSelected ? 60 : isWirker ? 30 : 20,
        animation:`floatBubble ${3+(pin.id%3)}s ${fDelay} ease-in-out infinite`,
      }}>

      {/* Expanding ring */}
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        border:`1.5px solid ${accent}`,
        animation:`ringPulse ${3+(pin.id%2)*0.8}s ${aDelay} ease-out infinite`,
        pointerEvents:"none",
      }}/>

      {/* Selected glow */}
      {isSelected && (
        <div style={{
          position:"absolute", inset:-6, borderRadius:"50%",
          background:`radial-gradient(circle,${accent}50 0%,transparent 68%)`,
          pointerEvents:"none",
        }}/>
      )}

      {/* Orb body */}
      <div style={{
        width:sz, height:sz, borderRadius:"50%",
        overflow:"hidden", flexShrink:0, position:"relative",
        border:`2.5px solid ${isSelected ? accent : "rgba(255,255,255,0.95)"}`,
        "--orb-s0":`0 4px 18px rgba(0,0,0,0.14), 0 0 0 0 ${accent}40`,
        "--orb-s1":`0 6px 28px rgba(0,0,0,0.18), 0 0 0 8px ${accent}00`,
        animation:`orbGlow ${3.2+(pin.id%2)*0.6}s ${aDelay} ease-in-out infinite`,
        transition:"border-color .28s, transform .22s",
        transform: isSelected ? "scale(1.12)" : "scale(1)",
        background: isImpact
          ? `linear-gradient(135deg,${C.green},${C.teal})`
          : "white",
      }}>
        {/* Gradient sheen */}
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          background:`linear-gradient(135deg,${accent}35 0%,transparent 55%)`,
          zIndex:2, pointerEvents:"none",
        }}/>
        {isImpact ? (
          <div style={{ width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:sz*0.38, position:"relative", zIndex:3 }}>
            🌱
          </div>
        ) : (
          <img src={pin.img} alt={pin.name}
            style={{ position:"absolute", inset:0, width:"100%",
              height:"100%", objectFit:"cover",
              objectPosition: isWirker ? "top" : "center",
              filter:"brightness(0.88) saturate(1.1)" }}/>
        )}
      </div>

      {/* Available dot */}
      {isWirker && pin.available && (
        <div style={{
          position:"absolute", bottom:10, right:10,
          width:11, height:11, borderRadius:"50%",
          background:C.green, border:"2.5px solid white",
          boxShadow:`0 0 8px ${C.green}99`, zIndex:5,
        }}/>
      )}

      {/* Type accent line */}
      <div style={{
        position:"absolute", bottom:9, left:"22%", right:"22%",
        height:2.5, borderRadius:999,
        background:`linear-gradient(90deg,${accent}00,${accent},${accent}00)`,
        opacity: isSelected ? 1 : 0.55,
        transition:"opacity .28s",
        zIndex:5,
      }}/>
    </div>
  );
}

/* ════════════════════════════════════════════════
   DETAIL SHEET — cinematic
════════════════════════════════════════════════ */
function DetailSheet({ pin, onClose, onBooking }) {
  const isWirker     = pin.type === "wirker";
  const isWerk       = pin.type === "werk";
  const isExperience = pin.type === "experience";
  const isImpact     = pin.type === "impact";
  const accent = isWirker ? C.teal : isWerk ? C.coral
    : isExperience ? C.violet : C.green;
  const progress = isImpact ? Math.round((pin.raised/pin.goal)*100) : 0;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:"rgba(8,8,8,0.52)",
      backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
      animation:"fadeIn .22s ease" }}
      onClick={e => e.target===e.currentTarget && onClose()}>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.warm, borderRadius:"30px 30px 0 0",
        maxHeight:"84vh", display:"flex", flexDirection:"column",
        animation:"sheetUp .38s cubic-bezier(.22,1,.36,1) both",
        paddingBottom:"max(24px,env(safe-area-inset-bottom,24px))" }}>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 0" }}>
          <div style={{ width:44, height:4, borderRadius:999, background:"rgba(0,0,0,0.1)" }}/>
        </div>

        {/* Hero */}
        <div style={{ position:"relative", height:224,
          margin:"10px 16px 0", borderRadius:24, overflow:"hidden", flexShrink:0 }}>
          <img src={pin.bg} alt={pin.name}
            style={{ width:"100%", height:"100%", objectFit:"cover",
              objectPosition: isWirker ? "top center" : "center",
              filter:"brightness(0.70) saturate(1.1)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(to bottom,${accent}20 0%,transparent 40%,rgba(0,0,0,0.70) 100%)` }}/>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
            background:`linear-gradient(90deg,${accent},transparent)` }}/>

          {/* Close */}
          <button onClick={onClose}
            style={{ position:"absolute", top:12, right:12,
              width:32, height:32, borderRadius:"50%",
              background:"rgba(0,0,0,0.38)", backdropFilter:"blur(8px)",
              border:"1px solid rgba(255,255,255,0.22)",
              cursor:"pointer", color:"white", fontSize:12,
              display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>✕</button>

          {/* Badges */}
          {isWirker && pin.available && (
            <div style={{ position:"absolute", top:12, left:12,
              display:"flex", alignItems:"center", gap:5,
              background:"rgba(61,184,122,0.22)", backdropFilter:"blur(10px)",
              border:"1px solid rgba(61,184,122,0.38)",
              borderRadius:999, padding:"3px 10px" }}>
              <span style={{ width:5, height:5, borderRadius:"50%",
                background:C.green, display:"inline-block",
                animation:"breathe 2s ease-in-out infinite" }}/>
              <span style={{ fontSize:9, fontWeight:800, color:C.green }}>Verfügbar</span>
            </div>
          )}
          {isExperience && (
            <div style={{ position:"absolute", top:12, left:12,
              background:"rgba(0,0,0,0.30)", backdropFilter:"blur(8px)",
              borderRadius:999, padding:"3px 10px",
              fontSize:9, fontWeight:700, color:"white" }}>
              ⏱ {pin.duration}
            </div>
          )}

          {/* Avatar for wirker */}
          {isWirker && (
            <div style={{ position:"absolute", bottom:-24, left:24 }}>
              <img src={pin.img} alt={pin.name}
                style={{ width:52, height:52, borderRadius:"50%",
                  objectFit:"cover", border:"3px solid white",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.22)" }}/>
            </div>
          )}

          {/* Price */}
          {(isWerk||isExperience) && pin.price && (
            <div style={{ position:"absolute", bottom:12, right:12,
              background:"rgba(255,255,255,0.92)", backdropFilter:"blur(8px)",
              borderRadius:999, padding:"4px 13px",
              fontSize:12, fontWeight:900, color:C.ink }}>
              {isWerk ? `€ ${pin.price}` : `ab € ${pin.price}`}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="lm-scroll"
          style={{ flex:1, overflowY:"auto",
            padding: isWirker ? "36px 24px 16px" : "20px 24px 16px" }}>

          <div style={{ fontWeight:900, fontSize:22, color:C.ink,
            letterSpacing:-0.5, lineHeight:1.2, marginBottom:4 }}>
            {pin.name}
          </div>
          {isWirker && (
            <div style={{ fontSize:13, color:accent, fontWeight:700, marginBottom:4 }}>
              {pin.talent}
            </div>
          )}
          {(isWerk||isExperience) && (
            <div style={{ fontSize:12, color:C.teal, fontWeight:600, marginBottom:4 }}>
              {pin.creator} · {pin.city}
            </div>
          )}
          <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>📍 {pin.city}</div>

          <div style={{ fontSize:15, color:C.ink2, lineHeight:1.8,
            fontStyle:"italic", marginBottom:20 }}>
            „{pin.bio}"
          </div>

          {isWirker && (
            <div style={{ display:"flex", gap:12, marginBottom:20 }}>
              {[
                {val:`${pin.recs}`, label:"Empfehlungen", col:C.teal},
                {val:`€ ${pin.hourly}`, label:"Pro Stunde", col:C.coral},
              ].map((s,i) => (
                <div key={i} style={{ flex:1, textAlign:"center",
                  padding:"12px 10px", background:C.cream, borderRadius:18,
                  border:`1px solid ${C.border}` }}>
                  <div style={{ fontWeight:900, fontSize:17, color:s.col }}>{s.val}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {isImpact && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontWeight:800, fontSize:16, color:C.green }}>
                  € {new Intl.NumberFormat("de-DE").format(pin.raised)}
                </span>
                <span style={{ fontSize:12, color:C.muted }}>{progress}% erreicht</span>
              </div>
              <div style={{ height:6, borderRadius:999,
                background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:999,
                  width:`${progress}%`,
                  background:`linear-gradient(90deg,${C.green},${C.teal})` }}/>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding:"0 24px", flexShrink:0 }}>
          <button className="lm-tap"
            onClick={() => { onClose(); onBooking && onBooking(pin); }}
            style={{ width:"100%", padding:"16px",
              background:`linear-gradient(135deg,${accent},${
                isWirker?C.coral:isImpact?C.teal:accent+"AA"})`,
              border:"none", borderRadius:20, fontSize:15,
              fontWeight:900, color:"white", cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:`0 6px 24px ${isWirker?C.tealGlow:isWerk?C.coralGlow:isImpact?C.greenGlow:C.goldGlow}` }}>
            {isWirker?"✨ Anfragen":isWerk?"🎨 Mehr entdecken":isExperience?"🌟 Erlebnis buchen":"🌱 Projekt ansehen"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   DISCOVERY PANEL — das Herz der Seite
════════════════════════════════════════════════ */
const STAGE_DEFS = [
  { stage:0, icon:"🌱", label:"Ganz nah",   km:"0–10 km",   sub:"Direkt bei dir",      max:10,  accent:C.green,  glow:C.greenGlow  },
  { stage:1, icon:"✨", label:"Lokal",       km:"10–50 km",  sub:"Deine Region",        max:50,  accent:C.teal,   glow:C.tealGlow   },
  { stage:2, icon:"🌍", label:"Offen",       km:"50–200 km", sub:"Neue kreative Energie",max:200, accent:C.coral,  glow:C.coralGlow  },
  { stage:3, icon:"🚀", label:"Grenzenlos",  km:"Global",    sub:"Weltweit verbinden",  max:9999,accent:C.violet, glow:C.violetGlow },
];

const AVAIL_OPTS = [
  { key:"alle",  label:"Alle" },
  { key:"aktiv", label:"🟢 Jetzt aktiv" },
  { key:"heute", label:"📅 Heute" },
  { key:"woche", label:"📆 Diese Woche" },
];

const FILTER_DEFS = [
  { key:"alle",       label:"✦ Alle",       accent:C.teal   },
  { key:"wirker",     label:"🤝 Menschen",  accent:C.teal   },
  { key:"werk",       label:"🎨 Werke",     accent:C.coral  },
  { key:"experience", label:"🌿 Erlebnisse",accent:C.violet },
  { key:"impact",     label:"🌍 Impact",    accent:C.green  },
];

function DiscoveryPanel({
  visible, pinCount, activeCount,
  filter, setFilter,
  radiusStage, setRadiusStage,
  radius, setRadius,
  availability, setAvailability,
  onMatch,
}) {
  const curStage = STAGE_DEFS[radiusStage];

  return (
    <div data-bubble="1"
      style={{ animation:"panelSlide .38s cubic-bezier(.22,1,.36,1) both" }}>

      {/* ── Header row ── */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ width:8, height:8, borderRadius:"50%",
            background:C.teal, display:"inline-block",
            boxShadow:`0 0 7px ${C.teal}`,
            animation:"breathe 3s ease-in-out infinite" }}/>
          <span style={{ fontWeight:800, fontSize:14, color:C.ink }}>
            München
          </span>
        </div>
        <span style={{ fontSize:11, fontWeight:700,
          color:C.teal, background:`${C.teal}14`,
          borderRadius:999, padding:"3px 10px" }}>
          {pinCount} kreative {pinCount===1?"Person":"Menschen"}
        </span>
      </div>

      {/* ── Search row ── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8,
          background:"rgba(255,255,255,0.65)",
          border:"1.5px solid rgba(255,255,255,0.80)",
          borderRadius:14, padding:"10px 14px" }}>
          <span style={{ fontSize:14, color:C.muted }}>🔍</span>
          <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>
            Wen oder was suchst du?
          </span>
        </div>
        <button data-bubble="1" className="lm-tap" onClick={onMatch}
          style={{ width:42, height:42, flexShrink:0,
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", borderRadius:14, fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 16px ${C.tealGlow}`,
            WebkitTapHighlightColor:"transparent", cursor:"pointer",
            overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.22) 50%,transparent 70%)",
            animation:"shimmerSweep 3.5s ease-in-out infinite",
            pointerEvents:"none" }}/>
          <span style={{ position:"relative" }}>✨</span>
        </button>
      </div>

      {/* ── Type filters ── */}
      <div className="lm-scroll"
        style={{ display:"flex", gap:6, overflowX:"auto",
          marginBottom:14, paddingBottom:2 }}>
        {FILTER_DEFS.map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} data-bubble="1" className="lm-tap"
              onClick={() => setFilter(f.key)}
              style={{ padding:"6px 13px", borderRadius:999, flexShrink:0,
                background: active
                  ? `linear-gradient(135deg,${f.accent}28,${f.accent}14)`
                  : "rgba(255,255,255,0.50)",
                border:`1.5px solid ${active ? f.accent+"66" : "rgba(255,255,255,0.55)"}`,
                fontSize:11, fontWeight: active ? 800 : 500,
                color: active ? f.accent : C.ink2,
                cursor:"pointer", fontFamily:"inherit",
                whiteSpace:"nowrap",
                boxShadow: active ? `0 2px 10px ${f.accent}33` : "none",
                transition:"all .2s" }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div style={{ height:1, background:"rgba(0,0,0,0.06)", marginBottom:13 }}/>

      {/* ── Radius question ── */}
      <div style={{ fontSize:10, fontWeight:800, color:C.muted,
        letterSpacing:1, textTransform:"uppercase", marginBottom:9 }}>
        Wie weit möchtest du entdecken?
      </div>

      {/* ── 4 stage cards — 2×2 grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:7, marginBottom:10 }}>
        {STAGE_DEFS.map(s => {
          const active = radiusStage === s.stage;
          return (
            <button key={s.stage} data-bubble="1" className="lm-tap"
              onClick={() => {
                setRadiusStage(s.stage);
                setRadius([10,50,200,500][s.stage]);
              }}
              style={{ padding:"9px 10px",
                background: active
                  ? `linear-gradient(135deg,${s.accent}22,${s.accent}0E)`
                  : "rgba(255,255,255,0.45)",
                border:`1.5px solid ${active ? s.accent+"66" : "rgba(255,255,255,0.50)"}`,
                borderRadius:14, cursor:"pointer",
                fontFamily:"inherit", textAlign:"left",
                boxShadow: active
                  ? `0 3px 14px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`
                  : "0 1px 4px rgba(0,0,0,0.04)",
                transform: active ? "scale(1.02)" : "scale(1)",
                transition:"all .22s cubic-bezier(.34,1.4,.64,1)",
                WebkitTapHighlightColor:"transparent" }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:4, marginBottom:2 }}>
                <span style={{ fontSize:13 }}>{s.icon}</span>
                <span style={{ fontWeight:800, fontSize:11,
                  color: active ? C.ink : C.ink2 }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize:10,
                color: active ? s.accent : C.muted, fontWeight: active?700:500 }}>
                {s.km}
              </div>
              <div style={{ fontSize:9, color:C.muted,
                marginTop:1, fontStyle:"italic" }}>
                {s.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Fine slider (hidden when Grenzenlos) ── */}
      {radiusStage < 3 && (
        <div data-bubble="1" style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:5 }}>
            <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>
              Genauer einstellen
            </span>
            <span style={{ fontSize:11, fontWeight:800, color:curStage.accent,
              background:`${curStage.accent}14`, borderRadius:999, padding:"1px 8px" }}>
              {radius} km
            </span>
          </div>
          <input type="range"
            min={[2,10,50,100][radiusStage]}
            max={[10,50,200,500][radiusStage]}
            step={radiusStage===0?1:5}
            value={radius}
            onChange={e => setRadius(+e.target.value)}
            data-bubble="1"
            style={{ width:"100%", accentColor:curStage.accent,
              cursor:"pointer", display:"block", height:4 }}/>
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height:1, background:"rgba(0,0,0,0.06)", marginBottom:11 }}/>

      {/* ── Availability chips ── */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {AVAIL_OPTS.map(a => (
          <button key={a.key} data-bubble="1" className="lm-tap"
            onClick={() => setAvailability(a.key)}
            style={{ padding:"5px 11px",
              background: availability===a.key
                ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                : "rgba(255,255,255,0.48)",
              border:`1px solid ${availability===a.key?"transparent":"rgba(255,255,255,0.55)"}`,
              borderRadius:999, fontSize:10,
              fontWeight: availability===a.key ? 800 : 500,
              color: availability===a.key ? "white" : C.muted,
              cursor:"pointer", fontFamily:"inherit",
              boxShadow: availability===a.key ? `0 2px 10px ${C.tealGlow}` : "none",
              transition:"all .18s",
              WebkitTapHighlightColor:"transparent" }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function LiveMapPage({ onView, onMatch, onClose, fullscreen }) {
  const [mapLat,      setMapLat]      = useState(48.142);
  const [mapLng,      setMapLng]      = useState(11.560);
  const [zoom,        setZoom]        = useState(12);
  const [size,        setSize]        = useState({ w:390, h:680 });
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState("alle");
  const [radiusStage, setRadiusStage] = useState(1);
  const [radius,      setRadius]      = useState(50);
  const [availability,setAvailability]= useState("alle");
  const [visible,     setVisible]     = useState(true);
  const [userLat,     setUserLat]     = useState(48.138);
  const [userLng,     setUserLng]     = useState(11.575);
  const [panelOpen,   setPanelOpen]   = useState(true);
  const [matchIdx,    setMatchIdx]    = useState(0);

  const containerRef = useRef(null);

  const MATCH_TEXTS = [
    "Kreative Energie finden",
    "Menschen entdecken",
    "Talente in deiner Nähe",
    "Passende Menschen",
  ];

  // Rotating match text
  useEffect(() => {
    const t = setInterval(() => setMatchIdx(i => (i+1)%4), 3400);
    return () => clearInterval(t);
  }, []);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(e => {
      const r = e[0].contentRect;
      setSize({ w:r.width, h:r.height });
    });
    obs.observe(el);
    setSize({ w:el.clientWidth, h:el.clientHeight });
    return () => obs.disconnect();
  }, []);

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setUserLat(pos.coords.latitude);
      setUserLng(pos.coords.longitude);
      setMapLat(pos.coords.latitude);
      setMapLng(pos.coords.longitude);
    }, ()=>{}, { timeout:5000 });
  }, []);

  // Drag to pan
  const drag = useRef({ active:false, startX:0, startY:0, startLat:0, startLng:0 });
  function onPointerDown(e) {
    if (e.target.closest("[data-bubble]")) return;
    drag.current = { active:true,
      startX:e.clientX, startY:e.clientY,
      startLat:mapLat, startLng:mapLng };
  }
  function onPointerMove(e) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const scale = Math.pow(2, zoom);
    const mpp = (40075016.686 * Math.cos(mapLat*Math.PI/180)) / (256*scale);
    setMapLat(drag.current.startLat  + (dy*mpp)/111320);
    setMapLng(drag.current.startLng  - (dx*mpp)/111320);
  }
  function onPointerUp() { drag.current.active = false; }

  // Filter pins
  const visiblePins = PINS.filter(p => {
    if (filter !== "alle" && p.type !== filter) return false;
    if (availability === "aktiv" && p.type === "wirker" && !p.available) return false;
    if (availability === "heute" && p.type === "experience" && !p.available) return false;
    return true;
  });
  const activeCount = visiblePins.filter(p => p.available).length;

  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          position: fullscreen ? "fixed" : "relative",
          inset: fullscreen ? 0 : "auto",
          zIndex: fullscreen ? 400 : "auto",
          width:"100%", height: fullscreen ? "100dvh" : "100%",
          background:C.cream, overflow:"hidden",
        }}
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}>

        {/* ── MAP CANVAS ── */}
        <TileCanvas mapLat={mapLat} mapLng={mapLng}
          zoom={zoom} width={size.w} height={size.h}/>

        {/* Atmospheric vignette */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse at 50% 40%,
            transparent 38%, rgba(8,4,0,0.22) 100%)` }}/>

        {/* Soft cream overlay — makes map feel like canvas */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background:"rgba(249,246,242,0.08)" }}/>

        {/* ── ENERGY HEATMAP ── */}
        {[
          {lat:48.142, lng:11.565, color:C.teal,  r:100, opacity:0.08},
          {lat:48.150, lng:11.538, color:C.coral,  r:75,  opacity:0.06},
          {lat:48.130, lng:11.575, color:C.gold,   r:65,  opacity:0.05},
        ].map((z,i) => {
          const {x:zx, y:zy} = latLngToXY(z.lat, z.lng, mapLat, mapLng, zoom, size.w, size.h);
          return (
            <div key={i} style={{ position:"absolute",
              left:zx-z.r, top:zy-z.r,
              width:z.r*2, height:z.r*2, borderRadius:"50%",
              background:`radial-gradient(circle,${z.color} 0%,transparent 70%)`,
              opacity:z.opacity,
              animation:`heatPulse ${4+i}s ${i*1.3}s ease-in-out infinite`,
              pointerEvents:"none", mixBlendMode:"multiply" }}/>
          );
        })}

        {/* ── ORBS ── */}
        {visiblePins.map(pin => {
          const {x,y} = latLngToXY(pin.lat, pin.lng, mapLat, mapLng, zoom, size.w, size.h);
          if (x < -90 || x > size.w+90 || y < -90 || y > size.h+90) return null;
          return (
            <div key={pin.id} data-bubble="1"
              style={{ position:"absolute", left:0, top:0, pointerEvents:"auto" }}>
              <EnergyOrb pin={pin} x={x} y={y}
                onClick={p => setSelected(p)}
                isSelected={selected?.id === pin.id}/>
            </div>
          );
        })}

        {/* ── USER DOT ── */}
        {(() => {
          const {x,y} = latLngToXY(userLat, userLng, mapLat, mapLng, zoom, size.w, size.h);
          return (
            <div style={{ position:"absolute", left:x-10, top:y-10,
              width:20, height:20, pointerEvents:"none" }}>
              <div style={{ position:"absolute", inset:-8, borderRadius:"50%",
                background:`rgba(22,215,197,0.18)`,
                animation:"orbGlow 2.4s ease-in-out infinite",
                "--orb-s0":"0 0 0 0 rgba(22,215,197,0.28)",
                "--orb-s1":"0 0 0 16px rgba(22,215,197,0)" }}/>
              <div style={{ width:"100%", height:"100%", borderRadius:"50%",
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                border:"3px solid white",
                boxShadow:`0 0 0 2px ${C.teal}, 0 4px 12px rgba(0,0,0,0.22)` }}/>
            </div>
          );
        })()}

        {/* ── TOP LEFT — close + privacy ── */}
        <div style={{ position:"absolute",
          top:"max(52px,env(safe-area-inset-top,52px))",
          left:16, display:"flex", gap:8, pointerEvents:"auto" }}>
          {onClose && (
            <button onClick={onClose} data-bubble="1"
              style={{ width:42, height:42, borderRadius:14,
                background:"rgba(252,250,247,0.85)",
                backdropFilter:"blur(18px)",
                border:"1px solid rgba(255,255,255,0.65)",
                boxShadow:"0 4px 16px rgba(0,0,0,0.10)",
                cursor:"pointer", fontSize:15, color:C.muted,
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>✕</button>
          )}
          <button onClick={() => setVisible(v=>!v)} data-bubble="1"
            style={{ width:42, height:42, borderRadius:14,
              background: visible
                ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                : "rgba(252,250,247,0.85)",
              backdropFilter:"blur(18px)",
              border:"1px solid rgba(255,255,255,0.65)",
              boxShadow:`0 4px 16px ${visible?C.tealGlow:"rgba(0,0,0,0.10)"}`,
              cursor:"pointer", fontSize:16,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .28s",
              WebkitTapHighlightColor:"transparent" }}>
            {visible ? "👁" : "🙈"}
          </button>
        </div>

        {/* ── ZOOM — right center ── */}
        <div style={{ position:"absolute", right:14, top:"50%",
          transform:"translateY(-50%)",
          display:"flex", flexDirection:"column", gap:8, pointerEvents:"auto" }}>
          {[{l:"+",d:1},{l:"−",d:-1}].map(b => (
            <button key={b.l} data-bubble="1"
              onClick={() => setZoom(z => Math.min(16, Math.max(8, z+b.d)))}
              style={{ width:38, height:38,
                background:"rgba(252,250,247,0.88)",
                backdropFilter:"blur(16px)",
                border:"1px solid rgba(255,255,255,0.65)",
                borderRadius:13, fontSize:18, fontWeight:700,
                color:C.ink2, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 3px 12px rgba(0,0,0,0.09)",
                WebkitTapHighlightColor:"transparent" }}>
              {b.l}
            </button>
          ))}
        </div>

        {/* ── DISCOVERY PANEL — bottom ── */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          padding:"0 12px max(16px,env(safe-area-inset-bottom,16px))",
          pointerEvents:"none" }}>

          {/* Panel card */}
          {panelOpen && (
            <div data-bubble="1"
              style={{ pointerEvents:"auto", marginBottom:10,
                background:"rgba(252,250,247,0.88)",
                backdropFilter:"blur(28px) saturate(1.8)",
                WebkitBackdropFilter:"blur(28px) saturate(1.8)",
                border:"1px solid rgba(255,255,255,0.72)",
                borderRadius:26,
                boxShadow:"0 8px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.8)",
                padding:"18px 16px 14px",
                maxHeight:"62vh", overflowY:"auto" }}
              className="lm-scroll">
              <DiscoveryPanel
                visible={visible}
                pinCount={visiblePins.length}
                activeCount={activeCount}
                filter={filter}           setFilter={setFilter}
                radiusStage={radiusStage} setRadiusStage={setRadiusStage}
                radius={radius}           setRadius={setRadius}
                availability={availability} setAvailability={setAvailability}
                onMatch={onMatch}
              />
            </div>
          )}

          {/* ── FLOATING MATCH ORB — bottom center ── */}
          <div style={{ display:"flex", justifyContent:"center",
            alignItems:"center", gap:10 }}>

            {/* Panel toggle pill */}
            <button data-bubble="1" className="lm-tap"
              onClick={() => setPanelOpen(o => !o)}
              style={{ padding:"10px 16px",
                background:"rgba(252,250,247,0.88)",
                backdropFilter:"blur(18px)",
                border:"1px solid rgba(255,255,255,0.65)",
                borderRadius:999, fontSize:11, fontWeight:700,
                color:C.ink2, cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 4px 14px rgba(0,0,0,0.10)",
                WebkitTapHighlightColor:"transparent",
                pointerEvents:"auto", flexShrink:0 }}>
              {panelOpen ? "⌄ Weniger" : "⌃ Entdecken"}
            </button>

            {/* Match orb */}
            <button data-bubble="1" className="lm-tap"
              onClick={onMatch}
              style={{ padding:"12px 22px",
                background:`linear-gradient(135deg,${C.teal}F2,${C.coral}E8)`,
                border:"none", borderRadius:999,
                fontSize:13, fontWeight:800, color:"white",
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:`0 6px 30px ${C.tealGlow}, 0 0 0 1px rgba(255,255,255,0.2) inset`,
                animation:"matchPulse 3.6s ease-in-out infinite",
                display:"flex", alignItems:"center", gap:7,
                overflow:"hidden", position:"relative",
                WebkitTapHighlightColor:"transparent",
                pointerEvents:"auto", flexShrink:0 }}>
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(105deg,transparent 32%,rgba(255,255,255,0.2) 50%,transparent 68%)",
                animation:"shimmerSweep 4s ease-in-out infinite",
                pointerEvents:"none" }}/>
              <span style={{ position:"relative", fontSize:14 }}>✨</span>
              <span style={{ position:"relative" }}>{MATCH_TEXTS[matchIdx]}</span>
            </button>
          </div>
        </div>

        {/* ── INVISIBLE OVERLAY when panel closed ── */}
        {!visible && (
          <div style={{ position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            background:"rgba(252,250,247,0.92)",
            backdropFilter:"blur(20px)",
            border:"1px solid rgba(255,255,255,0.70)",
            borderRadius:24, padding:"22px 30px",
            textAlign:"center", maxWidth:260,
            boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
            pointerEvents:"none",
            animation:"sheetUp .3s ease both" }}>
            <div style={{ fontSize:30, marginBottom:8 }}>🙈</div>
            <div style={{ fontWeight:800, fontSize:15, color:C.ink, marginBottom:4 }}>
              Du bist unsichtbar
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>
              Andere sehen dich nicht.<br/>Du kannst weiterhin entdecken.
            </div>
          </div>
        )}

        {/* ── DETAIL SHEET ── */}
        {selected && (
          <DetailSheet
            pin={selected}
            onClose={() => setSelected(null)}
            onBooking={p => { onView && onView(p); }}
          />
        )}
      </div>
    </>
  );
}

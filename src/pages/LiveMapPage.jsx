// LiveMapPage.jsx — HUI Live Map Experience
// A living discovery world — not a technical map
import React, { useState, useEffect, useRef, useCallback } from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.28)",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  gold:"#F5A623", goldGlow:"rgba(245,166,35,0.28)",
  green:"#3DB87A", greenGlow:"rgba(61,184,122,0.28)",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB", border:"rgba(0,0,0,0.06)",
};

/* ── Mock world data ────────────────────────── */
const PINS = [
  // Munich cluster
  {id:1,type:"wirker",name:"Lea Sommer",talent:"Fotografin",city:"München",
   lat:48.135,lng:11.582,
   img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=85",
   recs:34,available:true,hourly:85,
   bio:"Ich fange das Licht ein, bevor es verschwindet."},
  {id:2,type:"wirker",name:"Anna K.",talent:"Gartengestalterin",city:"München",
   lat:48.152,lng:11.536,
   img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=85",
   recs:43,available:true,hourly:75,
   bio:"Gärten sind lebendige Kunstwerke."},
  {id:3,type:"experience",name:"Walk & Think Session",creator:"Lars G.",city:"München",
   lat:48.142,lng:11.561,
   img:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=600&q=85",
   price:150,duration:"2 Std",
   bio:"Strategie-Spaziergang durch die Stadt. Ideen brauchen Luft."},
  {id:4,type:"werk",name:"Aquarell Original",creator:"Lena M.",city:"München",
   lat:48.128,lng:11.570,
   img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=85",
   price:120,category:"Kunst",
   bio:"Aquarell auf Archivpapier. Jedes Stück ein Original."},
  {id:5,type:"impact",name:"Stadtgärten als Begegnungsorte",city:"München",
   lat:48.160,lng:11.547,
   img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=85",
   raised:12800,goal:40000,
   bio:"Wo Erde wächst, wächst Gemeinschaft."},
  // Hamburg cluster
  {id:6,type:"wirker",name:"David Weber",talent:"Keramikkünstler",city:"Hamburg",
   lat:53.558,lng:9.985,
   img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=85",
   recs:19,available:true,hourly:65,
   bio:"Ton ist mein Medium — Stille ist meine Sprache."},
  {id:7,type:"experience",name:"Töpferkurs am See",creator:"David Weber",city:"Starnberg",
   lat:47.992,lng:11.353,
   img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=85",
   price:85,duration:"3 Std",
   bio:"Töpfern am Ufer des Starnberger Sees. Natur und Handwerk."},
  // Berlin cluster
  {id:8,type:"wirker",name:"Marcus B.",talent:"Videograf",city:"Berlin",
   lat:52.518,lng:13.404,
   img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=600&q=85",
   recs:27,available:false,hourly:120,
   bio:"Bewegte Bilder, die bewegen."},
  {id:9,type:"werk",name:"Leder-Rucksack",creator:"Stefan K.",city:"Berlin",
   lat:52.505,lng:13.418,
   img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=85",
   price:195,category:"Mode",
   bio:"Vollnarbiges Vegetable-Tanned Leder. Auf Maß gefertigt."},
  // Stuttgart
  {id:10,type:"wirker",name:"Nina B.",talent:"Yogalehrerin",city:"Stuttgart",
   lat:48.775,lng:9.182,
   img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=85",
   recs:61,available:true,hourly:55,
   bio:"Yoga ist keine Übung — es ist eine Art zu leben."},
  {id:11,type:"experience",name:"Yoga bei Sonnenaufgang",creator:"Nina B.",city:"Stuttgart",
   lat:48.784,lng:9.196,
   img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=85",
   price:35,duration:"75 Min",
   bio:"Morgen-Yoga im Park. Sonnenaufgang, Stille, Gemeinschaft."},
  {id:12,type:"impact",name:"Schutz der Meere",city:"Hamburg",
   lat:53.545,lng:9.960,
   img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&q=85",
   raised:36200,goal:80000,
   bio:"Wir schützen, was uns schützt."},
  // Frankfurt
  {id:13,type:"wirker",name:"Felix M.",talent:"Gitarrenlehrer",city:"Frankfurt",
   lat:50.112,lng:8.683,
   img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=85",
   bg:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=85",
   recs:15,available:true,hourly:45,
   bio:"Musik verbindet — ich zeige dir den Einstieg."},
];

/* ── Tile URL — CartoDB Voyager (warm, clean) ── */
// Using OpenStreetMap tiles rendered by CartoDB — warm, minimal
const TILE = (x,y,z) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`;

/* ── Lat/lng → pixel math ────────────────────── */
function latLngToXY(lat, lng, mapLat, mapLng, zoom, width, height) {
  const TILE_SIZE = 256;
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const toMerc = (lat) => {
    const sin = Math.sin(lat * Math.PI / 180);
    return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI));
  };
  const cx = (mapLng / 360 + 0.5) * scale;
  const cy = toMerc(mapLat) * scale;
  const px = (lng / 360 + 0.5) * scale;
  const py = toMerc(lat) * scale;
  return {
    x: width/2  + (px - cx),
    y: height/2 + (py - cy),
  };
}

/* ── CSS ─────────────────────────────────────── */
const CSS = `
  @keyframes bubblePulse {
    0%,100% { transform:scale(1); box-shadow: var(--bubble-glow-0); }
    50%      { transform:scale(1.06); box-shadow: var(--bubble-glow-1); }
  }
  @keyframes impactGlow {
    0%,100% { box-shadow: 0 0 0 0 var(--impact-color), 0 4px 20px rgba(0,0,0,0.18); }
    60%      { box-shadow: 0 0 0 14px rgba(245,166,35,0), 0 4px 20px rgba(0,0,0,0.18); }
  }
  @keyframes sheetUp {
    from { transform:translateY(100%); opacity:0; }
    to   { transform:translateY(0);    opacity:1; }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes floatBubble {
    0%,100% { transform:translateY(0px); }
    50%      { transform:translateY(-4px); }
  }
  @keyframes breathe {
    0%,100% { opacity:0.75; transform:scale(1); }
    50%      { opacity:1;   transform:scale(1.05); }
  }
  .lm-scroll::-webkit-scrollbar { display:none; }
  .lm-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .lm-tap { transition:transform 0.18s cubic-bezier(0.34,1.4,0.64,1); -webkit-tap-highlight-color:transparent; }
  .lm-tap:active { transform:scale(0.94); }
  @keyframes orbGlow {
    0%,100% { box-shadow: 0 0 0 0 var(--orb-color), 0 6px 24px rgba(0,0,0,0.18); }
    50%      { box-shadow: 0 0 0 10px rgba(0,0,0,0), 0 8px 32px rgba(0,0,0,0.22); }
  }
  @keyframes ringPulse {
    0%   { transform:scale(1);   opacity:0.55; }
    60%  { transform:scale(1.55);opacity:0; }
    100% { transform:scale(1.55);opacity:0; }
  }
  @keyframes matchText {
    0%,18%  { opacity:1; transform:translateY(0); }
    22%,98% { opacity:0; transform:translateY(-8px); }
    100%    { opacity:1; transform:translateY(0); }
  }
  @keyframes heatPulse {
    0%,100% { opacity:0.22; }
    50%     { opacity:0.38; }
  }
  @keyframes slideCard {
    from { opacity:0; transform:translateY(24px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes shimmerSweep {
    0%   { transform:translateX(-120%); }
    60%  { transform:translateX(120%); }
    100% { transform:translateX(120%); }
  }
`;

/* ════════════════════════════════════════════
   DETAIL SHEET — cinematic preview
════════════════════════════════════════════ */
function DetailSheet({ pin, onClose, onBooking }) {
  const isWirker     = pin.type === "wirker";
  const isWerk       = pin.type === "werk";
  const isExperience = pin.type === "experience";
  const isImpact     = pin.type === "impact";

  const accent = isWirker ? C.teal : isWerk ? C.coral
    : isExperience ? C.gold : C.green;

  const progress = isImpact
    ? Math.round((pin.raised / pin.goal) * 100) : 0;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500,
      background:"rgba(10,10,10,0.48)",
      backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.warm, borderRadius:"28px 28px 0 0",
        maxHeight:"82vh", display:"flex", flexDirection:"column",
        animation:"sheetUp 0.36s cubic-bezier(0.22,1,0.36,1) both",
        paddingBottom:"max(24px,env(safe-area-inset-bottom))" }}>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center",
          padding:"14px 0 0", flexShrink:0 }}>
          <div style={{ width:44, height:4, borderRadius:999,
            background:"rgba(0,0,0,0.10)" }}/>
        </div>

        {/* Hero image */}
        <div style={{ position:"relative", height:220,
          margin:"10px 16px 0", borderRadius:22, overflow:"hidden",
          flexShrink:0 }}>
          <img src={pin.bg} alt={pin.name}
            style={{ width:"100%", height:"100%", objectFit:"cover",
              objectPosition: isWirker ? "top center" : "center",
              filter:"brightness(0.72) saturate(1.1)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(to bottom,
              ${accent}18 0%, transparent 35%,
              rgba(0,0,0,0.68) 100%)` }}/>
          {/* Accent strip */}
          <div style={{ position:"absolute", top:0, left:0, right:0,
            height:3, background:`linear-gradient(90deg,${accent},transparent)` }}/>
          {/* Close */}
          <button onClick={onClose}
            style={{ position:"absolute", top:12, right:12,
              width:32, height:32, borderRadius:"50%",
              background:"rgba(0,0,0,0.35)", backdropFilter:"blur(8px)",
              border:"1px solid rgba(255,255,255,0.22)",
              cursor:"pointer", color:"white", fontSize:12,
              display:"flex", alignItems:"center",
              justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>✕</button>
          {/* Type badge */}
          {isWirker && pin.available && (
            <div style={{ position:"absolute", top:12, left:12,
              display:"flex", alignItems:"center", gap:5,
              background:"rgba(61,184,122,0.22)", backdropFilter:"blur(8px)",
              border:"1px solid rgba(61,184,122,0.35)",
              borderRadius:999, padding:"3px 10px" }}>
              <span style={{ width:5, height:5, borderRadius:"50%",
                background:C.green, display:"inline-block" }}/>
              <span style={{ fontSize:9, fontWeight:700, color:C.green }}>Verfügbar</span>
            </div>
          )}
          {isExperience && (
            <div style={{ position:"absolute", top:12, left:12 }}>
              <div style={{ background:"rgba(245,166,35,0.22)",
                backdropFilter:"blur(8px)",
                border:"1px solid rgba(245,166,35,0.35)",
                borderRadius:999, padding:"3px 10px",
                fontSize:9, fontWeight:700, color:C.gold }}>
                ⏱ {pin.duration}
              </div>
            </div>
          )}
          {/* Profile img for wirker */}
          {isWirker && (
            <div style={{ position:"absolute", bottom:-24, left:24 }}>
              <img src={pin.img} alt={pin.name}
                style={{ width:52, height:52, borderRadius:"50%",
                  objectFit:"cover", border:"3px solid white",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.22)" }}/>
            </div>
          )}
          {/* Price for werk/experience */}
          {(isWerk||isExperience) && pin.price && (
            <div style={{ position:"absolute", bottom:12, right:12 }}>
              <div style={{ background:"rgba(255,255,255,0.92)",
                backdropFilter:"blur(8px)",
                borderRadius:999, padding:"4px 13px",
                fontSize:12, fontWeight:900, color:C.ink }}>
                {isWerk ? `€ ${pin.price}` : `ab € ${pin.price}`}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="lm-scroll"
          style={{ flex:1, overflowY:"auto",
            padding: isWirker ? "36px 24px 16px" : "20px 24px 16px" }}>

          <div style={{ fontWeight:900, fontSize:21, color:C.ink,
            letterSpacing:-0.5, marginBottom:4 }}>
            {pin.name}
          </div>

          {isWirker && (
            <div style={{ fontSize:13, color:accent,
              fontWeight:700, marginBottom:4 }}>{pin.talent}</div>
          )}
          {(isWerk||isExperience) && (
            <div style={{ fontSize:12, color:C.teal,
              fontWeight:600, marginBottom:4 }}>
              {pin.creator} · {pin.city}
            </div>
          )}
          <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>
            📍 {pin.city}
          </div>

          <div style={{ fontSize:15, color:C.ink2, lineHeight:1.80,
            fontStyle:"italic", marginBottom:20 }}>
            „{pin.bio}"
          </div>

          {/* Wirker stats */}
          {isWirker && (
            <div style={{ display:"flex", gap:16, marginBottom:20 }}>
              {[
                {val:`${pin.recs}`,  label:"Empfehlungen", col:C.teal},
                {val:`€ ${pin.hourly}`,label:"Pro Std",      col:C.coral},
              ].map((s,i) => (
                <div key={i} style={{ flex:1, textAlign:"center",
                  padding:"10px", background:C.cream,
                  borderRadius:16 }}>
                  <div style={{ fontWeight:900, fontSize:16,
                    color:s.col }}>{s.val}</div>
                  <div style={{ fontSize:10, color:C.muted,
                    marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Impact progress */}
          {isImpact && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                marginBottom:8 }}>
                <span style={{ fontWeight:800, fontSize:16,
                  color:C.green }}>
                  € {new Intl.NumberFormat("de-DE").format(pin.raised)}
                </span>
                <span style={{ fontSize:12, color:C.muted }}>
                  {progress}% erreicht
                </span>
              </div>
              <div style={{ height:6, borderRadius:999,
                background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:999,
                  width:`${progress}%`,
                  background:`linear-gradient(90deg,${C.green},${C.teal})`,
                  boxShadow:`0 0 8px ${C.greenGlow}` }}/>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding:"0 24px", flexShrink:0 }}>
          <button onClick={() => { onClose(); onBooking && onBooking(pin); }}
            style={{ width:"100%", padding:"16px",
              background:`linear-gradient(135deg,${accent},${
                isWirker?C.coral:isImpact?C.teal:accent+"BB"})`,
              border:"none", borderRadius:18, fontSize:15,
              fontWeight:900, color:"white", cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:`0 6px 24px ${
                isWirker?C.tealGlow:isWerk?"rgba(255,138,107,0.30)":
                isImpact?C.greenGlow:C.goldGlow}`,
              WebkitTapHighlightColor:"transparent" }}>
            {isWirker     ? "Anfragen"
             :isWerk      ? "Mehr entdecken"
             :isExperience? "Erlebnis buchen"
             :              "Projekt ansehen"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BUBBLE — the living map marker
════════════════════════════════════════════ */
function Bubble({ pin, x, y, onClick, isSelected }) {
  const isWirker     = pin.type === "wirker";
  const isWerk       = pin.type === "werk";
  const isExperience = pin.type === "experience";
  const isImpact     = pin.type === "impact";

  const accent = isWirker ? C.teal
    : isWerk       ? C.coral
    : isExperience ? "#9B72CF"   // violet for experiences
    : C.green;

  const orbSize   = isWirker ? 58 : isImpact ? 50 : 46;
  const animDelay = `${(pin.id * 1.3) % 4}s`;
  const floatDelay= `${(pin.id * 0.7) % 3}s`;
  const glowDur   = 2.8 + (pin.id % 3) * 0.7;

  return (
    <div
      data-bubble="1"
      onClick={() => onClick(pin)}
      style={{
        position:"absolute",
        left: x - orbSize/2 - 8,
        top:  y - orbSize/2 - 8,
        width: orbSize + 16, height: orbSize + 16,
        cursor:"pointer",
        zIndex: isSelected ? 50 : isWirker ? 30 : isImpact ? 25 : 20,
        animation:`floatBubble ${3 + (pin.id%3)}s ${floatDelay} ease-in-out infinite`,
        WebkitTapHighlightColor:"transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>

      {/* Expanding ring pulse */}
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        border:`1.5px solid ${accent}`,
        animation:`ringPulse ${glowDur}s ${animDelay} ease-out infinite`,
        pointerEvents:"none",
      }}/>

      {/* Selected outer glow */}
      {isSelected && (
        <div style={{
          position:"absolute", inset:-4, borderRadius:"50%",
          background:`radial-gradient(circle,${accent}40 0%,transparent 70%)`,
          pointerEvents:"none",
        }}/>
      )}

      {/* Main orb */}
      <div style={{
        width: orbSize, height: orbSize,
        borderRadius:"50%", overflow:"hidden",
        flexShrink:0,
        border:`2.5px solid ${isSelected ? accent : "rgba(255,255,255,0.92)"}`,
        boxShadow:`
          0 4px 18px rgba(0,0,0,0.16),
          0 0 0 ${isSelected ? 3 : 0}px ${accent}55,
          inset 0 1px 2px rgba(255,255,255,0.6)
        `,
        "--orb-color": `${accent}55`,
        animation:`orbGlow ${glowDur}s ${animDelay} ease-in-out infinite`,
        transition:"border-color 0.28s, box-shadow 0.28s",
        background: isImpact
          ? `linear-gradient(135deg,${C.green}CC,${C.teal}CC)`
          : isWerk
            ? `linear-gradient(135deg,${C.coral}22,${C.gold}22)`
            : "white",
        position:"relative",
      }}>
        {/* Gradient overlay ring inside */}
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          background:`linear-gradient(135deg,${accent}30 0%,transparent 60%)`,
          zIndex:2, pointerEvents:"none",
        }}/>
        {isImpact ? (
          <div style={{ width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize: orbSize * 0.4 }}>
            🌱
          </div>
        ) : (
          <img src={pin.img} alt={pin.name}
            style={{ width:"100%", height:"100%",
              objectFit:"cover",
              objectPosition: isWirker ? "top" : "center",
              filter:"brightness(0.90) saturate(1.12)" }}/>
        )}
      </div>

      {/* Available dot */}
      {isWirker && pin.available && (
        <div style={{
          position:"absolute", bottom:10, right:10,
          width:11, height:11, borderRadius:"50%",
          background:C.green,
          border:"2.5px solid white",
          boxShadow:`0 0 8px ${C.green}88`,
          zIndex:5,
        }}/>
      )}

      {/* Category glow strip */}
      <div style={{
        position:"absolute", bottom:8, left:"20%", right:"20%",
        height:2.5, borderRadius:999,
        background:`linear-gradient(90deg,${accent}00,${accent},${accent}00)`,
        opacity: isSelected ? 1 : 0.6,
        transition:"opacity 0.3s",
        zIndex:5,
      }}/>
    </div>
  );
}

/* ════════════════════════════════════════════
   TILECANVAS — render slippy map tiles
════════════════════════════════════════════ */
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

    const toMerc = (lat) => {
      const sin = Math.sin(lat * Math.PI / 180);
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

    const cache = {};
    for (let tx = tileX0; tx <= tileX1; tx++) {
      for (let ty = tileY0; ty <= tileY1; ty++) {
        const px = tx * TILE_SIZE - originX;
        const py = ty * TILE_SIZE - originY;
        const cx = ((tx % scale) + scale) % scale;
        const cy = ((ty % scale) + scale) % scale;
        if (cy > maxTile) continue;
        const url = TILE(cx, cy, zoom);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
          // Warm cream tint
          ctx.fillStyle = "rgba(249,246,242,0.14)";
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        };
        img.src = url;
      }
    }
  }, [mapLat, mapLng, zoom, width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position:"absolute", inset:0,
        filter:"saturate(0.72) brightness(1.04) contrast(0.88) hue-rotate(12deg) sepia(0.06)" }}/>
  );
}

/* ════════════════════════════════════════════
   MAIN LIVE MAP PAGE
════════════════════════════════════════════ */
export default function LiveMapPage({ onView, onMatch, onClose, fullscreen }) {
  // Map state — centered on Munich
  const [mapLat,  setMapLat]  = useState(48.142);
  const [mapLng,  setMapLng]  = useState(11.560);
  const [zoom,    setZoom]    = useState(12);
  const [size,    setSize]    = useState({ w:390, h:680 });
  const [selected,setSelected]= useState(null);
  const [filter,  setFilter]  = useState("alle");
  const [radius,  setRadius]  = useState(50);
  const [visible, setVisible]       = useState(true);
  const [userLat, setUserLat]        = useState(48.138);
  const [userLng, setUserLng]        = useState(11.575);
  const [matchIdx, setMatchIdx]      = useState(0);

  const MATCH_TEXTS = [
    "Menschen entdecken",
    "Kreative Energie finden",
    "Talente in deiner Nähe",
    "Passende Menschen",
  ];

  useEffect(() => {
    const t = setInterval(() => setMatchIdx(i => (i+1) % 4), 3200);
    return () => clearInterval(t);
  }, []);

  const containerRef = useRef(null);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(e => {
      const r = e[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    obs.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
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
    }, () => {}, { timeout:5000 });
  }, []);

  // Drag to pan
  const drag = useRef({ active:false, startX:0, startY:0,
    startLat:0, startLng:0 });

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
    const TILE_SIZE = 256;
    const scale = Math.pow(2, zoom);
    const metersPerPx = (40075016.686 * Math.cos(mapLat * Math.PI/180))
      / (TILE_SIZE * scale);
    const dLng = -(dx * metersPerPx) / 111320;
    const dLat =  (dy * metersPerPx) / 111320;
    setMapLat(drag.current.startLat + dLat);
    setMapLng(drag.current.startLng + dLng);
  }
  function onPointerUp() { drag.current.active = false; }

  // Filter pins
  const visiblePins = PINS.filter(p => {
    if (filter !== "alle" && p.type !== filter) return false;
    return true;
  });

  const FILTERS = [
    {key:"alle",       label:"✨ Alle",             accent:C.teal},
    {key:"wirker",     label:"🤝 Menschen",          accent:C.teal},
    {key:"werk",       label:"🎨 Werke",             accent:C.coral},
    {key:"experience", label:"🌿 Erlebnisse",        accent:"#9B72CF"},
    {key:"impact",     label:"🌍 Impact",            accent:C.green},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{
          position: fullscreen ? "fixed" : "relative",
          inset: fullscreen ? 0 : "auto",
          zIndex: fullscreen ? 400 : "auto",
          width:"100%", height: fullscreen ? "100dvh" : "100%",
          background:"#EDE8E0", overflow:"hidden" }}
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}>

        {/* ── MAP TILES ── */}
        <TileCanvas
          mapLat={mapLat} mapLng={mapLng} zoom={zoom}
          width={size.w} height={size.h}/>

        {/* Warm atmospheric vignette */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse at center,
            transparent 50%,
            rgba(10,5,0,0.28) 100%)` }}/>

        {/* ── BUBBLES ── */}
        {visiblePins.map(pin => {
          const {x,y} = latLngToXY(pin.lat, pin.lng,
            mapLat, mapLng, zoom, size.w, size.h);
          // Cull offscreen (with margin)
          if (x < -80 || x > size.w+80 || y < -80 || y > size.h+80)
            return null;
          return (
            <div key={pin.id} data-bubble="1"
              style={{ position:"absolute", left:0, top:0,
                pointerEvents:"auto" }}>
              <Bubble pin={pin} x={x} y={y}
                onClick={p => setSelected(p)}
                isSelected={selected?.id === pin.id}/>
            </div>
          );
        })}

        {/* ── ENERGY HEATMAP — subtle creative zones ── */}
        {[
          {lat:48.142, lng:11.570, color:C.teal,  r:90,  opacity:0.07},
          {lat:48.152, lng:11.536, color:C.coral, r:70,  opacity:0.06},
          {lat:48.128, lng:11.561, color:C.gold,  r:60,  opacity:0.05},
        ].map((zone,i) => {
          const {x:zx, y:zy} = latLngToXY(zone.lat, zone.lng,
            mapLat, mapLng, zoom, size.w, size.h);
          return (
            <div key={i} style={{ position:"absolute",
              left: zx - zone.r, top: zy - zone.r,
              width: zone.r*2, height: zone.r*2,
              borderRadius:"50%",
              background:`radial-gradient(circle,${zone.color} 0%,transparent 70%)`,
              opacity: zone.opacity,
              animation:`heatPulse ${4+i}s ${i*1.2}s ease-in-out infinite`,
              pointerEvents:"none", mixBlendMode:"multiply" }}/>
          );
        })}

        {/* ── USER DOT ── */}
        {(() => {
          const {x,y} = latLngToXY(userLat, userLng,
            mapLat, mapLng, zoom, size.w, size.h);
          return (
            <div style={{ position:"absolute",
              left: x - 10, top: y - 10,
              width:20, height:20, pointerEvents:"none" }}>
              <div style={{ position:"absolute", inset:-8,
                borderRadius:"50%",
                background:"rgba(22,215,197,0.18)",
                animation:"bubblePulse 2.4s ease-in-out infinite",
                "--bubble-glow-0":"0 0 0 0 rgba(22,215,197,0.30)",
                "--bubble-glow-1":"0 0 0 16px rgba(22,215,197,0.00)" }}/>
              <div style={{ width:"100%", height:"100%",
                borderRadius:"50%",
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                border:"3px solid white",
                boxShadow:`0 0 0 2px ${C.teal}, 0 4px 12px rgba(0,0,0,0.22)` }}/>
            </div>
          );
        })()}

        {/* ── TOP BAR — floating glassmorphism ── */}
        <div style={{ position:"absolute", top:0, left:0, right:0,
          padding:"max(52px,env(safe-area-inset-top,52px)) 16px 0",
          pointerEvents:"none" }}>

          {/* Header row */}
          <div style={{ display:"flex", alignItems:"center",
            gap:10, marginBottom:10, pointerEvents:"auto" }}>

            {/* Location pill */}
            <div style={{ flex:1, display:"flex", alignItems:"center",
              gap:8, padding:"10px 16px",
              background:"rgba(252,250,247,0.88)",
              backdropFilter:"blur(24px) saturate(1.6)",
              WebkitBackdropFilter:"blur(24px) saturate(1.6)",
              borderRadius:18,
              border:"1px solid rgba(255,255,255,0.65)",
              boxShadow:"0 4px 20px rgba(0,0,0,0.10)" }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background:C.teal, flexShrink:0,
                boxShadow:`0 0 6px ${C.teal}`,
                animation:"breathe 3s ease-in-out infinite" }}/>
              <span style={{ fontWeight:700, fontSize:14, color:C.ink }}>
                München
              </span>
              <span style={{ fontSize:12, color:C.teal, fontWeight:600, marginLeft:"auto" }}>
                {visiblePins.length} kreative {visiblePins.length === 1 ? "Person" : "Menschen"}
              </span>
            </div>

            {/* Close button — when used as overlay */}
            {onClose && (
              <button onClick={onClose} data-bubble="1"
                style={{ width:44, height:44, borderRadius:16,
                  background:"rgba(252,250,247,0.88)",
                  backdropFilter:"blur(16px)",
                  border:"1px solid rgba(255,255,255,0.65)",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.10)",
                  cursor:"pointer", fontSize:16, color:"#888",
                  display:"flex", alignItems:"center",
                  justifyContent:"center",
                  WebkitTapHighlightColor:"transparent" }}>✕</button>
            )}
            {/* Privacy toggle */}
            <button onClick={() => setVisible(v => !v)}
              data-bubble="1"
              style={{ width:44, height:44, borderRadius:16,
                background: visible
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : "rgba(252,250,247,0.88)",
                backdropFilter:"blur(16px)",
                border:"1px solid rgba(255,255,255,0.65)",
                boxShadow:"0 4px 16px rgba(0,0,0,0.10)",
                cursor:"pointer", fontSize:16,
                display:"flex", alignItems:"center",
                justifyContent:"center",
                transition:"all 0.3s",
                WebkitTapHighlightColor:"transparent",
                pointerEvents:"auto" }}>
              {visible ? "👁" : "🙈"}
            </button>
          </div>

          {/* Filter chips */}
          <div style={{ display:"flex", gap:7, overflowX:"auto",
            paddingBottom:4, scrollbarWidth:"none",
            pointerEvents:"auto" }}>
            {FILTERS.map(f => (
              <button key={f.key}
                data-bubble="1"
                onClick={() => setFilter(f.key)}
                style={{ padding:"8px 16px",
                  background: filter===f.key
                    ? "rgba(252,250,247,0.97)"
                    : "rgba(252,250,247,0.70)",
                  backdropFilter:"blur(16px)",
                  WebkitBackdropFilter:"blur(16px)",
                  border:`1.5px solid ${filter===f.key
                    ? (f.accent||C.teal)+"88" : "rgba(255,255,255,0.55)"}`,
                  borderRadius:999, fontSize:12,
                  fontWeight: filter===f.key ? 800 : 500,
                  color: filter===f.key ? C.teal : C.ink2,
                  cursor:"pointer", fontFamily:"inherit",
                  whiteSpace:"nowrap",
                  boxShadow: filter===f.key
                    ? `0 2px 10px ${(f.accent||C.teal)}44` : "0 2px 8px rgba(0,0,0,0.06)",
                  transition:"all 0.2s",
                  WebkitTapHighlightColor:"transparent" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* ── RADIUS SLIDER — inline, always visible ── */}
          <div data-bubble="1"
            style={{ marginTop:10, pointerEvents:"auto",
              background:"rgba(252,250,247,0.88)",
              backdropFilter:"blur(20px)",
              WebkitBackdropFilter:"blur(20px)",
              border:"1px solid rgba(255,255,255,0.60)",
              borderRadius:18, padding:"12px 16px",
              boxShadow:"0 4px 18px rgba(0,0,0,0.09)" }}>

            {/* Label row */}
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:7, height:7, borderRadius:"50%",
                  background:C.teal, display:"inline-block",
                  boxShadow:`0 0 5px ${C.teal}`,
                  animation:"breathe 3s ease-in-out infinite" }}/>
                <span style={{ fontSize:12, fontWeight:700, color:C.ink }}>
                  Umkreis
                </span>
              </div>
              <span style={{ fontSize:13, fontWeight:900, color:C.teal,
                background:`${C.teal}14`, borderRadius:999,
                padding:"2px 10px" }}>
                {radius >= 500 ? "🌍 Weltweit" : `${radius} km`}
              </span>
            </div>

            {/* Slider */}
            <input type="range" min={5} max={500} step={5}
              value={radius}
              onChange={e => setRadius(+e.target.value)}
              data-bubble="1"
              style={{ width:"100%", accentColor:C.teal,
                cursor:"pointer",
                display:"block" }}/>

            {/* Min/max hints */}
            <div style={{ display:"flex", justifyContent:"space-between",
              marginTop:4 }}>
              <span style={{ fontSize:10, color:C.muted }}>Nachbarschaft</span>
              <span style={{ fontSize:10, color:C.muted }}>Weltweit</span>
            </div>
          </div>

        </div>

        {/* ── ZOOM CONTROLS — minimal, right side ── */}
        <div style={{ position:"absolute", right:16, top:"50%",
          transform:"translateY(-50%)",
          display:"flex", flexDirection:"column", gap:8,
          pointerEvents:"auto" }}>
          {[{label:"+",delta:1},{label:"−",delta:-1}].map(btn => (
            <button key={btn.label}
              data-bubble="1"
              onClick={() => setZoom(z => Math.min(16, Math.max(8, z+btn.delta)))}
              style={{ width:40, height:40,
                background:"rgba(252,250,247,0.88)",
                backdropFilter:"blur(16px)",
                border:"1px solid rgba(255,255,255,0.65)",
                borderRadius:14, fontSize:18, fontWeight:700,
                color:C.ink2, cursor:"pointer",
                display:"flex", alignItems:"center",
                justifyContent:"center",
                boxShadow:"0 4px 14px rgba(0,0,0,0.10)",
                WebkitTapHighlightColor:"transparent" }}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* ── LIVE COMMUNITY HINT ── */}
        <div style={{ position:"absolute", bottom:156, left:20, right:20,
          pointerEvents:"none" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7,
            background:"rgba(252,250,247,0.82)",
            backdropFilter:"blur(16px)",
            border:"1px solid rgba(255,255,255,0.55)",
            borderRadius:999, padding:"6px 14px",
            boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%",
              background:C.teal, display:"inline-block",
              animation:"breathe 2.5s ease-in-out infinite",
              boxShadow:`0 0 5px ${C.teal}` }}/>
            <span style={{ fontSize:12, color:C.ink2, fontWeight:600 }}>
              {visiblePins.filter(p=>p.type==="wirker"&&p.available).length} Menschen gerade aktiv
            </span>
          </div>
        </div>

        {/* ── BOTTOM — radius + HUI match CTA ── */}
        <div style={{ position:"absolute", bottom:100, left:0, right:0,
          padding:"0 16px", pointerEvents:"auto" }}>

          {/* Bottom actions row */}
          <div style={{ display:"flex", gap:10 }}>

            {/* HUI Match — floating magic element */}
            <button
              data-bubble="1"
              onClick={onMatch}
              style={{ flex:1, padding:"11px 20px",
                background:`linear-gradient(135deg,${C.teal}F0,${C.coral}E0)`,
                border:"none", borderRadius:18, fontSize:13,
                fontWeight:800, color:"white", cursor:"pointer",
                fontFamily:"inherit",
                boxShadow:`0 4px 24px ${C.tealGlow}, 0 0 0 1px rgba(255,255,255,0.18) inset`,
                display:"flex", alignItems:"center",
                justifyContent:"center", gap:7,
                overflow:"hidden", position:"relative",
                WebkitTapHighlightColor:"transparent" }}>
              {/* Shimmer sweep */}
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)",
                animation:"shimmerSweep 3s ease-in-out infinite",
                pointerEvents:"none" }}/>
              <span style={{ fontSize:15, position:"relative" }}>✨</span>
              <span style={{ position:"relative",
                animation:`matchText 3.2s ease-in-out infinite`,
                animationDelay:`${matchIdx * 0}s` }}>
                {MATCH_TEXTS[matchIdx]}
              </span>
            </button>
          </div>
        </div>

        {/* Privacy OFF overlay hint */}
        {!visible && (
          <div style={{ position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            background:"rgba(252,250,247,0.92)",
            backdropFilter:"blur(20px)",
            border:"1px solid rgba(255,255,255,0.70)",
            borderRadius:22, padding:"20px 28px",
            textAlign:"center", maxWidth:260,
            boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
            pointerEvents:"none" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🙈</div>
            <div style={{ fontWeight:800, fontSize:15,
              color:C.ink, marginBottom:4 }}>
              Du bist unsichtbar
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
              Andere sehen dich nicht auf der Karte.
              Du kannst weiterhin entdecken.
            </div>
          </div>
        )}

        {/* Detail sheet */}
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

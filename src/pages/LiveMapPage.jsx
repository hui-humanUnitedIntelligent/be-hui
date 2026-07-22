// LiveMapPage.jsx — HUI Discovery v7 · 3D Globe Edition
// GLOB-CAM-001: Vollständige Erde immer sichtbar · Sanfter Fokus bei Klick
import React, { useState, useEffect, useRef, useCallback } from "react";
import { HUI } from "../design/hui.design.js";

/* ── FARBEN ─────────────────────────────────────── */
const C = {
  teal: HUI.COLOR.teal,   teal2: HUI.COLOR.tealDeep,
  coral: HUI.COLOR.coral, gold: HUI.COLOR.gold,
  cream: HUI.COLOR.cream, ink: HUI.COLOR.ink,
  green: "#3DB87A",       violet: "#9B72CF",
};

/* ── CSS ─────────────────────────────────────────── */
const CSS = `
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes sheetUp {
    from{opacity:0;transform:translateY(20px) scale(0.97)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes orbPulse {
    0%,100%{transform:scale(1);opacity:0.9}
    50%{transform:scale(1.18);opacity:1}
  }
  @keyframes ringOut {
    0%{transform:scale(1);opacity:0.5}
    100%{transform:scale(2.2);opacity:0}
  }
  @keyframes shimmer {
    0%{transform:translateX(-130%)} 55%,100%{transform:translateX(130%)}
  }
  .lm-tap{-webkit-tap-highlight-color:transparent;cursor:pointer}
  .lm-scroll::-webkit-scrollbar{display:none}
  .lm-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .globe-btn{
    background:rgba(255,255,255,0.92);
    backdrop-filter:blur(12px);
    border:1px solid rgba(0,0,0,0.08);
    border-radius:14px;
    padding:9px 16px;
    font-size:13px;
    font-weight:600;
    color:#1A1A2E;
    cursor:pointer;
    -webkit-tap-highlight-color:transparent;
    transition:all .18s ease;
    box-shadow:0 2px 12px rgba(0,0,0,0.10);
  }
  .globe-btn:active{transform:scale(0.95);background:rgba(245,245,245,0.95)}
  .globe-btn.active{background:${C.teal};color:#fff;border-color:${C.teal}}
`;

/* ── PIN-DATEN ────────────────────────────────────── */
const PINS = [
  { id:1,  type:"wirker",     name:"Lea Sommer",                 talent:"Fotografin",        city:"München",     country:"Deutschland",
    lat:48.14, lng:11.58, available:true,  recs:34, hourly:85,
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=700&q=85",
    bio:"Ich fange das Licht ein, bevor es verschwindet." },
  { id:2,  type:"wirker",     name:"Anna K.",                    talent:"Gartengestalterin", city:"München",     country:"Deutschland",
    lat:48.15, lng:11.54, available:true,  recs:43, hourly:75,
    img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=85",
    bio:"Gärten sind lebendige Kunstwerke." },
  { id:3,  type:"experience", name:"Walk & Think Session",       creator:"Lars G.",          city:"München",     country:"Deutschland",
    lat:48.14, lng:11.56, price:150, duration:"2 Std",
    img:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=700&q=85",
    bio:"Strategie-Spaziergang. Ideen brauchen Luft." },
  { id:4,  type:"werk",       name:"Aquarell Original",          creator:"Lena M.",          city:"München",     country:"Deutschland",
    lat:48.13, lng:11.57, price:120, category:"Kunst",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=85",
    bio:"Aquarell auf Archivpapier. Jedes Stück ein Original." },
  { id:5,  type:"impact",     name:"Stadtgärten als Begegnungsorte", city:"München",         country:"Deutschland",
    lat:48.16, lng:11.55, raised:12800, goal:40000,
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=85",
    bio:"Wo Erde wächst, wächst Gemeinschaft." },
  { id:6,  type:"wirker",     name:"David Weber",                talent:"Keramikkünstler",   city:"Hamburg",     country:"Deutschland",
    lat:53.56, lng:9.99,  available:true,  recs:19, hourly:65,
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
    bio:"Ton ist mein Medium — Stille ist meine Sprache." },
  { id:7,  type:"wirker",     name:"Marcus B.",                  talent:"Videograf",         city:"Berlin",      country:"Deutschland",
    lat:52.52, lng:13.40, available:false, recs:27, hourly:120,
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=700&q=85",
    bio:"Bewegte Bilder, die bewegen." },
  { id:8,  type:"impact",     name:"Schutz der Meere",           city:"Hamburg",             country:"Deutschland",
    lat:53.55, lng:9.96,  raised:36200, goal:80000,
    img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=700&q=85",
    bio:"Wir schützen, was uns schützt." },
  { id:9,  type:"wirker",     name:"Sofia C.",                   talent:"Designerin",        city:"Paris",       country:"Frankreich",
    lat:48.85, lng:2.35,  available:true,  recs:51, hourly:95,
    img:"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=700&q=85",
    bio:"Design ist Haltung." },
  { id:10, type:"experience", name:"Art Walk Paris",             creator:"Sofia C.",         city:"Paris",       country:"Frankreich",
    lat:48.86, lng:2.33,  price:65,  duration:"2,5 Std",
    img:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=700&q=85",
    bio:"Durch Montmartre, Louvre-Umgebung und mehr." },
  { id:11, type:"wirker",     name:"Marco R.",                   talent:"Fotograf",          city:"Rom",         country:"Italien",
    lat:41.90, lng:12.50, available:true,  recs:38, hourly:80,
    img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=700&q=85",
    bio:"Rom ist ein Freilichtmuseum. Ich zeige dir warum." },
  { id:12, type:"werk",       name:"Keramik-Kollektion",         creator:"Maria T.",         city:"Barcelona",   country:"Spanien",
    lat:41.39, lng:2.15,  price:89,  category:"Design",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
    bio:"Mediterrane Handwerkskunst, neu interpretiert." },
  { id:13, type:"wirker",     name:"Yuki M.",                    talent:"Wellness-Coach",    city:"Tokio",       country:"Japan",
    lat:35.68, lng:139.69, available:true, recs:72, hourly:110,
    img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=700&q=85",
    bio:"Harmonie zwischen Körper, Geist und Welt." },
  { id:14, type:"impact",     name:"Urban Gardens Tokyo",        city:"Tokio",               country:"Japan",
    lat:35.69, lng:139.70, raised:22400, goal:60000,
    img:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=700&q=85",
    bio:"Grüne Inseln in einer Metropole." },
  { id:15, type:"wirker",     name:"Aisha O.",                   talent:"Architektin",       city:"Nairobi",     country:"Kenia",
    lat:-1.29, lng:36.82,  available:true, recs:29, hourly:70,
    img:"https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=700&q=85",
    bio:"Architektur, die der Gemeinschaft dient." },
  { id:16, type:"impact",     name:"Clean Water Initiative",     city:"Nairobi",             country:"Kenia",
    lat:-1.30, lng:36.83,  raised:44100, goal:100000,
    img:"https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=700&q=85",
    bio:"Sauberes Wasser für 10 000 Menschen." },
  { id:17, type:"wirker",     name:"Carlos M.",                  talent:"Musiker",           city:"São Paulo",   country:"Brasilien",
    lat:-23.55, lng:-46.63, available:true, recs:45, hourly:60,
    img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85",
    bio:"Musik ist die Sprache der Seele." },
  { id:18, type:"wirker",     name:"Emma S.",                    talent:"Nachhaltigkeitsberaterin", city:"New York", country:"USA",
    lat:40.71, lng:-74.01, available:true, recs:63, hourly:130,
    img:"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1485871800258-2e0d25b7e767?w=700&q=85",
    bio:"Nachhaltigkeit ist kein Trend — es ist die Zukunft." },
  { id:19, type:"experience", name:"Sustainable NYC Tour",       creator:"Emma S.",          city:"New York",    country:"USA",
    lat:40.72, lng:-74.00, price:95,  duration:"3 Std",
    img:"https://images.unsplash.com/photo-1485871800258-2e0d25b7e767?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1485871800258-2e0d25b7e767?w=700&q=85",
    bio:"Entdecke das grüne New York." },
  { id:20, type:"impact",     name:"Reforestation Australia",    city:"Sydney",              country:"Australien",
    lat:-33.87, lng:151.21, raised:18900, goal:75000,
    img:"https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=120&q=85",
    bg:"https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=700&q=85",
    bio:"Wälder für kommende Generationen." },
];

const TYPE_COLOR = {
  wirker:     C.teal,
  experience: C.coral,
  werk:       C.gold,
  impact:     C.green,
};
const TYPE_LABEL = {
  wirker:"Wirker·in", experience:"Erlebnis", werk:"Werk", impact:"Impact"
};

/* ── GLOBE RENDERING (WebGL-freies Canvas mit Spherical Projection) ── */
// GLOB-CAM-001: FOV-Kamera — Radius so berechnet dass 100% der Erde sichtbar

function drawGlobe(canvas, state) {
  const { rotY, rotX, highlight, width, height } = state;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  canvas.width  = width  * dpr;
  canvas.height = height * dpr;
  canvas.style.width  = width  + "px";
  canvas.style.height = height + "px";
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // ── Kamera-Konfiguration: Erde füllt ~70% der Fläche ──────────────────
  // cx/cy = Mittelpunkt der Erdkugel im Canvas (leicht links-zentriert)
  const cx = width  * 0.42;
  const cy = height * 0.50;
  // Radius = 35% der kleineren Dimension → Erde nimmt ~70% ein
  const R  = Math.min(width, height) * 0.35;

  // ── Hintergrund: tiefer Weltraum ──────────────────────────────────────
  const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 2.8);
  bgGrad.addColorStop(0,   "rgba(8,12,28,0.0)");
  bgGrad.addColorStop(0.6, "rgba(8,12,28,0.0)");
  bgGrad.addColorStop(1,   "rgba(8,12,28,0.0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // ── Atmosphären-Glühen ────────────────────────────────────────────────
  const atmGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.18);
  atmGrad.addColorStop(0,   "rgba(100,180,255,0.22)");
  atmGrad.addColorStop(0.5, "rgba(80,140,255,0.08)");
  atmGrad.addColorStop(1,   "rgba(60,100,200,0.00)");
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
  ctx.fillStyle = atmGrad;
  ctx.fill();

  // ── Ozean-Basis ───────────────────────────────────────────────────────
  const oceanGrad = ctx.createRadialGradient(
    cx - R * 0.28, cy - R * 0.28, R * 0.05,
    cx, cy, R
  );
  oceanGrad.addColorStop(0,   "#3B8FD0");
  oceanGrad.addColorStop(0.4, "#1E6FA8");
  oceanGrad.addColorStop(0.75,"#1A5C8A");
  oceanGrad.addColorStop(1,   "#0D3A5C");
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = oceanGrad;
  ctx.fill();

  // ── Koordinatengitter (Längen-/Breitengrade) ──────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Längengrade
  for (let lon = -180; lon <= 180; lon += 30) {
    const lpts = [];
    for (let lat = -90; lat <= 90; lat += 2) {
      const p = project(lat, lon, rotY, rotX, cx, cy, R);
      if (p) lpts.push(p);
    }
    if (lpts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(lpts[0].x, lpts[0].y);
      for (let i = 1; i < lpts.length; i++) ctx.lineTo(lpts[i].x, lpts[i].y);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  // Breitengrade
  for (let lat = -60; lat <= 60; lat += 30) {
    const lpts = [];
    for (let lon = -180; lon <= 180; lon += 2) {
      const p = project(lat, lon, rotY, rotX, cx, cy, R);
      if (p) lpts.push(p);
    }
    if (lpts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(lpts[0].x, lpts[0].y);
      for (let i = 1; i < lpts.length; i++) ctx.lineTo(lpts[i].x, lpts[i].y);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  ctx.restore();

  // ── Kontinente ────────────────────────────────────────────────────────
  drawContinents(ctx, rotY, rotX, cx, cy, R);

  // ── Pins auf der Kugel ────────────────────────────────────────────────
  const pinPositions = [];
  for (const pin of PINS) {
    const p = project(pin.lat, pin.lng, rotY, rotX, cx, cy, R);
    if (!p) continue; // rückseite der Kugel
    pinPositions.push({ pin, x: p.x, y: p.y });
  }

  // Zuerst Ringe der ausgewählten Pins zeichnen
  for (const { pin, x, y } of pinPositions) {
    if (highlight && highlight.id === pin.id) {
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Dann alle Pins
  for (const { pin, x, y } of pinPositions) {
    const col = TYPE_COLOR[pin.type] || C.teal;
    const isH = highlight && highlight.id === pin.id;
    const sz  = isH ? 9 : 6;

    ctx.beginPath();
    ctx.arc(x, y, sz + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = isH ? 2 : 1;
    ctx.stroke();
  }

  // ── Highlights auf Kugel ──────────────────────────────────────────────
  const glowGrad = ctx.createRadialGradient(
    cx - R * 0.35, cy - R * 0.32, 0,
    cx - R * 0.10, cy - R * 0.10, R * 0.85
  );
  glowGrad.addColorStop(0,    "rgba(255,255,255,0.18)");
  glowGrad.addColorStop(0.25, "rgba(255,255,255,0.06)");
  glowGrad.addColorStop(1,    "rgba(0,0,0,0.0)");
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // ── Rand-Schatten (Tiefe) ─────────────────────────────────────────────
  const edgeGrad = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
  edgeGrad.addColorStop(0,   "rgba(0,0,0,0.0)");
  edgeGrad.addColorStop(0.7, "rgba(0,0,0,0.12)");
  edgeGrad.addColorStop(1,   "rgba(0,0,0,0.52)");
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = edgeGrad;
  ctx.fill();

  return { cx, cy, R, pinPositions };
}

/* ── Sphärische Projektion ─────────────────────────── */
function project(lat, lon, rotY, rotX, cx, cy, R) {
  const la = lat * Math.PI / 180;
  const lo = lon * Math.PI / 180;
  // 3D-Koordinaten auf Einheitskugel
  let x = Math.cos(la) * Math.sin(lo);
  let y = Math.sin(la);
  let z = Math.cos(la) * Math.cos(lo);
  // Rotation Y (Längsachse)
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  // Rotation X (Breitenachse — leicht nach oben kippen)
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  // Rückseite ausblenden
  if (z2 < -0.01) return null;
  // Perspektivische Projektion (leicht)
  const persp = 1 + z2 * 0.18;
  return {
    x: cx + (x1 / persp) * R,
    y: cy - (y2 / persp) * R,
  };
}

/* ── Kontinente (vereinfachte Polygone) ──────────────── */
function drawContinents(ctx, rotY, rotX, cx, cy, R) {
  const draw = (polys, fillColor, strokeColor) => {
    for (const poly of polys) {
      const pts = poly.map(([lat, lon]) => project(lat, lon, rotY, rotX, cx, cy, R))
                      .filter(Boolean);
      if (pts.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  };

  // Land-Farbe: warmes erdiges Grün
  const land    = "rgba(86,159,90,0.82)";
  const landStr = "rgba(60,120,65,0.55)";

  // Europa
  draw([[
    [71,28],[70,30],[68,32],[65,25],[60,24],[58,25],[56,24],[55,24],[54,18],
    [53,14],[52,13],[51,6],[50,3],[47,1],[44,-2],[44,0],[43,3],[41,2],[40,-1],
    [36,-8],[36,-5],[37,0],[38,2],[41,12],[44,12],[45,13],[46,13],[47,8],[48,7],
    [50,8],[51,4],[52,5],[53,9],[54,10],[55,10],[56,11],[57,8],[58,5],[59,5],
    [60,5],[61,5],[62,5],[63,8],[65,13],[67,15],[69,18],[70,19],[71,28]
  ]], land, landStr);

  // Afrika
  draw([[
    [37,10],[37,12],[32,12],[30,32],[22,37],[12,44],[11,42],[10,40],[2,41],
    [-1,42],[-4,40],[-10,38],[-18,36],[-28,33],[-34,26],[-35,20],[-35,17],
    [-30,17],[-25,15],[-22,17],[-15,12],[-10,15],[-5,10],[-4,8],[2,2],
    [4,-3],[4,-2],[4,9],[10,14],[14,14],[15,13],[16,23],[20,32],[22,37],
    [30,32],[35,36],[37,10]
  ]], land, landStr);

  // Asien (vereinfacht)
  draw([[
    [71,28],[70,60],[70,80],[70,100],[68,130],[64,140],[60,143],[55,141],
    [50,130],[45,140],[43,131],[42,130],[35,129],[34,129],[32,131],[28,122],
    [22,113],[10,105],[1,104],[-10,110],[-8,115],[5,100],[10,100],[10,80],
    [8,78],[8,77],[20,63],[22,58],[24,54],[22,39],[12,44],[22,37],[30,32],
    [32,35],[36,36],[37,36],[40,35],[41,28],[40,26],[40,30],[42,40],[45,50],
    [50,58],[55,60],[55,68],[55,73],[55,80],[55,86],[55,90],[56,94],[58,110],
    [60,115],[63,130],[67,134],[70,135],[71,100],[71,60],[71,28]
  ]], land, landStr);

  // Nordamerika
  draw([[
    [72,-80],[70,-100],[70,-130],[60,-140],[55,-130],[50,-125],[48,-124],
    [45,-124],[40,-124],[38,-122],[34,-118],[30,-116],[25,-110],[22,-106],
    [20,-104],[17,-100],[16,-90],[15,-90],[16,-86],[18,-88],[20,-90],[22,-98],
    [25,-97],[26,-97],[28,-97],[30,-90],[30,-89],[29,-89],[28,-91],[28,-98],
    [25,-97],[22,-98],[20,-90],[18,-88],[15,-86],[10,-83],[8,-77],[10,-75],
    [12,-72],[18,-66],[25,-80],[30,-81],[35,-76],[37,-76],[38,-75],[40,-73],
    [42,-70],[43,-70],[44,-68],[46,-64],[48,-55],[50,-53],[52,-55],[55,-60],
    [60,-65],[65,-70],[68,-70],[72,-80]
  ]], land, landStr);

  // Südamerika
  draw([[
    [12,-72],[10,-62],[8,-60],[4,-52],[2,-50],[0,-50],[-5,-35],[-8,-35],
    [-10,-37],[-15,-39],[-20,-40],[-23,-43],[-28,-48],[-32,-52],[-34,-55],
    [-35,-58],[-38,-62],[-40,-62],[-44,-65],[-48,-65],[-50,-68],[-53,-68],
    [-55,-65],[-55,-68],[-52,-68],[-48,-66],[-44,-65],[-40,-62],[-38,-62],
    [-34,-58],[-32,-52],[-28,-48],[-23,-43],[-20,-40],[-15,-39],[-10,-37],
    [-8,-35],[-5,-35],[0,-50],[2,-50],[4,-52],[8,-60],[10,-62],[12,-72]
  ]], land, landStr);

  // Ozeanien / Australien
  draw([[
    [-15,130],[-15,137],[-18,140],[-20,148],[-25,152],[-30,153],[-35,150],
    [-38,148],[-39,146],[-38,143],[-38,141],[-35,138],[-32,134],[-30,115],
    [-26,114],[-22,114],[-20,119],[-18,122],[-15,130]
  ]], land, landStr);

  // Grönland
  draw([[
    [83,-20],[83,-40],[80,-50],[76,-68],[70,-70],[68,-64],[68,-52],[70,-42],
    [76,-20],[80,-18],[83,-20]
  ]], land, landStr);

  // Antarktis-Andeutung
  draw([[
    [-68,-180],[-68,0],[-68,180],[-78,180],[-78,0],[-78,-180],[-68,-180]
  ]], "rgba(220,235,255,0.4)", "rgba(200,220,255,0.2)");
}

/* ── HIT-TEST: Welcher Pin wurde geklickt? ────────────── */
function hitTest(mx, my, pinPositions) {
  for (const { pin, x, y } of pinPositions) {
    const d = Math.hypot(mx - x, my - y);
    if (d < 18) return pin;
  }
  return null;
}

/* ── FILTER-TYPEN ────────────────────────────────────── */
const FTYPES = [
  { key:"alle",       label:"Alle" },
  { key:"wirker",     label:"Wirker·innen" },
  { key:"experience", label:"Erlebnisse" },
  { key:"werk",       label:"Werke" },
  { key:"impact",     label:"Impact" },
];

/* ── INFO-KARTE (rechte Seite) ────────────────────────── */
function InfoCard({ pin, onClose, onView }) {
  if (!pin) return null;
  const isW   = pin.type === "wirker";
  const isE   = pin.type === "experience";
  const isWk  = pin.type === "werk";
  const isI   = pin.type === "impact";
  const col   = TYPE_COLOR[pin.type] || C.teal;
  const prog  = isI ? Math.round((pin.raised / pin.goal) * 100) : 0;

  return (
    <div style={{
      position:"absolute", top:0, right:0, bottom:0,
      width:"min(320px, 48%)",
      background:"rgba(255,249,244,0.97)",
      backdropFilter:"blur(20px)",
      borderLeft:"1px solid rgba(0,0,0,0.06)",
      display:"flex", flexDirection:"column",
      animation:"fadeIn .25s ease",
      zIndex:10,
    }}>
      {/* Header-Bild */}
      <div style={{ position:"relative", height:160, flexShrink:0, overflow:"hidden" }}>
        {pin.bg && (
          <img src={pin.bg} alt="" style={{
            width:"100%", height:"100%", objectFit:"cover",
          }}/>
        )}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)",
        }}/>
        {/* Badge */}
        <div style={{
          position:"absolute", top:12, left:12,
          background:col, color:"#fff",
          fontSize:10, fontWeight:700, letterSpacing:0.5,
          padding:"3px 8px", borderRadius:20,
        }}>{TYPE_LABEL[pin.type]}</div>
        {/* Schließen */}
        <button onClick={onClose} style={{
          position:"absolute", top:10, right:10,
          width:30, height:30, borderRadius:15,
          background:"rgba(0,0,0,0.45)", border:"none",
          color:"#fff", fontSize:16, lineHeight:1,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer",
        }}>✕</button>
        {/* Avatar / Icon */}
        {pin.img && (
          <div style={{
            position:"absolute", bottom:-22, left:16,
            width:44, height:44, borderRadius:22,
            border:"3px solid white",
            overflow:"hidden",
            boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
          }}>
            <img src={pin.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
        )}
      </div>

      {/* Inhalt */}
      <div style={{ flex:1, overflowY:"auto", padding:"32px 16px 16px" }} className="lm-scroll">
        <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:2 }}>{pin.name}</div>
        {(pin.talent || pin.creator) && (
          <div style={{ fontSize:12, color:col, fontWeight:600, marginBottom:4 }}>
            {pin.talent || pin.creator}
          </div>
        )}
        <div style={{ fontSize:12, color:"rgba(26,26,46,0.5)", marginBottom:10 }}>
          📍 {pin.city}, {pin.country}
        </div>
        {pin.bio && (
          <p style={{ fontSize:13, color:"rgba(26,26,46,0.7)", lineHeight:1.5, margin:"0 0 12px" }}>
            {pin.bio}
          </p>
        )}

        {/* Metriken */}
        {isW && (
          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:800, color:C.ink }}>{pin.recs}</div>
              <div style={{ fontSize:10, color:"rgba(26,26,46,0.45)" }}>Empfehlungen</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:800, color:C.ink }}>{pin.hourly} €/h</div>
              <div style={{ fontSize:10, color:"rgba(26,26,46,0.45)" }}>Stundensatz</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{
                fontSize:11, fontWeight:700,
                color: pin.available ? C.green : "rgba(26,26,46,0.35)",
                background: pin.available ? "rgba(61,184,122,0.1)" : "rgba(0,0,0,0.05)",
                padding:"4px 8px", borderRadius:8,
              }}>{pin.available ? "✓ Verfügbar" : "Ausgebucht"}</div>
            </div>
          </div>
        )}
        {(isE || isWk) && (
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
            <div style={{
              background:col, color:"#fff",
              fontSize:14, fontWeight:800,
              padding:"4px 10px", borderRadius:10,
            }}>{pin.price} €</div>
            {pin.duration && (
              <div style={{ fontSize:12, color:"rgba(26,26,46,0.5)" }}>⏱ {pin.duration}</div>
            )}
            {pin.category && (
              <div style={{ fontSize:11, color:col, background:`${col}18`, padding:"3px 8px", borderRadius:8 }}>
                {pin.category}
              </div>
            )}
          </div>
        )}
        {isI && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.ink }}>{pin.raised?.toLocaleString("de")} €</span>
              <span style={{ fontSize:12, color:"rgba(26,26,46,0.4)" }}>Ziel: {pin.goal?.toLocaleString("de")} €</span>
            </div>
            <div style={{ height:6, borderRadius:3, background:"rgba(0,0,0,0.07)", overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:3,
                width:`${Math.min(prog, 100)}%`,
                background:`linear-gradient(90deg,${C.green},${C.teal})`,
              }}/>
            </div>
            <div style={{ fontSize:11, color:C.green, fontWeight:600, marginTop:4 }}>{prog}% erreicht</div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.06)", flexShrink:0 }}>
        <button
          onClick={() => onView?.(pin)}
          style={{
            width:"100%", padding:"11px", borderRadius:14,
            background:col, border:"none", color:"#fff",
            fontSize:14, fontWeight:700, cursor:"pointer",
          }}
        >
          {isW ? "Profil ansehen" : isE ? "Erlebnis buchen" : isWk ? "Werk ansehen" : "Projekt ansehen"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN — LiveMapPage
════════════════════════════════════════════════════ */
export default function LiveMapPage({ onView, onClose, fullscreen }) {
  const canvasRef   = useRef(null);
  const stateRef    = useRef({
    rotY: 0.18,       // Startet über Europa/Atlantik
    rotX: -0.20,      // Leichte Neigung nach oben (Nordpol sichtbar)
    targetRotY: 0.18,
    targetRotX: -0.20,
    autoRotate: true,
    pinPositions: [],
  });
  const rafRef      = useRef(null);
  const containerRef= useRef(null);
  const [size, setSize]       = useState({ w: 390, h: 680 });
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]   = useState("alle");
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ active:false, sx:0, sy:0, sRotY:0, sRotX:0 });

  /* ── Größe messen ─────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: width, h: height });
    });
    obs.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  /* ── Render-Loop ───────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;

    // GLOB-CAM-001: Auto-Rotation (langsam, kontinuierlich)
    if (s.autoRotate && !dragRef.current.active) {
      s.targetRotY += 0.0018; // ca. 1 Umdrehung / 60 Sek
    }

    // Sanftes Easing zur Zielposition
    s.rotY += (s.targetRotY - s.rotY) * 0.06;
    s.rotX += (s.targetRotX - s.rotX) * 0.06;

    const result = drawGlobe(canvas, {
      rotY: s.rotY,
      rotX: s.rotX,
      highlight: selected,
      width: size.w,
      height: size.h,
    });
    if (result) s.pinPositions = result.pinPositions;

    rafRef.current = requestAnimationFrame(render);
  }, [selected, size]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  /* ── GLOB-CAM-001: Fokus auf ausgewählten Pin ─── */
  useEffect(() => {
    if (!selected) {
      // Zurücksetzen auf Standardansicht (Europa-Atlantik-Ansicht)
      stateRef.current.targetRotY = stateRef.current.rotY; // sanft, keine Sprünge
      stateRef.current.targetRotX = -0.20;
      stateRef.current.autoRotate = true;
      return;
    }

    // GLOB-CAM-001: Leichter Fokus — NICHT extremer Zoom, Kugel bleibt sichtbar
    // Berechne Rotation sodass der Pin vorne-mittig auf der Kugel erscheint
    const lonRad = selected.lng * Math.PI / 180;
    const latRad = selected.lat * Math.PI / 180;
    // Ziel-RotY: Pin soll in der Frontebene sein (z-Achse)
    stateRef.current.targetRotY = -lonRad;
    // Ziel-RotX: moderate Neigung für die Breite des Pins
    // Maximal 30° Neigung — Kugel bleibt immer vollständig sichtbar
    stateRef.current.targetRotX = Math.max(-0.52, Math.min(0.52, -latRad * 0.7));
    stateRef.current.autoRotate = false;
  }, [selected]);

  /* ── Drag-Interaktion ─────────────────────────── */
  const onPointerDown = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    dragRef.current = {
      active: true,
      sx: e.clientX, sy: e.clientY,
      sRotY: stateRef.current.rotY,
      sRotX: stateRef.current.rotX,
      moved: false,
    };
    stateRef.current.autoRotate = false;
    setIsDragging(false);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }
    stateRef.current.targetRotY = dragRef.current.sRotY + dx * 0.007;
    stateRef.current.targetRotX = Math.max(-0.7, Math.min(0.7,
      dragRef.current.sRotX - dy * 0.007
    ));
  };

  const onPointerUp = (e) => {
    if (!dragRef.current.active) return;
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    setIsDragging(false);

    if (!wasMoved) {
      // Klick: Prüfen ob ein Pin getroffen wurde
      const rect  = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = hitTest(mx, my, stateRef.current.pinPositions);
      if (hit) {
        setSelected(hit);
      } else {
        setSelected(null);
        stateRef.current.autoRotate = true;
      }
    } else {
      // Nach Drag: kurze Pause, dann Auto-Rotation weitermachen
      setTimeout(() => {
        if (!selected) stateRef.current.autoRotate = true;
      }, 3000);
    }
  };

  /* ── Gefilterte Pins ──────────────────────────── */
  const filteredPins = filter === "alle" ? PINS : PINS.filter(p => p.type === filter);

  const handleClose = () => {
    setSelected(null);
    stateRef.current.autoRotate = true;
  };

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={containerRef}
        style={{
          position: fullscreen ? "fixed" : "relative",
          inset: fullscreen ? 0 : "auto",
          zIndex: fullscreen ? 400 : "auto",
          width: "100%",
          height: fullscreen ? "100dvh" : "100%",
          background: "linear-gradient(135deg, #0A0E1E 0%, #0D1628 50%, #080C18 100%)",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* ── WELTKUGEL-CANVAS ── */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {/* ── STERNE-HINTERGRUND ── */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse at 20% 80%, rgba(22,215,197,0.04) 0%, transparent 60%)",
        }}/>

        {/* ── KOPFZEILE ──────────────────────────── */}
        <div style={{
          position:"absolute", top:0, left:0, right: selected ? "min(320px,48%)" : 0,
          padding:"16px 16px 8px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          zIndex:20, transition:"right .3s ease",
        }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>
              HUI Welt
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>
              {PINS.length} Mitglieder · {PINS.filter(p=>p.type==="impact").length} Projekte
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background:"rgba(255,255,255,0.1)", border:"none",
              color:"#fff", width:32, height:32, borderRadius:16,
              fontSize:15, cursor:"pointer", display:"flex",
              alignItems:"center", justifyContent:"center",
            }}>✕</button>
          )}
        </div>

        {/* ── FILTER-CHIPS ──────────────────────── */}
        <div style={{
          position:"absolute", bottom: selected ? "auto" : 24,
          top: selected ? "auto" : "auto",
          left:0, right: selected ? "min(320px,48%)" : 0,
          bottom:24,
          display:"flex", gap:8, padding:"0 16px",
          overflowX:"auto", zIndex:20,
          transition:"right .3s ease",
        }} className="lm-scroll">
          {FTYPES.map(f => (
            <button
              key={f.key}
              className={`globe-btn ${filter===f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── LEGENDE / HINT ────────────────────── */}
        {!selected && (
          <div style={{
            position:"absolute", left:16, bottom:72,
            display:"flex", flexDirection:"column", gap:5, zIndex:20,
          }}>
            {Object.entries(TYPE_COLOR).map(([type, col]) => (
              <div key={type} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:4, background:col, flexShrink:0 }}/>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:500 }}>
                  {TYPE_LABEL[type]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── DREH-HINWEIS ─────────────────────── */}
        {!selected && (
          <div style={{
            position:"absolute", bottom:72, right:16,
            fontSize:10, color:"rgba(255,255,255,0.3)",
            textAlign:"right", lineHeight:1.4, zIndex:20,
            pointerEvents:"none",
          }}>
            Tippe auf einen Punkt<br/>zum Öffnen · Ziehen zum Drehen
          </div>
        )}

        {/* ── INFO-KARTE ─────────────────────────── */}
        {selected && (
          <InfoCard
            pin={selected}
            onClose={handleClose}
            onView={onView}
          />
        )}
      </div>
    </>
  );
}

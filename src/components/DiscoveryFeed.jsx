// DiscoveryFeed.jsx — HUI Immersive Discovery Feed
// Cinematic. Human. Ruhig. Nicht TikTok.
import React, { useState, useRef, useEffect, useCallback } from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.22)",
  gold:"#F5A623", goldGlow:"rgba(245,166,35,0.22)",
  green:"#3DB87A", greenGlow:"rgba(61,184,122,0.22)",
  cream:"#F9F6F2", creamWarm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBBBBB",
  border:"rgba(0,0,0,0.06)",
};

/* ── FEED DATA ──────────────────────────────────────────────────────────── */
const FEED_ITEMS = [
  {
    id:1, type:"wirker",
    name:"Lea Sommer", talent:"Fotografin", city:"München", recs:34,
    available:true, hourly:85,
    bio:"Ich fange das Licht ein, bevor es verschwindet.",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&q=90",
    accent:C.teal, accentGlow:C.tealGlow,
    label:"Wirker", labelIcon:"◎",
  },
  {
    id:2, type:"werk",
    title:"Aquarell Original", creator:"Lena Maier", city:"München",
    price:"€ 120", category:"Kunst",
    bio:"Aquarell auf Archivpapier, 40×50 cm. Jedes Stück ein Unikat.",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=90",
    accent:C.coral, accentGlow:C.coralGlow,
    label:"Werk", labelIcon:"◈",
  },
  {
    id:3, type:"experience",
    title:"Yoga bei Sonnenaufgang", creator:"Nina B.", city:"Stuttgart",
    date:"Sa, 9. Mai", time:"06:30", price:"ab € 35", spots:4,
    bio:"Morgen-Yoga im Park. Sonnenaufgang, Stille, Gemeinschaft. Für alle Levels.",
    img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=90",
    accent:C.gold, accentGlow:C.goldGlow,
    label:"Erlebnis", labelIcon:"◇",
  },
  {
    id:4, type:"wirker",
    name:"David Weber", talent:"Keramikkünstler", city:"Hamburg", recs:19,
    available:true, hourly:65,
    bio:"Ton ist mein Medium — Stille ist meine Sprache. Jedes Stück entsteht in Ruhe.",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=90",
    accent:C.teal, accentGlow:C.tealGlow,
    label:"Wirker", labelIcon:"◎",
  },
  {
    id:5, type:"impact",
    title:"Stadtgärten als Begegnungsorte",
    city:"München", raised:12800, goal:40000,
    bio:"Wo Erde wächst, wächst Gemeinschaft. Gemeinsam machen wir die Stadt lebendiger.",
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=90",
    accent:C.green, accentGlow:C.greenGlow,
    label:"Impact", labelIcon:"◉",
  },
  {
    id:6, type:"werk",
    title:"Leder-Rucksack", creator:"Stefan K.", city:"Berlin",
    price:"€ 195", category:"Mode",
    bio:"Vollnarbiges Vegetable-Tanned Leder. Auf Maß — für ein Leben lang.",
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=90",
    accent:C.coral, accentGlow:C.coralGlow,
    label:"Werk", labelIcon:"◈",
  },
  {
    id:7, type:"wirker",
    name:"Anna K.", talent:"Gartengestalterin", city:"München", recs:43,
    available:true, hourly:75,
    bio:"Gärten sind lebendige Kunstwerke. Ich gestalte Räume, die atmen.",
    img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=900&q=90",
    accent:C.teal, accentGlow:C.tealGlow,
    label:"Wirker", labelIcon:"◎",
  },
  {
    id:8, type:"experience",
    title:"Töpferkurs am See", creator:"David Weber", city:"Starnberg",
    date:"So, 10. Mai", time:"10:00", price:"ab € 85", spots:3,
    bio:"Töpfern am Ufer des Starnberger Sees. Natur und Handwerk in Einklang.",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90",
    accent:C.gold, accentGlow:C.goldGlow,
    label:"Erlebnis", labelIcon:"◇",
  },
  {
    id:9, type:"werk",
    title:"Handgedrechseltes Holzschälchen", creator:"Markus L.", city:"Freiburg",
    price:"€ 68", category:"Handwerk",
    bio:"Aus Kirschholz gedrechselt. Geölt mit reinem Leinöl. Einmalig.",
    img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=900&q=90",
    accent:C.coral, accentGlow:C.coralGlow,
    label:"Werk", labelIcon:"◈",
  },
  {
    id:10, type:"impact",
    title:"Schutz der Meere",
    city:"Hamburg", raised:36200, goal:80000,
    bio:"Wir schützen, was uns schützt. Jede Buchung auf HUI trägt dazu bei.",
    img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=900&q=90",
    accent:C.green, accentGlow:C.greenGlow,
    label:"Impact", labelIcon:"◉",
  },
  {
    id:11, type:"wirker",
    name:"Marcus B.", talent:"Videograf", city:"Berlin", recs:27,
    available:false, hourly:120,
    bio:"Bewegte Bilder, die bewegen. Ich erzähle deine Geschichte in Licht.",
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=900&q=90",
    accent:C.teal, accentGlow:C.tealGlow,
    label:"Wirker", labelIcon:"◎",
  },
  {
    id:12, type:"experience",
    title:"Vision Retreat in den Bergen", creator:"Lars G.", city:"Berchtesgaden",
    date:"Sa, 16. Mai", time:"09:00", price:"ab € 380", spots:2,
    bio:"Ein Tag in den Alpen. Klarheit finden. Neue Richtung spüren.",
    img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=90",
    accent:C.gold, accentGlow:C.goldGlow,
    label:"Erlebnis", labelIcon:"◇",
  },
];

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes dfFadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes dfSlideIn {
    from { opacity:0; transform:translateX(-12px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes dfKenBurns {
    from { transform:scale(1);    }
    to   { transform:scale(1.05); }
  }
  @keyframes dfPulse {
    0%,100% { opacity:0.7; transform:scale(1); }
    50%      { opacity:1;   transform:scale(1.08); }
  }
  @keyframes dfBreath {
    0%,100% { opacity:0.55; }
    50%      { opacity:1; }
  }
  @keyframes dfSaved {
    0%   { transform:scale(1); }
    40%  { transform:scale(1.4); }
    70%  { transform:scale(0.88); }
    100% { transform:scale(1); }
  }
  .df-scroll::-webkit-scrollbar { display:none; }
  .df-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .df-tap { transition:transform 0.2s cubic-bezier(0.34,1.3,0.64,1); }
  .df-tap:active { transform:scale(0.973); }
  .df-card { will-change:transform; }
`;

/* ── SAVE BUTTON ────────────────────────────────────────────────────────── */
function SaveBtn({ accent }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
      style={{
        width:40, height:40, borderRadius:"50%",
        background:"rgba(255,255,255,0.18)",
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        border:"1px solid rgba(255,255,255,0.28)",
        cursor:"pointer", display:"flex",
        alignItems:"center", justifyContent:"center",
        fontSize:18, lineHeight:1,
        WebkitTapHighlightColor:"transparent",
        animation: saved ? "dfSaved 0.4s ease" : "none",
        transition:"background 0.2s",
      }}>
      {saved ? "🤍" : "🤍"}
      <span style={{
        position:"absolute",
        fontSize:18,
        animation: saved ? "dfSaved 0.4s ease" : "none",
        opacity: saved ? 1 : 0.65,
        filter: saved ? `drop-shadow(0 0 6px ${accent})` : "none",
        transition:"opacity 0.2s, filter 0.2s",
      }}>
        {saved ? "💙" : "🤍"}
      </span>
    </button>
  );
}

/* ── WIRKER CARD — full-bleed portrait, teal soul ──────────────────────── */
function WirkerCard({ item, onView, index }) {
  const isEven = index % 2 === 0;
  return (
    <div className="df-card df-tap"
      onClick={() => onView && onView(item)}
      style={{
        position:"relative", width:"100%",
        height:"88vh", maxHeight:680,
        overflow:"hidden", cursor:"pointer",
        borderRadius: isEven ? "0 0 40px 40px" : "40px 40px 0 0",
        animation:`dfFadeUp 0.6s ${index*0.05}s both`,
      }}>

      {/* Image — slow ken burns */}
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 18s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.name}
          style={{ width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"top center",
            filter:"brightness(0.72) saturate(1.15) contrast(0.96)" }}/>
      </div>

      {/* Teal atmospheric gradient — WIRKER identity */}
      <div style={{ position:"absolute", inset:0,
        background:`
          radial-gradient(ellipse 80% 50% at 0% 0%,
            ${C.teal}30 0%, transparent 60%),
          linear-gradient(to bottom,
            transparent 30%,
            rgba(8,8,8,0.82) 100%)
        ` }}/>

      {/* Top — type label */}
      <div style={{ position:"absolute", top:24, left:24,
        display:"flex", alignItems:"center", gap:8 }}>
        <div style={{
          background:"rgba(22,215,197,0.18)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          border:"1px solid rgba(22,215,197,0.35)",
          borderRadius:999, padding:"5px 14px",
          display:"flex", alignItems:"center", gap:6,
        }}>
          <span style={{ fontSize:9, color:C.teal, fontWeight:800,
            letterSpacing:1.8, textTransform:"uppercase" }}>
            Wirker
          </span>
          {item.available && (
            <span style={{ width:5, height:5, borderRadius:"50%",
              background:C.green, display:"inline-block",
              boxShadow:`0 0 4px ${C.green}` }}/>
          )}
        </div>
      </div>

      {/* Top right — save */}
      <div style={{ position:"absolute", top:24, right:24 }}>
        <SaveBtn accent={C.teal}/>
      </div>

      {/* Teal top accent line */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${C.teal},${C.teal}44,transparent)` }}/>

      {/* Bottom — content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 28px 36px" }}>

        {/* Bio quote */}
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.75)",
          fontStyle:"italic", lineHeight:1.65,
          marginBottom:18, fontWeight:400,
          animation:"dfSlideIn 0.5s 0.15s both" }}>
          „{item.bio}"
        </p>

        {/* Name + talent */}
        <div style={{ marginBottom:16,
          animation:"dfSlideIn 0.5s 0.08s both" }}>
          <div style={{ fontWeight:900, fontSize:28, color:"white",
            letterSpacing:-0.8, lineHeight:1.1 }}>{item.name}</div>
          <div style={{ fontSize:14, color:C.teal,
            fontWeight:700, marginTop:4 }}>{item.talent}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.52)",
            marginTop:2 }}>📍 {item.city}</div>
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", gap:12, marginBottom:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,0.10)",
            backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.14)",
            borderRadius:999, padding:"6px 14px" }}>
            <span style={{ fontSize:11, color:C.teal, fontWeight:800 }}>
              {item.recs}
            </span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.60)" }}>
              Empfehlungen
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,0.10)",
            backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.14)",
            borderRadius:999, padding:"6px 14px" }}>
            <span style={{ fontSize:11, color:C.coral, fontWeight:800 }}>
              € {item.hourly}
            </span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.60)" }}>
              / Std
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={e => { e.stopPropagation(); onView && onView(item); }}
          style={{ width:"100%", padding:"16px",
            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            border:"none", borderRadius:18,
            color:"white", fontSize:15, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 6px 24px ${C.tealGlow}`,
            WebkitTapHighlightColor:"transparent",
            letterSpacing:0.2 }}>
          Profil ansehen
        </button>
      </div>
    </div>
  );
}

/* ── WERK CARD — editorial gallery feel, coral warmth ─────────────────── */
function WerkCard({ item, onView, index }) {
  return (
    <div className="df-card df-tap"
      onClick={() => onView && onView(item)}
      style={{
        position:"relative", width:"100%",
        height:"78vh", maxHeight:600,
        overflow:"hidden", cursor:"pointer",
        borderRadius:36,
        animation:`dfFadeUp 0.6s ${index*0.05}s both`,
        margin:"0 0 0 0",
      }}>

      {/* Image */}
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 20s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center",
            filter:"brightness(0.75) saturate(1.2) contrast(0.95)" }}/>
      </div>

      {/* Coral atmospheric gradient — WERK identity */}
      <div style={{ position:"absolute", inset:0,
        background:`
          radial-gradient(ellipse 60% 40% at 100% 0%,
            ${C.coral}28 0%, transparent 55%),
          linear-gradient(to bottom,
            transparent 20%,
            rgba(8,5,5,0.88) 100%)
        ` }}/>

      {/* Coral top accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${C.coral},${C.coral}33,transparent)` }}/>

      {/* Type label */}
      <div style={{ position:"absolute", top:24, left:24 }}>
        <div style={{
          background:"rgba(255,138,107,0.18)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          border:"1px solid rgba(255,138,107,0.35)",
          borderRadius:999, padding:"5px 14px",
        }}>
          <span style={{ fontSize:9, color:C.coral, fontWeight:800,
            letterSpacing:1.8, textTransform:"uppercase" }}>
            {item.category}
          </span>
        </div>
      </div>

      {/* Price badge — top center */}
      <div style={{ position:"absolute", top:24,
        left:"50%", transform:"translateX(-50%)" }}>
        <div style={{
          background:"rgba(255,255,255,0.92)",
          backdropFilter:"blur(12px)",
          borderRadius:999, padding:"6px 18px",
          fontSize:14, fontWeight:900, color:C.ink,
          boxShadow:"0 3px 12px rgba(0,0,0,0.14)",
        }}>
          {item.price}
        </div>
      </div>

      {/* Save */}
      <div style={{ position:"absolute", top:24, right:24 }}>
        <SaveBtn accent={C.coral}/>
      </div>

      {/* Bottom content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 28px 36px" }}>

        <p style={{ fontSize:14, color:"rgba(255,255,255,0.70)",
          fontStyle:"italic", lineHeight:1.65,
          marginBottom:14, fontWeight:400 }}>
          „{item.bio}"
        </p>

        <div style={{ fontWeight:900, fontSize:26, color:"white",
          letterSpacing:-0.6, lineHeight:1.15, marginBottom:6 }}>
          {item.title}
        </div>
        <div style={{ fontSize:13, color:C.coral,
          fontWeight:700, marginBottom:4 }}>{item.creator}</div>
        <div style={{ fontSize:12,
          color:"rgba(255,255,255,0.48)", marginBottom:22 }}>
          📍 {item.city}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onView && onView(item); }}
          style={{ width:"100%", padding:"16px",
            background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
            border:"none", borderRadius:18,
            color:"white", fontSize:15, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 6px 24px ${C.coralGlow}`,
            WebkitTapHighlightColor:"transparent" }}>
          Werk entdecken
        </button>
      </div>
    </div>
  );
}

/* ── EXPERIENCE CARD — golden, event-feel ──────────────────────────────── */
function ExperienceCard({ item, onView, index }) {
  return (
    <div className="df-card df-tap"
      onClick={() => onView && onView(item)}
      style={{
        position:"relative", width:"100%",
        height:"82vh", maxHeight:640,
        overflow:"hidden", cursor:"pointer",
        borderRadius:36,
        animation:`dfFadeUp 0.6s ${index*0.05}s both`,
      }}>

      {/* Image */}
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 16s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%",
            objectFit:"cover",
            filter:"brightness(0.68) saturate(1.2) contrast(0.95)" }}/>
      </div>

      {/* Gold atmospheric gradient */}
      <div style={{ position:"absolute", inset:0,
        background:`
          radial-gradient(ellipse 70% 40% at 50% 0%,
            ${C.gold}22 0%, transparent 55%),
          linear-gradient(to bottom,
            transparent 20%,
            rgba(6,5,0,0.90) 100%)
        ` }}/>

      {/* Gold accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${C.gold},${C.gold}44,transparent)` }}/>

      {/* Top labels */}
      <div style={{ position:"absolute", top:24, left:24,
        display:"flex", gap:8, flexWrap:"wrap" }}>
        <div style={{
          background:"rgba(245,166,35,0.18)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          border:"1px solid rgba(245,166,35,0.40)",
          borderRadius:999, padding:"5px 14px",
          fontSize:9, color:C.gold, fontWeight:800,
          letterSpacing:1.6, textTransform:"uppercase" }}>
          Erlebnis
        </div>
        {item.spots <= 3 && (
          <div style={{
            background:"rgba(255,138,107,0.22)",
            backdropFilter:"blur(12px)",
            border:"1px solid rgba(255,138,107,0.40)",
            borderRadius:999, padding:"5px 12px",
            fontSize:9, color:C.coral, fontWeight:800 }}>
            🔥 Noch {item.spots} Plätze
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ position:"absolute", top:24, right:24 }}>
        <SaveBtn accent={C.gold}/>
      </div>

      {/* Bottom */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 28px 36px" }}>

        <p style={{ fontSize:14, color:"rgba(255,255,255,0.68)",
          fontStyle:"italic", lineHeight:1.65,
          marginBottom:14 }}>
          „{item.bio}"
        </p>

        <div style={{ fontWeight:900, fontSize:26, color:"white",
          letterSpacing:-0.5, lineHeight:1.15, marginBottom:6 }}>
          {item.title}
        </div>

        <div style={{ display:"flex", alignItems:"center",
          gap:16, marginBottom:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,0.10)",
            backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.14)",
            borderRadius:999, padding:"6px 14px" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.70)" }}>
              📅 {item.date}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6,
            background:"rgba(245,166,35,0.15)",
            backdropFilter:"blur(8px)",
            border:"1px solid rgba(245,166,35,0.30)",
            borderRadius:999, padding:"6px 14px" }}>
            <span style={{ fontSize:11, color:C.gold, fontWeight:800 }}>
              {item.price}
            </span>
          </div>
        </div>

        <div style={{ fontSize:12,
          color:"rgba(255,255,255,0.48)", marginBottom:20 }}>
          {item.creator} · 📍 {item.city}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onView && onView(item); }}
          style={{ width:"100%", padding:"16px",
            background:`linear-gradient(135deg,${C.gold},#E8A000)`,
            border:"none", borderRadius:18,
            color:"white", fontSize:15, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 6px 24px ${C.goldGlow}`,
            WebkitTapHighlightColor:"transparent" }}>
          Erlebnis buchen
        </button>
      </div>
    </div>
  );
}

/* ── IMPACT CARD — documentary, hopeful, green soul ───────────────────── */
function ImpactCard({ item, onImpact, index }) {
  const pct = Math.round((item.raised / item.goal) * 100);
  return (
    <div className="df-card df-tap"
      onClick={onImpact}
      style={{
        position:"relative", width:"100%",
        height:"72vh", maxHeight:560,
        overflow:"hidden", cursor:"pointer",
        borderRadius:36,
        animation:`dfFadeUp 0.6s ${index*0.05}s both`,
      }}>

      {/* Image */}
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 22s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%",
            objectFit:"cover",
            filter:"brightness(0.60) saturate(1.25) contrast(0.94)" }}/>
      </div>

      {/* Green + teal atmosphere */}
      <div style={{ position:"absolute", inset:0,
        background:`
          radial-gradient(ellipse 80% 50% at 20% 15%,
            ${C.teal}40 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 80% 80%,
            ${C.green}28 0%, transparent 55%),
          linear-gradient(to bottom,
            transparent 15%,
            rgba(4,8,6,0.88) 100%)
        ` }}/>

      {/* Green accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${C.green},${C.teal},transparent)` }}/>

      {/* Label */}
      <div style={{ position:"absolute", top:24, left:24 }}>
        <div style={{
          background:"rgba(61,184,122,0.18)",
          backdropFilter:"blur(12px)",
          border:"1px solid rgba(61,184,122,0.38)",
          borderRadius:999, padding:"5px 14px",
          fontSize:9, color:C.green, fontWeight:800,
          letterSpacing:1.8, textTransform:"uppercase" }}>
          🌱 Impact
        </div>
      </div>

      {/* Save */}
      <div style={{ position:"absolute", top:24, right:24 }}>
        <SaveBtn accent={C.green}/>
      </div>

      {/* Bottom */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 28px 36px" }}>

        <p style={{ fontSize:14, color:"rgba(255,255,255,0.70)",
          fontStyle:"italic", lineHeight:1.65, marginBottom:14 }}>
          „{item.bio}"
        </p>

        <div style={{ fontWeight:900, fontSize:24, color:"white",
          letterSpacing:-0.4, lineHeight:1.2, marginBottom:6 }}>
          {item.title}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.48)",
          marginBottom:20 }}>📍 {item.city}</div>

        {/* Progress */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            marginBottom:8 }}>
            <span style={{ fontWeight:800, fontSize:15, color:C.green }}>
              € {new Intl.NumberFormat("de-DE").format(item.raised)}
            </span>
            <span style={{ fontSize:12,
              color:"rgba(255,255,255,0.55)" }}>{pct}% erreicht</span>
          </div>
          <div style={{ height:5, borderRadius:999,
            background:"rgba(255,255,255,0.12)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999,
              width:`${pct}%`,
              background:`linear-gradient(90deg,${C.green},${C.teal})`,
              boxShadow:`0 0 10px ${C.greenGlow}` }}/>
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onImpact && onImpact(); }}
          style={{ width:"100%", padding:"16px",
            background:`linear-gradient(135deg,${C.green},${C.teal2})`,
            border:"none", borderRadius:18,
            color:"white", fontSize:15, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 6px 24px ${C.greenGlow}`,
            WebkitTapHighlightColor:"transparent" }}>
          Projekt entdecken
        </button>
      </div>
    </div>
  );
}

/* ── SEARCH HEADER — atmospheric, compact ──────────────────────────────── */
function SearchHeader({ onMatch, onMap }) {
  return (
    <div style={{
      padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
      background:`
        radial-gradient(ellipse 70% 60% at 15% 0%,
          ${C.teal}12 0%, transparent 65%),
        radial-gradient(ellipse 50% 40% at 90% 50%,
          ${C.coral}10 0%, transparent 60%),
        ${C.creamWarm}`,
      paddingBottom:20,
    }}>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5, lineHeight:1.1 }}>
          Entdecken
        </div>
        <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
          Echte Menschen. Echte Werke. Echte Momente.
        </div>
      </div>

      {/* Search + Map row */}
      <div style={{ display:"flex", gap:10, marginBottom:12,
        alignItems:"center" }}>
        <div style={{ position:"relative", flex:1 }}>
          <span style={{ position:"absolute", left:16, top:"50%",
            transform:"translateY(-50%)", fontSize:14,
            color:C.muted2, pointerEvents:"none" }}>🔍</span>
          <input
            readOnly onFocus={onMatch}
            placeholder="Wen oder was suchst du?"
            style={{ width:"100%",
              background:"rgba(255,255,255,0.88)",
              backdropFilter:"blur(12px)",
              border:`1.5px solid ${C.border}`,
              borderRadius:999,
              padding:"13px 18px 13px 42px",
              fontSize:14, color:C.ink,
              outline:"none", fontFamily:"inherit",
              boxSizing:"border-box",
              boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}/>
        </div>
        <button onClick={onMap}
          style={{ width:48, height:48, flexShrink:0,
            borderRadius:16,
            background:`linear-gradient(135deg,${C.teal}22,${C.coral}14)`,
            border:`1.5px solid ${C.teal}55`,
            cursor:"pointer", fontSize:20,
            display:"flex", alignItems:"center",
            justifyContent:"center",
            boxShadow:`0 2px 12px ${C.tealGlow}`,
            WebkitTapHighlightColor:"transparent" }}>
          🗺
        </button>
      </div>

      {/* HUI Match */}
      <button onClick={onMatch}
        style={{ width:"100%", padding:"13px 20px",
          background:`linear-gradient(135deg,${C.teal},${C.coral})`,
          border:"none", borderRadius:999,
          color:"white", fontSize:15, fontWeight:800,
          cursor:"pointer", fontFamily:"inherit",
          display:"flex", alignItems:"center",
          justifyContent:"center", gap:8,
          boxShadow:`0 4px 20px ${C.tealGlow}`,
          WebkitTapHighlightColor:"transparent" }}>
        <span>✨</span>
        <span>HUI Match</span>
      </button>
    </div>
  );
}

/* ── DIVIDER — breathing space between cards ────────────────────────────── */
function CardDivider({ label, accent }) {
  return (
    <div style={{ padding:"28px 28px 8px",
      display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(90deg,${accent}40,transparent)` }}/>
      <span style={{ fontSize:9, fontWeight:800,
        color:accent, letterSpacing:2.5,
        textTransform:"uppercase", opacity:0.75 }}>
        {label}
      </span>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(270deg,${accent}40,transparent)` }}/>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN DISCOVERY FEED
════════════════════════════════════════════════════════════════════════ */
export default function DiscoveryFeed({ onView, onBook, onImpact, onMatch, onMap }) {
  return (
    <>
      <style>{CSS}</style>
      <div className="df-scroll"
        style={{
          background:C.creamWarm,
          overflowY:"auto",
          height:"100%",
          WebkitOverflowScrolling:"touch",
          scrollSnapType:"none", // organic scroll, not forced snap
          paddingBottom:110,
        }}>

        {/* ── SEARCH HEADER ── */}
        <SearchHeader onMatch={onMatch} onMap={onMap}/>

        {/* ── DISCOVERY FEED — curated rhythm ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>

          {FEED_ITEMS.map((item, i) => {
            const divLabel =
              item.type==="wirker"     ? "Menschen" :
              item.type==="werk"       ? "Werke" :
              item.type==="experience" ? "Erlebnisse" : "Impact";
            const divAccent =
              item.type==="wirker"     ? C.teal :
              item.type==="werk"       ? C.coral :
              item.type==="experience" ? C.gold : C.green;

            // Every 3rd card gets more breathing room
            const extraPad = i > 0 && i % 3 === 0;

            return (
              <div key={item.id}>
                {/* Divider before each card (not first) */}
                {i > 0 && (
                  <CardDivider label={divLabel} accent={divAccent}/>
                )}

                {/* Extra breathing space */}
                {extraPad && <div style={{ height:8 }}/>}

                {/* Card */}
                <div style={{ padding:"0 16px" }}>
                  {item.type === "wirker" && (
                    <WirkerCard item={item} onView={onView} index={i}/>
                  )}
                  {item.type === "werk" && (
                    <WerkCard item={item} onView={onView} index={i}/>
                  )}
                  {item.type === "experience" && (
                    <ExperienceCard item={item} onView={onView} index={i}/>
                  )}
                  {item.type === "impact" && (
                    <ImpactCard item={item} onImpact={onImpact} index={i}/>
                  )}
                </div>
              </div>
            );
          })}

          {/* Feed end — peaceful */}
          <div style={{ padding:"48px 28px 0", textAlign:"center" }}>
            <div style={{ width:40, height:1,
              background:C.teal, margin:"0 auto 16px",
              opacity:0.4 }}/>
            <div style={{ fontSize:13, color:C.muted,
              lineHeight:1.7, fontStyle:"italic",
              maxWidth:220, margin:"0 auto" }}>
              Das war es für heute. Morgen warten neue Menschen und Momente.
            </div>
            <div style={{ fontSize:24, marginTop:16,
              animation:"dfBreath 4s ease-in-out infinite" }}>🌿</div>
          </div>
        </div>

      </div>
    </>
  );
}

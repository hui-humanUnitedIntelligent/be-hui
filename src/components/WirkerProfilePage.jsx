// WirkerProfilePage.jsx — Full-screen cinematic Wirker profile
// Opened as a full overlay from Home feed
import React, { useState, useRef, useEffect } from "react";

const C = {
  teal:      "#16D7C5",
  teal2:     "#11C5B7",
  tealPale:  "#E6FAF8",
  tealGlow:  "rgba(22,215,197,0.20)",
  coral:     "#FF8A6B",
  coral2:    "#FF7B72",
  coralPale: "#FFF2EE",
  cream:     "#F9F6F2",
  creamWarm: "#FFF9F4",
  card:      "#FFFFFF",
  ink:       "#1A1A1A",
  ink2:      "#3A3A3A",
  muted:     "#888",
  muted2:    "#BBB",
  border:    "rgba(0,0,0,0.06)",
  gold:      "#F59E0B",
  green:     "#10B981",
};

/* ── Mock rich data for demo wirkers ── */
const WIRKER_DATA = {
  default: {
    name:"Lea Sommer",
    talent:"Fotografin",
    city:"München",
    tagline:"Ich fange das Licht ein, bevor es verschwindet.",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=90",
    verified:true,
    memberSince:"2023",
    recommendations:34,
    connections:312,
    impactEur:128.50,
    story:`Fotografie ist für mich keine Technik — es ist Gegenwart. 
Der Moment, in dem das Licht fällt. Die Stille zwischen zwei Atemzügen. Das echte Lächeln, das niemand erwartet.

Ich arbeite mit natürlichem Licht, echter Umgebung und echten Menschen. Keine Kulissen. Keine Masken. Nur das, was wirklich ist.`,
    werke:[
      {
        title:"Portrait im goldenen Licht",
        desc:"Dokumentarische Portraits in natürlicher Umgebung.",
        price:"ab 280 €",
        img:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=700&q=90",
      },
      {
        title:"Hochzeitsreportage",
        desc:"Der schönste Tag — ehrlich und emotional festgehalten.",
        price:"ab 1.800 €",
        img:"https://images.unsplash.com/photo-1519741497674-611481863552?w=700&q=90",
      },
      {
        title:"Zwischen Licht und Wellen",
        desc:"Limitierter Fine-Art-Druck. Handgefertigt auf Hahnemühle.",
        price:"€ 320",
        img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=90",
      },
    ],
    experiences:[
      {
        title:"Golden Hour Session",
        desc:"90 Minuten. Natürliches Licht. Ein Ort, den du liebst.",
        img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=90",
        duration:"90 Min",
        price:"ab 380 €",
      },
      {
        title:"Foto-Walk München",
        desc:"Wir gehen zusammen durch die Stadt und entdecken dein Bild.",
        img:"https://images.unsplash.com/photo-1444084316824-dc26d6657664?w=700&q=90",
        duration:"2–3 Std",
        price:"ab 220 €",
      },
    ],
    recommendations:[
      {
        name:"Maria K.",
        city:"München",
        text:"Lea hat etwas Besonderes — sie macht dich vergessen, dass du fotografiert wirst. Die Bilder sind atemberaubend.",
        img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
        werk:"Portrait-Session",
        date:"März 2026",
      },
      {
        name:"Jonas W.",
        city:"Berlin",
        text:"Unsere Hochzeitsbilder haben meine Mutter zum Weinen gebracht. Nicht aus Mitleid — vor Schönheit.",
        img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
        werk:"Hochzeitsreportage",
        date:"Januar 2026",
      },
      {
        name:"Sophie B.",
        city:"Hamburg",
        text:"Ich habe das Bild in meinem Wohnzimmer hängen. Jedes Mal, wenn ich es anschaue, berührt es mich neu.",
        img:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80",
        werk:"Fine-Art-Print",
        date:"Februar 2026",
      },
    ],
    impact:{
      project:"Bildung für Kinder in indigenen Gemeinden",
      country:"Kolumbien",
      img:"https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=85",
      desc:"Von jeder Buchung fließt ein Teil in echte Projekte.",
    },
    available:true,
    nextSlot:"Mo, 11. Mai · 14:00",
  },
};

function getWirkerData(w) {
  const base = WIRKER_DATA.default;
  return {
    ...base,
    name:        w.name        || base.name,
    talent:      w.talent      || base.talent,
    city:        w.city        || base.city,
    img:         w.img         || base.img,
    bg:          w.bg          || base.bg,
    quote:       w.quote,
    bio:         w.bio,
    werkeRaw:    w.werke       || [],
  };
}

/* ── Heart button ── */
function HeartBtn({ size=36, white=true }) {
  const [liked, setLiked] = useState(false);
  const [pop,   setPop]   = useState(false);
  return (
    <button
      onClick={e=>{ e.stopPropagation(); setPop(true);
        setTimeout(()=>setPop(false),360); setLiked(p=>!p); }}
      style={{ width:size, height:size, borderRadius:"50%",
        background:white?"rgba(255,255,255,0.20)":C.card,
        backdropFilter:"blur(10px)",
        border:`1px solid ${white?"rgba(255,255,255,0.30)":C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontSize:size*0.44, lineHeight:1,
        transform:pop?"scale(1.4)":"scale(1)",
        transition:"transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        WebkitTapHighlightColor:"transparent" }}>
      {liked ? "❤️" : "🤍"}
    </button>
  );
}

/* ═══════════════════════════════════════════
   BOOKING SHEET — floats up from bottom
═══════════════════════════════════════════ */
function BookingSheet({ wirker, onClose, onBook }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:"rgba(10,10,10,0.55)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.creamWarm, borderRadius:"28px 28px 0 0",
        padding:"20px 24px max(32px,env(safe-area-inset-bottom))",
        animation:"slideUp 0.34s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <div style={{ width:44, height:4, borderRadius:999,
            background:"rgba(0,0,0,0.1)" }}/>
        </div>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5, marginBottom:4 }}>
          Anfrage senden
        </div>
        <div style={{ fontSize:14, color:C.muted, marginBottom:24 }}>
          an {wirker.name} · {wirker.talent}
        </div>

        {/* Next slot */}
        {wirker.nextSlot && (
          <div style={{ display:"flex", alignItems:"center", gap:12,
            padding:"14px 16px", background:C.tealPale,
            borderRadius:18, marginBottom:16 }}>
            <span style={{ fontSize:22 }}>📅</span>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:2 }}>
                Nächster freier Termin
              </div>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
                {wirker.nextSlot}
              </div>
            </div>
          </div>
        )}

        <textarea rows={3}
          placeholder="Beschreibe kurz was du dir vorstellst…"
          style={{ width:"100%", boxSizing:"border-box",
            padding:"14px 16px", fontSize:14, color:C.ink,
            background:C.card, border:`1.5px solid ${C.border}`,
            borderRadius:18, outline:"none", resize:"none",
            fontFamily:"inherit", lineHeight:1.6, marginBottom:16 }}
          onFocus={e=>{ e.target.style.borderColor=C.teal;
            e.target.style.boxShadow=`0 0 0 3px ${C.tealGlow}`; }}
          onBlur={e=>{ e.target.style.borderColor=C.border;
            e.target.style.boxShadow="none"; }}/>

        <button onClick={()=>{ onBook&&onBook(wirker); onClose(); }}
          style={{ width:"100%", padding:"16px",
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", borderRadius:18, fontSize:16, fontWeight:900,
            color:"white", cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 6px 24px ${C.tealGlow}`,
            WebkitTapHighlightColor:"transparent" }}>
          Anfrage absenden
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function WirkerProfilePage({ wirker: rawWirker, onClose, onBook }) {
  const w = getWirkerData(rawWirker || {});
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab,   setActiveTab]   = useState("werke");
  const scrollRef = useRef(null);

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform:translateY(100%); opacity:0; }
          to   { transform:translateY(0);    opacity:1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        .wp-scroll::-webkit-scrollbar { display:none; }
        .wp-scroll { -ms-overflow-style:none; scrollbar-width:none; }
        .wp-tap { transition:transform 0.18s cubic-bezier(0.34,1.4,0.64,1); }
        .wp-tap:active { transform:scale(0.96); }
      `}</style>

      <div style={{ position:"fixed", inset:0, zIndex:300,
        background:C.cream, overflowY:"auto",
        animation:"fadeIn 0.25s ease both" }}
        className="wp-scroll" ref={scrollRef}>

        {/* ══ 1. CINEMATIC HERO ══════════════════════════ */}
        <div style={{ position:"relative", height:"65vh",
          minHeight:400, maxHeight:580 }}>

          {/* Full-bleed background image */}
          <img src={w.bg} alt={w.name}
            style={{ position:"absolute", inset:0,
              width:"100%", height:"100%", objectFit:"cover",
              filter:"brightness(0.65) saturate(1.15)" }}/>

          {/* Cinematic gradient overlay */}
          <div style={{ position:"absolute", inset:0,
            background:`
              linear-gradient(to bottom,
                rgba(0,0,0,0.32) 0%,
                rgba(0,0,0,0.0) 30%,
                rgba(10,5,0,0.20) 60%,
                rgba(10,5,0,0.82) 100%),
              linear-gradient(to right,
                rgba(22,215,197,0.12) 0%,
                transparent 60%)
            ` }}/>

          {/* Back + options — top controls */}
          <div style={{ position:"absolute", top:0, left:0, right:0,
            padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
            display:"flex", justifyContent:"space-between",
            alignItems:"flex-start" }}>
            <button onClick={onClose}
              style={{ width:42, height:42, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)",
                backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,0.28)",
                cursor:"pointer", fontSize:17, color:"white",
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>←</button>
            <div style={{ display:"flex", gap:10 }}>
              <HeartBtn size={42}/>
              <button style={{ width:42, height:42, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)",
                backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,0.28)",
                cursor:"pointer", color:"white", fontSize:18,
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>↗</button>
            </div>
          </div>

          {/* Bottom of hero — identity */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0,
            padding:"0 24px 28px" }}>

            {/* Teal verified pill */}
            {w.verified && (
              <div style={{ display:"inline-flex", alignItems:"center",
                gap:5, background:"rgba(22,215,197,0.22)",
                backdropFilter:"blur(8px)",
                border:"1px solid rgba(22,215,197,0.40)",
                borderRadius:999, padding:"4px 12px",
                marginBottom:12 }}>
                <span style={{ width:6, height:6, borderRadius:"50%",
                  background:C.teal, display:"inline-block",
                  boxShadow:`0 0 6px ${C.teal}` }}/>
                <span style={{ fontSize:11, color:C.teal,
                  fontWeight:700 }}>Verifizierter Wirker</span>
              </div>
            )}

            {/* Name */}
            <div style={{ fontWeight:900, fontSize:36, color:"white",
              letterSpacing:-1.2, lineHeight:1.1, marginBottom:6 }}>
              {w.name}
            </div>

            {/* Talent + city */}
            <div style={{ display:"flex", alignItems:"center",
              gap:12, marginBottom:16 }}>
              <span style={{ fontSize:15, color:"rgba(255,255,255,0.88)",
                fontWeight:600 }}>{w.talent}</span>
              <span style={{ width:3, height:3, borderRadius:"50%",
                background:"rgba(255,255,255,0.4)",
                display:"inline-block" }}/>
              <span style={{ fontSize:13,
                color:"rgba(255,255,255,0.65)" }}>📍 {w.city}</span>
            </div>

            {/* Tagline — big, editorial */}
            <div style={{ fontSize:16, color:"rgba(255,255,255,0.82)",
              fontStyle:"italic", lineHeight:1.65,
              maxWidth:320 }}>
              „{w.tagline || w.quote}"
            </div>
          </div>
        </div>

        {/* ══ 2. PORTRAIT + QUICK ACTIONS ═══════════════ */}
        <div style={{ background:C.card,
          padding:"0 24px",
          boxShadow:"0 -1px 0 rgba(0,0,0,0.04)" }}>

          {/* Portrait overlapping hero */}
          <div style={{ display:"flex", alignItems:"flex-end",
            justifyContent:"space-between",
            marginTop:-44, paddingBottom:0 }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:88, height:88, borderRadius:"50%",
                overflow:"hidden",
                border:"4px solid white",
                boxShadow:"0 8px 32px rgba(0,0,0,0.20)" }}>
                <img src={w.img} alt={w.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              </div>
              {/* Available dot */}
              {w.available && (
                <div style={{ position:"absolute", bottom:4, right:4,
                  width:18, height:18, borderRadius:"50%",
                  background:C.green,
                  border:"3px solid white",
                  boxShadow:"0 2px 8px rgba(16,185,129,0.4)" }}/>
              )}
            </div>

            {/* ONLY action: Anfragen — no chat button */}
            <button onClick={()=>setShowBooking(true)}
              style={{ padding:"13px 28px",
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                border:"none", borderRadius:999, fontSize:15, fontWeight:800,
                color:"white", cursor:"pointer", fontFamily:"inherit",
                boxShadow:`0 6px 24px ${C.tealGlow}`,
                WebkitTapHighlightColor:"transparent",
                marginBottom:4 }}>
              Anfragen
            </button>
          </div>

          {/* Availability */}
          {w.available && w.nextSlot && (
            <div style={{ display:"flex", alignItems:"center",
              gap:8, padding:"12px 0 0",
              fontSize:12, color:C.green, fontWeight:600 }}>
              <span style={{ width:7, height:7, borderRadius:"50%",
                background:C.green,
                boxShadow:`0 0 6px ${C.green}` }}/>
              Verfügbar · Nächster Slot: {w.nextSlot}
            </div>
          )}

          <div style={{ height:24 }}/>
        </div>

        {/* ══ 3. STORY — über den Wirker ════════════════ */}
        <div style={{ background:C.card,
          padding:"32px 24px 36px",
          borderTop:`1px solid ${C.border}` }}>

          <div style={{ fontWeight:800, fontSize:13,
            color:C.teal, letterSpacing:1.5,
            textTransform:"uppercase", marginBottom:16 }}>
            Über {w.name.split(" ")[0]}
          </div>

          <div style={{ fontSize:16, color:C.ink2, lineHeight:1.85,
            whiteSpace:"pre-line", fontWeight:400 }}>
            {w.story || w.bio}
          </div>

          {/* Soft divider */}
          <div style={{ margin:"28px 0 0",
            height:1, background:`linear-gradient(to right,
              ${C.teal}40, ${C.coral}30, transparent)` }}/>
        </div>

        {/* ══ 4. TABS — Werke / Erlebnisse / Empfehlungen ══ */}
        <div style={{ background:C.card, position:"sticky",
          top:0, zIndex:10,
          borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex" }}>
            {[
              {key:"werke",        label:"Werke"},
              {key:"erlebnisse",   label:"Erlebnisse"},
              {key:"empfehlungen", label:"Empfehlungen"},
            ].map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                style={{ flex:1, padding:"15px 4px", background:"none",
                  border:"none", cursor:"pointer",
                  borderBottom:activeTab===t.key
                    ?`2.5px solid ${C.teal}`
                    :"2.5px solid transparent",
                  fontSize:13, fontWeight:activeTab===t.key?800:500,
                  color:activeTab===t.key?C.teal:C.muted,
                  transition:"all 0.2s",
                  WebkitTapHighlightColor:"transparent" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ 5a. WERKE ═════════════════════════════════ */}
        {activeTab==="werke" && (
          <div style={{ padding:"28px 20px 40px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {w.werke.map((wk,i)=>(
                <div key={i} className="wp-tap"
                  style={{ borderRadius:24, overflow:"hidden",
                    background:C.card,
                    boxShadow:"0 4px 24px rgba(0,0,0,0.09)",
                    cursor:"pointer",
                    animation:`fadeUp 0.5s ${i*0.09}s both` }}>

                  {/* Large gallery image */}
                  <div style={{ height:240, position:"relative",
                    overflow:"hidden" }}>
                    <img src={wk.img} alt={wk.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover",
                        transition:"transform 0.6s ease" }}/>
                    <div style={{ position:"absolute", inset:0,
                      background:`linear-gradient(to bottom,
                        rgba(255,138,107,0.05) 0%,
                        transparent 50%,
                        rgba(0,0,0,0.45) 100%)` }}/>
                    {/* Price */}
                    <div style={{ position:"absolute", bottom:14, right:14 }}>
                      <div style={{ background:"rgba(255,255,255,0.92)",
                        backdropFilter:"blur(8px)", borderRadius:999,
                        padding:"5px 14px", fontSize:13, fontWeight:900,
                        color:C.ink }}>
                        {wk.price}
                      </div>
                    </div>
                  </div>

                  {/* Text — editorial */}
                  <div style={{ padding:"18px 20px 20px" }}>
                    <div style={{ fontWeight:800, fontSize:17, color:C.ink,
                      letterSpacing:-0.3, marginBottom:6 }}>
                      {wk.title}
                    </div>
                    <div style={{ fontSize:14, color:C.muted,
                      lineHeight:1.65, marginBottom:16 }}>
                      {wk.desc}
                    </div>
                    <button onClick={()=>setShowBooking(true)}
                      style={{ width:"100%", padding:"13px",
                        background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                        border:"none", borderRadius:14, fontSize:14,
                        fontWeight:800, color:"white", cursor:"pointer",
                        fontFamily:"inherit",
                        boxShadow:`0 4px 16px ${C.tealGlow}`,
                        WebkitTapHighlightColor:"transparent" }}>
                      Anfragen →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ 5b. ERLEBNISSE ════════════════════════════ */}
        {activeTab==="erlebnisse" && (
          <div style={{ padding:"28px 20px 40px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {w.experiences.map((ex,i)=>(
                <div key={i} className="wp-tap"
                  style={{ borderRadius:24, overflow:"hidden",
                    background:C.card,
                    boxShadow:"0 4px 24px rgba(0,0,0,0.09)",
                    cursor:"pointer",
                    animation:`fadeUp 0.5s ${i*0.09}s both` }}>

                  <div style={{ height:210, position:"relative" }}>
                    <img src={ex.img} alt={ex.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover",
                        filter:"brightness(0.82) saturate(1.1)" }}/>
                    <div style={{ position:"absolute", inset:0,
                      background:"linear-gradient(to bottom,rgba(22,215,197,0.08) 0%,rgba(0,0,0,0.55) 100%)"}}/>
                    {/* Duration badge */}
                    <div style={{ position:"absolute", top:14, left:14 }}>
                      <div style={{ background:"rgba(255,255,255,0.20)",
                        backdropFilter:"blur(10px)",
                        border:"1px solid rgba(255,255,255,0.30)",
                        borderRadius:999, padding:"5px 13px",
                        fontSize:11, fontWeight:700, color:"white" }}>
                        ⏱ {ex.duration}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding:"18px 20px 20px" }}>
                    <div style={{ fontWeight:800, fontSize:17, color:C.ink,
                      letterSpacing:-0.3, marginBottom:6 }}>
                      {ex.title}
                    </div>
                    <div style={{ fontSize:14, color:C.muted,
                      lineHeight:1.65, marginBottom:16 }}>
                      {ex.desc}
                    </div>
                    <div style={{ display:"flex", alignItems:"center",
                      justifyContent:"space-between" }}>
                      <div style={{ fontWeight:800, fontSize:16, color:C.teal }}>
                        {ex.price}
                      </div>
                      <button onClick={()=>setShowBooking(true)}
                        style={{ padding:"11px 22px",
                          background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                          border:"none", borderRadius:14, fontSize:13,
                          fontWeight:800, color:"white", cursor:"pointer",
                          fontFamily:"inherit",
                          boxShadow:`0 4px 14px ${C.tealGlow}`,
                          WebkitTapHighlightColor:"transparent" }}>
                        Anfragen →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ 5c. EMPFEHLUNGEN ══════════════════════════ */}
        {activeTab==="empfehlungen" && (
          <div style={{ padding:"28px 20px 40px" }}>
            {/* Header */}
            <div style={{ fontWeight:800, fontSize:13,
              color:C.teal, letterSpacing:1.5,
              textTransform:"uppercase", marginBottom:6 }}>
              Was Menschen sagen
            </div>
            <div style={{ fontSize:14, color:C.muted,
              marginBottom:28, lineHeight:1.6 }}>
              {w.recommendations.length} verifizierte Empfehlungen
            </div>

            <div style={{ display:"flex",
              flexDirection:"column", gap:24 }}>
              {w.recommendations.map((rec,i)=>(
                <div key={i}
                  style={{ animation:`fadeUp 0.5s ${i*0.1}s both` }}>

                  {/* Quote — editorial */}
                  <div style={{ fontSize:18, color:C.ink, lineHeight:1.7,
                    fontStyle:"italic", fontWeight:500,
                    marginBottom:16,
                    padding:"0 0 0 20px",
                    borderLeft:`3px solid ${C.teal}` }}>
                    „{rec.text}"
                  </div>

                  {/* Reviewer */}
                  <div style={{ display:"flex", alignItems:"center",
                    gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:"50%",
                      overflow:"hidden",
                      border:`2px solid ${C.tealPale}` }}>
                      <img src={rec.img} alt={rec.name}
                        style={{ width:"100%", height:"100%",
                          objectFit:"cover" }}/>
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14,
                        color:C.ink }}>{rec.name}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                        {rec.werk} · {rec.date}
                      </div>
                    </div>
                    {/* Verified badge */}
                    <div style={{ marginLeft:"auto",
                      background:C.tealPale,
                      borderRadius:999, padding:"3px 10px",
                      fontSize:10, fontWeight:700, color:C.teal }}>
                      ✓ Verifiziert
                    </div>
                  </div>

                  {/* Soft divider */}
                  {i < w.recommendations.length-1 && (
                    <div style={{ marginTop:24, height:1,
                      background:`linear-gradient(to right,
                        ${C.border}, transparent)` }}/>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ 6. IMPACT SEKTION ═════════════════════════ */}
        <div style={{ margin:"0 20px 32px",
          borderRadius:24, overflow:"hidden", position:"relative" }}>
          <img src={w.impact.img} alt="Impact"
            style={{ width:"100%", height:180, objectFit:"cover",
              filter:"brightness(0.6) saturate(1.1)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(160deg,
              rgba(22,215,197,0.55) 0%,
              rgba(255,138,107,0.40) 100%)` }}/>
          <div style={{ position:"absolute", inset:0,
            display:"flex", flexDirection:"column",
            justifyContent:"flex-end", padding:"20px" }}>
            <div style={{ fontSize:11, fontWeight:700,
              color:"rgba(255,255,255,0.75)", letterSpacing:1,
              textTransform:"uppercase", marginBottom:6 }}>
              Impact Engagement
            </div>
            <div style={{ fontWeight:900, fontSize:18, color:"white",
              letterSpacing:-0.3, lineHeight:1.2, marginBottom:4 }}>
              {w.impact.project}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)",
              marginBottom:8 }}>📍 {w.impact.country}</div>
            <div style={{ fontSize:14, fontWeight:800, color:C.teal }}>
              € {w.impactEur.toFixed(2)} gemeinsam bewegt
            </div>
          </div>
        </div>

        {/* ══ 7. STICKY BOTTOM CTA ══════════════════════ */}
        <div style={{ position:"sticky", bottom:0,
          background:"rgba(249,246,242,0.97)",
          backdropFilter:"blur(20px)",
          borderTop:`1px solid ${C.border}`,
          padding:"14px 24px max(20px,env(safe-area-inset-bottom))",
          display:"flex", alignItems:"center", gap:12 }}>

          {/* Avatar small */}
          <div style={{ width:40, height:40, borderRadius:"50%",
            overflow:"hidden", flexShrink:0 }}>
            <img src={w.img} alt={w.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:13,
              color:C.ink, overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {w.name}
            </div>
            <div style={{ fontSize:11, color:C.green, fontWeight:600 }}>
              {w.available ? "✓ Verfügbar" : "Auf Anfrage"}
            </div>
          </div>

          <button onClick={()=>setShowBooking(true)}
            style={{ padding:"13px 28px",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:999, fontSize:15, fontWeight:900,
              color:"white", cursor:"pointer", fontFamily:"inherit",
              boxShadow:`0 6px 24px ${C.tealGlow}`,
              flexShrink:0,
              WebkitTapHighlightColor:"transparent" }}>
            Anfragen
          </button>
        </div>

      </div>

      {/* Booking sheet */}
      {showBooking && (
        <BookingSheet
          wirker={w}
          onClose={()=>setShowBooking(false)}
          onBook={onBook}
        />
      )}
    </>
  );
}

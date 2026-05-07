// DiscoverPage.jsx — Experiences & Veranstaltungen entdecken
import React, { useState } from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#3DB87A",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .dp-scroll::-webkit-scrollbar{display:none}
  .dp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .dp-tap{transition:transform .18s cubic-bezier(.34,1.4,.64,1)}
  .dp-tap:active{transform:scale(.965)}
`;

const EXPERIENCES = [
  {id:1,title:"Yoga bei Sonnenaufgang",creator:"Nina B.",city:"Stuttgart",lat:48.78,lng:9.20,
   date:"Sa, 9. Mai",time:"06:30 Uhr",price:35,spots:8,
   img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=90",
   duration:"75 Min",category:"Wellness",
   desc:"Morgen-Yoga im Park. Sonnenaufgang, Stille, Gemeinschaft."},
  {id:2,title:"Töpferkurs am See",creator:"David Weber",city:"Starnberg",
   date:"So, 10. Mai",time:"10:00 Uhr",price:85,spots:4,
   img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=90",
   duration:"3 Std",category:"Handwerk",
   desc:"Töpfern am Ufer des Starnberger Sees. Natur und Handwerk verbunden."},
  {id:3,title:"Walk & Think Session",creator:"Lars G.",city:"München",
   date:"Di, 12. Mai",time:"09:00 Uhr",price:150,spots:1,
   img:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=700&q=90",
   duration:"2 Std",category:"Coaching",
   desc:"Strategie-Spaziergang durch die Stadt. Ideen brauchen Luft."},
  {id:4,title:"Gitarren-Abend am Feuer",creator:"Felix M.",city:"Frankfurt",
   date:"Fr, 15. Mai",time:"19:30 Uhr",price:55,spots:12,
   img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=90",
   duration:"2 Std",category:"Musik",
   desc:"Musik, Feuer, Gemeinschaft. Für Anfänger und Fortgeschrittene."},
  {id:5,title:"Vision Retreat",creator:"Lars G.",city:"Berchtesgaden",
   date:"Sa, 16. Mai",time:"09:00 Uhr",price:380,spots:3,
   img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=90",
   duration:"1 Tag",category:"Coaching",
   desc:"Ein Tag in den Bergen. Deine nächste Richtung klarstellen."},
  {id:6,title:"Keramik-Workshop",creator:"David Weber",city:"Hamburg",
   date:"So, 17. Mai",time:"11:00 Uhr",price:65,spots:6,
   img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=90",
   duration:"2 Std",category:"Handwerk",
   desc:"Einführung in die Welt des Töpferns. Alle Materialien inklusive."},
];

const CATS = ["Alle","Wellness","Handwerk","Coaching","Musik","Natur"];

export default function DiscoverPage({ onView, onMap }) {
  const [cat, setCat]   = useState("Alle");
  const [view, setView] = useState("grid"); // "grid" | "list"

  const shown = cat === "Alle"
    ? EXPERIENCES
    : EXPERIENCES.filter(e => e.category === cat);

  return (
    <>
      <style>{CSS}</style>
      <div className="dp-scroll"
        style={{ background:C.cream, paddingBottom:110,
          overflowY:"auto", height:"100%" }}>

        {/* ── HEADER ── */}
        <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0" }}>
          <div style={{ display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", marginBottom:6 }}>
            <div>
              <div style={{ fontWeight:900, fontSize:24, color:C.ink,
                letterSpacing:-0.6, lineHeight:1.1 }}>
                Erlebnisse
              </div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                Echte Momente. Echte Menschen.
              </div>
            </div>
            {/* Map shortcut */}
            <button onClick={onMap}
              style={{ width:44, height:44, borderRadius:16,
                background:`linear-gradient(135deg,${C.teal}22,${C.coral}14)`,
                border:`1.5px solid ${C.teal}44`,
                cursor:"pointer", fontSize:20,
                display:"flex", alignItems:"center",
                justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>
              🗺
            </button>
          </div>

          {/* Category chips */}
          <div className="dp-scroll"
            style={{ display:"flex", gap:8, overflowX:"auto",
              paddingBottom:4, margin:"16px 0 20px" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding:"8px 18px", whiteSpace:"nowrap",
                  background: cat===c
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : C.card,
                  border:`1.5px solid ${cat===c ? "transparent" : C.border}`,
                  borderRadius:999, fontSize:12,
                  fontWeight: cat===c ? 800 : 500,
                  color: cat===c ? "white" : C.muted,
                  cursor:"pointer", fontFamily:"inherit",
                  boxShadow: cat===c ? \`0 2px 10px \${C.tealGlow}\` : "none",
                  transition:"all 0.2s",
                  WebkitTapHighlightColor:"transparent" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── UPCOMING HIGHLIGHT — first card big ── */}
        {shown.length > 0 && (
          <div style={{ padding:"0 20px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.teal,
              letterSpacing:1.8, textTransform:"uppercase",
              marginBottom:12 }}>Diese Woche</div>
            <div className="dp-tap" onClick={() => onView && onView(shown[0])}
              style={{ borderRadius:24, overflow:"hidden", cursor:"pointer",
                boxShadow:"0 6px 28px rgba(0,0,0,0.13)",
                animation:"fadeUp 0.4s ease both" }}>
              <div style={{ position:"relative", height:240 }}>
                <img src={shown[0].img} alt={shown[0].title}
                  style={{ width:"100%", height:"100%", objectFit:"cover",
                    filter:"brightness(0.68) saturate(1.1)" }}/>
                <div style={{ position:"absolute", inset:0,
                  background:`linear-gradient(to bottom,
                    rgba(22,215,197,0.08) 0%,
                    transparent 30%,
                    rgba(0,0,0,0.72) 100%)` }}/>
                <div style={{ position:"absolute", top:0, left:0,
                  right:0, height:3,
                  background:\`linear-gradient(90deg,\${C.gold},transparent)\` }}/>
                {/* Spots */}
                {shown[0].spots <= 4 && (
                  <div style={{ position:"absolute", top:14, right:14 }}>
                    <div style={{ background:"rgba(255,138,107,0.22)",
                      backdropFilter:"blur(8px)",
                      border:"1px solid rgba(255,138,107,0.40)",
                      borderRadius:999, padding:"4px 12px",
                      fontSize:10, fontWeight:700, color:C.coral }}>
                      🔥 Noch {shown[0].spots} Plätze
                    </div>
                  </div>
                )}
                <div style={{ position:"absolute", bottom:0,
                  left:0, right:0, padding:"0 20px 18px" }}>
                  <div style={{ fontWeight:900, fontSize:20, color:"white",
                    letterSpacing:-0.4, marginBottom:4 }}>{shown[0].title}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.78)" }}>
                      📅 {shown[0].date} · {shown[0].time}
                    </span>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.78)" }}>
                      ⏱ {shown[0].duration}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginTop:8 }}>
                    <span style={{ fontSize:13, color:"rgba(255,255,255,0.72)" }}>
                      {shown[0].creator} · {shown[0].city}
                    </span>
                    <div style={{ background:"rgba(255,255,255,0.92)",
                      backdropFilter:"blur(8px)", borderRadius:999,
                      padding:"5px 14px", fontSize:13,
                      fontWeight:900, color:C.ink }}>
                      ab € {shown[0].price}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REST — compact list cards ── */}
        {shown.length > 1 && (
          <div style={{ padding:"0 20px 8px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.teal,
              letterSpacing:1.8, textTransform:"uppercase",
              marginBottom:12 }}>Alle Erlebnisse</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {shown.slice(1).map((ex, i) => (
                <div key={ex.id} className="dp-tap"
                  onClick={() => onView && onView(ex)}
                  style={{ background:C.card, borderRadius:20,
                    overflow:"hidden", cursor:"pointer",
                    boxShadow:"0 3px 16px rgba(0,0,0,0.08)",
                    display:"flex", height:100,
                    animation:\`fadeUp 0.4s \${i*0.06}s both\` }}>
                  {/* Thumbnail */}
                  <div style={{ width:100, flexShrink:0, position:"relative" }}>
                    <img src={ex.img} alt={ex.title}
                      style={{ width:"100%", height:"100%",
                        objectFit:"cover",
                        filter:"brightness(0.82) saturate(1.1)" }}/>
                    <div style={{ position:"absolute", top:0, bottom:0,
                      left:0, width:3,
                      background:ex.category==="Wellness"?C.teal
                        :ex.category==="Handwerk"?C.coral
                        :ex.category==="Coaching"?C.gold
                        :ex.category==="Musik"?C.green:C.teal }}/>
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, padding:"12px 14px",
                    display:"flex", flexDirection:"column",
                    justifyContent:"space-between", overflow:"hidden" }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:14,
                        color:C.ink, lineHeight:1.3,
                        marginBottom:2 }}>{ex.title}</div>
                      <div style={{ fontSize:11, color:C.muted }}>
                        {ex.creator} · 📍 {ex.city}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center",
                      justifyContent:"space-between" }}>
                      <span style={{ fontSize:11, color:C.muted2 }}>
                        {ex.date} · {ex.time}
                      </span>
                      <span style={{ fontWeight:800, fontSize:13,
                        color:C.teal }}>ab € {ex.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Map CTA strip ── */}
        <div style={{ margin:"24px 20px 0",
          borderRadius:22, overflow:"hidden", position:"relative",
          cursor:"pointer" }} onClick={onMap}>
          <div style={{ height:90,
            background:\`linear-gradient(135deg,\${C.teal}22,\${C.coral}14)\`,
            border:\`1.5px solid \${C.teal}30\`,
            borderRadius:22,
            display:"flex", alignItems:"center",
            gap:16, padding:"0 20px" }}>
            <div style={{ width:48, height:48, borderRadius:16,
              background:\`linear-gradient(135deg,\${C.teal},\${C.teal2})\`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:22,
              boxShadow:\`0 4px 14px \${C.tealGlow}\` }}>
              🗺
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
                Auf der Karte entdecken
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                Wirker, Werke & Erlebnisse in deiner Nähe
              </div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:18,
              color:C.teal }}>›</div>
          </div>
        </div>
      </div>
    </>
  );
}

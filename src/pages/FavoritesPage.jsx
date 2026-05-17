import React, { useState } from "react";

const C = {
  teal:"#16D3C5", tealPale:"#E6FAF8",
  coral:"#FF7043", coralPale:"#FFF0EC",
  gold:"#FFB300",
  bg:"#FFFFFF", bg2:"#F5F5F5", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#333333",
  muted:"#888888", border:"#EEEEEE", border2:"#E0E0E0",
};

const WIRKER_FAVS = [
  { name:"Lena K.", talent:"Keramik & Töpfern",
    img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    location:"München", rec:34, price:"45 €/h", verified:true, online:true,
    nextSlot:"Morgen, 10:00" },
  { name:"Marco B.", talent:"Gitarrenunterricht",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    location:"Berlin", rec:21, price:"55 €/h", verified:true, online:false,
    nextSlot:"Fr, 16:00" },
  { name:"Sophie M.", talent:"Yoga & Meditation",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    location:"Hamburg", rec:58, price:"40 €/h", verified:true, online:true,
    nextSlot:"Heute, 18:00" },
];
const WERK_FAVS = [
  { name:"Handgemachte Vase", creator:"Sofia M.", price:"65 €",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&q=80" },
  { name:"Leder-Rucksack", creator:"Tom H.", price:"195 €",
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80" },
  { name:"Aquarell-Druck A3", creator:"Lena K.", price:"55 €",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=80" },
  { name:"Keramik-Tassen-Set", creator:"Sofia M.", price:"89 €",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&q=80" },
];
const IMPACT_FAVS = [
  { name:"Schule für alle", country:"Uganda", category:"Kinder & Bildung",
    progress:70, goal:"3.500 €" },
  { name:"Wald schützen", country:"Kenia", category:"Natur & Umwelt",
    progress:45, goal:"4.200 €" },
];

export default function FavoritesPage() {
  const [tab, setTab] = useState("wirker");
  const tabs = [
    { key:"wirker", label:"✨ Wirker", count:3 },
    { key:"werke",  label:"🎁 Werke",  count:4 },
    { key:"impact", label:"🌱 Impact", count:2 },
  ];

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Header */}
      <div style={{ padding:"18px 16px 6px",
        display:"flex", alignItems:"center",
        justifyContent:"space-between" }}>
        <div>
          <div style={{ fontWeight:900, fontSize:22, color:C.ink }}>Meine Favoriten</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>9 gespeicherte Einträge</div>
        </div>
        <span style={{ fontSize:28 }}>⭐</span>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", padding:"8px 16px 0", gap:0,
        borderBottom:`1px solid ${C.border}` }}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ flex:1, padding:"10px 4px", background:"none",
              border:"none", cursor:"pointer",
              borderBottom:tab===t.key?`2.5px solid ${C.coral}`:"2.5px solid transparent",
              fontSize:13, fontWeight:tab===t.key?800:500,
              color:tab===t.key?C.coral:C.muted,
              transition:"all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */,
              WebkitTapHighlightColor:"transparent" }}>
            {t.label} <span style={{ fontWeight:800 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Wirker List */}
      {tab==="wirker" && (
        <div style={{ padding:"12px 16px" }}>
          {WIRKER_FAVS.map((w,i)=>(
            <div key={i} className="hui-card"
              style={{ marginBottom:12, padding:"14px 16px",
                borderLeft:`3.5px solid ${C.teal}` }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  <div style={{ width:52, height:52, borderRadius:"50%",
                    overflow:"hidden" }}>
                    <img src={w.img} alt={w.name}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  <div style={{ position:"absolute", bottom:1, right:1,
                    width:12, height:12, borderRadius:"50%",
                    background:w.online?"#4CAF50":"#ccc",
                    border:"2px solid white" }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center",
                    gap:6, marginBottom:2 }}>
                    <span style={{ fontWeight:800, fontSize:15, color:C.ink }}>{w.name}</span>
                    {w.verified && <span style={{ fontSize:11,
                      color:C.teal, fontWeight:700 }}>✓ Talent</span>}
                    <span style={{ marginLeft:"auto", fontSize:18, color:C.gold }}>★</span>
                  </div>
                  <div style={{ fontSize:13, color:C.teal, fontWeight:600 }}>{w.talent}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                    📍 {w.location} · 👥 {w.rec} · 💰 {w.price}
                  </div>
                  <div style={{ fontSize:12, color:C.teal, marginTop:5,
                    display:"flex", alignItems:"center", gap:4 }}>
                    <span>🕐</span> Nächster freier Termin: {w.nextSlot}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button style={{ flex:1, padding:"9px",
                  background:C.bg2, border:`1px solid ${C.border2}`,
                  borderRadius:10, fontSize:13, fontWeight:600, color:C.ink2,
                  cursor:"pointer", WebkitTapHighlightColor:"transparent" }}>
                  Profil ansehen
                </button>
                <button style={{ flex:1.5, padding:"9px",
                  background:`linear-gradient(135deg, ${C.coral}, #FF8A65)`,
                  border:"none", borderRadius:10,
                  fontSize:13, fontWeight:800, color:"white",
                  cursor:"pointer", boxShadow:`0 3px 10px ${C.coral}35`,
                  WebkitTapHighlightColor:"transparent",
                  display:"flex", alignItems:"center",
                  justifyContent:"center", gap:5 }}>
                  📅 Termin buchen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Werke Grid */}
      {tab==="werke" && (
        <div style={{ padding:"12px 16px",
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {WERK_FAVS.map((w,i)=>(
            <div key={i} className="hui-card hui-card-tap" style={{ overflow:"hidden" }}>
              <div style={{ height:130, overflow:"hidden" }}>
                <img src={w.img} alt={w.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ padding:"8px 10px 10px" }}>
                <div style={{ fontWeight:700, fontSize:13, color:C.ink, marginBottom:3 }}>
                  {w.name}
                </div>
                <div style={{ fontSize:11, color:C.teal, fontWeight:600 }}>{w.creator}</div>
                <div style={{ fontWeight:800, fontSize:14, color:C.coral, marginTop:4 }}>
                  {w.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Impact */}
      {tab==="impact" && (
        <div style={{ padding:"12px 16px" }}>
          {IMPACT_FAVS.map((p,i)=>(
            <div key={i} className="hui-card" style={{ marginBottom:12, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:C.ink }}>{p.name}</div>
                  <div style={{ display:"flex", gap:6, marginTop:4 }}>
                    <span style={{ background:C.tealPale, color:"#0A9B90",
                      borderRadius:999, padding:"2px 9px", fontSize:11, fontWeight:700 }}>
                      {p.category}
                    </span>
                    <span style={{ background:C.bg2, color:C.muted,
                      borderRadius:999, padding:"2px 9px", fontSize:11, fontWeight:600 }}>
                      📍 {p.country}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:12, color:C.muted, marginBottom:5 }}>
                  <span>Wunschbetrag</span>
                  <span style={{ fontWeight:700, color:C.teal }}>{p.goal}</span>
                </div>
                <div style={{ background:C.border, borderRadius:999, height:7 }}>
                  <div style={{ height:"100%", borderRadius:999,
                    background:`linear-gradient(90deg, ${C.teal}, ${C.teal}AA)`,
                    width:`${p.progress}%`, transition:"width 1s" }} />
                </div>
              </div>
              <button style={{ width:"100%", padding:"11px",
                background:`linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
                border:"none", borderRadius:12,
                fontSize:13, fontWeight:800, color:"white",
                cursor:"pointer", boxShadow:`0 3px 10px rgba(22,211,197,0.3)`,
                WebkitTapHighlightColor:"transparent" }}>
                🌱 Für dieses Projekt stimmen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

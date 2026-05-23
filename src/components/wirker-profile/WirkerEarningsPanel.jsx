// WirkerEarningsPanel.jsx — Phase 24 FINAL
// Wirkungs- & Energiefluss — two-column calm operational overview
import React, { useState, useEffect, useRef } from "react";

const safeN = (v, fb=0) => (typeof v==="number"&&isFinite(v)?v:fb);
const safeArr = v => Array.isArray(v)?v:[];

function Sparkline({ vals=[], color="#0DC4B5" }) {
  const safe = vals.filter(n=>typeof n==="number"&&isFinite(n));
  if (safe.length < 2) return null;
  const max = Math.max(...safe, 1);
  const pts = safe.map((v,i)=>`${(i/(safe.length-1))*110},${24-(v/max)*20}`).join(" ");
  return (
    <svg width="110" height="26" viewBox="0 0 110 26" style={{display:"block",overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" opacity=".85"/>
    </svg>
  );
}

const SEED_BOOKS = [
  {
    title:"Atelier Workshop",sub:"Creative Nature",date:"24. Mai 2025",
    used:6,total:6,img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=100&q=70",
    av:"https://i.pravatar.cc/28?img=5",
  },
  {
    title:"1:1 Mentoring",sub:"Kreativer Flow",date:"30. Mai 2025",
    used:1,total:1,img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&q=70",
    av:"https://i.pravatar.cc/28?img=12",
  },
];

export default function WirkerEarningsPanel({ profile={}, bookings }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e])=>{ if(e.isIntersecting){setVisible(true);obs.disconnect();} },
      {threshold:0.05}
    );
    obs.observe(el);
    return ()=>obs.disconnect();
  }, []);

  const earnings  = safeN(profile?.earnings_month, 2840);
  const books     = safeN(profile?.bookings_month, 31);
  const projects  = safeN(profile?.projects_supported, 18);
  const resonance = safeN(profile?.resonance_rating, 4.8);
  const spark     = [380,640,510,860,740,1050,820,1300,990,1440,1200,earnings];
  const upcoming  = safeArr(bookings).length ? safeArr(bookings).slice(0,2) : SEED_BOOKS;

  return (
    <div ref={ref} style={{
      width:"100%", background:"white",
      padding:"20px 18px",
      borderTop:"1px solid rgba(0,0,0,.05)",
      borderBottom:"1px solid rgba(0,0,0,.05)",
      opacity:visible?1:0,
      transform:visible?"none":"translateY(14px)",
      transition:"opacity .65s ease,transform .65s ease",
    }}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>

        {/* LEFT: Einnahmen */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.02em"}}>
              Deine Einnahmen & Wirkung
            </div>
            <div style={{
              fontSize:9,color:"#888",background:"rgba(0,0,0,.05)",
              borderRadius:99,padding:"3px 8px",fontWeight:600,
            }}>Diesen Monat ▾</div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {v:`€${earnings.toLocaleString("de-DE")}`,l:"Einnahmen",c:"#0DC4B5"},
              {v:books,l:"Buchungen",c:"#6366F1"},
              {v:projects,l:"Projekte",c:"#FF8A6B"},
              {v:`${resonance} ★`,l:"Resonanz",c:"#F59E0B"},
            ].map(item=>(
              <div key={item.l}>
                <div style={{fontSize:18,fontWeight:800,color:item.c,letterSpacing:"-.04em",lineHeight:1}}>
                  {item.v}
                </div>
                <div style={{fontSize:9,color:"#999",marginTop:2,fontWeight:500}}>{item.l}</div>
              </div>
            ))}
          </div>

          <Sparkline vals={spark} color="#0DC4B5"/>
          <div style={{fontSize:10,color:"#0DC4B5",fontWeight:700,marginTop:6,cursor:"pointer"}}>
            Gesamte Statistik ansehen →
          </div>
        </div>

        {/* RIGHT: Nachste Buchungen */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.02em"}}>
              Nachste Erlebnisse
            </div>
            <span style={{fontSize:10,color:"#0DC4B5",fontWeight:700,cursor:"pointer"}}>Alle →</span>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {upcoming.map((b,i)=>{
              const pct = Math.round((safeN(b.used)/Math.max(safeN(b.total),1))*100);
              return (
                <div key={i} style={{
                  display:"flex",gap:9,alignItems:"center",
                  padding:"9px 11px",background:"#F9F7F4",
                  borderRadius:12,border:"1px solid rgba(0,0,0,.05)",
                }}>
                  <img src={b.img} alt={b.title}
                    style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0,background:"#ddd"}}
                    onError={e=>{e.target.style.display="none";}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#1A1A1A",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
                    }}>{b.title}</div>
                    <div style={{fontSize:9,color:"#888",marginTop:1}}>{b.date}</div>
                    <div style={{marginTop:4,height:3,borderRadius:3,background:"rgba(0,0,0,.07)",overflow:"hidden"}}>
                      <div style={{
                        height:"100%",borderRadius:3,
                        width:`${pct}%`,
                        background:"linear-gradient(90deg,#0DC4B5,#22DDD0)",
                        transition:"width .8s ease",
                      }}/>
                    </div>
                    <div style={{fontSize:8,color:"#888",marginTop:1}}>{b.used}/{b.total} Platze</div>
                  </div>
                  <img src={b.av} alt="" style={{width:26,height:26,borderRadius:"50%",flexShrink:0}}
                    onError={e=>{e.target.style.display="none";}}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// WirkerExperiences.jsx — Phase 24 FINAL
// Horizontal bookable experience cards — Airbnb meets creator universe
import React, { useRef, useState, useEffect } from "react";

const safeArr = v => Array.isArray(v) ? v : [];

const SEED = [
  {
    id:"e1",tag:"HUI",title:"Atelier Workshop",sub:"Creative Nature",
    dur:"4 Std.",spots:"6 Platze",price:129,color:"#0DC4B5",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
  },
  {
    id:"e2",tag:"Nur 2 frei",title:"1:1 Mentoring",sub:"Kreativer Flow",
    dur:"60 Min.",spots:"11 Sessions",price:149,color:"#FF8A6B",
    img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80",
  },
  {
    id:"e3",tag:"Beliebt",title:"Retreat",sub:"Wald & Kunst",
    dur:"3 Tage",spots:"8 Platze",price:499,color:"#6366F1",
    img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
  },
  {
    id:"e4",tag:"Community",title:"Musikabend",sub:"Klang & Verbindung",
    dur:"2,5 Std.",spots:"30 Platze",price:39,color:"#F59E0B",
    img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
  },
  {
    id:"e5",tag:"Digital",title:"Digitales Produkt",sub:"Art Print Collection",
    dur:"Sofort",spots:"unbegrenzt",price:29,color:"#EC4899",
    img:"https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80",
  },
];

function ExpCard({ exp, onBook }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onPointerDown={()=>setPressed(true)}
      onPointerUp={()=>{setPressed(false);onBook?.(exp);}}
      onPointerLeave={()=>setPressed(false)}
      style={{
        flexShrink:0, width:170, borderRadius:18,
        overflow:"hidden", background:"white",
        boxShadow:pressed?"0 2px 8px rgba(0,0,0,.08)":"0 4px 18px rgba(0,0,0,.08)",
        cursor:"pointer", border:"1px solid rgba(0,0,0,.05)",
        transform:pressed?"scale(.97)":"scale(1)",
        transition:"transform .15s ease,box-shadow .15s ease",
        touchAction:"manipulation",
      }}
    >
      {/* Image */}
      <div style={{height:115,overflow:"hidden",position:"relative",background:"#e8e3dd"}}>
        <img src={exp.img} alt={exp.title}
          style={{width:"100%",height:"100%",objectFit:"cover"}}
          onError={e=>{e.target.style.display="none";}} />
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(0,0,0,.35) 0%,transparent 50%)",
        }}/>
        <div style={{
          position:"absolute",top:8,left:8,
          background:exp.color,color:"white",
          fontSize:8,fontWeight:800,borderRadius:99,padding:"3px 7px",letterSpacing:".03em",
        }}>{exp.tag}</div>
      </div>

      {/* Content */}
      <div style={{padding:"11px 11px 13px"}}>
        <div style={{fontSize:12,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.02em",marginBottom:2}}>
          {exp.title}
        </div>
        <div style={{fontSize:10,color:"#888",marginBottom:7,fontWeight:500}}>{exp.sub}</div>

        <div style={{display:"flex",gap:7,marginBottom:9,fontSize:9,color:"#999"}}>
          <span>⏱ {exp.dur}</span>
          <span>👤 {exp.spots}</span>
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:15,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.03em"}}>
            €{exp.price}
          </span>
          <span style={{fontSize:10,fontWeight:700,color:exp.color}}>Mehr erfahren →</span>
        </div>
      </div>
    </div>
  );
}

export default function WirkerExperiences({ experiences, onBook }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const items = safeArr(experiences).length > 0 ? safeArr(experiences) : SEED;

  return (
    <div ref={ref} style={{
      width:"100%", background:"#F9F7F4",
      padding:"20px 0 18px",
      opacity:visible?1:0,
      transform:visible?"none":"translateY(14px)",
      transition:"opacity .6s ease,transform .6s ease",
    }}>
      {/* Header */}
      <div style={{
        padding:"0 18px 14px",
        display:"flex",justifyContent:"space-between",alignItems:"baseline",
      }}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.025em"}}>
            Angebote & Erlebnisse
          </div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>
            Das kannst du mit mir erleben oder buchen.
          </div>
        </div>
        <span style={{fontSize:11,color:"#0DC4B5",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
          Alle anzeigen →
        </span>
      </div>

      {/* Horizontal scroll */}
      <div style={{
        display:"flex",gap:11,
        overflowX:"auto",scrollbarWidth:"none",
        padding:"3px 18px 6px",
        WebkitOverflowScrolling:"touch",
      }}>
        <style>{`.exp-scroll::-webkit-scrollbar{display:none}`}</style>
        {items.map(exp => <ExpCard key={exp.id} exp={exp} onBook={onBook} />)}
        <div style={{flexShrink:0,width:6}}/>
      </div>
    </div>
  );
}

// WirkerResonanceStats.jsx — Phase 24 FINAL
// Emotional stats grid — animated counters, warm glass cards
import React, { useState, useEffect, useRef } from "react";

const safeN = (v, fb=0) => (typeof v==="number"&&isFinite(v)?v:fb);

function Counter({ target, prefix="", suffix="" }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = safeN(target);
    if (!t) return;
    let cur = 0;
    const step = t / 40;
    const timer = setInterval(() => {
      cur = Math.min(cur+step, t);
      setVal(Math.round(cur));
      if (cur >= t) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, [target]);
  return <>{prefix}{val.toLocaleString("de-DE")}{suffix}</>;
}

const STATS = [
  { key:"exp",    icon:"🎭", label:"Erlebnisse\ngeteilt",       color:"#FF8A6B", prefix:"",  suffix:""  },
  { key:"humans", icon:"👥", label:"Menschen\nresonieren",      color:"#0DC4B5", prefix:"",  suffix:""  },
  { key:"impact", icon:"✨", label:"Gemeinsame\nWirkung",       color:"#F0C46A", prefix:"€", suffix:""  },
  { key:"traces", icon:"🌿", label:"Spuren\nhinterlassen",      color:"#A78BFA", prefix:"",  suffix:"K" },
];

export default function WirkerResonanceStats({ profile = {} }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const vals = {
    exp:    safeN(profile?.bookings || 24),
    humans: safeN(profile?.followers || 189),
    impact: safeN(profile?.impact_eur || 8950),
    traces: safeN(profile?.traces || 1.8),
  };

  return (
    <div ref={ref} style={{
      width:"100%", background:"white",
      padding:"16px 16px 14px",
      borderBottom:"1px solid rgba(0,0,0,.05)",
      opacity:visible?1:0,
      transform:visible?"none":"translateY(12px)",
      transition:"opacity .55s ease, transform .55s ease",
    }}>
      {/* 4 stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:10}}>
        {STATS.map(s => (
          <div key={s.key} style={{
            background:`${s.color}0D`,
            border:`1px solid ${s.color}22`,
            borderRadius:14,padding:"12px 8px",textAlign:"center",
          }}>
            <div style={{fontSize:18,marginBottom:3}}>{s.icon}</div>
            <div style={{
              fontSize:16,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.03em",lineHeight:1,
            }}>
              {visible && <Counter target={vals[s.key]} prefix={s.prefix} suffix={s.suffix} />}
            </div>
            <div style={{
              fontSize:9,color:"#888",marginTop:3,lineHeight:1.3,
              fontWeight:500,whiteSpace:"pre-line",
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Energy strip */}
      <div style={{
        background:"linear-gradient(135deg,#0DC4B5,#FF8A6B)",
        borderRadius:12,padding:"9px 14px",
        display:"flex",alignItems:"center",gap:10,
      }}>
        <div style={{
          width:34,height:34,borderRadius:"50%",
          background:"rgba(255,255,255,.20)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,
        }}>⚡</div>
        <div>
          <div style={{fontSize:12,color:"white",fontWeight:700}}>Deine Energie wirkt weiter.</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.72)"}}>Resonanz aktiv · Community wachst</div>
        </div>
      </div>
    </div>
  );
}

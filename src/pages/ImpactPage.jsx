import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

/* ── Colors ──────────────────────────────────── */
const C = {
  teal:      "#16D7C5",
  teal2:     "#11C5B7",
  tealPale:  "#E6FAF8",
  tealMist:  "rgba(22,215,197,0.12)",
  coral:     "#FF8A6B",
  coral2:    "#FF7B72",
  coralPale: "#FFF2EE",
  green:     "#10B981",
  greenPale: "#D1FAE5",
  gold:      "#F59E0B",
  cream:     "#F9F6F2",
  creamWarm: "#FFF9F4",
  card:      "#FFFFFF",
  ink:       "#1A1A1A",
  ink2:      "#3D3D3D",
  muted:     "#888888",
  muted2:    "#BBBBBB",
  border:    "#EFEFEF",
  borderWarm:"#E8E2D8",
};

/* ── Mock Projects ──────────────────────────── */
const PROJECTS = [
  {
    id:"p1", status:"aktiv",
    title:"Bildung für Kinder in indigenen Gemeinden",
    country:"Kolumbien", category:"Bildung",
    img:"https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&q=85",
    goal:80000, raised:48650, pct:61, supporters:1248,
    desc:"Wir schaffen sichere Lernräume und fördern Bildung, Selbstvertrauen und Zukunftschancen für Kinder in indigenen Gemeinden.",
    goals:[
      {label:"3 Lernzentren aufbauen",  done:2,  total:3,  finished:false},
      {label:"200 Kinder fördern",       done:134,total:200,finished:false},
      {label:"Lehrmaterialien bereitstellen",done:1,total:1,finished:true},
    ],
    videoThumb:"https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=900&q=90",
    supporters_imgs:[
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&q=80",
    ],
  },
  {
    id:"p2", status:"aktiv",
    title:"Schutz der Meere und ihrer Bewohner",
    country:"Indonesien", category:"Natur & Umwelt",
    img:"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=85",
    goal:80000, raised:36200, pct:60, supporters:892,
    desc:"Wir schützen marine Ökosysteme durch Aufklärung, Müllsammelaktionen und nachhaltige Fischereiberatung.",
    goals:[
      {label:"500 km Küste gesäubert",done:310,total:500,finished:false},
      {label:"50 Fischer beraten",    done:50, total:50, finished:true},
      {label:"Korallenriff-Monitoring",done:2, total:5,  finished:false},
    ],
    videoThumb:"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=900&q=90",
    supporters_imgs:[
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=80",
    ],
  },
  {
    id:"p3", status:"aktiv",
    title:"Aufforstung für eine grünere Zukunft",
    country:"Kenia", category:"Natur & Umwelt",
    img:"https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=85",
    goal:60000, raised:22800, pct:38, supporters:634,
    desc:"Gemeinsam pflanzen wir Bäume und stärken lokale Gemeinschaften im Kampf gegen den Klimawandel.",
    goals:[
      {label:"10.000 Bäume pflanzen",done:3800,total:10000,finished:false},
      {label:"Bauern ausbilden",     done:45,  total:100,  finished:false},
    ],
    videoThumb:"https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=90",
    supporters_imgs:[
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
    ],
  },
];

/* ── Formatters ──────────────────────────────── */
const fmt = n => n>=1000 ? `${(n/1000).toFixed(0)}.${String(n%1000).padStart(3,'0')}` : String(n);

/* ── Back arrow ─────────────────────────────── */
function BackBtn({ onBack, white=false }) {
  return (
    <button onClick={onBack}
      style={{ background:"none", border:"none", cursor:"pointer",
        display:"flex", alignItems:"center", gap:6,
        fontSize:14, fontWeight:600,
        color:white?"rgba(255,255,255,0.88)":C.ink2,
        padding:"4px 0", WebkitTapHighlightColor:"transparent" }}>
      ← {!white&&"Zurück"}
    </button>
  );
}

/* ══════════════════════════════════════════════
   IMPACT HOME
══════════════════════════════════════════════ */
function ImpactHome({ onProjects, onVote, onPool, onProject }) {
  return (
    <div style={{ paddingBottom:90 }}>
      {/* Hero — cinematic full-width image */}
      <div style={{ position:"relative", height:340, overflow:"hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=90"
          alt="Impact"
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.65) saturate(1.15)" }}/>

        {/* Warm cinematic gradient */}
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            rgba(22,215,197,0.18) 0%,
            rgba(0,0,0,0.05) 35%,
            rgba(26,18,8,0.82) 100%)` }}/>

        {/* Text */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          padding:"0 22px 28px" }}>
          <div style={{ fontWeight:900, fontSize:34, color:"white",
            letterSpacing:-1, lineHeight:1.15, marginBottom:6 }}>
            Impact
          </div>
          <div style={{ fontSize:15, color:"rgba(255,255,255,0.82)",
            lineHeight:1.65, maxWidth:280 }}>
            Gemeinsam haben wir die Kraft, echte Veränderung zu schaffen.
          </div>
        </div>
      </div>

      {/* Pool card — floating white */}
      <div style={{ margin:"-36px 18px 0", position:"relative", zIndex:10 }}>
        <div style={{ background:C.card, borderRadius:24,
          padding:"20px 22px",
          boxShadow:"0 4px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.10)" }}
          onClick={onPool}>
          <div style={{ fontSize:12, color:C.muted, fontWeight:600,
            marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>
            Gemeinsam im Impact Pool
          </div>
          <div style={{ display:"flex", alignItems:"flex-end",
            justifyContent:"space-between" }}>
            <div>
              <div style={{ fontWeight:900, fontSize:36, color:C.ink,
                letterSpacing:-1.5, lineHeight:1 }}>
                € 124.850
              </div>
              <div style={{ fontSize:13, color:C.green, fontWeight:700,
                marginTop:5, display:"flex", alignItems:"center", gap:4 }}>
                <span>↑</span> + € 8.950 diese Woche
              </div>
            </div>
            {/* Community icon */}
            <div style={{ width:52, height:52, borderRadius:16,
              background:C.tealMist,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:26 }}>👥</div>
          </div>
          {/* Progress ring visual */}
          <div style={{ marginTop:14, height:4, borderRadius:999,
            background:C.border, overflow:"hidden" }}>
            <div style={{ height:"100%", width:"62%", borderRadius:999,
              background:`linear-gradient(90deg, ${C.teal}, ${C.teal2})`,
              transition:"width 1s" }}/>
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:5, textAlign:"right" }}>
            62% des Monatsziels erreicht
          </div>
        </div>
      </div>

      {/* Aktive Projekte */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"28px 18px 14px" }}>
        <div style={{ fontWeight:800, fontSize:18, color:C.ink }}>
          Aktive Projekte
        </div>
        <button onClick={onProjects}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:12, fontWeight:600, color:C.teal }}>
          Alle ansehen →
        </button>
      </div>

      {/* Horizontal project cards */}
      <div className="scrollbar-hide"
        style={{ display:"flex", gap:14, overflowX:"auto", padding:"0 18px 4px" }}>
        {PROJECTS.map((p,i)=>(
          <div key={p.id} onClick={()=>onProject(p)}
            style={{ flexShrink:0, width:240, borderRadius:20,
              overflow:"hidden", cursor:"pointer",
              boxShadow:"0 2px 12px rgba(0,0,0,0.10)",
              background:C.card,
              transition:"transform 0.2s" }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            {/* Image */}
            <div style={{ height:150, overflow:"hidden", position:"relative" }}>
              <img src={p.img} alt={p.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to bottom, transparent 40%, rgba(26,26,26,0.65) 100%)"}}/>
              {/* Category */}
              <div style={{ position:"absolute", top:10, left:10 }}>
                <span style={{ background:"rgba(22,215,197,0.88)",
                  color:"white", borderRadius:999, padding:"3px 10px",
                  fontSize:10, fontWeight:800,
                  backdropFilter:"blur(8px)" }}>{p.category}</span>
              </div>
              {/* Heart */}
              <button style={{ position:"absolute", top:8, right:8,
                width:30, height:30, borderRadius:"50%",
                background:"rgba(255,255,255,0.2)",
                backdropFilter:"blur(8px)", border:"none",
                cursor:"pointer", fontSize:14, color:"white",
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>♡</button>
              {/* Title on image */}
              <div style={{ position:"absolute", bottom:8, left:10, right:10 }}>
                <div style={{ fontWeight:800, fontSize:13, color:"white",
                  lineHeight:1.3 }}>{p.title}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)",
                  marginTop:2 }}>📍 {p.country}</div>
              </div>
            </div>
            {/* Amount + progress */}
            <div style={{ padding:"10px 14px 14px" }}>
              <div style={{ fontSize:13, color:C.ink2, fontWeight:700,
                marginBottom:6 }}>
                € {fmt(p.raised)}{" "}
                <span style={{ fontWeight:400, color:C.muted }}>
                  von € {fmt(p.goal)}
                </span>
              </div>
              <div style={{ background:C.border, borderRadius:999, height:5 }}>
                <div style={{ height:"100%", borderRadius:999, width:`${p.pct}%`,
                  background:`linear-gradient(90deg, ${C.teal}, ${C.teal2})`,
                  transition:"width 1.2s" }}/>
              </div>
              <div style={{ fontSize:10, color:C.teal, fontWeight:700,
                marginTop:4, textAlign:"right" }}>{p.pct}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Vote CTA */}
      <div style={{ margin:"20px 18px 0",
        background:`linear-gradient(160deg, rgba(22,215,197,0.08), rgba(255,138,107,0.06))`,
        borderRadius:22, padding:"20px",
        border:`1px solid ${C.teal}18` }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:4 }}>
          Deine Stimme zählt
        </div>
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:14 }}>
          Als Wirker entscheidest du mit, welches Projekt als nächstes gefördert wird.
        </div>
        <button onClick={onVote}
          style={{ width:"100%", padding:"13px",
            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            color:"white", border:"none", borderRadius:14,
            fontSize:14, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:"0 3px 14px rgba(22,215,197,0.35)",
            WebkitTapHighlightColor:"transparent" }}>
          🗳️ Jetzt abstimmen
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROJECT LIST
══════════════════════════════════════════════ */
function ProjectList({ onBack, onProject }) {
  const [tab, setTab] = useState("aktiv");
  const tabs = ["aktiv","abgestimmt","abgeschlossen"];
  const filtered = PROJECTS.filter(p=>
    tab==="aktiv"        ? p.status==="aktiv" :
    tab==="abgestimmt"   ? p.status==="abgestimmt" :
    p.status==="abgeschlossen"
  );

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Header */}
      <div style={{ padding:"16px 18px 0",
        display:"flex", alignItems:"center", gap:12 }}>
        <BackBtn onBack={onBack} />
        <div style={{ fontWeight:800, fontSize:18, color:C.ink, flex:1,
          textAlign:"center" }}>Impact Projekte</div>
        <div style={{ width:24 }}>
          <span style={{ fontSize:16, color:C.muted }}>⊞</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, padding:"16px 18px 0",
        borderBottom:`1px solid ${C.border}` }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ flex:1, padding:"10px 4px", background:"none",
              border:"none", cursor:"pointer",
              borderBottom:tab===t?`2.5px solid ${C.teal}`:"2.5px solid transparent",
              fontSize:13, fontWeight:tab===t?800:500,
              color:tab===t?C.teal:C.muted,
              textTransform:"capitalize",
              transition:"all 0.2s",
              WebkitTapHighlightColor:"transparent" }}>
            {t==="aktiv"?"Aktiv":t==="abgestimmt"?"Abgestimmt":"Abgeschlossen"}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div style={{ padding:"16px 18px" }}>
        {PROJECTS.map((p,i)=>(
          <div key={p.id} onClick={()=>onProject(p)}
            style={{ marginBottom:16, borderRadius:22, overflow:"hidden",
              background:C.card, cursor:"pointer",
              boxShadow:"0 2px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08)",
              transition:"transform 0.2s" }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.98)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>

            {/* Cinematic image */}
            <div style={{ height:190, overflow:"hidden", position:"relative" }}>
              <img src={p.img} alt={p.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to bottom, transparent 30%, rgba(26,26,26,0.72) 100%)"}}/>
              <div style={{ position:"absolute", top:12, left:12 }}>
                <span style={{ background:"rgba(22,215,197,0.9)", color:"white",
                  borderRadius:999, padding:"4px 11px",
                  fontSize:10, fontWeight:800 }}>{p.category}</span>
              </div>
              <button style={{ position:"absolute", top:10, right:10,
                width:32, height:32, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)",
                border:"none", cursor:"pointer", fontSize:16,
                color:"white", display:"flex", alignItems:"center",
                justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>♡</button>
              <div style={{ position:"absolute", bottom:12, left:12, right:12 }}>
                <div style={{ fontWeight:900, fontSize:16, color:"white",
                  lineHeight:1.25, marginBottom:4 }}>{p.title}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>
                  📍 {p.country}
                </div>
              </div>
            </div>

            {/* Amount + progress */}
            <div style={{ padding:"14px 16px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:8 }}>
                <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
                  € {fmt(p.raised)}
                  <span style={{ fontWeight:400, fontSize:12, color:C.muted }}>
                    {" "}von € {fmt(p.goal)}
                  </span>
                </div>
                <div style={{ fontSize:13, fontWeight:800, color:C.teal }}>
                  {p.pct}%
                </div>
              </div>
              <div style={{ background:C.border, borderRadius:999, height:6 }}>
                <div style={{ height:"100%", borderRadius:999, width:`${p.pct}%`,
                  background:`linear-gradient(90deg,${C.teal},${C.teal2})` }}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROJECT DETAIL
══════════════════════════════════════════════ */
function ProjectDetail({ project: p, onBack, onSupport }) {
  const [supported, setSupported] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Cinematic hero */}
      <div style={{ height:300, position:"relative", overflow:"hidden" }}>
        <img src={p.videoThumb} alt={p.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.75) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)"}}/>

        {/* Top controls */}
        <div style={{ position:"absolute", top:0, left:0, right:0,
          display:"flex", justifyContent:"space-between", padding:"16px 18px" }}>
          <button onClick={onBack}
            style={{ width:36, height:36, borderRadius:"50%",
              background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)",
              border:"none", cursor:"pointer", fontSize:16, color:"white",
              display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>←</button>
          <div style={{ display:"flex", gap:10 }}>
            <button style={{ width:36, height:36, borderRadius:"50%",
              background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)",
              border:"none", cursor:"pointer", fontSize:16, color:"white",
              display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>↗</button>
            <button style={{ width:36, height:36, borderRadius:"50%",
              background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)",
              border:"none", cursor:"pointer", fontSize:15, color:"white",
              display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>···</button>
          </div>
        </div>

        {/* Play button */}
        <div style={{ position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:60, height:60, borderRadius:"50%",
            background:"rgba(255,255,255,0.22)", backdropFilter:"blur(10px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, cursor:"pointer",
            boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }}>▶</div>
        </div>

        {/* Title bottom */}
        <div style={{ position:"absolute", bottom:16, left:18, right:18 }}>
          <div style={{ fontWeight:900, fontSize:20, color:"white",
            lineHeight:1.2, marginBottom:6 }}>{p.title}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>
            📍 {p.country}
          </div>
        </div>
      </div>

      {/* Supporter avatars + count */}
      <div style={{ padding:"16px 18px 0",
        display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ display:"flex" }}>
          {p.supporters_imgs.map((img,i)=>(
            <div key={i} style={{ width:28, height:28, borderRadius:"50%",
              overflow:"hidden", border:"2px solid white",
              marginLeft:i>0?-10:0 }}>
              <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          ))}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink2 }}>
          <span style={{ color:C.teal }}>{fmt(p.supporters)}</span> Unterstützer
        </div>
        <div style={{ marginLeft:"auto" }}>
          <span style={{ background:`${C.teal}18`, color:C.teal,
            borderRadius:999, padding:"3px 10px",
            fontSize:11, fontWeight:800 }}>Aktiv</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding:"16px 18px 0" }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:8 }}>
          Über das Projekt
        </div>
        <div style={{ fontSize:14, color:C.ink2, lineHeight:1.75 }}>
          {p.desc}
        </div>
      </div>

      {/* Impact Goals */}
      <div style={{ padding:"20px 18px 0" }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:12 }}>
          Impact Ziele
        </div>
        <div style={{ background:C.cream, borderRadius:18, padding:"4px 0" }}>
          {p.goals.map((g,i)=>(
            <div key={i} style={{ padding:"12px 16px",
              borderBottom:i<p.goals.length-1?`1px solid ${C.border}`:"none",
              display:"flex", alignItems:"center", gap:12 }}>
              {/* Check or progress */}
              <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
                background:g.finished?C.teal:`${C.teal}22`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12 }}>
                {g.finished
                  ? <span style={{ color:"white" }}>✓</span>
                  : <span style={{ fontSize:10, fontWeight:700,
                      color:C.teal }}>{Math.round(g.done/g.total*100)}%</span>
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.ink,
                  marginBottom:g.finished?0:5 }}>{g.label}</div>
                {!g.finished && (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:4, borderRadius:999,
                      background:C.border }}>
                      <div style={{ height:"100%", borderRadius:999,
                        background:`linear-gradient(90deg,${C.teal},${C.teal2})`,
                        width:`${Math.round(g.done/g.total*100)}%` }}/>
                    </div>
                    <span style={{ fontSize:11, color:C.muted, fontWeight:600,
                      flexShrink:0 }}>
                      {g.done}/{g.total}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons — sticky */}
      <div style={{ position:"sticky", bottom:0,
        background:"rgba(249,246,242,0.97)", backdropFilter:"blur(16px)",
        padding:"14px 18px",
        paddingBottom:"max(14px,env(safe-area-inset-bottom))",
        borderTop:`1px solid ${C.border}`,
        display:"flex", gap:12 }}>
        <button onClick={()=>setSaved(s=>!s)}
          style={{ width:48, height:48, borderRadius:14,
            background:saved?C.coralPale:C.card,
            border:`1.5px solid ${saved?C.coral:C.borderWarm}`,
            cursor:"pointer", fontSize:20, display:"flex",
            alignItems:"center", justifyContent:"center",
            flexShrink:0, WebkitTapHighlightColor:"transparent" }}>
          {saved?"❤️":"♡"}
        </button>
        <button onClick={()=>setSupported(true)}
          disabled={supported}
          style={{ flex:1, padding:"14px",
            background:supported
              ? `linear-gradient(135deg,${C.green},#059669)`
              : `linear-gradient(135deg,${C.teal},${C.teal2})`,
            color:"white", border:"none", borderRadius:14,
            fontSize:15, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:supported
              ? "0 3px 14px rgba(16,185,129,0.35)"
              : "0 3px 14px rgba(22,215,197,0.35)",
            transition:"all 0.3s" }}>
          {supported ? "✓ Unterstützt" : "Projekt unterstützen"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   VOTING SCREEN
══════════════════════════════════════════════ */
function VotingScreen({ onBack }) {
  const [current, setCurrent] = useState(0);
  const [voted,   setVoted]   = useState(null);

  function vote(idx) {
    setVoted(idx);
  }

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Header */}
      <div style={{ padding:"16px 18px 0",
        display:"flex", alignItems:"center", gap:12 }}>
        <BackBtn onBack={onBack} />
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:16, color:C.muted }}>ⓘ</span>
      </div>

      <div style={{ padding:"16px 18px 24px" }}>
        <div style={{ fontWeight:900, fontSize:24, color:C.ink,
          letterSpacing:-0.6, lineHeight:1.2, marginBottom:8 }}>
          Welches Projekt soll als nächstes unterstützt werden?
        </div>
        <div style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:24 }}>
          Deine Stimme entscheidet mit.
        </div>

        {/* Project cards — vertical swipeable */}
        {PROJECTS.map((p,i)=>(
          <div key={p.id} style={{ marginBottom:16,
            borderRadius:24, overflow:"hidden",
            background:C.card, position:"relative",
            boxShadow:voted===i
              ? `0 0 0 3px ${C.teal}, 0 8px 32px rgba(22,215,197,0.20)`
              : "0 2px 12px rgba(0,0,0,0.09)",
            transition:"box-shadow 0.3s" }}>

            {/* Image */}
            <div style={{ height:200, overflow:"hidden", position:"relative" }}>
              <img src={p.img} alt={p.title}
                style={{ width:"100%", height:"100%", objectFit:"cover",
                  filter:"brightness(0.72) saturate(1.1)" }}/>
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to bottom, transparent 35%, rgba(26,26,26,0.75) 100%)"}}/>
              {voted===i && (
                <div style={{ position:"absolute", inset:0,
                  background:"rgba(22,215,197,0.12)" }}/>
              )}
              {/* Category */}
              <div style={{ position:"absolute", top:12, left:12 }}>
                <span style={{ background:"rgba(22,215,197,0.88)",
                  color:"white", borderRadius:999, padding:"4px 12px",
                  fontSize:11, fontWeight:800 }}>{p.category}</span>
              </div>
              {voted===i && (
                <div style={{ position:"absolute", top:12, right:12 }}>
                  <span style={{ background:C.teal, color:"white",
                    borderRadius:999, padding:"4px 12px",
                    fontSize:11, fontWeight:800 }}>✓ Gewählt</span>
                </div>
              )}
              {/* Title */}
              <div style={{ position:"absolute", bottom:14, left:14, right:14 }}>
                <div style={{ fontWeight:900, fontSize:18, color:"white",
                  lineHeight:1.2, marginBottom:4 }}>{p.title}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>
                  📍 {p.country}
                </div>
                {/* Supporter faces */}
                <div style={{ display:"flex", alignItems:"center",
                  gap:6, marginTop:8 }}>
                  <div style={{ display:"flex" }}>
                    {(p.supporters_imgs||[]).slice(0,3).map((img,j)=>(
                      <div key={j} style={{ width:22, height:22, borderRadius:"50%",
                        overflow:"hidden", border:"1.5px solid rgba(255,255,255,0.7)",
                        marginLeft:j>0?-8:0 }}>
                        <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.75)",
                    fontWeight:600 }}>{fmt(p.supporters)} Unterstützer</span>
                </div>
              </div>
            </div>

            {/* Vote button */}
            <div style={{ padding:"14px 16px" }}>
              <button onClick={()=>vote(i)}
                disabled={voted!==null && voted!==i}
                style={{ width:"100%", padding:"13px",
                  background:voted===i
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : `linear-gradient(135deg,${C.coral},${C.coral2})`,
                  color:"white", border:"none", borderRadius:14,
                  fontSize:14, fontWeight:800, cursor:"pointer",
                  fontFamily:"inherit",
                  opacity:(voted!==null && voted!==i)?0.4:1,
                  transition:"all 0.3s",
                  boxShadow:voted===i
                    ? "0 3px 14px rgba(22,215,197,0.35)"
                    : "0 3px 14px rgba(255,138,107,0.30)" }}>
                {voted===i ? "✓ Deine Stimme" : "Dieses Projekt wählen"}
              </button>
            </div>
          </div>
        ))}

        {voted !== null && (
          <div style={{ marginTop:8, padding:"16px", borderRadius:18,
            background:C.tealPale, textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>🌱</div>
            <div style={{ fontWeight:800, fontSize:15, color:C.teal }}>
              Danke für deine Stimme!
            </div>
            <div style={{ fontSize:13, color:C.muted, marginTop:4, lineHeight:1.6 }}>
              Gemeinsam entscheiden wir, was wirklich zählt.
            </div>
          </div>
        )}

        <button onClick={onBack}
          style={{ width:"100%", marginTop:16, padding:"12px",
            background:"none", border:`1.5px solid ${C.borderWarm}`,
            borderRadius:14, fontSize:14, fontWeight:600,
            color:C.ink2, cursor:"pointer", fontFamily:"inherit" }}>
          Alle Projekte ansehen →
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   IMPACT POOL
══════════════════════════════════════════════ */
function ImpactPool({ onBack }) {
  return (
    <div style={{ paddingBottom:90 }}>
      {/* Header */}
      <div style={{ padding:"16px 18px 0",
        display:"flex", alignItems:"center", gap:12 }}>
        <BackBtn onBack={onBack} />
        <div style={{ flex:1, textAlign:"center",
          fontWeight:800, fontSize:17, color:C.ink }}>Impact Pool</div>
        <span style={{ fontSize:16, color:C.muted }}>ⓘ</span>
      </div>

      {/* Hero background */}
      <div style={{ position:"relative", height:200, overflow:"hidden",
        margin:"16px 18px 0", borderRadius:24 }}>
        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=85"
          alt="Pool"
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.65) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(160deg, rgba(22,215,197,0.55) 0%, rgba(255,138,107,0.35) 100%)` }}/>
        <div style={{ position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          textAlign:"center", padding:"0 24px" }}>
          <div style={{ fontWeight:800, fontSize:15, color:"rgba(255,255,255,0.9)",
            marginBottom:4 }}>Gemeinsam wachsen wir über uns hinaus.</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", lineHeight:1.6 }}>
            Jeder Beitrag. Jede Stimme.<br/>Jede Veränderung zählt.
          </div>
        </div>
      </div>

      {/* Pool amount — big floating */}
      <div style={{ margin:"16px 18px 0",
        background:C.card, borderRadius:24, padding:"28px 24px",
        textAlign:"center",
        boxShadow:"0 4px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.09)" }}>
        {/* Animated ring visual */}
        <div style={{ position:"relative", width:160, height:160,
          margin:"0 auto 20px" }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#16D7C5"/>
                <stop offset="100%" stopColor="#FF8A6B"/>
              </linearGradient>
            </defs>
            {/* Background ring */}
            <circle cx="80" cy="80" r="70" fill="none"
              stroke="#EFEFEF" strokeWidth="10"/>
            {/* Progress ring — 62% */}
            <circle cx="80" cy="80" r="70" fill="none"
              stroke="url(#ring-grad)" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*70*0.62} ${2*Math.PI*70}`}
              strokeDashoffset={2*Math.PI*70*0.25}
              transform="rotate(-90 80 80)"/>
            {/* Inner glow */}
            <circle cx="80" cy="80" r="60" fill="rgba(22,215,197,0.06)"/>
          </svg>
          {/* Amount in center */}
          <div style={{ position:"absolute", inset:0,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontWeight:900, fontSize:22, color:C.ink,
              letterSpacing:-0.8 }}>€ 124.850</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
              Gesamt Impact Pool
            </div>
          </div>
        </div>

        {/* Stats */}
        {[
          {label:"Diese Woche", val:"+ € 8.950", color:C.green},
          {label:"Unterstützer", val:"1.248",    color:C.ink},
          {label:"Projekte",     val:"12",        color:C.ink},
          {label:"Länder",       val:"8",         color:C.ink},
        ].map((s,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center",
            padding:"12px 0",
            borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
            <div style={{ fontSize:14, color:C.muted }}>{s.label}</div>
            <div style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}

        {/* Transparency CTA */}
        <button style={{ width:"100%", marginTop:16, padding:"14px",
          background:"none", border:`1.5px solid ${C.borderWarm}`,
          borderRadius:14, fontSize:14, fontWeight:700,
          color:C.ink2, cursor:"pointer", fontFamily:"inherit",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          Transparenz einsehen
          <span style={{ fontSize:16 }}>→</span>
        </button>
      </div>

      {/* Monthly distribution info */}
      <div style={{ margin:"16px 18px 0",
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
        borderRadius:22, padding:"20px" }}>
        <div style={{ fontWeight:800, fontSize:15, color:C.ink, marginBottom:8 }}>
          So funktioniert die Verteilung
        </div>
        <div style={{ fontSize:13, color:C.ink2, lineHeight:1.7 }}>
          Jeden Monat wählen Wirker aus drei Projekten. Das Projekt mit den meisten Stimmen erhält seinen vollen Wunschbetrag — der Rest fließt anteilig an die anderen Projekte.
        </div>
        <div style={{ marginTop:14, display:"flex", gap:8 }}>
          <span style={{ background:C.teal, color:"white", borderRadius:999,
            padding:"5px 14px", fontSize:12, fontWeight:800 }}>15% Provision</span>
          <span style={{ background:C.coralPale, color:C.coral,
            border:`1px solid ${C.coral}30`, borderRadius:999,
            padding:"5px 14px", fontSize:12, fontWeight:700 }}>2,25% Impact</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ROOT — ImpactPage
══════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  const [view, setView] = useState("home");
  // home | projects | detail | vote | pool
  const [selectedProject, setSelectedProject] = useState(null);

  if(view==="detail" && selectedProject) return (
    <ProjectDetail
      project={selectedProject}
      onBack={()=>setView("projects")}
      onSupport={()=>{}}
    />
  );
  if(view==="projects") return (
    <ProjectList
      onBack={()=>setView("home")}
      onProject={p=>{setSelectedProject(p);setView("detail");}}
    />
  );
  if(view==="vote") return (
    <VotingScreen onBack={()=>setView("home")} />
  );
  if(view==="pool") return (
    <ImpactPool onBack={()=>setView("home")} />
  );

  return (
    <ImpactHome
      onProjects={()=>setView("projects")}
      onVote={()=>setView("vote")}
      onPool={()=>setView("pool")}
      onProject={p=>{setSelectedProject(p);setView("detail");}}
    />
  );
}

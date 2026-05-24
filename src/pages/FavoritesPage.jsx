// FavoritesPage.jsx — HUI "Dein Raum" v2
// Screenshot-exact: Hero → Kategorie-Pills → Menschen → Werke → Erlebnisse → Impact Footer
// Props: FavoritesPage({ currentUser, onView, onImpact }) — modular, keine Monolith
// REGEL: Kein direkter Supabase in UI-Unterokomponenten. Queries top-level.

import { HUI } from "../design/hui.design.js";
import { IX } from "../design/hui.interaction.js";
import { useHuiActions, A } from "../core/hui.actions.js";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const C = {
  teal:      HUI.COLOR.teal,
  teal2:     HUI.COLOR.tealDeep,
  tealPale:  HUI.COLOR.tealPale,
  tealGlow:  "rgba(32,211,194,0.22)",
  coral:     HUI.COLOR.coral,
  coralPale: HUI.COLOR.coralPale,
  coralGlow: "rgba(255,138,122,0.18)",
  gold:      HUI.COLOR.goldLight,
  goldPale:  "#FFFBEB",
  green:     "#22C55E",
  cream:     HUI.COLOR.cream,
  warm:      HUI.COLOR.creamSoft,
  card:      "rgba(255,255,255,0.95)",
  ink:       "#1E1E1E",
  ink2:      HUI.COLOR.ink2,
  muted:     "#8A8A8A",
  muted2:    "#C5C5C5",
  border:    "rgba(0,0,0,0.07)",
  borderL:   "rgba(0,0,0,0.04)",
};

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes heartPop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
  .fr-scroll::-webkit-scrollbar { display:none; }
  .fr-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .fr-tap {
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.16s ease, opacity 0.16s ease;
    cursor:pointer;
  }
  .fr-tap:active { transform:scale(0.965) translateY(1px); opacity:0.85; }
  .fr-card {
    transition:box-shadow 0.2s ease, transform 0.2s ease;
  }
  .fr-card:active { transform:scale(0.982) translateY(1.5px); }
  .fr-pill {
    flex-shrink:0; border-radius:999px;
    font-size:13px; font-weight:600;
    cursor:pointer; border:none; outline:none;
    transition:all 0.18s ease;
    -webkit-tap-highlight-color:transparent;
    white-space:nowrap;
  }
  .fr-pill:active { transform:scale(0.965) translateY(1px); }
  .fr-heart { border:none; cursor:pointer; background:none; transition:transform 0.2s ease; }
  .fr-heart:active { animation:heartPop 0.35s ease; }
  .fr-skel {
    background:linear-gradient(90deg,#f0ede8 0%,#e8e4df 50%,#f0ede8 100%);
    background-size:200% 100%;
    animation:shimmer 1.6s infinite;
    border-radius:12px;
  }
`;

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════ */
const MOCK_HERO = {
  title:"Keramik Workshop",
  subtitle:"Formen der Erde",
  date:"24. Mai 2025",
  location:"M\u00FCnchen",
  img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
  badge:"Zuletzt gespeichert",
  avatars:[
    "https://i.pravatar.cc/28?img=21",
    "https://i.pravatar.cc/28?img=36",
    "https://i.pravatar.cc/28?img=9",
  ],
  interested:12,
};

const MOCK_PEOPLE = [
  { id:"p1", name:"Leon Brandt",  talent:"Musik & Klang",       img:"https://i.pravatar.cc/220?img=53", status:"Gerade im Atelier",  statusColor:"#22C55E" },
  { id:"p2", name:"Mia Kern",     talent:"Keramik & Handwerk",  img:"https://i.pravatar.cc/220?img=47", status:"Nimmt sich Zeit",     statusColor:HUI.COLOR.goldLight },
  { id:"p3", name:"Jonas Weber",  talent:"Fotografie & Film",   img:"https://i.pravatar.cc/220?img=52", status:"Unterwegs",           statusColor:HUI.COLOR.coral },
  { id:"p4", name:"Hanna Vogt",   talent:"Yoga & Bewegung",     img:"https://i.pravatar.cc/220?img=11", status:"In der Natur",        statusColor:HUI.COLOR.teal },
];

const MOCK_WORKS = [
  { id:"w1", title:"Abstraktes Wandbild",   creator:"Julia Brandt", price:"120", img:"https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=300&q=80", likes:34 },
  { id:"w2", title:"Handgefertigte Schale", creator:"Mia Kern",     price:"85",  img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80", likes:21 },
  { id:"w3", title:"Holzlampe Eiche",       creator:"Leon Brandt",  price:"150", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", likes:18 },
  { id:"w4", title:"Acryl Bild Meer",       creator:"Sara Voss",    price:"95",  img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=300&q=80", likes:42 },
  { id:"w5", title:"Keramik Vase",          creator:"Anna Feld",    price:"68",  img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80", likes:29 },
];

const MOCK_EXPERIENCES = [
  { id:"e1", title:"Keramik Workshop",   sub:"Formen der Erde",         date:"24. Mai - M\u00FCnchen",     img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80", badge:"In 6 Tagen",    badgeColor:C.teal,  spots:"9 Pl\u00E4tze frei", spotsColor:C.teal,  avatars:["https://i.pravatar.cc/24?img=21","https://i.pravatar.cc/24?img=36","https://i.pravatar.cc/24?img=9"] },
  { id:"e2", title:"Natur Retreat",      sub:"Waldbaden & Achtsamkeit", date:"31. Mai - 2. Juni - Schwarzwald", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80", badge:"In 2 Wochen",   badgeColor:C.teal,  spots:"Noch 5 Pl\u00E4tze", spotsColor:C.coral, avatars:["https://i.pravatar.cc/24?img=5","https://i.pravatar.cc/24?img=44","https://i.pravatar.cc/24?img=52"] },
  { id:"e3", title:"Gitarren Workshop",  sub:"Klang & Rhythmus",        date:"7. Juni - Berlin",            img:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80", badge:"In 3 Wochen",   badgeColor:C.teal,  spots:"7 Pl\u00E4tze frei", spotsColor:C.teal,  avatars:["https://i.pravatar.cc/24?img=11","https://i.pravatar.cc/24?img=32"] },
  { id:"e4", title:"Kreatives Dinner",   sub:"Gemeinsam genie\u00DFen", date:"14. Juni - Hamburg",          img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", badge:"Bald ausgebucht",badgeColor:C.coral, spots:"Nur noch 2 Pl\u00E4tze", spotsColor:C.coral, avatars:["https://i.pravatar.cc/24?img=47","https://i.pravatar.cc/24?img=53"] },
];

const PILLS = ["Alles","Menschen","Werke","Erlebnisse","Wirkung","Orte"];

/* ══════════════════════════════════════════════════════════════
   HERO CARD
══════════════════════════════════════════════════════════════ */
function HeroCard({ item, onDetails }) {
  const [resonated, setResonated] = useState(false);
  const heroCardActions = useHuiActions();
  return (
    <div style={{
      margin:"0 20px",
      borderRadius:24, overflow:"hidden",
      position:"relative", height:200,
      boxShadow:"0 8px 32px rgba(0,0,0,0.14)",
      animation:"fadeUp 0.4s ease both",
      cursor:"pointer",
    }}
    onClick={() => onDetails?.(item)}
    >
      {/* Bild */}
      <img src={item.img} alt={item.title} loading="eager"
        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
      {/* Gradient Overlay */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(90deg, rgba(10,30,25,0.82) 0%, rgba(10,30,25,0.45) 50%, rgba(0,0,0,0.0) 100%)",
      }}/>

      {/* Badge */}
      <div style={{
        position:"absolute", top:16, left:16,
        background:"rgba(32,211,194,0.18)",
        backdropFilter:"blur(8px)",
        borderRadius:999, padding:"4px 10px",
        border:"1px solid rgba(32,211,194,0.30)",
        fontSize:11, fontWeight:700, color:C.teal,
      }}>
        {item.badge}
      </div>

      {/* Heart */}
      <button
        className="fr-heart fr-tap"
        onClick={e => { e.stopPropagation(); setResonated(p => !p); }}
        style={{
          position:"absolute", top:12, right:12,
          width:34, height:34, borderRadius:"50%",
          background: resonated ? C.coral : "rgba(255,255,255,0.88)",
          backdropFilter:"blur(6px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, color: resonated ? "#fff" : C.coral,
          boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {resonated ? "✦" : "✦"}
      </button>

      {/* Content */}
      <div style={{ position:"absolute", bottom:16, left:16, right:60 }}>
        <div style={{ fontSize:18, fontWeight:900, color:"#fff",
          letterSpacing:-0.4, lineHeight:1.2, marginBottom:2 }}>
          {item.title}
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)",
          fontStyle:"italic", marginBottom:8 }}>
          {item.subtitle}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.72)",
            display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:11 }}>{"📅"}</span> {item.date}
          </span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.72)",
            display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:11 }}>{"📍"}</span> {item.location}
          </span>
        </div>
        {/* Avatare */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
          <div style={{ display:"flex" }}>
            {item.avatars.map((av, i) => (
              <img key={i} src={av} alt=""
                style={{ width:22, height:22, borderRadius:"50%", objectFit:"cover",
                  border:"2px solid rgba(255,255,255,0.6)", marginLeft: i>0 ? -7 : 0 }}/>
            ))}
          </div>
          <span style={{ fontSize:11.5, color:"rgba(255,255,255,0.65)" }}>
            +{item.interested} Interessiert
          </span>
        </div>
        <button className="fr-tap" onClick={e => { e.stopPropagation(); onDetails?.(item); }}
          style={{
            background:"rgba(255,255,255,0.18)",
            backdropFilter:"blur(8px)",
            border:"1.5px solid rgba(255,255,255,0.35)",
            borderRadius:12, padding:"7px 14px",
            fontSize:12.5, fontWeight:700, color:"#fff",
            display:"flex", alignItems:"center", gap:5,
          }}>
          Details ansehen {"\u2192"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CREATOR SECTION
══════════════════════════════════════════════════════════════ */
function CreatorSection({ people, onView }) {
  const secActions = useHuiActions();
  return (
    <div>
      <SectionHeader title="Menschen" onAll={() => secActions[A.OPEN_COMMUNITY]?.({ filter:"people" })} />
      <div className="fr-scroll" style={{
        display:"flex", gap:12,
        overflowX:"auto", padding:"4px 20px 8px",
      }}>
        {people.map((p, i) => (
          <CreatorCard key={p.id} person={p} idx={i} onView={handleView} />
        ))}
      </div>
    </div>
  );
}

function CreatorCard({ person, idx, onView }) {
  const [resonated, setResonated] = useState(false);
  return (
    <div
      className="fr-card fr-tap"
      onClick={() => onView?.(person)}
      style={{
        width:148, flexShrink:0,
        borderRadius:20, overflow:"hidden",
        background:C.card,
        boxShadow:"0 4px 18px rgba(0,0,0,0.10)",
        animation:`fadeUp 0.35s ${idx*0.06}s both`,
        cursor:"pointer",
      }}
    >
      {/* Bild */}
      <div style={{ position:"relative", height:148 }}>
        <img src={person.img} alt={person.name} loading="lazy"
          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        {/* Status Badge */}
        <div style={{
          position:"absolute", bottom:8, left:8,
          background:"rgba(255,255,255,0.90)",
          backdropFilter:"blur(6px)",
          borderRadius:999, padding:"3px 9px",
          display:"flex", alignItems:"center", gap:4,
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%",
            background:person.statusColor || C.teal, flexShrink:0 }}/>
          <span style={{ fontSize:10, fontWeight:600, color:C.ink, whiteSpace:"nowrap" }}>
            {person.status}
          </span>
        </div>
        {/* Heart */}
        <button
          className="fr-heart fr-tap"
          onClick={e => { e.stopPropagation(); setResonated(p => !p); }}
          style={{
            position:"absolute", top:8, right:8,
            width:28, height:28, borderRadius:"50%",
            background: resonated ? C.coral : "rgba(255,255,255,0.88)",
            backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color: resonated ? "#fff" : C.coral,
            boxShadow:"0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          {resonated ? "✦" : "✦"}
        </button>
      </div>
      {/* Info */}
      <div style={{ padding:"9px 10px 11px" }}>
        <div style={{ fontSize:13, fontWeight:800, color:C.ink,
          letterSpacing:-0.2, marginBottom:2 }}>
          {person.name}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>
          {person.talent}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WORKS GRID
══════════════════════════════════════════════════════════════ */
function WorksGrid({ works, onView }) {
  const secActions = useHuiActions();
  return (
    <div>
      <SectionHeader title="Werke" onAll={() => secActions[A.OPEN_WERK]?.({ view:"favoriten" })} />
      <div className="fr-scroll" style={{
        display:"flex", gap:12,
        overflowX:"auto", padding:"4px 20px 8px",
      }}>
        {works.map((w, i) => (
          <WorkCard key={w.id} work={w} idx={i} onView={handleView} />
        ))}
      </div>
    </div>
  );
}

function WorkCard({ work, idx, onView }) {
  const [resonated, setResonated] = useState(false);
  return (
    <div
      className="fr-card fr-tap"
      onClick={() => onView?.(work)}
      style={{
        width:148, flexShrink:0,
        borderRadius:18, overflow:"hidden",
        background:C.card,
        boxShadow:"0 3px 14px rgba(0,0,0,0.09)",
        animation:`fadeUp 0.35s ${idx*0.05}s both`,
        cursor:"pointer",
      }}
    >
      <div style={{ position:"relative", height:140 }}>
        <img src={work.img} alt={work.title} loading="lazy"
          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        {/* Preis Badge */}
        <div style={{
          position:"absolute", bottom:8, left:8,
          background:"rgba(255,255,255,0.92)",
          backdropFilter:"blur(6px)",
          borderRadius:999, padding:"3px 9px",
          fontSize:11.5, fontWeight:700, color:C.ink,
          boxShadow:"0 1px 5px rgba(0,0,0,0.12)",
        }}>
          {"\u20AC"} {work.price}
        </div>
        {/* Heart */}
        <button
          className="fr-heart fr-tap"
          onClick={e => { e.stopPropagation(); setResonated(p => !p); }}
          style={{
            position:"absolute", top:8, right:8,
            width:28, height:28, borderRadius:"50%",
            background: resonated ? C.coral : "rgba(255,255,255,0.88)",
            backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color: resonated ? "#fff" : C.coral,
            boxShadow:"0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          {resonated ? "✦" : "✦"}
        </button>
      </div>
      <div style={{ padding:"8px 10px 10px" }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:C.ink,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          marginBottom:2 }}>
          {work.title}
        </div>
        <div style={{ fontSize:11, color:C.muted }}>{work.creator}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EXPERIENCE CARDS
══════════════════════════════════════════════════════════════ */
function ExperienceCards({ experiences, onView }) {
  const secActions = useHuiActions();
  return (
    <div>
      <SectionHeader title="Erlebnisse" onAll={() => secActions[A.OPEN_EXPERIENCE]?.({ view:"favoriten" })} />
      <div className="fr-scroll" style={{
        display:"flex", gap:14,
        overflowX:"auto", padding:"4px 20px 8px",
      }}>
        {experiences.map((e, i) => (
          <ExperienceCard key={e.id} exp={e} idx={i} onView={handleView} />
        ))}
      </div>
    </div>
  );
}

function ExperienceCard({ exp, idx, onView }) {
  const [resonated, setResonated] = useState(false);
  return (
    <div
      className="fr-card fr-tap"
      onClick={() => onView?.(exp)}
      style={{
        width:188, flexShrink:0,
        borderRadius:20, overflow:"hidden",
        background:C.card,
        boxShadow:"0 4px 18px rgba(0,0,0,0.10)",
        animation:`fadeUp 0.35s ${idx*0.06}s both`,
        cursor:"pointer",
      }}
    >
      {/* Bild */}
      <div style={{ position:"relative", height:138 }}>
        <img src={exp.img} alt={exp.title} loading="lazy"
          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        {/* Badge */}
        <div style={{
          position:"absolute", top:8, left:8,
          background:exp.badgeColor || C.teal,
          borderRadius:999, padding:"3px 9px",
          fontSize:10.5, fontWeight:700, color:"#fff",
        }}>
          {exp.badge}
        </div>
        {/* Heart */}
        <button
          className="fr-heart fr-tap"
          onClick={e => { e.stopPropagation(); setResonated(p => !p); }}
          style={{
            position:"absolute", top:8, right:8,
            width:28, height:28, borderRadius:"50%",
            background: resonated ? C.coral : "rgba(255,255,255,0.88)",
            backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color: resonated ? "#fff" : C.coral,
          }}
        >
          {resonated ? "✦" : "✦"}
        </button>
      </div>
      {/* Info */}
      <div style={{ padding:"10px 11px 12px" }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:C.ink,
          letterSpacing:-0.2, marginBottom:2 }}>
          {exp.title}
        </div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:5 }}>{exp.sub}</div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>{exp.date}</div>
        {/* Avatare + Spots */}
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between" }}>
          <div style={{ display:"flex" }}>
            {exp.avatars.map((av, k) => (
              <img key={k} src={av} alt=""
                style={{ width:18, height:18, borderRadius:"50%", objectFit:"cover",
                  border:"1.5px solid #fff", marginLeft: k>0 ? -5 : 0 }}/>
            ))}
          </div>
          <span style={{
            fontSize:10.5, fontWeight:700,
            color: exp.spotsColor || C.teal,
          }}>
            {exp.spots}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   IMPACT FOOTER
══════════════════════════════════════════════════════════════ */
function ImpactFooter({ impactEur = 2.25, projectCount = 3, onImpact }) {
  return (
    <div style={{
      margin:"24px 20px 0",
      background:`linear-gradient(135deg, rgba(32,211,194,0.10) 0%, rgba(246,199,104,0.10) 100%)`,
      borderRadius:24, padding:"18px 20px",
      border:`1px solid rgba(32,211,194,0.15)`,
      boxShadow:"0 2px 12px rgba(0,0,0,0.05)",
      display:"flex", alignItems:"center", gap:16,
      animation:"fadeUp 0.5s 0.3s both",
    }}>
      {/* Illustration */}
      <div style={{ fontSize:42, flexShrink:0, opacity:0.80 }}>{"🌿"}</div>
      {/* Text */}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:C.ink,
          marginBottom:4, lineHeight:1.35 }}>
          Durch deine Inspiration entsteht Wirkung.
        </div>
        <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.5 }}>
          Deine gespeicherten Projekte unterst\u00FCtzen eine kreative und nachhaltige Zukunft.
        </div>
      </div>
      {/* Stats */}
      <div style={{ display:"flex", gap:14, flexShrink:0, alignItems:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.teal,
            letterSpacing:-0.5 }}>
            {"\u20AC"}{impactEur.toFixed(2)}
          </div>
          <div style={{ fontSize:9.5, color:C.muted, lineHeight:1.3, maxWidth:72 }}>
            bereits durch deine Buchungen beigetragen
          </div>
        </div>
        <div style={{ fontSize:20, color:C.coral, opacity:0.8 }}>{"♡"}</div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.ink }}>
            {projectCount}
          </div>
          <div style={{ fontSize:9.5, color:C.muted, lineHeight:1.3, maxWidth:60 }}>
            Projekte, die du unterst\u00FCtzt
          </div>
        </div>
        <div style={{ fontSize:20 }}>{"🌱"}</div>
        <button className="fr-tap" onClick={onImpact} style={{
          background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
          color:"#fff", border:"none", borderRadius:14,
          padding:"9px 14px", fontSize:12, fontWeight:700,
          cursor:"pointer", flexShrink:0,
          boxShadow:`0 4px 12px ${C.tealGlow}`,
          display:"flex", alignItems:"center", gap:5,
          whiteSpace:"nowrap",
        }}>
          Impact entdecken {"\u2192"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════════════════════════ */
function SectionHeader({ title, onAll }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"20px 20px 10px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:5,
        fontSize:16, fontWeight:800, color:C.ink, letterSpacing:-0.3 }}>
        {title}
        <span style={{ fontSize:13, color:C.muted2 }}>{">"}</span>
      </div>
      <button className="fr-tap" onClick={onAll} style={{
        background:"none", border:"none",
        fontSize:13, fontWeight:700, color:C.teal, cursor:"pointer",
      }}>
        Alle anzeigen
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */
function EmptyState({ onDiscover }) {
  const emptyActions = useHuiActions();
  function handleEmptyDiscover() {
    emptyActions[A.GO_DISCOVER]?.();
    onDiscover?.();
  }
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"60px 32px", textAlign:"center",
      animation:"fadeUp 0.5s ease both",
    }}>
      <div style={{
        width:90, height:90, borderRadius:"50%",
        background:`linear-gradient(135deg, ${C.tealPale} 0%, rgba(246,199,104,0.15) 100%)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:38, marginBottom:20,
        boxShadow:`0 8px 28px ${C.tealGlow}`,
      }}>{"🌿"}</div>
      <div style={{ fontSize:18, fontWeight:800, color:C.ink,
        letterSpacing:-0.4, marginBottom:8 }}>
        Dein Raum wartet.
      </div>
      <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.7,
        maxWidth:260, marginBottom:28 }}>
        Speichere Menschen, Werke und Erlebnisse, die dich wirklich bewegen.
      </div>
      <button onClick={handleEmptyDiscover} className="fr-tap" style={{
        background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
        color:"#fff", border:"none", borderRadius:16,
        padding:"13px 28px", fontSize:14, fontWeight:700,
        cursor:"pointer",
        boxShadow:`0 6px 18px ${C.tealGlow}`,
      }}>
        Entdecken
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN: FavoritesPage
   Props: { currentUser, onView, onImpact, onDiscover }
══════════════════════════════════════════════════════════════ */
export default function FavoritesPage({ currentUser, onView, onImpact, onDiscover }) {
  const actions = useHuiActions();

  const handleView = React.useCallback((item) => {
    const t = item?.type || "work_upload";
    if (t === "profile" || t === "talent" || item?.talent) {
      actions[A.OPEN_PROFILE]?.({ creatorId: item?.id || item?.user_id, creator: item });
    } else if (t === "experience" || t === "erlebnis") {
      actions[A.OPEN_EXPERIENCE]?.({ experience: item });
    } else {
      actions[A.OPEN_WERK]?.({ werk: item });
    }
    onView?.(item);
  }, [actions, onView]);

  const handleImpact = React.useCallback(() => {
    actions[A.GO_IMPACT]?.();
    onImpact?.();
  }, [actions, onImpact]);

  const handleDiscover = React.useCallback(() => {
    actions[A.GO_DISCOVER]?.();
    onDiscover?.();
  }, [actions, onDiscover]);
  // ── State (alle top-level, stabile Reihenfolge) ───────────────────
  const [activeCategory, setActiveCategory] = useState("Alles");
  const [search,         setSearch]         = useState("");
  const [showSearch,     setShowSearch]     = useState(false);
  const [impactEur,      setImpactEur]      = useState(2.25);
  const [projectCount,   setProjectCount]   = useState(3);

  // People/Works/Experiences: DB oder Mock
  const [people,      setPeople]      = useState(MOCK_PEOPLE);
  const [works,       setWorks]       = useState(MOCK_WORKS);
  const [experiences, setExperiences] = useState(MOCK_EXPERIENCES);
  const [heroItem,    setHeroItem]    = useState(MOCK_HERO);
  const [loading,     setLoading]     = useState(false);

  // ── Daten laden (DB-Favorites) ────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      try {
        setLoading(true);
        // Impact-Daten: payments des Users
        const { data: payments } = await supabase
          .from("payments")
          .select("impact_eur")
          .eq("user_id", currentUser.id);
        if (payments?.length > 0) {
          const total = payments.reduce((s,p) => s + (p.impact_eur||0), 0);
          if (total > 0) setImpactEur(total);
        }
      } catch { /* silent — Mocks bleiben */ }
      finally { setLoading(false); }
    })();
  }, [currentUser?.id]);

  // ── Filter ────────────────────────────────────────────────────────
  const showPeople  = activeCategory === "Alles" || activeCategory === "Menschen";
  const showWorks   = activeCategory === "Alles" || activeCategory === "Werke";
  const showExps    = activeCategory === "Alles" || activeCategory === "Erlebnisse";

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh",
      background:C.cream,
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      paddingBottom:100,
    }}>
      <style>{CSS}</style>

      {/* ── STICKY HEADER ───────────────────────────────────────── */}
      <div style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(250,248,245,0.95)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderBottom:`1px solid ${C.borderL}`,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 12px",
      }}>
        <div style={{ display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", gap:12 }}>
          {/* Titel */}
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:C.ink,
              letterSpacing:-0.8, lineHeight:1.1 }}>
              {"Dein Raum"}<span style={{ color:C.teal }}>{"·"}</span>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3, lineHeight:1.5 }}>
              Alles, was dich inspiriert,{"\n"}bewegt oder ruft.
            </div>
          </div>
          {/* Search + Sort */}
          <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0, marginTop:4 }}>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              background:"rgba(255,255,255,0.82)",
              backdropFilter:"blur(8px)",
              borderRadius:999, padding:"7px 14px",
              border: showSearch ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
              boxShadow: showSearch ? `0 0 0 3px ${C.tealGlow}` : "0 1px 6px rgba(0,0,0,0.07)",
              transition:"all 0.2s ease",
              minWidth:180,
            }}>
              <span style={{ fontSize:13, opacity:0.45 }}>{"🔍"}</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => !search && setShowSearch(false)}
                placeholder="Suche in deinen Favoriten..."
                style={{
                  flex:1, border:"none", background:"none",
                  fontSize:12.5, color:C.ink, outline:"none", minWidth:0,
                }}
              />
              <span style={{ fontSize:13, opacity:0.35 }}>{"🔍"}</span>
            </div>
            <button className="fr-tap" style={{
              display:"flex", alignItems:"center", gap:5,
              background:"rgba(255,255,255,0.82)",
              backdropFilter:"blur(8px)",
              borderRadius:999, padding:"7px 14px",
              border:`1px solid ${C.border}`,
              fontSize:12.5, fontWeight:600, color:C.ink2,
              boxShadow:"0 1px 6px rgba(0,0,0,0.07)",
            }}>
              <span style={{ fontSize:12 }}>{"⚙"}</span>
              Sortieren
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO CARD ───────────────────────────────────────────── */}
      <div style={{ padding:"16px 0 0", animation:"fadeUp 0.4s ease both" }}>
        <HeroCard item={heroItem} onDetails={handleView} />
      </div>

      {/* ── KATEGORIE PILLS ─────────────────────────────────────── */}
      <div className="fr-scroll" style={{
        display:"flex", gap:8,
        overflowX:"auto", padding:"14px 20px 0",
      }}>
        {PILLS.map(pill => {
          const active = activeCategory === pill;
          return (
            <button key={pill} className="fr-pill"
              onClick={() => setActiveCategory(pill)}
              style={{
                background: active ? C.teal : C.card,
                color: active ? "#fff" : C.ink2,
                padding:"7px 16px",
                boxShadow: active
                  ? `0 3px 12px ${C.tealGlow}`
                  : "0 1px 5px rgba(0,0,0,0.07)",
                fontWeight: active ? 700 : 500,
                transform: active ? "scale(1.03)" : "scale(1)",
                display:"flex", alignItems:"center", gap:6,
              }}
            >
              {pill === "Alles" && (
                <span style={{
                  width:18, height:18, borderRadius:9,
                  background: active ? "rgba(255,255,255,0.28)" : C.teal,
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, color:"#fff", fontWeight:800,
                }}>{"★"}</span>
              )}
              {pill}
            </button>
          );
        })}
      </div>

      {/* ── SEKTIONEN ───────────────────────────────────────────── */}
      {showPeople  && <CreatorSection   people={people}           onView={handleView} />}
      {showWorks   && <WorksGrid        works={works}             onView={handleView} />}
      {showExps    && <ExperienceCards  experiences={experiences} onView={handleView} />}

      {/* ── IMPACT FOOTER ───────────────────────────────────────── */}
      <ImpactFooter
        impactEur={impactEur}
        projectCount={projectCount}
        onImpact={handleImpact}
      />
    </div>
  );
}

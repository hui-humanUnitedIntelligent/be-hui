// src/components/home/header/SearchCommandCenter.jsx
// HUI Discovery Center V5 — Hero · Hierarchie · HUI-Gefühl

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabaseClient.js";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  teal:     "#0EC4B8",
  tealS:    "rgba(14,196,184,0.09)",
  tealM:    "rgba(14,196,184,0.18)",
  ink:      "#1A3530",
  inkS:     "rgba(26,53,48,0.52)",
  inkF:     "rgba(26,53,48,0.28)",
  bg:       "rgba(255,252,250,0.99)",
  shadow:   "0 16px 56px rgba(26,53,48,0.14), 0 2px 8px rgba(26,53,48,0.06)",
};

// ─────────────────────────────────────────────────────────────
// KONSTANTEN
// ─────────────────────────────────────────────────────────────
const THEMES = [
  { key:"nachhalt",    label:"Nachhaltigkeit", emoji:"🌱", color:"#16A34A",
    kw:["nachhaltig","natur","umwelt","garten","grün","klima"] },
  { key:"kreativ",     label:"Kreativität",    emoji:"🎨", color:"#9333EA",
    kw:["kunst","kreativ","design","foto","illustration","maler"] },
  { key:"musik",       label:"Musik",          emoji:"🎵", color:"#0EA5E9",
    kw:["musik","musiker","band","konzert","session","lied"] },
  { key:"gemeinschaft",label:"Gemeinschaft",   emoji:"🤝", color:T.teal,
    kw:["gemeinschaft","treffen","community","lokal","nachbarschaft"] },
  { key:"bildung",     label:"Bildung",        emoji:"📚", color:"#D97706",
    kw:["bildung","workshop","lernen","kurs","schule","coaching"] },
];

const QUICK_ACTIONS = [
  { emoji:"🤝", label:"Menschen kennenlernen", desc:"Finde kreative Menschen, die zu dir passen.",     color:"#0EC4B8" },
  { emoji:"🌱", label:"Projekt starten",        desc:"Starte ein Projekt das etwas bewegt.",           color:"#16A34A" },
  { emoji:"🎨", label:"Werk veröffentlichen",   desc:"Zeig der Welt was du geschaffen hast.",         color:"#9333EA" },
  { emoji:"📅", label:"Erlebnis erstellen",     desc:"Lade Menschen in dein Erlebnis ein.",            color:"#0EA5E9" },
  { emoji:"📍", label:"Ort empfehlen",          desc:"Teile einen besonderen Ort mit der Community.", color:"#D97706" },
];

const KI_HINTS = [
  { text:"Menschen kennenlernen", emoji:"✨" },
  { text:"Ein Projekt starten",   emoji:"🌱" },
  { text:"Inspiration finden",    emoji:"🎨" },
  { text:"Etwas erleben",         emoji:"📅" },
  { text:"Etwas bewegen",         emoji:"🌍" },
  { text:"Unterstützung finden",  emoji:"🤝" },
];

const KI_SUGGESTIONS = [
  { text:"Ich suche kreative Menschen",        emoji:"👥" },
  { text:"Projekte in meiner Nähe",            emoji:"📍" },
  { text:"Wer passt zu meinem Profil?",        emoji:"🔮" },
  { text:"Wo kann ich heute helfen?",          emoji:"🤝" },
  { text:"Veranstaltungen die zu mir passen",  emoji:"📅" },
  { text:"Welche Menschen sollte ich kennen?", emoji:"✨" },
];

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────
function useDebounce(v, d) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return val;
}

function relTime(ts) {
  if (!ts) return "";
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60)    return "Gerade eben";
  if (s < 3600)  return `vor ${Math.floor(s / 60)} Min`;
  if (s < 86400) return `vor ${Math.floor(s / 3600)} Std`;
  return `vor ${Math.floor(s / 86400)} Tagen`;
}

// ─────────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────
function Av({ src, emoji = "👤", size = 36, round = true }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: round ? "50%" : Math.round(size * 0.28),
      overflow: "hidden", background: T.tealS,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid rgba(14,196,184,0.14)",
    }}>
      {src && !err
        ? <img src={src} alt="" onError={() => setErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        : <span style={{ fontSize: size * 0.44 }}>{emoji}</span>}
    </div>
  );
}

function Sk({ w = "100%", h, r = 8 }) {
  return <div style={{
    width: w, height: h, borderRadius: r, flexShrink: 0,
    background: "linear-gradient(90deg,rgba(14,196,184,0.06) 25%,rgba(14,196,184,0.13) 50%,rgba(14,196,184,0.06) 75%)",
    backgroundSize: "200% 100%",
    animation: "dc-shimmer 1.5s ease-in-out infinite",
  }}/>;
}

function Label({ children, color }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: ".07em",
      textTransform: "uppercase", color: color || T.inkF,
      marginBottom: 10,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. HERO-BEREICH — "Heute auf HUI"
// ─────────────────────────────────────────────────────────────
const HERO_DEFS = [
  { key:"profiles",    emoji:"✨", label:"neue Menschen",     sub:"heute beigetreten",   color:"#9333EA" },
  { key:"works",       emoji:"🎨", label:"neue Werke",        sub:"veröffentlicht",      color:"#0EA5E9" },
  { key:"experiences", emoji:"📅", label:"Erlebnisse",        sub:"buchbar",             color:T.teal    },
  { key:"beitraege",   emoji:"🌱", label:"neue Momente",      sub:"geteilt",             color:"#16A34A" },
];

function HeroSection() {
  const [counts, setCounts] = useState(null);
  const [latest, setLatest] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const since24h = new Date(Date.now() - 86400000).toISOString();
    const since7d  = new Date(Date.now() - 86400000 * 7).toISOString();

    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      supabase.from("works").select("id", { count: "exact", head: true }).gte("created_at", since7d),
      supabase.from("experiences").select("id", { count: "exact", head: true }),
      supabase.from("beitraege").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    ]).then(([p, w, e, b]) => {
      setCounts({ profiles: p.count ?? 0, works: w.count ?? 0, experiences: e.count ?? 0, beitraege: b.count ?? 0 });
    }).catch(() => {});

    // Neueste Einträge für Live-Feed
    Promise.all([
      supabase.from("profiles").select("id,display_name,username,avatar_url,created_at").order("created_at",{ascending:false}).limit(3),
      supabase.from("works").select("id,title,cover_url,created_at").order("created_at",{ascending:false}).limit(3),
      supabase.from("beitraege").select("id,caption,src,created_at").order("created_at",{ascending:false}).limit(3),
    ]).then(([p, w, b]) => {
      const all = [];
      (p.data||[]).forEach(r => all.push({ id:"p"+r.id, emoji:"✨", color:"#9333EA",
        title: `${r.display_name||r.username||"Jemand"} ist beigetreten`, time: relTime(r.created_at), img: r.avatar_url }));
      (w.data||[]).forEach(r => all.push({ id:"w"+r.id, emoji:"🎨", color:"#0EA5E9",
        title: `Werk: „${r.title}"`, time: relTime(r.created_at), img: r.cover_url }));
      (b.data||[]).forEach(r => all.push({ id:"b"+r.id, emoji:"🌱", color:"#16A34A",
        title: r.caption ? r.caption.slice(0,44)+(r.caption.length>44?"…":"") : "Neuer Moment", time: relTime(r.created_at), img: r.src }));
      all.sort(() => Math.random() - 0.5);
      setLatest(all.slice(0, 6));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "14px 16px 12px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:T.teal,
          boxShadow:"0 0 0 2.5px rgba(14,196,184,0.22)",
          animation:"dc-pulse 2s ease-in-out infinite", flexShrink:0 }}/>
        <span style={{ fontSize:11, fontWeight:800, color:T.teal, letterSpacing:".05em" }}>
          HEUTE AUF HUI
        </span>
      </div>

      {/* Stat-Karten horizontal scrollbar */}
      <div ref={scrollRef} style={{
        display:"flex", gap:10, overflowX:"auto",
        paddingBottom:4, scrollSnapType:"x mandatory",
        WebkitOverflowScrolling:"touch",
        /* Hide scrollbar */
        msOverflowStyle:"none", scrollbarWidth:"none",
      }}>
        {HERO_DEFS.map(def => {
          const val = counts ? (counts[def.key] ?? 0) : null;
          return (
            <div key={def.key} style={{
              flexShrink:0, scrollSnapAlign:"start",
              width:148, borderRadius:16, padding:"14px 14px 12px",
              background:`linear-gradient(135deg,${def.color}12,${def.color}06)`,
              border:`1.5px solid ${def.color}25`,
              backdropFilter:"blur(8px)",
              cursor:"pointer", transition:"transform .15s ease, box-shadow .15s ease",
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${def.color}28`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
            >
              <div style={{ fontSize:22, marginBottom:8 }}>{def.emoji}</div>
              {val === null
                ? <Sk w={40} h={28} r={6}/>
                : <div style={{ fontSize:28, fontWeight:900, color:def.color, letterSpacing:"-0.05em", lineHeight:1 }}>{val}</div>
              }
              <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginTop:3 }}>{def.label}</div>
              <div style={{ fontSize:9.5, color:T.inkF, marginTop:2 }}>{def.sub}</div>
            </div>
          );
        })}

        {/* Live-Feed Karte */}
        {latest.length > 0 && (
          <div style={{
            flexShrink:0, scrollSnapAlign:"start",
            width:200, borderRadius:16, padding:"12px 12px",
            background:"rgba(14,196,184,0.05)",
            border:"1.5px solid rgba(14,196,184,0.14)",
          }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.teal, marginBottom:8, letterSpacing:".04em" }}>
              ⚡ Live
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {latest.slice(0,3).map(it => (
                <div key={it.id} style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{
                    width:22, height:22, borderRadius:6, flexShrink:0,
                    background: it.img ? "transparent" : it.color+"18",
                    overflow:"hidden",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:11,
                  }}>
                    {it.img
                      ? <img src={it.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                      : it.emoji}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10.5, fontWeight:500, color:T.ink,
                      overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{it.title}</div>
                    <div style={{ fontSize:9, color:T.inkF }}>{it.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. PERSÖNLICHE EMPFEHLUNG — "HUI glaubt, das passt zu dir"
// ─────────────────────────────────────────────────────────────
const REC_REASONS = [
  "Menschen mit ähnlichen Interessen folgen diesem Profil.",
  "Aktiv in deiner Region und deinen Themen.",
  "Gemeinsame Interessen und ähnliche Werte.",
  "Empfohlen von Menschen denen du folgst.",
  "Neu auf HUI und sehr aktiv.",
];

function PersonalRec({ currentUser }) {
  const [recs, setRecs]   = useState([]);
  const [idx, setIdx]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles")
      .select("id,display_name,username,avatar_url,bio,talent,impact_eur,dna_tags,is_available")
      .neq("id", currentUser?.id || "00000000-0000-0000-0000-000000000000")
      .order("impact_eur", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setRecs(data || []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [currentUser?.id]);

  function score(p) {
    const base = 68;
    const imp  = Math.min(p.impact_eur || 0, 500) / 500 * 18;
    const avl  = p.is_available ? 5 : 0;
    const vari = (p.id?.charCodeAt(p.id.length - 1) || 0) % 9;
    return Math.min(99, Math.round(base + imp + avl + vari));
  }

  const TAGS = ["Kreativität", "Gemeinschaft", "Bildung", "Natur", "Wirkung"];
  const rec  = recs[idx];

  return (
    <div>
      <Label color={T.teal}>✨ HUI glaubt, das passt zu dir</Label>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <Sk w={44} h={44} r={99}/>
          <Sk w="70%" h={13}/>
          <Sk w="50%" h={10}/>
        </div>
      ) : recs.length === 0 ? (
        <div style={{ fontSize:12, color:T.inkF }}>Noch keine Empfehlungen verfügbar.</div>
      ) : (
        <>
          {/* Haupt-Empfehlung */}
          <div style={{
            background:"linear-gradient(135deg,rgba(14,196,184,0.08),rgba(14,196,184,0.03))",
            border:"1.5px solid rgba(14,196,184,0.18)",
            borderRadius:16, padding:"14px 14px 12px",
            marginBottom:8,
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <Av src={rec?.avatar_url} emoji="👤" size={42}/>
                <div style={{
                  position:"absolute", bottom:-3, right:-8,
                  background: score(rec) >= 85 ? T.teal : "#D97706",
                  borderRadius:99, padding:"2px 6px",
                  fontSize:8.5, fontWeight:900, color:"white",
                  border:"1.5px solid white", whiteSpace:"nowrap",
                }}>{score(rec)}%</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:800, color:T.ink, marginBottom:2 }}>
                  {rec?.display_name || rec?.username || "HUI Mitglied"}
                </div>
                {(rec?.talent || rec?.bio) && (
                  <div style={{ fontSize:11, color:T.inkS,
                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                    {rec?.talent || rec?.bio?.slice(0,38)}
                  </div>
                )}
              </div>
            </div>

            {/* Gemeinsame Tags */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, color:T.inkF, marginBottom:5 }}>Gemeinsam:</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {((rec?.dna_tags||[]).slice(0,3).length > 0
                  ? (rec?.dna_tags||[]).slice(0,3)
                  : TAGS.slice(0,3)
                ).map((tag, i) => (
                  <span key={i} style={{
                    fontSize:10.5, fontWeight:700, color:T.teal,
                    background:T.tealS, borderRadius:99, padding:"3px 9px",
                    border:"1px solid rgba(14,196,184,0.20)",
                  }}>✓ {tag}</span>
                ))}
              </div>
            </div>

            {/* Warum */}
            <div style={{
              fontSize:10.5, color:T.inkS, fontStyle:"italic",
              borderTop:"1px solid rgba(14,196,184,0.10)", paddingTop:8, marginBottom:10,
            }}>
              {REC_REASONS[idx % REC_REASONS.length]}
            </div>

            <button style={{
              width:"100%", padding:"9px 0",
              background:T.teal, border:"none", borderRadius:10,
              fontSize:12, fontWeight:700, color:"white",
              cursor:"pointer", transition:"opacity .15s",
            }}
              onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            >Jetzt entdecken →</button>
          </div>

          {/* Andere Empfehlungen — Dots */}
          {recs.length > 1 && (
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:8 }}>
              {recs.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{
                  width: idx===i ? 18 : 6, height:6,
                  borderRadius:99, cursor:"pointer",
                  background: idx===i ? T.teal : "rgba(14,196,184,0.25)",
                  transition:"all .2s ease",
                }}/>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. THEMENKARTEN — "Heute entdecken"
// ─────────────────────────────────────────────────────────────
function ThemeCards({ onThemeClick }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    Promise.all(
      THEMES.map(t =>
        Promise.all([
          supabase.from("profiles").select("id",{count:"exact",head:true})
            .or(t.kw.map(k=>`bio.ilike.%${k}%`).join(",")),
          supabase.from("works").select("id",{count:"exact",head:true})
            .or(t.kw.map(k=>`title.ilike.%${k}%,category.ilike.%${k}%`).join(",")),
          supabase.from("experiences").select("id",{count:"exact",head:true})
            .or(t.kw.map(k=>`title.ilike.%${k}%,description.ilike.%${k}%`).join(",")),
        ]).then(([m,w,e]) => ({ key:t.key, m:m.count??0, w:w.count??0, e:e.count??0 }))
      )
    ).then(res => {
      const map = {};
      res.forEach(r => { map[r.key] = r; });
      setCounts(map);
    }).catch(()=>{});
  }, []);

  return (
    <div>
      <Label>Heute entdecken</Label>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {THEMES.map(t => {
          const c = counts[t.key] || {};
          return (
            <button key={t.key} onClick={()=>onThemeClick(t.label)} style={{
              display:"flex", alignItems:"center", gap:10,
              background:`linear-gradient(135deg,${t.color}0D,${t.color}05)`,
              border:`1.5px solid ${t.color}22`,
              borderRadius:13, padding:"10px 12px",
              cursor:"pointer", textAlign:"left",
              transition:"all .15s ease",
              WebkitTapHighlightColor:"transparent",
            }}
              onMouseEnter={e=>{
                e.currentTarget.style.transform="translateX(3px)";
                e.currentTarget.style.borderColor=t.color+"44";
                e.currentTarget.style.background=`linear-gradient(135deg,${t.color}18,${t.color}08)`;
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.transform="translateX(0)";
                e.currentTarget.style.borderColor=t.color+"22";
                e.currentTarget.style.background=`linear-gradient(135deg,${t.color}0D,${t.color}05)`;
              }}
            >
              <div style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                background:t.color+"18",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
              }}>{t.emoji}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:t.color, marginBottom:3 }}>
                  {t.label}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {c.m > 0 && <span style={{ fontSize:10, color:T.inkF, fontWeight:500 }}>👥 {c.m} Menschen</span>}
                  {c.w > 0 && <span style={{ fontSize:10, color:T.inkF, fontWeight:500 }}>🎨 {c.w} Werke</span>}
                  {c.e > 0 && <span style={{ fontSize:10, color:T.inkF, fontWeight:500 }}>📅 {c.e} Erlebnisse</span>}
                  {!c.m && !c.w && !c.e && <Sk w="55%" h={9} r={5}/>}
                </div>
              </div>
              <span style={{ fontSize:14, color:t.color, opacity:0.45 }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. LIVE AKTIVITÄTEN — jetzt unten
// ─────────────────────────────────────────────────────────────
function LiveActivity() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id,display_name,username,avatar_url,created_at").order("created_at",{ascending:false}).limit(3),
      supabase.from("works").select("id,title,cover_url,created_at").order("created_at",{ascending:false}).limit(3),
      supabase.from("beitraege").select("id,caption,src,created_at").order("created_at",{ascending:false}).limit(3),
    ]).then(([p,w,b]) => {
      const all = [];
      (p.data||[]).forEach(r => all.push({ id:"p"+r.id, emoji:"✨", color:"#9333EA",
        text:`${r.display_name||r.username||"Jemand"} ist beigetreten`, time:relTime(r.created_at), avatar:r.avatar_url }));
      (w.data||[]).forEach(r => all.push({ id:"w"+r.id, emoji:"🎨", color:"#0EA5E9",
        text:`Neues Werk: „${r.title}"`, time:relTime(r.created_at), avatar:r.cover_url }));
      (b.data||[]).forEach(r => all.push({ id:"b"+r.id, emoji:"🌱", color:"#16A34A",
        text:r.caption?r.caption.slice(0,50)+(r.caption.length>50?"…":""):"Neuer Moment", time:relTime(r.created_at), avatar:r.src }));
      all.sort(()=>Math.random()-0.5);
      setItems(all.slice(0,5));
    }).catch(()=>{});
  }, []);

  if (!items.length) return null;

  return (
    <div>
      <Label>Live Aktivitäten</Label>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {items.map(it => (
          <div key={it.id} style={{
            display:"flex", alignItems:"center", gap:9,
            padding:"6px 6px", borderRadius:10, cursor:"pointer",
            transition:"background .1s", WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.07)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <Av src={it.avatar} emoji={it.emoji} size={28} round={false}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11.5, fontWeight:500, color:T.ink,
                overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{it.text}</div>
              <div style={{ fontSize:9.5, color:T.inkF }}>{it.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. SCHNELLAKTIONEN — Große Karten
// ─────────────────────────────────────────────────────────────
function QuickActions({ onAction }) {
  return (
    <div>
      <Label>Schnellaktionen</Label>
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:8,
      }}>
        {QUICK_ACTIONS.map((a, i) => (
          <button key={i} onClick={()=>onAction?.(a.label)} style={{
            display:"flex", alignItems:"flex-start", gap:10,
            background:`linear-gradient(135deg,${a.color}0C,${a.color}05)`,
            border:`1.5px solid ${a.color}22`,
            borderRadius:13, padding:"11px 12px",
            cursor:"pointer", textAlign:"left",
            transition:"all .14s ease",
            WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-1px)";
              e.currentTarget.style.boxShadow=`0 4px 16px ${a.color}22`;
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="none";
            }}
          >
            <span style={{ fontSize:20, flexShrink:0 }}>{a.emoji}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:a.color, marginBottom:3 }}>
                {a.label}
              </div>
              <div style={{ fontSize:10.5, color:T.inkF, lineHeight:1.4 }}>
                {a.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. GREETING
// ─────────────────────────────────────────────────────────────
function Greeting({ currentUser }) {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);

  useEffect(() => {
    const t = setInterval(()=>{
      setVis(false);
      setTimeout(()=>{ setIdx(i=>(i+1)%KI_HINTS.length); setVis(true); }, 280);
    }, 2900);
    return ()=>clearInterval(t);
  }, []);

  const name = currentUser?.display_name || currentUser?.username || null;
  const hint = KI_HINTS[idx];

  return (
    <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(14,196,184,0.08)" }}>
      <div style={{ fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", marginBottom:4 }}>
        {name ? `Hallo ${name} 👋` : "Willkommen auf HUI 👋"}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12, color:T.inkF }}>Was möchtest du heute</span>
        <span style={{
          fontSize:12, fontWeight:700, color:T.teal,
          opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(3px)",
          transition:"opacity .25s ease, transform .25s ease",
          display:"inline-flex", alignItems:"center", gap:4,
        }}>
          {hint.emoji} {hint.text}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. KI PANEL
// ─────────────────────────────────────────────────────────────
function KiPanel({ onSelect, onClose }) {
  return (
    <div style={{
      position:"absolute", top:"calc(100% + 6px)", right:0,
      width:258, zIndex:10,
      background:T.bg, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
      borderRadius:16, boxShadow:"0 8px 32px rgba(26,53,48,0.14)",
      border:"1px solid rgba(14,196,184,0.20)", overflow:"hidden",
      animation:"dc-in .18s cubic-bezier(.22,1,.36,1) both",
    }}>
      <div style={{ padding:"11px 13px 8px",
        background:"linear-gradient(135deg,rgba(14,196,184,0.08),rgba(14,196,184,0.02))",
        borderBottom:"1px solid rgba(14,196,184,0.10)" }}>
        <div style={{ fontSize:12,fontWeight:700,color:T.teal,marginBottom:2 }}>
          ✨ HUI KI kann dir helfen…
        </div>
        <div style={{ fontSize:10.5,color:T.inkF }}>Wähle einen Vorschlag</div>
      </div>
      <div style={{ padding:"7px 7px 9px" }}>
        {KI_SUGGESTIONS.map((s,i)=>(
          <button key={i} onClick={()=>{onSelect(s.text);onClose();}} style={{
            display:"flex",alignItems:"center",gap:8,width:"100%",
            textAlign:"left",padding:"8px 10px",background:"none",border:"none",
            borderRadius:10,cursor:"pointer",WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}
          >
            <span style={{fontSize:14,flexShrink:0}}>{s.emoji}</span>
            <span style={{fontSize:12,fontWeight:500,color:T.ink}}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// UNIFIED SEARCH HOOK
// ─────────────────────────────────────────────────────────────
function useUnifiedSearch(query) {
  const [results, setResults] = useState({ profiles:[], works:[], experiences:[], momente:[] });
  const [loading, setLoading] = useState(false);
  const alive = useRef({ v:false });

  useEffect(() => {
    if (!query?.trim()) { setResults({ profiles:[],works:[],experiences:[],momente:[] }); setLoading(false); return; }
    alive.current.v = false;
    const a = { v:true }; alive.current = a;
    setLoading(true);
    const q = query.toLowerCase().trim();

    Promise.all([
      supabase.from("profiles").select("id,display_name,username,avatar_url,bio,location")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`).limit(5),
      supabase.from("works").select("id,title,cover_url,category,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`).limit(5),
      supabase.from("experiences").select("id,title,cover_url,category,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,location_text.ilike.%${q}%`).limit(5),
      supabase.from("beitraege").select("id,caption,src,created_at")
        .ilike("caption",`%${q}%`).limit(5),
    ]).then(([p,w,e,b])=>{
      if (!a.v) return;
      setResults({
        profiles:    (p.data||[]).map(r=>({ id:r.id, type:"profile",    title:r.display_name||r.username||"HUI Mitglied", sub:r.bio?r.bio.slice(0,42):r.location, avatar:r.avatar_url, emoji:"👤", typeLabel:"Person" })),
        works:       (w.data||[]).map(r=>({ id:r.id, type:"work",       title:r.title, sub:r.category||r.location_text, avatar:r.cover_url, emoji:"🎨", typeLabel:"Werk" })),
        experiences: (e.data||[]).map(r=>({ id:r.id, type:"experience", title:r.title, sub:r.location_text||r.category, avatar:r.cover_url, emoji:"📅", typeLabel:"Erlebnis" })),
        momente:     (b.data||[]).map(r=>({ id:r.id, type:"moment",     title:r.caption||"Moment", sub:relTime(r.created_at), avatar:r.src, emoji:"📸", typeLabel:"Moment" })),
      });
      setLoading(false);
    }).catch(()=>{ if (a.v) setLoading(false); });
  }, [query]);

  const total = results.profiles.length+results.works.length+results.experiences.length+results.momente.length;
  return { results, loading, total };
}

function ResultCol({ title, emoji, items, onSelect }) {
  if (!items.length) return null;
  return (
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:10,fontWeight:800,color:T.inkF,letterSpacing:".07em",
        textTransform:"uppercase",marginBottom:6,
        display:"flex",alignItems:"center",gap:5 }}>
        {emoji} {title}
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:1 }}>
        {items.map(it=>(
          <div key={it.id} onClick={()=>onSelect?.(it)} style={{
            display:"flex",alignItems:"center",gap:8,
            padding:"6px 6px",borderRadius:10,cursor:"pointer",
            transition:"background .10s",WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <Av src={it.avatar} emoji={it.emoji} size={28} round={it.type==="profile"}/>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:600,color:T.ink,
                overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis" }}>{it.title}</div>
              {it.sub && <div style={{ fontSize:10,color:T.inkF,
                overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis" }}>{it.sub}</div>}
            </div>
          </div>
        ))}
        {items.length===5 && (
          <button style={{ background:"none",border:"none",cursor:"pointer",
            fontSize:11,color:T.teal,fontWeight:600,padding:"3px 6px",textAlign:"left" }}>
            Alle →
          </button>
        )}
      </div>
    </div>
  );
}

function KiDiscoveryCol({ query }) {
  const hints = useMemo(()=>{
    if (!query) return [];
    return [
      { emoji:"🎯", text:`Menschen die „${query}" lieben` },
      { emoji:"🌍", text:`Projekte: ${query}` },
      { emoji:"📍", text:`${query} in deiner Nähe` },
      { emoji:"💡", text:`${query} — neue Blickwinkel` },
    ];
  }, [query]);
  if (!hints.length) return null;
  return (
    <div style={{ flex:1,minWidth:0 }}>
      <div style={{ fontSize:10,fontWeight:800,color:T.teal,letterSpacing:".07em",
        textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5 }}>
        ✨ KI
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
        {hints.map((h,i)=>(
          <div key={i} style={{
            display:"flex",alignItems:"center",gap:7,padding:"8px 9px",borderRadius:10,
            cursor:"pointer",
            background:"linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.03))",
            border:"1px solid rgba(14,196,184,0.12)",
          }}>
            <span style={{fontSize:14}}>{h.emoji}</span>
            <span style={{fontSize:11.5,fontWeight:500,color:T.ink}}>{h.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HAUPTKOMPONENTE
// ─────────────────────────────────────────────────────────────
export default function SearchCommandCenter({ activeMood, currentUser }) {
  const [open,        setOpen]        = useState(false);
  const [query,       setQuery]       = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showKi,      setShowKi]      = useState(false);

  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const kiRef    = useRef(null);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_search_history")||"[]"); }
    catch { return []; }
  });

  const debounced = useDebounce(query, 250);
  useEffect(() => { setSearchQuery(debounced); }, [debounced]);
  const { results, loading, total } = useUnifiedSearch(searchQuery);

  // Placeholder
  const PH = ["Was möchtest du heute bewirken?","Menschen finden…","Werke entdecken…","Projekte erkunden…"];
  const [phIdx, setPhIdx] = useState(0);
  const [phVis, setPhVis] = useState(true);
  useEffect(() => {
    if (open) return;
    const t = setInterval(()=>{
      setPhVis(false);
      setTimeout(()=>{ setPhIdx(i=>(i+1)%PH.length); setPhVis(true); },290);
    }, 3800);
    return ()=>clearInterval(t);
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    function h(e) {
      if (!wrapRef.current?.contains(e.target) && !kiRef.current?.contains(e.target))
        close_();
    }
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive:true });
    return ()=>{ document.removeEventListener("mousedown",h); document.removeEventListener("touchstart",h); };
  }, [open]);

  // ESC
  useEffect(()=>{
    function h(e){ if(e.key!=="Escape") return; if(showKi){setShowKi(false);return;} close_(); }
    document.addEventListener("keydown",h);
    return ()=>document.removeEventListener("keydown",h);
  }, [showKi]);

  const mc  = activeMood?.color || "#0EC4B8";
  const has = !!activeMood;

  function open_() { setOpen(true); setTimeout(()=>inputRef.current?.focus(), 60); }
  function close_() {
    setOpen(false); setQuery(""); setSearchQuery(""); setShowKi(false);
    inputRef.current?.blur();
  }
  function saveHistory(q) {
    if (!q.trim()) return;
    const next = [q,...history.filter(h=>h!==q)].slice(0,8);
    setHistory(next);
    try { localStorage.setItem("hui_search_history",JSON.stringify(next)); } catch {}
  }
  function handleTheme(label) {
    setQuery(label); setSearchQuery(label); saveHistory(label); setShowKi(false);
    inputRef.current?.focus();
  }
  function handleHistory(q) { setQuery(q); setSearchQuery(q); setShowKi(false); inputRef.current?.focus(); }
  function handleKiSelect(text) { setQuery(text); setSearchQuery(text); setShowKi(false); inputRef.current?.focus(); }
  function handleSelect(item) { saveHistory(searchQuery||query||item.title); close_(); }
  function handleAction(label) { saveHistory(label); close_(); }

  const showResults = searchQuery.trim().length > 0;

  return (
    <>
      <style>{`
        @keyframes dc-in {
          from { opacity:0; transform:translateY(-8px) scaleY(.97); transform-origin:top center; }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes dc-shimmer {
          from { background-position:-200% 0; }
          to   { background-position:200% 0; }
        }
        @keyframes dc-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:.4; transform:scale(1.4); }
        }
        .dc-input {
          outline:none; border:none; background:none; width:100%;
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
          font-size:14px; font-weight:500; color:#1A3530;
        }
        .dc-input::placeholder { color:rgba(26,53,48,0.30); }
        .dc-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Backdrop */}
      {open && (
        <div onClick={close_} style={{
          position:"fixed", inset:0, zIndex:299,
          background:"rgba(26,53,48,0.16)",
          backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)",
          animation:"dc-in .15s ease both",
        }}/>
      )}

      {/* ── WRAPPER: Bar + Overlay ──
          flex:1 → nimmt die gesamte Breite zwischen Logo und Buttons
          left:0 right:0 im Overlay → exakt bündig                   */}
      <div ref={wrapRef} style={{ position:"relative", flex:1, zIndex:300 }}>

        {/* ── SEARCH BAR ── */}
        <div onClick={open_} style={{
          display:"flex", alignItems:"center", gap:9, height:40,
          background: has
            ? `linear-gradient(135deg,${mc}12,rgba(255,251,248,0.96))`
            : "rgba(255,255,255,0.92)",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          borderRadius: open ? "14px 14px 0 0" : 999,
          border:`1.5px solid ${open ? T.teal : has ? mc+"42" : "rgba(22,215,197,0.25)"}`,
          borderBottom: open ? "1.5px solid rgba(14,196,184,0.10)" : undefined,
          boxShadow: open ? "none" : "0 0 0 2px rgba(14,196,184,0.08),0 3px 14px rgba(0,0,0,0.05)",
          padding:"0 10px 0 13px", cursor:"text",
          transition:"border-radius .18s ease, border-color .18s, box-shadow .18s",
        }}>
          {/* Lupe */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ flexShrink:0, opacity:open?.7:.38 }}>
            <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="2"/>
            <path d="M20 20L16.5 16.5" stroke={T.teal} strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* Input */}
          <div style={{ flex:1, position:"relative", height:40, display:"flex", alignItems:"center" }}>
            <input ref={inputRef} className="dc-input"
              value={query}
              onChange={e=>setQuery(e.target.value)}
              onFocus={open_}
              placeholder=""
            />
            {!query && !open && (
              <span style={{
                position:"absolute", left:0, pointerEvents:"none",
                fontSize:13.5, fontWeight:500,
                color:has?`${mc}80`:"rgba(130,130,130,0.56)",
                opacity:phVis?1:0,
                transform:phVis?"translateY(0)":"translateY(4px)",
                transition:"opacity .28s ease, transform .28s ease",
                whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%",
              }}>{PH[phIdx]}</span>
            )}
            {open && !query && (
              <span style={{
                position:"absolute", left:0, pointerEvents:"none",
                fontSize:13.5, fontWeight:400, color:"rgba(26,53,48,0.26)", whiteSpace:"nowrap",
              }}>Was möchtest du heute bewirken?</span>
            )}
          </div>

          {/* Clear */}
          {query && (
            <button onClick={e=>{e.stopPropagation();setQuery("");setSearchQuery("");inputRef.current?.focus();}} style={{
              flexShrink:0,width:18,height:18,borderRadius:"50%",
              background:"rgba(0,0,0,0.11)",border:"none",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",fontSize:10,color:"rgba(60,60,60,0.65)",fontWeight:700,
            }}>✕</button>
          )}

          {/* KI Button */}
          <div ref={kiRef} style={{ position:"relative", flexShrink:0 }}>
            <button onClick={e=>{e.stopPropagation();open_();setShowKi(p=>!p);}} style={{
              display:"flex",alignItems:"center",gap:3,
              background:showKi?T.teal:"rgba(14,196,184,0.12)",
              border:`1px solid ${showKi?T.teal:"rgba(14,196,184,0.22)"}`,
              borderRadius:99, padding:"4px 10px",
              cursor:"pointer",transition:"all .14s ease",
              WebkitTapHighlightColor:"transparent",
            }}>
              <span style={{fontSize:10}}>✨</span>
              <span style={{fontSize:10,fontWeight:700,color:showKi?"white":T.teal}}>KI</span>
            </button>
            {showKi && <KiPanel onSelect={handleKiSelect} onClose={()=>setShowKi(false)}/>}
          </div>

          {/* Mic */}
          <div style={{flexShrink:0,padding:"0 2px",opacity:.32,cursor:"pointer"}} onClick={e=>e.stopPropagation()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke={T.ink} strokeWidth="2"/>
              <path d="M5 10a7 7 0 0014 0" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="21" x2="12" y2="17" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* ══ DISCOVERY OVERLAY ══
            left:0 right:0 → exakt bündig zur Bar (Wrapper-Breite)     */}
        {open && (
          <div style={{
            position:"absolute", top:"100%", left:0, right:0, zIndex:301,
            background:T.bg,
            backdropFilter:"blur(28px) saturate(1.9)",
            WebkitBackdropFilter:"blur(28px) saturate(1.9)",
            borderRadius:"0 0 20px 20px",
            border:`1.5px solid ${T.teal}`,
            borderTop:"none",
            boxShadow:T.shadow,
            overflow:"hidden",
            animation:"dc-in .20s cubic-bezier(.22,1,.36,1) both",
            maxHeight:"82vh", overflowY:"auto",
          }}>

            {/* ══ SUCHMODUS ══ */}
            {showResults ? (
              <div style={{ padding:"14px 16px 16px" }}>
                {loading ? (
                  <div style={{ padding:"22px 0",textAlign:"center",color:T.inkF,fontSize:13 }}>Suche läuft…</div>
                ) : total === 0 ? (
                  <div style={{ padding:"24px 0",textAlign:"center" }}>
                    <div style={{ fontSize:26,marginBottom:8 }}>🔍</div>
                    <div style={{ fontSize:13,color:T.inkF }}>Keine Ergebnisse für „{searchQuery}"</div>
                  </div>
                ) : (
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14 }}>
                    <ResultCol title="Menschen"   emoji="👥" items={results.profiles}    onSelect={handleSelect}/>
                    <ResultCol title="Erlebnisse" emoji="📅" items={results.experiences} onSelect={handleSelect}/>
                    <ResultCol title="Werke"      emoji="🎨" items={results.works}       onSelect={handleSelect}/>
                    <KiDiscoveryCol query={searchQuery}/>
                  </div>
                )}
                {/* Letzte Suchen im Suchmodus */}
                {history.length > 0 && (
                  <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid rgba(14,196,184,0.08)" }}>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                      {history.slice(0,5).map((h,i)=>(
                        <button key={i} onClick={()=>handleHistory(h)} style={{
                          display:"flex",alignItems:"center",gap:4,
                          background:"rgba(26,53,48,0.05)",border:"1px solid rgba(26,53,48,0.09)",
                          borderRadius:99,padding:"4px 11px",
                          fontSize:11.5,fontWeight:500,color:T.inkS,
                          cursor:"pointer",WebkitTapHighlightColor:"transparent",
                        }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.09)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(26,53,48,0.05)"}
                        >
                          <span style={{fontSize:9.5,opacity:.45}}>🕐</span> {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            ) : (
              /* ══ DEFAULT OVERLAY ══
                 Reihenfolge: Greeting → Hero → Empfehlung → Themen → Live → Suchen → Aktionen */
              <>
                {/* 1. Greeting */}
                <Greeting currentUser={currentUser}/>

                {/* 2. Hero */}
                <HeroSection/>

                {/* Trennlinie */}
                <div style={{ height:1, background:"rgba(14,196,184,0.08)", margin:"0 16px" }}/>

                {/* 3-Spalten: Empfehlung | Themen | Live + Aktionen */}
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"1fr 1fr 1fr",
                  gap:0,
                }}>
                  {/* LINKS — Persönliche Empfehlung */}
                  <div style={{ padding:"14px 14px 14px", borderRight:"1px solid rgba(14,196,184,0.08)" }}>
                    <PersonalRec currentUser={currentUser}/>
                  </div>

                  {/* MITTE — Themenkarten */}
                  <div style={{ padding:"14px 14px 14px", borderRight:"1px solid rgba(14,196,184,0.08)" }}>
                    <ThemeCards onThemeClick={handleTheme}/>
                  </div>

                  {/* RECHTS — Live + Letzte Suchen + Aktionen */}
                  <div style={{ padding:"14px 14px 14px" }}>
                    <LiveActivity/>

                    {/* Letzte Suchanfragen */}
                    {history.length > 0 && (
                      <div style={{ marginTop:14 }}>
                        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                          <Label>Zuletzt gesucht</Label>
                          <button onClick={()=>{setHistory([]);localStorage.removeItem("hui_search_history");}} style={{
                            background:"none",border:"none",cursor:"pointer",
                            fontSize:10,color:T.inkF,padding:0,marginBottom:10,
                          }}>Löschen</button>
                        </div>
                        <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                          {history.slice(0,5).map((h,i)=>(
                            <button key={i} onClick={()=>handleHistory(h)} style={{
                              display:"flex",alignItems:"center",gap:4,
                              background:"rgba(26,53,48,0.05)",border:"1px solid rgba(26,53,48,0.09)",
                              borderRadius:99,padding:"4px 11px",
                              fontSize:11.5,fontWeight:500,color:T.inkS,
                              cursor:"pointer",WebkitTapHighlightColor:"transparent",
                            }}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.09)"}
                              onMouseLeave={e=>e.currentTarget.style.background="rgba(26,53,48,0.05)"}
                            >
                              <span style={{fontSize:9.5,opacity:.45}}>🕐</span> {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Schnellaktionen — volle Breite unten */}
                <div style={{
                  borderTop:"1px solid rgba(14,196,184,0.08)",
                  padding:"14px 16px 16px",
                }}>
                  <QuickActions onAction={handleAction}/>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

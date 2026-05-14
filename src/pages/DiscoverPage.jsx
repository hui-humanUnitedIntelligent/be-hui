// DiscoverPage.jsx — HUI Entdecken v2
// Emotional · Editorial · Lebendig · Apple × Pinterest × Ruhige Community

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

/* ── Brand ──────────────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623",  goldGlow:"rgba(245,166,35,0.18)",
  green:"#3DB87A",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBBBBB",
  border:"rgba(0,0,0,0.06)",
};

/* ── CSS ─────────────────────────────────────────────── */
const CSS = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position:-600px 0; }
    100% { background-position:600px 0; }
  }
  @keyframes breathe {
    0%,100% { transform:scale(1);   opacity:1; }
    50%      { transform:scale(1.15); opacity:0.7; }
  }
  @keyframes softFloat {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-3px); }
  }
  .dp-scroll::-webkit-scrollbar { display:none; }
  .dp-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .dp-tap {
    -webkit-tap-highlight-color:transparent;
    cursor:pointer;
    transition:transform .22s cubic-bezier(.34,1.4,.64,1), box-shadow .22s ease;
  }
  .dp-tap:active { transform:scale(.97) !important; }
  .shimmer {
    background:linear-gradient(90deg,#f2ede7 25%,#faf7f3 50%,#f2ede7 75%);
    background-size:600px 100%;
    animation:shimmer 1.6s ease-in-out infinite;
  }
`;

/* ── Emotion Filters ─────────────────────────────────── */
const EMOTIONS = [
  { key:"alle",         icon:"✨", label:"Alles"            },
  { key:"kreativ",      icon:"🎨", label:"Kreative Welt"    },
  { key:"natur",        icon:"🌿", label:"Natur & Stille"   },
  { key:"musik",        icon:"🎶", label:"Musik & Klang"    },
  { key:"handwerk",     icon:"🛠",  label:"Handwerk"         },
  { key:"ruhe",         icon:"🧘", label:"Ruhe & Balance"   },
  { key:"gemeinschaft", icon:"🤝", label:"Gemeinschaft"     },
  { key:"impact",       icon:"🌍", label:"Impact Projekte"  },
];

/* ── Featured Sections ───────────────────────────────── */
const FEATURED_SECTIONS = [
  { key:"today",    label:"Heute inspirierend", icon:"☀️" },
  { key:"new",      label:"Neu auf HUI",        icon:"✨" },
  { key:"nearby",   label:"In deiner Nähe",     icon:"📍" },
  { key:"curated",  label:"Community Favoriten",icon:"❤️" },
];

/* ── Mock Talents (Fallback) ─────────────────────────── */
const MOCK_TALENTS = [
  {
    id:"t1", name:"Mia Kern", focus:"Keramik & Stille",
    location:"München", available:true,
    avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
    cover:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=85",
    vibe:"Handgemachte Keramik mit japanischer Ruhe.",
    skills:["Töpfern","Glasur","Workshops"],
    type:"talent",
  },
  {
    id:"t2", name:"Leon Brandt", focus:"Musik & Klang",
    location:"Berlin", available:true,
    avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
    cover:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=85",
    vibe:"Musik, die im Raum bleibt.",
    skills:["Gitarre","Komposition","Recording"],
    type:"talent",
  },
  {
    id:"t3", name:"Sara Voss", focus:"Fotografie",
    location:"Hamburg", available:false,
    avatar:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80",
    cover:"https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=85",
    vibe:"Licht einfangen, bevor es verschwindet.",
    skills:["Portrait","Natur","Dunkelkammer"],
    type:"talent",
  },
  {
    id:"t4", name:"Kai Müller", focus:"Nachhaltige Werke",
    location:"Wien", available:true,
    avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
    cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=85",
    vibe:"Aus Holz und Stille etwas Dauerhaftes bauen.",
    skills:["Holzarbeit","Design","Upcycling"],
    type:"talent",
  },
];

const MOCK_WORKS = [
  {
    id:"w1", title:"Stille Keramik",
    creator:"Mia Kern", location:"München",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
    category:"Keramik", price:85, type:"werk",
    vibe:"Jedes Stück einmalig.",
  },
  {
    id:"w2", title:"Lichtblick",
    creator:"Sara Voss", location:"Hamburg",
    img:"https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=700&q=85",
    category:"Fotografie", price:120, type:"werk",
    vibe:"Analoge Seelen in der Dunkelkammer.",
  },
  {
    id:"w3", title:"Holzklang",
    creator:"Kai Müller", location:"Wien",
    img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=85",
    category:"Handwerk", price:240, type:"werk",
    vibe:"Upcycling mit Seele.",
  },
  {
    id:"w4", title:"Morgenklang",
    creator:"Leon Brandt", location:"Berlin",
    img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85",
    category:"Musik", price:null, type:"werk",
    vibe:"Ein Lied für den frühen Tag.",
  },
];

const MOCK_EXPERIENCES = [
  {
    id:"e1", title:"Keramik Workshop",
    creator:"Mia Kern", location:"München",
    img:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=700&q=85",
    category:"Workshop", duration:"3 Stunden",
    capacity:8, price:65, type:"erlebnis",
    vibe:"Ton formen. Gedanken ordnen.",
  },
  {
    id:"e2", title:"Waldklang Session",
    creator:"Leon Brandt", location:"Brandenburg",
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=85",
    category:"Retreat", duration:"1 Tag",
    capacity:6, price:120, type:"erlebnis",
    vibe:"Musik zwischen Bäumen.",
  },
  {
    id:"e3", title:"Fotospaziergang",
    creator:"Sara Voss", location:"Hamburg",
    img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=85",
    category:"Coaching", duration:"2 Stunden",
    capacity:4, price:80, type:"erlebnis",
    vibe:"Sehen lernen mit den Augen eines anderen.",
  },
];

/* ── Helpers ─────────────────────────────────────────── */
function storageUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

/* ════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════ */
function Skeleton({ w="100%", h=200, r=20 }) {
  return (
    <div className="shimmer"
      style={{ width:w, height:h, borderRadius:r, flexShrink:0 }}/>
  );
}

/* ════════════════════════════════════════════════
   SECTION LABEL
════════════════════════════════════════════════ */
function SectionLabel({ icon, title, sub, color }) {
  return (
    <div style={{ display:"flex", alignItems:"baseline",
      justifyContent:"space-between",
      padding:"0 20px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <span style={{ fontSize:15 }}>{icon}</span>
        <span style={{ fontWeight:900, fontSize:15, color:C.ink,
          letterSpacing:-0.3 }}>{title}</span>
      </div>
      {sub && (
        <span style={{ fontSize:11, color:color||C.teal,
          fontWeight:700 }}>{sub}</span>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   COMMUNITY HINT — lebendig fühlen
════════════════════════════════════════════════ */
function CommunityHint({ text }) {
  return (
    <div style={{ margin:"0 20px 28px",
      display:"inline-flex", alignItems:"center", gap:7,
      background:`linear-gradient(135deg,${C.teal}10,${C.coral}08)`,
      border:`1px solid ${C.teal}20`,
      borderRadius:999, padding:"7px 14px" }}>
      <span style={{ width:6, height:6, borderRadius:"50%",
        background:C.teal, display:"inline-block",
        animation:"breathe 2.5s ease-in-out infinite",
        boxShadow:`0 0 5px ${C.teal}` }}/>
      <span style={{ fontSize:12, color:C.ink2, fontWeight:600 }}>{text}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════
   FEATURED HERO SCROLL — grosse emotionale Karten
════════════════════════════════════════════════ */
function FeaturedHeroScroll({ items, onPress }) {
  const cards = [
    {
      label:"Heute inspirierend", icon:"☀️",
      img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=90",
      item: items[0],
    },
    {
      label:"Neu auf HUI", icon:"✨",
      img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=90",
      item: items[1],
    },
    {
      label:"In deiner Nähe", icon:"📍",
      img:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=90",
      item: items[2],
    },
    {
      label:"Community Favoriten", icon:"❤️",
      img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=90",
      item: items[3],
    },
  ];

  return (
    <div className="dp-scroll"
      style={{ display:"flex", gap:14, overflowX:"auto",
        padding:"0 20px", scrollSnapType:"x mandatory",
        marginBottom:32 }}>
      {cards.map((c,i) => {
        const title = c.item?.title || c.label;
        const creator = c.item?.creator || c.item?.name || "";
        return (
          <div key={i} className="dp-tap"
            onClick={() => c.item && onPress?.(c.item)}
            style={{ position:"relative",
              width:"72vw", maxWidth:300, flexShrink:0,
              height:200, borderRadius:26, overflow:"hidden",
              scrollSnapAlign:"start",
              boxShadow:"0 6px 28px rgba(0,0,0,0.14)",
              animation:`fadeUp 0.45s ${i*0.07}s both` }}>
            <img src={c.img} alt={c.label}
              style={{ position:"absolute", inset:0, width:"100%",
                height:"100%", objectFit:"cover",
                filter:"brightness(0.68) saturate(1.15)" }}/>
            {/* Teal top glow */}
            <div style={{ position:"absolute", inset:0,
              background:`linear-gradient(160deg,
                ${C.teal}30 0%, transparent 45%,
                rgba(0,0,0,0.55) 100%)` }}/>
            {/* Label chip */}
            <div style={{ position:"absolute", top:14, left:14,
              display:"flex", alignItems:"center", gap:5,
              background:"rgba(255,255,255,0.18)",
              backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.25)",
              borderRadius:999, padding:"4px 12px" }}>
              <span style={{ fontSize:11 }}>{c.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color:"white" }}>
                {c.label}
              </span>
            </div>
            {/* Content */}
            <div style={{ position:"absolute", bottom:16, left:16, right:16 }}>
              <div style={{ fontWeight:900, fontSize:17, color:"white",
                letterSpacing:-0.3, lineHeight:1.2, marginBottom:3 }}>
                {title}
              </div>
              {creator && (
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.72)" }}>
                  {creator}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════
   TALENT CARD — Menschen
════════════════════════════════════════════════ */
function TalentCard({ talent, idx, onPress }) {
  return (
    <div className="dp-tap"
      onClick={() => onPress?.(talent)}
      style={{ borderRadius:24, overflow:"hidden",
        background:C.card,
        boxShadow:"0 3px 18px rgba(0,0,0,0.08)",
        animation:`fadeUp 0.45s ${idx*0.08}s both`,
        flexShrink:0 }}>
      {/* Cover image */}
      <div style={{ position:"relative", height:160, overflow:"hidden" }}>
        <img src={talent.cover} alt={talent.name}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.72) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.65) 100%)" }}/>

        {/* Available badge */}
        {talent.available && (
          <div style={{ position:"absolute", top:12, right:12,
            background:`${C.green}CC`, backdropFilter:"blur(8px)",
            borderRadius:999, padding:"3px 10px",
            display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:5, height:5, borderRadius:"50%",
              background:"white", display:"inline-block",
              animation:"breathe 2s ease-in-out infinite" }}/>
            <span style={{ fontSize:10, fontWeight:800, color:"white" }}>
              verfügbar
            </span>
          </div>
        )}

        {/* Avatar + name overlay */}
        <div style={{ position:"absolute", bottom:12, left:12,
          display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:"50%",
            overflow:"hidden",
            border:"2px solid rgba(255,255,255,0.85)" }}>
            <img src={talent.avatar} alt={talent.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:13, color:"white",
              lineHeight:1.1 }}>{talent.name}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.72)" }}>
              📍 {talent.location}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:"14px 14px 16px" }}>
        <div style={{ fontWeight:700, fontSize:13, color:C.ink,
          marginBottom:5, lineHeight:1.35 }}>
          {talent.focus}
        </div>
        <div style={{ fontSize:12, color:C.muted, fontStyle:"italic",
          lineHeight:1.55, marginBottom:10 }}>
          {talent.vibe}
        </div>
        {/* Skills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {(talent.skills||[]).slice(0,3).map((s,i) => (
            <span key={i} style={{ fontSize:10, fontWeight:700,
              color:C.teal,
              background:`${C.teal}12`,
              border:`1px solid ${C.teal}25`,
              borderRadius:999, padding:"3px 9px" }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   WERK CARD — große visuelle Karte
════════════════════════════════════════════════ */
function WerkCard({ werk, idx, onPress, large }) {
  return (
    <div className="dp-tap"
      onClick={() => onPress?.(werk)}
      style={{ borderRadius: large ? 26 : 22,
        overflow:"hidden", background:C.card,
        boxShadow:"0 4px 22px rgba(0,0,0,0.09)",
        animation:`fadeUp 0.45s ${idx*0.09}s both` }}>
      {/* Image — dominant */}
      <div style={{ position:"relative",
        height: large ? 280 : 200, overflow:"hidden" }}>
        <img src={werk.img} alt={werk.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.75) saturate(1.15)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            transparent 35%, rgba(0,0,0,0.68) 100%)` }}/>

        {/* Category */}
        <div style={{ position:"absolute", top:12, left:12 }}>
          <div style={{ background:`${C.gold}CC`, backdropFilter:"blur(8px)",
            borderRadius:999, padding:"3px 11px" }}>
            <span style={{ fontSize:10, fontWeight:800, color:"white" }}>
              {werk.category}
            </span>
          </div>
        </div>

        {/* Title overlay */}
        <div style={{ position:"absolute", bottom:14, left:14, right:14 }}>
          <div style={{ fontWeight:900,
            fontSize: large ? 20 : 16, color:"white",
            letterSpacing:-0.3, lineHeight:1.2, marginBottom:3 }}>
            {werk.title}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center" }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.72)" }}>
              {werk.creator}
            </span>
            {werk.price != null && (
              <span style={{ fontSize:14, fontWeight:900,
                color:C.teal,
                background:"rgba(0,0,0,0.35)",
                backdropFilter:"blur(6px)",
                borderRadius:999, padding:"2px 10px" }}>
                € {werk.price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vibe text */}
      {large && werk.vibe && (
        <div style={{ padding:"14px 16px",
          fontSize:13, color:C.muted, fontStyle:"italic",
          lineHeight:1.6 }}>
          „{werk.vibe}"
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   ERLEBNIS CARD
════════════════════════════════════════════════ */
function ErlebnisCard({ erlebnis, idx, onPress }) {
  return (
    <div className="dp-tap"
      onClick={() => onPress?.(erlebnis)}
      style={{ borderRadius:24, overflow:"hidden",
        background:C.card,
        boxShadow:"0 3px 18px rgba(0,0,0,0.08)",
        animation:`fadeUp 0.45s ${idx*0.09}s both`,
        flexShrink:0,
        width:"70vw", maxWidth:280 }}>
      {/* Image */}
      <div style={{ position:"relative", height:180, overflow:"hidden" }}>
        <img src={erlebnis.img} alt={erlebnis.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.70) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(160deg,
            ${C.coral}28 0%, transparent 50%,
            rgba(0,0,0,0.60) 100%)` }}/>

        {/* Duration + capacity */}
        <div style={{ position:"absolute", top:12, left:12,
          display:"flex", gap:6 }}>
          <div style={{ background:"rgba(255,255,255,0.18)",
            backdropFilter:"blur(8px)", borderRadius:999,
            padding:"3px 10px" }}>
            <span style={{ fontSize:10, fontWeight:700, color:"white" }}>
              ⏱ {erlebnis.duration}
            </span>
          </div>
          <div style={{ background:"rgba(255,255,255,0.18)",
            backdropFilter:"blur(8px)", borderRadius:999,
            padding:"3px 10px" }}>
            <span style={{ fontSize:10, fontWeight:700, color:"white" }}>
              👥 max. {erlebnis.capacity}
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ position:"absolute", bottom:12, left:12, right:12 }}>
          <div style={{ fontWeight:900, fontSize:16, color:"white",
            letterSpacing:-0.2, lineHeight:1.2, marginBottom:2 }}>
            {erlebnis.title}
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.72)" }}>
            📍 {erlebnis.location}
          </div>
        </div>
      </div>

      {/* Vibe + price */}
      <div style={{ padding:"13px 14px 15px" }}>
        <div style={{ fontSize:12, color:C.muted, fontStyle:"italic",
          lineHeight:1.55, marginBottom:10 }}>
          {erlebnis.vibe}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:700, color:C.ink2 }}>
            {erlebnis.category}
          </span>
          {erlebnis.price && (
            <span style={{ fontSize:13, fontWeight:900, color:C.coral,
              background:`${C.coral}12`, borderRadius:999,
              padding:"3px 10px" }}>
              ab € {erlebnis.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MATCH SUGGESTION CHIP
════════════════════════════════════════════════ */
function MatchReasons({ reasons }) {
  if (!reasons?.length) return null;
  return (
    <div style={{ padding:"8px 14px",
      background:`${C.teal}08`,
      borderTop:`1px solid ${C.teal}15` }}>
      <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>
        Passt zu dir · {reasons.join(" · ")}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function DiscoverPage({ onMap, onView, refreshSignal }) {
  const [emotion,    setEmotion]    = useState("alle");
  const [talents,    setTalents]    = useState([]);
  const [works,      setWorks]      = useState([]);
  const [experiences,setExperiences]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchQ,    setSearchQ]    = useState("");
  const [searchFocus,setSearchFocus]= useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, worksRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,display_name,full_name,avatar_url,focus_type,location,has_talent_profile")
          .eq("has_talent_profile", true)
          .limit(12),
        supabase
          .from("works")
          .select(`id,title,category,price,cover_url,images,description,
            profile:user_id(display_name,full_name,avatar_url)`)
          .eq("status","published")
          .order("created_at",{ascending:false})
          .limit(20),
      ]);

      if (profilesRes.data?.length > 0) {
        setTalents((profilesRes.data || []).map((p,i) => ({
          ...MOCK_TALENTS[i % MOCK_TALENTS.length],
          id:       p.id,
          name:     p.display_name || p.full_name || MOCK_TALENTS[i%4].name,
          location: p.location || MOCK_TALENTS[i%4].location,
          available:true,
        })));
      } else {
        setTalents(MOCK_TALENTS);
      }

      if (worksRes.data?.length > 0) {
        setWorks((worksRes.data || []).map((w,i) => ({
          id:      w.id,
          title:   w.title,
          creator: w.profile?.display_name || w.profile?.full_name || "Unbekannt",
          img:     w.cover_url || MOCK_WORKS[i%4].img,
          category:w.category || "Werk",
          price:   w.price,
          vibe:    w.description?.slice(0,60) || MOCK_WORKS[i%4].vibe,
          type:    "werk",
        })));
      } else {
        setWorks(MOCK_WORKS);
      }

      setExperiences(MOCK_EXPERIENCES);

    } catch(e) {
      console.error("[DiscoverPage]", e.message);
      setTalents(MOCK_TALENTS);
      setWorks(MOCK_WORKS);
      setExperiences(MOCK_EXPERIENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (refreshSignal) loadData(); }, [refreshSignal, loadData]);

  const allItems = [...works, ...talents, ...experiences];

  return (
    <>
      <style>{CSS}</style>
      <div className="dp-scroll"
        style={{ background:C.cream, paddingBottom:110,
          overflowY:"auto", height:"100dvh" }}>

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0" }}>
          <div style={{ display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", marginBottom:18 }}>
            <div>
              <div style={{ fontWeight:900, fontSize:26, color:C.ink,
                letterSpacing:-0.7, lineHeight:1.1 }}>
                Entdecken
              </div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                Talente · Werke · Erlebnisse
              </div>
            </div>
            {/* Map button — SVG Pin */}
            <button className="dp-tap" onClick={onMap}
              style={{ width:44, height:44, borderRadius:14, flexShrink:0,
                background:`linear-gradient(135deg,${C.teal}18,${C.teal}0A)`,
                border:`1.5px solid ${C.teal}40`,
                cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 2px 8px ${C.tealGlow}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="dp-map-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={C.teal}/>
                    <stop offset="100%" stopColor={C.teal2}/>
                  </linearGradient>
                </defs>
                <path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z"
                  fill={`${C.teal}22`} stroke="url(#dp-map-g)"
                  strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="12" cy="8" r="2.2" fill="url(#dp-map-g)"/>
                <ellipse cx="12" cy="21" rx="4" ry="1.2" fill={`${C.teal}30`}/>
              </svg>
            </button>
          </div>

          {/* ── SEARCH BAR ── */}
          <div style={{ position:"relative", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ flex:1, position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%",
                  transform:"translateY(-50%)", fontSize:16,
                  color: searchFocus ? C.teal : C.muted2,
                  transition:"color .2s", pointerEvents:"none" }}>
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                  placeholder="Wen oder was suchst du?"
                  style={{ width:"100%", padding:"13px 16px 13px 42px",
                    border: searchFocus
                      ? `2px solid ${C.teal}`
                      : `2px solid ${C.border}`,
                    borderRadius:16,
                    background: searchFocus ? "white" : C.card,
                    fontSize:14, color:C.ink, outline:"none",
                    fontFamily:"inherit", boxSizing:"border-box",
                    boxShadow: searchFocus
                      ? `0 4px 20px ${C.tealGlow}`
                      : "0 2px 8px rgba(0,0,0,0.05)",
                    transition:"all .22s" }}/>
                {searchQ && (
                  <button
                    onClick={() => setSearchQ("")}
                    style={{ position:"absolute", right:12, top:"50%",
                      transform:"translateY(-50%)",
                      background:"none", border:"none",
                      cursor:"pointer", fontSize:14, color:C.muted,
                      WebkitTapHighlightColor:"transparent" }}>
                    ✕
                  </button>
                )}
              </div>
              {/* HUI Match chip */}
              <button className="dp-tap"
                style={{ flexShrink:0, padding:"12px 14px",
                  background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                  border:"none", borderRadius:14,
                  fontSize:13, fontWeight:800, color:"white",
                  cursor:"pointer", fontFamily:"inherit",
                  boxShadow:`0 4px 14px ${C.tealGlow}`,
                  whiteSpace:"nowrap" }}>
                ✨ Match
              </button>
            </div>

            {/* Emotion filter chips */}
            <div className="dp-scroll"
              style={{ display:"flex", gap:8, overflowX:"auto",
                marginTop:12, paddingBottom:2 }}>
              {EMOTIONS.map(e => {
                const active = emotion === e.key;
                return (
                  <button key={e.key} className="dp-tap"
                    onClick={() => setEmotion(e.key)}
                    style={{ padding:"7px 14px", borderRadius:999,
                      flexShrink:0, whiteSpace:"nowrap",
                      background: active
                        ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                        : C.card,
                      border:`1.5px solid ${active ? "transparent" : C.border}`,
                      color: active ? "white" : C.muted,
                      fontSize:12, fontWeight: active ? 800 : 500,
                      cursor:"pointer", fontFamily:"inherit",
                      boxShadow: active ? `0 3px 10px ${C.tealGlow}` : "none",
                      transition:"all .2s" }}>
                    {e.icon} {e.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ LOADING ═════════════════════════════════════════ */}
        {loading && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ display:"flex", gap:14, overflowX:"hidden", marginBottom:28 }}>
              <Skeleton w="72vw" h={200} r={26}/>
              <Skeleton w="72vw" h={200} r={26}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:14, marginBottom:28 }}>
              {[0,1,2,3].map(i => <Skeleton key={i} h={220} r={22}/>)}
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* ══ FEATURED HERO SCROLL ════════════════════════ */}
            <FeaturedHeroScroll
              items={allItems}
              onPress={item => onView?.(item)}
            />

            {/* ══ MENSCHEN ════════════════════════════════════ */}
            <div style={{ marginBottom:32 }}>
              <SectionLabel icon="👤" title="Menschen"
                sub={`${talents.length} Talente`} color={C.teal}/>
              <CommunityHint text={`${talents.filter(t=>t.available).length} gerade verfügbar`}/>
              <div className="dp-scroll"
                style={{ display:"flex", gap:14, overflowX:"auto",
                  padding:"0 20px" }}>
                {talents.map((t,i) => (
                  <div key={t.id} style={{ width:"60vw", maxWidth:240, flexShrink:0 }}>
                    <TalentCard talent={t} idx={i}
                      onPress={() => onView?.(t)}/>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ WERKE ═══════════════════════════════════════ */}
            <div style={{ marginBottom:32 }}>
              <SectionLabel icon="🎨" title="Werke"
                sub="Neu & Besonders" color={C.gold}/>

              {/* First werk — large */}
              {works[0] && (
                <div style={{ padding:"0 20px", marginBottom:14 }}>
                  <WerkCard werk={works[0]} idx={0}
                    onPress={() => onView?.(works[0])} large/>
                </div>
              )}

              {/* Rest — 2-col grid */}
              {works.length > 1 && (
                <div style={{ padding:"0 20px",
                  display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {works.slice(1,7).map((w,i) => (
                    <WerkCard key={w.id} werk={w} idx={i+1}
                      onPress={() => onView?.(w)}/>
                  ))}
                </div>
              )}
            </div>

            <CommunityHint text="Heute 3 neue Werke veröffentlicht"/>

            {/* ══ ERLEBNISSE ══════════════════════════════════ */}
            <div style={{ marginBottom:32 }}>
              <SectionLabel icon="🌟" title="Erlebnisse"
                sub="Besondere Begegnungen" color={C.coral}/>
              <div className="dp-scroll"
                style={{ display:"flex", gap:14, overflowX:"auto",
                  padding:"0 20px", scrollSnapType:"x mandatory" }}>
                {experiences.map((e,i) => (
                  <div key={e.id} style={{ scrollSnapAlign:"start" }}>
                    <ErlebnisCard erlebnis={e} idx={i}
                      onPress={() => onView?.(e)}/>
                  </div>
                ))}
              </div>
            </div>

            <CommunityHint text="5 Personen interessieren sich gerade für Workshops"/>

            {/* ══ MEHR TALENTE — zweite Runde ════════════════ */}
            {talents.length > 2 && (
              <div style={{ marginBottom:32 }}>
                <SectionLabel icon="✨" title="Mehr entdecken"
                  sub="Inspirierende Talente" color={C.teal}/>
                <div style={{ padding:"0 20px",
                  display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {talents.slice(2,6).map((t,i) => (
                    <div key={t.id} className="dp-tap"
                      onClick={() => onView?.(t)}
                      style={{ borderRadius:20, overflow:"hidden",
                        background:C.card,
                        boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
                        animation:`fadeUp 0.4s ${i*0.07}s both` }}>
                      <div style={{ height:120, position:"relative", overflow:"hidden" }}>
                        <img src={t.cover} alt={t.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover",
                            filter:"brightness(0.72) saturate(1.1)" }}/>
                        <div style={{ position:"absolute", inset:0,
                          background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.6) 100%)" }}/>
                        <div style={{ position:"absolute", bottom:8, left:10 }}>
                          <div style={{ fontWeight:800, fontSize:12, color:"white" }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.72)" }}>
                            {t.location}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding:"10px 12px 12px" }}>
                        <div style={{ fontSize:11, color:C.muted,
                          fontStyle:"italic", lineHeight:1.5 }}>
                          {t.vibe}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FOOTER SPACE ════════════════════════════════ */}
            <div style={{ height:20 }}/>
          </>
        )}
      </div>
    </>
  );
}

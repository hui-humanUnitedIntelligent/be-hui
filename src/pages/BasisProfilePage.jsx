// src/pages/BasisProfilePage.jsx — HUI BasisUser Public Profile v2
// "Öffentliches Profil 🌿 — Lerne mich kennen."
// ════════════════════════════════════════════════════════════════
// Screenshot-exact rebuild — May 2026
// Structure:
//   Header (back + title + menu)
//   Cinematic cover + floating avatar
//   Name + location + openness status
//   Bio (italic, centered)
//   Interests grid (2-row, 3-col pills)
//   Momente (horizontal cinematic thumbnails)
//   Offen für Begegnungen (capsules + Weiteres)
//   Sichtbarkeit (lock + text + "Mehr erfahren" pill)
//   Social context bar (Verbindungen · Begegnungen · Momente)
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }   from "../lib/AuthContext.jsx";

// ── Tokens ───────────────────────────────────────────────────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  bgSheet:  "rgba(252,251,248,0.98)",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.28)",
  border:   "rgba(26,26,24,0.08)",
  borderMid:"rgba(26,26,24,0.13)",
  px: 20,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:  "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  sheet: "0 -10px 40px rgba(26,26,24,0.10)",
};

const CSS = `
  .bpp-root { background:${T.bg}; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif; color:${T.ink}; }
  .bpp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .bpp-scroll::-webkit-scrollbar { display:none; }
  .bpp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .bpp-hscroll::-webkit-scrollbar { display:none; }
  @keyframes bpp-fade-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bpp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes bpp-shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
  .bpp-skeleton {
    background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);
    background-size:200% 100%; animation:bpp-shimmer 1.4s ease-in-out infinite; border-radius:8px;
  }
  .bpp-press { transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease; }
  .bpp-press:active { transform:scale(0.94); opacity:0.75; }
  .bpp-press-light { transition:transform .14s ease,opacity .14s ease; }
  .bpp-press-light:active { transform:scale(0.97); opacity:0.82; }
  .bpp-in { animation:bpp-fade-up .45s ease both; }
  .bpp-sheet { animation:bpp-slide-up .28s cubic-bezier(.22,1,.36,1) both; }
`;

const s  = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
const a  = (v) => Array.isArray(v) ? v : [];
const delay = (n, i) => ({ animationDelay: `${i * n}ms` });

const FB_COVER = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80";
const FB_AVT   = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

const DEFAULT_INTERESTS = [
  { icon:"🌿", label:"Natur"        },
  { icon:"🎵", label:"Musik"        },
  { icon:"☕", label:"Begegnungen"  },
  { icon:"🧘", label:"Ruhe"         },
  { icon:"🐾", label:"Tiere"        },
  { icon:"✨", label:"Kreativität"  },
];

const DEFAULT_OPEN_FOR = [
  { icon:"🌲", label:"Naturgruppen"     },
  { icon:"🎵", label:"Musikabende"      },
  { icon:"☕", label:"Café & Gespräche" },
  { icon:"🧘", label:"Achtsamkeit"      },
];

const MOMENT_SEEDS = [
  { id:"m1", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=70" },
  { id:"m2", img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=70" },
  { id:"m3", img:"https://images.unsplash.com/photo-1490750967868-88df5691cc38?w=300&q=70" },
  { id:"m4", img:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&q=70" },
  { id:"m5", img:"https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=70" },
];

// ── Atoms ────────────────────────────────────────────────────────
function Gap({ h=16 }) { return <div style={{ height:h }}/>; }
function Divider({ mx=T.px }) {
  return <div style={{ height:1, background:T.border, margin:`0 ${mx}px` }}/>;
}

function Skeleton({ w, h, r=8, style={} }) {
  return <div className="bpp-skeleton" style={{ width:w, height:h, borderRadius:r, flexShrink:0, ...style }}/>;
}

// ── Sheet overlay ─────────────────────────────────────────────────
function Sheet({ onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:9900,
      background:"rgba(26,26,24,0.4)", display:"flex", alignItems:"flex-end",
    }}>
      <div className="bpp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheet, maxHeight:"78vh", overflowY:"auto",
      }}>
        <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HEADER — sticky nav bar: ‹ · "Öffentliches Profil 🌿" · ···
// ══════════════════════════════════════════════════════════════════
function ProfileHeader({ onBack }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:`14px ${T.px}px 10px`,
      background:T.bg,
    }}>
      {/* Back */}
      <button className="bpp-press" onClick={onBack} style={{
        width:36, height:36, borderRadius:"50%",
        background:T.bgCard, border:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:16, cursor:"pointer", touchAction:"manipulation",
        boxShadow:T.card, color:T.ink,
      }}>‹</button>

      {/* Title */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:16, fontWeight:700, color:T.ink, letterSpacing:"-0.02em",
          display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
          Öffentliches Profil <span style={{fontSize:15}}>🌿</span>
        </div>
        <div style={{ fontSize:11.5, color:T.inkFaint, fontWeight:400, marginTop:1 }}>
          Lerne mich kennen.
        </div>
      </div>

      {/* Menu */}
      <button className="bpp-press-light" style={{
        width:36, height:36, borderRadius:"50%",
        background:T.bgCard, border:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, cursor:"pointer", touchAction:"manipulation",
        boxShadow:T.card, color:T.ink, letterSpacing:"1px",
      }}>···</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CINEMATIC HERO — full-width cover + floating centered avatar
// ══════════════════════════════════════════════════════════════════
function CinematicHero({ profile, loading }) {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [avLoaded,    setAvLoaded]    = useState(false);
  const cover  = s(profile?.header_img, FB_COVER);
  const avatar = s(profile?.avatar_url, FB_AVT);

  return (
    <div style={{ position:"relative", width:"100%" }}>
      {/* Cover — full width, 220px tall */}
      <div style={{
        width:"100%", height:220, overflow:"hidden", position:"relative",
        background:"linear-gradient(160deg,#2C3B2D 0%,#4A6741 40%,#8B7355 100%)",
      }}>
        {loading ? (
          <div className="bpp-skeleton" style={{ width:"100%", height:"100%" }}/>
        ) : (
          <img
            src={cover} alt=""
            onLoad={()=>setCoverLoaded(true)} onError={()=>setCoverLoaded(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
              opacity:coverLoaded ? 0.92 : 0, transition:"opacity 1.1s ease" }}
          />
        )}
        {/* Soft bottom fade into cream */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:80,
          background:"linear-gradient(to bottom, transparent, rgba(247,245,240,0.6))",
        }}/>
      </div>

      {/* Floating avatar — centered, overlapping cover bottom */}
      <div style={{
        position:"absolute", bottom:-44, left:"50%", transform:"translateX(-50%)",
        display:"flex", flexDirection:"column", alignItems:"center",
      }}>
        <div style={{
          width:90, height:90, borderRadius:"50%",
          border:"4px solid white",
          boxShadow:"0 4px 24px rgba(0,0,0,0.16), 0 0 0 1px rgba(26,26,24,0.06)",
          overflow:"hidden", background:T.bg, flexShrink:0,
          position:"relative",
        }}>
          {loading ? (
            <div className="bpp-skeleton" style={{ position:"absolute", inset:0, borderRadius:"50%" }}/>
          ) : (
            <>
              {!avLoaded && <div className="bpp-skeleton" style={{ position:"absolute", inset:0, borderRadius:"50%" }}/>}
              <img
                src={avatar} alt=""
                onLoad={()=>setAvLoaded(true)} onError={()=>setAvLoaded(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover",
                  opacity:avLoaded?1:0, transition:"opacity .5s ease" }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// IDENTITY — name + location + openness + bio
// ══════════════════════════════════════════════════════════════════
function IdentitySection({ profile, loading }) {
  const name     = s(profile?.display_name || profile?.username, "Unbekannt");
  const location = s(profile?.location, "");
  const bio      = s(profile?.bio,
    "Liebe die Natur, Musik und gute Gespräche.\nSuche echte Begegnungen und Orte,\nan denen man gemeinsam wachsen kann.");

  return (
    <div style={{ textAlign:"center", padding:`0 ${T.px}px` }}>
      {/* Name */}
      {loading ? (
        <Skeleton w={140} h={32} r={8} style={{ margin:"0 auto 8px" }}/>
      ) : (
        <div style={{ fontSize:28, fontWeight:800, color:T.ink, letterSpacing:"-0.04em",
          lineHeight:1.15, marginBottom:8,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {name} <span style={{fontSize:20}}>🌿</span>
        </div>
      )}

      {/* Location + openness */}
      {loading ? (
        <Skeleton w={200} h={16} r={6} style={{ margin:"0 auto 14px" }}/>
      ) : (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          fontSize:12.5, color:T.inkSoft, marginBottom:14, fontWeight:400 }}>
          {location && (
            <>
              <span style={{fontSize:13}}>📍</span>
              <span>{location}</span>
              <span style={{ color:T.borderMid }}>•</span>
            </>
          )}
          <span style={{ color:T.teal, fontWeight:600 }}>Offen für Begegnungen</span>
        </div>
      )}

      {/* Bio */}
      {loading ? (
        <>
          <Skeleton w="100%" h={14} r={6} style={{ marginBottom:6 }}/>
          <Skeleton w="85%" h={14} r={6} style={{ margin:"0 auto 6px" }}/>
          <Skeleton w="70%" h={14} r={6} style={{ margin:"0 auto" }}/>
        </>
      ) : (
        <p style={{
          fontSize:14.5, lineHeight:1.72, color:T.inkSoft, margin:0,
          fontFamily:"-apple-system,'Georgia',serif",
          fontStyle:"italic", whiteSpace:"pre-line",
          maxWidth:320, marginLeft:"auto", marginRight:"auto",
        }}>
          {bio}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// INTERESTS — 2-row, 3-col soft pill grid (exact to screenshot)
// ══════════════════════════════════════════════════════════════════
function InterestsGrid({ profile, loading }) {
  const rawInterests = a(profile?.skills); // Persistiert via skills-Spalte
  const tags = rawInterests.length
    ? DEFAULT_INTERESTS.filter(t => rawInterests.includes(t.label))
    : DEFAULT_INTERESTS;

  if (loading) {
    return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, padding:`0 ${T.px}px` }}>
        {[0,1,2,3,4,5].map(i=><Skeleton key={i} w="100%" h={42} r={T.r99}/>)}
      </div>
    );
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, padding:`0 ${T.px}px` }}>
      {tags.map((t, i) => (
        <div key={i} className="bpp-press-light bpp-in" style={{ ...delay(60, i),
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          padding:"11px 12px", borderRadius:T.r99,
          background:T.bgCard, border:`1px solid ${T.border}`,
          fontSize:13, fontWeight:600, color:T.ink,
          boxShadow:T.card, cursor:"default",
        }}>
          <span style={{fontSize:15}}>{t.icon}</span>{t.label}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MOMENTE — horizontal cinematic thumbnails
// ══════════════════════════════════════════════════════════════════
function MomentThumb({ src, i }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="bpp-in" style={{ ...delay(50, i),
      flexShrink:0, width:100, height:100, borderRadius:T.r12,
      overflow:"hidden", background:"rgba(26,26,24,0.07)", position:"relative",
    }}>
      {!loaded && <div className="bpp-skeleton" style={{ position:"absolute", inset:0 }}/>}
      <img src={src} alt="" onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
          opacity:loaded?1:0, transition:"opacity .5s ease" }}/>
    </div>
  );
}

function MomenteSection({ profile, loading }) {
  const [showAll, setShowAll] = useState(false);
  const moments = MOMENT_SEEDS; // seed until real data

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      {/* Section header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>Momente</div>
        <button className="bpp-press-light" onClick={()=>setShowAll(true)} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:3,
        }}>Alle anzeigen ›</button>
      </div>

      {/* Horizontal scroll */}
      {loading ? (
        <div style={{ display:"flex", gap:8 }}>
          {[0,1,2,3,4].map(i=><Skeleton key={i} w={100} h={100} r={T.r12}/>)}
        </div>
      ) : (
        <div className="bpp-hscroll" style={{ display:"flex", gap:8, paddingBottom:4 }}>
          {moments.map((m, i) => <MomentThumb key={m.id} src={m.img} i={i}/>)}
        </div>
      )}

      {/* All moments sheet */}
      {showAll && (
        <Sheet onClose={()=>setShowAll(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:16 }}>📸 Alle Momente</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {moments.map((m, i) => (
              <div key={m.id} style={{ aspectRatio:"1", borderRadius:T.r12, overflow:"hidden" }}>
                <img src={m.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// OFFEN FÜR BEGEGNUNGEN — soft capsule row
// ══════════════════════════════════════════════════════════════════
function OffenFuerSection({ profile, loading }) {
  const [showMore, setShowMore] = useState(false);
  const tags = DEFAULT_OPEN_FOR;

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      {/* Section header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>Offen für Begegnungen</div>
        <button className="bpp-press-light" onClick={()=>setShowMore(true)} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:3,
        }}>Mehr erfahren ›</button>
      </div>

      {loading ? (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {[0,1,2,3].map(i=><Skeleton key={i} w={130} h={40} r={T.r99}/>)}
        </div>
      ) : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {tags.map((t, i) => (
            <div key={i} className="bpp-press-light bpp-in" style={{ ...delay(60, i),
              display:"inline-flex", alignItems:"center", gap:7,
              padding:"10px 16px", borderRadius:T.r99,
              background:T.bgCard, border:`1px solid ${T.border}`,
              fontSize:13, fontWeight:600, color:T.ink,
              boxShadow:T.card, cursor:"default",
            }}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            </div>
          ))}
          {/* Weiteres pill */}
          <button className="bpp-press-light" onClick={()=>setShowMore(true)} style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"10px 16px", borderRadius:T.r99,
            background:"transparent", border:`1px dashed ${T.borderMid}`,
            fontSize:13, fontWeight:600, color:T.inkSoft,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          }}>
            <span>+</span> Weiteres
          </button>
        </div>
      )}

      {showMore && (
        <Sheet onClose={()=>setShowMore(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:6 }}>☕ Offen für Begegnungen</div>
          <div style={{ fontSize:13.5, color:T.inkSoft, marginBottom:20, lineHeight:1.65,
            fontFamily:"-apple-system,'Georgia',serif", fontStyle:"italic" }}>
            Diese Person freut sich über echte Begegnungen in diesen Bereichen.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {[...DEFAULT_OPEN_FOR, {icon:"🌍",label:"Reisen"}, {icon:"🎨",label:"Kunst & Kultur"}].map((t,i)=>(
              <div key={i} style={{
                display:"inline-flex", alignItems:"center", gap:7,
                padding:"10px 16px", borderRadius:T.r99,
                background:T.bgCard, border:`1px solid ${T.border}`,
                fontSize:13, fontWeight:600, color:T.ink, boxShadow:T.card,
              }}>
                <span style={{fontSize:14}}>{t.icon}</span>{t.label}
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SICHTBARKEIT — lock icon + subtle text + "Mehr erfahren" pill
// ══════════════════════════════════════════════════════════════════
function SichtbarkeitSection({ profile, loading }) {
  const [showSheet, setShowSheet] = useState(false);
  const vis = s(profile?.visibility, "connections");
  const visText = {
    public:      "Dieses Profil ist öffentlich sichtbar.",
    connections: "Dieses Profil ist für deine Verbindungen sichtbar.",
    private:     "Dieses Profil ist privat.",
  }[vis] || "Dieses Profil ist für deine Verbindungen sichtbar.";

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em", marginBottom:10 }}>Sichtbarkeit</div>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
        background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${T.border}`, padding:"14px 16px",
        boxShadow:T.card,
      }}>
        {/* Left: lock + text */}
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, flex:1 }}>
          <span style={{ fontSize:15, flexShrink:0 }}>🔒</span>
          <span style={{ fontSize:12.5, color:T.inkSoft, fontWeight:400, lineHeight:1.45 }}>
            {visText}
          </span>
        </div>
        {/* Right: "Mehr erfahren" pill */}
        <button className="bpp-press-light" onClick={()=>setShowSheet(true)} style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"9px 14px", borderRadius:T.r99, border:`1px solid ${T.border}`,
          background:T.bg, fontSize:12, fontWeight:600, color:T.ink,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          flexShrink:0, boxShadow:T.card,
        }}>
          <span style={{fontSize:13}}>👥</span> Mehr erfahren
        </button>
      </div>

      {showSheet && (
        <Sheet onClose={()=>setShowSheet(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:6 }}>🔒 Sichtbarkeit</div>
          <p style={{ fontSize:14, lineHeight:1.68, color:T.inkSoft, margin:"0 0 16px",
            fontFamily:"-apple-system,'Georgia',serif", fontStyle:"italic" }}>
            {visText} Du kannst die Sichtbarkeit in deinen Einstellungen anpassen.
          </p>
          <button className="bpp-press" onClick={()=>setShowSheet(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,#0EC4B8,#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:"0 4px 18px rgba(14,196,184,0.26)",
          }}>Verstanden</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SOCIAL CONTEXT BAR — 3 soft columns: Verbindungen · Begegnungen · Momente
// ══════════════════════════════════════════════════════════════════
function SocialContextBar({ loading }) {
  const stats = [
    { icon:"👥", value:"24", label:"Verbindungen"           },
    { icon:"🤝", value:"8",  label:"Gemeinsame Begegnungen" },
    { icon:"💬", value:"6",  label:"Gemeinsame Momente"     },
  ];

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"repeat(3,1fr)",
      background:T.bgCard, borderRadius:T.r20,
      border:`1px solid ${T.border}`, margin:`0 ${T.px}px`,
      boxShadow:T.card, overflow:"hidden",
    }}>
      {stats.map((st, i) => (
        <div key={i} style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          padding:"16px 8px",
          borderRight: i < stats.length-1 ? `1px solid ${T.border}` : "none",
        }}>
          {loading ? (
            <>
              <Skeleton w={32} h={20} r={6} style={{ marginBottom:6 }}/>
              <Skeleton w={48} h={12} r={4}/>
            </>
          ) : (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                <span style={{ fontSize:16 }}>{st.icon}</span>
                <span style={{ fontSize:18, fontWeight:800, color:T.ink, letterSpacing:"-0.03em" }}>{st.value}</span>
              </div>
              <span style={{ fontSize:10.5, color:T.inkFaint, textAlign:"center", lineHeight:1.35, fontWeight:400 }}>
                {st.label}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
export default function BasisProfilePage({ profileId, onClose }) {
  // Wenn eigenes Profil → AuthContext-Daten bevorzugen (immer aktuell)
  const { user, authProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);

  useEffect(()=>{
    if (!profileId) { setLoading(false); return; }
    (async()=>{
      try {
        const { data } = await supabase.from("profiles")
          .select("id,username,display_name,bio,avatar_url,header_img,location,has_talent_profile,role,membership_type,skills,mood_dna")
          .eq("id", profileId).single();
        if (data) {
          // Wenn eigenes Profil: AuthContext hat immer die neuesten Änderungen
          const isOwnProfile = user?.id && data.id === user.id;
          if (isOwnProfile && authProfile) {
            setProfile({
              ...data,
              avatar_url: authProfile.avatar_url ?? data.avatar_url,
              header_img: authProfile.header_img  ?? data.header_img,
              bio:        authProfile.bio          ?? data.bio,
            });
          } else {
            setProfile(data);
          }
        } else {
          setProfile(null);
        }
      } catch(e) { console.warn("BasisProfilePage load:", e); }
      setLoading(false);
    })();
  }, [profileId]);

  const handleBack = useCallback(()=>{ if(onClose) onClose(); }, [onClose]);

  return (
    <div className="bpp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(14px)",
      transition:"opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>

      {/* Sticky header */}
      <ProfileHeader onBack={handleBack}/>

      {/* Scrollable body */}
      <div className="bpp-scroll" style={{ flex:1, overflowY:"auto",
        paddingBottom:"max(40px,calc(28px + env(safe-area-inset-bottom,0px)))" }}>

        {/* 1. Cinematic hero + floating avatar */}
        <CinematicHero profile={profile} loading={loading}/>
        <Gap h={52}/>  {/* space for avatar overhang */}

        {/* 2. Identity */}
        <IdentitySection profile={profile} loading={loading}/>
        <Gap h={24}/>

        {/* 3. Interests grid */}
        <InterestsGrid profile={profile} loading={loading}/>
        <Gap h={28}/>

        {/* 4. Momente */}
        <MomenteSection profile={profile} loading={loading}/>
        <Gap h={28}/>

        {/* 5. Offen für Begegnungen */}
        <OffenFuerSection profile={profile} loading={loading}/>
        <Gap h={28}/>

        {/* 6. Sichtbarkeit */}
        <SichtbarkeitSection profile={profile} loading={loading}/>
        <Gap h={24}/>

        {/* 7. Social context bar */}
        <SocialContextBar loading={loading}/>
        <Gap h={32}/>
      </div>
    </div>
  );
}

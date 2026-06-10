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

import { useState, useEffect, useCallback } from 'react';
import { useProfileData } from "../hooks/useProfileData.js";
import { useAuth }   from "../lib/AuthContext.jsx";
import { useHome }   from "../components/home/HomeShell.jsx";
import SettingsModal  from "../components/settings/SettingsModal.jsx";
import HuiStudio      from "../components/studio/HuiStudio.jsx";
import { supabase }   from "../lib/supabaseClient.js";
// Sprint F.5.3: kanonische Sections
import { AboutSection }           from "../components/profile/sections/AboutSection.jsx";
import { LocationSection }        from "../components/profile/sections/LocationSection.jsx";
import { AvailabilitySection }    from "../components/profile/sections/AvailabilitySection.jsx";
import { VisibilitySection }      from "../components/profile/sections/VisibilitySection.jsx";
import { MomentsSection }         from "../components/profile/sections/MomentsSection.jsx";
import { RecommendationsSection } from "../components/profile/sections/RecommendationsSection.jsx";

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
function ProfileHeader({ onBack, isOwner = false, onSettings }) {
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

      {/* Rechts: ⚙️ für Owner, ··· für Besucher */}
      {isOwner ? (
        <button className="bpp-press" onClick={onSettings} style={{
          width:36, height:36, borderRadius:"50%",
          background:T.bgCard, border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:17, cursor:"pointer", touchAction:"manipulation",
          boxShadow:T.card, color:T.ink,
        }}>⚙️</button>
      ) : (
        <button className="bpp-press-light" style={{
          width:36, height:36, borderRadius:"50%",
          background:T.bgCard, border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, cursor:"pointer", touchAction:"manipulation",
          boxShadow:T.card, color:T.ink, letterSpacing:"1px",
        }}>···</button>
      )}
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
  const location = s(profile?.location_final || profile?.location, ""); // Sprint F.3B
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

      {/* A1: Mitglieds-Badge */}
      {!loading && (
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          marginBottom:10,
          background:"rgba(14,196,184,0.07)",
          border:"1px solid rgba(14,196,184,0.18)",
          borderRadius:99, padding:"3px 10px",
          fontSize:11, fontWeight:700, color:"#0AADA3",
        }}>
          <span style={{fontSize:11}}>🌿</span>
          <span>HUI-Mitglied</span>
          <span style={{fontWeight:400,color:"rgba(10,173,163,0.6)",fontSize:10}}>· Teil der Gemeinschaft</span>
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
// SOCIAL CONTEXT BAR — 3 soft columns: Verbindungen · Begegnungen · Momente
// ══════════════════════════════════════════════════════════════════
function SocialContextBar({ loading, followCounts }) {
  // P4: Nur echte Daten — hardcoded Begegnungen/Momente entfernt
  const stats = [
    { icon:"👥", value: loading ? "–" : String(followCounts?.followers ?? 0), label:"Followers" },
    { icon:"🤝", value: loading ? "–" : String(followCounts?.following ?? 0), label:"Folgt"     },
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
  // Sprint F.5.2: eigener Loader → useProfileData (identisch zu TalentProfilePage)
  const { user } = useAuth();
  const resolvedId = profileId || user?.id;

  const {
    profile,
    moments,
    followCounts,
    loading,
    reload,
  } = useProfileData(resolvedId);

  // Owner-spezifische States
  const [mounted,      setMounted]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStudio,   setShowStudio]   = useState(false);

  // isOwner: true wenn das eigene Profil angesehen wird
  const isOwner = !!user?.id && (resolvedId === user.id);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);

  const handleBack = useCallback(()=>{ if(onClose) onClose(); }, [onClose]);

  // P3: Chat-Einstieg via ChatCenterOverlay — identisch zu TalentProfilePage
  const { setShowChat, setChatRecipient } = useHome() || {};
  const handleOpenChat = useCallback(() => {
    if (!profile?.id || !setShowChat) return;
    setChatRecipient?.({
      id:           profile.id,
      display_name: profile.display_name || profile.username || "Mitglied",
      avatar_url:   profile.avatar_url || null,
    });
    setShowChat(true);
  }, [profile, setChatRecipient, setShowChat]);

  // ── Sprint F.5.3: onSave-Handler (identisch zu TalentProfilePage) ──
  const handleBioSave = useCallback(async (bio) => {
    if (!user?.id) return;
    await supabase.from("profiles")
      .update({ bio, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    reload();
  }, [user?.id, reload]);

  const handleLocationSave = useCallback(async (locationStr) => {
    if (!user?.id) return;
    await supabase.from("profiles")
      .update({ location: locationStr, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    reload();
  }, [user?.id, reload]);

  const handleAvailabilitySave = useCallback(async (isAvailable) => {
    if (!user?.id) return;
    await supabase.from("profiles")
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    reload();
  }, [user?.id, reload]);

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
      <ProfileHeader onBack={handleBack} isOwner={isOwner} onSettings={() => setShowSettings(true)}/>

      {/* P3: Chat-Button — nur für Besucher (nicht für Owner selbst) */}
      {profile && !loading && !isOwner && (
        <div style={{ position:"absolute", top:12, right:52, zIndex:10001 }}>
          <button
            className="bpp-press"
            onClick={handleOpenChat}
            style={{
              width:38, height:38, borderRadius:"50%",
              background:"#0EC4B8", border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 2px 10px rgba(14,196,184,0.35)",
              touchAction:"manipulation",
            }}
          ><span style={{fontSize:17}}>💬</span></button>
        </div>
      )}

      {/* Scrollable body */}
      <div className="bpp-scroll" style={{ flex:1, overflowY:"auto",
        paddingBottom:"max(40px,calc(28px + env(safe-area-inset-bottom,0px)))" }}>

        {/* 1. Cinematic hero + floating avatar */}
        <CinematicHero profile={profile} loading={loading}/>
        <Gap h={52}/>  {/* space for avatar overhang */}

        {/* 2. Identity — Name, Badge, Location inline (Basis-spezifisch) */}
        <IdentitySection profile={profile} loading={loading}/>
        <Gap h={20}/>

        {/* 3. Über dich — kanonisch (Sprint F.5.3) */}
        <AboutSection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onSave={handleBioSave}
        />
        <Gap h={24}/>

        {/* 4. Interessen-Grid (Basis-spezifisch, skills als Display-Tags) */}
        <InterestsGrid profile={profile} loading={loading}/>
        <Gap h={28}/>

        {/* 5. Momente — kanonisch MomentsSection (Sprint F.5.3) */}
        <MomentsSection
          moments={moments}
          isOwner={isOwner}
          loading={loading}
        />
        <Gap h={28}/>

        {/* 6. Offen für Begegnungen (Basis-spezifisch, hardcoded Tags) */}
        <OffenFuerSection profile={profile} loading={loading}/>
        <Gap h={28}/>

        {/* 7. Verfügbarkeit — kanonisch (Sprint F.5.3) */}
        <AvailabilitySection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onSave={handleAvailabilitySave}
        />
        <Gap h={20}/>

        {/* 8. Standort — kanonisch (Sprint F.5.3) */}
        <LocationSection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onSave={handleLocationSave}
        />
        <Gap h={20}/>

        {/* 9. Sichtbarkeit — kanonisch VisibilitySection (Sprint F.5.3) */}
        <VisibilitySection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
        />
        <Gap h={24}/>

        {/* 10. Kundenstimmen — kanonisch (Sprint F.5.3) */}
        <RecommendationsSection
          recommendations={recommendations}
          isOwner={isOwner}
          loading={loading}
          onAddRec={null}
          onShowAll={null}
        />
        <Gap h={24}/>

        {/* 11. Social context bar (Basis-spezifisch, followCounts) */}
        <SocialContextBar loading={loading} followCounts={followCounts}/>
        <Gap h={24}/>

        {/* 8. "Mein HUI" — nur für Owner sichtbar */}
        {isOwner && (
          <div style={{ padding:`0 ${T.px}px`, marginBottom:32 }}>
            {/* Divider */}
            <div style={{ height:1, background:T.border, marginBottom:24 }}/>

            {/* CTA-Karte */}
            <div style={{
              background:T.bgCard,
              borderRadius:T.r20,
              border:`1px solid ${T.border}`,
              boxShadow:T.card,
              padding:"20px",
              display:"flex", flexDirection:"column", gap:14,
            }}>
              {/* Titel */}
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>🌿</span>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
                    Mein HUI
                  </div>
                  <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:1 }}>
                    Verwalte dein Profil und deine Einstellungen
                  </div>
                </div>
              </div>

              {/* Buttons-Reihe */}
              <div style={{ display:"flex", gap:10 }}>
                {/* Profil bearbeiten → SettingsModal */}
                <button className="bpp-press" onClick={() => setShowSettings(true)} style={{
                  flex:1, padding:"12px 10px", borderRadius:T.r16,
                  background:`linear-gradient(135deg,#0EC4B8,#0DBBAF)`,
                  border:"none", cursor:"pointer", touchAction:"manipulation",
                  fontFamily:"inherit",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                  boxShadow:"0 4px 14px rgba(14,196,184,0.25)",
                }}>
                  <span style={{ fontSize:20 }}>⚙️</span>
                  <span style={{ fontSize:11.5, fontWeight:700, color:"white" }}>Einstellungen</span>
                </button>

                {/* HUI Studio */}
                <button className="bpp-press" onClick={() => setShowStudio(true)} style={{
                  flex:1, padding:"12px 10px", borderRadius:T.r16,
                  background:T.bgCard, border:`1.5px solid ${T.border}`,
                  cursor:"pointer", touchAction:"manipulation",
                  fontFamily:"inherit",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                  boxShadow:T.card,
                }}>
                  <span style={{ fontSize:20 }}>🎛️</span>
                  <span style={{ fontSize:11.5, fontWeight:700, color:T.ink }}>HUI Studio</span>
                </button>
              </div>

              {/* Hinweis */}
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"10px 14px", borderRadius:T.r12,
                background:"rgba(14,196,184,0.06)",
                border:`1px solid rgba(14,196,184,0.15)`,
              }}>
                <span style={{ fontSize:14 }}>🔒</span>
                <span style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45 }}>
                  So sieht dein Profil für andere aus. Bearbeite es über Einstellungen.
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Modals (nur Owner) ─────────────────────────────────── */}
      {isOwner && showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onSave={(updated) => {
            reload();           // Sprint F.5.2: reload statt lokales setProfile
            setShowSettings(false);
          }}
        />
      )}
      {isOwner && showStudio && (
        <HuiStudio
          profile={profile}
          onClose={() => setShowStudio(false)}
        />
      )}
    </div>
  );
}
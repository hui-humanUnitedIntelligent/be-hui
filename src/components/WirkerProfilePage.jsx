// WirkerProfilePage.jsx — HUI Phase 4
// Öffentliches Talent-Profil: echte Supabase-Daten, cinematic design
// Sektionen: Hero · Highlights · Portfolio · Experiences · Skills · DNA · Verfügbarkeit · Empfehlungen

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { HighlightsRow } from "./StoryBar";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8", tealGlow:"rgba(22,215,197,0.20)",
  coral:"#FF8A6B", coralPale:"#FFF2EE", coralGlow:"rgba(255,138,107,0.18)",
  gold:"#F5A623", goldPale:"#FFFBEB", goldGlow:"rgba(245,166,35,0.18)",
  green:"#10B981", greenPale:"#ECFDF5",
  cream:"#F9F6F2", warm:"#FFF9F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes wpFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes wpSlideUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes wpPop{0%{transform:scale(0.92);opacity:0}70%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  @keyframes wpPulse{0%,100%{opacity:1}50%{opacity:.45}}
  @keyframes wpSpin{to{transform:rotate(360deg)}}
  .wp-scroll::-webkit-scrollbar{display:none}
  .wp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .wp-tap{transition:transform .18s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .wp-tap:active{transform:scale(.95)}
`;

// ── Skeleton ──────────────────────────────────────────────────────────
function Skel({ w="100%", h=16, r=8, style={} }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"rgba(0,0,0,0.07)", animation:"wpPulse 1.4s ease-in-out infinite", ...style }} />;
}

// ── Section Header ────────────────────────────────────────────────────
function SecHead({ label, accent=C.teal, right=null }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 20px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:3, height:16, borderRadius:2, background:accent }} />
        <span style={{ fontSize:13, fontWeight:800, color:C.ink, letterSpacing:.3,
          textTransform:"uppercase" }}>{label}</span>
      </div>
      {right}
    </div>
  );
}

// ── Skill Chip ────────────────────────────────────────────────────────
function Chip({ label, color=C.teal }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center",
      background:`${color}18`, border:`1px solid ${color}44`,
      borderRadius:50, padding:"5px 12px",
      fontSize:12, fontWeight:600, color, whiteSpace:"nowrap" }}>
      {label}
    </div>
  );
}

// ── Work Card ─────────────────────────────────────────────────────────
function WorkCard({ work, onBuy }) {
  return (
    <div className="wp-tap" onClick={() => onBuy?.(work)}
      style={{ background:C.card, borderRadius:18,
        overflow:"hidden", flexShrink:0, width:200,
        boxShadow:"0 2px 14px rgba(0,0,0,0.07)",
        border:`1px solid ${C.border}` }}>
      <div style={{ width:"100%", height:140, overflow:"hidden" }}>
        <img src={work.cover_url || work.images?.[0] ||
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80"}
          alt={work.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            transition:"transform .4s ease" }}
          onMouseOver={e=>e.target.style.transform="scale(1.04)"}
          onMouseOut={e=>e.target.style.transform="scale(1)"} />
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink,
          marginBottom:4, lineHeight:1.3 }}>{work.title}</div>
        {work.price && (
          <div style={{ fontSize:13, fontWeight:800, color:C.coral }}>€ {work.price}</div>
        )}
      </div>
    </div>
  );
}

// ── Experience Card ───────────────────────────────────────────────────
function ExpCard({ exp }) {
  return (
    <div style={{ background:C.card, borderRadius:18, overflow:"hidden",
      flexShrink:0, width:240,
      boxShadow:"0 2px 14px rgba(0,0,0,0.07)", border:`1px solid ${C.border}` }}>
      <div style={{ width:"100%", height:130, overflow:"hidden",
        background:`linear-gradient(135deg,${C.teal}22,${C.coral}18)`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>
        {exp.cover_url
          ? <img src={exp.cover_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : "✨"}
      </div>
      <div style={{ padding:"10px 14px 14px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4, lineHeight:1.3 }}>
          {exp.title}
        </div>
        {exp.description && (
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.5, marginBottom:6,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {exp.description}
          </div>
        )}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {exp.duration && <Chip label={`⏱ ${exp.duration}`} color={C.teal} />}
          {exp.price    && <Chip label={`€ ${exp.price}`}    color={C.coral} />}
        </div>
      </div>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────
function RecCard({ rec }) {
  return (
    <div style={{ background:C.card, borderRadius:18, padding:"16px",
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)", border:`1px solid ${C.border}`,
      marginBottom:10 }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg,${C.teal}44,${C.coral}44)`,
          overflow:"hidden", display:"flex", alignItems:"center",
          justifyContent:"center", fontWeight:700, color:C.teal, fontSize:16 }}>
          {rec.reviewer_name?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.ink }}>
            {rec.reviewer_name || "Anonymer Nutzer"}
          </div>
          <div style={{ fontSize:11, color:C.muted }}>{rec.created_at
            ? new Date(rec.created_at).toLocaleDateString("de-DE",{month:"long",year:"numeric"})
            : ""}</div>
        </div>
        <div style={{ fontSize:14 }}>{"⭐".repeat(rec.rating || 5)}</div>
      </div>
      {rec.text && (
        <p style={{ margin:0, fontSize:14, color:C.ink2, lineHeight:1.65,
          fontStyle:"italic" }}>"{rec.text}"</p>
      )}
      {rec.work_title && (
        <div style={{ marginTop:8, fontSize:11, color:C.muted }}>
          📦 {rec.work_title}
        </div>
      )}
    </div>
  );
}

// ── Booking Sheet ─────────────────────────────────────────────────────
function BookingSheet({ profile, onClose, onBook }) {
  const [msg, setMsg] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, zIndex:4000,
      background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:C.card, borderRadius:"24px 24px 0 0",
        padding:"24px 20px", paddingBottom:"max(32px,env(safe-area-inset-bottom,32px))",
        width:"100%", animation:"wpSlideUp .3s ease-out" }}>
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)",
          margin:"0 auto 20px" }} />
        <div style={{ fontSize:18, fontWeight:800, color:C.ink, marginBottom:6 }}>
          Anfrage an {profile?.display_name || "Talent"}
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:16, lineHeight:1.5 }}>
          Beschreibe kurz was du dir vorstellst — das Talent meldet sich dann bei dir.
        </div>
        <textarea
          value={msg} onChange={e=>setMsg(e.target.value)}
          placeholder="Was hast du in mind? Je mehr Details, desto besser..."
          rows={4}
          style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:14,
            padding:"12px 14px", fontSize:14, color:C.ink, fontFamily:"inherit",
            resize:"none", outline:"none", boxSizing:"border-box",
            background:C.cream }} />
        <button className="wp-tap" onClick={() => { onBook?.(msg); onClose(); }}
          style={{ marginTop:12, width:"100%", padding:"15px",
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", borderRadius:50, fontSize:16, fontWeight:800,
            color:"white", cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 6px 24px ${C.tealGlow}` }}>
          Anfrage senden ✦
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function WirkerProfilePage({ wirker: rawWirker, onClose, onBook }) {
  const [profile,    setProfile]    = useState(null);
  const [works,      setWorks]      = useState([]);
  const [exps,       setExps]       = useState([]);
  const [recs,       setRecs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("werke");
  const [showBooking,setShowBooking]= useState(false);
  const scrollRef = useRef(null);

  // Identifier: can be user_id (UUID) or username (string)
  const identifier = rawWirker?.user_id || rawWirker?.id || rawWirker?.username || rawWirker?.name;

  useEffect(() => {
    if (!identifier) { setLoading(false); return; }
    load();
  }, [identifier]);

  async function load() {
    setLoading(true);
    try {
      // 1. Profile
      let profileData = null;
      // Try by user_id first
      if (rawWirker?.user_id || rawWirker?.id) {
        const uid = rawWirker?.user_id || rawWirker?.id;
        const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
        profileData = data;
      }
      // Fallback: by username
      if (!profileData && rawWirker?.username) {
        const { data } = await supabase.from("profiles").select("*")
          .eq("username", rawWirker.username).single();
        profileData = data;
      }
      // Last fallback: use raw data directly
      if (!profileData) profileData = rawWirker || {};
      setProfile(profileData);

      const uid = profileData?.id || profileData?.user_id;

      // 2. Works
      if (uid) {
        const { data: worksData } = await supabase
          .from("works")
          .select("id, title, description, price, cover_url, images, category, created_at")
          .eq("user_id", uid)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(12);
        setWorks(worksData || []);
      }

      // 3. Experiences
      if (uid) {
        const { data: expData } = await supabase
          .from("experiences")
          .select("id, title, description, price, duration, cover_url, date, spots_available")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(6);
        setExps(expData || []);
      }

      // 4. Recommendations / Reviews
      if (uid) {
        const { data: recData } = await supabase
          .from("recommendations")
          .select("id, text, rating, reviewer_name, work_title, created_at")
          .eq("wirker_id", uid)
          .order("created_at", { ascending: false })
          .limit(10);
        setRecs(recData || []);
      }

    } catch(e) {
      console.error("[WirkerProfile] load error:", e.message);
    } finally {
      setLoading(false);
    }
  }

  // Merged display data: DB first, raw fallback
  const p = {
    display_name: profile?.display_name || rawWirker?.name || "Talent",
    username:     profile?.username     || rawWirker?.username || "",
    avatar_url:   profile?.avatar_url   || rawWirker?.img || null,
    header_img:   profile?.header_img   || rawWirker?.bg  || null,
    bio:          profile?.bio          || rawWirker?.bio  || rawWirker?.tagline || "",
    city:         profile?.city         || rawWirker?.city || "",
    talent:       profile?.talent       || rawWirker?.talent || "",
    tagline:      profile?.tagline      || rawWirker?.tagline || "",
    skills:       profile?.skills       || rawWirker?.skills || [],
    mood_dna:     profile?.mood_dna     || rawWirker?.mood_dna || [],
    availability: profile?.availability ?? rawWirker?.available ?? true,
    hourly_rate:  profile?.hourly_rate  || rawWirker?.hourly || null,
    verified:     profile?.verified     || rawWirker?.verified || false,
    impact_eur:   profile?.impact_eur   || rawWirker?.impactEur || 0,
    recommendations_count: recs.length  || rawWirker?.recs || 0,
    id:           profile?.id           || rawWirker?.user_id,
  };

  const TABS = [
    { key:"werke",      label:"Werke",      count: works.length },
    { key:"erlebnisse", label:"Erlebnisse", count: exps.length  },
    { key:"empf",       label:"Empfeh.",    count: recs.length  },
  ];

  const defaultSkills = ["Kreativität","Handwerk","Qualität"];
  const displaySkills = (Array.isArray(p.skills) && p.skills.length > 0)
    ? p.skills : defaultSkills;

  const defaultDNA = ["🎨 Visuell","💡 Konzeptuell","🌿 Nachhaltig"];
  const displayDNA = (Array.isArray(p.mood_dna) && p.mood_dna.length > 0)
    ? p.mood_dna : defaultDNA;

  return (
    <>
      <style>{CSS}</style>

      <div style={{ position:"fixed", inset:0, zIndex:300,
        background:C.cream, overflowY:"auto",
        animation:"wpFadeIn .25s ease both" }}
        className="wp-scroll" ref={scrollRef}>

        {/* ══ 1. CINEMATIC HERO ══════════════════════════════════════ */}
        <div style={{ position:"relative", height:"62vh", minHeight:380, maxHeight:560 }}>

          {/* BG image */}
          {p.header_img ? (
            <img src={p.header_img} alt=""
              style={{ position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", filter:"brightness(0.62) saturate(1.1)" }} />
          ) : (
            <div style={{ position:"absolute", inset:0,
              background:`linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, ${C.teal}44 100%)` }} />
          )}

          {/* Cinematic gradient */}
          <div style={{ position:"absolute", inset:0, background:`
            linear-gradient(to bottom, rgba(0,0,0,.3) 0%, transparent 25%,
              rgba(8,4,0,.15) 55%, rgba(8,4,0,.88) 100%),
            linear-gradient(to right, ${C.teal}18 0%, transparent 50%)` }} />

          {/* Back button */}
          <div style={{ position:"absolute", top:"max(52px,env(safe-area-inset-top,52px))",
            left:16, right:16, display:"flex", justifyContent:"space-between", zIndex:10 }}>
            <button className="wp-tap" onClick={onClose}
              style={{ width:42, height:42, borderRadius:"50%",
                background:"rgba(255,255,255,0.16)", backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,0.25)",
                cursor:"pointer", color:"white", fontSize:18,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              ←
            </button>
            {/* Share */}
            <button className="wp-tap"
              style={{ width:42, height:42, borderRadius:"50%",
                background:"rgba(255,255,255,0.16)", backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,0.25)",
                cursor:"pointer", color:"white", fontSize:16,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              ↑
            </button>
          </div>

          {/* Hero content */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0,
            padding:"0 20px 24px", animation:"wpSlideUp .5s .1s ease both" }}>

            {/* Avatar */}
            <div style={{ width:72, height:72, borderRadius:"50%",
              border:"3px solid rgba(255,255,255,0.85)",
              overflow:"hidden", marginBottom:12,
              background:`linear-gradient(135deg,${C.teal}55,${C.coral}44)` }}>
              {p.avatar_url
                ? <img src={p.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    fontSize:28, fontWeight:800, color:"white" }}>
                    {p.display_name[0]}
                  </div>}
            </div>

            {/* Name + badges */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:22, fontWeight:900, color:"white", letterSpacing:-.3 }}>
                {p.display_name}
              </span>
              {p.verified && (
                <div style={{ background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                  borderRadius:50, padding:"2px 8px", fontSize:11, fontWeight:700, color:"white" }}>
                  ✓ Verifiziert
                </div>
              )}
            </div>

            {/* Talent + city */}
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
              {p.talent && (
                <span style={{ fontSize:14, color:`${C.teal}`, fontWeight:600 }}>{p.talent}</span>
              )}
              {p.city && (
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>📍 {p.city}</span>
              )}
            </div>

            {/* Tagline */}
            {p.tagline && (
              <p style={{ margin:0, fontSize:14, color:"rgba(255,255,255,0.8)",
                fontStyle:"italic", lineHeight:1.5, maxWidth:300 }}>
                "{p.tagline}"
              </p>
            )}

            {/* Stats row */}
            <div style={{ display:"flex", gap:20, marginTop:12 }}>
              {[
                { val: p.recommendations_count || 0, label:"Empfeh." },
                { val: works.length,                  label:"Werke"   },
                { val: `€ ${(+p.impact_eur||0).toFixed(0)}`, label:"Impact" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize:16, fontWeight:800, color:"white" }}>{s.val}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", fontWeight:500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ 2. CTA BAR ══════════════════════════════════════════════ */}
        <div style={{ padding:"16px 20px",
          background:`linear-gradient(to bottom, rgba(8,4,0,.06), transparent)`,
          display:"flex", gap:10 }}>
          <button className="wp-tap" onClick={() => setShowBooking(true)}
            style={{ flex:1, padding:"14px",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:50, fontSize:15, fontWeight:800,
              color:"white", cursor:"pointer", fontFamily:"inherit",
              boxShadow:`0 6px 20px ${C.tealGlow}` }}>
            Anfragen ✦
          </button>
          {p.hourly_rate && (
            <div style={{ display:"flex", alignItems:"center", gap:6,
              background:C.card, borderRadius:50, padding:"0 16px",
              border:`1px solid ${C.border}`,
              fontSize:14, fontWeight:700, color:C.ink }}>
              ab € {p.hourly_rate}/h
            </div>
          )}
          {/* Availability badge */}
          <div style={{ display:"flex", alignItems:"center", gap:5,
            background: p.availability ? C.greenPale : "rgba(0,0,0,0.06)",
            borderRadius:50, padding:"0 14px",
            fontSize:12, fontWeight:700,
            color: p.availability ? C.green : C.muted }}>
            <div style={{ width:6, height:6, borderRadius:"50%",
              background: p.availability ? C.green : C.muted2 }} />
            {p.availability ? "Verfügbar" : "Ausgebucht"}
          </div>
        </div>

        {/* ══ 3. BIO ══════════════════════════════════════════════════ */}
        {p.bio && (
          <div style={{ padding:"4px 20px 20px" }}>
            <p style={{ margin:0, fontSize:15, color:C.ink2, lineHeight:1.7,
              fontWeight:400 }}>{p.bio}</p>
          </div>
        )}

        {/* ══ 4. SKILLS ═══════════════════════════════════════════════ */}
        <div style={{ padding:"0 20px 20px" }}>
          <SecHead label="Skills" accent={C.teal} />
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {displaySkills.map((s,i) => (
              <Chip key={i} label={typeof s === "string" ? s : s.label || s} color={C.teal} />
            ))}
          </div>
        </div>

        {/* ══ 5. CREATIVE DNA ═════════════════════════════════════════ */}
        <div style={{ padding:"0 20px 20px" }}>
          <SecHead label="Creative DNA" accent={C.coral} />
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {displayDNA.map((d,i) => (
              <Chip key={i} label={typeof d === "string" ? d : d.label || d} color={C.coral} />
            ))}
          </div>
        </div>

        {/* ══ 6. STORY HIGHLIGHTS ═════════════════════════════════════ */}
        {p.id && (
          <div style={{ paddingBottom:8 }}>
            <HighlightsRow userId={p.id} />
          </div>
        )}

        {/* ══ 7. TABS ═════════════════════════════════════════════════ */}
        <div style={{ padding:"0 20px 0", marginBottom:16 }}>
          <div style={{ display:"flex", gap:4, background:"rgba(0,0,0,0.05)",
            borderRadius:50, padding:4 }}>
            {TABS.map(t => (
              <button key={t.key} className="wp-tap"
                onClick={() => setActiveTab(t.key)}
                style={{ flex:1, padding:"9px 4px",
                  background: activeTab === t.key
                    ? `linear-gradient(135deg,${C.teal},${C.coral})`
                    : "transparent",
                  border:"none", borderRadius:50,
                  fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  color: activeTab === t.key ? "white" : C.muted,
                  transition:"all .2s ease" }}>
                {t.label}{t.count > 0 ? ` (${t.count})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* ══ 8. TAB CONTENT ══════════════════════════════════════════ */}

        {/* WERKE */}
        {activeTab === "werke" && (
          <div style={{ paddingBottom:40 }}>
            {loading ? (
              <div style={{ padding:"0 20px", display:"flex", gap:12, overflowX:"auto" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ flexShrink:0 }}>
                    <Skel w={200} h={140} r={14} />
                    <Skel w={140} h={12} r={6} style={{ marginTop:8 }} />
                  </div>
                ))}
              </div>
            ) : works.length > 0 ? (
              <div className="wp-scroll" style={{ display:"flex", gap:12,
                overflowX:"auto", padding:"0 20px",
                WebkitOverflowScrolling:"touch" }}>
                {works.map(w => (
                  <WorkCard key={w.id} work={w} onBuy={onBook} />
                ))}
              </div>
            ) : (
              <div style={{ padding:"40px 20px", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🎨</div>
                <div style={{ fontSize:14, color:C.muted }}>Noch keine Werke veröffentlicht.</div>
              </div>
            )}
          </div>
        )}

        {/* ERLEBNISSE */}
        {activeTab === "erlebnisse" && (
          <div style={{ paddingBottom:40 }}>
            {loading ? (
              <div style={{ padding:"0 20px", display:"flex", gap:12, overflowX:"auto" }}>
                {[0,1].map(i => <Skel key={i} w={240} h={200} r={18} style={{ flexShrink:0 }} />)}
              </div>
            ) : exps.length > 0 ? (
              <div className="wp-scroll" style={{ display:"flex", gap:12,
                overflowX:"auto", padding:"0 20px",
                WebkitOverflowScrolling:"touch" }}>
                {exps.map(e => <ExpCard key={e.id} exp={e} />)}
              </div>
            ) : (
              <div style={{ padding:"40px 20px", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✨</div>
                <div style={{ fontSize:14, color:C.muted }}>Noch keine Erlebnisse.</div>
              </div>
            )}
          </div>
        )}

        {/* EMPFEHLUNGEN */}
        {activeTab === "empf" && (
          <div style={{ padding:"0 20px 40px" }}>
            {loading ? (
              [0,1,2].map(i => <Skel key={i} h={100} r={14} style={{ marginBottom:10 }} />)
            ) : recs.length > 0 ? (
              recs.map(r => <RecCard key={r.id} rec={r} />)
            ) : (
              <div style={{ padding:"40px 0", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
                <div style={{ fontSize:14, color:C.muted }}>
                  Noch keine Empfehlungen. Die ersten kommen nach dem ersten Auftrag.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ 9. IMPACT SECTION ═══════════════════════════════════════ */}
        {(+p.impact_eur || 0) > 0 && (
          <div style={{ margin:"0 20px 24px",
            background:`linear-gradient(135deg, ${C.teal}12, ${C.coral}0A)`,
            border:`1px solid ${C.teal}30`, borderRadius:20, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ fontSize:28 }}>🌱</div>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:C.teal, marginBottom:2 }}>
                  Impact durch {p.display_name}
                </div>
                <div style={{ fontSize:12, color:C.muted2, lineHeight:1.5 }}>
                  € {(+p.impact_eur).toFixed(2)} sind bereits in soziale Projekte geflossen.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ BOTTOM PADDING ══ */}
        <div style={{ height:40 }} />

      </div>

      {/* ── BOOKING SHEET ── */}
      {showBooking && (
        <BookingSheet
          profile={p}
          onClose={() => setShowBooking(false)}
          onBook={onBook}
        />
      )}
    </>
  );
}

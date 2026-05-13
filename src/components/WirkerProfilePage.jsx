// WirkerProfilePage.jsx — HUI v2
// Emotionaleres, lebendigeres Fremdprofil mit Fokus-Badge System
// Dynamisches Layout je nach focus_type: works | experiences | hybrid

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
  @keyframes wpSlideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes wpPop{0%{transform:scale(0.92);opacity:0}70%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  @keyframes wpPulse{0%,100%{opacity:1}50%{opacity:.45}}
  @keyframes focusBadgeIn{from{opacity:0;transform:scale(0.7) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
  .wp-scroll::-webkit-scrollbar{display:none}
  .wp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .wp-tap{transition:transform .18s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent;border:none;cursor:pointer;font-family:inherit;background:none}
  .wp-tap:active{transform:scale(.93)}
  .wp-social-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:10px 18px;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;transition:transform .18s cubic-bezier(.34,1.4,.64,1),box-shadow .18s;border:none;font-family:inherit;-webkit-tap-highlight-color:transparent;}
  .wp-social-btn:active{transform:scale(.92)}
  .wp-tab-pill{flex:1;padding:9px 4px;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;transition:all .22s ease;-webkit-tap-highlight-color:transparent;}
`;

// ── Skeleton ──────────────────────────────────────────────────────────
function Skel({ w="100%", h=16, r=8, style={} }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"rgba(0,0,0,0.07)", animation:"wpPulse 1.4s ease-in-out infinite", ...style }} />;
}

// ── Focus Badge ───────────────────────────────────────────────────────
const FOCUS_CONFIG = {
  works:       { label:"Werk-Schaffender",   icon:"🎨", color:C.gold,  bg:"#FFFBEB", border:"#F5A62344" },
  experiences: { label:"Erlebnis-Begleiter", icon:"✨", color:C.teal,  bg:C.tealPale, border:`${C.teal}44` },
  hybrid:      { label:"Kreativ & Präsent",  icon:"⚡", color:C.coral, bg:C.coralPale, border:`${C.coral}44` },
};
function FocusBadge({ type }) {
  const cfg = FOCUS_CONFIG[type] || FOCUS_CONFIG.hybrid;
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:cfg.bg, border:`1px solid ${cfg.border}`,
      borderRadius:50, padding:"4px 10px",
      fontSize:11, fontWeight:700, color:cfg.color,
      animation:"focusBadgeIn .4s .2s ease both",
    }}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────
function Chip({ label, color=C.teal }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center",
      background:`${color}14`, border:`1px solid ${color}33`,
      borderRadius:50, padding:"5px 12px",
      fontSize:12, fontWeight:600, color, whiteSpace:"nowrap" }}>
      {label}
    </div>
  );
}

// ── Work Card ─────────────────────────────────────────────────────────
function WorkCard({ work, large=false, onBuy }) {
  const img = work.cover_url || work.media_url
    || (Array.isArray(work.images) && work.images[0])
    || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80";
  return (
    <div className="wp-tap" onClick={() => onBuy?.(work)} style={{
      background:C.card, borderRadius:16, overflow:"hidden",
      flexShrink:0, width: large ? "100%" : 180,
      boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
      border:`1px solid ${C.border}`,
    }}>
      <div style={{ width:"100%", height: large ? 220 : 140, overflow:"hidden" }}>
        <img src={img} alt={work.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            transition:"transform .4s ease" }}
          onMouseOver={e=>e.target.style.transform="scale(1.05)"}
          onMouseOut={e=>e.target.style.transform="scale(1)"} />
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink,
          marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {work.title || "Werk"}
        </div>
        {work.price != null && (
          <div style={{ fontSize:13, fontWeight:800, color:C.teal }}>€ {Number(work.price).toFixed(0)}</div>
        )}
      </div>
    </div>
  );
}

// ── Experience Card ───────────────────────────────────────────────────
function ExpCard({ exp, large=false }) {
  return (
    <div className="wp-tap" style={{
      background:C.card, borderRadius:16, overflow:"hidden",
      flexShrink:0, width: large ? "100%" : 220,
      boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
      border:`1px solid ${C.border}`,
    }}>
      {(exp.cover_url || exp.media_url) && (
        <div style={{ width:"100%", height: large ? 180 : 120, overflow:"hidden" }}>
          <img src={exp.cover_url || exp.media_url} alt={exp.title}
            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
      )}
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4 }}>
          {exp.title || "Erlebnis"}
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {exp.duration && (
            <span style={{ fontSize:11, color:C.muted, fontWeight:500 }}>⏱ {exp.duration}</span>
          )}
          {exp.price != null && (
            <span style={{ fontSize:12, fontWeight:800, color:C.coral }}>ab € {Number(exp.price).toFixed(0)}</span>
          )}
          {exp.spots_available > 0 && (
            <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>✓ {exp.spots_available} Plätze</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Rec Card ──────────────────────────────────────────────────────────
function RecCard({ rec }) {
  return (
    <div style={{ background:C.card, borderRadius:16, padding:"16px",
      boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:`1px solid ${C.border}`,
      marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <div>
          <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>
            {rec.reviewer_name || "Kunde"}
          </span>
          {rec.work_title && (
            <span style={{ fontSize:11, color:C.muted, marginLeft:6 }}>zu: {rec.work_title}</span>
          )}
        </div>
        <div style={{ fontSize:14, letterSpacing:1 }}>
          {"★".repeat(rec.rating || 5)}
        </div>
      </div>
      {rec.text && (
        <p style={{ margin:0, fontSize:14, color:C.ink2, lineHeight:1.6 }}>
          „{rec.text}"
        </p>
      )}
    </div>
  );
}

// ── Social Button ─────────────────────────────────────────────────────
function SocialBtn({ label, icon, primary=false, onClick }) {
  return (
    <button className="wp-social-btn" onClick={onClick} style={{
      flex: primary ? 2 : 1,
      background: primary
        ? `linear-gradient(135deg,${C.teal},${C.teal2})`
        : "rgba(255,255,255,0.85)",
      color: primary ? "white" : C.ink2,
      boxShadow: primary
        ? `0 4px 14px ${C.tealGlow}`
        : "0 2px 8px rgba(0,0,0,0.07)",
      border: primary ? "none" : `1px solid ${C.border}`,
      backdropFilter: "blur(8px)",
    }}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ── Section Header ────────────────────────────────────────────────────
function SecHead({ label, accent=C.teal, sub=null }) {
  return (
    <div style={{ display:"flex", alignItems:"baseline", gap:8,
      padding:"0 20px", marginBottom:14 }}>
      <div style={{ width:3, height:16, borderRadius:2, background:accent, flexShrink:0, marginTop:2 }} />
      <span style={{ fontSize:13, fontWeight:800, color:C.ink,
        letterSpacing:.3, textTransform:"uppercase" }}>{label}</span>
      {sub && <span style={{ fontSize:12, color:C.muted }}>{sub}</span>}
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
  const [followed,   setFollowed]   = useState(false);
  const [activeTab,  setActiveTab]  = useState(null); // null = auto from focus
  const scrollRef = useRef(null);

  const identifier = rawWirker?.user_id || rawWirker?.id || rawWirker?.username;

  useEffect(() => {
    if (!identifier) { setLoading(false); return; }
    load();
  }, [identifier]);

  async function load() {
    setLoading(true);
    try {
      let profileData = null;
      const uid = rawWirker?.user_id || rawWirker?.id;
      if (uid) {
        const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
        profileData = data;
      }
      if (!profileData && rawWirker?.username) {
        const { data } = await supabase.from("profiles").select("*")
          .eq("username", rawWirker.username).single();
        profileData = data;
      }
      if (!profileData) profileData = rawWirker || {};
      setProfile(profileData);

      const resolvedUid = profileData?.id || profileData?.user_id;

      const [worksRes, expsRes, recsRes] = await Promise.all([
        resolvedUid ? supabase.from("works")
          .select("id,title,description,price,cover_url,media_url,images,category,created_at")
          .eq("user_id", resolvedUid).eq("status","published")
          .order("created_at",{ascending:false}).limit(20) : { data:[] },
        resolvedUid ? supabase.from("experiences")
          .select("id,title,description,price,duration,cover_url,media_url,date,spots_available")
          .eq("user_id", resolvedUid)
          .order("created_at",{ascending:false}).limit(12) : { data:[] },
        resolvedUid ? supabase.from("recommendations")
          .select("id,text,rating,reviewer_name,work_title,created_at")
          .eq("wirker_id", resolvedUid)
          .order("created_at",{ascending:false}).limit(20) : { data:[] },
      ]);

      setWorks(worksRes.data || []);
      setExps(expsRes.data || []);
      setRecs(recsRes.data || []);
    } catch(e) {
      console.error("[WirkerProfile] load error:", e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Merged display data ─────────────────────────────────────────────
  const p = {
    display_name: profile?.display_name || rawWirker?.name || "Talent",
    username:     profile?.username     || rawWirker?.username || "",
    avatar_url:   profile?.avatar_url   || rawWirker?.img || null,
    header_img:   profile?.header_img   || rawWirker?.bg  || null,
    bio:          profile?.bio          || rawWirker?.bio  || "",
    city:         profile?.city         || rawWirker?.city || "",
    talent:       profile?.talent       || rawWirker?.talent || "",
    tagline:      profile?.tagline      || rawWirker?.tagline || "",
    skills:       profile?.skills       || rawWirker?.skills || [],
    mood_dna:     profile?.mood_dna     || rawWirker?.mood_dna || [],
    availability: profile?.availability ?? rawWirker?.available ?? true,
    hourly_rate:  profile?.hourly_rate  || rawWirker?.hourly || null,
    verified:     profile?.verified     || rawWirker?.verified || false,
    impact_eur:   profile?.impact_eur   || rawWirker?.impactEur || 0,
    focus_type:   profile?.focus_type   || rawWirker?.focus_type || "hybrid",
    member_since: profile?.created_at   || null,
    id:           profile?.id           || rawWirker?.user_id,
  };

  // ── Auto-select initial tab based on focus ──────────────────────────
  const resolvedTab = activeTab || (
    p.focus_type === "works"       ? "werke"      :
    p.focus_type === "experiences" ? "erlebnisse" : "werke"
  );

  const displaySkills = Array.isArray(p.skills) && p.skills.length > 0
    ? p.skills : ["Kreativität","Handwerk","Qualität"];
  const displayDNA = Array.isArray(p.mood_dna) && p.mood_dna.length > 0
    ? p.mood_dna : ["🎨 Visuell","💡 Konzeptuell","🌿 Nachhaltig"];

  const memberYear = p.member_since
    ? new Date(p.member_since).getFullYear() : null;

  // ── Tab config depending on focus ──────────────────────────────────
  const TABS = [
    { key:"werke",      label:"Werke",        count: works.length },
    { key:"erlebnisse", label:"Erlebnisse",   count: exps.length  },
    { key:"empf",       label:"Empfehlungen", count: recs.length  },
  ];
  // Focus ordering: primary tab first
  if (p.focus_type === "experiences") {
    TABS.sort((a,b) => a.key==="erlebnisse" ? -1 : b.key==="erlebnisse" ? 1 : 0);
  }

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ position:"fixed",inset:0,zIndex:300,background:C.cream,
        display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:40,height:40,borderRadius:"50%",
            border:`3px solid ${C.teal}`, borderTopColor:"transparent",
            animation:"wpFadeIn .3s", margin:"0 auto 12px" }} />
          <div style={{ fontSize:13,color:C.muted }}>Profil laden…</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, zIndex:300,
        background:C.cream, overflowY:"auto",
        animation:"wpFadeIn .25s ease both" }}
        className="wp-scroll" ref={scrollRef}>

        {/* ══ 1. HERO — kompakter, mehr Fokus auf Content ══════════════ */}
        <div style={{ position:"relative", height:"44vh", minHeight:280, maxHeight:400 }}>
          {/* BG */}
          {p.header_img ? (
            <img src={p.header_img} alt=""
              style={{ position:"absolute",inset:0,width:"100%",height:"100%",
                objectFit:"cover",filter:"brightness(0.58) saturate(1.1)" }} />
          ) : (
            <div style={{ position:"absolute",inset:0,
              background:`linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, ${C.teal}44 100%)` }} />
          )}
          {/* Gradient overlay */}
          <div style={{ position:"absolute",inset:0,background:`
            linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 30%,
              rgba(8,4,0,.1) 55%, rgba(8,4,0,.92) 100%)` }} />

          {/* Back + share */}
          <div style={{ position:"absolute",
            top:"max(48px,env(safe-area-inset-top,48px))",
            left:16, right:16, display:"flex", justifyContent:"space-between", zIndex:10 }}>
            <button className="wp-tap" onClick={onClose}
              style={{ width:38,height:38,borderRadius:"50%",
                background:"rgba(255,255,255,0.15)",backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,0.2)",
                color:"white",fontSize:18,display:"flex",
                alignItems:"center",justifyContent:"center" }}>
              ←
            </button>
            <button className="wp-tap"
              style={{ width:38,height:38,borderRadius:"50%",
                background:"rgba(255,255,255,0.15)",backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,0.2)",
                color:"white",fontSize:15,display:"flex",
                alignItems:"center",justifyContent:"center" }}>
              ↑
            </button>
          </div>

          {/* Hero content — bottom */}
          <div style={{ position:"absolute",bottom:0,left:0,right:0,
            padding:"0 18px 18px",animation:"wpSlideUp .45s .05s ease both" }}>

            <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:10 }}>
              {/* Avatar */}
              <div style={{ width:64,height:64,borderRadius:"50%",
                border:"2.5px solid rgba(255,255,255,0.9)",overflow:"hidden",flexShrink:0,
                background:`linear-gradient(135deg,${C.teal}55,${C.coral}44)` }}>
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                  : <div style={{ width:"100%",height:"100%",display:"flex",
                      alignItems:"center",justifyContent:"center",
                      fontSize:24,fontWeight:800,color:"white" }}>
                      {p.display_name[0]}
                    </div>}
              </div>

              {/* Name block */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                  <span style={{ fontSize:20,fontWeight:900,color:"white",letterSpacing:-.3 }}>
                    {p.display_name}
                  </span>
                  {p.verified && (
                    <div style={{ background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                      borderRadius:50,padding:"2px 7px",fontSize:10,fontWeight:700,color:"white",flexShrink:0 }}>
                      ✓
                    </div>
                  )}
                </div>
                {p.username && (
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.55)",marginBottom:4 }}>
                    @{p.username}
                  </div>
                )}
                {/* Focus badge inline */}
                <FocusBadge type={p.focus_type} />
              </div>
            </div>

            {/* Meta row: location + member since */}
            <div style={{ display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
              {p.city && (
                <span style={{ fontSize:12,color:"rgba(255,255,255,0.55)" }}>📍 {p.city}</span>
              )}
              {memberYear && (
                <span style={{ fontSize:12,color:"rgba(255,255,255,0.45)" }}>Dabei seit {memberYear}</span>
              )}
              {p.talent && (
                <span style={{ fontSize:12,color:`${C.teal}`,fontWeight:600 }}>{p.talent}</span>
              )}
            </div>
          </div>
        </div>

        {/* ══ 2. SOCIAL ACTIONS ════════════════════════════════════════ */}
        <div style={{ padding:"14px 18px 0", display:"flex", gap:8 }}>
          <SocialBtn
            label={followed ? "Gefolgt" : "Folgen"}
            icon={followed ? "✓" : "+"}
            primary={!followed}
            onClick={() => setFollowed(f => !f)}
          />
          <SocialBtn label="Nachricht" icon="💬" onClick={() => {}} />
          <SocialBtn label="Anfragen" icon="✦" onClick={() => onBook?.(p)} />
        </div>

        {/* ══ 3. BIO + STATS ═══════════════════════════════════════════ */}
        <div style={{ padding:"14px 18px 0" }}>
          {p.tagline && (
            <p style={{ margin:"0 0 8px", fontSize:15, color:C.ink, fontWeight:600,
              lineHeight:1.5 }}>
              {p.tagline}
            </p>
          )}
          {p.bio && (
            <p style={{ margin:"0 0 12px", fontSize:14, color:C.ink2, lineHeight:1.65 }}>
              {p.bio}
            </p>
          )}
          {/* Stats strip */}
          <div style={{ display:"flex", gap:0,
            background:"rgba(0,0,0,0.04)", borderRadius:14, overflow:"hidden",
            border:`1px solid ${C.border}`, marginBottom:4 }}>
            {[
              { val: recs.length,   label:"Empfeh." },
              { val: works.length,  label:"Werke"   },
              { val: exps.length,   label:"Erlebn." },
              { val: `€ ${(+p.impact_eur||0).toFixed(0)}`, label:"Impact" },
            ].map((s,i,arr) => (
              <div key={s.label} style={{
                flex:1, padding:"10px 4px", textAlign:"center",
                borderRight: i < arr.length-1 ? `1px solid ${C.border}` : "none",
              }}>
                <div style={{ fontSize:15,fontWeight:800,color:C.ink }}>{s.val}</div>
                <div style={{ fontSize:10,color:C.muted,fontWeight:500,marginTop:1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ 4. SKILLS ════════════════════════════════════════════════ */}
        <div style={{ padding:"16px 18px 8px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {displaySkills.map((s,i) => (
              <Chip key={i} label={typeof s==="string"?s:s.label||s} color={C.teal} />
            ))}
            {displayDNA.map((d,i) => (
              <Chip key={"dna"+i} label={typeof d==="string"?d:d.label||d} color={C.coral} />
            ))}
          </div>
        </div>

        {/* ══ 5. STORY HIGHLIGHTS ══════════════════════════════════════ */}
        {p.id && (
          <div style={{ paddingBottom:4 }}>
            <HighlightsRow userId={p.id} />
          </div>
        )}

        {/* ══ 6. TABS ══════════════════════════════════════════════════ */}
        <div style={{ padding:"12px 18px 0", position:"sticky", top:0, zIndex:10,
          background:C.cream, borderBottom:`1px solid ${C.border}`, paddingBottom:0 }}>
          <div style={{ display:"flex", gap:4,
            background:"rgba(0,0,0,0.05)", borderRadius:50, padding:3 }}>
            {TABS.map(t => (
              <button key={t.key} className="wp-tab-pill"
                onClick={() => setActiveTab(t.key)}
                style={{
                  background: resolvedTab === t.key
                    ? `linear-gradient(135deg,${C.teal},${C.coral})`
                    : "transparent",
                  color: resolvedTab === t.key ? "white" : C.muted,
                }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{ marginLeft:4, fontSize:11,
                    opacity: resolvedTab === t.key ? 0.8 : 0.6 }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ height:12 }} />
        </div>

        {/* ══ 7. TAB CONTENT — dynamisch nach focus_type ═══════════════ */}
        <div style={{ padding:"16px 18px 100px", animation:"wpFadeIn .2s ease both" }}>

          {/* ── WERKE TAB ── */}
          {resolvedTab === "werke" && (
            <>
              {works.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🎨</div>
                  <div style={{ fontSize:14 }}>Noch keine Werke veröffentlicht</div>
                </div>
              ) : p.focus_type === "works" ? (
                /* WERK-FOKUS: große Galerie */
                <>
                  <SecHead label="Werke" accent={C.gold}
                    sub={`${works.length} Stück`} />
                  {/* First werk large */}
                  <div style={{ marginBottom:12 }}>
                    <WorkCard work={works[0]} large onBuy={onBook} />
                  </div>
                  {/* Rest 2-column grid */}
                  {works.length > 1 && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                      {works.slice(1).map(w => (
                        <div key={w.id} className="wp-tap" onClick={() => onBook?.(w)}
                          style={{ borderRadius:14, overflow:"hidden",
                            boxShadow:"0 2px 8px rgba(0,0,0,0.07)",
                            border:`1px solid ${C.border}` }}>
                          <div style={{ height:130, overflow:"hidden" }}>
                            <img src={w.cover_url||w.media_url||"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80"}
                              alt={w.title}
                              style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                          </div>
                          <div style={{ padding:"8px 10px" }}>
                            <div style={{ fontSize:12,fontWeight:700,color:C.ink,
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                              {w.title}
                            </div>
                            {w.price != null && (
                              <div style={{ fontSize:12,fontWeight:800,color:C.teal }}>
                                € {Number(w.price).toFixed(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Erlebnisse small below */}
                  {exps.length > 0 && (
                    <>
                      <SecHead label="Erlebnisse" accent={C.teal} sub="auch buchbar" />
                      <div style={{ display:"flex", gap:10, overflowX:"auto",
                        paddingBottom:8, WebkitOverflowScrolling:"touch" }}>
                        {exps.map(e => <ExpCard key={e.id} exp={e} />)}
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* HYBRID / default: horizontal scroll */
                <>
                  <SecHead label="Werke" accent={C.teal} sub={`${works.length} Stück`} />
                  <div style={{ display:"flex", gap:12, overflowX:"auto",
                    paddingBottom:10, WebkitOverflowScrolling:"touch" }}>
                    {works.map(w => <WorkCard key={w.id} work={w} onBuy={onBook} />)}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── ERLEBNISSE TAB ── */}
          {resolvedTab === "erlebnisse" && (
            <>
              {exps.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>✨</div>
                  <div style={{ fontSize:14 }}>Noch keine Erlebnisse angeboten</div>
                </div>
              ) : p.focus_type === "experiences" ? (
                /* ERLEBNIS-FOKUS: Showcase */
                <>
                  <SecHead label="Erlebnisse" accent={C.teal} sub="buchbar" />
                  <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
                    {exps.map(e => <ExpCard key={e.id} exp={e} large />)}
                  </div>
                  {works.length > 0 && (
                    <>
                      <SecHead label="Werke" accent={C.gold} />
                      <div style={{ display:"flex", gap:10, overflowX:"auto",
                        paddingBottom:8, WebkitOverflowScrolling:"touch" }}>
                        {works.map(w => <WorkCard key={w.id} work={w} onBuy={onBook} />)}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {exps.map(e => <ExpCard key={e.id} exp={e} large />)}
                </div>
              )}
            </>
          )}

          {/* ── EMPFEHLUNGEN TAB ── */}
          {resolvedTab === "empf" && (
            <>
              {recs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
                  <div style={{ fontSize:14 }}>Noch keine Empfehlungen</div>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:8,
                    padding:"0 0 16px" }}>
                    <span style={{ fontSize:24, fontWeight:900, color:C.ink }}>
                      {recs.length}
                    </span>
                    <span style={{ fontSize:14, color:C.muted }}>verifizierte Empfehlungen</span>
                  </div>
                  {recs.map(r => <RecCard key={r.id} rec={r} />)}
                </>
              )}
            </>
          )}

        </div>

        {/* ══ 8. STICKY BOTTOM CTA ═════════════════════════════════════ */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:20,
          padding:"12px 18px max(16px,env(safe-area-inset-bottom,16px))",
          background:`linear-gradient(to top, ${C.cream} 70%, transparent)`,
          display:"flex", gap:10 }}>
          <button className="wp-tap" onClick={() => onBook?.(p)} style={{
            flex:1, padding:"14px",
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", borderRadius:50,
            fontSize:15, fontWeight:800, color:"white",
            boxShadow:`0 6px 20px ${C.tealGlow}`,
          }}>
            Anfragen ✦
          </button>
          {p.hourly_rate && (
            <div style={{ display:"flex", alignItems:"center",
              background:C.card, borderRadius:50, padding:"0 16px",
              border:`1px solid ${C.border}`, fontSize:14, fontWeight:700, color:C.ink }}>
              ab € {p.hourly_rate}/h
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:5,
            background: p.availability ? C.greenPale : "rgba(0,0,0,0.06)",
            borderRadius:50, padding:"0 14px", fontSize:12, fontWeight:700,
            color: p.availability ? C.green : C.muted }}>
            <div style={{ width:6,height:6,borderRadius:"50%",
              background: p.availability ? C.green : C.muted2 }} />
            {p.availability ? "Verfügbar" : "Ausgebucht"}
          </div>
        </div>

      </div>
    </>
  );
}

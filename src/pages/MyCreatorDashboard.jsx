// src/pages/MyCreatorDashboard.jsx — HUI Creator Dashboard v2
// Light Mode · Premium · Human-Centered Creator Experience
// Reference: uploaded iPad design — evolved into full HUI Design Language

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth }          from "../lib/AuthContext.jsx";
import { supabase }         from "../lib/supabaseClient.js";
import { useHuiActions, A } from "../core/hui.actions.js";

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  // Backgrounds
  pageBg:     "#F8F9FB",
  cardBg:     "#FFFFFF",
  cardBg2:    "rgba(255,255,255,0.72)",
  heroBg:     "linear-gradient(160deg,#F0FDFC 0%,#FFF8F6 60%,#F8F9FB 100%)",

  // Brand
  teal:       "#1ECFCB",
  tealDeep:   "#0DC4B5",
  tealLight:  "#E6FAFA",
  tealGlow:   "rgba(30,207,203,0.15)",
  tealGlow2:  "rgba(30,207,203,0.08)",

  coral:      "#FF7A59",
  coralDeep:  "#F06445",
  coralLight: "#FFF2EE",
  coralGlow:  "rgba(255,122,89,0.12)",

  // Text
  ink:        "#1A1F2E",
  ink2:       "#3D4356",
  soft:       "#7A8299",
  muted:      "#B0B8CC",
  placeholder:"#D4D9E8",

  // Borders
  border:     "rgba(26,31,46,0.06)",
  borderSoft: "rgba(26,31,46,0.04)",

  // Shadows
  shadow:     "0 2px 24px rgba(26,31,46,0.06)",
  shadowMd:   "0 8px 32px rgba(26,31,46,0.09)",
  shadowSm:   "0 1px 8px rgba(26,31,46,0.05)",
  shadowTeal: "0 8px 28px rgba(30,207,203,0.22)",
  shadowCoral:"0 8px 28px rgba(255,122,89,0.22)",

  // Radius
  r:  20,
  r2: 16,
  r3: 12,
  rFull: 999,
};

// ── CSS Injection ──────────────────────────────────────────────
let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return; _css = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes mcd-rise { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
    @keyframes mcd-fade { from { opacity:0 } to { opacity:1 } }
    @keyframes mcd-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes mcd-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes mcd-ring { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
    @keyframes mcd-wave { 0%{d:path("M0,6 C10,2 20,10 30,6 C40,2 50,10 60,6 C70,2 80,10 90,6")} }
    @keyframes orb-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(30,207,203,0.35)} 50%{box-shadow:0 0 0 8px rgba(30,207,203,0)} }
    .mcd-tap { -webkit-tap-highlight-color:transparent; touch-action:manipulation; user-select:none; cursor:pointer; }
    .mcd-scroll { -webkit-overflow-scrolling:touch; overflow-y:auto; overflow-x:hidden; }
    .mcd-scroll::-webkit-scrollbar { display:none; }
    .mcd-hover:hover { filter:brightness(0.97); }
    .mcd-card-hover { transition:transform .18s ease, box-shadow .18s ease; }
    .mcd-card-hover:active { transform:scale(0.985); }
  `;
  document.head.appendChild(s);
}

// ── Helpers ────────────────────────────────────────────────────
const safeStr = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
const safeNum = (v, fb=0)  => { const n=Number(v); return isFinite(n)?n:fb; };
const fmt = (n) => n>=1000 ? (n/1000).toFixed(1).replace(".0","")+"K" : String(n);
const fmtEur = (n) => "€"+safeNum(n).toLocaleString("de-DE",{minimumFractionDigits:0});

// ── Mini Sparkline ─────────────────────────────────────────────
function Sparkline({ color="#1ECFCB" }) {
  const w=70, h=22;
  // Static decorative curve — feels alive
  const pts = [[0,14],[12,10],[24,16],[36,8],[48,13],[60,7],[70,11]];
  const d = "M"+pts.map(([x,y])=>`${x},${y}`).join(" L");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible"}}>
      <defs>
        <linearGradient id={"sg"+color.replace(/[^a-z0-9]/gi,"")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${"sg"+color.replace(/[^a-z0-9]/gi,"")})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, trend, color, delay=0 }) {
  const [press, setPress] = useState(false);
  const isPos = !trend || trend.startsWith("+");
  return (
    <div
      className="mcd-tap mcd-card-hover"
      onTouchStart={() => setPress(true)}
      onTouchEnd={() => setPress(false)}
      style={{
        flex:1, minWidth:0,
        background: T.cardBg,
        borderRadius: T.r,
        padding: "16px 14px 14px",
        border: `1px solid ${T.border}`,
        boxShadow: press ? T.shadowSm : T.shadow,
        animation: `mcd-rise .5s ${delay}s ease both`,
        display:"flex", flexDirection:"column", gap:6,
        transform: press ? "scale(0.97)" : "scale(1)",
        transition: "all .15s ease",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{
          width:32, height:32, borderRadius:10,
          background: color+"18",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:15,
        }}>{icon}</div>
        <Sparkline color={color}/>
      </div>
      <div>
        <div style={{ fontSize:11, color:T.soft, fontWeight:500, letterSpacing:0.2 }}>{label}</div>
        <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:-0.5, lineHeight:1.1, marginTop:2 }}>
          {value}
        </div>
        {trend && (
          <div style={{ fontSize:11, fontWeight:600, color: isPos ? "#22C55E" : "#EF4444", marginTop:2 }}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Action Card ────────────────────────────────────────────────
function ActionCard({ icon, title, sub, color, bgColor, onClick, delay=0 }) {
  const [press, setPress] = useState(false);
  return (
    <div
      className="mcd-tap mcd-card-hover"
      onClick={onClick}
      onTouchStart={() => setPress(true)}
      onTouchEnd={() => setPress(false)}
      style={{
        flex:1, minWidth:0,
        background: T.cardBg,
        borderRadius: T.r,
        padding:"18px 14px",
        border:`1px solid ${T.border}`,
        boxShadow: press ? T.shadowSm : T.shadow,
        animation:`mcd-rise .5s ${delay}s ease both`,
        display:"flex", flexDirection:"column", gap:10,
        transform: press?"scale(0.97)":"scale(1)",
        transition:"all .15s ease",
      }}
    >
      <div style={{
        width:44, height:44, borderRadius:14,
        background: bgColor || color+"14",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:22,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.ink, letterSpacing:-0.2 }}>{title}</div>
        <div style={{ fontSize:12, color:T.soft, marginTop:2, lineHeight:1.3 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Menu Row ───────────────────────────────────────────────────
function MenuRow({ icon, label, onClick, danger }) {
  const [press, setPress] = useState(false);
  return (
    <div
      className="mcd-tap"
      onClick={onClick}
      onTouchStart={() => setPress(true)}
      onTouchEnd={() => setPress(false)}
      style={{
        display:"flex", alignItems:"center", gap:14,
        padding:"15px 18px",
        background: press ? "rgba(26,31,46,0.025)" : "transparent",
        borderBottom:`1px solid ${T.borderSoft}`,
        transition:"background .1s",
      }}
    >
      <div style={{
        width:34, height:34, borderRadius:10,
        background: danger ? T.coralLight : T.tealLight,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:16, flexShrink:0,
      }}>{icon}</div>
      <span style={{
        flex:1, fontSize:15, fontWeight:500,
        color: danger ? T.coral : T.ink,
      }}>{label}</span>
      <span style={{ fontSize:18, color:T.muted, lineHeight:1 }}>›</span>
    </div>
  );
}

// ── Hero Section ───────────────────────────────────────────────
function HeroSection({ profile, onViewProfile, onCreate }) {
  const name   = safeStr(profile?.display_name || profile?.full_name || profile?.email?.split("@")[0], "Creator");
  const uname  = safeStr(profile?.username, "");
  const avatar = profile?.avatar_url || null;
  const tagline= safeStr(profile?.bio || profile?.tagline, "Inspire. Connect. Create.");
  const sub    = "Creating moments that matter.";
  const talent = safeStr(profile?.talent, "");
  const verified = profile?.verified || profile?.is_verified || false;

  return (
    <div style={{
      background: T.heroBg,
      padding:"20px 20px 24px",
      position:"relative", overflow:"hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{
        position:"absolute", top:-60, right:-40,
        width:200, height:200, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(30,207,203,0.09) 0%,transparent 70%)",
        pointerEvents:"none",
        animation:"mcd-float 10s ease-in-out infinite",
      }}/>
      <div style={{
        position:"absolute", bottom:-40, left:-30,
        width:160, height:160, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(255,122,89,0.07) 0%,transparent 70%)",
        pointerEvents:"none",
        animation:"mcd-float 13s 2s ease-in-out infinite",
      }}/>

      {/* Top bar */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:22, position:"relative",
      }}>
        {/* HUI Logo */}
        <div style={{
          fontSize:22, fontWeight:900, letterSpacing:-1,
          background:"linear-gradient(135deg,#1ECFCB 0%,#FF7A59 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>HUI</div>

        {/* Icons right */}
        <div style={{
          position:"absolute", right:0,
          display:"flex", gap:10,
        }}>
          {["🔔","💬"].map((ic,i) => (
            <div key={i} className="mcd-tap" style={{
              width:36, height:36, borderRadius:12,
              background:T.cardBg,
              border:`1px solid ${T.border}`,
              boxShadow:T.shadowSm,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16,
            }}>{ic}</div>
          ))}
        </div>
      </div>

      {/* Profile row */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
        {/* Avatar with glow ring */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{
            width:74, height:74, borderRadius:"50%",
            padding:3,
            background:"linear-gradient(135deg,#1ECFCB 0%,#FF7A59 100%)",
            boxShadow:T.shadowTeal,
            animation:"orb-pulse 3s ease-in-out infinite",
          }}>
            <div style={{
              width:"100%", height:"100%", borderRadius:"50%",
              background:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center",
              overflow:"hidden",
            }}>
              {avatar
                ? <img src={avatar} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span style={{fontSize:26,color:T.teal,fontWeight:700}}>{name[0]?.toUpperCase()}</span>
              }
            </div>
          </div>
        </div>

        {/* Identity */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>
            {talent || "Creator"}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{
              fontSize:22, fontWeight:800, color:T.ink,
              letterSpacing:-0.6, lineHeight:1.1,
            }}>{name}</span>
            {verified && (
              <div style={{
                width:20, height:20, borderRadius:"50%",
                background:"linear-gradient(135deg,#1ECFCB,#0DC4B5)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, color:"#fff", fontWeight:700, flexShrink:0,
              }}>✓</div>
            )}
          </div>
          {uname && (
            <div style={{ fontSize:13, color:T.soft, marginTop:2 }}>@{uname}</div>
          )}
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.ink2, lineHeight:1.3 }}>{tagline}</div>
            <div style={{ fontSize:12, color:T.soft, marginTop:2 }}>{sub}</div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display:"flex", gap:10, marginTop:18 }}>
        <button className="mcd-tap" onClick={onViewProfile} style={{
          flex:1,
          background:T.cardBg,
          border:`1.5px solid ${T.border}`,
          borderRadius:T.rFull,
          padding:"10px 16px",
          fontSize:13, fontWeight:600, color:T.ink2,
          boxShadow:T.shadowSm,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          cursor:"pointer",
        }}>
          <span>👁</span> Profil ansehen
        </button>
        <button className="mcd-tap" onClick={onCreate} style={{
          flex:1,
          background:"linear-gradient(135deg,#1ECFCB 0%,#FF7A59 100%)",
          border:"none",
          borderRadius:T.rFull,
          padding:"10px 16px",
          fontSize:13, fontWeight:700, color:"#fff",
          boxShadow:T.shadowTeal,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          cursor:"pointer",
          letterSpacing:0.1,
        }}>
          <span style={{fontSize:15,fontWeight:400}}>+</span> Erstellen
        </button>
      </div>
    </div>
  );
}

// ── Membership Card ────────────────────────────────────────────
function MembershipCard({ type, active, since, onManage }) {
  const isTalent = type === "talent";
  const BENEFITS = [
    "Volles Creator Profil",
    "Mehr Sichtbarkeit",
    "Höhere Buchungsrate",
    "Statistik & Insights",
  ];

  return (
    <div style={{
      background:T.cardBg,
      border:`1px solid rgba(30,207,203,0.15)`,
      borderRadius:T.r,
      padding:"18px 18px 18px 16px",
      boxShadow:T.shadow,
      display:"flex", alignItems:"center", gap:16,
      animation:"mcd-rise .5s .3s ease both",
    }}>
      {/* Diamond Icon */}
      <div style={{
        width:52, height:52, borderRadius:16, flexShrink:0,
        background:"linear-gradient(135deg,rgba(30,207,203,0.12),rgba(255,122,89,0.08))",
        border:`1px solid rgba(30,207,203,0.2)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:24,
      }}>💎</div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:-0.2 }}>
          HUI Mitglied
        </div>
        {since && (
          <div style={{ fontSize:12, color:T.soft, marginBottom:8 }}>
            Aktiv seit {since}
          </div>
        )}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px" }}>
          {BENEFITS.map(b => (
            <div key={b} style={{
              display:"flex", alignItems:"center", gap:4,
              fontSize:11, color:T.tealDeep, fontWeight:500,
            }}>
              <span style={{color:"#22C55E",fontSize:10}}>✓</span> {b}
            </div>
          ))}
        </div>
      </div>

      {/* Button */}
      <button className="mcd-tap" onClick={onManage} style={{
        flexShrink:0,
        background:T.coralLight,
        border:`1.5px solid ${T.coral}`,
        borderRadius:T.r2,
        padding:"10px 14px",
        color:T.coral, fontSize:12, fontWeight:700,
        cursor:"pointer", whiteSpace:"nowrap",
        display:"flex", alignItems:"center", gap:5,
      }}>
        <span>👑</span> Verwalten
      </button>
    </div>
  );
}

// ── Section Label ──────────────────────────────────────────────
function SLabel({ text }) {
  return (
    <div style={{
      fontSize:15, fontWeight:700, color:T.ink,
      letterSpacing:-0.2, marginBottom:12,
    }}>{text}</div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function MyCreatorDashboard({ onClose }) {
  const { profile: rawAuth, user } = useAuth();
  const actions = useHuiActions();

  const [dbProfile, setDbProfile] = useState(null);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  const authId = rawAuth?.id || user?.id || null;

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    if (!authId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const [profRes, bookRes, fcRes] = await Promise.all([
          supabase.from("profiles")
            .select("id,display_name,full_name,username,bio,avatar_url,header_img,talent,focus_type,location,location_label,impact_eur,experiences_count,connections_count,bookings_count,dna_tags,interests,profile_complete,membership_type,membership_active,membership_since,is_verified,verified,tagline")
            .eq("id", authId).single(),
          supabase.from("bookings")
            .select("id,status,total_eur")
            .eq("wirker_id", authId).limit(200),
          supabase.rpc("get_follow_counts", { target_id: authId }),
        ]);
        if (cancelled) return;
        if (profRes.data) setDbProfile(profRes.data);
        const bkgs = bookRes.data || [];
        const earned = bkgs.filter(b=>b.status==="completed").reduce((s,b)=>s+safeNum(b.total_eur),0);
        setStats({
          bookings:  bkgs.filter(b=>b.status==="upcoming"||b.status==="confirmed").length,
          earned,
          followers: fcRes.data?.[0]?.followers ?? 0,
          impact:    profRes.data?.impact_eur||0,
        });
      } catch(e) { console.warn("[MCD]",e?.message); }
      finally { if(!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [authId]);

  const profile = useMemo(() => ({
    ...(rawAuth||{}), ...(dbProfile||{}),
    id:authId, user_id:authId,
  }), [rawAuth, dbProfile, authId]);

  const sa = safeNum;

  const STATS = loading ? null : [
    { icon:"📅", label:"Buchungen", value:String(stats?.bookings??0),   trend:"+12%", color:T.teal,           delay:0    },
    { icon:"💰", label:"Einnahmen", value:fmtEur(stats?.earned),        trend:"+8%",  color:"#6366F1",        delay:.05  },
    { icon:"👥", label:"Follower",  value:fmt(stats?.followers??0),     trend:"+15%", color:T.coral,          delay:.1   },
    { icon:"⚡", label:"Wirkung",   value:String(sa(stats?.impact,0)),  trend:"+10%", color:"#F59E0B",        delay:.15  },
  ];

  const ACTIONS = [
    { icon:"🔭", title:"Erlebnis",  sub:"Neues Erlebnis erstellen",    color:T.teal,   bgColor:T.tealLight,   act:A.CREATE_EXPERIENCE,   delay:0    },
    { icon:"⭐", title:"Moment",    sub:"Einen Moment teilen",          color:"#6366F1",bgColor:"#EEF2FF",     act:A.OPEN_STORY_COMPOSER, delay:.05  },
    { icon:"⚡", title:"Wirkung",   sub:"Deine Wirkung steigern",       color:T.coral,  bgColor:T.coralLight,  act:A.OPEN_IMPACT,         delay:.1   },
    { icon:"📅", title:"Kalender",  sub:"Deinen Plan organisieren",     color:"#F59E0B",bgColor:"#FFFBEB",     act:A.OPEN_CALENDAR,       delay:.15  },
  ];

  const MENU = [
    { icon:"✏️", label:"Profil bearbeiten",     danger:false, cb:()=>actions[A.OPEN_PROFILE_EDITOR]?.() },
    { icon:"💰", label:"Einnahmen & Zahlungen", danger:false, cb:()=>actions[A.OPEN_EARNINGS]?.() },
    { icon:"🔒", label:"Privatsphäre",          danger:false, cb:()=>actions[A.OPEN_PRIVACY]?.() },
    { icon:"↪️", label:"Abmelden",              danger:true,  cb:()=>actions[A.SIGN_OUT]?.() },
  ];

  const memberSince = useMemo(() => {
    const d = profile?.membership_since;
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("de-DE",{day:"numeric",month:"long",year:"numeric"});
    } catch { return null; }
  }, [profile?.membership_since]);

  if (!authId && !loading) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:9500,background:T.pageBg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,sans-serif"}}>
        <p style={{color:T.soft,fontSize:15}}>Nicht angemeldet</p>
      </div>
    );
  }

  return (
    <div className="mcd-scroll" style={{
      position:"fixed", inset:0, zIndex:9500,
      background:T.pageBg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      paddingBottom:"max(100px, calc(88px + env(safe-area-inset-bottom,0px)))",
      WebkitFontSmoothing:"antialiased",
    }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <HeroSection
        profile={profile}
        onViewProfile={() => actions[A.VIEW_OWN_PUBLIC_PROFILE]?.()}
        onCreate={() => actions[A.CREATE_EXPERIENCE]?.()}
      />

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:22 }}>

        {/* Stats */}
        <div style={{ display:"flex", gap:10 }}>
          {loading
            ? [0,1,2,3].map(i=>(
                <div key={i} style={{
                  flex:1, height:96, borderRadius:T.r,
                  background:"linear-gradient(90deg,#F0F2F8 25%,#E8EBF5 50%,#F0F2F8 75%)",
                  backgroundSize:"400% 100%",
                  animation:"mcd-rise .3s ease both",
                  border:`1px solid ${T.border}`,
                }}/>
              ))
            : STATS.map(s=><StatCard key={s.label} {...s}/>)
          }
        </div>

        {/* Action Cards */}
        <div>
          <SLabel text="Was möchtest du heute schaffen?"/>
          <div style={{ display:"flex", gap:10 }}>
            {ACTIONS.map(a=>(
              <ActionCard
                key={a.title}
                icon={a.icon} title={a.title} sub={a.sub}
                color={a.color} bgColor={a.bgColor}
                onClick={()=>actions[a.act]?.()}
                delay={a.delay}
              />
            ))}
          </div>
        </div>

        {/* Membership */}
        <MembershipCard
          type={profile?.membership_type}
          active={profile?.membership_active}
          since={memberSince}
          onManage={()=>actions[A.OPEN_MEMBERSHIP]?.()}
        />

        {/* Profile Completion */}
        {!profile?.profile_complete && (
          <div className="mcd-tap mcd-card-hover" onClick={()=>actions[A.OPEN_PROFILE_EDITOR]?.()} style={{
            background:"linear-gradient(120deg,#FFF8F5 0%,#FFF2EE 100%)",
            border:`1.5px solid rgba(255,122,89,0.2)`,
            borderRadius:T.r,
            padding:"16px 18px",
            display:"flex", alignItems:"center", gap:14,
            animation:"mcd-rise .5s .35s ease both",
          }}>
            <div style={{fontSize:24,flexShrink:0}}>✦</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.coral,marginBottom:3}}>Profil vervollständigen</div>
              <div style={{fontSize:12,color:T.soft,lineHeight:1.4}}>Vollständige Profile erhalten deutlich mehr Buchungen und Sichtbarkeit.</div>
            </div>
            <span style={{fontSize:18,color:T.muted}}>›</span>
          </div>
        )}

        {/* Account */}
        <div>
          <SLabel text="Account"/>
          <div style={{
            background:T.cardBg,
            border:`1px solid ${T.border}`,
            borderRadius:T.r,
            overflow:"hidden",
            boxShadow:T.shadowSm,
            animation:"mcd-rise .5s .4s ease both",
          }}>
            {MENU.map(({icon,label,danger,cb},i) => (
              <MenuRow key={label} icon={icon} label={label} danger={danger} onClick={cb}/>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


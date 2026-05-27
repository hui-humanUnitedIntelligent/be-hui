// src/pages/MyCreatorDashboard.jsx — HUI Creator Dashboard v1
// Eigenstaendige Seite — kein profileId, kein _isOwnerView
// Laedt alles selbst aus useAuth
// Einziger Einstieg: Tabbar "Profil"-Button

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth }          from "../lib/AuthContext.jsx";
import { supabase }         from "../lib/supabaseClient.js";
import { useHuiActions, A } from "../core/hui.actions.js";
import { HUI }              from "../design/hui.design.js";

const C = HUI.COLOR;

const safeStr = (v, fb) => (v && typeof v === "string" ? v.trim() : (fb || ""));
const safeNum = (v, fb) => { const n = Number(v); return isFinite(n) ? n : (fb || 0); };

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style");
  s.textContent = [
    "@keyframes mcd-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
    "@keyframes mcd-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}",
    "@keyframes mcd-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}",
    ".mcd-tap{-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none}",
    ".mcd-scroll{-webkit-overflow-scrolling:touch;overflow-y:auto;overflow-x:hidden}",
    ".mcd-scroll::-webkit-scrollbar{display:none}",
  ].join("");
  document.head.appendChild(s);
}

function QuickBtn({ icon, label, color, onClick }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div className="mcd-tap" onClick={onClick}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{
        display:"flex",flexDirection:"column",alignItems:"center",gap:8,
        padding:"14px 8px",borderRadius:20,flex:1,minWidth:0,cursor:"pointer",
        background:pressed?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.03)",
        border:"1px solid rgba(255,255,255,0.08)",
        transform:pressed?"scale(0.95)":"scale(1)",transition:"all .15s ease",
      }}>
      <div style={{
        width:44,height:44,borderRadius:14,
        background:color+"22",border:"1px solid "+color+"44",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
      }}>{icon}</div>
      <span style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.7)",textAlign:"center"}}>{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color, delay }) {
  return (
    <div style={{
      flex:1,minWidth:0,background:"rgba(255,255,255,0.04)",
      border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"16px 12px",
      animation:"mcd-rise .5s "+(delay||0)+"s ease both",
    }}>
      <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
      <div style={{fontSize:20,fontWeight:800,color:color||C.teal,letterSpacing:-0.5,lineHeight:1}}>{value}</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:4}}>{label}</div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div style={{
      flex:1,height:88,borderRadius:20,
      background:"rgba(255,255,255,0.04)",
      backgroundImage:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",
      backgroundSize:"400% 100%",
      animation:"mcd-shimmer 1.5s infinite linear",
    }}/>
  );
}

function DashHero({ profile, onEditProfile }) {
  const name   = safeStr(profile.display_name || profile.full_name || profile.email, "Creator").split("@")[0];
  const avatar = profile.avatar_url || null;
  const heroImg= profile.header_img || null;
  const bio    = safeStr(profile.bio, "");
  const talent = safeStr(profile.talent || profile.focus_type, "");
  const loc    = safeStr(profile.location_label || profile.location, "");

  return (
    <div style={{position:"relative",width:"100%",minHeight:250,overflow:"hidden",background:"#081818"}}>
      {heroImg && (
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:"url("+heroImg+")",
          backgroundSize:"cover",backgroundPosition:"center 30%",opacity:.25,
        }}/>
      )}
      <div style={{
        position:"absolute",inset:0,
        background:"linear-gradient(180deg,rgba(8,18,18,.88) 0%,rgba(8,18,18,.97) 100%)",
      }}/>
      <div style={{
        position:"absolute",top:"-20%",right:"10%",width:180,height:180,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(13,196,181,.15) 0%,transparent 70%)",
        pointerEvents:"none",animation:"mcd-float 8s ease-in-out infinite",
      }}/>
      <div style={{position:"absolute",bottom:"-10%",left:"5%",width:140,height:140,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(255,138,107,.10) 0%,transparent 70%)",
        pointerEvents:"none",animation:"mcd-float 11s 2s ease-in-out infinite",
      }}/>

      <div style={{
        position:"absolute",top:0,left:0,right:0,zIndex:10,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"max(16px, env(safe-area-inset-top, 16px)) 18px 12px",
      }}>
        <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:1}}>MEIN PROFIL</span>
        <button className="mcd-tap" onClick={onEditProfile} style={{
          background:"rgba(13,196,181,0.15)",border:"1px solid rgba(13,196,181,0.3)",
          borderRadius:20,padding:"6px 14px",color:C.teal,fontSize:13,fontWeight:600,cursor:"pointer",
        }}>Bearbeiten</button>
      </div>

      <div style={{position:"relative",zIndex:5,padding:"72px 20px 26px",display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:14}}>
          <div style={{
            width:72,height:72,borderRadius:"50%",
            border:"3px solid rgba(13,196,181,0.5)",
            background:"rgba(13,196,181,0.1)",overflow:"hidden",flexShrink:0,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            {avatar
              ? <img src={avatar} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : <span style={{fontSize:26,color:"rgba(255,255,255,0.35)"}}>{name[0]?.toUpperCase()}</span>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:21,fontWeight:800,color:"rgba(255,255,255,0.94)",letterSpacing:-0.4,lineHeight:1.1}}>{name}</div>
            {talent && (
              <div style={{
                display:"inline-block",marginTop:5,
                background:"rgba(13,196,181,0.12)",border:"1px solid rgba(13,196,181,0.22)",
                borderRadius:99,padding:"3px 10px",fontSize:12,fontWeight:600,color:C.teal,
              }}>{talent}</div>
            )}
            {loc && <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3}}>{"📍 "+loc}</div>}
          </div>
        </div>
        {bio && (
          <p style={{margin:0,fontSize:14,lineHeight:1.5,color:"rgba(255,255,255,0.55)",maxWidth:480}}>{bio}</p>
        )}
      </div>
    </div>
  );
}

export default function MyCreatorDashboard({ onClose }) {
  const { profile: rawAuth, user } = useAuth();
  const actions = useHuiActions();
  const [dbProfile, setDbProfile] = React.useState(null);
  const [stats,     setStats]     = React.useState(null);
  const [loading,   setLoading]   = React.useState(true);

  const authId = rawAuth?.id || user?.id || null;

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    if (!authId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const [profRes, bookRes] = await Promise.all([
          supabase.from("profiles")
            .select("id,display_name,full_name,username,bio,avatar_url,header_img,talent,focus_type,location,location_label,impact_eur,experiences_count,followers_count,connections_count,bookings_count,dna_tags,interests,profile_complete,membership_type,membership_active")
            .eq("id", authId).single(),
          supabase.from("bookings")
            .select("id,status,total_eur")
            .eq("wirker_id", authId).limit(100),
        ]);
        if (cancelled) return;
        if (profRes.data) setDbProfile(profRes.data);
        const bkgs = bookRes.data || [];
        const earned = bkgs.filter(b=>b.status==="completed").reduce((s,b)=>s+safeNum(b.total_eur),0);
        setStats({
          bookings: bkgs.filter(b=>b.status==="upcoming"||b.status==="confirmed").length,
          earned, followers: profRes.data?.followers_count||0, impact: profRes.data?.impact_eur||0,
        });
      } catch(e) { console.warn("[MyCreatorDashboard]",e?.message); }
      finally { if(!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [authId]);

  const profile = useMemo(() => ({...(rawAuth||{}), ...(dbProfile||{}), id:authId, user_id:authId}), [rawAuth, dbProfile, authId]);

  const handleEdit = useCallback(() => { actions[A.OPEN_PROFILE_EDITOR]?.(); }, [actions]);

  const QUICK = [
    {icon:"✦",label:"Erlebnis", color:C.teal,  act:A.CREATE_EXPERIENCE},
    {icon:"📸",label:"Moment",   color:"#A78BFA",act:A.OPEN_STORY_COMPOSER},
    {icon:"💫",label:"Wirkung",  color:C.coral, act:A.OPEN_IMPACT},
    {icon:"📅",label:"Kalender", color:"#60A5FA",act:A.OPEN_CALENDAR},
  ];

  const MENU = [
    {label:"Profil bearbeiten",      icon:"✏️",  cb: handleEdit},
    {label:"Einnahmen & Zahlungen",  icon:"💰",  cb: ()=>actions[A.OPEN_EARNINGS]?.()},
    {label:"Privatsphäre",           icon:"🔒",  cb: ()=>actions[A.OPEN_PRIVACY]?.()},
    {label:"Abmelden",               icon:"↪️",  cb: ()=>actions[A.SIGN_OUT]?.()},
  ];

  if (!authId && !loading) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:9500,background:"#0A1818",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,sans-serif"}}>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:15}}>Nicht angemeldet</p>
      </div>
    );
  }

  return (
    <div className="mcd-scroll" style={{
      position:"fixed",inset:0,zIndex:9500,
      background:"#0A1818",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      paddingBottom:"max(100px, calc(88px + env(safe-area-inset-bottom,0px)))",
    }}>
      <style>{HUI.KEYFRAMES}</style>

      <DashHero profile={profile} onEditProfile={handleEdit} />

      <div style={{padding:"22px 16px",display:"flex",flexDirection:"column",gap:24}}>

        {/* Stats */}
        <div style={{display:"flex",gap:10}}>
          {loading
            ? [0,1,2,3].map(i=><SkeletonStat key={i}/>)
            : <>
                <StatCard icon="📅" label="Buchungen" value={stats?.bookings??0}           color={C.teal}    delay={0}   />
                <StatCard icon="💰" label="Einnahmen" value={"€"+(safeNum(stats?.earned)).toFixed(0)} color="#60A5FA" delay={0.05}/>
                <StatCard icon="👥" label="Folger"    value={stats?.followers??0}           color="#A78BFA"   delay={0.1} />
                <StatCard icon="✦"  label="Wirkung"   value={"€"+(safeNum(stats?.impact)).toFixed(0)}  color={C.coral}   delay={0.15}/>
              </>
          }
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{marginBottom:14}}>
            <h2 style={{margin:0,fontSize:17,fontWeight:800,color:"rgba(255,255,255,0.9)",letterSpacing:-0.3}}>Aktionen</h2>
            <p style={{margin:"3px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)"}}>Was möchtest du heute schaffen?</p>
          </div>
          <div style={{display:"flex",gap:10}}>
            {QUICK.map(q=><QuickBtn key={q.label} icon={q.icon} label={q.label} color={q.color} onClick={()=>actions[q.act]?.()}/>)}
          </div>
        </div>

        {/* Membership */}
        {profile?.membership_type && (
          <div style={{
            background:"rgba(13,196,181,0.06)",border:"1px solid rgba(13,196,181,0.15)",
            borderRadius:20,padding:"16px 18px",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            animation:"mcd-rise .5s .2s ease both",
          }}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.teal,textTransform:"uppercase",letterSpacing:0.8}}>
                {profile.membership_type==="talent"?"✦ Talent Mitglied":"HUI Mitglied"}
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3}}>
                {profile.membership_active?"Aktiv":"Inaktiv"}
              </div>
            </div>
            <button className="mcd-tap" onClick={()=>actions[A.OPEN_MEMBERSHIP]?.()} style={{
              background:"rgba(13,196,181,0.15)",border:"1px solid rgba(13,196,181,0.25)",
              borderRadius:99,padding:"7px 14px",color:C.teal,fontSize:12,fontWeight:600,cursor:"pointer",
            }}>Details</button>
          </div>
        )}

        {/* Profile Completion Banner */}
        {!profile?.profile_complete && (
          <div className="mcd-tap" onClick={handleEdit} style={{
            background:"rgba(255,138,107,0.08)",border:"1px solid rgba(255,138,107,0.2)",
            borderRadius:20,padding:"16px 18px",cursor:"pointer",
            animation:"mcd-rise .5s .25s ease both",
          }}>
            <div style={{fontSize:14,fontWeight:700,color:C.coral,marginBottom:4}}>✦ Profil vervollständigen</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.4}}>
              Ein vollständiges Profil erhöht deine Sichtbarkeit und Buchungsrate.
            </div>
          </div>
        )}

        {/* Account Menu */}
        <div>
          <h2 style={{margin:"0 0 12px",fontSize:17,fontWeight:800,color:"rgba(255,255,255,0.9)",letterSpacing:-0.3}}>Account</h2>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {MENU.map(({label,icon,cb})=>(
              <div key={label} className="mcd-tap" onClick={cb} style={{
                display:"flex",alignItems:"center",gap:14,
                padding:"14px 16px",borderRadius:16,
                background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.06)",
                cursor:"pointer",
              }}>
                <span style={{fontSize:18}}>{icon}</span>
                <span style={{fontSize:15,color:"rgba(255,255,255,0.8)",flex:1}}>{label}</span>
                <span style={{fontSize:14,color:"rgba(255,255,255,0.2)"}}>›</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

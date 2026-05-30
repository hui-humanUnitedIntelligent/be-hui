// src/pages/MyTalentProfile.jsx — HUI Creator Talent Profile v2
// "Meine kreative Welt" — UNIFIED: same page for owner + visitor.
// Owner: edit buttons visible per section.
// Visitor: read-only view of identical layout.
// Reference: screenshot 2026-05-29, verbindlich 1:1.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:       "#F8F7F4",
  bgCard:   "#FFFFFF",
  bgSheet:  "rgba(252,251,248,0.98)",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  tealDark: "#0DBBAF",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.55)",
  inkFaint: "rgba(26,26,24,0.30)",
  border:   "rgba(26,26,24,0.09)",
  borderMid:"rgba(26,26,24,0.14)",
  px: 16,
  r8:8, r12:12, r16:16, r20:20, r24:24, r99:99,
  card:     "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  cardMd:   "0 2px 12px rgba(26,26,24,0.09), 0 1px 3px rgba(26,26,24,0.05)",
  glow:     "0 4px 18px rgba(14,196,184,0.28)",
  sheet:    "0 -10px 40px rgba(26,26,24,0.12)",
};

const CSS = `
  .ctp-root {
    background:${T.bg};
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;
    color:${T.ink}; width:100%; overflow-x:hidden;
  }
  .ctp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .ctp-scroll::-webkit-scrollbar { display:none; }
  .ctp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .ctp-hscroll::-webkit-scrollbar { display:none; }
  @keyframes ctp-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ctp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes ctp-shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
  .ctp-sk {
    background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.10) 50%,rgba(26,26,24,.05) 75%);
    background-size:200% 100%; animation:ctp-shimmer 1.4s ease-in-out infinite; border-radius:8px;
  }
  .ctp-press { transition:transform .13s cubic-bezier(.22,1,.36,1),opacity .13s ease; cursor:pointer; }
  .ctp-press:active { transform:scale(0.93); opacity:0.72; }
  .ctp-in { animation:ctp-fade .42s ease both; }
  .ctp-sheet { animation:ctp-slide-up .26s cubic-bezier(.22,1,.36,1) both; }
  .ctp-section {
    background:${T.bgCard}; border-radius:${T.r16}px;
    border:1px solid ${T.border};
    margin:0 ${T.px}px;
    box-shadow:${T.card};
    overflow:hidden;
  }
  .ctp-section-pad { padding:18px 18px 20px; }
  .ctp-edit-btn {
    display:inline-flex; align-items:center; gap:5px;
    background:none; border:none; padding:0;
    font-size:12px; color:${T.teal}; font-weight:600;
    cursor:pointer; touch-action:manipulation;
    font-family:inherit; flex-shrink:0;
  }
  .ctp-edit-btn:active { opacity:0.6; }
  .ctp-add-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; padding:12px;
    border:1.5px dashed ${T.borderMid}; border-radius:${T.r12}px;
    background:transparent; font-size:13px; font-weight:600; color:${T.inkFaint};
    cursor:pointer; touch-action:manipulation; font-family:inherit;
    transition:all .18s ease;
  }
  .ctp-add-btn:active { background:rgba(26,26,24,0.03); }
`;

// ── Helpers ──────────────────────────────────────────────────────
const s  = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
const a  = (v) => Array.isArray(v) ? v : [];
const dl = (i, ms=50) => ({ animationDelay:`${i*ms}ms` });

const FB_COVER = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80";
const FB_AVT   = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

const DEFAULT_TAGS  = ["Kunst","Natur","Farbe","Emotion"];
const DEFAULT_BIO   = "Ich male, um das Unsichtbare sichtbar zu machen.\nInspiration finde ich in der Natur, im Licht\nund in echten Begegnungen.";
const DEFAULT_ROLE  = "Malerin & Illustratorin aus Hamburg";

const DEFAULT_TALENTS = [
  { icon:"🎨", label:"Malen",        sub:"Öl, Acryl, Aquarell"     },
  { icon:"🖌",  label:"Illustration",  sub:"Digital & Handzeichnung" },
  { icon:"👥", label:"Workshops",     sub:"Kreativ Workshops"        },
  { icon:"⭐", label:"Kunstberatung", sub:"Räume & Konzepte"         },
  { icon:"👜", label:"Auftragskunst", sub:"Individuelle Werke"       },
];

const SEED_WORKS = [
  { id:"w1", img:"https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=75" },
  { id:"w2", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75" },
  { id:"w3", img:"https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=400&q=75" },
  { id:"w4", img:"https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=75" },
];

const SEED_EXP = [
  { id:"e1", title:"Malkurs: Intuitives Malen",  type:"Workshop",    date:"Mai 2024",   img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=70" },
  { id:"e2", title:"Gemeinschaftsausstellung",    type:"Ausstellung", date:"März 2024",  img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&q=70" },
  { id:"e3", title:"Live Painting Event",         type:"Event",       date:"Feb. 2024",  img:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=70" },
  { id:"e4", title:"Kunst für den guten Zweck",   type:"Projekt",     date:"Jan. 2024",  img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=70" },
];

// ── Atoms ─────────────────────────────────────────────────────────
function Gap({ h=16 }) { return <div style={{ height:h }}/>; }
function Sk({ w, h, r=8, style={} }) {
  return <div className="ctp-sk" style={{ width:w, height:h, borderRadius:r, flexShrink:0, ...style }}/>;
}
function SectionHeader({ title, isOwner, onEdit }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>{title}</div>
      {isOwner && (
        <button className="ctp-edit-btn" onClick={onEdit}>
          <span style={{ fontSize:13 }}>✏</span> Bearbeiten
        </button>
      )}
    </div>
  );
}
function BottomSheet({ onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:9900,
      background:"rgba(26,26,24,0.42)", display:"flex", alignItems:"flex-end",
    }}>
      <div className="ctp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheet, maxHeight:"82vh", overflowY:"auto",
      }}>
        <div style={{ width:36, height:4, borderRadius:99, background:T.borderMid, margin:"0 auto 22px" }}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 1. HERO COVER + AVATAR IDENTITY BLOCK
// ══════════════════════════════════════════════════════════════════
function HeroBlock({ profile, loading, isOwner }) {
  const [coverOk, setCoverOk] = useState(false);
  const [avOk,    setAvOk]    = useState(false);
  const cover  = s(profile?.header_img, FB_COVER);
  const avatar = s(profile?.avatar_url, FB_AVT);
  const name   = s(profile?.display_name || profile?.username, "Lea Martin");
  const role   = s(profile?.talent_role || profile?.role_label, DEFAULT_ROLE);
  const tags   = a(profile?.value_tags).length ? a(profile.value_tags) : DEFAULT_TAGS;

  return (
    <div style={{ background:T.bgCard, borderRadius:T.r16, margin:`0 ${T.px}px`, overflow:"hidden", boxShadow:T.cardMd, border:`1px solid ${T.border}` }}>
      {/* Cover image */}
      <div style={{ width:"100%", height:160, position:"relative", background:"linear-gradient(135deg,#3B2010 0%,#8B4513 40%,#C8722A 100%)", overflow:"hidden" }}>
        {loading
          ? <div className="ctp-sk" style={{ position:"absolute", inset:0, borderRadius:0 }}/>
          : <img src={cover} alt="" onLoad={()=>setCoverOk(true)} onError={()=>setCoverOk(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
                opacity:coverOk?0.88:0, transition:"opacity 1s ease" }}/>
        }
      </div>

      {/* Identity row: avatar left + info right */}
      <div style={{ padding:"0 16px 16px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginTop:-36 }}>
          {/* Avatar with camera button */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{
              width:80, height:80, borderRadius:"50%",
              border:"3.5px solid white",
              boxShadow:"0 3px 16px rgba(0,0,0,0.18)",
              overflow:"hidden", background:T.bg,
            }}>
              {loading
                ? <div className="ctp-sk" style={{ width:"100%", height:"100%", borderRadius:"50%" }}/>
                : <>
                    {!avOk && <div className="ctp-sk" style={{ position:"absolute", inset:0, borderRadius:"50%" }}/>}
                    <img src={avatar} alt="" onLoad={()=>setAvOk(true)} onError={()=>setAvOk(true)}
                      style={{ width:"100%", height:"100%", objectFit:"cover",
                        opacity:avOk?1:0, transition:"opacity .5s ease" }}/>
                  </>
              }
            </div>
            {isOwner && (
              <button className="ctp-press" style={{
                position:"absolute", bottom:1, right:1,
                width:24, height:24, borderRadius:"50%",
                background:T.bgCard, border:`1.5px solid ${T.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, touchAction:"manipulation",
                boxShadow:"0 1px 4px rgba(0,0,0,0.12)",
              }}>📷</button>
            )}
          </div>

          {/* Name + role + tags */}
          <div style={{ flex:1, paddingBottom:2 }}>
            {loading
              ? <Sk w={140} h={22} r={6} style={{ marginBottom:6 }}/>
              : <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:"-0.03em",
                  display:"flex", alignItems:"center", gap:7, lineHeight:1.2, marginBottom:2 }}>
                  {name} <span style={{ fontSize:16 }}>🌿</span>
                </div>
            }
            {loading
              ? <Sk w={180} h={14} r={5} style={{ marginBottom:10 }}/>
              : <div style={{ fontSize:12.5, color:T.inkSoft, marginBottom:10, fontWeight:400 }}>{role}</div>
            }
            {/* Value tags */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {loading
                ? [0,1,2,3].map(i=><Sk key={i} w={52} h={26} r={T.r99}/>)
                : tags.map((tag, i) => (
                    <div key={i} style={{
                      padding:"5px 12px", borderRadius:T.r99,
                      background:T.bg, border:`1px solid ${T.border}`,
                      fontSize:12, fontWeight:600, color:T.ink,
                      boxShadow:T.card,
                    }}>{tag}</div>
                  ))
              }
            </div>
          </div>
        </div>

        {/* Action buttons: Profil teilen + Profilvorschau */}
        <Gap h={14}/>
        <div style={{ display:"flex", gap:8 }}>
          <button className="ctp-press" style={{
            flex:1, padding:"10px 0", borderRadius:T.r12,
            background:T.bgCard, border:`1.5px solid ${T.border}`,
            fontSize:13, fontWeight:700, color:T.ink,
            touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.card,
          }}>Profil teilen</button>
          <button className="ctp-press" style={{
            flex:1, padding:"10px 0", borderRadius:T.r12,
            background:`linear-gradient(135deg,${T.teal},${T.tealDark})`,
            border:"none",
            fontSize:13, fontWeight:700, color:"white",
            touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glow,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
            <span style={{ fontSize:14 }}>👁</span> Profilvorschau
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 2. ÜBER MICH — editorial text card with nature thumbnail right
// ══════════════════════════════════════════════════════════════════
function UeberMich({ profile, loading, isOwner }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState("");
  const [imgOk,   setImgOk]   = useState(false);
  const bio = s(profile?.bio, DEFAULT_BIO);
  const MAX = 280;

  const handleSave = async () => {
    setEditing(false);
    if (!profile?.id) return;
    try { await supabase.from("profiles").update({ bio: draft.trim() }).eq("id", profile.id); }
    catch(e) { console.warn("bio save:", e); }
  };

  return (
    <div className="ctp-section">
      <div className="ctp-section-pad">
        <SectionHeader title="Über mich" isOwner={isOwner} onEdit={()=>{ setDraft(bio); setEditing(true); }}/>
        <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
          {/* Text left */}
          <div style={{ flex:1 }}>
            {loading ? (
              <><Sk w="100%" h={14} r={5} style={{marginBottom:6}}/><Sk w="90%" h={14} r={5} style={{marginBottom:6}}/><Sk w="75%" h={14} r={5}/></>
            ) : editing ? (
              <>
                <textarea autoFocus value={draft} onChange={e=>setDraft(e.target.value.slice(0,MAX))}
                  style={{ width:"100%", minHeight:80, border:`1.5px solid ${T.tealMid}`,
                    borderRadius:T.r12, padding:"10px 12px", outline:"none",
                    background:T.bgSheet, fontSize:13.5, color:T.ink,
                    lineHeight:1.68, resize:"none", fontFamily:"inherit",
                    fontStyle:"italic", boxSizing:"border-box" }}
                  placeholder="Deine persönliche Vorstellung..."
                />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <span style={{ fontSize:11, color:T.inkFaint }}>{draft.length} / {MAX}</span>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="ctp-press" onClick={()=>setEditing(false)} style={{
                      padding:"7px 14px", borderRadius:T.r99, border:`1px solid ${T.border}`,
                      background:"transparent", fontSize:12, fontWeight:600, color:T.inkSoft,
                      touchAction:"manipulation", fontFamily:"inherit",
                    }}>Abbrechen</button>
                    <button className="ctp-press" onClick={handleSave} style={{
                      padding:"7px 16px", borderRadius:T.r99, border:"none",
                      background:`linear-gradient(135deg,${T.teal},${T.tealDark})`,
                      fontSize:12, fontWeight:700, color:"white",
                      touchAction:"manipulation", fontFamily:"inherit", boxShadow:T.glow,
                    }}>Speichern</button>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ fontSize:13.5, lineHeight:1.72, color:T.inkSoft, margin:0,
                fontFamily:"-apple-system,'Georgia',serif", fontStyle:"italic",
                whiteSpace:"pre-line" }}>{bio}</p>
            )}
          </div>
          {/* Thumbnail right — matches screenshot nature image */}
          {!editing && (
            <div style={{ flexShrink:0, width:100, height:90, borderRadius:T.r12, overflow:"hidden",
              background:"rgba(26,26,24,0.06)", position:"relative" }}>
              {!imgOk && <div className="ctp-sk" style={{ position:"absolute", inset:0 }}/>}
              <img
                src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=75"
                alt="" onLoad={()=>setImgOk(true)} onError={()=>setImgOk(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
                  opacity:imgOk?1:0, transition:"opacity .5s ease" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 3. MEINE WERKE — 2×2 grid + "..." menu per work + add button
// ══════════════════════════════════════════════════════════════════
function WorkImg({ w, isOwner, onRemove }) {
  const [ok, setOk] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ position:"relative", borderRadius:T.r12, overflow:"hidden",
      background:"rgba(26,26,24,0.07)", aspectRatio:"1" }}>
      {!ok && <div className="ctp-sk" style={{ position:"absolute", inset:0 }}/>}
      <img src={w.img} alt="" onLoad={()=>setOk(true)} onError={()=>setOk(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
          opacity:ok?1:0, transition:"opacity .5s ease" }}/>
      {isOwner && (
        <>
          <button onClick={()=>setMenu(m=>!m)} style={{
            position:"absolute", top:7, right:7,
            width:26, height:26, borderRadius:"50%",
            background:"rgba(255,255,255,0.88)", backdropFilter:"blur(6px)",
            border:"none", fontSize:14, display:"flex", alignItems:"center",
            justifyContent:"center", cursor:"pointer", touchAction:"manipulation",
            boxShadow:"0 1px 6px rgba(0,0,0,0.12)", color:T.ink,
          }}>···</button>
          {menu && (
            <div style={{
              position:"absolute", top:36, right:7, zIndex:20,
              background:T.bgCard, borderRadius:T.r12, boxShadow:T.cardMd,
              border:`1px solid ${T.border}`, overflow:"hidden", minWidth:120,
            }}>
              {[["✏","Bearbeiten"],["🗑","Entfernen"]].map(([ic,lb])=>(
                <button key={lb} onClick={()=>{ if(lb==="Entfernen") onRemove(w.id); setMenu(false); }} style={{
                  display:"flex", alignItems:"center", gap:9, width:"100%",
                  padding:"11px 14px", background:"none", border:"none",
                  fontSize:13, fontWeight:600, color: lb==="Entfernen" ? "#E53E3E" : T.ink,
                  cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                  textAlign:"left",
                }}><span>{ic}</span>{lb}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MeineWerke({ profile, loading, isOwner }) {
  const [works, setWorks] = useState(SEED_WORKS);
  const remove = (id) => setWorks(w=>w.filter(x=>x.id!==id));
  return (
    <div className="ctp-section">
      <div className="ctp-section-pad">
        <SectionHeader title="Meine Werke" isOwner={isOwner} onEdit={()=>{}}/>
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[0,1,2,3].map(i=><Sk key={i} w="100%" h={140} r={T.r12} style={{aspectRatio:"1"}}/>)}
          </div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {works.map(w=><WorkImg key={w.id} w={w} isOwner={isOwner} onRemove={remove}/>)}
            </div>
            {isOwner && (
              <button className="ctp-add-btn">
                <span style={{ fontSize:16 }}>+</span> Werk hinzufügen
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 4. MEINE TALENTE & ANGEBOTE — pills with subtitle text
// ══════════════════════════════════════════════════════════════════
function TalenteAngebote({ profile, loading, isOwner }) {
  const [showEdit, setShowEdit] = useState(false);
  const talents = DEFAULT_TALENTS;
  return (
    <div className="ctp-section">
      <div className="ctp-section-pad">
        <SectionHeader title="Meine Talente & Angebote" isOwner={isOwner} onEdit={()=>setShowEdit(true)}/>
        {loading ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {[0,1,2,3,4].map(i=><Sk key={i} w={120} h={72} r={T.r12}/>)}
          </div>
        ) : (
          <div className="ctp-hscroll" style={{ display:"flex", gap:10, paddingBottom:4 }}>
            {talents.map((t,i)=>(
              <div key={i} className="ctp-in" style={{ ...dl(i,50),
                flexShrink:0, width:110,
                background:T.bg, borderRadius:T.r12,
                border:`1px solid ${T.border}`, padding:"12px",
                boxShadow:T.card,
              }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{t.icon}</div>
                <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, lineHeight:1.3, marginBottom:3 }}>{t.label}</div>
                <div style={{ fontSize:10.5, color:T.inkFaint, lineHeight:1.35 }}>{t.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showEdit && (
        <BottomSheet onClose={()=>setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:16 }}>Talente & Angebote bearbeiten</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {DEFAULT_TALENTS.map((t,i)=>(
              <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 16px",
                borderRadius:T.r99, background:T.tealSoft, border:`1px solid ${T.tealMid}`,
                fontSize:13, fontWeight:600, color:T.teal, boxShadow:T.card }}>
                <span style={{fontSize:14}}>{t.icon}</span>{t.label}
              </div>
            ))}
          </div>
          <button className="ctp-press" onClick={()=>setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},${T.tealDark})`,
            color:"white", fontSize:15, fontWeight:700,
            touchAction:"manipulation", fontFamily:"inherit", boxShadow:T.glow,
          }}>Fertig</button>
        </BottomSheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 5. ERLEBNISSE & PROJEKTE — 130×110 cards + "+ Projekt hinzufügen"
// ══════════════════════════════════════════════════════════════════
function ExpCard({ e, i, isOwner }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="ctp-in" style={{ ...dl(i,55), flexShrink:0, width:130, position:"relative" }}>
      {isOwner && (
        <button style={{
          position:"absolute", top:7, left:7, zIndex:5,
          width:22, height:22, borderRadius:"50%",
          background:"rgba(255,255,255,0.88)", backdropFilter:"blur(6px)",
          border:"none", fontSize:11, display:"flex", alignItems:"center",
          justifyContent:"center", cursor:"pointer", touchAction:"manipulation",
          color:T.ink, boxShadow:"0 1px 4px rgba(0,0,0,0.10)",
        }}>+</button>
      )}
      <div style={{ width:130, height:110, borderRadius:T.r12, overflow:"hidden",
        background:"rgba(26,26,24,0.07)", marginBottom:8, position:"relative" }}>
        {!ok && <div className="ctp-sk" style={{ position:"absolute", inset:0 }}/>}
        <img src={e.img} alt={e.title} onLoad={()=>setOk(true)} onError={()=>setOk(true)}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
            opacity:ok?1:0, transition:"opacity .5s ease" }}/>
      </div>
      <div style={{ fontSize:11.5, fontWeight:700, color:T.ink, lineHeight:1.35, marginBottom:2 }}>{e.title}</div>
      <div style={{ fontSize:10.5, color:T.inkFaint }}>{e.type}</div>
      <div style={{ fontSize:10.5, color:T.inkFaint }}>{e.date}</div>
    </div>
  );
}

function ErlebnisseProjekte({ loading, isOwner }) {
  return (
    <div className="ctp-section">
      <div className="ctp-section-pad">
        <SectionHeader title="Erlebnisse & Projekte" isOwner={isOwner} onEdit={()=>{}}/>
        {loading ? (
          <div style={{ display:"flex", gap:10 }}>
            {[0,1,2,3].map(i=><Sk key={i} w={130} h={110} r={T.r12}/>)}
          </div>
        ) : (
          <div className="ctp-hscroll" style={{ display:"flex", gap:10, paddingBottom:4 }}>
            {SEED_EXP.map((e,i)=><ExpCard key={e.id} e={e} i={i} isOwner={isOwner}/>)}
            {/* Add slot */}
            {isOwner && (
              <div style={{ flexShrink:0, width:90, minHeight:110,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:6, borderRadius:T.r12, border:`1.5px dashed ${T.borderMid}`,
                cursor:"pointer", touchAction:"manipulation", padding:12 }}>
                <span style={{ fontSize:20, color:T.inkFaint }}>+</span>
                <span style={{ fontSize:10.5, color:T.inkFaint, textAlign:"center", lineHeight:1.4 }}>Projekt hinzufügen</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 6. VERFÜGBARKEIT — calendar row + "Verfügbar" pill
// ══════════════════════════════════════════════════════════════════
function Verfuegbarkeit({ profile, loading, isOwner }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ctp-section">
      <div className="ctp-section-pad">
        <SectionHeader title="Verfügbarkeit" isOwner={isOwner} onEdit={()=>setOpen(true)}/>
        {loading ? (
          <Sk w="100%" h={48} r={T.r12}/>
        ) : (
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            background:T.bg, borderRadius:T.r12,
            border:`1px solid ${T.border}`, padding:"12px 14px",
            boxShadow:T.card,
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>📅</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12.5, color:T.inkSoft, fontWeight:500 }}>
                Für Auftragsarbeiten & Kollaborationen
              </div>
            </div>
            <div style={{
              display:"flex", alignItems:"center", gap:5,
              padding:"5px 12px", borderRadius:T.r99,
              background:T.tealSoft, border:`1px solid ${T.tealMid}`,
              fontSize:12, fontWeight:700, color:T.teal, flexShrink:0,
            }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal }}/>
              Verfügbar
              <span style={{ fontSize:10, color:T.teal }}>▾</span>
            </div>
          </div>
        )}
      </div>
      {open && (
        <BottomSheet onClose={()=>setOpen(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:16 }}>📅 Verfügbarkeit</div>
          {[
            ["Verfügbar","Offen für neue Anfragen"],
            ["Eingeschränkt","Begrenzte Kapazität"],
            ["Nicht verfügbar","Momentan ausgebucht"],
          ].map(([label,sub])=>(
            <button key={label} onClick={()=>setOpen(false)} style={{
              display:"flex", alignItems:"center", gap:12, width:"100%",
              padding:"14px 16px", borderRadius:T.r12, border:`1px solid ${T.border}`,
              background:label==="Verfügbar"?T.tealSoft:T.bgCard,
              marginBottom:8, cursor:"pointer", touchAction:"manipulation",
              fontFamily:"inherit", textAlign:"left",
            }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background:label==="Verfügbar"?"#22c55e":label==="Eingeschränkt"?"#f59e0b":"#ef4444",
              }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>{label}</div>
                <div style={{ fontSize:11, color:T.inkFaint }}>{sub}</div>
              </div>
            </button>
          ))}
        </BottomSheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 7. BOTTOM CTA — "Lass uns gemeinsam..." + "Nachricht senden"
// ══════════════════════════════════════════════════════════════════
function BottomCTA({ isOwner }) {
  if (isOwner) return null; // Owner sieht keinen CTA auf eigenem Profil
  return (
    <div style={{
      margin:`0 ${T.px}px`,
      background:T.bgCard, borderRadius:T.r16,
      border:`1px solid ${T.border}`, padding:"18px 18px",
      boxShadow:T.cardMd,
      display:"flex", alignItems:"center", gap:14,
    }}>
      {/* HUI leaf icon */}
      <div style={{
        width:42, height:42, borderRadius:"50%",
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20, flexShrink:0,
      }}>🌿</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, lineHeight:1.35, marginBottom:3 }}>
          Lass uns gemeinsam etwas Schönes erschaffen.
        </div>
        <div style={{ fontSize:11.5, color:T.inkFaint, fontWeight:400 }}>
          Ich freue mich auf neue Ideen & inspirierende Projekte.
        </div>
      </div>
      <button className="ctp-press" style={{
        flexShrink:0, display:"flex", alignItems:"center", gap:7,
        padding:"11px 16px", borderRadius:T.r12, border:"none",
        background:`linear-gradient(135deg,${T.teal},${T.tealDark})`,
        color:"white", fontSize:12.5, fontWeight:700,
        touchAction:"manipulation", fontFamily:"inherit", boxShadow:T.glow,
      }}>
        Nachricht senden <span style={{ fontSize:14 }}>✉️</span>
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
export default function MyTalentProfile({ onClose, profileId, viewerMode = false }) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [mounted,  setMounted]  = useState(false);
  const [saveOk,   setSaveOk]   = useState(false);
  const [saving,   setSaving]   = useState(false);

  // isOwner: true wenn keine profileId übergeben (= eigenes Profil)
  // oder explizit viewerMode=false
  const isOwner = !viewerMode && !profileId;

  useEffect(()=>{
    const t = setTimeout(()=>setMounted(true), 30);
    return ()=>clearTimeout(t);
  },[]);

  useEffect(()=>{
    (async()=>{
      try {
        let id = profileId;
        if (!id) {
          const { data:{ user } } = await supabase.auth.getUser();
          id = user?.id;
        }
        if (!id) { setLoading(false); return; }
        const { data } = await supabase.from("profiles")
          .select("id,username,display_name,bio,avatar_url,header_img,location,has_talent_profile,role,membership_type")
          .eq("id", id).single();
        setProfile(data || null);
      } catch(e) { console.warn("MyTalentProfile:", e); }
      setLoading(false);
    })();
  },[profileId]);

  return (
    <div className="ctp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(12px)",
      transition:"opacity .32s ease, transform .32s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>

      {/* Save toast */}
      {(saving||saveOk) && (
        <div style={{
          position:"fixed", top:16, right:16, zIndex:9999,
          padding:"6px 14px", borderRadius:T.r99,
          background:saveOk ? T.tealSoft : "rgba(26,26,24,0.06)",
          border:`1px solid ${saveOk ? T.tealMid : T.border}`,
          fontSize:11.5, fontWeight:600, color:saveOk ? T.teal : T.inkFaint,
          backdropFilter:"blur(10px)",
        }}>
          {saveOk ? "✓ Gespeichert" : "Speichert…"}
        </div>
      )}

      {/* Scrollable page */}
      <div className="ctp-scroll" style={{
        flex:1, overflowY:"auto",
        paddingTop:8,
        paddingBottom:"max(80px,calc(64px + env(safe-area-inset-bottom,0px)))",
      }}>
        {/* 1. Hero block */}
        <HeroBlock profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap h={14}/>

        {/* 2. Über mich */}
        <UeberMich profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap h={14}/>

        {/* 3. Meine Werke */}
        <MeineWerke profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap h={14}/>

        {/* 4. Talente & Angebote */}
        <TalenteAngebote profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap h={14}/>

        {/* 5. Erlebnisse & Projekte */}
        <ErlebnisseProjekte loading={loading} isOwner={isOwner}/>
        <Gap h={14}/>

        {/* 6. Verfügbarkeit */}
        <Verfuegbarkeit profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap h={14}/>

        {/* 7. Bottom CTA (visitor only) */}
        <BottomCTA isOwner={isOwner}/>
        <Gap h={28}/>
      </div>
    </div>
  );
}

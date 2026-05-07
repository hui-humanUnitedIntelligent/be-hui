// ProfilePage.jsx — "Mein Profil" — persönliche kreative Identität
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.06)", gold:"#F5A623", green:"#3DB87A",
};

const MOCK_PROFILE = {
  name:"Lars Gutknecht", talent:"Unternehmer & Visionär", city:"München",
  tagline:"Ich glaube, dass echte Menschen echte Veränderung bewegen.",
  bio:"Ich baue Dinge, die bedeuten. Seit Jahren arbeite ich an der Schnittstelle zwischen Technologie, Kreativität und menschlicher Verbindung.\n\nHUI ist für mich nicht nur eine Plattform — es ist eine Überzeugung. Dass Talent, Vertrauen und Impact zusammengehören.",
  img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=90",
  bg:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=90",
  verified:true, memberSince:"2024", role:"wirker",
  impactEur:128.50, recommendations:12,
  werke:[
    {title:"Brand Identity Design",desc:"Visuelle Identitäten für Menschen und Marken mit Haltung.",price:"ab € 480",img:"https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&q=90"},
    {title:"Strategie-Workshop",desc:"Ein halber Tag — ein klares Bild von deiner Richtung.",price:"ab € 290",img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=90"},
    {title:"Digitale Produktentwicklung",desc:"Von der Idee zum MVP. Menschlich. Schnell. Bedeutsam.",price:"ab € 1.200",img:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=90"},
  ],
  experiences:[
    {title:"Vision Retreat",desc:"Ein Tag in der Natur. Deine nächste Richtung klarstellen.",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=90",duration:"1 Tag",price:"ab € 380"},
    {title:"Walk & Think Session",desc:"Spaziergang statt Besprechungsraum. Ideen brauchen Luft.",img:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=700&q=90",duration:"2 Std",price:"ab € 150"},
  ],
  empfehlungen:[
    {name:"Julia M.",city:"Berlin",img:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",text:"Lars denkt anders. Nicht schneller — tiefer. Nach unserem Workshop wusste ich, wohin mein Weg führt.",werk:"Strategie-Workshop",date:"April 2026"},
    {name:"Tom B.",city:"Hamburg",img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",text:"Das ist kein Dienstleister. Das ist jemand, der wirklich versteht, was du aufbaust.",werk:"Produktentwicklung",date:"März 2026"},
  ],
  gespeichert:[
    {title:"Handgefertigte Keramikschale",price:"€ 89",creator:"David Weber",img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=85"},
    {title:"Aquarell Original (A3)",price:"€ 120",creator:"Lena M.",img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=85"},
    {title:"Portrait im goldenen Licht",price:"ab € 280",creator:"Lea Sommer",img:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=85"},
  ],
  impact:{project:"Bildung für Kinder in indigenen Gemeinden",country:"Kolumbien",img:"https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=85"},
};

const CSS = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.05);opacity:1}}
  .pp-scroll::-webkit-scrollbar{display:none}
  .pp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .pp-tap{transition:transform .2s cubic-bezier(.34,1.4,.64,1)}
  .pp-tap:active{transform:scale(.965)}
`;

function SettingsSheet({profile,onClose,onLogout,onRoleSwitch}){
  const isWirker=profile.role==="wirker";
  const items=[
    {icon:"✏️",label:"Profil bearbeiten",sub:"Name, Foto, Bio, Standort"},
    {icon:"🎯",label:"Werke & Angebote",sub:"Preise, Beschreibungen, Verfügbarkeit"},
    {icon:"🔔",label:"Benachrichtigungen",sub:"Anfragen, Nachrichten, Impact-Updates"},
    {icon:"🔒",label:"Privatsphäre",sub:"Sichtbarkeit & Datenschutz"},
    {icon:"💳",label:"Zahlungen & Auszahlung",sub:"Konten, Historie, Treuhand"},
    {icon:"🌱",label:"Impact Einstellungen",sub:"Voting, Lieblingsprojekte"},
    {icon:"❓",label:"Hilfe & Support",sub:"FAQ, Kontakt"},
  ];
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(10,10,10,0.55)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.warm,borderRadius:"28px 28px 0 0",maxHeight:"90vh",overflowY:"auto",animation:"fadeUp 0.32s cubic-bezier(.22,1,.36,1) both",paddingBottom:"max(28px,env(safe-area-inset-bottom))"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 0"}}><div style={{width:44,height:4,borderRadius:999,background:"rgba(0,0,0,.10)"}}/></div>
        <div style={{padding:"16px 22px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:900,fontSize:22,color:C.ink}}>Einstellungen</div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:"rgba(0,0,0,.06)",border:"none",cursor:"pointer",fontSize:12,color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}}>✕</button>
        </div>
        <div style={{margin:"12px 22px",background:"linear-gradient(135deg,rgba(22,215,197,.10),rgba(255,138,107,.07))",borderRadius:20,border:"1px solid rgba(22,215,197,.18)",padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:C.ink}}>{isWirker?"Wirker-Modus":"Entdecker-Modus"}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{isWirker?"Du bietest Talente & Werke an":"Du entdeckst & buchst"}</div>
          </div>
          <button onClick={onRoleSwitch} style={{padding:"9px 18px",background:`linear-gradient(135deg,${C.teal},${C.coral})`,border:"none",borderRadius:999,fontSize:12,fontWeight:800,color:"white",cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{isWirker?"→ Entdecken":"→ Wirken"}</button>
        </div>
        <div style={{padding:"8px 22px"}}>
          {items.map((it,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
              <div style={{width:40,height:40,borderRadius:14,background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{it.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:C.ink}}>{it.label}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1}}>{it.sub}</div>
              </div>
              <span style={{color:C.muted2,fontSize:14}}>›</span>
            </div>
          ))}
        </div>
        <div style={{padding:"8px 22px 0"}}>
          <button onClick={onLogout} style={{width:"100%",padding:"14px",background:"none",border:`1.5px solid rgba(255,138,107,.30)`,borderRadius:18,fontSize:14,fontWeight:700,color:C.coral,cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>Abmelden</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage({onTalentAnbieten,onLogout}){
  const [profile,setProfile]=useState(MOCK_PROFILE);
  const [activeTab,setActiveTab]=useState("werke");
  const [showSettings,setShowSettings]=useState(false);
  const [editingBio,setEditingBio]=useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session)return;
      const u=session.user;
      setProfile(p=>({...p,name:u.user_metadata?.full_name||u.email?.split("@")[0]||p.name,img:u.user_metadata?.avatar_url||p.img}));
    });
  },[]);

  const tabs=profile.role==="wirker"
    ?[{key:"werke",label:"Werke"},{key:"erlebnisse",label:"Erlebnisse"},{key:"empfehlungen",label:"Empfehlungen"}]
    :[{key:"gespeichert",label:"Gespeichert"},{key:"empfehlungen",label:"Empfehlungen"}];

  return(
    <>
      <style>{CSS}</style>
      <div className="pp-scroll" style={{background:C.cream,paddingBottom:110,overflowY:"auto",height:"100%"}}>

        {/* ── CINEMATIC HERO ── */}
        <div style={{position:"relative",height:"56vh",minHeight:360,maxHeight:520}}>
          <img src={profile.bg} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.60) saturate(1.15)"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.28) 0%,rgba(0,0,0,0) 28%,rgba(10,5,0,.18) 55%,rgba(10,5,0,.85) 100%)"}}/>
          {/* Top bar */}
          <div style={{position:"absolute",top:0,left:0,right:0,padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:C.teal,boxShadow:`0 0 8px ${C.teal}`,animation:"breathe 3s ease-in-out infinite"}}/>
              <span style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:700,letterSpacing:.5}}>Mein Profil</span>
            </div>
            <button onClick={()=>setShowSettings(true)} style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,.18)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.28)",cursor:"pointer",fontSize:16,color:"white",display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}}>⚙</button>
          </div>
          {/* Identity */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 24px 28px"}}>
            {profile.verified&&(
              <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(22,215,197,.20)",backdropFilter:"blur(8px)",border:"1px solid rgba(22,215,197,.38)",borderRadius:999,padding:"4px 12px",marginBottom:12}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:C.teal,display:"inline-block",boxShadow:`0 0 6px ${C.teal}`}}/>
                <span style={{fontSize:11,color:C.teal,fontWeight:700}}>Verifiziertes Mitglied seit {profile.memberSince}</span>
              </div>
            )}
            <div style={{fontWeight:900,fontSize:32,color:"white",letterSpacing:-.9,lineHeight:1.1,marginBottom:6}}>{profile.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <span style={{fontSize:14,color:"rgba(255,255,255,.85)",fontWeight:600}}>{profile.talent}</span>
              <span style={{width:3,height:3,borderRadius:"50%",background:"rgba(255,255,255,.40)",display:"inline-block"}}/>
              <span style={{fontSize:13,color:"rgba(255,255,255,.62)"}}>📍 {profile.city}</span>
            </div>
            <div style={{fontSize:15,color:"rgba(255,255,255,.78)",fontStyle:"italic",lineHeight:1.65,maxWidth:310}}>„{profile.tagline}"</div>
          </div>
        </div>

        {/* ── AVATAR + ACTIONS ── */}
        <div style={{background:C.card,borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 24px",marginTop:-44}}>
            <div style={{width:90,height:90,borderRadius:"50%",overflow:"hidden",border:"4px solid white",boxShadow:"0 8px 32px rgba(0,0,0,.20)",flexShrink:0,cursor:"pointer"}}>
              <img src={profile.img} alt={profile.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
            <div style={{paddingBottom:4,display:"flex",gap:10}}>
              {profile.role==="entdecker"&&(
                <button onClick={onTalentAnbieten} style={{padding:"11px 20px",background:`linear-gradient(135deg,${C.teal},${C.coral})`,border:"none",borderRadius:999,fontSize:13,fontWeight:800,color:"white",cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 18px ${C.tealGlow}`,WebkitTapHighlightColor:"transparent"}}>✦ Wirken</button>
              )}
              <button onClick={()=>setEditingBio(p=>!p)} style={{padding:"11px 20px",background:"rgba(0,0,0,.05)",border:`1.5px solid ${C.border}`,borderRadius:999,fontSize:13,fontWeight:700,color:C.ink,cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>Bearbeiten</button>
            </div>
          </div>
          <div style={{display:"flex",gap:0,margin:"18px 24px 20px"}}>
            {[{val:`€ ${profile.impactEur.toFixed(0)}`,label:"Impact bewirkt",color:C.green},{val:profile.recommendations,label:"Empfehlungen",color:C.teal}].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:"center",padding:"12px 4px",borderRight:i<1?`1px solid ${C.border}`:"none"}}>
                <div style={{fontWeight:900,fontSize:20,color:s.color}}>{s.val}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STORY: ÜBER MICH ── */}
        <div style={{background:C.card,padding:"32px 24px 32px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:800,fontSize:12,color:C.teal,letterSpacing:1.8,textTransform:"uppercase",marginBottom:16}}>Über mich</div>
          {editingBio?(
            <textarea value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} rows={6} autoFocus onBlur={()=>setEditingBio(false)}
              style={{width:"100%",boxSizing:"border-box",fontSize:16,color:C.ink2,lineHeight:1.85,fontFamily:"inherit",background:"transparent",border:`1.5px solid ${C.teal}`,borderRadius:16,padding:"12px 14px",outline:"none",resize:"none"}}/>
          ):(
            <div style={{fontSize:16,color:C.ink2,lineHeight:1.85,whiteSpace:"pre-line"}}>{profile.bio}</div>
          )}
          <div style={{marginTop:28,height:1,background:`linear-gradient(to right,${C.teal}40,${C.coral}28,transparent)`}}/>
        </div>

        {/* ── TABS ── */}
        <div style={{background:C.card,position:"sticky",top:0,zIndex:10,borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex"}}>
            {tabs.map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                style={{flex:1,padding:"15px 4px",background:"none",border:"none",cursor:"pointer",borderBottom:activeTab===t.key?`2.5px solid ${C.teal}`:"2.5px solid transparent",fontSize:13,fontWeight:activeTab===t.key?800:500,color:activeTab===t.key?C.teal:C.muted,transition:"all .2s",WebkitTapHighlightColor:"transparent"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── WERKE ── */}
        {activeTab==="werke"&&(
          <div style={{padding:"28px 20px 8px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {profile.werke.map((w,i)=>(
                <div key={i} className="pp-tap" style={{borderRadius:24,overflow:"hidden",background:C.card,cursor:"pointer",boxShadow:"0 4px 24px rgba(0,0,0,.09)",animation:`fadeUp .5s ${i*.09}s both`}}>
                  <div style={{height:230,overflow:"hidden",position:"relative"}}>
                    <img src={w.img} alt={w.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(255,138,107,.05) 0%,transparent 40%,rgba(0,0,0,.48) 100%)"}}/>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.coral},transparent)`}}/>
                    <div style={{position:"absolute",bottom:14,right:14}}>
                      <div style={{background:"rgba(255,255,255,.92)",backdropFilter:"blur(8px)",borderRadius:999,padding:"5px 14px",fontSize:12,fontWeight:900,color:C.ink}}>{w.price}</div>
                    </div>
                    <div style={{position:"absolute",top:14,right:14}}>
                      <button style={{background:"rgba(255,255,255,.20)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.30)",borderRadius:999,padding:"5px 12px",fontSize:10,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>✏ Bearbeiten</button>
                    </div>
                  </div>
                  <div style={{padding:"18px 20px 20px"}}>
                    <div style={{fontWeight:800,fontSize:17,color:C.ink,letterSpacing:-.3,marginBottom:6}}>{w.title}</div>
                    <div style={{fontSize:14,color:C.muted,lineHeight:1.65}}>{w.desc}</div>
                  </div>
                </div>
              ))}
              <button onClick={onTalentAnbieten} style={{width:"100%",padding:"18px",background:"none",border:`2px dashed rgba(22,215,197,.35)`,borderRadius:24,fontSize:14,fontWeight:700,color:C.teal,cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>+ Neues Werk hinzufügen</button>
            </div>
          </div>
        )}

        {/* ── ERLEBNISSE ── */}
        {activeTab==="erlebnisse"&&(
          <div style={{padding:"28px 20px 8px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {profile.experiences.map((ex,i)=>(
                <div key={i} className="pp-tap" style={{borderRadius:24,overflow:"hidden",background:C.card,cursor:"pointer",boxShadow:"0 4px 24px rgba(0,0,0,.09)",animation:`fadeUp .5s ${i*.09}s both`}}>
                  <div style={{height:200,position:"relative",overflow:"hidden"}}>
                    <img src={ex.img} alt={ex.title} style={{width:"100%",height:"100%",objectFit:"cover",filter:"brightness(.80) saturate(1.1)"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(22,215,197,.08) 0%,rgba(0,0,0,.54) 100%)"}}/>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.teal},transparent)`}}/>
                    <div style={{position:"absolute",top:14,left:14}}>
                      <div style={{background:"rgba(255,255,255,.20)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,.30)",borderRadius:999,padding:"5px 13px",fontSize:11,fontWeight:700,color:"white"}}>⏱ {ex.duration}</div>
                    </div>
                  </div>
                  <div style={{padding:"16px 20px 20px"}}>
                    <div style={{fontWeight:800,fontSize:16,color:C.ink,marginBottom:6}}>{ex.title}</div>
                    <div style={{fontSize:14,color:C.muted,lineHeight:1.65,marginBottom:12}}>{ex.desc}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:800,fontSize:15,color:C.teal}}>{ex.price}</span>
                      <button style={{padding:"9px 18px",background:"rgba(0,0,0,.04)",border:`1.5px solid ${C.border}`,borderRadius:999,fontSize:12,fontWeight:700,color:C.muted,cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>✏ Bearbeiten</button>
                    </div>
                  </div>
                </div>
              ))}
              <button style={{width:"100%",padding:"18px",background:"none",border:`2px dashed rgba(22,215,197,.35)`,borderRadius:24,fontSize:14,fontWeight:700,color:C.teal,cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>+ Neues Erlebnis hinzufügen</button>
            </div>
          </div>
        )}

        {/* ── EMPFEHLUNGEN ── */}
        {activeTab==="empfehlungen"&&(
          <div style={{padding:"28px 24px 8px"}}>
            <div style={{fontWeight:800,fontSize:12,color:C.teal,letterSpacing:1.8,textTransform:"uppercase",marginBottom:6}}>Was Menschen sagen</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:28}}>{profile.empfehlungen.length} verifizierte Empfehlungen</div>
            <div style={{display:"flex",flexDirection:"column",gap:28}}>
              {profile.empfehlungen.map((rec,i)=>(
                <div key={i} style={{animation:`fadeUp .5s ${i*.10}s both`}}>
                  <div style={{fontSize:18,color:C.ink,fontStyle:"italic",fontWeight:500,lineHeight:1.72,marginBottom:16,padding:"0 0 0 20px",borderLeft:`3px solid ${C.teal}`}}>„{rec.text}"</div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <img src={rec.img} alt={rec.name} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.tealPale}`}}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:C.ink}}>{rec.name}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:1}}>{rec.werk} · {rec.date}</div>
                    </div>
                    <div style={{marginLeft:"auto",background:C.tealPale,borderRadius:999,padding:"3px 10px",fontSize:10,fontWeight:700,color:C.teal}}>✓ Verifiziert</div>
                  </div>
                  {i<profile.empfehlungen.length-1&&<div style={{marginTop:24,height:1,background:`linear-gradient(to right,${C.border},transparent)`}}/>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GESPEICHERT ── */}
        {activeTab==="gespeichert"&&(
          <div style={{padding:"28px 20px 8px"}}>
            <div style={{fontWeight:800,fontSize:12,color:C.coral,letterSpacing:1.8,textTransform:"uppercase",marginBottom:20}}>Meine Sammlung</div>
            <div style={{columns:2,columnGap:14}}>
              {profile.gespeichert.map((g,i)=>(
                <div key={i} className="pp-tap" style={{breakInside:"avoid",marginBottom:16,cursor:"pointer",animation:`fadeUp .5s ${i*.08}s both`}}>
                  <div style={{borderRadius:20,overflow:"hidden",height:180+i*22,position:"relative",boxShadow:"0 3px 14px rgba(0,0,0,.09)"}}>
                    <img src={g.img} alt={g.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(255,138,107,.06) 0%,rgba(0,0,0,.50) 100%)"}}/>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.coral},transparent)`}}/>
                    <div style={{position:"absolute",top:10,left:10}}>
                      <div style={{background:"rgba(255,255,255,.90)",backdropFilter:"blur(8px)",borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:900,color:C.ink}}>{g.price}</div>
                    </div>
                  </div>
                  <div style={{padding:"7px 2px 0"}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.ink,lineHeight:1.35}}>{g.title}</div>
                    <div style={{fontSize:11,color:C.teal,fontWeight:600,marginTop:2}}>{g.creator}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── IMPACT ── */}
        <div style={{margin:"28px 20px 0",borderRadius:24,overflow:"hidden",position:"relative",cursor:"pointer"}}>
          <img src={profile.impact.img} alt="Impact" style={{width:"100%",height:170,objectFit:"cover",filter:"brightness(.60) saturate(1.15)"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(22,215,197,.55) 0%,rgba(255,138,107,.40) 100%)"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"20px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.72)",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Mein Impact</div>
            <div style={{fontWeight:900,fontSize:17,color:"white",letterSpacing:-.3,lineHeight:1.2,marginBottom:4}}>{profile.impact.project}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.72)",marginBottom:8}}>📍 {profile.impact.country}</div>
            <div style={{fontSize:14,fontWeight:800,color:C.teal}}>€ {profile.impactEur.toFixed(2)} gemeinsam bewegt</div>
          </div>
        </div>

        <div style={{height:20}}/>
      </div>

      {showSettings&&(
        <SettingsSheet profile={profile} onClose={()=>setShowSettings(false)}
          onLogout={()=>{supabase.auth.signOut();onLogout&&onLogout();}}
          onRoleSwitch={()=>{
            setProfile(p=>({...p,role:p.role==="wirker"?"entdecker":"wirker"}));
            setActiveTab(profile.role==="wirker"?"gespeichert":"werke");
            setShowSettings(false);
          }}/>
      )}
    </>
  );
}

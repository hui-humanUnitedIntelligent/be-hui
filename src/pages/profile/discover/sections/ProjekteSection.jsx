import React from "react";
import { T } from "../tokens.js";
import { SectionHead } from "../components/SectionHead.jsx";
import { Skel } from "../components/Skel.jsx";
import { ProjektCard } from "./ProjektCard.jsx";

export function ProjekteSection({ projekte, loading, delay=0, view='cards', onPress, onSectionAction }) {
  const allProjekte = projekte.length > 0 ? projekte : SEED_PROJEKTE;
  const hero = allProjekte[0];
  const rest = allProjekte.slice(1);
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-projekte/>
      <SectionHead
        title="Projekte & Initiativen"
        sub="Gemeinsam echte Wirkung schaffen."
        action="Alle Projekte"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div style={{ paddingLeft:T.px, paddingRight:T.px }}>
          {/* ── Hero: Projekt der Woche ── */}
          {!loading && hero && (
            <div className="dp-projekt-hero dp-in" onClick={() => onPress?.(hero)} style={{
              position:"relative", borderRadius:20, overflow:"hidden",
              cursor:"pointer",
              height:180, marginBottom:10,
              background: hero.cover ? "#000" : "linear-gradient(135deg,rgba(14,196,184,0.15),rgba(232,87,58,0.10))",
              boxShadow:"0 6px 24px rgba(26,53,48,0.12)",
              animationDelay:`${delay}ms`,
            }}>
              {hero.cover && (
                <img loading="lazy" decoding="async" src={hero.cover} alt={hero.title}
                  style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.75 }}
                  onError={e => e.target.style.display="none"}/>
              )}
              {/* Gradient */}
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.80) 0%,rgba(0,0,0,0.10) 60%)" }}/>
              {/* Badge */}
              <div style={{
                position:"absolute",top:12,left:12,
                background:"#D97706", borderRadius:99,
                padding:"3px 10px", fontSize:9.5, fontWeight:800,
                color:"white", letterSpacing:".04em",
              }}>🔥 Projekt der Woche</div>
              {/* Content */}
              <div style={{ position:"absolute",bottom:14,left:14,right:14 }}>
                <div style={{ fontSize:17, fontWeight:900, color:"white", letterSpacing:"-0.03em", marginBottom:4, lineHeight:1.2 }}>
                  {hero.title}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.72)", marginBottom:10, lineHeight:1.4 }}>
                  {hero.desc}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.80)", display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><HUIPersonenIcon size={14}/><span>{hero.members} Mitglieder</span></span>
                  </div>
                  <div onClick={() => onPress?.(hero)} style={{
                    background:"rgba(14,196,184,0.90)", backdropFilter:"blur(8px)",
                    borderRadius:99, padding:"5px 14px",
                    fontSize:11, fontWeight:700, color:"white",
                    cursor:"pointer", touchAction:"manipulation",
                    WebkitTapHighlightColor:"transparent",
                  }}>Projekt ansehen →</div>
                </div>
              </div>
            </div>
          )}
          {/* ── Restliche Projekte — horizontal scrollbar ── */}
          <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingBottom:4 }}>
            {loading
              ? Array.from({length:4}).map((_,i) => (
                  <div key={i} style={{ width:160, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                    <Skel w="100%" h={90} r={0} mb={0}/>
                    <div style={{ padding:"10px 10px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="60%" h={10} r={5}/></div>
                  </div>
                ))
              : rest.map((p, i) => <ProjektCard key={p.id} projekt={p} delay={i*35+delay} onPress={onPress} />)
            }
          </div>
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="70%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : projekte.map((p) => {
                const cc = p.catColor || { bg:T.tealSoft, text:T.teal };
                return (
                  <div key={p.id} className="dp-list-card" onClick={() => onPress?.(p)} style={{cursor:"pointer"}}>
                    <div className="dp-list-thumb-placeholder" style={{ background:cc.bg, position:"relative", overflow:"hidden" }}>
                      {p.cover
                        ? <img loading="lazy" decoding="async" src={p.cover} alt={p.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }} onError={ev => ev.target.style.display='none'}/>
                        : <span>🌍</span>
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em" }}>{p.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:5, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.desc}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, background:cc.bg, color:cc.text, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{p.cat}</span>
                        <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUIPersonenIcon size={11}/>{p.members} Mitgl.</span>
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 8. ORTE ENTDECKEN
// ════════════════════════════════════════════════════════════════

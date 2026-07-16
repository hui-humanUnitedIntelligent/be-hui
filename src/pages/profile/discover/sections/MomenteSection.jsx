import React from "react";
import { T } from "../tokens.js";
import { SectionHead } from "../components/SectionHead.jsx";
import { Skel } from "../components/Skel.jsx";
import { MomentCard } from "./MomentCard.jsx";

export function MomenteSection({ momente, loading, delay=0, view='cards', onPress, onSectionAction }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-momente/>
      <SectionHead
        title="Momente aus deiner Nähe"
        sub="Echte Geschichten, gerade jetzt."
        action="Alle anzeigen"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:175, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={130} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={6}/></div>
                </div>
              ))
            : momente.map((m, i) => <MomentCard key={m.id} moment={m} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : momente.map((m) => (
                <div key={m.id} className="dp-list-card" onClick={() => onPress?.(m)} style={{cursor:"pointer"}}>
                  {m.src
                    ? <img loading="lazy" decoding="async" src={m.src} alt={m.caption} className="dp-list-thumb" onError={e => e.target.style.display='none'} style={{ objectFit:"cover" }}/>
                    : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUIFotoIcon size={24} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}}/></div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", lineHeight:1.35 }}>{m.caption}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:T.inkSoft }}>{m.name}</span>
                      {m.location && <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{m.location}</span>}
                      <span style={{ fontSize:10.5, color:T.inkFaint }}>{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4b. TALENTE ENTDECKEN (TALENT-DISCOVERY-001, 2026-07-05)
// Zeigt freigegebene Dienstleistungen aus der "talents"-Tabelle
// (TALENT-OFFERS-001/TALENT-SERVICES-001). Gleiches Karten-Layout wie
// "Werke entdecken" (WerkCard/WerkeSection), bewusst als eigene, additive
// Komponente — kein Umbau der bestehenden Werke-Sektion.
// ════════════════════════════════════════════════════════════════

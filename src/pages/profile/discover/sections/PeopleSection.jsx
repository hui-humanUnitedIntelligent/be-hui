import React from "react";
import { T } from "../tokens.js";
import { SectionHead } from "../components/SectionHead.jsx";
import { Skel } from "../components/Skel.jsx";
import { PersonCard } from "./PersonCard.jsx";

export function PeopleSection({ people, onPersonPress, loading, delay=0, view='cards', onSectionAction }) {
  return (
    <div className="dp-in" style={{ animationDelay:`${delay}ms`, marginTop:10 }}>
      <div data-dp-people/>
      <SectionHead
        title="Inspirierende Menschen"
        sub="Entdecke wundervolle Menschen auf HUI."
        action="Alle anzeigen"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{
          display:"flex", gap:10,
          paddingLeft:T.px, paddingRight:T.px, paddingBottom:4,
        }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:130, flexShrink:0, borderRadius:20, overflow:"hidden", background:T.white, boxShadow:T.cardShadow, padding:"14px 10px" }}>
                  <Skel w={72} h={72} r={99} mb={10} />
                  <Skel w="80%" h={12} r={8} mb={6} />
                  <Skel w="60%" h={10} r={6} mb={8} />
                  <Skel w="70%" h={10} r={6} />
                </div>
              ))
            : people.map((p, i) => (
                <PersonCard key={p.id} person={p} onPress={onPersonPress} delay={i*40+delay} />
              ))
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12} /><div style={{flex:1}}><Skel w="70%" h={13} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : people.map((p, i) => (
                <div key={p.id} className="dp-list-card" onClick={() => onPersonPress?.(p)}>
                  {p.avatar
                    ? <img loading="lazy" decoding="async" src={p.avatar} alt={p.name} className="dp-list-thumb" onError={e => e.target.style.display='none'}/>
                    : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUIProfilIcon size={24} style={{opacity:0.35, color:"rgba(14,196,184,0.5)"}}/></div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:3, letterSpacing:"-0.02em" }}>{p.name}</div>
                    <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:5, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.bio}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {p.location && <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{p.location}</span>}
                      <span style={{ fontSize:11, color:T.teal, fontWeight:600 }}>⚡ {fmtImpact(p.impact)}</span>
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
// 4. MOMENTE AUS DEINER NÄHE
// ════════════════════════════════════════════════════════════════

import React from "react";
import { T } from "../tokens.js";
import { SectionHead } from "../components/SectionHead.jsx";
import { Skel } from "../components/Skel.jsx";
import { OrtCard } from "./OrtCard.jsx";
import { SEED_ORTE } from "../tokens.js";

export function OrteSection({ onMap, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Orte entdecken"
        sub="Besondere HUI-Räume, Parks & Begegnungsorte."
        action="Alle Orte"
        onAction={() => setShowOrteModal(true)}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:8, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {SEED_ORTE.map((ort, i) => <OrtCard key={ort.id} ort={ort} delay={i*30+delay} onMap={onMap} />)}
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {SEED_ORTE.map((ort) => (
            <div key={ort.id} className="dp-list-card" onClick={onMap}>
              <div className="dp-list-thumb-placeholder" style={{ position:"relative", overflow:"hidden" }}>
                {ort.cover
                  ? <img loading="lazy" decoding="async" src={ort.cover} alt={ort.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display='none'}/>
                  : <HUILocationIcon size={11} style={{flexShrink:0}} />
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em" }}>{ort.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11.5, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{ort.city}</span>
                  {ort.dist !== "—" && <span style={{ fontSize:11, background:T.tealSoft, color:T.teal, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{ort.dist}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


import React from "react";
import { T } from "../tokens.js";
import { SectionHead } from "../components/SectionHead.jsx";
import { Skel } from "../components/Skel.jsx";
import { LocationRadiusRow } from "../components/LocationRadiusRow.jsx";
import { ErlebnisCard } from "./ErlebnisCard.jsx";

const ErlebnisCardM = React.memo(ErlebnisCard);

export function ErlebnisseSection({
  erlebnisse, loading, delay=0, view='cards', onPress, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-erlebnisse/>
      <SectionHead
        title="Erlebnisse für dich"
        sub="Workshops, Treffen, Kurse & besondere Momente."
        action="Alle Erlebnisse"
        onAction={onSectionAction}
        delay={delay}
      />
      <LocationRadiusRow
        locQuery={locQuery} onLocQueryChange={onLocQueryChange}
        locSuggest={locSuggest} locSearching={locSearching} locActive={locActive}
        onPickLoc={onPickLoc} onClearLoc={onClearLoc}
        radiusKm={radiusKm} radiusStages={radiusStages} onRadiusChange={onRadiusChange}
        hiddenNoCoordsCount={hiddenNoCoordsCount}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:155, flexShrink:0, borderRadius:CARD_RADIUS, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={105} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="55%" h={10} r={5}/></div>
                </div>
              ))
            : erlebnisse.map((e, i) => <ErlebnisCardM key={e.id} erlebnis={e} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : erlebnisse.map((e) => {
                const statusDot = {
                  "Aktiv":"#16A34A", "Geplant":"#D97706",
                }[e.statusLabel] || "rgba(26,26,46,0.30)";
                return (
                  <div key={e.id} className="dp-list-card">
                    <div className="dp-list-thumb-placeholder" style={{ background: e.cover ? "#1A1A18" : T.tealSoft, position:"relative", overflow:"hidden" }}>
                      {e.cover
                        ? <img loading="lazy" decoding="async" src={e.cover} alt={e.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={ev => ev.currentTarget.style.display="none"}/>
                        : <HUIKalenderIcon size={20} style={{color:"rgba(14,196,184,0.5)"}} />
                      }
                      {e.date && (
                        <div style={{ position:"absolute", bottom:3, left:0, right:0, textAlign:"center",
                          background:"rgba(0,0,0,0.45)", padding:"1px 0" }}>
                          <span style={{ fontSize:9, fontWeight:800, color:"white" }}>{e.date} {e.month}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em",
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{e.title}</div>
                      {e.typeLabel && (
                        <div style={{ fontSize:11, color:T.teal, fontWeight:600, marginBottom:3 }}>{e.typeLabel}</div>
                      )}
                      {e.location && (
                        <div style={{ fontSize:11, color:T.inkFaint, marginBottom:3, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{e.location}</div>
                      )}
                      {e.statusLabel && (
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:statusDot, display:"inline-block" }}/>
                          <span style={{ fontSize:10.5, fontWeight:600, color:e.statusColor }}>{e.statusLabel}</span>
                        </div>
                      )}
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
// 7. PROJEKTE & INITIATIVEN
// ════════════════════════════════════════════════════════════════

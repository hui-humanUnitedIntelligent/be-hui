import React from "react";
import { T, MEDIUM_COLOR } from "../tokens.js";
import { HUILocationIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { SectionHead } from "../components/SectionHead.jsx";
import { Skel } from "../components/Skel.jsx";
import { LocationRadiusRow } from "../components/LocationRadiusRow.jsx";
import { WerkCard } from "./WerkCard.jsx";

const WerkCardM = React.memo(WerkCard);

export function WerkeSection({
  werke, loading, delay=0, view='cards', onPress, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-werke/>
      <SectionHead
        title="Werke entdecken"
        sub="Kunst, Musik, Fotografie & mehr von der HUI Community."
        action="Alle Werke"
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
                <div key={i} style={{ width:145, flexShrink:0, borderRadius:16, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={100} r={0} mb={0}/>
                  <div style={{ padding:"9px 10px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div>
                </div>
              ))
            : werke.map((w, i) => <WerkCardM key={w.id} werk={w} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="70%" h={12} r={6} mb={6}/><Skel w="40%" h={10} r={5}/></div></div>
              ))
            : werke.map((w) => {
                const medCol = MEDIUM_COLOR[w.medium] || { bg:T.tealSoft, text:T.teal };
                const priceStr = w.price != null
                  ? parseFloat(w.price).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €"
                  : null;
                return (
                  <div key={w.id} className="dp-list-card" onClick={() => onPress?.(w)} style={{cursor:"pointer"}}>
                    <div className="dp-list-thumb-placeholder" style={{ background: w.cover ? "#1A1A18" : medCol.bg }}>
                      {w.cover
                        ? <img loading="lazy" decoding="async" src={w.cover} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} onError={e => e.currentTarget.style.display="none"}/>
                        : <span style={{ fontSize:20 }}>🎨</span>
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em",
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:4 }}>von {w.author}</div>
                      {w.location && (
                        <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:4, display:"flex", alignItems:"center", gap:3 }}>
                          <HUILocationIcon size={9} style={{flexShrink:0}} />
                          <span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.location}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {w.medium && (
                          <span style={{ fontSize:10.5, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"2px 8px", fontWeight:600 }}>{w.medium}</span>
                        )}
                        {priceStr && (
                          <span style={{ fontSize:12, fontWeight:800, color:T.teal }}>{priceStr}</span>
                        )}
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

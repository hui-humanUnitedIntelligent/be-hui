import React from "react";
import { T } from "../tokens.js";
import { HUILocationIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { radiusLabel } from "../../../../hooks/useRadiusFilter.js";
import { SectionHead } from "../components/SectionHead.jsx";
import { Skel } from "../components/Skel.jsx";
import { TalentCard } from "./TalentCard.jsx";

const TalentCardM = React.memo(TalentCard);

export function TalenteSection({
  talente, loading, delay=0, view='cards', onPress, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-talente/>
      <SectionHead
        title="Talente entdecken"
        sub="Dienstleistungen & Angebote von HUI Talenten."
        action="Alle Talente"
        onAction={onSectionAction}
        delay={delay}
      />

      {/* ── Umkreissuche ── */}
      <div style={{ padding:`0 ${T.px}px`, marginBottom:10 }}>
        {locActive ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
              borderRadius:99, background:T.tealSoft || "rgba(14,196,184,0.1)", border:`1px solid ${T.border}` }}>
              <HUILocationIcon size={12} style={{flexShrink:0}} />
              <span style={{ fontSize:11.5, fontWeight:600, color:T.ink,
                maxWidth:180, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                {locActive.label}
              </span>
              <button onClick={onClearLoc} style={{ background:"none", border:"none", cursor:"pointer",
                color:T.inkFaint, fontSize:14, lineHeight:1, padding:"0 2px" }}>×</button>
            </div>
            {/* Umkreissuche-Vereinheitlichung (2026-07-06): keine eigene
                Werteliste mehr -- radiusStages kommt ausschliesslich aus
                RADIUS_OPTIONS (src/context/RadiusContext.jsx), radiusKm/
                onRadiusChange sind derselbe globale Zustand wie in der
                Hauptsuche. radiusLabel() ist dieselbe Formatierungsfunktion
                wie in SearchCommandCenter -- kein zweiter "Weltweit"-String. */}
            <div style={{ display:"flex", gap:5, overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
              {radiusStages.map(stage => (
                <button key={String(stage)} onClick={() => onRadiusChange(stage)}
                  style={{ flexShrink:0, padding:"5px 10px", borderRadius:99, fontSize:10.5, fontWeight:700,
                    cursor:"pointer", border: radiusKm===stage ? "none" : `1px solid ${T.border}`,
                    background: radiusKm===stage ? T.ink : "none",
                    color: radiusKm===stage ? "#fff" : T.inkFaint, whiteSpace:"nowrap" }}>
                  {radiusLabel(stage)}
                </button>
              ))}
            </div>
            {hiddenNoCoordsCount > 0 && (
              <span style={{ fontSize:10, color:T.inkFaint }}>
                {hiddenNoCoordsCount} Angebot{hiddenNoCoordsCount>1?"e":""} ohne Standortangabe ausgeblendet
              </span>
            )}
          </div>
        ) : (
          <div style={{ position:"relative", maxWidth:320 }}>
            <input value={locQuery} onChange={e => onLocQueryChange(e.target.value)}
              placeholder="Standort eingeben, z.B. Paphos CY"
              style={{ width:"100%", padding:"8px 12px", borderRadius:99,
                border:`1px solid ${T.border}`, outline:"none", fontSize:12,
                color:T.ink, fontFamily:"inherit", boxSizing:"border-box", background:T.white }}/>
            {(locSearching || locSuggest.length > 0) && locQuery.trim().length >= 2 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:5,
                borderRadius:12, border:`1px solid ${T.border}`, background:T.white,
                boxShadow:T.cardShadow, overflow:"hidden" }}>
                {locSearching && <div style={{ padding:"8px 10px", fontSize:11, color:T.inkFaint }}>Suche…</div>}
                {!locSearching && locSuggest.map((s,i) => (
                  <button key={i} onClick={() => onPickLoc(s)}
                    style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 10px",
                      background:"none", border:"none", borderTop: i>0 ? `1px solid ${T.border}` : "none",
                      fontSize:11.5, color:T.ink, cursor:"pointer", fontFamily:"inherit" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:165, flexShrink:0, borderRadius:16, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={120} r={0} mb={0}/>
                  <div style={{ padding:"10px 11px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={6}/></div>
                </div>
              ))
            : talente.map((t, i) => <TalentCardM key={t.id} talent={t} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : talente.map((t) => {
                const medCol = MEDIUM_COLOR[t.category] || { bg:T.tealSoft, text:T.teal };
                const priceStr = t.price_per_hour != null
                  ? parseFloat(t.price_per_hour).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Std"
                  : t.price_per_session != null
                    ? parseFloat(t.price_per_session).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Termin"
                    : null;
                return (
                  <div key={t.id} className="dp-list-card" onClick={() => onPress?.(t)}>
                    {t.cover
                      ? <img loading="lazy" decoding="async" src={t.cover} alt={t.title} className="dp-list-thumb" onError={e => e.target.style.display='none'} style={{ objectFit:"cover" }}/>
                      : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUIImpactIcon size={24} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}}/></div>
                    }
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{t.title}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {t.category && (
                          <span style={{ fontSize:10.5, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"2px 8px", fontWeight:600 }}>{t.category}</span>
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

// ════════════════════════════════════════════════════════════════
// 5. WERKE ENTDECKEN
// ════════════════════════════════════════════════════════════════

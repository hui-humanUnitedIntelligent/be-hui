import React from "react";
import { T } from "../tokens.js";
import { HUILocationIcon } from "../../../../design/icons/HuiSystemIcons.jsx";

export function LocationRadiusRow({
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
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
          <div style={{ display:"flex", gap:5, overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
            {(radiusStages || [10,25,50,100]).map(stage => (
              <button key={String(stage)} onClick={() => onRadiusChange(stage)}
                style={{ flexShrink:0, padding:"5px 10px", borderRadius:99, fontSize:10.5, fontWeight:700,
                  cursor:"pointer", border: radiusKm===stage ? "none" : `1px solid ${T.border}`,
                  background: radiusKm===stage ? T.ink : "none",
                  color: radiusKm===stage ? "#fff" : T.inkFaint, whiteSpace:"nowrap" }}>
                {stage === "world" ? "Weltweit 🌍" : `${stage} km`}
              </button>
            ))}
          </div>
          {hiddenNoCoordsCount > 0 && (
            <span style={{ fontSize:10, color:T.inkFaint }}>
              {hiddenNoCoordsCount} Eintrag{hiddenNoCoordsCount>1?"e":""} ohne Standortangabe ausgeblendet
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
  );
}

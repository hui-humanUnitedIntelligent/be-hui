import React from "react";
import { fmtEur } from "../utils.js";

const WIRKUNGSCHIPS = [
  {
    pct:40, emoji:"💚", label:"Projekte fördern",
    color:"#0DC4B5",
    popover:"Finanziert Herzensprojekte der Gemeinschaft. Der Sieger erhält die volle Wunschsumme — die übrigen Projekte erhalten einen Anteil. Kein Projekt geht leer aus.",
    eurKey:"community",
  },
  {
    pct:30, emoji:"🚀", label:"HUI weiterentwickeln",
    color:"#F4714F",
    popover:"Ermöglicht neue Funktionen, Verbesserungen und strategische Projekte, die HUI als Plattform langfristig stärken — für alle Mitglieder.",
    eurKey:"wirkung",
  },
  {
    pct:20, emoji:"💡", label:"Neue Ideen ermöglichen",
    color:"#D4952A",
    popover:"Schafft Raum für innovative Projekte und Experimente. Ideen, die noch keinen Platz haben, bekommen hier ihre Chance.",
    eurKey:"innovation",
  },
  {
    pct:10, emoji:"🛡️", label:"Qualität sichern",
    color:"#7264D6",
    popover:"Finanziert die Prüfung, Begleitung und Qualitätssicherung aller eingereichten Projekte — damit nur echte Wirkung gefördert wird.",
    eurKey:"kuration",
  },
];

export function WirkungsChips({ pool }) {
  const [activeChip, setActiveChip] = React.useState(null);

  // Klick außerhalb schließt Popover
  React.useEffect(() => {
    if (activeChip === null) return;
    const close = (e) => {
      if (!e.target.closest("[data-chip-wrap]")) setActiveChip(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeChip]);

  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
      {WIRKUNGSCHIPS.map((chip, i) => {
        const eur    = pool[chip.eurKey] || 0;
        const isOpen = activeChip === i;

        return (
          <div key={i} data-chip-wrap style={{ position:"relative" }}>
            {/* Chip */}
            <button
              onClick={() => setActiveChip(isOpen ? null : i)}
              className="ip-p"
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                background: isOpen ? `${chip.color}22` : `${chip.color}12`,
                border:`1.5px solid ${chip.color}${isOpen ? "55" : "30"}`,
                borderRadius:99, padding:"6px 11px",
                cursor:"pointer",
                transition:"all 0.16s ease",
                boxShadow: isOpen ? `0 2px 12px ${chip.color}28` : "none",
                outline:"none",
              }}
              onMouseEnter={e => {
                if (!isOpen) {
                  e.currentTarget.style.background  = `${chip.color}1E`;
                  e.currentTarget.style.boxShadow   = `0 2px 10px ${chip.color}22`;
                  e.currentTarget.style.borderColor = `${chip.color}48`;
                }
              }}
              onMouseLeave={e => {
                if (!isOpen) {
                  e.currentTarget.style.background  = `${chip.color}12`;
                  e.currentTarget.style.boxShadow   = "none";
                  e.currentTarget.style.borderColor = `${chip.color}30`;
                }
              }}
              aria-expanded={isOpen}
              aria-label={`${chip.label} – ${chip.pct}%`}
            >
              <span style={{ fontSize:14, lineHeight:1 }}>{chip.emoji}</span>
              <span style={{ fontSize:11, fontWeight:700, color:chip.color,
                lineHeight:1.2 }}>
                {chip.label}
              </span>
              <span style={{
                fontSize:10, fontWeight:900, color:chip.color,
                background:`${chip.color}18`, borderRadius:99,
                padding:"1px 6px", marginLeft:1,
              }}>{chip.pct}%</span>
              {!pool.loading && eur > 0 && (
                <span style={{ fontSize:10, fontWeight:800, color:chip.color,
                  opacity:0.78 }}>{fmtEur(eur)}</span>
              )}
            </button>

            {/* Popover */}
            {isOpen && (
              <div style={{
                position:"absolute", top:"calc(100% + 8px)", left:0,
                zIndex:200, minWidth:220, maxWidth:280,
                background:"#FFFFFF",
                border:`1.5px solid ${chip.color}30`,
                borderRadius:16,
                padding:"14px 16px",
                boxShadow:`0 8px 32px rgba(0,0,0,0.10), 0 2px 8px ${chip.color}18`,
                animation:"ipFade 0.16s ease both",
              }}>
                {/* Pfeil */}
                <div style={{
                  position:"absolute", top:-7, left:18,
                  width:12, height:12, background:"#FFFFFF",
                  border:`1.5px solid ${chip.color}30`,
                  transform:"rotate(45deg)",
                  borderBottom:"none", borderRight:"none",
                  borderRadius:"2px 0 0 0",
                }}/>
                {/* Inhalt */}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{chip.emoji}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:800, color:"#141422",
                      lineHeight:1.25 }}>{chip.label}</div>
                    <div style={{ fontSize:10, fontWeight:700,
                      color:chip.color }}>{chip.pct}% des Impact Pools</div>
                  </div>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#38384F",
                  lineHeight:1.6 }}>{chip.popover}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

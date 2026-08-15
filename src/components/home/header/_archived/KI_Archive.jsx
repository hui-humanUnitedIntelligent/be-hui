// ═════════════════════════════════════════════════════════════════
// ARCHIVIERT am 2026-08-15 — Michaels Auftrag: "KI Funktion komplett raus"
// Diese Datei enthält die ursprünglichen KI-Suggestions und das KiPanel.
// Wird NICHT mehr importiert oder verwendet — rein Referenz.
// Bei späterer Reaktivierung: in SearchCommandCenter.jsx einbinden
// und die handleKiSelect-Logik wiederherstellen.
// ═════════════════════════════════════════════════════════════════

const KI_SUGGESTIONS = [
  { text:"Ich suche kreative Menschen",        emoji:"👥", action:"people"   },
  { text:"Projekte in meiner Nähe",            emoji:"📍", action:"nearby"   },
  { text:"Wer passt zu meinem Profil?",        emoji:"🔮", action:"match"    },
  { text:"Wo kann ich heute helfen?",          emoji:"🤝", action:"help"     },
  { text:"Veranstaltungen die zu mir passen",  emoji:"📅", action:"events"   },
  { text:"Welche Menschen sollte ich kennen?", emoji:"✨", action:"discover" },
];

function KiPanel({ onSelect, onClose }) {
  return (
    <div style={{
      position:"absolute", top:"calc(100% + 8px)", right:0,
      width:264, zIndex:10,
      background:"rgba(255,251,248,0.96)", backdropFilter:"blur(24px) saturate(1.5)", WebkitBackdropFilter:"blur(24px) saturate(1.5)",
      borderRadius:18, boxShadow:"0 12px 36px rgba(26,53,48,0.14), 0 2px 8px rgba(26,53,48,0.05)",
      border:"1px solid rgba(26,53,48,0.05)", overflow:"hidden",
      animation:"dc-in .2s cubic-bezier(.22,1,.36,1) both",
    }}>
      <div style={{
        padding:"13px 15px 10px",
        background:"linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.015))",
        borderBottom:"1px solid rgba(14,196,184,0.08)",
      }}>
        <div style={{ fontSize:12.5,fontWeight: 600,color:"#0EC4B8",marginBottom:2,letterSpacing:"-0.01em" }}>
          ✨ HUI KI kann dir helfen…
        </div>
        <div style={{ fontSize:10.5,color:"rgba(26,53,48,0.5)" }}>Wähle einen Vorschlag</div>
      </div>
      <div style={{ padding:"8px 8px 10px" }}>
        {KI_SUGGESTIONS.map((s,i) => (
          <button key={i} onClick={()=>{onSelect(s);onClose();}} style={{
            display:"flex",alignItems:"center",gap:9,width:"100%",
            textAlign:"left",padding:"9px 11px",background:"none",border:"none",
            borderRadius:12,cursor:"pointer",WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.07)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}
          >
            <span style={{fontSize:14,flexShrink:0}}>{s.emoji}</span>
            <span style={{fontSize:12.5,fontWeight:500,color:"#1A3530",letterSpacing:"-0.01em"}}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// handleKiSelect-Logik (archiviert):
// function handleKiSelect(item) {
//   const text = typeof item === "string" ? item : item.text;
//   const action = typeof item === "string" ? null : item.action;
//   setShowKi(false);
//   switch (action) {
//     case "people": setQuery(""); setTypeFilter(null); setActiveCategories([]); setKiMode("people"); break;
//     case "nearby": setQuery(""); setTypeFilter("work"); setActiveCategories([]); setKiMode(null); ... break;
//     case "match": setQuery(""); setTypeFilter(null); setActiveCategories([]); setKiMode("match"); break;
//     case "help": setQuery(""); setTypeFilter("experience"); setActiveCategories([]); setKiMode(null); break;
//     case "events": setQuery(""); setTypeFilter("experience"); setActiveCategories([]); setKiMode(null); ... break;
//     case "discover": setQuery(""); setTypeFilter(null); setActiveCategories([]); setKiMode("discover"); break;
//     default: setQuery(text); setKiMode(null);
//   }
// }

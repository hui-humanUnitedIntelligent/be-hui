import React from "react";
import { T } from "../tokens.js";
import { HerzensKarte } from "./HerzensKarte.jsx";

export function WeitereHerzensprojekte({ data, loading }) {
  const [expanded, setExpanded] = React.useState(false);
  // Wenn DB leer → Seed-Projekte als Platzhalter zeigen
  const rawList = Array.isArray(data) ? data : [];
  const list    = rawList;
  const isSeed  = !loading && rawList.length === 0;
  const visible = expanded ? list : list.slice(0, 4);
  const hasMore = list.length > 4;
  return (
    <div style={{ marginTop:24, padding:"0 16px" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"baseline",
          justifyContent:"space-between", marginBottom:4 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:T.ink,
            letterSpacing:"-0.022em" }}>
            🌱 Weitere Herzensprojekte
          </h2>
          {!loading && list.length > 4 && !expanded && (
            <button onClick={() => setExpanded(true)} className="ip-p"
              style={{ background:"none", border:"none", padding:0, cursor:"pointer",
                fontSize:11, fontWeight:700, color:T.teal, flexShrink:0, marginLeft:8 }}>
              Alle {list.length} anzeigen →
            </button>
          )}
        </div>
        <p style={{ margin:0, fontSize:12.5, color:T.ink2, lineHeight:1.6 }}>
          {loading
            ? "Wird geladen…"
            : isSeed
              ? "Beispielprojekte — so sehen eingereichte Herzensprojekte aus."
              : `${rawList.length} Projekt${rawList.length !== 1 ? "e" : ""} — sortiert nach Community-Stimmen`
          }
        </p>
      </div>
      {loading ? <SkeletonCards count={3} /> : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {visible.map((p, i) => <HerzensKarte key={p.id||i} p={p} idx={i} />)}
          </div>
          {hasMore && (
            <button onClick={() => setExpanded(e => !e)} className="ip-p"
              style={{ width:"100%", marginTop:12, background:"none",
                border:`1px solid ${T.teal}30`, borderRadius:14, padding:"11px 0",
                fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
                transition:"all 0.18s ease",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
              onMouseEnter={e => { e.currentTarget.style.background=`${T.teal}08`; e.currentTarget.style.borderColor=`${T.teal}50`; }}
              onMouseLeave={e => { e.currentTarget.style.background="none";        e.currentTarget.style.borderColor=`${T.teal}30`; }}
            >
              {expanded
                ? <span>▲  Weniger anzeigen</span>
                : <span>▼  Alle {list.length} Projekte anzeigen</span>
              }
            </button>
          )}
          <div style={{ marginTop:12, padding:"9px 13px",
            background:`${T.teal}07`, border:`1px solid ${T.teal}14`,
            borderRadius:13, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>📨</span>
            <span style={{ fontSize:11, color:T.ink2, lineHeight:1.5 }}>
              Neue Herzensprojekte kommen jeden Monat hinzu.{" "}
              <b style={{ color:T.teal }}>Der Impact Pool lebt und wächst.</b>
            </span>
          </div>
        </>
      )}
    </div>
  );
}





// ════════════════════════════════════════════════════════════════
// EmptyImpactState — kein Dummy, kein Fallback
// Wird angezeigt wenn keine echten Projekte in Supabase existieren
// ════════════════════════════════════════════════════════════════

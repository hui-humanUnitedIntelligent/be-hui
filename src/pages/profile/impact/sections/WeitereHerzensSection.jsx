import React from "react";
import { T } from "../tokens.js";
import { ApprovedAppCardCompact } from "./ApprovedAppCardCompact.jsx";
import { EmptyImpactState } from "../components/EmptyImpactState.jsx";

export function WeitereHerzensSection({ apps, loadingApps, seedData, seedLoading, onOpen }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasReal = !loadingApps && apps && apps.length > 0;
  const rawList = hasReal ? apps : [];
  const isSeed  = false;
  const visible = expanded ? rawList : rawList.slice(0, 4);
  const hasMore = rawList.length > 4;
  const isLoading = loadingApps;
  return (
    <div style={{ marginTop:24, padding:"0 16px" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:4 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:T.ink, letterSpacing:"-0.022em", display:"flex", alignItems:"center", gap:6 }}><HUIImpactIcon size={18}/>Weitere Herzensprojekte</h2>
          {!isLoading && rawList.length > 4 && !expanded && (
            <button onClick={() => setExpanded(true)} className="ip-p"
              style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontSize:11, fontWeight:700, color:T.teal, flexShrink:0, marginLeft:8 }}>
              Alle {rawList.length} anzeigen →
            </button>
          )}
        </div>
        <p style={{ margin:0, fontSize:12.5, color:T.ink2, lineHeight:1.6 }}>
          {isLoading ? "Wird geladen…" : isSeed
            ? "Beispielprojekte — so sehen eingereichte Herzensprojekte aus."
            : `${rawList.length} Projekt${rawList.length !== 1 ? "e" : ""} — sortiert nach Community-Stimmen`}
        </p>
      </div>
      {isLoading ? <SkeletonCards count={3} /> : rawList.length === 0 ? (
        <EmptyImpactState type="weitere" />
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {visible.map((p, i) =>
              hasReal
                ? <ApprovedAppCardCompact key={p.id||i} app={p} rank={i+2} onOpen={onOpen} />
                : <HerzensKarte key={p.id||i} p={p} idx={i} />
            )}
          </div>
          {hasMore && (
            <button onClick={() => setExpanded(e => !e)} className="ip-p"
              style={{ width:"100%", marginTop:12, background:"none",
                border:`1px solid ${T.teal}30`, borderRadius:14, padding:"11px 0",
                fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {expanded ? <span>▲ Weniger</span> : <span>▼ Alle {rawList.length} Projekte</span>}
            </button>
          )}
          <div style={{ marginTop:12, padding:"9px 13px", background:`${T.teal}07`, border:`1px solid ${T.teal}14`,
            borderRadius:13, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>📨</span>
            <span style={{ fontSize:11, color:T.ink2, lineHeight:1.5 }}>
              Neue Herzensprojekte kommen jeden Monat hinzu. <b style={{ color:T.teal }}>Der Impact Pool lebt und wächst.</b>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ApprovedAppCardCompact — Kompaktkarte für "Weitere Herzensprojekte"
// ════════════════════════════════════════════════════════════════

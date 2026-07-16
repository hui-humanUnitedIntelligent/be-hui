import React from "react";
import { T } from "../tokens.js";
import { VotingCard } from "./VotingCard.jsx";
import { SkeletonCards } from "../components/SkeletonCards.jsx";

export function VotingSection({ projects, userVotes, daysLeft, totalVotes, onVote, loading, onInfoClick, onOpen }) {
  return (
    <div style={{ marginTop:24 }}>
      {/* Header */}
      <div style={{ padding:"0 16px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"baseline",
          justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
          <div>
            <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:900, color:T.ink,
              letterSpacing:"-0.022em" }}>Aktuelle Abstimmung</h2>
            {daysLeft !== null && (
              <span style={{ fontSize:12, color:T.coral, fontWeight:700 }}>
                Noch {daysLeft} Tag{daysLeft !== 1 ? "e" : ""} — stimme jetzt ab
              </span>
            )}
          </div>
          <button onClick={onInfoClick} className="ip-p" style={{
            background:"none",
            border:`1px solid ${T.teal}38`,
            borderRadius:99,
            padding:"7px 15px",
            fontSize:11, fontWeight:700, color:T.teal, cursor:"pointer",
            transition:"all 0.18s ease",
            boxShadow:`0 0 0 0 ${T.teal}00`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${T.teal}10`;
            e.currentTarget.style.boxShadow  = `0 0 12px ${T.teal}28`;
            e.currentTarget.style.border     = `1px solid ${T.teal}60`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.boxShadow  = `0 0 0 0 ${T.teal}00`;
            e.currentTarget.style.border     = `1px solid ${T.teal}38`;
          }}
          >💚 Kein Projekt geht leer aus</button>
        </div>
      </div>

      {/* Karten — vertical stack, fullwidth */}
      {loading ? (
        <div style={{ padding:"0 16px" }}><SkeletonCards count={3}/></div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16, padding:"0 16px" }}>
          {projects.map((p, i) => (
            <VotingCard key={p.id} project={p} rank={i}
              voted={userVotes.some(v => v.project_id === p.id)}
              totalVotes={totalVotes} onVote={onVote} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

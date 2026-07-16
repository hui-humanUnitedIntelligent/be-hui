import React from "react";
import { T, S } from "../tokens.js";
import { safeNum } from "../utils.js";
import { HUIStimmeIcon } from "../../../../design/icons/HuiSystemIcons.jsx";

export function VotePersonal({ usedVotes, maxVotes, remainVotes, isMem, userVotes, projects }) {
  const projMap = Object.fromEntries(projects.map(p => [p.id, p]));

  return (
    <div style={{ padding:"16px 16px 0" }}>
      <div style={{
        background:T.surfaceHi, borderRadius:24, padding:"22px 20px",
        boxShadow:S.card, border:`1px solid ${T.line}`,
      }}>
        {/* Emotionaler Titel */}
        <h3 style={{ margin:"0 0 6px", fontSize:17, fontWeight:900, color:T.ink,
          letterSpacing:"-0.018em" }}>Deine Stimme zählt.</h3>
        <p style={{ margin:"0 0 18px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
          {remainVotes > 0
            ? <>Du kannst diesen Monat noch{" "}
                <b style={{ color:T.teal }}>{remainVotes} Projekt{remainVotes > 1 ? "e" : ""}</b> unterstützen.</>
            : <>Du hast diesen Monat alle deine Stimmen eingesetzt.{" "}
                <b style={{ color:T.ink }}>Nächsten Monat gibt es neue.</b></>
          }
        </p>

        {/* Dots */}
        <div style={{ display:"flex", gap:12, marginBottom:16 }}>
          {Array.from({ length:maxVotes }).map((_,i) => {
            const isUsed = i < usedVotes;
            const vote   = userVotes[i];
            const proj   = vote ? projMap[vote.project_id] : null;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%", flexShrink:0,
                  background: isUsed
                    ? `linear-gradient(135deg,${T.teal},${T.tealL})`
                    : "rgba(0,0,0,0.065)",
                  border: isUsed ? "none" : `2px dashed rgba(0,0,0,0.14)`,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:17,
                  boxShadow: isUsed ? S.btn(T.teal) : "none",
                }}>
                  {isUsed ? "🩷" : ""}
                </div>
                <div style={{ fontSize:12, color: isUsed ? T.ink : T.muted }}>
                  {isUsed ? (
                    proj ? (
                      <><b>{proj.name}</b><div style={{ fontSize:10,color:T.muted }}>Stimme vergeben</div></>
                    ) : (
                      <><b style={{ color:T.ink }}>Stimme vergeben</b><div style={{ fontSize:10,color:T.muted }}>Projekt geladen…</div></>
                    )
                  ) : (
                    <span style={{ color:T.muted }}>Noch verfügbar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mitglied-Hinweis */}
        {isMem ? (
          <div style={{ fontSize:11, color:T.teal, fontWeight:700 }}>
            🏅 Als Mitglied oder Talent hast du 2 Stimmen pro Monat
          </div>
        ) : (
          <div style={{ padding:"12px 14px",
            background:`${T.gold}10`, border:`1px solid ${T.gold}25`,
            borderRadius:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.gold, marginBottom:3 }}>
              ⭐ Mit Mitgliedschaft auf 2 Stimmen
            </div>
            <div style={{ fontSize:11, color:T.ink2 }}>
              Mitglieder und Talente können doppelt so viel bewirken.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. GEMEINSAM ERMÖGLICHT (finanzierte Projekte + Zahlen)


// ════════════════════════════════════════════════════════════════
// 4b. WEITERE HERZENSPROJEKTE

// SEED_WEITERE_PROJEKTE deaktiviert — nur echte Projekte aus impact_applications

// src/components/discovery/PeopleSearch.jsx
// Phase 3A: Menschen finden in HUI
// Warm, editorial, menschlich — kein LinkedIn-Directory

import React, { useEffect, useRef, useState } from "react";
import { HUI }            from "../../design/hui.design.js";
import { useUserSearch, loadFeaturedCreators }
                           from "../../features/discovery/userSearch.js";
import { useFollowStatus } from "../../lib/AppStateContext.jsx";

const C  = HUI.COLOR;

function PresenceDot({ available }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: available ? C.teal : "rgba(150,150,150,0.30)",
      boxShadow:  available ? `0 0 0 2px rgba(22,215,197,0.20)` : "none",
    }}/>
  );
}

function PersonCard({ person, onOpenProfile, onOpenChat }) {
  const [pressed, setPressed] = useState(false);
  const followStatus = useFollowStatus(person.id);
  const initials = (person.display_name || "?")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onOpenProfile?.(person._raw || person); }}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 20px",
        background: pressed ? "rgba(22,215,197,0.04)" : "rgba(255,255,255,0.70)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "background 0.18s ease",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        {person.avatar_url ? (
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: `url(${person.avatar_url}) center/cover no-repeat`,
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          }}/>
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: `linear-gradient(135deg,${C.teal}55,${C.coral}44)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "white",
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          }}>{initials}</div>
        )}
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          border: "1.5px solid rgba(255,255,255,0.9)",
          borderRadius: "50%",
        }}>
          <PresenceDot available={person.is_available}/>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 15, fontWeight: 700, color: C.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{person.display_name}</span>
          {person.is_wirker && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.teal,
              background: "rgba(22,215,197,0.10)", borderRadius: 6,
              padding: "1px 5px", flexShrink: 0, letterSpacing: 0.3,
            }}>WIRKER</span>
          )}
          {followStatus?.isFollowing && (
            <span style={{ fontSize: 10, color: "rgba(80,80,80,0.40)", flexShrink: 0 }}>
              · folgst du
            </span>
          )}
        </div>
        {person.talent && (
          <div style={{ fontSize: 12.5, color: C.teal, fontWeight: 600, marginBottom: 2 }}>
            {person.talent}
          </div>
        )}
        {(person.bio || person.location) && (
          <div style={{
            fontSize: 12, color: "rgba(80,80,80,0.52)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {person.bio || (person.location ? `📍 ${person.location}` : "")}
          </div>
        )}
      </div>

      <button
        onPointerDown={e => e.stopPropagation()}
        onPointerUp={e => { e.stopPropagation(); onOpenChat?.(person._raw || person); }}
        style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg,${C.teal},${C.tealDeep||C.teal})`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 10px rgba(22,215,197,0.22)",
          WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function Skeletons() {
  return (
    <>
      {[0,1,2].map(i => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(0,0,0,0.06)",
            animation: "hui-pulse 1.4s ease-in-out infinite",
          }}/>
          <div style={{ flex: 1 }}>
            <div style={{
              height: 14, borderRadius: 7, width: "55%",
              background: "rgba(0,0,0,0.06)", marginBottom: 7,
              animation: "hui-pulse 1.4s ease-in-out infinite",
            }}/>
            <div style={{
              height: 11, borderRadius: 6, width: "35%",
              background: "rgba(0,0,0,0.04)",
              animation: "hui-pulse 1.4s ease-in-out infinite",
            }}/>
          </div>
        </div>
      ))}
    </>
  );
}

export default function PeopleSearch({ onClose, onOpenProfile, onOpenChat }) {
  const { query, setQuery, results, loading } = useUserSearch();
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    loadFeaturedCreators({ limit: 10 }).then(data => {
      setFeatured(data);
      setFeaturedLoading(false);
    });
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const showResults  = query.trim().length >= 2;
  const displayList  = showResults ? results : featured;
  const isLoading    = showResults ? loading : featuredLoading;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10002,
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      background: "rgba(242,244,248,0.97)",
      backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
      animation: "ps-in 0.20s ease both",
    }}>
      <style>{`
        @keyframes ps-in { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes hui-pulse { 0%,100%{opacity:1;}50%{opacity:0.45;} }
        .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;}
        .hui-scroll::-webkit-scrollbar{display:none;}
      `}</style>

      <div style={{
        padding: "max(52px,env(safe-area-inset-top,52px)) 20px 0",
        background: "rgba(242,244,248,0.92)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(22,215,197,0.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={onClose} style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(22,215,197,0.09)",
            border: "1.5px solid rgba(22,215,197,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.teal, fontSize: 18,
            WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, letterSpacing: -0.4 }}>
              Menschen finden
            </div>
            <div style={{ fontSize: 12, color: "rgba(80,80,80,0.45)", marginTop: 1 }}>
              {showResults
                ? `${results.length} Ergebnis${results.length !== 1 ? "se" : ""}`
                : "Wirker, Creator, Gestalter"}
            </div>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.82)",
          border: "1.5px solid rgba(22,215,197,0.22)",
          borderRadius: 16, padding: "10px 16px", marginBottom: 14,
          boxShadow: "0 0 0 3px rgba(22,215,197,0.07)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="rgba(22,215,197,0.60)" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="rgba(22,215,197,0.60)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Name, Talent, Ort…"
            style={{
              flex: 1, border: "none", background: "none", outline: "none",
              fontSize: 15, color: C.ink, fontFamily: "inherit",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(80,80,80,0.40)", fontSize: 20, lineHeight: 1, padding: 0,
            }}>×</button>
          )}
        </div>

        {!showResults && (
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
            color: "rgba(80,80,80,0.35)", textTransform: "uppercase",
            marginBottom: 10,
          }}>Aktive Creator</div>
        )}
      </div>

      <div className="hui-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {isLoading && <Skeletons/>}

        {!isLoading && displayList.length === 0 && showResults && (
          <div style={{
            padding: "48px 32px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 12, color: "rgba(80,80,80,0.35)",
          }}>
            <div style={{ fontSize: 32 }}>✦</div>
            <div style={{ fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>
              Niemand gefunden.<br/>
              <span style={{ fontSize: 12, color: "rgba(80,80,80,0.28)" }}>
                Versuch ein Talent oder einen Ort.
              </span>
            </div>
          </div>
        )}

        {!isLoading && displayList.map(person => (
          <PersonCard
            key={person.id}
            person={person}
            onOpenProfile={p => {
              console.log("[HUI_DISCOVERY] user search result opened:", p?.display_name);
              onOpenProfile?.(p);
            }}
            onOpenChat={p => {
              console.log("[HUI_DISCOVERY] direct message from search:", p?.display_name);
              onOpenChat?.(p);
            }}
          />
        ))}

        <div style={{ height: "max(40px,env(safe-area-inset-bottom,40px))" }}/>
      </div>
    </div>
  );
}

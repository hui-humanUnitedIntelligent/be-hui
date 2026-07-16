import React from "react";
import { T } from "../tokens.js";

export function InfoSheet({ modal, onClose }) {
  // Escape schließt
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Body-Scroll sperren
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Sektion-Renderer für "leeraus"-Modal
  const Section = ({ icon, title, children }) => (
    <div style={{
      background:`${T.teal}06`, border:`1px solid ${T.teal}15`,
      borderRadius:16, padding:"16px 16px", marginBottom:12,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <span style={{ fontSize:14, fontWeight:800, color:T.ink,
          letterSpacing:"-0.015em" }}>{title}</span>
      </div>
      <div style={{ fontSize:13, color:T.ink2, lineHeight:1.7 }}>{children}</div>
    </div>
  );

  // Bullet-Liste
  const Bullets = ({ items }) => (
    <ul style={{ margin:"8px 0 0", padding:"0 0 0 4px", listStyle:"none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:8,
          marginBottom:4, fontSize:13, color:T.ink2 }}>
          <span style={{ color:T.teal, fontWeight:700, flexShrink:0 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  const CONTENT = {
    // ── Neues Haupt-Modal ────────────────────────────────────────
    leeraus: {
      title: "❤️ Warum geht kein Projekt leer aus?",
      subtitle: "Die Community entscheidet nur, welches Projekt zuerst verwirklicht wird. Nicht welches gewinnt und welches verliert.",
      body: (
        <>
          {/* Haupttext */}
          {[
            "Bei HUI gewinnt zwar jeden Monat ein Projekt die Abstimmung und erhält seine komplette Wunschsumme.",
            "Die übrigen Projekte gehen jedoch nicht leer aus.",
            "Der verbleibende Community-Anteil des Impact Pools wird auf alle anderen zugelassenen Projekte verteilt.",
            "Dadurch wächst jedes Projekt Monat für Monat weiter.",
            "So entsteht kein Alles-oder-Nichts-System.",
          ].map((text, i) => (
            <p key={i} style={{
              margin:"0 0 12px", fontSize:14, color:T.ink2, lineHeight:1.72,
            }}>{text}</p>
          ))}

          {/* Kernaussagen */}
          <div style={{
            background:`${T.teal}08`, border:`1px solid ${T.teal}20`,
            borderRadius:16, padding:"16px 18px", marginBottom:16,
          }}>
            {[
              { icon:"🩷", text:"Jede Stimme erzeugt Wirkung." },
              { icon:"📦", text:"Jedes Projekt erhält Unterstützung." },
              { icon:"🎯", text:"Früher oder später erreicht jedes Projekt sein Ziel." },
            ].map((item, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"9px 0",
                borderBottom: i < 2 ? `1px solid ${T.teal}14` : "none",
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:14, fontWeight:700, color:T.ink, lineHeight:1.4 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Abschluss */}
          <div style={{
            background:`linear-gradient(135deg,${T.teal}15,${T.teal}05)`,
            border:`1.5px solid ${T.teal}30`,
            borderRadius:18, padding:"18px 20px", textAlign:"center",
          }}>
            <div style={{ fontSize:24, marginBottom:8 }}>💚</div>
            <p style={{ margin:"0 0 4px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
              Deshalb gilt bei HUI:
            </p>
            <div style={{
              fontSize:17, fontWeight:900, color:T.teal,
              letterSpacing:"-0.018em", lineHeight:1.3,
            }}>
              "Kein Projekt geht leer aus."
            </div>
          </div>
        </>
      ),
    },

    // ── Zyklus-Modal (unverändert) ───────────────────────────────
    cycle: {
      title: "So funktioniert der Impact Pool",
      subtitle: "Transparent, fair, jeden Monat neu.",
      body: (
        <>
          <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14, margin:"0 0 12px" }}>
            Jede Buchung auf HUI erzeugt eine Provision.{" "}
            <b>6% des Umsatzes</b> fließen direkt in den Impact Pool — automatisch, jeden Monat.
          </p>
          <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14, margin:"0 0 12px" }}>
            Das HUI-Team prüft Bewerbungen, nominiert drei Projekte und die Community stimmt ab.
          </p>
          <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14, margin:0 }}>
            Das Siegerprojekt erhält seine volle Wunschsumme. Der Restbetrag wird automatisch
            auf alle anderen verteilt.{" "}
            <b style={{ color:T.teal }}>Kein Projekt geht leer aus.</b>
          </p>
        </>
      ),
    },

    // ── Vote-Modal (Fallback, bleibt erhalten) ───────────────────
    vote: {
      title: "So funktioniert die Abstimmung",
      subtitle: null,
      body: (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { icon:"👤", text:"Normale Nutzer: 1 Stimme pro Monat" },
              { icon:"🏅", text:"Mitglieder & Talente: 2 Stimmen pro Monat" },
              { icon:"📅", text:"Stimmen verfallen am Monatsende — sie addieren sich nicht" },
              { icon:"🏆", text:"Projekt mit den meisten Stimmen erhält die volle Wunschsumme" },
              { icon:"🌱", text:"Restbetrag geht fair an alle anderen Projekte" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:14, color:T.ink2, lineHeight:1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
  };

  const c = CONTENT[modal] || CONTENT.cycle;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={c.title}
      style={{
        position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
        background:"rgba(14,14,24,0.52)",
        backdropFilter:"blur(8px)",
        WebkitBackdropFilter:"blur(8px)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        padding:"16px",
        animation:"ipFadeIn 0.18s ease both",
      }}
      onClick={onClose}
    >
      {/* Modal-Container — zentriert, max-width 640px */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"90%",
          maxWidth:640,
          background:T.surfaceHi,
          borderRadius:24,
          boxShadow:"0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
          maxHeight:"88vh",
          display:"flex",
          flexDirection:"column",
          overflow:"hidden",
          animation:"ipModalIn 0.24s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Sticky Header */}
        <div style={{
          padding:"20px 22px 16px",
          borderBottom:`1px solid ${T.line}`,
          background:T.surfaceHi,
          flexShrink:0,
          position:"relative",
        }}>
          {/* Close-X */}
          <button
            onClick={onClose}
            className="ip-p"
            aria-label="Schließen"
            style={{
              position:"absolute", top:16, right:16,
              width:32, height:32, borderRadius:"50%",
              background:"rgba(0,0,0,0.06)",
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, color:T.muted,
              transition:"background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.06)"}
          >✕</button>

          <h3 style={{
            margin:"0 40px 0 0",
            fontSize:18, fontWeight:900,
            color:T.ink, letterSpacing:"-0.022em", lineHeight:1.25,
          }}>
            {c.title}
          </h3>
          {c.subtitle && (
            <p style={{ margin:"6px 0 0", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
              {c.subtitle}
            </p>
          )}
        </div>

        {/* Scrollbarer Body */}
        <div style={{
          flex:1,
          overflowY:"auto",
          padding:"20px 22px",
          WebkitOverflowScrolling:"touch",
        }}>
          {c.body}
        </div>

        {/* Sticky Footer Buttons */}
        <div style={{
          padding:"14px 22px 20px",
          borderTop:`1px solid ${T.line}`,
          background:T.surfaceHi,
          flexShrink:0,
          display:"flex", gap:10,
        }}>
          {/* Primär: Verstanden */}
          <button onClick={onClose} className="ip-p" style={{
            flex:1,
            background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
            border:"none", borderRadius:16, padding:"13px 0",
            color:"white", fontSize:14, fontWeight:750,
            cursor:"pointer",
            boxShadow:`0 4px 16px ${T.teal}38`,
            transition:"opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Verstanden ✓</button>

          {/* Sekundär: Impact Pool entdecken (scrollt nach oben) */}
          {modal === "leeraus" && (
            <button onClick={onClose} className="ip-p" style={{
              flex:1,
              background:"none",
              border:`1.5px solid ${T.teal}38`,
              borderRadius:16, padding:"13px 0",
              color:T.teal, fontSize:14, fontWeight:700,
              cursor:"pointer",
              transition:"all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${T.teal}10`;
              e.currentTarget.style.borderColor = `${T.teal}60`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.borderColor = `${T.teal}38`;
            }}
            >Impact Pool entdecken</button>
          )}
        </div>
      </div>
    </div>
  );
}

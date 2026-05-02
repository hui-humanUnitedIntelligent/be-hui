import React, { useState } from "react";
import { ArrowLeft, X } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

export default function ImpactTrackerPage({ onClose }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [showWrapped, setShowWrapped] = React.useState(false);
  const [wrappedSlide, setWrappedSlide] = React.useState(0);
  const [counterDone, setCounterDone] = React.useState(false);

  const TARGET = 47.25;

  React.useEffect(() => {
    let start = null;
    const duration = 2200;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(parseFloat((TARGET * eased).toFixed(2)));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(TARGET);
        setCounterDone(true);
      }
    };
    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const stats = {
    total: 47.25, diesesJahr: 34.50, dieserMonat: 8.25,
    buchungen: 12, kaeufe: 7, lieblingsKategorie: "Kinder & Bildung",
    unterstuetzteProjekte: 3, baeumePflanzung: 4, co2: "18 kg",
    kinderUnterstuetzt: 2, streak: 5,
  };

  const verlauf = [
    { monat: "Nov", wert: 2.10 }, { monat: "Dez", wert: 5.40 },
    { monat: "Jan", wert: 3.20 }, { monat: "Feb", wert: 6.75 },
    { monat: "Mär", wert: 9.30 }, { monat: "Apr", wert: 8.25 },
  ];
  const maxVerlauf = Math.max(...verlauf.map(v => v.wert));

  const projekte = [
    { name: "Schule für alle", land: "Uganda", beitrag: "18,75 €", emoji: "🏫", color: TEAL },
    { name: "Bäume für Kenia", land: "Kenia", beitrag: "15,00 €", emoji: "🌳", color: "#16a34a" },
    { name: "Tierheim Hamburg", land: "Deutschland", beitrag: "13,50 €", emoji: "🐾", color: GOLD },
  ];

  const wrappedSlides = [
    { bg: `linear-gradient(160deg, ${TEAL}, #0d9488)`, emoji: "🌍", headline: "Dein Impact 2026", sub: "Du hast etwas bewegt.", value: `${stats.total} €`, desc: "So viel ist durch deine Buchungen in echte Projekte geflossen." },
    { bg: `linear-gradient(160deg, #7c3aed, #a855f7)`, emoji: "🔥", headline: `${stats.streak} Monate`, sub: "am Stück mit Impact.", value: `${stats.streak}`, unit: "Monate in Folge", desc: "Du bist seit 5 Monaten dabei — jede Buchung zählt." },
    { bg: `linear-gradient(160deg, ${CORAL}, #f97316)`, emoji: "❤️", headline: "Lieblingsthema", sub: "Wo dein Herz schlägt.", value: "Kinder & Bildung", desc: "Die meisten deiner Buchungen unterstützten Bildungsprojekte." },
    { bg: `linear-gradient(160deg, #16a34a, #4ade80)`, emoji: "🌳", headline: `${stats.baeumePflanzung} Bäume`, sub: "durch dich gepflanzt.", value: `${stats.baeumePflanzung}`, unit: "Bäume in Kenia", desc: "Dein Beitrag hat direkt zur Aufforstung beigetragen." },
    { bg: `linear-gradient(160deg, ${GOLD}, #f59e0b)`, emoji: "⭐", headline: "Danke, Lars!", sub: "Du bist ein HUI-Botschafter.", value: "Top 12%", desc: "Du gehörst zu den aktivsten Impact-Nutzern auf HUI." },
  ];

  if (showWrapped) {
    const slide = wrappedSlides[wrappedSlide];
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: slide.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}
        onClick={() => { if (wrappedSlide < wrappedSlides.length - 1) setWrappedSlide(s => s + 1); else { setShowWrapped(false); setWrappedSlide(0); } }}>
        <div style={{ position: "absolute", top: 24, left: 0, right: 0, display: "flex", gap: 6, justifyContent: "center" }}>
          {wrappedSlides.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 99, background: i <= wrappedSlide ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", flex: i === wrappedSlide ? 2 : 1, transition: "flex 0.3s" }} />
          ))}
        </div>
        <button onClick={e => { e.stopPropagation(); setShowWrapped(false); setWrappedSlide(0); }}
          style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="white" />
        </button>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 80, marginBottom: 20, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.2))" }}>{slide.emoji}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>{slide.sub}</div>
          <div style={{ fontSize: slide.value.length > 6 ? 32 : 56, fontWeight: 900, color: "white", lineHeight: 1.1, marginBottom: 12, textShadow: "0 2px 20px rgba(0,0,0,0.2)" }}>
            {slide.value}
            {slide.unit && <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.8, marginTop: 4 }}>{slide.unit}</div>}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 32 }}>{slide.desc}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            {wrappedSlide < wrappedSlides.length - 1 ? "Tippen um weiterzugehen →" : "Tippen zum Schließen ✓"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "#fafaf8", display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(160deg, ${TEAL}22, transparent)`, padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={22} color="#444" />
          </button>
          <div style={{ fontWeight: 900, fontSize: 20, color: "#222" }}>Mein Impact</div>
        </div>
        <div style={{ textAlign: "center", paddingBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🌍 Du hast bisher bewegt</div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: TEAL, lineHeight: 1, letterSpacing: -2 }}>{displayValue.toFixed(2)} €</div>
            {counterDone && <div style={{ position: "absolute", top: -8, right: -28, fontSize: 22 }}>✨</div>}
          </div>
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>durch deine Buchungen & Käufe</div>
          {counterDone && (
            <button onClick={() => setShowWrapped(true)}
              style={{ marginTop: 14, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, border: "none", borderRadius: 20, padding: "9px 20px", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${TEAL}44`, display: "inline-flex", alignItems: "center", gap: 7 }}>
              🎬 Dein Impact Rückblick 2026
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { val: `${stats.diesesJahr} €`, label: "Dieses Jahr", color: TEAL, emoji: "📅" },
            { val: `${stats.dieserMonat} €`, label: "Dieser Monat", color: GOLD, emoji: "🗓" },
            { val: `${stats.unterstuetzteProjekte}`, label: "Projekte", color: CORAL, emoji: "🎯" },
          ].map(({ val, label, color, emoji }) => (
            <div key={label} style={{ flex: 1, background: "white", borderRadius: 16, padding: "14px 8px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 16, color }}>{val}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>📈 Verlauf</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>letzte 6 Monate</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
            {verlauf.map(({ monat, wert }) => (
              <div key={monat} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: TEAL }}>{wert} €</div>
                <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: monat === "Apr" ? `linear-gradient(180deg, ${TEAL}, ${GOLD})` : `${TEAL}30`, height: `${(wert / maxVerlauf) * 58}px`, minHeight: 4 }} />
                <div style={{ fontSize: 10, color: monat === "Apr" ? TEAL : "#bbb", fontWeight: monat === "Apr" ? 800 : 400 }}>{monat}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#222", marginBottom: 14 }}>🌱 Deine Projekte</div>
          {projekte.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < projekte.length - 1 ? "1px solid #f5f5f3" : "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: p.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>📍 {p.land}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: p.color }}>{p.beitrag}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { emoji: "🔥", val: stats.streak, label: "Monate Streak", color: "#7c3aed", bg: `linear-gradient(135deg, #7c3aed18, #a855f710)`, border: "1px solid #a855f730" },
            { emoji: "🌳", val: stats.baeumePflanzung, label: "Bäume gepflanzt", color: "#16a34a", bg: `linear-gradient(135deg, #16a34a18, #4ade8010)`, border: "1px solid #16a34a30" },
            { emoji: "🏫", val: stats.kinderUnterstuetzt, label: "Kinder gefördert", color: CORAL, bg: `linear-gradient(135deg, ${CORAL}18, ${GOLD}10)`, border: `1px solid ${CORAL}30` },
          ].map(({ emoji, val, label, color, bg, border }) => (
            <div key={label} style={{ flex: 1, background: bg, border, borderRadius: 16, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 22, color }}>{val}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`, borderRadius: 18, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 4px 20px rgba(245,166,35,0.3)" }}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: "white", marginBottom: 3 }}>HUI Impact Champion</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>Du gehörst zu den aktivsten Impact-Nutzern — Top 12% der Community!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
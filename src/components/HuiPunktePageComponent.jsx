import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

const huiPunkteVerlauf = [
  { id: 1, type: "gewonnen", icon: "📅", label: "Buchung abgeschlossen", sub: "Yoga-Workshop mit Maria L.", punkte: +50, datum: "Heute" },
  { id: 2, type: "gewonnen", icon: "👍", label: "Empfehlung abgegeben", sub: "Nach Keramik-Bestellung", punkte: +20, datum: "Gestern" },
  { id: 3, type: "eingeloest", icon: "🎁", label: "Eingelöst", sub: "5 € Rabatt auf Buchung", punkte: -100, datum: "vor 3 Tagen" },
  { id: 4, type: "gewonnen", icon: "🌱", label: "Impact-Projekt unterstützt", sub: "Stadtgarten München", punkte: +30, datum: "vor 4 Tagen" },
  { id: 5, type: "gewonnen", icon: "✨", label: "Profil vervollständigt", sub: "100% Profil-Completion", punkte: +100, datum: "vor 1 Woche" },
  { id: 6, type: "gewonnen", icon: "👥", label: "Freund eingeladen", sub: "Max M. hat sich registriert", punkte: +75, datum: "vor 2 Wochen" },
  { id: 7, type: "gewonnen", icon: "🛒", label: "Erstes Werk gekauft", sub: "Aquarell-Bild von Lena K.", punkte: +25, datum: "vor 2 Wochen" },
];

const huiPraemien = [
  { icon: "💸", label: "5 € Rabatt", sub: "Auf nächste Buchung oder Kauf", kosten: 100, verfuegbar: true },
  { icon: "💸", label: "10 € Rabatt", sub: "Auf nächste Buchung oder Kauf", kosten: 200, verfuegbar: true },
  { icon: "🎟", label: "Gratis Buchung", sub: "Bis 30 € — einmalig einlösbar", kosten: 600, verfuegbar: false },
  { icon: "⭐", label: "Wirker-Boost", sub: "Dein Profil 7 Tage ganz oben", kosten: 400, verfuegbar: false },
  { icon: "🌱", label: "Impact-Spende", sub: "50 Punkte → 2,50 € in Impact Pool", kosten: 50, verfuegbar: true },
];

export default function HuiPunktePage({ onClose }) {
  const totalPunkte = 250;
  const naechsteStufe = 500;
  const progress = totalPunkte / naechsteStufe;
  const [activeTab, setActiveTab] = React.useState("verlauf");
  const [eingeloest, setEingeloest] = React.useState(null);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#fafaf8", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`, padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 10, cursor: "pointer", padding: "6px 8px", display: "flex" }}>
            <ArrowLeft size={20} color="white" />
          </button>
          <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>Meine HUI-Punkte</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "20px", marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Dein Guthaben</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: "white", lineHeight: 1 }}>250</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>HUI-Punkte = 12,50 € Wert</div>
            </div>
            <div style={{ fontSize: 48 }}>⭐</div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>Noch 250 Punkte bis Stufe Gold 🥇</div>
          <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: "white", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>0</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>500 (Gold)</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 14 }}>
          {[["verlauf","📋 Verlauf"],["einloesen","🎁 Einlösen"],["sammeln","➕ Sammeln"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, background: "none", border: "none", borderBottom: activeTab === id ? "2.5px solid white" : "2.5px solid transparent", padding: "10px 4px", fontWeight: activeTab === id ? 800 : 500, fontSize: 13, color: activeTab === id ? "white" : "rgba(255,255,255,0.6)", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {activeTab === "verlauf" && (
          <div>
            {huiPunkteVerlauf.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 13, background: "white", borderRadius: 14, padding: "13px 16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: e.type === "gewonnen" ? `${TEAL}15` : `${CORAL}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{e.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>{e.label}</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{e.sub}</div>
                  <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{e.datum}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: e.type === "gewonnen" ? TEAL : CORAL }}>{e.punkte > 0 ? `+${e.punkte}` : e.punkte}</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "einloesen" && (
          <div>
            <div style={{ background: `${GOLD}15`, borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <div style={{ fontSize: 13, color: "#666" }}>Du hast <strong style={{ color: GOLD }}>250 Punkte</strong> — wähle eine Prämie:</div>
            </div>
            {huiPraemien.map((p, i) => {
              const kannEinloesen = totalPunkte >= p.kosten;
              const istEingeloest = eingeloest === i;
              return (
                <div key={i} style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", opacity: kannEinloesen ? 1 : 0.5, border: istEingeloest ? `2px solid ${TEAL}` : "1.5px solid #f0f0f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 28 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>{p.sub}</div>
                    </div>
                    <div style={{ background: `${GOLD}18`, borderRadius: 99, padding: "4px 10px", fontWeight: 800, fontSize: 12, color: GOLD }}>{p.kosten} Pkt.</div>
                  </div>
                  {istEingeloest ? (
                    <div style={{ background: `${TEAL}12`, borderRadius: 10, padding: "10px", textAlign: "center", fontSize: 13, fontWeight: 700, color: TEAL }}>✅ Eingelöst!</div>
                  ) : (
                    <button onClick={() => kannEinloesen && setEingeloest(i)} disabled={!kannEinloesen} style={{ width: "100%", background: kannEinloesen ? `linear-gradient(135deg, ${GOLD}, #f59e0b)` : "#e8e8e8", border: "none", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 14, color: kannEinloesen ? "white" : "#bbb", cursor: kannEinloesen ? "pointer" : "not-allowed" }}>
                      {kannEinloesen ? "Jetzt einlösen" : `Noch ${p.kosten - totalPunkte} Punkte fehlen`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {activeTab === "sammeln" && (
          <div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.6 }}>So verdienst du HUI-Punkte:</div>
            {[
              { icon: "📅", label: "Buchung abschließen", punkte: "+50 Pkt.", sub: "Pro abgeschlossener Buchung", done: true },
              { icon: "👍", label: "Empfehlung abgeben", punkte: "+20 Pkt.", sub: "Nach verifiziertem Kauf", done: true },
              { icon: "🛒", label: "Werk kaufen", punkte: "+25 Pkt.", sub: "Pro Kauf eines Werkes", done: false },
              { icon: "🌱", label: "Impact-Projekt unterstützen", punkte: "+30 Pkt.", sub: "Bei Teilnahme oder Spende", done: false },
              { icon: "👥", label: "Freund einladen", punkte: "+75 Pkt.", sub: "Pro registriertem Freund", done: false },
              { icon: "✨", label: "Profil vervollständigen", punkte: "+100 Pkt.", sub: "Einmalig bei 100% Completion", done: true },
              { icon: "📸", label: "Story posten", punkte: "+10 Pkt.", sub: "Maximal 1x pro Tag", done: false },
              { icon: "💬", label: "Kommentieren", punkte: "+5 Pkt.", sub: "Maximal 3x pro Tag", done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: "white", borderRadius: 14, padding: "13px 16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", opacity: item.done ? 0.6 : 1 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: item.done ? "#f0f0ee" : `${GOLD}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{item.done ? "✅" : item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: item.done ? "#aaa" : "#222", textDecoration: item.done ? "line-through" : "none" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{item.sub}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: item.done ? "#ccc" : GOLD }}>{item.punkte}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
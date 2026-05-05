import React, { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

function ImpactPage() {
  const [activeTab, setActiveTab] = useState("abstimmung"); // "abstimmung" | "projekte" | "bewerben"
  const [votedFor, setVotedFor] = useState(() => localStorage.getItem("hui_vote_" + new Date().getMonth()) || null);
  const [showVoteConfirm, setShowVoteConfirm] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showErgebnis, setShowErgebnis] = useState(false);
  const [bewerbungSent, setBewerbungSent] = useState(false);
  const [bewerbung, setBewerbung] = useState({ name: "", org: "", desc: "", betrag: "", email: "" });
  const [bewerbungFoto, setBewerbungFoto] = useState(null); // { file, preview }
  const [showSpenden, setShowSpenden] = useState(null); // project
  const [showStory, setShowStory] = useState(null); // project
  const [spendenBetrag, setSpendenBetrag] = useState(""); 
  const [spendenSent, setSpendenSent] = useState(false);

  // ── Pool & Timing ──────────────────────────────────────────────
  const poolGesamt = 3847;
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));
  const currentMonth = today.toLocaleString("de-DE", { month: "long", year: "numeric" });

  // ── Die 3 nominierten Projekte für diese Abstimmung ───────────
  const nominiert = [
    {
      id: "p1", emoji: "🏫", title: "Schule für alle",
      org: "Bildung Grenzenlos gGmbH", kategorie: "Kinder & Bildung", land: "Uganda",
      desc: "Bildung für 200 Kinder in ländlichen Gebieten – Schulbau, Materialien und Lehrergehälter.",
      img: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=400&fit=crop",
      wunschbetrag: 3500, gesammelt: 2100, stimmen: 847,
      warum: "Der Schulbau steht kurz vor dem Abschluss — mit diesem Monat könnte er fertiggestellt werden.",
      story: "In einem kleinen Dorf im Norden Ugandas lernen 200 Kinder unter freiem Himmel — weil es kein Schulgebäude gibt. Bei Regen fällt der Unterricht aus. Bei großer Hitze auch. Bildung Grenzenlos hat die Gemeinde 2023 kennengelernt und beschlossen: Das muss sich ändern.  Mit eurem Support bauen wir ein echtes Schulgebäude mit 4 Klassenräumen, Büchern und ausgebildeten Lehrern für zwei Jahre. Der Bau hat schon begonnen — uns fehlt nur noch der letzte Schritt bis zur Fertigstellung.  Jedes Kind das hier lernt, trägt den Gedanken weiter: Bildung verändert Leben. Und HUI macht es möglich.",
    },
    {
      id: "p2", emoji: "🌳", title: "Bäume für Kenia",
      org: "Green Earth Kenya e.V.", kategorie: "Natur & Umwelt", land: "Kenia",
      desc: "10.000 Bäume in trockenen Regionen — Aufforstung, Lebensgrundlagen, Klimaschutz.",
      img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop",
      wunschbetrag: 3200, gesammelt: 1400, stimmen: 612,
      warum: "Eine vollständige Finanzierung sichert 5.300 Bäume und schafft 12 dauerhafte Arbeitsplätze.",
      story: "Die Böden im Norden Kenias sind ausgetrocknet. Jahrzehntelange Abholzung und der Klimawandel haben Felder und Weiden unfruchtbar gemacht. Familien verlieren ihre Lebensgrundlage.  Green Earth Kenya setzt auf eine einfache, bewährte Lösung: Bäume pflanzen, Gemeinschaften stärken. Jede gepflanzte Pflanze schützt den Boden, spendet Schatten und gibt Früchte. 12 lokale Familien werden als Baumpfleger ausgebildet — dauerhafter Job, dauerhafter Impact.  Mit den HUI-Geldern pflanzen wir 5.300 weitere Bäume. Jeder einzelne zählt.",
    },
    {
      id: "p3", emoji: "🐾", title: "Tierheim Hamburg",
      org: "Tierheim Hamburg-Süd e.V.", kategorie: "Tierschutz", land: "Deutschland",
      desc: "Neue Gehege, Tierarzt-Ausstattung und Pfleger-Ausbildung für 150 Tiere.",
      img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
      wunschbetrag: 3600, gesammelt: 1200, stimmen: 389,
      warum: "Das Tierheim ist dringend auf Sanierung angewiesen — die Tiere brauchen euch.",
      story: "150 Hunde, Katzen und Kleintiere leben im Tierheim Hamburg-Süd — viele davon seit Monaten. Die Gehege sind alt, Tierarztgeräte veraltet, und die ehrenamtlichen Pfleger stoßen an ihre Grenzen.  Das Tierheim bekommt keine staatlichen Gelder. Es lebt von Spenden und Herz. Mit eurem Beitrag sanieren wir die Außengehege, kaufen neue medizinische Ausstattung und bilden 3 neue Pfleger aus — damit mehr Tiere Platz und Fürsorge bekommen.  Jede Buchung auf HUI bringt uns ein Stückchen näher. Danke für euer Herz.",
    },
  ];

  // ── Alle weiteren laufenden Projekte ──────────────────────────
  const weitereProjekte = [
    { id: "wp1", emoji: "💧", title: "Sauberes Wasser in Mali", org: "WaterForAll e.V.", kategorie: "Wasser & Gesundheit", land: "Mali", img: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop", wunschbetrag: 8000, gesammelt: 1230 },
    { id: "wp2", emoji: "👩", title: "Frauen-Kooperative Äthiopien", org: "Empowerment Africa", kategorie: "Gleichberechtigung", land: "Äthiopien", img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop", wunschbetrag: 5000, gesammelt: 890 },
    { id: "wp3", emoji: "🧒", title: "Spielplatz Marseille", org: "Quartier Vivant", kategorie: "Kinder & Soziales", land: "Frankreich", img: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=600&h=400&fit=crop", wunschbetrag: 2200, gesammelt: 640 },
  ];

  const totalStimmen = nominiert.reduce((s, p) => s + p.stimmen, 0) + (votedFor ? 1 : 0);
  const votedProject = nominiert.find(p => p.id === votedFor);
  const gewinner = [...nominiert].sort((a, b) => b.stimmen - a.stimmen)[0];

  // ── Pool-Verteilungs-Simulation ────────────────────────────────
  const gewinnerBekommt = Math.min(poolGesamt, gewinner.wunschbetrag);
  const restPool = poolGesamt - gewinnerBekommt;
  const alleAnderenProjekte = [...nominiert.filter(p => p.id !== gewinner.id), ...weitereProjekte];
  const restProProjekt = alleAnderenProjekte.length > 0 ? Math.round(restPool / alleAnderenProjekte.length) : 0;

  const handleVote = (project) => {
    setVotedFor(project.id);
    localStorage.setItem("hui_vote_" + new Date().getMonth(), project.id);
    setShowVoteConfirm(null);
    setVoteSuccess(true);
    setTimeout(() => setVoteSuccess(false), 3000);
  };

  // ── Vote Success Toast ─────────────────────────────────────────
  if (voteSuccess) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 28, padding: "36px 28px", textAlign: "center", maxWidth: 340, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🗳️</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#1a1a1a", marginBottom: 8 }}>Stimme abgegeben!</div>
          <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
            Du hast für <strong style={{ color: TEAL }}>{nominiert.find(p => p.id === votedFor)?.title}</strong> gestimmt.
            Das Ergebnis siehst du am <strong>{endOfMonth.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}</strong>.
          </div>
          <div style={{ background: `${TEAL}12`, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
            🌱 Egal wer gewinnt — alle Projekte profitieren vom Impact Pool. Jede Buchung zählt.
          </div>
          <button onClick={() => setVoteSuccess(false)} style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            Danke! 💚
          </button>
        </div>
      </div>
    );
  }

  // ── Vote Confirm Modal ─────────────────────────────────────────
  if (showVoteConfirm) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
        <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "28px 24px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{showVoteConfirm.emoji}</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: "#222", marginBottom: 8 }}>Für "{showVoteConfirm.title}" stimmen?</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              Du hast <strong>eine Stimme</strong> pro Monat — diese kann nicht rückgängig gemacht werden.
            </div>
          </div>
          <div style={{ background: `${TEAL}0d`, borderRadius: 16, padding: "14px 16px", marginBottom: 22, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: TEAL, marginBottom: 6 }}>Was passiert wenn dieses Projekt gewinnt?</div>
            <div>✅ Es erhält <strong>{showVoteConfirm.wunschbetrag.toLocaleString("de-DE")} €</strong> vollständig ausgezahlt</div>
            <div style={{ marginTop: 4 }}>💸 Der Rest (~{restProProjekt} €) geht gleichmäßig an alle anderen Projekte</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowVoteConfirm(null)} style={{ flex: 1, padding: "14px", border: "1.5px solid #e8e8e8", borderRadius: 14, background: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#666" }}>
              Abbrechen
            </button>
            <button onClick={() => handleVote(showVoteConfirm)} style={{ flex: 2, padding: "14px", border: "none", borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, fontWeight: 800, fontSize: 15, cursor: "pointer", color: "white" }}>
              ✓ Jetzt abstimmen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Ergebnis letzten Monat ─────────────────────────────────────
  if (showErgebnis) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
        <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "88vh", overflowY: "auto" }}>
          <div style={{ background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, padding: "28px 24px 24px", borderRadius: "24px 24px 0 0", position: "sticky", top: 0 }}>
            <button onClick={() => setShowErgebnis(false)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.25)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="white" />
            </button>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ergebnis April 2026</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: "white", marginBottom: 4 }}>🏆 Die Community hat gesprochen!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>3.210 € wurden verteilt — an alle Projekte</div>
          </div>
          <div style={{ padding: "20px 20px 40px" }}>
            {/* Gewinner */}
            <div style={{ background: `${TEAL}0d`, border: `1.5px solid ${TEAL}33`, borderRadius: 18, padding: "16px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🥇 Gewinner des Monats</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 36 }}>🏫</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>Schule für alle</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>Uganda · 847 Stimmen (46%)</div>
                </div>
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>Vollständig ausgezahlt</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: TEAL }}>3.000 € 🎉</div>
                </div>
                <div style={{ fontSize: 28 }}>✅</div>
              </div>
            </div>
            {/* Rest-Verteilung */}
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>💸 Rest gleichmäßig verteilt</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12, lineHeight: 1.6 }}>
              Die verbleibenden 210 € wurden gleichmäßig auf alle laufenden Projekte aufgeteilt — jedes bekommt ein Stück.
            </div>
            {[
              { name: "Bäume für Kenia", betrag: "52 €", emoji: "🌳" },
              { name: "Tierheim Hamburg", betrag: "52 €", emoji: "🐾" },
              { name: "Sauberes Wasser Mali", betrag: "52 €", emoji: "💧" },
              { name: "Frauen-Kooperative Äthiopien", betrag: "54 €", emoji: "👩" },
            ].map((p, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ fontSize: 26 }}>{p.emoji}</div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "#444" }}>{p.name}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: GOLD }}>+{p.betrag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Story Modal ───────────────────────────────────────────────
  if (showStory) {
    const p = showStory;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 910, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end" }}>
        <div style={{ background: "white", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
          {/* Hero Bild */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={p.img} alt={p.title} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: "28px 28px 0 0", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.65) 100%)", borderRadius: "28px 28px 0 0" }} />
            <button onClick={() => setShowStory(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="white" />
            </button>
            <div style={{ position: "absolute", bottom: 14, left: 18 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{p.kategorie}</div>
                <div style={{ background: "rgba(0,0,0,0.35)", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>📍 {p.land}</div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 22, color: "white" }}>{p.emoji} {p.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{p.org}</div>
            </div>
          </div>

          {/* Scrollbarer Content */}
          <div style={{ overflowY: "auto", flex: 1, padding: "20px 20px 0" }}>
            {/* Fortschrittsanzeige */}
            <div style={{ background: "#f8f8f6", borderRadius: 16, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: TEAL }}>{p.gesammelt.toLocaleString("de-DE")} €</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>von {p.wunschbetrag.toLocaleString("de-DE")} € gesammelt</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: GOLD }}>{Math.round(p.gesammelt / p.wunschbetrag * 100)}%</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>erreicht</div>
                </div>
              </div>
              <div style={{ background: "#e8e8e8", borderRadius: 99, height: 8 }}>
                <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 8, borderRadius: 99, width: `${Math.round(p.gesammelt / p.wunschbetrag * 100)}%` }} />
              </div>
            </div>

            {/* Story Text */}
            <div style={{ fontWeight: 800, fontSize: 16, color: "#222", marginBottom: 10 }}>✨ Ihre Geschichte</div>
            {(p.story || p.desc).split("\n\n").map((para, i) => (
              <p key={i} style={{ fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 14, margin: "0 0 14px" }}>{para}</p>
            ))}
            <div style={{ height: 20 }} />
          </div>

          {/* Sticky Bottom Buttons */}
          <div style={{ padding: "14px 20px 32px", borderTop: "1px solid #f0f0f0", background: "white", flexShrink: 0, display: "flex", gap: 10 }}>
            <button onClick={() => { setShowStory(null); setShowSpenden(p); }} style={{ flex: 2, padding: "14px", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              ❤️ Direkt spenden
            </button>
            <button onClick={() => { setShowStory(null); setActiveTab("abstimmung"); }} style={{ flex: 1, padding: "14px", background: "#f3f3f3", color: "#555", border: "none", borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              🗳️ Abstimmen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Spenden Modal ──────────────────────────────────────────────
  if (showSpenden) {
    const p = showSpenden;
    const schnellbetraege = [5, 10, 25, 50];
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 910, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}>
        <div style={{ background: "white", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "24px 22px 40px" }}>
          {!spendenSent ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 36 }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#222" }}>Direkt spenden</div>
                  <div style={{ fontSize: 13, color: "#aaa" }}>{p.title} · {p.org}</div>
                </div>
                <button onClick={() => { setShowSpenden(null); setSpendenBetrag(""); }} style={{ background: "#f3f3f3", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={16} color="#666" />
                </button>
              </div>

              {/* Schnellbetraege */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {schnellbetraege.map(b => (
                  <button key={b} onClick={() => setSpendenBetrag(String(b))} style={{ flex: 1, padding: "11px 0", border: `2px solid ${spendenBetrag === String(b) ? CORAL : "#eee"}`, borderRadius: 14, background: spendenBetrag === String(b) ? `${CORAL}12` : "white", fontWeight: 800, fontSize: 14, color: spendenBetrag === String(b) ? CORAL : "#555", cursor: "pointer", transition: "all 0.15s" }}>
                    {b} €
                  </button>
                ))}
              </div>

              {/* Eigener Betrag */}
              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type="number"
                  placeholder="Eigener Betrag in €"
                  value={spendenBetrag}
                  onChange={e => setSpendenBetrag(e.target.value)}
                  style={{ width: "100%", border: "2px solid #eee", borderRadius: 14, padding: "13px 46px 13px 14px", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#222" }}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 800, color: "#bbb" }}>€</span>
              </div>

              <div style={{ background: `${TEAL}0d`, borderRadius: 14, padding: "11px 14px", marginBottom: 20, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                💚 100% deiner Spende geht direkt an das Projekt — keine versteckten Kosten.
              </div>

              <button
                onClick={() => { if (spendenBetrag && parseFloat(spendenBetrag) > 0) setSpendenSent(true); }}
                style={{ width: "100%", padding: "15px", background: spendenBetrag && parseFloat(spendenBetrag) > 0 ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "#ddd", color: spendenBetrag && parseFloat(spendenBetrag) > 0 ? "white" : "#aaa", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
                ❤️ {spendenBetrag ? `${parseFloat(spendenBetrag).toFixed(2)} € spenden` : "Betrag eingeben"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>💚</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#222", marginBottom: 8 }}>Danke für dein Herz!</div>
              <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 22 }}>
                Deine Spende von <strong style={{ color: CORAL }}>{parseFloat(spendenBetrag).toFixed(2)} €</strong> geht direkt an <strong>{p.title}</strong>. Du machst einen echten Unterschied.
              </div>
              <button onClick={() => { setShowSpenden(null); setSpendenBetrag(""); setSpendenSent(false); }} style={{ padding: "13px 32px", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Zurück zur App
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── HAUPT-VIEW ─────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>

      {/* Hero Header */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}ee, ${GOLD}cc)`, padding: "28px 20px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>🌱 Impact Pool {currentMonth}</div>
          <div style={{ fontWeight: 900, fontSize: 32, color: "white", marginBottom: 4 }}>{poolGesamt.toLocaleString("de-DE")} €</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 14 }}>bereit für echte Projekte — durch echte Buchungen</div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Noch", val: `${daysLeft} Tage`, icon: "⏳" },
              { label: "Abstimmungen", val: totalStimmen.toLocaleString("de-DE"), icon: "🗳️" },
              { label: "Projekte", val: `${nominiert.length + weitereProjekte.length}`, icon: "💚" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{s.icon}</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: "white" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Letzten Monat Banner */}
      <div style={{ margin: "12px 16px 0", background: "white", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", cursor: "pointer" }} onClick={() => setShowErgebnis(true)}>
        <div style={{ fontSize: 28 }}>🏆</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>April-Ergebnis ansehen</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>3.210 € verteilt · "Schule für alle" hat gewonnen</div>
        </div>
        <ChevronRight size={16} color="#ccc" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, margin: "14px 16px 0", background: "#f5f5f3", borderRadius: 16, padding: 4 }}>
        {[["abstimmung", "🗳️ Abstimmen"], ["projekte", "🌍 Projekte"], ["bewerben", "📝 Bewerben"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "10px 4px", border: "none", borderRadius: 13, fontWeight: 700, fontSize: 12, cursor: "pointer", background: activeTab === tab ? "white" : "transparent", color: activeTab === tab ? "#222" : "#aaa", boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: ABSTIMMUNG ── */}
      {activeTab === "abstimmung" && (
        <div style={{ padding: "14px 16px 0" }}>
          {!votedFor ? (
            <div style={{ background: `${CORAL}0f`, border: `1px solid ${CORAL}30`, borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              🗳️ <strong>Wähle dein Herzensprojekt für {currentMonth}!</strong> Du hast eine Stimme. Stimm sorgfältig ab — das Ergebnis entscheidet wer zuerst den vollen Förderbetrag bekommt.
            </div>
          ) : (
            <div style={{ background: `${TEAL}0f`, border: `1px solid ${TEAL}30`, borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              ✅ <strong>Du hast abgestimmt!</strong> Ergebnis am {endOfMonth.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}. Danke dass du den Unterschied machst 💚
            </div>
          )}

          {nominiert.map((p) => {
            const isVoted = votedFor === p.id;
            const stimmenMit = p.stimmen + (isVoted ? 1 : 0);
            const prozent = totalStimmen > 0 ? Math.round(stimmenMit / totalStimmen * 100) : 0;
            const isLeading = p.id === gewinner.id;

            return (
              <div key={p.id} style={{ background: "white", borderRadius: 20, overflow: "hidden", marginBottom: 16, boxShadow: isVoted ? `0 4px 20px ${TEAL}33` : "0 2px 12px rgba(0,0,0,0.07)", border: isVoted ? `2px solid ${TEAL}` : "2px solid transparent", transition: "all 0.3s" }}>
                {/* Bild */}
                <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowStory(p)}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.6) 100%)" }} />
                  {/* Badges */}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                    <div style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", color: "white", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{p.kategorie}</div>
                    <div style={{ background: "rgba(0,0,0,0.35)", color: "white", borderRadius: 20, padding: "4px 10px", fontSize: 11 }}>📍 {p.land}</div>
                  </div>
                  {isVoted && <div style={{ position: "absolute", top: 10, right: 10, background: TEAL, color: "white", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 }}>✓ Deine Wahl</div>}
                  {!votedFor && isLeading && <div style={{ position: "absolute", top: 10, right: 10, background: GOLD, color: "white", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 }}>🔥 Führend</div>}
                  <div style={{ position: "absolute", bottom: 10, left: 14 }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "white" }}>{p.emoji} {p.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{p.org}</div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</div>

                  {/* Wunschbetrag */}
                  <div style={{ background: "#f8f8f6", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: "#aaa" }}>Förderbedarf</span>
                      <span style={{ fontWeight: 800, color: TEAL }}>{p.wunschbetrag.toLocaleString("de-DE")} €</span>
                    </div>
                    <div style={{ background: "#e8e8e8", borderRadius: 99, height: 7 }}>
                      <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 7, borderRadius: 99, width: `${Math.round(p.gesammelt / p.wunschbetrag * 100)}%`, transition: "width 0.8s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>{p.gesammelt.toLocaleString("de-DE")} € bereits gesammelt</div>
                  </div>

                  {/* Stimmen-Balken (sichtbar nach eigenem Vote) */}
                  {votedFor && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
                        <span>👥 {stimmenMit.toLocaleString("de-DE")} Stimmen</span>
                        <span style={{ fontWeight: 800, color: isVoted ? TEAL : "#bbb" }}>{prozent}%</span>
                      </div>
                      <div style={{ background: "#eee", borderRadius: 99, height: 8, overflow: "hidden" }}>
                        <div style={{ background: isVoted ? `linear-gradient(90deg, ${TEAL}, ${GOLD})` : "#ccc", height: 8, borderRadius: 99, width: `${prozent}%`, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  )}

                  {/* Warum info */}
                  <div style={{ fontSize: 12, color: "#888", background: `${GOLD}0d`, borderRadius: 10, padding: "8px 12px", marginBottom: 14, lineHeight: 1.6 }}>
                    💡 {p.warum}
                  </div>

                  {/* Vote + Spenden Buttons */}
                  {!votedFor ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowVoteConfirm(p)} style={{ flex: 2, padding: "13px", border: "none", borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 16px ${TEAL}44` }}>
                        🗳️ Abstimmen
                      </button>
                      <button onClick={() => setShowSpenden(p)} style={{ flex: 1, padding: "13px", border: `2px solid ${CORAL}`, borderRadius: 14, background: "white", color: CORAL, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                        ❤️ Spenden
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ textAlign: "center", fontSize: 13, color: isVoted ? TEAL : "#ccc", fontWeight: isVoted ? 700 : 400, padding: "4px 0" }}>
                        {isVoted ? "💚 Du hast für dieses Projekt gestimmt" : "Du hast bereits abgestimmt"}
                      </div>
                      <button onClick={() => setShowSpenden(p)} style={{ width: "100%", padding: "12px", border: `2px solid ${CORAL}`, borderRadius: 14, background: "white", color: CORAL, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                        ❤️ Direkt spenden
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pool-Verteilung Erklärung */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px", marginTop: 4, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#222", marginBottom: 10 }}>📊 So wird der Pool verteilt</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${TEAL}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>1</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>Das Projekt mit den meisten Stimmen bekommt seinen <strong>vollen Förderbedarf</strong> zuerst ausgezahlt</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${GOLD}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>2</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>Der <strong>Rest</strong> wird gleichmäßig auf <strong>alle</strong> laufenden Projekte verteilt — niemand geht leer aus</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${CORAL}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>3</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>Projekte die ihren Betrag erreicht haben sind fertig — so gewinnt früher oder später <strong>jeder</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ALLE PROJEKTE ── */}
      {activeTab === "projekte" && (
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>🗳️ Diesen Monat nominiert</div>
          {nominiert.map((p, i) => {
            const pct = Math.round(p.gesammelt / p.wunschbetrag * 100);
            return (
              <div key={p.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowStory(p)}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
                  <div style={{ position: "absolute", top: 8, left: 10 }}>
                    <div style={{ background: TEAL, color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>🗳 Nominiert</div>
                  </div>
                  <div style={{ position: "absolute", bottom: 8, left: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "white" }}>{p.emoji} {p.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{p.org} · {p.land}</div>
                  </div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5, marginBottom: 10 }}>{p.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 5 }}>
                    <span>{p.gesammelt.toLocaleString("de-DE")} € gesammelt</span>
                    <span style={{ fontWeight: 700, color: TEAL }}>Ziel: {p.wunschbetrag.toLocaleString("de-DE")} €</span>
                  </div>
                  <div style={{ background: "#f0f0f0", borderRadius: 99, height: 7, marginBottom: 12 }}>
                    <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 7, borderRadius: 99, width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowStory(p); }} style={{ flex: 1, padding: "10px", border: "1.5px solid #e8e8e8", borderRadius: 12, background: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#555" }}>
                      ✨ Story
                    </button>
                    <button onClick={() => setShowSpenden(p)} style={{ flex: 1, padding: "10px", border: `2px solid ${CORAL}`, borderRadius: 12, background: "white", color: CORAL, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      ❤️ Spenden
                    </button>
                    <button onClick={() => setActiveTab("abstimmung")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      🗳️ Wählen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 6, marginTop: 8 }}>🌱 Weitere laufende Projekte</div>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12, lineHeight: 1.6 }}>Diese Projekte erhalten automatisch den Rest nach der Auszahlung — und bleiben aktiv bis ihr Ziel erreicht ist.</div>
          {weitereProjekte.map((p, i) => {
            const pct = Math.round(p.gesammelt / p.wunschbetrag * 100);
            return (
              <div key={p.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <div style={{ position: "relative" }}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))" }} />
                  <div style={{ position: "absolute", bottom: 8, left: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "white" }}>{p.emoji} {p.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{p.org} · {p.land}</div>
                  </div>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 5 }}>
                    <span>{p.gesammelt.toLocaleString("de-DE")} € gesammelt</span>
                    <span style={{ fontWeight: 700, color: "#999" }}>Ziel: {p.wunschbetrag.toLocaleString("de-DE")} €</span>
                  </div>
                  <div style={{ background: "#f0f0f0", borderRadius: 99, height: 6 }}>
                    <div style={{ background: "#bbb", height: 6, borderRadius: 99, width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: BEWERBEN ── */}
      {activeTab === "bewerben" && (
        <div style={{ padding: "14px 16px 0" }}>
          {bewerbungSent ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#222", marginBottom: 8 }}>Bewerbung eingegangen!</div>
              <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>Das HUI-Team meldet sich innerhalb von 3-5 Werktagen bei dir. Danke dass ihr mit eurem Projekt etwas bewegt.</div>
              <button onClick={() => { setBewerbungSent(false); setBewerbung({ name: "", org: "", desc: "", betrag: "", email: "" }); }} style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Neue Bewerbung
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: `${TEAL}0d`, borderRadius: 16, padding: "14px 16px", marginBottom: 18, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                💚 <strong>Euer Projekt macht etwas Gutes?</strong> Bewirbt euch für den monatlichen Impact Pool. Das HUI-Team prüft alle Bewerbungen und wählt drei Projekte für die nächste Abstimmung aus.
              </div>
              {[
                { key: "name", label: "Projektname", placeholder: "z.B. Stadtgarten München", emoji: "🌱" },
                { key: "org", label: "Organisation / Verein", placeholder: "z.B. Grüne Nachbarschaft e.V.", emoji: "🏢" },
                { key: "email", label: "Kontakt E-Mail", placeholder: "kontakt@euer-projekt.de", emoji: "✉️" },
                { key: "betrag", label: "Förderbedarf in €", placeholder: "z.B. 2500", emoji: "💶" },
              ].map(({ key, label, placeholder, emoji }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, marginBottom: 6 }}>{emoji} {label.toUpperCase()}</div>
                  <input
                    value={bewerbung[key]}
                    onChange={e => setBewerbung(b => ({ ...b, [key]: e.target.value }))}
                    placeholder={placeholder}
                    type={key === "email" ? "email" : key === "betrag" ? "number" : "text"}
                    style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 14, padding: "13px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#222", fontFamily: "inherit" }}
                  />
                </div>
              ))}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, marginBottom: 6 }}>📝 BESCHREIBUNG</div>
                <textarea
                  value={bewerbung.desc}
                  onChange={e => setBewerbung(b => ({ ...b, desc: e.target.value }))}
                  placeholder="Was macht euer Projekt? Wen oder was unterstützt ihr? Was würdet ihr mit dem Geld machen?"
                  rows={4}
                  style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 14, padding: "13px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#222", fontFamily: "inherit", resize: "none" }}
                />
              </div>
              {/* Foto Upload */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, marginBottom: 6 }}>📸 PROJEKTFOTO (optional)</div>
                <label style={{ display: "block", cursor: "pointer" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setBewerbungFoto({ file, preview: ev.target.result });
                      reader.readAsDataURL(file);
                    }
                  }} />
                  {bewerbungFoto ? (
                    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
                      <img src={bewerbungFoto.preview} alt="Vorschau" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                      <button onClick={e => { e.preventDefault(); setBewerbungFoto(null); }} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={14} color="white" />
                      </button>
                    </div>
                  ) : (
                    <div style={{ border: "2px dashed #ddd", borderRadius: 16, padding: "28px 20px", textAlign: "center", background: "#fafafa" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#555", marginBottom: 4 }}>Foto hochladen</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>Zeigt euer Projekt von der schönsten Seite</div>
                    </div>
                  )}
                </label>
              </div>

              <button
                onClick={() => { if (bewerbung.name && bewerbung.email && bewerbung.desc) setBewerbungSent(true); }}
                style={{ width: "100%", padding: "15px", background: bewerbung.name && bewerbung.email && bewerbung.desc ? `linear-gradient(135deg, ${TEAL}, ${GOLD})` : "#ddd", color: bewerbung.name && bewerbung.email && bewerbung.desc ? "white" : "#aaa", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer", marginBottom: 20 }}
              >
                Bewerbung absenden →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
const mockFavWirker = [
  { id: "w1", name: "Lena K.", talent: "Keramik & Töpfern", location: "München", rate: "45 €/h", recommendations: 34, online: true, nextFree: "Morgen, 10:00",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop" },
  { id: "w2", name: "Marco B.", talent: "Gitarrenunterricht", location: "Berlin", rate: "55 €/h", recommendations: 21, online: false, nextFree: "Fr, 16:00",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" },
  { id: "w3", name: "Sophie M.", talent: "Yoga & Meditation", location: "Hamburg", rate: "40 €/h", recommendations: 58, online: true, nextFree: "Heute, 18:00",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" },
];
const mockFavWerke = [
  { id: "wk1", title: "Handgefertigte Keramikschale", price: "38 €", creator: "Lena K.", creatorImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop" },
  { id: "wk2", title: "Aquarell Stadtansicht", price: "120 €", creator: "Paul R.", creatorImg: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop" },
  { id: "wk3", title: "Makramee Wanddeko", price: "65 €", creator: "Mia T.", creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    img: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=400&h=300&fit=crop" },
  { id: "wk4", title: "Handgebundenes Notizbuch", price: "28 €", creator: "Jonas K.", creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    img: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=300&fit=crop" },
];
const mockFavImpact = [
  { id: "i1", title: "Bäume für Kenia", emoji: "🌳", tag: "Natur",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop",
    collected: 2340, goal: 5000, backers: 78, daysLeft: 14 },
  { id: "i2", title: "Schule für alle", emoji: "🏫", tag: "Bildung",
    img: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=300&fit=crop",
    collected: 2100, goal: 3500, backers: 54, daysLeft: 4 },
];


export default ImpactPage;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/* ─── Design Tokens ──────────────────────────────────────────── */
const C = {
  coral:   "#FF6B5B",
  teal:    "#2ABFAC",
  gold:    "#F5A623",
  amber:   "#F59E0B",
  purple:  "#A78BFA",
  ink:     "#1A1A2E",
  muted:   "#6B7280",
  surface: "#F8F7F5",
  card:    "#FFFFFF",
  border:  "#EEECE8",
  green:   "#10B981",
};

/* ─── Mock-Daten ─────────────────────────────────────────────── */
const MOCK_POOL   = { total: 3847.50, yearly: 18340, month: "Mai 2026", goal: 5000 };
const MOCK_VOTES  = { remaining: 2, userType: "wirker" }; // wirker=2, entdecker=1

const MOCK_PROJECTS = [
  {
    id: "p1", featured: true,
    name: "Stadtgarten München",
    tagline: "Urbane Oasen für echte Gemeinschaft",
    description: "Mitten in der Stadt wachsen neue grüne Inseln. Der Stadtgarten schafft Plätze, an denen Nachbarn einander begegnen, gemeinsam gärtnern und Verantwortung übernehmen. Nicht als Projekt – als neue Art zu leben.",
    story: "2021 begann alles mit einem brachliegenden Parkplatz in Schwabing. Heute gibt es 14 Gärten, über 600 aktive Mitglieder und ein Netzwerk, das zeigt: Gemeinschaft lässt sich pflanzen.",
    goal: 800, raised: 520, votes: 142,
    category: "Umwelt & Gemeinschaft",
    icon: "🌿", color: C.teal,
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=85",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=85",
    ],
    org: "Stadtgarten e.V.", orgLocation: "München",
    updates: [
      { date: "Apr 2026", text: "Garten #14 in Schwabing offiziell eröffnet — 80 neue Mitglieder in einer Woche." },
      { date: "Mär 2026", text: "Erstes Kinder-Gartenprogramm gestartet: 23 Schulkinder lernen Gemüse anbauen." },
    ],
    isMonthly: true,
  },
  {
    id: "p2", featured: false,
    name: "Lernwerkstatt Hamburg",
    tagline: "Bildung die wirklich ankommt",
    description: "Kostenlose Nachhilfe, Workshops und Lernräume für Kinder aus Familien, die sich Bildung sonst nicht leisten können. Weil jedes Kind eine faire Chance verdient.",
    story: "Gegründet von einer ehemaligen Lehrerin, die zu viele Kinder mit Potenzial scheitern sah. Heute arbeiten 40 Ehrenamtliche zusammen.",
    goal: 600, raised: 380, votes: 98,
    category: "Bildung",
    icon: "📚", color: C.coral,
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=85",
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=85",
    ],
    org: "Lernwerkstatt Hamburg e.V.", orgLocation: "Hamburg",
    updates: [
      { date: "Apr 2026", text: "32 Kinder haben dieses Schuljahr ihren Abschluss verbessert." },
    ],
    isMonthly: true,
  },
  {
    id: "p3", featured: false,
    name: "Repair Café Berlin",
    tagline: "Reparieren statt wegwerfen",
    description: "Kaputt bedeutet nicht Ende. Jeden Samstag kommen Menschen zusammen, um Dinge zu reparieren – Toaster, Fahrräder, Kleidung, Elektronik. Ehrenamtlich, kostenlos, sinnvoll.",
    story: "Was 2018 als wöchentliches Treffen in einer Garage begann, ist heute eine Bewegung: 8 feste Standorte, über 200 Freiwillige, mehr als 4.000 Reparaturen.",
    goal: 400, raised: 190, votes: 67,
    category: "Nachhaltigkeit",
    icon: "🔧", color: C.amber,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85",
    ],
    org: "Repair Café Berlin e.V.", orgLocation: "Berlin",
    updates: [],
    isMonthly: true,
  },
  {
    id: "p4", featured: false,
    name: "WildHerz Tierschutz",
    tagline: "Für die, die keine Stimme haben",
    description: "Rettung und Rehabilitation verletzter Wildtiere. Jedes gerettete Tier bekommt eine zweite Chance.",
    story: "Kleine Station, große Wirkung: 340 Tiere allein im letzten Jahr versorgt und ausgewildert.",
    goal: 500, raised: 90, votes: 44,
    category: "Tierschutz",
    icon: "🦅", color: C.purple,
    img: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=85",
    gallery: ["https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=85"],
    org: "WildHerz gGmbH", orgLocation: "Bayern",
    updates: [],
    isMonthly: false,
  },
];

/* ─── Animierter Counter ─────────────────────────────────────── */
function AnimCounter({ to, decimals = 0, prefix = "", suffix = "", duration = 1600 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    clearInterval(ref.current);
    let current = 0;
    const step = to / (duration / 16);
    ref.current = setInterval(() => {
      current = Math.min(current + step, to);
      setVal(current);
      if (current >= to) clearInterval(ref.current);
    }, 16);
    return () => clearInterval(ref.current);
  }, [to, duration]);
  return <>{prefix}{decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString("de-DE")}{suffix}</>;
}

/* ─── Kreisförmiger Fortschrittsring ─────────────────────────── */
function ProgressRing({ pool }) {
  const pct    = Math.min(pool.total / pool.goal, 1);
  const R      = 90;
  const circ   = 2 * Math.PI * R; // ≈ 565
  const offset = circ * (1 - pct);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 24px 20px", position: "relative" }}>

      {/* Glow hinter Ring */}
      <div style={{ position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-58%)",
        width: 220, height: 220, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.gold}22 0%, transparent 70%)`,
        pointerEvents: "none" }} />

      <svg width={220} height={220} style={{ transform: "rotate(-90deg)" }}>
        {/* Hintergrund-Ring */}
        <circle cx={110} cy={110} r={R}
          fill="none" stroke={`${C.gold}18`} strokeWidth={14} />
        {/* Füll-Ring */}
        <circle cx={110} cy={110} r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="hui-ring-fill"
          style={{ "--ring-offset": offset, transition: "stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={C.gold} />
            <stop offset="50%"  stopColor={C.coral} />
            <stop offset="100%" stopColor={C.teal} />
          </linearGradient>
        </defs>
      </svg>

      {/* Text in der Mitte */}
      <div style={{ position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -60%)",
        textAlign: "center", pointerEvents: "none" }}>
        <div className="hui-number-count" style={{ fontWeight: 900, fontSize: 34, lineHeight: 1,
          background: `linear-gradient(135deg, ${C.gold}, ${C.coral})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text" }}>
          <AnimCounter to={pool.total} decimals={0} prefix="€ " />
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600,
          letterSpacing: 0.3 }}>
          {pool.month}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
          von € {pool.goal.toLocaleString("de-DE")} Ziel
        </div>
      </div>

      {/* Jährlicher Betrag */}
      <div style={{ marginTop: -10, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>Dieses Jahr gesammelt</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.ink }}>
          <AnimCounter to={pool.yearly} prefix="€ " />
        </div>
      </div>
    </div>
  );
}

/* ─── Spenden-Overlay ────────────────────────────────────────── */
function DonateOverlay({ project, onClose }) {
  const amounts  = [5, 10, 20, 50];
  const [sel, setSel]   = useState(10);
  const [custom, setCust] = useState("");
  const [step,   setStep] = useState("amount"); // amount | confirm | done
  const finalAmt = custom ? parseFloat(custom) || 0 : sel;

  function handleDonate() {
    if (finalAmt <= 0) return;
    setStep("confirm");
  }
  function handleConfirm() {
    setStep("done");
    setTimeout(() => onClose(), 2800);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(26,26,46,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hui-overlay-slide"
        style={{ width: "100%", background: C.card,
          borderRadius: "28px 28px 0 0",
          padding: "0 0 max(24px,env(safe-area-inset-bottom))",
          maxHeight: "85vh", overflowY: "auto" }}>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999,
            background: C.border }} />
        </div>

        {step === "done" ? (
          <div style={{ padding: "32px 24px 16px", textAlign: "center" }}>
            <div className="hui-checkmark-pop"
              style={{ fontSize: 72, marginBottom: 16 }}>🌱</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: C.ink, marginBottom: 8 }}>
              Danke, {project.icon}
            </div>
            <div style={{ fontWeight: 800, fontSize: 28, color: C.teal, marginBottom: 6 }}>
              € {finalAmt.toFixed(2)}
            </div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>
              fließen direkt in<br />
              <strong style={{ color: C.ink }}>{project.name}</strong>
            </div>
          </div>
        ) : step === "confirm" ? (
          <div style={{ padding: "24px" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.ink,
              marginBottom: 6, textAlign: "center" }}>Spende bestätigen</div>
            <div style={{ textAlign: "center", fontSize: 13, color: C.muted,
              marginBottom: 24 }}>{project.name}</div>

            <div style={{ background: `${project.color}10`, borderRadius: 20,
              padding: "20px", textAlign: "center", marginBottom: 20,
              border: `1.5px solid ${project.color}25` }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Dein Beitrag</div>
              <div style={{ fontWeight: 900, fontSize: 40, color: project.color }}>
                € {finalAmt.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: C.teal, marginTop: 8, fontWeight: 700 }}>
                ✓ 100 % gehen direkt in dieses Projekt
              </div>
            </div>

            <button onClick={handleConfirm}
              style={{ width: "100%", padding: "17px",
                background: `linear-gradient(135deg, ${project.color}, ${C.teal})`,
                color: "white", border: "none", borderRadius: 18,
                fontSize: 16, fontWeight: 900, cursor: "pointer",
                boxShadow: `0 6px 20px ${project.color}35`,
                WebkitTapHighlightColor: "transparent" }}>
              Jetzt € {finalAmt.toFixed(2)} spenden 🌱
            </button>
            <button onClick={() => setStep("amount")}
              style={{ width: "100%", padding: "14px", marginTop: 10,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: C.muted,
                WebkitTapHighlightColor: "transparent" }}>
              Betrag ändern
            </button>
          </div>
        ) : (
          <div style={{ padding: "24px" }}>
            {/* Projekt-Infos kompakt */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden",
                flexShrink: 0, background: `${project.color}15` }}>
                <img src={project.img} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: C.ink }}>{project.name}</div>
                <div style={{ fontSize: 12, color: project.color, fontWeight: 700,
                  marginTop: 2 }}>{project.category}</div>
              </div>
            </div>

            <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 14 }}>
              Wie viel möchtest du beitragen?
            </div>

            {/* Schnellbeträge */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 8, marginBottom: 14 }}>
              {amounts.map(a => (
                <button key={a} onClick={() => { setSel(a); setCust(""); }}
                  style={{ padding: "14px 8px", border: "none", borderRadius: 14,
                    cursor: "pointer", fontWeight: 800, fontSize: 15,
                    transition: "all 0.15s",
                    background: sel === a && !custom
                      ? `linear-gradient(135deg, ${project.color}, ${project.color}CC)`
                      : `${project.color}10`,
                    color: sel === a && !custom ? "white" : project.color,
                    boxShadow: sel === a && !custom
                      ? `0 4px 12px ${project.color}33` : "none",
                    WebkitTapHighlightColor: "transparent" }}>
                  {a} €
                </button>
              ))}
            </div>

            {/* Freifeld */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <span style={{ position: "absolute", left: 16, top: "50%",
                transform: "translateY(-50%)",
                fontWeight: 700, color: C.muted, fontSize: 15 }}>€</span>
              <input
                type="number" min="1" placeholder="Anderen Betrag eingeben"
                value={custom}
                onChange={e => { setCust(e.target.value); setSel(null); }}
                style={{ width: "100%", padding: "14px 16px 14px 36px",
                  background: custom ? `${project.color}08` : C.surface,
                  border: `1.5px solid ${custom ? project.color : C.border}`,
                  borderRadius: 14, fontSize: 15, color: C.ink, outline: "none",
                  transition: "all 0.2s", boxSizing: "border-box" }}
              />
            </div>

            {/* Transparenz-Hinweis */}
            <div style={{ background: `${C.teal}08`, borderRadius: 14,
              padding: "12px 14px", marginBottom: 20,
              border: `1px solid ${C.teal}20`,
              display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>✓</span>
              <div style={{ fontSize: 13, color: C.teal, fontWeight: 700, lineHeight: 1.5 }}>
                100 % deiner Spende gehen direkt in dieses Projekt — ohne Abzüge.
              </div>
            </div>

            <button onClick={handleDonate} disabled={finalAmt <= 0}
              style={{ width: "100%", padding: "17px",
                background: finalAmt > 0
                  ? `linear-gradient(135deg, ${project.color}, ${C.teal})`
                  : C.border,
                color: "white", border: "none", borderRadius: 18,
                fontSize: 16, fontWeight: 900,
                cursor: finalAmt > 0 ? "pointer" : "default",
                boxShadow: finalAmt > 0 ? `0 6px 20px ${project.color}30` : "none",
                transition: "all 0.2s",
                WebkitTapHighlightColor: "transparent" }}>
              {finalAmt > 0 ? `Jetzt € ${finalAmt.toFixed(2)} spenden 🌱` : "Betrag wählen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Projekt-Detail-Overlay ─────────────────────────────────── */
function ProjectDetail({ project, onClose, onDonate, votes, onVote }) {
  const [imgIdx, setImgIdx] = useState(0);
  const pct = Math.round((project.raised / project.goal) * 100);
  const isLeading = project.votes === Math.max(...MOCK_PROJECTS.map(p => p.votes));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300,
      background: C.surface, overflowY: "auto" }}>

      {/* Header-Bild mit Navigation */}
      <div style={{ position: "relative", height: 280 }}>
        <img src={project.gallery[imgIdx]} alt={project.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)" }} />

        {/* Zurück */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 16, left: 16,
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
            border: "none", cursor: "pointer", color: "white",
            fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent" }}>
          ←
        </button>

        {/* Galerie-Dots */}
        {project.gallery.length > 1 && (
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 6 }}>
            {project.gallery.map((_, i) => (
              <div key={i} onClick={() => setImgIdx(i)}
                style={{ width: i === imgIdx ? 18 : 6, height: 6,
                  borderRadius: 999, background: "white",
                  opacity: i === imgIdx ? 1 : 0.5,
                  transition: "all 0.2s", cursor: "pointer" }} />
            ))}
          </div>
        )}

        {/* Führend-Badge */}
        {isLeading && (
          <div style={{ position: "absolute", top: 16, right: 16,
            background: `linear-gradient(135deg, ${C.gold}, ${C.coral})`,
            color: "white", borderRadius: 20, padding: "5px 14px",
            fontSize: 12, fontWeight: 800 }}>
            🏆 Führend diesen Monat
          </div>
        )}

        {/* Titel über Bild */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)",
            marginBottom: 4 }}>{project.category}</div>
          <div style={{ fontWeight: 900, fontSize: 24, color: "white",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{project.name}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)",
            marginTop: 4 }}>{project.tagline}</div>
        </div>
      </div>

      <div style={{ padding: "24px 20px", paddingBottom: 100 }}>

        {/* Fortschritts-Block */}
        <div style={{ background: C.card, borderRadius: 20,
          padding: "20px", marginBottom: 20,
          boxShadow: "0 2px 16px rgba(26,26,46,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>Bisher gesammelt</div>
              <div style={{ fontWeight: 900, fontSize: 28, color: project.color }}>
                € {project.raised.toLocaleString("de-DE")}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>Ziel</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.ink }}>
                € {project.goal.toLocaleString("de-DE")}
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div style={{ background: `${project.color}15`, borderRadius: 999, height: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 999,
              background: `linear-gradient(90deg, ${project.color}, ${project.color}99)`,
              width: `${pct}%`, transition: "width 1.2s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: project.color, marginTop: 6, fontWeight: 700 }}>
            {pct}% des Ziels erreicht
          </div>
        </div>

        {/* Die Geschichte */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: C.ink, marginBottom: 10 }}>
            Die Geschichte
          </div>
          <div style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75 }}>
            {project.story}
          </div>
        </div>

        {/* Was dieses Projekt bewirkt */}
        <div style={{ background: `${project.color}08`, borderRadius: 20,
          padding: "18px", marginBottom: 20,
          border: `1.5px solid ${project.color}20` }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 8 }}>
            {project.icon} Was dieses Projekt bewirkt
          </div>
          <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
            {project.description}
          </div>
        </div>

        {/* Organisation */}
        <div style={{ background: C.card, borderRadius: 16,
          padding: "16px", marginBottom: 20,
          boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
          display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%",
            background: `${project.color}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0 }}>
            {project.icon}
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Organisation</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.ink }}>{project.org}</div>
            <div style={{ fontSize: 12, color: C.muted }}>📍 {project.orgLocation}</div>
          </div>
        </div>

        {/* Updates */}
        {project.updates?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 12 }}>
              Fortschritte
            </div>
            {project.updates.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%",
                    background: project.color, flexShrink: 0, marginTop: 3 }} />
                  {i < project.updates.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: `${project.color}25`,
                      marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: project.color,
                    marginBottom: 3 }}>{u.date}</div>
                  <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{u.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Abstimmen (falls im monatlichen Voting) */}
        {project.isMonthly && (
          <div style={{ background: `${C.gold}08`, borderRadius: 20, padding: "18px",
            marginBottom: 20, border: `1.5px solid ${C.gold}25` }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 4 }}>
              Monatsentscheidung
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
              {votes.remaining > 0
                ? `Du hast noch ${votes.remaining} Stimme${votes.remaining > 1 ? "n" : ""}`
                : "Deine Stimmen für diesen Monat sind vergeben."}
            </div>
            <button
              onClick={() => votes.remaining > 0 && onVote(project.id)}
              disabled={votes.remaining === 0}
              style={{ width: "100%", padding: "14px",
                background: votes.remaining > 0
                  ? `linear-gradient(135deg, ${C.gold}, ${C.amber})`
                  : C.border,
                color: "white", border: "none", borderRadius: 16,
                fontSize: 14, fontWeight: 800,
                cursor: votes.remaining > 0 ? "pointer" : "default",
                boxShadow: votes.remaining > 0 ? `0 4px 14px ${C.gold}35` : "none",
                transition: "all 0.2s",
                WebkitTapHighlightColor: "transparent" }}>
              {votes.remaining > 0 ? `🗳️ Für ${project.name.split(" ")[0]} stimmen` : "✓ Stimme vergeben"}
            </button>
          </div>
        )}

        {/* Haupt-CTA: Spenden */}
        <button onClick={() => onDonate(project)}
          style={{ width: "100%", padding: "18px",
            background: `linear-gradient(135deg, ${project.color}, ${C.teal})`,
            color: "white", border: "none", borderRadius: 20,
            fontSize: 16, fontWeight: 900, cursor: "pointer",
            boxShadow: `0 8px 28px ${project.color}35`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            WebkitTapHighlightColor: "transparent" }}>
          <span>🌱</span> Jetzt spenden
        </button>
      </div>
    </div>
  );
}

/* ─── Projekt-Karte (Feed) ───────────────────────────────────── */
function ProjectCard({ project, index, onDetail, onDonate, votes, onVote }) {
  const pct = Math.round((project.raised / project.goal) * 100);
  const [voted, setVoted] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const votesForProject = project.votes;
  const totalVotes = MOCK_PROJECTS.filter(p => p.isMonthly).reduce((s, p) => s + p.votes, 0);
  const votePct = totalVotes > 0 ? Math.round((votesForProject / totalVotes) * 100) : 0;

  function handleVote(e) {
    e.stopPropagation();
    if (votes.remaining <= 0 || voted) return;
    setVoted(true);
    setGlowing(true);
    setTimeout(() => setGlowing(false), 800);
    onVote(project.id);
  }

  return (
    <div className={`hui-feed-card hui-card-reveal ${glowing ? "hui-vote-glow" : ""}`}
      style={{ margin: "0 16px 20px", animationDelay: `${index * 0.1}s`,
        border: glowing ? `2px solid ${C.gold}60` : "2px solid transparent",
        transition: "border-color 0.3s" }}
      onClick={() => onDetail(project)}>

      {/* Bild */}
      <div style={{ height: 220, position: "relative", overflow: "hidden" }}>
        <img src={project.img} alt={project.name}
          style={{ width: "100%", height: "100%", objectFit: "cover",
            transition: "transform 0.3s" }} />
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 35%, rgba(26,26,46,0.75) 100%)" }} />

        {/* Kategorie-Badge */}
        <div style={{ position: "absolute", top: 14, left: 14,
          background: `${project.color}EE`, borderRadius: 20,
          padding: "5px 13px", fontSize: 11, fontWeight: 800, color: "white" }}>
          {project.icon} {project.category}
        </div>

        {/* Titel über Gradient */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px" }}>
          <div style={{ fontWeight: 900, fontSize: 20, color: "white",
            textShadow: "0 1px 6px rgba(0,0,0,0.35)", marginBottom: 2 }}>
            {project.name}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
            {project.tagline}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px" }}>
        {/* Fortschritt */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            marginBottom: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: project.color }}>
              € {project.raised.toLocaleString("de-DE")}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              Ziel: € {project.goal.toLocaleString("de-DE")}
            </span>
          </div>
          <div style={{ background: `${project.color}15`, borderRadius: 999, height: 8 }}>
            <div style={{ height: "100%", borderRadius: 999,
              background: `linear-gradient(90deg, ${project.color}, ${project.color}AA)`,
              width: `${pct}%`, transition: "width 1s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: project.color, marginTop: 4, fontWeight: 600 }}>
            {pct}% erreicht
          </div>
        </div>

        {/* Voting (nur bei monatlichen) */}
        {project.isMonthly && (
          <div style={{ background: `${C.gold}08`, borderRadius: 14, padding: "12px 14px",
            marginBottom: 14, border: `1px solid ${C.gold}20`,
            display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Abstimmung</div>
              <div style={{ background: `${C.gold}20`, borderRadius: 999, height: 5 }}>
                <div style={{ height: "100%", borderRadius: 999,
                  background: C.gold, width: `${votePct}%`, transition: "width 0.8s" }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {votesForProject} Stimmen ({votePct}%)
              </div>
            </div>
            <button onClick={handleVote}
              disabled={votes.remaining === 0 || voted}
              style={{ flexShrink: 0, padding: "9px 14px", border: "none",
                borderRadius: 12, cursor: votes.remaining > 0 && !voted ? "pointer" : "default",
                background: voted ? `${C.green}15`
                  : votes.remaining > 0 ? `linear-gradient(135deg, ${C.gold}, ${C.amber})`
                  : `${C.gold}20`,
                color: voted ? C.green : votes.remaining > 0 ? "white" : C.muted,
                fontSize: 12, fontWeight: 800, transition: "all 0.2s",
                WebkitTapHighlightColor: "transparent" }}>
              {voted ? "✓" : "🗳️"}
            </button>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={e => { e.stopPropagation(); onDonate(project); }}
            style={{ flex: 1.5, padding: "13px",
              background: `linear-gradient(135deg, ${project.color}, ${project.color}CC)`,
              color: "white", border: "none", borderRadius: 16,
              fontSize: 13, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 4px 14px ${project.color}28`,
              WebkitTapHighlightColor: "transparent" }}>
            🌱 Jetzt unterstützen
          </button>
          <button onClick={e => { e.stopPropagation(); onDetail(project); }}
            style={{ flex: 1, padding: "13px",
              background: `${project.color}10`, color: project.color,
              border: `1.5px solid ${project.color}25`, borderRadius: 16,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              WebkitTapHighlightColor: "transparent" }}>
            Mehr →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Monatsentscheidung ─────────────────────────────────────── */
function MonthlyDecision({ projects, votes, onVote, onDetail }) {
  const monthly = projects.filter(p => p.isMonthly);
  const sorted  = [...monthly].sort((a, b) => b.votes - a.votes);

  return (
    <div style={{ margin: "0 16px 24px" }}>
      <div style={{ fontWeight: 900, fontSize: 19, color: C.ink, marginBottom: 4 }}>
        🗳️ Monatsentscheidung
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 6, lineHeight: 1.55 }}>
        HUI hat diese 3 Projekte für den {MOCK_POOL.month} ausgewählt.
        Stimme ab — das Projekt mit den meisten Stimmen gewinnt.
      </div>

      {/* Stimmen-Anzeige */}
      <div style={{ background: `${C.gold}10`, borderRadius: 14, padding: "10px 14px",
        marginBottom: 16, border: `1px solid ${C.gold}25`,
        display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>🗳️</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
          {votes.remaining > 0
            ? `Du hast noch ${votes.remaining} Stimme${votes.remaining > 1 ? "n" : ""} — sie verfallen nicht.`
            : "Deine Stimmen sind vergeben. Gut gemacht!"}
        </span>
      </div>

      {/* 3 kompakte Voting-Karten */}
      {sorted.map((p, i) => {
        const totalV = monthly.reduce((s, x) => s + x.votes, 0);
        const vPct   = totalV > 0 ? Math.round((p.votes / totalV) * 100) : 0;
        const isFirst = i === 0;
        return (
          <div key={p.id} onClick={() => onDetail(p)}
            style={{ background: C.card, borderRadius: 20, marginBottom: 12,
              padding: "14px 16px", cursor: "pointer",
              boxShadow: isFirst
                ? `0 4px 20px ${p.color}25, 0 0 0 2px ${p.color}35`
                : "0 2px 12px rgba(26,26,46,0.06)",
              border: isFirst ? `2px solid ${p.color}35` : "2px solid transparent",
              transition: "box-shadow 0.2s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14,
                overflow: "hidden", flexShrink: 0 }}>
                <img src={p.img} alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  {isFirst && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.gold,
                      background: `${C.gold}15`, borderRadius: 20, padding: "2px 8px" }}>
                      🏆 Führend
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.ink }}>{p.name}</div>
                </div>
                <div style={{ background: `${p.color}15`, borderRadius: 999, height: 6 }}>
                  <div style={{ height: "100%", borderRadius: 999,
                    background: p.color, width: `${vPct}%`, transition: "width 0.8s" }} />
                </div>
                <div style={{ fontSize: 11, color: p.color, marginTop: 3, fontWeight: 600 }}>
                  {p.votes} Stimmen · {vPct}%
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); onVote(p.id); }}
                disabled={votes.remaining === 0}
                style={{ padding: "9px 14px", border: "none", borderRadius: 12,
                  background: votes.remaining > 0
                    ? `linear-gradient(135deg, ${p.color}, ${p.color}CC)`
                    : `${p.color}15`,
                  color: votes.remaining > 0 ? "white" : p.color,
                  fontSize: 12, fontWeight: 800, cursor: votes.remaining > 0 ? "pointer" : "default",
                  flexShrink: 0, WebkitTapHighlightColor: "transparent" }}>
                🗳️
              </button>
            </div>
          </div>
        );
      })}

      {/* Verteilungslogik erklären */}
      <div style={{ background: `${C.teal}07`, borderRadius: 16,
        padding: "14px 16px", border: `1px solid ${C.teal}18`,
        marginTop: 4 }}>
        <div style={{ fontSize: 13, color: C.teal, fontWeight: 700, marginBottom: 4 }}>
          Jedes Projekt gewinnt — manche früher, manche später.
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          Das Projekt mit den meisten Stimmen erhält seinen vollen Wunschbetrag.
          Der Rest wird fair auf die anderen Projekte verteilt.
        </div>
      </div>
    </div>
  );
}

/* ─── Projekt vorschlagen ────────────────────────────────────── */
function ProposeOverlay({ onClose }) {
  const [name, setName]     = useState("");
  const [url,  setUrl]      = useState("");
  const [why,  setWhy]      = useState("");
  const [sent, setSent]     = useState(false);

  function handleSend() {
    if (!name.trim()) return;
    setSent(true);
    setTimeout(onClose, 2400);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(26,26,46,0.5)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hui-overlay-slide"
        style={{ width: "100%", background: C.card,
          borderRadius: "28px 28px 0 0", padding: "20px 24px 36px",
          maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: C.border }} />
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div className="hui-checkmark-pop" style={{ fontSize: 56, marginBottom: 14 }}>✉️</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.ink, marginBottom: 6 }}>
              Danke für deinen Vorschlag!
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              Das HUI-Team prüft ihn sorgfältig und meldet sich.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.ink, marginBottom: 4 }}>
              Projekt vorschlagen
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              Du kennst ein Projekt das Förderung verdient? Schreib uns!
            </div>
            {[
              ["Projektname *", name, setName, "z. B. Repair Café München"],
              ["Website (optional)", url, setUrl, "https://"],
            ].map(([label, val, setter, ph]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
                  {label}
                </div>
                <input value={val} onChange={e => setter(e.target.value)}
                  placeholder={ph}
                  style={{ width: "100%", padding: "13px 16px",
                    background: C.surface, border: `1.5px solid ${C.border}`,
                    borderRadius: 14, fontSize: 14, color: C.ink, outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor = C.teal}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
                Warum dieses Projekt?
              </div>
              <textarea value={why} onChange={e => setWhy(e.target.value)}
                placeholder="Erzähl uns kurz worum es geht und warum du es unterstützen möchtest…"
                rows={4}
                style={{ width: "100%", padding: "13px 16px",
                  background: C.surface, border: `1.5px solid ${C.border}`,
                  borderRadius: 14, fontSize: 14, color: C.ink, outline: "none",
                  boxSizing: "border-box", resize: "none", transition: "border-color 0.2s",
                  fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = C.teal}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <button onClick={handleSend}
              style={{ width: "100%", padding: "16px",
                background: name.trim()
                  ? `linear-gradient(135deg, ${C.teal}, ${C.coral})`
                  : C.border,
                color: "white", border: "none", borderRadius: 18,
                fontSize: 15, fontWeight: 900, cursor: name.trim() ? "pointer" : "default",
                transition: "all 0.2s",
                WebkitTapHighlightColor: "transparent" }}>
              Vorschlag einreichen ✉️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Haupt-ImpactPage ───────────────────────────────────────── */
export default function ImpactPage({ currentUser }) {
  const [pool,       setPool]       = useState(MOCK_POOL);
  const [projects,   setProjects]   = useState(MOCK_PROJECTS);
  const [votes,      setVotes]      = useState(MOCK_VOTES);
  const [detailProj, setDetailProj] = useState(null);
  const [donateProj, setDonateProj] = useState(null);
  const [showPropose, setShowPropose] = useState(false);

  /* Echte DB-Daten laden */
  useEffect(() => {
    async function load() {
      try {
        const { data: poolData } = await supabase
          .from("impact_pool").select("*").limit(1).single();
        if (poolData) setPool(p => ({ ...p, total: poolData.total_amount }));

        const { data: projData } = await supabase
          .from("impact_projects").select("*").eq("is_active", true)
          .order("votes", { ascending: false }).limit(6);
        if (projData?.length) setProjects(projData);
      } catch {}
    }
    load();
  }, []);

  function handleVote(projectId) {
    if (votes.remaining <= 0) return;
    setVotes(v => ({ ...v, remaining: v.remaining - 1 }));
    setProjects(ps => ps.map(p =>
      p.id === projectId ? { ...p, votes: p.votes + 1 } : p
    ));
  }

  return (
    <div style={{ paddingBottom: 90, background: C.surface, minHeight: "100vh" }}>

      {/* ── Header-Leiste ── */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "16px 20px 0" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22, color: C.ink }}>Impact</div>
          <div style={{ fontSize: 12, color: C.muted }}>Echte Veränderung, gemeinsam</div>
        </div>
        <button onClick={() => setShowPropose(true)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, background: "none", border: "none", cursor: "pointer",
            WebkitTapHighlightColor: "transparent" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.teal}20, ${C.coral}10)`,
            border: `1.5px solid ${C.teal}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: C.teal }}>+</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.teal }}>Vorschlagen</div>
        </button>
      </div>

      {/* ── Hero: Fortschrittsring ── */}
      <ProgressRing pool={pool} />

      {/* ── Emotionale Überschrift ── */}
      <div style={{ textAlign: "center", padding: "0 28px 28px" }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: C.ink,
          lineHeight: 1.35, marginBottom: 8 }}>
          Gemeinsam schon so viel bewegt
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          Mit jeder Buchung und jedem Kauf fließen automatisch
          <strong style={{ color: C.teal }}> 2,5 %</strong> in echte Impact-Projekte.
        </div>
      </div>

      {/* ── Monatsentscheidung ── */}
      <MonthlyDecision
        projects={projects}
        votes={votes}
        onVote={handleVote}
        onDetail={setDetailProj}
      />

      {/* ── Trennlinie mit Label ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10,
        padding: "0 20px 16px" }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
          letterSpacing: 0.5 }}>ALLE PROJEKTE</div>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* ── Alle Projektkarten ── */}
      {projects.map((p, i) => (
        <ProjectCard key={p.id} project={p} index={i}
          onDetail={setDetailProj}
          onDonate={setDonateProj}
          votes={votes}
          onVote={handleVote}
        />
      ))}

      {/* ── Abschluss-Zeile ── */}
      <div style={{ margin: "8px 20px 16px",
        background: `linear-gradient(135deg, ${C.teal}08, ${C.coral}05)`,
        borderRadius: 18, padding: "16px 18px",
        border: `1px solid ${C.teal}15`,
        display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span className="hui-impact-dot" style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🌱</span>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
          Mit jeder Buchung und jedem Kauf fließen automatisch
          <strong style={{ color: C.teal }}> 2,5 %</strong> in echte Impact-Projekte.
          Du musst nichts tun — es passiert von selbst.
        </div>
      </div>

      {/* ── Overlays ── */}
      {detailProj && (
        <ProjectDetail
          project={detailProj}
          onClose={() => setDetailProj(null)}
          onDonate={p => { setDetailProj(null); setDonateProj(p); }}
          votes={votes}
          onVote={handleVote}
        />
      )}
      {donateProj && (
        <DonateOverlay
          project={donateProj}
          onClose={() => setDonateProj(null)}
        />
      )}
      {showPropose && (
        <ProposeOverlay onClose={() => setShowPropose(false)} />
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Users, Calendar, Award, ChevronDown, ChevronUp } from "lucide-react";
import { HuiImpactProject, HuiPayment } from "@/api/entities";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const GREEN = "#16a34a";
const PURPLE = "#8B5CF6";

const fmt = (n) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(n) || 0);

// Mock 6-Monats-Daten für Projekte
const MOCK_HISTORY = [
  {
    id: "p1", name: "Schule für alle", emoji: "🏫", category: "Bildung", color: TEAL,
    description: "Bildungszugang für benachteiligte Kinder in Uganda – Bau neuer Klassenräume und Lehrmaterial.",
    location: "Uganda",
    awarded_eur: 1240,
    votes: 312,
    month: "2025-11",
    timeline: [
      { date: "Nov 2025", event: "Projekt eingereicht", icon: "📋", type: "milestone" },
      { date: "Dez 2025", event: "Zur Abstimmung nominiert", icon: "🗳️", type: "vote" },
      { date: "Jan 2026", event: "Abstimmungssieger (312 Stimmen)", icon: "🏆", type: "win" },
      { date: "Feb 2026", event: "1.240 € ausgeschüttet", icon: "💰", type: "payout" },
      { date: "Mär 2026", event: "12 neue Schulbänke geliefert", icon: "🪑", type: "impact" },
      { date: "Apr 2026", event: "47 Kinder profitieren direkt", icon: "👦", type: "impact" },
    ],
    impactMetrics: [
      { label: "Schulbänke", value: "12", icon: "🪑" },
      { label: "Kinder", value: "47", icon: "👦" },
      { label: "Lehrbücher", value: "130", icon: "📚" },
    ],
    monthlyData: [110, 0, 0, 0, 0, 0],
  },
  {
    id: "p2", name: "Bäume für Kenia", emoji: "🌳", category: "Umwelt", color: GREEN,
    description: "Aufforstungsprojekt im Hochland Kenias – 500 einheimische Bäume zur CO₂-Kompensation.",
    location: "Kenia",
    awarded_eur: 890,
    votes: 247,
    month: "2025-12",
    timeline: [
      { date: "Okt 2025", event: "Projektvorbereitung gestartet", icon: "🌱", type: "milestone" },
      { date: "Nov 2025", event: "Community-Vorstellung", icon: "👥", type: "milestone" },
      { date: "Dez 2025", event: "Abstimmungssieger", icon: "🏆", type: "win" },
      { date: "Jan 2026", event: "890 € ausgeschüttet", icon: "💰", type: "payout" },
      { date: "Feb 2026", event: "Erste 200 Bäume gepflanzt", icon: "🌳", type: "impact" },
      { date: "Apr 2026", event: "Insgesamt 312 Bäume gepflanzt", icon: "🌍", type: "impact" },
    ],
    impactMetrics: [
      { label: "Bäume gepflanzt", value: "312", icon: "🌳" },
      { label: "CO₂ gebunden", value: "1,8 t", icon: "☁️" },
      { label: "Hektar", value: "0,4", icon: "📐" },
    ],
    monthlyData: [0, 890, 0, 0, 0, 0],
  },
  {
    id: "p3", name: "Tierheim Hamburg", emoji: "🐾", category: "Tierschutz", color: CORAL,
    description: "Renovierung und medizinische Grundversorgung für das Tierheim Hamburg-Bramfeld.",
    location: "Hamburg",
    awarded_eur: 650,
    votes: 198,
    month: "2026-01",
    timeline: [
      { date: "Nov 2025", event: "Antrag gestellt", icon: "📋", type: "milestone" },
      { date: "Jan 2026", event: "Abstimmungssieger", icon: "🏆", type: "win" },
      { date: "Feb 2026", event: "650 € ausgeschüttet", icon: "💰", type: "payout" },
      { date: "Mär 2026", event: "Tierarzt-Grundversorgung finanziert", icon: "🏥", type: "impact" },
    ],
    impactMetrics: [
      { label: "Tiere versorgt", value: "89", icon: "🐕" },
      { label: "Vet-Behandlungen", value: "34", icon: "💉" },
      { label: "Adoptionen", value: "12", icon: "❤️" },
    ],
    monthlyData: [0, 0, 650, 0, 0, 0],
  },
  {
    id: "p4", name: "Stadtgarten München", emoji: "🌿", category: "Nachhaltigkeit", color: PURPLE,
    description: "Gemeinschaftlicher Urban-Farming-Garten in München-Schwabing für alle Generationen.",
    location: "München",
    awarded_eur: 1050,
    votes: 289,
    month: "2026-02",
    timeline: [
      { date: "Dez 2025", event: "Konzept eingereicht", icon: "📋", type: "milestone" },
      { date: "Feb 2026", event: "Abstimmungssieger (289 Stimmen)", icon: "🏆", type: "win" },
      { date: "Feb 2026", event: "1.050 € ausgeschüttet", icon: "💰", type: "payout" },
      { date: "Mär 2026", event: "Garten-Fläche gepachtet", icon: "🏡", type: "impact" },
      { date: "Apr 2026", event: "Erster Pflanztag mit 24 Freiwilligen", icon: "🧑‍🌾", type: "impact" },
    ],
    impactMetrics: [
      { label: "m² Gartenfläche", value: "180", icon: "📐" },
      { label: "Freiwillige", value: "24", icon: "🧑‍🌾" },
      { label: "Gemüsesorten", value: "18", icon: "🥦" },
    ],
    monthlyData: [0, 0, 0, 1050, 0, 0],
  },
  {
    id: "p5", name: "Lernwerkstatt Berlin", emoji: "📚", category: "Bildung", color: GOLD,
    description: "Kostenlose Nachhilfestunden und Berufsorientierung für Jugendliche aus einkommensschwachen Familien.",
    location: "Berlin",
    awarded_eur: 780,
    votes: 221,
    month: "2026-03",
    timeline: [
      { date: "Jan 2026", event: "Bewerbung eingereicht", icon: "📋", type: "milestone" },
      { date: "Mär 2026", event: "Abstimmungssieger", icon: "🏆", type: "win" },
      { date: "Mär 2026", event: "780 € ausgeschüttet", icon: "💰", type: "payout" },
      { date: "Apr 2026", event: "Workshop-Räume gemietet", icon: "🏫", type: "impact" },
    ],
    impactMetrics: [
      { label: "Jugendliche", value: "31", icon: "🧑‍🎓" },
      { label: "Unterrichtsstunden", value: "120", icon: "⏱️" },
      { label: "Lehrkräfte", value: "6", icon: "👩‍🏫" },
    ],
    monthlyData: [0, 0, 0, 0, 780, 0],
  },
  {
    id: "p6", name: "Meeresschutz Ostsee", emoji: "🌊", category: "Umwelt", color: "#0ea5e9",
    description: "Strandreinigungs-Initiative und Bewusstseinskampagne für saubere Ostseeküsten.",
    location: "Rügen, DE",
    awarded_eur: 920,
    votes: 263,
    month: "2026-04",
    timeline: [
      { date: "Feb 2026", event: "Projektinitiative gegründet", icon: "🌱", type: "milestone" },
      { date: "Apr 2026", event: "Abstimmungssieger (263 Stimmen)", icon: "🏆", type: "win" },
      { date: "Apr 2026", event: "920 € ausgeschüttet", icon: "💰", type: "payout" },
    ],
    impactMetrics: [
      { label: "kg Müll gesammelt", value: "340", icon: "🗑️" },
      { label: "Km Küste gereinigt", value: "12", icon: "📏" },
      { label: "Freiwillige", value: "58", icon: "🤝" },
    ],
    monthlyData: [0, 0, 0, 0, 0, 920],
  },
];

const MONTHS_LABELS = ["Nov '25", "Dez '25", "Jan '26", "Feb '26", "Mär '26", "Apr '26"];
const CATEGORY_COLORS = {
  "Bildung": GOLD, "Umwelt": GREEN, "Tierschutz": CORAL, "Nachhaltigkeit": PURPLE,
};

function TimelineEvent({ event }) {
  const typeStyle = {
    milestone: { bg: "#f3f3f3", color: "#888", border: "#e0e0e0" },
    vote: { bg: `${TEAL}15`, color: TEAL, border: `${TEAL}30` },
    win: { bg: `${GOLD}15`, color: GOLD, border: `${GOLD}30` },
    payout: { bg: `${GREEN}15`, color: GREEN, border: `${GREEN}30` },
    impact: { bg: `${CORAL}10`, color: CORAL, border: `${CORAL}25` },
  };
  const style = typeStyle[event.type] || typeStyle.milestone;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: style.bg, border: `1.5px solid ${style.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {event.icon}
        </div>
      </div>
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 1 }}>{event.date}</div>
        <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{event.event}</div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onSelect, rank }) {
  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const rankBg = rank <= 3 ? rankColors[rank - 1] + "22" : "#f5f5f3";
  const rankBorder = rank <= 3 ? rankColors[rank - 1] + "55" : "#eee";

  return (
    <div onClick={() => onSelect(project)}
      style={{ background: "white", borderRadius: 18, border: `2px solid ${rankBorder}`, padding: "16px", marginBottom: 12, cursor: "pointer", boxShadow: rank <= 3 ? `0 4px 16px ${rankColors[rank - 1]}22` : "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Rank */}
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: rankBg, border: `1.5px solid ${rankBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0, color: rank <= 3 ? rankColors[rank - 1] : "#aaa" }}>
          {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : `#${rank}`}
        </div>
        {/* Emoji + Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{project.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>{project.name}</div>
              <div style={{ fontSize: 11, color: project.color, fontWeight: 600 }}>{project.category} · {project.location}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginBottom: 10 }}>{project.description}</div>

          {/* Mini Bar Chart */}
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 36, marginBottom: 8 }}>
            {project.monthlyData.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "100%", borderRadius: "3px 3px 0 0", background: v > 0 ? project.color : "#f0f0ee", height: v > 0 ? 32 : 4, transition: "height 0.4s ease" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {MONTHS_LABELS.map((m, i) => (
              <div key={i} style={{ flex: 1, fontSize: 8, color: "#bbb", textAlign: "center" }}>{m.split(" ")[0]}</div>
            ))}
          </div>
        </div>
        {/* Amount */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 20, color: project.color }}>{fmt(project.awarded_eur)} €</div>
          <div style={{ fontSize: 10, color: "#aaa" }}>ausgeschüttet</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4, fontWeight: 600 }}>
            🗳️ {project.votes} Stimmen
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ project, onClose }) {
  const [tab, setTab] = useState("timeline");
  const maxMonthly = Math.max(...project.monthlyData);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${project.color}20, ${project.color}08)`, borderRadius: "24px 24px 0 0", padding: "20px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <button onClick={onClose} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ArrowLeft size={16} color="#444" />
            </button>
            <span style={{ fontSize: 32 }}>{project.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 17, color: "#222" }}>{project.name}</div>
              <div style={{ fontSize: 12, color: project.color, fontWeight: 600 }}>{project.category} · 📍 {project.location}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: project.color }}>{fmt(project.awarded_eur)} €</div>
              <div style={{ fontSize: 10, color: "#aaa" }}>erhalten</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {[["timeline", "📅 Timeline"], ["impact", "🌍 Impact"], ["daten", "📊 Daten"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ flex: 1, background: "none", border: "none", borderBottom: tab === id ? `2.5px solid ${project.color}` : "2.5px solid transparent", padding: "10px 4px 12px", fontWeight: tab === id ? 700 : 500, fontSize: 12, color: tab === id ? project.color : "#aaa", cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {tab === "timeline" && (
            <div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.6 }}>{project.description}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>Projekt-Timeline</div>
              {/* Vertical timeline */}
              <div style={{ position: "relative", paddingLeft: 14 }}>
                <div style={{ position: "absolute", left: 16, top: 0, bottom: 0, width: 2, background: `${project.color}25`, borderRadius: 2 }} />
                {project.timeline.map((event, i) => (
                  <TimelineEvent key={i} event={event} />
                ))}
              </div>
            </div>
          )}

          {tab === "impact" && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>Nachgewiesener Impact</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {project.impactMetrics.map((m, i) => (
                  <div key={i} style={{ flex: 1, background: `${project.color}10`, border: `1.5px solid ${project.color}25`, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: project.color, lineHeight: 1 }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: `${project.color}08`, border: `1px solid ${project.color}20`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 6 }}>🌍 Gesamtbewertung</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                  Mit {fmt(project.awarded_eur)} € aus dem HUI Impact Pool konnte dieses Projekt echte und messbare Veränderungen bewirken. Die Community hat mit {project.votes} Stimmen entschieden, dieses Projekt zu unterstützen.
                </div>
              </div>
            </div>
          )}

          {tab === "daten" && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>Monatlicher Verlauf</div>
              <div style={{ background: "#f9f9f7", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 8 }}>
                  {project.monthlyData.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      {v > 0 && <div style={{ fontSize: 8, fontWeight: 700, color: project.color }}>{fmt(v)}€</div>}
                      <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: v > 0 ? `linear-gradient(180deg, ${project.color}, ${project.color}88)` : "#e8e8e8", height: v > 0 ? `${(v / maxMonthly) * 64}px` : "4px", minHeight: 4, transition: "height 0.5s ease" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {MONTHS_LABELS.map((m, i) => (
                    <div key={i} style={{ flex: 1, fontSize: 9, color: project.monthlyData[i] > 0 ? project.color : "#bbb", textAlign: "center", fontWeight: project.monthlyData[i] > 0 ? 700 : 400 }}>{m}</div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Ausgeschüttet", value: `${fmt(project.awarded_eur)} €`, color: project.color, icon: "💰" },
                  { label: "Community-Stimmen", value: project.votes, color: TEAL, icon: "🗳️" },
                  { label: "Abstimmungsmonat", value: project.month.replace("-", "/"), color: "#888", icon: "📅" },
                  { label: "Kategorie", value: project.category, color: CATEGORY_COLORS[project.category] || "#888", icon: "🏷️" },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ background: "white", border: "1.5px solid #f0f0ee", borderRadius: 12, padding: "14px" }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color }}>{value}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImpactPoolVisualization({ onClose }) {
  const [projects, setProjects] = useState(MOCK_HISTORY);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("rangliste");
  const [animatedBars, setAnimatedBars] = useState(false);
  const [liveData, setLiveData] = useState([]);

  useEffect(() => {
    setTimeout(() => setAnimatedBars(true), 200);
    // Try to load real data
    HuiImpactProject.list().catch(() => []).then(data => {
      if (data && data.length > 0) {
        const won = data.filter(p => p.status === "gewonnen" || p.status === "won");
        if (won.length > 0) setLiveData(won);
      }
    });
  }, []);

  const totalPool = projects.reduce((s, p) => s + p.awarded_eur, 0);
  const totalVotes = projects.reduce((s, p) => s + p.votes, 0);

  // Aggregated monthly totals
  const monthlyTotals = MONTHS_LABELS.map((_, i) =>
    projects.reduce((s, p) => s + (p.monthlyData[i] || 0), 0)
  );
  const maxMonthly = Math.max(...monthlyTotals);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "#f7f7f5", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}22, ${GREEN}10)`, padding: "18px 16px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="#444" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 19, color: "#222" }}>🌍 Impact Pool</div>
            <div style={{ fontSize: 12, color: "#888" }}>6-Monats-Übersicht & Projekthistorie</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { val: `${fmt(totalPool)} €`, label: "Gesamt ausgeschüttet", color: GREEN, icon: "💰" },
            { val: projects.length, label: "Projekte gefördert", color: TEAL, icon: "🏆" },
            { val: totalVotes, label: "Community-Stimmen", color: CORAL, icon: "🗳️" },
          ].map(({ val, label, color, icon }) => (
            <div key={label} style={{ flex: 1, background: "white", borderRadius: 14, padding: "12px 6px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
              <div style={{ fontWeight: 900, fontSize: 15, color }}>{val}</div>
              <div style={{ fontSize: 9, color: "#aaa", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {[["rangliste", "🏆 Rangliste"], ["verlauf", "📈 Verlauf"], ["kategorien", "🏷️ Kategorien"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ flex: 1, background: "none", border: "none", borderBottom: activeTab === id ? `2.5px solid ${TEAL}` : "2.5px solid transparent", padding: "10px 4px 12px", fontWeight: activeTab === id ? 700 : 500, fontSize: 12, color: activeTab === id ? TEAL : "#aaa", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 80px" }}>

        {/* RANGLISTE */}
        {activeTab === "rangliste" && (
          <>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12, fontWeight: 600 }}>
              Projekte sortiert nach erhaltenen Mitteln · letzte 6 Monate
            </div>
            {[...projects]
              .sort((a, b) => b.awarded_eur - a.awarded_eur)
              .map((project, i) => (
                <ProjectCard key={project.id} project={project} rank={i + 1} onSelect={setSelectedProject} />
              ))}
          </>
        )}

        {/* VERLAUF */}
        {activeTab === "verlauf" && (
          <>
            <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#222", marginBottom: 4 }}>Monatliche Ausschüttungen</div>
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>Gesamter Impact Pool — Nov 2025 bis Apr 2026</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, marginBottom: 8 }}>
                {monthlyTotals.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    {v > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: TEAL, textAlign: "center" }}>{fmt(v)}€</div>}
                    <div style={{ width: "100%", borderRadius: "5px 5px 0 0", background: v > 0 ? `linear-gradient(180deg, ${TEAL}, ${GREEN})` : "#f0f0ee", height: animatedBars && v > 0 ? `${(v / maxMonthly) * 80}px` : v > 0 ? "4px" : "4px", transition: "height 0.8s ease", minHeight: 4 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {MONTHS_LABELS.map((m, i) => (
                  <div key={i} style={{ flex: 1, fontSize: 9, color: monthlyTotals[i] > 0 ? TEAL : "#bbb", textAlign: "center", fontWeight: monthlyTotals[i] > 0 ? 700 : 400 }}>{m}</div>
                ))}
              </div>
            </div>

            {/* Stacked per project per month */}
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 10 }}>Aufschlüsselung nach Projekt</div>
            {MONTHS_LABELS.map((month, mi) => {
              const monthProjects = projects.filter(p => p.monthlyData[mi] > 0);
              if (monthProjects.length === 0) return null;
              return (
                <div key={mi} style={{ background: "white", borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>📅 {month}</div>
                    <div style={{ fontWeight: 900, fontSize: 15, color: GREEN }}>{fmt(monthlyTotals[mi])} €</div>
                  </div>
                  {monthProjects.map(proj => (
                    <div key={proj.id} onClick={() => setSelectedProject(proj)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #f5f5f3", cursor: "pointer" }}>
                      <span style={{ fontSize: 18 }}>{proj.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#222" }}>{proj.name}</div>
                        <div style={{ fontSize: 10, color: proj.color, fontWeight: 600 }}>{proj.category}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: proj.color }}>{fmt(proj.monthlyData[mi])} €</div>
                      <ChevronDown size={14} color="#ccc" style={{ transform: "rotate(-90deg)" }} />
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* KATEGORIEN */}
        {activeTab === "kategorien" && (
          <>
            {Object.entries(
              projects.reduce((acc, p) => {
                if (!acc[p.category]) acc[p.category] = { total: 0, projects: [], color: CATEGORY_COLORS[p.category] || "#888" };
                acc[p.category].total += p.awarded_eur;
                acc[p.category].projects.push(p);
                return acc;
              }, {})
            ).sort(([, a], [, b]) => b.total - a.total).map(([cat, data]) => (
              <div key={cat} style={{ background: "white", borderRadius: 16, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ background: `${data.color}15`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: data.color }}>{cat}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{data.projects.length} Projekt{data.projects.length !== 1 ? "e" : ""} gefördert</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: data.color }}>{fmt(data.total)} €</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>{Math.round((data.total / totalPool) * 100)}% des Pools</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: "#f0f0ee" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg, ${data.color}, ${data.color}88)`, width: animatedBars ? `${(data.total / totalPool) * 100}%` : "0%", transition: "width 1s ease" }} />
                </div>
                <div style={{ padding: "12px 16px" }}>
                  {data.projects.map((proj, i) => (
                    <div key={proj.id} onClick={() => setSelectedProject(proj)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i > 0 ? "1px solid #f5f5f3" : "none", cursor: "pointer" }}>
                      <span style={{ fontSize: 18 }}>{proj.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#222" }}>{proj.name}</div>
                        <div style={{ fontSize: 10, color: "#aaa" }}>📍 {proj.location} · 🗳️ {proj.votes} Stimmen</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: proj.color }}>{fmt(proj.awarded_eur)} €</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pie-like visual */}
            <div style={{ background: "white", borderRadius: 16, padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>📊 Verteilung</div>
              <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                {Object.entries(
                  projects.reduce((acc, p) => {
                    if (!acc[p.category]) acc[p.category] = { total: 0, color: CATEGORY_COLORS[p.category] || "#888" };
                    acc[p.category].total += p.awarded_eur;
                    return acc;
                  }, {})
                ).sort(([, a], [, b]) => b.total - a.total).map(([cat, data]) => (
                  <div key={cat} style={{ width: animatedBars ? `${(data.total / totalPool) * 100}%` : "0%", background: data.color, transition: "width 1.2s ease", height: "100%" }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(
                  projects.reduce((acc, p) => {
                    if (!acc[p.category]) acc[p.category] = { total: 0, color: CATEGORY_COLORS[p.category] || "#888" };
                    acc[p.category].total += p.awarded_eur;
                    return acc;
                  }, {})
                ).map(([cat, data]) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: data.color }} />
                    <span style={{ fontSize: 11, color: "#666" }}>{cat} ({Math.round((data.total / totalPool) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Project Detail Sheet */}
      {selectedProject && (
        <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
}
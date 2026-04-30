import { useState, useEffect } from "react";
import { HuiPayment, HuiWirker, HuiImpactProject } from "@/api/entities";

const C = {
  bg: "#0F172A", card: "#1E293B", border: "#334155",
  text: "#F1F5F9", muted: "#64748B", sub: "#94A3B8",
  orange: "#F97316", green: "#10B981", teal: "#0D9488",
  blue: "#0EA5E9", red: "#EF4444", gold: "#F59E0B",
  purple: "#8B5CF6",
};

const fmt = (n) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(n) || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }) : "–";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_PAYMENTS = [
  { id: "p1", created_date: "2026-04-30T10:22:00Z", wirker_name: "Marcus B.", item_name: "Fotografie – 1h", amount_eur: "82.35", impact_eur: "2.47", status: "ausgezahlt", payment_status: "paid", empfehlung: "empfohlen" },
  { id: "p2", created_date: "2026-04-29T15:04:00Z", wirker_name: "Sofia M.", item_name: "Keramik-Workshop", amount_eur: "75.00", impact_eur: "2.25", status: "escrow", payment_status: "paid", empfehlung: "ausstehend" },
  { id: "p3", created_date: "2026-04-28T09:11:00Z", wirker_name: "Maria L.", item_name: "Yoga – 1h", amount_eur: "60.00", impact_eur: "1.80", status: "ausgezahlt", payment_status: "paid", empfehlung: "empfohlen" },
  { id: "p4", created_date: "2026-04-27T14:30:00Z", wirker_name: "Tom H.", item_name: "Leder-Rucksack", amount_eur: "195.00", impact_eur: "5.85", status: "ausgezahlt", payment_status: "paid", empfehlung: "empfohlen" },
  { id: "p5", created_date: "2026-04-26T11:45:00Z", wirker_name: "Lena K.", item_name: "Aquarell-Portrait", amount_eur: "120.00", impact_eur: "3.60", status: "rueckerstattung", payment_status: "refunded", empfehlung: "nicht_empfohlen" },
];
const MOCK_WIRKER = [
  { id: "w1", name: "Marcus B.", full_name: "Marcus Braun", talent: "Fotograf", location: "Berlin", hourly_rate: 70, bookings: 47, followers: 312, impact_eur: 58.20, verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", bio: "Ich fange Momente ein.", skills: ["Fotografie","Video"] },
  { id: "w2", name: "Sofia M.", full_name: "Sofia Müller", talent: "Keramik-Künstlerin", location: "München", hourly_rate: 45, bookings: 58, followers: 218, impact_eur: 47.25, verified: true, img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", bio: "Handgemachte Keramik.", skills: ["Keramik"] },
  { id: "w3", name: "Maria L.", full_name: "Maria Lopez", talent: "Yoga", location: "Hamburg", hourly_rate: 40, bookings: 93, followers: 445, impact_eur: 83.70, verified: true, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", bio: "Yoga für alle.", skills: ["Yoga","Meditation"] },
];
const MOCK_PROJECTS = [
  { id: "mp1", name: "Stadtgarten Berlin", category: "Umwelt", description: "Gemeinschaftsgärten in Berliner Kiezen.", icon: "🌱", votes: 38, status: "aktiv", month: "2026-04", awarded_eur: 0 },
  { id: "mp2", name: "Musik für Kinder", category: "Soziales", description: "Kostenloser Musikunterricht für Kinder.", icon: "🎵", votes: 27, status: "aktiv", month: "2026-04", awarded_eur: 0 },
  { id: "mp3", name: "Repair Café Hamburg", category: "Nachhaltigkeit", description: "Dinge reparieren statt wegwerfen.", icon: "🔧", votes: 19, status: "aktiv", month: "2026-04", awarded_eur: 0 },
  { id: "mp4", name: "Bienen retten München", category: "Umwelt", description: "Wildblumenwiesen in Stadtparks.", icon: "🐝", votes: 52, status: "gewonnen", month: "2026-03", awarded_eur: 184.5, distributed_at: "2026-03-31T18:00:00Z", impact_report: "12 Wildblumenwiesen angelegt. HUI wurde in 3 Medien erwähnt." },
  { id: "mp5", name: "Foodsharing Stuttgart", category: "Soziales", description: "Lebensmittelverschwendung bekämpfen.", icon: "🥗", votes: 63, status: "gewonnen", month: "2026-02", awarded_eur: 142.2, distributed_at: "2026-02-28T18:00:00Z", impact_report: "4 Kühlschränke aufgestellt. Ca. 200 Personen profitieren monatlich." },
];

// ── COMPONENTS ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 24, color: color || C.text }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, color, bg }) {
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: `1px solid ${color}44` }}>{label}</span>;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState("uebersicht");
  const [impactTab, setImpactTab] = useState("runde");

  const [payments, setPayments] = useState([]);
  const [wirker, setWirker] = useState([]);
  const [projects, setProjects] = useState([]);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Impact Pool state
  const [votingOpen, setVotingOpen] = useState(false);
  const [votingStart, setVotingStart] = useState("");
  const [votingEnd, setVotingEnd] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [nominatedIds, setNominatedIds] = useState(["mp1", "mp2", "mp3"]);
  const [distributeTarget, setDistributeTarget] = useState(null);

  // Modals
  const [editWirker, setEditWirker] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", category: "Soziales", description: "", icon: "🌱", website: "", contact_name: "", contact_email: "", img: "" });

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function load() {
      try {
        const [p, w, pr] = await Promise.all([
          HuiPayment.list(),
          HuiWirker.list(),
          HuiImpactProject.list(),
        ]);
        setPayments(p.length ? p : MOCK_PAYMENTS);
        setWirker(w.length ? w : MOCK_WIRKER);
        setProjects(pr.length ? pr : MOCK_PROJECTS);
        setUsingMock(!p.length && !w.length && !pr.length);
      } catch {
        setPayments(MOCK_PAYMENTS);
        setWirker(MOCK_WIRKER);
        setProjects(MOCK_PROJECTS);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalRevenue = payments.filter(p => p.payment_status === "paid").reduce((s, p) => s + parseFloat(p.amount_eur || 0), 0);
  const totalImpact = payments.filter(p => p.payment_status === "paid").reduce((s, p) => s + parseFloat(p.impact_eur || 0), 0);
  const huiEarnings = payments.filter(p => p.payment_status === "paid").reduce((s, p) => s + parseFloat(p.amount_eur || 0) * 0.1275, 0);
  const escrowCount = payments.filter(p => p.status === "escrow").length;

  async function uploadProjectImage(file, setter) {
    setUploadingImg(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Store as base64 data URL for mock, or upload for real
        setter(prev => ({ ...prev, img: e.target.result }));
        setUploadingImg(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImg(false);
    }
  }

  async function saveWirker(w) {
    try {
      if (!usingMock) await HuiWirker.update(w.id, w);
      setWirker(prev => prev.map(x => x.id === w.id ? w : x));
      setEditWirker(null);
      showToast("Wirker gespeichert ✓");
    } catch { showToast("Fehler beim Speichern", "error"); }
  }

  async function saveProject(p) {
    try {
      if (!usingMock) await HuiImpactProject.update(p.id, p);
      setProjects(prev => prev.map(x => x.id === p.id ? p : x));
      setEditProject(null);
      showToast("Projekt gespeichert ✓");
    } catch { showToast("Fehler beim Speichern", "error"); }
  }

  async function createProject() {
    const proj = { ...newProject, votes: 0, status: "aktiv", month: new Date().toISOString().slice(0, 7), awarded_eur: 0, id: "new_" + Date.now() };
    try {
      if (!usingMock) {
        const created = await HuiImpactProject.create(proj);
        setProjects(prev => [...prev, created]);
      } else {
        setProjects(prev => [...prev, proj]);
      }
      setShowNewProject(false);
      setNewProject({ name: "", category: "Soziales", description: "", icon: "🌱", website: "", contact_name: "", contact_email: "" });
      showToast("Projekt erstellt ✓");
    } catch { showToast("Fehler beim Erstellen", "error"); }
  }

  async function distributePool() {
    if (!distributeTarget) return;
    const amount = parseFloat(totalImpact.toFixed(2));
    if (!window.confirm(`${fmt(amount)} € an "${distributeTarget.name}" ausschütten?`)) return;
    try {
      const updated = { ...distributeTarget, status: "gewonnen", awarded_eur: amount, distributed_at: new Date().toISOString() };
      if (!usingMock) await HuiImpactProject.update(distributeTarget.id, updated);
      setProjects(prev => prev.map(p => {
        if (p.id === distributeTarget.id) return updated;
        if (nominatedIds.includes(p.id)) return { ...p, status: "archiviert" };
        return p;
      }));
      setNominatedIds([]);
      setDistributeTarget(null);
      setVotingOpen(false);
      showToast(`💸 ${fmt(amount)} € ausgeschüttet!`);
    } catch { showToast("Fehler bei Ausschüttung", "error"); }
  }

  const TABS = [
    { key: "uebersicht", label: "📊 Übersicht" },
    { key: "zahlungen", label: "💳 Zahlungen" },
    { key: "wirker", label: "👥 Wirker" },
    { key: "impact", label: "🌱 Impact Pool" },
  ];

  const IMPACT_TABS = [
    { key: "runde", label: "🗓️ Aktuelle Runde" },
    { key: "projekte", label: "📋 Alle Projekte" },
    { key: "ausschuettung", label: "💸 Ausschüttung" },
    { key: "history", label: "🏆 History" },
  ];

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.muted, fontSize: 16 }}>Lade Daten...</div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "error" ? C.red : C.green, color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0D9488,#F97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌱</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>HUI Admin</div>
            <div style={{ fontSize: 11, color: C.muted }}>Human United Intelligent</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {usingMock && <span style={{ background: "#7C3AED22", color: "#A78BFA", border: "1px solid #7C3AED", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Demo-Daten</span>}
          <span style={{ fontSize: 12, color: C.muted }}>● Live · {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 24px", gap: 4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.key ? `2px solid ${C.orange}` : "2px solid transparent",
            color: tab === t.key ? C.orange : C.muted,
            padding: "14px 16px", cursor: "pointer", fontWeight: tab === t.key ? 700 : 500,
            fontSize: 14, marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── ÜBERSICHT ── */}
        {tab === "uebersicht" && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Übersicht</h2>
            <p style={{ color: C.muted, marginBottom: 24 }}>Alle wichtigen Zahlen auf einen Blick</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
              <StatCard icon="💰" value={`${fmt(totalRevenue)} €`} label="Gesamtumsatz" sub={`${payments.filter(p=>p.payment_status==="paid").length} Buchungen`} color={C.green} />
              <StatCard icon="🏦" value={`${fmt(huiEarnings)} €`} label="HUI Einnahmen" sub="12,75% der Buchungen" color={C.blue} />
              <StatCard icon="🌱" value={`${fmt(totalImpact)} €`} label="Impact Pool" sub="2,25% aus jeder Buchung" color={C.teal} />
              <StatCard icon="⏳" value={escrowCount} label="Treuhand offen" sub="warten auf Freigabe" color={C.orange} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>⏳ Offene Treuhand-Buchungen</div>
                {payments.filter(p => p.status === "escrow").length === 0
                  ? <div style={{ color: C.muted, fontSize: 14 }}>Keine offenen Buchungen</div>
                  : payments.filter(p => p.status === "escrow").map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.wirker_name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{p.item_name}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: C.gold }}>{fmt(p.amount_eur)} €</div>
                    </div>
                  ))
                }
              </div>
              <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🏆 Top Wirker</div>
                {[...wirker].sort((a,b) => (b.bookings||0)-(a.bookings||0)).slice(0,4).map((w,i) => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted, fontWeight: 700, fontSize: 13, width: 20 }}>#{i+1}</span>
                    <img src={w.img} alt={w.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{w.full_name || w.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{w.talent}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{w.bookings} Buchungen</div>
                      {w.verified && <div style={{ fontSize: 11, color: C.green }}>✓ Verifiziert</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ZAHLUNGEN ── */}
        {tab === "zahlungen" && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Zahlungen</h2>
            <p style={{ color: C.muted, marginBottom: 24 }}>Alle Transaktionen im Überblick</p>
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Datum","Wirker","Leistung","Betrag","Impact","Status","Empfehlung"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const statusColors = {
                      ausgezahlt: { color: C.green, label: "Ausgezahlt" },
                      escrow: { color: C.gold, label: "Treuhand" },
                      rueckerstattung: { color: C.red, label: "Rückerstattung" },
                    };
                    const sc = statusColors[p.status] || { color: C.muted, label: p.status };
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: C.sub }}>{fmtDate(p.created_date)}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>{p.wirker_name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: C.sub }}>{p.item_name}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: C.green }}>{fmt(p.amount_eur)} €</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: C.teal }}>{fmt(p.impact_eur)} €</td>
                        <td style={{ padding: "12px 16px" }}><Badge label={sc.label} color={sc.color} bg={sc.color + "22"} /></td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: p.empfehlung === "empfohlen" ? C.green : C.muted }}>{p.empfehlung === "empfohlen" ? "✓ Empfohlen" : p.empfehlung === "ausstehend" ? "⏳ Ausstehend" : "✗ Nicht empf."}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WIRKER ── */}
        {tab === "wirker" && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Wirker</h2>
            <p style={{ color: C.muted, marginBottom: 24 }}>Alle registrierten Talente verwalten</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: 16 }}>
              {wirker.map(w => (
                <div key={w.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                  <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                    <img src={w.img} alt={w.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{w.full_name || w.name}</span>
                        {w.verified && <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.teal, fontWeight: 600 }}>{w.talent}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{w.location}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>{w.hourly_rate} €/h</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "Buchungen", value: w.bookings || 0 },
                      { label: "Follower", value: w.followers || 0 },
                      { label: "Impact", value: `${fmt(w.impact_eur)} €` },
                    ].map(s => (
                      <div key={s.label} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditWirker({ ...w })} style={{ flex: 1, background: "#1E3A5F", color: C.blue, border: `1px solid ${C.blue}`, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✏️ Bearbeiten</button>
                    <button onClick={() => {
                      const updated = { ...w, verified: !w.verified };
                      saveWirker(updated);
                    }} style={{ flex: 1, background: w.verified ? "#064E3B" : C.bg, color: w.verified ? C.green : C.muted, border: `1px solid ${w.verified ? C.green : C.border}`, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      {w.verified ? "✓ Verifiziert" : "○ Verifizieren"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── IMPACT POOL ── */}
        {tab === "impact" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🌱 Impact Pool</h2>
                <p style={{ color: C.muted, margin: "4px 0 0" }}>Gesammelte Mittel, Abstimmung & Ausschüttung</p>
              </div>
              <button onClick={() => setShowNewProject(true)} style={{ background: C.teal + "22", color: C.teal, border: `1px solid ${C.teal}`, padding: "10px 20px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>+ Projekt hinzufügen</button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard icon="💰" value={`${fmt(totalImpact)} €`} label="Aktueller Pool" color={C.gold} />
              <StatCard icon="📌" value={`${nominatedIds.length}/3`} label="Nominierte Projekte" color={C.teal} />
              <StatCard icon="🗳️" value={projects.filter(p => nominatedIds.includes(p.id)).reduce((s,p) => s+(p.votes||0), 0)} label="Abgegebene Stimmen" color={C.blue} />
              <StatCard icon={votingOpen ? "🟢" : "🔴"} value={votingOpen ? "Offen" : "Geschlossen"} label="Abstimmungsstatus" color={votingOpen ? C.green : C.red} />
            </div>

            {/* Sub-Nav */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
              {IMPACT_TABS.map(t => (
                <button key={t.key} onClick={() => setImpactTab(t.key)} style={{
                  background: "none", border: "none",
                  borderBottom: impactTab === t.key ? `2px solid ${C.teal}` : "2px solid transparent",
                  color: impactTab === t.key ? C.teal : C.muted,
                  padding: "10px 18px", cursor: "pointer",
                  fontWeight: impactTab === t.key ? 700 : 500, fontSize: 13, marginBottom: -1,
                }}>{t.label}</button>
              ))}
            </div>

            {/* RUNDE */}
            {impactTab === "runde" && (
              <div>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Abstimmungszeitraum festlegen</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>START</label>
                        <input type="datetime-local" value={votingStart} onChange={e => setVotingStart(e.target.value)}
                          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>ENDE</label>
                        <input type="datetime-local" value={votingEnd} onChange={e => setVotingEnd(e.target.value)}
                          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    {votingStart && votingEnd && (
                      <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.sub, marginBottom: 16 }}>
                        📅 Abstimmung läuft vom <strong style={{ color: C.text }}>{new Date(votingStart).toLocaleDateString("de-DE", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}</strong> bis <strong style={{ color: C.text }}>{new Date(votingEnd).toLocaleDateString("de-DE", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}</strong>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: votingOpen ? C.green : C.muted }}>
                          {votingOpen ? "🟢 Abstimmung läuft" : "🔴 Abstimmung nicht aktiv"}
                        </div>
                        {!votingStart && !votingEnd && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Zeitraum oben festlegen</div>}
                      </div>
                      <button onClick={() => {
                        if (!votingOpen && (!votingStart || !votingEnd)) { showToast("Bitte Start- und Enddatum setzen", "error"); return; }
                        setVotingOpen(v => !v);
                      }} style={{
                        background: votingOpen ? "#064E3B" : "#1E3A5F",
                        color: votingOpen ? C.green : C.blue,
                        border: `1px solid ${votingOpen ? C.green : C.blue}`,
                        padding: "9px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13
                      }}>{votingOpen ? "⏸ Pausieren" : "▶ Abstimmung starten"}</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowNominateModal(true)} style={{ flex: 1, background: C.teal + "22", color: C.teal, border: `1px solid ${C.teal}`, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>📌 Projekte nominieren</button>
                    <button onClick={() => setImpactTab("ausschuettung")} style={{ flex: 1, background: C.gold + "22", color: C.gold, border: `1px solid ${C.gold}`, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>💸 Pool ausschütten</button>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Nominierte Projekte ({nominatedIds.length}/3)</div>
                {nominatedIds.length === 0
                  ? <div style={{ background: C.card, borderRadius: 14, border: `1px dashed ${C.border}`, padding: 32, textAlign: "center", color: C.muted }}>Noch keine Projekte nominiert.</div>
                  : (() => {
                    const nominated = projects.filter(p => nominatedIds.includes(p.id));
                    const totalVotes = nominated.reduce((s,p) => s+(p.votes||0), 0);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[...nominated].sort((a,b) => (b.votes||0)-(a.votes||0)).map((proj, i) => {
                          const pct = totalVotes > 0 ? Math.round((proj.votes||0)/totalVotes*100) : 0;
                          const isLeading = i === 0 && totalVotes > 0;
                          return (
                            <div key={proj.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${isLeading ? C.gold : C.border}`, padding: 18 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                <span style={{ fontSize: 24 }}>{proj.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>{proj.name}</span>
                                    {isLeading && <Badge label="🥇 Führend" color={C.gold} bg={C.gold + "22"} />}
                                  </div>
                                  <div style={{ fontSize: 12, color: C.muted }}>{proj.category} · {proj.votes||0} Stimmen</div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 22, color: isLeading ? C.gold : C.text }}>{pct}%</div>
                              </div>
                              <div style={{ height: 8, background: C.bg, borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: isLeading ? `linear-gradient(90deg,${C.gold},#F97316)` : `linear-gradient(90deg,${C.teal},${C.blue})`, borderRadius: 99 }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button onClick={() => { setDistributeTarget(proj); setImpactTab("ausschuettung"); }} style={{ background: C.gold + "22", color: C.gold, border: `1px solid ${C.gold}`, padding: "5px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>🏆 Als Gewinner wählen</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                }
              </div>
            )}

            {/* ALLE PROJEKTE */}
            {impactTab === "projekte" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {projects.map(proj => (
                  <div key={proj.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      {proj.img
                        ? <img src={proj.img} alt={proj.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                        : <span style={{ fontSize: 28 }}>{proj.icon}</span>
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{proj.name}</span>
                          <Badge
                            label={proj.status === "gewonnen" ? "🏆 Gewinner" : proj.status === "archiviert" ? "📦 Archiviert" : "🗳️ Aktiv"}
                            color={proj.status === "gewonnen" ? C.gold : proj.status === "archiviert" ? C.muted : C.teal}
                            bg={proj.status === "gewonnen" ? C.gold + "22" : proj.status === "archiviert" ? C.border : C.teal + "22"}
                          />
                          <span style={{ fontSize: 12, color: C.muted }}>{proj.category} · {proj.month}</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{proj.description}</div>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted }}>
                          <span>🗳️ {proj.votes||0} Stimmen</span>
                          {proj.awarded_eur > 0 && <span style={{ color: C.gold }}>💰 {proj.awarded_eur} € vergeben</span>}
                        </div>
                        {proj.impact_report && (
                          <div style={{ marginTop: 10, background: C.bg, borderRadius: 8, padding: 12, fontSize: 12, color: C.sub, borderLeft: `3px solid ${C.green}` }}>📝 {proj.impact_report}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => {
                          if (nominatedIds.includes(proj.id)) setNominatedIds(ids => ids.filter(id => id !== proj.id));
                          else if (nominatedIds.length < 3) setNominatedIds(ids => [...ids, proj.id]);
                          else showToast("Maximal 3 Projekte nominierbar", "error");
                        }} style={{
                          background: nominatedIds.includes(proj.id) ? C.teal + "22" : C.bg,
                          color: nominatedIds.includes(proj.id) ? C.teal : C.muted,
                          border: `1px solid ${nominatedIds.includes(proj.id) ? C.teal : C.border}`,
                          padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12
                        }}>{nominatedIds.includes(proj.id) ? "📌 Nominiert" : "📌"}</button>
                        <button onClick={() => setEditProject({ ...proj })} style={{ background: "#1E3A5F", color: C.blue, border: `1px solid ${C.blue}`, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✏️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AUSSCHÜTTUNG */}
            {impactTab === "ausschuettung" && (
              <div>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Pool ausschütten</div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Wähle das Gewinnerprojekt und schütte den Pool aus.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>VERFÜGBARER POOL</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: C.gold }}>{fmt(totalImpact)} €</div>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>LETZTER GEWINNER</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{projects.find(p => p.status === "gewonnen")?.name || "Noch keiner"}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 10 }}>GEWINNERPROJEKT WÄHLEN</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {projects.filter(p => nominatedIds.includes(p.id)).length === 0
                      ? <div style={{ background: C.bg, borderRadius: 10, padding: 16, color: C.muted, fontSize: 13, textAlign: "center" }}>Zuerst Projekte unter "Aktuelle Runde" nominieren</div>
                      : projects.filter(p => nominatedIds.includes(p.id)).map(proj => (
                        <button key={proj.id} onClick={() => setDistributeTarget(proj)} style={{
                          background: distributeTarget?.id === proj.id ? C.gold + "22" : C.bg,
                          border: `1px solid ${distributeTarget?.id === proj.id ? C.gold : C.border}`,
                          color: C.text, borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                          textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                        }}>
                          <span style={{ fontSize: 20 }}>{proj.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{proj.name}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>{proj.votes||0} Stimmen · {proj.category}</div>
                          </div>
                          {distributeTarget?.id === proj.id && <span style={{ color: C.gold, fontSize: 20 }}>✓</span>}
                        </button>
                      ))
                    }
                  </div>
                  <button onClick={distributePool} disabled={!distributeTarget} style={{
                    width: "100%", background: distributeTarget ? `linear-gradient(135deg,${C.gold},#F97316)` : C.border,
                    color: distributeTarget ? "#fff" : C.muted, border: "none",
                    padding: "14px 0", borderRadius: 12, cursor: distributeTarget ? "pointer" : "not-allowed",
                    fontWeight: 800, fontSize: 15
                  }}>{distributeTarget ? `💸 ${fmt(totalImpact)} € an ${distributeTarget.name} ausschütten` : "Zuerst ein Projekt auswählen"}</button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Vergangene Ausschüttungen</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {projects.filter(p => p.status === "gewonnen" && p.awarded_eur > 0).map(proj => (
                    <div key={proj.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.gold}33`, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 24 }}>{proj.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{proj.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{proj.month} · {proj.category}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: C.gold, fontSize: 18 }}>{proj.awarded_eur} €</div>
                        {proj.distributed_at && <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(proj.distributed_at)}</div>}
                      </div>
                      <Badge label="✓ Ausgezahlt" color={C.green} bg={C.green + "22"} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HISTORY */}
            {impactTab === "history" && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏆 Alle Förderrunden</div>
                {[...new Set(projects.map(p => p.month))].sort((a,b) => b.localeCompare(a)).map(month => {
                  const monthProjects = projects.filter(p => p.month === month);
                  const winner = monthProjects.find(p => p.status === "gewonnen");
                  return (
                    <div key={month} style={{ background: C.card, borderRadius: 16, border: `1px solid ${winner ? C.gold + "44" : C.border}`, padding: 20, marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <div style={{ background: C.bg, borderRadius: 10, padding: "6px 14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>📅 {new Date(month + "-01").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</span>
                        </div>
                        {winner && <span style={{ fontSize: 13, color: C.muted }}>Gewinner: <strong style={{ color: C.gold }}>{winner.icon} {winner.name}</strong>{winner.awarded_eur > 0 && ` · ${winner.awarded_eur} €`}</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {monthProjects.map(proj => (
                          <div key={proj.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, borderRadius: 10 }}>
                            <span style={{ fontSize: 18 }}>{proj.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{proj.name}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{proj.votes||0} Stimmen</div>
                            </div>
                            {proj.status === "gewonnen" && <Badge label="🏆 Gewonnen" color={C.gold} bg={C.gold + "22"} />}
                          </div>
                        ))}
                      </div>
                      {winner?.impact_report && (
                        <div style={{ marginTop: 12, background: C.bg, borderRadius: 10, padding: 14, fontSize: 13, color: C.sub, borderLeft: `3px solid ${C.green}` }}>
                          <div style={{ fontWeight: 700, color: C.green, fontSize: 11, marginBottom: 4 }}>📝 IMPACT REPORT</div>
                          {winner.impact_report}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Wirker bearbeiten */}
      {editWirker && (
        <Modal title={`${editWirker.full_name || editWirker.name} bearbeiten`} onClose={() => setEditWirker(null)}>
          {[
            { label: "Vollständiger Name", key: "full_name", type: "text" },
            { label: "Talent / Beruf", key: "talent", type: "text" },
            { label: "Standort", key: "location", type: "text" },
            { label: "Stundensatz (€)", key: "hourly_rate", type: "number" },
            { label: "Bio", key: "bio", type: "textarea" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label.toUpperCase()}</label>
              {f.type === "textarea"
                ? <textarea value={editWirker[f.key] || ""} onChange={e => setEditWirker(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
                : <input type={f.type} value={editWirker[f.key] || ""} onChange={e => setEditWirker(p => ({ ...p, [f.key]: f.type === "number" ? parseFloat(e.target.value) : e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              }
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setEditWirker(null)} style={{ flex: 1, background: C.border, color: C.sub, border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={() => saveWirker(editWirker)} style={{ flex: 2, background: C.orange, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Speichern ✓</button>
          </div>
        </Modal>
      )}

      {/* Neues Projekt */}
      {showNewProject && (
        <Modal title="Neues Impact-Projekt" onClose={() => setShowNewProject(false)}>
          {[
            { label: "Projektname", key: "name", type: "text" },
            { label: "Icon (Emoji)", key: "icon", type: "text" },
            { label: "Beschreibung", key: "description", type: "textarea" },
            { label: "Website", key: "website", type: "text" },
            { label: "Kontaktperson", key: "contact_name", type: "text" },
            { label: "E-Mail", key: "contact_email", type: "email" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label.toUpperCase()}</label>
              {f.type === "textarea"
                ? <textarea value={newProject[f.key] || ""} onChange={e => setNewProject(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
                : <input type={f.type} value={newProject[f.key] || ""} onChange={e => setNewProject(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              }
            </div>
          ))}
          {/* Projektbild Upload */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>PROJEKTBILD</label>
            {newProject.img ? (
              <div style={{ position: "relative", marginBottom: 8 }}>
                <img src={newProject.img} alt="Preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.border}` }} />
                <button onClick={() => setNewProject(p => ({ ...p, img: "" }))} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>×</button>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 100, background: C.bg, border: `2px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.muted, fontSize: 13, gap: 6 }}>
                {uploadingImg ? "⏳ Wird hochgeladen..." : <><span style={{ fontSize: 24 }}>🖼️</span><span>Bild auswählen</span></>}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files[0] && uploadProjectImage(e.target.files[0], setNewProject)} />
              </label>
            )}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>KATEGORIE</label>
            <select value={newProject.category} onChange={e => setNewProject(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none" }}>
              {["Soziales","Umwelt","Bildung","Nachhaltigkeit","Gesundheit","Kultur"].map(cat => <option key={cat}>{cat}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setShowNewProject(false)} style={{ flex: 1, background: C.border, color: C.sub, border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={createProject} disabled={!newProject.name} style={{ flex: 2, background: newProject.name ? C.green : C.border, color: newProject.name ? "#fff" : C.muted, border: "none", padding: "11px 0", borderRadius: 10, cursor: newProject.name ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15 }}>Erstellen ✓</button>
          </div>
        </Modal>
      )}

      {/* Projekt bearbeiten */}
      {editProject && (
        <Modal title={`${editProject.name} bearbeiten`} onClose={() => setEditProject(null)}>
          {[
            { label: "Projektname", key: "name", type: "text" },
            { label: "Icon (Emoji)", key: "icon", type: "text" },
            { label: "Beschreibung", key: "description", type: "textarea" },
            { label: "Website", key: "website", type: "text" },
            { label: "Kontaktperson", key: "contact_name", type: "text" },
            { label: "E-Mail", key: "contact_email", type: "email" },
            { label: "Impact Report", key: "impact_report", type: "textarea" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label.toUpperCase()}</label>
              {f.type === "textarea"
                ? <textarea value={editProject[f.key] || ""} onChange={e => setEditProject(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
                : <input type={f.type} value={editProject[f.key] || ""} onChange={e => setEditProject(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              }
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>PROJEKTBILD</label>
            {editProject.img ? (
              <div style={{ position: "relative", marginBottom: 8 }}>
                <img src={editProject.img} alt="Preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.border}` }} />
                <button onClick={() => setEditProject(p => ({ ...p, img: "" }))} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>×</button>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 100, background: C.bg, border: `2px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.muted, fontSize: 13, gap: 6 }}>
                {uploadingImg ? "⏳ Wird hochgeladen..." : <><span style={{ fontSize: 24 }}>🖼️</span><span>Bild auswählen</span></>}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files[0] && uploadProjectImage(e.target.files[0], setEditProject)} />
              </label>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setEditProject(null)} style={{ flex: 1, background: C.border, color: C.sub, border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={() => saveProject(editProject)} style={{ flex: 2, background: C.orange, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Speichern ✓</button>
          </div>
        </Modal>
      )}

      {/* Nominierungs-Modal */}
      {showNominateModal && (
        <Modal title="📌 Projekte nominieren (max. 3)" onClose={() => setShowNominateModal(false)}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>{nominatedIds.length}/3 ausgewählt</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
            {projects.filter(p => p.status === "aktiv").map(proj => {
              const sel = nominatedIds.includes(proj.id);
              return (
                <button key={proj.id} onClick={() => {
                  if (sel) setNominatedIds(ids => ids.filter(id => id !== proj.id));
                  else if (nominatedIds.length < 3) setNominatedIds(ids => [...ids, proj.id]);
                  else showToast("Maximal 3 Projekte", "error");
                }} style={{
                  background: sel ? C.teal + "22" : C.bg,
                  border: `1px solid ${sel ? C.teal : C.border}`,
                  color: C.text, borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>{proj.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{proj.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{proj.category} · {proj.votes||0} Stimmen</div>
                  </div>
                  {sel && <span style={{ color: C.teal, fontSize: 18, fontWeight: 800 }}>✓</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => { setShowNominateModal(false); showToast(`${nominatedIds.length} Projekte nominiert ✓`); }} style={{ width: "100%", marginTop: 20, background: C.teal, color: "#fff", border: "none", padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Bestätigen ✓</button>
        </Modal>
      )}

      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
// build: 2026-04-30-v4
import { HuiPayment, HuiWirker, HuiMessage, HuiImpactProject, User } from "@/api/entities";

// ── Farben & Konstanten ──────────────────────────────────────────────────────
const COLORS = {
  bg: "#0F172A", card: "#1E293B", border: "#334155",
  text: "#F1F5F9", muted: "#64748B", sub: "#94A3B8",
  orange: "#F97316", green: "#10B981", purple: "#8B5CF6",
  blue: "#0EA5E9", red: "#EF4444", yellow: "#F59E0B",
  teal: "#0D9488", gold: "#F59E0B"
};

// ── Mock-Daten (Fallback) ────────────────────────────────────────────────────
const MOCK_PROJECTS = [
  { id: "mp1", name: "Stadtgarten Berlin", category: "Umwelt", description: "Gemeinschaftsgärten in Berliner Kiezen aufbauen und pflegen.", icon: "🌱", color: "#7C3AED", votes: 38, status: "aktiv", month: "2026-04", awarded_eur: 0, tags: ["Natur","Gemeinschaft"] },
  { id: "mp2", name: "Musik für Kinder e.V.", category: "Soziales", description: "Kostenlose Musikunterricht für Kinder aus einkommensschwachen Familien.", icon: "🎵", color: "#0891B2", votes: 27, status: "aktiv", month: "2026-04", awarded_eur: 0, tags: ["Bildung","Kinder"] },
  { id: "mp3", name: "Repair Café Hamburg", category: "Nachhaltigkeit", description: "Dinge reparieren statt wegwerfen — für eine nachhaltigere Stadt.", icon: "🔧", color: "#059669", votes: 19, status: "aktiv", month: "2026-04", awarded_eur: 0, tags: ["Nachhaltigkeit"] },
  { id: "mp4", name: "Bienen retten München", category: "Umwelt", description: "Wildblumenwiesen und Bienenstöcke in städtischen Parks anlegen.", icon: "🐝", color: "#F59E0B", votes: 52, status: "gewonnen", month: "2026-03", awarded_eur: 184.5, distributed_at: "2026-03-31T18:00:00Z", tags: ["Natur","Stadt","Tiere"], impact_report: "Mit den Mitteln konnten 12 Wildblumenwiesen in München angelegt werden. Das Projekt wurde von 3 lokalen Medien aufgegriffen und hat HUI als Partner namentlich erwähnt." },
  { id: "mp5", name: "Schulbücher für alle", category: "Bildung", description: "Gebrauchte Schulbücher sammeln und kostenlos weitergeben.", icon: "📚", color: "#8B5CF6", votes: 31, status: "archiviert", month: "2026-03", awarded_eur: 0, tags: ["Bildung","Kinder"] },
  { id: "mp6", name: "Repair Café Köln", category: "Nachhaltigkeit", description: "Ehrenamtliche reparieren kaputte Alltagsgegenstände.", icon: "🔧", color: "#059669", votes: 19, status: "archiviert", month: "2026-03", awarded_eur: 0, tags: ["Nachhaltigkeit"] },
  { id: "mp7", name: "Foodsharing Stuttgart", category: "Soziales", description: "Lebensmittelverschwendung bekämpfen durch lokale Verteilpunkte.", icon: "🥗", color: "#EF4444", votes: 63, status: "gewonnen", month: "2026-02", awarded_eur: 142.2, distributed_at: "2026-02-28T18:00:00Z", tags: ["Ernährung","Gemeinschaft"], impact_report: "142 € wurden eingesetzt um 4 neue Kühlschränke für Lebensmittelverteilung aufzustellen. Ca. 200 Personen profitieren monatlich. HUI wurde auf Instagram und im Stadtmagazin erwähnt." },
  { id: "mp8", name: "Lesepaten Nürnberg", category: "Bildung", description: "Ehrenamtliche lesen Kindern in Kitas vor.", icon: "📖", color: "#0EA5E9", votes: 28, status: "archiviert", month: "2026-02", awarded_eur: 0, tags: ["Bildung","Ehrenamt"] },
  { id: "mp9", name: "Waldpflege Bayern", category: "Umwelt", description: "Aufforstung und Pflege von Mischwäldern in Bayern.", icon: "🌲", color: "#10B981", votes: 21, status: "archiviert", month: "2026-02", awarded_eur: 0, tags: ["Natur","Wald"] },
];

const MOCK_WIRKER = [
  { id: "w1", name: "Marcus B.", full_name: "Marcus Braun", talent: "Fotograf & Videograf", location: "Berlin", hourly_rate: 70, bookings: 47, followers: 312, impact_eur: 58.20, verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", bio: "Ich fange Momente ein, die bleiben.", skills: ["Fotografie","Video","Drohne"] },
  { id: "w2", name: "Sofia M.", full_name: "Sofia Müller", talent: "Keramik-Künstlerin", location: "München", hourly_rate: 45, bookings: 58, followers: 218, impact_eur: 47.25, verified: true, img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", bio: "Handgemachte Keramik mit Seele.", skills: ["Keramik","Töpfern","Workshops"] },
  { id: "w3", name: "Maria L.", full_name: "Maria Lopez", talent: "Yoga & Achtsamkeit", location: "Hamburg", hourly_rate: 40, bookings: 93, followers: 445, impact_eur: 83.70, verified: true, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", bio: "Yoga für alle, die ankommen wollen.", skills: ["Yoga","Meditation","Atemübungen"] },
  { id: "w4", name: "Tom H.", full_name: "Tom Heller", talent: "Leder-Handwerker", location: "Wien", hourly_rate: 55, bookings: 31, followers: 189, impact_eur: 28.50, verified: false, img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", bio: "Nachhaltiges Handwerk aus Wien.", skills: ["Leder","Nähen","Design"] },
  { id: "w5", name: "Lena K.", full_name: "Lena Koch", talent: "Aquarell-Künstlerin", location: "Hamburg", hourly_rate: 50, bookings: 22, followers: 134, impact_eur: 19.80, verified: false, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", bio: "Farbe als Sprache.", skills: ["Aquarell","Portrait","Illustration"] },
];

const MOCK_PAYMENTS = [
  { id: "p1", created_date: "2026-04-30T10:22:00Z", wirker_name: "Marcus B.", item_name: "Fotografie – 1 Stunde", amount_eur: "82.35", impact_eur: "2.47", status: "ausgezahlt", payment_status: "paid", empfehlung: "empfohlen" },
  { id: "p2", created_date: "2026-04-29T15:04:00Z", wirker_name: "Sofia M.", item_name: "Keramik-Workshop", amount_eur: "75.00", impact_eur: "2.25", status: "escrow", payment_status: "paid", empfehlung: "ausstehend" },
  { id: "p3", created_date: "2026-04-28T09:11:00Z", wirker_name: "Maria L.", item_name: "Yoga & Achtsamkeit – 1h", amount_eur: "60.00", impact_eur: "1.80", status: "ausgezahlt", payment_status: "paid", empfehlung: "empfohlen" },
  { id: "p4", created_date: "2026-04-27T14:30:00Z", wirker_name: "Tom H.", item_name: "Leder-Rucksack", amount_eur: "195.00", impact_eur: "5.85", status: "ausgezahlt", payment_status: "paid", empfehlung: "empfohlen" },
  { id: "p5", created_date: "2026-04-26T11:45:00Z", wirker_name: "Lena K.", item_name: "Aquarell-Portrait", amount_eur: "120.00", impact_eur: "3.60", status: "rueckerstattung", payment_status: "refunded", empfehlung: "nicht_empfohlen" },
  { id: "p6", created_date: "2026-04-25T08:20:00Z", wirker_name: "Marcus B.", item_name: "Fotografie – 2 Stunden", amount_eur: "164.70", impact_eur: "4.94", status: "ausgezahlt", payment_status: "paid", empfehlung: "empfohlen" },
];

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(n) || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

const statusMap = {
  ausgezahlt:    { label: "Ausgezahlt",   bg: "#D1FAE5", color: "#065F46" },
  escrow:        { label: "Treuhand",     bg: "#FEF3C7", color: "#92400E" },
  reklamation:   { label: "Reklamation",  bg: "#FEE2E2", color: "#991B1B" },
  rueckerstattung:{ label: "Erstattet",  bg: "#FEE2E2", color: "#991B1B" },
  empfohlen:     { label: "✓ Empfohlen",  bg: "#D1FAE5", color: "#065F46" },
  nicht_empfohlen:{ label: "✗ Abgelehnt",bg: "#FEE2E2", color: "#991B1B" },
  ausstehend:    { label: "⏳ Ausstehend",bg: "#FEF3C7", color: "#92400E" },
};

const Badge = ({ status }) => {
  const s = statusMap[status] || { label: status, bg: "#F3F4F6", color: "#374151" };
  return <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{s.label}</span>;
};

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#1E293B", borderRadius: 20, border: "1px solid #334155", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#F1F5F9" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: toast.type === "error" ? "#EF4444" : "#10B981", color: "#fff", padding: "13px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "fadeIn 0.2s ease", display: "flex", alignItems: "center", gap: 8 }}>
      <span>{toast.type === "error" ? "❌" : "✅"}</span> {toast.msg}
    </div>
  );
}

// ── Bestätigungs-Dialog ──────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 16, padding: 28, maxWidth: 380, textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, color: "#F1F5F9", fontWeight: 600, marginBottom: 8 }}>Bist du sicher?</div>
        <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>{msg}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} style={{ background: "#334155", color: "#94A3B8", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>Abbrechen</button>
          <button onClick={onConfirm} style={{ background: "#EF4444", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>Bestätigen</button>
        </div>
      </div>
    </div>
  );
}

// ── Haupt-Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [payments, setPayments] = useState([]);
  const [wirker, setWirker] = useState([]);
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // UI State
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [searchWirker, setSearchWirker] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedWirker, setSelectedWirker] = useState(null);
  const [editWirker, setEditWirker] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", category: "Umwelt", description: "", icon: "🌱", color: "#10B981" });
  const [editProject, setEditProject] = useState(null);
  const [impactView, setImpactView] = useState("aktiv");
  const [impactTab, setImpactTab] = useState("runde");
  const [votingOpen, setVotingOpen] = useState(false);
  const [votingStart, setVotingStart] = useState("");
  const [votingEnd, setVotingEnd] = useState("");
  const [votingDeadline, setVotingDeadline] = useState("2026-04-30");
  const [nominatedIds, setNominatedIds] = useState([]);
  const [distributeTarget, setDistributeTarget] = useState(null);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [showRoundSettings, setShowRoundSettings] = useState(false); // "aktiv" | "historie"
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, w, proj] = await Promise.all([
        HuiPayment.list().catch(() => []),
        HuiWirker.list().catch(() => []),
        HuiImpactProject.list().catch(() => [])
      ]);
      if (w.length) { setWirker(w); } else { setWirker(MOCK_WIRKER); setUsingMock(true); }
      if (p.length) { setPayments(p); } else { setPayments(MOCK_PAYMENTS); }
      setProjects(proj.length ? proj : MOCK_PROJECTS);
    } catch(e) {
      console.error("loadData error:", e);
      setWirker(MOCK_WIRKER); setPayments(MOCK_PAYMENTS); setProjects(MOCK_PROJECTS); setUsingMock(true);
    }
    setLoading(false);
  }

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const askConfirm = (msg, fn) => setConfirm({ msg, fn });

  // ── Wirker-Aktionen ────────────────────────────────────────────────────────
  async function toggleVerify(w) {
    const next = !w.verified;
    try {
      if (!usingMock) await HuiWirker.update(w.id, { verified: next });
      setWirker(prev => prev.map(x => x.id === w.id ? { ...x, verified: next } : x));
      if (selectedWirker?.id === w.id) setSelectedWirker(s => ({ ...s, verified: next }));
      showToast(next ? `${w.name} verifiziert ✓` : `Verifizierung von ${w.name} zurückgezogen`);
    } catch { showToast("Fehler beim Speichern", "error"); }
  }

  async function saveWirker(data) {
    try {
      if (!usingMock) await HuiWirker.update(data.id, data);
      setWirker(prev => prev.map(x => x.id === data.id ? { ...x, ...data } : x));
      setEditWirker(null);
      showToast("Profil gespeichert ✓");
    } catch { showToast("Fehler beim Speichern", "error"); }
  }

  async function deleteWirker(w) {
    askConfirm(`${w.full_name || w.name} wirklich löschen? Diese Aktion ist unwiderruflich.`, async () => {
      try {
        if (!usingMock) await HuiWirker.delete(w.id);
        setWirker(prev => prev.filter(x => x.id !== w.id));
        setSelectedWirker(null); setConfirm(null);
        showToast(`${w.name} gelöscht`);
      } catch { showToast("Fehler beim Löschen", "error"); setConfirm(null); }
    });
  }

  // ── Payment-Aktionen ───────────────────────────────────────────────────────
  async function updatePaymentStatus(p, newStatus) {
    try {
      if (!usingMock) await HuiPayment.update(p.id, { status: newStatus });
      setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x));
      setEditPayment(null);
      showToast(`Status auf „${statusMap[newStatus]?.label}" geändert ✓`);
    } catch { showToast("Fehler beim Aktualisieren", "error"); }
  }

  async function refundPayment(p) {
    askConfirm(`Zahlung von ${fmt(p.amount_eur)} € für ${p.wirker_name} wirklich erstatten?`, async () => {
      try {
        if (!usingMock) await HuiPayment.update(p.id, { status: "rueckerstattung", payment_status: "refunded" });
        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "rueckerstattung", payment_status: "refunded" } : x));
        setEditPayment(null); setConfirm(null);
        showToast("Erstattung eingeleitet ✓");
      } catch { showToast("Fehler", "error"); setConfirm(null); }
    });
  }

  async function releaseEscrow(p) {
    askConfirm(`Treuhand-Zahlung von ${fmt(p.amount_eur)} € an ${p.wirker_name} freigeben?`, async () => {
      try {
        if (!usingMock) await HuiPayment.update(p.id, { status: "ausgezahlt" });
        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "ausgezahlt" } : x));
        setEditPayment(null); setConfirm(null);
        showToast(`Zahlung an ${p.wirker_name} freigegeben ✓`);
      } catch { showToast("Fehler", "error"); setConfirm(null); }
    });
  }

  // ── Impact-Aktionen ────────────────────────────────────────────────────────
  const totalImpact = payments.reduce((s, p) => s + parseFloat(p.impact_eur || 0), 0);
  const totalVotes = projects.reduce((s, p) => s + (p.votes || 0), 0);
  const activeProjects = projects.filter(p => p.status === "aktiv");
  const leadingProject = [...activeProjects].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];

  async function distributePool() {
    if (!distributeTarget) return;
    const proj = distributeTarget;
    const totalAmount = parseFloat(totalImpact.toFixed(2));
    const winnerShare = parseFloat((totalAmount * 0.7).toFixed(2));
    const restAmount  = parseFloat((totalAmount * 0.3).toFixed(2));
    const others = projects.filter(p => p.status === "aktiv" && p.id !== proj.id);
    const perProject = others.length > 0 ? parseFloat((restAmount / others.length).toFixed(2)) : 0;
    const msg = others.length > 0
      ? `${fmt(winnerShare)} € → "${proj.name}" (Gewinner)\n${fmt(perProject)} € → ${others.length} weitere aktive Projekte (je gleich)\n\nGesamt: ${fmt(totalAmount)} €`
      : `${fmt(totalAmount)} € → "${proj.name}" ausschütten?`;
    askConfirm(msg, async () => {
      try {
        if (!usingMock) {
          await HuiImpactProject.update(proj.id, { status: "gewonnen", awarded_eur: winnerShare, distributed_at: new Date().toISOString() });
          for (const p of others) {
            await HuiImpactProject.update(p.id, { awarded_eur: parseFloat(((p.awarded_eur||0) + perProject).toFixed(2)) });
          }
          for (const p of projects.filter(pp => nominatedIds.includes(pp.id) && pp.id !== proj.id)) {
            await HuiImpactProject.update(p.id, { status: "archiviert" });
          }
        }
        setProjects(prev => prev.map(p => {
          if (p.id === proj.id) return { ...p, status: "gewonnen", awarded_eur: winnerShare, distributed_at: new Date().toISOString() };
          if (p.status === "aktiv" && perProject > 0) return { ...p, awarded_eur: parseFloat(((p.awarded_eur||0) + perProject).toFixed(2)) };
          if (nominatedIds.includes(p.id)) return { ...p, status: "archiviert" };
          return p;
        }));
        setNominatedIds([]);
        setVotingOpen(false);
        setDistributeTarget(null);
        showToast(perProject > 0 ? `💸 ${fmt(winnerShare)} € an ${proj.name} + ${fmt(perProject)} € an ${others.length} Projekte!` : `💸 ${fmt(totalAmount)} € ausgeschüttet!`);
      } catch(e) { showToast("Fehler beim Ausschütten", "error"); }
    });
  }

  async function addProject() {
    if (!newProject.name.trim()) return;
    try {
      const data = { ...newProject, votes: 0, status: "aktiv", month: new Date().toISOString().slice(0, 7), awarded_eur: 0 };
      let created;
      try {
        created = await HuiImpactProject.create(data);
      } catch {
        created = { ...data, id: "local_" + Date.now() };
      }
      setProjects(prev => [...prev, created]);
      setNewProject({ name: "", category: "Umwelt", description: "", icon: "🌱", color: "#10B981" });
      setShowNewProject(false);
      showToast("Projekt hinzugefügt ✓");
    } catch { showToast("Fehler beim Hinzufügen", "error"); }
  }

  async function deleteProject(proj) {
    askConfirm(`Projekt „${proj.name}" wirklich löschen?`, async () => {
      try {
        await HuiImpactProject.delete(proj.id);
        setProjects(prev => prev.filter(p => p.id !== proj.id));
        setConfirm(null);
        showToast("Projekt gelöscht");
      } catch { showToast("Fehler", "error"); setConfirm(null); }
    });
  }

  async function saveProject(data) {
    try {
      const updated = await HuiImpactProject.update(data.id, data);
      setProjects(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
      setEditProject(null);
      showToast("Projekt gespeichert ✓");
    } catch { showToast("Fehler beim Speichern", "error"); }
  }

  // ── CSV Export ─────────────────────────────────────────────────────────────
  function exportCSV() {
    const header = "Datum,Wirker,Leistung,Betrag (€),Impact (€),Status,Empfehlung";
    const rows = payments.map(p => [
      fmtDate(p.created_date), p.wirker_name, `"${p.item_name}"`,
      fmt(p.amount_eur), fmt(p.impact_eur), p.status, p.empfehlung
    ].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `hui-zahlungen-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    showToast("CSV exportiert ✓");
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalRevenue = payments.filter(p => p.status !== "rueckerstattung").reduce((s, p) => s + parseFloat(p.amount_eur || 0), 0);
  const huiRevenue = totalRevenue * 0.1275;
  const escrowCount = payments.filter(p => p.status === "escrow").length;
  const verifiedCount = wirker.filter(w => w.verified).length;

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredPayments = payments.filter(p => filterStatus === "all" || p.status === filterStatus);
  const filteredWirker = wirker.filter(w =>
    [w.name, w.full_name, w.talent, w.location].some(v => (v||"").toLowerCase().includes(searchWirker.toLowerCase()))
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>⚙️</div>
      <div style={{ color: COLORS.muted, fontSize: 16 }}>Dashboard lädt…</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Toast toast={toast} />
      {confirm && <ConfirmDialog msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg,#1E293B,#0F172A)", borderBottom: `1px solid ${COLORS.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#F97316,#FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.text }}>HUI Admin</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Human United Intelligent</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {usingMock && <span style={{ background: "#7C3AED22", color: "#A78BFA", border: "1px solid #7C3AED", padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>Demo-Daten</span>}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} />
              <span style={{ fontSize: 13, color: COLORS.muted }}>Live · {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ background: "#1E293B", borderBottom: `1px solid ${COLORS.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", gap: 0 }}>
          {[
            { key: "overview", label: "Übersicht", icon: "📊" },
            { key: "payments", label: "Zahlungen", icon: "💳" },
            { key: "wirker", label: "Wirker", icon: "👥" },
            { key: "impact", label: "Impact Pool", icon: "🌱" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "14px 20px",
              fontSize: 14, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? COLORS.orange : COLORS.muted,
              borderBottom: `2px solid ${tab === t.key ? COLORS.orange : "transparent"}`,
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
            }}><span>{t.icon}</span>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px" }}>

        {/* ═══════════════════ ÜBERSICHT ═══════════════════ */}
        {tab === "overview" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: COLORS.text }}>Übersicht</h1>
            <p style={{ color: COLORS.muted, margin: "0 0 24px", fontSize: 14 }}>Alle wichtigen Zahlen auf einen Blick</p>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Gesamtumsatz", value: `${fmt(totalRevenue)} €`, sub: `${payments.filter(p=>p.status==="ausgezahlt").length} abgeschlossen`, icon: "💰", grad: "linear-gradient(135deg,#F97316,#FB923C)" },
                { label: "HUI Einnahmen", value: `${fmt(huiRevenue)} €`, sub: "12,75% der Transaktionen", icon: "🏦", grad: "linear-gradient(135deg,#8B5CF6,#A78BFA)" },
                { label: "Impact Pool", value: `${fmt(totalImpact)} €`, sub: "2,25% aus jeder Buchung", icon: "🌱", grad: "linear-gradient(135deg,#10B981,#34D399)" },
                { label: "Aktive Wirker", value: wirker.length, sub: `${verifiedCount} verifiziert`, icon: "👥", grad: "linear-gradient(135deg,#0EA5E9,#38BDF8)" },
                { label: "Treuhand offen", value: escrowCount, sub: "warten auf Freigabe", icon: "⏳", grad: "linear-gradient(135deg,#F59E0B,#FBBF24)" },
              ].map((k, i) => (
                <div key={i} style={{ background: COLORS.card, borderRadius: 16, padding: "20px", border: `1px solid ${COLORS.border}`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -12, right: -12, width: 72, height: 72, borderRadius: "50%", background: k.grad, opacity: 0.15 }} />
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{k.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 2 }}>{k.value}</div>
                  <div style={{ fontSize: 13, color: COLORS.sub, fontWeight: 600, marginBottom: 2 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Treuhand-Buchungen + Top-Wirker */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Offene Treuhand */}
              <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>⏳ Offene Treuhand-Buchungen</div>
                  <button onClick={() => setTab("payments")} style={{ background: "none", border: "none", color: COLORS.orange, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Alle →</button>
                </div>
                {payments.filter(p => p.status === "escrow").length === 0
                  ? <div style={{ padding: 32, textAlign: "center", color: COLORS.muted, fontSize: 14 }}>✓ Keine offenen Treuhand-Buchungen</div>
                  : payments.filter(p => p.status === "escrow").map((p, i) => (
                    <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{p.wirker_name}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>{p.item_name}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{fmt(p.amount_eur)} €</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <button onClick={() => releaseEscrow(p)} style={{ background: "#064E3B", color: COLORS.green, border: `1px solid ${COLORS.green}`, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Freigeben</button>
                          <button onClick={() => refundPayment(p)} style={{ background: "#450A0A", color: COLORS.red, border: `1px solid ${COLORS.red}`, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Erstatten</button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Top Wirker */}
              <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>🏆 Top Wirker</div>
                  <button onClick={() => setTab("wirker")} style={{ background: "none", border: "none", color: COLORS.orange, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Alle →</button>
                </div>
                {[...wirker].sort((a, b) => (b.bookings || 0) - (a.bookings || 0)).slice(0, 4).map((w, i) => (
                  <div key={i} style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setSelectedWirker(w); setTab("wirker"); }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.muted, width: 20, textAlign: "center" }}>#{i + 1}</div>
                    <img src={w.img} alt={w.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{w.full_name || w.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{w.talent}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{w.bookings} Buchungen</div>
                      {w.verified && <span style={{ fontSize: 10, color: COLORS.green, fontWeight: 600 }}>✓ Verifiziert</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Letzte Transaktionen */}
            <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>💳 Letzte Transaktionen</div>
                <button onClick={() => setTab("payments")} style={{ background: "none", border: "none", color: COLORS.orange, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Alle →</button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0F172A" }}>
                      {["Datum", "Wirker", "Leistung", "Betrag", "Impact", "Status", "Empfehlung"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 6).map((p, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? COLORS.card : "#1A2537", cursor: "pointer" }} onClick={() => { setEditPayment(p); setTab("payments"); }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.sub, whiteSpace: "nowrap" }}>{fmtDate(p.created_date)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: COLORS.text }}>{p.wirker_name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.sub }}>{p.item_name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: COLORS.text, whiteSpace: "nowrap" }}>{fmt(p.amount_eur)} €</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.green, fontWeight: 600, whiteSpace: "nowrap" }}>+{fmt(p.impact_eur)} €</td>
                        <td style={{ padding: "12px 16px" }}><Badge status={p.status} /></td>
                        <td style={{ padding: "12px 16px" }}><Badge status={p.empfehlung} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ ZAHLUNGEN ═══════════════════ */}
        {tab === "payments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Zahlungen</h1>
                <p style={{ color: COLORS.muted, margin: 0, fontSize: 14 }}>{payments.length} Transaktionen gesamt</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { key: "all", label: "Alle" },
                  { key: "escrow", label: "Treuhand" },
                  { key: "ausgezahlt", label: "Ausgezahlt" },
                  { key: "rueckerstattung", label: "Erstattet" },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{
                    background: filterStatus === f.key ? COLORS.orange : COLORS.card,
                    color: filterStatus === f.key ? "#fff" : COLORS.muted,
                    border: `1px solid ${filterStatus === f.key ? COLORS.orange : COLORS.border}`,
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600
                  }}>{f.label}</button>
                ))}
                <button onClick={exportCSV} style={{ background: COLORS.card, color: COLORS.sub, border: `1px solid ${COLORS.border}`, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  ⬇️ CSV Export
                </button>
              </div>
            </div>

            {/* Tabelle */}
            <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0F172A" }}>
                      {["Datum & Zeit", "Wirker", "Leistung", "Betrag", "Impact", "Status", "Empfehlung", "Aktionen"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? COLORS.card : "#1A2537" }}>
                        <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 13, color: COLORS.text }}>{fmtDate(p.created_date)}</div>
                          <div style={{ fontSize: 11, color: COLORS.muted }}>{fmtTime(p.created_date)}</div>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap" }}>{p.wirker_name}</td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: COLORS.sub, maxWidth: 200 }}>{p.item_name}</td>
                        <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 800, color: COLORS.text, whiteSpace: "nowrap" }}>{fmt(p.amount_eur)} €</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: COLORS.green, fontWeight: 600, whiteSpace: "nowrap" }}>+{fmt(p.impact_eur)} €</td>
                        <td style={{ padding: "13px 16px" }}><Badge status={p.status} /></td>
                        <td style={{ padding: "13px 16px" }}><Badge status={p.empfehlung} /></td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setEditPayment(p)} style={{ background: "#1E3A5F", color: COLORS.blue, border: `1px solid ${COLORS.blue}`, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Detail</button>
                            {p.status === "escrow" && (
                              <>
                                <button onClick={() => releaseEscrow(p)} style={{ background: "#064E3B", color: COLORS.green, border: `1px solid ${COLORS.green}`, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Freigeben</button>
                                <button onClick={() => refundPayment(p)} style={{ background: "#450A0A", color: COLORS.red, border: `1px solid ${COLORS.red}`, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Erstatten</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summen */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              {[
                { label: "Gesamtumsatz", value: `${fmt(filteredPayments.filter(p=>p.status!=="rueckerstattung").reduce((s,p)=>s+parseFloat(p.amount_eur||0),0))} €`, color: COLORS.orange },
                { label: "HUI (12,75%)", value: `${fmt(filteredPayments.filter(p=>p.status!=="rueckerstattung").reduce((s,p)=>s+parseFloat(p.amount_eur||0),0)*0.1275)} €`, color: COLORS.purple },
                { label: "Impact Pool (2,25%)", value: `${fmt(filteredPayments.reduce((s,p)=>s+parseFloat(p.impact_eur||0),0))} €`, color: COLORS.green },
                { label: "Erstattungen", value: `${fmt(filteredPayments.filter(p=>p.status==="rueckerstattung").reduce((s,p)=>s+parseFloat(p.amount_eur||0),0))} €`, color: COLORS.red },
              ].map((s, i) => (
                <div key={i} style={{ background: COLORS.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: COLORS.muted }}>{s.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════ WIRKER ═══════════════════ */}
        {tab === "wirker" && !selectedWirker && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Wirker</h1>
                <p style={{ color: COLORS.muted, margin: 0, fontSize: 14 }}>{wirker.length} registriert · {verifiedCount} verifiziert</p>
              </div>
              <div style={{ position: "relative" }}>
                <input value={searchWirker} onChange={e => setSearchWirker(e.target.value)}
                  placeholder="Suche…"
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 16px 9px 38px", borderRadius: 10, fontSize: 14, width: 240, outline: "none" }} />
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
              {filteredWirker.map((w, i) => (
                <div key={i} style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.orange}
                  onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
                >
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }} onClick={() => setSelectedWirker(w)}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={w.img} alt={w.name} style={{ width: 52, height: 52, borderRadius: 14, objectFit: "cover" }} />
                      {w.verified && <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, background: COLORS.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, border: `2px solid ${COLORS.card}`, color: "#fff" }}>✓</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 15 }}>{w.full_name || w.name}</div>
                      <div style={{ fontSize: 13, color: COLORS.orange, fontWeight: 500 }}>{w.talent}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted }}>📍 {w.location}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: `1px solid ${COLORS.border}` }}>
                    {[["Buchungen", w.bookings||0], ["Followers", w.followers||0], ["Impact", `${fmt(w.impact_eur)}€`], ["Rate", `${w.hourly_rate||"–"}€/h`]].map(([l, v], j) => (
                      <div key={j} style={{ padding: "10px 0", textAlign: "center", borderRight: j < 3 ? `1px solid ${COLORS.border}` : "none" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{v}</div>
                        <div style={{ fontSize: 10, color: COLORS.muted }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); toggleVerify(w); }} style={{
                      flex: 1, background: w.verified ? "#064E3B" : COLORS.card,
                      color: w.verified ? COLORS.green : COLORS.muted,
                      border: `1px solid ${w.verified ? COLORS.green : COLORS.border}`,
                      padding: "6px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700
                    }}>{w.verified ? "✓ Verifiziert" : "Verifizieren"}</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditWirker({ ...w }); }} style={{ flex: 1, background: "#1E3A5F", color: COLORS.blue, border: `1px solid ${COLORS.blue}`, padding: "6px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✏️ Bearbeiten</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteWirker(w); }} style={{ background: "#450A0A", color: COLORS.red, border: `1px solid ${COLORS.red}`, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Wirker Detail ── */}
        {tab === "wirker" && selectedWirker && (
          <div>
            <button onClick={() => setSelectedWirker(null)} style={{ background: "none", border: "none", color: COLORS.orange, cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>← Zurück zur Übersicht</button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Profil-Card */}
              <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                <div style={{ height: 120, background: "linear-gradient(135deg,#1E293B,#334155)", position: "relative" }}>
                  {selectedWirker.header_img && <img src={selectedWirker.header_img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ padding: "0 24px 24px", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                    <img src={selectedWirker.img} alt={selectedWirker.name} style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", border: `3px solid ${COLORS.card}`, marginTop: -36 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => toggleVerify(selectedWirker)} style={{ background: selectedWirker.verified ? "#064E3B" : COLORS.card, color: selectedWirker.verified ? COLORS.green : COLORS.muted, border: `1px solid ${selectedWirker.verified ? COLORS.green : COLORS.border}`, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{selectedWirker.verified ? "✓ Verifiziert" : "Verifizieren"}</button>
                      <button onClick={() => setEditWirker({ ...selectedWirker })} style={{ background: "#1E3A5F", color: COLORS.blue, border: `1px solid ${COLORS.blue}`, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✏️ Bearbeiten</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{selectedWirker.full_name || selectedWirker.name}</div>
                  <div style={{ fontSize: 14, color: COLORS.orange, fontWeight: 600, marginBottom: 4 }}>{selectedWirker.talent}</div>
                  <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 12 }}>📍 {selectedWirker.location} · {selectedWirker.hourly_rate} €/h</div>
                  <div style={{ fontSize: 13, color: COLORS.sub, lineHeight: 1.6, marginBottom: 16 }}>{selectedWirker.bio || "Keine Bio vorhanden."}</div>
                  {selectedWirker.skills?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedWirker.skills.map((s, j) => (
                        <span key={j} style={{ background: "#0F172A", color: COLORS.sub, padding: "3px 10px", borderRadius: 99, fontSize: 12 }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats + letzte Transaktionen */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Buchungen", value: selectedWirker.bookings || 0, icon: "📅", color: COLORS.orange },
                    { label: "Followers", value: selectedWirker.followers || 0, icon: "👥", color: COLORS.blue },
                    { label: "Impact gesamt", value: `${fmt(selectedWirker.impact_eur)} €`, icon: "🌱", color: COLORS.green },
                    { label: "Empfehlungen", value: selectedWirker.recommendations || 0, icon: "⭐", color: COLORS.yellow },
                  ].map((s, j) => (
                    <div key={j} style={{ background: COLORS.card, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Transaktionen dieses Wirkers */}
                <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 14 }}>Letzte Buchungen</div>
                  {payments.filter(p => p.wirker_name === selectedWirker.name).length === 0
                    ? <div style={{ padding: 20, color: COLORS.muted, fontSize: 13, textAlign: "center" }}>Keine Buchungen gefunden</div>
                    : payments.filter(p => p.wirker_name === selectedWirker.name).map((p, i) => (
                      <div key={i} style={{ padding: "11px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, color: COLORS.text }}>{p.item_name}</div>
                          <div style={{ fontSize: 11, color: COLORS.muted }}>{fmtDate(p.created_date)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{fmt(p.amount_eur)} €</div>
                          <Badge status={p.status} />
                        </div>
                      </div>
          {tab === "impact" && (
          <div style={{ padding: "0 24px 40px" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 22, color: COLORS.text, margin: 0 }}>🌱 Impact Pool</h2>
                <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Gesammelte Mittel, Abstimmung & Ausschüttung</p>
              </div>
              <button onClick={() => setShowNewProject(true)} style={{ background: COLORS.teal+"22", color: COLORS.teal, border: "1px solid "+COLORS.teal, padding: "9px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ Projekt hinzufügen</button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { icon: "💰", value: fmt(totalImpact)+" €", label: "Aktueller Pool", color: COLORS.gold },
                { icon: "🗳️", value: nominatedIds.length+"/3", label: "Nominierte Projekte", color: COLORS.teal },
                { icon: "👥", value: projects.filter(p=>nominatedIds.includes(p.id)).reduce((s,p)=>s+(p.votes||0),0), label: "Abgegebene Stimmen", color: COLORS.blue },
                { icon: votingOpen ? "🟢" : "🔴", value: votingOpen ? "Offen" : "Geschlossen", label: "Abstimmung", color: votingOpen ? COLORS.green : COLORS.red },
              ].map((s,i) => (
                <div key={i} style={{ background: COLORS.card, borderRadius: 16, border: "1px solid "+COLORS.border, padding: "18px 20px" }}>
                  <div style={{ fontSize: 26 }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 22, color: s.color, marginTop: 6 }}>{s.value}</div>
                  <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sub-Navigation */}
            <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid "+COLORS.border }}>
              {[
                { key: "runde", label: "🗓️ Aktuelle Runde" },
                { key: "projekte", label: "📋 Alle Projekte" },
                { key: "ausschuettung", label: "💸 Ausschüttung" },
                { key: "history", label: "🏆 History" },
              ].map(t => (
                <button key={t.key} onClick={() => setImpactTab(t.key)} style={{
                  padding: "10px 18px", border: "none",
                  borderBottom: impactTab === t.key ? "2px solid "+COLORS.teal : "2px solid transparent",
                  background: "none", color: impactTab === t.key ? COLORS.teal : COLORS.muted,
                  cursor: "pointer", fontWeight: impactTab === t.key ? 700 : 500, fontSize: 13,
                  marginBottom: -1,
                }}>{t.label}</button>
              ))}
            </div>

            {/* TAB: AKTUELLE RUNDE */}
            {impactTab === "runde" && (
              <div>
                <div style={{ background: COLORS.card, borderRadius: 16, border: "1px solid "+COLORS.border, padding: 24, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>Abstimmungsrunde April 2026</div>
                      <div style={{ fontSize: 13, color: COLORS.muted }}>Deadline: <span style={{ color: COLORS.orange, fontWeight: 600 }}>{votingDeadline}</span></div>
                    </div>
                    <button onClick={() => setShowRoundSettings(true)} style={{ background: "#1E3A5F", color: COLORS.blue, border: "1px solid "+COLORS.blue, padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>⚙️ Einstellungen</button>
                  </div>
                  {/* Abstimmungszeitraum */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>START</label>
                      <input type="datetime-local" value={votingStart} onChange={e => setVotingStart(e.target.value)}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid "+COLORS.border, color: COLORS.text, padding: "8px 10px", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>ENDE</label>
                      <input type="datetime-local" value={votingEnd} onChange={e => setVotingEnd(e.target.value)}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid "+COLORS.border, color: COLORS.text, padding: "8px 10px", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  {votingStart && votingEnd && (
                    <div style={{ background: "#0F172A", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.sub, marginBottom: 10 }}>
                      📅 {new Date(votingStart).toLocaleDateString("de-DE", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})} – {new Date(votingEnd).toLocaleDateString("de-DE", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0F172A", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 14 }}>Abstimmung {votingOpen ? "läuft 🟢" : "pausiert 🔴"}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{votingOpen ? "Wirker können aktuell abstimmen" : "Abstimmung pausiert — keine neuen Stimmen"}</div>
                    </div>
                    <button onClick={() => {
                      if (!votingOpen && (!votingStart || !votingEnd)) { showToast("Bitte erst Start- und Enddatum setzen", "error"); return; }
                      setVotingOpen(v => !v);
                    }} style={{
                      background: votingOpen ? "#064E3B" : "#1E3A5F",
                      color: votingOpen ? COLORS.green : COLORS.blue,
                      border: "1px solid "+(votingOpen ? COLORS.green : COLORS.blue),
                      padding: "9px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13
                    }}>{votingOpen ? "⏸ Pausieren" : "▶ Starten"}</button>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowNominateModal(true)} style={{ flex: 1, background: COLORS.teal+"22", color: COLORS.teal, border: "1px solid "+COLORS.teal, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>📌 Projekte nominieren</button>
                    <button onClick={() => setImpactTab("ausschuettung")} style={{ flex: 1, background: COLORS.gold+"22", color: COLORS.gold, border: "1px solid "+COLORS.gold, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>💸 Pool ausschütten</button>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 14 }}>Nominierte Projekte ({nominatedIds.length}/3)</div>
                {nominatedIds.length === 0 ? (
                  <div style={{ background: COLORS.card, borderRadius: 14, border: "1px dashed "+COLORS.border, padding: 32, textAlign: "center", color: COLORS.muted, fontSize: 14 }}>Noch keine Projekte nominiert.</div>
                ) : (() => {
                  const nominated = projects.filter(p => nominatedIds.includes(p.id));
                  const totalVotes = nominated.reduce((s,p) => s+(p.votes||0), 0);
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[...nominated].sort((a,b)=>(b.votes||0)-(a.votes||0)).map((proj, i) => {
                        const pct = totalVotes > 0 ? Math.round((proj.votes||0)/totalVotes*100) : 0;
                        const isLeading = i === 0 && totalVotes > 0;
                        return (
                          <div key={proj.id} style={{ background: COLORS.card, borderRadius: 14, border: "1px solid "+(isLeading ? COLORS.gold : COLORS.border), padding: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                              <span style={{ fontSize: 24 }}>{proj.icon || "🌱"}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{proj.name}</span>
                                  {isLeading && <span style={{ background: COLORS.gold+"22", color: COLORS.gold, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>🥇 Führend</span>}
                                </div>
                                <div style={{ fontSize: 12, color: COLORS.muted }}>{proj.category} · {proj.votes||0} Stimmen</div>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: 20, color: isLeading ? COLORS.gold : COLORS.text }}>{pct}%</div>
                            </div>
                            <div style={{ height: 8, background: "#0F172A", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                              <div style={{ height: "100%", width: pct+"%", background: isLeading ? "linear-gradient(90deg,"+COLORS.gold+",#F97316)" : "linear-gradient(90deg,"+COLORS.teal+","+COLORS.blue+")", borderRadius: 99 }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: COLORS.muted }}>
                              <span>{(proj.description||"").slice(0,70)}...</span>
                              <button onClick={() => { setDistributeTarget(proj); setImpactTab("ausschuettung"); }} style={{ background: COLORS.gold+"22", color: COLORS.gold, border: "1px solid "+COLORS.gold, padding: "4px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", marginLeft: 12 }}>🏆 Als Gewinner</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: ALLE PROJEKTE */}
            {impactTab === "projekte" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>Alle Projekte ({projects.length})</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {projects.map(proj => (
                    <div key={proj.id} style={{ background: COLORS.card, borderRadius: 14, border: "1px solid "+COLORS.border, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <span style={{ fontSize: 26, flexShrink: 0 }}>{proj.icon || "🌱"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{proj.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                              background: (proj.status==="gewonnen"||proj.status==="won") ? COLORS.gold+"22" : proj.status==="archiviert" ? COLORS.border : COLORS.teal+"22",
                              color: (proj.status==="gewonnen"||proj.status==="won") ? COLORS.gold : proj.status==="archiviert" ? COLORS.muted : COLORS.teal,
                              border: "1px solid "+((proj.status==="gewonnen"||proj.status==="won") ? COLORS.gold : proj.status==="archiviert" ? COLORS.border : COLORS.teal)
                            }}>{(proj.status==="gewonnen"||proj.status==="won") ? "🏆 Gewinner" : proj.status==="archiviert" ? "📦 Archiviert" : "🗳️ Aktiv"}</span>
                            <span style={{ fontSize: 11, color: COLORS.muted }}>{proj.category} · {proj.month}</span>
                          </div>
                          <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}>{proj.description}</div>
                          <div style={{ display: "flex", gap: 16, fontSize: 12, color: COLORS.muted, flexWrap: "wrap" }}>
                            <span>🗳️ {proj.votes||0} Stimmen</span>
                            {proj.awarded_eur > 0 && <span style={{ color: COLORS.gold }}>💰 {proj.awarded_eur} € vergeben</span>}
                            {proj.contact_name && <span>👤 {proj.contact_name}</span>}
                            {proj.website && <a href={proj.website} target="_blank" rel="noreferrer" style={{ color: COLORS.blue, textDecoration: "none" }}>🌐 Website</a>}
                          </div>
                          {proj.impact_report && (
                            <div style={{ marginTop: 10, background: "#0F172A", borderRadius: 8, padding: 12, fontSize: 12, color: COLORS.sub, borderLeft: "3px solid "+COLORS.green }}>📝 {proj.impact_report}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => {
                            const isNom = nominatedIds.includes(proj.id);
                            if (isNom) setNominatedIds(ids => ids.filter(id => id !== proj.id));
                            else if (nominatedIds.length < 3) setNominatedIds(ids => [...ids, proj.id]);
                          }} style={{
                            background: nominatedIds.includes(proj.id) ? COLORS.teal+"22" : "#0F172A",
                            color: nominatedIds.includes(proj.id) ? COLORS.teal : COLORS.muted,
                            border: "1px solid "+(nominatedIds.includes(proj.id) ? COLORS.teal : COLORS.border),
                            padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11
                          }}>{nominatedIds.includes(proj.id) ? "📌 Nominiert" : "📌 Nominieren"}</button>
                          <button onClick={() => setEditProject({...proj})} style={{ background: "#1E3A5F", color: COLORS.blue, border: "1px solid "+COLORS.blue, padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11 }}>✏️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: AUSSCHÜTTUNG */}
            {impactTab === "ausschuettung" && (
              <div>
                <div style={{ background: COLORS.card, borderRadius: 16, border: "1px solid "+COLORS.border, padding: 24, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>Pool ausschütten</div>
                  <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>Wähle das Gewinnerprojekt und schütte den Impact Pool aus.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    <div style={{ background: "#0F172A", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, marginBottom: 4 }}>Verfügbarer Pool</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.gold }}>{fmt(totalImpact)} €</div>
                    </div>
                    <div style={{ background: "#0F172A", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, marginBottom: 4 }}>Letzter Gewinner</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{projects.find(p=>p.status==="gewonnen"||p.status==="won")?.name || "Noch keiner"}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 10 }}>GEWINNERPROJEKT WÄHLEN</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {projects.filter(p => nominatedIds.includes(p.id)).map(proj => (
                      <button key={proj.id} onClick={() => setDistributeTarget(proj)} style={{
                        background: distributeTarget?.id === proj.id ? COLORS.gold+"22" : "#0F172A",
                        border: "1px solid "+(distributeTarget?.id === proj.id ? COLORS.gold : COLORS.border),
                        color: COLORS.text, borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                        textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <span style={{ fontSize: 20 }}>{proj.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{proj.name}</div>
                          <div style={{ fontSize: 12, color: COLORS.muted }}>{proj.votes||0} Stimmen · {proj.category}</div>
                        </div>
                        {distributeTarget?.id === proj.id && <span style={{ color: COLORS.gold, fontSize: 18 }}>✓</span>}
                      </button>
                    ))}
                    {projects.filter(p => nominatedIds.includes(p.id)).length === 0 && (
                      <div style={{ background: "#0F172A", borderRadius: 10, padding: 16, color: COLORS.muted, fontSize: 13, textAlign: "center" }}>Erst Projekte nominieren (Tab "Aktuelle Runde")</div>
                    )}
                  </div>
                  {distributeTarget && (
                    <div style={{ background: "#0F172A", borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: "3px solid "+COLORS.teal }}>
                      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 8 }}>KONTAKT</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                        <div><span style={{ color: COLORS.muted }}>Kontakt: </span><span style={{ color: COLORS.text, fontWeight: 600 }}>{distributeTarget.contact_name || "–"}</span></div>
                        <div><span style={{ color: COLORS.muted }}>E-Mail: </span><span style={{ color: COLORS.blue }}>{distributeTarget.contact_email || "–"}</span></div>
                      </div>
                    </div>
                  )}
                  <button onClick={() => distributeTarget && distributePool()} disabled={!distributeTarget} style={{
                    width: "100%", background: distributeTarget ? "linear-gradient(135deg,"+COLORS.gold+",#F97316)" : COLORS.border,
                    color: distributeTarget ? "#fff" : COLORS.muted, border: "none", padding: "14px 0",
                    borderRadius: 12, cursor: distributeTarget ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15
                  }}>{distributeTarget ? "💸 "+fmt(totalImpact)+" € an "+distributeTarget.name+" ausschütten" : "Zuerst ein Projekt auswählen"}</button>
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 14 }}>Vergangene Ausschüttungen</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {projects.filter(p=>(p.status==="gewonnen"||p.status==="won")&&p.awarded_eur>0).map(proj => (
                    <div key={proj.id} style={{ background: COLORS.card, borderRadius: 14, border: "1px solid "+COLORS.gold+"33", padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 24 }}>{proj.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: COLORS.text }}>{proj.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>{proj.month} · {proj.category}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: COLORS.gold, fontSize: 18 }}>{proj.awarded_eur} €</div>
                        {proj.distributed_at && <div style={{ fontSize: 11, color: COLORS.muted }}>{new Date(proj.distributed_at).toLocaleDateString("de-DE")}</div>}
                      </div>
                      <span style={{ background: COLORS.green+"22", color: COLORS.green, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ Ausgezahlt</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: HISTORY */}
            {impactTab === "history" && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 16 }}>🏆 Alle Förderrunden</div>
                {[...new Set(projects.map(p => p.month))].sort((a,b)=>b.localeCompare(a)).map(month => {
                  const monthProjects = projects.filter(p => p.month === month);
                  const winner = monthProjects.find(p=>p.status==="gewonnen"||p.status==="won");
                  return (
                    <div key={month} style={{ background: COLORS.card, borderRadius: 16, border: "1px solid "+(winner ? COLORS.gold+"44" : COLORS.border), padding: 20, marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ background: "#0F172A", borderRadius: 10, padding: "6px 14px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted }}>📅 {new Date(month+"-01").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</div>
                        </div>
                        {winner && <div style={{ flex: 1 }}><span style={{ fontSize: 12, color: COLORS.muted }}>Gewinner: </span><span style={{ fontWeight: 700, color: COLORS.gold }}>{winner.icon} {winner.name}</span>{winner.awarded_eur>0 && <span style={{ fontSize: 12, color: COLORS.muted }}> · {winner.awarded_eur} €</span>}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {monthProjects.map(proj => (
                          <div key={proj.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0F172A", borderRadius: 10, border: (proj.status==="gewonnen"||proj.status==="won") ? "1px solid "+COLORS.gold+"44" : "1px solid transparent" }}>
                            <span style={{ fontSize: 18 }}>{proj.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.text }}>{proj.name}</div>
                              <div style={{ fontSize: 11, color: COLORS.muted }}>{proj.votes||0} Stimmen</div>
                            </div>
                            {(proj.status==="gewonnen"||proj.status==="won") && <span style={{ background: COLORS.gold+"22", color: COLORS.gold, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🏆 Gewonnen</span>}
                          </div>
                        ))}
                      </div>
                      {winner?.impact_report && (
                        <div style={{ marginTop: 14, background: "#0F172A", borderRadius: 10, padding: 14, fontSize: 13, color: COLORS.sub, borderLeft: "3px solid "+COLORS.green }}>
                          <div style={{ fontWeight: 700, color: COLORS.green, fontSize: 11, marginBottom: 6 }}>📝 IMPACT REPORT</div>
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

        {/* ── Modals ── */}

      {/* Runden-Einstellungen */}
      {showRoundSettings && (
        <Modal title="⚙️ Abstimmungs-Einstellungen" onClose={() => setShowRoundSettings(false)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, display: "block", marginBottom: 6 }}>ABSTIMMUNGS-DEADLINE</label>
            <input type="date" value={votingDeadline} onChange={e => setVotingDeadline(e.target.value)} style={{ width: "100%", background: "#0F172A", border: "1px solid "+COLORS.border, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, display: "block", marginBottom: 8 }}>ABSTIMMUNGSSTATUS</label>
            <button onClick={() => setVotingOpen(v => !v)} style={{ width: "100%", background: votingOpen ? "#064E3B" : "#450A0A", color: votingOpen ? COLORS.green : COLORS.red, border: "1px solid "+(votingOpen ? COLORS.green : COLORS.red), padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              {votingOpen ? "🟢 Läuft — Klicken zum Pausieren" : "🔴 Pausiert — Klicken zum Starten"}
            </button>
          </div>
          <button onClick={() => { setShowRoundSettings(false); showToast("Einstellungen gespeichert ✓"); }} style={{ width: "100%", background: COLORS.orange, color: "#fff", border: "none", padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Speichern ✓</button>
        </Modal>
      )}

      {/* Nominierungs-Modal */}
      {showNominateModal && (
        <Modal title="📌 Projekte nominieren (max. 3)" onClose={() => setShowNominateModal(false)}>
          <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16 }}>{nominatedIds.length}/3 ausgewählt</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
            {projects.filter(p => p.status === "aktiv" || p.status === "active").map(proj => {
              const sel = nominatedIds.includes(proj.id);
              return (
                <div key={proj.id} onClick={() => {
                  if (sel) setNominatedIds(ids => ids.filter(id => id !== proj.id));
                  else if (nominatedIds.length < 3) setNominatedIds(ids => [...ids, proj.id]);
                  else showToast("Maximal 3 Projekte auswählbar", "error");
                }} style={{
                  background: sel ? COLORS.teal+"33" : "#0F172A",
                  border: "2px solid "+(sel ? COLORS.teal : COLORS.border),
                  color: COLORS.text, borderRadius: 12, padding: "13px 16px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: sel ? COLORS.teal : COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {sel && <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>&#10003;</span>}
                  </div>
                  <span style={{ fontSize: 20 }}>{proj.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{proj.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{proj.category} &middot; {proj.votes||0} Stimmen</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <div onClick={() => { setNominatedIds([]); setShowNominateModal(false); }} style={{ flex: 1, background: COLORS.border, color: COLORS.sub, padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, textAlign: "center", fontSize: 14 }}>Zurücksetzen</div>
            <div onClick={() => { setShowNominateModal(false); showToast(nominatedIds.length > 0 ? nominatedIds.length+" Projekte nominiert" : "Keine Projekte ausgewählt"); }} style={{ flex: 2, background: nominatedIds.length > 0 ? COLORS.teal : COLORS.border, color: nominatedIds.length > 0 ? "#fff" : COLORS.muted, padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15, textAlign: "center" }}>Bestaetigen</div>
          </div>
        </Modal>
      )}

            {/* Wirker bearbeiten */}
      {editWirker && (
        <Modal title={`${editWirker.full_name || editWirker.name} bearbeiten`} onClose={() => setEditWirker(null)}>
          {[
            { label: "Anzeigename (Kurzname)", key: "name", type: "text" },
            { label: "Vollständiger Name", key: "full_name", type: "text" },
            { label: "Talent / Kategorie", key: "talent", type: "text" },
            { label: "Standort", key: "location", type: "text" },
            { label: "Stundensatz (€)", key: "hourly_rate", type: "number" },
            { label: "Bio", key: "bio", type: "textarea" },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, display: "block", marginBottom: 5 }}>{field.label}</label>
              {field.type === "textarea"
                ? <textarea value={editWirker[field.key] || ""} onChange={e => setEditWirker(p => ({ ...p, [field.key]: e.target.value }))} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
                : <input type={field.type} value={editWirker[field.key] || ""} onChange={e => setEditWirker(p => ({ ...p, [field.key]: field.type === "number" ? parseFloat(e.target.value) : e.target.value }))} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              }
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setEditWirker(null)} style={{ flex: 1, background: COLORS.border, color: COLORS.sub, border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={() => saveWirker(editWirker)} style={{ flex: 2, background: COLORS.orange, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Speichern ✓</button>
          </div>
        </Modal>
      )}

      {/* Zahlung Detail */}
      {editPayment && (
        <Modal title="Zahlung bearbeiten" onClose={() => setEditPayment(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              ["Wirker", editPayment.wirker_name],
              ["Betrag", `${fmt(editPayment.amount_eur)} €`],
              ["Impact", `${fmt(editPayment.impact_eur)} €`],
              ["Datum", fmtDate(editPayment.created_date)],
            ].map(([l, v]) => (
              <div key={l} style={{ background: "#0F172A", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, marginBottom: 6 }}>Leistung</div>
            <div style={{ fontSize: 14, color: COLORS.sub }}>{editPayment.item_name}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, marginBottom: 8 }}>Status ändern</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["escrow", "ausgezahlt", "reklamation", "rueckerstattung"].map(s => (
                <button key={s} onClick={() => updatePaymentStatus(editPayment, s)} style={{
                  background: editPayment.status === s ? COLORS.orange : "#0F172A",
                  color: editPayment.status === s ? "#fff" : COLORS.sub,
                  border: `1px solid ${editPayment.status === s ? COLORS.orange : COLORS.border}`,
                  padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700
                }}>{statusMap[s]?.label || s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {editPayment.status === "escrow" && (
              <>
                <button onClick={() => releaseEscrow(editPayment)} style={{ flex: 1, background: "#064E3B", color: COLORS.green, border: `1px solid ${COLORS.green}`, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}>✓ Treuhand freigeben</button>
                <button onClick={() => refundPayment(editPayment)} style={{ flex: 1, background: "#450A0A", color: COLORS.red, border: `1px solid ${COLORS.red}`, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}>↩ Erstatten</button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Neues Projekt */}
      {showNewProject && (
        <Modal title="Neues Impact-Projekt" onClose={() => setShowNewProject(false)}>
          {[
            { label: "Projektname", key: "name", type: "text", placeholder: "z.B. Stadtgarten Berlin" },
            { label: "Kategorie", key: "category", type: "select", options: ["Umwelt","Soziales","Nachhaltigkeit","Bildung","Kultur"] },
            { label: "Beschreibung", key: "description", type: "textarea", placeholder: "Kurze Beschreibung des Projekts…" },
            { label: "Icon (Emoji)", key: "icon", type: "text", placeholder: "🌱" },
            { label: "Akzentfarbe (Hex)", key: "color", type: "text", placeholder: "#10B981" },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, display: "block", marginBottom: 5 }}>{field.label}</label>
              {field.type === "textarea"
                ? <textarea value={newProject[field.key] || ""} onChange={e => setNewProject(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", minHeight: 70, boxSizing: "border-box" }} />
                : field.type === "select"
                ? <select value={newProject[field.key]} onChange={e => setNewProject(p => ({ ...p, [field.key]: e.target.value }))} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                : <input type="text" value={newProject[field.key] || ""} onChange={e => setNewProject(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              }
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setShowNewProject(false)} style={{ flex: 1, background: COLORS.border, color: COLORS.sub, border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={addProject} style={{ flex: 2, background: COLORS.green, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Hinzufügen ✓</button>
          </div>
        </Modal>
      )}

      {/* Projekt bearbeiten Modal */}
      {editProject && (
        <Modal title={`${editProject.name} bearbeiten`} onClose={() => setEditProject(null)}>
          {[
            { label: "Projektname", key: "name", type: "text" },
            { label: "Kategorie", key: "category", type: "select", options: ["Umwelt","Soziales","Nachhaltigkeit","Bildung","Kultur","Sport"] },
            { label: "Beschreibung", key: "description", type: "textarea" },
            { label: "Icon (Emoji)", key: "icon", type: "text" },
            { label: "Akzentfarbe (Hex)", key: "color", type: "text" },
            { label: "Website", key: "website", type: "text" },
            { label: "Ansprechpartner Name", key: "contact_name", type: "text" },
            { label: "Ansprechpartner E-Mail", key: "contact_email", type: "text" },
            { label: "Tags (kommagetrennt)", key: "_tags_str", type: "text" },
            { label: "Impact Report", key: "impact_report", type: "textarea" },
          ].map(field => {
            const value = field.key === "_tags_str"
              ? (editProject.tags || []).join(", ")
              : editProject[field.key] || "";
            const onChange = (v) => {
              if (field.key === "_tags_str") {
                setEditProject(p => ({ ...p, tags: v.split(",").map(t => t.trim()).filter(Boolean) }));
              } else {
                setEditProject(p => ({ ...p, [field.key]: v }));
              }
            };
            return (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, display: "block", marginBottom: 5 }}>{field.label}</label>
                {field.type === "textarea"
                  ? <textarea value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", minHeight: field.key === "impact_report" ? 100 : 70, boxSizing: "border-box" }} />
                  : field.type === "select"
                  ? <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  : <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", background: "#0F172A", border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                }
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setEditProject(null)} style={{ flex: 1, background: COLORS.border, color: COLORS.sub, border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={() => saveProject(editProject)} style={{ flex: 2, background: COLORS.green, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Speichern ✓</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #475569; }
        select option { background: #0F172A; color: #F1F5F9; }
      `}</style>
    </div>
  );
}

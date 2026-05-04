// build: v7-LIVE-2026-04-30
import { useState, useEffect } from "react";
import { HuiWirkerDB as HuiWirker, HuiPaymentDB as HuiPayment, HuiImpactProjectDB as HuiImpactProject } from "@/lib/supabaseClient";
import { base44 } from "@/api/base44Client";
const User = { list: () => base44.entities.User.list() };

const C = {
  bg: "#0A0F1E", card: "#111827", card2: "#1A2235", border: "#1E2D45",
  text: "#F1F5F9", sub: "#94A3B8", muted: "#475569",
  orange: "#F97316", green: "#10B981", red: "#EF4444",
  blue: "#3B82F6", teal: "#0D9488", gold: "#F59E0B",
  purple: "#8B5CF6", cyan: "#06B6D4",
};

const fmt = (n) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(n) || 0);
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }};
const fmtDateTime = (d) => { try { return new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }};

// Status normalisieren (DB hat verschiedene Schreibweisen)
const normalizeStatus = (s) => {
  if (!s) return "aktiv";
  const map = { active: "aktiv", aktiv: "aktiv", won: "gewonnen", gewonnen: "gewonnen", archiviert: "archiviert", archived: "archiviert" };
  return map[s.toLowerCase()] || s;
};

const STATUS_PAYMENT = {
  escrow:          { label: "⏳ Treuhand",    bg: "#451A03", color: "#FCD34D" },
  ausgezahlt:      { label: "✓ Ausgezahlt",  bg: "#022C22", color: "#34D399" },
  rueckerstattung: { label: "↩ Erstattet",   bg: "#450A0A", color: "#FCA5A5" },
  reklamation:     { label: "⚠ Reklamation", bg: "#3B1515", color: "#FCA5A5" },
};
const STATUS_EMP = {
  empfohlen:       { label: "👍 Empfohlen",  bg: "#022C22", color: "#34D399" },
  nicht_empfohlen: { label: "👎 Abgelehnt",  bg: "#450A0A", color: "#FCA5A5" },
  ausstehend:      { label: "⏳ Ausstehend", bg: "#1C1A08", color: "#FCD34D" },
};

const Badge = ({ map, val }) => {
  const s = (map || {})[val] || { label: val || "—", bg: "#1E293B", color: "#94A3B8" };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{s.label}</span>;
};

function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.card, zIndex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "error" ? C.red : C.green, color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 8, animation: "slideIn 0.2s ease" }}>
      {toast.type === "error" ? "❌" : "✅"} {toast.msg}
    </div>
  );
}

function Confirm({ data, onCancel }) {
  if (!data) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, width: "100%", maxWidth: 400, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: 24, textAlign: "center", marginBottom: 14 }}>⚠️</div>
        <div style={{ fontSize: 15, color: C.text, textAlign: "center", marginBottom: 24, lineHeight: 1.5, whiteSpace: "pre-line" }}>{data.msg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
          <button onClick={data.fn} style={{ flex: 2, background: C.red, color: "#fff", border: "none", padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}>Bestätigen</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: color || C.text, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, rows }) {
  const base = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      {rows
        ? <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...base, resize: "vertical" }} />
        : <input type={type} value={value || ""} onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [payments, setPayments] = useState([]);
  const [wirker, setWirker] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // Wirker
  const [searchWirker, setSearchWirker] = useState("");
  const [selectedWirker, setSelectedWirker] = useState(null);
  const [editWirker, setEditWirker] = useState(null);

  // Payments
  const [filterPay, setFilterPay] = useState("all");
  const [editPayment, setEditPayment] = useState(null);

  // Impact
  const [impactTab, setImpactTab] = useState("runde");
  const [nominatedIds, setNominatedIds] = useState([]);
  const [votingOpen, setVotingOpen] = useState(false);
  const [votingStart, setVotingStart] = useState("");
  const [votingEnd, setVotingEnd] = useState("");
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", category: "Umwelt", description: "", icon: "🌱", color: "#10B981", contact_name: "", contact_email: "", website: "", tags: "" });
  const [editProject, setEditProject] = useState(null);
  const [distributeTarget, setDistributeTarget] = useState(null);
  const [showDistribute, setShowDistribute] = useState(false);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const askConfirm = (msg, fn) => setConfirm({ msg, fn });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, w, proj, u] = await Promise.all([
        HuiPayment.list().catch(() => []),
        HuiWirker.list().catch(() => []),
        HuiImpactProject.list().catch(() => []),
        User.list().catch(() => []),
      ]);
      setPayments(p || []);
      setWirker(w || []);
      setProjects((proj || []).map(x => ({ ...x, status: normalizeStatus(x.status) })));
      setUsers(u || []);
    } catch (e) {
      showToast("Fehler beim Laden der Daten", "error");
    }
    setLoading(false);
  }

  // ── WIRKER ACTIONS ───────────────────────────────────────────────────────
  async function toggleVerify(w) {
    try {
      await HuiWirker.update(w.id, { verified: !w.verified });
      setWirker(prev => prev.map(x => x.id === w.id ? { ...x, verified: !w.verified } : x));
      if (selectedWirker?.id === w.id) setSelectedWirker(s => ({ ...s, verified: !s.verified }));
      showToast(!w.verified ? `${w.name} verifiziert ✓` : `Verifizierung zurückgezogen`);
    } catch { showToast("Fehler", "error"); }
  }

  async function saveWirker() {
    try {
      await HuiWirker.update(editWirker.id, editWirker);
      setWirker(prev => prev.map(x => x.id === editWirker.id ? { ...x, ...editWirker } : x));
      if (selectedWirker?.id === editWirker.id) setSelectedWirker({ ...editWirker });
      setEditWirker(null);
      showToast("Profil gespeichert ✓");
    } catch { showToast("Fehler beim Speichern", "error"); }
  }

  async function deleteWirker(w) {
    askConfirm(`${w.full_name || w.name} wirklich löschen?\nDiese Aktion ist unwiderruflich.`, async () => {
      try {
        await HuiWirker.delete(w.id);
        setWirker(prev => prev.filter(x => x.id !== w.id));
        setSelectedWirker(null); setConfirm(null);
        showToast(`${w.name} gelöscht`);
      } catch { showToast("Fehler", "error"); setConfirm(null); }
    });
  }

  // ── PAYMENT ACTIONS ──────────────────────────────────────────────────────
  async function updatePayStatus(p, status) {
    try {
      await HuiPayment.update(p.id, { status });
      setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status } : x));
      setEditPayment(prev => prev ? { ...prev, status } : null);
      showToast("Status aktualisiert ✓");
    } catch { showToast("Fehler", "error"); }
  }

  async function releaseEscrow(p) {
    askConfirm(`Treuhand-Zahlung von ${fmt(p.amount_eur)} €\nan ${p.wirker_name} freigeben?`, async () => {
      try {
        await HuiPayment.update(p.id, { status: "ausgezahlt" });
        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "ausgezahlt" } : x));
        setEditPayment(null); setConfirm(null);
        showToast(`${fmt(p.amount_eur)} € an ${p.wirker_name} freigegeben ✓`);
      } catch { showToast("Fehler", "error"); setConfirm(null); }
    });
  }

  async function refundPayment(p) {
    askConfirm(`Zahlung von ${fmt(p.amount_eur)} € erstatten?\nDies kann nicht rückgängig gemacht werden.`, async () => {
      try {
        await HuiPayment.update(p.id, { status: "rueckerstattung", payment_status: "refunded" });
        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "rueckerstattung", payment_status: "refunded" } : x));
        setEditPayment(null); setConfirm(null);
        showToast("Erstattung eingeleitet ✓");
      } catch { showToast("Fehler", "error"); setConfirm(null); }
    });
  }

  // ── IMPACT ACTIONS ───────────────────────────────────────────────────────
  const totalImpact = payments.reduce((s, p) => s + parseFloat(p.impact_eur || 0), 0);
  const activeProjects = projects.filter(p => p.status === "aktiv");
  const nominatedProjects = projects.filter(p => nominatedIds.includes(p.id));

  async function distributePool() {
    if (!distributeTarget) return;
    const winner = projects.find(p => p.id === distributeTarget);
    if (!winner) return;
    const total = parseFloat(totalImpact.toFixed(2));
    try {
      await HuiImpactProject.update(winner.id, { status: "gewonnen", awarded_eur: total, distributed_at: new Date().toISOString() });
      for (const id of nominatedIds.filter(id => id !== distributeTarget)) {
        await HuiImpactProject.update(id, { status: "archiviert" });
      }
      setProjects(prev => prev.map(p => {
        if (p.id === winner.id) return { ...p, status: "gewonnen", awarded_eur: total, distributed_at: new Date().toISOString() };
        if (nominatedIds.includes(p.id)) return { ...p, status: "archiviert" };
        return p;
      }));
      setNominatedIds([]);
      setVotingOpen(false);
      setDistributeTarget(null);
      setShowDistribute(false);
      setConfirm(null);
      showToast(`💸 ${fmt(total)} € an "${winner.name}" ausgeschüttet!`);
    } catch { showToast("Fehler beim Ausschütten", "error"); setConfirm(null); }
  }

  async function addProject() {
    if (!newProject.name.trim()) { showToast("Name ist Pflicht", "error"); return; }
    try {
      const data = {
        ...newProject,
        tags: typeof newProject.tags === "string" ? newProject.tags.split(",").map(t => t.trim()).filter(Boolean) : newProject.tags,
        votes: 0, status: "aktiv", month: new Date().toISOString().slice(0, 7), awarded_eur: 0,
      };
      const created = await HuiImpactProject.create(data);
      setProjects(prev => [...prev, { ...created, status: normalizeStatus(created.status) }]);
      setNewProject({ name: "", category: "Umwelt", description: "", icon: "🌱", color: "#10B981", contact_name: "", contact_email: "", website: "", tags: "" });
      setShowNewProject(false);
      showToast("Projekt hinzugefügt ✓");
    } catch { showToast("Fehler beim Hinzufügen", "error"); }
  }

  async function saveProject() {
    try {
      const data = {
        ...editProject,
        tags: typeof editProject.tags === "string" ? editProject.tags.split(",").map(t => t.trim()).filter(Boolean) : editProject.tags,
      };
      await HuiImpactProject.update(data.id, data);
      setProjects(prev => prev.map(p => p.id === data.id ? { ...p, ...data, status: normalizeStatus(data.status) } : p));
      setEditProject(null);
      showToast("Projekt gespeichert ✓");
    } catch { showToast("Fehler", "error"); }
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

  async function setProjectStatus(proj, status) {
    try {
      await HuiImpactProject.update(proj.id, { status });
      setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, status } : p));
      showToast(`Status auf „${status}" gesetzt ✓`);
    } catch { showToast("Fehler", "error"); }
  }

  // CSV Export
  function exportCSV() {
    const rows = [["Datum", "Wirker", "Leistung", "Betrag (€)", "Impact (€)", "Status", "Empfehlung"]];
    payments.forEach(p => rows.push([fmtDate(p.created_date), p.wirker_name, `"${p.item_name || ""}"`, fmt(p.amount_eur), fmt(p.impact_eur), p.status, p.empfehlung]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `hui-zahlungen-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  // ── Computed Stats ───────────────────────────────────────────────────────
  const totalRev = payments.reduce((s, p) => s + parseFloat(p.amount_eur || 0), 0);
  const huiEarnings = payments.reduce((s, p) => s + (parseFloat(p.amount_eur || 0) * 0.1275), 0);
  const escrowOpen = payments.filter(p => p.status === "escrow");
  const filteredPay = filterPay === "all" ? payments : payments.filter(p => p.status === filterPay);
  const filteredWirker = wirker.filter(w => !searchWirker || (w.name + w.full_name + w.talent + w.location).toLowerCase().includes(searchWirker.toLowerCase()));

  const TABS = [
    { key: "overview", icon: "📊", label: "Übersicht" },
    { key: "payments", icon: "💳", label: "Zahlungen" },
    { key: "wirker", icon: "👥", label: "Wirker" },
    { key: "impact", icon: "🌱", label: "Impact Pool" },
    { key: "users", icon: "🔑", label: "Nutzer" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 40 }}>⚙️</div>
      <div style={{ color: C.sub, fontSize: 16, fontWeight: 600 }}>Daten werden geladen…</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`* { box-sizing: border-box; } input,textarea,select { color-scheme: dark; } @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }`}</style>

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "center", gap: 16, height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #0D9488, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1.1 }}>HUI Admin</div>
            <div style={{ fontSize: 10, color: C.muted }}>Human United Intelligent</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 2, marginLeft: 20, flex: 1 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background: tab === t.key ? C.teal + "22" : "none", color: tab === t.key ? C.teal : C.muted, border: tab === t.key ? `1px solid ${C.teal}44` : "1px solid transparent", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: tab === t.key ? 700 : 500, fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {escrowOpen.length > 0 && <span style={{ background: C.gold + "22", color: C.gold, border: `1px solid ${C.gold}44`, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>⏳ {escrowOpen.length} offen</span>}
          <button onClick={loadAll} style={{ background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>⟳ Refresh</button>
        </div>
      </div>

      <div style={{ padding: "28px 28px 60px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ═══ ÜBERSICHT ═══════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Übersicht</h1>
            <p style={{ color: C.muted, marginBottom: 28, fontSize: 14 }}>Alle wichtigen Zahlen auf einen Blick</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard icon="💰" value={`${fmt(totalRev)} €`} label="Gesamtumsatz" sub={`${payments.length} Buchungen`} color={C.orange} />
              <StatCard icon="🏦" value={`${fmt(huiEarnings)} €`} label="HUI Einnahmen" sub="12,75% der Buchungen" color={C.blue} />
              <StatCard icon="🌱" value={`${fmt(totalImpact)} €`} label="Impact Pool" sub="2,25% aus jeder Buchung" color={C.green} />
              <StatCard icon="⏳" value={escrowOpen.length} label="Treuhand offen" sub="warten auf Freigabe" color={escrowOpen.length > 0 ? C.gold : C.muted} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard icon="👥" value={wirker.length} label="Wirker" sub={`${wirker.filter(w => w.verified).length} verifiziert`} color={C.teal} />
              <StatCard icon="🌍" value={activeProjects.length} label="Aktive Projekte" sub="im Impact Pool" color={C.purple} />
              <StatCard icon="👤" value={users.length} label="Nutzer" sub="registriert" color={C.cyan} />
              <StatCard icon="📈" value={`${payments.filter(p => p.empfehlung === "empfohlen").length}`} label="Empfehlungen" sub="verifizierte Reviews" color={C.gold} />
            </div>

            {/* Treuhand + Top Wirker */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>⏳ Offene Treuhand-Buchungen</div>
                  <button onClick={() => setTab("payments")} style={{ background: "none", border: "none", color: C.orange, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Alle →</button>
                </div>
                {escrowOpen.length === 0
                  ? <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 14 }}>✓ Keine offenen Treuhand-Buchungen</div>
                  : escrowOpen.map((p, i) => (
                    <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.wirker_name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{p.item_name} · {fmtDate(p.created_date)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>{fmt(p.amount_eur)} €</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                          <button onClick={() => releaseEscrow(p)} style={{ background: "#022C22", color: C.green, border: `1px solid ${C.green}44`, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✓ Freigeben</button>
                          <button onClick={() => refundPayment(p)} style={{ background: "#450A0A", color: C.red, border: `1px solid ${C.red}44`, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>↩ Erstatten</button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>🏆 Top Wirker</div>
                  <button onClick={() => setTab("wirker")} style={{ background: "none", border: "none", color: C.orange, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Alle →</button>
                </div>
                {[...wirker].sort((a, b) => (b.bookings || 0) - (a.bookings || 0)).slice(0, 5).map((w, i) => (
                  <div key={i} onClick={() => { setSelectedWirker(w); setTab("wirker"); }} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.muted, width: 18 }}>#{i + 1}</div>
                    {w.img ? <img src={w.img} alt="" style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover" }} /> : <div style={{ width: 34, height: 34, borderRadius: 9, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{w.full_name || w.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{w.talent}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{w.bookings || 0} Buchungen</div>
                      {w.verified && <span style={{ fontSize: 10, color: C.green }}>✓ Verifiziert</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Letzte Transaktionen */}
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>💳 Letzte Transaktionen</div>
                <button onClick={() => setTab("payments")} style={{ background: "none", border: "none", color: C.orange, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Alle →</button>
              </div>
              {payments.length === 0
                ? <div style={{ padding: 32, textAlign: "center", color: C.muted }}>Noch keine Transaktionen</div>
                : <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: C.bg }}>{["Datum", "Wirker", "Leistung", "Betrag", "Impact", "Status", "Empfehlung"].map(h => <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>)}</tr></thead>
                    <tbody>{payments.slice(0, 8).map((p, i) => (
                      <tr key={i} onClick={() => { setEditPayment(p); setTab("payments"); }} style={{ background: i % 2 ? C.card2 : C.card, cursor: "pointer" }}>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: C.sub, whiteSpace: "nowrap" }}>{fmtDate(p.created_date)}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600 }}>{p.wirker_name}</td>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: C.sub }}>{p.item_name}</td>
                        <td style={{ padding: "11px 16px", fontSize: 14, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{fmt(p.amount_eur)} €</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: C.green, fontWeight: 700, whiteSpace: "nowrap" }}>+{fmt(p.impact_eur)} €</td>
                        <td style={{ padding: "11px 16px" }}><Badge map={STATUS_PAYMENT} val={p.status} /></td>
                        <td style={{ padding: "11px 16px" }}><Badge map={STATUS_EMP} val={p.empfehlung} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>}
            </div>
          </div>
        )}

        {/* ═══ ZAHLUNGEN ═══════════════════════════════════════════════════ */}
        {tab === "payments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Zahlungen</h1>
                <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>{payments.length} Transaktionen · {fmt(totalRev)} € Umsatz</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[{ key: "all", label: "Alle" }, { key: "escrow", label: "⏳ Treuhand" }, { key: "ausgezahlt", label: "✓ Ausgezahlt" }, { key: "rueckerstattung", label: "↩ Erstattet" }].map(f => (
                  <button key={f.key} onClick={() => setFilterPay(f.key)} style={{ background: filterPay === f.key ? C.orange : C.card, color: filterPay === f.key ? "#fff" : C.sub, border: `1px solid ${filterPay === f.key ? C.orange : C.border}`, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{f.label}</button>
                ))}
                <button onClick={exportCSV} style={{ background: C.card, color: C.sub, border: `1px solid ${C.border}`, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>⬇ CSV</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
              <StatCard icon="💰" value={`${fmt(totalRev)} €`} label="Gesamtumsatz" color={C.orange} />
              <StatCard icon="⏳" value={`${fmt(escrowOpen.reduce((s, p) => s + parseFloat(p.amount_eur || 0), 0))} €`} label="In Treuhand" sub={`${escrowOpen.length} Buchungen`} color={C.gold} />
              <StatCard icon="🌱" value={`${fmt(totalImpact)} €`} label="Impact Pool gesamt" color={C.green} />
            </div>
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                {filteredPay.length === 0
                  ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Keine Einträge gefunden</div>
                  : <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: C.bg }}>{["Datum", "Wirker", "Leistung", "Betrag", "HUI (12,75%)", "Impact (2,25%)", "Status", "Empfehlung", "Aktionen"].map(h => <th key={h} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>)}</tr></thead>
                    <tbody>{filteredPay.map((p, i) => (
                      <tr key={i} style={{ background: i % 2 ? C.card2 : C.card, borderBottom: `1px solid ${C.border}22` }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: C.sub, whiteSpace: "nowrap" }}>{fmtDateTime(p.created_date)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{p.wirker_name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: C.sub, maxWidth: 180 }}>{p.item_name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" }}>{fmt(p.amount_eur)} €</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: C.blue, fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(parseFloat(p.amount_eur || 0) * 0.1275)} €</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: C.green, fontWeight: 700, whiteSpace: "nowrap" }}>+{fmt(p.impact_eur)} €</td>
                        <td style={{ padding: "12px 16px" }}><Badge map={STATUS_PAYMENT} val={p.status} /></td>
                        <td style={{ padding: "12px 16px" }}><Badge map={STATUS_EMP} val={p.empfehlung} /></td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setEditPayment(p)} style={{ background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Detail</button>
                            {p.status === "escrow" && <button onClick={() => releaseEscrow(p)} style={{ background: "#022C22", color: C.green, border: `1px solid ${C.green}44`, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Freigeben</button>}
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ WIRKER ══════════════════════════════════════════════════════ */}
        {tab === "wirker" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedWirker ? "1fr 1.3fr" : "1fr", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Wirker</h1>
                  <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>{wirker.length} registriert · {wirker.filter(w => w.verified).length} verifiziert</p>
                </div>
              </div>
              <input value={searchWirker} onChange={e => setSearchWirker(e.target.value)} placeholder="Suche nach Name, Talent, Ort…" style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, color: C.text, padding: "10px 14px", borderRadius: 10, fontSize: 13, outline: "none", marginBottom: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredWirker.length === 0
                  ? <div style={{ background: C.card, borderRadius: 12, padding: 32, textAlign: "center", color: C.muted }}>Keine Wirker gefunden</div>
                  : filteredWirker.map(w => (
                    <div key={w.id} onClick={() => setSelectedWirker(w)} style={{ background: selectedWirker?.id === w.id ? C.teal + "15" : C.card, border: `1px solid ${selectedWirker?.id === w.id ? C.teal : C.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                      {w.img ? <img src={w.img} alt="" style={{ width: 44, height: 44, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, borderRadius: 11, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{w.full_name || w.name}</span>
                          {w.verified && <span style={{ fontSize: 10, background: C.green + "22", color: C.green, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{w.talent} · {w.location}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{w.bookings || 0} Buchungen</div>
                        <div style={{ fontSize: 11, color: C.teal }}>{fmt(w.impact_eur || 0)} € Impact</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Wirker Detail */}
            {selectedWirker && (
              <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden", position: "sticky", top: 80, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
                {selectedWirker.header_img && <img src={selectedWirker.header_img} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />}
                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                    {selectedWirker.img ? <img src={selectedWirker.img} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 64, height: 64, borderRadius: 16, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>👤</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{selectedWirker.full_name || selectedWirker.name}</div>
                      <div style={{ color: C.muted, fontSize: 13 }}>{selectedWirker.talent} · {selectedWirker.location}</div>
                      {selectedWirker.verified && <span style={{ fontSize: 11, background: C.green + "22", color: C.green, padding: "2px 8px", borderRadius: 10, fontWeight: 700, display: "inline-block", marginTop: 4 }}>✓ Verifiziert</span>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                    {[["📚", selectedWirker.bookings || 0, "Buchungen"], ["👥", selectedWirker.followers || 0, "Follower"], ["🌱", `${fmt(selectedWirker.impact_eur || 0)} €`, "Impact"]].map(([icon, val, label]) => (
                      <div key={label} style={{ background: C.card2, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 20 }}>{icon}</div>
                        <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>{val}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {selectedWirker.bio && <div style={{ background: C.card2, borderRadius: 10, padding: 14, fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>"{selectedWirker.bio}"</div>}
                  {selectedWirker.hourly_rate && <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Stundensatz: <span style={{ color: C.text, fontWeight: 700 }}>{selectedWirker.hourly_rate} €/h</span></div>}
                  {selectedWirker.skills?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>{selectedWirker.skills.map(s => <span key={s} style={{ background: C.teal + "22", color: C.teal, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s}</span>)}</div>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => toggleVerify(selectedWirker)} style={{ flex: 1, background: selectedWirker.verified ? "#450A0A" : "#022C22", color: selectedWirker.verified ? C.red : C.green, border: `1px solid ${selectedWirker.verified ? C.red : C.green}44`, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      {selectedWirker.verified ? "✗ Verifizierung entziehen" : "✓ Verifizieren"}
                    </button>
                    <button onClick={() => setEditWirker({ ...selectedWirker })} style={{ flex: 1, background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✏ Bearbeiten</button>
                  </div>
                  <button onClick={() => deleteWirker(selectedWirker)} style={{ width: "100%", marginTop: 8, background: "none", color: C.red, border: `1px solid ${C.red}44`, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>🗑 Löschen</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ IMPACT POOL ═════════════════════════════════════════════════ */}
        {tab === "impact" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>🌱 Impact Pool</h1>
                <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Gesammelte Mittel, Abstimmung & Ausschüttung</p>
              </div>
              <button onClick={() => setShowNewProject(true)} style={{ background: C.teal + "22", color: C.teal, border: `1px solid ${C.teal}`, padding: "9px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ Projekt hinzufügen</button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
              <StatCard icon="💰" value={`${fmt(totalImpact)} €`} label="Aktueller Pool" color={C.gold} />
              <StatCard icon="📌" value={`${nominatedIds.length}/3`} label="Nominiert" color={C.teal} />
              <StatCard icon="👥" value={nominatedProjects.reduce((s, p) => s + (p.votes || 0), 0)} label="Stimmen (nominiert)" color={C.blue} />
              <StatCard icon={votingOpen ? "🟢" : "🔴"} value={votingOpen ? "Offen" : "Geschlossen"} label="Abstimmungsstatus" color={votingOpen ? C.green : C.red} />
            </div>

            {/* Sub-Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
              {[{ key: "runde", label: "🗓 Aktuelle Runde" }, { key: "projekte", label: "📋 Alle Projekte" }, { key: "ausschuettung", label: "💸 Ausschüttung" }, { key: "history", label: "🏆 History" }].map(t => (
                <button key={t.key} onClick={() => setImpactTab(t.key)} style={{ padding: "10px 18px", border: "none", borderBottom: impactTab === t.key ? `2px solid ${C.teal}` : "2px solid transparent", background: "none", color: impactTab === t.key ? C.teal : C.muted, cursor: "pointer", fontWeight: impactTab === t.key ? 700 : 500, fontSize: 13, marginBottom: -1 }}>{t.label}</button>
              ))}
            </div>

            {/* RUNDE */}
            {impactTab === "runde" && (
              <div>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Abstimmungszeitraum festlegen</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase" }}>START</label>
                      <input type="datetime-local" value={votingStart} onChange={e => setVotingStart(e.target.value)} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase" }}>ENDE</label>
                      <input type="datetime-local" value={votingEnd} onChange={e => setVotingEnd(e.target.value)} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Abstimmung {votingOpen ? "läuft 🟢" : "pausiert 🔴"}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{votingOpen ? "Wirker können aktuell abstimmen" : "Keine neuen Stimmen möglich"}</div>
                    </div>
                    <button onClick={() => {
                      if (!votingOpen && (!votingStart || !votingEnd)) { showToast("Bitte erst Start- und Enddatum setzen", "error"); return; }
                      setVotingOpen(v => !v);
                      showToast(votingOpen ? "Abstimmung pausiert" : "Abstimmung gestartet ✓");
                    }} style={{ background: votingOpen ? "#022C22" : "#1E3A5F", color: votingOpen ? C.green : C.blue, border: `1px solid ${votingOpen ? C.green : C.blue}44`, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>
                      {votingOpen ? "⏸ Pausieren" : "▶ Starten"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowNominateModal(true)} style={{ flex: 1, background: C.teal + "22", color: C.teal, border: `1px solid ${C.teal}`, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>📌 Projekte nominieren ({nominatedIds.length}/3)</button>
                    <button onClick={() => setImpactTab("ausschuettung")} style={{ flex: 1, background: C.gold + "22", color: C.gold, border: `1px solid ${C.gold}`, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>💸 Pool ausschütten</button>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Nominierte Projekte ({nominatedIds.length}/3)</div>
                {nominatedIds.length === 0
                  ? <div style={{ background: C.card, borderRadius: 14, border: `2px dashed ${C.border}`, padding: 32, textAlign: "center", color: C.muted }}>Noch keine Projekte nominiert — klicke „Projekte nominieren"</div>
                  : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {nominatedProjects.sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((proj, i) => {
                      const totalV = nominatedProjects.reduce((s, p) => s + (p.votes || 0), 0);
                      const pct = totalV > 0 ? Math.round((proj.votes || 0) / totalV * 100) : 0;
                      return (
                        <div key={proj.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${i === 0 && totalV > 0 ? C.gold : C.border}`, padding: 18 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                            <span style={{ fontSize: 26 }}>{proj.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 15 }}>{proj.name}</span>
                                {i === 0 && totalV > 0 && <span style={{ background: C.gold + "22", color: C.gold, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>🥇 Führend</span>}
                              </div>
                              <div style={{ fontSize: 12, color: C.muted }}>{proj.category} · {proj.votes || 0} Stimmen</div>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? C.gold : C.sub }}>{pct}%</div>
                          </div>
                          <div style={{ background: C.bg, borderRadius: 6, height: 8, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? C.gold : C.teal, borderRadius: 6, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                }
              </div>
            )}

            {/* ALLE PROJEKTE */}
            {impactTab === "projekte" && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  {["Alle", "aktiv", "gewonnen", "archiviert"].map(f => (
                    <button key={f} style={{ background: C.card, color: C.sub, border: `1px solid ${C.border}`, padding: "6px 14px", borderRadius: 8, cursor: "default", fontSize: 13, fontWeight: 600 }}>
                      {f === "Alle" ? `Alle (${projects.length})` : `${f} (${projects.filter(p => p.status === f).length})`}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {projects.map(proj => (
                    <div key={proj.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 28, flexShrink: 0 }}>{proj.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{proj.name}</span>
                          <span style={{ background: proj.status === "aktiv" ? C.green + "22" : proj.status === "gewonnen" ? C.gold + "22" : C.muted + "22", color: proj.status === "aktiv" ? C.green : proj.status === "gewonnen" ? C.gold : C.muted, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{proj.status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.muted }}>{proj.category} · {proj.votes || 0} Stimmen{proj.awarded_eur > 0 ? ` · ${fmt(proj.awarded_eur)} € erhalten` : ""}</div>
                        {proj.contact_name && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Kontakt: {proj.contact_name} {proj.contact_email ? `(${proj.contact_email})` : ""}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {proj.status !== "aktiv" && <button onClick={() => setProjectStatus(proj, "aktiv")} style={{ background: C.green + "22", color: C.green, border: `1px solid ${C.green}44`, padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Aktivieren</button>}
                        {proj.status === "aktiv" && <button onClick={() => setProjectStatus(proj, "archiviert")} style={{ background: C.muted + "22", color: C.muted, border: `1px solid ${C.muted}44`, padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Archivieren</button>}
                        <button onClick={() => setEditProject({ ...proj, tags: Array.isArray(proj.tags) ? proj.tags.join(", ") : (proj.tags || "") })} style={{ background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✏ Edit</button>
                        <button onClick={() => deleteProject(proj)} style={{ background: "#450A0A", color: C.red, border: `1px solid ${C.red}44`, padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AUSSCHÜTTUNG */}
            {impactTab === "ausschuettung" && (
              <div>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Pool ausschütten</div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Wähle den Gewinner — der gesamte Pool wird ausgeschüttet.</div>
                  <div style={{ background: C.bg, borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 28 }}>💰</span>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: C.gold }}>{fmt(totalImpact)} €</div>
                      <div style={{ fontSize: 13, color: C.muted }}>Gesamter Impact Pool</div>
                    </div>
                  </div>
                  {nominatedIds.length === 0
                    ? <div style={{ background: C.bg, borderRadius: 12, padding: 20, textAlign: "center", color: C.muted, fontSize: 14 }}>Keine nominierten Projekte.<br/>Gehe zur Aktuellen Runde und nominiere 1–3 Projekte.</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {nominatedProjects.sort((a, b) => (b.votes || 0) - (a.votes || 0)).map(proj => (
                        <div key={proj.id} onClick={() => setDistributeTarget(proj.id)} style={{ background: distributeTarget === proj.id ? C.gold + "15" : C.bg, border: `2px solid ${distributeTarget === proj.id ? C.gold : C.border}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: distributeTarget === proj.id ? C.gold : C.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {distributeTarget === proj.id && <span style={{ color: "#000", fontSize: 12, fontWeight: 900 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 24 }}>{proj.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{proj.name}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>{proj.votes || 0} Stimmen · {proj.category}</div>
                          </div>
                          {distributeTarget === proj.id && <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>{fmt(totalImpact)} €</div>}
                        </div>
                      ))}
                      <button onClick={() => {
                        if (!distributeTarget) { showToast("Bitte zuerst einen Gewinner auswählen", "error"); return; }
                        const winner = projects.find(p => p.id === distributeTarget);
                        askConfirm(`${fmt(totalImpact)} € an\n"${winner?.name}" ausschütten?\n\nDies ist unwiderruflich.`, distributePool);
                      }} disabled={!distributeTarget} style={{ background: distributeTarget ? C.gold : C.card2, color: distributeTarget ? "#000" : C.muted, border: "none", padding: "14px 0", borderRadius: 12, cursor: distributeTarget ? "pointer" : "not-allowed", fontWeight: 900, fontSize: 16, marginTop: 8, transition: "all 0.2s" }}>
                        💸 Jetzt ausschütten
                      </button>
                    </div>
                  }
                </div>
              </div>
            )}

            {/* HISTORY */}
            {impactTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {projects.filter(p => p.status === "gewonnen" || p.status === "won").length === 0
                  ? <div style={{ background: C.card, borderRadius: 14, padding: 32, textAlign: "center", color: C.muted }}>Noch keine ausgeschütteten Projekte</div>
                  : projects.filter(p => p.status === "gewonnen" || p.status === "won").sort((a, b) => new Date(b.distributed_at || b.updated_date) - new Date(a.distributed_at || a.updated_date)).map(proj => (
                    <div key={proj.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.gold}44`, padding: 22 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <span style={{ fontSize: 32 }}>{proj.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, fontSize: 16 }}>{proj.name}</span>
                            <span style={{ background: C.gold + "22", color: C.gold, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>🏆 Gewonnen</span>
                          </div>
                          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{proj.category} · Monat: {proj.month} · {proj.distributed_at ? fmtDate(proj.distributed_at) : "—"}</div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>{fmt(proj.awarded_eur)} €</div>
                          {proj.impact_report && <div style={{ background: C.bg, borderRadius: 10, padding: 14, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>📝 {proj.impact_report}</div>}
                          {proj.contact_name && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Kontakt: {proj.contact_name} {proj.contact_email ? `· ${proj.contact_email}` : ""}</div>}
                          {proj.website && <a href={proj.website} target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 12, display: "block", marginTop: 4 }}>{proj.website}</a>}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        {/* ═══ NUTZER ══════════════════════════════════════════════════════ */}
        {tab === "users" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Nutzer</h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>{users.length} registrierte Nutzer</p>
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {users.length === 0
                ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Keine Nutzer gefunden</div>
                : <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: C.bg }}>{["Email", "Name", "Rolle", "Registriert"].map(h => <th key={h} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "left", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>)}</tr></thead>
                  <tbody>{users.map((u, i) => (
                    <tr key={i} style={{ background: i % 2 ? C.card2 : C.card }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: C.text }}>{u.email}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{u.full_name || "—"}</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ background: u.role === "admin" ? C.purple + "22" : C.card2, color: u.role === "admin" ? C.purple : C.muted, padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{u.role || "user"}</span></td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>{fmtDate(u.created_date)}</td>
                    </tr>
                  ))}</tbody>
                </table>}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* Nominierungs-Modal */}
      {showNominateModal && (
        <Modal title="📌 Projekte nominieren (max. 3)" onClose={() => setShowNominateModal(false)}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{nominatedIds.length}/3 ausgewählt</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
            {activeProjects.map(proj => {
              const sel = nominatedIds.includes(proj.id);
              return (
                <div key={proj.id} onClick={() => {
                  if (sel) setNominatedIds(ids => ids.filter(id => id !== proj.id));
                  else if (nominatedIds.length < 3) setNominatedIds(ids => [...ids, proj.id]);
                  else showToast("Maximal 3 Projekte auswählbar", "error");
                }} style={{ background: sel ? C.teal + "22" : C.bg, border: `2px solid ${sel ? C.teal : C.border}`, borderRadius: 12, padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: sel ? C.teal : C.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {sel && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 22 }}>{proj.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{proj.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{proj.category} · {proj.votes || 0} Stimmen</div>
                  </div>
                </div>
              );
            })}
            {activeProjects.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.muted }}>Keine aktiven Projekte vorhanden</div>}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button onClick={() => setNominatedIds([])} style={{ flex: 1, background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Zurücksetzen</button>
            <button onClick={() => { setShowNominateModal(false); showToast(nominatedIds.length > 0 ? `${nominatedIds.length} Projekte nominiert ✓` : "Keine Projekte ausgewählt"); }} style={{ flex: 2, background: nominatedIds.length > 0 ? C.teal : C.card2, color: nominatedIds.length > 0 ? "#fff" : C.muted, border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Bestätigen</button>
          </div>
        </Modal>
      )}

      {/* Neues Projekt */}
      {showNewProject && (
        <Modal title="🌱 Neues Impact-Projekt" onClose={() => setShowNewProject(false)}>
          <Input label="Projektname *" value={newProject.name} onChange={v => setNewProject(p => ({ ...p, name: v }))} placeholder="z.B. Stadtgarten Berlin" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase" }}>Kategorie</label>
            <select value={newProject.category} onChange={e => setNewProject(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none" }}>
              {["Umwelt", "Soziales", "Nachhaltigkeit", "Bildung", "Gesundheit", "Kultur"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Beschreibung" value={newProject.description} onChange={v => setNewProject(p => ({ ...p, description: v }))} rows={3} placeholder="Kurze Beschreibung…" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Icon (Emoji)" value={newProject.icon} onChange={v => setNewProject(p => ({ ...p, icon: v }))} placeholder="🌱" />
            <Input label="Farbe (Hex)" value={newProject.color} onChange={v => setNewProject(p => ({ ...p, color: v }))} placeholder="#10B981" />
          </div>
          <Input label="Kontaktperson" value={newProject.contact_name} onChange={v => setNewProject(p => ({ ...p, contact_name: v }))} placeholder="Name" />
          <Input label="Kontakt E-Mail" value={newProject.contact_email} onChange={v => setNewProject(p => ({ ...p, contact_email: v }))} type="email" placeholder="email@projekt.de" />
          <Input label="Website" value={newProject.website} onChange={v => setNewProject(p => ({ ...p, website: v }))} placeholder="https://…" />
          <Input label="Tags (kommagetrennt)" value={newProject.tags} onChange={v => setNewProject(p => ({ ...p, tags: v }))} placeholder="Natur, Gemeinschaft" />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setShowNewProject(false)} style={{ flex: 1, background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={addProject} style={{ flex: 2, background: C.teal, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Projekt hinzufügen ✓</button>
          </div>
        </Modal>
      )}

      {/* Projekt bearbeiten */}
      {editProject && (
        <Modal title={`✏ ${editProject.name} bearbeiten`} onClose={() => setEditProject(null)}>
          <Input label="Projektname" value={editProject.name} onChange={v => setEditProject(p => ({ ...p, name: v }))} />
          <Input label="Beschreibung" value={editProject.description} onChange={v => setEditProject(p => ({ ...p, description: v }))} rows={3} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Icon" value={editProject.icon} onChange={v => setEditProject(p => ({ ...p, icon: v }))} />
            <Input label="Farbe" value={editProject.color} onChange={v => setEditProject(p => ({ ...p, color: v }))} />
          </div>
          <Input label="Kontaktperson" value={editProject.contact_name} onChange={v => setEditProject(p => ({ ...p, contact_name: v }))} />
          <Input label="Kontakt E-Mail" value={editProject.contact_email} onChange={v => setEditProject(p => ({ ...p, contact_email: v }))} />
          <Input label="Website" value={editProject.website} onChange={v => setEditProject(p => ({ ...p, website: v }))} />
          <Input label="Tags" value={editProject.tags} onChange={v => setEditProject(p => ({ ...p, tags: v }))} />
          <Input label="Impact Report" value={editProject.impact_report} onChange={v => setEditProject(p => ({ ...p, impact_report: v }))} rows={4} />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditProject(null)} style={{ flex: 1, background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={saveProject} style={{ flex: 2, background: C.orange, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Speichern ✓</button>
          </div>
        </Modal>
      )}

      {/* Wirker bearbeiten */}
      {editWirker && (
        <Modal title={`✏ ${editWirker.full_name || editWirker.name} bearbeiten`} onClose={() => setEditWirker(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <Input label="Kurzname" value={editWirker.name} onChange={v => setEditWirker(p => ({ ...p, name: v }))} />
          </div>
          <Input label="Vollständiger Name" value={editWirker.full_name} onChange={v => setEditWirker(p => ({ ...p, full_name: v }))} />
          <Input label="Talent / Kategorie" value={editWirker.talent} onChange={v => setEditWirker(p => ({ ...p, talent: v }))} />
          <Input label="Standort" value={editWirker.location} onChange={v => setEditWirker(p => ({ ...p, location: v }))} />
          <Input label="Stundensatz (€)" value={editWirker.hourly_rate} onChange={v => setEditWirker(p => ({ ...p, hourly_rate: v }))} type="number" />
          <Input label="Bio" value={editWirker.bio} onChange={v => setEditWirker(p => ({ ...p, bio: v }))} rows={3} />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditWirker(null)} style={{ flex: 1, background: C.card2, color: C.sub, border: `1px solid ${C.border}`, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Abbrechen</button>
            <button onClick={saveWirker} style={{ flex: 2, background: C.orange, color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>Speichern ✓</button>
          </div>
        </Modal>
      )}

      {/* Zahlung Detail */}
      {editPayment && (
        <Modal title="💳 Zahlung Detail" onClose={() => setEditPayment(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[["Wirker", editPayment.wirker_name], ["Betrag", `${fmt(editPayment.amount_eur)} €`], ["HUI (12,75%)", `${fmt(parseFloat(editPayment.amount_eur || 0) * 0.1275)} €`], ["Impact (2,25%)", `${fmt(editPayment.impact_eur)} €`], ["Datum", fmtDate(editPayment.created_date)], ["Session ID", editPayment.stripe_session_id || "—"]].map(([l, v]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, wordBreak: "break-all" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Leistung</div>
            <div style={{ fontSize: 14, color: C.sub, background: C.bg, borderRadius: 8, padding: 12 }}>{editPayment.item_name}</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <Badge map={STATUS_PAYMENT} val={editPayment.status} />
            <Badge map={STATUS_EMP} val={editPayment.empfehlung} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>Status ändern</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["escrow", "ausgezahlt", "reklamation", "rueckerstattung"].map(s => (
                <button key={s} onClick={() => updatePayStatus(editPayment, s)} style={{ background: editPayment.status === s ? C.orange : C.bg, color: editPayment.status === s ? "#fff" : C.sub, border: `1px solid ${editPayment.status === s ? C.orange : C.border}`, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{STATUS_PAYMENT[s]?.label || s}</button>
              ))}
            </div>
          </div>
          {editPayment.status === "escrow" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => releaseEscrow(editPayment)} style={{ flex: 1, background: "#022C22", color: C.green, border: `1px solid ${C.green}44`, padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}>✓ Treuhand freigeben</button>
              <button onClick={() => refundPayment(editPayment)} style={{ flex: 1, background: "#450A0A", color: C.red, border: `1px solid ${C.red}44`, padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}>↩ Erstatten</button>
            </div>
          )}
        </Modal>
      )}

      <Toast toast={toast} />
      <Confirm data={confirm} onCancel={() => setConfirm(null)} />
    </div>
  );
}
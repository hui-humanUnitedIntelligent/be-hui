import { useState, useEffect } from "react";
import { HuiPayment, HuiWirker, HuiMessage } from "@/api/entities";

// ── Mock-Daten (Fallback wenn DB leer) ──────────────────────────────────────
const mockPayments = [
  { id: "p1", created_date: "2026-04-30T10:22:00Z", wirker_name: "Marcus B.", item_name: "Fotografie – 1 Stunde", amount_eur: 82.35, impact_eur: 2.47, status: "completed", payment_status: "paid" },
  { id: "p2", created_date: "2026-04-29T15:04:00Z", wirker_name: "Sofia M.", item_name: "Keramik-Workshop", amount_eur: 75.00, impact_eur: 2.25, status: "pending", payment_status: "paid" },
  { id: "p3", created_date: "2026-04-28T09:11:00Z", wirker_name: "Maria L.", item_name: "Yoga & Achtsamkeit", amount_eur: 60.00, impact_eur: 1.80, status: "completed", payment_status: "paid" },
  { id: "p4", created_date: "2026-04-27T14:30:00Z", wirker_name: "Tom H.", item_name: "Leder-Rucksack", amount_eur: 195.00, impact_eur: 5.85, status: "completed", payment_status: "paid" },
  { id: "p5", created_date: "2026-04-26T11:45:00Z", wirker_name: "Lena K.", item_name: "Aquarell-Portrait", amount_eur: 120.00, impact_eur: 3.60, status: "refunded", payment_status: "refunded" },
  { id: "p6", created_date: "2026-04-25T08:20:00Z", wirker_name: "Marcus B.", item_name: "Fotografie – 2 Stunden", amount_eur: 164.70, impact_eur: 4.94, status: "completed", payment_status: "paid" },
];

const mockWirker = [
  { id: "w1", name: "Marcus B.", full_name: "Marcus Braun", talent: "Fotograf & Videograf", location: "Berlin", hourly_rate: 70, bookings: 47, followers: 312, impact_eur: 58.20, verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" },
  { id: "w2", name: "Sofia M.", full_name: "Sofia Müller", talent: "Keramik-Künstlerin", location: "München", hourly_rate: 45, bookings: 58, followers: 218, impact_eur: 47.25, verified: true, img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop" },
  { id: "w3", name: "Maria L.", full_name: "Maria Lopez", talent: "Yoga & Achtsamkeit", location: "Hamburg", hourly_rate: 40, bookings: 93, followers: 445, impact_eur: 83.70, verified: true, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop" },
  { id: "w4", name: "Tom H.", full_name: "Tom Heller", talent: "Leder-Handwerker", location: "Wien", hourly_rate: 55, bookings: 31, followers: 189, impact_eur: 28.50, verified: false, img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop" },
  { id: "w5", name: "Lena K.", full_name: "Lena Koch", talent: "Aquarell-Künstlerin", location: "Hamburg", hourly_rate: 50, bookings: 22, followers: 134, impact_eur: 19.80, verified: false, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop" },
];

const impactProjects = [
  { name: "Stadtgarten Berlin", category: "Umwelt", votes: 38, color: "#7C3AED", icon: "🌱" },
  { name: "Musik für Kinder e.V.", category: "Soziales", votes: 27, color: "#0891B2", icon: "🎵" },
  { name: "Repair Café Hamburg", category: "Nachhaltigkeit", votes: 19, color: "#059669", icon: "🔧" },
];

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

const statusBadge = (status) => {
  const map = {
    completed: { label: "Abgeschlossen", bg: "#D1FAE5", color: "#065F46" },
    pending:   { label: "Ausstehend",    bg: "#FEF3C7", color: "#92400E" },
    refunded:  { label: "Erstattet",     bg: "#FEE2E2", color: "#991B1B" },
    paid:      { label: "Bezahlt",       bg: "#D1FAE5", color: "#065F46" },
  };
  const s = map[status] || { label: status, bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
};

// ── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [payments, setPayments] = useState([]);
  const [wirker, setWirker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchWirker, setSearchWirker] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedWirker, setSelectedWirker] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [p, w] = await Promise.all([HuiPayment.list(), HuiWirker.list()]);
        setPayments(p.length ? p : mockPayments);
        setWirker(w.length ? w : mockWirker);
      } catch {
        setPayments(mockPayments);
        setWirker(mockWirker);
      }
      setLoading(false);
    }
    load();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // KPIs
  const totalRevenue = payments.filter(p => p.payment_status === "paid" || p.status === "completed").reduce((s, p) => s + (p.amount_eur || 0), 0);
  const totalImpact = payments.reduce((s, p) => s + (p.impact_eur || 0), 0);
  const huiRevenue = totalRevenue * 0.1275;
  const completedCount = payments.filter(p => p.status === "completed").length;
  const pendingCount = payments.filter(p => p.status === "pending").length;
  const verifiedCount = wirker.filter(w => w.verified).length;
  const totalVotes = impactProjects.reduce((s, p) => s + p.votes, 0);

  const filteredPayments = payments.filter(p => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const filteredWirker = wirker.filter(w =>
    (w.name || "").toLowerCase().includes(searchWirker.toLowerCase()) ||
    (w.talent || "").toLowerCase().includes(searchWirker.toLowerCase()) ||
    (w.location || "").toLowerCase().includes(searchWirker.toLowerCase())
  );

  const toggleVerify = (id) => {
    setWirker(prev => prev.map(w => w.id === id ? { ...w, verified: !w.verified } : w));
    showToast("Verifizierungsstatus aktualisiert ✓");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#94A3B8" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
        <div style={{ fontSize: 16 }}>Admin-Dashboard lädt…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "#E2E8F0", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "success" ? "#10B981" : "#EF4444",
          color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "fadeIn 0.2s ease"
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", borderBottom: "1px solid #1E293B", padding: "0 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#F1F5F9" }}>HUI Admin</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Human United Intelligent</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 13, color: "#64748B" }}>Live · {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#1E293B", borderBottom: "1px solid #334155", padding: "0 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 0 }}>
          {[
            { key: "overview", label: "Übersicht", icon: "📊" },
            { key: "payments", label: "Zahlungen", icon: "💳" },
            { key: "wirker", label: "Wirker", icon: "👥" },
            { key: "impact", label: "Impact Pool", icon: "🌱" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "14px 20px", fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "#F97316" : "#64748B",
              borderBottom: tab === t.key ? "2px solid #F97316" : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>

        {/* ── ÜBERSICHT ── */}
        {tab === "overview" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Übersicht</h1>
              <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: 14 }}>Alle wichtigen Zahlen auf einen Blick</p>
            </div>

            {/* KPI Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Gesamtumsatz", value: `${fmt(totalRevenue)} €`, sub: `${completedCount} abgeschlossene Buchungen`, icon: "💰", grad: "linear-gradient(135deg, #F97316, #FB923C)" },
                { label: "HUI Einnahmen", value: `${fmt(huiRevenue)} €`, sub: "12,75% der Transaktionen", icon: "🏦", grad: "linear-gradient(135deg, #8B5CF6, #A78BFA)" },
                { label: "Impact Pool", value: `${fmt(totalImpact)} €`, sub: "2,25% aus jeder Buchung", icon: "🌱", grad: "linear-gradient(135deg, #10B981, #34D399)" },
                { label: "Aktive Wirker", value: wirker.length, sub: `${verifiedCount} verifiziert`, icon: "👥", grad: "linear-gradient(135deg, #0EA5E9, #38BDF8)" },
                { label: "Offen / Ausstehend", value: pendingCount, sub: "Buchungen warten auf Freigabe", icon: "⏳", grad: "linear-gradient(135deg, #F59E0B, #FBBF24)" },
              ].map((kpi, i) => (
                <div key={i} style={{ background: "#1E293B", borderRadius: 16, padding: 20, border: "1px solid #334155", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -10, right: -10, width: 70, height: 70, borderRadius: "50%", background: kpi.grad, opacity: 0.12 }} />
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>{kpi.value}</div>
                  <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, marginBottom: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity + Impact */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>

              {/* Letzte Transaktionen */}
              <div style={{ background: "#1E293B", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
                <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, color: "#F1F5F9", fontSize: 15 }}>💳 Letzte Transaktionen</div>
                  <button onClick={() => setTab("payments")} style={{ background: "none", border: "none", color: "#F97316", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Alle →</button>
                </div>
                {payments.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ padding: "14px 20px", borderBottom: i < 4 ? "1px solid #1E293B" : "none", display: "flex", alignItems: "center", gap: 12, background: i % 2 === 0 ? "#1E293B" : "#1A2537" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💳</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.wirker_name}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{p.item_name}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{fmt(p.amount_eur)} €</div>
                      {statusBadge(p.status)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact Pool */}
              <div style={{ background: "#1E293B", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
                <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #334155" }}>
                  <div style={{ fontWeight: 700, color: "#F1F5F9", fontSize: 15 }}>🌱 Impact Pool — Abstimmung</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Aktueller Pool: <strong style={{ color: "#10B981" }}>{fmt(totalImpact)} €</strong></div>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {impactProjects.map((proj, i) => (
                    <div key={i} style={{ background: "#0F172A", borderRadius: 12, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{proj.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{proj.name}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{proj.category}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>{proj.votes} Votes</div>
                      </div>
                      <div style={{ height: 6, background: "#1E293B", borderRadius: 99 }}>
                        <div style={{ height: 6, background: proj.color, borderRadius: 99, width: `${(proj.votes / totalVotes) * 100}%`, transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 4, textAlign: "right" }}>{Math.round((proj.votes / totalVotes) * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── ZAHLUNGEN ── */}
        {tab === "payments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Zahlungen</h1>
                <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: 14 }}>{payments.length} Transaktionen insgesamt</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["all", "completed", "pending", "refunded"].map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)} style={{
                    background: filterStatus === f ? "#F97316" : "#1E293B",
                    color: filterStatus === f ? "#fff" : "#94A3B8",
                    border: "1px solid " + (filterStatus === f ? "#F97316" : "#334155"),
                    padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600
                  }}>
                    {f === "all" ? "Alle" : f === "completed" ? "Abgeschlossen" : f === "pending" ? "Ausstehend" : "Erstattet"}
                  </button>
                ))}
              </div>
            </div>

            {/* Zahlungs-Tabelle */}
            <div style={{ background: "#1E293B", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr", padding: "12px 20px", background: "#0F172A", borderBottom: "1px solid #334155" }}>
                {["Datum", "Leistung", "Wirker", "Betrag", "Impact", "Status"].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>{h}</div>
                ))}
              </div>
              {filteredPayments.map((p, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr",
                  padding: "14px 20px", borderBottom: i < filteredPayments.length - 1 ? "1px solid #334155" : "none",
                  background: i % 2 === 0 ? "#1E293B" : "#1A2537",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 500 }}>{fmtDate(p.created_date)}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{fmtTime(p.created_date)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#94A3B8", paddingRight: 8 }}>{p.item_name}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{p.wirker_name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{fmt(p.amount_eur)} €</div>
                  <div style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>+{fmt(p.impact_eur)} €</div>
                  <div>{statusBadge(p.status)}</div>
                </div>
              ))}
            </div>

            {/* Summen-Footer */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
              {[
                { label: "Gesamtumsatz", value: `${fmt(filteredPayments.reduce((s,p) => s+(p.amount_eur||0),0))} €`, color: "#F97316" },
                { label: "HUI Einnahmen (12,75%)", value: `${fmt(filteredPayments.reduce((s,p) => s+(p.amount_eur||0),0) * 0.1275)} €`, color: "#8B5CF6" },
                { label: "Impact Pool (2,25%)", value: `${fmt(filteredPayments.reduce((s,p) => s+(p.impact_eur||0),0))} €`, color: "#10B981" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#1E293B", borderRadius: 12, padding: "14px 18px", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#64748B" }}>{s.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WIRKER ── */}
        {tab === "wirker" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Wirker</h1>
                <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: 14 }}>{wirker.length} registriert · {verifiedCount} verifiziert</p>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  value={searchWirker}
                  onChange={e => setSearchWirker(e.target.value)}
                  placeholder="Suche nach Name, Talent, Ort…"
                  style={{
                    background: "#1E293B", border: "1px solid #334155", color: "#E2E8F0",
                    padding: "9px 16px 9px 38px", borderRadius: 10, fontSize: 14, width: 280, outline: "none"
                  }}
                />
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filteredWirker.map((w, i) => (
                <div key={i} style={{ background: "#1E293B", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid #334155" }}>
                    <div style={{ position: "relative" }}>
                      <img src={w.img} alt={w.name} style={{ width: 52, height: 52, borderRadius: 14, objectFit: "cover" }} />
                      {w.verified && (
                        <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, background: "#10B981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, border: "2px solid #1E293B" }}>✓</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#F1F5F9", fontSize: 15 }}>{w.full_name || w.name}</div>
                      <div style={{ fontSize: 13, color: "#F97316", fontWeight: 500 }}>{w.talent}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>📍 {w.location}</div>
                    </div>
                    <button
                      onClick={() => toggleVerify(w.id)}
                      style={{
                        background: w.verified ? "#064E3B" : "#1E293B",
                        color: w.verified ? "#10B981" : "#64748B",
                        border: "1px solid " + (w.verified ? "#10B981" : "#334155"),
                        padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600
                      }}
                    >
                      {w.verified ? "✓ Verifiziert" : "Verifizieren"}
                    </button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                    {[
                      { label: "Buchungen", value: w.bookings || 0 },
                      { label: "Followers", value: w.followers || 0 },
                      { label: "Impact", value: `${fmt(w.impact_eur)} €` },
                      { label: "Rate", value: `${w.hourly_rate || "–"} €/h` },
                    ].map((stat, j) => (
                      <div key={j} style={{ padding: "12px 0", textAlign: "center", borderRight: j < 3 ? "1px solid #334155" : "none" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9" }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── IMPACT POOL ── */}
        {tab === "impact" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Impact Pool</h1>
              <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: 14 }}>Gesammelte Mittel & laufende Projektabstimmung</p>
            </div>

            {/* Impact KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Aktueller Pool", value: `${fmt(totalImpact)} €`, icon: "💰", color: "#10B981", desc: "Bereit zur Ausschüttung" },
                { label: "Gesamt gesammelt", value: `${fmt(totalImpact * 1.4)} €`, icon: "📈", color: "#8B5CF6", desc: "Seit Plattform-Start" },
                { label: "Bereits vergeben", value: `${fmt(totalImpact * 0.4)} €`, icon: "🎯", color: "#F97316", desc: "An 3 Projekte" },
              ].map((k, i) => (
                <div key={i} style={{ background: "#1E293B", borderRadius: 16, padding: 24, border: "1px solid #334155", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{k.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9", marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{k.desc}</div>
                </div>
              ))}
            </div>

            {/* Projektabstimmung */}
            <div style={{ background: "#1E293B", borderRadius: 16, border: "1px solid #334155", overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #334155" }}>
                <div style={{ fontWeight: 700, color: "#F1F5F9", fontSize: 16 }}>🗳️ Aktuelle Abstimmung</div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Talente wählen das Förderprojekt des Monats · {totalVotes} Stimmen bisher</div>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {impactProjects.map((proj, i) => {
                  const pct = Math.round((proj.votes / totalVotes) * 100);
                  const isLeading = i === 0;
                  return (
                    <div key={i} style={{ background: "#0F172A", borderRadius: 14, padding: 20, border: isLeading ? `1px solid ${proj.color}` : "1px solid #334155" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ fontSize: 32 }}>{proj.icon}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                              {proj.name}
                              {isLeading && <span style={{ background: "#F97316", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>FÜHREND</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>{proj.category}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: proj.color }}>{pct}%</div>
                          <div style={{ fontSize: 12, color: "#475569" }}>{proj.votes} Stimmen</div>
                        </div>
                      </div>
                      <div style={{ height: 8, background: "#1E293B", borderRadius: 99 }}>
                        <div style={{ height: 8, background: proj.color, borderRadius: 99, width: `${pct}%`, transition: "width 0.6s ease" }} />
                      </div>
                      <div style={{ marginTop: 10, fontSize: 13, color: "#64748B" }}>
                        Würde <strong style={{ color: proj.color }}>{fmt(totalImpact * (proj.votes / totalVotes))} €</strong> erhalten
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ausschüttungs-Button */}
            <div style={{ background: "linear-gradient(135deg, #064E3B, #065F46)", borderRadius: 16, padding: 24, border: "1px solid #10B981", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>🎉 Pool ausschütten</div>
                <div style={{ fontSize: 13, color: "#6EE7B7", marginTop: 4 }}>Abstimmung beenden & Gewinnerproject fördern</div>
              </div>
              <button
                onClick={() => showToast("Ausschüttung initiiert! 🎉 Gewinnerprojekt wird benachrichtigt.")}
                style={{
                  background: "#10B981", color: "#fff", border: "none",
                  padding: "12px 24px", borderRadius: 12, cursor: "pointer",
                  fontSize: 15, fontWeight: 700, boxShadow: "0 4px 20px rgba(16,185,129,0.4)"
                }}
              >
                Jetzt ausschütten →
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

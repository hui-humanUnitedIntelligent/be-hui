import { useState, useEffect } from "react";
import { safeQuery } from "../lib/perfUtils";
import { supabase } from ".../lib/supabaseClient";

const C = {
  bg: "#0A0F1E", card: "#111827", card2: "#1A2235", border: "#1E2D45",
  text: "#F1F5F9", sub: "#94A3B8", muted: "#475569",
  orange: "#F97316", green: "#10B981", red: "#EF4444",
  teal: "#2ABFAC", coral: "#FF6B5B", gold: "#F5A623"
};

export default function Admin() {
  const [wirker, setWirker] = useState([]);
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Pure async/await — no .then() mixed with await
      const [wirkerRes, paymentsRes, projectsRes] = await Promise.all([
        supabase.from("wirker")
          .select("id,name,full_name,talent,location,img,verified,bookings,impact_eur,created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("payments")
          .select("id,user_id,wirker_name,amount_eur,impact_eur,status,payment_status,created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("impact_projects")
          .select("id,name,category,description,votes,status,goal_eur,awarded_eur,month")
          .order("votes", { ascending: false })
          .limit(50),
      ]);
      const w  = wirkerRes.data   || [];
      const p  = paymentsRes.data || [];
      const pr = projectsRes.data || [];
      setWirker(w);
      setPayments(p);
      setProjects(pr);
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = payments.filter(p => p.payment_status === "paid").reduce((s, p) => s + (p.amount_eur || 0), 0);
  const totalImpact = payments.filter(p => p.payment_status === "paid").reduce((s, p) => s + (p.impact_eur || 0), 0);

  const s = { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, sans-serif", padding: 24 };
  const card = { background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 };
  const tab_btn = (active) => ({
    padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
    background: active ? C.teal : C.card2, color: active ? "#fff" : C.sub,
    fontWeight: 600, fontSize: 13
  });

  if (loading) return <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
      <div style={{ color: C.teal }}>Lade Admin-Daten…</div>
    </div>
  </div>;

  return (
    <div style={s}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>HUI Admin <span style={{ color: C.teal }}>Dashboard</span></h1>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Echtzeit-Daten aus Supabase</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["dashboard", "wirker", "payments", "projekte"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={tab_btn(tab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Wirker", value: wirker.length, icon: "✨", color: C.teal },
              { label: "Buchungen", value: payments.length, icon: "📋", color: C.orange },
              { label: "Umsatz", value: `${totalRevenue.toFixed(0)} €`, icon: "💰", color: C.green },
              { label: "Impact Pool", value: `${totalImpact.toFixed(2)} €`, icon: "🌱", color: C.coral },
            ].map(kpi => (
              <div key={kpi.label} style={{ ...card, marginBottom: 0 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{kpi.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{kpi.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>🌍 Impact Projekte ({projects.length})</div>
            {projects.slice(0, 3).map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13 }}>{p.name || p.title}</span>
                <span style={{ color: C.teal, fontSize: 12, fontWeight: 600 }}>{p.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "wirker" && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>✨ Alle Wirker ({wirker.length})</div>
          {wirker.map(w => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.teal + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✨</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{w.name}</div>
                <div style={{ color: C.sub, fontSize: 12 }}>{w.talent} · {w.location}</div>
              </div>
              <div style={{ marginLeft: "auto", color: C.gold, fontSize: 13, fontWeight: 700 }}>{w.hourly_rate} €/h</div>
            </div>
          ))}
        </div>
      )}

      {tab === "payments" && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>💳 Alle Buchungen ({payments.length})</div>
          {payments.map(p => (
            <div key={p.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.wirker_name || p.item_name}</span>
                <span style={{ color: p.payment_status === "paid" ? C.green : C.orange, fontSize: 12, fontWeight: 700 }}>{p.payment_status}</span>
              </div>
              <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{p.amount_eur} € · Impact: {p.impact_eur} €</div>
            </div>
          ))}
        </div>
      )}

      {tab === "projekte" && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>🌍 Impact Projekte ({projects.length})</div>
          {projects.map(p => (
            <div key={p.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name || p.title}</div>
              <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{p.category} · {p.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

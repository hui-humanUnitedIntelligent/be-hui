import React, { useState } from "react";
import { ArrowLeft, Calendar, Edit3, Plus, Package, Star, Clock, BarChart2, ChevronRight, X, Check, Trash2, Settings, Eye } from "lucide-react";

const CORAL = "#FF6B5B"; const TEAL = "#2ABFAC"; const GOLD = "#F5A623";
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAY_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

const mockServices = [
  { id: "s1", title: "Keramik-Workshop (2 Std.)", price: "75 €/Person", bookings: 14, active: true, img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80" },
  { id: "s2", title: "Töpfer-Grundkurs (4x)", price: "220 €", bookings: 7, active: true, img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80" },
  { id: "s3", title: "1:1 Einführung", price: "45 €/h", bookings: 20, active: false, img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&q=80" },
];

const mockWerke = [
  { id: "w1", title: "Handgedrehte Schale", price: "55 €", sold: 8, img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80", active: true },
  { id: "w2", title: "Tassen-Set (2er)", price: "69 €", sold: 12, img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&q=80", active: true },
  { id: "w3", title: "Vase Handgedreht", price: "89 €", sold: 5, img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80", active: true },
];

const mockIncomingBookings = [
  { id: "b1", client: "Anna K.", service: "Keramik-Workshop", date: "Mo, 12. Mai · 14:00", status: "pending", amount: 75 },
  { id: "b2", client: "Peter M.", service: "1:1 Einführung", date: "Di, 13. Mai · 10:00", status: "confirmed", amount: 45 },
  { id: "b3", client: "Julia S.", service: "Töpfer-Grundkurs", date: "Sa, 17. Mai · 11:00", status: "confirmed", amount: 220 },
];

const defaultSlots = { "Mo": ["09:00","10:00","14:00"], "Di": ["10:00","11:00"], "Fr": ["13:00","14:00","15:00"] };

function AvailabilityPanel({ onClose }) {
  const [slots, setSlots] = useState(() => JSON.parse(JSON.stringify(defaultSlots)));
  const [day, setDay] = useState("Mo");
  const [time, setTime] = useState("09:00");
  const [saved, setSaved] = useState(false);

  const addSlot = () => {
    if (!time.match(/^\d{2}:\d{2}$/)) return;
    setSlots(s => {
      const u = { ...s };
      if (!u[day]) u[day] = [];
      if (!u[day].includes(time)) u[day] = [...u[day], time].sort();
      return u;
    });
  };
  const removeSlot = (d, t) => {
    setSlots(s => {
      const u = { ...s };
      u[d] = u[d].filter(x => x !== t);
      if (!u[d].length) delete u[d];
      return u;
    });
  };
  const save = () => { setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1100); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 700, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>Meine Verfügbarkeit</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>Wann bist du buchbar?</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#555" /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}30`, borderRadius: 14, padding: "12px 14px", marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: TEAL, marginBottom: 10 }}>+ Neuer Slot</div>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={day} onChange={e => setDay(e.target.value)} style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${TEAL}40`, fontSize: 13, outline: "none" }}>
                {WEEKDAYS.map(d => <option key={d} value={d}>{WEEKDAY_FULL[WEEKDAYS.indexOf(d)]}</option>)}
              </select>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${TEAL}40`, fontSize: 13, outline: "none" }} />
              <button onClick={addSlot} style={{ background: TEAL, color: "white", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>+</button>
            </div>
          </div>
          {WEEKDAYS.filter(d => slots[d]?.length).map(d => (
            <div key={d} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: TEAL, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{d}</div>
                {WEEKDAY_FULL[WEEKDAYS.indexOf(d)]}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {slots[d].map(t => (
                  <div key={t} style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30`, borderRadius: 20, padding: "5px 11px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={11} color={TEAL} />
                    <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{t}</span>
                    <button onClick={() => removeSlot(d, t)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                      <X size={12} color={CORAL} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!Object.keys(slots).length && (
            <div style={{ textAlign: "center", padding: "28px 0", color: "#bbb", fontSize: 13 }}>Noch keine Slots — füge welche hinzu</div>
          )}
        </div>
        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={save} style={{ width: "100%", background: saved ? TEAL : `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            {saved ? "✓ Gespeichert!" : "Verfügbarkeit speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceEditor({ service, onClose, onSave }) {
  const [title, setTitle] = useState(service?.title || "");
  const [price, setPrice] = useState(service?.price || "");
  const [desc, setDesc] = useState(service?.desc || "");
  const [saved, setSaved] = useState(false);

  const save = () => {
    onSave({ ...service, title, price, desc, id: service?.id || "new_" + Date.now(), img: service?.img || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80", bookings: service?.bookings || 0, active: true });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 700, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "20px 20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{service ? "Angebot bearbeiten" : "Neues Angebot"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#555" /></button>
        </div>
        {[{ label: "Titel", val: title, set: setTitle, ph: "z.B. Keramik-Workshop (2 Std.)" }, { label: "Preis", val: price, set: setPrice, ph: "z.B. 75 €/Person" }].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</div>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Beschreibung</div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Was erwartet den Kunden?" rows={3} style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <button onClick={save} disabled={!title || !price} style={{ width: "100%", background: !title || !price ? "#e0e0e0" : saved ? TEAL : `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: !title || !price ? "default" : "pointer" }}>
          {saved ? "✓ Gespeichert!" : "Speichern"}
        </button>
      </div>
    </div>
  );
}

export default function WirkerProfileDashboard({ onBack, onViewPublicProfile }) {
  const [tab, setTab] = useState("uebersicht");
  const [services, setServices] = useState(mockServices);
  const [werke, setWerke] = useState(mockWerke);
  const [showAvail, setShowAvail] = useState(false);
  const [editService, setEditService] = useState(null); // null | service obj | "new"
  const [bookings, setBookings] = useState(mockIncomingBookings);

  const totalEarnings = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + b.amount, 0);
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  const confirmBooking = (id) => setBookings(b => b.map(x => x.id === id ? { ...x, status: "confirmed" } : x));
  const declineBooking = (id) => setBookings(b => b.filter(x => x.id !== id));

  const toggleService = (id) => setServices(s => s.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const toggleWerk = (id) => setWerke(w => w.map(x => x.id === id ? { ...x, active: !x.active } : x));

  const tabs = [
    { id: "uebersicht", label: "Übersicht", icon: "📊" },
    { id: "angebote", label: "Angebote", icon: "🤝" },
    { id: "werke", label: "Werke", icon: "🎁" },
    { id: "buchungen", label: "Buchungen", icon: "📅" },
    { id: "verfuegbarkeit", label: "Zeiten", icon: "🗓" },
  ];

  return (
    <div style={{ height: "100vh", background: "#f5f5f3", display: "flex", flexDirection: "column", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "16px 20px 0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={20} color="#444" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Mein Wirker-Dashboard</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>Verwalte dein Talent-Angebot</div>
          </div>
          {onViewPublicProfile && (
            <button onClick={onViewPublicProfile} style={{ background: `${TEAL}12`, border: `1px solid ${TEAL}30`, borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: TEAL, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Eye size={13} /> Öffentlich
            </button>
          )}
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, background: "none", border: "none", borderBottom: tab === t.id ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "8px 12px 10px", fontWeight: tab === t.id ? 700 : 500, fontSize: 12, color: tab === t.id ? CORAL : "#aaa", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{t.icon}</span><span>{t.label}</span>
              {t.id === "buchungen" && pendingCount > 0 && <span style={{ background: CORAL, color: "white", borderRadius: 99, fontSize: 9, fontWeight: 800, padding: "1px 6px", minWidth: 16, textAlign: "center" }}>{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

        {/* ── ÜBERSICHT ── */}
        {tab === "uebersicht" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { icon: "💶", val: `${totalEarnings} €`, label: "Bestätigte Buchungen", color: TEAL },
                { icon: "📅", val: bookings.length, label: "Alle Anfragen", color: CORAL },
                { icon: "🤝", val: services.filter(s => s.active).length, label: "Aktive Angebote", color: GOLD },
                { icon: "🎁", val: werke.filter(w => w.active).length, label: "Aktive Werke", color: "#7c3aed" },
              ].map(s => (
                <div key={s.label} style={{ background: "white", borderRadius: 16, padding: "16px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pending */}
            {pendingCount > 0 && (
              <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 12 }}>⏳ Offene Anfragen ({pendingCount})</div>
                {bookings.filter(b => b.status === "pending").map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f5f5f3" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{b.client}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{b.service} · {b.date}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: GOLD, fontSize: 13 }}>{b.amount} €</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => confirmBooking(b.id)} style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}40`, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: TEAL, cursor: "pointer" }}>✓</button>
                      <button onClick={() => declineBooking(b.id)} style={{ background: "#fff0ee", border: "1px solid #fdd", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: CORAL, cursor: "pointer" }}>✗</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", padding: "14px 16px 8px" }}>Schnellaktionen</div>
              {[
                { icon: "🗓", label: "Verfügbarkeit bearbeiten", sub: "Wann bist du buchbar?", action: () => setShowAvail(true), color: TEAL },
                { icon: "🤝", label: "Neues Angebot erstellen", sub: "Workshop, Session, Coaching…", action: () => { setEditService("new"); }, color: CORAL },
                { icon: "🎁", label: "Neues Werk hinzufügen", sub: "Physisches oder digitales Produkt", action: () => setTab("werke"), color: GOLD },
              ].map((a, i, arr) => (
                <div key={a.label} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: a.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#222" }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{a.sub}</div>
                  </div>
                  <ChevronRight size={14} color="#ddd" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANGEBOTE ── */}
        {tab === "angebote" && (
          <div>
            <button onClick={() => setEditService("new")} style={{ width: "100%", background: `${TEAL}10`, border: `1.5px dashed ${TEAL}60`, borderRadius: 14, padding: "12px", marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: TEAL, fontWeight: 700, fontSize: 14 }}>
              <Plus size={16} color={TEAL} /> Neues Angebot
            </button>
            {services.map(s => (
              <div key={s.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", opacity: s.active ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px" }}>
                  <img src={s.img} style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} alt={s.title} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#222", marginBottom: 2 }}>{s.title}</div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#aaa" }}>
                      <span style={{ fontWeight: 700, color: CORAL }}>{s.price}</span>
                      <span>📅 {s.bookings} Buchungen</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setEditService(s)} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}>
                      <Edit3 size={13} color="#555" />
                    </button>
                    <button onClick={() => toggleService(s.id)} style={{ background: s.active ? `${TEAL}15` : "#f0f0f0", border: `1px solid ${s.active ? TEAL + "40" : "#ddd"}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontSize: 11, fontWeight: 700, color: s.active ? TEAL : "#aaa" }}>
                      {s.active ? "Aktiv" : "Pausiert"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── WERKE ── */}
        {tab === "werke" && (
          <div>
            <button style={{ width: "100%", background: `${CORAL}10`, border: `1.5px dashed ${CORAL}60`, borderRadius: 14, padding: "12px", marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: CORAL, fontWeight: 700, fontSize: 14 }}>
              <Plus size={16} color={CORAL} /> Neues Werk hinzufügen
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {werke.map(w => (
                <div key={w.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", opacity: w.active ? 1 : 0.55 }}>
                  <div style={{ position: "relative" }}>
                    <img src={w.img} style={{ width: "100%", height: 110, objectFit: "cover" }} alt={w.title} />
                    <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 5 }}>
                      <button onClick={() => toggleWerk(w.id)} style={{ background: w.active ? TEAL : "#aaa", border: "none", borderRadius: 99, padding: "3px 8px", fontSize: 9, fontWeight: 800, color: "white", cursor: "pointer" }}>
                        {w.active ? "Aktiv" : "Aus"}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#222", marginBottom: 4 }}>{w.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: CORAL, fontSize: 13 }}>{w.price}</span>
                      <span style={{ fontSize: 10, color: "#aaa" }}>🛒 {w.sold} verk.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BUCHUNGEN ── */}
        {tab === "buchungen" && (
          <div>
            {bookings.length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 24px", color: "#bbb" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#ccc" }}>Noch keine Buchungen</div>
              </div>
            )}
            {bookings.map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: b.status === "pending" ? `2px solid ${GOLD}` : "2px solid transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{b.client}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{b.service}</div>
                    <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, marginTop: 2 }}>{b.date}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 15, color: CORAL, textAlign: "right" }}>{b.amount} €</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: b.status === "confirmed" ? TEAL : GOLD, textAlign: "right", marginTop: 2 }}>
                      {b.status === "confirmed" ? "✓ Bestätigt" : "⏳ Ausstehend"}
                    </div>
                  </div>
                </div>
                {b.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button onClick={() => declineBooking(b.id)} style={{ flex: 1, background: "#fff0ee", border: `1px solid ${CORAL}40`, borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, color: CORAL, cursor: "pointer" }}>Ablehnen</button>
                    <button onClick={() => confirmBooking(b.id)} style={{ flex: 2, background: `linear-gradient(135deg, ${TEAL}, #10b981)`, border: "none", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, color: "white", cursor: "pointer" }}>✓ Bestätigen</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── VERFÜGBARKEIT ── */}
        {tab === "verfuegbarkeit" && (
          <div>
            <div style={{ background: "white", borderRadius: 18, padding: "18px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 14 }}>Verfügbare Tage & Zeiten</div>
              {Object.entries(defaultSlots).map(([d, times]) => (
                <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f5f5f3" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: TEAL, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{d}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {times.map(t => (
                      <span key={t} style={{ background: `${TEAL}15`, color: TEAL, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "3px 9px" }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAvail(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL}cc)`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Calendar size={17} /> Verfügbarkeit bearbeiten
            </button>
          </div>
        )}
      </div>

      {showAvail && <AvailabilityPanel onClose={() => setShowAvail(false)} />}
      {editService && (
        <ServiceEditor
          service={editService === "new" ? null : editService}
          onClose={() => setEditService(null)}
          onSave={(updated) => {
            setServices(prev => {
              const idx = prev.findIndex(s => s.id === updated.id);
              if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n; }
              return [...prev, updated];
            });
            setEditService(null);
          }}
        />
      )}
    </div>
  );
}
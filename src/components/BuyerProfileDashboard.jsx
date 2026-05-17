import React, { useState } from "react";
import { ArrowLeft, Star, Heart, Calendar, Clock, Package, ChevronRight, X, ShoppingBasket, Leaf } from "lucide-react";

const CORAL = "#FF6B5B"; const TEAL = "#2ABFAC"; const GOLD = "#F5A623";

const mockOrders = [
  { id: "o1", title: "Handgemachte Keramik-Tasse", seller: "Sofia M.", price: "42,50 €", date: "28. Apr 2026", status: "geliefert", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&q=80", rated: true },
  { id: "o2", title: "Aquarell-Portrait", seller: "Lena K.", price: "126,00 €", date: "15. Apr 2026", status: "in_bearbeitung", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=200&q=80", rated: false },
  { id: "o3", title: "Handgenähter Leder-Rucksack", seller: "Tom H.", price: "203,00 €", date: "2. Mär 2026", status: "geliefert", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80", rated: false },
];

const mockBookings = [
  { id: "bk1", service: "Keramik-Workshop (2 Std.)", wirker: "Sofia M.", wirkerImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", date: "Mi, 14. Mai · 14:00", status: "confirmed", amount: 75, inEscrow: true, rated: false },
  { id: "bk2", service: "Yoga-Session (60 Min.)", wirker: "Maria L.", wirkerImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", date: "Sa, 17. Mai · 10:00", status: "pending", amount: 70, inEscrow: false, rated: false },
  { id: "bk3", service: "Portrait-Shooting", wirker: "Marcus B.", wirkerImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", date: "Do, 8. Mai · 11:00", status: "completed", amount: 180, inEscrow: false, rated: true },
];

const mockSavedWirker = [
  { id: "sw1", name: "Lena K.", talent: "Aquarell-Illustratorin", rate: "60 €/h", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", nextFree: "Morgen, 10:00" },
  { id: "sw2", name: "Tom H.", talent: "Leder-Handwerker", rate: "55 €/h", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop", nextFree: "Fr, 15:00" },
  { id: "sw3", name: "Sofia M.", talent: "Keramik-Künstlerin", rate: "45 €/h", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop", nextFree: "Heute, 16:00" },
];

const mockSavedWerke = [
  { id: "sk1", title: "Makramee Wanddeko", creator: "Mia T.", price: "65 €", img: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=300&q=80" },
  { id: "sk2", title: "Handgebundenes Notizbuch", creator: "Jonas K.", price: "28 €", img: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&q=80" },
];

const huiPunkte = [
  { icon: "📅", label: "Buchung abgeschlossen", punkte: +50, datum: "Heute" },
  { icon: "👍", label: "Empfehlung abgegeben", punkte: +20, datum: "Gestern" },
  { icon: "🎁", label: "Eingelöst · 5 € Rabatt", punkte: -100, datum: "vor 3 Tagen" },
  { icon: "🌱", label: "Impact-Projekt unterstützt", punkte: +30, datum: "vor 4 Tagen" },
  { icon: "✨", label: "Profil vervollständigt", punkte: +100, datum: "vor 1 Woche" },
  { icon: "🛒", label: "Erstes Werk gekauft", punkte: +25, datum: "vor 2 Wochen" },
];

const STATUS_MAP = {
  geliefert: { label: "✓ Geliefert", color: TEAL, bg: `${TEAL}15` },
  in_bearbeitung: { label: "⏳ In Bearbeitung", color: GOLD, bg: `${GOLD}15` },
  confirmed: { label: "✓ Bestätigt", color: TEAL, bg: `${TEAL}15` },
  pending: { label: "⏳ Ausstehend", color: GOLD, bg: `${GOLD}15` },
  completed: { label: "✓ Abgeschlossen", color: "#10b981", bg: "#10b98115" },
};

function RatingModal({ item, onClose, onSubmit }) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300  /* Z.overlay */, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "22px 20px 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Empfehlung abgeben</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#aaa" /></button>
        </div>
        <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{item.service || item.title} · {item.wirker || item.seller}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" }}>
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setStars(s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 32, color: s <= stars ? GOLD : "#ddd" }}>★</button>
          ))}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Was hat dir besonders gut gefallen? (optional)" rows={3}
          style={{ width: "100%", borderRadius: 12, border: "1.5px solid #eee", padding: "11px 14px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14 }} />
        <button onClick={() => { onSubmit(); onClose(); }} disabled={stars === 0} style={{ width: "100%", background: stars ? `linear-gradient(135deg, ${TEAL}, ${GOLD})` : "#e0e0e0", color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: stars ? "pointer" : "default" }}>
          👍 Empfehlung abgeben {stars > 0 && `(${stars}★)`}
        </button>
      </div>
    </div>
  );
}

export default function BuyerProfileDashboard({ onBack, onViewWirker, onBookWirker }) {
  const [tab, setTab] = useState("bestellungen");
  const [orders, setOrders] = useState(mockOrders);
  const [bookings, setBookings] = useState(mockBookings);
  const [savedWirker, setSavedWirker] = useState(mockSavedWirker);
  const [savedWerke, setSavedWerke] = useState(mockSavedWerke);
  const [ratingItem, setRatingItem] = useState(null);
  const [punkteTab, setPunkteTab] = useState("verlauf");

  const totalPunkte = 250;
  const totalSpent = [...orders.map(o => parseFloat(o.price.replace(".", "").replace(",", ".").replace("€", ""))), ...bookings.filter(b => b.status === "completed").map(b => b.amount)].reduce((a, b) => a + b, 0);

  const markRated = (type, id) => {
    if (type === "order") setOrders(o => o.map(x => x.id === id ? { ...x, rated: true } : x));
    if (type === "booking") setBookings(b => b.map(x => x.id === id ? { ...x, rated: true } : x));
    setRatingItem(null);
  };

  const releaseEscrow = (id) => {
    setBookings(b => b.map(x => x.id === id ? { ...x, inEscrow: false, status: "completed" } : x));
  };

  const tabs = [
    { id: "bestellungen", label: "Bestellungen", icon: "🛒" },
    { id: "buchungen", label: "Buchungen", icon: "📅" },
    { id: "gespeichert", label: "Gespeichert", icon: "⭐" },
    { id: "punkte", label: "HUI-Punkte", icon: "🏅" },
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
            <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Mein Bereich</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>Bestellungen, Buchungen & mehr</div>
          </div>
          <div style={{ background: `${GOLD}18`, borderRadius: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 14 }}>⭐</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: GOLD }}>{totalPunkte} Pkt.</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "flex", gap: 0, background: "#f9f9f7", borderRadius: 14, padding: 6, marginBottom: 14 }}>
          {[
            { val: orders.length, label: "Käufe" },
            { val: bookings.length, label: "Buchungen" },
            { val: savedWirker.length, label: "Gespeichert" },
            { val: `${totalPunkte}`, label: "HUI-Pkt." },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "4px 0", borderRight: i < arr.length - 1 ? "1px solid #eee" : "none" }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#222" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, background: "none", border: "none", borderBottom: tab === t.id ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "8px 12px 10px", fontWeight: tab === t.id ? 700 : 500, fontSize: 12, color: tab === t.id ? CORAL : "#aaa", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 80px" }}>

        {/* ── BESTELLUNGEN ── */}
        {tab === "bestellungen" && (
          <div>
            {orders.length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 24px", color: "#bbb" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#ccc" }}>Noch keine Bestellungen</div>
              </div>
            )}
            {orders.map(o => {
              const st = STATUS_MAP[o.status] || {};
              return (
                <div key={o.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", gap: 12, padding: "14px 14px", alignItems: "center" }}>
                    <img src={o.img} style={{ width: 62, height: 62, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} alt={o.title} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#222", marginBottom: 3, lineHeight: 1.3 }}>{o.title}</div>
                      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>von {o.seller} · {o.date}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: CORAL, fontSize: 13 }}>{o.price}</span>
                        <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "2px 8px" }}>{st.label}</span>
                      </div>
                    </div>
                  </div>
                  {!o.rated && o.status === "geliefert" && (
                    <div style={{ padding: "0 14px 14px" }}>
                      <button onClick={() => setRatingItem({ ...o, type: "order" })} style={{ width: "100%", background: `${TEAL}12`, border: `1px solid ${TEAL}30`, borderRadius: 12, padding: "9px", fontWeight: 700, fontSize: 13, color: TEAL, cursor: "pointer" }}>
                        👍 Empfehlung abgeben · +20 Punkte
                      </button>
                    </div>
                  )}
                  {o.rated && (
                    <div style={{ padding: "0 14px 12px", fontSize: 12, color: TEAL, fontWeight: 600 }}>✓ Empfehlung abgegeben</div>
                  )}
                </div>
              );
            })}
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
            {bookings.map(b => {
              const st = STATUS_MAP[b.status] || {};
              return (
                <div key={b.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: b.inEscrow ? `2px solid ${GOLD}40` : "2px solid transparent" }}>
                  <div style={{ display: "flex", gap: 12, padding: "14px", alignItems: "center" }}>
                    <img src={b.wirkerImg} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}25`, flexShrink: 0 }} alt={b.wirker} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#222", marginBottom: 2 }}>{b.service}</div>
                      <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, marginBottom: 3 }}>mit {b.wirker}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#aaa" }}>{b.date}</span>
                        <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "2px 8px" }}>{st.label}</span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 15, color: CORAL, flexShrink: 0 }}>{b.amount} €</div>
                  </div>
                  {b.inEscrow && (
                    <div style={{ margin: "0 14px", marginBottom: 12, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>🔒 {b.amount} € liegen im Treuhand — bitte bestätige, wenn du zufrieden bist.</div>
                      <button onClick={() => releaseEscrow(b.id)} style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, border: "none", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, color: "white", cursor: "pointer" }}>
                        ✓ Leistung bestätigen & freigeben
                      </button>
                    </div>
                  )}
                  {!b.rated && b.status === "completed" && (
                    <div style={{ padding: "0 14px 14px" }}>
                      <button onClick={() => setRatingItem({ ...b, type: "booking" })} style={{ width: "100%", background: `${TEAL}12`, border: `1px solid ${TEAL}30`, borderRadius: 12, padding: "9px", fontWeight: 700, fontSize: 13, color: TEAL, cursor: "pointer" }}>
                        👍 Empfehlung abgeben · +20 Punkte
                      </button>
                    </div>
                  )}
                  {b.rated && b.status === "completed" && (
                    <div style={{ padding: "0 14px 12px", fontSize: 12, color: TEAL, fontWeight: 600 }}>✓ Empfehlung abgegeben</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── GESPEICHERT ── */}
        {tab === "gespeichert" && (
          <div>
            {/* Gespeicherte Wirker */}
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 10 }}>✨ Gespeicherte Wirker ({savedWirker.length})</div>
            {savedWirker.length === 0 ? (
              <div style={{ background: "white", borderRadius: 14, padding: "24px", textAlign: "center", color: "#bbb", marginBottom: 16, fontSize: 13 }}>Noch keine Wirker gespeichert</div>
            ) : savedWirker.map(w => (
              <div key={w.id} style={{ background: "white", borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <img src={w.img} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}25` }} alt={w.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{w.talent}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{w.rate} · Frei: {w.nextFree}</div>
                  </div>
                  <button onClick={() => setSavedWirker(s => s.filter(x => x.id !== w.id))} style={{ background: `${GOLD}15`, border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Star size={14} fill={GOLD} color={GOLD} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onViewWirker && onViewWirker(w.name)} style={{ flex: 1, background: "#f5f5f3", border: "none", borderRadius: 10, padding: "9px", fontWeight: 600, fontSize: 12, color: "#444", cursor: "pointer" }}>Profil</button>
                  <button onClick={() => onBookWirker && onBookWirker(w.name)} style={{ flex: 2, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 12, color: "white", cursor: "pointer" }}>📅 Buchen</button>
                </div>
              </div>
            ))}

            {/* Gespeicherte Werke */}
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", margin: "16px 0 10px" }}>🎁 Gespeicherte Werke ({savedWerke.length})</div>
            {savedWerke.length === 0 ? (
              <div style={{ background: "white", borderRadius: 14, padding: "24px", textAlign: "center", color: "#bbb", fontSize: 13 }}>Noch keine Werke gespeichert</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {savedWerke.map(w => (
                  <div key={w.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                    <div style={{ position: "relative" }}>
                      <img src={w.img} style={{ width: "100%", height: 110, objectFit: "cover" }} alt={w.title} />
                      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 20, padding: "3px 8px", fontWeight: 800, fontSize: 12 }}>{w.price}</div>
                      <button onClick={() => setSavedWerke(s => s.filter(x => x.id !== w.id))} style={{ position: "absolute", top: 6, right: 6, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Star size={12} fill={GOLD} color={GOLD} />
                      </button>
                    </div>
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#222", marginBottom: 2 }}>{w.title}</div>
                      <div style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{w.creator}</div>
                      <button style={{ marginTop: 6, width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 8, padding: "6px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>In den Korb</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HUI-PUNKTE ── */}
        {tab === "punkte" && (
          <div>
            {/* Punkte-Karte */}
            <div style={{ background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`, borderRadius: 20, padding: "20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Dein Guthaben</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "white", lineHeight: 1 }}>{totalPunkte}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>HUI-Punkte = {(totalPunkte / 20).toFixed(2)} € Wert</div>
                </div>
                <div style={{ fontSize: 44 }}>⭐</div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>Noch {500 - totalPunkte} Punkte bis Stufe Gold 🥇</div>
              <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${(totalPunkte / 500) * 100}%`, height: "100%", background: "white", borderRadius: 99 }} />
              </div>
            </div>

            {/* Sub-Tabs */}
            <div style={{ display: "flex", background: "#f0f0ee", borderRadius: 12, padding: 3, marginBottom: 14 }}>
              {[["verlauf", "📋 Verlauf"], ["einloesen", "🎁 Einlösen"]].map(([id, label]) => (
                <button key={id} onClick={() => setPunkteTab(id)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, background: punkteTab === id ? "white" : "transparent", color: punkteTab === id ? "#222" : "#aaa", boxShadow: punkteTab === id ? "0 1px 6px rgba(0,0,0,0.07)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>

            {punkteTab === "verlauf" && huiPunkte.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 14, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: e.punkte > 0 ? `${TEAL}15` : `${CORAL}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{e.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>{e.label}</div>
                  <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>{e.datum}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: e.punkte > 0 ? TEAL : CORAL }}>
                  {e.punkte > 0 ? `+${e.punkte}` : e.punkte}
                </div>
              </div>
            ))}

            {punkteTab === "einloesen" && (
              <div>
                <div style={{ background: `${GOLD}15`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>⭐</span>
                  <div style={{ fontSize: 13, color: "#666" }}>Du hast <strong style={{ color: GOLD }}>{totalPunkte} Punkte</strong> — wähle eine Prämie:</div>
                </div>
                {[
                  { icon: "💸", label: "5 € Rabatt", sub: "Auf nächste Buchung", kosten: 100 },
                  { icon: "💸", label: "10 € Rabatt", sub: "Auf nächste Buchung", kosten: 200 },
                  { icon: "🎟", label: "Gratis Buchung", sub: "Bis 30 €", kosten: 600 },
                  { icon: "🌱", label: "Impact-Spende", sub: "2,50 € in den Impact Pool", kosten: 50 },
                ].map((p, i) => {
                  const canRedeem = totalPunkte >= p.kosten;
                  return (
                    <div key={i} style={{ background: "white", borderRadius: 16, padding: "14px", marginBottom: 10, opacity: canRedeem ? 1 : 0.5, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 26 }}>{p.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "#222" }}>{p.label}</div>
                          <div style={{ fontSize: 12, color: "#aaa" }}>{p.sub}</div>
                        </div>
                        <div style={{ background: `${GOLD}18`, borderRadius: 99, padding: "4px 10px", fontWeight: 800, fontSize: 12, color: GOLD }}>{p.kosten} Pkt.</div>
                      </div>
                      <button disabled={!canRedeem} style={{ width: "100%", background: canRedeem ? `linear-gradient(135deg, ${GOLD}, #f59e0b)` : "#e8e8e8", border: "none", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 13, color: canRedeem ? "white" : "#bbb", cursor: canRedeem ? "pointer" : "not-allowed" }}>
                        {canRedeem ? "Jetzt einlösen" : `Noch ${p.kosten - totalPunkte} Punkte fehlen`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {ratingItem && (
        <RatingModal
          item={ratingItem}
          onClose={() => setRatingItem(null)}
          onSubmit={() => markRated(ratingItem.type, ratingItem.id)}
        />
      )}
    </div>
  );
}
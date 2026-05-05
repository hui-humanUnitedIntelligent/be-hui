import React, { useState, useEffect } from "react";
import { Heart, Star, MapPin, Calendar, Clock, ThumbsUp } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

function FavoritesPage({ onViewWirker, onBookWirker, onViewWerk, onAddToCart }) {
  const [tab, setTab] = useState("wirker");
  const [favWirker, setFavWirker] = useState(mockFavWirker.map(w => w.id));
  const [favWerke, setFavWerke] = useState(mockFavWerke.map(w => w.id));
  const [favImpact, setFavImpact] = useState(mockFavImpact.map(i => i.id));
  const [addedToCart, setAddedToCart] = useState({});

  const handleAddToCart = (werk) => {
    onAddToCart && onAddToCart(werk);
    setAddedToCart(p => ({ ...p, [werk.id]: true }));
    setTimeout(() => setAddedToCart(p => ({ ...p, [werk.id]: false })), 1800);
  };

  const tabs = [
    { id: "wirker", label: "Wirker", count: favWirker.length, icon: "✨" },
    { id: "werke",  label: "Werke",  count: favWerke.length,  icon: "🎁" },
    { id: "impact", label: "Impact", count: favImpact.length, icon: "🌱" },
  ];

  const EmptyState = ({ icon, label, sub, action, actionLabel }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 28px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: "#f5f5f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, marginBottom: 16, boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)" }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: "#333", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#bbb", fontSize: 13, lineHeight: 1.65, maxWidth: 240 }}>{sub}</div>
      {action && (
        <button onClick={action} style={{ marginTop: 18, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "12px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ paddingBottom: 90, background: "#fafaf8", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: "20px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#222" }}>Meine Favoriten</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{favWirker.length + favWerke.length + favImpact.length} gespeicherte Einträge</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${GOLD}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div>
        </div>
        <div style={{ display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t.id ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "9px 0 11px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ fontSize: 13 }}>{t.icon}</span>
                <span style={{ fontWeight: tab === t.id ? 700 : 500, fontSize: 13, color: tab === t.id ? CORAL : "#aaa" }}>{t.label}</span>
                <span style={{ background: tab === t.id ? `${CORAL}18` : "#f0f0ee", color: tab === t.id ? CORAL : "#bbb", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 6px" }}>{t.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TAB: WIRKER */}
      {tab === "wirker" && (
        <div style={{ padding: "10px 0" }}>
          {favWirker.length === 0
            ? <EmptyState icon="✨" label="Noch keine Talente gespeichert" sub="Tippe auf ⭐ im Profil eines Talents um es hier zu speichern" />
            : mockFavWirker.filter(w => favWirker.includes(w.id)).map(w => (
              <div key={w.id} style={{ background: "white", margin: "0 0 8px", padding: "14px 16px", borderLeft: `4px solid ${TEAL}` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={w.img} style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${TEAL}25` }} alt={w.name} />
                    {w.online && <div style={{ position: "absolute", bottom: 2, right: 2, width: 13, height: 13, borderRadius: "50%", background: "#4CAF50", border: "2px solid white" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{w.name}</span>
                      <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 7px" }}>✓ Talent</span>
                    </div>
                    <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{w.talent}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: "#bbb", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{w.location}</span>
                      <span style={{ fontSize: 11, color: TEAL, display: "flex", alignItems: "center", gap: 2 }}><ThumbsUp size={10} color={TEAL} /> {w.recommendations}</span>
                      <span style={{ fontSize: 11, color: "#bbb" }}>{w.rate}</span>
                    </div>
                  </div>
                  <button onClick={() => setFavWirker(p => p.filter(id => id !== w.id))}
                    style={{ background: `${GOLD}15`, border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Star size={15} fill={GOLD} color={GOLD} />
                  </button>
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, background: `${TEAL}08`, borderRadius: 10, padding: "7px 10px" }}>
                  <Clock size={13} color={TEAL} />
                  <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>Nächster freier Termin: {w.nextFree}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => onViewWirker && onViewWirker(w.name)}
                    style={{ flex: 1, background: "#f5f5f3", border: "none", borderRadius: 12, padding: "9px 0", fontWeight: 600, fontSize: 13, color: "#444", cursor: "pointer" }}>
                    Profil ansehen
                  </button>
                  <button onClick={() => onBookWirker && onBookWirker(w.name)}
                    style={{ flex: 2, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 12, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Calendar size={13} color="white" /> Termin buchen
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* TAB: WERKE */}
      {tab === "werke" && (
        <div style={{ padding: "10px 0" }}>
          {favWerke.length === 0
            ? <EmptyState icon="🎁" label="Noch keine Werke gespeichert" sub="Tippe auf ⭐ bei einem Werk um es hier zu speichern" />
            : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 12px" }}>
                {mockFavWerke.filter(w => favWerke.includes(w.id)).map(werk => (
                  <div key={werk.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: `0 2px 12px ${CORAL}10`, border: `1px solid ${CORAL}12` }}>
                    <div style={{ position: "relative", cursor: "pointer" }} onClick={() => onViewWerk && onViewWerk(werk.title)}>
                      <img src={werk.img} style={{ width: "100%", height: 130, objectFit: "cover" }} alt={werk.title} />
                      <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.52)", color: "white", borderRadius: 20, padding: "3px 9px", fontWeight: 800, fontSize: 13 }}>{werk.price}</div>
                      <button onClick={e => { e.stopPropagation(); setFavWerke(p => p.filter(id => id !== werk.id)); }}
                        style={{ position: "absolute", top: 7, right: 7, background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Star size={13} fill={GOLD} color={GOLD} />
                      </button>
                    </div>
                    <div style={{ padding: "9px 10px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#222", marginBottom: 4, lineHeight: 1.3 }}>{werk.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                        <img src={werk.creatorImg} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} alt="" />
                        <span style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{werk.creator}</span>
                      </div>
                      <button onClick={() => handleAddToCart(werk)}
                        style={{ width: "100%", background: addedToCart[werk.id] ? TEAL : CORAL, color: "white", border: "none", borderRadius: 10, padding: "7px 0", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "background 0.2s" }}>
                        {addedToCart[werk.id] ? "✓ Im Korb" : "In den Korb"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* TAB: IMPACT */}
      {tab === "impact" && (
        <div style={{ padding: "10px 0" }}>
          {favImpact.length === 0
            ? <EmptyState icon="🌱" label="Noch keine Projekte gespeichert" sub="Entdecke Impact-Projekte und speichere sie hier — sie liegen dir am Herzen" />
            : mockFavImpact.filter(i => favImpact.includes(i.id)).map(proj => (
              <div key={proj.id} style={{ background: "white", margin: "0 0 8px", overflow: "hidden", borderLeft: `4px solid ${GOLD}` }}>
                <div style={{ position: "relative" }}>
                  <img src={proj.img} style={{ width: "100%", height: 110, objectFit: "cover" }} alt={proj.title} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6))" }} />
                  <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "white" }}>{proj.emoji} {proj.title}</div>
                    <button onClick={() => setFavImpact(p => p.filter(id => id !== proj.id))}
                      style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Star size={13} fill={GOLD} color={GOLD} />
                    </button>
                  </div>
                  <div style={{ position: "absolute", top: 10, left: 14, background: `${GOLD}dd`, color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>{proj.tag}</div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                      <span style={{ fontWeight: 700, color: GOLD }}>{proj.collected.toLocaleString("de-DE")} € gesammelt</span>
                      <span style={{ color: "#bbb" }}>Ziel: {proj.goal.toLocaleString("de-DE")} €</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "#f0f0ee", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${GOLD}, ${CORAL})`, width: `${Math.min((proj.collected / proj.goal) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#aaa", marginBottom: 12 }}>
                    <span>👥 {proj.backers} Unterstützer</span>
                    <span>⏱ noch {proj.daysLeft} Tage</span>
                  </div>
                  <button style={{ width: "100%", background: `linear-gradient(135deg, ${GOLD}, ${CORAL})`, color: "white", border: "none", borderRadius: 12, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    🌱 Jetzt unterstützen
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// TALENT ANBIETEN – Onboarding Flow
// ══════════════════════════════════════════════════════════════════

export default FavoritesPage;

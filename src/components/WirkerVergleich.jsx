import React, { useState } from "react";
import { X, ArrowLeft, Check, Star, ThumbsUp, MapPin, Calendar, BadgeCheck, Scale } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

// Alle vergleichbaren Wirker (Mock + können erweitert werden)
const ALLE_WIRKER = [
  {
    name: "Sofia M.", fullName: "Sofia Mayer", talent: "Keramik-Künstlerin",
    location: "München", recommendations: 34, followers: 218, bookings: 41,
    hourlyRate: 45, pricePerHour: 45, verified: true,
    skills: ["Töpfern", "Glasuren", "Raku-Brennen", "Workshops"],
    img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop",
    memberSince: "März 2024", responseTime: "< 1 Std.",
    availability: ["Mo", "Di", "Mi", "Fr"],
    bio: "Ich forme aus Ton Dinge, die bleiben. Jedes Stück entsteht mit Bedacht.",
    impactEur: 124,
  },
  {
    name: "Marcus B.", fullName: "Marcus Braun", talent: "Fotograf & Videograf",
    location: "Berlin", recommendations: 47, followers: 512, bookings: 89,
    hourlyRate: 90, pricePerHour: 90, verified: true,
    skills: ["Portrait", "Eventfotografie", "Imagefilm", "Drohne"],
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    memberSince: "Januar 2024", responseTime: "< 2 Std.",
    availability: ["Mi", "Do", "Fr", "Sa", "So"],
    bio: "Ich halte Momente fest, die sonst verschwinden. Mit Kamera und Herz seit 12 Jahren.",
    impactEur: 312,
  },
  {
    name: "Maria L.", fullName: "Maria Langner", talent: "Yoga & Achtsamkeits-Coach",
    location: "Zürich", recommendations: 93, followers: 847, bookings: 156,
    hourlyRate: 70, pricePerHour: 70, verified: true,
    skills: ["Hatha Yoga", "Vinyasa", "Meditation", "Online-Coaching"],
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    memberSince: "Februar 2024", responseTime: "< 30 Min.",
    availability: ["Mo", "Di", "Do", "Sa"],
    bio: "Yoga ist für mich kein Sport – es ist eine Haltung zum Leben.",
    impactEur: 567,
  },
  {
    name: "Lars M.", fullName: "Lars Müller", talent: "Keramik-Künstler",
    location: "München", recommendations: 34, followers: 218, bookings: 41,
    hourlyRate: 45, pricePerHour: 45, verified: true,
    skills: ["Keramik", "Töpfern", "Workshops", "Handgemacht"],
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    memberSince: "März 2024", responseTime: "< 1 Std.",
    availability: ["Mo", "Di", "Mi", "Do"],
    bio: "Ich forme aus Ton Dinge, die bleiben. Handgemachte Keramik und Workshops.",
    impactEur: 47,
  },
];

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function RatingBar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5 }}>
        <div style={{
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          height: 5, borderRadius: 99,
          width: `${Math.min((value / max) * 100, 100)}%`,
          transition: "width 0.5s ease"
        }} />
      </div>
    </div>
  );
}

export default function WirkerVergleich({ onClose, onViewWirker, onBookWirker }) {
  const [selected, setSelected] = useState([]);
  const [showPicker, setShowPicker] = useState(true);
  const [highlightWinner, setHighlightWinner] = useState(null);

  const toggleSelect = (wirker) => {
    if (selected.find(w => w.name === wirker.name)) {
      setSelected(prev => prev.filter(w => w.name !== wirker.name));
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, wirker]);
    }
  };

  const startVergleich = () => {
    if (selected.length < 2) return;
    setShowPicker(false);
    // Auto-highlight the best by recommendations
    const best = selected.reduce((a, b) => a.recommendations > b.recommendations ? a : b);
    setHighlightWinner(best.name);
  };

  const maxRecommendations = Math.max(...selected.map(w => w.recommendations), 1);
  const maxBookings = Math.max(...selected.map(w => w.bookings), 1);
  const maxFollowers = Math.max(...selected.map(w => w.followers), 1);
  const maxImpact = Math.max(...selected.map(w => w.impactEur), 1);

  // ── PICKER ──────────────────────────────────────────────────────
  if (showPicker) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Scale size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>Wirker vergleichen</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>Wähle 2–3 Talente aus</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="#555" />
            </button>
          </div>

          {/* Ausgewählt Preview */}
          {selected.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#aaa", flexShrink: 0 }}>Ausgewählt:</span>
              {selected.map(w => (
                <div key={w.name} style={{ display: "flex", alignItems: "center", gap: 5, background: `${TEAL}15`, border: `1px solid ${TEAL}30`, borderRadius: 20, padding: "4px 10px 4px 6px" }}>
                  <img src={w.img} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} alt={w.name} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>{w.name}</span>
                  <button onClick={() => toggleSelect(w)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
                    <X size={12} color={TEAL} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px" }}>
          {ALLE_WIRKER.map(w => {
            const isSelected = !!selected.find(x => x.name === w.name);
            const disabled = !isSelected && selected.length >= 3;
            return (
              <div key={w.name} onClick={() => !disabled && toggleSelect(w)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 16, marginBottom: 8,
                  background: isSelected ? `${TEAL}0d` : "white",
                  border: `2px solid ${isSelected ? TEAL : "#f0f0f0"}`,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1,
                  transition: "all 0.15s"
                }}>
                <img src={w.img} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt={w.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#222", display: "flex", alignItems: "center", gap: 5 }}>
                    {w.fullName}
                    {w.verified && <BadgeCheck size={13} color={TEAL} />}
                  </div>
                  <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{w.talent}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2, display: "flex", gap: 8 }}>
                    <span><MapPin size={10} /> {w.location}</span>
                    <span>👍 {w.recommendations}</span>
                    <span>💶 {w.hourlyRate} €/h</span>
                  </div>
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: isSelected ? TEAL : "#f0f0f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s"
                }}>
                  {isSelected && <Check size={14} color="white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
          <button onClick={startVergleich} disabled={selected.length < 2}
            style={{
              width: "100%", border: "none", borderRadius: 14, padding: "14px",
              fontWeight: 800, fontSize: 16, cursor: selected.length >= 2 ? "pointer" : "default",
              background: selected.length >= 2 ? `linear-gradient(135deg, ${TEAL}, ${GOLD})` : "#e0e0e0",
              color: selected.length >= 2 ? "white" : "#bbb",
              transition: "all 220ms cubic-bezier(0.25,0.46,0.45,0.94)" /* T.color */
            }}>
            {selected.length < 2 ? `Noch ${2 - selected.length} auswählen` : `${selected.length} Wirker vergleichen →`}
          </button>
        </div>
      </div>
    </div>
  );

  // ── VERGLEICHS-ANSICHT ───────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "#fafaf8", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "white", padding: "14px 16px 12px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <button onClick={() => setShowPicker(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={20} color="#444" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>Vergleich</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>{selected.length} Wirker • Tap auf Profil zum Öffnen</div>
          </div>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#555" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── PROFIL-KÖPFE ── */}
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${selected.length}, 1fr)`,
          gap: 0, background: "white", borderBottom: "1px solid #f0f0f0"
        }}>
          {selected.map(w => {
            const isWinner = w.name === highlightWinner;
            return (
              <div key={w.name} onClick={() => onViewWirker && onViewWirker(w.name)}
                style={{
                  padding: "14px 8px 12px", textAlign: "center", cursor: "pointer",
                  borderLeft: isWinner ? `3px solid ${TEAL}` : "3px solid transparent",
                  background: isWinner ? `${TEAL}07` : "white",
                  position: "relative"
                }}>
                {isWinner && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: TEAL, color: "white", fontSize: 8, fontWeight: 800, borderRadius: 10, padding: "2px 6px" }}>
                    TOP
                  </div>
                )}
                <div style={{ position: "relative", display: "inline-block", marginBottom: 6 }}>
                  <img src={w.img} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${isWinner ? TEAL : "#eee"}` }} alt={w.name} />
                  {w.verified && (
                    <div style={{ position: "absolute", bottom: 0, right: 0, background: TEAL, borderRadius: "50%", width: 16, height: 16, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>✓</div>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#222", lineHeight: 1.3 }}>{w.name}</div>
                <div style={{ fontSize: 10, color: TEAL, fontWeight: 600, marginTop: 1 }}>{w.talent.length > 18 ? w.talent.slice(0, 16) + "…" : w.talent}</div>
                <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>{w.location}</div>
              </div>
            );
          })}
        </div>

        {/* ── STUNDENSATZ ── */}
        <Section title="💶 Stundensatz">
          {selected.map(w => {
            const lowest = Math.min(...selected.map(x => x.hourlyRate));
            const isBest = w.hourlyRate === lowest;
            return (
              <Cell key={w.name} isBest={isBest} bestColor="#10b981" bestLabel="Günstigster">
                <div style={{ fontWeight: 900, fontSize: 18, color: isBest ? "#10b981" : "#222" }}>
                  {w.hourlyRate} €/h
                </div>
              </Cell>
            );
          })}
        </Section>

        {/* ── EMPFEHLUNGEN ── */}
        <Section title="👍 Empfehlungen">
          {selected.map(w => {
            const isBest = w.recommendations === Math.max(...selected.map(x => x.recommendations));
            return (
              <Cell key={w.name} isBest={isBest} bestColor={TEAL} bestLabel="Meiste">
                <div style={{ fontWeight: 900, fontSize: 20, color: isBest ? TEAL : "#222" }}>{w.recommendations}</div>
                <RatingBar label="" value={w.recommendations} max={maxRecommendations} color={isBest ? TEAL : "#ddd"} />
              </Cell>
            );
          })}
        </Section>

        {/* ── BUCHUNGEN ── */}
        <Section title="📅 Abgeschlossene Buchungen">
          {selected.map(w => {
            const isBest = w.bookings === Math.max(...selected.map(x => x.bookings));
            return (
              <Cell key={w.name} isBest={isBest} bestColor={CORAL} bestLabel="Erfahrenster">
                <div style={{ fontWeight: 900, fontSize: 20, color: isBest ? CORAL : "#222" }}>{w.bookings}</div>
                <RatingBar label="" value={w.bookings} max={maxBookings} color={isBest ? CORAL : "#ddd"} />
              </Cell>
            );
          })}
        </Section>

        {/* ── REAKTIONSZEIT ── */}
        <Section title="⚡ Reaktionszeit">
          {selected.map(w => (
            <Cell key={w.name}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>{w.responseTime}</div>
            </Cell>
          ))}
        </Section>

        {/* ── IMPACT ── */}
        <Section title="🌱 Impact-Beitrag">
          {selected.map(w => {
            const isBest = w.impactEur === Math.max(...selected.map(x => x.impactEur));
            return (
              <Cell key={w.name} isBest={isBest} bestColor="#10b981" bestLabel="Höchster">
                <div style={{ fontWeight: 900, fontSize: 16, color: isBest ? "#10b981" : "#222" }}>{w.impactEur} €</div>
                <RatingBar label="" value={w.impactEur} max={maxImpact} color={isBest ? "#10b981" : "#ddd"} />
              </Cell>
            );
          })}
        </Section>

        {/* ── VERFÜGBARKEIT ── */}
        <Section title="🗓 Verfügbare Tage">
          {selected.map(w => (
            <Cell key={w.name}>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                {WOCHENTAGE.map(d => {
                  const avail = w.availability.includes(d);
                  return (
                    <div key={d} style={{
                      width: 22, height: 22, borderRadius: "50%", fontSize: 8, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: avail ? TEAL : "#f0f0f0",
                      color: avail ? "white" : "#ccc"
                    }}>{d}</div>
                  );
                })}
              </div>
            </Cell>
          ))}
        </Section>

        {/* ── SKILLS ── */}
        <Section title="✨ Skills">
          {selected.map(w => (
            <Cell key={w.name}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                {w.skills.slice(0, 4).map(s => (
                  <span key={s} style={{ background: `${TEAL}15`, color: TEAL, fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "3px 7px" }}>{s}</span>
                ))}
              </div>
            </Cell>
          ))}
        </Section>

        {/* ── MITGLIED SEIT ── */}
        <Section title="📅 Dabei seit">
          {selected.map(w => (
            <Cell key={w.name}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{w.memberSince}</div>
            </Cell>
          ))}
        </Section>

        {/* ── AKTIONEN ── */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${selected.length}, 1fr)`, padding: "16px", gap: 8, background: "white", marginTop: 8 }}>
          {selected.map(w => (
            <div key={w.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => { onViewWirker && onViewWirker(w.name); onClose(); }}
                style={{ background: "#f5f5f3", border: "none", borderRadius: 10, padding: "9px 4px", fontWeight: 700, fontSize: 11, color: "#444", cursor: "pointer" }}>
                Profil
              </button>
              <button onClick={() => { onBookWirker && onBookWirker(w.name); onClose(); }}
                style={{ background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 10, padding: "9px 4px", fontWeight: 700, fontSize: 11, color: "white", cursor: "pointer" }}>
                📅 Buchen
              </button>
            </div>
          ))}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// ── Hilfs-Komponenten ──────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ background: "#f7f7f5", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "#888", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${React.Children.count(children)}, 1fr)`, background: "white" }}>
        {children}
      </div>
    </div>
  );
}

function Cell({ children, isBest, bestColor, bestLabel }) {
  return (
    <div style={{
      padding: "12px 8px", textAlign: "center",
      borderLeft: isBest ? `3px solid ${bestColor}` : "3px solid transparent",
      background: isBest ? `${bestColor}07` : "white",
      position: "relative"
    }}>
      {isBest && bestLabel && (
        <div style={{ fontSize: 8, fontWeight: 800, color: bestColor, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
          ✓ {bestLabel}
        </div>
      )}
      {children}
    </div>
  );
}
// WirkungsraumSections — Inhaltsblöcke für Mein HUI (Orb)
// Produktmigration: aus MyCreatorDashboard in den Wirkungsraum verschoben

import React, { useState } from "react";

const T = {
  cardBg: "#FDFBF8",
  teal: "#0DC4B5",
  tealSoft: "rgba(13,196,181,0.10)",
  ink: "#141422",
  ink2: "rgba(20,20,34,0.62)",
  soft: "rgba(20,20,34,0.48)",
  border: "rgba(20,20,34,0.08)",
  r: 18,
};

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

function fmtMonthYear(ts) {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  } catch { return null; }
}

function fmtDate(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString("de-DE", { month: "short", year: "numeric" });
  } catch { return ""; }
}

function Card({ children, style }) {
  return (
    <div style={{
      background: T.cardBg,
      borderRadius: T.r,
      padding: "16px 18px",
      border: `1px solid ${T.border}`,
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function MeinWirkenBlock({ data, loading }) {
  const items = [
    { icon: "💚", label: "Weiterempfehlungen", value: data?.recs ?? 0 },
    { icon: "🎨", label: "Werke", value: data?.works ?? 0 },
    { icon: "🔭", label: "Erlebnisse", value: data?.exps ?? 0 },
    { icon: "👥", label: "Verbindungen", value: data?.connections ?? 0 },
  ];
  const seit = fmtMonthYear(data?.since);

  return (
    <Card>
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 12 }}>
        💚 Meine Wirkung
      </div>
      {loading ? (
        <div style={{ fontSize: 13, color: T.soft }}>Lädt…</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map(({ icon, label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: T.ink2 }}>{icon} {label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.teal }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: T.soft }}>
            {seit ? `Mitglied seit ${seit}` : "Dein Weg auf HUI"}
          </div>
        </>
      )}
    </Card>
  );
}

export function MotivationBlock({ motivation, loading, saving, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(motivation);

  React.useEffect(() => { setText(motivation); }, [motivation]);

  if (editing) {
    return (
      <Card>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 10 }}>
          🌱 Warum ich auf HUI bin
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={400}
          rows={4}
          autoFocus
          style={{
            width: "100%", padding: 12, borderRadius: 12,
            border: `1.5px solid ${T.teal}44`, fontSize: 14,
            fontFamily: "inherit", resize: "none", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => setEditing(false)} style={{
            flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${T.border}`,
            background: "none", fontSize: 13, cursor: "pointer",
          }}>Abbrechen</button>
          <button
            disabled={saving}
            onClick={async () => {
              const ok = await onSave(text);
              if (ok) setEditing(false);
            }}
            style={{
              flex: 2, padding: 10, borderRadius: 12, border: "none",
              background: T.teal, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ cursor: "pointer" }} onClick={() => !loading && setEditing(true)}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: T.ink }}>🌱 Meine Motivation</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.teal }}>Bearbeiten</span>
      </div>
      {loading ? (
        <div style={{ fontSize: 13, color: T.soft }}>Lädt…</div>
      ) : motivation?.trim() ? (
        <p style={{ margin: 0, fontSize: 14, color: T.ink2, fontStyle: "italic", lineHeight: 1.6 }}>
          „{motivation}"
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: T.soft, lineHeight: 1.5 }}>
          Teile, was dich antreibt und warum du Teil von HUI bist.
        </p>
      )}
    </Card>
  );
}

export function VertrauenBlock({ trustStatus, recs, exps, loading }) {
  if (loading) return <Card><div style={{ fontSize: 13, color: T.soft }}>Lädt…</div></Card>;
  return (
    <Card>
      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 10 }}>
        Mein Vertrauen
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>{trustStatus.icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: trustStatus.color }}>{trustStatus.label}</div>
          <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>
            {recs} Empfehlungen · {exps} Erlebnisse
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ChronikBlock({ events, loading }) {
  return (
    <Card>
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 12 }}>
        Meine Chronik
      </div>
      {loading ? (
        <div style={{ fontSize: 13, color: T.soft }}>Lädt…</div>
      ) : events.length === 0 ? (
        <div style={{ fontSize: 13, color: T.soft, lineHeight: 1.5 }}>
          Deine Reise beginnt. Jeder Schritt erscheint hier.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map((ev, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{ev.icon}</span>
              <div>
                <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.4 }}>{ev.label}</div>
                <div style={{ fontSize: 11, color: T.soft, marginTop: 2 }}>{fmtDate(ev.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ResonanzShortcut({ onOpen }) {
  return (
    <button onClick={onOpen} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 14,
      padding: "15px 18px", background: T.cardBg,
      border: `1px solid ${T.border}`, borderRadius: T.r,
      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      <span style={{ fontSize: 20 }}>❤️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: T.ink }}>Meine Resonanz</div>
        <div style={{ fontSize: 12, color: T.soft }}>Alles, was du bewegt und unterstützt hast</div>
      </div>
      <span style={{ color: T.soft }}>›</span>
    </button>
  );
}

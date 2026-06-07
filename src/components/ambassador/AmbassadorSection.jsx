// src/components/ambassador/AmbassadorSection.jsx
// ── HUI Ambassador-Bereich — Anzeige im Profil ───────────────
import React, { useState } from "react";
import { LEVEL_CONFIG } from "../../lib/ambassadorUtils.js";
import { useReferrals } from "../../hooks/useAmbassador.js";

const T = {
  teal:    "#0EC4B8",
  tealSoft:"rgba(14,196,184,0.10)",
  ink:     "#1A1A18",
  inkSoft: "rgba(26,26,24,0.55)",
  inkFaint:"rgba(26,26,24,0.30)",
  bg:      "#FFFFFF",
  border:  "rgba(26,26,24,0.08)",
};

const CSS = `
  @keyframes amb-sec-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .amb-sec-root { animation:amb-sec-in .4s ease both; }
  .amb-copy-btn { transition:all .15s ease;cursor:pointer;touch-action:manipulation; }
  .amb-copy-btn:active { transform:scale(0.95);opacity:0.7; }
  @keyframes amb-copied { 0%{opacity:0;transform:translateY(-4px)} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
  .amb-copied-toast { animation:amb-copied 2s ease both;pointer-events:none; }
  .amb-ref-row { display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(26,26,24,0.06); }
  .amb-ref-row:last-child { border-bottom:none; }
  .amb-ref-avatar { width:34px;height:34px;border-radius:50%;background:#0EC4B8;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0; }
`;

function Avatar({ name, src, size = 34 }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#0EC4B8",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function StatBox({ icon, label, value, accent, onClick, active: isActive }) {
  return (
    <div onClick={onClick} style={{ background: isActive ? "rgba(14,196,184,0.08)" : "#F7F5F2",
      borderRadius: 12, padding: "12px 14px", flex: 1, minWidth: 80,
      cursor: onClick ? "pointer" : "default",
      border: isActive ? "1.5px solid rgba(14,196,184,0.3)" : "1.5px solid transparent",
      transition: "all .15s" }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent || T.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function ReferralList({ referrals, filter, loading }) {
  const list = filter === "active"
    ? referrals.filter(r => r.isActive)
    : referrals.filter(r => !r.isActive);

  if (loading) return (
    <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: T.inkSoft }}>Lade…</div>
  );
  if (list.length === 0) return (
    <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: T.inkSoft }}>
      {filter === "active" ? "Keine aktiven Nutzer" : "Keine schlafenden Nutzer"}
    </div>
  );

  return (
    <div style={{ maxHeight: 260, overflowY: "auto" }}>
      {list.map(u => (
        <div key={u.id} className="amb-ref-row">
          <Avatar name={u.displayName} src={u.avatarUrl} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {u.displayName}
            </div>
            {u.username && (
              <div style={{ fontSize: 11, color: T.inkSoft }}>@{u.username}</div>
            )}
            {/* Kontaktdaten nur bei Schlafenden */}
            {filter === "sleeping" && (u.email || u.phone) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
                {u.email && (
                  <a href={`mailto:${u.email}`} style={{ fontSize: 11, color: T.teal,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                    ✉️ {u.email}
                  </a>
                )}
                {u.phone && (
                  <a href={`tel:${u.phone}`} style={{ fontSize: 11, color: T.teal,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                    📞 {u.phone}
                  </a>
                )}
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, color: T.inkFaint, flexShrink: 0 }}>
            {filter === "active"
              ? <span style={{ color: T.teal, fontWeight: 600 }}>⚡ aktiv</span>
              : <span style={{ color: T.inkSoft }}>😴 inaktiv</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AmbassadorSection({ ambassadorData }) {
  const [copied, setCopied]     = useState(false);
  const [listView, setListView] = useState(null); // null | "active" | "sleeping"

  if (!ambassadorData) return null;

  const level    = ambassadorData.level || "bronze";
  const lvlCfg   = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;
  const refLink  = ambassadorData.referral_link || "";
  const refCode  = ambassadorData.referral_code || null;
  const refs     = Number(ambassadorData.referral_count)          || 0;
  const active   = Number(ambassadorData.active_referral_count)   || 0;
  const sleeping = Number(ambassadorData.sleeping_referral_count) || 0;
  const revenue  = Number(ambassadorData.revenue_generated)       || 0;

  const { referrals, loading: refLoading } = useReferrals(listView ? refCode : null);

  const copyLink = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleList = (type) => {
    setListView(prev => prev === type ? null : type);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="amb-sec-root" style={{
        background: T.bg, borderRadius: 16,
        border: `1.5px solid ${lvlCfg.color}33`,
        margin: "0 16px", overflow: "hidden",
        boxShadow: "0 1px 8px rgba(26,26,24,0.07)",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${lvlCfg.color}18, ${lvlCfg.color}08)`,
          padding: "14px 16px", borderBottom: `1px solid ${lvlCfg.color}22`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>{lvlCfg.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Ambassador-Bereich</div>
            <div style={{ fontSize: 12, color: lvlCfg.color, fontWeight: 600, marginTop: 1 }}>
              {lvlCfg.label}-Level
            </div>
          </div>
          <div style={{
            background: lvlCfg.bg, border: `1px solid ${lvlCfg.color}44`,
            borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 700, color: lvlCfg.color,
          }}>
            {lvlCfg.icon} {lvlCfg.label}
          </div>
        </div>

        {/* Statistiken */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <StatBox icon="👥" label="Geworbene Nutzer" value={refs} />
            <StatBox icon="⚡" label="Aktive Nutzer"    value={active}   accent={T.teal}
              active={listView === "active"}
              onClick={active > 0 ? () => toggleList("active") : undefined} />
            <StatBox icon="😴" label="Schlafende"       value={sleeping}
              active={listView === "sleeping"}
              onClick={sleeping > 0 ? () => toggleList("sleeping") : undefined} />
          </div>

          {/* Referral-Liste (ausklappbar) */}
          {listView && (
            <div style={{
              background: "#F7F5F2", borderRadius: 12, marginBottom: 14,
              border: "1px solid rgba(26,26,24,0.08)", overflow: "hidden",
            }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(26,26,24,0.08)",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>
                  {listView === "active" ? "⚡ Aktive Nutzer" : "😴 Schlafende Nutzer"}
                </div>
                <button onClick={() => setListView(null)}
                  style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer",
                    color: T.inkSoft, padding: 0, display: "flex", alignItems: "center" }}>✕</button>
              </div>
              <ReferralList referrals={referrals} filter={listView} loading={refLoading} />
            </div>
          )}

          {/* Umsatz */}
          <div style={{
            background: "rgba(14,196,184,0.06)", border: "1px solid rgba(14,196,184,0.15)",
            borderRadius: 12, padding: "12px 14px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>💶</span>
            <div>
              <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 2 }}>Mein Anteil (Umsatz)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.teal }}>
                {revenue.toFixed(2)} €
              </div>
            </div>
          </div>

          {/* Ref-Link */}
          {refLink && (
            <div>
              <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, marginBottom: 6 }}>
                🔗 Dein persönlicher Einladungslink
              </div>
              <div style={{ position: "relative" }}>
                <div style={{
                  background: "#F7F5F2", borderRadius: 10, padding: "11px 50px 11px 14px",
                  fontSize: 13, color: T.ink, wordBreak: "break-all", lineHeight: 1.4,
                  border: "1px solid rgba(26,26,24,0.10)",
                }}>
                  {refLink}
                </div>
                <button onClick={copyLink} className="amb-copy-btn"
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: copied ? "rgba(14,196,184,0.15)" : "rgba(14,196,184,0.10)",
                    border: `1px solid ${copied ? T.teal : "rgba(14,196,184,0.3)"}`,
                    borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600,
                    color: T.teal, cursor: "pointer", fontFamily: "inherit",
                  }}>
                  {copied ? "✓" : "📋"}
                </button>
              </div>
              {copied && (
                <div className="amb-copied-toast" style={{
                  fontSize: 12, color: T.teal, marginTop: 6, textAlign: "center",
                }}>
                  Link kopiert! ✓
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Level-Badge (für Profilkopf) ──────────────────────────────
export function AmbassadorBadge({ level, size = "sm" }) {
  if (!level) return null;
  const cfg  = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;
  const pad  = size === "sm" ? "2px 8px" : "4px 12px";
  const font = size === "sm" ? 10 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: cfg.bg, border: `1px solid ${cfg.color}44`,
      borderRadius: 20, padding: pad,
      fontSize: font, fontWeight: 700, color: cfg.color, flexShrink: 0,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── "Werde Ambassador" Button + Pending-Hinweis ───────────────
export function AmbassadorCTA({ isAmbassador, isPending, onApply }) {
  if (isAmbassador) return null;
  if (isPending) {
    return (
      <div style={{
        margin: "0 16px",
        background: "rgba(14,196,184,0.07)",
        border: "1.5px solid rgba(14,196,184,0.25)",
        borderRadius: 14, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>⏳</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>Deine Bewerbung wird geprüft.</div>
          <div style={{ fontSize: 12, color: "rgba(26,26,24,0.55)", marginTop: 2 }}>
            Wir melden uns so schnell wie möglich bei dir.
          </div>
        </div>
      </div>
    );
  }
  return (
    <button onClick={onApply} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      margin: "0 16px", width: "calc(100% - 32px)",
      padding: "15px", background: "#0EC4B8",
      border: "none", borderRadius: 99,
      color: "#fff", fontSize: 16, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
      boxShadow: "0 4px 18px rgba(14,196,184,0.30)",
      transition: "transform .12s ease,opacity .12s ease",
    }}
      onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    >
      🌟 Werde Ambassador
    </button>
  );
}

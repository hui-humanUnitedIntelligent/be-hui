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

  /* Modal Overlay */
  @keyframes amb-modal-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  .amb-modal-sheet { animation:amb-modal-in .25s ease both; }

  .amb-ref-row {
    display:flex;align-items:flex-start;gap:10px;
    padding:12px 16px;border-bottom:1px solid rgba(26,26,24,0.06);
  }
  .amb-ref-row:last-child { border-bottom:none; }
`;

function fmt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" });
}

function Avatar({ name, src, size = 36 }) {
  if (src) return <img src={src} alt={name} style={{
    width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />;
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"#0EC4B8",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
      {initials}
    </div>
  );
}

// ── Plus-Button ───────────────────────────────────────────────
function PlusBtn({ onClick }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        width:22, height:22, borderRadius:"50%",
        background:"rgba(14,196,184,0.12)",
        border:"1.5px solid rgba(14,196,184,0.35)",
        color:"#0EC4B8", fontSize:14, fontWeight:800,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", flexShrink:0, padding:0,
        lineHeight:1, marginLeft:4,
      }}
      aria-label="Liste öffnen"
    >+</button>
  );
}

// ── StatBox mit Plus-Button ───────────────────────────────────
function StatBox({ icon, label, value, accent, onPlus }) {
  return (
    <div style={{ background:"#F7F5F2", borderRadius:12, padding:"12px 14px",
      flex:1, minWidth:80, position:"relative" }}>
      <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <div style={{ fontSize:20, fontWeight:800, color:accent || T.ink, lineHeight:1 }}>{value}</div>
        <PlusBtn onClick={onPlus} />
      </div>
      <div style={{ fontSize:11, color:T.inkSoft, marginTop:3, lineHeight:1.3 }}>{label}</div>
    </div>
  );
}

// ── Nutzer-Zeile ──────────────────────────────────────────────
function UserRow({ u }) {
  const isActive = u.isActive;
  return (
    <div className="amb-ref-row">
      <Avatar name={u.displayName} src={u.avatarUrl} />
      <div style={{ flex:1, minWidth:0 }}>
        {/* Name + Status-Badge */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>
            {u.displayName}
          </span>
          <span style={{
            fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:20,
            background: isActive ? "rgba(14,196,184,0.12)" : "rgba(26,26,24,0.07)",
            color:      isActive ? "#0EC4B8"               : T.inkSoft,
          }}>
            {isActive ? "⚡ aktiv" : "😴 schlafend"}
          </span>
        </div>
        {/* @username */}
        {u.username && (
          <div style={{ fontSize:11, color:T.inkSoft, marginTop:1 }}>@{u.username}</div>
        )}
        {/* E-Mail */}
        {u.email && (
          <a href={`mailto:${u.email}`} style={{
            fontSize:11, color:T.teal, textDecoration:"none",
            display:"flex", alignItems:"center", gap:3, marginTop:2,
          }}>
            ✉️ {u.email}
          </a>
        )}
        {/* Daten */}
        <div style={{ display:"flex", gap:10, marginTop:3, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, color:T.inkFaint }}>
            📅 Reg. {fmt(u.joinedAt) || "–"}
          </span>
          {u.firstTransactionAt && (
            <span style={{ fontSize:10, color:"#0EC4B8" }}>
              💳 Erste Zahlung {fmt(u.firstTransactionAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal: Liste ──────────────────────────────────────────────
function ReferralModal({ title, icon, users, loading, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(10,10,8,0.6)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="amb-modal-sheet" style={{
        background:"#FAFAF8", borderRadius:"20px 20px 0 0",
        width:"100%", maxWidth:560,
        maxHeight:"82dvh", display:"flex", flexDirection:"column",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
        paddingBottom:"env(safe-area-inset-bottom, 16px)",
      }}>
        {/* Header */}
        <div style={{
          padding:"16px 20px 12px", borderBottom:"1px solid rgba(26,26,24,0.08)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>
            {icon} {title}
          </div>
          <button onClick={onClose} style={{
            background:"none", border:"none", fontSize:20, cursor:"pointer",
            color:T.inkSoft, padding:"0 4px", display:"flex", alignItems:"center",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY:"auto", flex:1 }}>
          {loading ? (
            <div style={{ padding:32, textAlign:"center", fontSize:13, color:T.inkSoft }}>
              Lade…
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding:32, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🙈</div>
              <div style={{ fontSize:13, color:T.inkSoft }}>Noch keine Einträge</div>
            </div>
          ) : (
            users.map(u => <UserRow key={u.id} u={u} />)
          )}
        </div>
      </div>
    </div>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────
export default function AmbassadorSection({ ambassadorData, userId }) {
  const [copied,  setCopied]  = useState(false);
  const [modal,   setModal]   = useState(null); // null | "all" | "active" | "sleeping"

  if (!ambassadorData) return null;

  const level   = ambassadorData.level || "bronze";
  const lvlCfg  = LEVEL_CONFIG[level]  || LEVEL_CONFIG.bronze;

  // Ref-Link validieren
  const rawLink  = ambassadorData.referral_link || "";
  const refLink  = (rawLink && !rawLink.includes("${") &&
                    !rawLink.endsWith("/undefined") && !rawLink.endsWith("/null"))
    ? rawLink : "";
  const refCode  = ambassadorData.referral_code || null;
  const revenue  = Number(ambassadorData.revenue_generated) || 0;

  // Referrals immer laden (ambassadorId primär, refCode Fallback)
  const { referrals, loading: refLoading } = useReferrals(
    userId || null,
    refCode || null
  );

  // Live-Counter
  const liveTotal    = referrals.length;
  const liveActive   = referrals.filter(r =>  r.isActive).length;
  const liveSleeping = referrals.filter(r => !r.isActive).length;

  // Anzeige-Werte: live wenn vorhanden, sonst DB-Fallback
  const refs     = liveTotal > 0 ? liveTotal    : (Number(ambassadorData.referral_count)           || 0);
  const active   = liveTotal > 0 ? liveActive   : (Number(ambassadorData.active_referral_count)    || 0);
  const sleeping = liveTotal > 0 ? liveSleeping : (Number(ambassadorData.sleeping_referral_count)  || 0);

  // Modal-Daten
  const modalUsers = () => {
    if (modal === "active")   return referrals.filter(r =>  r.isActive);
    if (modal === "sleeping") return referrals.filter(r => !r.isActive);
    return referrals; // "all"
  };
  const modalTitle = () => {
    if (modal === "active")   return "Aktive Nutzer";
    if (modal === "sleeping") return "Schlafende Nutzer";
    return "Alle geworbenen Nutzer";
  };
  const modalIcon = () => {
    if (modal === "active")   return "⚡";
    if (modal === "sleeping") return "😴";
    return "👥";
  };

  const copyLink = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Modal */}
      {modal && (
        <ReferralModal
          title={modalTitle()}
          icon={modalIcon()}
          users={modalUsers()}
          loading={refLoading}
          onClose={() => setModal(null)}
        />
      )}

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
            <StatBox
              icon="👥" label="Geworbene Nutzer" value={refs}
              onPlus={() => setModal("all")}
            />
            <StatBox
              icon="⚡" label="Aktive Nutzer" value={active} accent={T.teal}
              onPlus={() => setModal("active")}
            />
            <StatBox
              icon="😴" label="Schlafende" value={sleeping}
              onPlus={() => setModal("sleeping")}
            />
          </div>

          {/* Umsatz */}
          <div style={{
            background: "rgba(14,196,184,0.06)", border: "1px solid rgba(14,196,184,0.15)",
            borderRadius: 12, padding: "12px 14px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>💶</span>
            <div>
              <div style={{ fontSize: 13, color: T.inkSoft }}>Mein Anteil (Umsatz)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.teal, lineHeight: 1.2 }}>
                {revenue.toFixed(2)} €
              </div>
            </div>
          </div>

          {/* Ref-Link */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 7,
              display: "flex", alignItems: "center", gap: 5 }}>
              🔗 Dein persönlicher Einladungslink
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{
                flex: 1, background: "#F7F5F2", borderRadius: 10,
                padding: "10px 14px", fontSize: 13, color: T.ink,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                border: "1px solid rgba(26,26,24,0.09)",
              }}>
                {refLink || <span style={{ color: T.inkFaint }}>Kein Link verfügbar</span>}
              </div>
              {refLink && (
                <button className="amb-copy-btn" onClick={copyLink} style={{
                  background: T.teal, border: "none", borderRadius: 10,
                  width: 40, height: 40, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 17, color: "#fff",
                  flexShrink: 0, position: "relative",
                }}>
                  {copied ? "✓" : "📋"}
                  {copied && (
                    <span className="amb-copied-toast" style={{
                      position: "absolute", bottom: "110%", left: "50%",
                      transform: "translateX(-50%)",
                      background: T.ink, color: "#fff", borderRadius: 6,
                      padding: "4px 8px", fontSize: 10, whiteSpace: "nowrap",
                    }}>Kopiert!</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// src/components/studio/HuiStudio.jsx
// ─────────────────────────────────────────────────────────────────
// HUI Studio — zentrale Verwaltungsoberfläche
// Ambassador-Bereich vollständig integriert, live Supabase
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase }    from "../../lib/supabaseClient.js";
import AmbassadorModal  from "../ambassador/AmbassadorModal.jsx";
import SettingsModal    from "../settings/SettingsModal.jsx";

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.08)",
  px:        20,
  r16: 16, r12: 12, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
};

const CSS = `
  .studio-scroll {
    overflow-y:auto;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .studio-scroll::-webkit-scrollbar { display:none; }
  .studio-row-btn {
    -webkit-tap-highlight-color:transparent;
    transition:background .12s ease;
  }
  .studio-row-btn:active { background:rgba(14,196,184,0.06) !important; }
  .studio-press {
    -webkit-tap-highlight-color:transparent;
    transition:opacity .15s, transform .15s;
  }
  .studio-press:active { opacity:.72; transform:scale(.97); }
`;

// ── Primitives ────────────────────────────────────────────────────
function Gap({ h }) { return <div style={{ height: h }} />; }

function StudioSection({ label, children }) {
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:10, letterSpacing:"-0.01em" }}>
        {label}
      </div>
      <div style={{
        background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${T.border}`, overflow:"hidden", boxShadow:T.card,
      }}>
        {children}
      </div>
    </div>
  );
}

function StudioRow({ icon, label, badge, onPress, last = false }) {
  return (
    <button className="studio-row-btn" onClick={onPress} style={{
      width:"100%", display:"flex", alignItems:"center", gap:14,
      padding:"15px 18px", background:"none", border:"none", cursor:"pointer",
      fontFamily:"inherit", textAlign:"left",
      borderBottom: last ? "none" : `1px solid ${T.border}`,
    }}>
      <span style={{
        width:34, height:34, borderRadius:10, flexShrink:0,
        background:"rgba(26,26,24,0.05)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
      }}>{icon}</span>
      <span style={{ flex:1, fontSize:14, fontWeight:500, color:T.ink }}>{label}</span>
      {badge && (
        <span style={{
          padding:"2px 9px", borderRadius:99,
          background:T.tealSoft, border:`1px solid ${T.tealMid}`,
          fontSize:11, fontWeight:700, color:T.teal, flexShrink:0,
        }}>{badge}</span>
      )}
      <span style={{ fontSize:15, color:T.inkFaint, flexShrink:0 }}>›</span>
    </button>
  );
}

// ── Level-Farben ──────────────────────────────────────────────────
function levelColor(lvl) {
  const l = (lvl||"").toLowerCase();
  if (l === "platin") return { bg:"#E8E8F0", color:"#6B6B9A", border:"rgba(107,107,154,0.3)" };
  if (l === "gold")   return { bg:"#FFF8E6", color:"#B8860B", border:"rgba(184,134,11,0.3)" };
  if (l === "silber") return { bg:"#F0F0F4", color:"#708090", border:"rgba(112,128,144,0.3)" };
  return { bg:"#FFF0E6", color:"#B8620B", border:"rgba(184,98,11,0.3)" }; // Bronze
}
function levelEmoji(lvl) {
  const l = (lvl||"").toLowerCase();
  if (l === "platin") return "🏆";
  if (l === "gold")   return "🥇";
  if (l === "silber") return "🥈";
  return "🥉";
}

// ── Nutzer-Liste Modal ────────────────────────────────────────────
function UserListModal({ title, users, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9900,
      background:"rgba(0,0,0,0.45)", display:"flex",
      alignItems:"flex-end", justifyContent:"center",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:480,
        background:T.bgCard, borderRadius:"20px 20px 0 0",
        paddingBottom:"max(24px,calc(16px + env(safe-area-inset-bottom,0px)))",
        maxHeight:"70vh", display:"flex", flexDirection:"column",
      }}>
        <div style={{
          padding:"16px 20px 12px",
          borderBottom:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <span style={{ fontSize:15, fontWeight:800, color:T.ink }}>{title}</span>
          <button onClick={onClose} style={{
            background:"none", border:"none", fontSize:18, cursor:"pointer",
            color:T.inkFaint, touchAction:"manipulation",
          }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {users.length === 0 ? (
            <div style={{ padding:"28px 20px", textAlign:"center", color:T.inkFaint, fontSize:13 }}>
              Noch keine Einträge.
            </div>
          ) : (
            users.map((u, i) => (
              <div key={u.id||i} style={{
                padding:"12px 20px",
                borderBottom: i < users.length-1 ? `1px solid ${T.border}` : "none",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background:T.tealSoft, border:`1px solid ${T.tealMid}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:700, color:T.teal, flexShrink:0,
                }}>
                  {(u.display_name||u.username||"?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>
                    {u.display_name || u.username || "Unbekannt"}
                  </div>
                  <div style={{ fontSize:11, color:T.inkFaint, marginTop:1 }}>
                    {u.first_transaction_at ? "✅ Aktiv" : "😴 Schlafend"} · @{u.username||"–"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Ambassador-Bereich Sektion ────────────────────────────────────
// ── Level-Berechnung (live) ──────────────────────────────────────
function calcLevel(referredCount) {
  const n = referredCount || 0;
  if (n >= 201) return "Platin";
  if (n >= 51)  return "Gold";
  if (n >= 11)  return "Silber";
  return "Bronze";
}
function provisionRate(lvl) {
  const l = (lvl||"").toLowerCase();
  if (l === "platin") return 0.04;
  if (l === "gold")   return 0.03;
  if (l === "silber") return 0.02;
  return 0.01;
}

// ── Level-Info-Popup ──────────────────────────────────────────────
function LevelInfoPopup({ onClose }) {
  const levels = [
    { emoji:"🥉", name:"Bronze", rate:"1%",  from:"0–10 Geworbene"   },
    { emoji:"🥈", name:"Silber", rate:"2%",  from:"ab 11 Geworbenen" },
    { emoji:"🥇", name:"Gold",   rate:"3%",  from:"ab 51 Geworbenen" },
    { emoji:"🏆", name:"Platin", rate:"4%",  from:"ab 201 Geworbenen"},
  ];
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"0 24px",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#FFFFFF", borderRadius:20, width:"100%", maxWidth:380,
        padding:"24px 22px", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:17, fontWeight:900, color:T.ink }}>Ambassador-Level</div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", borderRadius:"50%",
            width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:15, cursor:"pointer", touchAction:"manipulation", color:T.inkSoft,
          }}>✕</button>
        </div>
        <div style={{ fontSize:12, color:T.inkSoft, marginBottom:16, lineHeight:1.6 }}>
          Die Provision wird <strong>einmalig</strong> bei der ersten Transaktion eines geworbenen Nutzers berechnet.
        </div>
        {levels.map(({ emoji, name, rate, from }) => {
          const lc = levelColor(name);
          return (
            <div key={name} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 14px", borderRadius:12, marginBottom:8,
              background:lc.bg, border:`1px solid ${lc.border}`,
            }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:lc.color }}>{name}</div>
                <div style={{ fontSize:11, color:T.inkFaint, marginTop:1 }}>{from}</div>
              </div>
              <div style={{
                fontSize:15, fontWeight:900, color:lc.color,
                background:"white", padding:"3px 10px", borderRadius:99,
                border:`1px solid ${lc.border}`,
              }}>{rate}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Nutzer-Liste Modal ────────────────────────────────────────────
function UserListModal({ title, users, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9900,
      background:"rgba(0,0,0,0.45)", display:"flex",
      alignItems:"flex-end", justifyContent:"center",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:480,
        background:T.bgCard, borderRadius:"20px 20px 0 0",
        paddingBottom:"max(24px,calc(16px + env(safe-area-inset-bottom,0px)))",
        maxHeight:"70vh", display:"flex", flexDirection:"column",
      }}>
        <div style={{
          padding:"16px 20px 12px",
          borderBottom:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <span style={{ fontSize:15, fontWeight:800, color:T.ink }}>{title}</span>
          <button onClick={onClose} style={{
            background:"none", border:"none", fontSize:18, cursor:"pointer",
            color:T.inkFaint, touchAction:"manipulation",
          }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {users.length === 0 ? (
            <div style={{ padding:"28px 20px", textAlign:"center", color:T.inkFaint, fontSize:13 }}>
              Noch keine Einträge.
            </div>
          ) : (
            users.map((u, i) => (
              <div key={u.id||i} style={{
                padding:"12px 20px",
                borderBottom: i < users.length-1 ? `1px solid ${T.border}` : "none",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background:T.tealSoft, border:`1px solid ${T.tealMid}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:700, color:T.teal, flexShrink:0,
                }}>
                  {(u.display_name||u.username||"?")[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>
                    {u.display_name || u.username || "Unbekannt"}
                  </div>
                  <div style={{ fontSize:11, color:T.inkFaint, marginTop:1 }}>
                    {u.first_transaction_at
                      ? `✅ Aktiv seit ${new Date(u.first_transaction_at).toLocaleDateString("de-DE")}`
                      : "😴 Noch keine Transaktion"
                    } · @{u.username||"–"}
                  </div>
                </div>
                {u.first_transaction_at && (
                  <span style={{
                    fontSize:10, fontWeight:700, color:T.teal,
                    background:T.tealSoft, border:`1px solid ${T.tealMid}`,
                    padding:"2px 7px", borderRadius:99,
                  }}>Aktiv</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Ambassador-Bereich Sektion ────────────────────────────────────
function AmbassadorStudioSection({ profile }) {
  const [ambData,    setAmbData]    = useState(null);
  const [allUsers,   setAllUsers]   = useState([]);
  const [earnings,   setEarnings]   = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [copying,    setCopying]    = useState(false);
  const [showList,   setShowList]   = useState(null);
  const [showLevel,  setShowLevel]  = useState(false);
  const [applyOpen,  setApplyOpen]  = useState(false);

  const isAmb = profile?.is_ambassador === true;
  const uid   = profile?.id;

  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      try {
        // Ambassador-Daten
        const { data: amb } = await supabase
          .from("ambassadors")
          .select("id,level,ref_link,ref_code")
          .eq("user_id", uid)
          .maybeSingle();

        // Geworbene Nutzer live aus profiles
        const { data: referred } = await supabase
          .from("profiles")
          .select("id,display_name,username,first_transaction_at")
          .eq("referred_by_ambassador_id", uid);

        const users = referred || [];

        // Level live berechnen basierend auf referred_count
        const computedLevel = calcLevel(users.length);

        // Ambassador-Stats für earnings
        const { data: st } = await supabase
          .from("ambassador_stats")
          .select("earnings_total")
          .eq("ambassador_id", amb?.id || uid)
          .maybeSingle();

        setAmbData({ ...(amb || {}), level: computedLevel });
        setAllUsers(users);
        setEarnings(st?.earnings_total ?? 0);
      } catch(e) {
        console.warn("AmbassadorStudio load:", e);
      }
      setLoading(false);
    })();
  }, [uid]);

  async function copyLink() {
    const link = ambData?.ref_link || `https://be-hui.com/${profile?.username}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch(e) {
      // Fallback: select text
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  }

  const level    = ambData?.level || "Bronze";
  const lc       = levelColor(level);
  const refLink  = ambData?.ref_link || `https://be-hui.com/${profile?.username||""}`;
  const referred = allUsers.length;
  const active   = allUsers.filter(u => u.first_transaction_at).length;
  const sleeping = allUsers.filter(u => !u.first_transaction_at).length;

  const listUsers = {
    geworbene:  allUsers,
    aktive:     allUsers.filter(u => u.first_transaction_at),
    schlafende: allUsers.filter(u => !u.first_transaction_at),
  };

  // ── Nicht-Ambassador: CTA ─────────────────────────────────────
  if (!isAmb) {
    return (
      <>
        <div style={{ padding:"16px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <span style={{fontSize:22}}>🌟</span>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>Ambassador werden</div>
              <div style={{ fontSize:12, color:T.inkFaint }}>Empfehle HUI weiter und verdiene mit</div>
            </div>
          </div>
          <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.6, marginBottom:14 }}>
            Als Ambassador empfiehlst du HUI weiter und verdienst mit jedem aktiven Mitglied, das du eingeladen hast.
          </div>
          <button onClick={() => setApplyOpen(true)} style={{
            padding:"10px 22px", borderRadius:T.r99,
            background:T.teal, border:"none", color:"white",
            fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            touchAction:"manipulation",
          }}>Jetzt bewerben</button>
        </div>
        {applyOpen && profile?.id && (
          <AmbassadorModal
            userId={profile.id}
            onClose={() => setApplyOpen(false)}
            onSuccess={() => setApplyOpen(false)}
          />
        )}
      </>
    );
  }

  // ── Aktiver Ambassador ────────────────────────────────────────
  return (
    <>
      {/* Titel-Zeile */}
      <div style={{
        padding:"16px 18px 14px",
        borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>{levelEmoji(level)}</span>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>Ambassador-Bereich</div>
            <div style={{ fontSize:12, color:T.teal, fontWeight:600 }}>{level}-Level</div>
          </div>
        </div>
        {/* Level-Badge — Klick öffnet Info-Popup */}
        <button onClick={() => setShowLevel(true)} className="studio-press" style={{
          padding:"5px 13px", borderRadius:T.r99,
          background:lc.bg, border:`1px solid ${lc.border}`,
          fontSize:12, fontWeight:700, color:lc.color,
          display:"flex", alignItems:"center", gap:5,
          cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
        }}>
          <span>{levelEmoji(level)}</span>
          <span>{level}</span>
        </button>
      </div>

      {/* Statistiken — 3 Kacheln */}
      {loading ? (
        <div style={{ padding:"16px 18px", display:"flex", gap:10 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              flex:1, height:72, borderRadius:T.r12,
              background:"rgba(26,26,24,0.06)",
            }}/>
          ))}
        </div>
      ) : (
        <div style={{ padding:"14px 14px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { emoji:"👥", label:"Geworbene",  count: referred, key:"geworbene"  },
            { emoji:"⚡", label:"Aktive",      count: active,   key:"aktive"     },
            { emoji:"😴", label:"Schlafende",  count: sleeping, key:"schlafende" },
          ].map(({ emoji, label, count, key }) => (
            <button key={key} onClick={() => setShowList(key)} className="studio-press" style={{
              background:"rgba(14,196,184,0.06)",
              border:`1px solid ${T.tealMid}`,
              borderRadius:T.r12, padding:"12px 8px",
              textAlign:"center", cursor:"pointer",
              fontFamily:"inherit", touchAction:"manipulation",
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
            }}>
              <span style={{ fontSize:18 }}>{emoji}</span>
              <div style={{ fontSize:20, fontWeight:900, color:T.ink, lineHeight:1 }}>
                {count}
                <span style={{ fontSize:14, color:T.teal, marginLeft:3 }}>+</span>
              </div>
              <div style={{ fontSize:10, color:T.inkFaint, fontWeight:600, lineHeight:1.2 }}>{label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Mein Anteil */}
      <div style={{
        margin:"0 14px 14px",
        background:"rgba(14,196,184,0.05)",
        borderRadius:T.r12, border:`1px solid ${T.tealMid}`,
        padding:"12px 14px",
        display:"flex", alignItems:"center", gap:10,
      }}>
        <span style={{ fontSize:20, flexShrink:0 }}>💶</span>
        <div>
          <div style={{ fontSize:11, color:T.inkFaint, fontWeight:600, marginBottom:2 }}>
            Mein Anteil (Umsatz)
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:T.ink }}>
            {Number(earnings).toFixed(2)} €
          </div>
        </div>
        <div style={{ marginLeft:"auto", fontSize:11, color:T.inkFaint, textAlign:"right" }}>
          <div>{provisionRate(level)*100}% Provision</div>
          <div style={{ marginTop:2 }}>pro Erstkauf</div>
        </div>
      </div>

      {/* Einladungslink */}
      <div style={{ margin:"0 14px 16px" }}>
        <div style={{ fontSize:11, color:T.inkFaint, fontWeight:600, marginBottom:6,
          display:"flex", alignItems:"center", gap:5 }}>
          <span>🔗</span> Dein persönlicher Einladungslink
        </div>
        <div style={{
          background:T.bg, borderRadius:T.r12,
          border:`1px solid ${T.border}`,
          padding:"10px 14px",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
        }}>
          <span style={{
            fontSize:12, color:T.inkSoft, fontFamily:"monospace",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1,
          }}>
            {refLink}
          </span>
          <button onClick={copyLink} className="studio-press" style={{
            padding:"7px 14px", borderRadius:T.r99, flexShrink:0,
            background: copying ? "#16A34A" : T.teal,
            border:"none", color:"white",
            fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            touchAction:"manipulation", transition:"background .2s",
          }}>
            {copying ? "✓ Kopiert" : "Link kopieren"}
          </button>
        </div>
      </div>

      {/* Level-Info Popup */}
      {showLevel && <LevelInfoPopup onClose={() => setShowLevel(false)} />}

      {/* Nutzer-Listen Modal */}
      {showList && (
        <UserListModal
          title={
            showList === "geworbene"  ? `Geworbene Nutzer (${listUsers.geworbene.length})` :
            showList === "aktive"     ? `Aktive Nutzer (${listUsers.aktive.length})` :
                                       `Schlafende Nutzer (${listUsers.schlafende.length})`
          }
          users={listUsers[showList] || []}
          onClose={() => setShowList(null)}
        />
      )}
    </>
  );
}


export default function HuiStudio({ profile, onClose, onProfileUpdate }) {
  const [mounted,      setMounted]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAmbPanel, setShowAmbPanel] = useState(false);

  const isTalent   = profile?.is_talent === true;
  const isVerified = profile?.verified  === true;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleEditProfile = useCallback(() => {
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("hui:open-profile-editor"));
  }, []);

  if (!profile) return null;

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:9600,
      display:"flex", flexDirection:"column",
      background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
      WebkitFontSmoothing:"antialiased",
      opacity:   mounted ? 1 : 0,
      transform: mounted ? "none" : "translateY(24px)",
      transition:"opacity .3s ease, transform .35s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div style={{
        padding:`max(52px,calc(48px + env(safe-area-inset-top,0px))) ${T.px}px 16px`,
        background:T.bgCard,
        borderBottom:`1px solid ${T.border}`,
        flexShrink:0, position:"relative",
      }}>
        <button onClick={onClose} style={{
          position:"absolute",
          top:"max(14px,calc(10px + env(safe-area-inset-top,0px)))",
          left:T.px,
          background:"none", border:"none", cursor:"pointer",
          fontSize:13, fontWeight:600, color:T.teal,
          fontFamily:"inherit", touchAction:"manipulation",
          display:"flex", alignItems:"center", gap:4,
        }}>‹ Zurück</button>
        <div style={{ fontSize:24, fontWeight:900, color:T.ink, letterSpacing:"-0.04em" }}>
          STUDIO-BEREICH.
        </div>
        <div style={{ fontSize:13, color:T.inkFaint, marginTop:2 }}>HUI-Account.</div>
      </div>

      {/* ── SCROLL-INHALT ─────────────────────────────────────── */}
      <div className="studio-scroll" style={{
        flex:1, overflowY:"auto",
        paddingBottom:"max(88px,calc(80px + env(safe-area-inset-bottom,0px)))",
      }}>
        <Gap h={20}/>

        {/* Intro-Card */}
        <div style={{ padding:`0 ${T.px}px` }}>
          <div style={{
            background:T.bgCard, borderRadius:T.r16,
            border:`1px solid ${T.border}`, padding:"18px 20px",
            boxShadow:T.card, marginBottom:20,
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.teal, letterSpacing:"0.06em", marginBottom:10 }}>
              STUDIO – Nur für dich
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink, lineHeight:1.25, marginBottom:6 }}>
              Willkommen in deinem<br/>HUI Studio
            </div>
            <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.6 }}>
              Verwalte deinen Account, Einladungen und deinen Impact.
            </div>
          </div>
        </div>

        {/* ── 1. Community & Empfehlungen ───────────────────── */}
        <div style={{ padding:`0 ${T.px}px` }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:10, letterSpacing:"-0.01em" }}>
            Community & Empfehlungen
          </div>
          <div style={{
            background:T.bgCard, borderRadius:T.r16,
            border:`1px solid ${T.border}`, overflow:"hidden", boxShadow:T.card,
          }}>
            {/* Ambassador-Bereich Row — toggle */}
            <button className="studio-row-btn" onClick={() => setShowAmbPanel(v => !v)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:14,
              padding:"15px 18px", background:"none", border:"none", cursor:"pointer",
              fontFamily:"inherit", textAlign:"left",
              borderBottom: showAmbPanel ? `1.5px solid ${T.tealMid}` : `1px solid ${T.border}`,
            }}>
              <span style={{
                width:34, height:34, borderRadius:10, flexShrink:0,
                background: showAmbPanel ? T.tealSoft : "rgba(26,26,24,0.05)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
              }}>👥</span>
              <span style={{ flex:1, fontSize:14, fontWeight:500, color: showAmbPanel ? T.teal : T.ink }}>
                Ambassador-Bereich
              </span>
              <span style={{
                fontSize:14, color:T.inkFaint, flexShrink:0,
                transition:"transform .2s",
                display:"inline-block",
                transform: showAmbPanel ? "rotate(90deg)" : "rotate(0deg)",
              }}>›</span>
            </button>

            {/* Ambassador-Panel — inline expandierbar */}
            {showAmbPanel && (
              <div style={{ borderBottom:`1px solid ${T.border}` }}>
                <AmbassadorStudioSection profile={profile} />
                <div style={{ height:8 }}/>
              </div>
            )}

            <StudioRow icon="⭐" label="Meine Empfehlungen"   onPress={() => {}} />
            <StudioRow icon="✉️" label="Einladungen verwalten" onPress={() => {}} last />
          </div>
        </div>
        <Gap h={20}/>

        {/* ── 2. Impact & Stimmen ───────────────────────────── */}
        <StudioSection label="Impact & Stimmen">
          <StudioRow icon="🗳️" label="Impact-Stimmen"
            badge={isTalent ? "2 / Monat" : undefined} onPress={() => {}} />
          <StudioRow icon="❤️" label="Meine unterstützten Projekte" onPress={() => {}} last />
        </StudioSection>
        <Gap h={20}/>

        {/* ── 3. Einnahmen & Statistiken ────────────────────── */}
        <StudioSection label="Einnahmen & Statistiken">
          <StudioRow icon="💶" label="Einnahmen Übersicht" onPress={() => {}} />
          <StudioRow icon="📊" label="Statistiken"         onPress={() => {}} last />
        </StudioSection>
        <Gap h={20}/>



        {/* ── 5. Account & Einstellungen ────────────────────── */}
        <StudioSection label="Account & Einstellungen">
          <StudioRow icon="👤" label="Profil bearbeiten"  onPress={handleEditProfile} />
          <StudioRow icon="🛡️" label="Verifizierung"
            badge={isVerified ? "✓ Aktiv" : undefined} onPress={() => {}} />
          <StudioRow icon="👑" label="Mitgliedschaft"
            badge={isTalent ? "HUI-Talent" : "HUI-Mitglied"}
            onPress={() => setShowSettings(true)} />
          <StudioRow icon="⚙️" label="Einstellungen" onPress={() => setShowSettings(true)} last />
        </StudioSection>
        <Gap h={20}/>

        {/* ── Privacy Footer ────────────────────────────────── */}
        <div style={{ padding:`0 ${T.px}px` }}>
          <div style={{
            background:"rgba(14,196,184,0.07)", borderRadius:T.r16,
            border:`1px solid rgba(14,196,184,0.18)`, padding:"14px 18px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <span style={{ fontSize:22, flexShrink:0 }}>🔒</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>Dein Studio ist privat.</div>
              <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>Nur du hast hier Zugriff.</div>
            </div>
          </div>
        </div>
        <Gap h={20}/>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={onProfileUpdate}
          onEditProfile={() => { setShowSettings(false); handleEditProfile(); }}
          onOpenBookings={() => {
            setShowSettings(false);
            if (typeof window !== "undefined")
              window.dispatchEvent(new CustomEvent("hui:open-bookings"));
          }}
        />
      )}
    </div>,
    document.body
  );
}

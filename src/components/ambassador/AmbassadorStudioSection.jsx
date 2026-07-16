import { HUIGemeinschaftIcon, HUILinkIcon, HUIMailIcon, HUIVerifIcon } from '../../design/icons/HuiSystemIcons.jsx';
// src/components/ambassador/AmbassadorStudioSection.jsx
// ══════════════════════════════════════════════════════════
// Extrahiert aus HuiStudio.jsx (PROFIL-DRAWER-REDESIGN-003, 2026-07-06).
// Grund: "Ambassador-Bereich" zieht vom Studio (das jetzt nur noch
// "Einstellungen" ist) in das neue Drawer-Menü auf der Profilseite um
// (MeinBereichMenu.jsx). Code 1:1 unveraendert uebernommen, nur eigenstaendig
// importierbar gemacht (vorher lokale Funktion in HuiStudio.jsx).
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useHome } from "../home/HomeShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import AmbassadorModal from "./AmbassadorModal.jsx";
import AmbassadorPayoutPanel from "./AmbassadorPayoutPanel.jsx";

// ── Design Tokens (identisch zu HuiStudio.jsx) ─────────────────────
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

// ── Ambassador-Bereich Sektion ────────────────────────────────────
// ── Level-Berechnung (live) ──────────────────────────────────────
// COM-MIGRATION-015.3: Level-Namen + Provisionsraten neu (Starter/Bronze/Silber/Gold, 5/10/15/20%).
// Schwellen unveraendert uebernommen (ANNAHME -- mit Michael abzugleichen, war bereits vor 015.3 offen).
function calcLevel(referredCount) {
  const n = referredCount || 0;
  if (n >= 201) return "Gold";
  if (n >= 51)  return "Silber";
  if (n >= 11)  return "Bronze";
  return "Starter";
}
function provisionRate(lvl) {
  const l = (lvl||"").toLowerCase();
  if (l === "gold")   return 0.20;
  if (l === "silber") return 0.15;
  if (l === "bronze") return 0.10;
  return 0.05;
}

// ── Level-Info-Popup ──────────────────────────────────────────────
function LevelInfoPopup({ onClose }) {
  const levels = [
    { emoji:"🌱", name:"Starter", rate:"5%",  from:"0–10 Geworbene"   },
    { emoji:"🥉", name:"Bronze",  rate:"10%", from:"ab 11 Geworbenen" },
    { emoji:"🥈", name:"Silber",  rate:"15%", from:"ab 51 Geworbenen" },
    { emoji:"🥇", name:"Gold",    rate:"20%", from:"ab 201 Geworbenen"},
  ];
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
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
          Die Provision gilt <strong>365 Tage</strong> ab Registrierung des geworbenen Nutzers und wird bei <strong>jeder</strong> Transaktion in diesem Zeitraum berechnet.
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
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.45)", display:"flex",
      alignItems:"flex-end", justifyContent:"center",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:480,
        background:T.bgCard, borderRadius:"20px 20px 0 0",
        paddingBottom:"max(88px,calc(80px + env(safe-area-inset-bottom,0px)))",
        maxHeight:"80vh", display:"flex", flexDirection:"column",
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
        <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1 }}>
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
  const [ambData,       setAmbData]       = useState(null);
  const [allUsers,      setAllUsers]      = useState([]);
  const [activeList,    setActiveList]    = useState([]);
  const [sleepingList,  setSleepingList]  = useState([]);
  const [earnings,      setEarnings]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [copying,    setCopying]    = useState(false);
  const [showList,      setShowList]      = useState(null);
  const [showLevel,     setShowLevel]     = useState(false);
  const [showEinladungen, setShowEinladungen] = useState(false);
  const [applyOpen,  setApplyOpen]  = useState(false);

  // isAmb: primär aus eigenem Query (ambModule), Fallback auf profile-Prop
  // — robuster als nur profile?.is_ambassador (kann beim ersten Load fehlen)
  const [isAmb, setIsAmb] = useState(profile?.is_ambassador === true);
  const uid   = profile?.id;

  useEffect(() => {
    if (!uid) {
      setLoading(false); // uid noch nicht da → kein Lade-Hänger
      return;
    }
    // Timeout-Sicherheit: falls Supabase nicht antwortet → nie mehr "Lädt..." hängen
    const loadTimeout = setTimeout(() => setLoading(false), 8000);
    (async () => {
      setLoading(true);
      try {
        // 1. Ambassador-Daten aus profile_modules.ambassador
        const { data: selfProfile } = await supabase
          .from("profiles")
          .select("is_ambassador,profile_modules")
          .eq("id", uid)
          .maybeSingle();

        const ambModule = selfProfile?.profile_modules?.ambassador || {};
        // Autoritative Quelle: profiles.username → https://be-hui.com/<username>
        const refLink   = profile?.username ? `https://be-hui.com/${profile.username}` : (ambModule.ref_link || ambModule.referral_link || "");
        // isAmb direkt aus DB setzen — unabhängig vom gecachten profile-Prop
        setIsAmb(selfProfile?.is_ambassador === true || ambModule.status === 'active');

        // 2. Geworbene Nutzer live aus profiles — Feld: referred_by (UUID des Ambassadors)
        const { data: referred } = await supabase
          .from("profiles")
          .select("id,display_name,username,first_transaction_at,referred_by,created_at")
          .eq("referred_by", uid);

        const users = referred || [];

        // Aktiv = first_transaction_at gesetzt, Schlafend = NULL
        const activeUsers   = users.filter(u => u.first_transaction_at != null);
        const sleepingUsers = users.filter(u => u.first_transaction_at == null);

        // COM-MIGRATION-015.3: Provision gilt 365 Tage ab Registrierung des geworbenen Nutzers
        const inWindow = users.filter(u => {
          if (!u.created_at) return false;
          const days = (Date.now() - new Date(u.created_at).getTime()) / 86400000;
          return days <= 365;
        });

        // 3. Level live aus Anzahl geworbener Nutzer
        const computedLevel = calcLevel(users.length);

        // 4. BUGFIX AMB-PAYOUT-009b: Earnings LIVE aus stripe_ambassador_commissions (SSOT),
        //    NICHT aus profile_modules.ambassador.revenue_generated (stale JSON, wird nie synchronisiert).
        let liveEarnings = 0;
        try {
          const { data: fullStats } = await supabase.rpc("rpc_get_ambassador_full_stats", { p_ambassador_id: uid });
          liveEarnings = Number(fullStats?.lifetime_earnings_eur) || 0;
        } catch (e) {
          console.warn("rpc_get_ambassador_full_stats fehlgeschlagen, Fallback 0:", e);
        }

        setAmbData({
          level:    computedLevel,
          ref_link: refLink,
          in_window_count: inWindow.length,
          total_referred:  users.length,
        });
        setAllUsers(users);
        setEarnings(liveEarnings);
        setActiveList(activeUsers);
        setSleepingList(sleepingUsers);
      } catch(e) {
        console.warn("AmbassadorStudio load:", e);
      }
      clearTimeout(loadTimeout);
      setLoading(false);
    })();
  }, [uid]);

  // ── Realtime: wenn ein neuer User über den Ref-Link kommt → sofort neu laden
  useEffect(() => {
    if (!uid || !isAmb) return;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = `referral-watch-${uid}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let channel = existing;
    let createdHere = false;
    if (!existing) {
      channel = supabase
        .channel(topic)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `referred_by=eq.${uid}`,
        }, () => {
          // Neuen Referral erkannt → Daten neu laden
          supabase
            .from("profiles")
            .select("id,display_name,username,first_transaction_at,referred_by")
            .eq("referred_by", uid)
            .then(({ data }) => {
              const users = data || [];
              setAllUsers(users);
              setActiveList(users.filter(u => u.first_transaction_at != null));
              setSleepingList(users.filter(u => u.first_transaction_at == null));
            });
        })
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(channel); };
  }, [uid, isAmb]);

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
  const active   = activeList.length;
  const sleeping = sleepingList.length;

  const listUsers = {
    geworbene:  allUsers,
    aktive:     activeList,
    schlafende: sleepingList,
  };

  // ── Nicht-Ambassador: CTA ─────────────────────────────────────
  if (!isAmb) {
    return (
      <>
        <div style={{ padding:"16px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <HUIVerifIcon size={22} style={{color:"rgba(245,158,11,0.8)"}} />
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
            { emoji:<HUIGemeinschaftIcon size={16}/>, label:"Geworbene",  count: referred, key:"geworbene"  },
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
          {/* COM-MIGRATION-015.3: Provision ist jetzt wieder levelabhaengig (5/10/15/20%),
              berechnet aus dem Unternehmensanteil (85% der 15%-Gebuehr), siehe rpc_process_order_fees. */}
          <div>{(provisionRate(level)*100).toFixed(0)}% Provision</div>
          <div style={{ marginTop:2 }}>pro Transaktion, 365 Tage</div>
          {ambData?.total_referred > 0 && (
            <div style={{ marginTop:4, color: T.teal, fontWeight:600 }}>
              {ambData.in_window_count}/{ambData.total_referred} noch aktiv
            </div>
          )}
        </div>
      </div>

      {/* Auszahlung (AMB-PAYOUT-009) */}
      <div style={{ margin:"0 14px 16px" }}>
        <AmbassadorPayoutPanel ambassadorId={uid} />
      </div>

      {/* Einladungslink */}
      <div style={{ margin:"0 14px 16px" }}>
        <div style={{ fontSize:11, color:T.inkFaint, fontWeight:600, marginBottom:6,
          display:"flex", alignItems:"center", gap:5 }}>
          <span style={{display:"flex",alignItems:"center",gap:6}}><HUILinkIcon size={14}/> Dein persönlicher Einladungslink</span>
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

      {/* Einladungen verwalten — Row */}
      <div style={{ margin:"0 14px 16px" }}>
        <button
          onClick={() => setShowEinladungen(true)}
          style={{
            width:"100%", display:"flex", alignItems:"center", gap:12,
            padding:"13px 16px", borderRadius:T.r12,
            background:"#fff", border:`1px solid ${T.border}`,
            cursor:"pointer", fontFamily:"inherit", textAlign:"left",
            boxShadow:"0 1px 4px rgba(26,26,24,0.05)",
            transition:"border-color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,196,184,0.40)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          <span style={{
            width:34, height:34, borderRadius:9, flexShrink:0,
            background:"rgba(14,196,184,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
          }}>✉️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.ink }}>Einladungen verwalten</div>
            <div style={{ fontSize:11, color:T.inkFaint, marginTop:1 }}>
              {allUsers.length > 0 ? `${allUsers.length} eingeladene Nutzer` : "Wer hat sich über deinen Link registriert?"}
            </div>
          </div>
          <span style={{ fontSize:16, color:T.inkFaint }}>›</span>
        </button>
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

      {/* Einladungen Modal */}
      {showEinladungen && (
        <EinladungenModal
          ambassadorId={uid}
          username={profile?.username}
          onClose={() => setShowEinladungen(false)}
        />
      )}
    </>
  );
}



// ═══════════════════════════════════════════════════════════════
// EinladungenModal — "Einladungen verwalten"
// Zeigt alle Nutzer die sich über den Ref-Link des Ambassadors registriert haben
// Quelle: profiles WHERE referred_by = ambassador.id
// Kein Löschen, kein Mutieren — nur lesen + navigieren
// ═══════════════════════════════════════════════════════════════
function EinladungenModal({ ambassadorId, username, onClose }) {
  const { openProfileById } = useHome();
  const [invited, setInvited] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ambassadorId) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views") // Identity Contract v1.0
          .eq("referred_by", ambassadorId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (active) setInvited(data || []);
      } catch(e) {
        console.warn("[Einladungen] Fehler:", e);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [ambassadorId]);

  const navigateTo = (userId, uname) => {
    if (!userId && !uname) { alert("Profil nicht mehr verfügbar."); return; }
    onClose();
    if (userId) {
      openProfileById(userId);
    } else {
      window.history.pushState({}, "", `/profile/${uname}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:25000, // über allen bekannten Menü-/Notification-Layern (Studio 9600-10800, NotificationPanel 10000-19600, StoryReactionTray 23000) — unter Toast (29000)
      background:"rgba(26,26,24,0.55)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)",
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:"#F7F5F0", borderRadius:"20px 20px 0 0",
        maxHeight:"88vh", display:"flex", flexDirection:"column",
        paddingBottom:88,
      }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 20px 14px",
          borderBottom:"1px solid rgba(26,26,24,0.08)",
          flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:"#1A1A18", letterSpacing:"-0.02em" }}>
              ✉️ Einladungen verwalten
            </div>
            <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)", marginTop:2 }}>
              {loading ? "Lade…" : `${invited.length} eingeladene Nutzer`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", borderRadius:10,
            width:34, height:34, cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        </div>

        {/* Liste */}
        <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, padding:"12px 16px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(26,26,24,0.4)", fontSize:13 }}>
              Lade Einladungen…
            </div>
          ) : invited.length === 0 ? (
            <div style={{ textAlign:"center", padding:"50px 20px" }}>
              <div style={{ marginBottom:12, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.7)" }}><HUIMailIcon size={36}/></div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1A1A18", marginBottom:6 }}>
                Noch keine Einladungen
              </div>
              <div style={{ fontSize:13, color:"rgba(26,26,24,0.45)", lineHeight:1.6 }}>
                Teile deinen persönlichen Link<br/>
                <span style={{ fontFamily:"monospace", color:"#0EC4B8" }}>
                  be-hui.com/{username || "…"}
                </span><br/>
                um Nutzer einzuladen.
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {invited.map(u => {
                const name = u.display_name || u.full_name || u.username || "Unbekannt";
                const initials = name.slice(0,2).toUpperCase();
                const date = u.created_at
                  ? new Date(u.created_at).toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" })
                  : "–";

                return (
                  <div
                    key={u.id}
                    onClick={() => navigateTo(u.id, u.username)}
                    style={{
                      background:"#fff", borderRadius:14,
                      border:"1px solid rgba(26,26,24,0.08)",
                      padding:"14px 16px",
                      display:"flex", alignItems:"center", gap:14,
                      boxShadow:"0 1px 4px rgba(26,26,24,0.05)",
                      cursor: u.username ? "pointer" : "default",
                      transition:"transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                    }}
                    onMouseEnter={e => {
                      if (!u.username) return;
                      e.currentTarget.style.transform = "scale(1.015)";
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,196,184,0.20)";
                      e.currentTarget.style.borderColor = "rgba(14,196,184,0.40)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 1px 4px rgba(26,26,24,0.05)";
                      e.currentTarget.style.borderColor = "rgba(26,26,24,0.08)";
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width:46, height:46, borderRadius:"50%",
                      background:"rgba(14,196,184,0.12)",
                      border:"2px solid rgba(14,196,184,0.25)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      overflow:"hidden", fontSize:15, fontWeight:700, color:"#0EC4B8",
                      flexShrink:0,
                    }}>
                      {u.avatar_url
                        ? <img loading="lazy" decoding="async" src={u.avatar_url} alt={initials} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        : initials
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#1A1A18", marginBottom:2,
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {name}
                      </div>
                      {u.email && (
                        <div style={{ fontSize:12, color:"rgba(26,26,24,0.50)", marginBottom:1,
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {u.email}
                        </div>
                      )}
                      {u.phone && (
                        <div style={{ fontSize:12, color:"rgba(26,26,24,0.50)", marginBottom:1 }}>
                          {u.phone}
                        </div>
                      )}
                      <div style={{ fontSize:11, color:"rgba(26,26,24,0.35)", marginTop:2 }}>
                        Registriert: {date}
                      </div>
                    </div>

                    {/* Kontakt-Buttons + Pfeil */}
                    <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0, alignItems:"flex-end" }}>
                      {u.email && (
                        <a href={`mailto:${u.email}`}
                          onClick={e => e.stopPropagation()}
                          style={{
                            padding:"4px 10px", borderRadius:20,
                            background:"rgba(14,196,184,0.10)",
                            fontSize:11, fontWeight:600, color:"#0EC4B8",
                            textDecoration:"none", display:"block",
                          }}>✉️ Mail</a>
                      )}
                      {u.phone && (
                        <a href={`tel:${u.phone}`}
                          onClick={e => e.stopPropagation()}
                          style={{
                            padding:"4px 10px", borderRadius:20,
                            background:"rgba(14,196,184,0.10)",
                            fontSize:11, fontWeight:600, color:"#0EC4B8",
                            textDecoration:"none", display:"block",
                          }}>📞 Anruf</a>
                      )}
                      {u.username && (
                        <span style={{ fontSize:16, color:"rgba(14,196,184,0.55)", fontWeight:600 }}>›</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


export default AmbassadorStudioSection;

// chat-center/ChatCenterOverlay.jsx
// HUI Resonanz Center — vereinfachter Renderpfad
// Wenn activeConv: zeige ConversationRoom. Sonst: zeige Liste.
// Keine opacity-Tricks, keine doppelten Layer, keine Animation-Gates.

import React, { useState, useEffect } from "react";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { createPortal } from "react-dom";
import ChatAtmosphere  from "./ChatAtmosphere.jsx";
import ConversationList from "./ConversationList.jsx";
import ConversationRoom from "./ConversationRoom.jsx";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useChatList, findOrCreateChat, deleteChat } from "../../lib/chatContext.js";
import AppointmentViewer from "./AppointmentViewer.jsx";
import PeopleSearch from "../discovery/PeopleSearch.jsx";
import { HUI } from "../../design/hui.design.js";
import { getFullDisplayName } from "../../lib/profileUtils.js";
import { registerModal } from "../../lib/backButtonRegistry.js";

const C = { teal: HUI.COLOR.teal, teal2: HUI.COLOR.tealDeep, ink: HUI.COLOR.ink, muted: "rgba(80,80,80,0.50)" };

const CSS = `
  @keyframes hui-spin { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .hui-scroll {
    scrollbar-width: none; -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
  }
  .hui-scroll::-webkit-scrollbar { display: none; }
`;

/* ── Compose Button ── */
function ComposeBtn({ onClick = () => {} }) {
  return (
    <button onClick={() => onClick?.()} style={{
      width: 40, height: 40, borderRadius: "50%",
      background: `linear-gradient(135deg,${C.teal},${C.teal2})`,
      border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 14px rgba(22,215,197,0.32)`,
      WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

/* ── LIST PANEL ── */
function ListPanel({ onClose, onOpen, chats, loading, onDiscoverClose, onCompose, pendingRecipient, onOpenPending, connections, onOpenProfile }) {
  const [search, setSearch] = React.useState("");
  // iOS tap-through guard: ignoriere clicks auf ← in den ersten 400ms nach Mount
  const mountedAt = React.useRef(Date.now());
  function safeClose() {
    const age = Date.now() - mountedAt.current;
    if (import.meta.env.DEV) {
    }
    if (age < 400) return; // iOS ghost-click guard
    onClose?.();
  }
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10500,
      display: "flex", flexDirection: "column",
      background: "rgba(242,244,248,1)",
      fontFamily: "Inter,sans-serif",
    }}>
      <style>{CSS}</style>
      <ChatAtmosphere dark={false}/>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "max(var(--hui-safe-top, 0px),52px,env(safe-area-inset-top,52px)) 20px 0",
        background: "rgba(242,244,248,0.96)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        borderBottom: "1px solid rgba(22,215,197,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={safeClose} style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(22,215,197,0.09)", border: "1.5px solid rgba(22,215,197,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.teal, fontSize: 18,
            WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: -0.5 }}>
              Nachrichten
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
              Echte Gespräche. Echte Verbindung.
            </div>
          </div>
          <ComposeBtn onClick={onCompose}/>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "rgba(255,255,255,0.72)",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14, padding: "9px 14px", marginBottom: 14,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={C.muted} strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Namen, Projekten…"
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 13.5, color: C.ink, fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* List */}
      <div className="hui-scroll" style={{ flex: 1, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>

        {/* ── Pending Recipient Banner ── */}
        {pendingRecipient?.id && onOpenPending && (
          <div
            onClick={onOpenPending}
            style={{
              margin:"12px 16px 4px",
              padding:"14px 16px",
              borderRadius:16,
              background:"linear-gradient(135deg,rgba(22,215,197,0.12),rgba(22,215,197,0.06))",
              border:"1.5px solid rgba(22,215,197,0.28)",
              display:"flex", alignItems:"center", gap:12,
              cursor:"pointer",
              WebkitTapHighlightColor:"transparent",
            }}
          >
            <div style={{
              width:40, height:40, borderRadius:"50%", flexShrink:0,
              background: pendingRecipient.avatar_url
                ? `url(${pendingRecipient.avatar_url}) center/cover no-repeat`
                : "linear-gradient(135deg,#16D7C5,#0ea3c2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, color:"white", fontWeight: 600,
            }}>
              {!pendingRecipient.avatar_url && (pendingRecipient.display_name?.[0] || "?")}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight: 600, color:"#1a1a18" }}>
                Gespräch mit {pendingRecipient.display_name || "diesem Talent"} beginnen
              </div>
              <div style={{ fontSize:12, color:"rgba(80,80,80,0.6)", marginTop:2 }}>
                Tippe hier um direkt zu schreiben →
              </div>
            </div>
          </div>
        )}

        <ConversationList
          chats={chats}
          loading={loading}
          onOpen={onOpen}
          onDiscover={onDiscoverClose}
          connections={connections || []}
          onOpenProfile={onOpenProfile}
          search={search}
        />
      </div>
    </div>
  );
}

/* ── HAUPT-OVERLAY ── */
export default function ChatCenterOverlay({ onClose = () => {}, initialRecipient = null, onDiscoverClose = () => {}, onMarkRead = () => {} }) {
  if (import.meta.env.DEV) {
  }
  const [activeConv,       setActiveConv]       = useState(null);
  const [showPeopleSearch,  setShowPeopleSearch]  = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [appointmentsUserId, setAppointmentsUserId]  = useState(null);
  const [loadingConv,      setLoadingConv]      = useState(false);

  const { openCreatorProfile } = useProfileLauncher();
  const { user } = useAuth();

  const { chats: rawChats, loading } = useChatList("cco");
  // Lokal geschlossene Chats (bis nächstem Reload)
  const [closedChatIds, setClosedChatIds] = React.useState(new Set());
  const chats = React.useMemo(
    () => (rawChats || []).filter(ch => !closedChatIds.has(ch?.id)),
    [rawChats, closedChatIds]
  );

  // ── Neueste Verbindungen — echte Chat-Partner, chronologisch (neueste zuerst) ──
  // Vorher: gegenseitige Follows (falsche Datenquelle — bestehende Chat-Partner wie
  // Linda/Meyer fehlten dadurch komplett). Jetzt: abgeleitet aus den tatsächlichen
  // Konversationen, sortiert nach last_message_at absteigend, dedupliziert pro Person.
  const connections = React.useMemo(() => {
    const sorted = [...chats].sort((a, b) =>
      new Date(b?.last_message_at || b?.opened_at || 0) -
      new Date(a?.last_message_at || a?.opened_at || 0)
    );
    const seen = new Set();
    const list = [];
    for (const c of sorted) {
      const other = c?.other_profile;
      if (!other?.id || seen.has(other.id)) continue;
      seen.add(other.id);
      list.push({
        id:         other.id,
        name:       getFullDisplayName(other) || "?",
        avatar_url: other.avatar_url    || null,
      });
    }
    return list.slice(0, 20);
  }, [chats]);



  const [pendingRecipient, setPendingRecipient] = React.useState(initialRecipient || null);

  // AUTO-OPEN: initialRecipient beim Mount vorhanden → direkt ConversationRoom öffnen.
  // Fallback auf Banner-Tap wenn user?.id noch nicht verfügbar.
  React.useEffect(() => {
    if (!initialRecipient?.id) return;
    if (!user?.id) {
      setPendingRecipient(initialRecipient);
      return;
    }
    setLoadingConv(true);
    findOrCreateChat({
      userId:      user.id,
      otherUserId: initialRecipient.id,
      chatType:    "direct",
    }).then(chatRecord => {
      if (!chatRecord?.id) { setPendingRecipient(initialRecipient); return; }
      setActiveConv({
        id:           chatRecord.id,
        user_id:      initialRecipient.id           || null,
        name:         getFullDisplayName(initialRecipient) || "Creator",
        avatar_url:   initialRecipient.avatar_url   || null,
        talent:       initialRecipient.talent        || null,
        has_talent_profile: initialRecipient.has_talent_profile || false,
        online:       true,
      });
    }).catch(() => {
      setPendingRecipient(initialRecipient);
    }).finally(() => {
      setLoadingConv(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openPendingChat() {
    if (!pendingRecipient?.id || !user?.id) return;
    setPendingRecipient(null);
    setLoadingConv(true);
    findOrCreateChat({
      userId:      user.id,
      otherUserId: pendingRecipient.id,
      chatType:    "direct",
    }).then(chatRecord => {
      if (!chatRecord?.id) return;
      setActiveConv({
        id:           chatRecord.id,
        user_id:      pendingRecipient.id           || null,
        name:         getFullDisplayName(pendingRecipient) || "Creator",
        avatar_url:   pendingRecipient.avatar_url   || null,
        talent:       pendingRecipient.talent        || null,
        has_talent_profile: pendingRecipient.has_talent_profile || false,
        online:       true,
      });
    }).catch(err => {
      console.error("[HUI_CHAT] findOrCreateChat error:", err?.message);
    }).finally(() => {
      setLoadingConv(false);
    });
  }

  function openConv(rawConv) {
    const realId = rawConv?.id;
    if (!realId) return;
    const other = rawConv.other_profile || {};
    setActiveConv({
      id:                 realId,
      user_id:            other.id || rawConv.user_id || null,
      name:               getFullDisplayName(rawConv.other_profile) || rawConv.name || "Gespräch",
      avatar_url:         rawConv.avatar_url || other.avatar_url || null,
      talent:             rawConv.talent || (other.focus_type && other.focus_type !== "public" ? other.focus_type : null) || null,
      has_talent_profile: other.has_talent_profile || rawConv.has_talent_profile || false,
      online:             rawConv.online ?? true,
      last_message:       rawConv.last_message,
      other_profile:      rawConv.other_profile || null,
    });
    // Phase 8: Chat als gelesen markieren — aktualisiert unread_count + Header Badge
    if (onMarkRead) onMarkRead(realId);
  }

  // ── Ladescreen ──
  
  // ── Android Back-Button: Chat bei Back-Taste zur Übersicht (nicht Main-Menu) ──
  // Wenn ein ConversationRoom offen ist → Back geht zur Chat-Liste (nicht Exit).
  // Wenn nur das Chat-Overlay offen ist → Back schließt das Overlay.
  useEffect(() => {
    if (activeConv) {
      // ConversationRoom offen → Back geht zur Chat-Übersicht
      return registerModal(() => setActiveConv(null), "chat-conversation");
    }
    // Nur Chat-Overlay (Liste) offen → Back schließt das ganze Overlay
    return registerModal(() => onClose(), "chat-overlay");
  }, [activeConv]); // eslint-disable-line react-hooks/exhaustive-deps

if (loadingConv && !activeConv) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10500,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(249,247,244,0.98)",
        fontFamily: "Inter,sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "3px solid rgba(22,215,197,0.2)",
            borderTop: "3px solid #16D7C5",
            animation: "hui-spin 0.9s linear infinite",
            margin: "0 auto 12px",
          }}/>
          <style>{`@keyframes hui-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 13, color: "#999" }}>Verbindung wird vorbereitet…</div>
        </div>
      </div>
    );
  }

  // ── ConversationRoom ──
  if (activeConv) {
    return createPortal(
      <>
        <ConversationRoom
          conv={activeConv}
          onBack={() => setActiveConv(null)}
          onOpenProfile={(conv) => {
            // user_id ist die Supabase Auth UUID des Gesprächspartners
            // conv.id ist die Chat-ID — NIEMALS als Profil-ID verwenden
            const userId = conv?.user_id || conv?.other_profile?.id;
            if (!userId) return;
            // openCreatorProfile → A.OPEN_PROFILE → openProfileById → ProfileLauncher
            openCreatorProfile(userId, {
              display_name: conv?.name,
              avatar_url:   conv?.avatar_url,
              talent:       conv?.talent,
            });
          }}
          onRequestBooking={(conv) => {
            const userId = conv?.user_id || conv?.other_profile?.id;
            if (!userId) return;
            setAppointmentsUserId(userId);
            setShowAppointments(true);
          }}
          onCloseChat={async () => {
            if (!activeConv?.id || !user?.id) {
              setActiveConv(null);
              return;
            }
            const result = await deleteChat(activeConv.id, user.id);
            if (result?.error) {
              console.error("[deleteChat] Fehler:", result.error);
              // Trotz Fehler lokal entfernen, damit der Nutzer nicht stecken bleibt
            }
            setClosedChatIds(prev => new Set([...prev, activeConv.id]));
            setActiveConv(null);
          }}
        />

        {/* ── AppointmentViewer — zeigt vorhandene Termine mit dem Chat-Partner ── */}
        {showAppointments && appointmentsUserId && (
          <AppointmentViewer
            otherUserId={appointmentsUserId}
            otherName={getFullDisplayName(activeConv?.other_profile) || activeConv?.name || ""}
            onClose={() => {
              setShowAppointments(false);
              setAppointmentsUserId(null);
            }}
          />
        )}
      </>,
      document.body
    );
  }

  // ── Liste + People Search ──
  return createPortal(
    <>
      {showPeopleSearch ? (
        <PeopleSearch
          onClose={() => setShowPeopleSearch(false)}
          onOpenProfile={(profile) => {
            setShowPeopleSearch(false);
            const userId = profile?.id || profile?.user_id;
            if (userId) openCreatorProfile(userId, {
              display_name: profile?.display_name,
              avatar_url:   profile?.avatar_url,
              talent:       profile?.talent,
            });
          }}
          onOpenChat={(profile) => {
            setShowPeopleSearch(false);
            if (!profile?.id || !user?.id) return;
            setLoadingConv(true);
            findOrCreateChat({
              userId:      user.id,
              otherUserId: profile.id,
              chatType:    "direct",
            }).then(chatRecord => {
              if (!chatRecord?.id) return;
              setActiveConv({
                id:                 chatRecord.id,
                user_id:            profile.id                   || null,
                name:               getFullDisplayName(profile)         || "Creator",
                avatar_url:         profile.avatar_url           || null,
                talent:             profile.talent               || null,
                has_talent_profile: profile.has_talent_profile   || false,
                online:             true,
              });
            }).catch(err => {
              console.error("[HUI_CHAT] findOrCreateChat error:", err?.message);
            }).finally(() => {
              setLoadingConv(false);
            });
          }}
        />
      ) : (
        <ListPanel
          onClose={onClose}
          onOpen={openConv}
          onCompose={() => { setShowPeopleSearch(true); }}
          chats={chats}
          loading={loading}
          onDiscoverClose={onDiscoverClose}
          pendingRecipient={pendingRecipient}
          onOpenPending={openPendingChat}
          connections={connections}
          onOpenProfile={(person) => {
            // Klick auf eine "Neueste Verbindungen"-Bubble → Profil öffnen
            // openCreatorProfile → A.OPEN_PROFILE → openProfileById → ProfileLauncher
            const userId = person?.id;
            if (!userId) return;
            openCreatorProfile(userId, {
              display_name: person?.name,
              avatar_url:   person?.avatar_url,
            });
          }}
        />
      )}
    </>,
    document.body
  );
}
// chat-center/ChatCenterOverlay.jsx
// HUI Resonanz Center — vereinfachter Renderpfad
// Wenn activeConv: zeige ConversationRoom. Sonst: zeige Liste.
// Keine opacity-Tricks, keine doppelten Layer, keine Animation-Gates.

import React, { useState } from "react";
import ChatAtmosphere  from "./ChatAtmosphere.jsx";
import ConversationList from "./ConversationList.jsx";
import ConversationRoom from "./ConversationRoom.jsx";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useChatList, findOrCreateChat } from "../../lib/chatContext.js";
import PeopleSearch from "../discovery/PeopleSearch.jsx";
import { HUI } from "../../design/hui.design.js";

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
function ComposeBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
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
function ListPanel({ onClose, onOpen, chats, loading, onDiscoverClose, onCompose }) {
  const [search, setSearch] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10001,
      display: "flex", flexDirection: "column",
      background: "rgba(242,244,248,1)",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <style>{CSS}</style>
      <ChatAtmosphere dark={false}/>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "max(52px,env(safe-area-inset-top,52px)) 20px 0",
        background: "rgba(242,244,248,0.96)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        borderBottom: "1px solid rgba(22,215,197,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={onClose} style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(22,215,197,0.09)", border: "1.5px solid rgba(22,215,197,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.teal, fontSize: 18,
            WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: -0.5 }}>
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
      <div className="hui-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {/* ── CCO MARKER ── */}
        <div style={{
          background:"#00001a", color:"#4488ff", fontFamily:"monospace",
          fontSize:10, padding:"3px 10px", flexShrink:0,
        }}>[CHATCENTEROVERLAY→LISTPANEL] chats={String((chats||[]).length)} loading={String(loading)}</div>
        <ConversationList
          chats={chats}
          loading={loading}
          onOpen={onOpen}
          onDiscover={onDiscoverClose}
        />
      </div>
    </div>
  );
}

/* ── HAUPT-OVERLAY ── */
export default function ChatCenterOverlay({ onClose, initialRecipient = null, onDiscoverClose }) {
  const [activeConv,       setActiveConv]       = useState(null);
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const [loadingConv,      setLoadingConv]      = useState(false);

  const { openCreatorProfile } = useProfileLauncher();
  const { user } = useAuth();
  const { chats, loading } = useChatList(user?.id);

  // CCO_STATE — feuert bei Mount und bei jedem initialRecipient-Change
  React.useEffect(() => {
  }, [initialRecipient?.id, activeConv?.id, loadingConv]);

  // initialRecipient → Chat direkt öffnen
  React.useEffect(() => {
    if (!initialRecipient?.id || !user?.id) return;
    if (activeConv) return;
    setLoadingConv(true);
    findOrCreateChat({
      userId:      user.id,
      otherUserId: initialRecipient.id,
      chatType:    "direct",
    }).then(chatRecord => {
      if (!chatRecord?.id) return;
      setActiveConv({
        id:         chatRecord.id,
        name:       initialRecipient.display_name || "Creator",
        avatar_url: initialRecipient.avatar_url   || null,
        talent:     initialRecipient.talent        || null,
        online:     true,
      });
    }).catch(err => {
      console.error("[HUI_CHAT] findOrCreateChat error:", err?.message);
    }).finally(() => {
      setLoadingConv(false);
    });
  }, [initialRecipient?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function openConv(rawConv) {
    const realId = rawConv?.id;
    if (!realId) return;
    const other = rawConv.other_profile || {};
    setActiveConv({
      id:          realId,
      name:        rawConv.name || other.display_name || "Gespräch",
      avatar_url:  rawConv.avatar_url || other.avatar_url || null,
      talent:      rawConv.talent || other.focus_type || null,
      online:      rawConv.online ?? true,
      last_message: rawConv.last_message,
      other_profile: rawConv.other_profile || null,
    });
  }

  // ── Ladescreen ──
  if (loadingConv && !activeConv) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10001,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(249,247,244,0.98)",
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
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
    return (
      <ConversationRoom
        conv={activeConv}
        onBack={() => setActiveConv(null)}
        onOpenProfile={(conv) => {
          const userId = conv?.user_id || conv?.id;
          if (userId) openCreatorProfile(userId, {
            display_name: conv?.name,
            avatar_url:   conv?.avatar_url,
            talent:       conv?.talent,
          });
        }}
      />
    );
  }

  // ── Liste + People Search ──
  return (
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
                id:         chatRecord.id,
                name:       profile.display_name || "Creator",
                avatar_url: profile.avatar_url   || null,
                talent:     profile.talent        || null,
                online:     true,
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
          onCompose={() => setShowPeopleSearch(true)}
          chats={chats}
          loading={loading}
          onDiscoverClose={onDiscoverClose}
        />
      )}
    </>
  );
}

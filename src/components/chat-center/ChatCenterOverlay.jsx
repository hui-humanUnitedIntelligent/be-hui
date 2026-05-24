// chat-center/ChatCenterOverlay.jsx v3
// HUI Resonanz Center — Screenshot-exact nach iPad Design
// Links: Liste — Rechts: Chat Room (iPad split view)
// Mobile: fullscreen, Room slides over
//
// zIndex: 9400 — single chat entry point

import React, { useState } from "react";
import ChatAtmosphere  from "./ChatAtmosphere.jsx";
import ConversationList from "./ConversationList.jsx";
import ConversationRoom from "./ConversationRoom.jsx";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useChatList, findOrCreateChat }  from "../../lib/chatContext.js";
import PeopleSearch from "../discovery/PeopleSearch.jsx";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.50)" };

const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  .hui-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .hui-scroll::-webkit-scrollbar { display:none; }
  @keyframes cc-in {
    from{opacity:0;transform:translateY(22px);}
    to{opacity:1;transform:translateY(0);}
  }
  @keyframes cc-room-in {
    from{opacity:0;transform:translateX(24px);}
    to{opacity:1;transform:translateX(0);}
  }
`;

/* ── Compose Button ── */
function ComposeBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width:40, height:40, borderRadius:"50%",
      background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
      border:"none", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:`0 4px 14px rgba(22,215,197,0.32)`,
      WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

/* ── LIST PANEL ── */
function ListPanel({ onClose, onOpen, chats, loading, activeId, onDiscoverClose, onCompose }) {
  const [search, setSearch] = useState("");

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100%", position:"relative",
      flex:"none", width:"100%",
      // iPad: Breite 360px
    }}>
      <ChatAtmosphere dark={false}/>

      {/* Header */}
      <div style={{
        position:"relative", zIndex:2, flexShrink:0,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
        background:"rgba(242,244,248,0.92)",
        backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
        borderBottom:"1px solid rgba(22,215,197,0.08)",
      }}>
        {/* Top Row */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={onClose} style={{
            width:38, height:38, borderRadius:"50%",
            background:"rgba(22,215,197,0.09)", border:"1.5px solid rgba(22,215,197,0.18)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:C.teal, fontSize:18,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            transition:"transform 0.14s",
          }}
          onTouchStart={e=>e.currentTarget.style.transform="scale(0.90)"}
          onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
          >←</button>

          <div style={{ flex:1 }}>
            <div style={{ fontSize:22, fontWeight:900, color:C.ink, letterSpacing:-0.5 }}>
              Nachrichten
              <span style={{
                fontSize:13, color:C.teal, fontWeight:700,
                marginLeft:7, verticalAlign:"middle",
              }}>·</span>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
              Echte Gespr\u00e4che. Echte Verbindung.
            </div>
          </div>

          <ComposeBtn onClick={onCompose}/>
        </div>

        {/* Search */}
        <div style={{
          display:"flex", alignItems:"center", gap:9,
          background:"rgba(255,255,255,0.72)",
          border:"1px solid rgba(0,0,0,0.07)",
          borderRadius:14, padding:"9px 14px",
          marginBottom:14,
          backdropFilter:"blur(12px)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={C.muted} strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Namen, Projekten, Orten\u2026"
            style={{
              flex:1, border:"none", background:"none", outline:"none",
              fontSize:13.5, color:C.ink, fontFamily:"inherit",
            }}
          />
        </div>
      </div>

      {/* List Content */}
      <div className="hui-scroll" style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        position:"relative", zIndex:1,
      }}>
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

/* ══════════════════════════════════════════════════════════════
   HAUPT-OVERLAY
══════════════════════════════════════════════════════════════ */
export default function ChatCenterOverlay({ onClose, initialRecipient = null, onDiscoverClose }) {
  const [activeConv, setActiveConv] = useState(null);
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const { openCreatorProfile } = useProfileLauncher();
  const { user } = useAuth();

  // Phase 3: Wenn von Profil aus geöffnet → echten Chat in DB finden/erstellen
  React.useEffect(() => {
    if (!initialRecipient?.id || activeConv) return;
    const recipientId = initialRecipient.id;

    if (user?.id) {
      // Echten Chat-Record holen oder erstellen
      findOrCreateChat({
        userId:      user.id,
        otherUserId: recipientId,
        chatType:    "direct",
      }).then(chatRecord => {
        setActiveConv({
          id:         chatRecord?.id || `direct_${recipientId}`,
          name:       initialRecipient.display_name || "Creator",
          avatar_url: initialRecipient.avatar_url   || null,
          talent:     initialRecipient.talent        || null,
          mood:       "Echte Verbindung",
          online:     true,
          _recipientId: recipientId,
        });
      }).catch(() => {
        // Fallback: UI funktioniert weiter, aber ohne Persistenz
        setActiveConv({
          id:         `direct_${recipientId}`,
          name:       initialRecipient.display_name || "Creator",
          avatar_url: initialRecipient.avatar_url   || null,
          talent:     initialRecipient.talent        || null,
          mood:       "Echte Verbindung",
          online:     true,
          _recipientId: recipientId,
        });
      });
    } else {
      // User noch nicht geladen — temporäre Conv
      setActiveConv({
        id:         `direct_${recipientId}`,
        name:       initialRecipient.display_name || "Creator",
        avatar_url: initialRecipient.avatar_url   || null,
        talent:     initialRecipient.talent        || null,
        mood:       "Echte Verbindung",
        online:     true,
        _recipientId: recipientId,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  const { chats, loading, unreadTotal } = useChatList();

  // Wenn Conv geöffnet: normalize conv shape
  function openConv(rawConv) {
    const other = rawConv.other_profile || {};
    setActiveConv({
      id:         rawConv.id,
      name:       rawConv.name || other.display_name || "Gespr\u00e4ch",
      avatar_url: rawConv.avatar_url || other.avatar_url || null,
      talent:     rawConv.talent || other.focus_type || null,
      mood:       rawConv.mood || (other.availability === "busy" ? "Gerade kreativ im Studio" : "Im Atelier"),
      online:     rawConv.online ?? true,
      last_message: rawConv.last_message,
    });
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9400,
      display:"flex", overflow:"hidden",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      animation:"cc-in 0.22s ease both",
    }}>
      <style>{CSS}</style>

      {/* ── LIST PANEL ── */}
      <div style={{
        flex:1, minWidth:0,
        display:"flex", flexDirection:"column",
        // Mobile: wenn Conv offen → versteckt
        opacity: activeConv ? 0 : 1,
        pointerEvents: activeConv ? "none" : "auto",
        transition:"opacity 0.18s ease",
        position:"relative",
      }}>
        <ListPanel
          onClose={onClose}
          onOpen={openConv}
          onCompose={() => setShowPeopleSearch(true)}
          chats={chats}
          loading={loading}
          activeId={activeConv?.id}
          onDiscoverClose={onDiscoverClose}
        />
      </div>

      {/* ── PEOPLE SEARCH — direkte Suche nach Menschen ── */}
      {showPeopleSearch && (
        <PeopleSearch
          onClose={() => setShowPeopleSearch(false)}
          onOpenProfile={(profile) => {
            setShowPeopleSearch(false);
            // Profil über ProfileLauncher öffnen
            const userId = profile?.id || profile?.user_id;
            if (userId) openCreatorProfile(userId, {
              display_name: profile?.display_name,
              avatar_url:   profile?.avatar_url,
              talent:       profile?.talent,
            });
          }}
          onOpenChat={(profile) => {
            setShowPeopleSearch(false);
            console.log("[HUI_DISCOVERY] direct message entry:", profile?.display_name);
            // direkt Chat öffnen
            if (profile?.id && user?.id) {
              findOrCreateChat({
                userId:      user.id,
                otherUserId: profile.id,
                chatType:    "direct",
              }).then(chatRecord => {
                setActiveConv({
                  id:         chatRecord?.id || `direct_${profile.id}`,
                  name:       profile.display_name || "Creator",
                  avatar_url: profile.avatar_url || null,
                  talent:     profile.talent || null,
                  mood:       "Echte Verbindung",
                  online:     true,
                });
              }).catch(() => {
                setActiveConv({
                  id:         `direct_${profile.id}`,
                  name:       profile.display_name || "Creator",
                  avatar_url: profile.avatar_url || null,
                  talent:     profile.talent || null,
                  mood:       "Echte Verbindung",
                  online:     true,
                });
              });
            }
          }}
        />
      )}

      {/* ── ROOM PANEL — slides in über Liste auf Mobile ── */}
      {activeConv && (
        <div style={{
          position:"absolute", inset:0, zIndex:2,
          animation:"cc-room-in 0.22s ease both",
        }}>
          <ConversationRoom
            conv={activeConv}
            onBack={() => setActiveConv(null)}
            onOpenProfile={(conv) => {
              // Phase 23: Chat → Profil öffnen
              // Chat schließt sich, Profil öffnet sich
              const userId = conv?.user_id || conv?.id;
              if (userId) openCreatorProfile(userId, {
                display_name: conv?.name,
                avatar_url:   conv?.avatar_url,
                talent:       conv?.talent,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}

// chat-center/ChatCenterOverlay.jsx
// HUI Resonanz Center — vereinfachter Renderpfad
// Wenn activeConv: zeige ConversationRoom. Sonst: zeige Liste.
// Keine opacity-Tricks, keine doppelten Layer, keine Animation-Gates.

import React, { useState, useEffect } from "react";
import ChatAtmosphere  from "./ChatAtmosphere.jsx";
import ConversationList from "./ConversationList.jsx";
import ConversationRoom from "./ConversationRoom.jsx";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useChatList, findOrCreateChat } from "../../lib/chatContext.js";
import { ProfileService } from '../../services/db';
import { supabase } from "../../lib/supabaseClient.js";
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
function ListPanel({ onClose, onOpen, chats, loading, onDiscoverClose, onCompose, pendingRecipient, onOpenPending, connections }) {
  const [search, setSearch] = React.useState("");
  // iOS tap-through guard: ignoriere clicks auf ← in den ersten 400ms nach Mount
  const mountedAt = React.useRef(Date.now());
  function safeClose() {
    const age = Date.now() - mountedAt.current;
    console.log('[CHAT_BACK_BUTTON]', { age_ms: age, blocked: age < 400, ts: Date.now() });
    if (age < 400) return; // iOS ghost-click guard
    onClose?.();
  }
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
          <button onClick={safeClose} style={{
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
              fontSize:17, color:"white", fontWeight:700,
            }}>
              {!pendingRecipient.avatar_url && (pendingRecipient.display_name?.[0] || "?")}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:"#1a1a18" }}>
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
          search={search}
        />
      </div>
    </div>
  );
}

/* ── HAUPT-OVERLAY ── */
export default function ChatCenterOverlay({ onClose, initialRecipient = null, onDiscoverClose, onMarkRead }) {
  console.log("[CCO_RENDER_START]", { hasInitialRecipient: !!initialRecipient?.id });
  const [activeConv,       setActiveConv]       = useState(null);
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const [loadingConv,      setLoadingConv]      = useState(false);

  const { openCreatorProfile } = useProfileLauncher();
  const { user } = useAuth();

  // ── Neueste Verbindungen — gegenseitige Follows ──────────────
  const [connections, setConnections] = useState([]);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        // Step 1: Wem folge ich?
        const { data: iFollow } = await supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", user.id);
        const followCount = iFollow?.length ?? 0;

        if (!followCount) {
          console.log("[CONNECTIONS_LOAD]", { followCount: 0, mutualCount: 0, profileCount: 0 });
          return;
        }

        const iFollowIds = iFollow.map(r => r.followed_id);

        // Step 2: Wer davon folgt mir zurück? (mutual)
        const { data: mutual } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("followed_id", user.id)
          .in("follower_id", iFollowIds);
        const mutualCount = mutual?.length ?? 0;

        console.log("[CONNECTIONS_LOAD]", { followCount, mutualCount, profileCount: mutualCount });

        if (!mutualCount || cancelled) return;

        const mutualIds = mutual.map(r => r.follower_id);

        // Step 3: Profile laden
        // ProfileService v1.0
        const { data: profiles } = await ProfileService.getMany(mutualIds.slice(0, 10));

        if (!cancelled && profiles?.length) {
          setConnections(profiles.map(p => ({
            id:         p.id,
            name:       p.display_name || "?",
            avatar_url: p.avatar_url   || null,
          })));
        }
      } catch (e) {
        console.warn("[CONNECTIONS_LOAD] error:", e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);
  const { chats, loading } = useChatList("cco");



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
        id:         chatRecord.id,
        name:       initialRecipient.display_name || "Creator",
        avatar_url: initialRecipient.avatar_url   || null,
        talent:     initialRecipient.talent        || null,
        online:     true,
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
        id:         chatRecord.id,
        name:       pendingRecipient.display_name || "Creator",
        avatar_url: pendingRecipient.avatar_url   || null,
        talent:     pendingRecipient.talent        || null,
        online:     true,
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
      id:          realId,
      name:        rawConv.name || other.display_name || "Gespräch",
      avatar_url:  rawConv.avatar_url || other.avatar_url || null,
      talent:      rawConv.talent || other.focus_type || null,
      online:      rawConv.online ?? true,
      last_message: rawConv.last_message,
      other_profile: rawConv.other_profile || null,
    });
    // Phase 8: Chat als gelesen markieren — aktualisiert unread_count + Header Badge
    if (onMarkRead) onMarkRead(realId);
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
          onCompose={() => { setShowPeopleSearch(true); }}
          chats={chats}
          loading={loading}
          onDiscoverClose={onDiscoverClose}
          pendingRecipient={pendingRecipient}
          onOpenPending={openPendingChat}
          connections={connections}
        />
      )}
    </>
  );
}
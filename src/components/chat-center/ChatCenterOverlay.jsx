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
import { supabase } from "../../lib/supabaseClient.js";
import AppointmentViewer from "./AppointmentViewer.jsx";
import PeopleSearch from "../discovery/PeopleSearch.jsx";
import { HUI } from "../../design/hui.design.js";
import { getFullDisplayName } from "../../lib/profileUtils.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { registerModal } from "../../lib/backButtonRegistry.js";

const C = { teal: HUI.COLOR.teal, teal2: HUI.COLOR.tealDeep, ink: HUI.COLOR.ink, muted: "#55556B" };

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
  const { t } = useTranslation();
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
              {t("chat.title")}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
              {t("chat.subtitle")}
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
            placeholder={t('chat.searchPlaceholder')}
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
                {t("chat.startConversationWith", { name: pendingRecipient.display_name || t("chat.thisTalent") })}
              </div>
              <div style={{ fontSize:12, color:"#55556B", marginTop:2 }}>
                {t("chat.tapToWrite")}
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
  const { t } = useTranslation();

  const { chats: rawChats, loading, markChatRead: ccoMarkChatRead } = useChatList("cco");
  const chats = rawChats;

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

  // ── BOOKING-CHAT-001 (2026-09-13, Michael-Prompt 3): Buchungs-ID aus dem
  // (von normalizeRecipient) angereicherten Recipient extrahieren. OPEN_CHAT
  // aus dem Buchungsdetail (NotificationPanel) reicht booking_id mit — der
  // Chat wird dann bei Bedarf ERSTELLT und direkt geoeffnet statt nur die
  // Chat-Uebersicht zu zeigen. Ohne booking_id bleibt CHAT-LOGIK v2 massgeblich:
  // nur bestehende Chats oeffnen, keine Neuerstellung ohne Buchungskontext.
  const bookingCtxOf = (rec) => rec?._raw?.booking_id || rec?.booking_id || null;

  // AUTO-OPEN: initialRecipient vorhanden → direkt ConversationRoom öffnen.
  // CHAT-OPEN-SSOT-001: Nicht nur beim Mount. Wenn der Chat bereits als Liste
  // offen ist und ein anderer System-CTA einen Zielnutzer setzt, muss der
  // Effekt erneut laufen. Dasselbe gilt, wenn user.id erst nach Mount ankommt.
  // Fallback auf Banner-Tap wenn user?.id noch nicht verfügbar.
  React.useEffect(() => {
    if (!initialRecipient?.id) return;
    if (!user?.id) {
      setPendingRecipient(initialRecipient);
      return;
    }
    // CHAT-LOGIK v2: Nur bestehende Chats öffnen (keine neuen ohne Buchung)
    setLoadingConv(true);
    (async () => {
      try {
        const { data: existing } = await supabase
          .from("chats")
          .select("id, state, participant_ids")
          .contains("participant_ids", [user.id])
          .neq("state", "deleted")
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50);
        const match = (existing || []).find(c =>
          Array.isArray(c.participant_ids) && c.participant_ids.includes(initialRecipient.id)
        );
        if (match) {
          setActiveConv({
            id:           match.id,
            user_id:      initialRecipient.id           || null,
            name:         getFullDisplayName(initialRecipient) || t("profile.wirkerDefault"),
            avatar_url:   initialRecipient.avatar_url   || null,
            talent:       initialRecipient.talent        || null,
            has_talent_profile: initialRecipient.has_talent_profile || false,
            online:       true,
            // BUGFIX (2026-08-25): other_profile fehlte hier — ChatHeader.jsx liest
            // getFullDisplayName(conv?.other_profile) MIT VORRANG vor conv?.name.
            // getFullDisplayName(undefined) liefert bereits den Fallback-String
            // "Mitglied" zurueck (truthy!), wodurch conv?.name NIE genutzt wurde,
            // obwohl der echte Name dort korrekt gesetzt war (Michael-Report,
            // Screenshot 2026-08-25: Chat-Header zeigte "Mitglied" statt Name
            // nach Verbinden-Button-Klick).
            other_profile: initialRecipient,
          });
        } else {
          // CHAT-OPEN-ALL-FIX (2026-09-15, Michael-Report "Verkaeufer
          // kontaktieren fuehrt ins Leere"): Frueher wurde hier nur MIT
          // bookingId ein Chat erstellt (BOOKING-CHAT-001-Gate, Rest aus der
          // CHAT-LOGIK-v2-Aera). Seit OPEN-CHAT-001 (heute, SSOT
          // connectAndOpenChat/canUserChat in chatContext.js) duerfen alle
          // Nutzer miteinander chatten -- das Gate hier war der einzige Ort,
          // der noch daran gehangen hat. Root Cause des Bugs: "Verkaeufer
          // kontaktieren" nach einem abgeschlossenen Kauf (FinanzuebersichtModal)
          // hat KEINE booking_id (Orders, keine Buchungen) -> Chat wurde nie
          // erstellt, der Banner "Gespraech starten mit Sabrina" verschwand
          // beim Tap ins Leere, weil openPendingChat() dasselbe Gate hatte.
          // Jetzt: IMMER erstellen, wenn kein bestehender Chat gefunden wurde.
          const bookingId = bookingCtxOf(initialRecipient);
          const created = await findOrCreateChat({ userId: user.id, otherUserId: initialRecipient.id, bookingId });
          if (created?.id) {
            setActiveConv({
              id:           created.id,
              user_id:      initialRecipient.id           || null,
              name:         getFullDisplayName(initialRecipient) || t("profile.wirkerDefault"),
              avatar_url:   initialRecipient.avatar_url   || null,
              talent:       initialRecipient.talent        || null,
              has_talent_profile: initialRecipient.has_talent_profile || false,
              online:       true,
              other_profile: initialRecipient,
            });
            return; // finally unten setzt loading=false
          }
          setPendingRecipient(initialRecipient);
        }
      } catch(e) {
        setPendingRecipient(initialRecipient);
      } finally {
        setLoadingConv(false);
      }
    })();
  }, [initialRecipient?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function openPendingChat() {
    if (!pendingRecipient?.id || !user?.id) return;
    setPendingRecipient(null);
    // CHAT-LOGIK v2: Nur bestehende Chats öffnen
    setLoadingConv(true);
    (async () => {
      try {
        const { data: existing } = await supabase
          .from("chats")
          .select("id, state, participant_ids")
          .contains("participant_ids", [user.id])
          .neq("state", "deleted")
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50);
        const match = (existing || []).find(c =>
          Array.isArray(c.participant_ids) && c.participant_ids.includes(pendingRecipient.id)
        );
        if (match) {
          setActiveConv({
            id:           match.id,
            user_id:      pendingRecipient.id           || null,
            name:         getFullDisplayName(pendingRecipient) || t("profile.wirkerDefault"),
            avatar_url:   pendingRecipient.avatar_url   || null,
            talent:       pendingRecipient.talent        || null,
            has_talent_profile: pendingRecipient.has_talent_profile || false,
            online:       true,
            // BUGFIX (2026-08-25): siehe Kommentar oben — other_profile ergaenzt.
            other_profile: pendingRecipient,
          });
        } else {
          // CHAT-OPEN-ALL-FIX (2026-09-15, siehe Kommentar oben im Auto-Open-
          // Effect): IMMER erstellen statt nur mit Buchungskontext.
          const bookingId = bookingCtxOf(pendingRecipient);
          const created = await findOrCreateChat({ userId: user.id, otherUserId: pendingRecipient.id, bookingId });
          if (created?.id) {
            setActiveConv({
              id:           created.id,
              user_id:      pendingRecipient.id           || null,
              name:         getFullDisplayName(pendingRecipient) || t("profile.wirkerDefault"),
              avatar_url:   pendingRecipient.avatar_url   || null,
              talent:       pendingRecipient.talent        || null,
              has_talent_profile: pendingRecipient.has_talent_profile || false,
              online:       true,
              other_profile: pendingRecipient,
            });
          }
        }
      } catch(err) {
        console.error("[HUI_CHAT] openPendingChat error:", err?.message);
      } finally {
        setLoadingConv(false);
      }
    })();
  }

  function openConv(rawConv) {
    const realId = rawConv?.id;
    if (!realId) return;
    const other = rawConv.other_profile || {};
    setActiveConv({
      id:                 realId,
      user_id:            other.id || rawConv.user_id || null,
      name:               getFullDisplayName(rawConv.other_profile) || rawConv.name || t("chat.conversation"),
      avatar_url:         rawConv.avatar_url || other.avatar_url || null,
      talent:             rawConv.talent || (other.focus_type && other.focus_type !== "public" ? other.focus_type : null) || null,
      has_talent_profile: other.has_talent_profile || rawConv.has_talent_profile || false,
      online:             rawConv.online ?? true,
      last_message:       rawConv.last_message,
      other_profile:      rawConv.other_profile || null,
    });
    // Phase 8: Chat als gelesen markieren — aktualisiert unread_count + Header Badge
    if (onMarkRead) onMarkRead(realId);
    // ── CHAT-UNREAD-005 (2026-09-26, Bugreport 34c9e8f2, Lars Platin,
    // 24.09.: "habe Kay seine Nachricht aufgemacht und geantwortet, bin
    // wieder raus aus dem Chat und jetzt steht es noch als ungelesene
    // Nachricht da") ─────────────────────────────────────────────────
    // Root Cause: ZWEI getrennte useChatList-Instanzen mit eigenem State —
    // Home.jsx nutzt "home" (Tab-Badge), ChatCenterOverlay nutzt "cco"
    // (rendert DIESE sichtbare Liste). onMarkRead = die home-Instanz:
    // DB-Upsert + home-State wurden korrekt aktualisiert (DB-Beweis:
    // Lars' chat_participants.last_read_at = 07:04:33, Antwort 07:05:00),
    // aber der cco-Listen-State bekam das Optimistic-Update NIE → der
    // Unread-Badge blieb auf der Karte stehen, bis ein Neuladen passierte.
    // Fix: die EIGENE cco-Instanz hier zusätzlich aktualisieren. Der DB-
    // Upsert ist idempotent (onConflict chat_id,user_id), das doppelte
    // Setzen ist also harmlos.
    ccoMarkChatRead(realId);
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
          <div style={{ fontSize: 13, color: "#999" }}>{t("chat.preparingConnection")}</div>
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
            // CHAT-PROFILE-ZINDEX-001 (2026-09-14, Michael-Report: "Klick auf
            // den Namen springt zurück und landet im Chat Bereich ohne dass
            // ich Sabrina sehe"). Root Cause: ProfileLauncher (Home.jsx Zeile
            // 766) und ChatCenterOverlay (Zeile 816) sind BEIDE eigene
            // createPortal(...,document.body) mit identischem zIndex:10500 --
            // bei gleichem z-index gewinnt bei DOM-Geschwistern der SPÄTER
            // eingefügte Knoten. ChatCenterOverlay steht im JSX-Baum NACH
            // ProfileLauncher -> das neu geöffnete Profil rendert zwar
            // korrekt, aber UNSICHTBAR HINTER dem weiterhin offenen Chat --
            // fühlte sich an wie "nichts passiert, zurück im Chat". Exakt das
            // gleiche Muster wie BOOKING-CHAT-001/002 (Glocke/Finanzübersicht
            // vs. Chat). Fix: Chat-Overlay ZUERST schließen (onClose, wie von
            // Home.jsx übergeben), DANN Profil öffnen -- kein Stacking-Konflikt
            // mehr, da nur noch ein Portal aktiv ist.
            const userId = conv?.user_id || conv?.other_profile?.id;
            if (!userId) return;
            onClose();
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
            setActiveConv(null);
            // Chat wird via closeChat() in der DB auf state:"closed" gesetzt.
            // useChatList filtert closed Chats nun serverseitig via .in() —
            // kein lokales closedChatIds-Set mehr nötig.
            if (typeof window !== "undefined" && window.__HUI_RELOAD_CHAT_LIST__) {
              window.__HUI_RELOAD_CHAT_LIST__();
            }
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
            if (userId) {
              onClose();
              openCreatorProfile(userId, {
                display_name: profile?.display_name,
                avatar_url:   profile?.avatar_url,
                talent:       profile?.talent,
              });
            }
          }}
          onOpenChat={(profile) => {
            // CHAT-LOGIK v2: Chat nur nach Buchung. PeopleSearch öffnet nur Profil.
            setShowPeopleSearch(false);
            if (!profile?.id) return;
            onClose();
            openCreatorProfile(profile.id, {
              display_name: profile?.display_name,
              avatar_url:   profile?.avatar_url,
              talent:       profile?.talent,
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
            // CHAT-PROFILE-ZINDEX-001-Nachtrag: onClose() zuerst, sonst
            // derselbe zIndex:10500-Stacking-Konflikt wie beim Chat-Header.
            const userId = person?.id;
            if (!userId) return;
            onClose();
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
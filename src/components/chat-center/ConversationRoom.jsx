// chat-center/ConversationRoom.jsx v3
// CHAT-LOGIK v2 (2026-08-22): Delivery-Tracking, Auto-Close, Info-Leiste
// Voice + Media + Delete + Edit support

import React, { useCallback, useMemo } from "react";
import ChatHeader     from "./ChatHeader.jsx";
import ChatMessages   from "./ChatMessages.jsx";
import ChatInput      from "./ChatInput.jsx";
import { useChatThread, useChatDeliveryStatus,
         markSellerShipped, markBuyerReceived, submitBuyerRating,
         logChatEvent } from "../../lib/chatContext.js";
import { useAuth }       from "../../lib/AuthContext.jsx";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { getFullDisplayName } from "../../lib/profileUtils.js";
import { supabase } from "../../lib/supabaseClient.js";

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

// ── Delivery Action Bar ──────────────────────────────────────────
function DeliveryActionBar({ chatId, delivery, userId, otherProfile, onRefresh }) {
  const [busy, setBusy] = React.useState(false);

  // Wer ist der Verkäufer? Derjenige, der das Werk/Talent/Erlebnis anbietet.
  // booking_type ist gesetzt → der Chat-Partner ist der Verkäufer,
  // der aktuelle User ist der Käufer. ABER: das muss nicht immer so sein —
  // der Verkäufer sieht auch diesen Chat. Wir müssen die Rolle bestimmen.
  // Ansatz: booking_title oder booking_id vorhanden → Prüfe orders/talent_bookings
  // um festzustellen wer Verkäufer ist. Vereinfachung: Beide sehen dieselben Buttons,
  // aber mit unterschiedlichen Labels je nach Rolle.
  // Für jetzt: Wir nutzen eine Heuristik — der Chat wurde für den aktuellen
  // User erstellt (er hat gekauft) → er ist Käufer. Wenn er der andere ist → Verkäufer.
  // Da wir diese Info nicht haben ohne DB-Query, zeigen wir universelle Buttons:
  // - "Als versendet markieren" (für Verkäufer-Aktion)
  // - "Ware erhalten" (für Käufer-Aktion)
  // - "Empfehlen"/"Nicht empfehlen" (für Käufer-Aktion nach Erhalt)

  async function handleShip() {
    if (!chatId || !userId) return;
    setBusy(true);
    const res = await markSellerShipped(chatId, userId);
    setBusy(false);
    if (res?.ok) {
      logChatEvent(chatId, "chat_message_sent", userId, { system_message: "Verkäufer: Versendet" });
      onRefresh?.();
    }
  }

  async function handleReceive() {
    if (!chatId || !userId) return;
    setBusy(true);
    const res = await markBuyerReceived(chatId, userId);
    setBusy(false);
    if (res?.ok) {
      logChatEvent(chatId, "chat_message_sent", userId, { system_message: "Käufer: Ware erhalten" });
      onRefresh?.();
    }
  }

  async function handleRate(rating) {
    if (!chatId || !userId) return;
    setBusy(true);
    const res = await submitBuyerRating(chatId, userId, rating);
    setBusy(false);
    if (res?.ok) {
      onRefresh?.();
    }
  }

  // Nichts zeigen wenn kein Booking-Kontext
  if (!delivery.booking_type) return null;

  // Geschlossen → nichts (Info-Leiste wird separat gerendert)
  if (delivery.isClosed) return null;

  const btnStyle = {
    flex: 1, height: 40, borderRadius: 99,
    fontWeight: 600, fontSize: 12.5, cursor: "pointer",
    fontFamily: "inherit", display: "flex",
    alignItems: "center", justifyContent: "center", gap: 6,
    border: "none", touchAction: "manipulation",
    transition: "all .18s ease",
  };

  const tealBtn  = { ...btnStyle, background: "#0DC4B5", color: "#fff" };
  const outlineBtn = { ...btnStyle, background: "transparent", border: "1.5px solid #0AA89B", color: "#0AA89B" };
  const redBtn   = { ...btnStyle, background: "transparent", border: "1.5px solid #E2574C", color: "#E2574C" };

  // Zustand: pending → beide sehen ihre Buttons
  if (delivery.delivery_status === "pending") {
    return (
      <div style={{ padding: "10px 14px 4px", display: "flex", gap: 8 }}>
        <button onClick={handleShip} disabled={busy} className="ppp-press" style={outlineBtn}>
          📦 Als versendet markieren
        </button>
        <button onClick={handleReceive} disabled={busy} className="ppp-press" style={tealBtn}>
          ✅ Ware erhalten
        </button>
      </div>
    );
  }

  // Zustand: shipped → Käufer kann "Ware erhalten"
  if (delivery.delivery_status === "shipped") {
    return (
      <div style={{ padding: "10px 14px 4px", display: "flex", gap: 8 }}>
        <div style={{ ...btnStyle, cursor: "default", background: "rgba(13,196,181,0.08)", color: "#0AA89B" }}>
          📦 Versendet
        </div>
        <button onClick={handleReceive} disabled={busy} className="ppp-press" style={tealBtn}>
          ✅ Ware erhalten
        </button>
      </div>
    );
  }

  // Zustand: delivered → Käufer bewertet
  if (delivery.delivery_status === "delivered") {
    return (
      <div style={{ padding: "10px 14px 4px" }}>
        <div style={{ fontSize: 11.5, color: "rgba(80,80,80,0.55)", textAlign: "center", marginBottom: 8 }}>
          Wie war deine Erfahrung? Bitte bewerte den Kauf.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleRate("recommend")} disabled={busy} className="ppp-press" style={tealBtn}>
            👍 Empfehlen
          </button>
          <button onClick={() => handleRate("not_recommend")} disabled={busy} className="ppp-press" style={redBtn}>
            👎 Nicht empfehlen
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Closed Info Bar ──────────────────────────────────────────────
function ClosedInfoBar() {
  return (
    <div style={{
      padding: "12px 16px",
      background: "rgba(26,26,46,0.04)",
      borderTop: "1px solid rgba(26,26,46,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      fontSize: 12.5, color: "rgba(80,80,80,0.55)",
      fontFamily: "Inter,sans-serif",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span>Dieser Chat ist geschlossen. Schreiben ist nicht mehr möglich.</span>
    </div>
  );
}

export default function ConversationRoom({ conv, onBack, onOpenProfile, onCloseChat, onRequestBooking }) {
  const { user } = useAuth();
  const kbdInset = useKeyboardInset();

  const rawId      = conv?.id ?? null;
  const isFakeId   = typeof rawId === "string" && rawId.startsWith("direct_");
  const realChatId = (rawId && !isFakeId) ? rawId : null;

  const { messages: liveMessages, sendMessage, deleteMessage, editMessage, reactToMessage, sending, loading } =
    useChatThread(realChatId);

  // CHAT-LOGIK v2: Delivery-Status laden
  const delivery = useChatDeliveryStatus(realChatId);

  const messages = useMemo(
    () => (liveMessages || []).filter(m => m?.id).map(m => ({
      ...m,
      own:         m.sender_id === user?.id,
      avatar:      conv?.avatar_url,
      sender_name: getFullDisplayName(conv?.other_profile) || conv?.name,
    })),
    [liveMessages, user?.id, conv?.avatar_url, conv?.name]
  );

  const handleSend = useCallback(async (payload) => {
    if (!realChatId || !sendMessage) return;
    // CHAT-LOGIK v2: Schreibsperre bei geschlossenem Chat
    if (!delivery.canWrite) return;
    if (typeof payload === "string") {
      await sendMessage({ text: payload, msgType: "text" });
    } else {
      await sendMessage(payload);
    }
    // Event loggen
    logChatEvent(realChatId, "chat_message_sent", user?.id);
  }, [sendMessage, realChatId, delivery.canWrite, user?.id]);

  const handleDelete = useCallback(async (msgId) => {
    await deleteMessage?.(msgId);
  }, [deleteMessage]);

  const handleEdit = useCallback(async (msgId, newText) => {
    await editMessage?.(msgId, newText);
  }, [editMessage]);

  const handleReact = useCallback(async (msgId, emoji) => {
    await reactToMessage?.(msgId, emoji);
  }, [reactToMessage]);

  const showEmpty = !loading && messages.length === 0 && !!realChatId;

  return (
    <div data-hui-kbd-self-managed style={{
      position:"fixed", inset:0, zIndex:10002,
      background:"#F2F4F8",
    }}>
      <style>{CSS}</style>
      <div style={{
        position:"absolute", top:0, left:0, right:0,
        bottom:"clamp(0px, var(--hui-keyboard-inset, 0px), 65vh)",
        display:"flex", flexDirection:"column",
        fontFamily:"Inter,sans-serif",
        transition:"bottom 0.25s ease-out",
      }}>
        <ChatHeader conv={conv} onBack={onBack} onOpenProfile={onOpenProfile}
          onCloseChat={onCloseChat} onRequestBooking={onRequestBooking}/>

        {showEmpty ? (
          <div style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:14, padding:"40px 32px",
          }}>
            <div style={{
              width:56, height:56, borderRadius:"50%",
              background:"linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
            }}>✦</div>
            <div style={{
              fontSize:14, textAlign:"center", lineHeight:1.7,
              color:"rgba(80,80,80,0.42)", maxWidth:220,
            }}>
              {delivery.booking_type
                ? <>Chat für eure Transaktion.<br/><span style={{ color:"rgba(22,215,197,0.65)", fontWeight:600 }}>Stellt Versand & Absprachen hier klar.</span></>
                : <>Erste Worte.<br/><span style={{ color:"rgba(22,215,197,0.65)", fontWeight:600 }}>Schreib etwas Echtes.</span></>
              }
            </div>
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            typing={false}
            event={null}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onReact={handleReact}
          />
        )}

        {/* CHAT-LOGIK v2: Delivery-Tracking Buttons (nur bei Buchungs-Chat) */}
        {realChatId && delivery.booking_type && !delivery.isClosed && (
          <DeliveryActionBar
            chatId={realChatId}
            delivery={delivery}
            userId={user?.id}
            otherProfile={conv?.other_profile}
            onRefresh={delivery.refresh}
          />
        )}

        {/* CHAT-LOGIK v2: Input oder Closed-Info-Leiste */}
        <div style={{ flexShrink:0 }}>
          {delivery.isClosed ? (
            <ClosedInfoBar/>
          ) : (
            <ChatInput
              onSend={handleSend}
              sending={sending}
              disabled={!delivery.canWrite}
            />
          )}
        </div>
      </div>
    </div>
  );
}

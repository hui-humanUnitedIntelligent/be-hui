// chat-center/ConversationRoom.jsx v3
// FIX v3:
//   - useChatThread IMMER aufgerufen (Hook-Rules-Konformität)
//   - kein lokaler sending-State — nur useChatThread.sending
//   - fake "direct_xyz" → realChatId=null → kein DB-Load + kein Send
//   - volle Logging für Diagnose

import React, { useCallback } from "react";
import ChatAtmosphere from "./ChatAtmosphere.jsx";
import ChatHeader     from "./ChatHeader.jsx";
import ChatMessages   from "./ChatMessages.jsx";
import ChatInput      from "./ChatInput.jsx";
import { useChatThread } from "../../lib/chatContext.js";
import { useAuth }       from "../../lib/AuthContext.jsx";

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

function getMockMsgs(conv) {
  const base = Date.now() - 3600000;
  return [
    { id:1, text:"Hey! Schön von dir zu hören 😊\nDanke für dein Interesse.", own:false, created_at:new Date(base).toISOString(), sender_name: conv?.name },
    { id:2, text:"Hallo! Ich freue mich schon sehr darauf.", own:true, created_at:new Date(base+900000).toISOString(), read:true },
    { id:3, text:"Super! Bis bald 🌿✨", own:false, created_at:new Date(base+1020000).toISOString(), sender_name: conv?.name },
  ];
}

export default function ConversationRoom({ conv, onBack, onOpenProfile }) {
  const { user } = useAuth();

  // ── useChatThread IMMER aufrufen (kein konditionaler Hook) ──────
  // fake-ID ("direct_xyz") oder null → realChatId=null → kein DB-Load
  const rawId    = conv?.id ?? null;
  const isFakeId = typeof rawId === "string" && rawId.startsWith("direct_");
  const realChatId = (rawId && !isFakeId) ? rawId : null;

  const { messages: liveMessages, sendMessage, sending, loading } =
    useChatThread(realChatId);

  // ── Logging beim Mount ─────────────────────────────────────────
  React.useEffect(() => {
    console.log("[HUI_ROOM] mount, conv.id:", rawId, "→ realChatId:", realChatId, "isFake:", isFakeId);
  }, [rawId, realChatId, isFakeId]);

  // ── Message-Normalisierung ────────────────────────────────────
  const normalizedLive = (liveMessages || []).filter(m => m?.id).map(m => ({
    ...m,
    own:         m.sender_id === user?.id,
    avatar:      conv?.avatar_url,
    sender_name: conv?.name,
  }));

  const messages = normalizedLive.length > 0
    ? normalizedLive
    : (isFakeId && !loading)
      ? getMockMsgs(conv)
      : [];

  // ── handleSend ────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    if (!text?.trim()) return;

    if (!realChatId) {
      console.warn("[HUI_ROOM] handleSend: kein realChatId (fake/null):", rawId, "— kein Send möglich");
      return;
    }
    if (!sendMessage) {
      console.error("[HUI_ROOM] sendMessage ist undefined — useChatThread nicht bereit");
      return;
    }

    console.log("[HUI_ROOM] handleSend →", { realChatId, len: text.length });
    const result = await sendMessage({ text: text.trim(), msgType: "text" });

    if (result?.error) {
      console.error("[HUI_ROOM] ✗ send error:", result.error, result.code);
    } else {
      console.log("[HUI_ROOM] ✓ send ok, id:", result?.id);
    }
  }, [sendMessage, realChatId, rawId]);

  return (
    <div style={{
      position:"absolute", inset:0, zIndex:3,
      display:"flex", flexDirection:"column",
      overflowX:"hidden", overflowY:"hidden",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <style>{CSS}</style>
      <ChatAtmosphere dark={false}/>
      <ChatHeader conv={conv} onBack={onBack} onOpenProfile={onOpenProfile}/>
      <ChatMessages messages={messages} typing={false} event={null}/>
      <div style={{ position:"relative", zIndex:10, flexShrink:0, width:"100%" }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}

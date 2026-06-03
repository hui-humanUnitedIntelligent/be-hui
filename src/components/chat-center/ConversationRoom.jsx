// chat-center/ConversationRoom.jsx

import React, { useCallback } from "react";
import ChatHeader     from "./ChatHeader.jsx";
import ChatMessages   from "./ChatMessages.jsx";
import ChatInput      from "./ChatInput.jsx";
import { useChatThread } from "../../lib/chatContext.js";
import { useAuth }       from "../../lib/AuthContext.jsx";

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

export default function ConversationRoom({ conv, onBack, onOpenProfile }) {
  const { user } = useAuth();

  const rawId      = conv?.id ?? null;
  const isFakeId   = typeof rawId === "string" && rawId.startsWith("direct_");
  const realChatId = (rawId && !isFakeId) ? rawId : null;

  const { messages: liveMessages, sendMessage, sending, loading } =
    useChatThread(realChatId);

  const messages = (liveMessages || []).filter(m => m?.id).map(m => ({
    ...m,
    own:         m.sender_id === user?.id,
    avatar:      conv?.avatar_url,
    sender_name: conv?.name,
  }));

  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || !realChatId || !sendMessage) return;
    await sendMessage({ text: text.trim(), msgType: "text" });
  }, [sendMessage, realChatId]);

  const showEmpty = !loading && messages.length === 0 && !!realChatId;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10002,
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      background: "#F2F4F8",
    }}>
      <style>{CSS}</style>
      <ChatHeader conv={conv} onBack={onBack} onOpenProfile={onOpenProfile}/>

      {showEmpty
        ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 14, padding: "40px 32px",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>✦</div>
            <div style={{
              fontSize: 14, textAlign: "center", lineHeight: 1.7,
              color: "rgba(80,80,80,0.42)", maxWidth: 220,
            }}>
              Erste Worte.<br/>
              <span style={{ color: "rgba(22,215,197,0.65)", fontWeight: 600 }}>
                Schreib etwas Echtes.
              </span>
            </div>
          </div>
        )
        : <ChatMessages messages={messages} typing={false} event={null}/>
      }

      <div style={{ flexShrink: 0 }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}

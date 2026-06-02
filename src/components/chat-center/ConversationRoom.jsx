// chat-center/ConversationRoom.jsx

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

function EmptyConvState({ name }) {
  return (
    <div style={{
      background: "yellow",
      color: "black",
      minHeight: 500,
      padding: 40,
      fontSize: 32,
      fontWeight: 700,
    }}>
      EMPTY STATE LIVE
    </div>
  );
}

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
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      background: "rgba(249,247,244,1)",
    }}>
      <style>{CSS}</style>
      <ChatAtmosphere dark={false}/>
      <ChatHeader conv={conv} onBack={onBack} onOpenProfile={onOpenProfile}/>

      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {showEmpty
          ? <EmptyConvState name={conv?.name}/>
          : <ChatMessages messages={messages} typing={false} event={null}/>
        }
      </div>

      <div style={{ flexShrink: 0 }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}

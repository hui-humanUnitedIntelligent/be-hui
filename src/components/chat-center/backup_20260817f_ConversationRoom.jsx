// chat-center/ConversationRoom.jsx v2
// Voice + Media + Delete + Edit support

import React, { useCallback, useMemo } from "react";
import ChatHeader     from "./ChatHeader.jsx";
import ChatMessages   from "./ChatMessages.jsx";
import ChatInput      from "./ChatInput.jsx";
import { useChatThread } from "../../lib/chatContext.js";
import { useAuth }       from "../../lib/AuthContext.jsx";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

export default function ConversationRoom({ conv, onBack, onOpenProfile, onCloseChat, onRequestBooking }) {
  const { user } = useAuth();
  const kbdInset = useKeyboardInset(); // Keyboard-Inset aktivieren — Container schrumpft bei Tastatur

  const rawId      = conv?.id ?? null;
  const isFakeId   = typeof rawId === "string" && rawId.startsWith("direct_");
  const realChatId = (rawId && !isFakeId) ? rawId : null;

  const { messages: liveMessages, sendMessage, deleteMessage, editMessage, sending, loading } =
    useChatThread(realChatId);

  const messages = useMemo(
    () => (liveMessages || []).filter(m => m?.id).map(m => ({
      ...m,
      own:         m.sender_id === user?.id,
      avatar:      conv?.avatar_url,
      sender_name: conv?.name,
    })),
    [liveMessages, user?.id, conv?.avatar_url, conv?.name]
  );

  // Send: Text oder Media (von ChatInput v4)
  const handleSend = useCallback(async (payload) => {
    if (!realChatId || !sendMessage) return;
    // payload kann string (legacy) oder { text, msgType, mediaUrl, mediaType } sein
    if (typeof payload === "string") {
      await sendMessage({ text: payload, msgType: "text" });
    } else {
      await sendMessage(payload);
    }
  }, [sendMessage, realChatId]);

  const handleDelete = useCallback(async (msgId) => {
    await deleteMessage?.(msgId);
  }, [deleteMessage]);

  const handleEdit = useCallback(async (msgId, newText) => {
    await editMessage?.(msgId, newText);
  }, [editMessage]);

  const showEmpty = !loading && messages.length === 0 && !!realChatId;

  return (
    <div data-hui-kbd-self-managed style={{
      position:"fixed", top:0, left:0, right:0, bottom:"clamp(0px, var(--hui-keyboard-inset, 0px), 65vh)", zIndex:10002,
      display:"flex", flexDirection:"column",
      fontFamily:"Inter,sans-serif",
      background:"#F2F4F8",
      transition:"bottom 0.25s ease-out",
    }}>
      <style>{CSS}</style>
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
            Erste Worte.<br/>
            <span style={{ color:"rgba(22,215,197,0.65)", fontWeight:600 }}>
              Schreib etwas Echtes.
            </span>
          </div>
        </div>
      ) : (
        <ChatMessages
          messages={messages}
          typing={false}
          event={null}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      <div style={{ flexShrink:0 }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}

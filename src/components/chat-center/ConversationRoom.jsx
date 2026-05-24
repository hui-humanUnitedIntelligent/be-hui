// chat-center/ConversationRoom.jsx v4 — REALITY
// Phase 4A: kein getMockMsgs mehr — echter Empty State wenn kein Verlauf

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

// Leerer Raum — erste Begegnung
function EmptyConvState({ name }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 24px", gap:16,
    }}>
      <div style={{
        width:56, height:56, borderRadius:"50%",
        background:"linear-gradient(135deg,rgba(22,215,197,0.15),rgba(255,138,107,0.10))",
        border:"1.5px solid rgba(22,215,197,0.25)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:22,
      }}>✦</div>
      <p style={{ margin:0, fontSize:15, fontWeight:600, color:"#2D2D2D", letterSpacing:-0.2 }}>
        {name ? `Schreib ${name} als Erste:s` : "Beginne das Gespräch"}
      </p>
      <p style={{ margin:0, fontSize:13, color:"rgba(80,80,80,0.65)", textAlign:"center", lineHeight:1.6, maxWidth:240 }}>
        Dieser Raum wartet auf eure erste Begegnung.
      </p>
    </div>
  );
}

export default function ConversationRoom({ conv, onBack, onOpenProfile }) {
  const { user } = useAuth();

  // IMMER aufrufen — useChatThread handled null intern
  const rawId     = conv?.id ?? null;
  const isFakeId  = typeof rawId === "string" && rawId.startsWith("direct_");
  const realChatId = (rawId && !isFakeId) ? rawId : null;

  const { messages: liveMessages, sendMessage, sending, loading } =
    useChatThread(realChatId);

  React.useEffect(() => {
    console.log("[HUI_ROOM] mount:", { convId: rawId, realChatId, isFakeId, userId: user?.id });
  }, [rawId]);  // eslint-disable-line

  // Normalisierung — kein Mock-Fallback
  const messages = (liveMessages || []).filter(m => m?.id).map(m => ({
    ...m,
    own:         m.sender_id === user?.id,
    avatar:      conv?.avatar_url,
    sender_name: conv?.name,
  }));

  const handleSend = useCallback(async (text) => {
    if (!text?.trim()) return;
    if (!realChatId) {
      console.warn("[HUI_ROOM] send: kein realChatId:", rawId);
      return;
    }
    if (!sendMessage) {
      console.error("[HUI_ROOM] sendMessage undefined");
      return;
    }
    console.log("[HUI_ROOM] send →", { realChatId, len: text.length });
    const result = await sendMessage({ text: text.trim(), msgType: "text" });
    if (result?.error) {
      console.error("[HUI_ROOM] send error:", result.error?.code, result.error?.message);
    } else {
      console.log("[HUI_REALITY] chat persisted ✓", result?.id);
    }
  }, [sendMessage, realChatId, rawId]);

  const showEmpty = !loading && messages.length === 0 && realChatId;

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

      {showEmpty
        ? <EmptyConvState name={conv?.name}/>
        : <ChatMessages messages={messages} typing={false} event={null}/>
      }

      <div style={{ position:"relative", zIndex:10, flexShrink:0, width:"100%" }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}

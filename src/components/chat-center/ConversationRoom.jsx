// chat-center/ConversationRoom.jsx v4 — REALITY + DIAG LOGS
// [CR_MOUNT] [CR_RENDER] [CR_RETURN] [CR_UNMOUNT]

import React, { useCallback } from "react";
import ChatAtmosphere from "./ChatAtmosphere.jsx";
import ChatHeader     from "./ChatHeader.jsx";
import ChatMessages   from "./ChatMessages.jsx";
import ChatInput      from "./ChatInput.jsx";
import { useChatThread } from "../../lib/chatContext.js";
import { useAuth }       from "../../lib/AuthContext.jsx";
import { logDebug }      from "../../lib/debugCollector.js";

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

function EmptyConvState({ name }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 24px", gap:16,
    }}>
      {/* DIAG MARKER: EmptyConvState */}
      <div style={{position:"fixed",top:90,right:20,zIndex:999999,background:"red",color:"white",padding:"4px 8px",fontSize:11,fontFamily:"monospace",fontWeight:700,borderRadius:4,pointerEvents:"none"}}>
        EmptyConvState
      </div>
      <div style={{
        width:56, height:56, borderRadius:"50%",
        background:"linear-gradient(135deg,rgba(22,215,197,0.15),rgba(255,138,107,0.10))",
        border:"1.5px solid rgba(22,215,197,0.25)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:22,
      }}>\u2736</div>
      <p style={{ margin:0, fontSize:15, fontWeight:600, color:"#2D2D2D", letterSpacing:-0.2 }}>
        {name ? `Schreib ${name} als Erste:s` : "Beginne das Gespr\u00e4ch"}
      </p>
      <p style={{ margin:0, fontSize:13, color:"rgba(80,80,80,0.65)", textAlign:"center", lineHeight:1.6, maxWidth:240 }}>
        Dieser Raum wartet auf eure erste Begegnung.
      </p>
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

  // [CR_MOUNT] — leere deps: feuert einmal beim Mount / [CR_UNMOUNT] beim Unmount
  React.useEffect(() => {
    console.log("[CR_MOUNT]", conv?.id);
    logDebug("CR_MOUNT", { convId: conv?.id });
    if (typeof window !== "undefined") {
      window.__HUI_LAST_CR__ = { event: "CR_MOUNT", convId: conv?.id, ts: Date.now() };
    }
    return () => {
      console.log("[CR_UNMOUNT]", conv?.id);
      logDebug("CR_UNMOUNT", { convId: conv?.id });
      if (typeof window !== "undefined") {
        window.__HUI_LAST_CR__ = { event: "CR_UNMOUNT", convId: conv?.id, ts: Date.now() };
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // [CR_RENDER] — feuert bei jedem Render
  console.log("[CR_RENDER]", {
    convId:   conv?.id,
    loading,
    messages: (liveMessages || []).length,
  });
  logDebug("CR_RENDER", { convId: conv?.id, loading, messages: (liveMessages || []).length });
  if (typeof window !== "undefined") {
    window.__HUI_LAST_CR__ = {
      event: "CR_RENDER", convId: conv?.id,
      loading, messages: (liveMessages || []).length, ts: Date.now(),
    };
  }

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
    console.log("[HUI_ROOM] send \u2192", { realChatId, len: text.length });
    const result = await sendMessage({ text: text.trim(), msgType: "text" });
    if (result?.error) {
      console.error("[HUI_ROOM] send error:", result.error?.code, result.error?.message);
    } else {
      console.log("[HUI_REALITY] chat persisted \u2713", result?.id);
    }
  }, [sendMessage, realChatId, rawId]);

  const showEmpty = !loading && messages.length === 0 && realChatId;

  // [CR_RETURN] — direkt vor return
  console.log("[CR_RETURN]", {
    showEmpty,
    loading,
    messages: messages.length,
  });
  logDebug("CR_RETURN", { convId: conv?.id, showEmpty, loading, messages: messages.length });
  if (typeof window !== "undefined") {
    window.__HUI_LAST_CR__ = {
      event: "CR_RETURN", convId: conv?.id,
      showEmpty, loading, messages: messages.length, ts: Date.now(),
    };
  }

  return (
    <div style={{
      position:"absolute", inset:0, zIndex:3,
      display:"flex", flexDirection:"column",
      overflow:"visible",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <style>{CSS}</style>
      {/* DIAG MARKER: ConversationRoom */}
      <div style={{position:"fixed",top:60,right:20,zIndex:999999,background:"red",color:"white",padding:"4px 8px",fontSize:11,fontFamily:"monospace",fontWeight:700,borderRadius:4,pointerEvents:"none"}}>
        ConversationRoom
      </div>
      <ChatAtmosphere dark={false}/>
      <ChatHeader conv={conv} onBack={onBack} onOpenProfile={onOpenProfile}/>

      <div style={{ flex:1, minHeight:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {showEmpty
          ? <EmptyConvState name={conv?.name}/>
          : <ChatMessages messages={messages} typing={false} event={null}/>
        }
      </div>

      <div style={{
        flexShrink: 0,
        width: "100%",
        zIndex: 10,
        position: "relative",
        background: "rgba(255,0,0,0.08)",
        minHeight: 60,
        outline: "3px solid red",
      }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}

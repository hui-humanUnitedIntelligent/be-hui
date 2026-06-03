// chat-center/ConversationRoom.jsx

import React, { useCallback, useRef, useEffect } from "react";
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

  const crRef     = useRef(null);
  const headerRef = useRef(null);
  const inputRef  = useRef(null);
  useEffect(() => {
    const cr = crRef.current;
    if (!cr) return;
    cr.style.outline = "4px solid red";
    const lbl = document.createElement("div");
    lbl.textContent = `CR_h=${cr.offsetHeight} CR_client=${cr.clientHeight}`;
    Object.assign(lbl.style, { position:"fixed", top:"4px", left:"4px",
      background:"red", color:"white", fontSize:"10px", fontWeight:"700",
      fontFamily:"monospace", padding:"2px 6px", zIndex:"999999", pointerEvents:"none" });
    document.body.appendChild(lbl);
    const h = headerRef.current;
    if (h) {
      h.style.outline = "4px solid gold";
      const hl = document.createElement("div");
      hl.textContent = `HEADER_h=${h.offsetHeight}`;
      Object.assign(hl.style, { position:"absolute", top:"0", left:"0",
        background:"gold", color:"black", fontSize:"10px", fontWeight:"700",
        fontFamily:"monospace", padding:"2px 6px", zIndex:"999999", pointerEvents:"none" });
      h.style.position = h.style.position || "relative";
      h.appendChild(hl);
    }
    const inp = inputRef.current;
    if (inp) {
      inp.style.outline = "4px solid violet";
      const il = document.createElement("div");
      il.textContent = `INPUT_h=${inp.offsetHeight}`;
      Object.assign(il.style, { position:"absolute", top:"0", left:"0",
        background:"violet", color:"black", fontSize:"10px", fontWeight:"700",
        fontFamily:"monospace", padding:"2px 6px", zIndex:"999999", pointerEvents:"none" });
      inp.style.position = inp.style.position || "relative";
      inp.appendChild(il);
    }
  }, []);

  return (
    <div ref={crRef} style={{
      position: "fixed", inset: 0, zIndex: 10002,
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      background: "#F2F4F8",
    }}>
      <style>{CSS}</style>
      <div ref={headerRef}><ChatHeader conv={conv} onBack={onBack} onOpenProfile={onOpenProfile}/></div>

      {showEmpty
        ? <EmptyConvState name={conv?.name}/>
        : <ChatMessages messages={messages} typing={false} event={null}/>
      }

      <div ref={inputRef} style={{ flexShrink: 0 }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}

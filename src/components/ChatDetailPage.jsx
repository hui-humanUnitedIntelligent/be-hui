import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Check, CheckCheck, Paperclip, X, FileText, Image } from "lucide-react";
import { HuiPayment } from "@/api/entities";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const CORAL = "#FF6B5B"; const TEAL = "#2ABFAC"; const GOLD = "#F5A623";

export default function ChatDetailPage({ chat: initialChat, onBack }) {
  const [chat, setChat] = useState(initialChat);
  const [message, setMessage] = useState("");
  const [showEmpfehlung, setShowEmpfehlung] = useState(initialChat.status === "empfehlung_ausstehend");
  const [empfehlungText, setEmpfehlungText] = useState("");
  const [empfehlungAbgegeben, setEmpfehlungAbgegeben] = useState(false);
  const [dbMessages, setDbMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState("Gerade aktiv");
  const [attachments, setAttachments] = useState([]);
  const [readMsgIds, setReadMsgIds] = useState(new Set());
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatId = `chat_${initialChat.id}`;

  // Simulate wirker going offline after 8s
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOnline(false);
      setLastSeen("vor 2 Min. aktiv");
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate read receipts: mark outgoing messages as read after 2.5s
  useEffect(() => {
    const myMsgs = chat.messages.filter(m => m.from === "ich").map((_, i) => i);
    if (myMsgs.length === 0) return;
    const timer = setTimeout(() => {
      setReadMsgIds(new Set(chat.messages.map((_, i) => i)));
    }, 2500);
    return () => clearTimeout(timer);
  }, [chat.messages.length]);

  // Load messages from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(chatId) || "[]");
      setDbMessages(stored);
    } catch(e) {}
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, dbMessages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachments(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: ev.target.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const sendMessage = () => {
    if (!message.trim() && attachments.length === 0) return;
    const text = message.trim();
    const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const newMsg = { from: "ich", text, time, attachments: [...attachments] };
    setMessage("");
    setAttachments([]);

    // Save to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem(chatId) || "[]");
      const newStored = [...stored, { id: Date.now(), sender_name: "Ich", text, message_type: text ? "text" : "file", created_date: new Date().toISOString() }];
      localStorage.setItem(chatId, JSON.stringify(newStored));
      setDbMessages(newStored);
    } catch(e) {}

    setChat(c => ({ ...c, messages: [...c.messages, newMsg] }));
  };

  const handleEmpfehlung = async (empfohlen) => {
    const sysMsg = empfohlen
      ? { from: "system", text: `✅ Du hast ${chat.wirker} weiterempfohlen. Die Empfehlung wird in ihrem Profil veröffentlicht. Das Geld (${chat.betrag}) wurde freigegeben und überwiesen. Chat wird archiviert.`, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), isDone: true }
      : { from: "system", text: `⚠️ Dein Feedback wurde vertraulich an HUI-Admin und ${chat.wirker} weitergeleitet. Kein öffentlicher Eintrag. Ein Mitarbeiter meldet sich bei dir.`, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), isWarning: true };

    if (chat.paymentId) {
      try {
        await HuiPayment.update(chat.paymentId, {
          status: empfohlen ? "freigegeben" : "eingefroren",
          empfehlung: empfehlungText || (empfohlen ? "Empfohlen" : "Nicht empfohlen"),
        });
      } catch(e) {}
    }

    setChat(c => ({
      ...c,
      status: empfohlen ? "abgeschlossen" : "gemeldet",
      treuhand: empfohlen ? "freigegeben" : "eingefroren",
      bewertung: { empfohlen, text: empfehlungText },
      messages: [...c.messages, sysMsg]
    }));
    setShowEmpfehlung(false);
    setEmpfehlungAbgegeben(true);
  };

  const treuhandColor = chat.treuhand === "freigegeben" ? TEAL : chat.treuhand === "eingefroren" ? "#f59e0b" : CORAL;
  const treuhandLabel = chat.treuhand === "freigegeben" ? "✅ Freigegeben" : chat.treuhand === "eingefroren" ? "⏸ Eingefroren" : "🔒 Im Treuhand";

  const isImage = (type) => type && type.startsWith("image/");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f7f7f5" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={20} color="#444" />
        </button>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={chat.wirkerImg} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} alt={chat.wirker} />
          {/* Online indicator */}
          <div style={{
            position: "absolute", bottom: 1, right: 1,
            width: 11, height: 11, borderRadius: "50%",
            background: isOnline ? "#4ade80" : "#d1d5db",
            border: "2px solid white",
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{chat.wirker}</div>
          <div style={{ fontSize: 11, color: isOnline ? "#4ade80" : "#aaa", fontWeight: isOnline ? 600 : 400 }}>
            {isOnline ? "🟢 Online" : lastSeen}
          </div>
        </div>
        <div style={{ background: treuhandColor + "18", border: `1px solid ${treuhandColor}40`, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: treuhandColor }}>
          {treuhandLabel}
        </div>
      </div>

      {/* Treuhand-Info-Banner */}
      {chat.treuhand === "offen" && !empfehlungAbgegeben && (
        <div style={{ background: `${CORAL}0d`, borderBottom: `1px solid ${CORAL}20`, padding: "8px 16px", flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <span style={{ fontSize: 12, color: "#666" }}><strong style={{ color: CORAL }}>{chat.betrag}</strong> liegen sicher im Treuhandkonto — werden erst nach deiner Empfehlung freigegeben.</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {chat.messages.map((m, i) => {
          if (m.from === "system") return (
            <div key={i} style={{ textAlign: "center", margin: "10px 0" }}>
              <div style={{ display: "inline-block", background: m.isDone ? `${TEAL}15` : m.isWarning ? `${GOLD}15` : "#f0f0f0", borderRadius: 12, padding: "8px 14px", fontSize: 12, color: m.isDone ? TEAL : m.isWarning ? "#b45309" : "#666", maxWidth: "88%", lineHeight: 1.55 }}>
                {m.text}
              </div>
              <div style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>{m.time}</div>
            </div>
          );
          const isMe = m.from === "ich";
          const isRead = readMsgIds.has(i);
          return (
            <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
              {!isMe && <img src={chat.wirkerImg} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", marginRight: 8, marginTop: 2, flexShrink: 0 }} alt="" />}
              <div style={{ maxWidth: "72%" }}>
                {/* Text bubble */}
                {m.text ? (
                  <div style={{ background: isMe ? CORAL : "white", color: isMe ? "white" : "#222", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.55, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    {m.text}
                  </div>
                ) : null}
                {/* Attachments */}
                {(m.attachments || []).map((att, ai) => (
                  <div key={ai} style={{ marginTop: m.text ? 6 : 0 }}>
                    {isImage(att.type) ? (
                      <img src={att.dataUrl} alt={att.name}
                        style={{ maxWidth: "100%", borderRadius: 12, display: "block", maxHeight: 180, objectFit: "cover" }} />
                    ) : (
                      <div style={{ background: isMe ? `${CORAL}22` : "white", border: `1px solid ${isMe ? CORAL + "44" : "#eee"}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: isMe ? CORAL : `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={18} color={isMe ? "white" : TEAL} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: isMe ? CORAL : "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{att.name}</div>
                          <div style={{ fontSize: 10, color: "#aaa" }}>{formatFileSize(att.size)}</div>
                        </div>
                        <a href={att.dataUrl} download={att.name} style={{ color: isMe ? CORAL : TEAL, fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>↓</a>
                      </div>
                    )}
                  </div>
                ))}
                {/* Time + read receipt */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <span style={{ fontSize: 10, color: "#ccc" }}>{m.time}</span>
                  {isMe && (
                    isRead
                      ? <CheckCheck size={12} color={TEAL} />
                      : <Check size={12} color="#ccc" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Empfehlungs-Modal */}
      {showEmpfehlung && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 430 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              <img src={chat.wirkerImg} alt={chat.wirker} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${TEAL}`, marginBottom: 10 }} />
              <div style={{ fontWeight: 800, fontSize: 20, color: "#222", textAlign: "center" }}>
                {chat.type === "werk" ? "Ware angekommen?" : "Leistung abgeschlossen?"}
              </div>
              <div style={{ fontSize: 14, color: "#888", marginTop: 6, textAlign: "center", lineHeight: 1.55 }}>
                Möchtest du <strong style={{ color: "#333" }}>{chat.wirker}</strong> weiterempfehlen?<br />
                <span style={{ fontSize: 12, color: "#bbb" }}>Deine Empfehlung gibt das Geld frei und erscheint verifiziert im Profil.</span>
              </div>
            </div>
            <textarea value={empfehlungText} onChange={e => setEmpfehlungText(e.target.value)}
              placeholder={`Was hat dich an ${chat.wirker} begeistert? (optional)`}
              rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${TEAL}30`, fontSize: 13, resize: "none", fontFamily: "inherit", marginBottom: 16, outline: "none", background: "#f9fffe", boxSizing: "border-box" }} />
            <button onClick={() => handleEmpfehlung(true)}
              style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, #10b981)`, color: "white", border: "none", borderRadius: 16, padding: "15px", fontWeight: 800, fontSize: 16, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <ThumbsUp size={20} color="white" /> Ja, ich empfehle {chat.wirker}!
            </button>
            <button onClick={() => handleEmpfehlung(false)}
              style={{ width: "100%", background: "#f5f5f3", color: "#666", border: "1.5px solid #e0e0e0", borderRadius: 16, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ThumbsDown size={16} color="#aaa" /> Nicht empfehlen / Problem melden
            </button>
          </div>
        </div>
      )}

      {/* Abgeschlossener Chat */}
      {(chat.status === "abgeschlossen" || chat.status === "gemeldet") && !showEmpfehlung && (
        <div style={{ background: chat.status === "abgeschlossen" ? `${TEAL}10` : `${GOLD}10`, borderTop: `1px solid ${chat.status === "abgeschlossen" ? TEAL : GOLD}30`, padding: "12px 16px", flexShrink: 0, textAlign: "center", fontSize: 12, color: chat.status === "abgeschlossen" ? TEAL : "#b45309", fontWeight: 600 }}>
          {chat.status === "abgeschlossen" ? "✅ Abgeschlossen – Geld wurde freigegeben" : "⚠️ Feedback weitergeleitet – HUI meldet sich"}
        </div>
      )}

      {/* Input */}
      {chat.status === "aktiv" && (
        <div style={{ background: "white", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
          {/* Leistung-abgeschlossen Button */}
          {chat.treuhand === "offen" && !empfehlungAbgegeben && (
            <div style={{ padding: "10px 16px 0" }}>
              <button onClick={() => setShowEmpfehlung(true)}
                style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}18, ${TEAL}08)`, border: `1.5px solid ${TEAL}40`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: TEAL }}>
                  {chat.type === "werk" ? "📦 Ware erhalten – Empfehlung abgeben" : "✅ Leistung erhalten – Empfehlung abgeben"}
                </span>
              </button>
            </div>
          )}

          {/* Attachment preview */}
          {attachments.length > 0 && (
            <div style={{ padding: "8px 16px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {attachments.map(att => (
                <div key={att.id} style={{ position: "relative", background: "#f5f5f3", borderRadius: 10, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, border: "1px solid #e8e8e8" }}>
                  {isImage(att.type)
                    ? <img src={att.dataUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                    : <FileText size={16} color={TEAL} />
                  }
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#333", maxWidth: 100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{att.name}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>{formatFileSize(att.size)}</div>
                  </div>
                  <button onClick={() => removeAttachment(att.id)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: CORAL, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={10} color="white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: "8px 16px 24px", display: "flex", gap: 8, alignItems: "flex-end" }}>
            {/* Attach button */}
            <button onClick={() => fileInputRef.current?.click()}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "#f3f3f3", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Paperclip size={17} color="#888" />
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: "none" }} onChange={handleFileSelect} />

            <input value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Nachricht schreiben..."
              style={{ flex: 1, padding: "11px 16px", borderRadius: 24, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", background: "#f9f9f7" }} />

            <button onClick={sendMessage} disabled={!message.trim() && attachments.length === 0}
              style={{ width: 42, height: 42, borderRadius: "50%", background: (message.trim() || attachments.length > 0) ? CORAL : "#e8e8e8", border: "none", cursor: (message.trim() || attachments.length > 0) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Send size={17} color={(message.trim() || attachments.length > 0) ? "white" : "#bbb"} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
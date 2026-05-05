import { mockChats } from "../lib/mockData";
import React, { useState, useEffect, useRef } from "react";
import { Plus, Check, ArrowLeft, Send, MessageCircle, ThumbsUp, ThumbsDown, Info } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

function ChatListPage({ onOpenChat, onBack }) {
  const [chats, setChats] = useState(mockChats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load real chats from HuiPayment (each payment = a chat thread)
    async function loadChats() {
      setLoading(true);
      try {
        const payments = await HuiPayment.list().catch(() => []);
        if (payments && payments.length > 0) {
          const realChats = payments.map(p => ({
            id: p.id,
            type: p.item_type === "werk" ? "werk" : "buchung",
            status: p.empfehlung === "empfohlen" ? "abgeschlossen" : p.empfehlung === "ausstehend" ? "empfehlung_ausstehend" : "aktiv",
            wirker: p.wirker_name || "Unbekannt",
            wirkerImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
            item: p.item_name || "Buchung",
            date: new Date(p.created_date || p.created_at || Date.now()).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }),
            betrag: parseFloat(p.amount_eur || 0).toFixed(2) + " €",
            treuhand: p.status === "ausgezahlt" ? "freigegeben" : "offen",
            bewertung: p.empfehlung === "empfohlen" ? { empfohlen: true, text: "" } : null,
            paymentId: p.id,
            messages: [
              { from: "system", text: "🔒 Buchung bestätigt! Dein Geld liegt sicher im Treuhandkonto. Es wird erst nach deiner Bestätigung freigegeben.", time: new Date(p.created_date || Date.now()).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) },
            ]
          }));
          // Merge with mock chats for demo richness
          setChats([...realChats, ...mockChats]);
        }
      } catch(e) {}
      setLoading(false);
    }
    loadChats();
  }, []);

  const statusLabel = (c) => {
    if (c.status === "abgeschlossen") return { label: "✅ Abgeschlossen", color: TEAL };
    if (c.status === "empfehlung_ausstehend") return { label: "⚠️ Empfehlung ausstehend", color: GOLD };
    return { label: "💬 Aktiv", color: CORAL };
  };
  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={20} color="#444" />
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#222", marginBottom: 2 }}>💬 Meine Chats</div>
          <div style={{ fontSize: 13, color: "#aaa" }}>Buchungen, Käufe & Treuhand-Status</div>
        </div>
      </div>

      {chats.map(c => {
        const sl = statusLabel(c);
        return (
          <div key={c.id} onClick={() => onOpenChat(c)} style={{ margin: "0 16px 12px", background: "white", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: `1px solid ${c.status === "empfehlung_ausstehend" ? GOLD + "50" : "#f0f0f0"}`, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={c.wirkerImg} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} alt={c.wirker} />
              {c.status === "empfehlung_ausstehend" && <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: "50%", background: GOLD, border: "2px solid white" }} />}
              {c.status === "aktiv" && <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: "50%", background: "#4ade80", border: "2px solid white" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{c.wirker}</div>
                <div style={{ fontSize: 11, color: "#ccc" }}>{c.date}</div>
              </div>
              <div style={{ fontSize: 13, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 5 }}>{c.item}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: sl.color }}>{sl.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: CORAL }}>🔒 {c.betrag}</div>
              </div>
            </div>
          </div>
        );
      })}

      {chats.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>💬</div>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#333", marginBottom: 6 }}>Noch keine Chats</div>
          <div style={{ fontSize: 13, color: "#aaa" }}>Nach einer Buchung oder einem Kauf öffnet sich hier automatisch ein Chat.</div>
        </div>
      )}
    </div>
  );
}

function ChatDetailPage({ chat: initialChat, onBack }) {
  // Kompatibilität mit wirkerName und wirker
  const chatWirkerName = chat.wirkerName || chatWirkerName || "Wirker";
  const [chat, setChat] = useState(initialChat);
  const [message, setMessage] = useState("");
  const [showEmpfehlung, setShowEmpfehlung] = useState(chat.status === "empfehlung_ausstehend");
  const [empfehlungText, setEmpfehlungText] = useState("");
  const [empfehlungAbgegeben, setEmpfehlungAbgegeben] = useState(false);
  const [dbMessages, setDbMessages] = useState([]);
  const messagesEndRef = React.useRef(null);
  const chatId = `chat_${initialChat.id}`;

  // Nachrichten aus localStorage laden
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(chatId) || "[]");
      setDbMessages(stored);
    } catch(e) {}
  }, [chatId]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, dbMessages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const text = message.trim();
    setMessage("");
    // In localStorage speichern
    try {
      const stored = JSON.parse(localStorage.getItem(chatId) || "[]");
      const newStored = [...stored, { id: Date.now(), sender_name: "Ich", text, message_type: "text", created_date: new Date().toISOString() }];
      localStorage.setItem(chatId, JSON.stringify(newStored));
      setDbMessages(newStored);
    } catch(e) {}
    const newMsg = { from: "ich", text, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) };
    setChat(c => ({ ...c, messages: [...c.messages, newMsg] }));
    setMessage("");
  };

  const handleEmpfehlung = async (empfohlen) => {
    const sysMsg = empfohlen
      ? { from: "system", text: `✅ Du hast ${chatWirkerName} weiterempfohlen. Die Empfehlung wird in ihrem Profil veröffentlicht. Das Geld (${chat.betrag}) wurde freigegeben und überwiesen. Chat wird archiviert.`, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), isDone: true }
      : { from: "system", text: `⚠️ Dein Feedback wurde vertraulich an HUI-Admin und ${chatWirkerName} weitergeleitet. Kein öffentlicher Eintrag. Ein Mitarbeiter meldet sich bei dir.`, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), isWarning: true };

    // Echte HuiPayment in der DB aktualisieren
    if (chat.paymentId) {
      try {
        await HuiPayment.update(chat.paymentId, {
          status: empfohlen ? "freigegeben" : "eingefroren",
          empfehlung: empfehlungText || (empfohlen ? "Empfohlen" : "Nicht empfohlen"),
        });
      } catch(e) { console.log("Payment update error:", e); }
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f7f7f5" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={20} color="#444" />
        </button>
        <img src={chatWirkerNameImg} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} alt={chatWirkerName} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{chatWirkerName}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{chat.item}</div>
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
              <div style={{ display: "inline-block", background: m.isDone ? `${TEAL}15` : m.isWarning ? `${GOLD}15` : m.isPrompt ? `${GOLD}15` : "#f0f0f0", borderRadius: 12, padding: "8px 14px", fontSize: 12, color: m.isDone ? TEAL : m.isWarning ? "#b45309" : "#666", maxWidth: "88%", lineHeight: 1.55 }}>
                {m.text}
              </div>
              <div style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>{m.time}</div>
            </div>
          );
          const isMe = m.from === "ich";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
              {!isMe && <img src={chatWirkerNameImg} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", marginRight: 8, marginTop: 2, flexShrink: 0 }} alt="" />}
              <div style={{ maxWidth: "72%" }}>
                <div style={{ background: isMe ? CORAL : "white", color: isMe ? "white" : "#222", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.55, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  {m.text}
                </div>
                <div style={{ fontSize: 10, color: "#ccc", marginTop: 3, textAlign: isMe ? "right" : "left" }}>{m.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Empfehlungs-Modal – öffnet sich nach Leistungserbringung */}
      {showEmpfehlung && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 430, boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}>
            {/* Wirker-Avatar + Name */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              <img src={chatWirkerNameImg} alt={chatWirkerName} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${TEAL}`, marginBottom: 10 }} />
              <div style={{ fontWeight: 800, fontSize: 20, color: "#222", textAlign: "center" }}>
                {chat.type === "werk" ? "Ware angekommen?" : "Leistung abgeschlossen?"}
              </div>
              <div style={{ fontSize: 14, color: "#888", marginTop: 6, textAlign: "center", lineHeight: 1.55 }}>
                Möchtest du <strong style={{ color: "#333" }}>{chatWirkerName}</strong> weiterempfehlen?<br />
                <span style={{ fontSize: 12, color: "#bbb" }}>Deine Empfehlung gibt das Geld frei und erscheint verifiziert im Profil.</span>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={empfehlungText}
              onChange={e => setEmpfehlungText(e.target.value)}
              placeholder={`Was hat dich an ${chatWirkerName} begeistert? (optional, wird öffentlich angezeigt)`}
              rows={3}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${TEAL}30`, fontSize: 13, resize: "none", fontFamily: "inherit", marginBottom: 16, outline: "none", background: "#f9fffe", boxSizing: "border-box" }}
            />

            {/* Buttons */}
            <button
              onClick={() => handleEmpfehlung(true)}
              style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, #10b981)`, color: "white", border: "none", borderRadius: 16, padding: "15px", fontWeight: 800, fontSize: 16, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              <ThumbsUp size={20} color="white" /> Ja, ich empfehle {chatWirkerName}!
            </button>
            <button
              onClick={() => handleEmpfehlung(false)}
              style={{ width: "100%", background: "#f5f5f3", color: "#666", border: "1.5px solid #e0e0e0", borderRadius: 16, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <ThumbsDown size={16} color="#aaa" /> Nicht empfehlen / Problem melden
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#bbb" }}>
              🔒 Deine Antwort ist anonym für andere Nutzer — nur HUI sieht dein Feedback intern.
            </div>
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
              <button
                onClick={() => setShowEmpfehlung(true)}
                style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}18, ${TEAL}08)`, border: `1.5px solid ${TEAL}40`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", marginBottom: 6 }}
              >
                <Check size={16} color={TEAL} />
                <span style={{ fontWeight: 700, fontSize: 13, color: TEAL }}>
                  {chat.type === "werk" ? "📦 Ware erhalten – Empfehlung abgeben" : "✅ Leistung erhalten – Empfehlung abgeben"}
                </span>
              </button>
            </div>
          )}
          <div style={{ padding: "8px 16px 24px", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Nachricht schreiben..."
            style={{ flex: 1, padding: "11px 16px", borderRadius: 24, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", background: "#f9f9f7" }} />
          <button onClick={sendMessage} disabled={!message.trim()} style={{ width: 42, height: 42, borderRadius: "50%", background: message.trim() ? CORAL : "#e8e8e8", border: "none", cursor: message.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={17} color={message.trim() ? "white" : "#bbb"} />
          </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CREATE SHEET — Plus-Button Aktionen

export { ChatListPage, ChatDetailPage };

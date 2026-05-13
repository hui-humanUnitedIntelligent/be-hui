// MeinHUI_SubPages.jsx — HUI Sub-Page Router
// Öffnet sich als Full-Screen Overlay, bleibt im HUI-Design
// Verwendet bestehende Supabase-Tabellen

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#10B981", greenPale:"#ECFDF5",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#C0C0C0", border:"rgba(0,0,0,0.06)",
  red:"#EF4444", redPale:"rgba(239,68,68,0.08)",
};

const CSS = `
  @keyframes subPageIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes subPulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes subSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .sp-scroll::-webkit-scrollbar{display:none}
  .sp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .sp-tap{transition:transform .15s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent;border:none;cursor:pointer;font-family:inherit;background:none}
  .sp-tap:active{transform:scale(.95)}
  .sp-menuitem:last-child{border-bottom:none!important}
`;

// ── Shared UI ─────────────────────────────────────────────────────────

function PageShell({ title, onBack, children, noPad=false }) {
  return (
    <>
      <style>{CSS}</style>
      <div className="sp-scroll" style={{
        position:"fixed", inset:0, zIndex:200,
        background:C.cream, overflowY:"auto",
        animation:"subPageIn .25s ease both",
      }}>
        {/* Header */}
        <div style={{
          background:C.card, borderBottom:`1px solid ${C.border}`,
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
          display:"flex", alignItems:"center", gap:14,
          position:"sticky", top:0, zIndex:10,
        }}>
          <button className="sp-tap" onClick={onBack}
            style={{ width:36,height:36,borderRadius:10,
              background:C.cream, border:`1px solid ${C.border}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,color:C.ink2, flexShrink:0 }}>
            ←
          </button>
          <span style={{ fontSize:17,fontWeight:800,color:C.ink,letterSpacing:-.3 }}>
            {title}
          </span>
        </div>
        <div style={noPad ? {} : { padding:"16px 16px max(100px,env(safe-area-inset-bottom,100px))" }}>
          {children}
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return <div style={{ width:20,height:20,borderRadius:"50%",
    border:`2px solid ${C.teal}`,borderTopColor:"transparent",
    animation:"subSpin .7s linear infinite",margin:"40px auto",display:"block" }}/>;
}

function EmptyMsg({ icon, text }) {
  return (
    <div style={{ textAlign:"center",padding:"48px 24px",color:C.muted }}>
      <div style={{ fontSize:32,marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:14 }}>{text}</div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex",gap:4,background:"rgba(0,0,0,0.05)",
      borderRadius:50,padding:3,marginBottom:16 }}>
      {tabs.map(t => (
        <button key={t.key} className="sp-tap"
          onClick={() => onChange(t.key)}
          style={{ flex:1,padding:"8px 4px",borderRadius:50,
            background: active===t.key ? `linear-gradient(135deg,${C.teal},${C.coral})` : "transparent",
            color: active===t.key ? "white" : C.muted,
            fontSize:13,fontWeight:700 }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:C.card,borderRadius:16,
      boxShadow:"0 1px 6px rgba(0,0,0,0.05)",
      border:`1px solid ${C.border}`,
      marginBottom:10, ...style }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 1. BESTELLUNGEN & BUCHUNGEN
// ══════════════════════════════════════════════════════════════════════
export function BestellungenPage({ onBack, onOpenChat }) {
  const { user } = useAuth();
  const [tab,      setTab]      = useState("offen");
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { load(); }, [tab, user?.id]);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const statusMap = {
      offen:        ["pending","requested"],
      aktiv:        ["confirmed","in_progress"],
      abgeschlossen:["completed","cancelled","declined"],
    };
    const { data } = await supabase
      .from("bookings")
      .select(`id, status, amount, created_at, notes,
        wirker_id, buyer_id,
        work_id, experience_id,
        works(title, cover_url),
        experiences(title, cover_url)`)
      .or(`buyer_id.eq.${user.id},wirker_id.eq.${user.id}`)
      .in("status", statusMap[tab])
      .order("created_at", { ascending:false });
    setItems(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    load();
  }

  const STATUS_LABEL = {
    pending:"Anfrage", requested:"Angefragt",
    confirmed:"Bestätigt", in_progress:"Läuft",
    completed:"Abgeschlossen", cancelled:"Storniert", declined:"Abgelehnt",
  };
  const STATUS_COLOR = {
    pending:C.gold, requested:C.gold,
    confirmed:C.teal, in_progress:C.teal,
    completed:C.green, cancelled:C.muted, declined:C.red,
  };

  const isWirker = (b) => b.wirker_id === user?.id;

  return (
    <PageShell title="Bestellungen & Buchungen" onBack={onBack}>
      <Tabs
        tabs={[
          {key:"offen",         label:"Offen"},
          {key:"aktiv",         label:"Aktiv"},
          {key:"abgeschlossen", label:"Fertig"},
        ]}
        active={tab} onChange={setTab}
      />
      {loading ? <Spinner/> : items.length === 0
        ? <EmptyMsg icon="📦" text="Keine Einträge in diesem Bereich"/>
        : items.map(b => {
          const title = b.works?.title || b.experiences?.title || "Buchung";
          const cover = b.works?.cover_url || b.experiences?.cover_url;
          const date  = new Date(b.created_at).toLocaleDateString("de-DE",{day:"numeric",month:"short"});
          const color = STATUS_COLOR[b.status] || C.muted;
          return (
            <Card key={b.id}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                  {cover && (
                    <img src={cover} alt="" style={{ width:52,height:52,
                      borderRadius:10,objectFit:"cover",flexShrink:0 }}/>
                  )}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:14,color:C.ink,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {title}
                    </div>
                    <div style={{ display:"flex",gap:8,alignItems:"center",marginTop:4 }}>
                      <span style={{ fontSize:11,fontWeight:700,color,
                        background:`${color}15`,borderRadius:50,padding:"2px 8px" }}>
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                      <span style={{ fontSize:12,color:C.muted }}>{date}</span>
                      {b.amount && (
                        <span style={{ fontSize:12,fontWeight:700,color:C.teal }}>
                          € {Number(b.amount).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                {(tab === "offen" && isWirker(b)) && (
                  <div style={{ display:"flex",gap:8,marginTop:12 }}>
                    <button className="sp-tap" onClick={() => updateStatus(b.id,"confirmed")}
                      style={{ flex:1,padding:"10px",borderRadius:50,
                        background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                        color:"white",fontSize:13,fontWeight:700 }}>
                      ✓ Bestätigen
                    </button>
                    <button className="sp-tap" onClick={() => updateStatus(b.id,"declined")}
                      style={{ flex:1,padding:"10px",borderRadius:50,
                        background:C.redPale, border:`1px solid ${C.red}33`,
                        color:C.red,fontSize:13,fontWeight:700 }}>
                      ✕ Ablehnen
                    </button>
                  </div>
                )}
                {tab === "aktiv" && (
                  <div style={{ display:"flex",gap:8,marginTop:12 }}>
                    <button className="sp-tap"
                      onClick={() => onOpenChat?.({ booking_id:b.id, partner_id: isWirker(b) ? b.buyer_id : b.wirker_id })}
                      style={{ flex:1,padding:"10px",borderRadius:50,
                        background:C.cream, border:`1px solid ${C.border}`,
                        color:C.ink2,fontSize:13,fontWeight:700 }}>
                      💬 Chat öffnen
                    </button>
                    {isWirker(b) && (
                      <button className="sp-tap" onClick={() => updateStatus(b.id,"completed")}
                        style={{ flex:1,padding:"10px",borderRadius:50,
                          background:`linear-gradient(135deg,${C.green},#0ea070)`,
                          color:"white",fontSize:13,fontWeight:700 }}>
                        ✓ Abschließen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })
      }
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 2. NACHRICHTEN / CHAT
// ══════════════════════════════════════════════════════════════════════
export function NachrichtenPage({ onBack }) {
  const { user } = useAuth();
  const [chats,    setChats]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [openChat, setOpenChat] = useState(null);

  useEffect(() => { loadChats(); }, [user?.id]);

  async function loadChats() {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("chats")
      .select(`id, created_at, booking_id,
        user1_id, user2_id,
        messages(text, created_at, sender_id, read)`)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("created_at", { ascending:false });
    setChats(data || []);
    setLoading(false);
  }

  if (openChat) {
    return <ChatDetailView chat={openChat} userId={user?.id}
      onBack={() => { setOpenChat(null); loadChats(); }}/>;
  }

  return (
    <PageShell title="Nachrichten" onBack={onBack}>
      {loading ? <Spinner/> : chats.length === 0
        ? <EmptyMsg icon="💬" text="Noch keine Unterhaltungen"/>
        : chats.map(chat => {
          const msgs    = chat.messages || [];
          const lastMsg = msgs[msgs.length-1];
          const unread  = msgs.filter(m => m.sender_id !== user?.id && !m.read).length;
          const partner = chat.user1_id === user?.id ? chat.user2_id : chat.user1_id;
          return (
            <Card key={chat.id}>
              <button className="sp-tap" onClick={() => setOpenChat(chat)}
                style={{ width:"100%",padding:"14px 16px",display:"flex",
                  alignItems:"center",gap:12,background:"none",border:"none",
                  cursor:"pointer",fontFamily:"inherit",textAlign:"left" }}>
                <div style={{ width:44,height:44,borderRadius:"50%",flexShrink:0,
                  background:`linear-gradient(135deg,${C.teal}44,${C.coral}33)`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,fontWeight:800,color:C.teal,
                  border:`1.5px solid ${C.border}` }}>
                  💬
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:C.ink,marginBottom:2 }}>
                    Chat {chat.booking_id ? "· Buchung" : ""}
                  </div>
                  {lastMsg && (
                    <div style={{ fontSize:13,color:C.muted,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {lastMsg.text || "📎 Bild"}
                    </div>
                  )}
                </div>
                {unread > 0 && (
                  <div style={{ minWidth:20,height:20,borderRadius:10,
                    background:C.coral,color:"white",
                    fontSize:11,fontWeight:800,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    padding:"0 5px",flexShrink:0 }}>
                    {unread}
                  </div>
                )}
              </button>
            </Card>
          );
        })
      }
    </PageShell>
  );
}

function ChatDetailView({ chat, userId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Realtime
    const sub = supabase.channel(`chat-${chat.id}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages",
        filter:`chat_id=eq.${chat.id}` }, payload => {
        setMessages(m => [...m, payload.new]);
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [chat.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending:true });
    setMessages(data || []);
    // Mark as read
    await supabase.from("messages")
      .update({ read:true })
      .eq("chat_id", chat.id)
      .neq("sender_id", userId);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      chat_id:    chat.id,
      sender_id:  userId,
      text:       text.trim(),
      read:       false,
    });
    setText("");
    setSending(false);
  }

  async function sendImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    const ext  = file.name.split(".").pop();
    const path = `chats/${chat.id}/${Date.now()}.${ext}`;
    const { data:up, error } = await supabase.storage
      .from("media").upload(path, file);
    if (!error) {
      const { data:{ publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      await supabase.from("messages").insert({
        chat_id:   chat.id,
        sender_id: userId,
        text:      "",
        image_url: publicUrl,
        read:      false,
      });
    }
    setSending(false);
    e.target.value = "";
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:"fixed",inset:0,zIndex:210,
        background:C.cream,display:"flex",flexDirection:"column" }}>
        {/* Header */}
        <div style={{ background:C.card,borderBottom:`1px solid ${C.border}`,
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 14px",
          display:"flex",alignItems:"center",gap:14,flexShrink:0 }}>
          <button className="sp-tap" onClick={onBack}
            style={{ width:36,height:36,borderRadius:10,background:C.cream,
              border:`1px solid ${C.border}`,display:"flex",
              alignItems:"center",justifyContent:"center",fontSize:18,color:C.ink2 }}>
            ←
          </button>
          <span style={{ fontSize:16,fontWeight:800,color:C.ink }}>Unterhaltung</span>
        </div>

        {/* Messages */}
        <div className="sp-scroll" style={{ flex:1,overflowY:"auto",padding:"16px" }}>
          {messages.map((msg,i) => {
            const mine = msg.sender_id === userId;
            return (
              <div key={msg.id||i} style={{ display:"flex",
                justifyContent: mine ? "flex-end" : "flex-start",
                marginBottom:8 }}>
                <div style={{ maxWidth:"75%",
                  background: mine ? `linear-gradient(135deg,${C.teal},${C.teal2})` : C.card,
                  borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding:"10px 14px",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
                  border: mine ? "none" : `1px solid ${C.border}` }}>
                  {msg.image_url && (
                    <img src={msg.image_url} alt=""
                      style={{ maxWidth:"100%",borderRadius:10,display:"block",marginBottom: msg.text ? 6:0 }}/>
                  )}
                  {msg.text && (
                    <span style={{ fontSize:14,
                      color: mine ? "white" : C.ink,lineHeight:1.5 }}>
                      {msg.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{ background:C.card,borderTop:`1px solid ${C.border}`,
          padding:"12px 16px max(20px,env(safe-area-inset-bottom,20px))",
          display:"flex",gap:10,alignItems:"center",flexShrink:0 }}>
          <label className="sp-tap" style={{ width:36,height:36,borderRadius:10,
            background:C.cream,border:`1px solid ${C.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,cursor:"pointer",flexShrink:0 }}>
            📎
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={sendImage}/>
          </label>
          <input value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendMessage()}
            placeholder="Nachricht…"
            style={{ flex:1,padding:"10px 14px",borderRadius:50,
              border:`1px solid ${C.border}`,background:C.cream,
              fontSize:14,color:C.ink,outline:"none",fontFamily:"inherit" }}/>
          <button className="sp-tap" onClick={sendMessage} disabled={!text.trim()||sending}
            style={{ width:36,height:36,borderRadius:"50%",flexShrink:0,
              background: text.trim()
                ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                : "rgba(0,0,0,0.06)",
              border:"none",display:"flex",
              alignItems:"center",justifyContent:"center",
              color: text.trim() ? "white" : C.muted,fontSize:16 }}>
            ➤
          </button>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 3. GESPEICHERTE INHALTE
// ══════════════════════════════════════════════════════════════════════
export function GespeichertePage({ onBack }) {
  const { user } = useAuth();
  const [tab,     setTab]     = useState("werke");
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [tab, user?.id]);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    if (tab === "werke") {
      const { data } = await supabase
        .from("favorites")
        .select("id, created_at, work_id, works(id,title,cover_url,price,user_id)")
        .eq("user_id", user.id).not("work_id","is",null)
        .order("created_at",{ascending:false});
      setItems((data||[]).map(f => ({ ...f.works, fav_id:f.id })));
    } else if (tab === "erlebnisse") {
      const { data } = await supabase
        .from("favorites")
        .select("id, created_at, experience_id, experiences(id,title,cover_url,price)")
        .eq("user_id", user.id).not("experience_id","is",null)
        .order("created_at",{ascending:false});
      setItems((data||[]).map(f => ({ ...f.experiences, fav_id:f.id })));
    } else {
      const { data } = await supabase
        .from("likes")
        .select("id, created_at, post_id, feed_items(id,title,media_url,type)")
        .eq("user_id", user.id)
        .order("created_at",{ascending:false});
      setItems((data||[]).map(l => ({ ...l.feed_items, like_id:l.id })));
    }
    setLoading(false);
  }

  async function removeFav(id) {
    const table = tab === "likes" ? "likes" : "favorites";
    const key   = tab === "likes" ? "like_id" : "fav_id";
    await supabase.from(table).delete().eq("id", items.find(i=>i.id===id)?.[key]);
    setItems(prev => prev.filter(i=>i.id!==id));
  }

  return (
    <PageShell title="Gespeicherte Inhalte" onBack={onBack}>
      <Tabs
        tabs={[
          {key:"werke",      label:"Werke"},
          {key:"erlebnisse", label:"Erlebnisse"},
          {key:"likes",      label:"Geliked"},
        ]}
        active={tab} onChange={setTab}
      />
      {loading ? <Spinner/> : items.length === 0
        ? <EmptyMsg icon="❤️" text="Noch nichts gespeichert"/>
        : (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {items.map(item => (
              <div key={item.id} style={{ background:C.card,borderRadius:14,
                overflow:"hidden",border:`1px solid ${C.border}`,
                boxShadow:"0 1px 6px rgba(0,0,0,0.05)",position:"relative" }}>
                {(item.cover_url||item.media_url) && (
                  <img src={item.cover_url||item.media_url} alt=""
                    style={{ width:"100%",height:110,objectFit:"cover",display:"block" }}/>
                )}
                <div style={{ padding:"8px 10px 10px" }}>
                  <div style={{ fontSize:12,fontWeight:700,color:C.ink,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {item.title || "Inhalt"}
                  </div>
                  {item.price != null && (
                    <div style={{ fontSize:12,fontWeight:800,color:C.teal,marginTop:2 }}>
                      € {Number(item.price).toFixed(0)}
                    </div>
                  )}
                </div>
                <button className="sp-tap" onClick={() => removeFav(item.id)}
                  style={{ position:"absolute",top:6,right:6,width:26,height:26,
                    borderRadius:"50%",background:"rgba(0,0,0,0.45)",
                    border:"none",color:"white",fontSize:12,
                    display:"flex",alignItems:"center",justifyContent:"center" }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )
      }
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 4. MEINE INHALTE
// ══════════════════════════════════════════════════════════════════════
export function MeineInhaltePage({ onBack }) {
  const { user } = useAuth();
  const [tab,     setTab]     = useState("werke");
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [tab, user?.id]);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const tableMap = { werke:"works", erlebnisse:"experiences", storys:"stories" };
    const table    = tableMap[tab];
    if (!table) { setItems([]); setLoading(false); return; }
    const { data } = await supabase.from(table)
      .select("id, title, cover_url, media_url, status, created_at, price")
      .eq("user_id", user.id)
      .order("created_at",{ascending:false});
    setItems(data || []);
    setLoading(false);
  }

  async function updateItemStatus(id, status) {
    const tableMap = { werke:"works", erlebnisse:"experiences", storys:"stories" };
    await supabase.from(tableMap[tab]).update({ status }).eq("id", id);
    load();
  }

  async function deleteItem(id) {
    if (!window.confirm("Wirklich löschen?")) return;
    const tableMap = { werke:"works", erlebnisse:"experiences", storys:"stories" };
    await supabase.from(tableMap[tab]).delete().eq("id", id);
    setItems(p => p.filter(i => i.id !== id));
  }

  const STATUS_COLOR = {
    published:C.green, draft:C.gold, archived:C.muted, active:C.teal,
  };
  const STATUS_LABEL = {
    published:"Öffentlich", draft:"Entwurf", archived:"Archiviert", active:"Aktiv",
  };

  return (
    <PageShell title="Meine Inhalte" onBack={onBack}>
      <Tabs
        tabs={[
          {key:"werke",      label:"Werke"},
          {key:"erlebnisse", label:"Erlebnisse"},
          {key:"storys",     label:"Storys"},
        ]}
        active={tab} onChange={setTab}
      />
      {loading ? <Spinner/> : items.length === 0
        ? <EmptyMsg icon="🎨" text="Noch keine Inhalte in diesem Bereich"/>
        : items.map(item => {
          const img   = item.cover_url || item.media_url;
          const color = STATUS_COLOR[item.status] || C.muted;
          const date  = new Date(item.created_at).toLocaleDateString("de-DE",{day:"numeric",month:"short"});
          return (
            <Card key={item.id}>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                  {img && (
                    <img src={img} alt="" style={{ width:46,height:46,
                      borderRadius:10,objectFit:"cover",flexShrink:0 }}/>
                  )}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:14,color:C.ink,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {item.title || "Ohne Titel"}
                    </div>
                    <div style={{ display:"flex",gap:6,alignItems:"center",marginTop:3 }}>
                      <span style={{ fontSize:11,fontWeight:700,color,
                        background:`${color}15`,borderRadius:50,padding:"2px 7px" }}>
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                      <span style={{ fontSize:11,color:C.muted }}>{date}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                    {item.status !== "published" && item.status !== "active" && (
                      <button className="sp-tap" onClick={() => updateItemStatus(item.id,"published")}
                        style={{ padding:"6px 10px",borderRadius:50,
                          background:`${C.teal}15`,border:`1px solid ${C.teal}33`,
                          color:C.teal,fontSize:12,fontWeight:700 }}>
                        Pub.
                      </button>
                    )}
                    {item.status !== "archived" && (
                      <button className="sp-tap" onClick={() => updateItemStatus(item.id,"archived")}
                        style={{ padding:"6px 10px",borderRadius:50,
                          background:C.cream,border:`1px solid ${C.border}`,
                          color:C.muted,fontSize:12,fontWeight:700 }}>
                        Arch.
                      </button>
                    )}
                    <button className="sp-tap" onClick={() => deleteItem(item.id)}
                      style={{ width:32,height:32,borderRadius:"50%",
                        background:C.redPale,border:`1px solid ${C.red}22`,
                        color:C.red,fontSize:14,
                        display:"flex",alignItems:"center",justifyContent:"center" }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      }
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 5. ANALYTICS
// ══════════════════════════════════════════════════════════════════════
export function AnalyticsPage({ onBack }) {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    async function load() {
      const [profileRes, likesRes, savesRes, salesRes, bookRes] = await Promise.all([
        supabase.from("profiles").select("profile_views, follower_count").eq("id",user.id).single(),
        supabase.from("likes").select("id",{count:"exact"})
          .in("post_id",
            (await supabase.from("feed_items").select("id").eq("user_id",user.id)).data?.map(f=>f.id)||[]
          ),
        supabase.from("favorites").select("id",{count:"exact"})
          .in("work_id",
            (await supabase.from("works").select("id").eq("user_id",user.id)).data?.map(w=>w.id)||[]
          ),
        supabase.from("bookings").select("amount")
          .eq("wirker_id",user.id).eq("status","completed"),
        supabase.from("bookings").select("id",{count:"exact"})
          .eq("wirker_id",user.id),
      ]);
      const revenue = (salesRes.data||[]).reduce((s,b)=>s+(+b.amount||0),0) * 0.85;
      setStats({
        views:    profileRes.data?.profile_views    || 0,
        followers:profileRes.data?.follower_count   || 0,
        likes:    likesRes.count                    || 0,
        saves:    savesRes.count                    || 0,
        revenue:  revenue.toFixed(2),
        bookings: bookRes.count                     || 0,
      });
      setLoading(false);
    }
    load();
  }, [user?.id]);

  const STAT_ROWS = stats ? [
    { icon:"👁",  label:"Profilaufrufe",  value:stats.views,    color:C.teal  },
    { icon:"👥",  label:"Follower",       value:stats.followers,color:C.coral },
    { icon:"❤️",  label:"Likes",          value:stats.likes,    color:C.coral },
    { icon:"🔖",  label:"Saves",          value:stats.saves,    color:C.gold  },
    { icon:"💰",  label:"Einnahmen (netto)",value:`€ ${stats.revenue}`, color:C.green },
    { icon:"📅",  label:"Buchungen",      value:stats.bookings, color:C.teal  },
  ] : [];

  return (
    <PageShell title="Analytics" onBack={onBack}>
      {loading ? <Spinner/> : (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {STAT_ROWS.map(s => (
            <div key={s.label} style={{ background:C.card,borderRadius:16,
              padding:"16px 14px",border:`1px solid ${C.border}`,
              boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize:22,marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:20,fontWeight:900,color:s.color,marginBottom:3 }}>
                {s.value}
              </div>
              <div style={{ fontSize:12,color:C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 6. EINNAHMEN & AUSZAHLUNGEN
// ══════════════════════════════════════════════════════════════════════
export function EinnahmenPage({ onBack }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("bookings")
      .select("id, amount, status, created_at, works(title), experiences(title)")
      .eq("wirker_id", user.id)
      .order("created_at",{ascending:false})
      .then(({data}) => { setBookings(data||[]); setLoading(false); });
  }, [user?.id]);

  const completed = bookings.filter(b => b.status === "completed");
  const pending   = bookings.filter(b => ["confirmed","in_progress"].includes(b.status));
  const netTotal  = completed.reduce((s,b)=>s+(+b.amount||0),0) * 0.85;
  const pendingTotal = pending.reduce((s,b)=>s+(+b.amount||0),0) * 0.85;

  return (
    <PageShell title="Einnahmen & Auszahlungen" onBack={onBack}>
      {/* Summary */}
      <div style={{ display:"flex",gap:10,marginBottom:16 }}>
        {[
          { label:"Verfügbar",  value:`€ ${netTotal.toFixed(2)}`,    color:C.green, icon:"💰" },
          { label:"Ausstehend", value:`€ ${pendingTotal.toFixed(2)}`,color:C.gold,  icon:"⏳" },
        ].map(s => (
          <div key={s.label} style={{ flex:1,background:C.card,borderRadius:16,
            padding:"16px",border:`1px solid ${C.border}`,
            boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:20,marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:18,fontWeight:900,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Auszahlung anfordern */}
      {netTotal > 0 && (
        <button className="sp-tap" onClick={() => setRequested(true)}
          disabled={requested}
          style={{ width:"100%",padding:"14px",borderRadius:50,marginBottom:16,
            background: requested ? C.greenPale : `linear-gradient(135deg,${C.green},#0ea070)`,
            border: requested ? `1px solid ${C.green}44` : "none",
            color: requested ? C.green : "white",
            fontSize:14,fontWeight:800,
            boxShadow: requested ? "none" : "0 4px 16px rgba(16,185,129,0.3)" }}>
          {requested ? "✓ Auszahlung angefordert" : "Auszahlung anfordern"}
        </button>
      )}

      {/* Transaktionsliste */}
      <div style={{ fontSize:11,fontWeight:800,color:C.muted2,
        letterSpacing:1.2,marginBottom:8,paddingLeft:2 }}>
        TRANSAKTIONEN
      </div>
      {loading ? <Spinner/> : completed.length === 0
        ? <EmptyMsg icon="💳" text="Noch keine abgeschlossenen Buchungen"/>
        : completed.map(b => {
          const title = b.works?.title || b.experiences?.title || "Buchung";
          const net   = ((+b.amount||0)*0.85).toFixed(2);
          const date  = new Date(b.created_at).toLocaleDateString("de-DE",{day:"numeric",month:"short",year:"numeric"});
          return (
            <Card key={b.id}>
              <div style={{ padding:"12px 16px",display:"flex",
                alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:C.ink }}>{title}</div>
                  <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800,fontSize:15,color:C.green }}>€ {net}</div>
                  <div style={{ fontSize:11,color:C.muted }}>nach Provision</div>
                </div>
              </div>
            </Card>
          );
        })
      }
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 7. VERFÜGBARKEIT & SLOTS
// ══════════════════════════════════════════════════════════════════════
export function VerfuegbarkeitPage({ onBack }) {
  const { user } = useAuth();
  const [slots,    setSlots]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);
  const [newSlot,  setNewSlot]  = useState({ date:"", time_from:"", time_to:"", blocked:false });

  useEffect(() => { load(); }, [user?.id]);

  async function load() {
    if (!user?.id) return;
    const { data } = await supabase.from("availability_slots")
      .select("*").eq("user_id", user.id)
      .order("date",{ascending:true});
    setSlots(data || []);
    setLoading(false);
  }

  async function addSlot() {
    if (!newSlot.date || !newSlot.time_from) return;
    await supabase.from("availability_slots").insert({
      user_id:   user.id,
      date:      newSlot.date,
      time_from: newSlot.time_from,
      time_to:   newSlot.time_to || null,
      blocked:   newSlot.blocked,
    });
    setAdding(false);
    setNewSlot({ date:"", time_from:"", time_to:"", blocked:false });
    load();
  }

  async function removeSlot(id) {
    await supabase.from("availability_slots").delete().eq("id", id);
    setSlots(p => p.filter(s=>s.id!==id));
  }

  return (
    <PageShell title="Verfügbarkeit & Slots" onBack={onBack}>
      <button className="sp-tap" onClick={() => setAdding(a=>!a)}
        style={{ width:"100%",padding:"12px",borderRadius:50,marginBottom:14,
          background: adding ? C.cream : `linear-gradient(135deg,${C.teal},${C.teal2})`,
          border: adding ? `1px solid ${C.border}` : "none",
          color: adding ? C.muted : "white",
          fontSize:14,fontWeight:700 }}>
        {adding ? "Abbrechen" : "+ Slot hinzufügen"}
      </button>

      {adding && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ padding:"14px 16px",display:"flex",flexDirection:"column",gap:10 }}>
            {[
              { label:"Datum",  type:"date",   key:"date" },
              { label:"Von",    type:"time",   key:"time_from" },
              { label:"Bis",    type:"time",   key:"time_to" },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize:11,fontWeight:700,color:C.muted,marginBottom:4 }}>
                  {f.label.toUpperCase()}
                </div>
                <input type={f.type} value={newSlot[f.key]}
                  onChange={e=>setNewSlot(p=>({...p,[f.key]:e.target.value}))}
                  style={{ width:"100%",padding:"9px 12px",borderRadius:10,
                    border:`1px solid ${C.border}`,background:C.cream,
                    fontSize:14,color:C.ink,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
              </div>
            ))}
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <input type="checkbox" id="blocked" checked={newSlot.blocked}
                onChange={e=>setNewSlot(p=>({...p,blocked:e.target.checked}))}
                style={{ width:18,height:18,cursor:"pointer" }}/>
              <label htmlFor="blocked" style={{ fontSize:14,color:C.ink,cursor:"pointer" }}>
                Als blockiert markieren
              </label>
            </div>
            <button className="sp-tap" onClick={addSlot}
              style={{ padding:"12px",borderRadius:50,
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                border:"none",color:"white",fontSize:14,fontWeight:700 }}>
              Speichern
            </button>
          </div>
        </Card>
      )}

      {loading ? <Spinner/> : slots.length === 0
        ? <EmptyMsg icon="📅" text="Noch keine Slots definiert"/>
        : slots.map(slot => {
          const color = slot.blocked ? C.red : C.green;
          return (
            <Card key={slot.id}>
              <div style={{ padding:"12px 16px",display:"flex",
                alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:C.ink }}>
                    {new Date(slot.date).toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"short"})}
                  </div>
                  <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>
                    {slot.time_from}{slot.time_to ? ` – ${slot.time_to}` : ""}
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ fontSize:11,fontWeight:700,color,
                    background:`${color}15`,borderRadius:50,padding:"3px 8px" }}>
                    {slot.blocked ? "Blockiert" : "Frei"}
                  </span>
                  <button className="sp-tap" onClick={() => removeSlot(slot.id)}
                    style={{ width:28,height:28,borderRadius:"50%",
                      background:C.redPale,border:"none",
                      color:C.red,fontSize:13,
                      display:"flex",alignItems:"center",justifyContent:"center" }}>
                    ✕
                  </button>
                </div>
              </div>
            </Card>
          );
        })
      }
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 8. IMPACT
// ══════════════════════════════════════════════════════════════════════
export function ImpactSubPage({ onBack }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myVotes,  setMyVotes]  = useState([]);
  const [myImpact, setMyImpact] = useState(0);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    async function load() {
      const [projRes, voteRes, impactRes] = await Promise.all([
        supabase.from("impact_projects").select("*").eq("status","active").order("votes",{ascending:false}),
        supabase.from("impact_votes").select("project_id").eq("user_id",user.id),
        supabase.from("profiles").select("impact_eur").eq("id",user.id).single(),
      ]);
      setProjects(projRes.data || []);
      setMyVotes((voteRes.data||[]).map(v=>v.project_id));
      setMyImpact(impactRes.data?.impact_eur || 0);
      setLoading(false);
    }
    load();
  }, [user?.id]);

  async function vote(projectId) {
    if (myVotes.includes(projectId)) return;
    await supabase.from("impact_votes").insert({ user_id:user.id, project_id:projectId });
    await supabase.from("impact_projects").update({ votes: supabase.rpc ? undefined : undefined })
      .eq("id", projectId);
    setMyVotes(p=>[...p,projectId]);
    setProjects(p=>p.map(proj=>proj.id===projectId ? {...proj,votes:(proj.votes||0)+1}:proj));
  }

  const maxVotes = Math.max(...projects.map(p=>p.votes||0), 1);

  return (
    <PageShell title="Impact" onBack={onBack}>
      {/* My contribution */}
      <div style={{ background:`linear-gradient(135deg,${C.teal}18,${C.coral}10)`,
        borderRadius:16,padding:"16px",marginBottom:16,
        border:`1px solid ${C.teal}22` }}>
        <div style={{ fontSize:11,fontWeight:800,color:C.muted2,letterSpacing:1,marginBottom:4 }}>
          MEIN BEITRAG
        </div>
        <div style={{ fontSize:24,fontWeight:900,color:C.teal }}>
          € {Number(myImpact).toFixed(2)}
        </div>
        <div style={{ fontSize:13,color:C.muted,marginTop:2 }}>
          Geflossen in echte Herzensprojekte
        </div>
      </div>

      <div style={{ fontSize:11,fontWeight:800,color:C.muted2,letterSpacing:1.2,
        marginBottom:10,paddingLeft:2 }}>
        PROJEKTE ABSTIMMEN
      </div>

      {loading ? <Spinner/> : projects.length === 0
        ? <EmptyMsg icon="🌱" text="Keine aktiven Projekte"/>
        : projects.map(proj => {
          const voted   = myVotes.includes(proj.id);
          const progress= Math.round(((proj.votes||0) / maxVotes) * 100);
          return (
            <Card key={proj.id}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",
                  alignItems:"flex-start",marginBottom:10 }}>
                  <div style={{ flex:1,marginRight:12 }}>
                    <div style={{ fontWeight:700,fontSize:14,color:C.ink,marginBottom:3 }}>
                      {proj.name}
                    </div>
                    {proj.description && (
                      <div style={{ fontSize:12,color:C.muted,lineHeight:1.5 }}>
                        {proj.description.slice(0,80)}{proj.description.length>80?"…":""}
                      </div>
                    )}
                  </div>
                  <button className="sp-tap" onClick={() => vote(proj.id)}
                    disabled={voted}
                    style={{ padding:"8px 14px",borderRadius:50,flexShrink:0,
                      background: voted ? C.greenPale : `linear-gradient(135deg,${C.teal},${C.teal2})`,
                      border: voted ? `1px solid ${C.green}44` : "none",
                      color: voted ? C.green : "white",
                      fontSize:13,fontWeight:700 }}>
                    {voted ? "✓" : "Stimmen"}
                  </button>
                </div>
                {/* Progress bar */}
                <div style={{ background:"rgba(0,0,0,0.06)",borderRadius:999,height:5,overflow:"hidden" }}>
                  <div style={{ height:"100%",borderRadius:999,
                    width:`${progress}%`,
                    background:`linear-gradient(90deg,${C.teal},${C.coral})`,
                    transition:"width .6s ease" }}/>
                </div>
                <div style={{ fontSize:11,color:C.muted,marginTop:4 }}>
                  {proj.votes||0} Stimmen
                </div>
              </div>
            </Card>
          );
        })
      }
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 9. KONTO
// ══════════════════════════════════════════════════════════════════════
export function KontoPage({ onBack, onLogout }) {
  const { user, profile, hasTalentProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [name,  setName]  = useState(profile?.display_name || "");

  async function saveProfile() {
    await supabase.from("profiles")
      .update({ display_name:name, updated_at:new Date().toISOString() })
      .eq("id", user.id);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  const ROWS = [
    { icon:"💳", label:"Zahlungsmethoden",    sub:"Kreditkarte, SEPA hinzufügen" },
    { icon:"🧾", label:"Rechnungen & Belege", sub:"Alle Belege herunterladen"    },
    { icon:"🔒", label:"Passwort ändern",      sub:"Sicherheit & Zugangsdaten"   },
    { icon:"🛡️", label:"Datenschutz",          sub:"Daten & Privatsphäre"        },
  ];

  return (
    <PageShell title="Konto & Einstellungen" onBack={onBack}>
      {/* Profil bearbeiten */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:800,color:C.muted2,
          letterSpacing:1.2,marginBottom:8,paddingLeft:2 }}>
          PROFIL
        </div>
        <Card>
          <div style={{ padding:"14px 16px",display:"flex",flexDirection:"column",gap:10 }}>
            {[
              { label:"Name",  value:name,  set:setName,  type:"text"  },
              { label:"E-Mail",value:email, set:setEmail, type:"email", disabled:true },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize:11,fontWeight:700,color:C.muted,marginBottom:4 }}>
                  {f.label.toUpperCase()}
                </div>
                <input type={f.type} value={f.value}
                  disabled={f.disabled}
                  onChange={e=>f.set(e.target.value)}
                  style={{ width:"100%",padding:"9px 12px",borderRadius:10,
                    border:`1px solid ${C.border}`,
                    background: f.disabled ? "rgba(0,0,0,0.03)" : C.cream,
                    fontSize:14,color: f.disabled ? C.muted : C.ink,
                    outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
              </div>
            ))}
            <button className="sp-tap" onClick={saveProfile}
              style={{ padding:"11px",borderRadius:50,
                background: saved ? C.greenPale : `linear-gradient(135deg,${C.teal},${C.teal2})`,
                border: saved ? `1px solid ${C.green}44` : "none",
                color: saved ? C.green : "white",
                fontSize:14,fontWeight:700 }}>
              {saved ? "✓ Gespeichert" : "Speichern"}
            </button>
          </div>
        </Card>
      </div>

      {/* Konto-Menü */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:800,color:C.muted2,
          letterSpacing:1.2,marginBottom:8,paddingLeft:2 }}>
          KONTO
        </div>
        <Card>
          {ROWS.map((row,i) => (
            <button key={i} className="sp-tap sp-menuitem"
              style={{ width:"100%",display:"flex",alignItems:"center",
                gap:14,padding:"13px 16px",background:"none",border:"none",
                cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:36,height:36,borderRadius:10,
                background:C.cream,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:16,flexShrink:0 }}>
                {row.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:C.ink }}>{row.label}</div>
                <div style={{ fontSize:12,color:C.muted,marginTop:1 }}>{row.sub}</div>
              </div>
              <span style={{ color:C.muted2,fontSize:16 }}>›</span>
            </button>
          ))}
        </Card>
      </div>

      {/* Mitgliedschaft */}
      {hasTalentProfile && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11,fontWeight:800,color:C.muted2,
            letterSpacing:1.2,marginBottom:8,paddingLeft:2 }}>
            MITGLIEDSCHAFT
          </div>
          <Card>
            <div style={{ padding:"14px 16px",display:"flex",
              alignItems:"center",justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:700,fontSize:14,color:C.ink }}>HUI Talent</div>
                <div style={{ fontSize:12,color:C.green,marginTop:2,fontWeight:600 }}>● Aktiv</div>
              </div>
              <div style={{ fontSize:20 }}>✦</div>
            </div>
          </Card>
        </div>
      )}

      {/* Logout */}
      <button className="sp-tap" onClick={onLogout}
        style={{ width:"100%",padding:"14px",borderRadius:50,
          background:"none",border:`1.5px solid ${C.border}`,
          color:C.muted,fontSize:14,fontWeight:700 }}>
        Abmelden
      </button>
    </PageShell>
  );
}

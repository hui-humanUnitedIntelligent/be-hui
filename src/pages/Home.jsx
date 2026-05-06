import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import HomeFeed from "../components/HomeFeed";
import ImpactPage from "./ImpactPage";
import ProfilePage from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow from "../components/BookingFlow";
import ChatDetailPage from "../components/ChatDetailPage";

const C = {
  coral:  "#FF6B5B",
  teal:   "#2ABFAC",
  gold:   "#F5A623",
  ink:    "#1A1A2E",
  muted:  "#6B7280",
  border: "#EEECE8",
};

// ── Top-Header ────────────────────────────────────────────────
function TopHeader({ tab, cart, onCartClick, onSearch }) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:50,
      background:"rgba(248,247,245,0.95)", backdropFilter:"blur(16px)",
      borderBottom:`1px solid ${C.border}`, padding:"0 16px" }}>
      <div className="hui-safe-top" />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        height:52 }}>

        {/* Logo */}
        <div style={{ fontWeight:900, fontSize:22, letterSpacing:-0.5 }}>
          <span className="hui-gradient-text">HUI</span>
          <span style={{ fontSize:11, fontWeight:600, color:C.muted, marginLeft:6, letterSpacing:0 }}>
            {tab === "feed" ? "Entdecken" : tab === "impact" ? "Impact" : tab === "profile" ? "Profil" : ""}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={onSearch}
            style={{ width:36, height:36, borderRadius:"50%", background:"white",
              border:`1px solid ${C.border}`, display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer", fontSize:16,
              boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            🔍
          </button>
          <button onClick={onCartClick} style={{ position:"relative",
            width:36, height:36, borderRadius:"50%", background:"white",
            border:`1px solid ${C.border}`, display:"flex", alignItems:"center",
            justifyContent:"center", cursor:"pointer", fontSize:16,
            boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            🛒
            {cart > 0 && (
              <div style={{ position:"absolute", top:-4, right:-4,
                width:16, height:16, borderRadius:"50%",
                background:C.coral, color:"white",
                fontSize:9, fontWeight:800, display:"flex",
                alignItems:"center", justifyContent:"center" }}>{cart}</div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bottom Navigation ─────────────────────────────────────────
function BottomNav({ tab, onTab, unreadChats }) {
  const items = [
    { key:"feed",    icon:"⊞",  label:"Entdecken" },
    { key:"impact",  icon:"🌱", label:"Impact" },
    { key:"chats",   icon:"💬", label:"Chats", badge: unreadChats },
    { key:"profile", icon:"👤", label:"Profil" },
  ];
  return (
    <div className="hui-bottom-nav">
      <div style={{ display:"flex", justifyContent:"space-around", padding:"8px 0" }}>
        {items.map(item => (
          <button key={item.key} onClick={()=>onTab(item.key)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center",
              gap:2, background:"none", border:"none", cursor:"pointer",
              padding:"4px 12px", position:"relative",
              transition:"transform 0.15s" }}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.9)"}
            onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{ fontSize:22, filter: tab===item.key ? "none" : "grayscale(1) opacity(0.45)",
              transition:"filter 0.2s" }}>
              {item.icon}
            </div>
            <div style={{ fontSize:10, fontWeight: tab===item.key ? 800 : 500,
              color: tab===item.key ? C.teal : C.muted,
              transition:"color 0.2s" }}>
              {item.label}
            </div>
            {item.badge > 0 && (
              <div style={{ position:"absolute", top:0, right:8,
                width:14, height:14, borderRadius:"50%",
                background:C.coral, color:"white",
                fontSize:8, fontWeight:800,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {item.badge}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chats Placeholder ─────────────────────────────────────────
function ChatsPage({ currentUser, onOpenChat }) {
  return (
    <div style={{ padding:"24px 16px", paddingBottom:90 }}>
      <div style={{ fontWeight:900, fontSize:22, color:C.ink, marginBottom:4 }}>Nachrichten</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>
        Chats entstehen automatisch nach einer Buchung.
      </div>
      <div style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>💬</div>
        <div style={{ fontWeight:800, fontSize:18, color:C.ink, marginBottom:8 }}>
          Noch keine Nachrichten
        </div>
        <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
          Buche ein Talent — danach öffnet sich automatisch ein Chat mit deinem Wirker.
        </div>
      </div>
    </div>
  );
}

// ── Haupt-App ─────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState("feed");
  const [viewingWirker, setViewingWirker] = useState(null);
  const [showBooking, setShowBooking] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);
  const [cart, setCart] = useState([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUser(session.user);
    });
  }, []);

  function handleAddToCart(item) {
    setCart(prev => [...prev, item]);
  }

  function handleViewWirker(name) {
    if (name) { setViewingWirker(name); }
    // null = Suche/Discover
  }

  function handleBook(wirker) {
    setShowBooking(wirker);
  }

  function handleToggleFollow(name) {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  // Overlay: Fremdes Profil
  if (viewingWirker) {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:200, overflowY:"auto", background:"#F8F7F5" }}>
        <WirkerProfilePage
          wirkerName={viewingWirker}
          onBack={()=>setViewingWirker(null)}
          onAddToCart={handleAddToCart}
          isOwnProfile={false}
          following={following}
          toggleFollow={handleToggleFollow}
          onGoToChats={()=>{ setViewingWirker(null); setTab("chats"); }}
        />
      </div>
    );
  }

  // Overlay: Buchungsflow
  if (showBooking) {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:200, overflowY:"auto", background:"#F8F7F5" }}>
        <BookingFlow
          wirker={showBooking}
          onClose={()=>setShowBooking(null)}
          onAddToCart={handleAddToCart}
          onSuccess={()=>{ setShowBooking(null); setTab("chats"); }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#F8F7F5" }}>
      <TopHeader
        tab={tab}
        cart={cart.length}
        onCartClick={()=>{}}
        onSearch={()=>{}}
      />

      <div style={{ minHeight:"calc(100vh - 52px)" }}>
        {tab === "feed" && (
          <HomeFeed
            currentUser={currentUser}
            onViewWirker={handleViewWirker}
            onBook={handleBook}
            onAddToCart={handleAddToCart}
          />
        )}
        {tab === "impact" && (
          <ImpactPage currentUser={currentUser} />
        )}
        {tab === "chats" && (
          <ChatsPage currentUser={currentUser} onOpenChat={setOpenChatId} />
        )}
        {tab === "profile" && (
          <ProfilePage
            onTalentAnbieten={()=>setTab("feed")}
            onLogout={()=>{ supabase.auth.signOut(); window.location.href="/login"; }}
          />
        )}
      </div>

      <BottomNav tab={tab} onTab={setTab} unreadChats={unreadChats} />
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import HomeFeed          from "../components/HomeFeed";
import ImpactPage        from "./ImpactPage";
import ProfilePage       from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow       from "../components/BookingFlow";
import CreateFlow        from "../components/CreateFlow";

const C = {
  coral:   "#FF6B5B",
  teal:    "#2ABFAC",
  gold:    "#F5A623",
  ink:     "#1A1A2E",
  muted:   "#6B7280",
  surface: "#F8F7F5",
  card:    "#FFFFFF",
  border:  "#EEECE8",
};

/* ─── Fixierter Header ──────────────────────────────── */
function TopHeader({ cart, notifications, onCartClick, onNotifClick }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 60,
      background: "rgba(248,247,245,0.97)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px", height: 54,
      }}>
        <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -1,
          lineHeight: 1, userSelect: "none" }}>
          <span style={{ color: C.coral }}>H</span>
          <span style={{ color: C.teal }}>UI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onNotifClick}
            style={{ position: "relative", width: 40, height: 40,
              borderRadius: "50%", background: C.card,
              border: `1.5px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18,
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              WebkitTapHighlightColor: "transparent" }}>
            🔔
            {notifications > 0 && (
              <div style={{ position: "absolute", top: -3, right: -3,
                width: 17, height: 17, borderRadius: "50%",
                background: C.coral, color: "white",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid white" }}>
                {notifications > 9 ? "9+" : notifications}
              </div>
            )}
          </button>
          <button onClick={onCartClick}
            style={{ position: "relative", width: 40, height: 40,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.coral}15, ${C.teal}10)`,
              border: `1.5px solid ${C.coral}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18,
              boxShadow: `0 2px 8px ${C.coral}18`,
              WebkitTapHighlightColor: "transparent" }}>
            🛒
            {cart > 0 && (
              <div style={{ position: "absolute", top: -3, right: -3,
                width: 17, height: 17, borderRadius: "50%",
                background: C.coral, color: "white",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid white" }}>{cart}</div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Suchleiste ────────────────────────────────────── */
function SearchBar({ scrolled }) {
  const [focused, setFocused] = useState(false);
  const [value,   setValue]   = useState("");
  return (
    <div style={{
      position: "sticky", top: 54, zIndex: 55,
      background: "rgba(248,247,245,0.97)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      padding: scrolled ? "6px 16px 8px" : "10px 16px 12px",
      transition: "padding 0.25s ease",
      borderBottom: focused || !scrolled ? "none" : `1px solid ${C.border}99`,
    }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 15, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16, color: focused ? C.teal : C.muted,
          transition: "color 0.2s", pointerEvents: "none" }}>🔍</div>
        <input className="hui-search-bar" type="text"
          placeholder="Suche nach Talent, Werk, Mensch…"
          value={value} onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ fontSize: scrolled ? 13 : 14, transition: "font-size 0.2s" }} />
        {value.length > 0 && (
          <button onClick={() => setValue("")}
            style={{ position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
              background: C.muted + "30", border: "none",
              borderRadius: "50%", width: 20, height: 20,
              cursor: "pointer", fontSize: 11, color: C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent" }}>✕</button>
        )}
      </div>
    </div>
  );
}

/* ─── Bottom Navigation mit Plus-Button ─────────────── */
function BottomNav({ tab, onTab, unreadChats, isTalent, onCreate }) {
  const left  = [
    { key: "feed",   icon: "⊞",  label: "Entdecken" },
    { key: "impact", icon: "🌱", label: "Impact"    },
  ];
  const right = [
    { key: "chats",   icon: "💬", label: "Chats",  badge: unreadChats },
    { key: "profile", icon: "👤", label: "Profil"  },
  ];

  return (
    <div className="hui-bottom-nav">
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-around",
        padding: "6px 0 4px", position: "relative",
      }}>
        {/* Linke 2 Items */}
        {left.map(item => (
          <NavItem key={item.key} item={item} active={tab === item.key} onTap={() => onTab(item.key)} />
        ))}

        {/* Plus-Button (nur für Talente) */}
        {isTalent ? (
          <button onClick={onCreate}
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.coral}, ${C.teal})`,
              border: "3px solid white",
              boxShadow: `0 4px 16px ${C.coral}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 26, color: "white",
              fontWeight: 300, lineHeight: 1,
              transform: "translateY(-10px)",
              transition: "transform 0.15s, box-shadow 0.15s",
              WebkitTapHighlightColor: "transparent",
              flexShrink: 0,
            }}
            onTouchStart={e => { e.currentTarget.style.transform = "translateY(-10px) scale(0.92)"; }}
            onTouchEnd={e   => { e.currentTarget.style.transform = "translateY(-10px) scale(1)"; }}>
            +
          </button>
        ) : (
          /* Platzhalter damit Spacing stimmt */
          <div style={{ width: 52, flexShrink: 0 }} />
        )}

        {/* Rechte 2 Items */}
        {right.map(item => (
          <NavItem key={item.key} item={item} active={tab === item.key} onTap={() => onTab(item.key)} />
        ))}
      </div>
    </div>
  );
}

function NavItem({ item, active, onTap }) {
  return (
    <button onClick={onTap}
      style={{ display: "flex", flexDirection: "column",
        alignItems: "center", gap: 3, background: "none",
        border: "none", cursor: "pointer", padding: "6px 12px",
        position: "relative", minWidth: 58,
        WebkitTapHighlightColor: "transparent",
        transition: "transform 0.12s" }}
      onTouchStart={e => e.currentTarget.style.transform = "scale(0.88)"}
      onTouchEnd={e   => e.currentTarget.style.transform = "scale(1)"}>
      {active && (
        <div style={{ position: "absolute", top: 2, left: "50%",
          transform: "translateX(-50%)",
          width: 4, height: 4, borderRadius: "50%",
          background: C.teal }} />
      )}
      <div style={{ fontSize: 22,
        filter: active ? "none" : "grayscale(1) opacity(0.38)",
        transition: "filter 0.2s",
        transform: active ? "translateY(-1px)" : "none",
        transitionProperty: "filter, transform",
        transitionDuration: "0.2s" }}>
        {item.icon}
      </div>
      <div style={{ fontSize: 10, fontWeight: active ? 800 : 500,
        color: active ? C.teal : C.muted,
        transition: "color 0.2s" }}>
        {item.label}
      </div>
      {item.badge > 0 && (
        <div style={{ position: "absolute", top: 4, right: 8,
          width: 14, height: 14, borderRadius: "50%",
          background: C.coral, color: "white",
          fontSize: 8, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid white" }}>{item.badge}</div>
      )}
    </button>
  );
}

/* ─── Chats Placeholder ─────────────────────────────── */
function ChatsPage() {
  return (
    <div style={{ padding: "32px 20px", paddingBottom: 90, textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>💬</div>
      <div style={{ fontWeight: 900, fontSize: 20, color: C.ink, marginBottom: 8 }}>
        Deine Nachrichten
      </div>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65,
        maxWidth: 260, margin: "0 auto" }}>
        Chats entstehen automatisch, wenn du ein Talent buchst.
      </div>
    </div>
  );
}

/* ─── Haupt-App ─────────────────────────────────────── */
export default function Home() {
  const [tab,           setTab]           = useState("feed");
  const [viewingWirker, setViewingWirker] = useState(null);
  const [showBooking,   setShowBooking]   = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [cart,          setCart]          = useState([]);
  const [notifications, setNotifications] = useState(3);
  const [unreadChats,   setUnreadChats]   = useState(0);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [isTalent,      setIsTalent]      = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [following,     setFollowing]     = useState(new Set());
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setCurrentUser(session.user);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("talent_type")
          .eq("user_id", session.user.id)
          .single();
        if (data?.talent_type && data.talent_type !== "entdecker") {
          setIsTalent(true);
        }
      } catch {
        // Mock: für Demo immer als Talent behandeln
        setIsTalent(true);
      }
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* Create-Flow */
  if (showCreate) return (
    <CreateFlow onClose={() => setShowCreate(false)} />
  );

  /* Fremdes Profil */
  if (viewingWirker) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200,
      overflowY: "auto", background: C.surface }}>
      <WirkerProfilePage
        wirkerName={viewingWirker}
        onBack={() => setViewingWirker(null)}
        onAddToCart={item => setCart(p => [...p, item])}
        isOwnProfile={false}
        following={following}
        toggleFollow={name => setFollowing(p => {
          const n = new Set(p);
          n.has(name) ? n.delete(name) : n.add(name); return n;
        })}
        onGoToChats={() => { setViewingWirker(null); setTab("chats"); }}
      />
    </div>
  );

  /* Buchungsflow */
  if (showBooking) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200,
      overflowY: "auto", background: C.surface }}>
      <BookingFlow
        wirker={showBooking}
        onClose={() => setShowBooking(null)}
        onAddToCart={item => setCart(p => [...p, item])}
        onSuccess={() => { setShowBooking(null); setTab("chats"); }}
      />
    </div>
  );

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column",
      background: C.surface, overflow: "hidden" }}>

      <TopHeader
        cart={cart.length}
        notifications={notifications}
        onCartClick={() => {}}
        onNotifClick={() => setNotifications(0)}
      />

      <div ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden",
          scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        className="scrollbar-hide">

        {tab === "feed" && <SearchBar scrolled={scrolled} />}

        {tab === "feed" && (
          <HomeFeed
            currentUser={currentUser}
            onViewWirker={setViewingWirker}
            onBook={setShowBooking}
            onAddToCart={item => setCart(p => [...p, item])}
            onImpact={() => setTab("impact")}
          />
        )}
        {tab === "impact"  && <ImpactPage currentUser={currentUser} />}
        {tab === "chats"   && <ChatsPage />}
        {tab === "profile" && (
          <ProfilePage
            onTalentAnbieten={() => setShowCreate(true)}
            onLogout={() => { supabase.auth.signOut(); window.location.href = "/login"; }}
          />
        )}
      </div>

      <BottomNav
        tab={tab} onTab={setTab}
        unreadChats={unreadChats}
        isTalent={isTalent}
        onCreate={() => setShowCreate(true)}
      />
    </div>
  );
}

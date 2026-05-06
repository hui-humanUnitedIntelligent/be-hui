import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import HomeFeed        from "../components/HomeFeed";
import ImpactPage      from "./ImpactPage";
import ProfilePage     from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow     from "../components/BookingFlow";

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

/* ─── Fixierter Header ──────────────────────────────────── */
function TopHeader({ cart, notifications, onCartClick, onNotifClick }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 60,
      background: "rgba(248,247,245,0.97)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${C.border}`,
    }}>
      {/* iOS safe area */}
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />

      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px", height: 54,
      }}>
        {/* ── Logo ── */}
        <div style={{
          fontWeight: 900, fontSize: 26, letterSpacing: -1,
          lineHeight: 1, userSelect: "none",
        }}>
          <span style={{ color: C.coral }}>H</span>
          <span style={{ color: C.teal }}>UI</span>
        </div>

        {/* ── Rechte Icons ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Notifications */}
          <button onClick={onNotifClick}
            style={{
              position: "relative", width: 40, height: 40,
              borderRadius: "50%", background: C.card,
              border: `1.5px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18,
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              WebkitTapHighlightColor: "transparent",
            }}>
            🔔
            {notifications > 0 && (
              <div style={{
                position: "absolute", top: -3, right: -3,
                width: 17, height: 17, borderRadius: "50%",
                background: C.coral, color: "white",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid white",
              }}>{notifications > 9 ? "9+" : notifications}</div>
            )}
          </button>

          {/* Werkekorb */}
          <button onClick={onCartClick}
            style={{
              position: "relative", width: 40, height: 40,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.coral}15, ${C.teal}10)`,
              border: `1.5px solid ${C.coral}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18,
              boxShadow: `0 2px 8px ${C.coral}18`,
              WebkitTapHighlightColor: "transparent",
            }}>
            🛒
            {cart > 0 && (
              <div style={{
                position: "absolute", top: -3, right: -3,
                width: 17, height: 17, borderRadius: "50%",
                background: C.coral, color: "white",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid white",
              }}>{cart}</div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Fixierte Suchleiste ───────────────────────────────── */
function SearchBar({ scrolled, onFocus }) {
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
        {/* Such-Icon */}
        <div style={{
          position: "absolute", left: 15, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16, color: focused ? C.teal : C.muted,
          transition: "color 0.2s", pointerEvents: "none",
        }}>🔍</div>

        <input
          className="hui-search-bar"
          type="text"
          placeholder="Suche nach Talent, Werk, Mensch…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => { setFocused(true); if (onFocus) onFocus(); }}
          onBlur={() => setFocused(false)}
          style={{ fontSize: scrolled ? 13 : 14, transition: "font-size 0.2s" }}
        />

        {/* Clear */}
        {value.length > 0 && (
          <button onClick={() => setValue("")}
            style={{
              position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
              background: C.muted + "30", border: "none",
              borderRadius: "50%", width: 20, height: 20,
              cursor: "pointer", fontSize: 11, color: C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}>✕</button>
        )}
      </div>
    </div>
  );
}

/* ─── Bottom Navigation ─────────────────────────────────── */
function BottomNav({ tab, onTab, unreadChats }) {
  const items = [
    { key: "feed",    icon: "⊞",  label: "Entdecken" },
    { key: "impact",  icon: "🌱", label: "Impact"    },
    { key: "chats",   icon: "💬", label: "Chats",     badge: unreadChats },
    { key: "profile", icon: "👤", label: "Profil"    },
  ];
  return (
    <div className="hui-bottom-nav">
      <div style={{
        display: "flex", justifyContent: "space-around",
        padding: "6px 0 4px",
      }}>
        {items.map(item => (
          <button key={item.key} onClick={() => onTab(item.key)}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
              background: "none", border: "none",
              cursor: "pointer", padding: "6px 14px",
              position: "relative", minWidth: 64,
              WebkitTapHighlightColor: "transparent",
              transition: "transform 0.12s",
            }}
            onTouchStart={e => e.currentTarget.style.transform = "scale(0.88)"}
            onTouchEnd={e => e.currentTarget.style.transform   = "scale(1)"}>

            {/* Active dot */}
            {tab === item.key && (
              <div style={{
                position: "absolute", top: 2, left: "50%",
                transform: "translateX(-50%)",
                width: 4, height: 4, borderRadius: "50%",
                background: C.teal,
              }} />
            )}

            <div style={{
              fontSize: 22,
              filter: tab === item.key ? "none" : "grayscale(1) opacity(0.38)",
              transition: "filter 0.2s",
              transform: tab === item.key ? "translateY(-1px)" : "none",
              transitionProperty: "filter, transform",
              transitionDuration: "0.2s",
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: 10, fontWeight: tab === item.key ? 800 : 500,
              color: tab === item.key ? C.teal : C.muted,
              transition: "color 0.2s",
            }}>
              {item.label}
            </div>

            {item.badge > 0 && (
              <div style={{
                position: "absolute", top: 4, right: 10,
                width: 14, height: 14, borderRadius: "50%",
                background: C.coral, color: "white",
                fontSize: 8, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid white",
              }}>{item.badge}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Chats Placeholder ─────────────────────────────────── */
function ChatsPage() {
  return (
    <div style={{ padding: "32px 20px", paddingBottom: 90, textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>💬</div>
      <div style={{ fontWeight: 900, fontSize: 20, color: C.ink, marginBottom: 8 }}>
        Deine Nachrichten
      </div>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, maxWidth: 260, margin: "0 auto" }}>
        Chats entstehen automatisch, wenn du ein Talent buchst.
        Dann sprichst du direkt – sicher und einfach.
      </div>
    </div>
  );
}

/* ─── Haupt-App ─────────────────────────────────────────── */
export default function Home() {
  const [tab,           setTab]           = useState("feed");
  const [viewingWirker, setViewingWirker] = useState(null);
  const [showBooking,   setShowBooking]   = useState(null);
  const [cart,          setCart]          = useState([]);
  const [notifications, setNotifications] = useState(3);
  const [unreadChats,   setUnreadChats]   = useState(0);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [scrolled,      setScrolled]      = useState(false);
  const [following,     setFollowing]     = useState(new Set());
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUser(session.user);
    });
  }, []);

  /* Scroll-Listener für kompakte Suchleiste */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() { setScrolled(el.scrollTop > 40); }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* Overlay: fremdes Profil */
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

  /* Overlay: Buchungsflow */
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

  /* Hauptlayout */
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column",
      background: C.surface, overflow: "hidden" }}>

      {/* Fixierter Header */}
      <TopHeader
        cart={cart.length}
        notifications={notifications}
        onCartClick={() => {}}
        onNotifClick={() => setNotifications(0)}
      />

      {/* Scrollbarer Content-Bereich */}
      <div ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden",
          scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        className="scrollbar-hide">

        {/* Fixierte Suchleiste (sticky within scroll area) */}
        {tab === "feed" && (
          <SearchBar scrolled={scrolled} />
        )}

        {/* Seiten-Inhalt */}
        {tab === "feed" && (
          <HomeFeed
            currentUser={currentUser}
            onViewWirker={setViewingWirker}
            onBook={setShowBooking}
            onAddToCart={item => setCart(p => [...p, item])}
            onImpact={() => setTab("impact")}
          />
        )}
        {tab === "impact" && <ImpactPage currentUser={currentUser} />}
        {tab === "chats"  && <ChatsPage />}
        {tab === "profile" && (
          <ProfilePage
            onTalentAnbieten={() => setTab("feed")}
            onLogout={() => { supabase.auth.signOut(); window.location.href = "/login"; }}
          />
        )}
      </div>

      {/* Fixierte Bottom-Nav */}
      <BottomNav tab={tab} onTab={setTab} unreadChats={unreadChats} />
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import HomeFeed          from "../components/HomeFeed";
import ImpactPage        from "./ImpactPage";
import ProfilePage       from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow       from "../components/BookingFlow";
import CreateFlow        from "../components/CreateFlow";

const T = {
  teal:    "#3DBFB8",
  coral:   "#FF7055",
  cream:   "#FAF8F5",
  card:    "#FFFFFE",
  ink:     "#1C1917",
  ink2:    "#44403C",
  muted:   "#78716C",
  border:  "#E7E3DC",
};

const SEARCH_SUGGESTIONS = [
  "Jemanden für deinen Garten",
  "Einen Coach für deinen nächsten Schritt",
  "Handgemachtes für dein Zuhause",
  "Ein besonderes Erlebnis",
  "Jemanden der Fotos lebendig macht",
];

/* ─── Header ────────────────────────────────────── */
function TopHeader({ cart, notifications, onCartClick, onNotifClick }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 60,
      background: "rgba(250,248,245,0.96)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px", height: 54,
      }}>
        {/* Logo */}
        <div style={{ userSelect: "none", letterSpacing: -1, lineHeight: 1 }}>
          <span style={{ fontWeight: 900, fontSize: 27, color: T.coral }}>H</span>
          <span style={{ fontWeight: 900, fontSize: 27, color: T.teal }}>UI</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onNotifClick}
            style={{ position: "relative", width: 40, height: 40,
              borderRadius: "50%", background: T.card,
              border: `1.5px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18,
              boxShadow: "0 1px 6px rgba(28,25,23,0.07)",
              WebkitTapHighlightColor: "transparent" }}>
            🔔
            {notifications > 0 && (
              <div style={{ position: "absolute", top: -3, right: -3,
                width: 17, height: 17, borderRadius: "50%",
                background: T.coral, color: "white",
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
              background: `linear-gradient(135deg, ${T.coral}18, ${T.teal}10)`,
              border: `1.5px solid ${T.coral}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18,
              boxShadow: `0 2px 8px ${T.coral}20`,
              WebkitTapHighlightColor: "transparent" }}>
            🛒
            {cart > 0 && (
              <div style={{ position: "absolute", top: -3, right: -3,
                width: 17, height: 17, borderRadius: "50%",
                background: T.coral, color: "white",
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

/* ─── Emotional Search Bar ──────────────────────── */
function EmotionalSearch({ scrolled }) {
  const [focused, setFocused]   = useState(false);
  const [value,   setValue]     = useState("");
  const [suggIdx, setSuggIdx]   = useState(0);

  // Rotate suggestion
  useEffect(() => {
    if (focused || value) return;
    const t = setInterval(() => {
      setSuggIdx(i => (i + 1) % SEARCH_SUGGESTIONS.length);
    }, 3200);
    return () => clearInterval(t);
  }, [focused, value]);

  const suggestion = SEARCH_SUGGESTIONS[suggIdx];

  return (
    <div style={{
      position: "sticky", top: 54, zIndex: 55,
      background: "rgba(250,248,245,0.96)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      padding: scrolled ? "7px 18px 9px" : "10px 18px 14px",
      transition: "padding 0.25s ease",
    }}>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 16, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16, color: focused ? T.teal : T.muted,
          transition: "color 0.2s", pointerEvents: "none", zIndex: 1 }}>
          🔍
        </div>
        <input
          className="hui-search-input"
          type="text"
          placeholder="Wen suchst du heute?"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ fontSize: scrolled ? 14 : 15, transition: "font-size 0.2s" }}
        />
        {value && (
          <button onClick={() => setValue("")}
            style={{ position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
              background: `${T.muted}25`, border: "none",
              borderRadius: "50%", width: 22, height: 22,
              cursor: "pointer", fontSize: 11, color: T.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent" }}>✕</button>
        )}
      </div>

      {/* Rotating suggestion (only when not scrolled or not typing) */}
      {!scrolled && !value && !focused && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6,
          paddingLeft: 4, animation: "hui-rise 0.35s ease-out" }}>
          <span style={{ fontSize: 14, color: T.muted }}>💡</span>
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 500, fontStyle: "italic",
            transition: "opacity 0.3s" }}>
            {suggestion}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Bottom Nav ────────────────────────────────── */
function BottomNav({ tab, onTab, unreadChats, isTalent, onCreate }) {
  const left  = [
    { key: "feed",   icon: "⊞",  label: "Entdecken" },
    { key: "impact", icon: "🌱", label: "Impact" },
  ];
  const right = [
    { key: "chats",   icon: "💬", label: "Chats", badge: unreadChats },
    { key: "profile", icon: "👤", label: "Profil" },
  ];

  return (
    <div className="hui-bottom-nav">
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-around", padding: "6px 0 4px" }}>
        {left.map(item => (
          <NavItem key={item.key} item={item} active={tab === item.key}
            onTap={() => onTab(item.key)} />
        ))}

        {isTalent ? (
          <button onClick={onCreate}
            style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${T.coral}, ${T.teal})`,
              border: "3px solid white",
              boxShadow: `0 4px 18px ${T.coral}45`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 26, color: "white", fontWeight: 300,
              transform: "translateY(-10px)",
              transition: "transform 0.15s, box-shadow 0.15s",
              WebkitTapHighlightColor: "transparent" }}
            onTouchStart={e => { e.currentTarget.style.transform = "translateY(-10px) scale(0.9)"; }}
            onTouchEnd={e   => { e.currentTarget.style.transform = "translateY(-10px) scale(1)"; }}>
            +
          </button>
        ) : (
          <div style={{ width: 52, flexShrink: 0 }} />
        )}

        {right.map(item => (
          <NavItem key={item.key} item={item} active={tab === item.key}
            onTap={() => onTab(item.key)} />
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
        WebkitTapHighlightColor: "transparent" }}
      onTouchStart={e => e.currentTarget.style.transform = "scale(0.88)"}
      onTouchEnd={e   => e.currentTarget.style.transform = "scale(1)"}>
      {active && (
        <div style={{ position: "absolute", top: 2, left: "50%",
          transform: "translateX(-50%)",
          width: 4, height: 4, borderRadius: "50%",
          background: T.teal }} />
      )}
      <div style={{ fontSize: 22,
        filter: active ? "none" : "grayscale(1) opacity(0.38)",
        transform: active ? "translateY(-1px)" : "none",
        transition: "filter 0.2s, transform 0.2s" }}>
        {item.icon}
      </div>
      <div style={{ fontSize: 10, fontWeight: active ? 800 : 500,
        color: active ? T.teal : T.muted, transition: "color 0.2s" }}>
        {item.label}
      </div>
      {item.badge > 0 && (
        <div style={{ position: "absolute", top: 4, right: 8,
          width: 14, height: 14, borderRadius: "50%",
          background: T.coral, color: "white",
          fontSize: 8, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid white" }}>{item.badge}</div>
      )}
    </button>
  );
}

/* ─── Warm loading screen ────────────────────────── */
function WarmLoader() {
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse 80% 40% at 50% -5%, rgba(61,191,184,0.12) 0%, transparent 70%),
                   radial-gradient(ellipse 60% 30% at 80% 110%, rgba(255,112,85,0.10) 0%, transparent 65%),
                   #FAF8F5` }}>
      <div className="hui-warm-pulse"
        style={{ width: 64, height: 64, borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
          marginBottom: 20 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: T.muted }}>
        HUI lädt…
      </div>
    </div>
  );
}

/* ─── Chats Placeholder ──────────────────────────── */
function ChatsPage() {
  return (
    <div style={{ padding: "40px 24px", paddingBottom: 90, textAlign: "center" }}>
      <div style={{ fontSize: 58, marginBottom: 18 }}>💬</div>
      <div style={{ fontWeight: 900, fontSize: 22, color: T.ink, marginBottom: 10 }}>
        Deine Nachrichten
      </div>
      <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7,
        maxWidth: 270, margin: "0 auto" }}>
        Chats entstehen automatisch, wenn du ein Talent buchst.
        Dann sprichst du direkt — sicher und einfach.
      </div>
    </div>
  );
}

/* ─── Haupt-App ─────────────────────────────────── */
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
          .from("profiles").select("talent_type")
          .eq("user_id", session.user.id).single();
        if (data?.talent_type && data.talent_type !== "entdecker") setIsTalent(true);
      } catch {
        setIsTalent(true); // Demo-Fallback
      }
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, []);

  if (showCreate) return <CreateFlow onClose={() => setShowCreate(false)} />;

  if (viewingWirker) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200,
      overflowY: "auto", background: T.cream }}>
      <WirkerProfilePage
        wirkerName={viewingWirker}
        onBack={() => setViewingWirker(null)}
        onAddToCart={item => setCart(p => [...p, item])}
        isOwnProfile={false}
        following={following}
        toggleFollow={name => setFollowing(p => {
          const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n;
        })}
        onGoToChats={() => { setViewingWirker(null); setTab("chats"); }}
      />
    </div>
  );

  if (showBooking) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200,
      overflowY: "auto", background: T.cream }}>
      <BookingFlow
        wirker={showBooking}
        onClose={() => setShowBooking(null)}
        onAddToCart={item => setCart(p => [...p, item])}
        onSuccess={() => { setShowBooking(null); setTab("chats"); }}
      />
    </div>
  );

  return (
    <div className="hui-app-bg"
      style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <TopHeader
        cart={cart.length}
        notifications={notifications}
        onCartClick={() => {}}
        onNotifClick={() => setNotifications(0)}
      />

      <div ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden",
          WebkitOverflowScrolling: "touch" }}
        className="scrollbar-hide">

        {tab === "feed" && <EmotionalSearch scrolled={scrolled} />}

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

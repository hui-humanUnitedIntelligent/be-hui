// HUI App — Clean Rewrite v4.0
import React, { useState, useEffect, useRef } from "react";
import { HuiWirker, HuiImpactProject, HuiPayment, HuiMessage } from "@/api/entities";
import {
  Heart, Share2, Star, Search, Plus, ShoppingBasket, Bell, ChevronRight,
  MapPin, Play, X, Home, Leaf, User, SlidersHorizontal, ChevronDown,
  ChevronUp, Check, ArrowLeft, Calendar, Clock, Package, Award, Send,
  MessageCircle, ThumbsUp, BadgeCheck, Eye, Settings, Edit3
} from "lucide-react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CORAL = "#FF6B5B";
const TEAL  = "#2ABFAC";
const GOLD  = "#F5A623";
const VIOLET = "#8B5CF6";

// ─── MODULE-LEVEL MOCK DATA ──────────────────────────────────────────────────

const MOCK_WIRKER = [
  { id: "sofia", name: "Sofia M.", fullName: "Sofia Meier", talent: "Keramik & Töpferei", location: "München", hourlyRate: 65, recommendations: 24, followers: 142, verified: true, bio: "Ich töpfere mit Leidenschaft seit 12 Jahren. Jedes Stück ist ein Unikat — mit Seele und Charakter.", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop", headerImg: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=400&fit=crop" },
  { id: "marcus", name: "Marcus B.", fullName: "Marcus Bauer", talent: "Fotografie", location: "Berlin", hourlyRate: 80, recommendations: 31, followers: 289, verified: true, bio: "Ich halte Momente fest, die du nie vergessen wirst. Portrait, Event, Natur.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop", headerImg: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=400&fit=crop" },
  { id: "lena", name: "Lena K.", fullName: "Lena Klein", talent: "Yoga & Meditation", location: "Hamburg", hourlyRate: 55, recommendations: 18, followers: 201, verified: true, bio: "Yoga ist für jeden. Ich begleite dich auf deinem Weg zu mehr Ruhe und Stärke.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop", headerImg: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=400&fit=crop" },
  { id: "jan", name: "Jan W.", fullName: "Jan Weber", talent: "Gitarre & Musik", location: "Köln", hourlyRate: 50, recommendations: 9, followers: 88, verified: false, bio: "Gitarre spielen und lehren — von Rock bis Klassik.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop", headerImg: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop" },
  { id: "anna", name: "Anna K.", fullName: "Anna Kohl", talent: "Interior Design", location: "München", hourlyRate: 90, recommendations: 15, followers: 175, verified: true, bio: "Räume mit Persönlichkeit — ich schaffe Wohnwelten die zu dir passen.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop", headerImg: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=400&fit=crop" },
];

const MOCK_WERKE = [
  { id: "tasse", title: "Handgemachte Keramik-Tasse", creator: "Sofia M.", price: 38, img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop", category: "Keramik", description: "Handgetöpfert, einzigartig, mit Seele." },
  { id: "portrait", title: "Aquarell-Portrait", creator: "Lena K.", price: 120, img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop", category: "Kunst", description: "Einzigartiges Aquarell-Portrait auf Bestellung." },
  { id: "kette", title: "Silberkette handgefertigt", creator: "Anna K.", price: 85, img: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop", category: "Schmuck", description: "925er Silber, von Hand geformt." },
];

const MOCK_IMPACT = [
  { id: "schule", name: "Schule für alle", category: "Bildung", description: "Bildung für Kinder in Uganda — wir bauen Schulen und bezahlen Lehrkräfte.", icon: "🏫", color: VIOLET, votes: 847, status: "aktiv", month: "Mai 2026", website: "https://example.com", contact_name: "Sarah M.", contact_email: "sarah@example.com" },
  { id: "baeume", name: "Bäume für Kenia", category: "Umwelt", description: "Wir pflanzen Bäume im Hochland Kenias und schaffen Arbeitsplätze.", icon: "🌳", color: TEAL, votes: 612, status: "aktiv", month: "Mai 2026", website: "https://example.com", contact_name: "David N.", contact_email: "david@example.com" },
  { id: "wasser", name: "Sauberes Wasser Mali", category: "Gesundheit", description: "Brunnen und Wasserfilter für Dörfer in Mali — sauberes Wasser für alle.", icon: "💧", color: CORAL, votes: 534, status: "aktiv", month: "Mai 2026", website: "https://example.com", contact_name: "Fatou D.", contact_email: "fatou@example.com" },
];

const MOCK_FEED = [
  { id: 1, type: "wirker", wirker: MOCK_WIRKER[0] },
  { id: 2, type: "werk", werk: MOCK_WERKE[0] },
  { id: 3, type: "media", mediaType: "photo", creator: "Marcus B.", creatorImg: MOCK_WIRKER[1].img, img: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=400&fit=crop", caption: "Golden hour shoot am Englischen Garten 🌅", likes: 84 },
  { id: 4, type: "wirker", wirker: MOCK_WIRKER[1] },
  { id: 5, type: "impact", project: MOCK_IMPACT[0] },
  { id: 6, type: "werk", werk: MOCK_WERKE[1] },
  { id: 7, type: "wirker", wirker: MOCK_WIRKER[2] },
  { id: 8, type: "media", mediaType: "video", creator: "Lena K.", creatorImg: MOCK_WIRKER[2].img, img: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=600&h=400&fit=crop", caption: "Morgen-Yoga am See — 10 Minuten täglich verändern alles 🧘", likes: 127 },
  { id: 9, type: "wirker", wirker: MOCK_WIRKER[3] },
  { id: 10, type: "werk", werk: MOCK_WERKE[2] },
];

const MOCK_STORIES = [
  { id: 1, name: "Sofia M.", img: MOCK_WIRKER[0].img, seen: false },
  { id: 2, name: "Marcus B.", img: MOCK_WIRKER[1].img, seen: false },
  { id: 3, name: "Lena K.", img: MOCK_WIRKER[2].img, seen: true },
  { id: 4, name: "Jan W.", img: MOCK_WIRKER[3].img, seen: true },
  { id: 5, name: "Anna K.", img: MOCK_WIRKER[4].img, seen: false },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, group: "Heute", icon: "📅", color: CORAL, read: false, title: "Neue Buchungsanfrage", text: "Marcus B. möchte einen Fotoshooting-Termin.", time: "vor 2 Min.", actions: ["Annehmen", "Ablehnen"] },
  { id: 2, group: "Heute", icon: "🔓", color: GOLD, read: false, title: "Treuhand freigegeben", text: "Sofia M. hat ihre Bestellung bestätigt — 75 € wurden dir ausgezahlt.", time: "vor 45 Min.", actions: ["Details"] },
  { id: 3, group: "Heute", icon: "👍", color: TEAL, read: false, title: "Neue Empfehlung", text: "Lena K. hat dich nach dem Workshop empfohlen.", time: "vor 2 Std.", actions: ["Ansehen"] },
  { id: 4, group: "Gestern", icon: "💬", color: VIOLET, read: true, title: "Neue Nachricht", text: 'Maria L.: "Super, dann sehen wir uns am Montag! 🧘"', time: "gestern 18:32", actions: ["Antworten"] },
  { id: 5, group: "Gestern", icon: "🗳️", color: "#10b981", read: true, title: "Abstimmung läuft", text: "Noch 4 Tage um dein Herzensprojekt zu wählen.", time: "gestern 10:00", actions: ["Abstimmen"] },
];

const MOCK_CHATS = [
  { id: 1, name: "Sofia M.", img: MOCK_WIRKER[0].img, lastMsg: "Danke für deine Buchung! 🎉", time: "14:23", unread: 2 },
  { id: 2, name: "Marcus B.", img: MOCK_WIRKER[1].img, lastMsg: "Termin bestätigt für Dienstag.", time: "gestern", unread: 0 },
  { id: 3, name: "Lena K.", img: MOCK_WIRKER[2].img, lastMsg: "Bring bitte bequeme Kleidung 🧘", time: "Mo", unread: 0 },
];

const WEEKDAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// ─── UTILITY ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstWeekday(year, month) { return (new Date(year, month, 1).getDay() + 6) % 7; }

function getBadge(rec) {
  if (rec >= 50) return { label: "✨ Community Liebling", color: VIOLET };
  if (rec >= 10) return { label: "🏆 Top Wirker", color: CORAL };
  if (rec < 3) return { label: "🚀 Neu dabei", color: TEAL };
  return null;
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────

function Btn({ children, onClick, style = {}, variant = "primary", disabled }) {
  const base = { border: "none", borderRadius: 14, padding: "13px 20px", fontWeight: 700, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "opacity .2s", fontFamily: "inherit" };
  const variants = {
    primary: { background: `linear-gradient(135deg,${CORAL},${CORAL}cc)`, color: "white" },
    teal: { background: `linear-gradient(135deg,${TEAL},${TEAL}cc)`, color: "white" },
    ghost: { background: "white", border: `1.5px solid #e8e8e8`, color: "#444" },
    danger: { background: "#fee2e2", color: "#dc2626" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function Avatar({ src, size = 40, name }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
      {src ? <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={name} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, color: "#999" }}>{name?.[0] || "?"}</div>}
    </div>
  );
}

function Toast({ item, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "white", borderRadius: 16, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, zIndex: 9999, minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}>
      <ShoppingBasket size={18} color={CORAL} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>In den Warenkorb!</div>
        <div style={{ fontSize: 12, opacity: .7 }}>{item?.title || item?.name}</div>
      </div>
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={16} /></button>
    </div>
  );
}

// ─── AUTH / ONBOARDING ───────────────────────────────────────────────────────

function HuiOnboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const slides = [
    { emoji: "🤍", title: "Schön, dass du hier bist.", sub: "HUI verbindet echte Menschen mit echten Talenten.", bg: "#fff8f6", accent: CORAL },
    { emoji: "🎨", title: "Entdecke Talente & Werke.", sub: "Töpfer, Fotografen, Coaches — buche direkt und einfach.", bg: "#f0fffe", accent: TEAL },
    { emoji: "🌱", title: "Jede Buchung bewegt etwas.", sub: "Ein Teil deiner Zahlung fließt in echte Herzensprojekte.", bg: "#f0fff8", accent: "#10b981" },
  ];
  const s = slides[step];
  return (
    <div style={{ minHeight: "100vh", background: s.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", transition: "background .4s" }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>{s.emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 26, color: "#1a1a1a", marginBottom: 12, lineHeight: 1.2 }}>{s.title}</div>
      <div style={{ fontSize: 16, color: "#666", lineHeight: 1.6, maxWidth: 300, marginBottom: 40 }}>{s.sub}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {slides.map((_, i) => <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? s.accent : "#ddd", transition: "all .3s" }} />)}
      </div>
      <Btn onClick={() => step < slides.length - 1 ? setStep(step + 1) : onDone()} style={{ width: "100%", maxWidth: 320, padding: "16px 20px" }} variant="primary">
        {step < slides.length - 1 ? "Weiter →" : "Los geht's 🎉"}
      </Btn>
    </div>
  );
}

function HuiAuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = () => {
    if (!email.trim()) { setError("Bitte E-Mail eingeben"); return; }
    if (password.length < 6) { setError("Passwort: mind. 6 Zeichen"); return; }
    if (mode === "register" && !name.trim()) { setError("Bitte Namen eingeben"); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("hui_user", JSON.stringify({ email, name: name || email.split("@")[0] }));
      localStorage.setItem("hui_onboarding_seen", "1");
      onLogin();
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fff8f6,#f0fffe)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🤍</div>
          <div style={{ fontWeight: 900, fontSize: 28, color: "#1a1a1a" }}>HUI</div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Human United Intelligent</div>
        </div>
        <div style={{ background: "white", borderRadius: 24, padding: 28, boxShadow: "0 4px 32px rgba(0,0,0,.08)" }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#f5f5f3", borderRadius: 12, padding: 4 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: mode === m ? "white" : "transparent", fontWeight: 700, fontSize: 14, color: mode === m ? "#1a1a1a" : "#999", cursor: "pointer", boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
                {m === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>
          {mode === "register" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 15, marginBottom: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail" type="email" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 15, marginBottom: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Passwort" type="password" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 15, marginBottom: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <Btn onClick={handle} disabled={loading} style={{ width: "100%", padding: "14px" }}>
            {loading ? "⏳ Moment..." : mode === "login" ? "Anmelden →" : "Konto erstellen →"}
          </Btn>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#aaa" }}>Demo: beliebige E-Mail + 6+ Zeichen</div>
        </div>
      </div>
    </div>
  );
}

// ─── APP HEADER ───────────────────────────────────────────────────────────────

function AppHeader({ cartCount, notifCount, onCartClick, onNotifClick }) {
  return (
    <div style={{ background: "white", padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ fontWeight: 900, fontSize: 22, color: "#1a1a1a", letterSpacing: -0.5 }}>
        hui <span style={{ color: CORAL }}>🤍</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onNotifClick} style={{ position: "relative", background: notifCount > 0 ? `${CORAL}12` : "#f5f5f3", border: "none", borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Bell size={20} color={notifCount > 0 ? CORAL : "#555"} />
          {notifCount > 0 && <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: CORAL }} />}
        </button>
        <button onClick={onCartClick} style={{ position: "relative", background: cartCount > 0 ? `${CORAL}12` : "#f5f5f3", border: "none", borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ShoppingBasket size={20} color={cartCount > 0 ? CORAL : "#555"} />
          {cartCount > 0 && <div style={{ position: "absolute", top: 5, right: 5, width: 16, height: 16, borderRadius: "50%", background: CORAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 800 }}>{cartCount}</div>}
        </button>
      </div>
    </div>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────

function SearchBarRow({ onSearchClick, onMapClick, onMatchClick }) {
  return (
    <div style={{ padding: "12px 16px 8px", display: "flex", gap: 8 }}>
      <button onClick={onSearchClick} style={{ flex: 1, background: "white", border: "1.5px solid #eee", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "left" }}>
        <Search size={16} color="#aaa" />
        <span style={{ color: "#bbb", fontSize: 14 }}>Talente, Werke, Orte …</span>
      </button>
      <button onClick={onMapClick} style={{ background: "white", border: "1.5px solid #eee", borderRadius: 14, width: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <MapPin size={18} color={TEAL} />
      </button>
      <button onClick={onMatchClick} style={{ background: `linear-gradient(135deg,${CORAL},${CORAL}cc)`, border: "none", borderRadius: 14, padding: "0 12px", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
        <span style={{ fontSize: 14 }}>✨</span>
        <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>Match</span>
      </button>
    </div>
  );
}

// ─── STORY BAR ───────────────────────────────────────────────────────────────

function StoryBar({ stories, onStoryClick, onAdd }) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "8px 16px 12px", scrollbarWidth: "none" }}>
      <button onClick={onAdd} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${CORAL}15`, border: `2px dashed ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={20} color={CORAL} />
        </div>
        <span style={{ fontSize: 10, color: "#888", maxWidth: 60, textAlign: "center", lineHeight: 1.2 }}>Story</span>
      </button>
      {stories.map((s, i) => (
        <button key={s.id} onClick={() => onStoryClick(i)} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", padding: 2, background: s.seen ? "#e0e0e0" : `linear-gradient(135deg,${CORAL},${GOLD})` }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid white" }}>
              <img src={s.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={s.name} />
            </div>
          </div>
          <span style={{ fontSize: 10, color: s.seen ? "#aaa" : "#333", maxWidth: 60, textAlign: "center", lineHeight: 1.2, fontWeight: s.seen ? 400 : 600 }}>{s.name.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}

// ─── FEED CARDS ──────────────────────────────────────────────────────────────

function WirkerCard({ wirker, onView, onBook }) {
  const badge = getBadge(wirker.recommendations);
  return (
    <div onClick={() => onView(wirker.id)} style={{ background: "white", borderRadius: 20, margin: "0 16px 12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer" }}>
      <div style={{ position: "relative" }}>
        <img src={wirker.headerImg || wirker.img} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} alt={wirker.name} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,.6),transparent)", padding: "30px 14px 10px" }}>
          <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>{wirker.name}</div>
          <div style={{ color: "rgba(255,255,255,.85)", fontSize: 12 }}>{wirker.talent}</div>
        </div>
        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.4)", borderRadius: 10, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={10} color="white" /><span style={{ color: "white", fontSize: 10 }}>{wirker.location}</span>
        </div>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Avatar src={wirker.img} size={36} name={wirker.name} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{wirker.name}</span>
              {wirker.verified && <BadgeCheck size={13} color={TEAL} />}
            </div>
            <div style={{ fontSize: 11, color: "#aaa" }}>👍 {wirker.recommendations} Empfehlungen</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: CORAL }}>{wirker.hourlyRate} €<span style={{ fontWeight: 400, fontSize: 11, color: "#aaa" }}>/Std.</span></div>
        </div>
        {badge && <div style={{ background: `${badge.color}15`, borderRadius: 8, padding: "5px 10px", display: "inline-block", fontSize: 11, fontWeight: 700, color: badge.color, marginBottom: 10 }}>{badge.label}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={e => { e.stopPropagation(); onView(wirker.id); }} style={{ flex: 1, padding: "9px" }} variant="ghost">Profil</Btn>
          <Btn onClick={e => { e.stopPropagation(); onBook(wirker.id); }} style={{ flex: 2, padding: "9px" }}>Buchen ✨</Btn>
        </div>
      </div>
    </div>
  );
}

function WerkCard({ werk, onView, onAddToCart, liked, onLike }) {
  return (
    <div onClick={() => onView(werk.id)} style={{ background: "white", borderRadius: 20, margin: "0 16px 12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer" }}>
      <div style={{ position: "relative" }}>
        <img src={werk.img} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} alt={werk.title} />
        <div style={{ position: "absolute", top: 10, left: 10, background: `${GOLD}ee`, borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "white" }}>🛍 Werk</div>
        <button onClick={e => { e.stopPropagation(); onLike(); }} style={{ position: "absolute", top: 8, right: 8, background: "white", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Heart size={16} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#ccc"} />
        </button>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", marginBottom: 3 }}>{werk.title}</div>
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}>von {werk.creator} · {werk.category}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: 20, color: CORAL }}>{werk.price} €</div>
          <Btn onClick={e => { e.stopPropagation(); onAddToCart(werk); }} style={{ padding: "8px 16px" }}>In den Korb</Btn>
        </div>
      </div>
    </div>
  );
}

function MediaCard({ item, liked, onLike }) {
  return (
    <div style={{ background: "white", borderRadius: 20, margin: "0 16px 12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
      <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar src={item.creatorImg} size={36} name={item.creator} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{item.creator}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>vor 2 Stunden</div>
        </div>
        <div style={{ background: item.mediaType === "video" ? `${CORAL}15` : `${TEAL}15`, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: item.mediaType === "video" ? CORAL : TEAL }}>{item.mediaType === "video" ? "🎬 Video" : "📷 Foto"}</div>
      </div>
      <div style={{ position: "relative" }}>
        <img src={item.img} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} alt="" />
        {item.mediaType === "video" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={20} color="white" fill="white" /></div></div>}
      </div>
      <div style={{ padding: "10px 14px 14px" }}>
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5, marginBottom: 8 }}>{item.caption}</div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={onLike} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: liked ? CORAL : "#999", fontWeight: 600, fontSize: 13 }}>
            <Heart size={15} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#aaa"} /> {(item.likes || 0) + (liked ? 1 : 0)}
          </button>
          <button style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#999", fontSize: 13 }}>
            <MessageCircle size={15} color="#aaa" /> Kommentar
          </button>
          <button style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#999", fontSize: 13 }}>
            <Share2 size={15} color="#aaa" /> Teilen
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpactFeedCard({ project, onGoImpact }) {
  const total = MOCK_IMPACT.reduce((s, p) => s + p.votes, 0);
  const pct = Math.round((project.votes / total) * 100);
  return (
    <div onClick={onGoImpact} style={{ background: `linear-gradient(135deg,${project.color}12,${project.color}06)`, border: `1.5px solid ${project.color}30`, borderRadius: 20, margin: "0 16px 12px", padding: "16px 16px 14px", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 32 }}>{project.icon}</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: project.color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>🌱 Impact Projekt · {project.month}</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{project.name}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 10 }}>{project.description}</div>
      <div style={{ background: "white", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ height: 6, background: project.color, width: `${pct}%`, transition: "width .5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#888" }}>{project.votes.toLocaleString()} Stimmen ({pct}%)</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: project.color }}>Jetzt abstimmen →</div>
      </div>
    </div>
  );
}

// ─── WIRKER PROFILE PAGE ─────────────────────────────────────────────────────

function WirkerProfilePage({ wirkerId, onBack, onBook, onAddToCart, onChat }) {
  const wirker = MOCK_WIRKER.find(w => w.id === wirkerId) || MOCK_WIRKER[0];
  const badge = getBadge(wirker.recommendations);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);

  const reviews = [
    { name: "Lena K.", img: MOCK_WIRKER[2].img, text: "Absolut talentiert und sehr herzlich. Ich komme gerne wieder!", date: "April 2026" },
    { name: "Jan W.", img: MOCK_WIRKER[3].img, text: "Professionell, pünktlich, kreativ. Kann ich nur empfehlen.", date: "März 2026" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5" }}>
      {/* Header image */}
      <div style={{ position: "relative" }}>
        <img src={wirker.headerImg} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} alt="" />
        <button onClick={onBack} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,.4)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ArrowLeft size={18} color="white" />
        </button>
        <button onClick={() => setLiked(!liked)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.4)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Heart size={18} fill={liked ? CORAL : "none"} color="white" />
        </button>
      </div>

      {/* Profile section */}
      <div style={{ background: "white", padding: "0 16px 16px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: -28 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid white", overflow: "hidden" }}>
            <img src={wirker.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={wirker.name} />
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#1a1a1a" }}>{wirker.fullName}</div>
              {wirker.verified && <BadgeCheck size={16} color={TEAL} />}
            </div>
            <div style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ background: "#f5f5f3", borderRadius: 10, padding: "5px 10px", fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {wirker.location}</div>
          <div style={{ background: "#f5f5f3", borderRadius: 10, padding: "5px 10px", fontSize: 12, color: "#555" }}>👍 {wirker.recommendations} Empfehlungen</div>
          <div style={{ background: "#f5f5f3", borderRadius: 10, padding: "5px 10px", fontSize: 12, color: "#555" }}>👥 {wirker.followers} Follower</div>
        </div>

        {badge && <div style={{ background: `${badge.color}12`, borderRadius: 10, padding: "6px 12px", display: "inline-block", fontSize: 12, fontWeight: 700, color: badge.color, marginTop: 10 }}>{badge.label}</div>}

        <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginTop: 12 }}>{wirker.bio}</div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Btn onClick={() => setFollowing(!following)} style={{ flex: 1, padding: "11px" }} variant={following ? "teal" : "ghost"}>{following ? "✓ Folge ich" : "+ Folgen"}</Btn>
          <Btn onClick={() => onChat(wirkerId)} style={{ flex: 1, padding: "11px" }} variant="ghost"><MessageCircle size={15} style={{ verticalAlign: "middle" }} /> Chat</Btn>
          <Btn onClick={() => onBook(wirkerId)} style={{ flex: 2, padding: "11px" }}>Buchen ✨</Btn>
        </div>
      </div>

      {/* Reviews */}
      <div style={{ padding: "16px 16px 32px" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 12 }}>👍 Empfehlungen</div>
        {reviews.map((r, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Avatar src={r.img} size={32} name={r.name} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{r.date}</div>
              </div>
              <ThumbsUp size={14} color={TEAL} style={{ marginLeft: "auto" }} />
            </div>
            <div style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BOOKING FLOW ─────────────────────────────────────────────────────────────

const AVAIL = {
  "sofia": { Mo: ["09:00","10:00","14:00"], Mi: ["10:00","11:00","15:00"], Fr: ["09:00","13:00"] },
  "marcus": { Di: ["10:00","14:00","16:00"], Do: ["09:00","11:00"], Sa: ["10:00","12:00"] },
  "lena": { Mo: ["08:00","09:00","17:00"], Mi: ["07:00","18:00"], Fr: ["08:00","09:00"] },
  "jan": { Di: ["15:00","16:00","17:00"], Do: ["14:00","15:00"], Sa: ["11:00","13:00"] },
  "anna": { Mo: ["10:00","11:00"], Di: ["14:00","15:00","16:00"], Fr: ["09:00","10:00","11:00"] },
};

function BookingFlow({ wirkerId, onClose, onDone }) {
  const wirker = MOCK_WIRKER.find(w => w.id === wirkerId) || MOCK_WIRKER[0];
  const avail = AVAIL[wirkerId] || {};
  const today = new Date();

  const [step, setStep] = useState(1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [locationType, setLocationType] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [zahlart, setZahlart] = useState("karte");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);

  const availableDays = new Set();
  for (let d = 1; d <= daysInMonth; d++) {
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7;
    const wd = WEEKDAYS[wdIdx];
    if (avail[wd]?.length > 0) availableDays.add(d);
  }

  const isPast = d => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDayClick = d => {
    if (!availableDays.has(d) || isPast(d)) return;
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7;
    setSelectedDate({ year: viewYear, month: viewMonth, day: d, weekday: WEEKDAYS[wdIdx] });
    setSelectedTime(null);
    setTimeout(() => setStep(2), 120);
  };

  const formatDate = d => d ? `${d.weekday}, ${d.day}. ${MONTHS[d.month]}` : "";

  const total = wirker.hourlyRate;
  const impact = Math.round(total * 0.15 * 0.15 * 100) / 100;

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => { setConfirming(false); setDone(true); }, 1500);
  };

  if (done) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
      <div style={{ fontWeight: 900, fontSize: 24, color: "#1a1a1a", marginBottom: 8, textAlign: "center" }}>Gebucht!</div>
      <div style={{ fontSize: 15, color: "#666", textAlign: "center", lineHeight: 1.6, marginBottom: 8 }}>
        {wirker.name} wurde benachrichtigt. Deine Zahlung ist im Treuhand gesichert.
      </div>
      <div style={{ background: `${TEAL}12`, borderRadius: 14, padding: "12px 20px", marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: TEAL, fontWeight: 700 }}>🌱 {impact} € fließen in Impact-Projekte</div>
      </div>
      <Btn onClick={() => { setDone(false); onDone(); }} style={{ width: "100%", maxWidth: 320, padding: "14px" }}>Zur App →</Btn>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={22} color="#333" />
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {step === 1 ? "📅 Datum wählen" : step === 2 ? "⏰ Uhrzeit" : step === 3 ? "📍 Ort" : "💳 Bestätigen"}
          </div>
          <div style={{ fontSize: 12, color: "#aaa" }}>Schritt {step} von 4 · {wirker.fullName}</div>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 4, padding: "8px 16px" }}>
        {[1,2,3,4].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? CORAL : "#eee", transition: "background .3s" }} />)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* STEP 1: Calendar */}
        {step === 1 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }} style={{ background: "#f5f5f3", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }} style={{ background: "#f5f5f3", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
              {WEEKDAYS.map(w => <div key={w} style={{ textAlign: "center", fontSize: 11, color: "#aaa", fontWeight: 600, padding: "4px 0" }}>{w}</div>)}
              {Array(firstWeekday).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const avb = availableDays.has(d);
                const past = isPast(d);
                const sel = selectedDate?.day === d && selectedDate?.month === viewMonth && selectedDate?.year === viewYear;
                return (
                  <button key={d} onClick={() => handleDayClick(d)} disabled={!avb || past}
                    style={{ aspect: "1", borderRadius: "50%", border: "none", cursor: avb && !past ? "pointer" : "default", background: sel ? CORAL : avb && !past ? `${CORAL}15` : "transparent", color: sel ? "white" : past ? "#ddd" : avb ? CORAL : "#ccc", fontWeight: avb ? 700 : 400, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {d}
                  </button>
                );
              })}
            </div>
            <div style={{ background: `${TEAL}10`, borderRadius: 12, padding: "10px 14px", fontSize: 12, color: TEAL }}>
              ✅ Verfügbare Tage sind <strong>farbig</strong> markiert
            </div>
          </div>
        )}

        {/* STEP 2: Time */}
        {step === 2 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📅 {formatDate(selectedDate)}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 16 }}>Verfügbare Zeiten für {wirker.name}:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {(avail[selectedDate?.weekday] || []).map(t => (
                <button key={t} onClick={() => { setSelectedTime(t); setTimeout(() => setStep(3), 120); }}
                  style={{ padding: "14px 8px", borderRadius: 14, border: `2px solid ${selectedTime === t ? CORAL : "#eee"}`, background: selectedTime === t ? `${CORAL}12` : "white", color: selectedTime === t ? CORAL : "#333", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  <Clock size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Location */}
        {step === 3 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📍 Wo findet es statt?</div>
            {[
              { id: "kunde", label: "Bei mir", sub: "Das Talent kommt zu dir", icon: "🏠" },
              { id: "talent", label: "Beim Talent", sub: `Bei ${wirker.name} vor Ort`, icon: "🎨" },
              { id: "online", label: "Online", sub: "Video-Call", icon: "💻" },
            ].map(opt => (
              <button key={opt.id} onClick={() => setLocationType(opt.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px", marginBottom: 10, borderRadius: 16, border: `2px solid ${locationType === opt.id ? CORAL : "#eee"}`, background: locationType === opt.id ? `${CORAL}08` : "white", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{opt.sub}</div>
                </div>
                {locationType === opt.id && <Check size={18} color={CORAL} style={{ marginLeft: "auto" }} />}
              </button>
            ))}
            {locationType === "kunde" && (
              <input value={locationAddress} onChange={e => setLocationAddress(e.target.value)} placeholder="Deine Adresse eingeben …"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, marginTop: 4, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            )}
            {locationType && <Btn onClick={() => setStep(4)} style={{ width: "100%", padding: "14px", marginTop: 16 }}>Weiter →</Btn>}
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === 4 && (
          <div>
            <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📋 Buchungsübersicht</div>
              {[
                { label: "Talent", val: wirker.fullName },
                { label: "Service", val: wirker.talent },
                { label: "Datum", val: formatDate(selectedDate) },
                { label: "Uhrzeit", val: selectedTime },
                { label: "Ort", val: locationType === "kunde" ? (locationAddress || "Deine Adresse") : locationType === "talent" ? `Bei ${wirker.name}` : "Online" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                  <span style={{ color: "#888" }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: "#222" }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 16 }}>
                <span style={{ fontWeight: 700 }}>Gesamt</span>
                <span style={{ fontWeight: 900, color: CORAL }}>{total} €</span>
              </div>
            </div>

            <div style={{ background: `${TEAL}10`, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: TEAL, marginBottom: 4 }}>🌱 Dein Impact-Beitrag</div>
              <div style={{ fontSize: 12, color: "#555" }}>Mit dieser Buchung fließen <strong>{impact} €</strong> in Herzensprojekte — das bewegt echtes Gutes.</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>💳 Zahlungsart</div>
              {[{ id: "karte", label: "Kreditkarte / Stripe", icon: "💳" }, { id: "paypal", label: "PayPal", icon: "🅿️" }].map(z => (
                <button key={z.id} onClick={() => setZahlart(z.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 8, borderRadius: 14, border: `2px solid ${zahlart === z.id ? CORAL : "#eee"}`, background: zahlart === z.id ? `${CORAL}08` : "white", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 20 }}>{z.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{z.label}</span>
                  {zahlart === z.id && <Check size={16} color={CORAL} style={{ marginLeft: "auto" }} />}
                </button>
              ))}
            </div>

            <Btn onClick={handleConfirm} disabled={confirming} style={{ width: "100%", padding: "15px", fontSize: 16 }}>
              {confirming ? "⏳ Wird verarbeitet…" : `Jetzt buchen · ${total} € 🔒`}
            </Btn>
            <div style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 8 }}>Zahlung im Treuhand gesichert · erst nach Bestätigung freigegeben</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WERK DETAIL PAGE ─────────────────────────────────────────────────────────

function WerkDetailPage({ werkId, onBack, onAddToCart }) {
  const werk = MOCK_WERKE.find(w => w.id === werkId) || MOCK_WERKE[0];
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5" }}>
      <div style={{ position: "relative" }}>
        <img src={werk.img} style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} alt={werk.title} />
        <button onClick={onBack} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,.4)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ArrowLeft size={18} color="white" />
        </button>
      </div>
      <div style={{ background: "white", padding: "20px 16px 24px" }}>
        <div style={{ background: `${GOLD}15`, borderRadius: 10, padding: "4px 10px", display: "inline-block", fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 10 }}>🛍 {werk.category}</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#1a1a1a", marginBottom: 6 }}>{werk.title}</div>
        <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12 }}>von {werk.creator}</div>
        <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{werk.description}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: 28, color: CORAL }}>{werk.price} €</div>
          <Btn onClick={() => onAddToCart(werk)} style={{ padding: "13px 28px" }}>In den Korb 🧺</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SEARCH OVERLAY ───────────────────────────────────────────────────────────

function SearchOverlay({ onClose, onViewWirker, onViewWerk }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const wirkerHits = MOCK_WIRKER.filter(w => !q || w.name.toLowerCase().includes(q.toLowerCase()) || w.talent.toLowerCase().includes(q.toLowerCase()));
  const werkHits = MOCK_WERKE.filter(w => !q || w.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#f7f7f5", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "white", padding: "14px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ flex: 1, background: "#f5f5f3", borderRadius: 14, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
          <Search size={16} color="#aaa" />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Suchen …" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 15, fontFamily: "inherit" }} />
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontWeight: 700, color: CORAL, cursor: "pointer", fontSize: 15 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {wirkerHits.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#888", marginBottom: 10 }}>TALENTE</div>
            {wirkerHits.map(w => (
              <div key={w.id} onClick={() => { onViewWirker(w.id); onClose(); }} style={{ background: "white", borderRadius: 14, padding: "12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
                <Avatar src={w.img} size={44} name={w.name} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: TEAL }}>{w.talent}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>👍 {w.recommendations} · {w.location}</div>
                </div>
                <div style={{ marginLeft: "auto", fontWeight: 800, fontSize: 14, color: CORAL }}>{w.hourlyRate} €</div>
              </div>
            ))}
          </div>
        )}
        {werkHits.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#888", marginBottom: 10 }}>WERKE</div>
            {werkHits.map(w => (
              <div key={w.id} onClick={() => { onViewWerk(w.id); onClose(); }} style={{ background: "white", borderRadius: 14, padding: "12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
                <img src={w.img} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} alt={w.title} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{w.title}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{w.category} · von {w.creator}</div>
                </div>
                <div style={{ marginLeft: "auto", fontWeight: 800, fontSize: 14, color: CORAL }}>{w.price} €</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS OVERLAY ────────────────────────────────────────────────────

function NotificationsOverlay({ onClose }) {
  const groups = [...new Set(MOCK_NOTIFICATIONS.map(n => n.group))];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#f7f7f5", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "white", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><ArrowLeft size={22} color="#333" /></button>
        <div style={{ fontWeight: 800, fontSize: 17 }}>Benachrichtigungen</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {groups.map(g => (
          <div key={g}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 4 }}>{g}</div>
            {MOCK_NOTIFICATIONS.filter(n => n.group === g).map(n => (
              <div key={n.id} style={{ background: n.read ? "white" : `${n.color}08`, border: n.read ? "1px solid #f0f0f0" : `1.5px solid ${n.color}30`, borderRadius: 16, padding: "14px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${n.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5, marginBottom: 8 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{n.time}</div>
                    {n.actions?.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {n.actions.map(a => <button key={a} style={{ background: `${n.color}15`, border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: n.color, cursor: "pointer" }}>{a}</button>)}
                      </div>
                    )}
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CART OVERLAY ─────────────────────────────────────────────────────────────

function CartOverlay({ cart, onClose, onRemove }) {
  const [step, setStep] = useState("cart");
  const [adresse, setAdresse] = useState({ name: "", strasse: "", plz: "", ort: "" });
  const [zahlart, setZahlart] = useState("karte");
  const [done, setDone] = useState(false);

  const subtotal = cart.reduce((s, i) => s + (parseFloat(String(i.price).replace(",", ".")) || 0), 0);
  const versand = cart.length > 0 ? 4.50 : 0;
  const total = subtotal + versand;
  const impact = Math.round(total * 0.15 * 0.15 * 100) / 100;

  if (done) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "40px 28px", maxWidth: 340, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#1a1a1a", marginBottom: 8 }}>Bestellung aufgegeben!</div>
        <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 20 }}>Deine Zahlung ist im Treuhand gesichert.</div>
        <div style={{ background: `${TEAL}12`, borderRadius: 12, padding: "12px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>🌱 {impact} € gehen in Herzensprojekte</div>
        </div>
        <Btn onClick={onClose} style={{ width: "100%" }}>Super, danke! 🤍</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#fafaf8", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: "18px 20px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {step === "cart" ? "🧺 Warenkorb" : step === "address" ? "📦 Lieferadresse" : "💳 Zahlung"}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#555" /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {/* Cart step */}
          {step === "cart" && (
            cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🧺</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#333" }}>Dein Warenkorb ist leer</div>
                <div style={{ color: "#aaa", fontSize: 13, marginTop: 6 }}>Entdecke wundervolle Werke im Feed</div>
                <Btn onClick={onClose} style={{ marginTop: 20, padding: "12px 28px" }} variant="ghost">Schließen</Btn>
              </div>
            ) : (
              <>
                {cart.map((item, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 16, padding: "12px 14px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
                    <img src={item.img} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover" }} alt={item.title} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>von {item.creator}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: CORAL }}>{item.price} €</div>
                    <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc" }}><X size={16} /></button>
                  </div>
                ))}
                <div style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginTop: 4 }}>
                  {[["Artikel", `${subtotal.toFixed(2)} €`], ["Versand", `${versand.toFixed(2)} €`]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ color: "#888" }}>{l}</span><span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, padding: "10px 0 0", fontWeight: 700 }}>
                    <span>Gesamt</span><span style={{ color: CORAL }}>{total.toFixed(2)} €</span>
                  </div>
                  <div style={{ background: `${TEAL}10`, borderRadius: 10, padding: "8px 12px", marginTop: 10, fontSize: 12, color: TEAL, fontWeight: 600 }}>🌱 {impact} € fließen in Herzensprojekte</div>
                </div>
                <Btn onClick={() => setStep("address")} style={{ width: "100%", padding: "14px", marginTop: 14 }}>Weiter zur Lieferadresse →</Btn>
              </>
            )
          )}

          {/* Address step */}
          {step === "address" && (
            <>
              {[["Name", "name", "Dein Name"], ["Straße & Nr.", "strasse", "Musterstraße 42"], ["PLZ", "plz", "80331"], ["Ort", "ort", "München"]].map(([label, field, ph]) => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>{label}</div>
                  <input value={adresse[field]} onChange={e => setAdresse(a => ({ ...a, [field]: e.target.value }))} placeholder={ph}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
              ))}
              <Btn onClick={() => setStep("payment")} style={{ width: "100%", padding: "14px", marginTop: 4 }}>Weiter zur Zahlung →</Btn>
            </>
          )}

          {/* Payment step */}
          {step === "payment" && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💳 Zahlungsart wählen</div>
              {[{ id: "karte", label: "Kreditkarte", icon: "💳" }, { id: "paypal", label: "PayPal", icon: "🅿️" }, { id: "klarna", label: "Klarna", icon: "🛒" }].map(z => (
                <button key={z.id} onClick={() => setZahlart(z.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 8, borderRadius: 14, border: `2px solid ${zahlart === z.id ? CORAL : "#eee"}`, background: zahlart === z.id ? `${CORAL}08` : "white", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 22 }}>{z.icon}</span>
                  <span style={{ fontWeight: 600 }}>{z.label}</span>
                  {zahlart === z.id && <Check size={16} color={CORAL} style={{ marginLeft: "auto" }} />}
                </button>
              ))}
              <div style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginTop: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
                  <span>Gesamtbetrag</span><span style={{ color: CORAL }}>{total.toFixed(2)} €</span>
                </div>
              </div>
              <Btn onClick={() => setDone(true)} style={{ width: "100%", padding: "14px" }}>Jetzt kaufen · {total.toFixed(2)} € 🔒</Btn>
              <div style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 8 }}>Sicher & verschlüsselt · Treuhand-System</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── IMPACT PAGE ──────────────────────────────────────────────────────────────

function ImpactPage() {
  const [activeTab, setActiveTab] = useState("abstimmen");
  const [votedFor, setVotedFor] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [donateProject, setDonateProject] = useState(null);
  const [donateAmt, setDonateAmt] = useState(10);

  const totalVotes = MOCK_IMPACT.reduce((s, p) => s + p.votes, 0);

  const handleVote = (id) => {
    setVotedFor(id);
    setVoteSuccess(true);
    setTimeout(() => setVoteSuccess(false), 3000);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${TEAL},#10b981)`, padding: "24px 20px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.75)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>🌱 HUI Impact</div>
        <div style={{ fontWeight: 900, fontSize: 24, color: "white", marginBottom: 6 }}>Euer Impact · Mai 2026</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.85)" }}>Wählt gemeinsam, wohin die Mittel fließen.</div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {[["3.210 €", "Impact Pool"], ["1.993", "Stimmen"], ["4 Tage", "noch übrig"]].map(([v, l]) => (
            <div key={l} style={{ flex: 1, background: "rgba(255,255,255,.15)", borderRadius: 14, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "white" }}>{v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {voteSuccess && (
        <div style={{ background: `${TEAL}15`, border: `1.5px solid ${TEAL}40`, borderRadius: 14, margin: "12px 16px", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🗳️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: TEAL }}>Stimme abgegeben!</div>
            <div style={{ fontSize: 12, color: "#555" }}>Danke! Du hast mitentschieden wohin der Impact fließt.</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, padding: "12px 16px 0", background: "white" }}>
        {[["abstimmen","🗳️ Abstimmen"], ["projekte","📋 Alle Projekte"], ["bewerben","📝 Bewerben"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "10px 4px", border: "none", background: "transparent", borderBottom: `2.5px solid ${activeTab === tab ? TEAL : "transparent"}`, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? TEAL : "#888", fontSize: 13, cursor: "pointer", transition: "all .2s" }}>{label}</button>
        ))}
      </div>

      {/* Abstimmen Tab */}
      {activeTab === "abstimmen" && (
        <div style={{ padding: "16px 16px" }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 14, lineHeight: 1.5 }}>
            {votedFor ? "Du hast bereits abgestimmt. Danke! 🙏" : "Wähle das Projekt, das diesen Monat den vollen Impact-Pool erhalten soll:"}
          </div>
          {MOCK_IMPACT.map(p => {
            const pct = Math.round((p.votes / totalVotes) * 100);
            const isVoted = votedFor === p.id;
            return (
              <div key={p.id} style={{ background: "white", borderRadius: 20, padding: "18px 16px", marginBottom: 14, boxShadow: `0 2px 12px ${p.color}20`, border: isVoted ? `2px solid ${p.color}` : "2px solid transparent" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 36 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{p.category}</div>
                  </div>
                  {isVoted && <div style={{ background: `${p.color}20`, borderRadius: 10, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: p.color }}>✓ Deine Wahl</div>}
                </div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 12 }}>{p.description}</div>
                <div style={{ background: "#f5f5f5", borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: 8, background: p.color, width: `${pct}%`, transition: "width .5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 14 }}>
                  <span>{p.votes.toLocaleString()} Stimmen ({pct}%)</span>
                  <span>{pct === Math.max(...MOCK_IMPACT.map(x => Math.round((x.votes / totalVotes) * 100))) ? "🏆 Führend" : ""}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!votedFor && <Btn onClick={() => handleVote(p.id)} style={{ flex: 2, padding: "10px" }} variant="teal">🗳️ Wählen</Btn>}
                  <button onClick={() => { setDonateProject(p); setShowDonate(true); }} style={{ flex: 1, padding: "10px", borderRadius: 14, border: `1.5px solid ${p.color}`, background: `${p.color}10`, color: p.color, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💚 Spenden</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projekte Tab */}
      {activeTab === "projekte" && (
        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>Alle aktuell geförderten Projekte:</div>
          {MOCK_IMPACT.map(p => (
            <div key={p.id} style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{p.category} · {p.month}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{p.description}</div>
              {p.contact_name && <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>Kontakt: {p.contact_name} · {p.contact_email}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Bewerben Tab */}
      {activeTab === "bewerben" && <BewerbungForm />}

      {/* Donate modal */}
      {showDonate && donateProject && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "24px 20px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>💚 Direkt spenden</div>
              <button onClick={() => setShowDonate(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{donateProject.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{donateProject.name}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{donateProject.category}</div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Betrag wählen:</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[5, 10, 25, 50].map(a => (
                <button key={a} onClick={() => setDonateAmt(a)} style={{ flex: 1, padding: "10px 4px", borderRadius: 12, border: `2px solid ${donateAmt === a ? donateProject.color : "#eee"}`, background: donateAmt === a ? `${donateProject.color}15` : "white", color: donateAmt === a ? donateProject.color : "#555", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{a} €</button>
              ))}
            </div>
            <Btn onClick={() => setShowDonate(false)} style={{ width: "100%", padding: "14px", background: donateProject.color, color: "white" }}>Jetzt {donateAmt} € spenden 💚</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function BewerbungForm() {
  const [form, setForm] = useState({ name: "", cat: "", desc: "", contact: "", email: "", website: "" });
  const [sent, setSent] = useState(false);

  if (sent) return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 8 }}>Bewerbung abgeschickt!</div>
      <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>Das HUI-Team meldet sich innerhalb von 48 Stunden bei dir. Danke, dass du etwas bewegen möchtest! 🌍</div>
    </div>
  );

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ background: `${TEAL}10`, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: TEAL, marginBottom: 4 }}>Bewirb dein Projekt</div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>Reiche dein Herzensprojekt ein. Das HUI-Team wählt monatlich drei Projekte für die Community-Abstimmung.</div>
      </div>
      {[["Projektname", "name", "z.B. Schule für alle"], ["Kategorie", "cat", "z.B. Bildung, Umwelt, Gesundheit …"], ["Kurzbeschreibung", "desc", "Was macht euer Projekt? (Max. 200 Zeichen)"], ["Ansprechpartner", "contact", "Dein Name"], ["E-Mail", "email", "kontakt@projekt.org"], ["Website (optional)", "website", "https://euerprojekt.de"]].map(([label, field, ph]) => (
        <div key={field} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>{label}</div>
          {field === "desc"
            ? <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={ph} rows={3} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            : <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={ph} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          }
        </div>
      ))}
      <Btn onClick={() => setSent(true)} style={{ width: "100%", padding: "14px", marginTop: 4 }} variant="teal">Bewerbung absenden →</Btn>
    </div>
  );
}

// ─── FAVORITES PAGE ───────────────────────────────────────────────────────────

function FavoritesPage({ faved, liked, onViewWirker, onViewWerk }) {
  const favedWirker = MOCK_WIRKER.filter(w => faved[w.id]);
  const likedWerke = MOCK_WERKE.filter(w => liked[w.id]);
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ background: "white", padding: "20px 16px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#1a1a1a" }}>❤️ Gespeichert</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>Deine Lieblinge auf einen Blick</div>
      </div>
      {favedWirker.length === 0 && likedWerke.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>💫</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#333", marginBottom: 6 }}>Noch nichts gespeichert</div>
          <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>Tippe auf Herzen im Feed um Talente und Werke zu speichern.</div>
        </div>
      ) : (
        <div style={{ padding: "16px" }}>
          {favedWirker.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#888", marginBottom: 10 }}>TALENTE</div>
              {favedWirker.map(w => (
                <div key={w.id} onClick={() => onViewWirker(w.id)} style={{ background: "white", borderRadius: 16, padding: "12px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
                  <Avatar src={w.img} size={48} name={w.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: TEAL }}>{w.talent}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>👍 {w.recommendations} · {w.location}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: CORAL }}>{w.hourlyRate} €</div>
                </div>
              ))}
            </>
          )}
          {likedWerke.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#888", marginBottom: 10, marginTop: 8 }}>WERKE</div>
              {likedWerke.map(w => (
                <div key={w.id} onClick={() => onViewWerk(w.id)} style={{ background: "white", borderRadius: 16, padding: "12px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
                  <img src={w.img} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} alt={w.title} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{w.title}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{w.category}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: CORAL }}>{w.price} €</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CHATS PAGE ───────────────────────────────────────────────────────────────

function ChatsPage({ onOpenChat }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ background: "white", padding: "20px 16px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#1a1a1a" }}>💬 Nachrichten</div>
      </div>
      {MOCK_CHATS.map(chat => (
        <div key={chat.id} onClick={() => onOpenChat(chat)} style={{ background: "white", padding: "14px 16px", borderBottom: "1px solid #f5f5f3", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
          <Avatar src={chat.img} size={48} name={chat.name} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{chat.name}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{chat.time}</div>
            </div>
            <div style={{ fontSize: 13, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{chat.lastMsg}</div>
          </div>
          {chat.unread > 0 && <div style={{ width: 20, height: 20, borderRadius: "50%", background: CORAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>{chat.unread}</div>}
        </div>
      ))}
    </div>
  );
}

function ChatView({ chat, onBack }) {
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState([
    { id: 1, from: "other", text: chat.lastMsg, time: chat.time },
  ]);

  const send = () => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { id: Date.now(), from: "me", text: msg, time: "Jetzt" }]);
    setMsg("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#f7f7f5", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "white", padding: "14px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}><ArrowLeft size={22} color="#333" /></button>
        <Avatar src={chat.img} size={36} name={chat.name} />
        <div style={{ fontWeight: 700, fontSize: 15 }}>{chat.name}</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "75%", background: m.from === "me" ? CORAL : "white", color: m.from === "me" ? "white" : "#1a1a1a", borderRadius: m.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
              <div>{m.text}</div>
              <div style={{ fontSize: 10, opacity: .6, marginTop: 4, textAlign: "right" }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", padding: "12px 16px", display: "flex", gap: 8, borderTop: "1px solid #f0f0f0" }}>
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Nachricht …" style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1.5px solid #eee", outline: "none", fontSize: 14, fontFamily: "inherit" }} />
        <button onClick={send} style={{ background: CORAL, border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage({ user, onViewWirker, onLogout }) {
  const [tab, setTab] = useState("profil");
  const myWirker = MOCK_WIRKER.find(w => w.name.toLowerCase().includes((user?.name || "").split(" ")[0].toLowerCase())) || MOCK_WIRKER[0];

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      {/* Cover */}
      <div style={{ position: "relative" }}>
        <img src={myWirker.headerImg} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} alt="" />
        <div style={{ position: "absolute", bottom: -28, left: 20, width: 64, height: 64, borderRadius: "50%", border: "3px solid white", overflow: "hidden" }}>
          <img src={myWirker.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        </div>
      </div>

      <div style={{ background: "white", paddingTop: 36, padding: "36px 16px 16px" }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>{user?.name || "Lars M."}</div>
        <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginBottom: 6 }}>{myWirker.talent}</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[["142", "Follower"], ["24", "Empfehlungen"], ["47 €", "Impact"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{v}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "white", borderBottom: "1px solid #f0f0f0" }}>
        {[["profil","👤 Profil"], ["settings","⚙️ Einstellungen"]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "12px 4px", border: "none", background: "transparent", borderBottom: `2.5px solid ${tab === t ? CORAL : "transparent"}`, color: tab === t ? CORAL : "#888", fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {tab === "profil" && (
        <div style={{ padding: "16px" }}>
          <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📊 Mein Impact</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["47,25 €", "Gesamt-Impact", TEAL], ["12", "Buchungen", CORAL], ["24", "Empfehlungen", VIOLET]].map(([v, l, c]) => (
                <div key={l} style={{ flex: 1, background: `${c}10`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <Btn onClick={() => onViewWirker(myWirker.id)} style={{ width: "100%", padding: "12px" }} variant="ghost">Mein öffentliches Profil ansehen →</Btn>
        </div>
      )}

      {tab === "settings" && (
        <div style={{ padding: "16px" }}>
          {[
            { icon: "🔔", label: "Benachrichtigungen", sub: "Push & E-Mail" },
            { icon: "🔒", label: "Datenschutz", sub: "Sichtbarkeit & Daten" },
            { icon: "💳", label: "Zahlungen", sub: "Karten & Konten" },
            { icon: "🌍", label: "Sprache", sub: "Deutsch" },
            { icon: "❓", label: "Hilfe & Support", sub: "FAQ, Kontakt" },
          ].map(({ icon, label, sub }) => (
            <div key={label} style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{sub}</div>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </div>
          ))}
          <button onClick={onLogout} style={{ width: "100%", marginTop: 12, padding: "14px", borderRadius: 14, border: "none", background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Abmelden</button>
        </div>
      )}
    </div>
  );
}

// ─── TAB BAR ──────────────────────────────────────────────────────────────────

function TabBar({ page, onNavigate, notifCount, cartCount, onCartClick }) {
  const tabs = [
    { id: "home", icon: <Home size={22} />, label: "Home" },
    { id: "impact", icon: <Leaf size={22} />, label: "Impact" },
    { id: "favorites", icon: <Heart size={22} />, label: "Saved" },
    { id: "chats", icon: <MessageCircle size={22} />, label: "Chats" },
    { id: "profile", icon: <User size={22} />, label: "Profil" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderTop: "1px solid #f0f0f0", display: "flex", padding: "6px 0 8px", zIndex: 100, boxShadow: "0 -4px 24px rgba(0,0,0,.06)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onNavigate(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", padding: "4px 0" }}>
          <div style={{ color: page === t.id ? CORAL : "#aaa", transition: "color .2s", position: "relative" }}>
            {t.icon}
            {t.id === "chats" && notifCount > 0 && <div style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: "50%", background: CORAL }} />}
          </div>
          <span style={{ fontSize: 10, fontWeight: page === t.id ? 700 : 400, color: page === t.id ? CORAL : "#aaa" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── HUI MATCH OVERLAY ────────────────────────────────────────────────────────

function HuiMatchOverlay({ onClose, onViewWirker }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const handle = () => {
    if (!q.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const hits = MOCK_WIRKER.filter(w => q.toLowerCase().split(" ").some(word => w.talent.toLowerCase().includes(word) || w.bio.toLowerCase().includes(word)));
      setResult(hits.length > 0 ? hits : MOCK_WIRKER.slice(0, 2));
      setLoading(false);
    }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#f7f7f5", display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(135deg,${CORAL},${GOLD})`, padding: "20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,.25)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="white" />
        </button>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "white" }}>✨ HUI Match</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)" }}>KI findet dein perfektes Talent</div>
        </div>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <div style={{ fontSize: 14, color: "#555", marginBottom: 14, lineHeight: 1.6 }}>Beschreib einfach was du brauchst — in normaler Sprache:</div>
        <div style={{ background: "white", borderRadius: 16, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-end", boxShadow: "0 2px 12px rgba(0,0,0,.08)", marginBottom: 14 }}>
          <textarea ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="z.B. Ich suche jemanden der mir beim Umdekorieren meines Wohnzimmers hilft …" rows={3} style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14, fontFamily: "inherit", color: "#1a1a1a" }} />
        </div>
        <Btn onClick={handle} disabled={loading || !q.trim()} style={{ width: "100%", padding: "14px" }}>
          {loading ? "⏳ KI sucht …" : "✨ Passende Talente finden"}
        </Btn>
      </div>
      {result && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#888", marginBottom: 12 }}>✨ {result.length} MATCHES GEFUNDEN</div>
          {result.map(w => (
            <div key={w.id} onClick={() => { onViewWirker(w.id); onClose(); }} style={{ background: "white", borderRadius: 16, padding: "14px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: `1.5px solid ${CORAL}20` }}>
              <Avatar src={w.img} size={52} name={w.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</div>
                <div style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{w.talent}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>👍 {w.recommendations} · {w.location}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: CORAL }}>{w.hourlyRate} €</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAP OVERLAY ──────────────────────────────────────────────────────────────

function MapOverlay({ onClose, onViewWirker }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#e8f4f8", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "white", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><ArrowLeft size={22} color="#333" /></button>
        <div style={{ fontWeight: 800, fontSize: 17 }}>🗺️ Karte</div>
      </div>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e8f4f8,#d4edda)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 6 }}>Kartenansicht</div>
          <div style={{ fontSize: 13, color: "#888" }}>Talente in deiner Nähe entdecken</div>
        </div>
        {/* Pin cards */}
        {MOCK_WIRKER.slice(0, 3).map((w, i) => (
          <div key={w.id} onClick={() => { onViewWirker(w.id); onClose(); }} style={{ position: "absolute", top: `${25 + i * 22}%`, left: `${20 + i * 25}%`, background: "white", borderRadius: 14, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.15)", border: `1.5px solid ${CORAL}30` }}>
            <Avatar src={w.img} size={28} name={w.name} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{w.name}</div>
              <div style={{ fontSize: 11, color: CORAL, fontWeight: 600 }}>{w.hourlyRate} €/Std.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STORY VIEWER ─────────────────────────────────────────────────────────────

function StoryViewer({ story, onClose }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => { if (p >= 100) { onClose(); return 100; } return p + 2; }), 60);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "black" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,.3)" }}>
        <div style={{ height: "100%", background: "white", width: `${progress}%`, transition: "width .1s linear" }} />
      </div>
      <img src={story.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      <div style={{ position: "absolute", top: 14, left: 0, right: 0, padding: "0 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar src={story.img} size={32} name={story.name} />
        <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{story.name}</span>
        <span style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginLeft: 4 }}>vor 2 Std.</span>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X size={22} color="white" /></button>
      </div>
    </div>
  );
}

// ─── TALENT ANBIETEN FLOW ─────────────────────────────────────────────────────

function TalentAnbietenPage({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", talent: "", bio: "", location: "", rate: "" });
  const [done, setDone] = useState(false);

  if (done) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>🎨</div>
      <div style={{ fontWeight: 900, fontSize: 24, color: "#1a1a1a", marginBottom: 8, textAlign: "center" }}>Willkommen als Wirker!</div>
      <div style={{ fontSize: 14, color: "#666", textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>Dein Profil wird geprüft und in Kürze freigeschaltet. Wir melden uns bei dir! 🤍</div>
      <Btn onClick={onClose} style={{ width: "100%", maxWidth: 300, padding: "14px" }}>Zur App →</Btn>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "white", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={22} color="#333" />
        </button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>
          {step === 1 ? "🎨 Dein Talent" : step === 2 ? "📍 Über dich" : "✅ Fast fertig!"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "8px 16px" }}>
        {[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? CORAL : "#eee" }} />)}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {step === 1 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Was ist dein Talent?</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>Mein Name</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Sofia Meier" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>Mein Talent</div>
              <input value={form.talent} onChange={e => setForm(f => ({ ...f, talent: e.target.value }))} placeholder="z.B. Keramik & Töpferei, Fotografie …" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>Stundensatz (€)</div>
              <input value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="z.B. 65" type="number" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <Btn onClick={() => setStep(2)} disabled={!form.name || !form.talent} style={{ width: "100%", padding: "14px", marginTop: 8 }}>Weiter →</Btn>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Erzähl uns von dir</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>Dein Standort</div>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="z.B. München" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>Über mich</div>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Was macht dich besonders? Was liebst du an deinem Talent?" rows={4} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <Btn onClick={() => setStep(3)} disabled={!form.location || !form.bio} style={{ width: "100%", padding: "14px", marginTop: 8 }}>Weiter →</Btn>
          </>
        )}
        {step === 3 && (
          <>
            <div style={{ background: `${TEAL}10`, borderRadius: 18, padding: "20px 16px", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 12 }}>📋 Dein Profil</div>
              {[["Name", form.name], ["Talent", form.talent], ["Stundensatz", `${form.rate} €`], ["Standort", form.location]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                  <span style={{ color: "#888" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: `${CORAL}10`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#555", lineHeight: 1.5 }}>
              🔒 Dein Profil wird vom HUI-Team geprüft, bevor es öffentlich wird. Wir melden uns innerhalb von 24 Stunden.
            </div>
            <Btn onClick={() => setDone(true)} style={{ width: "100%", padding: "14px" }} variant="teal">Profil einreichen 🎨</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CREATE SHEET ─────────────────────────────────────────────────────────────

function CreateSheet({ onClose, onTalentAnbieten }) {
  const options = [
    { icon: "📖", label: "Story teilen", sub: "24h sichtbar · für alle", color: GOLD, action: onClose },
    { icon: "🛍", label: "Werk verkaufen", sub: "Handgemachtes anbieten", color: TEAL, action: onClose },
    { icon: "🎨", label: "Als Wirker starten", sub: "Dein Talent anbieten", color: CORAL, action: onTalentAnbieten },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.4)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>✨ Was möchtest du erstellen?</div>
        {options.map(o => (
          <button key={o.label} onClick={o.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px", marginBottom: 10, borderRadius: 16, border: `1.5px solid ${o.color}30`, background: `${o.color}08`, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 32 }}>{o.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{o.label}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{o.sub}</div>
            </div>
            <ChevronRight size={18} color="#ccc" style={{ marginLeft: "auto" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── AUTH STATE ──────────────────────────────────────────────────────────────
  const [authState, setAuthState] = useState(() => {
    const seen = localStorage.getItem("hui_onboarding_seen");
    const user = localStorage.getItem("hui_user");
    if (user) return "app";
    if (seen) return "auth";
    return "onboarding";
  });

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_user") || "null"); } catch { return null; }
  });

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState("home");
  const [detailView, setDetailView] = useState(null); // { type: "wirker"|"werk", id }

  // ── OVERLAYS ────────────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showTalent, setShowTalent] = useState(false);
  const [storyViewer, setStoryViewer] = useState(null);
  const [bookingWirkerId, setBookingWirkerId] = useState(null);
  const [openChat, setOpenChat] = useState(null);

  // ── DATA ────────────────────────────────────────────────────────────────────
  const [liked, setLiked] = useState({});
  const [faved, setFaved] = useState({});
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_cart") || "[]"); } catch { return []; }
  });
  const [toast, setToast] = useState(null);
  const [liveWirker, setLiveWirker] = useState([]);
  const [liveImpact, setLiveImpact] = useState([]);

  // ── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("hui_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    HuiWirker.list().then(data => { if (data?.length) setLiveWirker(data); }).catch(() => {});
    HuiImpactProject.list().then(data => { if (data?.length) setLiveImpact(data); }).catch(() => {});
  }, []);

  // ── ACTIONS ─────────────────────────────────────────────────────────────────
  const addToCart = (item) => {
    setCart(c => [...c, item]);
    setToast(item);
    setTimeout(() => setToast(null), 2800);
  };

  const removeFromCart = (i) => setCart(c => c.filter((_, idx) => idx !== i));

  const handleLogin = () => {
    try { setUser(JSON.parse(localStorage.getItem("hui_user") || "null")); } catch {}
    setAuthState("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("hui_user");
    localStorage.removeItem("hui_onboarding_seen");
    setUser(null);
    setAuthState("onboarding");
  };

  const notifCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  // ── BUILD FEED ──────────────────────────────────────────────────────────────
  const feedWirker = liveWirker.length > 0
    ? liveWirker.map(w => ({ id: w.id, type: "wirker", wirker: { id: w.id || w.name, name: w.name, fullName: w.full_name || w.name, talent: w.talent, location: w.location, hourlyRate: w.hourly_rate || 60, recommendations: w.recommendations || 0, followers: w.followers || 0, verified: w.verified || false, bio: w.bio || "", img: w.img || MOCK_WIRKER[0].img, headerImg: w.header_img || w.img || MOCK_WIRKER[0].headerImg } }))
    : [];

  const feed = feedWirker.length > 0
    ? [...feedWirker, ...MOCK_FEED.filter(f => f.type !== "wirker")]
    : MOCK_FEED;

  // ── RENDER AUTH ─────────────────────────────────────────────────────────────
  if (authState === "onboarding") return <HuiOnboarding onDone={() => { localStorage.setItem("hui_onboarding_seen","1"); setAuthState("auth"); }} />;
  if (authState === "auth") return <HuiAuthScreen onLogin={handleLogin} />;

  // ── RENDER DETAIL VIEWS ─────────────────────────────────────────────────────
  if (detailView?.type === "wirker") return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5" }}>
      <WirkerProfilePage
        wirkerId={detailView.id}
        onBack={() => setDetailView(null)}
        onBook={(id) => { setDetailView(null); setBookingWirkerId(id); }}
        onAddToCart={addToCart}
        onChat={(id) => { setDetailView(null); setOpenChat(MOCK_CHATS.find(c => c.name.toLowerCase().includes(id)) || MOCK_CHATS[0]); setPage("chats"); }}
      />
      {toast && <Toast item={toast} onClose={() => setToast(null)} />}
    </div>
  );

  if (detailView?.type === "werk") return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5" }}>
      <WerkDetailPage werkId={detailView.id} onBack={() => setDetailView(null)} onAddToCart={addToCart} />
      {toast && <Toast item={toast} onClose={() => setToast(null)} />}
    </div>
  );

  // ── RENDER BOOKING FLOW ─────────────────────────────────────────────────────
  if (bookingWirkerId) return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh" }}>
      <BookingFlow wirkerId={bookingWirkerId} onClose={() => setBookingWirkerId(null)} onDone={() => setBookingWirkerId(null)} />
    </div>
  );

  // ── RENDER MAIN APP ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", position: "relative" }}>

      {/* Sticky header */}
      <AppHeader cartCount={cart.length} notifCount={notifCount} onCartClick={() => setShowCart(true)} onNotifClick={() => setShowNotif(true)} />

      {/* Page content */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 57px)" }}>

        {/* HOME */}
        {page === "home" && (
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
            <SearchBarRow onSearchClick={() => setShowSearch(true)} onMapClick={() => setShowMap(true)} onMatchClick={() => setShowMatch(true)} />
            <StoryBar stories={MOCK_STORIES} onStoryClick={i => setStoryViewer(MOCK_STORIES[i])} onAdd={() => setShowCreate(true)} />

            {/* Featured */}
            <div style={{ padding: "4px 16px 8px" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a", marginBottom: 10 }}>✨ Ausgewählte Talente</div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                {MOCK_WIRKER.map(w => (
                  <div key={w.id} onClick={() => setDetailView({ type: "wirker", id: w.id })} style={{ flexShrink: 0, width: 130, cursor: "pointer", background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                    <img src={w.img} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} alt={w.name} />
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 3 }}>{w.name} {w.verified && <BadgeCheck size={10} color={TEAL} />}</div>
                      <div style={{ fontSize: 10, color: TEAL, fontWeight: 600 }}>{w.talent}</div>
                      <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>👍 {w.recommendations}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feed */}
            <div style={{ paddingTop: 4 }}>
              {feed.map(item => {
                if (item.type === "wirker") return <WirkerCard key={item.id} wirker={item.wirker} onView={id => setDetailView({ type: "wirker", id })} onBook={id => setBookingWirkerId(id)} />;
                if (item.type === "werk") return <WerkCard key={item.id} werk={item.werk} onView={id => setDetailView({ type: "werk", id })} onAddToCart={addToCart} liked={!!liked[item.werk?.id]} onLike={() => setLiked(l => ({ ...l, [item.werk?.id]: !l[item.werk?.id] }))} />;
                if (item.type === "media") return <MediaCard key={item.id} item={item} liked={!!liked[item.id]} onLike={() => setLiked(l => ({ ...l, [item.id]: !l[item.id] }))} />;
                if (item.type === "impact") return <ImpactFeedCard key={item.id} project={item.project} onGoImpact={() => setPage("impact")} />;
                return null;
              })}
            </div>
          </div>
        )}

        {/* IMPACT */}
        {page === "impact" && <ImpactPage />}

        {/* FAVORITES */}
        {page === "favorites" && <FavoritesPage faved={faved} liked={liked} onViewWirker={id => setDetailView({ type: "wirker", id })} onViewWerk={id => setDetailView({ type: "werk", id })} />}

        {/* CHATS */}
        {page === "chats" && !openChat && <ChatsPage onOpenChat={setOpenChat} />}
        {page === "chats" && openChat && <ChatView chat={openChat} onBack={() => setOpenChat(null)} />}

        {/* PROFILE */}
        {page === "profile" && <ProfilePage user={user} onViewWirker={id => setDetailView({ type: "wirker", id })} onLogout={handleLogout} />}
      </div>

      {/* Tab Bar */}
      <TabBar page={page} onNavigate={setPage} notifCount={notifCount} cartCount={cart.length} />

      {/* FAB */}
      <button onClick={() => setShowCreate(true)} style={{ position: "fixed", bottom: 76, right: "max(16px, calc(50vw - 215px + 16px))", width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${CORAL},${GOLD})`, border: "none", boxShadow: "0 4px 20px rgba(255,107,91,.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 90 }}>
        <Plus size={24} color="white" />
      </button>

      {/* OVERLAYS */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} onViewWirker={id => { setDetailView({ type: "wirker", id }); setShowSearch(false); }} onViewWerk={id => { setDetailView({ type: "werk", id }); setShowSearch(false); }} />}
      {showNotif && <NotificationsOverlay onClose={() => setShowNotif(false)} />}
      {showCart && <CartOverlay cart={cart} onClose={() => setShowCart(false)} onRemove={removeFromCart} />}
      {showMatch && <HuiMatchOverlay onClose={() => setShowMatch(false)} onViewWirker={id => { setDetailView({ type: "wirker", id }); setShowMatch(false); }} />}
      {showMap && <MapOverlay onClose={() => setShowMap(false)} onViewWirker={id => { setDetailView({ type: "wirker", id }); setShowMap(false); }} />}
      {showCreate && <CreateSheet onClose={() => setShowCreate(false)} onTalentAnbieten={() => { setShowCreate(false); setShowTalent(true); }} />}
      {showTalent && <TalentAnbietenPage onClose={() => setShowTalent(false)} />}
      {storyViewer && <StoryViewer story={storyViewer} onClose={() => setStoryViewer(null)} />}

      {/* Toast */}
      {toast && <Toast item={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

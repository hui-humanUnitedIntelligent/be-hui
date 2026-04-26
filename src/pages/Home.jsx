import { useState, useEffect } from "react";
import { Heart, Share2, Star, Search, Plus, Zap, User, Globe, ShoppingBasket, Bell, ChevronRight, MapPin, Play, X } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

// Mock Data
const mockStories = [
  { id: 1, name: "Sofia", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", hasNew: true },
  { id: 2, name: "Marcus", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", hasNew: true },
  { id: 3, name: "Lena", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", hasNew: false },
  { id: 4, name: "Tom", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", hasNew: true },
  { id: 5, name: "Maria", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", hasNew: false },
];

const mockFeed = [
  {
    id: 1, type: "werk",
    title: "Handgemachte Keramik-Tasse",
    creator: "Sofia M.",
    creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop",
    price: "38 €",
    likes: 124,
    location: "München",
  },
  {
    id: 2, type: "wirker",
    name: "Marcus B.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    talent: "Fotograf & Videograf",
    recommendations: 47,
    location: "Berlin",
  },
  {
    id: 3, type: "werk",
    title: "Aquarell-Portrait",
    creator: "Lena K.",
    creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=600&h=400&fit=crop",
    price: "120 €",
    likes: 89,
    location: "Hamburg",
  },
  {
    id: 4, type: "impact",
    title: "Bäume für Kenia",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop",
    collected: "2.340 €",
    goal: "5.000 €",
    progress: 47,
  },
  {
    id: 5, type: "werk",
    title: "Handgenähter Leder-Rucksack",
    creator: "Tom H.",
    creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop",
    price: "195 €",
    likes: 203,
    location: "Wien",
  },
  {
    id: 6, type: "wirker",
    name: "Maria L.",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    talent: "Yoga & Achtsamkeits-Coach",
    recommendations: 93,
    location: "Zürich",
  },
];

function Header({ cartCount, onCartClick }) {
  return (
    <div style={{
      background: "white",
      padding: "12px 16px 0",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
          <span style={{ color: CORAL }}>H</span>
          <span style={{ color: CORAL }}>U</span>
          <span style={{ color: CORAL }}>I</span>
          <span style={{ color: TEAL }}> – Human United Intelligent</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCartClick} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}>
            <ShoppingBasket size={24} color="#555" />
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2,
                background: CORAL, color: "white", borderRadius: "50%",
                width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700
              }}>{cartCount}</span>
            )}
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Bell size={24} color="#555" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ onClick }) {
  return (
    <div style={{
      background: "white", padding: "8px 16px",
      position: "sticky", top: 56, zIndex: 99,
      borderBottom: "1px solid #f0f0f0"
    }}>
      <div
        onClick={onClick}
        style={{
          background: "#f5f5f5", borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer"
        }}
      >
        <Search size={18} color="#aaa" />
        <span style={{ color: "#aaa", fontSize: 15 }}>Suche nach Talent, Werk, Name…</span>
      </div>
    </div>
  );
}

function StoryBar() {
  return (
    <div style={{ padding: "12px 0 4px", overflowX: "auto", display: "flex", gap: 12, paddingLeft: 16, paddingRight: 16 }}>
      {mockStories.map(s => (
        <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 60 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: s.hasNew ? `2.5px solid ${CORAL}` : "2.5px solid #ddd",
            padding: 2, cursor: "pointer"
          }}>
            <img src={s.img} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt={s.name} />
          </div>
          <span style={{ fontSize: 11, color: "#555", textAlign: "center" }}>{s.name}</span>
        </div>
      ))}
    </div>
  );
}

function WerkCard({ item, onLike, liked, onFav, faved, onAddToCart }) {
  return (
    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", margin: "8px 16px" }}>
      <div style={{ position: "relative" }}>
        <img src={item.img} style={{ width: "100%", height: 220, objectFit: "cover" }} alt={item.title} />
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: CORAL, color: "white", borderRadius: 20,
          padding: "4px 10px", fontWeight: 700, fontSize: 14
        }}>{item.price}</div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <img src={item.creatorImg} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} alt={item.creator} />
          <span style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>{item.creator}</span>
          <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin size={11} color="#aaa" />{item.location}
          </span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#222", marginBottom: 10 }}>{item.title}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => onLike(item.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, color: liked ? CORAL : "#888", fontSize: 13
          }}>
            <Heart size={18} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#888"} />
            {item.likes + (liked ? 1 : 0)}
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
            <Share2 size={18} />
          </button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: faved ? GOLD : "#888" }}>
            <Star size={18} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#888"} />
          </button>
          <button onClick={() => onAddToCart(item)} style={{
            marginLeft: "auto", background: CORAL, color: "white",
            border: "none", borderRadius: 10, padding: "7px 14px",
            fontWeight: 700, fontSize: 13, cursor: "pointer"
          }}>In den Korb</button>
        </div>
      </div>
    </div>
  );
}

function WirkerCard({ item }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${TEAL}11, ${TEAL}22)`,
      border: `1.5px solid ${TEAL}33`,
      borderRadius: 16, margin: "8px 16px", padding: 16,
      display: "flex", gap: 14, alignItems: "center"
    }}>
      <img src={item.img} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}` }} alt={item.name} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>{item.name}</div>
        <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginBottom: 4 }}>{item.talent}</div>
        <div style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} />{item.location} · {item.recommendations} Empfehlungen
        </div>
      </div>
      <button style={{
        background: TEAL, color: "white", border: "none",
        borderRadius: 10, padding: "8px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer"
      }}>Talent<br/>ansehen</button>
    </div>
  );
}

function ImpactCard({ item }) {
  return (
    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", margin: "8px 16px" }}>
      <div style={{ position: "relative" }}>
        <img src={item.img} style={{ width: "100%", height: 160, objectFit: "cover" }} alt={item.title} />
        <div style={{ position: "absolute", top: 10, left: 10, background: GOLD, color: "white", borderRadius: 20, padding: "4px 12px", fontWeight: 700, fontSize: 12 }}>
          🌱 Impact-Projekt
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "#222" }}>{item.title}</div>
        <div style={{ background: "#f0f0f0", borderRadius: 99, height: 8, marginBottom: 6 }}>
          <div style={{ background: `linear-gradient(90deg, ${GOLD}, ${CORAL})`, height: 8, borderRadius: 99, width: `${item.progress}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888" }}>
          <span>{item.collected} gesammelt</span>
          <span>Ziel: {item.goal}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [liked, setLiked] = useState({});
  const [faved, setFaved] = useState({});
  const [cart, setCart] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isNewUser] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const toggleLike = (id) => setLiked(p => ({ ...p, [id]: !p[id] }));
  const toggleFav = (id) => setFaved(p => ({ ...p, [id]: !p[id] }));
  const addToCart = (item) => setCart(p => [...p, item]);

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fafaf8", fontFamily: "'Inter', sans-serif", position: "relative", overflowX: "hidden" }}>
      {page === "home" && (
        <>
          <Header cartCount={cart.length} onCartClick={() => setShowCart(true)} />
          <SearchBar onClick={() => setShowSearch(true)} />
          <StoryBar />
          <div style={{ paddingBottom: 90 }}>
            {mockFeed.map(item => {
              if (item.type === "werk") return <WerkCard key={item.id} item={item} onLike={toggleLike} liked={!!liked[item.id]} onFav={toggleFav} faved={!!faved[item.id]} onAddToCart={addToCart} />;
              if (item.type === "wirker") return <WirkerCard key={item.id} item={item} />;
              if (item.type === "impact") return <ImpactCard key={item.id} item={item} />;
              return null;
            })}
          </div>
        </>
      )}

      {page === "impact" && <ImpactPage onBack={() => setPage("home")} />}
      {page === "favorites" && <FavoritesPage favorites={faved} onBack={() => setPage("home")} />}
      {page === "profile" && <ProfilePage onBack={() => setPage("home")} isNewUser={isNewUser} />}

      {/* Tab Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: "white",
        borderTop: "1px solid #eee", display: "flex", alignItems: "center",
        justifyContent: "space-around", padding: "8px 0 16px", zIndex: 200,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)"
      }}>
        <TabBtn icon="🏠" label="Home" active={page === "home"} onClick={() => setPage("home")} />
        <TabBtn icon="❤️" label="Impact" active={page === "impact"} onClick={() => setPage("impact")} />

        {isNewUser ? (
          <button onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            marginTop: -20
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: "50%",
              background: `radial-gradient(circle, ${GOLD}, ${CORAL})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 20px ${GOLD}88`,
              animation: "pulse 2s infinite"
            }}>
              <span style={{ fontSize: 22 }}>☀️</span>
            </div>
            <span style={{ fontSize: 9, color: GOLD, fontWeight: 700 }}>Entdecke HUI</span>
          </button>
        ) : (
          <button style={{
            width: 58, height: 58, borderRadius: "50%",
            background: CORAL, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: -20, boxShadow: `0 4px 16px ${CORAL}88`
          }}>
            <Plus size={28} color="white" strokeWidth={2.5} />
          </button>
        )}

        <TabBtn icon="⭐" label="Favoriten" active={page === "favorites"} onClick={() => setPage("favorites")} />
        <TabBtn icon="👤" label="Profil" active={page === "profile"} onClick={() => setPage("profile")} />
      </div>

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      {showCart && <CartOverlay cart={cart} onClose={() => setShowCart(false)} onRemove={(i) => setCart(c => c.filter((_, idx) => idx !== i))} />}
      {showOnboarding && <OnboardingOverlay step={onboardingStep} setStep={setOnboardingStep} onClose={() => setShowOnboarding(false)} />}

      <style>{`
        @keyframes pulse { 0%,100% { box-shadow: 0 0 16px ${GOLD}88; transform: scale(1); } 50% { box-shadow: 0 0 28px ${GOLD}cc; transform: scale(1.06); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      color: active ? CORAL : "#aaa", fontSize: 10, fontWeight: active ? 700 : 400, minWidth: 48
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      {label}
    </button>
  );
}

function SearchOverlay({ onClose }) {
  const [radius, setRadius] = useState(50);
  const [activeFilters, setActiveFilters] = useState([]);
  const filters = ["Kategorien", "Wirker", "Werke", "Preisspanne", "Top-Empfohlen"];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300,
      display: "flex", flexDirection: "column", justifyContent: "flex-start"
    }}>
      <div style={{ background: "white", borderRadius: "0 0 24px 24px", padding: "20px 20px 28px", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "#f5f5f5", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <Search size={18} color={TEAL} />
            <input autoFocus placeholder="Suche nach Talent, Werk, Name…" style={{ border: "none", background: "none", flex: 1, fontSize: 15, outline: "none" }} />
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={22} color="#555" />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>Radius: {radius === 200 ? "Weltweit" : `${radius} km`}</span>
            <button onClick={() => setRadius(200)} style={{ background: TEAL, border: "none", borderRadius: 8, padding: "4px 10px", color: "white", fontSize: 12, cursor: "pointer" }}>
              🌍 Weltweit
            </button>
          </div>
          <input type="range" min={20} max={200} value={radius} onChange={e => setRadius(+e.target.value)}
            style={{ width: "100%", accentColor: TEAL }} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])} style={{
              background: activeFilters.includes(f) ? TEAL : "#f0f0f0",
              color: activeFilters.includes(f) ? "white" : "#555",
              border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600
            }}>{f}</button>
          ))}
        </div>
      </div>
      <div onClick={onClose} style={{ flex: 1 }} />
    </div>
  );
}

function CartOverlay({ cart, onClose, onRemove }) {
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const impactAmount = (total * 0.03).toFixed(2);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: 20, width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingBasket size={22} color={CORAL} />
            <span style={{ fontWeight: 800, fontSize: 20 }}>Mein Werkekorb</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={22} color="#555" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🧺</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: "#333" }}>Dein Werkekorb ist noch leer</div>
            <div style={{ color: "#888", marginBottom: 20 }}>Entdecke wundervolle Werke und Talente</div>
            <button onClick={onClose} style={{ background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Jetzt entdecken
            </button>
          </div>
        ) : (
          <>
            {cart.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, background: "#fafaf8", borderRadius: 14, padding: 12 }}>
                <img src={item.img} style={{ width: 70, height: 70, borderRadius: 10, objectFit: "cover" }} alt={item.title} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{item.creator}</div>
                  <div style={{ fontWeight: 700, color: CORAL }}>{item.price}</div>
                </div>
                <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc" }}>
                  <X size={18} />
                </button>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #eee", paddingTop: 14, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 4 }}>
                <span>Zwischensumme</span><span>{total.toFixed(2)} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 10 }}>
                <span>🌱 davon 3% in den Impact Pool</span><span>{impactAmount} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
                <span>Gesamt</span><span>{total.toFixed(2)} €</span>
              </div>
              <button style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
                Jetzt bezahlen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OnboardingOverlay({ step, setStep, onClose }) {
  const screens = [
    {
      img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop",
      title: "Willkommen bei HUI",
      sub: "Ein Ort, an dem echte Talente, echte Menschen und echte Veränderung zusammenkommen."
    },
    {
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
      title: "Hier leben echte Geschichten.",
      sub: "Menschen mit besonderen Talenten schaffen Werke mit Herz – und du kannst Teil davon sein."
    },
    {
      img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop",
      title: "Jede Entscheidung wirkt weiter.",
      sub: "Mit jeder Buchung fließen automatisch 3 % in Projekte, die Menschen, Tieren und der Natur wirklich helfen."
    },
    {
      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      title: "Bereit, Teil von etwas Größerem zu werden?",
      sub: ""
    },
  ];

  const s = screens[step];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000", display: "flex", flexDirection: "column" }}>
      <img src={s.img} style={{ width: "100%", height: "55%", objectFit: "cover", opacity: 0.85 }} alt="" />
      <div style={{ flex: 1, background: "white", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "28px 24px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {screens.map((_, i) => (
            <div key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, background: i === step ? CORAL : "#ddd", transition: "all 0.3s" }} />
          ))}
        </div>
        <div style={{ fontWeight: 800, fontSize: 24, color: "#222", marginBottom: 12, textAlign: "center" }}>{s.title}</div>
        {s.sub && <div style={{ color: "#888", fontSize: 15, textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>{s.sub}</div>}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 16, padding: "15px", fontWeight: 700, fontSize: 17, cursor: "pointer" }}>
            Weiter →
          </button>
        ) : (
          <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, padding: "15px", fontWeight: 700, fontSize: 17, cursor: "pointer" }}>
            Jetzt loslegen ✨
          </button>
        )}
        {step < 3 && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#bbb", fontSize: 14, cursor: "pointer", marginTop: 12, textAlign: "center" }}>
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
}

function ImpactPage() {
  const projects = [
    { title: "Bäume für Kenia", desc: "Wir pflanzen 10.000 Bäume in trockenen Regionen Kenias.", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop", progress: 47, collected: "2.340 €", goal: "5.000 €" },
    { title: "Schule für alle", desc: "Bildung für 200 Kinder in ländlichen Gebieten.", img: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=300&fit=crop", progress: 73, collected: "7.300 €", goal: "10.000 €" },
    { title: "Tierheim Hamburg", desc: "Renovierung und Erweiterung für 150 Tiere.", img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=300&fit=crop", progress: 28, collected: "1.400 €", goal: "5.000 €" },
  ];

  const monthlyAmount = 3847;
  const yearlyAmount = 47832;

  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>
      <div style={{ background: `linear-gradient(180deg, ${TEAL}22, transparent)`, padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#222" }}>💚 Impact</div>
          <button style={{ background: "none", border: `1.5px solid ${TEAL}`, borderRadius: 20, padding: "5px 12px", color: TEAL, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={14} /> Projekt vorschlagen
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative", width: 160, height: 160 }}>
            <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="80" cy="80" r="68" fill="none" stroke="#eee" strokeWidth="12" />
              <circle cx="80" cy="80" r="68" fill="none" stroke={TEAL} strokeWidth="12" strokeDasharray="427" strokeDashoffset={427 * (1 - 0.47)} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 26, color: TEAL }}>{(monthlyAmount).toLocaleString("de")} €</div>
              <div style={{ fontSize: 11, color: "#888" }}>diesen Monat</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "white", borderRadius: 14, padding: "14px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: GOLD }}>{yearlyAmount.toLocaleString("de")} €</div>
            <div style={{ fontSize: 12, color: "#888" }}>Dieses Jahr gesammelt</div>
          </div>
          <div style={{ flex: 1, background: "white", borderRadius: 14, padding: "14px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: TEAL }}>{monthlyAmount.toLocaleString("de")} €</div>
            <div style={{ fontSize: 12, color: "#888" }}>Dieser Monat</div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, color: "#333", marginBottom: 20 }}>
          Gemeinsam haben wir schon so viel bewegt. 🌍
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#333" }}>Unsere aktuellen Impact-Projekte</div>
        {projects.map((p, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 16 }}>
            <img src={p.img} style={{ width: "100%", height: 160, objectFit: "cover" }} alt={p.title} />
            <div style={{ padding: "14px" }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#777", marginBottom: 10 }}>{p.desc}</div>
              <div style={{ background: "#f0f0f0", borderRadius: 99, height: 8, marginBottom: 6 }}>
                <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 8, borderRadius: 99, width: `${p.progress}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 12 }}>
                <span>{p.collected}</span><span>Ziel: {p.goal}</span>
              </div>
              <button style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                🌱 Jetzt spenden
              </button>
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "12px 0 20px", lineHeight: 1.6 }}>
          Mit jeder Buchung und jedem Verkauf fließen automatisch 3 % in echte Impact-Projekte.
        </div>
      </div>
    </div>
  );
}

function FavoritesPage() {
  const [tab, setTab] = useState("wirker");

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "20px 16px 0", background: "white", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 16, color: "#222" }}>⭐ Meine Favoriten</div>
        <div style={{ display: "flex", gap: 0 }}>
          {["wirker", "werke"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: tab === t ? `3px solid ${CORAL}` : "3px solid transparent",
              padding: "10px 0", fontWeight: tab === t ? 700 : 400,
              color: tab === t ? CORAL : "#aaa", fontSize: 15, cursor: "pointer",
              textTransform: "capitalize"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>⭐</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#333", marginBottom: 6 }}>Hier landen deine Lieblings-{tab === "wirker" ? "Wirker" : "Werke"}</div>
        <div style={{ color: "#888", marginBottom: 20, fontSize: 14 }}>Tippe auf den ⭐ bei einem {tab === "wirker" ? "Wirker" : "Werk"} um ihn zu speichern</div>
        <button style={{ background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Jetzt entdecken
        </button>
      </div>
    </div>
  );
}

function ProfilePage({ isNewUser }) {
  const [tab, setTab] = useState("werke");

  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>
      <div style={{ position: "relative" }}>
        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=200&fit=crop" style={{ width: "100%", height: 160, objectFit: "cover" }} alt="header" />
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: -36 }}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid white", objectFit: "cover" }} alt="profile" />
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Lars M.</div>
              <div style={{ fontSize: 13, color: "#888" }}>München, Deutschland</div>
            </div>
          </div>

          <div style={{ marginTop: 12, background: `linear-gradient(135deg, ${GOLD}22, ${CORAL}11)`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 32 }}>⭐</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 24, color: GOLD }}>250 HUI-Punkte</div>
              <div style={{ fontSize: 12, color: "#888" }}>= 12,50 € Rabatt verfügbar</div>
            </div>
          </div>

          {isNewUser ? (
            <button style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, padding: "15px", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 20 }}>
              ✨ Mein Talent anbieten
            </button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["Werke", "Buchungen", "Chats", "Verfügbarkeit"].map(t => (
                  <button key={t} onClick={() => setTab(t.toLowerCase())} style={{
                    background: tab === t.toLowerCase() ? TEAL : "#f0f0f0",
                    color: tab === t.toLowerCase() ? "white" : "#555",
                    border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600
                  }}>{t}</button>
                ))}
              </div>
              <div style={{ textAlign: "center", padding: "30px 0", color: "#888" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                <div>Noch keine Einträge</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: "0 16px", marginTop: 8 }}>
        <div style={{ fontWeight: 700, color: "#333", marginBottom: 8, fontSize: 15 }}>Einstellungen</div>
        {["Persönliche Daten", "Push-Benachrichtigungen", "Nacht-Modus", "Impressum", "Datenschutz", "AGB", "Abmelden"].map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "13px 0", borderBottom: "1px solid #f0f0f0",
            color: item === "Abmelden" ? CORAL : "#333",
            fontWeight: item === "Abmelden" ? 700 : 400, cursor: "pointer", fontSize: 15
          }}>
            {item} {item !== "Abmelden" && <ChevronRight size={16} color="#ccc" />}
          </div>
        ))}
      </div>
    </div>
  );
}

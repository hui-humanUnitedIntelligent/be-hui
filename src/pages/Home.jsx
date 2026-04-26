import { useState } from "react";
import { Heart, Share2, Star, Search, Plus, ShoppingBasket, Bell, ChevronRight, MapPin, Play, X, Home, Leaf, User, SlidersHorizontal, ChevronDown, ChevronUp, Check } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

const mockStories = [
  { id: 1, name: "Sofia", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", hasNew: true },
  { id: 2, name: "Marcus", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", hasNew: true },
  { id: 3, name: "Lena", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", hasNew: false },
  { id: 4, name: "Tom", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", hasNew: true },
  { id: 5, name: "Maria", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", hasNew: false },
];

const mockFeed = [
  { id: 1, type: "media", mediaType: "photo", creator: "Sofia M.", creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", talent: "Keramik-Künstlerin", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=700&fit=crop", caption: "Meine neueste Kreation – jede Tasse ist ein Unikat. 🌿 Handgedreht, handglasiert, mit ganzem Herzen gemacht.", likes: 142, location: "München" },
  { id: 2, type: "werk", title: "Handgemachte Keramik-Tasse", creator: "Sofia M.", creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop", price: "38 €", likes: 124, location: "München" },
  { id: 3, type: "wirker", name: "Marcus B.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", talent: "Fotograf & Videograf", recommendations: 47, location: "Berlin" },
  { id: 4, type: "media", mediaType: "video", creator: "Marcus B.", creatorImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", talent: "Fotograf & Videograf", img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=700&fit=crop", caption: "Behind the scenes meines letzten Portrait-Shootings. Licht, Geduld und ein bisschen Magie. 📷", likes: 289, location: "Berlin" },
  { id: 5, type: "werk", title: "Aquarell-Portrait", creator: "Lena K.", creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=600&h=400&fit=crop", price: "120 €", likes: 89, location: "Hamburg" },
  { id: 6, type: "impact", title: "Bäume für Kenia", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop", collected: "2.340 €", goal: "5.000 €", progress: 47 },
  { id: 7, type: "media", mediaType: "photo", creator: "Maria L.", creatorImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", talent: "Yoga & Achtsamkeits-Coach", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=700&fit=crop", caption: "Morgenroutine mit Aussicht. Wer braucht noch einen Grund für früh aufstehen? 🌅 Yoga-Sessions ab 7 Uhr buchbar.", likes: 317, location: "Zürich" },
  { id: 8, type: "werk", title: "Handgenähter Leder-Rucksack", creator: "Tom H.", creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop", price: "195 €", likes: 203, location: "Wien" },
  { id: 9, type: "wirker", name: "Maria L.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop", talent: "Yoga & Achtsamkeits-Coach", recommendations: 93, location: "Zürich" },
];

// ─── SEARCH OVERLAY (erweitert) ────────────────────────────────────────────
function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(50);
  const [contentType, setContentType] = useState("alles"); // alles | wirker | werke
  const [categories, setCategories] = useState([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("relevanz");
  const [availability, setAvailability] = useState([]);
  const [offerType, setOfferType] = useState([]); // buchbar | kaufbar
  const [minRecommendations, setMinRecommendations] = useState(0);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [expandedSection, setExpandedSection] = useState("typ");

  const allCategories = [
    { label: "Kunst & Kreatives", icon: "🎨" },
    { label: "Musik", icon: "🎵" },
    { label: "Fotografie", icon: "📷" },
    { label: "Coaching", icon: "💡" },
    { label: "Handwerk", icon: "🔨" },
    { label: "Fitness & Sport", icon: "🏋️" },
    { label: "Wellness & Yoga", icon: "🧘" },
    { label: "Kulinarik", icon: "🍳" },
    { label: "Schreiben & Text", icon: "✍️" },
    { label: "Technik & IT", icon: "💻" },
    { label: "Mode & Styling", icon: "👗" },
    { label: "Natur & Garten", icon: "🌿" },
  ];

  const availabilityOptions = ["Heute", "Diese Woche", "Dieses Wochenende", "Nächste Woche"];
  const sortOptions = [
    { value: "relevanz", label: "Relevanz" },
    { value: "empfehlungen", label: "Meiste Empfehlungen" },
    { value: "neu", label: "Neueste zuerst" },
    { value: "preis_asc", label: "Preis: günstig → teuer" },
    { value: "preis_desc", label: "Preis: teuer → günstig" },
  ];

  const toggleArr = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const activeFilterCount = [
    contentType !== "alles",
    categories.length > 0,
    priceMin || priceMax,
    availability.length > 0,
    offerType.length > 0,
    minRecommendations > 0,
    onlineOnly,
    sortBy !== "relevanz",
  ].filter(Boolean).length;

  const Section = ({ id, title, icon, children }) => {
    const open = expandedSection === id;
    return (
      <div style={{ borderBottom: "1px solid #f0f0f0" }}>
        <button
          onClick={() => setExpandedSection(open ? null : id)}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "13px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: "#333", display: "flex", alignItems: "center", gap: 7 }}>
            <span>{icon}</span>{title}
          </span>
          {open ? <ChevronUp size={16} color="#aaa" /> : <ChevronDown size={16} color="#aaa" />}
        </button>
        {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
      </div>
    );
  };

  const Chip = ({ label, active, onClick, icon }) => (
    <button onClick={onClick} style={{
      background: active ? TEAL : "#f3f3f3",
      color: active ? "white" : "#555",
      border: "none", borderRadius: 20, padding: "7px 13px",
      fontSize: 12, fontWeight: 600, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 5,
      transition: "all 0.15s"
    }}>
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {label}
      {active && <Check size={11} color="white" />}
    </button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "16px 16px 0", maxWidth: 430, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 12, padding: "11px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <Search size={16} color={TEAL} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Suche nach Talent, Werk, Name…"
              style={{ border: "none", background: "none", flex: 1, fontSize: 14, outline: "none", color: "#222" }}
            />
            {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={14} color="#aaa" /></button>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: CORAL, fontWeight: 700, fontSize: 14 }}>Fertig</button>
        </div>

        {/* Filter count badge */}
        {activeFilterCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <SlidersHorizontal size={13} color={CORAL} />
            <span style={{ fontSize: 12, color: CORAL, fontWeight: 600 }}>{activeFilterCount} Filter aktiv</span>
            <button onClick={() => { setContentType("alles"); setCategories([]); setPriceMin(""); setPriceMax(""); setAvailability([]); setOfferType([]); setMinRecommendations(0); setOnlineOnly(false); setSortBy("relevanz"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 12, marginLeft: 4 }}>Alle zurücksetzen</button>
          </div>
        )}
      </div>

      {/* Scrollable filter body */}
      <div style={{ flex: 1, overflowY: "auto", background: "white", maxWidth: 430, width: "100%", margin: "0 auto", padding: "0 16px" }}>

        {/* ── Radius ── */}
        <div style={{ borderBottom: "1px solid #f0f0f0", padding: "13px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#333", display: "flex", alignItems: "center", gap: 7 }}>
              📍 Umkreis: <span style={{ color: TEAL }}>{radius === 200 ? "Weltweit" : `${radius} km`}</span>
            </span>
            <button onClick={() => setRadius(200)} style={{ background: radius === 200 ? TEAL : "#f0f0f0", border: "none", borderRadius: 8, padding: "4px 10px", color: radius === 200 ? "white" : "#555", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              🌍 Weltweit
            </button>
          </div>
          <input type="range" min={20} max={200} step={10} value={radius} onChange={e => setRadius(+e.target.value)} style={{ width: "100%", accentColor: TEAL, height: 4 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#bbb", marginTop: 4 }}>
            <span>20 km</span><span>50 km</span><span>100 km</span><span>200 km</span><span>Weltweit</span>
          </div>
        </div>

        {/* ── Inhaltstyp ── */}
        <Section id="typ" title="Was suchst du?" icon="🔍">
          <div style={{ display: "flex", gap: 8 }}>
            {[{ v: "alles", l: "Alles" }, { v: "wirker", l: "Wirker" }, { v: "werke", l: "Werke" }].map(o => (
              <button key={o.v} onClick={() => setContentType(o.v)} style={{
                flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                background: contentType === o.v ? CORAL : "#f3f3f3",
                color: contentType === o.v ? "white" : "#555"
              }}>{o.l}</button>
            ))}
          </div>
        </Section>

        {/* ── Angebotstyp ── */}
        <Section id="angebot" title="Art des Angebots" icon="📦">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip label="Buchbar (Dienstleistung)" active={offerType.includes("buchbar")} onClick={() => toggleArr(offerType, setOfferType, "buchbar")} icon="📅" />
            <Chip label="Kaufbar (Werk)" active={offerType.includes("kaufbar")} onClick={() => toggleArr(offerType, setOfferType, "kaufbar")} icon="🛒" />
            <Chip label="Online möglich" active={onlineOnly} onClick={() => setOnlineOnly(p => !p)} icon="💻" />
          </div>
        </Section>

        {/* ── Kategorien ── */}
        <Section id="kategorien" title="Kategorien" icon="🎯">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allCategories.map(c => (
              <Chip key={c.label} label={c.label} icon={c.icon} active={categories.includes(c.label)} onClick={() => toggleArr(categories, setCategories, c.label)} />
            ))}
          </div>
        </Section>

        {/* ── Preisspanne ── */}
        <Section id="preis" title="Preisspanne" icon="💶">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#aaa" }}>von</span>
              <input value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="0" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} />
              <span style={{ fontSize: 13, color: "#aaa" }}>€</span>
            </div>
            <span style={{ color: "#bbb", fontSize: 16 }}>–</span>
            <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#aaa" }}>bis</span>
              <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="∞" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} />
              <span style={{ fontSize: 13, color: "#aaa" }}>€</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {[["bis 25 €", "", "25"], ["25–100 €", "25", "100"], ["100–300 €", "100", "300"], ["300 € +", "300", ""]].map(([l, min, max]) => (
              <button key={l} onClick={() => { setPriceMin(min); setPriceMax(max); }} style={{
                background: priceMin === min && priceMax === max ? TEAL : "#f3f3f3",
                color: priceMin === min && priceMax === max ? "white" : "#555",
                border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}>{l}</button>
            ))}
          </div>
        </Section>

        {/* ── Verfügbarkeit ── */}
        <Section id="verfuegbarkeit" title="Verfügbarkeit" icon="📅">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {availabilityOptions.map(a => (
              <Chip key={a} label={a} active={availability.includes(a)} onClick={() => toggleArr(availability, setAvailability, a)} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#bbb", marginTop: 8, marginBottom: 0 }}>Zeigt nur Wirker, die zu diesen Zeiten freie Slots haben.</p>
        </Section>

        {/* ── Empfehlungen ── */}
        <Section id="empfehlungen" title="Mindest-Empfehlungen" icon="⭐">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[0, 5, 10, 25, 50].map(n => (
              <button key={n} onClick={() => setMinRecommendations(n)} style={{
                background: minRecommendations === n ? CORAL : "#f3f3f3",
                color: minRecommendations === n ? "white" : "#555",
                border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
              }}>{n === 0 ? "Alle" : `${n}+`}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#bbb", marginTop: 8, marginBottom: 0 }}>Nur Wirker mit mindestens dieser Anzahl an Empfehlungen.</p>
        </Section>

        {/* ── Sortierung ── */}
        <Section id="sortierung" title="Sortieren nach" icon="↕️">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sortOptions.map(o => (
              <button key={o.value} onClick={() => setSortBy(o.value)} style={{
                background: sortBy === o.value ? `${TEAL}15` : "none",
                border: sortBy === o.value ? `1.5px solid ${TEAL}` : "1.5px solid #eee",
                borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                color: sortBy === o.value ? TEAL : "#444", fontWeight: sortBy === o.value ? 700 : 400, fontSize: 13
              }}>
                {o.label}
                {sortBy === o.value && <Check size={15} color={TEAL} />}
              </button>
            ))}
          </div>
        </Section>

        <div style={{ height: 16 }} />
      </div>

      {/* Apply button */}
      <div style={{ background: "white", padding: "12px 16px 24px", borderTop: "1px solid #f0f0f0", maxWidth: 430, width: "100%", margin: "0 auto" }}>
        <button onClick={onClose} style={{
          width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`,
          color: "white", border: "none", borderRadius: 14, padding: "14px",
          fontWeight: 700, fontSize: 16, cursor: "pointer"
        }}>
          {activeFilterCount > 0 ? `${activeFilterCount} Filter anwenden` : "Suchen"}
        </button>
      </div>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: -1 }} />
    </div>
  );
}

// ─── HEADER ────────────────────────────────────────────────────────────────
function AppHeader({ cartCount, onCartClick }) {
  return (
    <div style={{ background: "white", padding: "14px 16px 10px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: CORAL }}>H</span><span style={{ color: CORAL }}>U</span><span style={{ color: CORAL }}>I</span>
          <span style={{ color: TEAL, fontSize: 13, fontWeight: 600, marginLeft: 4 }}>Human United Intelligent</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onCartClick} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6 }}>
            <ShoppingBasket size={22} color="#444" />
            {cartCount > 0 && <span style={{ position: "absolute", top: 0, right: 0, background: CORAL, color: "white", borderRadius: "50%", width: 15, height: 15, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <Bell size={22} color="#444" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ onClick }) {
  return (
    <div style={{ background: "white", padding: "8px 16px 10px", position: "sticky", top: 54, zIndex: 99, borderBottom: "1px solid #f0f0f0" }}>
      <div onClick={onClick} style={{ background: "#f3f3f3", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <Search size={16} color="#aaa" />
        <span style={{ color: "#bbb", fontSize: 14, flex: 1 }}>Suche nach Talent, Werk, Name…</span>
        <div style={{ background: `${TEAL}18`, borderRadius: 8, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
          <SlidersHorizontal size={13} color={TEAL} />
          <span style={{ fontSize: 11, color: TEAL, fontWeight: 700 }}>Filter</span>
        </div>
      </div>
    </div>
  );
}

function StoryBar() {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "12px 16px 8px" }}>
      {mockStories.map(s => (
        <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 58, cursor: "pointer" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", border: s.hasNew ? `2.5px solid ${CORAL}` : "2.5px solid #e0e0e0", padding: 2 }}>
            <img src={s.img} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt={s.name} />
          </div>
          <span style={{ fontSize: 10, color: "#666" }}>{s.name}</span>
        </div>
      ))}
    </div>
  );
}

function MediaCard({ item, liked, onLike, faved, onFav }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ background: "white", marginBottom: 8, borderLeft: `3px solid ${TEAL}`, borderRight: `3px solid ${TEAL}22` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px", background: `linear-gradient(90deg, ${TEAL}08, transparent)` }}>
        <img src={item.creatorImg} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}` }} alt={item.creator} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{item.creator}</div>
          <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{item.talent}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#bbb", display: "flex", alignItems: "center", gap: 3 }}>
          <MapPin size={10} color="#bbb" />{item.location}
        </div>
      </div>
      <div style={{ position: "relative", cursor: item.mediaType === "video" ? "pointer" : "default" }} onClick={() => item.mediaType === "video" && setPlaying(p => !p)}>
        <img src={item.img} style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} alt="" />
        {item.mediaType === "video" && !playing && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={22} color={CORAL} fill={CORAL} style={{ marginLeft: 3 }} />
            </div>
          </div>
        )}
        {item.mediaType === "video" && playing && <div style={{ position: "absolute", bottom: 10, right: 10, background: CORAL, color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>▶ Läuft</div>}
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => onLike(item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: liked ? CORAL : "#888", padding: 0 }}>
            <Heart size={20} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#888"} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>{item.likes + (liked ? 1 : 0)}</span>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Share2 size={20} color="#888" /></button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Star size={20} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#888"} />
          </button>
          <button style={{ marginLeft: "auto", background: TEAL, color: "white", border: "none", borderRadius: 20, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Talent ansehen</button>
        </div>
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700 }}>{item.creator} </span>{item.caption}
        </div>
      </div>
    </div>
  );
}

function WerkCard({ item, liked, onLike, faved, onFav, onAddToCart }) {
  return (
    <div style={{ background: "linear-gradient(160deg, #fff8f7, #fff3f0)", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 14px rgba(255,107,91,0.10)", border: `1px solid ${CORAL}18`, margin: "8px 16px" }}>
      <div style={{ position: "relative" }}>
        <img src={item.img} style={{ width: "100%", height: 210, objectFit: "cover" }} alt={item.title} />
        <div style={{ position: "absolute", top: 10, right: 10, background: CORAL, color: "white", borderRadius: 20, padding: "4px 12px", fontWeight: 700, fontSize: 14 }}>{item.price}</div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <img src={item.creatorImg} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} alt={item.creator} />
          <span style={{ fontWeight: 600, fontSize: 13, color: "#555" }}>{item.creator}</span>
          <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{item.location}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#222", marginBottom: 10 }}>{item.title}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => onLike(item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: liked ? CORAL : "#999", padding: 0 }}>
            <Heart size={18} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#999"} />
            <span style={{ fontSize: 13 }}>{item.likes + (liked ? 1 : 0)}</span>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Share2 size={18} color="#999" /></button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Star size={18} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#999"} />
          </button>
          <button onClick={() => onAddToCart(item)} style={{ marginLeft: "auto", background: CORAL, color: "white", border: "none", borderRadius: 10, padding: "7px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>In den Korb</button>
        </div>
      </div>
    </div>
  );
}

function WirkerCard({ item }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${TEAL}12, #f0fdfb)`, border: `1.5px solid ${TEAL}40`, borderRadius: 16, margin: "8px 16px", padding: 16, display: "flex", gap: 14, alignItems: "center", boxShadow: `0 2px 14px ${TEAL}18` }}>
      <img src={item.img} style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${TEAL}` }} alt={item.name} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{item.name}</div>
        <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, marginBottom: 3 }}>{item.talent}</div>
        <div style={{ fontSize: 11, color: "#999", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{item.location} · {item.recommendations} Empfehlungen</div>
      </div>
      <button style={{ background: TEAL, color: "white", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", lineHeight: 1.4 }}>Talent<br />ansehen</button>
    </div>
  );
}

function ImpactCard({ item }) {
  return (
    <div style={{ background: `linear-gradient(160deg, #fffdf0, #fff8e1)`, borderRadius: 16, overflow: "hidden", boxShadow: `0 2px 14px ${GOLD}22`, border: `1px solid ${GOLD}30`, margin: "8px 16px" }}>
      <div style={{ position: "relative" }}>
        <img src={item.img} style={{ width: "100%", height: 150, objectFit: "cover" }} alt={item.title} />
        <div style={{ position: "absolute", top: 10, left: 10, background: GOLD, color: "white", borderRadius: 20, padding: "4px 12px", fontWeight: 700, fontSize: 12 }}>🌱 Impact-Projekt</div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{item.title}</div>
        <div style={{ background: "#f0f0f0", borderRadius: 99, height: 7, marginBottom: 6 }}>
          <div style={{ background: `linear-gradient(90deg, ${GOLD}, ${CORAL})`, height: 7, borderRadius: 99, width: `${item.progress}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
          <span>{item.collected} gesammelt</span><span>Ziel: {item.goal}</span>
        </div>
      </div>
    </div>
  );
}

function TabBar({ page, setPage, setShowOnboarding, setOnboardingStep, isNewUser }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 0 18px", zIndex: 200, boxShadow: "0 -2px 16px rgba(0,0,0,0.07)" }}>
      <TabButton label="Home" icon={<Home size={20} />} active={page === "home"} onClick={() => setPage("home")} />
      <TabButton label="Impact" icon={<Leaf size={20} />} active={page === "impact"} onClick={() => setPage("impact")} />
      {isNewUser ? (
        <button onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: -18 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, ${CORAL})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 18px ${GOLD}66`, animation: "huiPulse 2.4s ease-in-out infinite" }}>
            <span style={{ fontSize: 24 }}>☀️</span>
          </div>
          <span style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 0.3 }}>Entdecke HUI</span>
        </button>
      ) : (
        <button style={{ width: 54, height: 54, borderRadius: "50%", background: CORAL, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: -18, boxShadow: `0 4px 16px ${CORAL}66` }}>
          <Plus size={26} color="white" strokeWidth={2.5} />
        </button>
      )}
      <TabButton label="Favoriten" icon={<Star size={20} />} active={page === "favorites"} onClick={() => setPage("favorites")} />
      <TabButton label="Profil" icon={<User size={20} />} active={page === "profile"} onClick={() => setPage("profile")} />
    </div>
  );
}

function TabButton({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? CORAL : "#AABBB8", fontWeight: active ? 700 : 400, fontSize: 10, minWidth: 52, transition: "color 0.2s" }}>
      <span style={{ color: active ? CORAL : "#AABBB8" }}>{icon}</span>
      {label}
    </button>
  );
}

function CartOverlay({ cart, onClose, onRemove }) {
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: 20, width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><ShoppingBasket size={20} color={CORAL} /><span style={{ fontWeight: 800, fontSize: 19 }}>Mein Werkekorb</span></div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#555" /></button>
        </div>
        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🧺</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: "#333" }}>Dein Werkekorb ist noch leer</div>
            <div style={{ color: "#999", marginBottom: 20, fontSize: 13 }}>Entdecke wundervolle Werke und Talente</div>
            <button onClick={onClose} style={{ background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Jetzt entdecken</button>
          </div>
        ) : (
          <>
            {cart.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, background: "#fafaf8", borderRadius: 12, padding: 10 }}>
                <img src={item.img} style={{ width: 66, height: 66, borderRadius: 10, objectFit: "cover" }} alt={item.title} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#999", marginBottom: 3 }}>{item.creator}</div>
                  <div style={{ fontWeight: 700, color: CORAL }}>{item.price}</div>
                </div>
                <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc" }}><X size={16} /></button>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #eee", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#999", marginBottom: 4 }}><span>Zwischensumme</span><span>{total.toFixed(2)} €</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 12 }}><span>🌱 3 % gehen in den Impact Pool</span><span>{(total * 0.03).toFixed(2)} €</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, marginBottom: 16 }}><span>Gesamt</span><span>{total.toFixed(2)} €</span></div>
              <button style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Jetzt bezahlen</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OnboardingOverlay({ step, setStep, onClose }) {
  const screens = [
    { img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop", title: "Willkommen bei HUI", sub: "Ein Ort, an dem echte Talente, echte Menschen und echte Veränderung zusammenkommen." },
    { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop", title: "Hier leben echte Geschichten.", sub: "Menschen mit besonderen Talenten schaffen Werke mit Herz – und du kannst Teil davon sein." },
    { img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop", title: "Jede Entscheidung wirkt weiter.", sub: "Mit jeder Buchung fließen automatisch 3 % in Projekte, die Menschen, Tieren und der Natur wirklich helfen." },
    { img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", title: "Bereit, Teil von etwas Größerem zu werden?", sub: "" },
  ];
  const s = screens[step];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000", display: "flex", flexDirection: "column" }}>
      <img src={s.img} style={{ width: "100%", height: "55%", objectFit: "cover", opacity: 0.85 }} alt="" />
      <div style={{ flex: 1, background: "white", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "26px 24px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 }}>
          {screens.map((_, i) => <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i === step ? CORAL : "#e0e0e0", transition: "all 0.3s" }} />)}
        </div>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#222", textAlign: "center", marginBottom: 10 }}>{s.title}</div>
        {s.sub && <div style={{ color: "#888", fontSize: 14, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>{s.sub}</div>}
        <div style={{ flex: 1 }} />
        {step < 3
          ? <button onClick={() => setStep(step + 1)} style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Weiter →</button>
          : <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Jetzt loslegen ✨</button>
        }
        {step < 3 && <button onClick={onClose} style={{ background: "none", border: "none", color: "#ccc", fontSize: 13, cursor: "pointer", marginTop: 10, textAlign: "center" }}>Überspringen</button>}
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
  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>
      <div style={{ background: `linear-gradient(180deg, ${TEAL}18, transparent)`, padding: "24px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#222" }}>Impact</div>
          <button style={{ background: "none", border: `1.5px solid ${TEAL}`, borderRadius: 20, padding: "5px 12px", color: TEAL, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={13} /> Projekt vorschlagen
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative", width: 150, height: 150 }}>
            <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="75" cy="75" r="62" fill="none" stroke="#eee" strokeWidth="11" />
              <circle cx="75" cy="75" r="62" fill="none" stroke={TEAL} strokeWidth="11" strokeDasharray="389" strokeDashoffset={389 * 0.53} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: TEAL }}>3.847 €</div>
              <div style={{ fontSize: 10, color: "#aaa" }}>diesen Monat</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "white", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: GOLD }}>47.832 €</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Dieses Jahr</div>
          </div>
          <div style={{ flex: 1, background: "white", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: TEAL }}>3.847 €</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Dieser Monat</div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 17, color: "#333", marginBottom: 16 }}>Gemeinsam haben wir schon so viel bewegt. 🌍</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        {projects.map((p, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 16 }}>
            <img src={p.img} style={{ width: "100%", height: 150, objectFit: "cover" }} alt={p.title} />
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{p.desc}</div>
              <div style={{ background: "#f0f0f0", borderRadius: 99, height: 7, marginBottom: 6 }}>
                <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 7, borderRadius: 99, width: `${p.progress}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginBottom: 12 }}><span>{p.collected}</span><span>Ziel: {p.goal}</span></div>
              <button style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>🌱 Jetzt spenden</button>
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, padding: "10px 0 20px", lineHeight: 1.7 }}>Mit jeder Buchung und jedem Verkauf fließen automatisch 3 % in echte Impact-Projekte.</div>
      </div>
    </div>
  );
}

function FavoritesPage() {
  const [tab, setTab] = useState("wirker");
  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "20px 16px 0", background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontWeight: 800, fontSize: 21, marginBottom: 14, color: "#222" }}>Meine Favoriten</div>
        <div style={{ display: "flex" }}>
          {["wirker", "werke"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "10px 0", fontWeight: tab === t ? 700 : 400, color: tab === t ? CORAL : "#bbb", fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>⭐</div>
        <div style={{ fontWeight: 700, fontSize: 17, color: "#333", marginBottom: 6 }}>Hier landen deine Lieblings-{tab === "wirker" ? "Wirker" : "Werke"}</div>
        <div style={{ color: "#aaa", marginBottom: 20, fontSize: 13 }}>Tippe auf den ⭐ um etwas zu speichern</div>
        <button style={{ background: CORAL, color: "white", border: "none", borderRadius: 12, padding: "11px 26px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Jetzt entdecken</button>
      </div>
    </div>
  );
}

function ProfilePage({ isNewUser }) {
  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>
      <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=200&fit=crop" style={{ width: "100%", height: 150, objectFit: "cover" }} alt="header" />
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: -32 }}>
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" style={{ width: 68, height: 68, borderRadius: "50%", border: "3px solid white", objectFit: "cover" }} alt="profile" />
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>Lars M.</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>München, Deutschland</div>
          </div>
        </div>
        <div style={{ marginTop: 14, background: `linear-gradient(135deg, ${GOLD}18, ${CORAL}0d)`, borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>⭐</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: GOLD }}>250 HUI-Punkte</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>= 12,50 € Rabatt verfügbar</div>
          </div>
        </div>
        {isNewUser && (
          <button style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 18 }}>
            ✨ Mein Talent anbieten
          </button>
        )}
        <div style={{ fontWeight: 700, color: "#444", marginBottom: 6, fontSize: 14 }}>Einstellungen</div>
        {["Persönliche Daten", "Push-Benachrichtigungen", "Nacht-Modus", "Impressum", "Datenschutz", "AGB", "Abmelden"].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f0f0f0", color: item === "Abmelden" ? CORAL : "#333", fontWeight: item === "Abmelden" ? 700 : 400, cursor: "pointer", fontSize: 14 }}>
            {item} {item !== "Abmelden" && <ChevronRight size={15} color="#ddd" />}
          </div>
        ))}
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const isNewUser = true;

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5", fontFamily: "'Inter', -apple-system, sans-serif", position: "relative" }}>
      {page === "home" && (
        <>
          <AppHeader cartCount={cart.length} onCartClick={() => setShowCart(true)} />
          <SearchBar onClick={() => setShowSearch(true)} />
          <div>
            <StoryBar />
            <div style={{ paddingBottom: 96 }}>
              {mockFeed.map(item => {
                if (item.type === "media") return <MediaCard key={item.id} item={item} liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))} faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))} />;
                if (item.type === "werk") return <WerkCard key={item.id} item={item} liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))} faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))} onAddToCart={i => setCart(c => [...c, i])} />;
                if (item.type === "wirker") return <WirkerCard key={item.id} item={item} />;
                if (item.type === "impact") return <ImpactCard key={item.id} item={item} />;
                return null;
              })}
            </div>
          </div>
        </>
      )}
      {page === "impact" && <ImpactPage />}
      {page === "favorites" && <FavoritesPage />}
      {page === "profile" && <ProfilePage isNewUser={isNewUser} />}

      <TabBar page={page} setPage={setPage} isNewUser={isNewUser} setShowOnboarding={setShowOnboarding} setOnboardingStep={setOnboardingStep} />

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      {showCart && <CartOverlay cart={cart} onClose={() => setShowCart(false)} onRemove={i => setCart(c => c.filter((_, idx) => idx !== i))} />}
      {showOnboarding && <OnboardingOverlay step={onboardingStep} setStep={setOnboardingStep} onClose={() => setShowOnboarding(false)} />}

      <style>{`
        @keyframes huiPulse { 0%,100% { box-shadow: 0 4px 16px ${GOLD}55; transform: scale(1); } 50% { box-shadow: 0 6px 26px ${GOLD}99; transform: scale(1.07); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

import React, { useState } from "react";
import { Heart, Share2, Star, Search, Plus, ShoppingBasket, Bell, ChevronRight, MapPin, Play, X, Home, Leaf, User, SlidersHorizontal, ChevronDown, ChevronUp, Check, ArrowLeft, Calendar, Clock, Package, Award, Trash2, Edit3, Send, MessageCircle, Archive } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

// ─── HELPERS ───────────────────────────────────────────────────────────────
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAY_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekday(year, month) {
  // 0=So → remap to Mo=0
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

// ─── MOCK AVAILABILITY DATA (per wirker) ──────────────────────────────────
// slotsByDay: { "Mo": ["09:00","10:00","11:00","14:00","15:00"], ... }
const defaultAvailability = {
  "Sofia M.":  { "Mo": ["09:00","10:00","11:00","14:00","15:00"], "Di": ["10:00","11:00","14:00","16:00"], "Mi": ["09:00","10:00","11:00"], "Fr": ["13:00","14:00","15:00","16:00","17:00"] },
  "Marcus B.": { "Mi": ["10:00","11:00","12:00"], "Do": ["09:00","10:00","14:00","15:00"], "Fr": ["09:00","10:00","11:00","14:00"], "Sa": ["10:00","11:00","12:00","13:00"], "So": ["11:00","12:00"] },
  "Maria L.":  { "Mo": ["07:00","08:00","09:00","18:00","19:00"], "Di": ["07:00","08:00","18:00","19:00","20:00"], "Do": ["07:00","08:00","09:00","17:00","18:00"], "Sa": ["09:00","10:00","11:00","12:00"] },
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const mockWirkerProfiles = {
  "Sofia M.": {
    name: "Sofia M.", fullName: "Sofia Mayer",
    img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop",
    header: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=300&fit=crop",
    talent: "Keramik-Künstlerin", location: "München", distance: "12 km",
    memberSince: "März 2024", recommendations: 34, followers: 218, bookings: 41,
    impactEur: "124", hourlyRate: "45 €/Std.", pricePerHour: 45,
    bio: "Ich forme aus Ton Dinge, die bleiben. Jedes Stück entsteht mit Bedacht, mit Liebe und mit den Händen. Meine Werkstatt in München-Schwabing ist mein zweites Zuhause.",
    skills: ["Töpfern", "Glasuren", "Raku-Brennen", "Workshops", "Auftragsarbeiten"],
    werke: [
      { title: "Keramik-Tasse", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=300&fit=crop", price: "38 €", shipping: "4,50 €", shippingNote: "Versand innerhalb Deutschlands" },
      { title: "Vase Handgedreht", img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&h=300&fit=crop", price: "65 €", shipping: "5,90 €", shippingNote: "Versand innerhalb Deutschlands" },
      { title: "Schüssel-Set", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop", price: "89 €", shipping: "7,90 €", shippingNote: "Versand innerhalb Deutschlands" },
      { title: "Töpfer-Workshop", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=300&fit=crop", price: "75 €", shipping: "0 €", shippingNote: "Vor Ort in München" },
    ],
  },
  "Marcus B.": {
    name: "Marcus B.", fullName: "Marcus Braun",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    header: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=300&fit=crop",
    talent: "Fotograf & Videograf", location: "Berlin", distance: "38 km",
    memberSince: "Januar 2024", recommendations: 47, followers: 512, bookings: 89,
    impactEur: "312", hourlyRate: "90 €/Std.", pricePerHour: 90,
    bio: "Ich halte Momente fest, die sonst verschwinden. Portraits, Events, Imagefilme – ich bringe deine Geschichte ans Licht. Mit Kamera und Herz seit 12 Jahren.",
    skills: ["Portrait", "Eventfotografie", "Imagefilm", "Drohne", "Retusche", "Social Media Content"],
    werke: [
      { title: "Portrait-Shooting", img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&h=300&fit=crop", price: "180 €", shipping: "0 €", shippingNote: "Digitale Lieferung per Download" },
      { title: "Event-Paket", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop", price: "450 €", shipping: "0 €", shippingNote: "Digitale Lieferung per Download" },
      { title: "Imagefilm (1 Min)", img: "https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=300&h=300&fit=crop", price: "890 €", shipping: "0 €", shippingNote: "Digitale Lieferung per Download" },
    ],
  },
  "Maria L.": {
    name: "Maria L.", fullName: "Maria Langner",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    header: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=300&fit=crop",
    talent: "Yoga & Achtsamkeits-Coach", location: "Zürich", distance: "Weltweit",
    memberSince: "Februar 2024", recommendations: 93, followers: 847, bookings: 156,
    impactEur: "567", hourlyRate: "70 €/Std.", pricePerHour: 70,
    bio: "Yoga ist für mich kein Sport – es ist eine Haltung zum Leben. Ich begleite Menschen auf ihrem Weg zu mehr Ruhe, Kraft und Klarheit. Online und in Zürich.",
    skills: ["Hatha Yoga", "Vinyasa", "Meditation", "Atemarbeit", "Online-Coaching", "Retreats"],
    werke: [
      { title: "Einzel-Yoga-Session", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop", price: "70 €", shipping: "0 €", shippingNote: "Online per Video-Call" },
      { title: "4er-Paket Yoga", img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&h=300&fit=crop", price: "250 €", shipping: "0 €", shippingNote: "Online per Video-Call" },
      { title: "Achtsamkeits-Workshop", img: "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=300&h=300&fit=crop", price: "120 €", shipping: "0 €", shippingNote: "Online per Video-Call" },
    ],
  },
};

const mockWerkDetails = {
  "Handgemachte Keramik-Tasse": { title: "Handgemachte Keramik-Tasse", price: "38 €", creator: "Sofia M.", creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=500&fit=crop", extraImgs: ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&h=200&fit=crop","https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&h=200&fit=crop"], location: "München", likes: 124, category: "Kunst & Kreatives", description: "Eine von Hand gedrehte Keramik-Tasse aus feinstem Steinzeugton. Jede Tasse ist ein Unikat – leicht unterschiedlich in Form, Textur und Glasur.\n\nGröße: ca. 250ml · Höhe: ~9cm", shipping: "4,50 €", deliveryDays: "5–7", tags: ["Handgemacht", "Keramik", "Unikat", "Geschenk"], impactHint: "3% der Provision (0,17 €) fließen in den Impact Pool" },
  "Aquarell-Portrait": { title: "Aquarell-Portrait", price: "120 €", creator: "Lena K.", creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=600&h=500&fit=crop", extraImgs: [], location: "Hamburg", likes: 89, category: "Kunst & Kreatives", description: "Ein handgemaltes Aquarell-Portrait nach deinem Foto. Format: A4 · Lieferzeit: 10–14 Werktage", shipping: "6,00 €", deliveryDays: "10–14", tags: ["Aquarell", "Portrait", "Auftragsarbeit"], impactHint: "3% der Provision (0,54 €) fließen in den Impact Pool" },
  "Handgenähter Leder-Rucksack": { title: "Handgenähter Leder-Rucksack", price: "195 €", creator: "Tom H.", creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=500&fit=crop", extraImgs: [], location: "Wien", likes: 203, category: "Handwerk", description: "Handgefertigter Rucksack aus vegetabil gegerbtem Vollnarbenleder. Maße: 35x28x12cm", shipping: "8,00 €", deliveryDays: "21–28", tags: ["Leder", "Handarbeit", "Nachhaltig"], impactHint: "3% der Provision (0,88 €) fließen in den Impact Pool" },
};

const mockStories = [
  { id: 1, name: "Sofia", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", hasNew: true },
  { id: 2, name: "Marcus", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", hasNew: true },
  { id: 3, name: "Lena", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", hasNew: false },
  { id: 4, name: "Tom", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", hasNew: true },
  { id: 5, name: "Maria", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", hasNew: false },
];

// Eigene Stories des eingeloggten Talents (Lars)
const myOwnStories = [
  {
    id: "own1",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=1000&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=80&h=80&fit=crop",
    text: "Neues Projekt frisch aus dem Ofen 🔥 Handgedrehte Schalen – jetzt im Atelier.",
    time: "vor 3 Std.",
    views: 47,
    likes: 12,
    type: "foto",
    label: "Neues Werk",
  },
  {
    id: "own2",
    img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=1000&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80&h=80&fit=crop",
    text: "Workshop-Plätze für Mai noch frei 🗓️ Töpfern für Anfänger – nur noch 3 Plätze!",
    time: "vor 8 Std.",
    views: 82,
    likes: 21,
    type: "angebot",
    label: "Workshop",
  },
  {
    id: "own3",
    img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=1000&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=80&h=80&fit=crop",
    text: "Behind the scenes: Glasur-Experimentierzeit 🎨 Heute teste ich 4 neue Farbtöne.",
    time: "vor 14 Std.",
    views: 119,
    likes: 34,
    type: "behind",
    label: "Behind the Scenes",
  },
];

// Mock-Kommentare pro Feed-Item
const mockComments = {
  1: [
    { id: "c1", user: "Tom H.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", text: "Wunderschön! Die Glasur ist so besonders 😍", time: "vor 12 Min.", likes: 4 },
    { id: "c2", user: "Lena K.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", text: "Machst du auch Sonderanfertigungen? Würde mir sowas in Blau wünschen 💙", time: "vor 28 Min.", likes: 2 },
    { id: "c3", user: "Maria L.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", text: "Einfach toll. Echte Handarbeit spürt man!", time: "vor 1 Std.", likes: 7 },
  ],
  2: [
    { id: "c4", user: "Marcus B.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", text: "Hätte gerne eine in Dunkelgrün 🌿 Bestellbar?", time: "vor 5 Min.", likes: 1 },
    { id: "c5", user: "Tom H.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", text: "Preis ist absolut fair für Handarbeit dieser Qualität!", time: "vor 45 Min.", likes: 9 },
  ],
  4: [
    { id: "c6", user: "Sofia M.", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", text: "Das Licht in diesem Shot ist unglaublich 📷✨", time: "vor 8 Min.", likes: 14 },
    { id: "c7", user: "Lena K.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", text: "Schickst du mir mal deine Kamera-Settings? 🙏", time: "vor 22 Min.", likes: 3 },
    { id: "c8", user: "Tom H.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", text: "Traumhaft. So soll Fotografie aussehen.", time: "vor 2 Std.", likes: 21 },
    { id: "c9", user: "Maria L.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", text: "Ich brauche definitiv einen Termin für ein Portrait! 😍", time: "vor 3 Std.", likes: 6 },
  ],
  5: [
    { id: "c10", user: "Marcus B.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", text: "Was für ein besonderes Geschenk das wäre!", time: "vor 1 Std.", likes: 5 },
  ],
  7: [
    { id: "c11", user: "Sofia M.", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", text: "Diese Morgenroutine inspiriert mich jeden Tag neu 🌅", time: "vor 3 Min.", likes: 18 },
    { id: "c12", user: "Tom H.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", text: "Habe letzte Woche meine erste Session bei dir gebucht – absolute Empfehlung!", time: "vor 35 Min.", likes: 11 },
    { id: "c13", user: "Lena K.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", text: "7 Uhr morgens – du bist verrückt 😂 Aber ich liebe es!", time: "vor 1 Std.", likes: 8 },
  ],
  8: [
    { id: "c14", user: "Maria L.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", text: "Das Leder sieht traumhaft aus. Hält das wirklich ein Leben lang?", time: "vor 20 Min.", likes: 3 },
    { id: "c15", user: "Marcus B.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", text: "Definitiv mein nächster Kauf. Einfach nachhaltig und schön! 🌿", time: "vor 2 Std.", likes: 12 },
  ],
};

// Kommentar-Bereich Komponente
// creator = Name des Talent-Erstellers des Posts
// isTalent = true wenn aktuell eingeloggter User = Ersteller (kann mit Talent-Badge antworten)
function CommentSection({ itemId, creator, isTalent }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState(mockComments[itemId] || []);
  const [input, setInput] = useState("");
  const [likedComments, setLikedComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); // { id, user }
  const inputRef = React.useRef(null);

  // Talent-Profil für den Ersteller des Posts
  const talentImg = creator === "Sofia M."
    ? "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop"
    : creator === "Marcus B."
    ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
    : creator === "Maria L."
    ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop"
    : creator === "Tom H."
    ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
    : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop";

  // Mein Profil (eingeloggter User = Lars M. als Demo-Talent)
  const myName = isTalent ? creator : "Lars M.";
  const myImg = isTalent ? talentImg : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop";

  const total = comments.length;
  const toggleLike = (cid) => setLikedComments(p => ({ ...p, [cid]: !p[cid] }));

  const handleReply = (c) => {
    setReplyingTo(c);
    setInput(`@${c.user} `);
    setOpen(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(999,999); }, 80);
  };

  const submit = () => {
    const txt = input.trim();
    if (!txt) return;
    const newComment = {
      id: "new_" + Date.now(),
      user: myName,
      img: myImg,
      text: txt,
      time: "gerade eben",
      likes: 0,
      isTalent,
      replyTo: replyingTo?.user || null,
    };
    if (replyingTo) {
      // Als Antwort direkt nach dem kommentierten Eintrag einfügen
      setComments(p => {
        const idx = p.findIndex(c => c.id === replyingTo.id);
        const copy = [...p];
        copy.splice(idx + 1, 0, newComment);
        return copy;
      });
    } else {
      setComments(p => [...p, newComment]);
    }
    setInput("");
    setReplyingTo(null);
  };

  // Neue Kommentare für das Talent hervorheben (ungelesen)
  const unreadCount = isTalent ? comments.filter(c => !c.isTalent && c.time === "gerade eben").length : 0;

  return (
    <div style={{ borderTop: "1px solid #f0f0ee" }}>
      {/* Kommentar-Toggle-Button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}>
        <button onClick={() => { setOpen(o => !o); setTimeout(() => !open && inputRef.current?.focus(), 100); }}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "9px 0", color: open ? CORAL : "#888" }}>
          <MessageCircle size={19} fill={open ? `${CORAL}18` : "none"} color={open ? CORAL : "#888"} />
          <span style={{ fontSize: 13, fontWeight: 600, color: open ? CORAL : "#888" }}>
            {total > 0 ? `${total} Kommentar${total !== 1 ? "e" : ""}` : "Kommentieren"}
          </span>
        </button>
        {/* Talent: Benachrichtigungs-Hinweis */}
        {isTalent && total > 0 && (
          <button onClick={() => setOpen(true)}
            style={{ background: `${TEAL}12`, border: "none", borderRadius: 20, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: TEAL }}>✨ Als Talent antworten</span>
          </button>
        )}
      </div>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>

          {/* Kommentar-Liste */}
          {comments.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {comments.map((c) => {
                const isCreatorComment = c.isTalent || c.user === creator;
                return (
                  <div key={c.id} style={{ display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start",
                    ...(c.replyTo ? { paddingLeft: 28 } : {}) }}>
                    {/* Avatar mit optionalem Talent-Ring */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={c.img} style={{
                        width: 32, height: 32, borderRadius: "50%", objectFit: "cover", marginTop: 1,
                        border: isCreatorComment ? `2px solid ${TEAL}` : "2px solid transparent"
                      }} alt={c.user} />
                      {isCreatorComment && (
                        <div style={{ position: "absolute", bottom: -2, right: -2, background: TEAL, borderRadius: "50%", width: 13, height: 13, border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7 }}>✨</div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      {/* Kommentar-Bubble */}
                      <div style={{
                        background: isCreatorComment ? `${TEAL}0e` : "#f5f5f3",
                        border: isCreatorComment ? `1px solid ${TEAL}25` : "1px solid transparent",
                        borderRadius: "0 14px 14px 14px", padding: "8px 11px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: isCreatorComment ? TEAL : "#222" }}>{c.user}</span>
                          {isCreatorComment && (
                            <span style={{ background: TEAL, color: "white", fontSize: 9, fontWeight: 800, borderRadius: 20, padding: "1px 6px" }}>✨ Talent</span>
                          )}
                        </div>
                        {c.replyTo && (
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>↩ Antwort auf <span style={{ fontWeight: 700 }}>@{c.replyTo}</span></div>
                        )}
                        <span style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{c.text}</span>
                      </div>

                      {/* Aktionen */}
                      <div style={{ display: "flex", gap: 12, marginTop: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#bbb" }}>{c.time}</span>
                        <button onClick={() => toggleLike(c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3, color: likedComments[c.id] ? CORAL : "#bbb" }}>
                          <Heart size={12} fill={likedComments[c.id] ? CORAL : "none"} color={likedComments[c.id] ? CORAL : "#bbb"} />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{c.likes + (likedComments[c.id] ? 1 : 0)}</span>
                        </button>
                        <button onClick={() => handleReply(c)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11, color: isTalent ? TEAL : "#bbb", fontWeight: isTalent ? 700 : 600 }}>
                          {isTalent ? "↩ Antworten als Talent" : "Antworten"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Antwort-Kontext */}
          {replyingTo && (
            <div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}20`, borderRadius: 10, padding: "6px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: TEAL }}>↩ Antworte auf <strong>@{replyingTo.user}</strong></span>
              <button onClick={() => { setReplyingTo(null); setInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          )}

          {/* Eingabe */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={myImg} style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: isTalent ? `2px solid ${TEAL}` : "2px solid #eee" }} alt="me" />
              {isTalent && <div style={{ position: "absolute", bottom: -1, right: -1, background: TEAL, borderRadius: "50%", width: 11, height: 11, border: "1.5px solid white", fontSize: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>✨</div>}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", background: isTalent ? `${TEAL}0a` : "#f5f5f3", border: isTalent ? `1px solid ${TEAL}30` : "1px solid transparent", borderRadius: 22, padding: "0 4px 0 12px", transition: "all 0.2s" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder={isTalent ? "Als Talent antworten..." : "Kommentieren..."}
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, padding: "9px 4px 9px 0", fontFamily: "inherit", color: "#333" }}
              />
              <button onClick={submit} disabled={!input.trim()}
                style={{ background: input.trim() ? (isTalent ? TEAL : CORAL) : "transparent", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                <Send size={14} color={input.trim() ? "white" : "#ccc"} />
              </button>
            </div>
          </div>

          {isTalent && (
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: TEAL, fontWeight: 600 }}>
              ✨ Deine Antworten erscheinen mit Talent-Badge
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

// ══════════════════════════════════════════════════════════════════
// VERFÜGBARKEITS-EINSTELLUNG (Wirker-Sicht)
// ══════════════════════════════════════════════════════════════════
function AvailabilityEditor({ wirkerName, onClose }) {
  const [slots, setSlots] = useState(() => JSON.parse(JSON.stringify(defaultAvailability[wirkerName] || {})));
  const [newSlotDay, setNewSlotDay] = useState("Mo");
  const [newSlotTime, setNewSlotTime] = useState("09:00");
  const [saved, setSaved] = useState(false);

  const addSlot = () => {
    if (!newSlotTime.match(/^\d{2}:\d{2}$/)) return;
    setSlots(s => {
      const updated = { ...s };
      if (!updated[newSlotDay]) updated[newSlotDay] = [];
      if (!updated[newSlotDay].includes(newSlotTime)) updated[newSlotDay] = [...updated[newSlotDay], newSlotTime].sort();
      return updated;
    });
  };

  const removeSlot = (day, time) => {
    setSlots(s => {
      const updated = { ...s };
      updated[day] = updated[day].filter(t => t !== time);
      if (updated[day].length === 0) delete updated[day];
      return updated;
    });
  };

  const handleSave = () => {
    defaultAvailability[wirkerName] = slots;
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Meine Verfügbarkeit</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>Lege fest, wann du buchbar bist</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={22} color="#555" /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {/* Neuen Slot hinzufügen */}
          <div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}30`, borderRadius: 16, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: TEAL, marginBottom: 12 }}>+ Neuer Zeitslot</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={newSlotDay} onChange={e => setNewSlotDay(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${TEAL}40`, fontSize: 14, outline: "none", color: "#333", background: "white" }}>
                {WEEKDAYS.map(d => <option key={d} value={d}>{WEEKDAY_FULL[WEEKDAYS.indexOf(d)]}</option>)}
              </select>
              <input type="time" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${TEAL}40`, fontSize: 14, outline: "none", color: "#333" }} />
              <button onClick={addSlot} style={{ background: TEAL, color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+</button>
            </div>
          </div>

          {/* Slots nach Tag */}
          {WEEKDAYS.filter(d => slots[d]?.length > 0).map(day => (
            <div key={day} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: TEAL, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{day}</div>
                {WEEKDAY_FULL[WEEKDAYS.indexOf(day)]}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {slots[day].map(time => (
                  <div key={time} style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30`, borderRadius: 20, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={12} color={TEAL} />
                    <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{time}</span>
                    <button onClick={() => removeSlot(day, time)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                      <X size={13} color={CORAL} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(slots).length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb" }}>
              <Calendar size={40} color="#ddd" style={{ marginBottom: 10 }} />
              <div>Noch keine Zeitslots eingetragen</div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={handleSave} style={{ width: "100%", background: saved ? TEAL : `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer", transition: "background 0.3s" }}>
            {saved ? "✓ Gespeichert!" : "Verfügbarkeit speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// BUCHUNGS-FLOW (Kalender → Uhrzeit → Zusammenfassung → Danke)
// ══════════════════════════════════════════════════════════════════
function BookingFlow({ wirker, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=Kalender, 2=Uhrzeit, 3=Zusammenfassung, 4=Danke
  const [selectedDate, setSelectedDate] = useState(null); // { year, month, day, weekday }
  const [selectedTime, setSelectedTime] = useState(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const availability = defaultAvailability[wirker.name] || {};
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);

  // Welche Tage haben verfügbare Slots?
  const availableDays = new Set();
  for (let d = 1; d <= daysInMonth; d++) {
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7; // 0=Mo
    const wd = WEEKDAYS[wdIdx];
    if (availability[wd]?.length > 0) availableDays.add(d);
  }

  const isPast = (d) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDayClick = (d) => {
    if (!availableDays.has(d) || isPast(d)) return;
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7;
    setSelectedDate({ year: viewYear, month: viewMonth, day: d, weekday: WEEKDAYS[wdIdx] });
    setSelectedTime(null);
    setStep(2);
  };

  const availableSlots = selectedDate ? (availability[selectedDate.weekday] || []) : [];
  const pricePerHour = wirker.pricePerHour || 60;
  const provision = Math.round(pricePerHour * 0.15 * 100) / 100;
  const impact = Math.round(provision * 0.03 * 100) / 100; // 3% der Provision
  const total = pricePerHour + provision;

  const formatDate = (d) => d ? `${WEEKDAY_FULL[WEEKDAYS.indexOf(d.weekday)]}, ${d.day}. ${MONTHS[d.month]} ${d.year}` : "";

  // STEP 4 – Danke
  if (step === 4) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}22, ${GOLD}22)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: `0 0 32px ${TEAL}44` }}>
        <span style={{ fontSize: 44 }}>✓</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 24, color: "#222", textAlign: "center", marginBottom: 10 }}>Buchung erfolgreich! 🎉</div>
      <div style={{ fontSize: 15, color: "#666", textAlign: "center", lineHeight: 1.7, marginBottom: 20 }}>
        Dein Geld ist sicher verwahrt. Sobald du die Leistung erhalten hast, kannst du mit <strong>„Empfehlen"</strong> oder <strong>„Nicht empfehlen"</strong> bestätigen.
      </div>
      <div style={{ background: "#f9f9f7", borderRadius: 16, padding: "16px 20px", width: "100%", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <img src={wirker.img} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} alt={wirker.name} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{wirker.fullName}</div>
            <div style={{ fontSize: 13, color: TEAL }}>{wirker.talent}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>📅 {formatDate(selectedDate)}</div>
        <div style={{ fontSize: 13, color: "#666" }}>🕐 {selectedTime} Uhr</div>
        <div style={{ fontSize: 13, color: "#666" }}>💶 {total.toFixed(2)} € bezahlt (inkl. Provision)</div>
        <div style={{ fontSize: 12, color: TEAL, marginTop: 6 }}>🌱 {impact.toFixed(2)} € (3% der Provision) fließen in den Impact Pool</div>
      </div>
      <div style={{ background: `${TEAL}12`, borderRadius: 14, padding: "12px 16px", width: "100%", marginBottom: 24, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
        💬 Der Chat mit {wirker.name} wurde freigeschaltet. Eine automatische Nachricht wurde bereits gesendet.
      </div>
      <button onClick={onSuccess} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
        Zum Chat mit {wirker.name} →
      </button>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", marginTop: 12 }}>Zurück zum Profil</button>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={20} color="#444" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#222" }}>
            {step === 1 ? "Datum wählen" : step === 2 ? "Uhrzeit wählen" : "Buchung bestätigen"}
          </div>
          <div style={{ fontSize: 12, color: "#aaa" }}>{wirker.fullName} · {wirker.talent}</div>
        </div>
        {/* Step-Dots */}
        <div style={{ display: "flex", gap: 5 }}>
          {[1,2,3].map(s => <div key={s} style={{ width: s === step ? 18 : 7, height: 7, borderRadius: 4, background: s <= step ? CORAL : "#e0e0e0", transition: "all 0.3s" }} />)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

        {/* ── STEP 1: KALENDER ── */}
        {step === 1 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }} style={{ background: "#f3f3f3", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }} style={{ background: "#f3f3f3", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>›</button>
            </div>

            {/* Wochentag-Header */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
              {WEEKDAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#bbb", paddingBottom: 4 }}>{d}</div>)}
            </div>

            {/* Kalender-Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {Array(firstWeekday).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const d = i + 1;
                const past = isPast(d);
                const avail = availableDays.has(d);
                const isSelected = selectedDate?.day === d && selectedDate?.month === viewMonth && selectedDate?.year === viewYear;
                return (
                  <button key={d} onClick={() => handleDayClick(d)} style={{
                    aspectRatio: "1", borderRadius: "50%", border: "none", cursor: avail && !past ? "pointer" : "default",
                    background: isSelected ? CORAL : avail && !past ? `${TEAL}18` : "transparent",
                    color: isSelected ? "white" : past ? "#ddd" : avail ? TEAL : "#bbb",
                    fontWeight: avail && !past ? 700 : 400, fontSize: 14,
                    position: "relative", transition: "all 0.15s"
                  }}>
                    {d}
                    {avail && !past && !isSelected && <div style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: TEAL }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: `${TEAL}33` }} /> Verfügbar</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e0e0e0" }} /> Nicht verfügbar</div>
            </div>

            <div style={{ background: `${GOLD}12`, borderRadius: 12, padding: "12px 14px", marginTop: 20, fontSize: 13, color: "#777" }}>
              💶 Stundensatz: <strong style={{ color: "#333" }}>{wirker.hourlyRate}</strong> · 15% Provision (davon 3% in den Impact Pool)
            </div>
          </>
        )}

        {/* ── STEP 2: UHRZEIT ── */}
        {step === 2 && selectedDate && (
          <>
            <div style={{ background: `${TEAL}10`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <Calendar size={18} color={TEAL} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{formatDate(selectedDate)}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{availableSlots.length} freie Slots</div>
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 14 }}>Verfügbare Uhrzeiten:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {availableSlots.map(time => (
                <button key={time} onClick={() => { setSelectedTime(time); setStep(3); }} style={{
                  padding: "14px 8px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: selectedTime === time ? TEAL : `${TEAL}12`,
                  color: selectedTime === time ? "white" : TEAL,
                  fontWeight: 700, fontSize: 15, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.15s"
                }}>
                  <Clock size={14} color={selectedTime === time ? "white" : TEAL} />
                  {time}
                </button>
              ))}
            </div>
            {availableSlots.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px", color: "#bbb" }}>Keine Slots an diesem Tag</div>
            )}
          </>
        )}

        {/* ── STEP 3: ZUSAMMENFASSUNG ── */}
        {step === 3 && selectedDate && selectedTime && (
          <>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#222", marginBottom: 16 }}>Deine Buchung im Überblick</div>

            {/* Wirker-Info */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", background: `${TEAL}0d`, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1px solid ${TEAL}20` }}>
              <img src={wirker.img} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }} alt={wirker.name} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{wirker.fullName}</div>
                <div style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
              </div>
            </div>

            {/* Datum & Zeit */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #eee", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f5f5f5" }}>
                <Calendar size={18} color={CORAL} />
                <div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>DATUM</div>
                  <div style={{ fontWeight: 700, color: "#222", fontSize: 14 }}>{formatDate(selectedDate)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px" }}>
                <Clock size={18} color={CORAL} />
                <div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>UHRZEIT</div>
                  <div style={{ fontWeight: 700, color: "#222", fontSize: 14 }}>{selectedTime} Uhr (1 Stunde)</div>
                </div>
              </div>
            </div>

            {/* Preisaufschlüsselung */}
            <div style={{ background: "#f9f9f7", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "#333" }}>Preisaufschlüsselung</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 6 }}>
                <span>Stundensatz ({wirker.fullName})</span><span style={{ fontWeight: 600, color: "#444" }}>{pricePerHour.toFixed(2)} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 6 }}>
                <span>Plattformprovision (15%)</span><span style={{ fontWeight: 600, color: "#444" }}>{provision.toFixed(2)} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 10 }}>
                <span>🌱 davon 3% der Provision → Impact Pool</span><span>{impact.toFixed(2)} €</span>
              </div>
              <div style={{ borderTop: "1px solid #eee", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
                <span>Gesamt</span><span style={{ color: CORAL }}>{total.toFixed(2)} €</span>
              </div>
            </div>

            {/* Escrow Hinweis */}
            <div style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#666", lineHeight: 1.6 }}>
              🔒 <strong>Sicher & transparent:</strong> Dein Geld wird nach der Buchung sicher auf einem Treuhandkonto verwahrt und erst nach deiner Bestätigung ausgezahlt.
            </div>
          </>
        )}
      </div>

      {/* Bottom Button */}
      {step < 3 && step === 1 && (
        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ textAlign: "center", fontSize: 13, color: "#bbb", marginBottom: 4 }}>Wähle einen grün markierten Tag</div>
        </div>
      )}
      {step === 3 && (
        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={() => setStep(4)} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "15px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Jetzt verbindlich buchen · {total.toFixed(2)} €
          </button>
          <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 8 }}>Zahlung per Kreditkarte, PayPal oder Sofortüberweisung</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// WIRKER PROFIL PAGE
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// WERK EDITOR (Versandkosten & Details vom Wirker bearbeitbar)
// ══════════════════════════════════════════════════════════════════
function WerkEditor({ werk, wirkerName, onClose, onSave }) {
  const [title, setTitle] = useState(werk ? werk.title : "");
  const [price, setPrice] = useState(werk ? werk.price.replace(" €", "") : "");
  const [shippingValue, setShippingValue] = useState(werk ? werk.shipping.replace(" €", "").replace(",", ".") : "0");
  const [shippingNote, setShippingNote] = useState(werk ? (werk.shippingNote || "") : "");
  const [shippingType, setShippingType] = useState(() => {
    if (!werk) return "standard";
    const s = parseFloat(werk.shipping.replace(" €","").replace(",","."));
    if (s === 0) return "kostenlos";
    return "standard";
  });
  const [saved, setSaved] = useState(false);

  const shippingPresets = [
    { label: "Kostenlos / Digital", value: "0", note: "Digitale Lieferung oder vor Ort" },
    { label: "Brief (1,85 €)", value: "1.85", note: "DHL Brief national" },
    { label: "Päckchen S (3,99 €)", value: "3.99", note: "DHL Päckchen S bis 2kg" },
    { label: "Päckchen M (5,49 €)", value: "5.49", note: "DHL Päckchen M bis 5kg" },
    { label: "Paket (6,99 €)", value: "6.99", note: "DHL Paket bis 10kg" },
    { label: "Großes Paket (12,49 €)", value: "12.49", note: "DHL Paket bis 31,5kg" },
    { label: "Expressversand (19,99 €)", value: "19.99", note: "DHL Express 1 Werktag" },
    { label: "Eigener Betrag", value: "custom", note: "" },
  ];

  const [customShipping, setCustomShipping] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (!werk) return "0";
    const s = parseFloat(werk.shipping.replace(" €","").replace(",",".")).toFixed(2);
    const found = shippingPresets.find(p => parseFloat(p.value).toFixed(2) === s);
    return found ? found.value : "custom";
  });

  const applyPreset = (preset) => {
    setSelectedPreset(preset.value);
    if (preset.value === "custom") {
      setCustomShipping(true);
    } else {
      setCustomShipping(false);
      setShippingValue(preset.value);
      if (preset.note) setShippingNote(preset.note);
    }
  };

  const handleSave = () => {
    const shippingNum = parseFloat(shippingValue) || 0;
    const shippingStr = shippingNum === 0 ? "0 €" : shippingNum.toFixed(2).replace(".", ",") + " €";
    onSave({ ...werk, title, price: price + " €", shipping: shippingStr, shippingNote });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const totalPreview = (parseFloat(price) || 0) + (parseFloat(shippingValue) || 0);
  const provisionPreview = ((parseFloat(price) || 0) * 0.15);
  const impactPreview = (provisionPreview * 0.03);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 600, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>{werk ? "Werk bearbeiten" : "Neues Werk"}</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>Preis & Versand selbst festlegen</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={22} color="#555" /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {/* Werk-Name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Werkname</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Handgedrehte Keramik-Tasse" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", color: "#222" }} />
          </div>

          {/* Preis */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Verkaufspreis (€)</div>
            <div style={{ display: "flex", alignItems: "center", background: "#f9f9f7", borderRadius: 12, border: "1.5px solid #e8e8e8", overflow: "hidden" }}>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" style={{ flex: 1, padding: "12px 14px", border: "none", background: "none", fontSize: 18, fontWeight: 700, outline: "none", color: "#222" }} />
              <span style={{ paddingRight: 14, fontWeight: 700, fontSize: 16, color: "#aaa" }}>€</span>
            </div>
            {price && (
              <div style={{ marginTop: 8, background: `${TEAL}0d`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#666" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span>Du erhältst (nach 15% Provision)</span>
                  <span style={{ fontWeight: 700, color: TEAL }}>{((parseFloat(price)||0) * 0.85).toFixed(2)} €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span>Provision HUI (15%)</span>
                  <span style={{ color: "#888" }}>{provisionPreview.toFixed(2)} €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>🌱 davon Impact Pool (3% der Prov.)</span>
                  <span style={{ color: TEAL }}>{impactPreview.toFixed(2)} €</span>
                </div>
              </div>
            )}
          </div>

          {/* VERSANDKOSTEN */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4, display: "flex", alignItems: "center", gap: 6 }}>
              <Package size={13} color="#888" /> Versandkosten
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {shippingPresets.map(preset => (
                <button key={preset.value} onClick={() => applyPreset(preset)} style={{
                  background: selectedPreset === preset.value ? `${TEAL}15` : "#f5f5f3",
                  border: selectedPreset === preset.value ? `1.5px solid ${TEAL}` : "1.5px solid transparent",
                  borderRadius: 10, padding: "9px 10px", cursor: "pointer", textAlign: "left", transition: "all 0.15s"
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selectedPreset === preset.value ? TEAL : "#333" }}>{preset.label}</div>
                  {preset.value !== "custom" && <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{preset.note}</div>}
                </button>
              ))}
            </div>

            {(customShipping || selectedPreset === "custom") && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Eigener Betrag (€)</div>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f7", borderRadius: 12, border: "1.5px solid #e8e8e8", overflow: "hidden" }}>
                  <input type="number" value={shippingValue} onChange={e => setShippingValue(e.target.value)} placeholder="0,00" style={{ flex: 1, padding: "10px 14px", border: "none", background: "none", fontSize: 15, fontWeight: 600, outline: "none", color: "#222" }} />
                  <span style={{ paddingRight: 14, fontWeight: 600, fontSize: 14, color: "#aaa" }}>€</span>
                </div>
              </div>
            )}

            {/* Versandhinweis */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Versandhinweis für Käufer (optional)</div>
              <input value={shippingNote} onChange={e => setShippingNote(e.target.value)} placeholder="z.B. Versand innerhalb 2-3 Werktagen" style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 13, outline: "none", color: "#333" }} />
            </div>
          </div>

          {/* Preisvorschau für Käufer */}
          {price && (
            <div style={{ background: `${CORAL}08`, border: `1px solid ${CORAL}20`, borderRadius: 14, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>👁 So sieht es für Käufer aus:</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 4 }}><span>Werkpreis</span><span>{(parseFloat(price)||0).toFixed(2)} €</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 4 }}><span>Versand</span><span>{parseFloat(shippingValue) === 0 ? "Kostenlos" : (parseFloat(shippingValue)||0).toFixed(2) + " €"}</span></div>
              {shippingNote && <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6, fontStyle: "italic" }}>ℹ️ {shippingNote}</div>}
              <div style={{ borderTop: "1px solid #eee", paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15 }}>
                <span>Gesamtpreis</span>
                <span style={{ color: CORAL }}>{totalPreview.toFixed(2)} €</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={handleSave} disabled={!title || !price} style={{
            width: "100%",
            background: saved ? TEAL : (!title || !price ? "#e0e0e0" : `linear-gradient(135deg, ${CORAL}, ${GOLD})`),
            color: !title || !price ? "#aaa" : "white",
            border: "none", borderRadius: 14, padding: "14px",
            fontWeight: 700, fontSize: 16, cursor: !title || !price ? "default" : "pointer"
          }}>
            {saved ? "✓ Gespeichert!" : "Versand & Preis speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WirkerProfilePage({ wirkerName, onBack, onAddToCart, isOwnProfile, autoBook }) {
  const p = mockWirkerProfiles[wirkerName];
  const [tab, setTab] = useState("werke");
  const [followed, setFollowed] = useState(false);
  const [showBooking, setShowBooking] = useState(!!autoBook);
  const [showAvailEditor, setShowAvailEditor] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [werke, setWerke] = useState(p ? p.werke : []);
  const [editingWerk, setEditingWerk] = useState(null); // null | werk-object
  const [showWerkEditor, setShowWerkEditor] = useState(false);

  const handleSaveWerk = (updatedWerk) => {
    setWerke(prev => {
      const idx = prev.findIndex(w => w.title === editingWerk?.title);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedWerk;
        if (p) p.werke = next; // persist in mock
        return next;
      }
      const next = [...prev, updatedWerk];
      if (p) p.werke = next;
      return next;
    });
    setShowWerkEditor(false);
    setEditingWerk(null);
  };

  if (!p) return <div style={{ padding: 32, textAlign: "center" }}><button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, fontWeight: 700 }}>← Zurück</button><p>Profil nicht gefunden</p></div>;

  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh", background: "#fafaf8" }}>
      <div style={{ position: "relative" }}>
        <img src={p.header} style={{ width: "100%", height: 180, objectFit: "cover" }} alt="" />
        <button onClick={onBack} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ArrowLeft size={18} color="white" /></button>
        <button style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Share2 size={16} color="white" /></button>
      </div>

      <div style={{ background: "white", padding: "0 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: -36, marginBottom: 12 }}>
          <img src={p.img} style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid white", objectFit: "cover", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }} alt={p.name} />
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>{p.fullName}</div>
            <div style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{p.talent}</div>
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${CORAL}0d, ${GOLD}0d)`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>⭐</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>{p.recommendations} Menschen haben diesen Wirker weiterempfohlen</span>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[{ label: "Werke", value: p.werke.length }, { label: "Buchungen", value: p.bookings }, { label: "Follower", value: p.followers }].map(s => (
            <div key={s.label} style={{ flex: 1, background: "#f7f7f5", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, margin: "0 0 12px" }}>{p.bio}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, fontSize: 12, color: "#888" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} color={TEAL} />{p.location} · {p.distance}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} color={TEAL} />{p.hourlyRate}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Award size={12} color={GOLD} />Mitglied seit {p.memberSince}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Leaf size={12} color={TEAL} />{p.impactEur} € Impact</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {p.skills.map(s => <span key={s} style={{ background: `${TEAL}15`, color: TEAL, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>{s}</span>)}
        </div>

        {/* Verfügbarkeits-Übersicht */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>VERFÜGBARKEIT</div>
            {isOwnProfile && (
              <button onClick={() => setShowAvailEditor(true)} style={{ background: "none", border: `1px solid ${TEAL}`, borderRadius: 8, padding: "3px 10px", color: TEAL, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Edit3 size={11} /> Bearbeiten
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {WEEKDAYS.map(d => {
              const hasSlots = (defaultAvailability[p.name]?.[d]?.length || 0) > 0;
              return (
                <div key={d} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", background: hasSlots ? TEAL : "#f0f0f0", color: hasSlots ? "white" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{d}</div>
                  {hasSlots && <div style={{ fontSize: 9, color: TEAL, fontWeight: 600 }}>{defaultAvailability[p.name][d].length}×</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        {isOwnProfile ? (
          <button onClick={() => setShowAvailEditor(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL}cc)`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Calendar size={18} /> Verfügbarkeit einstellen
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowBooking(true)} style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              📅 Jetzt buchen
            </button>
            <button onClick={() => setFollowed(f => !f)} style={{ background: followed ? `${TEAL}18` : "none", border: `2px solid ${TEAL}`, borderRadius: 14, padding: "13px 18px", fontWeight: 700, fontSize: 14, color: TEAL, cursor: "pointer" }}>
              {followed ? "✓ Folge ich" : "Folgen"}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ background: "white", display: "flex", borderTop: "1px solid #f0f0f0", marginTop: 10 }}>
        {["werke", "über"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "12px 0", fontWeight: tab === t ? 700 : 400, color: tab === t ? CORAL : "#bbb", fontSize: 14, cursor: "pointer" }}>
            {t === "werke" ? "Werke & Angebote" : "Über diesen Wirker"}
          </button>
        ))}
      </div>

      {tab === "werke" && (
        <div style={{ padding: "14px" }}>
          {/* Eigentümer: Neues Werk hinzufügen */}
          {isOwnProfile && (
            <button onClick={() => { setEditingWerk(null); setShowWerkEditor(true); }} style={{ width: "100%", background: `${TEAL}10`, border: `1.5px dashed ${TEAL}60`, borderRadius: 14, padding: "12px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: TEAL, fontWeight: 700, fontSize: 14 }}>
              <Plus size={16} color={TEAL} /> Neues Werk hinzufügen
            </button>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {werke.map((w, i) => (
              <div key={i} style={{ background: "linear-gradient(160deg,#fff8f7,#fff3f0)", borderRadius: 14, overflow: "hidden", boxShadow: `0 2px 10px ${CORAL}10`, border: `1px solid ${CORAL}18`, position: "relative" }}>
                <img src={w.img} style={{ width: "100%", height: 100, objectFit: "cover" }} alt={w.title} />
                {/* Edit-Button für Eigentümer */}
                {isOwnProfile && (
                  <button onClick={() => { setEditingWerk(w); setShowWerkEditor(true); }} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Edit3 size={13} color="white" />
                  </button>
                )}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#222", marginBottom: 2 }}>{w.title}</div>
                  {/* Versandinfo */}
                  {w.shipping && (
                    <div style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>
                      📦 {w.shipping === "0 €" ? "Versandkostenfrei" : `+ ${w.shipping} Versand`}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: CORAL, fontSize: 13 }}>{w.price}</span>
                    {!isOwnProfile
                      ? <button onClick={() => onAddToCart({ title: w.title, price: w.price, img: w.img, creator: p.name })} style={{ background: CORAL, color: "white", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>+ Korb</button>
                      : <span style={{ fontSize: 10, color: "#bbb" }}>Dein Werk</span>
                    }
                  </div>
                </div>
              </div>
            ))}
            {/* Buchungs-Karte für Besucher */}
            {!isOwnProfile && (
              <div onClick={() => setShowBooking(true)} style={{ background: `linear-gradient(160deg,${TEAL}12,${TEAL}20)`, borderRadius: 14, border: `1.5px dashed ${TEAL}60`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 14, cursor: "pointer", minHeight: 130 }}>
                <Calendar size={28} color={TEAL} style={{ marginBottom: 6 }} />
                <div style={{ fontWeight: 700, fontSize: 12, color: TEAL, textAlign: "center" }}>Termin buchen</div>
                <div style={{ fontSize: 10, color: `${TEAL}aa`, textAlign: "center", marginTop: 3 }}>{p.hourlyRate}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "über" && (
        <div style={{ padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Über {p.fullName}</div>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: 0 }}>{p.bio}</p>
          </div>
          <div style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 12 }}>
            {[{ icon: "📍", label: "Standort", val: `${p.location} (${p.distance} entfernt)` }, { icon: "📅", label: "Mitglied seit", val: p.memberSince }, { icon: "🎯", label: "Buchungen", val: `${p.bookings} erfolgreiche Buchungen` }, { icon: "🌱", label: "Impact", val: `${p.impactEur} € in Impact Pool` }, { icon: "💶", label: "Stundensatz", val: p.hourlyRate }].map((row, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <span style={{ fontSize: 18 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{row.label.toUpperCase()}</div>
                  <div style={{ fontSize: 14, color: "#333" }}>{row.val}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Empfehlungen */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              👍 Empfehlungen
              <span style={{ background: TEAL + "15", color: TEAL, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                {(p.empfehlungen || []).length} verifiziert
              </span>
            </div>
            {(p.empfehlungen || [
              { name: "Anna K.", text: "Wirklich unglaublich talentiert! Der Workshop hat meine Erwartungen weit übertroffen. Sehr empfehlenswert!", datum: "März 2026", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop" },
              { name: "Marc B.", text: "Die Keramik-Tasse ist ein echtes Kunstwerk. Schneller Versand, liebevolle Verpackung. Gerne wieder!", datum: "Feb 2026", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop" },
              { name: "Lisa M.", text: "Hat uns nach dem Kauf sofort kontaktiert und alles erklärt. Professionell und herzlich.", datum: "Jan 2026", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop" },
            ]).map((e, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <img src={e.avatar} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} alt={e.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>{e.datum}</div>
                  </div>
                  <div style={{ background: `${TEAL}15`, borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700, color: TEAL }}>✓ Verifiziert</div>
                </div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic" }}>"{e.text}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showBooking && <BookingFlow wirker={p} onClose={() => setShowBooking(false)} onSuccess={() => { setShowBooking(false); setBookingDone(true); }} />}
      {showAvailEditor && <AvailabilityEditor wirkerName={p.name} onClose={() => setShowAvailEditor(false)} />}
      {showWerkEditor && <WerkEditor werk={editingWerk} wirkerName={p.name} onClose={() => { setShowWerkEditor(false); setEditingWerk(null); }} onSave={handleSaveWerk} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// WERK DETAIL PAGE
// ══════════════════════════════════════════════════════════════════
function WerkDetailPage({ werkTitle, onBack, onAddToCart, onViewWirker }) {
  const w = mockWerkDetails[werkTitle];
  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  if (!w) return <div style={{ padding: 32, textAlign: "center" }}><button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, fontWeight: 700 }}>← Zurück</button><p>Werk nicht gefunden</p></div>;

  const allImgs = [w.img, ...w.extraImgs];
  const priceNum = parseFloat(w.price.replace(" €", ""));
  const totalNum = priceNum + parseFloat(w.shipping.replace(" €", ""));

  return (
    <div style={{ paddingBottom: 100, overflowY: "auto", height: "100vh", background: "#fafaf8" }}>
      <div style={{ position: "relative" }}>
        <img src={allImgs[imgIdx]} style={{ width: "100%", height: 320, objectFit: "cover" }} alt={w.title} />
        <button onClick={onBack} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ArrowLeft size={18} color="white" /></button>
        <button style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Share2 size={16} color="white" /></button>
        {allImgs.length > 1 && (
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
            {allImgs.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} style={{ width: i === imgIdx ? 18 : 7, height: 7, borderRadius: 4, background: i === imgIdx ? "white" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0 }} />)}
          </div>
        )}
      </div>
      {allImgs.length > 1 && (
        <div style={{ display: "flex", gap: 8, padding: "10px 16px", background: "white" }}>
          {allImgs.map((img, i) => <img key={i} src={img} onClick={() => setImgIdx(i)} style={{ width: 58, height: 58, borderRadius: 10, objectFit: "cover", border: i === imgIdx ? `2.5px solid ${CORAL}` : "2.5px solid transparent", cursor: "pointer" }} alt="" />)}
        </div>
      )}
      <div style={{ background: "white", padding: "16px 16px 20px", marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#222", flex: 1, paddingRight: 12 }}>{w.title}</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: CORAL }}>{w.price}</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setLiked(l => !l)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: liked ? CORAL : "#aaa", padding: 0 }}>
            <Heart size={18} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#aaa"} /><span style={{ fontSize: 13 }}>{w.likes + (liked ? 1 : 0)}</span>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Share2 size={18} color="#aaa" /></button>
          <button onClick={() => setFaved(f => !f)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Star size={18} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#aaa"} />
          </button>
        </div>
        <div onClick={() => onViewWirker(w.creator)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: `${TEAL}0d`, borderRadius: 12, marginBottom: 14, cursor: "pointer", border: `1px solid ${TEAL}20` }}>
          <img src={w.creatorImg} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} alt={w.creator} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{w.creator}</div>
            <div style={{ fontSize: 12, color: TEAL }}>Wirker-Profil ansehen →</div>
          </div>
          <ChevronRight size={16} color={TEAL} />
        </div>
        <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-line" }}>{w.description}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {w.tags.map(t => <span key={t} style={{ background: "#f3f3f3", color: "#777", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{t}</span>)}
        </div>
        <div style={{ background: "#f9f9f7", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 6 }}><span>Preis</span><span>{w.price}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: w.shippingNote ? 3 : 6 }}><span>Versand</span><span style={{ fontWeight: w.shipping === "0 €" ? 600 : 400, color: w.shipping === "0 €" ? TEAL : "#888" }}>{w.shipping === "0 €" ? "Kostenlos ✓" : w.shipping}</span></div>
          {w.shippingNote && <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6, fontStyle: "italic" }}>ℹ️ {w.shippingNote}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 8 }}><span>🌱 3% der Provision gehen in den Impact Pool</span></div>
          <div style={{ borderTop: "1px solid #eee", paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}><span>Gesamt</span><span style={{ color: CORAL }}>{totalNum.toFixed(2)} €</span></div>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${TEAL}10, ${GOLD}10)`, borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
          🌱 {w.impactHint}
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "12px 16px 24px", background: "white", borderTop: "1px solid #eee", zIndex: 150 }}>
        <button onClick={() => onAddToCart({ title: w.title, price: w.price, img: w.img, creator: w.creator })} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          🧺 In den Werkekorb — {w.price}
        </button>
      </div>
    </div>
  );
}

// ── (All other components unchanged below) ────────────────────────────────
function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(50);
  const [contentType, setContentType] = useState("alles");
  const [categories, setCategories] = useState([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("relevanz");
  const [availability, setAvailability] = useState([]);
  const [offerType, setOfferType] = useState([]);
  const [minRecommendations, setMinRecommendations] = useState(0);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [expandedSection, setExpandedSection] = useState("typ");
  const allCategories = [{ label: "Kunst & Kreatives", icon: "🎨" }, { label: "Musik", icon: "🎵" }, { label: "Fotografie", icon: "📷" }, { label: "Coaching", icon: "💡" }, { label: "Handwerk", icon: "🔨" }, { label: "Fitness & Sport", icon: "🏋️" }, { label: "Wellness & Yoga", icon: "🧘" }, { label: "Kulinarik", icon: "🍳" }, { label: "Schreiben & Text", icon: "✍️" }, { label: "Technik & IT", icon: "💻" }, { label: "Mode & Styling", icon: "👗" }, { label: "Natur & Garten", icon: "🌿" }];
  const availabilityOptions = ["Heute", "Diese Woche", "Dieses Wochenende", "Nächste Woche"];
  const sortOptions = [{ value: "relevanz", label: "Relevanz" }, { value: "empfehlungen", label: "Meiste Empfehlungen" }, { value: "neu", label: "Neueste zuerst" }, { value: "preis_asc", label: "Preis: günstig → teuer" }, { value: "preis_desc", label: "Preis: teuer → günstig" }];
  const toggleArr = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  const activeFilterCount = [contentType !== "alles", categories.length > 0, priceMin || priceMax, availability.length > 0, offerType.length > 0, minRecommendations > 0, onlineOnly, sortBy !== "relevanz"].filter(Boolean).length;
  const Section = ({ id, title, icon, children }) => { const open = expandedSection === id; return (<div style={{ borderBottom: "1px solid #f0f0f0" }}><button onClick={() => setExpandedSection(open ? null : id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "13px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontWeight: 600, fontSize: 14, color: "#333", display: "flex", alignItems: "center", gap: 7 }}><span>{icon}</span>{title}</span>{open ? <ChevronUp size={16} color="#aaa" /> : <ChevronDown size={16} color="#aaa" />}</button>{open && <div style={{ paddingBottom: 14 }}>{children}</div>}</div>); };
  const Chip = ({ label, active, onClick, icon }) => (<button onClick={onClick} style={{ background: active ? TEAL : "#f3f3f3", color: active ? "white" : "#555", border: "none", borderRadius: 20, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>{icon && <span style={{ fontSize: 13 }}>{icon}</span>}{label}{active && <Check size={11} color="white" />}</button>);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "white", padding: "16px 16px 0", maxWidth: 430, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 12, padding: "11px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <Search size={16} color={TEAL} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Suche nach Talent, Werk, Name…" style={{ border: "none", background: "none", flex: 1, fontSize: 14, outline: "none", color: "#222" }} />
            {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={14} color="#aaa" /></button>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: CORAL, fontWeight: 700, fontSize: 14 }}>Fertig</button>
        </div>
        {activeFilterCount > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><SlidersHorizontal size={13} color={CORAL} /><span style={{ fontSize: 12, color: CORAL, fontWeight: 600 }}>{activeFilterCount} Filter aktiv</span><button onClick={() => { setContentType("alles"); setCategories([]); setPriceMin(""); setPriceMax(""); setAvailability([]); setOfferType([]); setMinRecommendations(0); setOnlineOnly(false); setSortBy("relevanz"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 12, marginLeft: 4 }}>Alle zurücksetzen</button></div>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", background: "white", maxWidth: 430, width: "100%", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ borderBottom: "1px solid #f0f0f0", padding: "13px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>📍 Umkreis: <span style={{ color: TEAL }}>{radius === 200 ? "Weltweit" : `${radius} km`}</span></span><button onClick={() => setRadius(200)} style={{ background: radius === 200 ? TEAL : "#f0f0f0", border: "none", borderRadius: 8, padding: "4px 10px", color: radius === 200 ? "white" : "#555", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🌍 Weltweit</button></div>
          <input type="range" min={20} max={200} step={10} value={radius} onChange={e => setRadius(+e.target.value)} style={{ width: "100%", accentColor: TEAL }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#bbb", marginTop: 4 }}><span>20km</span><span>50km</span><span>100km</span><span>200km</span><span>Welt</span></div>
        </div>
        <Section id="typ" title="Was suchst du?" icon="🔍"><div style={{ display: "flex", gap: 8 }}>{[{ v: "alles", l: "Alles" }, { v: "wirker", l: "Wirker" }, { v: "werke", l: "Werke" }].map(o => (<button key={o.v} onClick={() => setContentType(o.v)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: contentType === o.v ? CORAL : "#f3f3f3", color: contentType === o.v ? "white" : "#555" }}>{o.l}</button>))}</div></Section>
        <Section id="angebot" title="Art des Angebots" icon="📦"><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Chip label="Buchbar" active={offerType.includes("buchbar")} onClick={() => toggleArr(offerType, setOfferType, "buchbar")} icon="📅" /><Chip label="Kaufbar" active={offerType.includes("kaufbar")} onClick={() => toggleArr(offerType, setOfferType, "kaufbar")} icon="🛒" /><Chip label="Online möglich" active={onlineOnly} onClick={() => setOnlineOnly(p => !p)} icon="💻" /></div></Section>
        <Section id="kategorien" title="Kategorien" icon="🎯"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{allCategories.map(c => <Chip key={c.label} label={c.label} icon={c.icon} active={categories.includes(c.label)} onClick={() => toggleArr(categories, setCategories, c.label)} />)}</div></Section>
        <Section id="preis" title="Preisspanne" icon="💶"><div style={{ display: "flex", gap: 10, alignItems: "center" }}><div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13, color: "#aaa" }}>von</span><input value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="0" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} /><span style={{ fontSize: 13, color: "#aaa" }}>€</span></div><span style={{ color: "#bbb" }}>–</span><div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13, color: "#aaa" }}>bis</span><input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="∞" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} /><span style={{ fontSize: 13, color: "#aaa" }}>€</span></div></div><div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>{[["bis 25 €","","25"],["25–100 €","25","100"],["100–300 €","100","300"],["300 €+","300",""]].map(([l,min,max]) => (<button key={l} onClick={() => { setPriceMin(min); setPriceMax(max); }} style={{ background: priceMin === min && priceMax === max ? TEAL : "#f3f3f3", color: priceMin === min && priceMax === max ? "white" : "#555", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>))}</div></Section>
        <Section id="verfuegbarkeit" title="Verfügbarkeit" icon="📅"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{availabilityOptions.map(a => <Chip key={a} label={a} active={availability.includes(a)} onClick={() => toggleArr(availability, setAvailability, a)} />)}</div></Section>
        <Section id="empfehlungen" title="Mindest-Empfehlungen" icon="⭐"><div style={{ display: "flex", gap: 8 }}>{[0,5,10,25,50].map(n => (<button key={n} onClick={() => setMinRecommendations(n)} style={{ background: minRecommendations === n ? CORAL : "#f3f3f3", color: minRecommendations === n ? "white" : "#555", border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{n === 0 ? "Alle" : `${n}+`}</button>))}</div></Section>
        <Section id="sortierung" title="Sortieren nach" icon="↕️"><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{sortOptions.map(o => (<button key={o.value} onClick={() => setSortBy(o.value)} style={{ background: sortBy === o.value ? `${TEAL}15` : "none", border: sortBy === o.value ? `1.5px solid ${TEAL}` : "1.5px solid #eee", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: sortBy === o.value ? TEAL : "#444", fontWeight: sortBy === o.value ? 700 : 400, fontSize: 13 }}>{o.label}{sortBy === o.value && <Check size={15} color={TEAL} />}</button>))}</div></Section>
        <div style={{ height: 16 }} />
      </div>
      <div style={{ background: "white", padding: "12px 16px 24px", borderTop: "1px solid #f0f0f0", maxWidth: 430, width: "100%", margin: "0 auto" }}>
        <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{activeFilterCount > 0 ? `${activeFilterCount} Filter anwenden` : "Suchen"}</button>
      </div>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: -1 }} />
    </div>
  );
}

function AppHeader({ cartCount, onCartClick }) {
  return (
    <div style={{ background: "white", padding: "14px 16px 10px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, letterSpacing: 0.2 }}>Human United Intelligent</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onCartClick} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6 }}>
            <ShoppingBasket size={22} color="#444" />
            {cartCount > 0 && <span style={{ position: "absolute", top: 0, right: 0, background: CORAL, color: "white", borderRadius: "50%", width: 15, height: 15, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Bell size={22} color="#444" /></button>
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
        <div style={{ background: `${TEAL}18`, borderRadius: 8, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}><SlidersHorizontal size={13} color={TEAL} /><span style={{ fontSize: 11, color: TEAL, fontWeight: 700 }}>Filter</span></div>
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// STORY VIEWER (Instagram-Style)
// ══════════════════════════════════════════════════════════════════
function StoryViewer({ stories, startIndex = 0, onClose, onCreateNew }) {
  const [storyIndex, setStoryIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const DURATION = 5000; // 5s pro Story
  const intervalRef = React.useRef(null);

  const current = stories[storyIndex];

  React.useEffect(() => {
    setProgress(0);
    if (paused) return;
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        if (storyIndex < stories.length - 1) setStoryIndex(i => i + 1);
        else onClose();
      }
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [storyIndex, paused]);

  const goNext = () => {
    clearInterval(intervalRef.current);
    if (storyIndex < stories.length - 1) setStoryIndex(i => i + 1);
    else onClose();
  };
  const goPrev = () => {
    clearInterval(intervalRef.current);
    if (storyIndex > 0) setStoryIndex(i => i - 1);
  };

  const storyTypeColor = { foto: CORAL, angebot: GOLD, behind: TEAL };
  const color = storyTypeColor[current.type] || CORAL;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "#000", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      {/* Hintergrundbild */}
      <img src={current.img} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }} alt="" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.7) 100%)" }} />

      {/* Fortschrittsbalken */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", gap: 4, padding: "14px 14px 8px" }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "white", width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%", transition: i === storyIndex ? "none" : "none" }} />
          </div>
        ))}
      </div>

      {/* Header: Avatar + Name + Schließen */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 10, padding: "4px 14px 12px" }}>
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid white", objectFit: "cover" }} alt="" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>Lars M.</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{current.time}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setPaused(p => !p)} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "white", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {paused ? "▶" : "⏸"}
          </button>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} color="white" /></button>
        </div>
      </div>

      {/* Tap-Zonen: links ← zurück, rechts → weiter */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex" }}>
        <div style={{ flex: 1 }} onClick={goPrev} />
        <div style={{ flex: 1 }} onClick={goNext} />
      </div>

      {/* Label-Chip */}
      <div style={{ position: "absolute", top: "40%", left: 14, zIndex: 11 }}>
        <div style={{ background: color, color: "white", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>{current.label}</div>
      </div>

      {/* Story-Text unten */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "0 16px 32px" }}>
        <div style={{ fontSize: 15, color: "white", fontWeight: 500, lineHeight: 1.55, marginBottom: 14, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{current.text}</div>

        {/* Stats + Aktionen */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              <span>👁️</span><span>{current.views}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              <Heart size={14} color="white" fill="white" /><span>{current.likes}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20, padding: "7px 14px", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", backdropFilter: "blur(4px)" }}>
              🗑️ Löschen
            </button>
            <button style={{ background: "white", border: "none", borderRadius: 20, padding: "7px 14px", color: "#222", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              <Share2 size={12} style={{ display: "inline", marginRight: 4 }} /> Teilen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STORY ERSTELLEN (Instagram-Style, vollständig)
// ══════════════════════════════════════════════════════════════════
function StoryCreateFull({ onClose, onPublished }) {
  const [step, setStep] = useState("compose"); // compose | preview | done
  const [text, setText] = useState("");
  const [storyType, setStoryType] = useState("foto");
  const [selectedImg, setSelectedImg] = useState(0);

  const storyTypes = [
    { id: "foto", icon: "📷", label: "Foto/Werk", color: CORAL },
    { id: "angebot", icon: "🎁", label: "Angebot", color: GOLD },
    { id: "behind", icon: "🎬", label: "Behind the Scenes", color: TEAL },
    { id: "text", icon: "✍️", label: "Nur Text", color: "#7C3AED" },
  ];

  const sampleImgs = [
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=900&fit=crop",
  ];

  const typeInfo = storyTypes.find(t => t.id === storyType);

  if (step === "done") return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "36px 28px", textAlign: "center", width: "100%", maxWidth: 340 }}>
        <div style={{ fontSize: 64, marginBottom: 14 }}>✨</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#222", marginBottom: 8 }}>Story ist live!</div>
        <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>Deine Story ist 24 Stunden für deine Follower und im HUI-Feed sichtbar.</div>
        <button onClick={onPublished} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Zurück zum Profil</button>
      </div>
    </div>
  );

  if (step === "preview") return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "#000", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <img src={sampleImgs[selectedImg]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.88 }} alt="" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 16px 12px" }}>
        <button onClick={() => setStep("compose")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={18} color="white" /></button>
        <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>Vorschau</div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ position: "absolute", top: "38%", left: 16, zIndex: 11 }}>
        <div style={{ background: typeInfo.color, color: "white", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>{typeInfo.label}</div>
      </div>
      <div style={{ position: "absolute", bottom: 32, left: 16, right: 16, zIndex: 10 }}>
        {text.trim() && <div style={{ fontSize: 15, color: "white", fontWeight: 500, lineHeight: 1.55, marginBottom: 20, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{text}</div>}
        <button onClick={() => setStep("done")} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          🚀 Jetzt veröffentlichen
        </button>
      </div>
    </div>
  );

  // Compose-Schritt
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Story erstellen</div>
          <button onClick={onClose} style={{ background: "#f0f0ee", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 16px" }}>
          {/* Story-Typ wählen */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>Story-Typ</div>
            <div style={{ display: "flex", gap: 8 }}>
              {storyTypes.map(t => (
                <button key={t.id} onClick={() => setStoryType(t.id)}
                  style={{ flex: 1, background: storyType === t.id ? `${t.color}18` : "#f4f4f2", border: `1.5px solid ${storyType === t.id ? t.color : "transparent"}`, borderRadius: 14, padding: "10px 6px", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 20 }}>{t.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: storyType === t.id ? t.color : "#999", marginTop: 4, lineHeight: 1.3 }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bild wählen */}
          {storyType !== "text" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>Bild / Werk</div>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Hochladen */}
                <div style={{ width: 78, height: 78, borderRadius: 14, border: "2px dashed #ddd", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <span style={{ fontSize: 22 }}>📷</span>
                  <span style={{ fontSize: 9, color: "#bbb", marginTop: 3 }}>Upload</span>
                </div>
                {/* Eigene Werke als Thumbnails */}
                {sampleImgs.map((src, i) => (
                  <div key={i} onClick={() => setSelectedImg(i)} style={{ width: 78, height: 78, borderRadius: 14, overflow: "hidden", border: selectedImg === i ? `2.5px solid ${typeInfo.color}` : "2.5px solid transparent", cursor: "pointer", flexShrink: 0, position: "relative" }}>
                    <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    {selectedImg === i && <div style={{ position: "absolute", inset: 0, background: `${typeInfo.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={18} color={typeInfo.color} /></div>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>Wähle eines deiner Werke oder lade ein neues Foto hoch</div>
            </div>
          )}

          {/* Text */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Text / Caption</div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
              placeholder={
                storyType === "angebot" ? "Beschreibe dein Angebot – Preis, Verfügbarkeit, Details..." :
                storyType === "behind" ? "Gib einen Blick hinter die Kulissen – was passiert gerade in deinem Atelier?" :
                storyType === "text" ? "Deine Gedanken, eine Frage, ein Impuls..." :
                "Was zeigst du? Ein neues Werk, eine Idee, ein Moment..."
              }
              style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1.5px solid #e8e8e8", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
            <div style={{ fontSize: 11, color: text.length > 250 ? CORAL : "#bbb", textAlign: "right", marginTop: 3 }}>{text.length}/280</div>
          </div>

          {/* Tipp */}
          <div style={{ background: `${GOLD}0d`, borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#888", lineHeight: 1.55 }}>
            ⏱ Stories sind <strong>24 Stunden</strong> sichtbar · erscheinen bei deinen Followern im Story-Bar · und bleiben in deinem Profil archiviert
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#f5f5f3", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#666" }}>Abbrechen</button>
          <button onClick={() => setStep("preview")} style={{ flex: 2, background: (storyType === "text" ? text.trim().length > 0 : true) ? `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}cc)` : "#e0e0e0", color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Vorschau →
          </button>
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
function MediaCard({ item, liked, onLike, faved, onFav, onViewWirker, isTalentUser }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ background: "white", marginBottom: 8, borderLeft: `3px solid ${TEAL}`, borderRight: `3px solid ${TEAL}22` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px", background: `linear-gradient(90deg, ${TEAL}08, transparent)` }}>
        <img src={item.creatorImg} onClick={() => onViewWirker(item.creator)} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}`, cursor: "pointer" }} alt={item.creator} />
        <div style={{ cursor: "pointer" }} onClick={() => onViewWirker(item.creator)}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{item.creator}</div>
          <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{item.talent}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#bbb", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} color="#bbb" />{item.location}</div>
      </div>
      <div style={{ position: "relative", cursor: item.mediaType === "video" ? "pointer" : "default" }} onClick={() => item.mediaType === "video" && setPlaying(p => !p)}>
        <img src={item.img} style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} alt="" />
        {item.mediaType === "video" && !playing && (<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={22} color={CORAL} fill={CORAL} style={{ marginLeft: 3 }} /></div></div>)}
        {item.mediaType === "video" && playing && <div style={{ position: "absolute", bottom: 10, right: 10, background: CORAL, color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>▶ Läuft</div>}
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => onLike(item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: liked ? CORAL : "#888", padding: 0 }}><Heart size={20} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#888"} /><span style={{ fontWeight: 600, fontSize: 13 }}>{item.likes + (liked ? 1 : 0)}</span></button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Share2 size={20} color="#888" /></button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Star size={20} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#888"} /></button>
          <button onClick={() => onViewWirker(item.creator)} style={{ marginLeft: "auto", background: TEAL, color: "white", border: "none", borderRadius: 20, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Talent ansehen</button>
        </div>
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}><span style={{ fontWeight: 700 }}>{item.creator} </span>{item.caption}</div>
      </div>
      <CommentSection itemId={item.id} creator={item.creator} isTalent={isTalentUser && item.creator === "Sofia M."} />
    </div>
  );
}
function WerkCard({ item, liked, onLike, faved, onFav, onAddToCart, onViewWerk, onViewWirker, isTalentUser }) {
  const [added, setAdded] = useState(false);
  const handleCart = (e) => {
    e.stopPropagation();
    onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <div style={{ background: "linear-gradient(160deg, #fff8f7, #fff3f0)", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 14px rgba(255,107,91,0.10)", border: `1px solid ${CORAL}18`, margin: "8px 16px" }}>
      <div style={{ position: "relative", cursor: "pointer" }} onClick={() => onViewWerk(item.title)}>
        <img src={item.img} style={{ width: "100%", height: 210, objectFit: "cover" }} alt={item.title} />
        {/* Preis oben links */}
        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: "white", borderRadius: 20, padding: "5px 12px", fontWeight: 800, fontSize: 15 }}>{item.price}</div>
        {/* In den Korb – Overlay-Button unten */}
        <button
          onClick={handleCart}
          style={{
            position: "absolute", bottom: 10, right: 10,
            background: added ? TEAL : CORAL,
            color: "white", border: "none", borderRadius: 22,
            padding: "8px 16px", fontWeight: 700, fontSize: 13,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 2px 10px rgba(0,0,0,0.25)", transition: "background 0.25s"
          }}
        >
          <ShoppingBasket size={14} color="white" />
          {added ? "✓ Hinzugefügt" : "In den Korb"}
        </button>
      </div>
      <div style={{ padding: "10px 14px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <img src={item.creatorImg} onClick={(e) => { e.stopPropagation(); onViewWirker(item.creator); }} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", cursor: "pointer" }} alt={item.creator} />
          <span onClick={(e) => { e.stopPropagation(); onViewWirker(item.creator); }} style={{ fontWeight: 600, fontSize: 12, color: TEAL, cursor: "pointer" }}>{item.creator}</span>
          <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{item.location}</span>
        </div>
        <div onClick={() => onViewWerk(item.title)} style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 8, cursor: "pointer" }}>{item.title}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => onLike(item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: liked ? CORAL : "#bbb", padding: 0 }}><Heart size={17} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#bbb"} /><span style={{ fontSize: 12, color: liked ? CORAL : "#bbb" }}>{item.likes + (liked ? 1 : 0)}</span></button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Share2 size={17} color="#bbb" /></button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Star size={17} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#bbb"} /></button>
          <button onClick={() => onViewWerk(item.title)} style={{ marginLeft: "auto", background: "none", border: `1.5px solid ${CORAL}`, borderRadius: 10, padding: "5px 12px", fontWeight: 700, fontSize: 12, color: CORAL, cursor: "pointer" }}>Details →</button>
        </div>
      </div>
      <CommentSection itemId={item.id} creator={item.creator} isTalent={isTalentUser && item.creator === "Sofia M."} />
    </div>
  );
}
function WirkerCard({ item, onViewWirker, onBookWirker }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${TEAL}12, #f0fdfb)`, border: `1.5px solid ${TEAL}40`, borderRadius: 16, margin: "8px 16px", padding: 14, boxShadow: `0 2px 14px ${TEAL}18` }}>
      {/* Obere Zeile: Foto + Info + Profil-Button */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <img src={item.img} onClick={() => onViewWirker(item.name)} style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${TEAL}`, cursor: "pointer", flexShrink: 0 }} alt={item.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{item.name}</div>
          <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, marginBottom: 2 }}>{item.talent}</div>
          <div style={{ fontSize: 11, color: "#999", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{item.location} · ⭐ {item.recommendations} Empfehlungen</div>
        </div>
        <button onClick={() => onViewWirker(item.name)} style={{ background: "none", border: `1.5px solid ${TEAL}`, borderRadius: 10, padding: "6px 10px", fontWeight: 700, fontSize: 11, color: TEAL, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>Profil →</button>
      </div>
      {/* Buchungs-Button – volle Breite */}
      <button
        onClick={() => onBookWirker(item.name)}
        style={{
          width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`,
          color: "white", border: "none", borderRadius: 12,
          padding: "10px 0", fontWeight: 700, fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7
        }}
      >
        <Calendar size={15} color="white" /> Jetzt Termin buchen
      </button>
    </div>
  );
}
function ImpactCard({ item }) {
  return (
    <div style={{ background: `linear-gradient(160deg, #fffdf0, #fff8e1)`, borderRadius: 16, overflow: "hidden", boxShadow: `0 2px 14px ${GOLD}22`, border: `1px solid ${GOLD}30`, margin: "8px 16px" }}>
      <div style={{ position: "relative" }}><img src={item.img} style={{ width: "100%", height: 150, objectFit: "cover" }} alt={item.title} /><div style={{ position: "absolute", top: 10, left: 10, background: GOLD, color: "white", borderRadius: 20, padding: "4px 12px", fontWeight: 700, fontSize: 12 }}>🌱 Impact-Projekt</div></div>
      <div style={{ padding: "12px 14px" }}><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{item.title}</div><div style={{ background: "#f0f0f0", borderRadius: 99, height: 7, marginBottom: 6 }}><div style={{ background: `linear-gradient(90deg, ${GOLD}, ${CORAL})`, height: 7, borderRadius: 99, width: `${item.progress}%` }} /></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}><span>{item.collected} gesammelt</span><span>Ziel: {item.goal}</span></div></div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// CHAT + TREUHAND + EMPFEHLUNGS-FLOW
// ══════════════════════════════════════════════════════════════════

// Mock Chats (Käufer-Sicht)
const mockChats = [
  {
    id: "chat1", type: "buchung", status: "aktiv", // aktiv | abgeschlossen | gemeldet
    wirker: "Sofia M.", wirkerImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop",
    item: "Töpfer-Workshop", date: "28. April 2026", betrag: "75 €",
    treuhand: "offen", // offen | freigegeben
    bewertung: null,
    messages: [
      { from: "system", text: "🔒 Buchung bestätigt! Dein Geld liegt sicher im Treuhandkonto. Es wird erst nach deiner Bestätigung an Sofia freigegeben.", time: "10:00" },
      { from: "wirker", text: "Hallo! Ich freue mich auf unseren Töpfer-Workshop 🎨 Bitte bring bequeme Kleidung mit.", time: "10:05" },
      { from: "ich", text: "Super, ich freu mich auch! Gibt es etwas, das ich vorbereiten soll?", time: "10:12" },
      { from: "wirker", text: "Nein, alles da! Bis Dienstag 👋", time: "10:14" },
    ]
  },
  {
    id: "chat2", type: "werk", status: "empfehlung_ausstehend",
    wirker: "Tom H.", wirkerImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    item: "Handgenähter Leder-Rucksack", date: "20. April 2026", betrag: "195 €",
    treuhand: "offen",
    bewertung: null,
    messages: [
      { from: "system", text: "🔒 Kauf bestätigt! Dein Geld liegt sicher im Treuhandkonto.", time: "14:00" },
      { from: "wirker", text: "Hallo! Dein Rucksack ist fertig genäht 🎒 Ich versende ihn morgen per DHL.", time: "16:30" },
      { from: "ich", text: "Wunderbar, danke für die schnelle Arbeit!", time: "17:00" },
      { from: "system", text: "📦 Ware wurde als geliefert markiert. Bitte bestätige den Erhalt und gib eine Empfehlung ab.", time: "23. April", isPrompt: true },
    ]
  },
  {
    id: "chat3", type: "buchung", status: "abgeschlossen",
    wirker: "Lena K.", wirkerImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    item: "Aquarell-Portrait", date: "10. April 2026", betrag: "120 €",
    treuhand: "freigegeben",
    bewertung: { empfohlen: true, text: "Lena ist unglaublich talentiert! Das Portrait hat mich zu Tränen gerührt." },
    messages: [
      { from: "system", text: "🔒 Buchung bestätigt! Dein Geld liegt sicher im Treuhandkonto.", time: "09:00" },
      { from: "wirker", text: "Ich habe das Portrait fertiggestellt! Hier ein Foto 🎨", time: "12:00" },
      { from: "ich", text: "Es ist wunderschön! Vielen Dank Lena!", time: "12:30" },
      { from: "system", text: "✅ Empfehlung abgegeben. Geld wurde an Lena freigegeben. Chat archiviert.", time: "12:35", isDone: true },
    ]
  },
];

function ChatListPage({ onOpenChat, onBack }) {
  const [chats] = useState(mockChats);
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
          <div style={{ fontWeight: 700, fontSize: 17, color: "#333", marginBottom: 6 }}>Noch keine Chats</div>
          <div style={{ fontSize: 13, color: "#aaa" }}>Nach einer Buchung oder einem Kauf öffnet sich hier automatisch ein Chat.</div>
        </div>
      )}
    </div>
  );
}

function ChatDetailPage({ chat: initialChat, onBack }) {
  const [chat, setChat] = useState(initialChat);
  const [message, setMessage] = useState("");
  const [showEmpfehlung, setShowEmpfehlung] = useState(chat.status === "empfehlung_ausstehend");
  const [empfehlungText, setEmpfehlungText] = useState("");
  const [empfehlungAbgegeben, setEmpfehlungAbgegeben] = useState(false);
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg = { from: "ich", text: message.trim(), time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) };
    setChat(c => ({ ...c, messages: [...c.messages, newMsg] }));
    setMessage("");
  };

  const handleEmpfehlung = (empfohlen) => {
    const sysMsg = empfohlen
      ? { from: "system", text: `✅ Du hast ${chat.wirker} weiterempfohlen. Die Empfehlung wird in ihrem Profil veröffentlicht. Das Geld (${chat.betrag}) wurde freigegeben und überwiesen. Chat wird archiviert.`, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), isDone: true }
      : { from: "system", text: `⚠️ Dein Feedback wurde vertraulich an HUI-Admin und ${chat.wirker} weitergeleitet. Kein öffentlicher Eintrag. Ein Mitarbeiter meldet sich bei dir.`, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), isWarning: true };
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
        <img src={chat.wirkerImg} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} alt={chat.wirker} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{chat.wirker}</div>
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
              {!isMe && <img src={chat.wirkerImg} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", marginRight: 8, marginTop: 2, flexShrink: 0 }} alt="" />}
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

      {/* Empfehlungs-Prompt */}
      {showEmpfehlung && (
        <div style={{ background: "white", borderTop: `2px solid ${GOLD}50`, padding: "16px 16px 8px", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 4 }}>📦 Alles angekommen?</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12, lineHeight: 1.55 }}>
            Bitte gib eine kurze Empfehlung ab. Das entscheidet über die Freigabe des Geldes an {chat.wirker}.
          </div>
          <textarea value={empfehlungText} onChange={e => setEmpfehlungText(e.target.value)} placeholder="Optional: Was hat dich begeistert oder enttäuscht?" rows={2}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 13, resize: "none", fontFamily: "inherit", marginBottom: 10, outline: "none" }} />
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <button onClick={() => handleEmpfehlung(true)} style={{ flex: 1, background: `linear-gradient(135deg, ${TEAL}, #10b981)`, color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              👍 Weiterempfehlen
            </button>
            <button onClick={() => handleEmpfehlung(false)} style={{ flex: 1, background: "#f5f5f3", color: "#888", border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              👎 Nicht empfehlen
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
        <div style={{ background: "white", padding: "10px 16px 24px", borderTop: "1px solid #f0f0f0", flexShrink: 0, display: "flex", gap: 10, alignItems: "flex-end" }}>
          <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Nachricht schreiben..."
            style={{ flex: 1, padding: "11px 16px", borderRadius: 24, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", background: "#f9f9f7" }} />
          <button onClick={sendMessage} disabled={!message.trim()} style={{ width: 42, height: 42, borderRadius: "50%", background: message.trim() ? CORAL : "#e8e8e8", border: "none", cursor: message.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={17} color={message.trim() ? "white" : "#bbb"} />
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CREATE SHEET — Plus-Button Aktionen
// ══════════════════════════════════════════════════════════════════
function CreateSheet({ onClose, onNewWerk, onNewStory, isNewUser }) {
  const options = [
    {
      icon: "🎁", label: "Neues Werk veröffentlichen",
      sub: "Foto, Produkt oder digitales Angebot", color: CORAL,
      action: onNewWerk
    },
    ...(!isNewUser ? [{
      icon: "📖", label: "Story teilen",
      sub: "Zeig was du gerade machst oder erlebt hast", color: GOLD,
      action: onNewStory
    }] : []),

  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "20px 20px 36px" }}>
        {/* Handle */}
        <div style={{ width: 38, height: 4, borderRadius: 99, background: "#e0e0e0", margin: "0 auto 20px" }} />
        <div style={{ fontWeight: 800, fontSize: 18, color: "#222", marginBottom: 4 }}>Was möchtest du teilen?</div>
        <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Veröffentliche direkt auf HUI</div>
        {options.map((o, i) => (
          <button key={i} onClick={o.action} style={{ width: "100%", background: `${o.color}0d`, border: `1.5px solid ${o.color}25`, borderRadius: 16, padding: "14px 16px", marginBottom: 12, display: "flex", gap: 14, alignItems: "center", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: `${o.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {o.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 2 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: "#999" }}>{o.sub}</div>
            </div>
            <ChevronRight size={17} color="#ddd" />
          </button>
        ))}
        <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "#bbb", fontSize: 14, cursor: "pointer", marginTop: 4, padding: "8px 0" }}>Abbrechen</button>
      </div>
    </div>
  );
}

function WerkCreateModal({ onClose }) {
  const [step, setStep] = useState(1); // 1=Typ, 2=Details, 3=Preis, 4=Danke
  const [form, setForm] = useState({ typ: "", titel: "", beschreibung: "", preis: "", einheit: "Stück", versand: "", bild: null, digital: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const werkTypen = [
    { id: "physisch", icon: "📦", label: "Physisches Werk", sub: "Handgemacht, Kunst, Produkt" },
    { id: "digital", icon: "💻", label: "Digitales Werk", sub: "Datei, Design, Musik, PDF" },
    { id: "service", icon: "🤝", label: "Dienstleistung / Buchbar", sub: "Stunde, Session, Workshop" },
  ];

  if (step === 4) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 24, padding: 32, textAlign: "center", maxWidth: 340, width: "100%" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <div style={{ fontWeight: 800, fontSize: 21, color: "#222", marginBottom: 8 }}>Werk veröffentlicht!</div>
        <div style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>"{form.titel}" ist jetzt auf deinem Profil und im Feed sichtbar.</div>
        <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Super! →</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>🎁 Neues Werk</div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#aaa" /></button>
          </div>
          <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5, marginBottom: 18 }}>
            <div style={{ background: `linear-gradient(90deg, ${CORAL}, ${GOLD})`, height: 5, borderRadius: 99, width: `${(step / 3) * 100}%`, transition: "width 0.3s" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {step === 1 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 14 }}>Was für ein Werk ist es?</div>
              {werkTypen.map(t => (
                <div key={t.id} onClick={() => { set("typ", t.id); set("digital", t.id === "digital"); }} style={{ border: `2px solid ${form.typ === t.id ? CORAL : "#eee"}`, background: form.typ === t.id ? `${CORAL}08` : "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <div><div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{t.label}</div><div style={{ fontSize: 12, color: "#aaa" }}>{t.sub}</div></div>
                  {form.typ === t.id && <Check size={18} color={CORAL} style={{ marginLeft: "auto" }} />}
                </div>
              ))}
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 14 }}>Details zum Werk</div>
              <div style={{ border: "2px dashed #e0e0e0", borderRadius: 14, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 14, cursor: "pointer", background: "#fafaf8" }}>
                <span style={{ fontSize: 28, marginBottom: 6 }}>📷</span>
                <span style={{ fontSize: 13, color: "#aaa" }}>Foto hinzufügen</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5 }}>Titel *</div>
                <input value={form.titel} onChange={e => set("titel", e.target.value)} placeholder="z.B. Handgenähte Leder-Tasche" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5 }}>Beschreibung</div>
                <textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} rows={3} placeholder="Was steckt dahinter? Material, Entstehung, Besonderheiten..." style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit" }} />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 14 }}>Preis & Details</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5 }}>Preis (€) *</div>
                <input value={form.preis} onChange={e => set("preis", e.target.value)} type="number" placeholder="z.B. 49" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
              </div>
              {form.typ === "physisch" && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5 }}>Versandkosten (€)</div>
                  <input value={form.versand} onChange={e => set("versand", e.target.value)} type="number" placeholder="z.B. 4.90 (0 = kostenlos)" style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                </div>
              )}
              {form.preis && (
                <div style={{ background: "#f9f9f7", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "#777" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>Preis</span><span style={{ fontWeight: 700 }}>{parseFloat(form.preis || 0).toFixed(2)} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#aaa" }}>
                    <span>HUI-Provision (15%)</span><span>- {(parseFloat(form.preis || 0) * 0.15).toFixed(2)} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: TEAL, marginBottom: 4 }}>
                    <span>🌱 Impact Pool (3% der Provision)</span><span>- {(parseFloat(form.preis || 0) * 0.15 * 0.03).toFixed(2)} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13, color: "#222", borderTop: "1px solid #eee", paddingTop: 6, marginTop: 6 }}>
                    <span>Du erhältst</span><span style={{ color: CORAL }}>{(parseFloat(form.preis || 0) * 0.85).toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0, display: "flex", gap: 10 }}>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: "#f5f5f3", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#666" }}>← Zurück</button>}
          <button onClick={() => step < 3 ? setStep(s => s + 1) : setStep(4)} disabled={step === 1 && !form.typ || step === 2 && !form.titel || step === 3 && !form.preis}
            style={{ flex: 2, background: (step === 1 && !form.typ) || (step === 2 && !form.titel) || (step === 3 && !form.preis) ? "#e0e0e0" : `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            {step < 3 ? "Weiter →" : "🎁 Jetzt veröffentlichen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoryCreateModal({ onClose }) {
  const [text, setText] = useState("");
  const [published, setPublished] = useState(false);

  if (published) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 24, padding: 32, textAlign: "center", maxWidth: 340, width: "100%" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✨</div>
        <div style={{ fontWeight: 800, fontSize: 21, color: "#222", marginBottom: 8 }}>Story live!</div>
        <div style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>Deine Story ist jetzt im Feed sichtbar und 24h lang im Story-Bar oben.</div>
        <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${GOLD}, ${CORAL})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Super! →</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "20px 20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>📖 Story teilen</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#aaa" /></button>
        </div>
        <div style={{ border: "2px dashed #e0e0e0", borderRadius: 14, height: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 14, cursor: "pointer", background: "#fafaf8" }}>
          <span style={{ fontSize: 28, marginBottom: 6 }}>📷</span>
          <span style={{ fontSize: 13, color: "#aaa" }}>Foto oder Video (optional)</span>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Was bewegst du gerade? Ein Einblick hinter die Kulissen, eine neue Idee, ein fertiges Werk..." style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1.5px solid #e8e8e8", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit", marginBottom: 14 }} />
        <div style={{ background: `${GOLD}0d`, borderRadius: 12, padding: "9px 13px", fontSize: 12, color: "#888", marginBottom: 16 }}>
          ⏱ Stories sind <strong>24 Stunden</strong> sichtbar und erscheinen oben im Story-Bar deiner Follower.
        </div>
        <button onClick={() => text.trim() && setPublished(true)} disabled={!text.trim()} style={{ width: "100%", background: text.trim() ? `linear-gradient(135deg, ${GOLD}, ${CORAL})` : "#e0e0e0", color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: text.trim() ? "pointer" : "default" }}>
          ✨ Story veröffentlichen
        </button>
      </div>
    </div>
  );
}

function CartOverlay({ cart, onClose, onRemove }) {
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: 20, width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><ShoppingBasket size={20} color={CORAL} /><span style={{ fontWeight: 800, fontSize: 19 }}>Mein Werkekorb</span></div><button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#555" /></button></div>
        {cart.length === 0 ? (<div style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ fontSize: 56, marginBottom: 12 }}>🧺</div><div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: "#333" }}>Dein Werkekorb ist noch leer</div><div style={{ color: "#999", marginBottom: 20, fontSize: 13 }}>Entdecke wundervolle Werke und Talente</div><button onClick={onClose} style={{ background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Jetzt entdecken</button></div>) : (<>{cart.map((item, i) => (<div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, background: "#fafaf8", borderRadius: 12, padding: 10 }}><img src={item.img} style={{ width: 66, height: 66, borderRadius: 10, objectFit: "cover" }} alt={item.title} /><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div><div style={{ fontSize: 12, color: "#999", marginBottom: 3 }}>{item.creator}</div><div style={{ fontWeight: 700, color: CORAL }}>{item.price}</div></div><button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc" }}><X size={16} /></button></div>))}<div style={{ borderTop: "1px solid #eee", paddingTop: 14 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#999", marginBottom: 4 }}><span>Zwischensumme</span><span>{total.toFixed(2)} €</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 12 }}><span>🌱 3% der Provision → Impact Pool</span><span>{(total * 0.15 * 0.03).toFixed(2)} €</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, marginBottom: 16 }}><span>Gesamt</span><span>{total.toFixed(2)} €</span></div><div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}20`, borderRadius: 12, padding: "9px 12px", marginBottom: 10, fontSize: 12, color: "#555" }}>
              💬 Nach dem Kauf öffnet sich ein Chat mit dem Talent. Geld wird sicher im Treuhand verwahrt.
            </div>
            <button style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Jetzt bezahlen & Chat öffnen</button></div></>)}
      </div>
    </div>
  );
}
function OnboardingOverlay({ step, setStep, onClose }) {
  const screens = [{ img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop", title: "Willkommen bei HUI", sub: "Ein Ort, an dem echte Talente, echte Menschen und echte Veränderung zusammenkommen." }, { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop", title: "Hier leben echte Geschichten.", sub: "Menschen mit besonderen Talenten schaffen Werke mit Herz – und du kannst Teil davon sein." }, { img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop", title: "Jede Entscheidung wirkt weiter.", sub: "Mit jeder Buchung fließen automatisch 3 % in Projekte, die Menschen, Tieren und der Natur wirklich helfen." }, { img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", title: "Bereit, Teil von etwas Größerem zu werden?", sub: "" }];
  const s = screens[step];
  return (<div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000", display: "flex", flexDirection: "column" }}><img src={s.img} style={{ width: "100%", height: "55%", objectFit: "cover", opacity: 0.85 }} alt="" /><div style={{ flex: 1, background: "white", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "26px 24px 36px", display: "flex", flexDirection: "column" }}><div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 }}>{screens.map((_, i) => <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i === step ? CORAL : "#e0e0e0", transition: "all 0.3s" }} />)}</div><div style={{ fontWeight: 800, fontSize: 22, color: "#222", textAlign: "center", marginBottom: 10 }}>{s.title}</div>{step === 0 && <div style={{ display: "flex", justifyContent: "center", margin: "-8px 0 12px" }}><img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 64, height: 64, borderRadius: 18, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} /></div>}{s.sub && <div style={{ color: "#888", fontSize: 14, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>{s.sub}</div>}<div style={{ flex: 1 }} />{step < 3 ? <button onClick={() => setStep(step + 1)} style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Weiter →</button> : <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Jetzt loslegen ✨</button>}{step < 3 && <button onClick={onClose} style={{ background: "none", border: "none", color: "#ccc", fontSize: 13, cursor: "pointer", marginTop: 10, textAlign: "center" }}>Überspringen</button>}</div></div>);
}
// ══════════════════════════════════════════════════════════════════
// PROJEKT VORSCHLAGEN – Formular (Overlay)
// ══════════════════════════════════════════════════════════════════
function ProjektVorschlagenPage({ onClose }) {
  const [step, setStep] = useState(1); // 1=Kategorie, 2=Details, 3=Zahlen, 4=Kontakt, 5=Danke
  const [form, setForm] = useState({
    kategorie: "", name: "", kurzbeschreibung: "", ziel: "", wirkung: "",
    zielgruppe: "", standort: "", budgetZiel: "", laufzeit: "",
    organisation: "", ansprechpartner: "", email: "", website: "",
    bilder: null, einverstanden: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const kategorien = [
    { icon: "🌳", label: "Natur & Umwelt", color: "#2ABFAC" },
    { icon: "👶", label: "Kinder & Bildung", color: "#F5A623" },
    { icon: "🐾", label: "Tierschutz", color: "#FF6B5B" },
    { icon: "🏘️", label: "Soziales & Gemeinschaft", color: "#7C3AED" },
    { icon: "💊", label: "Gesundheit", color: "#EC4899" },
    { icon: "🌍", label: "Entwicklungshilfe", color: "#059669" },
    { icon: "🎨", label: "Kunst & Kultur", color: "#D97706" },
    { icon: "♻️", label: "Nachhaltigkeit", color: "#2563EB" },
  ];

  const Input = ({ label, value, onChange, placeholder, multiline, type = "text" }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", color: "#222", lineHeight: 1.5 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", color: "#222" }} />
      }
    </div>
  );

  const stepValid = () => {
    if (step === 1) return form.kategorie !== "";
    if (step === 2) return form.name.length > 3 && form.kurzbeschreibung.length > 10 && form.ziel.length > 10;
    if (step === 3) return form.budgetZiel !== "" && form.laufzeit !== "";
    if (step === 4) return form.ansprechpartner.length > 2 && form.email.includes("@") && form.einverstanden;
    return true;
  };

  // DANKE
  if (step === 5) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}22, ${GOLD}22)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 46 }}>🌱</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 24, color: "#222", textAlign: "center", marginBottom: 12 }}>Danke für deinen Vorschlag!</div>
      <div style={{ fontSize: 15, color: "#666", textAlign: "center", lineHeight: 1.7, marginBottom: 24 }}>
        Wir prüfen deinen Vorschlag sorgfältig. Wenn er unsere Kriterien erfüllt, wird er in die Community-Abstimmung aufgenommen. Du erhältst eine Rückmeldung per E-Mail.
      </div>
      <div style={{ background: `linear-gradient(135deg, ${TEAL}12, ${GOLD}10)`, borderRadius: 16, padding: "16px 20px", width: "100%", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 8 }}>So geht's weiter:</div>
        {[
          { icon: "🔍", text: "HUI prüft deinen Vorschlag innerhalb von 5 Werktagen" },
          { icon: "🗳️", text: "Akzeptierte Projekte kommen in die Community-Abstimmung" },
          { icon: "✅", text: "Gewählte Projekte erhalten Zugang zum Impact Pool" },
          { icon: "📊", text: "Du kannst den Fortschritt in der App verfolgen" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{r.icon}</span>
            <span style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
        Zurück zu Impact
      </button>
    </div>
  );

  const stepTitles = ["", "Kategorie wählen", "Projektdetails", "Zahlen & Ziele", "Kontakt & Abschluss"];
  const stepSubs = ["", "Um was geht es?", "Erzähl uns von deinem Projekt", "Was braucht ihr konkret?", "Wer steckt dahinter?"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "white", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={20} color="#444" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#222" }}>{stepTitles[step]}</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>{stepSubs[step]}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#aaa" /></button>
        </div>
        {/* Progress Bar */}
        <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5 }}>
          <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 5, borderRadius: 99, width: `${(step / 4) * 100}%`, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 11, color: "#bbb", marginTop: 4, textAlign: "right" }}>Schritt {step} von 4</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

        {/* ── STEP 1: KATEGORIE ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
              In welchem Bereich soll dein Projekt wirken? Wähle die passende Kategorie aus.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {kategorien.map(k => (
                <button key={k.label} onClick={() => set("kategorie", k.label)} style={{
                  background: form.kategorie === k.label ? `${k.color}18` : "#f9f9f7",
                  border: form.kategorie === k.label ? `2px solid ${k.color}` : "2px solid transparent",
                  borderRadius: 14, padding: "16px 12px", cursor: "pointer", textAlign: "center", transition: "all 0.15s"
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{k.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: form.kategorie === k.label ? k.color : "#555" }}>{k.label}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 2: PROJEKTDETAILS ── */}
        {step === 2 && (
          <>
            <Input label="Projektname" value={form.name} onChange={v => set("name", v)} placeholder="z.B. 100 Bäume für den Stadtwald" />
            <Input label="Kurzbeschreibung" value={form.kurzbeschreibung} onChange={v => set("kurzbeschreibung", v)} placeholder="In 2–3 Sätzen: Was ist euer Projekt?" multiline />
            <Input label="Welches Ziel verfolgt ihr?" value={form.ziel} onChange={v => set("ziel", v)} placeholder="z.B. Wir wollen 500 Familien mit sauberem Trinkwasser versorgen" multiline />
            <Input label="Was verändert sich durch euer Projekt?" value={form.wirkung} onChange={v => set("wirkung", v)} placeholder="Die konkrete Wirkung – was wird besser?" multiline />
            <Input label="Für wen ist das Projekt?" value={form.zielgruppe} onChange={v => set("zielgruppe", v)} placeholder="z.B. Kinder in ländlichen Gebieten Kenias" />
            <Input label="Wo findet das Projekt statt?" value={form.standort} onChange={v => set("standort", v)} placeholder="Stadt, Land oder 'Online/Weltweit'" />
          </>
        )}

        {/* ── STEP 3: ZAHLEN ── */}
        {step === 3 && (
          <>
            <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#666", lineHeight: 1.6 }}>
              💡 Konkrete Zahlen helfen der Community zu verstehen, was ihr braucht und was ihr damit erreicht.
            </div>
            <Input label="Fundraising-Ziel (€)" value={form.budgetZiel} onChange={v => set("budgetZiel", v)} placeholder="z.B. 5000" type="number" />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>Laufzeit des Projekts</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["3 Monate", "6 Monate", "1 Jahr", "Laufend"].map(l => (
                  <button key={l} onClick={() => set("laufzeit", l)} style={{
                    background: form.laufzeit === l ? TEAL : "#f3f3f3",
                    color: form.laufzeit === l ? "white" : "#555",
                    border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer"
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <Input label="Organisation / Initiative" value={form.organisation} onChange={v => set("organisation", v)} placeholder="Name eurer Organisation (oder 'Privatperson')" />
            {form.budgetZiel && (
              <div style={{ background: `${TEAL}10`, borderRadius: 12, padding: "12px 14px", marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: TEAL, marginBottom: 6 }}>Hochrechnung:</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>
                  Bei {parseFloat(form.budgetZiel || 0).toLocaleString("de")} € Ziel und 3% Impact-Anteil:<br />
                  → ca. <strong>{Math.round(parseFloat(form.budgetZiel || 0) / (75 * 0.15 * 0.03)).toLocaleString("de")} Buchungen</strong> (à 75€) auf HUI nötig
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP 4: KONTAKT ── */}
        {step === 4 && (
          <>
            <Input label="Ansprechpartner:in" value={form.ansprechpartner} onChange={v => set("ansprechpartner", v)} placeholder="Vor- und Nachname" />
            <Input label="E-Mail" value={form.email} onChange={v => set("email", v)} placeholder="deine@email.de" type="email" />
            <Input label="Website (optional)" value={form.website} onChange={v => set("website", v)} placeholder="https://..." />

            <div style={{ background: "#f9f9f7", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 10 }}>📋 Deine Bewerbung im Überblick</div>
              {[
                { label: "Kategorie", val: form.kategorie || "–" },
                { label: "Projektname", val: form.name || "–" },
                { label: "Standort", val: form.standort || "–" },
                { label: "Fundraising-Ziel", val: form.budgetZiel ? `${parseFloat(form.budgetZiel).toLocaleString("de")} €` : "–" },
                { label: "Laufzeit", val: form.laufzeit || "–" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid #f0f0f0", padding: "6px 0" }}>
                  <span style={{ color: "#999" }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>{r.val}</span>
                </div>
              ))}
            </div>

            <div onClick={() => set("einverstanden", !form.einverstanden)} style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.einverstanden ? TEAL : "#ccc"}`, background: form.einverstanden ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                {form.einverstanden && <Check size={13} color="white" />}
              </div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>
                Ich bestätige, dass alle Angaben korrekt sind und stimme der Prüfung durch HUI zu. Ich bin damit einverstanden, dass meine Kontaktdaten für Rückfragen genutzt werden.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Button */}
      <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0" }}>
        <button
          onClick={() => stepValid() && setStep(s => s + 1)}
          style={{
            width: "100%",
            background: stepValid() ? `linear-gradient(135deg, ${TEAL}, ${GOLD})` : "#e0e0e0",
            color: stepValid() ? "white" : "#aaa",
            border: "none", borderRadius: 14, padding: "14px",
            fontWeight: 700, fontSize: 16, cursor: stepValid() ? "pointer" : "default",
            transition: "all 0.2s"
          }}
        >
          {step < 4 ? "Weiter →" : "🌱 Jetzt einreichen"}
        </button>
        {!stepValid() && step > 1 && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 8 }}>Bitte fülle alle Pflichtfelder aus</div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// IMPACT PAGE
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// IMPACT PROJECT DETAIL MODAL
// ══════════════════════════════════════════════════════════════════
function ImpactProjectDetail({ project: p, onClose }) {
  const [tab, setTab] = useState("info"); // info | updates | meilensteine

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "93vh", display: "flex", flexDirection: "column" }}>

        {/* Hero-Bild */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={p.img} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "24px 24px 0 0" }} alt={p.title} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))", borderRadius: "24px 24px 0 0" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={18} color="white" />
          </button>
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 60 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <div style={{ background: GOLD, color: "white", borderRadius: 20, padding: "3px 10px", fontWeight: 700, fontSize: 11 }}>{p.kategorie}</div>
              <div style={{ background: "rgba(255,255,255,0.25)", color: "white", borderRadius: 20, padding: "3px 10px", fontWeight: 600, fontSize: 11 }}>📍 {p.land}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{p.title}</div>
          </div>
        </div>

        {/* Fortschrittsbalken */}
        <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
          <div style={{ background: "#f0f0f0", borderRadius: 99, height: 9, marginBottom: 8 }}>
            <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 9, borderRadius: 99, width: `${p.progress}%`, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 17, color: TEAL }}>{p.collected}</span>
              <span style={{ fontSize: 12, color: "#aaa" }}> von {p.goal}</span>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#aaa" }}>
              <span>👥 {p.unterstuetzer} Unterstützer</span>
              <span>⏱ {p.laufzeit}</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, borderBottom: "2px solid #f0f0f0", marginBottom: 0 }}>
            {[{id:"info",label:"📋 Info"},{id:"meilensteine",label:"🎯 Meilensteine"},{id:"updates",label:"📢 Updates"}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "9px 6px", border: "none", background: "none", cursor: "pointer",
                fontWeight: tab === t.id ? 700 : 500, fontSize: 12,
                color: tab === t.id ? TEAL : "#aaa",
                borderBottom: tab === t.id ? `2.5px solid ${TEAL}` : "2.5px solid transparent",
                marginBottom: -2
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {tab === "info" && (
            <>
              <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 16, whiteSpace: "pre-line" }}>{p.longDesc}</div>
              <div style={{ background: "#f9f9f7", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 10 }}>Über die Organisation</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #eee" }}>
                  <span style={{ color: "#aaa" }}>Organisation</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>{p.organisation}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #eee" }}>
                  <span style={{ color: "#aaa" }}>Gegründet</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>{p.gegründet}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
                  <span style={{ color: "#aaa" }}>Laufzeit</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>{p.laufzeit}</span>
                </div>
              </div>
              <div style={{ background: `${TEAL}0d`, borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#555", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16 }}>🌱</span>
                <span>Dieses Projekt wird durch den <strong>HUI Impact Pool</strong> finanziert – 3% jeder Provision auf der Plattform fließt automatisch hierhin.</span>
              </div>
            </>
          )}

          {tab === "meilensteine" && (
            <div>
              {p.meilensteine.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: m.done ? TEAL : "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {m.done ? <Check size={14} color="white" /> : <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ccc", display: "block" }} />}
                  </div>
                  {i < p.meilensteine.length - 1 && (
                    <div style={{ position: "absolute", marginLeft: 12, marginTop: 27, width: 2, height: 14, background: m.done ? `${TEAL}40` : "#eee" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: m.done ? 700 : 500, fontSize: 14, color: m.done ? "#222" : "#aaa" }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: m.done ? TEAL : "#ccc", marginTop: 2 }}>{m.done ? "✓ Abgeschlossen" : "Ausstehend"}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10, background: "#f9f9f7", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#888" }}>
                {p.meilensteine.filter(m => m.done).length} von {p.meilensteine.length} Meilensteinen erreicht
              </div>
            </div>
          )}

          {tab === "updates" && (
            <div>
              {p.updates.map((u, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, marginBottom: 4 }}>{u.datum}</div>
                  <div style={{ fontSize: 14, color: "#444", lineHeight: 1.65 }}>{u.text}</div>
                </div>
              ))}
              {p.updates.length === 0 && (
                <div style={{ textAlign: "center", color: "#ccc", padding: "30px 0", fontSize: 14 }}>Noch keine Updates vorhanden.</div>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
          <button style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            🌱 Projekt unterstützen
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpactPage() {
  const [showVorschlag, setShowVorschlag] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const projects = [
    {
      title: "Bäume für Kenia", desc: "Wir pflanzen 10.000 Bäume in trockenen Regionen Kenias und schaffen langfristige Lebensgrundlagen für lokale Gemeinschaften.",
      longDesc: "Die Abholzung in Kenia hat in den letzten Jahrzehnten zu Bodenerosion, Wasserknappheit und dem Verlust von Lebensräumen geführt. Unser Projekt arbeitet gemeinsam mit lokalen Gemeinschaften, um einheimische Baumarten zu pflanzen und zu pflegen.\n\nJeder gepflanzte Baum wird 5 Jahre lang betreut. Die Einwohner werden ausgebildet, um die Wälder langfristig selbst zu bewirtschaften. Ziel ist es, nicht nur die Umwelt zu schützen, sondern auch neue Einkommensquellen durch nachhaltige Forstwirtschaft zu schaffen.",
      img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop",
      progress: 47, collected: "2.340 €", goal: "5.000 €", kategorie: "Natur & Umwelt", land: "Kenia", laufzeit: "1 Jahr", stufe: "aktiv",
      organisation: "Green Earth Kenya e.V.", gegründet: "2018", unterstuetzer: 142,
      meilensteine: [
        { label: "Grundstücke gesichert", done: true },
        { label: "4.700 Bäume gepflanzt", done: true },
        { label: "10.000 Bäume gepflanzt", done: false },
        { label: "Pflege-Ausbildung abgeschlossen", done: false },
      ],
      updates: [
        { datum: "März 2026", text: "Die ersten 2.000 Setzlinge wurden erfolgreich eingepflanzt! Dank eurer Spenden." },
        { datum: "Jan 2026", text: "Projektstart und Auswahl der Pflanzflächen in der Rift Valley Region." },
      ]
    },
    {
      title: "Schule für alle", desc: "Bildung für 200 Kinder in ländlichen Gebieten – Schulbau, Materialien und Lehrergehälter für 2 Jahre.",
      longDesc: "In den ländlichen Gebieten Ugandas fehlen grundlegende Bildungseinrichtungen. Viele Kinder müssen stundenlange Fußwege auf sich nehmen oder erhalten gar keine Schulbildung.\n\nMit eurem Beitrag bauen wir ein vollständiges Schulgebäude mit 4 Klassenräumen, einem Lehrerzimmer und sanitären Anlagen. Zusätzlich finanzieren wir Schulmaterial und die Gehälter von 4 qualifizierten Lehrern für die ersten 2 Jahre.",
      img: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=400&fit=crop",
      progress: 73, collected: "7.300 €", goal: "10.000 €", kategorie: "Kinder & Bildung", land: "Uganda", laufzeit: "2 Jahre", stufe: "aktiv",
      organisation: "Bildung Grenzenlos gGmbH", gegründet: "2014", unterstuetzer: 318,
      meilensteine: [
        { label: "Bauplatz genehmigt", done: true },
        { label: "Fundament gelegt", done: true },
        { label: "Rohbau fertiggestellt", done: true },
        { label: "Innenausbau & Eröffnung", done: false },
      ],
      updates: [
        { datum: "Apr 2026", text: "Der Rohbau steht! Nächster Schritt: Fenster, Türen und die Möblierung." },
        { datum: "Feb 2026", text: "Das Fundament wurde erfolgreich gegossen. Ein großer Schritt für die Kinder!" },
      ]
    },
    {
      title: "Tierheim Hamburg", desc: "Renovierung und Erweiterung für 150 Tiere – neue Gehege, Tierarzt-Ausstattung und Pfleger-Ausbildung.",
      longDesc: "Das Tierheim Hamburg-Süd betreut jährlich über 800 Tiere. Das Gebäude aus den 1970er Jahren ist dringend sanierungsbedürftig – Heizungsanlage, Gehege und die medizinische Ausstattung entsprechen nicht mehr modernen Standards.\n\nMit den gesammelten Mitteln renovieren wir 12 Hundegehege, schaffen einen neuen Behandlungsraum für den Tierarzt und schulen das Pfleger-Team in modernen Tierverhaltensmethoden. Jedes gespendete Euro kommt direkt den Tieren zugute.",
      img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
      progress: 28, collected: "1.400 €", goal: "5.000 €", kategorie: "Tierschutz", land: "Deutschland", laufzeit: "6 Monate", stufe: "aktiv",
      organisation: "Tierheim Hamburg-Süd e.V.", gegründet: "1973", unterstuetzer: 87,
      meilensteine: [
        { label: "Finanzierungsplan genehmigt", done: true },
        { label: "Gehege-Renovierung (Phase 1)", done: false },
        { label: "Neuer Behandlungsraum", done: false },
        { label: "Pfleger-Schulungen", done: false },
      ],
      updates: [
        { datum: "Apr 2026", text: "Wir haben die ersten Spendengelder erhalten – danke! Die Planung läuft auf Hochtouren." },
      ]
    },
  ];

  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${TEAL}18, transparent)`, padding: "24px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#222" }}>💚 Impact</div>
          <button onClick={() => setShowVorschlag(true)} style={{ background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, border: "none", borderRadius: 20, padding: "7px 14px", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, boxShadow: `0 3px 12px ${TEAL}44` }}>
            <Plus size={13} /> Projekt vorschlagen
          </button>
        </div>

        {/* Ring */}
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

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "white", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: GOLD }}>47.832 €</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Dieses Jahr</div>
          </div>
          <div style={{ flex: 1, background: "white", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: TEAL }}>3.847 €</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Dieser Monat</div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 8 }}>Gemeinsam haben wir schon so viel bewegt. 🌍</div>
        <div style={{ textAlign: "center", fontSize: 13, color: "#aaa", lineHeight: 1.6, marginBottom: 8 }}>
          3% der Provision (15%) jeder Buchung und jedes Kaufs fließen automatisch in diese Projekte.
        </div>
      </div>

      {/* Aufruf Projekt vorschlagen */}
      <div onClick={() => setShowVorschlag(true)} style={{ margin: "0 16px 20px", background: `linear-gradient(135deg, ${TEAL}15, ${GOLD}10)`, border: `1.5px dashed ${TEAL}60`, borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🌱</span>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 3 }}>Hast du ein Projekt, das die Welt besser macht?</div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>Reiche es ein – die HUI-Community entscheidet, welche Projekte Unterstützung erhalten.</div>
        </div>
        <ChevronRight size={18} color={TEAL} style={{ flexShrink: 0 }} />
      </div>

      {/* Projekte */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 12 }}>Aktuelle Projekte</div>
        {projects.map((p, i) => (
          <div key={i} onClick={() => setSelectedProject(p)} style={{ background: `linear-gradient(160deg, #fffdf0, #fff8e1)`, borderRadius: 16, overflow: "hidden", boxShadow: `0 2px 14px ${GOLD}22`, border: `1px solid ${GOLD}30`, marginBottom: 16, cursor: "pointer" }}>
            <div style={{ position: "relative" }}>
              <img src={p.img} style={{ width: "100%", height: 160, objectFit: "cover" }} alt={p.title} />
              <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                <div style={{ background: GOLD, color: "white", borderRadius: 20, padding: "4px 10px", fontWeight: 700, fontSize: 11 }}>{p.kategorie}</div>
                <div style={{ background: "rgba(0,0,0,0.45)", color: "white", borderRadius: 20, padding: "4px 10px", fontWeight: 600, fontSize: 11 }}>📍 {p.land}</div>
              </div>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 5 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#777", marginBottom: 10, lineHeight: 1.55 }}>{p.desc}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 11, color: "#aaa" }}>
                <span>⏱ {p.laufzeit}</span>
                <span>🎯 Ziel: {p.goal}</span>
              </div>
              <div style={{ background: "#f0f0f0", borderRadius: 99, height: 8, marginBottom: 6 }}>
                <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 8, borderRadius: 99, width: `${p.progress}%`, transition: "width 0.5s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginBottom: 14 }}>
                <span><strong style={{ color: TEAL }}>{p.collected}</strong> gesammelt</span>
                <span style={{ fontWeight: 700, color: GOLD }}>{p.progress}%</span>
              </div>
              <button onClick={e => { e.stopPropagation(); setSelectedProject(p); }} style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                🌱 Mehr erfahren & spenden
              </button>
            </div>
          </div>
        ))}

        {/* Wie es funktioniert */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 14 }}>Wie der Impact Pool funktioniert</div>
          {[
            { icon: "🛒", step: "1", text: "Du buchst oder kaufst etwas auf HUI" },
            { icon: "💰", step: "2", text: "3% der 15% Provision fließen automatisch in den Impact Pool" },
            { icon: "🗳️", step: "3", text: "Die Community stimmt ab, welche Projekte gefördert werden" },
            { icon: "✅", step: "4", text: "Gelder werden monatlich transparent ausgezahlt" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: i < 3 ? 10 : 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 17 }}>{r.icon}</span>
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>

      {showVorschlag && <ProjektVorschlagenPage onClose={() => setShowVorschlag(false)} />}
      {selectedProject && <ImpactProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </div>
  );
}
// Mock-Daten für Favoriten
const mockFavWirker = [
  { id: "w1", name: "Sofia M.", talent: "Keramik-Künstlerin", location: "München",
    img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop",
    recommendations: 34, rate: "45 €/Std.", online: true, nextFree: "Di, 28. Apr" },
  { id: "w2", name: "Marcus B.", talent: "Fotograf & Videograf", location: "Berlin",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    recommendations: 47, rate: "90 €/Std.", online: false, nextFree: "Mo, 27. Apr" },
  { id: "w3", name: "Maria L.", talent: "Yoga-Coach", location: "Zürich",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    recommendations: 93, rate: "70 €/Std.", online: true, nextFree: "Heute" },
];
const mockFavWerke = [
  { id: "p1", title: "Handgemachte Keramik-Tasse", creator: "Sofia M.", price: "38 €",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop",
    creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop" },
  { id: "p2", title: "Aquarell-Portrait", creator: "Lena K.", price: "120 €",
    img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=400&h=400&fit=crop",
    creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop" },
  { id: "p3", title: "Handgenähter Leder-Rucksack", creator: "Tom H.", price: "195 €",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop" },
  { id: "p4", title: "4er-Paket Yoga", creator: "Maria L.", price: "250 €",
    img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=400&fit=crop",
    creatorImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop" },
];
const mockFavImpact = [
  { id: "i1", title: "Bäume für Kenia", emoji: "🌳", tag: "Natur",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop",
    collected: 2340, goal: 5000, backers: 78, daysLeft: 14 },
  { id: "i2", title: "Bildung für Kinder in Nepal", emoji: "📚", tag: "Menschen",
    img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=300&fit=crop",
    collected: 1820, goal: 3000, backers: 54, daysLeft: 7 },
];

function FavoritesPage({ onViewWirker, onBookWirker, onViewWerk, onAddToCart }) {
  const [tab, setTab] = useState("wirker");
  const [favWirker, setFavWirker] = useState(mockFavWirker.map(w => w.id));
  const [favWerke, setFavWerke] = useState(mockFavWerke.map(w => w.id));
  const [favImpact, setFavImpact] = useState(mockFavImpact.map(i => i.id));
  const [addedToCart, setAddedToCart] = useState({});

  const handleAddToCart = (werk) => {
    onAddToCart && onAddToCart(werk);
    setAddedToCart(p => ({ ...p, [werk.id]: true }));
    setTimeout(() => setAddedToCart(p => ({ ...p, [werk.id]: false })), 1800);
  };

  const tabs = [
    { id: "wirker", label: "Wirker", count: favWirker.length, icon: "✨" },
    { id: "werke",  label: "Werke",  count: favWerke.length,  icon: "🎁" },
    { id: "impact", label: "Impact", count: favImpact.length, icon: "🌱" },
  ];

  const EmptyState = ({ icon, label, sub }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 17, color: "#333", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, maxWidth: 260 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 90, background: "#fafaf8", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: "20px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#222" }}>Meine Favoriten</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{favWirker.length + favWerke.length + favImpact.length} gespeicherte Einträge</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${GOLD}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div>
        </div>
        <div style={{ display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t.id ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "9px 0 11px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ fontSize: 13 }}>{t.icon}</span>
                <span style={{ fontWeight: tab === t.id ? 700 : 500, fontSize: 13, color: tab === t.id ? CORAL : "#aaa" }}>{t.label}</span>
                <span style={{ background: tab === t.id ? `${CORAL}18` : "#f0f0ee", color: tab === t.id ? CORAL : "#bbb", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 6px" }}>{t.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TAB: WIRKER */}
      {tab === "wirker" && (
        <div style={{ padding: "10px 0" }}>
          {favWirker.length === 0
            ? <EmptyState icon="✨" label="Noch keine Wirker gespeichert" sub="Tippe auf ⭐ im Profil eines Talents um es hier zu speichern" />
            : mockFavWirker.filter(w => favWirker.includes(w.id)).map(w => (
              <div key={w.id} style={{ background: "white", margin: "0 0 8px", padding: "14px 16px", borderLeft: `4px solid ${TEAL}` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={w.img} style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${TEAL}25` }} alt={w.name} />
                    {w.online && <div style={{ position: "absolute", bottom: 2, right: 2, width: 13, height: 13, borderRadius: "50%", background: "#4CAF50", border: "2px solid white" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{w.name}</span>
                      <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 7px" }}>✓ Talent</span>
                    </div>
                    <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{w.talent}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: "#bbb", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{w.location}</span>
                      <span style={{ fontSize: 11, color: "#bbb" }}>⭐ {w.recommendations}</span>
                      <span style={{ fontSize: 11, color: "#bbb" }}>{w.rate}</span>
                    </div>
                  </div>
                  <button onClick={() => setFavWirker(p => p.filter(id => id !== w.id))}
                    style={{ background: `${GOLD}15`, border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Star size={15} fill={GOLD} color={GOLD} />
                  </button>
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, background: `${TEAL}08`, borderRadius: 10, padding: "7px 10px" }}>
                  <Clock size={13} color={TEAL} />
                  <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>Nächster freier Termin: {w.nextFree}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => onViewWirker && onViewWirker(w.name)}
                    style={{ flex: 1, background: "#f5f5f3", border: "none", borderRadius: 12, padding: "9px 0", fontWeight: 600, fontSize: 13, color: "#444", cursor: "pointer" }}>
                    Profil ansehen
                  </button>
                  <button onClick={() => onBookWirker && onBookWirker(w.name)}
                    style={{ flex: 2, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 12, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Calendar size={13} color="white" /> Termin buchen
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* TAB: WERKE */}
      {tab === "werke" && (
        <div style={{ padding: "10px 0" }}>
          {favWerke.length === 0
            ? <EmptyState icon="🎁" label="Noch keine Werke gespeichert" sub="Tippe auf ⭐ bei einem Werk um es hier zu speichern" />
            : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 12px" }}>
                {mockFavWerke.filter(w => favWerke.includes(w.id)).map(werk => (
                  <div key={werk.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: `0 2px 12px ${CORAL}10`, border: `1px solid ${CORAL}12` }}>
                    <div style={{ position: "relative", cursor: "pointer" }} onClick={() => onViewWerk && onViewWerk(werk.title)}>
                      <img src={werk.img} style={{ width: "100%", height: 130, objectFit: "cover" }} alt={werk.title} />
                      <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.52)", color: "white", borderRadius: 20, padding: "3px 9px", fontWeight: 800, fontSize: 13 }}>{werk.price}</div>
                      <button onClick={e => { e.stopPropagation(); setFavWerke(p => p.filter(id => id !== werk.id)); }}
                        style={{ position: "absolute", top: 7, right: 7, background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Star size={13} fill={GOLD} color={GOLD} />
                      </button>
                    </div>
                    <div style={{ padding: "9px 10px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#222", marginBottom: 4, lineHeight: 1.3 }}>{werk.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                        <img src={werk.creatorImg} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} alt="" />
                        <span style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{werk.creator}</span>
                      </div>
                      <button onClick={() => handleAddToCart(werk)}
                        style={{ width: "100%", background: addedToCart[werk.id] ? TEAL : CORAL, color: "white", border: "none", borderRadius: 10, padding: "7px 0", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "background 0.2s" }}>
                        {addedToCart[werk.id] ? "✓ Im Korb" : "In den Korb"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* TAB: IMPACT */}
      {tab === "impact" && (
        <div style={{ padding: "10px 0" }}>
          {favImpact.length === 0
            ? <EmptyState icon="🌱" label="Noch keine Impact-Projekte gespeichert" sub="Entdecke Projekte die dir am Herzen liegen und speichere sie hier" />
            : mockFavImpact.filter(i => favImpact.includes(i.id)).map(proj => (
              <div key={proj.id} style={{ background: "white", margin: "0 0 8px", overflow: "hidden", borderLeft: `4px solid ${GOLD}` }}>
                <div style={{ position: "relative" }}>
                  <img src={proj.img} style={{ width: "100%", height: 110, objectFit: "cover" }} alt={proj.title} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6))" }} />
                  <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "white" }}>{proj.emoji} {proj.title}</div>
                    <button onClick={() => setFavImpact(p => p.filter(id => id !== proj.id))}
                      style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Star size={13} fill={GOLD} color={GOLD} />
                    </button>
                  </div>
                  <div style={{ position: "absolute", top: 10, left: 14, background: `${GOLD}dd`, color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>{proj.tag}</div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                      <span style={{ fontWeight: 700, color: GOLD }}>{proj.collected.toLocaleString("de-DE")} € gesammelt</span>
                      <span style={{ color: "#bbb" }}>Ziel: {proj.goal.toLocaleString("de-DE")} €</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "#f0f0ee", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${GOLD}, ${CORAL})`, width: `${Math.min((proj.collected / proj.goal) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#aaa", marginBottom: 12 }}>
                    <span>👥 {proj.backers} Unterstützer</span>
                    <span>⏱ noch {proj.daysLeft} Tage</span>
                  </div>
                  <button style={{ width: "100%", background: `linear-gradient(135deg, ${GOLD}, ${CORAL})`, color: "white", border: "none", borderRadius: 12, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    🌱 Jetzt unterstützen
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// TALENT ANBIETEN – Bewerbungsformular
// ══════════════════════════════════════════════════════════════════
function TalentAnbietenPage({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=Typ, 2=Basis, 3=Talent, 4=Angebote, 5=Kontakt, 6=Danke
  const [form, setForm] = useState({
    typ: "",
    // Basis
    vorname: "", nachname: "", anzeigeName: "", standort: "", profilbild: null,
    // Firma/Verein extra
    orgName: "", orgTyp: "", steuernummer: "", website: "",
    // Talent
    kategorie: "", subKategorien: [], kurzbeschreibung: "", skills: "",
    sprachen: [], erfahrung: "",
    // Angebote
    angebotstyp: [], stundensatz: "", mindestbuchung: "1",
    versandMoeglich: false, onlineMoeglich: false, vorOrtMoeglich: false,
    // Kontakt
    email: "", telefon: "", instagram: "",
    einverstanden: false, agb: false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k, v) => setForm(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v] }));

  const anbieterTypen = [
    { id: "privat", icon: "🎨", titel: "Privatperson / Hobby", sub: "Du bietest dein Talent nebenbei an – keine Gewerbe nötig", color: CORAL },
    { id: "selbststaendig", icon: "💼", titel: "Selbstständig / Freiberufler", sub: "Du arbeitest hauptberuflich oder nebenberuflich als Selbstständiger", color: TEAL },
    { id: "verein", icon: "🤝", titel: "Verein / Organisation", sub: "Gemeinnützige Vereine, NGOs, Initiativen", color: GOLD },
    { id: "firma", icon: "🏢", titel: "Unternehmen / Firma", sub: "Gewerblich tätige Unternehmen jeder Größe", color: "#7C3AED" },
  ];

  const kategorien = [
    { icon: "🎨", label: "Kunst & Kreatives" }, { icon: "📷", label: "Foto & Video" },
    { icon: "🎵", label: "Musik & Audio" }, { icon: "✍️", label: "Texte & Sprache" },
    { icon: "💪", label: "Sport & Fitness" }, { icon: "🧘", label: "Wellness & Coaching" },
    { icon: "🍳", label: "Kochen & Backen" }, { icon: "🪴", label: "Garten & Natur" },
    { icon: "🔧", label: "Handwerk & Reparatur" }, { icon: "👗", label: "Mode & Beauty" },
    { icon: "💻", label: "Digitales & Technik" }, { icon: "📚", label: "Bildung & Beratung" },
    { icon: "🎭", label: "Events & Unterhaltung" }, { icon: "🏡", label: "Haus & Haushalt" },
    { icon: "🐾", label: "Tiere" }, { icon: "🌍", label: "Sonstiges" },
  ];

  const sprachenListe = ["Deutsch", "Englisch", "Französisch", "Spanisch", "Italienisch", "Türkisch", "Arabisch", "Russisch", "Polnisch"];

  const Input = ({ label, value, onChange, placeholder, type = "text", hint }) => (
    <div style={{ marginBottom: 15 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", color: "#222" }} />
      {hint && <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>{hint}</div>}
    </div>
  );
  const Textarea = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div style={{ marginBottom: 15 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.55 }} />
    </div>
  );
  const Chip = ({ label, active, onClick, color }) => (
    <button onClick={onClick} style={{ background: active ? (color || TEAL) + "18" : "#f4f4f2", border: `1.5px solid ${active ? (color || TEAL) : "transparent"}`, borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 600, color: active ? (color || TEAL) : "#666", cursor: "pointer", transition: "all 0.15s" }}>{label}</button>
  );

  const selectedTyp = anbieterTypen.find(t => t.id === form.typ);
  const stepValid = () => {
    if (step === 1) return form.typ !== "";
    if (step === 2) return form.vorname.length > 1 && form.nachname.length > 1 && form.standort.length > 2;
    if (step === 3) return form.kategorie !== "" && form.kurzbeschreibung.length > 15;
    if (step === 4) return form.angebotstyp.length > 0;
    if (step === 5) return true; // nicht mehr genutzt
    return true;
  };

  // ── DANKE ──
  if (step === 5) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}20, ${GOLD}20)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <span style={{ fontSize: 52 }}>🎉</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 25, color: "#222", textAlign: "center", marginBottom: 10 }}>Willkommen in der Community!</div>
      <div style={{ fontSize: 15, color: "#666", textAlign: "center", lineHeight: 1.7, marginBottom: 26 }}>
        Deine Bewerbung ist bei uns eingegangen. Wir prüfen dein Profil und melden uns innerhalb von 48 Stunden per E-Mail.
      </div>
      <div style={{ background: `linear-gradient(135deg, ${TEAL}10, ${GOLD}08)`, borderRadius: 18, padding: "18px 20px", width: "100%", marginBottom: 26 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>Das passiert als nächstes:</div>
        {[
          { icon: "🔍", text: "HUI prüft deine Angaben & dein Talent (bis 48h)" },
          { icon: "✅", text: "Du erhältst eine Bestätigungs-Mail mit Login-Zugang" },
          { icon: "📸", text: "Du vervollständigst dein Profil mit Fotos & Beschreibung" },
          { icon: "🚀", text: "Dein Profil geht live – Kunden können dich buchen!" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 3 ? 10 : 0, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>{r.icon}</span>
            <span style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { onSuccess && onSuccess(); onClose(); }} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
        Zurück zum Profil
      </button>
    </div>
  );

  const stepTitles = ["", "Wer bist du?", "Deine Basis-Infos", "Dein Talent", "Deine Angebote"];
  const stepSubs = ["", "Wie bietest du dein Talent an?", "Erzähl uns von dir", "Was kannst du besonders gut?", "Was bietest du konkret an?"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "white", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 10px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={20} color="#444" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#222" }}>{stepTitles[step]}</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>{stepSubs[step]}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#bbb" /></button>
        </div>
        <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5 }}>
          <div style={{ background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, height: 5, borderRadius: 99, width: `${((step - 1) / 4) * 100}%`, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 11, color: "#ccc", marginTop: 4, textAlign: "right" }}>Schritt {step} von 4</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>

        {/* ── STEP 1: Anbieter-Typ ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 18, lineHeight: 1.6 }}>
              HUI ist für alle offen — egal ob du dein Hobby teilst oder professionell tätig bist. Wähle die passende Kategorie:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {anbieterTypen.map(t => (
                <button key={t.id} onClick={() => set("typ", t.id)} style={{
                  background: form.typ === t.id ? t.color + "12" : "#f9f9f7",
                  border: `2px solid ${form.typ === t.id ? t.color : "transparent"}`,
                  borderRadius: 16, padding: "16px 18px", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s"
                }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: t.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 26 }}>{t.icon}</span>
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: form.typ === t.id ? t.color : "#222", marginBottom: 3 }}>{t.titel}</div>
                    <div style={{ fontSize: 12, color: "#999", lineHeight: 1.45 }}>{t.sub}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${form.typ === t.id ? t.color : "#ddd"}`, background: form.typ === t.id ? t.color : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.typ === t.id && <Check size={12} color="white" />}
                  </div>
                </button>
              ))}
            </div>
            {form.typ && (
              <div style={{ marginTop: 14, background: selectedTyp?.color + "0d", border: `1px solid ${selectedTyp?.color}30`, borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#666" }}>
                {form.typ === "privat" && "✅ Keine Gewerbeanmeldung nötig. Du kannst sofort starten – bis zu den steuerlichen Freigrenzen ohne Mehrwertsteuer."}
                {form.typ === "selbststaendig" && "✅ Gewerbe oder Freiberufler – wir benötigen deine Steuernummer für die korrekte Abrechnung."}
                {form.typ === "verein" && "✅ Eingetragene Vereine und gemeinnützige Organisationen sind herzlich willkommen. Bitte Vereinsregisternummer bereithalten."}
                {form.typ === "firma" && "✅ Unternehmen aller Größen können ihre Leistungen auf HUI anbieten. Wir benötigen Handelsregisternummer und USt-ID."}
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Basis-Infos ── */}
        {step === 2 && (
          <>
            {(form.typ === "firma" || form.typ === "verein") && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>
                  {form.typ === "firma" ? "🏢 Firmen-Infos" : "🤝 Organisations-Infos"}
                </div>
                <Input label={form.typ === "firma" ? "Firmenname" : "Name der Organisation"} value={form.orgName} onChange={v => set("orgName", v)} placeholder={form.typ === "firma" ? "Musterfirma GmbH" : "FC Beispiel e.V."} />
                <Input label={form.typ === "firma" ? "Handelsregister / USt-ID (optional)" : "Vereinsregisternummer (optional)"} value={form.steuernummer} onChange={v => set("steuernummer", v)} placeholder={form.typ === "firma" ? "DE123456789" : "VR 12345"} />
                <Input label="Website (optional)" value={form.website} onChange={v => set("website", v)} placeholder="https://..." />
              </div>
            )}

            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>
              👤 Ansprechpartner / Profil-Person
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><Input label="Vorname" value={form.vorname} onChange={v => set("vorname", v)} placeholder="Maria" /></div>
              <div style={{ flex: 1 }}><Input label="Nachname" value={form.nachname} onChange={v => set("nachname", v)} placeholder="Müller" /></div>
            </div>
            <Input label="Anzeigename auf HUI" value={form.anzeigeName} onChange={v => set("anzeigeName", v)} placeholder="z.B. Maria M. oder Yoga mit Maria" hint="So wirst du in der App angezeigt" />
            <Input label="Dein Standort" value={form.standort} onChange={v => set("standort", v)} placeholder="z.B. München, Bayern" />

            <div style={{ marginBottom: 15 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Sprachen</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {sprachenListe.map(s => <Chip key={s} label={s} active={form.sprachen.includes(s)} onClick={() => toggle("sprachen", s)} />)}
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Talent ── */}
        {step === 3 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>Deine Hauptkategorie *</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {kategorien.map(k => (
                  <button key={k.label} onClick={() => set("kategorie", k.label)} style={{
                    background: form.kategorie === k.label ? TEAL + "15" : "#f5f5f3",
                    border: `1.5px solid ${form.kategorie === k.label ? TEAL : "transparent"}`,
                    borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s"
                  }}>
                    <span style={{ fontSize: 18 }}>{k.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: form.kategorie === k.label ? TEAL : "#555" }}>{k.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Textarea label="Kurzbeschreibung deines Talents *" value={form.kurzbeschreibung} onChange={v => set("kurzbeschreibung", v)} placeholder="Beschreibe in 2–4 Sätzen, was du anbietest und was dich besonders macht..." rows={4} />
            <Input label="Deine Top-Skills / Stichworte" value={form.skills} onChange={v => set("skills", v)} placeholder="z.B. Aquarell, Portraitzeichnung, Workshops" hint="Kommagetrennt – hilft bei der Suche" />

            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Erfahrung</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Hobby / Anfänger", "1–3 Jahre", "3–5 Jahre", "5–10 Jahre", "10+ Jahre Profi"].map(e => (
                  <Chip key={e} label={e} active={form.erfahrung === e} onClick={() => set("erfahrung", e)} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── STEP 4: Angebote ── */}
        {step === 4 && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>Was bietest du an? (mehrere möglich) *</div>
              {[
                { id: "buchung", icon: "📅", titel: "Buchbare Dienstleistung", sub: "Kunden buchen Zeitslots bei dir (z.B. Unterricht, Shooting, Coaching)" },
                { id: "werk", icon: "🛍️", titel: "Physische Werke / Produkte", sub: "Du verkaufst handgefertigte Artikel die du versendest" },
                { id: "digital", icon: "📥", titel: "Digitale Produkte", sub: "Downloads, Designs, Fotos, Audio, PDFs etc." },
                { id: "workshop", icon: "🎓", titel: "Workshops & Kurse", sub: "Gruppen-Angebote vor Ort oder online" },
              ].map(a => (
                <button key={a.id} onClick={() => toggle("angebotstyp", a.id)} style={{
                  width: "100%", background: form.angebotstyp.includes(a.id) ? CORAL + "0f" : "#f9f9f7",
                  border: `2px solid ${form.angebotstyp.includes(a.id) ? CORAL : "transparent"}`,
                  borderRadius: 14, padding: "13px 14px", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 8, transition: "all 0.15s"
                }}>
                  <span style={{ fontSize: 24 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: form.angebotstyp.includes(a.id) ? CORAL : "#222" }}>{a.titel}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{a.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${form.angebotstyp.includes(a.id) ? CORAL : "#ddd"}`, background: form.angebotstyp.includes(a.id) ? CORAL : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.angebotstyp.includes(a.id) && <Check size={11} color="white" />}
                  </div>
                </button>
              ))}
            </div>

            {(form.angebotstyp.includes("buchung") || form.angebotstyp.includes("workshop")) && (
              <div style={{ marginBottom: 16 }}>
                <Input label="Dein Stundensatz (€) (optional)" value={form.stundensatz} onChange={v => set("stundensatz", v)} placeholder="z.B. 60" type="number" hint="Kann später noch geändert werden" />
                {form.stundensatz && (
                  <div style={{ background: TEAL + "0d", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#666" }}>
                    Käufer zahlen <strong>{(parseFloat(form.stundensatz) * 1.15).toFixed(0)} €/Std.</strong> — du erhältst <strong style={{ color: TEAL }}>{(parseFloat(form.stundensatz) * 0.85).toFixed(0)} €</strong> nach 15% Provision
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>Wie erreichst du deine Kunden?</div>
              {[
                { key: "vorOrtMoeglich", icon: "📍", label: "Vor Ort / persönlich" },
                { key: "onlineMoeglich", icon: "💻", label: "Online / Remote" },
                { key: "versandMoeglich", icon: "📦", label: "Versand (Werkverkauf)" },
              ].map(opt => (
                <button key={opt.key} onClick={() => set(opt.key, !form[opt.key])} style={{
                  width: "100%", background: form[opt.key] ? TEAL + "0f" : "#f5f5f3",
                  border: `1.5px solid ${form[opt.key] ? TEAL : "transparent"}`,
                  borderRadius: 12, padding: "11px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 8, textAlign: "left"
                }}>
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: form[opt.key] ? TEAL : "#555" }}>{opt.label}</span>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${form[opt.key] ? TEAL : "#ddd"}`, background: form[opt.key] ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {form[opt.key] && <Check size={11} color="white" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}


      </div>

      {/* Bottom Button */}
      <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
        <button
          onClick={() => stepValid() && setStep(s => s + 1)}
          style={{
            width: "100%",
            background: stepValid() ? `linear-gradient(135deg, ${TEAL}, ${GOLD})` : "#e8e8e8",
            color: stepValid() ? "white" : "#bbb",
            border: "none", borderRadius: 14, padding: "14px",
            fontWeight: 700, fontSize: 16,
            cursor: stepValid() ? "pointer" : "default", transition: "all 0.2s"
          }}
        >
          {step < 4 ? "Weiter →" : "🚀 Jetzt bewerben"}
        </button>
        {!stepValid() && step > 1 && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#ccc", marginTop: 7 }}>Bitte alle Pflichtfelder (*) ausfüllen</div>
        )}
      </div>
    </div>
  );
}

function ProfilePage({ isNewUser, onViewOwnWirkerProfile, onTalentAnbieten, onOpenChats }) {
  const [radius, setRadius] = useState(25);
  const [talentAktiv, setTalentAktiv] = useState(true);
  const [showRadiusEditor, setShowRadiusEditor] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // "einstellungen"
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(null); // null = kein Viewer
  const [showStoryCreate, setShowStoryCreate] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(null); // null | "avatar" | "header"
  const [editTab, setEditTab] = useState("basis"); // "basis" | "talent" | "bio"
  const [profileForm, setProfileForm] = useState({
    vorname: "Lars", nachname: "M.", anzeigeName: "Lars M.",
    standort: "München, Deutschland", suchRadius: 50,
    bio: "Ich forme aus Ton Dinge, die bleiben.",
    website: "", instagram: "", kategorie: "Keramik & Töpfern",
    sprachen: ["Deutsch"], erfahrung: "3 Jahre",
    kurzbeschreibung: "Keramik-Künstler aus München – handgemachte Unikate und Workshops.",
  });
  const setP = (k, v) => setProfileForm(f => ({ ...f, [k]: v }));

  const radiusMarks = [5, 10, 25, 50, 100, 250, 9999];

  // ── EINSTELLUNGEN-SUBPAGE ──────────────────────────────────────
  if (activeSection === "einstellungen") return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh", background: "#fafaf8" }}>
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setActiveSection(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ArrowLeft size={20} color="#444" /></button>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Einstellungen</div>
      </div>
      <div style={{ padding: "0 20px" }}>
        {[
          { icon: "👤", label: "Persönliche Daten", sub: "Name, Foto, Standort" },
          { icon: "🔔", label: "Benachrichtigungen", sub: "Push, E-Mail, SMS" },
          { icon: "🔒", label: "Privatsphäre & Sicherheit", sub: "Passwort, 2FA" },
          { icon: "💳", label: "Zahlungsmethoden", sub: "Karte, PayPal, Bankdaten" },
          { icon: "🌙", label: "Erscheinungsbild", sub: "Hell / Dunkel / System" },
          { icon: "📄", label: "Datenschutz", sub: "" },
          { icon: "📋", label: "AGB", sub: "" },
          { icon: "ℹ️", label: "Impressum", sub: "" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#f0f0ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: 11, color: "#aaa" }}>{item.sub}</div>}
            </div>
            <ChevronRight size={15} color="#ddd" />
          </div>
        ))}
        <button style={{ width: "100%", background: "none", border: `1.5px solid ${CORAL}44`, borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 20, color: CORAL }}>
          Abmelden
        </button>
      </div>
    </div>
  );

  // ── HAUPT-PROFIL ───────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh", background: "#fafaf8" }}>

      {/* Header-Bild */}
      <div style={{ position: "relative" }}>
        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=200&fit=crop" style={{ width: "100%", height: 140, objectFit: "cover" }} alt="header" />
        <button onClick={() => setShowImagePicker("header")} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.88)", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, color: "#444", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(4px)" }}>
          <Edit3 size={12} /> Titelbild ändern
        </button>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Avatar + Name */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -32, marginBottom: 14 }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowImagePicker("avatar")}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid white", objectFit: "cover", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }} alt="profile" />
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: "50%", background: CORAL, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Edit3 size={11} color="white" />
            </div>
          </div>
          <button onClick={() => setShowEditProfile(true)} style={{ background: "white", border: "1.5px solid #e0e0e0", borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, color: "#444", cursor: "pointer", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Edit3 size={13} /> Profil bearbeiten
          </button>
        </div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 19, color: "#222", display: "flex", alignItems: "center", gap: 8 }}>
            Lars M.
            {!isNewUser && <span style={{ background: `${TEAL}18`, color: TEAL, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>✓ Talent</span>}
          </div>
          <div style={{ fontSize: 13, color: "#999", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <MapPin size={12} /> München, Deutschland
          </div>
          {!isNewUser && <div style={{ fontSize: 12, color: "#bbb", marginTop: 3 }}>Keramik-Künstler · seit März 2024</div>}
        </div>

        {/* ── STORY-LEISTE (nur für Talente) ───────────────── */}
        {!isNewUser && <div style={{ margin: "12px -16px 8px", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 10, padding: "4px 16px 10px" }}>
            {/* Neue Story erstellen */}
            <button onClick={() => setShowStoryCreate(true)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
              <div style={{ width: 62, height: 62, borderRadius: "50%", border: `2px dashed ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", background: `${CORAL}08`, position: "relative" }}>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", opacity: 0.5 }} alt="" />
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: CORAL, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={12} color="white" strokeWidth={3} />
                </div>
              </div>
              <span style={{ fontSize: 10, color: CORAL, fontWeight: 700 }}>Neu</span>
            </button>

            {/* Eigene Stories */}
            {myOwnStories.map((s, i) => (
              <button key={s.id} onClick={() => setViewingStoryIndex(i)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ width: 62, height: 62, borderRadius: "50%", padding: 2, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, position: "relative" }}>
                  <img src={s.thumbnail} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid white" }} alt={s.label} />
                </div>
                <span style={{ fontSize: 10, color: "#666", maxWidth: 64, textAlign: "center", lineHeight: 1.3 }}>{s.label}</span>
              </button>
            ))}

            {/* Archiv-Eintrag (ausgegraut) */}
            <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", flexShrink: 0, opacity: 0.5 }}>
              <div style={{ width: 62, height: 62, borderRadius: "50%", border: "2px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f3" }}>
                <Archive size={22} color="#bbb" />
              </div>
              <span style={{ fontSize: 10, color: "#bbb" }}>Archiv</span>
            </button>
          </div>
        </div>}

        {/* HUI-Punkte */}
        <div style={{ background: `linear-gradient(135deg, ${GOLD}18, ${CORAL}0d)`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 26 }}>⭐</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: GOLD }}>250 HUI-Punkte</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>= 12,50 € Rabatt verfügbar</div>
            </div>
          </div>
          <ChevronRight size={16} color={GOLD} />
        </div>

        {/* Chats-Button */}
        <button onClick={onOpenChats} style={{ width: "100%", background: "white", border: "1.5px solid #eee", borderRadius: 14, padding: "13px 16px", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${CORAL}12`, display: "flex", alignItems: "center", justifyContent: "center" }}><MessageCircle size={20} color={CORAL} /></div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>Meine Chats</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Buchungen & Treuhand-Status</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ background: GOLD, color: "white", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "2px 7px" }}>1</div>
            <ChevronRight size={16} color="#ddd" />
          </div>
        </button>

        {/* ── NEUER NUTZER: CTA ─────────────────────────────────── */}
        {isNewUser && (
          <div style={ background: `linear-gradient(135deg, ${CORAL}12, ${GOLD}10)`, border: `1.5px solid ${CORAL}25`, borderRadius: 18, padding: "18px 16px", marginBottom: 14 }>
            <div style={ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }>
              <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover" }} />
              <div style={ fontWeight: 800, fontSize: 16, color: "#222" }>Werde Teil der HUI-Community</div>
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 14 }}>
              Biete dein Talent, deine Werke oder Dienstleistungen an – lokal und authentisch. Nur echte Menschen, keine Algorithmen.
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[["🎨", "Kreatives"], ["🔧", "Handwerk"], ["💻", "Digital"], ["🧘", "Wellness"]].map(([e, l]) => (
                <div key={l} style={{ flex: 1, background: "white", borderRadius: 12, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 18 }}>{e}</div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <button onClick={onTalentAnbieten} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              🚀 Jetzt Talent werden
            </button>
          </div>
        )}

        {/* ── TALENT-PROFIL: Stats + Radius + Werke ─────────────── */}
        {!isNewUser && (
          <>
            {/* Stats-Leiste */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              {[["41", "Buchungen"], ["34", "Empfehlungen"], ["218", "Follower"], ["124 €", "Impact"]].map(([v, l]) => (
                <div key={l} style={{ flex: 1, background: "white", borderRadius: 14, padding: "10px 6px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#222" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Talent-Profil bearbeiten Button */}
            <button onClick={onTalentAnbieten}
              style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL}cc)`, color: "white", border: "none", borderRadius: 14, padding: "13px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
              <Edit3 size={16} /> Talent-Profil bearbeiten
            </button>

            {/* Sichtbarkeitsradius – NUR Talent */}
            <div style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", border: `1px solid ${TEAL}18` }}>
              <div style={{ background: `${TEAL}0d`, borderRadius: 10, padding: "7px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>Nur für Talente · Steuert wie weit du in der Suche erscheinst</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin size={17} color={TEAL} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>Sichtbarkeitsradius</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>Wie weit bist du als Talent buchbar?</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: TEAL }}>{radius === 9999 ? "🌍 Weltweit" : `${radius} km`}</div>
                  <button
                    onClick={() => setRadius(radius === 9999 ? 50 : 9999)}
                    title={radius === 9999 ? "Radius einschränken" : "Weltweit stellen"}
                    style={{ width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: radius === 9999 ? TEAL : `${TEAL}18`, transition: "background 0.2s", flexShrink: 0 }}>
                    🌍
                  </button>
                </div>
              </div>
              <input
                type="range" min={0} max={5}
                value={radiusMarks.indexOf(radius) >= 0 ? radiusMarks.indexOf(radius) : 2}
                onChange={e => setRadius(radiusMarks[parseInt(e.target.value)])}
                style={{ width: "100%", accentColor: TEAL, height: 4, marginBottom: 6 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb" }}>
                {radiusMarks.map(r => <span key={r} style={{ fontWeight: r === radius ? 700 : 400, color: r === radius ? TEAL : "#bbb" }}>{r === 9999 ? "🌍" : `${r} km`}</span>)}
              </div>
              <div style={{ background: `${TEAL}0d`, borderRadius: 10, padding: "8px 12px", marginTop: 10, fontSize: 12, color: "#666" }}>
                📍 {radius === 9999 ? "Du bist weltweit für Suchende sichtbar." : <>Du bist für Suchende im Umkreis von <strong>{radius} km</strong> um München sichtbar.</>}
                {radius === 9999 && " · Keine Einschränkung"}
                {radius === 250 && " · Ganz Deutschland"}
                {radius >= 100 && radius < 250 && " · Überregional"}
                {radius < 25 && " · Nur Nachbarschaft"}
              </div>
            </div>

            {/* Talent-Status Toggle */}
            <div style={{ background: "white", borderRadius: 16, padding: "13px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: talentAktiv ? `${CORAL}15` : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 17 }}>{talentAktiv ? "🟢" : "⏸️"}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>Talent aktiv</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{talentAktiv ? "Du bist buchbar & sichtbar" : "Derzeit nicht buchbar"}</div>
                </div>
              </div>
              <div
                onClick={() => setTalentAktiv(v => !v)}
                style={{ width: 48, height: 26, borderRadius: 99, background: talentAktiv ? CORAL : "#ddd", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: talentAktiv ? 24 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
              </div>
            </div>

            {/* Verfügbarkeit */}
            <button onClick={onViewOwnWirkerProfile} style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL}cc)`, color: "white", border: "none", borderRadius: 14, padding: "13px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Calendar size={17} /> Verfügbarkeit & Kalender verwalten
            </button>

            {/* Meine Werke Vorschau */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>Meine Werke</div>
                <span style={{ fontSize: 13, color: CORAL, fontWeight: 600, cursor: "pointer" }}>Alle anzeigen</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
                  "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&h=200&fit=crop",
                  "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&h=200&fit=crop",
                ].map((src, i) => (
                  <div key={i} style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", background: "#f0f0ee" }}>
                    <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  </div>
                ))}
              </div>
            </div>

            {/* Impact */}
            <div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}22`, borderRadius: 16, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>🌱</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>124 € Impact generiert</div>
                <div style={{ fontSize: 12, color: "#888" }}>Durch deine Buchungen fließen 3% in lokale Projekte.</div>
              </div>
            </div>
          </>
        )}

        {/* Einstellungen */}
        <button onClick={() => setActiveSection("einstellungen")} style={{ width: "100%", background: "white", border: "1.5px solid #eee", borderRadius: 14, padding: "13px 16px", cursor: "pointer", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#f0f0ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚙️</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>Einstellungen</div>
          </div>
          <ChevronRight size={15} color="#ddd" />
        </button>

      </div>

      {/* ── BILD-PICKER MODAL (Profilbild & Titelbild) ─────── */}
      {showImagePicker && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }} onClick={() => setShowImagePicker(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "20px 20px 36px" }}>
            {/* Handle */}
            <div style={{ width: 38, height: 4, borderRadius: 99, background: "#e0e0e0", margin: "0 auto 20px" }} />
            <div style={{ fontWeight: 800, fontSize: 18, color: "#222", marginBottom: 4 }}>
              {showImagePicker === "avatar" ? "🤳 Profilbild ändern" : "🖼️ Titelbild ändern"}
            </div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 22 }}>
              {showImagePicker === "avatar" ? "Wähle ein neues Profilbild für dein HUI-Profil" : "Gestalte deinen Profilkopf – sehen alle als erstes"}
            </div>

            {/* Vorschau des aktuellen Bildes */}
            <div style={{ marginBottom: 18, borderRadius: 16, overflow: "hidden", background: "#f0f0ee" }}>
              {showImagePicker === "avatar" ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                  <div style={{ position: "relative" }}>
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: `3px solid ${CORAL}44` }} alt="" />
                    <div style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: CORAL, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                      <Edit3 size={12} color="white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=180&fit=crop" style={{ width: "100%", height: 100, objectFit: "cover" }} alt="" />
              )}
              <div style={{ textAlign: "center", padding: "8px 0 12px", fontSize: 12, color: "#aaa" }}>Aktuelles Bild</div>
            </div>

            {/* Optionen */}
            {[
              { icon: "📷", label: "Kamera öffnen", sub: "Jetzt ein Foto aufnehmen", action: () => setShowImagePicker(null) },
              { icon: "🖼️", label: "Aus Galerie wählen", sub: "Foto von deinem Gerät hochladen", action: () => setShowImagePicker(null) },
              ...(showImagePicker === "header" ? [
                { icon: "🎨", label: "Farbe / Verlauf wählen", sub: "Einfarbig oder Gradient als Hintergrund", action: () => setShowImagePicker(null) },
              ] : []),
              { icon: "🗑️", label: showImagePicker === "avatar" ? "Profilbild entfernen" : "Titelbild entfernen", sub: "Zurück zum Standard", action: () => setShowImagePicker(null), danger: true },
            ].map((o, i) => (
              <button key={i} onClick={o.action}
                style={{ width: "100%", background: o.danger ? `${CORAL}08` : "#f8f8f6", border: `1px solid ${o.danger ? CORAL + "22" : "transparent"}`, borderRadius: 14, padding: "13px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: o.danger ? `${CORAL}15` : "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {o.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: o.danger ? CORAL : "#222" }}>{o.label}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{o.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STORY VIEWER ─────────────────────────────────────── */}
      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={myOwnStories}
          startIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
        />
      )}

      {/* ── STORY ERSTELLEN ────────────────────────────────────── */}
      {showStoryCreate && (
        <StoryCreateFull
          onClose={() => setShowStoryCreate(false)}
          onPublished={() => setShowStoryCreate(false)}
        />
      )}

      {/* ── PROFIL BEARBEITEN MODAL ─────────────────────────────── */}
      {showEditProfile && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Profil bearbeiten</div>
              <button onClick={() => setShowEditProfile(false)} style={{ background: "#f0f0ee", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>

            {/* Profilbild oben */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 20px 12px", flexShrink: 0 }}>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" style={{ width: 78, height: 78, borderRadius: "50%", objectFit: "cover", border: `3px solid ${CORAL}33` }} alt="" />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: CORAL, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", cursor: "pointer" }}>
                  <Edit3 size={11} color="white" />
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#aaa" }}>Tippe um Foto zu ändern</div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", padding: "0 20px", flexShrink: 0 }}>
              {[["basis", "Basis"], ["bio", "Bio & Links"], ...(isNewUser ? [] : [["talent", "Talent"]])].map(([id, label]) => (
                <button key={id} onClick={() => setEditTab(id)}
                  style={{ background: "none", border: "none", borderBottom: editTab === id ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "10px 14px", fontSize: 13, fontWeight: editTab === id ? 700 : 500, color: editTab === id ? CORAL : "#999", cursor: "pointer", marginBottom: -1 }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab-Inhalte */}
            <div style={{ overflowY: "auto", flex: 1, padding: "18px 20px 24px" }}>

              {editTab === "basis" && (
                <div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Vorname</div>
                      <input value={profileForm.vorname} onChange={e => setP("vorname", e.target.value)}
                        style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Nachname</div>
                      <input value={profileForm.nachname} onChange={e => setP("nachname", e.target.value)}
                        style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Anzeigename</div>
                    <input value={profileForm.anzeigeName} onChange={e => setP("anzeigeName", e.target.value)}
                      style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Dieser Name ist für andere sichtbar</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Standort</div>
                    <div style={{ position: "relative" }}>
                      <input value={profileForm.standort} onChange={e => setP("standort", e.target.value)}
                        placeholder="z.B. München oder Maximilianstr. 12, München"
                        style={{ width: "100%", padding: "11px 13px 11px 36px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                      <MapPin size={14} color="#bbb" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Stadt oder Adresse – wird für die Suche verwendet</div>
                  </div>

                  {/* Suchradius – für alle Nutzer (steuert welche Inhalte im Feed & Suche erscheinen) */}
                  <div style={{ marginTop: 16, background: "#f7f7f5", borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>📍 Suchradius</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Zeige mir Inhalte im Umkreis von</div>
                      </div>
                      <div style={{ background: `${CORAL}15`, borderRadius: 20, padding: "4px 12px" }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: CORAL }}>
                          {profileForm.suchRadius >= 200 ? "🌍 Weltweit" : `${profileForm.suchRadius} km`}
                        </span>
                      </div>
                    </div>
                    <input type="range" min={5} max={200} step={5}
                      value={profileForm.suchRadius || 50}
                      onChange={e => setP("suchRadius", Number(e.target.value))}
                      style={{ width: "100%", accentColor: CORAL, cursor: "pointer" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#ccc", marginTop: 3 }}>
                      <span>5 km</span><span>50 km</span><span>100 km</span><span>🌍</span>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, background: `${CORAL}08`, borderRadius: 10, padding: "8px 12px" }}>
                      <MapPin size={13} color={CORAL} />
                      <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
                        Du siehst Talente & Werke aus <strong>{profileForm.standort || "deinem Standort"}</strong> im Umkreis von <strong style={{ color: CORAL }}>{profileForm.suchRadius >= 200 ? "weltweit" : `${profileForm.suchRadius || 50} km`}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Profilbild</div>
                    <button onClick={() => { setShowEditProfile(false); setShowImagePicker("avatar"); }}
                      style={{ width: "100%", background: `${CORAL}0d`, border: `1.5px solid ${CORAL}25`, borderRadius: 12, padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} alt="" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: CORAL }}>Foto ändern</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>Kamera oder Galerie</div>
                      </div>
                      <ChevronRight size={14} color={CORAL} style={{ marginLeft: "auto" }} />
                    </button>
                  </div>
                </div>
              )}

              {editTab === "bio" && (
                <div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Über mich</div>
                    <textarea value={profileForm.bio} onChange={e => setP("bio", e.target.value)} rows={4}
                      placeholder="Beschreibe dich in ein paar Sätzen..."
                      style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
                    <div style={{ fontSize: 11, color: profileForm.bio.length > 280 ? CORAL : "#bbb", marginTop: 3, textAlign: "right" }}>{profileForm.bio.length}/300</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Website</div>
                    <input value={profileForm.website} onChange={e => setP("website", e.target.value)}
                      placeholder="https://meineseite.de"
                      style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Instagram</div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#bbb" }}>@</span>
                      <input value={profileForm.instagram} onChange={e => setP("instagram", e.target.value)}
                        placeholder="dein_handle"
                        style={{ width: "100%", padding: "11px 13px 11px 28px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Sprachen</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["Deutsch", "Englisch", "Französisch", "Spanisch", "Türkisch", "Arabisch"].map(lang => {
                        const active = profileForm.sprachen.includes(lang);
                        return (
                          <button key={lang} onClick={() => setP("sprachen", active ? profileForm.sprachen.filter(l => l !== lang) : [...profileForm.sprachen, lang])}
                            style={{ background: active ? `${TEAL}18` : "#f4f4f2", border: `1.5px solid ${active ? TEAL : "transparent"}`, borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 600, color: active ? TEAL : "#666", cursor: "pointer" }}>
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {editTab === "talent" && !isNewUser && (
                <div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Kategorie</div>
                    <input value={profileForm.kategorie} onChange={e => setP("kategorie", e.target.value)}
                      style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Kurzvorstellung</div>
                    <textarea value={profileForm.kurzbeschreibung} onChange={e => setP("kurzbeschreibung", e.target.value)} rows={3}
                      placeholder="Was machst du, wie arbeitest du?"
                      style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Erfahrung</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["< 1 Jahr", "1–2 Jahre", "3–5 Jahre", "5–10 Jahre", "10+ Jahre"].map(e => (
                        <button key={e} onClick={() => setP("erfahrung", e)}
                          style={{ background: profileForm.erfahrung === e ? `${CORAL}18` : "#f4f4f2", border: `1.5px solid ${profileForm.erfahrung === e ? CORAL : "transparent"}`, borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 600, color: profileForm.erfahrung === e ? CORAL : "#666", cursor: "pointer" }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Stundensatz (€)</div>
                    <input type="number" defaultValue="45" min="5"
                      style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none" }} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Angebotsform</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[["📍", "Vor Ort"], ["🚗", "Beim Kunden"], ["💻", "Online"]].map(([icon, label]) => (
                        <div key={label} style={{ flex: 1, minWidth: 80, background: `${TEAL}12`, border: `1.5px solid ${TEAL}33`, borderRadius: 12, padding: "10px 8px", textAlign: "center", cursor: "pointer" }}>
                          <div style={{ fontSize: 20 }}>{icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: TEAL, marginTop: 4 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Speichern-Button */}
            <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
              <button onClick={() => setShowEditProfile(false)}
                style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                ✓ Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
function TabBar({ page, setPage, setShowOnboarding, setOnboardingStep, isNewUser, onPlusClick }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 0 18px", zIndex: 200, boxShadow: "0 -2px 16px rgba(0,0,0,0.07)" }}>
      <TabButton label="Home" icon={<Home size={20} />} active={page === "home"} onClick={() => setPage("home")} />
      <TabButton label="Impact" icon={<Leaf size={20} />} active={page === "impact"} onClick={() => setPage("impact")} />
      {isNewUser ? (
        <button onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: -18 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", boxShadow: `0 4px 18px ${GOLD}66`, animation: "huiPulse 2.4s ease-in-out infinite" }}><img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <span style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 0.3 }}>Entdecke HUI</span>
        </button>
      ) : (
        <button onClick={onPlusClick} style={{ width: 54, height: 54, borderRadius: "50%", background: CORAL, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: -18, boxShadow: `0 4px 16px ${CORAL}66` }}><Plus size={26} color="white" strokeWidth={2.5} /></button>
      )}
      <TabButton label="Favoriten" icon={<Star size={20} />} active={page === "favorites"} onClick={() => setPage("favorites")} />
      <TabButton label="Profil" icon={<User size={20} />} active={page === "profile"} onClick={() => setPage("profile")} />
    </div>
  );
}
function TabButton({ label, icon, active, onClick }) {
  return (<button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? CORAL : "#AABBB8", fontWeight: active ? 700 : 400, fontSize: 10, minWidth: 52 }}><span style={{ color: active ? CORAL : "#AABBB8" }}>{icon}</span>{label}</button>);
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [detailView, setDetailView] = useState(null);
  const [liked, setLiked] = useState({});
  const [faved, setFaved] = useState({});
  const [cart, setCart] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const isNewUser = false; // false = Talent-Modus (Demo)
  const [showTalentAnbieten, setShowTalentAnbieten] = useState(false);
  const [openChat, setOpenChat] = useState(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showWerkCreate, setShowWerkCreate] = useState(false);
  const [showStoryCreate, setShowStoryCreate] = useState(false);

  const addToCart = (item) => setCart(c => [...c, item]);
  const viewWirker = (name, isOwn = false) => setDetailView({ type: "wirker", id: name, isOwn });
  const bookWirker = (name) => setDetailView({ type: "wirker", id: name, isOwn: false, autoBook: true });
  const viewWerk = (title) => setDetailView({ type: "werk", id: title });
  const goBack = () => setDetailView(null);

  if (detailView?.type === "wirker") return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fafaf8", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <WirkerProfilePage wirkerName={detailView.id} onBack={goBack} onAddToCart={addToCart} isOwnProfile={detailView.isOwn} autoBook={detailView.autoBook} />
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
  if (detailView?.type === "werk") return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fafaf8", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <WerkDetailPage werkTitle={detailView.id} onBack={goBack} onAddToCart={addToCart} onViewWirker={viewWirker} />
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5", fontFamily: "'Inter', -apple-system, sans-serif", position: "relative" }}>
      {page === "home" && (<>
        <AppHeader cartCount={cart.length} onCartClick={() => setShowCart(true)} />
        <SearchBar onClick={() => setShowSearch(true)} />
        <div>
          <StoryBar />
          <div style={{ paddingBottom: 96 }}>
            {mockFeed.map(item => {
              if (item.type === "media") return <MediaCard key={item.id} item={item} liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))} faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))} onViewWirker={viewWirker} isTalentUser={!isNewUser} />;
              if (item.type === "werk") return <WerkCard key={item.id} item={item} liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))} faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))} onAddToCart={addToCart} onViewWerk={viewWerk} onViewWirker={viewWirker} isTalentUser={!isNewUser} />;
              if (item.type === "wirker") return <WirkerCard key={item.id} item={item} onViewWirker={viewWirker} onBookWirker={bookWirker} />;
              if (item.type === "impact") return <ImpactCard key={item.id} item={item} />;
              return null;
            })}
          </div>
        </div>
      </>)}
      {page === "impact" && <ImpactPage />}
      {page === "favorites" && <FavoritesPage onViewWirker={viewWirker} onBookWirker={bookWirker} onViewWerk={viewWerk} onAddToCart={addToCart} />}
      {page === "chats" && !openChat && <ChatListPage onOpenChat={(c) => setOpenChat(c)} onBack={() => setPage("profile")} />}
      {page === "chats" && openChat && <ChatDetailPage chat={openChat} onBack={() => setOpenChat(null)} />}
      {page === "profile" && !openChat && <ProfilePage isNewUser={isNewUser} onViewOwnWirkerProfile={() => viewWirker("Sofia M.", true)} onTalentAnbieten={() => setShowTalentAnbieten(true)} onOpenChats={() => setPage("chats")} />}

      <TabBar page={page} setPage={setPage} isNewUser={isNewUser} setShowOnboarding={setShowOnboarding} setOnboardingStep={setOnboardingStep} onPlusClick={() => setShowCreateSheet(true)} />

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />
      }{showTalentAnbieten && <TalentAnbietenPage onClose={() => setShowTalentAnbieten(false)} onSuccess={() => setShowTalentAnbieten(false)} />}
      {showCreateSheet && (
        <CreateSheet
          isNewUser={isNewUser}
          onClose={() => setShowCreateSheet(false)}
          onNewWerk={() => { setShowCreateSheet(false); setShowWerkCreate(true); }}
          onNewStory={() => { setShowCreateSheet(false); setShowStoryCreate(true); }}
        />
      )}
      {showWerkCreate && <WerkCreateModal onClose={() => setShowWerkCreate(false)} />}
      {showStoryCreate && <StoryCreateModal onClose={() => setShowStoryCreate(false)} />}

      {showCart && <CartOverlay cart={cart} onClose={() => setShowCart(false)} onRemove={i => setCart(c => c.filter((_, idx) => idx !== i))} />}
      {showOnboarding && <OnboardingOverlay step={onboardingStep} setStep={setOnboardingStep} onClose={() => setShowOnboarding(false)} />}

      <style>{`
        @keyframes huiPulse { 0%,100% { box-shadow: 0 4px 16px ${GOLD}55; transform: scale(1); } 50% { box-shadow: 0 6px 26px ${GOLD}99; transform: scale(1.07); } }
        * { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

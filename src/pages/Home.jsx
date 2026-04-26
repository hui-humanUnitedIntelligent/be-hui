import { useState } from "react";
import { Heart, Share2, Star, Search, Plus, ShoppingBasket, Bell, ChevronRight, MapPin, Play, X, Home, Leaf, User, SlidersHorizontal, ChevronDown, ChevronUp, Check, ArrowLeft, Calendar, Clock, Package, Award, Trash2, Edit3 } from "lucide-react";

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
          <div style={{ background: "white", borderRadius: 16, padding: 16 }}>
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
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: CORAL }}>H</span><span style={{ color: CORAL }}>U</span><span style={{ color: CORAL }}>I</span>
          <span style={{ color: TEAL, fontSize: 13, fontWeight: 600, marginLeft: 4 }}>Human United Intelligent</span>
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
function MediaCard({ item, liked, onLike, faved, onFav, onViewWirker }) {
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
    </div>
  );
}
function WerkCard({ item, liked, onLike, faved, onFav, onAddToCart, onViewWerk, onViewWirker }) {
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
function CartOverlay({ cart, onClose, onRemove }) {
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: 20, width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><ShoppingBasket size={20} color={CORAL} /><span style={{ fontWeight: 800, fontSize: 19 }}>Mein Werkekorb</span></div><button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#555" /></button></div>
        {cart.length === 0 ? (<div style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ fontSize: 56, marginBottom: 12 }}>🧺</div><div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: "#333" }}>Dein Werkekorb ist noch leer</div><div style={{ color: "#999", marginBottom: 20, fontSize: 13 }}>Entdecke wundervolle Werke und Talente</div><button onClick={onClose} style={{ background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Jetzt entdecken</button></div>) : (<>{cart.map((item, i) => (<div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, background: "#fafaf8", borderRadius: 12, padding: 10 }}><img src={item.img} style={{ width: 66, height: 66, borderRadius: 10, objectFit: "cover" }} alt={item.title} /><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div><div style={{ fontSize: 12, color: "#999", marginBottom: 3 }}>{item.creator}</div><div style={{ fontWeight: 700, color: CORAL }}>{item.price}</div></div><button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc" }}><X size={16} /></button></div>))}<div style={{ borderTop: "1px solid #eee", paddingTop: 14 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#999", marginBottom: 4 }}><span>Zwischensumme</span><span>{total.toFixed(2)} €</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 12 }}><span>🌱 3% der Provision → Impact Pool</span><span>{(total * 0.15 * 0.03).toFixed(2)} €</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, marginBottom: 16 }}><span>Gesamt</span><span>{total.toFixed(2)} €</span></div><button style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Jetzt bezahlen</button></div></>)}
      </div>
    </div>
  );
}
function OnboardingOverlay({ step, setStep, onClose }) {
  const screens = [{ img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop", title: "Willkommen bei HUI", sub: "Ein Ort, an dem echte Talente, echte Menschen und echte Veränderung zusammenkommen." }, { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop", title: "Hier leben echte Geschichten.", sub: "Menschen mit besonderen Talenten schaffen Werke mit Herz – und du kannst Teil davon sein." }, { img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop", title: "Jede Entscheidung wirkt weiter.", sub: "Mit jeder Buchung fließen automatisch 3 % in Projekte, die Menschen, Tieren und der Natur wirklich helfen." }, { img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", title: "Bereit, Teil von etwas Größerem zu werden?", sub: "" }];
  const s = screens[step];
  return (<div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000", display: "flex", flexDirection: "column" }}><img src={s.img} style={{ width: "100%", height: "55%", objectFit: "cover", opacity: 0.85 }} alt="" /><div style={{ flex: 1, background: "white", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "26px 24px 36px", display: "flex", flexDirection: "column" }}><div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 }}>{screens.map((_, i) => <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i === step ? CORAL : "#e0e0e0", transition: "all 0.3s" }} />)}</div><div style={{ fontWeight: 800, fontSize: 22, color: "#222", textAlign: "center", marginBottom: 10 }}>{s.title}</div>{s.sub && <div style={{ color: "#888", fontSize: 14, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>{s.sub}</div>}<div style={{ flex: 1 }} />{step < 3 ? <button onClick={() => setStep(step + 1)} style={{ width: "100%", background: CORAL, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Weiter →</button> : <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Jetzt loslegen ✨</button>}{step < 3 && <button onClick={onClose} style={{ background: "none", border: "none", color: "#ccc", fontSize: 13, cursor: "pointer", marginTop: 10, textAlign: "center" }}>Überspringen</button>}</div></div>);
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
function ImpactPage() {
  const [showVorschlag, setShowVorschlag] = useState(false);
  const projects = [
    { title: "Bäume für Kenia", desc: "Wir pflanzen 10.000 Bäume in trockenen Regionen Kenias und schaffen langfristige Lebensgrundlagen für lokale Gemeinschaften.", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop", progress: 47, collected: "2.340 €", goal: "5.000 €", kategorie: "Natur & Umwelt", land: "Kenia", laufzeit: "1 Jahr", stufe: "aktiv" },
    { title: "Schule für alle", desc: "Bildung für 200 Kinder in ländlichen Gebieten – Schulbau, Materialien und Lehrergehälter für 2 Jahre.", img: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=300&fit=crop", progress: 73, collected: "7.300 €", goal: "10.000 €", kategorie: "Kinder & Bildung", land: "Uganda", laufzeit: "2 Jahre", stufe: "aktiv" },
    { title: "Tierheim Hamburg", desc: "Renovierung und Erweiterung für 150 Tiere – neue Gehege, Tierarzt-Ausstattung und Pfleger-Ausbildung.", img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=300&fit=crop", progress: 28, collected: "1.400 €", goal: "5.000 €", kategorie: "Tierschutz", land: "Deutschland", laufzeit: "6 Monate", stufe: "aktiv" },
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
          <div key={i} style={{ background: `linear-gradient(160deg, #fffdf0, #fff8e1)`, borderRadius: 16, overflow: "hidden", boxShadow: `0 2px 14px ${GOLD}22`, border: `1px solid ${GOLD}30`, marginBottom: 16 }}>
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
              <button style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                🌱 Jetzt spenden
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
    </div>
  );
}
function FavoritesPage() {
  const [tab, setTab] = useState("wirker");
  return (<div style={{ paddingBottom: 90 }}><div style={{ padding: "20px 16px 0", background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}><div style={{ fontWeight: 800, fontSize: 21, marginBottom: 14, color: "#222" }}>Meine Favoriten</div><div style={{ display: "flex" }}>{["wirker", "werke"].map(t => (<button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "10px 0", fontWeight: tab === t ? 700 : 400, color: tab === t ? CORAL : "#bbb", fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>))}</div></div><div style={{ padding: "40px 20px", textAlign: "center" }}><div style={{ fontSize: 52, marginBottom: 10 }}>⭐</div><div style={{ fontWeight: 700, fontSize: 17, color: "#333", marginBottom: 6 }}>Hier landen deine Lieblings-{tab === "wirker" ? "Wirker" : "Werke"}</div><div style={{ color: "#aaa", marginBottom: 20, fontSize: 13 }}>Tippe auf den ⭐ um etwas zu speichern</div><button style={{ background: CORAL, color: "white", border: "none", borderRadius: 12, padding: "11px 26px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Jetzt entdecken</button></div></div>);
}
function ProfilePage({ isNewUser, onViewOwnWirkerProfile }) {
  return (
    <div style={{ paddingBottom: 90, overflowY: "auto", height: "100vh" }}>
      <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=200&fit=crop" style={{ width: "100%", height: 150, objectFit: "cover" }} alt="header" />
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: -32 }}>
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" style={{ width: 68, height: 68, borderRadius: "50%", border: "3px solid white", objectFit: "cover" }} alt="profile" />
          <div style={{ paddingBottom: 4 }}><div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>Lars M.</div><div style={{ fontSize: 12, color: "#aaa" }}>München, Deutschland</div></div>
        </div>
        <div style={{ marginTop: 14, background: `linear-gradient(135deg, ${GOLD}18, ${CORAL}0d)`, borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>⭐</div>
          <div><div style={{ fontWeight: 800, fontSize: 22, color: GOLD }}>250 HUI-Punkte</div><div style={{ fontSize: 11, color: "#aaa" }}>= 12,50 € Rabatt verfügbar</div></div>
        </div>
        {isNewUser ? (
          <button style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 18 }}>✨ Mein Talent anbieten</button>
        ) : (
          <button onClick={onViewOwnWirkerProfile} style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL}cc)`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Calendar size={18} /> Meine Verfügbarkeit verwalten
          </button>
        )}
        <div style={{ fontWeight: 700, color: "#444", marginBottom: 6, fontSize: 14 }}>Einstellungen</div>
        {["Persönliche Daten", "Push-Benachrichtigungen", "Nacht-Modus", "Impressum", "Datenschutz", "AGB", "Abmelden"].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f0f0f0", color: item === "Abmelden" ? CORAL : "#333", fontWeight: item === "Abmelden" ? 700 : 400, cursor: "pointer", fontSize: 14 }}>
            {item}{item !== "Abmelden" && <ChevronRight size={15} color="#ddd" />}
          </div>
        ))}
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
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, ${CORAL})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 18px ${GOLD}66`, animation: "huiPulse 2.4s ease-in-out infinite" }}><span style={{ fontSize: 24 }}>☀️</span></div>
          <span style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 0.3 }}>Entdecke HUI</span>
        </button>
      ) : (
        <button style={{ width: 54, height: 54, borderRadius: "50%", background: CORAL, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: -18, boxShadow: `0 4px 16px ${CORAL}66` }}><Plus size={26} color="white" strokeWidth={2.5} /></button>
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
  const isNewUser = true;

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
              if (item.type === "media") return <MediaCard key={item.id} item={item} liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))} faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))} onViewWirker={viewWirker} />;
              if (item.type === "werk") return <WerkCard key={item.id} item={item} liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))} faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))} onAddToCart={addToCart} onViewWerk={viewWerk} onViewWirker={viewWirker} />;
              if (item.type === "wirker") return <WirkerCard key={item.id} item={item} onViewWirker={viewWirker} onBookWirker={bookWirker} />;
              if (item.type === "impact") return <ImpactCard key={item.id} item={item} />;
              return null;
            })}
          </div>
        </div>
      </>)}
      {page === "impact" && <ImpactPage />}
      {page === "favorites" && <FavoritesPage />}
      {page === "profile" && <ProfilePage isNewUser={isNewUser} onViewOwnWirkerProfile={() => viewWirker("Sofia M.", true)} />}

      <TabBar page={page} setPage={setPage} isNewUser={isNewUser} setShowOnboarding={setShowOnboarding} setOnboardingStep={setOnboardingStep} />

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      {showCart && <CartOverlay cart={cart} onClose={() => setShowCart(false)} onRemove={i => setCart(c => c.filter((_, idx) => idx !== i))} />}
      {showOnboarding && <OnboardingOverlay step={onboardingStep} setStep={setOnboardingStep} onClose={() => setShowOnboarding(false)} />}

      <style>{`
        @keyframes huiPulse { 0%,100% { box-shadow: 0 4px 16px ${GOLD}55; transform: scale(1); } 50% { box-shadow: 0 6px 26px ${GOLD}99; transform: scale(1.07); } }
        * { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

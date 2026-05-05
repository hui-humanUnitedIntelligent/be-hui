// HUI App v3.0-LIVE
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { HuiPayment, HuiWirker, HuiMessage, HuiImpactProject } from "../lib/entities";
import { Heart, Share2, Star, Search, Plus, ShoppingBasket, Bell, ChevronRight, MapPin, Play, X, Home, Leaf, User, SlidersHorizontal, ChevronDown, ChevronUp, Check, ArrowLeft, Calendar, Clock, Package, Award, Trash2, Edit3, Send, MessageCircle, Archive, ThumbsUp, ThumbsDown, BadgeCheck, ArrowUp, Eye, Settings } from "lucide-react";


class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("HUI CRASH:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: "red", marginBottom: 12 }}>💥 HUI Crash gefangen:</div>
          <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, overflow: "auto", whiteSpace: "pre-wrap" }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, overflow: "auto", whiteSpace: "pre-wrap", marginTop: 8, fontSize: 11 }}>
            {this.state.error?.stack?.slice(0, 800)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

// ─── MISSING HELPER COMPONENTS ──────────────────────────────────────────────

function Section({ id, title, icon, children }) {
  return (
    <div style={{ borderBottom: "1px solid #f5f5f5", padding: "14px 0" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#555", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

function Chip({ label, icon, active, onClick }) {
  const CORAL = "#FF6B5B", TEAL = "#2ABFAC";
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "7px 13px", borderRadius: 20,
      border: active ? `1.5px solid ${CORAL}` : "1.5px solid #e8e8e8",
      background: active ? `${CORAL}12` : "white",
      color: active ? CORAL : "#555",
      fontWeight: active ? 700 : 400,
      fontSize: 13, cursor: "pointer"
    }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

function FinalCard({ cardKey, emoji, label, sub, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: bg || "#f5f5f5", border: `1.5px solid ${color || "#eee"}`,
      borderRadius: 16, padding: "16px 12px",
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 6, cursor: "pointer", width: "100%"
    }}>
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <span style={{ fontWeight: 800, fontSize: 13, color: color || "#222" }}>{label}</span>
      <span style={{ fontSize: 11, color: "#888" }}>{sub}</span>
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", multiline }) {
  const baseStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 12,
    border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none",
    fontFamily: "inherit", background: "#fafaf8", color: "#222"
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 5 }}>{label}</div>}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...baseStyle, resize: "none" }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={baseStyle} />
      }
    </div>
  );
}

function EmptyState({ icon, label, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0 12px", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a" }}>{title}</span>
    </div>
  );
}

function ToggleRow({ label, sub, value, onToggle }) {
  const TEAL = "#2ABFAC";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid #f5f5f5" }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={onToggle} style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? TEAL : "#ddd",
        border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s"
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "white",
          position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s"
        }} />
      </button>
    </div>
  );
}

function MenuRow({ icon, label, sub, color, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 13,
      padding: "14px 0", borderBottom: "1px solid #f5f5f5",
      background: "none", border: "none", cursor: "pointer", textAlign: "left"
    }}>
      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: danger ? "#ef4444" : color || "#222" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{sub}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}



function getWirkerBadge(recommendations) {
  if (recommendations >= 50) return { label: "✨ Community Liebling", color: "#8B5CF6" };
  if (recommendations >= 10) return { label: "🏆 Top Wirker", color: CORAL };
  if (recommendations < 3)   return { label: "🚀 Neu dabei", color: TEAL };
  return null;
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
const mockNotifications = [
  // HEUTE
  {
    id: "n1", type: "buchung", read: false, group: "Heute",
    time: "vor 2 Min.", icon: "📅", color: "#FF6B5B",
    title: "Neue Buchungsanfrage",
    text: "Marcus B. möchte einen Fotoshooting-Termin – Di, 5. Mai um 14:00 Uhr.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    actions: [{ label: "Annehmen", style: "primary" }, { label: "Ablehnen", style: "danger" }],
  },
  {
    id: "n2", type: "treuhand", read: false, group: "Heute",
    time: "vor 45 Min.", icon: "🔓", color: "#F5A623",
    title: "Treuhand freigegeben",
    text: "Sofia M. hat ihre Keramik-Bestellung bestätigt — 75 € wurden dir ausgezahlt.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop",
    actions: [{ label: "Details ansehen", style: "ghost" }],
  },
  {
    id: "n3", type: "empfehlung", read: false, group: "Heute",
    time: "vor 2 Std.", icon: "👍", color: "#2ABFAC",
    title: "Neue Empfehlung erhalten",
    text: "Lena K. hat dich nach dem Töpfer-Workshop weiterempfohlen und einen Kommentar hinterlassen.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    actions: [{ label: "Empfehlung ansehen", style: "ghost" }],
  },
  {
    id: "n4", type: "impact", read: false, group: "Heute",
    time: "vor 3 Std.", icon: "🌱", color: "#10b981",
    title: "Dein Impact wächst",
    text: "Durch deine letzte Buchung flossen 2,25 € in den HUI Impact Pool. Insgesamt hast du schon 47,25 € bewegt! 💚",
    actions: [{ label: "Impact ansehen", style: "ghost" }],
  },
  // GESTERN
  {
    id: "n5", type: "nachricht", read: true, group: "Gestern",
    time: "gestern 18:32", icon: "💬", color: "#8b5cf6",
    title: "Neue Nachricht",
    text: 'Maria L.: "Super, dann sehen wir uns am Montag! Bitte bring bequeme Kleidung mit 🧘"',
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop",
    actions: [{ label: "Antworten", style: "primary" }],
  },
  {
    id: "n6", type: "follower", read: true, group: "Gestern",
    time: "gestern 14:10", icon: "✨", color: "#8b5cf6",
    title: "3 neue Follower",
    text: "Anna K., Tom H. und eine weitere Person folgen jetzt deinem Profil.",
    actions: [{ label: "Profil ansehen", style: "ghost" }],
  },
  {
    id: "n7", type: "abstimmung", read: true, group: "Gestern",
    time: "gestern 10:00", icon: "🗳️", color: "#10b981",
    title: "Impact-Abstimmung läuft!",
    text: 'Noch 4 Tage um dein Herzensprojekt zu wählen. "Schule für alle" liegt gerade vorne.',
    actions: [{ label: "Jetzt abstimmen", style: "primary" }],
  },
  // DIESE WOCHE
  {
    id: "n8", type: "buchung", read: true, group: "Diese Woche",
    time: "vor 3 Tagen", icon: "✅", color: "#FF6B5B",
    title: "Buchung abgeschlossen",
    text: "Dein Yoga-Workshop mit Maria L. am 30. April ist abgeschlossen. Bitte gib eine Empfehlung ab!",
    actions: [{ label: "Empfehlung abgeben", style: "primary" }],
  },
  {
    id: "n9", type: "system", read: true, group: "Diese Woche",
    time: "vor 4 Tagen", icon: "🏆", color: "#F5A623",
    title: "Badge freigeschaltet",
    text: 'Du hast das Badge "Top Wirker" erreicht — 10 Empfehlungen erhalten. Herzlichen Glückwunsch!',
    actions: [],
  },
  {
    id: "n10", type: "empfehlung", read: true, group: "Diese Woche",
    time: "vor 5 Tagen", icon: "👍", color: "#2ABFAC",
    title: "Empfehlung auf deinem Profil",
    text: "Jan W. hat nach seinem Musik-Workshop eine Empfehlung mit Foto hinterlassen.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    actions: [{ label: "Ansehen", style: "ghost" }],
  },
];

// ─── HUI-PUNKTE DATEN ────────────────────────────────────────────────────────
const huiPunkteVerlauf = [
  { id: 1, type: "gewonnen", icon: "📅", label: "Buchung abgeschlossen", sub: "Yoga-Workshop mit Maria L.", punkte: +50, datum: "Heute" },
  { id: 2, type: "gewonnen", icon: "👍", label: "Empfehlung abgegeben", sub: "Nach Keramik-Bestellung", punkte: +20, datum: "Gestern" },
  { id: 3, type: "eingeloest", icon: "🎁", label: "Eingelöst", sub: "5 € Rabatt auf Buchung", punkte: -100, datum: "vor 3 Tagen" },
  { id: 4, type: "gewonnen", icon: "🌱", label: "Impact-Projekt unterstützt", sub: "Stadtgarten München", punkte: +30, datum: "vor 4 Tagen" },
  { id: 5, type: "gewonnen", icon: "✨", label: "Profil vervollständigt", sub: "100% Profil-Completion", punkte: +100, datum: "vor 1 Woche" },
  { id: 6, type: "gewonnen", icon: "👥", label: "Freund eingeladen", sub: "Max M. hat sich registriert", punkte: +75, datum: "vor 2 Wochen" },
  { id: 7, type: "gewonnen", icon: "🛒", label: "Erstes Werk gekauft", sub: "Aquarell-Bild von Lena K.", punkte: +25, datum: "vor 2 Wochen" },
];

const huiPraemien = [
  { icon: "💸", label: "5 € Rabatt", sub: "Auf nächste Buchung oder Kauf", kosten: 100, verfuegbar: true },
  { icon: "💸", label: "10 € Rabatt", sub: "Auf nächste Buchung oder Kauf", kosten: 200, verfuegbar: true },
  { icon: "🎟", label: "Gratis Buchung", sub: "Bis 30 € — einmalig einlösbar", kosten: 600, verfuegbar: false },
  { icon: "⭐", label: "Wirker-Boost", sub: "Dein Profil 7 Tage ganz oben", kosten: 400, verfuegbar: false },
  { icon: "🌱", label: "Impact-Spende", sub: "50 Punkte → 2,50 € in Impact Pool", kosten: 50, verfuegbar: true },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────
const shareItem = (title, type = "Inhalt") => {
  const text = `Schau dir das an auf HUI: "${title}"`;
  if (navigator.share) {
    navigator.share({ title: `HUI – ${title}`, text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text + " " + window.location.href);
    alert("Link kopiert! ✓");
  }
};
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
  "Lars M.": {
    name: "Lars M.", fullName: "Lars Müller",
    talent: "Keramik-Künstler",
    location: "München", distance: "0 km",
    hourlyRate: "ab 45 €/h",
    memberSince: "März 2024",
    bookings: 41,
    followers: 218,
    recommendations: 34,
    impactEur: 47.25,
    bio: "Ich forme aus Ton Dinge, die bleiben. Handgemachte Keramik und Workshops – jedes Stück ein Unikat, jeder Workshop ein echtes Erlebnis.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    header: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
    skills: ["Keramik", "Töpfern", "Workshops", "Handgemacht", "Unikate"],
    werke: [
      { title: "Handgemachte Schale", price: "55 €", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80", likes: 89, type: "Werk" },
      { title: "Keramik-Workshop", price: "75 €/Person", img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80", likes: 64, type: "Dienstleistung" },
      { title: "Tassen-Set (2er)", price: "69 €", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&q=80", likes: 112, type: "Werk" },
    ],
    empfehlungen: [
      { name: "Anna K.", text: "Lars ist ein unglaublich talentierter Keramiker. Der Workshop war das Highlight meines Jahres!", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop" },
      { name: "Marc B.", text: "Die Schale ist ein echtes Kunstwerk. Schnelle Lieferung, tolle Verpackung — sehr empfehlenswert!", datum: "Mär 2026", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop" },
    ],
  },
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
  "Tom H.": {
    name: "Tom H.", fullName: "Tom Hartmann",
    talent: "Leder-Handwerker",
    location: "München", distance: "3 km",
    hourlyRate: "ab 55 €/h",
    memberSince: "Januar 2024",
    bookings: 28,
    followers: 142,
    recommendations: 19,
    impactEur: 28.50,
    bio: "Handgefertigte Lederwaren mit Seele – von der Brieftasche bis zum Rucksack. Jedes Stück entsteht in meinem kleinen Münchner Atelier.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    header: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=300&fit=crop",
    skills: ["Leder", "Handwerk", "Taschen", "Gürtel", "Maßanfertigung"],
    werke: [
      { title: "Leder-Rucksack", price: "195 €", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop", shipping: "6,99 €", likes: 203 },
      { title: "Geldbörse handgenäht", price: "65 €", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop", shipping: "3,99 €", likes: 88 },
    ],
    services: [
      { title: "Leder-Workshop", duration: "3h", price: "165 €/Std.", icon: "🛠" },
      { title: "Maßanfertigung", duration: "flexibel", price: "55 €/Std.", icon: "✂️" },
    ],
    pricePerHour: 55,
  },
  "Lena K.": {
    name: "Lena K.", fullName: "Lena Kraus",
    talent: "Aquarell-Illustratorin",
    location: "München", distance: "5 km",
    hourlyRate: "ab 60 €/h",
    memberSince: "Februar 2024",
    bookings: 35,
    followers: 187,
    recommendations: 27,
    impactEur: 35.00,
    bio: "Ich male mit Aquarell – Portraits, Illustrationen, Buchcover. Farbe ist meine Sprache.",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    header: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&h=300&fit=crop",
    skills: ["Aquarell", "Illustration", "Portrait", "Buchcover", "Digitale Kunst"],
    werke: [
      { title: "Aquarell-Portrait", price: "120 €", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=300&h=300&fit=crop", shipping: "3,99 €", likes: 89 },
      { title: "Buchcover-Illustration", price: "180 €", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=300&fit=crop", shipping: "0 €", likes: 156 },
    ],
    services: [
      { title: "Illustration-Auftrag", duration: "2h", price: "120 €/Std.", icon: "🎨" },
      { title: "Portrait-Session", duration: "1,5h", price: "60 €/Std.", icon: "🖌" },
    ],
    pricePerHour: 60,
  }
};

const mockWerkDetails = {
  "Handgemachte Keramik-Tasse": { title: "Handgemachte Keramik-Tasse", price: "38 €", creator: "Sofia M.", creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=500&fit=crop", extraImgs: ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&h=200&fit=crop","https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&h=200&fit=crop"], location: "München", likes: 124, category: "Kunst & Kreatives", description: "Eine von Hand gedrehte Keramik-Tasse aus feinstem Steinzeugton. Jede Tasse ist ein Unikat – leicht unterschiedlich in Form, Textur und Glasur.\n\nGröße: ca. 250ml · Höhe: ~9cm", shipping: "4,50 €", deliveryDays: "5–7", tags: ["Handgemacht", "Keramik", "Unikat", "Geschenk"], impactHint: "15% der Provision (0,17 €) fließen in den Impact Pool" },
  "Aquarell-Portrait": { title: "Aquarell-Portrait", price: "120 €", creator: "Lena K.", creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=600&h=500&fit=crop", extraImgs: [], location: "Hamburg", likes: 89, category: "Kunst & Kreatives", description: "Ein handgemaltes Aquarell-Portrait nach deinem Foto. Format: A4 · Lieferzeit: 10–14 Werktage", shipping: "6,00 €", deliveryDays: "10–14", tags: ["Aquarell", "Portrait", "Auftragsarbeit"], impactHint: "15% der Provision (0,54 €) fließen in den Impact Pool" },
  "Handgenähter Leder-Rucksack": { title: "Handgenähter Leder-Rucksack", price: "195 €", creator: "Tom H.", creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=500&fit=crop", extraImgs: [], location: "Wien", likes: 203, category: "Handwerk", description: "Handgefertigter Rucksack aus vegetabil gegerbtem Vollnarbenleder. Maße: 35x28x12cm", shipping: "8,00 €", deliveryDays: "21–28", tags: ["Leder", "Handarbeit", "Nachhaltig"], impactHint: "15% der Provision (0,88 €) fließen in den Impact Pool" },
};

const mockStories = [
  { id: 1, name: "Sofia", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", hasNew: true },
  { id: 2, name: "Marcus", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", hasNew: true },
  { id: 3, name: "Lena", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", hasNew: false },
  { id: 4, name: "Tom", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", hasNew: true },
  { id: 5, name: "Maria", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", hasNew: false },
];

// Alle Wirker für "Ich folge"-Anzeige in ProfilePage
const allWirkerStories = [
  { id: 1, name: "Sofia M.", wirkerKey: "Sofia M.", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop" },
  { id: 2, name: "Marcus B.", wirkerKey: "Marcus B.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" },
  { id: 3, name: "Lena K.", wirkerKey: "Lena K.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop" },
  { id: 4, name: "Tom H.", wirkerKey: "Tom H.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop" },
  { id: 5, name: "Maria L.", wirkerKey: "Maria L.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop" },
  { id: 6, name: "Jan W.", wirkerKey: "Jan W.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop" },
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
  const myName = isTalent ? creator : "Lars M.";  // TODO: pass as prop
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
  { id: 1, type: "media", mediaType: "photo", creator: "Sofia M.", creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", talent: "Keramik-Künstlerin", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop", caption: "Meine neueste Kreation – jede Tasse ist ein Unikat. 🌿 Handgedreht, handglasiert, mit ganzem Herzen gemacht.", likes: 142, location: "München" },
  { id: 2, type: "werk", title: "Handgemachte Keramik-Tasse", creator: "Sofia M.", creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop", price: "38 €", likes: 124, location: "München" },
  { id: 3, type: "wirker", name: "Marcus B.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", talent: "Fotograf & Videograf", recommendations: 47, location: "Berlin" },
  { id: 4, type: "media", mediaType: "video", creator: "Marcus B.", creatorImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", talent: "Fotograf & Videograf", img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=400&fit=crop", caption: "Behind the scenes meines letzten Portrait-Shootings. Licht, Geduld und ein bisschen Magie. 📷", likes: 289, location: "Berlin" },
  { id: 5, type: "werk", title: "Aquarell-Portrait", creator: "Lena K.", creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=600&h=400&fit=crop", price: "120 €", likes: 89, location: "Hamburg" },
  { id: 6, type: "impact", title: "Bäume für Kenia", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop", collected: "2.340 €", goal: "5.000 €", progress: 47 },
  { id: 7, type: "media", mediaType: "photo", creator: "Maria L.", creatorImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", talent: "Yoga & Achtsamkeits-Coach", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=700&fit=crop", caption: "Morgenroutine mit Aussicht. Wer braucht noch einen Grund für früh aufstehen? 🌅 Yoga-Sessions ab 7 Uhr buchbar.", likes: 317, location: "Zürich" },
  { id: 8, type: "werk", title: "Handgenähter Leder-Rucksack", creator: "Tom H.", creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop", price: "195 €", likes: 203, location: "Wien" },
  { id: 9, type: "wirker", name: "Maria L.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop", talent: "Yoga & Achtsamkeits-Coach", recommendations: 93, location: "Zürich" },
  { id: 10, type: "service", title: "1:1 Yoga-Session (60 Min.)", creator: "Maria L.", creatorImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop", price: "75 €/Std.", caption: "Individuelle Yoga-Session für Anfänger & Fortgeschrittene. Komm zu mir nach Zürich oder per Video-Call. 🌅", likes: 58, location: "Zürich" },
  { id: 11, type: "service", title: "Foto-Shooting (2 Std.)", creator: "Marcus B.", creatorImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=400&fit=crop", price: "180 €", caption: "Portrait, Business oder Lifestyle — ich fange deinen Moment ein. Inkl. 20 bearbeiteter Fotos. 📷", likes: 112, location: "Berlin" },
];

// Featured Wirker (Hero-Karte oben im Feed)
const featuredWirker = [
  { id: "f1", name: "Sofia M.", talent: "Keramik-Künstlerin", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop", coverImg: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=300&fit=crop", location: "München", recommendations: 58, rate: "45 €/h", tag: "🔥 Trending" },
  { id: "f2", name: "Marcus B.", talent: "Fotograf & Videograf", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop", coverImg: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=300&fit=crop", location: "Berlin", recommendations: 47, rate: "70 €/h", tag: "✨ Neu" },
  { id: "f3", name: "Maria L.", talent: "Yoga & Achtsamkeit", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop", coverImg: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=300&fit=crop", location: "Zürich", recommendations: 93, rate: "40 €/h", tag: "⭐ Top bewertet" },
];

// Top Werke (horizontale Scroll-Section)
const featuredWerke = [
  { id: "fw1", title: "Keramik-Tasse", creator: "Sofia M.", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=300&fit=crop", price: "38 €", likes: 124 },
  { id: "fw2", title: "Aquarell-Portrait", creator: "Lena K.", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=300&h=300&fit=crop", price: "120 €", likes: 89 },
  { id: "fw3", title: "Leder-Rucksack", creator: "Tom H.", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop", price: "195 €", likes: 203 },
  { id: "fw4", title: "Makramee Deko", creator: "Mia T.", img: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=300&h=300&fit=crop", price: "65 €", likes: 77 },
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
function BookingFlow({ wirker, onClose, onSuccess, returnStep6 }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [confirming, setConfirming] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [locationType, setLocationType] = useState(null); // "kunde" | "talent" | "andere"
  const [locationAddress, setLocationAddress] = useState("");
  const [zahlart, setZahlart] = React.useState("karte");


  // Nach Stripe-Rückkehr: direkt Step 6 zeigen (via returnStep6 prop)
  React.useEffect(() => {
    if (returnStep6) {
      // Buchungsdaten aus localStorage wiederherstellen
      try {
        const lastBooking = JSON.parse(localStorage.getItem("hui_last_booking") || "null");
        if (lastBooking?.selectedDate) setSelectedDate(lastBooking.selectedDate);
        if (lastBooking?.selectedTime) setSelectedTime(lastBooking.selectedTime);
      } catch(e) {}
      setStep(6);
    }
  }, [returnStep6]);
  const availability = defaultAvailability[wirker.name] || {};
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);

  const availableDays = new Set();
  for (let d = 1; d <= daysInMonth; d++) {
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7;
    const wd = WEEKDAYS[wdIdx];
    if (availability[wd]?.length > 0) availableDays.add(d);
  }

  const isPast = (d) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const goTo = (nextStep) => { setStep(nextStep); };

  const handleDayClick = (d) => {
    if (!availableDays.has(d) || isPast(d)) return;
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7;
    setSelectedDate({ year: viewYear, month: viewMonth, day: d, weekday: WEEKDAYS[wdIdx] });
    setSelectedTime(null);
    setTimeout(() => goTo(2), 120);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const amountCents = Math.round(total * 100);
      const res = await fetch('https://michi-6f9abd25.base44.app/functions/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: `${wirker.talent} – 1 Stunde mit ${wirker.fullName}`,
          amountCents,
          itemType: 'buchung',
          wirkerName: wirker.fullName || wirker.name,
          imageUrl: wirker.img,
          successUrl: 'https://be-hui.vercel.app?payment=success',
          cancelUrl: 'https://be-hui.vercel.app',
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        // Booking in Supabase speichern
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('bookings').insert({
              user_id: session.user.id,
              wirker_name: wirker.name || wirker.fullName,
              service: `${wirker.talent} – 1 Stunde`,
              date: selectedDate ? `${selectedDate.day}.${selectedDate.month+1}.${selectedDate.year}` : null,
              time: selectedTime || null,
              location: locationType === "talent" ? wirker.location : (locationAddress || null),
              price_eur: total,
              status: 'pending',
            });
          }
        } catch(e) {}
        try {
          localStorage.setItem("hui_last_booking", JSON.stringify({
            wirkerName: wirker.name,
            wirkerFullName: wirker.fullName || wirker.name,
            wirkerImg: wirker.img,
            itemName: `${wirker.talent} – 1 Stunde mit ${wirker.fullName || wirker.name}`,
            totalEur: data.totalEur,
            impactEur: data.impactEur,
            selectedDate,
            selectedTime,
          }));
        } catch(e) {}
        window.location.href = data.checkoutUrl;
      } else {
        alert('Fehler beim Erstellen der Zahlung: ' + (data.error || 'Unbekannt'));
        setConfirming(false);
      }
    } catch (err) {
      alert('Verbindungsfehler: ' + err.message);
      setConfirming(false);
    }
  };

  const availableSlots = selectedDate ? (availability[selectedDate.weekday] || []) : [];
  const pricePerHour = wirker.pricePerHour || 60;
  const provision = Math.round(pricePerHour * 0.15 * 100) / 100;
  const impact = Math.round(provision * 0.15 * 100) / 100;
  const talentEarns = Math.round((pricePerHour - provision) * 100) / 100;
  const total = pricePerHour;
  const formatDate = (d) => d ? `${WEEKDAY_FULL[WEEKDAYS.indexOf(d.weekday)]}, ${d.day}. ${MONTHS[d.month]} ${d.year}` : "";
  const stepLabels = ["Datum", "Uhrzeit", "Ort", "Zahlung"];
  const stepIcons = ["\u{1F4C5}", "\u{1F550}", "\u{1F4CD}", "\u{1F4B3}"];

  if (step === 6) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 430, margin: "0 auto", overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0.2; } }
        @keyframes successPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      {confetti.map(p => (
        <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color, borderRadius: 2, transform: `rotate(${p.rotation}deg)`, animation: `confettiFall 1.8s ${p.delay}s ease-in forwards`, opacity: 0 }} />
      ))}
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL}88)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: `0 8px 32px ${TEAL}44`, animation: "successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}>
        <span style={{ fontSize: 48 }}>✓</span>
      </div>
      <div style={{ fontWeight: 900, fontSize: 26, color: "#1a1a1a", textAlign: "center", marginBottom: 8, animation: "fadeSlideUp 0.4s 0.3s both" }}>Buchung gesichert! 🎉</div>
      <div style={{ fontSize: 15, color: "#888", textAlign: "center", lineHeight: 1.6, marginBottom: 28, animation: "fadeSlideUp 0.4s 0.4s both" }}>Dein Geld liegt sicher im Treuhand-Konto und wird erst freigegeben, wenn du zufrieden bist.</div>
      <div style={{ width: "100%", background: "#fafaf8", borderRadius: 20, overflow: "hidden", border: "1px solid #f0f0ee", marginBottom: 20, animation: "fadeSlideUp 0.4s 0.5s both" }}>
        <div style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid #f0f0ee" }}>
          <img src={wirker.img} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} alt={wirker.name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{wirker.fullName}</div>
            <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
          </div>
          <div style={{ background: `${TEAL}15`, borderRadius: 10, padding: "4px 10px", fontSize: 11, color: TEAL, fontWeight: 700 }}>Bestätigt</div>
        </div>
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 18 }}>📅</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{formatDate(selectedDate)}</div><div style={{ fontSize: 12, color: "#aaa" }}>Datum</div></div></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 18 }}>🕐</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{selectedTime} Uhr</div><div style={{ fontSize: 12, color: "#aaa" }}>Uhrzeit</div></div></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 18 }}>💶</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{total.toFixed(2)} €</div><div style={{ fontSize: 12, color: "#aaa" }}>Im Treuhand</div></div></div>
          <div style={{ background: `linear-gradient(90deg, ${TEAL}12, ${TEAL}05)`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 16 }}>🌱</span>
            <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{impact.toFixed(2)} € fließen in den Impact Pool — du machst einen Unterschied!</div>
          </div>
        </div>
      </div>
      <div style={{ width: "100%", background: `${CORAL}10`, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 24, display: "flex", gap: 10, alignItems: "center", animation: "fadeSlideUp 0.4s 0.6s both" }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <span>Der Chat mit <strong>{wirker.name}</strong> ist jetzt freigeschaltet. Eine erste Nachricht wurde bereits gesendet.</span>
      </div>
      <button onClick={onSuccess} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 4px 16px ${CORAL}44`, animation: "fadeSlideUp 0.4s 0.7s both" }}>Zum Chat mit {wirker.name} →</button>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#bbb", fontSize: 13, cursor: "pointer", marginTop: 14 }}>Zurück zur Übersicht</button>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ padding: "14px 18px 0", borderBottom: "1px solid #f5f5f3" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={step > 1 ? () => goTo(step - 1) : onClose} style={{ background: "#f5f5f3", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="#444" />
          </button>
          <img src={wirker.img} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}33` }} alt={wirker.name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", lineHeight: 1.2 }}>{wirker.fullName}</div>
            <div style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
          </div>
          <div style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>{Math.min(step,4)}/4</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isActive = step === s;
            const isDone = step > s;
            return (
              <div key={s} style={{ flex: isActive ? 2 : 1, display: "flex", alignItems: "center", gap: 5, background: isDone ? `${TEAL}22` : isActive ? `${CORAL}12` : "#f5f5f3", borderRadius: 30, padding: "7px 12px", transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
                <span style={{ fontSize: 13 }}>{isDone ? "✓" : stepIcons[i]}</span>
                {isActive && <span style={{ fontSize: 12, fontWeight: 700, color: CORAL, whiteSpace: "nowrap" }}>{label}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
        {step === 1 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }} style={{ background: "#f5f5f3", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }} style={{ background: "#f5f5f3", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
              {WEEKDAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#ccc", paddingBottom: 6 }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
              {Array(firstWeekday).fill(null).map((_, i) => <div key={"e"+i} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const d = i + 1;
                const past = isPast(d);
                const avail = availableDays.has(d);
                const isSelected = selectedDate?.day === d && selectedDate?.month === viewMonth && selectedDate?.year === viewYear;
                const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                return (
                  <button key={d} onClick={() => handleDayClick(d)} style={{ aspectRatio: "1", borderRadius: "50%", border: isToday && !isSelected ? `2px solid ${CORAL}55` : "2px solid transparent", cursor: avail && !past ? "pointer" : "default", background: isSelected ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : avail && !past ? `${TEAL}15` : "transparent", color: isSelected ? "white" : past ? "#ddd" : avail ? TEAL : "#ccc", fontWeight: avail && !past ? 800 : 400, fontSize: 14, position: "relative", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: isSelected ? `0 4px 16px ${CORAL}55` : "none", transform: isSelected ? "scale(1.15)" : "scale(1)" }}>
                    {d}
                    {avail && !past && !isSelected && <div style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: TEAL }} />}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 16, fontSize: 12, color: "#aaa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: `${TEAL}33` }} />Verfügbar</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e0e0e0" }} />Nicht verfügbar</div>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${GOLD}12, ${GOLD}06)`, borderRadius: 14, padding: "14px 16px", marginTop: 20, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${GOLD}25` }}>
              <span style={{ fontSize: 24 }}>💶</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>{wirker.hourlyRate}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>inkl. HUI-Provision · davon 15% fließen in Impact-Projekte</div>
              </div>
            </div>
          </>
        )}

        {step === 2 && selectedDate && (
          <>
            <div style={{ background: `linear-gradient(135deg, ${TEAL}12, ${TEAL}06)`, borderRadius: 16, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${TEAL}20` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{selectedDate.day}</div>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.85 }}>{MONTHS[selectedDate.month].slice(0,3).toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{formatDate(selectedDate)}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{availableSlots.length} freie Slots verfügbar</div>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", marginBottom: 14 }}>Wähle deine Uhrzeit:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {availableSlots.map(slot => {
                const isSel = selectedTime === slot;
                return (
                  <button key={slot} onClick={() => setSelectedTime(slot)} style={{ padding: "14px 8px", borderRadius: 16, border: `2px solid ${isSel ? CORAL : "#eee"}`, background: isSel ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "white", color: isSel ? "white" : "#333", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s", boxShadow: isSel ? `0 4px 14px ${CORAL}33` : "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 18 }}>🕐</span>
                    <span>{slot}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>Wo findet es statt?</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Wähle den Treffpunkt für die Buchung.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "talent", emoji: "🏠", label: "Beim Talent", desc: `Bei ${wirker.fullName} (${wirker.location})` },
                { key: "kunde", emoji: "📍", label: "Bei mir zu Hause", desc: "Adresse eingeben" },
                { key: "andere", emoji: "📌", label: "Anderer Ort", desc: "Eigene Adresse angeben" },
              ].map(opt => (
                <div key={opt.key} onClick={() => setLocationType(opt.key)}
                  style={{ borderRadius: 16, border: `2px solid ${locationType === opt.key ? TEAL : "#f0f0ee"}`, background: locationType === opt.key ? `${TEAL}08` : "white", padding: "14px 16px", cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {locationType === opt.key && <span style={{ marginLeft: "auto", color: TEAL, fontSize: 18 }}>✓</span>}
                </div>
              ))}
            </div>
            {(locationType === "kunde" || locationType === "andere") && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 8 }}>
                  {locationType === "kunde" ? "Deine Adresse" : "Adresse des Treffpunkts"}
                </div>
                <textarea
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  placeholder="Straße, Hausnummer, PLZ, Ort"
                  rows={3}
                  style={{ width: "100%", borderRadius: 12, border: "1.5px solid #e0e0de", padding: "12px 14px", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", color: "#1a1a1a" }}
                />
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>Wie möchtest du zahlen?</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Dein Geld liegt sicher im HUI-Treuhand bis du die Leistung bestätigst.</div>

            {/* Zahlungsoptionen */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { key: "karte", emoji: "💳", label: "Kredit- oder Debitkarte", desc: "Visa, Mastercard, Amex" },
                { key: "paypal", emoji: "🅿️", label: "PayPal", desc: "Schnell & bekannt" },
                { key: "sepa", emoji: "🏦", label: "SEPA-Lastschrift", desc: "Direkt vom Bankkonto" },
              ].map(opt => (
                <div key={opt.key} onClick={() => setZahlart(opt.key)}
                  style={{ borderRadius: 16, border: `2px solid ${zahlart === opt.key ? TEAL : "#f0f0ee"}`, background: zahlart === opt.key ? `${TEAL}08` : "white", padding: "14px 16px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 26 }}>{opt.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${zahlart === opt.key ? TEAL : "#ddd"}`, background: zahlart === opt.key ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {zahlart === opt.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Betrag Übersicht */}
            <div style={{ background: "#fafaf8", borderRadius: 16, padding: "14px 18px", border: "1px solid #f0f0ee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#888" }}>1 Std. mit {wirker.fullName || wirker.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{total.toFixed(2)} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: TEAL }}>🌱 davon Impact</span>
                <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{impact.toFixed(2)} €</span>
              </div>
              <div style={{ height: 1, background: "#f0f0ee", marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Gesamt</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: CORAL }}>{total.toFixed(2)} €</span>
              </div>
            </div>

            <div style={{ background: `${TEAL}08`, borderRadius: 14, padding: "12px 16px", marginTop: 16, display: "flex", gap: 10, alignItems: "center", border: `1px solid ${TEAL}15` }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>Zahlung über <strong>Stripe</strong> gesichert. Du wirst weitergeleitet.</div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>Deine Buchung</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Bitte überprüfe alles und bestätige.</div>
            <div style={{ background: "#fafaf8", borderRadius: 18, overflow: "hidden", border: "1px solid #f0f0ee", marginBottom: 16 }}>
              <div style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center", background: `linear-gradient(135deg, ${TEAL}08, white)` }}>
                <img src={wirker.img} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}33` }} alt={wirker.name} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{wirker.fullName}</div>
                  <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>📍 {wirker.location}</div>
                </div>
              </div>
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid #f5f5f3" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>📅 Datum</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{formatDate(selectedDate)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>🕐 Uhrzeit</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{selectedTime} Uhr</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>📍 Treffpunkt</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222", textAlign: "right", maxWidth: "60%" }}>
                    {locationType === "talent" ? wirker.location : locationAddress}
                  </span>
                </div>
                <div style={{ height: 1, background: "#f0f0ee" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>Du zahlst</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: CORAL }}>{total.toFixed(2)} €</span>
                </div>

              </div>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${TEAL}10, ${TEAL}04)`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start", border: `1px solid ${TEAL}20` }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 3 }}>Treuhand-Schutz</div>
                <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>Dein Geld wird erst freigegeben, wenn du die Leistung bestätigt hast. Du bist immer abgesichert.</div>
              </div>
            </div>
            <div style={{ background: `${TEAL}08`, borderRadius: 14, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center", border: `1px solid ${TEAL}15` }}>
              <span style={{ fontSize: 20 }}>🌱</span>
              <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{impact.toFixed(2)} € deiner Buchung fließen in echte Impact-Projekte.</div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "14px 18px 28px", borderTop: "1px solid #f5f5f3", background: "white" }}>
        {step === 1 && <div style={{ textAlign: "center", color: "#bbb", fontSize: 13 }}>Wähle einen grün markierten Tag</div>}
        {step === 2 && (
          <button onClick={() => selectedTime && goTo(3)} disabled={!selectedTime} style={{ width: "100%", background: selectedTime ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "#f0f0ee", color: selectedTime ? "white" : "#bbb", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: selectedTime ? "pointer" : "default", boxShadow: selectedTime ? `0 4px 16px ${CORAL}33` : "none", transition: "all 0.25s" }}>
            Weiter → Treffpunkt wählen
          </button>
        )}
        {step === 3 && (
          <button
            onClick={() => locationType && (locationType === "talent" || locationAddress.trim()) && goTo(4)}
            disabled={!locationType || ((locationType === "kunde" || locationType === "andere") && !locationAddress.trim())}
            style={{ width: "100%", background: (locationType && (locationType === "talent" || locationAddress.trim())) ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "#f0f0ee", color: (locationType && (locationType === "talent" || locationAddress.trim())) ? "white" : "#bbb", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: (locationType && (locationType === "talent" || locationAddress.trim())) ? `0 4px 16px ${CORAL}33` : "none", transition: "all 0.25s" }}>
            Weiter → Zahlung wählen
          </button>
        )}
        {step === 4 && (
          <button onClick={() => goTo(5)} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 4px 16px ${CORAL}33` }}>
            Weiter → Buchung prüfen
          </button>
        )}
        {step === 5 && (
          <div>
            <button onClick={handleConfirm} disabled={confirming} style={{ width: "100%", background: confirming ? "#f0f0ee" : `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: confirming ? "#bbb" : "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: confirming ? "default" : "pointer", boxShadow: confirming ? "none" : `0 4px 16px ${CORAL}33`, transition: "all 0.25s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {confirming ? (<><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #ddd", borderTopColor: CORAL, animation: "spin 0.7s linear infinite" }} />Wird gebucht…</>) : (<>💳 Jetzt verbindlich buchen · {total.toFixed(2)} €</>)}
            </button>
            <style>{"@keyframes heartPop {\n  0%   { transform: scale(1); }\n  40%  { transform: scale(1.45); }\n  70%  { transform: scale(0.9); }\n  100% { transform: scale(1); }\n}\n@keyframes toastIn {\n  from { opacity: 0; transform: translateX(-50%) translateY(20px); }\n  to   { opacity: 1; transform: translateX(-50%) translateY(0); }\n}\n@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 10 }}>🔒 Verschlüsselt · Treuhand-gesichert · Jederzeit stornierbar</div>
          </div>
        )}
      </div>
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
                  <span>🌱 davon Impact Pool (15% der Prov.)</span>
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

function EmpfehlungsBox({ wirkerName, initialCount }) {
  const [voted, setVoted] = useState(null); // null | "yes" | "no"
  const [count, setCount] = useState(initialCount || 0);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleVote = (v) => {
    if (voted) return;
    setVoted(v);
    if (v === "yes") setCount(c => c + 1);
    setShowForm(true);
  };
  const handleSubmit = () => {
    setShowForm(false);
    setSubmitted(true);
  };

  return (
    <div style={{ background: `linear-gradient(135deg, ${TEAL}0d, ${CORAL}08)`, borderRadius: 14, padding: "12px 14px", marginBottom: 12, border: `1px solid ${TEAL}20` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: voted ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <ThumbsUp size={16} color={TEAL} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>{count} Empfehlungen</span>
        </div>
        {!voted && !submitted && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleVote("yes")} style={{ display: "flex", alignItems: "center", gap: 5, background: `${TEAL}18`, border: `1.5px solid ${TEAL}40`, borderRadius: 20, padding: "6px 12px", fontWeight: 700, fontSize: 12, color: TEAL, cursor: "pointer" }}>
              <ThumbsUp size={13} color={TEAL} /> Empfehlen
            </button>
            <button onClick={() => handleVote("no")} style={{ display: "flex", alignItems: "center", gap: 5, background: "#f5f5f5", border: "1.5px solid #ddd", borderRadius: 20, padding: "6px 12px", fontWeight: 700, fontSize: 12, color: "#888", cursor: "pointer" }}>
              <ThumbsDown size={13} color="#aaa" /> Nicht empfehlen
            </button>
          </div>
        )}
        {voted && !submitted && (
          <div style={{ fontSize: 12, color: voted === "yes" ? TEAL : CORAL, fontWeight: 700 }}>
            {voted === "yes" ? "👍 Du empfiehlst" : "👎 Nicht empfohlen"}
          </div>
        )}
        {submitted && (
          <div style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>✓ Danke für dein Feedback</div>
        )}
      </div>
      {showForm && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={voted === "yes" ? "Was hat dir besonders gut gefallen? (optional)" : "Was lief nicht gut? Dein Feedback bleibt anonym. (optional)"}
            style={{ width: "100%", borderRadius: 10, border: "1.5px solid #e0e0e0", padding: "9px 12px", fontSize: 13, resize: "none", height: 72, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={handleSubmit} style={{ flex: 1, background: voted === "yes" ? TEAL : CORAL, color: "white", border: "none", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {voted === "yes" ? "👍 Empfehlung abgeben" : "Feedback senden"}
            </button>
            <button onClick={() => { setShowForm(false); setSubmitted(true); }} style={{ background: "#f0f0f0", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#888", cursor: "pointer" }}>Überspringen</button>
          </div>
        </div>
      )}
    </div>
  );
}

function WirkerProfilePage({ wirkerName, onBack, onAddToCart, isOwnProfile, autoBook, returnStep6, onGoToChats, following, toggleFollow }) {
  const [dbWirker, setDbWirker] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [tab, setTab] = useState("werke");
  const [followed, setFollowed] = useState(false);
  // Sync mit globalem following State
  React.useEffect(() => {
    const name = dbWirker?.name || wirkerName;
    if (following && name) setFollowed(following.has(name));
  }, [following, dbWirker, wirkerName]);
  const [showBooking, setShowBooking] = useState(!!autoBook);
  const [showAvailEditor, setShowAvailEditor] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [werke, setWerke] = useState([]);
  const [editingWerk, setEditingWerk] = useState(null);
  const [showWerkEditor, setShowWerkEditor] = useState(false);

  useEffect(() => {
    async function loadWirker() {
      setLoadingProfile(true);
      try {
        const { data: found, error } = await supabase
          .from('wirker')
          .select('*')
          .or(`name.eq.${wirkerName},full_name.eq.${wirkerName}`)
          .single();
        if (found && !error) {
          setDbWirker(found);
          setWerke(found.werke || []);
        } else {
          const mock = mockWirkerProfiles[wirkerName];
          if (mock) {
            setDbWirker(mock);
            setWerke(mock.werke || []);
          } else if (isOwnProfile) {
            // Eigenes Profil: Daten aus Auth + profiles Tabelle
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const u = session.user;
              const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Ich';
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
              setDbWirker({
                name: name,
                full_name: name,
                talent: profile?.talent || 'Talent',
                location: profile?.location || 'München',
                bio: profile?.bio || 'Füge eine Beschreibung in deinen Einstellungen hinzu.',
                img: profile?.avatar_url || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=2ABFAC&color=fff&size=200'),
                header_img: null,
                hourly_rate: profile?.hourly_rate || 60,
                skills: profile?.skills || [],
                recommendations: 0,
                bookings: 0,
                impact_eur: 0,
                verified: false,
              });
              setWerke([]);
            }
          }
        }
      } catch(e) {
        const mock = mockWirkerProfiles[wirkerName];
        if (mock) { setDbWirker(mock); setWerke(mock.werke || []); }
      }
      setLoadingProfile(false);
    }
    loadWirker();
  }, [wirkerName, isOwnProfile]);

  const handleSaveWerk = (updatedWerk) => {
    setWerke(prev => {
      const idx = prev.findIndex(w => w.title === editingWerk?.title);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedWerk;
        return next;
      }
      return [...prev, updatedWerk];
    });
    setShowWerkEditor(false);
    setEditingWerk(null);
  };

  if (loadingProfile) return (
    <div style={{ padding: 32, textAlign: "center", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 32 }}>✨</div>
      <div style={{ color: TEAL, fontWeight: 600, fontSize: 15 }}>Lade Profil…</div>
    </div>
  );

  const p = dbWirker || mockWirkerProfiles[wirkerName];
  if (!p) return <div style={{ padding: 32, textAlign: "center" }}><button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, fontWeight: 700 }}>← Zurück</button><p>Profil nicht gefunden</p></div>;
  
  // Normalize DB vs mock fields
  const profile = {
    name: p.name || wirkerName,
    fullName: p.full_name || p.fullName || p.name || wirkerName,
    talent: p.talent || "",
    location: p.location || "",
    hourlyRate: p.hourly_rate ? `${p.hourly_rate} €/h` : (p.hourlyRate || ""),
    memberSince: p.memberSince || "2024",
    bookings: p.bookings || 0,
    followers: p.followers || 0,
    recommendations: p.recommendations || 0,
    impactEur: p.impact_eur || p.impactEur || 0,
    bio: p.bio || "",
    img: p.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    header: p.header_img || p.header || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
    skills: p.skills || [],
    werke: werke,
    empfehlungen: p.empfehlungen || p.recommendations_list || [],
    pricePerHour: p.hourly_rate || p.pricePerHour || 0,
  };

  return (
    <div style={{ paddingBottom: 100, overflowY: "auto", height: "100vh", background: "#fafafa" }}>

      {/* ── HERO HEADER ── */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 220, overflow: "hidden" }}>
          {profile.header
            ? <img src={profile.header} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${TEAL}40, ${CORAL}20)` }} />
          }
        </div>
        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16, width: 38, height: 38, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <button style={{ position: "absolute", top: 16, right: 16, width: 38, height: 38, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
        </button>
        <div style={{ position: "absolute", bottom: -44, left: 20 }}>
          <img src={profile.img} style={{ width: 90, height: 90, borderRadius: "50%", border: "4px solid white", objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }} alt={profile.name} />
        </div>
      </div>

      {/* ── NAME & INFO ── */}
      <div style={{ background: "white", padding: "54px 20px 20px", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 21, color: "#1a1a1a" }}>{profile.fullName} {profile.recommendations >= 3 && <span style={{ color: TEAL }}>✓</span>}</div>
            <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 2 }}>{profile.talent}</div>
          </div>
          {!isOwnProfile && (
            <button onClick={() => { const next = !followed; setFollowed(next); if(toggleFollow) toggleFollow(profile.name); }}
              style={{ background: followed ? TEAL : "white", border: `2px solid ${TEAL}`, borderRadius: 22, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: followed ? "white" : TEAL, cursor: "pointer" }}>
              {followed ? "✓ Folge ich" : "+ Folgen"}
            </button>
          )}
        </div>
        {profile.bio && <div style={{ fontSize: 13, color: "#555", lineHeight: 1.65, marginBottom: 14 }}>{profile.bio}</div>}
        {profile.skills?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {profile.skills.slice(0, 5).map((s, i) => (
              <span key={i} style={{ background: `${TEAL}12`, color: TEAL, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {profile.pricePerHour > 0 && <div style={{ background: `${GOLD}20`, borderRadius: 12, padding: "8px 14px" }}><span style={{ fontWeight: 800, fontSize: 14, color: "#92400E" }}>💰 Ab {profile.pricePerHour} €</span></div>}
          {profile.location && <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "8px 14px" }}><span style={{ fontSize: 13, color: "#555" }}>📍 {profile.location}</span></div>}
          {profile.recommendations > 0 && <div style={{ background: `${TEAL}12`, borderRadius: 12, padding: "8px 14px" }}><span style={{ fontWeight: 700, fontSize: 13, color: TEAL }}>⭐ {profile.recommendations} Empfehlungen</span></div>}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: "white", display: "flex", borderBottom: "1px solid #f0f0ee" }}>
        {[["werke", "🎨", "Werke"], ["beitraege", "⊞", "Beiträge"]].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, background: "none", border: "none", borderBottom: tab === key ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "14px 8px", fontSize: 12, fontWeight: tab === key ? 800 : 500, color: tab === key ? CORAL : "#aaa", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {tab === "werke" && (
        <div style={{ padding: "16px" }}>
          {profile.werke.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎨</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#aaa" }}>Noch keine Werke</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {profile.werke.map((w, i) => (
                <div key={i} style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  {(w.img || w.image) && <img src={w.img || w.image} alt={w.title || w.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />}
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 4 }}>{w.title || w.name}</div>
                    {w.description && <div style={{ fontSize: 13, color: "#777", lineHeight: 1.55, marginBottom: 10 }}>{w.description}</div>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {w.price && <span style={{ fontWeight: 900, fontSize: 18, color: TEAL }}>{w.price}</span>}
                      {!isOwnProfile && (
                        <button onClick={() => setShowBooking(true)} style={{ background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          💬 Interesse bekunden
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "beitraege" && (
        <div style={{ padding: "14px" }}>
          {profile.werke.filter(w => w.img || w.image).length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}><div style={{ fontSize: 44 }}>📷</div><div style={{ fontSize: 15, color: "#aaa", marginTop: 10 }}>Noch keine Beiträge</div></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {profile.werke.filter(w => w.img || w.image).map((w, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 4, overflow: "hidden" }}>
                  <img src={w.img || w.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showBooking && (
        <BookingFlow wirker={profile} onClose={() => setShowBooking(false)} onAddToCart={onAddToCart} onSuccess={() => { setShowBooking(false); setBookingDone(true); }} returnStep6={returnStep6} />
      )}

    </div>
  );
}

function TalentAnbietenPage({ onClose, onSuccess }) {
  const TEAL = "#2ABFAC";
  const CORAL = "#FF6B6B";
  const [selected, setSelected] = React.useState(null);
  const [done, setDone] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const options = [
    { key: "wirker", icon: "🤝", label: "Wirker", sub: "Biete deine Fähigkeiten an — Coaching, Handwerk, Musik, Beratung und mehr.", color: TEAL },
    { key: "werke", icon: "🎨", label: "Werke & Erlebnisse", sub: "Zeige und verkaufe deine Werke — Kunst, Fotos, Design oder einzigartige Erlebnisse.", color: "#A78BFA" },
    { key: "beides", icon: "✨", label: "Beides (Wirker & Werke)", sub: "Du möchtest sowohl deine Fähigkeiten als auch deine Werke mit der Welt teilen.", color: CORAL },
  ];

  const handleSelect = async (key) => {
    setSelected(key);
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("profiles").upsert({ id: session.user.id, role: "talent", talent_type: key, updated_at: new Date().toISOString() });
      }
    } catch(e) {}
    setSaving(false);
    setDone(true);
  };

  if (done) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "linear-gradient(160deg, #fff8f6 0%, #f0fffe 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", letterSpacing: -0.5, marginBottom: 14, lineHeight: 1.25 }}>Perfekt!</div>
        <div style={{ fontSize: 15, color: "#666", lineHeight: 1.7, marginBottom: 36 }}>
          Du kannst ab sofort dein Talent anbieten.<br/>
          <span style={{ color: "#aaa" }}>Du kannst dein Profil jetzt jederzeit anpassen und vervollständigen.</span>
        </div>
        <button onClick={onSuccess} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 18, padding: "18px", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: `0 8px 24px ${TEAL}40` }}>
          Zum Profil gehen ✨
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "white", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>Was möchtest du anbieten?</div>
      </div>
      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        <div style={{ fontSize: 14, color: "#aaa", marginBottom: 4 }}>Wähle eine Option — du kannst das später jederzeit ändern.</div>
        {options.map(opt => (
          <div key={opt.key} onClick={() => !saving && handleSelect(opt.key)} style={{ background: "white", borderRadius: 22, padding: "22px 20px", border: `2.5px solid ${selected === opt.key ? opt.color : "#f0f0f0"}`, cursor: saving ? "default" : "pointer", boxShadow: selected === opt.key ? `0 8px 28px ${opt.color}25` : "0 2px 12px rgba(0,0,0,0.05)", transform: selected === opt.key ? "scale(1.02)" : "scale(1)", transition: "all 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: opt.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{opt.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a", marginBottom: 6 }}>{opt.label}</div>
                <div style={{ fontSize: 13, color: "#999", lineHeight: 1.55 }}>{opt.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ isNewUser, onViewOwnWirkerProfile, onTalentAnbieten, onOpenChats, following, toggleFollow, showTalentWelcomeHint }) {
  const TEAL = "#2ABFAC";
  const CORAL = "#FF6B6B";
  const GOLD = "#F59E0B";
  const PURPLE = "#A78BFA";

  const [tab, setTab] = React.useState("beitraege"); // beitraege | werke | einstellungen
  const [supaUser, setSupaUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [beitraege, setBeitraege] = React.useState([]);
  const [werke, setWerke] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingHeader, setEditingHeader] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editBio, setEditBio] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [showAddWerk, setShowAddWerk] = React.useState(false);
  const [newWerk, setNewWerk] = React.useState({ titel: "", beschreibung: "", preis: "", bild: null });

  // Einstellungen State
  const [talentTyp, setTalentTyp] = React.useState("wirker");
  const [geschaeftsform, setGeschaeftsform] = React.useState("freiberuflich");
  const [kategorien, setKategorien] = React.useState([]);
  const [radius, setRadius] = React.useState(50);
  const [verfuegbarkeit, setVerfuegbarkeit] = React.useState([]);
  const [stundensatz, setStundensatz] = React.useState("");
  const [savingSettings, setSavingSettings] = React.useState(false);

  const kategorienList = ["🎨 Kunst", "📷 Foto & Video", "🎵 Musik", "✍️ Texte", "💪 Sport", "🧘 Wellness", "🍳 Kochen", "🔧 Handwerk", "💻 Digital", "📚 Bildung", "🌍 Sonstiges"];
  const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const u = session.user;
      setSupaUser(u);
      const name = u.user_metadata?.full_name || u.email?.split("@")[0] || "Ich";
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      const merged = {
        name,
        avatar_url: prof?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2ABFAC&color=fff&size=200`,
        bio: prof?.bio || "",
        talent: prof?.talent || "",
        role: prof?.role || "entdecker",
        talent_type: prof?.talent_type || "wirker",
        geschaeftsform: prof?.geschaeftsform || "freiberuflich",
        kategorien: prof?.kategorien || [],
        radius: prof?.radius || 50,
        verfuegbarkeit: prof?.verfuegbarkeit || [],
        stundensatz: prof?.stundensatz || "",
      };
      setProfile(merged);
      setEditName(merged.name);
      setEditBio(merged.bio);
      setTalentTyp(merged.talent_type);
      setGeschaeftsform(merged.geschaeftsform);
      setKategorien(merged.kategorien);
      setRadius(merged.radius);
      setVerfuegbarkeit(merged.verfuegbarkeit);
      setStundensatz(merged.stundensatz);
      setLoading(false);
    }
    load();
  }, []);

  const saveProfileHeader = async () => {
    if (!supaUser) return;
    setSavingProfile(true);
    await supabase.from("profiles").upsert({ id: supaUser.id, bio: editBio, updated_at: new Date().toISOString() });
    setProfile(p => ({ ...p, bio: editBio, name: editName }));
    setSavingProfile(false);
    setEditingHeader(false);
  };

  const saveSettings = async () => {
    if (!supaUser) return;
    setSavingSettings(true);
    await supabase.from("profiles").upsert({
      id: supaUser.id,
      talent_type: talentTyp,
      geschaeftsform,
      kategorien,
      radius,
      verfuegbarkeit,
      stundensatz,
      updated_at: new Date().toISOString()
    });
    setSavingSettings(false);
    alert("Gespeichert ✅");
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBeitraege(prev => [{ id: Date.now(), src: ev.target.result, type: "foto" }, ...prev]);
    reader.readAsDataURL(file);
  };

  const handleWerkBild = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setNewWerk(w => ({ ...w, bild: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const addWerk = () => {
    if (!newWerk.titel.trim()) return;
    setWerke(prev => [{ id: Date.now(), ...newWerk }, ...prev]);
    setNewWerk({ titel: "", beschreibung: "", preis: "", bild: null });
    setShowAddWerk(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${TEAL}30`, borderTopColor: TEAL, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const isTalent = profile?.role === "talent";

  return (
    <div style={{ paddingBottom: 80, minHeight: "100vh", background: "#fafafa" }}>

      {/* Talent Welcome Hint */}
      {showTalentWelcomeHint && (
        <div style={{ margin: "16px 16px 0", background: `linear-gradient(135deg, ${CORAL}15, ${TEAL}10)`, border: `1.5px solid ${CORAL}30`, borderRadius: 20, padding: "20px 20px 16px" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>✨</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 6 }}>Super! Leg hier dein Talent an.</div>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.55, marginBottom: 16 }}>Damit andere dich finden können, erstelle jetzt dein Talent-Profil.</div>
          <button onClick={onTalentAnbieten} style={{ background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 14, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
            🌟 Talent anbieten
          </button>
        </div>
      )}

      {/* ── PROFIL HEADER ── */}
      <div style={{ background: "white", padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={profile?.avatar_url} alt="Profil" style={{ width: 86, height: 86, borderRadius: "50%", objectFit: "cover", border: `3px solid ${TEAL}30` }} />
            <label style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, background: TEAL, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white" }}>
              <span style={{ fontSize: 13, color: "white" }}>✏️</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                const file = e.target.files[0];
                if (file) { const r = new FileReader(); r.onload = ev => setProfile(p => ({ ...p, avatar_url: ev.target.result })); r.readAsDataURL(file); }
              }} />
            </label>
          </div>

          {/* Stats */}
          <div style={{ flex: 1 }}>
            {editingHeader ? (
              <input value={editName} onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", border: `1.5px solid ${TEAL}`, borderRadius: 10, padding: "8px 12px", fontSize: 15, fontWeight: 700, marginBottom: 6, outline: "none", boxSizing: "border-box" }} />
            ) : (
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a", marginBottom: 6 }}>{profile?.name}</div>
            )}
            <div style={{ display: "flex", gap: 20 }}>
              {[["Beiträge", beitraege.length], ["Werke", werke.length], ["Empfehlungen", 0]].map(([label, val]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        {editingHeader ? (
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
            style={{ width: "100%", border: `1.5px solid ${TEAL}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "none", marginBottom: 12 }}
            placeholder="Kurze Bio — was machst du, was liebst du?" />
        ) : (
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 12 }}>
            {profile?.bio || <span style={{ color: "#ccc" }}>Noch keine Bio — tippe auf Bearbeiten</span>}
          </div>
        )}

        {/* Talent Badge */}
        {isTalent && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ background: `${TEAL}15`, color: TEAL, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>✨ Talent</span>
            {profile?.talent_type && <span style={{ background: "#f5f5f5", color: "#666", borderRadius: 20, padding: "4px 12px", fontSize: 12 }}>{profile.talent_type === "wirker" ? "🤝 Wirker" : profile.talent_type === "werke" ? "🎨 Werke" : "🤝🎨 Beides"}</span>}
          </div>
        )}

        {/* Edit / Save Buttons */}
        {editingHeader ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditingHeader(false)} style={{ flex: 1, background: "#f5f5f5", color: "#666", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, cursor: "pointer" }}>Abbrechen</button>
            <button onClick={saveProfileHeader} disabled={savingProfile} style={{ flex: 2, background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {savingProfile ? "..." : "Speichern"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditingHeader(true)} style={{ flex: 1, background: "#f5f5f5", color: "#444", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✏️ Bearbeiten</button>
            {!isTalent && (
              <button onClick={onTalentAnbieten} style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🌟 Talent anbieten</button>
            )}
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f0f0f0", display: "flex", marginTop: 2 }}>
        {[["beitraege", "⊞", "Beiträge"], ["werke", "🎨", "Werke"], ...(isTalent ? [["einstellungen", "⚙️", "Einstellungen"]] : [])].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, background: "none", border: "none", padding: "14px 8px", fontSize: 12, fontWeight: tab === key ? 800 : 500, color: tab === key ? TEAL : "#aaa", cursor: "pointer", borderBottom: `2.5px solid ${tab === key ? TEAL : "transparent"}`, transition: "all 0.2s" }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: BEITRÄGE ── */}
      {tab === "beitraege" && (
        <div style={{ padding: "16px" }}>
          {/* Upload Button */}
          <label style={{ display: "block", cursor: "pointer", marginBottom: 16 }}>
            <div style={{ background: `linear-gradient(135deg, ${CORAL}15, ${TEAL}10)`, border: `2px dashed ${TEAL}50`, borderRadius: 18, padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: TEAL }}>Foto oder Video hochladen</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Erscheint auch im Home-Feed</div>
            </div>
            <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
          </label>
          {/* Grid */}
          {beitraege.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 14 }}>Noch keine Beiträge</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {beitraege.map(b => (
                <div key={b.id} style={{ aspectRatio: "1", borderRadius: 4, overflow: "hidden" }}>
                  <img src={b.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: WERKE ── */}
      {tab === "werke" && (
        <div style={{ padding: "16px" }}>
          {/* Werk hinzufügen */}
          {!showAddWerk ? (
            <button onClick={() => setShowAddWerk(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${PURPLE}15, ${TEAL}10)`, border: `2px dashed ${PURPLE}50`, borderRadius: 18, padding: "20px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎨</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: PURPLE }}>Werk hinzufügen</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Mit Titel, Preis und Beschreibung</div>
            </button>
          ) : (
            <div style={{ background: "white", borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Neues Werk</div>
              {/* Bild */}
              <label style={{ display: "block", cursor: "pointer", marginBottom: 14 }}>
                <div style={{ height: 160, borderRadius: 14, background: newWerk.bild ? "transparent" : "#f5f5f5", border: `2px dashed ${PURPLE}40`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {newWerk.bild ? <img src={newWerk.bild} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ textAlign: "center", color: "#aaa" }}><div style={{ fontSize: 30 }}>🖼️</div><div style={{ fontSize: 12, marginTop: 4 }}>Bild hochladen</div></div>}
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleWerkBild} />
              </label>
              <input value={newWerk.titel} onChange={e => setNewWerk(w => ({ ...w, titel: e.target.value }))} placeholder="Titel" style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
              <textarea value={newWerk.beschreibung} onChange={e => setNewWerk(w => ({ ...w, beschreibung: e.target.value }))} placeholder="Beschreibung (optional)" rows={2} style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} />
              <input value={newWerk.preis} onChange={e => setNewWerk(w => ({ ...w, preis: e.target.value }))} placeholder="Preis (z.B. 120 €)" style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 14, marginBottom: 14, outline: "none", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowAddWerk(false)} style={{ flex: 1, background: "#f5f5f5", color: "#666", border: "none", borderRadius: 12, padding: "12px", cursor: "pointer" }}>Abbrechen</button>
                <button onClick={addWerk} style={{ flex: 2, background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, cursor: "pointer" }}>Werk speichern</button>
              </div>
            </div>
          )}
          {/* Werke Liste */}
          {werke.length === 0 && !showAddWerk ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎨</div>
              <div style={{ fontSize: 14 }}>Noch keine Werke — füge dein erstes hinzu!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {werke.map(w => (
                <div key={w.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  {w.bild && <img src={w.bild} alt={w.titel} style={{ width: "100%", height: 200, objectFit: "cover" }} />}
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{w.titel}</div>
                    {w.beschreibung && <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{w.beschreibung}</div>}
                    {w.preis && <div style={{ fontWeight: 800, color: TEAL, fontSize: 15 }}>{w.preis}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: EINSTELLUNGEN ── */}
      {tab === "einstellungen" && (
        <div style={{ padding: "16px" }}>

          {/* Talenttyp */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🎯 Art des Talents</div>
            {[["wirker", "🤝", "Wirker", "Fähigkeiten & Dienstleistungen"], ["werke", "🎨", "Werke & Erlebnisse", "Produkte & Erlebnisse verkaufen"], ["beides", "✨", "Beides", "Wirker & Werke kombiniert"]].map(([key, icon, label, sub]) => (
              <div key={key} onClick={() => setTalentTyp(key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: key !== "beides" ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: talentTyp === key ? `${TEAL}20` : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: talentTyp === key ? TEAL : "#222" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{sub}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${talentTyp === key ? TEAL : "#ddd"}`, background: talentTyp === key ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {talentTyp === key && <div style={{ width: 8, height: 8, background: "white", borderRadius: "50%" }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Geschäftsform */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🏢 Geschäftsform</div>
            {[["freiberuflich", "Selbstständig / Freiberuflich"], ["gewerbe", "Gewerbe"], ["verein", "Verein / Organisation"], ["hobby", "Hobby / Nebenberuflich"]].map(([key, label], i, arr) => (
              <div key={key} onClick={() => setGeschaeftsform(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 14, fontWeight: geschaeftsform === key ? 700 : 400, color: geschaeftsform === key ? TEAL : "#444" }}>{label}</span>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${geschaeftsform === key ? TEAL : "#ddd"}`, background: geschaeftsform === key ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {geschaeftsform === key && <div style={{ width: 8, height: 8, background: "white", borderRadius: "50%" }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Kategorien */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🏷️ Kategorien</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kategorienList.map(k => (
                <button key={k} onClick={() => setKategorien(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                  style={{ background: kategorien.includes(k) ? `${TEAL}15` : "#f5f5f5", color: kategorien.includes(k) ? TEAL : "#666", border: `1.5px solid ${kategorien.includes(k) ? TEAL : "transparent"}`, borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: kategorien.includes(k) ? 700 : 400, cursor: "pointer" }}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>📍 Reisebereitschaft</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14 }}>Bis wie weit bist du bereit zu reisen?</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input type="range" min={5} max={200} value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontWeight: 800, color: TEAL, fontSize: 16, minWidth: 60 }}>{radius} km</span>
            </div>
          </div>

          {/* Verfügbarkeit */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📅 Verfügbarkeit</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
                <button key={d} onClick={() => setVerfuegbarkeit(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                  style={{ width: 44, height: 44, borderRadius: 12, background: verfuegbarkeit.includes(d) ? TEAL : "#f5f5f5", color: verfuegbarkeit.includes(d) ? "white" : "#666", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Preise */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>💰 Preiseinstellungen</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>STUNDENSATZ</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <input value={stundensatz} onChange={e => setStundensatz(e.target.value)} placeholder="z.B. 85" style={{ flex: 1, border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              <span style={{ fontWeight: 700, color: "#444", fontSize: 15 }}>€ / Std.</span>
            </div>
            <div style={{ fontSize: 11, color: "#ccc" }}>Paketpreise kannst du bei deinen Werken einstellen</div>
          </div>

          {/* Speichern */}
          <button onClick={saveSettings} disabled={savingSettings} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 20 }}>
            {savingSettings ? "Wird gespeichert..." : "Einstellungen speichern"}
          </button>
        </div>
      )}
    </div>
  );
}


function AppInner() {
  // ── ALL HOOKS MUST BE DECLARED FIRST (React rules of hooks) ──────────────

  // Supabase Auth direkt
  const [supabaseUser, setSupabaseUser] = React.useState(null);
  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [showTalentWelcomeHint, setShowTalentWelcomeHint] = React.useState(false);
  React.useEffect(() => {
    // Sofort prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setSupabaseUser(session.user);
    });
    // Auf Auth-Änderungen reagieren (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        const uid = session.user.id;
        // Favoriten laden
        supabase.from('favorites').select('wirker_name').eq('user_id', uid)
          .then(({ data }) => {
            if (data) setLiked(new Set(data.map(f => f.wirker_name)));
          }).catch(() => {});
      } else setSupabaseUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const supabaseUserName = supabaseUser?.user_metadata?.full_name || supabaseUser?.email?.split("@")[0] || null;
  if (supabaseUserName) window.__huiUserName = supabaseUserName;
  const signOut = () => supabase.auth.signOut().then(() => window.location.href = "/login");

  // Auth state
  const [authState, setAuthState] = useState("app");

  // Navigation & views
  const [page, setPage] = useState("home");
  const [detailView, setDetailView] = useState(null);

  // Interactions
  const [liked, setLiked] = useState({});
  const [faved, setFaved] = useState({});

  // Cart
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_cart") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem("hui_cart", JSON.stringify(cart));
  }, [cart]);

  // Toast
  const [toast, setToast] = useState(null);

  // Following — global, persisted
  const [following, setFollowing] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("hui_following") || "[]")); } catch { return new Set(); }
  });
  const toggleFollow = (wirkerKey) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(wirkerKey)) { next.delete(wirkerKey); } else { next.add(wirkerKey); }
      localStorage.setItem("hui_following", JSON.stringify([...next]));
      return next;
    });
  };

  // Overlays & modals
  const [showSearch, setShowSearch] = useState(false);
  const [storyViewer, setStoryViewer] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showWerkCreate, setShowWerkCreate] = useState(false);
  const [showStoryCreate, setShowStoryCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showKarte, setShowKarte] = useState(false);
  const [showHuiMatch, setShowHuiMatch] = useState(false);
  const [showTalentAnbieten, setShowTalentAnbieten] = useState(false);

  // Chat
  const [openChat, setOpenChat] = useState(null);
  const [paymentChat, setPaymentChat] = useState(null);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("onboarding") === "1") {
        localStorage.removeItem("hui_onboarding_seen");
        return true;
      }
      return !localStorage.getItem("hui_onboarding_seen");
    } catch { return false; }
  });

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Live data from DB
  const [liveWirker, setLiveWirker] = useState([]);
  const [liveImpact, setLiveImpact] = useState([]);
  const [liveFeed, setLiveFeed] = useState(mockFeed);

  const isNewUser = !supabaseUser; // false wenn eingeloggt
  const notifCount = mockNotifications.filter(n => !n.read).length;

  // ── EFFECTS ─────────────────────────────────────────────────────────────

  // Load live data from DB
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [wirkerRes, impactRes] = await Promise.all([
          supabase.from('wirker').select('*').order('bookings', { ascending: false }),
          supabase.from('impact_projects').select('*').order('votes', { ascending: false }),
        ]);
        const wirkerData = wirkerRes.data || [];
        const impactData = impactRes.data || [];

        if (wirkerData && wirkerData.length > 0) {
          setLiveWirker(wirkerData);
          const feedItems = [];
          let id = 1000;
          wirkerData.forEach((w, i) => {
            if (i % 3 === 0) {
              feedItems.push({
                id: id++, type: "wirker",
                name: w.name,
                img: w.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
                talent: w.talent,
                recommendations: w.recommendations || w.bookings || 0,
                location: w.location || ""
              });
            }
            if (w.hourly_rate) {
              feedItems.push({
                id: id++, type: "service",
                title: w.talent,
                creator: w.name,
                creatorImg: w.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
                img: w.header_img || w.img || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
                price: w.hourly_rate + " €/Std.",
                caption: w.bio || w.talent,
                likes: w.followers || 0,
                location: w.location || ""
              });
            }
          });
          const combined = [];
          const mockItems = mockFeed.slice(0, 6);
          mockItems.forEach((item, i) => {
            combined.push(item);
            if (feedItems[i]) combined.push(feedItems[i]);
          });
          combined.push(...mockFeed.slice(6));
          combined.push(...feedItems.slice(6));
          setLiveFeed(combined.length > 0 ? combined : mockFeed);
        }

        if (impactData && impactData.length > 0) {
          setLiveImpact(impactData.filter(p => p.status === "active" || p.status === "aktiv" || p.status === "won"));
        }
      } catch(e) {
        setLiveFeed(mockFeed);
      }
    }
    loadLiveData();
  }, []);

  // Handle Stripe payment return
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success") {
        let lastBooking = null;
        try { lastBooking = JSON.parse(localStorage.getItem("hui_last_booking") || "null"); } catch(e) {}
        if (lastBooking?.wirkerName) {
          setDetailView({ type: "wirker", id: lastBooking.wirkerName, isOwn: false, autoBook: true, returnStep6: true });
        }
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch(e) {}
  }, []);

  // ── ACTIONS ─────────────────────────────────────────────────────────────

  const addToCart = (item) => {
    setCart(c => [...c, item]);
    setToast(item);
    setTimeout(() => setToast(null), 2800);
  };

  const viewWirker = (name, isOwn = false) => setDetailView({ type: "wirker", id: name, isOwn });
  const bookWirker = (name) => setDetailView({ type: "wirker", id: name, isOwn: false, autoBook: true });

  const viewWerk = (title) => {
    setDetailView({ type: "werk", id: title });
    setRecentlyViewed(prev => [title, ...prev.filter(t => t !== title)].slice(0, 6));
  };

  const goBack = () => setDetailView(null);

  const openChatWith = (wirkerName) => {
    setOpenChat(wirkerName);
    setPage("chats");
    setDetailView(null);
  };

  // ── CONDITIONAL RENDERS — after all hooks ────────────────────────────────

  // Auth screens (rendered inside return via conditional)
  if (authState === "onboarding") {
    return <HuiOnboarding onDone={() => setAuthState("auth")} />;
  }
  if (authState === "auth") {
    if (authState === "welcome") return <WelcomeOnboarding onDone={(choice) => {
        setAuthState("app");
        if (choice === "talent") {
          setTimeout(() => {
            setPage("profile");
            setShowTalentWelcomeHint(true);
          }, 100);
        }
      }} />;
    return <HuiAuthScreen onLogin={(next) => setAuthState(next || "app")} />;
  }

  // Detail views (full-screen pages)
  if (detailView?.type === "wirker") {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <WirkerProfilePage
          wirkerName={detailView.id}
          isOwnProfile={detailView.isOwn}
          onBack={goBack}
          onAddToCart={addToCart}
          autoBook={detailView.autoBook}
          returnStep6={detailView.returnStep6}
          onGoToChats={() => { setDetailView(null); setPage("chats"); }}
          following={following}
          toggleFollow={toggleFollow}
        />
      </div>
    );
  }

  if (detailView?.type === "werk") {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <WerkDetailPage werkTitle={detailView.id} onBack={goBack} onAddToCart={addToCart} onViewWirker={viewWirker} />
      </div>
    );
  }

  // ── MAIN APP SHELL ───────────────────────────────────────────────────────

  const currentFeed = liveFeed.length > 0 ? liveFeed : mockFeed;

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5", fontFamily: "'Inter', -apple-system, sans-serif", position: "relative" }}>

      {/* ── HOME FEED ── */}
      {page === "home" && (
        <>
          <AppHeader
            cartCount={cart.length}
            onCartClick={() => setShowCart(true)}
            onNotifClick={() => setShowNotifications(true)}
            notifCount={notifCount}
          />
          <SearchBar
            onClick={() => setShowSearch(true)}
            onKarteClick={() => setShowKarte(true)}
            onMatchClick={() => setShowHuiMatch(true)}
          />
          <div style={{ paddingBottom: 96 }}>
            {/* Stories — only from followed */}
            <StoryBar
              onStoryClick={(idx) => setStoryViewer({ story: mockStories[idx], storyIdx: idx })}
              following={following}
              toggleFollow={toggleFollow}
            />

            {/* Featured Talente */}
            <div style={{ padding: "16px 0 4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#222" }}>✨ Ausgewählte Talente</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>Handverlesen · Diese Woche im Spotlight</div>
                </div>
                <button style={{ background: "none", border: "none", color: TEAL, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Alle →</button>
              </div>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "0 16px 8px", scrollbarWidth: "none" }}>
                {featuredWirker.map(w => (
                  <div key={w.id} onClick={() => viewWirker(w.name)}
                    style={{ flexShrink: 0, width: 140, cursor: "pointer", background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                    <img src={w.img} style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} alt={w.name} />
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#222", display: "flex", alignItems: "center", gap: 4 }}>
                        {w.name} <BadgeCheck size={11} color={TEAL} />
                      </div>
                      <div style={{ fontSize: 11, color: TEAL, fontWeight: 600, marginTop: 1 }}>{w.talent}</div>
                      <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>👍 {w.recommendations}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Werke */}
            <div style={{ padding: "16px 0 4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#222" }}>🎨 Top Werke</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>Handgefertigtes · Unikate zum Verlieben</div>
                </div>
                <button style={{ background: "none", border: "none", color: GOLD, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Alle →</button>
              </div>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "0 16px 8px", scrollbarWidth: "none" }}>
                {featuredWerke.map(w => (
                  <div key={w.id}
                    style={{ flexShrink: 0, width: 140, cursor: "pointer", background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: `1.5px solid ${GOLD}30` }}>
                    <div style={{ position: "relative" }}>
                      <img src={w.img} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} alt={w.title} />
                      <div style={{ position: "absolute", top: 7, right: 7, background: "rgba(0,0,0,0.45)", borderRadius: 10, padding: "2px 8px", fontSize: 11, color: "white", fontWeight: 700 }}>{w.price}</div>
                    </div>
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#222" }}>{w.title}</div>
                      <div style={{ fontSize: 11, color: GOLD, fontWeight: 600, marginTop: 1 }}>{w.creator}</div>
                      <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>❤️ {w.likes}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feed */}
            <div style={{ padding: "8px 0 0" }}>
              {currentFeed.map(item => {
                if (item.type === "media") return (
                  <MediaCard key={item.id} item={item}
                    liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))}
                    faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))}
                    onViewWirker={viewWirker} isTalentUser={!isNewUser}
                    following={following} toggleFollow={toggleFollow}
                  />
                );
                if (item.type === "werk") return (
                  <WerkCard key={item.id} item={item}
                    liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))}
                    faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))}
                    onAddToCart={addToCart} onViewWerk={viewWerk} onViewWirker={viewWirker} isTalentUser={!isNewUser}
                  />
                );
                if (item.type === "wirker") return (
                  <WirkerCard key={item.id} item={item} onViewWirker={viewWirker} onBookWirker={bookWirker} />
                );
                if (item.type === "service") return (
                  <ServiceCard key={item.id} item={item}
                    liked={!!liked[item.id]} onLike={id => setLiked(p => ({ ...p, [id]: !p[id] }))}
                    faved={!!faved[item.id]} onFav={id => setFaved(p => ({ ...p, [id]: !p[id] }))}
                    onViewWirker={viewWirker} isTalentUser={!isNewUser}
                    following={following} toggleFollow={toggleFollow}
                  />
                );
                if (item.type === "impact") return <ImpactCard key={item.id} item={item} />;
                return null;
              })}
            </div>
          </div>
        </>
      )}

      {/* ── IMPACT PAGE ── */}
      {page === "impact" && <ImpactPage />}

      {/* ── FAVORITES ── */}
      {page === "favorites" && (
        <FavoritesPage
          onViewWirker={viewWirker}
          onBookWirker={bookWirker}
          onViewWerk={viewWerk}
          onAddToCart={addToCart}
        />
      )}

      {/* ── CHATS ── */}
      {page === "chats" && (
        openChat
          ? <ChatDetailPage chat={typeof openChat === "object" ? openChat : mockChats.find(c => c.wirker === openChat) || mockChats[0]} onBack={() => setOpenChat(null)} />
          : <ChatListPage onOpenChat={setOpenChat} />
      )}

      {/* ── PROFIL ── */}
      {page === "profile" && !openChat && (
        <ProfilePage
          isNewUser={isNewUser}
          onViewOwnWirkerProfile={() => viewWirker(supabaseUserName || "Lars M.", true)}
          onTalentAnbieten={() => setShowTalentAnbieten(true)}
              showTalentWelcomeHint={showTalentWelcomeHint}
          onOpenChats={() => setPage("chats")}
          following={following}
          toggleFollow={toggleFollow}
          onViewWirker={viewWirker}
        />
      )}

      {/* ── TAB BAR ── */}
      {!detailView && (
        <TabBar page={page} setPage={(p) => { setPage(p); setOpenChat(null); }} cartCount={cart.length} isNewUser={isNewUser} onPlusClick={() => setShowCreateSheet(true)} />
      )}

      {/* ── OVERLAYS ── */}
      {showSearch && (
        <SearchOverlay onClose={() => setShowSearch(false)} />
      )}

      {showCart && (
        <CartOverlay
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={i => setCart(c => c.filter((_, idx) => idx !== i))}
          onGoToChats={() => { setShowCart(false); setPage("chats"); }}
        />
      )}

      {showNotifications && (
        <NotificationsOverlay onClose={() => setShowNotifications(false)} />
      )}

      {showKarte && (
        <KarteOverlay
          onClose={() => setShowKarte(false)}
          onViewWirker={viewWirker}
        />
      )}

      {showHuiMatch && (
        <HuiMatchOverlay
          onClose={() => setShowHuiMatch(false)}
          onViewWirker={(w) => { setShowHuiMatch(false); viewWirker(w); }}
        />
      )}

      {showCreateSheet && (
        <CreateSheet
          onClose={() => setShowCreateSheet(false)}
          onNewWerk={() => { setShowCreateSheet(false); setShowWerkCreate(true); }}
          onNewStory={() => { setShowCreateSheet(false); setShowStoryCreate(true); }}
        />
      )}
      {showWerkCreate && <WerkCreateModal onClose={() => setShowWerkCreate(false)} />}
      {showStoryCreate && <StoryCreateModal onClose={() => setShowStoryCreate(false)} />}

      {showTalentAnbieten && (
        <TalentAnbietenPage onClose={() => setShowTalentAnbieten(false)} onSuccess={() => setShowTalentAnbieten(false)} />
      )}

      {/* ── STORY VIEWER ── */}
      {storyViewer !== null && storyViewer.story && (
        <StoryViewer
          stories={
            storyViewer.story.slides
              ? storyViewer.story.slides.map(slide => ({
                  ...slide,
                  name: storyViewer.story.name || storyViewer.story.talent,
                  creatorImg: storyViewer.story.img,
                }))
              : [{
                  img: storyViewer.story.img || storyViewer.story.thumbnail || "",
                  text: storyViewer.story.text || storyViewer.story.name || "",
                  name: storyViewer.story.name || "",
                  creatorImg: storyViewer.story.img || "",
                  time: storyViewer.story.time || "",
                  views: storyViewer.story.views || 0,
                }]
          }
          startIndex={0}
          onClose={() => setStoryViewer(null)}
          onCreateNew={() => { setStoryViewer(null); setShowStoryCreate(true); }}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", color: "white",
          borderRadius: 20, padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          zIndex: 9999,
          maxWidth: "calc(100vw - 40px)", minWidth: 240,
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          {toast.img && (
            <img src={toast.img} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {toast.title || toast.name || "Zum Warenkorb hinzugefügt"}
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
              {toast.price || ""} · Im Warenkorb
            </div>
          </div>
          <div style={{ background: TEAL, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={13} color="white" strokeWidth={3} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes huiPulse { 0%,100% { box-shadow: 0 4px 16px ${GOLD}55; transform: scale(1); } 50% { box-shadow: 0 6px 26px ${GOLD}99; transform: scale(1.07); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
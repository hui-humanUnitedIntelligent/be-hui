// HUI App — Home.jsx (refactored, modular)
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { CORAL, TEAL, GOLD, PURPLE } from "../lib/constants";
import { Heart, Share2, Star, Search, Plus, ShoppingBasket, Bell, ChevronRight, MapPin, Play, X, Home, Leaf, User, SlidersHorizontal, ChevronDown, ChevronUp, Check, ArrowLeft, Calendar, Clock, Package, Award, Trash2, Edit3, Send, MessageCircle, Archive, ThumbsUp, ThumbsDown, BadgeCheck, ArrowUp, Eye, Settings, Filter, Image, Video, Upload, Download, Link, Mail, Info, Tag } from "lucide-react";

// Mock Data
import { mockChats } from "../lib/mockData";

// Ausgelagerte Seiten
import ProfilePage from "./ProfilePage";
import ImpactPage from "./ImpactPage";
import FavoritesPage from "./FavoritesPage";
import { ChatListPage, ChatDetailPage } from "./ChatPage";

// Ausgelagerte Komponenten
import { MediaCard, WerkCard, ServiceCard, WirkerCard, ImpactCard } from "../components/FeedCards";
import BookingFlow from "../components/BookingFlow";
import WirkerProfilePage from "../components/WirkerProfilePage";

// ─── ERROR BOUNDARY ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("HUI CRASH:", error, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 32, fontFamily: "monospace", fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: "red", marginBottom: 12 }}>💥 HUI Crash:</div>
        <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, overflow: "auto", whiteSpace: "pre-wrap" }}>{this.state.error?.message}</pre>
      </div>
    );
    return this.props.children;
  }
}

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

// ─── COMMENT SECTION ───────────────────────────────────────────────────────
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

// ─── WERK EDITOR ───────────────────────────────────────────────────────────
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


// ─── EMPFEHLUNGSBOX ────────────────────────────────────────────────────────
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


// ─── WERK DETAIL ───────────────────────────────────────────────────────────
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
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 8 }}><span>🌱 15% der Provision gehen in den Impact Pool</span></div>
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
const mockSuchergebnisse = [
  { id: "s1", typ: "wirker", name: "Sofia M.", kategorie: "Keramik & Töpfern", ort: "München · 2 km", empfehlungen: 48, preis: "ab 35 €", bild: "https://i.pravatar.cc/150?img=47", badge: "⭐ Top Wirker", buchbar: true, kaufbar: false, online: false },
  { id: "s2", typ: "werk", name: 'Aquarell-Bild "Alpenglühen"', kategorie: "Kunst & Kreatives", ort: "München · 3 km", empfehlungen: 12, preis: "89 €", bild: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=80", badge: null, buchbar: false, kaufbar: true, online: false },
  { id: "s3", typ: "wirker", name: "Marcus B.", kategorie: "Fotografie", ort: "München · 5 km", empfehlungen: 31, preis: "ab 80 €", bild: "https://i.pravatar.cc/150?img=33", badge: "📷 Profi", buchbar: true, kaufbar: false, online: true },
  { id: "s4", typ: "werk", name: "Handgemachte Schale (Set 2)", kategorie: "Keramik & Töpfern", ort: "München · 2 km", empfehlungen: 8, preis: "55 €", bild: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80", badge: "🔥 Beliebt", buchbar: false, kaufbar: true, online: false },
  { id: "s5", typ: "wirker", name: "Lena K.", kategorie: "Coaching", ort: "München · 8 km", empfehlungen: 63, preis: "ab 120 €", bild: "https://i.pravatar.cc/150?img=25", badge: "✅ Verifiziert", buchbar: true, kaufbar: false, online: true },
  { id: "s6", typ: "wirker", name: "Jonas W.", kategorie: "Musik", ort: "München · 4 km", empfehlungen: 22, preis: "ab 60 €", bild: "https://i.pravatar.cc/150?img=12", badge: null, buchbar: true, kaufbar: false, online: false },
  { id: "s7", typ: "werk", name: "Yoga-Kurs Aufzeichnung (3x)", kategorie: "Wellness & Yoga", ort: "Online", empfehlungen: 19, preis: "29 €", bild: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&q=80", badge: "💻 Online", buchbar: false, kaufbar: true, online: true },
  { id: "s8", typ: "wirker", name: "Anna P.", kategorie: "Kulinarik", ort: "München · 6 km", empfehlungen: 37, preis: "ab 45 €", bild: "https://i.pravatar.cc/150?img=44", badge: null, buchbar: true, kaufbar: false, online: false },
];


// ─── SEARCH OVERLAY ────────────────────────────────────────────────────────
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
  const [showResults, setShowResults] = useState(false);
  // Live search: show results as soon as user types
  useEffect(() => { if (query.trim().length > 0) setShowResults(true); }, [query]);

  const [dbWirkerSuche, setDbWirkerSuche] = useState([]);
  useEffect(() => {
    supabase.from('wirker').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        const mapped = data.map(w => ({
          id: w.id, typ: "wirker",
          name: w.name || w.full_name || "",
          kategorie: w.talent || "",
          ort: (w.location || "") + (w.location ? " · 0 km" : ""),
          empfehlungen: w.recommendations || w.bookings || 0,
          preis: w.hourly_rate ? `ab ${w.hourly_rate} €` : "",
          bild: w.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
          badge: w.verified ? "✅ Verifiziert" : null,
          buchbar: true, kaufbar: false, online: false
        }));
        setDbWirkerSuche(mapped);
      }
    }).catch(() => {});
  }, []);

  // Filtern & Suchen
  const gefilterteErgebnisse = React.useMemo(() => {
    const allResults = [...dbWirkerSuche, ...mockSuchergebnisse];
    // Deduplizieren nach name
    const seen = new Set();
    let res = allResults.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
    if (query.trim()) {
      const q = query.toLowerCase();
      res = res.filter(r => r.name.toLowerCase().includes(q) || r.kategorie.toLowerCase().includes(q));
    }
    if (contentType !== "alles") res = res.filter(r => r.typ === contentType);
    if (categories.length > 0) res = res.filter(r => categories.includes(r.kategorie));
    if (offerType.includes("buchbar")) res = res.filter(r => r.buchbar);
    if (offerType.includes("kaufbar")) res = res.filter(r => r.kaufbar);
    if (onlineOnly) res = res.filter(r => r.online);
    if (minRecommendations > 0) res = res.filter(r => r.empfehlungen >= minRecommendations);
    if (sortBy === "empfehlungen") res.sort((a,b) => b.empfehlungen - a.empfehlungen);
    return res;
  }, [query, contentType, categories, offerType, onlineOnly, minRecommendations, sortBy, dbWirkerSuche]);
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
        <Section id="empfehlungen" title="Mindest-Empfehlungen" icon="👍"><div style={{ display: "flex", gap: 8 }}>{[0,5,10,25,50].map(n => (<button key={n} onClick={() => setMinRecommendations(n)} style={{ background: minRecommendations === n ? CORAL : "#f3f3f3", color: minRecommendations === n ? "white" : "#555", border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{n === 0 ? "Alle" : `${n}+`}</button>))}</div></Section>
        <Section id="sortierung" title="Sortieren nach" icon="↕️"><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{sortOptions.map(o => (<button key={o.value} onClick={() => setSortBy(o.value)} style={{ background: sortBy === o.value ? `${TEAL}15` : "none", border: sortBy === o.value ? `1.5px solid ${TEAL}` : "1.5px solid #eee", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: sortBy === o.value ? TEAL : "#444", fontWeight: sortBy === o.value ? 700 : 400, fontSize: 13 }}>{o.label}{sortBy === o.value && <Check size={15} color={TEAL} />}</button>))}</div></Section>
        <div style={{ height: 16 }} />
      </div>
      <div style={{ background: "white", padding: "12px 16px 24px", borderTop: "1px solid #f0f0f0", maxWidth: 430, width: "100%", margin: "0 auto" }}>
        <button onClick={() => setShowResults(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{activeFilterCount > 0 ? `${activeFilterCount} Filter anwenden` : "Suchen"}</button>
      </div>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: -1 }} />

      {/* ── SUCHERGEBNISSE ──────────────────────────────────────── */}
      {showResults && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "#fafaf8", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ background: "white", padding: "14px 16px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <button onClick={() => setShowResults(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <ArrowLeft size={20} color="#444" />
              </button>
              <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 12, padding: "9px 13px", display: "flex", gap: 8, alignItems: "center" }}>
                <Search size={15} color={TEAL} />
                <span style={{ fontSize: 14, color: query ? "#222" : "#bbb" }}>{query || "Alle Ergebnisse"}</span>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: CORAL, fontWeight: 700, fontSize: 14 }}>Fertig</button>
            </div>
            {/* Filter-Chips aktive */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              <div style={{ background: `${TEAL}15`, borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: TEAL, whiteSpace: "nowrap", flexShrink: 0 }}>
                📍 {radius === 200 ? "Weltweit" : `${radius} km`}
              </div>
              {contentType !== "alles" && <div style={{ background: `${CORAL}15`, borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: CORAL, whiteSpace: "nowrap", flexShrink: 0 }}>{contentType === "wirker" ? "👤 Wirker" : "🛍 Werke"}</div>}
              {categories.slice(0,2).map(c => <div key={c} style={{ background: "#f0f0ee", borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#555", whiteSpace: "nowrap", flexShrink: 0 }}>{c}</div>)}
              {activeFilterCount > 0 && <button onClick={() => setShowResults(false)} style={{ background: "none", border: "1px solid #eee", borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#aaa", whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer" }}>✏️ Filtern</button>}
            </div>
          </div>

          {/* Ergebnis-Info */}
          <div style={{ padding: "10px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>{gefilterteErgebnisse.length} Ergebnisse gefunden</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: 12, border: "1px solid #eee", borderRadius: 8, padding: "4px 8px", color: "#555", background: "white", cursor: "pointer" }}>
              {[{value:"relevanz",label:"Relevanz"},{value:"empfehlungen",label:"Meiste Empfehlungen"},{value:"neu",label:"Neueste"},{value:"preis_asc",label:"Preis ↑"},{value:"preis_desc",label:"Preis ↓"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 24px" }}>
            {gefilterteErgebnisse.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 6 }}>Keine Ergebnisse</div>
                <div style={{ fontSize: 13, color: "#aaa" }}>Versuch andere Filter oder einen anderen Suchbegriff.</div>
                <button onClick={() => setShowResults(false)} style={{ marginTop: 20, background: TEAL, color: "white", border: "none", borderRadius: 12, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Filter anpassen</button>
              </div>
            ) : gefilterteErgebnisse.map(item => (
              <div key={item.id} style={{ background: "white", borderRadius: 18, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", gap: 0 }}>
                  {/* Bild */}
                  <div style={{ width: 90, flexShrink: 0, position: "relative" }}>
                    <img src={item.bild} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 100 }} />
                    {item.badge && <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", borderRadius: 99, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>{item.badge}</div>}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#222", lineHeight: 1.3 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: TEAL, fontWeight: 600, marginTop: 1 }}>{item.kategorie}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: CORAL, flexShrink: 0, marginLeft: 8 }}>{item.preis}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>📍 {item.ort} · 👍 {item.empfehlungen} Empfehlungen</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {item.buchbar && <button style={{ flex: 1, background: `linear-gradient(135deg, ${TEAL}, #10b981)`, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>📅 Buchen</button>}
                      {item.kaufbar && <button style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>🛒 Kaufen</button>}
                      {item.online && <div style={{ background: `${TEAL}15`, borderRadius: 10, padding: "8px 10px", fontSize: 11, fontWeight: 700, color: TEAL }}>💻</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// IMPACT TRACKER PAGE
// ══════════════════════════════════════════════════════════════════

// ─── IMPACT TRACKER ────────────────────────────────────────────────────────
function ImpactTrackerPage({ onClose }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [showWrapped, setShowWrapped] = React.useState(false);
  const [wrappedSlide, setWrappedSlide] = React.useState(0);
  const [counterDone, setCounterDone] = React.useState(false);

  const TARGET = 47.25; // Gesamter persönlicher Impact in €

  // Animierter Counter beim Mount
  React.useEffect(() => {
    let start = null;
    const duration = 2200;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(parseFloat((TARGET * eased).toFixed(2)));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(TARGET);
        setCounterDone(true);
      }
    };
    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Persönliche Impact-Daten
  const stats = {
    total: 47.25,
    diesesJahr: 34.50,
    dieserMonat: 8.25,
    buchungen: 12,
    kaeufe: 7,
    lieblingsKategorie: "Kinder & Bildung",
    unterstuetzteProjekte: 3,
    baeumePflanzung: 4,
    co2: "18 kg",
    kinderUnterstuetzt: 2,
    streak: 5, // Monate in Folge mit Impact
  };

  const verlauf = [
    { monat: "Nov", wert: 2.10 },
    { monat: "Dez", wert: 5.40 },
    { monat: "Jan", wert: 3.20 },
    { monat: "Feb", wert: 6.75 },
    { monat: "Mär", wert: 9.30 },
    { monat: "Apr", wert: 8.25 },
  ];
  const maxVerlauf = Math.max(...verlauf.map(v => v.wert));

  const projekte = [
    { name: "Schule für alle", land: "Uganda", beitrag: "18,75 €", emoji: "🏫", color: TEAL },
    { name: "Bäume für Kenia", land: "Kenia", beitrag: "15,00 €", emoji: "🌳", color: "#16a34a" },
    { name: "Tierheim Hamburg", land: "Deutschland", beitrag: "13,50 €", emoji: "🐾", color: GOLD },
  ];

  // Wrapped Slides
  const wrappedSlides = [
    {
      bg: `linear-gradient(160deg, ${TEAL}, #0d9488)`,
      emoji: "🌍",
      headline: "Dein Impact 2026",
      sub: "Du hast etwas bewegt.",
      value: `${stats.total} €`,
      desc: "So viel ist durch deine Buchungen in echte Projekte geflossen.",
    },
    {
      bg: `linear-gradient(160deg, #7c3aed, #a855f7)`,
      emoji: "🔥",
      headline: `${stats.streak} Monate`,
      sub: "am Stück mit Impact.",
      value: `${stats.streak}`,
      unit: "Monate in Folge",
      desc: "Du bist seit 5 Monaten dabei — jede Buchung zählt.",
    },
    {
      bg: `linear-gradient(160deg, ${CORAL}, #f97316)`,
      emoji: "❤️",
      headline: "Lieblingsthema",
      sub: "Wo dein Herz schlägt.",
      value: "Kinder & Bildung",
      desc: "Die meisten deiner Buchungen unterstützten Bildungsprojekte.",
    },
    {
      bg: `linear-gradient(160deg, #16a34a, #4ade80)`,
      emoji: "🌳",
      headline: `${stats.baeumePflanzung} Bäume`,
      sub: "durch dich gepflanzt.",
      value: `${stats.baeumePflanzung}`,
      unit: "Bäume in Kenia",
      desc: "Dein Beitrag hat direkt zur Aufforstung beigetragen.",
    },
    {
      bg: `linear-gradient(160deg, ${GOLD}, #f59e0b)`,
      emoji: "⭐",
      headline: "Danke, Lars!",
      sub: "Du bist ein HUI-Botschafter.",
      value: "Top 12%",
      desc: "Du gehörst zu den aktivsten Impact-Nutzern auf HUI.",
    },
  ];

  // WRAPPED OVERLAY
  if (showWrapped) {
    const slide = wrappedSlides[wrappedSlide];
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: slide.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}
        onClick={() => {
          if (wrappedSlide < wrappedSlides.length - 1) setWrappedSlide(s => s + 1);
          else { setShowWrapped(false); setWrappedSlide(0); }
        }}>
        {/* Progress dots */}
        <div style={{ position: "absolute", top: 24, left: 0, right: 0, display: "flex", gap: 6, justifyContent: "center" }}>
          {wrappedSlides.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 99, background: i <= wrappedSlide ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", flex: i === wrappedSlide ? 2 : 1, transition: "flex 0.3s" }} />
          ))}
        </div>
        {/* Close */}
        <button onClick={e => { e.stopPropagation(); setShowWrapped(false); setWrappedSlide(0); }}
          style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="white" />
        </button>

        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 80, marginBottom: 20, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.2))" }}>{slide.emoji}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>{slide.sub}</div>
          <div style={{ fontSize: slide.value.length > 6 ? 32 : 56, fontWeight: 900, color: "white", lineHeight: 1.1, marginBottom: 12, textShadow: "0 2px 20px rgba(0,0,0,0.2)" }}>
            {slide.value}
            {slide.unit && <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.8, marginTop: 4 }}>{slide.unit}</div>}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 32 }}>{slide.desc}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            {wrappedSlide < wrappedSlides.length - 1 ? "Tippen um weiterzugehen →" : "Tippen zum Schließen ✓"}
          </div>
        </div>
      </div>
    );
  }

  // HAUPT-TRACKER
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "#fafaf8", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${TEAL}22, transparent)`, padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={22} color="#444" />
          </button>
          <div style={{ fontWeight: 900, fontSize: 20, color: "#222" }}>Mein Impact</div>
        </div>

        {/* Animierter Haupt-Counter */}
        <div style={{ textAlign: "center", paddingBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            🌍 Du hast bisher bewegt
          </div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: TEAL, lineHeight: 1, letterSpacing: -2 }}>
              {displayValue.toFixed(2)} €
            </div>
            {counterDone && (
              <div style={{ position: "absolute", top: -8, right: -28, fontSize: 22, animation: "bounce 0.5s ease" }}>✨</div>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>durch deine Buchungen & Käufe</div>

          {/* Wrapped CTA */}
          {counterDone && (
            <button onClick={() => setShowWrapped(true)}
              style={{ marginTop: 14, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, border: "none", borderRadius: 20, padding: "9px 20px", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${TEAL}44`, display: "inline-flex", alignItems: "center", gap: 7 }}>
              🎬 Dein Impact Rückblick 2026
            </button>
          )}
        </div>
      </div>

      {/* Scrollbarer Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>

        {/* Schnellstats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { val: `${stats.diesesJahr} €`, label: "Dieses Jahr", color: TEAL, emoji: "📅" },
            { val: `${stats.dieserMonat} €`, label: "Dieser Monat", color: GOLD, emoji: "🗓" },
            { val: `${stats.unterstuetzteProjekte}`, label: "Projekte", color: CORAL, emoji: "🎯" },
          ].map(({ val, label, color, emoji }) => (
            <div key={label} style={{ flex: 1, background: "white", borderRadius: 16, padding: "14px 8px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 16, color }}>{val}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Verlaufs-Chart */}
        <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>📈 Verlauf</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>letzte 6 Monate</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
            {verlauf.map(({ monat, wert }) => (
              <div key={monat} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: TEAL }}>{wert} €</div>
                <div style={{
                  width: "100%", borderRadius: "6px 6px 0 0",
                  background: monat === "Apr" ? `linear-gradient(180deg, ${TEAL}, ${GOLD})` : `${TEAL}30`,
                  height: `${(wert / maxVerlauf) * 58}px`,
                  transition: "height 0.8s ease",
                  minHeight: 4,
                }} />
                <div style={{ fontSize: 10, color: monat === "Apr" ? TEAL : "#bbb", fontWeight: monat === "Apr" ? 800 : 400 }}>{monat}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Unterstützte Projekte */}
        <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#222", marginBottom: 14 }}>🌱 Deine Projekte</div>
          {projekte.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < projekte.length - 1 ? "1px solid #f5f5f3" : "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: p.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {p.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>📍 {p.land}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: p.color }}>{p.beitrag}</div>
            </div>
          ))}
        </div>

        {/* Streak & Extras */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: `linear-gradient(135deg, #7c3aed18, #a855f710)`, border: "1px solid #a855f730", borderRadius: 16, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🔥</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: "#7c3aed" }}>{stats.streak}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Monate Streak</div>
          </div>
          <div style={{ flex: 1, background: `linear-gradient(135deg, #16a34a18, #4ade8010)`, border: "1px solid #16a34a30", borderRadius: 16, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🌳</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: "#16a34a" }}>{stats.baeumePflanzung}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Bäume gepflanzt</div>
          </div>
          <div style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}18, ${GOLD}10)`, border: `1px solid ${CORAL}30`, borderRadius: 16, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🏫</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: CORAL }}>{stats.kinderUnterstuetzt}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Kinder gefördert</div>
          </div>
        </div>

        {/* Badge */}
        <div style={{ background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`, borderRadius: 18, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 4px 20px rgba(245,166,35,0.3)" }}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: "white", marginBottom: 3 }}>HUI Impact Champion</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>Du gehörst zu den aktivsten Impact-Nutzern — Top 12% der Community!</div>
          </div>
        </div>

      </div>
    </div>
  );
}


// ─── HUI PUNKTE ────────────────────────────────────────────────────────────
function HuiPunktePage({ onClose }) {
  const totalPunkte = 250;
  const naechsteStufe = 500;
  const progress = totalPunkte / naechsteStufe;
  const [activeTab, setActiveTab] = React.useState("verlauf"); // verlauf | einloesen | sammeln
  const [eingeloest, setEingeloest] = React.useState(null);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#fafaf8", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`, padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 10, cursor: "pointer", padding: "6px 8px", display: "flex" }}>
            <ArrowLeft size={20} color="white" />
          </button>
          <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>Meine HUI-Punkte</span>
        </div>

        {/* Punkte-Karte */}
        <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "20px", marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Dein Guthaben</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: "white", lineHeight: 1 }}>250</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>HUI-Punkte = 12,50 € Wert</div>
            </div>
            <div style={{ fontSize: 48 }}>⭐</div>
          </div>
          {/* Progress zur nächsten Stufe */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
            Noch 250 Punkte bis Stufe Gold 🥇
          </div>
          <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: "white", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>0</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>500 (Gold)</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginTop: 14 }}>
          {[["verlauf","📋 Verlauf"],["einloesen","🎁 Einlösen"],["sammeln","➕ Sammeln"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, background: "none", border: "none", borderBottom: activeTab === id ? "2.5px solid white" : "2.5px solid transparent", padding: "10px 4px", fontWeight: activeTab === id ? 800 : 500, fontSize: 13, color: activeTab === id ? "white" : "rgba(255,255,255,0.6)", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* ── VERLAUF ── */}
        {activeTab === "verlauf" && (
          <div>
            {huiPunkteVerlauf.map((e, i) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 13, background: "white", borderRadius: 14, padding: "13px 16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: e.type === "gewonnen" ? `${TEAL}15` : `${CORAL}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {e.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>{e.label}</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{e.sub}</div>
                  <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{e.datum}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: e.type === "gewonnen" ? TEAL : CORAL }}>
                  {e.punkte > 0 ? `+${e.punkte}` : e.punkte}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EINLÖSEN ── */}
        {activeTab === "einloesen" && (
          <div>
            <div style={{ background: `${GOLD}15`, borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <div style={{ fontSize: 13, color: "#666" }}>Du hast <strong style={{ color: GOLD }}>250 Punkte</strong> — wähle eine Prämie:</div>
            </div>
            {huiPraemien.map((p, i) => {
              const kannEinloesen = totalPunkte >= p.kosten;
              const istEingeloest = eingeloest === i;
              return (
                <div key={i} style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", opacity: kannEinloesen ? 1 : 0.5, border: istEingeloest ? `2px solid ${TEAL}` : "1.5px solid #f0f0f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 28 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>{p.sub}</div>
                    </div>
                    <div style={{ background: `${GOLD}18`, borderRadius: 99, padding: "4px 10px", fontWeight: 800, fontSize: 12, color: GOLD }}>{p.kosten} Pkt.</div>
                  </div>
                  {istEingeloest ? (
                    <div style={{ background: `${TEAL}12`, borderRadius: 10, padding: "10px", textAlign: "center", fontSize: 13, fontWeight: 700, color: TEAL }}>
                      ✅ Eingelöst! Wird bei nächster Transaktion angewendet.
                    </div>
                  ) : (
                    <button onClick={() => kannEinloesen && setEingeloest(i)} disabled={!kannEinloesen} style={{ width: "100%", background: kannEinloesen ? `linear-gradient(135deg, ${GOLD}, #f59e0b)` : "#e8e8e8", border: "none", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 14, color: kannEinloesen ? "white" : "#bbb", cursor: kannEinloesen ? "pointer" : "not-allowed" }}>
                      {kannEinloesen ? "Jetzt einlösen" : `Noch ${p.kosten - totalPunkte} Punkte fehlen`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SAMMELN ── */}
        {activeTab === "sammeln" && (
          <div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.6 }}>
              So verdienst du HUI-Punkte — jede Aktion stärkt die Community:
            </div>
            {[
              { icon: "📅", label: "Buchung abschließen", punkte: "+50 Pkt.", sub: "Pro abgeschlossener Buchung", done: true },
              { icon: "👍", label: "Empfehlung abgeben", punkte: "+20 Pkt.", sub: "Nach verifiziertem Kauf", done: true },
              { icon: "🛒", label: "Werk kaufen", punkte: "+25 Pkt.", sub: "Pro Kauf eines Werkes", done: false },
              { icon: "🌱", label: "Impact-Projekt unterstützen", punkte: "+30 Pkt.", sub: "Bei Teilnahme oder Spende", done: false },
              { icon: "👥", label: "Freund einladen", punkte: "+75 Pkt.", sub: "Pro registriertem Freund", done: false },
              { icon: "✨", label: "Profil vervollständigen", punkte: "+100 Pkt.", sub: "Einmalig bei 100% Completion", done: true },
              { icon: "📸", label: "Story posten", punkte: "+10 Pkt.", sub: "Maximal 1x pro Tag", done: false },
              { icon: "💬", label: "Kommentar hinterlassen", punkte: "+5 Pkt.", sub: "Maximal 3x pro Tag", done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: "white", borderRadius: 14, padding: "13px 16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", opacity: item.done ? 0.6 : 1 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: item.done ? "#f0f0ee" : `${GOLD}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {item.done ? "✅" : item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: item.done ? "#aaa" : "#222", textDecoration: item.done ? "line-through" : "none" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{item.sub}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: item.done ? "#ccc" : GOLD }}>{item.punkte}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
function NotificationsOverlay({ onClose }) {
  const [notifs, setNotifs] = React.useState(mockNotifications);
  const [activeFilter, setActiveFilter] = React.useState("alle");
  const [dismissed, setDismissed] = React.useState({});

  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const dismiss = (id, e) => { e.stopPropagation(); setDismissed(d => ({ ...d, [id]: true })); };
  const handleAction = (n, action, e) => { e.stopPropagation(); markRead(n.id); };

  const filterTabs = [
    { id: "alle", label: "Alle", emoji: "" },
    { id: "buchung", label: "Buchungen", emoji: "📅" },
    { id: "empfehlung", label: "Empfehlungen", emoji: "👍" },
    { id: "nachricht", label: "Nachrichten", emoji: "💬" },
    { id: "impact", label: "Impact", emoji: "🌱" },
  ];

  const visible = notifs.filter(n => !dismissed[n.id] && (activeFilter === "alle" || n.type === activeFilter));

  // Gruppieren nach group
  const groups = ["Heute", "Gestern", "Diese Woche"];
  const grouped = groups.map(g => ({ label: g, items: visible.filter(n => n.group === g) })).filter(g => g.items.length > 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#f7f7f5", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "white", padding: "16px 16px 0", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <ArrowLeft size={20} color="#444" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 19, color: "#1a1a1a" }}>Benachrichtigungen</span>
              {unreadCount > 0 && (
                <span style={{ background: CORAL, color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>{unreadCount} neu</span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: TEAL, fontWeight: 700, padding: "4px 0" }}>
              Alle gelesen
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {filterTabs.map(t => {
            const active = activeFilter === t.id;
            return (
              <button key={t.id} onClick={() => setActiveFilter(t.id)} style={{
                flexShrink: 0, border: "none", borderRadius: 20,
                padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: active ? "#1a1a1a" : "#f3f3f1",
                color: active ? "white" : "#888",
                transition: "all 0.15s",
              }}>
                {t.emoji ? `${t.emoji} ${t.label}` : t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 24px" }}>
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "70px 24px", color: "#ccc" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#ccc", marginBottom: 6 }}>Alles erledigt!</div>
            <div style={{ fontSize: 13, color: "#ddd" }}>Keine neuen Benachrichtigungen</div>
          </div>
        )}

        {grouped.map(({ label, items }) => (
          <div key={label}>
            {/* Gruppen-Header */}
            <div style={{ fontSize: 11, fontWeight: 800, color: "#bbb", textTransform: "uppercase", letterSpacing: 1, padding: "12px 2px 8px" }}>
              {label}
            </div>

            {items.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)}
                style={{
                  background: n.read ? "white" : `${n.color}08`,
                  border: `1px solid ${n.read ? "#efefed" : n.color + "28"}`,
                  borderRadius: 18,
                  marginBottom: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: n.read ? "none" : `0 2px 12px ${n.color}14`,
                }}>

                {/* Main row */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 14px 10px", position: "relative" }}>
                  {/* Avatar or Icon */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {n.avatar ? (
                      <>
                        <img src={n.avatar} alt="" style={{ width: 44, height: 44, borderRadius: 14, objectFit: "cover" }} />
                        <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: n.color, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                          {n.icon}
                        </div>
                      </>
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: n.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                        {n.icon}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                      <div style={{ fontWeight: n.read ? 600 : 800, fontSize: 13, color: "#1a1a1a", lineHeight: 1.3 }}>{n.title}</div>
                      <div style={{ fontSize: 10, color: "#bbb", whiteSpace: "nowrap", flexShrink: 0 }}>{n.time}</div>
                    </div>
                    <div style={{ fontSize: 12, color: n.read ? "#888" : "#555", lineHeight: 1.6 }}>{n.text}</div>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: n.color }} />
                  )}
                </div>

                {/* Action Buttons */}
                {n.actions && n.actions.length > 0 && (
                  <div style={{ display: "flex", gap: 8, padding: "0 14px 13px" }}>
                    {n.actions.map((a, i) => (
                      <button key={i} onClick={e => handleAction(n, a, e)} style={{
                        flex: a.style === "primary" ? 2 : 1,
                        padding: "9px 12px",
                        border: a.style === "ghost" ? "1.5px solid #e8e8e8" : "none",
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                        background: a.style === "primary" ? n.color : a.style === "danger" ? "#fee2e2" : "white",
                        color: a.style === "primary" ? "white" : a.style === "danger" ? "#ef4444" : "#555",
                        transition: "opacity 0.15s",
                      }}>
                        {a.label}
                      </button>
                    ))}
                    <button onClick={e => dismiss(n.id, e)} style={{ padding: "9px 10px", border: "1.5px solid #eee", borderRadius: 12, background: "white", cursor: "pointer", fontSize: 12, color: "#ccc", fontWeight: 600 }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── APP HEADER + SEARCH BAR ───────────────────────────────────────────────
function AppHeader({ cartCount, onCartClick, onNotifClick, notifCount }) {
  return (
    <div style={{ background: "white", padding: "14px 16px 10px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.2, color: "#888" }}>
            <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17, textShadow: "0 0 8px rgba(255,107,0,0.3)" }}>H</span>uman{" "}
            <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17, textShadow: "0 0 8px rgba(255,107,0,0.3)" }}>U</span>nited{" "}
            <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17, textShadow: "0 0 8px rgba(255,107,0,0.3)" }}>I</span>ntelligent
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onCartClick} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6 }}>
            <ShoppingBasket size={22} color="#444" />
            {cartCount > 0 && <span style={{ position: "absolute", top: 0, right: 0, background: CORAL, color: "white", borderRadius: "50%", width: 15, height: 15, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
          </button>
          <button onClick={onNotifClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, position: "relative" }}>
            <Bell size={22} color="#444" />
            {notifCount > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: CORAL, color: "white", borderRadius: "50%", width: 15, height: 15, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{notifCount}</span>}
          </button>

        </div>
      </div>
    </div>
  );
}
function SearchBar({ onClick, onKarteClick, onMatchClick }) {
  return (
    <div style={{ background: "white", padding: "8px 12px 9px", position: "sticky", top: 54, zIndex: 99, borderBottom: "1px solid #f0f0f0", display: "flex", gap: 6, alignItems: "center" }}>
      {/* Suchfeld */}
      <div onClick={onClick} style={{ flex: 1, background: "#f4f4f2", borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", minWidth: 0 }}>
        <Search size={15} color="#bbb" style={{ flexShrink: 0 }} />
        <span style={{ color: "#bbb", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Talent, Werk, Name…</span>
        <div style={{ background: `${TEAL}15`, borderRadius: 7, padding: "2px 7px", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <SlidersHorizontal size={11} color={TEAL} />
          <span style={{ fontSize: 10, color: TEAL, fontWeight: 700 }}>Filter</span>
        </div>
      </div>
      {/* Match-Button */}
      <button onClick={onMatchClick} style={{ background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 11, width: 38, height: 38, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 3px 10px ${CORAL}44` }}>
        ✨
      </button>
      {/* Karte-Button */}
      <button onClick={onKarteClick} style={{ background: `${TEAL}15`, border: "none", borderRadius: 11, width: 38, height: 38, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
        🗺
      </button>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// STORY VIEWER (Instagram-Style)
// ══════════════════════════════════════════════════════════════════

// ─── STORIES ───────────────────────────────────────────────────────────────
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
          <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{window.__huiUserName || "Lars M."}</div>
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

function StoryBar({ onStoryClick, following, toggleFollow }) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "12px 16px 8px" }}>
      {mockStories.map((s, idx) => (
        <div key={s.id} onClick={() => onStoryClick && onStoryClick(idx)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 58, cursor: "pointer" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: s.hasNew ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "transparent", padding: s.hasNew ? 2.5 : 0, border: s.hasNew ? "none" : "2.5px solid #e0e0e0" }}>
            <div style={{ borderRadius: "50%", overflow: "hidden", width: "100%", height: "100%", border: s.hasNew ? "2px solid white" : "none" }}>
              <img src={s.img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt={s.name} />
            </div>
          </div>
          <span style={{ fontSize: 10, color: s.hasNew ? CORAL : "#666", fontWeight: s.hasNew ? 700 : 400 }}>{s.name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── CREATE SHEET ──────────────────────────────────────────────────────────
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
                    <span>🌱 Impact Pool (15% der Provision)</span><span>- {(parseFloat(form.preis || 0) * 0.15 * 0.15).toFixed(2)} €</span>
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

function CartOverlay({ cart, onClose, onRemove, onGoToChats }) {
  const [step, setStep] = React.useState("cart"); // cart | address | payment | confirm | done
  const [adresse, setAdresse] = React.useState({ name: window.__huiUserName || "Lars M.", strasse: "Leopoldstr. 42", plz: "80802", ort: "München" });
  const [zahlart, setZahlart] = React.useState("karte");
  const [huiPunkte, setHuiPunkte] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const handleStripeCheckout = async () => {
    setConfirming(true);
    try {
      const amountCents = Math.round(total * 100);
      const itemNames = cart.map(i => i.title).join(", ");
      const res = await fetch('https://michi-6f9abd25.base44.app/functions/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: itemNames.substring(0, 80),
          amountCents,
          itemType: 'werk',
          wirkerName: cart[0]?.creator || 'Talent',
          successUrl: 'https://be-hui.vercel.app?payment=success',
          cancelUrl: 'https://be-hui.vercel.app',
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        try {
          localStorage.setItem("hui_last_booking", JSON.stringify({
            wirkerName: cart[0]?.creator || 'Talent',
            wirkerImg: cart[0]?.creatorImg || '',
            itemName: itemNames,
            totalEur: data.totalEur,
            impactEur: data.impactEur,
          }));
        } catch(e) {}
        window.location.href = data.checkoutUrl;
      } else {
        alert('Fehler: ' + (data.error || 'Unbekannt'));
        setConfirming(false);
      }
    } catch(err) {
      alert('Verbindungsfehler: ' + err.message);
      setConfirming(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price.replace(" €","").replace(",",".")), 0);
  const versand = cart.length > 0 ? 4.50 : 0;
  const rabatt = huiPunkte ? 5 : 0;
  const impactBetrag = (subtotal * 0.15 * 0.15).toFixed(2);
  const total = Math.max(0, subtotal + versand - rabatt);

  const steps = ["cart","address","payment","confirm"];
  const stepIdx = steps.indexOf(step);

  if (step === "done") return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "40px 28px", maxWidth: 340, width: "90%", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#222", marginBottom: 8 }}>Zahlung erfolgreich!</div>
        <div style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 20 }}>
          Dein Kauf ist im <strong style={{ color: TEAL }}>Treuhand</strong> gesichert. Das Geld wird erst nach deiner Bestätigung ans Talent freigegeben.
        </div>
        <div style={{ background: `${TEAL}12`, borderRadius: 14, padding: "14px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEAL, marginBottom: 4 }}>💬 Chat wurde geöffnet</div>
          <div style={{ fontSize: 12, color: "#666" }}>Du kannst jetzt direkt mit dem Talent kommunizieren.</div>
        </div>
        <div style={{ background: `${GOLD}12`, borderRadius: 14, padding: "10px", marginBottom: 20, fontSize: 12, color: "#666" }}>
          ⭐ +25 HUI-Punkte für deinen Kauf gutgeschrieben!
        </div>
        <button onClick={() => { onClose(); if (onGoToChats) onGoToChats(); }} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Zum Chat →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#fafaf8", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: "18px 20px 12px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: step !== "cart" ? 14 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {step !== "cart" && <button onClick={() => setStep(steps[stepIdx-1])} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ArrowLeft size={18} color="#444" /></button>}
              <span style={{ fontWeight: 800, fontSize: 18 }}>
                {step === "cart" ? "🧺 Werkekorb" : step === "address" ? "📦 Lieferadresse" : step === "payment" ? "💳 Zahlung" : "✅ Bestätigen"}
              </span>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#555" /></button>
          </div>
          {/* Schritt-Anzeige */}
          {cart.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: step !== "cart" ? 0 : 10 }}>
              {steps.map((s, i) => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= stepIdx ? CORAL : "#eee" }} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* ── SCHRITT 1: WARENKORB ── */}
          {step === "cart" && <>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🧺</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: "#333" }}>Dein Werkekorb ist leer</div>
                <div style={{ color: "#aaa", fontSize: 13, marginBottom: 24 }}>Entdecke wundervolle Werke und Talente</div>
                <button onClick={onClose} style={{ background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Jetzt entdecken ✨</button>
              </div>
            ) : (
              <>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, background: "white", borderRadius: 14, padding: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                    <img src={item.img} style={{ width: 70, height: 70, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} alt={item.title} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 3 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 6 }}>von {item.creator}</div>
                      <div style={{ fontWeight: 800, color: CORAL, fontSize: 16 }}>{item.price}</div>
                    </div>
                    <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", padding: 4, alignSelf: "flex-start" }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {/* HUI-Punkte einlösen */}
                <div style={{ background: "white", borderRadius: 14, padding: "13px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>⭐</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>100 HUI-Punkte einlösen</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>= 5 € Rabatt</div>
                    </div>
                  </div>
                  <div onClick={() => setHuiPunkte(h => !h)} style={{ width: 44, height: 26, borderRadius: 13, background: huiPunkte ? GOLD : "#ddd", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 3, left: huiPunkte ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                  </div>
                </div>

                {/* Preisübersicht */}
                <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 6 }}><span>Zwischensumme</span><span>{subtotal.toFixed(2)} €</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 6 }}><span>Versand</span><span>{versand.toFixed(2)} €</span></div>
                  {huiPunkte && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: GOLD, marginBottom: 6 }}><span>⭐ HUI-Rabatt</span><span>−5,00 €</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 10 }}><span>🌱 Impact Pool Beitrag</span><span>{impactBetrag} €</span></div>
                  <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 18 }}>
                    <span>Gesamt</span><span style={{ color: CORAL }}>{total.toFixed(2)} €</span>
                  </div>
                </div>

                <div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}20`, borderRadius: 12, padding: "11px 14px", fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                  🔒 Dein Geld wird sicher im <strong>Treuhand</strong> verwahrt und erst nach deiner Bestätigung ans Talent freigegeben.
                </div>
              </>
            )}
          </>}

          {/* ── SCHRITT 2: ADRESSE ── */}
          {step === "address" && (
            <div>
              <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                {[["Name","name"],["Straße & Nr.","strasse"],["PLZ","plz"],["Ort","ort"]].map(([label,key]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 5 }}>{label}</div>
                    <input value={adresse[key]} onChange={e => setAdresse(a => ({...a, [key]: e.target.value}))}
                      style={{ width: "100%", background: "#f7f7f5", border: "1.5px solid #eee", borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#222" }} />
                  </div>
                ))}
              </div>
              <div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}20`, borderRadius: 12, padding: "11px 14px", fontSize: 12, color: "#555" }}>
                📦 Lieferung in 5–7 Werktagen · Sendungsverfolgung per E-Mail
              </div>
            </div>
          )}

          {/* ── SCHRITT 3: ZAHLUNG ── */}
          {step === "payment" && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Zahlungsmethode wählen</div>
              {[
                { id: "karte", icon: "💳", label: "Kreditkarte", sub: "Visa •••• 4242" },
                { id: "paypal", icon: "🅿️", label: "PayPal", sub: "lars@hui.app" },
                { id: "sepa", icon: "🏦", label: "SEPA Lastschrift", sub: "DE•• •••• •••• 4567" },
              ].map(z => (
                <div key={z.id} onClick={() => setZahlart(z.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: "white", borderRadius: 14, padding: "15px 16px", marginBottom: 10, border: zahlart === z.id ? `2px solid ${CORAL}` : "2px solid transparent", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", cursor: "pointer" }}>
                  <span style={{ fontSize: 26 }}>{z.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{z.label}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{z.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${zahlart === z.id ? CORAL : "#ddd"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {zahlart === z.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: CORAL }} />}
                  </div>
                </div>
              ))}
              <div style={{ background: `${GOLD}12`, borderRadius: 12, padding: "11px 14px", fontSize: 12, color: "#666", marginTop: 4 }}>
                ⭐ Nach dem Kauf erhältst du +25 HUI-Punkte
              </div>
            </div>
          )}

          {/* ── SCHRITT 4: BESTÄTIGEN ── */}
          {step === "confirm" && (
            <div>
              {cart.map((item,i) => (
                <div key={i} style={{ display: "flex", gap: 12, background: "white", borderRadius: 14, padding: "12px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <img src={item.img} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} alt="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>von {item.creator}</div>
                    <div style={{ fontWeight: 800, color: CORAL, fontSize: 14, marginTop: 3 }}>{item.price}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#555" }}>📦 Lieferadresse</div>
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{adresse.name}<br/>{adresse.strasse}<br/>{adresse.plz} {adresse.ort}</div>
              </div>
              <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#555" }}>💳 Zahlung</div>
                <div style={{ fontSize: 13, color: "#333" }}>{zahlart === "karte" ? "💳 Visa •••• 4242" : zahlart === "paypal" ? "🅿️ PayPal" : "🏦 SEPA Lastschrift"}</div>
              </div>
              <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 5 }}><span>Zwischensumme</span><span>{subtotal.toFixed(2)} €</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 5 }}><span>Versand</span><span>{versand.toFixed(2)} €</span></div>
                {huiPunkte && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: GOLD, marginBottom: 5 }}><span>⭐ HUI-Rabatt</span><span>−5,00 €</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: TEAL, marginBottom: 8 }}><span>🌱 Impact Pool</span><span>{impactBetrag} €</span></div>
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 18 }}>
                  <span>Gesamt</span><span style={{ color: CORAL }}>{total.toFixed(2)} €</span>
                </div>
              </div>
              <div style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}20`, borderRadius: 12, padding: "11px 14px", fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                🔒 Dein Geld liegt im <strong>HUI-Treuhand</strong>. Es wird erst nach deiner Bestätigung der Lieferung freigegeben.
              </div>
            </div>
          )}
        </div>

        {/* Footer Button */}
        {cart.length > 0 && (
          <div style={{ padding: "12px 16px 28px", background: "white", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
            <button onClick={() => {
              if (step === "cart") setStep("address");
              else if (step === "address") setStep("payment");
              else if (step === "payment") setStep("confirm");
              else handleStripeCheckout();
            }} disabled={confirming} style={{ width: "100%", background: confirming ? "#ccc" : `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 16, cursor: confirming ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {confirming ? (<><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #fff6", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />Weiter zu Stripe…</>) : (step === "cart" ? `Weiter → ${total.toFixed(2)} €` : step === "address" ? "Weiter zur Zahlung →" : step === "payment" ? "Weiter zur Übersicht →" : "💳 Jetzt kaufen & Treuhand öffnen")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ONBOARDING ────────────────────────────────────────────────────────────
function OnboardingCardDetail({ card, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", fontFamily: "'Inter', -apple-system, sans-serif" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: "white", borderRadius: "28px 28px 0 0", padding: "28px 24px 48px" }}>
        <div style={{ width: 40, height: 4, background: "#e0e0e0", borderRadius: 2, margin: "0 auto 24px" }} />
        <div style={{ fontSize: 42, textAlign: "center", marginBottom: 12 }}>{card.emoji}</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#111", textAlign: "center", marginBottom: 10, lineHeight: 1.25 }}>{card.title}</div>
        <div style={{ fontSize: 14, color: "#666", textAlign: "center", lineHeight: 1.75, marginBottom: 20 }}>{card.detail}</div>
        {card.bullets && (
          <div style={{ background: card.bg, borderRadius: 16, padding: "14px 16px", marginBottom: 8 }}>
            {card.bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < card.bullets.length - 1 ? 10 : 0 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{b.icon}</span>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{b.text}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ width: "100%", background: card.color, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 12 }}>
          Verstanden ✓
        </button>
      </div>
    </div>
  );
}

function OnboardingOverlay({ step, setStep, onClose }) {
  const [activeCard, setActiveCard] = React.useState(null);

  const cardDetails = {
    entdecken: {
      emoji: "🛍️", title: "Entdecke echte Talente",
      color: CORAL, bg: `${CORAL}10`,
      detail: "Töpferinnen, Fotografen, Coaches, Musiker – bei HUI triffst du Menschen, die mit Leidenschaft etwas schaffen. Nicht irgendwelche Profile. Echte Gesichter, echte Werke, echte Verbindungen.",
      bullets: [
        { icon: "🎨", text: "Einzigartige Werke direkt vom Schöpfer kaufen" },
        { icon: "📅", text: "Talente buchen – für Workshops, Sessions oder Aufträge" },
        { icon: "🗺️", text: "Wirker in deiner Nähe entdecken" },
      ]
    },
    wirker: {
      emoji: "⚡", title: "Werde Wirker",
      color: TEAL, bg: `${TEAL}10`,
      detail: "Du hast ein Talent? Dann gehörst du zu uns. Teile deine Leidenschaft, biete deine Fähigkeiten an und werde Teil einer Community, die dich wirklich sieht.",
      bullets: [
        { icon: "✨", text: "Profil erstellen und dein Talent zeigen" },
        { icon: "💸", text: "Buchungen annehmen – sicher über das HUI-Treuhandsystem" },
        { icon: "🏅", text: "Verifizierte Empfehlungen aufbauen" },
      ]
    },
    impact: {
      emoji: "🌱", title: "Dein Herz macht den Unterschied",
      color: "#10b981", bg: "#10b98110",
      detail: "Jedes Mal, wenn bei HUI etwas gebucht oder gekauft wird, fließt automatisch ein Teil unserer Einnahmen in Projekte, die wirklich etwas bewegen. Kein Konzern entscheidet. Keine anonymen Spenden. Die HUI-Community wählt gemeinsam – jeden Monat.",
      bullets: [
        { icon: "💚", text: "Echte Projekte mit Herz – lokal, menschlich, spürbar" },
        { icon: "🗳️", text: "Alle Wirker stimmen gemeinsam ab, wer gefördert wird" },
        { icon: "👀", text: "Du siehst, was durch dein Handeln entstanden ist" },
      ]
    },
    punkte: {
      emoji: "⭐", title: "HUI-Punkte – dein Dankeschön",
      color: "#8b5cf6", bg: "#8b5cf610",
      detail: "Bei HUI wird jede gute Tat belohnt. Buchst du, empfiehlst du, oder hilfst du jemandem? Du sammelst HUI-Punkte – und die kannst du gegen echte Vorteile einlösen.",
      bullets: [
        { icon: "📅", text: "Punkte für Buchungen, Empfehlungen & mehr" },
        { icon: "🎁", text: "Rabatte, Gratis-Buchungen oder Boost deines Profils" },
        { icon: "🌱", text: "Punkte direkt in den Impact Pool spenden" },
      ]
    },
  };

  const screens = [
    {
      img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop",
      emoji: "🤍",
      tag: "Willkommen bei HUI",
      title: "Schön, dass du hier bist.",
      sub: "HUI steht für Human United Intelligent – und das meinst du wörtlich. Hier trifft Menschlichkeit auf echte Talente. Kein Algorithmus entscheidet. Die Menschen machen den Unterschied.",
      features: null,
    },
    {
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
      emoji: "🎨",
      tag: "Talente & Werke",
      title: "Jedes Talent hat eine Geschichte.",
      sub: "Hinter jedem Profil steckt ein Mensch mit Leidenschaft. Töpferin, Fotograf, Yoga-Coach, Musiker – sie alle bringen etwas mit, das die Welt ein bisschen schöner macht.",
      features: [
        "Werke mit Seele – direkt vom Schöpfer",
        "Talente buchen, die wirklich für dich da sind",
        "Empfehlungen, die du wirklich vertrauen kannst",
      ],
      gradient: `linear-gradient(160deg, ${CORAL}15 0%, ${GOLD}10 100%)`,
    },
    {
      img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop",
      emoji: "🌱",
      tag: "Mit Herz dabei",
      title: "Dein Handeln hinterlässt Spuren.",
      sub: "Bei HUI bleibt kein Kauf ohne Wirkung. Ein Teil unserer Einnahmen fließt automatisch in Herzens-Projekte – ausgewählt von der ganzen Community. Nicht wir entscheiden. Ihr.",
      features: [
        "Projekte mit Herz – von der Community gewählt",
        "Alle Wirker stimmen gemeinsam ab",
        "Du siehst, was durch dich entstanden ist",
      ],
      gradient: `linear-gradient(160deg, #10b98115 0%, ${TEAL}10 100%)`,
    },
    {
      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      emoji: "🚀",
      tag: "Los geht's",
      title: "Was magst du als Erstes entdecken?",
      sub: "Tippe auf eine Karte um mehr zu erfahren – oder leg einfach los.",
      features: null,
      isFinal: true,
    },
  ];

  const touchStartX = React.useRef(null);
  const [animDir, setAnimDir] = React.useState(null);
  const [visible, setVisible] = React.useState(true);

  const goTo = (next, dir) => {
    if (next < 0 || next >= screens.length) return;
    setVisible(false);
    setAnimDir(dir);
    setTimeout(() => {
      setStep(next);
      setAnimDir(null);
      setVisible(true);
    }, 200);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 5) return;
    if (dx < -50 && step < screens.length - 1) goTo(step + 1, "left");
    if (dx > 50 && step > 0) goTo(step - 1, "right");
  };

  const s = screens[step];

  const slideStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : animDir === "left" ? "translateX(36px)" : "translateX(-36px)",
    transition: "opacity 0.22s ease, transform 0.22s ease",
  };

  const FinalCard = ({ cardKey, emoji, label, sub, color, bg }) => {
    const [pressed, setPressed] = React.useState(false);
    return (
      <button
        onClick={() => setActiveCard(cardDetails[cardKey])}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          background: pressed ? bg.replace("10", "22") : bg,
          borderRadius: 18, padding: "16px 12px", textAlign: "center",
          border: `1.5px solid ${color}33`,
          cursor: "pointer", outline: "none",
          transform: pressed ? "scale(0.94)" : "scale(1)",
          transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.15s",
          WebkitTapHighlightColor: "transparent",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontWeight: 800, fontSize: 13, color: "#222" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 3, lineHeight: 1.4 }}>{sub}</div>
        <div style={{ fontSize: 10, color: color, fontWeight: 700, marginTop: 6, display: "flex", alignItems: "center", gap: 2 }}>
          Mehr erfahren <span style={{ fontSize: 12 }}>→</span>
        </div>
      </button>
    );
  };

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000", display: "flex", flexDirection: "column", fontFamily: "'Inter', -apple-system, sans-serif" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <div style={{ position: "relative", width: "100%", height: "48%", overflow: "hidden" }}>
          <img src={s.img} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85, transition: "opacity 0.4s ease" }} alt="" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)" }} />
          {/* Tag */}
          <div style={{ ...slideStyle, position: "absolute", top: 52, left: 20 }}>
            <div style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 99, padding: "5px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{s.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "white", letterSpacing: 0.4 }}>{s.tag}</span>
            </div>
          </div>
          {/* Skip */}
          {step < screens.length - 1 && (
            <button onClick={onClose} style={{ position: "absolute", top: 52, right: 20, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 99, padding: "5px 16px", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Überspringen
            </button>
          )}
        </div>

        {/* Bottom card */}
        <div style={{ flex: 1, background: "white", borderRadius: "28px 28px 0 0", marginTop: -28, padding: "22px 22px 36px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Dots */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
            {screens.map((_, i) => (
              <button key={i} onClick={() => goTo(i, i > step ? "left" : "right")} style={{ border: "none", cursor: "pointer", padding: 0, background: "none" }}>
                <div style={{ width: i === step ? 24 : 7, height: 7, borderRadius: 4, background: i === step ? CORAL : "#e8e8e8", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }} />
              </button>
            ))}
          </div>

          {/* Logo on first screen */}
          {step === 0 && (
            <div style={{ ...slideStyle, display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div style={{ position: "relative" }}>
                <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 70, height: 70, borderRadius: 20, objectFit: "cover", boxShadow: "0 8px 28px rgba(255,107,91,0.28)" }} />
                <div style={{ position: "absolute", bottom: -5, right: -5, width: 22, height: 22, background: TEAL, borderRadius: "50%", border: "2.5px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11 }}>✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Title & Sub */}
          <div style={slideStyle}>
            <div style={{ fontWeight: 900, fontSize: 23, color: "#111", textAlign: "center", marginBottom: 10, lineHeight: 1.25 }}>{s.title}</div>
            <div style={{ color: "#777", fontSize: 14, textAlign: "center", lineHeight: 1.7, marginBottom: s.features ? 18 : 0 }}>{s.sub}</div>
          </div>

          {/* Feature list */}
          {s.features && (
            <div style={{ ...slideStyle, background: s.gradient || "#f9f9f7", borderRadius: 16, padding: "14px 16px", marginBottom: 4 }}>
              {s.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < s.features.length - 1 ? 11 : 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={12} color="white" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Final screen – clickable cards */}
          {s.isFinal && (
            <div style={{ ...slideStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8, marginTop: 4 }}>
              <FinalCard cardKey="entdecken" emoji="🛍️" label="Entdecken" sub="Talente & Werke" color={CORAL} bg={`${CORAL}10`} />
              <FinalCard cardKey="wirker" emoji="⚡" label="Wirker werden" sub="Talent anbieten" color={TEAL} bg={`${TEAL}10`} />
              <FinalCard cardKey="impact" emoji="🌱" label="Mit Herz dabei" sub="Projekte mit Wirkung" color="#10b981" bg="#10b98110" />
              <FinalCard cardKey="punkte" emoji="⭐" label="HUI-Punkte" sub="Sammeln & einlösen" color="#8b5cf6" bg="#8b5cf610" />
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* CTA */}
          {step < screens.length - 1 ? (
            <button
              onClick={() => goTo(step + 1, "left")}
              style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, #FF8C5A)`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 6px 20px ${CORAL}44`, transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
              onPointerDown={e => { e.currentTarget.style.transform = "scale(0.96)"; e.currentTarget.style.boxShadow = `0 2px 8px ${CORAL}33`; }}
              onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 6px 20px ${CORAL}44`; }}
              onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 6px 20px ${CORAL}44`; }}
            >
              Weiter →
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 6px 24px ${CORAL}55`, transition: "transform 0.15s ease" }}
              onPointerDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              Jetzt loslegen ✨
            </button>
          )}
        </div>
      </div>

      {/* Card Detail Modal */}
      {activeCard && <OnboardingCardDetail card={activeCard} onClose={() => setActiveCard(null)} />}
    </>
  );
}
// ══════════════════════════════════════════════════════════════════
// PROJEKT VORSCHLAGEN – Formular (Overlay)
// ══════════════════════════════════════════════════════════════════

// ─── PROJEKT VORSCHLAGEN ───────────────────────────────────────────────────
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
                  → ca. <strong>{Math.round(parseFloat(form.budgetZiel || 0) / (75 * 0.15 * 0.15)).toLocaleString("de")} Buchungen</strong> (à 75€) auf HUI nötig
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

// ─── IMPACT PROJECT DETAIL ─────────────────────────────────────────────────
function ImpactProjectDetail({ project: p, onClose }) {
  const [tab, setTab] = useState("info"); // info | updates | meilensteine
  const [showSpende, setShowSpende] = React.useState(false);
  const [spendeBetrag, setSpendeBetrag] = React.useState(10);
  const [spendeDone, setSpendeDone] = React.useState(false);

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
                <span>Dieses Projekt wird durch den <strong>HUI Impact Pool</strong> finanziert – 15% der HUI-Provision fließt automatisch in ausgewählte Projekte. Jedes Projekt, das wir unterstützen, trägt HUIs Mission in die Welt.</span>
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
                <div style={{ textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#ccc", marginBottom: 6 }}>Noch keine Updates</div>
          <div style={{ fontSize: 12, color: "#ddd", lineHeight: 1.6 }}>Sobald dein Impact Pool wächst, erscheinen hier die Neuigkeiten der geförderten Projekte.</div>
        </div>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
          {!showSpende ? (
            <button onClick={() => setShowSpende(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              🌱 Projekt unterstützen
            </button>
          ) : spendeDone ? (
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌿</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: TEAL, marginBottom: 4 }}>Danke für deine Unterstützung!</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>+30 HUI-Punkte wurden gutgeschrieben ⭐</div>
              <button onClick={onClose} style={{ background: TEAL, color: "white", border: "none", borderRadius: 12, padding: "11px 28px", fontWeight: 700, cursor: "pointer" }}>Schließen</button>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 10 }}>Betrag wählen</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {[5, 10, 25, 50].map(b => (
                  <button key={b} onClick={() => setSpendeBetrag(b)} style={{ flex: 1, padding: "11px 0", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", background: spendeBetrag === b ? `linear-gradient(135deg, ${TEAL}, ${GOLD})` : "#f0f0f0", color: spendeBetrag === b ? "white" : "#555" }}>
                    {b} €
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowSpende(false)} style={{ flex: 1, background: "none", border: "1.5px solid #ddd", borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: 14, color: "#888", cursor: "pointer" }}>
                  Abbrechen
                </button>
                <button onClick={() => setSpendeDone(true)} style={{ flex: 2, background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`, border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, color: "white", cursor: "pointer" }}>
                  🌱 {spendeBetrag} € spenden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── TALENT ANBIETEN ───────────────────────────────────────────────────────
function TalentAnbietenPage({ onClose, onSuccess }) {
  const TEAL = "#2ABFAC";
  const CORAL = "#FF6B6B";
  const [selected, setSelected] = React.useState(null);
  const [done, setDone] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const options = [
    { key: "werke", icon: "🎨", label: "Werke", sub: "Zeige und verkaufe deine Werke — Kunst, Fotos, Design, Produkte und mehr.", color: CORAL },
    { key: "wirker_erlebnisse", icon: "🤝", label: "Wirker / Erlebnisse", sub: "Biete deine Fähigkeiten und einzigartige Erlebnisse an — Coaching, Workshops, Events und mehr.", color: TEAL },
    { key: "beides", icon: "✨", label: "Beides", sub: "Du möchtest Werke verkaufen und gleichzeitig als Wirker oder mit Erlebnissen aktiv sein.", color: "#A78BFA" },
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


// ─── TAB BAR ────────────────────────────────────────────────────────────────
function TabBar({ page, setPage, setShowOnboarding, setOnboardingStep, isNewUser, onPlusClick }) {
  const [plusPressed, setPlusPressed] = React.useState(false);
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, background: "white",
      borderTop: "1px solid #eee", display: "flex", alignItems: "center",
      justifyContent: "space-around", padding: "6px 0 20px", zIndex: 200,
      boxShadow: "0 -2px 24px rgba(0,0,0,0.09)",
    }}>
      <TabButton label="Home" icon={<Home size={22} />} active={page === "home"} onClick={() => { setPage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      <TabButton label="Impact" icon={<Leaf size={22} />} active={page === "impact"} onClick={() => { setPage("impact"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      {isNewUser ? (
        <button onClick={() => { setPage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: -22, WebkitTapHighlightColor: "transparent" }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", overflow: "hidden", boxShadow: `0 4px 18px ${GOLD}66`, animation: "huiPulse 2.4s ease-in-out infinite" }}>
            <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 0.3 }}>Entdecke HUI</span>
        </button>
      ) : (
        <button
          onClick={onPlusClick}
          onPointerDown={() => setPlusPressed(true)}
          onPointerUp={() => setPlusPressed(false)}
          onPointerLeave={() => setPlusPressed(false)}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${CORAL}, #FF8C5A)`,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: -22,
            boxShadow: plusPressed ? `0 2px 8px ${CORAL}55` : `0 6px 20px ${CORAL}66`,
            transform: plusPressed ? "scale(0.88)" : "scale(1)",
            transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
            WebkitTapHighlightColor: "transparent", outline: "none",
          }}
        >
          <Plus size={26} color="white" strokeWidth={2.5} style={{
            transform: plusPressed ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }} />
        </button>
      )}
      <TabButton label="Favoriten" icon={<Star size={22} />} active={page === "favorites"} onClick={() => { setPage("favorites"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      <TabButton label="Profil" icon={<User size={22} />} active={page === "profile"} onClick={() => { setPage("profile"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
    </div>
  );
}
function TabButton({ label, icon, active, onClick }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        minWidth: 52, padding: "2px 0",
        transform: pressed ? "scale(0.82)" : active ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
      }}
    >
      <span style={{
        color: active ? CORAL : "#AABBB8",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: 12,
        background: active ? `${CORAL}14` : "transparent",
        transition: "background 0.22s ease, color 0.22s ease",
      }}>{icon}</span>
      <span style={{
        fontSize: 10, fontWeight: active ? 700 : 400,
        color: active ? CORAL : "#AABBB8",
        transition: "color 0.22s ease, font-weight 0.22s ease",
      }}>{label}</span>
      <span style={{
        width: active ? 18 : 0, height: 3, borderRadius: 2,
        background: CORAL,
        transition: "width 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        marginTop: 1,
      }} />
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
// HUI ONBOARDING — 3 screens shown ONCE before registration
// ══════════════════════════════════════════════════════════════════

// ─── ONBOARDING SCREENS ─────────────────────────────────────────────────────
function HuiOnboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(true);
  const touchStartX = React.useRef(null);

  const slides = [
    {
      bg: `linear-gradient(160deg, #fff8f6 0%, #fff3ee 100%)`,
      img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop",
      emoji: "🤍",
      tag: "Willkommen bei HUI",
      title: "Schön, dass du hier bist.",
      sub: "HUI verbindet echte Menschen mit echten Talenten. Hier entscheiden nicht Algorithmen — sondern du.",
      accent: CORAL,
    },
    {
      bg: `linear-gradient(160deg, #f0fffe 0%, #e8fff9 100%)`,
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop",
      emoji: "🎨",
      tag: "Talente & Werke",
      title: "Jedes Talent hat eine Geschichte.",
      sub: "Töpfer, Fotografen, Coaches, Musiker — buche echte Menschen oder kaufe einzigartige Werke direkt vom Schöpfer.",
      accent: TEAL,
      features: ["Werke mit Seele – direkt vom Schöpfer", "Talente buchen, die wirklich für dich da sind", "Empfehlungen von echten Menschen"],
    },
    {
      bg: `linear-gradient(160deg, #f0fff8 0%, #e8f8ff 100%)`,
      img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=500&fit=crop",
      emoji: "🌱",
      tag: "Dein Impact",
      title: "Jede Buchung bewegt etwas.",
      sub: "Ein Teil jeder Transaktion fließt automatisch in Herzensprojekte — ausgewählt von der Community. Nicht wir entscheiden. Ihr.",
      accent: "#10b981",
      features: ["Projekte mit Herz – von der Community gewählt", "Wirker stimmen monatlich gemeinsam ab", "Du siehst was durch dich entstanden ist"],
    },
  ];

  const goTo = (next) => {
    if (animating || next < 0 || next >= slides.length) return;
    setAnimating(true);
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
      setAnimating(false);
    }, 220);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -50 && step < slides.length - 1) goTo(step + 1);
    if (dx > 50 && step > 0) goTo(step - 1);
  };

  const s = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: "100vh", background: s.bg, display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", fontFamily: "'Inter', -apple-system, sans-serif", transition: "background 0.4s ease", overflow: "hidden" }}
    >
      {/* Skip */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px 0" }}>
        <button onClick={onDone} style={{ background: "none", border: "none", color: "#aaa", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Überspringen</button>
      </div>

      {/* Image */}
      <div style={{ position: "relative", margin: "8px 20px 0", borderRadius: 24, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={s.img}
          alt=""
          style={{ width: "100%", height: 240, objectFit: "cover", display: "block", opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(1.03)", transition: "opacity 0.25s ease, transform 0.25s ease" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35) 100%)" }} />
        <div style={{ position: "absolute", top: 12, left: 14, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: s.accent }}>
          {s.emoji} {s.tag}
        </div>
      </div>

      {/* Content */}
      <div
        style={{ flex: 1, padding: "24px 24px 0", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.25s ease, transform 0.25s ease" }}
      >
        <div style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2, marginBottom: 10, letterSpacing: -0.5 }}>{s.title}</div>
        <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 18 }}>{s.sub}</div>
        {s.features && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {s.features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 12, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ padding: "24px 24px 40px" }}>
        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 20 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, background: i === step ? s.accent : "#ddd", border: "none", padding: 0, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }} />
          ))}
        </div>
        {/* CTA */}
        <button
          onClick={() => isLast ? onDone() : goTo(step + 1)}
          style={{ width: "100%", background: `linear-gradient(135deg, ${s.accent}, ${s.accent}cc)`, color: "white", border: "none", borderRadius: 16, padding: "15px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 6px 24px ${s.accent}44`, transition: "all 0.2s" }}
        >
          {isLast ? "Jetzt kostenlos registrieren →" : "Weiter"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HUI AUTH SCREEN — Clean Login / Register
// ══════════════════════════════════════════════════════════════════
function WelcomeOnboarding({ onDone }) {
  const TEAL = "#2ABFAC";
  const CORAL = "#FF6B6B";
  const [selected, setSelected] = React.useState(null);
  const [leaving, setLeaving] = React.useState(false);

  const handleSelect = async (choice) => {
    setSelected(choice);
    setLeaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("profiles").upsert({ id: session.user.id, role: choice === "entdecker" ? "entdecker" : "talent", updated_at: new Date().toISOString() });
      }
    } catch(e) {}
    setTimeout(() => onDone(choice), 400);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fff8f6 0%, #f0fffe 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", opacity: leaving ? 0 : 1, transition: "opacity 0.4s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 340 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>❤️</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", letterSpacing: -0.5, lineHeight: 1.25, marginBottom: 10 }}>Herzlich willkommen<br/>bei HUI</div>
        <div style={{ fontSize: 15, color: "#999", lineHeight: 1.6 }}>Was möchtest du hier tun?</div>
      </div>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
        <div onClick={() => handleSelect("entdecker")} style={{ background: "white", borderRadius: 24, padding: "28px 24px", border: `2.5px solid ${selected === "entdecker" ? TEAL : "#f0f0f0"}`, cursor: "pointer", boxShadow: selected === "entdecker" ? `0 8px 32px ${TEAL}30` : "0 2px 16px rgba(0,0,0,0.06)", transform: selected === "entdecker" ? "scale(1.02)" : "scale(1)", transition: "all 0.2s ease" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🌍</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a", marginBottom: 5 }}>Ich möchte entdecken</div>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 1.55 }}>Werke finden, Künstler entdecken und Projekte unterstützen</div>
              <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["🎨 Kunst", "🎵 Musik", "🌱 Impact"].map(tag => <span key={tag} style={{ background: `${TEAL}12`, color: TEAL, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{tag}</span>)}
              </div>
            </div>
          </div>
        </div>
        <div onClick={() => handleSelect("talent")} style={{ background: "white", borderRadius: 24, padding: "28px 24px", border: `2.5px solid ${selected === "talent" ? CORAL : "#f0f0f0"}`, cursor: "pointer", boxShadow: selected === "talent" ? `0 8px 32px ${CORAL}30` : "0 2px 16px rgba(0,0,0,0.06)", transform: selected === "talent" ? "scale(1.02)" : "scale(1)", transition: "all 0.2s ease" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `${CORAL}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>✨</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a", marginBottom: 5 }}>Ich möchte mein Talent teilen</div>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 1.55 }}>Meine Werke und Fähigkeiten mit anderen Menschen teilen</div>
              <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["💼 Aufträge", "🌟 Sichtbarkeit", "💛 Community"].map(tag => <span key={tag} style={{ background: `${CORAL}12`, color: CORAL, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{tag}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#ccc", marginTop: 24 }}>Du kannst das jederzeit in deinem Profil ändern</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════

function HuiAuthScreen({ onLogin }) {
  const TEAL = "#2ABFAC";
  const CORAL = "#FF6B6B";
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  const handleAuth = async () => {
    setError("");
    if (!email.trim()) { setError("Bitte E-Mail eingeben"); return; }
    if (!password || password.length < 6) { setError("Passwort muss mindestens 6 Zeichen haben"); return; }
    if (mode === "register" && !name.trim()) { setError("Bitte deinen Namen eingeben"); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
        if (signUpError) { setError(signUpError.message); setLoading(false); return; }
        localStorage.setItem("hui_user", JSON.stringify({ email, name: name.trim() }));
        onLogin("welcome");
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginError) { setError("E-Mail oder Passwort falsch"); setLoading(false); return; }
        localStorage.setItem("hui_user", JSON.stringify({ email, name: email.split("@")[0] }));
        onLogin("app");
      }
    } catch(e) { setError("Verbindungsfehler. Bitte nochmal versuchen."); }
    setLoading(false);
  };

  const inputStyle = (field) => ({ width: "100%", border: `1.5px solid ${focused === field ? TEAL : "#eee"}`, borderRadius: 14, padding: "14px 44px 14px 14px", fontSize: 15, outline: "none", boxSizing: "border-box", color: "#222", background: focused === field ? `${TEAL}06` : "white", transition: "border 0.2s, background 0.2s", fontFamily: "inherit" });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fff8f6 0%, #f0fffe 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 72, height: 72, borderRadius: 20, objectFit: "cover", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }} />
        <div style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a" }}>{mode === "register" ? "Konto erstellen ✨" : "Willkommen zurück"}</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{mode === "register" ? "Human United Intelligent" : "Schön, dass du wieder da bist 🤍"}</div>
      </div>
      <div style={{ background: "white", borderRadius: 24, padding: "24px 22px", width: "100%", maxWidth: 380, boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", background: "#f5f5f3", borderRadius: 14, padding: 4, marginBottom: 22 }}>
          {[["register","Registrieren"],["login","Anmelden"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px 0", background: mode === m ? "white" : "transparent", border: "none", borderRadius: 11, fontWeight: mode === m ? 700 : 500, fontSize: 14, color: mode === m ? "#1a1a1a" : "#888", cursor: "pointer", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>
        {mode === "register" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, marginBottom: 6 }}>DEIN NAME</div>
            <div style={{ position: "relative" }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Sofia Mayer" onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} style={inputStyle("name")} />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>👤</span>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, marginBottom: 6 }}>E-MAIL</div>
          <div style={{ position: "relative" }}>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="deine@email.de" onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} style={inputStyle("email")} />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>✉️</span>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, marginBottom: 6 }}>PASSWORT</div>
          <div style={{ position: "relative" }}>
            <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? "text" : "password"} placeholder="Mindestens 6 Zeichen" onFocus={() => setFocused("pw")} onBlur={() => setFocused(null)} style={inputStyle("pw")} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</button>
          </div>
        </div>
        {error && <div style={{ background: "#fff0f0", border: "1px solid #ffcdd2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e53935", marginBottom: 16 }}>{error}</div>}
        <button onClick={handleAuth} disabled={loading} style={{ width: "100%", background: loading ? "#ccc" : `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 800, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : `0 6px 20px ${TEAL}40`, transition: "all 0.2s" }}>
          {loading ? "⏳ Bitte warten..." : mode === "register" ? "Registrieren" : "Anmelden"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#aaa" }}>
          {mode === "register" ? "Schon dabei? " : "Neu hier? "}
          <span onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }} style={{ color: CORAL, fontWeight: 700, cursor: "pointer" }}>{mode === "register" ? "Einloggen" : "Registrieren"}</span>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = React.useState("login"); // login | register
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleAuth = () => {
    if (!email || !password) { setError("Bitte E-Mail und Passwort eingeben"); return; }
    if (mode === "register" && !name) { setError("Bitte Name eingeben"); return; }
    setLoading(true); setError("");
    // Demo-Login: nach 800ms einloggen
    setTimeout(() => {
      localStorage.setItem("hui_user", JSON.stringify({ email, name: name || email.split("@")[0] }));
      onLogin();
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fff8f6 0%, #f0fffe 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 80, height: 80, borderRadius: 22, objectFit: "cover", boxShadow: "0 8px 32px rgba(255,107,91,0.25)", marginBottom: 16 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "#888", letterSpacing: 0.3 }}>
          <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17 }}>H</span>uman{" "}
          <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17 }}>U</span>nited{" "}
          <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17 }}>I</span>ntelligent
        </div>
        <div style={{ fontSize: 13, color: "#bbb", marginTop: 4 }}>Echte Talente. Echte Verbindungen.</div>
      </div>

      {/* Card */}
      <div style={{ background: "white", borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
        {/* Tab */}
        <div style={{ display: "flex", background: "#f5f5f3", borderRadius: 14, padding: 4, marginBottom: 24 }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: "pointer", background: mode === m ? "white" : "transparent", color: mode === m ? "#222" : "#aaa", boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>
              {m === "login" ? "Anmelden" : "Registrieren"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 6 }}>VOLLSTÄNDIGER NAME</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Sofia Mayer"
              style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "13px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#222" }} />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 6 }}>E-MAIL</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.de"
            style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "13px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#222" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 6 }}>PASSWORT</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "13px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#222" }}
            onKeyDown={e => e.key === "Enter" && handleAuth()} />
        </div>

        {error && <div style={{ background: "#fff0f0", border: "1px solid #fcd", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: "#e33", marginBottom: 14 }}>{error}</div>}

        <button onClick={handleAuth} disabled={loading} style={{ width: "100%", background: loading ? "#ddd" : "linear-gradient(135deg, #FF6B5B, #F5A623)", color: "white", border: "none", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Laden..." : mode === "login" ? "Anmelden →" : "Account erstellen →"}
        </button>

        {mode === "login" && (
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#aaa", cursor: "pointer" }}>
            Passwort vergessen?
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "#ccc", lineHeight: 1.6 }}>
        Mit der Anmeldung stimmst du den{" "}
        <span style={{ color: "#FF6B00", cursor: "pointer" }}>Nutzungsbedingungen</span>{" "}
        und der{" "}
        <span style={{ color: "#FF6B00", cursor: "pointer" }}>Datenschutzerklärung</span>{" "}
        zu.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HUI-MATCH — KI-gestütztes Talent-Matching
// ══════════════════════════════════════════════════════════════════
const MATCH_WIRKER = [
  { id: 1, name: "Sofia M.", talent: "Keramik-Künstlerin", location: "München", rating: 4.9, reviews: 47, rate: "38€/h", img: null, skills: ["handgedreht", "glasiert", "Unikate", "nachhaltig", "kreativ"], bio: "Ich forme Alltagskunst aus Ton — jedes Stück ein Unikat mit Seele." },
  { id: 2, name: "Tom K.", talent: "Garten-Designer", location: "12 km entfernt", rating: 4.8, reviews: 31, rate: "55€/h", img: null, skills: ["Naturgarten", "Permakultur", "nachhaltig", "Planung", "Bepflanzung"], bio: "Natürliche Gärten die atmen. Kein Kunstrasen, nur echtes Leben." },
  { id: 3, name: "Lena B.", talent: "Illustratorin", location: "Berlin", rating: 5.0, reviews: 89, rate: "60€/h", img: null, skills: ["Aquarell", "digital", "Portraits", "kreativ", "Unikate"], bio: "Farbe, Form und Gefühl — ich male was du fühlst aber nicht ausdrücken kannst." },
  { id: 4, name: "Marcus W.", talent: "Schreiner", location: "Hamburg", rating: 4.7, reviews: 24, rate: "65€/h", img: null, skills: ["Massivholz", "Möbel", "nachhaltig", "Maßanfertigung", "kreativ"], bio: "Möbel die Generationen überdauern. Keine Spanplatten, nur echtes Holz." },
  { id: 5, name: "Anna S.", talent: "Yoga-Lehrerin", location: "Wien", rating: 4.9, reviews: 112, rate: "45€/h", img: null, skills: ["Hatha", "Vinyasa", "Meditation", "online", "persönlich"], bio: "Bewegung, Atem, Stille — ich begleite dich auf deinem Weg." },
  { id: 6, name: "Felix R.", talent: "Fotograf", location: "Zürich", rating: 4.8, reviews: 58, rate: "90€/h", img: null, skills: ["Portrait", "Event", "Natur", "kreativ", "nachhaltig"], bio: "Ich halte Momente fest die sonst vergehen — ehrlich, lebendig, echt." },
];

function scoreMatch(wirker, query) {
  const q = query.toLowerCase();
  let score = 0;
  const reasons = [];
  wirker.skills.forEach(s => {
    if (q.includes(s.toLowerCase()) || s.toLowerCase().split("").some(c => q.includes(c) && c.length > 2)) {
      score += 2;
    }
  });
  // Keyword matching
  const keywords = q.split(/\s+/);
  keywords.forEach(kw => {
    if (kw.length < 3) return;
    wirker.skills.forEach(s => { if (s.toLowerCase().includes(kw)) { score += 3; reasons.push(s); } });
    if (wirker.talent.toLowerCase().includes(kw)) { score += 5; }
    if (wirker.bio.toLowerCase().includes(kw)) { score += 1; }
  });
  // Budget check
  const budgetMatch = query.match(/(\d+)\s*€/);
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[1]);
    const rate = parseInt(wirker.rate);
    if (rate <= budget) { score += 4; reasons.push("im Budget"); }
  }
  // Nachhaltig bonus
  if (q.includes("nachhaltig") && wirker.skills.includes("nachhaltig")) { score += 5; reasons.push("nachhaltig"); }
  if (q.includes("kreativ") && wirker.skills.includes("kreativ")) { score += 3; reasons.push("kreativ"); }
  // Unique reasons
  const uniqueReasons = [...new Set(reasons)].slice(0, 3);
  if (uniqueReasons.length === 0) {
    uniqueReasons.push(wirker.talent, `${wirker.reviews} Bewertungen`);
  }
  return { score, reasons: uniqueReasons };
}

function getMatches(query) {
  const scored = MATCH_WIRKER.map(w => {
    const { score, reasons } = scoreMatch(w, query);
    return { ...w, score, reasons };
  }).sort((a, b) => b.score - a.score);
  // Top 3, immer mindestens 3 zurückgeben
  return scored.slice(0, 3).map((w, i) => ({
    ...w,
    reasons: w.reasons.length > 0 ? w.reasons : [w.talent, `${w.rating}★ Bewertung`, `${w.reviews} Empfehlungen`]
  }));
}

const AVATARS = ["🧑‍🎨","🌿","🎨","🪚","🧘","📸"];
const LOAD_PHRASES = [
  "HUI analysiert deine Anfrage…",
  "Vergleiche Talente und Skills…",
  "Prüfe Verfügbarkeit & Budget…",
  "Finde die besten 3 Matches…",
];


// ─── MAP + MATCH OVERLAYS ───────────────────────────────────────────────────
function HuiMatchOverlay({ onClose, onViewWirker }) {
  const [step, setStep] = useState("input"); // input | loading | result
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [loadPhrase, setLoadPhrase] = useState(0);
  const [dbWirkerForMatch, setDbWirkerForMatch] = useState([]);
  const textRef = useRef(null);

  useEffect(() => {
    supabase.from('wirker').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        const mapped = data.map(w => ({
          id: w.id, name: w.name || w.full_name,
          talent: w.talent || "", location: w.location || "",
          bio: w.bio || "", skills: w.skills || [],
          rate: w.hourly_rate || 0, reviews: w.recommendations || w.bookings || 0,
          rating: 4.8, img: w.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
          verified: w.verified || false,
        }));
        setDbWirkerForMatch(mapped);
      }
    }).catch(() => {});
  }, []);

  const startMatch = () => {
    if (!query.trim()) return;
    setStep("loading");
    setLoadPhrase(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setLoadPhrase(i);
      if (i >= LOAD_PHRASES.length - 1) clearInterval(interval);
    }, 700);
    setTimeout(() => {
      clearInterval(interval);
      // Use DB wirker if available, otherwise mock
      const wirkerPool = dbWirkerForMatch.length > 0 ? [...dbWirkerForMatch, ...MATCH_WIRKER] : MATCH_WIRKER;
      const scored = wirkerPool.map(w => {
        const { score, reasons } = scoreMatch(w, query);
        return { ...w, score, reasons };
      }).sort((a, b) => b.score - a.score);
      const results = scored.slice(0, 3).map(w => ({
        ...w,
        reasons: w.reasons.length > 0 ? w.reasons : [w.talent, `${w.reviews} Empfehlungen`]
      }));
      setMatches(results);
      setStep("result");
    }, 3000);
  };

  const suggestions = [
    "Ich suche jemanden für meinen Garten, nachhaltig, Budget 500€",
    "Kreative Illustration für mein Buchprojekt gesucht",
    "Yoga-Kurse online, 2x pro Woche",
    "Maßgefertigte Holzmöbel für mein Wohnzimmer",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: `0 4px 14px ${CORAL}44` }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#222" }}>HUI-Match</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>KI findet dein perfektes Talent</div>
          </div>
          <button onClick={onClose} style={{ background: "#f3f3f3", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>

          {/* INPUT STEP */}
          {step === "input" && (<>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 14, lineHeight: 1.6 }}>
              Beschreib einfach was du brauchst — die KI findet die <strong>3 besten Talente</strong> für dich.
            </div>
            <textarea
              ref={textRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="z.B. Ich suche einen kreativen Gärtner für meinen Balkon, nachhaltig, Budget 300€…"
              style={{ width: "100%", minHeight: 110, borderRadius: 16, border: "2px solid #f0f0f0", padding: "14px", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", color: "#333", lineHeight: 1.6, transition: "border 0.2s", boxSizing: "border-box" }}
              onFocus={e => e.target.style.border = `2px solid ${CORAL}`}
              onBlur={e => e.target.style.border = "2px solid #f0f0f0"}
            />
            {/* Suggestions */}
            <div style={{ marginTop: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Beispiele</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setQuery(s)} style={{ background: "#f7f7f5", border: "none", borderRadius: 10, padding: "9px 12px", textAlign: "left", fontSize: 13, color: "#555", cursor: "pointer", lineHeight: 1.4 }}>
                    💡 {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startMatch}
              disabled={!query.trim()}
              style={{ width: "100%", background: query.trim() ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "#e0e0e0", color: "white", border: "none", borderRadius: 16, padding: "15px", fontWeight: 800, fontSize: 16, cursor: query.trim() ? "pointer" : "default", boxShadow: query.trim() ? `0 6px 20px ${CORAL}44` : "none", transition: "all 0.2s" }}
            >
              ✨ HUI-Match starten
            </button>
          </>)}

          {/* LOADING STEP */}
          {step === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
              <div style={{ position: "relative", width: 80, height: 80, marginBottom: 28 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `linear-gradient(135deg, ${CORAL}33, ${GOLD}33)`, animation: "matchPulse 1.2s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✨</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 8, textAlign: "center" }}>
                {LOAD_PHRASES[Math.min(loadPhrase, LOAD_PHRASES.length - 1)]}
              </div>
              <div style={{ fontSize: 13, color: "#aaa", textAlign: "center" }}>Einen Moment…</div>
              <div style={{ display: "flex", gap: 6, marginTop: 24 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === loadPhrase % 3 ? CORAL : "#e0e0e0", transition: "background 0.3s" }} />
                ))}
              </div>
              <style>{`@keyframes matchPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }`}</style>
            </div>
          )}

          {/* RESULT STEP */}
          {step === "result" && (<>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ background: `${TEAL}18`, color: TEAL, fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 8 }}>✓ 3 Matches gefunden</span>
              <span>für: <em>"{query.length > 40 ? query.slice(0,40)+"…" : query}"</em></span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {matches.map((w, idx) => (
                <div key={w.id} style={{ background: idx === 0 ? `linear-gradient(135deg, ${CORAL}08, ${GOLD}08)` : "white", border: `2px solid ${idx === 0 ? CORAL+"33" : "#f0f0f0"}`, borderRadius: 18, padding: "16px", position: "relative" }}>
                  {idx === 0 && (
                    <div style={{ position: "absolute", top: -10, left: 16, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 0.5 }}>
                      🏆 BESTER MATCH
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 15, background: `linear-gradient(135deg, ${CORAL}22, ${GOLD}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {AVATARS[w.id - 1] || "👤"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: CORAL, fontWeight: 600 }}>{w.talent}</div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>📍 {w.location} · ⭐ {w.rating} ({w.reviews}) · {w.rate}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 10 }}>
                    "{w.bio}"
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 6 }}>✅ PASST WEIL</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {w.reasons.map((r, i) => (
                        <span key={i} style={{ background: `${TEAL}15`, color: TEAL, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>{r}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onViewWirker(w.name)} style={{ flex: 1, background: "white", border: `1.5px solid ${CORAL}44`, borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 13, color: CORAL, cursor: "pointer" }}>
                      Profil ansehen
                    </button>
                    <button style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 13, color: "white", cursor: "pointer", boxShadow: `0 4px 12px ${CORAL}33` }}>
                      Direkt buchen →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setStep("input"); setQuery(""); setMatches([]); }} style={{ width: "100%", background: "#f7f7f5", border: "none", borderRadius: 14, padding: "13px", fontWeight: 600, fontSize: 14, color: "#888", cursor: "pointer", marginTop: 16 }}>
              🔄 Neue Suche starten
            </button>
          </>)}

        </div>
      </div>
    </div>
  );
}


// ─── KARTEN-ANSICHT ────────────────────────────────────────────────────────────
function KarteOverlay({ onClose, onViewWirker }) {
  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState("alle");
  const [mapMode, setMapMode] = React.useState("wirker");
  const [radius, setRadius] = React.useState(10); // km
  const [showRadiusSlider, setShowRadiusSlider] = React.useState(false);
  const mapRef = React.useRef(null);
  const leafletMapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const circleRef = React.useRef(null);
  const CENTER = [48.1351, 11.582]; // München

  const wirkerData = [
    { id: 1, name: "Sofia M.", talent: "Keramik-Künstlerin", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", lat: 48.150, lng: 11.557, empf: 34, rate: "45 €/Std.", kategorie: "handwerk" },
    { id: 2, name: "Marcus B.", talent: "Fotograf", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", lat: 48.162, lng: 11.613, empf: 47, rate: "90 €/Std.", kategorie: "foto" },
    { id: 3, name: "Maria L.", talent: "Yoga-Coach", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", lat: 48.118, lng: 11.602, empf: 93, rate: "70 €/Std.", kategorie: "coaching" },
    { id: 4, name: "Tom H.", talent: "Leder-Handwerk", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", lat: 48.143, lng: 11.539, empf: 28, rate: "55 €/Std.", kategorie: "handwerk" },
    { id: 5, name: "Lena K.", talent: "Aquarell-Illustratorin", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop", lat: 48.127, lng: 11.572, empf: 61, rate: "60 €/Std.", kategorie: "kunst" },
    { id: 6, name: "Jan W.", talent: "Musiker & Produzent", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop", lat: 48.157, lng: 11.595, empf: 19, rate: "80 €/Std.", kategorie: "musik" },
  ];

  const impactData = [
    { id: "ip1", name: "Stadtgarten München", city: "München", category: "🌿 Umwelt", desc: "Urbane Gemeinschaftsgärten für alle – 3 neue Beete im Westend.", awarded: "420 €", color: "#10b981", lat: 48.141, lng: 11.556 },
    { id: "ip2", name: "Repair Café Berlin", city: "Berlin", category: "♻️ Nachhaltigkeit", desc: "Elektronik reparieren statt wegwerfen – monatlich 60 Geräte gerettet.", awarded: "380 €", color: "#8B5CF6", lat: 52.520, lng: 13.405 },
    { id: "ip3", name: "Kinderchor Zürich", city: "Zürich", category: "🎵 Bildung", desc: "Kostenlose Musikförderung für Kinder aus einkommensschwachen Familien.", awarded: "290 €", color: "#F59E0B", lat: 47.376, lng: 8.541 },
    { id: "ip4", name: "Tafelhilfe Hamburg", city: "Hamburg", category: "🤝 Soziales", desc: "Lebensmittel retten, Menschen stärken – 200 Mahlzeiten pro Woche.", awarded: "510 €", color: "#FF6B5B", lat: 53.550, lng: 9.993 },
    { id: "ip5", name: "Wildblumen Wien", city: "Wien", category: "🌸 Natur", desc: "Bienenfreundliche Wildblumenwiesen auf städtischen Brachflächen.", awarded: "190 €", color: "#EC4899", lat: 48.208, lng: 16.373 },
  ];

  const kategorien = [
    { id: "alle", label: "Alle" },
    { id: "handwerk", label: "🛠 Handwerk" },
    { id: "kunst", label: "🎨 Kunst" },
    { id: "foto", label: "📷 Foto" },
    { id: "coaching", label: "🧘 Coaching" },
    { id: "musik", label: "🎵 Musik" },
  ];

  // Haversine-Distanz in km
  const distKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const sichtbareWirker = wirkerData.filter(w =>
    (filter === "alle" || w.kategorie === filter) &&
    distKm(CENTER[0], CENTER[1], w.lat, w.lng) <= radius
  );

  // Leaflet laden + Karte initialisieren
  React.useEffect(() => {
    if (leafletMapRef.current) return;
    const loadLeaflet = () => {
      if (window.L) { initMap(); return; }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || leafletMapRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: CENTER,
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
      leafletMapRef.current = map;
      renderMarkers(map);
    };
    loadLeaflet();
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  // Markers & Radius-Kreis neu rendern wenn sich Filter/Radius/Mode ändert
  React.useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;
    renderMarkers(map);
  }, [filter, radius, mapMode, selected]);

  const renderMarkers = (map) => {
    const L = window.L;
    if (!L) return;

    // Alte Marker entfernen
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }

    if (mapMode === "wirker") {
      // Radius-Kreis
      circleRef.current = L.circle(CENTER, {
        radius: radius * 1000,
        color: TEAL,
        fillColor: TEAL,
        fillOpacity: 0.07,
        weight: 2,
      }).addTo(map);

      // Mein Standort
      const meIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;background:${TEAL};border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(42,191,172,0.2)"></div>`,
        iconAnchor: [8, 8],
      });
      const meMarker = L.marker(CENTER, { icon: meIcon }).addTo(map);
      markersRef.current.push(meMarker);

      // Wirker-Marker
      sichtbareWirker.forEach(w => {
        const isSelected = selected?.id === w.id;
        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
            <div style="background:${isSelected ? CORAL : "white"};border-radius:99px;padding:3px 10px 3px 5px;display:flex;align-items:center;gap:5px;box-shadow:0 3px 14px rgba(0,0,0,0.18);border:${isSelected ? "none" : "1.5px solid #eee"}">
              <img src="${w.img}" style="width:26px;height:26px;border-radius:50%;object-fit:cover" />
              <span style="font-size:11px;font-weight:700;color:${isSelected ? "white" : "#333"};white-space:nowrap">${w.rate}</span>
            </div>
            <div style="width:8px;height:8px;background:${isSelected ? CORAL : "white"};transform:rotate(45deg);margin-top:-4px;box-shadow:1px 1px 3px rgba(0,0,0,0.1)"></div>
          </div>`,
          iconAnchor: [40, 42],
        });
        const marker = L.marker([w.lat, w.lng], { icon }).addTo(map);
        marker.on("click", () => setSelected(prev => prev?.id === w.id ? null : w));
        markersRef.current.push(marker);
      });
    } else {
      // Impact-Marker
      impactData.forEach(p => {
        const isSelected = selected?.id === p.id;
        const icon = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
            <div style="position:absolute;border-radius:50%;width:${isSelected?44:36}px;height:${isSelected?44:36}px;background:${p.color};opacity:0.25;animation:impactPulse 1.5s ease-out infinite"></div>
            <div style="width:28px;height:28px;border-radius:50%;background:${p.color};display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 3px 10px ${p.color}66;border:2px solid white">
              ${p.category.split(" ")[0]}
            </div>
          </div>`,
          iconAnchor: [22, 22],
        });
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.on("click", () => setSelected(prev => prev?.id === p.id ? null : p));
        markersRef.current.push(marker);
      });
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#fafaf8", display: "flex", flexDirection: "column", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "white", padding: "14px 16px 10px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={20} color="#444" />
          </button>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#222", flex: 1 }}>
            {mapMode === "wirker" ? "🗺 Wirker in deiner Nähe" : "🌱 Impact-Karte"}
          </div>
          {/* Radius Button — nur im Wirker-Modus */}
          {mapMode === "wirker" && (
            <button onClick={() => setShowRadiusSlider(r => !r)}
              style={{ background: showRadiusSlider ? TEAL : `${TEAL}15`, border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: showRadiusSlider ? "white" : TEAL, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              📍 {radius} km
            </button>
          )}
        </div>

        {/* Radius Slider */}
        {showRadiusSlider && mapMode === "wirker" && (
          <div style={{ background: `${TEAL}0d`, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>Suchradius</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: TEAL }}>{radius >= 100 ? "🌍 Überall" : `${radius} km`}</span>
            </div>
            <input type="range" min={1} max={100} step={1} value={radius} onChange={e => setRadius(Number(e.target.value))}
              style={{ width: "100%", accentColor: TEAL, cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb", marginTop: 4 }}>
              <span>1 km</span><span>10 km</span><span>25 km</span><span>50 km</span><span>🌍</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#666", textAlign: "center" }}>
              {sichtbareWirker.length === 0
                ? "Keine Wirker in diesem Radius — vergrößere den Bereich"
                : `${sichtbareWirker.length} Wirker im Umkreis von ${radius} km`}
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div style={{ display: "flex", background: "#f5f5f3", borderRadius: 14, padding: 4, marginBottom: 10 }}>
          {[["wirker", "👥 Wirker"], ["impact", "🌱 Impact"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMapMode(m); setSelected(null); setShowRadiusSlider(false); }}
              style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: "pointer", background: mapMode === m ? (m === "impact" ? "#10b981" : TEAL) : "transparent", color: mapMode === m ? "white" : "#aaa", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Kategorie-Filter */}
        {mapMode === "wirker" && (
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {kategorien.map(k => (
              <button key={k.id} onClick={() => setFilter(k.id)}
                style={{ flexShrink: 0, background: filter === k.id ? "#1a1a1a" : "#f3f3f1", color: filter === k.id ? "white" : "#777", border: "none", borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {k.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Echte Karte */}
      <div ref={mapRef} style={{ flex: 1, zIndex: 1 }} />

      {/* Ausgewählter Wirker */}
      {selected && mapMode === "wirker" && (
        <div style={{ background: "white", padding: "16px 20px 32px", borderTop: "1px solid #f0f0f0", flexShrink: 0, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 10 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
            <img src={selected.img} style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover" }} alt="" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#222", display: "flex", alignItems: "center", gap: 6 }}>
                {selected.name} <BadgeCheck size={15} color={TEAL} />
              </div>
              <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 1 }}>{selected.talent}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>👍 {selected.empf} Empfehlungen · {selected.rate}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { onViewWirker(selected.name); onClose(); }}
              style={{ flex: 1, background: "#f3f3f1", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, color: "#444", cursor: "pointer" }}>
              Profil ansehen
            </button>
            <button style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, color: "white", cursor: "pointer" }}>
              📅 Jetzt buchen
            </button>
          </div>
        </div>
      )}

      {/* Ausgewähltes Impact-Projekt */}
      {selected && mapMode === "impact" && (
        <div style={{ background: "white", padding: "16px 20px 32px", borderTop: `3px solid ${selected.color}`, flexShrink: 0, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 10 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: selected.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {selected.category.split(" ")[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>{selected.name}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: selected.color, marginTop: 2 }}>{selected.category} · 📍 {selected.city}</div>
            </div>
            <div style={{ background: selected.color + "15", borderRadius: 12, padding: "6px 12px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: selected.color }}>{selected.awarded}</div>
              <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600 }}>gefördert</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, background: "#f9f9f9", borderRadius: 12, padding: "10px 12px" }}>
            {selected.desc}
          </div>
        </div>
      )}

      <style>{`
        @keyframes impactPulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}


// ─── APP INNER + EXPORT ─────────────────────────────────────────────────────
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

        // Lade echte Beiträge aus beitraege-Tabelle
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: userBeitraege } = await supabase
              .from("beitraege")
              .select("*, profiles(full_name, avatar_url)")
              .order("created_at", { ascending: false })
              .limit(20);
            if (userBeitraege && userBeitraege.length > 0) {
              const beitragFeedItems = userBeitraege.map(b => ({
                id: "b_" + b.id,
                type: b.type === "video" ? "video" : "foto",
                src: b.src,
                img: b.src,
                creator: b.profiles?.full_name || "HUI Wirker",
                creatorImg: b.profiles?.avatar_url || "https://ui-avatars.com/api/?name=HUI&background=2ABFAC&color=fff",
                caption: b.caption || "",
                likes: 0,
                location: ""
              }));
              setLiveFeed(prev => {
                const withoutBeitraege = prev.filter(i => !String(i.id).startsWith("b_"));
                return [...beitragFeedItems, ...withoutBeitraege];
              });
            }
          }
        } catch(e2) { console.log("beitraege feed:", e2); }

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
          ? <ChatDetailPage chat={typeof openChat === "object" ? openChat : mockChats.find(c => c.wirkerName === openChat) || mockChats[0]} onBack={() => setOpenChat(null)} />
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
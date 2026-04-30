import React, { useState, useEffect } from "react";
import { Search, X, ArrowLeft, SlidersHorizontal, Check, ChevronDown, ChevronUp } from "lucide-react";
import { HuiWirker, HuiImpactProject } from "@/api/entities";

const CORAL = "#FF6B5B"; const TEAL = "#2ABFAC"; const GOLD = "#F5A623";

const mockSuchergebnisse = [
  { id: "s1", typ: "wirker", name: "Sofia M.", kategorie: "Keramik & Töpfern", ort: "München", distanceKm: 2, empfehlungen: 48, preiswert: 35, preis: "ab 35 €", bild: "https://i.pravatar.cc/150?img=47", badge: "⭐ Top Wirker", buchbar: true, kaufbar: false, online: false, verfuegbar: ["Heute", "Diese Woche"] },
  { id: "s2", typ: "werk", name: 'Aquarell-Bild "Alpenglühen"', kategorie: "Kunst & Kreatives", ort: "München", distanceKm: 3, empfehlungen: 12, preiswert: 89, preis: "89 €", bild: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=80", badge: null, buchbar: false, kaufbar: true, online: false, creator: "Lena K.", erstelltAm: "2026-03-15" },
  { id: "s3", typ: "wirker", name: "Marcus B.", kategorie: "Fotografie", ort: "München", distanceKm: 5, empfehlungen: 31, preiswert: 80, preis: "ab 80 €", bild: "https://i.pravatar.cc/150?img=33", badge: "📷 Profi", buchbar: true, kaufbar: false, online: true, verfuegbar: ["Diese Woche", "Dieses Wochenende"] },
  { id: "s4", typ: "werk", name: "Handgemachte Schale (Set 2)", kategorie: "Keramik & Töpfern", ort: "München", distanceKm: 2, empfehlungen: 8, preiswert: 55, preis: "55 €", bild: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80", badge: "🔥 Beliebt", buchbar: false, kaufbar: true, online: false, creator: "Sofia M.", erstelltAm: "2026-04-01" },
  { id: "s5", typ: "wirker", name: "Lena K.", kategorie: "Coaching", ort: "München", distanceKm: 8, empfehlungen: 63, preiswert: 120, preis: "ab 120 €", bild: "https://i.pravatar.cc/150?img=25", badge: "✅ Verifiziert", buchbar: true, kaufbar: false, online: true, verfuegbar: ["Heute", "Nächste Woche"] },
  { id: "s6", typ: "wirker", name: "Jonas W.", kategorie: "Musik", ort: "München", distanceKm: 4, empfehlungen: 22, preiswert: 60, preis: "ab 60 €", bild: "https://i.pravatar.cc/150?img=12", badge: null, buchbar: true, kaufbar: false, online: false, verfuegbar: ["Dieses Wochenende"] },
  { id: "s7", typ: "werk", name: "Yoga-Kurs Aufzeichnung (3x)", kategorie: "Wellness & Yoga", ort: "Online", distanceKm: 0, empfehlungen: 19, preiswert: 29, preis: "29 €", bild: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&q=80", badge: "💻 Online", buchbar: false, kaufbar: true, online: true, creator: "Maria L.", erstelltAm: "2026-02-20" },
  { id: "s8", typ: "wirker", name: "Anna P.", kategorie: "Kulinarik", ort: "München", distanceKm: 6, empfehlungen: 37, preiswert: 45, preis: "ab 45 €", bild: "https://i.pravatar.cc/150?img=44", badge: null, buchbar: true, kaufbar: false, online: false, verfuegbar: ["Diese Woche"] },
];

const mockImpactProjects = [
  { id: "ip1", typ: "impact", name: "Bäume für Kenia", kategorie: "Umwelt", land: "Kenia", gesammelt: 2340, ziel: 5000, status: "aktiv", bild: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80" },
  { id: "ip2", typ: "impact", name: "Schule für alle", kategorie: "Bildung", land: "Uganda", gesammelt: 8900, ziel: 10000, status: "fast_erreicht", bild: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80" },
  { id: "ip3", typ: "impact", name: "Stadtgarten München", kategorie: "Nachhaltigkeit", land: "Deutschland", gesammelt: 1200, ziel: 3000, status: "aktiv", bild: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80" },
  { id: "ip4", typ: "impact", name: "Tierheim Hamburg", kategorie: "Tiere", land: "Deutschland", gesammelt: 5000, ziel: 5000, status: "abgeschlossen", bild: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&q=80" },
  { id: "ip5", typ: "impact", name: "Sauberes Trinkwasser", kategorie: "Gesundheit", land: "Tansania", gesammelt: 3100, ziel: 8000, status: "aktiv", bild: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&q=80" },
];

const WIRKER_TALENTE = ["Keramik & Töpfern", "Fotografie", "Coaching", "Musik", "Kunst & Kreatives", "Handwerk", "Wellness & Yoga", "Kulinarik", "Natur & Garten", "Fitness & Sport", "Schreiben & Text", "Technik & IT", "Mode & Styling"];
const WERK_KATEGORIEN = ["Kunst & Kreatives", "Keramik & Töpfern", "Handwerk", "Wellness & Yoga", "Musik", "Mode & Styling", "Schreiben & Text", "Natürliches & Nachhaltiges", "Digitale Produkte"];
const IMPACT_KATEGORIEN = ["Umwelt", "Bildung", "Nachhaltigkeit", "Tiere", "Gesundheit", "Soziales", "Kultur"];
const IMPACT_LAENDER = ["Deutschland", "Kenia", "Uganda", "Tansania", "Indien", "Brasilien", "Philippinen"];
const IMPACT_STATUS = [
  { value: "alle", label: "Alle" },
  { value: "aktiv", label: "Läuft gerade" },
  { value: "fast_erreicht", label: "Fast erreicht" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
];
const VERFUEGBARKEIT_OPTIONS = ["Heute", "Diese Woche", "Dieses Wochenende", "Nächste Woche"];
const SORT_OPTIONS = [
  { value: "relevanz", label: "Relevanz" },
  { value: "empfehlungen", label: "Meiste Empfehlungen" },
  { value: "preis_asc", label: "Preis: günstig → teuer" },
  { value: "preis_desc", label: "Preis: teuer → günstig" },
  { value: "neu", label: "Neueste zuerst" },
  { value: "distanz", label: "Nächste zuerst" },
];

function Chip({ label, active, onClick, icon }) {
  return (
    <button onClick={onClick} style={{ background: active ? TEAL : "#f3f3f3", color: active ? "white" : "#555", border: "none", borderRadius: 20, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {label}
      {active && <Check size={11} color="white" />}
    </button>
  );
}

function Section({ id, title, icon, expandedSection, setExpandedSection, children, badge }) {
  const open = expandedSection === id;
  return (
    <div style={{ borderBottom: "1px solid #f0f0f0" }}>
      <button onClick={() => setExpandedSection(open ? null : id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "13px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#333", display: "flex", alignItems: "center", gap: 7 }}>
          <span>{icon}</span>{title}
          {badge > 0 && <span style={{ background: CORAL, color: "white", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 7px" }}>{badge}</span>}
        </span>
        {open ? <ChevronUp size={16} color="#aaa" /> : <ChevronDown size={16} color="#aaa" />}
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  );
}

export default function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("wirker"); // wirker | werk | impact
  const [expandedSection, setExpandedSection] = useState("details");
  const [showResults, setShowResults] = useState(false);
  const [dbWirker, setDbWirker] = useState([]);
  const [dbImpact, setDbImpact] = useState([]);

  // --- Wirker Filters ---
  const [wirkerTalente, setWirkerTalente] = useState([]);
  const [wirkerRadius, setWirkerRadius] = useState(50);
  const [wirkerPreisMin, setWirkerPreisMin] = useState("");
  const [wirkerPreisMax, setWirkerPreisMax] = useState("");
  const [wirkerVerfuegbar, setWirkerVerfuegbar] = useState([]);
  const [wirkerOnlineOnly, setWirkerOnlineOnly] = useState(false);
  const [wirkerMinEmpf, setWirkerMinEmpf] = useState(0);
  const [wirkerVerifiziert, setWirkerVerifiziert] = useState(false);

  // --- Werk Filters ---
  const [werkKategorien, setWerkKategorien] = useState([]);
  const [werkPreisMin, setWerkPreisMin] = useState("");
  const [werkPreisMax, setWerkPreisMax] = useState("");
  const [werkCreator, setWerkCreator] = useState("");
  const [werkDatum, setWerkDatum] = useState("alle"); // alle | diese_woche | diesen_monat | dieses_jahr

  // --- Impact Filters ---
  const [impactKategorien, setImpactKategorien] = useState([]);
  const [impactLaender, setImpactLaender] = useState([]);
  const [impactStatus, setImpactStatus] = useState("alle");

  // --- Common ---
  const [sortBy, setSortBy] = useState("relevanz");

  useEffect(() => {
    HuiWirker.list().then(data => {
      if (data?.length > 0) {
        setDbWirker(data.map(w => ({
          id: w.id, typ: "wirker",
          name: w.name || w.full_name || "",
          kategorie: w.talent || "",
          ort: w.location || "",
          distanceKm: Math.floor(Math.random() * 30) + 1,
          empfehlungen: w.recommendations || w.bookings || 0,
          preiswert: w.hourly_rate || 0,
          preis: w.hourly_rate ? `ab ${w.hourly_rate} €` : "",
          bild: w.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
          badge: w.verified ? "✅ Verifiziert" : null,
          buchbar: true, kaufbar: false, online: false, verfuegbar: ["Diese Woche"],
          verifiziert: !!w.verified,
        })));
      }
    }).catch(() => {});
    HuiImpactProject.list().then(data => {
      if (data?.length > 0) {
        setDbImpact(data.map(p => ({
          id: p.id, typ: "impact",
          name: p.name || "",
          kategorie: p.category || p.kategorie || "Sonstiges",
          land: p.country || "International",
          gesammelt: p.collected_eur || p.votes || 0,
          ziel: p.goal_eur || 5000,
          status: p.status === "aktiv" || p.status === "active" ? "aktiv" : p.status === "won" || p.status === "gewonnen" ? "abgeschlossen" : "aktiv",
          bild: p.img || "https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80",
        })));
      }
    }).catch(() => {});
  }, []);

  const toggleArr = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const resetFilters = () => {
    setWirkerTalente([]); setWirkerRadius(50); setWirkerPreisMin(""); setWirkerPreisMax("");
    setWirkerVerfuegbar([]); setWirkerOnlineOnly(false); setWirkerMinEmpf(0); setWirkerVerifiziert(false);
    setWerkKategorien([]); setWerkPreisMin(""); setWerkPreisMax(""); setWerkCreator(""); setWerkDatum("alle");
    setImpactKategorien([]); setImpactLaender([]); setImpactStatus("alle");
    setSortBy("relevanz");
  };

  const activeFilterCount = React.useMemo(() => {
    if (searchMode === "wirker") return [wirkerTalente.length > 0, wirkerRadius !== 50, wirkerPreisMin || wirkerPreisMax, wirkerVerfuegbar.length > 0, wirkerOnlineOnly, wirkerMinEmpf > 0, wirkerVerifiziert].filter(Boolean).length;
    if (searchMode === "werk") return [werkKategorien.length > 0, werkPreisMin || werkPreisMax, werkCreator, werkDatum !== "alle"].filter(Boolean).length;
    if (searchMode === "impact") return [impactKategorien.length > 0, impactLaender.length > 0, impactStatus !== "alle"].filter(Boolean).length;
    return 0;
  }, [searchMode, wirkerTalente, wirkerRadius, wirkerPreisMin, wirkerPreisMax, wirkerVerfuegbar, wirkerOnlineOnly, wirkerMinEmpf, wirkerVerifiziert, werkKategorien, werkPreisMin, werkPreisMax, werkCreator, werkDatum, impactKategorien, impactLaender, impactStatus]);

  const results = React.useMemo(() => {
    const q = query.toLowerCase().trim();

    if (searchMode === "wirker") {
      const all = [...dbWirker, ...mockSuchergebnisse.filter(s => s.typ === "wirker")];
      const seen = new Set();
      let res = all.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
      if (q) res = res.filter(r => r.name.toLowerCase().includes(q) || r.kategorie.toLowerCase().includes(q));
      if (wirkerTalente.length > 0) res = res.filter(r => wirkerTalente.some(t => r.kategorie.toLowerCase().includes(t.toLowerCase())));
      if (wirkerRadius < 200) res = res.filter(r => r.online || r.distanceKm <= wirkerRadius);
      if (wirkerPreisMin) res = res.filter(r => r.preiswert >= parseInt(wirkerPreisMin));
      if (wirkerPreisMax) res = res.filter(r => r.preiswert <= parseInt(wirkerPreisMax));
      if (wirkerVerfuegbar.length > 0) res = res.filter(r => (r.verfuegbar || []).some(v => wirkerVerfuegbar.includes(v)));
      if (wirkerOnlineOnly) res = res.filter(r => r.online);
      if (wirkerMinEmpf > 0) res = res.filter(r => r.empfehlungen >= wirkerMinEmpf);
      if (wirkerVerifiziert) res = res.filter(r => r.badge?.includes("Verifiziert") || r.verifiziert);
      if (sortBy === "empfehlungen") res.sort((a, b) => b.empfehlungen - a.empfehlungen);
      else if (sortBy === "preis_asc") res.sort((a, b) => a.preiswert - b.preiswert);
      else if (sortBy === "preis_desc") res.sort((a, b) => b.preiswert - a.preiswert);
      else if (sortBy === "distanz") res.sort((a, b) => a.distanceKm - b.distanceKm);
      return res;
    }

    if (searchMode === "werk") {
      const all = mockSuchergebnisse.filter(s => s.typ === "werk");
      let res = [...all];
      if (q) res = res.filter(r => r.name.toLowerCase().includes(q) || r.kategorie.toLowerCase().includes(q) || (r.creator || "").toLowerCase().includes(q));
      if (werkKategorien.length > 0) res = res.filter(r => werkKategorien.includes(r.kategorie));
      if (werkPreisMin) res = res.filter(r => r.preiswert >= parseInt(werkPreisMin));
      if (werkPreisMax) res = res.filter(r => r.preiswert <= parseInt(werkPreisMax));
      if (werkCreator) res = res.filter(r => (r.creator || "").toLowerCase().includes(werkCreator.toLowerCase()));
      if (werkDatum !== "alle" && werkDatum !== undefined) {
        const now = new Date();
        res = res.filter(r => {
          if (!r.erstelltAm) return true;
          const d = new Date(r.erstelltAm);
          if (werkDatum === "diese_woche") return (now - d) < 7 * 86400000;
          if (werkDatum === "diesen_monat") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          if (werkDatum === "dieses_jahr") return d.getFullYear() === now.getFullYear();
          return true;
        });
      }
      if (sortBy === "preis_asc") res.sort((a, b) => a.preiswert - b.preiswert);
      else if (sortBy === "preis_desc") res.sort((a, b) => b.preiswert - a.preiswert);
      else if (sortBy === "empfehlungen") res.sort((a, b) => b.empfehlungen - a.empfehlungen);
      else if (sortBy === "neu") res.sort((a, b) => new Date(b.erstelltAm || 0) - new Date(a.erstelltAm || 0));
      return res;
    }

    if (searchMode === "impact") {
      const all = [...dbImpact, ...mockImpactProjects];
      const seen = new Set();
      let res = all.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
      if (q) res = res.filter(r => r.name.toLowerCase().includes(q) || r.kategorie.toLowerCase().includes(q));
      if (impactKategorien.length > 0) res = res.filter(r => impactKategorien.includes(r.kategorie));
      if (impactLaender.length > 0) res = res.filter(r => impactLaender.includes(r.land));
      if (impactStatus !== "alle") res = res.filter(r => r.status === impactStatus);
      res.sort((a, b) => (b.gesammelt / b.ziel) - (a.gesammelt / a.ziel));
      return res;
    }
    return [];
  }, [query, searchMode, dbWirker, dbImpact, wirkerTalente, wirkerRadius, wirkerPreisMin, wirkerPreisMax, wirkerVerfuegbar, wirkerOnlineOnly, wirkerMinEmpf, wirkerVerifiziert, werkKategorien, werkPreisMin, werkPreisMax, werkCreator, werkDatum, impactKategorien, impactLaender, impactStatus, sortBy]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 12, padding: "11px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <Search size={16} color={TEAL} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={`Suche nach ${searchMode === "wirker" ? "Talent, Name…" : searchMode === "werk" ? "Werk, Ersteller…" : "Projekt, Land…"}`}
              style={{ border: "none", background: "none", flex: 1, fontSize: 14, outline: "none", color: "#222" }} />
            {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={14} color="#aaa" /></button>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: CORAL, fontWeight: 700, fontSize: 14 }}>Fertig</button>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: "flex", gap: 0, background: "#f5f5f3", borderRadius: 12, padding: 3, marginBottom: 12 }}>
          {[{ v: "wirker", l: "👤 Wirker" }, { v: "werk", l: "🎁 Werke" }, { v: "impact", l: "🌱 Impact" }].map(o => (
            <button key={o.v} onClick={() => { setSearchMode(o.v); setExpandedSection("details"); }} style={{ flex: 1, padding: "9px 4px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, background: searchMode === o.v ? "white" : "transparent", color: searchMode === o.v ? "#222" : "#aaa", boxShadow: searchMode === o.v ? "0 1px 6px rgba(0,0,0,0.08)" : "none" }}>
              {o.l}
            </button>
          ))}
        </div>

        {activeFilterCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <SlidersHorizontal size={13} color={CORAL} />
            <span style={{ fontSize: 12, color: CORAL, fontWeight: 600 }}>{activeFilterCount} Filter aktiv</span>
            <button onClick={resetFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 12, marginLeft: 4 }}>Alle zurücksetzen</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ flex: 1, overflowY: "auto", background: "white", padding: "0 16px" }}>

        {/* ══ WIRKER FILTERS ══ */}
        {searchMode === "wirker" && (<>
          <Section id="details" title="Talent / Spezialisierung" icon="🎯" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={wirkerTalente.length}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {WIRKER_TALENTE.map(t => <Chip key={t} label={t} active={wirkerTalente.includes(t)} onClick={() => toggleArr(wirkerTalente, setWirkerTalente, t)} />)}
            </div>
          </Section>

          <Section id="distanz" title={`Umkreis: ${wirkerRadius >= 200 ? "Weltweit 🌍" : wirkerRadius + " km"}`} icon="📍" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
            <input type="range" min={5} max={200} step={5} value={wirkerRadius} onChange={e => setWirkerRadius(+e.target.value)} style={{ width: "100%", accentColor: TEAL }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#bbb", marginTop: 4 }}>
              <span>5km</span><span>50km</span><span>100km</span><span>Weltweit</span>
            </div>
          </Section>

          <Section id="preis" title="Preis / Stunde" icon="💶" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={(wirkerPreisMin || wirkerPreisMax) ? 1 : 0}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <input value={wirkerPreisMin} onChange={e => setWirkerPreisMin(e.target.value)} placeholder="Min €" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} />
              </div>
              <span style={{ color: "#bbb" }}>–</span>
              <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <input value={wirkerPreisMax} onChange={e => setWirkerPreisMax(e.target.value)} placeholder="Max €" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["bis 50€","","50"],["50–100€","50","100"],["100–200€","100","200"],["200€+","200",""]].map(([l,min,max]) => (
                <button key={l} onClick={() => { setWirkerPreisMin(min); setWirkerPreisMax(max); }} style={{ background: wirkerPreisMin === min && wirkerPreisMax === max ? TEAL : "#f3f3f3", color: wirkerPreisMin === min && wirkerPreisMax === max ? "white" : "#555", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </Section>

          <Section id="verfuegbar" title="Verfügbarkeit" icon="📅" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={wirkerVerfuegbar.length}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VERFUEGBARKEIT_OPTIONS.map(a => <Chip key={a} label={a} active={wirkerVerfuegbar.includes(a)} onClick={() => toggleArr(wirkerVerfuegbar, setWirkerVerfuegbar, a)} />)}
            </div>
          </Section>

          <Section id="extras" title="Weitere Filter" icon="✨" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={[wirkerOnlineOnly, wirkerMinEmpf > 0, wirkerVerifiziert].filter(Boolean).length}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              <Chip label="Online buchbar" active={wirkerOnlineOnly} onClick={() => setWirkerOnlineOnly(p => !p)} icon="💻" />
              <Chip label="✅ Verifiziert" active={wirkerVerifiziert} onClick={() => setWirkerVerifiziert(p => !p)} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>Mindest-Empfehlungen</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 5, 10, 25, 50].map(n => (
                <button key={n} onClick={() => setWirkerMinEmpf(n)} style={{ background: wirkerMinEmpf === n ? CORAL : "#f3f3f3", color: wirkerMinEmpf === n ? "white" : "#555", border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{n === 0 ? "Alle" : `${n}+`}</button>
              ))}
            </div>
          </Section>
        </>)}

        {/* ══ WERK FILTERS ══ */}
        {searchMode === "werk" && (<>
          <Section id="details" title="Kategorie" icon="🎨" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={werkKategorien.length}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {WERK_KATEGORIEN.map(k => <Chip key={k} label={k} active={werkKategorien.includes(k)} onClick={() => toggleArr(werkKategorien, setWerkKategorien, k)} />)}
            </div>
          </Section>

          <Section id="preis" title="Preisspanne" icon="💶" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={(werkPreisMin || werkPreisMax) ? 1 : 0}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px" }}>
                <input value={werkPreisMin} onChange={e => setWerkPreisMin(e.target.value)} placeholder="Min €" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} />
              </div>
              <span style={{ color: "#bbb" }}>–</span>
              <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "10px 12px" }}>
                <input value={werkPreisMax} onChange={e => setWerkPreisMax(e.target.value)} placeholder="Max €" type="number" style={{ border: "none", background: "none", fontSize: 14, outline: "none", width: "100%", color: "#222" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["bis 25€","","25"],["25–100€","25","100"],["100–300€","100","300"],["300€+","300",""]].map(([l,min,max]) => (
                <button key={l} onClick={() => { setWerkPreisMin(min); setWerkPreisMax(max); }} style={{ background: werkPreisMin === min && werkPreisMax === max ? TEAL : "#f3f3f3", color: werkPreisMin === min && werkPreisMax === max ? "white" : "#555", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </Section>

          <Section id="creator" title="Ersteller / Wirker" icon="👤" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={werkCreator ? 1 : 0}>
            <div style={{ background: "#f3f3f3", borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={14} color="#aaa" />
              <input value={werkCreator} onChange={e => setWerkCreator(e.target.value)} placeholder="Name des Erstellers…" style={{ border: "none", background: "none", fontSize: 14, outline: "none", flex: 1, color: "#222" }} />
              {werkCreator && <button onClick={() => setWerkCreator("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={13} color="#aaa" /></button>}
            </div>
          </Section>

          <Section id="datum" title="Erstellungsdatum" icon="📅" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={werkDatum !== "alle" ? 1 : 0}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["alle","Alle anzeigen"],["diese_woche","Diese Woche"],["diesen_monat","Diesen Monat"],["dieses_jahr","Dieses Jahr"]].map(([v,l]) => (
                <button key={v} onClick={() => setWerkDatum(v)} style={{ background: werkDatum === v ? `${TEAL}15` : "transparent", border: werkDatum === v ? `1.5px solid ${TEAL}` : "1.5px solid #eee", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: werkDatum === v ? TEAL : "#444", fontWeight: werkDatum === v ? 700 : 400, fontSize: 13 }}>
                  {l}
                  {werkDatum === v && <Check size={15} color={TEAL} />}
                </button>
              ))}
            </div>
          </Section>
        </>)}

        {/* ══ IMPACT FILTERS ══ */}
        {searchMode === "impact" && (<>
          <Section id="details" title="Kategorie" icon="🎯" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={impactKategorien.length}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {IMPACT_KATEGORIEN.map(k => <Chip key={k} label={k} active={impactKategorien.includes(k)} onClick={() => toggleArr(impactKategorien, setImpactKategorien, k)} />)}
            </div>
          </Section>

          <Section id="land" title="Land / Region" icon="🌍" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={impactLaender.length}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {IMPACT_LAENDER.map(l => <Chip key={l} label={l} active={impactLaender.includes(l)} onClick={() => toggleArr(impactLaender, setImpactLaender, l)} />)}
            </div>
          </Section>

          <Section id="status" title="Finanzierungsstatus" icon="💰" expandedSection={expandedSection} setExpandedSection={setExpandedSection} badge={impactStatus !== "alle" ? 1 : 0}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {IMPACT_STATUS.map(s => (
                <button key={s.value} onClick={() => setImpactStatus(s.value)} style={{ background: impactStatus === s.value ? `${TEAL}15` : "transparent", border: impactStatus === s.value ? `1.5px solid ${TEAL}` : "1.5px solid #eee", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: impactStatus === s.value ? TEAL : "#444", fontWeight: impactStatus === s.value ? 700 : 400, fontSize: 13 }}>
                  {s.label}
                  {impactStatus === s.value && <Check size={15} color={TEAL} />}
                </button>
              ))}
            </div>
          </Section>
        </>)}

        {/* Sort (not for impact) */}
        {searchMode !== "impact" && (
          <Section id="sort" title="Sortieren nach" icon="↕️" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SORT_OPTIONS.filter(o => searchMode === "wirker" || !["distanz"].includes(o.value)).map(o => (
                <button key={o.value} onClick={() => setSortBy(o.value)} style={{ background: sortBy === o.value ? `${TEAL}15` : "none", border: sortBy === o.value ? `1.5px solid ${TEAL}` : "1.5px solid #eee", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: sortBy === o.value ? TEAL : "#444", fontWeight: sortBy === o.value ? 700 : 400, fontSize: 13 }}>
                  {o.label}
                  {sortBy === o.value && <Check size={15} color={TEAL} />}
                </button>
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: 16 }} />
      </div>

      {/* CTA */}
      <div style={{ background: "white", padding: "12px 16px 24px", borderTop: "1px solid #f0f0f0" }}>
        <button onClick={() => setShowResults(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          {activeFilterCount > 0 ? `${activeFilterCount} Filter anwenden · ${results.length} Ergebnisse` : `Suchen · ${results.length} Ergebnisse`}
        </button>
      </div>

      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: -1 }} />

      {/* ── RESULTS OVERLAY ── */}
      {showResults && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "#fafaf8", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
          <div style={{ background: "white", padding: "14px 16px 10px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
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
            {/* Active filter chips */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              <div style={{ background: `${TEAL}15`, borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: TEAL, whiteSpace: "nowrap", flexShrink: 0 }}>
                {searchMode === "wirker" ? "👤 Wirker" : searchMode === "werk" ? "🎁 Werke" : "🌱 Impact"}
              </div>
              {searchMode === "wirker" && wirkerRadius < 200 && <div style={{ background: "#f0f0ee", borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#555", whiteSpace: "nowrap", flexShrink: 0 }}>📍 {wirkerRadius} km</div>}
              {searchMode === "wirker" && wirkerTalente.slice(0, 2).map(t => <div key={t} style={{ background: "#f0f0ee", borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#555", whiteSpace: "nowrap", flexShrink: 0 }}>{t}</div>)}
              {searchMode === "werk" && werkKategorien.slice(0, 2).map(k => <div key={k} style={{ background: "#f0f0ee", borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#555", whiteSpace: "nowrap", flexShrink: 0 }}>{k}</div>)}
              {searchMode === "impact" && impactStatus !== "alle" && <div style={{ background: `${TEAL}15`, borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: TEAL, whiteSpace: "nowrap", flexShrink: 0 }}>{IMPACT_STATUS.find(s => s.value === impactStatus)?.label}</div>}
              {activeFilterCount > 0 && <button onClick={() => setShowResults(false)} style={{ background: "none", border: "1px solid #eee", borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#aaa", whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer" }}>✏️ Filtern</button>}
            </div>
          </div>

          <div style={{ padding: "10px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>{results.length} Ergebnisse</span>
            {searchMode !== "impact" && (
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: 12, border: "1px solid #eee", borderRadius: 8, padding: "4px 8px", color: "#555", background: "white", cursor: "pointer" }}>
                {SORT_OPTIONS.filter(o => searchMode === "wirker" || o.value !== "distanz").map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 24px" }}>
            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 6 }}>Keine Ergebnisse</div>
                <div style={{ fontSize: 13, color: "#aaa" }}>Versuch andere Filter oder einen anderen Suchbegriff.</div>
                <button onClick={() => setShowResults(false)} style={{ marginTop: 20, background: TEAL, color: "white", border: "none", borderRadius: 12, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Filter anpassen</button>
              </div>
            ) : results.map(item => (
              <ResultCard key={item.id} item={item} searchMode={searchMode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ item, searchMode }) {
  const CORAL = "#FF6B5B"; const TEAL = "#2ABFAC"; const GOLD = "#F5A623";

  if (searchMode === "impact") {
    const pct = Math.min(Math.round((item.gesammelt / item.ziel) * 100), 100);
    const statusColor = item.status === "abgeschlossen" ? TEAL : item.status === "fast_erreicht" ? GOLD : "#555";
    const statusLabel = item.status === "abgeschlossen" ? "✓ Abgeschlossen" : item.status === "fast_erreicht" ? "🔥 Fast erreicht" : "🌱 Läuft";
    return (
      <div style={{ background: "white", borderRadius: 18, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ position: "relative" }}>
          <img src={item.bild} alt={item.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />
          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "white", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{item.kategorie}</div>
          <div style={{ position: "absolute", top: 8, right: 8, background: statusColor + "dd", color: "white", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{statusLabel}</div>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#222", marginBottom: 3 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}>🌍 {item.land}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: TEAL }}>{item.gesammelt.toLocaleString("de-DE")} €</span>
            <span>von {item.ziel.toLocaleString("de-DE")} €</span>
            <span style={{ fontWeight: 700, color: pct >= 80 ? GOLD : "#888" }}>{pct}%</span>
          </div>
          <div style={{ background: "#f0f0ee", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? TEAL : pct >= 80 ? GOLD : CORAL, borderRadius: 99, transition: "width 0.5s" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: 18, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 90, flexShrink: 0, position: "relative" }}>
          <img src={item.bild} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 100 }} />
          {item.badge && <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", borderRadius: 99, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>{item.badge}</div>}
          {item.online && <div style={{ position: "absolute", bottom: 6, left: 6, background: TEAL, borderRadius: 99, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "white" }}>💻 Online</div>}
        </div>
        <div style={{ flex: 1, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#222", lineHeight: 1.3 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: TEAL, fontWeight: 600, marginTop: 1 }}>{item.kategorie}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: CORAL, flexShrink: 0, marginLeft: 8 }}>{item.preis}</div>
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>
            📍 {item.ort}{item.distanceKm > 0 ? ` · ${item.distanceKm} km` : ""} · 👍 {item.empfehlungen}
            {item.creator && <> · von {item.creator}</>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {item.buchbar && <button style={{ flex: 1, background: `linear-gradient(135deg, ${TEAL}, #10b981)`, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>📅 Buchen</button>}
            {item.kaufbar && <button style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>🛒 Kaufen</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
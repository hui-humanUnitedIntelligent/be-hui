import { HUIEuroIcon, HUILinkIcon, HUILocationIcon, HUIProfilIcon, HUITalentIcon } from '../../design/icons/HuiSystemIcons.jsx';
import LocationAutocompleteInput from '../shared/LocationAutocompleteInput.jsx';
// ProfilBearbeitenModal.jsx — vollständige Profil-Bearbeitung
// ═══════════════════════════════════════════════════════════
// WICHTIG (2026-08-06, Fakten-Check gegen Live-DB + Live-Code):
// - "Fokus / Bereich" (focus_type) und Basis-"Skills" (skills) wurden aus
//   diesem Modal ENTFERNT, weil beide Spalten inzwischen von anderen,
//   bereits produktiv genutzten Editoren mit ANDERER Bedeutung belegt sind:
//     • profiles.focus_type = "Sichtbarkeit" (Sprint F.9G.1,
//       handleVisibilityChange in TalentProfilePage.jsx) — Live-Wert z.B.
//       "hybrid", NICHT die alten FOCUS_TYPES-Kategorien.
//     • profiles.skills = "Interessen & Werte" (InteressenSection.jsx,
//       MyBasisProfile.jsx) für Basis-User BZW. "Professionelle Skills"
//       (handleSkillsChange, TalentProfilePage.jsx, Sprint F.3C — einzige
//       Wahrheitsquelle) für Talent-User. Ein Speichern hier hätte die
//       jeweils andere Bedeutung stillschweigend überschrieben.
// - Talent-Tab: "Kategorien" und "Mein Angebotsradius" wurden entfernt —
//   es existiert keine profiles.categories / profiles.radius_km Spalte;
//   das sind Attribute einzelner Talent-ANGEBOTE (Tabelle `talents`,
//   TalentAngebotWizard.jsx), nicht des Profils.
// - Talent-Tab: "Professionelle Skills", "Standort (Talent)",
//   "Verfügbarkeit (Talent)" wurden entfernt — Duplikate der bereits
//   live funktionierenden Editoren auf TalentProfilePage.jsx
//   (handleSkillsChange / handleLocationChange / handleAvailabilityChange).
// - Talent-Bezeichnung / Talent-Slogan lasen zuvor die falsche/nicht
//   existierende Spalte `talent` — korrigiert auf die echten Spalten
//   `talent_title` / `talent_description` (siehe TalentOnboarding.jsx) und
//   werden jetzt tatsächlich beim Speichern mitgeschrieben (vorher: nie).
// - `tagline` und `dna_tags` hatten keine UI zum Bearbeiten und werden von
//   keiner Ansicht angezeigt — als totes Passthrough aus dem Save entfernt.
// ═══════════════════════════════════════════════════════════
// Basis-Profil:   profiles (full_name, display_name, username, email,
//                           bio, location, website, is_available)
// Talent-Profil:  profiles (talent_title, talent_description, hourly_rate)
// Speichern via:  saveProfile() aus AuthContext (supabase.profiles.update)
// Nach Speichern: refreshProfile() → live im Admin Dashboard sichtbar
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { isProfileTalent } from "../../lib/profileUtils.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";

// ── Design Tokens ──────────────────────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  coral:     "#FF6B6B",
  coralSoft: "rgba(255,107,107,0.10)",
  green:     "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.08)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
  ff: "Inter,sans-serif",
};

// ── Tabs ───────────────────────────────────────────────────────────
const TABS = [
  { key: "basis",   label: "Basis-Profil",   icon: <HUIProfilIcon size={14}/> },
  { key: "talent",  label: "Talent-Profil",   icon: <HUITalentIcon size={14}/> },
];

// Fixe Optionen
// (FOCUS_TYPES / CATEGORIES / SKILLS_OPTS entfernt 2026-08-06 — die Felder,
// die sie befüllten, wurden aus diesem Modal entfernt, siehe Kommentar oben.)

// ── Haupt-Komponente ───────────────────────────────────────────────
export default function ProfilBearbeitenModal({ profile, onClose, onProfileUpdate }) {
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  useModalRegistration(true, () => onClose?.(), "ProfilBearbeitenModal");
  const { saveProfile, refreshProfile, user } = useAuth() || {};
  // Sprint F.4C: einzige Wahrheitsquelle
  const isTalent = isProfileTalent(profile);

  // ── State: Basis-Felder ──────────────────────────────────────────
  const [fullName,      setFullName]      = useState(profile?.full_name      || "");
  const [displayName,   setDisplayName]   = useState(profile?.display_name   || "");
  const [username,      setUsername]      = useState(profile?.username        || "");
  const [bio,           setBio]           = useState(profile?.bio             || "");
  // Sprint F.3B: location aus profiles.location (location_label existiert nicht in profiles-Tabelle)
  const [locationLabel, setLocationLabel] = useState(profile?.location || profile?.location_label || "");
  const [locationLat,   setLocationLat]   = useState(profile?.location_lat  || null);
  const [locationLng,   setLocationLng]   = useState(profile?.location_lng  || null);
  const [geoLoading,    setGeoLoading]    = useState(false);
  const [website,       setWebsite]       = useState(profile?.website         || "");

  // ── State: Kontakt-Felder ────────────────────────────────────────
  const [email,         setEmail]         = useState(profile?.email           || "");

  // ── State: Talent-Profil (wirker_profiles) ───────────────────────
  // Sprint 2026-08-06: nur echte, kollisionsfreie profiles-Spalten.
  // talent_title/talent_description existieren real (siehe TalentOnboarding.jsx);
  // Kategorien/Skills/Standort/Radius/Verfügbarkeit haben eigene, bereits
  // live funktionierende Editoren (siehe Kopf-Kommentar) und wurden entfernt.
  const [talentTitle,       setTalentTitle]       = useState("");
  const [talentDescription, setTalentDescription] = useState("");
  const [talentRate,        setTalentRate]        = useState("");

  // ── State: UI ────────────────────────────────────────────────────
  const [tab,            setTab]          = useState("basis");
  const [saving,         setSaving]       = useState(false);
  const [saveOk,         setSaveOk]       = useState(false);
  const [saveErr,        setSaveErr]      = useState("");
  const [usernameErr,    setUsernameErr]  = useState("");
  const [usernameOk,     setUsernameOk]   = useState(false);
  const [checkingUname,  setCheckingUname]= useState(false);

  // ── Talent-Profil laden — echte Spalten aus profiles (Fakten-Check 2026-08-06) ──
  useEffect(() => {
    if (!isTalent || !profile?.id) return;
    setTalentTitle(profile?.talent_title || "");
    setTalentDescription(profile?.talent_description || "");
    setTalentRate(profile?.hourly_rate ? String(profile.hourly_rate) : "");
  }, [isTalent, profile?.id]);

  // ── Username-Check (debounced) ───────────────────────────────────
  useEffect(() => {
    const orig = profile?.username || "";
    if (username === orig) { setUsernameErr(""); setUsernameOk(false); return; }
    if (!username.trim()) { setUsernameErr("Username darf nicht leer sein."); setUsernameOk(false); return; }
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      setUsernameErr("3–30 Zeichen: a–z, 0–9, . oder _");
      setUsernameOk(false); return;
    }
    setCheckingUname(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", profile?.id)
        .maybeSingle();
      setCheckingUname(false);
      if (data) {
        setUsernameErr("Dieser Username ist bereits vergeben.");
        setUsernameOk(false);
      } else {
        setUsernameErr("");
        setUsernameOk(true);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [username, profile?.username, profile?.id]);


  // ── GPS-Standorterkennung ─────────────────────────────────────────
  const handleGPSLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setLocationLat(lat);
        setLocationLng(lng);
        // Reverse-Geocoding: Koordinaten → lesbarer Ortsname
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=de`,
            { headers: { Accept: "application/json" } }
          );
          const d = await res.json();
          const addr = d.address || {};
          const label = [
            addr.city || addr.town || addr.village || addr.county || addr.state_district,
            addr.state,
            addr.country,
          ].filter(Boolean).join(", ");
          if (label) setLocationLabel(label);
        } catch {/* ignore */}
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // ── Speichern ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (saving) return;
    if (usernameErr) { setSaveErr("Bitte Username-Fehler beheben."); return; }
    setSaving(true); setSaveErr(""); setSaveOk(false);

    try {
      // 1. Basis-Profil-Felder (immer)
      const profileUpdates = {
        full_name:      fullName.trim(),
        display_name:   displayName.trim() || fullName.trim(),
        username:       username.trim().toLowerCase(),
        bio:            bio.trim(),
        location:       locationLabel.trim(), // SSOT: profiles.location
        location_label: locationLabel.trim(), // Sync: alle Anzeige-Stellen (Feed, Discover, Karten) lesen location_label
        website:        website.trim(),
      };

      // 2. Talent-Felder NUR mitschreiben, wenn Talent-User (echte, kollisionsfreie
      //    Spalten: talent_title / talent_description / hourly_rate — Fakten-Check
      //    2026-08-06, siehe Kopf-Kommentar. Kategorien/Skills/Standort/Radius/
      //    Verfügbarkeit(Talent) haben eigene Editoren und werden hier NICHT berührt.)
      if (isTalent) {
        profileUpdates.talent_title       = talentTitle.trim();
        profileUpdates.talent_description = talentDescription.trim();
        profileUpdates.hourly_rate        = talentRate ? parseFloat(talentRate) : null;
      }

      const { error: profErr } = await (saveProfile
        ? saveProfile(profileUpdates)
        : supabase.from("profiles")
            .update({ ...profileUpdates, updated_at: new Date().toISOString() })
            .eq("id", profile?.id));

      if (profErr) throw new Error(profErr.message || profErr);

      // 2b. GPS-Koordinaten separat speichern (Spalten evtl. noch nicht in Produktion —
      //     Migration 081 muss manuell im Supabase SQL Editor ausgeführt werden).
      //     Fehler hierbei dürfen NICHT den gesamten Save blockieren.
      if (locationLat != null && locationLng != null) {
        try {
          await supabase.from("profiles")
            .update({ location_lat: locationLat, location_lng: locationLng })
            .eq("id", profile?.id);
        } catch {/* Spalte existiert noch nicht — Migration 081 ausstehen */}
      }

      // 3. Auth Profil neu laden → live im Admin + UI
      if (refreshProfile) await refreshProfile();

      // 4. Parent benachrichtigen
      onProfileUpdate?.();

      setSaveOk(true);
      setTimeout(() => {
        setSaveOk(false);
        onClose?.();
      }, 1200);

    } catch(e) {
      setSaveErr(e.message || "Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }, [saving, usernameErr, fullName, displayName, username, bio,
      locationLabel, locationLat, locationLng, website,
      isTalent, talentTitle, talentDescription, talentRate,
      saveProfile, refreshProfile, profile?.id, onClose, onProfileUpdate]);

  // ── Modal ─────────────────────────────────────────────────────────
  const modal = (
    <div
      style={{ position:"fixed", inset:0, zIndex:10500,
        background:"rgba(26,26,24,0.55)", display:"flex", alignItems:"flex-end" }}
      onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width:"100%", maxWidth:480, margin:"0 auto",
        background:T.bg, borderRadius:"24px 24px 0 0",
        maxHeight:"calc(94dvh - var(--hui-keyboard-inset, 0px))", overflow:"hidden",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
        fontFamily:T.ff,
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div {...dragHandlers} style={{ touchAction:"none", cursor:"grab", width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 20px 14px", flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight: 600, color:T.ink, letterSpacing:"-0.02em" }}>
              {isTalent ? "Basis & Talent-Profil" : "Basis-Profil"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
            borderRadius:"50%", width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.inkSoft,
          }}>✕</button>
        </div>

        {/* Tab-Bar */}
        <div style={{
          display:"flex", gap:0, margin:"0 20px 14px", flexShrink:0,
          background:"rgba(26,26,24,0.06)", borderRadius:T.r12, padding:3,
        }}>
          {TABS.filter(t => t.key !== "talent" || isTalent).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex:1, padding:"8px 4px", borderRadius:T.r12-2,
              border:"none", cursor:"pointer", fontFamily:T.ff,
              fontSize:12, fontWeight: 600,
              background: tab===t.key ? T.bgCard : "transparent",
              color: tab===t.key ? T.ink : T.inkSoft,
              boxShadow: tab===t.key ? "0 1px 4px rgba(26,26,24,0.10)" : "none",
              transition:"all .15s", whiteSpace:"nowrap",
            }}>
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                {t.icon}
                <span>{t.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Scroll-Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 20px 12px",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>

          {/* ══ TAB: BASIS-PROFIL ══ */}
          {tab === "basis" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              <FieldGroup label="Öffentlicher Name">
                <Input value={fullName} onChange={setFullName}
                  placeholder="Dein vollständiger Name" maxLength={80} />
              </FieldGroup>

              <FieldGroup label="Anzeigename (Spitzname)">
                <Input value={displayName} onChange={setDisplayName}
                  placeholder="Wie soll dein Name angezeigt werden?" maxLength={60} />
              </FieldGroup>

              <FieldGroup
                label="@Username"
                hint={checkingUname ? "Prüfe…" : usernameOk ? "✅ Verfügbar" : usernameErr || "Nur Kleinbuchstaben, Zahlen, _ oder ."}
                hintColor={usernameErr ? T.coral : usernameOk ? T.green : T.inkFaint}
              >
                <Input
                  value={username} onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_.]/g,""))}
                  placeholder="dein.username" maxLength={30}
                  prefix="@"
                  hasError={!!usernameErr}
                  hasSuccess={usernameOk}
                />
              </FieldGroup>

              <FieldGroup label="Bio / Über mich" hint={`${bio.length}/200`}>
                <Textarea value={bio} onChange={setBio}
                  placeholder="Erzähl etwas über dich…" rows={4} maxLength={200} />
              </FieldGroup>

              {/* "Fokus / Bereich" entfernt 2026-08-06 — profiles.focus_type ist
                  live die Sichtbarkeits-Einstellung (Sprint F.9G.1), keine Kategorie
                  mehr. Speichern hier hätte die Sichtbarkeit überschrieben. */}

              <FieldGroup label="Standort">
                {/* GPS-Button + Autocomplete */}
                <div style={{ position:"relative" }}>
                  <LocationAutocompleteInput
                    value={locationLabel}
                    onChange={v => { setLocationLabel(v); setLocationLat(null); setLocationLng(null); }}
                    onPick={place => { setLocationLabel(place.label); setLocationLat(place.lat); setLocationLng(place.lng); }}
                    placeholder="Stadt oder Region suchen…"
                    style={{
                      width:"100%", fontSize:14, padding:"11px 44px 11px 38px",
                      border:`1.5px solid rgba(26,26,24,0.15)`, borderRadius:T.r12,
                      background:T.bgCard, color:T.ink, fontFamily:T.ff, outline:"none",
                      boxSizing:"border-box",
                    }}
                  />
                  {/* Standort-Icon links */}
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                    <HUILocationIcon size={15} style={{ color: locationLat ? "#0EC4B8" : "rgba(26,26,24,0.35)" }}/>
                  </span>
                  {/* GPS-Button rechts */}
                  <button onClick={handleGPSLocation} disabled={geoLoading}
                    title="Aktuellen Standort verwenden"
                    style={{
                      position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                      background:"none", border:"none", cursor:"pointer", padding:4,
                      color: geoLoading ? "#0EC4B8" : "rgba(26,26,24,0.40)", fontSize:16,
                      display:"flex", alignItems:"center",
                    }}>
                    {geoLoading ? "⏳" : "📍"}
                  </button>
                </div>
                {locationLat && (
                  <div style={{ fontSize:10.5, color:"#0EC4B8", marginTop:3 }}>
                    ✓ Koordinaten gespeichert ({locationLat.toFixed(3)}, {locationLng.toFixed(3)})
                  </div>
                )}
              </FieldGroup>



              <FieldGroup label="Website / Portfolio">
                <Input value={website} onChange={setWebsite}
                  placeholder="https://deine-website.de" icon={<HUILinkIcon size={15}/>} maxLength={200} />
              </FieldGroup>

              {/* "Skills" (Basis) entfernt 2026-08-06 — profiles.skills ist live
                  die "Interessen & Werte"-Sektion (InteressenSection.jsx). Bearbeitung
                  dort im eigenen Profil, nicht hier. */}

              {/* "Verfügbarkeit" entfernt 2026-08-07 — Duplikat der bereits live
                  funktionierenden AvailabilitySection.jsx (profiles.is_available),
                  direkt im eigenen Profil (MyBasisProfile.jsx/TalentProfilePage.jsx)
                  editierbar. Ein Speichern hier hätte denselben Wert nur redundant
                  überschrieben — gleiches Muster wie Fokus/Bereich und Skills oben. */}

            </div>
          )}

          {/* ══ TAB: TALENT-PROFIL ══ — nur echte, kollisionsfreie profiles-Spalten.
              Kategorien / Professionelle Skills / Standort / Angebotsradius /
              Verfügbarkeit(Talent) wurden entfernt: sie haben bereits eigene, live
              funktionierende Editoren auf dem Talent-Profil selbst (siehe Kopf-
              Kommentar) — hier hätten sie diese stillschweigend überschrieben. */}
          {tab === "talent" && isTalent && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              <div style={{ height:1, background:T.border, margin:"4px 0" }}/>

              <InfoBox>
                Kategorien, Skills, Standort und Verfügbarkeit für dein Talent
                bearbeitest du direkt auf deinem Talent-Profil.
              </InfoBox>

              <FieldGroup label="Talent-Bezeichnung (Berufsfeld)">
                <Input value={talentTitle} onChange={setTalentTitle}
                  placeholder="z.B. Fotograf, Musiker, Coach" maxLength={80} />
              </FieldGroup>

              <FieldGroup label="Talent-Kurzbeschreibung">
                <Input value={talentDescription} onChange={setTalentDescription}
                  placeholder="Was macht dich aus? Was bietest du an?" maxLength={120} />
              </FieldGroup>

              <FieldGroup label="Stundensatz (€)">
                <Input value={talentRate} onChange={setTalentRate}
                  placeholder="z.B. 120" type="number" icon={<HUIEuroIcon size={15}/>} />
              </FieldGroup>

            </div>
          )}

        </div>

        {/* ── Feedback ── */}
        {saveErr && (
          <div style={{
            margin:"0 20px 8px", padding:"10px 14px", borderRadius:T.r12,
            background:T.coralSoft, border:`1px solid ${T.coral}40`,
            fontSize:13, color:T.coral, fontWeight:600, flexShrink:0,
          }}>
            ❌ {saveErr}
          </div>
        )}
        {saveOk && (
          <div style={{
            margin:"0 20px 8px", padding:"10px 14px", borderRadius:T.r12,
            background:T.greenSoft, border:`1px solid ${T.green}40`,
            fontSize:13, color:T.green, fontWeight: 600, flexShrink:0,
          }}>
            ✅ Gespeichert! Profil wurde aktualisiert.
          </div>
        )}

        {/* ── Speichern-Button ── */}
        <div style={{ padding:"12px 20px 36px", borderTop:`1px solid ${T.border}`, background:T.bg, flexShrink:0 }}>
          <button
            onClick={handleSave}
            disabled={saving || !!usernameErr}
            style={{
              width:"100%", padding:"14px",
              borderRadius:T.r16, border:"none",
              cursor: (saving || !!usernameErr) ? "not-allowed" : "pointer",
              background: (saving || !!usernameErr)
                ? "rgba(26,26,24,0.08)"
                : `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
              color: (saving || !!usernameErr) ? T.inkSoft : "#fff",
              fontSize:15, fontWeight: 600, fontFamily:T.ff,
              letterSpacing:"-0.01em",
              boxShadow: (saving || !!usernameErr) ? "none" : "0 4px 16px rgba(14,196,184,0.30)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"all .2s",
            }}
          >
            {saving ? (
              <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> Wird gespeichert…</>
            ) : saveOk ? "✅ Gespeichert!" : "💾 Änderungen speichern"}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Primitive UI-Komponenten ───────────────────────────────────────

function FieldGroup({ label, hint, hintColor, children }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <label style={{ fontSize:12, fontWeight: 600, color:T.ink, letterSpacing:"-0.01em" }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize:11, color: hintColor || T.inkFaint }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, maxLength, type="text", icon, prefix, disabled, hasError, hasSuccess }) {
  const borderColor = hasError ? T.coral : hasSuccess ? T.green : "rgba(26,26,24,0.15)";
  return (
    <div style={{
      display:"flex", alignItems:"center",
      background:T.bgCard, borderRadius:T.r12,
      border:`1.5px solid ${borderColor}`,
      overflow:"hidden", opacity: disabled ? 0.55 : 1,
      boxShadow: hasError ? `0 0 0 3px ${T.coralSoft}` : hasSuccess ? `0 0 0 3px ${T.greenSoft}` : "none",
    }}>
      {(icon || prefix) && (
        <span style={{ padding:"0 6px 0 12px", fontSize:15, color:T.inkSoft, flexShrink:0 }}>
          {icon || prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => !disabled && onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          flex:1, padding:"11px 12px 11px", border:"none", outline:"none",
          fontSize:14, color:T.ink, fontFamily:T.ff, background:"transparent",
          WebkitAppearance:"none",
        }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows, maxLength }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value.slice(0, maxLength))}
      placeholder={placeholder}
      rows={rows || 4}
      style={{
        width:"100%", boxSizing:"border-box",
        padding:"12px 14px", border:`1.5px solid rgba(26,26,24,0.15)`,
        borderRadius:T.r12, fontSize:14, color:T.ink,
        fontFamily:T.ff, resize:"vertical", outline:"none",
        background:T.bgCard, lineHeight:1.6,
      }}
    />
  );
}

function ToggleSwitch({ value, onChange, labelOn, labelOff }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display:"flex", alignItems:"center", gap:12,
        width:"100%", padding:"12px 16px", borderRadius:T.r12,
        background: value ? T.tealSoft : "rgba(26,26,24,0.04)",
        border: `1.5px solid ${value ? T.tealMid : T.border}`,
        cursor:"pointer", textAlign:"left", fontFamily:T.ff,
        WebkitTapHighlightColor:"transparent",
        transition:"all .2s",
      }}
    >
      {/* Toggle-Pill */}
      <div style={{
        width:40, height:22, borderRadius:11, flexShrink:0,
        background: value ? T.teal : "rgba(26,26,24,0.18)",
        position:"relative", transition:"background .2s",
      }}>
        <div style={{
          position:"absolute", top:3, left: value ? 21 : 3,
          width:16, height:16, borderRadius:"50%", background:"#fff",
          boxShadow:"0 1px 3px rgba(0,0,0,0.25)",
          transition:"left .2s",
        }} />
      </div>
      <span style={{ fontSize:13, fontWeight:600, color: value ? T.teal : T.inkSoft }}>
        {value ? labelOn : labelOff}
      </span>
    </button>
  );
}

function InfoBox({ children }) {
  return (
    <div style={{
      padding:"10px 14px", borderRadius:T.r12,
      background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)",
      fontSize:12, color:"#92400E", lineHeight:1.5,
    }}>
      {children}
    </div>
  );
}

// ProfilBearbeitenModal.jsx — vollständige Profil-Bearbeitung
// ═══════════════════════════════════════════════════════════
// Basis-Profil:   profiles (full_name, display_name, username, email, phone,
//                           bio, tagline, location_label, website, skills,
//                           dna_tags, focus_type, is_available, hourly_rate)
// Talent-Profil:  wirker_profiles (talent, tagline, categories, skills,
//                                  location_label, radius_km, hourly_rate,
//                                  is_available)
// Speichern via:  saveProfile() aus AuthContext + supabase wirker_profiles update
// Nach Speichern: refreshProfile() → live im Admin Dashboard sichtbar
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { getFlowCategoryOptions } from "../../lib/categories.js";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { isProfileTalent } from "../../lib/profileUtils.js";
import { useAuth } from "../../lib/AuthContext.jsx";

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
  ff: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

// ── Tabs ───────────────────────────────────────────────────────────
const TABS = [
  { key: "basis",   label: "Basis-Profil",   icon: "👤" },
  { key: "kontakt", label: "Kontakt",         icon: "📬" },
  { key: "talent",  label: "Talent-Profil",   icon: "🎯" },
];

// Fixe Optionen
const FOCUS_TYPES  = ["Kreativ","Sozial","Technisch","Bildung","Bewegung","Handel","Gastro","Beratung","Sonstiges"];
// Kategorien-Architektur vereinheitlicht (2026-07-06, Lars) -- zentrale
// Single Source of Truth statt hartcodierter lokaler Liste. Liefert exakt
// dieselben 16 Werte in derselben Reihenfolge wie zuvor (siehe
// src/lib/categories.js, FLOW_ORDER.profile) -- keine sichtbare Aenderung
// fuer Nutzer, kein Datenformat-Wechsel fuer wirker_profiles.categories.
const CATEGORIES   = getFlowCategoryOptions("profile");
const SKILLS_OPTS  = ["Gitarre","Klavier","Gesang","Fotografie","Videoschnitt","Grafikdesign","Illustration",
                       "Webdesign","Programmierung","Coaching","Yoga","Meditation","Kochen","Backen",
                       "Schreiben","Übersetzen","Social Media","Marketing","Beratung","Sonstiges"];

// ── Haupt-Komponente ───────────────────────────────────────────────
export default function ProfilBearbeitenModal({ profile, onClose, onProfileUpdate }) {
  const { saveProfile, refreshProfile, user } = useAuth() || {};
  // Sprint F.4C: einzige Wahrheitsquelle
  const isTalent = isProfileTalent(profile);

  // ── State: Basis-Felder ──────────────────────────────────────────
  const [fullName,      setFullName]      = useState(profile?.full_name      || "");
  const [displayName,   setDisplayName]   = useState(profile?.display_name   || "");
  const [username,      setUsername]      = useState(profile?.username        || "");
  const [bio,           setBio]           = useState(profile?.bio             || "");
  const [tagline,       setTagline]       = useState(profile?.tagline         || "");
  const [focusType,     setFocusType]     = useState(profile?.focus_type      || "");
  // Sprint F.3B: location aus profiles.location (location_label existiert nicht in profiles-Tabelle)
  const [locationLabel, setLocationLabel] = useState(profile?.location || profile?.location_label || "");
  const [website,       setWebsite]       = useState(profile?.website         || "");
  const [skills,        setSkills]        = useState(profile?.skills          || []);
  const [dnaTags,       setDnaTags]       = useState(profile?.dna_tags        || []);
  const [isAvailable,   setIsAvailable]   = useState(profile?.is_available    ?? true);
  const [hourlyRate,    setHourlyRate]    = useState(profile?.hourly_rate     || "");

  // ── State: Kontakt-Felder ────────────────────────────────────────
  const [email,         setEmail]         = useState(profile?.email           || "");
  const [phone,         setPhone]         = useState(profile?.phone           || "");

  // ── State: Talent-Profil (wirker_profiles) ───────────────────────
  const [wpData,         setWpData]       = useState(null);  // aktueller DB-Stand
  const [talentTitle,    setTalentTitle]  = useState("");
  const [talentTagline,  setTalentTagline]= useState("");
  const [talentCats,     setTalentCats]   = useState([]);
  const [talentSkills,   setTalentSkills] = useState([]);
  const [talentLocation, setTalentLocation]=useState("");
  const [talentRadius,   setTalentRadius] = useState("");
  const [talentRate,     setTalentRate]   = useState("");
  const [talentAvail,    setTalentAvail]  = useState(true);

  // ── State: UI ────────────────────────────────────────────────────
  const [tab,            setTab]          = useState("basis");
  const [saving,         setSaving]       = useState(false);
  const [saveOk,         setSaveOk]       = useState(false);
  const [saveErr,        setSaveErr]      = useState("");
  const [usernameErr,    setUsernameErr]  = useState("");
  const [usernameOk,     setUsernameOk]   = useState(false);
  const [checkingUname,  setCheckingUname]= useState(false);

  // ── Talent-Profil laden ──────────────────────────────────────────
  useEffect(() => {
    if (!isTalent || !profile?.id) return;
    (async () => {
      const { data } = await supabase
        .from("wirker_profiles")
        .select("*")
        .eq("user_id", profile.id)
        .single();
      if (data) {
        setWpData(data);
        setTalentTitle(data.talent      || "");
        setTalentTagline(data.tagline   || "");
        setTalentCats(data.categories   || []);
        setTalentSkills(data.skills     || []);
        setTalentLocation(data.location_label || "");
        setTalentRadius(data.radius_km  || "");
        setTalentRate(data.hourly_rate  || "");
        setTalentAvail(data.is_available ?? true);
      }
    })();
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

  // ── Speichern ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (saving) return;
    if (usernameErr) { setSaveErr("Bitte Username-Fehler beheben."); return; }
    setSaving(true); setSaveErr(""); setSaveOk(false);

    try {
      // 1. profiles update via saveProfile (AuthContext)
      const profileUpdates = {
        full_name:      fullName.trim(),
        display_name:   displayName.trim() || fullName.trim(),
        username:       username.trim().toLowerCase(),
        bio:            bio.trim(),
        tagline:        tagline.trim(),
        focus_type:     focusType,
        location:       locationLabel.trim(), // Sprint F.3B: schreibt profiles.location (Wahrheitsquelle)
        website:        website.trim(),
        skills:         skills,
        dna_tags:       dnaTags,
        is_available:   isAvailable,
        hourly_rate:    hourlyRate ? parseFloat(hourlyRate) : null,
        phone:          phone.trim(),
      };

      const { error: profErr } = await (saveProfile
        ? saveProfile(profileUpdates)
        : supabase.from("profiles")
            .update({ ...profileUpdates, updated_at: new Date().toISOString() })
            .eq("id", profile?.id));

      if (profErr) throw new Error(profErr.message || profErr);

      // 2. Talent-Profil (wirker_profiles) wenn vorhanden
      if (isTalent && profile?.id) {
        const wpUpdates = {
          talent:         talentTitle.trim(),
          tagline:        talentTagline.trim(),
          categories:     talentCats,
          skills:         talentSkills,
          location_label: talentLocation.trim(),
          radius_km:      talentRadius ? parseInt(talentRadius, 10) : null,
          hourly_rate:    talentRate ? parseFloat(talentRate) : null,
          is_available:   talentAvail,
          updated_at:     new Date().toISOString(),
        };
        if (wpData?.id) {
          await supabase.from("wirker_profiles").update(wpUpdates).eq("id", wpData.id);
        } else {
          await supabase.from("wirker_profiles").insert({ user_id: profile.id, ...wpUpdates });
        }
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
  }, [saving, usernameErr, fullName, displayName, username, bio, tagline, focusType,
      locationLabel, website, skills, dnaTags, isAvailable, hourlyRate, phone,
      isTalent, talentTitle, talentTagline, talentCats, talentSkills, talentLocation,
      talentRadius, talentRate, talentAvail, wpData, saveProfile, refreshProfile,
      profile?.id, onClose, onProfileUpdate]);

  // ── Tag-Toggle Helper ────────────────────────────────────────────
  const toggleArr = (arr, setArr, val, max = 10) => {
    if (arr.includes(val)) setArr(arr.filter(v => v !== val));
    else if (arr.length < max) setArr([...arr, val]);
  };

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
        maxHeight:"94vh", overflow:"hidden",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
        fontFamily:T.ff,
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 20px 14px", flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
              ✏️ Profil bearbeiten
            </div>
            <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>
              {isTalent ? "Basis + Talent-Profil" : "Basis-Profil"}
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
              fontSize:12, fontWeight:700,
              background: tab===t.key ? T.bgCard : "transparent",
              color: tab===t.key ? T.ink : T.inkSoft,
              boxShadow: tab===t.key ? "0 1px 4px rgba(26,26,24,0.10)" : "none",
              transition:"all .15s", whiteSpace:"nowrap",
            }}>
              {t.icon} {t.label}
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

              <FieldGroup label="Bio / Über mich" hint={`${bio.length}/500`}>
                <Textarea value={bio} onChange={setBio}
                  placeholder="Erzähl etwas über dich…" rows={4} maxLength={500} />
              </FieldGroup>

              <FieldGroup label="Tagline (Kurzslogan)">
                <Input value={tagline} onChange={setTagline}
                  placeholder="Ein Satz der dich beschreibt" maxLength={100} />
              </FieldGroup>

              <FieldGroup label="Fokus / Bereich">
                <TagSelect
                  options={FOCUS_TYPES} selected={focusType ? [focusType] : []}
                  onToggle={v => setFocusType(v === focusType ? "" : v)}
                  single
                />
              </FieldGroup>

              <FieldGroup label="Standort">
                <Input value={locationLabel} onChange={setLocationLabel}
                  placeholder="Stadt, Region oder Land" maxLength={80} icon="📍" />
              </FieldGroup>

              <FieldGroup label="Website / Link">
                <Input value={website} onChange={setWebsite}
                  placeholder="https://deine-website.de" maxLength={200} icon="🔗" />
              </FieldGroup>

              <FieldGroup label="Skills (max. 10)">
                <TagSelect
                  options={SKILLS_OPTS} selected={skills}
                  onToggle={v => toggleArr(skills, setSkills, v, 10)}
                />
              </FieldGroup>

              <FieldGroup label="DNA-Tags (max. 8)">
                <Input value={dnaTags.join(", ")}
                  onChange={v => setDnaTags(v.split(",").map(s=>s.trim()).filter(Boolean).slice(0,8))}
                  placeholder="z.B. kreativ, neugierig, nachhaltig" maxLength={200} />
                <div style={{ fontSize:11, color:T.inkFaint, marginTop:4 }}>
                  Kommagetrennt eingeben · max. 8 Tags
                </div>
              </FieldGroup>

              <FieldGroup label="Stundensatz (€)">
                <Input value={hourlyRate} onChange={setHourlyRate}
                  placeholder="z.B. 85" type="number" icon="€" />
              </FieldGroup>

              <FieldGroup label="Verfügbarkeit">
                <ToggleSwitch
                  value={isAvailable} onChange={setIsAvailable}
                  labelOn="Verfügbar für Anfragen"
                  labelOff="Aktuell nicht verfügbar"
                />
              </FieldGroup>

            </div>
          )}

          {/* ══ TAB: KONTAKT ══ */}
          {tab === "kontakt" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              <InfoBox>
                📧 E-Mail-Änderungen werden direkt in Supabase gespeichert. Für Login-E-Mail-Änderung ist ggf. eine Bestätigung per E-Mail nötig.
              </InfoBox>

              <FieldGroup label="E-Mail-Adresse">
                <Input value={email} onChange={setEmail}
                  placeholder="deine@email.de" type="email" icon="📧"
                  disabled={true}
                />
                <div style={{ fontSize:11, color:T.inkFaint, marginTop:4 }}>
                  ⚠️ Login-E-Mail kann nur über Supabase Auth geändert werden.
                </div>
              </FieldGroup>

              <FieldGroup label="Telefonnummer">
                <Input value={phone} onChange={setPhone}
                  placeholder="+49 123 456789" type="tel" icon="📱" maxLength={30} />
              </FieldGroup>

              <FieldGroup label="Website / Portfolio">
                <Input value={website} onChange={setWebsite}
                  placeholder="https://deine-website.de" icon="🔗" maxLength={200} />
              </FieldGroup>

              <FieldGroup label="Standort">
                <Input value={locationLabel} onChange={setLocationLabel}
                  placeholder="Stadt, Region" icon="📍" maxLength={80} />
              </FieldGroup>

            </div>
          )}

          {/* ══ TAB: TALENT-PROFIL ══ */}
          {tab === "talent" && isTalent && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              <FieldGroup label="Talent-Bezeichnung (Berufsfeld)">
                <Input value={talentTitle} onChange={setTalentTitle}
                  placeholder="z.B. Fotograf, Musiker, Coach" maxLength={80} />
              </FieldGroup>

              <FieldGroup label="Talent-Slogan">
                <Input value={talentTagline} onChange={setTalentTagline}
                  placeholder="Dein professioneller Kurzslogan" maxLength={120} />
              </FieldGroup>

              <FieldGroup label="Kategorien (max. 5)">
                <TagSelect
                  options={CATEGORIES} selected={talentCats}
                  onToggle={v => toggleArr(talentCats, setTalentCats, v, 5)}
                />
              </FieldGroup>

              <FieldGroup label="Professionelle Skills (max. 10)">
                <TagSelect
                  options={SKILLS_OPTS} selected={talentSkills}
                  onToggle={v => toggleArr(talentSkills, setTalentSkills, v, 10)}
                />
              </FieldGroup>

              <FieldGroup label="Standort (Talent)">
                <Input value={talentLocation} onChange={setTalentLocation}
                  placeholder="Stadt oder Region" icon="📍" maxLength={80} />
              </FieldGroup>

              <FieldGroup label="Aktionsradius (km)">
                <Input value={talentRadius} onChange={setTalentRadius}
                  placeholder="z.B. 50" type="number" icon="🗺️" />
              </FieldGroup>

              <FieldGroup label="Stundensatz (€)">
                <Input value={talentRate} onChange={setTalentRate}
                  placeholder="z.B. 120" type="number" icon="€" />
              </FieldGroup>

              <FieldGroup label="Verfügbarkeit (Talent)">
                <ToggleSwitch
                  value={talentAvail} onChange={setTalentAvail}
                  labelOn="Für Buchungen verfügbar"
                  labelOff="Aktuell nicht buchbar"
                />
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
            fontSize:13, color:T.green, fontWeight:700, flexShrink:0,
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
              fontSize:15, fontWeight:800, fontFamily:T.ff,
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
        <label style={{ fontSize:12, fontWeight:700, color:T.ink, letterSpacing:"-0.01em" }}>
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

function TagSelect({ options, selected, onToggle, single }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} onClick={() => onToggle(opt)} style={{
            padding:"5px 12px", borderRadius:T.r99, fontFamily:T.ff,
            border: active ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
            background: active ? T.tealSoft : T.bgCard,
            color: active ? T.teal : T.inkSoft,
            fontSize:12, fontWeight: active ? 700 : 500,
            cursor:"pointer", transition:"all .12s",
            WebkitTapHighlightColor:"transparent",
          }}>
            {opt}
          </button>
        );
      })}
    </div>
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

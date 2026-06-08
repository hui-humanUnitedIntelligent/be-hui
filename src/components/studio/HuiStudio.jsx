// src/components/studio/HuiStudio.jsx
// ─────────────────────────────────────────────────────────────────
// HUI Studio — zentrale Verwaltungsoberfläche
// Öffnet sich über das ⚙️ Zahnrad im eigenen Profil.
// Trennung: Profil = Mensch · Studio = Verwaltung
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase }    from "../../lib/supabaseClient.js";
import { useAuth }     from "../../lib/AuthContext.jsx";
import AmbassadorSection, { AmbassadorCTA } from "../ambassador/AmbassadorSection.jsx";
import AmbassadorModal  from "../ambassador/AmbassadorModal.jsx";
import SettingsModal    from "../settings/SettingsModal.jsx";
import { useAmbassador } from "../../hooks/useAmbassador.js";

// ── Design Tokens (identisch zu MyBasisProfile) ──────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  bgSheet:   "rgba(252,251,248,0.98)",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.28)",
  border:    "rgba(26,26,24,0.08)",
  borderMid: "rgba(26,26,24,0.14)",
  px:        20,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:    "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  cardMd:  "0 2px 16px rgba(26,26,24,0.09), 0 1px 3px rgba(26,26,24,0.05)",
  sheet:   "0 -10px 40px rgba(26,26,24,0.10)",
};

const CSS = `
  .studio-root {
    background:${T.bg};
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .studio-scroll {
    overflow-y:auto;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .studio-scroll::-webkit-scrollbar { display:none; }
  .studio-press {
    -webkit-tap-highlight-color:transparent;
    transition:opacity .15s ease, transform .15s ease;
  }
  .studio-press:active { opacity:.72; transform:scale(.97); }
  @keyframes studio-slide-up {
    from { transform:translateY(100%); opacity:0; }
    to   { transform:translateY(0);    opacity:1; }
  }
`;

// ── Primitiven ────────────────────────────────────────────────────
function Gap({ h }) {
  return <div style={{ height: h }} />;
}
function Divider() {
  return <div style={{ height: 1, background: T.border, margin:`0 ${T.px}px` }} />;
}
function SectionLabel({ text }) {
  return (
    <div style={{
      padding:`0 ${T.px}px`,
      fontSize:11, fontWeight:700,
      color:T.inkFaint, letterSpacing:"0.07em",
      textTransform:"uppercase",
      marginBottom:8,
    }}>
      {text}
    </div>
  );
}

// ── Menü-Zeile ────────────────────────────────────────────────────
function StudioRow({ icon, label, sub, badge, onPress, danger, last }) {
  return (
    <button
      className="studio-press"
      onClick={onPress}
      style={{
        width:"100%", display:"flex", alignItems:"center", gap:14,
        padding:"14px 18px",
        background:"none", border:"none", cursor:"pointer",
        fontFamily:"inherit", textAlign:"left",
        borderBottom: last ? "none" : `1px solid ${T.border}`,
      }}
    >
      <span style={{ fontSize:18, width:24, textAlign:"center", flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color: danger ? "#E53935" : T.ink }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:1, lineHeight:1.4 }}>
            {sub}
          </div>
        )}
      </div>
      {badge && (
        <span style={{
          padding:"2px 8px", borderRadius:99,
          background:T.tealSoft, border:`1px solid ${T.tealMid}`,
          fontSize:11, fontWeight:700, color:T.teal,
          flexShrink:0,
        }}>
          {badge}
        </span>
      )}
      <span style={{ fontSize:16, color:T.inkFaint, flexShrink:0 }}>›</span>
    </button>
  );
}

// ── Karten-Container ──────────────────────────────────────────────
function StudioCard({ children }) {
  return (
    <div style={{
      margin:`0 ${T.px}px`,
      background:T.bgCard,
      borderRadius:T.r16,
      boxShadow:T.card,
      border:`1px solid ${T.border}`,
      overflow:"hidden",
    }}>
      {children}
    </div>
  );
}

// ── Impact-Sektion ────────────────────────────────────────────────
function ImpactSektion({ profile, impactData, loading }) {
  const stimmen = 2; // HUI-Talent: immer 2
  const isTalent = profile?.is_talent || profile?.membership_type === "talent";

  return (
    <div>
      <SectionLabel text="Impact" />
      <StudioCard>
        <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:6 }}>
            🗳️ Verfügbare Stimmen
          </div>
          {isTalent ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{
                display:"flex", gap:4,
              }}>
                {[1,2].map(i => (
                  <div key={i} style={{
                    width:10, height:10, borderRadius:"50%",
                    background:T.teal,
                  }}/>
                ))}
              </div>
              <span style={{ fontSize:13, color:T.teal, fontWeight:700 }}>
                2 Stimmen diesen Monat
              </span>
            </div>
          ) : (
            <div style={{ fontSize:12.5, color:T.inkFaint, lineHeight:1.5 }}>
              Talent-Mitglieder erhalten 2 Impact-Stimmen pro Monat.
            </div>
          )}
          <div style={{
            marginTop:10, padding:"8px 12px",
            background:T.tealSoft, borderRadius:T.r12,
            fontSize:11.5, color:T.inkSoft, lineHeight:1.5,
          }}>
            Als HUI-Talent entscheidest du mit, welche Herzensprojekte unterstützt werden.
          </div>
        </div>
        <StudioRow icon="🌍" label="Unterstützte Projekte"
          sub={impactData?.projects ? `${impactData.projects} Projekte bisher` : "Noch keine"}
          onPress={()=>{}} last={false}/>
        <StudioRow icon="📋" label="Abstimmungsverlauf"
          sub="Alle deine Abstimmungen im Überblick"
          onPress={()=>{}} last/>
      </StudioCard>
    </div>
  );
}

// ── Mein Wirken Sektion ───────────────────────────────────────────
function WirkenSektion({ wirkenData, loading }) {
  const items = [
    { icon:"💚", label:"Weiterempfehlungen", value: wirkenData?.recs   ?? "–" },
    { icon:"🎨", label:"Werke",              value: wirkenData?.works  ?? "–" },
    { icon:"🔭", label:"Erlebnisse",         value: wirkenData?.exps   ?? "–" },
    { icon:"🌍", label:"Impact-Projekte",    value: wirkenData?.impact ?? "–" },
  ];
  return (
    <div>
      <SectionLabel text="Mein Wirken" />
      <StudioCard>
        <div style={{ padding:"16px 18px" }}>
          {loading ? (
            [0,1,2,3].map(i => (
              <div key={i} style={{
                height:18, borderRadius:8,
                background:"rgba(26,26,24,0.06)",
                marginBottom:i<3?10:0,
              }}/>
            ))
          ) : (
            items.map(({ icon, label, value }, i) => (
              <div key={label} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                paddingBottom: i < items.length-1 ? 10 : 0,
                marginBottom:  i < items.length-1 ? 10 : 0,
                borderBottom:  i < items.length-1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:15 }}>{icon}</span>
                  <span style={{ fontSize:13, color:T.inkSoft }}>{label}</span>
                </div>
                <span style={{ fontSize:16, fontWeight:800, color:T.teal }}>{value}</span>
              </div>
            ))
          )}
          <div style={{
            marginTop:12, fontSize:11.5, color:T.inkFaint, lineHeight:1.4,
            fontStyle:"italic",
          }}>
            Profilaufrufe, Anfragen und Reichweite folgen in Kürze.
          </div>
        </div>
      </StudioCard>
    </div>
  );
}

// ── Einnahmen Sektion ─────────────────────────────────────────────
function EinnahmenSektion() {
  return (
    <div>
      <SectionLabel text="Einnahmen" />
      <StudioCard>
        <div style={{ padding:"20px 18px", textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>💰</div>
          <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:4 }}>
            Einnahmenübersicht
          </div>
          <div style={{ fontSize:12.5, color:T.inkFaint, lineHeight:1.55, maxWidth:260, margin:"0 auto" }}>
            Auszahlungen und Umsatzhistorie stehen bald zur Verfügung.
          </div>
        </div>
      </StudioCard>
    </div>
  );
}

// ── Mitgliedschaft Sektion ────────────────────────────────────────
function MitgliedschaftSektion({ profile, onOpenSettings }) {
  const isTalent = profile?.is_talent || profile?.membership_type === "talent";
  const isVerified = profile?.verified;

  return (
    <div>
      <SectionLabel text="Mitgliedschaft" />
      <StudioCard>
        {/* Status-Anzeige */}
        <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:40, height:40, borderRadius:12, flexShrink:0,
              background:isTalent ? T.tealSoft : "rgba(26,26,24,0.05)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20,
            }}>
              {isTalent ? "✨" : "🌿"}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:T.ink }}>
                {isTalent ? "HUI-Talent" : "HUI-Mitglied"}
              </div>
              <div style={{ fontSize:12, color:T.inkFaint, marginTop:1 }}>
                {isTalent ? "Aktiver Gestalter der Gemeinschaft" : "Teil der HUI-Gemeinschaft"}
              </div>
            </div>
            {isVerified && (
              <div style={{
                marginLeft:"auto", padding:"2px 8px", borderRadius:99,
                background:T.tealSoft, border:`1px solid ${T.tealMid}`,
                fontSize:11, fontWeight:700, color:T.teal,
              }}>
                ✓ Verifiziert
              </div>
            )}
          </div>
        </div>
        {!isTalent && (
          <StudioRow
            icon="✨" label="Talent-Mitgliedschaft"
            sub="Werke, Erlebnisse, Impact-Stimmen"
            onPress={onOpenSettings} last={false}
          />
        )}
        <StudioRow
          icon="🔍" label="Verifizierung"
          sub={isVerified ? "Profil ist verifiziert" : "Profil verifizieren lassen"}
          badge={isVerified ? "✓ Aktiv" : undefined}
          onPress={()=>{}} last={false}
        />
        <StudioRow
          icon="ℹ️" label="Mitgliedschaftsinformationen"
          sub="Was bedeutet deine Mitgliedschaft?"
          onPress={()=>{}} last
        />
      </StudioCard>
    </div>
  );
}

// ── Gemeinschaft Sektion ──────────────────────────────────────────
function GemeinschaftSektion({ profile, ambState, onApply }) {
  const refLink = ambState?.ambassadorData?.ref_link || null;

  return (
    <div>
      <SectionLabel text="Gemeinschaft" />
      <StudioCard>
        {profile?.is_ambassador ? (
          <AmbassadorSection
            ambassadorData={ambState.ambassadorData}
            userId={profile?.id}
          />
        ) : (
          <AmbassadorCTA
            isAmbassador={false}
            isPending={ambState?.isPending}
            ambassadorStatus={ambState?.ambassadorStatus}
            onApply={onApply}
          />
        )}
        <Divider/>
        <StudioRow icon="💌" label="Empfehlungen"
          sub="Weiterempfehlungen im Überblick"
          onPress={()=>{}} last={false}/>
        <StudioRow icon="👥" label="Einladungen"
          sub="Freunde zu HUI einladen"
          onPress={()=>{}} last={false}/>
        <StudioRow icon="🔗" label="Einladungslink"
          sub={refLink || "Noch kein Link — Ambassador werden"}
          onPress={()=>{}} last/>
      </StudioCard>
    </div>
  );
}

// ── System Sektion ────────────────────────────────────────────────
function SystemSektion({ onOpenSettings }) {
  return (
    <div>
      <SectionLabel text="System" />
      <StudioCard>
        <StudioRow icon="🔔" label="Benachrichtigungen"
          sub="Wähle, worüber du informiert wirst"
          onPress={onOpenSettings} last={false}/>
        <StudioRow icon="🔒" label="Datenschutz"
          sub="Datennutzung und Einstellungen"
          onPress={onOpenSettings} last={false}/>
        <StudioRow icon="👤" label="Konto"
          sub="E-Mail, Passwort, Abmelden"
          onPress={onOpenSettings} last={false}/>
        <StudioRow icon="🛡️" label="Sicherheit"
          sub="Passwort und Zwei-Faktor"
          onPress={onOpenSettings} last/>
      </StudioCard>
    </div>
  );
}

// ── Profil verwalten Sektion ──────────────────────────────────────
function ProfilVerwaltenSektion({ onEditProfile, onOpenSettings }) {
  return (
    <div>
      <SectionLabel text="Profil verwalten" />
      <StudioCard>
        <StudioRow icon="✏️" label="Profil bearbeiten"
          sub="Name, Bio, Interessen, Standort"
          onPress={onEditProfile} last={false}/>
        <StudioRow icon="🖼️" label="Bilder verwalten"
          sub="Avatar und Hintergrundbild"
          onPress={onEditProfile} last={false}/>
        <StudioRow icon="👁️" label="Sichtbarkeit verwalten"
          sub="Wer kann dein Profil sehen?"
          onPress={onOpenSettings} last/>
      </StudioCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HUI STUDIO — HAUPT-KOMPONENTE
// ══════════════════════════════════════════════════════════════════
export default function HuiStudio({ profile, onClose, onProfileUpdate }) {
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAmbModal, setShowAmbModal] = useState(false);
  const [impactData, setImpactData]   = useState(null);
  const [wirkenData, setWirkenData]   = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const ambState = useAmbassador(profile?.id ?? null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Impact + Wirken-Daten laden
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoadingData(true);
      try {
        const [payRes, worksRes, expsRes, recsRes] = await Promise.all([
          supabase.from("hui_payments")
            .select("amount_eur, impact_eur")
            .eq("user_id", profile.id)
            .eq("payment_status", "paid"),
          supabase.from("works")
            .select("id", { count:"exact", head:true })
            .eq("profile_id", profile.id),
          supabase.from("experiences")
            .select("id", { count:"exact", head:true })
            .eq("profile_id", profile.id),
          supabase.from("recommendations")
            .select("id", { count:"exact", head:true })
            .eq("target_id", profile.id),
        ]);
        const totalImpact = (payRes.data || []).reduce((s, r) => s + (r.impact_eur || 0), 0);
        setImpactData({ impact_eur: totalImpact, projects: 0 });
        setWirkenData({
          works:  worksRes.count ?? 0,
          exps:   expsRes.count  ?? 0,
          recs:   recsRes.count  ?? 0,
          impact: 0,
        });
      } catch(e) {
        console.warn("HuiStudio data load:", e);
      }
      setLoadingData(false);
    })();
  }, [profile?.id]);

  const handleEditProfile = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hui:open-profile-editor"));
    }
  }, []);

  if (!profile) return null;

  return createPortal(
    <div
      style={{
        position:"fixed", inset:0, zIndex:9600,
        display:"flex", flexDirection:"column",
        background:T.bg,
        opacity:    mounted ? 1 : 0,
        transform:  mounted ? "none" : "translateY(24px)",
        transition: "opacity .3s ease, transform .35s cubic-bezier(.22,1,.36,1)",
      }}
    >
      <style>{CSS}</style>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:`max(48px,calc(44px + env(safe-area-inset-top,0px))) ${T.px}px 14px`,
        background:T.bgCard,
        borderBottom:`1px solid ${T.border}`,
        boxShadow:"0 1px 8px rgba(26,26,24,0.05)",
        flexShrink:0,
      }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:"-0.03em" }}>
            ⚙️ HUI Studio
          </div>
          <div style={{ fontSize:12, color:T.inkFaint, marginTop:1 }}>
            {profile.display_name || profile.username || "Mein Studio"}
          </div>
        </div>
        <button
          className="studio-press"
          onClick={onClose}
          style={{
            width:36, height:36, borderRadius:"50%",
            background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:15, cursor:"pointer", touchAction:"manipulation",
            color:T.ink,
          }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        className="studio-scroll"
        style={{ flex:1, overflowY:"auto",
          paddingBottom:"max(40px,calc(32px + env(safe-area-inset-bottom,0px)))" }}
      >
        <Gap h={24}/>

        {/* 1. Profil verwalten */}
        <ProfilVerwaltenSektion
          onEditProfile={handleEditProfile}
          onOpenSettings={() => setShowSettings(true)}
        />
        <Gap h={24}/>

        {/* 2. Mitgliedschaft */}
        <MitgliedschaftSektion
          profile={profile}
          onOpenSettings={() => setShowSettings(true)}
        />
        <Gap h={24}/>

        {/* 3. Gemeinschaft */}
        <GemeinschaftSektion
          profile={profile}
          ambState={ambState}
          onApply={() => setShowAmbModal(true)}
        />
        <Gap h={24}/>

        {/* 4. Impact */}
        <ImpactSektion
          profile={profile}
          impactData={impactData}
          loading={loadingData}
        />
        <Gap h={24}/>

        {/* 5. Mein Wirken */}
        <WirkenSektion wirkenData={wirkenData} loading={loadingData}/>
        <Gap h={24}/>

        {/* 6. Einnahmen */}
        <EinnahmenSektion/>
        <Gap h={24}/>

        {/* 7. System */}
        <SystemSektion onOpenSettings={() => setShowSettings(true)}/>
        <Gap h={40}/>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={onProfileUpdate}
          onEditProfile={() => {
            setShowSettings(false);
            handleEditProfile();
          }}
          onOpenBookings={() => {
            setShowSettings(false);
            if (typeof window !== "undefined")
              window.dispatchEvent(new CustomEvent("hui:open-bookings"));
          }}
        />
      )}

      {/* Ambassador Bewerbungs-Modal */}
      {showAmbModal && profile?.id && (
        <AmbassadorModal
          userId={profile.id}
          onClose={() => setShowAmbModal(false)}
          onSuccess={() => {
            setShowAmbModal(false);
            onProfileUpdate?.({ is_ambassador: true });
          }}
        />
      )}
    </div>,
    document.body
  );
}

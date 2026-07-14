// src/components/studio/HuiStudio.jsx
// ─────────────────────────────────────────────────────────────────
// HUI Studio — zentrale Verwaltungsoberfläche
// Ambassador-Bereich vollständig integriert, live Supabase
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { isProfileTalent } from '../../lib/profileUtils.js';
import {
  HUIProfilIcon, HUIVerifIcon, HUISicherheitIcon, HUIMitgliedIcon,
  HUISupportIcon, HUITicketIcon, HUIAbmeldenIcon,
} from '../../design/icons/HuiSystemIcons.jsx';
import { createPortal } from "react-dom";
import { useAuth }     from "../../lib/AuthContext.jsx";
import ProfilBearbeitenModal    from "./ProfilBearbeitenModal.jsx";
import SicherheitPasswortModal  from "./SicherheitPasswortModal.jsx";
import SupportPage             from "../../pages/studio/SupportPage.jsx";
import MeineTicketsPage        from "../../pages/studio/MeineTicketsPage.jsx";
import SettingsModal    from "../settings/SettingsModal.jsx";

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.08)",
  px:        20,
  r16: 16, r12: 12, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
};

const CSS = `
  .studio-scroll {
    overflow-y:auto;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .studio-scroll::-webkit-scrollbar { display:none; }
  .studio-row-btn {
    -webkit-tap-highlight-color:transparent;
    transition:background .12s ease;
  }
  .studio-row-btn:active { background:rgba(14,196,184,0.06) !important; }
  .studio-press {
    -webkit-tap-highlight-color:transparent;
    transition:opacity .15s, transform .15s;
  }
  .studio-press:active { opacity:.72; transform:scale(.97); }
`;

// ── Primitives ────────────────────────────────────────────────────
function Gap({ h }) { return <div style={{ height: h }} />; }

function StudioSection({ label, children }) {
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:10, letterSpacing:"-0.01em" }}>
        {label}
      </div>
      <div style={{
        background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${T.border}`, overflow:"hidden", boxShadow:T.card,
      }}>
        {children}
      </div>
    </div>
  );
}

function StudioRow({ icon, label, badge, onPress, last = false, labelColor }) {
  return (
    <button className="studio-row-btn" onClick={onPress} style={{
      width:"100%", display:"flex", alignItems:"center", gap:14,
      padding:"15px 18px", background:"none", border:"none", cursor:"pointer",
      fontFamily:"inherit", textAlign:"left",
      borderBottom: last ? "none" : `1px solid ${T.border}`,
    }}>
      <span style={{
        width:34, height:34, borderRadius:10, flexShrink:0,
        background:"rgba(26,26,24,0.05)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"rgba(14,196,184,0.85)",
      }}>{icon}</span>
      <span style={{ flex:1, fontSize:14, fontWeight:500, color: labelColor || T.ink }}>{label}</span>
      {badge && (
        <span style={{
          padding:"2px 9px", borderRadius:99,
          background:T.tealSoft, border:`1px solid ${T.tealMid}`,
          fontSize:11, fontWeight:700, color:T.teal, flexShrink:0,
        }}>{badge}</span>
      )}
      <span style={{ fontSize:15, color:T.inkFaint, flexShrink:0 }}>›</span>
    </button>
  );
}

export default function HuiStudio({ profile, onClose, onProfileUpdate }) {
  const { signOut } = useAuth() || {};
  const [mounted,      setMounted]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfilBearbeiten, setShowProfilBearbeiten]= useState(false); // Profil bearbeiten
  const [showVerifCS,          setShowVerifCS]          = useState(false); // Verifizierung Coming Soon
  const [showSicherheit,        setShowSicherheit]        = useState(false); // Sicherheit & Passwort
  const [showLogoutConfirm,     setShowLogoutConfirm]     = useState(false); // Abmelden Bestätigung
  const [showMitgliedschaftCS,  setShowMitgliedschaftCS]  = useState(false); // Mitgliedschaft Coming Soon
  const [showSupport,          setShowSupport]          = useState(false);
  const [showMeineTickets,     setShowMeineTickets]     = useState(false);
  const [loggingOut,            setLoggingOut]            = useState(false);

  // Sprint F.4C: einzige Wahrheitsquelle
  const isTalent   = isProfileTalent(profile);
  const isVerified = profile?.verified  === true;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleEditProfile = useCallback(() => {
    setShowProfilBearbeiten(true);
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await signOut?.();
    } catch(e) { console.warn("[HuiStudio] signOut:", e); }
    setLoggingOut(false);
    setShowLogoutConfirm(false);
    onClose?.();
  }, [signOut, onClose]);

  if (!profile) return null;

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      display:"flex", flexDirection:"column",
      background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
      WebkitFontSmoothing:"antialiased",
      opacity:   mounted ? 1 : 0,
      transform: mounted ? "none" : "translateY(24px)",
      transition:"opacity .3s ease, transform .35s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div style={{
        padding:`max(52px,calc(48px + env(safe-area-inset-top,0px))) ${T.px}px 16px`,
        background:T.bgCard,
        borderBottom:`1px solid ${T.border}`,
        flexShrink:0, position:"relative",
      }}>
        <button onClick={onClose} style={{
          position:"absolute",
          top:"max(14px,calc(10px + env(safe-area-inset-top,0px)))",
          left:T.px,
          background:"none", border:"none", cursor:"pointer",
          fontSize:13, fontWeight:600, color:T.teal,
          fontFamily:"inherit", touchAction:"manipulation",
          display:"flex", alignItems:"center", gap:4,
        }}>‹ Zurück</button>
        <div style={{ fontSize:24, fontWeight:900, color:T.ink, letterSpacing:"-0.04em" }}>
          EINSTELLUNGEN.
        </div>
        <div style={{ fontSize:13, color:T.inkFaint, marginTop:2 }}>HUI-Account.</div>
      </div>

      {/* ── SCROLL-INHALT ─────────────────────────────────────── */}
      <div className="studio-scroll" style={{
        flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch",
        paddingBottom:"max(88px,calc(80px + env(safe-area-inset-bottom,0px)))",
      }}>
        <Gap h={20}/>

        {/* Intro-Card */}
        <div style={{ padding:`0 ${T.px}px` }}>
          <div style={{
            background:T.bgCard, borderRadius:T.r16,
            border:`1px solid ${T.border}`, padding:"18px 20px",
            boxShadow:T.card, marginBottom:20,
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.teal, letterSpacing:"0.06em", marginBottom:10 }}>
              EINSTELLUNGEN – Nur für dich
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink, lineHeight:1.25, marginBottom:6 }}>
              Deine Einstellungen<br/>und dein HUI-Account
            </div>
            <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.6 }}>
              Verwalte deinen Account, Sicherheit und Support.
            </div>
          </div>
        </div>

        {/* Community/Empfehlungen/Impact/Finanzen sind ins neue Profil-Drawer-Menü
            umgezogen (MeinBereichMenu.jsx auf MyBasisProfile.jsx) — Studio ist ab
            jetzt bewusst nur noch "Einstellungen" (PROFIL-DRAWER-REDESIGN-003, 2026-07-06). */}

        {/* ── Account & Einstellungen ────────────────────── */}
        <StudioSection label="Account & Einstellungen">
          <StudioRow icon={<HUIProfilIcon size={18}/>} label="Profil bearbeiten"  onPress={handleEditProfile} />
          <StudioRow icon={<HUIVerifIcon size={18}/>} label="Verifizierung"
            badge={isVerified ? "✓ Aktiv" : undefined} onPress={() => setShowVerifCS(true)} />
          <StudioRow icon={<HUISicherheitIcon size={18}/>} label="Sicherheit & Passwort" onPress={() => setShowSicherheit(true)} />
          <StudioRow icon={<HUIMitgliedIcon size={18}/>} label="Mitgliedschaft"
            badge={isTalent ? "HUI-Talent" : "HUI-Mitglied"}
            onPress={() => setShowMitgliedschaftCS(true)} />
          <StudioRow icon={<HUISupportIcon size={18}/>} label="Support" onPress={() => setShowSupport(true)} />
          <StudioRow icon={<HUITicketIcon size={18}/>} label="Meine Tickets" onPress={() => setShowMeineTickets(true)} />
          <StudioRow
            icon={<HUIAbmeldenIcon size={18}/>} label="Abmelden"
            labelColor="#DC2626"
            onPress={() => setShowLogoutConfirm(true)}
            last
          />
        </StudioSection>
        <Gap h={20}/>

        {/* ── Privacy Footer ────────────────────────────────── */}
        <div style={{ padding:`0 ${T.px}px` }}>
          <div style={{
            background:"rgba(14,196,184,0.07)", borderRadius:T.r16,
            border:`1px solid rgba(14,196,184,0.18)`, padding:"14px 18px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <HUISicherheitIcon size={22} style={{flexShrink:0}} />
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>Dein Studio ist privat.</div>
              <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>Nur du hast hier Zugriff.</div>
            </div>
          </div>
        </div>
        <Gap h={20}/>
      </div>

      {showProfilBearbeiten && (
        <ProfilBearbeitenModal
          profile={profile}
          onClose={() => setShowProfilBearbeiten(false)}
          onProfileUpdate={onProfileUpdate}
        />
      )}
      {showVerifCS && createPortal(
        <div
          onClick={() => setShowVerifCS(false)}
          style={{
            position:"fixed", inset:0, zIndex:10600,
            background:"rgba(26,26,24,0.55)",
            display:"flex", alignItems:"flex-end", justifyContent:"center",
            fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:"100%", maxWidth:480,
              background:"#F7F5F0", borderRadius:"24px 24px 0 0",
              padding:"0 0 48px",
              boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
              overflow:"hidden",
            }}
          >
            {/* Handle */}
            <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
              <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
            </div>

            {/* Baustellen-Grafik */}
            <div style={{
              margin:"24px 20px 0",
              background:"linear-gradient(135deg,#1A1A18 0%,#2D2D2B 100%)",
              borderRadius:20, padding:"36px 24px 32px",
              textAlign:"center", position:"relative", overflow:"hidden",
            }}>
              {/* Hintergrund-Streifen (Baustelle) */}
              <div style={{
                position:"absolute", inset:0,
                background:"repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(245,158,11,0.07) 18px,rgba(245,158,11,0.07) 36px)",
                borderRadius:20,
              }} />

              {/* Absperrband oben */}
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:8,
                background:"repeating-linear-gradient(90deg,#F59E0B 0px,#F59E0B 20px,#1A1A18 20px,#1A1A18 40px)",
                borderRadius:"20px 20px 0 0",
              }} />

              {/* Icon */}
              <div style={{
                width:72, height:72, borderRadius:"50%", margin:"0 auto 16px",
                background:"rgba(245,158,11,0.15)",
                border:"2px solid rgba(245,158,11,0.35)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:36, position:"relative",
              }}>🚧</div>

              {/* COMING SOON */}
              <div style={{
                fontSize:11, fontWeight:800, letterSpacing:"0.18em",
                color:"#F59E0B", marginBottom:10, position:"relative",
              }}>
                COMING SOON
              </div>

              <div style={{
                fontSize:22, fontWeight:800, color:"#FFFFFF",
                letterSpacing:"-0.02em", marginBottom:8, position:"relative",
              }}>
                Verifizierung
              </div>

              <div style={{
                fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.55,
                maxWidth:260, margin:"0 auto", position:"relative",
              }}>
                Wir arbeiten daran, deinen Account sicher zu verifizieren. Dieses Feature wird bald verfügbar sein.
              </div>

              {/* Absperrband unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0, height:8,
                background:"repeating-linear-gradient(90deg,#1A1A18 0px,#1A1A18 20px,#F59E0B 20px,#F59E0B 40px)",
              }} />
            </div>

            {/* Schließen-Button */}
            <div style={{ padding:"20px 20px 0" }}>
              <button
                onClick={() => setShowVerifCS(false)}
                style={{
                  width:"100%", padding:"13px",
                  borderRadius:14, border:"none", cursor:"pointer",
                  background:"rgba(26,26,24,0.08)",
                  color:"rgba(26,26,24,0.55)",
                  fontSize:14, fontWeight:700,
                  fontFamily:"inherit",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showMitgliedschaftCS && createPortal(
        <div
          onClick={() => setShowMitgliedschaftCS(false)}
          style={{
            position:"fixed", inset:0, zIndex:10600,
            background:"rgba(26,26,24,0.55)",
            display:"flex", alignItems:"flex-end", justifyContent:"center",
            fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:"100%", maxWidth:480,
              background:"#F7F5F0", borderRadius:"24px 24px 0 0",
              padding:"0 0 48px",
              boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
              overflow:"hidden",
            }}
          >
            <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
              <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
            </div>
            <div style={{
              margin:"24px 20px 0",
              background:"linear-gradient(135deg,#1A1A18 0%,#2D2D2B 100%)",
              borderRadius:20, padding:"36px 24px 32px",
              textAlign:"center", position:"relative", overflow:"hidden",
            }}>
              <div style={{
                position:"absolute", inset:0,
                background:"repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(245,158,11,0.07) 18px,rgba(245,158,11,0.07) 36px)",
                borderRadius:20,
              }} />
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:8,
                background:"repeating-linear-gradient(90deg,#F59E0B 0px,#F59E0B 20px,#1A1A18 20px,#1A1A18 40px)",
                borderRadius:"20px 20px 0 0",
              }} />
              <div style={{
                width:72, height:72, borderRadius:"50%", margin:"0 auto 16px",
                background:"rgba(245,158,11,0.15)",
                border:"2px solid rgba(245,158,11,0.35)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:36, position:"relative",
              }}>🚧</div>
              <div style={{
                fontSize:11, fontWeight:800, letterSpacing:"0.18em",
                color:"#F59E0B", marginBottom:10, position:"relative",
              }}>COMING SOON</div>
              <div style={{
                fontSize:22, fontWeight:800, color:"#FFFFFF",
                letterSpacing:"-0.02em", marginBottom:8, position:"relative",
              }}>Mitgliedschaft</div>
              <div style={{
                fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.55,
                maxWidth:260, margin:"0 auto", position:"relative",
              }}>
                Hier kannst du bald deine Mitgliedschaft verwalten und upgraden. Wir arbeiten mit Hochdruck daran.
              </div>
              <div style={{
                position:"absolute", bottom:0, left:0, right:0, height:8,
                background:"repeating-linear-gradient(90deg,#1A1A18 0px,#1A1A18 20px,#F59E0B 20px,#F59E0B 40px)",
              }} />
            </div>
            <div style={{ padding:"20px 20px 0" }}>
              <button
                onClick={() => setShowMitgliedschaftCS(false)}
                style={{
                  width:"100%", padding:"13px", borderRadius:14, border:"none",
                  cursor:"pointer", background:"rgba(26,26,24,0.08)",
                  color:"rgba(26,26,24,0.55)", fontSize:14, fontWeight:700,
                  fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
                }}
              >Schließen</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showMeineTickets && (
        <MeineTicketsPage
          onBack={() => setShowMeineTickets(false)}
          userId={profile?.id}
          profile={profile}
        />
      )}

      {showSupport && (
        <SupportPage
          onBack={() => setShowSupport(false)}
          userId={profile?.id}
          userEmail={profile?.email}
          userName={profile?.display_name || profile?.full_name}
        />
      )}

      {showSicherheit && (
        <SicherheitPasswortModal
          profile={profile}
          onClose={() => setShowSicherheit(false)}
        />
      )}
      {showLogoutConfirm && createPortal(
        <div
          onClick={() => !loggingOut && setShowLogoutConfirm(false)}
          style={{
            position:"fixed", inset:0, zIndex:10800,
            background:"rgba(26,26,24,0.60)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"0 24px",
            fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:"100%", maxWidth:340,
              background:"#FFFFFF", borderRadius:20,
              padding:"28px 24px 20px",
              boxShadow:"0 8px 40px rgba(26,26,24,0.22)",
              textAlign:"center",
            }}
          >
            {/* Icon */}
            <div style={{
              width:60, height:60, borderRadius:"50%", margin:"0 auto 16px",
              background:"rgba(220,38,38,0.08)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28,
            }}>🚪</div>

            <div style={{
              fontSize:17, fontWeight:800, color:"#1A1A18",
              letterSpacing:"-0.02em", marginBottom:8,
            }}>
              Abmelden?
            </div>
            <div style={{ fontSize:13, color:"rgba(26,26,24,0.52)", lineHeight:1.55, marginBottom:24 }}>
              Du wirst aus deinem HUI-Account abgemeldet. Deine Daten bleiben sicher gespeichert.
            </div>

            {/* Buttons */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width:"100%", padding:"13px", borderRadius:12, border:"none",
                cursor: loggingOut ? "wait" : "pointer",
                background: loggingOut ? "rgba(220,38,38,0.4)" : "#DC2626",
                color:"#fff", fontSize:14, fontWeight:800,
                fontFamily:"inherit", marginBottom:10,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                transition:"background .15s",
              }}
            >
              {loggingOut
                ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> Wird abgemeldet…</>
                : "🚪 Ja, abmelden"
              }
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              disabled={loggingOut}
              style={{
                width:"100%", padding:"13px", borderRadius:12,
                border:"1px solid rgba(26,26,24,0.10)", cursor:"pointer",
                background:"rgba(26,26,24,0.04)",
                color:"rgba(26,26,24,0.55)", fontSize:14, fontWeight:700,
                fontFamily:"inherit",
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={onProfileUpdate}
          onEditProfile={() => { setShowSettings(false); handleEditProfile(); }}
          onOpenBookings={() => {
            setShowSettings(false);
            if (typeof window !== "undefined")
              window.dispatchEvent(new CustomEvent("hui:open-bookings"));
          }}
        />
      )}
    </div>,
    document.body
  );
}

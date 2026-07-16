import React from "react";
import { HUIAmbassadorIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { SectionRow } from "../components/primitives.jsx";
export function AmbassadorProfilSection({ profile, ambState, onApply }) {
  const T2 = {
    teal:"#0EC4B8", tealSoft:"rgba(14,196,184,0.08)",
    tealMid:"rgba(14,196,184,0.2)", ink:"#1A1A18",
    inkSoft:"#555552", inkFaint:"#888885",
    bgCard:"#FFFFFF", border:"rgba(26,26,24,0.09)",
    r16:"12px", r12:"10px", r99:"99px", card:"0 1px 4px rgba(0,0,0,0.06)",
  };

  const isAmb      = profile?.is_ambassador === true;
  const status     = ambState?.applicationStatus;
  const hasPending = status === 'offen' || status === 'pending';
  const isRejected = status === 'abgelehnt' || status === 'rejected';
  const ref_link   = profile?.profile_modules?.ambassador?.referral_link || null;
  const ref_code   = profile?.profile_modules?.ambassador?.referral_code || null;
  const refCount   = profile?.profile_modules?.ambassador?.referral_count || 0;

  function copyLink() {
    if (ref_link) {
      navigator.clipboard.writeText(ref_link).catch(() => {});
    }
  }

  // Nicht-Ambassador: CTA anzeigen
  if (!isAmb) {
    return (
      <div style={{ padding:"0 20px" }}>
        <div style={{
          background:T2.bgCard, borderRadius:T2.r16,
          border:`1px solid ${T2.border}`, padding:"18px",
          boxShadow:T2.card,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <HUIAmbassadorIcon size={18} style={{color:"rgba(14,196,184,0.8)"}} />
            <span style={{fontSize:14, fontWeight:800, color:T2.ink}}>Ambassador werden</span>
          </div>
          <div style={{fontSize:13, color:T2.inkSoft, lineHeight:1.6, marginBottom:14}}>
            Als Ambassador empfiehlst du HUI weiter und verdienst mit jedem aktiven Mitglied, das du eingeladen hast.
          </div>
          {hasPending && (
            <div style={{
              background:"rgba(255,193,7,0.1)", borderRadius:T2.r12,
              border:"1px solid rgba(255,193,7,0.3)", padding:"10px 14px",
              fontSize:12, color:"#B8860B", fontWeight:600, marginBottom:10,
            }}>
              ⏳ Deine Bewerbung wird geprüft
            </div>
          )}
          {isRejected && (
            <div style={{
              background:"rgba(255,99,71,0.08)", borderRadius:T2.r12,
              border:"1px solid rgba(255,99,71,0.2)", padding:"10px 14px",
              fontSize:12, color:"#cc4433", fontWeight:600, marginBottom:10,
            }}>
              ❌ Bewerbung abgelehnt
            </div>
          )}
          {!hasPending && !isRejected && (
            <button onClick={onApply} style={{
              padding:"10px 20px", borderRadius:T2.r99,
              background:T2.teal, border:"none", color:"white",
              fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              touchAction:"manipulation",
            }}>
              Jetzt bewerben
            </button>
          )}
        </div>
      </div>
    );
  }

  // Aktiver Ambassador: Dashboard
  return (
    <div style={{ padding:"0 20px" }}>
      {/* Status-Badge */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <SectionRow title="Ambassador" />
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          background:"rgba(14,196,184,0.08)", borderRadius:T2.r99,
          border:`1px solid ${T2.tealMid}`, padding:"3px 10px",
          fontSize:11, fontWeight:700, color:T2.teal,
        }}>
          ✅ Aktiv
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:10, marginBottom:14,
      }}>
        {[
          { emoji:"👥", label:"Eingeladene", value: refCount },
          { emoji:"🥉", label:"Level", value: refCount >= 201 ? "Platin" : refCount >= 51 ? "Gold" : refCount >= 11 ? "Silber" : "Bronze" },
        ].map(({ emoji, label, value }) => (
          <div key={label} style={{
            background:T2.bgCard, borderRadius:T2.r12,
            border:`1px solid ${T2.border}`, padding:"12px",
            textAlign:"center", boxShadow:T2.card,
          }}>
            <div style={{fontSize:20, marginBottom:4}}>{emoji}</div>
            <div style={{fontSize:18, fontWeight:800, color:T2.teal}}>{value}</div>
            <div style={{fontSize:11, color:T2.inkFaint}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Einladungslink */}
      {ref_link && (
        <div style={{
          background:T2.tealSoft, borderRadius:T2.r12,
          border:`1px solid ${T2.tealMid}`, padding:"12px 14px",
          marginBottom:10,
        }}>
          <div style={{fontSize:11, fontWeight:700, color:T2.teal, marginBottom:4}}>
            🔗 Dein Einladungslink
          </div>
          <div style={{
            fontSize:12, color:T2.inkSoft, fontFamily:"monospace",
            wordBreak:"break-all", marginBottom:8,
          }}>
            {ref_link}
          </div>
          <button onClick={copyLink} style={{
            padding:"6px 14px", borderRadius:T2.r99,
            background:T2.teal, border:"none", color:"white",
            fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            touchAction:"manipulation",
          }}>
            Link kopieren
          </button>
        </div>
      )}


    </div>
  );
}

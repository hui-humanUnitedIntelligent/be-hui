// src/components/profile/FollowListModal.jsx
// ════════════════════════════════════════════════════════════════════
// FOLLOWER-MODAL (2026-09-09, Michaels 4-Punkte Liste Punkt 3):
// Modal mit zwei Tabs — "Follower" (wer mir folgt) + "Folgt" (wem ich
// folge). Klick auf eine Person oeffnet deren oeffentliches Profil
// (kanonisch ueber window.__HUI_OPEN_PROFILE__, siehe Regel 802).
//
// Architektur:
// - Datenquelle: follows-Tabelle (anon-lesbar per RLS, verifiziert
//   2026-09-09) + profiles-Join client-seitig in 2 Queries — KEINE neue
//   RPC noetig (Governance: keine neue Infrastruktur ohne zwingenden Grund).
// - Pflicht-Muster: createPortal(document.body) + zIndex >= 10500
//   (siehe footer-navbar-zindex-Regel) + useWizardBodyLock().
// - Avatare: Initialen-Fallback-Kreis (Regel bild-platzhalter: fuer
//   Nutzer-Avatare KEIN HUI-Logo) + MembershipLabel als SSOT fuer den
//   Account-Typ (gleiche Komponente wie Feed/Discover).
// ════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { MembershipLabel } from "../ui/TalentBadge.jsx";
import { HUIProfilIcon } from "../../design/icons/HuiSystemIcons.jsx";

const T = {
  teal:  "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:   "#1A3530",
  inkSoft: "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.32)",
  border: "rgba(26,53,48,0.08)",
};

// Account-Typ → MembershipLabel-Typ (analog PUNKT4-ACCOUNT-TYPES Mapping)
function membershipTypeOf(p) {
  if (p?.account_type === "organization") return p?.org_type || "unternehmen";
  if (p?.is_talent) return "talent";
  return "base";
}

function initialsOf(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function PersonRow({ person, onPress }) {
  const name = person.display_name || person.username || "HUI Mitglied";
  return (
    <button
      onClick={onPress}
      style={{
        display:"flex", alignItems:"center", gap:12, width:"100%",
        padding:"11px 18px", background:"none", border:"none",
        borderBottom:`1px solid ${T.border}`, cursor:"pointer",
        textAlign:"left", fontFamily:"inherit",
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}
    >
      {person.avatar_url ? (
        <div style={{
          width:44, height:44, borderRadius:"50%", flexShrink:0,
          background:`url(${person.avatar_url}) center/cover no-repeat`,
          border:"1.5px solid rgba(255,255,255,0.9)",
          boxShadow:"0 2px 8px rgba(26,53,48,0.10)",
        }}/>
      ) : (
        <div style={{
          width:44, height:44, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg,${T.teal}55,#FF8A6B44)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:15, fontWeight:600, color:"#fff",
          border:"1.5px solid rgba(255,255,255,0.9)",
          boxShadow:"0 2px 8px rgba(26,53,48,0.10)",
        }}>{initialsOf(name)}</div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:14, fontWeight:600, color:T.ink,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>{name}</div>
        <div style={{ marginTop:2 }}>
          <MembershipLabel membershipType={membershipTypeOf(person)} size="xs"/>
        </div>
      </div>
      <span style={{ color:T.inkFaint, fontSize:18, flexShrink:0, lineHeight:1 }}>›</span>
    </button>
  );
}

function RowSkeleton() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 18px", borderBottom:`1px solid ${T.border}` }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(26,53,48,0.06)", animation:"flm-pulse 1.4s ease-in-out infinite" }}/>
      <div style={{ flex:1 }}>
        <div style={{ height:13, borderRadius:7, width:"55%", background:"rgba(26,53,48,0.06)", marginBottom:7, animation:"flm-pulse 1.4s ease-in-out infinite" }}/>
        <div style={{ height:10, borderRadius:5, width:"30%", background:"rgba(26,53,48,0.04)", animation:"flm-pulse 1.4s ease-in-out infinite" }}/>
      </div>
    </div>
  );
}

export default function FollowListModal({ userId, initialTab = "followers", onClose }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(initialTab === "following" ? "following" : "followers");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  // Referenzgezählter Body-Lock (Standard-Muster für Bottom-Sheets)
  useWizardBodyLock();

  const load = useCallback(async (activeTab) => {
    if (!userId) { setPeople([]); setLoading(false); return; }
    setLoading(true);
    try {
      const followsRes = activeTab === "followers"
        ? await supabase.from("follows").select("follower_id").eq("followed_id", userId).limit(500)
        : await supabase.from("follows").select("followed_id").eq("follower_id", userId).limit(500);
      const rows = followsRes?.data || [];
      const ids = rows.map(r => activeTab === "followers" ? r.follower_id : r.followed_id).filter(Boolean);
      if (!ids.length) { setPeople([]); setLoading(false); return; }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,account_type,org_type,is_talent")
        .in("id", ids)
        .limit(500);
      setPeople(profiles || []);
    } catch {
      setPeople([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(tab); }, [tab, load]);

  const openProfile = (id) => {
    if (id && typeof window.__HUI_OPEN_PROFILE__ === "function") {
      window.__HUI_OPEN_PROFILE__(id);
    }
    onClose?.();
  };

  if (!userId) return null;

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
      background:"rgba(26,53,48,0.45)",
      animation:"flm-fade .18s ease both",
      WebkitTapHighlightColor:"transparent",
    }}
    onClick={onClose}>
      <style>{`
        @keyframes flm-fade { from{opacity:0;}to{opacity:1;} }
        @keyframes flm-in { from{transform:translateY(60px);opacity:0.4;}to{transform:translateY(0);opacity:1;} }
        @keyframes flm-pulse { 0%,100%{opacity:1;}50%{opacity:0.45;} }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#FFFFFF", borderTopLeftRadius:24, borderTopRightRadius:24,
          maxHeight:"78dvh", display:"flex", flexDirection:"column",
          animation:"flm-in .22s cubic-bezier(.22,1,.36,1) both",
          boxShadow:"0 -10px 40px rgba(26,53,48,0.18)",
          paddingTop:"max(10px, env(safe-area-inset-top, 10px) * 0)", // 10px-Regel
          paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px))",
        }}>
        {/* Grabber */}
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 2px", flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:99, background:"rgba(26,53,48,0.12)" }}/>
        </div>

        {/* Titel + Close */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 18px 10px", flexShrink:0 }}>
          <span style={{ fontSize:17, fontWeight:600, color:T.ink, letterSpacing:"-0.02em" }}>
            {t("followmodal.title")}
          </span>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:"50%", border:"none", cursor:"pointer",
            background:"rgba(26,53,48,0.05)", color:T.inkSoft, fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, margin:"0 18px 10px", background:"rgba(26,53,48,0.045)", borderRadius:99, padding:4, flexShrink:0 }}>
          {(["followers","following"]).map(key => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                flex:1, padding:"8px 0", borderRadius:99, cursor:"pointer",
                border:"none", fontFamily:"inherit",
                fontSize:12.5, fontWeight:600, letterSpacing:"-0.01em",
                background: active ? "#FFFFFF" : "transparent",
                color: active ? T.ink : T.inkSoft,
                boxShadow: active ? "0 1px 6px rgba(26,53,48,0.10)" : "none",
                transition:"background .15s ease, color .15s ease",
                WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
              }}>
                {key === "followers" ? t("followmodal.followers") : t("followmodal.following")}
              </button>
            );
          })}
        </div>

        {/* Liste */}
        <div style={{ overflowY:"auto", overscrollBehavior:"contain", minHeight:120 }}>
          {loading ? (
            <>{[0,1,2,3,4,5].map(i => <RowSkeleton key={i}/>)}</>
          ) : people.length === 0 ? (
            <div style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:10,
              padding:"36px 20px", color:T.inkFaint,
            }}>
              <HUIProfilIcon size={30} style={{opacity:0.4, color:"rgba(14,196,184,0.6)"}}/>
              <span style={{ fontSize:13, fontWeight:500 }}>
                {tab === "followers" ? t("followmodal.emptyFollowers") : t("followmodal.emptyFollowing")}
              </span>
            </div>
          ) : (
            people.map(p => (
              <PersonRow key={p.id} person={p} onPress={() => openProfile(p.id)}/>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

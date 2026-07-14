// src/lib/useNotifications.jsx — Resonanzzentrum v2
// ══════════════════════════════════════════════════════════════
// Hook + vollständiges Resonanzzentrum Panel
// Slide-Over von rechts, 4 Tabs, Verbindungsanfragen, Wochenstats
// ══════════════════════════════════════════════════════════════
import {
  HUIImpactIcon, HUIBenachrichtigungIcon, HUIStatistikIcon,
} from '../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabaseClient.js";
import { useAuth }  from "./AuthContext.jsx";

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  teal:     "#16D7C5",
  tealDeep: "#0AADA3",
  tealSoft: "rgba(22,215,197,0.10)",
  coral:    "#FF8A6B",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.55)",
  inkFaint: "rgba(26,26,24,0.35)",
  cream:    "#F9F7F4",
  card:     "#FFFFFF",
  border:   "rgba(26,26,24,0.08)",
  r12:      12,
  r16:      16,
  r20:      20,
};

// ── Kategorie-Regeln ──────────────────────────────────────────
// type → { tab, icon, color }
const TYPE_META = {
  // WICHTIG
  order:          { tab:"wichtig", icon:"🎨", color:"#FF8A6B", label:"Bestellung" },
  booking:        { tab:"wichtig", icon:"📅", color:"#22C55E", label:"Buchung" },
  connection_req: { tab:"wichtig", icon:"🤝", color:T.teal,   label:"Verbindungsanfrage" },
  message:        { tab:"wichtig", icon:"💬", color:T.teal,   label:"Nachricht" },
  booking_change: { tab:"wichtig", icon:"⚠️", color:"#F59E0B", label:"Buchungsänderung" },
  experience_soon:{ tab:"wichtig", icon:"📅", color:"#22C55E", label:"Erlebnis morgen" },
  // RELEVANT
  like:           { tab:"relevant", icon:"❤️", color:"#EF4444", label:"Favorisiert" },
  save:           { tab:"relevant", icon:"⭐", color:"#F59E0B", label:"Gespeichert" },
  profile_visit:  { tab:"relevant", icon:"👀", color:"#8B5CF6", label:"Profilbesuch" },
  participant:    { tab:"relevant", icon:"🙌", color:T.teal,   label:"Neue Teilnehmer" },
  watcher:        { tab:"relevant", icon:"🌱", color:"#22C55E", label:"Neue Beobachter" },
  interest:       { tab:"relevant", icon:"🎯", color:T.coral,  label:"Interesse" },
  follow:         { tab:"relevant", icon:"👤", color:T.teal,   label:"Neuer Follower" },
  // INFORMATIV
  milestone:      { tab:"info", icon:"📈", color:T.teal,   label:"Meilenstein" },
  impact:         { tab:"info", icon:"🌿", color:"#22C55E", label:"Neue Wirkung" },
  share:          { tab:"info", icon:"🎨", color:"#8B5CF6", label:"Werk geteilt" },
  connection_new: { tab:"info", icon:"🤝", color:T.teal,   label:"Neue Verbindung" },
  achievement:    { tab:"info", icon:"🏆", color:"#F59E0B", label:"Meilenstein" },
  admin_broadcast:{ tab:"info", icon:"📣", color:"#8B5CF6", label:"HUI Team" },
  referral_joined:{ tab:"info", icon:"🎉", color:"#22C55E", label:"Empfehlung" },
  // FREIGABEN — Werke
  work_approved:       { tab:"info", icon:"✅", color:"#22C55E", label:"Werk freigegeben" },
  work_rejected:            { tab:"info", icon:"❌", color:"#EF4444", label:"Werk abgelehnt" },
  impact_project_rejected:  { tab:"info", icon:"📋", color:"#EF4444", label:"Herzensprojekt abgelehnt" },
  content_approved:    { tab:"info", icon:"✅", color:"#22C55E", label:"Inhalt freigegeben" },
  content_rejected:    { tab:"info", icon:"❌", color:"#EF4444", label:"Inhalt abgelehnt" },
  // FREIGABEN — Erlebnisse
  experience_approved: { tab:"info", icon:"✅", color:"#22C55E", label:"Erlebnis freigegeben" },
  experience_rejected: { tab:"info", icon:"❌", color:"#EF4444", label:"Erlebnis abgelehnt" },
  // FREIGABEN — Projekte
  project_approved:    { tab:"info", icon:"✅", color:"#22C55E", label:"Projekt freigegeben" },
  project_rejected:    { tab:"info", icon:"❌", color:"#EF4444", label:"Projekt abgelehnt" },
  // Default
  default:        { tab:"info", icon:"✦",  color:T.teal,   label:"Aktivität" },
};

function getMeta(type) {
  return TYPE_META[type] || TYPE_META.default;
}

// ── Zeit-Formatter ────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "Gerade eben";
  if (diff < 3600)  return `vor ${Math.floor(diff/60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std`;
  if (diff < 172800)return "gestern";
  return `vor ${Math.floor(diff/86400)} Tagen`;
}

// ══════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════
export function useNotifications() {
  // WICHTIG: useAuth() darf nicht in try/catch aufgerufen werden (React Rules of Hooks)
  const authCtx = useAuth();
  const user = authCtx?.user ?? null;

  const [items,   setItems]   = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const subRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title,body,read,created_at,data,metadata,action_url,actor_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(80);
      if (data && Array.isArray(data)) {
        // Nutzer-Antworten auf Tickets NICHT im Resonanzzentrum anzeigen
        const filtered = data.filter(n => {
          const d = n.data ?? {};
          return !(d.is_followup === true);
        });
        setItems(filtered);
        const wichtigTypes = Object.entries(TYPE_META)
          .filter(([,v]) => v.tab === "wichtig").map(([k]) => k);
        setUnread(data.filter(n => !n.read && wichtigTypes.includes(n.type)).length ||
                  data.filter(n => !n.read).length);
      }
    } catch(e) {
      console.error("[RESONANZZENTRUM] notifications load error:", e.message);
    }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setItems([]); setUnread(0); return; }
    load();
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = `notif:${user.id}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let ch = existing;
    let createdHere = false;
    if (!existing) {
      ch = supabase.channel(topic)
        .on("postgres_changes", {
          event: "INSERT", schema: "public",
          table: "notifications", filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setItems(prev => [payload.new, ...prev]);
          setUnread(prev => prev + 1);
        }).subscribe();
      createdHere = true;
    }
    subRef.current = ch;
    return () => { if (createdHere) supabase.removeChannel(ch); };
  }, [user?.id, load]);

  const markRead = useCallback(async (id) => {
    if (!user?.id) return;
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
    } catch { /* silent */ }
  }, [user?.id]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    try {
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    } catch { /* silent */ }
  }, [user?.id]);

  return { items, unread, loading, markRead, markAllRead, reload: load };
}

// ══════════════════════════════════════════════════════════════
// VERBINDUNGSANFRAGEN HOOK
// ══════════════════════════════════════════════════════════════
function useConnectionRequests(userId) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profile_relations")
        .select("id,requester_id,intention,message,created_at,status")
        .eq("target_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (data && Array.isArray(data)) setRequests(data);
    } catch(e) {
      console.error("[RESONANZZENTRUM] connection_requests load error:", e.message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function respond(id, action) {
    const status = action === "accept" ? "accepted" : action === "decline" ? "declined" : "pending";
    await supabase.from("profile_relations").update({ status }).eq("id", id);
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  return { requests, loading, respond, reload: load };
}

// ══════════════════════════════════════════════════════════════
// WOCHENSTATS HOOK
// ══════════════════════════════════════════════════════════════
function useWeekStats(userId) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    Promise.all([
      supabase.from("profile_watchlist")
        .select("id", { count:"exact", head:true })
        .eq("profile_id", userId)
        .gte("created_at", weekAgo),
      supabase.from("notifications")
        .select("id", { count:"exact", head:true })
        .eq("user_id", userId)
        .eq("type", "like")
        .gte("created_at", weekAgo),
      supabase.from("notifications")
        .select("id", { count:"exact", head:true })
        .eq("user_id", userId)
        .eq("type", "save")
        .gte("created_at", weekAgo),
      supabase.from("notifications")
        .select("id", { count:"exact", head:true })
        .eq("user_id", userId)
        .eq("type", "booking")
        .gte("created_at", weekAgo),
    ]).then(([w, l, s, b]) => {
      setStats({
        connections: w.count ?? 0,
        reached:     (l.count ?? 0) * 4 + (s.count ?? 0) * 2,
        saved:       s.count ?? 0,
        booked:      b.count ?? 0,
      });
    });
  }, [userId]);

  return stats;
}

// ══════════════════════════════════════════════════════════════
// SUBKOMPONENTEN
// ══════════════════════════════════════════════════════════════

// ── Rejection Modal ───────────────────────────────────────────
function RejectionDetailModal({ n, onClose }) {
  const rawMeta = n.metadata || n.data || {};
  const meta = typeof rawMeta === "string" ? (() => { try { return JSON.parse(rawMeta); } catch { return {}; } })() : rawMeta;
  // Dynamisch je nach Typ: Werk / Erlebnis / Projekt
  const typeMap = {
    work_rejected:            { label:"Werk",             emoji:"🎨", hint:"Du kannst dein Werk überarbeiten und erneut einreichen." },
    content_rejected:         { label:"Inhalt",           emoji:"📝", hint:"Du kannst den Inhalt überarbeiten und erneut einreichen." },
    experience_rejected:      { label:"Erlebnis",         emoji:"🌿", hint:"Du kannst dein Erlebnis überarbeiten und erneut einreichen." },
    project_rejected:         { label:"Projekt",          emoji:"📌", hint:"Du kannst dein Projekt überarbeiten und erneut einreichen." },
    impact_project_rejected:  { label:"Herzensprojekt",   emoji:"💚", hint:"Du kannst dein Projekt überarbeiten und erneut einreichen." },
  };
  const tm      = typeMap[n.type] || { label:"Eintrag", emoji:"📋", hint:"Du kannst den Eintrag überarbeiten und erneut einreichen." };
  // Admin sendet: entry_title (Erlebnis/Projekt), werk_title (Werk), content_title (alt)
  const entryTitle = meta.entry_title || meta.project_name || meta.content_title || meta.werk_title || meta.title || n.title || `Dein ${tm.label}`;
  // Admin sendet: reason (Erlebnis/Projekt), rejection_reason (Werk/alt)
  const reason     = meta.rejection_reason || meta.reason || meta.admin_comment || meta.review_note || n.body || "(Kein Grund angegeben)";
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:99999,
        background:"rgba(10,26,26,0.72)", backdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:20, padding:28,
          maxWidth:360, width:"100%",
          boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{fontSize:28, textAlign:"center", marginBottom:8}}>{tm.emoji}</div>
        <div style={{
          fontSize:16, fontWeight:700, color:"#1a1a18",
          textAlign:"center", marginBottom:4,
        }}>{entryTitle}</div>
        <div style={{
          fontSize:11, fontWeight:700, letterSpacing:1,
          color:"rgba(26,26,24,0.35)", textAlign:"center",
          marginBottom:16, textTransform:"uppercase",
        }}>NACHRICHT VOM ADMIN — {tm.label} ABGELEHNT</div>
        <div style={{
          background:"rgba(239,68,68,0.06)",
          border:"1.5px solid rgba(239,68,68,0.18)",
          borderRadius:12, padding:"14px 16px",
          fontSize:13.5, color:"#1a1a18", lineHeight:1.6,
          marginBottom:16,
        }}>{reason}</div>
        <div style={{
          fontSize:12, color:"rgba(26,26,24,0.45)",
          textAlign:"center", marginBottom:20, lineHeight:1.5,
        }}>
          {tm.hint}
        </div>
        <button
          onClick={onClose}
          style={{
            width:"100%", padding:"12px 0", borderRadius:99,
            background:"#0DC4B5", border:"none", color:"#fff",
            fontWeight:700, fontSize:14, cursor:"pointer",
            fontFamily:"inherit",
          }}
        >Verstanden</button>
      </div>
    </div>
  );
}

// ── Notification Item ─────────────────────────────────────────
function NotifItem({ n, onRead }) {
  const meta = getMeta(n.type);
  const [hov, setHov] = useState(false);
  const [showRejection, setShowRejection] = useState(false);

  const isRejection = n.type === "work_rejected" || n.type === "content_rejected"
    || n.type === "experience_rejected" || n.type === "project_rejected"
    || n.type === "impact_project_rejected";

  const handleClick = () => {
    if (!n.read) onRead(n.id);
    if (isRejection) setShowRejection(true);
  };

  const handleGrundBtn = (e) => {
    e.stopPropagation();
    if (!n.read) onRead(n.id);
    setShowRejection(true);
  };

  return (
    <>
      {showRejection && <RejectionDetailModal n={n} onClose={() => setShowRejection(false)} />}
      <button
        onClick={handleClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:"flex", alignItems:"flex-start", gap:12,
          padding:"13px 16px",
          background: hov
            ? "rgba(26,26,24,0.025)"
            : n.read ? "transparent" : "rgba(22,215,197,0.05)",
          border:"none",
          borderBottom:`1px solid ${T.border}`,
          cursor:"pointer", width:"100%", textAlign:"left",
          transition:"background 0.15s",
          touchAction:"manipulation",
        }}
      >
        {/* Icon */}
        <div style={{
          width:42, height:42, borderRadius:14, flexShrink:0,
          background:`linear-gradient(135deg,${meta.color}22,${meta.color}11)`,
          border:`1.5px solid ${meta.color}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:19,
        }}>
          {n.icon || meta.icon}
        </div>

        {/* Text */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontSize:13.5, fontWeight: n.read ? 500 : 700,
            color: n.read ? T.inkSoft : T.ink,
            lineHeight:1.4, marginBottom:2,
          }}>
            {n.title || meta.label}
          </div>
          {n.body && (
            <div style={{
              fontSize:12.5, color:T.inkFaint, lineHeight:1.5,
              overflow:"hidden", display:"-webkit-box",
              WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            }}>
              {n.body}
            </div>
          )}

          {/* "Grund lesen" Button für Ablehnungen */}
          {isRejection && (
            <button
              onClick={handleGrundBtn}
              style={{
                marginTop:7, padding:"4px 11px",
                borderRadius:99,
                border:"1.5px solid rgba(239,68,68,0.35)",
                background:"rgba(239,68,68,0.07)",
                color:"#DC2626",
                fontSize:11, fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
                display:"inline-flex", alignItems:"center", gap:4,
              }}
            >
              📋 Grund lesen
            </button>
          )}

          <div style={{ fontSize:11, color:"rgba(26,26,24,0.28)", marginTop:4 }}>
            {fmtTime(n.created_at)}
          </div>
        </div>

        {/* Chevron + Unread dot */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0}}>
          {!n.read && (
            <div style={{
              width:7, height:7, borderRadius:"50%",
              background:T.teal, marginTop:4,
            }}/>
          )}
          <span style={{fontSize:14, color:"rgba(26,26,24,0.20)", marginTop: n.read ? 8 : 0}}>›</span>
        </div>
      </button>
    </>
  );
}

// ── Verbindungsanfrage Item ───────────────────────────────────
function ConnectionRequestItem({ req, onRespond }) {
  const [state, setState] = useState("idle"); // idle | accepted | declined | later
  const name = req.requester_name || "Jemand";
  const INTENTIONS_MAP = {
    work:       "Ich interessiere mich für deine Arbeit",
    experience: "Ich möchte an deinen Erlebnissen teilnehmen",
    exchange:   "Ich suche Austausch",
    create:     "Ich möchte gemeinsam etwas bewirken",
    other:      "Persönliche Nachricht",
  };

  if (state === "accepted") return (
    <div style={{padding:"14px 16px", borderBottom:`1px solid ${T.border}`}}>
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"12px 16px", borderRadius:12,
        background:"rgba(22,215,197,0.08)",
        border:`1px solid rgba(22,215,197,0.20)`,
      }}>
        <HUIImpactIcon size={20} style={{opacity:0.5, color:"rgba(14,196,184,0.6)"}} />
        <span style={{fontSize:13.5, fontWeight:600, color:T.teal}}>
          Ihr seid jetzt verbunden.
        </span>
      </div>
    </div>
  );

  if (state === "declined") return null;

  return (
    <div style={{
      padding:"14px 16px",
      borderBottom:`1px solid ${T.border}`,
      background:"rgba(22,215,197,0.03)",
    }}>
      {/* Header */}
      <div style={{display:"flex", gap:12, marginBottom:12}}>
        <div style={{
          width:42, height:42, borderRadius:14, flexShrink:0,
          background:`linear-gradient(135deg,rgba(22,215,197,0.20),rgba(22,215,197,0.10))`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:19,
        }}>
          🤝
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13.5, fontWeight:700, color:T.ink, lineHeight:1.4}}>
            {name} möchte sich verbinden
          </div>
          {req.intention && (
            <div style={{fontSize:12, color:T.inkFaint, marginTop:2}}>
              {INTENTIONS_MAP[req.intention] || req.intention}
            </div>
          )}
          {req.message && (
            <div style={{
              fontSize:12.5, color:T.inkSoft, marginTop:6,
              fontStyle:"italic", lineHeight:1.5,
              padding:"8px 10px",
              background:"rgba(26,26,24,0.04)",
              borderRadius:8, borderLeft:`2px solid ${T.teal}`,
            }}>
              „{req.message}"
            </div>
          )}
          <div style={{fontSize:11, color:"rgba(26,26,24,0.28)", marginTop:6}}>
            {fmtTime(req.created_at)}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{display:"flex", gap:8}}>
        <button
          onClick={async () => { await onRespond(req.id, "accept"); setState("accepted"); }}
          style={{
            flex:1, padding:"10px 0",
            background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
            color:"#fff", border:"none", borderRadius:10,
            fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
          Annehmen
        </button>
        <button
          onClick={() => { onRespond(req.id, "later"); setState("later"); }}
          style={{
            flex:1, padding:"10px 0",
            background:"rgba(26,26,24,0.06)", color:T.inkSoft,
            border:"none", borderRadius:10,
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
          Später
        </button>
        <button
          onClick={() => { onRespond(req.id, "decline"); setState("declined"); }}
          style={{
            flex:1, padding:"10px 0",
            background:"rgba(239,68,68,0.08)", color:"#EF4444",
            border:"none", borderRadius:10,
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
          Ablehnen
        </button>
      </div>
    </div>
  );
}

// ── Kategorie-Header ──────────────────────────────────────────
function SectionHeader({ emoji, label }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"14px 16px 6px",
      fontSize:11, fontWeight:800,
      color:"rgba(26,26,24,0.40)",
      letterSpacing:"0.07em",
      textTransform:"uppercase",
    }}>
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Wochenstats ───────────────────────────────────────────────
function WeekStats({ userId }) {
  const stats = useWeekStats(userId);

  const items = [
    { emoji:"🌱", value: stats?.connections ?? "–", label:"Neue\nVerbindungen", color:"#22C55E" },
    { emoji:"❤️", value: stats?.reached     ?? "–", label:"Menschen\nerreicht",  color:"#EF4444" },
    { emoji:"⭐", value: stats?.saved       ?? "–", label:"Werke\ngespeichert", color:"#F59E0B" },
    { emoji:"📅", value: stats?.booked      ?? "–", label:"Erlebnisse\ngebucht", color:"#8B5CF6" },
  ];

  return (
    <div style={{padding:"4px 16px 24px"}}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"14px 0 12px",
        borderTop:`1px solid ${T.border}`,
      }}>
        <div style={{
          width:22, height:22, borderRadius:6,
          background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, color:"#fff",
        }} style={{display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(14,196,184,0.5)"}}><HUIStatistikIcon size={24}/></div>
        <span style={{
          fontSize:11, fontWeight:800,
          color:"rgba(26,26,24,0.40)",
          letterSpacing:"0.07em", textTransform:"uppercase",
        }}>
          Diese Woche
        </span>
      </div>

      {/* Stat Karten */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8}}>
        {items.map((it, i) => (
          <div key={i} style={{
            background:T.card,
            borderRadius:14, padding:"12px 8px",
            border:`1px solid ${T.border}`,
            textAlign:"center",
            boxShadow:"0 1px 4px rgba(26,26,24,0.05)",
          }}>
            <div style={{fontSize:20, marginBottom:4}}>{it.emoji}</div>
            <div style={{
              fontSize:22, fontWeight:900,
              color: stats ? it.color : "rgba(26,26,24,0.20)",
              letterSpacing:"-0.04em", lineHeight:1,
            }}>
              {it.value}
            </div>
            <div style={{
              fontSize:10, color:T.inkFaint,
              whiteSpace:"pre-line", lineHeight:1.3, marginTop:4,
            }}>
              {it.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leerer Zustand ────────────────────────────────────────────
function EmptyTab({ tab }) {
  const msgs = {
    alle:      { icon:"✦",  text:"Alles ruhig – Dein Wirken entfaltet sich." },
    wichtig:   { icon:"🌿", text:"Nichts Dringendes. Genieße die Ruhe." },
    relevant:  { icon:"❤️", text:"Wenn Menschen auf dein Wirken reagieren, erscheint es hier." },
    info:      { icon:"📈", text:"Meilensteine und Entwicklungen erscheinen hier." },
  };
  const m = msgs[tab] || msgs.alle;
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"48px 24px", gap:14, textAlign:"center",
    }}>
      <div style={{
        width:64, height:64, borderRadius:20,
        background:`linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:28,
      }}>
        {m.icon}
      </div>
      <div style={{fontSize:13.5, color:T.inkSoft, lineHeight:1.6, maxWidth:240}}>
        {m.text}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
const PANEL_CSS = `
@keyframes rz-slide-in {
  from { transform: translateX(100%); opacity: 0.6; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes rz-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.rz-panel {
  animation: rz-slide-in 0.32s cubic-bezier(0.22,1,0.36,1) both;
}
.rz-backdrop {
  animation: rz-fade-in 0.22s ease both;
}
.rz-tab { transition: all 0.18s ease; }
.rz-tab:active { transform: scale(0.95); }
`;

let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const el = document.createElement("style");
  el.textContent = PANEL_CSS;
  document.head.appendChild(el);
}

// ══════════════════════════════════════════════════════════════
// RESONANZZENTRUM PANEL
// ══════════════════════════════════════════════════════════════
export function ResonanzzentrumPanel({ onClose }) {
  // DOM-Mutation NIEMALS im Render-Body — immer in useEffect
  useEffect(() => { injectCSS(); }, []);

  // Hooks MÜSSEN bedingungslos aufgerufen werden (React Hooks Rules)
  const authCtx  = useAuth();
  const user     = authCtx?.user ?? null;
  const notif    = useNotifications();
  const connReqs = useConnectionRequests(user?.id);

  const [tab, setTab] = useState("alle");

  // Null-Guards für alle Arrays — verhindert .map()/.filter() auf undefined
  const safeItems    = Array.isArray(notif?.items)        ? notif.items        : [];
  const safeRequests = Array.isArray(connReqs?.requests)  ? connReqs.requests  : [];



  // Tab-Counts — safeItems/safeRequests statt direkte Zugriffe
  const counts = useMemo(() => {
    const alle = safeItems.length + safeRequests.length;
    const wichtig = safeItems.filter(n => getMeta(n?.type).tab === "wichtig" && !n?.read).length
                  + safeRequests.length;
    const relevant = safeItems.filter(n => getMeta(n?.type).tab === "relevant" && !n?.read).length;
    const info     = safeItems.filter(n => getMeta(n?.type).tab === "info"     && !n?.read).length;
    return { alle, wichtig, relevant, info };
  }, [safeItems, safeRequests]);

  // Items gefiltert
  const filteredItems = useMemo(() => {
    if (tab === "alle") return safeItems;
    const tabKey = tab === "wichtig" ? "wichtig" : tab === "relevant" ? "relevant" : "info";
    return safeItems.filter(n => getMeta(n?.type).tab === tabKey);
  }, [safeItems, tab]);

  // Gruppen für "alle" Tab
  const grouped = useMemo(() => {
    if (tab !== "alle") return null;
    const w = safeItems.filter(n => getMeta(n?.type).tab === "wichtig");
    const r = safeItems.filter(n => getMeta(n?.type).tab === "relevant");
    const i = safeItems.filter(n => getMeta(n?.type).tab === "info");
    return { wichtig: w, relevant: r, info: i };
  }, [safeItems, tab]);

  const TABS = [
    { key:"alle",     label:"Alle",        count: safeItems.length + safeRequests.length },
    { key:"wichtig",  label:"Wichtig",     count: counts?.wichtig  ?? 0 },
    { key:"relevant", label:"Relevant",    count: counts?.relevant ?? 0 },
    { key:"info",     label:"Informativ",  count: counts?.info     ?? 0 },
  ];

  const isEmpty = (filteredItems?.length ?? 0) === 0 && (tab !== "alle" || safeRequests.length === 0);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="rz-backdrop"
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:19500,
          background:"rgba(26,26,24,0.40)",
          backdropFilter:"blur(4px)",
          WebkitBackdropFilter:"blur(4px)",
        }}
      />

      {/* Panel */}
      <div
        className="rz-panel"
        style={{
          position:"fixed",
          top:0, right:0, bottom:0,
          zIndex:19600,
          width: Math.min(420, typeof window !== 'undefined' ? window.innerWidth : 420),
          background:T.cream,
          display:"flex", flexDirection:"column",
          fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
          boxShadow:"-4px 0 40px rgba(26,26,24,0.16)",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding:"env(safe-area-inset-top,16px) 16px 0",
          paddingTop:`calc(env(safe-area-inset-top, 0px) + 16px)`,
          background:T.cream,
          flexShrink:0,
        }}>
          {/* Titel-Zeile */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:4,
          }}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <HUIBenachrichtigungIcon size={24} style={{color:"rgba(14,196,184,0.5)"}} />
              <div>
                <div style={{
                  fontSize:20, fontWeight:900, color:T.ink,
                  letterSpacing:"-0.03em", lineHeight:1.1,
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  Resonanzzentrum
                  {(notif?.unread ?? 0) > 0 && (
                    <span style={{
                      background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
                      color:"#fff", fontSize:12, fontWeight:800,
                      padding:"2px 8px", borderRadius:20,
                      minWidth:20, textAlign:"center",
                    }}>
                      {notif.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Schließen */}
            <button
              onClick={onClose}
              style={{
                width:34, height:34, borderRadius:"50%",
                background:"rgba(26,26,24,0.07)",
                border:"none", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, color:T.inkSoft,
                touchAction:"manipulation",
              }}
            >
              ✕
            </button>
          </div>

          {/* Untertitel */}
          <div style={{
            fontSize:12.5, color:T.inkFaint,
            lineHeight:1.5, marginBottom:14, paddingLeft:2,
          }}>
            Alles Wichtige rund um dein Wirken, deine Verbindungen und deine Gemeinschaft.
          </div>

          {/* ── TABS ── */}
          <div style={{
            display:"flex", gap:6,
            overflowX:"auto", paddingBottom:12,
            scrollbarWidth:"none",
          }}>
            {TABS.map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  className="rz-tab"
                  onClick={() => setTab(t.key)}
                  style={{
                    display:"flex", alignItems:"center", gap:5,
                    padding:"7px 12px",
                    borderRadius:20,
                    border:"none",
                    background: active
                      ? `linear-gradient(135deg,${T.teal},${T.tealDeep})`
                      : "rgba(26,26,24,0.07)",
                    color: active ? "#fff" : T.inkSoft,
                    fontSize:13, fontWeight: active ? 800 : 600,
                    cursor:"pointer", flexShrink:0,
                    fontFamily:"inherit",
                    touchAction:"manipulation",
                    boxShadow: active ? `0 2px 12px rgba(22,215,197,0.30)` : "none",
                  }}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span style={{
                      background: active ? "rgba(255,255,255,0.25)" : T.teal,
                      color: "#fff",
                      fontSize:10.5, fontWeight:800,
                      padding:"1px 6px", borderRadius:12,
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Alle gelesen */}
            {(notif?.unread ?? 0) > 0 && (
              <button
                onClick={notif?.markAllRead ?? (() => {})}
                style={{
                  marginLeft:"auto", flexShrink:0,
                  padding:"7px 12px", borderRadius:20,
                  background:"transparent", border:"none",
                  color:T.teal, fontSize:12.5, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit",
                  touchAction:"manipulation",
                }}
              >
                ✓ Alle gelesen
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{height:1, background:T.border, marginBottom:0}}/>
        </div>

        {/* ── CONTENT ── */}
        <div
          style={{
            flex:1, overflowY:"auto",
            WebkitOverflowScrolling:"touch",
          }}
        >
          {/* Verbindungsanfragen — immer oben (wenn Alle oder Wichtig aktiv) */}
          {(tab === "alle" || tab === "wichtig") && safeRequests.length > 0 && (
            <>
              {tab === "alle" && <SectionHeader emoji="⭐" label="Wichtig" />}
              {safeRequests.map(req => (
                <ConnectionRequestItem
                  key={req.id}
                  req={req}
                  onRespond={connReqs.respond}
                />
              ))}
            </>
          )}

          {/* Alle-Tab: gruppiert */}
          {tab === "alle" && grouped && (
            <>
              {grouped.wichtig.length > 0 && (
                <>
                  {safeRequests.length === 0 && <SectionHeader emoji="⭐" label="Wichtig" />}
                  {grouped.wichtig.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} />)}
                </>
              )}
              {grouped.relevant.length > 0 && (
                <>
                  <SectionHeader emoji="⭐" label="Relevant" />
                  {grouped.relevant.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} />)}
                </>
              )}
              {grouped.info.length > 0 && (
                <>
                  <SectionHeader emoji="⭐" label="Informativ" />
                  {grouped.info.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} />)}
                </>
              )}
              {safeItems.length === 0 && safeRequests.length === 0 && (
                <EmptyTab tab="alle" />
              )}
            </>
          )}

          {/* Einzelne Tabs */}
          {tab !== "alle" && (
            isEmpty
              ? <EmptyTab tab={tab} />
              : filteredItems.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} />)
          )}

          {/* Lade-Spinner */}
          {notif?.loading && safeItems.length === 0 && safeRequests.length === 0 && (
            <div style={{display:"flex",justifyContent:"center",padding:40}}>
              <div style={{
                width:24, height:24, borderRadius:"50%",
                border:"2.5px solid rgba(22,215,197,0.2)",
                borderTop:`2.5px solid ${T.teal}`,
                animation:"rz-spin 0.8s linear infinite",
              }}/>
              <style>{`@keyframes rz-spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* ── WOCHE-STATS ── */}
          <WeekStats userId={user?.id} />
        </div>
      </div>
    </>
  , document.body);
}

// ══════════════════════════════════════════════════════════════
// BADGE — für Header Button
// ══════════════════════════════════════════════════════════════
export function NotificationBadge({ count }) {
  if (!count || count < 1) return null;
  return (
    <div style={{
      position:"absolute", top:-4, right:-4,
      minWidth:17, height:17,
      background:"linear-gradient(135deg,#FF8A6B,#FF6B4A)",
      borderRadius:10,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:10, fontWeight:800, color:"#fff",
      border:"2px solid #fff", padding:"0 4px",
      lineHeight:1, pointerEvents:"none",
    }}>
      {count > 99 ? "99+" : count}
    </div>
  );
}

// Legacy-Export für alte NotificationInbox-Aufrufe (Backwards Compat)
export function NotificationInbox({ onClose }) {
  return <ResonanzzentrumPanel onClose={onClose} />;
}

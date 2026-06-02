// chat-center/ChatCenterOverlay.jsx v3
// HUI Resonanz Center — Screenshot-exact nach iPad Design
// Links: Liste — Rechts: Chat Room (iPad split view)
// Mobile: fullscreen, Room slides over
//
// zIndex: 9400 — single chat entry point

import React, { useState } from "react";
import ChatAtmosphere  from "./ChatAtmosphere.jsx";
import ConversationList from "./ConversationList.jsx";
import ConversationRoom from "./ConversationRoom.jsx";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useChatList, findOrCreateChat }  from "../../lib/chatContext.js";
import PeopleSearch from "../discovery/PeopleSearch.jsx";
import { HUI } from "../../design/hui.design.js";
import { logDebug } from "../../lib/debugCollector.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.50)" };

const CSS = `
  @keyframes hui-spin { to { transform: rotate(360deg); } }
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  .hui-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .hui-scroll::-webkit-scrollbar { display:none; }
  @keyframes cc-in {
    from{opacity:0;transform:translateY(22px);}
    to{opacity:1;transform:translateY(0);}
  }
  @keyframes cc-room-in {
    from{opacity:0;transform:translateX(24px);}
    to{opacity:1;transform:translateX(0);}
  }
`;

/* ── Compose Button ── */
function ComposeBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width:40, height:40, borderRadius:"50%",
      background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
      border:"none", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:`0 4px 14px rgba(22,215,197,0.32)`,
      WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

/* ── LIST PANEL ── */
function ListPanel({ onClose, onOpen, chats, loading, activeId, onDiscoverClose, onCompose }) {
  const [search, setSearch] = useState("");

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100%", position:"relative",
      flex:"none", width:"100%",
      // iPad: Breite 360px
    }}>
      <ChatAtmosphere dark={false}/>

      {/* Header */}
      <div style={{
        position:"relative", zIndex:2, flexShrink:0,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
        background:"rgba(242,244,248,0.92)",
        backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
        borderBottom:"1px solid rgba(22,215,197,0.08)",
      }}>
        {/* Top Row */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={onClose} style={{
            width:38, height:38, borderRadius:"50%",
            background:"rgba(22,215,197,0.09)", border:"1.5px solid rgba(22,215,197,0.18)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:C.teal, fontSize:18,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            transition:"transform 0.14s",
          }}
          onTouchStart={e=>e.currentTarget.style.transform="scale(0.90)"}
          onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
          >←</button>

          <div style={{ flex:1 }}>
            <div style={{ fontSize:22, fontWeight:900, color:C.ink, letterSpacing:-0.5 }}>
              Nachrichten
              <span style={{
                fontSize:13, color:C.teal, fontWeight:700,
                marginLeft:7, verticalAlign:"middle",
              }}>·</span>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
              Echte Gespr\u00e4che. Echte Verbindung.
            </div>
          </div>

          <ComposeBtn onClick={onCompose}/>
        </div>

        {/* Search */}
        <div style={{
          display:"flex", alignItems:"center", gap:9,
          background:"rgba(255,255,255,0.72)",
          border:"1px solid rgba(0,0,0,0.07)",
          borderRadius:14, padding:"9px 14px",
          marginBottom:14,
          backdropFilter:"blur(12px)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={C.muted} strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Namen, Projekten, Orten\u2026"
            style={{
              flex:1, border:"none", background:"none", outline:"none",
              fontSize:13.5, color:C.ink, fontFamily:"inherit",
            }}
          />
        </div>
      </div>

      {/* List Content */}
      <div className="hui-scroll" style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        position:"relative", zIndex:1,
      }}>
        <ConversationList
          chats={chats}
          loading={loading}
          onOpen={onOpen}
          onDiscover={onDiscoverClose}
          />
      </div>
    </div>

  );
}

/* ══════════════════════════════════════════════════════════════
   HAUPT-OVERLAY
══════════════════════════════════════════════════════════════ */

/* Diagnose-Komponente — liest window.__HUI_LAST_SWITCH_TAB__ live */
function LastSwitchTabInfo() {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    // Sofort lesen
    setInfo(window.__HUI_LAST_SWITCH_TAB__ || null);
    // Alle 500ms aktualisieren
    const id = setInterval(() => {
      setInfo(window.__HUI_LAST_SWITCH_TAB__ || null);
    }, 500);
    return () => clearInterval(id);
  }, []);
  if (!info) return (
    <div style={{ color: "#555", marginTop: 6, fontSize: 10 }}>
      LAST SWITCH TAB: —
    </div>
  );
  const ago = Math.round((Date.now() - info.ts) / 1000);
  // Caller: zeige nur Dateiname + Zeilennummer
  const callerShort = (info.caller || "?")
    .replace(/.*\//, "")   // alles vor letztem /
    .replace(/\?.*/, "")    // query params
    .slice(0, 60);
  return (
    <div style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 6 }}>
      <div style={{ color: "#aaa", fontSize: 10 }}>LAST SWITCH TAB ({ago}s ago):</div>
      <div style={{ color: "#ff7e7e", fontWeight: 700 }}>→ {info.newTab}</div>
      <div style={{ color: "#aaa", fontSize: 10, marginTop: 2 }}>LAST CALLER:</div>
      <div style={{ color: "#ffd700", wordBreak: "break-all", fontSize: 10 }}>{callerShort}</div>
    </div>
  );
}

/* Diagnose-Komponente — liest window.__HUI_LAST_SHOWCHAT__ live */
function LastShowChatInfo() {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    setInfo(window.__HUI_LAST_SHOWCHAT__ || null);
    const id = setInterval(() => {
      setInfo(window.__HUI_LAST_SHOWCHAT__ || null);
    }, 400);
    return () => clearInterval(id);
  }, []);
  if (!info) return (
    <div style={{ color: "#555", marginTop: 4, fontSize: 10 }}>
      LAST SHOWCHAT: —
    </div>
  );
  const ago = Math.round((Date.now() - info.ts) / 1000);
  const callerShort = (info.caller || "?").slice(0, 60);
  const valColor = info.value ? "#7effb2" : "#ff7e7e";
  return (
    <div style={{ marginTop: 5, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 5 }}>
      <div style={{ color: "#aaa", fontSize: 10 }}>LAST SHOWCHAT ({ago}s ago):</div>
      <div style={{ color: valColor, fontWeight: 700, fontSize: 12 }}>
        → {info.value ? "TRUE" : "FALSE"}
      </div>
      <div style={{ color: "#aaa", fontSize: 10, marginTop: 1 }}>CALLER:</div>
      <div style={{ color: "#ffd700", wordBreak: "break-all", fontSize: 10 }}>{callerShort}</div>
    </div>
  );
}

/* Diagnose-Komponente — zeigt CR_MOUNT / CR_UNMOUNT live */
function ConvRoomMountInfo() {
  const [mount, setMount] = React.useState(null);
  const [unmount, setUnmount] = React.useState(null);
  React.useEffect(() => {
    const id = setInterval(() => {
      setMount(window.__HUI_CR_MOUNT__ || null);
      setUnmount(window.__HUI_CR_UNMOUNT__ || null);
    }, 400);
    return () => clearInterval(id);
  }, []);
  const mAgo = mount   ? Math.round((Date.now() - mount.ts)   / 1000) : null;
  const uAgo = unmount ? Math.round((Date.now() - unmount.ts) / 1000) : null;
  return (
    <div style={{ marginTop: 5, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 5 }}>
      <div style={{ color: "#aaa", fontSize: 10 }}>CR_MOUNT {mAgo !== null ? `(${mAgo}s ago)` : "—"}:</div>
      <div style={{ color: mount ? "#7effb2" : "#555", fontSize: 10, wordBreak:"break-all" }}>
        {mount ? `id:${(mount.convId||"?").slice(0,8)} real:${mount.realChatId ? mount.realChatId.slice(0,8) : "null"}` : "—"}
      </div>
      <div style={{ color: "#aaa", fontSize: 10, marginTop: 2 }}>CR_UNMOUNT {uAgo !== null ? `(${uAgo}s ago)` : "—"}:</div>
      <div style={{ color: unmount ? "#ff7e7e" : "#555", fontSize: 10, wordBreak:"break-all" }}>
        {unmount ? `id:${(unmount.convId||"?").slice(0,8)} ts:${uAgo}s` : "—"}
      </div>
    </div>
  );
}
/* LAST CCO EVENT — spiegelt window.__HUI_LAST_CCO__ */
function LastCCOInfo() {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    const id = setInterval(() => setInfo(window.__HUI_LAST_CCO__ || null), 400);
    return () => clearInterval(id);
  }, []);
  if (!info) return <div style={{ color:"#555", fontSize:10, marginTop:4 }}>LAST CCO: —</div>;
  const ago = Math.round((Date.now() - info.ts) / 1000);
  return (
    <div style={{ marginTop:4, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:4 }}>
      <div style={{ color:"#aaa", fontSize:10 }}>LAST CCO ({ago}s ago):</div>
      <div style={{ color:"#ffd700", fontSize:11, fontWeight:700 }}>{info.event}</div>
      <div style={{ color:"#aaa", fontSize:10, wordBreak:"break-all" }}>
        {info.activeConv ? info.activeConv.slice(0,8) + "…" : "null"}
      </div>
    </div>
  );
}

/* LAST CR EVENT — spiegelt window.__HUI_LAST_CR__ */
function LastCRInfo() {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    const id = setInterval(() => setInfo(window.__HUI_LAST_CR__ || null), 400);
    return () => clearInterval(id);
  }, []);
  if (!info) return <div style={{ color:"#555", fontSize:10, marginTop:4 }}>LAST CR: —</div>;
  const ago = Math.round((Date.now() - info.ts) / 1000);
  const evColor = info.event === "CR_UNMOUNT" ? "#ff7e7e"
                : info.event === "CR_MOUNT"   ? "#7effb2"
                : "#ffd700";
  return (
    <div style={{ marginTop:4, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:4 }}>
      <div style={{ color:"#aaa", fontSize:10 }}>LAST CR ({ago}s ago):</div>
      <div style={{ color:evColor, fontSize:11, fontWeight:700 }}>{info.event}</div>
      <div style={{ color:"#aaa", fontSize:10, wordBreak:"break-all" }}>
        {info.convId ? info.convId.slice(0,8) + "…" : "null"}
        {info.event === "CR_RENDER" || info.event === "CR_RETURN"
          ? ` | loading:${info.loading} msg:${info.messages}` : ""}
      </div>
    </div>
  );
}

/* HUI_CHAT_KILLER — zeigt window.HUI_CHAT_KILLER live */
function LastKillerInfo() {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    const id = setInterval(() => setInfo(
      (typeof window !== "undefined" && window.HUI_CHAT_KILLER) || null
    ), 400);
    return () => clearInterval(id);
  }, []);
  if (!info) return <div style={{ color:"#555", fontSize:10, marginTop:4 }}>CHAT_KILLER: —</div>;
  const ago = Math.round((Date.now() - (info.ts ?? Date.now())) / 1000);
  return (
    <div style={{ marginTop:4, borderTop:"1px solid rgba(255,0,0,0.25)", paddingTop:4 }}>
      <div style={{ color:"#ff4444", fontSize:10, fontWeight:700 }}>⚠ CHAT_KILLER ({ago}s ago):</div>
      <div style={{ color:"#ffaaaa", fontSize:11, wordBreak:"break-all" }}>{info.reason}</div>
      <div style={{ color:"#ff8888", fontSize:10, wordBreak:"break-all" }}>{info.caller}</div>
    </div>
  );
}

/* LAST FCC EVENT — spiegelt window.__HUI_LAST_FCC__ */
function LastFCCInfo() {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    const id = setInterval(() => setInfo(
      (typeof window !== "undefined" && window.__HUI_LAST_FCC__) || null
    ), 400);
    return () => clearInterval(id);
  }, []);
  if (!info) return <div style={{ color:"#555", fontSize:10, marginTop:4 }}>LAST FCC: —</div>;
  const ago = Math.round((Date.now() - (info.ts ?? Date.now())) / 1000);
  const evColor =
    info.event === "FCC_ERROR"          ? "#ff7e7e" :
    info.event === "FCC_SUCCESS"        ? "#7effb2" :
    info.event === "FCC_FOUND_EXISTING" ? "#66ddff" :
    info.event === "FCC_CREATED"        ? "#aaffaa" :
    info.event === "FCC_CREATING"       ? "#ffd700" :
    "#aaa";
  return (
    <div style={{ marginTop:4, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:4 }}>
      <div style={{ color:"#aaa", fontSize:10 }}>LAST FCC ({ago}s ago):</div>
      <div style={{ color:evColor, fontSize:11, fontWeight:700 }}>{info.event}</div>
      <div style={{ color:"#aaa", fontSize:10, wordBreak:"break-all" }}>
        {info.chatId ? "chat:" + info.chatId.slice(0,8) + "…" : ""}
        {info.error  ? " err:" + String(info.error).slice(0,40) : ""}
      </div>
    </div>
  );
}

/* KILLER4 HISTORY — zeigt window.HUI_KILLER4_HISTORY live (max 30) */
function Killer4History() {
  const [logs, setLogs] = React.useState([]);
  React.useEffect(() => {
    const id = setInterval(() => {
      const all = (typeof window !== "undefined" && window.HUI_KILLER4_HISTORY) || [];
      setLogs([...all].reverse());
    }, 400);
    return () => clearInterval(id);
  }, []);
  if (logs.length === 0) {
    return (
      <div style={{ marginTop:6, borderTop:"1px solid rgba(255,165,0,0.2)", paddingTop:5 }}>
        <div style={{ color:"#555", fontSize:10 }}>KILLER4 HISTORY: ---</div>
      </div>
    );
  }
  return (
    <div style={{ marginTop:6, borderTop:"1px solid rgba(255,165,0,0.35)", paddingTop:5 }}>
      <div style={{ color:"#ffaa00", fontSize:10, fontWeight:700, marginBottom:3 }}>
        {"KILLER4 HISTORY (" + logs.length + "):"}
      </div>
      <div style={{
        maxHeight: 260, overflowY: "auto", WebkitOverflowScrolling: "touch",
        fontFamily: "monospace", fontSize: 10, lineHeight: 1.6,
      }}>
        {logs.map((entry, idx) => {
          const ev = entry.event || "";
          const evColor =
            ev === "KILLER4_SECOND_RUN"      ? "#ff0000" :
            ev === "KILLER4_DEP_CHANGE"      ? "#ff88ff" :
            ev === "KILLER4_CLEAR"           ? "#ff6644" :
            ev === "KILLER4_CLEANUP"         ? "#ff4488" :
            ev === "KILLER4_SET_ACTIVE_CONV" ? "#44ff88" :
            ev === "KILLER4_EFFECT_START"    ? "#ffdd44" :
            ev === "KILLER4_EFFECT_STOP"     ? "#888888" :
            ev === "KILLER4_FCC_NO_ID"       ? "#ff4444" :
            ev === "KILLER4_FCC_ERROR"       ? "#ff4444" :
            "#ffaa00";
          const ts = new Date(entry.ts).toISOString().slice(11, 23);
          const p = entry.payload || {};
          // Kompakte Darstellung
          const parts = [];
          if (p.activeConvId !== undefined) parts.push("ac:" + (p.activeConvId ? p.activeConvId.slice(0,6) : "null"));
          if (p.chatId)            parts.push("chat:" + p.chatId.slice(0,6));
          if (p.userChanged  !== undefined) parts.push("uChg:" + p.userChanged);
          if (p.recipientChanged !== undefined) parts.push("rChg:" + p.recipientChanged);
          if (p.prevRecipientId)   parts.push("pR:" + p.prevRecipientId.slice(0,6));
          if (p.nextRecipientId)   parts.push("nR:" + p.nextRecipientId.slice(0,6));
          if (p.reason)            parts.push("r:" + String(p.reason).slice(0,20));
          const detail = parts.join(" ");
          return (
            <div key={idx} style={{
              color: evColor,
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              paddingBottom: 1,
            }}>
              <span style={{ color:"#555" }}>{ts + " "}</span>
              <span style={{ fontWeight:700 }}>{ev}</span>
              {"  "}<span style={{ color:"#888", fontSize:9 }}>{detail}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* DEBUG TIMELINE — zeigt window.HUI_DEBUG_LOGS live */
function DebugTimeline() {
  const [logs, setLogs] = React.useState([]);
  React.useEffect(() => {
    const id = setInterval(() => {
      const all = (typeof window !== "undefined" && window.HUI_DEBUG_LOGS) || [];
      setLogs([...all].reverse().slice(0, 20));
    }, 500);
    return () => clearInterval(id);
  }, []);
  if (logs.length === 0) {
    return (
      <div style={{ marginTop:6, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:5 }}>
        <div style={{ color:"#555", fontSize:10 }}>DEBUG TIMELINE: —</div>
      </div>
    );
  }
  return (
    <div style={{ marginTop:6, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:5 }}>
      <div style={{ color:"#888", fontSize:10, marginBottom:3 }}>DEBUG TIMELINE ({logs.length}):</div>
      <div style={{
        maxHeight: 180,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        fontFamily: "monospace",
        fontSize: 10,
        lineHeight: 1.5,
      }}>
        {logs.map((entry, idx) => {
          const evColor =
            entry.event.includes("UNMOUNT")  ? "#ff7e7e" :
            entry.event.includes("MOUNT")    ? "#7effb2" :
            entry.event.includes("FALSE")    ? "#ff9966" :
            entry.event.includes("TRUE")     ? "#66ff99" :
            entry.event.includes("CCO_")     ? "#ffd700" :
            "#aaa";
          const ts = new Date(entry.ts).toISOString().slice(11, 23);
          const pay = entry.payload
            ? " " + JSON.stringify(entry.payload).slice(0, 40)
            : "";
          return (
            <div key={idx} style={{ color: evColor, borderBottom:"1px solid rgba(255,255,255,0.04)", paddingBottom:1 }}>
              <span style={{ color:"#555" }}>{ts} </span>
              {entry.event}{pay}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* [CCO_CRASH] — fängt Crashes in ConversationRoom und loggt sie sichtbar */
class CrashWatcher extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null, stack: null }; }
  static getDerivedStateFromError(e) { return { crashed: true, error: e }; }
  componentDidCatch(error, info) {
    console.error("[CCO_CRASH]", {
      label:          this.props.label || "?",
      message:        error?.message,
      stack:          error?.stack?.split("\n").slice(0,8).join("\n"),
      componentStack: info?.componentStack?.split("\n").slice(0,8).join("\n"),
      ts:             Date.now(),
    });
    if (typeof window !== "undefined") {
      window.__HUI_CCO_CRASH__ = {
        message: error?.message,
        stack:   error?.stack?.split("\n").slice(0,4).join("\n"),
        ts:      Date.now(),
      };
    }
  }
  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div style={{ padding: 16, background: "rgba(255,0,0,0.1)",
        color: "#ff4444", fontSize: 12, fontFamily: "monospace",
        position: "absolute", inset: 0, zIndex: 9999,
        overflow: "auto", whiteSpace: "pre-wrap" }}>
        [CCO_CRASH] {this.state.error?.message}\n\n
        {this.state.error?.stack?.split("\n").slice(0,10).join("\n")}
      </div>
    );
  }
}

export default function ChatCenterOverlay({ onClose, initialRecipient = null, onDiscoverClose }) {
  // CCO_UNMOUNT — feuert wenn ChatCenterOverlay komplett unmountet
  React.useEffect(() => {
    const _mountTs = Date.now();
    if (typeof window !== "undefined") {
      if (!window.HUI_DEBUG_LOGS) window.HUI_DEBUG_LOGS = [];
      window.HUI_DEBUG_LOGS.push({ ts: _mountTs, event: "CCO_MOUNT", payload: null });
    }
    console.log("[CCO_MOUNT]", { ts: _mountTs });
    return () => {
      const _unmountTs = Date.now();
      console.warn("[CCO_UNMOUNT]", { mountedFor: _unmountTs - _mountTs + "ms", ts: _unmountTs });
      const reason = "CCO_UNMOUNT", caller = "ChatCenterOverlay unmounted";
      if (typeof window !== "undefined") {
        window.HUI_CHAT_KILLER = { reason, caller, ts: _unmountTs, mountedFor: _unmountTs - _mountTs };
        if (!window.HUI_DEBUG_LOGS) window.HUI_DEBUG_LOGS = [];
        window.HUI_DEBUG_LOGS.push({ ts: _unmountTs, event: "CCO_UNMOUNT", payload: { mountedFor: _unmountTs - _mountTs } });
        if (window.HUI_DEBUG_LOGS.length > 100) window.HUI_DEBUG_LOGS.shift();
      }
    };
  }, []);

  const [activeConv, setActiveConv] = useState(null);
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const { openCreatorProfile } = useProfileLauncher();
  const { user } = useAuth();

  // initialRecipient: von Profil/Action aus Chat öffnen
  // KEIN fake-ID Fallback. Nur echte UUID oder kein Conv.
  const [loadingConv, setLoadingConv] = React.useState(false);
  const [debugStep,   setDebugStep]   = React.useState("idle");
  const [debugError,  setDebugError]  = React.useState(null);

  // ── initialRecipient → Chat direkt öffnen ──────────────────
  // Fix: user?.id im Dep-Array reicht nicht — wenn user zuerst
  // geladen wird und initialRecipient?.id sich nicht ändert,
  // feuert der Effekt kein zweites Mal. Lösung: beide als Deps
  // + activeConv Guard entfernt (neuer Recipient soll immer
  // eine frische Konversation öffnen, aktive dabei überschreiben).
  const lastRecipientRef = React.useRef(null);

  // Refs für Dependency-Change-Tracking (außerhalb des Effects)
  const _prevUserIdRef      = React.useRef(null);
  const _prevRecipientIdRef = React.useRef(null);

  React.useEffect(() => {
    // ── KILLER4 HELPER — MAX 30, CLEANUP getrennt ─────────────
    const _k4push = (event, payload) => {
      if (typeof window === "undefined") return;
      if (!window.HUI_KILLER4_HISTORY) window.HUI_KILLER4_HISTORY = [];
      window.HUI_KILLER4_HISTORY.push({ ts: Date.now(), event, payload });
      if (window.HUI_KILLER4_HISTORY.length > 30) window.HUI_KILLER4_HISTORY.shift();
      logDebug(event, payload);
    };
    const _k4pushCleanup = (payload) => {
      if (typeof window === "undefined") return;
      if (!window.HUI_KILLER4_CLEANUP) window.HUI_KILLER4_CLEANUP = [];
      window.HUI_KILLER4_CLEANUP.push({ ts: Date.now(), event: "KILLER4_CLEANUP", payload });
      if (window.HUI_KILLER4_CLEANUP.length > 50) window.HUI_KILLER4_CLEANUP.shift();
      _k4push("KILLER4_CLEANUP", payload);
    };

    const _nowUserId   = user?.id ?? null;
    const _nowRecipId  = initialRecipient?.id ?? null;
    const _prevUserId  = _prevUserIdRef.current;
    const _prevRecipId = _prevRecipientIdRef.current;

    // [KILLER4_EFFECT_START] ──────────────────────────────────
    const _k4meta = {
      userId:       _nowUserId,
      recipientId:  _nowRecipId,
      activeConvId: activeConv?.id ?? null,
      ts:           Date.now(),
    };
    console.log("[KILLER4_EFFECT_START]", _k4meta);
    _k4push("KILLER4_EFFECT_START", _k4meta);

    // [KILLER4_DEP_CHANGE] — wenn nicht erster Run ─────────────
    if (_prevUserId !== null || _prevRecipId !== null) {
      const _depChange = {
        prevUserId:       _prevUserId,
        nextUserId:       _nowUserId,
        prevRecipientId:  _prevRecipId,
        nextRecipientId:  _nowRecipId,
        prevActiveConv:   activeConv?.id ?? null,
        nextActiveConv:   null,
        userChanged:      _prevUserId !== _nowUserId,
        recipientChanged: _prevRecipId !== _nowRecipId,
        ts:               Date.now(),
      };
      console.log("[KILLER4_DEP_CHANGE]", _depChange);
      _k4push("KILLER4_DEP_CHANGE", _depChange);

      // SECOND_EFFECT_RUN: Effect feuert erneut UND activeConv war gesetzt
      if (activeConv?.id) {
        const _second = {
          reason:          "SECOND_EFFECT_RUN",
          activeConv:      activeConv.id,
          prevRecipientId: _prevRecipId,
          nextRecipientId: _nowRecipId,
          prevUserId:      _prevUserId,
          nextUserId:      _nowUserId,
          ts:              Date.now(),
        };
        console.warn("[KILLER4_SECOND_RUN]", _second);
        _k4push("KILLER4_SECOND_RUN", _second);
        if (typeof window !== "undefined") {
          window.HUI_CHAT_KILLER = { reason: "SECOND_EFFECT_RUN", ..._second };
        }
      }
    }
    _prevUserIdRef.current      = _nowUserId;
    _prevRecipientIdRef.current = _nowRecipId;

    if (!initialRecipient?.id) {
      console.log("[CHAT] STOP: kein initialRecipient.id");
      setDebugStep("stop: no recipient.id");
      _k4push("KILLER4_EFFECT_STOP", { reason: "no recipientId", ..._k4meta });
      return;
    }
    if (!user?.id) {
      console.log("[CHAT] STOP: kein user.id — Auth noch nicht geladen");
      setDebugStep("stop: no user.id");
      _k4push("KILLER4_EFFECT_STOP", { reason: "no userId", ..._k4meta });
      return;
    }
    if (lastRecipientRef.current === initialRecipient.id && activeConv) {
      console.log("[CHAT] STOP: gleicher Recipient bereits aktiv", {
        last: lastRecipientRef.current, active: activeConv?.id,
      });
      setDebugStep("stop: same recipient active");
      _k4push("KILLER4_EFFECT_STOP", { reason: "same recipient active", ..._k4meta });
      return;
    }
    lastRecipientRef.current = initialRecipient.id;

    const recipientId = initialRecipient.id;
    setDebugStep("calling findOrCreateChat");
    setDebugError(null);

    // [KILLER4_CLEAR] ─────────────────────────────────────────
    const _k4clear = {
      userId:       user.id,
      recipientId,
      activeConvId: activeConv?.id ?? null,
      ts:           Date.now(),
    };
    console.log("[KILLER4_CLEAR]", _k4clear);
    _k4push("KILLER4_CLEAR", _k4clear);
    { const reason = "setActiveConv(null) — reset before findOrCreateChat", caller = "CCO/useEffect/initialRecipient"; if (typeof window !== "undefined") { window.HUI_CHAT_KILLER = { reason, caller, ts: Date.now() }; if (!window.HUI_DEBUG_LOGS) window.HUI_DEBUG_LOGS = []; window.HUI_DEBUG_LOGS.push({ ts: Date.now(), event: "CHAT_KILLER", payload: { reason, caller } }); if (window.HUI_DEBUG_LOGS.length > 100) window.HUI_DEBUG_LOGS.shift(); } console.warn("[CHAT_KILLER]", { reason, caller }); }

    setLoadingConv(true);
    setActiveConv(null);

    findOrCreateChat({
      userId:      user.id,
      otherUserId: recipientId,
      chatType:    "direct",
    })
      .then(chatRecord => {
        console.log("[CHAT] conversation result", chatRecord);
        const realId = chatRecord?.id;
        if (!realId) {
          console.error("[CHAT] STOP: chatRecord ohne id", chatRecord);
          setDebugStep("stop: chatRecord null");
          setDebugError({ code: "NO_ID", message: JSON.stringify(chatRecord).slice(0,120) });
          _k4push("KILLER4_FCC_NO_ID", { recipientId, userId: user.id, chatRecord: JSON.stringify(chatRecord).slice(0,80) });
          return;
        }
        console.log("[CHAT] setActiveConv", realId);
        setDebugStep("setActiveConv: " + realId.slice(0,8));
        _k4push("KILLER4_SET_ACTIVE_CONV", { userId: user.id, recipientId, chatId: realId, ts: Date.now() });
        setActiveConv({
          id:           realId,
          name:         initialRecipient.display_name || "Creator",
          avatar_url:   initialRecipient.avatar_url   || null,
          talent:       initialRecipient.talent        || null,
          mood:         "Echte Verbindung",
          online:       true,
          _recipientId: recipientId,
        });
      })
      .catch(err => {
        console.error("[CHAT] Exception in findOrCreateChat", {
          message: err?.message, code: err?.code,
        });
        setDebugStep("exception");
        setDebugError({ code: err?.code, message: err?.message });
        logDebug("FCC_ERROR", { recipientId, userId: user.id, error: err?.message });
        _k4push("KILLER4_FCC_ERROR", { recipientId, userId: user.id, error: err?.message });
        if (typeof window !== "undefined") {
          window.__HUI_LAST_FCC__ = { event: "FCC_ERROR", recipientId, userId: user.id, error: err?.message, ts: Date.now() };
        }
      })
      .finally(() => {
        setLoadingConv(false);
        logDebug("FCC_FINALLY", { recipientId, userId: user.id, ts: Date.now() });
        if (typeof window !== "undefined") {
          window.__HUI_LAST_FCC__ = window.__HUI_LAST_FCC__ ?? { event: "FCC_FINALLY", recipientId, ts: Date.now() };
        }
      });

    // [KILLER4_CLEANUP] — separates Array, niemals überschreiben ─
    return () => {
      const _k4cleanup = {
        userId:       user?.id ?? null,
        recipientId:  initialRecipient?.id ?? null,
        activeConvId: activeConv?.id ?? null,
        ts:           Date.now(),
      };
      console.log("[KILLER4_CLEANUP]", _k4cleanup);
      _k4pushCleanup(_k4cleanup);
    };
  // user?.id + initialRecipient?.id: Effekt soll erneut feuern
  // wenn BEIDE bereit sind — auch wenn nur eines sich ändert
  }, [user?.id, initialRecipient?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const { chats, loading, unreadTotal } = useChatList();

  // [CCO_RENDER] — feuert bei jedem Render
  console.log("[CCO_RENDER]");
  logDebug("CCO_RENDER", { activeConv: activeConv?.id ?? null });
  if (typeof window !== "undefined") {
    window.__HUI_LAST_CCO__ = { event: "CCO_RENDER", activeConv: activeConv?.id ?? null, ts: Date.now() };
  }

  // [CCO_ACTIVECONV] — wenn activeConv sich ändert
  React.useEffect(() => {
    console.log("[CCO_ACTIVECONV]", activeConv?.id);
    logDebug("CCO_ACTIVECONV", { activeConv: activeConv?.id ?? null });
    if (typeof window !== "undefined") {
      window.__HUI_LAST_CCO__ = { event: "CCO_ACTIVECONV", activeConv: activeConv?.id ?? null, ts: Date.now() };
    }
  }, [activeConv]);

  // Wenn Conv geöffnet: normalize conv shape
  function openConv(rawConv) {
    const realId = rawConv?.id;
    if (!realId || typeof realId === "number") {
      console.error("[HUI_CHAT] openConv: ungültige id:", realId, rawConv);
      return;
    }
    const other = rawConv.other_profile || {};
    console.log("[HUI_CHAT] openConv:", realId, rawConv.name || other.display_name);
    setActiveConv({
      id:           realId,
      name:         rawConv.name || other.display_name || "Gespräch",
      avatar_url:   rawConv.avatar_url || other.avatar_url || null,
      talent:       rawConv.talent || other.focus_type || null,
      mood:         rawConv.mood || (other.availability === "busy" ? "Gerade kreativ im Studio" : "Im Atelier"),
      online:       rawConv.online ?? true,
      last_message: rawConv.last_message,
      other_profile: rawConv.other_profile || null,
    });
  }

  // [CCO_RETURN] — direkt vor dem render-Return
  console.log("[CCO_RETURN]");
  logDebug("CCO_RETURN", { activeConv: activeConv?.id ?? null });

  return (
    <>
    <div style={{
      position:"fixed", inset:0, zIndex:10001,
      display:"flex", overflow:"hidden",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      animation:"cc-in 0.22s ease both",
    }}>
      <style>{CSS}</style>

      {/* ── LIST PANEL ── */}
      <div style={{
        flex:1, minWidth:0,
        display:"flex", flexDirection:"column",
        // Mobile: wenn Conv offen → versteckt
        opacity: activeConv ? 0 : 1,
        pointerEvents: activeConv ? "none" : "auto",
        transition:"opacity 0.18s ease",
        position:"relative",
      }}>
        <ListPanel
          onClose={onClose}
          onOpen={openConv}
          onCompose={() => setShowPeopleSearch(true)}
          chats={chats}
          loading={loading}
          activeId={activeConv?.id}
          onDiscoverClose={onDiscoverClose}
        />
      </div>

      {/* ── PEOPLE SEARCH — direkte Suche nach Menschen ── */}
      {showPeopleSearch && (
        <PeopleSearch
          onClose={() => setShowPeopleSearch(false)}
          onOpenProfile={(profile) => {
            setShowPeopleSearch(false);
            // Profil über ProfileLauncher öffnen
            const userId = profile?.id || profile?.user_id;
            if (userId) openCreatorProfile(userId, {
              display_name: profile?.display_name,
              avatar_url:   profile?.avatar_url,
              talent:       profile?.talent,
            });
          }}
          onOpenChat={(profile) => {
            setShowPeopleSearch(false);
            if (!profile?.id || !user?.id) {
              console.error("[HUI_CHAT] PeopleSearch: fehlende IDs", { profileId: profile?.id, userId: user?.id });
              return;
            }
            console.log("[HUI_CHAT] PeopleSearch → findOrCreateChat", profile.display_name);
            findOrCreateChat({
              userId:      user.id,
              otherUserId: profile.id,
              chatType:    "direct",
            }).then(chatRecord => {
              const realId = chatRecord?.id;
              if (!realId) {
                console.error("[HUI_CHAT] PeopleSearch: kein chatRecord.id!", chatRecord);
                return; // kein fake-ID Fallback
              }
              console.log("[HUI_CHAT] Chat bereit:", realId);
              setActiveConv({
                id:         realId,
                name:       profile.display_name || "Creator",
                avatar_url: profile.avatar_url || null,
                talent:     profile.talent || null,
                mood:       "Echte Verbindung",
                online:     true,
              });
            }).catch(err => {
              console.error("[HUI_CHAT] findOrCreateChat Fehler:", err?.message);
            });
          }}
        />
      )}

      {/* ── CONV LOADING ── */}
      {loadingConv && !activeConv && (
        <div style={{
          position:"absolute", inset:0, zIndex:3,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(249,247,244,0.95)", backdropFilter:"blur(20px)",
        }}>
          <div style={{ textAlign:"center" }}>
            <div style={{
              width:40, height:40, borderRadius:"50%",
              border:"3px solid rgba(22,215,197,0.2)",
              borderTop:"3px solid #16D7C5",
              animation:"hui-spin 0.9s linear infinite",
              margin:"0 auto 12px",
            }}/>
            <div style={{ fontSize:13, color:"#999" }}>Verbindung wird vorbereitet…</div>
          </div>
        </div>
      )}

      {/* ── ROOM PANEL — slides in über Liste auf Mobile ── */}
      {activeConv && (
        <div style={{
          position:"absolute", inset:0, zIndex:2,
          display:"flex", flexDirection:"column",
          animation:"cc-room-in 0.22s ease both",
          // Kein overflow:hidden — ChatInput muss bis zum Boden sichtbar sein
        }}>
          {/* [CCO_RENDER_ROOM] */}
          {(console.log("[CCO_RENDER_ROOM]", activeConv?.id) || logDebug("CCO_RENDER_ROOM", { activeConv: activeConv?.id })) && null}
          <CrashWatcher label="ConversationRoom">
            <ConversationRoom
              conv={activeConv}
              onBack={() => {
                const reason = "setActiveConv(null)", caller = "CCO/ConversationRoom/onBack";
                if (typeof window !== "undefined") { window.HUI_CHAT_KILLER = { reason, caller, ts: Date.now() }; if (!window.HUI_DEBUG_LOGS) window.HUI_DEBUG_LOGS = []; window.HUI_DEBUG_LOGS.push({ ts: Date.now(), event: "CHAT_KILLER", payload: { reason, caller } }); if (window.HUI_DEBUG_LOGS.length > 100) window.HUI_DEBUG_LOGS.shift(); } console.warn("[CHAT_KILLER]", { reason, caller });
                setActiveConv(null);
              }}
              onOpenProfile={(conv) => {
                // Phase 23: Chat → Profil öffnen
                // Chat schließt sich, Profil öffnet sich
                const userId = conv?.user_id || conv?.id;
                if (userId) openCreatorProfile(userId, {
                  display_name: conv?.name,
                  avatar_url:   conv?.avatar_url,
                  talent:       conv?.talent,
                });
              }}
            />
          </CrashWatcher>
        </div>
      )}
    </div>

      {/* ── TEMPORÄRES DEBUG-OVERLAY (iPad-Diagnose — nach Screenshot entfernen) ── */}
      <div style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 99999,
        background: "rgba(0,0,0,0.88)",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 11,
        lineHeight: 1.6,
        padding: "10px 14px",
        borderRadius: 8,
        maxWidth: 280,
        pointerEvents: "none",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}>
        <div style={{ color: "#888", fontSize: 10, marginBottom: 2 }}>
          BUILD: de9efe0913
        </div>
        <div style={{ color: "#16D7C5", fontWeight: 700, marginBottom: 4 }}>
          ⬡ CHAT DEBUG
        </div>
        {/* CHAT KILLER */}
        <LastKillerInfo />
        {/* KILLER4 HISTORY */}
        <Killer4History />
        <div>recipient: <span style={{ color: "#ffd" }}>
          {initialRecipient?.id ? initialRecipient.id.slice(0, 8) + "…" : "—"}
        </span></div>
        <div>user: <span style={{ color: "#ffd" }}>
          {user?.id ? user.id.slice(0, 8) + "…" : "—"}
        </span></div>
        <div>activeConv: <span style={{ color: "#ffd" }}>
          {activeConv?.id ? activeConv.id.slice(0, 8) + "…" : "—"}
        </span></div>
        <div style={{ marginTop: 4 }}>
          step: <span style={{ color: "#7effb2" }}>{debugStep}</span>
        </div>
        {debugError && (
          <>
            <div style={{ color: "#ff7e7e", marginTop: 4 }}>
              code: {debugError.code ?? "—"}
            </div>
            <div style={{
              color: "#ffb07e",
              wordBreak: "break-all",
              maxWidth: 256,
            }}>
              msg: {String(debugError.message ?? "").slice(0, 140)}
            </div>
          </>
        )}
        {/* LAST FCC EVENT */}
        <LastFCCInfo />
        {/* LAST CCO EVENT */}
        <LastCCOInfo />
        {/* LAST CR EVENT */}
        <LastCRInfo />
        {/* LAST SWITCH TAB */}
        <LastSwitchTabInfo />
        {/* LAST SHOWCHAT EVENT */}
        <LastShowChatInfo />
        {/* DEBUG TIMELINE */}
        <DebugTimeline />
      </div>
    </>
  );
}

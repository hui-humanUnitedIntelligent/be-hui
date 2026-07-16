import {
  HUIBenachrichtigungIcon,
} from "../../design/icons/HuiSystemIcons.jsx";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../AuthContext.jsx";
import { useNotifications } from "./useNotifications.jsx";
import { useConnectionRequests } from "./useConnectionRequests.js";
import { T } from "./notificationTypes.js";
import { injectCSS } from "./notificationUtils.js";
import {
  computeTabCounts,
  filterItemsByTab,
  groupItemsByTab,
} from "./notificationHelpers.js";
import { NotifItem } from "./components/NotifItem.jsx";
import { ConnectionRequestItem } from "./components/ConnectionRequestItem.jsx";
import { SectionHeader } from "./components/SectionHeader.jsx";
import { WeekStats } from "./components/WeekStats.jsx";
import { EmptyTab } from "./components/EmptyTab.jsx";

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
    return computeTabCounts(safeItems, safeRequests);
  }, [safeItems, safeRequests]);

  // Items gefiltert
  const filteredItems = useMemo(() => {
    return filterItemsByTab(safeItems, tab);
  }, [safeItems, tab]);

  // Gruppen für "alle" Tab
  const grouped = useMemo(() => {
    if (tab !== "alle") return null;
    return groupItemsByTab(safeItems);
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
        <div style={{
          padding:"env(safe-area-inset-top,16px) 16px 0",
          paddingTop:`calc(env(safe-area-inset-top, 0px) + 16px)`,
          background:T.cream,
          flexShrink:0,
        }}>
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

          <div style={{
            fontSize:12.5, color:T.inkFaint,
            lineHeight:1.5, marginBottom:14, paddingLeft:2,
          }}>
            Alles Wichtige rund um dein Wirken, deine Verbindungen und deine Gemeinschaft.
          </div>

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
                Alle Nachrichten gelesen
              </button>
            )}
          </div>

          <div style={{height:1, background:T.border, marginBottom:0}}/>
        </div>

        <div
          style={{
            flex:1, overflowY:"auto",
            WebkitOverflowScrolling:"touch",
          }}
        >
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

          {tab === "alle" && grouped && (
            <>
              {grouped.wichtig.length > 0 && (
                <>
                  {safeRequests.length === 0 && <SectionHeader emoji="⭐" label="Wichtig" />}
                  {grouped.wichtig.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} onDelete={notif?.deleteNotif} />)}
                </>
              )}
              {grouped.relevant.length > 0 && (
                <>
                  <SectionHeader emoji="⭐" label="Relevant" />
                  {grouped.relevant.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} onDelete={notif?.deleteNotif} />)}
                </>
              )}
              {grouped.info.length > 0 && (
                <>
                  <SectionHeader emoji="⭐" label="Informativ" />
                  {grouped.info.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} onDelete={notif?.deleteNotif} />)}
                </>
              )}
              {safeItems.length === 0 && safeRequests.length === 0 && (
                <EmptyTab tab="alle" />
              )}
            </>
          )}

          {tab !== "alle" && (
            isEmpty
              ? <EmptyTab tab={tab} />
              : filteredItems.map(n => <NotifItem key={n.id} n={n} onRead={notif?.markRead ?? (() => {})} onDelete={notif?.deleteNotif} />)
          )}

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

          <WeekStats userId={user?.id} />
        </div>
      </div>
    </>
  , document.body);
}

// src/components/profile/SystemBotProfile.jsx
// HUI-System Bot Profil — spezielle Ansicht für den System-Account
// Zeigt: Name + Follower + Abgeschlossene Projekte (Kacheln) + Systemnachrichten
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useHome } from "../home/HomeShell.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { HUILogo } from "../brand/HUILogo.jsx";
import { formatDateDE, formatNumberDE } from "../../lib/formatters.js";

const SYSTEM_USER_ID = "152619c1-9adc-40bf-9078-eb67f5024ed2";

const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.28)",
  border:    "rgba(26,26,24,0.08)",
  borderMid: "rgba(26,26,24,0.13)",
  green:     "rgba(34,197,94,1)",
  greenSoft: "rgba(34,197,94,0.10)",
  r12: 12, r16: 16, r20: 20, r24: 24,
  card:  "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  cardMd:"0 2px 16px rgba(26,26,24,0.09), 0 1px 4px rgba(26,26,24,0.05)",
};

const CSS = `
  .sbp-root{background:${T.bg};font-family:Inter,sans-serif;color:${T.ink};}
  .sbp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .sbp-scroll::-webkit-scrollbar{display:none;}
  @keyframes sbp-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .sbp-in{animation:sbp-fade-up .45s ease both;}
  .sbp-press{transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}
  .sbp-press:active{transform:scale(0.96);opacity:0.85;}
`;

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ── Projekt-Kachel (gleicher Stil wie Werke/Talente in Discover) ────────
function ProjectCard({ project = {}, onPress = () => {} }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = project.cover_url || (project.media_urls && project.media_urls[0]) || null;
  const goal = project.funding_goal || 0;

  return (
    <div
      onClick={() => onPress(project)}
      className="sbp-press"
      style={{
        background: T.bgCard,
        borderRadius: T.r16,
        overflow: "hidden",
        boxShadow: T.card,
        border: "1px solid " + T.border,
        cursor: "pointer",
      }}
    >
      <div style={{
        width: "100%", height: 160,
        background: T.tealSoft,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", position: "relative",
      }}>
        {cover && !imgErr ? (
          <img src={cover} alt={project.project_name || "Projekt"} loading="lazy"
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <HUILogo size={40} style={{ opacity: 0.5 }} />
        )}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: T.green, color: "#fff",
          fontSize: 10, fontWeight: 600,
          padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap",
        }}>Finanziert</div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.3,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 4,
        }}>{project.project_name || "Unbenanntes Projekt"}</div>
        {project.short_desc && (
          <div style={{
            fontSize: 12, color: T.inkSoft, lineHeight: 1.4,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
          }}>{project.short_desc}</div>
        )}
        {goal > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: T.green, fontWeight: 600 }}>
            {"\u20AC"}{formatNumberDE(goal)} erreicht
          </div>
        )}
      </div>
    </div>
  );
}

// ── Systemnachricht-Eintrag ─────────────────────────────────────────────
function MessageItem({ notif = {}, onPress = () => {} }) {
  const date = notif.created_at ? new Date(notif.created_at) : null;
  const dateStr = date ? formatDateDE(date, { day: "2-digit", month: "short", year: "numeric" }) : "";

  return (
    <div
      onClick={() => onPress(notif)}
      className="sbp-press"
      style={{
        background: T.bgCard, borderRadius: T.r12,
        padding: "14px 16px", boxShadow: T.card,
        border: "1px solid " + T.border, cursor: "pointer", marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.teal, background: T.tealSoft, padding: "2px 8px", borderRadius: 99 }}>
          Systemnachricht
        </span>
        <span style={{ fontSize: 11, color: T.inkFaint, marginLeft: "auto" }}>{dateStr}</span>
      </div>
      {notif.title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.3, marginBottom: 4 }}>
          {notif.title}
        </div>
      )}
      {notif.body && (
        <div style={{
          fontSize: 13, color: T.inkSoft, lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        }}>{notif.body}</div>
      )}
    </div>
  );
}

// ── Haupt-Komponente ─────────────────────────────────────────────────────
export default function SystemBotProfile({ profileId, onClose = () => {} }) {
  const { authProfile } = useHome();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useModalRegistration(true, onClose, "SystemBotProfile");

  useEffect(() => {
    injectCSS();
    let dead = false;

    async function loadAll() {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id,full_name,username,avatar_url,bio,followers_count,is_system_account")
          .eq("id", SYSTEM_USER_ID)
          .maybeSingle();
        if (!dead && prof) {
          setProfile(prof);
          setFollowerCount(prof.followers_count || 0);
        }

        const { data: projData } = await supabase
          .from("impact_applications")
          .select("id,project_name,short_desc,cover_url,media_urls,funding_goal,current_amount_eur,completed_at,created_at")
          .eq("is_completed", true)
          .order("completed_at", { ascending: false })
          .limit(20);
        if (!dead) setProjects(projData || []);

        const { data: msgData } = await supabase
          .from("notifications")
          .select("id,type,title,body,created_at,action_url,entity_type,entity_id")
          .or("type.eq.broadcast,type.eq.admin_broadcast")
          .order("created_at", { ascending: false })
          .limit(30);
        if (!dead) setMessages(msgData || []);
      } catch (err) {
        console.warn("[SystemBotProfile] load error:", err?.message);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    loadAll();
    return () => { dead = true; };
  }, []);

  // Follow-Status pruefen
  useEffect(() => {
    if (!authProfile?.id) return;
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", authProfile.id)
      .eq("following_id", SYSTEM_USER_ID)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));
  }, [authProfile?.id]);

  const handleFollow = useCallback(async () => {
    if (!authProfile?.id) return;
    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", authProfile.id).eq("following_id", SYSTEM_USER_ID);
      setIsFollowing(false);
      setFollowerCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from("follows").insert({ follower_id: authProfile.id, following_id: SYSTEM_USER_ID });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  }, [authProfile?.id, isFollowing]);

  const handleProjectPress = useCallback((project) => {
    window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "impact" } }));
    onClose?.();
  }, [onClose]);

  const handleMessagePress = useCallback((notif) => {
    if (notif.action_url) {
      window.dispatchEvent(new CustomEvent("hui:navigate:url", { detail: { url: notif.action_url } }));
      onClose?.();
    }
  }, [onClose]);

  const content = (
    <div className="sbp-root sbp-in" style={{
      position: "fixed", inset: 0, zIndex: 10500,
      background: T.bg, display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px 14px", background: T.bgCard,
        borderBottom: "1px solid " + T.border, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: 99, color: T.ink, fontSize: 20,
        }}>{"\u2039"}</button>

        <div style={{
          width: 48, height: 48, borderRadius: 99,
          background: T.tealSoft, border: "2px solid " + T.tealMid,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
        }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="myHUI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <HUILogo size={28} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>
            {profile?.display_name || profile?.full_name || "myHUI"}
          </div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
            {followerCount} Follower
          </div>
        </div>

        {authProfile?.id && authProfile.id !== SYSTEM_USER_ID && (
          <button onClick={handleFollow} style={{
            padding: "8px 18px", borderRadius: 99,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: isFollowing ? "transparent" : T.teal,
            color: isFollowing ? T.teal : "#fff",
            border: isFollowing ? "1.5px solid " + T.tealMid : "none",
          }}>{isFollowing ? "Folgst du" : "Folgen"}</button>
        )}
      </div>

      {/* Scroll-Content */}
      <div className="sbp-scroll" style={{ flex: 1, paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.inkSoft, fontSize: 14 }}>Lädt…</div>
        ) : (
          <>
            {/* Abgeschlossene Projekte */}
            <div style={{ padding: "20px 20px 0" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 14 }}>
                Abgeschlossene Projekte
              </div>
              {projects.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: T.inkFaint, fontSize: 13 }}>
                  Noch keine Projekte abgeschlossen.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {projects.map(p => (
                    <ProjectCard key={p.id} project={p} onPress={handleProjectPress} />
                  ))}
                </div>
              )}
            </div>

            {/* Systemnachrichten */}
            <div style={{ padding: "24px 20px 0" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 14 }}>
                Systemnachrichten
              </div>
              {messages.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: T.inkFaint, fontSize: 13 }}>
                  Keine Systemnachrichten vorhanden.
                </div>
              ) : (
                <div>
                  {messages.map(m => (
                    <MessageItem key={m.id} notif={m} onPress={handleMessagePress} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: "calc(88px + env(safe-area-inset-bottom, 0px))" }} />
          </>
        )}
      </div>
    </div>
  );

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  return portalTarget ? createPortal(content, portalTarget) : content;
}

export { SYSTEM_USER_ID };

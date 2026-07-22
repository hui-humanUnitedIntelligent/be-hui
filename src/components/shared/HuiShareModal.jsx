// src/components/shared/HuiShareModal.jsx — HUI Share System v1.0
// ══════════════════════════════════════════════════════════════════
// Einheitliches Share-Modal mit zwei Kanälen:
//   1. Intern  → HUI-Nutzer suchen + rpc_share_content (Notification)
//   2. Extern  → native Web-Share-API / Social-Deep-Links
//
// Architektur:
//   - createPortal → document.body (zIndex 11000, über allem)
//   - Kein State-Fetching beim Öffnen (lazy — Suche erst bei Eingabe)
//   - Einheitliche item-Shape: { id, type, title, text, media, author }
//   - Typen: work | experience | moment | project | event | talent
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";
import { useUserSearch } from "../../features/discovery/userSearch";
import { toast } from "../../lib/useToast.jsx";

// ── Design Tokens (identisch BaseFeedCard) ──────────────────────
const T = {
  teal:     "#0DC4B5",
  tealSoft: "rgba(13,196,181,0.08)",
  tealLine: "rgba(13,196,181,0.18)",
  coral:    "#F47355",
  ink:      "#1A1A2E",
  ink2:     "rgba(26,26,46,0.55)",
  ink3:     "rgba(26,26,46,0.38)",
  bg:       "#FAFAFA",
  card:     "#FFFFFF",
  border:   "rgba(26,26,46,0.08)",
};

// ── Typ-Labels + Icons ──────────────────────────────────────────
const TYPE_META = {
  work:       { label: "Werk",              emoji: "🖼" },
  experience: { label: "Erlebnis",          emoji: "✨" },
  moment:     { label: "Moment",            emoji: "💫" },
  project:    { label: "Projekt",           emoji: "🌱" },
  event:      { label: "Veranstaltung",     emoji: "📅" },
  talent:     { label: "Talent-Angebot",   emoji: "🎯" },
};

// ── Öffentliche URL bauen ────────────────────────────────────────
function buildPublicUrl(item) {
  const origin = typeof window !== "undefined" ? (window.location?.origin || "https://hui.app") : "https://hui.app";
  switch (item.type) {
    case "work":       return `${origin}/work/${item.id}`;
    case "experience": return `${origin}/erlebnis/${item.id}`;
    case "moment":     return `${origin}/beitrag/${item.id}`;
    case "project":    return `${origin}/projekt/${item.id}`;
    case "event":      return `${origin}/veranstaltung/${item.id}`;
    case "talent":     return `${origin}/talent/${item.id}`;
    default:           return `${origin}/Home`;
  }
}

// ── Share-Text bauen ────────────────────────────────────────────
function buildShareText(item) {
  const meta = TYPE_META[item.type] || { label: "Inhalt", emoji: "✦" };
  const title = item.title || item.name || meta.label;
  const desc  = (item.text || item.description || item.bio || "").slice(0, 140);
  const url   = buildPublicUrl(item);
  const footer = "\n\nMelde dich bei HUI an und entdecke faszinierende Werke und Talente.\nhttps://hui.app";
  return `${meta.emoji} ${title}${desc ? `\n${desc}` : ""}${url ? `\n${url}` : ""}${footer}`;
}

// ── Social-Deep-Links ────────────────────────────────────────────
const SOCIAL_APPS = [
  {
    id: "whatsapp", label: "WhatsApp",
    color: "#25D366", bg: "rgba(37,211,102,0.10)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    build: (text, url) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: "telegram", label: "Telegram",
    color: "#2AABEE", bg: "rgba(42,171,238,0.10)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    build: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "instagram", label: "Instagram",
    color: "#E1306C", bg: "rgba(225,48,108,0.10)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    // Instagram hat keine direkte Share-URL — kopieren + öffnen:
    build: (text, url) => null, // speziell behandelt
    special: "instagram",
  },
  {
    id: "email", label: "E-Mail",
    color: "#6366F1", bg: "rgba(99,102,241,0.10)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,12 2,6"/>
      </svg>
    ),
    build: (text, url, title) => `mailto:?subject=${encodeURIComponent(title || "HUI")}&body=${encodeURIComponent(text)}`,
  },
  {
    id: "sms", label: "SMS",
    color: "#10B981", bg: "rgba(16,185,129,0.10)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    build: (text, url) => `sms:?body=${encodeURIComponent(text)}`,
  },
  {
    id: "copy", label: "Link kopieren",
    color: T.ink2, bg: "rgba(26,26,46,0.06)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    ),
    build: null,
    special: "copy",
  },
];

// ── Avatar-Hilfsfunktion ─────────────────────────────────────────
function Avatar({ user, size = 36 }) {
  if (user.avatar_url) {
    return (
      <img src={user.avatar_url} alt="" style={{
        width: size, height: size, borderRadius: "50%", objectFit: "cover",
        border: `1.5px solid ${T.tealLine}`, flexShrink: 0,
      }} />
    );
  }
  const initials = (user.display_name || user.username || "?").slice(0, 1).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: T.teal, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HAUPT-KOMPONENTE
// ══════════════════════════════════════════════════════════════════
export function HuiShareModal({ item, onClose }) {
  const [tab, setTab]                 = useState("intern"); // "intern" | "extern"
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage]         = useState("");
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);
  const overlayRef = useRef(null);

  const { query, setQuery, results, loading: searching } = useUserSearch({ minLength: 2 });

  const meta      = TYPE_META[item?.type] || { label: "Inhalt", emoji: "✦" };
  const title     = item?.title || item?.name || meta.label;
  const publicUrl = item ? buildPublicUrl(item) : "";
  const shareText = item ? buildShareText(item) : "";
  const thumbUrl  = item?.media?.[0]?.url || item?.img || item?.cover_url || null;

  // Escape-Taste:
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Body-Scroll sperren:
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Intern: Teilen ─────────────────────────────────────────────
  const handleInternalShare = useCallback(async () => {
    if (!selectedUser || !item?.id || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.rpc("rpc_share_content", {
        p_recipient_id:  selectedUser.id,
        p_entity_id:     item.id,
        p_entity_type:   item.type || "work",
        p_entity_title:  title || null,
        p_entity_url:    publicUrl || null,
        p_message:       message.trim() || null,
      });
      if (error) throw error;
      setSent(true);
      toast.success(`Geteilt mit ${selectedUser.display_name || selectedUser.username} ✓`);
      setTimeout(() => onClose?.(), 1400);
    } catch (err) {
      console.warn("[HUI_SHARE] intern:", err?.message);
      toast.error("Teilen fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSending(false);
    }
  }, [selectedUser, item, title, publicUrl, message, sending, onClose]);

  // ── Extern: Social ─────────────────────────────────────────────
  const handleExternalShare = useCallback(async (app) => {
    if (app.special === "instagram") {
      try { await navigator.clipboard.writeText(shareText); } catch {}
      toast.info("Text kopiert — öffne Instagram und füge ihn in deine Story ein.");
      window.open("https://www.instagram.com/", "_blank", "noopener");
      return;
    }
    if (app.special === "copy") {
      try {
        await navigator.clipboard.writeText(publicUrl);
        setCopiedLink(true);
        toast.success("Link kopiert ✓");
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {
        toast.error("Link konnte nicht kopiert werden.");
      }
      return;
    }

    // Native Web Share API zuerst (Android/iOS):
    if (app.id === "copy" || !navigator.share) {
      // Fallback via Deep-Link:
      const url = app.build?.(shareText, publicUrl, title);
      if (url) window.open(url, "_blank", "noopener");
      return;
    }

    // Für alle anderen: native Share + Fallback Deep-Link:
    try {
      await navigator.share({ title, text: shareText, url: publicUrl });
    } catch (err) {
      if (err?.name === "AbortError") return;
      // Fallback: Deep-Link:
      const fallback = app.build?.(shareText, publicUrl, title);
      if (fallback) window.open(fallback, "_blank", "noopener");
    }
  }, [shareText, publicUrl, title]);

  // ── Backdrop-Klick ──────────────────────────────────────────────
  const handleBackdrop = useCallback((e) => {
    if (e.target === overlayRef.current) onClose?.();
  }, [onClose]);

  if (!item) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(26,26,46,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 11000,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 480,
          background: T.card,
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
          overflow: "hidden",
          maxHeight: "90dvh",
          display: "flex", flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{
          padding: "16px 20px 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* HUI-Logo klein */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: T.teal, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff",
            }}>H</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: -0.3 }}>
              HUI Share
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: T.ink3, fontSize: 22, lineHeight: 1, padding: "4px 6px",
              borderRadius: 8,
            }}
          >×</button>
        </div>

        {/* ── Content-Preview ──────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 20px",
          background: T.tealSoft,
          borderBottom: `1px solid ${T.tealLine}`,
        }}>
          {thumbUrl && (
            <img src={thumbUrl} alt="" style={{
              width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0,
            }} />
          )}
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {meta.emoji} {meta.label}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 600, color: T.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300,
            }}>
              {title}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
          {[
            { key: "intern", label: "Intern teilen" },
            { key: "extern", label: "Extern teilen" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "12px 0", background: "none", border: "none",
                fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? T.teal : T.ink3,
                borderBottom: tab === t.key ? `2.5px solid ${T.teal}` : "2.5px solid transparent",
                cursor: "pointer", transition: "all 0.18s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Intern ──────────────────────────────────────── */}
        {tab === "intern" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>

            {/* Nutzer-Suche */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.ink3, letterSpacing: 0.4, display: "block", marginBottom: 6 }}>
                EMPFÄNGER SUCHEN
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedUser(null); }}
                  placeholder="Name oder @username…"
                  autoComplete="off"
                  style={{
                    width: "100%", padding: "10px 14px",
                    borderRadius: 10, border: `1.5px solid ${T.border}`,
                    background: T.bg, color: T.ink, fontSize: 14,
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.18s",
                  }}
                  onFocus={e => (e.target.style.borderColor = T.teal)}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
                {searching && (
                  <div style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    width: 16, height: 16, borderRadius: "50%",
                    border: `2px solid ${T.teal}`, borderTopColor: "transparent",
                    animation: "hui-icon-spin 700ms linear infinite",
                  }} />
                )}
              </div>
            </div>

            {/* Ausgewählter Nutzer */}
            {selectedUser && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12,
                background: T.tealSoft, border: `1.5px solid ${T.tealLine}`,
                marginBottom: 14,
              }}>
                <Avatar user={selectedUser} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
                    {selectedUser.display_name || selectedUser.username}
                  </div>
                  {selectedUser.username && (
                    <div style={{ fontSize: 12, color: T.teal }}>@{selectedUser.username}</div>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setQuery(""); }}
                  style={{ background: "none", border: "none", color: T.ink3, cursor: "pointer", fontSize: 18 }}
                >×</button>
              </div>
            )}

            {/* Suchergebnisse */}
            {!selectedUser && results.length > 0 && (
              <div style={{
                borderRadius: 12, border: `1px solid ${T.border}`,
                overflow: "hidden", marginBottom: 14,
                maxHeight: 220, overflowY: "auto",
              }}>
                {results.slice(0, 12).map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setQuery(u.display_name || u.username || ""); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      background: i % 2 === 0 ? T.card : T.bg,
                      border: "none", cursor: "pointer", textAlign: "left",
                      borderBottom: i < results.length - 1 ? `1px solid ${T.border}` : "none",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.tealSoft)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? T.card : T.bg)}
                  >
                    <Avatar user={u} size={32} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                        {u.display_name || u.username}
                      </div>
                      {u.username && (
                        <div style={{ fontSize: 11, color: T.ink3 }}>@{u.username}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Optionale Nachricht */}
            {selectedUser && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.ink3, letterSpacing: 0.4, display: "block", marginBottom: 6 }}>
                  NACHRICHT (OPTIONAL)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 200))}
                  placeholder="Schreib etwas dazu…"
                  rows={2}
                  style={{
                    width: "100%", padding: "10px 14px",
                    borderRadius: 10, border: `1.5px solid ${T.border}`,
                    background: T.bg, color: T.ink, fontSize: 13,
                    resize: "none", outline: "none", boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={e => (e.target.style.borderColor = T.teal)}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
                <div style={{ fontSize: 10, color: T.ink3, textAlign: "right", marginTop: 2 }}>
                  {message.length}/200
                </div>
              </div>
            )}

            {/* CTA-Button */}
            <button
              disabled={!selectedUser || sending || sent}
              onClick={handleInternalShare}
              style={{
                width: "100%", padding: "13px 0",
                borderRadius: 12, border: "none",
                background: sent ? "#22C55E" : selectedUser ? T.teal : T.border,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: selectedUser && !sending && !sent ? "pointer" : "default",
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {sent ? (
                <><span>✓</span> Geteilt</>
              ) : sending ? (
                <><div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
                  animation: "hui-icon-spin 700ms linear infinite",
                }}/> Wird geteilt…</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="17" height="17">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  {selectedUser ? `An ${selectedUser.display_name?.split(" ")[0] || "senden"}` : "Empfänger auswählen"}
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Tab: Extern ──────────────────────────────────────── */}
        {tab === "extern" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>

            {/* Native Share zuerst (falls verfügbar) */}
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={() => handleExternalShare({ id: "native", build: null })}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: T.teal, color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", marginBottom: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Über installierte Apps teilen
              </button>
            )}

            {/* App-Raster */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.ink3, letterSpacing: 0.4, marginBottom: 10 }}>
              DIREKT TEILEN
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
              marginBottom: 16,
            }}>
              {SOCIAL_APPS.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleExternalShare(app)}
                  style={{
                    background: app.bg, border: `1px solid ${app.color}20`,
                    borderRadius: 14, padding: "14px 8px",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 6,
                    transition: "transform 0.12s, box-shadow 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = `0 4px 16px ${app.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ color: app.color }}>
                    {app.special === "copy" && copiedLink
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg>
                      : app.icon
                    }
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: app.special === "copy" && copiedLink ? "#22C55E" : T.ink2,
                    textAlign: "center", lineHeight: 1.2,
                  }}>
                    {app.special === "copy" && copiedLink ? "Kopiert!" : app.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Link-Vorschau */}
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: T.bg, border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: 0.4, marginBottom: 4 }}>
                ÖFFENTLICHER LINK
              </div>
              <div style={{
                fontSize: 12, color: T.teal,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {publicUrl}
              </div>
            </div>
          </div>
        )}

        {/* ── Safe-Area Spacer ──────────────────────────────────── */}
        <div style={{ height: "env(safe-area-inset-bottom, 0px)", background: T.card }} />
      </div>
    </div>,
    document.body
  );
}

// Hook für einfaches Öffnen aus beliebiger Komponente:
export function useHuiShare() {
  const [shareItem, setShareItem] = useState(null);
  const open  = useCallback((item) => setShareItem(item), []);
  const close = useCallback(() => setShareItem(null), []);
  return { shareItem, openShare: open, closeShare: close };
}

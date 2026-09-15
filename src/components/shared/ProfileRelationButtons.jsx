// src/components/shared/ProfileRelationButtons.jsx
// OPEN-CHAT-001 (2026-09-15, Michael-Spec "Open Chat für alle Nutzer —
// Connect Feature"): Der "Verbinden"-Button ist WIEDER DA — Chat ist ab
// jetzt für alle Nutzer geöffnet (per Michael-Entscheid; die CHAT-LOGIK-v2-
// Entfernung vom 22.08. wird damit reaktiviert). Der Button läuft über den
// SSOT-Helper connectAndOpenChat() (chatContext.js): find-or-create (nie
// doppelte Chats, bestehende Transaction-Chats werden wiederverwendet) und
// öffnet den Chat über den globalen Home-Hook. Transaction-Chats (auto-open
// nach Bezahlung) bleiben unverändert.
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { invalidateOrbStageCache } from "../../hooks/useOrbGrowthStage.js";
import { useAppState, useFollowStatus } from "../../lib/AppStateContext.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { connectAndOpenChat } from "../../lib/chatContext.js";
import { toast } from "../../lib/useToast.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

// PUNKT2-FOLLOW-SYNC (2026-09-08, Michael, Karen-Bug): Dieser Button hatte einen
// EIGENEN lokalen isFollowing-State — Unfollow hier erreichte den globalen
// SSOT (AppStateContext.followedIds) nie → der Discover-"✓ Folge ich"-Badge
// zeigte den Folgestatus stale weiter. Fix: isFollowing kommt jetzt aus dem
// globalen SSOT (useFollowStatus), toggle() laeuft durch ctx.toggleFollow
// (DB-Op + Rollback + hui:follow:changed-Event dort zentral). Der Mount-Effekt
// gleicht den SSOT per Direkt-Query einmalig ab (reconcileFollow) — deckt auch
//Quer-aenderungen ab (z.B. Follow von einem anderen Geraet in derselben Session).

const T = {
  tealDeep: "#0AA89B",
  bgCard:   "#fff",
  inkSoft:  "#55556B",
  border:   "rgba(26,26,46,0.08)",
  r99:      99,
  px:       20,
};

export default function ProfileRelationButtons({
  profileId    = "",
  currentUserId = "",
  profile       = {},
  onFollowChange,
  onClose, // eslint-disable-line no-unused-vars -- Signatur bewusst beibehalten (Aufrufer übergeben ihn weiterhin)
}) {
  const [followLoading, setFollowLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [connectLoading, setConnectLoading] = useState(false);
  // PUNKT2-FOLLOW-SYNC: isFollowing aus globalem SSOT statt lokalem State
  const { isFollowing, toggle } = useFollowStatus(profileId);
  const { reconcileFollow } = useAppState();

  const displayName = profile?.display_name || profile?.full_name || profile?.username || "diese Person";
  const shortName   = displayName.split(" ")[0] || displayName;

  // Einmaliger Abgleich des globalen SSOT gegen die DB (kreuzt Geraete-/Session-
  // Differenzen aus; idempotent — kein Dublikat moeglich).
  useEffect(() => {
    if (!profileId || !currentUserId || profileId === currentUserId) return;
    supabase.from("follows").select("follower_id")
      .eq("follower_id", currentUserId).eq("followed_id", profileId)
      .maybeSingle().then(({ data, error }) => {
        if (error) { console.warn("[Follow] check error:", error.message); return; }
        reconcileFollow(profileId, !!data);
      }).catch(() => {});
  }, [profileId, currentUserId, reconcileFollow]);

  if (!currentUserId || profileId === currentUserId) return null;

  // OPEN-CHAT-001: Verbinden → 1:1-Chat finden/erstellen (SSOT-Helper,
  // dedupliziert; bestehende Transaction-Chats werden wiederverwendet)
  // und öffnen. Self-Chat ist ausgeschlossen (canUserChat-Guard im Helper).
  const handleConnect = async (e) => {
    e?.stopPropagation();
    if (connectLoading) return;
    setConnectLoading(true);
    try {
      const res = await connectAndOpenChat({
        currentUserId: user?.id || currentUserId,
        targetUser: {
          id: profileId,
          name: displayName,
          avatar_url: profile?.avatar_url || null,
        },
      });
      if (!res?.ok) {
        toast.error(t("chat.connectError"), { duration: 3000 });
      }
    } catch (err) {
      console.warn("[Connect] exception:", err);
      toast.error(t("chat.connectError"), { duration: 3000 });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleFollow = async (e) => {
    e?.stopPropagation();
    if (followLoading) return;
    setFollowLoading(true);
    const prevFollowing = isFollowing;
    try {
      // Optimistischer Follower-Count fuer die aufrufende Profilseite
      onFollowChange?.(prevFollowing ? -1 : +1);
      // DB-Op + globaler SSOT (inkl. Rollback + Event) macht ctx.toggleFollow
      const ok = await toggle();
      if (!ok) {
        // DB-Fehler → ctx hat den SSOT zurueckgerollt, hier nur den Count zurueckrollen
        onFollowChange?.(prevFollowing ? +1 : -1);
      } else {
        // FIX (2026-08-13): Follow zaehlt in rpc_get_orb_growth_stage als
        // Aktivitaet des Followers (currentUserId) -> Cache invalidieren,
        // sonst haengt der Orb bis zu 5 Min. auf altem Wert.
        invalidateOrbStageCache(currentUserId);
      }
    } catch(e) {
      console.warn("[Follow] exception:", e);
      onFollowChange?.(prevFollowing ? +1 : -1);
    }
    finally { setFollowLoading(false); }
  };

  const btnBase = {
    flex:1, height:36, borderRadius:T.r99,
    fontWeight:600, fontSize:12, cursor:"pointer",
    touchAction:"manipulation", fontFamily:"inherit",
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    transition:"all .18s ease", whiteSpace:"nowrap", overflow:"hidden",
    paddingLeft:10, paddingRight:12, border:"none",
  };

  return (
    <div style={{ display:"flex", flexDirection:"row", gap:8, padding:`0 ${T.px}px`, marginBottom:4 }}>
      {/* Verbinden — OPEN-CHAT-001 (2026-09-15): Chat mit diesem Nutzer */}
      <button onClick={handleConnect} disabled={connectLoading} className="ppp-press" aria-label={t("chat.connectButton")} style={{
        ...btnBase,
        background: connectLoading ? "rgba(13,196,181,0.35)" : T.tealDeep,
        border: "none",
        color: "#fff",
        opacity: connectLoading ? 0.7 : 1,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>{t("chat.connectButton")}</span>
      </button>

      {/* Folgen */}
      <button onClick={handleFollow} disabled={followLoading} className="ppp-press" style={{
        ...btnBase,
        background: isFollowing ? T.bgCard : "transparent",
        border: `1.5px solid ${isFollowing ? T.border : T.tealDeep}`,
        color: isFollowing ? T.inkSoft : T.tealDeep,
        opacity: followLoading ? 0.6 : 1,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
          {isFollowing
            ? <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
            : <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>
          }
        </svg>
        <span>{isFollowing ? "Gefolgt" : `${shortName} folgen`}</span>
      </button>
    </div>
  );
}

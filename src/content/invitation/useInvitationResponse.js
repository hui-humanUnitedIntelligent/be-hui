// src/content/invitation/useInvitationResponse.js
// ═══════════════════════════════════════════════════════════════
// HUI — Hook für echte Invitation-Responses
// Schreibt / liest invitation_responses in Supabase
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth }  from "../../lib/AuthContext.jsx";

/**
 * useInvitationResponse(invitationId)
 *
 * Returns:
 *   myResponse:    "coming" | "interested" | "maybe" | null
 *   counts:        { coming: N, interested: N, maybe: N }
 *   respond(type): async — schreibt / updated Response
 *   withdraw():    async — löscht eigene Response
 *   loading:       bool
 */
export function useInvitationResponse(invitationId) {
  const { user } = useAuth();
  const [myResponse,  setMyResponse]  = useState(null);
  const [counts,      setCounts]      = useState({ coming: 0, interested: 0, maybe: 0 });
  const [loading,     setLoading]     = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ── Laden ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!invitationId) return;
    setLoading(true);
    try {
      // Alle Responses für diese Invitation
      const { data, error } = await supabase
        .from("invitation_responses")
        .select("user_id, response")
        .eq("invitation_id", invitationId);

      if (error) throw error;
      if (!data) return;

      // Counts
      const c = { coming: 0, interested: 0, maybe: 0 };
      let mine = null;
      data.forEach(r => {
        if (c[r.response] !== undefined) c[r.response]++;
        if (user?.id && r.user_id === user.id) mine = r.response;
      });
      setCounts(c);
      setMyResponse(mine);
    } catch (err) {
      console.warn("[useInvitationResponse] load error:", err?.message);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [invitationId, user?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Reagieren ──────────────────────────────────────────────
  const respond = useCallback(async (type) => {
    if (!user?.id || !invitationId) return;
    if (!["coming", "interested", "maybe"].includes(type)) return;

    // Optimistic Update
    const prev = myResponse;
    setMyResponse(type);
    setCounts(c => {
      const next = { ...c };
      if (prev && next[prev] > 0) next[prev]--;
      next[type] = (next[type] || 0) + 1;
      return next;
    });

    try {
      // Upsert (UNIQUE constraint: invitation_id + user_id)
      const { error } = await supabase
        .from("invitation_responses")
        .upsert(
          { invitation_id: invitationId, user_id: user.id, response: type },
          { onConflict: "invitation_id,user_id" }
        );
      if (error) throw error;
    } catch (err) {
      // Rollback
      console.error("[useInvitationResponse] respond error:", err?.message);
      setMyResponse(prev);
      setCounts(c => {
        const next = { ...c };
        next[type] = Math.max(0, (next[type] || 1) - 1);
        if (prev) next[prev] = (next[prev] || 0) + 1;
        return next;
      });
    }
  }, [user?.id, invitationId, myResponse]);

  // ── Zurückziehen ───────────────────────────────────────────
  const withdraw = useCallback(async () => {
    if (!user?.id || !invitationId || !myResponse) return;

    const prev = myResponse;
    setMyResponse(null);
    setCounts(c => {
      const next = { ...c };
      if (prev && next[prev] > 0) next[prev]--;
      return next;
    });

    try {
      const { error } = await supabase
        .from("invitation_responses")
        .delete()
        .eq("invitation_id", invitationId)
        .eq("user_id", user.id);
      if (error) throw error;
    } catch (err) {
      console.error("[useInvitationResponse] withdraw error:", err?.message);
      setMyResponse(prev);
      setCounts(c => ({ ...c, [prev]: (c[prev] || 0) + 1 }));
    }
  }, [user?.id, invitationId, myResponse]);

  return { myResponse, counts, respond, withdraw, loading, initialized };
}

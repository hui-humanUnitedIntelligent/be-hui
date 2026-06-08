import React, { useMemo, createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { clearMemoryStore } from "./intelligence/persistence/interactionMemoryStore.js";
import { FIELDS, PROFILE_FIELDS } from "./perfUtils";

const AuthContext = createContext(null);

// ─── Helper: Promise mit Timeout ─────────────────────────────────────
async function withTimeout(promise, ms = 4000) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve({ data: null, error: { message:"timeout", code:"TIMEOUT" } }), ms);
  });
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timer); }
}

// ─── AuthProvider ──────────────────────────────────────────────────────
// Bootstrap-Reihenfolge:
//   1. onAuthStateChange wird registriert (feuert INITIAL_SESSION sofort wenn
//      Session in localStorage vorhanden — Supabase Garantie)
//   2. getSession() als Sicherheitsnetz: falls INITIAL_SESSION nach 400ms
//      noch nicht gefeuert hat (Safari PWA Edge Case), wird Session manuell geladen
//   3. loadingAuth bleibt true bis einer der beiden Wege settled hat
//   4. ProtectedRoute wartet auf loadingAuth=false bevor redirect
export function AuthProvider({ children }) {
  console.log("[AUTH] PROVIDER_MOUNT");
  const [user,            setUser]            = useState(null);
  const [wirkerProfile,   setWirkerProfile]   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth,     setLoadingAuth]     = useState(true);
  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [authChecked,     setAuthChecked]     = useState(false);

  // Profile startet immer null — echte Daten kommen ausschließlich aus der DB.
  // Kein Ghost-Profil aus localStorage — verhindert UI-Flip und falschen isTalent-State.
  const [profile, setProfile] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  // Hilfsfunktion: verhindert State-Update nach Unmount
  const setBlockedState = useCallback((val) => setIsBlocked(val), []);

  const profileLoadingRef = useRef(false);
  const authSettledRef    = useRef(false);  // verhindert doppelten Bootstrap

  // ── Profile laden ──────────────────────────────────────────────────
  const loadProfile = useCallback(async (userId) => {
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;
    setLoadingProfile(true);
    try {
      const { data: prof, error } = await withTimeout(
        supabase.from("profiles").select(PROFILE_FIELDS).eq("id", userId).single(), 8000
      );

      if (!prof && error?.code === "PGRST116") {
        // Profil existiert noch nicht → anlegen
        const { data: newProf } = await withTimeout(
          supabase.from("profiles").upsert({
            id: userId, display_name: "", role: "basis_user",
            is_wirker: false, has_talent_profile: false, profile_modules: {},
          }).select().single(), 6000
        );
        if (newProf) setProfile(newProf);
        return;
      }

      if (prof) {
        // ── BLOCK-CHECK: blockierter Nutzer → sofort ausloggen ──────
        if (prof.blocked === true) {
          console.warn("[HUI Auth] Nutzer blockiert — Logout erzwungen");
          setBlockedState(true);
          await supabase.auth.signOut();
          setProfile(null);
          setLoadingProfile(false);
          profileLoadingRef.current = false;
          return;
        }
        setBlockedState(false);
        setProfile(prof);
        if (prof.has_talent_profile) localStorage.setItem("hui_talent", "1");
        if (prof.is_member) localStorage.setItem("hui_is_member", "1");
        if (prof.membership_type) localStorage.setItem("hui_membership_type", prof.membership_type);
        if (prof.is_wirker) {
          const { data: wp } = await withTimeout(
            supabase.from("wirker_profiles").select(FIELDS.wirker).eq("user_id", userId).single(), 6000
          );
          setWirkerProfile(wp || null);
        }
      }
    } catch (e) {
      console.warn("[HUI] loadProfile:", e.message);
    } finally {
      setLoadingProfile(false);
      profileLoadingRef.current = false;
    }
  }, []);

  // ── Auth-State setzen (zentralisiert, idempotent) ─────────────────
  const applySession = useCallback((session) => {
    console.log("[AUTH] APPLY_SESSION", !!session, session?.user?.id || null);
    const u = session?.user ?? null;
    setUser(u);
    setIsAuthenticated(!!u);
    setLoadingAuth(false);
    setAuthChecked(true);
    authSettledRef.current = true;
    return u;
  }, []);

  // Session-Refresh: stellt sicher dass Supabase-Client einen gültigen
  // Access-Token hat bevor Chat-Queries laufen.
  // Läuft einmalig nach authChecked=true, wenn eine Session vorliegt.
  const sessionRefreshedRef = useRef(false);
  useEffect(() => {
    if (!authSettledRef.current) return;
    if (sessionRefreshedRef.current) return;
    sessionRefreshedRef.current = true;
    (async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          4000
        );
        if (!session?.access_token) {
          // Kein gültiger Token → refresh versuchen
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed?.session?.user) {
            applySession(refreshed.session);
          }
        }
      } catch (e) { /* silent — kein crash */ }
    })();
  }, [authSettledRef.current, applySession]); // eslint-disable-line

  // ── Haupt-Auth-Bootstrap ──────────────────────────────────────────
  useEffect(() => {
    // ── A) onAuthStateChange — primärer Weg ──────────────────────────
    // Supabase feuert INITIAL_SESSION synchron (wenn Session im localStorage)
    // oder kurz async (bei Token-Refresh). Wir verlassen uns darauf als
    // primäre Quelle.
    console.log("[AUTH] REGISTER_LISTENER");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // AUFGABE 1: erweitertes Event-Logging
      console.log("[AUTH_EVENT]", event, {
        hasSession: !!session,
        userId: session?.user?.id || null,
        expires_at: session?.expires_at || null,
        now: Math.floor(Date.now() / 1000),
      });
      if (!session) {
        console.warn("[AUTH_NULL_SESSION]", event);
      }

      // AUFGABE 3: TOKEN_REFRESH_FAILED — erst Retry, dann Logout
      if (event === "TOKEN_REFRESH_FAILED") {
        console.warn("[AUTH_REFRESH_FAILED]");
        try {
          const { data } = await supabase.auth.refreshSession();
          if (data?.session) {
            console.log("[AUTH_REFRESH_RECOVERED]");
            console.log("[AUTH_APPLY]", { event, hasSession: true, userId: data.session?.user?.id || null });
            applySession(data.session);
            return;
          }
        } catch (err) {
          console.error("[AUTH_REFRESH_RECOVERY_FAILED]", err);
        }
        console.warn("[AUTH_FORCE_LOGOUT]");
        console.warn("[AUTH_LOGOUT_REASON]", event);
        applySession(null);
        return;
      }

      // AUFGABE 5: Logout-Grund sichtbar machen
      if (!session) {
        console.warn("[AUTH_LOGOUT_REASON]", event);
      }

      // AUFGABE 1: Log vor applySession
      console.log("[AUTH_APPLY]", {
        event,
        hasSession: !!session,
        userId: session?.user?.id || null,
      });
      if (!session) {
        console.warn("[AUTH_APPLY_NULL]", event);
      }

      const u = applySession(session);

      // AUFGABE 4: TOKEN_REFRESHED aus Profil-Reload entfernt
      if (u && ["SIGNED_IN","USER_UPDATED","INITIAL_SESSION"].includes(event)) {
        if (!profileLoadingRef.current) loadProfile(u.id);
      }
      if (!u) {
        setProfile(null);
        setWirkerProfile(null);
        localStorage.removeItem("hui_is_wirker");
        profileLoadingRef.current = false;
      }
    });

    // ── B) getSession() Sicherheitsnetz ──────────────────────────────
    // In Safari iOS PWA kann INITIAL_SESSION verzögert feuern.
    // Wir rufen getSession() parallel auf — wer zuerst fertig ist, gewinnt.
    // authSettledRef verhindert doppeltes Setzen.
    const sessionFallback = async () => {
      // Kurzes Warten: onAuthStateChange hat Vorrang
      await new Promise(r => setTimeout(r, 800));
      if (authSettledRef.current) return;  // onAuthStateChange war schneller

      // getSession Sicherheitsnetz aktiv
      console.log("[AUTH_GET_SESSION_START]");
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          4000
        );
        console.log("[AUTH_GET_SESSION_DONE]", {
          hasSession: !!session,
          userId: session?.user?.id || null,
        });
        if (authSettledRef.current) return;  // onAuthStateChange hat zwischenzeitlich gefeuert
        console.log("[AUTH_APPLY]", { event: "sessionFallback", hasSession: !!session, userId: session?.user?.id || null });
        if (!session) console.warn("[AUTH_APPLY_NULL]", "sessionFallback");
        const u = applySession(session);
        if (u && !profileLoadingRef.current) loadProfile(u.id);
      } catch (e) {
        console.error("[AUTH_GET_SESSION_ERROR]", e);
        if (!authSettledRef.current) {
          console.warn("[AUTH_LOGOUT_REASON]", "sessionFallback_error");
          applySession(null);
        }
      }
    };
    sessionFallback();

    // ── C) Absoluter Fallback nach 5s (offline/netzwerkfehler) ───────
    const absoluteFallback = setTimeout(() => {
      if (!authSettledRef.current) {
        console.warn("[AUTH] ABSOLUTE_FALLBACK");
        console.warn("[AUTH_LOGOUT_REASON]", "absoluteFallback");
        console.warn("[HUI Auth] Absoluter Fallback nach 5s — kein Auth-Event");
        applySession(null);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(absoluteFallback);
    };
  }, [loadProfile, applySession]);

  // ── Realtime: blocked/deleted Listener ───────────────────────────
  // Wenn Admin profile.blocked setzt → Nutzer sofort ausloggen
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-block-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          const updated = payload.new;
          if (updated?.blocked === true) {
            console.warn("[HUI Auth] Realtime: Nutzer blockiert → Logout");
            setBlockedState(true);
            await supabase.auth.signOut();
            setProfile(null);
          } else if (updated?.blocked === false) {
            setBlockedState(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async () => {
          console.warn("[HUI Auth] Realtime: Profil gelöscht → Logout");
          await supabase.auth.signOut();
          setProfile(null);
          setBlockedState(false);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, setBlockedState]);

  // ── Shim für alte ProtectedRoute (components/) ───────────────────
  const checkUserAuth = useCallback(() => {}, []);

  // ── Actions ──────────────────────────────────────────────────────
  const signUp = useCallback(async (email, password, fullName) => {
    return supabase.auth.signUp({ email, password, options:{ data:{ full_name: fullName } } });
  }, []);

  const signIn = useCallback(async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    authSettledRef.current = false;  // Reset für sauberen logout
    await supabase.auth.signOut();
    // State wird von onAuthStateChange automatisch gecleared
  }, []);

  const saveProfile = useCallback(async (updates) => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { data, error } = await withTimeout(
      supabase.from("profiles")
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
        .select().single()
    );
    if (data) setProfile(data);
    return { data, error };
  }, [user]);

  const becomeWirker = useCallback(async (wirkerData) => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { error: e1 } = await supabase.from("profiles")
      .update({ is_wirker:true, role:"wirker", updated_at:new Date().toISOString() })
      .eq("id", user.id);
    if (e1) return { error: e1.message };
    const slug = (wirkerData.name || user.email.split("@")[0])
      .toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")
      + "-" + Math.random().toString(36).slice(2,6);
    const { data: wp, error: e2 } = await supabase.from("wirker_profiles")
      .upsert({ user_id:user.id, slug, talent:wirkerData.talent||"Kreativ",
        wirker_type:wirkerData.type||"selbst", location_label:wirkerData.city||"",
        categories:wirkerData.categories||[] }).select().single();
    if (e2) return { error: e2.message };
    setWirkerProfile(wp);
    setProfile(p => ({ ...p, is_wirker:true, role:"wirker" }));
    localStorage.setItem("hui_is_wirker","true");
    return { data: wp };
  }, [user]);

  const saveWirkerProfile = useCallback(async (updates) => {
    if (!user || !wirkerProfile) return { error: "Kein Wirkerprofil" };
    const { data, error } = await supabase.from("wirker_profiles")
      .update({ ...updates, updated_at:new Date().toISOString() })
      .eq("user_id", user.id).select().single();
    if (data) setWirkerProfile(data);
    return { data, error };
  }, [user, wirkerProfile]);

  // Phase 4C: activateTalent — atomarer DB-Aufruf via Supabase RPC
  // Setzt membership_type='talent', membership_active=true, talent_activated_at=NOW()
  // Alles in einer Transaktion via activate_talent() SQL-Funktion
  const activateTalentProfile = useCallback(async (focusType = "hybrid") => {
    if (!user) return { error: "Nicht eingeloggt" };

    // 1. Versuche RPC-Funktion (atomarer Weg)
    const { data: rpcData, error: rpcErr } = await withTimeout(
      supabase.rpc("activate_talent", { p_user_id: user.id })
    );

    if (!rpcErr && rpcData) {
      // RPC erfolgreich — Profile direkt aus Response setzen
      const updatedProfile = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (updatedProfile) {
        setProfile(updatedProfile);
        localStorage.setItem("hui_talent", "1");
        localStorage.setItem("hui_membership_type", "talent");
        localStorage.setItem("hui_is_member", "1");
        return { data: updatedProfile };
      }
    }

    // 2. Fallback: direktes UPDATE (falls RPC nicht verfügbar)
    const { data, error } = await withTimeout(
      supabase.from("profiles")
        .update({
          membership_type:     "talent",
          membership_active:   true,
          talent_activated_at: new Date().toISOString(),
          has_talent_profile:  true,
          focus_type:          focusType,
          is_member:           true,
          role:                "talent",
          updated_at:          new Date().toISOString(),
        })
        .eq("id", user.id).select().single()
    );
    if (data) {
      setProfile(data);
      localStorage.setItem("hui_talent", "1");
      localStorage.setItem("hui_membership_type", "talent");
      localStorage.setItem("hui_is_member", "1");
    }
    return { data, error };
  }, [user]);


  // ── OAuth & Magic Link — stabile noopAsync Architektur ────────────
  //
  // ARCHITEKTUR-REGEL:
  // Jede Auth-Methode ist VOR dem Provider-Value vollständig definiert.
  // noopAsync als Fallback: verhindert undefined-Referenzen im Context-Value.
  // Kein Auth-Fehler darf jemals die gesamte Seite crashen.
  //
  // noopAsync: gibt immer { data: null, error } zurück — nie undefined.
  // Verhindert: ReferenceError: Can't find variable: signInWithGoogle
  //             (tritt auf wenn Funktion nicht definiert ist beim Provider-Value)

  const noopAsync = async (methodName) => ({
    data: null,
    error: new Error('[HUI Auth] ' + methodName + ' nicht verfügbar')
  });

  const signInWithGoogle = useCallback(async () => {
    // Defensive: verhindert undefined bei Safari ESModule-Evaluation
    if (typeof supabase?.auth?.signInWithOAuth !== 'function') {
      return noopAsync('signInWithGoogle');
    }
    try {
      return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback' },
      });
    } catch (err) {
      console.warn('[HUI Auth] Google OAuth Fehler:', err?.message);
      return { data: null, error: err };
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    if (typeof supabase?.auth?.signInWithOAuth !== 'function') {
      return noopAsync('signInWithApple');
    }
    try {
      return await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: window.location.origin + '/auth/callback' },
      });
    } catch (err) {
      console.warn('[HUI Auth] Apple OAuth Fehler:', err?.message);
      return { data: null, error: err };
    }
  }, []);

  const signInWithMagicLink = useCallback(async (email) => {
    if (typeof supabase?.auth?.signInWithOtp !== 'function') {
      return noopAsync('signInWithMagicLink');
    }
    try {
      return await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + '/auth/callback' },
      });
    } catch (err) {
      console.warn('[HUI Auth] Magic Link Fehler:', err?.message);
      return { data: null, error: err };
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (typeof supabase?.auth?.resetPasswordForEmail !== 'function') {
      return noopAsync('resetPassword');
    }
    try {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/callback',
      });
    } catch (err) {
      console.warn('[HUI Auth] Password Reset Fehler:', err?.message);
      return { data: null, error: err };
    }
  }, []);

  // Stable noop für alle weiteren Auth-Methoden die noch nicht implementiert
  // werden könnten — verhindert undefined in Provider Value
  const signInWithPhone  = useCallback(() => noopAsync('signInWithPhone'), []);
  const signInWithGitHub = useCallback(() => noopAsync('signInWithGitHub'), []);


  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    profileLoadingRef.current = false;  // Force-reload erlauben
    await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  // Phase 4C: activateMembership — erweitert um membership_active + talent_activated_at
  const activateMembership = useCallback(async () => {
    if (!user?.id) return { error: "Nicht eingeloggt" };
    try {
      // 1. Versuche RPC activate_talent (atomare SQL-Funktion)
      const { data: rpcData, error: rpcErr } = await withTimeout(
        supabase.rpc("activate_talent", { p_user_id: user.id })
      );
      if (!rpcErr && rpcData) {
        const p = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (p) {
          setProfile(p);
          localStorage.setItem("hui_membership_type", "talent");
          localStorage.setItem("hui_is_member", "1");
          localStorage.setItem("hui_talent", "1");
          await supabase.auth.refreshSession().catch(() => {});
          return { data: p };
        }
      }
      // 2. Fallback: direktes UPDATE mit allen Phase-4C-Feldern
      const now = new Date().toISOString();
      const { data, error } = await withTimeout(
        supabase.from("profiles")
          .update({
            is_member:           true,
            is_talent:           true,        // persistentes Boolean-Feld
            membership_type:     "talent",   // Phase 4C: 'talent' statt 'member'
            membership_active:   true,       // Phase 4C: aktiv-Flag
            talent_activated_at: now,        // Phase 4C: Zeitstempel
            talent_since:        now,        // persistentes Datum-Feld
            role:                "talent",
            has_talent_profile:  true,
            member_since:        now,
            updated_at:          now,
          })
          .eq("id", user.id)
          .select()
          .single()
      );
      if (error) throw error;
      if (data) {
        setProfile(data);
        localStorage.setItem("hui_membership_type", "talent");
        localStorage.setItem("hui_is_member", "1");
        localStorage.setItem("hui_talent", "1");
        await supabase.auth.refreshSession().catch(() => {});
      }
      return { data };
    } catch (err) {
      console.warn("[HUI Auth] activateMembership:", err.message);
      return { error: err.message };
    }
  }, [user?.id]);

    const isWirker         = profile?.has_talent_profile || profile?.is_wirker || false;
  const hasTalentProfile = profile?.has_talent_profile || false;
  // Single source of truth: membership_type + is_member (both updated together)
  const membershipType   = profile?.membership_type || "free";
  const isMember         = profile?.is_member === true || membershipType === "member" ||
                           membershipType === "creator" || membershipType === "guide" || false;
  const profileModules   = profile?.profile_modules || {};

  // ── Phase 4C: Membership derived states (pre-memo, vor ctxValue berechnet) ────
  // Single source of truth — diese States werden VOR useMemo berechnet
  // damit sie im Memo-Value als echte Werte (nicht Getter) referenziert werden
  const _isTalentCalc = (() => {
    if (!profile) return false;
    // Primär: dediziertes Boolean-Feld (persistenteste Quelle)
    if (profile.is_talent === true) return true;
    // Sekundär: membership_type + membership_active (Phase 4C)
    if (profile.membership_type === "talent" && profile.membership_active === true) return true;
    if (profile.membership_type === "guardian" || profile.membership_type === "team") return true;
    return false;
  })();
  const _isBaseUserCalc = !_isTalentCalc;
  const _canCreateCalc  = _isTalentCalc;

  // ── Debug Log (development only) ─────────────────────────────────────
  if (process.env.NODE_ENV !== "production" && profile) {
    console.log("[MEMBERSHIP]", {
      membership_type:   profile?.membership_type,
      membership_active: profile?.membership_active,
      isTalent:          _isTalentCalc,
      canCreate:         _canCreateCalc,
    });
  }

  // useMemo: verhindert unnötige Re-renders aller Consumer
  // wenn sich unrelevante Parent-States ändern
  const ctxValue = useMemo(() => ({
    user, profile,
    authProfile: profile,          // Alias: HomeShell + alle Components nutzen authProfile
    isBlocked,
    wirkerProfile,
    isAuthenticated, isWirker, hasTalentProfile, isMember, membershipType, profileModules,
    loadingAuth,
    isLoadingAuth: loadingAuth,    // Alias für components/ProtectedRoute.jsx
    loadingProfile,
    authChecked,
    authError: null,
    checkUserAuth,
    // Phase 4C — Membership derived states (echte Werte, kein Getter-Bug)
    isTalent:   _isTalentCalc,
    isBaseUser: _isBaseUserCalc,
    canCreate:  _canCreateCalc,
    // Membership Felder direkt aus profile für einfachen Zugriff
    // membershipType ist bereits oben als Variable deklariert und eingebunden
    membershipActive:      profile?.membership_active ?? false,
    talentActivatedAt:     profile?.talent_activated_at ?? null,
    signUp, signIn, signOut, signInWithGoogle, signInWithApple, signInWithMagicLink, resetPassword,
    loadProfile, saveProfile, refreshProfile, becomeWirker,
    activateMembership,
    saveWirkerProfile, activateTalentProfile,
    setProfile, setWirkerProfile,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, profile, wirkerProfile, isAuthenticated, loadingAuth, loadingProfile, authChecked, _isTalentCalc, isBlocked]); // _isTalentCalc derived from profile

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  // Kein throw — gibt null zurück wenn kein Provider vorhanden
  // Komponenten müssen selbst null-guarden
  return ctx ?? null;
};
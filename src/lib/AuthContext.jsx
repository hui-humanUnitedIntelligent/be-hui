import React, { useMemo, createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { ProfileService } from '../services/db';
import { supabase } from "./supabaseClient";
import { isProfileTalent } from './profileUtils.js';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth,     setLoadingAuth]     = useState(true);
  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [authChecked,     setAuthChecked]     = useState(false);

  // Profile startet immer null — echte Daten kommen ausschließlich aus der DB.
  // Kein Ghost-Profil aus localStorage — verhindert UI-Flip und falschen isTalent-State.
  const [profile, setProfile] = useState(null);

  const profileLoadingRef = useRef(false);
  const authSettledRef    = useRef(false);  // verhindert doppelten Bootstrap

  // ── Profile laden ──────────────────────────────────────────────────
  const loadProfile = useCallback(async (userId) => {
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;
    setLoadingProfile(true);
    try {
      // ProfileService v1.0: getById statt direktem Supabase-Zugriff
      const { data: prof, error } = await withTimeout(
        ProfileService.getById(userId), 8000
      );

      if (!prof && error?.code === "PGRST116") {
        // Profil existiert noch nicht → anlegen
        const { data: newProf } = await withTimeout(
          supabase.from("profiles").upsert({
            id: userId,
            display_name: null,
            username: null,
            is_talent: false,
            is_ambassador: false,
          }).select().single(), 6000
        );
        if (newProf) setProfile(newProf);
        return;
      }

      if (prof) {
        setProfile(prof);
        // is_talent wird direkt aus prof geladen — kein localStorage nötig
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
        // is_wirker update entfernt — is_talent ist die korrekte Spalte
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
    return { data: wp };
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
  // ─── Der Gemeinschaft beitreten: setzt is_talent=true + talent_since ──
  const activateMembership = useCallback(async () => {
    if (!user?.id) return { error: "Nicht eingeloggt" };
    try {
      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from("profiles")
        .update({ is_talent: true, talent_since: now })
        .eq("id", user.id)
        .select("id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views") // Identity Contract v1.0
        .single();
      if (error) return { error: error.message };
      setProfile(updated);
      return { data: updated };
    } catch (e) {
      return { error: e.message };
    }
  }, [user?.id]);

  const isWirker         = profile?.is_talent === true; // is_talent ist die korrekte Spalte
  const hasTalentProfile = profile?.is_talent === true; // has_talent_profile nicht mehr
  const membershipType   = "free"; // membership_type nicht in DB
  const isMember         = profile?.is_member === true || membershipType === "member" ||
                           membershipType === "creator" || membershipType === "guide" || false;
  const profileModules   = profile?.profile_modules || {};

  // ── Phase 4C / Sprint F.4C: Membership derived states ───────────────────────
  // EINZIGE Wahrheitsquelle: isProfileTalent() aus src/lib/profileUtils.js
  // Entfernt: profile?.is_talent === true (direkte Prüfung), localStorage.hui_talent,
  //           is_member, membership_type==="member", role==="creator"
  const _isTalentCalc   = isProfileTalent(profile);
  const _isBaseUserCalc = !_isTalentCalc;
  const _canCreateCalc  = _isTalentCalc;

  // ── Debug Log (development only) ─────────────────────────────────────
  if (process.env.NODE_ENV !== "production" && profile) {
    console.log("[MEMBERSHIP]", {
    membership_type:   "free", // nicht in profiles-Tabelle
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
    setProfile,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, profile, isAuthenticated, loadingAuth, loadingProfile, authChecked, _isTalentCalc]); // _isTalentCalc derived from profile

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
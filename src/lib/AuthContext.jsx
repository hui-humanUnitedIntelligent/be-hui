import React, { useMemo, createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { FIELDS, PROFILE_FIELDS } from "./perfUtils";

const AuthContext = createContext(null);

// ─── Helper: Promise mit Timeout ─────────────────────────────────────
async function withTimeout(promise, ms = 8000) {
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
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [wirkerProfile,   setWirkerProfile]   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth,     setLoadingAuth]     = useState(true);
  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [authChecked,     setAuthChecked]     = useState(false);

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
            id: userId, display_name: "", role: "basisuser",
            is_wirker: false, has_talent_profile: false, profile_modules: {},
          }).select().single(), 6000
        );
        if (newProf) setProfile(newProf);
        return;
      }

      if (prof) {
        setProfile(prof);
        if (prof.has_talent_profile) localStorage.setItem("hui_talent", "1");
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
    const u = session?.user ?? null;
    setUser(u);
    setIsAuthenticated(!!u);
    setLoadingAuth(false);
    setAuthChecked(true);
    authSettledRef.current = true;
    return u;
  }, []);

  // ── Haupt-Auth-Bootstrap ──────────────────────────────────────────
  useEffect(() => {
    // ── A) onAuthStateChange — primärer Weg ──────────────────────────
    // Supabase feuert INITIAL_SESSION synchron (wenn Session im localStorage)
    // oder kurz async (bei Token-Refresh). Wir verlassen uns darauf als
    // primäre Quelle.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // auth event (Sentry handles errors)

      const u = applySession(session);

      if (u && ["SIGNED_IN","TOKEN_REFRESHED","USER_UPDATED","INITIAL_SESSION"].includes(event)) {
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
      await new Promise(r => setTimeout(r, 350));
      if (authSettledRef.current) return;  // onAuthStateChange war schneller

      // getSession Sicherheitsnetz aktiv
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (authSettledRef.current) return;  // onAuthStateChange hat zwischenzeitlich gefeuert
        const u = applySession(session);
        if (u && !profileLoadingRef.current) loadProfile(u.id);
      } catch (e) {
        console.warn("[HUI Auth] getSession Fehler:", e.message);
        if (!authSettledRef.current) applySession(null);
      }
    };
    sessionFallback();

    // ── C) Absoluter Fallback nach 12s (offline/netzwerkfehler) ──────
    const absoluteFallback = setTimeout(() => {
      if (!authSettledRef.current) {
        console.warn("[HUI Auth] Absoluter Fallback nach 12s — kein Auth-Event");
        applySession(null);
      }
    }, 12000);

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

  const activateTalentProfile = useCallback(async (focusType = "hybrid") => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { data, error } = await supabase.from("profiles")
      .update({ has_talent_profile:true, focus_type:focusType,
        updated_at:new Date().toISOString() })
      .eq("id", user.id).select().single();
    if (data) { setProfile(data); localStorage.setItem("hui_talent","1"); }
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

  const isWirker         = profile?.has_talent_profile || profile?.is_wirker || false;
  const hasTalentProfile = profile?.has_talent_profile || false;
  const profileModules   = profile?.profile_modules || {};

  // useMemo: verhindert unnötige Re-renders aller Consumer
  // wenn sich unrelevante Parent-States ändern
  const ctxValue = useMemo(() => ({
    user, profile, wirkerProfile,
    isAuthenticated, isWirker, hasTalentProfile, profileModules,
    loadingAuth,
    isLoadingAuth: loadingAuth,   // Alias für components/ProtectedRoute.jsx
    loadingProfile,
    authChecked,
    authError: null,
    checkUserAuth,
    signUp, signIn, signOut, signInWithGoogle, signInWithApple, signInWithMagicLink, resetPassword,
    loadProfile, saveProfile, becomeWirker,
    saveWirkerProfile, activateTalentProfile,
    setProfile, setWirkerProfile,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, profile, wirkerProfile, isAuthenticated, loadingAuth, loadingProfile, authChecked]);

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von <AuthProvider> verwendet werden");
  return ctx;
};
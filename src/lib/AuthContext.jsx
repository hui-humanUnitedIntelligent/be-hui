import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

// ── Safe query with timeout ───────────────────────────────────────────
async function withTimeout(promise, ms = 7000, fallback = null) {
  let timer;
  const race = new Promise(resolve => {
    timer = setTimeout(() => {
      console.warn(`[HUI Auth] Query timed out after ${ms}ms`);
      resolve({ data: fallback, error: { message: "timeout", code: "TIMEOUT" } });
    }, ms);
  });
  try {
    return await Promise.race([promise, race]);
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }) {
  const [user,             setUser]             = useState(null);
  const [profile,          setProfile]          = useState(null);
  const [wirkerProfile,    setWirkerProfile]    = useState(null);
  const [isAuthenticated,  setIsAuthenticated]  = useState(false);

  // All consumers use one of these two naming conventions — expose both
  const [loadingAuth,      setLoadingAuth]      = useState(true);
  const [loadingProfile,   setLoadingProfile]   = useState(false);
  const [authChecked,      setAuthChecked]      = useState(false);
  const [authError,        setAuthError]        = useState(null);

  const profileLoadingRef = useRef(false);

  // ── Global failsafe — never hang forever ─────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (loadingAuth) {
        console.warn("[HUI Auth] Failsafe triggered after 8s");
        setLoadingAuth(false);
        setAuthChecked(true);
        setAuthError("timeout");
      }
    }, 8000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // ── Load profile ─────────────────────────────────────────────────────
  const loadProfile = useCallback(async (userId) => {
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;
    setLoadingProfile(true);
    try {
      const { data: prof, error: profErr } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        7000
      );

      if (profErr && profErr.code !== "TIMEOUT") {
        // Row not found → create profile
        if (profErr.code === "PGRST116" || profErr.message?.includes("No rows")) {
          const { data: newProf } = await withTimeout(
            supabase.from("profiles").upsert({
              id: userId,
              display_name: "",
              role: "basisuser",
              is_wirker: false,
              has_talent_profile: false,
              profile_modules: {},
            }).select().single(),
            5000
          );
          if (newProf) setProfile(newProf);
        } else {
          console.warn("[HUI Auth] loadProfile:", profErr.message);
        }
        return;
      }

      if (prof) {
        setProfile(prof);
        if (prof.has_talent_profile) localStorage.setItem("hui_talent", "1");
        if (prof.is_wirker) {
          const { data: wp } = await withTimeout(
            supabase.from("wirker_profiles").select("*").eq("user_id", userId).single(),
            5000
          );
          setWirkerProfile(wp || null);
        }
      }
    } catch (e) {
      console.warn("[HUI Auth] loadProfile exception:", e.message);
    } finally {
      setLoadingProfile(false);
      profileLoadingRef.current = false;
    }
  }, []);

  // ── Auth listener ─────────────────────────────────────────────────────
  useEffect(() => {
    // Initial session check
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) console.warn("[HUI Auth] getSession:", error.message);
        const u = session?.user ?? null;
        setUser(u);
        setIsAuthenticated(!!u);
        setLoadingAuth(false);
        setAuthChecked(true);
        if (u && !profileLoadingRef.current) loadProfile(u.id);
      })
      .catch(e => {
        console.error("[HUI Auth] getSession exception:", e.message);
        setLoadingAuth(false);
        setAuthChecked(true);
        setAuthError("connection_error");
      });

    // Ongoing changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAuthenticated(!!u);
      setLoadingAuth(false);
      setAuthChecked(true);

      if (u) {
        if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
          if (!profileLoadingRef.current) loadProfile(u.id);
        }
      } else {
        setProfile(null);
        setWirkerProfile(null);
        localStorage.removeItem("hui_is_wirker");
        profileLoadingRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── checkUserAuth — required by old ProtectedRoute.jsx ───────────────
  // No-op: auth is checked automatically on mount. Exposed for API compat.
  const checkUserAuth = useCallback(() => {
    // Auth state is managed by onAuthStateChange + getSession above.
    // Components calling this can safely ignore the call.
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────
  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setWirkerProfile(null);
    setIsAuthenticated(false);
    setAuthChecked(false);
    localStorage.removeItem("hui_is_wirker");
  }, []);

  const saveProfile = useCallback(async (updates) => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { data, error } = await withTimeout(
      supabase.from("profiles")
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
        .select().single(), 6000
    );
    if (data) setProfile(data);
    return { data, error };
  }, [user]);

  const becomeWirker = useCallback(async (wirkerData) => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { error: profError } = await supabase.from("profiles")
      .update({ is_wirker: true, role: "wirker", updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (profError) return { error: profError.message };
    const slug = (wirkerData.name || user.email.split("@")[0])
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
      "-" + Math.random().toString(36).slice(2, 6);
    const { data: wp, error: wpError } = await supabase.from("wirker_profiles")
      .upsert({ user_id: user.id, slug,
        talent: wirkerData.talent || "Kreativ",
        wirker_type: wirkerData.type || "selbst",
        location_label: wirkerData.city || "",
        categories: wirkerData.categories || [] })
      .select().single();
    if (wpError) return { error: wpError.message };
    setWirkerProfile(wp);
    setProfile(p => ({ ...p, is_wirker: true, role: "wirker" }));
    localStorage.setItem("hui_is_wirker", "true");
    return { data: wp };
  }, [user]);

  const saveWirkerProfile = useCallback(async (updates) => {
    if (!user || !wirkerProfile) return { error: "Kein Wirkerprofil" };
    const { data, error } = await supabase.from("wirker_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).select().single();
    if (data) setWirkerProfile(data);
    return { data, error };
  }, [user, wirkerProfile]);

  const activateTalentProfile = useCallback(async (focusType = "hybrid") => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { data, error } = await supabase.from("profiles")
      .update({ has_talent_profile: true, focus_type: focusType,
        updated_at: new Date().toISOString() })
      .eq("id", user.id).select().single();
    if (data) { setProfile(data); localStorage.setItem("hui_talent", "1"); }
    return { data, error };
  }, [user]);

  const isWirker         = profile?.has_talent_profile || profile?.is_wirker || false;
  const hasTalentProfile = profile?.has_talent_profile || false;
  const profileModules   = profile?.profile_modules || {};

  const value = {
    // State
    user, profile, wirkerProfile,
    isAuthenticated,
    isWirker, hasTalentProfile, profileModules,
    authError,

    // Both naming conventions — full compatibility
    loadingAuth,       // used by: App.jsx, LoginPage.jsx
    isLoadingAuth: loadingAuth,  // used by: ProtectedRoute.jsx (components/)
    loadingProfile,    // used by: Home.jsx

    // authChecked — used by: ProtectedRoute.jsx
    authChecked,

    // checkUserAuth — no-op shim for ProtectedRoute.jsx
    checkUserAuth,

    // Actions
    signUp, signIn, signOut,
    loadProfile, saveProfile,
    becomeWirker, saveWirkerProfile, activateTalentProfile,
    setProfile, setWirkerProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
};

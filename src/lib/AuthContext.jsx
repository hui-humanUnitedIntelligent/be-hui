import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

// ── Safe Supabase query with timeout ──────────────────────────────────
async function withTimeout(promise, ms = 7000, fallback = null) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => {
      console.warn(`[HUI] Supabase query timed out after ${ms}ms`);
      resolve({ data: fallback, error: { message: "timeout" } });
    }, ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [wirkerProfile,   setWirkerProfile]   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth,     setLoadingAuth]     = useState(true);
  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [authError,       setAuthError]       = useState(null);

  // Prevent double-loading on simultaneous getSession + onAuthStateChange
  const profileLoadingRef = useRef(false);
  const initializedRef    = useRef(false);

  // ── Global loading failsafe — never hang forever ─────────────────────
  useEffect(() => {
    const failsafe = setTimeout(() => {
      if (loadingAuth) {
        console.warn("[HUI] Auth timeout failsafe triggered after 8s");
        setLoadingAuth(false);
        setAuthError("timeout");
      }
    }, 8000);
    return () => clearTimeout(failsafe);
  }, []); // eslint-disable-line

  // ── Load profile — with timeout + error handling ──────────────────────
  const loadProfile = useCallback(async (userId) => {
    // Prevent concurrent loads
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;
    setLoadingProfile(true);

    try {
      // Base profile — 7s timeout
      const { data: prof, error: profErr } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        7000
      );

      if (profErr && profErr.message !== "timeout") {
        // PGRST116 = row not found — create profile
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
          console.warn("[HUI] loadProfile error:", profErr.message);
        }
        return;
      }

      if (prof) {
        setProfile(prof);
        if (prof.has_talent_profile) {
          localStorage.setItem("hui_talent", "1");
        }

        // Wirker profile — only if is_wirker flag is set
        if (prof.is_wirker) {
          const { data: wp } = await withTimeout(
            supabase.from("wirker_profiles").select("*").eq("user_id", userId).single(),
            5000
          );
          setWirkerProfile(wp || null);
        }
      }
    } catch (e) {
      console.warn("[HUI] loadProfile exception:", e.message);
    } finally {
      setLoadingProfile(false);
      profileLoadingRef.current = false;
    }
  }, []);

  // ── Auth state listener ───────────────────────────────────────────────
  useEffect(() => {
    // One-time session check on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.warn("[HUI] getSession error:", error.message);

      const u = session?.user ?? null;
      setUser(u);
      setIsAuthenticated(!!u);
      setLoadingAuth(false);
      initializedRef.current = true;

      if (u && !profileLoadingRef.current) {
        loadProfile(u.id);
      }
    }).catch(e => {
      console.error("[HUI] getSession exception:", e.message);
      setLoadingAuth(false);
      initializedRef.current = true;
    });

    // Ongoing auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;

      // Always update auth state immediately — no delays
      setUser(u);
      setIsAuthenticated(!!u);
      setLoadingAuth(false);

      if (u) {
        // Load profile for meaningful events — no setTimeout (causes login race condition)
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          if (!profileLoadingRef.current) loadProfile(u.id);
        }
      } else {
        // Signed out — clear everything
        setProfile(null);
        setWirkerProfile(null);
        localStorage.removeItem("hui_is_wirker");
        profileLoadingRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Actions ───────────────────────────────────────────────────────────
  const saveProfile = useCallback(async (updates) => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { data, error } = await withTimeout(
      supabase.from("profiles")
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
        .select().single(),
      6000
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
      .toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"") +
      "-" + Math.random().toString(36).slice(2,6);

    const { data: wp, error: wpError } = await supabase.from("wirker_profiles")
      .upsert({
        user_id: user.id, slug,
        talent: wirkerData.talent || "Kreativ",
        wirker_type: wirkerData.type || "selbst",
        location_label: wirkerData.city || "",
        categories: wirkerData.categories || [],
      }).select().single();
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
    if (data) {
      setProfile(data);
      localStorage.setItem("hui_talent", "1");
    }
    return { data, error };
  }, [user]);

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
    localStorage.removeItem("hui_is_wirker");
  }, []);

  const isWirker        = profile?.has_talent_profile || profile?.is_wirker || false;
  const hasTalentProfile = profile?.has_talent_profile || false;
  const profileModules   = profile?.profile_modules   || {};

  return (
    <AuthContext.Provider value={{
      user, profile, wirkerProfile,
      isAuthenticated, isWirker, hasTalentProfile, profileModules,
      loadingAuth, loadingProfile, authError,
      signUp, signIn, signOut,
      loadProfile, saveProfile, becomeWirker,
      saveWirkerProfile, activateTalentProfile,
      setProfile, setWirkerProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
};

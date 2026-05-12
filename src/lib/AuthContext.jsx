import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [wirkerProfile,  setWirkerProfile]  = useState(null);
  const [isAuthenticated,setIsAuthenticated]= useState(false);
  const [loadingAuth,    setLoadingAuth]    = useState(true);   // initial auth check
  const [loadingProfile, setLoadingProfile] = useState(false);  // profile fetch

  // ── Load both profile + wirker_profile ──────────────────────────────
  const loadProfile = useCallback(async (userId) => {
    setLoadingProfile(true);
    try {
      // Base profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (prof) {
        setProfile(prof);

        // Wirker profile (if wirker)
        if (prof.is_wirker) {
          const { data: wp } = await supabase
            .from("wirker_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();
          setWirkerProfile(wp || null);
        }
      } else {
        // Profile doesn't exist yet — create it
        const { data: newProf } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            display_name: supabase.auth.getUser()?.data?.user?.user_metadata?.full_name || "",
            role: "basisuser",
            is_wirker: false,
            has_talent_profile: false,
            profile_modules: {},
          })
          .select()
          .single();
        setProfile(newProf);
      }
    } catch (e) {
      console.warn("loadProfile error:", e.message);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // ── Auth state listener ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAuthenticated(!!u);
      if (u) loadProfile(u.id);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAuthenticated(!!u);
      if (u) loadProfile(u.id);
      else { setProfile(null); setWirkerProfile(null); }
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Update base profile ──────────────────────────────────────────────
  const saveProfile = useCallback(async (updates) => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (data) setProfile(data);
    return { data, error };
  }, [user]);

  // ── Become Wirker ────────────────────────────────────────────────────
  const becomeWirker = useCallback(async (wirkerData) => {
    if (!user) return { error: "Nicht eingeloggt" };

    // 1. Update profile flag
    const { error: profError } = await supabase
      .from("profiles")
      .update({ is_wirker: true, role: "wirker", updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (profError) return { error: profError.message };

    // 2. Create wirker_profile
    const slug = (wirkerData.name || user.email.split("@")[0])
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
      "-" + Math.random().toString(36).slice(2, 6);

    const { data: wp, error: wpError } = await supabase
      .from("wirker_profiles")
      .upsert({
        user_id: user.id,
        slug,
        talent: wirkerData.talent || "Kreativ",
        wirker_type: wirkerData.type || "selbst",
        location_label: wirkerData.city || "",
        categories: wirkerData.categories || [],
      })
      .select()
      .single();

    if (wpError) return { error: wpError.message };

    setWirkerProfile(wp);
    setProfile(p => ({ ...p, is_wirker: true, role: "wirker" }));
    localStorage.setItem("hui_is_wirker", "true");
    return { data: wp };
  }, [user]);

  // ── Update wirker profile ────────────────────────────────────────────
  const saveWirkerProfile = useCallback(async (updates) => {
    if (!user || !wirkerProfile) return { error: "Kein Wirkerprofil" };
    const { data, error } = await supabase
      .from("wirker_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select()
      .single();
    if (data) setWirkerProfile(data);
    return { data, error };
  }, [user, wirkerProfile]);

  // ── Activate Talent (HUI Membership) — persists forever in Supabase ──
  const activateTalentProfile = useCallback(async () => {
    if (!user) return { error: "Nicht eingeloggt" };
    const { data, error } = await supabase
      .from("profiles")
      .update({
        has_talent_profile: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();
    if (data) setProfile(data);
    return { data, error };
  }, [user]);

  // ── Sign up ──────────────────────────────────────────────────────────
  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    return { data, error };
  }, []);

  // ── Sign in ──────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  // ── Sign out ─────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setWirkerProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem("hui_is_wirker");
  }, []);

  const isWirker = profile?.has_talent_profile || profile?.is_wirker || false;
  const hasTalentProfile = profile?.has_talent_profile || false;
  const profileModules   = profile?.profile_modules   || {};

  return (
    <AuthContext.Provider value={{
      // State
      user,
      profile,
      wirkerProfile,
      isAuthenticated,
      isWirker,
      hasTalentProfile,
      profileModules,
      loadingAuth,
      loadingProfile,
      // Actions
      signUp,
      signIn,
      signOut,
      loadProfile,
      saveProfile,
      becomeWirker,
      saveWirkerProfile,
      activateTalentProfile,
      setProfile,
      setWirkerProfile,
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

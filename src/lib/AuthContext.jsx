import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { FIELDS, PROFILE_FIELDS } from "./perfUtils";

const AuthContext = createContext(null);

async function withTimeout(promise, ms = 8000) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve({ data: null, error: { message:"timeout", code:"TIMEOUT" } }), ms);
  });
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timer); }
}

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [wirkerProfile,   setWirkerProfile]   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth,     setLoadingAuth]     = useState(true);
  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [authChecked,     setAuthChecked]     = useState(false);

  const profileLoadingRef = useRef(false);

  // ── Load profile ──────────────────────────────────────────────────
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

  // ── Auth Listener — Single Source of Truth ────────────────────────
  useEffect(() => {
    let settled = false;

    // onAuthStateChange feuert ZUERST (Supabase Guarantee) —
    // wir verlassen uns ausschliesslich darauf.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAuthenticated(!!u);
      setLoadingAuth(false);
      setAuthChecked(true);
      settled = true;

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

    // Fallback: wenn onAuthStateChange nach 10s noch nicht gefeuert hat
    // (z.B. komplett kein Netz) → Loading aufheben, nicht eingeloggt annehmen
    const fallback = setTimeout(() => {
      if (!settled) {
        console.warn("[HUI] onAuthStateChange hat nicht gefeuert nach 10s");
        setLoadingAuth(false);
        setAuthChecked(true);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [loadProfile]);

  // ── Shim für alte ProtectedRoute.jsx (components/) ───────────────
  const checkUserAuth = useCallback(() => {}, []);

  // ── Actions ───────────────────────────────────────────────────────
  const signUp = useCallback(async (email, password, fullName) => {
    return supabase.auth.signUp({ email, password, options:{ data:{ full_name: fullName } } });
  }, []);

  const signIn = useCallback(async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
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

  const isWirker         = profile?.has_talent_profile || profile?.is_wirker || false;
  const hasTalentProfile = profile?.has_talent_profile || false;
  const profileModules   = profile?.profile_modules || {};

  return (
    <AuthContext.Provider value={{
      user, profile, wirkerProfile,
      isAuthenticated, isWirker, hasTalentProfile, profileModules,
      loadingAuth,
      isLoadingAuth: loadingAuth,
      loadingProfile,
      authChecked,
      authError: null,   // kein authError mehr — kein falscher redirect
      checkUserAuth,
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

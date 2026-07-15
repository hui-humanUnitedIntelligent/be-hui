#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gxztrhvhcxhmunhhkfjd.supabase.co";
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk";

const email = process.env.HUI_TEST_EMAIL || `hui-rc1-005-${Date.now()}@cursor-agent.local`;
const password = process.env.HUI_TEST_PASS || "HuiRc1005!Agent";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const { data: signUp, error: signUpErr } = await sb.auth.signUp({ email, password });
console.log("signup:", signUpErr?.message || "ok", signUp?.user?.id || "");

const { data: signIn, error: signInErr } = await sb.auth.signInWithPassword({ email, password });
if (signInErr) {
  console.error("signin failed:", signInErr.message);
  process.exit(1);
}

console.log(JSON.stringify({
  email,
  userId: signIn.user?.id,
  storageKey: `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`,
  session: signIn.session,
}, null, 2));

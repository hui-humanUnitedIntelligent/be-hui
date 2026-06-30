# HUI Violations Report

> **Automatisch generiert** — HUI Architecture Scanner (ARCH-001)
> **Datum:** 2026-06-30
> ⚠️ Diese Datei ist autogeneriert. Änderungen werden beim nächsten `npm run architecture:audit` überschrieben.


## Zusammenfassung

| Severity | Anzahl |
|---|---|
| 🔴 CRITICAL | 42 |
| 🟠 HIGH | 112 |
| 🟡 MEDIUM | 185 |
| 🔵 LOW | 23 |
| ⚪ INFO | 267 |
| **Gesamt** | **629** |

## CORE_BYPASS (42)

### 🔴 `components/TalentOnboarding.jsx` L386
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { data, error: err } = await supabase
```

### 🔴 `components/auth/ProfileCompletionFlow.jsx` L89
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase.from("profiles").update({ avatar_url:publicUrl, updated_at:new Date().toISOString() }).eq("id", userId);
```

### 🔴 `components/auth/ProfileCompletionFlow.jsx` L148
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error: e } = await supabase.from("profiles")
```

### 🔴 `components/auth/ProfileCompletionFlow.jsx` L175
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error: completeErr } = await supabase.from("profiles").update({
```

### 🔴 `components/settings/SettingsModal.jsx` L115
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error:err } = await supabase.from("profiles").update({
```

### 🔴 `components/settings/SettingsModal.jsx` L154
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase.from("profiles").update({ email:email.trim() }).eq("id", profile.id);
```

### 🔴 `components/settings/SettingsModal.jsx` L187
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error:err } = await supabase.from("profiles").update({
```

### 🔴 `components/settings/SettingsModal.jsx` L261
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error:err } = await supabase.from("profiles").update({
```

### 🔴 `components/studio/ImpactStimmenModal.jsx` L172
**Core Bypass: Direkter Write auf Core-Tabelle 'impact_votes'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("impact_votes").insert({
```

### 🔴 `components/studio/ProfilBearbeitenModal.jsx` L178
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
: supabase.from("profiles")
```

### 🔴 `components/studio/ProfilBearbeitenModal.jsx` L198
**Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase.from("wirker_profiles").update(wpUpdates).eq("id", wpData.id);
```

### 🔴 `components/studio/ProfilBearbeitenModal.jsx` L200
**Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase.from("wirker_profiles").insert({ user_id: profile.id, ...wpUpdates });
```

### 🔴 `hooks/useAmbassador.js` L154
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase
```

### 🔴 `lib/AuthContext.jsx` L57
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
supabase.from("profiles").upsert({
```

### 🔴 `lib/AuthContext.jsx` L256
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
supabase.from("profiles")
```

### 🔴 `lib/AuthContext.jsx` L266
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error: e1 } = await supabase.from("profiles")
```

### 🔴 `lib/AuthContext.jsx` L273
**Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { data: wp, error: e2 } = await supabase.from("wirker_profiles")
```

### 🔴 `lib/AuthContext.jsx` L380
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { data: updated, error } = await supabase
```

### 🔴 `lib/profileMedia.js` L82
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error: dbErr } = await supabase.from("profiles")
```

### 🔴 `lib/profileMedia.js` L115
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error: dbErr } = await supabase.from("profiles")
```

### 🔴 `lib/referralTracking.js` L143
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { data: upd, error: upErr } = await supabase
```

### 🔴 `lib/roles/index.js` L148
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase
```

### 🔴 `lib/roles/index.js` L164
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase
```

### 🔴 `lib/sessionHooks.js` L188
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase.from("profiles")
```

### 🔴 `lib/usePresence.js` L33
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase
```

### 🔴 `pages/BasisProfilePage.jsx` L401
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `pages/BasisProfilePage.jsx` L410
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `pages/BasisProfilePage.jsx` L419
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `pages/BasisProfilePage.jsx` L429
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `pages/ImpactPage.jsx` L537
**Core Bypass: Direkter Write auf Core-Tabelle 'impact_votes'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("impact_votes").insert({
```

### 🔴 `pages/LoginPage.jsx` L552
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
```

### 🔴 `pages/MyBasisProfile.jsx` L546
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error: saveErr } = await supabase.from("profiles")
```

### 🔴 `pages/MyCreatorDashboard.jsx` L787
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
await supabase.from("profiles")
```

### 🔴 `pages/TalentProfilePage.jsx` L1161
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `pages/TalentProfilePage.jsx` L1172
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `pages/TalentProfilePage.jsx` L1187
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `pages/TalentProfilePage.jsx` L1199
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
const { error } = await supabase.from("profiles")
```

### 🔴 `services/db.js` L71
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
supabase.from('profiles')
```

### 🔴 `services/db.js` L84
**Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
supabase.from('profiles')
```

### 🔴 `services/db.js` L170
**Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
supabase.from('wirker_profiles')
```

### 🔴 `services/db.js` L185
**Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
supabase.from('wirker_profiles')
```

### 🔴 `services/db.js` L505
**Core Bypass: Direkter Write auf Core-Tabelle 'impact_votes'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).**

```
supabase.from('impact_votes').insert({
```

## DIRECT_ROUTING (8)

### 🟠 `App.jsx` L346
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
<button onClick={() => { window.location.href = "/login"; }}
```

### 🟠 `components/ErrorBoundary.jsx` L42
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
window.location.replace(window.location.href.split('?')[0] + '?r=' + Date.now());
```

### 🟠 `components/UserNotRegisteredError.jsx` L15
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
<button onClick={() => window.location.href = '/login'}
```

### 🟠 `components/settings/SettingsModal.jsx` L303
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
window.location.href = "/login";
```

### 🟠 `pages/AuthCallback.jsx` L27
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
window.location.href = '/Home';
```

### 🟠 `pages/AuthCallback.jsx` L32
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
setTimeout(() => { window.location.href = '/login' }, 1500)
```

### 🟠 `pages/AuthCallback.jsx` L36
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
setTimeout(() => { window.location.href = '/login' }, 1500)
```

### 🟠 `pages/AuthCallback.jsx` L25
**Direktes Routing via window.location ohne Action Engine. Verwende useHuiActions() / navigate().**

```
window.location.replace('/Home?v=' + v);
```

## DB_DIRECT_WRITE (71)

### 🟠 `components/HuiCreateFlow.jsx` L324
**Direkter DB-Write (INSERT) auf 'stories' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error: dbErr } = await supabase.from("stories").insert({
```

### 🟠 `components/HuiCreateFlow.jsx` L1570
**Direkter DB-Write (INSERT) auf 'stories' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error:e } = await supabase.from("stories").insert({
```

### 🟠 `components/HuiCreateFlow.jsx` L1578
**Direkter DB-Write (INSERT) auf 'works' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error:e } = await supabase.from("works").insert({
```

### 🟠 `components/HuiCreateFlow.jsx` L1641
**Direkter DB-Write (INSERT) auf 'stories' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error:e } = await supabase.from("stories").insert({
```

### 🟠 `components/HuiMomentSheet.jsx` L232
**Direkter DB-Write (INSERT) auf 'beitraege' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data: result, error: insertErr } = await supabase
```

### 🟠 `components/NotificationCenter.jsx` L853
**Direkter DB-Write (UPDATE) auf 'notifications' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("notifications").update({ read:true }).eq("id", n.id);
```

### 🟠 `components/NotificationCenter.jsx` L893
**Direkter DB-Write (UPDATE) auf 'notifications' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("notifications").update({ read:true }).eq("read", false);
```

### 🟠 `components/NotificationCenter.jsx` L919
**Direkter DB-Write (UPDATE) auf 'notifications' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
if (!n.read) supabase.from("notifications").update({ read:true }).eq("id", n.id).then(()=>{});
```

### 🟠 `components/StoryBar.jsx` L186
**Direkter DB-Write (UPSERT) auf 'story_views' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
supabase.from('story_views').upsert({ story_id: current.id, viewer_id: user.id },
```

### 🟠 `components/StoryBar.jsx` L258
**Direkter DB-Write (INSERT) auf 'messages' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from('messages').insert({
```

### 🟠 `components/StoryComposer.jsx` L163
**Direkter DB-Write (INSERT) auf 'stories' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data, error: dbErr } = await supabase
```

### 🟠 `components/SupportSheet.jsx` L60
**Direkter DB-Write (INSERT) auf 'project_support' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error: err } = await supabase
```

### 🟠 `components/SupportSheet.jsx` L71
**Direkter DB-Write (UPDATE) auf 'impact_projects' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase
```

### 🟠 `components/TalentOnboarding.jsx` L386
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data, error: err } = await supabase
```

### 🟠 `components/WerkPublisher.jsx` L433
**Direkter DB-Write (INSERT) auf 'works' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error: dbErr } = await supabase.from("works").insert({
```

### 🟠 `components/WorkDetailPage.jsx` L391
**Direkter DB-Write (INSERT) auf 'comments' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("comments")
```

### 🟠 `components/auth/ProfileCompletionFlow.jsx` L89
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("profiles").update({ avatar_url:publicUrl, updated_at:new Date().toISOString() }).eq("id", userId);
```

### 🟠 `components/auth/ProfileCompletionFlow.jsx` L148
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error: e } = await supabase.from("profiles")
```

### 🟠 `components/auth/ProfileCompletionFlow.jsx` L175
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error: completeErr } = await supabase.from("profiles").update({
```

### 🟠 `components/commerce/ExperienceBookingFlow.jsx` L67
**Direkter DB-Write (INSERT) auf 'notifications' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("notifications").insert({
```

### 🟠 `components/commerce/WerkKaufFlow.jsx` L64
**Direkter DB-Write (INSERT) auf 'notifications' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("notifications").insert({
```

### 🟠 `components/connection-create/ConnectionCreatePage.jsx` L272
**Direkter DB-Write (INSERT) auf 'connections' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
console.log("[HUI CONNECTION] step 3 insert start →", "supabase.from('connections').insert(...)");
```

### 🟠 `components/connection-create/ConnectionCreatePage.jsx` L274
**Direkter DB-Write (INSERT) auf 'connections' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data: connData, error: dbErr } = await supabase
```

### 🟠 `components/experiences/ExperienceWizard.jsx` L859
**Direkter DB-Write (INSERT) auf 'experiences' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
? await supabase.from("experiences").update(payload).eq("id", existingExp.id).eq("user_id", userId).select().single()
```

### 🟠 `components/experiences/ExperienceWizard.jsx` L860
**Direkter DB-Write (INSERT) auf 'experiences' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
: await supabase.from("experiences").insert(payload).select().single();
```

### 🟠 `components/notifications/NotificationPanel.jsx` L324
**Direkter DB-Write (UPDATE) auf 'notifications' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
```

### 🟠 `components/notifications/NotificationPanel.jsx` L330
**Direkter DB-Write (UPDATE) auf 'notifications' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("notifications").update({ is_read: true }).eq("id", id);
```

### 🟠 `components/profile/sections/WorksSection.jsx` L71
**Direkter DB-Write (UPDATE) auf 'works' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("works").update({ status:"deleted", visibility:"private" }).eq("id", w.id);
```

### 🟠 `components/publishing/PublishWorkFlow.jsx` L99
**Direkter DB-Write (INSERT) auf 'works' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data, error: insErr } = await supabase
```

### 🟠 `components/settings/SettingsModal.jsx` L115
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error:err } = await supabase.from("profiles").update({
```

### 🟠 `components/settings/SettingsModal.jsx` L154
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("profiles").update({ email:email.trim() }).eq("id", profile.id);
```

### 🟠 `components/settings/SettingsModal.jsx` L187
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error:err } = await supabase.from("profiles").update({
```

### 🟠 `components/settings/SettingsModal.jsx` L261
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error:err } = await supabase.from("profiles").update({
```

### 🟠 `components/studio/ImpactStimmenModal.jsx` L172
**Direkter DB-Write (INSERT) auf 'impact_votes' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("impact_votes").insert({
```

### 🟠 `components/studio/ProfilBearbeitenModal.jsx` L178
**Direkter DB-Write (UPDATE) auf 'profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
: supabase.from("profiles")
```

### 🟠 `components/studio/ProfilBearbeitenModal.jsx` L198
**Direkter DB-Write (INSERT) auf 'wirker_profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("wirker_profiles").update(wpUpdates).eq("id", wpData.id);
```

### 🟠 `components/studio/ProfilBearbeitenModal.jsx` L200
**Direkter DB-Write (INSERT) auf 'wirker_profiles' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
await supabase.from("wirker_profiles").insert({ user_id: profile.id, ...wpUpdates });
```

### 🟠 `components/teilen/TeilenFlow.jsx` L700
**Direkter DB-Write (INSERT) auf 'beitraege' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data, error } = await supabase
```

### 🟠 `components/teilen/TeilenFlow.jsx` L772
**Direkter DB-Write (INSERT) auf 'stories' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data, error } = await supabase
```

### 🟠 `components/teilen/TeilenFlow.jsx` L888
**Direkter DB-Write (INSERT) auf 'beitraege' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
const { data, error } = await supabase
```

### 🟠 `components/works/WerkWizard.jsx` L537
**Direkter DB-Write (INSERT) auf 'works' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
? await supabase.from("works").update(payload).eq("id",existingWork.id).eq("user_id",userId).select().single()
```

### 🟠 `components/works/WerkWizard.jsx` L538
**Direkter DB-Write (INSERT) auf 'works' in COMPONENTS-Schicht. Verwende Service-Layer.**

```
: await supabase.from("works").insert(payload).select().single();
```

### 🟠 `content/invitation/InvitationFlow.jsx` L396
**Direkter DB-Write (INSERT) auf 'invitations' in FEATURES-Schicht. Verwende Service-Layer.**

```
const { data: insertedInv, error: insertError } = await supabase
```

### 🟠 `content/invitation/useInvitationResponse.js` L78
**Direkter DB-Write (UPSERT) auf 'invitation_responses' in FEATURES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase
```

### 🟠 `content/invitation/useInvitationResponse.js` L111
**Direkter DB-Write (DELETE) auf 'invitation_responses' in FEATURES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase
```

### 🟠 `hooks/useAmbassador.js` L127
**Direkter DB-Write (INSERT) auf 'ambassadors_applications' in HOOKS-Schicht. Verwende Service-Layer.**

```
const { error: insertErr } = await supabase
```

### 🟠 `hooks/useAmbassador.js` L154
**Direkter DB-Write (UPDATE) auf 'profiles' in HOOKS-Schicht. Verwende Service-Layer.**

```
await supabase
```

### 🟠 `pages/Admin.jsx` L17
**Direkter DB-Write (INSERT) auf 'notifications' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("notifications").insert({
```

### 🟠 `pages/BasisProfilePage.jsx` L401
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/BasisProfilePage.jsx` L410
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/BasisProfilePage.jsx` L419
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/BasisProfilePage.jsx` L429
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/ImpactPage.jsx` L465
**Direkter DB-Write (UPSERT) auf 'impact_monthly_results' in PAGES-Schicht. Verwende Service-Layer.**

```
supabase.from("impact_monthly_results").upsert({
```

### 🟠 `pages/ImpactPage.jsx` L537
**Direkter DB-Write (INSERT) auf 'impact_votes' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("impact_votes").insert({
```

### 🟠 `pages/LoginPage.jsx` L552
**Direkter DB-Write (UPSERT) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
```

### 🟠 `pages/MyBasisProfile.jsx` L546
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error: saveErr } = await supabase.from("profiles")
```

### 🟠 `pages/MyBasisProfile.jsx` L1456
**Direkter DB-Write (UPDATE) auf 'works' in PAGES-Schicht. Verwende Service-Layer.**

```
await supabase.from("works").update({ status: "deleted", visibility: "private" }).eq("id", w.id);
```

### 🟠 `pages/MyCreatorDashboard.jsx` L787
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
await supabase.from("profiles")
```

### 🟠 `pages/TalentProfilePage.jsx` L185
**Direkter DB-Write (INSERT) auf 'profile_relations' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase
```

### 🟠 `pages/TalentProfilePage.jsx` L519
**Direkter DB-Write (INSERT) auf 'profile_watchlist' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase
```

### 🟠 `pages/TalentProfilePage.jsx` L532
**Direkter DB-Write (DELETE) auf 'profile_watchlist' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase
```

### 🟠 `pages/TalentProfilePage.jsx` L877
**Direkter DB-Write (INSERT) auf 'profile_watchlist' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase
```

### 🟠 `pages/TalentProfilePage.jsx` L890
**Direkter DB-Write (DELETE) auf 'profile_watchlist' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase
```

### 🟠 `pages/TalentProfilePage.jsx` L1161
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/TalentProfilePage.jsx` L1172
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/TalentProfilePage.jsx` L1187
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/TalentProfilePage.jsx` L1199
**Direkter DB-Write (UPDATE) auf 'profiles' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("profiles")
```

### 🟠 `pages/studio/MeineTicketsPage.jsx` L76
**Direkter DB-Write (INSERT) auf 'notifications' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("notifications").insert({
```

### 🟠 `pages/studio/SupportPage.jsx` L118
**Direkter DB-Write (INSERT) auf 'notifications' in PAGES-Schicht. Verwende Service-Layer.**

```
const { error } = await supabase.from("notifications").insert({
```

### 🟠 `pages/wirker-profile/index.jsx` L158
**Direkter DB-Write (INSERT) auf 'profile_watchlist' in PAGES-Schicht. Verwende Service-Layer.**

```
await supabase.from("profile_watchlist")
```

### 🟠 `pages/wirker-profile/index.jsx` L161
**Direkter DB-Write (DELETE) auf 'profile_watchlist' in PAGES-Schicht. Verwende Service-Layer.**

```
await supabase.from("profile_watchlist")
```

## LAYER_VIOLATION (16)

### 🟠 `core/HuiActionProvider.jsx` L18
**Layer Violation: CORE importiert aus COMPONENTS (layer-violation: CORE(0) → COMPONENTS(5)).**

```
import from '../components/home/HomeShell.jsx'
```

### 🟠 `core/HuiConnectionEngine.jsx` L28
**Layer Violation: CORE importiert aus SERVICES (layer-violation: CORE(0) → SERVICES(2)).**

```
import from '../lib/supabaseClient.js'
```

### 🟠 `core/coreEngine.js` L46
**Layer Violation: CORE importiert aus SERVICES (layer-violation: CORE(0) → SERVICES(2)).**

```
import from '../lib/supabaseClient.js'
```

### 🟠 `core/resonanceEngine.js` L40
**Layer Violation: CORE importiert aus SERVICES (layer-violation: CORE(0) → SERVICES(2)).**

```
import from '../lib/supabaseClient.js'
```

### 🟠 `feed/cards/BaseFeedCard.jsx` L10
**Layer Violation: SYSTEM importiert aus COMPONENTS (layer-violation: SYSTEM(2) → COMPONENTS(5)).**

```
import from '../../components/ui/TalentBadge.jsx'
```

### 🟠 `lib/guidance/focusSystem.js` L7
**Layer Violation: SERVICES importiert aus COMPONENTS (layer-violation: SERVICES(2) → COMPONENTS(5)).**

```
import from '../../components/guidance/guidanceTokens.js'
```

### 🟠 `lib/guidance/visualPriority.js` L7
**Layer Violation: SERVICES importiert aus COMPONENTS (layer-violation: SERVICES(2) → COMPONENTS(5)).**

```
import from '../../components/guidance/guidanceTokens.js'
```

### 🟠 `lib/world/tabVisibilityController.js` L1
**Layer Violation: SERVICES importiert aus FEATURES (layer-violation: SERVICES(2) → FEATURES(4)).**

```
import from '../../design/hui.interaction.js'
```

### 🟠 `services/commerceEngine.js` L31
**Layer Violation: SERVICES importiert aus COMPONENTS (layer-violation: SERVICES(2) → COMPONENTS(5)).**

```
import from '../components/commerce/commerceUtils.js'
```

### 🟠 `system/orb/OrbAnimations.js` L1
**Layer Violation: SYSTEM importiert aus FEATURES (layer-violation: SYSTEM(2) → FEATURES(4)).**

```
import from '../../design/hui.interaction.js'
```

### 🟠 `system/orb/OrbAtmosphere.jsx` L1
**Layer Violation: SYSTEM importiert aus FEATURES (layer-violation: SYSTEM(2) → FEATURES(4)).**

```
import from '../../design/hui.interaction.js'
```

### 🟠 `system/orb/OrbAtmosphere.jsx` L13
**Layer Violation: SYSTEM importiert aus FEATURES (layer-violation: SYSTEM(2) → FEATURES(4)).**

```
import from '../../config/safeMode.js'
```

### 🟠 `system/orb/OrbCenter.jsx` L1
**Layer Violation: SYSTEM importiert aus FEATURES (layer-violation: SYSTEM(2) → FEATURES(4)).**

```
import from '../../design/hui.interaction.js'
```

### 🟠 `system/orb/OrbConfig.js` L2
**Layer Violation: SYSTEM importiert aus FEATURES (layer-violation: SYSTEM(2) → FEATURES(4)).**

```
import from '../../design/hui.design.js'
```

### 🟠 `system/orb/OrbNode.jsx` L1
**Layer Violation: SYSTEM importiert aus FEATURES (layer-violation: SYSTEM(2) → FEATURES(4)).**

```
import from '../../design/hui.interaction.js'
```

### 🟠 `system/orb/OrbSystem.jsx` L37
**Layer Violation: SYSTEM importiert aus FEATURES (layer-violation: SYSTEM(2) → FEATURES(4)).**

```
import from '../../config/safeMode.js'
```

## DUPLICATE_OWNER (17)

### 🟠 `components/HuiCreateFlow.jsx`
**Duplicate Owner für Tabelle 'stories': 5 Dateien schreiben diese Tabelle.**

```
components/HuiCreateFlow.jsx, components/StoryComposer.jsx, components/teilen/TeilenFlow.jsx, feed/StoryCreator.jsx, services/db.js
```

### 🟠 `components/HuiCreateFlow.jsx`
**Duplicate Owner für Tabelle 'works': 9 Dateien schreiben diese Tabelle.**

```
components/HuiCreateFlow.jsx, components/WerkPublisher.jsx, components/profile/sections/WorksSection.jsx, components/publishing/PublishWorkFlow.jsx, components/works/WerkWizard.jsx, pages/MyBasisProfile.jsx, services/content.js, services/db.js, system/flows/work/WorkFlow.jsx
```

### 🟠 `components/HuiMomentSheet.jsx`
**Duplicate Owner für Tabelle 'beitraege': 2 Dateien schreiben diese Tabelle.**

```
components/HuiMomentSheet.jsx, components/teilen/TeilenFlow.jsx
```

### 🟠 `components/NotificationCenter.jsx`
**Duplicate Owner für Tabelle 'notifications': 11 Dateien schreiben diese Tabelle.**

```
components/NotificationCenter.jsx, components/commerce/ExperienceBookingFlow.jsx, components/commerce/WerkKaufFlow.jsx, components/notifications/NotificationPanel.jsx, lib/bookingContext.js, lib/notificationService.js, lib/useNotifications.jsx, pages/Admin.jsx, pages/studio/MeineTicketsPage.jsx, pages/studio/SupportPage.jsx, system/flows/impact/ImpactFlow.jsx
```

### 🟠 `components/StoryBar.jsx`
**Duplicate Owner für Tabelle 'story_views': 3 Dateien schreiben diese Tabelle.**

```
components/StoryBar.jsx, feed/StoryViewer.jsx, services/db.js
```

### 🟠 `components/StoryBar.jsx`
**Duplicate Owner für Tabelle 'messages': 4 Dateien schreiben diese Tabelle.**

```
components/StoryBar.jsx, lib/bookingContext.js, lib/chatContext.js, services/db.js
```

### 🟠 `components/TalentOnboarding.jsx`
**Duplicate Owner für Tabelle 'profiles': 17 Dateien schreiben diese Tabelle.**

```
components/TalentOnboarding.jsx, components/auth/ProfileCompletionFlow.jsx, components/settings/SettingsModal.jsx, components/studio/ProfilBearbeitenModal.jsx, hooks/useAmbassador.js, lib/AuthContext.jsx, lib/profileMedia.js, lib/referralTracking.js, lib/roles/index.js, lib/sessionHooks.js, lib/usePresence.js, pages/BasisProfilePage.jsx, pages/LoginPage.jsx, pages/MyBasisProfile.jsx, pages/MyCreatorDashboard.jsx, pages/TalentProfilePage.jsx, services/db.js
```

### 🟠 `components/experiences/ExperienceWizard.jsx`
**Duplicate Owner für Tabelle 'experiences': 3 Dateien schreiben diese Tabelle.**

```
components/experiences/ExperienceWizard.jsx, lib/factories/experienceContract.js, services/db.js
```

### 🟠 `components/studio/ImpactStimmenModal.jsx`
**Duplicate Owner für Tabelle 'impact_votes': 3 Dateien schreiben diese Tabelle.**

```
components/studio/ImpactStimmenModal.jsx, pages/ImpactPage.jsx, services/db.js
```

### 🟠 `components/studio/ProfilBearbeitenModal.jsx`
**Duplicate Owner für Tabelle 'wirker_profiles': 3 Dateien schreiben diese Tabelle.**

```
components/studio/ProfilBearbeitenModal.jsx, lib/AuthContext.jsx, services/db.js
```

### 🟠 `core/HuiConnectionEngine.jsx`
**Duplicate Owner für Tabelle 'follows': 2 Dateien schreiben diese Tabelle.**

```
core/HuiConnectionEngine.jsx, lib/AppStateContext.jsx
```

### 🟠 `lib/bookingContext.js`
**Duplicate Owner für Tabelle 'chats': 2 Dateien schreiben diese Tabelle.**

```
lib/bookingContext.js, lib/chatContext.js
```

### 🟠 `lib/bookingContext.js`
**Duplicate Owner für Tabelle 'bookings': 2 Dateien schreiben diese Tabelle.**

```
lib/bookingContext.js, services/db.js
```

### 🟠 `lib/events/index.js`
**Duplicate Owner für Tabelle 'platform_events': 2 Dateien schreiben diese Tabelle.**

```
lib/events/index.js, lib/resonance/index.js
```

### 🟠 `lib/trustContext.js`
**Duplicate Owner für Tabelle 'recommendations': 2 Dateien schreiben diese Tabelle.**

```
lib/trustContext.js, services/db.js
```

### 🟠 `lib/useNotifications.jsx`
**Duplicate Owner für Tabelle 'profile_relations': 2 Dateien schreiben diese Tabelle.**

```
lib/useNotifications.jsx, pages/TalentProfilePage.jsx
```

### 🟠 `pages/TalentProfilePage.jsx`
**Duplicate Owner für Tabelle 'profile_watchlist': 2 Dateien schreiben diese Tabelle.**

```
pages/TalentProfilePage.jsx, pages/wirker-profile/index.jsx
```

## DB_DIRECT_READ (185)

### 🟡 `components/HuiMatchOverlay.jsx` L355
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
let q = supabase.from("profiles")
```

### 🟡 `components/HuiMatchOverlay.jsx` L368
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase.from("works")
```

### 🟡 `components/HuiMatchOverlay.jsx` L379
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase.from("experiences")
```

### 🟡 `components/HuiMatchOverlay.jsx` L413
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles").select(PROFILE_FIELDS)
```

### 🟡 `components/HuiMatchOverlay.jsx` L415
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `components/HuiMatchOverlay.jsx` L418
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `components/NotificationCenter.jsx` L839
**Direkter DB-Read auf 'payments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `components/ProtectedRoute.jsx` L64
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `components/StoryBar.jsx` L51
**Direkter DB-Read auf 'stories' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data, error } = await supabase
```

### 🟡 `components/StoryBar.jsx` L68
**Direkter DB-Read auf 'story_views' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: views } = await supabase
```

### 🟡 `components/StoryBar.jsx` L188
**Direkter DB-Read auf 'story_views' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from('story_views').select('id', { count:'exact' })
```

### 🟡 `components/StoryBar.jsx` L677
**Direkter DB-Read auf 'stories' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from('stories')
```

### 🟡 `components/WorkDetailPage.jsx` L304
**Direkter DB-Read auf 'work_likes' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: likeRow } = await supabase
```

### 🟡 `components/WorkDetailPage.jsx` L310
**Direkter DB-Read auf 'work_likes' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { count: lc } = await supabase
```

### 🟡 `components/WorkDetailPage.jsx` L316
**Direkter DB-Read auf 'work_saves' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: saveRow } = await supabase
```

### 🟡 `components/WorkDetailPage.jsx` L323
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: followRow } = await supabase
```

### 🟡 `components/WorkDetailPage.jsx` L330
**Direkter DB-Read auf 'comments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: cData } = await supabase
```

### 🟡 `components/WorkDetailPage.jsx` L409
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: w, error: wErr } = await supabase
```

### 🟡 `components/WorkDetailPage.jsx` L439
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `components/WorkDetailPage.jsx` L445
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `components/chat-center/ChatCenterOverlay.jsx` L184
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: iFollow } = await supabase
```

### 🟡 `components/chat-center/ChatCenterOverlay.jsx` L198
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: mutual } = await supabase
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L242
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L250
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
? supabase.from("follows").select("followed_id").eq("follower_id", uid).limit(100)
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L254
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("follows").select("follower_id,followed_id").limit(200),
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L633
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L640
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L647
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L654
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
uid ? supabase.from("follows")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L989
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles").select("id",{count:"exact",head:true}).order("impact_eur",{ascending:false}).limit(3),
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L990
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works").select("id",{count:"exact",head:true}).gte("created_at",since7d),
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L991
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences").select("id",{count:"exact",head:true}),
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1081
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1084
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1087
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1090
**Direkter DB-Read auf 'beitraege' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("beitraege")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1260
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1405
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles").select("id",{count:"exact",head:true})
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1407
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works").select("id",{count:"exact",head:true})
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1409
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences").select("id",{count:"exact",head:true})
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1411
**Direkter DB-Read auf 'beitraege' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("beitraege").select("id",{count:"exact",head:true})
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1490
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles").select("id,display_name,username,avatar_url,created_at")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1492
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works").select("id,title,cover_url,created_at")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1494
**Direkter DB-Read auf 'beitraege' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("beitraege").select("id,caption,src,created_at")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1496
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences").select("id,title,cover_url,created_at")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1701
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles").select("id,display_name,username,avatar_url,bio,location")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1703
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works").select("id,title,cover_url,category,location_text,user_id")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1705
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences").select("id,title,cover_url,category,location_text,user_id")
```

### 🟡 `components/home/header/SearchCommandCenter.jsx` L1707
**Direkter DB-Read auf 'beitraege' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("beitraege").select("id,caption,src,created_at")
```

### 🟡 `components/notifications/NotificationPanel.jsx` L293
**Direkter DB-Read auf 'notifications' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data, error } = await supabase
```

### 🟡 `components/profile/MerkenSection.jsx` L29
**Direkter DB-Read auf 'saved_posts' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `components/studio/EinAusgabenModal.jsx` L108
**Direkter DB-Read auf 'payments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: pOut } = await supabase
```

### 🟡 `components/studio/EinAusgabenModal.jsx` L133
**Direkter DB-Read auf 'bookings' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: bOut } = await supabase
```

### 🟡 `components/studio/EinAusgabenModal.jsx` L158
**Direkter DB-Read auf 'orders' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: oOut } = await supabase
```

### 🟡 `components/studio/EinAusgabenModal.jsx` L191
**Direkter DB-Read auf 'payments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: pIn } = await supabase
```

### 🟡 `components/studio/EinAusgabenModal.jsx` L218
**Direkter DB-Read auf 'bookings' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: bIn } = await supabase
```

### 🟡 `components/studio/EinAusgabenModal.jsx` L249
**Direkter DB-Read auf 'order_items' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: oiIn } = await supabase
```

### 🟡 `components/studio/EinAusgabenModal.jsx` L257
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: works } = await supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L295
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: selfProfile } = await supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L307
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: referred } = await supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L351
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L626
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data, error } = await supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L843
**Direkter DB-Read auf 'user_recommendations' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data, error } = await supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L867
**Direkter DB-Read auf 'impact_projects' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: projs } = await supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L877
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: wrks } = await supabase
```

### 🟡 `components/studio/HuiStudio.jsx` L887
**Direkter DB-Read auf 'experiences' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: exps } = await supabase
```

### 🟡 `components/studio/ImpactStimmenModal.jsx` L113
**Direkter DB-Read auf 'impact_applications' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_applications")
```

### 🟡 `components/studio/ImpactStimmenModal.jsx` L117
**Direkter DB-Read auf 'impact_votes' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_votes")
```

### 🟡 `components/studio/MeineProjekteModal.jsx` L81
**Direkter DB-Read auf 'project_support' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: supData } = await supabase
```

### 🟡 `components/studio/MeineProjekteModal.jsx` L88
**Direkter DB-Read auf 'impact_votes' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: voteData } = await supabase
```

### 🟡 `components/studio/MeineProjekteModal.jsx` L106
**Direkter DB-Read auf 'impact_projects' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: projData } = await supabase
```

### 🟡 `components/studio/ProfilBearbeitenModal.jsx` L104
**Direkter DB-Read auf 'wirker_profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `components/studio/ProfilBearbeitenModal.jsx` L134
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `components/studio/StatistikenModal.jsx` L91
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("follows").select("*", { count:"exact", head:true }).eq("follower_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L92
**Direkter DB-Read auf 'follows' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("follows").select("*", { count:"exact", head:true }).eq("followed_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L93
**Direkter DB-Read auf 'work_likes' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("work_likes").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L94
**Direkter DB-Read auf 'work_saves' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("work_saves").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L95
**Direkter DB-Read auf 'comments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("comments").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L97
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L98
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("works").select("*", { count:"exact", head:true }).eq("user_id", uid).eq("approval_status","published"),
```

### 🟡 `components/studio/StatistikenModal.jsx` L99
**Direkter DB-Read auf 'stories' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("stories").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L100
**Direkter DB-Read auf 'moments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("moments").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L101
**Direkter DB-Read auf 'beitraege' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("beitraege").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L103
**Direkter DB-Read auf 'bookings' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("bookings").select("*", { count:"exact", head:true }).eq("customer_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L104
**Direkter DB-Read auf 'bookings' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("bookings").select("*", { count:"exact", head:true }).eq("wirker_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L105
**Direkter DB-Read auf 'orders' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("orders").select("*", { count:"exact", head:true }).eq("customer_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L107
**Direkter DB-Read auf 'impact_votes' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_votes").select("*", { count:"exact", head:true }).eq("voter_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L108
**Direkter DB-Read auf 'project_support' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("project_support").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L110
**Direkter DB-Read auf 'recommendations' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("recommendations").select("*", { count:"exact", head:true }).eq("from_user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L111
**Direkter DB-Read auf 'favorites' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("favorites").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L112
**Direkter DB-Read auf 'connections' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("connections").select("*", { count:"exact", head:true }).eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L113
**Direkter DB-Read auf 'profile_relations' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profile_relations").select("*", { count:"exact", head:true }).eq("requester_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L115
**Direkter DB-Read auf 'payments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("payments").select("amount_eur,impact_eur").eq("payer_id", uid).in("state",["released","completed","paid"]
```

### 🟡 `components/studio/StatistikenModal.jsx` L116
**Direkter DB-Read auf 'payments' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("payments").select("payout_eur").eq("recipient_id", uid).in("state",["released","completed","paid"]),
```

### 🟡 `components/studio/StatistikenModal.jsx` L118
**Direkter DB-Read auf 'profiles' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles").select("profile_views,followers_count,trust_score,member_since,created_at,has_talent_profile,i
```

### 🟡 `components/studio/StatistikenModal.jsx` L120
**Direkter DB-Read auf 'project_support' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
supabase.from("project_support").select("amount_eur").eq("user_id", uid),
```

### 🟡 `components/studio/StatistikenModal.jsx` L129
**Direkter DB-Read auf 'works' in COMPONENTS-Schicht. Erwäge Service-Layer.**

```
const { data: ownWorksStats } = await supabase
```

### 🟡 `content/invitation/useInvitationResponse.js` L34
**Direkter DB-Read auf 'invitation_responses' in FEATURES-Schicht. Erwäge Service-Layer.**

```
const { data, error } = await supabase
```

### 🟡 `features/discovery/userSearch.js` L65
**Direkter DB-Read auf 'profiles' in FEATURES-Schicht. Erwäge Service-Layer.**

```
const { data, error: err } = await supabase
```

### 🟡 `features/discovery/userSearch.js` L120
**Direkter DB-Read auf 'profiles' in FEATURES-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `features/discovery/userSearch.js` L130
**Direkter DB-Read auf 'profiles' in FEATURES-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `hooks/useAmbassador.js` L41
**Direkter DB-Read auf 'ambassador_ref_links' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useAmbassador.js` L146
**Direkter DB-Read auf 'profiles' in HOOKS-Schicht. Erwäge Service-Layer.**

```
const { data: prof } = await supabase
```

### 🟡 `hooks/useAmbassador.js` L191
**Direkter DB-Read auf 'profiles' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useAmbassador.js` L201
**Direkter DB-Read auf 'profiles' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useAmbassador.js` L247
**Direkter DB-Read auf 'ambassador_ref_links' in HOOKS-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `hooks/useProfileData.js` L135
**Direkter DB-Read auf 'wirker_profiles' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useProfileData.js` L144
**Direkter DB-Read auf 'works' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useProfileData.js` L155
**Direkter DB-Read auf 'experiences' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useProfileData.js` L166
**Direkter DB-Read auf 'projects' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useProfileData.js` L177
**Direkter DB-Read auf 'recommendations' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `hooks/useProfileData.js` L188
**Direkter DB-Read auf 'beitraege' in HOOKS-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `pages/Admin.jsx` L125
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `pages/Admin.jsx` L135
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `pages/Admin.jsx` L144
**Direkter DB-Read auf 'impact_applications' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_applications")
```

### 🟡 `pages/Admin.jsx` L744
**Direkter DB-Read auf 'creator_analytics' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("creator_analytics")
```

### 🟡 `pages/Admin.jsx` L750
**Direkter DB-Read auf 'platform_events' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("platform_events")
```

### 🟡 `pages/Admin.jsx` L756
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `pages/Admin.jsx` L761
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `pages/Admin.jsx` L991
**Direkter DB-Read auf 'wirker' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("wirker")
```

### 🟡 `pages/Admin.jsx` L994
**Direkter DB-Read auf 'payments' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("payments")
```

### 🟡 `pages/Admin.jsx` L997
**Direkter DB-Read auf 'impact_projects' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_projects")
```

### 🟡 `pages/Admin.jsx` L1000
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `pages/Admin.jsx` L1002
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `pages/Admin.jsx` L1004
**Direkter DB-Read auf 'impact_applications' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_applications")
```

### 🟡 `pages/CreatorStudio.jsx` L107
**Direkter DB-Read auf 'profiles' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles")
```

### 🟡 `pages/DiagnosePage.jsx` L119
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: w, error: we } = await supabase.from('works')
```

### 🟡 `pages/DiagnosePage.jsx` L131
**Direkter DB-Read auf 'stories' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: s, error: se } = await supabase.from('stories')
```

### 🟡 `pages/DiagnosePage.jsx` L139
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: e, error: ee } = await supabase.from('experiences')
```

### 🟡 `pages/DiscoverPage.jsx` L1434
**Direkter DB-Read auf 'profiles' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: profiles } = await supabase
```

### 🟡 `pages/DiscoverPage.jsx` L1454
**Direkter DB-Read auf 'beitraege' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: beitr } = await supabase
```

### 🟡 `pages/DiscoverPage.jsx` L1475
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: ws, error: wsErr } = await supabase
```

### 🟡 `pages/DiscoverPage.jsx` L1511
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: exps, error: expsErr } = await supabase
```

### 🟡 `pages/DiscoverPage.jsx` L1565
**Direkter DB-Read auf 'impact_pool' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: imp } = await supabase
```

### 🟡 `pages/DiscoverPage.jsx` L1577
**Direkter DB-Read auf 'beitraege' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("beitraege").select("*", { count:"exact", head:true }).gte("created_at", new Date(Date.now()-86400000*7).t
```

### 🟡 `pages/DiscoverPage.jsx` L1578
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("works").select("*", { count:"exact", head:true }).gte("created_at", new Date(Date.now()-86400000*7).toISO
```

### 🟡 `pages/DiscoverPage.jsx` L1579
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences").select("*", { count:"exact", head:true }),
```

### 🟡 `pages/FavoritesPage.jsx` L661
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: userExps } = await supabase
```

### 🟡 `pages/FavoritesPage.jsx` L690
**Direkter DB-Read auf 'payments' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: payments } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L100
**Direkter DB-Read auf 'bookings' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("bookings").select("id", { count:"exact", head:true })
```

### 🟡 `pages/ImpactPage.jsx` L102
**Direkter DB-Read auf 'bookings' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("bookings").select("id", { count:"exact", head:true })
```

### 🟡 `pages/ImpactPage.jsx` L104
**Direkter DB-Read auf 'bookings' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("bookings").select("id", { count:"exact", head:true })
```

### 🟡 `pages/ImpactPage.jsx` L106
**Direkter DB-Read auf 'impact_rounds' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_rounds")
```

### 🟡 `pages/ImpactPage.jsx` L140
**Direkter DB-Read auf 'impact_rounds' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_rounds")
```

### 🟡 `pages/ImpactPage.jsx` L144
**Direkter DB-Read auf 'bookings' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("bookings")
```

### 🟡 `pages/ImpactPage.jsx` L183
**Direkter DB-Read auf 'impact_projects' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_projects")
```

### 🟡 `pages/ImpactPage.jsx` L185
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_votes")
```

### 🟡 `pages/ImpactPage.jsx` L221
**Direkter DB-Read auf 'impact_rounds' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data:round } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L231
**Direkter DB-Read auf 'impact_projects' in PAGES-Schicht. Erwäge Service-Layer.**

```
? await supabase.from("impact_projects")
```

### 🟡 `pages/ImpactPage.jsx` L235
**Direkter DB-Read auf 'impact_projects' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data:others } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L270
**Direkter DB-Read auf 'impact_projects' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L290
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data:votes } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L301
**Direkter DB-Read auf 'impact_projects' in PAGES-Schicht. Erwäge Service-Layer.**

```
pIds.length ? supabase.from("impact_projects").select("id,name").in("id", pIds)
```

### 🟡 `pages/ImpactPage.jsx` L370
**Direkter DB-Read auf 'impact_applications' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: rows } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L416
**Direkter DB-Read auf 'impact_applications' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: rawApps } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L423
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: votes } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L497
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: existing } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L506
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { count: usedThisMonth } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L517
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { count } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L928
**Direkter DB-Read auf 'impact_applications' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data, error } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L942
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: voteData } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L988
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: votes } = await supabase
```

### 🟡 `pages/ImpactPage.jsx` L1028
**Direkter DB-Read auf 'hui_payments' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("hui_payments")
```

### 🟡 `pages/ImpactPage.jsx` L1030
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("impact_votes")
```

### 🟡 `pages/LoginPage.jsx` L398
**Direkter DB-Read auf 'profiles' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: prof, error: profErr } = await supabase
```

### 🟡 `pages/LoginPage.jsx` L446
**Direkter DB-Read auf 'ambassador_ref_links' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `pages/LoginPage.jsx` L454
**Direkter DB-Read auf 'profiles' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: prof } = await supabase
```

### 🟡 `pages/LoginPage.jsx` L486
**Direkter DB-Read auf 'profiles' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: existingUser } = await supabase
```

### 🟡 `pages/MyCreatorDashboard.jsx` L698
**Direkter DB-Read auf 'profiles' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("profiles")
```

### 🟡 `pages/MyCreatorDashboard.jsx` L702
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `pages/MyCreatorDashboard.jsx` L707
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `pages/MyCreatorDashboard.jsx` L712
**Direkter DB-Read auf 'recommendations' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("recommendations")
```

### 🟡 `pages/MyCreatorDashboard.jsx` L721
**Direkter DB-Read auf 'payments' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("payments")
```

### 🟡 `pages/RefRedirect.jsx` L38
**Direkter DB-Read auf 'ambassador_ref_links' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data, error } = await supabase
```

### 🟡 `pages/TalentProfilePage.jsx` L113
**Direkter DB-Read auf 'profile_watchlist' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `pages/TalentProfilePage.jsx` L119
**Direkter DB-Read auf 'profile_relations' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase
```

### 🟡 `pages/studio/MeineResonanz.jsx` L100
**Direkter DB-Read auf 'orders' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: orders } = await supabase
```

### 🟡 `pages/studio/MeineResonanz.jsx` L129
**Direkter DB-Read auf 'payments' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: payments } = await supabase
```

### 🟡 `pages/studio/MeineResonanz.jsx` L154
**Direkter DB-Read auf 'bookings' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: bookings } = await supabase
```

### 🟡 `pages/studio/MeineResonanz.jsx` L179
**Direkter DB-Read auf 'impact_votes' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: votes } = await supabase
```

### 🟡 `pages/studio/MeineResonanz.jsx` L204
**Direkter DB-Read auf 'impact_applications' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data: myApps } = await supabase
```

### 🟡 `pages/studio/MeineTicketsPage.jsx` L486
**Direkter DB-Read auf 'notifications' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

### 🟡 `pages/studio/StudioSubPages.jsx` L74
**Direkter DB-Read auf 'works' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("works")
```

### 🟡 `pages/studio/StudioSubPages.jsx` L78
**Direkter DB-Read auf 'experiences' in PAGES-Schicht. Erwäge Service-Layer.**

```
supabase.from("experiences")
```

### 🟡 `pages/wirker-profile/index.jsx` L135
**Direkter DB-Read auf 'profile_watchlist' in PAGES-Schicht. Erwäge Service-Layer.**

```
const { data } = await supabase
```

## REGISTRY_BYPASS (23)

### 🔵 `components/HuiMembershipFlow.jsx`
**Registry Bypass (Farben): 17 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F5A623, #060A14, #041210
```

### 🔵 `components/NotificationCenter.jsx`
**Registry Bypass (Farben): 22 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#FFFBEB, #22C55E, #ECFDF5
```

### 🔵 `components/StoryComposer.jsx`
**Registry Bypass (Farben): 11 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#22C55E, #0891b2, #F5A623
```

### 🔵 `components/WorkDetailPage.jsx`
**Registry Bypass (Farben): 11 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#EBEBEB, #e8e8e8, #f0f0f0
```

### 🔵 `components/auth/AuthGate.jsx`
**Registry Bypass (Farben): 24 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#1A1A2E, #0FC4B2, #EF4444
```

### 🔵 `components/commerce/commerceUtils.js`
**Registry Bypass (Farben): 16 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#FAF7F2, #FDFBF8, #EDE5D8
```

### 🔵 `components/home/header/SearchCommandCenter.jsx`
**Registry Bypass (Farben): 41 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#0EC4B8, #1A3530, #16A34A
```

### 🔵 `components/notifications/NotificationPanel.jsx`
**Registry Bypass (Farben): 16 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#f8f7f4, #0EC4B8, #555550
```

### 🔵 `components/profile/ProfileHeader.jsx`
**Registry Bypass (Farben): 23 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F7F5F0, #4A4A45, #8C8C85
```

### 🔵 `components/profile/sections/WorksSection.jsx`
**Registry Bypass (Farben): 11 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F7F5F0, #4A4A45, #8C8C85
```

### 🔵 `components/studio/HuiStudio.jsx`
**Registry Bypass (Farben): 38 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F7F5F0, #0EC4B8, #0AADA3
```

### 🔵 `components/studio/StatistikenModal.jsx`
**Registry Bypass (Farben): 38 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F7F5F0, #0EC4B8, #0AADA3
```

### 🔵 `design/hui.design.js`
**Registry Bypass (Farben): 40 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#0DC4B5, #22DDD0, #09A89A
```

### 🔵 `pages/Admin.jsx`
**Registry Bypass (Farben): 24 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#0A0F1E, #111827, #1A2235
```

### 🔵 `pages/DiscoverPage.jsx`
**Registry Bypass (Farben): 30 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F8F7F4, #0EC4B8, #E8573A
```

### 🔵 `pages/ImpactPage.jsx`
**Registry Bypass (Farben): 65 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#0DC4B5, #22DDD0, #F4714F
```

### 🔵 `pages/MeinHUI.jsx`
**Registry Bypass (Farben): 13 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#FAF7F2, #FDFBF8, #EDE5D8
```

### 🔵 `pages/MyBasisProfile.jsx`
**Registry Bypass (Farben): 36 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F7F5F0, #0EC4B8, #0DBBAF
```

### 🔵 `pages/MyCreatorDashboard.jsx`
**Registry Bypass (Farben): 31 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F8F9FB, #F0FDFC, #FFF8F6
```

### 🔵 `pages/PlatformDashboard.jsx`
**Registry Bypass (Farben): 17 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F9F7F4, #1A1A1A, #888888
```

### 🔵 `pages/ProfileDebugPage.jsx`
**Registry Bypass (Farben): 20 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F7F5F0, #E8E4DC, #4A4A45
```

### 🔵 `pages/TalentProfilePage.jsx`
**Registry Bypass (Farben): 11 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F7F5F0, #0EC4B8, #0AADA3
```

### 🔵 `pages/studio/StudioSubPages.jsx`
**Registry Bypass (Farben): 13 hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.**

```
#F9F7F4, #1A1A1A, #D97706
```

## MISSING_HEADER (267)

### ⚪ `App.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/CreatorPresence.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/EmptyState.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/ErrorBoundary.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/ExperienceCreator.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/GemeinschaftsFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/HuiCreateFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/HuiMatchOverlay.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/HuiMembershipFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/HuiMomentSheet.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/HuiPlusSheet.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/LazyImage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/NotificationCenter.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/OrbCompass.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/ProtectedRoute.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/StoryBar.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/StoryComposer.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/SupportSheet.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/TalentOnboarding.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/WerkPublisher.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/WorkDetailPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/ambassador/AmbassadorModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/ambassador/AmbassadorSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/auth/AuthGate.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/auth/ProfileCompletionFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ChatAtmosphere.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ChatCenterOverlay.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ChatHeader.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ChatInput.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ChatMessages.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ConversationCard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ConversationList.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/ConversationRoom.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/chat-center/MessageBubble.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/commerce/ExperienceBookingFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/commerce/StripePaymentStep.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/commerce/UnterstutzenFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/commerce/WerkKaufFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/commerce/WerkeKorb.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/commerce/commerceUtils.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/ConnectionCreatePage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/ConnectionForm.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/ConnectionPreviewCard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/ConnectionTypeSidebar.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/Selectors.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/StepOneTypeSelection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/StepProgressBar.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/StepThreePreview.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/StepTwoConnectionDetails.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/connection-create/Widgets.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/discovery/PeopleSearch.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/economy/SupportFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/entry/AppEntryController.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/experiences/ExperienceWizard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/guidance/GuidanceContext.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/guidance/GuidanceFooter.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/guidance/GuidanceLayer.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/guidance/guidanceTokens.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/AmbientWorldBar.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/HomeShell.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/header/HomeHeader.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/header/MatchBar.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/header/MessageButton.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/header/NotificationButton.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/header/SearchCommandCenter.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/mood/MoodSheet.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/navigation/BottomNav.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/navigation/NavItem.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/home/profile/ProfileLauncher.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/notifications/NotificationPanel.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/orb/OrbLeaf.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/MerkenSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/OrbSignatur.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/ProfileHeader.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/PublicProfilePreview.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/AboutSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/AvailabilitySection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/ExperiencesSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/LocationSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/MomentsSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/RecommendationsSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/TalentSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/VisibilitySection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/profile/sections/WorksSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/publishing/PublishExperienceFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/publishing/PublishWorkFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/publishing/PublishingHub.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/settings/SettingsModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/shared/ConnectionFlowCard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/studio/EinAusgabenModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/studio/HuiStudio.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/studio/ImpactStimmenModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/studio/MeineProjekteModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/studio/ProfilBearbeitenModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/studio/SicherheitPasswortModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/studio/StatistikenModal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/teilen/TeilenFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/ui/EmptyState.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/ui/TalentBadge.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/welcome/WelcomeOverlay.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `components/works/WerkWizard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `config/SafeRender.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `config/safeMode.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `content/ContentTypeSelector.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `content/invitation/InvitationCard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `content/invitation/InvitationFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `content/invitation/useInvitationResponse.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `context/OrbWorldContext.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `context/WorldSurfaceContext.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/HuiConnectionEngine.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/HuiContextBridge.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/coreEngine.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.actions.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.contracts.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.flow.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.flow.states.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.navigator.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.safePayload.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.semantics.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/hui.sources.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/orbEngine.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `core/resonanceEngine.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `design/hui.design.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `design/hui.hooks.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `design/hui.interaction.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `features/discovery/userSearch.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/FeedEventsSection.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/FeedScrollSentinel.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/FeedSoftHydrationBadge.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/FeedStoriesBar.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/StoryCreator.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/StoryReactionTray.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/StoryViewer.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/UnifiedFeed.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/cards/BaseFeedCard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/cards/EventContent.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/cards/ExperienceContent.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/cards/FeedRouter.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/cards/WorkContent.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/feedRhythmEngine.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `feed/useFeedStream.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `hooks/useAmbassador.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `hooks/useCartPersistence.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `hooks/useCoreEngine.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `hooks/useProfileData.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `hooks/useProfileId.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/AppStateContext.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/AuthContext.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/ErrorBoundaries.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/ambassadorUtils.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/bookingContext.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/chatContext.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/cleanup/cleanupOrbEnvironment.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/community/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/community/local.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/discovery/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/ds.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/errors/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/events/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/factories/createFeedItem.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/factories/createNavItem.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/factories/createProfileItem.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/factories/createTabPage.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/factories/experienceContract.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/guidance/focusSystem.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/guidance/readabilityEngine.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/guidance/visualPriority.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/discoverWorld.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/emotionalIdentity.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/interactionStore.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/persistence/interactionMemoryStore.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/persistence/memoryTokens.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/persistence/useLivingMemory.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/persistence/viewerContext.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/relationshipMemory.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/resonanceSpaces.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/sharedAtmosphere.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/worldContinuity.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/intelligence/worldPolish.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/journeyContext.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/moodUtils.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/notificationService.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/perfUtils.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/points/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/presence/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/profileMedia.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/profileUtils.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/referralTracking.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/reliability/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/resonance/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/roles/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/security/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/sentry.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/sessionHooks.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/supabaseClient.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/trust/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/trustContext.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/useNotifications.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/usePresence.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/usePresence.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/useReactions.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/useToast.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/useUsernameCheck.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/validation/index.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/world/orbLayer.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/world/safariPaintRecovery.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/world/tabVisibilityController.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `lib/world/worldSurfaceController.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `orb/ContentTypeSelector.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `orb/OrbAtmosphere.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `orb/OrbMotionSystem.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `orb/OrbPortal.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/Admin.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/AuthCallback.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/BasisProfilePage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/CreatorDashboard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/CreatorStudio.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/DiagnosePage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/DiscoverPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/FavoritesPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/Home.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/ImpactPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/LiveMapPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/LoginPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/MeinHUI.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/MyBasisProfile.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/MyCreatorDashboard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/PlatformDashboard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/ProfileDebugPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/RefRedirect.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/TalentProfilePage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/studio/MeineResonanz.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/studio/MeineTicketsPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/studio/StudioSubPages.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/studio/SupportPage.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `pages/wirker-profile/index.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `registry/HuiRegistry.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `routes/registry.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `services/commerceEngine.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `services/content.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `services/creatorEconomy.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `services/db.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/feed/unifiedNormalizer.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/experience/ExperienceCreateStep.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/experience/ExperienceDetailsStep.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/experience/ExperienceFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/experience/ExperiencePublishStep.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/impact/ImpactFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/impact/ImpactStep1Projekt.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/impact/ImpactStep2Vision.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/impact/ImpactStep3Kontakt.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/impact/ImpactStep4Review.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/impact/ImpactTokens.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/work/WorkDetailsStep.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/work/WorkFlow.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/work/WorkMediaStep.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/flows/work/WorkPublishStep.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/MemberOrbHome.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbAnimations.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbAtmosphere.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbCenter.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbConfig.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbHintCard.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbNode.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbState.js` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

### ⚪ `system/orb/OrbSystem.jsx` L1
**Fehlende Architektur-Header: @domain=false @owner=false**

```
Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.
```

import{r as o,j as h,R as d}from"./react-vendor-C8ONJliz.js";import{s as lt,u as ct,a7 as ut,i as ft,_ as mt,$ as pt,a8 as ht}from"./index-CewHgEe_.js";import{b as bt,a as dt}from"./hui.actions-B3Epr_Dg.js";const yt={out:"cubic-bezier(0.16, 1.00, 0.30, 1.00)",outSoft:"cubic-bezier(0.22, 1.00, 0.36, 1.00)",outGentle:"cubic-bezier(0.25, 0.46, 0.45, 0.94)",in:"cubic-bezier(0.40, 0.00, 0.60, 1.00)",cinematic:"cubic-bezier(0.16, 1.00, 0.30, 1.00)"},St={tap:120,micro:160,normal:240,page:320,mood:480},gt=`

  /* ── Tap Utility — auf allen tappable Elementen ──────────── */
  .hui-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
  }

  /* ── CTA Utility — primäre Buttons ─────────────────────── */
  /* Einladend, nicht aggressiv. Warmth bei Tap. */
  .hui-cta {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
    transition: transform 200ms cubic-bezier(0.16,1,0.30,1),
                filter 160ms ease,
                box-shadow 200ms cubic-bezier(0.16,1,0.30,1);
  }
  .hui-cta:active {
    transform: scale(0.960) translateY(2px);
    filter: brightness(0.90) saturate(1.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
    transition: transform 120ms cubic-bezier(0.22,1,0.36,1),
                filter 100ms ease;
  }

  /* ── Card Utility ────────────────────────────────────────── */
  .hui-card {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    transition: transform 220ms cubic-bezier(0.16,1,0.30,1),
                box-shadow 220ms cubic-bezier(0.16,1,0.30,1),
                opacity 120ms ease;
  }
  .hui-card:active {
    transform: scale(0.982) translateY(1.5px);
    box-shadow: 0 1px 5px rgba(0,0,0,0.045);
    opacity: 0.92;
    transition: transform 120ms cubic-bezier(0.22,1,0.36,1);
  }

  /* ── Icon Button Utility ─────────────────────────────────── */
  .hui-icon-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    transition: transform 200ms cubic-bezier(0.16,1,0.30,1), opacity 150ms ease;
  }
  .hui-icon-btn:active {
    transform: scale(0.860) translateY(0.5px);
    opacity: 0.68;
    transition: transform 110ms cubic-bezier(0.22,1,0.36,1);
  }

  /* ── Scroll Feel — kein Momentum-Sprung ─────────────────── */
  .hui-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .hui-scroll::-webkit-scrollbar { display: none; }

  /* ── Float ───────────────────────────────────────────────── */
  @keyframes huiFloat {
    0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
    50%      { transform: translateY(-7px) rotate(0.5deg); }
  }
  @keyframes huiFloatB {
    0%, 100% { transform: translateY(2px) rotate(0.4deg); }
    50%      { transform: translateY(-5px) rotate(-0.4deg); }
  }
  @keyframes huiFloatC {
    0%, 100% { transform: translateY(-3px); }
    50%      { transform: translateY(4px); }
  }

  /* ── Breathe — sehr subtil, beinahe unsichtbar ───────────── */
  @keyframes huiBreathe {
    0%, 100% { transform: scale(1);    opacity: 0.85; }
    50%      { transform: scale(1.04); opacity: 1.00; }
  }
  @keyframes huiBreatheSlow {
    0%, 100% { transform: scale(1)    rotate(0deg); opacity: 0.72; }
    33%      { transform: scale(1.06) rotate(2deg); opacity: 0.90; }
    66%      { transform: scale(0.97) rotate(-1deg); opacity: 0.78; }
  }

  /* ── Pulse (Presence Dots, Live-Indikatoren) ─────────────── */
  @keyframes huiPulse {
    0%, 100% { transform: scale(1);    opacity: 1; }
    50%      { transform: scale(0.55); opacity: 0.22; }
  }
  @keyframes huiPulseRing {
    0%       { transform: scale(1);    opacity: 0.45; }
    100%     { transform: scale(2.2);  opacity: 0; }
  }

  /* ── Glow Drift — für atmospheric Blobs ─────────────────── */
  @keyframes huiGlowDrift {
    0%, 100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg); }
    33%      { transform: translate(-50%,-50%) scale(1.08) rotate(6deg); }
    66%      { transform: translate(-52%,-48%) scale(0.94) rotate(-4deg); }
  }
  @keyframes huiGlowDriftB {
    0%, 100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg); }
    40%      { transform: translate(-48%,-52%) scale(1.06) rotate(-5deg); }
    70%      { transform: translate(-50%,-50%) scale(0.97) rotate(3deg); }
  }

  /* ── Fade-Slide (Content erscheint) ─────────────────────── */
  @keyframes huiFadeSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes huiFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Skeleton ────────────────────────────────────────────── */
  @keyframes huiSkeletonBreath {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Sheet / Overlay Entry ───────────────────────────────── */
  @keyframes huiSheetUp {
    from { opacity: 0; transform: translateY(36px) scale(0.975); }
    to   { opacity: 1; transform: translateY(0)    scale(1);     }
  }
  @keyframes huiSheetDown {
    from { opacity: 1; transform: translateY(0)    scale(1);     }
    to   { opacity: 0; transform: translateY(36px) scale(0.975); }
  }
  @keyframes huiOverlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes huiScaleIn {
    from { opacity: 0; transform: scale(0.84); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Orb Specific ─────────────────────────────────────────── */
  @keyframes huiOrbBreath {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(13,196,181,0),
                  0 10px 36px rgba(13,196,181,0.16),
                  0 0 70px rgba(13,196,181,0.07);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(13,196,181,0.04),
                  0 14px 48px rgba(13,196,181,0.22),
                  0 0 90px rgba(13,196,181,0.10);
    }
  }
  @keyframes huiOrbBreathCoral {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(244,115,85,0),
                  0 10px 36px rgba(244,115,85,0.16),
                  0 0 70px rgba(244,115,85,0.07);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(244,115,85,0.04),
                  0 14px 48px rgba(244,115,85,0.22),
                  0 0 90px rgba(244,115,85,0.10);
    }
  }
  @keyframes huiOrbPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(13,196,181,0.00),
                  0 4px 18px rgba(13,196,181,0.38),
                  0 2px 6px rgba(0,0,0,0.14);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(13,196,181,0.08),
                  0 4px 26px rgba(13,196,181,0.60),
                  0 2px 6px rgba(0,0,0,0.14);
    }
  }
  @keyframes huiOrbNodeIn {
    0%   { opacity: 0; transform: scale(0.7) translateY(6px); }
    100% { opacity: 1; transform: scale(1)   translateY(0);   }
  }

  /* ── Nav Orb Idle ─────────────────────────────────────────── */
  @keyframes huiNavOrbIdle {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.025); }
  }

  /* ── Spin (minimal, nur wo nötig) ───────────────────────── */
  @keyframes huiSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`,F={EASE:yt,DUR:St,CSS:gt},kt={huiBottomNavigation:!0,homeShell:!0,hero:!0,homeFeed:!0,discoverFeed:!0,impactPage:!0,onboarding:!0,orb:!0,particles:!0,ambient:!0,motion:!1,matchOverlay:!0,chatCenter:!0,storyViewer:!0,notifications:!0,membership:!0,liveMap:!0,connectFlow:!0,createFlow:!0,werkFlow:!0,experienceFlow:!0,impactFlow:!0,teilenFlow:!0,storyComposer:!0,talentFlow:!0},He=Object.entries(kt).filter(([,e])=>!e).map(([e])=>e);He.length>0?console.warn("[HUI SafeMode] SAFE MODE AKTIV — deaktivierte Systeme:",He.join(", ")):console.info("[HUI SafeMode] Alle Systeme aktiv — Full Mode");const m={HOME:"home",DISCOVER:"discover",COMMUNITY:"community",IMPACT:"impact",CREATOR_DASHBOARD:"creator-dashboard",PUBLIC_PROFILE:"public-profile",STORY_VIEWER:"story-viewer",CREATE_FLOW:"create-flow",NOTIFICATIONS:"notifications"},vt={[m.HOME]:"feed",[m.DISCOVER]:"discover",[m.COMMUNITY]:"community",[m.IMPACT]:"impact",[m.CREATOR_DASHBOARD]:"creator"},je=new Set([m.PUBLIC_PROFILE,m.STORY_VIEWER,m.CREATE_FLOW,m.NOTIFICATIONS]),Je={currentScreen:m.HOME,params:{},history:[{screen:m.HOME,params:{}}]};function _t(e,s){switch(s.type){case"NAVIGATE":{const{screen:t,params:r={}}=s;if(e.currentScreen===t&&JSON.stringify(e.params)===JSON.stringify(r))return e;const n={screen:t,params:r};return{currentScreen:t,params:r,history:[...e.history,n].slice(-20)}}case"GO_BACK":{if(e.history.length<=1)return e;const t=e.history.slice(0,-1),r=t[t.length-1];return{currentScreen:r.screen,params:r.params,history:t}}case"RESET":return{...Je};default:return e}}const xt=o.createContext(null);function Ct({children:e,onTabChange:s}){const[t,r]=o.useReducer(_t,Je),n=o.useRef(s);n.current=s;const a=o.useCallback((u,f={})=>{var k;r({type:"NAVIGATE",screen:u,params:f});const g=vt[u];g&&!je.has(u)&&((k=n.current)==null||k.call(n,g))},[]),i=o.useCallback(()=>{r({type:"GO_BACK"})},[]),c=o.useCallback(()=>{r({type:"RESET"})},[]),p={currentScreen:t.currentScreen,params:t.params,history:t.history,navigate:a,goBack:i,reset:c,isOverlay:je.has(t.currentScreen),canGoBack:t.history.length>1};return h.jsx(xt.Provider,{value:p,children:e})}const y=(e,s="")=>e!=null&&e!==""?String(e).trim():s,b=(e,s=0)=>{const t=Number(e);return isNaN(t)?s:t},T=e=>!!e,Ve=e=>Array.isArray(e)?e.filter(Boolean):[],Ge=e=>typeof e=="string"&&e.startsWith("http")?e:null,It=e=>{const s=(e==null?void 0:e.memberType)||(e==null?void 0:e.member_type)||(e==null?void 0:e.role)||"";return s?{wirker:"wirker",talent:"wirker",creator:"wirker",admin:"admin",basis:"basis",user:"basis",member:"basis"}[String(s).toLowerCase()]||"basis":e!=null&&e.has_talent_profile||e!=null&&e.is_wirker?"wirker":"basis"},Et=e=>{var s,t,r,n,a,i,c;return Object.freeze({followers:b(((s=e==null?void 0:e.stats)==null?void 0:s.followers)||(e==null?void 0:e.followers_count)||(e==null?void 0:e.followers)),following:b(((t=e==null?void 0:e.stats)==null?void 0:t.following)||(e==null?void 0:e.following_count)||(e==null?void 0:e.following)),works:b(((r=e==null?void 0:e.stats)==null?void 0:r.works)||(e==null?void 0:e.works_count)||(e==null?void 0:e.works)),experiences:b(((n=e==null?void 0:e.stats)==null?void 0:n.experiences)||(e==null?void 0:e.experiences_count)||(e==null?void 0:e.experiences)),resonance:b(((a=e==null?void 0:e.stats)==null?void 0:a.resonance)||(e==null?void 0:e.impact_eur)||(e==null?void 0:e.resonance)),connections:b(((i=e==null?void 0:e.stats)==null?void 0:i.connections)||(e==null?void 0:e.connections_count)),bookings:b(((c=e==null?void 0:e.stats)==null?void 0:c.bookings)||(e==null?void 0:e.bookings_count)||(e==null?void 0:e.bookings))})},Rt=(e={})=>{if(!e||typeof e!="object"||Array.isArray(e))return console.warn("[HUI INVALID PROFILE]",e),null;const s=e.id||e.user_id?String(e.id||e.user_id):typeof crypto<"u"?crypto.randomUUID():Math.random().toString(36).slice(2),t=y(e.displayName||e.display_name||e.full_name||e.name||e.username,"Unbekannt"),r=Ge(e.avatar||e.avatar_url||e.img||e.creatorImg||e.photoURL),n=Ge(e.banner||e.banner_url||e.header_img||e.bg||e.bg_url||e.cover_url);return Object.freeze({id:s,username:y(e.username||e.handle),displayName:t,avatar:r,banner:n,bio:y(e.bio||e.quote||e.tagline),location:y(e.location||e.location_label||e.city),website:y(e.website||e.url),talent:y(e.talent||e.focus_type||e.category),currentMood:y(e.currentMood||e.current_mood,"Gerade im Atelier"),memberType:It(e),isVerified:T(e.isVerified||e.is_verified||e.is_wirker||e.has_talent_profile),isAvailable:T(e.isAvailable??e.is_available??!0),profileComplete:T(e.profileComplete||e.profile_complete),isLive:T(e.isLive||e.is_live),skills:Ve(e.skills||e.dna_tags||e.tags),interests:Ve(e.interests||e.interest_tags),stats:Et(e),hourlyRate:e.hourly_rate!=null||e.hourly!=null?b(e.hourly_rate||e.hourly):null,createdAt:e.createdAt||e.created_at||null,updatedAt:e.updatedAt||e.updated_at||null,_raw:e,emotionalIdentity:null})};function Ot(e){const s=o.useRef(null),t=`hui_scroll_${e}`;o.useEffect(()=>{const a=s.current;if(!a)return;const i=parseInt(sessionStorage.getItem(t)||"0",10);i>0&&requestAnimationFrame(()=>{requestAnimationFrame(()=>{a.scrollTop=i})})},[t]),o.useEffect(()=>{const a=s.current;if(!a)return;let i=!1;const c=()=>{i||(i=!0,requestAnimationFrame(()=>{sessionStorage.setItem(t,String(a.scrollTop)),i=!1}))};return a.addEventListener("scroll",c,{passive:!0}),()=>a.removeEventListener("scroll",c)},[t]);const r=o.useCallback(()=>{sessionStorage.removeItem(t),s.current&&(s.current.scrollTop=0)},[t]),n=o.useCallback(()=>parseInt(sessionStorage.getItem(t)||"0",10),[t]);return{ref:s,resetScroll:r,peekScroll:n}}function At(e){const s=o.useRef(null),t=o.useRef(!1),r=o.useRef(null);o.useEffect(()=>{if(!e)return;t.current=!0;async function n(){if(t.current)try{await lt.from("profiles").update({last_seen:new Date().toISOString()}).eq("id",e)}catch{}}n(),s.current=setInterval(()=>{!document.hidden&&t.current&&n()},120*1e3);const a=()=>{!document.hidden&&t.current&&n()};return r.current=a,document.addEventListener("visibilitychange",a,{passive:!0}),()=>{t.current=!1,s.current&&(clearInterval(s.current),s.current=null),r.current&&(document.removeEventListener("visibilitychange",r.current),r.current=null)}},[e])}const Ft=new Set(["feed","discover","impact","favorites"]);function Tt(e="feed"){const[s,t]=o.useState(e),r=o.useRef(!1),n=o.useCallback(()=>{if(!r.current){r.current=!0;try{const i=sessionStorage.getItem("hui_active_tab");i&&Ft.has(i)&&i!==e&&t(i)}catch{}}},[e]),a=o.useCallback(i=>{try{sessionStorage.setItem("hui_active_tab",i)}catch{}t(i)},[]);return[s,a,n]}const Ke=`opacity ${F.DUR.page}ms ${F.EASE.cinematic}, transform ${F.DUR.page}ms ${F.EASE.cinematic}`;function N(e,s,t,r=!1){return e===(r?"feed":s)?{position:"relative",opacity:1,transform:"translateY(0) scale(1)",pointerEvents:t!==null?"none":"auto",userSelect:t!==null?"none":"auto",transition:Ke,zIndex:"auto"}:{position:"absolute",top:0,left:0,width:"100%",height:0,overflow:"hidden",opacity:0,transform:"translateY(4px) scale(0.999)",pointerEvents:"none",userSelect:"none",transition:Ke,zIndex:0}}function Nt(e,s,t=!1){return{tabFeed:N("feed",e,s,t),tabDiscover:N("discover",e,s,t),tabImpact:N("impact",e,s,t),tabFavorites:N("favorites",e,s,t)}}const Bt="hui_cart_v1:";function Mt(e){return e?`${Bt}${e}`:null}function $e(e){if(!e)return[];try{const s=localStorage.getItem(e);if(!s)return[];const t=JSON.parse(s);return Array.isArray(t)?t:[]}catch{return[]}}function qe(e,s){if(e)try{!s||s.length===0?localStorage.removeItem(e):localStorage.setItem(e,JSON.stringify(s))}catch(t){console.warn("[HUI Cart] localStorage write failed:",t==null?void 0:t.message)}}function Dt(e){if(e)try{localStorage.removeItem(e)}catch{}}function Pt(e){const s=Mt(e),t=o.useRef(s),[r,n]=o.useState(()=>$e(s));o.useEffect(()=>{if(t.current!==s){t.current=s;const p=$e(s);n(p)}},[s]);const a=o.useRef(!0);o.useEffect(()=>{if(a.current){a.current=!1;return}s&&qe(s,r)},[r,s]);const i=o.useCallback(p=>{n(u=>{const f=typeof p=="function"?p(u):p;return qe(s,f),f})},[s]),c=o.useCallback(()=>{Dt(s),n([])},[s]);return{cart:r,setCart:i,clearCart:c}}function Ut({children:e}){const s=zt(),t=o.useMemo(()=>bt(s),[s]);return h.jsx(dt.Provider,{value:t,children:e})}const Wt=`
  /* ── World Carry-In (tab transition) ── */
  @keyframes worldCarryIn {
    from { opacity:0.88; }
    to   { opacity:1; }
  }

  /* ── World Float (avatar, orb center, ambient elements) ── */
  @keyframes worldFloat {
    0%,100% { transform:translateY(0);   }
    50%     { transform:translateY(-5px);}
  }

  /* ── World Glow Pulse (rings, halos) ── */
  @keyframes worldGlowPulse {
    0%,100% { opacity:var(--glow-lo, 0.08); transform:scale(1);    }
    50%     { opacity:var(--glow-hi, 0.18); transform:scale(1.10); }
  }

  /* ── World Breathe (bg blobs, ambient layers) ── */
  @keyframes worldBreathe {
    0%,100% { transform:translate(-50%,-50%) scale(1); }
    50%     { transform:translate(-50%,-50%) scale(1.06); }
  }

  /* ── Stillness (empty state icon) ── */
  @keyframes worldStillness {
    0%,100% { opacity:var(--still-lo, 0.20); transform:scale(1);    }
    50%     { opacity:var(--still-hi, 0.30); transform:scale(1.03); }
  }

  /* ── Atelier Shimmer (profile ambient corner) ── */
  @keyframes atelierShimmer {
    0%   { opacity:0.03; }
    50%  { opacity:0.07; }
    100% { opacity:0.03; }
  }

  /* ── World tap — all interactive elements ── */
  .world-tap {
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
    cursor:pointer;
  }
  .world-tap:active { opacity:0.70; transition:opacity 0.12s ease; }

  /* ── World scroll ── */
  .world-scroll { scrollbar-width:none; -ms-overflow-style:none; -webkit-overflow-scrolling:touch; }
  .world-scroll::-webkit-scrollbar { display:none; }

  /* ── World card ── */
  .world-card {
    background:rgba(255,255,255,0.82);
    backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);
    will-change:transform;
  }
`,Xe=o.createContext(null);function Vt(){const e=o.useContext(Xe);return e||{push:()=>{},pop:()=>null,current:()=>null,hasReturn:()=>!1,setReturnProfile:()=>{},getReturnProfile:()=>null,clearReturnProfile:()=>{}}}function Yt(){const e=[];let s=null;return{push(t){if(t!=null&&t.surface){var r=Object.assign({timestamp:Date.now()},t);e.push(r),e.length>10&&e.shift()}},pop(){return e.pop()??null},current(){return e.length>0?e[e.length-1]:null},hasReturn(){return e.length>0},setReturnProfile(t){s=t??null},getReturnProfile(){return s},clearReturnProfile(){s=null}}}o.createContext(null);o.createContext(null);const Qe=o.createContext(null);function zt(){return o.useContext(Qe)||null}function Gt({children:e}){const{user:s,profile:t,isWirker:r,hasTalentProfile:n,isMember:a,refreshProfile:i,authChecked:c}=ct();o.useMemo(()=>t?Rt(t):null,[t==null?void 0:t.id,t==null?void 0:t.updated_at,t==null?void 0:t.membership_type,t==null?void 0:t.has_talent_profile]);const p=ut(),[u,f,g]=Tt("feed");d.useEffect(()=>{c&&g()},[c,g]);const[k,Ze]=d.useState("feed"),[z,we]=d.useState(null),{ref:et}=Ot(u);At(s==null?void 0:s.id);const S=ft(t),L=!S,H=S;o.useEffect(()=>{S?localStorage.setItem("hui_talent","1"):t&&t.is_member===!1&&!t.has_talent_profile&&localStorage.removeItem("hui_talent")},[S,t]);const[j,tt]=o.useState(null),[V,st]=o.useState("");o.useEffect(()=>{var l;t&&(tt(t),st(t.display_name||((l=t.email)==null?void 0:l.split("@")[0])||""))},[t==null?void 0:t.id,t==null?void 0:t.membership_type,t==null?void 0:t.has_talent_profile,t==null?void 0:t.updated_at]);const[G,ot]=o.useState(null),[K,$]=o.useState(null),[q,C]=o.useState(null),[J,v]=o.useState(!1),[X,rt]=o.useState(!1),Q=d.useRef(!1),nt=d.useCallback(l=>{const A=typeof l=="function"?l(Q.current):l;Q.current=A,rt(A)},[]),[Z,I]=o.useState(null),[w,ee]=o.useState(!1),[te,se]=o.useState(!1),[oe,re]=o.useState(!1),[ne,ae]=o.useState(!1),B=o.useRef(Yt()).current,{openOrbWorld:ie,closeOrbWorld:E,isOrbOpen:R,orbState:le}=mt(),[ce,ue]=o.useState(!1),[fe,me]=o.useState(!1),[pe,he]=o.useState(!1),[be,de]=o.useState(!1),[ye,Se]=o.useState(null),[ge,ke]=o.useState(null),[ve,_e]=o.useState(null),[xe,Ce]=o.useState(!1),[Ie,Ee]=o.useState(!1),[Re,Oe]=o.useState(null),[Ae,Fe]=o.useState(null),{cart:Te,setCart:at,clearCart:Ne}=Pt(s==null?void 0:s.id),{activeSurface:M}=pt(),[D,Be]=o.useState({query:"",typeFilter:null,category:null,active:!1,radiusKm:null,geo:null}),{tabFeed:P,tabDiscover:U,tabImpact:W,tabFavorites:Y}=Nt(u,M,D.active),Me=P,De=U,Pe=W,Ue=Y,O=o.useCallback(()=>{$(null),C(null),Se(null),ke(null),_e(null),Ce(!1),Ee(!1),Fe(null),de(!1),re(!1),se(!1),I==null||I(null),ee(!1),ae(!1),ue(!1),Oe(null),v(!1);try{sessionStorage.removeItem("hui_mein_hui_open")}catch{}me(!1),he(!1),R&&E("tab-switch")},[E,R,v]),_=o.useCallback(l=>{ht(l)&&(Ze(u),we({from:u,to:l,timestamp:Date.now()}),O(),f(l))},[f,u,O]),x=o.useCallback(()=>{O(),f("creator"),v(!0);try{sessionStorage.setItem("hui_mein_hui_open","1")}catch{}},[f,v,O]),We=x,Ye=d.useCallback(l=>{if(!l||typeof l!="string"||l.trim()==="")return;const A=l.trim();C(A)},[]),ze=d.useCallback(()=>{C(null)},[]),Le=o.useCallback(l=>{if(l==="creator"||l==="profile"){f("creator"),x();return}if(l==="impact"){_("impact");return}_(l)},[f,x,_]),it=o.useMemo(()=>({user:s,authProfile:t,isTalent:S,isBaseUser:L,canCreate:H,isMember:a,currentUser:j,userName:V,tab:u,switchTab:_,handleTab:Le,mainScrollRef:et,keepFeed:Me,keepDiscover:De,keepImpact:Pe,keepFavorites:Ue,tabFeed:P,tabDiscover:U,tabImpact:W,tabFavorites:Y,searchState:D,setSearchState:Be,activeSurface:M,prevTab:k,carryOver:z,isOrbOpen:R,openOrbWorld:ie,closeOrbWorld:E,orbState:le,activeMood:G,setActiveMood:ot,liveNotifCount:p,showWirker:K,setShowWirker:$,selectedProfileId:q,setSelectedProfileId:C,showCreatorDashboard:J,setShowCreatorDashboard:v,openCreatorDashboard:x,openProfileById:Ye,closeProfileById:ze,showChat:X,setShowChat:nt,chatRecipient:Z,setChatRecipient:I,showNotifs:w,setShowNotifs:ee,showMap:te,setShowMap:se,showMatch:oe,setShowMatch:re,showMembership:ne,setShowMembership:ae,showPlusSheet:ce,setShowPlusSheet:ue,showConnect:fe,setShowConnect:me,showTalentFlow:pe,setShowTalentFlow:he,showCreatorDash:be,setShowCreatorDash:de,showWerkDetail:ye,setShowWerkDetail:Se,showWerkCheckout:ge,setShowWerkCheckout:ke,showBookingFlow:ve,setShowBookingFlow:_e,showWerkeKorb:xe,setShowWerkeKorb:Ce,showUnterstutzenFlow:Ie,setShowUnterstutzenFlow:Ee,createType:Re,setCreateType:Oe,activeStory:Ae,setActiveStory:Fe,cart:Te,setCart:at,clearCartPersist:Ne,openOwnProfile:We,flowStore:B}),[s,t,S,L,H,a,j,V,u,_,Le,Me,De,Pe,Ue,P,U,W,Y,D,Be,M,k,z,R,ie,E,le,G,p,K,q,J,x,Ye,ze,X,Z,w,te,oe,ne,ce,fe,pe,be,ye,ge,xe,Ie,ve,Re,Ae,Te,Ne,We,B]);return h.jsxs(h.Fragment,{children:[h.jsx("style",{children:Wt}),h.jsx(Ct,{onTabChange:f,children:h.jsx(Xe.Provider,{value:B,children:h.jsx(Qe.Provider,{value:it,children:h.jsx(Ut,{children:e})})})})]})}export{St as D,yt as E,Gt as H,F as I,kt as S,Vt as a,Rt as c,zt as u};

export const SEED_PEOPLE = [
  { id:"p1", name:"Mia Waldmann",  bio:"Naturpädagogin & Waldcoach",       location:"München", avatar:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80", impact:4200 },
  { id:"p2", name:"Jonas Kreuz",   bio:"Musiker & Community Builder",      location:"Berlin",  avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", impact:6800 },
  { id:"p3", name:"Lena Stern",    bio:"Meditationslehrerin & Heilerin",   location:"Hamburg", avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80", impact:6100 },
  { id:"p4", name:"Timo Berger",   bio:"Permakultur & Saatgut Hüter",      location:"Freiburg",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80", impact:7200 },
  { id:"p5", name:"Anna Kowalski", bio:"Künstlerin & Kreativraum Kuratorin",location:"Wien",   avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", impact:6500 },
  { id:"p6", name:"Felix Braun",   bio:"Tierheim-Aktivist & Hundefreund",  location:"Leipzig", avatar:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80", impact:2800 },
];
export const SEED_MOMENTE = [
  { id:"m1", src:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=280&q=75", caption:"Waldspaziergang & Waldbaden im Englischen Garten", name:"Mia W.", location:"München",     created_at: new Date(Date.now()-3600000*1).toISOString(),    type:"foto" },
  { id:"m2", src:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=280&q=75", caption:"Stille Morgenrunde beim Café Lichtblick",          name:"Lena S.", location:"Hamburg",    created_at: new Date(Date.now()-3600000*2).toISOString(),    type:"foto" },
  { id:"m3", src:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75", caption:"Akustik Abend im Kiez — alle sind willkommen",     name:"Jonas K.", location:"Berlin",    created_at: new Date(Date.now()-3600000*3).toISOString(),    type:"foto" },
  { id:"m4", src:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=280&q=75", caption:"Sonnenaufgang Meditation",                         name:"Lena S.", location:"Hamburg",    created_at: new Date(Date.now()-3600000*5).toISOString(),    type:"foto" },
  { id:"m5", src:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75", caption:"Tierheim Besuchstag – helfen macht glücklich",       name:"Felix B.", location:"Leipzig",    created_at: new Date(Date.now()-3600000*6).toISOString(),    type:"foto" },
  { id:"m6", src:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75", caption:"Kreativworkshop für Kinder",                      name:"Anne K.", location:"Wien",        created_at: new Date(Date.now()-3600000*8).toISOString(),    type:"foto" },
];

export const SEED_TALENTE = [
  { id:"t1", title:"Gitarrenunterricht für Anfänger", category:"Musik & Klang", cover:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=280&q=75", author:"Jonas K.", price_per_hour:35, currency:"EUR", location_type:"online" },
  { id:"t2", title:"Personal Yoga Coaching",           category:"Fitness & Bewegung", cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=280&q=75", author:"Lena S.", price_per_session:60, currency:"EUR", location_type:"vor_ort" },
];

export const TALENT_LOCATION_LABEL = { online:"Online", vor_ort:"Vor Ort", hybrid:"Online & Vor Ort" };
export const CARD_RADIUS = 16;

export const SEED_WERKE = [
  { id:"w1", title:"Farben der Stille",   medium:"Malerei",   cover:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=280&q=75",   author:"Anna K.", likes:128 },
  { id:"w2", title:"Seelenklang",          medium:"Musik",     cover:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=280&q=75",  author:"Jonas K.", likes:96  },
  { id:"w3", title:"Küstenrauschen",       medium:"Fotografie",cover:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75",  author:"Timo B.", likes:87  },
  { id:"w4", title:"Freiheitsvogel",       medium:"Illustration",cover:"https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=280&q=75",author:"Mia W.", likes:64  },
  { id:"w5", title:"Verbunden",            medium:"Skulptur",  cover:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=280&q=75",     author:"Lena S.", likes:63  },
  { id:"w6", title:"Kleiner Moment",       medium:"Text",      cover:null,                                                                          author:"Felix B.", likes:42  },
];

export const MEDIUM_COLOR = {
  "Malerei":    { bg:"rgba(147,51,234,0.12)",  text:"#9333EA" },
  "Musik":      { bg:"rgba(14,196,184,0.12)",  text:T.teal    },
  "Fotografie": { bg:"rgba(22,163,74,0.12)",   text:"#16A34A" },
  "Illustration":{ bg:"rgba(232,87,58,0.12)", text:T.coral    },
  "Skulptur":   { bg:"rgba(245,158,11,0.12)",  text:"#D97706" },
  "Text":       { bg:"rgba(100,116,139,0.12)", text:"#64748B" },
};

export const SEED_ERLEBNISSE = [
  { id:"e1", title:"Yoga im Park",              date:"30", month:"Mai",  dayLabel:"Heute",  time:"18:00", location:"München",  spots:12, cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=280&q=75" },
  { id:"e2", title:"Urban Gardening Workshop",  date:"31", month:"Mai",  dayLabel:"Morgen", time:"10:00", location:"Hamburg",  spots:8,  cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75" },
  { id:"e3", title:"Gitarre für Anfänger",      date:"02", month:"Jun",  dayLabel:"Mo",     time:"19:00", location:"Berlin",   spots:6,  cover:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=280&q=75" },
  { id:"e4", title:"Acryl Malen für Einsteiger",date:"04", month:"Jun",  dayLabel:"Mi",     time:"17:00", location:"Leipzig",  spots:7,  cover:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=280&q=75" },
  { id:"e5", title:"Sonnenaufgang Wanderung",   date:"06", month:"Jun",  dayLabel:"Fr",     time:"05:00", location:"Freiburg", spots:10, cover:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=280&q=75" },
  { id:"e6", title:"Tierheim Helfer Tag",       date:"07", month:"Jun",  dayLabel:"Sa",     time:"11:00", location:"Leipzig",  spots:9,  cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75" },
];
export const SEED_PROJEKTE = [
  { id:"pr1", title:"Stadtgarten Netz",    desc:"Gemeinschaftliche Gärten in 12 Städten",              members:47, cat:"Natur",     cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75", catColor:{ bg:"rgba(22,163,74,0.12)", text:"#16A34A" } },
  { id:"pr2", title:"Tierheim Netzwerk",   desc:"Moralische Unterstützung & Vermittlung",               members:133,cat:"Tiere",     cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75", catColor:{ bg:"rgba(217,119,6,0.12)", text:"#D97706" } },
  { id:"pr3", title:"Küsten Cleanup",      desc:"Kostenlose Aktionen für unsere Meere",                members:89, cat:"Umwelt",    cover:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75", catColor:{ bg:"rgba(14,196,184,0.12)", text:T.teal    } },
  { id:"pr4", title:"Musik für alle",      desc:"Kostenlose Konzerte in Parks",                        members:63, cat:"Kultur",    cover:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75", catColor:{ bg:"rgba(99,102,241,0.12)", text:"#6366F1" } },
  { id:"pr5", title:"Kunst für Kinder",    desc:"Kreativworkshops für Kinder & Jugendliche",            members:76, cat:"Bildung",   cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75", catColor:{ bg:"rgba(232,87,58,0.12)", text:T.coral   } },
  { id:"pr6", title:"Klima Zukunft",       desc:"Bildung & Aktionen für eine bessere Welt",            members:54, cat:"Klima",     cover:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=280&q=75", catColor:{ bg:"rgba(22,163,74,0.12)", text:"#16A34A" } },
];

export const SEED_ORTE = [
  { id:"o1", name:"Waldlichtung",      city:"München",  dist:"0,3 km",  active:8,  nextEvent:null,           cover:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=75"  },
  { id:"o2", name:"Community Garten",  city:"Hamburg",  dist:"1,2 km",  active:12, nextEvent:null,           cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=75"  },
  { id:"o3", name:"Atelier Raum",      city:"Berlin",   dist:"2,7 km",  active:9,  nextEvent:null,           cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"  },
  { id:"o4", name:"Meditationsraum",   city:"Freiburg", dist:"3,1 km",  active:7,  nextEvent:"morgen",       cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=75"     },
  { id:"o5", name:"Tierheim Treffpunkt",city:"Leipzig", dist:"4,0 km",  active:6,  nextEvent:"Heute 3 Begegnungen", cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=75"},
  { id:"o6", name:"Kreativwerkstatt",  city:"Wien",     dist:"4,5 km",  active:9,  nextEvent:null,           cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"  },
];


export const T = {
  bg:       "#F9F7F4",
  white:    "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.18)",
  coral:    "#E8573A",
  coralSoft:"rgba(232,87,58,0.10)",
  ink:      "#1A3530",
  inkSoft:  "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.32)",
  border:   "rgba(26,53,48,0.07)",
  px:       16,
  cardShadow:"0 2px 14px rgba(26,53,48,0.07), 0 1px 3px rgba(26,53,48,0.04)",
  cardShadowHover:"0 6px 24px rgba(26,53,48,0.11), 0 2px 8px rgba(26,53,48,0.06)",
};

// ── Global CSS ───────────────────────────────────────────────────
export const CSS = `
  .dp-root * { box-sizing:border-box; }
  .dp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; overscroll-behavior-x:none; }
  .dp-hscroll::-webkit-scrollbar { display:none; }
  .dp-press { transition:transform .14s cubic-bezier(.22,1,.36,1),opacity .14s ease; cursor:pointer; }
  .dp-press:active { transform:scale(0.94); opacity:0.80; }
  @keyframes dp-in  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dp-shim { from{background-position:-200% 0} to{background-position:200% 0} }
  .dp-in  { animation:dp-in .45s ease both; }
  .dp-skel {
    background:linear-gradient(90deg,rgba(26,53,48,.05) 25%,rgba(26,53,48,.09) 50%,rgba(26,53,48,.05) 75%);
    background-size:200% 100%;
    animation:dp-shim 1.4s ease-in-out infinite;
    border-radius:12px;
  }
  .dp-card-hover { transition:box-shadow .18s ease, transform .18s cubic-bezier(.22,1,.36,1); }
  .dp-card-hover:hover { box-shadow:0 6px 24px rgba(26,53,48,0.11)!important; transform:translateY(-2px); }
  @keyframes dp-live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
  .dp-live-dot { animation:dp-live-pulse 2.2s ease-in-out infinite; }
  /* List view */
  .dp-list-section { display:flex; flex-direction:column; gap:10px; padding:0 16px; }
  .dp-list-card { display:flex; align-items:center; gap:12px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 14px rgba(26,53,48,0.07),0 1px 3px rgba(26,53,48,0.04); border:1px solid rgba(26,53,48,0.07); padding:10px; cursor:pointer; transition:transform .14s,opacity .14s; }
  .dp-list-card:active { transform:scale(0.97); opacity:0.82; }
  .dp-list-thumb { width:58px; height:58px; border-radius:12px; object-fit:cover; flex-shrink:0; background:rgba(14,196,184,0.08); }
  .dp-list-thumb-placeholder { width:58px; height:58px; border-radius:12px; flex-shrink:0; background:rgba(14,196,184,0.08); display:flex; align-items:center; justify-content:center; font-size:22px; }
  /* Toggle animation */
  @keyframes dp-toggle-in { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  .dp-toggle-in { animation:dp-toggle-in .18s ease both; }
  /* Live Activity Bar */
  @keyframes dp-activity-slide { from{transform:translateX(8px);opacity:0} to{transform:translateX(0);opacity:1} }
  .dp-activity-card { animation:dp-activity-slide .35s cubic-bezier(.22,1,.36,1) both; }
  /* Online Pulse */
  @keyframes dp-online-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 0 4px rgba(34,197,94,0)} }
  .dp-online-pulse { animation:dp-online-pulse 2.4s ease-in-out infinite; }
  /* Stat card hover */
  .dp-stat-card { transition:transform .15s ease,box-shadow .15s ease; cursor:default; }
  .dp-stat-card:hover { transform:translateY(-2px); }
  /* Projekt Hero */
  .dp-projekt-hero { transition:transform .2s ease,box-shadow .2s ease; cursor:pointer; }
  .dp-projekt-hero:hover { transform:scale(1.01); }
  /* Tag pills */
  .dp-tag { display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:600;cursor:default; }
  /* Moment engagement row */
  .dp-engage { display:flex;align-items:center;gap:10px;font-size:10px;color:rgba(26,53,48,0.50); }
  .dp-engage span { display:flex;align-items:center;gap:3px; }
`;

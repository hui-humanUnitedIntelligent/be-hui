import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  coral:  "#FF6B5B",
  teal:   "#2ABFAC",
  gold:   "#F5A623",
  purple: "#A78BFA",
  ink:    "#1A1A2E",
  muted:  "#6B7280",
  surface:"#F8F7F5",
  green:  "#10B981",
};

const MOCK_POOL = { total: 3847.50, month: "Mai 2026", distributed: 2100 };
const MOCK_PROJECTS = [
  { id:"p1", name:"Stadtgarten München", category:"Umwelt", description:"Gemeinschaftsgärten in urbanen Quartieren — frische Luft, echte Gemeinschaft.", icon:"🌿", color:C.teal, votes:142, status:"aktiv", goal:800, raised:520, website:"stadtgarten.de", tags:["Natur","Community","München"] },
  { id:"p2", name:"Lernwerkstatt Hamburg", category:"Bildung", description:"Kostenlose Workshops und Nachhilfe für Kinder aus einkommensschwachen Familien.", icon:"📚", color:C.coral, votes:98, status:"aktiv", goal:600, raised:380, website:"lernwerkstatt-hh.de", tags:["Bildung","Kinder","Hamburg"] },
  { id:"p3", name:"Repair Café Berlin", category:"Nachhaltigkeit", description:"Kaputt? Nicht wegwerfen! Ehrenamtliche reparieren alles — von Toaster bis Fahrrad.", icon:"🔧", color:C.gold, votes:67, status:"aktiv", goal:400, raised:190, website:"repaircafe-berlin.de", tags:["Nachhaltigkeit","DIY","Berlin"] },
];

// ── Animierter Zähler ─────────────────────────────────────────
function AnimatedNumber({ value, prefix="", suffix="", duration=1800, decimals=0 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    ref.current = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(ref.current); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(ref.current);
  }, [value, duration]);
  return <span>{prefix}{decimals ? display.toFixed(decimals) : Math.floor(display)}{suffix}</span>;
}

// ── Pool-Visualisierung ───────────────────────────────────────
function ImpactPoolHero({ pool, myContribution }) {
  const pct = Math.min((pool.total / 5000) * 100, 100);
  return (
    <div style={{ margin:"16px", borderRadius:24, overflow:"hidden",
      background:`linear-gradient(160deg, ${C.teal} 0%, ${C.teal}CC 40%, ${C.coral}80 100%)`,
      padding:"28px 24px", position:"relative" }}>

      {/* Dekorative Kreise */}
      <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160,
        borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
      <div style={{ position:"absolute", bottom:-30, left:-20, width:100, height:100,
        borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />

      <div style={{ position:"relative" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.75)", marginBottom:4, letterSpacing:1 }}>
          IMPACT POOL · {pool.month}
        </div>
        <div style={{ fontSize:44, fontWeight:900, color:"white", marginBottom:4 }}>
          <AnimatedNumber value={pool.total} prefix="€ " suffix="" decimals={2} />
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginBottom:20 }}>
          gesammelt für Projekte mit Herz
        </div>

        {/* Progress Bar */}
        <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:999, height:10, marginBottom:8 }}>
          <div style={{ height:"100%", borderRadius:999, background:"white",
            width:`${pct}%`, transition:"width 1.5s ease" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.7)" }}>
          <span>{pct.toFixed(0)}% zum Monatsziel</span>
          <span>Ziel: € 5.000</span>
        </div>

        {/* Mein Beitrag */}
        {myContribution > 0 && (
          <div style={{ marginTop:20, background:"rgba(255,255,255,0.15)",
            backdropFilter:"blur(8px)", borderRadius:14, padding:"12px 16px",
            display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:24 }}>🌱</div>
            <div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>Dein Beitrag diesen Monat</div>
              <div style={{ fontSize:20, fontWeight:900, color:"white" }}>€ {myContribution.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Projekt-Karte mit Abstimmung ──────────────────────────────
function ProjectCard({ project, rank, myVote, onVote }) {
  const [voted, setVoted] = useState(myVote === project.id);
  const [votes, setVotes] = useState(project.votes);
  const totalVotes = MOCK_PROJECTS.reduce((s,p) => s + p.votes, 0);
  const votePct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
  const isLeading = rank === 1;

  function handleVote() {
    if (voted) return;
    setVoted(true);
    setVotes(v => v + 1);
    if (onVote) onVote(project.id);
  }

  return (
    <div className="hui-card hui-fade-in"
      style={{ margin:"0 16px 16px", overflow:"hidden",
        border: isLeading ? `2px solid ${project.color}40` : "2px solid transparent" }}>

      {/* Bild-Header */}
      <div style={{ height:140, background:`linear-gradient(135deg, ${project.color}30, ${project.color}10)`,
        display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <div style={{ fontSize:64 }}>{project.icon}</div>
        {isLeading && (
          <div style={{ position:"absolute", top:12, right:12,
            background:`linear-gradient(135deg, ${C.gold}, ${C.coral})`,
            color:"white", borderRadius:20, padding:"4px 12px",
            fontSize:11, fontWeight:800 }}>🏆 Führend</div>
        )}
        {/* Kategorie */}
        <div style={{ position:"absolute", top:12, left:12,
          background:`${project.color}20`, color:project.color,
          borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>
          {project.category}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"16px" }}>
        <div style={{ fontWeight:900, fontSize:18, color:C.ink, marginBottom:6 }}>{project.name}</div>
        <div style={{ fontSize:13, color:"#555", lineHeight:1.65, marginBottom:14 }}>{project.description}</div>

        {/* Tags */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {project.tags.map((t,i) => (
            <span key={i} style={{ background:`${project.color}12`, color:project.color,
              borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{t}</span>
          ))}
        </div>

        {/* Abstimmungs-Bar */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{votes} Stimmen</span>
            <span style={{ fontSize:12, fontWeight:800, color:project.color }}>{votePct.toFixed(0)}%</span>
          </div>
          <div style={{ background:"#F0F0EE", borderRadius:999, height:8 }}>
            <div style={{ height:"100%", borderRadius:999, background:project.color,
              width:`${votePct}%`, transition:"width 0.8s ease" }} />
          </div>
        </div>

        {/* Fundraising */}
        <div style={{ background:`${project.color}08`, borderRadius:14,
          padding:"12px 14px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12, color:C.muted }}>Förderziel</span>
            <span style={{ fontSize:13, fontWeight:800, color:project.color }}>€ {project.goal}</span>
          </div>
          <div style={{ background:`${project.color}20`, borderRadius:999, height:6 }}>
            <div style={{ height:"100%", borderRadius:999, background:project.color,
              width:`${(project.raised/project.goal)*100}%`, transition:"width 1s ease" }} />
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
            € {project.raised} von € {project.goal} gesammelt
          </div>
        </div>

        {/* Vote Button */}
        <button onClick={handleVote} disabled={voted}
          style={{ width:"100%", padding:"14px", fontSize:14, fontWeight:800,
            borderRadius:16, border:"none", cursor: voted ? "default" : "pointer",
            background: voted
              ? `linear-gradient(135deg, ${C.green}, ${C.teal})`
              : `linear-gradient(135deg, ${project.color}, ${project.color}CC)`,
            color:"white", transition:"all 0.3s",
            boxShadow: voted ? "none" : `0 4px 16px ${project.color}44` }}>
          {voted ? "✓ Deine Stimme ist gezählt" : `🗳️ Für ${project.name.split(" ")[0]} stimmen`}
        </button>
      </div>
    </div>
  );
}

// ── Impact Timeline (letzte Transaktionen) ────────────────────
function ImpactTimeline({ transactions }) {
  const items = transactions.length > 0 ? transactions : [
    { id:1, amount:2.81, created_at:"2026-05-06T14:30:00Z", project:"Stadtgarten München" },
    { id:2, amount:1.69, created_at:"2026-05-06T12:00:00Z", project:"Lernwerkstatt Hamburg" },
    { id:3, amount:4.50, created_at:"2026-05-05T18:20:00Z", project:"Repair Café Berlin" },
    { id:4, amount:2.25, created_at:"2026-05-05T10:00:00Z", project:"Stadtgarten München" },
  ];
  return (
    <div style={{ margin:"0 16px 16px" }}>
      <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:12 }}>
        🌱 Letzte Beiträge
      </div>
      <div className="hui-card" style={{ overflow:"hidden" }}>
        {items.slice(0,5).map((tx, i) => (
          <div key={tx.id} style={{ display:"flex", alignItems:"center", gap:12,
            padding:"12px 16px", borderBottom: i < items.length-1 ? "1px solid #F5F5F3" : "none" }}>
            <div style={{ width:36, height:36, borderRadius:"50%",
              background:`${C.teal}15`, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:16, flexShrink:0 }}>🌱</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>
                € {Number(tx.amount).toFixed(2)} fließen ein
              </div>
              <div style={{ fontSize:11, color:C.muted }}>
                {tx.project || "Impact Pool"} · {new Date(tx.created_at).toLocaleDateString("de-DE")}
              </div>
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:C.teal }}>+{Number(tx.amount).toFixed(2)} €</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Wie funktioniert HUI-Impact? ──────────────────────────────
function HowItWorks() {
  const steps = [
    { icon:"🛒", title:"Du buchst ein Talent", text:"Jede Buchung auf HUI enthält automatisch einen kleinen Impact-Anteil." },
    { icon:"💰", title:"2,5 % fließen in den Pool", text:"Von jeder Transaktion gehen 2,5 % in den monatlichen Impact Pool." },
    { icon:"🗳️", title:"Talente wählen das Projekt", text:"Alle Wirker stimmen gemeinsam ab, welches Projekt gefördert wird." },
    { icon:"🌱", title:"Das Geld wirkt wirklich", text:"Das Gewinnerprojekt erhält den vollen Betrag — kein Verwaltungsaufwand." },
  ];
  return (
    <div style={{ margin:"0 16px 24px" }}>
      <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:16 }}>
        💡 Wie funktioniert HUI Impact?
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ width:44, height:44, borderRadius:"50%",
              background:`linear-gradient(135deg, ${C.teal}15, ${C.coral}10)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, flexShrink:0, border:`1.5px solid ${C.teal}20` }}>
              {s.icon}
            </div>
            <div style={{ flex:1, paddingTop:2 }}>
              <div style={{ fontWeight:800, fontSize:14, color:C.ink, marginBottom:2 }}>{s.title}</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.5 }}>{s.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hauptseite ────────────────────────────────────────────────
export default function ImpactPage({ currentUser }) {
  const [tab, setTab] = useState("abstimmen"); // abstimmen | pool | dein
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [pool, setPool] = useState(MOCK_POOL);
  const [transactions, setTransactions] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [myContrib, setMyContrib] = useState(12.75); // Mock
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: poolData } = await supabase
          .from("impact_pool").select("*").limit(1).single();
        if (poolData) setPool(p => ({ ...p, total: poolData.total_amount }));

        const { data: projData } = await supabase
          .from("impact_projects")
          .select("*")
          .eq("is_active", true)
          .order("votes", { ascending: false })
          .limit(3);
        if (projData?.length) setProjects(projData);

        const { data: txData } = await supabase
          .from("impact_transactions")
          .select("*")
          .eq("reversed", false)
          .order("created_at", { ascending: false })
          .limit(10);
        if (txData?.length) setTransactions(txData);
      } catch(e) {}
      setLoading(false);
    }
    load();
  }, []);

  const TABS = [
    ["abstimmen", "🗳️", "Abstimmen"],
    ["pool", "💰", "Pool"],
    ["dein", "🌱", "Dein Impact"],
  ];

  return (
    <div style={{ paddingBottom:90, background:C.surface, minHeight:"100vh" }}>
      {/* Hero */}
      <ImpactPoolHero pool={pool} myContribution={myContrib} />

      {/* Tabs */}
      <div style={{ display:"flex", margin:"0 16px 16px",
        background:"white", borderRadius:16, padding:4, gap:4,
        boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        {TABS.map(([key, icon, label]) => (
          <button key={key} onClick={()=>setTab(key)}
            style={{ flex:1, padding:"10px 4px", border:"none", cursor:"pointer",
              borderRadius:12, fontSize:12, fontWeight: tab===key ? 800 : 500,
              background: tab===key ? `linear-gradient(135deg, ${C.teal}15, ${C.coral}08)` : "transparent",
              color: tab===key ? C.teal : C.muted,
              transition:"all 0.2s" }}>
            <div style={{ fontSize:16, marginBottom:2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Abstimmen */}
      {tab === "abstimmen" && (
        <>
          <div style={{ padding:"0 16px 12px" }}>
            <div style={{ fontWeight:900, fontSize:18, color:C.ink, marginBottom:4 }}>
              Wähle das Projekt des Monats
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.5 }}>
              Deine Stimme bestimmt, welches Projekt die Förderung bekommt. Jeder Wirker hat eine Stimme pro Monat.
            </div>
          </div>
          {projects
            .sort((a,b) => b.votes - a.votes)
            .map((p, i) => (
              <ProjectCard key={p.id} project={p} rank={i+1} myVote={myVote} onVote={setMyVote} />
            ))
          }
          <HowItWorks />
        </>
      )}

      {/* Tab: Pool */}
      {tab === "pool" && (
        <>
          <ImpactTimeline transactions={transactions} />
          <div style={{ margin:"0 16px 16px" }}>
            <div className="hui-card" style={{ padding:"20px",
              background:`linear-gradient(135deg, ${C.teal}08, ${C.coral}05)` }}>
              <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:16 }}>
                📊 Monatsübersicht
              </div>
              {[
                ["Gesamteinnahmen Pool", `€ ${pool.total.toFixed(2)}`, C.teal],
                ["Bereits verteilt", `€ ${pool.distributed.toFixed(2)}`, C.coral],
                ["Verfügbar", `€ ${(pool.total - (pool.distributed||0)).toFixed(2)}`, C.gold],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"10px 0", borderBottom:"1px solid #F5F5F3" }}>
                  <span style={{ fontSize:14, color:C.muted }}>{label}</span>
                  <span style={{ fontSize:16, fontWeight:900, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <HowItWorks />
        </>
      )}

      {/* Tab: Dein Impact */}
      {tab === "dein" && (
        <div style={{ padding:"0 16px" }}>
          {/* Mein Impact Hero */}
          <div className="hui-card" style={{ padding:"24px", marginBottom:16,
            background:`linear-gradient(160deg, ${C.teal}12, ${C.coral}06)`,
            border:`1.5px solid ${C.teal}20` }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:52, marginBottom:8 }}>🌱</div>
              <div style={{ fontWeight:900, fontSize:32, color:C.teal }}>
                € {myContrib.toFixed(2)}
              </div>
              <div style={{ fontSize:14, color:C.muted, marginTop:4 }}>
                dein Impact-Beitrag dieses Jahr
              </div>
            </div>
            <div style={{ display:"flex", gap:0, background:"rgba(255,255,255,0.7)",
              borderRadius:14, overflow:"hidden" }}>
              {[["3", "Projekte"], ["12", "Buchungen"], ["2", "Stimmen"]].map(([v,l]) => (
                <div key={l} style={{ flex:1, textAlign:"center", padding:"12px 8px" }}>
                  <div style={{ fontWeight:900, fontSize:20, color:C.ink }}>{v}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Unterstützte Projekte */}
          <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:12 }}>
            Projekte die du unterstützt hast
          </div>
          {MOCK_PROJECTS.slice(0,2).map((p,i) => (
            <div key={i} className="hui-card" style={{ padding:"14px 16px", marginBottom:12,
              display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ fontSize:28 }}>{p.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>{p.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>{p.category}</div>
              </div>
              <div style={{ fontWeight:800, fontSize:14, color:p.color }}>
                +€ {(myContrib / 2).toFixed(2)}
              </div>
            </div>
          ))}

          {/* Teilen */}
          <div className="hui-card" style={{ padding:"20px", marginTop:8,
            background:`linear-gradient(135deg, ${C.purple}10, ${C.teal}08)`,
            border:`1.5px solid ${C.purple}20`, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>✨</div>
            <div style={{ fontWeight:800, fontSize:15, color:C.ink, marginBottom:6 }}>
              Teile deinen Impact
            </div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>
              Zeig deinem Netzwerk was möglich ist, wenn wir gemeinsam handeln.
            </div>
            <button className="hui-btn-primary" style={{ padding:"12px 32px", fontSize:14 }}>
              Impact teilen ↗️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/ProfileSectionsDemo.jsx
// ══════════════════════════════════════════════════════════════════════
// SPRINT C — Demo: alle unified Profile Sections in allen Zuständen
//
// Rendert 4 Szenarien:
//   1. Basis + Owner    — editable, empty states mit Handlungsaufforderung
//   2. Basis + Visitor  — read-only, empty states mit Info
//   3. Talent + Owner   — wie 1, aber mit works / exps / skills
//   4. Talent + Visitor — wie 2, mit echter content
//
// NICHT für Produktion — nur Sprint-Verifikation.
// ══════════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import { AboutSection }           from "../components/profile/sections/AboutSection.jsx";
import { TalentSection }          from "../components/profile/sections/TalentSection.jsx";
import { WorksSection }           from "../components/profile/sections/WorksSection.jsx";
import { ExperiencesSection }     from "../components/profile/sections/ExperiencesSection.jsx";
import { RecommendationsSection } from "../components/profile/sections/RecommendationsSection.jsx";
import { AvailabilitySection }    from "../components/profile/sections/AvailabilitySection.jsx";
import { LocationSection }        from "../components/profile/sections/LocationSection.jsx";
import { VisibilitySection }      from "../components/profile/sections/VisibilitySection.jsx";
import { MomentsSection }         from "../components/profile/sections/MomentsSection.jsx";

// ── Demo-Daten ────────────────────────────────────────────────────────
const PROFILE_TALENT = {
  id:"demo-t1", display_name:"Lena Hartmann", username:"lena.hartmann",
  bio:"Ich erschaffe Räume, die Menschen verbinden. Fotografie, Klang und stille Momente.",
  avatar_url:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80",
  header_img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80",
  location_final:"München, Bayern", is_talent:true, focus_type:"open", visibility:"connections",
  skills_final:[
    {icon:"📸",label:"Fotografie"},{icon:"🎵",label:"Musik"},
    {icon:"🎨",label:"Malerei"},{icon:"✍️",label:"Schreiben"},
  ],
};

const PROFILE_MEMBER = {
  id:"demo-m1", display_name:"Jonas Weber", username:"jonas.weber",
  bio:"", avatar_url:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  header_img:null, location_final:"", is_talent:false, focus_type:"private", visibility:"public",
  skills_final:[],
};

const WORKS = [
  { id:"w1", title:"Lichtspiele", cover_url:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&q=80", status:"published", approval_status:"approved" },
  { id:"w2", title:"Klangraum", cover_url:null, status:"pending_review", approval_status:"pending" },
  { id:"w3", title:"Stille", cover_url:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=300&q=80", status:"published", approval_status:"approved" },
];

const EXPERIENCES = [
  { id:"e1", title:"Foto-Workshop München", cover_url:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&q=80", category:"workshop", status:"published", date:"2026-07-15" },
  { id:"e2", title:"Klang-Abend", cover_url:null, category:"event", status:"active", date:"2026-08-01" },
];

const RECOMMENDATIONS = [
  { id:"r1", text:"Lena hat meinen Brand komplett neu gedacht. Absolute Empfehlung!", reviewer_name:"Anna M.", rating:5, work_title:"Logo-Projekt" },
  { id:"r2", text:"Wahnsinnige Energie und Kreativität. Der Workshop war ein Highlight.", reviewer_name:"Tim K.", rating:4, work_title:null },
];

const MOMENTS = [
  { id:"m1", src:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&q=80" },
  { id:"m2", src:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=200&q=80" },
  { id:"m3", src:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80" },
];

// ── Layout-Helpers ────────────────────────────────────────────────────
function Gap({ h=24 }) { return <div style={{ height:h }}/>; }
function ScenarioLabel({ n, label }) {
  return (
    <div style={{
      background:"#1A1A18", color:"#F7F5F0",
      padding:"10px 16px", fontSize:11, fontWeight:700,
      letterSpacing:"0.08em", textTransform:"uppercase",
    }}>
      ─── Szenario {n}: {label} ───
    </div>
  );
}
function Divider() {
  return <div style={{ height:12, background:"#EDE9E2", margin:"24px 0" }}/>;
}

// ── Scenario-Block ────────────────────────────────────────────────────
function ScenarioBlock({ profile, isOwner, works, experiences, recommendations, moments, label, n }) {
  const [bio,         setBio]         = useState(profile.bio || "");
  const [skills,      setSkills]      = useState(profile.skills_final || []);
  const [worksState,  setWorksState]  = useState(works || []);
  const [focusType,   setFocusType]   = useState(profile.focus_type || "open");
  const [location,    setLocation]    = useState(profile.location_final || "");
  const [visibility,  setVisibility]  = useState(profile.visibility || "connections");

  const activeProfile = { ...profile, bio, skills_final:skills, focus_type:focusType, location_final:location, visibility };

  return (
    <div style={{ background:"#F7F5F0", paddingBottom:24 }}>
      <ScenarioLabel n={n} label={label}/>
      <Gap h={20}/>

      <AboutSection
        profile={activeProfile} isOwner={isOwner}
        onSave={v => { setBio(v); console.log("[Demo] Bio →", v); }}
      />
      <Gap/>
      <TalentSection
        profile={activeProfile} isOwner={isOwner}
        onChange={labels => { setSkills(labels.map(l => ({icon:"✨",label:l}))); console.log("[Demo] Skills →", labels); }}
      />
      <Gap/>
      <WorksSection
        works={worksState} isOwner={isOwner}
        onAddWork={() => console.log("[Demo] WerkWizard öffnen")}
        onDeleteWork={id => { setWorksState(prev => prev.filter(w => w.id !== id)); console.log("[Demo] Werk gelöscht:", id); }}
        onShowAll={() => console.log("[Demo] Alle Werke")}
      />
      <Gap/>
      <ExperiencesSection
        experiences={experiences || []} isOwner={isOwner}
        onAddExperience={() => console.log("[Demo] ExpWizard öffnen")}
        onShowAll={() => console.log("[Demo] Alle Erlebnisse")}
      />
      <Gap/>
      <RecommendationsSection
        recommendations={recommendations || []} isOwner={isOwner}
        onAddRec={() => console.log("[Demo] Rec hinzufügen")}
        onShowAll={() => console.log("[Demo] Alle Recs")}
      />
      <Gap/>
      <AvailabilitySection
        profile={activeProfile} isOwner={isOwner}
        onSave={v => { setFocusType(v); console.log("[Demo] focus_type →", v); }}
      />
      <Gap h={12}/>
      <LocationSection
        profile={activeProfile} isOwner={isOwner}
        onSave={v => { setLocation(v); console.log("[Demo] location →", v); }}
      />
      <Gap h={12}/>
      <VisibilitySection
        profile={activeProfile} isOwner={isOwner}
        onSave={v => { setVisibility(v); console.log("[Demo] visibility →", v); }}
      />
      <Gap/>
      <MomentsSection
        moments={moments || []} isOwner={isOwner}
        onAddMoment={() => console.log("[Demo] Moment hinzufügen")}
      />
    </div>
  );
}

// ── Haupt-Demo ────────────────────────────────────────────────────────
export default function ProfileSectionsDemo() {
  const [tab, setTab] = useState(0);

  const scenarios = [
    { n:1, label:"Basis + Owner (leer)",    profile:PROFILE_MEMBER, isOwner:true,  works:[], exps:[], recs:[], moments:[] },
    { n:2, label:"Basis + Visitor (leer)",  profile:PROFILE_MEMBER, isOwner:false, works:[], exps:[], recs:[], moments:[] },
    { n:3, label:"Talent + Owner (gefüllt)",profile:PROFILE_TALENT, isOwner:true,  works:WORKS, exps:EXPERIENCES, recs:RECOMMENDATIONS, moments:MOMENTS },
    { n:4, label:"Talent + Visitor (gefüllt)", profile:PROFILE_TALENT, isOwner:false, works:WORKS, exps:EXPERIENCES, recs:RECOMMENDATIONS, moments:MOMENTS },
  ];

  const s = scenarios[tab];

  return (
    <div style={{ background:"#F7F5F0", minHeight:"100vh" }}>
      <style>{`body{margin:0;} * {box-sizing:border-box;}`}</style>

      {/* Tab-Navigation */}
      <div style={{ position:"sticky", top:0, zIndex:50,
        background:"#1A1A18", padding:"12px 16px", display:"flex", gap:8,
        overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {scenarios.map((sc, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flexShrink:0, padding:"7px 12px", borderRadius:99,
            background: tab === i ? "#0EC4B8" : "rgba(255,255,255,0.12)",
            color: tab === i ? "white" : "rgba(255,255,255,0.65)",
            border:"none", fontSize:11, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", whiteSpace:"nowrap",
          }}>
            {sc.n}. {sc.label.split(" (")[0]}
          </button>
        ))}
      </div>

      <ScenarioBlock
        key={tab}
        n={s.n} label={s.label}
        profile={s.profile} isOwner={s.isOwner}
        works={s.works} experiences={s.exps}
        recommendations={s.recs} moments={s.moments}
      />
    </div>
  );
}

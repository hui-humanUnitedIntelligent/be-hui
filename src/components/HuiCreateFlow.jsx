// HuiCreateFlow.jsx — Instagram-ähnlicher Post Flow im HUI Stil
// Phase 1: Media Picker  →  Phase 2: Edit  →  Phase 3: Details  →  Phase 4: Type
// Keine HuiPlusSheet mehr nötig — direkt in den Flow

import React, {
  useState, useRef, useCallback, useEffect
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth }  from "../lib/AuthContext";

/* ── Brand tokens ─────────────────────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.22)",
  tealPale:"rgba(22,215,197,0.10)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623",  goldPale:"rgba(245,166,35,0.10)",
  purple:"#A78BFA",purplePale:"rgba(167,139,250,0.10)",
  cream:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A",   ink2:"#3A3A3A", ink3:"#5A5A5A",
  muted:"#888",    muted2:"#C0C0C0",
  border:"rgba(0,0,0,0.07)",
  glass:"rgba(255,255,255,0.14)",
  glassDark:"rgba(0,0,0,0.38)",
};

/* ── Global CSS ───────────────────────────────────────────────────── */
const CSS = `
  @keyframes hcfIn    { from{opacity:0;transform:translateY(32px) scale(0.98)} to{opacity:1;transform:none} }
  @keyframes hcfFade  { from{opacity:0} to{opacity:1} }
  @keyframes hcfSlide { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:none} }
  @keyframes hcfSpin  { to{transform:rotate(360deg)} }
  @keyframes hcfPop   { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
  @keyframes hcfShimmer {
    0%   { background-position:-200% 0 }
    100% { background-position:200% 0 }
  }
  .hcf-tap { -webkit-tap-highlight-color:transparent; cursor:pointer; }
  .hcf-tap:active { transform:scale(0.94); transition:transform .12s; }
  .hcf-scroll::-webkit-scrollbar { display:none }
  .hcf-scroll { -ms-overflow-style:none; scrollbar-width:none }
  .hcf-input {
    width:100%; padding:14px 16px;
    background:rgba(0,0,0,0.035);
    border:1.5px solid rgba(0,0,0,0.08);
    border-radius:14px; font-size:14.5px; color:#1A1A1A;
    font-family:inherit; outline:none;
    box-sizing:border-box; resize:none;
    -webkit-appearance:none; transition:border-color .18s;
  }
  .hcf-input:focus { border-color:#16D7C5 }
  .hcf-input::placeholder { color:#B0B0B0 }
`;

/* ── Tiny helpers ─────────────────────────────────────────────────── */
const Label = ({children}) => (
  <div style={{
    fontSize:11, fontWeight:800, color:C.muted, letterSpacing:1,
    textTransform:"uppercase", marginBottom:6,
  }}>{children}</div>
);

const FieldWrap = ({label, children, style={}}) => (
  <div style={{marginBottom:16,...style}}>
    {label && <Label>{label}</Label>}
    {children}
  </div>
);

function Toggle({checked, onChange, label, sublabel, accent=C.teal}) {
  return (
    <button onClick={()=>onChange(!checked)} className="hcf-tap" style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"13px 16px", borderRadius:14, width:"100%",
      background: checked ? `${accent}14` : "rgba(0,0,0,0.03)",
      border:`1.5px solid ${checked ? accent+"44" : "rgba(0,0,0,0.08)"}`,
      transition:"all .2s", fontFamily:"inherit",
    }}>
      <div style={{
        width:22, height:22, borderRadius:7, flexShrink:0,
        background: checked ? `linear-gradient(135deg,${accent},${accent}cc)` : "rgba(0,0,0,0.07)",
        border: checked ? "none" : "1.5px solid rgba(0,0,0,0.14)",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all .2s",
        boxShadow: checked ? `0 2px 10px ${accent}44` : "none",
      }}>
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1" stroke="white"
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{textAlign:"left", flex:1}}>
        <div style={{fontSize:14, fontWeight:600, color:C.ink}}>{label}</div>
        {sublabel && <div style={{fontSize:12, color:C.muted, marginTop:1}}>{sublabel}</div>}
      </div>
    </button>
  );
}

function ChipRow({options, value, onChange, accent=C.teal}) {
  return (
    <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
      {options.map(opt => {
        const sel = value === (opt.value??opt);
        return (
          <button key={opt.value??opt} onClick={()=>onChange(opt.value??opt)}
            className="hcf-tap"
            style={{
              padding:"8px 14px", borderRadius:999,
              background: sel ? `${accent}18` : "rgba(0,0,0,0.04)",
              border:`1.5px solid ${sel ? accent+"55" : "rgba(0,0,0,0.09)"}`,
              fontSize:13, fontWeight:600,
              color: sel ? accent : C.ink3,
              fontFamily:"inherit", transition:"all .18s",
            }}>
            {opt.label??opt}
          </button>
        );
      })}
    </div>
  );
}

/* ── Config ───────────────────────────────────────────────────────── */
const WERK_CATS  = ["Kunst","Musik","Fotografie","Design","Handwerk","Mode","Digital","Sonstiges"];
const ERLE_CATS  = ["Workshop","Coaching","Kunstkurs","Musikunterricht","Tour","Yoga","Healing","Kreativsession"];
const PRICE_ARTS = [
  {value:"stunde",  label:"pro Stunde"},
  {value:"session", label:"pro Session"},
  {value:"tag",     label:"pro Tag"},
  {value:"fest",    label:"Festpreis"},
];
const LANGS      = ["Deutsch","Englisch","Französisch","Spanisch","Andere"];

/* ══════════════════════════════════════════════════════════════════
   SCREEN 1 — Media Picker
══════════════════════════════════════════════════════════════════ */
function ScreenPicker({onMedia, onClose}) {
  const [tab, setTab]         = useState("beitrag"); // "beitrag" | "story"
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [isVid, setIsVid]     = useState(false);
  const fileRef               = useRef(null);
  const galRef                = useRef(null);

  function pick(f) {
    if (!f) return;
    setFile(f);
    setIsVid(f.type.startsWith("video"));
    setPreview(URL.createObjectURL(f));
  }

  function handleNext() {
    if (!file) return;
    onMedia({ file, preview, isVid, mode: tab });
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100%",
      animation:"hcfIn .35s cubic-bezier(.34,1.3,.64,1) both",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onClose} className="hcf-tap" style={{
          background:"none", border:"none", padding:4,
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M1 1L21 21M21 1L1 21"
              stroke={C.ink} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <span style={{fontWeight:800, fontSize:17, color:C.ink, letterSpacing:-.3}}>
          Beitrag erstellen
        </span>
        <button onClick={handleNext} disabled={!file} className="hcf-tap" style={{
          padding:"8px 16px", borderRadius:22,
          background: file
            ? `linear-gradient(135deg,${C.teal},${C.coral})`
            : "rgba(0,0,0,0.07)",
          border:"none", color: file ? "white" : C.muted2,
          fontSize:14, fontWeight:800, fontFamily:"inherit",
          boxShadow: file ? `0 3px 14px ${C.tealGlow}` : "none",
          transition:"all .2s",
        }}>
          Weiter
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display:"flex", gap:0, margin:"0 18px 12px",
        background:"rgba(0,0,0,0.05)", borderRadius:14, padding:4,
        flexShrink:0,
      }}>
        {["beitrag","story"].map(t => (
          <button key={t} onClick={()=>setTab(t)} className="hcf-tap" style={{
            flex:1, padding:"9px",
            background: tab===t ? C.card : "none",
            border:"none", borderRadius:11,
            fontSize:13.5, fontWeight:700,
            color: tab===t ? C.ink : C.muted,
            fontFamily:"inherit",
            boxShadow: tab===t ? "0 1px 8px rgba(0,0,0,0.08)" : "none",
            transition:"all .2s",
          }}>
            {t === "beitrag" ? "Beitrag" : "Story"}
          </button>
        ))}
      </div>

      {/* Big preview */}
      <div style={{
        margin:"0 18px 14px", flexShrink:0,
        height:280, borderRadius:22, overflow:"hidden",
        background:`linear-gradient(145deg,${C.tealPale},rgba(255,138,107,0.06))`,
        position:"relative",
        boxShadow:"0 4px 24px rgba(0,0,0,0.09)",
      }}>
        {preview ? (
          isVid
            ? <video src={preview} style={{width:"100%",height:"100%",objectFit:"cover"}} muted autoPlay loop playsInline/>
            : <img   src={preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        ) : (
          <div style={{
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            height:"100%", gap:10,
          }}>
            <div style={{fontSize:44, opacity:.5}}>🖼️</div>
            <div style={{fontSize:13, color:C.muted, fontWeight:500}}>
              Foto oder Video auswählen
            </div>
          </div>
        )}

        {/* Overlay buttons */}
        <div style={{
          position:"absolute", bottom:12, right:12,
          display:"flex", gap:8,
        }}>
          {/* Kamera */}
          <input ref={fileRef} type="file" accept="image/*,video/*"
            capture="environment" onChange={e=>pick(e.target.files?.[0])}
            style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} className="hcf-tap" style={{
            padding:"9px 14px",
            background:C.glassDark,
            backdropFilter:"blur(10px)",
            WebkitBackdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.18)",
            borderRadius:22, color:"white", fontSize:13,
            fontWeight:700, fontFamily:"inherit",
          }}>
            📷 Kamera
          </button>
          {/* Galerie */}
          <input ref={galRef} type="file" accept="image/*,video/*"
            onChange={e=>pick(e.target.files?.[0])}
            style={{display:"none"}}/>
          <button onClick={()=>galRef.current?.click()} className="hcf-tap" style={{
            padding:"9px 14px",
            background:C.glassDark,
            backdropFilter:"blur(10px)",
            WebkitBackdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.18)",
            borderRadius:22, color:"white", fontSize:13,
            fontWeight:700, fontFamily:"inherit",
          }}>
            🖼️ Galerie
          </button>
        </div>
      </div>

      {/* Tip */}
      <div style={{
        margin:"0 18px", padding:"12px 16px",
        background:C.tealPale, borderRadius:14,
        border:`1px solid ${C.teal}22`,
        flexShrink:0,
      }}>
        <div style={{fontSize:13, color:C.ink2, lineHeight:1.55}}>
          <span style={{fontWeight:700, color:C.teal}}>
            {tab==="beitrag" ? "Beitrag" : "Story"}
          </span>
          {tab==="beitrag"
            ? " — bleibt dauerhaft in deinem Profil. Du entscheidest danach ob es ein Moment, Werk oder Erlebnis ist."
            : " — erscheint 24 Stunden in der Momente-Bar und verschwindet dann."}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 2 — Edit / Preview
══════════════════════════════════════════════════════════════════ */
function ScreenEdit({media, onBack, onNext}) {
  const [brightness, setBrightness] = useState(100);
  const [filter,     setFilter]     = useState("none");

  const FILTERS = [
    {name:"Original", val:"none"},
    {name:"Warm",     val:"sepia(0.25) saturate(1.3) brightness(1.05)"},
    {name:"Cool",     val:"saturate(0.8) hue-rotate(15deg) brightness(1.05)"},
    {name:"Fade",     val:"brightness(1.1) contrast(0.85) saturate(0.9)"},
    {name:"Vivid",    val:"saturate(1.6) contrast(1.05)"},
    {name:"HUI",      val:"sepia(0.1) saturate(1.2) hue-rotate(-5deg) brightness(1.03)"},
  ];

  const fullFilter = `${filter} brightness(${brightness/100})`;

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100%",
      animation:"hcfIn .3s ease both",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onBack} className="hcf-tap" style={{
          background:"none", border:"none", padding:4, color:C.muted, fontSize:14,
        }}>
          ← Zurück
        </button>
        <span style={{fontWeight:800, fontSize:17, color:C.ink, letterSpacing:-.3}}>
          Bearbeiten
        </span>
        <button onClick={()=>onNext({filter:fullFilter})} className="hcf-tap" style={{
          padding:"8px 16px", borderRadius:22,
          background:`linear-gradient(135deg,${C.teal},${C.coral})`,
          border:"none", color:"white",
          fontSize:14, fontWeight:800, fontFamily:"inherit",
          boxShadow:`0 3px 14px ${C.tealGlow}`,
        }}>
          Weiter
        </button>
      </div>

      {/* Preview */}
      <div style={{
        margin:"0 18px 16px",
        height:260, borderRadius:22, overflow:"hidden",
        boxShadow:"0 6px 28px rgba(0,0,0,0.13)",
        flexShrink:0, position:"relative",
      }}>
        {media.isVid
          ? <video src={media.preview} muted autoPlay loop playsInline
              style={{width:"100%",height:"100%",objectFit:"cover",filter:fullFilter}}/>
          : <img   src={media.preview} alt=""
              style={{width:"100%",height:"100%",objectFit:"cover",filter:fullFilter}}/>
        }
      </div>

      {/* Filter row */}
      <div style={{flexShrink:0, paddingBottom:12}}>
        <Label style={{paddingLeft:18, marginBottom:10}}>Filter</Label>
        <div className="hcf-scroll" style={{
          display:"flex", gap:10, overflowX:"auto",
          padding:"0 18px", WebkitOverflowScrolling:"touch",
        }}>
          {FILTERS.map(f => (
            <div key={f.name} onClick={()=>setFilter(f.val)} className="hcf-tap"
              style={{flexShrink:0, textAlign:"center"}}>
              <div style={{
                width:64, height:64, borderRadius:16, overflow:"hidden",
                border:`2.5px solid ${filter===f.val ? C.teal : "transparent"}`,
                boxShadow: filter===f.val ? `0 0 0 1px ${C.teal}44` : "none",
                transition:"border-color .18s",
              }}>
                {media.isVid
                  ? <video src={media.preview} muted style={{
                      width:"100%",height:"100%",objectFit:"cover",
                      filter:`${f.val} brightness(${brightness/100})`
                    }}/>
                  : <img src={media.preview} alt="" style={{
                      width:"100%",height:"100%",objectFit:"cover",
                      filter:`${f.val} brightness(${brightness/100})`
                    }}/>
                }
              </div>
              <div style={{
                fontSize:11, marginTop:5, fontWeight:600,
                color: filter===f.val ? C.teal : C.muted,
              }}>{f.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Brightness */}
      <div style={{padding:"8px 18px 0", flexShrink:0}}>
        <div style={{
          display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:8,
        }}>
          <Label>Helligkeit</Label>
          <span style={{fontSize:12, color:C.muted, fontWeight:600}}>
            {brightness}%
          </span>
        </div>
        <input type="range" min={60} max={150} value={brightness}
          onChange={e=>setBrightness(Number(e.target.value))}
          style={{
            width:"100%", accentColor:C.teal,
            height:4, borderRadius:999,
          }}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 3 — Details / Caption
══════════════════════════════════════════════════════════════════ */
function ScreenDetails({media, editMeta, onBack, onNext}) {
  const [caption,    setCaption]    = useState("");
  const [location,   setLocation]   = useState("");
  const [visibility, setVisibility] = useState("public");
  const [asStory,    setAsStory]    = useState(false);

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100%",
      animation:"hcfSlide .3s ease both",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onBack} className="hcf-tap" style={{
          background:"none", border:"none", padding:4, color:C.muted, fontSize:14,
        }}>
          ← Zurück
        </button>
        <span style={{fontWeight:800, fontSize:17, color:C.ink, letterSpacing:-.3}}>
          Beschreibung
        </span>
        <button onClick={()=>onNext({caption, location, visibility, asStory})}
          className="hcf-tap" style={{
            padding:"8px 16px", borderRadius:22,
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", color:"white",
            fontSize:14, fontWeight:800, fontFamily:"inherit",
            boxShadow:`0 3px 14px ${C.tealGlow}`,
          }}>
          Weiter
        </button>
      </div>

      <div className="hcf-scroll" style={{
        flex:1, overflowY:"auto",
        padding:"6px 18px 16px",
        WebkitOverflowScrolling:"touch",
      }}>
        {/* Mini preview row */}
        <div style={{
          display:"flex", gap:12, alignItems:"flex-start",
          marginBottom:20,
        }}>
          <div style={{
            width:72, height:72, borderRadius:14,
            overflow:"hidden", flexShrink:0,
            boxShadow:"0 2px 12px rgba(0,0,0,0.10)",
          }}>
            <img src={media.preview} alt=""
              style={{
                width:"100%", height:"100%", objectFit:"cover",
                filter:editMeta.filter||"none",
              }}/>
          </div>
          <textarea
            className="hcf-input"
            rows={3}
            placeholder="Was ist dein Gedanke dazu? ✨"
            value={caption}
            onChange={e=>setCaption(e.target.value)}
            style={{flex:1, minHeight:72}}
          />
        </div>

        {/* Location */}
        <FieldWrap label="Ort hinzufügen">
          <div style={{position:"relative"}}>
            <span style={{
              position:"absolute", left:14, top:"50%",
              transform:"translateY(-50%)", fontSize:16,
            }}>📍</span>
            <input className="hcf-input" placeholder="Ort hinzufügen"
              value={location} onChange={e=>setLocation(e.target.value)}
              style={{paddingLeft:40}}/>
          </div>
        </FieldWrap>

        {/* Visibility */}
        <FieldWrap label="Sichtbarkeit">
          <ChipRow
            options={[
              {value:"public",    label:"🌍 Alle"},
              {value:"followers", label:"👥 Follower"},
              {value:"private",   label:"🔒 Privat"},
            ]}
            value={visibility}
            onChange={setVisibility}
          />
        </FieldWrap>

        {/* Also as story */}
        <Toggle
          checked={asStory}
          onChange={setAsStory}
          label="Auch als Story teilen"
          sublabel="Erscheint 24h in der Momente-Bar"
          accent={C.teal}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN 4 — Type Selection + Type-specific fields
══════════════════════════════════════════════════════════════════ */
function ScreenType({media, editMeta, details, onBack, onPublish, loading, error}) {
  const [type,     setType]     = useState(null); // null | "moment"|"werk"|"erlebnis"
  const [animKey,  setAnimKey]  = useState(0);

  // werk fields
  const [werkTitle,    setWerkTitle]    = useState("");
  const [werkDesc,     setWerkDesc]     = useState(details.caption||"");
  const [werkPrice,    setWerkPrice]    = useState("");
  const [werkCurrency, setWerkCurrency] = useState("EUR");
  const [werkQty,      setWerkQty]      = useState("1");
  const [werkShip,     setWerkShip]     = useState(false);
  const [werkPickup,   setWerkPickup]   = useState(false);
  const [werkDelivery, setWerkDelivery] = useState("");
  const [werkCat,      setWerkCat]      = useState("");
  const [werkOnlyShow, setWerkOnlyShow] = useState(false);

  // erlebnis fields
  const [erlTitle,     setErlTitle]     = useState("");
  const [erlDesc,      setErlDesc]      = useState(details.caption||"");
  const [erlPrice,     setErlPrice]     = useState("");
  const [erlPriceArt,  setErlPriceArt]  = useState("session");
  const [erlLocation,  setErlLocation]  = useState(details.location||"");
  const [erlFormat,    setErlFormat]    = useState("online");
  const [erlDuration,  setErlDuration]  = useState("");
  const [erlDays,      setErlDays]      = useState("");
  const [erlPax,       setErlPax]       = useState("");
  const [erlCat,       setErlCat]       = useState("");
  const [erlLang,      setErlLang]      = useState("Deutsch");

  const TYPE_DEFS = [
    {
      key:"moment",
      emoji:"✨",
      title:"Moment",
      desc:"Ein normaler sozialer Post.\nWird geliked, kommentiert, geteilt.",
      accent:C.teal,
      bg:`linear-gradient(145deg,${C.tealPale},rgba(22,215,197,0.04))`,
      border:`rgba(22,215,197,0.25)`,
    },
    {
      key:"werk",
      emoji:"🎨",
      title:"Werk",
      desc:"Zeige oder verkaufe etwas Kreatives.\nKunst, Design, Handwerk & mehr.",
      accent:C.gold,
      bg:`linear-gradient(145deg,${C.goldPale},rgba(245,166,35,0.04))`,
      border:`rgba(245,166,35,0.25)`,
    },
    {
      key:"erlebnis",
      emoji:"🌟",
      title:"Erlebnis",
      desc:"Biete Zeit, Wissen oder Sessions an.\nCoaching, Workshop, Unterricht.",
      accent:C.purple,
      bg:`linear-gradient(145deg,${C.purplePale},rgba(167,139,250,0.04))`,
      border:`rgba(167,139,250,0.25)`,
    },
  ];

  function selectType(t) {
    setType(t); setAnimKey(k=>k+1);
  }

  function doPublish() {
    const payload = { type, details, editMeta };
    if (type === "moment") {
      onPublish(payload);
    } else if (type === "werk") {
      onPublish({...payload, werkData:{
        title:werkTitle, desc:werkDesc,
        price: werkOnlyShow ? null : (parseFloat(werkPrice)||null),
        currency:werkCurrency,
        quantity:parseInt(werkQty)||1,
        shipping:werkShip, pickup:werkPickup,
        deliveryTime:werkDelivery,
        category:werkCat, onlyShow:werkOnlyShow,
      }});
    } else if (type === "erlebnis") {
      onPublish({...payload, erlData:{
        title:erlTitle, desc:erlDesc,
        price:parseFloat(erlPrice)||null,
        priceType:erlPriceArt,
        location:erlLocation, format:erlFormat,
        duration:erlDuration, days:erlDays,
        maxPax:parseInt(erlPax)||null,
        category:erlCat, language:erlLang,
      }});
    }
  }

  const activeTypeDef = TYPE_DEFS.find(t=>t.key===type);

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100%",
      animation:"hcfSlide .3s ease both",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 10px", flexShrink:0,
      }}>
        <button onClick={()=>{
          if (type) { setType(null); }
          else { onBack(); }
        }} className="hcf-tap" style={{
          background:"none", border:"none", padding:4, color:C.muted, fontSize:14,
        }}>
          ← Zurück
        </button>
        <span style={{fontWeight:800, fontSize:17, color:C.ink, letterSpacing:-.3}}>
          {type ? `${activeTypeDef?.emoji} ${activeTypeDef?.title}` : "Was ist das?"}
        </span>
        {type && (
          <button onClick={doPublish} disabled={loading} className="hcf-tap" style={{
            padding:"8px 16px", borderRadius:22,
            background: loading ? "rgba(0,0,0,0.07)"
              : `linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none",
            color: loading ? C.muted : "white",
            fontSize:14, fontWeight:800, fontFamily:"inherit",
            boxShadow: loading ? "none" : `0 3px 14px ${C.tealGlow}`,
            display:"flex", alignItems:"center", gap:6,
          }}>
            {loading
              ? <><div style={{width:13,height:13,borderRadius:"50%",
                  border:`2px solid ${C.muted2}`,borderTopColor:C.teal,
                  animation:"hcfSpin .7s linear infinite"}}/> Wird…</>
              : "Veröffentlichen ✨"
            }
          </button>
        )}
      </div>

      <div className="hcf-scroll" style={{
        flex:1, overflowY:"auto",
        padding:"8px 18px 24px",
        WebkitOverflowScrolling:"touch",
      }}>

        {/* ── Type not yet chosen ── */}
        {!type && (
          <div style={{animation:"hcfFade .25s ease both"}}>
            {/* Mini preview */}
            <div style={{
              height:120, borderRadius:18, overflow:"hidden",
              marginBottom:20,
              boxShadow:"0 3px 18px rgba(0,0,0,0.10)",
            }}>
              <img src={media.preview} alt=""
                style={{width:"100%",height:"100%",objectFit:"cover",
                  filter:editMeta.filter||"none"}}/>
            </div>
            <div style={{
              fontSize:15, color:C.muted, fontWeight:500,
              marginBottom:16, lineHeight:1.5,
            }}>
              Dein Medium ist bereit. Was soll daraus werden?
            </div>
            {/* Type cards */}
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              {TYPE_DEFS.map((td,i) => (
                <button key={td.key} onClick={()=>selectType(td.key)}
                  className="hcf-tap" style={{
                    display:"flex", alignItems:"center", gap:16,
                    padding:"17px 18px",
                    background:td.bg,
                    border:`1.5px solid ${td.border}`,
                    borderRadius:20, textAlign:"left",
                    fontFamily:"inherit", cursor:"pointer", width:"100%",
                    boxShadow:`0 2px 16px ${td.accent}12`,
                    animation:`hcfIn .32s ${i*.07}s ease both`,
                  }}>
                  <div style={{
                    width:56, height:56, borderRadius:18, flexShrink:0,
                    background:`${td.accent}18`,
                    border:`1.5px solid ${td.accent}28`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:26, boxShadow:`0 2px 12px ${td.accent}20`,
                  }}>
                    {td.emoji}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{
                      fontWeight:800, fontSize:16.5, color:C.ink,
                      letterSpacing:-.2, marginBottom:4,
                    }}>{td.title}</div>
                    <div style={{
                      fontSize:12.5, color:C.muted, lineHeight:1.5,
                      whiteSpace:"pre-line",
                    }}>{td.desc}</div>
                  </div>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none"
                    style={{flexShrink:0, opacity:.3}}>
                    <path d="M1 1L6 6L1 11"
                      stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Type chosen ── */}
        {type === "moment" && (
          <div key={`m-${animKey}`} style={{animation:"hcfSlide .3s ease both"}}>
            <div style={{
              padding:"14px 16px", borderRadius:16,
              background:C.tealPale, border:`1px solid ${C.teal}22`,
              marginBottom:16, fontSize:13.5, color:C.ink2, lineHeight:1.55,
            }}>
              <span style={{fontWeight:700, color:C.teal}}>Moment</span>
              {" "}— Dein Post erscheint im Feed. Keine Preise, keine Buchungen. Einfach teilen.
            </div>
            <div style={{
              height:200, borderRadius:18, overflow:"hidden",
              boxShadow:"0 3px 16px rgba(0,0,0,0.10)",
            }}>
              <img src={media.preview} alt=""
                style={{width:"100%",height:"100%",objectFit:"cover",
                  filter:editMeta.filter||"none"}}/>
            </div>
            {details.caption && (
              <div style={{
                marginTop:12, fontSize:14, color:C.ink2, lineHeight:1.6,
              }}>„{details.caption}"</div>
            )}
            {error && <ErrorBox msg={error}/>}
          </div>
        )}

        {type === "werk" && (
          <div key={`w-${animKey}`} style={{animation:"hcfSlide .3s ease both"}}>
            <FieldWrap label="Titel *">
              <input className="hcf-input" placeholder="Name deines Werks"
                value={werkTitle} onChange={e=>setWerkTitle(e.target.value)}/>
            </FieldWrap>
            <FieldWrap label="Beschreibung *">
              <textarea rows={2} className="hcf-input"
                placeholder="Erzähl etwas dazu…"
                value={werkDesc} onChange={e=>setWerkDesc(e.target.value)}/>
            </FieldWrap>

            <Toggle checked={werkOnlyShow} onChange={setWerkOnlyShow}
              label="Nur präsentieren" sublabel="Kein Verkauf — nur zeigen"
              accent={C.gold}/>
            <div style={{height:12}}/>

            {!werkOnlyShow && (
              <>
                <div style={{display:"flex", gap:10, marginBottom:16}}>
                  <FieldWrap label="Preis" style={{flex:2, marginBottom:0}}>
                    <input type="number" className="hcf-input" placeholder="0,00"
                      value={werkPrice} onChange={e=>setWerkPrice(e.target.value)}/>
                  </FieldWrap>
                  <FieldWrap label="Stück" style={{flex:1, marginBottom:0}}>
                    <input type="number" className="hcf-input" placeholder="1"
                      value={werkQty} onChange={e=>setWerkQty(e.target.value)}/>
                  </FieldWrap>
                </div>
                <div style={{display:"flex", gap:10, marginBottom:16}}>
                  {[
                    {key:"werkShip", state:werkShip, set:setWerkShip, icon:"🚚", label:"Versand"},
                    {key:"werkPickup", state:werkPickup, set:setWerkPickup, icon:"🏠", label:"Abholung"},
                  ].map(item=>(
                    <button key={item.key} onClick={()=>item.set(p=>!p)}
                      className="hcf-tap" style={{
                        flex:1, padding:"11px 10px",
                        background: item.state ? C.goldPale : "rgba(0,0,0,0.03)",
                        border:`1.5px solid ${item.state ? C.gold+"55":"rgba(0,0,0,0.08)"}`,
                        borderRadius:12, fontSize:13, fontWeight:700,
                        color: item.state ? C.gold : C.ink3,
                        fontFamily:"inherit", transition:"all .18s",
                      }}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
                <FieldWrap label="Lieferzeit">
                  <input className="hcf-input" placeholder="z.B. 3-5 Werktage"
                    value={werkDelivery} onChange={e=>setWerkDelivery(e.target.value)}/>
                </FieldWrap>
              </>
            )}

            <FieldWrap label="Kategorie">
              <ChipRow options={WERK_CATS} value={werkCat}
                onChange={setWerkCat} accent={C.gold}/>
            </FieldWrap>
            {error && <ErrorBox msg={error}/>}
          </div>
        )}

        {type === "erlebnis" && (
          <div key={`e-${animKey}`} style={{animation:"hcfSlide .3s ease both"}}>
            <FieldWrap label="Titel *">
              <input className="hcf-input" placeholder="Name deines Angebots"
                value={erlTitle} onChange={e=>setErlTitle(e.target.value)}/>
            </FieldWrap>
            <FieldWrap label="Beschreibung *">
              <textarea rows={2} className="hcf-input"
                placeholder="Was bietest du an?"
                value={erlDesc} onChange={e=>setErlDesc(e.target.value)}/>
            </FieldWrap>

            <div style={{display:"flex", gap:10, marginBottom:16}}>
              <FieldWrap label="Preis (€)" style={{flex:2, marginBottom:0}}>
                <input type="number" className="hcf-input" placeholder="0,00"
                  value={erlPrice} onChange={e=>setErlPrice(e.target.value)}/>
              </FieldWrap>
              <FieldWrap label="Dauer" style={{flex:1.5, marginBottom:0}}>
                <input className="hcf-input" placeholder="60 Min"
                  value={erlDuration} onChange={e=>setErlDuration(e.target.value)}/>
              </FieldWrap>
            </div>

            <FieldWrap label="Preisart">
              <ChipRow options={PRICE_ARTS} value={erlPriceArt}
                onChange={setErlPriceArt} accent={C.purple}/>
            </FieldWrap>

            <FieldWrap label="Format">
              <ChipRow
                options={[
                  {value:"online",  label:"🌐 Online"},
                  {value:"vor-ort", label:"📍 Vor Ort"},
                  {value:"beides",  label:"✨ Beides"},
                ]}
                value={erlFormat} onChange={setErlFormat} accent={C.purple}/>
            </FieldWrap>

            <FieldWrap label="Ort">
              <input className="hcf-input" placeholder="z.B. München oder Online"
                value={erlLocation} onChange={e=>setErlLocation(e.target.value)}/>
            </FieldWrap>

            <div style={{display:"flex", gap:10, marginBottom:16}}>
              <FieldWrap label="Verfügbare Tage" style={{flex:2, marginBottom:0}}>
                <input className="hcf-input" placeholder="Mo, Di, Do"
                  value={erlDays} onChange={e=>setErlDays(e.target.value)}/>
              </FieldWrap>
              <FieldWrap label="Max. Personen" style={{flex:1, marginBottom:0}}>
                <input type="number" className="hcf-input" placeholder="1"
                  value={erlPax} onChange={e=>setErlPax(e.target.value)}/>
              </FieldWrap>
            </div>

            <FieldWrap label="Kategorie">
              <ChipRow options={ERLE_CATS} value={erlCat}
                onChange={setErlCat} accent={C.purple}/>
            </FieldWrap>

            <FieldWrap label="Sprache">
              <ChipRow options={LANGS} value={erlLang}
                onChange={setErlLang} accent={C.purple}/>
            </FieldWrap>
            {error && <ErrorBox msg={error}/>}
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBox({msg}) {
  return (
    <div style={{
      padding:"10px 14px", borderRadius:12, marginTop:8,
      background:"rgba(255,80,80,0.08)", border:"1px solid rgba(255,80,80,0.2)",
      fontSize:13, color:"#c00",
    }}>{msg}</div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DONE Screen
══════════════════════════════════════════════════════════════════ */
function ScreenDone({type}) {
  const map = {
    moment:{emoji:"✨", msg:"Dein Moment ist jetzt sichtbar."},
    werk:  {emoji:"🎨", msg:"Dein Werk ist veröffentlicht."},
    erlebnis:{emoji:"🌟", msg:"Dein Erlebnis ist online."},
    story: {emoji:"🌊", msg:"Deine Story ist live!"},
  };
  const d = map[type] || {emoji:"✅", msg:"Veröffentlicht!"};
  return (
    <div style={{
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      height:"100%", textAlign:"center", padding:"0 36px",
      animation:"hcfIn .4s cubic-bezier(.34,1.4,.64,1) both",
    }}>
      <div style={{fontSize:80, marginBottom:20,
        animation:"hcfPop .5s cubic-bezier(.34,1.4,.64,1) both",
      }}>{d.emoji}</div>
      <div style={{
        fontWeight:900, fontSize:26, color:C.ink,
        letterSpacing:-0.8, marginBottom:10,
      }}>Veröffentlicht!</div>
      <div style={{fontSize:14.5, color:C.muted, lineHeight:1.65}}>{d.msg}</div>
      {/* Shimmer bar */}
      <div style={{
        width:64, height:2, borderRadius:999, marginTop:24,
        backgroundImage:`linear-gradient(90deg, transparent, ${C.teal}, ${C.coral}, transparent)`,
        backgroundSize:"300% 100%",
        animation:"hcfShimmer 1.6s ease infinite",
      }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STORY FLOW (simplified)
══════════════════════════════════════════════════════════════════ */
function StoryFlow({onBack, onDone, user}) {
  const fileRef = useRef(null);
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handlePost() {
    if (!file || !user) return;
    setLoading(true); setError("");
    try {
      const ext  = file.name.split(".").pop();
      const path = `stories/${user.id}/${Date.now()}.${ext}`;
      const { error:upErr } = await supabase.storage
        .from("stories").upload(path, file, {contentType:file.type});
      if (upErr) throw upErr;
      const { data:{publicUrl} } = supabase.storage.from("stories").getPublicUrl(path);

      const { error:dbErr } = await supabase.from("stories").insert({
        user_id:user.id, media_url:publicUrl,
        caption:caption||null,
        expires_at: new Date(Date.now()+24*60*60*1000).toISOString(),
        created_at: new Date().toISOString(),
      });
      if (dbErr) throw dbErr;
      onDone("story");
    } catch(e) {
      setError(e.message||"Fehler beim Posten");
      setLoading(false);
    }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",animation:"hcfIn .3s ease both"}}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 10px", flexShrink:0,
      }}>
        <button onClick={onBack} className="hcf-tap" style={{
          background:"none",border:"none",padding:4,color:C.muted,fontSize:14,
        }}>← Zurück</button>
        <span style={{fontWeight:800,fontSize:17,color:C.ink,letterSpacing:-.3}}>Story</span>
        {file && (
          <button onClick={handlePost} disabled={loading} className="hcf-tap" style={{
            padding:"8px 16px",borderRadius:22,
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none",color:"white",fontSize:14,fontWeight:800,fontFamily:"inherit",
          }}>
            {loading ? "Wird…" : "Posten ✨"}
          </button>
        )}
      </div>

      <div className="hcf-scroll" style={{flex:1,overflowY:"auto",padding:"0 18px 24px"}}>
        <input ref={fileRef} type="file" accept="image/*,video/*"
          onChange={e=>{
            const f=e.target.files?.[0];
            if(f){setFile(f);setPreview(URL.createObjectURL(f));}
          }} style={{display:"none"}}/>

        {!preview ? (
          <div onClick={()=>fileRef.current?.click()} className="hcf-tap" style={{
            height:240,borderRadius:22,marginBottom:16,
            background:C.tealPale,border:`2px dashed ${C.teal}44`,
            display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:10,
          }}>
            <div style={{fontSize:44}}>📸</div>
            <div style={{fontSize:14,color:C.teal,fontWeight:700}}>Foto oder Video wählen</div>
          </div>
        ) : (
          <div style={{height:240,borderRadius:22,overflow:"hidden",marginBottom:16}}>
            <img src={preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          </div>
        )}

        <FieldWrap label="Kurze Beschreibung (optional)">
          <input className="hcf-input" placeholder="Was passiert gerade? 🌊"
            value={caption} onChange={e=>setCaption(e.target.value)}/>
        </FieldWrap>

        <div style={{
          padding:"12px 14px",borderRadius:14,
          background:C.tealPale,border:`1px solid ${C.teal}22`,
          fontSize:13,color:C.ink3,lineHeight:1.55,
        }}>
          Stories verschwinden nach <strong>24 Stunden</strong> automatisch.
        </div>
        {error && <ErrorBox msg={error}/>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function HuiCreateFlow({ onClose, onSuccess }) {
  const { user }   = useAuth();
  const [screen,   setScreen]  = useState("picker");
  // picker → edit → details → type → done
  // OR: picker(story) → story → done

  const [mediaData,  setMediaData]  = useState(null);
  const [editMeta,   setEditMeta]   = useState({filter:"none"});
  const [detailsMeta,setDetailsMeta]= useState({});
  const [postType,   setPostType]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  async function handlePublish(payload) {
    setLoading(true); setError("");
    try {
      const { file, isVid } = mediaData;
      const ext   = file.name.split(".").pop();
      const bucket= payload.type === "story" ? "stories" : "media";
      const path  = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error:upErr } = await supabase.storage
        .from(bucket).upload(path, file, {contentType:file.type, upsert:false});
      if (upErr) throw upErr;
      const { data:{publicUrl} } = supabase.storage.from(bucket).getPublicUrl(path);

      const base = {
        user_id:    user.id,
        media_url:  publicUrl,
        media_type: isVid ? "video" : "image",
        caption:    payload.details?.caption || null,
        location:   payload.details?.location || null,
        created_at: new Date().toISOString(),
        status:     "published",
      };

      if (payload.type === "moment") {
        const { error:e } = await supabase.from("stories").insert({
          ...base, expires_at: null,
        });
        if (e) throw e;
        if (payload.details?.asStory) {
          await supabase.from("stories").insert({
            ...base,
            expires_at: new Date(Date.now()+24*60*60*1000).toISOString(),
          });
        }
      } else if (payload.type === "werk") {
        const w = payload.werkData;
        const { error:e } = await supabase.from("works").insert({
          ...base,
          cover_url:         publicUrl,   // same image — used by DiscoveryFeed
          title:             w.title || "Mein Werk",
          description:       w.desc,
          price:             w.price,
          quantity:          w.quantity,
          shipping_available:w.shipping,
          pickup_available:  w.pickup,
          delivery_time:     w.deliveryTime || null,
          category:          w.category || null,
          for_sale:          !w.onlyShow,
        });
        if (e) throw e;
      } else if (payload.type === "erlebnis") {
        const er = payload.erlData;
        const { error:e } = await supabase.from("experiences").insert({
          ...base,
          title:       er.title || "Mein Erlebnis",
          description: er.desc,
          price:       er.price,
          price_type:  er.priceType,
          format:      er.format,
          location:    er.location || null,
          duration:    er.duration || null,
          available_days: er.days || null,
          max_participants: er.maxPax,
          category:    er.category || null,
          language:    er.language,
        });
        if (e) throw e;
      }

      setPostType(payload.type);
      setScreen("done");
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 2000);
    } catch(err) {
      console.error("[HuiCreateFlow]", err);
      setError(err.message || "Fehler beim Veröffentlichen.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      {/* Backdrop */}
      <div onClick={screen !== "done" ? onClose : undefined} style={{
        position:"fixed", inset:0, zIndex:3100,
        background:"rgba(0,0,0,0.40)",
        backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
      }}/>

      {/* Sheet */}
      <div style={{
        position:"fixed", inset:0, zIndex:3101,
        top:"5vh",
        background:C.card,
        borderRadius:"28px 28px 0 0",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -8px 60px rgba(0,0,0,0.22)",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        overflow:"hidden",
      }}>
        {/* Handle */}
        <div style={{
          width:40, height:4, borderRadius:999,
          background:"rgba(0,0,0,0.12)",
          margin:"12px auto 0", flexShrink:0,
        }}/>

        {/* Screen router */}
        <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
          {screen === "picker" && (
            <ScreenPicker
              onClose={onClose}
              onMedia={data => {
                setMediaData(data);
                if (data.mode === "story") setScreen("story");
                else setScreen("edit");
              }}
            />
          )}
          {screen === "edit" && (
            <ScreenEdit
              media={mediaData}
              onBack={()=>setScreen("picker")}
              onNext={meta => { setEditMeta(meta); setScreen("details"); }}
            />
          )}
          {screen === "details" && (
            <ScreenDetails
              media={mediaData}
              editMeta={editMeta}
              onBack={()=>setScreen("edit")}
              onNext={d => { setDetailsMeta(d); setScreen("type"); }}
            />
          )}
          {screen === "type" && (
            <ScreenType
              media={mediaData}
              editMeta={editMeta}
              details={detailsMeta}
              onBack={()=>setScreen("details")}
              onPublish={handlePublish}
              loading={loading}
              error={error}
            />
          )}
          {screen === "story" && (
            <StoryFlow
              user={user}
              onBack={()=>setScreen("picker")}
              onDone={t => { setPostType(t); setScreen("done"); setTimeout(()=>{onSuccess?.();onClose?.();},2000); }}
            />
          )}
          {screen === "done" && <ScreenDone type={postType}/>}
        </div>
      </div>
    </>
  );
}

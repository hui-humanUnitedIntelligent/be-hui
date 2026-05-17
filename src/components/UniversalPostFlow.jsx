// UniversalPostFlow.jsx — EIN Upload-System für Moment / Werk / Erlebnis
// HUI Design beibehalten. Kein Redesign.

import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.22)",
  cream:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes upfFadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes upfSpin { to { transform:rotate(360deg); } }
  @keyframes upfSuccess {
    0%   { transform:scale(0.6); opacity:0; }
    70%  { transform:scale(1.15); }
    100% { transform:scale(1); opacity:1; }
  }
  .upf-tap { -webkit-tap-highlight-color:transparent; cursor:pointer; }
  .upf-tap:active { transform:scale(0.96); transition:transform 0.14s; }
  .upf-input {
    width:100%; padding:14px 16px;
    background:rgba(0,0,0,0.03);
    border:1.5px solid rgba(0,0,0,0.08);
    border-radius:14px;
    font-size:14.5px; color:#1A1A1A;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    outline:none; box-sizing:border-box;
    transition:border-color 0.18s;
    resize:none;
    -webkit-appearance:none;
  }
  .upf-input:focus { border-color:#16D7C5; }
  .upf-scroll::-webkit-scrollbar { display:none; }
  .upf-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

// ── Type definitions ────────────────────────────────────────────────────
const TYPES = {
  moment: {
    label:"Moment",
    emoji:"📸",
    desc:"Foto oder Video posten",
    color:C.teal,
    bg:`linear-gradient(145deg,rgba(22,215,197,0.10),rgba(22,215,197,0.04))`,
    border:`rgba(22,215,197,0.28)`,
  },
  werk: {
    label:"Werk",
    emoji:"🎨",
    desc:"Etwas verkaufen oder zeigen",
    color:"#F5A623",
    bg:`linear-gradient(145deg,rgba(245,166,35,0.10),rgba(245,166,35,0.04))`,
    border:`rgba(245,166,35,0.28)`,
  },
  erlebnis: {
    label:"Erlebnis",
    emoji:"🌟",
    desc:"Zeit, Wissen oder Sessions anbieten",
    color:"#A78BFA",
    bg:`linear-gradient(145deg,rgba(167,139,250,0.10),rgba(167,139,250,0.04))`,
    border:`rgba(167,139,250,0.28)`,
  },
};

// ── Field row helper ────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{
        fontSize:11.5, fontWeight:700, color:C.muted,
        letterSpacing:0.8, textTransform:"uppercase",
        marginBottom:6,
      }}>{label}</div>
      {children}
    </div>
  );
}

// ── Moment Form ──────────────────────────────────────────────────────────
function MomentForm({ data, onChange }) {
  return (
    <>
      <Field label="Beschreibung">
        <textarea rows={3} className="upf-input" placeholder="Was bewegst du heute?"
          value={data.caption} onChange={e => onChange("caption", e.target.value)}/>
      </Field>
      <Field label="Tags">
        <input className="upf-input" placeholder="#kreativ #münchen #handwerk"
          value={data.tags} onChange={e => onChange("tags", e.target.value)}/>
      </Field>
      <Field label="Ort (optional)">
        <input className="upf-input" placeholder="z.B. München, Bayern"
          value={data.location} onChange={e => onChange("location", e.target.value)}/>
      </Field>
      {/* Also as Story */}
      <button onClick={() => onChange("asStory", !data.asStory)}
        className="upf-tap"
        style={{
          width:"100%", display:"flex", alignItems:"center", gap:12,
          background: data.asStory
            ? `linear-gradient(145deg,${C.teal}10,${C.coral}06)`
            : "rgba(0,0,0,0.03)",
          border: `1.5px solid ${data.asStory ? C.teal+"44" : "rgba(0,0,0,0.08)"}`,
          borderRadius:14, padding:"13px 16px", marginTop:4,
        }}>
        <div style={{
          width:22, height:22, borderRadius:7, flexShrink:0,
          background: data.asStory
            ? `linear-gradient(135deg,${C.teal},${C.teal2})`
            : "rgba(0,0,0,0.06)",
          border: data.asStory ? "none" : "1.5px solid rgba(0,0,0,0.14)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.18s",
        }}>
          {data.asStory && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4.5L4 7.5L10 1" stroke="white"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>
            Auch als Story posten
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
            Erscheint 24h in der Momente-Bar
          </div>
        </div>
      </button>
    </>
  );
}

// ── Werk Form ────────────────────────────────────────────────────────────
function WerkForm({ data, onChange }) {
  return (
    <>
      <Field label="Titel">
        <input className="upf-input" placeholder="Name deines Werks"
          value={data.title} onChange={e => onChange("title", e.target.value)}/>
      </Field>
      <Field label="Beschreibung">
        <textarea rows={2} className="upf-input" placeholder="Erzähl etwas dazu…"
          value={data.caption} onChange={e => onChange("caption", e.target.value)}/>
      </Field>

      {/* Nur präsentieren toggle */}
      <button onClick={() => onChange("onlyPresent", !data.onlyPresent)}
        className="upf-tap"
        style={{
          width:"100%", display:"flex", alignItems:"center", gap:12,
          background: data.onlyPresent
            ? "rgba(245,166,35,0.08)"
            : "rgba(0,0,0,0.03)",
          border:`1.5px solid ${data.onlyPresent ? "rgba(245,166,35,0.35)" : "rgba(0,0,0,0.08)"}`,
          borderRadius:14, padding:"13px 16px", marginBottom:16,
        }}>
        <div style={{
          width:22, height:22, borderRadius:7, flexShrink:0,
          background: data.onlyPresent ? "#F5A623" : "rgba(0,0,0,0.06)",
          border: data.onlyPresent ? "none" : "1.5px solid rgba(0,0,0,0.14)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.18s",
        }}>
          {data.onlyPresent && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4.5L4 7.5L10 1" stroke="white"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>
            Nur präsentieren (kein Verkauf)
          </div>
        </div>
      </button>

      {!data.onlyPresent && (
        <>
          <div style={{ display:"flex", gap:12, marginBottom:16 }}>
            <div style={{ flex:2 }}>
              <Field label="Preis (€)">
                <input type="number" className="upf-input" placeholder="0.00"
                  value={data.price} onChange={e => onChange("price", e.target.value)}/>
              </Field>
            </div>
            <div style={{ flex:1 }}>
              <Field label="Stück">
                <input type="number" className="upf-input" placeholder="1"
                  value={data.quantity} onChange={e => onChange("quantity", e.target.value)}/>
              </Field>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            {[
              { key:"shipping", label:"🚚 Versand" },
              { key:"pickup",   label:"🏠 Abholung" },
            ].map(item => (
              <button key={item.key}
                onClick={() => onChange(item.key, !data[item.key])}
                className="upf-tap"
                style={{
                  flex:1, padding:"11px 10px",
                  background: data[item.key] ? "rgba(22,215,197,0.10)" : "rgba(0,0,0,0.03)",
                  border:`1.5px solid ${data[item.key] ? C.teal+"44" : "rgba(0,0,0,0.08)"}`,
                  borderRadius:12, fontSize:13, fontWeight:600,
                  color: data[item.key] ? C.teal : C.ink2,
                  cursor:"pointer", fontFamily:"inherit",
                  transition:"all 0.18s",
                }}>
                {item.label}
              </button>
            ))}
          </div>

          <Field label="Lieferzeit (optional)">
            <input className="upf-input" placeholder="z.B. 3-5 Werktage"
              value={data.deliveryTime} onChange={e => onChange("deliveryTime", e.target.value)}/>
          </Field>
        </>
      )}
    </>
  );
}

// ── Erlebnis Form ────────────────────────────────────────────────────────
function ErlebnisForm({ data, onChange }) {
  return (
    <>
      <Field label="Titel">
        <input className="upf-input" placeholder="Name deines Angebots"
          value={data.title} onChange={e => onChange("title", e.target.value)}/>
      </Field>
      <Field label="Beschreibung">
        <textarea rows={2} className="upf-input" placeholder="Was bietest du an?"
          value={data.caption} onChange={e => onChange("caption", e.target.value)}/>
      </Field>

      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        <div style={{ flex:2 }}>
          <Field label="Preis (€)">
            <input type="number" className="upf-input" placeholder="0.00"
              value={data.price} onChange={e => onChange("price", e.target.value)}/>
          </Field>
        </div>
        <div style={{ flex:1 }}>
          <Field label="Dauer">
            <input className="upf-input" placeholder="60 Min"
              value={data.duration} onChange={e => onChange("duration", e.target.value)}/>
          </Field>
        </div>
      </div>

      {/* Online / Vor-Ort */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        {[
          { val:"online",    label:"🌐 Online" },
          { val:"vor-ort",   label:"📍 Vor Ort" },
          { val:"beides",    label:"✨ Beides" },
        ].map(opt => (
          <button key={opt.val}
            onClick={() => onChange("format", opt.val)}
            className="upf-tap"
            style={{
              flex:1, padding:"11px 6px",
              background: data.format === opt.val
                ? "rgba(167,139,250,0.12)"
                : "rgba(0,0,0,0.03)",
              border:`1.5px solid ${data.format === opt.val
                ? "rgba(167,139,250,0.4)"
                : "rgba(0,0,0,0.08)"}`,
              borderRadius:12, fontSize:12, fontWeight:600,
              color: data.format === opt.val ? "#A78BFA" : C.ink2,
              cursor:"pointer", fontFamily:"inherit",
              transition:"all 0.18s",
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      <Field label="Ort (optional)">
        <input className="upf-input" placeholder="z.B. München oder Online"
          value={data.location} onChange={e => onChange("location", e.target.value)}/>
      </Field>
      <Field label="Termine (optional)">
        <input className="upf-input" placeholder="z.B. Dienstags 18-19 Uhr"
          value={data.schedule} onChange={e => onChange("schedule", e.target.value)}/>
      </Field>
    </>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function UniversalPostFlow({ onClose, onSuccess }) {
  const { user } = useAuth();
  const fileRef  = useRef(null);

  const [phase, setPhase]     = useState("upload");  // upload → type → form → done
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [postType, setPostType]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [momentData, setMomentData] = useState({
    caption:"", tags:"", location:"", asStory:false,
  });
  const [werkData, setWerkData] = useState({
    title:"", caption:"", price:"", quantity:"1",
    shipping:false, pickup:false, deliveryTime:"", onlyPresent:false,
  });
  const [erlebnisData, setErlebnisData] = useState({
    title:"", caption:"", price:"", duration:"",
    format:"online", location:"", schedule:"",
  });

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setMediaType(f.type.startsWith("video") ? "video" : "image");
    const url = URL.createObjectURL(f);
    setPreview(url);
    setPhase("type");
  }

  function changeData(type, key, val) {
    if (type === "moment")   setMomentData(p => ({ ...p, [key]:val }));
    if (type === "werk")     setWerkData(p => ({ ...p, [key]:val }));
    if (type === "erlebnis") setErlebnisData(p => ({ ...p, [key]:val }));
  }

  async function handlePublish() {
    if (!file || !postType || !user) return;
    setLoading(true); setError("");
    try {
      // 1. Upload media
      const ext  = file.name.split(".").pop();
      const path = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media").upload(path, file, { contentType: file.type, upsert:false });
      if (upErr) throw upErr;

      const { data:{ publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

      // 2. Determine table + payload
      if (postType === "moment") {
        const payload = {
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption: momentData.caption || null,
          tags: momentData.tags
            ? momentData.tags.split(/\s+/).filter(Boolean)
            : null,
          location: momentData.location || null,
          status: "published",
          created_at: new Date().toISOString(),
        };
        const { error:e } = await supabase.from("stories").insert(payload);
        if (e) throw e;

        // Also post to feed
        await supabase.from("feed_items").insert({
          user_id: user.id, type:"moment",
          content_id: null, media_url: publicUrl,
          caption: momentData.caption,
          created_at: new Date().toISOString(),
        }).then(() => {});

        if (momentData.asStory) {
          // Already inserted above as story
          console.log("[UniversalPost] Also posted as story ✓");
        }
      }

      if (postType === "werk") {
        const { error:e } = await supabase.from("works").insert({
          user_id: user.id,
          title: werkData.title || "Mein Werk",
          description: werkData.caption,
          price: werkData.onlyPresent ? null : (parseFloat(werkData.price) || null),
          media_url: publicUrl,
          media_type: mediaType,
          quantity: parseInt(werkData.quantity) || 1,
          shipping_available: werkData.shipping,
          pickup_available: werkData.pickup,
          delivery_time: werkData.deliveryTime || null,
          for_sale: !werkData.onlyPresent,
          status: "published",
          created_at: new Date().toISOString(),
        });
        if (e) throw e;
      }

      if (postType === "erlebnis") {
        const { error:e } = await supabase.from("experiences").insert({
          user_id: user.id,
          title: erlebnisData.title || "Mein Erlebnis",
          description: erlebnisData.caption,
          price: parseFloat(erlebnisData.price) || null,
          duration: erlebnisData.duration || null,
          format: erlebnisData.format,
          location: erlebnisData.location || null,
          schedule: erlebnisData.schedule || null,
          media_url: publicUrl,
          status: "published",
          created_at: new Date().toISOString(),
        });
        if (e) throw e;
      }

      setPhase("done");
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 1600);
    } catch(err) {
      console.error("[UniversalPost]", err);
      setError(err.message || "Fehler beim Veröffentlichen. Bitte nochmal.");
      setLoading(false);
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:610   /* Z.membership */,
        background:"rgba(0,0,0,0.45)",
        backdropFilter:"blur(5px)",
        WebkitBackdropFilter:"blur(5px)",
      }}/>

      {/* Sheet */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:420   /* Z.create */,
        background:C.card,
        borderRadius:"28px 28px 0 0",
        maxHeight:"93vh",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -8px 48px rgba(0,0,0,0.18)",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        animation:"upfFadeUp 0.36s cubic-bezier(0.34,1.3,0.64,1) both",
      }}>
        {/* Handle */}
        <div style={{
          width:40, height:4, borderRadius:999,
          background:"rgba(0,0,0,0.12)",
          margin:"14px auto 0", flexShrink:0,
        }}/>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 20px 0", flexShrink:0,
        }}>
          <div style={{ fontWeight:800, fontSize:18, color:C.ink, letterSpacing:-0.4 }}>
            {phase === "upload" && "Beitrag erstellen"}
            {phase === "type"   && "Was ist das?"}
            {phase === "form"   && `${TYPES[postType]?.emoji} ${TYPES[postType]?.label} veröffentlichen`}
            {phase === "done"   && "Veröffentlicht! ✨"}
          </div>
          {phase !== "done" && (
            <button onClick={onClose} className="upf-tap" style={{
              width:32, height:32, borderRadius:50,
              background:"rgba(0,0,0,0.06)", border:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13"
                  stroke="#666" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="upf-scroll"
          style={{ flex:1, overflowY:"auto",
            WebkitOverflowScrolling:"touch",
            padding:"18px 20px 8px" }}>

          {/* ── PHASE: upload ── */}
          {phase === "upload" && (
            <div style={{ animation:"upfFadeUp 0.3s ease both" }}>
              <input ref={fileRef} type="file"
                accept="image/*,video/*"
                onChange={handleFile}
                style={{ display:"none" }}
                capture="environment"
              />

              {/* Upload area */}
              <div onClick={() => fileRef.current?.click()}
                className="upf-tap"
                style={{
                  height:200, borderRadius:22,
                  background:`linear-gradient(145deg,${C.teal}08,${C.coral}06)`,
                  border:`2px dashed rgba(22,215,197,0.35)`,
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:12,
                  marginBottom:24,
                }}>
                <div style={{ fontSize:44 }}>📁</div>
                <div style={{ fontWeight:700, fontSize:15, color:C.ink }}>
                  Foto oder Video auswählen
                </div>
                <div style={{ fontSize:13, color:C.muted }}>
                  Aus Galerie oder Kamera
                </div>
              </div>

              {/* Or use camera directly */}
              <div style={{ display:"flex", gap:12 }}>
                {[
                  { label:"📷  Kamera", accept:"image/*", capture:"environment" },
                  { label:"🎥  Video",  accept:"video/*", capture:"environment" },
                ].map((opt,i) => {
                  const r = React.createRef();
                  return (
                    <React.Fragment key={i}>
                      <input ref={r} type="file"
                        accept={opt.accept} capture={opt.capture}
                        onChange={handleFile}
                        style={{ display:"none" }}/>
                      <button className="upf-tap"
                        onClick={() => r.current?.click()}
                        style={{
                          flex:1, padding:"14px",
                          background:"rgba(0,0,0,0.03)",
                          border:"1.5px solid rgba(0,0,0,0.08)",
                          borderRadius:16, fontSize:14, fontWeight:700,
                          color:C.ink2, cursor:"pointer", fontFamily:"inherit",
                        }}>
                        {opt.label}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PHASE: type selection ── */}
          {phase === "type" && (
            <div style={{ animation:"upfFadeUp 0.3s ease both" }}>
              {/* Preview */}
              {preview && (
                <div style={{
                  height:180, borderRadius:18, overflow:"hidden",
                  marginBottom:20, position:"relative",
                  boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
                }}>
                  {mediaType === "video"
                    ? <video src={preview} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <img src={preview} alt=""
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  }
                </div>
              )}

              <div style={{
                fontSize:15, fontWeight:600, color:C.muted,
                marginBottom:16, letterSpacing:0.1,
              }}>
                Was möchtest du teilen?
              </div>

              {/* Type cards */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {Object.entries(TYPES).map(([key, type]) => (
                  <button key={key}
                    onClick={() => { setPostType(key); setPhase("form"); }}
                    className="upf-tap"
                    style={{
                      display:"flex", alignItems:"center", gap:16,
                      padding:"18px 18px",
                      background: type.bg,
                      border:`1.5px solid ${type.border}`,
                      borderRadius:18, cursor:"pointer",
                      fontFamily:"inherit", textAlign:"left",
                      transition:"all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
                      boxShadow:`0 2px 14px ${type.color}10`,
                    }}>
                    <div style={{
                      width:52, height:52, borderRadius:16, flexShrink:0,
                      background:`${type.color}18`,
                      border:`1.5px solid ${type.color}28`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:24,
                    }}>
                      {type.emoji}
                    </div>
                    <div>
                      <div style={{
                        fontWeight:800, fontSize:16, color:C.ink,
                        letterSpacing:-0.2, marginBottom:3,
                      }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize:13, color:C.muted, lineHeight:1.4 }}>
                        {type.desc}
                      </div>
                    </div>
                    <div style={{
                      marginLeft:"auto", color:C.muted2, fontSize:18,
                    }}>›</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PHASE: form ── */}
          {phase === "form" && (
            <div style={{ animation:"upfFadeUp 0.3s ease both" }}>
              {/* Mini preview */}
              {preview && (
                <div style={{
                  height:120, borderRadius:16, overflow:"hidden",
                  marginBottom:20, position:"relative",
                }}>
                  <img src={preview} alt=""
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  <button onClick={() => setPhase("type")}
                    style={{
                      position:"absolute", top:8, left:8,
                      background:"rgba(0,0,0,0.45)",
                      backdropFilter:"blur(6px)",
                      WebkitBackdropFilter:"blur(6px)",
                      border:"none", borderRadius:10,
                      color:"white", fontSize:12, fontWeight:600,
                      padding:"5px 10px", cursor:"pointer",
                    }}>
                    ← Typ ändern
                  </button>
                </div>
              )}

              {postType === "moment" && (
                <MomentForm data={momentData}
                  onChange={(k,v) => changeData("moment",k,v)}/>
              )}
              {postType === "werk" && (
                <WerkForm data={werkData}
                  onChange={(k,v) => changeData("werk",k,v)}/>
              )}
              {postType === "erlebnis" && (
                <ErlebnisForm data={erlebnisData}
                  onChange={(k,v) => changeData("erlebnis",k,v)}/>
              )}

              {error && (
                <div style={{
                  padding:"10px 14px",
                  background:"rgba(255,100,100,0.08)",
                  border:"1px solid rgba(255,100,100,0.2)",
                  borderRadius:12, fontSize:13, color:"#c00",
                  marginTop:8,
                }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── PHASE: done ── */}
          {phase === "done" && (
            <div style={{
              textAlign:"center", padding:"32px 20px",
              animation:"upfFadeUp 0.4s ease both",
            }}>
              <div style={{
                fontSize:72,
                animation:"upfSuccess 0.5s cubic-bezier(0.34,1.4,0.64,1) both",
                display:"block", marginBottom:16,
              }}>
                ✨
              </div>
              <div style={{
                fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.6, marginBottom:10,
              }}>
                Veröffentlicht!
              </div>
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
                Dein {TYPES[postType]?.label} ist jetzt sichtbar.
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {(phase === "form") && (
          <div style={{ padding:"12px 20px max(24px,env(safe-area-inset-bottom,24px))", flexShrink:0 }}>
            <button onClick={handlePublish} disabled={loading}
              style={{
                width:"100%", padding:"17px",
                background: loading
                  ? "rgba(0,0,0,0.08)"
                  : `linear-gradient(135deg,${C.teal},${C.coral})`,
                border:"none", borderRadius:18,
                color: loading ? C.muted : "white",
                fontSize:16, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit", letterSpacing:0.2,
                boxShadow: loading ? "none" : `0 4px 22px ${C.tealGlow}`,
                display:"flex", alignItems:"center",
                justifyContent:"center", gap:8,
                WebkitTapHighlightColor:"transparent",
                transition:"all 0.22s",
              }}>
              {loading ? (
                <>
                  <div style={{
                    width:16, height:16, borderRadius:"50%",
                    border:"2px solid rgba(0,0,0,0.2)",
                    borderTopColor:C.teal,
                    animation:"upfSpin 0.7s linear infinite",
                  }}/>
                  Wird veröffentlicht…
                </>
              ) : "Jetzt veröffentlichen ✨"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

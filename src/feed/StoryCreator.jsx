// src/feed/StoryCreator.jsx — Phase 3B Polish
// ═══════════════════════════════════════════════════════════════
// Bulletproof fullscreen story composer.
// NEVER shows black screen — Step "pick" always visible.
// Uses window.innerHeight (px) not height:"100%" (iPad Safari fix).
// ═══════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const BG    = "#0D0D1A";
const PANEL = "rgba(255,255,255,0.07)";
const BORD  = "rgba(255,255,255,0.13)";
const DIM   = "rgba(255,255,255,0.45)";

const MOODS = ["✨","🌿","🔥","💙","🌙","☀️","🎵","💡","🤝","🌍"];

export default function StoryCreator({ onClose, onPublished }) {
  const { user } = useAuth();

  const [step,      setStep]    = useState("pick"); // "pick" | "compose" | "preview"
  const [file,      setFile]    = useState(null);
  const [preview,   setPreview] = useState(null);
  const [mtype,     setMtype]   = useState("image");
  const [caption,   setCaption] = useState("");
  const [mood,      setMood]    = useState("");
  const [busy,      setBusy]    = useState(false);
  const [err,       setErr]     = useState(null);

  const gallRef = useRef(null);
  const camRef  = useRef(null);

  function pickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(f);
    setMtype(f.type.startsWith("video/") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
    setStep("compose");
  }

  const publish = useCallback(async () => {
    if (!user?.id) { setErr("Nicht eingeloggt."); return; }
    setBusy(true); setErr(null);
    try {
      let media_url = null;
      if (file) {
        const ext  = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: e1 } = await supabase.storage.from("stories-media").upload(path, file, { upsert: true });
        if (!e1) {
          const { data: p } = supabase.storage.from("stories-media").getPublicUrl(path);
          media_url = p?.publicUrl || null;
        } else {
          const { error: e2 } = await supabase.storage.from("media").upload(`stories/${path}`, file, { upsert: true });
          if (!e2) {
            const { data: p } = supabase.storage.from("media").getPublicUrl(`stories/${path}`);
            media_url = p?.publicUrl || null;
          }
        }
      }
      const { error: ie } = await supabase.from("stories").insert({
        user_id:         user.id,
        username:        user.user_metadata?.username || user.user_metadata?.display_name || user.email?.split("@")[0] || "Human",
        avatar_url:      user.user_metadata?.avatar_url || null,
        media_url,
        media_type:      mtype,
        caption:         caption.trim() || null,
        text_overlay:    caption.trim() || null,
        mood:            mood || null,
        visibility:      "public",
        status:          "active",
        allow_comments:  true,
        allow_reactions: true,
        allow_sharing:   true,
        expires_at:      new Date(Date.now() + 86400000).toISOString(),
      });
      if (ie) { setErr("Fehler: " + ie.message); return; }
      window.dispatchEvent(new Event("stories-refresh"));
      onPublished?.({});
      onClose?.();
    } catch (e) {
      setErr("Fehler: " + (e?.message || "Unbekannt"));
    } finally {
      setBusy(false);
    }
  }, [user, file, mtype, caption, mood, onClose, onPublished]);

  const vh = (typeof window !== "undefined" && window.innerHeight > 0) ? window.innerHeight : 812;

  // ── Root — NEVER has opacity in animation, ALWAYS has explicit px height
  const root = {
    position: "fixed", top: 0, left: 0, width: "100%",
    height: vh + "px", minHeight: vh + "px",
    zIndex: 11500, background: BG,
    display: "flex", flexDirection: "column",
    fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    overflowX: "hidden", overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    boxSizing: "border-box",
  };

  function Header({ title, right }) {
    return (
      <div style={{
        display: "flex", alignItems: "center", flexShrink: 0,
        padding: `calc(env(safe-area-inset-top,14px) + 10px) 16px 14px`,
        borderBottom: `1px solid ${BORD}`, background: BG, minHeight: 58,
      }}>
        <button onClick={step === "pick" ? onClose : () => setStep(step === "preview" ? "compose" : "pick")}
          style={{ background:"none", border:"none", color: DIM, fontSize:24, cursor:"pointer",
            padding:"4px 12px 4px 0", touchAction:"manipulation", lineHeight:1, minWidth:40 }}>
          {step === "pick" ? "×" : "←"}
        </button>
        <div style={{ flex:1, textAlign:"center", color:"#fff", fontWeight:700, fontSize:16 }}>{title}</div>
        {right || <div style={{ minWidth:60 }} />}
      </div>
    );
  }

  return (
    <div style={root}>
      {/* Hidden file inputs */}
      <input ref={gallRef} type="file" accept="image/*,video/*" onChange={pickFile}
        style={{ position:"absolute", opacity:0, pointerEvents:"none", width:1, height:1, top:-9999 }} />
      <input ref={camRef}  type="file" accept="image/*" capture="environment" onChange={pickFile}
        style={{ position:"absolute", opacity:0, pointerEvents:"none", width:1, height:1, top:-9999 }} />

      {err && (
        <div style={{ padding:"10px 16px", background:"rgba(255,80,80,0.18)", color:"#FF6B6B",
          fontSize:13, textAlign:"center", flexShrink:0, display:"flex", justifyContent:"space-between" }}>
          <span>{err}</span>
          <button onClick={() => setErr(null)} style={{ background:"none",border:"none",color:"#FF6B6B",fontSize:16,cursor:"pointer" }}>×</button>
        </div>
      )}

      {/* ── STEP 1: PICK ─────────────────────────────────────── */}
      {step === "pick" && (
        <>
          <Header title="Dein Moment" />
          <div style={{
            flex: "1 1 auto", display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            gap: 28, padding: "32px 28px",
            minHeight: Math.max(320, vh - 100) + "px",
            boxSizing: "border-box",
          }}>
            {/* Headline */}
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>✦</div>
              <div style={{ color:"#fff", fontSize:22, fontWeight:800, marginBottom:8 }}>Teile deinen Moment</div>
              <div style={{ color:DIM, fontSize:14, maxWidth:260, margin:"0 auto", lineHeight:1.6 }}>
                24 Stunden sichtbar — dann weg.
              </div>
            </div>

            {/* Big gallery CTA */}
            <button
              onClick={() => gallRef.current?.click()}
              style={{
                width: Math.min(200, (vh * 0.24)) + "px",
                height: Math.min(200, (vh * 0.24)) + "px",
                borderRadius: "50%",
                border: `2.5px dashed rgba(22,215,197,0.5)`,
                background: "rgba(22,215,197,0.07)",
                display: "flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:12,
                cursor:"pointer", touchAction:"manipulation",
                color: TEAL,
              }}
            >
              <span style={{ fontSize:52, lineHeight:1 }}>🖼</span>
              <span style={{ fontSize:14, fontWeight:700 }}>Galerie öffnen</span>
            </button>

            {/* Secondary row */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
              {[
                { icon:"📷", label:"Kamera",   action: () => camRef.current?.click() },
                { icon:"✏️", label:"Nur Text",  action: () => setStep("compose") },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action} style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"12px 22px", background:PANEL,
                  border:`1.5px solid ${BORD}`, borderRadius:24,
                  color:"#fff", fontSize:14, fontWeight:600,
                  cursor:"pointer", touchAction:"manipulation",
                }}>
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>

            <p style={{ color:"rgba(255,255,255,0.22)", fontSize:12, textAlign:"center", maxWidth:220 }}>
              Bilder & Videos bis 50 MB
            </p>
          </div>
        </>
      )}

      {/* ── STEP 2: COMPOSE ─────────────────────────────────── */}
      {step === "compose" && (
        <>
          <Header title="Beschreibung" />
          <div style={{ flex:"1 1 auto", display:"flex", flexDirection:"column", minHeight:320 }}>

            {/* Preview or placeholder */}
            <div style={{ flexShrink:0, height: Math.min(vh * 0.42, 300) + "px", position:"relative",
              background:"#000", overflow:"hidden", cursor: preview ? "default" : "pointer" }}
              onClick={!preview ? () => gallRef.current?.click() : undefined}
            >
              {preview && mtype === "video" && (
                <video src={preview} autoPlay muted playsInline loop style={{ width:"100%",height:"100%",objectFit:"cover" }} />
              )}
              {preview && mtype !== "video" && (
                <img src={preview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
              )}
              {!preview && (
                <div style={{ width:"100%",height:"100%",
                  background:`linear-gradient(135deg, rgba(22,215,197,0.15), rgba(255,138,107,0.15))`,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10 }}>
                  <span style={{ fontSize:38 }}>➕</span>
                  <span style={{ color:DIM, fontSize:14 }}>Bild hinzufügen</span>
                </div>
              )}
              {preview && (
                <button onClick={() => gallRef.current?.click()} style={{
                  position:"absolute", top:12, right:12,
                  background:"rgba(8,8,16,0.7)", border:`1px solid ${BORD}`,
                  borderRadius:20, padding:"6px 14px", color:"#fff",
                  fontSize:13, fontWeight:600, cursor:"pointer",
                  backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
                  touchAction:"manipulation",
                }}>Ändern</button>
              )}
            </div>

            {/* Caption */}
            <div style={{ padding:"16px 16px 8px", flexShrink:0 }}>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Was ist dein Moment? (optional)"
                maxLength={200} rows={3}
                style={{
                  width:"100%", background:PANEL, border:`1.5px solid ${BORD}`,
                  borderRadius:16, padding:"14px 16px", color:"#fff",
                  fontSize:16, lineHeight:1.55, resize:"none", outline:"none",
                  fontFamily:"inherit", boxSizing:"border-box",
                }}
              />
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
                <span style={{ color:"rgba(255,255,255,0.22)", fontSize:11 }}>{caption.length}/200</span>
              </div>
            </div>

            {/* Mood */}
            <div style={{ padding:"0 16px 16px", flexShrink:0 }}>
              <div style={{ color:DIM, fontSize:12, marginBottom:8, fontWeight:600 }}>Stimmung (optional)</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {MOODS.map(m => (
                  <button key={m} onClick={() => setMood(mood === m ? "" : m)} style={{
                    fontSize:22, background: mood === m ? "rgba(22,215,197,0.15)" : PANEL,
                    border: `1.5px solid ${mood === m ? TEAL : BORD}`,
                    borderRadius:12, padding:"6px 8px", cursor:"pointer", touchAction:"manipulation",
                    transform: mood === m ? "scale(1.15)" : "scale(1)",
                    transition:"all 0.14s ease",
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {/* Spacer + CTA */}
            <div style={{ flex:1 }} />
            <div style={{ padding:"0 16px calc(env(safe-area-inset-bottom,16px) + 16px)", flexShrink:0 }}>
              <button onClick={() => setStep("preview")} style={{
                width:"100%", padding:"15px",
                background:`linear-gradient(135deg, ${TEAL}, ${CORAL})`,
                border:"none", borderRadius:22,
                color:"#fff", fontWeight:800, fontSize:16,
                cursor:"pointer", touchAction:"manipulation",
              }}>
                Vorschau →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 3: PREVIEW ─────────────────────────────────── */}
      {step === "preview" && (
        <>
          <Header title="Vorschau"
            right={
              <button onClick={publish} disabled={busy} style={{
                background: busy ? "rgba(22,215,197,0.35)" : `linear-gradient(135deg,${TEAL},${CORAL})`,
                border:"none", borderRadius:20, padding:"8px 20px",
                color:"#fff", fontWeight:700, fontSize:14,
                cursor: busy ? "default" : "pointer", touchAction:"manipulation",
                opacity: busy ? 0.7 : 1,
              }}>{busy ? "…" : "Teilen ✦"}</button>
            }
          />
          <div style={{ flex:"1 1 auto", display:"flex", flexDirection:"column", minHeight:320 }}>
            <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#000", minHeight:200 }}>
              {preview && mtype !== "video" && <img src={preview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />}
              {preview && mtype === "video" && <video src={preview} autoPlay muted playsInline loop style={{ width:"100%",height:"100%",objectFit:"cover" }} />}
              {!preview && (
                <div style={{ width:"100%",height:"100%", minHeight:200,
                  background:`linear-gradient(135deg, ${TEAL}44, ${CORAL}44)`,
                  display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <span style={{ fontSize:52 }}>{mood || "✦"}</span>
                </div>
              )}
              {caption.trim() && (
                <div style={{
                  position:"absolute", bottom:20, left:16, right:16,
                  padding:"12px 18px",
                  background:"rgba(8,8,16,0.65)",
                  backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
                  borderRadius:18, color:"#fff", fontSize:16,
                  lineHeight:1.5, textAlign:"center",
                  textShadow:"0 1px 8px rgba(0,0,0,0.5)",
                }}>{caption}</div>
              )}
              {mood && (
                <div style={{ position:"absolute", top:16, right:16, fontSize:28,
                  background:"rgba(8,8,16,0.5)", borderRadius:12, padding:"4px 8px" }}>
                  {mood}
                </div>
              )}
            </div>
            <div style={{ padding:"14px 16px calc(env(safe-area-inset-bottom,16px) + 14px)",
              background:BG, borderTop:`1px solid ${BORD}`, display:"flex", gap:12, flexShrink:0 }}>
              <button onClick={() => setStep("compose")} style={{
                flex:1, padding:"14px", background:PANEL,
                border:`1.5px solid ${BORD}`, borderRadius:20,
                color:DIM, fontSize:15, fontWeight:600,
                cursor:"pointer", touchAction:"manipulation",
              }}>Bearbeiten</button>
              <button onClick={publish} disabled={busy} style={{
                flex:2, padding:"14px",
                background: busy ? "rgba(22,215,197,0.35)" : `linear-gradient(135deg,${TEAL},${CORAL})`,
                border:"none", borderRadius:20, color:"#fff",
                fontSize:15, fontWeight:800, cursor: busy ? "default" : "pointer",
                touchAction:"manipulation", opacity: busy ? 0.7 : 1,
              }}>{busy ? "Wird geteilt…" : "✦ Story teilen"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

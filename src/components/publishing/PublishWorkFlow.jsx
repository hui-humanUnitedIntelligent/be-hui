// src/components/publishing/PublishWorkFlow.jsx
// Phase 4 — Creator Publishing System
// Works veröffentlichen: Foto/Video + Caption + Kategorie + optional Preis
// Schema: works(user_id, title, cover_url, media_url, caption, category, tags, price, status)

import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth }  from "../../lib/AuthContext.jsx";
import {
  assertSupabaseResult,
  emitFeedRefresh,
  reportSupabaseFailure,
} from "../../lib/supabaseDiagnostics.js";

const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  cream:  "#F9F7F4",
  ink:    "#1A1A2E",
  muted:  "rgba(80,80,80,0.55)",
  glass:  "rgba(255,255,255,0.88)",
};

const CATS = [
  "Keramik","Malerei","Illustration","Fotografie","Musik","Tanz","Textil",
  "Holz","Schmuck","Skulptur","Design","Performance","Schreiben","Film","Sonstiges"
];

export default function PublishWorkFlow({ onClose, onPublished }) {
  const { user } = useAuth();
  const [step,     setStep]     = useState(1);
  const [media,    setMedia]    = useState(null);
  const [form,     setForm]     = useState({ title:"", caption:"", category:"", tags:[], price:"", forSale:false });
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error,     setError]    = useState(null);
  const fileRef = useRef();

  const handleFile = useCallback(e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMedia({ url, file, type: file.type.startsWith("video") ? "video" : "image" });
    setStep(2);
  }, []);

  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 8) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput("");
    }
  }, [tagInput, form.tags]);

  const removeTag = useCallback(t => {
    setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
  }, []);

  const handlePublish = useCallback(async () => {
    if (!user?.id) return setError("Nicht eingeloggt.");
    if (!form.title && !form.caption) return setError("Bitte Titel oder Caption angeben.");
    setUploading(true);
    setError(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const authUid = sessionData?.session?.user?.id || user.id;
      if (sessionError || !authUid) {
        await reportSupabaseFailure({
          title: "SUPABASE INSERT FAILED",
          source: "PublishWorkFlow.handlePublish",
          operation: "auth.session",
          table: "works",
          payload: form,
          error: sessionError || { message: "Keine Supabase Auth Session oder uid vorhanden", code: "AUTH_SESSION_MISSING" },
          authUid,
        });
        throw new Error("Nicht eingeloggt.");
      }

      let media_url = null, cover_url = null, media_type = "image";

      if (media?.file) {
        const ext  = media.file.name.split(".").pop();
        const path = `${authUid}/${Date.now()}.${ext}`;
        const uploadResult = await supabase.storage
          .from("works").upload(path, media.file, {
            contentType: media.file.type || undefined,
            upsert: false,
          });
        await assertSupabaseResult(uploadResult, {
          title: "SUPABASE UPLOAD FAILED",
          source: "PublishWorkFlow.mediaUpload",
          operation: "storage.upload",
          bucket: "works",
          path,
          payload: { file: media.file, mediaType: media.type },
          authUid,
        });
        const { data: { publicUrl } } = supabase.storage.from("works").getPublicUrl(path);
        if (!publicUrl) {
          await reportSupabaseFailure({
            title: "SUPABASE UPLOAD FAILED",
            source: "PublishWorkFlow.storagePublicUrl",
            operation: "storage.getPublicUrl",
            bucket: "works",
            path,
            payload: { uploadPath: path },
            error: { message: "Storage upload returned no publicUrl", code: "STORAGE_PUBLIC_URL_MISSING" },
            authUid,
          });
          throw new Error("Upload lieferte keine Public URL.");
        }
        media_url = publicUrl;
        cover_url = publicUrl;
        media_type = media.type;
      }

      const payload = {
        user_id:    authUid,
        creator_id: authUid,
        title:      form.title   || form.caption?.slice(0,60) || "Werk",
        caption:    form.caption || null,
        category:   form.category || null,
        tags:       form.tags.length > 0 ? form.tags : null,
        media_url, cover_url, media_type,
        price:      form.forSale && form.price ? parseFloat(form.price) : null,
        for_sale:   form.forSale,
        status:     "published",
      };

      const { data, error: insErr } = await supabase
        .from("works").insert(payload).select("id").single();

      await assertSupabaseResult({ data, error: insErr }, {
        title: "SUPABASE INSERT FAILED",
        source: "PublishWorkFlow.worksInsert",
        operation: "insert",
        table: "works",
        payload,
        authUid,
      }, { requireData: true });

      console.log("[HUI_REALITY] work published \u2713", data?.id);
      emitFeedRefresh({ source: "PublishWorkFlow", table: "works", id: data?.id });
      onPublished?.({ id: data?.id, ...payload });
      onClose?.();
    } catch(err) {
      console.error("[HUI_PUBLISH] Fehler:", err.message);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [user, form, media, onPublished, onClose]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:12000,
      background:"rgba(0,0,0,0.72)", backdropFilter:"blur(20px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <div style={{
        width:"100%", maxWidth:480,
        background:C.cream, borderRadius:"24px 24px 0 0",
        padding:"0 0 env(safe-area-inset-bottom,16px)",
        maxHeight:"92vh", overflowY:"auto",
      }}>
        <div style={{ padding:"12px 0 0", display:"flex", justifyContent:"center" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px 0" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:C.ink }}>
            {step === 1 ? "Werk teilen" : "Details"}
          </h2>
          <button onClick={onClose} style={{
            background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.muted, lineHeight:1, padding:4,
          }}>x</button>
        </div>

        {step === 1 && (
          <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display:"none" }}/>
            <button onClick={() => fileRef.current?.click()} style={{
              height:200, borderRadius:20, border:"2px dashed rgba(22,215,197,0.4)",
              background:"rgba(22,215,197,0.04)", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:12, color:C.muted,
            }}>
              <span style={{ fontSize:40 }}>📸</span>
              <span style={{ fontSize:15, fontWeight:600 }}>Foto oder Video wählen</span>
            </button>
            <button onClick={() => setStep(2)} style={{
              padding:14, borderRadius:14, background:"rgba(0,0,0,0.06)",
              border:"none", color:C.muted, fontSize:14, cursor:"pointer",
            }}>Nur Text teilen</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding:"16px 20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
            {media?.url && (
              <div style={{ borderRadius:16, overflow:"hidden", height:180, position:"relative" }}>
                {media.type === "video"
                  ? <video src={media.url} style={{ width:"100%", height:"100%", objectFit:"cover" }} muted/>
                  : <img src={media.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                }
                <button onClick={() => { setMedia(null); setStep(1); }} style={{
                  position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.5)",
                  border:"none", color:"#fff", borderRadius:20, padding:"4px 10px",
                  fontSize:12, cursor:"pointer",
                }}>x</button>
              </div>
            )}
            <textarea
              placeholder="Erzaehl etwas ueber dieses Werk..."
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              rows={3}
              style={{
                width:"100%", padding:"12px 14px", borderRadius:12,
                border:"1.5px solid rgba(0,0,0,0.10)", background:C.glass,
                fontSize:15, resize:"none", boxSizing:"border-box",
                fontFamily:"inherit", color:C.ink, outline:"none",
              }}
            />
            <input type="text" placeholder="Titel (optional)" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{
                width:"100%", padding:"12px 14px", borderRadius:12,
                border:"1.5px solid rgba(0,0,0,0.10)", background:C.glass,
                fontSize:15, boxSizing:"border-box", fontFamily:"inherit", color:C.ink, outline:"none",
              }}
            />
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:6 }}>Kategorie</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {CATS.map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: f.category === cat ? "" : cat }))}
                    style={{
                      padding:"6px 12px", borderRadius:99, border:"none",
                      background: form.category === cat ? `linear-gradient(135deg,${C.teal},${C.coral})` : "rgba(0,0,0,0.07)",
                      color: form.category === cat ? "#fff" : C.muted,
                      fontSize:12, fontWeight:600, cursor:"pointer",
                    }}>{cat}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <input type="checkbox" checked={form.forSale}
                  onChange={e => setForm(f => ({ ...f, forSale: e.target.checked }))}/>
                <span style={{ fontSize:14, color:C.ink }}>Zum Verkauf anbieten</span>
              </label>
              {form.forSale && (
                <input type="number" placeholder="Preis EUR"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={{
                    width:100, padding:"8px 10px", borderRadius:10,
                    border:"1.5px solid rgba(0,0,0,0.10)", background:C.glass,
                    fontSize:14, outline:"none",
                  }}/>
              )}
            </div>
            {error && (
              <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,80,80,0.08)", color:"#E53E3E", fontSize:13 }}>
                {error}
              </div>
            )}
            <button onClick={handlePublish} disabled={uploading} style={{
              padding:16, borderRadius:16,
              background: uploading ? "rgba(0,0,0,0.1)" : `linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", color: uploading ? C.muted : "#fff",
              fontSize:16, fontWeight:700, cursor: uploading ? "not-allowed" : "pointer",
              letterSpacing:-0.3,
            }}>
              {uploading ? "Veroeffentlichen..." : "Werk veroeffentlichen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

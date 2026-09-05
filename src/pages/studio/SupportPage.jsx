// src/pages/studio/SupportPage.jsx
// HUI Support — Kontaktformular mit Ticket-System
import React, { useState, useRef } from "react";
import { toSafeUploadBody } from "../../lib/uploadBody.js";
import { supabase } from "../../lib/supabaseClient.js";
import { processFileSelection, UPLOAD_LIMITS } from "../../lib/uploadUtils.js";
import { HUI } from "../../design/hui.design.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const C = {
  teal:    HUI.COLOR.tealStudio,
  coral:   HUI.COLOR.coralStudio,
  cream:   HUI.COLOR.creamStudio,
  ink:     HUI.COLOR.inkStudio,
  muted:   "rgba(80,80,80,0.55)",
  border:  "rgba(0,0,0,0.08)",
  red:     HUI.COLOR.redStatus,
  green:   HUI.COLOR.greenStatus,
  gold:    HUI.COLOR.goldStatus,
};

function getCategories(t) { return [
  { key:"fehler",        label:"🐛 Fehler melden",       desc:"Etwas funktioniert nicht" },
  { key:"verbesserung",  label:t("sup.verbesserung"),desc:t("sup.ideeFuerFunktion")   },
  { key:"anfrage",       label:t("sup.frage"),   desc:t("sup.allgemeineAnfrage")       },
  { key:"hilfe",         label:t("sup.hilfeBenoetigt"),desc:t("sup.kommeNichtWeiter")    },
  { key:"passwort",      label:t("sup.passwortZugang"),desc:t("sup.loginProbleme")            },
  { key:"konto",         label:t("sup.kontoProblem"),desc:t("sup.accountProfilDaten")    },
  { key:"zahlung",       label:t("sup.zahlung"), desc:t("sup.zahlungDesc")            },
  { key:"sonstiges",     label:t("sup.sonstiges"),desc:t("sup.allesAndere")              },
];
}

const PRIORITY_MAP = {
  fehler:"high", verbesserung:"low", anfrage:"normal",
  hilfe:"high", passwort:"urgent", konto:"normal",
  zahlung:"high", sonstiges:"low",
};

function generateTicketNumber() {
  const now  = new Date();
  const pad  = n => String(n).padStart(2,'0');
  const rand = Math.floor(Math.random()*900)+100;
  return `HUI-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${rand}`;
}

export default function SupportPage({ onBack, userId, userEmail, userName }) {
  const { t, lang } = useTranslation();
  const [step,      setStep]      = useState("form"); // form | success
  const [category,  setCategory]  = useState(null);
  const [form,      setForm]      = useState({
    name: userName || "", email: userEmail || "",
    subject: "", message: "",
  });
  const [files,    setFiles]    = useState([]);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [ticketNr, setTicketNr] = useState("");
  const fileRef = useRef(null);

  const inp = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name erforderlich";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              e.email   = t("sup.gueltigeEmail");
    if (!category)            e.category= t("sup.kategorieWaehlen");
    if (!form.subject.trim()) e.subject = "Betreff erforderlich";
    if (!form.message.trim() || form.message.length < 20)
                              e.message = "Nachricht zu kurz (min. 20 Zeichen)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFiles = e => {
    const { accepted } = processFileSelection(e.target.files || [], files.length);
    setFiles(prev => [...prev, ...accepted].slice(0, UPLOAD_LIMITS.MAX_FILES));
  };

  const removeFile = idx => setFiles(prev => prev.filter((_,i) => i !== idx));

  const uploadFiles = async (ticketNumber) => {
    const urls = [];
    for (const file of files) {
      try {
        const ext  = file.name.split('.').pop();
        const path = `support/${ticketNumber}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from('media').upload(path, await toSafeUploadBody(file), { cacheControl:'3600', upsert:false });
        if (!error && data) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
          urls.push({ name:file.name, url:urlData.publicUrl, type:file.type, size:file.size });
        }
      } catch { /* upload optional */ }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const tn = generateTicketNumber();
      const attachments = await uploadFiles(tn);

      const ticketData = {
        ticket_number: tn,
        name:          form.name.trim(),
        email:         form.email.trim(),
        category,
        priority:      PRIORITY_MAP[category] ?? "normal",
        subject:       form.subject.trim(),
        message:       form.message.trim(),
        status:        "open",
        attachments,
        admin_reply:   null,
        replied_at:    null,
        read_by_admin: false,
      };

      const { error } = await supabase.from("notifications").insert({
        user_id:       userId || null,
        type:          "support_ticket",
        title:         `[${tn}] ${form.subject.trim()}`,
        body:          form.message.trim().slice(0,200),
        data:          ticketData,
        is_read:       false,
        target_user_id: null,
      });

      if (error) throw error;

      // Bestätigungsmail an Nutzer senden (non-blocking — Ticket ist bereits in DB)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ticket-confirmation`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            email:        form.email.trim(),
            name:         form.name.trim(),
            ticketNumber: tn,
            subject:      form.subject.trim(),
            message:      form.message.trim(),
            lang,
            category:     category || "",
            priority:      PRIORITY_MAP[category] ?? "normal",
          }),
        });
      } catch (mailErr) {
        console.warn("[SupportPage] send-ticket-confirmation (non-blocking):", mailErr);
      }

      setTicketNr(tn);
      setStep("success");
    } catch {
      setErrors({ submit: "Fehler beim Senden. Bitte versuche es erneut." });
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ──
  const inputStyle = {
    width:"100%", padding:"12px 14px",
    borderRadius:10, fontSize:15,
    border:`1.5px solid ${C.border}`,
    background:"white", color:C.ink,
    outline:"none", boxSizing:"border-box",
    fontFamily:"inherit",
    transition:"border-color 0.15s",
  };
  const errStyle = { color:C.red, fontSize:12, marginTop:4 };
  const labelStyle = { fontSize:13, fontWeight:600, color:C.ink, marginBottom:6, display:"block" };

  // ── Success Screen ──
  if (step === "success") {
    return (
      <div style={{ position:"fixed", inset:0, background:C.cream, display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center",
        fontFamily:"Inter,sans-serif",
        padding:24, textAlign:"center" }}>
        <div style={{ width:80, height:80, borderRadius:40,
          background:"rgba(22,215,197,0.12)", display:"flex",
          alignItems:"center", justifyContent:"center", fontSize:36, marginBottom:20 }}>
          ✅
        </div>
        <h2 style={{ fontSize:22, fontWeight: 600, color:C.ink, margin:"0 0 10px" }}>
          {t("support.created")}
        </h2>
        <p style={{ fontSize:15, color:C.muted, margin:"0 0 20px", lineHeight:1.5 }}>
          {t("support.createdDesc")}<br/>
          {t("sup.adminKuemmertSich")}
        </p>
        <div style={{ background:"white", border:`1px solid ${C.border}`,
          borderRadius:12, padding:"14px 24px", marginBottom:28 }}>
          <p style={{ margin:0, fontSize:12, color:C.muted }}>{t("support.ticketNr")}</p>
          <p style={{ margin:"4px 0 0", fontSize:20, fontWeight: 600,
            color:C.teal, fontFamily:"monospace", letterSpacing:1 }}>
            {ticketNr}
          </p>
        </div>
        <p style={{ fontSize:13, color:C.muted, margin:"0 0 28px", lineHeight:1.5 }}>
          Wir antworten an: <strong style={{color:C.ink}}>{form.email}</strong><br/>
          Du kannst uns auch unter{" "}
          <a href="mailto:support@be-hui.com" style={{ color:C.teal }}>
            support@be-hui.com
          </a>{" "}
          erreichen.
        </p>
        <button onClick={onBack}
          style={{ padding:"13px 32px", borderRadius:12, border:"none",
            background:C.teal, color:"white", fontSize:15, fontWeight: 600,
            cursor:"pointer" }}>
          {t("sup.zurueckStudio")}
        </button>
      </div>
    );
  }

  // ── Formular ──
  // Embedded-Mode wenn onBack übergeben (läuft innerhalb SettingsModal)
  const embedded = !!onBack;
  return (
    <div style={{
      position: embedded ? "relative" : "fixed",
      ...(embedded ? {} : { inset:0 }),
      background:C.cream, display:"flex",
      flexDirection:"column",
      height: embedded ? "auto" : "100%",
      fontFamily:"Inter,sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12,
        padding: embedded ? "16px 20px" : "max(var(--hui-safe-top, 0px),52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:"white", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:10,
          background:"rgba(0,0,0,0.05)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", fontSize:16 }}>←</button>
        <div>
          <p style={{ margin:0, fontSize:17, fontWeight: 600, color:C.ink }}>{t("support.title")}</p>
          <p style={{ margin:0, fontSize:12, color:C.muted }}>Wir helfen dir gerne weiter</p>
        </div>
      </div>

      {/* Scroll-Content */}
      <div style={{ flex:1, overflowY: embedded ? "visible" : "auto", WebkitOverflowScrolling:"touch",
        padding:"20px 20px 48px" }}>

        {/* Kontaktdaten */}
        <div style={{ background:"white", borderRadius:14, padding:"18px 16px",
          border:`1px solid ${C.border}`, marginBottom:14 }}>
          <p style={{ margin:"0 0 14px", fontSize:14, fontWeight: 600, color:C.ink }}>
            {t("support.kontaktdaten")}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={form.name} onChange={inp("name")} placeholder="Dein Name"
                name="name" type="text" autoComplete="name"
                autoCorrect="on" autoCapitalize="words" inputMode="text"
                style={{ ...inputStyle, borderColor: errors.name ? C.red : C.border }} />
              {errors.name && <p style={errStyle}>{errors.name}</p>}
            </div>
            <div>
              <label style={labelStyle}>E-Mail *</label>
              <input value={form.email} onChange={inp("email")} placeholder="deine@email.com"
                type="email" name="email" autoComplete="email"
                autoCorrect="off" autoCapitalize="none" inputMode="email"
                style={{ ...inputStyle, borderColor: errors.email ? C.red : C.border }} />
              {errors.email && <p style={errStyle}>{errors.email}</p>}
            </div>
          </div>
          <div style={{ marginTop:10 }}>

          </div>
        </div>

        {/* Kategorie */}
        <div style={{ background:"white", borderRadius:14, padding:"18px 16px",
          border:`1px solid ${errors.category ? C.red : C.border}`, marginBottom:14 }}>
          <p style={{ margin:"0 0 14px", fontSize:14, fontWeight: 600, color:C.ink }}>
            🏷️ Problem-Kategorie *
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {getCategories(t).map(cat => (
              <button key={cat.key} onClick={() => { setCategory(cat.key); setErrors(p=>({...p,category:undefined})); }}
                style={{ padding:"10px 12px", borderRadius:10, border:"1.5px solid",
                  borderColor: category === cat.key ? C.teal : C.border,
                  background: category === cat.key ? "rgba(22,215,197,0.08)" : "transparent",
                  textAlign:"left", cursor:"pointer", transition:"all 0.15s" }}>
                <p style={{ margin:0, fontSize:13, fontWeight:600,
                  color: category === cat.key ? C.teal : C.ink }}>{cat.label}</p>
                <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>{cat.desc}</p>
              </button>
            ))}
          </div>
          {errors.category && <p style={{ ...errStyle, marginTop:8 }}>{errors.category}</p>}
        </div>

        {/* Betreff & Nachricht */}
        <div style={{ background:"white", borderRadius:14, padding:"18px 16px",
          border:`1px solid ${C.border}`, marginBottom:14 }}>
          <p style={{ margin:"0 0 14px", fontSize:14, fontWeight: 600, color:C.ink }}>
            ✍️ Dein Anliegen
          </p>
          <div style={{ marginBottom:10 }}>
            <label style={labelStyle}>Betreff *</label>
            <input value={form.subject} onChange={inp("subject")}
              placeholder="Kurze Beschreibung des Problems"
              style={{ ...inputStyle, borderColor: errors.subject ? C.red : C.border }} />
            {errors.subject && <p style={errStyle}>{errors.subject}</p>}
          </div>
          <div>
            <label style={labelStyle}>Nachricht * <span style={{color:C.muted,fontWeight:400}}>(min. 20 Zeichen)</span></label>
            <textarea value={form.message} onChange={inp("message")}
              placeholder={t("sup.beschreibeProblem")}
              rows={5}
              style={{ ...inputStyle, resize:"vertical", lineHeight:1.5,
                borderColor: errors.message ? C.red : C.border }} />
            <p style={{ margin:"4px 0 0", fontSize:11, color:C.muted,
              textAlign:"right" }}>{form.message.length} Zeichen</p>
            {errors.message && <p style={errStyle}>{errors.message}</p>}
          </div>
        </div>

        {/* Datei-Upload */}
        <div style={{ background:"white", borderRadius:14, padding:"18px 16px",
          border:`1px solid ${C.border}`, marginBottom:20 }}>
          <p style={{ margin:"0 0 6px", fontSize:14, fontWeight: 600, color:C.ink }}>
            {t("sup.anhaenge")} <span style={{color:C.muted,fontWeight:400,fontSize:12}}>({t("sup.max5Dateien")})</span>
          </p>
          <p style={{ margin:"0 0 12px", fontSize:12, color:C.muted }}>
            Bilder, Videos, Dokumente — hilft uns das Problem schneller zu verstehen
          </p>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFiles} style={{ display:"none" }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding:"10px 16px", borderRadius:9,
              border:`1.5px dashed ${C.teal}`,
              background:"rgba(22,215,197,0.04)",
              color:C.teal, fontSize:13, fontWeight:600,
              cursor:"pointer", width:"100%", marginBottom:10 }}>
            {t("sup.dateienAuswaehlen")}
          </button>
          {files.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"8px 10px", borderRadius:8, background:"rgba(0,0,0,0.03)",
              marginBottom:6, border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                <span style={{ fontSize:16 }}>
                  {f.type.startsWith("image") ? "🖼" : f.type.startsWith("video") ? "🎬" : "📄"}
                </span>
                <span style={{ fontSize:12, color:C.ink, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>
                  ({(f.size/1024/1024).toFixed(1)}MB)
                </span>
              </div>
              <button onClick={() => removeFile(i)}
                style={{ background:"none", border:"none", color:C.muted,
                  cursor:"pointer", fontSize:16, padding:"0 4px", flexShrink:0 }}>×</button>
            </div>
          ))}
        </div>

        {/* Fehler */}
        {errors.submit && (
          <div style={{ padding:"12px 14px", borderRadius:9,
            background:"rgba(239,68,68,0.08)", border:`1px solid ${C.red}`,
            color:C.red, fontSize:13, marginBottom:14 }}>
            ⚠ {errors.submit}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width:"100%", padding:"15px", borderRadius:12, border:"none",
            background: loading ? "rgba(22,215,197,0.5)" : C.teal,
            color:"white", fontSize:16, fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            letterSpacing:0.3 }}>
          {loading ? t("support.sending") : t("support.send")}
        </button>

        <p style={{ textAlign:"center", fontSize:12, color:C.muted, marginTop:12, lineHeight:1.5 }}>
          {t("sup.absendenBestaetigen")}<br/>
          Wir melden uns unter deiner E-Mail-Adresse.
        </p>
      </div>
    </div>
  );
}

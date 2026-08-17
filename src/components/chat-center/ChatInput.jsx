// chat-center/ChatInput.jsx v4
// Voice Recording + Bild/Video Upload + Text-Compose
// Props: onSend({text, msgType, mediaUrl, mediaType}), sending

import React, { useRef, useState, useCallback } from "react";
import { HUI } from "../../design/hui.design.js";
import { supabase } from "../../lib/supabaseClient.js";
import { toast } from "../../lib/useToast.jsx";

const C = {
  teal:  HUI.COLOR.teal,
  teal2: HUI.COLOR.tealDeep || HUI.COLOR.teal,
  ink:   HUI.COLOR.ink,
};

const CSS = `
  @keyframes ci-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ci-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.12);opacity:0.75} }
  @keyframes ci-ripple { 0%{transform:scale(0.9);opacity:0.7} 100%{transform:scale(1.9);opacity:0} }
  @keyframes ci-emoji-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .ci-emoji-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:2px; }
  .ci-emoji-btn { font-size:22px; padding:5px 3px; border:none; background:none; cursor:pointer; border-radius:8px; text-align:center; transition:background .12s; line-height:1; WebkitTapHighlightColor:transparent; }
  .ci-emoji-btn:hover { background:rgba(22,215,197,0.12); }
  .ci-emoji-picker { position:absolute; bottom:100%; left:0; right:0; background:#fff; border-top:1px solid rgba(0,0,0,0.07); padding:10px 12px 8px; box-shadow:0 -4px 20px rgba(0,0,0,0.10); max-height:190px; overflow-y:auto; animation:ci-emoji-in 150ms ease; }
`;

async function uploadChatMedia(file, type) {
  const ext  = file.name?.split(".").pop() || (type === "voice" ? "webm" : "bin");
  const path = Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;
  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data: signed } = await supabase.storage
    .from("chat-media")
    .createSignedUrl(path, 365 * 24 * 60 * 60);
  return { url: signed?.signedUrl || "", path };
}

function VoiceWaveform({ levels = [] }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2.5, height:24, flex:1, padding:"0 8px" }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width:3, borderRadius:4,
          height: levels[i] ? Math.max(5, levels[i] * 22) + "px" : "5px",
          background: "rgba(22,215,197," + (levels[i] ? 0.8 : 0.25) + ")",
          transition:"height 0.1s ease", flexShrink:0,
        }}/>
      ))}
    </div>
  );
}

function MediaPreview({ file, type, duration, onRemove }) {
  const url = file ? URL.createObjectURL(file) : null;
  return (
    <div style={{
      position:"relative", margin:"0 14px 6px", borderRadius:14,
      overflow:"hidden", border:"1.5px solid rgba(22,215,197,0.22)",
      background:"rgba(255,255,255,0.72)", display:"inline-flex", maxWidth:"100%",
    }}>
      {type === "image" && (
        <img src={url} alt="" style={{ maxHeight:160, maxWidth:"100%", display:"block", objectFit:"cover" }}/>
      )}
      {type === "video" && (
        <video src={url} controls style={{ maxHeight:160, maxWidth:"100%", display:"block" }}/>
      )}
      {type === "voice" && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", minWidth:180 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"
              stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <audio src={url} controls style={{ height:32, flex:1 }}/>
          {duration > 0 && <span style={{ fontSize:11, color:"rgba(80,80,80,0.55)", flexShrink:0 }}>{duration}s</span>}
        </div>
      )}
      <button onClick={onRemove} style={{
        position:"absolute", top:6, right:6, width:22, height:22, borderRadius:"50%",
        background:"rgba(0,0,0,0.52)", border:"none", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        WebkitTapHighlightColor:"transparent",
      }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export default function ChatInput({ onSend, sending = false, placeholder = "Schreib etwas Echtes\u2026" }) {
  const [text,      setText]      = useState("");
  const [focused,   setFocused]   = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs,   setRecSecs]   = useState(0);
  const [waveLvls,  setWaveLvls]  = useState([]);
  // EMOJI-PARITAET (2026-08-10): Chat bekommt denselben Schnellzugriff-Emoji-
  // Picker wie die Kommentare (CommentsSheet.jsx) -- zusaetzlich zur ganz
  // normal ueber die Systemtastatur verfuegbaren Emoji-Eingabe (die bereits
  // ohne jede Code-Aenderung funktioniert, da das <textarea> unten kein
  // inputMode/pattern/maxLength besitzt, das Unicode-Zeichen einschraenkt).
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textRef     = useRef(null);
  const fileRef     = useRef(null);
  const mrRef       = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const animRef     = useRef(null);
  const streamRef   = useRef(null);

  function startAnalyzer(stream) {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const anal = ctx.createAnalyser();
      anal.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(anal);
      const buf = new Uint8Array(anal.frequencyBinCount);
      (function tick() {
        anal.getByteFrequencyData(buf);
        setWaveLvls(Array.from(buf.slice(0,20)).map(v => v/255));
        animRef.current = requestAnimationFrame(tick);
      })();
    } catch(_) {}
  }
  function stopAnalyzer() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setWaveLvls([]);
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        setMediaFile(new File([blob], "voice_" + Date.now() + ".webm", { type: mr.mimeType }));
        setMediaType("voice");
        stopAnalyzer();
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100);
      mrRef.current = mr;
      setRecording(true);
      setRecSecs(0);
      startAnalyzer(stream);
      timerRef.current = setInterval(() => setRecSecs(s => s+1), 1000);
    } catch(_) {
      toast.error("Mikrofon-Zugriff verweigert");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mrRef.current?.state !== "inactive") mrRef.current.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    if (mrRef.current?.state !== "inactive") mrRef.current.stop();
    clearInterval(timerRef.current);
    stopAnalyzer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    chunksRef.current = [];
    mrRef.current = { onstop: null, state:"inactive", stop:()=>{} };
    setRecording(false);
    setMediaFile(null);
    setMediaType(null);
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.warn("Nur Bilder und Videos erlaubt."); return;
    }
    setMediaFile(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    e.target.value = "";
  }

  async function send() {
    if (sending || uploading || recording) return;
    if (!text.trim() && !mediaFile) return;
    setShowEmojiPicker(false);
    setUploading(true);
    try {
      let mediaUrl  = null;
      let finalType = mediaType || "text";
      if (mediaFile) {
        const { url } = await uploadChatMedia(mediaFile, mediaType);
        mediaUrl = url;
      }
      await onSend?.({
        text: text.trim() || (mediaType === "voice" ? "\uD83C\uDFA4 Sprachnachricht" : mediaType === "image" ? "\uD83D\uDDBC Bild" : "\uD83C\uDFAC Video"),
        msgType: finalType,
        mediaUrl,
        mediaType: finalType === "text" ? null : finalType,
      });
      setText("");
      setMediaFile(null);
      setMediaType(null);
      setRecSecs(0);
      requestAnimationFrame(() => textRef.current?.focus());
    } catch(err) {
      console.error("[ChatInput] Send error:", err);
      toast.error("Fehler beim Senden — bitte nochmal versuchen");
    } finally {
      setUploading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const canSend = (!!text.trim() || !!mediaFile) && !sending && !uploading && !recording;
  const isBusy  = sending || uploading;

  return (
    <div style={{
      padding:"8px 14px max(8px, calc(env(safe-area-inset-bottom, 0px) - var(--hui-keyboard-inset, 0px)))",
      background:"rgba(242,244,248,0.90)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      borderTop:"1px solid rgba(22,215,197,0.10)",
      flexShrink:0, position:"relative", zIndex:10, width:"100%",
    }}>
      <style>{CSS}</style>

      {showEmojiPicker && (
        <div className="ci-emoji-picker">
          <div style={{ fontSize:11, fontWeight: 600, color:"rgba(80,80,80,0.55)", marginBottom:6, letterSpacing:.5 }}>EMOJIS</div>
          <div className="ci-emoji-grid">
            {["😊","😂","🥰","😍","🤩","😎","🥳","🙌","👍","❤️","🔥","✨","💫","🌟","💡","🎉","🎊","🙏","💬","💭","🌿","🌱","💚","💙","💜","🤝","👏","🫶","😅","😇","🤔","💪","🦋","🌸","🌺","🍀","☀️","🌙","⭐","🎯","🎨","📚","💎","🚀","🌈","🎵","🎶","✅","🔑","🌍"].map(e => (
              <button key={e} className="ci-emoji-btn" onClick={() => {
                const ta = textRef.current;
                if (ta) {
                  const start = ta.selectionStart ?? text.length;
                  const end = ta.selectionEnd ?? text.length;
                  const newVal = text.slice(0, start) + e + text.slice(end);
                  setText(newVal);
                  setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + e.length; }, 0);
                } else { setText(v => v + e); }
              }}>{e}</button>
            ))}
          </div>
        </div>
      )}

      {mediaFile && !recording && (
        <MediaPreview
          file={mediaFile} type={mediaType} duration={recSecs}
          onRemove={() => { setMediaFile(null); setMediaType(null); setRecSecs(0); }}
        />
      )}

      <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>

        {/* Composer Box */}
        <div style={{
          flex:1, background: focused ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.72)",
          border: focused ? "1.5px solid rgba(22,215,197,0.38)" : "1.5px solid rgba(0,0,0,0.07)",
          borderRadius:22, padding: recording ? "9px 12px" : "10px 16px",
          display:"flex", alignItems:"flex-end", gap:8,
          boxShadow: focused ? "0 0 0 3px rgba(22,215,197,0.10),0 4px 14px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.05)",
          transition:"border 0.28s,box-shadow 0.28s",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", minHeight:44,
        }}>
          {recording ? (
            <>
              {/* Recording pulse dot */}
              <div style={{ position:"relative", width:16, height:16, flexShrink:0, marginBottom:3 }}>
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:"rgba(255,77,77,0.2)", animation:"ci-ripple 1.2s ease-out infinite",
                }}/>
                <div style={{
                  width:12, height:12, borderRadius:"50%", background:"#FF4D4D",
                  position:"absolute", top:"50%", left:"50%",
                  transform:"translate(-50%,-50%)",
                  animation:"ci-pulse 1.2s ease-in-out infinite",
                }}/>
              </div>
              <VoiceWaveform levels={waveLvls}/>
              <span style={{ fontSize:12, color:"rgba(80,80,80,0.65)", flexShrink:0, }}>
                {String(Math.floor(recSecs/60)).padStart(2,"0")}:{String(recSecs%60).padStart(2,"0")}
              </span>
              <button onClick={cancelRecording} style={{
                width:26, height:26, borderRadius:"50%", flexShrink:0,
                background:"rgba(255,77,77,0.12)", border:"1px solid rgba(255,77,77,0.25)",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent",
              }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="#FF4D4D" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Emoji-Picker-Button — Schnellzugriff-Parität zu den Kommentaren.
                  Unabhängig davon funktioniert die normale Emoji-Eingabe über
                  die Systemtastatur des Smartphones bereits ohne diesen Button
                  (das <textarea> schränkt keine Unicode-Zeichen ein). */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(v => !v)}
                style={{
                  fontSize:19, lineHeight:1, padding:"4px 2px", flexShrink:0,
                  border:"none", background:"none", cursor:"pointer",
                  opacity: showEmojiPicker ? 1 : 0.55,
                  WebkitTapHighlightColor:"transparent",
                  marginBottom:2,
                }}
                title="Emoji hinzufügen"
              >😊</button>
              <textarea
                ref={textRef} value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKey}
                onFocus={() => { setFocused(true); setShowEmojiPicker(false); }}
                onBlur={() => setFocused(false)}
                placeholder={placeholder} rows={1}
                style={{
                  flex:1, border:"none", background:"none", outline:"none",
                  fontSize:14.5, lineHeight:1.55, color:C.ink,
                  fontFamily:"inherit", resize:"none", maxHeight:120,
                  overflowY:"auto", WebkitOverflowScrolling:"touch",
                }}
              />
            </>
          )}
        </div>

        {/* Bild-Upload Icon — zwischen Textfeld und Voice/Send */}
        {/* fileRef immer im DOM damit handleFileChange jederzeit aufrufbar */}
        <input ref={fileRef} type="file" accept="image/*,video/*"
          style={{ display:"none" }} onChange={handleFileChange}/>
        {!recording && !text.trim() && !mediaFile && (
          <button onClick={() => fileRef.current?.click()} disabled={isBusy} style={{
            width:40, height:40, borderRadius:"50%",
            background:"rgba(255,255,255,0.75)", border:"1px solid rgba(0,0,0,0.07)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", flexShrink:0, opacity:isBusy ? 0.5 : 1,
            boxShadow:"0 2px 6px rgba(0,0,0,0.06)",
            WebkitTapHighlightColor:"transparent",
          }} title="Bild oder Video senden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="20" height="15" rx="3" stroke={C.teal} strokeWidth="1.7"/>
              <circle cx="8" cy="8.5" r="1.8" stroke={C.teal} strokeWidth="1.4"/>
              <path d="M2 15l5-5 4 4 3-3 6 5" stroke={C.teal} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Rechter Button */}
        {recording ? (
          <button onClick={stopRecording} style={{
            width:44, height:44, borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg,#FF4D4D 0%,#FF7070 100%)",
            border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(255,77,77,0.30)",
            WebkitTapHighlightColor:"transparent",
            animation:"ci-pulse 1.4s ease-in-out infinite",
          }} title="Aufnahme stoppen">
            <div style={{ width:14, height:14, borderRadius:3, background:"white" }}/>
          </button>
        ) : canSend ? (
          <button onClick={send} disabled={isBusy} style={{
            width:44, height:44, borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg," + C.teal + " 0%," + C.teal2 + " 100%)",
            border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor: isBusy ? "default" : "pointer",
            opacity: isBusy ? 0.65 : 1,
            boxShadow:"0 4px 16px rgba(22,215,197,0.28)",
            WebkitTapHighlightColor:"transparent",
          }}>
            {isBusy
              ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                  style={{ animation:"ci-spin 0.75s linear infinite" }}>
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"/>
                  <path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            }
          </button>
        ) : (
          <button onClick={startRecording} disabled={isBusy} style={{
            width:44, height:44, borderRadius:"50%", flexShrink:0,
            background:"rgba(255,255,255,0.75)", border:"1px solid rgba(0,0,0,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            WebkitTapHighlightColor:"transparent",
          }} title="Sprachnachricht aufnehmen">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"
                stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

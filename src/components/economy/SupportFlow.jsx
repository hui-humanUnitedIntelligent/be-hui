// src/components/economy/SupportFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
// Kanonischer Checkout: WerkeKorb → UnterstuetzenFlow → StripePaymentStep
// ═══════════════════════════════════════════════════════════════════
// HUI Phase 4D
// "Talent unterstützen" — keine Donation-Energie, eine menschliche Geste
import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { supportService } from "../../services/creatorEconomy.js";

const T = {
  bg:"#FAFAF8", ink:"#1A1A2E", soft:"rgba(26,26,46,0.55)",
  teal:"#16D7C5", coral:"#FF8A6B", border:"rgba(26,26,46,0.08)",
};
const QUICK_AMOUNTS = [3, 5, 10, 20];

let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return; _css = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes sf-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    @keyframes sf-glow{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
    @keyframes sf-success{0%{opacity:0;transform:scale(0.8)}60%{transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
    .sf-tap{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
  `;
  document.head.appendChild(s);
}

function SuccessView({ creator, amount, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"48px 32px",
      animation:"sf-success 0.5s cubic-bezier(0.34,1.4,0.64,1) both"}}>
      <div style={{width:88,height:88,borderRadius:"50%",
        background:`radial-gradient(circle at 38% 35%, ${T.teal}, ${T.coral})`,
        display:"flex",alignItems:"center",justifyContent:"center",
        marginBottom:24,animation:"sf-glow 2s ease infinite",
        boxShadow:"0 0 48px rgba(22,215,197,0.40)",fontSize:36}}>✦</div>
      <div style={{fontSize:22,fontWeight:800,color:T.ink,textAlign:"center",marginBottom:10}}>
        Deine Geste ist angekommen
      </div>
      <div style={{fontSize:15,color:T.soft,textAlign:"center",lineHeight:1.6}}>
        {amount}€ gehen direkt an<br/>
        <strong style={{color:T.ink}}>{creator?.display_name || "dieses Talent"}</strong>
      </div>
    </div>
  );
}

export default function SupportFlow({ creator, visible, onClose, sourceType="profile", sourceId=null }) {
  injectCSS();
  const { user } = useAuth();
  const [amount,  setAmount]  = useState(5);
  const [custom,  setCustom]  = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleSend = useCallback(async () => {
    if (!user?.id || !creator?.id) return;
    if (!finalAmount || finalAmount < 1) { setError("Mindestbetrag: 1€"); return; }
    setError(null); setLoading(true);
    const result = await supportService.send({
      supporterId: user.id, creatorId: creator.id,
      amount: finalAmount, message: message.trim(), sourceType, sourceId,
    });
    setLoading(false);
    if (result.error) { setError("Konnte nicht gesendet werden. Bitte nochmal versuchen."); return; }
    setDone(true);
  }, [user, creator, finalAmount, message, sourceType, sourceId]);

  if (!visible) return null;

  return (
    <div style={{position:"fixed",inset:0,zIndex:10500,
      background:"rgba(6,10,20,0.65)",
      backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",
      display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div style={{width:"100%",maxWidth:480,background:T.bg,
        borderRadius:"28px 28px 0 0",
        padding:`0 0 max(24px, env(safe-area-inset-bottom, 24px))`,
        animation:"sf-rise 0.38s cubic-bezier(0.22,1,0.36,1) both",overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 0"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"rgba(26,26,46,0.12)"}}/>
        </div>
        {done ? (
          <SuccessView creator={creator} amount={finalAmount} onDone={onClose}/>
        ) : (
          <div style={{padding:"20px 24px 0"}}>
            {/* Creator Header */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <div style={{width:44,height:44,borderRadius:14,overflow:"hidden",
                background:"rgba(22,215,197,0.10)",border:`2px solid ${T.teal}`,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {creator?.avatar_url
                  ? <img src={creator.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:18,fontWeight:700,color:T.teal}}>
                      {(creator?.display_name||"T")[0].toUpperCase()}
                    </span>}
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:T.ink}}>
                  {creator?.display_name||"Dieses Talent"} unterstützen
                </div>
                <div style={{fontSize:12,color:T.soft,marginTop:2}}>Deine Geste fließt direkt zu ihnen ✦</div>
              </div>
            </div>
            {/* Amount Pills */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:T.soft,letterSpacing:0.5,marginBottom:9}}>
                BETRAG WÄHLEN
              </div>
              <div style={{display:"flex",gap:8}}>
                {QUICK_AMOUNTS.map(v => (
                  <button key={v} className="sf-tap" onClick={() => { setAmount(v); setCustom(""); setError(null); }}
                    style={{flex:1,padding:"12px 0",borderRadius:14,
                      border: !custom && amount===v ? "none" : `1.5px solid ${T.border}`,
                      background: !custom && amount===v
                        ? `linear-gradient(135deg,${T.teal},${T.coral})`
                        : "white",
                      color: !custom && amount===v ? "white" : T.ink,
                      fontSize:15,fontWeight: !custom&&amount===v ? 700:500,
                      cursor:"pointer",fontFamily:"inherit",
                      boxShadow: !custom&&amount===v ? "0 4px 16px rgba(22,215,197,0.28)":"none",
                      transition:"all 0.18s ease"}}>
                    {v}€
                  </button>
                ))}
              </div>
            </div>
            {/* Custom */}
            <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:8,
              padding:"12px 16px",borderRadius:14,
              border:`1.5px solid ${custom ? T.teal : T.border}`,
              background:"white",transition:"border-color 0.2s"}}>
              <span style={{fontSize:16,color:T.soft}}>€</span>
              <input type="number" placeholder="Eigener Betrag" value={custom}
                onChange={e => { setCustom(e.target.value); setError(null); }} min={1}
                style={{flex:1,border:"none",outline:"none",background:"transparent",
                  fontSize:15,color:T.ink,fontFamily:"inherit"}}/>
            </div>
            {/* Message */}
            <textarea placeholder="Eine kleine Nachricht (optional) ✦"
              value={message} onChange={e => setMessage(e.target.value)}
              maxLength={200} rows={2}
              style={{width:"100%",borderRadius:14,border:`1.5px solid ${T.border}`,
                background:"white",padding:"12px 16px",fontSize:14,color:T.ink,
                lineHeight:1.6,fontFamily:"inherit",resize:"none",outline:"none",
                boxSizing:"border-box",marginBottom:16}}/>
            {error && (
              <div style={{marginBottom:14,padding:"10px 14px",borderRadius:12,
                background:"rgba(255,138,107,0.10)",border:"1px solid rgba(255,138,107,0.25)",
                fontSize:13,color:T.coral}}>{error}</div>
            )}
            {/* CTA */}
            <button className="sf-tap" onClick={handleSend} disabled={loading||!finalAmount}
              style={{width:"100%",padding:"17px",borderRadius:18,border:"none",
                background: loading ? "rgba(22,215,197,0.5)"
                  : `linear-gradient(135deg,${T.teal},${T.coral})`,
                color:"white",fontSize:16,fontWeight:700,cursor:loading?"default":"pointer",
                boxShadow:"0 6px 24px rgba(22,215,197,0.30)",fontFamily:"inherit",
                transition:"all 0.2s ease"}}>
              {loading ? "Wird gesendet…" : `${finalAmount || "…"}€ senden ✦`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

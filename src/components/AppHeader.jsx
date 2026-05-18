import React from "react";
import { Bell, Shield, ShoppingBasket } from "lucide-react";

function HuiNavLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-label="HUI">
      <defs>
        <linearGradient id="hn-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1ED8C8"/>
          <stop offset="100%" stopColor="#FF7A5C"/>
        </linearGradient>
        <radialGradient id="hn-cr" cx="80%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#FF8A6B" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#FF8A6B" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="hn-sh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hn-bg)"/>
      <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hn-cr)"/>
      <rect x="3" y="3" width="114" height="62" rx="30" fill="url(#hn-sh)"/>
      <circle cx="60" cy="62" r="38" fill="white" fillOpacity="0.92"/>
      <path d="M30 42 C28 50 28 62 28 62 C28 74 30 82 30 82" stroke="url(#hn-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d="M50 42 C52 50 52 62 52 62 C52 74 50 82 50 82" stroke="url(#hn-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d="M29 62 L51 62" stroke="url(#hn-bg)" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M56 42 L56 68 C56 76 65 83 70 76 C74 69 72 42 72 42" stroke="url(#hn-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <circle cx="82" cy="44" r="5.5" fill="url(#hn-bg)"/>
      <path d="M82 54 L82 82" stroke="url(#hn-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <rect x="3" y="3" width="114" height="114" rx="30" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1.5"/>
    </svg>
  );
}

export default function AppHeader({ cartCount, onCartClick, onNotifClick, notifCount, onVerifizierungClick }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      padding: "12px 16px 10px",
      boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)",
      position: "sticky", top: 0, zIndex: 100,
      borderBottom: "1px solid rgba(0,0,0,0.05)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
          <HuiNavLogo size={36}/>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:"#0D0D0D",
              letterSpacing:"-0.04em", lineHeight:1,
              fontFamily:"Inter,-apple-system,sans-serif" }}>
              HUI
            </div>
            <div style={{ fontSize:9.5, color:"#999", letterSpacing:"0.06em",
              textTransform:"uppercase", fontWeight:500, lineHeight:1 }}>
              Human United Intelligent
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          {onVerifizierungClick && (
            <button onClick={onVerifizierungClick}
              style={{ background:"none", border:"none", cursor:"pointer", padding:8, borderRadius:10 }}>
              <Shield size={20} color="#16D7C5"/>
            </button>
          )}
          {onNotifClick && (
            <button onClick={onNotifClick}
              style={{ background:"none", border:"none", cursor:"pointer", padding:8,
                position:"relative", borderRadius:10 }}>
              <Bell size={20} color="#555"/>
              {notifCount > 0 && (
                <span style={{ position:"absolute", top:5, right:5,
                  background:"linear-gradient(135deg,#FF8A6B,#FF6B5B)",
                  color:"white", borderRadius:"50%", width:14, height:14,
                  fontSize:8.5, display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, border:"1.5px solid white" }}>
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
          )}
          {onCartClick && (
            <button onClick={onCartClick}
              style={{ background:"none", border:"none", cursor:"pointer", padding:8,
                position:"relative", borderRadius:10 }}>
              <ShoppingBasket size={20} color="#555"/>
              {cartCount > 0 && (
                <span style={{ position:"absolute", top:5, right:5,
                  background:"linear-gradient(135deg,#FF8A6B,#FF6B5B)",
                  color:"white", borderRadius:"50%", width:14, height:14,
                  fontSize:8.5, display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, border:"1.5px solid white" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

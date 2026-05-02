import React from "react";
import { ShoppingBasket, Bell, Shield } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";

export default function AppHeader({ cartCount, onCartClick, onNotifClick, notifCount, onVerifizierungClick }) {
  return (
    <div style={{ background: "white", padding: "14px 16px 10px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c9a4ece09_IMG_1693.jpg" alt="HUI" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.2, color: "#888" }}>
            <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17, textShadow: "0 0 8px rgba(255,107,0,0.3)" }}>H</span>uman{" "}
            <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17, textShadow: "0 0 8px rgba(255,107,0,0.3)" }}>U</span>nited{" "}
            <span style={{ color: "#FF6B00", fontWeight: 900, fontSize: 17, textShadow: "0 0 8px rgba(255,107,0,0.3)" }}>I</span>ntelligent
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {onVerifizierungClick && (
            <button onClick={onVerifizierungClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <Shield size={22} color={TEAL} />
            </button>
          )}
          <button onClick={onCartClick} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6 }}>
            <ShoppingBasket size={22} color="#444" />
            {cartCount > 0 && <span style={{ position: "absolute", top: 0, right: 0, background: CORAL, color: "white", borderRadius: "50%", width: 15, height: 15, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
          </button>
          <button onClick={onNotifClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, position: "relative" }}>
            <Bell size={22} color="#444" />
            {notifCount > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: CORAL, color: "white", borderRadius: "50%", width: 15, height: 15, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{notifCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
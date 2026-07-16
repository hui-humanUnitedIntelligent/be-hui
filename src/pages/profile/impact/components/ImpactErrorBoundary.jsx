import React from "react";
import { HUIImpactIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { T } from "../tokens.js";

export class ImpactErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { crashed:false, error:null }; }
  static getDerivedStateFromError(e) { return { crashed:true, error:e }; }
  componentDidCatch(e) {
    console.error("[IMPACT CRASH]", { msg:e?.message, stack:e?.stack?.slice(0,400) });
  }
  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div style={{ padding:40, textAlign:"center", fontFamily:T.ff,
        minHeight:"50vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", background:T.page }}>
        <div style={{ marginBottom:12, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIImpactIcon size={36}/></div>
        <div style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:8 }}>
          Etwas ist schiefgelaufen
        </div>
        <div style={{ fontSize:13, marginBottom:20, maxWidth:280, color:T.muted }}>
          {this.state.error?.message || "Unbekannter Fehler"}
        </div>
        <button onClick={() => this.setState({ crashed:false, error:null })} style={{
          background:T.teal, color:"white", border:"none",
          borderRadius:20, padding:"10px 24px", fontSize:14, cursor:"pointer", fontWeight:600,
        }}>Neu laden</button>
      </div>
    );
  }
}

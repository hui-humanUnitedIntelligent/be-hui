// src/components/profile/my-basis/ActionSheets.jsx
// DraftActionSheet, ItemActionChoiceSheet, DeleteWerkConfirm, DeleteTalentConfirm
// Extracted from MyBasisProfile.jsx — no logic changes.
import React from "react";
import { createPortal } from "react-dom";

export function DraftActionSheet({ label, onPublish, onEdit, onDelete = null, onCancel }) {
  // DRAFT-ACTION (2026-08-20, Michael-Request): Beim Klick auf einen Entwurf
  // im Mein-Bereich erscheint dieses Sheet statt des normalen Aktions-Menüs.
  // Optionen: Veröffentlichen (→ Einreichen zur Prüfung) oder Bearbeiten.
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"22px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        fontFamily:"Inter, sans-serif",
      }}>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          {label} als Entwurf
        </div>
        <div style={{ fontSize:13, color:"#888", textAlign:"center", marginBottom:18, lineHeight:1.4 }}>
          Was möchtest du mit diesem Entwurf tun?
        </div>
        <button onClick={onPublish} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"#0EC4B8", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          Veröffentlichen
        </button>
        <button onClick={onEdit} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"rgba(14,196,184,0.08)", border:"1.5px solid rgba(14,196,184,0.35)",
          color:"#0EC4B8", fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          Bearbeiten
        </button>
        {onDelete && (
          <button onClick={onDelete} style={{
            width:"100%", padding:"13px", borderRadius:99,
            background:"rgba(255,59,59,0.08)", border:"1.5px solid rgba(255,59,59,0.30)",
            color:"#ff3b3b", fontSize:14, fontWeight: 600, cursor:"pointer",
            fontFamily:"inherit", marginBottom:10,
          }}>
            Entwurf löschen
          </button>
        )}
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>,
    document.body
  );
}

export function ItemActionChoiceSheet({ label, onEdit, onView, onDelete = null, onCancel }) {
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"22px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        fontFamily:"Inter, sans-serif",
      }}>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:18, color:"#1a1a18" }}>
          Was möchtest du tun?
        </div>
        <button onClick={onEdit} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"#0EC4B8", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          {label} bearbeiten
        </button>
        <button onClick={onView} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"rgba(14,196,184,0.08)", border:"1.5px solid rgba(14,196,184,0.35)",
          color:"#0EC4B8", fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          {label} ansehen
        </button>
        {/* ITEM-ACTION-CHOICE-DELETE (2026-08-17, Michael-Feedback): Loeschen
            zusaetzlich direkt im Popup, nicht nur ueber die kleine X-Ecke auf
            der Karte -- bessere Auffindbarkeit. Oeffnet dieselbe bestehende
            Delete*Confirm-Bestaetigung wie der X-Button (kein Duplikat,
            Wiederverwendung der schon vorhandenen Loesch-Logik). */}
        {onDelete && (
          <button onClick={onDelete} style={{
            width:"100%", padding:"13px", borderRadius:99,
            background:"rgba(255,59,59,0.08)", border:"1.5px solid rgba(255,59,59,0.30)",
            color:"#ff3b3b", fontSize:14, fontWeight: 600, cursor:"pointer",
            fontFamily:"inherit", marginBottom:10,
          }}>
            {label} löschen
          </button>
        )}
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>,
    document.body
  );
}

export function DeleteWerkConfirm({ werk, onConfirm, onCancel }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"24px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}><span className="hui-emoji">🗑</span>️</div>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          Werk unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{werk.title || 'Dieses Werk'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
        </div>
        <button onClick={onConfirm} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:8,
        }}>
          Ja, endgültig löschen
        </button>
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight:600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export function DeleteTalentConfirm({ talent, onConfirm, onCancel }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"24px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}><span className="hui-emoji">🗑</span>️</div>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          Talent-Angebot unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{talent.title || 'Dieses Angebot'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
        </div>
        <button onClick={onConfirm} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:8,
        }}>
          Ja, endgültig löschen
        </button>
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight:600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MEIN BEREICH — Drawer-Menü (PROFIL-DRAWER-REDESIGN-003, 2026-07-06)
// ────────────────────────────────────────────────────────────────
// Ersetzt die bisherigen, permanent sichtbaren Inline-Listen
// (Talent-Angebote/Meine Werke/Erlebnisse) sowie die aus dem Studio
// umgezogenen Bereiche (Empfehlungen/Impact/Finanzen) durch
// eine kompakte Menü-Karte mit Icon-Grid — jedes Feld oeffnet die
// jeweilige bestehende Section/Modal als Bottom-Sheet-Drawer. Kein
// Feature neu gebaut, nur die Praesentation vereinheitlicht (Charta:
// Wiederverwendung vor Neuerstellung, Evolution statt Rewrite).
// ════════════════════════════════════════════════════════════════


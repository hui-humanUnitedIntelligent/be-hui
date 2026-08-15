// ╔════════════════════════════════════════════════════════════════╗
// ║  ARCHIVIERT 2026-08-15 — Google/Apple OAuth-Login-Buttons      ║
// ║  Grund: Supabase Auth Provider noch nicht aktiviert             ║
// ║  Status: Kann wiederhergestellt werden, sobald OAuth-           ║
// ║         Credentials (Google Client ID/Secret, Apple Services     ║
// ║         ID/Key) in Supabase Dashboard hinterlegt sind.           ║
// ║  Handler: handleGoogle() + handleApple() in LoginPage.jsx       ║
// ║          sind noch vorhanden (unveraendert, einfach nicht mehr   ║
// ║          im UI gerendert).                                       ║
// ║  AuthContext: syncOAuthProfileData() uebernimmt Avatar+Name      ║
// ║             aus OAuth-Metadaten bei aktivierten Providern.       ║
// ║  DB-Trigger: handle_new_user() speichert avatar_url +           ║
// ║             display_name aus raw_user_meta_data.                 ║
// ╚════════════════════════════════════════════════════════════════╝

import React from 'react';

// SocialBtn Komponente (Referenz — Original bleibt in LoginPage.jsx)
function SocialBtn({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '11px 10px',
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255,255,255,0.13)',
        borderRadius: 14,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background 200ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Original JSX-Markup (in LoginPage.jsx als Kommentar erhalten):
// {mode === 'login' || mode === 'register' ? (
//   <>
//     <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
//       <SocialBtn
//         icon={<GoogleSVG />}
//         label="Google"
//         onClick={handleGoogle}
//       />
//       <SocialBtn
//         icon={<AppleSVG />}
//         label="Apple"
//         onClick={handleApple}
//       />
//     </div>
//     <Divider label="oder per E-Mail" />
//     <div style={{ height: 16 }}/>
//   </>
// ) : null}

export default SocialBtn;

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

// Anzeige für blockierte Nutzer
function BlockedScreen() {
  const { signOut } = useAuth();
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,10,10,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '24px',
    }}>
      <div style={{
        maxWidth: 420, width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,107,107,0.3)',
        borderRadius: 20, padding: '40px 32px',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
          Dein Konto wird geprüft
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
          Ein Admin prüft gerade dein Profil. Du erhältst eine Benachrichtigung sobald dein Konto
          wieder freigeschaltet ist.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 28px' }}>
          Bei Fragen: <a href="mailto:support@be-hui.com" style={{ color: '#1ED8C8' }}>support@be-hui.com</a>
        </p>
        <button
          onClick={() => signOut()}
          style={{
            padding: '12px 28px', borderRadius: 12,
            background: 'rgba(255,107,107,0.15)',
            border: '1px solid rgba(255,107,107,0.4)',
            color: '#fc8181', cursor: 'pointer', fontSize: 14,
            fontWeight: 600,
          }}>
          Abmelden
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth, user, signOut } = useAuth();
  const [isBlocked, setIsBlocked]   = useState(false);
  const [blockChecked, setBlockChecked] = useState(false);

  // Nach Auth: prüfen ob Nutzer blockiert ist
  useEffect(() => {
    if (!isAuthenticated || !user?.id) { setBlockChecked(true); return; }
    supabase
      .from('profiles')
      .select('blocked')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.blocked === true) {
          // Blockiert: sofort ausloggen aus Supabase-Session, Sperrscreen zeigen
          setIsBlocked(true);
          supabase.auth.signOut();
        }
        setBlockChecked(true);
      })
      .catch(() => setBlockChecked(true));
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) checkUserAuth();
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked || (isAuthenticated && !blockChecked)) return fallback;

  if (isBlocked) return <BlockedScreen />;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    return unauthenticatedElement;
  }

  if (!isAuthenticated) return unauthenticatedElement;

  return <Outlet />;
}

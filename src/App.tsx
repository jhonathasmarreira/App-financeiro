import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useUser, useSession } from '@clerk/clerk-react';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Lancamentos } from './pages/Lancamentos';
import { Parcelas } from './pages/Parcelas';
import { Analise } from './pages/Analise';
import { ImportarCSV } from './pages/ImportarCSV';
import { useFinanceStore } from './store/useFinanceStore';
import type { Page } from './types';

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  lancamentos: 'Lançamentos',
  parcelas: 'Parcelas',
  analise: 'Análise',
  importar: 'CSV Fatura',
};

function MainApp() {
  const { user } = useUser();
  const { session } = useSession();
  const setToken = useFinanceStore(s => s.setToken);
  const loadTransactions = useFinanceStore(s => s.loadTransactions);
  const loading = useFinanceStore(s => s.loading);
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    if (!user?.id || !session) return;

    // Get a Supabase-compatible JWT from Clerk (requires JWT Template named "supabase")
    // If the template is not yet configured, fall back to anon key (app-level filtering only)
    session
      .getToken({ template: 'supabase' })
      .then((token) => {
        if (token) setToken(token);
      })
      .catch(() => {
        console.warn(
          'Clerk JWT template "supabase" not found — RLS will rely on app-level user_id filter only.'
        );
      })
      .finally(() => {
        loadTransactions(user.id);
      });
  }, [user?.id, session]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 32,
        animation: 'fade-in .4s ease',
      }}>
        {/* Logo + spinner */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid var(--border)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--accent)',
            animation: 'spin .9s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 10, borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--accent2)',
            animation: 'spin 1.4s linear infinite reverse',
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>💳</div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            FinanceDesk
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando seus dados...</div>
        </div>

        {/* Progress bar */}
        <div style={{ width: 220, background: 'var(--surface2)', borderRadius: 99, height: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
            animation: 'progress-fill 2.5s ease forwards',
          }} />
        </div>

        {/* Pulsing dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent)',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AppLayout page={page} onNavigate={setPage} title={PAGE_TITLES[page]}>
      {page === 'dashboard'   && <Dashboard onNavigate={setPage} />}
      {page === 'lancamentos' && <Lancamentos />}
      {page === 'parcelas'    && <Parcelas />}
      {page === 'analise'     && <Analise />}
      {page === 'importar'    && <ImportarCSV onImported={() => setPage('lancamentos')} />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <>
      <SignedOut><LoginPage /></SignedOut>
      <SignedIn><MainApp /></SignedIn>
    </>
  );
}

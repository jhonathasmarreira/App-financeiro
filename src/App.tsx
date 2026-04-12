import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
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
  importar: 'CSV Itaú',
};

function MainApp() {
  const { user } = useUser();
  const loadTransactions = useFinanceStore(s => s.loadTransactions);
  const loading = useFinanceStore(s => s.loading);
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    if (user?.id) loadTransactions(user.id);
  }, [user?.id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⟳</div>
          <p style={{ fontSize: 14 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout page={page} onNavigate={setPage} title={PAGE_TITLES[page]}>
      {page === 'dashboard'   && <Dashboard />}
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

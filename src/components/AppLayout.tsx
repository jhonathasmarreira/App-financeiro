import { useState, type ReactNode } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import type { Page } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { TransactionModal } from './TransactionModal';

const COLORS = ['#6c63ff','#ff6584','#43d9ad','#ffb347','#4fc3f7'];

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

export function AppLayout({ page, onNavigate, children, title, actions }: Props) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const transactions = useFinanceStore((s) => s.transactions);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

  const navItems: { id: Page; icon: string; label: string }[] = [
    { id: 'dashboard',   icon: '📊', label: 'Dashboard' },
    { id: 'lancamentos', icon: '📋', label: 'Lançamentos' },
    { id: 'parcelas',    icon: '🔄', label: 'Parcelas' },
    { id: 'analise',     icon: '📈', label: 'Análise' },
    { id: 'cartoes',     icon: '💳', label: 'Cartões' },
    { id: 'importar',    icon: '📥', label: 'CSV Fatura' },
  ];

  function navigate(p: Page) {
    onNavigate(p);
    setSidebarOpen(false);
  }

  return (
    <div className="app-wrapper" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{
          width: 'var(--sidebar)', background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
            borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18,
          }}>💳</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>FinanceDesk</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>Controle Financeiro</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Principal</div>
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', cursor: 'pointer', fontSize: 13.5,
                color: page === item.id ? 'var(--accent)' : 'var(--muted)',
                background: page === item.id ? 'rgba(108,99,255,.1)' : 'transparent',
                borderLeft: page === item.id ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all .18s',
              }}
              onMouseEnter={(e) => { if (page !== item.id) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
              onMouseLeave={(e) => { if (page !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              {item.id === 'lancamentos' && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
                  fontSize: 10, padding: '2px 6px', borderRadius: 20, fontWeight: 700,
                }}>{transactions.length}</span>
              )}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS[0]}, ${COLORS[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {(user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || '?').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{transactions.length} registros</div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
            title="Sair"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 16, padding: 4,
              borderRadius: 6, transition: 'color .18s',
            }}
          >🚪</button>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header className="app-header" style={{
          height: 56, background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div className="app-header-padding" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 28px', flex: 1, minWidth: 0 }}>
            {/* Hamburger */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Abrir menu"
            >☰</button>

            <div style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</div>
          </div>

          <div className="app-header-padding" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 28px', flexShrink: 0 }}>
            <span className="header-date" style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{today}</span>
            {actions}
          </div>
        </header>

        {/* Content */}
        <div className="app-content-area" style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {children}
        </div>
      </main>

      {/* FAB — sempre visível no mobile */}
      <button className="fab-btn" onClick={() => setFabOpen(true)} aria-label="Nova Transação">+</button>
      {fabOpen && <TransactionModal onClose={() => setFabOpen(false)} onNavigate={navigate} />}
    </div>
  );
}

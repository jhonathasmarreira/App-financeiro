import { useMemo, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, formatDate, toMonthKey, currentMonthKey, getMonthLabel } from '../utils/format';
import { TransactionModal } from '../components/TransactionModal';
import type { Page, Transaction } from '../types';

const COLORS = ['#6c63ff','#ff6584','#43d9ad','#ffb347','#4fc3f7','#ce93d8','#a5d6a7','#ef9a9a'];
const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 };

// ── Tipos ─────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string; sub: string; icon: string; accent: string;
  onDetail: () => void;
}

interface DetailSheet {
  title: string;
  items: Transaction[];
}

// ── Hooks de negócio ──────────────────────────────────────
function useFinanceSummary(transactions: Transaction[], selectedMonth: string, dateMode: 'fatura' | 'lancamento') {
  return useMemo(() => {
    const filtered = transactions.filter(t => {
      const d = dateMode === 'fatura' && t.data_fatura ? t.data_fatura : t.date;
      return toMonthKey(d) === selectedMonth;
    });
    const expenses  = filtered.filter(t => t.type === 'expense');
    const incomes   = filtered.filter(t => t.type === 'income');
    const parcelas  = expenses.filter(t => !!t.parcela);
    const income    = incomes.reduce((s, t) => s + t.amount, 0);
    const expense   = expenses.reduce((s, t) => s + t.amount, 0);
    return { filtered, expenses, incomes, parcelas, income, expense, balance: income - expense };
  }, [transactions, selectedMonth, dateMode]);
}

function useMonthlyChart(transactions: Transaction[], dateMode: 'fatura' | 'lancamento') {
  return useMemo(() => {
    const map: Record<string, { Receitas: number; Despesas: number }> = {};
    transactions.forEach(t => {
      const d = dateMode === 'fatura' && t.data_fatura ? t.data_fatura : t.date;
      const k = toMonthKey(d);
      if (!map[k]) map[k] = { Receitas: 0, Despesas: 0 };
      if (t.type === 'income') map[k].Receitas += t.amount;
      else map[k].Despesas += t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, v]) => ({ name: getMonthLabel(k).slice(0, 3).toUpperCase(), ...v }));
  }, [transactions, dateMode]);
}

function useAvailableMonths(transactions: Transaction[], dateMode: 'fatura' | 'lancamento') {
  return useMemo(() => {
    const months = new Set(transactions.map(t => {
      const d = dateMode === 'fatura' && t.data_fatura ? t.data_fatura : t.date;
      return toMonthKey(d);
    }));
    const list = Array.from(months).sort().reverse();
    if (!list.includes(currentMonthKey())) list.unshift(currentMonthKey());
    return list;
  }, [transactions, dateMode]);
}

// ── Componentes ───────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent, onDetail }: StatCardProps) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${accent}`, cursor: 'pointer' }}
      onClick={onDetail}>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
        <div style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: '.03em' }}>Ver ›</div>
      </div>
      <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 32, opacity: .1 }}>{icon}</div>
    </div>
  );
}

function DetailBottomSheet({ sheet, onClose, onNavigate }: { sheet: DetailSheet; onClose: () => void; onNavigate: (p: Page) => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 520, padding: '24px 20px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{sheet.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {sheet.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <p style={{ fontSize: 13 }}>Nenhum lançamento.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {sheet.items.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {formatDate(t.date)}{t.cartao ? ` · ${t.cartao}` : ''}{t.parcela ? ` · ${t.parcela}` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', whiteSpace: 'nowrap' }}>
                  {t.type === 'income' ? '−' : ''}{formatCurrency(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { onClose(); onNavigate('lancamentos'); }}
          style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
          Ver todos em Lançamentos →
        </button>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────
export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const transactions = useFinanceStore(s => s.transactions);
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [dateMode, setDateMode]       = useState<'fatura' | 'lancamento'>('fatura');
  const [detail, setDetail]           = useState<DetailSheet | null>(null);

  function switchMode(mode: 'fatura' | 'lancamento') {
    setDateMode(mode);
    setSelectedMonth(currentMonthKey());
  }

  const availableMonths = useAvailableMonths(transactions, dateMode);
  const monthlyData     = useMonthlyChart(transactions, dateMode);
  const { filtered, expenses, incomes, parcelas, income, expense, balance } = useFinanceSummary(transactions, selectedMonth, dateMode);

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 7).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const top6 = useMemo(() => [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 6), [expenses]);

  const fmtY    = (v: number) => `R$${(v / 1000).toFixed(0)}k`;
  const fmtTip  = (v: unknown) => typeof v === 'number' ? formatCurrency(v) : String(v);
  const tipStyle = { contentStyle: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 } };
  const axisStyle = { tick: { fill: 'var(--muted)', fontSize: 11 }, axisLine: false as const, tickLine: false as const };
  const sel = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '7px 12px', borderRadius: 8, fontSize: 13 };

  const monthLabel = getMonthLabel(selectedMonth);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          {(['fatura', 'lancamento'] as const).map(mode => (
            <button key={mode} type="button" onClick={() => switchMode(mode)} style={{
              padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: dateMode === mode ? 'var(--accent)' : 'transparent',
              color: dateMode === mode ? '#fff' : 'var(--muted)', transition: 'all .18s',
            }}>
              {mode === 'fatura' ? '📅 Fatura' : '🗓 Lançamento'}
            </button>
          ))}
        </div>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={sel}>
          {availableMonths.map(m => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
        </select>
        <button className="dashboard-add-btn" onClick={() => setModalOpen(true)}
          style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
          + Nova Transação
        </button>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard
          label="Total de Créditos" value={formatCurrency(expense)} accent="var(--accent)" icon="💳"
          sub={`${expenses.length} lançamentos`}
          onDetail={() => setDetail({ title: `Créditos — ${monthLabel}`, items: [...expenses].sort((a, b) => b.amount - a.amount) })}
        />
        <StatCard
          label="Pagamentos / Estornos" value={formatCurrency(income)} accent="var(--success)" icon="✅"
          sub={`${incomes.length} itens`}
          onDetail={() => setDetail({ title: `Pagamentos — ${monthLabel}`, items: [...incomes].sort((a, b) => b.amount - a.amount) })}
        />
        <StatCard
          label="Saldo" value={formatCurrency(Math.abs(balance))} icon="💰"
          accent={balance >= 0 ? 'var(--success)' : 'var(--danger)'}
          sub={balance >= 0 ? 'Positivo' : 'Negativo'}
          onDetail={() => setDetail({ title: `Todos os lançamentos — ${monthLabel}`, items: [...filtered].sort((a, b) => b.amount - a.amount) })}
        />
        <StatCard
          label="Parcelas Ativas" value={String(parcelas.length)} accent="var(--warning)" icon="🔄"
          sub={formatCurrency(parcelas.reduce((s, t) => s + t.amount, 0)) + ' total'}
          onDetail={() => setDetail({ title: `Parcelas — ${monthLabel}`, items: [...parcelas].sort((a, b) => a.date.localeCompare(b.date)) })}
        />
      </div>

      {/* Gráficos */}
      <div className="dashboard-charts-grid">
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Gastos por Mês</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Receitas × Despesas</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={20} barGap={6}>
              <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="3 3" />
              <XAxis dataKey="name" {...axisStyle} />
              <YAxis tickFormatter={fmtY} {...axisStyle} />
              <Tooltip formatter={fmtTip} {...tipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Receitas" fill="#43d9ad" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ff4d6d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Categorias</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={fmtTip} {...tipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Maiores lançamentos */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Maiores Lançamentos — {monthLabel}</div>
        {top6.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36 }}>📭</div><p style={{ fontSize: 13 }}>Sem dados.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top6.map((t, i) => {
              const pct = (t.amount / (top6[0]?.amount || 1) * 100).toFixed(0);
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{formatDate(t.date)}</div>
                    <div style={{ marginTop: 5, background: 'var(--border)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: COLORS[i % COLORS.length], width: `${pct}%` }} />
                    </div>
                  </div>
                  <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 14 }}>{formatCurrency(t.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detail && <DetailBottomSheet sheet={detail} onClose={() => setDetail(null)} onNavigate={onNavigate} />}
      {modalOpen && <TransactionModal onClose={() => setModalOpen(false)} onNavigate={onNavigate} />}
    </div>
  );
}

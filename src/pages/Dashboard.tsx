import { useMemo, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, toMonthKey, currentMonthKey, getMonthLabel } from '../utils/format';
import { TransactionModal } from '../components/TransactionModal';

const COLORS = ['#6c63ff','#ff6584','#43d9ad','#ffb347','#4fc3f7','#ce93d8','#a5d6a7','#ef9a9a'];
const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 };

function StatCard({ label, value, sub, icon, accent }: { label: string; value: string; sub: string; icon: string; accent: string }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
      <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 32, opacity: .1 }}>{icon}</div>
    </div>
  );
}

export function Dashboard() {
  const transactions = useFinanceStore(s => s.transactions);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => toMonthKey(t.date)));
    const list = Array.from(months).sort().reverse();
    if (!list.includes(currentMonthKey())) list.unshift(currentMonthKey());
    return list;
  }, [transactions]);

  const filtered = useMemo(() =>
    transactions.filter(t => toMonthKey(t.date) === selectedMonth), [transactions, selectedMonth]);

  const income  = useMemo(() => filtered.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0), [filtered]);
  const expense = useMemo(() => filtered.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0), [filtered]);
  const parcelas = useMemo(() => filtered.filter(t => t.type==='expense' && t.parcela), [filtered]);
  const balance = income - expense;

  const monthlyData = useMemo(() => {
    const map: Record<string, { Receitas: number; Despesas: number }> = {};
    transactions.forEach(t => {
      const k = toMonthKey(t.date);
      if (!map[k]) map[k] = { Receitas: 0, Despesas: 0 };
      if (t.type==='income') map[k].Receitas += t.amount;
      else map[k].Despesas += t.amount;
    });
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).slice(-6).map(([k,v]) => ({
      name: getMonthLabel(k).slice(0,3).toUpperCase(), ...v,
    }));
  }, [transactions]);

  const catData = useMemo(() => {
    const map: Record<string,number> = {};
    filtered.filter(t=>t.type==='expense').forEach(t => { map[t.category] = (map[t.category]||0)+t.amount; });
    return Object.entries(map).sort(([,a],[,b])=>b-a).slice(0,7).map(([name,value])=>({name,value}));
  }, [filtered]);

  const top6 = useMemo(() => [...filtered].filter(t=>t.type==='expense').sort((a,b)=>b.amount-a.amount).slice(0,6), [filtered]);

  const fmtY = (v: number) => `R$${(v/1000).toFixed(0)}k`;
  const fmtTip = (v: unknown) => typeof v === 'number' ? formatCurrency(v) : String(v);
  const tipStyle = { contentStyle: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 } };
  const axisStyle = { tick: { fill: 'var(--muted)', fontSize: 11 }, axisLine: false as const, tickLine: false as const };

  const btn = (label: string, onClick: () => void, accent = 'var(--accent)') => (
    <button onClick={onClick} style={{ background: accent, border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Month selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
        <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', padding:'7px 12px', borderRadius:8, fontSize:13 }}>
          {availableMonths.map(m => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
        </select>
        {btn('+ Nova Transação', () => setModalOpen(true))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="Total de Créditos" value={formatCurrency(expense)} sub={`${filtered.filter(t=>t.type==='expense').length} lançamentos`} icon="💳" accent="var(--accent)" />
        <StatCard label="Pagamentos / Estornos" value={formatCurrency(income)} sub={`${filtered.filter(t=>t.type==='income').length} itens`} icon="✅" accent="var(--success)" />
        <StatCard label="Saldo" value={formatCurrency(Math.abs(balance))} sub={balance >= 0 ? 'Positivo' : 'Negativo'} icon="💰" accent={balance >= 0 ? 'var(--success)' : 'var(--danger)'} />
        <StatCard label="Parcelas Ativas" value={String(parcelas.length)} sub={formatCurrency(parcelas.reduce((s,t)=>s+t.amount,0)) + ' total'} icon="🔄" accent="var(--warning)" />
      </div>

      {/* Charts */}
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
              <Bar dataKey="Receitas" fill="#43d9ad" radius={[4,4,0,0]} />
              <Bar dataKey="Despesas" fill="#ff4d6d" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Categorias</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                {catData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={fmtTip} {...tipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top transactions */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Maiores Lançamentos — {getMonthLabel(selectedMonth)}</div>
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
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i%COLORS.length], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{t.date}</div>
                    <div style={{ marginTop: 5, background: 'var(--border)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: COLORS[i%COLORS.length], width: `${pct}%` }} />
                    </div>
                  </div>
                  <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 14 }}>{formatCurrency(t.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && <TransactionModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

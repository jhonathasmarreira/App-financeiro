import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useFinanceStore } from '../store/useFinanceStore';
import { toMonthKey, getMonthLabel, formatCurrency } from '../utils/format';

const COLORS = ['#6c63ff','#ff6584','#43d9ad','#ffb347','#4fc3f7','#ce93d8','#a5d6a7','#ef9a9a'];

const tooltipStyle = { contentStyle: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }, labelStyle: { color: 'var(--text)' } };
const axisStyle  = { tick: { fill: 'var(--muted)', fontSize: 11 }, axisLine: false as const, tickLine: false as const };
const gridStyle  = { stroke: 'rgba(255,255,255,.04)', strokeDasharray: '3 3' };

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 };

export function Analise() {
  const transactions = useFinanceStore(s => s.transactions);

  const monthMap = useMemo(() => {
    const m: Record<string, { income: number; expense: number; parcela: number }> = {};
    transactions.forEach(t => {
      const k = toMonthKey(t.date);
      if (!m[k]) m[k] = { income: 0, expense: 0, parcela: 0 };
      if (t.type === 'income') m[k].income += t.amount;
      else if (t.parcela) m[k].parcela += t.amount;
      else m[k].expense += t.amount;
    });
    return m;
  }, [transactions]);

  const months = Object.keys(monthMap).sort();

  const barData = months.map(k => ({
    name: getMonthLabel(k).slice(0,3).toUpperCase() + '/' + k.slice(2,4),
    Receitas: monthMap[k].income,
    Despesas: monthMap[k].expense,
    Parcelas: monthMap[k].parcela,
  }));

  const lineData = months.map(k => ({
    name: getMonthLabel(k).slice(0,3).toUpperCase() + '/' + k.slice(2,4),
    Créditos: monthMap[k].expense,
    Parcelas: monthMap[k].parcela,
    Pagamentos: monthMap[k].income,
  }));

  const totExpense = transactions.filter(t => t.type==='expense' && !t.parcela).reduce((s,t)=>s+t.amount,0);
  const totParcela = transactions.filter(t => t.type==='expense' && !!t.parcela).reduce((s,t)=>s+t.amount,0);
  const totIncome  = transactions.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0);

  const donutData = [
    { name: 'Créditos', value: totExpense },
    { name: 'Parcelas', value: totParcela },
    { name: 'Pagamentos', value: totIncome },
  ].filter(d => d.value > 0);

  const fmtY = (v: number) => `R$${(v/1000).toFixed(0)}k`;
  const fmtTip = (v: unknown) => typeof v === 'number' ? formatCurrency(v) : String(v);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Gastos por Mês</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={16} barGap={4}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="name" {...axisStyle} />
              <YAxis tickFormatter={fmtY} {...axisStyle} />
              <Tooltip formatter={fmtTip} {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              <Bar dataKey="Receitas"  fill="#43d9ad" radius={[4,4,0,0]} />
              <Bar dataKey="Despesas"  fill="#ff4d6d" radius={[4,4,0,0]} />
              <Bar dataKey="Parcelas"  fill="#6c63ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Distribuição por Tipo</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={fmtTip} {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Evolução de Gastos</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} />
            <YAxis tickFormatter={fmtY} {...axisStyle} />
            <Tooltip formatter={fmtTip} {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
            <Line type="monotone" dataKey="Créditos"   stroke="#ff6584" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Parcelas"   stroke="#6c63ff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Pagamentos" stroke="#43d9ad" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Resumo por Mês</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Mês','Créditos','Parcelas','Pagamentos','Saldo'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map(k => {
                const net = monthMap[k].income - monthMap[k].expense - monthMap[k].parcela;
                return (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface2)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <td style={{ padding: '11px 14px', fontWeight: 600 }}>{getMonthLabel(k)}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--danger)' }}>{formatCurrency(monthMap[k].expense)}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--accent)' }}>{formatCurrency(monthMap[k].parcela)}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--success)' }}>{formatCurrency(monthMap[k].income)}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {net >= 0 ? '+' : ''}{formatCurrency(Math.abs(net))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

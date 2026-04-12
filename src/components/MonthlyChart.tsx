import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction } from '../types';
import { toMonthKey, getMonthLabel } from '../utils/format';

interface Props {
  transactions: Transaction[];
}

export function MonthlyChart({ transactions }: Props) {
  const dataMap = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const key = toMonthKey(t.date);
    if (!dataMap.has(key)) dataMap.set(key, { income: 0, expense: 0 });
    const entry = dataMap.get(key)!;
    if (t.type === 'income') entry.income += t.amount;
    else entry.expense += t.amount;
  }

  const data = Array.from(dataMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, vals]) => ({
      name: getMonthLabel(month).slice(0, 3).toUpperCase(),
      Receitas: vals.income,
      Despesas: vals.expense,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Sem dados disponíveis
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={20} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
              : String(value)
          }
          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

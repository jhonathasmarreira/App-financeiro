import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction } from '../types';

const COLORS = [
  '#f97316', '#eab308', '#8b5cf6', '#ec4899',
  '#6366f1', '#f43f5e', '#a855f7', '#64748b',
];

interface Props {
  transactions: Transaction[];
}

export function CategoryChart({ transactions }: Props) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const categoryMap = new Map<string, number>();

  for (const t of expenses) {
    categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
  }

  const data = Array.from(categoryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Sem despesas no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
              : String(value)
          }
          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) =>
            value.length > 18 ? value.slice(0, 18) + '…' : value
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

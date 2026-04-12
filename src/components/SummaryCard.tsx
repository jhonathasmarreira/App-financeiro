import type { ReactNode } from 'react';
import { formatCurrency } from '../utils/format';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
}

export function SummaryCard({ title, value, icon, colorClass, bgClass }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
      <div className={`${bgClass} p-3 rounded-xl`}>
        <span className={`${colorClass} text-2xl`}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</p>
      </div>
    </div>
  );
}

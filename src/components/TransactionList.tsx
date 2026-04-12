import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import type { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { TransactionModal } from './TransactionModal';

const CATEGORY_COLORS: Record<string, string> = {
  Salário: 'bg-emerald-100 text-emerald-700',
  Freelance: 'bg-teal-100 text-teal-700',
  Investimentos: 'bg-blue-100 text-blue-700',
  'Outros (Receita)': 'bg-cyan-100 text-cyan-700',
  Alimentação: 'bg-orange-100 text-orange-700',
  Transporte: 'bg-yellow-100 text-yellow-700',
  Moradia: 'bg-purple-100 text-purple-700',
  Saúde: 'bg-pink-100 text-pink-700',
  Educação: 'bg-indigo-100 text-indigo-700',
  Lazer: 'bg-rose-100 text-rose-700',
  Vestuário: 'bg-fuchsia-100 text-fuchsia-700',
  'Outros (Despesa)': 'bg-slate-100 text-slate-600',
};

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  const removeTransaction = useFinanceStore((s) => s.removeTransaction);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions
    .filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar transação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex rounded-xl overflow-hidden border border-slate-200 text-sm">
          {(['all', 'income', 'expense'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              className={`px-4 py-2 transition-colors ${
                typeFilter === v
                  ? v === 'income'
                    ? 'bg-emerald-500 text-white'
                    : v === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {v === 'all' ? 'Todos' : v === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Nenhuma transação encontrada.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group"
            >
              {/* Type indicator */}
              <div
                className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  t.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      CATEGORY_COLORS[t.category] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.category}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(t.date)}</span>
                </div>
              </div>

              {/* Amount */}
              <span
                className={`text-sm font-bold flex-shrink-0 ${
                  t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
              </span>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(t)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => removeTransaction(t.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TransactionModal editing={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

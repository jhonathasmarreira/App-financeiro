import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import type { Transaction, TransactionType, Category } from '../types';

interface Props {
  onClose: () => void;
  editing?: Transaction;
}

export function TransactionModal({ onClose, editing }: Props) {
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);

  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState<Category>(
    editing?.category ?? 'Outros (Despesa)'
  );
  const [date, setDate] = useState(editing?.date ?? today);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [type]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Informe uma descrição.';
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) errs.amount = 'Informe um valor válido.';
    if (!date) errs.date = 'Informe a data.';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const val = parseFloat(amount.replace(',', '.'));
    if (editing) {
      updateTransaction(editing.id, { type, description: description.trim(), amount: val, category, date });
    } else {
      addTransaction({ type, description: description.trim(), amount: val, category, date });
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold text-slate-800 mb-6">
          {editing ? 'Editar transação' : 'Nova transação'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              Despesa
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Aluguel..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors mt-2"
          >
            {editing ? 'Salvar alterações' : 'Adicionar transação'}
          </button>
        </form>
      </div>
    </div>
  );
}

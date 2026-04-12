import { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, LogOut, Loader2 } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionList } from '../components/TransactionList';
import { TransactionModal } from '../components/TransactionModal';
import { MonthlyChart } from '../components/MonthlyChart';
import { CategoryChart } from '../components/CategoryChart';
import { toMonthKey, currentMonthKey, getMonthLabel } from '../utils/format';

export function Dashboard() {
  const transactions = useFinanceStore((s) => s.transactions);
  const loading = useFinanceStore((s) => s.loading);
  const loadTransactions = useFinanceStore((s) => s.loadTransactions);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const { signOut } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) loadTransactions(user.id);
  }, [user?.id]);

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map((t) => toMonthKey(t.date)));
    const list = Array.from(months).sort().reverse();
    if (!list.includes(currentMonthKey())) list.unshift(currentMonthKey());
    return list;
  }, [transactions]);

  const filtered = useMemo(
    () => transactions.filter((t) => toMonthKey(t.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const income = useMemo(
    () => filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filtered]
  );

  const expense = useMemo(
    () => filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filtered]
  );

  const balance = income - expense;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="text-sm">Carregando transações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">
            Olá, {user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? 'usuário'}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            <PlusCircle size={16} />
            Nova transação
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Receitas"
          value={income}
          icon={<TrendingUp size={22} />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Despesas"
          value={expense}
          icon={<TrendingDown size={22} />}
          colorClass="text-red-500"
          bgClass="bg-red-50"
        />
        <SummaryCard
          title="Saldo"
          value={balance}
          icon={<Wallet size={22} />}
          colorClass={balance >= 0 ? 'text-blue-600' : 'text-orange-500'}
          bgClass={balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Evolução mensal</h2>
          <MonthlyChart transactions={transactions} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Despesas por categoria</h2>
          <CategoryChart transactions={filtered} />
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Transações — {getMonthLabel(selectedMonth)}
        </h2>
        <TransactionList transactions={filtered} />
      </div>

      {modalOpen && <TransactionModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

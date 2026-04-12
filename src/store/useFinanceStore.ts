import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from '../utils/uuid';
import type { Transaction } from '../types';

interface FinanceState {
  transactions: Transaction[];
  loading: boolean;
  userId: string | null;
  loadTransactions: (userId: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  transactions: [],
  loading: false,
  userId: null,

  loadTransactions: async (userId: string) => {
    set({ loading: true, userId });
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao carregar transações:', error.message);
      set({ loading: false });
      return;
    }

    const mapped: Transaction[] = (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      description: row.description,
      amount: Number(row.amount),
      category: row.category,
      date: row.date,
      createdAt: row.created_at,
    }));

    set({ transactions: mapped, loading: false });
  },

  addTransaction: async (data) => {
    const { userId } = get();
    if (!userId) return;

    const id = uuidv4();
    const newTx: Transaction = { ...data, id, createdAt: new Date().toISOString() };

    set((state) => ({ transactions: [newTx, ...state.transactions] }));

    const { error } = await supabase.from('transactions').insert({
      id,
      user_id: userId,
      type: data.type,
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
    });

    if (error) {
      console.error('Erro ao salvar transação:', error.message);
      set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
    }
  },

  removeTransaction: async (id: string) => {
    const prev = get().transactions;
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Erro ao remover transação:', error.message);
      set({ transactions: prev });
    }
  },

  updateTransaction: async (id, data) => {
    const prev = get().transactions;
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));

    const { error } = await supabase.from('transactions').update({
      type: data.type,
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
    }).eq('id', id);

    if (error) {
      console.error('Erro ao atualizar transação:', error.message);
      set({ transactions: prev });
    }
  },
}));

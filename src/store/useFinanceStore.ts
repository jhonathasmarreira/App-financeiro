import { create } from 'zustand';
import { supabase, createAuthClient } from '../lib/supabase';
import { v4 as uuidv4 } from '../utils/uuid';
import type { Transaction } from '../types';

// Authenticated Supabase client — replaced once the Clerk JWT is available
let _client = supabase;

interface FinanceState {
  transactions: Transaction[];
  loading: boolean;
  userId: string | null;
  setToken: (token: string) => void;
  loadTransactions: (userId: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  addTransactions: (items: Omit<Transaction, 'id' | 'createdAt'>[]) => Promise<number>;
  removeTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  transactions: [],
  loading: false,
  userId: null,

  setToken: (token) => {
    _client = createAuthClient(token);
  },

  loadTransactions: async (userId) => {
    set({ loading: true, userId });
    const { data, error } = await _client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao carregar:', error.message);
      set({ loading: false });
      return;
    }

    const mapped: Transaction[] = (data ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      description: r.description,
      amount: Number(r.amount),
      category: r.category,
      date: r.date,
      createdAt: r.created_at,
      parcela: r.parcela || '',
      data_fatura: r.data_fatura || '',
    }));

    set({ transactions: mapped, loading: false });
  },

  addTransaction: async (data) => {
    const { userId } = get();
    if (!userId) return;
    const id = uuidv4();
    const newTx: Transaction = { ...data, id, createdAt: new Date().toISOString() };
    set((s) => ({ transactions: [newTx, ...s.transactions] }));
    const { error } = await _client.from('transactions').insert({
      id, user_id: userId,
      type: data.type, description: data.description,
      amount: data.amount, category: data.category,
      date: data.date,
      parcela: data.parcela || '',
      data_fatura: data.data_fatura || null,
    });
    if (error) {
      console.error('Erro ao salvar:', error.message);
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    }
  },

  addTransactions: async (items) => {
    const { userId } = get();
    if (!userId) return 0;
    const rows = items.map((data) => {
      const id = uuidv4();
      return {
        id, user_id: userId,
        type: data.type, description: data.description,
        amount: data.amount, category: data.category,
        date: data.date,
        parcela: data.parcela || '',
        data_fatura: data.data_fatura || null,
      };
    });
    const newTxs: Transaction[] = rows.map((r) => ({
      id: r.id, type: r.type as Transaction['type'],
      description: r.description, amount: Number(r.amount),
      category: r.category as Transaction['category'],
      date: r.date, createdAt: new Date().toISOString(),
      parcela: r.parcela, data_fatura: r.data_fatura || '',
    }));
    set((s) => ({ transactions: [...newTxs, ...s.transactions] }));
    const { error } = await _client.from('transactions').insert(rows);
    if (error) {
      console.error('Erro ao importar:', error.message);
      const ids = new Set(rows.map((r) => r.id));
      set((s) => ({ transactions: s.transactions.filter((t) => !ids.has(t.id)) }));
      return 0;
    }
    return rows.length;
  },

  removeTransaction: async (id) => {
    const prev = get().transactions;
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    const { error } = await _client.from('transactions').delete().eq('id', id);
    if (error) { console.error('Erro ao remover:', error.message); set({ transactions: prev }); }
  },

  updateTransaction: async (id, data) => {
    const prev = get().transactions;
    set((s) => ({ transactions: s.transactions.map((t) => t.id === id ? { ...t, ...data } : t) }));
    const { error } = await _client.from('transactions').update({
      type: data.type, description: data.description,
      amount: data.amount, category: data.category,
      date: data.date, parcela: data.parcela,
      data_fatura: data.data_fatura || null,
    }).eq('id', id);
    if (error) { console.error('Erro ao atualizar:', error.message); set({ transactions: prev }); }
  },
}));

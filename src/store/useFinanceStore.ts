import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from '../utils/uuid';
import type { Transaction, TransactionType, Category } from '../types';

interface FinanceState {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      transactions: getSeedData(),

      addTransaction: (data) =>
        set((state) => ({
          transactions: [
            {
              ...data,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      updateTransaction: (id, data) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
    }),
    { name: 'finance-store' }
  )
);

function getSeedData(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prevMonth = String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0');
  const prevYear = now.getMonth() === 0 ? year - 1 : year;

  const make = (
    type: TransactionType,
    description: string,
    amount: number,
    category: Category,
    day: string,
    monthStr: string,
    yearStr: number
  ): Transaction => ({
    id: uuidv4(),
    type,
    description,
    amount,
    category,
    date: `${yearStr}-${monthStr}-${day}`,
    createdAt: new Date().toISOString(),
  });

  return [
    make('income', 'Salário mensal', 5000, 'Salário', '05', month, year),
    make('income', 'Projeto freelance', 1200, 'Freelance', '10', month, year),
    make('expense', 'Aluguel', 1500, 'Moradia', '01', month, year),
    make('expense', 'Supermercado', 450, 'Alimentação', '08', month, year),
    make('expense', 'Conta de luz', 130, 'Moradia', '12', month, year),
    make('expense', 'Academia', 90, 'Saúde', '15', month, year),
    make('expense', 'Transporte público', 200, 'Transporte', '03', month, year),
    make('expense', 'Streaming', 55, 'Lazer', '07', month, year),
    make('income', 'Dividendos', 300, 'Investimentos', '20', prevMonth, prevYear),
    make('income', 'Salário mensal', 5000, 'Salário', '05', prevMonth, prevYear),
    make('expense', 'Aluguel', 1500, 'Moradia', '01', prevMonth, prevYear),
    make('expense', 'Supermercado', 380, 'Alimentação', '09', prevMonth, prevYear),
    make('expense', 'Roupas', 220, 'Vestuário', '14', prevMonth, prevYear),
    make('expense', 'Restaurante', 160, 'Alimentação', '18', prevMonth, prevYear),
  ];
}

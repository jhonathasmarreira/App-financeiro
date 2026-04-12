export type TransactionType = 'income' | 'expense';

export type Category =
  | 'Salário'
  | 'Freelance'
  | 'Investimentos'
  | 'Outros (Receita)'
  | 'Alimentação'
  | 'Transporte'
  | 'Moradia'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Vestuário'
  | 'Outros (Despesa)';

export const INCOME_CATEGORIES: Category[] = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Outros (Receita)',
];

export const EXPENSE_CATEGORIES: Category[] = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Outros (Despesa)',
];

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: Category;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: string;
}

export interface MonthSummary {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
}

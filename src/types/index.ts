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
  | 'Importado'
  | 'Outros (Despesa)';

export const INCOME_CATEGORIES: Category[] = [
  'Salário', 'Freelance', 'Investimentos', 'Outros (Receita)',
];

export const EXPENSE_CATEGORIES: Category[] = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Vestuário', 'Importado', 'Outros (Despesa)',
];

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: Category;
  date: string;          // YYYY-MM-DD
  createdAt: string;
  parcela?: string;      // ex: "01/12"
  data_fatura?: string;  // YYYY-MM-DD (billing date)
}

export type Page = 'dashboard' | 'lancamentos' | 'parcelas' | 'analise' | 'importar';

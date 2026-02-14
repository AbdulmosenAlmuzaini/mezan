
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  createdAt: string;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  userId: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AnalysisResponse {
  hotspots: string[];
  ratioAdvice: string;
  savingsSuggestions: string[];
  riskAlerts: string[];
  summary: string;
}

export const CATEGORIES = {
  expense: [
    'طعام وشراب',
    'سكن وفواتير',
    'مواصلات',
    'ترفيه',
    'صحة',
    'تسوق',
    'تعليم',
    'أخرى'
  ],
  income: [
    'راتب',
    'رصيد افتتاحي',
    'عمل حر',
    'استثمارات',
    'هدايا',
    'أخرى'
  ]
};

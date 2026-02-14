
import { Transaction, User } from '../types';

const KEYS = {
  TRANSACTIONS: 'mizan_transactions',
  USERS: 'mizan_users',
  CURRENT_USER: 'mizan_current_user'
};

export const storageService = {
  getTransactions: (userId: string): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!data) return [];
    const all: Transaction[] = JSON.parse(data);
    return all.filter(t => t.userId === userId);
  },

  addTransaction: (transaction: Transaction) => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    const all: Transaction[] = data ? JSON.parse(data) : [];
    all.push(transaction);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(all));
  },

  deleteTransaction: (id: string) => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!data) return;
    const all: Transaction[] = JSON.parse(data);
    const filtered = all.filter(t => t.id !== id);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  registerUser: (name: string, email: string): User => {
    const newUser = { id: Math.random().toString(36).substr(2, 9), name, email };
    const data = localStorage.getItem(KEYS.USERS);
    const all: User[] = data ? JSON.parse(data) : [];
    all.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(all));
    return newUser;
  }
};

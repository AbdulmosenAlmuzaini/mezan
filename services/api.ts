
import { Transaction, User, AuthState, AnalysisResponse, Category, TransactionType } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const getHeaders = () => {
    const token = localStorage.getItem('mizan_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const apiService = {
    login: async (email: string, password: string): Promise<{ user: User, access_token: string }> => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('mizan_token', data.access_token);
        localStorage.setItem('mizan_user', JSON.stringify(data.user));
        return data;
    },

    register: async (name: string, email: string, password: string): Promise<{ user: User, access_token: string }> => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        const data = await response.json();
        localStorage.setItem('mizan_token', data.access_token);
        localStorage.setItem('mizan_user', JSON.stringify(data.user));
        return data;
    },

    logout: () => {
        localStorage.removeItem('mizan_token');
        localStorage.removeItem('mizan_user');
    },

    getTransactions: async (): Promise<Transaction[]> => {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        // Map backend response (id is number, created_at is string) to frontend types
        return data.map((t: any) => ({
            ...t,
            id: t.id.toString(),
            createdAt: t.created_at,
            userId: t.user_id.toString()
        }));
    },

    addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId'>): Promise<Transaction> => {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(transaction)
        });
        if (!response.ok) throw new Error('Failed to add transaction');
        const t = await response.json();
        return {
            ...t,
            id: t.id.toString(),
            createdAt: t.created_at,
            userId: t.user_id.toString()
        };
    },

    deleteTransaction: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete transaction');
    },

    // Categories
    getCategories: async (): Promise<Category[]> => {
        const response = await fetch(`${API_URL}/categories`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        return data.map((c: any) => ({
            ...c,
            id: c.id.toString(),
            userId: c.user_id.toString()
        }));
    },

    addCategory: async (name: string, type: TransactionType): Promise<Category> => {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, type })
        });
        if (!response.ok) throw new Error('Failed to add category');
        const c = await response.json();
        return {
            ...c,
            id: c.id.toString(),
            userId: c.user_id.toString()
        };
    },

    deleteCategory: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete category');
    },

    // Security
    verifyEmail: async (token: string): Promise<void> => {
        const response = await fetch(`${API_URL}/verify-email/${token}`);
        if (!response.ok) throw new Error('Verification failed');
    },

    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        const response = await fetch(`${API_URL}/change-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change password');
        }
    },

    forgotPassword: async (email: string): Promise<void> => {
        const response = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Request failed');
    },

    resetPassword: async (token: string, newPassword: string): Promise<void> => {
        const response = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword })
        });
        if (!response.ok) throw new Error('Reset failed');
    },

    analyzeFinances: async (transactions: Transaction[], lang: string = 'ar'): Promise<AnalysisResponse> => {
        // We can either call the backend /analyze or keep using Gemini service.
        // Let's use the backend /analyze as requested for "Backend completion"
        const response = await fetch(`${API_URL}/analyze?lang=${lang}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(transactions)
        });

        if (!response.ok) throw new Error('AI Analysis failed');
        return await response.json();
    }
};

import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { TransactionType, CATEGORIES, Category } from '../types';
import { apiService } from '../services/api';

interface Props {
  onAdd: (data: { title: string; amount: number; type: TransactionType; category: string }) => void;
  onClose: () => void;
}

import { useTranslation } from '../services/i18n';

export default function TransactionForm({ onAdd, onClose }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiService.getCategories().then(setCustomCategories).catch(console.error);
  }, []);

  useEffect(() => {
    // Reset category when type changes
    const filteredCustom = customCategories.filter(c => c.type === type);
    if (filteredCustom.length > 0) {
      setCategory(filteredCustom[0].name);
    } else {
      setCategory(CATEGORIES[type][0]);
    }
  }, [type, customCategories]);

  const allCategories = [
    ...CATEGORIES[type],
    ...customCategories.filter(c => c.type === type).map(c => c.name)
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    onAdd({
      title,
      amount: parseFloat(amount),
      type,
      category
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-t-[2.5rem] sm:rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 duration-300">
        <h2 className="text-xl sm:text-2xl font-black mb-6 text-gray-900 dark:text-white border-b pb-4 tracking-tight">{t('addTransaction')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('type')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory(CATEGORIES.expense[0]); }}
                className={`p-2 rounded-lg border text-sm transition ${type === 'expense' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50'}`}
              >
                {t('expenseHeader')}
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategory(CATEGORIES.income[0]); }}
                className={`p-2 rounded-lg border text-sm transition ${type === 'income' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50'}`}
              >
                {t('incomeHeader')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('titleLabel')}</label>
            <input
              autoFocus
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={t('placeholderTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('amount')}</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('category')}</label>
              <select
                className="w-full p-2 border rounded-lg outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition"
            >
              {t('save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


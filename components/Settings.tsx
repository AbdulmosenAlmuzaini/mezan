import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Sliders, Trash2, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useTranslation } from '../services/i18n';
import { Category, TransactionType } from '../types';

interface SettingsProps {
    onClose: () => void;
    userEmail: string;
    isVerified: boolean;
}

export default function Settings({ onClose, userEmail, isVerified }: SettingsProps) {
    const { t, lang } = useTranslation();
    const [activeTab, setActiveTab] = useState<'categories' | 'security'>('categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>('expense');

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await apiService.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await apiService.addCategory(newCatName, newCatType);
            setNewCatName('');
            loadCategories();
        } catch (err) {
            console.error('Failed to add category', err);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await apiService.deleteCategory(id);
            loadCategories();
        } catch (err) {
            console.error('Failed to delete category', err);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ text: t('passwordMismatch'), type: 'error' });
            return;
        }
        try {
            await apiService.changePassword(oldPassword, newPassword);
            setMessage({ text: t('passwordUpdated'), type: 'success' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ text: err.message || t('passwordUpdateFailed'), type: 'error' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in zoom-in-95 duration-300">
                {/* Sidebar */}
                <div className={`w-full md:w-64 bg-gray-50 p-6 ${lang === 'ar' ? 'border-l' : 'border-r'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <SettingsIcon className="text-blue-600" size={24} />
                        <h2 className="font-black text-xl text-gray-900">{t('settings')}</h2>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-white'}`}
                        >
                            <Sliders size={20} />
                            <span className="font-bold">{t('categoriesTab')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-white'}`}
                        >
                            <Shield size={20} />
                            <span className="font-bold">{t('securityTab')}</span>
                        </button>
                    </nav>

                    <div className="mt-auto pt-8">
                        <button onClick={onClose} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium">
                            <X size={18} />
                            <span>{t('close')}</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'categories' ? (
                        <div className={`space-y-8 animate-in ${lang === 'ar' ? 'slide-in-from-left-4' : 'slide-in-from-right-4'} duration-300`}>
                            <div>
                                <h3 className="text-xl font-black mb-2">{t('customCategories')}</h3>
                                <p className="text-gray-500 text-sm">{t('categoriesDesc')}</p>
                            </div>

                            <form onSubmit={handleAddCategory} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t('categoryName')}
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <select
                                    value={newCatType}
                                    onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                                    className="px-4 py-2 border rounded-xl outline-none"
                                >
                                    <option value="expense">{t('expenseHeader')}</option>
                                    <option value="income">{t('incomeHeader')}</option>
                                </select>
                                <button className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors">
                                    <Plus size={24} />
                                </button>
                            </form>

                            <div className="space-y-3">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-8 rounded-full ${cat.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="font-bold text-gray-800">{cat.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{cat.type === 'income' ? t('incomeHeader') : t('expenseHeader')}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-center py-8 text-gray-400 text-sm">{t('noCategories')}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={`space-y-8 animate-in ${lang === 'ar' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} duration-300`}>
                            <div>
                                <h3 className="text-xl font-black mb-2">{t('securitySettings')}</h3>
                                <p className="text-gray-500 text-sm">{t('securityDesc')}</p>
                            </div>

                            <div className={`p-4 rounded-2xl flex items-center gap-3 ${isVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                {isVerified ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <div className="text-sm">
                                    <p className="font-bold">{isVerified ? t('verified') : t('unverified')}</p>
                                    <p className="opacity-80">{userEmail}</p>
                                </div>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                {message && (
                                    <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {message.text}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-wider">{t('currentPassword')}</label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-wider">{t('newPassword')}</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-wider">{t('confirmPassword')}</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                >
                                    {t('updatePassword')}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

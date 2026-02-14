
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Plus, Trash2, BrainCircuit, TrendingUp, TrendingDown, Wallet, LogOut,
  Calendar, Settings as SettingsIcon, AlertCircle, Globe, Download, FileText
} from 'lucide-react';
import { Transaction, AnalysisResponse } from '../types';
import { apiService } from '../services/api';
import { useTranslation } from '../services/i18n';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Props {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  userName: string;
  isVerified: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC<Props> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onLogout,
  onOpenSettings,
  userName,
  isVerified
}) => {
  const { t, lang, toggleLanguage } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  const categoryChartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const monthlyChartData = useMemo(() => {
    const monthsMap: Record<string, { income: number; expense: number }> = {};
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      monthsMap[monthName] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      const monthName = months[date.getMonth()];
      if (monthsMap[monthName]) {
        if (t.type === 'income') monthsMap[monthName].income += t.amount;
        else monthsMap[monthName].expense += t.amount;
      }
    });

    return Object.entries(monthsMap).map(([name, data]) => ({ name, ...data }));
  }, [transactions]);

  const handleSmartAnalysis = async () => {
    if (transactions.length === 0) {
      alert("الرجاء إضافة عمليات أولاً لإجراء التحليل.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await apiService.analyzeFinances(transactions, lang);
      setAnalysis(result);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToCSV = () => {
    const headers = [t('date'), t('operation'), t('category'), t('amount')];
    const rows = transactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.title,
      t.category,
      t.amount
    ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mizan_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Mizan Financial Report", 10, 10);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, 20);

    const tableColumn = [t('date'), t('operation'), t('category'), t('amount')];
    const tableRows: any[] = [];

    transactions.forEach(t => {
      const transactionData = [
        new Date(t.createdAt).toLocaleDateString(),
        t.title,
        t.category,
        `${t.amount} SAR`
      ];
      tableRows.push(transactionData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save(`mizan_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Wallet size={20} className="sm:w-[24px] sm:h-[24px]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-blue-600 tracking-tighter">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition-all text-sm font-bold border border-gray-100"
          >
            <Globe size={16} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-gray-400">{t('balance')}</span>
            <span className="font-bold text-blue-600">{stats.balance.toLocaleString()} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          <span className="hidden sm:inline font-medium text-gray-700 text-sm">{t('welcome')}{userName}</span>
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="الإعدادات"
          >
            <SettingsIcon size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="خروج"
          >
            <LogOut size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
        </div>
      </nav>

      {/* Verification Banner */}
      {!isVerified && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-center gap-2 text-amber-700 text-xs sm:text-sm animate-pulse">
          <AlertCircle size={14} />
          <span>{t('verifyEmail')}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center transition-all hover:shadow-md hover:-translate-y-1">
            <div className="bg-green-50 p-4 rounded-2xl text-green-600 mb-4 ring-8 ring-green-50/50">
              <TrendingUp size={28} />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">{t('income')}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-green-600">{stats.income.toLocaleString()} {lang === 'ar' ? 'ر.س' : 'SAR'}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center transition-all hover:shadow-md hover:-translate-y-1">
            <div className="bg-red-50 p-4 rounded-2xl text-red-600 mb-4 ring-8 ring-red-50/50">
              <TrendingDown size={28} />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">{t('expense')}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-red-600">{stats.expense.toLocaleString()} {lang === 'ar' ? 'ر.س' : 'SAR'}</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-xl shadow-blue-200 border-t border-white/20 flex flex-col items-center text-white sm:col-span-2 lg:col-span-1 transition-all hover:shadow-blue-300 hover:-translate-y-1 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
            <div className="bg-white/20 p-4 rounded-2xl text-white mb-4 backdrop-blur-md">
              <Wallet size={28} />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">{t('balance')}</p>
            <h3 className="text-3xl sm:text-4xl font-black">{stats.balance.toLocaleString()} {lang === 'ar' ? 'ر.س' : 'SAR'}</h3>
          </div>
        </div>

        {/* Bar Chart: Monthly Summary */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 transition-all hover:shadow-md group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar size={22} />
              </div>
              <div>
                <h3 className="font-black text-xl text-gray-900">{t('monthlySummary')}</h3>
                <p className="text-xs text-gray-400">ملخص مالي شامل لآخر 6 أشهر</p>
              </div>
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                <Bar name="الدخل" dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar name="المصاريف" dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts and History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <h3 className="font-bold text-lg text-gray-800 shrink-0">{t('recentTransactions')}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100"
                    title={t('exportCSV')}
                  >
                    <Download size={14} />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                    title={t('exportPDF')}
                  >
                    <FileText size={14} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
              <button
                onClick={onAddTransaction}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100"
              >
                <Plus size={20} />
                <span>{t('addTransaction')}</span>
              </button>
            </div>

            {/* Mobile Cards / Desktop Table */}
            <div className="block sm:hidden">
              <div className="divide-y divide-gray-50 px-4">
                {transactions.length === 0 ? (
                  <p className="text-center py-10 text-gray-400 text-sm">لا توجد عمليات مضافة بعد.</p>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="py-4 flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{t.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">{t.category}</span>
                          <span className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ر.س
                        </span>
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className={`px-6 py-4 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t('date')}</th>
                    <th className={`px-6 py-4 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t('operation')}</th>
                    <th className={`px-6 py-4 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t('category')}</th>
                    <th className={`px-6 py-4 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t('amount')}</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">لا توجد عمليات مضافة بعد.</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-gray-800">{t.title}</p>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${t.type === 'income' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`text-sm font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {lang === 'ar' ? 'ر.س' : 'SAR'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Area: Pie Chart and AI */}
          <div className="space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 text-center text-gray-800 text-sm sm:text-base">{t('expenseDistribution')}</h3>
              <div className="h-[200px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Smart Analysis Trigger */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 sm:p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className="text-blue-300" size={20} />
                  <h3 className="font-bold text-base sm:text-lg">{t('smartAnalysis')}</h3>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm mb-6 leading-relaxed">
                  {lang === 'ar' ? 'دع الذكاء الاصطناعي يحلل عاداتك المالية ويقدم لك نصائح مخصصة لتحسين رصيدك.' : 'Let AI analyze your financial habits and provide personalized tips to improve your balance.'}
                </p>
                <button
                  onClick={handleSmartAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-white text-blue-700 font-bold py-3 rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                      {t('analyzing')}
                    </span>
                  ) : (
                    <>
                      <span>{t('startAnalysis')}</span>
                      <BrainCircuit size={18} />
                    </>
                  )}
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          </div>
        </div>

        {/* AI Results Display */}
        {analysis && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-blue-100 p-6 sm:p-10 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                  <BrainCircuit size={28} className="sm:w-[32px] sm:h-[32px]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">تقرير ميزان الذكي</h2>
              </div>
              <button onClick={() => setAnalysis(null)} className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold">إغلاق التقرير</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                  <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-3 text-sm sm:text-base">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    الملخص العام
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-base sm:text-lg">{analysis.summary}</p>
                </div>
                <div className="bg-red-50/30 p-5 rounded-3xl border border-red-50">
                  <h4 className="font-bold text-red-600 flex items-center gap-2 mb-3 text-sm sm:text-base">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    تنبيهات المصاريف
                  </h4>
                  <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                    {analysis.hotspots.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50/30 p-5 rounded-3xl border border-green-50">
                  <h4 className="font-bold text-green-700 flex items-center gap-2 mb-3 text-sm sm:text-base">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    توصيات التوفير
                  </h4>
                  <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                    {analysis.savingsSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-green-400 rounded-full shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-50">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">تحليل النسبة</h4>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{analysis.ratioAdvice}</p>
                  {analysis.riskAlerts.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wider">تنبيهات إضافية:</p>
                      <ul className="text-xs text-amber-600 space-y-2">
                        {analysis.riskAlerts.map((r, i) => <li key={i} className="flex items-center gap-2"><span>•</span>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

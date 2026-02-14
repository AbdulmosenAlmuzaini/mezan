
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Settings from './components/Settings';
import { apiService } from './services/api';
import { AuthState, Transaction, TransactionType, User } from './types';
import { LogIn, UserPlus, Wallet, ShieldAlert, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const initialUser = localStorage.getItem('mizan_user');
  const [auth, setAuth] = useState<AuthState>({
    user: initialUser ? JSON.parse(initialUser) : null,
    isAuthenticated: !!localStorage.getItem('mizan_token')
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    // Check for verification token in URL
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      const token = path.split('/verify/')[1];
      if (token) {
        setVerificationStatus('loading');
        apiService.verifyEmail(token)
          .then(() => {
            setVerificationStatus('success');
            // Update local user state if logged in
            if (auth.user) {
              const updatedUser = { ...auth.user, isVerified: true };
              setAuth(prev => ({ ...prev, user: updatedUser }));
              localStorage.setItem('mizan_user', JSON.stringify(updatedUser));
            }
            setTimeout(() => {
              window.history.pushState({}, '', '/');
              setVerificationStatus('idle');
            }, 3000);
          })
          .catch(() => setVerificationStatus('error'));
      }
    }

    if (auth.isAuthenticated) {
      apiService.getTransactions().then(setTransactions).catch(console.error);
    } else {
      setTransactions([]);
    }
  }, [auth.isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiService.login(email, password);
      setAuth({ user: data.user, isAuthenticated: true });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiService.register(name, email, password);
      setAuth({ user: data.user, isAuthenticated: true });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setAuth({ user: null, isAuthenticated: false });
  };

  const addTransaction = async (data: { title: string; amount: number; type: TransactionType; category: string }) => {
    try {
      const newTransaction = await apiService.addTransaction(data);
      setTransactions(prev => [newTransaction, ...prev]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await apiService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 transition-all duration-300">
          <div className="bg-blue-600 p-8 sm:p-10 text-center text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-3xl mb-4 backdrop-blur-md">
                <Wallet size={40} className="sm:w-[48px] sm:h-[48px]" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter">ميزان</h1>
              <p className="text-blue-100 text-sm sm:text-base">تحكم بمستقبلك المالي بذكاء</p>
            </div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mt-20 animate-pulse"></div>
          </div>

          <div className="p-8">
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setIsLoginView(true)}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition ${isLoginView ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
              >
                تسجيل دخول
              </button>
              <button
                onClick={() => setIsLoginView(false)}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition ${!isLoginView ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
              >
                حساب جديد
              </button>
            </div>

            <form onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-4">
              {!isLoginView && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="أدخل اسمك"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">كلمة المرور</label>
                <input
                  type="password"
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-2xl mt-6 transition shadow-lg flex items-center justify-center gap-2"
              >
                {isLoginView ? (
                  <>
                    <span>دخول</span>
                    <LogIn size={20} />
                  </>
                ) : (
                  <>
                    <span>إنشاء حساب</span>
                    <UserPlus size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {verificationStatus !== 'idle' && (
        <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300">
          <div className={`p-4 flex items-center justify-center gap-2 text-white font-bold shadow-lg ${verificationStatus === 'loading' ? 'bg-blue-600' :
              verificationStatus === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}>
            {verificationStatus === 'loading' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {verificationStatus === 'success' && <CheckCircle2 size={20} />}
            {verificationStatus === 'error' && <ShieldAlert size={20} />}
            <span>
              {verificationStatus === 'loading' ? 'جاري التحقق من الحساب...' :
                verificationStatus === 'success' ? 'تم توثيق الحساب بنجاح!' : 'فشل التحقق من الحساب. الرابط قد يكون منتهياً.'}
            </span>
          </div>
        </div>
      )}

      <Dashboard
        transactions={transactions}
        userName={auth.user?.name || 'مستخدم'}
        isVerified={auth.user?.isVerified || false}
        onAddTransaction={() => setShowAddModal(true)}
        onDeleteTransaction={deleteTransaction}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
      />
      {showAddModal && (
        <TransactionForm
          onAdd={addTransaction}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          userEmail={auth.user?.email || ''}
          isVerified={auth.user?.isVerified || false}
        />
      )}
    </>
  );
};

export default App;

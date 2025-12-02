import React, { useState } from 'react';
import { UserRole, ACCOUNTS } from '../types';
import { Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [user, setUser] = useState('Mike');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = ACCOUNTS[user as keyof typeof ACCOUNTS];
    if (account && account.password === pass) {
      onLogin(account.role);
    } else {
      setError(t('invalidCredentials'));
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')`
      }}
    >
      {/* Overlay to ensure text readability and create a "dimmed" cartoonish feel */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

      <div className="bg-white/95 backdrop-blur rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner">
             <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{t('loginTitle')}</h1>
          <p className="text-slate-500 text-sm">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('username')}</label>
            <input 
              type="text" 
              value={user} 
              onChange={e => setUser(e.target.value)} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input 
              type="password" 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
              placeholder="••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-1 rounded">{error}</p>}

          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5">
            {t('signIn')}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center leading-relaxed border border-slate-100">
          <span className="font-semibold block mb-1 text-slate-700">{t('defaultAccounts')}</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white p-2 rounded border border-slate-100">
                <span className="font-bold text-blue-600">Admin</span>
                <div className="text-slate-400">Mike / lk2025</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-100">
                <span className="font-bold text-green-600">Operator</span>
                <div className="text-slate-400">operator / 123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
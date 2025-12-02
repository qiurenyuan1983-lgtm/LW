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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input 
              type="password" 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
              placeholder="••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            {t('signIn')}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center leading-relaxed border border-slate-100">
          <span className="font-semibold block mb-1">{t('defaultAccounts')}</span>
          Admin: Mike / lk2025<br/>
          Operator: operator / 123456
        </div>
      </div>
    </div>
  );
};

export default Login;

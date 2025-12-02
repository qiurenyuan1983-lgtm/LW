import React, { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Package, UserCircle, Upload, Languages } from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  onLogout: () => void;
  logo: string | null;
  onLogoUpload: (file: File) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, logo, onLogoUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language, setLanguage } = useLanguage();

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLogoUpload(e.target.files[0]);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-white font-medium shadow-md shadow-sky-200/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Header (Mobile) or Sidebar (Desktop) */}
      
      {/* Mobile Header */}
      <header className="md:hidden bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white flex justify-between items-center shadow-lg z-50">
         <div className="flex items-center gap-2">
            {logo && <img src={logo} alt="Logo" className="h-8 rounded bg-white p-0.5" />}
            <span className="font-bold">LinkW</span>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={toggleLanguage} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-xs font-bold">
                 {language === 'en' ? 'CN' : 'EN'}
             </button>
             <div className="text-xs opacity-80">{userRole}</div>
         </div>
      </header>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 h-screen sticky top-0 shadow-2xl z-40">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
             <div 
               className="h-10 w-10 bg-white rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
               onClick={handleLogoClick}
               title="Click to change logo"
             >
                {logo ? <img src={logo} className="w-full h-full object-contain" /> : <Upload size={20} className="text-slate-400" />}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
             <div>
               <h1 className="font-bold text-lg leading-tight">LinkW</h1>
               <p className="text-[10px] text-slate-400">Warehouse Sys v13</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 mb-2">{t('menu')}</div>
          <NavLink to="/" className={navClass}>
            <LayoutDashboard size={18} />
            <span>{t('dashboard')}</span>
          </NavLink>
          <NavLink to="/rules" className={navClass}>
            <ClipboardList size={18} />
            <span>{t('rulesOps')}</span>
          </NavLink>
          <NavLink to="/wms" className={navClass}>
            <Package size={18} />
            <span>{t('wmsSystem')}</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
             <button 
                onClick={toggleLanguage}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
             >
                <Languages size={14} />
                {language === 'en' ? 'Switch to Chinese' : '切换到英文'}
             </button>
          </div>
          <div className="flex items-center gap-3 px-2">
            <div className="bg-slate-700 p-2 rounded-full">
              <UserCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate capitalize">{userRole}</p>
              <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300">{t('signOut')}</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Top Bar for Desktop */}
        <div className="hidden md:flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-4 z-30 opacity-95 backdrop-blur">
           <div>
             <h2 className="text-xl font-bold text-slate-800">{t('appTitle')}</h2>
             <p className="text-xs text-slate-500">{t('appSubtitle')}</p>
           </div>
           <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100">
                {t('user')}: <span className="font-semibold capitalize">{userRole}</span>
              </span>
           </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default Layout;

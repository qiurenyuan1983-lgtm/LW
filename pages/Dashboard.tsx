import React from 'react';
import DashboardStats from '../components/DashboardStats';
import { LocationRule } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  rules: LocationRule[];
}

const Dashboard: React.FC<Props> = ({ rules }) => {
  const { t } = useLanguage();
  return (
    <div>
       <div className="mb-6">
         <h1 className="text-2xl font-bold text-slate-800">{t('overviewTitle')}</h1>
         <p className="text-slate-500">{t('overviewDesc')}</p>
       </div>
       <DashboardStats rules={rules} />
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Rules from './pages/Rules';
import WMS from './pages/WMS';
import { UserRole, LocationRule, LogEntry } from './types';
import { generateDefaultRules } from './services/dataService';
import { LanguageProvider } from './contexts/LanguageContext';

const STORAGE_KEY = "la_location_rules_v13";
const LOG_KEY = "la_location_logs_v3";
const LOGO_KEY = "la_company_logo_base64";

const AppContent: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [rules, setRules] = useState<LocationRule[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logo, setLogo] = useState<string | null>(null);

  // Initialize Data
  useEffect(() => {
    // Load Rules
    const savedRules = localStorage.getItem(STORAGE_KEY);
    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules));
      } catch (e) {
        setRules(generateDefaultRules());
      }
    } else {
      setRules(generateDefaultRules());
    }

    // Load Logs
    const savedLogs = localStorage.getItem(LOG_KEY);
    if(savedLogs) setLogs(JSON.parse(savedLogs));

    // Load Logo
    const savedLogo = localStorage.getItem(LOGO_KEY);
    if(savedLogo) setLogo(savedLogo);

  }, []);

  // Save Rules on change
  useEffect(() => {
    if(rules.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    }
  }, [rules]);

  // Save Logs
  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }, [logs]);

  const addLog = (text: string) => {
    const newLog = { time: new Date().toLocaleString(), text };
    setLogs(prev => [newLog, ...prev].slice(0, 300));
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const res = e.target?.result as string;
        setLogo(res);
        localStorage.setItem(LOGO_KEY, res);
    };
    reader.readAsDataURL(file);
  };

  if (!userRole) {
    return <Login onLogin={(role) => {
        setUserRole(role);
        addLog(`User logged in: ${role}`);
    }} />;
  }

  return (
    <Router>
      <Layout 
        userRole={userRole} 
        onLogout={() => setUserRole(null)} 
        logo={logo} 
        onLogoUpload={handleLogoUpload}
      >
        <Routes>
          <Route path="/" element={<Dashboard rules={rules} />} />
          <Route path="/rules" element={<Rules rules={rules} setRules={setRules} userRole={userRole} addLog={addLog} />} />
          <Route path="/wms" element={<WMS />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BillingPage from './pages/BillingPage';
import ProductPage from './pages/ProductPage';
import CustomerPage from './pages/CustomerPage';
import BillsHistory from './pages/BillsHistory';
import PendingDues from './pages/PendingDues';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Quick Placeholder for missing pages
const Placeholder = ({ name }) => (
  <div className="empty-state">
    <h1>{name} Page</h1>
    <p>This feature is coming soon in the next update!</p>
  </div>
);

// Layout Component
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useTranslation();
  
  if (loading) return <div className="loading-wrap"><div className="loader" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </div>
          <div className="topbar-title">{t('app_title')}</div>
          <div className="flex gap-3" style={{ alignItems: 'center' }}>
            <LanguageSwitcher />
            <div className="badge badge-success hide-mobile">{t('online')}</div>
            <button onClick={logout} className="btn btn-sm btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="hide-mobile">{t('logout')}</span>
              <X size={16} className="show-mobile" />
            </button>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#162016', color: '#e8f5e9', border: '1px solid rgba(45, 122, 58, 0.2)' }
        }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/billing" element={<ProtectedLayout><BillingPage /></ProtectedLayout>} />
          <Route path="/bills" element={<ProtectedLayout><BillsHistory /></ProtectedLayout>} />
          <Route path="/pending-dues" element={<ProtectedLayout><PendingDues /></ProtectedLayout>} />
          <Route path="/products" element={<ProtectedLayout><ProductPage /></ProtectedLayout>} />
          <Route path="/customers" element={<ProtectedLayout><CustomerPage /></ProtectedLayout>} />
          
          <Route path="/stock" element={<ProtectedLayout><Placeholder name="Stock Management" /></ProtectedLayout>} />
          <Route path="/reports" element={<ProtectedLayout><Placeholder name="Reports" /></ProtectedLayout>} />
          
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

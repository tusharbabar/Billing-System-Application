import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Package, Users, FileText, BarChart3,
  Boxes, LogOut, Sprout, ChevronRight, Settings, HelpCircle,
  Bell, Search, IndianRupee, X
} from 'lucide-react';



export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { label: t('menu.overview'), to: '/', icon: LayoutDashboard },
    { label: t('menu.create_bill'), to: '/billing', icon: FileText },
    { label: t('menu.transaction_history'), to: '/bills', icon: Boxes },
    { label: t('menu.pending_dues'), to: '/pending-dues', icon: IndianRupee },
    { label: t('menu.inventory'), to: '/products', icon: Package },
    { label: t('menu.stock_alerts'), to: '/stock', icon: Sprout },
    { label: t('menu.clients'), to: '/customers', icon: Users },
    { label: t('menu.analytics'), to: '/reports', icon: BarChart3 },
  ];

  return (
    <aside className={`modern-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">🌾</div>
        <div className="brand-info">
          <span className="brand-name">{t('app_title')}</span>
          <span className="brand-tag">{t('portal_tag')}</span>
        </div>
        <button className="sidebar-close-btn show-mobile" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-search">
        <div className="search-box-pill">
          <Search size={14} />
          <input type="text" placeholder={t('search_placeholder')} />
        </div>
      </div>

      <nav className="modern-nav">
        <div className="menu-group">{t('menu.main_menu')}</div>
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `modern-nav-link${isActive ? ' active' : ''}`}
            onClick={() => window.innerWidth < 1024 && onClose()}
          >
            <div className="link-content">
              <Icon size={20} />
              <span>{label}</span>
            </div>
            <ChevronRight className="arrow" size={14} />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-utility">
        <div className="menu-group">{t('menu.system')}</div>
        <a href="#" className="modern-nav-link">
          <div className="link-content">
            <Settings size={20} />
            <span>{t('menu.settings')}</span>
          </div>
        </a>
        <a href="#" className="modern-nav-link">
          <div className="link-content">
            <HelpCircle size={20} />
            <span>{t('menu.support')}</span>
          </div>
        </a>
      </div>

      <div className="sidebar-profile">
        <div className="profile-card-glass">
          <div className="profile-avatar">
            {user?.name?.[0]?.toUpperCase()}
            <div className="online-status"></div>
          </div>
          <div className="profile-info">
            <span className="p-name">{user?.name}</span>
            <span className="p-role">{user?.role}</span>
          </div>
          <button className="modern-logout" onClick={logout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Users, FileText, BarChart3,
  Boxes, LogOut, Sprout, ChevronRight, Settings, HelpCircle,
  Bell, Search, IndianRupee, X
} from 'lucide-react';



const navItems = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Create Bill', to: '/billing', icon: FileText },
  { label: 'Transaction History', to: '/bills', icon: Boxes },
  { label: 'Pending Dues', to: '/pending-dues', icon: IndianRupee },
  { label: 'Inventory', to: '/products', icon: Package },
  { label: 'Stock Alerts', to: '/stock', icon: Sprout },
  { label: 'Clients', to: '/customers', icon: Users },
  { label: 'Analytics', to: '/reports', icon: BarChart3 },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`modern-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">🌾</div>
        <div className="brand-info">
          <span className="brand-name">Krushi Seva</span>
          <span className="brand-tag">Kendra Portal</span>
        </div>
        <button className="sidebar-close-btn show-mobile" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-search">
        <div className="search-box-pill">
          <Search size={14} />
          <input type="text" placeholder="Search features..." />
        </div>
      </div>

      <nav className="modern-nav">
        <div className="menu-group">MAIN MENU</div>
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
        <div className="menu-group">SYSTEM</div>
        <a href="#" className="modern-nav-link">
          <div className="link-content">
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </a>
        <a href="#" className="modern-nav-link">
          <div className="link-content">
            <HelpCircle size={20} />
            <span>Support</span>
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

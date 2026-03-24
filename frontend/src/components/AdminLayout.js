import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard, Monitor, Image, ListVideo, Settings, Users, LogOut, Zap, Menu, X, Newspaper, Paintbrush, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { Toaster } from '../components/ui/sonner';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const clientLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/screens', icon: Monitor, label: 'Ecrans' },
    { to: '/media', icon: Image, label: 'Mediatheque' },
    { to: '/playlists', icon: ListVideo, label: 'Playlists' },
    { to: '/ticker', icon: Newspaper, label: 'Bandeau defilant' },
    { to: '/flash-info', icon: AlertTriangle, label: 'Flash Info' },
    { to: '/themes', icon: Paintbrush, label: 'Themes' },
    { to: '/settings', icon: Settings, label: 'Parametres' },
  ];

  const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/clients', icon: Users, label: 'Clients' },
  ];

  const links = user?.role === 'super_admin' ? adminLinks : clientLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
        <Zap className="h-6 w-6 text-primary" />
        <span className="ml-2 font-bold text-lg tracking-tight">Intensiti</span>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setSidebarOpen(false)}
            data-testid={`nav-${link.to.replace('/', '') || 'dashboard'}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-primary/5 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon className="h-[18px] w-[18px]" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.company_name || user?.email}</p>
            <p className="text-xs text-slate-400">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Client'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Deconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="mobile-menu-btn">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center ml-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="ml-1.5 font-bold text-base">Intensiti</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-40 w-64 h-full flex flex-col bg-white border-r border-slate-200
        transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <div className="flex-1 overflow-y-auto p-5 md:p-8 lg:p-10">
          {children}
        </div>
      </main>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}

import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, ShieldCheck,
  ClipboardCheck, Users, CreditCard, BarChart3, Building2, Pencil, KeyRound,
  ChevronLeft, ChevronRight, Menu, X, BellRing, UserCircle, LogOut, AlertTriangle, QrCode,
} from 'lucide-react';
import Cookies from 'js-cookie';
import { logoutAndGetRedirect } from '../../services/authorizationService';

const sidebarItems = [
  // { label: 'Dashboard', icon: LayoutDashboard, route: '/dealer' },
  // { label: 'Inventory', icon: Package, route: '/dealer/inventory' },
  // { label: 'Purchase History', icon: ShoppingCart, route: '/dealer/purchase-history' },
  // { label: 'Sales Entry', icon: FileText, route: '/dealer/sales-entry' },
  { label: 'My Warranty Codes', icon: QrCode, route: '/dealer' },
  { label: 'Warranty Registration', icon: ShieldCheck, route: '/dealer/register' },
  { label: 'Warranty Approvals', icon: ClipboardCheck, route: '/dealer/approvals' },
  { label: 'Customer Warranties', icon: Users, route: '/dealer/claims' },
  { label: 'Warranty Claims', icon: AlertTriangle, route: '/dealer/warranty-claims' },
  // { label: 'Payments & Ledger', icon: CreditCard, route: '/dealer/payments' },
  { label: 'Reports', icon: BarChart3, route: '/dealer/reports' },
  { label: 'Business Profile', icon: Building2, route: '/dealer/business-profile' },
];

const bottomItems = [
  { label: 'Edit Profile', icon: Pencil, route: '/dealer/edit-profile' },
  { label: 'Change Password', icon: KeyRound, route: '/dealer/change-password' },
];

export function DealerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useNotificationCount();
  const [dealerName, setDealerName] = useState('Dealer');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const goToDealerHome = () => navigate('/dealer');

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.fullname) setDealerName(user.fullname);
      else if (user?.name) setDealerName(user.name);
    } catch {}
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const currentPath = location.pathname;

  const isActive = (route) => {
    if (route === '/dealer') return currentPath === '/dealer' || currentPath === '/dealer/';
    return currentPath.startsWith(route);
  };

  const handleLogout = () => {
    const to = logoutAndGetRedirect();
    navigate(to, { replace: true });
  };

  const renderNav = (items, collapsed, onNav) => (
    items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.route);
      return (
        <button
          key={item.label}
          onClick={() => { onNav?.(); navigate(item.route); }}
          title={collapsed ? item.label : undefined}
          className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg transition-colors ${
            active ? 'bg-[#166EA8] text-white' : 'text-white/85 hover:bg-[#166EA8] hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">{item.label}</span>}
        </button>
      );
    })
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-screen">
        <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 flex-col bg-[#1A7FC1] border-r border-[#166EA8] text-white transition-all duration-300`}>
          <div className={`h-16 ${sidebarCollapsed ? 'px-2' : 'px-4'} flex items-center border-b border-[#166EA8] justify-between`}>
            {!sidebarCollapsed && (
              <button
                type="button"
                className="flex items-center gap-2.5 cursor-pointer select-none"
                title="Go to Dealer dashboard"
                aria-label="Go to Dealer dashboard"
                onClick={goToDealerHome}
              >
                <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
                <span className="font-semibold text-lg">E-Warrantify</span>
              </button>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#166EA8] transition-colors mx-auto">
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
            {renderNav(sidebarItems, sidebarCollapsed)}
            {!sidebarCollapsed && <div className="border-t border-[#166EA8] my-2" />}
            {sidebarCollapsed && <div className="my-2" />}
            {renderNav(bottomItems, sidebarCollapsed)}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-3 border-t border-[#166EA8]">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/85 hover:bg-red-500/20 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" /><span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </aside>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#1A7FC1] text-white flex flex-col shadow-xl">
              <div className="h-16 px-5 flex items-center border-b border-[#166EA8] justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                  title="Go to Dealer dashboard"
                  aria-label="Go to Dealer dashboard"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    goToDealerHome();
                  }}
                >
                  <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
                  <span className="font-semibold text-lg">E-Warrantify</span>
                </button>
                <button onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>
              <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
                {renderNav(sidebarItems, false, () => setMobileMenuOpen(false))}
                <div className="border-t border-[#166EA8] my-2" />
                {renderNav(bottomItems, false, () => setMobileMenuOpen(false))}
              </nav>
              <div className="p-3 border-t border-[#166EA8]">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/85 hover:bg-red-500/20 hover:text-white transition-colors">
                  <LogOut className="w-4 h-4" /><span className="text-sm">Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          <header className="h-16 px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center hover:bg-slate-100">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-base lg:text-lg font-semibold text-slate-900">Welcome, {dealerName}</h1>
              <span className="hidden md:inline text-sm text-slate-500">Dealer Console</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dealer/notifications')} className="relative w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
                <BellRing className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-semibold flex items-center justify-center z-10"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => navigate('/dealer/business-profile')} className="w-10 h-10 rounded-full bg-slate-100 text-[#1A7FC1] flex items-center justify-center hover:bg-slate-200 transition-colors">
                <UserCircle className="w-4 h-4" />
              </button>
            </div>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

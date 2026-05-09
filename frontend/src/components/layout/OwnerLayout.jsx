import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import {
  ShieldCheck,
  BarChart3,
  Store,
  Users,
  Settings,
  LayoutDashboard,
  FileText,
  BellRing,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  UserCircle,
  Wrench,
  Wallet,
  CreditCard,
  Box,
  Ticket,
  Coins,
  LogOut,
} from 'lucide-react';
import { getUserDetails } from '../../services/userService';
import { logoutAndGetRedirect } from '../../services/authorizationService';
import CoinBalance from '../coins/CoinBalance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const FULL_SIDEBAR_CONFIG = [
  { type: 'link', label: 'Overview', icon: LayoutDashboard, route: '/owner' },
  // {
  //   type: 'group', label: 'Warranty Mgmt', icon: ShieldCheck, children: [
  //     { label: 'Warranty Registry', icon: FileText, route: '/owner/warranty-registry' },
  //     { label: 'Claims Management', icon: Wrench, route: '/owner/claims-management' },
  //   ],
  // },
  // {
  //   type: 'group', label: 'Finance', icon: Wallet, children: [
  //     { label: 'Dealer Ledger', icon: Wallet, route: '/owner/dealer-ledger' },
  //     { label: 'Payment Records', icon: CreditCard, route: '/owner/payment-records' },
  //   ],
  // },
  {
    type: 'group', label: 'Products & Warranty', icon: Box, children: [
      { label: 'Create Product', icon: Box, route: '/owner/warranty-setup' },
      { label: 'Products List', icon: ShieldCheck, route: '/owner/warranty-management' },
    ], 
  },
  { type: 'divider' },
  { type: 'link', label: 'My Wallet', icon: Wallet, route: '/owner/wallet' },
  { type: 'link', label: 'Dealers', icon: Store, route: '/owner/dealer-management' },
  { type: 'link', label: 'Staff', icon: Users, route: '/owner/staff' },
  { type: 'link', label: 'Service Centers', icon: Wrench, route: '/owner/service-centers' },
  { type: 'link', label: 'View All Customers', icon: Users, route: '/owner/customers' },
  { type: 'link', label: 'Support Tickets', icon: Ticket, route: '/owner/support-tickets' },
  { type: 'link', label: 'Activity Logs', icon: ScrollText, route: '/owner/activity-logs' },
  { type: 'link', label: 'Reports & Analytics', icon: BarChart3, route: '/owner/analytics' },

  { type: 'link', label: 'System Settings', icon: Settings, route: '/owner/warranty-settings' },
];

function SidebarNav({ collapsed, onNavigate, config }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState({});
  const currentPath = location.pathname;

  const isActive = (route) => {
    if (route === '/owner') return currentPath === '/owner' || currentPath === '/owner/';
    return currentPath.startsWith(route);
  };

  const isGroupActive = (children) => children.some((c) => isActive(c.route));

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleClick = (route) => {
    navigate(route);
    if (onNavigate) onNavigate();
  };

  useEffect(() => {
    const autoOpen = {};
    config.forEach((item) => {
      if (item.type === 'group' && isGroupActive(item.children)) {
        autoOpen[item.label] = true;
      }
    });
    setOpenGroups((prev) => ({ ...prev, ...autoOpen }));
  }, [currentPath]);

  return (
    <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto hide-scrollbar">
      {config.map((item, idx) => {
        if (item.type === 'divider') {
          return <div key={`div-${idx}`} className="my-2 border-t border-[#166EA8]/50" />;
        }

        if (item.type === 'link') {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item.route)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-colors text-sm ${
                active ? 'bg-[#166EA8] text-white' : 'text-white/80 hover:bg-[#166EA8]/60 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        }

        if (item.type === 'group') {
          const Icon = item.icon;
          const groupActive = isGroupActive(item.children);
          const isOpen = openGroups[item.label] || false;

          if (collapsed) {
            return item.children.map((child) => {
              const CIcon = child.icon;
              const active = isActive(child.route);
              return (
                <button
                  key={child.label}
                  onClick={() => handleClick(child.route)}
                  title={child.label}
                  className={`w-full flex items-center justify-center px-2 py-2 rounded-lg transition-colors text-sm ${
                    active ? 'bg-[#166EA8] text-white' : 'text-white/80 hover:bg-[#166EA8]/60'
                  }`}
                >
                  <CIcon className="w-4 h-4" />
                </button>
              );
            });
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                  groupActive ? 'text-white' : 'text-white/70 hover:text-white/90'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="ml-4 pl-3 border-l border-[#166EA8]/40 space-y-0.5 mt-0.5">
                  {item.children.map((child) => {
                    const CIcon = child.icon;
                    const active = isActive(child.route);
                    return (
                      <button
                        key={child.label}
                        onClick={() => handleClick(child.route)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-sm ${
                          active ? 'bg-[#166EA8] text-white' : 'text-white/70 hover:bg-[#166EA8]/50 hover:text-white'
                        }`}
                      >
                        <CIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </nav>
  );
}

export function OwnerLayout() {
  const unreadCount = useNotificationCount();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const goToOwnerHome = () => navigate('/owner');

  useEffect(() => {
    getUserDetails().then((data) => setUser(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    const to = logoutAndGetRedirect();
    navigate(to, { replace: true });
  };

  // Reseller is an additional capability for an owner, not a restricted console.
  // Always show the full owner sidebar; reseller menu is just an extra page.
  const sidebarConfig = FULL_SIDEBAR_CONFIG;
  const consoleLabel = 'Owner Console';

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-[#0F4E78]">
      <div className="flex h-screen">
        <aside
          className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 flex-col bg-[#1A7FC1] border-r border-[#166EA8] text-white transition-all duration-300`}
        >
          <div className={`h-16 ${sidebarCollapsed ? 'px-2' : 'px-4'} flex items-center border-b border-[#166EA8] justify-between`}>
            {!sidebarCollapsed && (
              <button
                type="button"
                className="flex items-center gap-2.5 cursor-pointer select-none"
                title="Go to Owner dashboard"
                aria-label="Go to Owner dashboard"
                onClick={goToOwnerHome}
              >
                <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
                <span className="font-semibold text-lg">E-Warrantify</span>
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#166EA8] transition-colors mx-auto"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>  

          <SidebarNav collapsed={sidebarCollapsed} config={sidebarConfig} />

          {!sidebarCollapsed && (
            <div className="p-3 border-t border-[#166EA8]">
              <div className="rounded-xl bg-[#166EA8] border border-[#0F5F91] p-3">
                <p className="text-xs text-white/85">Need Help?</p>
                <button
                  // onClick={() => navigate('/owner/support-tickets')}
                  className="mt-2 w-full h-9 rounded-lg bg-[#1A7FC1] hover:bg-[#1470AB] text-white text-sm"
                >
                  Contact Support
                </button>
              </div>
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
                  title="Go to Owner dashboard"
                  aria-label="Go to Owner dashboard"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    goToOwnerHome();
                  }}
                >
                  <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
                  <span className="font-semibold text-lg">E-Warrantify</span>
                </button>
                <button onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileMenuOpen(false)} config={sidebarConfig} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          {user?.profile_completed === false && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-amber-800 font-medium">Your Profile setup is not completed. Please complete the Profile setup.</p>
              <button
                onClick={() => navigate('/owner/profile', { state: { email: user?.email, completeProfile: true } })}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
              >
                Complete Profile
              </button>
            </div>
          )}
          <header className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden min-h-[44px] min-w-[44px] shrink-0 rounded-lg flex items-center justify-center hover:bg-slate-100 -ml-1"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-sm sm:text-base lg:text-lg font-semibold truncate min-w-0" title={`Welcome back, ${user?.fullname || 'Owner'}`}>
                Welcome back, {user?.fullname || 'Owner'}
                
              </h1>
              <span className="hidden md:inline text-sm text-slate-500 shrink-0">{consoleLabel}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Coin Balance Display */}
              <CoinBalance />
              
              <button
                onClick={() => navigate('/owner/notifications')}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
              >
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 shrink-0 rounded-full border border-slate-200 bg-white pl-1 pr-2 py-1 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A7FC1]/30"
                    aria-label="Account menu"
                  >
                    <span className="flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-full bg-sky-50 text-[#1A7FC1]">
                      <UserCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[100]">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate('/owner/profile')}
                  >
                    <UserCircle className="w-4 h-4 mr-2 text-slate-500" />
                    My profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

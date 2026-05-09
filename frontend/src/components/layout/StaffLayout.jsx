import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, BarChart3, LayoutDashboard, FileCheck, Ticket,
  ClipboardCheck, BellRing, ChevronLeft, ChevronRight, Menu, X,
  UserCircle, KeyRound, Pencil, LogOut, QrCode, Store, UserPlus, Users,
  Settings,
} from 'lucide-react';
import { getUserDetails } from '../../services/userService';
import { getStaffProfile } from '../../services/staffService';
import { setStaffPermissionsFromProfile, hasSubModuleAccess, clearPermissionCache, MODULE_IDS, SUB_MODULE_IDS } from '../../services/permissionService';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import Cookies from 'js-cookie';
import { logoutAndGetRedirect } from '../../services/authorizationService';

const ROLE_SIDEBAR_ITEMS = [
  // { label: 'Dashboard', icon: LayoutDashboard, route: '/staff', roles: 'all' },
  { label: 'Warranty Verification', icon: FileCheck, route: '/staff/warranty-claims', roles: ['Staff', 'Superviser', 'ClaimsManager', 'Manager', 'Admin'] },
  { label: 'Claim Management', icon: ClipboardCheck, route: '/staff/claim-management', roles: ['Staff', 'Superviser', 'ClaimsManager', 'Manager', 'Admin'] },
  { label: 'Support Tickets', icon: Ticket, route: '/staff/support-tickets', roles: ['Support', 'Manager', 'Admin', 'Superviser'] },
  { label: 'Warranty Lookup', icon: ShieldCheck, route: '/staff/verify', roles: ['Staff', 'Superviser', 'ClaimsManager', 'Manager', 'Admin'] },
  { label: 'Reports', icon: BarChart3, route: '/staff/reports', roles: ['Manager', 'Admin', 'RegionalManager'] },
  { label: 'Edit Profile', icon: Pencil, route: '/staff/edit-profile', roles: 'all' },
  { label: 'Change Password', icon: KeyRound, route: '/staff/change-password', roles: 'all' },
];

const ABILITY_SIDEBAR_ITEMS = [
  { label: 'Generate QR Codes', icon: QrCode, route: '/staff/generate-qr', subModuleId: SUB_MODULE_IDS.CODE_GENERATION },
  { label: 'Warranty Settings', icon: Settings, route: '/staff/warranty-settings', subModuleId: SUB_MODULE_IDS.WARRANTY_SETTINGS },
  { label: 'Dealers', icon: Store, route: '/staff/dealers', subModuleId: SUB_MODULE_IDS.DEALERS },
  { label: 'Warranty Registration', icon: UserPlus, route: '/staff/register', subModuleId: SUB_MODULE_IDS.REGISTRATION },
  { label: 'Active Customers', icon: Users, route: '/staff/customers', subModuleId: SUB_MODULE_IDS.ACTIVE_CUSTOMERS },
];

export function StaffLayout() {
  const unreadCount = useNotificationCount();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const goToStaffHome = () => navigate('/staff');

  useEffect(() => {
    getUserDetails().then((data) => setUser(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const isStaff = stored?.user_type === 'staff' || stored?.role === 'staff';
      if (!isStaff) {
        setPermissionsLoaded(true);
        return;
      }
      getStaffProfile()
        .then((res) => {
          const staff = res?.data;
          if (staff?.id && Array.isArray(staff?.StaffRolePermission)) {
            setStaffPermissionsFromProfile(staff.id, staff);
          }
        })
        .catch(() => {})
        .finally(() => setPermissionsLoaded(true));
    } catch {
      setPermissionsLoaded(true);
    }
  }, []);

  const staffRoleType = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.role_type || 'Staff';
    } catch { return 'Staff'; }
  }, []);

  const sidebarItems = useMemo(() => {
    const roleItems = ROLE_SIDEBAR_ITEMS.filter((item) => {
      if (item.roles === 'all') return true;
      return item.roles.includes(staffRoleType);
    });
    if (!permissionsLoaded) return roleItems;
    const abilityItems = ABILITY_SIDEBAR_ITEMS.filter((item) =>
      hasSubModuleAccess(item.subModuleId, MODULE_IDS.E_WARRANTY)
    );
    return [...roleItems, ...abilityItems];
  }, [staffRoleType, permissionsLoaded]);

  const currentPath = location.pathname;
  const isActive = (route) => {
    if (route === '/staff') return currentPath === '/staff' || currentPath === '/staff/';
    return currentPath.startsWith(route);
  };

  const handleLogout = () => {
    clearPermissionCache();
    // Use central logout so redirect is role-aware
    const to = logoutAndGetRedirect();
    navigate(to, { replace: true });
  };

  const roleLabel = {
    Admin: 'Administrator', Manager: 'Manager', ClaimsManager: 'Claims Manager',
    Finance: 'Finance Staff', RegionalManager: 'Regional Manager', Support: 'Support Executive',
    Superviser: 'Supervisor', Staff: 'Claims Executive',
  };

  const renderSidebar = (isMobile) => (
    <>
      <div className={`h-16 ${sidebarCollapsed && !isMobile ? 'px-2' : 'px-4'} flex items-center border-b border-[#166EA8] justify-between`}>
        {(!sidebarCollapsed || isMobile) && (
          <button
            type="button"
            className="flex items-center gap-2.5 cursor-pointer select-none"
            title="Go to Staff dashboard"
            aria-label="Go to Staff dashboard"
            onClick={() => {
              if (isMobile) setMobileMenuOpen(false);
              goToStaffHome();
            }}
          >
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
            <span className="font-semibold text-lg">E-Warrantify</span>
          </button>
        )}
        {isMobile ? (
          <button onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
        ) : (
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#166EA8] transition-colors mx-auto">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {(!sidebarCollapsed || isMobile) && (
        <div className="px-3 py-3 border-b border-[#166EA8]">
          <p className="text-xs text-white/60 uppercase tracking-wider">Logged in as</p>
          <p className="text-sm font-medium text-white mt-0.5">{roleLabel[staffRoleType] || staffRoleType}</p>
        </div>
      )}

      <nav className="p-2 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <button key={item.label}
              onClick={() => { navigate(item.route); if (isMobile) setMobileMenuOpen(false); }}
              title={sidebarCollapsed && !isMobile ? item.label : undefined}
              className={`w-full flex items-center gap-3 ${sidebarCollapsed && !isMobile ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg transition-colors ${active ? 'bg-[#166EA8] text-white' : 'text-white/85 hover:bg-[#166EA8] hover:text-white'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {(!sidebarCollapsed || isMobile) && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-[#166EA8]">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/85 hover:bg-red-500/20 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" />
          {(!sidebarCollapsed || isMobile) && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-screen">
        <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 flex-col bg-[#1A7FC1] border-r border-[#166EA8] text-white transition-all duration-300`}>
          {renderSidebar(false)}
        </aside>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#1A7FC1] text-white flex flex-col shadow-xl">
              {renderSidebar(true)}
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="h-16 px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center hover:bg-slate-100">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-base lg:text-lg font-semibold text-slate-900">Welcome, {user?.fullname || 'Staff'}</h1>
              <span className="hidden md:inline px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1A7FC1]/10 text-[#1A7FC1]">
                {roleLabel[staffRoleType] || staffRoleType}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/staff/notifications')} className="relative w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
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
              <button onClick={() => navigate('/staff/edit-profile')} className="w-10 h-10 rounded-full bg-slate-100 text-[#1A7FC1] flex items-center justify-center hover:bg-slate-200 transition-colors">
                <UserCircle className="w-4 h-4" />
              </button>
            </div>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Store,
  Coins,
  ScrollText,
  FileCode,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCircle,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  KeyRound,
  Shield,
} from "lucide-react";
import { logoutAndGetRedirect } from "../../services/authorizationService";
import { globalSearch, getNotifications } from "../../services/superAdminService";
import { getReadNotificationIds, addReadNotificationIds } from "../../utils/notificationStorage";

const sidebarGroups = [
  { label: "Dashboard", items: [{ label: "Dashboard", icon: LayoutDashboard, route: "/super-admin" }] },
  {
    label: "Platform Management",
    items: [
      { label: "Providers", icon: Store, route: "/super-admin/providers" },
      { label: "Warranty Codes", icon: FileCode, route: "/super-admin/warranty-codes" },
      { label: "Registered Warranties", icon: Shield, route: "/super-admin/warranty-registrations" },
    ],
  },
  {
    label: "Pricing",
    items: [{ label: "Global Coin Pricing", icon: Coins, route: "/super-admin/coin-pricing" }],
  },
  {
    label: "Monitoring",
    items: [{ label: "Activity Logs", icon: ScrollText, route: "/super-admin/activity-logs" }],
  },
];

function SidebarNav({ collapsed, onNavigate }) {
  const pathname = window.location.pathname;

  const isActive = (route) => {
    if (route === "/super-admin") return pathname === "/super-admin" || pathname === "/super-admin/";
    return pathname.startsWith(route);
  };

  const handleClick = (route) => {
    if (onNavigate) onNavigate(route);
  };

  return (
    <nav className="p-2 space-y-3 flex-1 overflow-y-auto hide-scrollbar">
      {sidebarGroups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="px-3 py-1.5 text-xs font-medium text-white/60 uppercase tracking-wider">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.route);
              return (
                <button
                  key={item.route}
                  onClick={() => handleClick(item.route)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 ${collapsed ? "justify-center px-2" : "px-3"} py-2 rounded-lg transition-colors text-sm ${
                    active ? "bg-[#166EA8] text-white" : "text-white/80 hover:bg-[#166EA8]/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function SuperAdminLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const goToSuperAdminHome = () => navigate("/super-admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => new Set(getReadNotificationIds()));
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    const to = logoutAndGetRedirect();
    navigate(to, { replace: true });
  };

  const handleNav = (route) => {
    navigate(route);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      setSearchLoading(false);
      setSearchError(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(false);
      try {
        const res = await globalSearch(searchQuery);
        setSearchResults(res || { providers: [], dealers: [], staff: [], customers: [], warrantyCodes: [], claims: [] });
        setSearchOpen(true);
      } catch {
        setSearchError(true);
        setSearchResults({ providers: [], dealers: [], staff: [], customers: [], warrantyCodes: [], claims: [] });
        setSearchOpen(true);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // Fetch notifications on mount for badge
  useEffect(() => {
    setNotificationsLoading(true);
    getNotifications()
      .then((res) => {
        const list = res?.notifications ?? [];
        setNotifications(list);
        setReadIds(new Set(getReadNotificationIds()));
      })
      .catch(() => setNotifications([]))
      .finally(() => setNotificationsLoading(false));
  }, []);

  // When dropdown opens: refetch for latest, then mark all as read
  useEffect(() => {
    if (notificationsOpen) {
      setNotificationsLoading(true);
      getNotifications()
        .then((res) => {
          const list = res?.notifications ?? [];
          setNotifications(list);
          if (list.length > 0) {
            const ids = list.map((n) => n.id);
            addReadNotificationIds(ids);
            setReadIds((prev) => new Set([...prev, ...ids]));
          }
        })
        .catch(() => {})
        .finally(() => setNotificationsLoading(false));
    }
  }, [notificationsOpen]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const handleSearchSelect = (type, item) => {
    if (type === "providers" && item?.id) navigate(`/super-admin/providers/${item.id}/detail`);
    else if ((type === "dealers" || type === "staff") && item?.provider_id) navigate(`/super-admin/providers/${item.provider_id}/detail`);
    else if (type === "warrantyCodes" || type === "customers" || type === "claims") navigate("/super-admin/warranty-codes");
    setSearchQuery("");
    setSearchResults(null);
    setSearchOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-[#0F4E78]">
      <div className="flex h-screen">
        <aside
          className={`hidden lg:flex ${sidebarCollapsed ? "w-16" : "w-64"} shrink-0 flex-col bg-[#1A7FC1] border-r border-[#166EA8] text-white transition-all duration-300`}
        >
          <div
            className={`h-16 ${sidebarCollapsed ? "px-2" : "px-4"} flex items-center border-b border-[#166EA8] justify-between`}
          >
            {!sidebarCollapsed && (
              <button
                type="button"
                className="flex items-center gap-2.5 cursor-pointer select-none"
                title="Go to Super Admin dashboard"
                aria-label="Go to Super Admin dashboard"
                onClick={goToSuperAdminHome}
              >
                <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
                <span className="font-semibold text-lg">Super Admin</span>
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#166EA8] transition-colors mx-auto"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <SidebarNav collapsed={sidebarCollapsed} onNavigate={navigate} />
        </aside>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#1A7FC1] text-white flex flex-col shadow-xl">
              <div className="h-16 px-5 flex items-center border-b border-[#166EA8] justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                  title="Go to Super Admin dashboard"
                  aria-label="Go to Super Admin dashboard"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    goToSuperAdminHome();
                  }}
                >
                  <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
                  <span className="font-semibold text-lg">Super Admin</span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarNav onNavigate={handleNav} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          <header className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden min-h-[44px] min-w-[44px] shrink-0 rounded-lg flex items-center justify-center hover:bg-slate-100 -ml-1"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div ref={searchRef} className="hidden sm:block relative flex-1 max-w-md min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search providers, dealers, warranties..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1] text-sm"
                  />
                </div>
                {searchOpen && (searchResults || searchLoading || searchError) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchLoading && (
                      <p className="p-4 text-sm text-slate-500 flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-[#1A7FC1] border-t-transparent rounded-full animate-spin" />
                        Searching...
                      </p>
                    )}
                    {searchError && !searchLoading && (
                      <p className="p-4 text-sm text-red-600">Search failed. Please try again.</p>
                    )}
                    {!searchLoading && !searchError && searchResults && [
                      ["providers", searchResults.providers, "Providers"],
                      ["dealers", searchResults.dealers, "Dealers"],
                      ["staff", searchResults.staff, "Staff"],
                      ["customers", searchResults.customers, "Customers"],
                      ["warrantyCodes", searchResults.warrantyCodes, "Warranty Codes"],
                      ["claims", searchResults.claims, "Claims"],
                    ].map(([key, list, label]) =>
                      list?.length ? (
                        <div key={key} className="p-2 border-b border-slate-100 last:border-0">
                          <p className="text-xs font-medium text-slate-500 px-2 py-1">{label}</p>
                            {list.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSearchSelect(key, item)}
                              className="w-full text-left px-2 py-2 hover:bg-slate-50 rounded text-sm truncate"
                            >
                              {item.business_name || item.company_name || item.name || item.warranty_code || item.customer_name || item.email || (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}`.trim() : item.first_name) || item.id}
                            </button>
                          ))}
                        </div>
                      ) : null
                    )}
                    {!searchLoading && !searchError && searchResults && !searchResults?.providers?.length &&
                      !searchResults?.dealers?.length &&
                      !searchResults?.staff?.length &&
                      !searchResults?.customers?.length &&
                      !searchResults?.warrantyCodes?.length &&
                      !searchResults?.claims?.length && (
                        <p className="p-4 text-sm text-slate-500">No results found</p>
                      )}
                  </div>
                )}
              </div>
            </div>
            <div ref={notificationsRef} className="relative flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 max-h-96 bg-white rounded-lg border border-slate-200 shadow-lg z-50 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-700">
                    Notifications
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {notificationsLoading ? (
                      <p className="p-4 text-sm text-slate-500">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.provider_id) navigate(`/super-admin/providers/${n.provider_id}/detail`);
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-medium text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-500 truncate">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(n.timestamp).toLocaleString()}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1A7FC1]/10 text-[#1A7FC1] flex items-center justify-center shrink-0">
                    <UserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-50 py-1">
                    <button
                      onClick={() => { navigate("/super-admin"); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <UserCircle className="w-4 h-4" /> My Profile
                    </button>
                    <button
                      onClick={() => { navigate("/super-admin/change-password"); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <KeyRound className="w-4 h-4" /> Change Password
                    </button>
                    <button
                      onClick={() => { navigate("/super-admin/activity-logs"); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <Shield className="w-4 h-4" /> Login Activity
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
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

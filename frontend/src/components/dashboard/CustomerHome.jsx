import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Bell, BellRing, Package, AlertCircle, MessageCircle, X, Search,
  LayoutDashboard, CircleHelp, Plus, LogOut, ChevronRight, Menu, FileText,
  Clock, CheckCircle, Send, Loader2, ChevronDown,
} from 'lucide-react';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import { Button } from '../ui/button';
import { UserIcon } from '../common/UserIcon';
import { toast } from 'sonner';
import { getUserDetails } from '../../services/userService';
import api from '../../utils/api';
import Cookies from 'js-cookie';
import { FileClaimModal } from '../customer/FileClaimModal';
import { logoutAndGetRedirect } from '../../services/authorizationService';

const ISSUE_CATEGORIES = [
  'Product Defect',
  'Not Working',
  'Missing Parts',
  'Warranty Claim',
  'Installation Issue',
  'General Question',
  'Other',
];

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'register', label: 'Register Product', icon: Plus },
  { key: 'support', label: 'Support', icon: CircleHelp },
  { key: 'profile', label: 'Profile', icon: UserIcon },
];

export function CustomerHome() {
  const navigate = useNavigate();
  const unreadCount = useNotificationCount();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [warranties, setWarranties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const goToCustomerHome = () => navigate('/home');

  // Support modal state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportCategory, setSupportCategory] = useState('');
  const [supportWarrantyId, setSupportWarrantyId] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);

  // Support requests state
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showTickets, setShowTickets] = useState(false);

  // File claim modal
  const [fileClaimWarranty, setFileClaimWarranty] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getUserDetails(),
        api.get('/e-warranty/warranty-customer/my-warranties'),
      ]);

      if (results[0].status === 'fulfilled') {
        setUser(results[0].value);
      } else {
        console.warn('Error fetching user:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        const responseData = results[1].value?.data?.data;
        const warrantyData = responseData?.warranties || responseData || [];
        setWarranties(Array.isArray(warrantyData) ? warrantyData : []);
      } else {
        console.warn('Error fetching warranties:', results[1].reason);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchSupportTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await api.get('/customer/my-support-tickets');
      const data = res.data?.data?.tickets || [];
      setSupportTickets(Array.isArray(data) ? data : []);
    } catch {
      console.warn('Could not fetch support tickets');
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSupportTickets(); }, [fetchSupportTickets]);

  const activeWarranties = warranties.filter(w => {
    if (!w.expiry_date) return true;
    return new Date(w.expiry_date) > new Date();
  }).length;

  const expiringSoon = warranties.filter(w => {
    if (!w.expiry_date) return false;
    const endDate = new Date(w.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate > new Date() && endDate <= thirtyDaysFromNow;
  }).length;

  const expiredCount = warranties.filter(w => {
    if (!w.expiry_date) return false;
    return new Date(w.expiry_date) <= new Date();
  }).length;

  const totalClaims = warranties.reduce((sum, w) => sum + (w.claims?.length || 0), 0);

  const getWarrantyStatus = (warranty) => {
    // Use the status from backend which considers warranty_code_status
    if (warranty.status) return warranty.status;
    // Fallback logic if status not provided (uses expiry date only)
    if (!warranty.expiry_date) return 'active';
    const endDate = new Date(warranty.expiry_date);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    if (endDate < now) return 'expired';
    if (endDate <= thirtyDaysFromNow) return 'expiring';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expiring': return 'bg-amber-100 text-amber-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-200 text-slate-600';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expiring': return 'Expiring Soon';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      case 'pending': return 'Pending Approval';
      default: return status;
    }
  };

  const getClaimStatusLabel = (status) => {
    switch (status) {
      case 'Submitted': return 'Submitted';
      case 'Approved': return 'Approved';
      case 'AssignedToServiceCenter': return 'Assigned to service center';
      case 'InProgress': return 'In repair';
      case 'Repaired': return 'Repaired';
      case 'Replaced': return 'Replaced';
      case 'Closed': return 'Closed';
      case 'Rejected': return 'Rejected';
      default: return status || 'Submitted';
    }
  };

  const getClaimStatusColor = (status) => {
    switch (status) {
      case 'Approved':
      case 'AssignedToServiceCenter':
      case 'InProgress':
      case 'Repaired':
      case 'Replaced': return 'bg-blue-50 text-blue-700';
      case 'Closed': return 'bg-green-50 text-green-700';
      case 'Rejected': return 'bg-red-50 text-red-700';
      case 'Submitted': default: return 'bg-amber-50 text-amber-700';
    }
  };

  const filteredWarranties = warranties.filter((warranty) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const product = (warranty.product_name || '').toLowerCase();
    const code = (warranty.warranty_code || warranty.roll_code || '').toLowerCase();
    const dealer = (warranty.dealer_name || '').toLowerCase();
    return product.includes(query) || code.includes(query) || dealer.includes(query);
  });

  const openSupportModal = () => {
    setSupportCategory('');
    setSupportWarrantyId('');
    setSupportMessage('');
    setShowSupportModal(true);
  };

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim()) { toast.error('Please describe your issue'); return; }

    const providerIdFromWarranty = warranties.find(w => w.provider_id)?.provider_id;
    if (!providerIdFromWarranty) {
      toast.error('No provider found. Please register a product first.');
      return;
    }

    const selectedWarranty = warranties.find(w => w.id === supportWarrantyId);

    setSendingSupport(true);
    try {
      await api.post('/customer/support-tickets', {
        provider_id: providerIdFromWarranty,
        category: supportCategory || 'General Question',
        warranty_code: selectedWarranty?.warranty_code || '',
        product_name: selectedWarranty?.product_name || '',
        message: supportMessage.trim(),
      });
      toast.success('Support request submitted! We\'ll get back to you soon.');
      setShowSupportModal(false);
      fetchSupportTickets();
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSendingSupport(false);
    }
  };

  const handleLogout = () => {
    const to = logoutAndGetRedirect();
    navigate(to, { replace: true });
    toast.success('Logged out successfully');
  };

  const handleNavClick = (key) => {
    setActiveNav(key);
    setMobileMenuOpen(false);
    switch (key) {
      case 'dashboard': break;
      case 'register': navigate('/customer-register'); break;
      case 'support': openSupportModal(); break;
      case 'profile': navigate('/profile'); break;
      default: break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1] mx-auto" />
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Unable to load user data</p>
          <button onClick={() => navigate('/customer-auth')} className="px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8]">
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  const userPhone = user?.phone_number && !user.phone_number.startsWith('temp_') ? user.phone_number : '';
  const userEmail = user?.email || '';

  return (
    <div className="h-screen overflow-hidden bg-slate-100 flex flex-col">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar - fixed, scrolls independently if nav overflows */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full overflow-y-auto bg-gradient-to-b from-[#0F4E78] via-[#1A7FC1] to-[#1A6FA8] text-white shadow-xl">
          <button
            type="button"
            className="h-16 px-5 flex items-center gap-2.5 border-b border-white/15 cursor-pointer select-none text-left"
            title="Go to Customer dashboard"
            aria-label="Go to Customer dashboard"
            onClick={goToCustomerHome}
          >
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-9 w-auto shrink-0" />
            <span className="font-semibold text-xl text-white">E-Warrantify</span>
          </button>
          <nav className="p-3 space-y-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeNav === item.key ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/15">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-red-500/20 hover:text-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto pb-20 lg:pb-0">
          {/* Header */}
          <header className="h-16 px-4 lg:px-6 bg-gradient-to-r from-[#0F4E78] to-[#1A7FC1] text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold tracking-tight">My Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/notifications')} className="relative w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center shrink-0" title="Notifications">
                <BellRing className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-[#0F4E78] text-white text-[10px] font-semibold flex items-center justify-center z-10"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={handleLogout} className="hidden lg:flex w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 items-center justify-center transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center" title="Profile">
                <UserIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 shadow-md">
              <div className="p-2 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <button key={item.key} onClick={() => handleNavClick(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeNav === item.key ? 'bg-[#1A7FC1]/10 text-[#1A7FC1] font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <item.icon className="w-4 h-4" /><span>{item.label}</span>
                  </button>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /><span>Logout</span>
                </button>
              </div>
            </div>
          )}

          <div className="p-4 lg:p-6 space-y-5">
            {user?.profile_completed === false && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-amber-800 font-medium">Your Profile setup is not completed. Please complete the Profile setup.</p>
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            )}

            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullname || 'Customer'}!</h2>
                <p className="text-slate-500 text-sm mt-0.5">Manage your product warranties and stay protected.</p>
              </div>
              <Button onClick={() => navigate('/customer-register')} className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-10 px-5 rounded-lg shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Register Product
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Active Warranties', value: activeWarranties, sub: `of ${warranties.length} total`, icon: ShieldCheck, color: 'bg-[#1A7FC1]/10 text-[#1A7FC1]' },
                { label: 'Expiring Soon', value: expiringSoon, sub: 'within 30 days', icon: Bell, color: 'bg-amber-100 text-amber-700' },
                { label: 'Expired', value: expiredCount, sub: 'needs renewal', icon: AlertCircle, color: 'bg-red-50 text-red-600' },
                { label: 'Claims Filed', value: totalClaims, sub: 'all time', icon: FileText, color: 'bg-purple-50 text-purple-600' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                    <s.icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-slate-600 text-xs font-medium">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Expiring soon alert */}
            {expiringSoon > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-amber-800 text-sm">
                  <span className="font-semibold">{expiringSoon} {expiringSoon === 1 ? 'warranty' : 'warranties'}</span> expiring in the next 30 days.
                </p>
              </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by product, warranty code, or dealer..."
                  className="w-full h-10 rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1] transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Warranties list */}
              <div className="xl:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">My Warranties</h3>
                  {warranties.length > 0 && (
                    <span className="text-xs text-slate-400">{filteredWarranties.length} product{filteredWarranties.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="space-y-3">
                  {filteredWarranties.length === 0 ? (
                    <div className="text-center py-10">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">{warranties.length === 0 ? 'No warranties registered yet' : 'No warranties match your search'}</p>
                      {warranties.length === 0 && (
                        <button onClick={() => navigate('/customer-register')} className="mt-3 text-[#1A7FC1] hover:text-[#166EA8] text-sm font-medium">
                          Register your first product →
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredWarranties.slice(0, 10).map((warranty) => {
                      const status = getWarrantyStatus(warranty);
                      return (
                        <div key={warranty.id || warranty.warranty_code} className="border border-slate-200 rounded-xl p-4 hover:border-[#1A7FC1]/40 hover:shadow-sm transition-all group">
                          <button
                            onClick={() => navigate('/certificate', { state: { warranty } })}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between mb-2.5">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-slate-900 group-hover:text-[#1A7FC1] transition-colors truncate">{warranty.product_name || 'Product'}</h4>
                                <p className="text-slate-400 text-xs mt-0.5 font-mono">{warranty.warranty_code || warranty.roll_code || 'N/A'}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
                                  {status === 'active' ? <ShieldCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                  {getStatusLabel(status)}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1A7FC1] transition-colors" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-slate-400">Purchased</p>
                                <p className="text-slate-700 font-medium">{warranty.purchase_date ? new Date(warranty.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Valid Until</p>
                                <p className={`font-medium ${status === 'expired' ? 'text-red-600' : status === 'expiring' ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {warranty.expiry_date ? new Date(warranty.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </p>
                              </div>
                              {warranty.dealer_name && (
                                <div className="hidden sm:block">
                                  <p className="text-slate-400">Dealer</p>
                                  <p className="text-slate-700 font-medium truncate">{warranty.dealer_name}</p>
                                </div>
                              )}
                            </div>
                            {warranty.dealer_name && (
                              <div className="sm:hidden mt-2 pt-2 border-t border-slate-100">
                                <p className="text-slate-400 text-xs">Dealer: <span className="text-slate-700 font-medium">{warranty.dealer_name}</span></p>
                              </div>
                            )}
                            {warranty.claims?.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <p className="text-slate-400 text-xs mb-1">Latest claim</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getClaimStatusColor(warranty.claims[0].status)}`}>
                                  <Clock className="w-3 h-3" />
                                  {getClaimStatusLabel(warranty.claims[0].status)}
                                  {warranty.claims[0].assigned_service_center?.name && (
                                    <span className="text-slate-500"> at {warranty.claims[0].assigned_service_center.name}</span>
                                  )}
                                </span>
                                {warranty.claims[0].status === 'Rejected' && warranty.claims[0].rejection_reason && (
                                  <p className="text-red-600 text-xs mt-1.5">Reason: {warranty.claims[0].rejection_reason}</p>
                                )}
                              </div>
                            )}
                          </button>
                          {(status === 'active' || status === 'expiring') && (
                            <button
                              onClick={() => setFileClaimWarranty(warranty)}
                              className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Having issues? File a claim
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Sidebar cards */}
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button onClick={() => navigate('/customer-register')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 bg-slate-50 hover:bg-[#1A7FC1]/10 hover:text-[#1A7FC1] transition-colors">
                      <Plus className="w-4 h-4" /><span>Register New Product</span><ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
                    </button>
                    <button onClick={() => navigate('/verify')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 bg-slate-50 hover:bg-[#1A7FC1]/10 hover:text-[#1A7FC1] transition-colors">
                      <ShieldCheck className="w-4 h-4" /><span>Verify Warranty</span><ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
                    </button>
                    <button onClick={openSupportModal} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 bg-slate-50 hover:bg-[#1A7FC1]/10 hover:text-[#1A7FC1] transition-colors">
                      <MessageCircle className="w-4 h-4" /><span>Contact Support</span><ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* My Support Requests */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <button onClick={() => setShowTickets(!showTickets)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[#1A7FC1]" />
                      <h3 className="text-sm font-semibold text-slate-900">My Support Requests</h3>
                      {supportTickets.length > 0 && (
                        <span className="text-xs bg-[#1A7FC1]/10 text-[#1A7FC1] font-medium px-1.5 py-0.5 rounded-full">{supportTickets.length}</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTickets ? 'rotate-180' : ''}`} />
                  </button>

                  {showTickets && (
                    <div className="border-t border-slate-100">
                      {ticketsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-[#1A7FC1]" />
                        </div>
                      ) : supportTickets.length === 0 ? (
                        <div className="text-center py-6 px-4">
                          <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-slate-400 text-xs">No support requests yet</p>
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                          {supportTickets.slice(0, 10).map((ticket) => (
                            <div key={ticket.id} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  {ticket.title && <p className="text-xs font-medium text-slate-800 mb-0.5">{ticket.title}</p>}
                                  <p className="text-xs text-slate-600 line-clamp-2">{ticket.message}</p>
                                </div>
                                {ticket.status === 'Resolved' ? (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> Resolved
                                  </span>
                                ) : ticket.status === 'OnGoing' ? (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" /> In Progress
                                  </span>
                                ) : ticket.status === 'OnHold' ? (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" /> On Hold
                                  </span>
                                ) : (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" /> New
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Help banner */}
                <div className="bg-gradient-to-br from-[#1A7FC1] to-[#0F4E78] rounded-xl p-5 shadow-md">
                  <h3 className="text-white font-semibold mb-1.5">Need Help?</h3>
                  <p className="text-white/80 mb-4 text-sm leading-relaxed">Questions about your warranty coverage? Our support team is here to help.</p>
                  <Button onClick={openSupportModal} className="w-full bg-white text-[#1A7FC1] hover:bg-white/90 h-10 rounded-lg font-medium">
                    <MessageCircle className="w-4 h-4 mr-2" /> Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { key: 'register', label: 'Register', icon: Plus },
            { key: 'support', label: 'Support', icon: CircleHelp },
            { key: 'profile', label: 'Profile', icon: UserIcon },
          ].map((item) => (
            <button key={item.key} onClick={() => handleNavClick(item.key)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-lg transition-colors ${activeNav === item.key ? 'text-[#1A7FC1]' : 'text-slate-400'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Support Request Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-900 font-semibold">Submit Support Request</h3>
                  <p className="text-slate-400 text-xs mt-0.5">We'll respond via email or phone</p>
                </div>
                <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {/* Contact info (read-only) */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Your Contact Details</p>
                {userPhone && <p className="text-sm text-slate-700">Phone: <span className="font-medium">{userPhone}</span></p>}
                {userEmail && <p className="text-sm text-slate-700">Email: <span className="font-medium">{userEmail}</span></p>}
                {!userPhone && !userEmail && <p className="text-sm text-slate-400">No contact info on file</p>}
              </div>

              {/* Product/Warranty selector */}
              {warranties.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Related Product</label>
                  <select value={supportWarrantyId} onChange={(e) => setSupportWarrantyId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]">
                    <option value="">General (no specific product)</option>
                    {warranties.map((w) => (
                      <option key={w.id} value={w.id}>{w.product_name || 'Product'} — {w.warranty_code || 'N/A'}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category selector */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Issue Category</label>
                <select value={supportCategory} onChange={(e) => setSupportCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]">
                  <option value="">Select a category</option>
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Describe Your Issue *</label>
                <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Please describe your issue in detail. Include model numbers, error messages, or any relevant information..."
                  className="w-full h-28 border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]" />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <Button onClick={handleSupportSubmit} disabled={sendingSupport || !supportMessage.trim()}
                className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-11 rounded-xl disabled:opacity-50">
                {sendingSupport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {sendingSupport ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File Claim Modal */}
      {fileClaimWarranty && (
        <FileClaimModal
          warranty={fileClaimWarranty}
          user={user}
          onClose={() => setFileClaimWarranty(null)}
          onSuccess={() => { setFileClaimWarranty(null); fetchData(); }}
        />
      )}
    </div>
  );
}

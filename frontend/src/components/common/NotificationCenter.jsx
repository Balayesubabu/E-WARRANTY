import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, CheckCheck, ShieldCheck, AlertCircle, Clock, Trash2, Loader2, MessageSquare, FileWarning } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { getWarrantyClaimStats } from '../../services/warrantyClaimService';
import { getServiceCenterClaims, getServiceCenterClaimStats } from '../../services/serviceCenterService';
import { addReadNotificationIds, addDismissedNotificationIds, getReadNotificationIds, getDismissedNotificationIds } from '../../utils/notificationStorage';

export function NotificationCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname || '';
  const backTarget = pathname.startsWith('/owner/') ? '/owner' : pathname.startsWith('/staff/') ? '/staff' : pathname.startsWith('/dealer/') ? '/dealer' : pathname.startsWith('/service-center/') ? '/service-center' : '/home';
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = storedUser?.user_type || storedUser?.role || '';

      if (userType === 'customer') {
        await fetchCustomerNotifications();
      } else if (userType === 'service_center') {
        await fetchServiceCenterNotifications();
      } else {
        // For owner/staff/dealer, generate notifications from their data
        await fetchProviderNotifications();
      }
    } catch (error) {
      console.warn('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerNotifications = async () => {
    try {
      const response = await api.get('/e-warranty/warranty-customer/my-warranties');
      const warranties = response?.data?.data?.warranties || [];

      const generatedNotifications = [];
      const now = new Date();

      warranties.forEach((w) => {
        const createdAt = w.created_at ? new Date(w.created_at) : null;
        const expiryDate = w.expiry_date ? new Date(w.expiry_date) : null;

        // Recently registered (within last 7 days)
        if (createdAt) {
          const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
          if (daysSinceCreation <= 7) {
            generatedNotifications.push({
              id: `reg-${w.id}`,
              type: 'registration',
              title: 'Warranty Registered',
              message: `Your warranty for ${w.product_name} (Code: ${w.warranty_code}) has been successfully registered.`,
              timestamp: createdAt.toISOString(),
              read: daysSinceCreation > 1,
            });
          }
        }

        // Expiring soon (within 30 days)
        if (w.status === 'expiring' && expiryDate) {
          const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          generatedNotifications.push({
            id: `exp-${w.id}`,
            type: 'expiry',
            title: 'Warranty Expiring Soon',
            message: `Your warranty for ${w.product_name} will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${expiryDate.toLocaleDateString()}).`,
            timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            read: false,
          });
        }

        // Already expired
        if (w.status === 'expired' && expiryDate) {
          generatedNotifications.push({
            id: `expired-${w.id}`,
            type: 'expired',
            title: 'Warranty Expired',
            message: `Your warranty for ${w.product_name} (Code: ${w.warranty_code}) has expired on ${expiryDate.toLocaleDateString()}.`,
            timestamp: expiryDate.toISOString(),
            read: true,
          });
        }

        // Active warranty confirmation
        if (w.status === 'active' && createdAt) {
          const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
          if (daysSinceCreation > 7) {
            generatedNotifications.push({
              id: `active-${w.id}`,
              type: 'approval',
              title: 'Warranty Active',
              message: `Your warranty for ${w.product_name} is active and valid${expiryDate ? ` until ${expiryDate.toLocaleDateString()}` : ''}.`,
              timestamp: createdAt.toISOString(),
              read: true,
            });
          }
        }

        // Claim status notifications
        (w.claims || []).forEach((c, idx) => {
          const claimRef = `WC-${(c.id || '').toString().substring(0, 8).toUpperCase()}`;
          const claimTimestamp = c.closed_at ? new Date(c.closed_at) : (c.created_at ? new Date(c.created_at) : now);

          if (c.status === 'AssignedToServiceCenter') {
            const scName = c.assigned_service_center?.name || 'authorized service center';
            generatedNotifications.push({
              id: `claim-assigned-${w.id}-${c.id}`,
              type: 'claim',
              title: 'Claim Sent for Repair',
              message: `Your claim (${claimRef}) for ${w.product_name} has been assigned to ${scName}. You can track progress in your dashboard.`,
              timestamp: claimTimestamp.toISOString(),
              read: false,
            });
          } else if (c.status === 'InProgress') {
            generatedNotifications.push({
              id: `claim-inprogress-${w.id}-${c.id}`,
              type: 'claim',
              title: 'Claim In Repair',
              message: `Your claim (${claimRef}) for ${w.product_name} is now being repaired.`,
              timestamp: claimTimestamp.toISOString(),
              read: false,
            });
          } else if (c.status === 'Closed' || c.status === 'Repaired' || c.status === 'Replaced') {
            generatedNotifications.push({
              id: `claim-resolved-${w.id}-${c.id}`,
              type: 'approval',
              title: 'Claim Resolved',
              message: `Your claim (${claimRef}) for ${w.product_name} has been resolved.`,
              timestamp: claimTimestamp.toISOString(),
              read: idx > 0,
            });
          } else if (c.status === 'Approved') {
            generatedNotifications.push({
              id: `claim-approved-${w.id}-${c.id}`,
              type: 'approval',
              title: 'Claim Approved',
              message: `Your claim (${claimRef}) for ${w.product_name} has been approved.`,
              timestamp: claimTimestamp.toISOString(),
              read: false,
            });
          }
        });
      });

      // Sort by timestamp (newest first)
      generatedNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // If no warranties at all, show a welcome notification
      if (warranties.length === 0) {
        generatedNotifications.push({
          id: 'welcome',
          type: 'system',
          title: 'Welcome to eWarranty!',
          message: 'Register your first product warranty to get started. You\'ll receive notifications about your warranty status here.',
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      // Apply stored read state and exclude dismissed (cleared) so they never show again
      const readIds = new Set(getReadNotificationIds());
      const dismissedIds = new Set(getDismissedNotificationIds());
      const merged = generatedNotifications
        .filter((n) => !dismissedIds.has(n.id))
        .map((n) => ({ ...n, read: n.read || readIds.has(n.id) }));
      setNotifications(merged);
    } catch (error) {
      console.warn('Error fetching customer warranties for notifications:', error);
      setNotifications([{
        id: 'error',
        type: 'system',
        title: 'Welcome to eWarranty!',
        message: 'Register your product warranties to receive notifications about their status.',
        timestamp: new Date().toISOString(),
        read: false,
      }]);
    }
  };

  const fetchServiceCenterNotifications = async () => {
    try {
      const [claimsRes, statsRes, contactRes] = await Promise.allSettled([
        getServiceCenterClaims(),
        getServiceCenterClaimStats(),
        api.get('/provider/contact-notifications'),
      ]);

      const claims = claimsRes.status === 'fulfilled'
        ? (Array.isArray(claimsRes.value?.data) ? claimsRes.value.data : [])
        : [];
      const stats = statsRes.status === 'fulfilled'
        ? (statsRes.value?.data ?? statsRes.value ?? {})
        : {};
      const contactNotifications = contactRes.status === 'fulfilled'
        ? (contactRes.value?.data?.data?.notifications || [])
        : [];

      const generatedNotifications = [];
      const now = new Date();

      // Build notifications from claims assigned to this service center
      (Array.isArray(claims) ? claims : []).forEach((c) => {
        const claimRef = `WC-${(c.id || '').toString().substring(0, 8).toUpperCase()}`;
        const productName = c.warranty_code_ref?.product_name || c.product_name || 'product';
        const createdAt = c.created_at ? new Date(c.created_at) : null;
        const timestamp = createdAt ? createdAt.toISOString() : now.toISOString();

        if (c.status === 'AssignedToServiceCenter') {
          generatedNotifications.push({
            id: `sc-claim-assigned-${c.id}`,
            type: 'claim',
            title: 'New Claim Assigned',
            message: `Claim ${claimRef} for ${productName} has been assigned to you.`,
            timestamp,
            read: false,
          });
        } else if (c.status === 'InProgress') {
          generatedNotifications.push({
            id: `sc-claim-progress-${c.id}`,
            type: 'claim',
            title: 'Claim In Progress',
            message: `Claim ${claimRef} for ${productName} is in progress.`,
            timestamp,
            read: false,
          });
        } else if (['Repaired', 'Replaced', 'Closed'].includes(c.status)) {
          generatedNotifications.push({
            id: `sc-claim-done-${c.id}`,
            type: 'approval',
            title: 'Claim Resolved',
            message: `Claim ${claimRef} for ${productName} has been ${c.status.toLowerCase()}.`,
            timestamp,
            read: true,
          });
        }
      });

      // Customer support requests (owner_only excluded by backend for service_center)
      contactNotifications.forEach((n) => {
        const createdAt = n.created_at ? new Date(n.created_at) : null;
        generatedNotifications.push({
          id: `contact-${n.id}`,
          type: 'contact',
          title: 'Customer Support Request',
          message: `${n.name || 'Customer'} (${n.contact_number || ''}) sent a message: "${n.message}"`,
          email: n.email,
          timestamp: createdAt ? createdAt.toISOString() : new Date().toISOString(),
          read: n.is_read || false,
        });
      });

      // Sort by timestamp (newest first)
      generatedNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const limited = generatedNotifications.slice(0, 30);

      if (limited.length === 0) {
        limited.push({
          id: 'no-activity',
          type: 'system',
          title: 'No Recent Activity',
          message: 'You will see notifications here when warranty claims are assigned to you.',
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      const readIds = new Set(getReadNotificationIds());
      const dismissedIds = new Set(getDismissedNotificationIds());
      const merged = limited
        .filter((n) => !dismissedIds.has(n.id))
        .map((n) => ({ ...n, read: n.read || readIds.has(n.id) }));
      setNotifications(merged);
    } catch (error) {
      console.warn('Error fetching service center notifications:', error);
      setNotifications([{
        id: 'welcome',
        type: 'system',
        title: 'Notifications',
        message: 'You will see notifications here when warranty claims are assigned to you.',
        timestamp: new Date().toISOString(),
        read: false,
      }]);
    }
  };

  const fetchProviderNotifications = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = storedUser?.user_type || storedUser?.role || '';

      // Fetch registered customers, contact support, and (for owner) claim stats in parallel
      const fetches = [
        api.get('/e-warranty/warranty-customer/get-registered-customers'),
        api.get('/provider/contact-notifications'),
      ];
      if (userType === 'owner') {
        fetches.push(getWarrantyClaimStats());
      }

      const results = await Promise.allSettled(fetches);
      const customersRes = results[0];
      const contactRes = results[1];
      const claimStatsRes = userType === 'owner' ? results[2] : null;

      const customers = customersRes.status === 'fulfilled'
        ? (customersRes.value?.data?.data?.registered_customers || customersRes.value?.data?.data || [])
        : [];
      const contactNotifications = contactRes.status === 'fulfilled'
        ? (contactRes.value?.data?.data?.notifications || [])
        : [];
      const rawClaimStats = claimStatsRes?.status === 'fulfilled' ? claimStatsRes.value : null;
      const claimStats = rawClaimStats?.data ?? rawClaimStats;

      const generatedNotifications = [];
      const now = new Date();

      // Process warranty registration notifications
      if (Array.isArray(customers)) {
        customers.forEach((c) => {
          const createdAt = c.created_at ? new Date(c.created_at) : null;
          if (createdAt) {
            const daysSince = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
            if (daysSince <= 7) {
              generatedNotifications.push({
                id: `cust-reg-${c.id}`,
                type: 'registration',
                title: 'New Warranty Registration',
                message: `${c.first_name || ''} ${c.last_name || ''} registered warranty for ${c.product_name || 'a product'} (Code: ${c.warranty_code}).`,
                timestamp: createdAt.toISOString(),
                read: daysSince > 1,
              });
            }
          }

          // Check for expiring warranties in customer data
          if (c.provider_warranty_code) {
            const warrantyTo = c.provider_warranty_code.warranty_to ? new Date(c.provider_warranty_code.warranty_to) : null;
            if (warrantyTo) {
              const daysLeft = Math.ceil((warrantyTo - now) / (1000 * 60 * 60 * 24));
              if (daysLeft > 0 && daysLeft <= 30) {
                generatedNotifications.push({
                  id: `cust-exp-${c.id}`,
                  type: 'expiry',
                  title: 'Customer Warranty Expiring',
                  message: `Warranty for ${c.first_name || ''} ${c.last_name || ''} (${c.product_name || 'product'}) expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
                  timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
                  read: false,
                });
              }
            }
          }
        });
      }

      // Process contact support notifications (and system notifications like pricing updates, dealer/staff deactivation)
      if (Array.isArray(contactNotifications)) {
        contactNotifications.forEach((n) => {
          const createdAt = n.created_at ? new Date(n.created_at) : null;
          const cn = (n.contact_number || '').toLowerCase();
          // Match new branding and legacy rows stored with the old name
          const isEwarrantify =
            n.name === "E-Warrantify" || n.name === "eWarrantify";
          const isPricingUpdate = isEwarrantify && cn === 'system';
          const isDealerDeactivated = isEwarrantify && cn === 'dealer-deactivated';
          const isStaffDeactivated = isEwarrantify && cn === 'staff-deactivated';
          const isDealerActivated = isEwarrantify && cn === 'dealer-activated';
          const isStaffActivated = isEwarrantify && cn === 'staff-activated';
          const isServiceCenterDeactivated = isEwarrantify && cn === 'service-center-deactivated';
          const isServiceCenterActivated = isEwarrantify && cn === 'service-center-activated';
          const isSystemNotification = isPricingUpdate || isDealerDeactivated || isStaffDeactivated || isDealerActivated || isStaffActivated || isServiceCenterDeactivated || isServiceCenterActivated;
          let title = 'Customer Support Request';
          let type = 'contact';
          if (isPricingUpdate) {
            title = 'Coin Pricing Update';
            type = 'system';
          } else if (isDealerDeactivated) {
            title = 'Dealer Deactivated';
            type = 'system';
          } else if (isStaffDeactivated) {
            title = 'Staff Member Suspended';
            type = 'system';
          } else if (isDealerActivated) {
            title = 'Dealer Reactivated';
            type = 'system';
          } else if (isStaffActivated) {
            title = 'Staff Member Reactivated';
            type = 'system';
          } else if (isServiceCenterDeactivated) {
            title = 'Service Center Deactivated';
            type = 'system';
          } else if (isServiceCenterActivated) {
            title = 'Service Center Reactivated';
            type = 'system';
          }
          generatedNotifications.push({
            id: `contact-${n.id}`,
            type,
            title,
            message: isSystemNotification ? n.message : `${n.name} (${n.contact_number}) sent a message: "${n.message}"`,
            email: n.email,
            timestamp: createdAt ? createdAt.toISOString() : new Date().toISOString(),
            read: n.is_read || false,
          });
        });
      }

      // Process warranty claim notifications (owner only)
      const submittedCount = claimStats?.data?.submitted ?? claimStats?.submitted ?? 0;
      if (submittedCount > 0) {
        generatedNotifications.push({
          id: 'claims-pending',
          type: 'claim',
          title: 'New Warranty Claims',
          message: `${submittedCount} warranty claim${submittedCount !== 1 ? 's' : ''} ${submittedCount !== 1 ? 'need' : 'needs'} your attention.`,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      // Sort by timestamp (newest first)
      generatedNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit to most recent 30
      const limited = generatedNotifications.slice(0, 30);

      if (limited.length === 0) {
        limited.push({
          id: 'no-activity',
          type: 'system',
          title: 'No Recent Activity',
          message: 'You will see notifications here when customers register warranties, contact support, or when warranties are about to expire.',
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      // Apply stored read state and exclude dismissed (cleared) so they never show again
      const readIds = new Set(getReadNotificationIds());
      const dismissedIds = new Set(getDismissedNotificationIds());
      const merged = limited
        .filter((n) => !dismissedIds.has(n.id))
        .map((n) => ({ ...n, read: n.read || readIds.has(n.id) }));
      setNotifications(merged);
    } catch (error) {
      console.warn('Error fetching provider notifications:', error);
      setNotifications([{
        id: 'welcome',
        type: 'system',
        title: 'Notifications',
        message: 'You will see notifications here when there is activity on your account.',
        timestamp: new Date().toISOString(),
        read: false,
      }]);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCheck className="w-5 h-5 text-green-600" />;
      case 'registration':
        return <ShieldCheck className="w-5 h-5 text-cyan-600" />;
      case 'expiry':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'contact':
        return <MessageSquare className="w-5 h-5 text-orange-600" />;
      case 'claim':
        return <FileWarning className="w-5 h-5 text-violet-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-[#1A7FC1]" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'approval':
        return 'bg-green-100';
      case 'registration':
        return 'bg-cyan-100';
      case 'expiry':
        return 'bg-amber-100';
      case 'expired':
        return 'bg-red-100';
      case 'contact':
        return 'bg-orange-100';
      case 'claim':
        return 'bg-violet-100';
      case 'system':
        return 'bg-blue-100';
      default:
        return 'bg-slate-100';
    }
  };

  const markAsRead = async (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    addReadNotificationIds([id]);

    // Persist to backend for contact (support request) notifications so customer sees "Seen"
    if (typeof id === 'string' && id.startsWith('contact-')) {
      const notificationId = id.replace(/^contact-/, '');
      if (notificationId) {
        try {
          await api.put('/provider/mark-notification-read', { notification_id: notificationId });
        } catch (err) {
          console.warn('Failed to mark support request as read:', err);
          toast.error('Could not update status. Please try again.');
        }
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadContactIds = notifications
      .filter((n) => !n.read && n.type === 'contact' && typeof n.id === 'string' && n.id.startsWith('contact-'))
      .map((n) => n.id.replace(/^contact-/, ''))
      .filter(Boolean);

    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    addReadNotificationIds(notifications.map((n) => n.id).filter(Boolean));

    if (unreadContactIds.length > 0) {
      try {
        await Promise.all(
          unreadContactIds.map((notificationId) =>
            api.put('/provider/mark-notification-read', { notification_id: notificationId })
          )
        );
      } catch (err) {
        console.warn('Failed to mark some support requests as read:', err);
        toast.error('Could not update all. Refreshing may show updates.');
      }
    }
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id) => {
    if (id) addDismissedNotificationIds([id]);
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification dismissed');
  };

  const clearAll = () => {
    const ids = notifications.map((n) => n.id).filter(Boolean);
    if (ids.length > 0) {
      addReadNotificationIds(ids);
      addDismissedNotificationIds(ids);
    }
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 0) return 'Just now';
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-slate-50">
        <div className="bg-gradient-to-br from-[#3A9FE1] to-[#1A7FC1] pt-12 pb-16 px-6 rounded-b-[2rem] shadow-xl">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate(backTarget)}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-white mb-2">Notifications</h2>
            <p className="text-cyan-100">Loading...</p>
          </div>
        </div>
        <div className="max-w-md mx-auto px-6 mt-8 flex justify-center">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3A9FE1] to-[#1A7FC1] pt-12 pb-16 px-6 rounded-b-[2rem] shadow-xl">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate(backTarget)}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white mb-2">Notifications</h2>
              <p className="text-cyan-100">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors text-sm"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-6 -mt-8 space-y-6"
      >
        {notifications.length > 0 ? (
          <>
            {notifications.length > 1 && (
              <div className="flex justify-end">
                <button
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              </div>
            )}

            <div className="space-y-3">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`bg-white rounded-2xl p-5 shadow-md cursor-pointer hover:shadow-lg transition-all ${
                    !notification.read ? 'border-2 border-cyan-200' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl ${getNotificationBg(notification.type)} flex items-center justify-center flex-shrink-0`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-slate-900 flex items-center gap-2">
                          {notification.title}
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          )}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-slate-900 mb-2">No notifications</h3>
            <p className="text-slate-500">You're all caught up!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

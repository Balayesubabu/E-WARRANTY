import api from '../utils/api';
import { getWarrantyClaimStats } from './warrantyClaimService';
import { getServiceCenterClaims } from './serviceCenterService';

/**
 * Fetch notifications for the current user (customer, provider, or service center).
 * Returns array of { id, type, title?, message?, timestamp?, read, ... }
 * Must match NotificationCenter's notification IDs so badge count updates when user marks as read.
 */
export async function fetchNotifications() {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = storedUser?.user_type || storedUser?.role || '';

  if (userType === 'customer') {
    return fetchCustomerNotifications();
  }
  if (userType === 'service_center') {
    return fetchServiceCenterNotifications();
  }
  return fetchProviderNotifications(userType);
}

async function fetchServiceCenterNotifications() {
  try {
    const [claimsRes, contactRes] = await Promise.allSettled([
      getServiceCenterClaims(),
      api.get('/provider/contact-notifications'),
    ]);

    const claims = claimsRes.status === 'fulfilled'
      ? (Array.isArray(claimsRes.value?.data) ? claimsRes.value.data : [])
      : [];
    const contactNotifications = contactRes.status === 'fulfilled'
      ? (contactRes.value?.data?.data?.notifications || [])
      : [];

    const generated = [];

    (Array.isArray(claims) ? claims : []).forEach((c) => {
      if (c.status === 'AssignedToServiceCenter') {
        generated.push({ id: `sc-claim-assigned-${c.id}`, type: 'claim', read: false });
      } else if (c.status === 'InProgress') {
        generated.push({ id: `sc-claim-progress-${c.id}`, type: 'claim', read: false });
      } else if (['Repaired', 'Replaced', 'Closed'].includes(c.status)) {
        generated.push({ id: `sc-claim-done-${c.id}`, type: 'approval', read: true });
      }
    });

    contactNotifications.forEach((n) => {
      generated.push({ id: `contact-${n.id}`, type: 'contact', read: n.is_read || false });
    });

    if (generated.length === 0) {
      generated.push({ id: 'no-activity', type: 'system', read: false });
    }
    return generated.slice(0, 30);
  } catch {
    return [{ id: 'welcome', type: 'system', read: false }];
  }
}

async function fetchCustomerNotifications() {
  try {
    const response = await api.get('/e-warranty/warranty-customer/my-warranties');
    const warranties = response?.data?.data?.warranties || [];
    const generatedNotifications = [];
    const now = new Date();

    warranties.forEach((w) => {
      const createdAt = w.created_at ? new Date(w.created_at) : null;
      const expiryDate = w.expiry_date ? new Date(w.expiry_date) : null;

      if (createdAt) {
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation <= 7) {
          generatedNotifications.push({
            id: `reg-${w.id}`,
            type: 'registration',
            read: daysSinceCreation > 1,
          });
        }
      }
      if (w.status === 'expiring' && expiryDate) {
        generatedNotifications.push({ id: `exp-${w.id}`, type: 'expiry', read: false });
      }
      if (w.status === 'expired' && expiryDate) {
        generatedNotifications.push({ id: `expired-${w.id}`, type: 'expired', read: true });
      }
      if (w.status === 'active' && createdAt) {
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation > 7) {
          generatedNotifications.push({ id: `active-${w.id}`, type: 'approval', read: true });
        }
      }
      (w.claims || []).forEach((c, idx) => {
        if (c.status === 'AssignedToServiceCenter') {
          generatedNotifications.push({ id: `claim-assigned-${w.id}-${c.id}`, type: 'claim', read: false });
        } else if (c.status === 'InProgress') {
          generatedNotifications.push({ id: `claim-inprogress-${w.id}-${c.id}`, type: 'claim', read: false });
        } else if (c.status === 'Approved') {
          generatedNotifications.push({ id: `claim-approved-${w.id}-${c.id}`, type: 'approval', read: false });
        } else if (['Closed', 'Repaired', 'Replaced'].includes(c.status)) {
          generatedNotifications.push({ id: `claim-resolved-${w.id}-${c.id}`, type: 'approval', read: idx > 0 });
        }
      });
    });

    if (warranties.length === 0) {
      generatedNotifications.push({ id: 'welcome', type: 'system', read: false });
    }
    return generatedNotifications;
  } catch {
    return [{ id: 'error', type: 'system', read: false }];
  }
}

async function fetchProviderNotifications(userType) {
  try {
    const fetches = [
      api.get('/e-warranty/warranty-customer/get-registered-customers'),
      api.get('/provider/contact-notifications'),
    ];
    if (userType === 'owner') fetches.push(getWarrantyClaimStats());

    const results = await Promise.allSettled(fetches);
    const customers = results[0]?.status === 'fulfilled'
      ? (results[0].value?.data?.data?.registered_customers || results[0].value?.data?.data || [])
      : [];
    const contactNotifications = results[1]?.status === 'fulfilled'
      ? (results[1].value?.data?.data?.notifications || [])
      : [];
    const claimStats = results[2]?.status === 'fulfilled' ? (results[2].value?.data ?? results[2].value) : null;

    const generatedNotifications = [];
    const now = new Date();

    if (Array.isArray(customers)) {
      customers.forEach((c) => {
        const createdAt = c.created_at ? new Date(c.created_at) : null;
        if (createdAt) {
          const daysSince = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
          if (daysSince <= 7) {
            generatedNotifications.push({ id: `cust-reg-${c.id}`, type: 'registration', read: daysSince > 1 });
          }
        }
        if (c.provider_warranty_code?.warranty_to) {
          const warrantyTo = new Date(c.provider_warranty_code.warranty_to);
          const daysLeft = Math.ceil((warrantyTo - now) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0 && daysLeft <= 30) {
            generatedNotifications.push({ id: `cust-exp-${c.id}`, type: 'expiry', read: false });
          }
        }
      });
    }

    if (Array.isArray(contactNotifications)) {
      contactNotifications.forEach((n) => {
        generatedNotifications.push({
          id: `contact-${n.id}`,
          type: 'contact',
          read: n.is_read || false,
        });
      });
    }

    const submittedCount = claimStats?.data?.submitted ?? claimStats?.submitted ?? 0;
    if (submittedCount > 0) {
      generatedNotifications.push({ id: 'claims-pending', type: 'claim', read: false });
    }

    const limited = generatedNotifications.slice(0, 30);
    if (limited.length === 0) {
      limited.push({ id: 'no-activity', type: 'system', read: false });
    }
    return limited;
  } catch {
    return [{ id: 'welcome', type: 'system', read: false }];
  }
}

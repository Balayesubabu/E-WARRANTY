import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft, Building2, Mail, Users, Edit, LogOut, ChevronRight, User, Phone, MapPin,
  KeyRound, Camera,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { getUserDetails } from '../../services/userService';
import { logoutAndGetRedirect } from '../../services/authorizationService';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';

const AVATAR_STORAGE_KEY = 'profile_avatar';

function getStoredAvatar(userId) {
  try {
    return localStorage.getItem(`${AVATAR_STORAGE_KEY}_${userId}`) || null;
  } catch {
    return null;
  }
}

function storeAvatar(userId, dataUrl) {
  try {
    if (dataUrl) {
      localStorage.setItem(`${AVATAR_STORAGE_KEY}_${userId}`, dataUrl);
    } else {
      localStorage.removeItem(`${AVATAR_STORAGE_KEY}_${userId}`);
    }
  } catch {
    // ignore
  }
}

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const userData = await getUserDetails();
        if (userData?.role === 'owner' || userData?.user_type === 'owner') {
          navigate('/owner/profile', { replace: true });
          return;
        }
        setUser(userData);
        if (userData?.id) {
          const stored = getStoredAvatar(userData.id);
          if (stored) setAvatarUrl(stored);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error(error.message || 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, or GIF)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarUrl(dataUrl);
      if (user?.id) storeAvatar(user.id, dataUrl);
      toast.success('Profile photo updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1A7FC1] border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Unable to load user data</p>
          <button
            onClick={() => navigate('/customer-auth')}
            className="px-4 py-2 bg-[#1A7FC1] text-white rounded-xl hover:bg-[#166EA8] transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.fullname || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Customer';
  const rawPhone = user.phone_number || user.phone || '';
  const isTempPhone = rawPhone && String(rawPhone).startsWith('temp_');
  const realPhone = isTempPhone ? '' : rawPhone;
  const isPhoneVerified = realPhone && (user.is_phone_verified !== false);
  const userPhoneDisplay = !realPhone ? '' : isPhoneVerified ? realPhone : 'Not Verified';
  const userAddress = [user.address, user.city, user.state, user.country].filter(Boolean).join(', ') || '';
  const isCustomer = user.role === 'customer' || user.user_type === 'customer';

  const roleLabel = user.role === 'owner'
    ? 'Owner'
    : user.role === 'staff'
    ? `${user.role_type || 'Staff'} Staff`
    : user.role === 'dealer'
    ? 'Dealer'
    : 'Customer';

  const baseSettingsOptions = [
    {
      icon: Edit,
      title: 'Edit Profile',
      description: 'Update your information',
      action: () => navigate('/edit-profile'),
    },
    ...(!isCustomer ? [{
      icon: KeyRound,
      title: 'Change Password',
      description: 'Update your password',
      action: () => navigate('/change-password', { state: { email: user.email, flow: 'change-password' } }),
    }] : []),
    ...((user.role === 'owner' || user.role === 'staff')
      ? [{
          icon: Mail,
          title: 'Support Tickets',
          description: 'Review and respond to customer support requests',
          action: () => navigate('/support-tickets'),
        }]
      : []),
    ...((user.role === 'owner' || (user.role === 'staff' && user.role_type === 'Manager'))
      ? [
          {
            icon: Users,
            title: user.role === 'owner' ? 'Manage Team / Dealers' : 'Dealer Management',
            description: user.role === 'owner' ? 'Add or remove team members' : 'Activate/deactivate dealers',
            action: () => navigate('/dealer-management'),
          },
          ...(user.role === 'owner'
            ? [{
                icon: Building2,
                title: 'Staff Management',
                description: 'Create and manage staff',
                action: () => navigate('/staff'),
              }]
            : []),
        ]
      : []),
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    const to = logoutAndGetRedirect();
    navigate(to, { replace: true });
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8 bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F4E78] via-[#1A7FC1] to-[#2A8FD1] pt-10 pb-28 lg:pb-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Avatar with upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-24 h-24 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm shadow-xl ring-2 ring-white/30 flex items-center justify-center text-white text-3xl font-semibold"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </motion.div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-[#1A7FC1] hover:bg-slate-50 transition-colors"
                aria-label="Change profile photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mt-4"
            >
              <h2 className="text-white font-semibold text-lg">{displayName}</h2>
              <p className="text-white/80 text-sm mt-0.5">{user.email || (rawPhone ? userPhoneDisplay : '')}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 lg:-mt-12 space-y-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Personal/Company info */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-slate-900 font-semibold mb-4">
              {isCustomer ? 'Personal Information' : 'Company Information'}
            </h3>

            {isCustomer ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-400 text-xs">Full Name</p>
                    <p className="text-slate-900 font-medium truncate">{displayName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-400 text-xs">Email</p>
                    <p className="text-slate-900 truncate break-all">{user.email || '—'}</p>
                  </div>
                </div>
                {realPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs">
                        {isPhoneVerified ? 'Phone (Verified)' : 'Phone'}
                      </p>
                      <p className={`font-medium ${!isPhoneVerified ? 'text-amber-600' : 'text-slate-900'}`}>
                        {userPhoneDisplay || '—'}
                      </p>
                    </div>
                  </div>
                )}
                {userAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs">Address</p>
                      <p className="text-slate-900 text-sm">{userAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1A7FC1]/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-[#1A7FC1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-500 text-xs">Role</p>
                    <p className="text-slate-900 font-medium">{roleLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-500 text-xs">Company Name</p>
                    <p className="text-slate-900 truncate">{user.companyname || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-500 text-xs">Email</p>
                    <p className="text-slate-900 truncate break-all">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <p className="text-slate-900 font-semibold">{isCustomer ? 'Settings' : 'Account Actions'}</p>
              <p className="text-slate-500 text-sm mt-0.5">
                {isCustomer ? 'Manage your account' : 'Manage your account and operational tools'}
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {baseSettingsOptions.map((item) => (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-slate-50/80 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1A7FC1]/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#1A7FC1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-medium">{item.title}</p>
                    <p className="text-slate-500 text-sm truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>
              ))}
              <div className="border-t border-slate-200 my-2" />
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-red-50/80 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-600 font-medium">Logout</p>
                  <p className="text-red-500/80 text-sm">Sign out of your account</p>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-xs pt-4 pb-2">
          <p>E-Warrantify v1.0.0</p>
          <p className="mt-0.5">© 2025 All rights reserved</p>
        </div>
      </motion.div>

      {/* Logout confirmation modal */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

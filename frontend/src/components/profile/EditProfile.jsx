import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Building2, MapPin, Hash, Save, Loader2, Lock, Pencil, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { IconInput } from '../ui/icon-input';
import { Label } from '../ui/label';
import { AnimatedDiv } from '../ui/animated-div';
import { toast } from 'sonner';
import { getUserDetails, updateUserDetails, updateEmail } from '../../services/userService';
import Cookies from 'js-cookie';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { getPostLogoutRedirectPath } from '../../services/authorizationService';
import { sanitizeIndianNationalInput, isValidIndianMobile } from '../../utils/indianMobile';


export function EditProfile() { 
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: Cookies.get('email') || '',
    phone: '',
    companyname: '',
    address: '',
    gstin: '',
  });
  const [emailForm, setEmailForm] = useState({
    oldEmail: Cookies.get('email') || '',
    newEmail: '',
    password: '',
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const userData = await getUserDetails();
        setUser(userData);
        const rawPhone = userData?.phone_number || userData?.phone || '';
        const displayPhone =
          rawPhone && !String(rawPhone).startsWith('temp_')
            ? sanitizeIndianNationalInput(rawPhone)
            : '';
        setFormData({
          fullname: userData?.fullname || '',
          email: userData?.email || '',
          phone: displayPhone,
          companyname: userData?.companyname || '',
          address: userData?.address || '',
          gstin: userData?.gstin || '',
        });
        setEmailForm((prev) => ({
          ...prev,
          oldEmail: userData?.email || Cookies.get('email') || '',
        }));
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error(error.message || 'Failed to load user data');
        // If unauthorized, redirect will be handled by axios interceptor
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);



  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneDigits = sanitizeIndianNationalInput(formData.phone);
    if (!isValidIndianMobile(phoneDigits)) {
      toast.error('Enter a valid 10-digit Indian mobile number (starting with 6–9).');
      return;
    }
    setIsLoading(true);
    try {
      const updatedUser = await updateUserDetails({ ...formData, phone: phoneDigits });
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user data');
    } finally {
      setIsLoading(false);
    }

  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateEmailField = (field, value) => {
    setEmailForm({ ...emailForm, [field]: value });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedUser = await updateEmail(emailForm);
      const nextEmail = updatedUser?.email || emailForm.newEmail;
      setUser((prev) => ({ ...prev, email: updatedUser?.email }));
      setFormData((prev) => ({ ...prev, email: nextEmail }));
      Cookies.set('email', nextEmail, {
        sameSite: 'lax',
      });
      setIsEmailModalOpen(false);
      setEmailForm((prev) => ({
        ...prev,
        oldEmail: nextEmail,
        newEmail: '',
        password: '',
      }));
      navigate(getPostLogoutRedirectPath(user));
      toast.success('Email updated successfully! Please login with new email');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error(error.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3A9FE1] to-[#1A7FC1] pt-12 pb-32 lg:pb-16 px-6 lg:px-8 rounded-b-[32px] shadow-xl">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div>
            <h2 className="text-white mb-2">Edit Profile</h2>
            <p className="text-cyan-100">Update your account information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <AnimatedDiv
        variant="fadeInUp"
        className="max-w-4xl mx-auto px-6 lg:px-8 -mt-24 lg:-mt-8"
      >
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullname">Full Name *</Label>
              <IconInput
                id="fullname"
                icon={User}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.fullname === 'N/A' || formData.fullname === '' ? '' : formData.fullname}
                onChange={(e) => updateField('fullname', e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
                required
              />
            </div>

            <div className="relative group">
              <Label htmlFor="email">Email Address *</Label>
              <IconInput
                id="email"
                type="email"
                icon={Mail}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.email  === 'N/A' || formData.email === '' ? '' : formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter your email"
                className="mt-1 pr-24 bg-white text-slate-900"
                readOnly
              />
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="absolute right-3 top-[24px] text-xs font-medium bg-cyan-600 text-white rounded-md px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
               <span className="flex items-center gap-2"> <Pencil className="w-4 h-4" />
                <span className="text-xs font-medium">Update</span>
               </span>
              </button>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <IconInput
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                icon={Phone}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.phone === 'N/A' || formData.phone === '' ? '' : formData.phone}
                onChange={(e) => updateField('phone', sanitizeIndianNationalInput(e.target.value))}
                placeholder="10-digit mobile (6–9…)"
                className="mt-1"
                required
                title="10-digit Indian mobile number"
              />
            </div>

            {user?.role !== 'customer' && (
              <div>
                <Label htmlFor="companyname">Company Name *</Label>
                <IconInput
                  id="companyname"
                  icon={Building2}
                  iconLeft="left-3"
                  inputPaddingLeft="pl-10"
                  value={formData.companyname === 'N/A' || formData.companyname === '' ? '' : formData.companyname}
                  onChange={(e) => updateField('companyname', e.target.value)}
                  placeholder="Enter your company name"
                  className="mt-1"
                  required
                />
              </div>
            )}

            <div className={user?.role !== 'customer' ? '' : 'lg:col-span-2'}>
              <Label htmlFor="address">Address</Label>
              <IconInput
                id="address"
                icon={MapPin}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.address === 'N/A' || formData.address === '' ? '' : formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Enter your address"
                className="mt-1"
              />
            </div>

            {user?.role === 'owner' && (
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <IconInput
                  id="gstin"
                  icon={Hash}
                  iconLeft="left-3"
                  inputPaddingLeft="pl-10"
                  value={formData.gstin === 'N/A' || formData.gstin === '' ? '' : formData.gstin}
                  onChange={(e) => updateField('gstin', e.target.value)}
                  placeholder="Enter your GSTIN"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="pt-6 max-w-md mx-auto">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#3A9FE1] to-[#1A7FC1] hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Email</DialogTitle>
              <DialogDescription>
                Enter your old email, new email, and password to update.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="old-email">Old Email *</Label>
                <IconInput
                  id="old-email"
                  type="email"
                  icon={Mail}
                  iconLeft="left-3"
                  inputPaddingLeft="pl-10"
                  value={emailForm.oldEmail}
                  onChange={(e) => updateEmailField('oldEmail', e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="new-email">New Email *</Label>
                <IconInput
                  id="new-email"
                  type="email"
                  icon={Mail}
                  iconLeft="left-3"
                  inputPaddingLeft="pl-10"
                  value={emailForm.newEmail}
                  onChange={(e) => updateEmailField('newEmail', e.target.value)}
                  placeholder="new@example.com"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email-password">Password *</Label>
                <div className="relative mt-1">
                  <IconInput
                    id="email-password"
                    type={showEmailPassword ? 'text' : 'password'}
                    icon={Lock}
                    iconLeft="left-3"
                    inputPaddingLeft="pl-10"
                    value={emailForm.password}
                    onChange={(e) => updateEmailField('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showEmailPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEmailPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#3A9FE1] to-[#1A7FC1] hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Update Email
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </AnimatedDiv>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Save, Loader2, Building2, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { IconInput } from '../ui/icon-input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { getDealerProfile, updateDealerProfile } from '../../services/dealerService';

export function DealerEditProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pin_code: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await getDealerProfile();
        const dealer = response?.data || {};
        const rawPhone = dealer.phone_number || '';
        const displayPhone = rawPhone && !String(rawPhone).startsWith('temp_') ? rawPhone : '';
        setFormData({
          name: dealer.name || '',
          phone_number: displayPhone,
          address: dealer.address || '',
          city: dealer.city || '',
          state: dealer.state || '',
          country: dealer.country || 'India',
          pin_code: dealer.pin_code || '',
        });
      } catch (error) {
        console.error('Error fetching dealer profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateDealerProfile(formData);

      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          name: formData.name,
          fullname: formData.name,
          phone_number: formData.phone_number,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn('Could not update localStorage:', e);
      }

      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#1A7FC1]" />
            Edit Dealer Profile
          </h2>
          <p className="text-slate-500 text-sm mt-1">Update your dealer account information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <IconInput
                id="name"
                icon={User}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <IconInput
                id="phone_number"
                type="tel"
                icon={Phone}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.phone_number}
                onChange={(e) => updateField('phone_number', e.target.value)}
                placeholder="Enter phone number"
                className="mt-1"
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="address">Address</Label>
              <IconInput
                id="address"
                icon={MapPin}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Enter your address"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <IconInput
                id="city"
                icon={Building2}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Enter city"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <IconInput
                id="state"
                icon={MapPin}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="Enter state"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <IconInput
                id="country"
                icon={MapPin}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.country}
                onChange={(e) => updateField('country', e.target.value)}
                placeholder="Enter country"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pin_code">Pin Code</Label>
              <IconInput
                id="pin_code"
                icon={MapPin}
                iconLeft="left-3"
                inputPaddingLeft="pl-10"
                value={formData.pin_code}
                onChange={(e) => updateField('pin_code', e.target.value)}
                placeholder="Enter pin code"
                className="mt-1"
              />
            </div>
          </div>

          <p className="text-slate-400 text-xs mt-4">
            To update your email or password, use the respective options on the sidebar or contact the owner.
          </p>

          <div className="pt-6 max-w-md mx-auto">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl"
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-5 h-5 mr-2" /> Save Changes</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

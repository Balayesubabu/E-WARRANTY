import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Save, Loader2, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { IconInput } from '../ui/icon-input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { getServiceCenterProfile, updateServiceCenterProfile } from '../../services/serviceCenterService';

export function ServiceCenterProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await getServiceCenterProfile();
        const data = response?.data || response || {};
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsSaving(true);
    try {
      await updateServiceCenterProfile(formData);
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, name: formData.name }));
      } catch {}
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#1A7FC1]" />
            Edit Profile
          </h2>
          <p className="text-slate-500 text-sm mt-1">Update your service center information</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5"
        >
          <div>
            <Label htmlFor="name">Name *</Label>
            <IconInput
              id="name"
              icon={User}
              iconLeft="left-3"
              inputPaddingLeft="pl-10"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Service center name"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <IconInput
              id="phone"
              type="tel"
              icon={Phone}
              iconLeft="left-3"
              inputPaddingLeft="pl-10"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Phone number"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <IconInput
              id="address"
              icon={MapPin}
              iconLeft="left-3"
              inputPaddingLeft="pl-10"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Address"
              className="mt-1"
            />
          </div>
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
        </form>

        <p className="text-slate-400 text-xs mt-4 text-center">
          To change your email or password, use the Change Password option in the sidebar.
        </p>
      </div>
    </div>
  );
}

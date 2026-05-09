import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Save, Loader2, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { IconInput } from '../ui/icon-input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { getStaffProfile, updateStaffProfile } from '../../services/staffService';

export function StaffEditProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [staffId, setStaffId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    address: '',
    designation: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await getStaffProfile();
        const staff = response?.data || {};
        const rawPhone = staff.phone_number || staff.phone || '';
        const displayPhone = rawPhone && !String(rawPhone).startsWith('temp_') ? rawPhone : '';
        setStaffId(staff.id || null);
        setFormData({
          name: staff.name || '',
          phone_number: displayPhone,
          address: staff.address || '',
          designation: staff.designation || '',
        });
      } catch (error) {
        console.error('Error loading staff profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    if (!staffId) { toast.error('Staff ID not found'); return; }

    try {
      setIsSaving(true);
      await updateStaffProfile(staffId, formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[#1A7FC1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Pencil className="w-5 h-5 text-[#1A7FC1]" />
        <h2 className="text-xl font-semibold text-slate-900">Edit Profile</h2>
      </div>

      <div className="max-w-lg">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <IconInput id="name" icon={User} value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Your name" disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <IconInput id="phone" icon={Phone} value={formData.phone_number} onChange={(e) => handleChange('phone_number', e.target.value)} placeholder="Phone number" disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <IconInput id="address" icon={MapPin} value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Address" disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="designation">Designation</Label>
              <IconInput id="designation" icon={User} value={formData.designation} onChange={(e) => handleChange('designation', e.target.value)} placeholder="Designation" disabled={isSaving} />
            </div>

            <Button type="submit" className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-12 rounded-xl" disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

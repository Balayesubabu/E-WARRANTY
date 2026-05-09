import { useState, useEffect } from 'react';
import { Building2, Save, Loader2 } from 'lucide-react';
import { getDealerBusinessProfile, updateDealerBusinessProfile } from '../../services/dealerService';
import { toast } from 'sonner';

export function DealerBusinessProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  const [form, setForm] = useState({
    gst_number: '', pan_number: '', address: '', city: '', state: '',
    country: '', pin_code: '', bank_name: '', bank_account_number: '', bank_ifsc_code: '',
  });

  useEffect(() => {
    getDealerBusinessProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          gst_number: data.gst_number || '', pan_number: data.pan_number || '',
          address: data.address || '', city: data.city || '', state: data.state || '',
          country: data.country || '', pin_code: data.pin_code || '',
          bank_name: data.bank_name || '', bank_account_number: data.bank_account_number || '',
          bank_ifsc_code: data.bank_ifsc_code || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateDealerBusinessProfile(form);
      setProfile(updated);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" /></div>;
  }

  const tabs = [
    { id: 'business', label: 'Business Info' },
    { id: 'contact', label: 'Contact Info' },
    //{ id: 'bank', label: 'Bank Details' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Business Profile</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your business, contact, and banking information</p>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#1A7FC1]/10 text-[#1A7FC1] flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{profile?.name || 'Dealer'}</h3>
            <p className="text-sm text-slate-500">{profile?.email}</p>
            <p className="text-sm text-slate-500">{profile?.country_code} {profile?.phone_number}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${profile?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {profile?.status || 'UNKNOWN'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white text-[#1A7FC1] shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'business' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">Business Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">GST Number</label>
                <input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">PAN Number</label>
                <input value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Country</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">PIN Code</label>
                <input value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Dealer Key</label>
                <input value={profile?.dealer_key || ''} readOnly className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input value={profile?.email || ''} readOnly className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <input value={`${profile?.country_code || ''} ${profile?.phone_number || ''}`} readOnly className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Joined</label>
                <input value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'} readOnly className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Contact details are managed by your owner. Please reach out to them for changes.</p>
          </div>
        )}

        {/* {activeTab === 'bank' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">Bank Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Bank Name</label>
                <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Account Number</label>
                <input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">IFSC Code</label>
                <input value={form.bank_ifsc_code} onChange={(e) => setForm({ ...form, bank_ifsc_code: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
            </div>
          </div>
        )} */}

        <div className="flex justify-end pt-6">
          <button onClick={handleSave} disabled={saving} className="h-10 px-6 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] flex items-center gap-2 text-sm disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

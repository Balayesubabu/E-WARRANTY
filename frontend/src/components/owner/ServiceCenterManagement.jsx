import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { toast } from 'sonner';
import { getServiceCenters, createServiceCenter } from '../../services/serviceCenterService';
import { sanitizeIndianNationalInput, isValidIndianMobile } from '../../utils/indianMobile';
import {
  isServiceCenterDuplicateError,
  ambiguousEmailPhoneDuplicateHints,
} from '../../utils/ownerDuplicateFeedback';
import {
  isOptionalPasswordValid,
  PASSWORD_POLICY_REJECT_MESSAGE,
  PASSWORD_HINT_TEXT,
} from '../../utils/passwordPolicy';

const SC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass = 'w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1A7FC1] focus:ring-1 focus:ring-[#1A7FC1]/30';
const hintCls = 'text-emerald-600 text-xs mt-1 font-medium';

export function ServiceCenterManagement() {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [duplicateEmailHint, setDuplicateEmailHint] = useState('');
  const [duplicatePhoneHint, setDuplicatePhoneHint] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getServiceCenters();
      setList(res?.data || []);
    } catch (error) {
      toast.error('Failed to load service centers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPhoneError('');
    setDuplicateEmailHint('');
    setDuplicatePhoneHint('');
    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    const phoneDigits = sanitizeIndianNationalInput(form.phone);
    if (!name) {
      toast.error('Please enter the service center name');
      return;
    }
    if (!email || !SC_EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }
    if (phoneDigits.length !== 10 || !isValidIndianMobile(phoneDigits)) {
      setPhoneError('Enter a valid 10-digit mobile number');
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!isOptionalPasswordValid(form.password)) {
      toast.error(PASSWORD_POLICY_REJECT_MESSAGE);
      return;
    }
    setIsSubmitting(true);
    try {
      setDuplicateEmailHint('');
      setDuplicatePhoneHint('');
      await createServiceCenter({
        name,
        email,
        phone: phoneDigits,
        address: (form.address || '').trim() || undefined,
        password: form.password || undefined,
      });
      toast.success('Service center created successfully');
      setForm({ name: '', email: '', phone: '', address: '', password: '' });
      setEmailError('');
      setPhoneError('');
      setDuplicateEmailHint('');
      setDuplicatePhoneHint('');
      setShowForm(false);
      fetchData();
    } catch (error) {
      const apiMessage = error?.response?.data?.message || '';
      if (isServiceCenterDuplicateError(apiMessage)) {
        const h = ambiguousEmailPhoneDuplicateHints();
        setDuplicateEmailHint(h.email);
        setDuplicatePhoneHint(h.phone);
        return;
      }
      toast.error(apiMessage || 'Failed to create service center');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#1A7FC1]" />
          <h2 className="text-xl font-semibold text-slate-900">Service Centers</h2>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (!showForm) {
              setEmailError('');
              setPhoneError('');
              setDuplicateEmailHint('');
              setDuplicatePhoneHint('');
            }
            setShowForm(!showForm);
          }}
          className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service Center
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-medium text-slate-800">Create Service Center</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Service center name"
                className={inputClass}
                autoComplete="organization"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setEmailError('');
                  setDuplicateEmailHint('');
                  setForm((p) => ({ ...p, email: e.target.value }));
                }}
                placeholder="email@example.com"
                className={`${inputClass} ${emailError ? 'border-red-400' : duplicateEmailHint ? 'border-emerald-400' : ''}`}
                autoComplete="email"
              />
              {emailError ? <p className="text-red-500 text-xs mt-1">{emailError}</p> : null}
              {duplicateEmailHint ? <p className={hintCls}>{duplicateEmailHint}</p> : null}
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Phone *</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={form.phone}
                onChange={(e) => {
                  setPhoneError('');
                  setDuplicatePhoneHint('');
                  setForm((p) => ({ ...p, phone: sanitizeIndianNationalInput(e.target.value) }));
                }}
                placeholder="9876543210"
                className={`${inputClass} ${phoneError ? 'border-red-400' : duplicatePhoneHint ? 'border-emerald-400' : ''}`}
              />
              {phoneError ? <p className="text-red-500 text-xs mt-1">{phoneError}</p> : null}
              {duplicatePhoneHint ? <p className={hintCls}>{duplicatePhoneHint}</p> : null}
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Address (optional)"
                className={inputClass}
                autoComplete="street-address"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Password</label>
              <p className="text-xs text-slate-500 mb-1">{PASSWORD_HINT_TEXT}</p>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Initial password (optional)"
                className={inputClass}
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={form.password} showHint={false} />
              <p className="text-xs text-slate-500 mt-1">If blank, the service center sets their password on first login.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEmailError('');
                setPhoneError('');
                setDuplicateEmailHint('');
                setDuplicatePhoneHint('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No service centers yet</p>
          <p className="text-slate-500 text-sm mt-1">Create service centers to assign warranty claims for repair.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((sc) => (
            <div key={sc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1A7FC1]/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-[#1A7FC1]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{sc.name}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{sc.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{sc.phone}</span>
                  {sc.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{sc.address}</span>}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${sc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {sc.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

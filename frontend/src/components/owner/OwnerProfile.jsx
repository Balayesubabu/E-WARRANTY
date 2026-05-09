import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Edit3,
  Lock,
  Settings,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  FileText,
  Upload,
} from 'lucide-react';
import api from '../../utils/api';
import { logoutAndGetRedirect } from '../../services/authorizationService';
import { toast } from 'sonner';
import { Button } from '../ui/button';

const BRAND = '#1A7FC1';
const BRAND_DARK = '#166EA8';

function VerificationRow({ label, verified }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      {verified ? (
        <span className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 className="w-4 h-4" /> Verified
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <XCircle className="w-4 h-4" /> Pending
        </span>
      )}
    </div>
  );
}

const ASSET_CONFIG = [
  { key: 'company_logo', label: 'Company logo', fileType: 'COMPANY_LOGO' },
  { key: 'qr_code_image', label: 'QR code', fileType: 'QR_CODE' },
  { key: 'signature_image', label: 'Signature', fileType: 'SIGNATURE' },
  { key: 'cover_image', label: 'Cover image', fileType: 'COVER_IMAGE' },
];

function AssetRow({ label, hasValue, onUpload, uploading, accept }) {
  const inputId = `asset-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between sm:justify-start gap-2">
        <span className="text-sm text-slate-600">{label}</span>
        {hasValue ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Uploaded
          </span>
        ) : (
          <span className="text-sm text-slate-400">Not set</span>
        )}
      </div>
      <label
        htmlFor={inputId}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors
          ${uploading ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        `}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Upload className="w-4 h-4 shrink-0" />}
        {uploading ? 'Uploading...' : (hasValue ? 'Replace' : 'Upload')}
      </label>
      <input
        id={inputId}
        type="file"
        accept={accept || 'image/*'}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function OwnerProfile() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAsset, setUploadingAsset] = useState(null);

  const fetchProvider = async () => {
    try {
      const response = await api.get('/provider/');
      const data = response?.data?.data?.provider;
      if (data) setProvider(data);
      else toast.error('Failed to load profile');
    } catch (err) {
      console.error('Error fetching provider:', err);
      toast.error(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvider();
  }, []);

  const handleAssetUpload = async (fileType, file) => {
    setUploadingAsset(fileType);
    try {
      const formData = new FormData();
      formData.append('document_image', file);
      await api.post(`/provider/upload-document?file_type=${fileType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Uploaded successfully');
      await fetchProvider();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleLogout = () => {
    const to = logoutAndGetRedirect();
    navigate(to, { replace: true });
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-slate-600">Unable to load profile. Please try again.</p>
      </div>
    );
  }

  const user = provider.user || {};
  const rawPhone = user.phone_number || user.phone || '';
  const isTempPhone = rawPhone && String(rawPhone).startsWith('temp_');
  const displayPhone = isTempPhone ? '' : rawPhone;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || provider.company_name || 'Owner';
  const initial = (fullName || 'O').charAt(0).toUpperCase();
  const hasWebsite = !!provider.company_website?.trim();
  const hasFacebook = !!provider.facebook_url?.trim();
  const hasInstagram = !!provider.instagram_url?.trim();
  const hasYoutube = !!provider.youtube_url?.trim();
  const hasWebPresence = hasWebsite || hasFacebook || hasInstagram || hasYoutube;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Profile</h1>
        <p className="text-sm text-slate-500">Your business and account details</p>
      </div>

      {/* Profile Header */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}
      >
        <div className="pt-8 pb-6 px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {provider.company_logo ? (
              <img
                src={provider.company_logo}
                alt="Company logo"
                className="w-20 h-20 rounded-xl object-cover border-2 border-white/30 shadow-md"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30 shadow-md"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                {initial}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{fullName}</h2>
              <p className="text-white/90 font-medium">{provider.company_name}</p>
              <p className="text-cyan-100 text-sm mt-0.5">{user.email || '—'}</p>
              {user.displayPhone && (
                <p className="text-cyan-100 text-sm">{displayPhone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
            <Building2 className="w-5 h-5" style={{ color: BRAND }} />
            Company Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Company name</dt><dd className="text-slate-800 font-medium">{provider.company_name || '—'}</dd></div>
            <div><dt className="text-slate-500">GSTIN</dt><dd className="text-slate-800">{provider.gst_number || '—'}</dd></div>
            <div><dt className="text-slate-500">Address</dt><dd className="text-slate-800">{provider.company_address || '—'}</dd></div>
            <div><dt className="text-slate-500">Post code</dt><dd className="text-slate-800">{provider.post_code || '—'}</dd></div>
            {provider.company_description && (
              <div><dt className="text-slate-500">Description</dt><dd className="text-slate-800">{provider.company_description}</dd></div>
            )}
            {Array.isArray(provider.mode_of_service_offered) && provider.mode_of_service_offered.length > 0 && (
              <div><dt className="text-slate-500">Services offered</dt><dd className="text-slate-800">{provider.mode_of_service_offered.join(', ')}</dd></div>
            )}
            {provider.invoice_prefix && (
              <div><dt className="text-slate-500">Invoice prefix</dt><dd className="text-slate-800">{provider.invoice_prefix}</dd></div>
            )}
          </dl>
        </div>

        {/* Owner Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
            <User className="w-5 h-5" style={{ color: BRAND }} />
            Owner Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Full name</dt><dd className="text-slate-800 font-medium">{fullName}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-slate-800">{user.email || '—'}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="text-slate-800">{displayPhone || '—'}</dd></div>
            <div><dt className="text-slate-500">Personal address</dt><dd className="text-slate-800">{user.address || '—'}</dd></div>
          </dl>
        </div>
      </div>

      {/* Web Presence */}
      {hasWebPresence && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
            <Globe className="w-5 h-5" style={{ color: BRAND }} />
            Web Presence
          </h3>
          <div className="flex flex-wrap gap-3">
            {hasWebsite && (
              <a
                href={provider.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
              >
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
            {hasFacebook && (
              <a
                href={provider.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
              >
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            )}
            {hasInstagram && (
              <a
                href={provider.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </a>
            )}
            {hasYoutube && (
              <a
                href={provider.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
              >
                <Youtube className="w-4 h-4" /> YouTube
              </a>
            )}
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
          <Settings className="w-5 h-5" style={{ color: BRAND }} />
          Account Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/edit-profile')}
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/change-password')}
          >
            <Lock className="w-4 h-4" /> Change Password
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/owner/warranty-settings')}
          >
            <Settings className="w-4 h-4" /> System Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Assets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
            <ImageIcon className="w-5 h-5" style={{ color: BRAND }} />
            Brand Assets
          </h3>
          <p className="text-sm text-slate-500 mb-3">Upload assets for warranty certificates (logo, QR, signature)</p>
          <div className="space-y-0">
            {ASSET_CONFIG.map(({ key, label, fileType }) => (
              <AssetRow
                key={key}
                label={label}
                hasValue={!!provider[key]}
                onUpload={(file) => handleAssetUpload(fileType, file)}
                uploading={uploadingAsset === fileType}
              />
            ))}
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
            <FileText className="w-5 h-5" style={{ color: BRAND }} />
            Verification Status
          </h3>
          <div className="space-y-0">
            <VerificationRow label="Email" verified={!!user.email} />
            <VerificationRow label="Phone" verified={!!displayPhone} />
          </div>
        </div>
      </div>

      {/* Logout */}
      {/* <div className="pt-2">
        <Button
          variant="outline"
          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" /> Log out
        </Button>
      </div> */}
    </div>
  );
}

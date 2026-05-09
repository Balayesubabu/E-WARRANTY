import { useState } from 'react';
import { X, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { createCustomerWarrantyClaim } from '../../services/warrantyClaimService';

const ISSUE_CATEGORIES = [
  'Product Defect',
  'Not Working',
  'Missing Parts',
  'Installation Issue',
  'Damage During Use',
  'Other',
];

const MIN_DESCRIPTION_LENGTH = 50;

export function FileClaimModal({ warranty, user, onClose, onSuccess }) {
  const [issueDescription, setIssueDescription] = useState('');
  const [issueCategory, setIssueCategory] = useState(ISSUE_CATEGORIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = issueDescription.trim().length;
  const isValid = charCount >= MIN_DESCRIPTION_LENGTH;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error(`Please describe the issue in at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      return;
    }

    if (!warranty?.id || !warranty?.provider_id) {
      toast.error('Warranty data is incomplete. Please try again from your dashboard.');
      return;
    }

    const userPhone = user?.phone_number && !String(user.phone_number).startsWith('temp_') ? String(user.phone_number).trim() : '';
    const userEmail = user?.email ? String(user.email).trim() : '';
    const customerEmail = (warranty.email && String(warranty.email).trim()) || userEmail || '';
    const customerPhone = (warranty.phone && String(warranty.phone).trim()) || userPhone || '';
    if (!customerPhone && !customerEmail) {
      toast.error('No contact info found. Please add your phone or email in Profile before filing a claim.');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerName = warranty.customer_name || `${warranty.first_name || ''} ${warranty.last_name || ''}`.trim() || user?.fullname || 'Customer';

      const payload = {
        warranty_customer_id: warranty.id,
        provider_id: warranty.provider_id,
        franchise_id: warranty.provider_id,
        warranty_code_id: warranty.provider_warranty_code_id || null,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || '',
        product_name: warranty.product_name || 'Product',
        warranty_code: warranty.warranty_code || '',
        issue_description: issueDescription.trim(),
        issue_category: issueCategory,
        claim_images: [],
      };

      await createCustomerWarrantyClaim(payload);
      toast.success('Claim submitted successfully. Our team will review and contact you soon.');
      onSuccess?.();
      onClose();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to submit claim. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold">File Warranty Claim</h3>
              <p className="text-slate-500 text-sm">{warranty?.product_name || 'Product'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue category</label>
            <select
              value={issueCategory}
              onChange={(e) => setIssueCategory(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-slate-700 outline-none focus:ring-2 focus:ring-[#1A7FC1] focus:border-transparent"
            >
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Describe the issue <span className="text-red-500">*</span>
            </label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Please describe the problem in detail (at least 50 characters). Include when it started, what happened, and any relevant details."
              rows={4}
              className={`w-full rounded-lg border px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-[#1A7FC1] focus:border-transparent resize-none ${
                charCount > 0 && charCount < MIN_DESCRIPTION_LENGTH
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200'
              }`}
              maxLength={1000}
            />
            <p className={`text-xs mt-1 ${charCount < MIN_DESCRIPTION_LENGTH ? 'text-amber-600' : 'text-slate-400'}`}>
              {charCount} / {MIN_DESCRIPTION_LENGTH} characters minimum
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-slate-600 text-sm">
              Our team will review your claim and contact you via phone or email. You can track the status from your dashboard.
            </p>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 rounded-xl bg-[#1A7FC1] hover:bg-[#166EA8] text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Claim'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

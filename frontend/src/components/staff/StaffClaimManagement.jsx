import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck, Clock, Check, X, ChevronDown, ChevronUp, Loader2,
  User, Package, Calendar, StickyNote, Image, AlertTriangle,
  ArrowRight, Search,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { getWarrantyClaims, updateWarrantyClaimStatus, getWarrantyClaimStats } from '../../services/warrantyClaimService';

const STATUS_CONFIG = {
  Submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
  Approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
  InProgress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  Repaired: { bg: 'bg-green-100', text: 'text-green-700', label: 'Repaired' },
  Replaced: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Replaced' },
  Closed: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Closed' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

const TRANSITIONS = {
  Submitted: ['Approved', 'Rejected'],
  Approved: ['InProgress', 'Rejected'],
  InProgress: ['Repaired', 'Replaced', 'Rejected'],
  Repaired: ['Closed'],
  Replaced: ['Closed'],
  Closed: [],
  Rejected: [],
};

export function StaffClaimManagement() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionNotes, setActionNotes] = useState({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [claimsRes, statsRes] = await Promise.allSettled([
        getWarrantyClaims(),
        getWarrantyClaimStats(),
      ]);
      if (claimsRes.status === 'fulfilled') {
        setClaims(claimsRes.value?.data || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.data || {});
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusUpdate = async (claimId, newStatus) => {
    setProcessing(true);
    try {
      const payload = {
        status: newStatus,
        internal_notes: actionNotes[claimId] || undefined,
      };
      if (newStatus === 'Rejected') payload.rejection_reason = actionNotes[claimId] || 'Claim rejected by staff';
      if (newStatus === 'Closed') payload.resolution_notes = actionNotes[claimId] || 'Claim resolved and closed';

      await updateWarrantyClaimStatus(claimId, payload);
      toast.success(`Claim updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      setActionNotes((prev) => { const n = { ...prev }; delete n[claimId]; return n; });
      fetchData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update claim';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filtered = claims.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (!query) return true;
    return [c.customer_name, c.customer_email, c.product_name, c.warranty_code, c.id]
      .some((v) => (v || '').toLowerCase().includes(query));
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[#1A7FC1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-[#1A7FC1]" />
        <h2 className="text-xl font-semibold text-slate-900">Warranty Claim Management</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Submitted', count: stats.submitted || 0, color: 'text-blue-600' },
          { label: 'Approved', count: stats.approved || 0, color: 'text-emerald-600' },
          { label: 'In Progress', count: stats.inProgress || 0, color: 'text-amber-600' },
          { label: 'Total', count: stats.total || 0, color: 'text-slate-900' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-slate-500 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, product, code..."
            className="w-full h-10 pl-10 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {['all', ...Object.keys(STATUS_CONFIG)].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-[#1A7FC1] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Claims list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">{claims.length === 0 ? 'No warranty claims yet' : 'No claims match your filter'}</p>
          </div>
        ) : (
          filtered.map((claim) => {
            const config = STATUS_CONFIG[claim.status] || STATUS_CONFIG.Submitted;
            const transitions = TRANSITIONS[claim.status] || [];
            const isExpanded = expandedId === claim.id;
            const claimRef = `WC-${claim.id.substring(0, 8).toUpperCase()}`;
            const wcData = claim.warranty_customer || {};
            const expiryDate = wcData.expiry_date || claim.warranty_code_ref?.warranty_to;

            return (
              <motion.div key={claim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header row */}
                <button onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-slate-900 font-medium">{claim.customer_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.text}`}>{config.label}</span>
                      <span className="text-slate-400 text-xs font-mono">{claimRef}</span>
                    </div>
                    <p className="text-slate-500 text-sm truncate">{claim.product_name} | {claim.warranty_code || 'N/A'}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5">
                      <div className="border-t border-slate-100 pt-4 space-y-4">
                        {/* Details grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <DetailItem icon={User} label="Customer" value={claim.customer_name} />
                          <DetailItem icon={User} label="Email" value={claim.customer_email || 'N/A'} />
                          <DetailItem icon={User} label="Phone" value={claim.customer_phone} />
                          <DetailItem icon={Package} label="Product" value={claim.product_name} />
                          <DetailItem icon={Calendar} label="Submitted" value={new Date(claim.created_at).toLocaleDateString()} />
                          <DetailItem icon={AlertTriangle} label="Priority" value={claim.priority || 'Medium'} />
                          {expiryDate && (
                            <DetailItem icon={Calendar} label="Warranty Expiry"
                              value={new Date(expiryDate).toLocaleDateString()}
                              highlight={new Date(expiryDate) < new Date() ? 'text-red-600' : 'text-green-600'} />
                          )}
                          {claim.issue_category && <DetailItem icon={Package} label="Category" value={claim.issue_category} />}
                        </div>

                        {/* Issue description */}
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-slate-500 text-xs mb-1">Issue Description</p>
                          <p className="text-slate-700 text-sm">{claim.issue_description}</p>
                        </div>

                        {/* Claim images */}
                        {claim.claim_images?.length > 0 && (
                          <div>
                            <p className="text-slate-500 text-xs mb-2">Customer Images ({claim.claim_images.length})</p>
                            <div className="flex gap-2 flex-wrap">
                              {claim.claim_images.map((img, i) => (
                                <a key={i} href={img} target="_blank" rel="noopener noreferrer"
                                  className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-[#1A7FC1] block">
                                  <img src={img} alt={`Claim image ${i + 1}`} className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Claim history */}
                        {claim.claim_history?.length > 0 && (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                              <p className="text-xs font-medium text-slate-600 uppercase">Claim History</p>
                            </div>
                            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                              {claim.claim_history.map((h, i) => (
                                <div key={h.id || i} className="px-3 py-2">
                                  <div className="flex justify-between">
                                    <span className="text-xs font-medium text-slate-700">{h.changed_by_role || 'System'}</span>
                                    <span className="text-xs text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-0.5">{h.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Existing internal notes */}
                        {claim.internal_notes && (
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                            <p className="text-amber-800 text-xs font-medium mb-1">Previous Internal Notes</p>
                            <p className="text-amber-700 text-sm">{claim.internal_notes}</p>
                          </div>
                        )}

                        {/* Action area - only show if transitions available */}
                        {transitions.length > 0 && (
                          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                            <div>
                              <label className="text-slate-700 text-xs font-medium flex items-center gap-1 mb-1">
                                <StickyNote className="w-3 h-3" /> Staff Notes (optional)
                              </label>
                              <textarea
                                value={actionNotes[claim.id] || ''}
                                onChange={(e) => setActionNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                                placeholder={claim.status === 'Submitted' ? 'Add approval rationale or rejection reason...' : 'Add resolution notes...'}
                                className="w-full h-16 text-sm border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A7FC1]"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {transitions.map((nextStatus) => {
                                const isReject = nextStatus === 'Rejected';
                                const isClose = nextStatus === 'Closed';
                                return (
                                  <Button key={nextStatus} onClick={() => handleStatusUpdate(claim.id, nextStatus)}
                                    disabled={processing}
                                    className={`text-xs h-9 px-4 ${isReject ? 'bg-red-600 hover:bg-red-700 text-white' : isClose ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'bg-[#1A7FC1] hover:bg-[#166EA8] text-white'}`}
                                  >
                                    {processing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ArrowRight className="w-3 h-3 mr-1" />}
                                    {STATUS_CONFIG[nextStatus]?.label || nextStatus}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className={`text-slate-900 text-sm ${highlight || ''}`}>{value}</p>
      </div>
    </div>
  );
}

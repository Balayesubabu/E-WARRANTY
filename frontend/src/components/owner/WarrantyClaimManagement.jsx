import { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, Wrench, Package,
  ChevronDown, ChevronUp, Loader2, RefreshCw, Filter
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  getWarrantyClaims,
  updateWarrantyClaimStatus,
  getWarrantyClaimStats,
} from '../../services/warrantyClaimService';
import { getServiceCenters } from '../../services/serviceCenterService';

const STATUS_CONFIG = {
  Submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-700', icon: Clock },
  UnderReview: { label: 'Under Review', color: 'bg-indigo-100 text-indigo-700', icon: Clock },
  Approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  AssignedToServiceCenter: { label: 'Assigned to Service', color: 'bg-cyan-100 text-cyan-700', icon: Package },
  InProgress: { label: 'In Repair', color: 'bg-violet-100 text-violet-700', icon: Wrench },
  Repaired: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', icon: Package },
  Replaced: { label: 'Replaced', color: 'bg-teal-100 text-teal-700', icon: RefreshCw },
  Closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  //SLABreached: { label: 'SLA Breached', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

// Aligned with backend ALLOWED_TRANSITIONS
const TRANSITIONS = {
  Submitted: ['Approved', 'Rejected', 'AssignedToServiceCenter'],
  Approved: ['InProgress', 'Rejected', 'AssignedToServiceCenter'],
  AssignedToServiceCenter: ['InProgress', 'Approved', 'Rejected'],
  InProgress: ['Repaired', 'Replaced', 'Rejected'],
  Repaired: ['Closed'],
  Replaced: ['Closed'],
  Closed: [],
  Rejected: [],
};

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-green-100 text-green-700',
};

export function WarrantyClaimManagement() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [noteInputs, setNoteInputs] = useState({});
  const [serviceCenters, setServiceCenters] = useState([]);
  const [selectedServiceCenter, setSelectedServiceCenter] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [claimsRes, statsRes] = await Promise.allSettled([
        getWarrantyClaims(),
        getWarrantyClaimStats(),
      ]);

      if (claimsRes.status === 'fulfilled') {
        setClaims(claimsRes.value?.data || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.data || null);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error('Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getServiceCenters().then((res) => setServiceCenters(res?.data || [])).catch(() => {});
  }, []);

  const handleStatusChange = async (claimId, newStatus) => {
    setIsProcessing(true);
    try {
      const payload = {
        status: newStatus,
        message: noteInputs[claimId] || undefined,
      };

      if (newStatus === 'AssignedToServiceCenter') {
        const scId = selectedServiceCenter[claimId];
        if (!scId) {
          toast.error('Please select a service center');
          setIsProcessing(false);
          return;
        }
        payload.assigned_service_center_id = scId;
      }
      if (newStatus === 'Rejected') {
        payload.rejection_reason = noteInputs[claimId] || 'Rejected by admin';
      }
      if (newStatus === 'Closed') {
        payload.resolution_notes = noteInputs[claimId] || 'Claim resolved and closed';
      }

      await updateWarrantyClaimStatus(claimId, payload);
      toast.success(`Claim status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      setNoteInputs((prev) => ({ ...prev, [claimId]: '' }));
      fetchData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredClaims = filterStatus === 'All'
    ? claims
    : claims.filter((c) => c.status === filterStatus);

  const formatDate = (val) => {
    if (!val) return '-';
    return new Date(val).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1A7FC1] mx-auto" />
          <p className="mt-3 text-slate-500">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm text-center">
                <p className="text-slate-500 text-xs truncate">{cfg.label}</p>
                <p className="text-base sm:text-lg font-semibold text-slate-800">{stats[key.charAt(0).toLowerCase() + key.slice(1)] ?? 0}</p>
              </div>
            ))}
            <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm text-center">
              <p className="text-slate-500 text-xs">Total</p>
              <p className="text-lg font-semibold text-[#1A7FC1]">{stats.total ?? 0}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm text-slate-700 bg-transparent outline-none"
          >
            <option value="All">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <span className="ml-auto text-xs text-slate-400">{filteredClaims.length} claims</span>
        </div>

        {/* Claims list */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
            <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No claims found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map((claim) => {
              const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.Submitted;
              const StatusIcon = cfg.icon;
              const transitions = TRANSITIONS[claim.status] || [];
              const isExpanded = expandedId === claim.id;

              return (
                <div key={claim.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900 truncate">{claim.customer_name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${cfg.color}`}>{cfg.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_COLORS[claim.priority] || PRIORITY_COLORS.Medium}`}>{claim.priority}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {claim.product_name} &middot; {claim.warranty_code || 'N/A'} &middot; {formatDate(claim.created_at)}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-4">
                      {/* Info grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <p className="text-slate-400 text-xs">Customer</p>
                          <p className="text-slate-800 text-sm">{claim.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Phone</p>
                          <p className="text-slate-800 text-sm">{claim.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Email</p>
                          <p className="text-slate-800 text-sm">{claim.customer_email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Category</p>
                          <p className="text-slate-800 text-sm">{claim.issue_category || '-'}</p>
                        </div>
                      </div>

                      {/* Issue */}
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Issue Description</p>
                        <p className="text-slate-700 text-sm bg-slate-50 rounded-lg p-3">{claim.issue_description}</p>
                      </div>

                      {/* Resolution / Rejection */}
                      {claim.resolution_notes && (
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Resolution Notes</p>
                          <p className="text-emerald-700 text-sm bg-emerald-50 rounded-lg p-3">{claim.resolution_notes}</p>
                        </div>
                      )}
                      {claim.rejection_reason && (
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Rejection Reason</p>
                          <p className="text-red-700 text-sm bg-red-50 rounded-lg p-3">{claim.rejection_reason}</p>
                        </div>
                      )}

                      {/* History */}
                      {claim.claim_history && claim.claim_history.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs mb-2">Status History</p>
                          <div className="space-y-1">
                            {claim.claim_history.map((h) => (
                              <div key={h.id} className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                <span>{h.previous_status || '—'} → {h.new_status}</span>
                                {h.message && <span className="text-slate-400">— {h.message}</span>}
                                <span className="ml-auto text-slate-400">{formatDate(h.created_at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {transitions.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          {transitions.includes('AssignedToServiceCenter') && (
                            <div className="mb-3">
                              <label className="block text-slate-600 text-xs mb-1">Select Service Center</label>
                              <select
                                value={selectedServiceCenter[claim.id] || ''}
                                onChange={(e) => setSelectedServiceCenter((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                                className="w-full max-w-xs h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                              >
                                <option value="">-- Select Service Center --</option>
                                {serviceCenters.map((sc) => (
                                  <option key={sc.id} value={sc.id}>{sc.name} ({sc.email})</option>
                                ))}
                              </select>
                              {serviceCenters.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">No service centers. Create one first.</p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Add a note (optional)..."
                              value={noteInputs[claim.id] || ''}
                              onChange={(e) => setNoteInputs((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                              className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {transitions.map((nextStatus) => {
                              const nextCfg = STATUS_CONFIG[nextStatus];
                              const isReject = nextStatus === 'Rejected';
                              return (
                                <Button
                                  key={nextStatus}
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleStatusChange(claim.id, nextStatus)}
                                  className={
                                    isReject
                                      ? 'bg-red-500 hover:bg-red-600 text-white text-xs h-8 rounded-lg'
                                      : 'bg-[#1A7FC1] hover:bg-[#166EA8] text-white text-xs h-8 rounded-lg'
                                  }
                                >
                                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                  {nextCfg?.label || nextStatus}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

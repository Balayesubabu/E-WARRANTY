import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck, Clock, CheckCircle2, XCircle, Wrench, Package, ChevronDown, ChevronUp,
  Loader2, Filter, RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  getServiceCenterClaims,
  getServiceCenterClaimStats,
  updateServiceCenterClaimStatus,
} from '../../services/serviceCenterService';

const STATUS_CONFIG = {
  AssignedToServiceCenter: { label: 'Assigned', color: 'bg-cyan-100 text-cyan-700', icon: Package },
  InProgress: { label: 'In Repair', color: 'bg-violet-100 text-violet-700', icon: Wrench },
  Repaired: { label: 'Repaired', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  Replaced: { label: 'Replaced', color: 'bg-teal-100 text-teal-700', icon: RefreshCw },
  Closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TRANSITIONS = {
  AssignedToServiceCenter: ['InProgress', 'Rejected'],
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

export function ServiceCenterClaims() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [noteInputs, setNoteInputs] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [claimsRes, statsRes] = await Promise.allSettled([
        getServiceCenterClaims(),
        getServiceCenterClaimStats(),
      ]);
      if (claimsRes.status === 'fulfilled') {
        setClaims(claimsRes.value?.data || []);
      } else if (claimsRes.status === 'rejected') {
        const err = claimsRes.reason;
        const msg = err?.response?.data?.message || err?.message || 'Failed to load claims';
        toast.error(msg);
        setClaims([]);
      }
      if (statsRes.status === 'fulfilled') {
        const res = statsRes.value;
        setStats(res?.data ?? res ?? null);
      } else if (statsRes.status === 'rejected') {
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error(error?.response?.data?.message || 'Failed to load claims');
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (claimId, newStatus) => {
    const note = (noteInputs[claimId] || '').trim();
    if (newStatus === 'Rejected' && !note) {
      toast.error('Please enter a rejection reason (e.g. Warranty expired, Not covered by warranty)');
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        status: newStatus,
        message: note || undefined,
      };
      if (newStatus === 'Rejected') {
        payload.rejection_reason = note;
      }
      if (newStatus === 'Closed') {
        payload.resolution_notes = note || 'Claim resolved and closed';
      }
      await updateServiceCenterClaimStatus(claimId, payload);
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
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-[#1A7FC1]" />
        <h2 className="text-xl font-semibold text-slate-900">Assigned Warranty Claims</h2>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm text-center">
              <p className="text-slate-500 text-xs">{cfg.label}</p>
              <p className="text-lg font-semibold text-slate-800">
                {key === 'AssignedToServiceCenter' ? (stats.assignedToServiceCenter ?? 0) : (stats[key.charAt(0).toLowerCase() + key.slice(1)] ?? 0)}
              </p>
            </div>
          ))}
          <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm text-center col-span-2 sm:col-span-4 lg:col-span-1">
            <p className="text-slate-500 text-xs">Total</p>
            <p className="text-lg font-semibold text-[#1A7FC1]">{stats.total ?? 0}</p>
          </div>
        </div>
      )}

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

      {filteredClaims.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No claims assigned to you yet</p>
          <p className="text-slate-400 text-sm mt-1">When claims are assigned by your provider, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
            const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.AssignedToServiceCenter;
            const StatusIcon = cfg.icon;
            const transitions = TRANSITIONS[claim.status] || [];
            const isExpanded = expandedId === claim.id;

            return (
              <div key={claim.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                      {claim.product_name} · {claim.warranty_code || 'N/A'} · {formatDate(claim.created_at)}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
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
                        <p className="text-slate-400 text-xs">Product</p>
                        <p className="text-slate-800 text-sm">{claim.product_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Category</p>
                        <p className="text-slate-800 text-sm">{claim.issue_category || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Issue Description</p>
                      <p className="text-slate-700 text-sm bg-slate-50 rounded-lg p-3">{claim.issue_description}</p>
                    </div>
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
                    {transitions.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            placeholder={transitions.includes('Rejected') ? "Rejection reason (required) e.g. Warranty expired, Not covered by warranty" : "Add a note (optional)..."}
                            value={noteInputs[claim.id] || ''}
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                            className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {transitions.map((nextStatus) => {
                            const nextCfg = STATUS_CONFIG[nextStatus];
                            const isReject = nextStatus === 'Rejected';
                            const note = (noteInputs[claim.id] || '').trim();
                            const isRejectDisabled = isReject && !note;
                            return (
                              <Button
                                key={nextStatus}
                                size="sm"
                                disabled={isProcessing || isRejectDisabled}
                                onClick={() => handleStatusChange(claim.id, nextStatus)}
                                className={
                                  isReject
                                    ? 'bg-red-500 hover:bg-red-600 text-white text-xs h-8 rounded-lg'
                                    : 'bg-[#1A7FC1] hover:bg-[#166EA8] text-white text-xs h-8 rounded-lg'
                                }
                              >
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

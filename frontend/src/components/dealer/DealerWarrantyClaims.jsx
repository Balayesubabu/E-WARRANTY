import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Search, Eye, Clock, CheckCircle, XCircle, Wrench, Package, Filter } from 'lucide-react';
import { getDealerWarrantyClaims, getDealerWarrantyClaimStats } from '../../services/dealerService';
import { toast } from 'sonner';

const statusConfig = {
  Submitted: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Submitted' },
  Approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Approved' },
  InProgress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Wrench, label: 'In Progress' },
  Repaired: { bg: 'bg-teal-100', text: 'text-teal-700', icon: Wrench, label: 'Repaired' },
  Replaced: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Package, label: 'Replaced' },
  Closed: { bg: 'bg-slate-100', text: 'text-slate-600', icon: CheckCircle, label: 'Closed' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
};

const priorityStyles = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-green-100 text-green-700',
};

export function DealerWarrantyClaims() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedClaim, setSelectedClaim] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [claimsData, statsData] = await Promise.all([
        getDealerWarrantyClaims(),
        getDealerWarrantyClaimStats(),
      ]);
      setClaims(Array.isArray(claimsData) ? claimsData : []);
      setStats(statsData || {});
    } catch (error) {
      toast.error('Failed to load warranty claims');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (claim.customer_name || '').toLowerCase().includes(q) ||
      (claim.product_name || '').toLowerCase().includes(q) ||
      (claim.warranty_code || '').toLowerCase().includes(q) ||
      (claim.issue_description || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Warranty Claims</h2>
        <p className="text-sm text-slate-500 mt-1">
          View warranty claims filed by customers for products you registered
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Submitted', value: stats.submitted || 0, color: 'amber' },
          { label: 'Approved', value: stats.approved || 0, color: 'green' },
          { label: 'In Progress', value: stats.inProgress || 0, color: 'blue' },
          { label: 'Repaired', value: stats.repaired || 0, color: 'teal' },
          { label: 'Replaced', value: stats.replaced || 0, color: 'purple' },
          { label: 'Closed', value: stats.closed || 0, color: 'slate' },
          { label: 'Rejected', value: stats.rejected || 0, color: 'red' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-3 text-center`}
          >
            <p className={`text-2xl font-bold text-${stat.color}-700`}>{stat.value}</p>
            <p className={`text-xs text-${stat.color}-600`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-10 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product, warranty code..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
          >
            <option value="All">All Statuses</option>
            {Object.keys(statusConfig).map((status) => (
              <option key={status} value={status}>
                {statusConfig[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">
            Claims ({filteredClaims.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Claim ID</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Issue</th>
                <th className="text-center px-4 py-3">Priority</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Filed On</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    <AlertTriangle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    {claims.length === 0
                      ? 'No warranty claims found for your products'
                      : 'No claims match your search criteria'}
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const config = statusConfig[claim.status] || statusConfig.Submitted;
                  const StatusIcon = config.icon;
                  return (
                    <tr
                      key={claim.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        WC-{(claim.id || '').slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900 font-medium">{claim.customer_name || '-'}</p>
                        <p className="text-xs text-slate-500">{claim.customer_phone || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{claim.product_name || '-'}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {claim.warranty_code || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-slate-700 truncate" title={claim.issue_description}>
                          {claim.issue_description || '-'}
                        </p>
                        {claim.issue_category && (
                          <p className="text-xs text-slate-500">{claim.issue_category}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            priorityStyles[claim.priority] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {claim.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(claim.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="px-3 h-8 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1] hover:bg-[#1A7FC1]/20 text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold text-slate-900">Claim Details</h3>
                <p className="text-xs text-slate-500">
                  WC-{(selectedClaim.id || '').slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    statusConfig[selectedClaim.status]?.bg || 'bg-slate-100'
                  } ${statusConfig[selectedClaim.status]?.text || 'text-slate-600'}`}
                >
                  {(() => {
                    const Icon = statusConfig[selectedClaim.status]?.icon || Clock;
                    return <Icon className="w-4 h-4" />;
                  })()}
                  {statusConfig[selectedClaim.status]?.label || selectedClaim.status}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    priorityStyles[selectedClaim.priority] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedClaim.priority || 'Medium'} Priority
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="font-medium text-slate-900">{selectedClaim.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{selectedClaim.customer_phone || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{selectedClaim.customer_email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Product Information</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-slate-500">Product</p>
                    <p className="font-medium text-slate-900">{selectedClaim.product_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Warranty Code</p>
                    <p className="font-mono text-slate-900">{selectedClaim.warranty_code || '-'}</p>
                  </div>
                  {selectedClaim.warranty_code_ref && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Serial No</p>
                        <p className="font-mono text-slate-900">
                          {selectedClaim.warranty_code_ref.serial_no || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Warranty Valid Until</p>
                        <p className="text-slate-900">
                          {formatDate(selectedClaim.warranty_code_ref.warranty_to)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Issue Details */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Issue Details</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  {selectedClaim.issue_category && (
                    <div>
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="text-slate-900">{selectedClaim.issue_category}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Description</p>
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {selectedClaim.issue_description || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Timeline</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Filed On</span>
                    <span className="text-slate-900">{formatDate(selectedClaim.created_at)}</span>
                  </div>
                  {selectedClaim.closed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Closed On</span>
                      <span className="text-slate-900">{formatDate(selectedClaim.closed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Claim History */}
              {selectedClaim.claim_history && selectedClaim.claim_history.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Status History</h4>
                  <div className="space-y-2">
                    {selectedClaim.claim_history.map((history, idx) => (
                      <div
                        key={history.id || idx}
                        className="flex items-start gap-3 bg-slate-50 rounded-lg p-3"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 ${
                            statusConfig[history.new_status]?.bg?.replace('bg-', 'bg-') ||
                            'bg-slate-300'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">
                              {history.previous_status
                                ? `${history.previous_status} → ${history.new_status}`
                                : history.new_status}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(history.created_at)}
                            </p>
                          </div>
                          {history.message && (
                            <p className="text-xs text-slate-600 mt-0.5">{history.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              {selectedClaim.resolution_notes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Resolution Notes</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {selectedClaim.resolution_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedClaim.rejection_reason && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Rejection Reason</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {selectedClaim.rejection_reason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

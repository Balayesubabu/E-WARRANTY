import { useState, useEffect, useCallback } from 'react';
import { 
  QrCode, Search, Copy, CheckCircle, Clock, XCircle, 
  Filter, ChevronLeft, ChevronRight, User, Package, Download
} from 'lucide-react';
import { getDealerWarrantyCodes, getDealerWarrantyCodeStats, generateDealerWarrantyQRPDF } from '../../services/dealerService';
import { toast } from 'sonner';

const statusConfig = {
  Active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Active' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' },
  Inactive: { bg: 'bg-slate-100', text: 'text-slate-600', icon: XCircle, label: 'Inactive' },
  Expired: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Expired' },
};

export function DealerWarrantyCodes() {
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCode, setSelectedCode] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const [codesData, statsData] = await Promise.all([
        getDealerWarrantyCodes({ 
          page, 
          limit: 20, 
          status: statusFilter || null,
          search: search || null,
        }),
        getDealerWarrantyCodeStats(),
      ]);
      setCodes(codesData.codes || []);
      setPagination(codesData.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 });
      setStats(statsData || {});
    } catch (error) {
      toast.error('Failed to load warranty codes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchData(newPage);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadQRPDF = async () => {
    try {
      setDownloadLoading(true);
      const toastId = toast.loading("Generating QR codes PDF...");

      const response = await generateDealerWarrantyQRPDF({
        status: statusFilter || null,
        search: search || null,
        print_type: 'A4',
      });

      const pdfData = response?.data?.data || response?.data;
      
      if (pdfData) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${pdfData}`;
        
        const filterInfo = [];
        if (statusFilter) filterInfo.push(statusFilter);
        if (search) filterInfo.push(search.slice(0, 15));
        const filename = `warranty-codes${filterInfo.length > 0 ? '-' + filterInfo.join('-') : ''}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.dismiss(toastId);
        toast.success(`Downloaded ${response?.data?.count || 'all'} warranty codes`);
      } else {
        toast.dismiss(toastId);
        toast.error("Failed to generate PDF");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || "Failed to generate QR PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading && codes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#1A7FC1]" />
            My Warranty Codes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage warranty codes assigned to you
          </p>
        </div>
        <button
          onClick={handleDownloadQRPDF}
          disabled={downloadLoading || codes.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={statusFilter || search ? "Download filtered codes as QR PDF" : "Download all codes as QR PDF"}
        >
          <Download className="w-4 h-4" />
          {downloadLoading ? 'Generating...' : (statusFilter || search ? 'Download Filtered' : 'Download All')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Codes</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total_codes || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active_codes || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending_codes || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Activated</p>
          <p className="text-2xl font-bold text-blue-600">{stats.activated_codes || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Unused</p>
          <p className="text-2xl font-bold text-slate-600">{stats.unused_codes || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, product, or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Codes Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {codes.length === 0 ? (
          <div className="p-12 text-center">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No warranty codes found</p>
            <p className="text-sm text-slate-400 mt-1">
              Codes assigned to you will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Warranty Code</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Product</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Warranty Period</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Assigned On</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {codes.map((code) => {
                    const statusStyle = statusConfig[code.warranty_code_status] || statusConfig.Pending;
                    const StatusIcon = statusStyle.icon;
                    return (
                      <tr 
                        key={code.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedCode(code)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                              {code.warranty_code || '-'}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(code.warranty_code);
                              }}
                              className="p-1 hover:bg-slate-100 rounded transition-colors"
                              title="Copy code"
                            >
                              <Copy className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-800">{code.product_name || '-'}</p>
                            {code.serial_no && (
                              <p className="text-xs text-slate-500">S/N: {code.serial_no}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusStyle.label}
                          </span>
                          {/* {code.is_activated && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                              <User className="w-3 h-3" />
                              Activated
                            </span>
                          )} */}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {code.warranty_period_readable || (code.warranty_days ? `${code.warranty_days} Days` : '-')}
                        </td>
                        <td className="px-4 py-3">
                          {code.customer ? (
                            <div>
                              <p className="text-sm font-medium text-slate-800">{code.customer.customer_name}</p>
                              <p className="text-xs text-slate-500">{code.customer.customer_phone}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Not activated</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(code.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCode(code);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Package className="w-4 h-4 text-slate-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} codes
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-600">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedCode(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Warranty Code Details</h2>
                <button
                  onClick={() => setSelectedCode(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl">
                <code className="text-2xl font-mono font-bold text-[#1A7FC1]">
                  {selectedCode.warranty_code}
                </code>
                <button
                  onClick={() => copyToClipboard(selectedCode.warranty_code)}
                  className="ml-3 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Product</p>
                  <p className="font-medium text-slate-900">{selectedCode.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedCode.warranty_code_status]?.bg} ${statusConfig[selectedCode.warranty_code_status]?.text}`}>
                    {selectedCode.warranty_code_status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Warranty Period</p>
                  <p className="font-medium text-slate-900">
                    {selectedCode.warranty_period_readable || (selectedCode.warranty_days ? `${selectedCode.warranty_days} Days` : '-')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Warranty Type</p>
                  <p className="font-medium text-slate-900">{selectedCode.type || '-'}</p>
                </div>
                {selectedCode.serial_no && (
                  <div>
                    <p className="text-sm text-slate-500">Serial Number</p>
                    <p className="font-medium text-slate-900">{selectedCode.serial_no}</p>
                  </div>
                )}
                {selectedCode.batch && (
                  <div>
                    <p className="text-sm text-slate-500">Batch</p>
                    <p className="font-medium text-slate-900">{selectedCode.batch.batch_name}</p>
                  </div>
                )}
              </div>

              {selectedCode.customer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Registered Customer
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-blue-600">Name</p>
                      <p className="font-medium text-blue-900">{selectedCode.customer.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Phone</p>
                      <p className="font-medium text-blue-900">{selectedCode.customer.customer_phone}</p>
                    </div>
                    {selectedCode.customer.customer_email && (
                      <div className="col-span-2">
                        <p className="text-blue-600">Email</p>
                        <p className="font-medium text-blue-900">{selectedCode.customer.customer_email}</p>
                      </div>
                    )}
                    {selectedCode.customer.activation_date && (
                      <div>
                        <p className="text-blue-600">Activated On</p>
                        <p className="font-medium text-blue-900">{formatDate(selectedCode.customer.activation_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-sm text-slate-500 text-center pt-4">
                Assigned on {formatDate(selectedCode.created_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealerWarrantyCodes;

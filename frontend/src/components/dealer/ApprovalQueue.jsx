import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Check, X, User, Package, Calendar, FileText, ChevronDown, ChevronUp, Loader2, Download, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { getRegisteredCustomers, approveCustomerWarranty, updateCustomerWarranty, downloadCustomerPdf } from '../../services/dealerService';

export function ApprovalQueue() {
  const [expandedId, setExpandedId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getRegisteredCustomers();
      const customersData = response?.data?.registered_customers || response?.data || response || [];

      const transformedRequests = (Array.isArray(customersData) ? customersData : []).map(customer => {
        const warrantyCodeStatus = customer.provider_warranty_code?.warranty_code_status;
        let status = 'approved';
        if (warrantyCodeStatus === 'Pending') {
          status = 'pending';
        } else if (warrantyCodeStatus === 'Cancelled') {
          status = 'rejected';
        }
        return {
          id: customer.id,
          customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || '',
          productName: customer.product_name || customer.provider_warranty_code?.product_name || 'Product',
          serialNumber: customer.serial_number || customer.product_serial || '',
          warrantyCode: customer.warranty_code || customer.provider_warranty_code?.warranty_code || '',
          purchaseDate: customer.purchase_date || customer.created_at,
          invoiceNumber: customer.invoice_number || '',
          requestDate: customer.created_at,
          status: status,
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          country: customer.country || '',
        };
      });

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      if (error?.response?.status !== 404) {
        toast.error('Failed to load approval requests');
      }
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    try {
      setIsProcessing(true);
      const request = requests.find(r => r.id === id);
      setRequests(requests.map(r =>
        r.id === id ? { ...r, status: 'approved' } : r
      ));
      await approveCustomerWarranty(id, request?.warrantyCode);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('Registration approved! Customer notified.');
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Failed to approve registration');
      fetchRequests();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setIsProcessing(true);
      const request = requests.find(r => r.id === id);
      setRequests(requests.map(r =>
        r.id === id ? { ...r, status: 'rejected' } : r
      ));
      await updateCustomerWarranty({
        customer_warranty_id: id,
        warranty_code: request?.warrantyCode,
        is_active: false
      });
      toast.error('Registration rejected. Customer notified.');
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
      fetchRequests();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async (id, customerName) => {
    try {
      toast.info('Generating PDF...');
      const response = await downloadCustomerPdf(id);
      const pdfData = response?.data?.data?.finalString ?? response?.data?.finalString ?? response?.data?.pdf ?? response?.data?.url ?? response?.pdf ?? response?.url;
      if (pdfData) {
        if (pdfData.startsWith('data:') || pdfData.length > 200) {
          const base64 = pdfData.startsWith('data:') ? pdfData : `data:application/pdf;base64,${pdfData}`;
          const link = document.createElement('a');
          link.href = base64;
          link.download = `warranty-${customerName.replace(/\s+/g, '-')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          window.open(pdfData, '_blank');
        }
        toast.success('PDF downloaded successfully!');
      } else {
        toast.error('PDF data not available');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1A7FC1] animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Loading approval requests...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-5 h-5 text-[#1A7FC1]" />
        <h2 className="text-xl font-semibold text-slate-900">Customer Approvals</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Pending</p>
          <p className="text-amber-600 text-2xl font-bold">{pendingRequests.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Approved</p>
          <p className="text-green-600 text-2xl font-bold">{requests.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Rejected</p>
          <p className="text-red-600 text-2xl font-bold">{requests.filter(r => r.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-medium mb-4">Pending Approvals</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-slate-900 font-medium">{request.customerName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">{request.productName}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    {expandedId === request.id ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedId === request.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 mb-4"
                    >
                      <DetailRow icon={User} label="Customer Email" value={request.customerEmail} />
                      <DetailRow icon={User} label="Phone Number" value={request.customerPhone} />
                      <DetailRow icon={Package} label="Serial Number" value={request.serialNumber} />
                      <DetailRow icon={Calendar} label="Purchase Date" value={new Date(request.purchaseDate).toLocaleDateString()} />
                      {request.warrantyCode && <DetailRow icon={FileText} label="Warranty Code" value={request.warrantyCode} mono />}
                      {request.invoiceNumber && <DetailRow icon={FileText} label="Invoice Number" value={request.invoiceNumber} />}
                      {(request.address || request.city || request.state) && (
                        <DetailRow icon={User} label="Address" value={[request.address, request.city, request.state, request.country].filter(Boolean).join(', ')} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(request.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(request.id)}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-medium mb-4">Recently Processed</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {processedRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-slate-900 font-medium">{request.customerName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">{request.productName}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Processed on {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  {request.status === 'approved' && (
                    <Button
                      onClick={() => handleDownloadPdf(request.id, request.customerName)}
                      variant="outline"
                      size="sm"
                      className="border-[#1A7FC1]/30 text-[#1A7FC1] hover:bg-[#1A7FC1]/5 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400">No approval requests yet</p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-slate-400" />
      <div>
        <p className="text-slate-500 text-xs">{label}</p>
        <p className={`text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

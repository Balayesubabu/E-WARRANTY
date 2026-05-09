import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, Check, X, User, Package, Calendar, FileText,
  ChevronDown, ChevronUp, Loader2, StickyNote, FileCheck,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { getRegisteredCustomers, updatePendingToActive, updateCustomerWarranty } from '../../services/staffService';

const getClaimStatus = (customer) => {
  const backendStatus = customer?.provider_warranty_code?.warranty_code_status;
  if (backendStatus === 'Active') return 'approved';
  if (backendStatus === 'Pending') return 'pending';
  if (backendStatus === 'Cancelled') return 'rejected';
  return 'approved';
};

export function WarrantyClaims() {
  const [expandedId, setExpandedId] = useState(null);
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [internalNotes, setInternalNotes] = useState({});

  const fetchClaims = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getRegisteredCustomers();
      const customersData = response?.data?.registered_customers || response?.data || response || [];

      const transformedClaims = (Array.isArray(customersData) ? customersData : []).map(customer => ({
        id: customer.id,
        claimNumber: `WR-${customer.id?.substring(0, 8) || 'N/A'}`,
        customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        productName: customer.product_name || customer.provider_warranty_code?.product_name || 'Product',
        serialNumber: customer.serial_number || customer.provider_warranty_code?.serial_no || '',
        warrantyCode: customer.warranty_code || customer.provider_warranty_code?.warranty_code || '',
        warrantyType: customer.provider_warranty_code?.warranty_period_readable || `${customer.provider_warranty_code?.warranty_days || 0} days`,
        issueDescription: customer.notes || 'Warranty registration request',
        submittedDate: customer.created_at,
        status: getClaimStatus(customer),
        priority: customer.priority || 'medium',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        invoiceNumber: customer.invoice_number || '',
        warrantyImages: customer.warranty_images || [],
        dealerName: customer.dealership_installer_name || '',
        internalNotes: customer.internal_notes || '',
      }));

      setClaims(transformedClaims);
    } catch (error) {
      console.error('Error fetching warranty claims:', error);
      if (error?.response?.status !== 404) toast.error('Failed to load warranty claims');
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleApprove = async (id) => {
    try {
      setIsProcessing(true);
      const claim = claims.find(c => c.id === id);
      if (!claim || claim.status !== 'pending') { toast.error('Only pending claims can be approved'); return; }

      setClaims(claims.map(c => c.id === id ? { ...c, status: 'approved' } : c));

      const payload = { registered_customer_id: id, warranty_code: claim?.warrantyCode };
      await updatePendingToActive(id, claim?.warrantyCode);

      if (internalNotes[id]) {
        await updateCustomerWarranty({ customer_warranty_id: id, warranty_code: claim?.warrantyCode, internal_notes: internalNotes[id] });
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('Warranty claim approved! Customer will be notified.');
    } catch (error) {
      console.error('Error approving claim:', error);
      toast.error('Failed to approve claim');
      fetchClaims();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setIsProcessing(true);
      const claim = claims.find(c => c.id === id);
      if (!claim || claim.status !== 'pending') { toast.error('Only pending claims can be rejected'); return; }

      setClaims(claims.map(c => c.id === id ? { ...c, status: 'rejected' } : c));

      await updateCustomerWarranty({
        customer_warranty_id: id,
        warranty_code: claim?.warrantyCode,
        is_active: false,
        internal_notes: internalNotes[id] || '',
      });
      toast.error('Warranty claim rejected. Customer will be notified.');
    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast.error('Failed to reject claim');
      fetchClaims();
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const processedClaims = claims.filter(c => c.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[#1A7FC1] animate-spin mx-auto" />
      </div>
    );
  }

  const getStatusColor = (s) => {
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const getStatusIcon = (s) => {
    if (s === 'approved') return <Check className="w-4 h-4" />;
    if (s === 'rejected') return <X className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-[#1A7FC1]" />
        <h2 className="text-xl font-semibold text-slate-900">Warranty Claims</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Pending</p>
          <p className="text-amber-600 text-2xl font-bold">{pendingClaims.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Approved</p>
          <p className="text-green-600 text-2xl font-bold">{claims.filter(c => c.status === 'approved').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Rejected</p>
          <p className="text-red-600 text-2xl font-bold">{claims.filter(c => c.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-medium mb-4">Pending Claims</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingClaims.map((claim) => (
              <motion.div key={claim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-slate-900 font-medium">{claim.customerName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                        {getStatusIcon(claim.status)} {claim.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">{claim.claimNumber} | {claim.productName}</p>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === claim.id ? null : claim.id)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                  >
                    {expandedId === claim.id ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedId === claim.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 mb-4">
                      <DetailRow icon={User} label="Email" value={claim.customerEmail} />
                      <DetailRow icon={User} label="Phone" value={claim.customerPhone} />
                      <DetailRow icon={Package} label="Serial Number" value={claim.serialNumber || 'N/A'} />
                      <DetailRow icon={FileText} label="Warranty Code" value={claim.warrantyCode} mono />
                      <DetailRow icon={FileText} label="Warranty Type" value={claim.warrantyType} />
                      <DetailRow icon={FileText} label="Invoice" value={claim.invoiceNumber || 'N/A'} />
                      <DetailRow icon={Calendar} label="Submitted" value={new Date(claim.submittedDate).toLocaleDateString()} />
                      {claim.dealerName && <DetailRow icon={User} label="Dealer" value={claim.dealerName} />}
                      {(claim.address || claim.city) && (
                        <DetailRow icon={User} label="Address" value={[claim.address, claim.city, claim.state, claim.country].filter(Boolean).join(', ')} />
                      )}

                      {/* Product Images */}
                      {claim.warrantyImages.length > 0 && (
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Product / Invoice Images</p>
                          <div className="flex gap-2 flex-wrap">
                            {claim.warrantyImages.map((img, i) => (
                              <a key={i} href={img} target="_blank" rel="noopener noreferrer"
                                className="block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-[#1A7FC1]"
                              >
                                <img src={img} alt={`Img ${i + 1}`} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Internal Notes */}
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <p className="text-amber-800 text-xs font-medium mb-1 flex items-center gap-1">
                          <StickyNote className="w-3 h-3" /> Internal Notes (Staff Only)
                        </p>
                        <textarea
                          value={internalNotes[claim.id] || ''}
                          onChange={(e) => setInternalNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                          placeholder="Add verification notes, approval rationale, or rejection reason..."
                          className="w-full h-20 text-sm border border-amber-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button onClick={() => handleApprove(claim.id)} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Approve
                  </Button>
                  <Button onClick={() => handleReject(claim.id)} disabled={isProcessing} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />} Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Claims */}
      {processedClaims.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-medium mb-4">Recently Processed</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {processedClaims.map((claim) => (
              <motion.div key={claim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-slate-900 font-medium">{claim.customerName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                    {getStatusIcon(claim.status)} {claim.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm">{claim.claimNumber} | {claim.productName}</p>
                <p className="text-slate-400 text-xs mt-1">Processed on {new Date(claim.submittedDate).toLocaleDateString()}</p>
                {claim.internalNotes && (
                  <div className="mt-2 bg-amber-50 rounded-lg p-2 border border-amber-100">
                    <p className="text-amber-800 text-xs"><span className="font-medium">Notes:</span> {claim.internalNotes}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {claims.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400">No warranty claims yet</p>
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

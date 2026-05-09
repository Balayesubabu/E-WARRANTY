import { motion } from 'motion/react';
import { ArrowLeft, Download, Share2, ShieldCheck, Calendar, Package, Building2, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import QRCode from 'react-qr-code';
import { FileClaimModal } from './FileClaimModal';
import { getUserDetails } from '../../services/userService';

export function WarrantyCertificate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFileClaimModal, setShowFileClaimModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserDetails().then(setUser).catch(() => {});
  }, []);
  
  // Get warranty data from route state (passed from CustomerHome)
  const warrantyFromState = location.state?.warranty;
  
  // If no warranty data passed, show a message and redirect option
  if (!warrantyFromState) {
    return (
      <div className="min-h-screen pb-20 bg-slate-50">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 pt-12 pb-16 px-6 lg:px-8 rounded-b-[2rem] shadow-xl">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h2 className="text-white mb-2">Warranty Certificate</h2>
              <p className="text-blue-100">Your digital warranty proof</p>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 mt-8">
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No Warranty Selected</h3>
            <p className="text-slate-500 mb-6">
              Please select a warranty from your dashboard to view its certificate.
            </p>
            <Button
              onClick={() => navigate('/home')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const warranty = {
    id: warrantyFromState.id,
    code: warrantyFromState.warranty_code || 'N/A',
    productName: warrantyFromState.product_name || 'Unknown Product',
    serialNumber: warrantyFromState.serial_number || 'N/A',
    purchaseDate: warrantyFromState.purchase_date,
    expiryDate: warrantyFromState.expiry_date,
    dealer: warrantyFromState.dealer_name || warrantyFromState.company_name || 'N/A',
    owner: warrantyFromState.company_name || 'N/A',
    status: warrantyFromState.status || 'active',
    customerName: warrantyFromState.customer_name || 'N/A',
    invoiceNumber: warrantyFromState.invoice_number || 'N/A',
    phone: warrantyFromState.phone || 'N/A',
    productId: warrantyFromState.product_id || '',
    serviceId: warrantyFromState.service_id || ''
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'from-green-50 to-emerald-50 border-green-200';
      case 'expiring':
        return 'from-amber-50 to-yellow-50 border-amber-200';
      case 'expired':
        return 'from-red-50 to-rose-50 border-red-200';
      default:
        return 'from-green-50 to-emerald-50 border-green-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return { title: 'Verified & Active', subtitle: 'This warranty is officially registered and active', color: 'text-green-900', subColor: 'text-green-700', icon: CheckCircle, iconColor: 'text-green-600' };
      case 'expiring':
        return { title: 'Active - Expiring Soon', subtitle: 'This warranty is valid but will expire soon', color: 'text-amber-900', subColor: 'text-amber-700', icon: AlertCircle, iconColor: 'text-amber-600' };
      case 'expired':
        return { title: 'Expired', subtitle: 'This warranty has expired', color: 'text-red-900', subColor: 'text-red-700', icon: AlertCircle, iconColor: 'text-red-600' };
      default:
        return { title: 'Verified & Authentic', subtitle: 'This warranty is officially registered and verified', color: 'text-green-900', subColor: 'text-green-700', icon: CheckCircle, iconColor: 'text-green-600' };
    }
  };

  const statusInfo = getStatusText(warranty.status);
  const StatusIcon = statusInfo.icon;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.post('/e-warranty/warranty-customer/download-my-certificate', {
        warranty_register_customer_id: warranty.id
      });

      const pdfBase64 = response.data?.data?.finalString ?? response.data?.finalString;

      if (pdfBase64 && typeof pdfBase64 === 'string') {
        const sanitized = pdfBase64.replace(/\s/g, '');
        const byteCharacters = atob(sanitized);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Warranty_Certificate_${String(warranty.code || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Certificate downloaded successfully!');
      } else {
        toast.error('Could not generate certificate PDF');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to download certificate');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Warranty Certificate',
          text: `Warranty Certificate for ${warranty.productName} - Code: ${warranty.code}`,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or share failed
        if (err.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: copy warranty details to clipboard
      const text = `Warranty Certificate\nProduct: ${warranty.productName}\nCode: ${warranty.code}\nValid Until: ${formatDate(warranty.expiryDate)}`;
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Warranty details copied to clipboard!');
      } catch {
        toast.error('Could not copy to clipboard');
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <div className="bg-[#1A7FC1] pt-12 pb-16 px-6 lg:px-8 rounded-b-[2rem] shadow-xl">        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div>
            <h2 className="text-white mb-2">Warranty Certificate</h2>
            <p className="text-blue-100">Your digital warranty proof</p>
          </div>
        </div>
      </div>

      {/* Certificate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-6 lg:px-8 -mt-8 space-y-6"
      >
        {/* Certificate Card */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-center mx-auto mb-4">
              <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
            </div>
            <h2 className="text-slate-900 mb-1">Digital Warranty Certificate</h2>
            <p className="text-slate-500">This certifies the authenticity of your product warranty</p>
          </div>

          {/* Certificate Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Product Name</p>
                  <p className="text-slate-900">{warranty.productName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Serial Number</p>
                  <p className="text-slate-900">{warranty.serialNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Warranty Code</p>
                  <p className="text-slate-900">{warranty.code}</p>
                </div>
              </div>

              {warranty.invoiceNumber && warranty.invoiceNumber !== 'N/A' && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Invoice Number</p>
                    <p className="text-slate-900">{warranty.invoiceNumber}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Purchase Date</p>
                  <p className="text-slate-900">{formatDate(warranty.purchaseDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Valid Until</p>
                  <p className="text-slate-900">{formatDate(warranty.expiryDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Dealer</p>
                  <p className="text-slate-900">{warranty.dealer}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className={`bg-gradient-to-br ${getStatusColor(warranty.status)} rounded-xl p-4 mb-6 border`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-6 h-6 ${statusInfo.iconColor}`} />
              <div>
                <p className={statusInfo.color}>{statusInfo.title}</p>
                <p className={`${statusInfo.subColor} text-sm`}>{statusInfo.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-sm mb-1">Company</p>
            <p className="text-slate-900">{warranty.owner}</p>
          </div>

          {/* Claim History */}
          {warrantyFromState?.claims?.length > 0 && (
            <div className="border-t border-slate-100 pt-6 mt-6">
              <h4 className="text-slate-900 font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                Claim History
              </h4>
              <div className="space-y-4">
                {warrantyFromState.claims.map((claim) => (
                  <div key={claim.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        ['Closed', 'Repaired', 'Replaced'].includes(claim.status) ? 'bg-green-100 text-green-700' :
                        ['Rejected'].includes(claim.status) ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {claim.status?.replace(/([A-Z])/g, ' $1').trim() || claim.status}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : ''}
                      </span>
                      {claim.assigned_service_center?.name && (
                        <span className="text-slate-600 text-xs">@ {claim.assigned_service_center.name}</span>
                      )}
                    </div>
                    {claim.issue_description && (
                      <p className="text-slate-600 text-sm mb-2">{claim.issue_description}</p>
                    )}
                    {claim.status === 'Rejected' && claim.rejection_reason && (
                      <p className="text-red-600 text-sm mb-2 font-medium">Rejection reason: {claim.rejection_reason}</p>
                    )}
                    {(claim.history?.length > 0) && (
                      <div className="space-y-1 text-xs">
                        {claim.history.map((h, idx) => (
                          <div key={idx} className="flex gap-2 text-slate-500">
                            <span className="shrink-0">•</span>
                            <span>{h.message || h.status} — {h.date ? new Date(h.date).toLocaleDateString() : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download Certificate
              </>
            )}
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="h-12 rounded-xl border-cyan-200 text-cyan-600 hover:bg-cyan-50"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Certificate
          </Button>
          {(warranty.status === 'active' || warranty.status === 'expiring') && (
            <Button
              onClick={() => setShowFileClaimModal(true)}
              variant="outline"
              className="h-12 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <FileText className="w-5 h-5 mr-2" />
              File Claim
            </Button>
          )}
        </div>

        {showFileClaimModal && (
          <FileClaimModal
            warranty={warrantyFromState}
            user={user}
            onClose={() => setShowFileClaimModal(false)}
            onSuccess={() => navigate('/home')}
          />
        )}

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h3 className="text-slate-900 mb-4 text-center">Quick Verification</h3>
          <div className="w-52 h-52 mx-auto bg-white rounded-xl flex items-center justify-center p-3">
            <QRCode
              value={`${import.meta.env.VITE_APP_BASE_URL || window.location.origin}/verify?code=${encodeURIComponent(warranty.code)}&provider=${encodeURIComponent(warranty.owner)}`}
              size={180}
              level="H"
              fgColor="#0f172a"
              bgColor="#ffffff"
            />
          </div>
          <p className="text-slate-500 text-sm text-center mt-4">
            Scan this QR code to quickly verify warranty authenticity
          </p>
        </div>
      </motion.div>
    </div>
  );
}

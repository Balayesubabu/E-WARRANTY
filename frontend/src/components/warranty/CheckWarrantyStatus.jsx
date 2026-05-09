import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, ShieldCheck, ShieldX, Clock, Package, 
  Calendar, Building2, ArrowLeft, CheckCircle, XCircle,
  AlertTriangle, Loader2
} from 'lucide-react';
import { verifyByWarrantyCode } from '../../services/warrantyService';
import { toast } from 'sonner';

export function CheckWarrantyStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [warrantyCode, setWarrantyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setWarrantyCode(codeFromUrl.toUpperCase());
      handleCheckWithCode(codeFromUrl);
    }
  }, []);

  const handleCheckWithCode = async (code) => {
    if (!code.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await verifyByWarrantyCode(code.trim());
      // Backend returns { status, message, data } - check status 200 or data.valid
      if (response.status === 200 || response.data?.valid) {
        setResult(response.data);
      } else {
        setError(response.message || 'Warranty code not found');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to verify warranty code';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    
    if (!warrantyCode.trim()) {
      toast.error('Please enter a warranty code');
      return;
    }

    handleCheckWithCode(warrantyCode);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusConfig = (result) => {
    if (!result) return null;
    
    if (result.is_expired) {
      return {
        icon: ShieldX,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Expired',
        message: 'This warranty has expired',
      };
    }
    
    if (!result.is_registered) {
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: 'Not Activated',
        message: 'This warranty code has not been activated yet',
      };
    }
    
    return {
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      label: 'Active',
      message: 'Your warranty is active and valid',
    };
  };

  const statusConfig = result ? getStatusConfig(result) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-[#0c4a6e]">E-Warrantify</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            Check Warranty Status
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Enter your warranty code to check if your product is still under warranty
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 mb-8">
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label htmlFor="warrantyCode" className="block text-sm font-medium text-slate-700 mb-2">
                Warranty Code
              </label>
              <div className="relative">
                <input
                  id="warrantyCode"
                  type="text"
                  value={warrantyCode}
                  onChange={(e) => setWarrantyCode(e.target.value.toUpperCase())}
                  placeholder="Enter warranty code (e.g., WC-XXXXX-XXXXX)"
                  className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] text-lg font-mono tracking-wider"
                  disabled={loading}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !warrantyCode.trim()}
              className="w-full py-3.5 bg-[#0284c7] text-white font-medium rounded-xl hover:bg-[#0369a1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Warranty
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Warranty Not Found</h3>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-500 text-sm mt-2">
                  Please check the warranty code and try again. If you believe this is an error, contact the product provider.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className={`${statusConfig.bg} border ${statusConfig.border} rounded-2xl overflow-hidden`}>
            {/* Status Header */}
            <div className="p-6 border-b border-slate-200/50">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
                  <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-xl font-bold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </h2>
                    {result.days_left > 0 && !result.is_expired && result.is_registered && (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                        {result.days_left} days left
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${statusConfig.color} opacity-80`}>
                    {statusConfig.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warranty Code */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Warranty Code</p>
                    <p className="font-mono font-semibold text-slate-900">{result.warranty_code}</p>
                  </div>
                </div>

                {/* Product */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Package className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Product</p>
                    <p className="font-semibold text-slate-900">{result.product_name || '-'}</p>
                    {result.serial_no && (
                      <p className="text-xs text-slate-500">S/N: {result.serial_no}</p>
                    )}
                  </div>
                </div>

                {/* Warranty Period */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Warranty Period</p>
                    <p className="font-semibold text-slate-900">
                      {result.warranty_period_readable || (result.warranty_days ? `${result.warranty_days} Days` : '-')}
                    </p>
                  </div>
                </div>

                {/* Valid Until */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Valid Until</p>
                    <p className="font-semibold text-slate-900">
                      {result.warranty_to ? formatDate(result.warranty_to) : 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Registration Date */}
                {result.registration_date && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Registration Date</p>
                      <p className="font-semibold text-slate-900">{formatDate(result.registration_date)}</p>
                    </div>
                  </div>
                )}

                {/* Customer Name */}
                {result.customer_name && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Registered To</p>
                      <p className="font-semibold text-slate-900">{result.customer_name}</p>
                    </div>
                  </div>
                )}

                {/* Provider */}
                {result.provider_name && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Provider</p>
                      <p className="font-semibold text-slate-900">{result.provider_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!result.is_registered && !result.is_expired && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Warranty Not Activated</p>
                        <p className="text-sm text-amber-700 mt-1">
                          This warranty code exists but has not been activated yet. 
                          Please scan the QR code on your product or contact the seller to activate your warranty.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        {!result && !error && (
          <div className="text-center text-slate-500 text-sm">
            <p>Can't find your warranty code? Look for it on:</p>
            <ul className="mt-2 space-y-1">
              <li>• The product packaging or warranty card</li>
              <li>• The QR code sticker on your product</li>
              <li>• Your purchase receipt or confirmation email</li>
            </ul>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} E-Warrantify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default CheckWarrantyStatus;

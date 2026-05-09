import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft, Shield, CheckCircle2, Package, Building2,
  Calendar, Clock, User, Mail, Phone, MapPin
} from 'lucide-react';

export function WarrantyDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const customerDetails = location.state?.customerDetails;

  if (!customerDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-sm w-full">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">No Data Found</h2>
          <p className="text-slate-500 text-sm mb-6">Please verify your warranty first to view details.</p>
          <button
            onClick={() => navigate('/verify')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1A7FC1] to-[#3A9FE1] text-white font-medium shadow-lg transition-all"
          >
            Go to Verify
          </button>
        </div>
      </div>
    );
  }

  const getWarrantyStatus = (isExpired, daysLeft) => {
    if (isExpired) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Expired' };
    if (daysLeft !== null && daysLeft <= 30) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: `${daysLeft} days left` };
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700', label: daysLeft !== null ? `${daysLeft} days left` : 'Active' };
  };

  const warranties = customerDetails.warranty_code || [];
  const activeCount = warranties.filter(w => !w.warranty_code_expired).length;
  const expiredCount = warranties.filter(w => w.warranty_code_expired).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F4E78] via-[#1A7FC1] to-[#3A9FE1] pt-10 pb-8 px-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/verify')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-5"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Verify
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">
                Welcome, {customerDetails.first_name}!
              </h1>
              <p className="text-cyan-100 text-sm">Your warranty details</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-white text-2xl font-bold">{warranties.length}</p>
              <p className="text-cyan-100 text-xs">Total</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-green-300 text-2xl font-bold">{activeCount}</p>
              <p className="text-cyan-100 text-xs">Active</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-red-300 text-2xl font-bold">{expiredCount}</p>
              <p className="text-cyan-100 text-xs">Expired</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 -mt-4 space-y-4">
        {/* Customer info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-lg"
        >
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Your Information</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#1A7FC1]" />
              <span className="text-slate-800 text-sm">{customerDetails.first_name} {customerDetails.last_name}</span>
            </div>
            {customerDetails.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#1A7FC1]" />
                <span className="text-slate-800 text-sm">{customerDetails.email}</span>
              </div>
            )}
            {customerDetails.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#1A7FC1]" />
                <span className="text-slate-800 text-sm">{customerDetails.phone}</span>
              </div>
            )}
            {(customerDetails.city || customerDetails.state) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#1A7FC1]" />
                <span className="text-slate-800 text-sm">
                  {[customerDetails.city, customerDetails.state, customerDetails.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Warranty cards */}
        {warranties.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
              Your Warranties
            </h3>
            {warranties.map((wc, idx) => {
              const status = getWarrantyStatus(wc.warranty_code_expired, wc.warrantyDaysLeft);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white rounded-2xl p-5 shadow-lg border ${status.border}`}
                >
                  {/* Product header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${status.bg} flex items-center justify-center`}>
                        <Package className={`w-5 h-5 ${status.text}`} />
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold">{wc.product_name || 'Product'}</p>
                        {wc.provider?.company_name && (
                          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {wc.provider.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Warranty details */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {wc.roll_code && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Warranty Code</p>
                        <p className="text-slate-800 text-sm font-mono font-semibold">{wc.roll_code}</p>
                      </div>
                    )}
                    {wc.warranty_days && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Warranty Period</p>
                        <p className="text-slate-800 text-sm font-semibold">{wc.warranty_days} days</p>
                      </div>
                    )}
                    {wc.warranty_from && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Registered On
                        </p>
                        <p className="text-slate-800 text-sm font-medium">
                          {new Date(wc.warranty_from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {wc.warranty_to && (
                      <div className={`rounded-xl p-3 ${status.bg}`}>
                        <p className={`text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1 ${status.text}`}>
                          <Clock className="w-3 h-3" /> Expires On
                        </p>
                        <p className={`text-sm font-semibold ${status.text}`}>
                          {new Date(wc.warranty_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No warranties found for your account.</p>
          </div>
        )}

        {/* Footer action */}
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="w-full h-12 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

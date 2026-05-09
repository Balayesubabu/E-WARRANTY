import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, ShieldCheck, Loader2, User, Package, Calendar,
  Phone, Mail, MapPin, ChevronDown, ChevronUp, FileText,
  Clock, CheckCircle2, XCircle, AlertCircle, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { getRegisteredCustomers, downloadCustomerPdf } from '../../services/staffService';

const STATUS_MAP = {
  Active: { label: 'Registered', color: 'bg-[#1A7FC1]/15 text-[#1A7FC1]', icon: CheckCircle2 },
  Pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  Expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle },
  Cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600', icon: XCircle },
  Inactive: { label: 'Available', color: 'bg-emerald-100 text-emerald-700', icon: AlertCircle },
};

function getWarrantyStatus(customer) {
  const codeStatus = customer?.provider_warranty_code?.warranty_code_status;
  if (codeStatus === 'Active') return STATUS_MAP.Active;
  if (codeStatus === 'Pending') return STATUS_MAP.Pending;
  if (codeStatus === 'Cancelled') return STATUS_MAP.Cancelled;
  if (codeStatus === 'Expired') return STATUS_MAP.Expired;
  return STATUS_MAP.Inactive;
}

function formatDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function StaffWarrantyLookup() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRegisteredCustomers();
      const raw = response?.data?.registered_customers || response?.data || response || [];
      setCustomers(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Error fetching warranty customers:', error);
      if (error?.response?.status !== 404) toast.error('Failed to load warranty records');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      const status = getWarrantyStatus(c);
      if (statusFilter !== 'all' && status.label.toLowerCase() !== statusFilter) return false;

      if (!q) return true;
      const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const code = (c.warranty_code || c.provider_warranty_code?.warranty_code || '').toLowerCase();
      const product = (c.product_name || c.provider_warranty_code?.product_name || '').toLowerCase();
      const serial = (c.serial_number || c.provider_warranty_code?.serial_no || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || code.includes(q) || product.includes(q) || serial.includes(q);
    });
  }, [customers, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    let registered = 0, available = 0, pending = 0, expired = 0;
    customers.forEach((c) => {
      const s = getWarrantyStatus(c).label;
      if (s === 'Registered') registered++;
      else if (s === 'Available') available++;
      else if (s === 'Pending') pending++;
      else expired++;
    });
    return { total: customers.length, registered, available, pending, expired };
  }, [customers]);

  const handleDownloadPdf = async (customerId, customerName) => {
    try {
      toast.info('Generating PDF...');
      const response = await downloadCustomerPdf(customerId);
      const pdfData = response?.data?.data?.finalString ?? response?.data?.finalString ?? response?.data?.pdf ?? response?.data?.url ?? response?.pdf ?? response?.url;
      if (pdfData) {
        if (pdfData.startsWith('data:') || pdfData.length > 200) {
          const base64 = pdfData.startsWith('data:') ? pdfData : `data:application/pdf;base64,${pdfData}`;
          const link = document.createElement('a');
          link.href = base64;
          link.download = `warranty-${(customerName || 'certificate').replace(/\s+/g, '-')}.pdf`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-[#1A7FC1]" />
          <h2 className="text-xl font-semibold text-slate-900">Warranty Lookup</h2>
        </div>
        <p className="text-slate-500 text-sm">Search any customer's warranty by name, phone, email, or warranty code</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Records" value={counts.total} color="text-[#0F4E78]" />
        <StatCard label="Registered" value={counts.registered} color="text-[#1A7FC1]" />
        {/* <StatCard label="Available" value={counts.available} color="text-emerald-600" /> */}
        <StatCard label="Pending" value={counts.pending} color="text-amber-600" />
        <StatCard label="Expired" value={counts.expired} color="text-red-600" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, warranty code, product, or serial..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1] transition-colors bg-white"
            autoFocus
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]"
        >
          <option value="all">All Statuses</option>
          <option value="registered">Registered</option>
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {searchQuery ? 'No matching warranty records found' : 'No warranty records available'}
          </p>
          {searchQuery && (
            <p className="text-slate-400 text-sm mt-1">Try searching by phone number, email, or warranty code</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isExpanded={expandedId === customer.id}
              onToggle={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
              onDownloadPdf={handleDownloadPdf}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-slate-500 text-xs">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function CustomerCard({ customer, isExpanded, onToggle, onDownloadPdf }) {
  const status = getWarrantyStatus(customer);
  const StatusIcon = status.icon;
  const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
  const product = customer.product_name || customer.provider_warranty_code?.product_name || '-';
  const code = customer.warranty_code || customer.provider_warranty_code?.warranty_code || '-';
  const warrantyDays = customer.provider_warranty_code?.warranty_days;
  const warrantyPeriod = customer.provider_warranty_code?.warranty_period_readable || (warrantyDays ? `${warrantyDays} days` : '-');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-[#1A7FC1]/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-[#1A7FC1]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-slate-900 text-sm">{name}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              <StatusIcon className="w-3 h-3" /> {status.label}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 truncate">
            {product} &middot; <span className="font-mono">{code}</span>
          </p>
        </div>
        <div className="hidden sm:block text-right shrink-0 mr-2">
          <p className="text-xs text-slate-400">Registered</p>
          <p className="text-xs text-slate-600">{formatDate(customer.created_at)}</p>
        </div>
        {isExpanded
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        }
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailItem icon={User} label="Full Name" value={name} />
            <DetailItem icon={Mail} label="Email" value={customer.email || '-'} />
            <DetailItem icon={Phone} label="Phone" value={customer.phone || '-'} />
            <DetailItem icon={Package} label="Product" value={product} />
            <DetailItem icon={FileText} label="Warranty Code" value={code} mono />
            <DetailItem icon={ShieldCheck} label="Warranty Period" value={warrantyPeriod} />
            <DetailItem icon={FileText} label="Serial Number" value={customer.serial_number || customer.provider_warranty_code?.serial_no || '-'} />
            <DetailItem icon={FileText} label="Invoice Number" value={customer.invoice_number || '-'} />
            <DetailItem icon={Calendar} label="Registration Date" value={formatDate(customer.created_at)} />
            {customer.dealership_installer_name && (
              <DetailItem icon={User} label="Dealer" value={customer.dealership_installer_name} />
            )}
            {(customer.address || customer.city) && (
              <DetailItem
                icon={MapPin}
                label="Address"
                value={[customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(', ')}
                className="sm:col-span-2"
              />
            )}
          </div>

          {onDownloadPdf && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onDownloadPdf(customer.id, name)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A7FC1] text-white text-sm font-medium hover:bg-[#1565a8] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </button>
            </div>
          )}

          {customer.warranty_images?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Product / Invoice Images</p>
              <div className="flex gap-2 flex-wrap">
                {customer.warranty_images.map((img, i) => (
                  <a
                    key={i}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-[#1A7FC1] transition-colors"
                  >
                    <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, mono, className = '' }) {
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm text-slate-800 ${mono ? 'font-mono' : ''} break-all`}>{value}</p>
      </div>
    </div>
  );
}

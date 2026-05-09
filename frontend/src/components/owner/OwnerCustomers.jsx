import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  BarChart3,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  X,
  Loader2,
  Eye,
  RefreshCw,
  UserPlus,
  Plus,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCustomerSummary,
  getCustomerList,
  getDealersForFilter,
  registerWarrantyForCustomer,
} from "../../services/ownerCustomerService";

export function OwnerCustomers() {
  const navigate = useNavigate();

  // KPI state
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Table state
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0, totalPages: 0 });
  const [loadingList, setLoadingList] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dealerFilter, setDealerFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Dealers for filter dropdown
  const [dealers, setDealers] = useState([]);

  // Register warranty modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    warranty_code: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    date_of_installation: "",
    invoice_number: "",
    address: "",
    city: "",
    state: "",
    country: "",
    vehicle_number: "",
    vehicle_chassis_number: "",
  });
  const [registerCustomFields, setRegisterCustomFields] = useState([]);
  const customFieldIdRef = useRef(0);

  // Fetch KPI summary
  useEffect(() => {
    let cancelled = false;
    setLoadingSummary(true);
    getCustomerSummary()
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch(() => { if (!cancelled) toast.error("Failed to load customer summary"); })
      .finally(() => { if (!cancelled) setLoadingSummary(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch dealers for filter
  useEffect(() => {
    getDealersForFilter().then(setDealers).catch(() => {});
  }, []);

  // Fetch customer list
  const fetchCustomers = useCallback(async (page = 1) => {
    setLoadingList(true);
    try {
      const result = await getCustomerList({
        page,
        limit: pagination.limit,
        search: search || undefined,
        dealer_id: dealerFilter || undefined,
        region: regionFilter || undefined,
        claim_status: claimStatusFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setCustomers(result.customers || []);
      setPagination((p) => ({ ...p, ...result.pagination }));
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoadingList(false);
    }
  }, [search, dealerFilter, regionFilter, claimStatusFilter, sortBy, sortOrder, pagination.limit]);

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDealerFilter("");
    setRegionFilter("");
    setClaimStatusFilter("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  const hasActiveFilters = search || dealerFilter || regionFilter || claimStatusFilter;

  const openRegisterModal = () => {
    setRegisterForm({
      warranty_code: "",
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      date_of_installation: "",
      invoice_number: "",
      address: "",
      city: "",
      state: "",
      country: "",
      vehicle_number: "",
      vehicle_chassis_number: "",
    });
    setRegisterCustomFields([]);
    setRegisterModalOpen(true);
  };

  const addRegisterCustomField = () => {
    customFieldIdRef.current += 1;
    setRegisterCustomFields((prev) => [
      ...prev,
      { id: customFieldIdRef.current, label: "", value: "" },
    ]);
  };

  const updateRegisterCustomField = (id, field, value) => {
    setRegisterCustomFields((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeRegisterCustomField = (id) => {
    setRegisterCustomFields((prev) => prev.filter((row) => row.id !== id));
  };

  const handleRegisterWarrantySubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.warranty_code?.trim() || !registerForm.first_name?.trim() || !registerForm.last_name?.trim() || !registerForm.phone?.trim() || !registerForm.email?.trim() || !registerForm.date_of_installation) {
      toast.error("Warranty code, first name, last name, phone, email, and installation date are required.");
      return;
    }
    setRegisterSubmitting(true);
    try {
      const payload = {
        warranty_code: registerForm.warranty_code.trim(),
        first_name: registerForm.first_name.trim(),
        last_name: registerForm.last_name.trim(),
        phone: registerForm.phone.trim(),
        email: registerForm.email.trim(),
        date_of_installation: registerForm.date_of_installation,
      };
      if (registerForm.invoice_number?.trim()) payload.invoice_number = registerForm.invoice_number.trim();
      if (registerForm.address?.trim()) payload.address = registerForm.address.trim();
      if (registerForm.city?.trim()) payload.city = registerForm.city.trim();
      if (registerForm.state?.trim()) payload.state = registerForm.state.trim();
      if (registerForm.country?.trim()) payload.country = registerForm.country.trim();
      if (registerForm.vehicle_number?.trim()) payload.vehicle_number = registerForm.vehicle_number.trim();
      if (registerForm.vehicle_chassis_number?.trim()) payload.vehicle_chassis_number = registerForm.vehicle_chassis_number.trim();

      const customFieldValues = {};
      registerCustomFields.forEach((row) => {
        const label = (row.label || "").trim();
        if (label) customFieldValues[label] = (row.value || "").trim();
      });
      if (Object.keys(customFieldValues).length > 0) payload.custom_field_values = customFieldValues;

      const result = await registerWarrantyForCustomer(payload);
      const customerId = result?.created_warranty_customer?.id;
      const accountCreated = result?.account_created;
      toast.success(
        accountCreated
          ? "Warranty registered. Customer account created — they can log in with phone/email (OTP)."
          : "Warranty registered successfully."
      );
      setRegisterModalOpen(false);
      fetchCustomers(1);
      getCustomerSummary().then(setSummary).catch(() => {});
      if (customerId) {
        navigate(`/owner/customers/${customerId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to register warranty.";
      toast.error(msg);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const claimStatuses = ["Submitted", "Approved", "InProgress", "Repaired", "Replaced", "Closed", "Rejected"];

  // KPI card data
  const kpiCards = summary
    ? [
        { label: "Total Customers", value: summary.totalCustomers, icon: Users, color: "bg-blue-500" },
        { label: "Active Warranties", value: summary.activeWarranties, icon: ShieldCheck, color: "bg-emerald-500" },
        { label: "Expired Warranties", value: summary.expiredWarranties, icon: ShieldOff, color: "bg-amber-500" },
        { label: "Claims Raised", value: summary.totalClaims, icon: AlertTriangle, color: "bg-red-500" },
        { label: "Claim Ratio", value: `${summary.claimRatio}%`, icon: BarChart3, color: "bg-purple-500" },
      ]
    : [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Customer Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and analyze your customer base</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={openRegisterModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" /> Register warranty
          </button>
          <button
            onClick={() => { setLoadingSummary(true); getCustomerSummary().then(setSummary).catch(() => toast.error("Refresh failed")).finally(() => setLoadingSummary(false)); fetchCustomers(pagination.page); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Region Distribution 
      {summary?.regionDistribution?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[#1A7FC1]" />
            <h3 className="font-semibold text-slate-700 text-sm">Region-wise Customer Distribution</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.regionDistribution.map((r) => (
              <button
                key={r.region}
                onClick={() => { setRegionFilter(r.region); setShowFilters(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs hover:bg-[#1A7FC1]/10 hover:border-[#1A7FC1]/30 transition-colors"
              >
                <span className="text-slate-700 font-medium">{r.region}</span>
                <span className="text-[#1A7FC1] font-bold">{r.count}</span>
              </button>
            ))}
          </div>
        </div>
      )} */}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, email, serial number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-[#1A7FC1] text-white rounded-lg text-sm hover:bg-[#166EA8] transition-colors">
              Search
            </button>
          </form>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-[#1A7FC1]/10 border-[#1A7FC1]/30 text-[#1A7FC1]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-[#1A7FC1] text-white text-xs flex items-center justify-center">
                {[search, dealerFilter, regionFilter, claimStatusFilter].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Dealer</label>
              <select
                value={dealerFilter}
                onChange={(e) => setDealerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              >
                <option value="">All Dealers</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}{d.city ? ` (${d.city})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Region</label>
              <input
                type="text"
                placeholder="Filter by state or city..."
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Claim Status</label>
              <select
                value={claimStatusFilter}
                onChange={(e) => setClaimStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              >
                <option value="">All Statuses</option>
                {claimStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="sm:col-span-3">
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  <button onClick={() => toggleSort("first_name")} className="flex items-center gap-1 hover:text-[#1A7FC1]">
                    Customer <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Warranty</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Claims</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Dealer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">
                  <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-[#1A7FC1]">
                    Registered <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingList ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No customers found</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {hasActiveFilters ? "Try adjusting your filters" : "Customers will appear here when dealers register warranties"}
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[160px]">{c.name}</p>
                      {c.city && <p className="text-xs text-slate-400">{c.city}{c.state ? `, ${c.state}` : ""}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell truncate max-w-[160px]">{c.email || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 truncate max-w-[140px]">{c.productName}</p>
                      <p className="text-xs text-slate-400">{c.serialNumber}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.warrantyStatus === "Active" ? "bg-emerald-50 text-emerald-700" :
                        c.warrantyStatus === "Pending" ? "bg-amber-50 text-amber-700" :
                        c.warrantyStatus === "Cancelled" ? "bg-red-50 text-red-700" :
                        c.warrantyStatus === "Expired" ? "bg-slate-100 text-slate-600" :
                        "bg-slate-50 text-slate-500"
                      }`}>
                        {c.warrantyStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.totalClaims > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                          {c.totalClaims}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600 truncate max-w-[120px]">{c.dealerName}</td>
                    <td className="px-4 py-3 hidden xl:table-cell text-slate-500 text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {c.isActive ? "Active" : "Cancelled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/owner/customers/${c.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1A7FC1] bg-[#1A7FC1]/5 hover:bg-[#1A7FC1]/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchCustomers(pagination.page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let page;
                if (pagination.totalPages <= 5) {
                  page = i + 1;
                } else if (pagination.page <= 3) {
                  page = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i;
                } else {
                  page = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => fetchCustomers(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      page === pagination.page
                        ? "bg-[#1A7FC1] text-white"
                        : "border border-slate-200 hover:bg-white"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCustomers(pagination.page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Register warranty modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Register warranty for customer</h2>
              <button
                type="button"
                onClick={() => !registerSubmitting && setRegisterModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterWarrantySubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Warranty code *</label>
                  <input
                    type="text"
                    value={registerForm.warranty_code}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, warranty_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    placeholder="e.g. WC-XXX-123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First name *</label>
                  <input
                    type="text"
                    value={registerForm.first_name}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last name *</label>
                  <input
                    type="text"
                    value={registerForm.last_name}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                  <input
                    type="text"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date of installation *</label>
                  <input
                    type="date"
                    value={registerForm.date_of_installation}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, date_of_installation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Invoice number (optional)</label>
                  <input
                    type="text"
                    value={registerForm.invoice_number}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, invoice_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Address (optional)</label>
                  <input
                    type="text"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">City (optional)</label>
                  <input
                    type="text"
                    value={registerForm.city}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">State (optional)</label>
                  <input
                    type="text"
                    value={registerForm.state}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Country (optional)</label>
                  <input
                    type="text"
                    value={registerForm.country}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                  />
                </div>
                {/* <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle number (optional)</label>
                  <input
                    type="text"
                    value={registerForm.vehicle_number}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, vehicle_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                  />
                </div> */}
                {/* <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle chassis (optional)</label>
                  <input
                    type="text"
                    value={registerForm.vehicle_chassis_number}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, vehicle_chassis_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                  />
                </div> */}
              </div>

              {/* Custom fields (optional) - owner-defined key-value pairs */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileText className="w-4 h-4 text-[#1A7FC1]" /> Custom fields (optional)
                  </span>
                  <button
                    type="button"
                    onClick={addRegisterCustomField}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1A7FC1] bg-[#1A7FC1]/10 hover:bg-[#1A7FC1]/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add custom field
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Add your own field name and value
                </p>
                {registerCustomFields.length > 0 && (
                  <div className="space-y-2">
                    {registerCustomFields.map((row) => (
                      <div key={row.id} className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => updateRegisterCustomField(row.id, "label", e.target.value)}
                          placeholder="Field name"
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => updateRegisterCustomField(row.id, "value", e.target.value)}
                          placeholder="Value"
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeRegisterCustomField(row.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          title="Remove field"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Customer will be able to log in with phone or email (OTP) to view this warranty and download the certificate.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  disabled={registerSubmitting}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] text-sm disabled:opacity-50"
                >
                  {registerSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {registerSubmitting ? "Registering…" : "Register warranty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

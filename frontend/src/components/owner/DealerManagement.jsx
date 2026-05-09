import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, UserPlus, Mail, Phone, MapPin, Edit, Trash2, Power, Eye, EyeOff,
  Loader2, Users, UserCheck, UserX, ChevronDown, ChevronUp, ArrowUpDown,
  Building2, CreditCard, Globe, ChevronLeft, ChevronRight, FileText, MoreHorizontal,
  UserCircle, TrendingUp, Package, X, Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { PasswordStrengthMeter } from "../common/PasswordStrengthMeter";
import {
  createDealer, getDealers, statusUpdateDealer, updateDealer, deleteDealer,
} from "../../services/ownerService";
import { dealerRegistrationEmail } from "../../services/emailService";
import Cookies from "js-cookie";
import { sanitizeIndianNationalInput, isValidIndianMobile } from "../../utils/indianMobile";
import {
  isDealerDuplicateError,
  ambiguousEmailPhoneDuplicateHints,
  parseDealerUpdateConflictMessage,
} from "../../utils/ownerDuplicateFeedback";
import { isPasswordStrong, PASSWORD_POLICY_REJECT_MESSAGE, PASSWORD_HINT_TEXT } from "../../utils/passwordPolicy";

const DEALER_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hintCls = "text-emerald-600 text-xs mt-1 font-medium";

const BRAND = "#1A7FC1";
const ITEMS_PER_PAGE = 10;

const STEPS = [
  { num: 1, label: "Business Info" },
  { num: 2, label: "Contact" },
  { num: 3, label: "Territory" },
  { num: 4, label: "Credentials" },
];

export function DealerManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [pendingDeactivateDealer, setPendingDeactivateDealer] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [pendingDeleteDealer, setPendingDeleteDealer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewDealerPassword, setShowNewDealerPassword] = useState(false);
  const [dealerEmailError, setDealerEmailError] = useState("");
  const [dealerPhoneError, setDealerPhoneError] = useState("");
  const [addDuplicateEmailHint, setAddDuplicateEmailHint] = useState("");
  const [addDuplicatePhoneHint, setAddDuplicatePhoneHint] = useState("");
  const [editDuplicateEmailHint, setEditDuplicateEmailHint] = useState("");
  const [editDuplicatePhoneHint, setEditDuplicatePhoneHint] = useState("");
  const [dealers, setDealers] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [addStep, setAddStep] = useState(1);

  const [newDealer, setNewDealer] = useState({
    fullname: "", email: "", phone: "", companyname: "", password: "",
    address: "", pan_number: "", gst_number: "", city: "", state: "",
    country: "India", pin_code: "", country_code: "+91",
  });

  const validateDealerEmail = (value) => {
    const v = String(value ?? "").trim();
    if (!v) {
      setDealerEmailError("");
      return true;
    }
    if (!DEALER_EMAIL_REGEX.test(v)) {
      setDealerEmailError("Please enter a valid email address");
      return false;
    }
    setDealerEmailError("");
    return true;
  };

  const validateDealerPhoneForStep = (digits) => {
    if (!digits || digits.length === 0) {
      setDealerPhoneError("");
      return true;
    }
    if (digits.length !== 10) {
      setDealerPhoneError("Phone must be exactly 10 digits");
      return false;
    }
    if (!isValidIndianMobile(digits)) {
      setDealerPhoneError("Use a valid mobile number");
      return false;
    }
    setDealerPhoneError("");
    return true;
  };

  const fetchDealers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getDealers();
      const dealersData = response?.data ?? [];
      const mappedDealers = dealersData.map((d) => ({
        ...d,
        fullname: d.name || d.fullname,
        phone: d.phone_number || d.phone,
        companyname: d.name || d.companyname,
        active: d.is_active ?? d.active,
        createdAt: d.created_at || d.createdAt,
      }));
      setDealers(mappedDealers);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch dealers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDealers(); }, [fetchDealers]);

  const resetAddForm = () => {
    setNewDealer({
      fullname: "", email: "", phone: "", companyname: "", password: "",
      address: "", pan_number: "", gst_number: "", city: "", state: "",
      country: "India", pin_code: "", country_code: "+91",
    });
    setAddStep(1);
    setShowNewDealerPassword(false);
    setDealerEmailError("");
    setDealerPhoneError("");
    setAddDuplicateEmailHint("");
    setAddDuplicatePhoneHint("");
  };

  const handleAddDealer = async () => {
    if (!newDealer.fullname || !newDealer.email?.trim() || !newDealer.phone || !newDealer.companyname || !newDealer.password) {
      toast.error("Please fill all required fields");
      return;
    }
    const emailTrimmed = newDealer.email.trim();
    if (!DEALER_EMAIL_REGEX.test(emailTrimmed)) {
      setDealerEmailError("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      return;
    }
    const phoneDigits = sanitizeIndianNationalInput(newDealer.phone);
    if (phoneDigits.length !== 10 || !isValidIndianMobile(phoneDigits)) {
      setDealerPhoneError("Use a valid 10-digit mobile number (starts with 6–9)");
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!isPasswordStrong(newDealer.password)) {
      toast.error(PASSWORD_POLICY_REJECT_MESSAGE);
      return;
    }
    try {
      setIsLoading(true);
      setAddDuplicateEmailHint("");
      setAddDuplicatePhoneHint("");
      const dealerEmail = emailTrimmed;
      await createDealer({ ...newDealer, email: emailTrimmed, phone: phoneDigits });
      setIsAddDialogOpen(false);
      resetAddForm();
      toast.success(`Dealer added successfully!`);
      dealerRegistrationEmail({ to: dealerEmail, byEmail: Cookies.get("email") }).catch(() => {});
      fetchDealers();
    } catch (error) {
      const apiMessage = error?.response?.data?.message || "";
      if (isDealerDuplicateError(apiMessage)) {
        const h = ambiguousEmailPhoneDuplicateHints();
        setAddDuplicateEmailHint(h.email);
        setAddDuplicatePhoneHint(h.phone);
        setAddStep(2);
        return;
      }
      toast.error(apiMessage || "Failed to add dealer");
    } finally {
      setIsLoading(false);
    }
  };

  const performDealerStatusUpdate = async (dealer, newStatus, reason) => {
    try {
      const payload = {
        id: dealer.id, name: dealer.fullname || dealer.name, email: dealer.email,
        phone: dealer.phone || dealer.phone_number, address: dealer.address, is_active: newStatus,
      };
      if (reason !== undefined && reason !== null) payload.reason = reason;
      await statusUpdateDealer(payload);
      toast.success(`${dealer.fullname || dealer.name || "Dealer"} ${newStatus ? "activated" : "deactivated"}`);
      fetchDealers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update dealer status");
    }
  };

  const toggleDealerStatus = (dealer) => {
    if (dealer.active) { setPendingDeactivateDealer(dealer); return; }
    performDealerStatusUpdate(dealer, true);
  };

  const handleEditDealer = async () => {
    if (!editingDealer) return;
    const email = String(editingDealer.email ?? "").trim();
    if (!email || !DEALER_EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    const phoneDigits = sanitizeIndianNationalInput(editingDealer.phone);
    if (phoneDigits.length !== 10 || !isValidIndianMobile(phoneDigits)) {
      toast.error("Please enter a valid 10-digit mobile number (starts with 6–9)");
      return;
    }
    try {
      setEditDuplicateEmailHint("");
      setEditDuplicatePhoneHint("");
      await updateDealer({ ...editingDealer, email, phone: phoneDigits });
      toast.success("Dealer updated successfully");
      fetchDealers();
      setIsEditDialogOpen(false);
      setEditingDealer(null);
    } catch (error) {
      const apiMessage = error?.response?.data?.message || "";
      const fromUpdate = parseDealerUpdateConflictMessage(apiMessage);
      if (fromUpdate.email || fromUpdate.phone) {
        setEditDuplicateEmailHint(fromUpdate.email);
        setEditDuplicatePhoneHint(fromUpdate.phone);
        return;
      }
      toast.error(apiMessage || "Failed to update dealer");
    }
  };

  const handleDeleteDealer = async (dealerEmail) => {
    try {
      await deleteDealer(dealerEmail);
      toast.success("Dealer deleted successfully");
      fetchDealers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete dealer");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) { setSortDir(sortDir === "asc" ? "desc" : "asc"); }
    else { setSortField(field); setSortDir("asc"); }
  };

  const normalizedQuery = (searchQuery ?? "").toLowerCase();
  const totalDealers = dealers.length;
  const activeDealers = dealers.filter((d) => d.active === true).length;
  const inactiveDealers = dealers.filter((d) => d.active === false).length;

  const filtered = dealers.filter((d) => {
    const matchesQuery = [d.fullname, d.companyname, d.email, d.phone, d.address, d.city, d.state]
      .some((v) => (v ?? "").toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" && d.active) || (statusFilter === "inactive" && !d.active);
    return matchesQuery && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = (a[sortField] ?? "").toString().toLowerCase();
    const valB = (b[sortField] ?? "").toString().toLowerCase();
    return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#1A7FC1]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1A7FC1]" />;
  };

  const inputCls = "w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1] focus:border-transparent disabled:opacity-50";

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dealer Management</h2>
          <p className="text-slate-500 text-sm">Manage your dealer network and track performance</p>
        </div>
        <Button onClick={() => { resetAddForm(); setIsAddDialogOpen(true); }}
          className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-lg h-10 px-5">
          <Plus className="w-4 h-4 mr-2" /> Add New Dealer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Dealers", value: totalDealers, icon: Users, color: "bg-[#1A7FC1]/10 text-[#1A7FC1]", border: "border-[#1A7FC1]/20" },
          { label: "Active Dealers", value: activeDealers, icon: UserCheck, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-200" },
          { label: "Inactive Dealers", value: inactiveDealers, icon: UserX, color: "bg-red-50 text-red-500", border: "border-red-200" },
          //{ label: "Activation Rate", value: totalDealers > 0 ? `${Math.round((activeDealers / totalDealers) * 100)}%` : "0%", icon: TrendingUp, color: "bg-amber-50 text-amber-600", border: "border-amber-200" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.border} p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-500 text-xs">{s.label}</p>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, email, city..." className="pl-9 h-10" />
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "All", count: totalDealers },
              { key: "active", label: "Active", count: activeDealers },
              { key: "inactive", label: "Inactive", count: inactiveDealers },
            ].map((f) => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.key ? "bg-[#1A7FC1] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-[#1A7FC1]" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No dealers found</p>
            <p className="text-slate-400 text-sm mt-1">Try changing your search or filter</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scroll-touch">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      { key: "fullname", label: "Dealer Name" },
                      { key: "companyname", label: "Company" },
                      { key: "city", label: "City / Territory" },
                      { key: "email", label: "Email" },
                      { key: "phone", label: "Phone" },
                      { key: "active", label: "Status" },
                      { key: "createdAt", label: "Joined" },
                    ].map((col) => (
                      <th key={col.key} onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none">
                        <div className="flex items-center gap-1">
                          {col.label}
                          <SortIcon field={col.key} />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-px">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((dealer) => (
                    <tr key={dealer.id || dealer.email} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/owner/dealer-management/${dealer.id}`)}
                          className="font-medium text-slate-900 hover:text-[#1A7FC1] transition-colors text-left">
                          {dealer.fullname || "-"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{dealer.companyname || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {[dealer.city, dealer.state].filter(Boolean).join(", ") || dealer.address || dealer.pin_code || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{dealer.email}</td>
                      <td className="px-4 py-3 text-slate-600">{dealer.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          dealer.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dealer.active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {dealer.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {dealer.createdAt ? new Date(dealer.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="px-4 py-3 w-px whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/owner/dealer-management/${dealer.id}`)}
                            title="View Profile" className="w-8 h-8 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1] hover:bg-[#1A7FC1]/20 flex items-center justify-center transition-colors">
                            <UserCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditDuplicateEmailHint("");
                              setEditDuplicatePhoneHint("");
                              setEditingDealer({
                                ...dealer,
                                phone: sanitizeIndianNationalInput(dealer.phone ?? dealer.phone_number ?? ""),
                              });
                              setIsEditDialogOpen(true);
                            }}
                            title="Edit" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          <button onClick={() => toggleDealerStatus(dealer)}
                            title={dealer.active ? "Deactivate" : "Activate"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              dealer.active ? "bg-emerald-50 hover:bg-emerald-100" : "bg-red-50 hover:bg-red-100"
                            }`}>
                            <Power className={`w-3.5 h-3.5 ${dealer.active ? "text-emerald-600" : "text-red-500"}`} />
                          </button>
                          <button onClick={() => setPendingDeleteDealer(dealer)}
                            title="Delete" className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} of {sorted.length} dealers
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-slate-400">...</span>}
                      <button onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium ${p === currentPage ? "bg-[#1A7FC1] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── ADD DEALER DIALOG (Multi-Step) ─── */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetAddForm(); setIsAddDialogOpen(open); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0 flex flex-col">
          <div className="px-6 pt-6 border-b border-slate-100 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Dealer</DialogTitle>
              {/* <DialogDescription className="text-slate-500 text-sm">Step {addStep} of 4 — {STEPS[addStep - 1].label}</DialogDescription> */}
            </DialogHeader>
            <div className="flex items-center gap-0 mt-4">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      s.num < addStep ? "bg-[#1A7FC1] text-white" : s.num === addStep ? "bg-[#1A7FC1] text-white ring-2 ring-[#1A7FC1]/20" : "bg-slate-100 text-slate-400"
                    }`}>
                      {s.num < addStep ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span className={`text-[9px] mt-1 font-medium ${s.num <= addStep ? "text-[#1A7FC1]" : "text-slate-400"}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-full h-0.5 -mt-3 ${s.num < addStep ? "bg-[#1A7FC1]" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3 overflow-y-auto flex-1 min-h-0">
            {/* Step 1: Business Info */}
            {addStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Dealer Name *</Label>
                  <input value={newDealer.fullname} onChange={(e) => setNewDealer({ ...newDealer, fullname: e.target.value })}
                    placeholder="e.g. Rajesh Kumar" className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Company Name *</Label>
                  <input value={newDealer.companyname} onChange={(e) => setNewDealer({ ...newDealer, companyname: e.target.value })}
                    placeholder="e.g. Kumar Electronics" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">GST Number</Label>
                    <input value={newDealer.gst_number} onChange={(e) => setNewDealer({ ...newDealer, gst_number: e.target.value })}
                      placeholder="e.g. 29ABCDE1234F1Z5" className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">PAN Number</Label>
                    <input value={newDealer.pan_number} onChange={(e) => setNewDealer({ ...newDealer, pan_number: e.target.value })}
                      placeholder="e.g. ABCDE1234F" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact */}
            {addStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Email *</Label>
                  <input type="email" value={newDealer.email}
                    onChange={(e) => {
                      setAddDuplicateEmailHint("");
                      setNewDealer({ ...newDealer, email: e.target.value });
                      validateDealerEmail(e.target.value);
                    }}
                    placeholder="dealer@company.com"
                    className={`${inputCls} ${dealerEmailError ? "border-red-400" : addDuplicateEmailHint ? "border-emerald-400" : ""}`} />
                  {dealerEmailError && <p className="text-red-500 text-xs mt-1">{dealerEmailError}</p>}
                  {addDuplicateEmailHint ? <p className={hintCls}>{addDuplicateEmailHint}</p> : null}
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Phone Number *</Label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={newDealer.phone}
                    onChange={(e) => {
                      setAddDuplicatePhoneHint("");
                      const digits = sanitizeIndianNationalInput(e.target.value);
                      setNewDealer({ ...newDealer, phone: digits });
                      if (digits.length === 10) validateDealerPhoneForStep(digits);
                      else setDealerPhoneError("");
                    }}
                    placeholder="9876543210"
                    className={`${inputCls} ${dealerPhoneError ? "border-red-400" : addDuplicatePhoneHint ? "border-emerald-400" : ""}`}
                  />
                  {dealerPhoneError && <p className="text-red-500 text-xs mt-1">{dealerPhoneError}</p>}
                  {addDuplicatePhoneHint ? <p className={hintCls}>{addDuplicatePhoneHint}</p> : null}
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Address</Label>
                  <input value={newDealer.address} onChange={(e) => setNewDealer({ ...newDealer, address: e.target.value })}
                    placeholder="" className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 3: Territory */}
            {addStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">City</Label>
                    <input value={newDealer.city} onChange={(e) => setNewDealer({ ...newDealer, city: e.target.value })}
                      placeholder="City" className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">State</Label>
                    <input value={newDealer.state} onChange={(e) => setNewDealer({ ...newDealer, state: e.target.value })}
                      placeholder="State" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Country</Label>
                    <input value={newDealer.country} onChange={(e) => setNewDealer({ ...newDealer, country: e.target.value })}
                      placeholder="Country" className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">PIN Code</Label>
                    <input value={newDealer.pin_code} onChange={(e) => setNewDealer({ ...newDealer, pin_code: e.target.value })}
                      placeholder="560001" className={inputCls} />
                  </div>
                </div>
                {/* <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-[#1A7FC1] text-xs">Territory information helps you track dealer performance by region and assign warranty codes geographically.</p>
                </div> */}
              </div>
            )}

            {/* Step 4: Credentials */}
            {addStep === 4 && (
              <div className="space-y-2">
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-100 space-y-1">
                  <p className="text-amber-700 text-xs">This password will be used by the dealer to log into their portal. Share it securely.</p>
                  <p className="text-amber-800/90 text-xs">{PASSWORD_HINT_TEXT}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Login Email</Label>
                  <input value={newDealer.email} readOnly className={`${inputCls} bg-slate-50 text-slate-500`} />
                </div>
                <div className="relative">
                  <Label className="text-xs font-medium text-slate-600">Password *</Label>
                  <input type={showNewDealerPassword ? "text" : "password"} value={newDealer.password}
                    onChange={(e) => setNewDealer({ ...newDealer, password: e.target.value })}
                    placeholder="Create a secure password" className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowNewDealerPassword((p) => !p)}
                    className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600">
                    {showNewDealerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <PasswordStrengthMeter password={newDealer.password} showHint={false} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pt-5 pb-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-lg shrink-0">
            <button onClick={() => addStep > 1 ? setAddStep(addStep - 1) : setIsAddDialogOpen(false)}
              className="text-sm text-slate-600 hover:text-slate-800 font-medium">
              {addStep > 1 ? "Back" : "Cancel"}
            </button>
            {addStep < 4 ? (
              <Button onClick={() => {
                if (addStep === 1 && (!newDealer.fullname || !newDealer.companyname)) { toast.error("Please fill dealer and company name"); return; }
                if (addStep === 2) {
                  const emailTrim = String(newDealer.email ?? "").trim();
                  const phoneDigits = newDealer.phone || "";
                  if (!emailTrim || !phoneDigits) {
                    toast.error("Please provide email and phone number");
                    return;
                  }
                  if (!validateDealerEmail(newDealer.email)) {
                    toast.error("Please enter a valid email address");
                    return;
                  }
                  if (!validateDealerPhoneForStep(phoneDigits)) {
                    toast.error(
                      phoneDigits.length !== 10
                        ? "Please enter a valid phone number"
                        : "Please enter a valid phone number)",
                    );
                    return;
                  }
                }
                setAddStep(addStep + 1);
              }} className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-9 px-5 rounded-lg text-sm">
                Continue
              </Button>
            ) : (
              <Button onClick={handleAddDealer} disabled={isLoading}
                className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-9 px-5 rounded-lg text-sm">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {isLoading ? "Adding..." : "Add Dealer"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT DEALER DIALOG ─── */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditDuplicateEmailHint("");
            setEditDuplicatePhoneHint("");
          }
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Dealer</DialogTitle>
            <DialogDescription>Update dealer information</DialogDescription>
          </DialogHeader>
          {editingDealer && (
            <div className="max-h-[70vh] overflow-y-auto space-y-4 mt-2 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Dealer Name *</Label>
                  <input value={editingDealer.fullname || ""} onChange={(e) => setEditingDealer({ ...editingDealer, fullname: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Company *</Label>
                  <input value={editingDealer.companyname || ""} onChange={(e) => setEditingDealer({ ...editingDealer, companyname: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Email *</Label>
                  <input
                    type="email"
                    value={editingDealer.email || ""}
                    onChange={(e) => {
                      setEditDuplicateEmailHint("");
                      setEditingDealer({ ...editingDealer, email: e.target.value });
                    }}
                    className={`${inputCls} ${editDuplicateEmailHint ? "border-emerald-400" : ""}`}
                  />
                  {editDuplicateEmailHint ? <p className={hintCls}>{editDuplicateEmailHint}</p> : null}
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Phone *</Label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={editingDealer.phone || ""}
                    onChange={(e) => {
                      setEditDuplicatePhoneHint("");
                      setEditingDealer({
                        ...editingDealer,
                        phone: sanitizeIndianNationalInput(e.target.value),
                      });
                    }}
                    placeholder="9876543210"
                    className={`${inputCls} ${editDuplicatePhoneHint ? "border-emerald-400" : ""}`}
                  />
                  {editDuplicatePhoneHint ? <p className={hintCls}>{editDuplicatePhoneHint}</p> : null}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Address</Label>
                <input value={editingDealer.address || ""} onChange={(e) => setEditingDealer({ ...editingDealer, address: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600">City</Label>
                  <input value={editingDealer.city || ""} onChange={(e) => setEditingDealer({ ...editingDealer, city: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">State</Label>
                  <input value={editingDealer.state || ""} onChange={(e) => setEditingDealer({ ...editingDealer, state: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600">GST Number</Label>
                  <input value={editingDealer.gst_number || ""} onChange={(e) => setEditingDealer({ ...editingDealer, gst_number: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">PAN Number</Label>
                  <input value={editingDealer.pan_number || ""} onChange={(e) => setEditingDealer({ ...editingDealer, pan_number: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
              <Button onClick={handleEditDealer} className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-10 rounded-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit className="w-4 h-4 mr-2" />}
                {isLoading ? "Updating..." : "Update Dealer"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── DEACTIVATE CONFIRMATION ─── */}
      <Dialog open={Boolean(pendingDeactivateDealer)} onOpenChange={(open) => { if (!open) { setPendingDeactivateDealer(null); setDeactivateReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Dealer</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <span className="font-medium text-slate-700">{pendingDeactivateDealer?.fullname || "this dealer"}</span>?
              They will not be able to access their portal until reactivated.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <Label htmlFor="deactivate-reason" className="text-sm text-slate-600">Reason (optional)</Label>
            <textarea
              id="deactivate-reason"
              placeholder="e.g. Contract ended, policy violation..."
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              className="mt-1 w-full min-h-[72px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1] focus:ring-1 focus:ring-[#1A7FC1]/30 resize-y"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setPendingDeactivateDealer(null); setDeactivateReason(""); }}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
              if (!pendingDeactivateDealer) return;
              await performDealerStatusUpdate(pendingDeactivateDealer, false, deactivateReason.trim() || undefined);
              setPendingDeactivateDealer(null);
              setDeactivateReason("");
            }}>Deactivate</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION ─── */}
      <Dialog open={Boolean(pendingDeleteDealer)} onOpenChange={(open) => { if (!open) setPendingDeleteDealer(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Dealer</DialogTitle>
            <DialogDescription>
              This permanently removes <span className="font-medium text-slate-700">{pendingDeleteDealer?.fullname || "this dealer"}</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPendingDeleteDealer(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
              if (!pendingDeleteDealer?.email) return;
              await handleDeleteDealer(pendingDeleteDealer.email);
              setPendingDeleteDealer(null);
            }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

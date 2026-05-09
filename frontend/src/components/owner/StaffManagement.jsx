import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Search, UserPlus, Eye, EyeOff, Loader2, Power, Edit, Users,
  ShieldCheck, CreditCard, MapPin, Headphones, ArrowUpDown, ChevronLeft,
  ChevronRight, X, UserCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { PasswordStrengthMeter } from "../common/PasswordStrengthMeter";
import {
  createStaff, updateStaff, getFranchiseId, getAllStaffEnhanced,
  getDealersForAssignment, assignDealersToStaff,
} from "../../services/staffService";
import { useNavigate } from "react-router-dom";
import { sanitizeIndianNationalInput, isValidIndianMobile } from "../../utils/indianMobile";
import {
  isStaffCreateDuplicateError,
  ambiguousEmailPhoneDuplicateHints,
  parseStaffUpdateConflictMessage,
} from "../../utils/ownerDuplicateFeedback";
import { isPasswordStrong, PASSWORD_POLICY_REJECT_MESSAGE, PASSWORD_HINT_TEXT } from "../../utils/passwordPolicy";

const STAFF_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hintCls = "text-emerald-600 text-xs mt-1 font-medium";

// E-Warranty abilities (sub-module IDs from seed)
const STAFF_ABILITIES = [
  { sub_module_id: "550e8400-e29b-41d4-a716-446655440121", module_id: "550e8400-e29b-41d4-a716-446655440008", label: "Generate QR Codes" },
  { sub_module_id: "550e8400-e29b-41d4-a716-446655440125", module_id: "550e8400-e29b-41d4-a716-446655440008", label: "Warranty Settings" },
  { sub_module_id: "550e8400-e29b-41d4-a716-446655440122", module_id: "550e8400-e29b-41d4-a716-446655440008", label: "Create / Manage Dealers" },
  { sub_module_id: "550e8400-e29b-41d4-a716-446655440123", module_id: "550e8400-e29b-41d4-a716-446655440008", label: "Warranty Registration" },
  { sub_module_id: "550e8400-e29b-41d4-a716-446655440124", module_id: "550e8400-e29b-41d4-a716-446655440008", label: "View Active Customers" },
];

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin", icon: ShieldCheck, desc: "Full system access" },
  { value: "Manager", label: "Manager", icon: Users, desc: "Full operational access" },
  { value: "ClaimsManager", label: "Claims Manager", icon: Users, desc: "View & approve claims" },
  { value: "Finance", label: "Finance", icon: CreditCard, desc: "Ledger & payments" },
  { value: "RegionalManager", label: "Regional Manager", icon: MapPin, desc: "Region-scoped access" },
  { value: "Support", label: "Support", icon: Headphones, desc: "Tickets & limited claims" },
  { value: "Superviser", label: "Supervisor", icon: Users, desc: "Monitoring & read access" },
  { value: "Staff", label: "Staff", icon: Users, desc: "Basic operations" },
];







const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", badge: "bg-green-100 text-green-700" },
  { value: "ON_LEAVE", label: "On Leave", badge: "bg-amber-100 text-amber-700" },
  { value: "SUSPENDED", label: "Suspended", badge: "bg-red-100 text-red-700" },
];

const DEPT_OPTIONS = ["Operations", "Sales", "Finance", "Support", "IT", "Management", "Logistics"];

const COUNTRY_OPTIONS = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bahrain", "Bangladesh",
  "Belgium", "Brazil", "Bulgaria", "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia",
  "Czech Republic", "Denmark", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Germany",
  "Ghana", "Greece", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia",
  "Lebanon", "Lithuania", "Malaysia", "Mexico", "Morocco", "Nepal", "Netherlands", "New Zealand",
  "Nigeria", "Norway", "Oman", "Pakistan", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Vietnam", "Zimbabwe",
];

const emptyForm = {
  name: "", email: "", phone: "", address: "", password: "", designation :"",
  role_type: "Staff", department_id: "", employee_id: "", department: "",
  region: "", reports_to_id: "", staff_status: "ACTIVE",
  force_password_reset: true, two_factor_enabled: false,
  sub_module_ids_permissions: [], assigned_dealer_ids: [],
};

const inputClass = "mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1] focus:ring-1 focus:ring-[#1A7FC1]/30";
const selectClass = "mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1] focus:ring-1 focus:ring-[#1A7FC1]/30 bg-white";
const labelClass = "text-sm font-medium text-slate-700";

export function StaffManagement() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPw, setShowPw] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const [addDuplicateEmailHint, setAddDuplicateEmailHint] = useState("");
  const [addDuplicatePhoneHint, setAddDuplicatePhoneHint] = useState("");
  const [editDuplicateEmailHint, setEditDuplicateEmailHint] = useState("");
  const [editDuplicatePhoneHint, setEditDuplicatePhoneHint] = useState("");

  const franchiseId = getFranchiseId();

  const fetchData = useCallback(async () => {
    if (!franchiseId) return;
    try {
      const [staffData, dealerData] = await Promise.all([
        getAllStaffEnhanced(),
        getDealersForAssignment().catch(() => []),
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setDealers(Array.isArray(dealerData) ? dealerData : []);
    } catch (err) {
      toast.error("Failed to load staff data");
    }
  }, [franchiseId]);

  useEffect(() => { if (franchiseId) fetchData(); }, [franchiseId, fetchData]);

  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.is_active !== false && s.staff_status !== "SUSPENDED").length;
    const inactive = staff.filter((s) => s.is_active === false || s.staff_status === "SUSPENDED").length;
    const byRole = {};
    ROLE_OPTIONS.forEach((r) => { byRole[r.value] = staff.filter((s) => s.role_type === r.value).length; });
    return { total, active, inactive, byRole };
  }, [staff]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return staff
      .filter((s) => {
        const matchQ = !q || [s.name, s.email, s.phone, s.employee_id, s.designation, s.region, s.department].some((v) => (v || "").toLowerCase().includes(q));
        const matchRole = roleFilter === "All" || s.role_type === roleFilter;
        const matchDept = deptFilter === "All" || (s.department || "").toLowerCase() === deptFilter.toLowerCase();
        const matchStatus = statusFilter === "All" ||
          (statusFilter === "Active" && s.is_active !== false && s.staff_status !== "SUSPENDED" && s.staff_status !== "ON_LEAVE") ||
          (statusFilter === "On Leave" && s.staff_status === "ON_LEAVE") ||
          (statusFilter === "Suspended" && (s.staff_status === "SUSPENDED" || s.is_active === false));
        return matchQ && matchRole && matchDept && matchStatus;
      })
      .sort((a, b) => {
        let va = a[sortKey] || "", vb = b[sortKey] || "";
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
  }, [staff, searchQuery, roleFilter, deptFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleFormChange = (field, value) => {
    if (field === "email") setAddDuplicateEmailHint("");
    if (field === "phone") setAddDuplicatePhoneHint("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field, value) => {
    if (field === "email") setEditDuplicateEmailHint("");
    if (field === "phone") setEditDuplicatePhoneHint("");
    setEditingStaff((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddWizardNext = () => {
    if (formStep === 1) {
      const name = (form.name || "").trim();
      const email = (form.email || "").trim();
      const phoneDigits = sanitizeIndianNationalInput(form.phone);
      if (!name) {
        toast.error("Please enter full name");
        return;
      }
      if (!email || !STAFF_EMAIL_REGEX.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (phoneDigits.length !== 10 || !isValidIndianMobile(phoneDigits)) {
        toast.error("Please enter a valid mobile number");
        return;
      }
      setForm((prev) => ({ ...prev, name, email, phone: phoneDigits }));
      setFormStep(2);
      return;
    }
    if (formStep === 2) {
      if (!form.role_type || !String(form.role_type).trim()) {
        toast.error("Please select a role");
        return;
      }
      setFormStep(3);
      return;
    }
    if (formStep === 3) {
      setFormStep(4);
    }
  };

  const handleAdd = async () => {
    const name = (form.name || "").trim();
    const email = (form.email || "").trim();
    const phoneDigits = sanitizeIndianNationalInput(form.phone);
    if (!name) {
      toast.error("Please enter full name");
      return;
    }
    if (!email || !STAFF_EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (phoneDigits.length !== 10 || !isValidIndianMobile(phoneDigits)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!form.password?.trim()) {
      toast.error("Please set a temporary password");
      return;
    }
    if (!isPasswordStrong(form.password)) {
      toast.error(PASSWORD_POLICY_REJECT_MESSAGE);
      return;
    }
    setIsLoading(true);
    try {
      setAddDuplicateEmailHint("");
      setAddDuplicatePhoneHint("");
      await createStaff({
        ...form,
        name,
        email,
        phone: phoneDigits,
        sub_module_ids_permissions: form.sub_module_ids_permissions || [],
      });
      toast.success("Staff created successfully");
      setShowAddForm(false); setForm({ ...emptyForm }); setFormStep(1);
      fetchData();
    } catch (err) {
      const apiMessage = err?.response?.data?.message || "";
      if (isStaffCreateDuplicateError(apiMessage)) {
        const h = ambiguousEmailPhoneDuplicateHints();
        setAddDuplicateEmailHint(h.email);
        setAddDuplicatePhoneHint(h.phone);
        setFormStep(1);
        return;
      }
      toast.error(apiMessage || "Failed to create staff");
    } finally { setIsLoading(false); }
  };

  const openEdit = (s) => {
    setEditDuplicateEmailHint("");
    setEditDuplicatePhoneHint("");
    setEditingStaff({
      ...s,
      phone: sanitizeIndianNationalInput(s.phone || ""),
      department: s.department || "",
      region: s.region || "",
      employee_id: s.employee_id || "",
      reports_to_id: s.reports_to_id || "",
      staff_status: s.staff_status || "ACTIVE",
      force_password_reset: s.force_password_reset || false,
      two_factor_enabled: s.two_factor_enabled || false,
      sub_module_ids_permissions: s.StaffRolePermission || [],
      assigned_dealer_ids: (s.dealer_assignments || []).map((da) => da.dealer?.id || da.dealer_id),
    });
    setShowEditForm(true);
  };

  const handleEdit = async () => {
    if (!editingStaff?.id) return;
    const name = (editingStaff.name || "").trim();
    const email = (editingStaff.email || "").trim();
    const phoneDigits = sanitizeIndianNationalInput(editingStaff.phone);
    if (!name) {
      toast.error("Please enter full name");
      return;
    }
    if (!email || !STAFF_EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (phoneDigits.length !== 10 || !isValidIndianMobile(phoneDigits)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsLoading(true);
    try {
      setEditDuplicateEmailHint("");
      setEditDuplicatePhoneHint("");
      await updateStaff(editingStaff.id, {
        ...editingStaff,
        name,
        email,
        phone: phoneDigits,
        sub_module_ids_permissions: editingStaff.sub_module_ids_permissions || [],
      });
      if (editingStaff.assigned_dealer_ids) {
        await assignDealersToStaff(editingStaff.id, editingStaff.assigned_dealer_ids).catch(() => {});
      }
      toast.success("Staff updated successfully");
      setShowEditForm(false); setEditingStaff(null);
      fetchData();
    } catch (err) {
      const apiMessage = err?.response?.data?.message || "";
      const conflict = parseStaffUpdateConflictMessage(apiMessage);
      if (conflict.email || conflict.phone) {
        setEditDuplicateEmailHint(conflict.email);
        setEditDuplicatePhoneHint(conflict.phone);
        return;
      }
      toast.error(apiMessage || "Failed to update staff");
    } finally { setIsLoading(false); }
  };

  const toggleStatus = async (s) => {
    setIsLoading(true);
    try {
      const nextActive = s.is_active === false;
      await updateStaff(s.id, {
        ...s, is_active: nextActive, is_deleted: s.is_deleted ?? false,
        staff_status: nextActive ? "ACTIVE" : "SUSPENDED",
        sub_module_ids_permissions: s.StaffRolePermission || [],
      });
      if (nextActive) {
        toast.success(`${s.name} activated`);
      } else {
        toast.error(`${s.name} deactivated`);
      }
      fetchData();
    } catch { toast.error("Failed to update status"); }
    finally { setIsLoading(false); setPendingDeactivate(null); }
  };

  const getStatusBadge = (s) => {
    if (s.staff_status === "SUSPENDED" || s.is_active === false) return STATUS_OPTIONS[2];
    if (s.staff_status === "ON_LEAVE") return STATUS_OPTIONS[1];
    return STATUS_OPTIONS[0];
  };

  if (!franchiseId) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-md max-w-md text-center">
          <p className="text-slate-600 mb-4">Please log in as owner to manage staff.</p>
          <Button onClick={() => navigate("/home")} variant="outline">Back to Home</Button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Staff", value: stats.total, color: "bg-slate-100 text-slate-700" },
    { label: "Active", value: stats.active, color: "bg-green-50 text-green-700" },
    { label: "Inactive", value: stats.inactive, color: "bg-red-50 text-red-600" },
  ];


  const renderStepIndicator = (currentStep) => (
    <div className="flex items-center gap-2 mb-5">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= s ? "bg-[#1A7FC1] text-white" : "bg-slate-100 text-slate-400"}`}>{s}</div>
          {s < 4 && <div className={`w-8 h-0.5 ${currentStep > s ? "bg-[#1A7FC1]" : "bg-slate-200"}`} />}
        </div>
      ))}
      <span className="ml-2 text-xs text-slate-500">
        {currentStep === 1 ? "Basic Info" : currentStep === 2 ? "Role & Access" : currentStep === 3 ? "Assignment" : "Security"}
      </span>
    </div>
  );

  const renderBasicInfoFields = (data, onChange, opts = {}) => {
    const { duplicateEmailHint = "", duplicatePhoneHint = "" } = opts;
    return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input type="text" value={data.name} onChange={(e) => onChange("name", e.target.value)} placeholder="John Doe" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Employee ID</label>
          <input type="text" value={data.employee_id || ""} onChange={(e) => onChange("employee_id", e.target.value)} placeholder="EMP-001" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="staff@company.com"
            className={`${inputClass} ${duplicateEmailHint ? "border-emerald-400" : ""}`}
          />
          {duplicateEmailHint ? <p className={hintCls}>{duplicateEmailHint}</p> : null}
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={data.phone || ""}
            onChange={(e) => onChange("phone", sanitizeIndianNationalInput(e.target.value))}
            placeholder="9876543210"
            className={`${inputClass} ${duplicatePhoneHint ? "border-emerald-400" : ""}`}
          />
          {duplicatePhoneHint ? <p className={hintCls}>{duplicatePhoneHint}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Address</label>
          <input type="text" value={data.address} onChange={(e) => onChange("address", e.target.value)} placeholder="123 Street, City" className={inputClass} />
        </div>
        {/* <div>
          <label className={labelClass}>Designation</label>
          <input type="text" value={data.designation || ""} onChange={(e) => onChange("designation", e.target.value)} placeholder="Sr. Claims Officer" className={inputClass} />
        </div> */}
      </div>
    </div>
    );
  };

  const renderRoleAccessFields = (data, onChange) => {
    const perms = data.sub_module_ids_permissions || [];
    const knownIds = new Set(STAFF_ABILITIES.map((a) => a.sub_module_id));
    const otherPerms = perms.filter((p) => {
      const id = p.sub_module_id || p.subModuleId;
      return id && !knownIds.has(id);
    });
    const isSelected = (subModuleId) =>
      perms.some((p) => (p.sub_module_id || p.subModuleId) === subModuleId);
    const toggleAbility = (ability, checked) => {
      const current = perms.filter((p) => knownIds.has(p.sub_module_id || p.subModuleId));
      let next;
      if (checked) {
        next = [
          ...current.filter((p) => (p.sub_module_id || p.subModuleId) !== ability.sub_module_id),
          { sub_module_id: ability.sub_module_id, module_id: ability.module_id, access_type: "Write" },
        ];
      } else {
        next = current.filter((p) => (p.sub_module_id || p.subModuleId) !== ability.sub_module_id);
      }
      onChange("sub_module_ids_permissions", [...otherPerms, ...next]);
    };
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Role *</label>
            <select value={data.role_type} onChange={(e) => onChange("role_type", e.target.value)} className={selectClass}>
              {/* {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)} */}
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <select value={data.department || ""} onChange={(e) => onChange("department", e.target.value)} className={selectClass}>
              <option value="">Select Department</option>
              {DEPT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {/* <div>
            <label className={labelClass}>Status</label>
            <select value={data.staff_status || "ACTIVE"} onChange={(e) => onChange("staff_status", e.target.value)} className={selectClass}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div> */}
        </div>
        <div>
          <label className={labelClass}>Abilities</label>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">Select what this staff member can do. Staff can only perform actions you enable here.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            {STAFF_ABILITIES.map((ab) => (
              <label key={ab.sub_module_id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected(ab.sub_module_id)}
                  onChange={(e) => toggleAbility(ab, e.target.checked)}
                  className="rounded border-slate-300 text-[#1A7FC1] focus:ring-[#1A7FC1]"
                />
                <span className="text-sm text-slate-700">{ab.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAssignmentFields = (data, onChange) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Assigned Region</label>
          <select value={data.region || ""} onChange={(e) => onChange("region", e.target.value)} className={selectClass}>
            <option value="">Select country</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Reports To</label>
          <select value={data.reports_to_id || ""} onChange={(e) => onChange("reports_to_id", e.target.value)} className={selectClass}>
            <option value="">None</option>
            {staff.filter((s) => s.id !== data.id).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role_type})</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Assigned Dealers</label>
        <div className="mt-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
          {dealers.length === 0 ? <p className="text-xs text-slate-400 p-2">No dealers available</p> : (
            dealers.map((d) => (
              <label key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-sm cursor-pointer">
                <input type="checkbox" checked={(data.assigned_dealer_ids || []).includes(d.id)}
                  onChange={(e) => {
                    const ids = data.assigned_dealer_ids || [];
                    onChange("assigned_dealer_ids", e.target.checked ? [...ids, d.id] : ids.filter((i) => i !== d.id));
                  }}
                  className="rounded border-slate-300 text-[#1A7FC1]" />
                <span>{d.name}</span>
                {d.city && <span className="text-xs text-slate-400">({d.city})</span>}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurityFields = (data, onChange, isEdit) => (
    <div className="space-y-3">
      {!isEdit && (
        <div>
          <label className={labelClass}>Temporary Password *</label>
          <p className="text-xs text-slate-500 mt-0.5 mb-1">{PASSWORD_HINT_TEXT}</p>
          <div className="relative mt-1">
            <input type={showPw ? "text" : "password"} value={data.password} onChange={(e) => onChange("password", e.target.value)}
              placeholder="********" className="w-full h-10 px-3 pr-12 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1] focus:ring-1 focus:ring-[#1A7FC1]/30" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={data.password} showHint={false} />
        </div>
      )}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={data.force_password_reset} onChange={(e) => onChange("force_password_reset", e.target.checked)} className="rounded border-slate-300 text-[#1A7FC1]" />
          Force password reset on first login
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={data.two_factor_enabled} onChange={(e) => onChange("two_factor_enabled", e.target.checked)} className="rounded border-slate-300 text-[#1A7FC1]" />
          Enable two-factor authentication
        </label>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Staff Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage team, roles, and operational assignments</p>
        </div>
        <button onClick={() => {
          setAddDuplicateEmailHint("");
          setAddDuplicatePhoneHint("");
          setForm({ ...emptyForm });
          setFormStep(1);
          setShowAddForm(true);
        }}
          className="h-10 px-4 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] flex items-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className={`rounded-xl border border-slate-200 p-3 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs mt-0.5 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-10 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Search by name, email, phone, employee ID, region..." className="bg-transparent outline-none text-sm w-full" />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  { key: "name", label: "Staff Name" }, { key: "employee_id", label: "Emp ID" },
                  { key: "role_type", label: "Role" }, { key: "department", label: "Department" },
                  { key: "region", label: "Region" }, { key: null, label: "Dealers" },
                  { key: "staff_status", label: "Status" },
                  { key: null, label: "Actions" },
                ].map((col) => (
                  <th key={col.label} onClick={col.key ? () => toggleSort(col.key) : undefined}
                    className={`text-left px-4 py-3 ${col.key ? "cursor-pointer hover:text-slate-700 select-none" : ""}`}>
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.key && <ArrowUpDown className="w-3 h-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No staff found
                </td></tr>
              ) : (
                paged.map((s) => {
                  const statusBadge = getStatusBadge(s);
                  return (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.employee_id || "—"}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-[#1A7FC1]/10 text-[#1A7FC1] font-medium">{s.role_type}</span></td>
                      <td className="px-4 py-3 text-slate-600">{s.department || s.department_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{s.region || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{s.dealer_assignments?.length || 0}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.badge}`}>{statusBadge.label}</span></td>
                      <td className="px-4 py-3 w-px whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/owner/staff/${s.id}`)} className="w-8 h-8 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1] hover:bg-[#1A7FC1]/20 flex items-center justify-center" title="View"><UserCircle className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center" title="Edit"><Edit className="w-3.5 h-3.5 text-slate-600" /></button>
                          <button onClick={() => { const isActive = s.is_active !== false; isActive ? setPendingDeactivate(s) : toggleStatus(s); }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.is_active !== false ? "bg-green-100" : "bg-red-100"}`}
                            title={s.is_active !== false ? "Deactivate" : "Activate"}>
                            <Power className={`w-3.5 h-3.5 ${s.is_active !== false ? "text-green-700" : "text-red-700"}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <p className="text-slate-500">{filtered.length} staff · Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Add New Staff</h3>
              <button type="button" onClick={() => {
                setShowAddForm(false);
                setAddDuplicateEmailHint("");
                setAddDuplicatePhoneHint("");
              }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6">
              {/* {renderStepIndicator(formStep)} */}

              {formStep === 1 && renderBasicInfoFields(form, handleFormChange, {
                duplicateEmailHint: addDuplicateEmailHint,
                duplicatePhoneHint: addDuplicatePhoneHint,
              })}
              {formStep === 2 && renderRoleAccessFields(form, handleFormChange)}
              {formStep === 3 && renderAssignmentFields(form, handleFormChange)}
              {formStep === 4 && renderSecurityFields(form, handleFormChange, false)}

              <div className="flex justify-between pt-6">
                {formStep > 1 ? (
                  <button onClick={() => setFormStep(formStep - 1)} className="h-10 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Back</button>
                ) : <div />}
                {formStep < 4 ? (
                  <button type="button" onClick={handleAddWizardNext} className="h-10 px-6 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm">Next</button>
                ) : (
                  <button onClick={handleAdd} disabled={isLoading} className="h-10 px-6 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm disabled:opacity-50 flex items-center gap-2">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add Staff
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditForm && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Edit Staff — {editingStaff.name}</h3>
              <button type="button" onClick={() => {
                setShowEditForm(false);
                setEditDuplicateEmailHint("");
                setEditDuplicatePhoneHint("");
              }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-600 border-b pb-1 mb-3">Basic Information</p>
                {renderBasicInfoFields(editingStaff, handleEditChange, {
                  duplicateEmailHint: editDuplicateEmailHint,
                  duplicatePhoneHint: editDuplicatePhoneHint,
                })}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 border-b pb-1 mb-3">Role & Access</p>
                {renderRoleAccessFields(editingStaff, handleEditChange)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 border-b pb-1 mb-3">Assignment</p>
                {renderAssignmentFields(editingStaff, handleEditChange)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 border-b pb-1 mb-3">Security</p>
                {renderSecurityFields(editingStaff, handleEditChange, true)}
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={() => {
                  setShowEditForm(false);
                  setEditDuplicateEmailHint("");
                  setEditDuplicatePhoneHint("");
                }} className="h-10 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm mr-3">Cancel</button>
                <button onClick={handleEdit} disabled={isLoading} className="h-10 px-6 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm disabled:opacity-50 flex items-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />} Update Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation */}
      {pendingDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Deactivate Staff</h3>
            <p className="text-sm text-slate-600 mb-4">Are you sure you want to deactivate <strong>{pendingDeactivate.name}</strong>? They will lose system access until reactivated.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingDeactivate(null)} className="h-10 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
              <button onClick={() => toggleStatus(pendingDeactivate)} disabled={isLoading}
                className="h-10 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50">
                {isLoading ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

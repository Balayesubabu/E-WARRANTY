import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  UserCog,
  UserCheck,
  Wrench,
  ChevronRight,
  Ban,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getProviderDetail,
  deactivateDealer,
  activateDealer,
  deactivateStaff,
  activateStaff,
  deactivateServiceCenter,
  activateServiceCenter,
} from "../../services/superAdminService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");

export function SuperAdminProviderDetail() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dealers");
  const [actingId, setActingId] = useState(null);
  const [dealerDeactivateModal, setDealerDeactivateModal] = useState({ open: false, dealer: null });
  const [dealerDeactivateReason, setDealerDeactivateReason] = useState("");
  const [staffDeactivateModal, setStaffDeactivateModal] = useState({ open: false, staff: null });
  const [staffDeactivateReason, setStaffDeactivateReason] = useState("");
  const [scDeactivateModal, setScDeactivateModal] = useState({ open: false, sc: null });
  const [scDeactivateReason, setScDeactivateReason] = useState("");

  const fetchData = async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const res = await getProviderDetail(providerId);
      setData(res);
    } catch {
      toast.error("Failed to load provider detail");
      navigate("/super-admin/providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [providerId]);

  const handleDealerDeactivate = async () => {
    const dealer = dealerDeactivateModal.dealer;
    const trimmed = dealerDeactivateReason.trim();
    if (!dealer || actingId) return;
    if (!trimmed || trimmed.length < 10) {
      toast.error("Please provide a reason (minimum 10 characters)");
      return;
    }
    setActingId(dealer.id);
    try {
      await deactivateDealer(providerId, dealer.id, trimmed);
      toast.success("Dealer deactivated successfully");
      setDealerDeactivateModal({ open: false, dealer: null });
      setDealerDeactivateReason("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate dealer");
    } finally {
      setActingId(null);
    }
  };

  const handleDealerActivate = async (dealer) => {
    if (actingId) return;
    setActingId(dealer.id);
    try {
      await activateDealer(providerId, dealer.id);
      toast.success("Dealer activated successfully");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to activate dealer");
    } finally {
      setActingId(null);
    }
  };

  const handleStaffDeactivateConfirm = async () => {
    const staff = staffDeactivateModal.staff;
    const trimmed = staffDeactivateReason.trim();
    if (!staff || actingId) return;
    if (!trimmed || trimmed.length < 10) {
      toast.error("Please provide a reason (minimum 10 characters)");
      return;
    }
    setActingId(staff.id);
    try {
      await deactivateStaff(providerId, staff.id, trimmed);
      toast.success("Staff deactivated successfully");
      setStaffDeactivateModal({ open: false, staff: null });
      setStaffDeactivateReason("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate staff");
    } finally {
      setActingId(null);
    }
  };

  const handleStaffActivate = async (s) => {
    if (actingId) return;
    setActingId(s.id);
    try {
      await activateStaff(providerId, s.id);
      toast.success("Staff activated successfully");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to activate staff");
    } finally {
      setActingId(null);
    }
  };

  const handleServiceCenterDeactivateConfirm = async () => {
    const sc = scDeactivateModal.sc;
    const trimmed = scDeactivateReason.trim();
    if (!sc || actingId) return;
    if (!trimmed || trimmed.length < 10) {
      toast.error("Please provide a reason (minimum 10 characters)");
      return;
    }
    setActingId(sc.id);
    try {
      await deactivateServiceCenter(providerId, sc.id, trimmed);
      toast.success("Service center deactivated successfully");
      setScDeactivateModal({ open: false, sc: null });
      setScDeactivateReason("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate service center");
    } finally {
      setActingId(null);
    }
  };

  const handleServiceCenterActivate = async (sc) => {
    if (actingId) return;
    setActingId(sc.id);
    try {
      await activateServiceCenter(providerId, sc.id);
      toast.success("Service center activated successfully");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to activate service center");
    } finally {
      setActingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  if (!data?.provider) {
    return null;
  }

  const { provider, dealers, staff, customers, serviceCenters, counts } = data;
  const tabs = [
    { id: "dealers", label: "Dealers", count: counts?.dealers ?? dealers?.length ?? 0, icon: Users },
    { id: "staff", label: "Staff", count: counts?.staff ?? staff?.length ?? 0, icon: UserCog },
    { id: "customers", label: "Customers", count: counts?.customers ?? customers?.length ?? 0, icon: UserCheck },
    { id: "serviceCenters", label: "Service Centers", count: counts?.serviceCenters ?? serviceCenters?.length ?? 0, icon: Wrench },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <button
        onClick={() => navigate("/super-admin/providers")}
        className="flex items-center gap-2 text-slate-600 hover:text-[#1A7FC1] text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Providers
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#1A7FC1]/10 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-[#1A7FC1]" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">{provider.company_name || "Provider"}</h1>
          <p className="text-sm text-slate-500">{provider.email || provider.user_name || "-"}</p>
          {provider.company_address && (
            <p className="text-xs text-slate-400 mt-0.5">{provider.company_address}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span>Joined {formatDate(provider.created_at)}</span>
            <span>{provider.coin_balance ?? 0} coins</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 p-2 flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#1A7FC1] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs ${isActive ? "text-white/90" : "text-slate-500"}`}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 min-h-[200px]">
          {activeTab === "dealers" && (
            <DealersTable
              dealers={dealers ?? []}
              actingId={actingId}
              onDeactivate={(d) => setDealerDeactivateModal({ open: true, dealer: d })}
              onActivate={handleDealerActivate}
            />
          )}
          {activeTab === "staff" && (
            <StaffTable
              staff={staff ?? []}
              actingId={actingId}
              onDeactivate={(s) => setStaffDeactivateModal({ open: true, staff: s })}
              onActivate={handleStaffActivate}
            />
          )}
          {activeTab === "customers" && (
            <CustomersTable customers={customers ?? []} />
          )}
          {activeTab === "serviceCenters" && (
            <ServiceCentersTable
              serviceCenters={serviceCenters ?? []}
              actingId={actingId}
              onDeactivate={(sc) => setScDeactivateModal({ open: true, sc })}
              onActivate={handleServiceCenterActivate}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/super-admin/providers/" + providerId + "/coins", { state: { providerName: provider.company_name } })}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] text-sm font-medium"
        >
          Manage Coins
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={staffDeactivateModal.open} onOpenChange={(open) => { if (!open) { setStaffDeactivateModal({ open: false, staff: null }); setStaffDeactivateReason(""); } }}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">Deactivate Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {staffDeactivateModal.staff && (
              <p className="text-sm text-slate-600">
                Suspending <span className="font-medium">{staffDeactivateModal.staff.name}</span> will prevent them from logging in. They will receive an email notification.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason <span className="text-red-500">*</span> <span className="text-slate-500 font-normal">(included in email to staff)</span>
              </label>
              <textarea
                value={staffDeactivateReason}
                onChange={(e) => setStaffDeactivateReason(e.target.value)}
                placeholder="e.g. Policy violation, compliance, investigation..."
                rows={3}
                required
                minLength={10}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1] resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 10 characters. This reason will be sent to the staff member.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => { setStaffDeactivateModal({ open: false, staff: null }); setStaffDeactivateReason(""); }}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStaffDeactivateConfirm}
              disabled={actingId || !staffDeactivateReason.trim() || staffDeactivateReason.trim().length < 10}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Deactivate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scDeactivateModal.open} onOpenChange={(open) => { if (!open) { setScDeactivateModal({ open: false, sc: null }); setScDeactivateReason(""); } }}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">Deactivate Service Center</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {scDeactivateModal.sc && (
              <p className="text-sm text-slate-600">
                Deactivating <span className="font-medium">{scDeactivateModal.sc.name}</span> will prevent them from logging in. They and the owner will receive an email notification.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason <span className="text-red-500">*</span> <span className="text-slate-500 font-normal">(included in email to service center and owner)</span>
              </label>
              <textarea
                value={scDeactivateReason}
                onChange={(e) => setScDeactivateReason(e.target.value)}
                placeholder="e.g. Policy violation, compliance, investigation..."
                rows={3}
                required
                minLength={10}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1] resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 10 characters. This reason will be sent to the service center and owner.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => { setScDeactivateModal({ open: false, sc: null }); setScDeactivateReason(""); }}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleServiceCenterDeactivateConfirm}
              disabled={actingId || !scDeactivateReason.trim() || scDeactivateReason.trim().length < 10}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Deactivate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dealerDeactivateModal.open} onOpenChange={(open) => { if (!open) { setDealerDeactivateModal({ open: false, dealer: null }); setDealerDeactivateReason(""); } }}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">Deactivate Dealer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {dealerDeactivateModal.dealer && (
              <p className="text-sm text-slate-600">
                Deactivating <span className="font-medium">{dealerDeactivateModal.dealer.name}</span> will prevent them from logging in. They will receive an email notification.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason <span className="text-red-500">*</span> <span className="text-slate-500 font-normal">(included in email to dealer)</span>
              </label>
              <textarea
                value={dealerDeactivateReason}
                onChange={(e) => setDealerDeactivateReason(e.target.value)}
                placeholder="e.g. Policy violation, compliance, payment overdue..."
                rows={3}
                required
                minLength={10}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1] resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 10 characters. This reason will be sent to the dealer.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => { setDealerDeactivateModal({ open: false, dealer: null }); setDealerDeactivateReason(""); }}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDealerDeactivate}
              disabled={actingId || !dealerDeactivateReason.trim() || dealerDeactivateReason.trim().length < 10}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Deactivate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DealersTable({ dealers, actingId, onDeactivate, onActivate }) {
  if (dealers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Users className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No dealers under this owner</p>
      </div>
    );
  }
  const isActive = (d) => (d.status || "").toUpperCase() === "ACTIVE" && d.is_active !== false;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Phone</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Joined</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {dealers.map((d) => {
            const active = isActive(d);
            const isActing = actingId === d.id;
            return (
              <tr key={d.id} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium">{d.name || "-"}</td>
                <td className="py-3 pr-4">{d.email || "-"}</td>
                <td className="py-3 pr-4">{d.phone_number || d.phone || "-"}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {d.status || "-"}
                  </span>
                </td>
                <td className="py-3 pr-4">{formatDate(d.created_at)}</td>
                <td className="py-3 text-right">
                  {active ? (
                    <button
                      onClick={() => onDeactivate(d)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate(d)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StaffTable({ staff, actingId, onDeactivate, onActivate }) {
  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <UserCog className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No staff under this owner</p>
      </div>
    );
  }
  const isActive = (s) => (s.staff_status || "").toUpperCase() === "ACTIVE" && s.is_active !== false;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Phone</th>
            <th className="pb-3 pr-4">Designation</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Last Login</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => {
            const active = isActive(s);
            const isActing = actingId === s.id;
            return (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium">{s.name || "-"}</td>
                <td className="py-3 pr-4">{s.email || "-"}</td>
                <td className="py-3 pr-4">{s.phone || "-"}</td>
                <td className="py-3 pr-4">{s.designation || "-"}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {s.staff_status || "-"}
                  </span>
                </td>
                <td className="py-3 pr-4">{formatDateTime(s.last_login)}</td>
                <td className="py-3 text-right">
                  {active ? (
                    <button
                      onClick={() => onDeactivate(s)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate(s)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CustomersTable({ customers }) {
  // Group by (email, phone) so same person with multiple products = 1 row
  const grouped = (customers ?? []).reduce((acc, c) => {
    const key = `${(c.email || "").toLowerCase().trim()}|${(c.phone || "").replace(/\D/g, "")}`;
    if (!acc[key]) {
      acc[key] = {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        products: [],
        created_at: c.created_at,
      };
    }
    if (c.product_name && !acc[key].products.includes(c.product_name)) {
      acc[key].products.push(c.product_name);
    }
    return acc;
  }, {});
  const uniqueCustomers = Object.values(grouped);

  if (uniqueCustomers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <UserCheck className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No customers under this provider</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Phone</th>
            <th className="pb-3 pr-4">Products</th>
            <th className="pb-3">Registered</th>
          </tr>
        </thead>
        <tbody>
          {uniqueCustomers.map((c) => (
            <tr key={`${c.email}-${c.phone}`} className="border-b border-slate-100">
              <td className="py-3 pr-4 font-medium">
                {[c.first_name, c.last_name].filter(Boolean).join(" ") || "-"}
              </td>
              <td className="py-3 pr-4">{c.email || "-"}</td>
              <td className="py-3 pr-4">{c.phone || "-"}</td>
              <td className="py-3 pr-4">{c.products?.length ? c.products.join(", ") : "-"}</td>
              <td className="py-3">{formatDate(c.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceCentersTable({ serviceCenters, actingId, onDeactivate, onActivate }) {
  if (serviceCenters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Wrench className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No service centers under this owner</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Phone</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Added</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {serviceCenters.map((sc) => {
            const isActing = actingId === sc.id;
            return (
              <tr key={sc.id} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium">{sc.name || "-"}</td>
                <td className="py-3 pr-4">{sc.email || "-"}</td>
                <td className="py-3 pr-4">{sc.phone || "-"}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    sc.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {sc.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 pr-4">{formatDate(sc.created_at)}</td>
                <td className="py-3 text-right">
                  {sc.is_active ? (
                    <button
                      onClick={() => onDeactivate(sc)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate(sc)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

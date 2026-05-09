import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Ban,
  UserCheck,
  StickyNote,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCustomerDetail,
  toggleCustomerStatus,
  updateCustomerNotes,
} from "../../services/ownerCustomerService";

const statusColors = {
  Submitted: "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  InProgress: "bg-amber-50 text-amber-700 border-amber-200",
  Repaired: "bg-teal-50 text-teal-700 border-teal-200",
  Replaced: "bg-purple-50 text-purple-700 border-purple-200",
  Closed: "bg-slate-50 text-slate-600 border-slate-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const timelineIcons = {
  warranty_registered: { icon: ShieldCheck, color: "bg-emerald-500" },
  warranty_expired: { icon: ShieldOff, color: "bg-amber-500" },
  claim_raised: { icon: AlertTriangle, color: "bg-red-500" },
  claim_resolved: { icon: CheckCircle, color: "bg-blue-500" },
};

export function OwnerCustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Notes state
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Status toggle state
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    setLoading(true);
    getCustomerDetail(customerId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setNotes(result.profile?.internalNotes || "");
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load customer details");
          navigate("/owner/customers");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId, navigate]);

  const handleToggleStatus = async () => {
    if (!data) return;
    const newStatus = !data.profile.isActive;
    setTogglingStatus(true);
    try {
      await toggleCustomerStatus(customerId, newStatus);
      setData((prev) => ({
        ...prev,
        profile: { ...prev.profile, isActive: newStatus },
      }));
      toast.success(`Customer ${newStatus ? "activated" : "blocked"} successfully`, {
        style: newStatus ? undefined : { background: "#FEE2E2", color: "#991B1B" },
      });
    } catch {
      toast.error("Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateCustomerNotes(customerId, notes);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, product, dealer, claims, timeline } = data;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "claims", label: `Claims (${claims.length})` },
    { id: "timeline", label: "Activity Timeline" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/owner/customers")}
          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">{profile.name}</h1>
          <p className="text-sm text-slate-500">Customer Detail — View Only</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            profile.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {profile.isActive ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
            {profile.isActive ? "Active" : "Blocked"}
          </span>
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              profile.isActive
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            {togglingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : profile.isActive ? "Block" : "Activate"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-[#1A7FC1] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#1A7FC1]" /> Profile Information
            </h3>
            <div className="space-y-3">
              {[
                { icon: User, label: "Name", value: profile.name },
                { icon: Phone, label: "Phone", value: profile.phone },
                { icon: Mail, label: "Email", value: profile.email || "—" },
                { icon: MapPin, label: "Address", value: [profile.address, profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "—" },
                { icon: Calendar, label: "Registered", value: profile.registrationDate ? new Date(profile.registrationDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm text-slate-700">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product & Warranty Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1A7FC1]" /> Product & Warranty
            </h3>
            <div className="space-y-3">
              {[
                { label: "Product", value: product.productName },
                { label: "Serial Number", value: product.serialNumber },
                { label: "Warranty Code", value: product.warrantyCode },
                { label: "Warranty Start", value: product.warrantyFrom ? new Date(product.warrantyFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                { label: "Warranty Expiry", value: product.warrantyTo ? new Date(product.warrantyTo).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                { label: "Invoice", value: product.invoiceNumber || "—" },
                { label: "Installation Date", value: product.dateOfInstallation ? new Date(product.dateOfInstallation).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-sm text-slate-700">{item.value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.warrantyStatus === "Active" ? "bg-emerald-50 text-emerald-700" :
                  product.warrantyStatus === "Pending" ? "bg-amber-50 text-amber-700" :
                  product.warrantyStatus === "Cancelled" ? "bg-red-50 text-red-700" :
                  product.warrantyStatus === "Expired" ? "bg-slate-100 text-slate-600" :
                  "bg-slate-50 text-slate-500"
                }`}>
                  {product.warrantyStatus === "Active" ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                  {product.warrantyStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Dealer + Notes Card */}
          <div className="space-y-6">
            {/* Dealer */}
            {dealer && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#1A7FC1]" /> Associated Dealer
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-800">{dealer.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5"><Phone className="w-3 h-3" />{dealer.phone}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="w-3 h-3" />{dealer.email}</p>
                  {dealer.city && <p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin className="w-3 h-3" />{dealer.city}</p>}
                </div>
              </div>
            )}

            {/* Internal Notes */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#1A7FC1]" /> Internal Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this customer..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1] resize-none"
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#1A7FC1] text-white rounded-lg text-xs hover:bg-[#166EA8] transition-colors disabled:opacity-60"
              >
                {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLAIMS TAB */}
      {activeTab === "claims" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {claims.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No claims found</p>
              <p className="text-slate-400 text-xs mt-1">This customer has not raised any warranty claims</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Claim ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Issue</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Priority</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Assigned To</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Created</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Resolved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((cl) => (
                    <tr key={cl.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{cl.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-slate-700">{cl.product}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{cl.issueDescription}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          cl.priority === "High" || cl.priority === "Critical"
                            ? "bg-red-50 text-red-700"
                            : cl.priority === "Medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-600"
                        }`}>
                          {cl.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[cl.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {cl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{cl.assignedStaff || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {cl.createdAt ? new Date(cl.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {cl.closedAt ? new Date(cl.closedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          {timeline.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No activity yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-200" />
              <div className="space-y-6">
                {timeline.map((event, i) => {
                  const config = timelineIcons[event.type] || { icon: Clock, color: "bg-slate-400" };
                  const Icon = config.icon;
                  return (
                    <div key={i} className="flex gap-4 relative">
                      <div className={`w-9 h-9 rounded-full ${config.color} flex items-center justify-center shrink-0 z-10`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(event.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

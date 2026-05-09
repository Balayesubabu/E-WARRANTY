import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Phone, MapPin, Shield, Building2, Users,
  FileText, Activity, Loader2, AlertCircle, Calendar, Briefcase, CheckCircle2,
} from "lucide-react";
import { getStaffDetailErp } from "../../services/staffService";
import { toast } from "sonner";

const STATUS_BADGE = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const CLAIM_STATUS_COLORS = {
  Submitted: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  InProgress: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Closed: "bg-slate-100 text-slate-600",
};

// Same sub_module_id → label mapping as Staff Management abilities
const ABILITY_LABELS = {
  "550e8400-e29b-41d4-a716-446655440121": "Generate QR Codes",
  "550e8400-e29b-41d4-a716-446655440125": "Warranty Settings",
  "550e8400-e29b-41d4-a716-446655440122": "Create / Manage Dealers",
  "550e8400-e29b-41d4-a716-446655440123": "Warranty Registration",
  "550e8400-e29b-41d4-a716-446655440124": "View Active Customers",
};

export function StaffProfilePage() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!staffId) return;
    getStaffDetailErp(staffId)
      .then((data) => setStaff(data))
      .catch(() => toast.error("Failed to load staff profile"))
      .finally(() => setLoading(false));
  }, [staffId]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" /></div>;

  if (!staff) return (
    <div className="p-6 text-center py-32">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">Staff not found</p>
      <button onClick={() => navigate("/owner/staff")} className="mt-4 h-10 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm flex items-center gap-2 mx-auto">
        <ArrowLeft className="w-4 h-4" /> Back to Staff
      </button>
    </div>
  );

  const perf = staff.performance || {};
  const statusLabel = staff.staff_status === "ON_LEAVE" ? "On Leave" : staff.staff_status === "SUSPENDED" ? "Suspended" : staff.is_active === false ? "Inactive" : "Active";
  const statusBadgeClass = STATUS_BADGE[staff.staff_status] || (staff.is_active === false ? STATUS_BADGE.SUSPENDED : STATUS_BADGE.ACTIVE);

  const tabs = [
    { key: "overview", label: "Profile Overview" },
    { key: "performance", label: "Performance" },
    { key: "activity", label: "Activity Log" },
  ];

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
      <div className="min-w-0"><p className="text-xs text-slate-400 font-medium">{label}</p><p className="text-sm text-slate-900 break-words">{value || "—"}</p></div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <button onClick={() => navigate("/owner/staff")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Staff
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1A7FC1] to-[#0F4E78] flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {(staff.name || "S")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">{staff.name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}`}>{statusLabel}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1A7FC1]/10 text-[#1A7FC1]">{staff.role_type}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{staff.designation || "Staff"} · {staff.department || "No department"}</p>
          <p className="text-xs text-slate-400 mt-0.5">{staff.email} · {staff.phone}</p>
          {staff.employee_id && <p className="text-xs text-slate-400">Employee ID: {staff.employee_id}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Claims Processed", value: perf.claimsProcessed || 0, icon: FileText, color: "text-[#1A7FC1] bg-[#1A7FC1]/10" },
          { label: "Dealers Managed", value: perf.dealersManaged || 0, icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Tickets Handled", value: perf.ticketsHandled || 0, icon: Activity, color: "text-amber-600 bg-amber-50" },
          // { label: "Last Login", value: staff.last_login ? new Date(staff.last_login).toLocaleDateString() : "Never", icon: Clock, color: "text-slate-600 bg-slate-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5" /></div>
            <div><p className="text-slate-500 text-xs">{s.label}</p><p className="text-xl font-bold text-slate-900">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? "border-[#1A7FC1] text-[#1A7FC1]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-[#1A7FC1]" /> Personal Details</h3></div>
            <div className="px-5 py-2 divide-y divide-slate-50">
              <InfoRow icon={User} label="Full Name" value={staff.name} />
              <InfoRow icon={Briefcase} label="Employee ID" value={staff.employee_id} />
              <InfoRow icon={Mail} label="Email" value={staff.email} />
              <InfoRow icon={Phone} label="Phone" value={staff.phone} />
              <InfoRow icon={MapPin} label="Address" value={staff.address} />
              <InfoRow icon={Calendar} label="Joined" value={staff.created_at ? new Date(staff.created_at).toLocaleDateString() : null} />
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Shield className="w-4 h-4 text-[#1A7FC1]" /> Role & Assignment</h3></div>
              <div className="px-5 py-2 divide-y divide-slate-50">
                <InfoRow icon={Shield} label="Role" value={staff.role_type} />
                <InfoRow icon={Building2} label="Department" value={staff.department || staff.department_name} />
                <InfoRow icon={MapPin} label="Region" value={staff.region} />
                <InfoRow icon={Users} label="Reports To" value={staff.reports_to?.name ? `${staff.reports_to.name} (${staff.reports_to.role_type})` : null} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#1A7FC1]" /> Abilities</h3></div>
              <div className="p-5">
                {(() => {
                  const perms = staff.StaffRolePermission || [];
                  const allowedIds = new Set(perms.filter((p) => p.is_deleted !== true).map((p) => p.sub_module_id || p.subModuleId).filter(Boolean));
                  const abilityList = Object.entries(ABILITY_LABELS).map(([id, label]) => ({ id, label, has: allowedIds.has(id) })).filter((a) => a.has);
                  if (abilityList.length === 0) {
                    return <p className="text-sm text-slate-400">No abilities assigned. Edit staff to grant access.</p>;
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {abilityList.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A7FC1]/10 text-sm font-medium text-[#1A7FC1]">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          {a.label}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-[#1A7FC1]" /> Assigned Dealers ({staff.dealer_assignments?.length || 0})</h3></div>
              <div className="p-5">
                {(staff.dealer_assignments || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No dealers assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {staff.dealer_assignments.map((da) => (
                      <span key={da.id || da.dealer?.id} className="px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-700">
                        {da.dealer?.name || "Dealer"} {da.dealer?.city && <span className="text-slate-400 text-xs ml-1">({da.dealer.city})</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(staff.subordinates || []).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900">Subordinates ({staff.subordinates.length})</h3></div>
                <div className="p-5 flex flex-wrap gap-2">
                  {staff.subordinates.map((sub) => (
                    <button key={sub.id} onClick={() => navigate(`/owner/staff/${sub.id}`)} className="px-3 py-1.5 rounded-lg bg-[#1A7FC1]/10 text-sm text-[#1A7FC1] hover:bg-[#1A7FC1]/20">
                      {sub.name} <span className="text-xs opacity-60">({sub.role_type})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance */}
      {activeTab === "performance" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Claims Breakdown</h3>
            {Object.keys(perf.claimsByStatus || {}).length === 0 ? (
              <p className="text-sm text-slate-400">No claims processed yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(perf.claimsByStatus).map(([status, count]) => (
                  <div key={status} className="rounded-xl border border-slate-200 p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLAIM_STATUS_COLORS[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-3xl font-bold text-[#1A7FC1]">{perf.claimsProcessed || 0}</p>
              <p className="text-sm text-slate-500 mt-1">Total Claims</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-3xl font-bold text-purple-600">{perf.dealersManaged || 0}</p>
              <p className="text-sm text-slate-500 mt-1">Dealers Managed</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-3xl font-bold text-amber-600">{perf.ticketsHandled || 0}</p>
              <p className="text-sm text-slate-500 mt-1">Tickets Handled</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900">Recent Claim Activity</h3></div>
          {(staff.WarrantyClaim || []).length === 0 ? (
            <div className="text-center py-12"><Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-400">No recent activity</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr>
                  <th className="text-left px-4 py-3">Claim ID</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr></thead>
                <tbody>
                  {staff.WarrantyClaim.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">#{(c.id || "").slice(0, 8)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLAIM_STATUS_COLORS[c.status] || "bg-slate-100 text-slate-600"}`}>{c.status}</span></td>
                      <td className="px-4 py-3 text-slate-600">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

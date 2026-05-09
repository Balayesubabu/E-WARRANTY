import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Box, ShieldCheck, Package, User, Hash, FileText, UserPlus, Check, RefreshCw, X, Users, Minus, Plus, Link2, Calendar } from "lucide-react";
import { getBatchById } from "../../services/productManagementService";
import { assignBatchToDealer, unassignBatchFromDealer, assignPartialBatchToDealer, unassignPartialBatchFromDealer, getBatchDealerAssignments } from "../../services/warrantyCodeService";
import { getDealersByProviderId } from "../../services/warrantyService";
import { toast } from "sonner";

export function ProductBatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dealers, setDealers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [showAssignUI, setShowAssignUI] = useState(false);
  const [showChangeUI, setShowChangeUI] = useState(false);
  
  // Partial assignment state
  const [dealerAssignments, setDealerAssignments] = useState(null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignCount, setAssignCount] = useState("");
  const [partialAssigning, setPartialAssigning] = useState(false);
  const [unassignDealerId, setUnassignDealerId] = useState(null);
  const [unassignCount, setUnassignCount] = useState("");
  const [codeFilter, setCodeFilter] = useState("all");

  const fetchBatch = useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    getBatchById(batchId)
      .then((data) => setBatch(data))
      .catch(() => toast.error("Failed to load batch details"))
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const franchise = JSON.parse(localStorage.getItem("franchise") || "{}");
        const providerId = franchise?.provider_id || franchise?.id;
        if (!providerId) return;
        const response = await getDealersByProviderId(providerId);
        const dealerList = response?.data || response || [];
        setDealers(Array.isArray(dealerList) ? dealerList.filter((d) => d.is_active !== false) : []);
      } catch {
        setDealers([]);
      }
    };
    fetchDealers();
  }, []);

  // Fetch dealer assignments for the batch
  const fetchDealerAssignments = useCallback(async () => {
    if (!batch?.codes?.length) return;
    const groupId = batch.codes[0]?.group_id;
    if (!groupId) return;
    
    setLoadingAssignments(true);
    try {
      const data = await getBatchDealerAssignments(groupId);
      setDealerAssignments(data);
    } catch {
      setDealerAssignments(null);
    } finally {
      setLoadingAssignments(false);
    }
  }, [batch?.codes]);

  useEffect(() => {
    fetchDealerAssignments();
  }, [fetchDealerAssignments]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-slate-500">Batch not found.</p>
        <button type="button" onClick={() => navigate("/owner/warranty-management")} className="mt-4 text-[#1A7FC1] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to View All Product
        </button>
      </div>
    );
  }

  const product = batch.product || {};
  const policy = batch.policy || {};
  const batchDealer = batch.assigned_dealer;
  const codes = batch.codes || [];
  const codeCount = codes.length;

  const groupId = codes.length > 0 ? codes[0].group_id : null;
  const hasRegisteredCodes = codes.some((c) => c.warranty_code_status === "Active");
  const hasAssignedCodes = codes.some((c) => c.assigned_dealer_id);
  const allCodesAvailable = codes.length > 0 && codes.every((c) => c.warranty_code_status === "Inactive");
  const availableCount = codes.filter((c) => c.warranty_code_status === "Inactive").length;
  const assignedCount = codes.filter((c) => c.assigned_dealer_id).length;

  const allCodesAssignedToDealer = codes.length > 0 && codes.every((c) => c.assigned_dealer_id);
  const codesAssignedDealerId = allCodesAssignedToDealer ? codes[0]?.assigned_dealer_id : null;
  const codesAssignedDealer = codesAssignedDealerId ? dealers.find((d) => d.id === codesAssignedDealerId) : null;
  const dealer = batchDealer || codesAssignedDealer;
  
  const unassignableCount = codes.filter((c) => c.warranty_code_status === "Inactive" && c.assigned_dealer_id).length;
  const registeredCount = codes.filter((c) => c.warranty_code_status === "Active").length;
  const canUnassign = unassignableCount > 0;
  const canChangeDealer = canUnassign && registeredCount === 0;

  // Safe progress percentage
  const totalCodes = codes?.length ?? 0;
  const assignedPercent = totalCodes > 0 ? Math.round((assignedCount / totalCodes) * 100) : 0;
  const availableUnassigned = codes.filter((c) => (c.warranty_code_status === "Inactive" || !c.warranty_code_status) && !c.assigned_dealer_id).length;
  const availablePercent = totalCodes > 0 ? Math.round((availableUnassigned / totalCodes) * 100) : 0;

  // Filtered codes for tab view
  const filteredCodes = (codes ?? []).filter((c) => {
    if (codeFilter === "all") return true;
    if (codeFilter === "assigned") return !!c.assigned_dealer_id;
    if (codeFilter === "available") return !c.assigned_dealer_id && (c.warranty_code_status === "Inactive" || !c.warranty_code_status);
    if (codeFilter === "registered") return c.warranty_code_status === "Active";
    return true;
  });

  const batchDate = batch?.created_at || batch?.batch_name;
  const formattedDate = batchDate ? new Date(batchDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const handleAssignDealer = async () => {
    if (!selectedDealer || !groupId) {
      toast.error("Please select a dealer");
      return;
    }
    if (availableCount === 0) {
      toast.error("No available codes to assign. All codes are already registered.");
      return;
    }
    setAssigning(true);
    try {
      await assignBatchToDealer(groupId, selectedDealer);
      const message = allCodesAvailable 
        ? "Batch assigned to dealer successfully" 
        : `${availableCount} available code${availableCount > 1 ? 's' : ''} assigned to dealer successfully`;
      toast.success(message);
      setShowAssignUI(false);
      setSelectedDealer("");
      fetchBatch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to assign dealer");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignDealer = async () => {
    if (!groupId || !canUnassign) {
      toast.error("No codes to unassign");
      return;
    }
    setUnassigning(true);
    try {
      const result = await unassignBatchFromDealer(groupId);
      const unassignedCount = result?.data?.unassigned_count || 0;
      toast.success(`${unassignedCount} codes unassigned from dealer`);
      setShowChangeUI(false);
      fetchBatch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unassign dealer");
    } finally {
      setUnassigning(false);
    }
  };

  const handleChangeDealer = async () => {
    if (!selectedDealer || !groupId) {
      toast.error("Please select a dealer");
      return;
    }
    setAssigning(true);
    try {
      await unassignBatchFromDealer(groupId);
      await assignBatchToDealer(groupId, selectedDealer);
      toast.success("Dealer changed successfully");
      setShowChangeUI(false);
      setSelectedDealer("");
      fetchBatch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change dealer");
    } finally {
      setAssigning(false);
    }
  };

  // Partial assignment handlers
  const handlePartialAssign = async () => {
    if (!selectedDealer || !groupId) {
      toast.error("Please select a dealer");
      return;
    }
    const count = parseInt(assignCount, 10);
    if (isNaN(count) || count < 1) {
      toast.error("Please enter a valid count");
      return;
    }
    if (dealerAssignments && count > dealerAssignments.unassigned) {
      toast.error(`Only ${dealerAssignments.unassigned} codes available for assignment`);
      return;
    }
    
    setPartialAssigning(true);
    try {
      const result = await assignPartialBatchToDealer(groupId, selectedDealer, count);
      const assignedCount = result?.data?.assigned_count || count;
      toast.success(`${assignedCount} code(s) assigned to dealer`);
      setSelectedDealer("");
      setAssignCount("");
      fetchBatch();
      fetchDealerAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to assign codes");
    } finally {
      setPartialAssigning(false);
    }
  };

  const handlePartialUnassign = async (dealerId, countToUnassign) => {
    if (!groupId || !dealerId) return;
    
    const count = parseInt(countToUnassign, 10);
    if (isNaN(count) || count < 1) {
      toast.error("Please enter a valid count");
      return;
    }

    setPartialAssigning(true);
    try {
      const result = await unassignPartialBatchFromDealer(groupId, dealerId, count);
      const unassignedCount = result?.data?.unassigned_count || count;
      toast.success(`${unassignedCount} code(s) unassigned from dealer`);
      setUnassignDealerId(null);
      setUnassignCount("");
      fetchBatch();
      fetchDealerAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unassign codes");
    } finally {
      setPartialAssigning(false);
    }
  };

  const handleUnassignAll = async (dealerId, dealerCount) => {
    if (!groupId || !dealerId) return;
    
    setPartialAssigning(true);
    try {
      const result = await unassignPartialBatchFromDealer(groupId, dealerId, dealerCount);
      const unassignedCount = result?.data?.unassigned_count || dealerCount;
      toast.success(`${unassignedCount} code(s) unassigned from dealer`);
      fetchBatch();
      fetchDealerAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unassign codes");
    } finally {
      setPartialAssigning(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/owner/warranty-management")} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#1A7FC1]" />
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Batch Details</h1>
            <p className="text-sm text-slate-500">{formattedDate}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Box className="w-5 h-5 text-[#1A7FC1]" />
            <span className="font-semibold text-slate-700">Product</span>
          </div>
          <p className="font-medium text-slate-800">{product.product_name || "—"}</p>
          <p className="text-xs text-slate-500 mt-1">{product.model_number && `Model: ${product.model_number}`}{product.category && ` • ${product.category}`}</p>
          {product.sku_code && <p className="text-xs text-slate-500">SKU: {product.sku_code}</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-slate-700">Warranty Policy</span>
          </div>
          <p className="font-medium text-slate-800">{policy.policy_name || "—"}</p>
          {policy.warranty_duration_label && <p className="text-xs text-slate-500 mt-1">{policy.warranty_duration_label}</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-slate-700">Batch</span>
          </div>
          <p className="font-medium text-slate-800">{batch.batch_name || "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Total Codes: {codeCount} • Assigned: {assignedCount} • Registered: {registeredCount}</p>
        </div>
      </div>

      {/* Two-panel: Assign Warranty Codes + Dealer Distribution */}
      {codes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Assign Warranty Codes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1A7FC1]" />
                Assign Warranty Codes
              </h3>
              {(!dealerAssignments || dealerAssignments.unassigned === 0) && !showAssignUI && dealer && (
                <p className="text-sm text-slate-500">All codes are assigned. Use Reassign to change dealer.</p>
              )}
              {(!dealerAssignments || (dealerAssignments.unassigned === 0 && dealerAssignments.assignments?.length === 0)) && !dealer && !showAssignUI && availableCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAssignUI(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1A7FC1] hover:bg-[#1A7FC1]/10 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign Dealer
                </button>
              )}
              {showAssignUI && !dealerAssignments && (
                <div className="space-y-2">
                  {!allCodesAvailable && hasRegisteredCodes && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">{availableCount} of {codes.length} codes available</p>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={selectedDealer}
                      onChange={(e) => setSelectedDealer(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    >
                      <option value="">Select Dealer</option>
                      {dealers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} {d.email ? `(${d.email})` : ""}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAssignDealer}
                      disabled={assigning || !selectedDealer}
                      className="px-4 py-2 bg-[#1A7FC1] text-white rounded-lg text-sm font-medium hover:bg-[#166EA8] disabled:opacity-50 flex items-center gap-2"
                    >
                      {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      Assign Codes
                    </button>
                    <button type="button" onClick={() => { setShowAssignUI(false); setSelectedDealer(""); }} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}
              {dealerAssignments && dealerAssignments.unassigned > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedDealer}
                      onChange={(e) => setSelectedDealer(e.target.value)}
                      className="flex-1 min-w-[160px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    >
                      <option value="">Select Dealer</option>
                      {dealers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} {d.email ? `(${d.email})` : ""}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAssignCount(String(Math.max(1, (parseInt(assignCount, 10) || 0) - 1)))}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={dealerAssignments.unassigned}
                        value={assignCount}
                        onChange={(e) => setAssignCount(e.target.value)}
                        placeholder="Count"
                        className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setAssignCount(String(Math.min(dealerAssignments.unassigned, (parseInt(assignCount, 10) || 0) + 1)))}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handlePartialAssign}
                      disabled={partialAssigning || !selectedDealer || !assignCount}
                      className="px-4 py-2 bg-[#1A7FC1] text-white rounded-lg text-sm font-medium hover:bg-[#166EA8] disabled:opacity-50 flex items-center gap-2"
                    >
                      {partialAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      Assign Codes
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">{dealerAssignments.unassigned} codes available</p>
                </div>
              )}
              {showChangeUI && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Select new dealer for {unassignableCount} code(s):</p>
                  <div className="flex gap-2">
                    <select
                      value={selectedDealer}
                      onChange={(e) => setSelectedDealer(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
                    >
                      <option value="">Select Dealer</option>
                      {dealers.filter((d) => d.id !== codesAssignedDealerId).map((d) => (
                        <option key={d.id} value={d.id}>{d.name} {d.email ? `(${d.email})` : ""}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleChangeDealer} disabled={assigning || !selectedDealer} className="px-4 py-2 bg-[#1A7FC1] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                      {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Reassign
                    </button>
                    <button type="button" onClick={() => { setShowChangeUI(false); setSelectedDealer(""); }} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Dealer Distribution */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1A7FC1]" />
                Dealer Distribution
              </h3>
              <div className="space-y-2">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A7FC1] rounded-full transition-all"
                    style={{ width: `${totalCodes > 0 ? (assignedCount / totalCodes) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Assigned {assignedCount} ({assignedPercent}%)</span>
                  <span className="text-slate-600">Available {availableUnassigned} ({availablePercent}%)</span>
                </div>
              </div>
              {dealer && canUnassign && (
                <div className="flex flex-wrap gap-2">
                  {canChangeDealer && (
                    <button
                      type="button"
                      onClick={() => setShowChangeUI(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1A7FC1] border border-[#1A7FC1] rounded-lg hover:bg-[#1A7FC1]/5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reassign
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleUnassignDealer}
                    disabled={unassigning}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    {unassigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Remove Assignment
                  </button>
                </div>
              )}
              {dealerAssignments?.assignments?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase">Current Assignments</p>
                  {dealerAssignments.assignments.map((assignment) => (
                    <div key={assignment.dealer_id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-800">{assignment.dealer_name}</span>
                        <span className="text-xs text-blue-700 font-semibold">{assignment.count} codes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {unassignDealerId === assignment.dealer_id ? (
                          <>
                            <input type="number" min="1" max={assignment.count} value={unassignCount} onChange={(e) => setUnassignCount(e.target.value)} placeholder="#" className="w-14 px-1 py-0.5 border rounded text-sm text-center" />
                            <button type="button" onClick={() => handlePartialUnassign(assignment.dealer_id, unassignCount)} disabled={partialAssigning || !unassignCount} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50">
                              {partialAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                            </button>
                            <button type="button" onClick={() => { setUnassignDealerId(null); setUnassignCount(""); }} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => { setUnassignDealerId(assignment.dealer_id); setUnassignCount(""); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Reduce"><Minus className="w-4 h-4" /></button>
                            <button type="button" onClick={() => handleUnassignAll(assignment.dealer_id, assignment.count)} disabled={partialAssigning} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Remove all">
                              {partialAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {loadingAssignments && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#1A7FC1]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {codes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-slate-500" />
              <span className="font-semibold text-slate-700">Warranty Codes</span>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {["all", "assigned", "available", "registered"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCodeFilter(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${codeFilter === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                >
                  {tab === "all" ? "All" : tab}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Code</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Serial Number</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Dealer</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCodes.map((c) => {
                  const isRegistered = c.warranty_code_status === "Active";
                  const isPending = c.warranty_code_status === "Pending";
                  const isAssigned = c.warranty_code_status === "Inactive" && c.assigned_dealer_id;
                  const isAvailable = c.warranty_code_status === "Inactive" && !c.assigned_dealer_id;

                  const assignedDealer = c.assigned_dealer_id 
                    ? dealers.find(d => d.id === c.assigned_dealer_id)
                    : null;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2 font-mono text-slate-800 text-xs">{c.warranty_code || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{c.serial_no || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {assignedDealer ? assignedDealer.name : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            isRegistered
                              ? "bg-[#1A7FC1]/15 text-[#1A7FC1]"
                              : isPending
                              ? "bg-amber-50 text-amber-700"
                              : isAssigned
                              ? "bg-blue-50 text-blue-700"
                              : isAvailable
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isRegistered
                            ? "Registered"
                            : isPending
                            ? "Pending"
                            : isAssigned
                            ? "Assigned"
                            : isAvailable
                            ? "Available"
                            : c.warranty_code_status || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {codeCount >= 50 && <p className="px-4 py-2 text-xs text-slate-500 border-t border-slate-100">Showing latest 50 codes. Total in batch may be higher.</p>}
        </div>
      )}

      {codes.length === 0 && batch.total_units > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <p className="text-sm text-slate-600">No warranty codes loaded for this batch.</p>
        </div>
      )}
    </div>
  );
}

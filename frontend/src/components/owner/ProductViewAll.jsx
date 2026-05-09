import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Box,
  ShieldCheck,
  Package,
  Search,
  Power,
  Trash2,
  AlertTriangle,
  X,
  Users,
  FileWarning,
  ShieldOff,
  Download,
} from "lucide-react";
import { getProducts, getPolicies, getBatches, getProductStats, toggleProductActive, deleteProduct } from "../../services/productManagementService";
import { getWarrantyCodeSummary, generateQRCode } from "../../services/warrantyCodeService";
import { toast } from "sonner";

export function ProductViewAll() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [batches, setBatches] = useState([]);
  const [codeSummary, setCodeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, pols, bats, summary] = await Promise.all([
        getProducts(),
        getPolicies(),
        getBatches(),
        getWarrantyCodeSummary().catch(() => null),
      ]);
      setProducts(Array.isArray(prods) ? prods : []);
      setPolicies(Array.isArray(pols) ? pols : []);
      setBatches(Array.isArray(bats) ? bats : []);
      setCodeSummary(summary && typeof summary === "object" ? summary : null);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleActive = async (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    
    if (product.is_active !== false) {
      try {
        setActionLoading(true);
        const stats = await getProductStats(product.id);
        setProductStats(stats);
        setShowDeactivateModal(true);
      } catch (err) {
        toast.error("Failed to fetch product details");
      } finally {
        setActionLoading(false);
      }
    } else {
      try {
        setActionLoading(true);
        await toggleProductActive(product.id, true);
        toast.success(`${product.product_name} activated`);
        fetchData();
      } catch (err) {
        toast.error("Failed to activate product");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!selectedProduct) return;
    try {
      setActionLoading(true);
      await toggleProductActive(selectedProduct.id, false);
      toast.success(`${selectedProduct.product_name} deactivated`);
      setShowDeactivateModal(false);
      setSelectedProduct(null);
      setProductStats(null);
      fetchData();
    } catch (err) {
      toast.error("Failed to deactivate product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    
    try {
      setActionLoading(true);
      const stats = await getProductStats(product.id);
      setProductStats(stats);
      
      if (!stats.canDelete) {
        setShowCannotDeleteModal(true);
      } else {
        setShowDeleteConfirmModal(true);
      }
    } catch (err) {
      toast.error("Failed to fetch product details");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      setActionLoading(true);
      await deleteProduct(selectedProduct.id);
      toast.success(`${selectedProduct.product_name} deleted`);
      setShowDeleteConfirmModal(false);
      setSelectedProduct(null);
      setProductStats(null);
      fetchData();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.data?.reason === "PRODUCT_IN_USE") {
        setProductStats({ ...productStats, ...errorData.data.stats, canDelete: false });
        setShowDeleteConfirmModal(false);
        setShowCannotDeleteModal(true);
      } else {
        toast.error(errorData?.message || "Failed to delete product");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const switchToDeactivate = () => {
    setShowCannotDeleteModal(false);
    setShowDeactivateModal(true);
  };

  const closeModals = () => {
    setShowDeactivateModal(false);
    setShowCannotDeleteModal(false);
    setShowDeleteConfirmModal(false);
    setSelectedProduct(null);
    setProductStats(null);
  };

  const handleDownloadQRCodes = async (batch, e) => {
    e?.stopPropagation();
    if (!batch?.id) {
      toast.error("No batch selected");
      return;
    }
    
    try {
      const toastId = toast.loading("Generating QR codes PDF...");
      
      const response = await generateQRCode({
        batch_id: batch.id,
        print_type: 'A4'
      });
      
      const pdfData = response?.data?.data || response?.data;
      
      if (pdfData) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${pdfData}`;
        const filename = `${batch.batch_name?.replace(/\s+/g, "-") || "batch"}-qr-codes.pdf`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.dismiss(toastId);
        toast.success("QR codes PDF downloaded!");
      } else {
        toast.dismiss(toastId);
        toast.error("No warranty codes found in this batch");
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to generate QR codes PDF");
    }
  };

  const totalCodesFromBatches = batches.reduce((s, b) => s + (b._count?.codes || 0), 0);
  const totalCodes = codeSummary?.total_codes ?? totalCodesFromBatches;
  const activeCodes = codeSummary?.activated_codes ?? 0;
  const pendingCodes = codeSummary?.pending_codes ?? 0;
  const availableCodes = codeSummary?.available_codes ?? 0;
  const policiesByProduct = policies.reduce((acc, p) => {
    const pid = p.product_master_id || p.product?.id;
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(p);
    return acc;
  }, {});
  const batchesByPolicy = batches.reduce((acc, b) => {
    const pid = b.warranty_policy_id || b.policy?.id;
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(b);
    return acc;
  }, {});

  const filtered = products.filter(
    (p) =>
      !search ||
      (p.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.model_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  // Flatten product → policy → batch into table rows
  const rows = [];
  filtered.forEach((prod) => {
    const prodPolicies = policiesByProduct[prod.id] || prod.warranty_policies || [];
    if (prodPolicies.length === 0) {
      rows.push({ product: prod, policy: null, batch: null });
    } else {
      prodPolicies.forEach((pol) => {
        const policyBatches = batchesByPolicy[pol.id] || batches.filter(
          (b) => b.warranty_policy_id === pol.id || b.policy?.id === pol.id
        );
        if (policyBatches.length === 0) {
          rows.push({ product: prod, policy: pol, batch: null });
        } else {
          policyBatches.forEach((batch) => {
            rows.push({ product: prod, policy: pol, batch });
          });
        }
      });
    }
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">View All Product</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Products with their warranty policies and batches
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Box className="w-5 h-5 text-[#1A7FC1]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
            <p className="text-xs text-slate-500">Products</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{policies.length}</p>
            <p className="text-xs text-slate-500">Policies</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{batches.length}</p>
            <p className="text-xs text-slate-500">Batches</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{totalCodes}</p>
            <p className="text-xs text-slate-500">Total Codes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700">{activeCodes}</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{pendingCodes}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{availableCodes}</p>
            <p className="text-xs text-slate-500">Available</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, model, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Warranty Period</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">QR Codes</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Dealer</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Box className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No products found</p>
                  <p className="text-slate-400 text-xs mt-1">Go to Add Product to create your first product</p>
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={`${r.product.id}-${r.policy?.id || 0}-${r.batch?.id || 0}-${idx}`}
                  className="hover:bg-slate-50/60 cursor-pointer"
                  onClick={() => {
                    if (r.batch) navigate(`/owner/warranty-management/batch/${r.batch.id}`);
                    else navigate(`/owner/warranty-management/product/${r.product.id}`);
                  }}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-800">{r.product.product_name || "—"}</div>
                    <div className="text-xs text-slate-500">{r.product.category || "—"} {r.product.model_number || r.product.sku_code || ""}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.product.is_active !== false 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-red-50 text-red-700"
                    }`}>
                      {r.product.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {r.policy ? (
                      <>
                        {r.policy.policy_name || "—"}
                        {r.policy.warranty_duration_label && (
                          <span className="block text-xs text-slate-400">{r.policy.warranty_duration_label}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.batch?.batch_name || "—"}</td>
                  <td className="px-4 py-2.5 text-center text-slate-700 font-medium">
                    {r.batch ? (r.batch._count?.codes ?? r.batch.total_units) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.batch?.assigned_dealer?.name || "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {r.batch && (
                        <button
                          onClick={(e) => handleDownloadQRCodes(r.batch, e)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg text-[#1A7FC1] hover:bg-blue-50 transition-colors"
                          title={`Download QR codes for ${r.batch?.batch_name || "batch"}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleToggleActive(r.product, e)}
                        disabled={actionLoading}
                        className={`p-1.5 rounded-lg transition-colors ${
                          r.product.is_active !== false
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={r.product.is_active !== false ? "Deactivate product" : "Activate product"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(r.product, e)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-1">
              Deactivate Product?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              {selectedProduct.product_name}
            </p>
            <p className="text-sm text-slate-600 text-center mb-4">
              This will prevent new warranty codes from being generated.
              {productStats && productStats.customerRegistrations > 0 && (
                <span className="block mt-1 text-slate-500">
                  Existing {productStats.customerRegistrations} warranties will remain valid.
                </span>
              )}
            </p>
            <div className="space-y-2 mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked disabled className="rounded text-amber-600" />
                Stop new QR code generation
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked disabled className="rounded text-amber-600" />
                Keep existing warranties active
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeModals}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cannot Delete Modal */}
      {showCannotDeleteModal && selectedProduct && productStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={closeModals}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <FileWarning className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
              Cannot Delete Product
            </h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              This product has active warranties and cannot be deleted:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 mb-4">
              {productStats.activeWarrantyCodes > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{productStats.activeWarrantyCodes} Active Warranty Codes</span>
                </div>
              )}
              {productStats.pendingWarrantyCodes > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{productStats.pendingWarrantyCodes} Pending Warranty Codes</span>
                </div>
              )}
              {productStats.customerRegistrations > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{productStats.customerRegistrations} Customer Registrations</span>
                </div>
              )}
              {productStats.activeClaims > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileWarning className="w-4 h-4 text-red-600" />
                  <span>{productStats.activeClaims} Pending Claims</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 text-center mb-4">
              Deactivate the product instead to prevent new registrations while keeping existing warranties valid.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={switchToDeactivate}
                className="flex-1 px-4 py-2.5 bg-[#1A7FC1] hover:bg-[#1A7FC1]/90 text-white rounded-lg font-medium transition-colors"
              >
                Deactivate Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-1">
              Delete Product?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              {selectedProduct.product_name}
            </p>
            <p className="text-sm text-slate-600 text-center mb-6">
              This product has no active warranties and can be safely deleted. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModals}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

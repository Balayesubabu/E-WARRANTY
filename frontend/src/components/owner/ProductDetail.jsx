import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Box,
  ShieldCheck,
  Package,
} from "lucide-react";
import { getProductById } from "../../services/productManagementService";
import { toast } from "sonner";

export function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getProductById(productId)
      .then((data) => setProduct(data))
      .catch(() => toast.error("Failed to load product details"))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-slate-500">Product not found.</p>
        <button
          type="button"
          onClick={() => navigate("/owner/warranty-management")}
          className="mt-4 text-[#1A7FC1] hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to View All Product
        </button>
      </div>
    );
  }

  const policies = product.warranty_policies || [];
  const batches = product.warranty_batches || [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/owner/warranty-management")}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Product Details</h1>
          <p className="text-sm text-slate-500">{product.product_name || "—"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Box className="w-5 h-5 text-[#1A7FC1]" />
          <span className="font-semibold text-slate-700">Product</span>
        </div>
        <p className="font-medium text-slate-800">{product.product_name || "—"}</p>
        <div className="mt-2 text-sm text-slate-600 space-y-1">
          {product.model_number && <p>Model: {product.model_number}</p>}
          {product.category && <p>Category: {product.category}</p>}
          {product.sku_code && <p>SKU: {product.sku_code}</p>}
          {product.brand && <p>Brand: {product.brand}</p>}
          {product.description && <p className="text-slate-500">{product.description}</p>}
        </div>
      </div>

      {policies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-slate-700">Warranty Policies ({policies.length})</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {policies.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <p className="font-medium text-slate-800">{p.policy_name || "—"}</p>
                {p.warranty_duration_label && (
                  <p className="text-xs text-slate-500">{p.warranty_duration_label}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {batches.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
            <Package className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-slate-700">Recent Batches ({batches.length})</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {batches.map((b) => (
              <li
                key={b.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 cursor-pointer"
                onClick={() => navigate(`/owner/warranty-management/batch/${b.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/owner/warranty-management/batch/${b.id}`)}
                role="button"
                tabIndex={0}
              >
                <span className="font-medium text-slate-800">{b.batch_name || "—"}</span>
                <span className="text-xs text-slate-500">View details →</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {policies.length === 0 && batches.length === 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-600">No warranty policies or batches yet for this product.</p>
          <p className="text-xs text-slate-500 mt-1">Add a product from Add Product to create policies and batches.</p>
        </div>
      )}
    </div>
  );
}

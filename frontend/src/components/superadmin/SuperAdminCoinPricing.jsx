import { useState, useEffect } from "react";
import {
  Coins,
  RefreshCw,
  Loader2,
  Save,
  DollarSign,
  FileText,
  Package,
  Edit2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getCoinPricing, updateCoinPricing } from "../../services/superAdminService";

export function SuperAdminCoinPricing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editPackages, setEditPackages] = useState(false);
  const [editActions, setEditActions] = useState(false);
  const [editWarranty, setEditWarranty] = useState(false);
  const [packagesForm, setPackagesForm] = useState([]);
  const [actionsForm, setActionsForm] = useState([]);
  const [warrantyForm, setWarrantyForm] = useState({ 3: 1, 6: 2, 12: 4 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCoinPricing();
      setData(res);
      setPackagesForm(res.packages || []);
      setActionsForm(res.actionCosts || []);
    } catch {
      toast.error("Failed to load coin pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePackageChange = (index, field, value) => {
    const next = [...packagesForm];
    next[index] = { ...next[index], [field]: value };
    setPackagesForm(next);
  };

  const handleActionChange = (index, field, value) => {
    const next = [...actionsForm];
    next[index] = { ...next[index], [field]: value };
    setActionsForm(next);
  };

  const handleSavePackages = async () => {
    setSaving(true);
    try {
      await updateCoinPricing({ packages: packagesForm });
      toast.success("Packages updated");
      setEditPackages(false);
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update packages");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveActions = async () => {
    setSaving(true);
    try {
      await updateCoinPricing({ actionCosts: actionsForm });
      toast.success("Action costs updated");
      setEditActions(false);
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update action costs");
    } finally {
      setSaving(false);
    }
  };

  const handleWarrantyChange = (months, value) => {
    setWarrantyForm((prev) => ({ ...prev, [months]: parseInt(value, 10) || 0 }));
  };

  const handleSaveWarranty = async () => {
    setSaving(true);
    try {
      await updateCoinPricing({ warrantyCostByMonths: warrantyForm });
      toast.success("Warranty costs updated");
      setEditWarranty(false);
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update warranty costs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  const base = data?.baseRate || {};
  const warranty = data?.warrantyCostByMonths || {};

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-[#1A7FC1]" />
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Global Coin Pricing</h1>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Base Rate - Read Only */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#1A7FC1]" />
          Base Rate
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500">1 coin</p>
            <p className="font-semibold text-slate-800">= {base.cents_per_coin}¢ USD</p>
          </div>
          <div>
            <p className="text-slate-500">1 coin (INR)</p>
            <p className="font-semibold text-slate-800">₹{base.rupees_per_coin}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-slate-400 text-xs">{base.note}</p>
          </div>
        </div>
      </div>

      {/* Warranty Cost by Duration - Editable */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1A7FC1]" />
            Warranty Cost (coins per product)
          </h3>
          {!editWarranty ? (
            <button
              onClick={() => setEditWarranty(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[#1A7FC1] hover:bg-[#1A7FC1]/10 rounded-lg text-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditWarranty(false);
                  setWarrantyForm(data?.warrantyCostByMonths || { 3: 1, 6: 2, 12: 4 });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSaveWarranty}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A7FC1] text-white rounded-lg text-sm hover:bg-[#166EA8] disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {[3, 6, 12].map((months) =>
            editWarranty ? (
              <div key={months} className="flex items-center gap-2">
                <span className="text-slate-500">{months} months</span>
                <input
                  type="number"
                  min="0"
                  value={warrantyForm[months] ?? ""}
                  onChange={(e) => handleWarrantyChange(months, e.target.value)}
                  className="w-16 px-2 py-1.5 border border-slate-200 rounded"
                />
                <span className="text-slate-400">coins</span>
              </div>
            ) : (
              <div key={months} className="px-4 py-2 bg-slate-50 rounded-lg">
                <span className="text-slate-500">{months} months</span>
                <span className="ml-2 font-semibold">{warranty[months] ?? "-"} coins</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Coin Packages - Editable */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#1A7FC1]" />
            Coin Packages
          </h3>
          {!editPackages ? (
            <button
              onClick={() => setEditPackages(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[#1A7FC1] hover:bg-[#1A7FC1]/10 rounded-lg text-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditPackages(false);
                  setPackagesForm(data?.packages || []);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSavePackages}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A7FC1] text-white rounded-lg text-sm hover:bg-[#166EA8] disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Base Coins</th>
                <th className="pb-3 pr-4">Bonus</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3">Popular</th>
              </tr>
            </thead>
            <tbody>
              {(editPackages ? packagesForm : data?.packages || []).map((pkg, i) =>
                editPackages ? (
                  <tr key={pkg.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <input
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(i, "name", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        value={pkg.coins}
                        onChange={(e) => handlePackageChange(i, "coins", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        value={pkg.bonus_coins}
                        onChange={(e) => handlePackageChange(i, "bonus_coins", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(i, "price", e.target.value)}
                        className="w-24 px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={pkg.is_popular}
                        onChange={(e) => handlePackageChange(i, "is_popular", e.target.checked)}
                        className="rounded"
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={pkg.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{pkg.name}</td>
                    <td className="py-3 pr-4">{pkg.coins}</td>
                    <td className="py-3 pr-4">{pkg.bonus_coins}</td>
                    <td className="py-3 pr-4">{pkg.currency === "USD" ? "$" : "₹"}{pkg.price}</td>
                    <td className="py-3">{pkg.is_popular ? "Yes" : ""}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Costs - Editable */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1A7FC1]" />
            Action Costs (coins per action)
          </h3>
          {!editActions ? (
            <button
              onClick={() => setEditActions(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[#1A7FC1] hover:bg-[#1A7FC1]/10 rounded-lg text-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditActions(false);
                  setActionsForm(data?.actionCosts || []);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSaveActions}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A7FC1] text-white rounded-lg text-sm hover:bg-[#166EA8] disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4">Cost (coins)</th>
                <th className="pb-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {(editActions ? actionsForm : data?.actionCosts || []).map((ac, i) =>
                editActions ? (
                  <tr key={ac.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-mono text-xs">{ac.action}</td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min="0"
                        value={ac.cost}
                        onChange={(e) => handleActionChange(i, "cost", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        value={ac.description}
                        onChange={(e) => handleActionChange(i, "description", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={ac.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-mono text-xs">{ac.action}</td>
                    <td className="py-3 pr-4 font-medium">{ac.cost} coins</td>
                    <td className="py-3 text-slate-600">{ac.description}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

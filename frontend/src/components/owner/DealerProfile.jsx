import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Package, ShieldCheck,
  Calendar, Loader2, Edit, CreditCard, Globe, Clock, AlertCircle, Plus, X,
} from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  getDealerDetail, createDealerPurchaseOrder, recordDealerPayment,
  getDealerPurchaseOrders as fetchOwnerPOs, getDealerLedgerByOwner,
} from "../../services/ownerService";

export function DealerProfile() {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [ledgerData, setLedgerData] = useState({ entries: [], summary: {} });
  const [showPOForm, setShowPOForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [poForm, setPoForm] = useState({ order_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '', discount_amount: 0, tax_amount: 0, items: [{ product_name: '', model_number: '', quantity: 1, unit_price: 0 }] });
  const [paymentForm, setPaymentForm] = useState({ purchase_order_id: '', amount: '', payment_mode: 'BANK_TRANSFER', transaction_date: new Date().toISOString().slice(0, 10), reference_number: '', notes: '' });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await getDealerDetail(dealerId);
        const data = response?.data || response;
        setDealer(data);
        setStats(data.stats || {});
      } catch (err) {
        toast.error("Failed to load dealer details");
      } finally {
        setIsLoading(false);
      }
    };
    if (dealerId) load();
  }, [dealerId]);

  const loadPOs = async () => {
    try { const data = await fetchOwnerPOs(dealerId); setPurchaseOrders(Array.isArray(data) ? data : []); } catch {}
  };
  const loadLedger = async () => {
    try { const data = await getDealerLedgerByOwner(dealerId); setLedgerData(data); } catch {}
  };

  useEffect(() => {
    if (activeTab === "orders") loadPOs();
    if (activeTab === "payments") loadLedger();
  }, [activeTab, dealerId]);

  const handleCreatePO = async () => {
    if (!poForm.items[0]?.product_name || !poForm.items[0]?.quantity) {
      toast.error("At least one item with product name and quantity is required");
      return;
    }
    setSaving(true);
    try {
      await createDealerPurchaseOrder({ dealer_id: dealerId, ...poForm, items: poForm.items.map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })), discount_amount: Number(poForm.discount_amount), tax_amount: Number(poForm.tax_amount) });
      toast.success("Purchase order created");
      setShowPOForm(false);
      setPoForm({ order_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '', discount_amount: 0, tax_amount: 0, items: [{ product_name: '', model_number: '', quantity: 1, unit_price: 0 }] });
      loadPOs();
    } catch { toast.error("Failed to create purchase order"); } finally { setSaving(false); }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) { toast.error("Amount is required"); return; }
    setSaving(true);
    try {
      await recordDealerPayment({ dealer_id: dealerId, ...paymentForm, amount: Number(paymentForm.amount), transaction_type: "PAYMENT" });
      toast.success("Payment recorded");
      setShowPaymentForm(false);
      setPaymentForm({ purchase_order_id: '', amount: '', payment_mode: 'BANK_TRANSFER', transaction_date: new Date().toISOString().slice(0, 10), reference_number: '', notes: '' });
      loadLedger();
      loadPOs();
    } catch { toast.error("Failed to record payment"); } finally { setSaving(false); }
  };

  const addPOItem = () => setPoForm({ ...poForm, items: [...poForm.items, { product_name: '', model_number: '', quantity: 1, unit_price: 0 }] });
  const removePOItem = (idx) => setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== idx) });
  const updatePOItem = (idx, field, value) => {
    const items = [...poForm.items];
    items[idx] = { ...items[idx], [field]: value };
    setPoForm({ ...poForm, items });
  };

  if (isLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" /></div>;
  if (!dealer) return (
    <div className="p-6 text-center py-32">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">Dealer not found</p>
      <Button onClick={() => navigate("/owner/dealer-management")} variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
    </div>
  );

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Activity" },
    { key: "orders", label: "Purchase Orders" },
    { key: "payments", label: "Payments" },
  ];

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
      <div className="min-w-0"><p className="text-xs text-slate-400 font-medium">{label}</p><p className="text-sm text-slate-900 break-words">{value || "—"}</p></div>
    </div>
  );

  const poTotal = poForm.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0) - Number(poForm.discount_amount) + Number(poForm.tax_amount);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <button onClick={() => navigate("/owner/dealer-management")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Dealers
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1A7FC1] to-[#0F4E78] flex items-center justify-center text-white text-xl font-bold shrink-0">{(dealer.name || "D")[0].toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">{dealer.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dealer.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {dealer.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-slate-500 text-sm">{dealer.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Warranty Registrations", value: stats?.totalRegistrations ?? 0, icon: FileText, color: "text-[#1A7FC1] bg-[#1A7FC1]/10" },
          { label: "Assigned Codes", value: stats?.assignedCodes ?? 0, icon: Package, color: "text-purple-600 bg-purple-50" },
          { label: "Registered Codes", value: stats?.registeredCodes ?? 0, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
          { label: "Activation Rate", value: stats?.assignedCodes > 0 ? `${Math.round(((stats?.registeredCodes ?? 0) / stats.assignedCodes) * 100)}%` : "—", icon: Clock, color: "text-amber-600 bg-amber-50" },
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
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#1A7FC1]" /> Business Details</h3></div>
            <div className="px-5 py-2 divide-y divide-slate-50">
              <InfoRow icon={Building2} label="Company" value={dealer.name} />
              <InfoRow icon={CreditCard} label="GST" value={dealer.gst_number} />
              <InfoRow icon={FileText} label="PAN" value={dealer.pan_number} />
              <InfoRow icon={Calendar} label="Registered" value={dealer.created_at ? new Date(dealer.created_at).toLocaleDateString() : null} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Phone className="w-4 h-4 text-[#1A7FC1]" /> Contact</h3></div>
            <div className="px-5 py-2 divide-y divide-slate-50">
              <InfoRow icon={Mail} label="Email" value={dealer.email} />
              <InfoRow icon={Phone} label="Phone" value={dealer.phone_number ? `${dealer.country_code || ''} ${dealer.phone_number}` : null} />
              <InfoRow icon={MapPin} label="Address" value={dealer.address} />
              <InfoRow icon={Globe} label="Location" value={[dealer.city, dealer.state, dealer.country].filter(Boolean).join(", ") || null} />
            </div>
          </div>
        </div>
      )}

      {/* Activity */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-semibold text-slate-900">Recent Warranty Registrations</h3></div>
          {(stats?.recentRegistrations ?? []).length === 0 ? (
            <div className="text-center py-12"><FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-slate-500 text-sm">No registrations yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Customer</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Product</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Code</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Date</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentRegistrations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3"><p className="font-medium text-slate-900">{r.customer_name || "—"}</p></td>
                      <td className="px-5 py-3 text-slate-600">{r.warranty_code?.product?.product_name || "—"}</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.warranty_code?.warranty_code || "—"}</span></td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Purchase Orders</h3>
            <button onClick={() => setShowPOForm(true)} className="h-9 px-4 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Create Order</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr>
                  <th className="text-left px-4 py-3">Order #</th><th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Amount</th><th className="text-right px-4 py-3">Paid</th>
                  <th className="text-right px-4 py-3">Pending</th><th className="text-center px-4 py-3">Status</th>
                </tr></thead>
                <tbody>
                  {purchaseOrders.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No purchase orders yet</td></tr> : (
                    purchaseOrders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(o.order_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{o.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-600">₹{o.paid_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600">₹{o.pending_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${o.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : o.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{o.payment_status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Payments & Ledger</h3>
            <button onClick={() => { loadPOs(); setShowPaymentForm(true); }} className="h-9 px-4 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Record Payment</button>
          </div>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Total Invoiced</p><p className="text-lg font-bold text-slate-900">₹{(ledgerData.summary.totalInvoiced || 0).toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Total Paid</p><p className="text-lg font-bold text-green-600">₹{(ledgerData.summary.totalPaid || 0).toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Outstanding</p><p className="text-lg font-bold text-red-600">₹{(ledgerData.summary.totalOutstanding || 0).toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Overdue</p><p className="text-lg font-bold text-orange-600">₹{(ledgerData.summary.overdueAmount || 0).toLocaleString()}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr>
                  <th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Order #</th><th className="text-left px-4 py-3">Ref</th>
                  <th className="text-center px-4 py-3">Mode</th><th className="text-right px-4 py-3">Amount</th>
                </tr></thead>
                <tbody>
                  {(ledgerData.entries || []).length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No transactions yet</td></tr> : (
                    ledgerData.entries.map((e) => (
                      <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">{new Date(e.transaction_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-900">{e.transaction_type}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{e.purchase_order?.order_number || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{e.reference_number || '-'}</td>
                        <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{e.payment_mode}</span></td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">+₹{e.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showPOForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Create Purchase Order</h3>
              <button onClick={() => setShowPOForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium text-slate-700">Order Date</label><input type="date" value={poForm.order_date} onChange={(e) => setPoForm({ ...poForm, order_date: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                <div><label className="text-sm font-medium text-slate-700">Due Date</label><input type="date" value={poForm.due_date} onChange={(e) => setPoForm({ ...poForm, due_date: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                <div><label className="text-sm font-medium text-slate-700">Notes</label><input value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><h4 className="text-sm font-semibold text-slate-900">Items</h4><button onClick={addPOItem} className="text-sm text-[#1A7FC1] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button></div>
                {poForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                    <div className="col-span-4"><input placeholder="Product Name *" value={item.product_name} onChange={(e) => updatePOItem(idx, 'product_name', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                    <div className="col-span-2"><input placeholder="Model" value={item.model_number} onChange={(e) => updatePOItem(idx, 'model_number', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                    <div className="col-span-2"><input placeholder="Qty" type="number" min="1" value={item.quantity} onChange={(e) => updatePOItem(idx, 'quantity', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                    <div className="col-span-3"><input placeholder="Unit Price" type="number" min="0" value={item.unit_price} onChange={(e) => updatePOItem(idx, 'unit_price', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                    <div className="col-span-1">{poForm.items.length > 1 && <button onClick={() => removePOItem(idx)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm text-slate-500">Discount</label><input type="number" min="0" value={poForm.discount_amount} onChange={(e) => setPoForm({ ...poForm, discount_amount: e.target.value })} className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                <div><label className="text-sm text-slate-500">Tax</label><input type="number" min="0" value={poForm.tax_amount} onChange={(e) => setPoForm({ ...poForm, tax_amount: e.target.value })} className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                <div><label className="text-sm text-slate-500">Total</label><p className="mt-1 h-9 flex items-center text-lg font-bold text-slate-900">₹{poTotal.toLocaleString()}</p></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowPOForm(false)} className="h-10 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
                <button onClick={handleCreatePO} disabled={saving} className="h-10 px-6 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm disabled:opacity-50">{saving ? 'Creating...' : 'Create Order'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Record Payment</h3>
              <button onClick={() => setShowPaymentForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Against Order (optional)</label>
                <select value={paymentForm.purchase_order_id} onChange={(e) => setPaymentForm({ ...paymentForm, purchase_order_id: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]">
                  <option value="">General Payment</option>
                  {purchaseOrders.filter((o) => o.pending_amount > 0).map((o) => (
                    <option key={o.id} value={o.id}>{o.order_number} — Pending ₹{o.pending_amount.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700">Amount (₹) *</label><input type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                <div><label className="text-sm font-medium text-slate-700">Payment Mode</label>
                  <select value={paymentForm.payment_mode} onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]">
                    {['CASH', 'UPI', 'NEFT', 'CHEQUE', 'BANK_TRANSFER', 'OTHER'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium text-slate-700">Date</label><input type="date" value={paymentForm.transaction_date} onChange={(e) => setPaymentForm({ ...paymentForm, transaction_date: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
                <div><label className="text-sm font-medium text-slate-700">Reference #</label><input value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Notes</label><textarea rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowPaymentForm(false)} className="h-10 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
                <button onClick={handleRecordPayment} disabled={saving} className="h-10 px-6 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm disabled:opacity-50">{saving ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

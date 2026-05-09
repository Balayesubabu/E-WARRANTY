import { useState, useEffect, useCallback } from 'react';
import { Box, Loader2, FileText, ChevronRight, WashingMachine, Smartphone, Armchair, Car, Cpu } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  getCategories,
  getAllTemplates,
  getTemplateWithFields,
  initializeDefaults,
  registerWarranty,
  getRegistrations,
} from '../../services/warrantyTemplateService';
import { WarrantyRegistrationForm } from '../warranty-template/WarrantyRegistrationForm';

export function WarrantyProducts() {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateWithFields, setSelectedTemplateWithFields] = useState(null);
  const [loadingTemplateFields, setLoadingTemplateFields] = useState(false);
  const [registrations, setRegistrations] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const list = await getCategories();
      setCategories(list);
    } catch {
      toast.error('Failed to load categories');
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let list = await getAllTemplates();
      list = Array.isArray(list) ? list : [];
      if (list.length === 0) {
        await initializeDefaults();
        list = await getAllTemplates();
        list = Array.isArray(list) ? list : [];
      }
      setTemplates(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (activeTab !== 'manage') return;
    getRegistrations()
      .then(setRegistrations)
      .catch(() => toast.error('Failed to load registrations'));
  }, [activeTab]);

  const filteredTemplates =
    selectedCategoryId && selectedCategoryId !== 'all'
      ? (templates || []).filter(
          (t) =>
            (t.category && t.category.id === selectedCategoryId) ||
            (t.category_id && t.category_id === selectedCategoryId)
        )
      : templates || [];

  const handleSelectTemplate = async (t) => {
    setSelectedTemplate(t);
    setSelectedTemplateWithFields(null);
    if (!t?.id) return;
    setLoadingTemplateFields(true);
    try {
      const templateWithFields = await getTemplateWithFields(t.id);
      setSelectedTemplateWithFields(templateWithFields);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load template details');
    } finally {
      setLoadingTemplateFields(false);
    }
  };

  const handleSubmitRegistration = async (data) => {
    if (!selectedTemplate?.id) {
      toast.error('Select a template first');
      return;
    }
    setSubmitting(true);
    try {
      await registerWarranty(selectedTemplate.id, data);
      toast.success('Warranty registered successfully');
      if (activeTab === 'manage') getRegistrations().then(setRegistrations);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to register');
    } finally {
      setSubmitting(false);
    }
  };

  const getWarrantyBadge = (name) => {
    if (!name) return null;
    const n = name.toLowerCase();
    if (n.includes('basic')) return '6 months';
    if (n.includes('extended') || n.includes('premium')) return '24 months';
    return '12 months';
  };

  const getCategoryIcon = (categoryName) => {
    const c = (categoryName || '').toLowerCase();
    if (c.includes('applianc')) return WashingMachine;
    if (c.includes('electronic')) return Smartphone;
    if (c.includes('furniture')) return Armchair;
    if (c.includes('auto') || c.includes('automotive')) return Car;
    if (c.includes('it') || c.includes('industrial')) return Cpu;
    return FileText;
  };

  const getTemplateDescription = (t) => {
    const cat = t.category?.name || t.category?.category_name || '';
    const catLower = cat ? cat.toLowerCase() : 'this product';
    const n = (t.name || '').toLowerCase();
    if (n.includes('basic')) return `Basic coverage for ${catLower} products.`;
    if (n.includes('extended')) return `Extended coverage for major ${catLower}.`;
    if (n.includes('premium')) return `Premium warranty for ${catLower} and furnishings.`;
    return `Standard warranty for ${catLower} products.`;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Warranty Products</h1>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'add' ? 'bg-[#1A7FC1] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Add
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'manage' ? 'bg-[#1A7FC1] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Manage
        </button>
      </div>

      {activeTab === 'manage' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-800">Warranty Registrations</h2>
            <p className="text-sm text-slate-500 mt-0.5">View all template-based registrations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 text-slate-600 font-medium">Template</th>
                  <th className="px-4 py-3 text-slate-600 font-medium">Data Preview</th>
                  <th className="px-4 py-3 text-slate-600 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {registrations.items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No registrations yet.
                    </td>
                  </tr>
                )}
                {registrations.items.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{r.template?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {JSON.stringify(r.data).slice(0, 80)}...
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* LEFT: Static e-warranty registration form (all fields for warranty code generation) */}
          <aside className="lg:w-96 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <WarrantyRegistrationForm
                onSubmit={handleSubmitRegistration}
                onCancel={() => {}}
                submitting={submitting}
                selectedTemplate={selectedTemplate}
                templateWithFields={selectedTemplateWithFields}
                loadingTemplateFields={loadingTemplateFields}
              />
            </div>
          </aside>

          {/* RIGHT: Template cards + Category dropdown below */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-sm font-semibold text-slate-800">Standard Templates</h3>
                <div>
                  <label htmlFor="category-select" className="sr-only">Select Category</label>
                  <select
                    id="category-select"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm min-w-[160px]"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.slice(0, 8).map((t) => {
                      const Icon = getCategoryIcon(t.category?.name);
                      const badge = getWarrantyBadge(t.name);
                      const description = getTemplateDescription(t);
                      const isSelected = selectedTemplate?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleSelectTemplate(t)}
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#1A7FC1] bg-[#1A7FC1]/5 ring-2 ring-[#1A7FC1]/30 shadow-sm'
                              : 'border-slate-200 hover:border-[#1A7FC1]/50 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 rounded-lg bg-[#1A7FC1]/10 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-[#1A7FC1]" />
                            </div>
                            {badge && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {badge}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-800">{t.name}</h4>
                          <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 min-h-[2.5rem]">{description}</p>
                          <Button
                            size="sm"
                            className="mt-3 w-full bg-[#1A7FC1] hover:bg-[#166EA8]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTemplate(t);
                            }}
                          >
                            Select
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {filteredTemplates.length === 0 && !loading && (
                    <div className="py-8 text-center">
                      <Box className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">
                        {templates.length === 0
                          ? 'No templates yet. Refresh to initialize defaults.'
                          : 'No templates for this category. Try "All Categories".'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

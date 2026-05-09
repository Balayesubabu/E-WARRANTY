import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

/**
 * Build initial form state from template fields: one key per field.name.
 * Dropdowns get first choice as default; others get ''.
 */
function getInitialFormFromFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return {};
  const initial = {};
  for (const f of fields) {
    if (f.field_type === 'dropdown' && f.options?.choices?.length) {
      initial[f.name] = f.options.choices[0];
    } else {
      initial[f.name] = '';
    }
  }
  return initial;
}

export function WarrantyRegistrationForm({
  onSubmit,
  onCancel,
  submitting,
  selectedTemplate,
  templateWithFields,
  loadingTemplateFields,
}) {
  const fields = templateWithFields?.fields ?? [];
  const [form, setForm] = useState(() => getInitialFormFromFields(fields));
  const [errors, setErrors] = useState({});

  // When template (with fields) changes, reset form to match the new template's fields
  useEffect(() => {
    const templateFields = templateWithFields?.fields ?? [];
    setForm(getInitialFormFromFields(templateFields));
    setErrors({});
  }, [templateWithFields?.id]);

  const handleChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const validate = () => {
    const next = {};
    for (const f of fields) {
      if (f.required) {
        const val = form[f.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          next[f.name] = (f.label || f.name) + ' is required';
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!templateWithFields?.id) return;
    if (!validate()) return;
    onSubmit(form);
    setForm(getInitialFormFromFields(fields));
    setErrors({});
  };

  if (loadingTemplateFields) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1] mb-3" />
        <p className="text-sm">Loading template details...</p>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="py-6 text-center text-slate-500">
        <p className="text-sm">Select a template from the right to see its fields and enter details.</p>
      </div>
    );
  }

  if (!templateWithFields || !fields.length) {
    return (
      <div className="py-6 text-center text-slate-500">
        <p className="text-sm">This template has no fields to fill. Select another template.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-2">
        {templateWithFields.name || 'Template'} — Enter details
      </h3>

      {fields.map((field) => {
        const value = form[field.name] ?? '';
        const error = errors[field.name];
        const label = field.label || field.name;
        const placeholder = field.placeholder || (field.required ? `Enter ${label.toLowerCase()}` : 'Optional');

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            {field.field_type === 'textarea' && (
              <Textarea
                id={field.name}
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className={`resize-none ${error ? 'border-red-500' : ''}`}
              />
            )}
            {field.field_type === 'date' && (
              <Input
                id={field.name}
                type="date"
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={error ? 'border-red-500' : ''}
              />
            )}
            {field.field_type === 'dropdown' && (
              <select
                id={field.name}
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={`w-full h-10 rounded-md border px-3 text-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
              >
                {field.options?.choices?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {(field.field_type === 'text' || field.field_type === 'number' || field.field_type === 'file' || !field.field_type) && (
              <Input
                id={field.name}
                type={field.field_type === 'number' ? 'number' : field.field_type === 'file' ? 'file' : 'text'}
                value={field.field_type === 'file' ? undefined : value}
                onChange={(e) =>
                  handleChange(
                    field.name,
                    field.field_type === 'file' ? (e.target.files?.[0]?.name ?? '') : e.target.value
                  )
                }
                placeholder={placeholder}
                className={error ? 'border-red-500' : ''}
              />
            )}
            {field.field_type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <input
                  id={field.name}
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1A7FC1] focus:ring-[#1A7FC1]"
                />
                <span className="text-sm text-slate-600">{placeholder}</span>
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      })}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Registration'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

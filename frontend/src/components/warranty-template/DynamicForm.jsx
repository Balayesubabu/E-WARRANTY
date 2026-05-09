import { useState } from 'react';
import { Button } from '../ui/button';
import { DynamicField } from './DynamicField';

export function DynamicForm({ template, onSubmit, onCancel, submitting = false }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const fields = template?.fields ?? [];

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    for (const f of fields) {
      if (f.required) {
        const v = formData[f.name];
        if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
          next[f.name] = 'Required';
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const layoutType = template?.layout_type || 'simple';
  const isTwoColumn = layoutType === 'two_column';
  const gridClass = isTwoColumn ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={gridClass}>
        {fields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={formData[field.name]}
            onChange={(v) => handleChange(field.name, v)}
            error={errors[field.name]}
          />
        ))}
      </div>
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

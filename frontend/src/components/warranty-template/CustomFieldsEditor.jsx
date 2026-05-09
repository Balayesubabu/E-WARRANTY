import { useState } from 'react';
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Long text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

export function CustomFieldsEditor({ template, fields, onAddField, onUpdateField, onDeleteField, loading }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newField, setNewField] = useState({ name: '', label: '', field_type: 'text', required: false });

  const handleStartEdit = (field) => {
    setEditingId(field.id);
    setEditForm({
      label: field.label,
      field_type: field.field_type,
      required: field.required,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await onUpdateField(editingId, editForm);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (!template) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm p-6">
        Select a template to view and edit its custom fields
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Custom Fields</h3>
        <Button size="sm" onClick={() => setShowAdd(true)} disabled={loading}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
      {showAdd && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <Input
            value={newField.label}
            onChange={(e) => {
              const v = e.target.value;
              setNewField((p) => ({ ...p, label: v, name: (p.name || v).toLowerCase().replace(/\s+/g, '_') }));
            }}
            placeholder="Field label"
          />
          <select
            value={newField.field_type}
            onChange={(e) => setNewField((p) => ({ ...p, field_type: e.target.value }))}
            className="w-full h-9 rounded border border-slate-200 px-2 text-sm"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField((p) => ({ ...p, required: e.target.checked }))}
            />
            Required
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => {
              if (!newField.label.trim()) return;
              await onAddField({ ...newField, name: newField.name || newField.label.toLowerCase().replace(/\s+/g, '_') });
              setShowAdd(false);
              setNewField({ name: '', label: '', field_type: 'text', required: false });
            }}>
              Add Field
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setNewField({ name: '', label: '', field_type: 'text', required: false }); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Edit fields for <span className="font-medium">{template.name}</span>
      </p>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {fields.length === 0 && !loading && (
          <p className="text-sm text-slate-500 py-4">No fields yet. Click Add to create one.</p>
        )}
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100"
          >
            <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
            {editingId === field.id ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={editForm.label}
                  onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Label"
                  className="text-sm"
                />
                <select
                  value={editForm.field_type}
                  onChange={(e) => setEditForm((p) => ({ ...p, field_type: e.target.value }))}
                  className="w-full h-8 rounded border border-slate-200 px-2 text-sm"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.required}
                    onChange={(e) => setEditForm((p) => ({ ...p, required: e.target.checked }))}
                  />
                  Required
                </label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{field.label}</p>
                  <p className="text-xs text-slate-500">{field.field_type} {field.required ? '• Required' : ''}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(field)}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteField(field.id)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

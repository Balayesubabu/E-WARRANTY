import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export function DynamicField({ field, value, onChange, error }) {
  const id = `field-${field.name}`;
  const label = field.label || field.name;
  const placeholder = field.placeholder || '';

  if (field.field_type === 'textarea') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Textarea
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={error ? 'border-red-500' : ''}
          rows={3}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.field_type === 'number') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          id={id}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={placeholder}
          className={error ? 'border-red-500' : ''}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.field_type === 'date') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          id={id}
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={error ? 'border-red-500' : ''}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.field_type === 'checkbox') {
    return (
      <div className="flex items-center gap-2 space-y-0">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.field_type === 'dropdown') {
    const choices = Array.isArray(field.options?.choices) ? field.options.choices : [];
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={`w-full h-10 rounded-md border px-3 text-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
        >
          <option value="">Select...</option>
          {choices.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

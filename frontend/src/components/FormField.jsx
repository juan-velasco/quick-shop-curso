export default function FormField({ id, label, error, hint, ...inputProps }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

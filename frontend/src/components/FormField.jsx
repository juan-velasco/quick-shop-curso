export default function FormField({ id, label, error, hint, className = "", ...inputProps }) {
  const describedBy = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-body-strong">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy || undefined}
        className={`min-h-control w-full rounded-md border bg-surface px-3 py-2.5 text-body-md text-ink disabled:bg-canvas disabled:text-muted ${
          error ? "border-2 border-danger" : "border-control"
        } ${className}`.trim()}
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-caption font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

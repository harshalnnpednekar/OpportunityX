import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = '',
  className = '',
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--accent-danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`form-input ${error ? 'input-error' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {helperText && !error && (
        <span id={helperId} className="form-helper" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
          {helperText}
        </span>
      )}
      {error && (
        <div id={errorId} role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', color: 'var(--accent-danger)', fontSize: '0.8rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function FormSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--accent-danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        className={`form-select ${error ? 'input-error' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value ?? opt.id ?? opt} value={opt.value ?? opt.id ?? opt}>
            {opt.label ?? opt.name ?? opt}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <span id={helperId} className="form-helper" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
          {helperText}
        </span>
      )}
      {error && (
        <div id={errorId} role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', color: 'var(--accent-danger)', fontSize: '0.8rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function FormTextarea({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  rows = 3,
  required = false,
  disabled = false,
  placeholder = '',
  className = '',
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--accent-danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`form-input ${error ? 'input-error' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {helperText && !error && (
        <span id={helperId} className="form-helper" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
          {helperText}
        </span>
      )}
      {error && (
        <div id={errorId} role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', color: 'var(--accent-danger)', fontSize: '0.8rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function SubmitButton({
  loading = false,
  disabled = false,
  children,
  className = 'btn btn-primary',
  loadingText = 'Saving...',
  ...props
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

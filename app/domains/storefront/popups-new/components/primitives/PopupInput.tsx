import React from 'react';
import { useId } from '../../hooks/useId';

export interface PopupInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorText?: string | null;
  fullWidth?: boolean;
  'data-testid'?: string;
}

export const PopupInput: React.FC<PopupInputProps> = ({
  label,
  errorText,
  fullWidth = false,
  className,
  id,
  style,
  'data-testid': testId,
  ...rest
}) => {
  const uniqueId = useId();
  const generatedId = id || uniqueId;

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    ...(fullWidth && { width: '100%' }),
  };

  const labelStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--rb-popup-fg)',
  };

  const inputStyles: React.CSSProperties = {
    display: 'block',
    fontFamily: 'inherit',
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: errorText ? '1px solid var(--rb-popup-error)' : '1px solid var(--rb-popup-input-border)',
    backgroundColor: 'var(--rb-popup-input-bg)',
    color: 'var(--rb-popup-input-fg)',
    transition: 'border-color 0.15s ease',
    minWidth: 0,
    ...(fullWidth && { width: '100%', boxSizing: 'border-box' }),
    ...style,
  };

  const errorStyles: React.CSSProperties = {
    fontSize: '0.8125rem',
    color: 'var(--rb-popup-error)',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.outline = errorText ? '2px solid var(--rb-popup-error)' : '2px solid var(--rb-popup-primary-bg)';
    e.currentTarget.style.outlineOffset = '1px';
    e.currentTarget.style.borderColor = errorText ? 'var(--rb-popup-error)' : 'var(--rb-popup-primary-bg)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.outline = '';
    e.currentTarget.style.outlineOffset = '';
    e.currentTarget.style.borderColor = errorText ? 'var(--rb-popup-error)' : 'var(--rb-popup-input-border)';
  };

  return (
    <div style={containerStyles}>
      {label && (
        <label htmlFor={generatedId} style={labelStyles}>
          {label}
        </label>
      )}
      
      <input
        id={generatedId}
        className={className}
        style={inputStyles}
        aria-invalid={!!errorText}
        aria-describedby={errorText ? `${generatedId}-error` : undefined}
        data-testid={testId}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      />
      
      {errorText && (
        <span id={`${generatedId}-error`} style={errorStyles} role="alert">
          {errorText}
        </span>
      )}
    </div>
  );
};

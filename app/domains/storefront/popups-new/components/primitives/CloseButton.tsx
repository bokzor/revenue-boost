import React from 'react';

export interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  position?: 'inside' | 'absolute';
  'data-testid'?: string;
}

export const CloseButton: React.FC<CloseButtonProps> = ({
  position = 'absolute',
  className,
  style,
  'aria-label': ariaLabel = 'Close popup',
  onClick,
  'data-testid': testId = 'popup-close-button',
  ...rest
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const closeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isHovered ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: isHovered ? 'var(--rb-popup-fg)' : 'var(--rb-popup-description-fg)',
    borderRadius: '50%',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    width: '44px',
    height: '44px',
    ...(position === 'absolute' && {
      position: 'absolute',
      top: '0.5rem',
      right: '0.5rem',
      zIndex: 10,
    }),
    ...style,
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = '2px solid var(--rb-popup-fg)';
    e.currentTarget.style.outlineOffset = '2px';
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = '';
    e.currentTarget.style.outlineOffset = '';
  };

  return (
    <button
      type="button"
      className={className}
      style={closeStyles}
      aria-label={ariaLabel}
      onClick={onClick}
      data-testid={testId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
};

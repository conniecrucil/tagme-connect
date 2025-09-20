import React from 'react';

interface CashAppIconProps {
  className?: string;
}

export const CashAppIcon: React.FC<CashAppIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.59 6.29a1.58 1.58 0 0 0-1.22-.4H6.4L5.73 3.16A1.58 1.58 0 0 0 4.25 2H1.5a.5.5 0 0 0 0 1h2.75l1.5 7.25a.5.5 0 0 0 .49.4h12.5a1.25 1.25 0 0 1 0 2.5H8.5a.5.5 0 0 0 0 1h12.5a2.25 2.25 0 0 0 0-4.5H7.75l-.25-1.25h13.5a1.58 1.58 0 0 0 1.59-1.59V6.29z"/>
    </svg>
  );
};

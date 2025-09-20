import React from 'react';

interface MatrixIconProps {
  className?: string;
}

export const MatrixIcon: React.FC<MatrixIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold">[m]</text>
    </svg>
  );
};

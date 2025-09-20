import React from 'react';

interface MatrixIconProps {
  className?: string;
}

export const MatrixIcon: React.FC<MatrixIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Official Matrix logo - diamond shape with inner diamond */}
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      <path d="M12 4L4 8l8 4 8-4-8-4zM4 16l8 4 8-4M4 10l8 4 8-4"/>
    </svg>
  );
};

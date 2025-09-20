import React from 'react';

interface BemerIconProps {
  className?: string;
}

export const BemerIcon: React.FC<BemerIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Bemer logo - stylized B with medical cross */}
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <path d="M8 6h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2zm0 2v8h8V8H8zm2 2h4v4h-4v-4z"/>
      <path d="M10 10h4v4h-4z"/>
      <path d="M12 8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z"/>
    </svg>
  );
};

import React from 'react';

interface ArtStationIconProps {
  className?: string;
}

export const ArtStationIcon: React.FC<ArtStationIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-.896 3.461-2.189 4.661-1.293 1.2-3.084 1.858-4.979 1.858s-3.686-.658-4.979-1.858c-1.293-1.2-2.02-2.803-2.189-4.661-.169-1.858.169-3.686 1.462-4.979 1.293-1.293 3.084-1.462 4.979-1.462s3.686.169 4.979 1.462c1.293 1.293 1.631 3.121 1.462 4.979z"/>
    </svg>
  );
};

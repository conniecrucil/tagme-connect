import React from 'react';

interface TagMeLogoProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const TagMeLogo: React.FC<TagMeLogoProps> = ({ 
  width = 120, 
  height = 60, 
  className 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 50 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Wi-Fi signal extending from T */}
      <path 
        d="M15 8 L15 2 L22 2" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
      />
      <path 
        d="M22 2 Q25 2 25 5" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
      />
      <path 
        d="M25 5 Q28 5 28 8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
      />
      <path 
        d="M28 8 Q31 8 31 11" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* TAG text */}
      <text 
        x="15" 
        y="25" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontSize="16" 
        fontWeight="bold" 
        fill="currentColor"
      >
        TAG
      </text>
      
      {/* ME text */}
      <text 
        x="15" 
        y="45" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontSize="16" 
        fontWeight="bold" 
        fill="currentColor"
      >
        ME
      </text>
    </svg>
  );
};

export default TagMeLogo;

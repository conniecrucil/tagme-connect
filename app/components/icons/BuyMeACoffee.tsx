import React from 'react';

interface BuyMeACoffeeIconProps {
  className?: string;
}

export const BuyMeACoffeeIcon: React.FC<BuyMeACoffeeIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.317 11.566c0 6.427-5.207 11.634-11.634 11.634S.049 17.993.049 11.566C.049 5.139 5.256-.068 11.683-.068s11.634 5.207 11.634 11.634z"/>
      <path d="M16.5 7.5h-1.5V6h-3v1.5H10.5c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5h6c.83 0 1.5-.67 1.5-1.5V9c0-.83-.67-1.5-1.5-1.5zM15 16.5H9V9.75h6v6.75z"/>
    </svg>
  );
};

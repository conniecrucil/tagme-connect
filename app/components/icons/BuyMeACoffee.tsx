import React from 'react';

interface BuyMeACoffeeIconProps {
  className?: string;
}

export const BuyMeACoffeeIcon: React.FC<BuyMeACoffeeIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Buy Me a Coffee logo - coffee cup */}
      <path d="M20.5 3H4C2.9 3 2 3.9 2 5v11c0 1.1.9 2 2 2h14.5c.8 0 1.5-.7 1.5-1.5v-10C22 3.7 21.3 3 20.5 3zM4 5h16v11H4V5zm15.5 11c0 .3-.2.5-.5.5H4c-.3 0-.5-.2-.5-.5V5c0-.3.2-.5.5-.5h15c.3 0 .5.2.5.5v11z"/>
      <path d="M6 7h8v1H6zm0 2h8v1H6zm0 2h6v1H6zm10 2h2v1h-2zm-2 0h2v1h-2zm-2 0h2v1h-2z"/>
      <path d="M8 6h6c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1zm1 2v6h4V8H9z"/>
      <path d="M18 19h2v2h-2zm-2 0h2v2h-2zm-2 0h2v2h-2z"/>
    </svg>
  );
};

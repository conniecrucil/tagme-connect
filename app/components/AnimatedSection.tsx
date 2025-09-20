import { type ReactNode } from 'react';
import { useScrollAnimation } from '../lib/useScrollAnimation';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: 'fade-in-up' | 'fade-in-left' | 'fade-in-right' | 'fade-in-down';
  delay?: number;
  className?: string;
}

export function AnimatedSection({ 
  children, 
  animation = 'fade-in-up', 
  delay = 0,
  className = '' 
}: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollAnimation();

  const animationClass = isVisible ? `animate-${animation}` : 'opacity-0 translate-y-8';
  const delayStyle = { animationDelay: `${delay}ms` };

  return (
    <div 
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all duration-700 ${animationClass} ${className}`}
      style={delayStyle}
    >
      {children}
    </div>
  );
}

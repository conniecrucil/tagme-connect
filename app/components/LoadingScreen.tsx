import { useState, useEffect } from 'react';
import tagmeLogo from '../assets/tagme-logo.svg';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 400; // 0.4 seconds
    const interval = 16; // ~60fps
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 100); // Small delay to ensure smooth transition
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="animate-pulse">
          <img 
            src={tagmeLogo} 
            alt="TagMe Connections" 
            className="h-20 w-auto"
          />
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            TagMe Connections
          </h2>
          <p className="text-gray-600">
            Your brand in their pocket—always.
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-600 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import tagmeLogo from '../assets/tagme-logo.svg';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 20);
    const completeTimer = window.setTimeout(() => onComplete(), 220);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/95 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm">
        <img
          src={tagmeLogo}
          alt="TagMe Connections"
          className="h-8 w-auto"
        />
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-green-600" />
      </div>
    </div>
  );
}

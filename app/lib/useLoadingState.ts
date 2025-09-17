import { useState, useEffect } from 'react';

export function useLoadingState(initialDelay = 0) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialDelay > 0) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, initialDelay);
      return () => clearTimeout(timer);
    } else {
      // Use requestAnimationFrame to ensure DOM is ready
      const timer = requestAnimationFrame(() => {
        setIsLoading(false);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [initialDelay]);

  return isLoading;
}

export function useImageLoading(src: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    const handleLoad = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoading, hasError };
}

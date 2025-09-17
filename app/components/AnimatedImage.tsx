import { useState, useEffect } from 'react';
import { SkeletonImage } from './ui/skeleton';
import { cn } from '../lib/utils';

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function AnimatedImage({
  src,
  alt,
  className,
  placeholderClassName,
  onLoad,
  onError,
  aspectRatio = 'auto'
}: AnimatedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setImageLoaded(false);

    const img = new Image();
    
    const handleLoad = () => {
      setIsLoading(false);
      setImageLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <SkeletonImage 
        className={cn(
          getAspectRatioClass(),
          placeholderClassName
        )} 
      />
    );
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          getAspectRatioClass(),
          className
        )}
      >
        <span className="text-muted-foreground text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", getAspectRatioClass())}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          imageLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
}
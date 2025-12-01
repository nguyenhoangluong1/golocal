import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component with lazy loading and placeholder support
 * - Lazy loads images by default
 * - Shows placeholder while loading
 * - Handles errors gracefully
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  placeholder,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);
    setImageSrc(placeholder || '');

    // Load the actual image
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      // Fallback to placeholder or a default image
      setImageSrc(placeholder || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=800&fit=crop');
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholder, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      loading={loading}
      decoding="async"
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImageSrc(placeholder || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=800&fit=crop');
          onError?.();
        }
      }}
    />
  );
}


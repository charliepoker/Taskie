import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from 'antd';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  lazy = true,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    // Skip intersection observer in test environment
    if (
      process.env.NODE_ENV === 'test' ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number, h: number) => {
    // Skip canvas generation in test environment
    if (process.env.NODE_ENV === 'test') {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=';
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, w, h);
      }
      return canvas.toDataURL();
    } catch (error) {
      // Fallback for environments without canvas support
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=';
    }
  };

  const defaultBlurDataURL =
    blurDataURL ||
    (width && height ? generateBlurDataURL(width, height) : undefined);

  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height, ...style }}
      >
        <svg
          className='w-8 h-8'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`} style={style}>
      {isLoading && (
        <Skeleton.Image
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
          }}
        />
      )}

      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          className={
            isLoading
              ? 'opacity-0'
              : 'opacity-100 transition-opacity duration-300'
          }
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit: 'cover',
            ...(!fill && { width, height }),
          }}
        />
      )}
    </div>
  );
}

// Avatar component with optimized image loading
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
  fallback,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-600 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        {fallback || (
          <span className='text-sm font-medium'>
            {alt.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      quality={80}
      priority={false}
      onError={() => setHasError(true)}
    />
  );
}

// Hook for preloading images
export function useImagePreloader(urls: string[]) {
  useEffect(() => {
    const preloadImages = urls.map(url => {
      const img = new window.Image();
      img.src = url;
      return img;
    });

    return () => {
      preloadImages.forEach(img => {
        img.src = '';
      });
    };
  }, [urls]);
}

// Progressive image loading component
export function ProgressiveImage({
  lowQualitySrc,
  highQualitySrc,
  alt,
  src: _src,
  ...props
}: OptimizedImageProps & {
  lowQualitySrc: string;
  highQualitySrc: string;
}) {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  return (
    <div className='relative'>
      {/* Low quality image loads first */}
      <OptimizedImage
        src={lowQualitySrc}
        alt={alt}
        quality={20}
        className={`transition-opacity duration-300 ${isHighQualityLoaded ? 'opacity-0' : 'opacity-100'}`}
        {...props}
      />

      {/* High quality image loads on top */}
      <div className='absolute inset-0'>
        <OptimizedImage
          src={highQualitySrc}
          alt={alt}
          quality={85}
          className={`transition-opacity duration-300 ${isHighQualityLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsHighQualityLoaded(true)}
          {...props}
        />
      </div>
    </div>
  );
}

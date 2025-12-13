import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  showPlaceholder?: boolean;
}

/**
 * Optimized image component with lazy loading and placeholder
 */
export function OptimizedImage({
  src,
  alt,
  fallback,
  className,
  showPlaceholder = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  // Use placeholder or fallback
  const displaySrc = hasError && fallback ? fallback : src;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && showPlaceholder && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        {...props}
      />
    </div>
  );
}


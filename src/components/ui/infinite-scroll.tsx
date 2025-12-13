import { useEffect, useRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  loader?: ReactNode;
  endMessage?: ReactNode;
}

/**
 * Infinite scroll component
 * Automatically loads more content when user scrolls near the bottom
 */
export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  loader,
  endMessage,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    }, options);

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    return () => {
      if (observerRef.current && currentSentinel) {
        observerRef.current.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore, threshold]);

  const defaultLoader = (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Загрузка...</span>
    </div>
  );

  const defaultEndMessage = (
    <div className="text-center py-8 text-muted-foreground">
      Все поездки загружены
    </div>
  );

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-1" />
      {isLoading && (loader || defaultLoader)}
      {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
    </>
  );
}


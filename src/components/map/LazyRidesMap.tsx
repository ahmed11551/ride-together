import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load RidesMap component
const RidesMap = lazy(() => import("./RidesMap").then(module => ({ default: module.RidesMap })));

interface LazyRidesMapProps {
  rides: any[];
  height?: string;
}

/**
 * Lazy loaded RidesMap component
 * Only loads the map when it's actually needed
 */
export function LazyRidesMap({ rides, height = "500px" }: LazyRidesMapProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-muted rounded-2xl overflow-hidden" style={{ height }}>
          <Skeleton className="w-full h-full" />
        </div>
      }
    >
      <RidesMap rides={rides} height={height} />
    </Suspense>
  );
}


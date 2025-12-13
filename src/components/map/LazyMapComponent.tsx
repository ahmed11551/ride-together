import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Location } from "./MapComponent";

// Lazy load MapComponent
const MapComponent = lazy(() => import("./MapComponent").then(module => ({ default: module.MapComponent })));

interface LazyMapComponentProps {
  initialLocation?: Location;
  onLocationSelect?: (location: Location) => void;
  mode?: 'view' | 'select';
  height?: string;
  className?: string;
  showControls?: boolean;
}

/**
 * Lazy loaded MapComponent
 * Only loads Yandex Maps API when component is actually rendered
 */
export function LazyMapComponent(props: LazyMapComponentProps) {
  return (
    <Suspense
      fallback={
        <div 
          className={`w-full bg-muted rounded-2xl overflow-hidden ${props.className || ''}`}
          style={{ height: props.height || '400px' }}
        >
          <Skeleton className="w-full h-full" />
        </div>
      }
    >
      <MapComponent {...props} />
    </Suspense>
  );
}


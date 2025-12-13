import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-shimmer rounded-lg", className)} />
);

export const RideCardSkeleton = () => (
  <div className="bg-card rounded-2xl shadow-card overflow-hidden">
    <div className="p-5 border-b border-border">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-0.5 h-10" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="text-right space-y-2">
          <Skeleton className="h-7 w-20 ml-auto" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      </div>
    </div>

    <div className="p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-9 w-20 rounded-lg" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-card rounded-2xl p-6 shadow-card text-center">
      <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-48 mx-auto mb-6" />
      
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-xl bg-muted">
            <Skeleton className="w-5 h-5 mx-auto mb-2" />
            <Skeleton className="h-5 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const BookingCardSkeleton = () => (
  <div className="bg-card rounded-2xl p-5 shadow-card">
    <div className="flex items-start justify-between mb-4">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-4 w-32" />
    </div>
    
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>

    <div className="flex items-center gap-3 py-4 border-t border-border">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

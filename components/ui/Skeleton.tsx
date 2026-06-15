import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-[--radius-card]", className)} />;
}

export function PosterSkeletonRow({ count = 8 }: { count?: number }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-hidden px-5 sm:px-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[150px] shrink-0 sm:w-[170px]">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="mt-2 h-3.5 w-3/4" />
          <Skeleton className="mt-1.5 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PosterGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-5 sm:grid-cols-4 sm:px-8 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="mt-2 h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

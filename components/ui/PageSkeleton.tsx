import { Skeleton, PosterGridSkeleton } from "./Skeleton";

export function PageSkeleton({ title }: { title?: string }) {
  return (
    <>
      <div className="flex items-center gap-4 border-b border-white/5 px-5 py-3.5 sm:px-8">
        {title ? <h1 className="text-lg font-semibold sm:text-xl">{title}</h1> : <Skeleton className="h-7 w-32" />}
      </div>
      <div className="space-y-3 px-5 py-4 sm:px-8">
        <Skeleton className="h-9 w-full max-w-md rounded-full" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="py-2">
        <PosterGridSkeleton />
      </div>
    </>
  );
}

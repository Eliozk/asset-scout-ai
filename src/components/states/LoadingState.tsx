function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated">
      <div className="aspect-[4/3] w-full animate-pulse bg-surface-hover" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-hover" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-hover" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-hover" />
        <div className="h-8 w-full animate-pulse rounded-lg bg-surface-hover" />
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div
      role="status"
      aria-label="Loading results"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

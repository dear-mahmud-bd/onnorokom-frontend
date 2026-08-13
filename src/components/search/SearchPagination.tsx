"use client";

interface SearchPaginationProps {
  take: number;
  skip: number;
  hitCount: number;
  totalMatches: number;
  onPageChange: (nextSkip: number) => void;
}

// Prev/next pager driven by take/skip against totalMatches. Fetch-free: it only
// reports the next skip offset to the parent, which re-queries.
export function SearchPagination({
  take,
  skip,
  hitCount,
  totalMatches,
  onPageChange,
}: SearchPaginationProps) {
  const prevDisabled = skip === 0;
  const nextDisabled = skip + hitCount >= totalMatches;

  const rangeStart = totalMatches === 0 ? 0 : skip + 1;
  const rangeEnd = skip + hitCount;

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">
        Showing {rangeStart}–{rangeEnd} of {totalMatches}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, skip - take))}
          disabled={prevDisabled}
          className="flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(skip + take)}
          disabled={nextDisabled}
          className="flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

// ============================================
// Base Skeleton
// ============================================

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-text-muted/20",
        className
      )}
      {...props}
    />
  );
}

// ============================================
// Card Skeleton (for SourceCard loading state)
// ============================================

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-bg-secondary p-4 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Balance */}
      <Skeleton className="h-6 w-20" />
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />
      {/* Footer */}
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// ============================================
// Button Grid Skeleton
// ============================================

export function ButtonGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ============================================
// Source Grid Skeleton
// ============================================

export function SourceGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// Quick Transaction Page Skeleton
// ============================================

export function QuickTransactionSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      {/* Type Toggle */}
      <div className="flex justify-center">
        <Skeleton className="h-14 w-72 rounded-full" />
      </div>

      {/* Amount Input */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Quick Buttons */}
      <ButtonGridSkeleton count={8} />

      {/* Chime Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <SourceGridSkeleton count={4} />
      </div>

      {/* Platform Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <SourceGridSkeleton count={2} />
      </div>

      {/* Submit Button */}
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  );
}

// ============================================
// Dashboard Card Skeleton
// ============================================

export function DashboardCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-bg-secondary p-6 space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ============================================
// Table Row Skeleton
// ============================================

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-24" : i === columns - 1 ? "w-16" : "w-20"
          )}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-4 py-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

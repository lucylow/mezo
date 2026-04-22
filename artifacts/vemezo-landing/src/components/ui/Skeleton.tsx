import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rounded" | "rect";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = "rounded", width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 w-full rounded",
        variant === "rounded" && "rounded-xl",
        variant === "rect" && "rounded-none",
        className,
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass p-5 space-y-3">
      <Skeleton height={14} width={90} />
      <Skeleton height={34} width={130} />
      <Skeleton height={12} width="60%" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="flex-1" height={18} />
      ))}
    </div>
  );
}

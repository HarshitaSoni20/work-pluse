import React from "react";
import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const styles: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={clsx(
        "animate-pulse bg-slate-200/80",
        variant === "text" && "h-4 w-full rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        className
      )}
      style={styles}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
      <Skeleton height="2.5rem" className="w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "1rem", width: "100%" }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="1.5rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  total?: number;
}

export function Pagination({ page, totalPages, onPageChange, pageSize, total }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null;
  const end = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.875rem 1rem",
        borderTop: "1px solid var(--border)",
        fontSize: "0.875rem",
      }}
    >
      {/* Summary */}
      <span style={{ color: "var(--text-secondary)" }}>
        {start !== null && end !== null && total !== undefined
          ? `${start}–${end} of ${total}`
          : `Page ${page} of ${totalPages}`}
      </span>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-ghost btn-sm"
          aria-label="Previous page"
          style={{ padding: "0.375rem" }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers (show up to 5) */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p: number;
          if (totalPages <= 5) {
            p = i + 1;
          } else if (page <= 3) {
            p = i + 1;
          } else if (page >= totalPages - 2) {
            p = totalPages - 4 + i;
          } else {
            p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="btn btn-sm"
              style={{
                padding: "0.375rem 0.625rem",
                minWidth: "2rem",
                background: p === page ? "var(--color-primary)" : "transparent",
                color: p === page ? "#fff" : "var(--text-secondary)",
                border: p === page ? "none" : "1px solid var(--border)",
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-ghost btn-sm"
          aria-label="Next page"
          style={{ padding: "0.375rem" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

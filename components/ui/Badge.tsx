import clsx from "clsx";

type BadgeVariant = "success" | "warning" | "danger" | "primary" | "info" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "badge",
        variant === "success" && "badge-success",
        variant === "warning" && "badge-warning",
        variant === "danger" && "badge-danger",
        variant === "primary" && "badge-primary",
        variant === "info" && "badge-info",
        variant === "neutral" && "badge-neutral",
        className
      )}
    >
      {children}
    </span>
  );
}

// Convenience helpers for domain-specific statuses
export function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    PRESENT: "success",
    WFH: "info",
    LEAVE: "warning",
    ABSENT: "danger",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}

export function WorklogStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    DONE: "success",
    IN_PROGRESS: "primary",
    BLOCKED: "danger",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status.replace("_", " ")}</Badge>;
}

export function LeaveStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    APPROVED: "success",
    PENDING: "warning",
    REJECTED: "danger",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, BadgeVariant> = {
    ADMIN: "danger",
    MANAGER: "primary",
    EMPLOYEE: "neutral",
  };
  return <Badge variant={map[role] ?? "neutral"}>{role}</Badge>;
}

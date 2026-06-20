import clsx from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={clsx(
        "spinner",
        size === "sm" && "spinner-sm",
        size === "md" && "spinner-md",
        size === "lg" && "spinner-lg",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "16rem",
        gap: "0.75rem",
        color: "var(--text-secondary)",
      }}
    >
      <Spinner size="lg" />
      <span style={{ fontSize: "0.875rem" }}>Loading…</span>
    </div>
  );
}

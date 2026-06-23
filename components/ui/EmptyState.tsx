import React, { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        textAlign: "center",
        background: "var(--bg-card)",
        border: "1px dashed var(--border-strong)",
        borderRadius: "0.75rem",
      }}
    >
      {icon && (
        <div
          style={{
            marginBottom: "1rem",
            color: "var(--text-muted)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 0.5rem 0",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
          maxWidth: "24rem",
          margin: "0 0 1.5rem 0",
          lineHeight: "1.5",
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

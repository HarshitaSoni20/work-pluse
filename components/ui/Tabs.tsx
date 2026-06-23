import React from "react";
import clsx from "clsx";

interface TabOption {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (val: any) => void;
  className?: string;
}

export function Tabs({ options, value, onChange, className }: TabsProps) {
  return (
    <div className={clsx("tabs", className)}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx("tab-btn", isActive && "active")}
          >
            {opt.label}
            {opt.count !== undefined && opt.count > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  background: isActive ? "var(--color-primary-light)" : "#f1f5f9",
                  color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.125rem 0.375rem",
                  borderRadius: "9999px",
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

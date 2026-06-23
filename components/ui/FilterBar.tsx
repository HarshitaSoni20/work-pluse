import React, { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "./Button";

interface FilterBarProps {
  children: ReactNode;
  onClear?: () => void;
  className?: string;
}

export function FilterBar({ children, onClear, className }: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        alignItems: "flex-end",
        width: "100%",
      }}
      className={className}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          flex: 1,
        }}
      >
        {children}
      </div>
      {onClear && (
        <Button
          type="button"
          variant="secondary"
          onClick={onClear}
          style={{ height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Reset filters"
        >
          <RotateCcw size={15} />
          Reset
        </Button>
      )}
    </div>
  );
}

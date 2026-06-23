"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delayMs?: number;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  delayMs = 400,
  className,
}: SearchBarProps) {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(localVal);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [localVal, delayMs, onChange]);

  return (
    <div style={{ position: "relative", width: "100%" }} className={className}>
      <span
        style={{
          position: "absolute",
          left: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          display: "flex",
          pointerEvents: "none",
        }}
      >
        <Search size={16} />
      </span>
      <input
        type="text"
        className="form-input"
        style={{ paddingLeft: "2.25rem", marginBottom: 0 }}
        placeholder={placeholder}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
      />
    </div>
  );
}

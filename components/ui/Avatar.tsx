import React from "react";
import clsx from "clsx";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBgColor = (fullName: string) => {
    // Generate simple stable hash from name to pick a colored background
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", // Indigo
      "linear-gradient(135deg, #059669 0%, #10b981 100%)", // Emerald
      "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)", // Sky
      "linear-gradient(135deg, #ea580c 0%, #f97316 100%)", // Orange
      "linear-gradient(135deg, #db2777 0%, #ec4899 100%)", // Pink
      "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)", // Violet
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeStyles = {
    sm: { width: "1.75rem", height: "1.75rem", fontSize: "0.75rem" },
    md: { width: "2.5rem", height: "2.5rem", fontSize: "0.9rem" },
    lg: { width: "3.5rem", height: "3.5rem", fontSize: "1.25rem" },
  };

  return (
    <div
      className={clsx("rounded-full flex items-center justify-center font-bold text-white shadow-sm", className)}
      style={{
        background: getBgColor(name),
        ...sizeStyles[size],
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

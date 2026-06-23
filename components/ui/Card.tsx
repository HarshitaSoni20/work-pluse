import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className, noPadding }: CardProps) {
  return (
    <div className={clsx("card", noPadding && "!p-0", className)}>{children}</div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  children?: ReactNode;
}

export function StatCard({ label, value, sub, icon, iconBg, iconColor, children }: StatCardProps) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value">{value}</div>
          {sub && <div className="stat-card-sub">{sub}</div>}
          {children && <div style={{ marginTop: "0.75rem" }}>{children}</div>}
        </div>
        {icon && (
          <div
            className="icon-box"
            style={{
              background: iconBg ?? "var(--color-primary-light)",
              color: iconColor ?? "var(--color-primary)",
              marginLeft: "0.75rem",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

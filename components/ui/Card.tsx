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
}

export function StatCard({ label, value, sub, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value">{value}</div>
          {sub && <div className="stat-card-sub">{sub}</div>}
        </div>
        {icon && (
          <div
            className="icon-box"
            style={{
              background: iconBg ?? "var(--color-primary-light)",
              color: iconColor ?? "var(--color-primary)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button className="btn btn-ghost btn-sm" aria-label="Search">
          <Search size={16} />
        </button>
        <button className="btn btn-ghost btn-sm" aria-label="Notifications">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}

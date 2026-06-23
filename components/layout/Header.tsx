import { Bell, Search, Menu } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { currentUser, sidebarCollapsed, setSidebarCollapsed } = useUser();

  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          className="btn btn-ghost btn-sm mobile-menu-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ display: "none", padding: "0.25rem" }}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
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
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {currentUser && (
          <span style={{ fontSize: "0.825rem", fontWeight: 500, color: "var(--text-secondary)", marginRight: "0.25rem" }}>
            Hi, {currentUser.name.split(" ")[0]}
          </span>
        )}
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  CalendarOff,
  Users,
  LogOut,
  Zap,
  ChevronRight,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Attendance", href: "/attendance", icon: <Clock size={18} /> },
  { label: "Work Logs", href: "/worklogs", icon: <ClipboardList size={18} /> },
  { label: "Leaves", href: "/leaves", icon: <CalendarOff size={18} /> },
  { label: "My Team", href: "/team", icon: <Users size={18} />, roles: ["MANAGER"] },
  { label: "Admin Panel", href: "/admin", icon: <Shield size={18} />, roles: ["ADMIN"] },
];

export function Sidebar() {
  const { currentUser, loading, sidebarCollapsed, setSidebarCollapsed } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading || !currentUser) {
    return (
      <aside className={clsx("sidebar", sidebarCollapsed && "collapsed")} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spinner size="sm" />
      </aside>
    );
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentUser.role)
  );

  return (
    <aside className={clsx("sidebar", sidebarCollapsed && "collapsed")}>
      {/* Logo Area */}
      <div
        className="sidebar-logo"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarCollapsed ? "center" : "space-between",
          padding: sidebarCollapsed ? "1.5rem 0.5rem" : "1.5rem 1.25rem",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <div
            style={{
              background: "var(--color-primary)",
              borderRadius: "0.5rem",
              padding: "0.375rem",
              display: "flex",
              flexShrink: 0,
            }}
          >
            <Zap size={18} color="#fff" />
          </div>
          {!sidebarCollapsed && (
            <span
              style={{
                color: "#f1f5f9",
                fontWeight: 700,
                fontSize: "1.125rem",
                letterSpacing: "-0.025em",
              }}
            >
              WorkPulse
            </span>
          )}
        </Link>
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.25rem", color: "#64748b" }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expand trigger when collapsed */}
      {sidebarCollapsed && (
        <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem 0" }}>
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.25rem", color: "#64748b" }}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Role Badge */}
      {!sidebarCollapsed && (
        <div style={{ padding: "0.75rem 1.25rem" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(99,102,241,0.15)",
              color: "#a5b4fc",
              fontSize: "0.7rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {currentUser.role}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ padding: sidebarCollapsed ? "1rem 0.5rem" : "1rem 0.75rem" }}>
        {!sidebarCollapsed && (
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0 0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            Navigation
          </p>
        )}
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("sidebar-nav-item", { active: isActive })}
              style={{
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                padding: sidebarCollapsed ? "0.625rem 0" : "0.625rem 0.875rem",
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
              {isActive && !sidebarCollapsed && (
                <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer" style={{ padding: sidebarCollapsed ? "1rem 0.5rem" : "1rem 0.75rem" }}>
        <div
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
          }}
        >
          <Avatar name={currentUser.name} size="sm" />
          {!sidebarCollapsed && (
            <div style={{ overflow: "hidden", flex: 1 }}>
              <p
                style={{
                  color: "#f1f5f9",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser.name}
              </p>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.75rem",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser.email}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{
            width: "100%",
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
            color: "#94a3b8",
            padding: sidebarCollapsed ? "0.5rem 0" : "0.5rem 0.75rem",
          }}
        >
          <LogOut size={15} />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

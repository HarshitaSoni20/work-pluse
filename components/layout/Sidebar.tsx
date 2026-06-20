"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  CalendarOff,
  Users,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
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

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
}

export function Sidebar({ userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <div
            style={{
              background: "var(--color-primary)",
              borderRadius: "0.5rem",
              padding: "0.375rem",
              display: "flex",
            }}
          >
            <Zap size={18} color="#fff" />
          </div>
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
        </Link>
      </div>

      {/* Role chip */}
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
          {userRole}
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
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
            >
              {item.icon}
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: "0.75rem" }}>
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
            {userName}
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
            {userEmail}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: "100%", justifyContent: "flex-start", color: "#94a3b8" }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

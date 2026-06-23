"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Users, Shield, Calendar, BarChart2 } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface AdminDashboardData {
  cards: {
    totalEmployees: number;
    totalTeams: number;
    attendancePercent: number;
    pendingLeaves: number;
  };
  teamAttendanceChart: { team: string; present: number; wfh: number; absent: number }[];
  teamHoursChart: { team: string; hours: number }[];
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/dashboard/admin");
      if (!res.ok) throw new Error("Failed to fetch admin dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const cards = data?.cards;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Admin Console</h1>
          <p className="page-subtitle">Overview of company-wide attendance, teams, and operations.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/admin?tab=users">
            <Button variant="primary" size="sm">
              Manage Users
            </Button>
          </Link>
          <Link href="/admin?tab=teams">
            <Button variant="secondary" size="sm">
              Manage Teams
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "var(--color-danger-light)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger)",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Cards Row */}
      {cards && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <StatCard
            label="Total Employees"
            value={cards.totalEmployees}
            sub="Active employee accounts"
            icon={<Users size={20} />}
          />
          <StatCard
            label="Total Teams"
            value={cards.totalTeams}
            sub="Departments/Teams created"
            icon={<Shield size={20} />}
            iconBg="var(--color-info-light)"
            iconColor="var(--color-info)"
          />
          <StatCard
            label="Attendance Today"
            value={`${cards.attendancePercent}%`}
            sub="Of employees checked-in today"
            icon={<BarChart2 size={20} />}
            iconBg="var(--color-success-light)"
            iconColor="var(--color-success)"
          />
          <StatCard
            label="Pending Leaves"
            value={cards.pendingLeaves}
            sub="Awaiting admin/manager approval"
            icon={<Calendar size={20} />}
            iconBg="var(--color-warning-light)"
            iconColor="var(--color-warning)"
          />
        </div>
      )}

      {/* Visual Charts */}
      {mounted && data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          {/* Team Attendance stacked Bar Chart */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
              Team-wise Attendance (This Week)
            </h2>
            <div style={{ width: "100%", height: 320 }}>
              {data.teamAttendanceChart.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No attendance records found for active teams.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.teamAttendanceChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="team" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.375rem",
                      }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="present" name="Present" fill="var(--color-success)" stackId="a" />
                    <Bar dataKey="wfh" name="WFH" fill="var(--color-info)" stackId="a" />
                    <Bar dataKey="absent" name="Absent" fill="var(--color-danger)" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Team Hours Bar Chart */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
              Total Hours Logged by Team (This Week)
            </h2>
            <div style={{ width: "100%", height: 320 }}>
              {data.teamHoursChart.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No work hours logged in teams.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.teamHoursChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="team" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.375rem",
                      }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="hours" name="Hours Logged" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper for custom button inside this component file to simplify imports
function Button({ variant = "primary", size = "md", children, ...rest }: any) {
  return (
    <button
      {...rest}
      className={`btn ${
        variant === "primary" ? "btn-primary" : "btn-secondary"
      } ${size === "sm" ? "btn-sm" : ""}`}
    >
      {children}
    </button>
  );
}

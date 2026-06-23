"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useUser } from "@/components/providers/UserProvider";
import { Clock, Calendar, CheckCircle, AlertCircle, Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#6366f1", "#f43f5e"];

interface EmployeeDashboardData {
  cards: {
    weeklyHours: number;
    presentDays: number;
    leaveBalance: number;
    pendingRequests: number;
    blockedTasks: number;
  };
  weeklyHoursTrend: { date: string; hours: number }[];
  taskDistribution: { status: string; count: number }[];
}

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hoursWorked: number | null;
  late: boolean;
}

export function EmployeeDashboard() {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<"PRESENT" | "WFH">("PRESENT");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    fetchTodayAttendance();
  }, []);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/dashboard/employee");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  const { currentUser, refreshUser } = useUser();

  async function fetchTodayAttendance() {
    try {
      const res = await fetch("/api/attendance?pageSize=5");
      if (!res.ok) throw new Error("Failed to fetch attendance history");
      const json = await res.json();
      const items: AttendanceRecord[] = json.items || [];
      
      let todayRecord = null;
      const activeRecord = items.find((item) => !item.checkOut);
      if (activeRecord) {
        todayRecord = activeRecord;
      } else if (items.length > 0) {
        const latest = items[0];
        if (latest.checkIn && new Date(latest.checkIn).toDateString() === new Date().toDateString()) {
          todayRecord = latest;
        }
      }
      setTodayAttendance(todayRecord);
    } catch (err) {
      console.error("Failed to load today's attendance", err);
    }
  }

  async function handleCheckin() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: checkinStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Check-in failed");
      setTodayAttendance(json.attendance);
      fetchDashboardData();
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckout() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Check-out failed");
      setTodayAttendance(json.attendance);
      fetchDashboardData();
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
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
  const taskDistribution = data?.taskDistribution || [];
  const weeklyHoursTrend = data?.weeklyHoursTrend || [];

  const totalTasksCount = taskDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const doneTasks = taskDistribution.find((t) => t.status === "DONE")?.count ?? 0;
  const productivityScore = totalTasksCount > 0 ? Math.round((doneTasks / totalTasksCount) * 100) : 0;

  const attendanceTrendData = weeklyHoursTrend.map((t) => ({
    date: t.date,
    hours: t.hours,
  }));

  const productivityTrendData = weeklyHoursTrend.map((t) => ({
    date: t.date,
    score: Math.min(100, Math.round((t.hours / 8) * 100)),
  }));

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Personal Dashboard</h1>
          <p className="page-subtitle">Track your attendance, work logs, and leave requests.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/worklogs?create=true">
            <Button variant="primary" size="sm">
              <Plus size={16} style={{ marginRight: "0.25rem" }} /> Log Work
            </Button>
          </Link>
          <Link href="/leaves?apply=true">
            <Button variant="secondary" size="sm">
              <Calendar size={16} style={{ marginRight: "0.25rem" }} /> Apply Leave
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

      {/* Grid containing Stat Cards & Attendance Widget */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Attendance Action Widget Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            Attendance Desk
          </div>
          {!todayAttendance ? (
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                You have not checked in today. Select your mode to check in.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Select
                    options={[
                      { value: "PRESENT", label: "Office (Present)" },
                      { value: "WFH", label: "Remote (WFH)" },
                    ]}
                    value={checkinStatus}
                    onChange={(e) => setCheckinStatus(e.target.value as "PRESENT" | "WFH")}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <Button variant="success" onClick={handleCheckin} loading={actionLoading} style={{ height: "40px" }}>
                  Check In
                </Button>
              </div>
            </div>
          ) : !todayAttendance.checkOut ? (
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500, marginBottom: "0.25rem" }}>
                Active Status: <span style={{ color: "var(--color-success)" }}>Checked In</span>
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Started at {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}.
                {todayAttendance.late && <span style={{ color: "var(--color-warning)", fontWeight: 600 }}> (Late Entry)</span>}
              </p>
              <Button variant="danger" onClick={handleCheckout} loading={actionLoading} style={{ width: "100%" }}>
                Check Out
              </Button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500, marginBottom: "0.25rem" }}>
                Status: <span style={{ color: "var(--text-muted)" }}>Checked Out</span>
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0" }}>
                Checked in: {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0" }}>
                Checked out: {todayAttendance.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 600, marginTop: "0.5rem", marginBottom: 0 }}>
                Hours worked: {todayAttendance.hoursWorked ?? 0} hrs
              </p>
            </div>
          )}
        </div>

        {cards && (
          <>
            <StatCard
              label="Weekly Hours"
              value={`${cards.weeklyHours} hrs`}
              sub="Target: 40 hrs"
              icon={<Clock size={20} />}
            >
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, (cards.weeklyHours / 40) * 100)}%`,
                    height: "100%",
                    background: "var(--color-primary)",
                    borderRadius: "9999px",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                <span>Completion</span>
                <span>{Math.round((cards.weeklyHours / 40) * 100)}%</span>
              </div>
            </StatCard>

            <StatCard
              label="Present Days"
              value={`${cards.presentDays} days`}
              sub="Logged attendance this week"
              icon={<CheckCircle size={20} />}
              iconBg="var(--color-success-light)"
              iconColor="var(--color-success)"
            >
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, (cards.presentDays / 7) * 100)}%`,
                    height: "100%",
                    background: "var(--color-success)",
                    borderRadius: "9999px",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                <span>Rate</span>
                <span>{Math.round((cards.presentDays / 7) * 100)}%</span>
              </div>
            </StatCard>

            <StatCard
              label="Leave Balance"
              value={`${currentUser ? (currentUser.leaveBalance ?? 0) : 0} days`}
              sub="Available paid leaves"
              icon={<Calendar size={20} />}
              iconBg="var(--color-info-light)"
              iconColor="var(--color-info)"
            />

            <StatCard
              label="Productivity Score"
              value={`${productivityScore}%`}
              sub="Based on completed tasks"
              icon={<BookOpen size={20} />}
              iconBg="rgba(99,102,241,0.1)"
              iconColor="var(--color-primary)"
            >
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${productivityScore}%`,
                    height: "100%",
                    background: productivityScore >= 80 ? "var(--color-success)" : productivityScore >= 50 ? "var(--color-warning)" : "var(--color-danger)",
                    borderRadius: "9999px",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                <span>Completed</span>
                <span>{doneTasks} of {totalTasksCount}</span>
              </div>
            </StatCard>
          </>
        )}
      </div>

      {/* Visual Analytics Charts */}
      {mounted && data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {/* Weekly Hours Trend */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              Weekly Hours Trend (Line Chart)
            </h2>
            <div style={{ width: "100%", height: 260 }}>
              {weeklyHoursTrend.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No work log hours recorded for this week.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyHoursTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.375rem",
                      }}
                    />
                    <Line type="monotone" dataKey="hours" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Hours Logged" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Attendance Trend Bar Chart */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              Attendance Trend (Bar Chart)
            </h2>
            <div style={{ width: "100%", height: 260 }}>
              {attendanceTrendData.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No attendance logs found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.375rem",
                      }}
                    />
                    <Bar dataKey="hours" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Hours Logged" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Task Status Distribution */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              Work Log Status Distribution
            </h2>
            <div style={{ width: "100%", height: 260, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {taskDistribution.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No tasks logged yet.
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                  <div style={{ flex: 1, height: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskDistribution}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                        >
                          {taskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: "120px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {taskDistribution.map((item, index) => (
                      <div key={item.status} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "3px",
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {item.status.replace("_", " ")}: {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Productivity Trend Area Chart */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              Productivity Trend (Area Chart)
            </h2>
            <div style={{ width: "100%", height: 260 }}>
              {productivityTrendData.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No productivity trend logs.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productivityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.375rem",
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorScore)" name="Productivity %" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

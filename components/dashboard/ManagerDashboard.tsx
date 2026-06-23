"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Users, CheckCircle, Clock, Calendar, AlertCircle, BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#10b981", "#6366f1", "#f43f5e"];

interface ManagerDashboardData {
  cards: {
    teamSize: number;
    presentToday: number;
    pendingApprovals: number;
    blockedTasks: number;
    underLoggers: number;
  };
  teamTable: {
    id: number;
    name: string;
    email: string;
    weeklyHours: number;
    attendancePercent: number;
    blockedTasks: number;
    presentToday: boolean;
  }[];
  dailyTrend: {
    date: string;
    hours: number;
    inProgress: number;
    done: number;
    blocked: number;
  }[];
  taskDistribution: {
    status: string;
    count: number;
  }[];
  attendanceDistribution: {
    name: string;
    value: number;
  }[];
}

export function ManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/dashboard/manager");
      if (!res.ok) throw new Error("Failed to fetch manager dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data");
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
  const teamTable = data?.teamTable || [];
  const dailyTrend = data?.dailyTrend || [];
  const taskDistribution = data?.taskDistribution || [];
  const attendanceDistribution = data?.attendanceDistribution || [];

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Team Dashboard</h1>
          <p className="page-subtitle">Monitor your team's attendance, productivity, and leaves.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/leaves">
            <Button variant="primary" size="sm">
              Approve Leaves
            </Button>
          </Link>
          <Link href="/worklogs">
            <Button variant="secondary" size="sm">
              Team Work Logs
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

      {/* Stats Cards */}
      {cards && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <StatCard
            label="Team Size"
            value={`${cards.teamSize} members`}
            sub="Active team members"
            icon={<Users size={20} />}
          />
          <StatCard
            label="Present Today"
            value={`${cards.presentToday} present`}
            sub="Office/Remote attendance today"
            icon={<CheckCircle size={20} />}
            iconBg="var(--color-success-light)"
            iconColor="var(--color-success)"
          />
          <StatCard
            label="Pending Leaves"
            value={cards.pendingApprovals}
            sub="Awaiting your approval"
            icon={<Calendar size={20} />}
            iconBg="var(--color-warning-light)"
            iconColor="var(--color-warning)"
          />
          <StatCard
            label="Blocked Tasks"
            value={cards.blockedTasks}
            sub="Blocked work log tasks"
            icon={<AlertCircle size={20} />}
            iconBg="var(--color-danger-light)"
            iconColor="var(--color-danger)"
          />
          <StatCard
            label="Under-loggers"
            value={`${cards.underLoggers} employees`}
            sub="Logged < 30 hours this week"
            icon={<Clock size={20} />}
            iconBg="var(--color-info-light)"
            iconColor="var(--color-info)"
          />
        </div>
      )}

      {/* Charts Grid */}
      {mounted && data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {/* Team Hours Bar Chart */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart3 size={18} className="text-primary" /> Team Hours (This Week)
            </h2>
            <div style={{ width: "100%", height: 260 }}>
              {teamTable.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No team activity recorded.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamTable} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.375rem",
                      }}
                    />
                    <Bar dataKey="weeklyHours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Weekly Hours" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Attendance Distribution Pie Chart */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PieIcon size={18} className="text-success" /> Attendance Status (Today)
            </h2>
            <div style={{ width: "100%", height: 260, display: "flex", alignItems: "center" }}>
              {teamTable.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", color: "var(--text-secondary)" }}>
                  No attendance records today.
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, height: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                        >
                          {attendanceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: "140px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {attendanceDistribution.map((item, index) => (
                      <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "3px",
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Task Status Area Chart */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} className="text-warning" /> Task Status Trend (7 Days)
            </h2>
            <div style={{ width: "100%", height: 260 }}>
              {dailyTrend.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                  No daily trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
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
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="done" stroke="var(--color-success)" fillOpacity={1} fill="url(#colorDone)" name="Done" />
                    <Area type="monotone" dataKey="inProgress" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorInProgress)" name="In Progress" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Table */}
      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Team Overview (Last 7 Days)
        </h2>
        {teamTable.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
            No team members assigned or no activity logged.
          </div>
        ) : (
          <Table>
            <thead>
              <Tr>
                <Th>Employee</Th>
                <Th>Attendance Today</Th>
                <Th>Weekly Hours</Th>
                <Th>Weekly Attendance %</Th>
                <Th>Blocked Tasks</Th>
              </Tr>
            </thead>
            <tbody>
              {teamTable.map((member) => (
                <Tr key={member.id}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Avatar name={member.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{member.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{member.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {member.presentToday ? (
                      <Badge variant="success">Present</Badge>
                    ) : (
                      <Badge variant="neutral">Absent</Badge>
                    )}
                  </Td>
                  <Td>
                    <span style={{ fontWeight: 500 }}>{member.weeklyHours} hrs</span>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 500, minWidth: "35px" }}>{member.attendancePercent}%</span>
                      <div style={{ width: "80px", height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${member.attendancePercent}%`,
                            height: "100%",
                            background: member.attendancePercent >= 75 ? "var(--color-success)" : member.attendancePercent >= 50 ? "var(--color-warning)" : "var(--color-danger)",
                          }}
                        />
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {member.blockedTasks > 0 ? (
                      <span style={{ color: "var(--color-danger)", fontWeight: 600 }}>
                        {member.blockedTasks} blocked
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>0</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Users, CheckCircle, Clock, AlertCircle, ShieldAlert } from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  weeklyHours: number;
  attendancePercent: number;
  blockedTasks: number;
  presentToday: boolean;
}

interface TeamData {
  cards: {
    teamSize: number;
    presentToday: number;
    pendingApprovals: number;
    blockedTasks: number;
    underLoggers: number;
  };
  teamTable: TeamMember[];
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  async function fetchTeamData() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/manager");
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access Denied: Only Managers can view this page");
        throw new Error("Failed to load team data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
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

  if (error) {
    return (
      <>
        <Header title="My Team" subtitle="Manage and monitor your direct reports" />
        <div className="page-content" style={{ display: "flex", justifyContent: "center", padding: "4rem 2rem" }}>
          <div style={{ textAlign: "center", maxWidth: "24rem" }}>
            <ShieldAlert size={48} color="var(--color-danger)" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>Access Restricted</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  const cards = data?.cards;
  const members = data?.teamTable || [];

  return (
    <>
      <Header title="My Team" subtitle="Team directory, presence, and performance statistics" />
      
      <div className="page-content">
        {cards && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <StatCard
              label="Active Roster"
              value={`${cards.teamSize} employees`}
              sub="Total assigned team members"
              icon={<Users size={20} />}
            />
            <StatCard
              label="Presence Today"
              value={`${cards.presentToday} active`}
              sub="Checked-in office/WFH today"
              icon={<CheckCircle size={20} />}
              iconBg="var(--color-success-light)"
              iconColor="var(--color-success)"
            />
            <StatCard
              label="Hours logged (Avg)"
              value={members.length > 0 ? `${Math.round((members.reduce((s, m) => s + m.weeklyHours, 0) / members.length) * 10) / 10} hrs` : "0 hrs"}
              sub="Average hours logged per member"
              icon={<Clock size={20} />}
              iconBg="var(--color-primary-light)"
              iconColor="var(--color-primary)"
            />
            <StatCard
              label="Critical Impediments"
              value={`${cards.blockedTasks} blocked`}
              sub="Tasks currently in blocked state"
              icon={<AlertCircle size={20} />}
              iconBg="var(--color-danger-light)"
              iconColor="var(--color-danger)"
            />
          </div>
        )}

        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
            Team Roster & Activities
          </h2>
          
          {members.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No members found on your team roster.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Presence Status</th>
                    <th>Weekly Logged Hours</th>
                    <th>Attendance Rate (7d)</th>
                    <th>Pending Impediments</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600 }}>{member.name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{member.email}</td>
                      <td>
                        {member.presentToday ? (
                          <Badge variant="success">Online / Checked In</Badge>
                        ) : (
                          <Badge variant="neutral">Offline / Absent</Badge>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{member.weeklyHours} hrs</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 500 }}>{member.attendancePercent}%</span>
                          <div style={{ width: "80px", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${member.attendancePercent}%`,
                                height: "100%",
                                background: member.attendancePercent >= 75 ? "var(--color-success)" : member.attendancePercent >= 50 ? "var(--color-warning)" : "var(--color-danger)",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {member.blockedTasks > 0 ? (
                          <Badge variant="danger">{member.blockedTasks} Blocked</Badge>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge, AttendanceBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { Clock, Filter, RotateCcw, AlertTriangle } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hoursWorked: number | null;
  late: boolean;
  user: {
    name: string;
    email: string;
  };
}

export default function AttendancePage() {
  const { currentUser, refreshUser } = useUser();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [usersList, setUsersList] = useState<{ id: number; name: string }[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  
  // Pagination & Loading
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  
  // Action state
  const [checkinStatus, setCheckinStatus] = useState<"PRESENT" | "WFH">("PRESENT");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserAndData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchRecords();
    }
  }, [page]);

  async function fetchUserAndData() {
    setLoading(true);
    try {
      if (currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN") {
        const resUsers = await fetch("/api/users");
        if (resUsers.ok) {
          const dataUsers = await resUsers.json();
          setUsersList(dataUsers.users || []);
        }
      }
      
      // Fetch today's record and current records
      await fetchTodayStatus();
      await fetchRecords();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayStatus() {
    try {
      const res = await fetch("/api/attendance?pageSize=5");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: AttendanceRecord[] = data.items || [];
      
      let todayRec = null;
      const activeRecord = items.find((item) => !item.checkOut);
      if (activeRecord) {
        todayRec = activeRecord;
      } else if (items.length > 0) {
        const latest = items[0];
        if (latest.checkIn && new Date(latest.checkIn).toDateString() === new Date().toDateString()) {
          todayRec = latest;
        }
      }
      setTodayRecord(todayRec);
    } catch (err) {
      console.error("Failed to load today's attendance status", err);
    }
  }

  async function fetchRecords() {
    setLoading(true);
    try {
      let url = `/api/attendance?page=${page}&pageSize=15`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (userIdFilter) url += `&userId=${userIdFilter}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch attendance history");
      const json = await res.json();
      setRecords(json.items || []);
      setTotalPages(json.totalPages || 1);
      setTotalRecords(json.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      setTodayRecord(json.attendance);
      setPage(1);
      await fetchRecords();
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
      setTodayRecord(json.attendance);
      await fetchRecords();
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleFilterApply(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  }

  function handleReset() {
    setStartDate("");
    setEndDate("");
    setUserIdFilter("");
    setPage(1);
    setTimeout(() => fetchRecords(), 50);
  }

  if (loading && !currentUser) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const showFilters = currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN" || records.length > 0;

  return (
    <>
      <Header title="Attendance Desk" subtitle="Log daily hours and check entry logs" />
      
      <div className="page-content">
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {/* Quick Check-in/out action panel */}
          <Card>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={18} color="var(--color-primary)" />
              Daily Log
            </h3>
            
            {!todayRecord ? (
              <div>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  Record your attendance for today. Select your mode of work:
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
            ) : !todayRecord.checkOut ? (
              <div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>
                  Logged in today as: <Badge variant="success">{todayRecord.status}</Badge>
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  Check-in time: {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  {todayRecord.late && <span style={{ color: "var(--color-warning)", fontWeight: 600 }}> (Late entry)</span>}
                </p>
                <Button variant="danger" onClick={handleCheckout} loading={actionLoading} style={{ width: "100%" }}>
                  Check Out
                </Button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Logged Out</span>
                  <Badge variant="neutral">Done</Badge>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div>Check-in: {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</div>
                  <div>Check-out: {todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                    Total Hours Worked: {todayRecord.hoursWorked ?? 0} hrs
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Filters Form */}
          {showFilters && (
            <Card>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Filter size={18} color="var(--color-primary)" />
                Filter Logs
              </h3>
              <form onSubmit={handleFilterApply} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <Input
                    label="From"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <Input
                    label="To"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                
                {(currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN") && (
                  <Select
                    label="Filter by Employee"
                    options={[
                      { value: "", label: "All Employees" },
                      ...usersList.map((u) => ({ value: String(u.id), label: u.name })),
                    ]}
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                )}
                
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <Button type="submit" variant="primary" style={{ flex: 1 }}>
                    Apply Filters
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <RotateCcw size={14} />
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* History Table */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
            Attendance History ({totalRecords} total entries)
          </h2>
          {records.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No attendance logs found.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    {(currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN") && <th>Employee</th>}
                    <th>Mode</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours Worked</th>
                    <th>Late Entry</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 500 }}>
                        {new Date(rec.date).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      {(currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN") && (
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{rec.user.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{rec.user.email}</div>
                          </div>
                        </td>
                      )}
                      <td>
                        <AttendanceBadge status={rec.status} />
                      </td>
                      <td>
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td>
                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {rec.hoursWorked !== null ? `${rec.hoursWorked} hrs` : "—"}
                      </td>
                      <td>
                        {rec.late ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-warning)", fontWeight: 600, fontSize: "0.75rem" }}>
                            <AlertTriangle size={12} /> Late
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              pageSize={15}
              total={totalRecords}
            />
          </div>
        </div>
      </div>
    </>
  );
}

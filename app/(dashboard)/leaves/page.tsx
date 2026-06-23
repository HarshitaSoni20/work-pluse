"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge, LeaveStatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Calendar, Check, X, Plus, AlertCircle } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  leaveBalance: number;
}

interface LeaveRequest {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  userId: number;
  user: {
    name: string;
    email: string;
  };
}

function LeavesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { currentUser, refreshUser } = useUser();
  
  // Tab control: "my-leaves" or "approvals"
  const [activeTab, setActiveTab] = useState<"my-leaves" | "approvals">("my-leaves");
  
  // Lists
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveRequest[]>([]);
  
  // Pagination & Loading
  const [myPage, setMyPage] = useState(1);
  const [myTotalPages, setMyTotalPages] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<"CASUAL" | "SICK" | "EARNED">("CASUAL");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null); // tracks leaveId being approved/rejected

  useEffect(() => {
    if (currentUser) {
      fetchMeAndData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchMyLeaves();
  }, [myPage]);

  useEffect(() => {
    if (currentUser && (currentUser.role === "MANAGER" || currentUser.role === "ADMIN")) {
      fetchApprovals();
    }
  }, [appPage]);

  // Open apply leave modal via URL query param
  useEffect(() => {
    if (searchParams.get("apply") === "true") {
      router.replace("/leaves");
      openApplyModal();
    }
  }, [searchParams]);

  async function fetchMeAndData() {
    setLoading(true);
    try {
      // Fetch user's own leaves
      await fetchMyLeaves();

      // If manager or admin, fetch pending approvals
      if (currentUser.role === "MANAGER" || currentUser.role === "ADMIN") {
        await fetchApprovals();
        setActiveTab("approvals"); // Default to approvals for managers/admins
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyLeaves() {
    try {
      const res = await fetch(`/api/leaves?page=${myPage}&pageSize=10`);
      if (!res.ok) throw new Error("Failed to load your leave history");
      const json = await res.json();
      setMyLeaves(json.items || []);
      setMyTotalPages(json.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function fetchApprovals() {
    try {
      const res = await fetch(`/api/leaves?status=PENDING&page=${appPage}&pageSize=10`);
      if (!res.ok) throw new Error("Failed to load pending approvals");
      const json = await res.json();
      setPendingApprovals(json.items || []);
      setAppTotalPages(json.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Refresh user details (to update leave balance)
  async function refreshBalance() {
    await refreshUser();
  }

  function openApplyModal() {
    setFormType("CASUAL");
    setFormStart("");
    setFormEnd("");
    setFormReason("");
    setFormErrors({});
    setIsModalOpen(true);
  }

  function parseLocalDate(value: string): Date {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function validateForm() {
    const errs: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formStart) {
      errs.startDate = "Start date is required";
    } else {
      const start = parseLocalDate(formStart);
      if (start < today) {
        errs.startDate = "Start date cannot be in the past";
      }
    }

    if (!formEnd) {
      errs.endDate = "End date is required";
    } else if (formStart) {
      const start = parseLocalDate(formStart);
      const end = parseLocalDate(formEnd);
      if (start > end) {
        errs.endDate = "End date must be on or after start date";
      }
    }

    if (formReason.trim().length < 5) {
      errs.reason = "Reason must be at least 5 characters";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          startDate: formStart,
          endDate: formEnd,
          reason: formReason,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit request");

      setSuccessMsg("Leave request submitted successfully!");
      setIsModalOpen(false);
      setMyPage(1);
      fetchMyLeaves();
      refreshBalance();
    } catch (err: any) {
      setFormErrors({ form: err.message });
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleApprove(leaveId: number) {
    setActionLoading(leaveId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/leaves/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approval failed");
      
      setSuccessMsg("Leave request approved successfully!");
      fetchApprovals();
      fetchMyLeaves(); // In case admin approves their own
      refreshBalance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(leaveId: number) {
    if (!confirm("Are you sure you want to reject this leave request?")) return;
    setActionLoading(leaveId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/leaves/reject", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rejection failed");
      
      setSuccessMsg("Leave request rejected.");
      fetchApprovals();
      fetchMyLeaves();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading && !currentUser) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const isManagement = currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN";

  return (
    <>
      <Header title="Leave Planner" subtitle="Manage vacation balances and approve team leaves" />
      
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

        {successMsg && (
          <div
            style={{
              background: "var(--color-success-light)",
              border: "1px solid var(--color-success)",
              color: "var(--color-success)",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Top Balance / Action Desk */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {currentUser && (
            <StatCard
              label="Leave Balance"
              value={`${currentUser.leaveBalance ?? 0} days`}
              sub="Paid time off days remaining"
              icon={<Calendar size={20} />}
            />
          )}
          
          <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Request Leave
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Need time off? Submit a leave request for manager approval.
            </p>
            <Button variant="primary" onClick={openApplyModal}>
              <Plus size={16} /> Apply Time Off
            </Button>
          </Card>
        </div>

        {/* Tab Selection (For Managers and Admins) */}
        {isManagement && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem", gap: "1rem" }}>
            <button
              onClick={() => setActiveTab("approvals")}
              style={{
                background: "none",
                border: "none",
                padding: "0.75rem 0.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: activeTab === "approvals" ? "var(--color-primary)" : "var(--text-secondary)",
                borderBottom: activeTab === "approvals" ? "2px solid var(--color-primary)" : "none",
                cursor: "pointer",
              }}
            >
              Pending Approvals ({pendingApprovals.length})
            </button>
            <button
              onClick={() => setActiveTab("my-leaves")}
              style={{
                background: "none",
                border: "none",
                padding: "0.75rem 0.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: activeTab === "my-leaves" ? "var(--color-primary)" : "var(--text-secondary)",
                borderBottom: activeTab === "my-leaves" ? "2px solid var(--color-primary)" : "none",
                cursor: "pointer",
              }}
            >
              My Leave History
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === "approvals" && isManagement ? (
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
              Awaiting Approvals
            </h2>
            {pendingApprovals.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                No pending leave requests. Good job!
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates Requested</th>
                      <th>Total Days</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((req) => {
                      const days = Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <tr key={req.id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600 }}>{req.user.name}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{req.user.email}</div>
                            </div>
                          </td>
                          <td>
                            <Badge variant="info">{req.type}</Badge>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>
                              {new Date(req.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} – {new Date(req.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{days} day(s)</td>
                          <td>{req.reason}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem" }}>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleApprove(req.id)}
                                loading={actionLoading === req.id}
                              >
                                <Check size={14} /> Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleReject(req.id)}
                                loading={actionLoading === req.id}
                              >
                                <X size={14} /> Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
              <Pagination
                page={appPage}
                totalPages={appTotalPages}
                onPageChange={(p) => setAppPage(p)}
                pageSize={10}
              />
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
              Personal Leave Requests
            </h2>
            {myLeaves.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                You have not submitted any leave requests yet.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Applied On</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Total Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.map((req) => {
                      const days = Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <tr key={req.id}>
                          <td style={{ color: "var(--text-secondary)" }}>
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <Badge variant="neutral">{req.type}</Badge>
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            {new Date(req.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} – {new Date(req.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td style={{ fontWeight: 600 }}>{days} days</td>
                          <td>{req.reason}</td>
                          <td>
                            <LeaveStatusBadge status={req.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
              <Pagination
                page={myPage}
                totalPages={myTotalPages}
                onPageChange={(p) => setMyPage(p)}
                pageSize={10}
              />
            </div>
          </div>
        )}

        {/* Apply Leave Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Apply for Leave"
        >
          <form onSubmit={handleApplySubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {formErrors.form && (
              <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", background: "var(--color-danger-light)", padding: "0.5rem 0.75rem", borderRadius: "0.375rem" }}>
                {formErrors.form}
              </div>
            )}

            <Select
              label="Leave Type"
              options={[
                { value: "CASUAL", label: "Casual Leave" },
                { value: "SICK", label: "Sick Leave" },
                { value: "EARNED", label: "Earned Leave" },
              ]}
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Input
                label="Start Date"
                type="date"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                error={formErrors.startDate}
                required
              />
              
              <Input
                label="End Date"
                type="date"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                error={formErrors.endDate}
                required
              />
            </div>

            <Textarea
              label="Reason for Leave"
              placeholder="Provide context for approval"
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              error={formErrors.reason}
              required
            />
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitLoading}>
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

export default function LeavesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}><Spinner size="lg" /></div>}>
      <LeavesContent />
    </Suspense>
  );
}

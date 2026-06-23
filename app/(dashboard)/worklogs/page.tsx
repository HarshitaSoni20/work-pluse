"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge, WorklogStatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Plus, Search, Filter, RotateCcw, Edit2, Trash2 } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface WorklogRecord {
  id: number;
  title: string;
  description: string;
  project: string;
  hoursSpent: number;
  status: string;
  date: string;
  userId: number;
  user: {
    name: string;
    email: string;
  };
}

function WorklogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { currentUser } = useUser();
  const [logs, setLogs] = useState<WorklogRecord[]>([]);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination & Loading
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingLog, setEditingLog] = useState<WorklogRecord | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formHours, setFormHours] = useState<number>(8);
  const [formStatus, setFormStatus] = useState<"IN_PROGRESS" | "DONE" | "BLOCKED">("DONE");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchMeAndData();
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  // Handle opening create modal from query parameter
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      // Clear "?create=true" from URL so modal doesn't re-open unexpectedly on reload
      router.replace("/worklogs");
      openCreateModal();
    }
  }, [searchParams]);

  async function fetchMeAndData() {
    setLoading(true);
    try {
      await fetchLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    setLoading(true);
    try {
      let url = `/api/worklogs?page=${page}&pageSize=15`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (projectFilter) url += `&project=${encodeURIComponent(projectFilter)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch work logs");
      const json = await res.json();
      setLogs(json.items || []);
      setTotalPages(json.totalPages || 1);
      setTotalLogs(json.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterApply(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  }

  function handleReset() {
    setSearch("");
    setProjectFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setTimeout(() => fetchLogs(), 50);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingLog(null);
    setFormTitle("");
    setFormDescription("");
    setFormProject("");
    setFormHours(8);
    setFormStatus("DONE");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(log: WorklogRecord) {
    setModalMode("edit");
    setEditingLog(log);
    setFormTitle(log.title);
    setFormDescription(log.description);
    setFormProject(log.project);
    setFormHours(log.hoursSpent);
    setFormStatus(log.status as any);
    setFormDate(new Date(log.date).toISOString().split("T")[0]);
    setFormErrors({});
    setIsModalOpen(true);
  }

  function validateForm() {
    const errs: Record<string, string> = {};
    if (formTitle.trim().length < 2) errs.title = "Title must be at least 2 characters";
    if (formDescription.trim().length < 5) errs.description = "Description must be at least 5 characters";
    if (!formProject.trim()) errs.project = "Project is required";
    if (formHours <= 0 || formHours > 24) errs.hours = "Hours must be positive and less than 24";
    if (!formDate) errs.date = "Date is required";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitLoading(true);

    const payload = {
      title: formTitle,
      description: formDescription,
      project: formProject,
      hoursSpent: Number(formHours),
      status: formStatus,
      date: formDate,
    };

    try {
      let res;
      if (modalMode === "create") {
        res = await fetch("/api/worklogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/worklogs/${editingLog?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      
      setIsModalOpen(false);
      fetchLogs();
    } catch (err: any) {
      setFormErrors({ form: err.message });
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDelete(logId: number) {
    if (!confirm("Are you sure you want to delete this work log?")) return;
    try {
      const res = await fetch(`/api/worklogs/${logId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Delete failed");
      }
      fetchLogs();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading && !currentUser) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header title="Work Logs" subtitle="Track tasks, project allocations, and logged hours" />
      
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

        {/* Filters and Search */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Filter size={18} color="var(--color-primary)" />
                Filter Logs
              </h3>
              <Button variant="primary" size="sm" onClick={openCreateModal}>
                <Plus size={16} /> Log New Task
              </Button>
            </div>
            
            <form onSubmit={handleFilterApply} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", alignItems: "end" }}>
              <Input
                label="Search Keywords"
                placeholder="Title, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <Input
                label="Project"
                placeholder="e.g. WorkPulse"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <Select
                label="Status"
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "DONE", label: "Done" },
                  { value: "BLOCKED", label: "Blocked" },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <Input
                label="From Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <Input
                label="To Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>
                  Search
                </Button>
                <Button type="button" variant="secondary" onClick={handleReset}>
                  <RotateCcw size={16} />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Logs Table */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
            Work Records ({totalLogs} total records)
          </h2>
          {logs.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No work logs found matching filters.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    {(currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN") && <th>Employee</th>}
                    <th>Project</th>
                    <th>Task & Details</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                        {new Date(log.date).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      {(currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN") && (
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{log.user.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{log.user.email}</div>
                          </div>
                        </td>
                      )}
                      <td style={{ fontWeight: 500 }}>{log.project}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{log.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>{log.description}</div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.hoursSpent} hrs</td>
                      <td>
                        <WorklogStatusBadge status={log.status} />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {/* Employees can edit/delete their own. Admins can do anything. Managers can edit (if matching team). */}
                          {(currentUser?.role === "ADMIN" || currentUser?.id === log.userId) && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => openEditModal(log)}
                                style={{ padding: "0.375rem" }}
                                aria-label="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDelete(log.id)}
                                style={{ padding: "0.375rem", color: "var(--color-danger)" }}
                                aria-label="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
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
              total={totalLogs}
            />
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === "create" ? "Log Work Detail" : "Edit Work Log"}
        >
          <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {formErrors.form && (
              <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", background: "var(--color-danger-light)", padding: "0.5rem 0.75rem", borderRadius: "0.375rem" }}>
                {formErrors.form}
              </div>
            )}
            
            <Input
              label="Task / Title"
              placeholder="Brief summary of what you did"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              error={formErrors.title}
              required
            />
            
            <Textarea
              label="Details / Description"
              placeholder="What specifically did you achieve?"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              error={formErrors.description}
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Input
                label="Project Name"
                placeholder="e.g. WorkPulse"
                value={formProject}
                onChange={(e) => setFormProject(e.target.value)}
                error={formErrors.project}
                required
              />
              
              <Input
                label="Hours Logged"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={formHours}
                onChange={(e) => setFormHours(parseFloat(e.target.value) || 0)}
                error={formErrors.hours}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Select
                label="Task Status"
                options={[
                  { value: "DONE", label: "Completed" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "BLOCKED", label: "Blocked" },
                ]}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
              />
              
              <Input
                label="Date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                error={formErrors.date}
                required
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitLoading}>
                {modalMode === "create" ? "Save Log" : "Update Log"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

export default function WorklogsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}><Spinner size="lg" /></div>}>
      <WorklogsContent />
    </Suspense>
  );
}

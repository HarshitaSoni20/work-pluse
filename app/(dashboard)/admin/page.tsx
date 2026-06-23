"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { ShieldAlert, Plus, Edit2, Trash2, Shield, Users, AlertTriangle } from "lucide-react";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  teamId: number | null;
  leaveBalance: number;
  team: {
    name: string;
  } | null;
}

interface TeamRecord {
  id: number;
  name: string;
  managerId: number | null;
  manager: {
    id: number;
    name: string;
    email: string;
  } | null;
  _count: {
    members: number;
  } | null;
}

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab control: "users" or "teams"
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // User Modals State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormRole, setUserFormRole] = useState("EMPLOYEE");
  const [userFormTeam, setUserFormTeam] = useState("");
  const [userFormLeave, setUserFormLeave] = useState<number>(20);
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [userSubmitLoading, setUserSubmitLoading] = useState(false);

  // Delete User Dialog State
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  // Team Modals State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamModalMode, setTeamModalMode] = useState<"create" | "edit">("create");
  const [editingTeam, setEditingTeam] = useState<TeamRecord | null>(null);
  const [teamFormName, setTeamFormName] = useState("");
  const [teamFormManager, setTeamFormManager] = useState("");
  const [teamFormErrors, setTeamFormErrors] = useState<Record<string, string>>({});
  const [teamSubmitLoading, setTeamSubmitLoading] = useState(false);

  // Delete Team Dialog State
  const [isDeleteTeamOpen, setIsDeleteTeamOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<TeamRecord | null>(null);
  const [deleteTeamLoading, setDeleteTeamLoading] = useState(false);

  useEffect(() => {
    // Read tab query parameter on load
    const tab = searchParams.get("tab");
    if (tab === "teams") {
      setActiveTab("teams");
    } else {
      setActiveTab("users");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    setError(null);
    try {
      // Fetch users
      const resUsers = await fetch("/api/users");
      if (!resUsers.ok) {
        if (resUsers.status === 403) throw new Error("Access Denied: Only Admins can view this panel");
        throw new Error("Failed to load users");
      }
      const dataUsers = await resUsers.json();
      setUsers(dataUsers.users || []);

      // Fetch teams
      const resTeams = await fetch("/api/teams");
      if (resTeams.ok) {
        const dataTeams = await resTeams.json();
        setTeams(dataTeams.teams || []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab: "users" | "teams") {
    setActiveTab(tab);
    router.replace(`/admin?tab=${tab}`);
  }

  // --- USER HANDLERS ---

  function openCreateUserModal() {
    setUserModalMode("create");
    setEditingUser(null);
    setUserFormName("");
    setUserFormEmail("");
    setUserFormPassword("");
    setUserFormRole("EMPLOYEE");
    setUserFormTeam("");
    setUserFormLeave(20);
    setUserFormErrors({});
    setIsUserModalOpen(true);
  }

  function openEditUserModal(user: UserRecord) {
    setUserModalMode("edit");
    setEditingUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormPassword("");
    setUserFormRole(user.role);
    setUserFormTeam(user.teamId ? String(user.teamId) : "");
    setUserFormLeave(user.leaveBalance);
    setUserFormErrors({});
    setIsUserModalOpen(true);
  }

  function openDeleteUserDialog(user: UserRecord) {
    setDeletingUser(user);
    setIsDeleteUserOpen(true);
  }

  function validateUserForm() {
    const errs: Record<string, string> = {};
    if (!userFormName.trim()) errs.name = "Name is required";
    if (!userFormEmail.trim() || !userFormEmail.includes("@")) errs.email = "Valid email is required";
    
    if (userModalMode === "create" && (!userFormPassword || userFormPassword.length < 6)) {
      errs.password = "Password must be at least 6 characters";
    }
    
    if (userFormLeave < 0) errs.leave = "Leave balance cannot be negative";

    setUserFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateUserForm()) return;
    setUserSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);

    const teamVal = userFormTeam ? parseInt(userFormTeam) : null;

    try {
      let res;
      if (userModalMode === "create") {
        res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userFormName,
            email: userFormEmail,
            password: userFormPassword,
            role: userFormRole,
            teamId: teamVal,
            leaveBalance: userFormLeave,
          }),
        });
      } else {
        res = await fetch(`/api/users/${editingUser?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userFormName,
            role: userFormRole,
            teamId: teamVal,
            leaveBalance: userFormLeave,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save operation failed");

      setSuccessMsg(userModalMode === "create" ? "User created successfully!" : "User settings updated!");
      setIsUserModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      setUserFormErrors({ form: err.message });
    } finally {
      setUserSubmitLoading(false);
    }
  }

  async function handleDeleteUserConfirm() {
    if (!deletingUser) return;
    setDeleteUserLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete operation failed");

      setSuccessMsg(`User ${deletingUser.name} deleted successfully.`);
      setIsDeleteUserOpen(false);
      setDeletingUser(null);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setDeleteUserLoading(false);
    }
  }

  // --- TEAM HANDLERS ---

  function openCreateTeamModal() {
    setTeamModalMode("create");
    setEditingTeam(null);
    setTeamFormName("");
    setTeamFormManager("");
    setTeamFormErrors({});
    setIsTeamModalOpen(true);
  }

  function openEditTeamModal(team: TeamRecord) {
    setTeamModalMode("edit");
    setEditingTeam(team);
    setTeamFormName(team.name);
    setTeamFormManager(team.managerId ? String(team.managerId) : "");
    setTeamFormErrors({});
    setIsTeamModalOpen(true);
  }

  function openDeleteTeamDialog(team: TeamRecord) {
    setDeletingTeam(team);
    setIsDeleteTeamOpen(true);
  }

  function validateTeamForm() {
    const errs: Record<string, string> = {};
    if (!teamFormName.trim()) errs.name = "Team name is required";
    setTeamFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleTeamSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateTeamForm()) return;
    setTeamSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);

    const mgrVal = teamFormManager ? parseInt(teamFormManager) : null;

    try {
      let res;
      if (teamModalMode === "create") {
        res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: teamFormName,
            managerId: mgrVal,
          }),
        });
      } else {
        res = await fetch(`/api/teams/${editingTeam?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: teamFormName,
            managerId: mgrVal,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save operation failed");

      setSuccessMsg(teamModalMode === "create" ? "Team created successfully!" : "Team updated successfully!");
      setIsTeamModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      setTeamFormErrors({ form: err.message });
    } finally {
      setTeamSubmitLoading(false);
    }
  }

  async function handleDeleteTeamConfirm() {
    if (!deletingTeam) return;
    setDeleteTeamLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/teams/${deletingTeam.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete operation failed");

      setSuccessMsg(`Team ${deletingTeam.name} deleted successfully.`);
      setIsDeleteTeamOpen(false);
      setDeletingTeam(null);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to delete team.");
    } finally {
      setDeleteTeamLoading(false);
    }
  }

  if (loading && users.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <>
        <Header title="Admin Console" />
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

  const managerList = users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN");

  return (
    <>
      <Header title="Admin Console" subtitle="Organization directory, user rights, and team configuration" />
      
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

        {/* Tab Selection */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem", gap: "1.5rem" }}>
          <button
            onClick={() => handleTabChange("users")}
            style={{
              background: "none",
              border: "none",
              padding: "0.75rem 0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: activeTab === "users" ? "var(--color-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "users" ? "2px solid var(--color-primary)" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Shield size={16} /> User Accounts
          </button>
          <button
            onClick={() => handleTabChange("teams")}
            style={{
              background: "none",
              border: "none",
              padding: "0.75rem 0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: activeTab === "teams" ? "var(--color-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "teams" ? "2px solid var(--color-primary)" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Users size={16} /> Teams Directory
          </button>
        </div>

        {/* Tab content: USERS */}
        {activeTab === "users" ? (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Active Accounts
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Manage registered users and allocate leave balances.</p>
              </div>
              <Button variant="primary" size="sm" onClick={openCreateUserModal}>
                <Plus size={16} style={{ marginRight: "0.25rem" }} /> Add Account
              </Button>
            </div>
            
            <Table>
              <thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>System Role</Th>
                  <Th>Assigned Team</Th>
                  <Th>Leave Balance</Th>
                  <Th style={{ textAlign: "right" }}>Actions</Th>
                </Tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Avatar name={user.name} size="sm" />
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</span>
                      </div>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <RoleBadge role={user.role} />
                    </Td>
                    <Td>
                      {user.team ? (
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{user.team.name}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Not Assigned</span>
                      )}
                    </Td>
                    <Td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.leaveBalance ?? 0} days</Td>
                    <Td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditUserModal(user)}
                          style={{ padding: "0.375rem" }}
                          aria-label="Edit employee parameters"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteUserDialog(user)}
                          style={{ padding: "0.375rem", color: "var(--color-danger)" }}
                          aria-label="Delete employee account"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          /* Tab content: TEAMS */
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Organization Teams
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Manage department structure and assign team managers.</p>
              </div>
              <Button variant="primary" size="sm" onClick={openCreateTeamModal}>
                <Plus size={16} style={{ marginRight: "0.25rem" }} /> Create Team
              </Button>
            </div>
            
            <Table>
              <thead>
                <Tr>
                  <Th>Team Name</Th>
                  <Th>Assigned Manager</Th>
                  <Th>Total Members</Th>
                  <Th style={{ textAlign: "right" }}>Actions</Th>
                </Tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <Tr key={team.id}>
                    <Td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{team.name}</Td>
                    <Td>
                      {team.manager ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Avatar name={team.manager.name} size="sm" />
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{team.manager.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{team.manager.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No Manager Assigned</span>
                      )}
                    </Td>
                    <Td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{team._count?.members || 0} members</Td>
                    <Td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTeamModal(team)}
                          style={{ padding: "0.375rem" }}
                          aria-label="Edit team details"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteTeamDialog(team)}
                          style={{ padding: "0.375rem", color: "var(--color-danger)" }}
                          aria-label="Delete team"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Create/Edit User Modal */}
        <Modal
          open={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          title={userModalMode === "create" ? "Add User Account" : "Modify User Settings"}
        >
          <form onSubmit={handleUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {userFormErrors.form && (
              <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", background: "var(--color-danger-light)", padding: "0.5rem 0.75rem", borderRadius: "0.375rem" }}>
                {userFormErrors.form}
              </div>
            )}

            <Input
              label="Full Name"
              placeholder="e.g. Harshita Soni"
              value={userFormName}
              onChange={(e) => setUserFormName(e.target.value)}
              error={userFormErrors.name}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. harshita@workpulse.com"
              value={userFormEmail}
              onChange={(e) => setUserFormEmail(e.target.value)}
              error={userFormErrors.email}
              required
              disabled={userModalMode === "edit"}
            />

            {userModalMode === "create" && (
              <Input
                label="Initial Password"
                type="password"
                placeholder="Must be at least 6 characters"
                value={userFormPassword}
                onChange={(e) => setUserFormPassword(e.target.value)}
                error={userFormErrors.password}
                required
              />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Select
                label="System Role"
                options={[
                  { value: "EMPLOYEE", label: "Employee" },
                  { value: "MANAGER", label: "Manager" },
                  { value: "ADMIN", label: "HR / Administrator" },
                ]}
                value={userFormRole}
                onChange={(e) => setUserFormRole(e.target.value)}
              />

              <Input
                label="Paid Leave Balance"
                type="number"
                min="0"
                value={userFormLeave}
                onChange={(e) => setUserFormLeave(parseInt(e.target.value) || 0)}
                error={userFormErrors.leave}
                required
              />
            </div>

            <Select
              label="Assigned Team"
              options={[
                { value: "", label: "No Assigned Team" },
                ...teams.map((t) => ({ value: String(t.id), label: t.name })),
              ]}
              value={userFormTeam}
              onChange={(e) => setUserFormTeam(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button type="button" variant="secondary" onClick={() => setIsUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={userSubmitLoading}>
                {userModalMode === "create" ? "Create Account" : "Update Settings"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create/Edit Team Modal */}
        <Modal
          open={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          title={teamModalMode === "create" ? "Create New Team" : "Modify Team Details"}
        >
          <form onSubmit={handleTeamSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {teamFormErrors.form && (
              <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", background: "var(--color-danger-light)", padding: "0.5rem 0.75rem", borderRadius: "0.375rem" }}>
                {teamFormErrors.form}
              </div>
            )}

            <Input
              label="Team Name"
              placeholder="e.g. Engineering Team"
              value={teamFormName}
              onChange={(e) => setTeamFormName(e.target.value)}
              error={teamFormErrors.name}
              required
            />

            <Select
              label="Assigned Team Manager"
              options={[
                { value: "", label: "Assign Later / No Manager" },
                ...managerList.map((m) => ({ value: String(m.id), label: `${m.name} (${m.role})` })),
              ]}
              value={teamFormManager}
              onChange={(e) => setTeamFormManager(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button type="button" variant="secondary" onClick={() => setIsTeamModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={teamSubmitLoading}>
                {teamModalMode === "create" ? "Create Team" : "Update Team"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete User Confirm Dialog */}
        {deletingUser && (
          <ConfirmDialog
            open={isDeleteUserOpen}
            title="Delete User Account"
            description={`Are you absolutely sure you want to delete ${deletingUser.name}? This will permanently remove their account, check-in history, work logs, and leave requests. This action cannot be undone.`}
            confirmText="Delete Account"
            cancelText="Cancel"
            onConfirm={handleDeleteUserConfirm}
            onClose={() => setIsDeleteUserOpen(false)}
            variant="danger"
          />
        )}

        {deletingTeam && (
          <ConfirmDialog
            open={isDeleteTeamOpen}
            title="Delete Team"
            description={`Are you sure you want to delete the team "${deletingTeam.name}"? Members assigned to this team will remain registered but will be set to "Not Assigned" team status.`}
            confirmText="Delete Team"
            cancelText="Cancel"
            onConfirm={handleDeleteTeamConfirm}
            onClose={() => setIsDeleteTeamOpen(false)}
            variant="danger"
          />
        )}
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}><Spinner size="lg" /></div>}>
      <AdminContent />
    </Suspense>
  );
}


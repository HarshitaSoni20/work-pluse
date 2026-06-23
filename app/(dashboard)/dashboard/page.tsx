"use client";

import { useUser } from "@/components/providers/UserProvider";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) return null;

  if (currentUser.role === "ADMIN") {
    return <AdminDashboard />;
  } else if (currentUser.role === "MANAGER") {
    return <ManagerDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
}

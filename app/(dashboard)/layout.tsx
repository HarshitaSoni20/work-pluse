import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("workpulse_token")?.value;

  if (!token) redirect("/login");

  const user = verifyToken(token);
  if (!user) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
      />
      <div className="main-content">{children}</div>
    </div>
  );
}

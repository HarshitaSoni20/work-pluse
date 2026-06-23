import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { UserProvider } from "@/components/providers/UserProvider";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";

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
    <UserProvider>
      <ClientDashboardLayout>{children}</ClientDashboardLayout>
    </UserProvider>
  );
}

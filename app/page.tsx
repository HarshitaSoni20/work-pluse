import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("workpulse_token")?.value;

  if (token) {
    const user = verifyToken(token);
    if (user) redirect("/dashboard");
  }

  redirect("/login");
}

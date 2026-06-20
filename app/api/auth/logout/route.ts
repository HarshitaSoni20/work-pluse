import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = Response.json({ message: "Logged out successfully" });

  // Expire the cookie immediately
  response.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );

  return response;
}

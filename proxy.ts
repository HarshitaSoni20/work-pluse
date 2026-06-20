import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const COOKIE_NAME = "workpulse_token";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/_next",
  "/favicon.ico",
  "/public",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

// In Next.js 16, proxy defaults to the Node.js runtime,
// so we can use jsonwebtoken (via lib/jwt.ts) for full verification.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = verifyToken(token);

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Session expired, please log in again" },
        { status: 401 }
      );
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Inject verified user context into headers for downstream route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", String(user.id));
  requestHeaders.set("x-user-role", user.role);
  requestHeaders.set("x-user-teamid", user.teamId ? String(user.teamId) : "");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

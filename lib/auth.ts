import { Role } from "@prisma/client";
import { UserPayload } from "@/types";
import { verifyToken } from "@/lib/jwt";

import { cookies } from "next/headers";

const TOKEN_COOKIE = "workpulse_token";

/**
 * Retrieves the current authenticated user using async cookies() API.
 */
export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the JWT from the request cookie.
 * Returns the decoded user payload or null if missing/invalid.
 */
export function getUserFromRequest(request: Request): UserPayload | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[TOKEN_COOKIE];
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Like getUserFromRequest but throws a 401 Response if not authenticated.
 */
export function requireAuth(request: Request): UserPayload {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

/**
 * Requires a specific role. Throws 403 if the user lacks the role.
 */
export function requireRole(
  request: Request,
  ...roles: Role[]
): UserPayload {
  const user = requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new Response(
      JSON.stringify({ error: "Forbidden: insufficient permissions" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

/**
 * Minimal cookie parser — does not need the 'cookie' npm package.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (key) acc[key.trim()] = decodeURIComponent(rest.join("=").trim());
    return acc;
  }, {});
}

export const COOKIE_NAME = TOKEN_COOKIE;
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

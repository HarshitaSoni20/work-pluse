import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);

    if (user.role === "EMPLOYEE") {
      return Response.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    if (user.role === "MANAGER") {
      // Find team managed by this user
      const team = await prisma.team.findFirst({
        where: { managerId: user.id },
        select: { id: true },
      });
      if (!team) {
        return Response.json({ users: [] });
      }
      const users = await prisma.user.findMany({
        where: { teamId: team.id },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      });
      return Response.json({ users });
    }

    // Admin role
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        leaveBalance: true,
        team: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
    return Response.json({ users });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[users/GET]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.name || !body.email || !body.password) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Hash the password using bcryptjs
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role || "EMPLOYEE",
        teamId: body.teamId ? parseInt(body.teamId) : undefined,
        leaveBalance: body.leaveBalance !== undefined ? parseInt(body.leaveBalance) : 20,
      },
      select: { id: true, name: true, email: true, role: true, teamId: true },
    });

    return Response.json({ message: "User created successfully", user: newUser }, { status: 201 });
  } catch (err: any) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[users/POST]", err);
    if (err.code === "P2002") {
      return Response.json({ success: false, error: "Email already exists" }, { status: 409 });
    }
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

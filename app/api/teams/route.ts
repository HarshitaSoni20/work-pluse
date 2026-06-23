import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    
    // We allow managers/admins to fetch teams
    if (user.role === "EMPLOYEE") {
      return Response.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const teams = await prisma.team.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });

    return Response.json({ teams });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[teams/GET]", err);
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
    if (!body.name) {
      return Response.json({ success: false, error: "Team name is required" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name: body.name,
        managerId: body.managerId ? parseInt(body.managerId) : undefined,
      },
    });

    return Response.json({ message: "Team created successfully", team }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[teams/POST]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

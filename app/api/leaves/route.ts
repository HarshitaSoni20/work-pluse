import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = request.nextUrl;

    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (user.role === "EMPLOYEE") {
      where.userId = user.id;
    } else if (user.role === "MANAGER") {
      const team = await prisma.team.findFirst({
        where: { managerId: user.id },
        include: { members: { select: { id: true } } },
      });
      const memberIds = team ? team.members.map((m) => m.id) : [];
      where.userId = { in: memberIds };
    }
    // ADMIN: no filter

    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return Response.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    if (err instanceof Response) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[leaves/GET]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

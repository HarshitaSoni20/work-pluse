import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = request.nextUrl;

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userIdParam = searchParams.get("userId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));

    // Build the where clause based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (user.role === "EMPLOYEE") {
      // Employees see only their own attendance
      where.userId = user.id;
    } else if (user.role === "MANAGER") {
      // Managers see their team's attendance
      const team = await prisma.team.findFirst({
        where: { managerId: user.id },
        select: { id: true },
      });
      if (!team) {
        return Response.json({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      const teamMembers = await prisma.user.findMany({
        where: { teamId: team.id },
        select: { id: true },
      });
      const memberIds = teamMembers.map((m) => m.id);
      where.userId = { in: memberIds };

      // Allow filtering to specific member
      if (userIdParam) {
        const uid = parseInt(userIdParam);
        if (!memberIds.includes(uid)) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        where.userId = uid;
      }
    } else {
      // Admin sees everything, can filter by userId
      if (userIdParam) {
        where.userId = parseInt(userIdParam);
      }
    }

    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate + "T23:59:59") };

    const [items, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.attendance.count({ where }),
    ]);

    return Response.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[attendance/GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("Current user:", user);
    console.log("Role:", user.role);
    console.log("Attendance query executing");

    const { searchParams } = request.nextUrl;

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userIdParam = searchParams.get("userId");
    
    // Validate page/pageSize and prevent NaN values from reaching Prisma
    const rawPage = parseInt(searchParams.get("page") ?? "1");
    const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    
    const rawPageSize = parseInt(searchParams.get("pageSize") ?? "20");
    const pageSize = isNaN(rawPageSize) ? 20 : Math.min(100, Math.max(1, rawPageSize));

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
      
      // Managers can also see their own attendance
      if (!memberIds.includes(user.id)) {
        memberIds.push(user.id);
      }
      
      where.userId = { in: memberIds };

      // Allow filtering to specific member if valid and authorized
      if (userIdParam && userIdParam !== "all" && userIdParam !== "undefined" && userIdParam !== "") {
        const uid = parseInt(userIdParam);
        if (!isNaN(uid)) {
          if (!memberIds.includes(uid)) {
            return Response.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
          }
          where.userId = uid;
        }
      }
    } else {
      // Admin sees everything, can filter by userId if valid
      if (userIdParam && userIdParam !== "all" && userIdParam !== "undefined" && userIdParam !== "") {
        const uid = parseInt(userIdParam);
        if (!isNaN(uid)) {
          where.userId = uid;
        }
      }
    }

    // Safely parse and set date filters
    if (startDate && startDate !== "undefined" && startDate !== "null" && startDate !== "") {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) {
        where.date = { ...where.date, gte: parsedStart };
      }
    }
    if (endDate && endDate !== "undefined" && endDate !== "null" && endDate !== "") {
      const parsedEnd = new Date(endDate + "T23:59:59");
      if (!isNaN(parsedEnd.getTime())) {
        where.date = { ...where.date, lte: parsedEnd };
      }
    }

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
  } catch (error) {
    console.error("[attendance/GET] Error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}

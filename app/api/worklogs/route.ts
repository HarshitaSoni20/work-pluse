import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { worklogSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = request.nextUrl;

    const search = searchParams.get("search") ?? "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const project = searchParams.get("project");
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
      const memberIds = team ? team.members.map((m) => m.id) : [user.id];
      where.userId = { in: memberIds };
    }
    // ADMIN: no userId filter → all records

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { project: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate + "T23:59:59") };
    if (project) where.project = { contains: project, mode: "insensitive" };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.workLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.workLog.count({ where }),
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
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[worklogs/GET]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    const body = await request.json();

    const parsed = worklogSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, project, hoursSpent, status, date } = parsed.data;

    const [y, m, d] = date.split("-").map(Number);
    const localDate = new Date(y, m-1, d);

    const worklog = await prisma.workLog.create({
      data: {
        userId: user.id,
        title,
        description,
        project,
        hoursSpent,
        status,
        date: localDate,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return Response.json({ message: "Work log created", worklog }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[worklogs/POST]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

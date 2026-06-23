import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const user = requireRole(request, "EMPLOYEE", "MANAGER", "ADMIN");

    const now = new Date();
    const weekStart = startOfDay(subDays(now, 6)); // Last 7 days
    const weekEnd = endOfDay(now);

    // Weekly hours and daily trend
    const weeklyLogs = await prisma.workLog.findMany({
      where: {
        userId: user.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      select: { date: true, hoursSpent: true },
    });

    // Build daily buckets Mon-Sun
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      dailyMap[format(d, "EEE")] = 0;
    }
    for (const log of weeklyLogs) {
      const key = format(new Date(log.date), "EEE");
      if (key in dailyMap) dailyMap[key] += log.hoursSpent;
    }
    const weeklyHoursTrend = Object.entries(dailyMap).map(([date, hours]) => ({
      date,
      hours: Math.round(hours * 100) / 100,
    }));

    const weeklyHoursTotal = weeklyLogs.reduce((s, l) => s + l.hoursSpent, 0);

    // Present days this week
    const weeklyAttendance = await prisma.attendance.count({
      where: {
        userId: user.id,
        date: { gte: weekStart, lte: weekEnd },
        status: { in: ["PRESENT", "WFH"] },
      },
    });

    // Pending leave requests
    const pendingLeaves = await prisma.leaveRequest.count({
      where: { userId: user.id, status: "PENDING" },
    });

    // Blocked tasks
    const blockedTasks = await prisma.workLog.count({
      where: { userId: user.id, status: "BLOCKED" },
    });

    // Task status distribution
    const taskStats = await prisma.workLog.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { status: true },
    });

    const taskDistribution = taskStats.map((t) => ({
      status: t.status,
      count: t._count.status,
    }));

    // Leave balance from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { leaveBalance: true },
    });

    return Response.json({
      cards: {
        weeklyHours: Math.round(weeklyHoursTotal * 100) / 100,
        presentDays: weeklyAttendance,
        leaveBalance: dbUser?.leaveBalance ?? 0,
        pendingRequests: pendingLeaves,
        blockedTasks,
      },
      weeklyHoursTrend,
      taskDistribution,
    });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[dashboard/employee]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

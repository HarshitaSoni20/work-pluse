import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    const user = requireRole(request, "MANAGER", "ADMIN");

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfDay(subDays(now, 6));
    const weekEnd = endOfDay(now);

    // Get manager's team
    const team = await prisma.team.findFirst({
      where: { managerId: user.id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            attendance: {
              where: { date: { gte: weekStart, lte: weekEnd } },
              select: { status: true, date: true },
            },
            workLogs: {
              where: { date: { gte: weekStart, lte: weekEnd } },
              select: { hoursSpent: true, status: true },
            },
            leaveRequests: {
              where: { status: "PENDING" },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!team) {
      return Response.json({
        cards: { teamSize: 0, presentToday: 0, pendingApprovals: 0, blockedTasks: 0, underLoggers: 0 },
        teamTable: [],
      });
    }

    const members = team.members;
    const teamSize = members.length;

    // Present today
    const todayAttendance = await prisma.attendance.count({
      where: {
        userId: { in: members.map((m) => m.id) },
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ["PRESENT", "WFH"] },
      },
    });

    // Pending approvals (team-wide)
    const pendingApprovals = await prisma.leaveRequest.count({
      where: {
        userId: { in: members.map((m) => m.id) },
        status: "PENDING",
      },
    });

    // Build team table row per member
    const totalWorkDays = 7;
    const teamTable = members.map((m) => {
      const weeklyHours = m.workLogs.reduce((s, l) => s + l.hoursSpent, 0);
      const presentDays = m.attendance.filter(
        (a) => a.status === "PRESENT" || a.status === "WFH"
      ).length;
      const attendancePercent = Math.round((presentDays / totalWorkDays) * 100);
      const blockedTasks = m.workLogs.filter((l) => l.status === "BLOCKED").length;
      const presentToday = m.attendance.some(
        (a) =>
          new Date(a.date) >= todayStart &&
          new Date(a.date) <= todayEnd &&
          (a.status === "PRESENT" || a.status === "WFH")
      );

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        weeklyHours: Math.round(weeklyHours * 100) / 100,
        attendancePercent,
        blockedTasks,
        presentToday,
      };
    });

    const blockedTasksTotal = teamTable.reduce((s, m) => s + m.blockedTasks, 0);
    const underLoggers = teamTable.filter((m) => m.weeklyHours < 30).length;

    return Response.json({
      cards: {
        teamSize,
        presentToday: todayAttendance,
        pendingApprovals,
        blockedTasks: blockedTasksTotal,
        underLoggers,
      },
      teamTable,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[dashboard/manager]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

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
              select: { hoursSpent: true, status: true, date: true },
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
        dailyTrend: [],
        taskDistribution: [],
        attendanceDistribution: [],
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

    // Aggregate Task Status Distribution
    const taskCountMap: Record<string, number> = {
      IN_PROGRESS: 0,
      DONE: 0,
      BLOCKED: 0,
    };
    members.forEach((m) => {
      m.workLogs.forEach((wl) => {
        if (taskCountMap[wl.status] !== undefined) {
          taskCountMap[wl.status]++;
        }
      });
    });
    const taskDistribution = Object.entries(taskCountMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Aggregate Attendance Status Distribution for today
    let presentTodayCount = 0;
    let wfhTodayCount = 0;
    let absentTodayCount = 0;

    members.forEach((m) => {
      const todayRecord = m.attendance.find(
        (a) => new Date(a.date) >= todayStart && new Date(a.date) <= todayEnd
      );
      if (todayRecord) {
        if (todayRecord.status === "PRESENT") presentTodayCount++;
        else if (todayRecord.status === "WFH") wfhTodayCount++;
        else absentTodayCount++;
      } else {
        absentTodayCount++;
      }
    });

    const attendanceDistribution = [
      { name: "In Office", value: presentTodayCount },
      { name: "Remote (WFH)", value: wfhTodayCount },
      { name: "Absent", value: absentTodayCount },
    ];

    // Generate last 7 days daily trend data
    const dailyTrendMap = new Map<string, { date: string; hours: number; inProgress: number; done: number; blocked: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, "MMM dd");
      dailyTrendMap.set(dateStr, {
        date: dateStr,
        hours: 0,
        inProgress: 0,
        done: 0,
        blocked: 0,
      });
    }

    members.forEach((m) => {
      m.workLogs.forEach((wl) => {
        const dateStr = format(new Date(wl.date), "MMM dd");
        const entry = dailyTrendMap.get(dateStr);
        if (entry) {
          entry.hours += wl.hoursSpent;
          if (wl.status === "IN_PROGRESS") entry.inProgress++;
          else if (wl.status === "DONE") entry.done++;
          else if (wl.status === "BLOCKED") entry.blocked++;
        }
      });
    });

    const dailyTrend = Array.from(dailyTrendMap.values());

    return Response.json({
      cards: {
        teamSize,
        presentToday: todayAttendance,
        pendingApprovals,
        blockedTasks: blockedTasksTotal,
        underLoggers,
      },
      teamTable,
      dailyTrend,
      taskDistribution,
      attendanceDistribution,
    });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[dashboard/manager]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

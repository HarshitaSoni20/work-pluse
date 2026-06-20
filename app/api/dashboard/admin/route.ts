import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    requireRole(request, "ADMIN");

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfDay(subDays(now, 6));
    const weekEnd = endOfDay(now);

    // Company-wide stats
    const [totalEmployees, totalTeams, pendingLeaves] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.team.count(),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    ]);

    // Attendance % today
    const presentToday = await prisma.attendance.count({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ["PRESENT", "WFH"] },
      },
    });
    const attendancePercent =
      totalEmployees > 0
        ? Math.round((presentToday / totalEmployees) * 100)
        : 0;

    // Team-wise attendance (this week)
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            attendance: {
              where: { date: { gte: weekStart, lte: weekEnd } },
              select: { status: true },
            },
          },
        },
      },
    });

    const teamAttendanceChart = teams.map((team) => {
      let present = 0,
        wfh = 0,
        absent = 0;
      for (const member of team.members) {
        for (const att of member.attendance) {
          if (att.status === "PRESENT") present++;
          else if (att.status === "WFH") wfh++;
          else absent++;
        }
      }
      return { team: team.name, present, wfh, absent };
    });

    // Team-wise hours (this week)
    const teamHoursChart = await Promise.all(
      teams.map(async (team) => {
        const memberIds = team.members.map((m) => m.id);
        const agg = await prisma.workLog.aggregate({
          where: {
            userId: { in: memberIds },
            date: { gte: weekStart, lte: weekEnd },
          },
          _sum: { hoursSpent: true },
        });
        return {
          team: team.name,
          hours: Math.round((agg._sum.hoursSpent ?? 0) * 100) / 100,
        };
      })
    );

    return Response.json({
      cards: {
        totalEmployees,
        totalTeams,
        attendancePercent,
        pendingLeaves,
      },
      teamAttendanceChart,
      teamHoursChart,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[dashboard/admin]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

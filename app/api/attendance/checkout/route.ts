import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (!attendance) {
      return Response.json(
        { error: "No check-in found for today. Please check in first." },
        { status: 404 }
      );
    }

    if (attendance.checkOut) {
      return Response.json(
        { error: "Already checked out for today" },
        { status: 409 }
      );
    }

    // Calculate hours worked
    let hoursWorked: number | null = null;
    if (attendance.checkIn) {
      const diffMs = now.getTime() - attendance.checkIn.getTime();
      hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // 2 decimal places
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        hoursWorked,
      },
    });

    return Response.json({
      message: "Check-out recorded",
      attendance: updated,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[attendance/checkout]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

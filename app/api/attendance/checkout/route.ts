import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);

    const now = new Date();

    const attendance = await prisma.attendance.findFirst({
      where: { userId: user.id },
      orderBy: { checkIn: "desc" },
    });

    if (!attendance) {
      return Response.json(
        { success: false, error: "No check-in found. Please check in first." },
        { status: 404 }
      );
    }

    if (attendance.checkOut !== null) {
      return Response.json(
        { success: false, error: "Already checked out" },
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
    if (err instanceof Response) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("[attendance/checkout]", err);
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

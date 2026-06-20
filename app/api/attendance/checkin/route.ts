import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { checkinSchema } from "@/lib/validations";

// Cut-off time for "late" = 09:30 local (we use UTC+5:30 = IST for India)
// The flag is computed against wallclock hour/minute of checkIn timestamp.
const LATE_HOUR = 9;
const LATE_MINUTE = 30;

function isLate(checkIn: Date): boolean {
  // Use local system time for comparison
  const h = checkIn.getHours();
  const m = checkIn.getMinutes();
  return h > LATE_HOUR || (h === LATE_HOUR && m > LATE_MINUTE);
}

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

    const body = await request.json().catch(() => ({}));
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Enforce one check-in per day
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (existing) {
      return Response.json(
        { error: "Already checked in today" },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: todayStart,
        checkIn: now,
        late: isLate(now),
        status: parsed.data.status,
      },
    });

    return Response.json(
      {
        message: "Check-in recorded",
        attendance: {
          ...attendance,
          late: attendance.late,
          checkIn: attendance.checkIn,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[attendance/checkin]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

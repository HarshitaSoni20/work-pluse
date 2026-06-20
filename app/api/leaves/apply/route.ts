import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { leaveApplySchema } from "@/lib/validations";

function daysBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // inclusive
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    const body = await request.json();

    const parsed = leaveApplySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, startDate, endDate, reason } = parsed.data;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // No past dates
    if (start < today) {
      return Response.json(
        { error: "Leave start date cannot be in the past" },
        { status: 400 }
      );
    }

    // Start must be ≤ end
    if (start > end) {
      return Response.json(
        { error: "Start date must be before or equal to end date" },
        { status: 400 }
      );
    }

    const leaveDays = daysBetween(start, end);

    // Check leave balance
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { leaveBalance: true },
    });

    if (!dbUser || dbUser.leaveBalance < leaveDays) {
      return Response.json(
        {
          error: `Insufficient leave balance. You have ${dbUser?.leaveBalance ?? 0} day(s) remaining but requested ${leaveDays} day(s).`,
        },
        { status: 400 }
      );
    }

    // Check for overlapping approved leaves
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        userId: user.id,
        status: "APPROVED",
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (overlap) {
      return Response.json(
        { error: "You have an overlapping approved leave for the selected dates" },
        { status: 409 }
      );
    }

    // Check for overlapping pending leaves
    const pendingOverlap = await prisma.leaveRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (pendingOverlap) {
      return Response.json(
        { error: "You already have a pending leave request for the selected dates" },
        { status: 409 }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        type,
        startDate: start,
        endDate: end,
        reason,
        status: "PENDING",
      },
    });

    return Response.json(
      { message: "Leave application submitted", leave },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[leaves/apply]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

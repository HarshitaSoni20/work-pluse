import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { leaveActionSchema } from "@/lib/validations";

function daysBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export async function PATCH(request: Request) {
  try {
    const approver = requireRole(request, "MANAGER", "ADMIN");
    const body = await request.json();

    const parsed = leaveActionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { leaveId } = parsed.data;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { user: { select: { id: true, leaveBalance: true, teamId: true } } },
    });

    if (!leave) {
      return Response.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (leave.status !== "PENDING") {
      return Response.json(
        { error: `Cannot approve a leave that is already ${leave.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // Managers can only approve for their own team
    if (approver.role === "MANAGER") {
      const team = await prisma.team.findFirst({
        where: { managerId: approver.id },
        select: { id: true },
      });
      if (!team || leave.user.teamId !== team.id) {
        return Response.json(
          { error: "You can only approve leave for employees in your team" },
          { status: 403 }
        );
      }
    }

    const leaveDays = daysBetween(leave.startDate, leave.endDate);

    // Check balance again at approval time (might have changed)
    if (leave.user.leaveBalance < leaveDays) {
      return Response.json(
        { error: "Employee has insufficient leave balance" },
        { status: 400 }
      );
    }

    // Atomically approve and deduct balance
    const [updatedLeave] = await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { status: "APPROVED", approverId: approver.id },
      }),
      prisma.user.update({
        where: { id: leave.user.id },
        data: { leaveBalance: { decrement: leaveDays } },
      }),
    ]);

    return Response.json({ message: "Leave approved", leave: updatedLeave });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[leaves/approve]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

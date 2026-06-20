import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { leaveActionSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const rejector = requireRole(request, "MANAGER", "ADMIN");
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
      include: { user: { select: { teamId: true } } },
    });

    if (!leave) {
      return Response.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (leave.status !== "PENDING") {
      return Response.json(
        { error: `Cannot reject a leave that is already ${leave.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // Managers can only reject for their own team
    if (rejector.role === "MANAGER") {
      const team = await prisma.team.findFirst({
        where: { managerId: rejector.id },
        select: { id: true },
      });
      if (!team || leave.user.teamId !== team.id) {
        return Response.json(
          { error: "You can only reject leave for employees in your team" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: "REJECTED", approverId: rejector.id },
    });

    return Response.json({ message: "Leave rejected", leave: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[leaves/reject]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

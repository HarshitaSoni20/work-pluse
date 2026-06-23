import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    const body = await request.json().catch(() => ({}));
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        role: parsed.data.role,
        teamId: parsed.data.teamId,
        leaveBalance: parsed.data.leaveBalance,
      },
      select: { id: true, name: true, email: true, role: true, teamId: true, leaveBalance: true },
    });

    return Response.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[users/id/PATCH]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Safeguard to prevent deleting oneself
    if (user.id === userId) {
      return Response.json({ success: false, error: "Cannot delete your own admin account" }, { status: 400 });
    }

    // Clean up related records in a transaction to avoid foreign key violations
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { userId } }),
      prisma.workLog.deleteMany({ where: { userId } }),
      prisma.leaveRequest.deleteMany({ where: { userId } }),
      prisma.team.updateMany({ where: { managerId: userId }, data: { managerId: null } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return Response.json({ message: "User deleted successfully" });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[users/id/DELETE]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

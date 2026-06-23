import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
    const teamId = parseInt(id);

    const body = await request.json().catch(() => ({}));
    if (!body.name) {
      return Response.json({ success: false, error: "Team name is required" }, { status: 400 });
    }

    const managerId = body.managerId ? parseInt(body.managerId) : null;

    // Ensure manager uniqueness
    if (managerId) {
      await prisma.team.updateMany({
        where: { managerId, id: { not: teamId } },
        data: { managerId: null },
      });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: body.name,
        managerId,
      },
    });

    return Response.json({ message: "Team updated successfully", team: updatedTeam });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[teams/id/PATCH]", err);
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
    const teamId = parseInt(id);

    await prisma.$transaction([
      prisma.user.updateMany({
        where: { teamId },
        data: { teamId: null },
      }),
      prisma.team.delete({
        where: { id: teamId },
      }),
    ]);

    return Response.json({ message: "Team deleted successfully" });
  } catch (err) {
    if (err instanceof Response) {
      const status = err.status;
      return Response.json({ success: false, error: status === 403 ? "Forbidden: insufficient permissions" : "Unauthorized" }, { status });
    }
    console.error("[teams/id/DELETE]", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

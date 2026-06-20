import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { worklogUpdateSchema } from "@/lib/validations";

async function getWorklogOrFail(id: number, userId: number, role: string) {
  const worklog = await prisma.workLog.findUnique({ where: { id } });
  if (!worklog) return null;

  if (role === "EMPLOYEE" && worklog.userId !== userId) return null;
  if (role === "MANAGER") {
    // Manager can only access own team members' logs
    const team = await prisma.team.findFirst({
      where: { managerId: userId },
      include: { members: { select: { id: true } } },
    });
    const memberIds = team ? team.members.map((m) => m.id) : [];
    if (!memberIds.includes(worklog.userId) && worklog.userId !== userId) return null;
  }
  // ADMIN: can access all

  return worklog;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const logId = parseInt(id);

    if (isNaN(logId)) {
      return Response.json({ error: "Invalid work log ID" }, { status: 400 });
    }

    const worklog = await getWorklogOrFail(logId, user.id, user.role);
    if (!worklog) {
      return Response.json({ error: "Work log not found or access denied" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = worklogUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updated = await prisma.workLog.update({
      where: { id: logId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.project !== undefined && { project: data.project }),
        ...(data.hoursSpent !== undefined && { hoursSpent: data.hoursSpent }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return Response.json({ message: "Work log updated", worklog: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[worklogs/PUT]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const logId = parseInt(id);

    if (isNaN(logId)) {
      return Response.json({ error: "Invalid work log ID" }, { status: 400 });
    }

    // Employees can only delete their own; managers/admins follow getWorklogOrFail
    const worklog = await getWorklogOrFail(logId, user.id, user.role);
    if (!worklog) {
      return Response.json({ error: "Work log not found or access denied" }, { status: 404 });
    }

    await prisma.workLog.delete({ where: { id: logId } });

    return Response.json({ message: "Work log deleted" });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[worklogs/DELETE]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

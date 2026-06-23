import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const payload = requireAuth(request);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        leaveBalance: true,
      },
    });

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  } catch (err) {
    if (err instanceof Response) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

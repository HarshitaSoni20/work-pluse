import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { registerSchema } from "@/lib/validations";
import { COOKIE_MAX_AGE, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role, teamId } = parsed.data;

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        teamId: teamId ?? null,
      },
      select: { id: true, name: true, email: true, role: true, teamId: true },
    });

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    });

    const response = Response.json(
      { message: "Registration successful", user },
      { status: 201 }
    );

    // Set httpOnly cookie
    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
    );

    return response;
  } catch (error) {
    console.error("[register]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

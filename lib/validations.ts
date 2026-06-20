import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
  teamId: z.number().int().positive().optional(),
});

// ─── Work Logs ────────────────────────────────────────────────────────────────

export const worklogSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  project: z.string().min(1, "Project is required"),
  hoursSpent: z
    .number()
    .positive("Hours must be positive")
    .max(24, "Cannot exceed 24 hours"),
  status: z.enum(["IN_PROGRESS", "DONE", "BLOCKED"]),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
});

export const worklogUpdateSchema = worklogSchema.partial();

// ─── Attendance ───────────────────────────────────────────────────────────────

export const checkinSchema = z.object({
  status: z.enum(["PRESENT", "WFH"]).default("PRESENT"),
});

// ─── Leaves ───────────────────────────────────────────────────────────────────

export const leaveApplySchema = z.object({
  type: z.enum(["CASUAL", "SICK", "EARNED"]),
  startDate: z.string().date("Invalid start date (YYYY-MM-DD)"),
  endDate: z.string().date("Invalid end date (YYYY-MM-DD)"),
  reason: z.string().min(5, "Please provide a reason of at least 5 characters"),
});

export const leaveActionSchema = z.object({
  leaveId: z.number().int().positive(),
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  managerId: z.number().int().positive().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  teamId: z.number().int().positive().nullable().optional(),
  leaveBalance: z.number().int().min(0).optional(),
});

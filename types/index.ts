import { Role } from "@prisma/client";

// ─── Auth / JWT ───────────────────────────────────────────────────────────────

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: Role;
  teamId: number | null;
  iat?: number;
  exp?: number;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Dashboard cards ──────────────────────────────────────────────────────────

export interface DashboardCard {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

// ─── Dashboard data shapes ────────────────────────────────────────────────────

export interface WeeklyHoursDataPoint {
  date: string;   // e.g. "Mon", "Tue"
  hours: number;
}

export interface TaskStatusDistribution {
  status: string;
  count: number;
}

export interface TeamMemberRow {
  id: number;
  name: string;
  email: string;
  weeklyHours: number;
  attendancePercent: number;
  blockedTasks: number;
  presentToday: boolean;
}

export interface TeamAttendancePoint {
  team: string;
  present: number;
  absent: number;
  wfh: number;
}

export interface TeamHoursPoint {
  team: string;
  hours: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number | null;
  late: boolean;
  status: "PRESENT" | "WFH" | "LEAVE";
  user?: { name: string; email: string };
}

// ─── Work Logs ────────────────────────────────────────────────────────────────

export interface WorkLogRecord {
  id: number;
  userId: number;
  date: string;
  title: string;
  description: string;
  project: string;
  hoursSpent: number;
  status: "IN_PROGRESS" | "DONE" | "BLOCKED";
  createdAt: string;
  user?: { name: string; email: string };
}

// ─── Leave Requests ───────────────────────────────────────────────────────────

export interface LeaveRecord {
  id: number;
  userId: number;
  type: "CASUAL" | "SICK" | "EARNED";
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approverId: number | null;
  createdAt: string;
  user?: { name: string; email: string };
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface WorklogFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  project?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  userId?: number;
  page?: number;
  pageSize?: number;
}

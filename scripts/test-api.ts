/**
 * WorkPulse API Verification Script
 * Run with: npx tsx --env-file=.env scripts/test-api.ts
 *
 * Tests all APIs end-to-end against the running dev server.
 * Uses only fetch (no test framework needed).
 */

const BASE = process.env.TEST_BASE_URL ?? "http://[::1]:3000";

let passed = 0;
let failed = 0;

// Track cookies per "session"
let adminCookie = "";
let managerCookie = "";
let employeeCookie = "";

// Track IDs created during tests
let worklogId = 0;
let leaveId = 0;
let adminUserId = 0;
let employeeUserId = 0;
let managerUserId = 0;

// ─── Utilities ────────────────────────────────────────────────────────────────

type Fetch = (
  path: string,
  opts?: RequestInit & { cookie?: string }
) => Promise<{ status: number; body: Record<string, unknown>; cookie: string }>;

const api: Fetch = async (path, opts = {}) => {
  const { cookie, ...rest } = opts;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(rest.headers ?? {}),
    },
  });
  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    body = { raw: await res.text().catch(() => "") };
  }
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookieMatch = setCookie.match(/workpulse_token=([^;]+)/);
  const extractedCookie = cookieMatch
    ? `workpulse_token=${cookieMatch[1]}`
    : "";
  return { status: res.status, body, cookie: extractedCookie };
};

function log(group: string, label: string, pass: boolean, detail?: string) {
  const icon = pass ? "✅" : "❌";
  if (pass) passed++;
  else failed++;
  const msg = `  ${icon} ${label}`;
  console.log(pass ? msg : `\x1b[31m${msg}\x1b[0m`);
  if (!pass && detail) console.log(`      ↳ ${detail}`);
}

function section(title: string) {
  console.log(`\n\x1b[36m━━━ ${title} ━━━\x1b[0m`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function testAuth() {
  section("Authentication");

  // 1. Register admin
  const r1 = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Test Admin",
      email: `admin_${Date.now()}@test.com`,
      password: "password123",
      role: "ADMIN",
    }),
  });
  log("auth", "Register admin → 201", r1.status === 201, JSON.stringify(r1.body));
  if (r1.status === 201) {
    adminCookie = r1.cookie;
    adminUserId = (r1.body.user as Record<string, number>)?.id;
  }
  log("auth", "Register sets JWT cookie", !!r1.cookie, `cookie: ${r1.cookie?.slice(0,40)}…`);

  // 2. Register manager
  const r2 = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Test Manager",
      email: `mgr_${Date.now()}@test.com`,
      password: "password123",
      role: "MANAGER",
    }),
  });
  log("auth", "Register manager → 201", r2.status === 201, JSON.stringify(r2.body));
  managerCookie = r2.cookie;
  managerUserId = (r2.body.user as Record<string, number>)?.id;

  // 3. Register employee
  const r3 = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Test Employee",
      email: `emp_${Date.now()}@test.com`,
      password: "password123",
      role: "EMPLOYEE",
    }),
  });
  log("auth", "Register employee → 201", r3.status === 201, JSON.stringify(r3.body));
  employeeCookie = r3.cookie;
  employeeUserId = (r3.body.user as Record<string, number>)?.id;

  // 4. Duplicate email
  const r4 = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Dup",
      email: `admin_${Date.now() - 1}@test.com`, // same as first registration attempt
      password: "password123",
      role: "ADMIN",
    }),
  });
  // Use the actual email from r1 body — must use valid password so Zod passes and email check runs
  const adminEmail = (r1.body.user as Record<string, string>)?.email;
  const r4b = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Dup", email: adminEmail, password: "password123", role: "EMPLOYEE" }),
  });
  log("auth", "Duplicate email → 409", r4b.status === 409, JSON.stringify(r4b.body));

  // 5. Bad validation
  const r5 = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "not-an-email", password: "pw" }),
  });
  log("auth", "Invalid registration data → 400", r5.status === 400, JSON.stringify(r5.body));

  // 6. Login with correct credentials
  const adminEmail2 = (r1.body.user as Record<string, string>)?.email;
  const r6 = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail2, password: "password123" }),
  });
  log("auth", "Login with valid credentials → 200", r6.status === 200, JSON.stringify(r6.body));
  log("auth", "Login sets JWT cookie", !!r6.cookie);
  // password should NOT be in response
  const userBody = r6.body.user as Record<string, unknown>;
  log("auth", "Password NOT in login response", !("password" in (userBody ?? {})));

  // 7. Wrong password
  const r7 = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail2, password: "wrongpass" }),
  });
  log("auth", "Wrong password → 401", r7.status === 401);

  // 8. Logout
  const r8 = await api("/api/auth/logout", { method: "POST", cookie: adminCookie });
  log("auth", "Logout → 200", r8.status === 200);

  // 9. Middleware: unauthenticated API call → 401
  const r9 = await api("/api/attendance", { method: "GET" });
  log("auth", "Unauthenticated request → 401", r9.status === 401, JSON.stringify(r9.body));

  // 10. Re-login admin to restore cookie
  const rRelogin = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail2, password: "password123" }),
  });
  if (rRelogin.status === 200) adminCookie = rRelogin.cookie;
}

async function testAttendance() {
  section("Attendance");

  // 1. Check in
  const r1 = await api("/api/attendance/checkin", {
    method: "POST",
    body: JSON.stringify({ status: "PRESENT" }),
    cookie: employeeCookie,
  });
  log("attendance", "Check-in → 201", r1.status === 201, JSON.stringify(r1.body));

  const att = r1.body.attendance as Record<string, unknown>;
  log("attendance", "checkIn timestamp set", !!att?.checkIn);
  log("attendance", "late flag is boolean", typeof att?.late === "boolean");
  log("attendance", "status is PRESENT", att?.status === "PRESENT");

  // 2. Double check-in
  const r2 = await api("/api/attendance/checkin", {
    method: "POST",
    body: JSON.stringify({ status: "PRESENT" }),
    cookie: employeeCookie,
  });
  log("attendance", "Double check-in → 409", r2.status === 409, JSON.stringify(r2.body));

  // 3. Check out without prior check-in (admin user, no check-in yet)
  const r3 = await api("/api/attendance/checkout", {
    method: "POST",
    cookie: adminCookie,
  });
  log("attendance", "Checkout without check-in → 404", r3.status === 404, JSON.stringify(r3.body));

  // 4. Checkout for employee
  // Brief wait so hoursWorked > 0
  await new Promise((r) => setTimeout(r, 500));
  const r4 = await api("/api/attendance/checkout", {
    method: "POST",
    cookie: employeeCookie,
  });
  log("attendance", "Check-out → 200", r4.status === 200, JSON.stringify(r4.body));
  const updAtt = r4.body.attendance as Record<string, unknown>;
  log("attendance", "checkOut timestamp set", !!updAtt?.checkOut);
  log("attendance", "hoursWorked is a number", typeof updAtt?.hoursWorked === "number");

  // 5. Double checkout
  const r5 = await api("/api/attendance/checkout", {
    method: "POST",
    cookie: employeeCookie,
  });
  log("attendance", "Double check-out → 409", r5.status === 409, JSON.stringify(r5.body));

  // 6. List attendance (employee sees own)
  const r6 = await api("/api/attendance", { method: "GET", cookie: employeeCookie });
  log("attendance", "Employee attendance list → 200", r6.status === 200);
  const items = r6.body.items as unknown[];
  log("attendance", "List returns array", Array.isArray(items));
  log("attendance", "Pagination fields present", "total" in r6.body && "page" in r6.body);
}

async function testWorkLogs() {
  section("Work Logs");

  // 1. Create worklog as employee
  const today = new Date().toISOString().split("T")[0];
  const r1 = await api("/api/worklogs", {
    method: "POST",
    body: JSON.stringify({
      title: "Build login page",
      description: "Implemented login form with validation",
      project: "WorkPulse",
      hoursSpent: 3.5,
      status: "IN_PROGRESS",
      date: today,
    }),
    cookie: employeeCookie,
  });
  log("worklogs", "Create worklog → 201", r1.status === 201, JSON.stringify(r1.body));
  worklogId = (r1.body.worklog as Record<string, number>)?.id;

  // 2. Bad validation (hoursSpent > 24)
  const r2 = await api("/api/worklogs", {
    method: "POST",
    body: JSON.stringify({
      title: "Bad log",
      description: "Too many hours",
      project: "X",
      hoursSpent: 99,
      status: "DONE",
      date: today,
    }),
    cookie: employeeCookie,
  });
  log("worklogs", "hoursSpent > 24 → 400", r2.status === 400, JSON.stringify(r2.body));

  // 3. List (employee sees own)
  const r3 = await api("/api/worklogs?page=1&pageSize=10", {
    method: "GET",
    cookie: employeeCookie,
  });
  log("worklogs", "List worklogs → 200", r3.status === 200);
  const items = r3.body.items as unknown[];
  log("worklogs", "Pagination fields present", "total" in r3.body && "totalPages" in r3.body);
  log("worklogs", "Returns array", Array.isArray(items));

  // 4. Search
  const r4 = await api("/api/worklogs?search=login", {
    method: "GET",
    cookie: employeeCookie,
  });
  log("worklogs", "Search by keyword → 200", r4.status === 200, JSON.stringify(r4.body));

  // 5. Filter by status
  const r5 = await api("/api/worklogs?status=IN_PROGRESS", {
    method: "GET",
    cookie: employeeCookie,
  });
  log("worklogs", "Filter by status → 200", r5.status === 200);

  // 6. Update own worklog
  const r6 = await api(`/api/worklogs/${worklogId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "DONE", hoursSpent: 4 }),
    cookie: employeeCookie,
  });
  log("worklogs", "Update own worklog → 200", r6.status === 200, JSON.stringify(r6.body));
  const updated = r6.body.worklog as Record<string, unknown>;
  log("worklogs", "Status updated to DONE", updated?.status === "DONE");
  log("worklogs", "hoursSpent updated to 4", updated?.hoursSpent === 4);

  // 7. Manager cannot update another user's log (employee's log) when not in team
  const r7 = await api(`/api/worklogs/${worklogId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "BLOCKED" }),
    cookie: managerCookie,
  });
  // Manager and employee are not in same team → 404
  log("worklogs", "Manager cannot update out-of-team log → 404", r7.status === 404, JSON.stringify(r7.body));

  // 8. Admin can update any log
  const r8 = await api(`/api/worklogs/${worklogId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "BLOCKED" }),
    cookie: adminCookie,
  });
  log("worklogs", "Admin can update any worklog → 200", r8.status === 200, JSON.stringify(r8.body));

  // 9. Delete (employee deletes own)
  // First create another one to delete
  const r9a = await api("/api/worklogs", {
    method: "POST",
    body: JSON.stringify({ title: "To delete", description: "Will be deleted", project: "Test", hoursSpent: 1, status: "IN_PROGRESS", date: today }),
    cookie: employeeCookie,
  });
  const deleteId = (r9a.body.worklog as Record<string, number>)?.id;
  const r9 = await api(`/api/worklogs/${deleteId}`, {
    method: "DELETE",
    cookie: employeeCookie,
  });
  log("worklogs", "Employee deletes own worklog → 200", r9.status === 200, JSON.stringify(r9.body));

  // 10. Employee cannot delete someone else's worklog
  const r10 = await api(`/api/worklogs/${worklogId}`, {
    method: "DELETE",
    cookie: managerCookie, // manager, not owner and not in team
  });
  log("worklogs", "Manager cannot delete out-of-team worklog → 404", r10.status === 404);

  // 11. Admin sees all logs
  const r11 = await api("/api/worklogs", { method: "GET", cookie: adminCookie });
  log("worklogs", "Admin list → 200", r11.status === 200);
}

async function testLeaves() {
  section("Leave Workflow");

  // 1. Apply for leave (future dates)
  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 5);
  const futureEnd = new Date(futureStart);
  futureEnd.setDate(futureEnd.getDate() + 2);
  const s = futureStart.toISOString().split("T")[0];
  const e = futureEnd.toISOString().split("T")[0];

  const r1 = await api("/api/leaves/apply", {
    method: "POST",
    body: JSON.stringify({ type: "CASUAL", startDate: s, endDate: e, reason: "Personal travel" }),
    cookie: employeeCookie,
  });
  log("leaves", "Apply leave (future dates) → 201", r1.status === 201, JSON.stringify(r1.body));
  leaveId = (r1.body.leave as Record<string, number>)?.id;

  // 2. Past date rejected
  const r2 = await api("/api/leaves/apply", {
    method: "POST",
    body: JSON.stringify({ type: "SICK", startDate: "2020-01-01", endDate: "2020-01-02", reason: "Old dates" }),
    cookie: employeeCookie,
  });
  log("leaves", "Past dates → 400", r2.status === 400, JSON.stringify(r2.body));

  // 3. Overlapping leave (same dates)
  const r3 = await api("/api/leaves/apply", {
    method: "POST",
    body: JSON.stringify({ type: "CASUAL", startDate: s, endDate: e, reason: "Overlap test" }),
    cookie: employeeCookie,
  });
  log("leaves", "Overlapping pending leave → 409", r3.status === 409, JSON.stringify(r3.body));

  // 4. Exceeds balance (request 100 days)
  const farFuture = new Date();
  farFuture.setDate(farFuture.getDate() + 30);
  const farEnd = new Date(farFuture);
  farEnd.setDate(farEnd.getDate() + 100);
  const r4 = await api("/api/leaves/apply", {
    method: "POST",
    body: JSON.stringify({
      type: "EARNED",
      startDate: farFuture.toISOString().split("T")[0],
      endDate: farEnd.toISOString().split("T")[0],
      reason: "Way too long",
    }),
    cookie: employeeCookie,
  });
  log("leaves", "Exceeds balance → 400", r4.status === 400, JSON.stringify(r4.body));

  // 5. List leaves (employee sees own)
  const r5 = await api("/api/leaves", { method: "GET", cookie: employeeCookie });
  log("leaves", "List leaves → 200", r5.status === 200);
  log("leaves", "Pagination fields present", "total" in r5.body);

  // 6. Employee cannot approve
  const r6 = await api("/api/leaves/approve", {
    method: "PATCH",
    body: JSON.stringify({ leaveId }),
    cookie: employeeCookie,
  });
  log("leaves", "Employee cannot approve → 403", r6.status === 403, JSON.stringify(r6.body));

  // 7. Admin approves leave
  const r7 = await api("/api/leaves/approve", {
    method: "PATCH",
    body: JSON.stringify({ leaveId }),
    cookie: adminCookie,
  });
  log("leaves", "Admin approves leave → 200", r7.status === 200, JSON.stringify(r7.body));
  const approved = r7.body.leave as Record<string, unknown>;
  log("leaves", "Status is APPROVED", approved?.status === "APPROVED");
  log("leaves", "approverId stored", !!approved?.approverId);

  // 8. Double approve → 409
  const r8 = await api("/api/leaves/approve", {
    method: "PATCH",
    body: JSON.stringify({ leaveId }),
    cookie: adminCookie,
  });
  log("leaves", "Double approve → 409", r8.status === 409, JSON.stringify(r8.body));

  // 9. Apply another leave to test rejection
  const rj1 = await api("/api/leaves/apply", {
    method: "POST",
    body: JSON.stringify({
      type: "SICK",
      startDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 11 * 86400000).toISOString().split("T")[0],
      reason: "Sick day",
    }),
    cookie: employeeCookie,
  });
  const rejectId = (rj1.body.leave as Record<string, number>)?.id;
  const rj2 = await api("/api/leaves/reject", {
    method: "PATCH",
    body: JSON.stringify({ leaveId: rejectId }),
    cookie: adminCookie,
  });
  log("leaves", "Admin rejects leave → 200", rj2.status === 200, JSON.stringify(rj2.body));
  const rejected = rj2.body.leave as Record<string, unknown>;
  log("leaves", "Status is REJECTED", rejected?.status === "REJECTED");
}

async function testDashboards() {
  section("Dashboard APIs");

  // Employee dashboard
  const r1 = await api("/api/dashboard/employee", { method: "GET", cookie: employeeCookie });
  log("dashboard", "Employee dashboard → 200", r1.status === 200, JSON.stringify(r1.body).slice(0,200));
  const ed = r1.body as Record<string, unknown>;
  log("dashboard", "Employee: cards present", "cards" in ed);
  log("dashboard", "Employee: weeklyHoursTrend is array", Array.isArray(ed.weeklyHoursTrend));
  log("dashboard", "Employee: taskDistribution is array", Array.isArray(ed.taskDistribution));

  // Manager dashboard
  const r2 = await api("/api/dashboard/manager", { method: "GET", cookie: managerCookie });
  log("dashboard", "Manager dashboard → 200", r2.status === 200, JSON.stringify(r2.body).slice(0,200));
  const md = r2.body as Record<string, unknown>;
  log("dashboard", "Manager: cards present", "cards" in md);
  log("dashboard", "Manager: teamTable is array", Array.isArray(md.teamTable));

  // Admin dashboard
  const r3 = await api("/api/dashboard/admin", { method: "GET", cookie: adminCookie });
  log("dashboard", "Admin dashboard → 200", r3.status === 200, JSON.stringify(r3.body).slice(0,200));
  const ad = r3.body as Record<string, unknown>;
  log("dashboard", "Admin: cards present", "cards" in ad);
  log("dashboard", "Admin: teamAttendanceChart is array", Array.isArray(ad.teamAttendanceChart));
  log("dashboard", "Admin: teamHoursChart is array", Array.isArray(ad.teamHoursChart));

  // Role enforcement: employee cannot call admin dashboard
  const r4 = await api("/api/dashboard/admin", { method: "GET", cookie: employeeCookie });
  log("dashboard", "Employee cannot access admin dashboard → 403", r4.status === 403, JSON.stringify(r4.body));

  // Role enforcement: employee cannot call manager dashboard
  const r5 = await api("/api/dashboard/manager", { method: "GET", cookie: employeeCookie });
  log("dashboard", "Employee cannot access manager dashboard → 403", r5.status === 403, JSON.stringify(r5.body));
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\x1b[1m\x1b[35m🔬 WorkPulse API Verification\x1b[0m");
  console.log(`   Target: ${BASE}\n`);

  try {
    await testAuth();
    await testAttendance();
    await testWorkLogs();
    await testLeaves();
    await testDashboards();
  } catch (err) {
    console.error("\n\x1b[31m💥 Test runner crashed:\x1b[0m", err);
  }

  const total = passed + failed;
  const color = failed === 0 ? "\x1b[32m" : "\x1b[31m";
  console.log(`\n${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
  console.log(`${color}  Results: ${passed}/${total} passed  (${failed} failed)\x1b[0m`);
  console.log(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`);

  if (failed > 0) process.exit(1);
}

main();

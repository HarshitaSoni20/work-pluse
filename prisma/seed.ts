import { Role, AttendanceStatus, TaskStatus, LeaveType, LeaveStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { subDays, setHours, setMinutes } from "date-fns";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Start seeding database...");

  // 1. Clean existing records in order
  await prisma.leaveRequest.deleteMany();
  await prisma.workLog.deleteMany();
  await prisma.attendance.deleteMany();
  
  // Break circular manager dependency before deleting teams/users
  await prisma.team.updateMany({ data: { managerId: null } });
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  console.log("🧹 Database cleaned.");

  // 2. Hash shared password
  const passwordHash = await bcrypt.hash("password123", 10);

  // 3. Create Teams first without manager
  const engTeam = await prisma.team.create({ data: { name: "Engineering" } });
  const prodTeam = await prisma.team.create({ data: { name: "Product & Design" } });
  const hrTeam = await prisma.team.create({ data: { name: "Human Resources" } });

  console.log("👥 Teams created.");

  // 4. Create Users (Admin, Managers, Employees)
  const admin = await prisma.user.create({
    data: {
      name: "Harshita Admin",
      email: "admin@workpulse.com",
      password: passwordHash,
      role: Role.ADMIN,
      teamId: hrTeam.id,
      leaveBalance: 24,
    },
  });

  const engManager = await prisma.user.create({
    data: {
      name: "David Eng Manager",
      email: "david@workpulse.com",
      password: passwordHash,
      role: Role.MANAGER,
      teamId: engTeam.id,
      leaveBalance: 20,
    },
  });

  const prodManager = await prisma.user.create({
    data: {
      name: "Sarah Prod Manager",
      email: "sarah@workpulse.com",
      password: passwordHash,
      role: Role.MANAGER,
      teamId: prodTeam.id,
      leaveBalance: 20,
    },
  });

  // Assign managers to teams
  await prisma.team.update({
    where: { id: engTeam.id },
    data: { managerId: engManager.id },
  });
  await prisma.team.update({
    where: { id: prodTeam.id },
    data: { managerId: prodManager.id },
  });

  console.log("👔 Managers assigned.");

  const employees = [];
  const names = [
    { name: "John Doe", email: "john@workpulse.com", teamId: engTeam.id },
    { name: "Alice Smith", email: "alice@workpulse.com", teamId: engTeam.id },
    { name: "Bob Johnson", email: "bob@workpulse.com", teamId: engTeam.id },
    { name: "Charlie Brown", email: "charlie@workpulse.com", teamId: prodTeam.id },
    { name: "Diana Prince", email: "diana@workpulse.com", teamId: prodTeam.id },
    { name: "Emma Watson", email: "emma@workpulse.com", teamId: null },
    { name: "Frank Miller", email: "frank@workpulse.com", teamId: engTeam.id },
    { name: "Grace Hopper", email: "grace@workpulse.com", teamId: prodTeam.id },
  ];

  for (const n of names) {
    const emp = await prisma.user.create({
      data: {
        name: n.name,
        email: n.email,
        password: passwordHash,
        role: Role.EMPLOYEE,
        teamId: n.teamId,
        leaveBalance: 18,
      },
    });
    employees.push(emp);
  }

  console.log("👤 Employees created.");

  // All users to seed logs for
  const loggedUsers = [engManager, prodManager, ...employees];
  const today = new Date();

  // 5. Seed 14 weekdays of history
  console.log("📅 Seeding history...");
  let daysSeeded = 0;
  let offset = 1;
  while (daysSeeded < 14) {
    const logDate = subDays(today, offset);
    offset++;
    // Skip weekends for logging ease
    if (logDate.getDay() === 0 || logDate.getDay() === 6) continue;

    const startOfLogDate = new Date(logDate);
    startOfLogDate.setHours(0, 0, 0, 0);

    for (const u of loggedUsers) {
      // 90% chance of being present, 10% WFH
      const isPresent = Math.random() > 0.1;
      const status = isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.WFH;

      // Random check-in times around 9:00 AM (some late, some on time)
      const isLate = Math.random() > 0.7; // 30% late rate
      const checkinHour = isLate ? 9 : 8;
      const checkinMin = isLate ? 45 : 45 + Math.floor(Math.random() * 15);

      const checkInTime = setMinutes(setHours(new Date(logDate), checkinHour), checkinMin);
      const checkOutTime = setMinutes(setHours(new Date(logDate), 17), 30 + Math.floor(Math.random() * 30));

      const hoursWorked = Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100;

      // Create attendance record
      await prisma.attendance.create({
        data: {
          userId: u.id,
          date: startOfLogDate,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          hoursWorked,
          late: isLate && checkinHour === 9 && checkinMin > 30, // late flag true if after 9:30 AM
          status,
        },
      });

      // Create a work log for the day
      const statuses = [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED];
      const taskStatus = statuses[Math.floor(Math.random() * statuses.length)];

      await prisma.workLog.create({
        data: {
          userId: u.id,
          date: startOfLogDate,
          title: `Completed daily tasks for offset -${offset}`,
          description: `Worked on core module items, resolved open bugs, and participated in standup.`,
          project: u.teamId === engTeam.id ? "WorkPulse Engineering" : "WorkPulse Product Roadmap",
          hoursSpent: hoursWorked,
          status: taskStatus,
        },
      });
    }
    daysSeeded++;
  }

  // 6. Seed Leaves
  console.log("🍂 Seeding leave requests...");
  const firstEmployee = employees[0];
  const secondEmployee = employees[1];

  // A pending leave
  await prisma.leaveRequest.create({
    data: {
      userId: firstEmployee.id,
      type: LeaveType.CASUAL,
      startDate: subDays(today, -2),
      endDate: subDays(today, -3),
      reason: "Family event back home",
      status: LeaveStatus.PENDING,
    },
  });

  // An approved leave
  await prisma.leaveRequest.create({
    data: {
      userId: secondEmployee.id,
      type: LeaveType.SICK,
      startDate: subDays(today, 10),
      endDate: subDays(today, 8),
      reason: "Dental checkup and recovery",
      status: LeaveStatus.APPROVED,
      approverId: engManager.id,
    },
  });

  // A rejected leave
  await prisma.leaveRequest.create({
    data: {
      userId: firstEmployee.id,
      type: LeaveType.EARNED,
      startDate: subDays(today, 15),
      endDate: subDays(today, 12),
      reason: "Leisure travel",
      status: LeaveStatus.REJECTED,
      approverId: admin.id,
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

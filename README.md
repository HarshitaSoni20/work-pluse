WorkPulse - Full Stack HRMS & Employee Productivity Platform

A production-ready HRMS application built with Next.js, TypeScript, Prisma ORM, PostgreSQL, and JWT Authentication. WorkPulse helps organizations manage attendance, daily work logs, leave requests, and team reporting with role-based access control.

🚀 Features
Authentication & Authorization
JWT-based authentication
Role-based access control
Three roles:
Employee
Manager
Admin/HR
Server-side permission enforcement
👥 Roles & Access
Employee
View personal dashboard
Check in and check out
Log daily work
Edit and delete own work logs
Apply for leave
View attendance history and leave status
Manager
View team dashboard
Monitor team hours
View team attendance
Review work logs of team members
Approve or reject leave requests
Admin
Organization-wide dashboard
Manage users
Manage teams
Access all attendance records
Access all work logs
View company-wide analytics
Tech Stack
Frontend
Next.js 16
React 19
TypeScript
Tailwind CSS
Recharts
Lucide Icons
Backend
Next.js API Routes
JWT Authentication
Prisma ORM
Database
PostgreSQL
Entity Relationship Diagram (ER Diagram)
                            ┌─────────────┐
                            │    Teams    │
                            ├─────────────┤
                            │ id (PK)     │
                            │ name        │
                            │ managerId   │──────────────┐
                            └─────────────┘              │
                                   ▲                     │
                                   │                     │
                                   │                     ▼
                            ┌────────────────────────────────┐
                            │             Users              │
                            ├────────────────────────────────┤
                            │ id (PK)                        │
                            │ name                           │
                            │ email (Unique)                 │
                            │ password                       │
                            │ role (EMPLOYEE/MANAGER/ADMIN)  │
                            │ leaveBalance                   │
                            │ teamId (FK)                    │
                            └────────────────────────────────┘
                                   │
               ┌───────────────────┼─────────────────────┐
               │                   │                     │
               ▼                   ▼                     ▼

      ┌────────────────┐   ┌────────────────┐   ┌─────────────────────┐
      │   Attendance   │   │   Work Logs    │   │  Leave Requests     │
      ├────────────────┤   ├────────────────┤   ├─────────────────────┤
      │ id (PK)        │   │ id (PK)        │   │ id (PK)             │
      │ userId (FK)    │   │ userId (FK)    │   │ userId (FK)         │
      │ date           │   │ date           │   │ type                │
      │ checkIn        │   │ title          │   │ startDate           │
      │ checkOut       │   │ description    │   │ endDate             │
      │ hoursWorked    │   │ project        │   │ reason              │
      │ late           │   │ hoursSpent     │   │ status              │
      │ status         │   │ status         │   │ approverId (FK)     │
      └────────────────┘   └────────────────┘   └─────────────────────┘
                                                        │
                                                        ▼
                                                ┌──────────────┐
                                                │    Users     │
                                                │ (Approver)   │
                                                └──────────────┘

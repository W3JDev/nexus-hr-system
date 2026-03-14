import { pgTable, text, integer, boolean, timestamp, serial, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS / AUTH ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("employee"), // admin | hr | manager | employee
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  headId: integer("head_id"),
  description: text("description"),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  employeeId: text("employee_id").notNull().unique(), // EMP-0001
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  designation: text("designation").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  managerId: integer("manager_id"),
  employmentType: text("employment_type").notNull().default("full_time"), // full_time | part_time | contract | intern
  status: text("status").notNull().default("active"), // active | on_leave | terminated | probation
  dateJoined: date("date_joined").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  city: text("city"),
  country: text("country").default("Malaysia"),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// ─── LEAVE TYPES ──────────────────────────────────────────────────────────────
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Annual, Sick, Maternity, etc.
  daysAllowed: integer("days_allowed").notNull(),
  color: text("color").notNull().default("#01696F"),
  isPaid: boolean("is_paid").notNull().default(true),
});

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).omit({ id: true });
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveType = typeof leaveTypes.$inferSelect;

// ─── LEAVE APPLICATIONS ───────────────────────────────────────────────────────
export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  leaveTypeId: integer("leave_type_id").references(() => leaveTypes.id).notNull(),
  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | cancelled
  approverId: integer("approver_id"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).omit({ id: true, createdAt: true, approvedAt: true });
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type LeaveApplication = typeof leaveApplications.$inferSelect;

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  status: text("status").notNull().default("present"), // present | absent | half_day | holiday | on_leave
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// ─── PAYROLL ──────────────────────────────────────────────────────────────────
export const payrollRuns = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  status: text("status").notNull().default("draft"), // draft | processing | completed | paid
  totalGross: decimal("total_gross", { precision: 14, scale: 2 }),
  totalNet: decimal("total_net", { precision: 14, scale: 2 }),
  employeeCount: integer("employee_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({ id: true, createdAt: true });
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRuns.$inferSelect;

export const salarySlips = pgTable("salary_slips", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").references(() => payrollRuns.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  basicSalary: decimal("basic_salary", { precision: 12, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  grossSalary: decimal("gross_salary", { precision: 12, scale: 2 }).notNull(),
  netSalary: decimal("net_salary", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("generated"), // generated | paid
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalarySlipSchema = createInsertSchema(salarySlips).omit({ id: true, createdAt: true });
export type InsertSalarySlip = z.infer<typeof insertSalarySlipSchema>;
export type SalarySlip = typeof salarySlips.$inferSelect;

// ─── RECRUITMENT ──────────────────────────────────────────────────────────────
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  description: text("description"),
  requirements: text("requirements"),
  location: text("location"),
  employmentType: text("employment_type").notNull().default("full_time"),
  salaryMin: decimal("salary_min", { precision: 12, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("open"), // open | closed | draft
  applicantCount: integer("applicant_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({ id: true, createdAt: true });
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  phone: text("phone"),
  coverLetter: text("cover_letter"),
  stage: text("stage").notNull().default("applied"), // applied | screening | interview | offer | hired | rejected
  rating: integer("rating"), // 1-5
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({ id: true, createdAt: true });
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id"),
  priority: text("priority").notNull().default("normal"), // normal | high | urgent
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

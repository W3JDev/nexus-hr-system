import {
  users, employees, departments, leaveTypes, leaveApplications,
  attendance, payrollRuns, salarySlips, jobPostings, jobApplications, announcements,
  type User, type InsertUser,
  type Employee, type InsertEmployee,
  type Department, type InsertDepartment,
  type LeaveType, type InsertLeaveType,
  type LeaveApplication, type InsertLeaveApplication,
  type Attendance, type InsertAttendance,
  type PayrollRun, type InsertPayrollRun,
  type SalarySlip, type InsertSalarySlip,
  type JobPosting, type InsertJobPosting,
  type JobApplication, type InsertJobApplication,
  type Announcement, type InsertAnnouncement,
} from "@shared/schema";

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(dept: InsertDepartment): Promise<Department>;

  // Leave Types
  getLeaveTypes(): Promise<LeaveType[]>;
  createLeaveType(lt: InsertLeaveType): Promise<LeaveType>;

  // Leave Applications
  getLeaveApplications(): Promise<LeaveApplication[]>;
  getLeaveApplicationsByEmployee(employeeId: number): Promise<LeaveApplication[]>;
  createLeaveApplication(la: InsertLeaveApplication): Promise<LeaveApplication>;
  updateLeaveApplication(id: number, data: Partial<InsertLeaveApplication>): Promise<LeaveApplication>;

  // Attendance
  getAttendance(): Promise<Attendance[]>;
  getAttendanceByEmployee(employeeId: number): Promise<Attendance[]>;
  getTodayAttendance(): Promise<Attendance[]>;
  createAttendance(a: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance>;

  // Payroll
  getPayrollRuns(): Promise<PayrollRun[]>;
  getPayrollRun(id: number): Promise<PayrollRun | undefined>;
  createPayrollRun(pr: InsertPayrollRun): Promise<PayrollRun>;
  updatePayrollRun(id: number, data: Partial<InsertPayrollRun>): Promise<PayrollRun>;
  getSalarySlips(payrollRunId?: number): Promise<SalarySlip[]>;
  getSalarySlipsByEmployee(employeeId: number): Promise<SalarySlip[]>;
  createSalarySlip(ss: InsertSalarySlip): Promise<SalarySlip>;

  // Recruitment
  getJobPostings(): Promise<JobPosting[]>;
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  createJobPosting(jp: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, data: Partial<InsertJobPosting>): Promise<JobPosting>;
  getJobApplications(jobPostingId?: number): Promise<JobApplication[]>;
  createJobApplication(ja: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, data: Partial<InsertJobApplication>): Promise<JobApplication>;

  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(a: InsertAnnouncement): Promise<Announcement>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private employees: Map<number, Employee> = new Map();
  private departments: Map<number, Department> = new Map();
  private leaveTypes: Map<number, LeaveType> = new Map();
  private leaveApplications: Map<number, LeaveApplication> = new Map();
  private attendanceRecords: Map<number, Attendance> = new Map();
  private payrollRuns: Map<number, PayrollRun> = new Map();
  private salarySlips: Map<number, SalarySlip> = new Map();
  private jobPostings: Map<number, JobPosting> = new Map();
  private jobApplications: Map<number, JobApplication> = new Map();
  private announcements: Map<number, Announcement> = new Map();

  private counters = {
    users: 1, employees: 1, departments: 1, leaveTypes: 1,
    leaveApplications: 1, attendance: 1, payrollRuns: 1, salarySlips: 1,
    jobPostings: 1, jobApplications: 1, announcements: 1
  };

  constructor() {
    this.seed();
  }

  private seed() {
    // Admin user
    const adminUser: User = {
      id: 1, email: "admin@hrms.io", password: "admin123",
      name: "Alex Chen", role: "admin", avatarUrl: null, createdAt: new Date(),
    };
    this.users.set(1, adminUser);
    this.counters.users = 2;

    // Departments
    const depts = [
      { id: 1, name: "Engineering", headId: null, description: "Software development and infrastructure" },
      { id: 2, name: "Product", headId: null, description: "Product management and design" },
      { id: 3, name: "Marketing", headId: null, description: "Brand and growth" },
      { id: 4, name: "Finance", headId: null, description: "Financial planning and accounting" },
      { id: 5, name: "Human Resources", headId: null, description: "People ops and culture" },
      { id: 6, name: "Operations", headId: null, description: "Business operations" },
    ];
    depts.forEach(d => this.departments.set(d.id, d));
    this.counters.departments = 7;

    // Leave Types
    const lts = [
      { id: 1, name: "Annual Leave", daysAllowed: 14, color: "#01696F", isPaid: true },
      { id: 2, name: "Sick Leave", daysAllowed: 14, color: "#964219", isPaid: true },
      { id: 3, name: "Maternity Leave", daysAllowed: 60, color: "#7A39BB", isPaid: true },
      { id: 4, name: "Paternity Leave", daysAllowed: 7, color: "#006494", isPaid: true },
      { id: 5, name: "Unpaid Leave", daysAllowed: 30, color: "#5A5957", isPaid: false },
    ];
    lts.forEach(lt => this.leaveTypes.set(lt.id, lt));
    this.counters.leaveTypes = 6;

    // Employees (10 mock employees)
    const emps: Employee[] = [
      { id: 1, userId: 1, employeeId: "EMP-0001", firstName: "Alex", lastName: "Chen", email: "admin@hrms.io", phone: "+60-12-345-6789", designation: "Chief Executive Officer", departmentId: 5, managerId: null, employmentType: "full_time", status: "active", dateJoined: "2020-01-15", dateOfBirth: "1985-03-22", gender: "male", address: "Level 18, Menara KL", city: "Kuala Lumpur", country: "Malaysia", salary: "25000.00", avatarUrl: null, bio: "Founder and CEO of the company." },
      { id: 2, userId: null, employeeId: "EMP-0002", firstName: "Sarah", lastName: "Lim", email: "sarah.lim@hrms.io", phone: "+60-12-456-7890", designation: "Head of Engineering", departmentId: 1, managerId: 1, employmentType: "full_time", status: "active", dateJoined: "2020-03-01", dateOfBirth: "1988-07-14", gender: "female", address: "Bangsar South", city: "Kuala Lumpur", country: "Malaysia", salary: "18000.00", avatarUrl: null, bio: "Leading engineering teams." },
      { id: 3, userId: null, employeeId: "EMP-0003", firstName: "Raj", lastName: "Kumar", email: "raj.kumar@hrms.io", phone: "+60-13-567-8901", designation: "Senior Engineer", departmentId: 1, managerId: 2, employmentType: "full_time", status: "active", dateJoined: "2021-06-01", dateOfBirth: "1992-11-30", gender: "male", address: "Mont Kiara", city: "Kuala Lumpur", country: "Malaysia", salary: "12000.00", avatarUrl: null, bio: "Full-stack developer." },
      { id: 4, userId: null, employeeId: "EMP-0004", firstName: "Nurul", lastName: "Aina", email: "nurul.aina@hrms.io", phone: "+60-14-678-9012", designation: "Product Manager", departmentId: 2, managerId: 1, employmentType: "full_time", status: "active", dateJoined: "2021-09-15", dateOfBirth: "1990-04-18", gender: "female", address: "Petaling Jaya", city: "Selangor", country: "Malaysia", salary: "14000.00", avatarUrl: null, bio: "Product strategist." },
      { id: 5, userId: null, employeeId: "EMP-0005", firstName: "James", lastName: "Wong", email: "james.wong@hrms.io", phone: "+60-16-789-0123", designation: "Marketing Director", departmentId: 3, managerId: 1, employmentType: "full_time", status: "active", dateJoined: "2020-08-01", dateOfBirth: "1986-12-05", gender: "male", address: "KLCC", city: "Kuala Lumpur", country: "Malaysia", salary: "15000.00", avatarUrl: null, bio: "Brand and growth leader." },
      { id: 6, userId: null, employeeId: "EMP-0006", firstName: "Priya", lastName: "Nair", email: "priya.nair@hrms.io", phone: "+60-17-890-1234", designation: "Finance Manager", departmentId: 4, managerId: 1, employmentType: "full_time", status: "active", dateJoined: "2022-01-10", dateOfBirth: "1991-08-22", gender: "female", address: "Subang Jaya", city: "Selangor", country: "Malaysia", salary: "13000.00", avatarUrl: null, bio: "Financial planning expert." },
      { id: 7, userId: null, employeeId: "EMP-0007", firstName: "Amirul", lastName: "Haziq", email: "amirul.haziq@hrms.io", phone: "+60-18-901-2345", designation: "Junior Engineer", departmentId: 1, managerId: 2, employmentType: "full_time", status: "probation", dateJoined: "2024-01-15", dateOfBirth: "1998-06-10", gender: "male", address: "Cheras", city: "Kuala Lumpur", country: "Malaysia", salary: "6000.00", avatarUrl: null, bio: "Fresh graduate in probation." },
      { id: 8, userId: null, employeeId: "EMP-0008", firstName: "Lisa", lastName: "Tan", email: "lisa.tan@hrms.io", phone: "+60-11-012-3456", designation: "UX Designer", departmentId: 2, managerId: 4, employmentType: "full_time", status: "active", dateJoined: "2022-07-01", dateOfBirth: "1994-02-28", gender: "female", address: "Damansara", city: "Kuala Lumpur", country: "Malaysia", salary: "9000.00", avatarUrl: null, bio: "Product design and UX." },
      { id: 9, userId: null, employeeId: "EMP-0009", firstName: "Wei", lastName: "Han", email: "wei.han@hrms.io", phone: "+60-12-123-4567", designation: "Content Strategist", departmentId: 3, managerId: 5, employmentType: "full_time", status: "on_leave", dateJoined: "2022-11-01", dateOfBirth: "1995-09-17", gender: "male", address: "Ampang", city: "Kuala Lumpur", country: "Malaysia", salary: "7500.00", avatarUrl: null, bio: "Digital content and SEO." },
      { id: 10, userId: null, employeeId: "EMP-0010", firstName: "Fatimah", lastName: "Zahra", email: "fatimah.zahra@hrms.io", phone: "+60-13-234-5678", designation: "HR Executive", departmentId: 5, managerId: 1, employmentType: "full_time", status: "active", dateJoined: "2023-03-01", dateOfBirth: "1993-12-03", gender: "female", address: "Shah Alam", city: "Selangor", country: "Malaysia", salary: "7000.00", avatarUrl: null, bio: "People operations specialist." },
    ];
    emps.forEach(e => this.employees.set(e.id, e));
    this.counters.employees = 11;

    // Leave Applications
    const today = new Date();
    const las: LeaveApplication[] = [
      { id: 1, employeeId: 9, leaveTypeId: 1, fromDate: "2025-03-10", toDate: "2025-03-14", totalDays: 5, reason: "Family vacation", status: "approved", approverId: 1, approvedAt: new Date("2025-03-08"), createdAt: new Date("2025-03-05") },
      { id: 2, employeeId: 3, leaveTypeId: 2, fromDate: "2025-03-15", toDate: "2025-03-16", totalDays: 2, reason: "Feeling unwell", status: "pending", approverId: null, approvedAt: null, createdAt: new Date("2025-03-14") },
      { id: 3, employeeId: 7, leaveTypeId: 1, fromDate: "2025-04-01", toDate: "2025-04-03", totalDays: 3, reason: "Personal matters", status: "pending", approverId: null, approvedAt: null, createdAt: new Date("2025-03-12") },
      { id: 4, employeeId: 8, leaveTypeId: 1, fromDate: "2025-02-20", toDate: "2025-02-21", totalDays: 2, reason: "Rest day", status: "approved", approverId: 1, approvedAt: new Date("2025-02-18"), createdAt: new Date("2025-02-17") },
      { id: 5, employeeId: 5, leaveTypeId: 2, fromDate: "2025-01-10", toDate: "2025-01-10", totalDays: 1, reason: "Migraine", status: "approved", approverId: 1, approvedAt: new Date("2025-01-10"), createdAt: new Date("2025-01-10") },
    ];
    las.forEach(la => this.leaveApplications.set(la.id, la));
    this.counters.leaveApplications = 6;

    // Attendance records for today and past week
    const empIds = [1,2,3,4,5,6,7,8,9,10];
    let attId = 1;
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    dates.forEach(dateStr => {
      empIds.forEach(empId => {
        if (empId === 9) return; // on leave
        const checkInHour = 8 + Math.floor(Math.random() * 2);
        const checkIn = new Date(`${dateStr}T0${checkInHour}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}:00`);
        const checkOut = new Date(`${dateStr}T${17 + Math.floor(Math.random()*2)}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}:00`);
        const hours = ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2);
        const att: Attendance = {
          id: attId++, employeeId: empId, date: dateStr,
          checkIn, checkOut, hoursWorked: hours, status: "present"
        };
        this.attendanceRecords.set(att.id, att);
      });
    });
    this.counters.attendance = attId;

    // Payroll Runs
    const prs: PayrollRun[] = [
      { id: 1, month: 1, year: 2025, status: "paid", totalGross: "126500.00", totalNet: "110000.00", employeeCount: 10, createdAt: new Date("2025-01-31") },
      { id: 2, month: 2, year: 2025, status: "paid", totalGross: "126500.00", totalNet: "110000.00", employeeCount: 10, createdAt: new Date("2025-02-28") },
      { id: 3, month: 3, year: 2025, status: "completed", totalGross: "126500.00", totalNet: "110000.00", employeeCount: 10, createdAt: new Date("2025-03-31") },
    ];
    prs.forEach(pr => this.payrollRuns.set(pr.id, pr));
    this.counters.payrollRuns = 4;

    // Salary Slips for payroll run 3
    emps.forEach((emp, idx) => {
      const basic = parseFloat(emp.salary || "5000");
      const allowances = basic * 0.1;
      const gross = basic + allowances;
      const deductions = gross * 0.11; // EPF
      const net = gross - deductions;
      const ss: SalarySlip = {
        id: idx + 1, payrollRunId: 3, employeeId: emp.id,
        basicSalary: basic.toFixed(2), allowances: allowances.toFixed(2),
        deductions: deductions.toFixed(2), grossSalary: gross.toFixed(2),
        netSalary: net.toFixed(2), status: "generated", createdAt: new Date("2025-03-31")
      };
      this.salarySlips.set(ss.id, ss);
    });
    this.counters.salarySlips = emps.length + 1;

    // Job Postings
    const jps: JobPosting[] = [
      { id: 1, title: "Senior Backend Engineer", departmentId: 1, description: "We are looking for a senior backend engineer to lead our API development.", requirements: "5+ years Node.js/Go, PostgreSQL, Redis, Docker", location: "Kuala Lumpur (Hybrid)", employmentType: "full_time", salaryMin: "12000.00", salaryMax: "18000.00", status: "open", applicantCount: 14, createdAt: new Date("2025-02-15") },
      { id: 2, title: "Product Designer", departmentId: 2, description: "Create stunning user experiences for our product suite.", requirements: "3+ years Figma, UX research, design systems", location: "Remote", employmentType: "full_time", salaryMin: "8000.00", salaryMax: "12000.00", status: "open", applicantCount: 22, createdAt: new Date("2025-02-20") },
      { id: 3, title: "Growth Marketing Manager", departmentId: 3, description: "Lead our digital growth and paid acquisition channels.", requirements: "4+ years growth marketing, SEO/SEM, analytics", location: "Kuala Lumpur", employmentType: "full_time", salaryMin: "10000.00", salaryMax: "15000.00", status: "open", applicantCount: 8, createdAt: new Date("2025-03-01") },
      { id: 4, title: "Data Analyst Intern", departmentId: 4, description: "Support finance team with data analysis and dashboards.", requirements: "Python/SQL, Excel, pursuing degree in related field", location: "Kuala Lumpur (Onsite)", employmentType: "intern", salaryMin: "1500.00", salaryMax: "2000.00", status: "closed", applicantCount: 31, createdAt: new Date("2025-01-10") },
    ];
    jps.forEach(jp => this.jobPostings.set(jp.id, jp));
    this.counters.jobPostings = 5;

    // Job Applications
    const stages = ["applied", "screening", "interview", "offer", "hired", "rejected"];
    let jaId = 1;
    const names = ["Ahmad Faris", "Siti Maryam", "Kevin Ong", "Divya Pillai", "Brandon Tan", "Zainab Hassan", "Marcus Lee", "Nisha Raj"];
    [1, 2, 3].forEach(jobId => {
      names.slice(0, 5).forEach((name, i) => {
        const ja: JobApplication = {
          id: jaId++, jobPostingId: jobId,
          candidateName: name, candidateEmail: `${name.toLowerCase().replace(' ','')}@email.com`,
          phone: `+60-1${i}-000-${(1000+jaId).toString()}`,
          coverLetter: "I am excited about this opportunity...",
          stage: stages[Math.min(i, stages.length-1)], rating: Math.floor(Math.random()*3)+3,
          notes: null, createdAt: new Date()
        };
        this.jobApplications.set(ja.id, ja);
      });
    });
    this.counters.jobApplications = jaId;

    // Announcements
    const anns: Announcement[] = [
      { id: 1, title: "Q1 2025 All-Hands Meeting", content: "Join us for our Q1 all-hands on March 28th at 10AM. We'll review KPIs, celebrate wins, and share the roadmap ahead.", authorId: 1, priority: "high", createdAt: new Date("2025-03-10") },
      { id: 2, title: "New Leave Policy Update", content: "Effective April 1st, the annual leave entitlement has been increased to 16 days for employees with 3+ years of service.", authorId: 1, priority: "normal", createdAt: new Date("2025-03-12") },
      { id: 3, title: "Office Closure — Hari Raya", content: "The office will be closed from April 1-5 in observance of Hari Raya Aidilfitri. Enjoy the festive holiday!", authorId: 1, priority: "normal", createdAt: new Date("2025-03-14") },
    ];
    anns.forEach(a => this.announcements.set(a.id, a));
    this.counters.announcements = 4;
  }

  // ── Users ──
  async getUserByEmail(email: string) { return [...this.users.values()].find(u => u.email === email); }
  async getUserById(id: number) { return this.users.get(id); }
  async createUser(user: InsertUser): Promise<User> {
    const u: User = { 
      ...user, 
      id: this.counters.users++, 
      role: user.role ?? 'employee',
      avatarUrl: user.avatarUrl ?? null,
      createdAt: new Date() 
    };
    this.users.set(u.id, u);
    return u;
  }

  // ── Employees ──
  async getEmployees() { return [...this.employees.values()]; }
  async getEmployee(id: number) { return this.employees.get(id); }
  async getEmployeeByUserId(userId: number) { return [...this.employees.values()].find(e => e.userId === userId); }
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const e: Employee = { 
      ...employee, 
      id: this.counters.employees++, 
      userId: employee.userId ?? null, 
      phone: employee.phone ?? null, 
      managerId: employee.managerId ?? null, 
      dateOfBirth: employee.dateOfBirth ?? null, 
      gender: employee.gender ?? null, 
      address: employee.address ?? null, 
      city: employee.city ?? null, 
      country: employee.country ?? "Malaysia", 
      salary: employee.salary ?? null, 
      avatarUrl: employee.avatarUrl ?? null, 
      bio: employee.bio ?? null, 
      departmentId: employee.departmentId ?? null,
      status: employee.status ?? 'active',
      employmentType: employee.employmentType ?? 'full_time'
    };
    this.employees.set(e.id, e);
    return e;
  }
  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee> {
    const e = this.employees.get(id)!;
    const updated = { ...e, ...data };
    this.employees.set(id, updated);
    return updated;
  }
  async deleteEmployee(id: number) { this.employees.delete(id); }

  // ── Departments ──
  async getDepartments() { return [...this.departments.values()]; }
  async getDepartment(id: number) { return this.departments.get(id); }
  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const d: Department = { ...dept, id: this.counters.departments++, headId: dept.headId ?? null, description: dept.description ?? null };
    this.departments.set(d.id, d);
    return d;
  }

  // ── Leave Types ──
  async getLeaveTypes() { return [...this.leaveTypes.values()]; }
  async createLeaveType(lt: InsertLeaveType): Promise<LeaveType> {
    const l: LeaveType = { 
      ...lt, 
      id: this.counters.leaveTypes++,
      color: lt.color ?? '#01696F',
      isPaid: lt.isPaid ?? true
    };
    this.leaveTypes.set(l.id, l);
    return l;
  }

  // ── Leave Applications ──
  async getLeaveApplications() { return [...this.leaveApplications.values()]; }
  async getLeaveApplicationsByEmployee(employeeId: number) { return [...this.leaveApplications.values()].filter(la => la.employeeId === employeeId); }
  async createLeaveApplication(la: InsertLeaveApplication): Promise<LeaveApplication> {
    const l: LeaveApplication = { 
      ...la, 
      id: this.counters.leaveApplications++, 
      reason: la.reason ?? null, 
      approverId: la.approverId ?? null, 
      approvedAt: null, 
      status: la.status ?? 'pending',
      createdAt: new Date() 
    };
    this.leaveApplications.set(l.id, l);
    return l;
  }
  async updateLeaveApplication(id: number, data: Partial<InsertLeaveApplication>): Promise<LeaveApplication> {
    const la = this.leaveApplications.get(id)!;
    const updated = { ...la, ...data, approvedAt: data.status === 'approved' ? new Date() : la.approvedAt };
    this.leaveApplications.set(id, updated);
    return updated;
  }

  // ── Attendance ──
  async getAttendance() { return [...this.attendanceRecords.values()]; }
  async getAttendanceByEmployee(employeeId: number) { return [...this.attendanceRecords.values()].filter(a => a.employeeId === employeeId); }
  async getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    return [...this.attendanceRecords.values()].filter(a => a.date === today);
  }
  async createAttendance(a: InsertAttendance): Promise<Attendance> {
    const att: Attendance = { 
      ...a, 
      id: this.counters.attendance++, 
      checkIn: a.checkIn ?? null, 
      checkOut: a.checkOut ?? null, 
      hoursWorked: a.hoursWorked ?? null,
      status: a.status ?? 'present'
    };
    this.attendanceRecords.set(att.id, att);
    return att;
  }
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance> {
    const a = this.attendanceRecords.get(id)!;
    const updated = { ...a, ...data };
    this.attendanceRecords.set(id, updated);
    return updated;
  }

  // ── Payroll ──
  async getPayrollRuns() { return [...this.payrollRuns.values()].sort((a,b) => b.year - a.year || b.month - a.month); }
  async getPayrollRun(id: number) { return this.payrollRuns.get(id); }
  async createPayrollRun(pr: InsertPayrollRun): Promise<PayrollRun> {
    const p: PayrollRun = { 
      ...pr, 
      id: this.counters.payrollRuns++, 
      totalGross: pr.totalGross ?? null, 
      totalNet: pr.totalNet ?? null, 
      employeeCount: pr.employeeCount ?? null, 
      status: pr.status ?? 'draft',
      createdAt: new Date() 
    };
    this.payrollRuns.set(p.id, p);
    return p;
  }
  async updatePayrollRun(id: number, data: Partial<InsertPayrollRun>): Promise<PayrollRun> {
    const pr = this.payrollRuns.get(id)!;
    const updated = { ...pr, ...data };
    this.payrollRuns.set(id, updated);
    return updated;
  }
  async getSalarySlips(payrollRunId?: number) {
    const slips = [...this.salarySlips.values()];
    return payrollRunId ? slips.filter(s => s.payrollRunId === payrollRunId) : slips;
  }
  async getSalarySlipsByEmployee(employeeId: number) {
    return [...this.salarySlips.values()].filter(s => s.employeeId === employeeId);
  }
  async createSalarySlip(ss: InsertSalarySlip): Promise<SalarySlip> {
    const s: SalarySlip = { 
      ...ss, 
      id: this.counters.salarySlips++, 
      allowances: ss.allowances ?? "0", 
      deductions: ss.deductions ?? "0", 
      status: ss.status ?? 'generated',
      createdAt: new Date() 
    };
    this.salarySlips.set(s.id, s);
    return s;
  }

  // ── Job Postings ──
  async getJobPostings() { return [...this.jobPostings.values()].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()); }
  async getJobPosting(id: number) { return this.jobPostings.get(id); }
  async createJobPosting(jp: InsertJobPosting): Promise<JobPosting> {
    const j: JobPosting = { 
      ...jp, 
      id: this.counters.jobPostings++, 
      description: jp.description ?? null, 
      requirements: jp.requirements ?? null, 
      location: jp.location ?? null, 
      salaryMin: jp.salaryMin ?? null, 
      salaryMax: jp.salaryMax ?? null, 
      applicantCount: jp.applicantCount ?? 0, 
      status: jp.status ?? 'open',
      employmentType: jp.employmentType ?? 'full_time',
      departmentId: jp.departmentId ?? null,
      createdAt: new Date() 
    };
    this.jobPostings.set(j.id, j);
    return j;
  }
  async updateJobPosting(id: number, data: Partial<InsertJobPosting>): Promise<JobPosting> {
    const jp = this.jobPostings.get(id)!;
    const updated = { ...jp, ...data };
    this.jobPostings.set(id, updated);
    return updated;
  }
  async getJobApplications(jobPostingId?: number) {
    const apps = [...this.jobApplications.values()];
    return jobPostingId ? apps.filter(a => a.jobPostingId === jobPostingId) : apps;
  }
  async createJobApplication(ja: InsertJobApplication): Promise<JobApplication> {
    const j: JobApplication = { 
      ...ja, 
      id: this.counters.jobApplications++, 
      phone: ja.phone ?? null, 
      coverLetter: ja.coverLetter ?? null, 
      rating: ja.rating ?? null, 
      notes: ja.notes ?? null, 
      stage: ja.stage ?? 'applied',
      createdAt: new Date() 
    };
    this.jobApplications.set(j.id, j);
    return j;
  }
  async updateJobApplication(id: number, data: Partial<InsertJobApplication>): Promise<JobApplication> {
    const ja = this.jobApplications.get(id)!;
    const updated = { ...ja, ...data };
    this.jobApplications.set(id, updated);
    return updated;
  }

  // ── Announcements ──
  async getAnnouncements() { return [...this.announcements.values()].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()); }
  async createAnnouncement(a: InsertAnnouncement): Promise<Announcement> {
    const ann: Announcement = { 
      ...a, 
      id: this.counters.announcements++, 
      authorId: a.authorId ?? null, 
      priority: a.priority ?? 'normal',
      createdAt: new Date() 
    };
    this.announcements.set(ann.id, ann);
    return ann;
  }
}

export const storage = new MemStorage();

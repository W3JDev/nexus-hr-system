import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";

// Simple in-memory session store
const sessions: Map<string, { userId: number; expires: Date }> = new Map();

function generateToken(): string {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function getSession(req: Request): number | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const session = sessions.get(token);
  if (!session || session.expires < new Date()) return null;
  return session.userId;
}

export async function registerRoutes(httpServer: ReturnType<typeof createServer>, app: Express) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    const token = generateToken();
    sessions.set(token, { userId: user.id, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  });

  app.post("/api/auth/logout", (req, res) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) sessions.delete(auth.slice(7));
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "All fields required" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: "Email already in use" });
    const user = await storage.createUser({ email, password, name, role: "employee" });
    const token = generateToken();
    sessions.set(token, { userId: user.id, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  });

  // ── Employees ───────────────────────────────────────────────────────────────
  app.get("/api/employees", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const emps = await storage.getEmployees();
    const depts = await storage.getDepartments();
    const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]));
    const result = emps.map(e => ({ ...e, departmentName: e.departmentId ? deptMap[e.departmentId] : null }));
    res.json(result);
  });

  app.get("/api/employees/:id", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const emp = await storage.getEmployee(parseInt(req.params.id));
    if (!emp) return res.status(404).json({ error: "Not found" });
    const depts = await storage.getDepartments();
    const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]));
    res.json({ ...emp, departmentName: emp.departmentId ? deptMap[emp.departmentId] : null });
  });

  app.post("/api/employees", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const emp = await storage.createEmployee(req.body);
    res.json(emp);
  });

  app.patch("/api/employees/:id", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const emp = await storage.updateEmployee(parseInt(req.params.id), req.body);
    res.json(emp);
  });

  app.delete("/api/employees/:id", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    await storage.deleteEmployee(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // ── Departments ─────────────────────────────────────────────────────────────
  app.get("/api/departments", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const depts = await storage.getDepartments();
    const emps = await storage.getEmployees();
    const result = depts.map(d => ({
      ...d,
      employeeCount: emps.filter(e => e.departmentId === d.id).length
    }));
    res.json(result);
  });

  app.post("/api/departments", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const dept = await storage.createDepartment(req.body);
    res.json(dept);
  });

  // ── Leave Types ──────────────────────────────────────────────────────────────
  app.get("/api/leave-types", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    res.json(await storage.getLeaveTypes());
  });

  // ── Leave Applications ───────────────────────────────────────────────────────
  app.get("/api/leave-applications", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const las = await storage.getLeaveApplications();
    const emps = await storage.getEmployees();
    const lts = await storage.getLeaveTypes();
    const empMap = Object.fromEntries(emps.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
    const ltMap = Object.fromEntries(lts.map(lt => [lt.id, lt.name]));
    const result = las.map(la => ({
      ...la,
      employeeName: empMap[la.employeeId] || "Unknown",
      leaveTypeName: ltMap[la.leaveTypeId] || "Unknown",
    }));
    res.json(result);
  });

  app.post("/api/leave-applications", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const la = await storage.createLeaveApplication(req.body);
    res.json(la);
  });

  app.patch("/api/leave-applications/:id", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const la = await storage.updateLeaveApplication(parseInt(req.params.id), req.body);
    res.json(la);
  });

  // ── Attendance ───────────────────────────────────────────────────────────────
  app.get("/api/attendance", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const att = await storage.getAttendance();
    const emps = await storage.getEmployees();
    const empMap = Object.fromEntries(emps.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
    const result = att.map(a => ({ ...a, employeeName: empMap[a.employeeId] || "Unknown" }));
    res.json(result.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });

  app.get("/api/attendance/today", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const att = await storage.getTodayAttendance();
    const emps = await storage.getEmployees();
    const empMap = Object.fromEntries(emps.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
    res.json(att.map(a => ({ ...a, employeeName: empMap[a.employeeId] || "Unknown" })));
  });

  app.post("/api/attendance", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const a = await storage.createAttendance(req.body);
    res.json(a);
  });

  // ── Payroll ───────────────────────────────────────────────────────────────────
  app.get("/api/payroll/runs", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    res.json(await storage.getPayrollRuns());
  });

  app.get("/api/payroll/runs/:id/slips", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const slips = await storage.getSalarySlips(parseInt(req.params.id));
    const emps = await storage.getEmployees();
    const empMap = Object.fromEntries(emps.map(e => [e.id, { name: `${e.firstName} ${e.lastName}`, designation: e.designation, employeeId: e.employeeId }]));
    res.json(slips.map(s => ({ ...s, employee: empMap[s.employeeId] })));
  });

  app.post("/api/payroll/runs", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const pr = await storage.createPayrollRun(req.body);
    res.json(pr);
  });

  app.patch("/api/payroll/runs/:id", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const pr = await storage.updatePayrollRun(parseInt(req.params.id), req.body);
    res.json(pr);
  });

  app.get("/api/payroll/my-slips", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const emp = await storage.getEmployeeByUserId(userId);
    if (!emp) return res.json([]);
    const slips = await storage.getSalarySlipsByEmployee(emp.id);
    const runs = await storage.getPayrollRuns();
    const runMap = Object.fromEntries(runs.map(r => [r.id, r]));
    res.json(slips.map(s => ({ ...s, payrollRun: runMap[s.payrollRunId] })));
  });

  // ── Recruitment ───────────────────────────────────────────────────────────────
  app.get("/api/jobs", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const jobs = await storage.getJobPostings();
    const depts = await storage.getDepartments();
    const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]));
    res.json(jobs.map(j => ({ ...j, departmentName: j.departmentId ? deptMap[j.departmentId] : null })));
  });

  app.post("/api/jobs", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const job = await storage.createJobPosting(req.body);
    res.json(job);
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const job = await storage.updateJobPosting(parseInt(req.params.id), req.body);
    res.json(job);
  });

  app.get("/api/jobs/:id/applications", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const apps = await storage.getJobApplications(parseInt(req.params.id));
    res.json(apps);
  });

  app.get("/api/applications", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const apps = await storage.getJobApplications();
    const jobs = await storage.getJobPostings();
    const jobMap = Object.fromEntries(jobs.map(j => [j.id, j.title]));
    res.json(apps.map(a => ({ ...a, jobTitle: jobMap[a.jobPostingId] || "Unknown" })));
  });

  app.post("/api/jobs/:id/applications", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const ja = await storage.createJobApplication({ ...req.body, jobPostingId: parseInt(req.params.id) });
    res.json(ja);
  });

  app.patch("/api/applications/:id", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const ja = await storage.updateJobApplication(parseInt(req.params.id), req.body);
    res.json(ja);
  });

  // ── Announcements ─────────────────────────────────────────────────────────────
  app.get("/api/announcements", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    res.json(await storage.getAnnouncements());
  });

  app.post("/api/announcements", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const ann = await storage.createAnnouncement({ ...req.body, authorId: userId });
    res.json(ann);
  });

  // ── Dashboard Stats ───────────────────────────────────────────────────────────
  app.get("/api/dashboard/stats", async (req, res) => {
    const userId = getSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [emps, las, todayAtt, jobs] = await Promise.all([
      storage.getEmployees(),
      storage.getLeaveApplications(),
      storage.getTodayAttendance(),
      storage.getJobPostings(),
    ]);
    const activeEmps = emps.filter(e => e.status === "active").length;
    const pendingLeaves = las.filter(la => la.status === "pending").length;
    const presentToday = todayAtt.length;
    const openJobs = jobs.filter(j => j.status === "open").length;
    const totalPayroll = emps.reduce((sum, e) => sum + parseFloat(e.salary || "0"), 0);

    // Monthly headcount data (simulate)
    const monthlyData = [
      { month: "Sep", count: 6 }, { month: "Oct", count: 7 }, { month: "Nov", count: 7 },
      { month: "Dec", count: 8 }, { month: "Jan", count: 9 }, { month: "Feb", count: 10 },
      { month: "Mar", count: activeEmps },
    ];

    // Department breakdown
    const depts = await storage.getDepartments();
    const deptData = depts.map(d => ({
      name: d.name,
      count: emps.filter(e => e.departmentId === d.id).length
    })).filter(d => d.count > 0);

    res.json({
      activeEmployees: activeEmps,
      totalEmployees: emps.length,
      pendingLeaves,
      presentToday,
      openJobs,
      totalMonthlyPayroll: totalPayroll.toFixed(0),
      monthlyData,
      deptData,
      newHires: emps.filter(e => {
        const joined = new Date(e.dateJoined);
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joined > thirtyDaysAgo;
      }).length,
    });
  });

  return httpServer;
}

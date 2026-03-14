import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, Clock, Briefcase, TrendingUp, DollarSign, UserPlus, AlertCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { apiRequest } from "../lib/queryClient";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, sub, color = "primary", trend }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; trend?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/15 border-primary/20",
    emerald: "text-emerald-400 bg-emerald-400/15 border-emerald-400/20",
    amber: "text-amber-400 bg-amber-400/15 border-amber-400/20",
    purple: "text-purple-400 bg-purple-400/15 border-purple-400/20",
    sky: "text-sky-400 bg-sky-400/15 border-sky-400/20",
    rose: "text-rose-400 bg-rose-400/15 border-rose-400/20",
  };
  return (
    <div className="stat-card animate-fade-in card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/70 mt-1">{sub}</div>}
    </div>
  );
}

const CHART_COLORS = ["#20808D", "#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 font-medium text-foreground">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => apiRequest("GET", "/api/dashboard/stats"),
  });

  const { data: leaveApps } = useQuery({ queryKey: ["/api/leave-applications"] });
  const { data: announcements } = useQuery({ queryKey: ["/api/announcements"] });
  const { data: employees } = useQuery({ queryKey: ["/api/employees"] });

  const pending = (leaveApps as any[])?.filter((la: any) => la.status === "pending") || [];
  const recentEmps = (employees as any[])?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="animate-pulse space-y-3">
                <div className="w-9 h-9 bg-muted rounded-lg" />
                <div className="w-16 h-7 bg-muted rounded" />
                <div className="w-24 h-4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const monthlyData = stats?.monthlyData || [];
  const deptData = stats?.deptData || [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{format(new Date(), "EEEE, MMMM d, yyyy")} · Overview of your organization</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard icon={Users} label="Active Employees" value={stats?.activeEmployees || 0} sub={`${stats?.totalEmployees || 0} total`} color="primary" trend="+2 this month" />
        <StatCard icon={Calendar} label="Pending Leaves" value={stats?.pendingLeaves || 0} sub="Awaiting approval" color="amber" />
        <StatCard icon={Clock} label="Present Today" value={stats?.presentToday || 0} sub={`of ${stats?.activeEmployees || 0} active`} color="emerald" />
        <StatCard icon={Briefcase} label="Open Positions" value={stats?.openJobs || 0} sub="Active job postings" color="purple" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard icon={DollarSign} label="Monthly Payroll" value={`RM ${Number(stats?.totalMonthlyPayroll || 0).toLocaleString()}`} sub="Gross total" color="sky" />
        <StatCard icon={UserPlus} label="New Hires" value={stats?.newHires || 0} sub="Last 30 days" color="emerald" />
        <StatCard icon={TrendingUp} label="Departments" value={deptData.length} sub="Active units" color="primary" />
        <StatCard icon={AlertCircle} label="On Leave" value={(employees as any[])?.filter((e:any) => e.status === "on_leave").length || 0} sub="Currently away" color="rose" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Headcount Trend */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold text-foreground">Headcount Growth</div>
              <div className="text-xs text-muted-foreground mt-0.5">Employees over time</div>
            </div>
            <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Last 7 months</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20808D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#20808D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#20808D" strokeWidth={2} fill="url(#headcountGrad)" dot={{ fill: "#20808D", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Breakdown */}
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold text-foreground mb-1">By Department</div>
          <div className="text-xs text-muted-foreground mb-5">Headcount distribution</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={deptData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} strokeWidth={0}>
                {deptData.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {deptData.slice(0, 4).map((d: any, i: number) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Leave Requests */}
        <div className="lg:col-span-1 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-foreground">Pending Approvals</div>
            <span className="badge-pill bg-amber-400/15 text-amber-400">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">✓</div>
              <div className="text-sm text-muted-foreground">All caught up!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((la: any) => (
                <div key={la.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-xs font-semibold text-amber-400">
                    {la.employeeName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{la.employeeName}</div>
                    <div className="text-xs text-muted-foreground">{la.leaveTypeName} · {la.totalDays}d</div>
                  </div>
                  <span className="badge-pill status-pending text-[10px]">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-foreground">Announcements</div>
            <span className="text-xs text-muted-foreground">Latest updates</span>
          </div>
          <div className="space-y-3">
            {(announcements as any[])?.map((ann: any) => (
              <div key={ann.id} className="flex gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className={`w-1.5 rounded-full flex-shrink-0 ${ann.priority === "high" ? "bg-amber-400" : ann.priority === "urgent" ? "bg-red-400" : "bg-primary"}`} />
                <div>
                  <div className="text-sm font-medium text-foreground">{ann.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1.5">{format(new Date(ann.createdAt), "MMM d, yyyy")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

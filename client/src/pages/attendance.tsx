import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AttendancePage() {
  const [search, setSearch] = useState("");

  const { data: attendance = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/attendance"],
    queryFn: () => apiRequest("GET", "/api/attendance"),
  });

  const { data: todayAttendance = [] } = useQuery<any[]>({
    queryKey: ["/api/attendance/today"],
    queryFn: () => apiRequest("GET", "/api/attendance/today"),
  });

  const { data: employees = [] } = useQuery<any[]>({ queryKey: ["/api/employees"] });

  const activeCount = employees.filter((e: any) => e.status === "active").length;
  const presentToday = todayAttendance.length;
  const absentToday = activeCount - presentToday;

  // Weekly data
  const weeklyData = (() => {
    const days: Record<string, { day: string; present: number; avg: number }> = {};
    attendance.forEach((a: any) => {
      const d = new Date(a.date);
      const day = d.toLocaleDateString("en-US", { weekday: "short" });
      if (!days[a.date]) days[a.date] = { day, present: 0, avg: 0 };
      days[a.date].present++;
    });
    const byDay: Record<string, number[]> = {};
    Object.values(days).forEach(d => {
      if (!byDay[d.day]) byDay[d.day] = [];
      byDay[d.day].push(d.present);
    });
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return order.map(day => ({
      day,
      present: Math.round((byDay[day] || [0]).reduce((a, b) => a + b, 0) / Math.max((byDay[day] || [1]).length, 1)),
    }));
  })();

  const filtered = attendance.filter((a: any) =>
    a.employeeName?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
        <div className="text-muted-foreground mb-1">{label}</div>
        <div className="font-medium text-foreground">{payload[0].value} present</div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Track employee check-in and work hours</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Present Today", value: presentToday, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/15" },
          { label: "Absent Today", value: absentToday, icon: XCircle, color: "text-red-400", bg: "bg-red-400/15" },
          { label: "Attendance Rate", value: activeCount ? `${Math.round((presentToday / activeCount) * 100)}%` : "0%", icon: Clock, color: "text-primary", bg: "bg-primary/15" },
          { label: "Total Records", value: attendance.length, icon: Clock, color: "text-purple-400", bg: "bg-purple-400/15" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <div className="text-sm font-semibold text-foreground mb-1">Weekly Attendance Average</div>
        <div className="text-xs text-muted-foreground mb-5">Average employees present per weekday</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-sm font-semibold text-foreground">Attendance Records</div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-sm"
              data-testid="input-search-attendance"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <table className="data-table" data-testid="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id} data-testid={`row-attendance-${a.id}`}>
                  <td className="font-medium text-foreground">{a.employeeName}</td>
                  <td className="text-muted-foreground">{a.date}</td>
                  <td className="text-foreground font-mono text-xs">
                    {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="text-foreground font-mono text-xs">
                    {a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="text-muted-foreground font-mono text-xs">{a.hoursWorked ? `${a.hoursWorked}h` : "—"}</td>
                  <td><span className="badge-pill status-active text-[10px]">{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

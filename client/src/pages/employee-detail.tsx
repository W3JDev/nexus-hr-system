import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Building2, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "../lib/queryClient";

interface Props { id: number; }

export default function EmployeeDetailPage({ id }: Props) {
  const { data: emp, isLoading } = useQuery({
    queryKey: ["/api/employees", String(id)],
    queryFn: () => apiRequest("GET", `/api/employees/${id}`),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["/api/attendance"],
    queryFn: () => apiRequest("GET", "/api/attendance"),
    select: (data: any[]) => data.filter(a => a.employeeId === id).slice(0, 7),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading...</div></div>;
  if (!emp) return <div className="text-center py-12 text-muted-foreground">Employee not found</div>;

  const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
  const statusColors: Record<string, string> = {
    active: "status-active", on_leave: "status-info", terminated: "status-inactive", probation: "status-pending"
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employees" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Link>
      </div>

      {/* Profile Header */}
      <div className="rounded-xl border bg-card p-6 mb-4">
        <div className="flex items-start gap-5">
          <Avatar className="w-16 h-16 avatar-ring">
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">{emp.firstName} {emp.lastName}</h1>
                <div className="text-muted-foreground text-sm mt-0.5">{emp.designation}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">{emp.employeeId}</span>
                  <span className={`badge-pill ${statusColors[emp.status] || "status-info"} text-xs`}>
                    {emp.status?.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{emp.employmentType?.replace("_", " ")}</span>
                </div>
              </div>
              {emp.salary && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">RM {Number(emp.salary).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">/ month</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold text-foreground mb-4">Contact & Location</div>
          <div className="space-y-3">
            {[
              { icon: Mail, label: "Email", value: emp.email },
              { icon: Phone, label: "Phone", value: emp.phone || "—" },
              { icon: MapPin, label: "City", value: emp.city || "—" },
              { icon: MapPin, label: "Country", value: emp.country || "—" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm text-foreground">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employment Info */}
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold text-foreground mb-4">Employment Details</div>
          <div className="space-y-3">
            {[
              { icon: Briefcase, label: "Designation", value: emp.designation },
              { icon: Building2, label: "Department", value: emp.departmentName || "—" },
              { icon: Calendar, label: "Date Joined", value: emp.dateJoined },
              { icon: Calendar, label: "Date of Birth", value: emp.dateOfBirth || "—" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm text-foreground">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        {emp.bio && (
          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold text-foreground mb-3">Bio</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{emp.bio}</p>
          </div>
        )}

        {/* Recent Attendance */}
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold text-foreground mb-4">Recent Attendance</div>
          {attendance.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No records</div>
          ) : (
            <div className="space-y-2">
              {attendance.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="text-xs text-muted-foreground">{a.date}</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-foreground">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                    <span className="badge-pill status-active text-[10px]">{a.hoursWorked}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

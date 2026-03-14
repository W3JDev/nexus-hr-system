import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Users, Building2, Eye } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  active: "status-active",
  on_leave: "status-info",
  terminated: "status-inactive",
  probation: "status-pending",
};

const statusLabels: Record<string, string> = {
  active: "Active", on_leave: "On Leave", terminated: "Terminated", probation: "Probation"
};

function AddEmployeeDialog({ open, onClose, departments }: { open: boolean; onClose: () => void; departments: any[] }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    employeeId: `EMP-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`,
    firstName: "", lastName: "", email: "", designation: "",
    departmentId: "", employmentType: "full_time", dateJoined: "",
    salary: "", phone: "", status: "active"
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee added", description: "New employee record created." });
      onClose();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...form, departmentId: form.departmentId ? parseInt(form.departmentId) : null, salary: form.salary || null });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "firstName", label: "First Name", required: true },
              { key: "lastName", label: "Last Name", required: true },
              { key: "email", label: "Email", type: "email", required: true },
              { key: "phone", label: "Phone" },
              { key: "designation", label: "Job Title", required: true },
              { key: "salary", label: "Monthly Salary (RM)" },
              { key: "dateJoined", label: "Date Joined", type: "date", required: true },
              { key: "employeeId", label: "Employee ID", required: true },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                <input
                  type={field.type || "text"}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="input-field text-xs"
                  required={field.required}
                  data-testid={`input-${field.key}`}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
              <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="input-field text-xs">
                <option value="">Select department</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Employment Type</label>
              <select value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))} className="input-field text-xs">
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending} data-testid="button-add-employee">
              {mutation.isPending ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/employees"] });
  const { data: departments = [] } = useQuery<any[]>({ queryKey: ["/api/departments"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee removed" });
    },
  });

  const filtered = employees.filter((e: any) => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.email} ${e.designation}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || String(e.departmentId) === deptFilter;
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="max-w-7xl">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} total · {employees.filter((e:any) => e.status === "active").length} active</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary" data-testid="button-add-new">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: employees.length, color: "text-foreground" },
          { label: "Active", value: employees.filter((e:any) => e.status === "active").length, color: "text-emerald-400" },
          { label: "On Leave", value: employees.filter((e:any) => e.status === "on_leave").length, color: "text-sky-400" },
          { label: "Probation", value: employees.filter((e:any) => e.status === "probation").length, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card px-4 py-3">
            <div className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            data-testid="input-search"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field w-44 text-sm" data-testid="filter-department">
          <option value="">All Departments</option>
          {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-36 text-sm" data-testid="filter-status">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="probation">Probation</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Employee Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <table className="data-table" data-testid="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Type</th>
                <th>Date Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">No employees found</td>
                </tr>
              ) : (
                filtered.map((emp: any) => (
                  <tr key={emp.id} data-testid={`row-employee-${emp.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground text-sm">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-muted-foreground">{emp.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {emp.departmentName || "—"}
                      </div>
                    </td>
                    <td className="text-muted-foreground">{emp.designation}</td>
                    <td>
                      <span className="text-xs capitalize text-muted-foreground">
                        {emp.employmentType?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-xs">{emp.dateJoined}</td>
                    <td>
                      <span className={`badge-pill ${statusColors[emp.status] || "status-info"}`}>
                        {statusLabels[emp.status] || emp.status}
                      </span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors" data-testid={`action-employee-${emp.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${emp.id}`} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="w-4 h-4" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(emp.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <AddEmployeeDialog open={showAdd} onClose={() => setShowAdd(false)} departments={departments} />
    </div>
  );
}

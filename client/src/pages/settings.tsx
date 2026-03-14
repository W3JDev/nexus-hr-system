import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Building2, Shield, Bell, Palette, Save } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: departments = [] } = useQuery<any[]>({ queryKey: ["/api/departments"] });
  const [newDept, setNewDept] = useState("");

  const [notifications, setNotifications] = useState({
    leaveApproval: true, attendanceAlert: false, payrollReminder: true, newHire: true
  });

  const deptMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/departments", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department added" });
      setNewDept("");
    },
  });

  return (
    <div className="max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your HRMS platform</p>
      </div>

      <Tabs defaultValue="org">
        <TabsList className="mb-6">
          <TabsTrigger value="org"><Building2 className="w-3.5 h-3.5 mr-1.5" />Organization</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-3.5 h-3.5 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-3.5 h-3.5 mr-1.5" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="space-y-5">
          {/* Company Info */}
          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold text-foreground mb-4">Company Information</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Company Name", value: "Nexus Holdings Sdn Bhd" },
                { label: "Registration No.", value: "202301234567" },
                { label: "Industry", value: "Technology" },
                { label: "Country", value: "Malaysia" },
                { label: "HR Contact Email", value: "hr@nexus.io" },
                { label: "Payroll Currency", value: "MYR (RM)" },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                  <input defaultValue={f.value} className="input-field text-sm" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => toast({ title: "Company info saved" })} className="btn-primary">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>

          {/* Departments */}
          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold text-foreground mb-4">Departments</div>
            <div className="space-y-2 mb-4">
              {departments.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/40">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{d.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{d.employeeCount} employees</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                placeholder="New department name..."
                className="input-field flex-1 text-sm"
                data-testid="input-new-department"
                onKeyDown={e => e.key === "Enter" && newDept && deptMutation.mutate(newDept)}
              />
              <button
                onClick={() => newDept && deptMutation.mutate(newDept)}
                className="btn-primary"
                disabled={!newDept || deptMutation.isPending}
                data-testid="button-add-department"
              >
                Add
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold text-foreground mb-4">Notification Preferences</div>
            <div className="space-y-4">
              {[
                { key: "leaveApproval", label: "Leave Approval Alerts", desc: "Get notified when leave requests need approval" },
                { key: "attendanceAlert", label: "Attendance Alerts", desc: "Receive alerts for late check-ins or absences" },
                { key: "payrollReminder", label: "Payroll Reminders", desc: "Reminders before payroll processing dates" },
                { key: "newHire", label: "New Hire Notifications", desc: "Notify when new employees are onboarded" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                  <Switch
                    checked={(notifications as any)[item.key]}
                    onCheckedChange={v => setNotifications(n => ({ ...n, [item.key]: v }))}
                    data-testid={`toggle-${item.key}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => toast({ title: "Notification preferences saved" })} className="btn-primary">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold text-foreground mb-4">Theme & Appearance</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Dark", desc: "Dark slate theme (default)", active: true },
                { label: "Light", desc: "Clean light theme", active: false },
              ].map(t => (
                <div key={t.label} className={`rounded-lg border p-4 cursor-pointer transition-all ${t.active ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <div className="text-sm font-medium text-foreground">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="text-xs font-medium text-muted-foreground mb-2">Language</div>
              <select className="input-field w-48 text-sm">
                <option>English (US)</option>
                <option>Bahasa Malaysia</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold text-foreground mb-3">About</div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Platform</span><span className="text-foreground">Nexus HR v1.0.0</span></div>
              <div className="flex justify-between"><span>Build</span><span className="text-foreground font-mono">2025.03.15</span></div>
              <div className="flex justify-between"><span>License</span><span className="text-foreground">Enterprise</span></div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

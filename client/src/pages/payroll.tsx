import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, DollarSign, CheckCircle, Play, FileText } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function NewPayrollDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payroll/runs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/runs"] });
      toast({ title: "Payroll run created" });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader><DialogTitle>New Payroll Run</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="input-field text-sm">
                {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={() => mutation.mutate({ month, year, status: "draft", employeeCount: 10 })} className="btn-primary" disabled={mutation.isPending}>
              Create Payroll Run
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PayrollPage() {
  const [showNew, setShowNew] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const { toast } = useToast();

  const { data: runs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/payroll/runs"] });
  const { data: slips = [], isLoading: loadingSlips } = useQuery<any[]>({
    queryKey: ["/api/payroll/runs", String(selectedRun?.id), "slips"],
    queryFn: () => selectedRun ? apiRequest("GET", `/api/payroll/runs/${selectedRun.id}/slips`) : Promise.resolve([]),
    enabled: !!selectedRun,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/payroll/runs/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/runs"] });
      toast({ title: "Payroll run updated" });
    },
  });

  const statusColors: Record<string, string> = {
    draft: "status-pending", processing: "status-info", completed: "status-active", paid: "status-active"
  };

  return (
    <div className="max-w-7xl">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">{runs.length} payroll runs · salary management</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary" data-testid="button-new-payroll">
          <Plus className="w-4 h-4" /> New Payroll Run
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Runs", value: runs.length, icon: FileText, color: "text-primary" },
          { label: "Paid", value: runs.filter((r: any) => r.status === "paid").length, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Pending", value: runs.filter((r: any) => r.status !== "paid").length, icon: DollarSign, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payroll Runs List */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-semibold text-foreground">Payroll Runs</div>
          </div>
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="divide-y divide-border/50">
              {runs.map((run: any) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 ${selectedRun?.id === run.id ? "bg-secondary/70 border-l-2 border-primary" : ""}`}
                  data-testid={`payroll-run-${run.id}`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{MONTHS[run.month - 1]} {run.year}</div>
                    <div className="text-xs text-muted-foreground">{run.employeeCount} employees</div>
                  </div>
                  <span className={`badge-pill ${statusColors[run.status] || "status-info"} text-[10px]`}>{run.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Salary Slips */}
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          {!selectedRun ? (
            <div className="flex items-center justify-center h-full py-16">
              <div className="text-center">
                <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <div className="text-sm text-muted-foreground">Select a payroll run to view salary slips</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">{MONTHS[selectedRun.month - 1]} {selectedRun.year} Payroll</div>
                  <div className="text-xs text-muted-foreground">{slips.length} salary slips</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge-pill ${statusColors[selectedRun.status] || "status-info"}`}>{selectedRun.status}</span>
                  {selectedRun.status !== "paid" && (
                    <button
                      onClick={() => updateMutation.mutate({ id: selectedRun.id, status: "paid" })}
                      className="btn-primary py-1.5 text-xs"
                      data-testid="button-mark-paid"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table" data-testid="salary-slips-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Basic</th>
                      <th>Allowances</th>
                      <th>Gross</th>
                      <th>Deductions</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSlips ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                    ) : slips.map((s: any) => (
                      <tr key={s.id} data-testid={`row-slip-${s.id}`}>
                        <td>
                          <div className="font-medium text-foreground text-sm">{s.employee?.name}</div>
                          <div className="text-[10px] text-muted-foreground">{s.employee?.designation}</div>
                        </td>
                        <td className="font-mono text-xs text-muted-foreground">RM {Number(s.basicSalary).toLocaleString()}</td>
                        <td className="font-mono text-xs text-emerald-400">+{Number(s.allowances).toLocaleString()}</td>
                        <td className="font-mono text-xs font-semibold text-foreground">RM {Number(s.grossSalary).toLocaleString()}</td>
                        <td className="font-mono text-xs text-red-400">-{Number(s.deductions).toLocaleString()}</td>
                        <td className="font-mono text-sm font-bold text-primary">RM {Number(s.netSalary).toLocaleString()}</td>
                        <td><span className="badge-pill status-active text-[10px]">{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {slips.length > 0 && (
                <div className="flex justify-end gap-8 px-5 py-3 border-t border-border bg-secondary/30 text-xs">
                  <div className="text-muted-foreground">Total Gross: <span className="font-bold text-foreground">RM {slips.reduce((s: number, sl: any) => s + Number(sl.grossSalary), 0).toLocaleString()}</span></div>
                  <div className="text-muted-foreground">Total Net: <span className="font-bold text-primary">RM {slips.reduce((s: number, sl: any) => s + Number(sl.netSalary), 0).toLocaleString()}</span></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <NewPayrollDialog open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}

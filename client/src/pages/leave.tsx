import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Check, X, Calendar, Clock } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ApplyLeaveDialog({ open, onClose, employees, leaveTypes }: any) {
  const { toast } = useToast();
  const [form, setForm] = useState({ employeeId: "", leaveTypeId: "", fromDate: "", toDate: "", reason: "" });

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/leave-applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      toast({ title: "Leave request submitted" });
      onClose();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const totalDays = form.fromDate && form.toDate
    ? Math.max(1, Math.ceil((new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...form, employeeId: parseInt(form.employeeId), leaveTypeId: parseInt(form.leaveTypeId), totalDays, status: "pending" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Employee</label>
            <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className="input-field text-sm" required>
              <option value="">Select employee</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Leave Type</label>
            <select value={form.leaveTypeId} onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} className="input-field text-sm" required>
              <option value="">Select type</option>
              {leaveTypes.map((lt: any) => <option key={lt.id} value={lt.id}>{lt.name} ({lt.daysAllowed} days)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">From Date</label>
              <input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} className="input-field text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">To Date</label>
              <input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} className="input-field text-sm" required />
            </div>
          </div>
          {totalDays > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{totalDays} day{totalDays > 1 ? "s" : ""}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Reason (optional)</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="input-field text-sm h-20 resize-none" placeholder="Provide a reason..." />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending} data-testid="button-submit-leave">
              {mutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LeavePage() {
  const [showApply, setShowApply] = useState(false);
  const { toast } = useToast();

  const { data: leaveApps = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/leave-applications"] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ["/api/employees"] });
  const { data: leaveTypes = [] } = useQuery<any[]>({ queryKey: ["/api/leave-types"] });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/leave-applications/${id}`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      toast({ title: `Leave request ${status}` });
    },
  });

  const statusColors: Record<string, string> = {
    pending: "status-pending", approved: "status-active", rejected: "status-inactive", cancelled: "status-info"
  };

  const pending = leaveApps.filter((la: any) => la.status === "pending");
  const all = leaveApps;

  const LeaveCard = ({ la }: { la: any }) => (
    <div className="rounded-xl border bg-card p-4 card-hover" data-testid={`leave-card-${la.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {la.employeeName?.[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{la.employeeName}</div>
            <div className="text-xs text-muted-foreground">{la.leaveTypeName}</div>
          </div>
        </div>
        <span className={`badge-pill ${statusColors[la.status]}`}>{la.status}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {la.fromDate} → {la.toDate}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {la.totalDays} day{la.totalDays > 1 ? "s" : ""}
        </div>
      </div>

      {la.reason && <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 mb-3 line-clamp-2">{la.reason}</div>}

      {la.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => updateMutation.mutate({ id: la.id, status: "approved" })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
            data-testid={`button-approve-${la.id}`}
          >
            <Check className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={() => updateMutation.mutate({ id: la.id, status: "rejected" })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-medium hover:bg-red-500/25 transition-colors"
            data-testid={`button-reject-${la.id}`}
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{pending.length} pending approval · {leaveTypes.length} leave types</p>
        </div>
        <button onClick={() => setShowApply(true)} className="btn-primary" data-testid="button-apply-leave">
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Leave Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {leaveTypes.map((lt: any) => (
          <div key={lt.id} className="rounded-lg border bg-card px-4 py-3">
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: lt.color }} />
            <div className="text-sm font-semibold text-foreground">{lt.daysAllowed}d</div>
            <div className="text-xs text-muted-foreground truncate">{lt.name}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-5">
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Requests ({all.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pending.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Check className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
              <div className="font-medium text-foreground">All caught up!</div>
              <div className="text-sm mt-1">No pending leave requests</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((la: any) => <LeaveCard key={la.id} la={la} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? [...Array(3)].map((_, i) => <div key={i} className="rounded-xl border bg-card p-4 h-36 animate-pulse" />)
              : all.map((la: any) => <LeaveCard key={la.id} la={la} />)
            }
          </div>
        </TabsContent>
      </Tabs>

      <ApplyLeaveDialog open={showApply} onClose={() => setShowApply(false)} employees={employees} leaveTypes={leaveTypes} />
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Briefcase, Users, MapPin, DollarSign, ChevronRight, Star, Search } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];
const stageColors: Record<string, string> = {
  applied: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  screening: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  interview: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  offer: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  hired: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  rejected: "bg-red-500/15 text-red-400 border-red-500/25",
};

function NewJobDialog({ open, onClose, departments }: any) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "", departmentId: "", description: "", requirements: "",
    location: "", employmentType: "full_time", salaryMin: "", salaryMax: ""
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job posting created" });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...form, departmentId: form.departmentId ? parseInt(form.departmentId) : null, status: "open" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader><DialogTitle>Post a Job</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Job Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" required data-testid="input-job-title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
              <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="input-field text-sm">
                <option value="">Select...</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input-field text-sm" placeholder="KL / Remote" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Min Salary (RM)</label>
              <input type="number" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Max Salary (RM)</label>
              <input type="number" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field h-20 resize-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Requirements</label>
            <textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} className="input-field h-20 resize-none text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RecruitmentPage() {
  const [showNew, setShowNew] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: jobs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/jobs"] });
  const { data: departments = [] } = useQuery<any[]>({ queryKey: ["/api/departments"] });
  const { data: applications = [] } = useQuery<any[]>({ queryKey: ["/api/applications"] });

  const { data: jobApps = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs", String(selectedJob?.id), "applications"],
    queryFn: () => selectedJob ? apiRequest("GET", `/api/jobs/${selectedJob.id}/applications`) : Promise.resolve([]),
    enabled: !!selectedJob,
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) =>
      apiRequest("PATCH", `/api/applications/${id}`, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", String(selectedJob?.id), "applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Stage updated" });
    },
  });

  const filteredJobs = jobs.filter((j: any) =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalApplicants = applications.length;
  const hired = applications.filter((a: any) => a.stage === "hired").length;
  const inInterview = applications.filter((a: any) => a.stage === "interview").length;

  return (
    <div className="max-w-7xl">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Recruitment</h1>
          <p className="page-subtitle">{jobs.filter((j: any) => j.status === "open").length} open positions · {totalApplicants} total applicants</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary" data-testid="button-post-job">
          <Plus className="w-4 h-4" /> Post Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Applicants", value: totalApplicants, color: "text-primary" },
          { label: "In Interview", value: inInterview, color: "text-purple-400" },
          { label: "Hired", value: hired, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card px-5 py-4">
            <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Job Listings */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="rounded-xl border bg-card p-4 h-28 animate-pulse" />)
            ) : filteredJobs.map((job: any) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`rounded-xl border bg-card p-4 cursor-pointer transition-all hover:border-primary/30 ${selectedJob?.id === job.id ? "border-primary/40 bg-secondary/30" : ""}`}
                data-testid={`job-card-${job.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-foreground text-sm">{job.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{job.departmentName}</div>
                  </div>
                  <span className={`badge-pill text-[10px] ${job.status === "open" ? "status-active" : "status-inactive"}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {job.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</div>}
                  {job.salaryMin && <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" />RM {Number(job.salaryMin).toLocaleString()} – {Number(job.salaryMax).toLocaleString()}</div>}
                  <div className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicantCount || 0} applicants</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applications Panel */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {!selectedJob ? (
            <div className="flex items-center justify-center h-full py-20">
              <div className="text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <div className="text-sm text-muted-foreground">Select a job to view applicants</div>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-border">
                <div className="font-semibold text-foreground">{selectedJob.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{jobApps.length} applicants</div>
              </div>
              <div className="p-4 space-y-3">
                {jobApps.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No applications yet</div>
                ) : jobApps.map((app: any) => (
                  <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-border transition-colors" data-testid={`app-card-${app.id}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {app.candidateName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{app.candidateName}</div>
                      <div className="text-xs text-muted-foreground">{app.candidateEmail}</div>
                    </div>
                    {app.rating && (
                      <div className="flex items-center gap-0.5">
                        {[...Array(app.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                      </div>
                    )}
                    <select
                      value={app.stage}
                      onChange={e => stageMutation.mutate({ id: app.id, stage: e.target.value })}
                      className="text-xs border border-border/50 bg-background rounded-lg px-2 py-1 text-muted-foreground"
                      data-testid={`select-stage-${app.id}`}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <NewJobDialog open={showNew} onClose={() => setShowNew(false)} departments={departments} />
    </div>
  );
}

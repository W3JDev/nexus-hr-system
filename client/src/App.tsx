import { Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import AuthPage from "./pages/auth";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/dashboard";
import EmployeesPage from "./pages/employees";
import EmployeeDetailPage from "./pages/employee-detail";
import LeavePage from "./pages/leave";
import AttendancePage from "./pages/attendance";
import PayrollPage from "./pages/payroll";
import RecruitmentPage from "./pages/recruitment";
import SettingsPage from "./pages/settings";
import { getCurrentUser } from "./lib/auth";
import { User } from "../../shared/schema";

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useHashLocation();

  useEffect(() => {
    // Only try to get current user if we have a token
    const token = (window as any).__hrms_token__;
    if (!token) { setLoading(false); return; }
    getCurrentUser()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-6 h-6 text-primary" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="currentColor" opacity="0.9"/>
              <rect x="18" y="4" width="10" height="10" rx="2" fill="currentColor" opacity="0.6"/>
              <rect x="4" y="18" width="10" height="10" rx="2" fill="currentColor" opacity="0.6"/>
              <rect x="18" y="18" width="10" height="10" rx="2" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <div className="w-32 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <DashboardLayout user={user} onLogout={() => setUser(null)}>
      <Switch hook={useHashLocation}>
        <Route path="/" component={DashboardPage} />
        <Route path="/employees" component={EmployeesPage} />
        <Route path="/employees/:id">{(params) => <EmployeeDetailPage id={parseInt(params.id)} />}</Route>
        <Route path="/leave" component={LeavePage} />
        <Route path="/attendance" component={AttendancePage} />
        <Route path="/payroll" component={PayrollPage} />
        <Route path="/recruitment" component={RecruitmentPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">404</div>
              <div className="text-muted-foreground">Page not found</div>
            </div>
          </div>
        </Route>
      </Switch>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

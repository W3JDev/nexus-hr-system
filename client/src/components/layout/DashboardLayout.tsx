import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard, Users, Calendar, Clock, DollarSign, Briefcase,
  Settings, LogOut, Bell, Search, Menu, X, ChevronDown, Sun, Moon,
  Building2, TrendingUp
} from "lucide-react";
import { logout } from "../../lib/auth";
import { queryClient } from "../../lib/queryClient";
import { User } from "../../../../shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import PerplexityAttribution from "../PerplexityAttribution";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/employees", icon: Users, label: "Employees" },
  { href: "/leave", icon: Calendar, label: "Leave Management" },
  { href: "/attendance", icon: Clock, label: "Attendance" },
  { href: "/payroll", icon: DollarSign, label: "Payroll" },
  { href: "/recruitment", icon: Briefcase, label: "Recruitment" },
];

const bottomItems = [
  { href: "/settings", icon: Settings, label: "Settings" },
];

function HRMSLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.9"/>
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.6"/>
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.6"/>
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.3"/>
        </svg>
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight text-foreground leading-none">Nexus HR</div>
        <div className="text-[10px] text-muted-foreground tracking-wider uppercase leading-none mt-0.5">People Platform</div>
      </div>
    </div>
  );
}

interface Props {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ user, onLogout, children }: Props) {
  const [location] = useHashLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    onLogout();
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href || location === "";
    return location.startsWith(href);
  };

  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <HRMSLogo />
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          <div className="section-label px-2 mb-2">Main</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${isActive(item.href, item.exact) ? "nav-item-active" : "nav-item-inactive"}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive(item.href, item.exact) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-1">
          <div className="section-label px-2 mb-2">System</div>
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${isActive(item.href) ? "nav-item-active" : "nav-item-inactive"}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* User section */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/50">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name}</div>
            <div className="text-[11px] text-muted-foreground capitalize">{user.role}</div>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-3">
          <PerplexityAttribution />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-sidebar-border bg-sidebar-background flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar-background border-r border-sidebar-border">
            <div className="absolute top-3 right-3">
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-background/95 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / page title area */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-secondary transition-colors" data-testid="user-menu-trigger">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-[11px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

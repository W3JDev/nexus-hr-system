import { useState } from "react";
import { login, register } from "../lib/auth";
import { User } from "../../../shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

interface Props {
  onLogin: (user: User) => void;
}

export default function AuthPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("admin@hrms.io");
  const [password, setPassword] = useState("admin123");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = mode === "login"
        ? await login(email, password)
        : await register(name, email, password);
      onLogin(user);
    } catch (err: any) {
      toast({ title: "Authentication failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="auth-page">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-primary/10 via-background to-purple-500/5 border-r border-border flex-col justify-between p-12 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:40px_40px]" />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-500/8 rounded-full blur-[60px]" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none">
                <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.9"/>
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-foreground">Nexus HR</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">People Platform</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground leading-tight mb-5">
            HR operations,<br/>
            <span className="text-gradient">reimagined.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
            Manage your entire workforce — from onboarding to payroll — in one beautifully designed platform.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { num: "10+", label: "Employees managed" },
            { num: "100%", label: "HR modules covered" },
            { num: "1 min", label: "Time to get started" },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="text-2xl font-bold text-primary">{stat.num}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none">
                <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor"/>
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <span className="font-bold text-foreground">Nexus HR</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === "login"
                ? "Sign in to your HR dashboard"
                : "Get started with Nexus HR"}
            </p>
          </div>

          {/* Demo credentials hint */}
          {mode === "login" && (
            <div className="mb-6 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-primary">Demo credentials pre-filled</div>
                <div className="text-xs text-muted-foreground mt-0.5">admin@hrms.io / admin123</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input
                  data-testid="input-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  className="input-field"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              data-testid="button-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={() => setMode("register")} className="text-primary hover:underline font-medium">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

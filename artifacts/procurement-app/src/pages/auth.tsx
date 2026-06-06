import { SignIn, SignUp } from "@clerk/react";
import { Building2, ShieldCheck, Zap, TrendingUp } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CLERK_APPEARANCE = {
  elements: {
    rootBox: "w-full",
    card: "shadow-none border-0 p-0 bg-transparent",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "border border-border bg-white hover:bg-muted text-foreground font-medium rounded-lg",
    formButtonPrimary:
      "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg",
    formFieldInput:
      "border-border bg-white text-foreground rounded-lg focus:ring-primary",
    footerActionText: "text-muted-foreground",
    footerActionLink: "text-primary font-semibold hover:text-primary/80",
    identityPreviewEditButton: "text-primary",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-xs",
  },
};

const FEATURES = [
  { icon: Zap,         label: "RFQ to PO in minutes",       sub: "Streamlined procurement workflow" },
  { icon: ShieldCheck, label: "Multi-level approvals",       sub: "Role-based access control"        },
  { icon: TrendingUp,  label: "Real-time spend analytics",   sub: "Reports & vendor scorecards"      },
];

const STATS = [
  { value: "500+", label: "Vendors" },
  { value: "₹12L+", label: "Spend managed" },
  { value: "94%",  label: "On-time POs" },
];

function AuthShell({ children, subtitle }: { children: React.ReactNode; subtitle: string }) {
  return (
    <div className="min-h-[100dvh] flex bg-background">

      {/* Left panel — dark navy */}
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-2/5 flex-col justify-between p-10 xl:p-14 sidebar-gradient"
        style={{ borderRight: "1px solid hsl(222 47% 17%)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-[17px] text-white tracking-tight leading-none">Procuris</span>
            <div className="text-[10px] text-slate-500 font-medium">Enterprise</div>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-400 mb-4">
            Procurement Intelligence
          </p>
          <blockquote className="text-2xl xl:text-3xl font-semibold text-white leading-snug mb-8">
            Streamline procurement
            <br />
            <span className="text-blue-400">from RFQ to payment</span>
            <br />
            — all in one place.
          </blockquote>

          {/* Feature list */}
          <div className="space-y-4 mb-10">
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-8 border-t border-white/[0.08]">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-600">
          © {new Date().getFullYear()} Procuris. Enterprise procurement platform.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 bg-background">
        <div className="w-full max-w-[400px]">

          {/* Mobile brand */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg mb-3">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">Procuris</span>
          </div>

          {/* Desktop icon */}
          <div className="hidden lg:flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="text-center mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{subtitle}</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Procuris · Enterprise Procurement Platform
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export function SignInPage() {
  return (
    <AuthShell subtitle="Welcome back">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={CLERK_APPEARANCE}
      />
    </AuthShell>
  );
}

export function SignUpPage() {
  return (
    <AuthShell subtitle="Create your account">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={CLERK_APPEARANCE}
      />
    </AuthShell>
  );
}

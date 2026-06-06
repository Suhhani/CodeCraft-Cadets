import { SignIn, SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex bg-background">
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center font-black text-primary-foreground text-lg">
            VB
          </div>
          <span className="font-bold text-xl tracking-tight">VendorBridge</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light leading-snug mb-6 opacity-90">
            "Streamlining procurement from RFQ to payment — all in one place."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-bold">
              P
            </div>
            <div>
              <div className="font-semibold text-sm">Procuris Enterprise</div>
              <div className="text-xs opacity-70">Procurement Management Platform</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center opacity-80">
          <div>
            <div className="text-2xl font-bold">500+</div>
            <div className="text-xs mt-0.5">Vendors</div>
          </div>
          <div>
            <div className="text-2xl font-bold">₹12L+</div>
            <div className="text-xs mt-0.5">Spend Managed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">94%</div>
            <div className="text-xs mt-0.5">On-time POs</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-lg mb-4">
              VB
            </div>
            <div className="lg:hidden text-center mb-2">
              <span className="font-bold text-xl tracking-tight text-foreground">VendorBridge</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function SignInPage() {
  return (
    <AuthShell>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1.5">Sign in to your procurement platform</p>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border rounded-xl p-0 bg-transparent",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton: "border border-border bg-background hover:bg-muted text-foreground font-medium",
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
            formFieldInput: "border-border bg-background text-foreground rounded-lg",
            footerActionText: "text-muted-foreground",
            footerActionLink: "text-primary font-medium hover:text-primary/80",
            identityPreviewEditButton: "text-primary",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
          },
        }}
      />
    </AuthShell>
  );
}

export function SignUpPage() {
  return (
    <AuthShell>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h2>
        <p className="text-muted-foreground text-sm mt-1.5">Join VendorBridge to manage procurement end-to-end</p>
      </div>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-0 p-0 bg-transparent",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton: "border border-border bg-background hover:bg-muted text-foreground font-medium",
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
            formFieldInput: "border-border bg-background text-foreground rounded-lg",
            footerActionText: "text-muted-foreground",
            footerActionLink: "text-primary font-medium hover:text-primary/80",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
          },
        }}
      />
    </AuthShell>
  );
}

import { Link } from "wouter";
import { Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { FileText, Users, ShoppingCart, CheckSquare } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 h-14 flex items-center border-b border-border bg-card z-50 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2.5 font-bold text-base tracking-tight text-foreground">
          <div className="bg-primary text-primary-foreground w-7 h-7 rounded-md flex items-center justify-center text-xs font-extrabold">
            VB
          </div>
          VendorBridge
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button size="sm">Open Dashboard</Button>
            </Link>
          </Show>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center justify-center py-20 px-4 md:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium mb-6 bg-card">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Enterprise-grade procurement management
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight mb-5">
              Streamline your procurement
              <br />
              <span className="text-primary">end to end.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Manage vendors, create RFQs, compare quotations, approve purchase orders
              and track invoices — all in one platform built for finance teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Show when="signed-out">
                <Link href="/sign-up">
                  <Button size="lg" className="px-8 h-11">Get Started Free</Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="px-8 h-11 bg-card">
                    Sign in
                  </Button>
                </Link>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard">
                  <Button size="lg" className="px-8 h-11">Open Dashboard</Button>
                </Link>
              </Show>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6 border-t border-border bg-card">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, label: "Vendor Management", desc: "Maintain a rated, verified vendor registry" },
              { icon: FileText, label: "RFQ Workflows", desc: "Multi-step RFQ creation with line items" },
              { icon: ShoppingCart, label: "Purchase Orders", desc: "Auto-generate POs from winning quotes" },
              { icon: CheckSquare, label: "Approval Engine", desc: "Configurable approval chains & audit logs" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-4 border-t border-border text-center text-xs text-muted-foreground bg-background">
        © 2025 VendorBridge Systems. All rights reserved.
      </footer>
    </div>
  );
}

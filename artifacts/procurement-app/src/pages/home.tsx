import { Link } from "wouter";
import { Show } from "@clerk/react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="px-6 h-16 flex items-center border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 sticky top-0">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground">
          <div className="bg-primary p-1.5 rounded-md">
            <img src={`${basePath}/logo.svg`} alt="Logo" className="w-5 h-5 text-primary-foreground stroke-current" />
          </div>
          Procuris
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </Show>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <section className="w-full py-24 md:py-32 lg:py-48 flex items-center justify-center px-4 md:px-6 relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          
          <div className="container px-4 md:px-6 relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium mb-8 bg-background">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Enterprise-grade procurement
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.1] mb-6">
              Procurement software that <br className="hidden md:block" />
              <span className="text-muted-foreground">actually works.</span>
            </h1>
            
            <p className="mx-auto max-w-[700px] text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              A powerful, no-nonsense platform for enterprise finance teams and vendors. 
              Manage RFQs, quotations, approvals, and purchase orders with precision and control.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Show when="signed-out">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12">
                    Start optimizing now
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 h-12 bg-background">
                    Sign in to your account
                  </Button>
                </Link>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12">
                    Open Dashboard
                  </Button>
                </Link>
              </Show>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 bg-muted/30 border-t border-border/50">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="space-y-3">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Structured RFQs</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Create detailed Requests for Quotation with line items and specific deadlines. Assign vendors and track responses effortlessly.
                </p>
              </div>
              <div className="space-y-3">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Side-by-side comparison</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Evaluate vendor quotations side-by-side. Automatically highlight lowest prices and fastest delivery times to make informed decisions.
                </p>
              </div>
              <div className="space-y-3">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Approval workflows</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Strict governance with multi-tier approval workflows for purchase orders and invoices. Maintain an immutable audit log.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="w-full py-6 border-t border-border/50 flex flex-col items-center justify-center text-sm text-muted-foreground bg-background">
        <p>© 2025 Procuris Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}

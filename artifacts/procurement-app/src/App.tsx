import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthLayout } from "@/components/layout";

import { LandingPage } from "@/pages/home";
import { SignInPage, SignUpPage } from "@/pages/auth";
import { DashboardPage } from "@/pages/dashboard";
import { VendorsList } from "@/pages/vendors";
import { VendorNew } from "@/pages/vendors/new";
import { VendorDetail } from "@/pages/vendors/detail";
import { RfqList } from "@/pages/rfqs";
import { RfqNew } from "@/pages/rfqs/new";
import { RfqDetail } from "@/pages/rfqs/detail";
import { RfqCompare } from "@/pages/rfqs/compare";
import { QuotationsList } from "@/pages/quotations";
import { QuotationNew } from "@/pages/quotations/new";
import { QuotationDetail } from "@/pages/quotations/detail";
import { ApprovalsList } from "@/pages/approvals";
import { PurchaseOrdersList } from "@/pages/purchase-orders";
import { PurchaseOrderNew } from "@/pages/purchase-orders/new";
import { PurchaseOrderDetail } from "@/pages/purchase-orders/detail";
import { InvoicesList } from "@/pages/invoices";
import { InvoiceNew } from "@/pages/invoices/new";
import { InvoiceDetail } from "@/pages/invoices/detail";
import { ActivityLogsPage } from "@/pages/activity-logs";
import { ReportsPage } from "@/pages/reports";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function ProtectedRoutes() {
  return (
    <AuthLayout>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/vendors" component={VendorsList} />
        <Route path="/vendors/new" component={VendorNew} />
        <Route path="/vendors/:id" component={VendorDetail} />
        <Route path="/rfqs" component={RfqList} />
        <Route path="/rfqs/new" component={RfqNew} />
        <Route path="/rfqs/:id" component={RfqDetail} />
        <Route path="/rfqs/:id/compare" component={RfqCompare} />
        <Route path="/quotations" component={QuotationsList} />
        <Route path="/quotations/new" component={QuotationNew} />
        <Route path="/quotations/:id" component={QuotationDetail} />
        <Route path="/approvals" component={ApprovalsList} />
        <Route path="/purchase-orders" component={PurchaseOrdersList} />
        <Route path="/purchase-orders/new" component={PurchaseOrderNew} />
        <Route path="/purchase-orders/:id" component={PurchaseOrderDetail} />
        <Route path="/invoices" component={InvoicesList} />
        <Route path="/invoices/new" component={InvoiceNew} />
        <Route path="/invoices/:id" component={InvoiceDetail} />
        <Route path="/activity-logs" component={ActivityLogsPage} />
        <Route path="/reports" component={ReportsPage} />
        {/* Add more routes here */}
        <Route component={NotFound} />
      </Switch>
    </AuthLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      
      <Route>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
        <Show when="signed-in">
          <ProtectedRoutes />
        </Show>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        baseTheme: shadcn,
        variables: {
          colorPrimary: 'hsl(222, 47%, 11%)',
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;

import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FAQChatbot } from "@/components/chatbot/faq-chatbot";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ErrorBoundary } from "@/components/error-boundary";
import { I18nProvider } from "@/lib/i18n";
import { useDataStore } from "@/lib/data-store";

// Lazy-loaded page components
const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Resources = lazy(() => import("@/pages/resources"));
const Recommendations = lazy(() => import("@/pages/recommendations"));
const Tenants = lazy(() => import("@/pages/tenants"));
const Budgets = lazy(() => import("@/pages/budgets"));
const Allocation = lazy(() => import("@/pages/allocation"));
const Reports = lazy(() => import("@/pages/reports"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Settings = lazy(() => import("@/pages/settings"));
const Help = lazy(() => import("@/pages/help"));
const Guide = lazy(() => import("@/pages/guide"));
const TenantDetail = lazy(() => import("@/pages/tenant-detail"));
const TagGovernance = lazy(() => import("@/pages/tag-governance"));
const TagGroupForm = lazy(() => import("@/pages/tag-group-form"));
const WasteDetection = lazy(() => import("@/pages/waste-detection"));
const Support = lazy(() => import("@/pages/support"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/resources" component={Resources} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/tenants" component={Tenants} />
        <Route path="/tenant/:id" component={TenantDetail} />
        <Route path="/tags" component={TagGovernance} />
        <Route path="/tags/create" component={TagGroupForm} />
        <Route path="/tags/edit/:id" component={TagGroupForm} />
        <Route path="/budgets" component={Budgets} />
        <Route path="/allocation" component={Allocation} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/reports" component={Reports} />
        <Route path="/waste" component={WasteDetection} />
        <Route path="/settings" component={Settings} />
        <Route path="/support" component={Support} />
        <Route path="/help" component={Help} />
        <Route path="/guide" component={Guide} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main data-tour="main-content" className="flex-1 h-[calc(100vh-4rem)] overflow-hidden">
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = useDataStore((s) => s.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          {isAuthenticated ? (
            <Switch>
              <Route path="/login">
                <Redirect to="/" />
              </Route>
              <Route>
                <AuthenticatedApp />
              </Route>
            </Switch>
          ) : (
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/login" component={Login} />
                <Route>
                  <Login />
                </Route>
              </Switch>
            </Suspense>
          )}
          <Toaster />
          {isAuthenticated && <FAQChatbot />}
          {isAuthenticated && <OnboardingTour />}
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

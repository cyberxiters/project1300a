import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/ui/sidebar";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Logs from "@/pages/logs";
import Templates from "@/pages/templates";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Check if the current route is the auth page
  const isAuthPage = location === "/auth";
  
  // If user is authenticated and on auth page, redirect to dashboard
  if (user && isAuthPage) {
    return <Redirect to="/" />;
  }
  
  // If we're on the auth page, don't show the sidebar
  if (isAuthPage) {
    return (
      <div className="bg-background">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }
  
  // If user is not authenticated and not on auth page, redirect to auth page
  if (!user && !isLoading && !isAuthPage) {
    return <Redirect to="/auth" />;
  }
  
  // For all other routes, show the sidebar
  return (
    <div className="flex min-h-screen h-screen overflow-hidden">
      <Sidebar currentPath={location} />
      <div className="flex-1 flex flex-col overflow-hidden bg-discord-dark">
        <Switch>
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/campaigns" component={Campaigns} />
          <ProtectedRoute path="/logs" component={Logs} />
          <ProtectedRoute path="/templates" component={Templates} />
          <ProtectedRoute path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

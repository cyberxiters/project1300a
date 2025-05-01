import { Switch, Route, useLocation } from "wouter";
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

function Router() {
  const [location] = useLocation();
  
  return (
    <div className="flex min-h-screen h-screen overflow-hidden">
      <Sidebar currentPath={location} />
      <div className="flex-1 flex flex-col overflow-hidden bg-discord-dark">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/logs" component={Logs} />
          <Route path="/templates" component={Templates} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

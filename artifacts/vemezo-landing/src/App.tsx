import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

import { DAppLayout } from "@/components/dapp/DAppLayout";
import Dashboard from "@/pages/dashboard";
import Vault from "@/pages/vault";
import Stats from "@/pages/stats";
import Docs from "@/pages/docs";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/app">
        <DAppLayout>
          <Dashboard />
        </DAppLayout>
      </Route>
      <Route path="/vault">
        <DAppLayout>
          <Vault />
        </DAppLayout>
      </Route>
      <Route path="/stats">
        <DAppLayout>
          <Stats />
        </DAppLayout>
      </Route>
      <Route path="/docs">
        <DAppLayout>
          <Docs />
        </DAppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { wagmiConfig } from "@/lib/wagmi/config";

import NotFound     from "@/pages/not-found";
import Home         from "@/pages/home";

import { DAppLayout } from "@/components/dapp/DAppLayout";
import Dashboard    from "@/pages/dashboard";
import Vault        from "@/pages/vault";
import Stats        from "@/pages/stats";
import Docs         from "@/pages/docs";
import Portfolio    from "@/pages/portfolio";
import Earn         from "@/pages/earn";
import Swap         from "@/pages/swap";
import Governance   from "@/pages/governance";
import Analytics    from "@/pages/analytics";
import Leaderboard  from "@/pages/leaderboard";
import History      from "@/pages/history";
import Settings     from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DApp({ children }: { children: React.ReactNode }) {
  return <DAppLayout>{children}</DAppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      <Route path="/app">        <DApp><Dashboard /></DApp>    </Route>
      <Route path="/vault">      <DApp><Vault /></DApp>         </Route>
      <Route path="/stats">      <DApp><Stats /></DApp>         </Route>
      <Route path="/docs">       <DApp><Docs /></DApp>          </Route>
      <Route path="/portfolio">  <DApp><Portfolio /></DApp>     </Route>
      <Route path="/earn">       <DApp><Earn /></DApp>          </Route>
      <Route path="/swap">       <DApp><Swap /></DApp>          </Route>
      <Route path="/governance"> <DApp><Governance /></DApp>    </Route>
      <Route path="/analytics">  <DApp><Analytics /></DApp>     </Route>
      <Route path="/leaderboard"><DApp><Leaderboard /></DApp>   </Route>
      <Route path="/history">    <DApp><History /></DApp>       </Route>
      <Route path="/settings">   <DApp><Settings /></DApp>      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#0a0b0d",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              },
            }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

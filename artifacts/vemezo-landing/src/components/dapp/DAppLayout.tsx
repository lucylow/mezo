import { Link, useLocation } from "wouter";
import { useAppStore } from "@/store/appStore";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Vault, BarChart3, BookOpen, Menu, X, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vault", label: "Vault", icon: Vault },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export function DAppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { isConnected, address, connect, disconnect } = useWallet();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-[100dvh] bg-[#050608] border-r border-white/8 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-[80px] -translate-x-full md:translate-x-0" : "w-[240px] translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/8">
          {!sidebarCollapsed && (
            <Link href="/" className="text-xl font-bold font-mono tracking-tighter flex items-center gap-1">
              <span>veMEZO</span>
              <span className="text-primary">.fi</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/" className="mx-auto text-xl font-bold font-mono tracking-tighter text-primary">
              vM
            </Link>
          )}
          <button onClick={toggleSidebar} className="md:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                  {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/8 mt-auto">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Mainnet</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/8 bg-[#050608]/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold hidden sm:block">
              {NAV_ITEMS.find((item) => item.href === location)?.label || "App"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <Button variant="outline" onClick={disconnect} className="font-mono text-xs bg-black/40 border-white/10 hover:bg-white/5 hover:text-destructive transition-colors">
                <Wallet className="h-4 w-4 mr-2" />
                {address}
              </Button>
            ) : (
              <Button onClick={connect} className="font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                Connect Wallet
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

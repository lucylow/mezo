import { Link, useLocation } from "wouter";
import { useAppStore } from "@/store/appStore";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Vault, BarChart3, BookOpen, Menu, X, Wallet,
  TrendingUp, ArrowLeftRight, Vote, Trophy, History, Settings,
  ExternalLink, ChevronLeft, ChevronRight, Home, Users, LogOut, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  external?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { href: "/app",        label: "Dashboard",  icon: LayoutDashboard },
  { href: "/vault",      label: "Vault",      icon: Vault },
  { href: "/portfolio",  label: "Portfolio",  icon: TrendingUp },
  { href: "/earn",       label: "Earn",       icon: TrendingUp },
  { href: "/swap",       label: "Swap",       icon: ArrowLeftRight },
  { href: "/governance", label: "Governance", icon: Vote },
  { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
  { href: "/leaderboard",label: "Leaderboard",icon: Trophy },
  { href: "/history",    label: "History",    icon: History },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/docs",       label: "Docs",       icon: BookOpen },
  { href: "/settings",   label: "Settings",   icon: Settings },
  { href: "https://bridge.mezo.org", label: "Mezo Bridge", icon: ExternalLink, external: true },
];

const MOBILE_PRIMARY: NavItem[] = [
  { href: "/app",   label: "Dashboard", icon: LayoutDashboard },
  { href: "/vault", label: "Vault",     icon: Vault },
  { href: "/earn",  label: "Earn",      icon: TrendingUp },
  { href: "/swap",  label: "Swap",      icon: ArrowLeftRight },
];

const ROUTE_LABELS: Record<string, string> = {
  "/app": "Dashboard", "/vault": "Vault", "/portfolio": "Portfolio",
  "/earn": "Earn", "/swap": "Swap", "/governance": "Governance",
  "/analytics": "Analytics", "/leaderboard": "Leaderboard",
  "/history": "History", "/docs": "Documentation", "/settings": "Settings",
};

function Breadcrumb({ location }: { location: string }) {
  const label = ROUTE_LABELS[location] || "App";
  return (
    <div className="flex items-center gap-2 text-sm">
      <Link href="/">
        <span className="text-muted-foreground hover:text-foreground transition cursor-pointer">
          <Home className="h-4 w-4" />
        </span>
      </Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="text-foreground font-medium">{label}</span>
    </div>
  );
}

function NavLink({ item, isActive, collapsed, onClick }: {
  item: NavItem; isActive: boolean; collapsed?: boolean; onClick?: () => void;
}) {
  const Icon = item.icon;
  const cls = cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
    collapsed && "justify-center px-0",
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
        {!collapsed && <ExternalLink className="h-3 w-3 ml-auto opacity-50" />}
      </a>
    );
  }

  return (
    <Link href={item.href}>
      <div className={cls} onClick={onClick}>
        <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      </div>
    </Link>
  );
}

export function DAppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useAppStore();
  const { isConnected, address, connect, disconnect } = useWallet();

  useEffect(() => { closeMobileSidebar(); }, [location]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary/30">
      {/* ── Desktop Sidebar ── */}
      <aside className={cn(
        "hidden md:flex flex-col bg-[#050608] border-r border-white/8 h-screen sticky top-0 transition-all duration-300",
        sidebarCollapsed ? "w-[72px]" : "w-[240px]",
      )}>
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-white/8 px-4",
          sidebarCollapsed ? "justify-center" : "justify-between",
        )}>
          {!sidebarCollapsed && (
            <Link href="/">
              <span className="text-xl font-bold font-mono tracking-tighter flex items-center gap-1 cursor-pointer">
                <span>veMEZO</span><span className="text-primary">.fi</span>
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/">
              <span className="text-xl font-bold font-mono tracking-tighter text-primary cursor-pointer">vM</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5 px-2">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} isActive={location === item.href} collapsed={sidebarCollapsed} />
          ))}
          <div className="my-2 border-t border-white/8" />
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} isActive={location === item.href} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* Epoch footer */}
        <div className="p-3 border-t border-white/8">
          {!sidebarCollapsed ? (
            <div className="bg-white/5 rounded-lg p-3 text-xs">
              <p className="text-muted-foreground mb-1">Next Epoch</p>
              <p className="font-semibold text-sm">3d 14h 22m</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">Mainnet</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/8 bg-[#050608]/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <Breadcrumb location={location} />
            </div>
            <span className="sm:hidden text-lg font-semibold">
              {ROUTE_LABELS[location] || "App"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Network pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Mainnet
            </div>

            {isConnected ? (
              <Button
                variant="outline"
                onClick={disconnect}
                className="font-mono text-xs bg-black/40 border-white/10 hover:bg-white/5 hover:text-destructive transition-colors"
              >
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

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050608] border-t border-white/8 z-50">
        <div className="flex items-center justify-around py-2">
          {MOBILE_PRIMARY.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}>
                  <Icon size={22} />
                  <span className="text-[10px]">{item.label}</span>
                </div>
              </Link>
            );
          })}
          <button
            onClick={toggleMobileSidebar}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-muted-foreground"
          >
            <Menu size={22} />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeMobileSidebar} />
          <div className="relative w-72 max-w-[85vw] bg-[#050608] flex flex-col h-full shadow-2xl border-r border-white/8">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              <span className="font-bold text-lg font-mono">veMEZO<span className="text-primary">.fi</span></span>
              <button onClick={closeMobileSidebar} className="p-1.5 hover:bg-white/5 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User info */}
            {isConnected && (
              <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium font-mono truncate">{address}</p>
                  <p className="text-xs text-muted-foreground">Connected · Mainnet</p>
                </div>
              </div>
            )}

            {/* Full nav in drawer */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
              {MAIN_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={location === item.href}
                  onClick={closeMobileSidebar}
                />
              ))}
              <div className="my-2 border-t border-white/8" />
              {SECONDARY_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={location === item.href}
                  onClick={closeMobileSidebar}
                />
              ))}
            </nav>

            <div className="p-4 border-t border-white/8 space-y-2">
              {isConnected && (
                <button
                  onClick={() => { disconnect(); closeMobileSidebar(); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-400/10 transition text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect Wallet
                </button>
              )}
              {!isConnected && (
                <button
                  onClick={() => { connect(); closeMobileSidebar(); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </button>
              )}
              <p className="text-[10px] text-muted-foreground text-center pt-1">v1.0.0 · Mezo Mainnet</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

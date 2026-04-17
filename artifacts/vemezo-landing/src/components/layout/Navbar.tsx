import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold font-mono tracking-tighter flex items-center gap-1">
          <span>veMEZO</span>
          <span className="text-primary">.fi</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-mono font-medium text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Vaults</a>
          <a href="#" className="hover:text-foreground transition-colors">Analytics</a>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden sm:flex font-mono text-xs border-border bg-transparent hover:bg-secondary">
            Connect Wallet
          </Button>
          <Button className="font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            Launch App
          </Button>
        </div>
      </div>
    </nav>
  );
}
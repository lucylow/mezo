import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card pt-20 pb-10 border-t border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="text-2xl font-bold font-mono tracking-tighter flex items-center gap-2 mb-6">
              <span>veMEZO</span>
              <span className="text-primary">.fi</span>
            </Link>
            <p className="text-muted-foreground font-mono text-sm max-w-sm leading-relaxed">
              The premier auto-compounder for the Mezo Bitcoin Layer. Maximizing yield through trustless automation.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-mono uppercase tracking-wider text-sm">Protocol</h4>
            <ul className="space-y-4 text-sm font-mono text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Vaults</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Governance</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Docs</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-mono uppercase tracking-wider text-sm">Community</h4>
            <ul className="space-y-4 text-sm font-mono text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Twitter (X)</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/50 text-xs font-mono text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} veMEZO.fi. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
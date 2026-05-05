import { motion } from "framer-motion";
import { RefreshCw, Zap, Target, Coins } from "lucide-react";

const features = [
  {
    title: "Auto-Max-Lock Extension",
    desc: "Every Thursday epoch the keeper re-extends all pooled veMEZO NFTs to the full 4-year lock duration. Manually managed positions lose voting weight as locks decay — the vault never lets yours slip.",
    icon: RefreshCw,
  },
  {
    title: "100% Rebase Capture",
    desc: "The dynamic rebase mechanism pays anti-dilution rewards every epoch — up to 50% of weekly emissions when lock rates are low. Missing a single claim forfeits that week permanently. Automation ensures 100% capture.",
    icon: Zap,
  },
  {
    title: "Gauge Vote Optimization",
    desc: "Aggregated veMEZO weight is algorithmically directed to the highest-incentive active veBTC gauges each epoch — capturing matching-market alpha that no individual holder can replicate at scale.",
    icon: Target,
  },
  {
    title: "MUSD Performance Fee",
    desc: "The 10% performance fee settles in MUSD — Mezo's Bitcoin-backed stablecoin — not MEZO. No tokens are ever sold to cover fees, so the vault contributes zero sell pressure on the coordination asset.",
    icon: Coins,
  },
];

export function Features() {
  return (
    <section className="py-32 border-b border-border/50 bg-secondary/5 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built Around veMEZO Mechanics</h2>
            <p className="text-muted-foreground font-mono text-lg">
              Every feature maps directly to a structural advantage in Mezo's dual-token ve-system. No generic DeFi primitives — purpose-built for veMEZO maximization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-8 rounded-xl bg-card border border-border flex flex-col md:flex-row gap-6 hover:bg-card/80 transition-colors hover:border-primary/30"
            >
              <div className="shrink-0 p-4 bg-background rounded-lg border border-border self-start">
                <f.icon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-mono text-sm">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

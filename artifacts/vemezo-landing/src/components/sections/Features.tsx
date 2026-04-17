import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Coins, KeyRound } from "lucide-react";

const features = [
  {
    title: "Non-Custodial Design",
    desc: "Your keys, your yield. The auto-compounder is governed by immutable smart contracts. You can withdraw your principal and yield at any time.",
    icon: KeyRound,
  },
  {
    title: "Zero-Gas Claiming",
    desc: "Save hundreds of dollars a year in transaction fees. The protocol socializes the gas cost of claiming and reinvesting across all vault participants.",
    icon: Coins,
  },
  {
    title: "MEV-Protected Routing",
    desc: "When swapping reward tokens back to BTC, our contracts route through private mempools to protect your yield from front-running bots.",
    icon: Cpu,
  },
  {
    title: "Audited & Trustless",
    desc: "Codebase audited by top-tier security firms. No admin keys can access user funds. The protocol functions purely on mathematical parameters.",
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section className="py-32 border-b border-border/50 bg-secondary/5 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Engineered for Maximalists</h2>
            <p className="text-muted-foreground font-mono text-lg">
              We built veMEZO.fi because we wanted a better way to handle yield on the Bitcoin Layer. No compromises on security.
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
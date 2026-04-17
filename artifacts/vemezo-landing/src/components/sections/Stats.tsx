import { motion } from "framer-motion";
import { Activity, Lock, RefreshCw, Layers } from "lucide-react";

const stats = [
  {
    label: "Total Value Locked",
    value: "$42.8M",
    sub: "+12.4% this week",
    icon: Layers,
  },
  {
    label: "Current APY Boost",
    value: "145%",
    sub: "Compared to manual claiming",
    icon: Activity,
  },
  {
    label: "Active Vaults",
    value: "1,204",
    sub: "Depositors globally",
    icon: Lock,
  },
  {
    label: "Total Yield Generated",
    value: "245 BTC",
    sub: "Auto-compounded",
    icon: RefreshCw,
  },
];

export function Stats() {
  return (
    <section className="py-24 border-b border-border/50 relative overflow-hidden bg-secondary/10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm flex flex-col items-start hover:border-primary/50 transition-colors"
            >
              <div className="p-3 rounded-md bg-primary/10 text-primary mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-2 text-foreground">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className="text-xs font-mono text-primary/80">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
import { motion } from "framer-motion";
import { Zap, Clock, Users, TrendingUp } from "lucide-react";

const stats = [
  {
    label: "Total MEZO Supply",
    value: "1B",
    sub: "40% community allocation — the largest single bucket",
    icon: TrendingUp,
  },
  {
    label: "Max veBTC Boost",
    value: "5×",
    sub: "When veMEZO share equals or exceeds veBTC share",
    icon: Zap,
  },
  {
    label: "Phase 1 Lock Rate",
    value: "13%",
    sub: "~1,540 veMEZO positions from 11,845 eligible addresses",
    icon: Users,
  },
  {
    label: "Max Lock Duration",
    value: "4 yrs",
    sub: "1,456 days — auto-extended every epoch by the vault",
    icon: Clock,
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

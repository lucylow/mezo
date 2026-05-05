import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Projection data computed from research-document figures:
 *   Auto-compounder: 78% projected APR − 10% performance fee = 70.2% net APR,
 *     weekly compounding (52×/year). Monthly factor ≈ 1.05998.
 *   Manual claiming:  ~45% APR (missed epochs, no gas rebate), monthly simple interest.
 * Starting deposit: 1,000 MEZO.
 */
const data = [
  { month: "Now", manual: 1000, auto: 1000 },
  { month: "M1",  manual: 1038, auto: 1060 },
  { month: "M2",  manual: 1075, auto: 1124 },
  { month: "M3",  manual: 1113, auto: 1191 },
  { month: "M4",  manual: 1150, auto: 1263 },
  { month: "M5",  manual: 1188, auto: 1339 },
  { month: "M6",  manual: 1225, auto: 1419 },
  { month: "M7",  manual: 1263, auto: 1504 },
  { month: "M8",  manual: 1300, auto: 1595 },
  { month: "M9",  manual: 1338, auto: 1690 },
  { month: "M10", manual: 1375, auto: 1791 },
  { month: "M11", manual: 1413, auto: 1898 },
  { month: "M12", manual: 1450, auto: 2012 },
];

export function YieldChart() {
  return (
    <section className="py-32 border-b border-border/50 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/3">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              The Power of Automation
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground font-mono text-lg mb-8"
            >
              Manual claiming is linear. Auto-compounding is exponential. Based on a 1,000 MEZO deposit at current projected rates over 12 months.
            </motion.p>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm bg-primary shrink-0" />
                <span>veMEZO.fi Auto-Compounder — 78% APR, weekly compounding</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm bg-muted-foreground shrink-0" />
                <span>Manual Claiming — ~45% APR, forfeited epochs &amp; gas costs</span>
              </li>
            </ul>
            <p className="mt-6 text-xs text-muted-foreground font-mono leading-relaxed">
              After 12 months: <span className="text-primary font-semibold">2,012 MEZO</span> auto-compounded vs <span className="text-muted-foreground">1,450 MEZO</span> manual. The 10% MUSD performance fee is already reflected in the auto projection.
            </p>
          </div>

          <div className="w-full lg:w-2/3 h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v.toLocaleString()} MEZO`}
                  dx={-10}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [`${v.toLocaleString()} MEZO`]}
                />
                <Area type="monotone" dataKey="manual" name="Manual" stroke="hsl(var(--muted-foreground))" fillOpacity={1} fill="url(#colorManual)" strokeWidth={2} />
                <Area type="monotone" dataKey="auto"   name="Auto-Compounder" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAuto)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

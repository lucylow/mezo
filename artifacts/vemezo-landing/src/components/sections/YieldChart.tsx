import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Month 1", manual: 1000, auto: 1000 },
  { month: "Month 2", manual: 1050, auto: 1080 },
  { month: "Month 3", manual: 1100, auto: 1180 },
  { month: "Month 4", manual: 1150, auto: 1300 },
  { month: "Month 5", manual: 1200, auto: 1450 },
  { month: "Month 6", manual: 1250, auto: 1630 },
  { month: "Month 7", manual: 1300, auto: 1850 },
  { month: "Month 8", manual: 1350, auto: 2100 },
  { month: "Month 9", manual: 1400, auto: 2400 },
  { month: "Month 10", manual: 1450, auto: 2750 },
  { month: "Month 11", manual: 1500, auto: 3150 },
  { month: "Month 12", manual: 1550, auto: 3600 },
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
              Manual claiming is linear. Auto-compounding is exponential. See how much yield you're leaving on the table by not automating your veMEZO position.
            </motion.p>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm bg-primary" />
                <span>veMEZO.fi Auto-Compounder (APY ~145%)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm bg-muted-foreground" />
                <span>Manual Claiming (APR ~60%)</span>
              </li>
            </ul>
          </div>
          
          <div className="w-full lg:w-2/3 h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
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
                  tickFormatter={(value) => `$${value}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="manual" stroke="hsl(var(--muted-foreground))" fillOpacity={1} fill="url(#colorManual)" strokeWidth={2} />
                <Area type="monotone" dataKey="auto" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAuto)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
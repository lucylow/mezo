import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Deposit once",
    desc: "Deposit your veMEZO NFTs into the trustless vault contract. Receive fungible vault shares (vveMEZO) proportional to the underlying MEZO value of your position.",
  },
  {
    num: "02",
    title: "Epochs roll over",
    desc: "Every Thursday at 00:05 UTC the keeper bot claims all rebase rewards and gauge incentives across the entire pooled veMEZO position. Gas is socialized across all depositors.",
  },
  {
    num: "03",
    title: "Auto-reinvest",
    desc: "Claimed MEZO is immediately re-locked as new veMEZO NFTs at the maximum 4-year duration, maintaining peak voting weight and full 5× boost eligibility — every single epoch.",
  },
  {
    num: "04",
    title: "Watch it grow",
    desc: "Each vault share represents more underlying MEZO as epochs accumulate. Withdraw at any time and receive your proportional share plus all compounded yield, minus the 10% MUSD performance fee.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-32 border-b border-border/50 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            The Protocol Engine
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground font-mono text-lg"
          >
            Yield shouldn't be a part-time job. Our keeper bot executes the full veMEZO optimization loop — rebase claims, gauge voting, and max-lock extensions — every epoch, automatically.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              {i !== steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-1rem)] w-[calc(100%+2rem)] h-[1px] bg-border z-0">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-border">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              )}
              <div className="relative z-10 flex flex-col items-start">
                <div className="text-5xl font-bold font-mono text-muted/30 mb-6 group-hover:text-primary/40 transition-colors">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

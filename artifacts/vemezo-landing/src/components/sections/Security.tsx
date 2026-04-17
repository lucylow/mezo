import { motion } from "framer-motion";
import { Shield, FileCheck, Lock, CheckCircle2 } from "lucide-react";

const audits = [
  { name: "Zellic", date: "Q4 2023", status: "Passed", link: "#" },
  { name: "Trail of Bits", date: "Q1 2024", status: "Passed", link: "#" },
  { name: "Halborn", date: "Q2 2024", status: "In Progress", link: "#" },
];

export function Security() {
  return (
    <section className="py-32 border-b border-border/50 bg-background relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm font-mono text-muted-foreground mb-6"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>Uncompromising Security</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Trust Math, Not Humans.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground font-mono text-lg mb-8 leading-relaxed"
            >
              Our smart contracts are completely immutable and non-custodial. The protocol cannot access your principal, and all compounding logic is executed deterministically on-chain.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-mono text-sm text-muted-foreground">No Admin Keys</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-mono text-sm text-muted-foreground">Timelock Governed</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-mono text-sm text-muted-foreground">Open Source Contracts</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-mono text-sm text-muted-foreground">$1M Bug Bounty</span>
              </div>
            </motion.div>
          </div>
          
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl bg-card border border-border relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Lock className="w-64 h-64" />
              </div>
              
              <h3 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-primary" />
                Security Audits
              </h3>
              
              <div className="space-y-4 relative z-10">
                {audits.map((audit) => (
                  <div key={audit.name} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                    <div>
                      <div className="font-bold text-foreground">{audit.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{audit.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                        audit.status === "Passed" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {audit.status}
                      </span>
                      <a href={audit.link} className="text-muted-foreground hover:text-primary transition-colors">
                        <FileCheck className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
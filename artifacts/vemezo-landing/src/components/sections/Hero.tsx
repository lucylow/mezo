import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SiBitcoin } from "react-icons/si";
import { ArrowRight, Terminal } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import { useEpochTimer } from "@/hooks/useEpochTimer";

export function Hero() {
  const epoch = useEpochTimer();
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-border/50 pt-20">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.15),transparent_50%)] z-20" />
        {/* Placeholder for actual generated image */}
        <img 
          src={heroBg} 
          alt="Abstract technical background" 
          className="w-full h-full object-cover opacity-50 mix-blend-screen"
        />
      </div>

      <div className="container relative z-30 mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm font-mono text-muted-foreground mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Next Epoch &mdash; {epoch.compact} remaining</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            Maximize Bitcoin Yield. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">Zero Babysitting.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-mono leading-relaxed"
          >
            veMEZO.fi is the premier auto-compounder on the Mezo Bitcoin Layer. 
            Deposit once. We automatically claim, swap, and reinvest your veMEZO staking rewards.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hover-elevate">
              Launch App <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-mono border-border hover:bg-secondary/80 hover-elevate">
              <Terminal className="mr-2 w-5 h-5" /> View Docs
            </Button>
          </motion.div>
          
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 1, delay: 0.8 }}
             className="mt-16 flex items-center justify-center gap-6 text-muted-foreground"
          >
             <span className="text-sm uppercase tracking-widest font-mono">Secured by</span>
             <SiBitcoin className="w-6 h-6 text-muted-foreground/60" />
             <span className="text-sm font-bold tracking-widest">MEZO L2</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
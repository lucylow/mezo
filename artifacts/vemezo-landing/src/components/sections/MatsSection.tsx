import { motion } from "framer-motion";
import { Sparkles, ArrowDownToLine, RefreshCw, Lock, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const EARNING_ACTIONS = [
  {
    icon: ArrowDownToLine,
    title: "NFT Deposit",
    mats: "+500 Mats",
    desc: "Depositing each veMEZO NFT into the vault is recorded on-chain as a verifiable activity event.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: RefreshCw,
    title: "Auto-Compound",
    mats: "+100 Mats / epoch",
    desc: "Every Thursday epoch the keeper claims and reinvests rewards. Each compound call generates on-chain activity credited to depositors.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    icon: Lock,
    title: "Lock Extension",
    mats: "+250 Mats / extension",
    desc: "The keeper re-extends all veMEZO NFTs to the 4-year maximum each epoch — signalling long-term commitment that Mezo rewards generously.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Clock,
    title: "Share-Day Holding",
    mats: "+1 Mat / share / day",
    desc: "Sustained vault share ownership is measured daily. The longer you hold vault shares, the more Mats accumulate passively.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

const PHASE_STATS = [
  { label: "Phase 1 MEZO Distributed", value: "19.8M" },
  { label: "Eligible Addresses", value: "11,845" },
  { label: "Season 2 Rate", value: "36.78 mats / MEZO" },
  { label: "Multi-Season Bonus", value: "+25%" },
];

export function MatsSection() {
  return (
    <section className="py-32 border-b border-border/50 bg-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.06),transparent_60%)]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm font-mono text-purple-300 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mats Program — magic satoshis</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Deposit Once. Earn Mats Every Epoch.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground font-mono text-lg leading-relaxed"
          >
            Mats are Mezo's on-chain activity points — "magic satoshis" — that directly determine your
            allocation eligibility for future MEZO airdrops. Every action the vault automates on your
            behalf also generates Mats, creating a compound reward loop you can't achieve manually.
          </motion.p>
        </div>

        {/* Earning mechanism cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {EARNING_ACTIONS.map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`p-6 rounded-xl bg-card border ${action.border} flex gap-5 hover:bg-card/70 transition-colors`}
            >
              <div className={`shrink-0 p-3 rounded-lg ${action.bg} self-start`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold">{action.title}</h3>
                  <span className={`font-mono text-sm font-semibold ${action.color} bg-opacity-10 px-2 py-0.5 rounded-full ${action.bg} border ${action.border}`}>
                    {action.mats}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm font-mono leading-relaxed">
                  {action.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Phase 1 data banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-8"
        >
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Phase 1 Results</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Mats → MEZO. Real Allocation.</h3>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                Phase 1 distributed 19.8M MEZO to 11,845 eligible addresses. Only 13% chose to lock
                as veMEZO — the vault's auto-max-lock automation is designed to capture this
                participation for everyone, driving lock rates and Mats generation simultaneously.
                Season 2 Mainnet Mats are rewarded more favorably than testnet Mats.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0">
              {PHASE_STATS.map((s) => (
                <div key={s.label} className="text-center p-4 rounded-xl bg-white/5 border border-white/8 min-w-[140px]">
                  <p className="text-xl font-bold font-mono text-purple-300">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-purple-500/15 flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-muted-foreground font-mono flex-1">
              Addresses participating in both Season 1 and Season 2 earn an additional{" "}
              <strong className="text-foreground">25% basic distribution bonus</strong>.
              The vault's continuous on-chain activity maximizes eligibility across both seasons.
            </p>
            <Link href="/app">
              <Button className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white gap-2">
                Start Earning Mats <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

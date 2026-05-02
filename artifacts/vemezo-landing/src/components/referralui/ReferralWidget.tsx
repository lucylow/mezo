import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Copy, Check, Users, Gift, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const REFERRAL_STATS = [
  { label: "Referrals", value: "0", sub: "users brought in" },
  { label: "Rewards Earned", value: "0 MEZO", sub: "lifetime" },
  { label: "Your Bonus", value: "5%", sub: "of referred deposits" },
];

export function ReferralWidget() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!isConnected || !address) return null;

  const referralCode = address.slice(2, 10).toUpperCase();
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}?ref=${referralCode}`
      : `https://vemezo.fi?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            Refer &amp; Earn
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="info" dot dotColor="bg-blue-400">
              5% bonus
            </Badge>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-90"
                )}
              />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral link and earn{" "}
          <span className="text-primary font-medium">5% of every referred deposit</span>{" "}
          automatically compounded into your vault position.
        </p>

        {/* Referral link box */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Your referral link
            </p>
            <code className="text-xs text-foreground truncate block">
              {referralLink}
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "shrink-0 border-white/10 transition-all",
              copied && "border-green-500/40 text-green-400"
            )}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {REFERRAL_STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white/4 border border-white/6 rounded-xl p-3 text-center"
            >
              <p className="text-base font-bold font-mono">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Expandable details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-white/8 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  How it works
                </p>
                {[
                  {
                    step: "1",
                    text: "Share your referral link with friends interested in DeFi yield.",
                  },
                  {
                    step: "2",
                    text: "When they deposit into veMEZO vault using your link, you earn 5% of their deposit value.",
                  },
                  {
                    step: "3",
                    text: "Rewards are automatically added to your vault shares each epoch.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
                <a
                  href="https://mezo.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  View referral program details
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social share shortcuts */}
        <div className="flex gap-2 pt-1">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm earning ${78}% APR auto-compounding veMEZO on Mezo chain! Join me 🔒⚡`)}&url=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full border-white/10 hover:bg-white/5 text-xs gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              Share on X
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-white/10 hover:bg-white/5 text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

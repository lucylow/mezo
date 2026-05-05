import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Docs() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documentation</h2>
        <p className="text-muted-foreground mt-2">Learn how veMEZO auto-compounding works.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Overview</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The veMEZO Auto-Compounder is a decentralized smart contract system that maximizes yield on
          locked MEZO tokens. veMEZO is a vote-escrowed NFT (ERC-721) created by locking MEZO for up
          to 4 years — it amplifies veBTC yield up to <strong className="text-foreground">5×</strong> and
          earns weekly rebase rewards that offset dilution. By pooling NFTs and automating the full
          optimization loop — rebase claims, gauge voting, and max-lock extensions — the vault delivers
          returns individual holders cannot replicate efficiently.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold border-b border-white/10 pb-2">How It Works</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">1</span>
                Deposit
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Deposit your veMEZO NFTs into the vault contract. You receive fungible vault shares
              (vveMEZO) proportional to the underlying MEZO value. The vault immediately extends every
              NFT to the 4-year maximum lock duration.
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
                Epoch Execution
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Every Thursday at 00:05 UTC the keeper bot claims all rebase rewards and gauge incentives
              across the entire pooled position. Gas costs are spread across all depositors — eliminating
              the per-user fee that makes individual claiming uneconomical for small positions.
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">3</span>
                Reinvestment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Claimed MEZO rewards are immediately re-locked as new veMEZO NFTs at the maximum 4-year
              duration, preserving full voting weight. The 10% performance fee is deducted in MUSD —
              not MEZO — so no rewards are sold on the open market.
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">4</span>
                Value Appreciation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              As the vault accumulates more MEZO each epoch, the intrinsic value of each vault share
              increases. Withdraw at any time and receive your proportional share of total underlying
              MEZO plus all compounded yield since deposit.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Fees</h3>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-6">
            <ul className="space-y-4">
              <li className="flex justify-between items-center pb-4 border-b border-white/5">
                <div>
                  <p className="font-medium">Performance Fee</p>
                  <p className="text-xs text-muted-foreground">
                    Taken only from harvested rewards, not principal. Settled in{" "}
                    <strong className="text-foreground">MUSD</strong> (Mezo's Bitcoin-backed stablecoin) —
                    zero MEZO is sold to cover fees.
                  </p>
                </div>
                <span className="font-mono text-primary font-bold">10%</span>
              </li>
              <li className="flex justify-between items-center pb-4 border-b border-white/5">
                <div>
                  <p className="font-medium">Deposit Fee</p>
                  <p className="text-xs text-muted-foreground">No fee on deposits.</p>
                </div>
                <span className="font-mono text-primary font-bold">0%</span>
              </li>
              <li className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Withdrawal Fee</p>
                  <p className="text-xs text-muted-foreground">No fee to withdraw your shares.</p>
                </div>
                <span className="font-mono text-primary font-bold">0%</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Frequently Asked Questions</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">Can I withdraw my specific NFT?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              No. When you deposit an NFT into the vault it becomes property of the vault contract and
              you receive fungible shares representing its underlying MEZO value. When you withdraw, you
              receive an equivalent amount of MEZO (plus compounded yield) — not necessarily the same
              NFT token IDs you deposited.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">Is there a lockup period for shares?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              No, there is no lockup period on vault shares (vveMEZO). You can withdraw at any time,
              provided there is sufficient liquid MEZO or unlocked NFT reserves in the vault. Note that
              the underlying veMEZO NFTs are locked for up to 4 years on-chain — the vault manages
              this lock schedule so you don't have to.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">How is the APR calculated?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              Projected APR is computed from on-chain data as{" "}
              <code className="text-primary text-xs bg-white/5 px-1 py-0.5 rounded">
                (dailyRewards / tvl) × 365 × 100
              </code>{" "}
              using the most recent daily metric from the subgraph. It reflects the base MEZO emission
              rate plus gauge incentives captured in the latest epoch, before the 10% performance fee.
              Actual APR varies with emission schedule halvings and matching-market incentive levels.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">What is the maximum veBTC boost multiplier?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              veMEZO amplifies veBTC yield up to <strong className="text-foreground">5×</strong>. The
              boost scales with your relative share: you reach the 5× cap when your share of total
              veMEZO equals or exceeds your share of total veBTC. Because boost is bounded, MEZO never
              overrides BTC as the governance anchor — it only changes how effective a BTC position is
              in the economic game of directing value. The vault's aggregated veMEZO weight maximizes
              the boost ratio for all depositors collectively.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">How does the rebase mechanism work?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              The rebase share of weekly MEZO emissions is dynamic: when few tokens are locked, rebase
              is high — up to <strong className="text-foreground">50% of total weekly emissions</strong> —
              to incentivize locking. As more MEZO is locked, rebase shrinks and more flows to gauge
              voting rewards, shifting the system from "pay people to hold" to "pay people to
              participate." The vault's keeper claims these rebase rewards every Thursday epoch,
              ensuring 100% capture for all depositors. Missing even one epoch means permanently
              forfeiting that week's anti-dilution payment.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">Why is the performance fee collected in MUSD, not MEZO?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              Collecting fees in <strong className="text-foreground">MUSD</strong> — Mezo's
              Bitcoin-backed stablecoin — means the protocol never needs to sell MEZO on the open
              market to cover operating costs. This keeps the vault's activities entirely
              non-dilutive to the token. Accumulated MUSD is auto-staked in the MUSD Savings Vault,
              earning additional protocol yield via the sMUSD exchange rate, creating a compounding
              revenue stream that doesn't compete with depositor rewards.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

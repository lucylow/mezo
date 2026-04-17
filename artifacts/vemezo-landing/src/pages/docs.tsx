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
          The veMEZO Auto-Compounder is a decentralized smart contract system designed to maximize your yield on locked MEZO tokens. 
          By pooling NFTs and automating the reward collection and restaking process, users save on gas fees and benefit from 
          frequent compounding that would be too expensive to perform individually.
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
              Users deposit their veMEZO NFTs into the vault contract. In return, they receive fungible Vault Shares proportional to the underlying MEZO value.
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
                Automated Claim
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Periodically (usually every epoch), a decentralized keeper calls the strategy contract to claim all generated MEZO rewards across all pooled NFTs.
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
              The claimed MEZO is automatically locked back into new veMEZO NFTs, increasing the total underlying value of the vault.
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
              As the vault acquires more MEZO, the intrinsic value of each Vault Share increases. When you withdraw, you receive more MEZO than you deposited.
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
                  <p className="text-xs text-muted-foreground">Taken only from harvested rewards, not principal.</p>
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
              No. When you deposit an NFT into the vault, it becomes property of the vault contract and you are issued fungible shares representing its value. When you withdraw, you receive an equivalent amount of MEZO (plus compounded yield), but not necessarily the exact same NFT tokens you deposited.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">Is there a lockup period for shares?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              No, there is no lockup period for your Vault Shares. You can withdraw them at any time, provided there is sufficient liquid MEZO or unlocked NFTs in the vault reserves.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border-white/10">
            <AccordionTrigger className="hover:text-primary">How is the APR calculated?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              The projected APR is calculated based on the base MEZO emission rate multiplied by the compounding frequency effect, minus the performance fee. It assumes constant emission rates which may fluctuate in reality.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

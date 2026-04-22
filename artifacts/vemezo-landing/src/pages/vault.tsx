import { useUserPosition } from "@/hooks/useUserPosition";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Info, Lock, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { pageTransition, staggerContainer, staggerItem, cardHoverProps } from "@/lib/animations";

const mockAvailableNFTs = [
  { id: "4092", amount: 1200, unlockDate: "2026-01-01" },
  { id: "8821", amount: 450, unlockDate: "2025-10-15" },
];

export default function Vault() {
  const { isConnected } = useWallet();
  const position = useUserPosition();
  const stats = useVaultStats();

  const shareData = [
    { name: "Your Shares", value: isConnected ? position.shares : 0 },
    { name: "Others", value: stats.totalShares - (isConnected ? position.shares : 0) },
  ];
  
  const COLORS = ["hsl(var(--primary))", "rgba(255,255,255,0.1)"];

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vault Management</h2>
        <p className="text-sm text-muted-foreground">Deposit veMEZO NFTs or withdraw your shares.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl h-full">
            <CardHeader>
              <CardTitle>Manage Position</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-white/10 p-1 rounded-xl h-12">
                  <TabsTrigger value="deposit" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-foreground transition-all">
                    <ArrowUpFromLine className="w-4 h-4 mr-2" />
                    Withdraw
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="deposit" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select veMEZO NFT</Label>
                      <Select disabled={!isConnected || mockAvailableNFTs.length === 0}>
                        <SelectTrigger className="w-full bg-black/40 border-white/10 h-12">
                          <SelectValue placeholder={isConnected ? "Select NFT to deposit" : "Connect wallet to view NFTs"} />
                        </SelectTrigger>
                        <SelectContent>
                          {mockAvailableNFTs.map(nft => (
                            <SelectItem key={nft.id} value={nft.id}>
                              NFT #{nft.id} - {nft.amount} MEZO (Locks until {nft.unlockDate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <Info className="w-3 h-3" />
                        Depositing an NFT transfers it to the Vault contract.
                      </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Shares Received:</span>
                        <span className="font-medium font-mono">0.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Share Price:</span>
                        <span className="font-medium font-mono">1 Share = 1.05 MEZO</span>
                      </div>
                    </div>

                    <Button className="w-full h-12 text-lg" disabled={!isConnected}>
                      {isConnected ? "Deposit NFT" : "Connect Wallet"}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="withdraw" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Shares to Withdraw</Label>
                        <span className="text-xs text-muted-foreground">Balance: {position.shares} Shares</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="bg-black/40 border-white/10 h-12 pr-16 text-lg font-mono"
                          disabled={!isConnected}
                        />
                        <Button 
                          variant="ghost" 
                          className="absolute right-1 top-1 h-10 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          disabled={!isConnected}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimated MEZO Output:</span>
                        <span className="font-medium font-mono">0.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Withdrawal Fee:</span>
                        <span className="font-medium font-mono">0%</span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full h-12 text-lg border-white/10 hover:bg-white/5" disabled={!isConnected}>
                      Withdraw
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Pool Ownership</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {shareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2 space-y-1">
                <p className="text-3xl font-bold font-mono">
                  {isConnected && stats.totalShares > 0 ? ((position.shares / stats.totalShares) * 100).toFixed(2) : "0.00"}%
                </p>
                <p className="text-sm text-muted-foreground">of Total Vault Shares</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Active NFTs in Vault</CardTitle>
              <CardDescription>NFTs you've deposited</CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected || position.nftsLocked.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
                  <Lock className="w-8 h-8 opacity-20 mb-2" />
                  No NFTs deposited
                </div>
              ) : (
                <div className="space-y-3">
                  {position.nftsLocked.map(nft => (
                    <div key={nft.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-primary font-mono">#{nft.id}</p>
                        <p className="text-xs text-muted-foreground">Locked: {nft.unlockDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{nft.amount} MEZO</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

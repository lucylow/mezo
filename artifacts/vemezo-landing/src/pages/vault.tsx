import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { useUserPosition, formatLockCountdown } from "@/hooks/useUserPosition";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useVaultSecurityParams } from "@/hooks/contracts/useVaultRead";
import { useWallet } from "@/hooks/useWallet";
import { useDeposit, useWithdraw } from "@/hooks/contracts/useVaultWrite";
import { useVeMEZONFTs } from "@/hooks/contracts/useVeMEZOData";
import { useVaultEvents } from "@/hooks/useContractEvents";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { ContractErrorBoundary } from "@/components/ContractErrorBoundary";
import { isContractDeployed } from "@/lib/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Info, Lock, ArrowDownToLine, ArrowUpFromLine, AlertCircle, Clock, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { pageTransition, staggerContainer, staggerItem, cardHoverProps } from "@/lib/animations";
import { FeeDisplay } from "@/components/vault/FeeDisplay";
import { CompoundingSimulator } from "@/components/vault/CompoundingSimulator";
import { PositionOverview } from "@/components/vault/PositionOverview";
import { BoostCalculator } from "@/components/vault/BoostCalculator";
import { EpochTimer } from "@/components/vault/EpochTimer";
import { cn } from "@/lib/utils";

const MOCK_AVAILABLE_NFTS = [
  { id: "4092", amount: 1200, unlockDate: "2026-01-01" },
  { id: "8821", amount: 450,  unlockDate: "2025-10-15" },
];

/** Format seconds remaining as a human-readable duration string. */
function fmtDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Vault() {
  const { address } = useAccount();
  const { isConnected } = useWallet();
  const position = useUserPosition();
  const stats    = useVaultStats();
  const security = useVaultSecurityParams();
  const deployed = isContractDeployed();

  // Live countdown for deposit-lock timers
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 10_000);
    return () => clearInterval(t);
  }, []);

  // ── Contract write hooks ────────────────────────────────────────────────
  const { deposit, isPending: isDepositing } = useDeposit();
  const { withdraw, withdrawByShares, isPending: isWithdrawing } = useWithdraw();

  // ── Real-time event watcher (no-op pre-deployment) ──────────────────────
  useVaultEvents();

  // ── Wallet-owned NFTs (on-chain; falls back gracefully) ─────────────────
  const { nfts: walletNFTs, isLoading: nftsLoading } = useVeMEZONFTs(address);

  // Available NFTs: on-chain if deployed, else mock
  const availableNFTs = deployed && walletNFTs.length > 0
    ? walletNFTs
        .filter(n => !position.tokenIds.includes(n.tokenId.toString()))
        .map(n => ({
          id:         n.tokenId.toString(),
          amount:     Number(n.valueFormatted),
          unlockDate: n.lockEnd.toISOString().slice(0, 10),
        }))
    : MOCK_AVAILABLE_NFTS;

  // ── Form state ──────────────────────────────────────────────────────────
  const [selectedNFT,    setSelectedNFT]    = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [depositHash,    setDepositHash]    = useState<`0x${string}` | undefined>();
  const [withdrawHash,   setWithdrawHash]   = useState<`0x${string}` | undefined>();

  // Transaction toasts — auto-fires sonner on confirm/fail
  useTransactionToast({ hash: depositHash });
  useTransactionToast({ hash: withdrawHash });

  const handleDeposit = async () => {
    if (!selectedNFT || !deployed) return;
    try {
      const hash = await deposit(BigInt(selectedNFT));
      if (hash) setDepositHash(hash);
      setSelectedNFT("");
    } catch {
      // toast already fired by useDeposit
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !deployed) return;
    try {
      const shares = parseEther(withdrawAmount);
      const hash   = await withdrawByShares(shares);
      if (hash) setWithdrawHash(hash);
      setWithdrawAmount("");
    } catch {
      // toast already fired by useWithdraw
    }
  };

  const handleWithdrawNFT = async (tokenId: string) => {
    if (!deployed) return;
    try {
      const hash = await withdraw(BigInt(tokenId));
      if (hash) setWithdrawHash(hash);
    } catch {
      // toast already fired
    }
  };

  // ── Chart data ──────────────────────────────────────────────────────────
  const userShareCount = isConnected ? position.shares : 0;
  const othersShares   = Math.max(0, stats.totalShares - userShareCount);
  const shareData = [
    { name: "Your Shares", value: userShareCount },
    { name: "Others",      value: othersShares },
  ];
  const COLORS = ["hsl(var(--primary))", "rgba(255,255,255,0.1)"];

  // Security param display values
  const depositLockDays    = Math.round(security.minDepositDuration / 86_400);
  const slippagePct        = (security.swapSlippageBps / 100).toFixed(2);
  const cooldownHrs        = Math.round(security.minCompoundInterval / 3_600);

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
        <p className="text-sm text-muted-foreground">Deposit veMEZO NFTs to earn auto-compounded rewards.</p>
      </div>

      {/* Pre-deployment notice */}
      {!deployed && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-400 shrink-0" />
          <div>
            <span className="text-yellow-300 font-medium">Testnet preview</span>
            <span className="text-yellow-300/70 ml-1">— Contract not yet deployed. Set <code className="font-mono text-yellow-300/90">VITE_VAULT_ADDRESS</code> to enable live transactions.</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ContractErrorBoundary>
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

                  {/* ── Deposit tab ──────────────────────────────────────── */}
                  <TabsContent value="deposit" className="mt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select veMEZO NFT</Label>
                        <Select
                          value={selectedNFT}
                          onValueChange={setSelectedNFT}
                          disabled={!isConnected || availableNFTs.length === 0 || nftsLoading}
                        >
                          <SelectTrigger className="w-full bg-black/40 border-white/10 h-12">
                            <SelectValue
                              placeholder={
                                !isConnected   ? "Connect wallet to view NFTs"
                                : nftsLoading  ? "Loading NFTs…"
                                : availableNFTs.length === 0 ? "No NFTs available"
                                : "Select NFT to deposit"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNFTs.map(nft => (
                              <SelectItem key={nft.id} value={nft.id}>
                                NFT #{nft.id} — {nft.amount.toLocaleString()} MEZO (unlocks {nft.unlockDate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                          <Info className="w-3 h-3" />
                          Depositing transfers the NFT to the vault contract. A {depositLockDays}-day withdrawal lock applies.
                        </p>
                      </div>

                      {/* Deposit lock notice */}
                      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs">
                        <Lock className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        <div className="text-muted-foreground">
                          <span className="text-primary font-medium">{depositLockDays}-day deposit lock</span> — after depositing, your NFT cannot be withdrawn for {depositLockDays} days. This prevents flash-loan attacks and MEV exploitation.
                        </div>
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Shares Received:</span>
                          <span className="font-medium font-mono">
                            {selectedNFT
                              ? (availableNFTs.find(n => n.id === selectedNFT)?.amount ?? 0).toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Performance Fee:</span>
                          <span className="font-medium font-mono">{stats.performanceFee}%</span>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 text-lg"
                        onClick={handleDeposit}
                        disabled={!isConnected || !selectedNFT || !deployed || isDepositing}
                      >
                        {isDepositing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Depositing…</>
                        ) : isConnected ? (
                          deployed ? "Deposit NFT" : "Deposit NFT (preview)"
                        ) : "Connect Wallet"}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* ── Withdraw tab ─────────────────────────────────────── */}
                  <TabsContent value="withdraw" className="mt-6 space-y-6">
                    <div className="space-y-4">
                      {/* Withdraw by shares */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Shares to Withdraw</Label>
                          <button
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setWithdrawAmount(String(position.shares))}
                          >
                            Balance: {position.shares.toLocaleString()} vveMEZO
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            className="bg-black/40 border-white/10 h-12 pr-16 text-lg font-mono"
                            disabled={!isConnected}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-10 text-xs text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => setWithdrawAmount(String(position.shares))}
                            disabled={!isConnected}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated MEZO Output:</span>
                          <span className="font-medium font-mono">
                            {withdrawAmount ? (Number(withdrawAmount) * 1.05).toFixed(2) : "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Withdrawal Fee:</span>
                          <span className="font-medium font-mono text-green-400">0%</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full h-12 text-lg border-white/10 hover:bg-white/5"
                        onClick={handleWithdraw}
                        disabled={!isConnected || !withdrawAmount || !deployed || isWithdrawing}
                      >
                        {isWithdrawing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Withdrawing…</>
                        ) : "Withdraw Shares"}
                      </Button>

                      {/* Withdraw individual NFTs */}
                      {isConnected && position.nftsLocked.length > 0 && (
                        <div className="pt-2">
                          <Label className="text-xs text-muted-foreground mb-2 block">Or withdraw a specific NFT</Label>
                          <div className="space-y-2">
                            {position.nftsLocked.map(nft => {
                              const unlockSecsLeft = nft.depositUnlockAt > 0 ? Math.max(0, nft.depositUnlockAt - now) : 0;
                              const isLocked = nft.depositLocked && unlockSecsLeft > 0;
                              return (
                                <div
                                  key={nft.id}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border",
                                    isLocked
                                      ? "bg-yellow-500/5 border-yellow-500/20"
                                      : "bg-white/5 border-white/5",
                                  )}
                                >
                                  <div>
                                    <p className="text-sm font-medium text-primary font-mono">#{nft.id}</p>
                                    {isLocked ? (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="h-3 w-3 text-yellow-400" />
                                        <p className="text-xs text-yellow-400">
                                          Locked — {fmtDuration(unlockSecsLeft)} remaining
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                                        <ShieldCheck className="h-3 w-3" />
                                        Available to withdraw
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-1.5">
                                    {nft.amount > 0 && (
                                      <p className="text-xs text-muted-foreground">{nft.amount.toLocaleString()} MEZO</p>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className={cn(
                                        "h-8 text-xs",
                                        isLocked
                                          ? "border-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
                                          : "border-white/10 hover:bg-white/5",
                                      )}
                                      onClick={() => !isLocked && handleWithdrawNFT(nft.id)}
                                      disabled={!deployed || isWithdrawing || isLocked}
                                      title={isLocked ? `Withdrawal locked for ${fmtDuration(unlockSecsLeft)}` : "Withdraw this NFT"}
                                    >
                                      {isLocked ? (
                                        <><Lock className="h-3 w-3 mr-1" />Locked</>
                                      ) : "Withdraw"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </ContractErrorBoundary>
        </div>

        <div className="space-y-6">
          <EpochTimer />
          <PositionOverview />
          <BoostCalculator />
          <CompoundingSimulator />
          <FeeDisplay />
          {/* Pool ownership donut */}
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
                      {shareData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#050608", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2 space-y-1">
                <p className="text-3xl font-bold font-mono">
                  {isConnected && stats.totalShares > 0
                    ? ((userShareCount / stats.totalShares) * 100).toFixed(2)
                    : "0.00"}%
                </p>
                <p className="text-sm text-muted-foreground">of Total Vault Shares</p>
              </div>
            </CardContent>
          </Card>

          {/* Active NFTs */}
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
                  {position.nftsLocked.map(nft => {
                    const unlockSecsLeft = nft.depositUnlockAt > 0 ? Math.max(0, nft.depositUnlockAt - now) : 0;
                    const isLocked = nft.depositLocked && unlockSecsLeft > 0;
                    return (
                      <div
                        key={nft.id}
                        className={cn(
                          "flex justify-between items-center p-3 rounded-lg border",
                          isLocked ? "bg-yellow-500/5 border-yellow-500/15" : "bg-white/5 border-white/5"
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium text-primary font-mono">#{nft.id}</p>
                          {isLocked ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-yellow-400" />
                              <p className="text-xs text-yellow-400">{fmtDuration(unlockSecsLeft)} until withdraw</p>
                            </div>
                          ) : (
                            <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="h-3 w-3" /> Withdrawable
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {nft.amount > 0 && (
                            <p className="text-sm font-medium">{nft.amount.toLocaleString()} MEZO</p>
                          )}
                          {isLocked ? (
                            <Badge variant="warning" size="sm" className="mt-1">Locked</Badge>
                          ) : (
                            <Badge variant="success" size="sm" className="mt-1">Ready</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vault stats + security params mini-card */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Vault Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total Shares",   value: stats.totalShares.toLocaleString() },
                { label: "Perf. Fee",      value: `${stats.performanceFee}%` },
                { label: "Pending Rewards",value: `${stats.pendingRewards.toLocaleString()} MEZO` },
                { label: "Deposit Lock",   value: `${depositLockDays}d` },
                { label: "Swap Slippage",  value: `${slippagePct}%` },
                { label: "Compound Cooldown", value: `${cooldownHrs}h` },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium font-mono">{item.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                <div className={`w-2 h-2 rounded-full ${deployed ? "bg-green-400" : "bg-yellow-400"}`} />
                <span className="text-xs text-muted-foreground">
                  {deployed ? "Live on-chain" : `Mock data (${stats.source})`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

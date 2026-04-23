import { useAccount } from "wagmi";
import { useReferral } from "@/hooks/contracts/useReferral";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Users, Gift, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReferralWidget() {
  const { address } = useAccount();
  const { referralCode, totalRewards, setReferralCode, claimRewards, isPending, deployed } = useReferral(address);
  const [newCode, setNewCode] = useState("");
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = referralCode ? `${origin}?ref=${encodeURIComponent(referralCode)}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetCode = async () => {
    if (newCode.length < 3) {
      toast.error("Code must be at least 3 characters");
      return;
    }
    await setReferralCode(newCode.toUpperCase());
    setNewCode("");
  };

  if (!address) {
    return (
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Refer &amp; earn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Connect a wallet to manage your referral code.</p>
        </CardContent>
      </Card>
    );
  }

  if (!deployed) {
    return (
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Refer &amp; earn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Deploy `ReferralManager` and set `VITE_REFERRAL_MANAGER_ADDRESS` to activate on-chain referrals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-primary" />
          Refer &amp; earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!referralCode ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a unique code (3–16 characters) to earn referral credits recorded by the vault integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. CRYPTO123"
                maxLength={16}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
              />
              <Button type="button" onClick={handleSetCode} disabled={isPending}>
                Set code
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your referral link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-xs truncate border border-white/10">
                  {referralLink}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-primary" />
                <span>Pending rewards</span>
              </div>
              <span className="font-semibold">{totalRewards.toFixed(4)}</span>
            </div>

            {totalRewards > 0 && (
              <Button type="button" className="w-full" onClick={() => void claimRewards()} disabled={isPending}>
                Claim rewards
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Rewards accrue per `ReferralManager` rules once the vault calls `recordReferralReward`.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

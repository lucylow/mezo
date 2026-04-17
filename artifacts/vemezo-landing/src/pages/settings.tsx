import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Bell, Shield, Sliders, Globe, Wallet, Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-white/10",
      )}
    >
      <div className={cn(
        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
        checked && "translate-x-5",
      )} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { isConnected, address, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const [notifs, setNotifs] = useState({
    epochStart: true, compoundExecuted: true, lowGas: false, priceAlerts: false,
  });
  const [prefs, setPrefs] = useState({
    autoCompound: true, advancedMode: false, testnetMode: false,
  });
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [currency, setCurrency] = useState("USD");

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account settings.</p>
      </div>

      {/* Wallet */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Connected Address</p>
                  <p className="font-mono text-sm">{address}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyAddress} className="p-2 hover:bg-white/5 rounded-lg transition">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <a
                    href={`https://explorer.test.mezo.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/5 rounded-lg transition"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Connected to Mezo Mainnet</span>
              </div>
              <Button variant="outline" onClick={disconnect} className="border-red-400/30 text-red-400 hover:bg-red-400/10">
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm mb-4">No wallet connected.</p>
              <Button onClick={connect}>Connect Wallet</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingRow label="Epoch Start" description="Get notified when a new epoch begins">
            <Toggle checked={notifs.epochStart} onChange={v => setNotifs(n => ({ ...n, epochStart: v }))} />
          </SettingRow>
          <SettingRow label="Compound Executed" description="Alert when your rewards are auto-compounded">
            <Toggle checked={notifs.compoundExecuted} onChange={v => setNotifs(n => ({ ...n, compoundExecuted: v }))} />
          </SettingRow>
          <SettingRow label="Low Gas Alerts" description="Notify when gas is unusually high">
            <Toggle checked={notifs.lowGas} onChange={v => setNotifs(n => ({ ...n, lowGas: v }))} />
          </SettingRow>
          <SettingRow label="Price Alerts" description="MEZO price movement alerts">
            <Toggle checked={notifs.priceAlerts} onChange={v => setNotifs(n => ({ ...n, priceAlerts: v }))} />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Transaction */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" /> Transaction Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-1">Default Slippage Tolerance</p>
            <p className="text-xs text-muted-foreground mb-3">Applied to all swaps and deposits</p>
            <div className="flex items-center gap-3">
              {[0.1, 0.5, 1.0].map(v => (
                <button
                  key={v}
                  onClick={() => setSlippage(v)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm transition",
                    slippage === v ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10",
                  )}
                >
                  {v}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={e => setSlippage(parseFloat(e.target.value))}
                step={0.1} min={0.01} max={50}
                className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-center focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Transaction Deadline</p>
            <p className="text-xs text-muted-foreground mb-3">Cancel pending transactions after this many minutes</p>
            <div className="flex items-center gap-3">
              {[10, 20, 30].map(v => (
                <button
                  key={v}
                  onClick={() => setDeadline(v)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm transition",
                    deadline === v ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10",
                  )}
                >
                  {v}m
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingRow label="Auto-Compound" description="Automatically compound rewards each epoch">
            <Toggle checked={prefs.autoCompound} onChange={v => setPrefs(p => ({ ...p, autoCompound: v }))} />
          </SettingRow>
          <SettingRow label="Advanced Mode" description="Show advanced metrics and developer tools">
            <Toggle checked={prefs.advancedMode} onChange={v => setPrefs(p => ({ ...p, advancedMode: v }))} />
          </SettingRow>
          <SettingRow label="Display Currency">
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/40"
            >
              {["USD", "EUR", "GBP", "BTC"].map(c => (
                <option key={c} value={c} className="bg-[#0a0b0d]">{c}</option>
              ))}
            </select>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingRow label="Testnet Mode" description="Use Mezo testnet for safe testing">
            <Toggle checked={prefs.testnetMode} onChange={v => setPrefs(p => ({ ...p, testnetMode: v }))} />
          </SettingRow>
          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              veMEZO.fi never asks for your private key or seed phrase. Always verify you are on the correct domain.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

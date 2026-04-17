import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { ArrowDown, RefreshCw, Settings, AlertCircle, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TOKENS = [
  { symbol: "MEZO", name: "Mezo Token", icon: "🟠" },
  { symbol: "MUSD", name: "Mezo USD", icon: "💵" },
  { symbol: "BTC",  name: "Bitcoin",   icon: "₿" },
];

const RATES: Record<string, number> = {
  "MEZO-MUSD": 2.5,  "MUSD-MEZO": 0.4,
  "MEZO-BTC":  0.000042, "BTC-MEZO": 23800,
  "MUSD-BTC":  0.0000168, "BTC-MUSD": 59500,
};

function TokenSelector({ token, onChange, exclude }: {
  token: typeof TOKENS[0];
  onChange: (t: typeof TOKENS[0]) => void;
  exclude: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition"
      >
        <span className="text-lg">{token.icon}</span>
        <span className="font-semibold">{token.symbol}</span>
        <ArrowDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[#0a0b0d] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
          {TOKENS.filter(t => t.symbol !== exclude).map(t => (
            <button
              key={t.symbol}
              onClick={() => { onChange(t); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/5 transition text-sm"
            >
              <span>{t.icon}</span><span>{t.symbol}</span>
              <span className="ml-auto text-xs text-muted-foreground">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Swap() {
  const { isConnected, connect } = useWallet();
  const [from, setFrom] = useState(TOKENS[0]);
  const [to, setTo] = useState(TOKENS[1]);
  const [fromAmt, setFromAmt] = useState("");
  const [toAmt, setToAmt] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  const rate = RATES[`${from.symbol}-${to.symbol}`] ?? 1;

  useEffect(() => {
    if (fromAmt && !isNaN(Number(fromAmt))) {
      setToAmt((parseFloat(fromAmt) * rate).toFixed(6));
    } else {
      setToAmt("");
    }
  }, [fromAmt, rate]);

  const switchTokens = () => {
    setFrom(to); setTo(from);
    setFromAmt(toAmt); setToAmt(fromAmt);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Swap</h1>
        <p className="text-muted-foreground">Exchange Mezo ecosystem tokens.</p>
      </div>

      <Card className="bg-black/40 border-white/8">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Swap Tokens</CardTitle>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn("p-1.5 rounded-lg transition", showSettings ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground")}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Slippage settings */}
          {showSettings && (
            <div className="p-4 bg-white/5 rounded-xl text-sm">
              <p className="font-medium mb-3">Slippage Tolerance</p>
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0].map(v => (
                  <button
                    key={v}
                    onClick={() => setSlippage(v)}
                    className={cn(
                      "px-3 py-1 rounded-lg transition",
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
                  className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-center"
                  step={0.1} min={0.01} max={50}
                />
              </div>
            </div>
          )}

          {/* From */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">You Pay</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmt}
                onChange={e => setFromAmt(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-semibold focus:outline-none placeholder:text-white/20"
              />
              <TokenSelector token={from} onChange={setFrom} exclude={to.symbol} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Balance: {isConnected ? "1,234.56" : "—"} {from.symbol}
            </p>
          </div>

          {/* Switch */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={switchTokens}
              className="p-2 bg-[#0a0b0d] border border-white/10 rounded-full hover:bg-white/5 hover:border-primary/30 transition"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* To */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">You Receive</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                value={toAmt}
                readOnly
                className="flex-1 bg-transparent text-2xl font-semibold focus:outline-none placeholder:text-white/20"
              />
              <TokenSelector token={to} onChange={setTo} exclude={from.symbol} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Balance: {isConnected ? "3,210.12" : "—"} {to.symbol}
            </p>
          </div>

          {/* Info rows */}
          {fromAmt && (
            <div className="space-y-2 px-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="flex items-center gap-1.5">
                  1 {from.symbol} = {rate >= 0.001 ? rate.toFixed(4) : rate.toExponential(3)} {to.symbol}
                  <RefreshCw className="h-3 w-3 text-muted-foreground" />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span className="text-green-400">&lt;0.01%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee</span>
                <span>~0.0001 BTC</span>
              </div>
            </div>
          )}

          {isConnected ? (
            <Button
              disabled={!fromAmt || isNaN(Number(fromAmt))}
              className="w-full"
              size="lg"
            >
              {!fromAmt ? "Enter Amount" : "Swap"}
            </Button>
          ) : (
            <Button onClick={connect} className="w-full" size="lg">
              Connect Wallet
            </Button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            1 MUSD ≈ $1.00 · Powered by Mezo DEX
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

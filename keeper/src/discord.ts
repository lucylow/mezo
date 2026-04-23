import { ethers } from "ethers";
import type { ProfitabilityCheck } from "./profitability";

/**
 * Discord notification module for the veMEZO keeper bot.
 *
 * Sends rich embeds to the configured Discord webhook URLs so the team
 * gets at-a-glance visibility into vault compounding activity and alerts.
 */

/** Discord colour codes */
const COLOUR = {
  success: 0x00d26a, // green
  warning: 0xfbbd23, // orange
  error:   0xef4444, // red
  info:    0xf97316, // Mezo orange
} as const;

interface DiscordEmbed {
  title:       string;
  description?: string;
  color:       number;
  fields?:     Array<{ name: string; value: string; inline?: boolean }>;
  footer?:     { text: string };
  timestamp?:  string;
}

async function postEmbed(webhookUrl: string, embed: DiscordEmbed): Promise<void> {
  const res = await fetch(webhookUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ embeds: [embed] }),
  });
  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * Send a compound-success notification with detailed stats.
 */
export async function notifyCompoundSuccess(opts: {
  txHash:          string;
  blockNumber:     number;
  totalRewards:    bigint;
  fee:             bigint;
  amountCompounded: bigint;
  profitability:   ProfitabilityCheck;
}): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const embed: DiscordEmbed = {
    title:  "✅ veMEZO Auto-Compounded",
    color:  COLOUR.success,
    fields: [
      {
        name:   "Transaction",
        value:  `[\`${opts.txHash.slice(0, 10)}…\`](https://explorer.test.mezo.org/tx/${opts.txHash})`,
        inline: true,
      },
      { name: "Block",     value: String(opts.blockNumber),                        inline: true },
      { name: "Rewards",   value: `${ethers.formatEther(opts.totalRewards)} MEZO`, inline: true },
      { name: "Fee (10%)", value: `${ethers.formatEther(opts.fee)} MEZO`,          inline: true },
      { name: "Compounded",value: `${ethers.formatEther(opts.amountCompounded)} MEZO`, inline: true },
      { name: "Net Gain",  value: `${ethers.formatEther(opts.profitability.netRewards)} MEZO`, inline: true },
      { name: "Gas Cost",  value: `${ethers.formatEther(opts.profitability.gasCost)} BTC`,    inline: true },
      { name: "Vault NFTs",value: String(opts.profitability.tokenCount),            inline: true },
    ],
    footer:    { text: "veMEZO Keeper Bot" },
    timestamp: new Date().toISOString(),
  };

  try {
    await postEmbed(url, embed);
  } catch {
    // Don't let notification failure break the keeper loop
  }
}

/**
 * Send an error / alert notification (uses DISCORD_ALERT_URL if set, else DISCORD_WEBHOOK_URL).
 */
export async function notifyError(message: string, context?: Record<string, unknown>): Promise<void> {
  const url = process.env.DISCORD_ALERT_URL ?? process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const contextStr = context
    ? Object.entries(context)
        .map(([k, v]) => `**${k}:** ${String(v)}`)
        .join("\n")
    : "";

  const embed: DiscordEmbed = {
    title:       "🚨 Keeper Alert",
    description: `${message}${contextStr ? `\n\n${contextStr}` : ""}`,
    color:       COLOUR.error,
    footer:      { text: "veMEZO Keeper Bot" },
    timestamp:   new Date().toISOString(),
  };

  try {
    await postEmbed(url, embed);
  } catch {
    // Swallow to avoid recursive alert loops
  }
}

/**
 * Send a "skipped — not profitable" info message.
 * Only fires if DISCORD_WEBHOOK_URL is set AND KEEPER_VERBOSE_NOTIFICATIONS=true.
 */
export async function notifySkipped(reason: string, profitability: ProfitabilityCheck): Promise<void> {
  if (process.env.KEEPER_VERBOSE_NOTIFICATIONS !== "true") return;
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const embed: DiscordEmbed = {
    title: "⏭ Compound Skipped",
    color: COLOUR.warning,
    fields: [
      { name: "Reason",       value: reason,                                               inline: false },
      { name: "Pending",      value: `${ethers.formatEther(profitability.pendingRewards)} MEZO`, inline: true },
      { name: "Gas Cost",     value: `${ethers.formatEther(profitability.gasCost)} BTC`,   inline: true },
      { name: "Vault NFTs",   value: String(profitability.tokenCount),                     inline: true },
    ],
    footer:    { text: "veMEZO Keeper Bot" },
    timestamp: new Date().toISOString(),
  };

  try {
    await postEmbed(url, embed);
  } catch {}
}

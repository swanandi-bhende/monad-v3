import { formatUnits } from "viem";
import { REWARD_TOKEN } from "@/lib/config/tokens";

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatAmount(amount: bigint, decimals: number, symbol: string) {
  const value = Number(formatUnits(amount, decimals));
  return `${value.toLocaleString("en-US", { maximumFractionDigits: Math.min(decimals, 4) })} ${symbol}`;
}

export function formatReward(amount: bigint) {
  return formatAmount(amount, REWARD_TOKEN.decimals, REWARD_TOKEN.symbol);
}

export function formatDateTime(seconds: number) {
  return new Date(seconds * 1000).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatCountdown(secondsLeft: number) {
  if (secondsLeft <= 0) return "Closed";
  const days = Math.floor(secondsLeft / 86_400);
  const hours = Math.floor((secondsLeft % 86_400) / 3_600);
  const minutes = Math.floor((secondsLeft % 3_600) / 60);
  const seconds = secondsLeft % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m ${seconds}s left`;
}

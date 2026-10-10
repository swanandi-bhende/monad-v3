import { formatUnits } from "viem";

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatAmount(amount: bigint, decimals: number, symbol: string) {
  const value = Number(formatUnits(amount, decimals));
  return `${value.toLocaleString("en-US", { maximumFractionDigits: decimals })} ${symbol}`;
}

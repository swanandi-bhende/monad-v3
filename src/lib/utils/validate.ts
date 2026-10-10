import { parseUnits } from "viem";

export function parseAmount(input: string, decimals: number) {
  const value = input.trim();
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const decimalPart = value.split(".")[1];
  if (decimalPart && decimalPart.length > decimals) return null;
  const amount = parseUnits(value, decimals);
  return amount > BigInt(0) ? amount : null;
}

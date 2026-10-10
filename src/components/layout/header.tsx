"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { MONAD_TESTNET } from "@/lib/config/chain";
import { formatAmount, shortAddress } from "@/lib/utils/format";

const NAV_LINKS = [
  { href: "/", label: "Board" },
  { href: "/post", label: "Post bounty" },
  { href: "/my-bounties", label: "My bounties" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected, isWrongNetwork, isConnecting, connect, disconnect } = useWallet();
  const { data: balance } = useBalance({
    address,
    chainId: MONAD_TESTNET.id,
    query: { enabled: isConnected && !isWrongNetwork },
  });

  return (
    <header className="border-line bg-canvas/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-body font-semibold tracking-tight">
            Proof<span className="text-accent">Bounty</span>
          </Link>
          <nav className="text-caption flex items-center gap-5">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-caption hidden items-center gap-2 rounded-full border px-2.5 py-1 sm:inline-flex ${
              isWrongNetwork ? "border-danger/40 text-danger" : "border-line text-muted"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${isWrongNetwork ? "bg-danger" : "bg-status-open"}`}
            />
            {isWrongNetwork ? "Wrong network" : MONAD_TESTNET.name}
          </span>
          {isConnected && address ? (
            <>
              {balance && !isWrongNetwork && (
                <span className="text-caption text-muted hidden font-mono md:inline">
                  {formatAmount(balance.value, balance.decimals, balance.symbol)}
                </span>
              )}
              <Button variant="secondary" onClick={() => disconnect()} className="font-mono">
                {shortAddress(address)}
              </Button>
            </>
          ) : (
            <Button onClick={connect} disabled={isConnecting}>
              {isConnecting ? "Connecting…" : "Connect wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

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
  { href: "/review", label: "Review & earn" },
  { href: "/post", label: "Post bounty" },
  { href: "/my-bounties", label: "My bounties" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const pathname = usePathname();
  const {
    address,
    isConnected,
    isWrongNetwork,
    isConnecting,
    connect,
    connectionError,
    disconnect,
  } = useWallet();
  const { data: balance } = useBalance({
    address,
    chainId: MONAD_TESTNET.id,
    query: { enabled: isConnected && !isWrongNetwork },
  });

  return (
    <header className="border-line/70 bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-display text-2xl tracking-tight">
            Gig-a-Chad
          </Link>
          <nav className="text-body hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
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
            className={`text-caption hidden items-center gap-2 rounded-full px-3 py-1.5 sm:inline-flex ${
              isWrongNetwork ? "bg-status-expired-bg text-danger" : "bg-surface text-muted"
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
                <span className="text-caption text-muted hidden font-mono lg:inline">
                  {formatAmount(balance.value, balance.decimals, balance.symbol)}
                </span>
              )}
              <Button variant="secondary" onClick={() => disconnect()} className="font-mono">
                {shortAddress(address)}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <Button onClick={connect} disabled={isConnecting}>
                {isConnecting ? "Connecting…" : "Connect wallet"}
                <span aria-hidden>→</span>
              </Button>
              {connectionError && (
                <span className="text-caption text-danger max-w-xs text-right">
                  {connectionError}
                </span>
              )}
            </div>
          )}
        </div>

        <nav className="text-body -mx-1 flex w-full items-center gap-6 overflow-x-auto md:hidden">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 transition-colors ${active ? "text-ink" : "text-muted"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

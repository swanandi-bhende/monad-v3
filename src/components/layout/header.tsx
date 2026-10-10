"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { shortAddress } from "@/utils/format";

const NAV_LINKS = [
  { href: "/board", label: "Board" },
  { href: "/post", label: "Post bounty" },
  { href: "/my-bounties", label: "My bounties" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

  return (
    <header className="border-line bg-surface border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-8">
          <Link href="/board" className="text-body font-semibold tracking-tight">
            ProofBounty
          </Link>
          <nav className="text-caption text-muted flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {isConnected && address ? (
          <button
            type="button"
            onClick={() => disconnect()}
            className="border-line text-caption hover:bg-canvas rounded-md border px-3 py-1.5 font-mono"
          >
            {shortAddress(address)}
          </button>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={isConnecting}
            className="bg-accent text-caption text-accent-ink rounded-md px-3 py-1.5 font-medium disabled:opacity-60"
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </header>
  );
}

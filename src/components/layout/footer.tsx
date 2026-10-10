import Link from "next/link";
import { MONAD_TESTNET } from "@/lib/config/chain";

const PRODUCT_LINKS = [
  { href: "/", label: "Board" },
  { href: "/post", label: "Post bounty" },
  { href: "/my-bounties", label: "My bounties" },
  { href: "/profile", label: "Profile" },
];

const NETWORK_LINKS = [
  { href: "https://docs.monad.xyz", label: "Monad docs" },
  { href: MONAD_TESTNET.blockExplorers.default.url, label: "Monadscan" },
  { href: "https://faucet.monad.xyz", label: "Testnet faucet" },
];

export function Footer() {
  return (
    <footer className="border-line/70 relative mt-24 overflow-hidden border-t">
      <div className="hero-aura pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-4xl tracking-tight">Gig-a-Chad</p>
          <p className="text-body text-muted max-w-sm">
            Post work, compete to deliver, and get paid from escrow. Built on Monad Testnet.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-caption text-muted tracking-wider uppercase">Menu</p>
          <ul className="font-display space-y-2 text-xl">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="decoration-accent decoration-2 underline-offset-4 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <p className="text-caption text-muted tracking-wider uppercase">Network</p>
          <ul className="font-display space-y-2 text-xl">
            {NETWORK_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="decoration-accent decoration-2 underline-offset-4 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="text-caption border-line/70 relative border-t">
        <div className="text-muted mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <p>Monad Testnet · chain ID 10143</p>
          <p>© 2026 Gig-a-Chad. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

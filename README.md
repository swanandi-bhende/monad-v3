# ProofBounty

**Post work. Compete to deliver. Prove the outcome. Get paid.**

ProofBounty is a permissionless bounty marketplace on [Monad](https://docs.monad.xyz). A creator posts a clearly defined task and locks an ERC-20 reward in a smart contract. Anyone can submit work before the on-chain deadline. The creator picks a winner, and the contract pays the reward directly to that wallet. If nothing is selected in time, the creator can reclaim the reward.

Submission for Monad Blitz Pune V3 (2026). This project runs on **Monad Testnet** only.

## Core workflow

1. **Create.** The creator sets the task metadata (title, description, category, selection method), a reward, and a deadline. The contract escrows the reward in the same transaction.
2. **Submit.** Anyone except the creator can submit work before the deadline. The contract rejects late submissions. The submission stores an evidence link or reference.
3. **Select.** The creator picks a winner while the bounty is open and before the review period ends. The contract checks the caller and the submission, marks the bounty completed, and transfers the escrowed reward to the winner.
4. **Refund.** If nothing is selected by `deadline + review period`, the creator can reclaim the reward. Completed and refunded bounties cannot be settled again.

Community credibility is secondary and is not part of the contract. Work history comes from completed bounties.

## How blockchain is used

- **Escrow.** The reward is transferred into the contract when the bounty is created.
- **Enforced deadlines.** Late submissions are rejected by the contract, not just hidden by the UI.
- **Direct payout.** The winner receives the reward in the same transaction that selects them.
- **Verifiable history.** Every create, submit, select, and refund emits an event that can be checked on the explorer.

x402 is not used for escrow or payouts. ERC-8004 is a possible future extension and is not part of this MVP.

## Why Monad

Bounties, submissions, and payouts are many small, independent transactions. Monad's high throughput and low fees make per-action on-chain records practical.

## Architecture

The repository has two independent workspaces:

- **Frontend** (repo root): Next.js App Router app in `src/`. It reads chain state and sends transactions through wagmi and viem.
- **Contracts** (`contracts/`): Foundry workspace with `ProofBounty.sol`, its tests, and its deploy script. It uses OpenZeppelin for `SafeERC20` and `ReentrancyGuard`.

The frontend consumes the contract ABI through `npm run abi:sync`, which copies the compiled ABI from `contracts/out` into `src/lib/contracts/abi.ts`. The deployed address comes from the environment.

## Tech stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript       |
| UI         | Tailwind CSS v4, Geist font via `next/font`         |
| Blockchain | viem, wagmi, TanStack Query                         |
| Wallet     | Injected wallets (MetaMask and others)              |
| Contracts  | Solidity 0.8.28, Foundry, OpenZeppelin 5.1          |
| Network    | Monad Testnet (chain ID 10143)                      |
| Quality    | ESLint, Prettier with `prettier-plugin-tailwindcss` |

## Folder structure

```
.
├── contracts/              Foundry workspace
│   ├── src/                ProofBounty.sol
│   ├── test/               Foundry tests
│   ├── script/             Deploy script
│   └── foundry.toml
├── scripts/                Repo tooling (ABI sync)
├── src/
│   ├── app/                Routes: board, post, bounty/[id], profile, my-bounties
│   ├── components/         ui, bounty, submission, forms, layout, providers
│   ├── hooks/              wallet, bounty, submission, transaction
│   ├── lib/
│   │   ├── config/         chain, env validation, reward token
│   │   ├── contracts/      generated ABI, contract address
│   │   ├── blockchain/     wagmi config, read and write helpers, tx helpers
│   │   └── utils/          formatting and validation
│   ├── types/              Bounty, Submission, User, Reputation, TransactionState
│   └── constants/          Bounty categories, selection methods, status labels
└── docs/                   Product and hackathon notes
```

## Prerequisites

- Node.js 20.9 or later, and npm
- [Foundry](https://getfoundry.sh) (`forge`, `cast`)
- A browser wallet (for example MetaMask) with Monad Testnet MON from the [faucet](https://faucet.monad.xyz)

## Install and run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 to see the bounty board.

The header has a **Connect wallet** button. Once connected, it shows the wallet's MON balance and address. If the wallet is on another network, a banner offers a **Switch network** button for Monad Testnet.

## Environment variables

Copy `.env.example` to `.env.local` for the frontend. Never commit real `.env` files.

| Variable                          | Required     | Purpose                                                                         |
| --------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_MONAD_RPC_URL`       | No           | Monad Testnet RPC for the browser. Defaults to `https://testnet-rpc.monad.xyz`. |
| `NEXT_PUBLIC_PROOFBOUNTY_ADDRESS` | After deploy | Deployed ProofBounty contract address (`0x…`).                                  |
| `MONAD_TESTNET_RPC_URL`           | Deploy only  | RPC used by Foundry (`contracts/foundry.toml`).                                 |
| `DEPLOYER_PRIVATE_KEY`            | Deploy only  | Deployer key, used by the deploy command. Never use the `NEXT_PUBLIC_` prefix.  |

`NEXT_PUBLIC_*` values are public and end up in the browser bundle. Deployment keys must never use that prefix.

Values are validated in `src/lib/config/env.ts`. An invalid URL or address stops the app with a clear error.

## Quality checks

```bash
npm run typecheck        # next typegen + tsc --noEmit
npm run lint             # ESLint
npm run format:check     # Prettier
npm run check            # all three
npm run build            # production build
```

Use `npm run format` to apply Prettier.

## Contracts

Dependencies in `contracts/lib` are not committed. Restore them once after cloning:

```bash
npm run contracts:install
```

```bash
npm run contracts:build  # forge build
npm run contracts:test   # forge test -vv
npm run contracts:fmt    # forge fmt --check
```

### Deploy to Monad Testnet

1. Fund the deployer address with testnet MON from the [faucet](https://faucet.monad.xyz).
2. Load the environment and deploy from the `contracts` directory. The review period is in seconds, and the default is one day:

   ```bash
   cd contracts
   set -a && . ../.env && set +a
   REVIEW_PERIOD=3600 forge script script/ProofBounty.s.sol:DeployProofBounty \
     --rpc-url "$MONAD_TESTNET_RPC_URL" \
     --private-key "$DEPLOYER_PRIVATE_KEY" \
     --broadcast
   cd ..
   ```

   For a keystore instead of a raw key, run `cast wallet import monad-deployer --private-key <KEY>` once and replace `--private-key "$DEPLOYER_PRIVATE_KEY"` with `--account monad-deployer`.

3. Copy the printed `ProofBounty deployed at` address and check it on [Monadscan](https://testnet.monadscan.com).

### Test reward token

The reward is paid in `tUSD`, a 6-decimal test ERC-20 (`contracts/src/TestUSD.sol`). Deploy it once, then mint to any wallet with `mint(address,uint256)`. The deployer receives 1,000 tUSD on deploy:

```bash
cd contracts
set -a && . ../.env && set +a
forge script script/TestUSD.s.sol:DeployTestUSD --rpc-url "$MONAD_TESTNET_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast
cd ..
```

### Connect the deployed contract to the frontend

1. Set `NEXT_PUBLIC_PROOFBOUNTY_ADDRESS` in `.env.local` to the deployed address.
2. Regenerate the ABI from the build:

   ```bash
   npm run abi:sync
   ```

3. Restart `npm run dev`.

## Deploy the frontend on Vercel

1. Import this repository in [Vercel](https://vercel.com/new).
2. Set the framework preset to Next.js. The default build command is `npm run build`.
3. Add the environment variables `NEXT_PUBLIC_MONAD_RPC_URL` and `NEXT_PUBLIC_PROOFBOUNTY_ADDRESS` in **Project Settings → Environment Variables**. Do not add deployer keys.
4. Deploy. Vercel rebuilds on each push to the connected branch.

## Network reference (Monad Testnet)

| Item         | Value                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| Chain ID     | 10143                                                                      |
| Currency     | MON                                                                        |
| RPC          | https://testnet-rpc.monad.xyz                                              |
| Explorer     | https://testnet.monadscan.com                                              |
| Faucet       | https://faucet.monad.xyz                                                   |
| Reward token | tUSD `0xCe233f627834e017097feFB53f4dfD2085A9B988` (6 decimals, test token) |

Source: [Monad docs](https://docs.monad.xyz/developer-essentials/testnet).

## License

See [LICENSE](LICENSE).

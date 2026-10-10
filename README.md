# ProofBounty

**Post work. Compete to deliver. Prove the outcome. Get paid.**

ProofBounty is a permissionless bounty marketplace on [Monad](https://docs.monad.xyz). A creator posts a clearly defined task and locks the reward in a smart contract. Anyone can submit work before the on-chain deadline. The creator picks a winner, and the contract pays the reward directly to that wallet. Every completed bounty leaves a verifiable work record that feeds a wallet-linked reputation.

Submission for Monad Blitz Pune V3 (2026). This project runs on **Monad Testnet** only.

## Core workflow

1. **Create.** The creator sets a title, description, reward, deadline, category, and selection method, then confirms one wallet transaction. The contract escrows the reward.
2. **Submit.** Anyone can submit work before the deadline. The contract rejects late submissions. Large files stay off-chain, and the contract stores a reference or hash.
3. **Evaluate.** The creator reviews submissions. Community credibility signals help compare them, but they do not decide payouts.
4. **Settle.** The creator selects a winner. The contract checks the caller, the submission, and that the reward has not been paid, then transfers the escrowed reward and marks the bounty completed.
5. **Record.** A completed bounty produces an on-chain record (bounty ID, creator, winner, reward, submission reference, timestamp, outcome) that contributes to reputation.

If the creator does not decide within the review period, the bounty can be refunded. Subjective work is never judged automatically.

## How blockchain is used

- **Escrow.** Rewards are locked before work begins, and the creator cannot withdraw them while the bounty is active.
- **Enforced deadlines.** Late submissions are rejected by the contract, not just hidden by the UI.
- **Verifiable settlement.** Payouts follow contract rules, with a transaction hash the user can check on the explorer.
- **Portable history.** Work outcomes are recorded on-chain and can be read by other applications.

## Why Monad

Small bounties and frequent submissions, votes, and payouts create many small transactions. Monad's high throughput, fast finality, and low fees make per-action on-chain records practical.

## Architecture

The repository has two independent workspaces:

- **Frontend** (repo root): Next.js App Router app in `src/`. It reads chain state and sends transactions through wagmi and viem.
- **Contracts** (`contracts/`): Foundry workspace with the Solidity contracts, tests, and deployment scripts.

The frontend consumes the contract ABI through `npm run abi:sync`, which copies the compiled ABI from `contracts/out` into `src/constants/abi.ts`. The deployed address comes from the environment.

## Tech stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript       |
| UI         | Tailwind CSS v4, Geist font via `next/font`         |
| Blockchain | viem, wagmi, TanStack Query                         |
| Wallet     | Injected wallets (MetaMask and others)              |
| Contracts  | Solidity 0.8.28, Foundry                            |
| Network    | Monad Testnet (chain ID 10143)                      |
| Quality    | ESLint, Prettier with `prettier-plugin-tailwindcss` |

## Folder structure

```
.
├── contracts/            Foundry workspace (Solidity, tests, deploy scripts)
│   ├── src/
│   ├── test/
│   ├── script/
│   └── foundry.toml
├── scripts/              Repo tooling (ABI sync)
├── src/
│   ├── app/              Routes: board, post, bounty/[id], profile, my-bounties
│   ├── components/       ui, bounty, submission, forms, layout, providers
│   ├── hooks/            wallet, bounty, submission, transaction
│   ├── lib/              env validation, wagmi config
│   ├── types/            Bounty, Submission, User, Reputation, TransactionState
│   ├── constants/        network, tokens, bounty options, generated ABI
│   └── utils/            formatting and validation helpers
└── docs/                 Product and hackathon notes
```

Each folder has a short `README.md` that explains what belongs in it.

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

Open http://localhost:3000. The app redirects to `/board`.

If your wallet is on another network, the app shows a banner with a button to switch to Monad Testnet.

## Environment variables

Copy `.env.example` to `.env.local` for the frontend. Never commit real `.env` files.

| Variable                          | Required     | Purpose                                                                         |
| --------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_MONAD_RPC_URL`       | No           | Monad Testnet RPC for the browser. Defaults to `https://testnet-rpc.monad.xyz`. |
| `NEXT_PUBLIC_PROOFBOUNTY_ADDRESS` | After deploy | Deployed ProofBounty contract address (`0x…`).                                  |
| `MONAD_TESTNET_RPC_URL`           | Deploy only  | RPC used by Foundry (`contracts/foundry.toml`).                                 |

`NEXT_PUBLIC_*` values are public and end up in the browser bundle. Deployment keys must never use that prefix.

Values are validated in `src/lib/env.ts`. An invalid URL or address stops the app with a clear error.

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

```bash
npm run contracts:build  # forge build
npm run contracts:test   # forge test -vv
npm run contracts:fmt    # forge fmt --check
```

### Deploy to Monad Testnet

1. Create a keystore for the deployer (recommended over a raw private key):

   ```bash
   cast wallet import monad-deployer --private-key <KEY>
   ```

2. Fund the deployer address with testnet MON from the faucet.
3. Set the RPC for Foundry:

   ```bash
   export MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
   ```

4. Deploy and broadcast:

   ```bash
   forge script contracts/script/<Script>.s.sol \
     --root contracts \
     --rpc-url monad_testnet \
     --account monad-deployer \
     --broadcast
   ```

5. Save the deployed address and check it on [MonadVision](https://testnet.monadvision.com).

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
3. Add the environment variables from the table above in **Project Settings → Environment Variables**. Use Monad Testnet values.
4. Deploy. Vercel rebuilds on each push to the connected branch.

## Network reference (Monad Testnet)

| Item         | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Chain ID     | 10143                                                          |
| Currency     | MON                                                            |
| RPC          | https://testnet-rpc.monad.xyz                                  |
| Explorer     | https://testnet.monadvision.com                                |
| Faucet       | https://faucet.monad.xyz                                       |
| Reward token | USDC `0x534b2f3A21130d7a60830c2Df862319e593943A3` (6 decimals) |

Source: [Monad docs](https://docs.monad.xyz/developer-essentials/testnet).

## License

See [LICENSE](LICENSE).

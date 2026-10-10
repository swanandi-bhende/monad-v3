# ProofBounty

**Post work. Compete to deliver. Prove the outcome. Get paid.**

Submission for Monad Blitz Pune V3 (2026). Runs on **Monad Testnet** (chain ID 10143) only.

## 1. What ProofBounty is

A permissionless bounty marketplace on Monad. A creator posts a task and locks an ERC-20 reward in a smart contract. Anyone can submit work before the deadline. The creator picks a winner, and the contract pays the reward straight to that wallet.

## 2. Problem

Freelance and open-source bounties depend on a platform to hold money and decide payouts. Creators can't prove the reward is actually funded, and workers can't prove the deadline or payout rules will be honored. Work history also lives in a platform's database, so it can't move with the worker.

## 3. Solution

- The reward is escrowed on-chain when the bounty is created.
- The deadline is enforced by the contract, not by a UI countdown.
- Payout happens in the same transaction as the creator's winner selection.
- Every step emits an event, so the activity and work history can be checked on the explorer.

## 4. Architecture

- **Frontend** (repo root): Next.js 16 App Router, React 19, TypeScript, Tailwind v4. wagmi and viem talk to Monad Testnet directly. TanStack Query polls the chain.
- **Contracts** (`contracts/`): Foundry, Solidity 0.8.28, OpenZeppelin 5.1.
  - `ProofBounty.sol`: escrow and lifecycle.
  - `SubmissionCredibility.sol`: community signals, kept separate so the escrow contract stays minimal.
  - `TestUSD.sol`: test reward token (tUSD, 6 decimals).
- **No backend, database, or indexer.** Bounties are read with a batched Multicall3 request. Activity and work history come from contract events, scanned in 100-block ranges and cached in the browser.

## 5. Bounty lifecycle

| Stage           | Who                   | Rule enforced by the contract                                    |
| --------------- | --------------------- | ---------------------------------------------------------------- |
| Create and fund | Creator               | Reward moves into escrow. Deadline must be in the future.        |
| Submit          | Anyone except creator | Only before the deadline. Evidence must be non-empty.            |
| Under review    | Creator               | After the deadline, until the review period ends.                |
| Select winner   | Creator only          | Before the review period ends. One settlement per bounty.        |
| Expired         | Creator               | No winner by `deadline + review period`. Submissions are closed. |
| Refund          | Creator only          | Only after the review period, and only if still unresolved.      |

## 6. Escrow and payout mechanism

- `createBounty` pulls the reward with `SafeERC20.safeTransferFrom` and holds it in the contract.
- `selectWinner` sets the bounty to `Completed`, then transfers the reward to the winner with `safeTransfer`. State is updated before the transfer.
- `refund` sets the bounty to `Refunded`, then returns the reward to the creator.
- `ReentrancyGuard` protects every state-changing function.
- The UI shows a payout only after the chain reports the bounty as `Completed`. The transaction panel shows "Pending" until the receipt confirms.

## 7. Reputation and work-history model

Deliberately simple, and computed from on-chain facts only:

- **Bounties won**: `WinnerSelected` events where the wallet is the winner.
- **Completed bounties**: bounties the wallet submitted to that were completed.
- **Total rewards earned**: sum of rewards paid to the wallet.
- **Credible signals received**: shown as supporting context only. It never changes payouts, and it never lowers reputation.

Work history lists each win with its reward, completion time, and a Monadscan link.

## 8. ERC-8004 integration boundary

Not implemented. ERC-8004 identity and reputation registries are a future extension. The current reputation is wallet-linked and derived from ProofBounty events, which could later be published to an ERC-8004 registry. No ERC-8004 code or addresses are used.

## 9. x402 future role

Not used for escrow or payouts. A future role is paid metadata: an agent or service could pay per request through x402 for bounty discovery or external evaluation, while escrow stays in ProofBounty.

## 10. Monad Testnet

| Item     | Value                         |
| -------- | ----------------------------- |
| Chain ID | 10143                         |
| Currency | MON                           |
| RPC      | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monadscan.com |
| Faucet   | https://faucet.monad.xyz      |

The app is configured for this chain only. A wrong-network banner offers to switch, and every write checks the chain before sending.

## 11. Contract addresses

| Contract                                  | Address                                      | Verification          |
| ----------------------------------------- | -------------------------------------------- | --------------------- |
| ProofBounty (escrow, 120 s review period) | `0x18B257eF370A2Cd9f600d874d00FEbbCcc25bAf0` | Sourcify: exact match |
| SubmissionCredibility                     | `0x19b607De70fBB2a6c12Fa2c5697FC400fe48eC57` | Sourcify: exact match |
| TestUSD (reward token, tUSD)              | `0xCe233f627834e017097feFB53f4dfD2085A9B988` | Sourcify: exact match |

Check any address on [Monadscan](https://testnet.monadscan.com/address/0x18B257eF370A2Cd9f600d874d00FEbbCcc25bAf0).

**Superseded deployments (do not use):** the earlier ProofBounty `0xEc238754ffb9a846Ba52718D0a78E72878747702` (one-hour review period) and its credibility contract `0xAB010c9Bfdc5513ecADC95f66AEc0C6070bF15F6` were replaced for demo timing. The app does not reference them. Bounties on those contracts are not shown.

## 12. Live URL

`https://<your-vercel-project>.vercel.app` (placeholder: set after deploying, see below)

## 13. How to run locally

Prerequisites: Node.js 20.9+, npm, [Foundry](https://getfoundry.sh), and a browser wallet with Monad Testnet MON from the faucet.

```bash
npm install
cp .env.example .env.local      # then fill in the addresses below
npm run dev                      # http://localhost:3000
```

Set these in `.env.local` (values are the deployed addresses above):

```
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_PROOFBOUNTY_ADDRESS=0x18B257eF370A2Cd9f600d874d00FEbbCcc25bAf0
NEXT_PUBLIC_CREDIBILITY_ADDRESS=0x19b607De70fBB2a6c12Fa2c5697FC400fe48eC57
NEXT_PUBLIC_PROOFBOUNTY_DEPLOY_BLOCK=69793560
```

Contract tests and deployment:

```bash
npm run contracts:install        # fetch forge-std and OpenZeppelin (not committed)
npm run contracts:test           # 30 tests
npm run abi:sync                 # regenerate the frontend ABIs after changing contracts
```

Checks and build:

```bash
npm run check                    # typecheck + lint + format check
npm run build
```

**Vercel:** import the repo, keep the Next.js preset, and set the four `NEXT_PUBLIC_*` variables above in Project Settings → Environment Variables. Do not add deployer keys. `NEXT_PUBLIC_*` values are read at build time, so redeploy after changing them.

## 14. Known limitations

- **Review period is 120 seconds on the live deployment** for demo speed. Redeploy with `REVIEW_PERIOD` to change it.
- **Activity and work history load slowly on first visit.** The public RPC allows only 100-block log queries, so the browser scans history once and caches it. Expect one to two minutes on a fresh browser.
- **Tested with an injected wallet in a scripted browser,** not with MetaMask directly.
- **Mobile wallets and WalletConnect** are not set up.
- **Credibility** is one signal per wallet, with no weighting or reputation effect, by design.
- **Reward token** is a test ERC-20 with open minting. It has no real value.
- **Contract verification** uses Sourcify. Monadscan's own verification was not run.

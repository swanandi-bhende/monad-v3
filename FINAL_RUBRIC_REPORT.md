# Gig-a-Chad — Monad Blitz Pune V3 Rubric

Point values are as listed in the brief. The rubric screenshots did not reach me, so confirm the values against them.
Source documents: `RUBRIC_AUDIT.md`, `FEATURE_VERIFICATION.md`, `BUILD_IN_PUBLIC.md`.

## Basic Points

| Criterion                           | Points | Status  | Evidence                                                                                                                                                                                                           |
| ----------------------------------- | -----: | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public GitHub repository            |     25 | FAIL    | `github.com/swanandi-bhende/monad-v3` returns 404 without login. Make it public, then push.                                                                                                                        |
| Proper README                       |     25 | PARTIAL | Core sections exist. Contract addresses updated to GigAChad. No placeholders. Roadmap, judge demo section, and clean-clone test still missing.                                                                     |
| Contracts deployed on Monad Testnet |     25 | PASS    | GigAChad `0x05eDeEAC6f366073c0dE30a831306ACA816E9441` and TestUSDC `0x3f21FDdb6bF994275BCAc18db1042f02bf09632d`. Bytecode present on chain 10143. Sourcify exact match for both. The app's env points to GigAChad. |
| Project publicly hosted             |     25 | PASS    | `https://monad-v3-nvrawtq21-swanandi-bhendes-projects.vercel.app` returns 200. Five routes load in headless Chrome with no config error and no console errors.                                                     |

Basic points secured: **50 of 100**. The two open items are both required for prize eligibility.

## Advanced Points

### Project Working

| Criterion                        | Points | Status  | Evidence                                                                                                                                                                                                                                                                                       |
| -------------------------------- | -----: | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All announced functions work     |     25 | PARTIAL | See `FEATURE_VERIFICATION.md`. Verified on chain: bounty creation, submissions, file upload, transaction states, explorer links. Verified on the old deployment: payout, refund. Contract tests cover review, reviewer rewards, and selection on GigAChad. Not yet run end to end on GigAChad. |
| Live transaction during demo     |     25 | PARTIAL | Real Monad Testnet transactions exist, for example `0xf6f7a2b483c0…` and `0xd0537347060…` on the old deployment. A complete GigAChad demo run has not been finished.                                                                                                                           |
| Contract verified on explorer    |     25 | FAIL    | Sourcify exact match only. Monadscan verification not run.                                                                                                                                                                                                                                     |
| Someone else can run from README |     25 | FAIL    | Not tested from a clean clone.                                                                                                                                                                                                                                                                 |

Project Working secured: **0 counted**. The items above are either partial or unverified on the current deployment.

### Build in Public

| Criterion                                 | Points | Status       | Evidence                                                                      |
| ----------------------------------------- | -----: | ------------ | ----------------------------------------------------------------------------- |
| Project posts on X and LinkedIn with tags |      — | NOT VERIFIED | Copy ready in `BUILD_IN_PUBLIC.md`. READY FOR MANUAL ACTION.                  |
| Demo video (30 s or more)                 |      — | NOT VERIFIED | Script and storyboard ready in `BUILD_IN_PUBLIC.md`. READY FOR MANUAL ACTION. |
| Creative advertisement video              |      — | NOT VERIFIED | Concept ready in `BUILD_IN_PUBLIC.md`. READY FOR MANUAL ACTION.               |
| 5K+ combined views                        |      — | NOT VERIFIED | Needs real posts. Evidence checklist in `BUILD_IN_PUBLIC.md`.                 |

Build in Public secured: **0**. Nothing is earned until posts, videos, and view counts exist.

## Bonus Points

| Criterion                      | Points | Status         | Evidence                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | -----: | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mainnet deployment             |      — | NOT APPLICABLE | Excluded by the brief.                                                                                                                                                                                                                                                                                                                                                          |
| Custom domain                  |      — | NOT APPLICABLE | Excluded by the brief.                                                                                                                                                                                                                                                                                                                                                          |
| Pre-market fit                 |  bonus | PARTIAL        | Target users: developers, designers, creators, and digital workers doing clearly defined microtasks. Problem: freelance platforms take fees, hold funds, and make work history platform-locked. Workers come for paid tasks, creators for finished work, reviewers for review rewards. Each side makes the others more valuable. Shown on the home page. Not yet in the README. |
| Revenue potential and strategy |  bonus | PARTIAL        | Transparent protocol fee in the contract: 5% under 50 USDC, 4% from 50 to 500, 3% above 500, paid only on a winner payout. Reviewer pool is 10% of the reward, paid per review. Shown in the UI economics panel. Tested in `GigAChad.t.sol`. Revenue is zero until real bounties run. Not yet documented in the README.                                                         |
| Innovation and originality     |  bonus | PARTIAL        | Three features built: a work marketplace, an evaluation marketplace with rubric scoring and reviewer rewards, and portable builder and reviewer reputation from on-chain events. Not yet stated in the README.                                                                                                                                                                  |

Bonus secured: **0 counted**, pending README and pitch updates.

## Total Achievable

- Basic points secured: **50 of 100**.
- Advanced points secured: **0 counted of 200**. Several items are partial and need the live GigAChad demo and the clean-clone test.
- Build in Public secured: **0 of 100**.
- Bonus secured: **0 counted of 100**.

**Total secured today: 50 of 400 points.** Achievable total is higher once the open items below are done.

## Remaining Manual Actions

1. Make the GitHub repository public and push `main`. Confirm the URL opens in a logged-out browser.
2. Run Monadscan verification for GigAChad and TestUSDC if the judges require explorer verification, then give me the link so I can add it to the README.
3. Post the project announcement on X and LinkedIn with the tags from `BUILD_IN_PUBLIC.md`.
4. Record the demo video (30 seconds or more) and the advertisement video.
5. Collect 5,000+ combined views before the submission deadline.
6. Run the full demo on the live site and record its transaction hashes.

## Final Demo Checklist

Rehearse once before judging. Use three wallets: A (creator), B (worker), R (reviewer). Fund each with MON from the faucet, and claim test USDC for A.

1. Open the live site. Show the home page: three paths, and the economics.
2. Wallet A: connect. Go to Post bounty. Claim 100 USDC. Fill the title, deliverables, acceptance criteria, rubric (weights total 100%), reward 10, two reviewer slots, and a deadline about two minutes out. Show the economics panel. Click "Create and fund bounty". Show "Waiting for wallet", then "Pending", then "Confirmed". Approve and create are two transactions.
3. Wallet B: connect. Open the bounty. Write the overview, add a GitHub link and a demo link, upload a file. Submit. Show the confirmed state.
4. Wait for the deadline. Show the bounty status change to "Under review".
5. Wallet R: connect. Open Review & earn. Open the bounty. Read the deliverables and rubric. Score each criterion (0–10). Write feedback. Submit evaluation. Show "Reward pending", then "earned" only after confirmation.
6. Wallet A: open the bounty. Show the community evaluation (scores and review counts). Click "Select winner". Show the transaction states. When confirmed, show "Settled on-chain" with the amounts and the Monadscan link.
7. Wallet B: open Profile. Show the builder record and the won bounty with its transaction link.
8. Wallet R: open Profile. Show the reviewer record and the review reward.
9. Open the Monadscan link from step 6. Show the transaction.

Before judging, run this once end to end and confirm each step works on the live site.

# App routes

Next.js App Router. Each folder is a route segment, and `page.tsx` makes it reachable.

- `board`: public bounty marketplace with filters and the activity feed.
- `post`: form to create and fund a bounty.
- `bounty/[id]`: bounty detail, submissions, and winner selection.
- `profile`: reputation and completed-bounty history.
- `my-bounties`: bounties posted or submitted by the connected wallet.

Put route-only layouts and loading states here. Reusable UI belongs in `src/components`. Data access belongs in `src/hooks`.

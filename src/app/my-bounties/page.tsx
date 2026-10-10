import { MyBountiesView } from "@/components/bounty/my-bounties-view";

export default function MyBountiesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-display font-bold tracking-tight">My bounties</h1>
        <p className="text-body text-muted">
          Track the bounties you posted and the work you submitted.
        </p>
      </div>
      <MyBountiesView />
    </main>
  );
}

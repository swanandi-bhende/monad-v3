import { PostBountyForm } from "@/components/forms/post-bounty-form";

export default function PostBountyPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-10 space-y-2">
        <h1 className="text-display font-semibold tracking-tight">Post a bounty</h1>
        <p className="text-body text-muted">
          Lock a reward in escrow. Winners are paid directly from the contract when you select them.
        </p>
      </div>
      <PostBountyForm />
    </main>
  );
}

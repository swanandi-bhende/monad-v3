export default async function BountyDetailPage({ params }: PageProps<"/bounty/[id]">) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-display font-semibold tracking-tight">Bounty {id}</h1>
      <p className="text-muted mt-2">Bounty details and submissions will appear here.</p>
    </main>
  );
}

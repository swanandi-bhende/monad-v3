import { notFound } from "next/navigation";
import { BountyDetail } from "@/components/bounty/bounty-detail";

export default async function BountyPage({ params }: PageProps<"/bounty/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <BountyDetail id={BigInt(id)} />
    </main>
  );
}

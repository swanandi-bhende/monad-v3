import { notFound } from "next/navigation";
import { ReviewWorkspace } from "@/components/review/review-workspace";

export default async function ReviewWorkspacePage({ params }: PageProps<"/review/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <ReviewWorkspace id={BigInt(id)} />
    </main>
  );
}

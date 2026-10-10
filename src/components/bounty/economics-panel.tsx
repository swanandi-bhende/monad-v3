import { computeSplit } from "@/lib/config/economics";
import { formatAmount } from "@/lib/utils/format";
import { REWARD_TOKEN } from "@/lib/config/tokens";

function money(amount: bigint) {
  return formatAmount(amount, REWARD_TOKEN.decimals, REWARD_TOKEN.symbol);
}

export function EconomicsPanel({ reward }: { reward: bigint }) {
  const split = computeSplit(reward);
  const rows = [
    { label: "Winner receives", value: split.winner, note: "Paid to the selected submission" },
    {
      label: "Reviewer pool",
      value: split.reviewPool,
      note: "10% · paid per review as it is submitted",
    },
    {
      label: "Protocol fee",
      value: split.fee,
      note: `${split.feeBps / 100}% tier · paid only on a winner payout`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-body font-medium">{row.label}</p>
              <p className="text-caption text-muted">{row.note}</p>
            </div>
            <p className="text-body font-mono">{money(row.value)}</p>
          </div>
        ))}
      </div>
      <div className="border-line flex items-center justify-between border-t pt-4">
        <p className="text-body font-medium">Total funded</p>
        <p className="text-body font-mono font-medium">{money(split.reward)}</p>
      </div>
      <p className="text-caption text-muted">
        If nobody wins, the escrow returns to you minus any review rewards already paid. The
        protocol fee is never charged on a refund.
      </p>
    </div>
  );
}

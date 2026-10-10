import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readBountiesWithSubmissions, readBountyWithSubmissions } from "@/lib/blockchain/read";

const POLL_MS = 10_000;

export function useBounties() {
  return useQuery({
    queryKey: ["bounties"],
    queryFn: readBountiesWithSubmissions,
    refetchInterval: POLL_MS,
  });
}

export function useBounty(id: bigint) {
  return useQuery({
    queryKey: ["bounty", id.toString()],
    queryFn: () => readBountyWithSubmissions(id),
    refetchInterval: POLL_MS,
  });
}

export function useRefreshBounties() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["bounties"] });
    queryClient.invalidateQueries({ queryKey: ["bounty"] });
  };
}

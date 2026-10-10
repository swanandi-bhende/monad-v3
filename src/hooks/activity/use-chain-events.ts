import { useQuery } from "@tanstack/react-query";
import { syncChainEvents } from "@/lib/blockchain/events";

export function useChainEvents() {
  return useQuery({
    queryKey: ["chain-events"],
    queryFn: syncChainEvents,
    refetchInterval: 15_000,
    retry: 2,
  });
}

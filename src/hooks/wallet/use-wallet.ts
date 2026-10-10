import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { MONAD_TESTNET } from "@/constants/network";

export function useWallet() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  return {
    address,
    isConnected,
    isWrongNetwork: isConnected && chainId !== MONAD_TESTNET.id,
    isConnecting,
    isSwitching,
    connect: () => connect({ connector: connectors[0] }),
    disconnect,
    switchToMonadTestnet: () => switchChain({ chainId: MONAD_TESTNET.id }),
  };
}

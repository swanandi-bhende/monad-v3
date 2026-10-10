import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { MONAD_TESTNET } from "@/lib/config/chain";

const NO_WALLET =
  "No wallet detected. Install MetaMask or another EVM wallet, then reload this page.";

export function useWallet() {
  const [localError, setLocalError] = useState<string | null>(null);
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, error: connectError, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  function connectWallet() {
    const connector = connectors[0];
    if (!connector) {
      setLocalError(NO_WALLET);
      return;
    }
    setLocalError(null);
    connect({ connector });
  }

  const rawError = connectError?.message;
  const connectionError =
    localError ??
    (rawError && /reject|denied/i.test(rawError)
      ? "Connection was rejected in your wallet."
      : rawError && /provider/i.test(rawError)
        ? NO_WALLET
        : rawError
          ? "Could not connect to your wallet. Unlock it and try again."
          : null);

  return {
    address,
    isConnected,
    isWrongNetwork: isConnected && chainId !== MONAD_TESTNET.id,
    isConnecting,
    isSwitching,
    connectionError,
    connect: connectWallet,
    disconnect,
    switchToMonadTestnet: () => switchChain({ chainId: MONAD_TESTNET.id }),
  };
}

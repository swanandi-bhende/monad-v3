import { defineChain } from "viem";

export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_TESTNET_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_TESTNET_EXPLORER_URL = "https://testnet.monadvision.com";

export const MONAD_TESTNET = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [MONAD_TESTNET_RPC_URL] } },
  blockExplorers: { default: { name: "MonadVision", url: MONAD_TESTNET_EXPLORER_URL } },
  testnet: true,
});

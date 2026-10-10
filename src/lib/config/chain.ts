import { defineChain } from "viem";

export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_TESTNET_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_TESTNET_EXPLORER_URL = "https://testnet.monadscan.com";

export const MONAD_TESTNET = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [MONAD_TESTNET_RPC_URL] } },
  blockExplorers: { default: { name: "Monadscan", url: MONAD_TESTNET_EXPLORER_URL } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
  testnet: true,
});

export const MIN_GAS_BALANCE_WEI = BigInt(10) ** BigInt(16);

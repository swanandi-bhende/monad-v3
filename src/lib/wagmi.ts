import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { MONAD_TESTNET } from "@/constants/network";
import { env } from "@/lib/env";

export const wagmiConfig = createConfig({
  chains: [MONAD_TESTNET],
  connectors: [injected()],
  transports: { [MONAD_TESTNET.id]: http(env.monadRpcUrl) },
  ssr: true,
});

import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors"; // For Metamask and injected wallets

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(), // It supports Metamask and other injected wallets
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"), //RPC URL for connecting to Base network
  },
});

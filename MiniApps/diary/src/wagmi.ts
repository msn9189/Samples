import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors"; // Supports Metamask and injected wallets

export const config = createConfig({
  chains: [base], // Configure Base network
  connectors: [
    injected(), // Enable MetaMask and other injected wallets
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"), // Base network RPC URL
  },
});

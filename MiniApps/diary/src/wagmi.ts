import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors"; // Supports Metamask and injected wallets
import frame from "@farcaster/frame-wagmi-connector";

export const config = createConfig({
  chains: [base], // Configure Base network
  connectors: [
    frame(), // Enable Farcaster in-app wallet connector
    injected(), // Enable MetaMask and other injected wallets
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"), // Base network RPC URL
  },
});

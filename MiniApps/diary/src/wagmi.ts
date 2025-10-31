import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors"; // Supports Metamask and injected wallets
import frame from "@farcaster/frame-wagmi-connector";

export const config = createConfig({
  chains: [base], // Configure Base network
  connectors: [
    frame(), // Enable Farcaster in-app wallet connector
    injected(),
    walletConnect({
      projectId:
        (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string) || "",
      metadata: {
        name: "Diary MiniApp",
        description: "A MiniApp to write and mint memories on Base network",
        url: "https://diaryminiapp.vercel.app",
        icons: ["https://diaryminiapp.vercel.app/DiaryLogo.jpg"],
      },
    }), // Enable MetaMask and other injected wallets
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"), // Base network RPC URL
  },
});

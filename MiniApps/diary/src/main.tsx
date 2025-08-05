import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import App from "./App.tsx";
import { config } from "./wagmi.ts";

import { sdk } from "@farcaster/miniapp-sdk";
import dotenv from 'dotenv';
import "./index.css";

// Load environment variabled from .env
dotenv.config();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);

// Farcaster Frame initialization
sdk.actions.ready()
// sdk.actions.ready({
//   target: window.location.href, // Current URL as target
//   buttons: [
//     {
//       label: "Mint Memory", //Button label for Frame
//       action: "post", // Action type for Farcaster
//       actionBody: { type: "text", value: "Minting via Frame..."}, // Message during mint
//     },
//   ],
//   image: "https://",
//   postUrl: window.location.href, // URL to handle Fram posts
// });


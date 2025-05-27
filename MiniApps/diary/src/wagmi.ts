import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors"; // برای MetaMask و کیف‌پول‌های تزریقی

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(), // این MetaMask و سایر کیف‌پول‌های تزریقی رو ساپورت می‌کنه
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"), // یا RPC URL خودت
  },
});

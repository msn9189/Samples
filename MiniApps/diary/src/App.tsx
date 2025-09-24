import React, { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbi } from "viem";
import PinataSDK from "@pinata/sdk";
import "./index.css";
import { sdk } from "@farcaster/miniapp-sdk";

// -----------------------------
// App behavior (Diary Miniapp):
// 1) User writes a memory.
// 2) Memory is pinned to IPFS (Pinata).
// 3) IPFS hash is sent to the smart contract mintDiary(ipfsHash).
// 4) Transaction hash is shown to the user after mining.
// -----------------------------

const CONTRACT_ADDRESS = "0x5df26eAa1753cf24Ead918b3372Be1f0C517dDE9";
const CONTRACT_ABI = parseAbi([
  "function mintDiary(string memory ipfsHash) public returns (uint256)",
  "event DiaryMinted(uint256 indexed tokenId, address indexed recipient, string ipfsHash)",
  "function tokenIds(uint256 tokenId) public view returns (uint256)",
]);

export default function App() {
  // --- app state
  const [memory, setMemory] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // --- wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const { writeContract, data: txHashData } = useWriteContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "mintDiary",
  } as any);

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHashData,
  });

  // --- Call sdk.actions.ready() as early as possible after mount
  // This informs the Farcaster frame that the miniapp is ready and the splash screen may be hidden.
  useEffect(() => {
    (async () => {
      try {
        if (!sdk || !sdk.actions || typeof sdk.actions.ready !== "function") {
          console.warn(
            "Farcaster miniapp SDK not available or sdk.actions.ready missing"
          );
          return;
        }

        // Keep this call minimal and fast. No long awaits here.
        await sdk.actions.ready({
          image:
            import.meta.env.VITE_FRAME_IMAGE_URL ||
            "https://diaryminiapp.vercel.app/DiaryLogo.jpg",
          postUrl: window.location.href,
        });

        console.log("Farcaster sdk.actions.ready() called successfully");
      } catch (err) {
        console.error("sdk.actions.ready() failed:", err);
      }
    })();
  }, []);

  // --- Optional: pin content to Pinata (example)
  const pinToPinata = async (text: string) => {
    try {
      const pinata = new PinataSDK(
        import.meta.env.VITE_PINATA_API_KEY || "",
        import.meta.env.VITE_PINATA_API_SECRET || ""
      );
      const result = await pinata.pinJSONToIPFS({
        content: { memory: text, timestamp: Date.now() },
      });
      return result.IpfsHash;
    } catch (err) {
      console.error("Pinata pin failed:", err);
      return null;
    }
  };

  // --- handle mint (via contract write)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return setStatus("Write something first");

    setStatus("Pinning to IPFS...");
    const ipfsHash = await pinToPinata(memory);
    if (!ipfsHash) return setStatus("Pin failed");

    setStatus("Sending transaction...");

    try {
      await writeContract({
        args: [ipfsHash],
      } as any);

      setStatus("Transaction sent, waiting for receipt...");
    } catch (err: any) {
      console.error("writeContract failed:", err);
      setStatus(`Error: ${err?.message ?? String(err)}`);
    }
  };

  return (
    <div className="app-container">
      <h1>Diary Miniapp</h1>

      <div style={{ marginBottom: 12 }}>
        {isConnected ? (
          <div>
            <span>Connected: {address}</span>
            <button onClick={() => disconnect()}>Disconnect</button>
          </div>
        ) : (
          <button onClick={() => connect({ connector: connectors[0] })}>
            Connect Wallet
          </button>
        )}
      </div>

      <p>{status}</p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          placeholder="Write your memory here..."
          rows={5}
          style={{ width: "100%", padding: "10px" }}
        />
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={isLoading || !isConnected}>
            {isLoading ? "Minting..." : "Mint Memory on Base"}
          </button>
        </div>
      </form>

      {isSuccess && txHashData && (
        <div style={{ marginTop: 12 }}>
          <p>Memory minted! Transaction Hash:</p>
          <a
            href={`https://basescan.org/tx/${txHashData}`}
            target="_blank"
            rel="noreferrer"
          >
            {txHashData}
          </a>
        </div>
      )}
    </div>
  );
}

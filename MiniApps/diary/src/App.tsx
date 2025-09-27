import React, { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbi } from "viem";
import "./index.css";
import { sdk } from "@farcaster/miniapp-sdk";

// -----------------------------
// Diary Miniapp flow:
// 1) User writes memory
// 2) Pin to IPFS
// 3) Mint NFT via contract (Base network)
// 4) Show transaction hash
// -----------------------------

const CONTRACT_ADDRESS = "0x5df26eAa1753cf24Ead918b3372Be1f0C517dDE9";
const CONTRACT_ABI = parseAbi([
  "function mintDiary(string memory ipfsHash) public returns (uint256)",
  "event DiaryMinted(uint256 indexed tokenId, address indexed recipient, string ipfsHash)",
  "function tokenIds(uint256 tokenId) public view returns (uint256)",
]);

export default function App() {
  // --- state
  const [memory, setMemory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // --- wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // writeContract hook
  const writeResult = useWriteContract();
  const writeContract = writeResult.writeContract;
  const txHash = writeResult.data as string | undefined;

  // wait for tx receipt
  const { isLoading: waitingForReceipt, isSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash as any,
    });

  useEffect(() => {
    // notify Farcaster that app is ready
    (async () => {
      try {
        if (!sdk?.actions?.ready) return;

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

  // pin to IPFS
  const pinToPinata = async (text: string) => {
    try {
      const resp = await fetch("/api/pinToIpfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: text }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("Pin API error:", data);
        return null;
      }
      return data.IpfsHash; // CID
    } catch (err) {
      console.error("Pin API request failed:", err);
      return null;
    }
  };

  // handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return setStatus("Write something first");

    if (!isConnected) {
      try {
        await connect({ connector: connectors[0] });
      } catch (err: any) {
        return setStatus("Please connect your wallet.");
      }
    }

    setStatus("Pinning to IPFS...");
    const cid = await pinToPinata(memory);
    if (!cid) return setStatus("Pin failed");

    const payload = cid.startsWith("ipfs://") ? cid : `ipfs://${cid}`;

    setStatus("Sending transaction...");
    try {
      setIsSending(true);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mintDiary",
        args: [payload],
      } as any);

      setStatus("Transaction sent, waiting for receipt...");
    } catch (err: any) {
      console.error("writeContract failed:", err);
      setIsSending(false);
      setStatus(`Error: ${err?.message ?? String(err)}`);
    }
  };

  // when receipt is confirmed
  useEffect(() => {
    if (isSuccess) {
      setIsSending(false);
      setStatus("Memory minted successfully!");
    }
  }, [isSuccess]);

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
          <button
            type="submit"
            disabled={isSending || waitingForReceipt || !isConnected}
          >
            {isSending || waitingForReceipt
              ? "Minting..."
              : "Mint Memory on Base"}
          </button>
        </div>
      </form>

      {isSuccess && txHash && (
        <div style={{ marginTop: 12 }}>
          <p>Memory minted! Transaction Hash:</p>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
}

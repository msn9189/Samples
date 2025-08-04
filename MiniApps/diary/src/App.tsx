import { useState } from "react";
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

// Contract address deployed on Base network
const contractAddress = "0x5df26eAa1753cf24Ead918b3372Be1f0C517dDE9"; 
const contractAbi = parseAbi([
  "function mintDiary(string memory ipfsHash) public returns (uint256)",
  "event DiaryMinted(uint256 indexed tokenId, address indexed recipient, string ipfsHash)",
  "function tokenIds(uint256 tokneId) public view returns (uint256)",
]);

// Initialize Pinata SDK with environment variables from .env
const pinata = new PinataSDK({
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY || "",
  pinataSecretApiKey: import.meta.env.VITE_PINATA_API_SECRET || "",
});

export default function App() {
  const [memory, setMemory] = useState<string>(""); // State for user memory input
  const [txHash, setTxHash] = useState<string | null>(null); // State for transaction hash
  const [status, setStatus] = useState<string>(""); // State for minting status
  const { address, isConnected } = useAccount(); // Wallet connection status
  const { connect, connectors } = useConnect(); // Wallet connection handlers
  const { disconnect } = useDisconnect(); // Wallet disconnect handler
  const { writeContract, data: txHashData } = useWriteContract(); // Contract write function
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHashData,
  }); // Transaction receipt status

  // Handle form submission to mint NFT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setStatus("Please connect your wallet first!");
      return;
    }
    if (!memory) {
      setStatus("Please enter a memory!");
      return;
    }

    setStatus("Uploading to IPFS...");
    try{
      const metadata = {
        name: "Diary Entry",
        description: "A personal memory",
        content: memory,
        data: new Date().toISOString(),
      };

      const result = await pinata.pinJSONToIPFS(metadata);
      const ipfsHash = result.IpfsHash;

      setStatus("Minting NFT ...");
      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "mintDiary",
        args: [ipfsHash],
      });
      setTxHash(txHashData || null);
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    }
  };

  // Handle minting via Farcaster Frame
  const handleFrameMint = async () => {
    if(!isConnected || !memory) return;
    setStatus("Processing Frame mint...");
    const ipfsHash = (await pinata.pinJSONToIPFS({
      name: "Diary Entry",
      description: "A personal memory",
      content: memory,
      date: new Date().toISOString(),
    })).IpfsHash;
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "mintDiary",
      args: [ipfsHash],
    });
    setTxHash(txHashData || null);
  };

  return (
    <div className="app">
      <h1>Diary MiniApp</h1>
      <div style={{ marginBottom: "20px" }}>
        {isConnected ? (
          <div>
            <p>
              Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <button
              onClick={() => disconnect()}
              style={{ backgroundColor: "#ff4d4d" }}
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <button onClick={() => connect({ connector: connectors[0] })}>
            Connect Wallet
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          placeholder="Write your memory here..."
          rows={5}
          style={{ width: "100%", padding: "10px" }}
        />
        <button type="submit" disabled={isLoading || !isConnected}>
          {isLoading ? "Minting..." : "Mint Memory on Base"}
        </button>
      </form>

      {isSuccess && txHash && (
        <div>
          <p>Memory minted! Transaction Hash:</p>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txHash}
          </a>
        </div>
      )}

      <p>{status}</p>

      {/* Farcaster Fram mint button */}
      <button onClick={handleFrameMint} disabled={!isConnected || !memory}>
        Mint via Frame
      </button>
    </div>
  );
}
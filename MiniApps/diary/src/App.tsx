import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbi } from "viem";
import "./index.css";


const contractAddress = "0x048f633DA5Fe4945290C2e71b0D404d77B67BA14"; //Put the contract's address here
const contractAbi = parseAbi([
  "function mintMemory(string memory _memory) public",
  "function getMemories(address _user) public view returns (string[] memory)",
]);

export default function App() {
  const [memory, setMemory] = useState<string>("");
  const { address, isConnected } = useAccount(); // connection status and the address of wallet
  const { connect, connectors } = useConnect(); // For Connecting wallet
  const { disconnect } = useDisconnect(); // For disconnecting 
  const { writeContract, data: txHash } = useWriteContract(); // For calling the contract
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  }); //Transaction's status

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    // Callin minMemory Function of the contract
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "mintMemory",
      args: [memory],
    });
  };

  return (
    <div className="app">
      <h1>Diary MiniApp</h1>

      {/* connect and disconnect wallet */}
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

      {/* The form to write Your memory here*/}
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

      {/* Showing transaction hash */}
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
    </div>
  );
}

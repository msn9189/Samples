import React, { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useReadContract,
} from "wagmi";
import { base } from "wagmi/chains";
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

// Contract details (Address and ABI)
const CONTRACT_ADDRESS = "0x5df26eAa1753cf24Ead918b3372Be1f0C517dDE9"; // Smart contract address on Base network
const CONTRACT_ABI = parseAbi([
  "function mintDiary(string memory ipfsHash) public returns (uint256)", // Function to mint a diary NFT
  "event DiaryMinted(uint256 indexed tokenId, address indexed recipient, string ipfsHash)", // Event emitted on minting
  "function tokenIds(uint256 tokenId) public view returns (uint256)", // Function to get token IDs
  "function balanceOf(address owner) public view returns (uint256)",
]);

export default function App() {
  // --- Local component state
  const [memory, setMemory] = useState<string>(""); // State to store user's memory input
  const [status, setStatus] = useState<string>(""); // State to display status messages to user
  const [isSending, setIsSending] = useState(false); // State to track if a transaction is being sent

  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // State to store generated image
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // State to track image generation

  // --- wagmi wallet connection hooks
  const { address, isConnected } = useAccount(); // Hook to get wallet address and connection status
  const { connect, connectors } = useConnect(); // Hook to handle wallet connection
  const { disconnect } = useDisconnect(); // Hook to disconnect wallet
  const { switchChain } = useSwitchChain();

  const [memoryCount, setMemoryCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [showMemoriesPage, setShowMemoriesPage] = useState(false);

  // Contract write hook
  const writeResult = useWriteContract(); // Hook to interact with the smart contract
  const writeContract = writeResult.writeContract; // Function to trigger contract function call
  const txHash = writeResult.data as string | undefined; // Transaction hash from the contract call

  // wait for tx receipt
  const { isLoading: waitingForReceipt, isSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash as any,
    }); // Wait for transaction receipt using the hash

    const { data: balance } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && isConnected,
      },
    });
  // Farcaster Miniapp initialization
  useEffect(() => {
    (async () => {
      try {
        if (!sdk?.actions?.ready) return; // Check if sdk.actions.ready is available

        // Notify Farcaster the miniapp is ready
        await sdk.actions.ready({
          image:
            import.meta.env.VITE_FRAME_IMAGE_URL ||
            "https://diaryminiapp.vercel.app/DiaryLogo.jpg", // Image URL for the miniapp frame
          postUrl: window.location.href, // URL where the post will be linked
        });

        console.log("Farcaster sdk.actions.ready() called successfully"); // Log success
      } catch (err) {
        console.error("sdk.actions.ready() failed:", err); // Log any errors
      }
    })();
  }, []); // Run only once after component mounts

  // pin text to IPFS using server API
  const pinToPinata = async (text: string) => {
    try {
      const resp = await fetch("/api/pinToIpfs", {
        method: "POST", // HTTP method for the request
        headers: { "Content-Type": "application/json" }, // Set content type
        body: JSON.stringify({ memory: text }), // Send memory text as JSON
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("Pin API error:", data); // Log error if response is not OK
        return null;
      }
      return data.IpfsHash; // Return the IPFS hash (CID) from Pinata
    } catch (err) {
      console.error("Pin API request failed:", err); // Log any fetch errors
      return null;
    }
  };

  // generate image based on memory text
  const generateImageFromMemory = async (text: string) => {
    try {
      setIsGeneratingImage(true);
      setStatus("Generating your memory image...");

      const resp = await fetch("/api/generateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: text }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error("Image generation API error:", data);
        return null;
      }

      setGeneratedImage(data.image);
      return data.image;
    } catch (err) {
      console.error("Image generation request failed:", err);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (!memory) return setStatus("Write something first"); // Check if memory is empty

    // Connect Wallet if not connected
    if (!isConnected) {
      try {
        // Prefer Farcaster Frame connector when available
        const preferred =
          connectors.find((c) => c.id === "frame") ?? connectors[0];
        await connect({ connector: preferred, chainId: base.id }); // Attempt to connect wallet on Base
      } catch (err: any) {
        return setStatus("Please connect your wallet."); // Show error if connection fails
      }
    }

    // Step 1: Generate image from memory
    setStatus("Generating your memory image..."); // Update status
    const image = await generateImageFromMemory(memory); // Generate image from memory
    if (!image) return setStatus("Image generation failed"); // Handle image generation failure

    // Step 2: Pin to IPFS
    setStatus("Pinning to IPFS..."); // Update status
    const cid = await pinToPinata(memory); // Pin memory to IPFS
    if (!cid) return setStatus("Pin failed"); // Handle pinning failure

    const payload = cid.startsWith("ipfs://") ? cid : `ipfs://${cid}`; // Format CID

    // Step 3: Call smart contract
    setStatus("Sending transaction..."); // Update status
    try {
      setIsSending(true); // Set pending flag

      // Ensure wallet is on Base before sending tx
      try {
        await switchChain({ chainId: base.id });
      } catch (e) {
        // ignore if already on Base or switch unsupported; passing chainId below will prompt
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mintDiary",
        args: [payload], // Pass IPFS hash to contract
        chainId: base.id,
      } as any);

      setStatus("Transaction sent, waiting for receipt..."); // Update status
    } catch (err: any) {
      console.error("writeContract failed:", err); // Log contract call error
      setIsSending(false); // Reset sending flag
      setStatus(`Error: ${err?.message ?? String(err)}`); // Show error message
    }
  };

  // when receipt is confirmed, handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setIsSending(false); // Reset sending flag
      setStatus("Memory minted successfully!"); // Update status on success
    }
  }, [isSuccess]); // Run when isSuccess changes

  // Render UI
  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-name">Your Miniapp Name</h1>
        <p className="app-creator">by Creator Name</p>
      </div>

      <div className="main-content">
        {/* Wallet connection section */}
        <div className="wallet-section">
          {isConnected ? (
            <div className="wallet-connected">
              <div className="wallet-info">
                <div className="wallet-status">
                  <span className="status-dot connected"></span>
                  <span className="status-text">Connected</span>
                </div>
                <div className="wallet-address">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="wallet-disconnected">
              <div className="wallet-prompt">
                <span className="wallet-icon">🔗</span>
                <span>Connect your wallet to mint memories</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    if (isConnected) await disconnect();
                    const injectedC = connectors.find(
                      (c) => c.id === "injected"
                    );
                    const wcC = connectors.find(
                      (c) => c.id === "walletConnect"
                    );
                    const preferred = injectedC ?? wcC ?? connectors[0];
                    await connect({ connector: preferred, chainId: base.id });
                  } catch (err: any) {
                    setStatus(err?.message ?? "Failed to connect");
                  }
                }}
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Status messages */}
        {status && (
          <div
            className={`status-message ${isSending || waitingForReceipt ? "loading" : isSuccess ? "success" : "info"}`}
          >
            <div className="status-content">
              {isSending || waitingForReceipt ? (
                <div className="loading-spinner"></div>
              ) : isSuccess ? (
                <span className="status-icon">✅</span>
              ) : (
                <span className="status-icon">ℹ️</span>
              )}
              <span>{status}</span>
            </div>
          </div>
        )}
        
        
        {/* Profile Card */}
        {
          isConnected && (
            <div className="profile-card">
              <div className="profile-info" onClick={handleProfileClick}>
                <img
                  src={profileImage || "/DiaryLogo.jpg"}
                  alt="Profile"
                  className="profile-picture"
                />
                <div className="profile-details">
                  <div className="profile-name">
                    {userName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </div>
                </div>
              </div>
              <div className="profile-memories">
                <div className="memories-label">Memories</div>
                <div className="memories-count">{memoryCount}</div>
                <div className="memories-label">number of minted</div>
              </div>
            </div>
          )}



        {/* Memory input form */}
        <form onSubmit={handleSubmit} className="memory-form">
          <div className="form-group">
            <label htmlFor="memory" className="form-label">
              Share a Memory
            </label>
            <textarea
              id="memory"
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="What's on your mind? Share a moment, a thought, or a memory you'd like to preserve forever..."
              rows={6}
              className="memory-textarea"
              disabled={isSending || waitingForReceipt}
            />
            <div className="character-count">{memory.length} characters</div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-large ${isSending || waitingForReceipt || isGeneratingImage ? "loading" : ""}`}
            disabled={
              isSending ||
              waitingForReceipt ||
              isGeneratingImage ||
              !isConnected ||
              !memory.trim()
            }
          >
            {isGeneratingImage ? (
              <>
                <div className="btn-spinner"></div>
                Creating Your Image...
              </>
            ) : isSending || waitingForReceipt ? (
              <>
                <div className="btn-spinner"></div>
                Minting Memory...
              </>
            ) : (
              <>
                <span className="btn-icon">🎨</span>
                Create & Mint Memory
              </>
            )}
          </button>
        </form>

        {/* Success section */}
        {isSuccess && txHash && (
          <div className="success-section">
            <div className="success-card">
              <div className="success-header">
                <span className="success-icon">🎉</span>
                <h3>Memory Minted Successfully!</h3>
              </div>
              <p className="success-description">
                Your memory has been preserved as an NFT on the Base network.
              </p>

              {/* Generated Image Display */}
              {generatedImage && (
                <div className="generated-image-section">
                  <h4>Your Memory Image:</h4>
                  <div className="image-container">
                    <img
                      src={generatedImage}
                      alt="Generated memory image"
                      className="generated-image"
                    />
                  </div>
                  <div className="image-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = generatedImage;
                        link.download = `memory-${Date.now()}.png`;
                        link.click();
                      }}
                    >
                      📥 Download Image
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedImage);
                        setStatus("Image copied to clipboard!");
                      }}
                    >
                      📋 Copy Image
                    </button>
                  </div>
                </div>
              )}

              <div className="transaction-info">
                <span className="transaction-label">Transaction Hash:</span>
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="transaction-link"
                >
                  {txHash}
                  <span className="external-link">↗</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

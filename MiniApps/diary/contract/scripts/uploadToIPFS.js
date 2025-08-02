// Import Pinata SDK for IPFS uploads.
const { PinataSDK } = require("pinata-sdk");

async function uploadToIPFS(memoryText, pinataApiKey, pinataSecretApiKey) {
  // Initialize Pinata client with project credentials.
  const pinata = new PinataSDK({
    pinataApiKey: pinataApiKey,
    pinataSecretApiKey: pinataSecretApiKey,
  });

  // Create metadata object for NFT.
  const metadata = {
    name: "Diary Entry",
    description: "A personal memory",
    content: memoryText,
    data: new Date().toISOString(),
  };

  // Upload metadata to IPFS and return CID.
  const result = await pinata.pinJSONTOIPFS(metadata);
  return result.IpfsHash;
}

// Export function for use in other scripts.
module.exports = { uploadToIPFS };
